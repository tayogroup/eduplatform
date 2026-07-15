<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

function pqtmkt_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmkt_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmkt_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqtmkt_json(string $value): array {
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function pqtmkt_url(string $value): string {
    $value = trim(clean_param($value, PARAM_URL));
    if ($value === '') {
        return '';
    }
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        throw new invalid_parameter_exception('Enter a valid public URL.');
    }
    $scheme = strtolower((string)parse_url($value, PHP_URL_SCHEME));
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new invalid_parameter_exception('Public links must use HTTP or HTTPS.');
    }
    return $value;
}

function pqtmkt_social_url(string $value): string {
    $value = pqtmkt_url($value);
    if ($value === '') {
        return '';
    }
    $host = strtolower((string)parse_url($value, PHP_URL_HOST));
    if (in_array($host, ['instagram.com', 'www.instagram.com'], true)) {
        $path = '/' . trim((string)parse_url($value, PHP_URL_PATH), '/');
        return 'https://www.instagram.com' . ($path === '/' ? '' : $path);
    }
    return $value;
}

function pqtmkt_text(string $name, int $max): string {
    $value = trim(optional_param($name, '', PARAM_TEXT));
    if (core_text::strlen($value) > $max) {
        throw new invalid_parameter_exception('One or more marketing fields exceed the allowed length.');
    }
    return $value;
}

function pqtmkt_draft_matches_approved(stdClass $profile, array $application, array $draft): bool {
    if (!$draft || !in_array((string)(($application['marketplace_marketing_last_review']['status'] ?? '')), ['approved', 'published'], true)) {
        return false;
    }
    $approved = [
        'display_name' => (string)($profile->teacher_display_name ?? ''),
        'bio' => (string)($profile->marketplace_bio ?? ''),
        'skills' => (string)($profile->marketplace_skills ?? ''),
        'experience' => (string)($profile->marketplace_experience ?? ''),
        'education' => (string)($profile->marketplace_education ?? ''),
        'teaching_style' => (string)($profile->marketplace_teaching_style ?? ''),
        'services' => (string)($profile->marketplace_courses ?? ''),
        'social_media_handle' => (string)($application['social_media_handle'] ?? ''),
        'social_profile_url' => (string)($application['social_profile_url'] ?? ''),
        'website_or_booking_url' => (string)($application['website_or_booking_url'] ?? ''),
        'demo_video_url' => (string)($application['demo_video_url'] ?? ''),
        'learner_outcomes' => (string)($application['learner_outcomes'] ?? ''),
        'curriculum_materials' => (string)($application['curriculum_materials'] ?? ''),
        'pricing_summary' => (string)($application['pricing_summary'] ?? ''),
    ];
    foreach ($approved as $field => $value) {
        if (trim((string)($draft[$field] ?? '')) !== trim($value)) {
            return false;
        }
    }
    return true;
}

function pqtmkt_audit(string $action, int $profileid, array $details = []): void {
    global $DB, $USER;
    if (!pqtmkt_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'teacher_profile',
        'targetid' => $profileid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ]);
}

function pqtmkt_preference_key(int $consumerid): string {
    return 'local_hubredirect_mktstatus_' . max(0, $consumerid);
}

