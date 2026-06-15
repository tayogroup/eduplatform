<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');

$options = require(__DIR__ . '/student_intake_config.php');

const PQPIR_MIN_FORM_SECONDS = 4;
const PQPIR_MAX_FORM_SECONDS = 7200;
const PQPIR_SESSION_COOLDOWN_SECONDS = 60;
const PQPIR_CONTACT_WINDOW_SECONDS = 3600;
const PQPIR_CONTACT_WINDOW_LIMIT = 3;

function pqpir_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpir_table_has_column(string $table, string $column): bool {
    global $DB;
    if (!pqpir_table_exists($table)) {
        return false;
    }
    $columns = $DB->get_columns($table);
    return isset($columns[$column]);
}

function pqpir_trim(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqpir_contact(string $name): string {
    return core_text::substr(trim(optional_param($name, '', PARAM_TEXT)), 0, 255);
}

function pqpir_param_array(string $name): array {
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

function pqpir_label(string $value, array $options): string {
    return (string)($options[$value] ?? $value);
}

function pqpir_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = pqpir_label((string)$value, $options);
    }
    return $labels;
}

function pqpir_field_label(string $name): string {
    $labels = [
        'form_security' => 'Form security',
        'parent_name' => 'Parent/guardian name',
        'parent_email' => 'Parent/guardian email or phone',
        'parent_phone' => 'Parent phone / WhatsApp',
        'student_firstname' => 'Student first name',
        'student_lastname' => 'Student last name',
        'student_display_name' => 'Student display name',
        'student_email' => 'Student email or phone',
        'age_years' => 'Age',
        'gender' => 'Gender',
        'special_needs' => 'Special Needs',
        'course_type' => 'Course',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary language',
        'current_level' => 'Current level',
        'learning_base' => 'Base of learning',
        'session_count' => 'Number of sessions',
        'slots' => 'Preferred live-session number of sessions and hours',
        'live_class_consent' => 'Live class consent',
        'consent_notes' => 'Consent notes/comment',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqpir_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqpir-error">' . s(pqpir_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqpir_limit_text(string $value, int $limit): string {
    return core_text::substr(trim($value), 0, $limit);
}

function pqpir_contact_ok(string $contact): bool {
    if ($contact === '') {
        return true;
    }
    if (validate_email($contact)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $contact);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqpir_contact_key(string $contact): string {
    $contact = core_text::strtolower(trim($contact));
    if (validate_email($contact)) {
        return $contact;
    }
    return (string)preg_replace('/\D+/', '', $contact);
}

function pqpir_contact_keys(array $contacts): array {
    $keys = [];
    foreach ($contacts as $contact) {
        $raw = core_text::strtolower(trim((string)$contact));
        if ($raw !== '') {
            $keys[] = $raw;
        }
        $normalised = pqpir_contact_key($raw);
        if ($normalised !== '') {
            $keys[] = $normalised;
        }
    }
    return array_values(array_unique($keys));
}

function pqpir_security_token(int $formtime): string {
    global $CFG;
    $secret = !empty($CFG->passwordsaltmain) ? (string)$CFG->passwordsaltmain : (string)$CFG->wwwroot;
    return hash_hmac('sha256', $formtime . '|' . sesskey(), $secret);
}

function pqpir_security_audit(string $action, array $details = []): void {
    global $DB;
    if (!pqpir_table_exists('local_prequran_live_audit')) {
        return;
    }
    $details['ip_hash'] = hash('sha256', getremoteaddr() ?: 'unknown');
    $details['ua_hash'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => 0,
        'action' => $action,
        'targettype' => 'public_intake',
        'targetid' => 0,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqpir_contact_submission_count(array $contacts, int $since): int {
    global $DB;
    $keys = pqpir_contact_keys($contacts);
    if (!$keys) {
        return 0;
    }
    $likes = [];
    $params = ['since' => $since];
    foreach ($keys as $index => $key) {
        $parentemailparam = 'contact_parent_email_' . $index;
        $parentphoneparam = 'contact_parent_phone_' . $index;
        $studentemailparam = 'contact_student_email_' . $index;
        $likes[] = "(LOWER(parent_email) = :{$parentemailparam} OR LOWER(parent_phone) = :{$parentphoneparam} OR LOWER(student_email) = :{$studentemailparam})";
        $params[$parentemailparam] = $key;
        $params[$parentphoneparam] = $key;
        $params[$studentemailparam] = $key;
    }
    return (int)$DB->count_records_select(
        'local_prequran_intake_request',
        'timecreated >= :since AND (' . implode(' OR ', $likes) . ')',
        $params
    );
}

function pqpir_value(array $form, string $name): string {
    if (!isset($form[$name])) {
        return '';
    }
    return is_array($form[$name]) ? implode(', ', array_map('strval', $form[$name])) : (string)$form[$name];
}

function pqpir_selected(array $form, string $name, string $value): string {
    return pqpir_value($form, $name) === $value ? ' selected' : '';
}

function pqpir_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqpir_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $html = '<select class="pqpir-input" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . pqpir_selected($form, $name, (string)$value) . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>' . pqpir_error($errors, $name);
}

function pqpir_multi_select(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqpir-input pqpir-multi" name="' . s($name) . '[]" multiple size="5">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>' . pqpir_error($errors, $name);
}

function pqpir_slot_summary(array $slots, array $days, array $hours, int $sessioncount = 0): string {
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day === '' || $hour === '') {
            continue;
        }
        $byday[$day][] = pqpir_label($hour, $hours);
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = pqpir_label($day, $days) . ': ' . implode(', ', $dayhours);
    }
    $summary = implode('; ', $parts);
    if ($sessioncount > 0) {
        $prefix = 'Requested sessions per week: ' . $sessioncount;
        return $summary !== '' ? $prefix . '; ' . $summary : $prefix;
    }
    return $summary;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/public_intake.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Quraan Academy Prospective Student Inquiry');
$PAGE->set_heading('Quraan Academy Prospective Student Inquiry');
$PAGE->add_body_class('pqh-public-intake-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}
@header('X-Robots-Tag: noindex, nofollow', true);
@header('Referrer-Policy: strict-origin-when-cross-origin', true);

$ready = pqpir_table_exists('local_prequran_intake_request');
$message = '';
$errors = [];
$now = time();
if (empty($SESSION->pqpir_formtime) || !is_int($SESSION->pqpir_formtime) || $SESSION->pqpir_formtime < $now - PQPIR_MAX_FORM_SECONDS) {
    $SESSION->pqpir_formtime = $now;
}
$formtime = (int)$SESSION->pqpir_formtime;
$formtoken = pqpir_security_token($formtime);
$form = [
    'parent_name' => '',
    'parent_email' => '',
    'parent_phone' => '',
    'student_firstname' => '',
    'student_lastname' => '',
    'student_display_name' => '',
    'student_email' => '',
    'date_of_birth' => '',
    'age_years' => '',
    'gender' => '',
    'special_needs' => '',
    'course_type' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => 'Africa/Nairobi',
    'primary_language' => '',
    'other_languages' => [],
    'current_level' => '',
    'learning_base' => '',
    'session_count' => '1',
    'slots' => [],
    'parent_preferences' => '',
    'live_class_consent' => 0,
    'recording_consent' => 0,
    'consent_notes' => '',
];

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $postedformtime = optional_param('formtime', 0, PARAM_INT);
    $postedtoken = optional_param('formtoken', '', PARAM_ALPHANUMEXT);
    $honeypot = optional_param('website', '', PARAM_TEXT);
    $form = [
        'parent_name' => pqpir_limit_text(pqpir_trim('parent_name'), 255),
        'parent_email' => pqpir_contact('parent_email'),
        'parent_phone' => pqpir_contact('parent_phone'),
        'student_firstname' => pqpir_limit_text(pqpir_trim('student_firstname'), 100),
        'student_lastname' => pqpir_limit_text(pqpir_trim('student_lastname'), 100),
        'student_display_name' => pqpir_limit_text(pqpir_trim('student_display_name'), 255),
        'student_email' => pqpir_contact('student_email'),
        'date_of_birth' => pqpir_trim('date_of_birth'),
        'age_years' => (string)optional_param('age_years', 0, PARAM_INT),
        'gender' => pqpir_trim('gender'),
        'special_needs' => pqpir_trim('special_needs'),
        'course_type' => pqpir_trim('course_type'),
        'country' => pqpir_trim('country'),
        'city' => pqpir_trim('city'),
        'city_other' => pqpir_trim('city_other'),
        'timezone' => pqpir_trim('timezone', 'Africa/Nairobi'),
        'primary_language' => pqpir_trim('primary_language'),
        'other_languages' => pqpir_param_array('other_languages'),
        'current_level' => pqpir_trim('current_level'),
        'learning_base' => pqpir_trim('learning_base'),
        'session_count' => (string)optional_param('session_count', 1, PARAM_INT),
        'slots' => pqpir_param_array('slots'),
        'parent_preferences' => pqpir_limit_text(pqpir_trim('parent_preferences'), 4000),
        'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
        'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
        'consent_notes' => pqpir_limit_text(pqpir_trim('consent_notes'), 2000),
    ];

    $isadultstudent = (int)$form['age_years'] >= 18;

    $elapsed = time() - $postedformtime;
    if ($honeypot !== '') {
        $errors['form_security'] = 'The request could not be accepted. Please reload the form and try again.';
        pqpir_security_audit('public_intake_blocked_honeypot');
    }
    if ($postedformtime <= 0 || !hash_equals(pqpir_security_token($postedformtime), $postedtoken)) {
        $errors['form_security'] = 'The form security token expired. Please reload the form and try again.';
        pqpir_security_audit('public_intake_blocked_token');
    } else if ($elapsed < PQPIR_MIN_FORM_SECONDS || $elapsed > PQPIR_MAX_FORM_SECONDS) {
        $errors['form_security'] = 'Please reload the form and submit again.';
        pqpir_security_audit('public_intake_blocked_timing', ['elapsed' => $elapsed]);
    }
    if (!empty($SESSION->pqpir_last_submit) && (time() - (int)$SESSION->pqpir_last_submit) < PQPIR_SESSION_COOLDOWN_SECONDS) {
        $errors['form_security'] = 'Please wait a minute before submitting another request.';
        pqpir_security_audit('public_intake_blocked_session_rate');
    }

    foreach ([
        'student_firstname' => 'Please enter the student first name.',
        'student_lastname' => 'Please enter the student last name.',
        'age_years' => 'Please enter the student age.',
            'gender' => 'Please select the student gender.',
            'special_needs' => 'Please select Yes or No for Special Needs.',
            'course_type' => 'Please select the course.',
            'country' => 'Please select the country.',
        'city' => 'Please select the city.',
        'timezone' => 'Please select the time zone.',
        'primary_language' => 'Please select the primary language.',
        'current_level' => 'Please select the current level.',
        'learning_base' => 'Please select the base of learning.',
        'session_count' => 'Please select the number of weekly sessions.',
    ] as $field => $errormessage) {
        if (($field === 'age_years' && (int)$form[$field] <= 0) || ($field === 'session_count' && ((int)$form[$field] < 1 || (int)$form[$field] > 5)) || (!in_array($field, ['age_years', 'session_count'], true) && pqpir_value($form, $field) === '')) {
            $errors[$field] = $errormessage;
        }
    }
    if ($isadultstudent) {
        if (pqpir_value($form, 'student_email') === '') {
            $errors['student_email'] = 'Adult students must provide their own email address or phone number.';
        }
    } else {
        foreach ([
            'parent_name' => 'Please enter the parent/guardian name.',
        ] as $field => $errormessage) {
            if (pqpir_value($form, $field) === '') {
                $errors[$field] = $errormessage;
            }
        }
        if (pqpir_value($form, 'parent_phone') === '' && pqpir_value($form, 'parent_email') === '') {
            $errors['parent_phone'] = 'Please enter a parent/guardian phone, WhatsApp, or email contact.';
        }
    }
    foreach (['parent_email', 'parent_phone', 'student_email'] as $contactfield) {
        if (!pqpir_contact_ok(pqpir_value($form, $contactfield))) {
            $errors[$contactfield] = 'Enter a valid email address or phone number.';
        }
    }
    if (!in_array(pqpir_value($form, 'special_needs'), ['yes', 'no'], true)) {
        $errors['special_needs'] = 'Please select Yes or No for Special Needs.';
    }
    if (!array_key_exists(pqpir_value($form, 'course_type'), $options['course_types'] ?? [])) {
        $errors['course_type'] = 'Please select a valid course.';
    }
    if (!$form['slots']) {
        $errors['slots'] = 'Please select at least one preferred weekly live-session time.';
    }
    $validdays = array_keys($options['availability_days'] ?? []);
    $validhours = array_keys($options['availability_time_windows'] ?? []);
    foreach ($form['slots'] as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if (!in_array($day, $validdays, true) || !in_array($hour, $validhours, true)) {
            $errors['slots'] = 'Please select live-session times from the available calendar.';
            break;
        }
    }
    $countrycities = $options['country_cities'][$form['country']] ?? [];
    if ($form['country'] !== '' && $form['city'] !== '' && $form['city'] !== 'Other' && $countrycities && !array_key_exists($form['city'], $countrycities)) {
        $errors['city'] = 'Please select a city listed for the selected country, or choose Other city not listed.';
    }
    if ($form['city'] === 'Other' && pqpir_value($form, 'city_other') === '') {
        $errors['city_other'] = 'Please enter the city name.';
    }
    $countryzones = $options['country_timezones'][$form['country']] ?? [];
    if ($form['country'] !== '' && $form['timezone'] !== '' && $countryzones && !in_array($form['timezone'], $countryzones, true)) {
        $errors['timezone'] = 'Please select a time zone listed for the selected country.';
    }
    if (empty($form['live_class_consent'])) {
        $errors['live_class_consent'] = 'Live class consent is required before we can review the request.';
    }
    if (!$errors) {
        $recentcount = pqpir_contact_submission_count([
            pqpir_value($form, 'parent_email'),
            pqpir_value($form, 'parent_phone'),
            pqpir_value($form, 'student_email'),
        ], time() - PQPIR_CONTACT_WINDOW_SECONDS);
        if ($recentcount >= PQPIR_CONTACT_WINDOW_LIMIT) {
            $errors['form_security'] = 'We already received several recent requests with this contact information. Please wait before submitting another request.';
            pqpir_security_audit('public_intake_blocked_contact_rate', ['recent_count' => $recentcount]);
        }
    }

    if (!$errors) {
        $now = time();
        $slots = [];
        foreach ($form['slots'] as $slot) {
            [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
            if ($day === '' || $hour === '') {
                continue;
            }
            $slots[] = [
                'day' => $day,
                'time' => $hour,
                'day_label' => pqpir_label($day, $options['availability_days'] ?? []),
                'time_label' => pqpir_label($hour, $options['availability_time_windows'] ?? []),
            ];
        }
        $displayname = pqpir_value($form, 'student_display_name');
        if ($displayname === '') {
            $displayname = trim(pqpir_value($form, 'student_firstname') . ' ' . pqpir_value($form, 'student_lastname'));
        }
        $city = pqpir_value($form, 'city') === 'Other' ? pqpir_value($form, 'city_other') : pqpir_value($form, 'city');

        $requestrecord = (object)[
            'parent_name' => pqpir_value($form, 'parent_name'),
            'parent_email' => pqpir_value($form, 'parent_email'),
            'parent_phone' => pqpir_value($form, 'parent_phone'),
            'student_firstname' => pqpir_value($form, 'student_firstname'),
            'student_lastname' => pqpir_value($form, 'student_lastname'),
            'student_display_name' => $displayname,
            'student_email' => pqpir_value($form, 'student_email'),
            'date_of_birth' => pqpir_value($form, 'date_of_birth'),
            'age_years' => (int)$form['age_years'],
            'gender' => pqpir_value($form, 'gender'),
            'country' => pqpir_value($form, 'country'),
            'city' => $city,
            'timezone' => pqpir_value($form, 'timezone'),
            'primary_language' => pqpir_value($form, 'primary_language'),
            'other_languages' => implode(', ', pqpir_labels($form['other_languages'], $options['other_languages'] ?? [])),
            'current_level' => pqpir_value($form, 'current_level'),
            'learning_base' => pqpir_value($form, 'learning_base'),
            'availability_json' => json_encode(['timezone' => pqpir_value($form, 'timezone'), 'session_count' => (int)$form['session_count'], 'slots' => $slots]),
            'availability_summary' => pqpir_slot_summary($form['slots'], $options['availability_days'] ?? [], $options['availability_time_windows'] ?? [], (int)$form['session_count']),
            'parent_preferences' => pqpir_value($form, 'parent_preferences'),
            'live_class_consent' => (int)$form['live_class_consent'],
            'recording_consent' => (int)$form['recording_consent'],
            'consent_notes' => pqpir_value($form, 'consent_notes'),
            'status' => 'new',
            'matched_groupid' => 0,
            'transferred_userid' => 0,
            'transferred_profileid' => 0,
            'admin_notes' => '',
            'reviewedby' => 0,
            'reviewedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        if (pqpir_table_has_column('local_prequran_intake_request', 'special_needs')) {
            $requestrecord->special_needs = pqpir_value($form, 'special_needs');
        }
        if (pqpir_table_has_column('local_prequran_intake_request', 'course_type')) {
            $requestrecord->course_type = pqpir_value($form, 'course_type');
        }
        $requestid = $DB->insert_record('local_prequran_intake_request', $requestrecord);
        $SESSION->pqpir_last_submit = $now;
        $SESSION->pqpir_formtime = $now;
        pqpir_security_audit('public_intake_submitted', ['requestid' => (int)$requestid]);
        redirect(new moodle_url('/local/hubredirect/public_intake.php', ['submitted' => 1]));
    }
}

if (optional_param('submitted', 0, PARAM_BOOL)) {
    $message = 'Thank you. Your request was received and Quraan Academy will review the best live-class options.';
}

echo $OUTPUT->header();
?>
<style>
body.pqh-public-intake-page header,body.pqh-public-intake-page footer,body.pqh-public-intake-page nav.navbar,body.pqh-public-intake-page #page-header,body.pqh-public-intake-page #page-footer,body.pqh-public-intake-page .drawer,body.pqh-public-intake-page .drawer-toggles,body.pqh-public-intake-page .block-region,body.pqh-public-intake-page [data-region="drawer"],body.pqh-public-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-public-intake-page #page,body.pqh-public-intake-page #page-content,body.pqh-public-intake-page #region-main,body.pqh-public-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqpir-shell{--pq-sky:#aee9ff;--pq-sky-soft:#e7f5ff;--pq-sun:#fff2cf;--pq-pink:#ffe1f4;--pq-green:#66d992;--pq-green-soft:#e8fff0;--pq-orange:#ff7a18;--pq-orange-soft:#fff3e6;--pq-ink:#0f2230;--pq-ink-2:#234457;--pq-muted:#516a7a;--pq-stroke:rgba(15,34,48,.13);--pq-shadow:0 18px 46px rgba(15,34,48,.14);min-height:100vh;padding:34px 18px 64px;background:radial-gradient(circle at 8% 6%,rgba(255,225,244,.78) 0,transparent 32%),radial-gradient(circle at 92% 2%,rgba(174,233,255,.82) 0,transparent 34%),linear-gradient(180deg,#fff 0,#f6fbff 50%,#fff9ef 100%);font-family:"Baloo 2",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:var(--pq-ink)}
.pqpir-wrap{max-width:1160px;margin:0 auto}.pqpir-hero,.pqpir-panel{background:rgba(255,255,255,.9);border:2px solid var(--pq-stroke);border-radius:22px;box-shadow:var(--pq-shadow);backdrop-filter:blur(8px)}.pqpir-hero{position:relative;overflow:hidden;padding:28px 30px;margin-bottom:18px}.pqpir-hero:before{content:"";position:absolute;inset:0 0 auto;height:8px;background:linear-gradient(90deg,var(--pq-sky),var(--pq-green),#ffe49a,var(--pq-pink))}.pqpir-brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:14px;padding:8px 12px;border-radius:999px;background:linear-gradient(135deg,#fff7d1,#ffd67a);border:2px solid rgba(255,122,24,.2);color:#34250f;font-weight:950}.pqpir-brand-mark{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff4c7 0,#ffd27a 36%,var(--pq-orange) 100%);box-shadow:0 8px 16px rgba(255,122,24,.22);font-weight:950}.pqpir-title{margin:0;font-size:38px;line-height:1.04;font-weight:950;color:var(--pq-ink);letter-spacing:0}.pqpir-sub{max-width:940px;margin:10px 0 0;color:var(--pq-muted);font-size:17px;font-weight:900;line-height:1.35}.pqpir-panel{padding:26px}.pqpir-panel h2{margin:0 0 16px;font-size:26px;line-height:1.1;font-weight:950;color:var(--pq-ink)}.pqpir-panel h3{display:inline-flex;align-items:center;margin:22px 0 12px;padding:7px 11px;border-radius:999px;background:var(--pq-orange-soft);border:1px solid rgba(255,122,24,.18);font-size:15px;font-weight:950;color:#8a3a06}.pqpir-muted{color:var(--pq-muted);font-size:12px}.pqpir-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqpir-field{display:grid;gap:7px;margin-bottom:12px}.pqpir-field label{font-size:13px;font-weight:950;color:var(--pq-ink-2)}.pqpir-city-other{display:none}.pqpir-city-other--visible{display:grid}.pqpir-input{width:100%;min-height:48px;border:2px solid #d9e7f7;border-radius:14px;padding:10px 12px;font:900 15px/1.2 "Baloo 2",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#fff;color:var(--pq-ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease}.pqpir-input:focus{outline:0;border-color:#7cc7ff;box-shadow:0 0 0 4px rgba(34,193,232,.14)}.pqpir-multi{min-height:136px}.pqpir-textarea{min-height:96px;line-height:1.45}.pqpir-error{font-size:12px;font-weight:950;color:#a33a2c}.pqpir-field--error .pqpir-input,.pqpir-field--error .pqpir-calendar{border-color:#d6543f;background:#fff8f6;box-shadow:0 0 0 4px rgba(214,84,63,.08)}.pqpir-alert{padding:15px 18px;border-radius:18px;margin-bottom:14px;font-weight:950;border:2px solid transparent}.pqpir-alert ul{margin:8px 0 0;padding-left:22px}.pqpir-alert--ok{background:linear-gradient(135deg,#e8fff0,#f7fff9);border-color:#b9f5c7;color:#0f5c3a}.pqpir-alert--bad{background:linear-gradient(135deg,#fff3e6,#fff8f6);border-color:#ffd6a5;color:#8a3a06}.pqpir-calendar{overflow:auto;border:2px solid #d9e7f7;border-radius:18px;background:#fff}.pqpir-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:850px}.pqpir-calendar th,.pqpir-calendar td{border-bottom:1px solid rgba(15,34,48,.1);border-right:1px solid rgba(15,34,48,.08);padding:10px;text-align:center;font-weight:900}.pqpir-calendar th{background:linear-gradient(135deg,#e3faff,#f7fcff);color:var(--pq-ink-2);font-size:12px}.pqpir-calendar td:first-child{text-align:left;color:var(--pq-ink);background:#fffdf6}.pqpir-calendar tr:nth-child(even) td:first-child{background:#f8fff8}.pqpir-slot{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#eef7ff;border:1px solid #d9e7f7}.pqpir-slot input{width:19px;height:19px;accent-color:var(--pq-orange)}.pqpir-checkrow{display:flex;gap:10px;align-items:flex-start;margin:10px 0 13px;font-size:14px;font-weight:950;color:var(--pq-ink)}.pqpir-checkrow input{width:20px;height:20px;accent-color:#22c55e}.pqpir-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:0;border-radius:14px;background:linear-gradient(135deg,#ffd27a 0%,#ff9a4b 55%,var(--pq-orange) 100%);color:#1b1409!important;text-decoration:none;font-size:16px;font-weight:950;cursor:pointer;box-shadow:0 12px 22px rgba(255,122,24,.25)}.pqpir-btn:hover{filter:saturate(1.05) brightness(.98)}.pqpir-empty{padding:18px;border:2px dashed rgba(15,34,48,.2);border-radius:18px;color:var(--pq-muted);font-weight:950;background:#fffdf6}.pqpir-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
@media(max-width:760px){.pqpir-grid{grid-template-columns:1fr}.pqpir-title{font-size:30px}.pqpir-shell{padding:18px 10px 44px}.pqpir-hero,.pqpir-panel{border-radius:18px}.pqpir-hero{padding:24px 18px}.pqpir-panel{padding:18px}.pqpir-sub{font-size:15px}}
</style>
<main class="pqpir-shell">
  <div class="pqpir-wrap">
    <section class="pqpir-hero">
      <div class="pqpir-brand"><span class="pqpir-brand-mark">Q</span><span>Pre-Quran Live Learning</span></div>
      <h1 class="pqpir-title">Quraan Academy Prospective Student Inquiry</h1>
      <p class="pqpir-sub">Share the prospective student's details, preferred weekly session count, and available live-session hours. The academy team will review placement and confirm the best class options.</p>
    </section>

    <?php if ($message !== ''): ?><div class="pqpir-alert pqpir-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($errors): ?>
      <div class="pqpir-alert pqpir-alert--bad">
        Please fix the highlighted fields below.
        <ul>
          <?php foreach ($errors as $field => $msg): ?><li><?php echo s(pqpir_field_label((string)$field) . ': ' . $msg); ?></li><?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqpir-panel"><div class="pqpir-empty">The live-class request form is not ready yet. Please contact Quraan Academy support.</div></section>
    <?php else: ?>
      <section class="pqpir-panel">
        <h2>Student Information</h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="formtime" value="<?php echo (int)$formtime; ?>">
          <input type="hidden" name="formtoken" value="<?php echo s($formtoken); ?>">
          <div class="pqpir-trap" aria-hidden="true">
            <label>Website <input name="website" tabindex="-1" autocomplete="off"></label>
          </div>

          <h3>Parent / guardian <span class="pqpir-muted">(required only when the student is under 18)</span></h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['parent_name']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian name</label><input class="pqpir-input" name="parent_name" value="<?php echo s(pqpir_value($form, 'parent_name')); ?>"><?php echo pqpir_error($errors, 'parent_name'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['parent_email']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian email or phone</label><input class="pqpir-input" name="parent_email" value="<?php echo s(pqpir_value($form, 'parent_email')); ?>"><?php echo pqpir_error($errors, 'parent_email'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['parent_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian phone / WhatsApp</label><input class="pqpir-input" name="parent_phone" value="<?php echo s(pqpir_value($form, 'parent_phone')); ?>"><?php echo pqpir_error($errors, 'parent_phone'); ?></div>
          </div>

          <h3>Student</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['student_firstname']) ? ' pqpir-field--error' : ''; ?>"><label>First name</label><input class="pqpir-input" name="student_firstname" value="<?php echo s(pqpir_value($form, 'student_firstname')); ?>"><?php echo pqpir_error($errors, 'student_firstname'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['student_lastname']) ? ' pqpir-field--error' : ''; ?>"><label>Last name</label><input class="pqpir-input" name="student_lastname" value="<?php echo s(pqpir_value($form, 'student_lastname')); ?>"><?php echo pqpir_error($errors, 'student_lastname'); ?></div>
            <div class="pqpir-field"><label>Display name</label><input class="pqpir-input" name="student_display_name" value="<?php echo s(pqpir_value($form, 'student_display_name')); ?>"></div>
            <div class="pqpir-field<?php echo isset($errors['student_email']) ? ' pqpir-field--error' : ''; ?>"><label>Student email or phone</label><input class="pqpir-input" name="student_email" value="<?php echo s(pqpir_value($form, 'student_email')); ?>" placeholder="Required for students 18 or older"><?php echo pqpir_error($errors, 'student_email'); ?></div>
            <div class="pqpir-field"><label>Date of birth</label><input class="pqpir-input" name="date_of_birth" type="date" value="<?php echo s(pqpir_value($form, 'date_of_birth')); ?>"></div>
            <div class="pqpir-field<?php echo isset($errors['age_years']) ? ' pqpir-field--error' : ''; ?>"><label>Age</label><input class="pqpir-input" name="age_years" type="number" min="1" max="99" value="<?php echo s(pqpir_value($form, 'age_years')); ?>"><?php echo pqpir_error($errors, 'age_years'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['gender']) ? ' pqpir-field--error' : ''; ?>"><label>Gender</label><select class="pqpir-input" name="gender"><option value="">Select</option><option value="female"<?php echo pqpir_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqpir_selected($form, 'gender', 'male'); ?>>Male</option></select><?php echo pqpir_error($errors, 'gender'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['special_needs']) ? ' pqpir-field--error' : ''; ?>"><label>Special Needs</label><select class="pqpir-input" name="special_needs"><option value="">Select</option><option value="no"<?php echo pqpir_selected($form, 'special_needs', 'no'); ?>>No</option><option value="yes"<?php echo pqpir_selected($form, 'special_needs', 'yes'); ?>>Yes</option></select><?php echo pqpir_error($errors, 'special_needs'); ?></div>
          </div>

          <h3>Placement</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['course_type']) ? ' pqpir-field--error' : ''; ?>"><label>Course</label><?php echo pqpir_select('course_type', $options['course_types'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['country']) ? ' pqpir-field--error' : ''; ?>"><label>Country</label><?php echo pqpir_select('country', $options['countries'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['city']) ? ' pqpir-field--error' : ''; ?>"><label>City</label><?php echo pqpir_select('city', $options['cities'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field pqpir-city-other<?php echo isset($errors['city_other']) ? ' pqpir-field--error' : ''; ?>"><label>City not listed</label><input class="pqpir-input" name="city_other" value="<?php echo s(pqpir_value($form, 'city_other')); ?>"><?php echo pqpir_error($errors, 'city_other'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['primary_language']) ? ' pqpir-field--error' : ''; ?>"><label>Primary language</label><?php echo pqpir_select('primary_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field"><label>Other languages</label><?php echo pqpir_multi_select('other_languages', $options['other_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['current_level']) ? ' pqpir-field--error' : ''; ?>"><label>Current level</label><?php echo pqpir_select('current_level', $options['current_levels'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['learning_base']) ? ' pqpir-field--error' : ''; ?>"><label>Base of learning</label><?php echo pqpir_select('learning_base', $options['learning_bases'] ?? [], $form, $errors); ?></div>
          </div>

          <h3>Preferred weekly live-session number of sessions and hours</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['session_count']) ? ' pqpir-field--error' : ''; ?>">
              <label>Number of sessions</label>
              <?php echo pqpir_select('session_count', $options['session_counts'] ?? [], $form, $errors, 'Select'); ?>
            </div>
            <div class="pqpir-field<?php echo isset($errors['timezone']) ? ' pqpir-field--error' : ''; ?>">
              <label>Time zone</label>
              <?php echo pqpir_select('timezone', $options['timezones'] ?? [], $form, $errors); ?>
            </div>
          </div>
          <div class="pqpir-field<?php echo isset($errors['slots']) ? ' pqpir-field--error' : ''; ?>">
            <label>Select all recurring times that could work</label>
            <div class="pqpir-calendar">
              <table>
                <thead><tr><th>Day</th><?php foreach (($options['availability_time_windows'] ?? []) as $hour => $label): ?><th><?php echo s((string)$label); ?></th><?php endforeach; ?></tr></thead>
                <tbody>
                  <?php foreach (($options['availability_days'] ?? []) as $day => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($options['availability_time_windows'] ?? []) as $hour => $hourlabel): $slot = (string)$day . '|' . (string)$hour; ?>
                        <td><label class="pqpir-slot" title="<?php echo s((string)$daylabel . ' ' . (string)$hourlabel); ?>"><input type="checkbox" name="slots[]" value="<?php echo s($slot); ?>"<?php echo in_array($slot, $form['slots'], true) ? ' checked' : ''; ?>></label></td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqpir_error($errors, 'slots'); ?>
          </div>

          <h3>Notes and consent</h3>
          <div class="pqpir-field"><label>Parent preferences</label><textarea class="pqpir-input pqpir-textarea" name="parent_preferences"><?php echo s(pqpir_value($form, 'parent_preferences')); ?></textarea></div>
          <label class="pqpir-checkrow"><input type="checkbox" name="live_class_consent" value="1"<?php echo pqpir_checked($form, 'live_class_consent'); ?>><span>Student or parent/guardian consents to live interactive classes.</span></label><?php echo pqpir_error($errors, 'live_class_consent'); ?>
          <label class="pqpir-checkrow"><input type="checkbox" name="recording_consent" value="1"<?php echo pqpir_checked($form, 'recording_consent'); ?>><span>Student or parent/guardian consents to class recording when recording policy allows.</span></label>
          <div class="pqpir-field"><label>Consent notes/comment</label><textarea class="pqpir-input pqpir-textarea" name="consent_notes"><?php echo s(pqpir_value($form, 'consent_notes')); ?></textarea></div>

          <button class="pqpir-btn" type="submit">Submit live-class request</button>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var countryTimezones = <?php echo json_encode($options['country_timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var timezoneLabels = <?php echo json_encode($options['timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var countryCities = <?php echo json_encode($options['country_cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var cityLabels = <?php echo json_encode($options['cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var country = document.querySelector('select[name="country"]');
  var timezone = document.querySelector('select[name="timezone"]');
  var city = document.querySelector('select[name="city"]');
  var cityOther = document.querySelector('.pqpir-city-other');
  if (!country || !timezone || !city) {
    return;
  }
  function option(value, label, selected) {
    var item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    if (selected) {
      item.selected = true;
    }
    return item;
  }
  function refreshTimezones() {
    var selected = timezone.value;
    var zones = countryTimezones[country.value] || Object.keys(timezoneLabels);
    timezone.innerHTML = '';
    timezone.appendChild(option('', 'Select', selected === ''));
    zones.forEach(function(zone) {
      timezone.appendChild(option(zone, timezoneLabels[zone] || zone, zone === selected));
    });
    if (selected && zones.indexOf(selected) === -1) {
      timezone.value = zones.length ? zones[0] : '';
    }
  }
  function refreshCities() {
    var selected = city.value;
    var cities = countryCities[country.value] ? Object.keys(countryCities[country.value]) : Object.keys(cityLabels);
    if (cities.indexOf('Other') === -1) {
      cities.push('Other');
    }
    city.innerHTML = '';
    city.appendChild(option('', 'Select', selected === ''));
    cities.forEach(function(cityname) {
      var label = (countryCities[country.value] && countryCities[country.value][cityname]) || cityLabels[cityname] || cityname;
      city.appendChild(option(cityname, label, cityname === selected));
    });
    if (selected && cities.indexOf(selected) === -1) {
      city.value = 'Other';
    }
    if (cityOther) {
      cityOther.classList.toggle('pqpir-city-other--visible', city.value === 'Other');
    }
  }
  country.addEventListener('change', refreshTimezones);
  country.addEventListener('change', refreshCities);
  city.addEventListener('change', refreshCities);
  refreshTimezones();
  refreshCities();
})();
</script>
<?php
echo $OUTPUT->footer();
