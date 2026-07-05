<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$options = require(__DIR__ . '/teacher_intake_config.php');

const PQPTI_MIN_FORM_SECONDS = 4;
const PQPTI_MAX_FORM_SECONDS = 7200;
const PQPTI_SESSION_COOLDOWN_SECONDS = 60;

function pqpti_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpti_trim(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqpti_limit(string $value, int $limit): string {
    return core_text::substr(trim($value), 0, $limit);
}

function pqpti_array_param(string $name): array {
    $values = optional_param_array($name, [], PARAM_TEXT);
    $clean = [];
    foreach ($values as $value) {
        $value = trim((string)$value);
        if ($value !== '' && !in_array($value, $clean, true)) {
            $clean[] = $value;
        }
    }
    return $clean;
}

function pqpti_label(string $value, array $options): string {
    return (string)($options[$value] ?? $value);
}

function pqpti_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = pqpti_label((string)$value, $options);
    }
    return $labels;
}

function pqpti_value(array $form, string $name): string {
    $value = $form[$name] ?? '';
    return is_array($value) ? implode(', ', $value) : (string)$value;
}

function pqpti_selected(array $form, string $name, string $value): string {
    return pqpti_value($form, $name) === $value ? ' selected' : '';
}

function pqpti_checked(array $form, string $name, string $value): string {
    $selected = $form[$name] ?? [];
    return is_array($selected) && in_array($value, array_map('strval', $selected), true) ? ' checked' : '';
}

function pqpti_field_label(string $name): string {
    $labels = [
        'teacher_name' => 'Teacher/tutor name',
        'email' => 'Email',
        'phone' => 'Phone / WhatsApp',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary teaching language',
        'courses' => 'Courses/services',
        'levels' => 'Levels',
        'experience' => 'Teaching experience',
        'bio' => 'Public profile summary',
        'availability' => 'Availability',
        'desired_services' => 'Desired services',
        'form_security' => 'Form security',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqpti_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqpti-error">' . s(pqpti_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqpti_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $html = '<select class="pqpti-input" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . pqpti_selected($form, $name, (string)$value) . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>' . pqpti_error($errors, $name);
}

function pqpti_checkboxes(string $name, array $options, array $form, array $errors): string {
    $html = '<div class="pqpti-choicegrid">';
    foreach ($options as $value => $label) {
        $html .= '<label class="pqpti-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . pqpti_checked($form, $name, (string)$value) . '><span>' . s((string)$label) . '</span></label>';
    }
    return $html . '</div>' . pqpti_error($errors, $name);
}

function pqpti_slot_summary(array $slots, array $days, array $hours): string {
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day !== '' && $hour !== '') {
            $byday[$day][] = pqpti_label($hour, $hours);
        }
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = pqpti_label($day, $days) . ': ' . implode(', ', $dayhours);
    }
    return implode('; ', $parts);
}

function pqpti_security_token(int $formtime): string {
    global $CFG;
    $secret = !empty($CFG->passwordsaltmain) ? (string)$CFG->passwordsaltmain : (string)$CFG->wwwroot;
    return hash_hmac('sha256', $formtime . '|' . sesskey(), $secret);
}

