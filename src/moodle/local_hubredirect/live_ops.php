<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

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

pqh_require_academy_operations(
    'Only academy operations users can view live-session operations.',
    new moodle_url('/local/hubredirect/live_sessions.php', $urlparams),
    'Live operations access required'
);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_ops.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Operations');
$PAGE->set_heading('Live Operations');
$PAGE->add_body_class('pqh-live-ops-page');

function pqlo_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlo_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlo_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlo_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlo_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlo_short(string $value, int $max = 130): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlo_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlo_ready(): bool {
    return pqlo_table_exists('local_prequran_live_session')
        && pqlo_table_exists('local_prequran_live_participant')
        && pqlo_table_exists('local_prequran_live_attendance')
        && pqlo_table_exists('local_prequran_live_note')
        && pqlo_table_exists('local_prequran_live_recording')
        && pqlo_table_exists('local_prequran_live_audit');
}

$ready = pqlo_ready();
$now = time();
$todaystart = usergetmidnight($now);
$todayend = $todaystart + DAYSECS;

$metrics = [
    'today' => 0,
    'upcoming' => 0,
    'awaitingreview' => 0,
    'missingreview' => 0,
    'followups' => 0,
    'overduefollowups' => 0,
    'bbberrors' => 0,
    'recordingqueue' => 0,
    'qualityqueue' => 0,
    'qualityissues' => 0,
    'coachingqueue' => 0,
    'coachingoverdue' => 0,
    'qualityreminders' => 0,
    'leadershipqueue' => 0,
    'improvementplans' => 0,
    'improvementoverdue' => 0,
    'improvementalerts' => 0,
    'parentpreviews' => 0,
    'notificationissues' => 0,
];
$today = [];
$missingreviews = [];
$bbberrors = [];
$recordingqueue = [];
$qualityqueue = [];
$coachingqueue = [];
$leadershipqueue = [];
$improvementqueue = [];
$notificationissues = [];
$teacherworkload = [];
$followupqueue = [];

