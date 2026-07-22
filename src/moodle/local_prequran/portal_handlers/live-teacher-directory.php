<?php
// ---- report: live-teacher-directory (academy-operations teacher directory & profile finder; read-only) ----
// Ported from local_hubredirect/live_teacher_directory.php via
// live_teacher_directory_portallib (pqltdl_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the directory table exactly as the page renders it: session-active
//        teachers plus profile-only teachers, decorated with QA / attention /
//        open-work metrics and the six headline counters, workspace-filtered.
// POST = none. The legacy page has zero write blocks (no data_submitted()/
//        action= branches); its only side output is a GET-triggered CSV export,
//        which the portal client rebuilds from this JSON. Refuse POSTs.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_teacher_directory_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same gate as the page top: pqh_require_academy_operations(...) -> allowed when
// pqh_can_manage_academy_operations(), otherwise pqh_access_denied with this
// exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view the teacher directory.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The teacher directory performs no writes — refuse anything sent here so a
    // future client bug cannot silently no-op.
    pqpd_fail(400, 'The teacher directory is read-only; it has no portal write actions.');
}

// -- GET: the directory table (computation verbatim from live_teacher_directory.php) --
// The page resolves the workspace from ?workspaceid= or the consumer context;
// the portal client passes it explicitly (consumer-host detection does not apply
// on the Bunny origin).
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);

