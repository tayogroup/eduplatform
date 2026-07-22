<?php
// ---- report: live-ops (academy-operations live-ops console; read-only) ----
// Ported from local_hubredirect/live_ops.php via live_ops_portallib (pqlopl_*).
// Included from portal_data.php AFTER token auth: $claims verified, $USER set
// to the token user, JSON exception handler installed, headers sent.
// GET  = the full ops console state: 19 metrics + today's sessions, review /
//        QA / coaching / leadership / improvement / recording / follow-up /
//        notification queues and teacher workload, workspace-filtered.
// POST = none. The legacy page has zero write blocks (no data_submitted()/
//        action= branches); every button is a link to another admin page.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_ops_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same gate as the page top: pqh_require_academy_operations(...) -> allowed
// when pqh_can_manage_academy_operations(), otherwise pqh_access_denied with
// this exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view live-session operations.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The legacy console performs no writes — refuse anything sent here so a
    // future client bug cannot silently no-op.
    pqpd_fail(400, 'Live operations is read-only; it has no portal write actions.');
}

// -- GET: the ops console state (queries verbatim from live_ops.php) ----------
$ready = pqlopl_ready();
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
$followupready = false;
$parentresponseready = false;
$qualityready = false;
$coachingready = false;
$leadershipready = false;
$improvementready = false;
// The page resolves the workspace from ?workspaceid= or the consumer context;
// the portal client passes it explicitly (consumer-host detection does not
// apply on the Bunny origin).
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);

