<?php
// ---- report: live-monitor (teacher/admin per-session self-study monitor) -------
// Ported from local_hubredirect/live_monitor.php via live_monitor_portallib
// (pqlmonl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the per-session monitor: curated session header + one decorated row per
//        active student (progress, session-scoped focus, live indicators, speak,
//        practice-coach). The legacy page is READ-ONLY apart from a compliance
//        audit written when the monitor is opened — that side effect is kept here.
// POST = none. The legacy page defines no write action, so POST returns 400.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_monitor_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// The legacy page renders on GET and has no write action; any POST is a misuse.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The live monitor is read-only.');
}

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
// Legacy resolves extra workspace scope from the consumer cookie/context; the
// portal has no Moodle cookies (NO_MOODLE_COOKIES), so workspaceid arrives only
// via the query string. Everything else in the access chain is replicated 1:1.
$workspaceurlparams = $requestedworkspaceid > 0 ? ['workspaceid' => $requestedworkspaceid] : [];

// -- ACCESS: replicate live_monitor.php's pqh_access_denied chain verbatim ------
// (each pqh_access_denied → pqpd_fail(403, same message)).
if (!pqlmonl_table_exists('local_prequran_live_session') || !pqlmonl_table_exists('local_prequran_live_participant')) {
    pqpd_fail(403, 'Live session tables are not installed yet.');
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqpd_fail(403, 'Choose a valid live session before opening the lesson monitor.');
}
if ($requestedworkspaceid > 0
    && pqlmonl_column_exists('local_prequran_live_session', 'workspaceid')
    && (int)($session->workspaceid ?? 0) !== $requestedworkspaceid) {
    $actualworkspaceid = (int)($session->workspaceid ?? 0);
    pqpd_fail(403, 'This live session belongs to workspace #' . $actualworkspaceid . ', not workspace #' . $requestedworkspaceid . '. Choose a session from this workspace live-session list.');
}
if (!pqlmonl_is_teacher_or_admin($session)) {
    pqpd_fail(403, 'Only the assigned teacher or a workspace administrator can monitor this live session.');
}

// Legacy writes a monitor-opened audit on every open — keep the compliance write.
pqlmonl_audit($sessionid, 'lesson_monitor_opened', 'session', $sessionid);

$students = $DB->get_records_sql(
    "SELECT *
       FROM {local_prequran_live_participant}
      WHERE sessionid = :sessionid
        AND role = :role
        AND status = :status
   ORDER BY displayname ASC, userid ASC",
    ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active']
);
$teacher = core_user::get_user((int)$session->teacherid);

// Migrated sibling reports open through the portal launcher; everything else
// (issue_child lesson launcher, recordings, teacher workspace) stays legacy.
$launch = static function(string $report) use ($CFG, $sessionid): string {
    return $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $report . '&sessionid=' . $sessionid;
};
$legacy = static function(string $path, array $params) use ($CFG): string {
    return (new moodle_url($path, $params))->out(false);
};

