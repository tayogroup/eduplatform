<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/operations_layerlib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Classroom operations require teacher or workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Classroom access denied');
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$consumercontext = pqh_requested_consumer_context();
$recordingdefault = in_array(strtolower(trim((string)($consumercontext->consumer_type ?? ''))), ['marketplace', 'teacher_workspace'], true)
    || strtolower(trim((string)($workspace->workspace_type ?? ''))) === 'solo_teacher'
    || strpos(strtolower(trim((string)($workspace->plan_code ?? ''))), 'teacher') !== false
    || strpos(strtolower(trim((string)($workspace->plan_code ?? ''))), 'marketplace') !== false;
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

// Keep old bookmarks working while routing users to the current live-session surfaces.
if (!optional_param('legacy', 0, PARAM_INT)) {
    $targetpath = $canmanage ? '/local/hubredirect/live_ops.php' : '/local/hubredirect/live_sessions.php';
    redirect(new moodle_url($targetpath, $urlparams));
}

$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqh_table_exists_safe('local_prequran_live_session')) {
            throw new invalid_parameter_exception('Live session table is not ready.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_session') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $existing = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $start = pqops_datetime_from_parts(optional_param('session_date', '', PARAM_TEXT), optional_param('start_time', '', PARAM_TEXT));
            $duration = max(15, optional_param('duration_minutes', 60, PARAM_INT));
            $record = (object)[
                'workspaceid' => $workspaceid,
                'seriesid' => (int)($existing->seriesid ?? 0),
                'series_sequence' => (int)($existing->series_sequence ?? 0),
                'cohortid' => 0,
                'teacherid' => optional_param('teacherid', (int)($existing->teacherid ?? $USER->id), PARAM_INT),
                'session_type' => optional_param('session_type', 'teacher_led', PARAM_ALPHANUMEXT),
                'lessonid' => optional_param('lessonid', '', PARAM_TEXT),
                'unitid' => optional_param('unitid', '', PARAM_TEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'description' => optional_param('description', '', PARAM_TEXT),
                'scheduled_start' => $start,
                'scheduled_end' => $start + ($duration * 60),
                'timezone' => optional_param('timezone', 'Africa/Nairobi', PARAM_TEXT),
                'status' => optional_param('status', 'scheduled', PARAM_ALPHANUMEXT),
                'recording_enabled' => optional_param('recording_enabled', $recordingdefault ? 1 : 0, PARAM_INT) ? 1 : 0,
                'recording_consent_required' => optional_param('recording_consent_required', 1, PARAM_INT) ? 1 : 0,
                'parent_observer_allowed' => optional_param('parent_observer_allowed', 0, PARAM_INT) ? 1 : 0,
                'max_participants' => optional_param('max_participants', 12, PARAM_INT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            foreach ([
                'room_provider' => optional_param('room_provider', 'bbb', PARAM_ALPHANUMEXT),
                'room_url' => optional_param('room_url', '', PARAM_URL),
                'reschedule_status' => $existing ? 'rescheduled' : 'none',
                'rescheduled_from' => $existing ? (int)$existing->scheduled_start : 0,
                'reminder_offset_minutes' => optional_param('reminder_offset_minutes', 60, PARAM_INT),
                'parent_visibility_json' => pqops_json(['notes' => optional_param('parent_visibility', 'notes_homework_recordings', PARAM_TEXT)]),
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
            $queued = pqops_queue_session_reminders($workspaceid, $sid, optional_param('reminder_offset_minutes', 60, PARAM_INT), optional_param('reminder_channel', 'email', PARAM_ALPHANUMEXT));
            $notice = 'Session saved. Queued ' . $queued . ' reminder(s).';
        } else if ($action === 'cancel_session') {
            $session = $DB->get_record('local_prequran_live_session', ['id' => optional_param('sessionid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $session->status = 'cancelled';
            $session->cancelledby = (int)$USER->id;
            $session->cancellation_reason = optional_param('cancellation_reason', '', PARAM_TEXT);
            $session->timemodified = $now;
            $DB->update_record('local_prequran_live_session', $session);
            $notice = 'Session cancelled.';
        } else if ($action === 'save_note') {
            if (!pqh_table_exists_safe('local_prequran_live_note')) {
                throw new invalid_parameter_exception('Live note table is not ready.');
            }
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'sessionid' => $sessionid,
                'studentid' => $studentid,
                'teacherid' => (int)$USER->id,
                'strengths' => optional_param('strengths', '', PARAM_TEXT),
                'needs_practice' => optional_param('needs_practice', '', PARAM_TEXT),
                'homework' => optional_param('homework', '', PARAM_TEXT),
                'homework_lessonid' => optional_param('homework_lessonid', '', PARAM_TEXT),
                'homework_unitid' => optional_param('homework_unitid', '', PARAM_TEXT),
                'homework_due_date' => pqops_time_from_date(optional_param('homework_due_date', '', PARAM_TEXT)),
                'homework_priority' => optional_param('homework_priority', 'normal', PARAM_ALPHANUMEXT),
                'parent_summary' => optional_param('parent_summary', '', PARAM_TEXT),
                'private_note' => optional_param('private_note', '', PARAM_TEXT),
                'visible_to_parent' => optional_param('visible_to_parent', 1, PARAM_INT) ? 1 : 0,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_live_note', $record);
            } else {
                $DB->insert_record('local_prequran_live_note', $record);
            }
            $notice = 'Session note and homework saved.';
        } else if ($action === 'recording_visibility') {
            $recording = $DB->get_record('local_prequran_live_recording', ['id' => optional_param('recordingid', 0, PARAM_INT)], '*', MUST_EXIST);
            $recording->visible_to_parent = optional_param('visible_to_parent', 0, PARAM_INT) ? 1 : 0;
            $recording->published = optional_param('published', 0, PARAM_INT) ? 1 : 0;
            $recording->reviewedby = (int)$USER->id;
            $recording->reviewedat = $now;
            $recording->timemodified = $now;
            $DB->update_record('local_prequran_live_recording', $recording);
            $notice = 'Recording visibility updated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/classroom_operations.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Classroom And Live Session Management');
$PAGE->set_heading('Classroom And Live Session Management');

$teachers = pqops_workspace_users($workspaceid, 'teacher');
$students = pqops_workspace_users($workspaceid, 'student');
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records('local_prequran_live_session', ['workspaceid' => $workspaceid], 'scheduled_start DESC', '*', 0, 100)) : [];
$notes = pqh_table_exists_safe('local_prequran_live_note') ? array_values($DB->get_records_sql("SELECT n.*, s.title AS sessiontitle, u.firstname, u.lastname FROM {local_prequran_live_note} n LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid LEFT JOIN {user} u ON u.id = n.studentid WHERE s.workspaceid = :workspaceid ORDER BY n.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$recordings = pqh_table_exists_safe('local_prequran_live_recording') ? array_values($DB->get_records_sql("SELECT r.*, s.workspaceid FROM {local_prequran_live_recording} r JOIN {local_prequran_live_session} s ON s.id = r.sessionid WHERE s.workspaceid = :workspaceid ORDER BY r.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$reminders = pqh_table_exists_safe('local_prequran_live_reminder') ? array_values($DB->get_records('local_prequran_live_reminder', ['workspaceid' => $workspaceid], 'sendat ASC', '*', 0, 80)) : [];

echo $OUTPUT->header();
echo '<style>.pqcls{max-width:1180px;margin:0 auto}.pqcls-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqcls-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqcls-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqcls-field{margin-bottom:10px}.pqcls-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqcls-input,.pqcls-select,.pqcls-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqcls-textarea{min-height:70px}.pqcls-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqcls-btn--light{background:#f7fbf8;color:#173044}.pqcls-table{width:100%;border-collapse:collapse}.pqcls-table th,.pqcls-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqcls-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqcls-muted{color:#617064;font-size:12px}.pqcls-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqcls-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqcls-grid,.pqcls-top{display:block}}</style>';
echo '<div class="pqcls"><div class="pqcls-top"><div><h2>Classroom And Live Session Management</h2><div class="pqcls-muted">' . s($workspace->name) . ' scheduling, rooms, notes, homework, recordings, parent visibility, and reminders.</div></div><a class="pqcls-btn pqcls-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqcls-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqcls-error">' . s($error) . '</div>'; }
echo '<div class="pqcls-grid"><section class="pqcls-panel"><h3>Schedule / Reschedule</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_session"><div class="pqcls-field"><label>Teacher</label><select class="pqcls-select" name="teacherid">';
foreach ($teachers as $teacher) { echo '<option value="' . (int)$teacher->id . '">' . s(fullname($teacher)) . '</option>'; }
echo '</select></div>';
foreach ([['title','Title'],['session_date','Date'],['start_time','Start time HH:MM'],['duration_minutes','Duration minutes'],['timezone','Timezone'],['lessonid','Lesson ID'],['unitid','Unit ID'],['room_url','Zoom/BBB/Meet/internal room link'],['reminder_offset_minutes','Reminder minutes before']] as $field) { echo '<div class="pqcls-field"><label>' . s($field[1]) . '</label><input class="pqcls-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqcls-field"><label>Room provider</label><select class="pqcls-select" name="room_provider"><option value="bbb">BBB</option><option value="zoom">Zoom</option><option value="meet">Google Meet</option><option value="internal">Internal room</option></select></div><div class="pqcls-field"><label>Status</label><input class="pqcls-input" name="status" value="scheduled"></div><div class="pqcls-field"><label>Description</label><textarea class="pqcls-textarea" name="description"></textarea></div><div class="pqcls-field"><input type="hidden" name="recording_enabled" value="0"><label><input type="checkbox" name="recording_enabled" value="1" ' . ($recordingdefault ? 'checked' : '') . '> Recording enabled for missed-class playback when consent allows</label></div><div class="pqcls-field"><label><input type="checkbox" name="parent_observer_allowed" value="1"> Parent observer allowed</label></div><button class="pqcls-btn" type="submit">Save Session</button></form><hr><h3>Session Notes / Homework</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_note"><div class="pqcls-field"><label>Session</label><select class="pqcls-select" name="sessionid">';
foreach ($sessions as $session) { echo '<option value="' . (int)$session->id . '">' . s($session->title . ' / ' . userdate((int)$session->scheduled_start)) . '</option>'; }
echo '</select></div><div class="pqcls-field"><label>Student</label><select class="pqcls-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div>';
foreach ([['strengths','Strengths'],['needs_practice','Needs practice'],['homework','Homework'],['parent_summary','Parent summary'],['private_note','Private note']] as $field) { echo '<div class="pqcls-field"><label>' . s($field[1]) . '</label><textarea class="pqcls-textarea" name="' . s($field[0]) . '"></textarea></div>'; }
echo '<div class="pqcls-field"><label>Homework due date</label><input class="pqcls-input" name="homework_due_date"></div><div class="pqcls-field"><label><input type="checkbox" name="visible_to_parent" value="1" checked> Visible to parent</label></div><button class="pqcls-btn" type="submit">Save Note</button></form></section><section class="pqcls-panel"><h3>Sessions</h3><table class="pqcls-table"><thead><tr><th>Session</th><th>Room</th><th>Status</th><th>Cancel</th></tr></thead><tbody>';
foreach ($sessions as $session) { echo '<tr><td><strong>' . s($session->title) . '</strong><div class="pqcls-muted">' . s(userdate((int)$session->scheduled_start)) . '</div></td><td>' . s((string)($session->room_provider ?? 'bbb')) . '<div class="pqcls-muted">' . s((string)($session->room_url ?? '')) . '</div></td><td><span class="pqcls-pill">' . s($session->status) . '</span></td><td><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="cancel_session"><input type="hidden" name="sessionid" value="' . (int)$session->id . '"><input class="pqcls-input" name="cancellation_reason" placeholder="Reason"><button class="pqcls-btn pqcls-btn--light">Cancel</button></form></td></tr>'; }
if (!$sessions) { echo '<tr><td colspan="4" class="pqcls-muted">No sessions yet.</td></tr>'; }
echo '</tbody></table><h3>Recordings</h3><table class="pqcls-table"><thead><tr><th>Recording</th><th>Status</th><th>Visibility</th></tr></thead><tbody>';
foreach ($recordings as $rec) { echo '<tr><td>' . s($rec->name ?: ('Recording #' . (int)$rec->id)) . '<div class="pqcls-muted">' . s($rec->playback_url) . '</div></td><td><span class="pqcls-pill">' . s($rec->status) . '</span></td><td><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="recording_visibility"><input type="hidden" name="recordingid" value="' . (int)$rec->id . '"><label><input type="checkbox" name="published" value="1" ' . ((int)$rec->published ? 'checked' : '') . '> Published</label><br><label><input type="checkbox" name="visible_to_parent" value="1" ' . ((int)$rec->visible_to_parent ? 'checked' : '') . '> Parent visible</label><br><button class="pqcls-btn pqcls-btn--light">Save</button></form></td></tr>'; }
if (!$recordings) { echo '<tr><td colspan="3" class="pqcls-muted">No recordings found.</td></tr>'; }
echo '</tbody></table><h3>Reminder Queue</h3><table class="pqcls-table"><thead><tr><th>Recipient</th><th>Channel</th><th>Status</th></tr></thead><tbody>';
foreach ($reminders as $rem) { echo '<tr><td>User #' . (int)$rem->recipientid . '<div class="pqcls-muted">' . s(userdate((int)$rem->sendat)) . '</div></td><td>' . s($rem->channel) . '</td><td><span class="pqcls-pill">' . s($rem->status) . '</span></td></tr>'; }
if (!$reminders) { echo '<tr><td colspan="3" class="pqcls-muted">No reminders queued.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
