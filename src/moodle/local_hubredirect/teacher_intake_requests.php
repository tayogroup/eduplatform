<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can review teacher applications.');

function pqtirq_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtirq_statuses(): array {
    return [
        'new' => 'New',
        'reviewing' => 'Reviewing',
        'approved' => 'Approved',
        'needs_update' => 'Needs update',
        'rejected' => 'Rejected',
        'converted' => 'Converted',
        'closed' => 'Closed',
    ];
}

function pqtirq_status_label(string $status): string {
    $statuses = pqtirq_statuses();
    return $statuses[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqtirq_short(string $value, int $max = 180): string {
    $value = trim($value);
    if ($value === '') {
        return 'Not provided';
    }
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqtirq_application_json(stdClass $request): array {
    $decoded = json_decode((string)($request->application_json ?? ''), true);
    if (is_array($decoded) && $decoded) {
        return $decoded;
    }
    $map = [
        'Teaching work model' => 'teacher_work_model_labels',
        'Service modes' => 'service_mode_labels',
        'Language subject' => 'subject_language_label',
        'Subjects' => 'subject_area_labels',
        'Other subjects' => 'subject_other',
        'Learner levels' => 'age_group_labels',
        'Teaching levels' => 'general_level_labels',
        'School/workspace preferences' => 'workspace_preferences',
        'Years of experience' => 'years_experience',
        'Schools, institutions, and freelance teaching' => 'institution_experience',
        'Online profile' => 'online_profile_name',
        'Social media handle' => 'instagram_handle',
        'Social profile URL' => 'social_profile_url',
        'Website/booking URL' => 'website_or_booking_url',
        'Demo/sample URL' => 'demo_video_url',
    ];
    $backup = [];
    foreach (preg_split('/\R/', (string)($request->notes ?? '')) ?: [] as $line) {
        if (strpos($line, ':') === false) {
            continue;
        }
        [$label, $value] = array_map('trim', explode(':', $line, 2));
        if ($value !== '' && isset($map[$label])) {
            $backup[$map[$label]] = $value;
        }
    }
    return $backup;
}

function pqtirq_app_value(array $application, string $key): string {
    $value = $application[$key] ?? '';
    return is_array($value) ? trim(implode(', ', array_map('strval', $value))) : trim((string)$value);
}

function pqtirq_request_or_app(stdClass $request, array $application, string $field, string $jsonkey = '', string $labelkey = ''): string {
    $stored = trim((string)($request->{$field} ?? ''));
    if ($stored !== '') {
        return $stored;
    }
    if ($labelkey !== '') {
        $value = pqtirq_app_value($application, $labelkey);
        if ($value !== '') {
            return $value;
        }
    }
    $value = pqtirq_app_value($application, $jsonkey !== '' ? $jsonkey : $field);
    return $value;
}

function pqtirq_request_or_app_int(stdClass $request, array $application, string $field): int {
    $stored = trim((string)($request->{$field} ?? ''));
    if ($stored !== '') {
        return (int)$stored;
    }
    $value = pqtirq_app_value($application, $field);
    return $value !== '' ? (int)$value : 0;
}

function pqtirq_status_class(string $status): string {
    if (in_array($status, ['approved', 'converted'], true)) {
        return ' pqtirq-pill--ok';
    }
    if (in_array($status, ['rejected', 'closed'], true)) {
        return ' pqtirq-pill--bad';
    }
    if (in_array($status, ['new', 'needs_update'], true)) {
        return ' pqtirq-pill--warn';
    }
    return '';
}

function pqtirq_consumer_params(stdClass $request): array {
    $slug = trim((string)($request->consumer_slug ?? ''));
    return $slug !== '' ? ['consumer' => $slug] : [];
}

function pqtirq_intake_params(stdClass $request): array {
    $params = [
        'consumer' => (string)($request->consumer_slug ?? ''),
        'teacher_requestid' => (int)$request->id,
        'requestid' => (int)$request->id,
    ];
    if (!empty($request->workspaceid)) {
        $params['workspaceid'] = (int)$request->workspaceid;
    }
    return $params;
}

function pqtirq_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqtirq_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'teacher_intake_request',
        'targetid' => $targetid,
        'details' => $details ? json_encode($details, JSON_UNESCAPED_SLASHES) : '',
        'timecreated' => time(),
    ]);
}

