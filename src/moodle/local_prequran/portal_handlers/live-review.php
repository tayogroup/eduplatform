<?php
// ---- report: live-review (teacher post-class review; read + teacher writes) --
// Ported from local_hubredirect/live_review.php via live_review_portallib
// (pqlrvl_*). Dispatched from portal_data.php AFTER token auth: $claims is
// verified, $USER is the token user, JSON exception handler + CORS headers are
// installed. The legacy page stays live in parallel and is untouched.
//
// GET  ?report=live-review&token=…&sessionid=[&workspaceid=&consumer=]
//      -> session metadata + completion state + the active-student roster with
//         each student's attendance/participation/notes/summary/follow-up state.
// POST body JSON {"do": …, "sessionid": …}:
//      do=save_review          (per-student attendance + note upserts, audits,
//                               completion workflow, parent notifications)
//      do=cancel_session       (status=cancelled + reason + audit)
//      do=reschedule_session   (new start/end, back to scheduled, audit)
// Access is the legacy page check verbatim: pqlrvl_is_teacher_or_admin()
// (academy-operations manager, workspace manager, or the session teacher);
// denial keeps the page's pqh_live_security audit write before failing.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_security.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_review_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
}

// ---- page preamble, replicated from the legacy page ---------------------------
$sessionid = $ispost ? (int)($body['sessionid'] ?? 0) : optional_param('sessionid', 0, PARAM_INT);
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
} else if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $urlparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
if ($sessionid > 0) {
    $urlparams['sessionid'] = $sessionid;
}
$workspaceurlparams = array_diff_key($urlparams, ['sessionid' => true]);