$rows = [];
$nameids = [(int)$session->teacherid];
foreach ($students as $participant) {
    $studentid = (int)($participant->studentid ?: $participant->userid);
    $student = core_user::get_user($studentid);
    $name = $student ? fullname($student) : (string)$participant->displayname;
    $progress = pqlmonl_progress($studentid);
    $focus = pqlmonl_focus($studentid, $sessionid);
    $speak = pqlmonl_speak($studentid);
    $coach = pqlmonl_practice_coach($studentid, $sessionid);
    $indicators = pqlmonl_live_indicators($focus, $progress);
    $cohortid = pqlmonl_student_cohort($studentid, (int)$session->cohortid);
    $unitid = (string)$session->unitid !== '' ? (string)$session->unitid
        : ($progress['latest'] ? (string)$progress['latest']->unitid : '');
    $lessonurl = pqlmonl_lesson_link($studentid, $cohortid, $unitid, $sessionid, $workspaceurlparams);
    $nameids[] = $studentid;

    $rows[] = [
        'studentid' => $studentid,
        'name' => $name,
        'progress' => [
            'units' => (int)$progress['units'],
            'completed' => (int)$progress['completed'],
            'inprogress' => (int)$progress['inprogress'],
            'steps' => (int)$progress['steps'],
            'latest' => $progress['latest'] ? [
                'unitid' => (string)$progress['latest']->unitid,
                'unit_title' => (string)$progress['latest']->unit_title,
                'lesson_title' => (string)$progress['latest']->lesson_title,
                'overall_status' => (string)$progress['latest']->overall_status,
                'completion_percent' => (int)$progress['latest']->completion_percent,
            ] : null,
        ],
        'focus' => [
            'ready' => (bool)$focus['ready'],
            'scoped' => (bool)$focus['scoped'],
            'active_ms' => (int)$focus['active_ms'],
            'active_label' => $focus['ready'] ? pqlmonl_format_minutes((int)$focus['active_ms']) : 'n/a',
            'idle_count' => (int)$focus['idle_count'],
            'leave_count' => (int)$focus['leave_count'],
            'latest' => $focus['latest'] ? [
                'unitid' => (string)$focus['latest']->unitid,
                'step_id' => (string)$focus['latest']->step_id,
            ] : null,
        ],
        'indicators' => $indicators,
        'speak' => [
            'ready' => (bool)$speak['ready'],
            'count' => (int)$speak['count'],
            'latest' => $speak['latest'] ? [
                'letter_name' => (string)$speak['latest']->letter_name,
                'unitid' => (string)$speak['latest']->unitid,
            ] : null,
        ],
        'coach' => [
            'ready' => (bool)$coach['ready'],
            'count' => (int)$coach['count'],
            'idle' => (int)$coach['idle'],
            'away' => (int)$coach['away'],
            'latest_ago' => $coach['latest'] ? pqlmonl_time_ago((int)$coach['latest']->timecreated) : 'none',
            'events' => array_map(static function($event) {
                return [
                    'trigger_key' => (string)$event->trigger_key,
                    'trigger_label' => ucwords(str_replace('_', ' ', (string)$event->trigger_key)),
                    'message' => (string)$event->message,
                    'timelabel' => userdate((int)$event->timecreated, get_string('strftimetime')),
                    'message_source' => !empty($event->message_source) ? str_replace('_', ' ', (string)$event->message_source) : '',
                    'recommendation_message' => (string)($event->recommendation_message ?? ''),
                ];
            }, $coach['events']),
        ],
        'lessonurl' => $lessonurl->out(false),
        'recordingsurl' => $legacy('/local/hubredirect/recordings.php', array_merge($workspaceurlparams, ['childid' => $studentid])),
    ];
}

// Curated session header — never ship the raw session record (it can carry BBB
// meeting ids / moderator + attendee passwords). Only the fields the page renders.
echo json_encode([
    'ok' => true, 'ready' => true,
    'session' => [
        'id' => (int)$session->id,
        'title' => (string)$session->title,
        'scheduled_start' => (int)$session->scheduled_start,
        'scheduled_end' => (int)$session->scheduled_end,
        'lessonid' => (string)$session->lessonid,
        'unitid' => (string)$session->unitid,
        'teacherid' => (int)$session->teacherid,
        'teacher_name' => $teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid,
        'workspaceid' => (int)($session->workspaceid ?? 0),
    ],
    'students' => $rows,
    'links' => [
        // Migrated siblings open through the portal launcher.
        'review' => $launch('live-review'),
        'sessions' => $launch('live-sessions'),
        // Legacy targets (not migrated): teacher workspace launcher.
        'workspace' => $legacy('/local/hubredirect/teacher_workspace.php', $workspaceurlparams),
        // "Start class" (live_sessions.php?action=join&sesskey=…) is unportable:
        // it needs a Moodle sesskey the portal token cannot mint. Teachers start
        // the class from the migrated live-sessions page instead.
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
