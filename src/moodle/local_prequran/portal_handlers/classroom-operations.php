<?php
// ---- report: classroom-operations (classroom & live-session management) --------
// Ported from local_hubredirect/classroom_operations.php via
// classroom_operations_portallib (reserved prefix pqclo_ — the page defines no
// helpers of its own, so the shared pqh_*/pqops_* libraries are required
// directly). Dispatched from portal_data.php AFTER token auth: $claims verified,
// $USER is the token user, JSON exception handler + CORS headers installed. The
// legacy page stays live in parallel and is untouched.
//
// GET  ?report=classroom-operations&token=…[&workspaceid=&consumer=]
//      -> the classroom-operations dataset the legacy page renders: teacher and
//         student pickers (id + display name), the recent sessions / notes /
//         recordings / reminder-queue rows, the recording-enabled default flag,
//         and a resolved-names map for reminder recipients. Room links carry no
//         credentials; parent-visible fields are passed as-is (same as the page).
// POST body JSON {"do": …}:
//      do=save_session        (legacy action=save_session, verbatim upsert +
//                              queued reminders; teacher/manager write)
//      do=cancel_session      (legacy action=cancel_session, verbatim)
//      do=save_note           (legacy action=save_note, verbatim note/homework)
//      do=recording_visibility(legacy action=recording_visibility, verbatim)
// require_sesskey() is dropped — token auth replaces the session key. The legacy
// page never calls pqh_live_security_audit, so there is none to keep. The legacy
// page has no read-only POST actions. Access is the legacy page entry gate
// verbatim: pqh_current_workspace_id + pqh_user_can_teach_in_workspace + a valid
// workspace row, with the page's exact denial message
// (pqh_access_denied -> pqpd_fail(403, same)). The legacy default-redirect for
// old bookmarks (to live_ops/live_sessions unless legacy=1) is a page-navigation
// concern only and has no place in a JSON data endpoint.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/operations_layerlib.php');
require_once($CFG->dirroot . '/local/hubredirect/classroom_operations_portallib.php');

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
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Classroom operations require teacher or workspace administrator access.');
}
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening classroom operations.');
}
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

// recording_enabled default — same expression the page computes.
$recordingdefault = in_array(strtolower(trim((string)($consumercontext->consumer_type ?? ''))), ['marketplace', 'teacher_workspace'], true)
    || strtolower(trim((string)($workspace->workspace_type ?? ''))) === 'solo_teacher'
    || strpos(strtolower(trim((string)($workspace->plan_code ?? ''))), 'teacher') !== false
    || strpos(strtolower(trim((string)($workspace->plan_code ?? ''))), 'marketplace') !== false;

