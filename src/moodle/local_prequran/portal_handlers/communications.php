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
    if (!is_array($body) || (string)($body['do'] ?? '') !== 'reply') {
        pqpd_fail(400, 'Unknown communications action.');
    }
    if (!pqcomml_direct_tables_ready()) {
        pqpd_fail(503, 'Communication tables are not ready yet.');
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
    echo json_encode([
        'ok' => true,
        'message' => 'Message sent.',
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
$candidateleads = $DB->get_records_sql(
    "SELECT t.*
       FROM {local_prequran_comm_thread} t
       JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
      WHERE p.userid = :userid
        AND t.type = :type
        AND t.status <> :archived
   ORDER BY t.lastmessageat DESC, t.id DESC",
    [
        'userid' => (int)$USER->id,
        'type' => 'parent_teacher',
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

echo json_encode([
    'ok' => true,
    'mode' => 'list',
    'userid' => (int)$USER->id,
    'threads' => $threads,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
