<?php
// Portal handler: report=communications — token-gated JSON port of the direct
// parent/teacher messaging views in local_hubredirect/communications.php
// (which stays live in parallel). Required from portal_data.php AFTER token
// verification: $claims is validated, global $USER is the token's user, the
// JSON exception handler is installed, and Content-Type/CORS headers are sent.
//
//   GET  ?report=communications&token=…[&workspaceid=][&threadid=0]  -> thread list
//   GET  ?report=communications&token=…[&workspaceid=]&threadid=N    -> messages
//   POST ?report=communications&token=…  body {"do":"reply","threadid":N,"replybody":"…"}
//
// Access logic replicated from the page: require_login is replaced by the
// token; the page-level "communications ready" WS-token gate is enforced the
// same way; per-thread read/reply rights come verbatim from
// pqcomml_direct_can_read / pqcomml_direct_can_reply (communications_portallib).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/communications_portallib.php');
require_once($CFG->libdir . '/externallib.php');

$userid = (int)$claims['sub'];

// Page gate (verbatim semantics): with no WS token the legacy page renders the
// "not ready" notice and nothing else — not even the direct thread views.
$wstoken = pqcomml_current_user_ws_token((string)get_config('local_prequran', 'ws_token'));
if ($wstoken === '') {
    pqpd_fail(403, 'Communications are not ready for this account. Please check that this parent, student, or teacher has a linked communication relationship.');
}

// Workspace resolution, verbatim from the page preamble.
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);

