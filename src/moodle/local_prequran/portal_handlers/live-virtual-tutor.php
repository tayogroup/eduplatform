<?php
// ---- report: live-virtual-tutor (live-session guided tutor; read + student write) ----
// Ported from local_hubredirect/live_virtual_tutor.php via
// live_virtual_tutor_portallib (pqlvt_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
//
// The tutor reply is generated SERVER-SIDE by a rule-based guided helper
// (pqlvt_tutor_reply, ai_mode = guided_rule_based) — there is no external
// AI/LLM endpoint and no keys/creds to curate out. The legacy page's optional
// voice features (quiz_tts.php text-to-speech + browser SpeechRecognition) stay
// at their own endpoints and are out of scope for this token portal.
// GET  = the live-session tutor state the page renders server-side: student +
//        session + lesson meta and the last 12 transcript messages.
// POST = do=send (legacy vt_action=send, verbatim): logs the student message,
//        generates the guided reply, logs the reply, returns the refreshed thread.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_virtual_tutor_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$body = [];
if ($method === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// sessionid/studentid resolve the same way the page does (query on GET, JSON
// body on POST). The page treats childid as an alias for studentid.
$sessionid = $method === 'POST'
    ? (int)($body['sessionid'] ?? 0)
    : optional_param('sessionid', 0, PARAM_INT);
$requestedstudentid = $method === 'POST'
    ? (int)($body['studentid'] ?? ($body['childid'] ?? 0))
    : optional_param('studentid', optional_param('childid', 0, PARAM_INT), PARAM_INT);

// Shared transcript loader (mirrors the page's message query + "mine" logic).
$loadthread = static function (int $chatsessionid, int $viewerid) use ($DB): array {
    $out = [];
    if ($chatsessionid <= 0 || !pqlvt_virtual_tutor_tables_ready()) {
        return $out;
    }
    try {
        $rows = array_reverse(array_values($DB->get_records(
            'local_prequran_vt_message',
            ['sessionid' => $chatsessionid],
            'timecreated DESC, id DESC',
            '*',
            0,
            12
        )));
    } catch (Throwable $e) {
        return [];
    }
    foreach ($rows as $msg) {
        $mine = (int)$msg->senderid === $viewerid && (string)$msg->message_source === 'user';
        $out[] = [
            'mine' => $mine,
            'role' => $mine ? 'You' : 'Virtual Tutor',
            'message' => (string)$msg->message,
            'timecreated' => (int)$msg->timecreated,
        ];
    }
    return $out;
};

// The page hard-requires the live-session table before rendering anything.
if (!pqlvt_table_exists('local_prequran_live_session')) {
    pqpd_fail(403, 'The live session table is not available yet. Please ask support to complete the live-session upgrade.');
}

// -- session resolution (verbatim page order; $USER->id -> token $userid) --
if ($sessionid <= 0) {
    $session = $DB->get_record_sql(
        "SELECT s.*
           FROM {local_prequran_live_session} s
      LEFT JOIN {local_prequran_live_participant} p
             ON p.sessionid = s.id
            AND p.status = :participantstatus
          WHERE s.status = :livestatus
            AND (s.teacherid = :teacherid OR p.userid = :participantuserid OR p.studentid = :participantstudentid)
       ORDER BY s.bbb_create_time DESC, s.scheduled_start DESC, s.id DESC",
        [
            'participantstatus' => 'active',
            'livestatus' => 'live',
            'teacherid' => $userid,
            'participantuserid' => $userid,
            'participantstudentid' => $userid,
        ],
        IGNORE_MULTIPLE
    );
    if (!$session && pqh_can_manage_academy_operations($userid)) {
        $session = $DB->get_record_sql(
            "SELECT s.*
               FROM {local_prequran_live_session} s
              WHERE s.status = :livestatus
           ORDER BY s.bbb_create_time DESC, s.scheduled_start DESC, s.id DESC",
            ['livestatus' => 'live'],
            IGNORE_MULTIPLE
        );
    }
    $sessionid = $session ? (int)$session->id : 0;
} else {
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
}
if (!$session) {
    if ($sessionid <= 0 && $requestedstudentid > 0) {
        $session = (object)[
            'id' => 0,
            'title' => 'Dashboard Tutor',
            'teacherid' => 0,
            'lessonid' => '',
            'unitid' => '',
        ];
    } else {
        pqpd_fail(403, 'Choose a valid live session before opening Virtual Tutor.');
    }
}

// -- participant resolution + studentid derivation (verbatim page order) --
$participants = [];
if ($sessionid > 0 && pqlvt_table_exists('local_prequran_live_participant')) {
    $participants = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'status' => 'active',
    ], 'id ASC');
}
$isparticipant = false;
$studentid = $requestedstudentid > 0 ? $requestedstudentid : 0;
foreach ($participants as $participant) {
    $participantuserid = (int)($participant->userid ?? 0);
    $participantstudentid = (int)($participant->studentid ?? 0);
    if ($participantuserid === $userid || $participantstudentid === $userid) {
        $isparticipant = true;
        if ($studentid <= 0) {
            $studentid = $participantstudentid > 0 ? $participantstudentid : $participantuserid;
        }
        break;
    }
    if ($studentid <= 0 && $participantstudentid > 0) {
        $studentid = $participantstudentid;
    }
}