function pqtmkt_latest_audit_review(array $profileids): array {
    global $DB;
    if (!$profileids || !pqtmkt_table_exists('local_prequran_live_audit')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal(array_values($profileids), SQL_PARAMS_NAMED, 'mktprofile');
    $params['targettype'] = 'teacher_profile';
    $rows = $DB->get_records_sql(
        "SELECT a.*
           FROM {local_prequran_live_audit} a
          WHERE a.targettype = :targettype
            AND a.targetid {$insql}
            AND a.action IN ('teacher_marketing_submitted', 'teacher_marketing_approved', 'teacher_marketing_rejected')
       ORDER BY a.timecreated DESC, a.id DESC",
        $params,
        0,
        1
    );
    $audit = $rows ? reset($rows) : false;
    $status = match ((string)($audit->action ?? '')) {
        'teacher_marketing_submitted' => 'pending_review',
        'teacher_marketing_approved' => 'published',
        'teacher_marketing_rejected' => 'rejected',
        default => '',
    };
    return $status === '' ? [] : [
        'status' => $status,
        'time' => (int)($audit->timecreated ?? 0),
        'priority' => $status === 'published' ? 30 : ($status === 'rejected' ? 20 : 10),
    ];
}

function pqtmkt_canonical_review_status(int $userid, int $consumerid, array $profiles): string {
    $key = pqtmkt_preference_key($consumerid);
    $events = [];
    $auditevent = pqtmkt_latest_audit_review(array_map(static fn($profile): int => (int)$profile->id, $profiles));
    if ($auditevent) {
        $events[] = $auditevent;
    }
    foreach ($profiles as $profile) {
        $application = pqtmkt_json((string)($profile->application_json ?? ''));
        $draft = $application['marketplace_marketing_draft'] ?? [];
        if (is_array($draft) && $draft) {
            $draftstatus = (string)($draft['review_status'] ?? 'pending_review');
            $drafttime = $draftstatus === 'rejected'
                ? (int)($draft['reviewed_at'] ?? $draft['submitted_at'] ?? 0)
                : (int)($draft['submitted_at'] ?? 0);
            $events[] = [
                'status' => $draftstatus,
                'time' => $drafttime,
                'priority' => $draftstatus === 'rejected' ? 20 : 10,
            ];
        }
        $lastreview = $application['marketplace_marketing_last_review'] ?? [];
        if (is_array($lastreview) && in_array((string)($lastreview['status'] ?? ''), ['approved', 'published'], true)) {
            $events[] = [
                'status' => 'published',
                'time' => (int)($lastreview['reviewed_at'] ?? $profile->timemodified ?? 0),
                'priority' => 30,
            ];
        }
        if ((int)($profile->marketplace_visible ?? 0) === 1
                && (string)($profile->marketplace_status ?? '') === 'published') {
            $publishedtime = (int)($lastreview['reviewed_at'] ?? 0);
            if (!is_array($draft) || !$draft) {
                $publishedtime = max($publishedtime, (int)($profile->timemodified ?? 0));
            }
            $events[] = [
                'status' => 'published',
                'time' => $publishedtime,
                'priority' => 30,
            ];
        }
    }
    if ($events) {
        usort($events, static function(array $left, array $right): int {
            return [$right['time'], $right['priority']] <=> [$left['time'], $left['priority']];
        });
        $status = (string)$events[0]['status'];
        set_user_preference($key, $status, $userid);
        return $status;
    }
    $status = (string)get_user_preferences($key, 'draft', $userid);
    return in_array($status, ['pending_review', 'published', 'rejected', 'draft'], true) ? $status : 'draft';
}

function pqtmkt_review_status(stdClass $profile, array $application, array $draft, string $canonicalstatus): string {
    if ($canonicalstatus !== '') {
        return $canonicalstatus;
    }
    if ((int)($profile->marketplace_visible ?? 0) === 1
            && (string)($profile->marketplace_status ?? '') === 'published') {
        return 'published';
    }
    if ($draft) {
        return (string)($draft['review_status'] ?? 'pending_review');
    }
    $lastreview = $application['marketplace_marketing_last_review'] ?? [];
    if (is_array($lastreview) && trim((string)($lastreview['status'] ?? '')) !== '') {
        return (string)$lastreview['status'];
    }
    return (string)($profile->marketplace_status ?? 'draft');
}

function pqtmkt_status_label(string $status): string {
    $labels = [
        'pending_review' => 'Pending Review',
        'published' => 'Published',
        'approved' => 'Approved',
        'rejected' => 'Returned for Revision',
        'draft' => 'Draft',
    ];
    return $labels[$status] ?? ucwords(str_replace('_', ' ', $status));
}

$consumercontext = pqh_requested_consumer_context();
$consumerparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $consumerparams['consumer'] = (string)$consumercontext->consumerslug;
}
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0) {
    $workspaceid = (int)($consumercontext->workspaceid ?? 0);
}
if ($workspaceid > 0) {
    $consumerparams['workspaceid'] = $workspaceid;
}

if (!pqtmkt_table_exists('local_prequran_teacher_profile')
        || !pqtmkt_column_exists('local_prequran_teacher_profile', 'application_json')) {
    throw new moodle_exception('Teacher marketing profile storage is not ready.');
}

