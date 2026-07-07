<?php
// /local/hubredirect/issue_child.php — Back-compat HTML router + audio (proxy) fast-path

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->libdir . '/externallib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');

$accountidshelper = __DIR__ . '/account_ids.php';
if (is_readable($accountidshelper)) {
    require_once($accountidshelper);
}
if (!function_exists('pqh_assign_account_id')) {
    function pqh_assign_account_id(int $userid, string $accounttype): string {
        return '';
    }
}

function b64url(string $bin): string {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function hub_current_user_ws_token(string $fallback = ''): string {
    global $DB;

    try {
        $service = $DB->get_record('external_services', [
            'shortname' => 'prequran_ws',
            'enabled' => 1,
        ]);
        if (!$service || !function_exists('external_generate_token_for_current_user')) {
            return $fallback;
        }

        $token = external_generate_token_for_current_user($service);
        if (is_object($token) && !empty($token->token)) {
            return (string)$token->token;
        }
    } catch (Throwable $e) {
        return $fallback;
    }

    return $fallback;
}

function hub_origin_from_url(string $url): string {
    $p = parse_url($url);
    if (!empty($p['scheme']) && !empty($p['host'])) {
        return $p['scheme'] . '://' . $p['host'] . (!empty($p['port']) ? (':' . $p['port']) : '');
    }
    return '';
}

function hub_custom_profile_value($profile, array $shortnames): string {
    foreach ($shortnames as $name) {
        if (isset($profile->{$name}) && $profile->{$name} !== '' && $profile->{$name} !== null) {
            return trim((string)$profile->{$name});
        }
    }
    return '';
}

function hub_normalize_language(string $value): string {
    $raw = strtolower(trim(str_replace('_', '-', $value)));
    $first = explode('-', $raw)[0] ?? '';
    $aliases = [
        'english' => 'en', 'eng' => 'en', 'en' => 'en',
        'arabic' => 'ar', 'ar' => 'ar',
        'somali' => 'so', 'som' => 'so', 'so' => 'so',
        'swahili' => 'sw', 'kiswahili' => 'sw', 'swa' => 'sw', 'sw' => 'sw',
        'punjabi' => 'pa', 'panjabi' => 'pa', 'pa' => 'pa',
        'urdu' => 'ur', 'ur' => 'ur',
    ];
    $code = $aliases[$raw] ?? ($aliases[$first] ?? $first);
    return in_array($code, ['en', 'ar', 'so', 'sw', 'pa', 'ur'], true) ? $code : 'en';
}

function hub_normalize_language_scope(string $value): string {
    $raw = strtolower(trim(preg_replace('/[\s\-]+/', '_', $value)));
    $aliases = [
        'ui' => 'ui',
        'interface' => 'ui',
        'ui_only' => 'ui',
        'content' => 'content',
        'lecture' => 'content',
        'lectures' => 'content',
        'message' => 'content',
        'messages' => 'content',
        'only_lectures' => 'content',
        'lectures_and_messages' => 'content',
        'content_messages' => 'content',
        'both' => 'both',
        'all' => 'both',
        'ui_and_content' => 'both',
    ];
    return $aliases[$raw] ?? 'both';
}

function hub_table_exists(string $tablename): bool {
    global $DB;

    try {
        return $DB->get_manager()->table_exists($tablename);
    } catch (Throwable $e) {
        return false;
    }
}

function hub_table_has_field(string $table, string $field): bool {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function hub_enrollment_approval_status(int $studentid): array {
    global $DB;
    $status = [
        'approved' => true,
        'reason' => 'legacy_or_not_required',
        'guardianid' => 0,
    ];

    if ($studentid <= 0) {
        return $status;
    }

    $profileexists = false;
    if (hub_table_exists('local_prequran_student_profile')) {
        $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
        if ($profile) {
            $profileexists = true;
            if (hub_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
                $profileapproval = strtolower(trim((string)($profile->enrollment_approval_status ?? '')));
                if ($profileapproval === 'approved') {
                    return ['approved' => true, 'reason' => 'profile_approved', 'guardianid' => 0];
                }
                if ($profileapproval === 'pending_parent') {
                    $status['approved'] = false;
                    $status['reason'] = 'profile_pending_parent';
                }
            }
        }
    }

    if (hub_table_exists('local_prequran_live_consent')) {
        $approval = $DB->get_record_sql(
            "SELECT *
               FROM {local_prequran_live_consent}
              WHERE studentid = :studentid
                AND consent_type = :type
           ORDER BY granted DESC, timemodified DESC, id DESC",
            ['studentid' => $studentid, 'type' => 'enrollment_approval'],
            IGNORE_MULTIPLE
        );
        if ($approval) {
            return [
                'approved' => (int)$approval->granted === 1,
                'reason' => (int)$approval->granted === 1 ? 'consent_approved' : 'consent_pending_parent',
                'guardianid' => (int)($approval->guardianid ?? 0),
            ];
        }
        $guardianid = (int)$DB->get_field_sql(
            "SELECT guardianid
               FROM {local_prequran_live_consent}
              WHERE studentid = ?
           ORDER BY timemodified DESC, id DESC",
            [$studentid],
            IGNORE_MULTIPLE
        );
        if ($guardianid > 0) {
            $status['guardianid'] = $guardianid;
        }
    }

    if (hub_table_exists('local_prequran_comm_consent')) {
        $guardianid = (int)$DB->get_field_sql(
            "SELECT guardianid
               FROM {local_prequran_comm_consent}
              WHERE studentid = ?
           ORDER BY timemodified DESC, id DESC",
            [$studentid],
            IGNORE_MULTIPLE
        );
        if ($guardianid > 0 && empty($status['guardianid'])) {
            $status['guardianid'] = $guardianid;
        }
    }

    if ($profileexists && !$status['approved']) {
        return $status;
    }

    return $status;
}

function hub_render_enrollment_pending_page(int $studentid, array $approval): void {
    global $OUTPUT, $PAGE;

    $PAGE->set_context(context_system::instance());
    $PAGE->set_url(new moodle_url('/local/hubredirect/issue_child.php'));
    $PAGE->set_pagelayout('standard');
    $PAGE->set_title('Enrollment Approval Needed');
    $PAGE->set_heading('Enrollment Approval Needed');
    $PAGE->add_body_class('pqh-enrollment-pending-page');

    echo $OUTPUT->header();
    $dashboardurl = (new moodle_url('/local/hubredirect/dashboard.php'))->out(false);
    $studentname = 'Student';
    try {
        $user = core_user::get_user($studentid);
        if ($user) {
            $studentname = fullname($user);
        }
    } catch (Throwable $e) {
        $studentname = 'Student';
    }
    ?>
<style>
body.pqh-enrollment-pending-page header,body.pqh-enrollment-pending-page footer,body.pqh-enrollment-pending-page nav.navbar,body.pqh-enrollment-pending-page #page-header,body.pqh-enrollment-pending-page #page-footer,body.pqh-enrollment-pending-page .drawer,body.pqh-enrollment-pending-page .drawer-toggles,body.pqh-enrollment-pending-page .block-region,body.pqh-enrollment-pending-page [data-region="drawer"],body.pqh-enrollment-pending-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-enrollment-pending-page #page,body.pqh-enrollment-pending-page #page-content,body.pqh-enrollment-pending-page #region-main,body.pqh-enrollment-pending-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqep-shell{min-height:100vh;padding:42px 18px;background:#f3fbf4;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqep-card{max-width:760px;margin:0 auto;background:#fff;border:1px solid rgba(122,86,55,.18);border-radius:10px;box-shadow:0 16px 38px rgba(23,48,68,.08);padding:28px}.pqep-logo{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:#7a5637;color:#fff;font-weight:950;margin-bottom:14px}.pqep-kicker{margin:0 0 8px;color:#7a5637;font-size:13px;font-weight:950;text-transform:uppercase}.pqep-title{margin:0;color:#241b24;font-size:34px;line-height:1.1;font-weight:950}.pqep-sub{margin:12px 0 18px;color:#5d6f5c;font-size:16px;font-weight:850;line-height:1.5}.pqep-panel{padding:16px;border:1px dashed rgba(122,86,55,.26);border-radius:9px;background:#fffaf0;margin:14px 0;font-weight:850}.pqep-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.pqep-btn{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 16px;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:15px;font-weight:950}.pqep-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
</style>
<main class="pqep-shell">
  <section class="pqep-card">
    <div class="pqep-logo">QA</div>
    <p class="pqep-kicker">Enrollment approval needed</p>
    <h1 class="pqep-title">Almost ready, <?php echo s($studentname); ?></h1>
    <p class="pqep-sub">A parent or guardian must approve this enrollment before lessons can begin. This protects the student record and confirms the family understands how lessons, progress, audio recording, and video consent are handled.</p>
    <div class="pqep-panel">Please ask the linked parent or guardian to sign in and approve the enrollment from their dashboard or approval link.</div>
    <div class="pqep-actions">
      <a class="pqep-btn" href="<?php echo s($dashboardurl); ?>">Back to dashboard</a>
    </div>
  </section>
</main>
    <?php
    echo $OUTPUT->footer();
    exit;
}

function hub_activeish_status_clause(string $field = 'status'): array {
    return [
        '(' . $field . ' IS NULL OR ' . $field . " = '' OR " . $field . ' NOT IN (?, ?, ?, ?, ?))',
        ['rejected', 'archived', 'inactive', 'suspended', 'deleted'],
    ];
}

function hub_current_user_prequran_teacher_sources(int $userid): array {
    global $DB;

    $sources = [
        'teacher_profile' => false,
        'teacher_student_assignment' => false,
        'class_group_assignment' => false,
        'live_teacher_record' => false,
    ];

    if ($userid <= 0) {
        return $sources;
    }

    try {
        [$statussql, $statusparams] = hub_activeish_status_clause();

        if (hub_table_exists('local_prequran_teacher_profile')) {
            $sources['teacher_profile'] = $DB->record_exists_select(
                'local_prequran_teacher_profile',
                'userid = ? AND ' . $statussql,
                array_merge([$userid], $statusparams)
            );
        }

        if (hub_table_exists('local_prequran_teacher_student')) {
            $sources['teacher_student_assignment'] = $DB->record_exists_select(
                'local_prequran_teacher_student',
                'teacherid = ? AND ' . $statussql,
                array_merge([$userid], $statusparams)
            );
        }

        if (hub_table_exists('local_prequran_class_group')) {
            $sources['class_group_assignment'] = $DB->record_exists_select(
                'local_prequran_class_group',
                'teacherid = ? AND ' . $statussql,
                array_merge([$userid], $statusparams)
            );
        }

        foreach (['local_prequran_live_session', 'local_prequran_live_series', 'local_prequran_live_availability'] as $table) {
            if ($sources['live_teacher_record']) {
                break;
            }
            if (hub_table_exists($table)) {
                $sources['live_teacher_record'] = $DB->record_exists_select(
                    $table,
                    'teacherid = ? AND ' . $statussql,
                    array_merge([$userid], $statusparams)
                );
            }
        }
    } catch (Throwable $e) {
        return $sources;
    }

    return $sources;
}

function hub_current_user_has_prequran_teacher_assignment(int $userid): bool {
    return in_array(true, hub_current_user_prequran_teacher_sources($userid), true);
}

function hub_current_user_can_use_nonproduction_qa_tools(): bool {
    global $DB, $USER;

    try {
        if (is_siteadmin((int)$USER->id)) {
            return true;
        }

        if (hub_current_user_has_prequran_teacher_assignment((int)$USER->id)) {
            return true;
        }

        $syscontext = context_system::instance();
        if (has_capability('local/prequran:resetstep', $syscontext)) {
            return true;
        }

        return $DB->record_exists_sql(
            "SELECT 1
               FROM {role_assignments} ra
               JOIN {role} r ON r.id = ra.roleid
          LEFT JOIN {role_capabilities} rc ON rc.roleid = r.id
              WHERE ra.userid = :userid
                AND (
                    r.shortname IN (
                        'admin', 'administrator', 'manager', 'coursecreator',
                        'editingteacher', 'teacher', 'noneditingteacher'
                    )
                    OR r.archetype IN ('manager', 'coursecreator', 'editingteacher', 'teacher')
                    OR rc.capability IN (
                        'local/prequran:resetstep',
                        'moodle/course:update',
                        'moodle/course:manageactivities',
                        'moodle/role:assign'
                    )
                )",
            ['userid' => (int)$USER->id]
        );
    } catch (Throwable $e) {
        return false;
    }
}

function hub_current_user_nonproduction_qa_debug(): array {
    global $DB, $USER;

    $userid = (int)($USER->id ?? 0);
    $syscontext = context_system::instance();
    $siteadmin = $userid > 0 && is_siteadmin($userid);
    $prequranteachersources = hub_current_user_prequran_teacher_sources($userid);
    $prequranteacher = in_array(true, $prequranteachersources, true);
    $hasresetstep = false;
    $rolematch = false;

    try {
        $hasresetstep = has_capability('local/prequran:resetstep', $syscontext);
    } catch (Throwable $e) {
        $hasresetstep = false;
    }

    try {
        $rolematch = $DB->record_exists_sql(
            "SELECT 1
               FROM {role_assignments} ra
               JOIN {role} r ON r.id = ra.roleid
          LEFT JOIN {role_capabilities} rc ON rc.roleid = r.id
              WHERE ra.userid = :userid
                AND (
                    r.shortname IN (
                        'admin', 'administrator', 'manager', 'coursecreator',
                        'editingteacher', 'teacher', 'noneditingteacher'
                    )
                    OR r.archetype IN ('manager', 'coursecreator', 'editingteacher', 'teacher')
                    OR rc.capability IN (
                        'local/prequran:resetstep',
                        'moodle/course:update',
                        'moodle/course:manageactivities',
                        'moodle/role:assign'
                    )
                )",
            ['userid' => $userid]
        );
    } catch (Throwable $e) {
        $rolematch = false;
    }

    return [
        'logged_user_id' => $userid,
        'is_siteadmin' => $siteadmin,
        'has_prequran_teacher_assignment' => $prequranteacher,
        'has_prequran_teacher_profile' => $prequranteachersources['teacher_profile'] ?? false,
        'has_prequran_teacher_student_assignment' => $prequranteachersources['teacher_student_assignment'] ?? false,
        'has_prequran_class_group_assignment' => $prequranteachersources['class_group_assignment'] ?? false,
        'has_prequran_live_teacher_record' => $prequranteachersources['live_teacher_record'] ?? false,
        'has_resetstep_capability' => $hasresetstep,
        'has_qa_role_match' => $rolematch,
    ];
}

function hub_user_account_identity(stdClass $user): array {
    $userid = (int)($user->id ?? 0);
    $accountid = trim((string)($user->idnumber ?? ''));
    $accounttype = '';
    if (preg_match('/^EA-(STU|TCH|PAR)-\d{4}-\d+$/', $accountid, $matches)) {
        $accounttype = ['STU' => 'student', 'TCH' => 'teacher', 'PAR' => 'parent'][$matches[1]] ?? '';
    }
    if ($accountid === '') {
        $accounttype = hub_resolve_user_account_type($userid);
        if ($accounttype === '' && !empty($GLOBALS['pq_managed_to_send'])) {
            $accounttype = 'student';
        }
        if ($accounttype === '' && !empty($GLOBALS['pq_can_skip_step_to_send'])) {
            $accounttype = 'teacher';
        }
        if ($accounttype !== '') {
            $accountid = pqh_assign_account_id($userid, $accounttype);
        }
    }
    $label = ['student' => 'Student ID', 'teacher' => 'Teacher ID', 'parent' => 'Parent ID'][$accounttype] ?? 'Account ID';

    return [
        'account_id' => $accountid,
        'account_type' => $accounttype,
        'account_label' => $label,
    ];
}

function hub_resolve_user_account_type(int $userid): string {
    global $DB;

    if ($userid <= 0) {
        return '';
    }

    try {
        if (hub_table_exists('local_prequran_student_profile')
            && $DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
            return 'student';
        }
        if (hub_current_user_has_prequran_teacher_assignment($userid)) {
            return 'teacher';
        }
        if (hub_table_exists('local_prequran_live_consent')
            && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid])) {
            return 'parent';
        }
        if (hub_table_exists('local_prequran_comm_consent')
            && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid])) {
            return 'parent';
        }
    } catch (Throwable $e) {
        return '';
    }

    return '';
}