function pqtirq_request_with_profile_values(stdClass $request): stdClass {
    global $DB;

    $display = clone $request;
    if (!pqtirq_table_exists('local_prequran_teacher_profile')) {
        return $display;
    }

    $profile = null;
    $profileid = (int)($request->converted_profileid ?? 0);
    if ($profileid > 0) {
        $profile = $DB->get_record('local_prequran_teacher_profile', ['id' => $profileid], '*', IGNORE_MISSING);
    }
    if (!$profile && (int)($request->converted_userid ?? 0) > 0) {
        $profile = $DB->get_record('local_prequran_teacher_profile', ['userid' => (int)$request->converted_userid], '*', IGNORE_MISSING);
    }
    if (!$profile) {
        return $display;
    }

    $fields = [
        'teacher_work_models',
        'service_modes',
        'subject_language',
        'subject_areas',
        'subject_other',
        'age_groups',
        'general_levels',
        'workspace_preferences',
        'institution_experience',
        'application_json',
        'availability_summary',
        'primary_language',
        'other_languages',
        'country',
        'city',
        'timezone',
    ];
    foreach ($fields as $field) {
        $value = trim((string)($profile->{$field} ?? ''));
        if ($value !== '') {
            $display->{$field} = $value;
        }
    }

    if (isset($profile->years_experience)) {
        $display->years_experience = (int)$profile->years_experience;
    }
    foreach ([
        'marketplace_bio' => 'bio',
        'marketplace_experience' => 'experience',
        'marketplace_education' => 'education',
        'marketplace_teaching_style' => 'teaching_style',
        'marketplace_courses' => 'courses',
    ] as $profilefield => $requestfield) {
        $value = trim((string)($profile->{$profilefield} ?? ''));
        if ($value !== '') {
            $display->{$requestfield} = $value;
        }
    }

    return $display;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_intake_requests.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Applications');
$PAGE->set_heading('Teacher Applications');
$PAGE->add_body_class('pqh-teacher-intake-requests-page');

$ready = pqtirq_table_exists('local_prequran_teacher_intake_request');
$message = '';
$error = '';

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This teacher application review form expired. Please refresh and try again.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $requestid = optional_param('requestid', 0, PARAM_INT);
        $request = $requestid > 0 ? $DB->get_record('local_prequran_teacher_intake_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
        if (!$request) {
            throw new invalid_parameter_exception('Choose a valid teacher application before saving a review.');
        }

        if ($action === 'save_review') {
            $status = optional_param('status', '', PARAM_ALPHANUMEXT);
            if (!array_key_exists($status, pqtirq_statuses())) {
                throw new invalid_parameter_exception('Invalid teacher application status.');
            }
            $request->status = $status;
            $request->admin_notes = trim(optional_param('admin_notes', '', PARAM_TEXT));
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_teacher_intake_request', $request);
            pqtirq_audit('teacher_intake_request_review_saved', $requestid, [
                'status' => $status,
            ]);
            $message = 'Teacher application #' . $requestid . ' review saved.';
        } else {
            throw new invalid_parameter_exception('Choose a valid teacher application review action.');
        }
    } catch (Throwable $e) {
        $error = 'Teacher application update failed: ' . $e->getMessage();
    }
}

