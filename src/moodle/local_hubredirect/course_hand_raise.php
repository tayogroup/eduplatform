<?php
declare(strict_types=1);

// Hand-raise receiver for the learner app.
//
// A learner working in the app while their teacher is teaching the other group
// has no way to say "I am stuck" — step 4 of the escalation ladder (worked
// example, then Wehel, then the group chat, then the teacher) had no fourth
// step. This is it. The teacher sees it on live_group_board.php from inside the
// other breakout room and answers with a line of chat or takes them first at
// the swap.
//
// Auth reuses the launch token the app already holds, exactly as
// course_focus_event.php does, so there is no session and no separate
// credential. The body is text/plain to stay a SIMPLE request — no CORS
// preflight — but unlike the focus beacon this one is a fetch rather than
// sendBeacon, because the learner needs the answer: raising a hand into a
// class nobody is running is worse than having no button, since the child
// waits instead of trying something else.
//
// THREE VERBS ON ONE ENDPOINT, chosen by what the body carries:
//   {token}             read the current state (mount)
//   {token, up:true}    raise
//   {token, up:false}   lower
//
// State lives in local_prequran_live_audit as course_hand_raised /
// course_hand_lowered rows, keyed on actorid like the focus events beside them,
// so "is the hand up" is the latest of the two. A teacher clearing a hand from
// the board writes the LEARNER as actorid and records themselves in details —
// otherwise the per-learner query would have to know about two actors.
//
// Writes only on a real transition. A child pressing the button twice is one
// row, not two, and a child who presses it twenty times is still one.

define('NO_MOODLE_COOKIES', true);
define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

$origin = pqpg_allowed_origin($_SERVER['HTTP_ORIGIN'] ?? null);
if ($origin !== null) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    // Authorization is allowed even though this endpoint authenticates from the
    // body, because check-platform-cors.mjs probes every endpoint it discovers
    // with "Access-Control-Request-Headers: authorization,content-type" and
    // requires both. That is not pedantry on the gate's part — it is the same
    // contract the seven endpoints beside this one already promise.
    //
    // Note the split it reveals. course_focus_event.php and
    // practice_coach_event.php send narrower headers and are never probed,
    // because the gate finds endpoints through platformUrl() and those two are
    // reached from a URL parameter instead. Being callable through platformUrl
    // is what buys an endpoint gate coverage; matching the contract is the
    // price. Narrowing this to Content-Type would fail the next release.
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

// Whether anyone is on the other end. The button is only mounted for a learner
// this answers true for, so a tutoring learner working alone never sees it —
// the same "silent unless it can do something" rule the subject picker keeps.
$watched = pqlgb_learner_is_watched($userid);
$state = pqlgb_hand_state([$userid])[$userid] ?? ['up' => false, 'since' => 0, 'by' => 0];

$reply = static function (array $state, bool $watched): void {
    echo json_encode([
        'ok' => true,
        'up' => !empty($state['up']),
        'since' => (int)($state['since'] ?? 0),
        'watched' => $watched,
    ], JSON_UNESCAPED_SLASHES);
};

// No `up` key at all is a read, which is what the app does on mount so a
// reload cannot show a lowered button while the board shows the hand up.
if (!array_key_exists('up', $payload)) {
    $reply($state, $watched);
    exit;
}

$wantup = !empty($payload['up']);
if ($wantup === !empty($state['up'])) {
    // Already in that state — no row, and the answer is the same either way.
    $reply($state, $watched);
    exit;
}

$now = time();
try {
    if (pqh_table_exists_safe('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => $userid,
            'action' => $wantup ? 'course_hand_raised' : 'course_hand_lowered',
            'targettype' => 'course_hand',
            'targetid' => 0,
            'details' => json_encode([
                'course' => (string)($claims['course'] ?? ''),
                'unit' => mb_substr(trim((string)($payload['unit'] ?? '')), 0, 40),
                'section' => mb_substr(trim((string)($payload['section'] ?? '')), 0, 60),
            ], JSON_UNESCAPED_SLASHES),
            'timecreated' => $now,
        ]);
        $state = ['up' => $wantup, 'since' => $now, 'by' => 0];
    }
} catch (Throwable $e) {
    // Asking for help must never break the lesson. The learner is told the
    // state did not change rather than shown a hand that was never recorded.
    http_response_code(503);
    echo json_encode(['ok' => false]);
    exit;
}

$reply($state, $watched);