function hub_normalize_environment(string $value): string {
    $env = strtolower(trim($value));
    return in_array($env, ['integration', 'staging', 'production'], true) ? $env : 'production';
}

function hub_bunny_environment_base_path(string $env): string {
    $env = hub_normalize_environment($env);
    $configured = trim((string)get_config('local_prequran', 'bunny_base_' . $env));
    if ($configured === '') {
        $configured = [
            'integration' => '/pre_quraan_integration/',
            'staging' => '/pre_quraan_staging/',
            'production' => '/pre_quraan/',
        ][$env] ?? '/pre_quraan/';
    }
    return '/' . trim($configured, '/') . '/';
}

function hub_cdn_base_url(string $env): string {
    $env = hub_normalize_environment($env);
    return pqh_shared_resource_cdn_base_url($env);
}

function hub_selected_environment(): string {
    $requestedRaw = optional_param('pq_env', '', PARAM_ALPHANUMEXT);
    if ($requestedRaw === '') {
        $requestedRaw = optional_param('env', '', PARAM_ALPHANUMEXT);
    }
    if ($requestedRaw === '') {
        $requestedRaw = optional_param('pq_environment', '', PARAM_ALPHANUMEXT);
    }
    if ($requestedRaw !== '') {
        return hub_normalize_environment($requestedRaw);
    }
    return hub_normalize_environment((string)get_config('local_prequran', 'bunny_environment'));
}

function hub_rewrite_bunny_environment_path(string $path, string $env): string {
    $base = hub_bunny_environment_base_path($env);

    if (preg_match('~^https?://~i', $path)) {
        $parts = parse_url($path);
        $host = strtolower((string)($parts['host'] ?? ''));
        if (!pqh_is_known_resource_host($host) || empty($parts['path'])) {
            return $path;
        }

        $rewrittenPath = preg_replace(
            '~^/(pre_quraan|pre_quraan_staging|pre_quraan_integration)(/|$)~',
            rtrim($base, '/') . '$2',
            $parts['path']
        );
        $rebuilt = pqh_shared_resource_cdn_base_url($env);
        $rebuilt .= $rewrittenPath;
        if (!empty($parts['query'])) {
            $rebuilt .= '?' . $parts['query'];
        }
        if (!empty($parts['fragment'])) {
            $rebuilt .= '#' . $parts['fragment'];
        }
        return $rebuilt;
    }

    if ($path === '') {
        return $path;
    }

    return preg_replace(
        '~^/(pre_quraan|pre_quraan_staging|pre_quraan_integration)(/|$)~',
        rtrim($base, '/') . '$2',
        $path
    );
}

