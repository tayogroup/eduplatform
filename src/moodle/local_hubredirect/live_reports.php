<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

if (!pqh_can_manage_academy_operations((int)$USER->id)) {
    pqh_access_denied(
        'Live-session reports are available to academy operations users only.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Reports are not available for this account'
    );
}

function pqlrep_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlrep_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlrep_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlrep_ready(): bool {
    return pqlrep_table_exists('local_prequran_live_session')
        && pqlrep_table_exists('local_prequran_live_participant')
        && pqlrep_table_exists('local_prequran_live_attendance')
        && pqlrep_table_exists('local_prequran_live_note')
        && pqlrep_table_exists('local_prequran_live_recording')
        && pqlrep_table_exists('local_prequran_live_audit');
}

function pqlrep_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlrep_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlrep_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqlrep_link_params(int $from, int $to, int $teacherid, int $studentid, string $status, int $seriesid, array $extra = []): array {
    return array_merge([
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'status' => $status,
        'seriesid' => $seriesid,
    ], $extra);
}

$ready = pqlrep_ready();
$now = time();
$defaultfrom = usergetmidnight($now - (30 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlrep_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlrep_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto);
$to = $to + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$status = optional_param('status', '', PARAM_ALPHANUMEXT);
$seriesid = optional_param('seriesid', 0, PARAM_INT);
$drillteacherid = optional_param('drillteacherid', 0, PARAM_INT);
$drillsessionid = optional_param('drillsessionid', 0, PARAM_INT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);

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
if ($seriesid > 0 && pqlrep_column_exists('local_prequran_live_session', 'seriesid')) {
    $where[] = "s.seriesid = :seriesid";
    $params['seriesid'] = $seriesid;
}
if ($studentid > 0) {
    $where[] = "EXISTS (
        SELECT 1
          FROM {local_prequran_live_participant} sp
         WHERE sp.sessionid = s.id
           AND sp.role = 'student'
           AND sp.status = 'active'
           AND sp.studentid = :studentid
    )";
    $params['studentid'] = $studentid;
}
$wheresql = implode(' AND ', $where);

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

$sessions = [];
$metrics = [
    'sessions' => 0,
    'completed' => 0,
    'cancelled' => 0,
    'students' => 0,
    'attendance' => 0,
    'summaries' => 0,
    'recordings' => 0,
    'conflicts' => 0,
    'notifications' => 0,
    'missingtargets' => 0,
    'homework' => 0,
    'qareview' => 0,
    'qaissues' => 0,
    'coaching' => 0,
    'coachingoverdue' => 0,
];
$teacherrows = [];
$auditrows = [];
$studentdrillrows = [];
$studentdrilltitle = '';

