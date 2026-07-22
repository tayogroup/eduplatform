<?php
// ---- report: workspace-sessions (a workspace's live sessions list + create) ---
// Ported from local_hubredirect/workspace_sessions.php via
// workspace_sessions_portallib (pqwls_*). Dispatched from portal_data.php AFTER
// token auth: $claims is verified, $USER is the token user, JSON exception
// handler + CORS headers are installed. The legacy page stays live in parallel
// and is untouched.
//
// GET  ?report=workspace-sessions&token=…[&workspaceid=&consumer=]
//      -> the workspace's recent sessions (as the page renders them: BBB
//         credentials are never selected/exposed; teacher/student pickers carry
//         id + name only), status counts, and the create-form option lists.
// POST body JSON {"do": …}:
//      do=create   (single or weekly-recurring workspace sessions; the page's
//                   POST create block verbatim). confirm_sesskey() is dropped —
//                   token auth replaces the session key.
// The legacy page never calls pqh_live_security_audit, so there is none to keep.
// Access is the legacy page entry gate verbatim: pqh_current_workspace_id +
// pqh_user_can_manage_workspace + a valid workspace row, with the page's exact
// denial messages (pqh_access_denied -> pqpd_fail(403, same)).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_sessions_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
}

// ---- page preamble + access gate, replicated verbatim from the legacy page ----
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace owners and admins can create workspace live sessions.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening workspace live sessions.');
}

$teachers = pqwls_workspace_members($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$students = pqwls_workspace_members($workspaceid, ['student']);

// ---- POST: create (legacy POST block; single or weekly-recurring series) -------
if ($ispost) {
    $do = (string)($body['do'] ?? '');
    if ($do !== 'create') {
        pqpd_fail(400, 'Unknown workspace-sessions action.');
    }

    $message = '';
    $error = '';
    try {
        $teacherid = (int)($body['teacherid'] ?? 0);
        $title = trim(clean_param((string)($body['title'] ?? ''), PARAM_TEXT));
        $start = pqwls_parse_datetime(clean_param((string)($body['scheduled_start'] ?? ''), PARAM_TEXT));
        $duration = max(15, min(240, (int)($body['duration_minutes'] ?? 60)));
        $selectedstudents = array_map('intval', array_values((array)($body['studentids'] ?? [])));
        $recurring = (bool)clean_param($body['recurring_enabled'] ?? 0, PARAM_BOOL);
        $recurrencecount = max(1, min(52, (int)($body['recurrence_count'] ?? 4)));
        if ($title === '') {
            throw new invalid_parameter_exception('Session title is required.');
        }
        if ($start <= 0) {
            throw new invalid_parameter_exception('Choose a valid start date and time.');
        }
        if (!pqh_user_can_teach_in_workspace($teacherid, $workspaceid)) {
            throw new invalid_parameter_exception('Selected teacher is not a teaching member of this workspace.');
        }
        if ($recurring && !pqwls_series_ready()) {
            throw new invalid_parameter_exception('Recurring sessions require the live series database table. Run the local_prequran Moodle upgrade.');
        }
        $payload = [
            'teacherid' => $teacherid,
            'title' => $title,
            'description' => trim(clean_param((string)($body['description'] ?? ''), PARAM_TEXT)),
            'lessonid' => trim(clean_param((string)($body['lessonid'] ?? ''), PARAM_ALPHANUMEXT)),
            'unitid' => trim(clean_param((string)($body['unitid'] ?? ''), PARAM_ALPHANUMEXT)),
            'start' => $start,
            'duration' => $duration,
            'end' => $start + ($duration * 60),
        ];
        $starts = $recurring ? pqwls_generate_weekly_starts($start, $recurrencecount) : [$start];
        $seriesid = $recurring ? pqwls_insert_series($workspaceid, $payload, count($starts)) : 0;
        $created = 0;
        foreach ($starts as $index => $sessionstart) {
            $payload['start'] = (int)$sessionstart;
            $payload['end'] = (int)$sessionstart + ($duration * 60);
            $sessionid = pqwls_insert_live_session($workspaceid, $payload, $seriesid, $recurring ? $index + 1 : 0);
            if ($sessionid <= 0) {
                throw new invalid_parameter_exception('Live session table is not ready. Run the local_prequran Moodle upgrade.');
            }
            pqwls_insert_participants($workspaceid, $sessionid, $selectedstudents);
            $created++;
        }
        $message = $created > 1 ? $created . ' recurring workspace live sessions created.' : 'Workspace live session created.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }

    if ($error !== '') {
        pqpd_fail(400, $error);
    }
    echo json_encode([
        'ok' => true,
        'created' => $created,
        'seriesid' => $seriesid,
        'message' => $message,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: recent sessions + status counts + create-form option lists ----------
$sessions = pqwls_sessions($workspaceid);
$sessioncounts = [
    'scheduled' => 0,
    'started' => 0,
    'completed' => 0,
    'cancelled' => 0,
];
foreach ($sessions as $session) {
    $status = (string)($session->status ?? '');
    if (!array_key_exists($status, $sessioncounts)) {
        $sessioncounts[$status] = 0;
    }
    $sessioncounts[$status]++;
}

$nameids = [];
$sessionout = [];
foreach ($sessions as $s) {
    $nameids[] = (int)$s->teacherid;
    $sessionout[] = [
        'id' => (int)$s->id,
        'title' => (string)($s->title ?? ''),
        'teacherid' => (int)$s->teacherid,
        'teachername' => pqwls_user_name((int)$s->teacherid),
        'lessonid' => (string)($s->lessonid ?? ''),
        'unitid' => (string)($s->unitid ?? ''),
        'seriesid' => (int)($s->seriesid ?? 0),
        'series_sequence' => (int)($s->series_sequence ?? 0),
        'scheduled_start' => (int)($s->scheduled_start ?? 0),
        'start_label' => userdate((int)($s->scheduled_start ?? 0), get_string('strftimedatetimeshort')),
        'status' => (string)($s->status ?? ''),
    ];
}

// Teacher/student pickers expose id + display name only — email/username stay
// out of the portal response.
$teacherout = array_map(static function($t): array {
    return ['userid' => (int)$t->userid, 'name' => fullname($t)];
}, $teachers);
$studentout = array_map(static function($s): array {
    return ['userid' => (int)$s->userid, 'name' => fullname($s)];
}, $students);

echo json_encode([
    'ok' => true,
    'ready' => true,
    'brand' => $brandname,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'workspaceid' => $workspaceid,
    'tables_ready' => pqh_table_exists_safe('local_prequran_live_session'),
    'series_ready' => pqwls_series_ready(),
    'counts' => $sessioncounts,
    'sessioncount' => count($sessions),
    'teachers' => $teacherout,
    'students' => $studentout,
    'sessions' => $sessionout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