function hub_render_lesson_iframe_wrapper(
    string $iframeSrc,
    ?int $uidToSend,
    string $wsTokenToSend,
    string $wsEndpoint,
    string $iframeOrigin = '*',
    string $title = 'Lesson',
    bool $canSkipStepForQa = false
): void {
    header('Content-Type: text/html; charset=utf-8');
    $resourceOrigins = array_map(static function(string $origin): string {
        return '"' . $origin . '"';
    }, pqh_resource_allowed_origins());
    $permissionsOrigins = implode(' ', $resourceOrigins);
    $featureOrigins = implode(' ', pqh_resource_allowed_origins());
    header('Permissions-Policy: microphone=(self ' . $permissionsOrigins . '), autoplay=(self ' . $permissionsOrigins . ')');
    header("Feature-Policy: microphone 'self' " . $featureOrigins);

    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title><?php echo htmlspecialchars($title, ENT_QUOTES); ?></title>
  <style>
    html,body{
      margin:0;
      height:100%;
      background:linear-gradient(180deg,#f7fbff 0%, #fff8da 100%);
    }
    #pqBootLoader{
      position:fixed;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg,#f7fbff 0%, #fff8da 100%);
      color:#17324a;
      font:800 20px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
      z-index:10;
    }
    .frame{
      position:fixed;
      inset:0;
      border:0;
      width:100%;
      height:100%;
      background:transparent;
    }
    body.pq-frame-ready #pqBootLoader{
      display:none;
    }
  </style>
</head>
<body>
  <div id="pqBootLoader" aria-live="polite">Loading lesson…</div>

  <iframe
    id="lessonFrame"
    class="frame"
    src="<?php echo htmlspecialchars($iframeSrc, ENT_QUOTES); ?>"
    allow="microphone; autoplay; fullscreen"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"></iframe>

  <script>
  (function PQTokenBroker(){
    const frame = document.getElementById('lessonFrame');
    if(!frame) return;

    const targetOrigin = <?php echo json_encode($iframeOrigin ?: '*'); ?>;

    const payload = {
      type: "PQ_TOKENS",
      uid: <?php echo json_encode($uidToSend); ?>,
      wstoken: <?php echo json_encode($wsTokenToSend); ?>,
      wsendpoint: <?php echo json_encode($wsEndpoint); ?>,
      cohortid: <?php echo json_encode($GLOBALS['pq_cohortid_to_send'] ?? 0); ?>,
      studentid: <?php echo json_encode($uidToSend); ?>,
      live_sessionid: <?php echo json_encode($GLOBALS['pq_live_sessionid_to_send'] ?? 0); ?>,
      managed: <?php echo json_encode($GLOBALS['pq_managed_to_send'] ?? 0); ?>,
      pq_env: <?php echo json_encode($GLOBALS['pq_environment_to_send'] ?? 'production'); ?>,
      pq_can_skip_step: <?php echo json_encode($canSkipStepForQa ? 1 : 0); ?>,
      account_id: <?php echo json_encode($GLOBALS['pq_account_id_to_send'] ?? ''); ?>,
      account_type: <?php echo json_encode($GLOBALS['pq_account_type_to_send'] ?? ''); ?>,
      account_label: <?php echo json_encode($GLOBALS['pq_account_label_to_send'] ?? 'Account ID'); ?>,
      ts: Date.now()
    };

    let iframeLoaded = false;

    function tryPost(win, msg, origin){
      try {
        win.postMessage(msg, origin);
        return true;
      } catch (e1) {
        try {
          win.postMessage(msg, '*');
          return true;
        } catch (e2) {
          return false;
        }
      }
    }

    function send(){
      if(!iframeLoaded && targetOrigin !== '*') return false;
      try{
        if(!frame.contentWindow) return false;
        return tryPost(frame.contentWindow, payload, targetOrigin);
      }catch(e){
        return false;
      }
    }

    frame.addEventListener('load', function(){
      iframeLoaded = true;
      try {
        document.body.classList.add('pq-frame-ready');
      } catch(e) {}
      send();
    });

    window.addEventListener('message', function(ev){
      if(!iframeLoaded) return;
      if(ev.source !== frame.contentWindow) return;
      const msg = ev.data || {};
      if(msg.type === "PQ_REQUEST_TOKENS") {
        send();
        return;
      }
      if(msg.type === "PQ_SAVE_QUIZ_EVENT") {
        try {
          const event = msg.event || {};
          const body = new URLSearchParams();
          body.set("moodlewsrestformat", "json");
          body.set("wsfunction", "local_prequran_save_quiz_event");
          body.set("wstoken", payload.wstoken || "");
          body.set("userid", String(payload.uid || ""));
          body.set("event_type", String(event.event_type || ""));
          body.set("payload_json", JSON.stringify(event.payload || {}));
          body.set("pq_env", String(payload.pq_env || "production"));
          fetch(payload.wsendpoint, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body
          }).then(function(res){
            return res.text().then(function(text){
              let ok = res.ok;
              let message = text;
              try {
                const parsed = JSON.parse(text);
                if (parsed && (parsed.exception || parsed.errorcode || parsed.ok === false)) {
                  ok = false;
                  message = parsed.message || parsed.error || parsed.exception || text;
                }
              } catch(e) {}
              tryPost(frame.contentWindow, {
                type: "PQ_SAVE_QUIZ_RESULT",
                ok: ok,
                status: res.status,
                body: String(message || '').slice(0, 240)
              }, targetOrigin);
            });
          }).catch(function(error){
            tryPost(frame.contentWindow, {
              type: "PQ_SAVE_QUIZ_RESULT",
              ok: false,
              status: 0,
              body: error && error.message ? error.message : "Quiz analytics save failed"
            }, targetOrigin);
          });
        } catch (e) {
          tryPost(frame.contentWindow, {
            type: "PQ_SAVE_QUIZ_RESULT",
            ok: false,
            status: 0,
            body: e && e.message ? e.message : "Quiz analytics save failed"
          }, targetOrigin);
        }
      }
    });

    let tries = 0, maxTries = 50;
    const t = setInterval(function(){
      tries++;
      if(send() || tries >= maxTries) clearInterval(t);
    }, 100);
  })();
  </script>
</body>
</html>
<?php
    exit;
}

// Load centralized settings
$localCfg = __DIR__ . '/config.local.php';
if (is_file($localCfg)) {
    require_once $localCfg;
}

// Settings with fallbacks
$pqEnvironment = hub_selected_environment();
$cdnBase        = hub_cdn_base_url($pqEnvironment);
$HTML_SIGN_MODE = defined('HUB_BUNNY_SIGN_MODE')? HUB_BUNNY_SIGN_MODE: 'urltoken';
$secKey         = defined('HUB_BUNNY_URLTOKEN_KEY') ? HUB_BUNNY_URLTOKEN_KEY : '';
$useIpBind      = defined('HUB_BUNNY_IPBIND')   ? HUB_BUNNY_IPBIND   : false;
$signHtml       = defined('HUB_BUNNY_SIGN_HTML')? HUB_BUNNY_SIGN_HTML: true;
$ttlCdn         = defined('HUB_BUNNY_TTL_CDN')  ? (int)HUB_BUNNY_TTL_CDN  : 300;
$ttlMTok        = defined('HUB_MTOKEN_TTL')     ? (int)HUB_MTOKEN_TTL     : 120;
$pqBunnyBasePath = hub_bunny_environment_base_path($pqEnvironment);

// Where the audio proxy might live
$audioProxyCandidates = [
    __DIR__ . '/../audio/audio_proxy.php',
    __DIR__ . '/audio/audio_proxy.php',
];

