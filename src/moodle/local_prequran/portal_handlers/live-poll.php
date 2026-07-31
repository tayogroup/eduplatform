<?php
// Portal handler: live-poll. In-session polls and exit tickets — the platform
// had no interactive primitive at all. A teacher posts a quick question on a
// session; assigned students answer; results tally live. Role-branched: a
// teacher/manager of the session creates/closes/sees results; a student answers.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

$userid = (int)($claims['sub'] ?? 0);
if ($userid <= 0) {
    pqpd_fail(403, 'Sign in to use live polls.');
}

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

if (!pqh_table_exists_safe('local_prequran_live_poll')) {
    pqpd_fail(503, 'Live poll tables are not ready. Run the local_prequran plugin upgrade first.');
}

$sessionid = isset($body['sessionid']) ? (int)$body['sessionid'] : optional_param('sessionid', 0, PARAM_INT);
if ($sessionid <= 0 || !pqh_table_exists_safe('local_prequran_live_session')) {
    pqpd_fail(400, 'Choose a live session.');
}
$session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', MUST_EXIST);
$workspaceid = (int)$session->workspaceid;

// Role: is this user the session teacher / a workspace manager, or a student
// participant of the session?
$isteacher = (int)$session->teacherid === $userid || pqh_user_can_manage_workspace($userid, $workspaceid);
$studentpart = $DB->get_record('local_prequran_live_participant',
    ['sessionid' => $sessionid, 'userid' => $userid, 'role' => 'student'], '*', IGNORE_MISSING);
if (!$isteacher && !$studentpart) {
    pqpd_fail(403, 'You are not a teacher or student of this session.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $now = time();
        if ($do === 'create_poll') {
            if (!$isteacher) {
                pqpd_fail(403, 'Only the session teacher can post a poll.');
            }
            $question = trim((string)($body['question'] ?? ''));
            if (core_text::strlen($question) < 3) {
                pqpd_fail(400, 'Enter a poll question.');
            }
            $type = in_array((string)($body['poll_type'] ?? 'poll'), ['poll', 'exit_ticket'], true) ? (string)$body['poll_type'] : 'poll';
            $options = [];
            foreach ((array)($body['options'] ?? []) as $opt) {
                $opt = trim((string)$opt);
                if ($opt !== '') {
                    $options[] = core_text::substr($opt, 0, 200);
                }
                if (count($options) >= 8) {
                    break;
                }
            }
            $pollid = (int)$DB->insert_record('local_prequran_live_poll', (object)[
                'consumerid' => (int)($session->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'sessionid' => $sessionid,
                'teacherid' => (int)$session->teacherid,
                'poll_type' => $type,
                'question' => core_text::substr($question, 0, 500),
                'options_json' => json_encode($options, JSON_UNESCAPED_SLASHES),
                'status' => 'open',
                'createdby' => $userid,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            echo json_encode(['ok' => true, 'message' => 'Poll posted.', 'pollid' => $pollid], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'close_poll') {
            if (!$isteacher) {
                pqpd_fail(403, 'Only the session teacher can close a poll.');
            }
            $poll = $DB->get_record('local_prequran_live_poll', ['id' => (int)($body['pollid'] ?? 0), 'sessionid' => $sessionid], '*', MUST_EXIST);
            $DB->update_record('local_prequran_live_poll', (object)['id' => (int)$poll->id, 'status' => 'closed', 'timemodified' => $now]);
            echo json_encode(['ok' => true, 'message' => 'Poll closed.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'answer') {
            if (!$studentpart) {
                pqpd_fail(403, 'Only a student participant can answer.');
            }
            $poll = $DB->get_record('local_prequran_live_poll', ['id' => (int)($body['pollid'] ?? 0), 'sessionid' => $sessionid], '*', MUST_EXIST);
            if ((string)$poll->status !== 'open') {
                pqpd_fail(400, 'This poll is closed.');
            }
            $studentid = (int)$studentpart->studentid ?: $userid;
            $answerindex = (int)($body['answer_index'] ?? -1);
            $answertext = core_text::substr(trim((string)($body['answer_text'] ?? '')), 0, 500);
            $existing = $DB->get_record('local_prequran_live_poll_resp', ['pollid' => (int)$poll->id, 'studentid' => $studentid], '*', IGNORE_MISSING);
            if ($existing) {
                $DB->update_record('local_prequran_live_poll_resp', (object)[
                    'id' => (int)$existing->id, 'answer_index' => $answerindex, 'answer_text' => $answertext, 'timecreated' => $now,
                ]);
            } else {
                $DB->insert_record('local_prequran_live_poll_resp', (object)[
                    'pollid' => (int)$poll->id, 'studentid' => $studentid,
                    'answer_index' => $answerindex, 'answer_text' => $answertext, 'timecreated' => $now,
                ]);
            }
            echo json_encode(['ok' => true, 'message' => 'Answer submitted.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Choose a valid poll action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: polls for this session (+ results for teacher, own answer for student)
$polls = [];
$rows = $DB->get_records('local_prequran_live_poll', ['sessionid' => $sessionid], 'timecreated DESC', '*', 0, 50);
foreach ($rows as $p) {
    $options = json_decode((string)$p->options_json, true) ?: [];
    $entry = [
        'id' => (int)$p->id,
        'poll_type' => (string)$p->poll_type,
        'question' => (string)$p->question,
        'options' => $options,
        'status' => (string)$p->status,
        'timecreated' => (int)$p->timecreated,
    ];
    if ($isteacher) {
        // Tally (teacher sees aggregate results).
        $resp = $DB->get_records('local_prequran_live_poll_resp', ['pollid' => (int)$p->id], '', 'id,answer_index,answer_text');
        $tally = array_fill(0, max(1, count($options)), 0);
        $texts = [];
        foreach ($resp as $r) {
            if ($options && (int)$r->answer_index >= 0 && (int)$r->answer_index < count($options)) {
                $tally[(int)$r->answer_index]++;
            }
            if (trim((string)$r->answer_text) !== '') {
                $texts[] = (string)$r->answer_text;
            }
        }
        $entry['response_count'] = count($resp);
        $entry['tally'] = $options ? $tally : [];
        $entry['texts'] = $texts;
    } else {
        // Student sees their own answer only.
        $studentid = (int)$studentpart->studentid ?: $userid;
        $mine = $DB->get_record('local_prequran_live_poll_resp', ['pollid' => (int)$p->id, 'studentid' => $studentid], 'answer_index,answer_text', IGNORE_MISSING);
        $entry['my_answer_index'] = $mine ? (int)$mine->answer_index : -1;
        $entry['my_answer_text'] = $mine ? (string)$mine->answer_text : '';
    }
    $polls[] = $entry;
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'sessionid' => $sessionid,
    'session_title' => (string)$session->title,
    'is_teacher' => $isteacher,
    'polls' => $polls,
], JSON_UNESCAPED_SLASHES);
exit;
