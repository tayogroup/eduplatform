<?php
// ---- report: live-followup-message (compose + send a live follow-up message) ----
// Ported from local_hubredirect/live_followup_message.php via
// live_followup_message_portallib (pqlfm_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. Deep-linked from the migrated live-followups
// queue ("Message" button) with ?sessionid=&studentid= passthrough.
// GET  = the compose context (session + student + note + composed body preview,
//        names) once the same access gates the page enforces pass.
// POST = do=send_followup_message — the page's single write, VERBATIM (find/
//        create the parent_teacher thread, insert the template message = the
//        legacy "send", upsert participants, stamp the note, comm + live audit).
//        confirm_sesskey dropped: token auth replaces the session key; the final
//        redirect(...) to communications.php becomes an ok:true JSON.
// (live_followup_message.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_followup_message_portallib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$body = [];
if ($method === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body) || (string)($body['do'] ?? '') !== 'send_followup_message') {
        pqpd_fail(400, 'Unknown live-followup-message action.');
    }
}

// confirm_sesskey() dropped: the launch token replaces the session key.
$sessionid = $method === 'POST' ? (int)($body['sessionid'] ?? 0) : optional_param('sessionid', 0, PARAM_INT);
$studentid = $method === 'POST' ? (int)($body['studentid'] ?? 0) : optional_param('studentid', 0, PARAM_INT);

$consumercontext = pqh_requested_consumer_context();
$workspaceid = $method === 'POST' ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}

// -- access gates: exact tests + denial messages from the page (pqh_access_denied
//    becomes pqpd_fail(403, <same message>)); they run before both GET and POST --
if ($sessionid <= 0 || $studentid <= 0) {
    pqpd_fail(403, 'Choose a valid live session and student before opening follow-up messaging.');
}

foreach (['local_prequran_live_session', 'local_prequran_live_note', 'local_prequran_comm_thread', 'local_prequran_comm_participant', 'local_prequran_comm_message', 'local_prequran_comm_audit'] as $table) {
    if (!pqlfm_table_exists($table)) {
        pqpd_fail(403, 'Required live follow-up or communication tables are not installed.');
    }
}
if (!pqlfm_column_exists('local_prequran_live_note', 'followup_threadid')) {
    pqpd_fail(403, 'Run the follow-up messaging database upgrade before opening live follow-up threads.');
}

$session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
if (!$session) {
    pqpd_fail(403, 'Choose a valid live session before opening follow-up messaging.');
}
if (!pqh_record_belongs_to_consumer_context($session)) {
    pqpd_fail(403, 'This live session does not belong to the active consumer.');
}
if ($workspaceid > 0
        && pqlfm_column_exists('local_prequran_live_session', 'workspaceid')
        && (int)($session->workspaceid ?? 0) !== $workspaceid) {
    pqpd_fail(403, 'This live follow-up is not scoped to the selected workspace.');
}
$note = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
if (!$note) {
    pqpd_fail(403, 'No follow-up note was found for this student in the selected live session.');
}
if (!pqlfm_user_can_link($session, $studentid)) {
    pqpd_fail(403, 'You cannot open this live follow-up message thread.');
}

$guardianids = pqlfm_guardian_ids($studentid);
if (pqlfm_is_guardian((int)$USER->id, $studentid)) {
    $guardianids = [(int)$USER->id];
}
if (!$guardianids) {
    pqpd_fail(403, 'No linked parent or guardian was found for this student.');
}

$cohortid = pqlfm_student_cohort($studentid, (int)$session->teacherid);
$student = core_user::get_user($studentid);
$studentname = $student ? fullname($student) : 'Student ' . $studentid;
$teacherid = (int)$session->teacherid;
$brandname = pqlfm_clean((string)($consumercontext->consumername ?? 'EduPlatform'), 120);
$brandname = $brandname !== '' ? $brandname : 'EduPlatform';