/* Whitelist slugs */
$map = [
    // NOTE: Use versioned HTML filenames (e.g., *_v1.0.2.html) to avoid CDN/browser cache issues.
    // --- Core video / audio tools ---
    'video'              => '/pre_quraan/scripts/newui_letter_video_recorder15.html',
    'voice'              => '/pre_quraan/scripts/newui_letter_voice_recorder6_upload.html',

    // --- Alphabet core lessons ---
    'alphabet_lecture'   => '/pre_quraan/scripts/newui_alphabet_letters08.html',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/html_locked_test_v0.0.2.html?managed=1&v=0.0.30',
    
    //'alphabet_listen' => '/pre_quraan/scripts/html_locked_test_v0.0.3.html?managed=1&v=0.0.30',
    
    //'alphabet_listen' => '/pre_quraan/scripts/alphabet_listen_vNext_runner_test_v1.4.html?managed=1&v=0.0.13',
    
   // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_shared_design_v0-001.html?managed=1&v=0.0.18',
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_shared_design_working_copy_v0-001.html?managed=1&v=0.0.39',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_v001.html?managed=1&v=0.0.58',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_unmanaged_v001.html?managed=1&v=0.0.76',
    
     // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_unmanaged_v001_debug.html?managed=1&v=0.0.79',
     
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_sqa_final_v1.0.0.html?managed=1&v=0.0.89',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_v0.0.html?managed=1&v=0.0.115',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_html_v0.0_MOBILE_GUARD_FILTER_APPLY_FIX.html?managed=1&v=20260425_80',
    
     
    'alphabet_listen' => '/pre_quraan/scripts/alphabet_listen_alphabet-phonetics-completefix-20260620a.html',
    // sssss s
    
     
    //  'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_html_v0.0.1.html?managed=1&v=20260425_74',
    
    // sss sssssss
    // new working copy
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_shared_design_v0-001 - working_copy.html?managed=1&v=1.0.46',
    
    // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_v1.0.2.html?managed=1&v=2.0.13',
    // 
   // 'alphabet_listen' => '/pre_quraan/scripts/pq_unit_alphabet_listen_v1.0.7.html?managed=1&v=2.0.17',
    //  17
//     
// 'alphabet_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_v1.0.0.html?managed=1&v=1.0.23',

//'alphabet_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_v1.0.0.html?managed=1&v=1.0.24',

// 'alphabet_watch' => '/pre_quraan/scripts/pq_unit_alphabet_watch_v1.0.1.html?managed=1&v=1.0.33',

// ttt
// 'alphabet_watch' => '/pre_quraan/scripts/pq_unit_alphabet_watch_v1.0.1_debug.html?managed=1&v=1.0.39',

'alphabet_watch' => '/pre_quraan/scripts/pq_unit_alphabet_watch_sqa_final_v1.0.0.html?managed=1&v=1.0.49',
// ss

    
    // 'alphabet_listen'    => '/pre_quraan/scripts/alphabet_letters_listen_v2.html',
 //   'match01'            => '/pre_quraan/scripts/alphabet_match_v008.html?v=20251208001',

// 'match01'            => '/pre_quraan/scripts/pq_unit_alphabet_match_match_v1.1.0.html?managed=1&v=20251208032',

// 'match01'            => '/pre_quraan/scripts/pq_unit_alphabet_match_match_v1.1.0.html?managed=1&v=20251208041',

'match01'            => '/pre_quraan/scripts/pq_unit_alphabet_match_sqa_final_v1.0.0.html?managed=1&v=20251208042',
'alphabet_quiz_chatbot' => '/pre_quraan/scripts/alphabet_quiz_chatbot_unlocked_20260613b.html?managed=1&v=20260613b',

// ss


    // Alphabet Order + Trans pages go directly to the current Moodle host (no Bunny).
    'alphabet_order'     => '/mod/page/view.php?id=345&inpopup=1',
    'alphabet_trans1'    => '/mod/page/view.php?id=344&inpopup=1',
    'alphabet_trans2'    => '/mod/page/view.php?id=342&inpopup=1',


    // 'speak01'            => '/pre_quraan/scripts/alphabet_speak_v9.html',
    
    // 'speak01'            => '/pre_quraan/scripts/pq_unit_alphabet_speak_v1.7.2.html?managed=1&v=202512080520',
    //   ssss
    
    // 'speak01'            => '/pre_quraan/scripts/pq_unit_alphabet_speak_v1.7.2.html?managed=1&v=202512080544',
    //   sss
    
    'speak01'            => '/pre_quraan/scripts/pq_unit_alphabet_speak_sqa_final_v1.0.1.html?managed=1&v=202512080554',
    
    
    // 'write03'            => '/pre_quraan/scripts/alphabet_write_ws10.html',
    // sssss
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_write_v1.3.2_patched_v4b.html?managed=1&v=202512080548',
    
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_write_v1.3.2_patched_v4_shell.html?managed=1&v=202512080558',
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE.html?managed=1&pqdebug=1&v=2025120872',
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE_backup.html?managed=1&pqdebug=1&v=2025120876',
    
    //   'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE_backup5.html?managed=1&pqdebug=1&v=2025120936',
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_v1.0.5_STABLE_backup5_PATCHED.html?managed=1&pqdebug=1&v=2025120947',
    
    // ss
    // shss
    
    
    // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_sqa_final_v1.0.7.html?managed=1&v=2025120929',
    // ss
    
   // 'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_sqa_final_new_v1.0.1.html?managed=1&v=2025120932',
    // ss
    
    'write03'            => '/pre_quraan/scripts/pq_unit_alphabet_write_sqa_final_new2_v1.0.0.html?managed=1&v=2025120950',
    // ss
    
    // Alphabet Dots (used by menu, adjust if you have a different file name)
    'alphabet_dots'      => '/pre_quraan/scripts/alphabet_dots1.html',

    // Alphabet diacritics
    //'diacritics01'       => '/pre_quraan/scripts/arabic_diacritics7.html',
    
    // Alphabet diacritics
    // 'diacritics01'       => '/pre_quraan/scripts/pq_unit_arabic_diacritics_listen_sqa_final_v1.0.1.html?managed=1&v=2025120965',
    
    //'diacritics01'       => '/pre_quraan/scripts/pq_unit_arabic_diacritics_write_sqa_final_v1.0.1.html?managed=1&v=2025120972',
    
      'diacritics01'       => '/pre_quraan/scripts/pq_unit_arabic_diacritics_listen_sqa_final_v1.0.13.html?managed=1&v=2025120993',


    // --- Harakat (Movements) ---
    // Managed Harakat Listen (PROD)
    'harakat_listen'      => '/pre_quraan/scripts/pq_unit_harakat_listen_v1.0_15.html?managed=1',

    // Managed Harakat Listen (TEST) - pass uid + wstoken explicitly for test harness stability
    // 'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_runner_test_v1.4.html?managed=1&v=0.0.35',
    //'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_managed_runner_test_v1.0.2.html?managed=1&v=0.0.1',
    // 'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_runner_test_v1.4.html?managed=1&v=0.0.36',
    
    // 'harakat_listen' => '/pre_quraan/scripts/harakat_listen_vNext_runner_test_v1.4_1.html?managed=1&v=0.0.37',
    
    // 'harakat_listen' => '/pre_quraan/scripts/pq_unit_harakat_listen_v1.0.2_standardized.html?managed=1&v=0.0.41',
    
    // 'harakat_listen' => '/pre_quraan/scripts/pq_unit_harakat_listen_v1.0.2_standardized.html?managed=1&v=0.0.44',
    
    //          sss
    
     'harakat_listen' => '/pre_quraan/scripts/pq_unit_harakat_listen_sqa_final_v1.0.0.html?managed=1&v=0.0.50',
    
    //          sss
    
    // Legacy / other Harakat pages
    // 'harakat_watch'       => '/pre_quraan/scripts/harakat_watch_v001.html',
    
    // 'harakat_match'       => '/pre_quraan/scripts/harakat_match_v005.html',
    
    // 'harakat_match' => '/pre_quraan/scripts/pq_unit_harakat_match_match_v1.1.0_clean2.html?managed=1&v=0.0.54',
    // ssss
    
     
    'harakat_match' => '/pre_quraan/scripts/pq_unit_harakat_match_sqa_final_v1.0.0.html?managed=1&v=0.0.56',
    // ssss
    
    // 'harakat_speak'       => '/pre_quraan/scripts/harakat_speak_v002.html',
    
    'harakat_speak' => '/pre_quraan/scripts/pq_unit_harakat_speak_v1.0.0_FINAL2.html?managed=1&v=0.0.63',
    
   // sss
   
   'harakat_speak' => '/pre_quraan/scripts/pq_unit_harakat_speak_sqa_final_v1.0.0.html?managed=1&v=0.0.64',
    
   // sss
    
    // 'harakat_video'       => '/pre_quraan/scripts/harakat_video_practice.html',
    // 'harakat_voice'       => '/pre_quraan/scripts/harakat_voice_practice.html',
    
    
    // 'harakt_write01'      => '/pre_quraan/scripts/newui_harakt_writing04.html',
    
    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_v1.0.5_clone_from_alphabet_write.html?managed=1&v=0.0.64',
    
    // sssss
    
    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_v1.0.0_CLONE_from_aw_v11.html?managed=1&v=0.0.107',
    
    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_sqa_final_v1.0.5_MODELED_AFTER_ALPHABET_LISTEN.html?managed=1&v=0.0.113',

    // 'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_sqa_final_v1.0.9_MODELED_AFTER_ALPHABET_LISTEN_SERVERPDF.html?managed=1&v=0.0.122',
    
    'harakt_write01' => '/pre_quraan/scripts/pq_unit_harakat_write_sqa_final_v1.2.2.html?managed=1&v=0.0.149',
    
    
    
    // ssssssss
    
    // 'harakat_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_v1.0.1_arabic_filenames_lecturefix_src5.html?managed=1&v=1.0.62',
    
    // 'harakat_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_standarized_v1.0.2.html?managed=1&v=1.0.26',
    // test23
    
    'harakat_watch' => '/pre_quraan/scripts/pq_unit_harakat_watch_sqa_final_v1.0.0.html?managed=1&v=1.0.29',
    // test23
   

// --- Joint Letters ---
// --- Joint Letters ---
  //  'connections04'      => '/pre_quraan/scripts/newui_letter_connections14.html',
    
  //  'connections_ws'     => '/pre_quraan/scripts/newui_connections_worksheet22_mobile3.html',
    
  // 'connections_ws'     => '/pre_quraan/scripts/newui_connections_worksheet22_mobile3.html',
  
  
    // 'connections_ws' => '/pre_quraan/scripts/pq_unit_joint_connecting_forms_v1.0.0.html?managed=1&v=1.0.33',
    // test2
    
   // 'connections_ws'     => '/pre_quraan/scripts/newui_connections_worksheet22_mobile3_split.html?&v=1.0.37',
    
    
   // 'connections_ws'     => '/pre_quraan/scripts/pq_unit_connections_worksheet_sqa_final_v1.0.3.html?managed=1&v=1.0.37',
  
    'connections_ws'     => '/pre_quraan/scripts/pq_unit_joint_connecting_forms_sqa_final_v1.0.0.html?managed=1&v=1.0.44',
    

   // 'two_joined1'        => '/pre_quraan/scripts/joint_letters_v015.html',
    
    // 'two_joined1'        => '/pre_quraan/scripts/pq_unit_two_joined_letters_sqa_final_v1.0.1.html?managed=1&v=1.0.33',
    // ssss
    
    // 'two_joined1'        => '/pre_quraan/scripts/pq_unit_two_joint_letters_listen_sqa_final_v1.0.1.html?managed=1&v=1.0.58',
    // ssss
    
    'two_joined1'        => '/pre_quraan/scripts/pq_unit_two_joined_letters_sqa_final_v1.0.1.html?managed=1&v=1.0.96',
    // ssss
    
    // 'three_joined1'      => '/pre_quraan/scripts/three_joined_letters4.html',
    
  
    //'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.41',
    
    // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.41',
    
    
    // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.41',
    
   // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_letters_joined_listen_sqa_final_v1.0.3.html?managed=1&v=1.0.42',
    
    // 'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_joined_letters_sqa_final_v1.0.0.html?managed=1&v=1.0.42',
    
  //  'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_joined_letters_sqa_final_v1.0.0.html?managed=1&v=1.0.61',
    
   'three_joined1'      => '/pre_quraan/scripts/pq_unit_three_joined_letters_sqa_final_v1.0.1.html?managed=1&v=1.0.66',
   
   
   // 'four_joined2'       => '/pre_quraan/scripts/four_joined_letters.html',
    
    'four_joined2'       => '/pre_quraan/scripts/pq_unit_four_joined_letters_sqa_final_v1.0.3_4col.html?managed=1&v=1.0.45',

    // -------------------------------------------------------------------------
    // RULES / TAJWEED — ROOT SLUGS (same as before)
    // -------------------------------------------------------------------------
    //'muqattaat1'         => '/pre_quraan/scripts/muqattiat_listen_v001.html',
	
	// 'muqattiat_listen' => '/pre_quraan/scripts/pq_unit_muqattiat_listen_v1.4.35.html?managed=1&v=1.4.38',
//	'muqattiat_listen' => '/pre_quraan/scripts/muqattiat_listen_vNext_runner_test_CANON_v1.6_legacy_layout.html?managed=1&v=1.4.66',
	
// 'muqattiat_listen' => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.1.html?managed=1&v=1.4.69',
	
	// 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.1.html?managed=1&v=1.0.403',
	
	// old version
	// 'tanween_listen' => '/pre_quraan/scripts/tanween_lesson_v6.html',
	
	// 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.5.html?managed=1&v=1.0.411',
	//  
	//	'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.1.17.html?managed=1&v=1.0.423',
	// ttt
	// 'tanween_listen' => '/pre_quraan/scripts/tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
	//'tanween_listen' => '/pre_quraan/scripts/	tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
	// 
    // 'tanween14'          => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'standing1'          => '/pre_quraan/scripts/Standing_harakat8.html',
    'tanween_mvt1'       => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.1.3.html?managed=1&v=1.0.12',
    // ss
    'maddoleen3'         => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'sakoon_jazm2'       => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',

    'tashdeed_w_shaddah' => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_w_sukoon'  => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_w_tashdeed'=> '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_w_haroof_maddah'=> '/pre_quraan/scripts/tashdeed_with_haroof15.html',

    // -------------------------------------------------------------------------
    // RULES / TAJWEED — NEW DETAILED SLUGS TO MATCH app-config.js
    // For now, all detailed slugs for a unit point to the same main page.
    // You can later split them to separate files if you create them.
    // -------------------------------------------------------------------------
    //
    // Muqatta'at detailed lessons
    'muqattaat_intro'      => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    // 'muqattaat_listen'     => '/pre_quraan/scripts/muqattiat_listen_vNext_runner_test_CANON_v1.6_legacy_layout.html?managed=1&v=1.4.66',
    
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_v1.4.35.html?managed=1&v=1.4.66',
    
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.2.html?managed=1&v=1.5.97',
    
    
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.13_updated_subtitle.html?managed=1&v=1.5.120',
    
    //'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_sqa_final_v1.0.78_production_FINAL_ORDER.html?managed=1&v=1.5.198',
    
    // LOCKED VERSION
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_v1.0_PRODUCTION.html?managed=1&v=1.5.201',
    
    // DEV
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_from_template_v1.0_PATCHED_STABLE.html?managed=1&v=1.5.250',
    
    // CLONE
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_from_template_v1.0_CONFIG_DRIVEN_POC.html?managed=1&v=1.5.253',
    
    // FINAL CLONE
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_ui_v00.html?managed=1&v=1.5.268',
    
    
    // FINAL CLONE
   // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.19_new_clone.html?managed=1&v=1.5.316',
    
        // FINAL CLONE
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.20_new_clone.html?managed=1&v=1.5.347',
     
         // FINAL CLONE
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.20_new_clone_copy.html?managed=1&v=1.5.355',
     
     'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_clone_html_muq_output2.html?managed=1&v=1.5.365',
     
    // 'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_clone_html_muq_output2.html?managed=1&v=1.5.365',
     
     'muqattaat_listen'     => '/pre_quraan/scripts/pq_unit_muqattiat_listen_clean_v1.0.0.html?managed=1&v=1.5.366',
    
    
    
    // ssss   
    
    'muqattaat_match'      => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_speak'      => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_write'      => '/re_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_record'     => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_practice'   => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',
    'muqattaat_quiz'       => '/pre_quraan/scripts/muqattaat_letters17_mobile14.html',

    // Tanween detailed lessons
    'tanween_intro'        => '/pre_quraan/scripts/tanween_lesson_v1.html',
    //'tanween_listen'       => '/pre_quraan/scripts/tanween_lesson_v6.html',
    
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.1.html?managed=1&v=1.0.403',
   
   // old version
   // 'tanween_listen' => '/pre_quraan/scripts/tanween_lesson_v6.html',
    
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.0.5.html?managed=1&v=1.0.411',
    // 
    // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.1.17.html?managed=1&v=1.0.423',
    //  ttt
    
    // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_sqa_final_v1.0.7.html?managed=1&v=1.0.446',
    //  tttt
    
   // 'tanween_listen' => '/pre_quraan/scripts/tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
   // 'tanween_listen' => '/pre_quraan/scripts/tanween_listen_vNext_runner_test_v1.0.html?managed=1&v=1.0.01',
   
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_sqa_final_v1.0.2.html?managed=1&v=1.0.03',
   
   //'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v3.0_CONFIG_DRIVEN_PATCHED.html?managed=1&v=1.0.19',
   
   // New1
   // 'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_from_template_v1.0_CONFIG_DRIVEN_MESSAGES_WRITEFIX_v1.html?managed=1&v=1.0.24',
   
   'tanween_listen' => '/pre_quraan/scripts/pq_unit_tanween_listen_v1.4_COLUMN2_START.html?managed=1&v=1.0.26',
    	
    	
    	
    
    
    'tanween_match'        => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_speak'        => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_write'        => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_record'       => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_practice'     => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',
    'tanween_quiz'         => '/pre_quraan/scripts/the_tanweenv2-10_mobile4.html',

    // Tanween & Movement detailed lessons
    'tanween_mvt_intro'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.2.html?managed=1&v=1.0.08',
    
     
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.1.1.html?managed=1&v=1.0.37',
    //   
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.1.0.html?managed=1&v=1.0.40',
    // 888689
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html?v=1.0.43',
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_sqa_final_v1.0.0.html?managed=1&v=1.0.57',
    
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.2.html?managed=1&v=1.0.129',
    
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_SPEAK.html?managed=1&v=1.0.152',
    
    // old Stable version 
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_SPEAK_v16.html?managed=1&v=1.0.154',
    
    // recovered stable version
    //  'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_c.html?managed=1&v=1.0.190',
      
    // performance changes version
    //'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_d.html?managed=1&v=1.0.224',
      
    // mobile friendly
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_v1.0.3_d_mobile_child_friendly.html?managed=1&v=1.0.261',
      
     // gemini 
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_2_gemini.html?managed=1&v=1.0.231',
     
      
     // Note script... good version
     // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.21_mobile_6.html?managed=1&v=1.0.323',
    
       // Note script
      // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.21_mobile_5.html?managed=1&v=1.0.339',
      
       
     // sandbox script
     // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_2_test.html?managed=1&v=1.0.370',
     
     // Note script
     // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_2.html?managed=1&v=1.0.366',
     
    
    // scroll
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_3.html?managed=1&v=1.0.407',
    
    // scroll redo html
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_main_v1.0.24_mobile_10.html?managed=1&v=1.0.419',
    
    // resart version
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_mobile_v2c.html?managed=1&v=1.0.437',
    
    // browser dynamic columns
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_v1.0.3_j_browser_v4_cleaned.html?managed=1&v=1.0.447',
    
    // browser dynamic columns
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_v1.0.3_j_browser_v5_final.html?managed=1&v=1.0.451',
    
    // browser dynamic columns
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_mvt_v1.0.3_j_browser_v6_span.html?managed=1&v=1.0.454',
    
    //  new mobile
   // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.19.html?managed=1&v=1.0.665',

    //     
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tmvt_ui_v1.0.19_clone.html?managed=1&v=1.0.667',
     
    //     
    // 'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_tanween_movement.html?managed=1&v=1.0.671',
     
     //  cloned       
     'tanween_mvt_listen'     => '/pre_quraan/scripts/pq_unit_clone_html_output.html?managed=1&v=1.0.681',
    
    'tanween_mvt_match'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_speak'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_write'      => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_record'     => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_practice'   => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',
    'tanween_mvt_quiz'       => '/pre_quraan/scripts/the_tanween_and_movement1_mobile11.html',

    // Fatha–Kasra–Damma (Standing Harakat) detailed lessons
    // 'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_v1.0.6.html?managed=1&v=1.0.15',
    
    // 'standing_listen'        => '/pre_quraan/scripts/Standing_harakat8.html?v=1.0.20',
    
    // new 
    
    // 'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_v1.0.8.html?managed=1&v=1.0.41',
    // 
    
    // 'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_sqa_final_v1.0.html?managed=1&v=1.0.45',
    // sss
    
    'standing_listen'        => '/pre_quraan/scripts/pq_unit_madd_listen_from_template_v1.0.4_FINAL_AUDIO_GRID_FIX.html?managed=1&v=1.0.54',
    // sss
    
   
    'standing_match'         => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_speak'         => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_write'         => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_record'        => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_practice'      => '/pre_quraan/scripts/Standing_harakat8.html',
    'standing_quiz'          => '/pre_quraan/scripts/Standing_harakat8.html',

    // MaddoLeen detailed lessons
    'maddoleen_listen'       => '/pre_quraan/scripts/maddoleen_listen_v002.html',
    //  'maddoleen_listen'       => '/pre_quraan/scripts/pq_unit_tanween_movement_listen_sqa_final_v1.0.0.html?managed=1&v=1.0.46',
    
    
    'maddoleen_match'        => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_speak'        => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_write'        => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_record'       => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_practice'     => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',
    'maddoleen_quiz'         => '/pre_quraan/scripts/the_maddoleen5_mobile5.html',

    // Sakoon & Jazm detailed lessons
    // 'sakoon_jazm_listen'     => '/pre_quraan/scripts/sakoon_jazm_listen_v002.html',
    
    // 'sakoon_jazm_listen'     => '/pre_quraan/scripts/pq_unit_sakoon_jazm_listen_sqa_final_v1.0.html?managed=1&v=1.0.48',
    
    // 'sakoon_jazm_listen'     => '/pre_quraan/scripts/pq_unit_sakoon_jazm_listen_clean_clone_v2.html?managed=1&v=1.0.56',
    
    'sakoon_jazm_listen'     => '/pre_quraan/scripts/pq_unit_sakoon_jazm_listen_v1.4_COLUMN2_START.html?managed=1&v=1.0.77',
    
   
    
    
    'sakoon_jazm_match'      => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_speak'      => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_write'      => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_record'     => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_practice'   => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',
    'sakoon_jazm_quiz'       => '/pre_quraan/scripts/the_sakoon_and_jazm21.html',

    // Ending of Rules detailed lessons
    // (adjust file name if your actual Ending Rules HTML is different)
    'ending_rules1'          => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_listen'    => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_match'     => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_speak'     => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_write'     => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_record'    => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_practice'  => '/pre_quraan/scripts/ending_rules1.html',
    'ending_rules_quiz'      => '/pre_quraan/scripts/ending_rules1.html',

    // Tashdeed Shaddah detailed lessons
    'tashdeed_shaddah_intro'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    // 'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    // 'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/tashdeed_shaddah_listen_v003.html',
    
    // 'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_shaddah_listen_sqa_final_v1.0.html?managed=1&v=1.0.47',
    
    
    'tashdeed_shaddah_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_listen_v1.0_a.html?managed=1&v=1.0.82',
    
    
    
    // 'tashdeed_shaddah_match'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    
    'tashdeed_shaddah_match'    => '/pre_quraan/scripts/pq_unit_tashdeed_shaddah_match_sqa_final_v1.0.html?managed=1&v=1.0.57',
    
    // ssss
    
    'tashdeed_shaddah_speak'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_write'    => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_record'   => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_practice' => '/pre_quraan/scripts/tashdeed_shaddah12.html',
    'tashdeed_shaddah_quiz'     => '/pre_quraan/scripts/tashdeed_shaddah12.html',

    // Tashdeed With Sukoon detailed lessons
    'tashdeed_sukoon_intro'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    // 'tashdeed_sukoon_listen'   => '/pre_quraan/scripts/tashdeed_sukoon_listen_v002.html',
    
    'tashdeed_sukoon_intro'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_sukoon_listen_sqa_final_v1.0.html?managed=1&v=1.0.48',
    
    
    
    'tashdeed_sukoon_match'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_speak'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_write'    => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_record'   => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_practice' => '/pre_quraan/scripts/tashdeed_sukoon2.html',
    'tashdeed_sukoon_quiz'     => '/pre_quraan/scripts/tashdeed_sukoon2.html',

    // Tashdeed With tashdeed detailed lessons
    'tashdeed_tashdeed_intro'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_listen'   => '/pre_quraan/scripts/tashdeed_tashdeed_listen_v004.html',
    
    'tashdeed_tashdeed_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_tashdeed_listen_sqa_final_v1.html?managed=1&v=1.0.49',
    
    'tashdeed_tashdeed_match'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_speak'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_write'    => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_record'   => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_practice' => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',
    'tashdeed_tashdeed_quiz'     => '/pre_quraan/scripts/tasheed_with_tashdeed3.html',

    // Tashdeed With Haroof Maddah detailed lessons (and Haroof Maddah short aliases)
    'tashdeed_maddah_intro'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    // 'tashdeed_maddah_listen'   => '/pre_quraan/scripts/tashdeed_with_haroof12.html',
    
    'tashdeed_maddah_listen'   => '/pre_quraan/scripts/pq_unit_tashdeed_with_haroof_listen_sqa_final_v1.0.html?managed=1&v=1.0.49',
    
    'tashdeed_maddah_match'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_speak'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_write'    => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_record'   => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_practice' => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
    'tashdeed_maddah_quiz'     => '/pre_quraan/scripts/tashdeed_with_haroof15.html',
];