if ($ready) {
    $workspacefilter = '';
    $workspaceparams = [];
    $workspacefilteralias = '';
    $workspaceparamsalias = [];
    if ($workspaceid > 0 && pqlopl_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilter = ' AND workspaceid = :workspaceid';
        $workspaceparams = ['workspaceid' => $workspaceid];
        $workspacefilteralias = ' AND s.workspaceid = :workspaceid';
        $workspaceparamsalias = ['workspaceid' => $workspaceid];
    }
    $followupready = pqlopl_column_exists('local_prequran_live_note', 'followup_status');
    $parentresponseready = pqlopl_column_exists('local_prequran_live_note', 'parent_response_status');
    $qualityready = pqlopl_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqlopl_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqlopl_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqlopl_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $metrics['today'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE scheduled_start >= :starttime
            AND scheduled_start < :endtime
            AND status <> :cancelled
            {$workspacefilter}",
        array_merge(['starttime' => $todaystart, 'endtime' => $todayend, 'cancelled' => 'cancelled'], $workspaceparams)
    );
    $metrics['upcoming'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE scheduled_start >= :nowtime
            AND scheduled_start < :untiltime
            AND status <> :cancelled
            {$workspacefilter}",
        array_merge(['nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled'], $workspaceparams)
    );
    $metrics['awaitingreview'] = pqlopl_count_sql(
        "SELECT COUNT(1)
          FROM {local_prequran_live_session}
          WHERE status = :status
            {$workspacefilter}",
        array_merge(['status' => 'awaiting_review'], $workspaceparams)
    );
    $metrics['missingreview'] = pqlopl_count_sql(
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
    $metrics['bbberrors'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE bbb_last_error IS NOT NULL
            AND bbb_last_error <> ''
            {$workspacefilter}",
        $workspaceparams
    );
    $metrics['recordingqueue'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording} r
      LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
          WHERE r.status = :available
            AND (r.reviewedat = 0 OR r.visible_to_parent = 0)
            {$workspacefilteralias}",
        array_merge(['available' => 'available'], $workspaceparamsalias)
    );
    if ($qualityready) {
        $metrics['qualityqueue'] = pqlopl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_status IN ('not_reviewed', 'needs_coaching', 'serious_issue')
                {$workspacefilter}",
            array_merge(['cancelled' => 'cancelled'], $workspaceparams)
        );
        $metrics['qualityissues'] = pqlopl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_status IN ('needs_coaching', 'serious_issue')
                {$workspacefilter}",
            array_merge(['cancelled' => 'cancelled'], $workspaceparams)
        );
    }
    if ($coachingready) {
        $metrics['coachingqueue'] = pqlopl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspacefilter}",
            $workspaceparams
        );
        $metrics['coachingoverdue'] = pqlopl_count_sql(
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
        $metrics['leadershipqueue'] = pqlopl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE leadership_review_status IN ('flagged', 'in_review')
                {$workspacefilter}",
            $workspaceparams
        );
    }
    if ($improvementready) {
        $metrics['improvementplans'] = pqlopl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                {$workspacefilter}",
            $workspaceparams
        );
        $metrics['improvementoverdue'] = pqlopl_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                AND improvement_plan_due_date > 0
                AND improvement_plan_due_date < :nowtime
                {$workspacefilter}",
            array_merge(['nowtime' => $now], $workspaceparams)
        );
        $metrics['improvementalerts'] = pqlopl_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_audit}
              WHERE action IN ('improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_overdue', 'improvement_plan_admin_escalated')
                AND timecreated >= :fromtime",
            ['fromtime' => $now - (7 * DAYSECS)]
        );
    }
    $metrics['notificationissues'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('notification_failed', 'notification_skipped')
            AND timecreated >= :fromtime",
        ['fromtime' => $now - (7 * DAYSECS)]
    );
    $metrics['parentpreviews'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action = :action
            AND timecreated >= :fromtime",
        ['action' => 'parent_trust_preview_opened', 'fromtime' => $now - (7 * DAYSECS)]
    );
    $metrics['qualityreminders'] = pqlopl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('quality_review_reminder_sent', 'quality_coaching_teacher_reminder_sent', 'quality_coaching_admin_escalated', 'quality_coaching_overdue', 'improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_overdue', 'improvement_plan_admin_escalated')
            AND timecreated >= :fromtime",
        ['fromtime' => $now - (7 * DAYSECS)]
    );
    if ($followupready) {
        $metrics['followups'] = pqlopl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_note}
              WHERE followup_status <> :none
                AND followup_resolved = 0
                AND sessionid IN (
                    SELECT id FROM {local_prequran_live_session} s WHERE 1 = 1 {$workspacefilteralias}
                )",
            array_merge(['none' => 'none'], $workspaceparamsalias)
        );
        $metrics['overduefollowups'] = pqlopl_count_sql(
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

// Names for everyone the page renders via pqlo_user_name (teachers everywhere,
// students in the follow-up queue).
$nameids = [];
foreach ([$today, $missingreviews, $bbberrors, $recordingqueue, $qualityqueue, $coachingqueue, $leadershipqueue, $improvementqueue, $teacherworkload] as $rows) {
    foreach ($rows as $row) {
        $nameids[] = (int)($row->teacherid ?? 0);
    }
}
foreach ($followupqueue as $note) {
    $nameids[] = (int)($note->studentid ?? 0);
    $nameids[] = (int)($note->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'now' => $now,
    'todaystart' => $todaystart,
    'workspaceid' => $workspaceid,
    'metrics' => $metrics,
    'today' => array_values($today),
    'missingreviews' => array_values($missingreviews),
    'bbberrors' => array_values($bbberrors),
    'recordingqueue' => array_values($recordingqueue),
    'qualityqueue' => array_values($qualityqueue),
    'coachingqueue' => array_values($coachingqueue),
    'leadershipqueue' => array_values($leadershipqueue),
    'improvementqueue' => array_values($improvementqueue),
    'notificationissues' => array_values($notificationissues),
    'followupqueue' => array_values($followupqueue),
    'teacherworkload' => array_values($teacherworkload),
    'flags' => [
        'followupready' => $followupready,
        'parentresponseready' => $parentresponseready,
        'qualityready' => $qualityready,
        'coachingready' => $coachingready,
        'leadershipready' => $leadershipready,
        'improvementready' => $improvementready,
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
