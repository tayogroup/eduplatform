<?php
// Portal handler: course-transcript (the unofficial transcript preview).
// Ported query-for-query from local_hubredirect/course_transcript.php, which
// stays live in parallel. Runs from portal_data.php AFTER token auth: $claims
// verified, $USER set to the token user, JSON exception handler installed,
// CORS headers sent.
//
//   GET ?report=course-transcript&token=…[&studentid=&workspaceid=&consumer=
//        &status=&course=&from=YYYY-MM-DD&to=YYYY-MM-DD]
//
// Read-only: the legacy page has no writes, so POST answers 400.
// (course_transcript.php has no pqh_live_security_audit calls — none to keep;
// its pqco_course_audit('transcript_preview_viewed') compliance write IS kept.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcriptlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcript_uilib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The unofficial transcript report is read-only.');
}

// ---- entry access checks (verbatim logic from the page preamble) -------------
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqctul_resolve_workspace_id($userid, $requestedworkspaceid, $consumercontext);
$studentid = optional_param('studentid', 0, PARAM_INT);
$statusfilter = trim(optional_param('status', '', PARAM_TEXT));
$coursefilter = trim(optional_param('course', '', PARAM_TEXT));
$fromdate = trim(optional_param('from', '', PARAM_TEXT));
$todate = trim(optional_param('to', '', PARAM_TEXT));

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0) {
    pqpd_fail(403, 'Choose an institution workspace before opening an unofficial transcript.');
}

$students = pqct_students_for_transcript_viewer($userid, $workspaceid);
if ($studentid <= 0 && $students) {
    $studentid = (int)array_key_first($students);
}

$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$canview = $studentid > 0 && pqct_user_can_view_student_transcript($userid, $studentid, $workspaceid);
if (!$canview) {
    pqpd_fail(403, 'You can only view unofficial transcripts for your own, linked, assigned, or managed students.');
}

// ---- GET: everything the page renders (verbatim assembly) --------------------
$payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
    'viewerid' => $userid,
    'include_internal' => false,
]);
pqco_course_audit('transcript_preview_viewed', 'student', $studentid, [
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'studentid' => $studentid,
    'warning_count' => (int)($payload['summary']['warning_count'] ?? 0),
    'blocker_count' => (int)($payload['summary']['blocker_count'] ?? 0),
]);
$header = $payload['header'] ?? [];
$policyheader = $header['policy'] ?? [];
$lines = $payload['lines'] ?? [];
$fromts = pqctul_filter_timestamp($fromdate);
$tots = pqctul_filter_timestamp($todate, true);

$statusoptions = [];
$courseoptions = [];
foreach ($lines as $line) {
    $status = (string)($line['status']['normalized'] ?? '');
    if ($status !== '') {
        $statusoptions[$status] = pqctul_status_label($status);
    }
    $coursevalue = pqctul_course_filter_value($line);
    $coursetitle = (string)($line['course']['title'] ?? '');
    if ($coursevalue !== '' && $coursetitle !== '') {
        $courseoptions[$coursevalue] = $coursetitle;
    }
}
asort($statusoptions);
asort($courseoptions);

$filteredlines = array_values(array_filter($lines, static function(array $line) use ($statusfilter, $coursefilter, $fromts, $tots): bool {
    if ($statusfilter !== '' && (string)($line['status']['normalized'] ?? '') !== $statusfilter) {
        return false;
    }
    if ($coursefilter !== '' && pqctul_course_filter_value($line) !== $coursefilter) {
        return false;
    }
    $reference = pqctul_line_reference_timestamp($line);
    if ($fromts > 0 && ($reference <= 0 || $reference < $fromts)) {
        return false;
    }
    if ($tots > 0 && ($reference <= 0 || $reference > $tots)) {
        return false;
    }
    return true;
}));