// Case-insensitive slug lookup (prevents 'not picking correct file' due to case/spacing)
$mapLower = array_change_key_case($map, CASE_LOWER);


// --- inputs (allow absolute paths) ---
$goto = optional_param('goto', '', PARAM_RAW_TRIMMED);
if ($goto === '') {
    foreach (['page', 'route', 'r', 'link', 'target', 'url', 'u'] as $pn) {
        $v = optional_param($pn, '', PARAM_RAW_TRIMMED);
        if ($v !== '') {
            $goto = $v;
            break;
        }
    }
}
$keyParam  = optional_param('key',  '', PARAM_ALPHANUMEXT);
$fileParam = optional_param('file', '', PARAM_RAW_TRIMMED);

// --- audio fast-path via origin proxy ---
$handleAudio = function(string $fileRel) use ($audioProxyCandidates) {
    $fileRel = ltrim($fileRel, '/');
    $proxyPath = null;
    foreach ($audioProxyCandidates as $cand) {
        if (is_file($cand)) {
            $proxyPath = $cand;
            break;
        }
    }
    if (!$proxyPath) {
        header('Content-Type: text/plain; charset=utf-8');
        http_response_code(500);
        echo "Server misconfigured: audio proxy not found.\nTried:\n - " . implode("\n - ", $audioProxyCandidates);
        exit;
    }
    if ($fileRel !== '') {
        $_GET['file'] = $fileRel;
    }
    require $proxyPath; // streams mp3 with CORS/Range
    exit;
};