$profilewhere = 'tp.userid = :userid';
$profileparams = ['userid' => (int)$USER->id];
if (pqtmkt_column_exists('local_prequran_teacher_profile', 'consumerid')
        && (int)($consumercontext->consumerid ?? 0) > 0) {
    $profilewhere .= ' AND tp.consumerid = :consumerid';
    $profileparams['consumerid'] = (int)$consumercontext->consumerid;
}
$profiles = $DB->get_records_sql(
    "SELECT tp.*
       FROM {local_prequran_teacher_profile} tp
      WHERE {$profilewhere}
   ORDER BY tp.timemodified DESC, tp.id DESC",
    $profileparams
);
$profiles = array_values($profiles);
// Repair unchanged forms that were re-POSTed when the old polling script reloaded a POST response.
foreach ($profiles as $index => $candidate) {
    $candidateapplication = pqtmkt_json((string)($candidate->application_json ?? ''));
    $candidatedraft = $candidateapplication['marketplace_marketing_draft'] ?? [];
    if (is_array($candidatedraft) && pqtmkt_draft_matches_approved($candidate, $candidateapplication, $candidatedraft)) {
        unset($candidateapplication['marketplace_marketing_draft']);
        $candidate->application_json = json_encode($candidateapplication, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $DB->update_record('local_prequran_teacher_profile', $candidate);
        $profiles[$index] = $candidate;
    }
}
$canonicalstatus = pqtmkt_canonical_review_status(
    (int)$USER->id,
    (int)($consumercontext->consumerid ?? 0),
    $profiles
);
$profile = false;
foreach ($profiles as $candidate) {
    $candidateapplication = pqtmkt_json((string)($candidate->application_json ?? ''));
    $candidatedraft = $candidateapplication['marketplace_marketing_draft'] ?? [];
    if ($canonicalstatus === 'published'
            && (int)($candidate->marketplace_visible ?? 0) === 1
            && (string)($candidate->marketplace_status ?? '') === 'published') {
        $profile = $candidate;
        break;
    }
    if ($canonicalstatus === 'pending_review' && is_array($candidatedraft) && $candidatedraft) {
        $profile = $candidate;
        break;
    }
}
$profile = $profile ?: ($profiles ? reset($profiles) : false);
if (!$profile || (string)($profile->status ?? '') !== 'active'
        || (string)($profile->vetting_status ?? '') !== 'approved') {
    pqh_access_denied('An active approved teacher profile is required before marketing services.', new moodle_url('/local/hubredirect/dashboard.php', $consumerparams), 'Teacher marketing access required');
}

$application = pqtmkt_json((string)($profile->application_json ?? ''));
$draft = isset($application['marketplace_marketing_draft']) && is_array($application['marketplace_marketing_draft'])
    ? $application['marketplace_marketing_draft']
    : [];
$reviewstatus = pqtmkt_review_status($profile, $application, $draft, $canonicalstatus);
if (optional_param('statuscheck', 0, PARAM_BOOL)) {
    @header('Content-Type: application/json; charset=utf-8');
    @header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode([
        'status' => $reviewstatus,
        'label' => pqtmkt_status_label($reviewstatus),
        'profileid' => (int)$profile->id,
        'timemodified' => (int)$profile->timemodified,
    ]);
    exit;
}
$source = ($reviewstatus !== 'published' && $draft) ? $draft : [
    'display_name' => (string)($profile->teacher_display_name ?? ''),
    'bio' => (string)($profile->marketplace_bio ?? ''),
    'skills' => (string)($profile->marketplace_skills ?? ''),
    'experience' => (string)($profile->marketplace_experience ?? ''),
    'education' => (string)($profile->marketplace_education ?? ''),
    'teaching_style' => (string)($profile->marketplace_teaching_style ?? ''),
    'services' => (string)($profile->marketplace_courses ?? ''),
    'social_media_handle' => (string)($application['social_media_handle'] ?? ''),
    'social_profile_url' => (string)($application['social_profile_url'] ?? ''),
    'website_or_booking_url' => (string)($application['website_or_booking_url'] ?? ''),
    'demo_video_url' => (string)($application['demo_video_url'] ?? ''),
    'learner_outcomes' => (string)($application['learner_outcomes'] ?? ''),
    'curriculum_materials' => (string)($application['curriculum_materials'] ?? ''),
    'pricing_summary' => (string)($application['pricing_summary'] ?? ''),
];

$message = optional_param('submitted', 0, PARAM_BOOL)
    ? 'Marketing profile submitted for marketplace review.'
    : (optional_param('unchanged', 0, PARAM_BOOL) ? 'Your published marketing profile is already up to date.' : '');
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('submit_marketing', '', PARAM_TEXT) === '1') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This marketing form expired. Please refresh and try again.');
        }
        $socialurl = pqtmkt_social_url(optional_param('social_profile_url', '', PARAM_RAW_TRIMMED));
        $handle = ltrim(pqtmkt_text('social_media_handle', 100), '@');
        if ($handle === '' && strpos($socialurl, 'instagram.com/') !== false) {
            $handle = trim((string)parse_url($socialurl, PHP_URL_PATH), '/');
        }
        $draft = [
            'display_name' => pqtmkt_text('display_name', 160),
            'bio' => pqtmkt_text('bio', 3000),
            'skills' => pqtmkt_text('skills', 2000),
            'experience' => pqtmkt_text('experience', 3000),
            'education' => pqtmkt_text('education', 3000),
            'teaching_style' => pqtmkt_text('teaching_style', 2500),
            'services' => pqtmkt_text('services', 3000),
            'social_media_handle' => $handle,
            'social_profile_url' => $socialurl,
            'website_or_booking_url' => pqtmkt_url(optional_param('website_or_booking_url', '', PARAM_RAW_TRIMMED)),
            'demo_video_url' => pqtmkt_url(optional_param('demo_video_url', '', PARAM_RAW_TRIMMED)),
            'learner_outcomes' => pqtmkt_text('learner_outcomes', 2500),
            'curriculum_materials' => pqtmkt_text('curriculum_materials', 2500),
            'pricing_summary' => pqtmkt_text('pricing_summary', 1200),
            'review_status' => 'pending_review',
            'submitted_by' => (int)$USER->id,
            'submitted_at' => time(),
        ];
        if ($draft['display_name'] === '' || $draft['bio'] === '' || $draft['services'] === '') {
            throw new invalid_parameter_exception('Public name, profile summary, and services are required.');
        }
        if (pqtmkt_draft_matches_approved($profile, $application, $draft)) {
            set_user_preference(
                pqtmkt_preference_key((int)($consumercontext->consumerid ?? 0)),
                'published',
                (int)$USER->id
            );
            redirect(new moodle_url('/local/hubredirect/teacher_marketing.php', $consumerparams + ['unchanged' => 1]));
        }
        $application['marketplace_marketing_draft'] = $draft;
        $profile->application_json = json_encode($application, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $profile->timemodified = time();
        $DB->update_record('local_prequran_teacher_profile', $profile);
        pqtmkt_audit('teacher_marketing_submitted', (int)$profile->id, ['social_profile_url' => $socialurl]);
        set_user_preference(
            pqtmkt_preference_key((int)($consumercontext->consumerid ?? 0)),
            'pending_review',
            (int)$USER->id
        );
        redirect(new moodle_url('/local/hubredirect/teacher_marketing.php', $consumerparams + ['submitted' => 1]));
    } catch (Throwable $e) {
        $error = 'Marketing profile was not submitted: ' . $e->getMessage();
    }
}

