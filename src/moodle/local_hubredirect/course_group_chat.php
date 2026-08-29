<?php
declare(strict_types=1);

// Classroom chat, the learner's door.
//
// Step 3 of the escalation ladder (worked example, then Wehel, then the group
// chat, then the teacher) had no channel behind it until now — the ladder named
// a group chat the platform did not have. This is that channel's learner end:
// the teacher's messages reach the whole room, a learner's reach the teacher
// alone (see support_message_visibility_for(); the requirements doc's "no
// student-to-student messaging" is stated twice and the room is built inside
// it, guarded by tools/check-class-group-chat.php).
//
// Auth reuses the launch token exactly as course_hand_raise.php does — no
// session, no separate credential. Verbs by body:
//   {token}                          read state + any messages
//   {token, since: N}                messages with id > N only
//   {token, body: "..."}             send, then return what is new
//
// THE GROUP IS DERIVED, NEVER TAKEN FROM THE CLIENT. The learner's active
// group membership decides which room they are in; a groupid in the payload
// would let any token read any room in the school. Same reasoning as the
// board's hand endpoint rebuilding its roster rather than trusting a learnerid.
//
// One implementation for both sides: everything after auth is
// local_prequran_external::class_group_chat_exchange(), the same function
// the teacher's board panel calls with a session. Only the doors differ.

define('NO_MOODLE_COOKIES', true);
define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');
require_once($CFG->dirroot . '/local/prequran/externallib_v4.php');

$origin = pqpg_allowed_origin($_SERVER['HTTP_ORIGIN'] ?? null);
if ($origin !== null) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    // Authorization is allowed even though auth is in the body, because
    // check-platform-cors.mjs probes every platformUrl() endpoint with
    // "authorization,content-type" and requires both — the contract the eight
    // endpoints beside this one already promise. Narrowing it fails the next
    // release.
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    http_response_code(204);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$payload = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

$claims = pqpg_verify_token((string)($payload['token'] ?? ''));
if ($claims === null) {
    http_response_code(401);
    echo json_encode(['ok' => false]);
    exit;
}
$userid = (int)($claims['sub'] ?? 0);
if ($userid <= 0) {
    http_response_code(401);
    echo json_encode(['ok' => false]);
    exit;
}

// The learner's own active group with a teacher on it — the same condition
// pqlgb_learner_is_watched() gates the Raise hand button on, resolved to WHICH
// group. Newest assignment wins if data ever holds more than one.
$grouprow = $DB->get_record_sql(
    "SELECT cg.id
       FROM {local_prequran_group_member} gm
       JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
      WHERE gm.studentid = :userid AND gm.assignment_status = 'active'
        AND cg.teacherid > 0 AND cg.status <> 'archived'
   ORDER BY gm.id DESC",
    ['userid' => $userid], IGNORE_MULTIPLE
);
if (!$grouprow) {
    // Not an error: a tutoring learner working alone has no room, and the app
    // reads enabled:false as "do not mount the panel" — a chat that reaches
    // nobody is worse than none.
    echo json_encode(['ok' => true, 'enabled' => false, 'messages' => []], JSON_UNESCAPED_SLASHES);
    exit;
}

$body = trim((string)($payload['body'] ?? ''));
$since = max(0, (int)($payload['since'] ?? 0));

// Fetching a screenshot's image is its own verb: {token, image: <messageid>}.
// The exchange's visibility check runs again inside -- an image can never be
// fetched by anyone who could not see its bubble.
$imageid = (int)($payload['image'] ?? 0);
if ($imageid > 0) {
    $img = local_prequran_external::class_group_chat_image($userid, (int)$grouprow->id, $imageid);
    echo json_encode($img ?: ['ok' => false], JSON_UNESCAPED_SLASHES);
    exit;
}

// A screenshot of the lesson page, base64 JPEG. Size-capped again here before
// the exchange caps it properly, so a grossly oversized body is refused before
// it is even decoded.
$screenshot = (string)($payload['screenshot'] ?? '');
if (strlen($screenshot) > 800000) {
    echo json_encode(['ok' => false, 'shotrejected' => 'too-big'], JSON_UNESCAPED_SLASHES);
    exit;
}

$result = local_prequran_external::class_group_chat_exchange($userid, (int)$grouprow->id, $body, $since, 60, 0, $screenshot);

// The group's class on TODAY's calendar, from the same lookup the teacher's
// Go live uses -- so the two ends can never disagree about which session is
// due. The app draws a Join button from this; the JOIN itself goes through
// live_sessions.php, which owns the join window, the approval states and the
// waiting room, and must keep owning them.
if (is_array($result) && !empty($result['ok'])) {
    $next = pqlgb_group_next_session([(int)$grouprow->id]);
    $result['livesession'] = $next[(int)$grouprow->id] ?? null;
}
echo json_encode($result, JSON_UNESCAPED_SLASHES);