if ($ready) {
    $qualityready = pqlrep_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqlrep_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $sessions = array_values($DB->get_records_sql(
        "{$sessionselect}
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       ORDER BY s.scheduled_start DESC, s.id DESC",
        $params,
        0,
        200
    ));

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
            $metrics['coaching'] += in_array($coachingstatus, ['assigned', 'acknowledged'], true) ? 1 : 0;
            $metrics['coachingoverdue'] += in_array($coachingstatus, ['assigned', 'acknowledged'], true)
                && !empty($session->qa_coaching_due_date)
                && (int)$session->qa_coaching_due_date < $now ? 1 : 0;
        }
    }
    $metrics['conflicts'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('schedule_conflict_blocked', 'schedule_conflict_override')
            AND timecreated >= :fromtime
            AND timecreated <= :totime",
        ['fromtime' => $from, 'totime' => $to]
    );
    $metrics['notifications'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('notification_sent', 'notification_failed', 'notification_skipped', 'live_reminder_24h_sent', 'live_reminder_1h_sent')
            AND timecreated >= :fromtime
            AND timecreated <= :totime",
        ['fromtime' => $from, 'totime' => $to]
    );

    $teacherrows = array_values($DB->get_records_sql(
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
        $params,
        0,
        50
    ));

    if ($drillsessionid > 0 || $drillteacherid > 0) {
        $drillwhere = $where;
        $drillparams = $params;
        if ($drillsessionid > 0) {
            $drillwhere[] = "s.id = :drillsessionid";
            $drillparams['drillsessionid'] = $drillsessionid;
        }
        if ($drillteacherid > 0) {
            $drillwhere[] = "s.teacherid = :drillteacherid";
            $drillparams['drillteacherid'] = $drillteacherid;
        }
        $studentdrillrows = array_values($DB->get_records_sql(
            "SELECT p.id AS participantid,
                    s.id AS sessionid,
                    s.title,
                    s.teacherid,
                    s.scheduled_start,
                    p.studentid,
                    a.attendance_status,
                    a.participation_status,
                    a.technical_issue,
                    a.join_time
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p
                 ON p.sessionid = s.id
                AND p.role = 'student'
                AND p.status = 'active'
          LEFT JOIN {local_prequran_live_attendance} a
                 ON a.sessionid = s.id
                AND a.studentid = p.studentid
              WHERE " . implode(' AND ', $drillwhere) . "
           ORDER BY s.scheduled_start DESC, s.id DESC, p.studentid ASC",
            $drillparams,
            0,
            1000
        ));
        if ($drillsessionid > 0) {
            $studentdrilltitle = 'Students enrolled in session #' . $drillsessionid;
        } else {
            $studentdrilltitle = 'Students enrolled with ' . pqlrep_user_name($drillteacherid, 'Teacher ' . $drillteacherid);
        }
    }

    $auditrows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action IN (
              'schedule_conflict_blocked',
              'schedule_conflict_override',
              'notification_failed',
              'notification_skipped',
              'calendar_downloaded',
              'recording_published',
              'live_summary_published',
              'quality_review_saved',
              'quality_review_passed',
              'quality_review_needs_coaching',
              'quality_review_serious_issue',
              'quality_coaching_assigned',
              'quality_coaching_acknowledged',
              'quality_coaching_completed',
              'quality_coaching_updated'
          )
            AND timecreated >= :fromtime
            AND timecreated <= :totime
       ORDER BY timecreated DESC, id DESC",
        ['fromtime' => $from, 'totime' => $to],
        0,
        100
    ));
}

if ($ready && $export === 'sessions') {
    $rows = [];
    foreach ($sessions as $session) {
        $rows[] = [
            (int)$session->id,
            (string)$session->title,
            pqlrep_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid),
            userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')),
            userdate((int)$session->scheduled_end, get_string('strftimedatetimeshort')),
            (string)$session->status,
            (int)$session->student_count,
            (int)$session->attendance_count,
            (int)$session->present_count,
            (int)$session->late_count,
            (int)$session->absent_count,
            (int)$session->visible_summary_count,
            (int)$session->visible_recording_count,
            (string)($session->qa_status ?? ''),
            (int)($session->qa_score ?? 0),
            (string)($session->qa_coaching_status ?? ''),
            !empty($session->qa_coaching_due_date) ? userdate((int)$session->qa_coaching_due_date, get_string('strftimedatetimeshort')) : '',
        ];
    }
    pqlrep_csv('quraan-live-session-report.csv', ['sessionid', 'title', 'teacher', 'start', 'end', 'status', 'students', 'attendance', 'present', 'late', 'absent', 'parent_summaries', 'parent_recordings', 'qa_status', 'qa_score', 'coaching_status', 'coaching_due'], $rows);
}

if ($ready && $export === 'attendance') {
    $rows = array_values($DB->get_records_sql(
        "SELECT p.id AS participantid,
                s.id AS sessionid,
                s.title,
                s.teacherid,
                s.scheduled_start,
                p.studentid,
                a.attendance_status,
                a.participation_status,
                a.technical_issue,
                a.join_time
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
          WHERE {$wheresql}
       ORDER BY s.scheduled_start DESC, s.id DESC, p.studentid ASC",
        $params,
        0,
        5000
    ));
    $csvrows = [];
    foreach ($rows as $row) {
        $csvrows[] = [
            (int)$row->sessionid,
            (string)$row->title,
            pqlrep_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid),
            userdate((int)$row->scheduled_start, get_string('strftimedatetimeshort')),
            (int)$row->studentid,
            pqlrep_user_name((int)$row->studentid, 'Student ' . (int)$row->studentid),
            (string)$row->attendance_status,
            (string)$row->participation_status,
            !empty($row->technical_issue) ? 'yes' : 'no',
            !empty($row->join_time) ? userdate((int)$row->join_time, get_string('strftimedatetimeshort')) : '',
        ];
    }
    pqlrep_csv('quraan-live-attendance-report.csv', ['sessionid', 'title', 'teacher', 'start', 'studentid', 'student', 'attendance', 'participation', 'technical_issue', 'join_time'], $csvrows);
}

