<?php
// ---- report: live-practice-coach (Chatbot Practice Coach report; read-only) ----
// Ported from local_hubredirect/live_practice_coach.php via
// live_practice_coach_portallib (pqlpc_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the full Practice Coach report state: metrics, students-supported,
//        sessions (with end-session guidance), and recent coach events, with
//        the same from/to/teacher/student/session/trigger filters as the page.
//        CSV export is served client-side from the returned rows (the page's
//        pqlpc_csv columns) so the endpoint stays JSON-only.
// POST = none. The legacy page has no write blocks (no data_submitted()/action=
//        branches); every control is a GET filter, a link, or the CSV export.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_practice_coach_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same gate as the page top: administrators (academy operations) and teachers
// only, otherwise pqh_access_denied with this exact message.
if (!pqh_can_manage_academy_operations($userid) && !pqlpc_has_teacher_role($userid)) {
    pqpd_fail(403, 'The Chatbot Practice Coach report is available to administrators and teachers only.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The legacy report performs no writes — refuse anything sent here so a
    // future client bug cannot silently no-op.
    pqpd_fail(400, 'The Practice Coach report is read-only; it has no portal write actions.');
}

// -- GET: the report state (queries verbatim from live_practice_coach.php) -----
$canmanage = pqh_can_manage_academy_operations($userid);

$ready = pqlpc_table_exists('local_prequran_practice_coach_event')
    && pqlpc_table_exists('local_prequran_live_session');

$now = time();
$defaultfrom = usergetmidnight($now - (30 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlpc_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlpc_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$trigger = optional_param('trigger', '', PARAM_ALPHANUMEXT);

// Non-managers are scoped to their own sessions (verbatim from the page).
if (!$canmanage) {
    $teacherid = $userid;
}

$where = ['c.timecreated >= :fromtime', 'c.timecreated <= :totime'];
$params = ['fromtime' => $from, 'totime' => $to];
if ($teacherid > 0) {
    $teacherfilter = ['s.teacherid = :teacherid'];
    $params['teacherid'] = $teacherid;
    if (pqlpc_column_exists('local_prequran_live_session', 'report_to_teacherid')) {
        $teacherfilter[] = 's.report_to_teacherid = :reportteacherid';
        $params['reportteacherid'] = $teacherid;
    }
    $where[] = '(' . implode(' OR ', $teacherfilter) . ')';
}
if ($studentid > 0) {
    $where[] = 'c.userid = :studentid';
    $params['studentid'] = $studentid;
}
if ($sessionid > 0) {
    $where[] = 'c.live_sessionid = :sessionid';
    $params['sessionid'] = $sessionid;
}
if ($trigger !== '') {
    $where[] = 'c.trigger_key = :trigger';
    $params['trigger'] = $trigger;
}
$wheresql = implode(' AND ', $where);

$rows = [];
$studentrows = [];
$sessionrows = [];
$metrics = ['events' => 0, 'students' => 0, 'sessions' => 0, 'idle' => 0, 'away' => 0, 'starts' => 0];
$hasmessagefields = $ready && pqlpc_column_exists('local_prequran_practice_coach_event', 'message_source');
$hasrecommendation = $ready && pqlpc_column_exists('local_prequran_practice_coach_event', 'recommendation_key');

if ($ready) {
    $messagesourcefield = $hasmessagefields ? 'c.message_source' : "'' AS message_source";
    $aimodelfield = $hasmessagefields ? 'c.ai_model' : "'' AS ai_model";
    $recommendationkeyfield = $hasrecommendation ? 'c.recommendation_key' : "'' AS recommendation_key";
    $recommendationmessagefield = $hasrecommendation ? 'c.recommendation_message' : "'' AS recommendation_message";
    $rows = array_values($DB->get_records_sql(
        "SELECT c.id,
                c.live_sessionid,
                c.userid,
                c.lessonid,
                c.unitid,
                c.step_id,
                c.event_type,
                c.trigger_key,
                c.message,
                {$messagesourcefield},
                {$aimodelfield},
                {$recommendationkeyfield},
                {$recommendationmessagefield},
                c.timecreated,
                s.title,
                s.teacherid,
                s.scheduled_start
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}
       ORDER BY c.timecreated DESC, c.id DESC",
        $params,
        0,
        300
    ));

    $metricrow = $DB->get_record_sql(
        "SELECT COUNT(1) AS events,
                COUNT(DISTINCT c.userid) AS students,
                COUNT(DISTINCT c.live_sessionid) AS sessions,
                SUM(CASE WHEN c.trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN c.trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                SUM(CASE WHEN c.trigger_key = 'practice_start' THEN 1 ELSE 0 END) AS start_count
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}",
        $params
    );
    if ($metricrow) {
        $metrics = [
            'events' => (int)$metricrow->events,
            'students' => (int)$metricrow->students,
            'sessions' => (int)$metricrow->sessions,
            'idle' => (int)$metricrow->idle_count,
            'away' => (int)$metricrow->away_count,
            'starts' => (int)$metricrow->start_count,
        ];
    }

    $studentrows = array_values($DB->get_records_sql(
        "SELECT c.userid,
                COUNT(1) AS event_count,
                SUM(CASE WHEN c.trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN c.trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                MAX(c.timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}
       GROUP BY c.userid
       ORDER BY event_count DESC, latest_time DESC",
        $params,
        0,
        80
    ));

    $sessionrows = array_values($DB->get_records_sql(
        "SELECT c.live_sessionid,
                MAX(s.title) AS title,
                MAX(s.teacherid) AS teacherid,
                MAX(s.scheduled_start) AS scheduled_start,
                COUNT(1) AS event_count,
                COUNT(DISTINCT c.userid) AS student_count,
                SUM(CASE WHEN c.trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN c.trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                " . ($hasrecommendation ? "SUM(CASE WHEN c.recommendation_key = 'teacher_followup' THEN 1 ELSE 0 END)" : '0') . " AS teacher_followup_count,
                MAX(c.timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}
       GROUP BY c.live_sessionid
       ORDER BY latest_time DESC",
        $params,
        0,
        80
    ));
}

// Decorate for the client: account-number pills (pqh_account_no_label) and
// end-session guidance (pqlpc_session_guidance) — the same helpers the page
// calls inline while rendering.
foreach ($studentrows as $row) {
    $row->account_label = pqlpc_account_label((int)$row->userid);
}
foreach ($rows as $row) {
    $row->account_label = pqlpc_account_label((int)$row->userid);
}
foreach ($sessionrows as $row) {
    $row->guidance = pqlpc_session_guidance($row);
}

// Names for every teacher and student the page renders via pqlpc_user_name.
$nameids = [];
foreach ($studentrows as $row) {
    $nameids[] = (int)($row->userid ?? 0);
}
foreach ($sessionrows as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($rows as $row) {
    $nameids[] = (int)($row->userid ?? 0);
    $nameids[] = (int)($row->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'canmanage' => $canmanage,
    'now' => $now,
    'filters' => [
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'sessionid' => $sessionid,
        'trigger' => $trigger,
    ],
    'metrics' => $metrics,
    'studentrows' => array_values($studentrows),
    'sessionrows' => array_values($sessionrows),
    'rows' => array_values($rows),
    'flags' => [
        'hasmessagefields' => $hasmessagefields,
        'hasrecommendation' => $hasrecommendation,
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
