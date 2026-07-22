<?php
// ---- report: live-calendar (parent/student monthly live-class calendar) -------
// Ported from local_hubredirect/live_calendar.php via live_calendar_portallib
// (pqlcl_*). Dispatched from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler + CORS headers installed.
// The legacy page stays live in parallel and is untouched.
//
// GET  ?report=live-calendar&token=…[&childid=&workspaceid=&consumer=]
//      -> chooser (multi-child) OR the child's month grid: server-built day
//         cells (identical last-Sunday..next-Saturday window as the page) plus
//         the same session list, each session decorated with join window, an
//         ICS payload built verbatim, and portal_launch relaunch URLs for the
//         migrated targets (live-sessions join, live-schedule, live-summaries,
//         recordings, parent-trust).
// POST body JSON {"do": …}:
//      do=log_calendar_download  (verbatim port of the legacy action=ics audit
//                                 write — confirm_sesskey() dropped, the .ics
//                                 itself is built by the client from the GET
//                                 payload; this records the compliance trail).
// The legacy action=ics FILE emission is not a server endpoint here: the portal
// answers JSON only, so the client turns the per-session ics payload into a
// download blob (same VCALENDAR bytes the page emitted).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_calendar_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$consumerslug = (string)($consumercontext->consumerslug ?? '');