$now = time();
$defaultfrom = usergetmidnight($now - (180 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqltdl_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqltdl_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$query = trim(optional_param('q', '', PARAM_TEXT));
$filter = optional_param('filter', 'all', PARAM_ALPHANUMEXT);
$ready = pqltdl_ready();

$teachers = [];
$metrics = [
    'teachers' => 0,
    'attention' => 0,
    'lowqa' => 0,
    'openplans' => 0,
    'openfollowups' => 0,
    'leadership' => 0,
];

if ($ready) {
    $workspacefilter = '';
    $workspaceparams = [];
    if ($workspaceid > 0 && pqltdl_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilter = ' AND s.workspaceid = :workspaceid';
        $workspaceparams['workspaceid'] = $workspaceid;
    }
    $qaready = pqltdl_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqltdl_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqltdl_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqltdl_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $followupready = pqltdl_table_exists('local_prequran_live_note') && pqltdl_column_exists('local_prequran_live_note', 'followup_status');

    $qaselect = $qaready
        ? "SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_count,
           ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
           SUM(CASE WHEN s.qa_status = 'passed' THEN 1 ELSE 0 END) AS passed_count,
           SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issue_count,
           SUM(CASE WHEN s.qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
           MAX(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_reviewedat ELSE 0 END) AS last_qa_time,"
        : "0 AS reviewed_count, 0 AS avg_qa_score, 0 AS passed_count, 0 AS qa_issue_count, 0 AS serious_issue_count, 0 AS last_qa_time,";
    $coachingselect = $coachingready
        ? "SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open_count,
           SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') AND s.qa_coaching_due_date > 0 AND s.qa_coaching_due_date < :nowtime_coaching THEN 1 ELSE 0 END) AS coaching_overdue_count,"
        : "0 AS coaching_open_count, 0 AS coaching_overdue_count,";
    $leadershipselect = $leadershipready
        ? "SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open_count,"
        : "0 AS leadership_open_count,";
    $improvementselect = $improvementready
        ? "SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plan_open_count,
           SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') AND s.improvement_plan_due_date > 0 AND s.improvement_plan_due_date < :nowtime_improvement THEN 1 ELSE 0 END) AS plan_overdue_count,"
        : "0 AS plan_open_count, 0 AS plan_overdue_count,";
    $followupselect = $followupready
        ? "(SELECT COUNT(1)
              FROM {local_prequran_live_note} n
              JOIN {local_prequran_live_session} sn ON sn.id = n.sessionid
             WHERE sn.teacherid = s.teacherid
               AND n.followup_status <> 'none'
               AND n.followup_resolved = 0" . ($workspacefilter !== '' ? " AND sn.workspaceid = :workspaceid_followup" : '') . ") AS followup_open_count"
        : "0 AS followup_open_count";

    $params = [
        'fromtime' => $from,
        'totime' => $to,
        'cancelled' => 'cancelled',
        'nowtime_upcoming' => $now,
    ];
    if ($workspacefilter !== '') {
        $params['workspaceid'] = $workspaceid;
        $params['workspaceid_followup'] = $workspaceid;
    }
    if ($coachingready) {
        $params['nowtime_coaching'] = $now;
    }
    if ($improvementready) {
        $params['nowtime_improvement'] = $now;
    }
    $teachers = array_values($DB->get_records_sql(
        "SELECT s.teacherid,
                u.firstname,
                u.lastname,
                u.email,
                u.suspended,
                u.deleted,
                COUNT(1) AS session_count,
                COUNT(DISTINCT p.studentid) AS distinct_students,
                MIN(s.scheduled_start) AS first_session,
                MAX(s.scheduled_start) AS last_session,
                SUM(CASE WHEN s.scheduled_start >= :nowtime_upcoming THEN 1 ELSE 0 END) AS upcoming_count,
                {$qaselect}
                {$coachingselect}
                {$leadershipselect}
                {$improvementselect}
                {$followupselect}
           FROM {local_prequran_live_session} s
      LEFT JOIN {user} u ON u.id = s.teacherid
      LEFT JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
          WHERE s.scheduled_start >= :fromtime
            AND s.scheduled_start <= :totime
            AND s.status <> :cancelled
            {$workspacefilter}
       GROUP BY s.teacherid, u.firstname, u.lastname, u.email, u.suspended, u.deleted
       ORDER BY last_session DESC, session_count DESC",
        $params,
        0,
        1000
    ));

    if (pqltdl_table_exists('local_prequran_teacher_profile')) {
        $indexedteachers = [];
        foreach ($teachers as $row) {
            $indexedteachers[(int)$row->teacherid] = true;
        }
        $profilejoinsql = '';
        $profilewheresql = 'WHERE u.deleted = 0';
        $profileparams = [];
        if ($workspaceid > 0) {
            $workspacefilters = [];
            if (pqltdl_table_exists('local_prequran_workspace_member')) {
                $profilejoinsql = " LEFT JOIN {local_prequran_workspace_member} wm ON wm.userid = tp.userid
                                      AND wm.workspaceid = :profileworkspaceid
                                      AND wm.status = :profilememberstatus
                                      AND wm.workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')";
                $workspacefilters[] = 'wm.id IS NOT NULL';
                $profileparams += [
                    'profileworkspaceid' => $workspaceid,
                    'profilememberstatus' => 'active',
                ];
            }
            if (pqltdl_column_exists('local_prequran_teacher_profile', 'workspaceid')
                    && pqltdl_column_exists('local_prequran_teacher_profile', 'teacher_work_models')) {
                $workspacefilters[] = "(tp.workspaceid = :profileworkspaceid2 AND LOWER(tp.teacher_work_models) LIKE '%independent%')";
                $profileparams['profileworkspaceid2'] = $workspaceid;
            }
            if ($workspacefilters) {
                $profilewheresql .= ' AND (' . implode(' OR ', $workspacefilters) . ')';
            } else {
                $profilewheresql .= ' AND 1 = 0';
            }
        }
        if (pqltdl_column_exists('local_prequran_teacher_profile', 'status')) {
            $profilewheresql .= ' AND LOWER(tp.status) NOT IN (:profilearchived, :profileinactive, :profilerejected)';
            $profileparams += ['profilearchived' => 'archived', 'profileinactive' => 'inactive', 'profilerejected' => 'rejected'];
        }
        $profileteachers = $DB->get_records_sql(
            "SELECT tp.userid AS teacherid,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.suspended,
                    u.deleted,
                    0 AS session_count,
                    0 AS distinct_students,
                    0 AS first_session,
                    0 AS last_session,
                    0 AS upcoming_count,
                    0 AS reviewed_count,
                    0 AS avg_qa_score,
                    0 AS passed_count,
                    0 AS qa_issue_count,
                    0 AS serious_issue_count,
                    0 AS last_qa_time,
                    0 AS coaching_open_count,
                    0 AS coaching_overdue_count,
                    0 AS leadership_open_count,
                    0 AS plan_open_count,
                    0 AS plan_overdue_count,
                    0 AS followup_open_count
               FROM {local_prequran_teacher_profile} tp
               JOIN {user} u ON u.id = tp.userid
                    {$profilejoinsql}
              {$profilewheresql}
           ORDER BY tp.timemodified DESC",
            $profileparams,
            0,
            1000
        );
        foreach ($profileteachers as $row) {
            if (!isset($indexedteachers[(int)$row->teacherid])) {
                $teachers[] = $row;
            }
        }
    }

    $filtered = [];
    foreach ($teachers as $row) {
        $row->teacher_name = pqltdl_user_name($row);
        $row->pass_rate = pqltdl_percent((int)$row->passed_count, (int)$row->reviewed_count);
        $row->review_coverage = pqltdl_percent((int)$row->reviewed_count, (int)$row->session_count);
        $row->low_qa = (int)$row->reviewed_count > 0 && (int)$row->avg_qa_score < 75;
        $row->no_recent_qa = (int)$row->session_count > 0 && ((int)$row->last_qa_time === 0 || (int)$row->last_qa_time < ($now - (30 * DAYSECS)));
        $row->inactive_30 = (int)$row->last_session > 0 && (int)$row->last_session < ($now - (30 * DAYSECS));
        $row->needs_attention = $row->low_qa
            || (int)$row->qa_issue_count > 0
            || (int)$row->coaching_open_count > 0
            || (int)$row->plan_open_count > 0
            || (int)$row->leadership_open_count > 0
            || (int)$row->followup_open_count > 0;

        $searchhaystack = core_text::strtolower($row->teacher_name . ' ' . (string)$row->email . ' ' . (int)$row->teacherid);
        if ($query !== '' && strpos($searchhaystack, core_text::strtolower($query)) === false) {
            continue;
        }
        if ($filter === 'needs_attention' && !$row->needs_attention) {
            continue;
        }
        if ($filter === 'open_plan' && (int)$row->plan_open_count <= 0) {
            continue;
        }
        if ($filter === 'low_qa' && !$row->low_qa) {
            continue;
        }
        if ($filter === 'no_recent_qa' && !$row->no_recent_qa) {
            continue;
        }
        if ($filter === 'open_followup' && (int)$row->followup_open_count <= 0) {
            continue;
        }
        if ($filter === 'leadership' && (int)$row->leadership_open_count <= 0) {
            continue;
        }
        if ($filter === 'coaching' && (int)$row->coaching_open_count <= 0) {
            continue;
        }
        if ($filter === 'inactive_30' && !$row->inactive_30) {
            continue;
        }
        $filtered[] = $row;
    }
    $teachers = $filtered;

    foreach ($teachers as $row) {
        $metrics['teachers']++;
        $metrics['attention'] += !empty($row->needs_attention) ? 1 : 0;
        $metrics['lowqa'] += !empty($row->low_qa) ? 1 : 0;
        $metrics['openplans'] += (int)$row->plan_open_count > 0 ? 1 : 0;
        $metrics['openfollowups'] += (int)$row->followup_open_count > 0 ? 1 : 0;
        $metrics['leadership'] += (int)$row->leadership_open_count > 0 ? 1 : 0;
    }
}

// Names for every teacher rendered (the row already carries the resolved
// teacher_name; the map keeps parity with the other portal handlers).
$nameids = [];
foreach ($teachers as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'now' => $now,
    'from' => date('Y-m-d', $from),
    'to' => date('Y-m-d', $to),
    'workspaceid' => $workspaceid,
    'query' => $query,
    'filter' => $filter,
    'metrics' => $metrics,
    'teachers' => array_values($teachers),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