$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'Marketplace';
$dashboardurl = new moodle_url($workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $consumerparams);
$publicurl = pqh_teacher_public_profile_url($profile, $consumercontext);
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_marketing.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Market My Services');
$PAGE->set_heading('Market My Services');
$PAGE->add_body_class('pqh-teacher-marketing-page');

@header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
@header('Pragma: no-cache');
echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-marketing-page header,body.pqh-teacher-marketing-page footer,body.pqh-teacher-marketing-page nav.navbar,body.pqh-teacher-marketing-page #page-header,body.pqh-teacher-marketing-page #page-footer,body.pqh-teacher-marketing-page .drawer,body.pqh-teacher-marketing-page .drawer-toggles{display:none!important}
body.pqh-teacher-marketing-page #page,body.pqh-teacher-marketing-page #page-content,body.pqh-teacher-marketing-page #region-main,body.pqh-teacher-marketing-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtmkt-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtmkt-wrap{max-width:1120px;margin:0 auto}.pqtmkt-top,.pqtmkt-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqtmkt-top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:22px;margin-bottom:14px}.pqtmkt-title{margin:0;font-size:30px;font-weight:950;color:#241b24}.pqtmkt-sub{margin:6px 0 0;color:#5e7280;font-weight:800}.pqtmkt-actions,.pqtmkt-form-actions{display:flex;gap:9px;flex-wrap:wrap}.pqtmkt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-weight:950;cursor:pointer}.pqtmkt-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqtmkt-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.pqtmkt-panel{padding:18px;margin-bottom:14px}.pqtmkt-panel h2{margin:0 0 12px;font-size:20px;font-weight:950}.pqtmkt-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pqtmkt-field{display:grid;gap:6px;margin-bottom:12px}.pqtmkt-field--wide{grid-column:1/-1}.pqtmkt-field label{font-size:13px;font-weight:900;color:#415665}.pqtmkt-input,.pqtmkt-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:9px 10px;font:800 14px/1.35 system-ui;color:#173044;background:#fff}.pqtmkt-input{min-height:42px}.pqtmkt-textarea{min-height:110px;resize:vertical}.pqtmkt-status{display:inline-flex;min-height:28px;align-items:center;padding:0 9px;border-radius:999px;background:#fff6de;color:#745323;font-size:12px;font-weight:950}.pqtmkt-alert{padding:12px 14px;border-radius:8px;margin-bottom:14px;font-weight:850}.pqtmkt-alert--ok{background:#edf9ef;color:#245c35}.pqtmkt-alert--bad{background:#fff0ed;color:#883526}.pqtmkt-preview h3{margin:18px 0 6px;font-size:15px}.pqtmkt-preview p{margin:0;color:#4f6472;font-weight:760;line-height:1.5;white-space:pre-line}.pqtmkt-preview a{color:#2f6f4e;font-weight:900;overflow-wrap:anywhere}
@media(max-width:820px){.pqtmkt-top{display:block}.pqtmkt-actions{margin-top:12px}.pqtmkt-grid,.pqtmkt-fields{grid-template-columns:1fr}.pqtmkt-field--wide{grid-column:auto}.pqtmkt-title{font-size:24px}}
<?php echo pqh_dashboard_header_css($workspaceid); ?>
</style>
<main class="pqtmkt-shell">
  <div class="pqtmkt-wrap">
    <section class="pqtmkt-top pqh-workspace-top">
      <div><h1 class="pqtmkt-title pqh-workspace-title">Market My Services</h1><p class="pqtmkt-sub pqh-workspace-sub"><?php echo s($brandname); ?> teacher profile</p></div>
      <div class="pqtmkt-actions pqh-workspace-actions"><a class="pqtmkt-btn pqtmkt-btn--light" href="<?php echo $publicurl->out(false); ?>">Public profile</a><a class="pqtmkt-btn" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a></div>
    </section>
    <?php if ($message !== ''): ?><div class="pqtmkt-alert pqtmkt-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqtmkt-alert pqtmkt-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <div class="pqtmkt-grid">
      <section class="pqtmkt-panel">
        <h2>Public Marketing Profile <span class="pqtmkt-status" id="pqtmkt-review-status" data-status="<?php echo s($reviewstatus); ?>"><?php echo s(pqtmkt_status_label($reviewstatus)); ?></span></h2>
        <form method="post" id="pqtmkt-marketing-form">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="submit_marketing" value="1">
          <?php foreach ($consumerparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
          <div class="pqtmkt-fields">
            <div class="pqtmkt-field"><label for="display_name">Public name</label><input class="pqtmkt-input" id="display_name" name="display_name" value="<?php echo s((string)($source['display_name'] ?? '')); ?>" required></div>
            <div class="pqtmkt-field"><label for="social_media_handle">Social media handle</label><input class="pqtmkt-input" id="social_media_handle" name="social_media_handle" value="<?php echo s((string)($source['social_media_handle'] ?? '')); ?>" placeholder="masterarabic_online"></div>
            <div class="pqtmkt-field pqtmkt-field--wide"><label for="bio">Public profile summary</label><textarea class="pqtmkt-textarea" id="bio" name="bio" required><?php echo s((string)($source['bio'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field pqtmkt-field--wide"><label for="services">Subjects and services</label><textarea class="pqtmkt-textarea" id="services" name="services" required><?php echo s((string)($source['services'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field"><label for="skills">Skills and specialties</label><textarea class="pqtmkt-textarea" id="skills" name="skills"><?php echo s((string)($source['skills'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field"><label for="pricing_summary">Pricing or package summary</label><textarea class="pqtmkt-textarea" id="pricing_summary" name="pricing_summary"><?php echo s((string)($source['pricing_summary'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field"><label for="experience">Teaching experience</label><textarea class="pqtmkt-textarea" id="experience" name="experience"><?php echo s((string)($source['experience'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field"><label for="education">Education and qualifications</label><textarea class="pqtmkt-textarea" id="education" name="education"><?php echo s((string)($source['education'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field"><label for="teaching_style">Teaching style</label><textarea class="pqtmkt-textarea" id="teaching_style" name="teaching_style"><?php echo s((string)($source['teaching_style'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field"><label for="learner_outcomes">Learner outcomes</label><textarea class="pqtmkt-textarea" id="learner_outcomes" name="learner_outcomes"><?php echo s((string)($source['learner_outcomes'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field pqtmkt-field--wide"><label for="curriculum_materials">Curriculum and materials</label><textarea class="pqtmkt-textarea" id="curriculum_materials" name="curriculum_materials"><?php echo s((string)($source['curriculum_materials'] ?? '')); ?></textarea></div>
            <div class="pqtmkt-field pqtmkt-field--wide"><label for="social_profile_url">Public social profile URL</label><input class="pqtmkt-input" id="social_profile_url" name="social_profile_url" type="url" value="<?php echo s((string)($source['social_profile_url'] ?? '')); ?>" placeholder="https://www.instagram.com/masterarabic_online"></div>
            <div class="pqtmkt-field"><label for="website_or_booking_url">Website or booking URL</label><input class="pqtmkt-input" id="website_or_booking_url" name="website_or_booking_url" type="url" value="<?php echo s((string)($source['website_or_booking_url'] ?? '')); ?>"></div>
            <div class="pqtmkt-field"><label for="demo_video_url">Introduction or demo video URL</label><input class="pqtmkt-input" id="demo_video_url" name="demo_video_url" type="url" value="<?php echo s((string)($source['demo_video_url'] ?? '')); ?>"></div>
          </div>
          <div class="pqtmkt-form-actions"><button class="pqtmkt-btn" type="submit">Submit for review</button></div>
        </form>
      </section>
      <aside class="pqtmkt-panel pqtmkt-preview">
        <h2>Profile Preview</h2>
        <h3><?php echo s((string)($source['display_name'] ?? 'Teacher')); ?></h3><p><?php echo s((string)($source['bio'] ?? '')); ?></p>
        <h3>Subjects and services</h3><p><?php echo s((string)($source['services'] ?? '')); ?></p>
        <?php if (trim((string)($source['learner_outcomes'] ?? '')) !== ''): ?><h3>Learner outcomes</h3><p><?php echo s((string)$source['learner_outcomes']); ?></p><?php endif; ?>
        <?php if (trim((string)($source['pricing_summary'] ?? '')) !== ''): ?><h3>Pricing and packages</h3><p><?php echo s((string)$source['pricing_summary']); ?></p><?php endif; ?>
        <?php if (trim((string)($source['social_profile_url'] ?? '')) !== ''): ?><h3>Online presence</h3><a href="<?php echo s((string)$source['social_profile_url']); ?>" target="_blank" rel="noopener noreferrer">@<?php echo s((string)($source['social_media_handle'] ?? 'social profile')); ?></a><?php endif; ?>
      </aside>
    </div>
  </div>
</main>
<script>
(function() {
  const badge = document.getElementById('pqtmkt-review-status');
  const form = document.getElementById('pqtmkt-marketing-form');
  if (!badge || badge.dataset.status !== 'pending_review') return;
  let dirty = false;
  if (form) form.addEventListener('input', function() { dirty = true; });
  const statusUrl = new URL(window.location.href);
  statusUrl.searchParams.set('statuscheck', '1');
  const timer = window.setInterval(async function() {
    try {
      const response = await fetch(statusUrl.toString(), {credentials: 'same-origin', cache: 'no-store'});
      if (!response.ok) return;
      const result = await response.json();
      if (!result.status || result.status === badge.dataset.status) return;
      badge.dataset.status = result.status;
      badge.textContent = result.label || result.status;
      window.clearInterval(timer);
      if (!dirty) {
        statusUrl.searchParams.delete('statuscheck');
        statusUrl.searchParams.set('reviewed', '1');
        window.location.assign(statusUrl.toString());
      }
    } catch (error) {
      // The next poll retries while the page remains open.
    }
  }, 10000);
})();
</script>
<?php echo $OUTPUT->footer();
