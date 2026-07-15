<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
} else if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $urlparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$dashboardpath = !empty($urlparams['workspaceid'])
    ? '/local/hubredirect/workspace_dashboard.php'
    : '/local/hubredirect/dashboard.php';
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_followups.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Follow-Up Command Center');
$PAGE->set_heading('Live Follow-Up Command Center');
$PAGE->add_body_class('pqh-live-followups-page');

function pqlf_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlf_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlf_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlf_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (pqlf_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqlf_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = :teacherid AND status <> :cancelled', [
            'teacherid' => $userid,
            'cancelled' => 'cancelled',
        ])) {
        return true;
    }
    if (pqlf_table_exists('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', [
            'userid' => $userid,
            'role' => 'teacher',
            'status' => 'active',
        ])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqlf_ready(): bool {
    return pqlf_table_exists('local_prequran_live_session')
        && pqlf_table_exists('local_prequran_live_note')
        && pqlf_table_exists('local_prequran_live_audit')
        && pqlf_column_exists('local_prequran_live_note', 'followup_status')
        && pqlf_column_exists('local_prequran_live_note', 'followup_resolved');
}

function pqlf_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlf_clean_text(string $value, int $max = 1200): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlf_short(string $value, int $max = 150): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlf_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlf_audit(int $sessionid, string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqlf_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlf_can_manage_note($note, $session): bool {
    global $USER;
    return is_siteadmin($USER) || (int)$session->teacherid === (int)$USER->id;
}

function pqlf_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlf_timeline(int $sessionid, int $studentid, int $noteid): array {
    global $DB;
    if (!pqlf_table_exists('local_prequran_live_audit')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT id, actorid, action, targettype, targetid, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE sessionid = :sessionid
            AND (
                action LIKE :followup
                OR action IN (:parentack, :homeworkdone, :needshelp)
            )
            AND (targetid = :studentid OR targetid = :noteid OR targetid = 0)
       ORDER BY timecreated DESC, id DESC",
        [
            'sessionid' => $sessionid,
            'followup' => '%followup%',
            'parentack' => 'followup_parent_acknowledged',
            'homeworkdone' => 'followup_homework_completed',
            'needshelp' => 'followup_parent_needs_help',
            'studentid' => $studentid,
            'noteid' => $noteid,
        ],
        0,
        5
    ));
}

$isadmin = is_siteadmin($USER);
if (!$isadmin && !pqlf_is_teacher((int)$USER->id)) {
    pqh_access_denied(
        'Only teachers and administrators can manage live follow-ups.',
        new moodle_url($dashboardpath, $urlparams),
        'Live follow-up access required'
    );
}

$ready = pqlf_ready();
$now = time();
$result = optional_param('result', '', PARAM_ALPHANUMEXT);

if ($ready && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'update_followup') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the live follow-up page and try saving again.',
            new moodle_url('/local/hubredirect/live_followups.php', $urlparams),
            'Live follow-up save expired'
        );
    }
    $noteid = optional_param('noteid', 0, PARAM_INT);
    if ($noteid <= 0) {
        pqh_access_denied(
            'Choose a valid follow-up item before updating it.',
            new moodle_url('/local/hubredirect/live_followups.php', $urlparams),
            'Live follow-up unavailable'
        );
    }
    $note = $DB->get_record('local_prequran_live_note', ['id' => $noteid], '*', IGNORE_MISSING);
    if (!$note) {
        pqh_access_denied(
            'Choose a valid follow-up item before updating it.',
            new moodle_url('/local/hubredirect/live_followups.php', $urlparams),
            'Live follow-up unavailable'
        );
    }
    $session = $DB->get_record('local_prequran_live_session', ['id' => (int)$note->sessionid], '*', IGNORE_MISSING);
    if (!$session) {
        pqh_access_denied(
            'This follow-up is not linked to an available live session.',
            new moodle_url('/local/hubredirect/live_followups.php', $urlparams),
            'Live follow-up unavailable'
        );
    }
    if (!empty($urlparams['workspaceid'])
            && pqlf_column_exists('local_prequran_live_session', 'workspaceid')
            && (int)($session->workspaceid ?? 0) !== (int)$urlparams['workspaceid']) {
        pqh_access_denied(
            'This follow-up is not scoped to the selected workspace.',
            new moodle_url('/local/hubredirect/live_followups.php', $urlparams),
            'Workspace follow-up access required'
        );
    }
    if (!pqlf_can_manage_note($note, $session)) {
        pqh_access_denied(
            'You cannot manage this live follow-up.',
            new moodle_url('/local/hubredirect/live_followups.php', $urlparams),
            'Live follow-up access required'
        );
    }

    $operation = optional_param('operation', 'resolve', PARAM_ALPHANUMEXT);
    $internalnote = pqlf_clean_text(optional_param('internal_note', '', PARAM_RAW), 1000);
    $status = optional_param('followup_status', (string)$note->followup_status, PARAM_ALPHANUMEXT);
    if (!in_array($status, ['none', 'review_homework', 'parent_contact_requested', 'admin_support_requested'], true)) {
        $status = (string)$note->followup_status;
    }

    $oldstatus = (string)$note->followup_status;
    $oldresolved = !empty($note->followup_resolved);
    $note->timemodified = $now;
    if ($operation === 'resolve') {
        $note->followup_resolved = 1;
        $note->followup_resolvedby = (int)$USER->id;
        $note->followup_resolvedat = $now;
        if ($status !== 'none') {
            $note->followup_status = $status;
        }
        $auditaction = 'followup_resolved_command_center';
    } else if ($operation === 'reopen') {
        $note->followup_resolved = 0;
        $note->followup_resolvedby = 0;
        $note->followup_resolvedat = 0;
        $note->followup_status = $status === 'none' ? 'parent_contact_requested' : $status;
        $auditaction = 'followup_reopened_command_center';
    } else if ($operation === 'admin_support') {
        $note->followup_status = 'admin_support_requested';
        $note->followup_resolved = 0;
        $note->followup_resolvedby = 0;
        $note->followup_resolvedat = 0;
        $auditaction = 'followup_escalated_command_center';
    } else {
        $note->followup_status = $status;
        $auditaction = 'followup_updated_command_center';
    }
    $DB->update_record('local_prequran_live_note', $note);
    pqlf_audit((int)$note->sessionid, $auditaction, 'followup', $noteid, [
        'studentid' => (int)$note->studentid,
        'oldstatus' => $oldstatus,
        'newstatus' => (string)$note->followup_status,
        'oldresolved' => $oldresolved,
        'newresolved' => !empty($note->followup_resolved),
        'note' => $internalnote,
    ]);
    redirect(new moodle_url('/local/hubredirect/live_followups.php', pqlf_url_params($urlparams, ['result' => 'saved'])));
}