if ($keyParam !== '')  {
    $handleAudio('arabic_alphabet/' . $keyParam . '.mp3');
}
if ($fileParam !== '') {
    $handleAudio($fileParam);
}
if ($goto !== '') {
    $low = strtolower($goto);
    if (substr($low, -4) === '.mp3' || strpos($low, 'arabic_alphabet/') !== false) {
        $rel = (substr($low, -4) === '.mp3') ? $goto : $goto . '.mp3';
        $handleAudio($rel);
    }
}

// --- HTML path resolution ---
$resolvePath = function(string $slugOrPath) use ($map, $mapLower, $pqEnvironment): string {
    $s = trim($slugOrPath);
    if ($s === '') {
        return hub_rewrite_bunny_environment_path('/pre_quraan/scripts/newui_main_menu.html', $pqEnvironment);
    }

    // If it's a known slug, return the mapped value (can be relative path or absolute URL)
    if (array_key_exists($s, $map)) {
        return hub_rewrite_bunny_environment_path($map[$s], $pqEnvironment);
    }

    $k = strtolower($s);
    if (array_key_exists($k, $mapLower)) {
        return hub_rewrite_bunny_environment_path($mapLower[$k], $pqEnvironment);
    }

    $low = strtolower($s);

    // If a direct filename is passed (e.g. pq_unit_xxx.html), allow it under /pre_quraan/scripts/
    if (preg_match('~^[a-z0-9_\-\.]+\.(html|htm)$~i', $s)) {
        return hub_rewrite_bunny_environment_path('/pre_quraan/scripts/' . $s, $pqEnvironment);
    }

    // If it's already an absolute URL, keep as-is
    if (preg_match('~^https?://~', $low)) {
        return $s;
    }

    // Absolute internal path
    if ($low[0] === '/') {
        return hub_rewrite_bunny_environment_path($s, $pqEnvironment);
    }

    // Speak pattern (legacy)
    if (preg_match('/^speak\s*0*([0-9]{1,3})$/i', $low, $m)) {
        $n  = (int)$m[1];
        $nn = ($n < 10 ? '0' . $n : (string)$n);
        return hub_rewrite_bunny_environment_path("/pre_quraan/scripts/newui_alphabet_speak{$nn}.html", $pqEnvironment);
    }

    // Raw html file name
    if (substr($low, -5) === '.html') {
        return hub_rewrite_bunny_environment_path('/pre_quraan/scripts/' . $s, $pqEnvironment);
    }

    // Clean fallback
    $safe = preg_replace('/[^A-Za-z0-9_\-\.]/', '', $s);
    if ($safe === '') {
        pqh_access_denied(
            'Choose a valid lesson activity before opening the student launcher.',
            new moodle_url('/local/hubredirect/dashboard.php'),
            'Lesson launcher unavailable'
        );
    }
    if (substr(strtolower($safe), -5) !== '.html') {
        $safe .= '.html';
    }
    return hub_rewrite_bunny_environment_path('/pre_quraan/scripts/' . $safe, $pqEnvironment);
};

