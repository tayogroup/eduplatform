<?php
// ---- report: live-leadership (leadership review command center; read + write) --
// Ported from local_hubredirect/live_leadership.php via
// live_leadership_portallib (pqllp_*). Included from portal_data.php AFTER token
// auth: $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent.
// GET  = the leadership dataset the legacy page renders (open/flagged/in-review/
//        cleared metrics, coaching + improvement-plan rollups, up to 200 flagged
//        QA cases, the recent leadership audit) with the page's own filters
//        (from, to, teacherid, status, reason, workspaceid). The legacy
//        export=cases CSV is built client-side from these same case rows.
// POST = do=update_case (the page's action=update_case write verbatim: status
//        whitelist, leadership reason/notes, improvement-plan lifecycle,
//        cleared/review stamping, dual audit map). confirm_sesskey() dropped:
//        token auth replaces the session key; redirect replaced by ok JSON.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_leadership_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same entry gate as the page: pqh_require_academy_operations(...) checks
// pqh_can_manage_academy_operations and denies with this exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can manage leadership reviews.');
}

$ready = pqllp_ready();
$improvementready = $ready && pqllp_column_exists('local_prequran_live_session', 'improvement_plan_status');
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
$hasworkspacecol = pqllp_column_exists('local_prequran_live_session', 'workspaceid');
$now = time();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: update_case (legacy action=update_case, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'update_case') {
        if (!$ready) {
            pqpd_fail(403, 'Leadership review columns are not installed yet. Run Phase 34 SQL first.');
        }
        $sessionid = (int)($body['sessionid'] ?? 0);
        if ($sessionid <= 0) {
            pqpd_fail(403, 'Choose a valid live session before updating a leadership case.');
        }
        $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
        if (!$session) {
            pqpd_fail(403, 'Choose a valid live session before updating a leadership case.');
        }
        $oldstatus = (string)$session->leadership_review_status;
        $newstatus = clean_param((string)($body['leadership_review_status'] ?? 'flagged'), PARAM_ALPHANUMEXT);
        if (!in_array($newstatus, ['flagged', 'in_review', 'cleared'], true)) {
            $newstatus = 'flagged';
        }

        $session->leadership_review_status = $newstatus;
        $session->leadership_review_reason = pqllp_clean_text((string)($body['leadership_review_reason'] ?? ''), 4000);
        $session->leadership_review_notes = pqllp_clean_text((string)($body['leadership_review_notes'] ?? ''), 6000);
        $oldplanstatus = $improvementready ? (string)$session->improvement_plan_status : 'none';
        $newplanstatus = $oldplanstatus;
        if ($improvementready) {
            $newplanstatus = clean_param((string)($body['improvement_plan_status'] ?? 'none'), PARAM_ALPHANUMEXT);
            if (!in_array($newplanstatus, ['none', 'assigned', 'in_progress', 'completed'], true)) {
                $newplanstatus = 'none';
            }
            $session->improvement_plan_status = $newplanstatus;
            $session->improvement_plan_goals = pqllp_clean_text((string)($body['improvement_plan_goals'] ?? ''), 6000);
            $session->improvement_plan_actions = pqllp_clean_text((string)($body['improvement_plan_actions'] ?? ''), 6000);
            $session->improvement_plan_due_date = pqllp_clean_due_date((string)($body['improvement_plan_due_date'] ?? ''));
            $priority = clean_param((string)($body['improvement_plan_priority'] ?? 'normal'), PARAM_ALPHANUMEXT);
            $session->improvement_plan_priority = in_array($priority, ['high', 'normal', 'low'], true) ? $priority : 'normal';
            $session->improvement_plan_mentorid = (int)($body['improvement_plan_mentorid'] ?? 0);
            $session->improvement_plan_completion_notes = pqllp_clean_text((string)($body['improvement_plan_completion_notes'] ?? ''), 6000);
            if ($newplanstatus !== 'none' && $oldplanstatus === 'none') {
                $session->improvement_plan_assignedby = (int)$USER->id;
                $session->improvement_plan_assignedat = time();
                $session->improvement_plan_ackby = 0;
                $session->improvement_plan_ackat = 0;
                $session->improvement_plan_completedby = 0;
                $session->improvement_plan_completedat = 0;
            }
            if ($newplanstatus === 'completed' && $oldplanstatus !== 'completed') {
                $session->improvement_plan_completedby = (int)$USER->id;
                $session->improvement_plan_completedat = time();
            }
            if ($newplanstatus !== 'completed' && $oldplanstatus === 'completed') {
                $session->improvement_plan_completedby = 0;
                $session->improvement_plan_completedat = 0;
            }
            if ($newplanstatus === 'none') {
                $session->improvement_plan_ackby = 0;
                $session->improvement_plan_ackat = 0;
                $session->improvement_plan_completedby = 0;
                $session->improvement_plan_completedat = 0;
            }
        }
        if ($newstatus === 'cleared') {
            $session->leadership_clearedby = (int)$USER->id;
            $session->leadership_clearedat = time();
        } else {
            $session->leadership_reviewby = (int)$USER->id;
            $session->leadership_reviewat = time();
            $session->leadership_clearedby = 0;
            $session->leadership_clearedat = 0;
        }
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);

        $action = $newstatus === 'cleared' ? 'leadership_review_cleared' : 'leadership_review_updated';
        pqllp_audit($sessionid, $action, [
            'oldstatus' => $oldstatus,
            'newstatus' => $newstatus,
            'source' => 'leadership_dashboard',
            'reason' => (string)$session->leadership_review_reason,
        ]);
        if ($improvementready) {
            $planaction = 'improvement_plan_updated';
            if ($oldplanstatus === 'none' && $newplanstatus !== 'none') {
                $planaction = 'improvement_plan_assigned';
            } else if ($oldplanstatus !== 'completed' && $newplanstatus === 'completed') {
                $planaction = 'improvement_plan_completed';
            } else if ($oldplanstatus === 'completed' && $newplanstatus !== 'completed') {
                $planaction = 'improvement_plan_reopened';
            }
            pqllp_audit($sessionid, $planaction, [
                'oldstatus' => $oldplanstatus,
                'newstatus' => $newplanstatus,
                'priority' => (string)$session->improvement_plan_priority,
                'mentorid' => (int)$session->improvement_plan_mentorid,
                'duedate' => (int)$session->improvement_plan_due_date,
            ]);
        }
        echo json_encode([
            'ok' => true,
            'message' => 'Leadership case updated.',
            'sessionid' => $sessionid,
            'leadership_review_status' => $newstatus,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown leadership action.');
}

// -- GET: the leadership dataset (same filter parsing as the page) --
$defaultfrom = usergetmidnight($now - (180 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqllp_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqllp_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$status = optional_param('status', 'open', PARAM_ALPHANUMEXT);
$reasonfilter = optional_param('reason', '', PARAM_TEXT);

$where = ['s.scheduled_start >= :fromtime', 's.scheduled_start <= :totime'];
$params = ['fromtime' => $from, 'totime' => $to];
if ($teacherid > 0) {
    $where[] = 's.teacherid = :teacherid';
    $params['teacherid'] = $teacherid;
}
if ($status === 'open') {
    $where[] = "s.leadership_review_status IN ('flagged', 'in_review')";
} else if (in_array($status, ['flagged', 'in_review', 'cleared', 'none'], true)) {
    $where[] = 's.leadership_review_status = :leadstatus';
    $params['leadstatus'] = $status;
}
if (trim($reasonfilter) !== '') {
    $where[] = $DB->sql_like('s.leadership_review_reason', ':reasonfilter', false);
    $params['reasonfilter'] = '%' . $DB->sql_like_escape($reasonfilter) . '%';
}
if ($workspaceid > 0 && $hasworkspacecol) {
    $where[] = 's.workspaceid = :workspaceid';
    $params['workspaceid'] = $workspaceid;
}
$wheresql = implode(' AND ', $where);
$metricwhere = '';
$metricparams = [];
if ($workspaceid > 0 && $hasworkspacecol) {
    $metricwhere = ' AND workspaceid = :metricworkspaceid';
    $metricparams['metricworkspaceid'] = $workspaceid;
}

$cases = [];
$metrics = ['open' => 0, 'flagged' => 0, 'inreview' => 0, 'cleared' => 0, 'serious' => 0, 'overduecoaching' => 0, 'plansopen' => 0, 'plansoverdue' => 0, 'planscompleted' => 0];
$audits = [];

if ($ready) {
    $cases = array_values($DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       ORDER BY CASE s.leadership_review_status
                    WHEN 'flagged' THEN 1
                    WHEN 'in_review' THEN 2
                    WHEN 'cleared' THEN 3
                    ELSE 4
                END,
                s.leadership_reviewat DESC,
                s.scheduled_start DESC,
                s.id DESC",
        $params,
        0,
        200
    ));

    $metrics['open'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status IN ('flagged', 'in_review'){$metricwhere}",
        $metricparams
    );
    $metrics['flagged'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status = :status{$metricwhere}",
        ['status' => 'flagged'] + $metricparams
    );
    $metrics['inreview'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status = :status{$metricwhere}",
        ['status' => 'in_review'] + $metricparams
    );
    $metrics['cleared'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status = :status{$metricwhere}",
        ['status' => 'cleared'] + $metricparams
    );
    $metrics['serious'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE qa_status = :status{$metricwhere}",
        ['status' => 'serious_issue'] + $metricparams
    );
    $metrics['overduecoaching'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE qa_coaching_status IN ('assigned', 'acknowledged')
            AND qa_coaching_due_date > 0
            AND qa_coaching_due_date < :nowtime{$metricwhere}",
        ['nowtime' => $now] + $metricparams
    );
    if ($improvementready) {
        $metrics['plansopen'] = (int)$DB->count_records_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress'){$metricwhere}",
            $metricparams
        );
        $metrics['plansoverdue'] = (int)$DB->count_records_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                AND improvement_plan_due_date > 0
                AND improvement_plan_due_date < :nowtime{$metricwhere}",
            ['nowtime' => $now] + $metricparams
        );
        $metrics['planscompleted'] = (int)$DB->count_records_sql(
            "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE improvement_plan_status = :status{$metricwhere}",
            ['status' => 'completed'] + $metricparams
        );
    }

    $audits = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action IN (
              'leadership_review_auto_flagged',
              'leadership_review_auto_skipped',
              'leadership_review_admin_notified',
              'leadership_review_flagged',
              'leadership_review_updated',
              'leadership_review_cleared',
              'improvement_plan_assigned',
              'improvement_plan_updated',
              'improvement_plan_acknowledged',
              'improvement_plan_completed',
              'improvement_plan_reopened'
          )
       ORDER BY timecreated DESC, id DESC",
        [],
        0,
        50
    ));
}

$nameids = [];
foreach ($cases as $case) {
    $nameids[] = (int)$case->teacherid;
}
foreach ($audits as $audit) {
    $nameids[] = (int)$audit->actorid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'improvementready' => $improvementready,
    'now' => $now,
    'filters' => [
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'teacherid' => $teacherid,
        'status' => $status,
        'reason' => $reasonfilter,
        'workspaceid' => $workspaceid,
    ],
    'metrics' => $metrics,
    'cases' => $cases,
    'audits' => $audits,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
