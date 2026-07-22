<?php
// Portal data endpoint (hubredirect Phase C) — token-gated JSON for portal pages
// hosted on Bunny. First report: live-reports (ported query-for-query from
// local_hubredirect/live_reports.php, which stays live in parallel).
//
//   GET portal_data.php?report=summary&token=…&from=YYYY-MM-DD&to=…&teacherid=&studentid=&status=&seriesid=
//   GET portal_data.php?report=attendance&token=…&…same filters…&drillsessionid=&drillteacherid=
//
// Auth: a portal-scoped launch token (claims.course = "portal:live-reports")
// minted by portal_launch.php AFTER the same pqh_can_manage_academy_operations
// check the PHP page enforces. Query-string token keeps every request a simple
// CORS request (no preflight).

define('NO_MOODLE_COOKIES', true);
require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($allowed = pqpg_allowed_origin($origin)) {
    header('Access-Control-Allow-Origin: ' . $allowed);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function pqpd_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

$token = (string)($_GET['token'] ?? '');
if ($token === '' && preg_match('/Bearer\s+(\S+)/i', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''), $m)) {
    $token = $m[1];
}
if ($token === '') {
    pqpd_fail(401, 'Missing portal token.');
}
$claims = pqpg_verify_token($token);
if ($claims === null || (string)($claims['course'] ?? '') !== 'portal:live-reports') {
    pqpd_fail(401, 'Invalid, expired, or wrong-scope portal token.');
}

// ---- helpers ported from live_reports.php ----------------------------------

function pqpd_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpd_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqpd_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqpd_ready(): bool {
    return pqpd_table_exists('local_prequran_live_session')
        && pqpd_table_exists('local_prequran_live_participant')
        && pqpd_table_exists('local_prequran_live_attendance')
        && pqpd_table_exists('local_prequran_live_note')
        && pqpd_table_exists('local_prequran_live_recording')
        && pqpd_table_exists('local_prequran_live_audit');
}

function pqpd_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqpd_names(array $userids): array {
    global $DB;
    $userids = array_values(array_unique(array_filter(array_map('intval', $userids))));
    if (!$userids) {
        return new stdClass();
    }
    $users = $DB->get_records_list('user', 'id', $userids, '', 'id,firstname,lastname,firstnamephonetic,lastnamephonetic,middlename,alternatename');
    $names = [];
    foreach ($users as $user) {
        $names[(int)$user->id] = fullname($user);
    }
    return (object)$names;
}

// ---- filters (identical semantics to the PHP page) --------------------------

$now = time();
$defaultfrom = usergetmidnight($now - (30 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqpd_clean_date(optional_param('from', '', PARAM_TEXT), $defaultfrom);
$to = pqpd_clean_date(optional_param('to', '', PARAM_TEXT), $defaultto - DAYSECS + 1) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$status = optional_param('status', '', PARAM_ALPHANUMEXT);
$seriesid = optional_param('seriesid', 0, PARAM_INT);
$report = optional_param('report', 'summary', PARAM_ALPHANUMEXT);

$where = ["s.scheduled_start >= :fromtime", "s.scheduled_start <= :totime"];
$params = ['fromtime' => $from, 'totime' => $to];
if ($teacherid > 0) {
    $where[] = "s.teacherid = :teacherid";
    $params['teacherid'] = $teacherid;
}
if ($status !== '') {
    $where[] = "s.status = :status";
    $params['status'] = $status;
}
if ($seriesid > 0 && pqpd_column_exists('local_prequran_live_session', 'seriesid')) {
    $where[] = "s.seriesid = :seriesid";
    $params['seriesid'] = $seriesid;
}
if ($studentid > 0) {
    $where[] = "EXISTS (SELECT 1 FROM {local_prequran_live_participant} sp
        WHERE sp.sessionid = s.id AND sp.role = 'student' AND sp.status = 'active' AND sp.studentid = :studentid)";
    $params['studentid'] = $studentid;
}
$wheresql = implode(' AND ', $where);

if (!pqpd_ready()) {
    echo json_encode(['ok' => true, 'ready' => false]);
    exit;
}

// ---- report: attendance (also the drill view) --------------------------------

if ($report === 'attendance') {
    $drillsessionid = optional_param('drillsessionid', 0, PARAM_INT);
    $drillteacherid = optional_param('drillteacherid', 0, PARAM_INT);
    if ($drillsessionid > 0) {
        $where[] = "s.id = :drillsessionid";
        $params['drillsessionid'] = $drillsessionid;
    }
    if ($drillteacherid > 0) {
        $where[] = "s.teacherid = :drillteacherid";
        $params['drillteacherid'] = $drillteacherid;
    }
    $rows = array_values($DB->get_records_sql(
        "SELECT p.id AS participantid, s.id AS sessionid, s.title, s.teacherid, s.scheduled_start,
                p.studentid, a.attendance_status, a.participation_status, a.technical_issue, a.join_time
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
          WHERE " . implode(' AND ', $where) . "
       ORDER BY s.scheduled_start DESC, s.id DESC, p.studentid ASC",
        $params, 0, 5000
    ));
    $ids = [];
    foreach ($rows as $row) {
        $ids[] = (int)$row->teacherid;
        $ids[] = (int)$row->studentid;
    }
    echo json_encode(['ok' => true, 'ready' => true, 'rows' => $rows, 'names' => pqpd_names($ids)], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- report: summary (default) ----------------------------------------------

$qualityready = pqpd_column_exists('local_prequran_live_session', 'qa_status');
$coachingready = pqpd_column_exists('local_prequran_live_session', 'qa_coaching_status');

$sessionselect = "SELECT s.*,
        (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.attendance_status = 'present') AS present_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.attendance_status = 'late') AS late_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.attendance_status = 'absent') AS absent_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.technical_issue = 1) AS technical_issue_count,
        (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1) AS visible_summary_count,
        (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(COALESCE(n.homework, '')) <> '') AS homework_count,
        (SELECT COUNT(1) FROM {local_prequran_live_recording} r WHERE r.sessionid = s.id AND r.status = 'available') AS recording_count,
        (SELECT COUNT(1) FROM {local_prequran_live_recording} r WHERE r.sessionid = s.id AND r.status = 'available' AND r.visible_to_parent = 1) AS visible_recording_count";

