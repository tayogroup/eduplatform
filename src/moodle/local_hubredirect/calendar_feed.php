<?php
// Public iCalendar (ICS) feed of a workspace's academic calendar: terms +
// holiday/blackout events. Subscribe URL is token-gated (a per-workspace feed
// token derived from the site secret) so it can be added to Google/Outlook
// Calendar without a login. Read-only; exposes only term titles + dates.
declare(strict_types=1);

define('NO_MOODLE_COOKIES', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

global $DB;

$workspaceid = required_param('workspaceid', PARAM_INT);
$token = trim(optional_param('token', '', PARAM_ALPHANUMEXT));

// Feed token = HMAC(workspaceid) with the site salt. Stable per workspace, not
// guessable, and revocable by rotating passwordsaltmain. Not a user token.
$expected = substr(hash_hmac('sha256', 'acadfeed|' . $workspaceid, (string)($CFG->passwordsaltmain ?? '')), 0, 32);
if ($token === '' || !hash_equals($expected, $token)) {
    header('HTTP/1.1 403 Forbidden');
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Invalid or missing calendar feed token.';
    exit;
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], 'id,name', IGNORE_MISSING);
$calname = $workspace ? ($workspace->name . ' academic calendar') : 'Academic calendar';

$icsdate = static function (int $ts): string {
    // All-day VALUE=DATE format (YYYYMMDD).
    return gmdate('Ymd', $ts);
};
$esc = static function (string $s): string {
    return str_replace(["\\", ";", ",", "\r\n", "\n"], ["\\\\", "\\;", "\\,", "\\n", "\\n"], $s);
};

$lines = [];
$lines[] = 'BEGIN:VCALENDAR';
$lines[] = 'VERSION:2.0';
$lines[] = 'PRODID:-//EduPlatform//Academic Calendar//EN';
$lines[] = 'CALSCALE:GREGORIAN';
$lines[] = 'METHOD:PUBLISH';
$lines[] = 'X-WR-CALNAME:' . $esc($calname);

$stamp = defined('CALFEED_STAMP') ? CALFEED_STAMP : gmdate('Ymd\THis\Z');

$emit = static function (string $uid, int $start, int $end, string $summary, string $desc) use (&$lines, $icsdate, $esc, $stamp): void {
    if ($start <= 0) {
        return;
    }
    // DTEND is exclusive for all-day events; add a day to the inclusive end.
    $endexcl = ($end > 0 ? $end : $start) + DAYSECS;
    $lines[] = 'BEGIN:VEVENT';
    $lines[] = 'UID:' . $uid . '@eduplatform';
    $lines[] = 'DTSTAMP:' . $stamp;
    $lines[] = 'DTSTART;VALUE=DATE:' . $icsdate($start);
    $lines[] = 'DTEND;VALUE=DATE:' . $icsdate($endexcl);
    $lines[] = 'SUMMARY:' . $esc($summary);
    if ($desc !== '') {
        $lines[] = 'DESCRIPTION:' . $esc($desc);
    }
    $lines[] = 'END:VEVENT';
};

if (pqh_table_exists_safe('local_prequran_acad_term')) {
    $terms = $DB->get_records_select('local_prequran_acad_term',
        "workspaceid = :ws AND status <> 'archived'", ['ws' => $workspaceid], 'startdate ASC', '*', 0, 200);
    foreach ($terms as $t) {
        $emit('term-' . (int)$t->id, (int)$t->startdate, (int)$t->enddate,
            (string)$t->title, 'Academic ' . (string)$t->term_type);
    }
}
if (pqh_table_exists_safe('local_prequran_acad_event')) {
    $events = $DB->get_records_select('local_prequran_acad_event',
        "workspaceid = :ws AND status = 'active'", ['ws' => $workspaceid], 'startdate ASC', '*', 0, 500);
    foreach ($events as $e) {
        $label = (string)$e->title . ((int)$e->blackout === 1 ? ' (no classes)' : '');
        $emit('event-' . (int)$e->id, (int)$e->startdate, (int)$e->enddate, $label, (string)$e->event_type);
    }
}

$lines[] = 'END:VCALENDAR';

header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: inline; filename="academic-calendar-' . $workspaceid . '.ics"');
header('Cache-Control: max-age=3600, public');
// ICS lines are CRLF-terminated.
echo implode("\r\n", $lines) . "\r\n";
