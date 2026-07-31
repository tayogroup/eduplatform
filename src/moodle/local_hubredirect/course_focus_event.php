<?php
declare(strict_types=1);

// Focus-break receiver for COURSE focus mode — the install-free alternative to
// Safe Exam Browser for families who cannot or will not install it.
//
// The lesson app runs in an ordinary browser tab and reports when the learner
// leaves it (tab switch, window blur, exiting fullscreen). This records the
// break so a teacher can see "left the lesson 7 times" — it is EVIDENCE, not
// prevention. A web page cannot stop anyone leaving; only SEB or an OS-level
// lock (iOS Guided Access / Android app pinning) can do that.
//
// Auth reuses the launch token the app already holds (same token that
// authenticates progress), so no session and no separate credential. Called via
// navigator.sendBeacon with a text/plain body to stay clear of CORS preflight.

define('NO_MOODLE_COOKIES', true);
define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

$origin = pqpg_allowed_origin($_SERVER['HTTP_ORIGIN'] ?? null);
if ($origin !== null) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit;
}

$payload = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    exit;
}

$claims = pqpg_verify_token((string)($payload['token'] ?? ''));
if ($claims === null) {
    http_response_code(401);
    exit;
}

$kind = (string)($payload['kind'] ?? '');
if (!in_array($kind, ['blur', 'hidden', 'fullscreen_exit', 'return', 'leaving'], true)) {
    http_response_code(400);
    exit;
}

// 'leaving' carries the learner's typed reason from the "I'm leaving" form —
// recorded under its own action so teachers can query departures distinctly
// from mere focus breaks.
$details = [
    'course' => (string)($claims['course'] ?? ''),
    'kind' => $kind,
    'count' => max(0, (int)($payload['count'] ?? 0)),
];
$action = 'course_focus_break';
if ($kind === 'leaving') {
    $action = 'course_left_early';
    $details['reason'] = mb_substr(trim((string)($payload['reason'] ?? '')), 0, 500);
    $details['minutes_left'] = max(0, (int)($payload['minutesLeft'] ?? 0));
}

try {
    if (pqh_table_exists_safe('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => (int)($claims['sub'] ?? 0),
            'action' => $action,
            'targettype' => 'seb_course',
            'targetid' => 0,
            'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
    }
} catch (Throwable $e) {
    // Monitoring must never break the lesson.
}

http_response_code(204);