// ---- writes -----------------------------------------------------------------
// The page has exactly one write: comm_action=reply on a thread view. Ported
// verbatim (same guards, same field assignments, same audit insert); token auth
// replaces confirm_sesskey, and the redirect(...) becomes a JSON ok.

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    if (!in_array($do, ['reply', 'compose', 'close_thread', 'oversight_view'], true)) {
        pqpd_fail(400, 'Unknown communications action.');
    }
    if (!pqcomml_direct_tables_ready()) {
        pqpd_fail(503, 'Communication tables are not ready yet.');
    }
    $myrole = pqcomml_comm_role((int)$USER->id, $workspaceid);

    // ---- do: compose (Canvas Inbox compose — role-aware recipients) ----------
    if ($do === 'compose') {
        if ($myrole === '') {
            pqpd_fail(403, 'Your account has no messaging role in this workspace.');
        }
        $recipients = array_map('strval', array_values((array)($body['recipients'] ?? [])));
        $subject = trim(clean_param((string)($body['subject'] ?? ''), PARAM_TEXT));
        $messagetext = pqcomml_direct_clean_body((string)($body['messagebody'] ?? ''));
        if ($messagetext === '') {
            pqpd_fail(400, 'Type a message first.');
        }
        if (in_array($myrole, ['parent', 'student'], true)) {
            $messagetext = pqcomml_filter_contact_details($messagetext);
            if ($messagetext === '') {
                pqpd_fail(400, 'Your message contained only links or contact details, which are removed on this channel. Please describe your question in words.');
            }
        }
        try {
            $newthreadid = pqcomml_compose_thread($workspaceid, (int)$USER->id, $myrole, $recipients, $subject, $messagetext);
        } catch (Throwable $composeerror) {
            pqpd_fail(400, $composeerror->getMessage());
        }
        echo json_encode(['ok' => true, 'message' => 'Message sent — recipients have been notified.', 'threadid' => $newthreadid], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: close_thread ----------------------------------------------------
    if ($do === 'close_thread') {
        $closethread = $DB->get_record('local_prequran_comm_thread', ['id' => (int)($body['threadid'] ?? 0)], '*', IGNORE_MISSING);
        if (!$closethread || !pqcomml_direct_can_read($closethread, (int)$USER->id, $workspaceid)) {
            pqpd_fail(403, 'You cannot manage this communication thread.');
        }
        try {
            pqcomml_close_thread($closethread, (int)$USER->id, $myrole);
        } catch (Throwable $closeerror) {
            pqpd_fail(403, $closeerror->getMessage());
        }
        echo json_encode(['ok' => true, 'message' => 'Thread closed and archived.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: oversight_view (audited safeguarding access to ANY thread) ------
    if ($do === 'oversight_view') {
        if (!pqcomml_oversight_allowed((int)$USER->id)) {
            pqpd_fail(403, 'Oversight access requires academy operations rights.');
        }
        $othread = $DB->get_record('local_prequran_comm_thread', ['id' => (int)($body['threadid'] ?? 0)], '*', IGNORE_MISSING);
        if (!$othread) {
            pqpd_fail(400, 'Choose a valid thread.');
        }
        $now = time();
        if (pqcomml_table_exists('local_prequran_comm_audit')) {
            $DB->insert_record('local_prequran_comm_audit', (object)[
                'threadid' => (int)$othread->id, 'messageid' => 0, 'actorid' => (int)$USER->id,
                'action' => 'oversight_viewed',
                'details' => json_encode(['type' => (string)$othread->type, 'reason' => trim(clean_param((string)($body['reason'] ?? ''), PARAM_TEXT))], JSON_UNESCAPED_SLASHES),
                'timecreated' => $now,
            ]);
        }
        if (function_exists('pqh_live_security_audit')) {
            pqh_live_security_audit(0, 'comm_oversight_viewed', 'comm_thread', (int)$othread->id,
                ['type' => (string)$othread->type]);
        }
        $omessages = array_values($DB->get_records('local_prequran_comm_message',
            ['threadid' => (int)$othread->id, 'status' => 'visible'], 'timecreated ASC, id ASC', '*', 0, 200));
        $orows = [];
        foreach ($omessages as $m) {
            $orows[] = [
                'sendername' => pqcomml_direct_user_name((int)$m->senderid),
                'body' => (string)$m->body,
                'timecreated' => (int)$m->timecreated,
            ];
        }
        echo json_encode([
            'ok' => true,
            'oversight' => true,
            'subject' => (string)$othread->subject,
            'type' => (string)$othread->type,
            'messages' => $orows,
            'notice' => 'This oversight access has been logged in the communication audit trail.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    $threadid = (int)($body['threadid'] ?? 0);
    if ($threadid <= 0) {
        pqpd_fail(400, 'Choose a message thread before sending a reply.');
    }
    $directthread = $DB->get_record('local_prequran_comm_thread', ['id' => $threadid], '*', IGNORE_MISSING);
    if (!$directthread || !pqcomml_direct_can_read($directthread, (int)$USER->id, $workspaceid)) {
        pqpd_fail(403, 'You cannot read this communication thread.');
    }
    if (!pqcomml_direct_can_reply($directthread, (int)$USER->id)) {
        pqpd_fail(403, 'You cannot reply to this communication thread.');
    }
    $replybody = pqcomml_direct_clean_body((string)($body['replybody'] ?? ''));
    // Contact-exchange filter for parent/student-authored bodies (the student
    // support channel always had this; the parent↔teacher channel did not).
    if (in_array($myrole, ['parent', 'student'], true)) {
        $replybody = pqcomml_filter_contact_details($replybody);
    }
    if ($replybody === '') {
        pqpd_fail(400, 'Type a message first.');
    }
    $now = time();
    $transaction = $DB->start_delegated_transaction();
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => (int)$directthread->id,
        'senderid' => (int)$USER->id,
        'studentid' => empty($directthread->studentid) ? null : (int)$directthread->studentid,
        'messagekind' => 'text',
        'body' => $replybody,
        'templatekey' => '',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $directthread->lastmessageat = $now;
    $directthread->timemodified = $now;
    $DB->update_record('local_prequran_comm_thread', $directthread);
    $participant = $DB->get_record('local_prequran_comm_participant', [
        'threadid' => (int)$directthread->id,
        'userid' => (int)$USER->id,
    ]);
    if ($participant) {
        $participant->lastreadmessageid = $messageid;
        $participant->timemodified = $now;
        $DB->update_record('local_prequran_comm_participant', $participant);
    }
    if (pqcomml_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => (int)$directthread->id,
            'messageid' => $messageid,
            'actorid' => (int)$USER->id,
            'action' => 'created',
            'details' => json_encode(['type' => (string)$directthread->type, 'reply' => true, 'source' => 'communications_direct', 'via' => 'portal']),
            'timecreated' => $now,
        ]);
    }
    $transaction->allow_commit();
    // Canvas behaviour: every conversation message NOTIFIES the counterpart
    // (replies were previously silent — the other party never knew).
    pqcomml_notify_thread_participants($directthread, (int)$USER->id, $replybody);
    echo json_encode([
        'ok' => true,
        'message' => 'Message sent — the other participants have been notified.',
        'threadid' => (int)$directthread->id,
        'messageid' => $messageid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- reads ------------------------------------------------------------------

if (!pqcomml_direct_tables_ready()) {
    pqpd_fail(503, 'Communication tables are not ready yet.');
}

$threadid = optional_param('threadid', 0, PARAM_INT);

if ($threadid > 0) {
    // Single-thread view: same lookup, access check, message query (visible,
    // oldest first, capped at 100) and canreply computation as the page.
    $directthread = $DB->get_record('local_prequran_comm_thread', ['id' => $threadid], '*', IGNORE_MISSING);
    if (!$directthread || !pqcomml_direct_can_read($directthread, (int)$USER->id, $workspaceid)) {
        pqpd_fail(403, 'You cannot read this communication thread.');
    }
    $directcanreply = pqcomml_direct_can_reply($directthread, (int)$USER->id);
    $directmessages = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_comm_message}
          WHERE threadid = :threadid
            AND status = :status
       ORDER BY timecreated ASC, id ASC",
        ['threadid' => (int)$directthread->id, 'status' => 'visible'],
        0,
        100
    );

    $messages = [];
    $nameids = [];
    foreach ($directmessages as $m) {
        $senderid = (int)$m->senderid;
        $nameids[] = $senderid;
        $messages[] = [
            'id' => (int)$m->id,
            'senderid' => $senderid,
            'sendername' => pqcomml_direct_user_name($senderid),
            'body' => (string)$m->body,
            'timecreated' => (int)$m->timecreated,
            'mine' => $senderid === (int)$USER->id,
        ];
    }
    $participants = $DB->get_records('local_prequran_comm_participant', ['threadid' => (int)$directthread->id]);
    $participantids = [];
    foreach ($participants as $p) {
        $participantids[] = (int)$p->userid;
        $nameids[] = (int)$p->userid;
    }

    echo json_encode([
        'ok' => true,
        'mode' => 'thread',
        'userid' => (int)$USER->id,
        'thread' => [
            'id' => (int)$directthread->id,
            'subject' => (string)$directthread->subject,
            'type' => (string)$directthread->type,
            'type_label' => (string)$directthread->type === 'parent_teacher' ? 'Parent-teacher message' : 'Communication thread',
            'status' => (string)$directthread->status,
            'studentid' => (int)($directthread->studentid ?? 0),
            'lastmessageat' => (int)($directthread->lastmessageat ?? 0),
            'participantids' => $participantids,
        ],
        'canreply' => $directcanreply,
        'messages' => $messages,
        'names' => pqpd_names($nameids),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Thread list: same candidate query as the page (participant of active
// parent_teacher threads, newest activity first, capped at 100), then the same
// per-thread pqcomml_direct_can_read filter, then the same last-message snippet
// lookup the page runs while rendering. The unread flag is derived from the
// data the page maintains: the participant's lastreadmessageid (which the
// legacy write advances on reply) versus the latest visible message.
// Canvas Inbox: one unified list across every conversation type the user
// participates in (was parent_teacher-only).
$candidateleads = $DB->get_records_sql(
    "SELECT t.*
       FROM {local_prequran_comm_thread} t
       JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
      WHERE p.userid = :userid
        AND t.type IN ('parent_teacher', 'student_teacher', 'student_helpdesk', 'staff_direct', 'announcement')
        AND t.status <> :archived
   ORDER BY t.lastmessageat DESC, t.id DESC",
    [
        'userid' => (int)$USER->id,
        'archived' => 'archived',
    ],
    0,
    100
);
$directthreads = [];
foreach ($candidateleads as $candidate) {
    if (pqcomml_direct_can_read($candidate, (int)$USER->id, $workspaceid)) {
        $directthreads[(int)$candidate->id] = $candidate;
    }
}

$threads = [];
$nameids = [];
foreach ($directthreads as $thread) {
    $lastmessage = $DB->get_record_sql(
        "SELECT id, senderid, body, timecreated
           FROM {local_prequran_comm_message}
          WHERE threadid = :threadid
            AND status = :status
       ORDER BY timecreated DESC, id DESC",
        ['threadid' => (int)$thread->id, 'status' => 'visible'],
        IGNORE_MULTIPLE
    );
    $participants = $DB->get_records('local_prequran_comm_participant', ['threadid' => (int)$thread->id]);
    $participantids = [];
    $myparticipant = null;
    foreach ($participants as $p) {
        $participantids[] = (int)$p->userid;
        $nameids[] = (int)$p->userid;
        if ((int)$p->userid === (int)$USER->id) {
            $myparticipant = $p;
        }
    }
    $unread = false;
    if ($myparticipant && $lastmessage
            && (int)$lastmessage->id > (int)($myparticipant->lastreadmessageid ?? 0)
            && (int)$lastmessage->senderid !== (int)$USER->id) {
        $unread = true;
    }
    $threads[] = [
        'id' => (int)$thread->id,
        'subject' => (string)$thread->subject,
        'type' => (string)$thread->type,
        'status' => (string)$thread->status,
        'studentid' => (int)($thread->studentid ?? 0),
        'lastmessageat' => (int)($thread->lastmessageat ?? 0),
        'snippet' => $lastmessage ? core_text::substr((string)$lastmessage->body, 0, 140) : '',
        'lastmessagetime' => $lastmessage ? (int)$lastmessage->timecreated : 0,
        'unread' => $unread,
        'participantids' => $participantids,
    ];
}

// Compose options: role-derived permitted recipients (Canvas compose).
$myrole = pqcomml_comm_role((int)$USER->id, $workspaceid);
$composeoptions = $myrole !== '' ? pqcomml_compose_recipients((int)$USER->id, $workspaceid, $myrole) : [];

echo json_encode([
    'ok' => true,
    'mode' => 'list',
    'userid' => (int)$USER->id,
    'myrole' => $myrole,
    'cancompose' => !empty($composeoptions),
    'canoversight' => pqcomml_oversight_allowed((int)$USER->id),
    'composeoptions' => $composeoptions,
    'threads' => $threads,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