// portal_launch relaunch URLs for migrated targets (same convention as the
// student-workplace / master-dashboard handlers): the click re-mints a scoped
// token; deep-link ints + consumer travel through portal_launch's passthrough.
$pqlcllaunch = static function (string $report, array $params = []) use ($CFG): string {
    $url = $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $report;
    foreach ($params as $key => $value) {
        if ((string)$value === '' || $value === 0 || $value === '0') {
            continue;
        }
        $url .= '&' . $key . '=' . rawurlencode((string)$value);
    }
    return $url;
};

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: log_calendar_download (legacy action=ics audit, verbatim) --------
    // confirm_sesskey() dropped: token auth replaces the session key. The legacy
    // block validated child + that the session belongs to the child before the
    // calendar_downloaded audit; the .ics bytes are built client-side from GET.
    if ($do === 'log_calendar_download') {
        $childid = (int)($body['childid'] ?? 0);
        $sessionid = (int)($body['sessionid'] ?? 0);
        if ($childid <= 0 || $sessionid <= 0) {
            pqpd_fail(403, 'Choose a valid student and live class before downloading a calendar event.');
        }
        if (!pqlcl_user_can_access_child($userid, $childid)) {
            pqpd_fail(403, 'You cannot view this live class calendar.');
        }
        $sessions = pqlcl_sessions($childid, time() - (365 * DAYSECS), time() + (365 * DAYSECS), 500);
        $session = null;
        foreach ($sessions as $row) {
            if ((int)$row->id === $sessionid) {
                $session = $row;
                break;
            }
        }
        if (!$session) {
            pqpd_fail(403, 'You cannot download this calendar event.');
        }
        pqlcl_audit((int)$session->id, 'calendar_downloaded', 'student', $childid);
        echo json_encode([
            'ok' => true,
            'message' => 'Calendar download recorded.',
            'childid' => $childid,
            'sessionid' => $sessionid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-calendar action.');
}

// -- GET: the month calendar (same resolution order as the page) ----------------
$childid = optional_param('childid', 0, PARAM_INT);

$modechildren = [];
if ($childid <= 0) {
    if (pqlcl_is_managed_student($userid)) {
        $childid = $userid;
    } else if (pqlcl_has_teacher_role($userid)) {
        $modechildren = pqlcl_teacher_students($userid);
    } else {
        $modechildren = pqlcl_parent_children($userid);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqlcl_user_can_access_child($userid, $childid)) {
    pqpd_fail(403, 'You cannot view this live class calendar.');
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');

// The page's month window: full weeks (Sun..Sat) spanning the current month.
$now = time();
$monthstart = usergetmidnight(strtotime(date('Y-m-01', $now)));
$monthend = strtotime('+1 month', $monthstart);
$calendarstart = strtotime('last sunday', $monthstart);
if ((int)date('w', $monthstart) === 0) {
    $calendarstart = $monthstart;
}
$calendarend = strtotime('next saturday', $monthend - DAYSECS) + DAYSECS;

// Server-built day cells (identical loop to the page) so the client never has to
// do timezone-sensitive date math: each session's day_iso matches a cell iso.
$days = [];
for ($day = $calendarstart; $day < $calendarend; $day += DAYSECS) {
    $days[] = [
        'iso' => date('Y-m-d', $day),
        'label' => (int)userdate($day, '%e'),
        'in_month' => date('n', $day) === date('n', $monthstart),
    ];
}

$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';
$brandslug = pqlcl_ics_token((string)($consumercontext->consumerslug ?? $brandname));
$domainhost = parse_url($CFG->wwwroot, PHP_URL_HOST) ?: pqh_request_host();

$sessions = $childid > 0 ? pqlcl_sessions($childid, $calendarstart, $calendarend, 200) : [];
$nameids = [];
$sessionsout = [];
foreach ($sessions as $session) {
    [$joinstate, $joinlabel] = pqlcl_join_state($session);
    $teacher = core_user::get_user((int)$session->teacherid);
    $nameids[] = (int)$session->teacherid;

    // Migrated join target: portal_launch mints a scoped live-sessions token and
    // deep-links the session (replaces the legacy live_sessions.php?action=join).
    $joinlaunch = $pqlcllaunch('live-sessions', [
        'sessionid' => (int)$session->id,
        'childid' => $childid,
        'workspaceid' => $workspaceid,
        'consumer' => $consumerslug,
    ]);

    // ICS payload — the exact VCALENDAR bytes the legacy action=ics emitted,
    // built here with the verbatim escape/token helpers. The client downloads
    // this as the .ics file. The URL points at the migrated join launch.
    $summary = (string)$session->title . ' with ' . ($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid);
    $description = $brandname . ' live review class. Join from the portal: ' . $joinlaunch;
    $ics = "BEGIN:VCALENDAR\r\n";
    $ics .= "VERSION:2.0\r\n";
    $ics .= "PRODID:-//" . pqlcl_ics_escape($brandname) . "//Live Classes//EN\r\n";
    $ics .= "BEGIN:VEVENT\r\n";
    $ics .= "UID:" . $brandslug . "-live-" . (int)$session->id . "@" . $domainhost . "\r\n";
    $ics .= "DTSTAMP:" . gmdate('Ymd\THis\Z') . "\r\n";
    $ics .= "DTSTART:" . gmdate('Ymd\THis\Z', (int)$session->scheduled_start) . "\r\n";
    $ics .= "DTEND:" . gmdate('Ymd\THis\Z', (int)$session->scheduled_end) . "\r\n";
    $ics .= "SUMMARY:" . pqlcl_ics_escape($summary) . "\r\n";
    $ics .= "DESCRIPTION:" . pqlcl_ics_escape($description) . "\r\n";
    $ics .= "URL:" . $joinlaunch . "\r\n";
    $ics .= "END:VEVENT\r\n";
    $ics .= "END:VCALENDAR\r\n";

    $sessionsout[] = [
        'id' => (int)$session->id,
        'title' => (string)$session->title,
        'scheduled_start' => (int)$session->scheduled_start,
        'scheduled_end' => (int)$session->scheduled_end,
        'teacherid' => (int)$session->teacherid,
        'seriesid' => (int)($session->seriesid ?? 0),
        'series_sequence' => (int)($session->series_sequence ?? 0),
        'summary_visible' => !empty($session->summary_visible),
        'visible_recordings' => (int)$session->visible_recordings,
        'join_state' => $joinstate,
        'join_label' => $joinlabel,
        'day_iso' => date('Y-m-d', (int)$session->scheduled_start),
        'time_label' => userdate((int)$session->scheduled_start, get_string('strftimetime')),
        'datetime_label' => userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')),
        'ics_text' => $ics,
        'ics_filename' => $brandslug . '-live-' . (int)$session->id . '.ics',
        'joinlaunch' => $joinlaunch,
        'summarylaunch' => $pqlcllaunch('live-summaries', ['childid' => $childid]),
        'recordinglaunch' => $pqlcllaunch('recordings', ['childid' => $childid, 'workspaceid' => $workspaceid, 'consumer' => $consumerslug]),
        'trustlaunch' => $pqlcllaunch('parent-trust', ['childid' => $childid]),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'mode' => $childid > 0 ? 'child' : 'chooser',
    'brand' => $brandname,
    'child' => ['id' => $childid, 'name' => $childname],
    'children' => $modechildren,
    'month_label' => userdate($monthstart, '%B %Y'),
    'days' => $days,
    'weekdays' => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'sessions' => $sessionsout,
    'schedulelaunch' => $pqlcllaunch('live-schedule', ['childid' => $childid, 'workspaceid' => $workspaceid, 'consumer' => $consumerslug]),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