$path = $resolvePath($goto);
$requiresTokenLaunch = strtolower(trim($goto)) === 'alphabet_quiz_chatbot';

// --- Moodle payload + mtoken ---

$custom  = profile_user_record($USER->id, false);

// =============================================================
// Lesson mode flag (Phase 1):
// Determine whether THIS user is a Managed Student.
// Priority: explicit query param managed_student (0/1) -> profile custom field -> default false
// NOTE: profile_user_record returns custom fields as properties by shortname.
// We support common shortnames: managed_student, managedstudent, managed
// =============================================================
$managedOverrideRaw = optional_param('managed_student', '', PARAM_RAW_TRIMMED);
$profileManagedStudent = false;
$candidates = ['managed_student', 'managedstudent', 'managed'];
foreach ($candidates as $k) {
    if (isset($custom->{$k}) && $custom->{$k} !== '' && $custom->{$k} !== null) {
        $vv = strtolower(trim((string)$custom->{$k}));
        $profileManagedStudent = in_array($vv, ['1','true','yes','on'], true);
        break;
    }
}
$looksLikeStudentAccount = false;
$accountidForMode = strtoupper(trim((string)($USER->idnumber ?? '')));
if ($accountidForMode !== '' && preg_match('/^(EA-)?STU[-_]/', $accountidForMode)) {
    $looksLikeStudentAccount = true;
}
$usernameForMode = strtolower(trim((string)($USER->username ?? '')));
if ($usernameForMode !== '' && preg_match('/(^|[._-])student([._-]|$)/', $usernameForMode)) {
    $looksLikeStudentAccount = true;
}
$emailForMode = strtolower(trim((string)($USER->email ?? '')));
if ($emailForMode !== '' && preg_match('/(^|[._-])student[0-9._-]*@/', $emailForMode)) {
    $looksLikeStudentAccount = true;
}
$isManagedStudent = false;
if ($managedOverrideRaw !== '') {
    $v = strtolower(trim($managedOverrideRaw));
    $isManagedStudent = in_array($v, ['1','true','yes','on'], true);
    if ($isManagedStudent && $looksLikeStudentAccount && !$profileManagedStudent) {
        $isManagedStudent = false;
    }
} else {
    $isManagedStudent = $profileManagedStudent;
}
$managedFlag = ($isManagedStudent || $requiresTokenLaunch) ? '1' : '0';
$GLOBALS['pq_managed_to_send'] = ($isManagedStudent || $requiresTokenLaunch) ? 1 : 0;
$GLOBALS['pq_environment_to_send'] = $pqEnvironment;

if ($isManagedStudent) {
    $coursekeys = pqh_user_course_keys((int)$USER->id);
    if ($coursekeys && !in_array('pre_quraan', $coursekeys, true)) {
        redirect(new moodle_url('/local/hubredirect/dashboard.php'));
    }
    $enrollmentapproval = hub_enrollment_approval_status((int)$USER->id);
    if (empty($enrollmentapproval['approved'])) {
        hub_render_enrollment_pending_page((int)$USER->id, $enrollmentapproval);
    }
}

$cohortidParam = optional_param('cohortid', 0, PARAM_INT);
if ($cohortidParam <= 0) {
    $cohortidParam = optional_param('cid', 0, PARAM_INT);
}
$GLOBALS['pq_cohortid_to_send'] = $cohortidParam > 0 ? $cohortidParam : 0;

$liveSessionidParam = optional_param('live_sessionid', 0, PARAM_INT);
if ($liveSessionidParam <= 0) {
    $liveSessionidParam = optional_param('livesessionid', 0, PARAM_INT);
}
if ($liveSessionidParam <= 0) {
    $liveSessionidParam = optional_param('sessionid', 0, PARAM_INT);
}
$allowedLiveSessionid = 0;
if ($liveSessionidParam > 0 && hub_table_exists('local_prequran_live_session')) {
    try {
        $liveSession = $DB->get_record('local_prequran_live_session', ['id' => $liveSessionidParam], '*', IGNORE_MISSING);
        $isLiveTeacher = $liveSession && (int)$liveSession->teacherid === (int)$USER->id;
        $isLiveStudent = $liveSession && hub_table_exists('local_prequran_live_participant')
            && $DB->record_exists('local_prequran_live_participant', [
                'sessionid' => $liveSessionidParam,
                'userid' => (int)$USER->id,
                'role' => 'student',
                'status' => 'active',
            ]);
        if ($liveSession && (is_siteadmin($USER) || $isLiveTeacher || $isLiveStudent)) {
            $allowedLiveSessionid = $liveSessionidParam;
        }
    } catch (Throwable $e) {
        $allowedLiveSessionid = 0;
    }
}
$GLOBALS['pq_live_sessionid_to_send'] = $allowedLiveSessionid;

$preferredLanguageRaw = optional_param('pq_lang', '', PARAM_RAW_TRIMMED);
if ($preferredLanguageRaw === '') {
    $preferredLanguageRaw = hub_custom_profile_value($custom, [
        'preferred_language', 'preferredlanguage', 'language_preference', 'languagepreference',
        'prequran_language', 'prequran_lang', 'ui_language', 'uilanguage', 'langpref', 'language'
    ]);
}
if ($preferredLanguageRaw === '') {
    $preferredLanguageRaw = (string)($USER->lang ?? '');
}
$preferredLanguage = hub_normalize_language($preferredLanguageRaw);

$languageScopeRaw = optional_param('pq_lang_scope', '', PARAM_RAW_TRIMMED);
if ($languageScopeRaw === '') {
    $languageScopeRaw = hub_custom_profile_value($custom, [
        'language_scope', 'languagescope', 'translation_scope', 'translationscope',
        'localization_scope', 'localizationscope', 'prequran_language_scope',
        'prequran_lang_scope', 'ui_content_preference', 'uicontentpreference',
        'translation_preference', 'translationpreference', 'preferred_language_scope', 'scope'
    ]);
}
$languageScope = hub_normalize_language_scope($languageScopeRaw);

$canSkipStepForQa = false;
try {
    $canSkipStepForQa = $pqEnvironment !== 'production'
        && hub_current_user_can_use_nonproduction_qa_tools();
} catch (Throwable $e) {
    $canSkipStepForQa = false;
}
$GLOBALS['pq_can_skip_step_to_send'] = $canSkipStepForQa ? 1 : 0;

$accountIdentity = hub_user_account_identity($USER);
$GLOBALS['pq_account_id_to_send'] = $accountIdentity['account_id'];
$GLOBALS['pq_account_type_to_send'] = $accountIdentity['account_type'];
$GLOBALS['pq_account_label_to_send'] = $accountIdentity['account_label'];

$payload = [
    'name'        => fullname($USER),
    'email'       => $USER->email ?? '',
    'parent_name' => $custom->parent_name ?? '',
    'lang'        => $USER->lang ?? '',
    'preferred_language' => $preferredLanguage,
    'language_scope' => $languageScope,
    'pq_env' => $pqEnvironment,
    'pq_can_skip_step' => $canSkipStepForQa ? 1 : 0,
    'account_id' => $accountIdentity['account_id'],
    'account_type' => $accountIdentity['account_type'],
    'account_label' => $accountIdentity['account_label'],
];
$mtoken = bin2hex(random_bytes(16));

$DB->insert_record('local_hubredirect_tok', (object)[
    'token'       => $mtoken,
    'payloadjson' => json_encode($payload, JSON_UNESCAPED_UNICODE),
    'expires'     => time() + $ttlMTok,
    'consumed'    => 0,
    'timecreated' => time(),
]);

// --- HTML signing & redirect ---
$expires  = time() + $ttlCdn;
$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';

$append = function(string $url, string $k, string $v): string {
    return $url . (strpos($url, '?') === false ? '?' : '&')
           . rawurlencode($k) . '=' . rawurlencode($v);
};

$forceNonProductionCdn = function(string $url) use ($pqEnvironment): string {
    if (!in_array($pqEnvironment, ['integration', 'staging'], true)) {
        return $url;
    }
    try {
        $parts = parse_url($url);
        $host = strtolower((string)($parts['host'] ?? ''));
        if (!pqh_is_legacy_quran_resource_host($host)) {
            return $url;
        }
        $rebuilt = pqh_shared_resource_cdn_base_url($pqEnvironment);
        if (!empty($parts['path'])) {
            $rebuilt .= $parts['path'];
        }
        if (!empty($parts['query'])) {
            $rebuilt .= '?' . $parts['query'];
        }
        if (!empty($parts['fragment'])) {
            $rebuilt .= '#' . $parts['fragment'];
        }
        return $rebuilt;
    } catch (Throwable $e) {
        return $url;
    }
};