if (!pqlrvl_table_exists('local_prequran_live_session')
    || !pqlrvl_table_exists('local_prequran_live_participant')
    || !pqlrvl_table_exists('local_prequran_live_attendance')
    || !pqlrvl_table_exists('local_prequran_live_note')) {
    pqpd_fail(403, 'Live session review tables are not installed yet. Run the live review upgrade before using this page.');
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqpd_fail(403, 'Choose a valid live session before opening the review page.');
}
if ($requestedworkspaceid > 0
    && pqlrvl_column_exists('local_prequran_live_session', 'workspaceid')
    && (int)($session->workspaceid ?? 0) !== $requestedworkspaceid) {
    $actualworkspaceid = (int)($session->workspaceid ?? 0);
    pqpd_fail(403, 'This live session belongs to workspace #' . $actualworkspaceid . ', not workspace #' . $requestedworkspaceid . '. Choose a session from this workspace live-session list.');
}
if (!pqlrvl_is_teacher_or_admin($session)) {
    // The legacy page denies via pqh_live_security_deny(), which audits before
    // rendering the denial page; keep the same audit write, then answer JSON.
    pqh_live_security_audit('live_review_access_denied', 'session', $sessionid, [
        'sessionid' => $sessionid,
        'teacherid' => (int)$session->teacherid,
        'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    pqpd_fail(403, 'Only the assigned teacher or an administrator can review this live session.');
}

$homeworkfieldsready = pqlrvl_column_exists('local_prequran_live_note', 'homework_unitid');
$followupfieldsready = pqlrvl_column_exists('local_prequran_live_note', 'followup_status');
$students = $DB->get_records_sql(
    "SELECT *
       FROM {local_prequran_live_participant}
      WHERE sessionid = :sessionid
        AND role = :role
        AND status = :status
   ORDER BY displayname ASC, userid ASC",
    ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active']
);

if ($ispost) {
    $do = (string)($body['do'] ?? '');

    // ---- do: cancel_session (legacy action=cancel_session, verbatim) ---------
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'cancel_session') {
        $reason = pqlrvl_clean_text((string)($body['cancellation_reason'] ?? ''), 1000);
        $oldstatus = (string)$session->status;
        $session->status = 'cancelled';
        $session->cancelledby = (int)$USER->id;
        $session->cancellation_reason = $reason;
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);
        pqlrvl_audit($sessionid, 'session_cancelled', 'session', $sessionid, ['oldstatus' => $oldstatus, 'reason' => $reason]);
        echo json_encode([
            'ok' => true,
            'result' => 'cancelled',
            'message' => 'Session cancelled and audit history updated.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: reschedule_session (legacy action=reschedule_session, verbatim) -
    if ($do === 'reschedule_session') {
        if ((string)$session->status === 'cancelled') {
            pqpd_fail(403, 'Cancelled sessions cannot be rescheduled here.');
        }
        $date = clean_param((string)($body['reschedule_date'] ?? ''), PARAM_TEXT);
        $time = clean_param((string)($body['reschedule_time'] ?? ''), PARAM_TEXT);
        $duration = max(15, (int)($body['reschedule_duration'] ?? 60));
        $tz = core_date::get_server_timezone();
        $start = trim($date) !== '' && trim($time) !== '' ? strtotime($date . ' ' . $time . ' ' . $tz) : false;
        if (!$start) {
            // Legacy sets a page notice and re-renders; the API answers 400.
            pqpd_fail(400, 'Enter a valid reschedule date and time.');
        }
        $oldstart = (int)$session->scheduled_start;
        $oldend = (int)$session->scheduled_end;
        $oldstatus = (string)$session->status;
        $session->scheduled_start = $start;
        $session->scheduled_end = $start + ($duration * MINSECS);
        $session->timezone = $tz;
        $session->status = 'scheduled';
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);
        pqlrvl_audit($sessionid, 'session_rescheduled', 'session', $sessionid, [
            'oldstart' => $oldstart,
            'oldend' => $oldend,
            'oldstatus' => $oldstatus,
            'newstart' => (int)$session->scheduled_start,
            'newend' => (int)$session->scheduled_end,
        ]);
        echo json_encode([
            'ok' => true,
            'result' => 'rescheduled',
            'message' => 'Session rescheduled and returned to scheduled status.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: save_review (legacy action=save_review, verbatim) ---------------
    // The legacy form posts student_<id>_<field> params; the portal posts
    // body.students = [{studentid, …fields}]. The loop below still iterates the
    // server-side active roster (never the client list), and every default,
    // whitelist, guard, field assignment, audit, and notification is the legacy
    // block unchanged.
    if ($do === 'save_review') {
        $inputmap = [];
        foreach ((array)($body['students'] ?? []) as $key => $row) {
            if (is_array($row)) {
                $sid = (int)($row['studentid'] ?? $key);
                if ($sid > 0) {
                    $inputmap[$sid] = $row;
                }
            }
        }
        $now = time();
        $summarynotifications = [];
        $homeworknotifications = [];
        $followupnotifications = [];
        foreach ($students as $participant) {
            $studentid = (int)$participant->studentid;
            if ($studentid <= 0) {
                $studentid = (int)$participant->userid;
            }
            $in = $inputmap[$studentid] ?? [];
            $attendance = clean_param((string)($in['attendance_status'] ?? 'absent'), PARAM_ALPHANUMEXT);
            if (!in_array($attendance, ['present', 'late', 'absent', 'excused', 'technical_issue'], true)) {
                $attendance = 'absent';
            }
            $participation = clean_param((string)($in['participation_status'] ?? ''), PARAM_TEXT);
            $technical = (bool)clean_param($in['technical_issue'] ?? 0, PARAM_BOOL);
            $attnotes = pqlrvl_clean_text((string)($in['attendance_notes'] ?? ''), 1000);

            $att = $DB->get_record('local_prequran_live_attendance', [
                'sessionid' => $sessionid,
                'studentid' => $studentid,
            ], '*', IGNORE_MISSING);
            if ($att) {
                if (pqlrvl_column_exists('local_prequran_live_attendance', 'workspaceid')) {
                    $att->workspaceid = (int)($session->workspaceid ?? 0);
                }
                $att->userid = (int)$participant->userid;
                $att->attendance_status = $attendance;
                $att->participation_status = pqlrvl_clean_text($participation, 100);
                $att->technical_issue = $technical ? 1 : 0;
                $att->notes = $attnotes;
                $att->markedby = (int)$USER->id;
                $att->timemodified = $now;
                $DB->update_record('local_prequran_live_attendance', $att);
            } else {
                $attrecord = (object)[
                    'sessionid' => $sessionid,
                    'userid' => (int)$participant->userid,
                    'studentid' => $studentid,
                    'join_time' => 0,
                    'leave_time' => 0,
                    'attendance_status' => $attendance,
                    'participation_status' => pqlrvl_clean_text($participation, 100),
                    'technical_issue' => $technical ? 1 : 0,
                    'notes' => $attnotes,
                    'markedby' => (int)$USER->id,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ];
                if (pqlrvl_column_exists('local_prequran_live_attendance', 'workspaceid')) {
                    $attrecord->workspaceid = (int)($session->workspaceid ?? 0);
                }
                $DB->insert_record('local_prequran_live_attendance', $attrecord);
            }

            $visible = (bool)clean_param($in['visible_to_parent'] ?? 0, PARAM_BOOL);
            $note = $DB->get_record('local_prequran_live_note', [
                'sessionid' => $sessionid,
                'studentid' => $studentid,
            ], '*', IGNORE_MISSING);
            $wasvisible = $note ? !empty($note->visible_to_parent) : false;
            $oldhomework = $note ? trim((string)($note->homework ?? '') . ' ' . (string)($note->homework_unitid ?? '')) : '';
            $oldfollowupstatus = $note && isset($note->followup_status) ? (string)$note->followup_status : 'none';
            $oldfollowupresolved = $note && !empty($note->followup_resolved);
            $payload = [
                'strengths' => pqlrvl_clean_text((string)($in['strengths'] ?? '')),
                'needs_practice' => pqlrvl_clean_text((string)($in['needs_practice'] ?? '')),
                'homework' => pqlrvl_clean_text((string)($in['homework'] ?? '')),
                'parent_summary' => pqlrvl_clean_text((string)($in['parent_summary'] ?? '')),
                'private_note' => pqlrvl_clean_text((string)($in['private_note'] ?? '')),
                'visible_to_parent' => $visible ? 1 : 0,
            ];
            if ((string)$payload['private_note'] !== '') {
                pqlrvl_audit($sessionid, 'private_teacher_note_saved', 'student', $studentid, [
                    'private_note_length' => core_text::strlen((string)$payload['private_note']),
                ]);
            }
            if ($homeworkfieldsready) {
                $duedate = clean_param((string)($in['homework_due_date'] ?? ''), PARAM_TEXT);
                $duetime = $duedate !== '' ? strtotime($duedate . ' 23:59:59 ' . core_date::get_server_timezone()) : 0;
                $priority = clean_param((string)($in['homework_priority'] ?? 'normal'), PARAM_ALPHANUMEXT);
                if (!in_array($priority, ['low', 'normal', 'high'], true)) {
                    $priority = 'normal';
                }
                $payload['homework_lessonid'] = pqlrvl_clean_text((string)($in['homework_lessonid'] ?? (string)$session->lessonid), 100);
                $payload['homework_unitid'] = pqlrvl_clean_text((string)($in['homework_unitid'] ?? (string)$session->unitid), 100);
                $payload['homework_due_date'] = $duetime ?: 0;
                $payload['homework_priority'] = $priority;
            }
            if ($followupfieldsready) {
                $followupstatus = clean_param((string)($in['followup_status'] ?? 'none'), PARAM_ALPHANUMEXT);
                if (!in_array($followupstatus, ['none', 'review_homework', 'parent_contact_requested', 'admin_support_requested'], true)) {
                    $followupstatus = 'none';
                }
                $followupmessage = pqlrvl_clean_text((string)($in['followup_message'] ?? ''), 1500);
                $followupresolved = (bool)clean_param($in['followup_resolved'] ?? 0, PARAM_BOOL) ? 1 : 0;
                $payload['followup_status'] = $followupstatus;
                $payload['followup_message'] = $followupmessage;
                $payload['followup_resolved'] = $followupresolved;
                $payload['followup_resolvedby'] = $followupresolved ? (int)$USER->id : 0;
                $payload['followup_resolvedat'] = $followupresolved ? $now : 0;
            }
            if ($note) {
                foreach ($payload as $key => $value) {
                    $note->{$key} = $value;
                }
                if (pqlrvl_column_exists('local_prequran_live_note', 'workspaceid')) {
                    $note->workspaceid = (int)($session->workspaceid ?? 0);
                }
                $note->teacherid = (int)$session->teacherid;
                $note->timemodified = $now;
                $DB->update_record('local_prequran_live_note', $note);
            } else {
                $noterecord = (object)array_merge($payload, [
                    'sessionid' => $sessionid,
                    'studentid' => $studentid,
                    'teacherid' => (int)$session->teacherid,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
                if (pqlrvl_column_exists('local_prequran_live_note', 'workspaceid')) {
                    $noterecord->workspaceid = (int)($session->workspaceid ?? 0);
                }
                $DB->insert_record('local_prequran_live_note', $noterecord);
            }
            $publicfeedback = trim(implode(' ', [
                (string)$payload['strengths'],
                (string)$payload['needs_practice'],
                (string)$payload['homework'],
                (string)$payload['parent_summary'],
                (string)($payload['homework_unitid'] ?? ''),
            ]));
            if (!$wasvisible && !empty($payload['visible_to_parent']) && $publicfeedback !== '') {
                $summarynotifications[] = $studentid;
            }
            $newhomework = trim((string)$payload['homework'] . ' ' . (string)($payload['homework_unitid'] ?? ''));
            if (!empty($payload['visible_to_parent']) && $oldhomework === '' && $newhomework !== '') {
                $homeworknotifications[$studentid] = [
                    'homework' => (string)$payload['homework'],
                    'unitid' => (string)($payload['homework_unitid'] ?? ''),
                ];
                pqlrvl_audit($sessionid, 'homework_published', 'student', $studentid, [
                    'unitid' => (string)($payload['homework_unitid'] ?? ''),
                    'priority' => (string)($payload['homework_priority'] ?? 'normal'),
                ]);
            }
            if ($followupfieldsready) {
                $newfollowupstatus = (string)$payload['followup_status'];
                if ($newfollowupstatus !== 'none' && $newfollowupstatus !== $oldfollowupstatus) {
                    $action = $newfollowupstatus === 'admin_support_requested' ? 'admin_followup_requested' : 'parent_followup_requested';
                    pqlrvl_audit($sessionid, $action, 'student', $studentid, [
                        'status' => $newfollowupstatus,
                        'message' => (string)$payload['followup_message'],
                    ]);
                    if (!empty($payload['visible_to_parent']) && $newfollowupstatus !== 'admin_support_requested') {
                        $followupnotifications[$studentid] = [
                            'status' => $newfollowupstatus,
                            'message' => (string)$payload['followup_message'],
                        ];
                    }
                }
                if (!$oldfollowupresolved && !empty($payload['followup_resolved'])) {
                    pqlrvl_audit($sessionid, 'followup_resolved', 'student', $studentid, [
                        'status' => $newfollowupstatus,
                    ]);
                }
            }
        }
        $markcompleted = (bool)clean_param($body['mark_completed'] ?? 0, PARAM_BOOL);
        $oldstatus = (string)$session->status;
        $completion = pqlrvl_completion_state($sessionid, $students);
        if ($markcompleted && !empty($completion['complete'])) {
            $session->status = 'completed';
        } else if ($markcompleted) {
            $session->status = $oldstatus === 'completed' ? 'completed' : 'awaiting_review';
        } else if ((int)$session->scheduled_end < $now && !in_array($oldstatus, ['completed', 'cancelled'], true)) {
            $session->status = 'awaiting_review';
        }
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
        pqlrvl_audit($sessionid, 'review_saved', 'session', $sessionid, [
            'students' => count($students),
            'status' => (string)$session->status,
            'complete' => !empty($completion['complete']),
        ]);
        if ($markcompleted && !empty($completion['complete']) && $oldstatus !== 'completed') {
            pqlrvl_audit($sessionid, 'session_completed', 'session', $sessionid, $completion);
        } else if ($markcompleted && empty($completion['complete'])) {
            pqlrvl_audit($sessionid, 'session_completion_blocked', 'session', $sessionid, $completion);
        }
        foreach (array_unique($summarynotifications) as $notifystudentid) {
            $summaryurlparams = array_merge($workspaceurlparams, ['childid' => (int)$notifystudentid]);
            local_prequran_notify_parent_live_update(
                $sessionid,
                (int)$notifystudentid,
                'Live class summary is ready',
                'A teacher summary from your child\'s ' . $brandname . ' live class is ready to review.',
                new moodle_url('/local/hubredirect/live_summaries.php', $summaryurlparams),
                'View live summary',
                'live_summary_published'
            );
        }
        foreach ($homeworknotifications as $notifystudentid => $homework) {
            $summaryurlparams = array_merge($workspaceurlparams, ['childid' => (int)$notifystudentid]);
            local_prequran_notify_parent_live_update(
                $sessionid,
                (int)$notifystudentid,
                'Live class homework is ready',
                'Homework from your child\'s ' . $brandname . ' live class is ready to review.',
                new moodle_url('/local/hubredirect/live_summaries.php', $summaryurlparams),
                'View homework',
                'live_homework_published'
            );
        }
        foreach ($followupnotifications as $notifystudentid => $followup) {
            $summaryurlparams = array_merge($workspaceurlparams, ['childid' => (int)$notifystudentid]);
            local_prequran_notify_parent_live_update(
                $sessionid,
                (int)$notifystudentid,
                'Live class follow-up requested',
                'A teacher follow-up from your child\'s ' . $brandname . ' live class is ready to review.',
                new moodle_url('/local/hubredirect/live_summaries.php', $summaryurlparams),
                'View follow-up',
                'live_followup_requested'
            );
        }
        $resultcode = $markcompleted && !empty($completion['complete']) ? 'completed' : ($markcompleted ? 'awaiting_review' : 'saved');
        $messages = [
            'completed' => 'Session completed. Attendance and parent-visible feedback are ready.',
            'awaiting_review' => 'Saved, but completion is blocked until every student has attendance and parent-visible feedback.',
            'saved' => 'Attendance and notes saved.',
        ];
        echo json_encode([
            'ok' => true,
            'result' => $resultcode,
            'status' => (string)$session->status,
            'completion' => $completion,
            'message' => $messages[$resultcode],
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-review action.');
}

// ---- GET: the session review state (roster + attendance + notes) --------------
$attendancebyuser = [];
foreach ($DB->get_records('local_prequran_live_attendance', ['sessionid' => $sessionid]) as $row) {
    $attendancebyuser[(int)$row->studentid] = $row;
}

$notesbyuser = [];
foreach ($DB->get_records('local_prequran_live_note', ['sessionid' => $sessionid]) as $row) {
    $notesbyuser[(int)$row->studentid] = $row;
}

$teacher = core_user::get_user((int)$session->teacherid);
$completionstate = pqlrvl_completion_state($sessionid, $students);

$nameids = [(int)$session->teacherid];
$roster = [];
foreach ($students as $participant) {
    $studentid = (int)($participant->studentid ?: $participant->userid);
    $student = core_user::get_user($studentid);
    $name = $student ? fullname($student) : (string)$participant->displayname;
    $att = $attendancebyuser[$studentid] ?? null;
    $note = $notesbyuser[$studentid] ?? null;
    $nameids[] = $studentid;
    $roster[] = [
        'studentid' => $studentid,
        'userid' => (int)$participant->userid,
        'name' => $name,
        'has_attendance' => (bool)$att,
        'attendance_status' => $att ? (string)$att->attendance_status : '',
        'participation_status' => $att ? (string)$att->participation_status : '',
        'technical_issue' => $att ? (int)$att->technical_issue : 0,
        'attendance_notes' => $att ? (string)$att->notes : '',
        'join_time' => $att ? (int)($att->join_time ?? 0) : 0,
        'leave_time' => $att ? (int)($att->leave_time ?? 0) : 0,
        'has_note' => (bool)$note,
        'strengths' => $note ? (string)($note->strengths ?? '') : '',
        'needs_practice' => $note ? (string)($note->needs_practice ?? '') : '',
        'homework' => $note ? (string)($note->homework ?? '') : '',
        'parent_summary' => $note ? (string)($note->parent_summary ?? '') : '',
        'private_note' => $note ? (string)($note->private_note ?? '') : '',
        // Legacy checkbox default: checked when no note exists yet.
        'visible_to_parent' => $note ? (int)!empty($note->visible_to_parent) : 1,
        'homework_lessonid' => $note && isset($note->homework_lessonid) && (string)$note->homework_lessonid !== '' ? (string)$note->homework_lessonid : (string)$session->lessonid,
        'homework_unitid' => $note && isset($note->homework_unitid) && (string)$note->homework_unitid !== '' ? (string)$note->homework_unitid : (string)$session->unitid,
        'homework_due_date' => $note && !empty($note->homework_due_date) ? (int)$note->homework_due_date : 0,
        'homework_priority' => $note && isset($note->homework_priority) ? (string)$note->homework_priority : 'normal',
        'followup_status' => $note && isset($note->followup_status) ? (string)$note->followup_status : 'none',
        'followup_message' => $note && isset($note->followup_message) ? (string)$note->followup_message : '',
        'followup_resolved' => $note && !empty($note->followup_resolved) ? 1 : 0,
    ];
}

// Curated session fields only — the raw record carries BBB room credentials
// that must never reach the browser.
echo json_encode([
    'ok' => true,
    'ready' => true,
    'brand' => $brandname,
    'session' => [
        'id' => (int)$session->id,
        'title' => (string)$session->title,
        'status' => (string)$session->status,
        'scheduled_start' => (int)$session->scheduled_start,
        'scheduled_end' => (int)$session->scheduled_end,
        'timezone' => (string)($session->timezone ?? ''),
        'lessonid' => (string)$session->lessonid,
        'unitid' => (string)$session->unitid,
        'teacherid' => (int)$session->teacherid,
        'workspaceid' => (int)($session->workspaceid ?? 0),
        'cancellation_reason' => (string)($session->cancellation_reason ?? ''),
    ],
    'teachername' => $teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid,
    'homeworkfieldsready' => $homeworkfieldsready,
    'followupfieldsready' => $followupfieldsready,
    'completion' => $completionstate,
    'roster' => $roster,
    'attendance_options' => ['present' => 'Present', 'late' => 'Late', 'absent' => 'Absent', 'excused' => 'Excused', 'technical_issue' => 'Technical issue'],
    'priority_options' => ['low' => 'Low', 'normal' => 'Normal', 'high' => 'High'],
    'followup_options' => ['none' => 'No follow-up', 'review_homework' => 'Review homework', 'parent_contact_requested' => 'Parent contact requested', 'admin_support_requested' => 'Admin support requested'],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