$sessions = array_values($DB->get_records_sql(
    "{$sessionselect} FROM {local_prequran_live_session} s WHERE {$wheresql}
     ORDER BY s.scheduled_start DESC, s.id DESC",
    $params, 0, 200
));

$metrics = [
    'sessions' => 0, 'completed' => 0, 'cancelled' => 0, 'students' => 0, 'attendance' => 0,
    'summaries' => 0, 'recordings' => 0, 'conflicts' => 0, 'notifications' => 0,
    'missingtargets' => 0, 'homework' => 0, 'qareview' => 0, 'qaissues' => 0,
    'coaching' => 0, 'coachingoverdue' => 0,
];
foreach ($sessions as $session) {
    $metrics['sessions']++;
    $metrics['completed'] += (string)$session->status === 'completed' ? 1 : 0;
    $metrics['cancelled'] += (string)$session->status === 'cancelled' ? 1 : 0;
    $metrics['students'] += (int)$session->student_count;
    $metrics['attendance'] += (int)$session->attendance_count;
    $metrics['summaries'] += (int)$session->visible_summary_count;
    $metrics['recordings'] += (int)$session->visible_recording_count;
    $metrics['missingtargets'] += trim((string)$session->lessonid) === '' || trim((string)$session->unitid) === '' ? 1 : 0;
    $metrics['homework'] += (int)$session->homework_count;
    if ($qualityready) {
        $qastatus = (string)($session->qa_status ?? 'not_reviewed');
        $metrics['qareview'] += in_array($qastatus, ['not_reviewed', 'needs_coaching', 'serious_issue'], true) ? 1 : 0;
        $metrics['qaissues'] += in_array($qastatus, ['needs_coaching', 'serious_issue'], true) ? 1 : 0;
    }
    if ($coachingready) {
        $coachingstatus = (string)($session->qa_coaching_status ?? 'none');
        $iscoaching = in_array($coachingstatus, ['assigned', 'acknowledged'], true);
        $metrics['coaching'] += $iscoaching ? 1 : 0;
        $metrics['coachingoverdue'] += $iscoaching && !empty($session->qa_coaching_due_date) && (int)$session->qa_coaching_due_date < $now ? 1 : 0;
    }
}
$metrics['conflicts'] = (int)$DB->count_records_sql(
    "SELECT COUNT(1) FROM {local_prequran_live_audit}
      WHERE action IN ('schedule_conflict_blocked', 'schedule_conflict_override')
        AND timecreated >= :fromtime AND timecreated <= :totime",
    ['fromtime' => $from, 'totime' => $to]
);
$metrics['notifications'] = (int)$DB->count_records_sql(
    "SELECT COUNT(1) FROM {local_prequran_live_audit}
      WHERE action IN ('notification_sent', 'notification_failed', 'notification_skipped', 'live_reminder_24h_sent', 'live_reminder_1h_sent')
        AND timecreated >= :fromtime AND timecreated <= :totime",
    ['fromtime' => $from, 'totime' => $to]
);

$teachers = array_values($DB->get_records_sql(
    "SELECT s.teacherid,
            COUNT(1) AS session_count,
            SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
            SUM((SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')) AS student_total,
            SUM((SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1)) AS summary_total
       FROM {local_prequran_live_session} s
      WHERE {$wheresql}
   GROUP BY s.teacherid
   ORDER BY session_count DESC, s.teacherid ASC",
    $params, 0, 50
));

$audit = array_values($DB->get_records_sql(
    "SELECT * FROM {local_prequran_live_audit}
      WHERE action IN (
          'schedule_conflict_blocked', 'schedule_conflict_override', 'notification_failed',
          'notification_skipped', 'calendar_downloaded', 'recording_published',
          'live_summary_published', 'quality_review_saved', 'quality_review_passed',
          'quality_review_needs_coaching', 'quality_review_serious_issue',
          'quality_coaching_assigned', 'quality_coaching_acknowledged',
          'quality_coaching_completed', 'quality_coaching_updated'
      )
        AND timecreated >= :fromtime AND timecreated <= :totime
   ORDER BY timecreated DESC, id DESC",
    ['fromtime' => $from, 'totime' => $to], 0, 100
));

$ids = [];
foreach ($sessions as $s) {
    $ids[] = (int)$s->teacherid;
}
foreach ($teachers as $t) {
    $ids[] = (int)$t->teacherid;
}
foreach ($audit as $a) {
    if (isset($a->userid)) {
        $ids[] = (int)$a->userid;
    }
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'filters' => ['from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'teacherid' => $teacherid, 'studentid' => $studentid, 'status' => $status, 'seriesid' => $seriesid],
    'metrics' => $metrics,
    'sessions' => $sessions,
    'teachers' => $teachers,
    'audit' => $audit,
    'names' => pqpd_names($ids),
], JSON_UNESCAPED_SLASHES);