// Determine if target is absolute (http/https). If yes, DO NOT prefix with CDN or sign.
$isAbsolute = (bool)preg_match('~^https?://~i', $path);

if ($isAbsolute) {
    $dest = $path;  // direct Moodle URL, no Bunny signing
} else {
    $dest = $cdnBase . $path;

    if ($signHtml && $secKey !== '' && $HTML_SIGN_MODE !== 'plain') {
        if ($HTML_SIGN_MODE === 'basic') {
            $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
            $tokenB = b64url(md5($concat, true)); // BINARY md5 → base64url
            $dest   = $append($dest, 'token',   $tokenB);
            $dest   = $append($dest, 'expires', (string)$expires);
            if ($useIpBind) {
                $dest = $append($dest, 'ip', $clientIp);
            }
        } else { // 'urltoken'
            $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
            $tokenH = md5($concat); // HEX md5
            $dest   = $append($dest, 'token',   $tokenH);
            $dest   = $append($dest, 'expires', (string)$expires);
            if ($useIpBind) {
                $dest = $append($dest, 'ip', $clientIp);
            }
        }
    }
}

// mtoken is appended for both Bunny-served pages and absolute Moodle pages
// mtoken is appended for both Bunny-served pages and absolute Moodle pages
$dest = $append($dest, 'mtoken', $mtoken);

// Phase 1: explicit lesson mode flag for unit scripts
$dest = $append($dest, 'managed_student', $managedFlag);
$dest = $append($dest, 'pq_env', $pqEnvironment);
$dest = $append($dest, 'pq_lang', $preferredLanguage);
$dest = $append($dest, 'pq_lang_scope', $languageScope);
if ($canSkipStepForQa) {
    $dest = $append($dest, 'pq_can_skip_step', '1');
}
if ($cohortidParam > 0) {
    $dest = $append($dest, 'cohortid', (string)$cohortidParam);
}
if ($allowedLiveSessionid > 0) {
    $dest = $append($dest, 'live_sessionid', (string)$allowedLiveSessionid);
}

$dest = $forceNonProductionCdn($dest);

// Phase 1 safety: if user is NOT managed, strip any legacy managed=1 hints from the destination URL.
// This prevents "unmanaged" HTML pages (or map entries) from forcing managed behavior.
if ($managedFlag !== '1') {
    try {
        $partsU = parse_url($dest);
        $qU = [];
        if (!empty($partsU['query'])) {
            parse_str($partsU['query'], $qU);
            unset($qU['managed']);
            unset($qU['userid'], $qU['uid'], $qU['wstoken'], $qU['ws']);
        }
        $rebU = '';
        if (!empty($partsU['scheme']) && !empty($partsU['host'])) {
            $rebU .= $partsU['scheme'] . '://' . $partsU['host'] . (!empty($partsU['port']) ? (':' . $partsU['port']) : '');
        }
        $rebU .= ($partsU['path'] ?? '');
        if (!empty($qU)) {
            $rebU .= '?' . http_build_query($qU, '', '&', PHP_QUERY_RFC3986);
        }
        if (!empty($partsU['fragment'])) {
            $rebU .= '#' . $partsU['fragment'];
        }
        if (!empty($rebU)) $dest = $rebU;
    } catch (Throwable $e) {
        // ignore
    }
}



// NEW: append WS token for PreQuran managed lessons.
$wstoken = get_config('local_prequran', 'ws_token');

if (optional_param('showtoken', 0, PARAM_INT)) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "uid={$USER->id}\n";
    echo "token_len=" . strlen((string)$wstoken) . "\n";
    echo "token_prefix=" . substr((string)$wstoken, 0, 6) . "\n";
    echo "token_suffix=" . substr((string)$wstoken, -6) . "\n";
    echo "service_user=prequran_ws@ehelacademy.org\n";
    exit;
}


if ($managedFlag === '1' && !empty($wstoken)) {
    // Back-compat: core reads wstoken/ws; some unit scripts used ws.
    $dest = $append($dest, 'wstoken', $wstoken);
}

// NEW: append the Moodle user id (managed units only)
if ($managedFlag === '1') {
    $dest = $append($dest, 'uid', $USER->id);
}

// Debug
$debug = optional_param('debug', 0, PARAM_INT);
if ($debug) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "mode: {$HTML_SIGN_MODE}\n";
    echo "path: {$path}\n";
    echo "pq_env: {$pqEnvironment}\n";
    echo "pq_can_skip_step: " . ($canSkipStepForQa ? '1' : '0') . "\n";
    foreach (hub_current_user_nonproduction_qa_debug() as $key => $value) {
        echo $key . ': ' . (is_bool($value) ? ($value ? '1' : '0') : $value) . "\n";
    }
    echo "is_absolute: " . ($isAbsolute ? 'yes' : 'no') . "\n";
    echo "expires: {$expires}\n";
    echo "client_ip: " . ($useIpBind ? $clientIp : '[none]') . "\n";
    if (!$isAbsolute && $HTML_SIGN_MODE === 'basic') {
        $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
        echo "basic_md5_input: {$concat}\n";
        echo "basic_token: " . b64url(md5($concat, true)) . "\n";
    } elseif (!$isAbsolute && $HTML_SIGN_MODE === 'urltoken') {
        $concat = $secKey . $path . $expires . ($useIpBind ? $clientIp : '');
        echo "urltoken_md5_input: {$concat}\n";
        echo "urltoken_token: " . md5($concat) . "\n";
    } else {
        echo "plain or absolute (no Bunny token)\n";
    }
    echo "dest:\n{$dest}\n";
    exit;
}


// ===== Unified iframe wrapper for authenticated CDN-served lessons =====

// --- Debug (add ?debug=1) ---
$debug = optional_param('debug', 0, PARAM_INT);
if ($debug) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "goto={$goto}\n";
    echo "resolved_path={$path}\n";
    echo "pq_env={$pqEnvironment}\n";
    echo "dest={$dest}\n";
    echo "cdnBase={$cdnBase}\n";
    echo "isAbsolute=" . ($isAbsolute ? '1' : '0') . "\n";
    echo "signHtml=" . ($signHtml ? '1' : '0') . "\n";
    exit;
}

$useIframeWrapper = false;
try {
    // Wrap CDN-served lessons for both managed and unmanaged authenticated students.
    // The managed_student flag still controls behavior; the wrapper supplies Moodle identity/tokens.
    if (!$isAbsolute) {
        $useIframeWrapper = true;
    }
} catch (Throwable $e) {
    $useIframeWrapper = false;
}

if ($useIframeWrapper) {
    $iframeSrc = $dest;
    $iframeOrigin = '';

    try {
        $parts = parse_url($iframeSrc);

        if (!empty($parts['scheme']) && !empty($parts['host'])) {
            $iframeOrigin = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? (':' . $parts['port']) : '');
        } else {
            $iframeOrigin = hub_origin_from_url($cdnBase);
            if ($iframeOrigin === '') {
                $iframeOrigin = rtrim($cdnBase, '/');
            }
        }

        $pathOnly = $parts['path'] ?? $iframeSrc;
        $queryArr = [];
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $queryArr);
        }

        // Preserve cache-busters, but do not leak uid/wstoken in the iframe URL.
        unset($queryArr['uid'], $queryArr['userid'], $queryArr['wstoken'], $queryArr['ws'], $queryArr['wsendpoint']);
        if ($managedFlag === '1') {
            $queryArr['managed'] = '1';
        } else {
            unset($queryArr['managed']);
        }
        if ($cohortidParam > 0) {
            $queryArr['cohortid'] = (string)$cohortidParam;
        }
        if ($allowedLiveSessionid > 0) {
            $queryArr['live_sessionid'] = (string)$allowedLiveSessionid;
        }
        if (!empty($GLOBALS['pq_account_id_to_send'])) {
            $queryArr['pq_account_id'] = (string)$GLOBALS['pq_account_id_to_send'];
            $queryArr['pq_account_type'] = (string)($GLOBALS['pq_account_type_to_send'] ?? '');
            $queryArr['pq_account_label'] = (string)($GLOBALS['pq_account_label_to_send'] ?? 'Account ID');
        }
        $openComm = optional_param('opencomm', '', PARAM_ALPHANUMEXT);
        if ($openComm !== '') {
            $queryArr['opencomm'] = $openComm;
        }

        $iframeSrc = $iframeOrigin . $pathOnly;
        if (!empty($queryArr)) {
            $iframeSrc .= '?' . http_build_query($queryArr, '', '&', PHP_QUERY_RFC3986);
        }
        if (!empty($parts['fragment'])) {
            $iframeSrc .= '#' . $parts['fragment'];
        }
    } catch (Throwable $e) {
        $iframeOrigin = hub_origin_from_url($cdnBase);
        if ($iframeOrigin === '') {
            $iframeOrigin = rtrim($cdnBase, '/');
        }
    }

    $uid_to_send = (int)$USER->id;
    $configured_ws_token = (string)get_config('local_prequran', 'ws_token');
    $wstoken_to_send = hub_current_user_ws_token($configured_ws_token);
    $wsendpoint = rtrim($CFG->wwwroot, '/') . '/webservice/rest/server.php';

    hub_render_lesson_iframe_wrapper(
        $iframeSrc,
        $uid_to_send,
        $wstoken_to_send,
        $wsendpoint,
        $iframeOrigin,
        'Lesson',
        $canSkipStepForQa
    );
}

redirect($dest);