// Pre-render the per-line display strings server-side with the verbatim page
// helpers (userdate honours the token user's language/timezone) so the portal
// page mirrors the legacy formatting exactly.
foreach ($filteredlines as $i => $line) {
    $course = $line['course'] ?? [];
    $dates = $line['dates'] ?? [];
    $grade = $line['grade'] ?? [];
    $attendance = $line['attendance'] ?? [];
    $display = $line['display'] ?? [];
    $enrollmentdate = (int)($dates['moodleenrolledat'] ?? 0);
    if ($enrollmentdate <= 0) {
        $enrollmentdate = (int)($dates['approvedat'] ?? 0);
    }
    if ($enrollmentdate <= 0) {
        $enrollmentdate = (int)($dates['requestedat'] ?? 0);
    }
    $teachers = array_map(static function(array $teacher): string {
        return (string)($teacher['name'] ?? '');
    }, $line['teachers'] ?? []);
    $teachers = array_filter($teachers);
    $filteredlines[$i]['render'] = [
        'status_label' => pqctul_status_label((string)($line['status']['normalized'] ?? 'unknown')),
        'course_dates' => (pqctul_short_date((int)($course['startdate'] ?? 0)) ?: 'Not recorded')
            . ((int)($course['enddate'] ?? 0) > 0 ? ' to ' . pqctul_short_date((int)$course['enddate']) : ''),
        'enrollment' => pqctul_date($enrollmentdate),
        'grade' => (string)($display['grade'] ?? (!empty($grade['recorded']) ? pqctul_percent($grade['percentage']) : 'Not recorded')),
        'completion' => (string)($display['completion'] ?? 'Not recorded'),
        'attendance' => (string)($display['attendance'] ?? ((int)($attendance['sessions'] ?? 0) . ' sessions')),
        // Legacy quirk kept verbatim: the page reads an undefined $quiz
        // variable in this cell, so it always renders 'Not recorded'.
        'quiz' => !empty($quiz['recorded']) ? pqctul_percent($quiz['best_percentage'] ?? null) : 'Not recorded',
        'teachers' => $teachers ? implode(', ', $teachers) : 'Not recorded',
        'local_status_label' => pqctul_status_label((string)($line['status']['local'] ?? 'unknown')),
        'warning_count' => count($line['warnings'] ?? []),
        'warning_codes' => implode(', ', array_map(static function(array $warning): string {
            return (string)($warning['code'] ?? 'warning');
        }, $line['warnings'] ?? [])) ?: 'none',
        'source_ids' => 'request ' . (int)($line['requestid'] ?? 0)
            . ' / offering ' . (int)($line['offeringid'] ?? 0)
            . ' / moodle ' . (int)($line['course']['moodlecourseid'] ?? 0),
    ];
}

$warningsout = [];
foreach (array_slice($payload['warnings'] ?? [], 0, 10) as $warning) {
    $warning['css_class'] = pqctul_warning_class((string)($warning['severity'] ?? 'warning'));
    $warningsout[] = $warning;
}

$studentsout = [];
foreach ($students as $option) {
    $studentsout[] = ['id' => (int)$option->id, 'name' => fullname($option)];
}

// Legacy action buttons stay links to the live Moodle pages (parallel-run);
// PDF/CSV exports keep their legacy audit + bytes when opened from here.
$links = [
    'catalog' => (new moodle_url('/local/hubredirect/course_catalog_browse.php', $baseparams))->out(false),
    'dashboard' => (new moodle_url('/local/hubredirect/dashboard.php', $baseparams))->out(false),
    'pdf' => (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['studentid' => $studentid, 'type' => 'unofficial', 'format' => 'pdf']))->out(false),
    'legacy_page' => pqct_transcript_url($studentid, $workspaceid, $consumercontext)->out(false),
];
if ($canmanage) {
    $links['history'] = (new moodle_url('/local/hubredirect/course_student_history.php', $baseparams + ['studentid' => $studentid]))->out(false);
    $links['readiness'] = (new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams))->out(false);
    $links['official'] = (new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['studentid' => $studentid]))->out(false);
    $links['controls'] = (new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid]))->out(false);
    $links['csv'] = (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['studentid' => $studentid, 'type' => 'unofficial', 'format' => 'csv']))->out(false);
    $links['policy'] = (new moodle_url('/local/hubredirect/transcript_policy.php', $baseparams))->out(false);
    $links['diagnostics'] = (new moodle_url('/local/hubredirect/course_transcript_debug.php', $baseparams + ['studentid' => $studentid]))->out(false);
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'canmanage' => $canmanage,
    'studentid' => $studentid,
    'students' => $studentsout,
    'header' => [
        'student' => $header['student'] ?? [],
        'workspace' => $header['workspace'] ?? [],
        'consumer' => $header['consumer'] ?? [],
        'generated_at' => (int)($header['generated_at'] ?? time()),
        'generated_label' => userdate((int)($header['generated_at'] ?? time()), get_string('strftimedatetimeshort')),
        'policy' => [
            'source' => ucwords((string)($policyheader['source'] ?? 'default')),
            'version' => (int)($policyheader['version'] ?? 1),
            'hash' => substr((string)($policyheader['hash'] ?? ''), 0, 16),
        ],
    ],
    'summary' => $payload['summary'] ?? [],
    'warnings' => $warningsout,
    'total_lines' => count($lines),
    'filteredlines' => $filteredlines,
    'statusoptions' => $statusoptions,
    'courseoptions' => $courseoptions,
    'filters' => [
        'studentid' => $studentid,
        'status' => $statusfilter,
        'course' => $coursefilter,
        'from' => $fromdate,
        'to' => $todate,
    ],
    'links' => $links,
    'names' => pqpd_names([$studentid]),
], JSON_UNESCAPED_SLASHES);
exit;