if ($ready) {
    $workspaceid = (int)($urlparams['workspaceid'] ?? 0);
    $workspacefilter = '';
    $workspaceparams = [];
    $workspacefilteralias = '';
    $workspaceparamsalias = [];
    if ($workspaceid > 0 && pqlo_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilter = ' AND workspaceid = :workspaceid';
        $workspaceparams = ['workspaceid' => $workspaceid];
        $workspacefilteralias = ' AND s.workspaceid = :workspaceid';
        $workspaceparamsalias = ['workspaceid' => $workspaceid];
    }
    $followupready = pqlo_column_exists('local_prequran_live_note', 'followup_status');
    $parentresponseready = pqlo_column_exists('local_prequran_live_note', 'parent_response_status');
    $qualityready = pqlo_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqlo_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqlo_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqlo_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $metrics['today'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE scheduled_start >= :starttime
            AND scheduled_start < :endtime
            AND status <> :cancelled
            {$workspacefilter}",
        array_merge(['starttime' => $todaystart, 'endtime' => $todayend, 'cancelled' => 'cancelled'], $workspaceparams)
    );
    $metrics['upcoming'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE scheduled_start >= :nowtime
            AND scheduled_start < :untiltime
            AND status <> :cancelled
            {$workspacefilter}",
        array_merge(['nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled'], $workspaceparams)
    );
    $metrics['awaitingreview'] = pqlo_count_sql(
        "SELECT COUNT(1)
          FROM {local_prequran_live_session}
          WHERE status = :status
            {$workspacefilter}",
        array_merge(['status' => 'awaiting_review'], $workspaceparams)
    );
    $metrics['missingreview'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session} s
          WHERE s.scheduled_end < :nowtime
            AND s.scheduled_end >= :fromtime
            AND s.status <> :cancelled
            {$workspacefilteralias}
            AND (
                s.status <> :completed
                OR (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id)
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
                OR (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '')
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
            )",
        array_merge(['nowtime' => $now, 'fromtime' => $now - (14 * DAYSECS), 'cancelled' => 'cancelled', 'completed' => 'completed'], $workspaceparamsalias)
    );
    $metrics['bbberrors'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE bbb_last_error IS NOT NULL
            AND bbb_last_error <> ''
            {$workspacefilter}",
        $workspaceparams
    );
    $metrics['recordingqueue'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording} r
      LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
          WHERE r.status = :available
            AND (r.reviewedat = 0 OR r.visible_to_parent = 0)
            {$workspacefilteralias}",
        array_merge(['available' => 'available'], $workspaceparamsalias)
    );
    if ($qualityready) {
        $metrics['qualityqueue'] = pqlo_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_status IN ('not_reviewed', 'needs_coaching', 'serious_issue')
                {$workspacefilter}",
            array_merge(['cancelled' => 'cancelled'], $workspaceparams)
        );
        $metrics['qualityissues'] = pqlo_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_status IN ('needs_coaching', 'serious_issue')
                {$workspacefilter}",
            array_merge(['cancelled' => 'cancelled'], $workspaceparams)
        );
    }
    if ($coachingready) {
        $metrics['coachingqueue'] = pqlo_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspacefilter}",
            $workspaceparams
        );
        $metrics['coachingoverdue'] = pqlo_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE qa_coaching_status IN ('assigned', 'acknowledged')
                AND qa_coaching_due_date > 0
                AND qa_coaching_due_date < :nowtime
                {$workspacefilter}",
            array_merge(['nowtime' => $now], $workspaceparams)
        );
    }
    if ($leadershipready) {
        $metrics['leadershipqueue'] = pqlo_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE leadership_review_status IN ('flagged', 'in_review')
                {$workspacefilter}",
            $workspaceparams
        );
    }
    if ($improvementready) {
        $metrics['improvementplans'] = pqlo_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                {$workspacefilter}",
            $workspaceparams
        );
        $metrics['improvementoverdue'] = pqlo_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                AND improvement_plan_due_date > 0
                AND improvement_plan_due_date < :nowtime
                {$workspacefilter}",
            array_merge(['nowtime' => $now], $workspaceparams)
        );
        $metrics['improvementalerts'] = pqlo_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_audit}
              WHERE action IN ('improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_overdue', 'improvement_plan_admin_escalated')
                AND timecreated >= :fromtime",
            ['fromtime' => $now - (7 * DAYSECS)]
        );
    }
    $metrics['notificationissues'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('notification_failed', 'notification_skipped')
            AND timecreated >= :fromtime",
        ['fromtime' => $now - (7 * DAYSECS)]
    );
    $metrics['parentpreviews'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action = :action
            AND timecreated >= :fromtime",
        ['action' => 'parent_trust_preview_opened', 'fromtime' => $now - (7 * DAYSECS)]
    );
    $metrics['qualityreminders'] = pqlo_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('quality_review_reminder_sent', 'quality_coaching_teacher_reminder_sent', 'quality_coaching_admin_escalated', 'quality_coaching_overdue', 'improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_overdue', 'improvement_plan_admin_escalated')
            AND timecreated >= :fromtime",
        ['fromtime' => $now - (7 * DAYSECS)]
    );
    if ($followupready) {
        $metrics['followups'] = pqlo_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_note}
              WHERE followup_status <> :none
                AND followup_resolved = 0
                AND sessionid IN (
                    SELECT id FROM {local_prequran_live_session} s WHERE 1 = 1 {$workspacefilteralias}
                )",
            array_merge(['none' => 'none'], $workspaceparamsalias)
        );
        $metrics['overduefollowups'] = pqlo_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_note}
              WHERE followup_status <> :none
                AND followup_resolved = 0
                AND COALESCE(NULLIF(followup_contactedat, 0), timemodified) <= :cutoff
                AND sessionid IN (
                    SELECT id FROM {local_prequran_live_session} s WHERE 1 = 1 {$workspacefilteralias}
                )",
            array_merge(['none' => 'none', 'cutoff' => $now - (2 * DAYSECS)], $workspaceparamsalias)
        );
    }

    $today = $DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1) AS visible_summary_count
           FROM {local_prequran_live_session} s
          WHERE s.scheduled_start >= :starttime
            AND s.scheduled_start < :endtime
            AND s.status <> :cancelled
            {$workspacefilteralias}
       ORDER BY s.scheduled_start ASC, s.id ASC",
        array_merge(['starttime' => $todaystart, 'endtime' => $todayend, 'cancelled' => 'cancelled'], $workspaceparamsalias),
        0,
        20
    );

    $missingreviews = $DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id) AS note_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '') AS visible_summary_count
           FROM {local_prequran_live_session} s
          WHERE s.scheduled_end < :nowtime
            AND s.scheduled_end >= :fromtime
            AND s.status <> :cancelled
            {$workspacefilteralias}
            AND (
                s.status <> :completed
                OR (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id)
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
                OR (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '')
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
            )
       ORDER BY s.scheduled_end DESC, s.id DESC",
        array_merge(['nowtime' => $now, 'fromtime' => $now - (14 * DAYSECS), 'cancelled' => 'cancelled', 'completed' => 'completed'], $workspaceparamsalias),
        0,
        20
    );

    $bbberrors = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_session}
          WHERE bbb_last_error IS NOT NULL
            AND bbb_last_error <> ''
            {$workspacefilter}
       ORDER BY timemodified DESC, id DESC",
        $workspaceparams,
        0,
        10
    );

    $recordingqueue = $DB->get_records_sql(
        "SELECT r.*,
                s.title AS session_title,
                s.teacherid,
                s.scheduled_start
           FROM {local_prequran_live_recording} r
      LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
          WHERE r.status = :available
            AND (r.reviewedat = 0 OR r.visible_to_parent = 0)
            {$workspacefilteralias}
       ORDER BY r.timemodified DESC, r.id DESC",
        array_merge(['available' => 'available'], $workspaceparamsalias),
        0,
        20
    );

    if ($qualityready) {
        $qualityqueue = $DB->get_records_sql(
            "SELECT s.*,
                    (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                    (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
                    (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1) AS visible_summary_count,
                    (SELECT COUNT(1) FROM {local_prequran_live_recording} r WHERE r.sessionid = s.id AND r.status = 'available') AS recording_count
               FROM {local_prequran_live_session} s
              WHERE s.status <> :cancelled
                AND s.qa_status IN ('not_reviewed', 'needs_coaching', 'serious_issue')
                {$workspacefilteralias}
           ORDER BY CASE s.qa_status
                        WHEN 'serious_issue' THEN 1
                        WHEN 'needs_coaching' THEN 2
                        ELSE 3
                    END,
                    s.scheduled_end DESC,
                    s.id DESC",
            array_merge(['cancelled' => 'cancelled'], $workspaceparamsalias),
            0,
            20
        );
    }

    if ($coachingready) {
        $coachingqueue = $DB->get_records_sql(
            "SELECT *
              FROM {local_prequran_live_session}
              WHERE qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspacefilter}
           ORDER BY CASE qa_coaching_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    qa_coaching_due_date ASC,
                    qa_reviewedat DESC",
            $workspaceparams,
            0,
            20
        );
    }

    if ($leadershipready) {
        $leadershipqueue = $DB->get_records_sql(
            "SELECT *
              FROM {local_prequran_live_session}
              WHERE leadership_review_status IN ('flagged', 'in_review')
                {$workspacefilter}
           ORDER BY CASE leadership_review_status
                        WHEN 'flagged' THEN 1
                        WHEN 'in_review' THEN 2
                        ELSE 3
                    END,
                    leadership_reviewat DESC,
                    id DESC",
            $workspaceparams,
            0,
            20
        );
    }

    if ($improvementready) {
        $improvementqueue = $DB->get_records_sql(
            "SELECT *
              FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                {$workspacefilter}
           ORDER BY CASE improvement_plan_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    improvement_plan_due_date ASC,
                    improvement_plan_assignedat DESC",
            $workspaceparams,
            0,
            20
        );
    }

    $notificationissues = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action IN ('notification_failed', 'notification_skipped')
            AND timecreated >= :fromtime
       ORDER BY timecreated DESC, id DESC",
        ['fromtime' => $now - (7 * DAYSECS)],
        0,
        20
    );

    if ($followupready) {
        $parentresponseselect = $parentresponseready
            ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
            : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
        $followupqueue = $DB->get_records_sql(
            "SELECT n.*,
                    {$parentresponseselect}
                    s.title AS session_title,
                    s.scheduled_start,
                    s.scheduled_end,
                    COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified) AS followup_age_start
               FROM {local_prequran_live_note} n
              JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE n.followup_status <> :none
                AND n.followup_resolved = 0
                {$workspacefilteralias}
           ORDER BY CASE n.followup_status
                        WHEN 'admin_support_requested' THEN 1
                        WHEN 'parent_contact_requested' THEN 2
                        WHEN 'review_homework' THEN 3
                        ELSE 4
                    END,
                    n.timemodified DESC",
            array_merge(['none' => 'none'], $workspaceparamsalias),
            0,
            20
        );
    }

    $teacherworkload = $DB->get_records_sql(
        "SELECT teacherid,
                COUNT(1) AS session_count,
                MIN(scheduled_start) AS next_start,
                SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled_count,
                SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) AS live_count
           FROM {local_prequran_live_session}
          WHERE scheduled_start >= :nowtime
            AND scheduled_start < :untiltime
            AND status <> :cancelled
            {$workspacefilter}
       GROUP BY teacherid
       ORDER BY session_count DESC, next_start ASC",
        array_merge(['nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled'], $workspaceparams),
        0,
        20
    );
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-ops-page header,
body.pqh-live-ops-page footer,
body.pqh-live-ops-page nav.navbar,
body.pqh-live-ops-page #page-header,
body.pqh-live-ops-page #page-footer,
body.pqh-live-ops-page .drawer,
body.pqh-live-ops-page .drawer-toggles,
body.pqh-live-ops-page .block-region,
body.pqh-live-ops-page [data-region="drawer"],
body.pqh-live-ops-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-ops-page #page,
body.pqh-live-ops-page #page-content,
body.pqh-live-ops-page #region-main,
body.pqh-live-ops-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlo-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlo-wrap{max-width:1240px;margin:0 auto}
.pqlo-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlo-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlo-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlo-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlo-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlo-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlo-metrics{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlo-metric{padding:15px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlo-metric strong{display:block;font-size:26px;font-weight:950;color:#6f4e32}
.pqlo-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqlo-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlo-panel--wide{grid-column:1/-1}
.pqlo-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqlo-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlo-table th,.pqlo-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlo-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqlo-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlo-pill--ok{background:#edf9ef;color:#245c35}
.pqlo-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlo-pill--bad{background:#fff0ed;color:#883526}
.pqlo-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlo-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1050px){.pqlo-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.pqlo-grid{grid-template-columns:1fr}.pqlo-top{display:block}.pqlo-actions{margin-top:12px}.pqlo-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlo-metrics{grid-template-columns:1fr}.pqlo-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlo-shell">
  <div class="pqlo-wrap">
    <section class="pqlo-top pqh-workspace-top">
      <div>
        <h1 class="pqlo-title pqh-workspace-title">Live Operations Dashboard</h1>
        <p class="pqlo-sub pqh-workspace-sub">Monitor sessions, reviews, BBB errors, recordings, reminders, and teacher workload from one admin view.</p>
      </div>
      <div class="pqlo-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlo-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php', $urlparams))->out(false); ?>">Admin menu</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $urlparams))->out(false); ?>">Live sessions</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $urlparams))->out(false); ?>">Create wizard</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $urlparams))->out(false); ?>">Series wizard</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php', $urlparams))->out(false); ?>">Reports</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php', $urlparams))->out(false); ?>">Teachers</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php', $urlparams))->out(false); ?>">Capacity</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', $urlparams))->out(false); ?>">QA analytics</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php', $urlparams))->out(false); ?>">Leadership</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', $urlparams))->out(false); ?>">Improvement plans</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_followups.php', $urlparams))->out(false); ?>">Follow-ups</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_audit.php', $urlparams))->out(false); ?>">Parent trust audit</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_review_pack.php', $urlparams))->out(false); ?>">Trust review pack</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_retention.php', $urlparams))->out(false); ?>">Trust retention</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series.php', $urlparams))->out(false); ?>">Class series</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_availability.php', $urlparams))->out(false); ?>">Availability</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings_admin.php', $urlparams))->out(false); ?>">Recording review</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_diagnostics.php', $urlparams))->out(false); ?>">Diagnostics</a>
        <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url($dashboardpath, $urlparams))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlo-empty">Live-session tables are not fully installed yet.</div>
    <?php else: ?>
      <section class="pqlo-metrics" aria-label="Live operations metrics">
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['today']; ?></strong><span>today's sessions</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['upcoming']; ?></strong><span>next 7 days</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['awaitingreview']; ?></strong><span>awaiting review</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['missingreview']; ?></strong><span>review gaps</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['followups']; ?></strong><span>open follow-ups</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['overduefollowups']; ?></strong><span>overdue follow-ups</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['bbberrors']; ?></strong><span>BBB errors</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['recordingqueue']; ?></strong><span>recordings to review</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['qualityqueue']; ?></strong><span>QA review queue</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['qualityissues']; ?></strong><span>QA issues</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['coachingqueue']; ?></strong><span>coaching queue</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['coachingoverdue']; ?></strong><span>coaching overdue</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['qualityreminders']; ?></strong><span>QA reminders 7d</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['leadershipqueue']; ?></strong><span>leadership reviews</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['improvementplans']; ?></strong><span>improvement plans</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['improvementoverdue']; ?></strong><span>plans overdue</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['improvementalerts']; ?></strong><span>plan alerts 7d</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['parentpreviews']; ?></strong><span>parent previews 7d</span></div>
        <div class="pqlo-metric"><strong><?php echo (int)$metrics['notificationissues']; ?></strong><span>notification issues</span></div>
      </section>

      <section class="pqlo-grid">
        <article class="pqlo-panel pqlo-panel--wide">
          <h2>Today</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Teacher</th><th>Time</th><th>Status</th><th>Students</th><th>Attendance</th><th>Summaries</th><th>Action</th></tr>
            <?php foreach ($today as $session): ?>
              <tr>
                <td><?php echo s((string)$session->title); ?></td>
                <td><?php echo s(pqlo_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid)); ?></td>
                <td><?php echo userdate((int)$session->scheduled_start, get_string('strftimetime')); ?></td>
                <td><span class="pqlo-pill"><?php echo s((string)$session->status); ?></span></td>
                <td><?php echo (int)$session->student_count; ?></td>
                <td><?php echo (int)$session->attendance_count; ?></td>
                <td><?php echo (int)$session->visible_summary_count; ?></td>
                <td>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">Review</a>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">QA</a>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$today): ?><tr><td colspan="8">No live sessions today.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Post-Class Review Queue</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Ended</th><th>Status</th><th>Counts</th><th>Action</th></tr>
            <?php foreach ($missingreviews as $session): ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqlo-code">#<?php echo (int)$session->id; ?></span></td>
                <td><?php echo userdate((int)$session->scheduled_end, get_string('strftimedatetimeshort')); ?></td>
                <td><span class="pqlo-pill pqlo-pill--warn"><?php echo s((string)$session->status); ?></span></td>
                <td><?php echo (int)$session->attendance_count; ?>/<?php echo (int)$session->student_count; ?> attendance<br><?php echo (int)$session->visible_summary_count; ?>/<?php echo (int)$session->student_count; ?> parent summaries</td>
                <td>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">Open</a>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">QA</a>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$missingreviews): ?><tr><td colspan="5">No recent classes awaiting review.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Teacher Coaching Queue</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Teacher</th><th>Coaching</th><th>Due</th><th>Action</th></tr>
            <?php foreach ($coachingqueue as $session): ?>
              <?php $overdue = !empty($session->qa_coaching_due_date) && (int)$session->qa_coaching_due_date < $now; ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqlo-code">QA <?php echo s(str_replace('_', ' ', (string)$session->qa_status)); ?> - <?php echo (int)$session->qa_score; ?>%</span></td>
                <td><?php echo s(pqlo_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid)); ?></td>
                <td><span class="pqlo-pill <?php echo $overdue ? 'pqlo-pill--bad' : 'pqlo-pill--warn'; ?>"><?php echo s(str_replace('_', ' ', (string)$session->qa_coaching_status)); ?></span><br><span class="pqlo-code"><?php echo s((string)$session->qa_coaching_priority); ?></span></td>
                <td><?php echo !empty($session->qa_coaching_due_date) ? userdate((int)$session->qa_coaching_due_date, get_string('strftimedatetimeshort')) : 'No due date'; ?><?php echo $overdue ? '<br><span class="pqlo-code">overdue</span>' : ''; ?></td>
                <td><a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">Manage coaching</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$coachingqueue): ?><tr><td colspan="5">No active coaching assignments.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Leadership Review Queue</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Teacher</th><th>QA</th><th>Status</th><th>Action</th></tr>
            <?php foreach ($leadershipqueue as $session): ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqlo-code">#<?php echo (int)$session->id; ?></span></td>
                <td><?php echo s(pqlo_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid)); ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$session->qa_status)); ?><br><span class="pqlo-code"><?php echo (int)$session->qa_score; ?>%</span></td>
                <td><span class="pqlo-pill pqlo-pill--bad"><?php echo s(str_replace('_', ' ', (string)$session->leadership_review_status)); ?></span><br><span class="pqlo-code"><?php echo s(pqlo_short((string)$session->leadership_review_reason, 90)); ?></span></td>
                <td><a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">Review</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$leadershipqueue): ?><tr><td colspan="5">No sessions in leadership review.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Teacher Improvement Plans</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Teacher</th><th>Plan</th><th>Due</th><th>Action</th></tr>
            <?php foreach ($improvementqueue as $session): ?>
              <?php $overdue = !empty($session->improvement_plan_due_date) && (int)$session->improvement_plan_due_date < $now; ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqlo-code">#<?php echo (int)$session->id; ?></span></td>
                <td><?php echo s(pqlo_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid)); ?></td>
                <td><span class="pqlo-pill <?php echo $overdue ? 'pqlo-pill--bad' : 'pqlo-pill--warn'; ?>"><?php echo s(str_replace('_', ' ', (string)$session->improvement_plan_status)); ?></span><br><span class="pqlo-code"><?php echo s((string)$session->improvement_plan_priority); ?></span></td>
                <td><?php echo !empty($session->improvement_plan_due_date) ? userdate((int)$session->improvement_plan_due_date, get_string('strftimedatetimeshort')) : 'No due date'; ?><?php echo $overdue ? '<br><span class="pqlo-code">overdue</span>' : ''; ?></td>
                <td><a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php', pqlo_url_params($urlparams, ['teacherid' => (int)$session->teacherid, 'status' => 'all'])))->out(false); ?>">Open leadership</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$improvementqueue): ?><tr><td colspan="5">No active improvement plans.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Quality Review Queue</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Teacher</th><th>QA</th><th>Evidence</th><th>Action</th></tr>
            <?php foreach ($qualityqueue as $session): ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqlo-code"><?php echo userdate((int)$session->scheduled_end, get_string('strftimedatetimeshort')); ?></span></td>
                <td><?php echo s(pqlo_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid)); ?></td>
                <td><span class="pqlo-pill <?php echo (string)$session->qa_status === 'serious_issue' ? 'pqlo-pill--bad' : ((string)$session->qa_status === 'needs_coaching' ? 'pqlo-pill--warn' : ''); ?>"><?php echo s(str_replace('_', ' ', (string)$session->qa_status)); ?></span><br><span class="pqlo-code"><?php echo (int)$session->qa_score; ?>%</span></td>
                <td><?php echo (int)$session->attendance_count; ?>/<?php echo (int)$session->student_count; ?> attendance<br><?php echo (int)$session->visible_summary_count; ?> summaries<br><?php echo (int)$session->recording_count; ?> recordings</td>
                <td><a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', pqlo_url_params($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">Quality review</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$qualityqueue): ?><tr><td colspan="5">No sessions waiting for quality review.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Recording Review Queue</h2>
          <table class="pqlo-table">
            <tr><th>Recording</th><th>Status</th><th>Visibility</th><th>Action</th></tr>
            <?php foreach ($recordingqueue as $recording): ?>
              <tr>
                <td><?php echo s((string)$recording->name); ?><br><span class="pqlo-code"><?php echo s((string)$recording->session_title); ?></span></td>
                <td><span class="pqlo-pill <?php echo (string)$recording->status === 'available' ? 'pqlo-pill--ok' : 'pqlo-pill--warn'; ?>"><?php echo s((string)$recording->status); ?></span></td>
                <td><?php echo !empty($recording->visible_to_parent) ? 'parent visible' : 'hidden'; ?></td>
                <td><a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings_admin.php', $urlparams))->out(false); ?>">Review</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$recordingqueue): ?><tr><td colspan="4">No recordings waiting for review.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Follow-Up Queue</h2>
          <table class="pqlo-table">
            <tr><th>Student</th><th>Session</th><th>Status</th><th>Message</th><th>Action</th></tr>
            <?php foreach ($followupqueue as $note): ?>
              <tr>
                <td><?php echo s(pqlo_user_name((int)$note->studentid, 'Student ' . (int)$note->studentid)); ?></td>
                <td><?php echo s((string)$note->session_title); ?><br><span class="pqlo-code"><?php echo userdate((int)$note->scheduled_start, get_string('strftimedatetimeshort')); ?></span></td>
                <?php $overdue = !empty($note->followup_age_start) && (int)$note->followup_age_start <= $now - (2 * DAYSECS); ?>
                <td>
                  <span class="pqlo-pill <?php echo (string)$note->followup_status === 'admin_support_requested' || $overdue ? 'pqlo-pill--bad' : 'pqlo-pill--warn'; ?>"><?php echo s(str_replace('_', ' ', (string)$note->followup_status)); ?></span>
                  <?php if ($overdue): ?><br><span class="pqlo-code">overdue</span><?php endif; ?>
                </td>
                <td>
                  <?php echo s(pqlo_short((string)$note->followup_message, 180)); ?>
                  <?php if ((string)($note->parent_response_status ?? 'none') !== 'none'): ?>
                    <br><span class="pqlo-code">Parent: <?php echo s(str_replace('_', ' ', (string)$note->parent_response_status)); ?><?php echo !empty($note->parent_responseat) ? ' - ' . userdate((int)$note->parent_responseat, get_string('strftimedatetimeshort')) : ''; ?></span>
                    <?php if ((string)($note->parent_response_message ?? '') !== ''): ?><br><span class="pqlo-code"><?php echo s(pqlo_short((string)$note->parent_response_message, 140)); ?></span><?php endif; ?>
                  <?php endif; ?>
                </td>
                <td>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', pqlo_url_params($urlparams, ['sessionid' => (int)$note->sessionid])))->out(false); ?>">Open</a>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_followup_message.php', pqlo_url_params($urlparams, ['sessionid' => (int)$note->sessionid, 'studentid' => (int)$note->studentid, 'sesskey' => sesskey()])))->out(false); ?>">Message</a>
                  <a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php', pqlo_url_params($urlparams, ['childid' => (int)$note->studentid])))->out(false); ?>">Parent hub</a>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$followupqueue): ?><tr><td colspan="5">No open teacher-parent follow-ups.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>BBB Errors</h2>
          <table class="pqlo-table">
            <tr><th>Session</th><th>Error</th><th>Action</th></tr>
            <?php foreach ($bbberrors as $session): ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqlo-code"><?php echo s((string)$session->bbb_meeting_id); ?></span></td>
                <td><?php echo s(pqlo_short((string)$session->bbb_last_error)); ?></td>
                <td><a class="pqlo-btn pqlo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_diagnostics.php', $urlparams))->out(false); ?>">Diagnostics</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$bbberrors): ?><tr><td colspan="3">No BBB errors recorded.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel">
          <h2>Notification Issues</h2>
          <table class="pqlo-table">
            <tr><th>Time</th><th>Action</th><th>Target</th><th>Details</th></tr>
            <?php foreach ($notificationissues as $audit): ?>
              <tr>
                <td><?php echo userdate((int)$audit->timecreated, get_string('strftimedatetimeshort')); ?></td>
                <td><span class="pqlo-pill <?php echo (string)$audit->action === 'notification_failed' ? 'pqlo-pill--bad' : 'pqlo-pill--warn'; ?>"><?php echo s((string)$audit->action); ?></span></td>
                <td>User #<?php echo (int)$audit->targetid; ?></td>
                <td class="pqlo-code"><?php echo s(pqlo_short((string)$audit->details, 180)); ?></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$notificationissues): ?><tr><td colspan="4">No recent notification issues.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlo-panel pqlo-panel--wide">
          <h2>Teacher Workload, Next 7 Days</h2>
          <table class="pqlo-table">
            <tr><th>Teacher</th><th>Sessions</th><th>Scheduled</th><th>Live</th><th>Next Class</th></tr>
            <?php foreach ($teacherworkload as $row): ?>
              <tr>
                <td><?php echo s(pqlo_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid)); ?></td>
                <td><?php echo (int)$row->session_count; ?></td>
                <td><?php echo (int)$row->scheduled_count; ?></td>
                <td><?php echo (int)$row->live_count; ?></td>
                <td><?php echo !empty($row->next_start) ? userdate((int)$row->next_start, get_string('strftimedatetimeshort')) : ''; ?></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$teacherworkload): ?><tr><td colspan="5">No upcoming teacher workload.</td></tr><?php endif; ?>
          </table>
        </article>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