// ---- POST: the four legacy write actions (all verbatim) ------------------------
if ($ispost) {
    $do = (string)($body['do'] ?? '');
    if (!in_array($do, ['save_session', 'cancel_session', 'save_note', 'recording_visibility'], true)) {
        pqpd_fail(400, 'Unknown classroom-operations action.');
    }
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        pqpd_fail(400, 'Live session table is not ready.');
    }
    $now = time();

    // ---- do: save_session (legacy action=save_session, verbatim) ----------------
    if ($do === 'save_session') {
        $sessionid = (int)($body['sessionid'] ?? 0);
        $existing = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
        $start = pqops_datetime_from_parts(clean_param((string)($body['session_date'] ?? ''), PARAM_TEXT), clean_param((string)($body['start_time'] ?? ''), PARAM_TEXT));
        $duration = max(15, (int)($body['duration_minutes'] ?? 60));
        $record = (object)[
            'workspaceid' => $workspaceid,
            'seriesid' => (int)($existing->seriesid ?? 0),
            'series_sequence' => (int)($existing->series_sequence ?? 0),
            'cohortid' => 0,
            'teacherid' => (int)($body['teacherid'] ?? (int)($existing->teacherid ?? $USER->id)),
            'session_type' => clean_param((string)($body['session_type'] ?? 'teacher_led'), PARAM_ALPHANUMEXT),
            'lessonid' => clean_param((string)($body['lessonid'] ?? ''), PARAM_TEXT),
            'unitid' => clean_param((string)($body['unitid'] ?? ''), PARAM_TEXT),
            'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
            'description' => clean_param((string)($body['description'] ?? ''), PARAM_TEXT),
            'scheduled_start' => $start,
            'scheduled_end' => $start + ($duration * 60),
            'timezone' => clean_param((string)($body['timezone'] ?? 'Africa/Nairobi'), PARAM_TEXT),
            'status' => clean_param((string)($body['status'] ?? 'scheduled'), PARAM_ALPHANUMEXT),
            'recording_enabled' => (int)($body['recording_enabled'] ?? ($recordingdefault ? 1 : 0)) ? 1 : 0,
            'recording_consent_required' => (int)($body['recording_consent_required'] ?? 1) ? 1 : 0,
            'parent_observer_allowed' => (int)($body['parent_observer_allowed'] ?? 0) ? 1 : 0,
            'max_participants' => (int)($body['max_participants'] ?? 12),
            'createdby' => (int)($existing->createdby ?? $USER->id),
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        foreach ([
            'room_provider' => clean_param((string)($body['room_provider'] ?? 'bbb'), PARAM_ALPHANUMEXT),
            'room_url' => clean_param((string)($body['room_url'] ?? ''), PARAM_URL),
            'reschedule_status' => $existing ? 'rescheduled' : 'none',
            'rescheduled_from' => $existing ? (int)$existing->scheduled_start : 0,
            'reminder_offset_minutes' => (int)($body['reminder_offset_minutes'] ?? 60),
            'parent_visibility_json' => pqops_json(['notes' => clean_param((string)($body['parent_visibility'] ?? 'notes_homework_recordings'), PARAM_TEXT)]),
        ] as $field => $value) {
            if (pqh_table_has_field_safe('local_prequran_live_session', $field)) {
                $record->{$field} = $value;
            }
        }
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_live_session', $record);
            $sid = (int)$existing->id;
        } else {
            $sid = (int)$DB->insert_record('local_prequran_live_session', $record);
        }
        $queued = pqops_queue_session_reminders($workspaceid, $sid, (int)($body['reminder_offset_minutes'] ?? 60), clean_param((string)($body['reminder_channel'] ?? 'email'), PARAM_ALPHANUMEXT));
        echo json_encode([
            'ok' => true,
            'result' => 'session_saved',
            'sessionid' => $sid,
            'message' => 'Session saved. Queued ' . $queued . ' reminder(s).',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: cancel_session (legacy action=cancel_session, verbatim) ------------
    if ($do === 'cancel_session') {
        $session = $DB->get_record('local_prequran_live_session', ['id' => (int)($body['sessionid'] ?? 0), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
        $session->status = 'cancelled';
        $session->cancelledby = (int)$USER->id;
        $session->cancellation_reason = clean_param((string)($body['cancellation_reason'] ?? ''), PARAM_TEXT);
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
        echo json_encode([
            'ok' => true,
            'result' => 'session_cancelled',
            'sessionid' => (int)$session->id,
            'message' => 'Session cancelled.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: save_note (legacy action=save_note, verbatim) ----------------------
    if ($do === 'save_note') {
        if (!pqh_table_exists_safe('local_prequran_live_note')) {
            pqpd_fail(400, 'Live note table is not ready.');
        }
        $sessionid = (int)($body['sessionid'] ?? 0);
        $studentid = (int)($body['studentid'] ?? 0);
        $existing = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
        $record = (object)[
            'sessionid' => $sessionid,
            'studentid' => $studentid,
            'teacherid' => (int)$USER->id,
            'strengths' => clean_param((string)($body['strengths'] ?? ''), PARAM_TEXT),
            'needs_practice' => clean_param((string)($body['needs_practice'] ?? ''), PARAM_TEXT),
            'homework' => clean_param((string)($body['homework'] ?? ''), PARAM_TEXT),
            'homework_lessonid' => clean_param((string)($body['homework_lessonid'] ?? ''), PARAM_TEXT),
            'homework_unitid' => clean_param((string)($body['homework_unitid'] ?? ''), PARAM_TEXT),
            'homework_due_date' => pqops_time_from_date(clean_param((string)($body['homework_due_date'] ?? ''), PARAM_TEXT)),
            'homework_priority' => clean_param((string)($body['homework_priority'] ?? 'normal'), PARAM_ALPHANUMEXT),
            'parent_summary' => clean_param((string)($body['parent_summary'] ?? ''), PARAM_TEXT),
            'private_note' => clean_param((string)($body['private_note'] ?? ''), PARAM_TEXT),
            'visible_to_parent' => (int)($body['visible_to_parent'] ?? 1) ? 1 : 0,
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_live_note', $record);
        } else {
            $DB->insert_record('local_prequran_live_note', $record);
        }
        echo json_encode([
            'ok' => true,
            'result' => 'note_saved',
            'message' => 'Session note and homework saved.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: recording_visibility (legacy action=recording_visibility, verbatim)-
    $recording = $DB->get_record('local_prequran_live_recording', ['id' => (int)($body['recordingid'] ?? 0)], '*', MUST_EXIST);
    $recording->visible_to_parent = (int)($body['visible_to_parent'] ?? 0) ? 1 : 0;
    $recording->published = (int)($body['published'] ?? 0) ? 1 : 0;
    $recording->reviewedby = (int)$USER->id;
    $recording->reviewedat = $now;
    $recording->timemodified = $now;
    $DB->update_record('local_prequran_live_recording', $recording);
    echo json_encode([
        'ok' => true,
        'result' => 'recording_updated',
        'recordingid' => (int)$recording->id,
        'message' => 'Recording visibility updated.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: teachers/students pickers + sessions/notes/recordings/reminders ------
// Same queries and limits as the legacy page render block.
$teachers = pqops_workspace_users($workspaceid, 'teacher');
$students = pqops_workspace_users($workspaceid, 'student');
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records('local_prequran_live_session', ['workspaceid' => $workspaceid], 'scheduled_start DESC', '*', 0, 100)) : [];
$notes = pqh_table_exists_safe('local_prequran_live_note') ? array_values($DB->get_records_sql("SELECT n.*, s.title AS sessiontitle, u.firstname, u.lastname FROM {local_prequran_live_note} n LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid LEFT JOIN {user} u ON u.id = n.studentid WHERE s.workspaceid = :workspaceid ORDER BY n.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$recordings = pqh_table_exists_safe('local_prequran_live_recording') ? array_values($DB->get_records_sql("SELECT r.*, s.workspaceid FROM {local_prequran_live_recording} r JOIN {local_prequran_live_session} s ON s.id = r.sessionid WHERE s.workspaceid = :workspaceid ORDER BY r.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$reminders = pqh_table_exists_safe('local_prequran_live_reminder') ? array_values($DB->get_records('local_prequran_live_reminder', ['workspaceid' => $workspaceid], 'sendat ASC', '*', 0, 80)) : [];

// Teacher/student pickers expose id + display name only.
$teacherout = array_map(static function($t): array {
    return ['id' => (int)$t->id, 'name' => fullname($t)];
}, $teachers);
$studentout = array_map(static function($s): array {
    return ['id' => (int)$s->id, 'name' => fullname($s)];
}, $students);

$sessionout = [];
foreach ($sessions as $s) {
    $sessionout[] = [
        'id' => (int)$s->id,
        'title' => (string)($s->title ?? ''),
        'scheduled_start' => (int)($s->scheduled_start ?? 0),
        'start_label' => userdate((int)($s->scheduled_start ?? 0), get_string('strftimedatetimeshort')),
        'status' => (string)($s->status ?? ''),
        'teacherid' => (int)($s->teacherid ?? 0),
        'room_provider' => (string)($s->room_provider ?? 'bbb'),
        'room_url' => (string)($s->room_url ?? ''),
    ];
}

$noteout = [];
foreach ($notes as $n) {
    $noteout[] = [
        'id' => (int)$n->id,
        'sessionid' => (int)$n->sessionid,
        'session' => (string)($n->sessiontitle ?? ('Session #' . (int)$n->sessionid)),
        'studentid' => (int)$n->studentid,
        'student' => trim(((string)($n->firstname ?? '')) . ' ' . ((string)($n->lastname ?? ''))) ?: ('Student ' . (int)$n->studentid),
        'strengths' => (string)($n->strengths ?? ''),
        'needs_practice' => (string)($n->needs_practice ?? ''),
        'homework' => (string)($n->homework ?? ''),
        'parent_summary' => (string)($n->parent_summary ?? ''),
        'visible_to_parent' => (int)($n->visible_to_parent ?? 0),
        'timemodified' => (int)($n->timemodified ?? 0),
    ];
}

$recordingout = [];
foreach ($recordings as $r) {
    $recordingout[] = [
        'id' => (int)$r->id,
        'name' => (string)($r->name ?: ('Recording #' . (int)$r->id)),
        'playback_url' => (string)($r->playback_url ?? ''),
        'status' => (string)($r->status ?? ''),
        'published' => (int)($r->published ?? 0),
        'visible_to_parent' => (int)($r->visible_to_parent ?? 0),
    ];
}

$reminderout = [];
$nameids = [];
foreach ($reminders as $rem) {
    $nameids[] = (int)($rem->recipientid ?? 0);
    $reminderout[] = [
        'recipientid' => (int)($rem->recipientid ?? 0),
        'sendat' => (int)($rem->sendat ?? 0),
        'channel' => (string)($rem->channel ?? ''),
        'status' => (string)($rem->status ?? ''),
    ];
}
foreach ($sessions as $s) {
    $nameids[] = (int)($s->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => pqh_table_exists_safe('local_prequran_live_session'),
    'brand' => $brandname,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'workspaceid' => $workspaceid,
    'canmanage' => $canmanage,
    'recordingdefault' => (bool)$recordingdefault,
    'teachers' => $teacherout,
    'students' => $studentout,
    'sessions' => $sessionout,
    'notes' => $noteout,
    'recordings' => $recordingout,
    'reminders' => $reminderout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