if ($ready && $export === 'audit') {
    $csvrows = [];
    foreach ($auditrows as $row) {
        $csvrows[] = [
            (int)$row->id,
            (int)$row->sessionid,
            (int)$row->actorid,
            (string)$row->action,
            (string)$row->targettype,
            (int)$row->targetid,
            (string)$row->details,
            userdate((int)$row->timecreated, get_string('strftimedatetimeshort')),
        ];
    }
    pqlrep_csv('quraan-live-audit-report.csv', ['id', 'sessionid', 'actorid', 'action', 'targettype', 'targetid', 'details', 'timecreated'], $csvrows);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_reports.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Reports');
$PAGE->set_heading('Live Reports');
$PAGE->add_body_class('pqh-live-reports-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-live-reports-page header,
body.pqh-live-reports-page footer,
body.pqh-live-reports-page nav.navbar,
body.pqh-live-reports-page #page-header,
body.pqh-live-reports-page #page-footer,
body.pqh-live-reports-page .drawer,
body.pqh-live-reports-page .drawer-toggles,
body.pqh-live-reports-page .block-region,
body.pqh-live-reports-page [data-region="drawer"],
body.pqh-live-reports-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-reports-page #page,
body.pqh-live-reports-page #page-content,
body.pqh-live-reports-page #region-main,
body.pqh-live-reports-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlrep-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlrep-wrap{max-width:1220px;margin:0 auto}
.pqlrep-top,.pqlrep-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlrep-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlrep-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlrep-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlrep-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlrep-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlrep-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlrep-filters{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlrep-field{display:grid;gap:6px}
.pqlrep-field label{font-size:12px;font-weight:900;color:#415665}
.pqlrep-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}
.pqlrep-metrics{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlrep-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlrep-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlrep-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlrep-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.pqlrep-panel--wide{grid-column:1/-1}
.pqlrep-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqlrep-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlrep-table th,.pqlrep-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlrep-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqlrep-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlrep-link{color:#145f43!important;font-weight:950;text-decoration:underline;text-underline-offset:2px}
.pqlrep-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlrep-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1050px){.pqlrep-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlrep-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlrep-grid{grid-template-columns:1fr}.pqlrep-top{display:block}.pqlrep-actions{margin-top:12px}.pqlrep-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlrep-filters,.pqlrep-metrics{grid-template-columns:1fr}.pqlrep-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlrep-shell">
  <div class="pqlrep-wrap">
    <section class="pqlrep-top pqh-workspace-top">
      <div>
        <h1 class="pqlrep-title pqh-workspace-title">Live Reports</h1>
        <p class="pqlrep-sub pqh-workspace-sub">Attendance, completion, parent-trust, recording, conflict, and notification reporting.</p>
      </div>
      <div class="pqlrep-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php'))->out(false); ?>">QA analytics</a>
        <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_links.php'))->out(false); ?>">Parent links</a>
        <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlrep-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlrep-empty">Live reporting tables are not fully installed yet.</div>
    <?php else: ?>
      <section class="pqlrep-panel pqlrep-panel--wide">
        <form method="get">
          <div class="pqlrep-filters">
            <div class="pqlrep-field"><label for="from">From</label><input class="pqlrep-input" id="from" name="from" type="date" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
            <div class="pqlrep-field"><label for="to">To</label><input class="pqlrep-input" id="to" name="to" type="date" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
            <div class="pqlrep-field"><label for="teacherid">Teacher ID</label><input class="pqlrep-input" id="teacherid" name="teacherid" type="number" min="0" value="<?php echo (int)$teacherid; ?>"></div>
            <div class="pqlrep-field"><label for="studentid">Student ID</label><input class="pqlrep-input" id="studentid" name="studentid" type="number" min="0" value="<?php echo (int)$studentid; ?>"></div>
            <div class="pqlrep-field"><label for="status">Status</label><input class="pqlrep-input" id="status" name="status" value="<?php echo s($status); ?>" placeholder="scheduled, completed"></div>
            <div class="pqlrep-field"><label for="seriesid">Series ID</label><input class="pqlrep-input" id="seriesid" name="seriesid" type="number" min="0" value="<?php echo (int)$seriesid; ?>"></div>
          </div>
          <div class="pqlrep-actions pqh-workspace-actions">
            <button class="pqlrep-btn" type="submit">Apply filters</button>
            <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php'))->out(false); ?>">Reset</a>
            <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php', pqlrep_link_params($from, $to, $teacherid, $studentid, $status, $seriesid, ['export' => 'sessions'])))->out(false); ?>">Export sessions CSV</a>
            <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php', pqlrep_link_params($from, $to, $teacherid, $studentid, $status, $seriesid, ['export' => 'attendance'])))->out(false); ?>">Export attendance CSV</a>
            <a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php', pqlrep_link_params($from, $to, $teacherid, $studentid, $status, $seriesid, ['export' => 'audit'])))->out(false); ?>">Export audit CSV</a>
          </div>
        </form>
      </section>

      <section class="pqlrep-metrics" aria-label="Report metrics">
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['sessions']; ?></strong><span>sessions</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['completed']; ?></strong><span>completed</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['cancelled']; ?></strong><span>cancelled</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>student seats</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['attendance']; ?></strong><span>attendance rows</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['summaries']; ?></strong><span>parent summaries</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['recordings']; ?></strong><span>parent recordings</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['conflicts']; ?></strong><span>conflict audits</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['missingtargets']; ?></strong><span>missing targets</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['homework']; ?></strong><span>homework plans</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['qareview']; ?></strong><span>QA review queue</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['qaissues']; ?></strong><span>QA issues</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['coaching']; ?></strong><span>coaching queue</span></div>
        <div class="pqlrep-metric"><strong><?php echo (int)$metrics['coachingoverdue']; ?></strong><span>coaching overdue</span></div>
      </section>

      <?php if ($drillsessionid > 0 || $drillteacherid > 0): ?>
        <section class="pqlrep-panel pqlrep-panel--wide" id="student-drilldown">
          <h2><?php echo s($studentdrilltitle); ?></h2>
          <table class="pqlrep-table">
            <tr><th>Session</th><th>Teacher</th><th>Start</th><th>Student ID</th><th>Student</th><th>Email</th><th>Attendance</th><th>Participation</th><th>Joined</th></tr>
            <?php foreach ($studentdrillrows as $row): ?>
              <?php $studentuser = core_user::get_user((int)$row->studentid); ?>
              <tr>
                <td>#<?php echo (int)$row->sessionid; ?> <?php echo s((string)$row->title); ?></td>
                <td><?php echo s(pqlrep_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid)); ?></td>
                <td><?php echo userdate((int)$row->scheduled_start, get_string('strftimedatetimeshort')); ?></td>
                <td><?php echo (int)$row->studentid; ?></td>
                <td><?php echo s($studentuser ? fullname($studentuser) : 'Student ' . (int)$row->studentid); ?></td>
                <td><?php echo s($studentuser ? (string)$studentuser->email : ''); ?></td>
                <td><?php echo s((string)($row->attendance_status ?? 'not marked')); ?><?php echo !empty($row->technical_issue) ? '<br><span class="pqlrep-code">technical issue</span>' : ''; ?></td>
                <td><?php echo s((string)($row->participation_status ?? '')); ?></td>
                <td><?php echo !empty($row->join_time) ? userdate((int)$row->join_time, get_string('strftimedatetimeshort')) : ''; ?></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$studentdrillrows): ?><tr><td colspan="9">No active student enrolments match this drill-down.</td></tr><?php endif; ?>
          </table>
        </section>
      <?php endif; ?>

      <section class="pqlrep-grid">
        <article class="pqlrep-panel pqlrep-panel--wide">
          <h2>Session Summary</h2>
          <table class="pqlrep-table">
            <tr><th>ID</th><th>Session</th><th>Target</th><th>Teacher</th><th>Start</th><th>Status</th><th>QA</th><th>Coaching</th><th>Students</th><th>Attendance</th><th>Late/Absent</th><th>Summaries</th><th>Recordings</th><th>Action</th></tr>
            <?php foreach ($sessions as $session): ?>
              <?php $sessionstudenturl = new moodle_url('/local/hubredirect/live_reports.php', pqlrep_link_params($from, $to, $teacherid, $studentid, $status, $seriesid, ['drillsessionid' => (int)$session->id])); ?>
              <tr>
                <td>#<?php echo (int)$session->id; ?></td>
                <td><?php echo s((string)$session->title); ?></td>
                <td><?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /') ?: 'missing'); ?></td>
                <td><?php echo s(pqlrep_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid)); ?></td>
                <td><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?></td>
                <td><span class="pqlrep-pill"><?php echo s((string)$session->status); ?></span></td>
                <td><?php echo s(str_replace('_', ' ', (string)($session->qa_status ?? 'not installed'))); ?><?php echo isset($session->qa_score) ? '<br><span class="pqlrep-code">' . (int)$session->qa_score . '%</span>' : ''; ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)($session->qa_coaching_status ?? 'none'))); ?><?php echo !empty($session->qa_coaching_due_date) ? '<br><span class="pqlrep-code">due ' . userdate((int)$session->qa_coaching_due_date, get_string('strftimedatetimeshort')) . '</span>' : ''; ?></td>
                <td><a class="pqlrep-link" href="<?php echo $sessionstudenturl->out(false); ?>#student-drilldown"><?php echo (int)$session->student_count; ?></a></td>
                <td><?php echo (int)$session->attendance_count; ?></td>
                <td><?php echo (int)$session->late_count; ?> late / <?php echo (int)$session->absent_count; ?> absent</td>
                <td><?php echo (int)$session->visible_summary_count; ?></td>
                <td><?php echo (int)$session->visible_recording_count; ?></td>
                <td><a class="pqlrep-btn pqlrep-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => (int)$session->id]))->out(false); ?>">QA</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$sessions): ?><tr><td colspan="14">No sessions match these filters.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlrep-panel">
          <h2>Teacher Workload</h2>
          <table class="pqlrep-table">
            <tr><th>Teacher</th><th>Sessions</th><th>Completed</th><th>Students</th><th>Summaries</th></tr>
            <?php foreach ($teacherrows as $row): ?>
              <?php $teacherstudenturl = new moodle_url('/local/hubredirect/live_reports.php', pqlrep_link_params($from, $to, $teacherid, $studentid, $status, $seriesid, ['drillteacherid' => (int)$row->teacherid])); ?>
              <tr>
                <td><a class="pqlrep-link" href="<?php echo $teacherstudenturl->out(false); ?>#student-drilldown"><?php echo s(pqlrep_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid)); ?></a></td>
                <td><?php echo (int)$row->session_count; ?></td>
                <td><?php echo (int)$row->completed_count; ?></td>
                <td><a class="pqlrep-link" href="<?php echo $teacherstudenturl->out(false); ?>#student-drilldown"><?php echo (int)$row->student_total; ?></a></td>
                <td><?php echo (int)$row->summary_total; ?></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$teacherrows): ?><tr><td colspan="5">No teacher workload rows.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlrep-panel">
          <h2>Risk And Trust Audit</h2>
          <table class="pqlrep-table">
            <tr><th>Time</th><th>Action</th><th>Session</th><th>Details</th></tr>
            <?php foreach ($auditrows as $row): ?>
              <tr>
                <td><?php echo userdate((int)$row->timecreated, get_string('strftimedatetimeshort')); ?></td>
                <td><?php echo s((string)$row->action); ?></td>
                <td>#<?php echo (int)$row->sessionid; ?></td>
                <td><span class="pqlrep-code"><?php echo s((string)$row->details); ?></span></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$auditrows): ?><tr><td colspan="4">No risk or trust audit rows in this range.</td></tr><?php endif; ?>
          </table>
        </article>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