$filter = optional_param('filter', 'open', PARAM_ALPHANUMEXT);
if (!in_array($filter, ['all', 'open', 'needs_help', 'overdue', 'escalated', 'resolved'], true)) {
    $filter = 'open';
}
$teacherfilter = $isadmin ? optional_param('teacherid', 0, PARAM_INT) : (int)$USER->id;
$q = trim(optional_param('q', '', PARAM_TEXT));

$metrics = [
    'open' => 0,
    'needs_help' => 0,
    'overdue' => 0,
    'escalated' => 0,
    'resolved' => 0,
];
$rows = [];
$teachers = [];

if ($ready) {
    $workspaceid = (int)($urlparams['workspaceid'] ?? 0);
    $workspacefilteralias = '';
    $workspaceparams = [];
    if ($workspaceid > 0 && pqlf_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilteralias = ' AND s.workspaceid = :workspaceid';
        $workspaceparams = ['workspaceid' => $workspaceid];
    }
    $parentresponseready = pqlf_column_exists('local_prequran_live_note', 'parent_response_status');
    $parentresponseselect = $parentresponseready
        ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
        : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
    $contactexpr = "COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified)";

    $baseparams = array_merge(['none' => 'none'], $workspaceparams);
    $teachersql = ($isadmin ? '' : ' AND s.teacherid = :currentteacher') . $workspacefilteralias;
    if (!$isadmin) {
        $baseparams['currentteacher'] = (int)$USER->id;
    }

    $metrics['open'] = pqlf_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 0{$teachersql}",
        $baseparams
    );
    $metrics['needs_help'] = $parentresponseready ? pqlf_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 0
            AND n.parent_response_status = :needshelp{$teachersql}",
        $baseparams + ['needshelp' => 'needs_help']
    ) : 0;
    $metrics['overdue'] = pqlf_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 0
            AND {$contactexpr} <= :cutoff{$teachersql}",
        $baseparams + ['cutoff' => $now - (2 * DAYSECS)]
    );
    $metrics['escalated'] = pqlf_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status = :adminsupport
            AND n.followup_resolved = 0{$teachersql}",
        $baseparams + ['adminsupport' => 'admin_support_requested']
    );
    $metrics['resolved'] = pqlf_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 1{$teachersql}",
        $baseparams
    );

    if ($isadmin) {
        $teachers = $DB->get_records_sql(
            "SELECT DISTINCT s.teacherid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_note} n ON n.sessionid = s.id
              WHERE n.followup_status <> :none
                {$workspacefilteralias}
           ORDER BY s.teacherid ASC",
            array_merge(['none' => 'none'], $workspaceparams)
        );
    }

    $where = ['n.followup_status <> :none'];
    $params = ['none' => 'none'];
    if ($teacherfilter > 0) {
        $where[] = 's.teacherid = :teacherfilter';
        $params['teacherfilter'] = $teacherfilter;
    }
    if ($filter === 'open') {
        $where[] = 'n.followup_resolved = 0';
    } else if ($filter === 'needs_help') {
        if ($parentresponseready) {
            $where[] = 'n.followup_resolved = 0';
            $where[] = 'n.parent_response_status = :needshelp';
            $params['needshelp'] = 'needs_help';
        } else {
            $where[] = '1 = 0';
        }
    } else if ($filter === 'overdue') {
        $where[] = 'n.followup_resolved = 0';
        $where[] = "{$contactexpr} <= :cutoff";
        $params['cutoff'] = $now - (2 * DAYSECS);
    } else if ($filter === 'escalated') {
        $where[] = 'n.followup_status = :adminsupport';
        $where[] = 'n.followup_resolved = 0';
        $params['adminsupport'] = 'admin_support_requested';
    } else if ($filter === 'resolved') {
        $where[] = 'n.followup_resolved = 1';
    }
    if ($q !== '') {
        $querylike = '%' . $DB->sql_like_escape($q) . '%';
        $where[] = '(s.title LIKE :querytitle OR n.followup_message LIKE :querymessage OR n.parent_summary LIKE :querysummary)';
        $params['querytitle'] = $querylike;
        $params['querymessage'] = $querylike;
        $params['querysummary'] = $querylike;
    }
    if (!$isadmin) {
        $where[] = 's.teacherid = :currentteacher';
        $params['currentteacher'] = (int)$USER->id;
    }
    if ($workspacefilteralias !== '') {
        $where[] = 's.workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }

    $wheresql = implode(' AND ', $where);
    $rows = array_values($DB->get_records_sql(
        "SELECT n.*,
                {$parentresponseselect}
                s.title AS session_title,
                s.teacherid,
                s.scheduled_start,
                s.scheduled_end,
                s.status AS session_status,
                {$contactexpr} AS followup_age_base
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE {$wheresql}
       ORDER BY n.followup_resolved ASC,
                CASE WHEN n.followup_status = 'admin_support_requested' THEN 0 ELSE 1 END ASC,
                {$contactexpr} ASC,
                n.timemodified DESC",
        $params,
        0,
        100
    ));
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-followups-page header,
body.pqh-live-followups-page footer,
body.pqh-live-followups-page nav.navbar,
body.pqh-live-followups-page #page-header,
body.pqh-live-followups-page #page-footer,
body.pqh-live-followups-page .drawer,
body.pqh-live-followups-page .drawer-toggles,
body.pqh-live-followups-page .block-region,
body.pqh-live-followups-page [data-region="drawer"],
body.pqh-live-followups-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-followups-page #page,
body.pqh-live-followups-page #page-content,
body.pqh-live-followups-page #region-main,
body.pqh-live-followups-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlf-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlf-wrap{max-width:1240px;margin:0 auto}
.pqlf-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlf-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;letter-spacing:0}
.pqlf-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlf-actions,.pqlf-row-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.pqlf-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlf-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlf-btn--warn{background:#9b3a2b}
.pqlf-btn--brown{background:#6f4e32}
.pqlf-alert{margin-bottom:14px;padding:12px 14px;border-radius:10px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-weight:900}
.pqlf-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:18px}
.pqlf-metric{display:block;padding:17px;background:#fff;border:1px solid rgba(23,48,68,.1);border-radius:10px;text-decoration:none!important;color:#173044!important}
.pqlf-metric strong{display:block;font-size:24px;color:#7a542f}
.pqlf-metric span{display:block;margin-top:6px;color:#5e7280;font-size:13px;font-weight:850}
.pqlf-filter{display:grid;grid-template-columns:1fr 1fr 2fr auto;gap:10px;margin-bottom:18px;padding:16px;background:#fff;border:1px solid rgba(23,48,68,.1);border-radius:10px}
.pqlf-field label{display:block;margin-bottom:5px;color:#40586a;font-size:12px;font-weight:950;text-transform:uppercase}
.pqlf-input,.pqlf-select,.pqlf-textarea{width:100%;min-height:40px;padding:9px 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font:800 14px/1.35 system-ui}
.pqlf-textarea{min-height:68px;resize:vertical}
.pqlf-panel{margin-bottom:16px;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.1);border-radius:10px}
.pqlf-panel h2{margin:0 0 12px;font-size:20px;font-weight:950}
.pqlf-card{padding:16px;border:1px solid rgba(23,48,68,.1);border-radius:10px;background:#fff;margin-bottom:12px}
.pqlf-card--overdue{border-color:rgba(155,58,43,.28);background:#fffaf8}
.pqlf-card__head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
.pqlf-card h3{margin:0;font-size:19px;font-weight:950}
.pqlf-meta{margin:4px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlf-pill{display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlf-pill--warn{background:#fff0dc;color:#7a542f}
.pqlf-pill--bad{background:#ffe9e4;color:#8b2d22}
.pqlf-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:14px}
.pqlf-box{padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#f9fbfc}
.pqlf-box strong{display:block;margin-bottom:5px;color:#40586a;font-size:12px;font-weight:950;text-transform:uppercase}
.pqlf-box p{margin:0;color:#173044;font-size:13px;font-weight:750;line-height:1.45;white-space:pre-wrap}
.pqlf-update{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(23,48,68,.1)}
.pqlf-update .pqlf-wide{grid-column:1/-1}
.pqlf-timeline{margin:10px 0 0;padding:0;list-style:none}
.pqlf-timeline li{padding:7px 0;border-top:1px solid rgba(23,48,68,.08);color:#40586a;font-size:12px;font-weight:750}
.pqlf-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-size:14px;font-weight:850}
@media(max-width:900px){.pqlf-top{display:block}.pqlf-actions{margin-top:12px}.pqlf-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlf-filter,.pqlf-grid,.pqlf-update{grid-template-columns:1fr}.pqlf-filter{display:block}.pqlf-field{margin-bottom:10px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlf-shell">
  <div class="pqlf-wrap">
    <section class="pqlf-top pqh-workspace-top">
      <div>
        <h1 class="pqlf-title pqh-workspace-title">Follow-Up Command Center</h1>
        <p class="pqlf-sub pqh-workspace-sub">Triage parent follow-ups, responses, overdue items, escalations, and resolution history from one workspace.</p>
      </div>
      <div class="pqlf-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlf-btn pqlf-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher.php', $urlparams))->out(false); ?>">Teacher workspace</a>
        <?php if ($isadmin): ?><a class="pqlf-btn pqlf-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $urlparams))->out(false); ?>">Live ops</a><?php endif; ?>
        <a class="pqlf-btn pqlf-btn--light" href="<?php echo (new moodle_url($dashboardpath, $urlparams))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($result === 'saved'): ?><div class="pqlf-alert">Follow-up updated.</div><?php endif; ?>

    <?php if (!$ready): ?>
      <div class="pqlf-empty">Follow-up fields are not installed yet. Complete Phases 25, 26, and 28 first.</div>
    <?php else: ?>
      <section class="pqlf-metrics" aria-label="Follow-up metrics">
        <?php foreach (['open' => 'open', 'needs_help' => 'parent needs help', 'overdue' => 'overdue', 'escalated' => 'admin support', 'resolved' => 'resolved'] as $key => $label): ?>
          <a class="pqlf-metric" href="<?php echo (new moodle_url('/local/hubredirect/live_followups.php', pqlf_url_params($urlparams, ['filter' => $key])))->out(false); ?>">
            <strong><?php echo (int)$metrics[$key]; ?></strong><span><?php echo s($label); ?></span>
          </a>
        <?php endforeach; ?>
      </section>

      <form class="pqlf-filter" method="get">
        <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
        <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
        <div class="pqlf-field">
          <label for="pqlf-filter">Status</label>
          <select class="pqlf-select" id="pqlf-filter" name="filter">
            <?php foreach (['all' => 'All follow-ups', 'open' => 'Open', 'needs_help' => 'Parent needs help', 'overdue' => 'Overdue', 'escalated' => 'Admin support', 'resolved' => 'Resolved'] as $value => $label): ?>
              <option value="<?php echo s($value); ?>" <?php echo $filter === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <?php if ($isadmin): ?>
          <div class="pqlf-field">
            <label for="pqlf-teacher">Teacher</label>
            <select class="pqlf-select" id="pqlf-teacher" name="teacherid">
              <option value="0">All teachers</option>
              <?php foreach ($teachers as $teacher): ?>
                <?php $tid = (int)$teacher->teacherid; ?>
                <option value="<?php echo $tid; ?>" <?php echo $teacherfilter === $tid ? 'selected' : ''; ?>><?php echo s(pqlf_user_name($tid, 'Teacher ' . $tid)); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        <?php endif; ?>
        <div class="pqlf-field">
          <label for="pqlf-q">Search</label>
          <input class="pqlf-input" id="pqlf-q" name="q" value="<?php echo s($q); ?>" placeholder="Session, message, or summary">
        </div>
        <div class="pqlf-field">
          <label>&nbsp;</label>
          <button class="pqlf-btn" type="submit">Apply filters</button>
        </div>
      </form>

      <section class="pqlf-panel">
        <h2><?php echo s(ucfirst(str_replace('_', ' ', $filter))); ?> Follow-Ups</h2>
        <?php if (!$rows): ?>
          <div class="pqlf-empty">No follow-ups match this view.</div>
        <?php else: ?>
          <?php foreach ($rows as $note): ?>
            <?php
              $sessiondate = userdate((int)$note->scheduled_start, get_string('strftimedatetimeshort'));
              $teachername = pqlf_user_name((int)$note->teacherid, 'Teacher ' . (int)$note->teacherid);
              $studentname = pqlf_user_name((int)$note->studentid, 'Student ' . (int)$note->studentid);
              $overdue = empty($note->followup_resolved) && (int)$note->followup_age_base <= $now - (2 * DAYSECS);
              $statuslabel = str_replace('_', ' ', (string)$note->followup_status);
              $response = (string)($note->parent_response_status ?? 'none');
              $timeline = pqlf_timeline((int)$note->sessionid, (int)$note->studentid, (int)$note->id);
              $reviewurl = new moodle_url('/local/hubredirect/live_review.php', pqlf_url_params($urlparams, ['sessionid' => (int)$note->sessionid]));
              $messageurl = new moodle_url('/local/hubredirect/live_followup_message.php', pqlf_url_params($urlparams, ['sessionid' => (int)$note->sessionid, 'studentid' => (int)$note->studentid, 'sesskey' => sesskey()]));
              $parenturl = new moodle_url('/local/hubredirect/live_summaries.php', pqlf_url_params($urlparams, ['childid' => (int)$note->studentid]));
            ?>
            <article class="pqlf-card <?php echo $overdue ? 'pqlf-card--overdue' : ''; ?>">
              <div class="pqlf-card__head">
                <div>
                  <h3><?php echo s($studentname); ?></h3>
                  <p class="pqlf-meta"><?php echo s((string)$note->session_title); ?> - <?php echo s($sessiondate); ?> - <?php echo s($teachername); ?></p>
                </div>
                <div class="pqlf-row-actions pqh-workspace-actions">
                  <span class="pqlf-pill <?php echo (string)$note->followup_status === 'admin_support_requested' ? 'pqlf-pill--bad' : ($overdue ? 'pqlf-pill--warn' : ''); ?>"><?php echo s($statuslabel); ?></span>
                  <?php if (!empty($note->followup_resolved)): ?><span class="pqlf-pill">resolved</span><?php endif; ?>
                  <?php if ($overdue): ?><span class="pqlf-pill pqlf-pill--warn">overdue</span><?php endif; ?>
                </div>
              </div>

              <div class="pqlf-grid">
                <div>
                  <div class="pqlf-box">
                    <strong>Teacher Follow-Up</strong>
                    <p><?php echo s((string)$note->followup_message !== '' ? (string)$note->followup_message : 'Follow-up requested.'); ?></p>
                  </div>
                  <div class="pqlf-box" style="margin-top:10px">
                    <strong>Parent Response</strong>
                    <?php if ($response !== 'none'): ?>
                      <p><?php echo s(str_replace('_', ' ', $response)); ?><?php echo !empty($note->parent_responseat) ? ' - ' . userdate((int)$note->parent_responseat, get_string('strftimedatetimeshort')) : ''; ?></p>
                      <?php if ((string)($note->parent_response_message ?? '') !== ''): ?><p><?php echo s((string)$note->parent_response_message); ?></p><?php endif; ?>
                    <?php else: ?>
                      <p>No parent response yet.</p>
                    <?php endif; ?>
                  </div>
                </div>
                <div>
                  <div class="pqlf-box">
                    <strong>Timeline</strong>
                    <?php if (!$timeline): ?>
                      <p>No follow-up audit rows yet.</p>
                    <?php else: ?>
                      <ul class="pqlf-timeline">
                        <?php foreach ($timeline as $event): ?>
                          <li><?php echo s(userdate((int)$event->timecreated, get_string('strftimedatetimeshort'))); ?> - <?php echo s(str_replace('_', ' ', (string)$event->action)); ?> by <?php echo s(pqlf_user_name((int)$event->actorid, 'User ' . (int)$event->actorid)); ?></li>
                        <?php endforeach; ?>
                      </ul>
                    <?php endif; ?>
                  </div>
                  <div class="pqlf-row-actions pqh-workspace-actions" style="margin-top:10px">
                    <a class="pqlf-btn pqlf-btn--light" href="<?php echo $reviewurl->out(false); ?>">Review</a>
                    <a class="pqlf-btn pqlf-btn--light" href="<?php echo $messageurl->out(false); ?>">Message</a>
                    <a class="pqlf-btn pqlf-btn--light" href="<?php echo $parenturl->out(false); ?>">Parent view</a>
                  </div>
                </div>
              </div>

              <form class="pqlf-update" method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="update_followup">
                <input type="hidden" name="noteid" value="<?php echo (int)$note->id; ?>">
                <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
                <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
                <div class="pqlf-field">
                  <label for="status-<?php echo (int)$note->id; ?>">Follow-up status</label>
                  <select class="pqlf-select" id="status-<?php echo (int)$note->id; ?>" name="followup_status">
                    <?php foreach (['review_homework' => 'Review homework', 'parent_contact_requested' => 'Parent contact requested', 'admin_support_requested' => 'Admin support requested', 'none' => 'No follow-up'] as $value => $label): ?>
                      <option value="<?php echo s($value); ?>" <?php echo (string)$note->followup_status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <div class="pqlf-field">
                  <label for="internal-<?php echo (int)$note->id; ?>">Internal note</label>
                  <input class="pqlf-input" id="internal-<?php echo (int)$note->id; ?>" name="internal_note" placeholder="Optional audit note">
                </div>
                <div class="pqlf-wide pqlf-row-actions pqh-workspace-actions">
                  <?php if (empty($note->followup_resolved)): ?>
                    <button class="pqlf-btn" type="submit" name="operation" value="resolve">Mark resolved</button>
                    <button class="pqlf-btn pqlf-btn--warn" type="submit" name="operation" value="admin_support">Escalate to admin</button>
                    <button class="pqlf-btn pqlf-btn--light" type="submit" name="operation" value="update">Save status only</button>
                  <?php else: ?>
                    <button class="pqlf-btn pqlf-btn--brown" type="submit" name="operation" value="reopen">Reopen follow-up</button>
                    <button class="pqlf-btn pqlf-btn--light" type="submit" name="operation" value="update">Save status only</button>
                  <?php endif; ?>
                </div>
              </form>
            </article>
          <?php endforeach; ?>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