$requests = [];
if ($ready) {
    $consumercontext = pqh_requested_consumer_context();
    $where = '';
    $params = [];
    $consumerid = (int)($consumercontext->consumerid ?? 0);
    $consumerslug = (string)($consumercontext->consumerslug ?? '');
    $isplatformfoundation = $consumerslug === 'eduplatform'
        && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation';
    if ($consumerid > 0 && !$isplatformfoundation) {
        $whereparts = ['r.consumerid = :consumerid'];
        $params['consumerid'] = $consumerid;
        $workspaceids = pqh_consumer_context_workspace_ids($consumercontext);
        if ($workspaceids) {
            [$insql, $inparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'requestworkspace');
            $whereparts[] = "(COALESCE(r.consumerid, 0) = 0 AND r.workspaceid {$insql})";
            $params += $inparams;
        }
        $where = 'WHERE (' . implode(' OR ', $whereparts) . ')';
    }
    $requests = array_values($DB->get_records_sql(
        "SELECT r.*, c.slug AS consumer_slug, c.name AS consumer_name, c.consumer_type
           FROM {local_prequran_teacher_intake_request} r
      LEFT JOIN {local_prequran_consumer} c ON c.id = r.consumerid
          {$where}
       ORDER BY CASE r.status
                    WHEN 'new' THEN 1
                    WHEN 'reviewing' THEN 2
                    WHEN 'approved' THEN 3
                    WHEN 'needs_update' THEN 4
                    WHEN 'converted' THEN 5
                    WHEN 'rejected' THEN 6
                    ELSE 7
                END,
                r.timecreated DESC",
        $params,
        0,
        100
    ));
}

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-intake-requests-page header,body.pqh-teacher-intake-requests-page footer,body.pqh-teacher-intake-requests-page nav.navbar,body.pqh-teacher-intake-requests-page #page-header,body.pqh-teacher-intake-requests-page #page-footer,body.pqh-teacher-intake-requests-page .drawer,body.pqh-teacher-intake-requests-page .drawer-toggles,body.pqh-teacher-intake-requests-page .block-region,body.pqh-teacher-intake-requests-page [data-region="drawer"],body.pqh-teacher-intake-requests-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-teacher-intake-requests-page #page,body.pqh-teacher-intake-requests-page #page-content,body.pqh-teacher-intake-requests-page #region-main,body.pqh-teacher-intake-requests-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtirq-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtirq-wrap{max-width:1240px;margin:0 auto}.pqtirq-top,.pqtirq-card{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqtirq-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqtirq-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqtirq-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqtirq-actions{display:flex;flex-wrap:wrap;gap:9px}.pqtirq-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqtirq-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqtirq-btn--gold{background:#d99a26;color:#1b1409!important}.pqtirq-card{padding:18px;margin-bottom:14px}.pqtirq-cardhead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.pqtirq-card h2{margin:0;font-size:21px;font-weight:950}.pqtirq-meta{margin-top:5px;color:#5e7280;font-size:13px;font-weight:850}.pqtirq-pill{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044;white-space:nowrap}.pqtirq-pill--warn{background:#fff4dc;color:#7a5637}.pqtirq-pill--ok{background:#edf9ef;color:#245c35}.pqtirq-pill--bad{background:#fff0ed;color:#883526}.pqtirq-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pqtirq-box{padding:11px;border:1px solid rgba(23,48,68,.1);border-radius:9px;background:#fbfdff;font-weight:850}.pqtirq-box strong{display:block;margin-bottom:4px;color:#7a5637}.pqtirq-wide{grid-column:span 2}.pqtirq-form{display:grid;grid-template-columns:180px 1fr auto auto;gap:8px;align-items:end;margin-top:12px;padding-top:12px;border-top:1px solid rgba(23,48,68,.1)}.pqtirq-field{display:grid;gap:5px}.pqtirq-field label{font-size:12px;font-weight:900;color:#415665}.pqtirq-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:7px 9px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}.pqtirq-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqtirq-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqtirq-alert--ok{background:#edf9ef;color:#245c35}.pqtirq-alert--bad{background:#fff0ed;color:#883526}
@media(max-width:980px){.pqtirq-top{display:block}.pqtirq-actions{margin-top:12px}.pqtirq-grid{grid-template-columns:1fr}.pqtirq-wide{grid-column:auto}.pqtirq-form{grid-template-columns:1fr}.pqtirq-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqtirq-shell">
  <div class="pqtirq-wrap">
    <section class="pqtirq-top pqh-workspace-top">
      <div>
        <h1 class="pqtirq-title pqh-workspace-title">Teacher Applications</h1>
        <p class="pqtirq-sub pqh-workspace-sub">Review independent teacher and tutor applications before creating Moodle teacher accounts, marketplace profiles, or workspace access.</p>
      </div>
      <div class="pqtirq-actions pqh-workspace-actions">
        <a class="pqtirq-btn pqtirq-btn--light" href="<?php echo pqh_consumer_url('/local/hubredirect/public_teacher_intake.php', $consumercontext)->out(false); ?>">Public form</a>
        <a class="pqtirq-btn pqtirq-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php'))->out(false); ?>">Teacher intake</a>
        <a class="pqtirq-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqtirq-alert pqtirq-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqtirq-alert pqtirq-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqtirq-card"><div class="pqtirq-empty">Teacher application table is not ready. Run the local_prequran Moodle upgrade first.</div></section>
    <?php elseif (!$requests): ?>
      <section class="pqtirq-card"><div class="pqtirq-empty">No teacher applications yet.</div></section>
    <?php else: ?>
      <?php foreach ($requests as $request): ?>
        <?php
          $consumername = trim((string)($request->consumer_name ?? '')) ?: 'Unknown consumer';
          $request = pqtirq_request_with_profile_values($request);
          $application = pqtirq_application_json($request);
        ?>
        <article class="pqtirq-card">
          <div class="pqtirq-cardhead">
            <div>
              <h2><?php echo s((string)$request->teacher_name); ?></h2>
              <div class="pqtirq-meta">Application #<?php echo (int)$request->id; ?> - <?php echo userdate((int)$request->timecreated); ?> - <?php echo s($consumername); ?><?php if ((int)$request->workspaceid > 0): ?> - Workspace #<?php echo (int)$request->workspaceid; ?><?php endif; ?></div>
            </div>
            <span class="pqtirq-pill<?php echo pqtirq_status_class((string)$request->status); ?>"><?php echo s(pqtirq_status_label((string)$request->status)); ?></span>
          </div>

          <div class="pqtirq-grid">
            <div class="pqtirq-box"><strong>Contact</strong><?php echo s((string)$request->email ?: 'Email not provided'); ?><br><?php echo s((string)$request->phone ?: 'Phone not provided'); ?></div>
            <div class="pqtirq-box"><strong>Location</strong><?php echo s((string)$request->country ?: 'Country not set'); ?><?php if ((string)$request->city !== ''): ?>, <?php echo s((string)$request->city); ?><?php endif; ?><br><?php echo s((string)$request->timezone ?: 'Time zone not set'); ?></div>
            <div class="pqtirq-box"><strong>Languages</strong><?php echo s((string)$request->primary_language ?: 'Primary language not set'); ?><?php if ((string)$request->other_languages !== ''): ?><br>Also: <?php echo s((string)$request->other_languages); ?><?php endif; ?></div>
            <div class="pqtirq-box"><strong>Work model</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'teacher_work_models', 'teacher_work_models', 'teacher_work_model_labels'))); ?><br><strong style="margin-top:8px">Service modes</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'service_modes', 'service_modes', 'service_mode_labels'))); ?></div>
            <div class="pqtirq-box"><strong>Language subject</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'subject_language', 'subject_language', 'subject_language_label'))); ?><br><strong style="margin-top:8px">Other subjects</strong><?php echo s(pqtirq_short(trim(pqtirq_request_or_app($request, $application, 'subject_areas', 'subject_areas', 'subject_area_labels') . ' ' . pqtirq_request_or_app($request, $application, 'subject_other')), 260)); ?></div>
            <div class="pqtirq-box"><strong>Learner levels</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'age_groups', 'age_groups', 'age_group_labels'))); ?></div>
            <div class="pqtirq-box"><strong>Levels</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'general_levels', 'general_levels', 'general_level_labels') ?: (string)($request->levels ?? ''))); ?></div>
            <div class="pqtirq-box"><strong>Availability</strong><?php echo s(pqtirq_short((string)$request->availability_summary, 260)); ?></div>
            <div class="pqtirq-box"><strong>Conversion</strong><?php echo (int)$request->converted_userid > 0 ? 'Moodle teacher ID ' . (int)$request->converted_userid . '<br>' . s(pqh_account_no_label((int)$request->converted_userid)) : 'Not converted yet'; ?><?php if ((int)$request->converted_profileid > 0): ?><br>Profile #<?php echo (int)$request->converted_profileid; ?><?php endif; ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>School / workspace preferences</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'workspace_preferences'), 420)); ?></div>
            <div class="pqtirq-box"><strong>Years of experience</strong><?php echo s((string)pqtirq_request_or_app_int($request, $application, 'years_experience')); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Schools, institutions, and freelance teaching</strong><?php echo s(pqtirq_short(pqtirq_request_or_app($request, $application, 'institution_experience'), 420)); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Experience</strong><?php echo s(pqtirq_short((string)$request->experience, 420)); ?></div>
            <div class="pqtirq-box"><strong>Education</strong><?php echo s(pqtirq_short((string)$request->education, 260)); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Public profile summary</strong><?php echo s(pqtirq_short((string)$request->bio, 420)); ?></div>
            <div class="pqtirq-box"><strong>Desired services</strong><?php echo s(pqtirq_short((string)$request->desired_services, 260)); ?></div>
            <div class="pqtirq-box"><strong>Online profile</strong><?php echo s(pqtirq_short(pqtirq_app_value($application, 'online_profile_name') ?: pqtirq_app_value($application, 'instagram_handle'), 220)); ?><br><?php echo s(pqtirq_short(pqtirq_app_value($application, 'social_profile_url'), 220)); ?></div>
            <div class="pqtirq-box"><strong>Website / demo</strong><?php echo s(pqtirq_short(pqtirq_app_value($application, 'website_or_booking_url'), 220)); ?><br><?php echo s(pqtirq_short(pqtirq_app_value($application, 'demo_video_url'), 220)); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Teaching offer</strong><?php echo s(pqtirq_short(pqtirq_app_value($application, 'teaching_offer_summary'), 420)); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Learner outcomes</strong><?php echo s(pqtirq_short(pqtirq_app_value($application, 'learner_outcomes'), 420)); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Curriculum / social proof</strong><?php echo s(pqtirq_short(trim(pqtirq_app_value($application, 'curriculum_materials') . "\n" . pqtirq_app_value($application, 'social_proof')), 420)); ?></div>
            <div class="pqtirq-box pqtirq-wide"><strong>Applicant notes</strong><?php echo s(pqtirq_short((string)$request->notes, 360)); ?></div>
            <div class="pqtirq-box"><strong>Admin notes</strong><?php echo s(pqtirq_short((string)$request->admin_notes, 260)); ?></div>
          </div>

          <form class="pqtirq-form" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
            <div class="pqtirq-field">
              <label>Status</label>
              <select class="pqtirq-input" name="status">
                <?php foreach (pqtirq_statuses() as $status => $label): ?>
                  <option value="<?php echo s($status); ?>"<?php echo (string)$request->status === $status ? ' selected' : ''; ?>><?php echo s($label); ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="pqtirq-field">
              <label>Admin notes</label>
              <input class="pqtirq-input" name="admin_notes" value="<?php echo s((string)$request->admin_notes); ?>" placeholder="Review decision, next contact, missing documents">
            </div>
            <button class="pqtirq-btn pqtirq-btn--light" type="submit" name="action" value="save_review">Save review</button>
            <a class="pqtirq-btn pqtirq-btn--gold" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php', pqtirq_intake_params($request)))->out(false); ?>">Open teacher intake</a>
          </form>
        </article>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