function pqpti_contact_ok(string $email, string $phone): bool {
    if ($email !== '' && validate_email($email)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $phone);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = (string)$consumercontext->consumername;
$context = context_system::instance();

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/public_teacher_intake.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Teacher Application');
$PAGE->set_heading($brandname . ' Teacher Application');
$PAGE->add_body_class('pqh-public-teacher-intake-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}
@header('X-Robots-Tag: noindex, nofollow', true);
@header('Referrer-Policy: strict-origin-when-cross-origin', true);

$ready = pqpti_table_exists('local_prequran_teacher_intake_request');
$message = '';
$errors = [];
$now = time();
if (empty($SESSION->pqpti_formtime) || !is_int($SESSION->pqpti_formtime) || $SESSION->pqpti_formtime < $now - PQPTI_MAX_FORM_SECONDS) {
    $SESSION->pqpti_formtime = $now;
}
$formtime = (int)$SESSION->pqpti_formtime;
$formtoken = pqpti_security_token($formtime);
$form = [
    'teacher_name' => '',
    'email' => '',
    'phone' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => 'Africa/Nairobi',
    'primary_language' => '',
    'other_languages' => [],
    'courses' => [],
    'levels' => [],
    'experience' => '',
    'education' => '',
    'teaching_style' => '',
    'bio' => '',
    'slots' => [],
    'desired_services' => '',
    'notes' => '',
];

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $postedformtime = optional_param('formtime', 0, PARAM_INT);
    $postedtoken = optional_param('formtoken', '', PARAM_ALPHANUMEXT);
    $honeypot = optional_param('website', '', PARAM_TEXT);
    foreach ($form as $field => $default) {
        $form[$field] = is_array($default) ? pqpti_array_param($field) : pqpti_limit(pqpti_trim($field, (string)$default), in_array($field, ['experience', 'education', 'teaching_style', 'bio', 'desired_services', 'notes'], true) ? 4000 : 255);
    }

    $elapsed = time() - $postedformtime;
    if ($honeypot !== '') {
        $errors['form_security'] = 'The request could not be accepted. Please reload the form and try again.';
    }
    if ($postedformtime <= 0 || !hash_equals(pqpti_security_token($postedformtime), $postedtoken)) {
        $errors['form_security'] = 'The form security token expired. Please reload the form and try again.';
    } else if ($elapsed < PQPTI_MIN_FORM_SECONDS || $elapsed > PQPTI_MAX_FORM_SECONDS) {
        $errors['form_security'] = 'Please reload the form and submit again.';
    }
    if (!empty($SESSION->pqpti_last_submit) && (time() - (int)$SESSION->pqpti_last_submit) < PQPTI_SESSION_COOLDOWN_SECONDS) {
        $errors['form_security'] = 'Please wait a minute before submitting another request.';
    }

    foreach ([
        'teacher_name' => 'Please enter your teacher/tutor name.',
        'country' => 'Please select your country.',
        'city' => 'Please select your city.',
        'timezone' => 'Please select your time zone.',
        'primary_language' => 'Please select your primary teaching language.',
        'experience' => 'Please summarize your teaching experience.',
        'bio' => 'Please write a short public profile summary.',
    ] as $field => $error) {
        if (pqpti_value($form, $field) === '') {
            $errors[$field] = $error;
        }
    }
    if (!pqpti_contact_ok(pqpti_value($form, 'email'), pqpti_value($form, 'phone'))) {
        $errors['email'] = 'Enter a valid email address or phone/WhatsApp number.';
    }
    if (!$form['courses']) {
        $errors['courses'] = 'Select at least one course or service.';
    }
    if (!$form['levels']) {
        $errors['levels'] = 'Select at least one level.';
    }
    if (!$form['slots']) {
        $errors['availability'] = 'Select at least one weekly availability time.';
    }
    if (pqpti_value($form, 'city') === 'Other' && pqpti_value($form, 'city_other') === '') {
        $errors['city_other'] = 'Please enter the city name.';
    }

    if (!$errors) {
        $slots = [];
        foreach ($form['slots'] as $slot) {
            [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
            if ($day !== '' && $hour !== '') {
                $slots[] = [
                    'day' => $day,
                    'time' => $hour,
                    'day_label' => pqpti_label($day, $options['availability_days'] ?? []),
                    'time_label' => pqpti_label($hour, $options['availability_time_windows'] ?? []),
                ];
            }
        }
        $city = pqpti_value($form, 'city') === 'Other' ? pqpti_value($form, 'city_other') : pqpti_value($form, 'city');
        $requestid = (int)$DB->insert_record('local_prequran_teacher_intake_request', (object)[
            'consumerid' => (int)$consumercontext->consumerid,
            'workspaceid' => (int)$consumercontext->workspaceid,
            'teacher_name' => pqpti_value($form, 'teacher_name'),
            'email' => pqpti_value($form, 'email'),
            'phone' => pqpti_value($form, 'phone'),
            'country' => pqpti_value($form, 'country'),
            'city' => $city,
            'timezone' => pqpti_value($form, 'timezone'),
            'primary_language' => pqpti_value($form, 'primary_language'),
            'other_languages' => implode(', ', pqpti_labels($form['other_languages'], $options['other_languages'] ?? [])),
            'courses' => implode(', ', pqpti_labels($form['courses'], $options['course_types'] ?? [])),
            'levels' => implode(', ', pqpti_labels($form['levels'], $options['current_levels'] ?? [])),
            'experience' => pqpti_value($form, 'experience'),
            'education' => pqpti_value($form, 'education'),
            'teaching_style' => pqpti_value($form, 'teaching_style'),
            'bio' => pqpti_value($form, 'bio'),
            'availability_json' => json_encode(['timezone' => pqpti_value($form, 'timezone'), 'slots' => $slots], JSON_UNESCAPED_SLASHES),
            'availability_summary' => pqpti_slot_summary($form['slots'], $options['availability_days'] ?? [], $options['availability_time_windows'] ?? []),
            'desired_services' => pqpti_value($form, 'desired_services'),
            'notes' => pqpti_value($form, 'notes'),
            'status' => 'new',
            'converted_userid' => 0,
            'converted_profileid' => 0,
            'admin_notes' => '',
            'reviewedby' => 0,
            'reviewedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        $SESSION->pqpti_last_submit = $now;
        $SESSION->pqpti_formtime = $now;
        redirect(new moodle_url('/local/hubredirect/public_teacher_intake.php', ['submitted' => 1, 'requestid' => $requestid] + $consumerparams));
    }
}

if (optional_param('submitted', 0, PARAM_BOOL)) {
    $message = 'Thank you. Your teacher application was received and ' . $brandname . ' will review it.';
}

echo $OUTPUT->header();
?>
<style>
body.pqh-public-teacher-intake-page header,body.pqh-public-teacher-intake-page footer,body.pqh-public-teacher-intake-page nav.navbar,body.pqh-public-teacher-intake-page #page-header,body.pqh-public-teacher-intake-page #page-footer,body.pqh-public-teacher-intake-page .drawer,body.pqh-public-teacher-intake-page .drawer-toggles,body.pqh-public-teacher-intake-page .block-region,body.pqh-public-teacher-intake-page [data-region="drawer"],body.pqh-public-teacher-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-public-teacher-intake-page #page,body.pqh-public-teacher-intake-page #page-content,body.pqh-public-teacher-intake-page #region-main,body.pqh-public-teacher-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpti-shell{min-height:100vh;padding:0 0 56px;background:linear-gradient(180deg,#f6fbff 0,#fffaf0 100%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqpti-wrap{max-width:1120px;margin:0 auto;padding:18px}
.pqpti-hero{min-height:300px;padding:46px 34px;margin-bottom:18px;border-radius:8px;background:linear-gradient(90deg,rgba(9,37,32,.94),rgba(16,74,60,.72)),url("/local/ehelhome/pix/landing-welcome.jpg") center/cover no-repeat;color:#fff}
.pqpti-brand{display:inline-flex;margin-bottom:13px;color:#ffd88c;font-size:13px;font-weight:950;text-transform:uppercase}
.pqpti-title{max-width:820px;margin:0;font-size:44px;line-height:1.05;font-weight:950;color:#fff;letter-spacing:0}
.pqpti-sub{max-width:780px;margin:13px 0 0;color:rgba(255,255,255,.9);font-size:17px;font-weight:800;line-height:1.58}
.pqpti-panel{padding:24px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;box-shadow:0 14px 34px rgba(23,48,68,.08)}
.pqpti-panel h2{margin:0 0 15px;font-size:24px;line-height:1.1;font-weight:950;color:#241b24}
.pqpti-panel h3{display:inline-flex;margin:20px 0 12px;padding:7px 11px;border-radius:999px;background:#fff3e6;border:1px solid rgba(217,154,38,.22);font-size:15px;font-weight:950;color:#6f4e32}
.pqpti-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.pqpti-field{display:grid;gap:7px;margin-bottom:12px}.pqpti-field label{font-size:13px;font-weight:950;color:#234457}
.pqpti-input,.pqpti-textarea{width:100%;min-height:46px;border:2px solid #d9e7f7;border-radius:8px;padding:10px 12px;font:800 15px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#fff;color:#173044}
.pqpti-textarea{min-height:112px;line-height:1.45}.pqpti-input:focus,.pqpti-textarea:focus{outline:0;border-color:#7cc7ff;box-shadow:0 0 0 4px rgba(34,193,232,.14)}
.pqpti-choicegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pqpti-choice{display:flex;gap:8px;align-items:center;min-height:40px;padding:8px 10px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff;font-size:13px;font-weight:850}.pqpti-choice input{width:18px;height:18px;accent-color:#2f6f4e}
.pqpti-calendar{overflow:auto;border:2px solid #d9e7f7;border-radius:8px;background:#fff}.pqpti-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:840px}.pqpti-calendar th,.pqpti-calendar td{border-bottom:1px solid rgba(15,34,48,.1);border-right:1px solid rgba(15,34,48,.08);padding:9px;text-align:center;font-weight:900}.pqpti-calendar th{background:#f0fbff;color:#234457;font-size:12px}.pqpti-calendar td:first-child{text-align:left;background:#fffdf6}.pqpti-slot{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#eef7ff}.pqpti-slot input{width:18px;height:18px;accent-color:#d99a26}
.pqpti-alert{padding:14px 16px;border-radius:8px;margin-bottom:14px;font-weight:950}.pqpti-alert--ok{background:#edf9ef;color:#245c35}.pqpti-alert--bad{background:#fff0ed;color:#883526}.pqpti-alert ul{margin:8px 0 0;padding-left:20px}
.pqpti-error{font-size:12px;font-weight:950;color:#a33a2c}.pqpti-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:0;border-radius:8px;background:#d99a26;color:#1b1409!important;text-decoration:none;font-size:16px;font-weight:950;cursor:pointer}.pqpti-empty{padding:18px;border:2px dashed rgba(15,34,48,.2);border-radius:8px;color:#516a7a;font-weight:950;background:#fffdf6}.pqpti-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
@media(max-width:760px){.pqpti-grid,.pqpti-choicegrid{grid-template-columns:1fr}.pqpti-title{font-size:32px}.pqpti-wrap{padding:12px}.pqpti-hero{padding:26px 18px}.pqpti-panel{padding:18px}}
</style>
<main class="pqpti-shell">
  <div class="pqpti-wrap">
    <section class="pqpti-hero">
      <div class="pqpti-brand"><?php echo s($brandname); ?></div>
      <h1 class="pqpti-title">Teacher / Tutor Application</h1>
      <p class="pqpti-sub">Share your teaching background, services, profile summary, and weekly availability. The team will review your application before a public marketplace profile or workspace access is created.</p>
    </section>

    <?php if ($message !== ''): ?><div class="pqpti-alert pqpti-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($errors): ?>
      <div class="pqpti-alert pqpti-alert--bad">
        Please fix the highlighted fields below.
        <ul><?php foreach ($errors as $field => $msg): ?><li><?php echo s(pqpti_field_label((string)$field) . ': ' . $msg); ?></li><?php endforeach; ?></ul>
      </div>
    <?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqpti-panel"><div class="pqpti-empty">The teacher application form is not ready yet. Please contact <?php echo s($brandname); ?> support.</div></section>
    <?php else: ?>
      <section class="pqpti-panel">
        <h2>Application Details</h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <input type="hidden" name="formtime" value="<?php echo (int)$formtime; ?>">
          <input type="hidden" name="formtoken" value="<?php echo s($formtoken); ?>">
          <div class="pqpti-trap" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>

          <h3>Contact</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Teacher/tutor name</label><input class="pqpti-input" name="teacher_name" value="<?php echo s(pqpti_value($form, 'teacher_name')); ?>"><?php echo pqpti_error($errors, 'teacher_name'); ?></div>
            <div class="pqpti-field"><label>Email</label><input class="pqpti-input" name="email" value="<?php echo s(pqpti_value($form, 'email')); ?>"><?php echo pqpti_error($errors, 'email'); ?></div>
            <div class="pqpti-field"><label>Phone / WhatsApp</label><input class="pqpti-input" name="phone" value="<?php echo s(pqpti_value($form, 'phone')); ?>"></div>
            <div class="pqpti-field"><label>Primary teaching language</label><?php echo pqpti_select('primary_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
          </div>

          <h3>Location</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Country</label><?php echo pqpti_select('country', $options['countries'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>City</label><?php echo pqpti_select('city', $options['cities'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>City not listed</label><input class="pqpti-input" name="city_other" value="<?php echo s(pqpti_value($form, 'city_other')); ?>"><?php echo pqpti_error($errors, 'city_other'); ?></div>
            <div class="pqpti-field"><label>Time zone</label><?php echo pqpti_select('timezone', $options['timezones'] ?? [], $form, $errors); ?></div>
          </div>

          <h3>Teaching Services</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Courses/services</label><?php echo pqpti_checkboxes('courses', $options['course_types'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Levels</label><?php echo pqpti_checkboxes('levels', $options['current_levels'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Other languages</label><?php echo pqpti_checkboxes('other_languages', $options['other_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Desired services</label><textarea class="pqpti-textarea" name="desired_services" placeholder="Tutoring, group classes, institution workspace, marketplace profile, live sessions, or other services"><?php echo s(pqpti_value($form, 'desired_services')); ?></textarea></div>
          </div>

          <h3>Profile</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Teaching experience</label><textarea class="pqpti-textarea" name="experience"><?php echo s(pqpti_value($form, 'experience')); ?></textarea><?php echo pqpti_error($errors, 'experience'); ?></div>
            <div class="pqpti-field"><label>Education / qualifications</label><textarea class="pqpti-textarea" name="education"><?php echo s(pqpti_value($form, 'education')); ?></textarea></div>
            <div class="pqpti-field"><label>Teaching style</label><textarea class="pqpti-textarea" name="teaching_style"><?php echo s(pqpti_value($form, 'teaching_style')); ?></textarea></div>
            <div class="pqpti-field"><label>Public profile summary</label><textarea class="pqpti-textarea" name="bio"><?php echo s(pqpti_value($form, 'bio')); ?></textarea><?php echo pqpti_error($errors, 'bio'); ?></div>
          </div>

          <h3>Weekly Availability</h3>
          <div class="pqpti-field">
            <label>Select all recurring times that could work</label>
            <div class="pqpti-calendar">
              <table>
                <thead><tr><th>Day</th><?php foreach (($options['availability_time_windows'] ?? []) as $hour => $label): ?><th><?php echo s((string)$label); ?></th><?php endforeach; ?></tr></thead>
                <tbody>
                  <?php foreach (($options['availability_days'] ?? []) as $day => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($options['availability_time_windows'] ?? []) as $hour => $hourlabel): $slot = (string)$day . '|' . (string)$hour; ?>
                        <td><label class="pqpti-slot" title="<?php echo s((string)$daylabel . ' ' . (string)$hourlabel); ?>"><input type="checkbox" name="slots[]" value="<?php echo s($slot); ?>"<?php echo pqpti_checked($form, 'slots', $slot); ?>></label></td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqpti_error($errors, 'availability'); ?>
          </div>

          <h3>Additional Notes</h3>
          <div class="pqpti-field"><label>Anything else the review team should know?</label><textarea class="pqpti-textarea" name="notes"><?php echo s(pqpti_value($form, 'notes')); ?></textarea></div>

          <button class="pqpti-btn" type="submit">Submit teacher application</button>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
