<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_security.php');

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
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

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_review.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Session Review');
$PAGE->set_heading('Live Session Review');
$PAGE->add_body_class('pqh-live-review-page');

function pqlr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlr_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlr_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlr_is_teacher_or_admin($session): bool {
    global $USER;
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return true;
    }
    if (pqlr_column_exists('local_prequran_live_session', 'workspaceid')
        && (int)($session->workspaceid ?? 0) > 0
        && pqh_user_can_manage_workspace((int)$USER->id, (int)$session->workspaceid)) {
        return true;
    }
    return (int)$session->teacherid === (int)$USER->id;
}

function pqlr_clean_text(string $value, int $max = 3000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlr_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlr_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlr_public_feedback_complete($note): bool {
    if (!$note || empty($note->visible_to_parent)) {
        return false;
    }
    $public = trim(implode(' ', [
        (string)($note->strengths ?? ''),
        (string)($note->needs_practice ?? ''),
        (string)($note->homework ?? ''),
        (string)($note->parent_summary ?? ''),
    ]));
    return $public !== '';
}

function pqlr_completion_state(int $sessionid, array $students): array {
    global $DB;
    $active = count($students);
    $attendancecomplete = 0;
    $summarycomplete = 0;
    $missing = [];
    foreach ($students as $participant) {
        $studentid = (int)($participant->studentid ?: $participant->userid);
        $name = (string)$participant->displayname;
        $user = $studentid > 0 ? core_user::get_user($studentid) : null;
        if ($user) {
            $name = fullname($user);
        }
        $att = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
        if ($att && (string)$att->attendance_status !== '') {
            $attendancecomplete++;
        } else {
            $missing[] = $name . ': attendance not marked';
        }
        $note = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
        if (pqlr_public_feedback_complete($note)) {
            $summarycomplete++;
        } else {
            $missing[] = $name . ': parent summary not ready';
        }
    }
    return [
        'active' => $active,
        'attendance' => $attendancecomplete,
        'summaries' => $summarycomplete,
        'complete' => $active > 0 && $attendancecomplete >= $active && $summarycomplete >= $active,
        'missing' => $missing,
    ];
}

function pqlr_redirect(int $sessionid, string $result): void {
    $consumercontext = pqh_requested_consumer_context();
    $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
    $params = ['sessionid' => $sessionid, 'result' => $result];
    if (!empty($consumercontext->consumerslug)) {
        $params['consumer'] = (string)$consumercontext->consumerslug;
    }
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    redirect(new moodle_url('/local/hubredirect/live_review.php', $params));
}

if (!pqlr_table_exists('local_prequran_live_session')
    || !pqlr_table_exists('local_prequran_live_participant')
    || !pqlr_table_exists('local_prequran_live_attendance')
    || !pqlr_table_exists('local_prequran_live_note')) {
    pqh_access_denied(
        'Live session review tables are not installed yet. Run the live review upgrade before using this page.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Live session review unavailable'
    );
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqh_access_denied(
        'Choose a valid live session before opening the review page.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Live session review unavailable'
    );
}
if ($requestedworkspaceid > 0
    && pqlr_column_exists('local_prequran_live_session', 'workspaceid')
    && (int)($session->workspaceid ?? 0) !== $requestedworkspaceid) {
    $actualworkspaceid = (int)($session->workspaceid ?? 0);
    pqh_access_denied(
        'This live session belongs to workspace #' . $actualworkspaceid . ', not workspace #' . $requestedworkspaceid . '. Choose a session from this workspace live-session list.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Workspace live review access required'
    );
}
if (!pqlr_is_teacher_or_admin($session)) {
    pqh_live_security_deny(
        'Only the assigned teacher or an administrator can review this live session.',
        'live_review_access_denied',
        'session',
        $sessionid,
        ['sessionid' => $sessionid, 'teacherid' => (int)$session->teacherid]
    );
}

$notice = '';
$homeworkfieldsready = pqlr_column_exists('local_prequran_live_note', 'homework_unitid');
$followupfieldsready = pqlr_column_exists('local_prequran_live_note', 'followup_status');
$students = $DB->get_records_sql(
    "SELECT *
       FROM {local_prequran_live_participant}
      WHERE sessionid = :sessionid
        AND role = :role
        AND status = :status
   ORDER BY displayname ASC, userid ASC",
    ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active']
);

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'cancel_session') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the live session review page and try cancelling again.',
            new moodle_url('/local/hubredirect/live_review.php', $urlparams),
            'Live session cancellation expired'
        );
    }
    $reason = pqlr_clean_text(optional_param('cancellation_reason', '', PARAM_RAW), 1000);
    $oldstatus = (string)$session->status;
    $session->status = 'cancelled';
    $session->cancelledby = (int)$USER->id;
    $session->cancellation_reason = $reason;
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);
    pqlr_audit($sessionid, 'session_cancelled', 'session', $sessionid, ['oldstatus' => $oldstatus, 'reason' => $reason]);
    pqlr_redirect($sessionid, 'cancelled');
}

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'reschedule_session') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the live session review page and try rescheduling again.',
            new moodle_url('/local/hubredirect/live_review.php', $urlparams),
            'Live session reschedule expired'
        );
    }
    if ((string)$session->status === 'cancelled') {
        pqh_access_denied(
            'Cancelled sessions cannot be rescheduled here.',
            new moodle_url('/local/hubredirect/live_review.php', $urlparams),
            'Live session reschedule unavailable'
        );
    }
    $date = optional_param('reschedule_date', '', PARAM_TEXT);
    $time = optional_param('reschedule_time', '', PARAM_TEXT);
    $duration = max(15, optional_param('reschedule_duration', 60, PARAM_INT));
    $tz = core_date::get_server_timezone();
    $start = trim($date) !== '' && trim($time) !== '' ? strtotime($date . ' ' . $time . ' ' . $tz) : false;
    if (!$start) {
        $notice = 'Enter a valid reschedule date and time.';
    } else {
        $oldstart = (int)$session->scheduled_start;
        $oldend = (int)$session->scheduled_end;
        $oldstatus = (string)$session->status;
        $session->scheduled_start = $start;
        $session->scheduled_end = $start + ($duration * MINSECS);
        $session->timezone = $tz;
        $session->status = 'scheduled';
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);
        pqlr_audit($sessionid, 'session_rescheduled', 'session', $sessionid, [
            'oldstart' => $oldstart,
            'oldend' => $oldend,
            'oldstatus' => $oldstatus,
            'newstart' => (int)$session->scheduled_start,
            'newend' => (int)$session->scheduled_end,
        ]);
        pqlr_redirect($sessionid, 'rescheduled');
    }
}

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'save_review') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the live session review page and try saving again.',
            new moodle_url('/local/hubredirect/live_review.php', $urlparams),
            'Live session review save expired'
        );
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
        $prefix = 'student_' . $studentid . '_';
        $attendance = optional_param($prefix . 'attendance_status', 'absent', PARAM_ALPHANUMEXT);
        if (!in_array($attendance, ['present', 'late', 'absent', 'excused', 'technical_issue'], true)) {
            $attendance = 'absent';
        }
        $participation = optional_param($prefix . 'participation_status', '', PARAM_TEXT);
        $technical = optional_param($prefix . 'technical_issue', 0, PARAM_BOOL);
        $attnotes = pqlr_clean_text(optional_param($prefix . 'attendance_notes', '', PARAM_RAW), 1000);

        $att = $DB->get_record('local_prequran_live_attendance', [
            'sessionid' => $sessionid,
            'studentid' => $studentid,
        ], '*', IGNORE_MISSING);
        if ($att) {
            if (pqlr_column_exists('local_prequran_live_attendance', 'workspaceid')) {
                $att->workspaceid = (int)($session->workspaceid ?? 0);
            }
            $att->userid = (int)$participant->userid;
            $att->attendance_status = $attendance;
            $att->participation_status = pqlr_clean_text($participation, 100);
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
                'participation_status' => pqlr_clean_text($participation, 100),
                'technical_issue' => $technical ? 1 : 0,
                'notes' => $attnotes,
                'markedby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqlr_column_exists('local_prequran_live_attendance', 'workspaceid')) {
                $attrecord->workspaceid = (int)($session->workspaceid ?? 0);
            }
            $DB->insert_record('local_prequran_live_attendance', $attrecord);
        }

        $visible = optional_param($prefix . 'visible_to_parent', 0, PARAM_BOOL);
        $note = $DB->get_record('local_prequran_live_note', [
            'sessionid' => $sessionid,
            'studentid' => $studentid,
        ], '*', IGNORE_MISSING);
        $wasvisible = $note ? !empty($note->visible_to_parent) : false;
        $oldhomework = $note ? trim((string)($note->homework ?? '') . ' ' . (string)($note->homework_unitid ?? '')) : '';
        $oldfollowupstatus = $note && isset($note->followup_status) ? (string)$note->followup_status : 'none';
        $oldfollowupresolved = $note && !empty($note->followup_resolved);
        $payload = [
            'strengths' => pqlr_clean_text(optional_param($prefix . 'strengths', '', PARAM_RAW)),
            'needs_practice' => pqlr_clean_text(optional_param($prefix . 'needs_practice', '', PARAM_RAW)),
            'homework' => pqlr_clean_text(optional_param($prefix . 'homework', '', PARAM_RAW)),
            'parent_summary' => pqlr_clean_text(optional_param($prefix . 'parent_summary', '', PARAM_RAW)),
            'private_note' => pqlr_clean_text(optional_param($prefix . 'private_note', '', PARAM_RAW)),
            'visible_to_parent' => $visible ? 1 : 0,
        ];
        if ((string)$payload['private_note'] !== '') {
            pqlr_audit($sessionid, 'private_teacher_note_saved', 'student', $studentid, [
                'private_note_length' => core_text::strlen((string)$payload['private_note']),
            ]);
        }
        if ($homeworkfieldsready) {
            $duedate = optional_param($prefix . 'homework_due_date', '', PARAM_TEXT);
            $duetime = $duedate !== '' ? strtotime($duedate . ' 23:59:59 ' . core_date::get_server_timezone()) : 0;
            $priority = optional_param($prefix . 'homework_priority', 'normal', PARAM_ALPHANUMEXT);
            if (!in_array($priority, ['low', 'normal', 'high'], true)) {
                $priority = 'normal';
            }
            $payload['homework_lessonid'] = pqlr_clean_text(optional_param($prefix . 'homework_lessonid', (string)$session->lessonid, PARAM_RAW), 100);
            $payload['homework_unitid'] = pqlr_clean_text(optional_param($prefix . 'homework_unitid', (string)$session->unitid, PARAM_RAW), 100);
            $payload['homework_due_date'] = $duetime ?: 0;
            $payload['homework_priority'] = $priority;
        }
        if ($followupfieldsready) {
            $followupstatus = optional_param($prefix . 'followup_status', 'none', PARAM_ALPHANUMEXT);
            if (!in_array($followupstatus, ['none', 'review_homework', 'parent_contact_requested', 'admin_support_requested'], true)) {
                $followupstatus = 'none';
            }
            $followupmessage = pqlr_clean_text(optional_param($prefix . 'followup_message', '', PARAM_RAW), 1500);
            $followupresolved = optional_param($prefix . 'followup_resolved', 0, PARAM_BOOL) ? 1 : 0;
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
            if (pqlr_column_exists('local_prequran_live_note', 'workspaceid')) {
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
            if (pqlr_column_exists('local_prequran_live_note', 'workspaceid')) {
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
            pqlr_audit($sessionid, 'homework_published', 'student', $studentid, [
                'unitid' => (string)($payload['homework_unitid'] ?? ''),
                'priority' => (string)($payload['homework_priority'] ?? 'normal'),
            ]);
        }
        if ($followupfieldsready) {
            $newfollowupstatus = (string)$payload['followup_status'];
            if ($newfollowupstatus !== 'none' && $newfollowupstatus !== $oldfollowupstatus) {
                $action = $newfollowupstatus === 'admin_support_requested' ? 'admin_followup_requested' : 'parent_followup_requested';
                pqlr_audit($sessionid, $action, 'student', $studentid, [
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
                pqlr_audit($sessionid, 'followup_resolved', 'student', $studentid, [
                    'status' => $newfollowupstatus,
                ]);
            }
        }
    }
    $markcompleted = optional_param('mark_completed', 0, PARAM_BOOL);
    $oldstatus = (string)$session->status;
    $completion = pqlr_completion_state($sessionid, $students);
    if ($markcompleted && !empty($completion['complete'])) {
        $session->status = 'completed';
    } else if ($markcompleted) {
        $session->status = $oldstatus === 'completed' ? 'completed' : 'awaiting_review';
    } else if ((int)$session->scheduled_end < $now && !in_array($oldstatus, ['completed', 'cancelled'], true)) {
        $session->status = 'awaiting_review';
    }
    $session->timemodified = $now;
    $DB->update_record('local_prequran_live_session', $session);
    pqlr_audit($sessionid, 'review_saved', 'session', $sessionid, [
        'students' => count($students),
        'status' => (string)$session->status,
        'complete' => !empty($completion['complete']),
    ]);
    if ($markcompleted && !empty($completion['complete']) && $oldstatus !== 'completed') {
        pqlr_audit($sessionid, 'session_completed', 'session', $sessionid, $completion);
    } else if ($markcompleted && empty($completion['complete'])) {
        pqlr_audit($sessionid, 'session_completion_blocked', 'session', $sessionid, $completion);
    }
    foreach (array_unique($summarynotifications) as $studentid) {
        $summaryurlparams = array_merge($workspaceurlparams, ['childid' => (int)$studentid]);
        local_prequran_notify_parent_live_update(
            $sessionid,
            (int)$studentid,
            'Live class summary is ready',
            'A teacher summary from your child\'s ' . $brandname . ' live class is ready to review.',
            new moodle_url('/local/hubredirect/live_summaries.php', $summaryurlparams),
            'View live summary',
            'live_summary_published'
        );
    }
    foreach ($homeworknotifications as $studentid => $homework) {
        $summaryurlparams = array_merge($workspaceurlparams, ['childid' => (int)$studentid]);
        local_prequran_notify_parent_live_update(
            $sessionid,
            (int)$studentid,
            'Live class homework is ready',
            'Homework from your child\'s ' . $brandname . ' live class is ready to review.',
            new moodle_url('/local/hubredirect/live_summaries.php', $summaryurlparams),
            'View homework',
            'live_homework_published'
        );
    }
    foreach ($followupnotifications as $studentid => $followup) {
        $summaryurlparams = array_merge($workspaceurlparams, ['childid' => (int)$studentid]);
        local_prequran_notify_parent_live_update(
            $sessionid,
            (int)$studentid,
            'Live class follow-up requested',
            'A teacher follow-up from your child\'s ' . $brandname . ' live class is ready to review.',
            new moodle_url('/local/hubredirect/live_summaries.php', $summaryurlparams),
            'View follow-up',
            'live_followup_requested'
        );
    }
    pqlr_redirect($sessionid, $markcompleted && !empty($completion['complete']) ? 'completed' : ($markcompleted ? 'awaiting_review' : 'saved'));
}

$result = optional_param('result', '', PARAM_ALPHANUMEXT);
if ($result === 'completed') {
    $notice = 'Session completed. Attendance and parent-visible feedback are ready.';
} else if ($result === 'needs_review' || $result === 'awaiting_review') {
    $notice = 'Saved, but completion is blocked until every student has attendance and parent-visible feedback.';
} else if ($result === 'cancelled') {
    $notice = 'Session cancelled and audit history updated.';
} else if ($result === 'rescheduled') {
    $notice = 'Session rescheduled and returned to scheduled status.';
} else if ($result === 'saved' || optional_param('saved', 0, PARAM_BOOL)) {
    $notice = 'Attendance and notes saved.';
}

$attendancebyuser = [];
foreach ($DB->get_records('local_prequran_live_attendance', ['sessionid' => $sessionid]) as $row) {
    $attendancebyuser[(int)$row->studentid] = $row;
}

$notesbyuser = [];
foreach ($DB->get_records('local_prequran_live_note', ['sessionid' => $sessionid]) as $row) {
    $notesbyuser[(int)$row->studentid] = $row;
}

$teacher = core_user::get_user((int)$session->teacherid);
$completionstate = pqlr_completion_state($sessionid, $students);
$cancomplete = !empty($completionstate['complete']);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-review-page header,
body.pqh-live-review-page footer,
body.pqh-live-review-page nav.navbar,
body.pqh-live-review-page #page-header,
body.pqh-live-review-page #page-footer,
body.pqh-live-review-page .drawer,
body.pqh-live-review-page .drawer-toggles,
body.pqh-live-review-page .block-region,
body.pqh-live-review-page [data-region="drawer"],
body.pqh-live-review-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-review-page #page,
body.pqh-live-review-page #page-content,
body.pqh-live-review-page #region-main,
body.pqh-live-review-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlr-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlr-wrap{max-width:1180px;margin:0 auto}
.pqlr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlr-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlr-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}
.pqlr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlr-btn--brown{background:#6f4e32}
.pqlr-alert{margin-bottom:14px;padding:12px 14px;border-radius:8px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-size:14px;font-weight:850}
.pqlr-card{margin-bottom:14px;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlr-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}
.pqlr-card h2{margin:0;font-size:20px;font-weight:950}
.pqlr-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlr-grid{display:grid;grid-template-columns:220px 1fr 1fr;gap:12px}
.pqlr-field{display:grid;gap:6px;margin-bottom:12px}
.pqlr-field label{font-size:13px;font-weight:900;color:#415665}
.pqlr-input,.pqlr-select,.pqlr-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.3 system-ui;background:#fff;color:#173044}
.pqlr-select{min-height:40px}
.pqlr-textarea{min-height:92px;resize:vertical}
.pqlr-check{display:flex;gap:9px;align-items:center;font-size:13px;font-weight:850;color:#415665}
.pqlr-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlr-pill--ok{background:#edf9ef;color:#245c35}
.pqlr-pill--warn{background:#fff7e6;color:#7b5419}
.pqlr-pill--bad{background:#fff0ed;color:#883526}
.pqlr-followup{margin-top:10px;padding:12px;border:1px solid rgba(111,78,50,.16);border-radius:10px;background:#fffaf1}
.pqlr-followup h3{margin:0 0 10px;font-size:15px;font-weight:950;color:#6f4e32}
.pqlr-lifecycle{margin-bottom:14px;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlr-lifecycle__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.pqlr-lifecycle h2{margin:0;font-size:20px;font-weight:950}
.pqlr-checklist{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}
.pqlr-checkitem{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#f8fafc}
.pqlr-checkitem strong{display:block;font-size:18px;color:#6f4e32}
.pqlr-checkitem span{display:block;margin-top:2px;color:#5e7280;font-size:12px;font-weight:850}
.pqlr-lifecycle__forms{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pqlr-inline{display:grid;grid-template-columns:1fr 110px 120px auto;gap:8px;align-items:end}
.pqlr-danger{padding-top:12px;border-top:1px solid rgba(136,53,38,.16)}
.pqlr-btn--danger{background:#883526}
.pqlr-missing{margin:0 0 12px;padding-left:18px;color:#7b5419;font-size:13px;font-weight:800}
.pqlr-footer{position:sticky;bottom:0;margin-top:16px;padding:14px;background:rgba(245,248,251,.92);backdrop-filter:blur(8px);border-top:1px solid rgba(23,48,68,.1)}
@media(max-width:980px){.pqlr-grid,.pqlr-checklist,.pqlr-lifecycle__forms,.pqlr-inline{grid-template-columns:1fr}.pqlr-top{display:block}.pqlr-actions{margin-top:12px}.pqlr-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlr-shell">
  <div class="pqlr-wrap">
    <section class="pqlr-top pqh-workspace-top">
      <div>
        <h1 class="pqlr-title pqh-workspace-title">Live Session Review</h1>
        <p class="pqlr-sub pqh-workspace-sub"><?php echo s($session->title); ?> - <?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
        <p class="pqlr-sub pqh-workspace-sub">Target: <?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /') ?: 'not set'); ?></p>
      </div>
      <div class="pqlr-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlr-btn pqlr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_monitor.php', $urlparams))->out(false); ?>">Lesson monitor</a>
        <?php if (pqh_can_manage_academy_operations((int)$USER->id)): ?><a class="pqlr-btn pqlr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', $urlparams))->out(false); ?>">Quality review</a><?php endif; ?>
        <a class="pqlr-btn pqlr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams))->out(false); ?>">Live sessions</a>
        <?php
          $dashboardpath = !empty($workspaceurlparams['workspaceid']) ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php';
        ?>
        <a class="pqlr-btn pqlr-btn--light" href="<?php echo (new moodle_url($dashboardpath, $workspaceurlparams))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($notice !== ''): ?><div class="pqlr-alert"><?php echo s($notice); ?></div><?php endif; ?>

    <section class="pqlr-lifecycle" aria-label="Session completion workflow">
      <div class="pqlr-lifecycle__head">
        <div>
          <h2>Completion Workflow</h2>
          <p class="pqlr-meta">Complete the session only after attendance and parent-visible feedback are ready for every active student.</p>
        </div>
        <?php
          $statusclass = (string)$session->status === 'completed' ? 'pqlr-pill--ok' : ((string)$session->status === 'cancelled' ? 'pqlr-pill--bad' : (!$cancomplete ? 'pqlr-pill--warn' : ''));
        ?>
        <span class="pqlr-pill <?php echo s($statusclass); ?>"><?php echo s(str_replace('_', ' ', (string)$session->status)); ?></span>
      </div>
      <div class="pqlr-checklist">
        <div class="pqlr-checkitem"><strong><?php echo (int)$completionstate['active']; ?></strong><span>active students</span></div>
        <div class="pqlr-checkitem"><strong><?php echo (int)$completionstate['attendance']; ?>/<?php echo (int)$completionstate['active']; ?></strong><span>attendance marked</span></div>
        <div class="pqlr-checkitem"><strong><?php echo (int)$completionstate['summaries']; ?>/<?php echo (int)$completionstate['active']; ?></strong><span>parent summaries ready</span></div>
      </div>
      <?php if (!$cancomplete && !empty($completionstate['missing'])): ?>
        <ul class="pqlr-missing">
          <?php foreach (array_slice($completionstate['missing'], 0, 8) as $missing): ?>
            <li><?php echo s($missing); ?></li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>

      <div class="pqlr-lifecycle__forms">
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="reschedule_session">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <div class="pqlr-inline">
            <div class="pqlr-field">
              <label for="reschedule_date">New Date</label>
              <input class="pqlr-input" id="reschedule_date" type="date" name="reschedule_date" value="<?php echo s(date('Y-m-d', (int)$session->scheduled_start)); ?>">
            </div>
            <div class="pqlr-field">
              <label for="reschedule_time">Time</label>
              <input class="pqlr-input" id="reschedule_time" type="time" name="reschedule_time" value="<?php echo s(date('H:i', (int)$session->scheduled_start)); ?>">
            </div>
            <div class="pqlr-field">
              <label for="reschedule_duration">Minutes</label>
              <input class="pqlr-input" id="reschedule_duration" type="number" min="15" step="15" name="reschedule_duration" value="<?php echo (int)max(15, ceil(((int)$session->scheduled_end - (int)$session->scheduled_start) / 60)); ?>">
            </div>
            <button class="pqlr-btn pqlr-btn--light" type="submit">Reschedule</button>
          </div>
        </form>

        <form class="pqlr-danger" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="cancel_session">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <div class="pqlr-field">
            <label for="cancellation_reason">Cancellation Reason</label>
            <input class="pqlr-input" id="cancellation_reason" name="cancellation_reason" value="<?php echo s((string)($session->cancellation_reason ?? '')); ?>" placeholder="Reason shown in audit history">
          </div>
          <button class="pqlr-btn pqlr-btn--danger" type="submit">Cancel session</button>
        </form>
      </div>
    </section>

    <form method="post">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <input type="hidden" name="action" value="save_review">
      <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
      <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>

      <?php foreach ($students as $participant): ?>
        <?php
          $studentid = (int)($participant->studentid ?: $participant->userid);
          $student = core_user::get_user($studentid);
          $name = $student ? fullname($student) : (string)$participant->displayname;
          $att = $attendancebyuser[$studentid] ?? null;
          $note = $notesbyuser[$studentid] ?? null;
          $prefix = 'student_' . $studentid . '_';
        ?>
        <article class="pqlr-card">
          <div class="pqlr-card__head">
            <div>
              <h2><?php echo s($name); ?></h2>
              <p class="pqlr-meta">Student #<?php echo $studentid; ?><?php echo $att && !empty($att->join_time) ? ' - Joined ' . userdate((int)$att->join_time, get_string('strftimedatetimeshort')) : ''; ?></p>
            </div>
            <span class="pqlr-pill"><?php echo s($att ? (string)$att->attendance_status : 'not marked'); ?></span>
          </div>

          <div class="pqlr-grid">
            <div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>attendance_status">Attendance</label>
                <select class="pqlr-select" id="<?php echo s($prefix); ?>attendance_status" name="<?php echo s($prefix); ?>attendance_status">
                  <?php foreach (['present' => 'Present', 'late' => 'Late', 'absent' => 'Absent', 'excused' => 'Excused', 'technical_issue' => 'Technical issue'] as $value => $label): ?>
                    <option value="<?php echo s($value); ?>" <?php echo $att && (string)$att->attendance_status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>participation_status">Participation</label>
                <input class="pqlr-input" id="<?php echo s($prefix); ?>participation_status" name="<?php echo s($prefix); ?>participation_status" value="<?php echo s($att ? (string)$att->participation_status : ''); ?>" placeholder="joined, read aloud, observed">
              </div>
              <label class="pqlr-check">
                <input type="checkbox" name="<?php echo s($prefix); ?>technical_issue" value="1" <?php echo $att && !empty($att->technical_issue) ? 'checked' : ''; ?>>
                <span>Technical issue</span>
              </label>
              <label class="pqlr-check" style="margin-top:10px">
                <input type="checkbox" name="<?php echo s($prefix); ?>visible_to_parent" value="1" <?php echo !$note || !empty($note->visible_to_parent) ? 'checked' : ''; ?>>
                <span>Parent summary visible</span>
              </label>
            </div>

            <div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>strengths">Strengths</label>
                <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>strengths" name="<?php echo s($prefix); ?>strengths"><?php echo s($note ? (string)$note->strengths : ''); ?></textarea>
              </div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>needs_practice">Needs Practice</label>
                <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>needs_practice" name="<?php echo s($prefix); ?>needs_practice"><?php echo s($note ? (string)$note->needs_practice : ''); ?></textarea>
              </div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>homework">Homework</label>
                <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>homework" name="<?php echo s($prefix); ?>homework"><?php echo s($note ? (string)$note->homework : ''); ?></textarea>
              </div>
              <?php if ($homeworkfieldsready): ?>
                <div class="pqlr-field">
                  <label for="<?php echo s($prefix); ?>homework_unitid">Homework Unit</label>
                  <input class="pqlr-input" id="<?php echo s($prefix); ?>homework_unitid" name="<?php echo s($prefix); ?>homework_unitid" value="<?php echo s($note && isset($note->homework_unitid) && (string)$note->homework_unitid !== '' ? (string)$note->homework_unitid : (string)$session->unitid); ?>" placeholder="alphabet_listen">
                  <input type="hidden" name="<?php echo s($prefix); ?>homework_lessonid" value="<?php echo s($note && isset($note->homework_lessonid) && (string)$note->homework_lessonid !== '' ? (string)$note->homework_lessonid : (string)$session->lessonid); ?>">
                </div>
                <div class="pqlr-field">
                  <label for="<?php echo s($prefix); ?>homework_due_date">Homework Due Date</label>
                  <input class="pqlr-input" id="<?php echo s($prefix); ?>homework_due_date" name="<?php echo s($prefix); ?>homework_due_date" type="date" value="<?php echo $note && !empty($note->homework_due_date) ? s(date('Y-m-d', (int)$note->homework_due_date)) : ''; ?>">
                </div>
                <div class="pqlr-field">
                  <label for="<?php echo s($prefix); ?>homework_priority">Priority</label>
                  <select class="pqlr-select" id="<?php echo s($prefix); ?>homework_priority" name="<?php echo s($prefix); ?>homework_priority">
                    <?php $priority = $note && isset($note->homework_priority) ? (string)$note->homework_priority : 'normal'; ?>
                    <?php foreach (['low' => 'Low', 'normal' => 'Normal', 'high' => 'High'] as $value => $label): ?>
                      <option value="<?php echo s($value); ?>" <?php echo $priority === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                    <?php endforeach; ?>
                  </select>
                </div>
              <?php endif; ?>
            </div>

            <div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>parent_summary">Parent Summary</label>
                <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>parent_summary" name="<?php echo s($prefix); ?>parent_summary"><?php echo s($note ? (string)$note->parent_summary : ''); ?></textarea>
              </div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>private_note">Private Teacher Note (not visible to parents)</label>
                <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>private_note" name="<?php echo s($prefix); ?>private_note"><?php echo s($note ? (string)$note->private_note : ''); ?></textarea>
              </div>
              <div class="pqlr-field">
                <label for="<?php echo s($prefix); ?>attendance_notes">Attendance Notes</label>
                <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>attendance_notes" name="<?php echo s($prefix); ?>attendance_notes"><?php echo s($att ? (string)$att->notes : ''); ?></textarea>
              </div>
              <?php if ($followupfieldsready): ?>
                <?php
                  $followupstatus = $note && isset($note->followup_status) ? (string)$note->followup_status : 'none';
                ?>
                <div class="pqlr-followup">
                  <h3>Parent Follow-Up</h3>
                  <div class="pqlr-field">
                    <label for="<?php echo s($prefix); ?>followup_status">Follow-up Status</label>
                    <select class="pqlr-select" id="<?php echo s($prefix); ?>followup_status" name="<?php echo s($prefix); ?>followup_status">
                      <?php foreach (['none' => 'No follow-up', 'review_homework' => 'Review homework', 'parent_contact_requested' => 'Parent contact requested', 'admin_support_requested' => 'Admin support requested'] as $value => $label): ?>
                        <option value="<?php echo s($value); ?>" <?php echo $followupstatus === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                      <?php endforeach; ?>
                    </select>
                  </div>
                  <div class="pqlr-field">
                    <label for="<?php echo s($prefix); ?>followup_message">Parent-Safe Follow-Up Message</label>
                    <textarea class="pqlr-textarea" id="<?php echo s($prefix); ?>followup_message" name="<?php echo s($prefix); ?>followup_message"><?php echo s($note && isset($note->followup_message) ? (string)$note->followup_message : ''); ?></textarea>
                  </div>
                  <label class="pqlr-check">
                    <input type="checkbox" name="<?php echo s($prefix); ?>followup_resolved" value="1" <?php echo $note && !empty($note->followup_resolved) ? 'checked' : ''; ?>>
                    <span>Follow-up resolved</span>
                  </label>
                </div>
              <?php endif; ?>
            </div>
          </div>
        </article>
      <?php endforeach; ?>

      <?php if (!$students): ?>
        <article class="pqlr-card">No active students are assigned to this session.</article>
      <?php endif; ?>

      <div class="pqlr-footer">
        <label class="pqlr-check" style="margin-bottom:12px">
          <input type="checkbox" name="mark_completed" value="1" <?php echo (string)$session->status === 'completed' ? 'checked' : ''; ?>>
          <span>Mark session completed</span>
        </label>
        <button class="pqlr-btn pqlr-btn--brown" type="submit">Save attendance and notes</button>
      </div>
    </form>
  </div>
</main>
<?php
echo $OUTPUT->footer();