// -- GET: compose context (the page renders this state before the write) --------
if ($method !== 'POST') {
    $nameids = [$teacherid, $studentid];
    foreach ($guardianids as $gid) {
        $nameids[] = (int)$gid;
    }
    echo json_encode([
        'ok' => true, 'ready' => true,
        'sessionid' => $sessionid,
        'studentid' => $studentid,
        'workspaceid' => $workspaceid,
        'student' => ['id' => $studentid, 'name' => $studentname],
        'session' => [
            'id' => $sessionid,
            'title' => (string)$session->title,
            'scheduled_start' => (int)$session->scheduled_start,
            'teacherid' => $teacherid,
        ],
        'note' => [
            'followup_status' => (string)($note->followup_status ?? 'none'),
            'followup_message' => (string)($note->followup_message ?? ''),
            'homework' => (string)($note->homework ?? ''),
            'homework_unitid' => (string)($note->homework_unitid ?? ''),
            'threadid' => (int)($note->followup_threadid ?? 0),
        ],
        'guardians' => array_values(array_map('intval', $guardianids)),
        'brandname' => $brandname,
        'preview_body' => pqlfm_followup_body($session, $note, $studentid, $studentname, $brandname),
        'names' => pqpd_names($nameids),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- POST do=send_followup_message: the page's write, VERBATIM -------------------
$now = time();
$threadid = (int)($note->followup_threadid ?? 0);
$thread = $threadid > 0 ? $DB->get_record('local_prequran_comm_thread', ['id' => $threadid], '*', IGNORE_MISSING) : null;
$created = false;
$linkedmessage = false;

$transaction = $DB->start_delegated_transaction();

if (!$thread) {
    $threadid = pqlfm_find_existing_thread($cohortid, $studentid, $teacherid, $guardianids);
    $thread = $threadid > 0 ? $DB->get_record('local_prequran_comm_thread', ['id' => $threadid], '*', IGNORE_MISSING) : null;
}

if (!$thread) {
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => 'parent_teacher',
        'cohortid' => $cohortid,
        'studentid' => $studentid,
        'createdby' => (int)$USER->id,
        'status' => 'active',
        'subject' => pqlfm_clean('Live follow-up: ' . (string)$session->title, 255),
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $created = true;
}

$body = pqlfm_followup_body($session, $note, $studentid, $studentname, $brandname);
$messageid = 0;
if ($created || empty($note->followup_threadid)) {
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid,
        'senderid' => (int)$USER->id,
        'studentid' => $studentid,
        'messagekind' => 'template',
        'body' => $body,
        'templatekey' => 'live_followup_link',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $linkedmessage = true;
    $thread = $DB->get_record('local_prequran_comm_thread', ['id' => $threadid], '*', IGNORE_MISSING);
    if (!$thread) {
        pqpd_fail(403, 'The follow-up message thread could not be reopened after it was created.');
    }
    $thread->lastmessageat = $now;
    $thread->timemodified = $now;
    $DB->update_record('local_prequran_comm_thread', $thread);
}

pqlfm_upsert_participant($threadid, $teacherid, 'teacher', (int)$USER->id === $teacherid ? $messageid : 0);
foreach ($guardianids as $guardianid) {
    pqlfm_upsert_participant($threadid, (int)$guardianid, 'parent', (int)$USER->id === (int)$guardianid ? $messageid : 0);
}
if (is_siteadmin($USER)) {
    pqlfm_upsert_participant($threadid, (int)$USER->id, 'admin', $messageid);
}

$note->followup_threadid = $threadid;
$note->followup_contactedat = $now;
$note->timemodified = $now;
$DB->update_record('local_prequran_live_note', $note);

$DB->insert_record('local_prequran_comm_audit', (object)[
    'threadid' => $threadid,
    'messageid' => $messageid,
    'actorid' => (int)$USER->id,
    'action' => 'live_followup_linked',
    'details' => json_encode([
        'sessionid' => $sessionid,
        'studentid' => $studentid,
        'created' => $created,
        'messageadded' => $linkedmessage,
    ]),
    'timecreated' => $now,
]);
pqlfm_audit_live($sessionid, 'followup_message_thread_linked', $studentid, [
    'threadid' => $threadid,
    'messageid' => $messageid,
    'cohortid' => $cohortid,
]);

$transaction->allow_commit();

// The page redirect(...) to communications.php becomes an ok:true JSON; the same
// deep-link params travel back so the client can open the thread via
// portal_launch.php?report=communications&…
echo json_encode([
    'ok' => true,
    'result' => 'saved',
    'message' => 'Follow-up message sent.',
    'threadid' => $threadid,
    'messageid' => $messageid,
    'cohortid' => $cohortid,
    'studentid' => $studentid,
    'created' => $created,
    'messageadded' => $linkedmessage,
], JSON_UNESCAPED_SLASHES);
exit;