// -- entry access check (verbatim canview; pqh_access_denied -> pqpd_fail 403, same message) --
$canview = pqh_can_manage_academy_operations($userid)
    || (int)$session->teacherid === $userid
    || $isparticipant
    || ($sessionid <= 0 && pqlvt_can_access_student($studentid, $userid));
if (!$canview) {
    pqpd_fail(403, 'Virtual Tutor is available only to this live session participant, teacher, or academy administrator.');
}

$lessonid = trim((string)($session->lessonid ?? ''));
$unitid = trim((string)($session->unitid ?? ''));

// The page opens (creating/refreshing) the guided-tutor chat session on every
// load — same write-on-read, and it resolves the transcript thread id.
$chatsessionid = pqlvt_open_tutor_session($studentid > 0 ? $studentid : $userid, $userid, $sessionid, $lessonid, $unitid);

if ($method === 'POST') {
    $do = (string)($body['do'] ?? '');

    // -- write: send (legacy vt_action=send, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'send') {
        $studentmessage = trim((string)($body['message'] ?? ''));
        if ($studentmessage === '') {
            pqpd_fail(400, 'Type a question or describe what is difficult.');
        }
        $studentmessage = clean_param(core_text::substr($studentmessage, 0, 1000), PARAM_TEXT);
        pqlvt_log_tutor_message($chatsessionid, $userid, 'student', $studentmessage, 'user');
        $latestreply = pqlvt_tutor_reply($studentmessage, $lessonid, $unitid);
        pqlvt_log_tutor_message($chatsessionid, 0, 'virtual_tutor', $latestreply, 'guided_rule_based');
        echo json_encode([
            'ok' => true,
            'message' => 'Tutor reply ready.',
            'reply' => $latestreply,
            'messages' => $loadthread($chatsessionid, $userid),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown virtual-tutor action.');
}

// -- GET: the live-session tutor state (mirrors the page's server-rendered parts) --
$student = $studentid > 0 ? core_user::get_user($studentid) : null;
$studentname = $student ? fullname($student) : 'Current learner';

echo json_encode([
    'ok' => true, 'ready' => true,
    'student' => ['id' => $studentid, 'name' => $studentname],
    'session' => [
        'id' => $sessionid,
        'title' => (string)($session->title ?? ''),
        'lessonid' => $lessonid,
        'unitid' => $unitid,
    ],
    'tutor_mode' => 'guided_rule_based',
    'messages' => $loadthread($chatsessionid, $userid),
], JSON_UNESCAPED_SLASHES);
exit;
