<?php
// Server-side Claude proxy for Wehel, the Ehel Academy AI subject expert.
// Modeled on quiz_tts.php: same CORS allowlist, same ws-token-or-login auth,
// same per-session rate limiting; the Anthropic key never leaves the server.
// The prompt itself lives in wehel_prompt.json (single source, shared with the
// local dev server) — change wording there, not here.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_wehel_origin_allowed(string $origin): bool {
    global $CFG;

    if ($origin === '') {
        return false;
    }

    $allowed = [];
    $wwwroot = parse_url($CFG->wwwroot ?? '');
    if (!empty($wwwroot['scheme']) && !empty($wwwroot['host'])) {
        $allowed[] = $wwwroot['scheme'] . '://' . $wwwroot['host'] . (!empty($wwwroot['port']) ? ':' . $wwwroot['port'] : '');
    }

    $appbase = (string)get_config('local_prequran', 'bunny_app_base_url');
    $app = parse_url($appbase);
    if (!empty($app['scheme']) && !empty($app['host']) && !pqh_is_legacy_quran_resource_host((string)$app['host'])) {
        $allowed[] = $app['scheme'] . '://' . $app['host'] . (!empty($app['port']) ? ':' . $app['port'] : '');
    }

    $allowed = array_merge($allowed, pqh_resource_allowed_origins());
    $allowed[] = 'http://127.0.0.1:4173';
    $allowed[] = 'http://localhost:4173';

    return in_array($origin, array_unique($allowed), true);
}

function pqh_wehel_send_cors(): void {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    if (pqh_wehel_origin_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    // Authorization carries the signed launch token. Without it here the
    // preflight rejects the header and the real request is never sent.
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

function pqh_wehel_json(int $status, array $payload): void {
    http_response_code($status);
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function pqh_wehel_config(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
    global $CFG;

    $value = trim((string)get_config('local_prequran', $pluginname));
    if ($value !== '') {
        return $value;
    }
    if (isset($CFG->{$cfgname}) && trim((string)$CFG->{$cfgname}) !== '') {
        return trim((string)$CFG->{$cfgname});
    }
    $env = getenv($envname);
    return $env !== false && trim((string)$env) !== '' ? trim((string)$env) : $default;
}

function pqh_wehel_valid_ws_token(string $token): bool {
    global $DB;

    $token = trim($token);
    if ($token === '') {
        return false;
    }
    $configured = trim((string)get_config('local_prequran', 'ws_token'));
    if ($configured !== '' && hash_equals($configured, $token)) {
        return true;
    }
    try {
        $record = $DB->get_record('external_tokens', ['token' => $token], 'id, validuntil', IGNORE_MISSING);
        return $record && ((int)($record->validuntil ?? 0) === 0 || (int)$record->validuntil > time());
    } catch (Throwable $e) {
        return false;
    }
}

// Homework attachments: the hard daily allowance per learner. Mirrored as
// ATTACH_DAILY_LIMIT in tools/lib/wehel-dev-chat.js and WEHEL_ATTACH_DAILY_LIMIT
// in shell/wehel.js — the contract gate holds the three equal, the same way it
// holds the unit-content caps.
define('WEHEL_ATTACH_DAILY_LIMIT', 5);
define('PQH_WEHEL_ATTACH_PER_MESSAGE', 2);
define('PQH_WEHEL_ATTACH_MAX_BASE64', 2800000); // ≈2MB decoded, per file

// The daily tutoring allowance (owner, 2026-08-28). Wehel is capped per learner
// per DAY, by how old the learner is: 10 minutes at Grades 1-2 rising to 30 at
// Grade 9 and above. Intensive English is deliberately NOT on that table — it
// sends its CEFR LEVEL as the grade, so reading the level as a school year
// would hand an adult beginner a Grade 1 allowance; the owner set it at 30
// minutes for Levels 1-2 and an hour above. A tutoring-support learner gets
// DOUBLE whatever their course allows.
//
// This is the copy that ENFORCES. The mirrors are WEHEL_DAILY_BANDS and
// friends in shell/wehel.js (what the on-screen timer shows) and in
// tools/lib/wehel-dev-chat.js (local dev), and the contract gate holds the
// three specs identical — a table written three times in three languages
// cannot be compared, one string parsed three ways can. Read "2:10" as "up to
// grade 2, 10 minutes"; the last band's 99 is the open top end.
define('WEHEL_DAILY_BANDS', '2:10,4:15,6:20,8:25,99:30');
define('WEHEL_INTENSIVE_BANDS', '2:30,99:60');
define('WEHEL_TUTORING_MULTIPLIER', 2);
// What one pause is worth. The clock is the wall-clock time BETWEEN a
// learner's requests, so an unbroken conversation costs exactly as long as it
// lasts — but a learner who walks away is not using the tutor, so any single
// gap is charged at most this. It is also what lets the panel's timer tick
// without lying: it counts the same seconds this file will charge, and stops
// where this file stops. The first request of the day charges nothing.
define('WEHEL_IDLE_GAP_SECONDS', 60);

// The day's SPEND ceiling, derived from the same minutes rather than listed in
// a table of its own (owner, 2026-08-28: cap the tokens too). One constant, so
// nothing can drift out of step with the bands, and the tutoring doubling and
// the Intensive English table both carry through for free.
//
// It is a BACKSTOP, not a second product limit. The minutes are the rule a
// learner feels and watches counting down; this stops a runaway day — a stuck
// client, an unlucky loop, a learner opening unit after unit — from costing
// unbounded money, and in ordinary use it must never be what stops anybody.
//
// Measured on production 2026-08-28: a two-question session cost 56,037
// weighted, of which 49,882 was the FIRST question's cache write of the unit
// prompt and 6,155 the follow-up's cache read. So cost tracks how many UNITS
// are opened — roughly 50k for each new one, ~6k per question after it. At
// 50,000 per allowed minute a Grade 1's ten minutes buys about ten fresh units
// or a hundred follow-ups, several times what ten minutes can hold.
define('WEHEL_WEIGHTED_TOKENS_PER_MINUTE', 50000);

// Resolve one band spec against a grade. Total by design: an unparseable spec
// or a grade past the last band lands on the last band rather than on zero,
// because a bug here must never lock a learner out of the tutor.
function pqh_wehel_band_minutes(string $spec, int $grade): int {
    $bands = [];
    foreach (explode(',', $spec) as $band) {
        $pair = explode(':', $band);
        if (count($pair) === 2 && (int)$pair[1] > 0) {
            $bands[] = [(int)$pair[0], (int)$pair[1]];
        }
    }
    if (!$bands) {
        return 0;
    }
    foreach ($bands as [$max, $minutes]) {
        if ($grade <= $max) {
            return $minutes;
        }
    }
    return $bands[count($bands) - 1][1];
}

// The learner's whole daily allowance, in minutes. Mirror of
// wehelDailyMinutes in shell/wehel.js.
function pqh_wehel_daily_minutes(int $grade, string $subject, string $category): int {
    $base = $subject === 'intensive-english'
        ? pqh_wehel_band_minutes(WEHEL_INTENSIVE_BANDS, $grade)
        : pqh_wehel_band_minutes(WEHEL_DAILY_BANDS, $grade);
    return $category === 'tutoring' ? $base * WEHEL_TUTORING_MULTIPLIER : $base;
}

// What a question actually COST, from the API's own report rather than from
// any conversion of the minutes above. Two numbers, because they answer
// different questions and only one of them is about money:
//
//   tokens    every token the exchange moved, cache reads included. With the
//             unit prompt cached this is roughly 21k per question whatever the
//             learner asked, so it tracks how MANY questions were asked and
//             almost nothing else.
//   weighted  the same exchange in equivalent fresh-input tokens, which is
//             what it costs: a cache read is a tenth of a fresh input token, a
//             cache write is 1.25, and output is five times one. A raw sum
//             rates a long answer as cheap as the cache read that carried it.
//
// Both are recorded and neither caps anything yet (owner, 2026-08-28): a limit
// wants a number taken from real days, and these are the first days measured.
function pqh_wehel_token_weight(array $usage): int {
    return (int)round(
        (int)($usage['input_tokens'] ?? 0)
        + (int)($usage['cache_creation_input_tokens'] ?? 0) * 1.25
        + (int)($usage['cache_read_input_tokens'] ?? 0) * 0.1
        + (int)($usage['output_tokens'] ?? 0) * 5
    );
}

function pqh_wehel_token_total(array $usage): int {
    return (int)($usage['input_tokens'] ?? 0)
        + (int)($usage['cache_creation_input_tokens'] ?? 0)
        + (int)($usage['cache_read_input_tokens'] ?? 0)
        + (int)($usage['output_tokens'] ?? 0);
}

// "25 minutes", "an hour", "2 hours" — what the allowance is called in the
// sentence a learner reads. Mirror of wehelAllowanceWords in shell/wehel.js.
function pqh_wehel_allowance_words(int $minutes): string {
    if ($minutes > 0 && $minutes % 60 === 0) {
        $hours = intdiv($minutes, 60);
        return $hours === 1 ? 'an hour' : $hours . ' hours';
    }
    return $minutes . ' minutes';
}

// The user a per-user external token belongs to — needed only to count
// attachments, where "who" is the whole point. The configured shared ws_token
// maps to nobody and returns 0.
function pqh_wehel_ws_token_userid(string $token): int {
    global $DB;

    $token = trim($token);
    if ($token === '') {
        return 0;
    }
    try {
        $record = $DB->get_record('external_tokens', ['token' => $token], 'id, userid, validuntil', IGNORE_MISSING);
        if ($record && ((int)($record->validuntil ?? 0) === 0 || (int)$record->validuntil > time())) {
            return (int)$record->userid;
        }
    } catch (Throwable $e) {
        // Fall through to 0 — an unreadable token identifies nobody.
    }
    return 0;
}

// Who this request is for, across all three credentials: the launch token
// names a learner, a logged-in session names one, a per-user external token
// maps to one, and the configured shared ws_token maps to nobody and returns
// 0. Both daily allowances — homework uploads and tutoring minutes — are
// counted against this, and both are unenforceable without it.
function pqh_wehel_learner_id(int $apiuserid, string $token): int {
    global $USER;

    if ($apiuserid > 0) {
        return $apiuserid;
    }
    if (isloggedin()) {
        return (int)$USER->id;
    }
    return pqh_wehel_ws_token_userid($token);
}

// Validate one image/document content block; returns its content hash, which
// is what the daily allowance counts (so a retry of the same photo is free).
function pqh_wehel_validate_attachment(array $block): string {
    $type = (string)($block['type'] ?? '');
    $source = $block['source'] ?? null;
    if (!is_array($source) || (string)($source['type'] ?? '') !== 'base64') {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'Malformed attachment.']);
    }
    $mediatype = (string)($source['media_type'] ?? '');
    $allowed = $type === 'image'
        ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        : ['application/pdf'];
    if (!in_array($mediatype, $allowed, true)) {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'Only JPG, PNG, WEBP or GIF photos and PDF files can be attached.']);
    }
    $data = (string)($source['data'] ?? '');
    if ($data === '' || strlen($data) > PQH_WEHEL_ATTACH_MAX_BASE64) {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'An attachment is empty or too large — about 2MB is the limit.']);
    }
    if (base64_decode($data, true) === false) {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'An attachment could not be decoded.']);
    }
    return sha1($data);
}

// Global + subject stock phrases, in prompt order.
function pqh_wehel_phrases(array $promptdata, string $subject): array {
    $bank = $promptdata['phraseBank'] ?? [];
    return array_merge((array)($bank['global'] ?? []), (array)(($bank['subjects'] ?? [])[$subject] ?? []));
}

// Sentence-matching key — mirror of normalisePhrase in
// tools/lib/ehel-wehel-phrases.js. Keep the two byte-for-byte equivalent:
// lowercase, curly quotes straightened, everything but letters/digits/spaces
// dropped, whitespace collapsed.
function pqh_wehel_normalise(string $text): string {
    $text = core_text::strtolower($text);
    $text = str_replace(["\u{2018}", "\u{2019}", "\u{02BC}"], "'", $text);
    $text = str_replace(["\u{201C}", "\u{201D}"], '"', $text);
    $text = preg_replace('/[^a-z0-9\s]/u', '', $text);
    return trim(preg_replace('/\s+/u', ' ', $text));
}

// Snap reply sentences that nearly match a stock phrase back to its canonical
// text, so the on-screen sentence and the pre-recorded clip share one hash.
function pqh_wehel_canonicalise(string $reply, array $phrases): string {
    $canon = [];
    foreach ($phrases as $phrase) {
        $canon[pqh_wehel_normalise((string)$phrase)] = (string)$phrase;
    }
    $sentences = preg_split('/(?<=[.!?…])\s+/u', $reply) ?: [$reply];
    foreach ($sentences as $index => $sentence) {
        $key = pqh_wehel_normalise($sentence);
        if ($key !== '' && isset($canon[$key])) {
            $sentences[$index] = $canon[$key];
        }
    }
    return implode(' ', $sentences);
}

pqh_wehel_send_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_wehel_json(405, ['ok' => false, 'message' => 'Use POST.']);
}

$raw = file_get_contents('php://input');
// Raised from 600KB for homework attachments: two ~2MB base64 files plus the
// unit JSON. Text-only requests stay a fraction of this; each attachment block
// is capped individually below.
if ($raw === false || strlen($raw) > 8 * 1024 * 1024) {
    pqh_wehel_json(400, ['ok' => false, 'message' => 'The request is too large.']);
}
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    pqh_wehel_json(400, ['ok' => false, 'message' => 'Invalid JSON.']);
}

$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
// Three credentials, tried cheapest first. The launch token is what a
// CDN-hosted caller actually has: it is cross-origin, so no session cookie
// reaches it (MoodleSessionep1 is issued with no SameSite, which browsers
// treat as Lax, and Lax is not sent on a cross-site POST). Without this
// branch require_login() answers the fetch with a 303 to /login/index.php.
$pqh_apiuserid = 0;
if (!pqh_wehel_valid_ws_token($requesttoken)) {
    $pqh_apiuserid = pqh_launch_token_userid(is_array($payload) ? $payload : null);
    if ($pqh_apiuserid <= 0) {
        require_login();
    }
}

// --- validate the tutoring request -------------------------------------------

$promptfile = __DIR__ . '/wehel_prompt.json';
$promptdata = json_decode((string)@file_get_contents($promptfile), true);
if (!is_array($promptdata) || empty($promptdata['template']) || empty($promptdata['subjectNotes'])) {
    pqh_wehel_json(503, ['ok' => false, 'message' => 'Wehel is not configured on this server.']);
}

$subject = trim((string)($payload['subject'] ?? ''));
if (!isset($promptdata['subjectNotes'][$subject])) {
    pqh_wehel_json(400, ['ok' => false, 'message' => 'Unknown subject.']);
}

$grade = (int)($payload['grade'] ?? 0);
if ($grade < 1 || $grade > 9) {
    pqh_wehel_json(400, ['ok' => false, 'message' => 'Unknown grade.']);
}

$channel = (string)($payload['channel'] ?? 'text');
if (!in_array($channel, ['text', 'voice'], true)) {
    $channel = 'text';
}

$clean = static function ($value, int $max) {
    $value = preg_replace('/\s+/', ' ', trim((string)$value));
    return core_text::substr($value, 0, $max);
};
$subjectlabel = $clean($payload['subjectLabel'] ?? $subject, 60);
$learnername = $clean($payload['learnerName'] ?? '', 40);
$unittitle = $clean($payload['unitTitle'] ?? '', 160);
$unitno = $clean($payload['unitNo'] ?? '', 8);
$cambridgecode = $clean($payload['cambridgeCode'] ?? '', 60);
$modehint = trim((string)($payload['mode'] ?? ''));
// Read here rather than beside its prompt block below: the daily allowance is
// doubled for this category, and that is decided before a prompt is assembled.
$learnercategory = $clean($payload['learnerCategory'] ?? '', 20);

// The course outline is multi-line by design (one unit per line), so it gets
// its own sanitiser: keep the newlines, collapse other whitespace, cap it.
$courseoutline = preg_replace('/[^\S\n]+/', ' ', trim((string)($payload['courseOutline'] ?? '')));
$courseoutline = core_text::substr($courseoutline, 0, 4000);
if ($courseoutline === '') {
    $courseoutline = '(The course outline was not provided; you know only the current unit.)';
}

// Any advertised tool with a definition in the prompt source gets defined for
// the model; the client resolves the calls, so nothing else is server-side.
$requestedtools = $payload['tools'] ?? [];
$tooldefs = [];
if (is_array($requestedtools)) {
    foreach ($requestedtools as $toolname) {
        if (is_string($toolname) && isset($promptdata['tools'][$toolname]) && is_array($promptdata['tools'][$toolname])) {
            $tooldefs[] = array_merge(['name' => $toolname], $promptdata['tools'][$toolname]);
        }
    }
}
$usetool = count($tooldefs) > 0;

$messages = $payload['messages'] ?? null;
if (!is_array($messages) || !count($messages) || count($messages) > 30) {
    pqh_wehel_json(400, ['ok' => false, 'message' => 'Send between 1 and 30 chat messages.']);
}
$conversation = [];
$attachmenthashes = [];
foreach ($messages as $message) {
    if (!is_array($message)) {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'Malformed chat message.']);
    }
    $role = (string)($message['role'] ?? '');
    if (!in_array($role, ['user', 'assistant'], true)) {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'Malformed chat message.']);
    }
    $content = $message['content'] ?? $message['text'] ?? '';
    // Content is either a plain string or an array of API content blocks — the
    // client's get_unit tool loop sends tool_use/tool_result turns as blocks,
    // and a homework attachment rides its message as image/document blocks.
    if (is_array($content)) {
        $plain = [];
        $inmessage = 0;
        foreach ($content as $block) {
            if (!is_array($block)) {
                pqh_wehel_json(400, ['ok' => false, 'message' => 'Malformed chat message.']);
            }
            $blocktype = (string)($block['type'] ?? '');
            if ($blocktype === 'image' || $blocktype === 'document') {
                $inmessage++;
                if ($inmessage > PQH_WEHEL_ATTACH_PER_MESSAGE) {
                    pqh_wehel_json(400, ['ok' => false, 'message' => 'Up to ' . PQH_WEHEL_ATTACH_PER_MESSAGE . ' files can go with one message.']);
                }
                $attachmenthashes[] = pqh_wehel_validate_attachment($block);
                continue; // validated — the block itself still travels in $content below
            }
            $plain[] = $block;
        }
        // The 200k ceiling guards the text/tool blocks; attachments carry
        // their own per-block cap above and are excluded from this measure.
        $encoded = json_encode($plain, JSON_UNESCAPED_UNICODE);
        if (!is_string($encoded) || strlen($encoded) > 200000) {
            pqh_wehel_json(400, ['ok' => false, 'message' => 'A chat message is too large.']);
        }
        $conversation[] = ['role' => $role, 'content' => $content];
        continue;
    }
    $content = trim((string)$content);
    if ($content === '') {
        pqh_wehel_json(400, ['ok' => false, 'message' => 'Malformed chat message.']);
    }
    $conversation[] = ['role' => $role, 'content' => core_text::substr($content, 0, 4000)];
}
if ($conversation[count($conversation) - 1]['role'] !== 'user') {
    pqh_wehel_json(400, ['ok' => false, 'message' => 'The last message must be from the learner.']);
}

// The unit JSON is data the client already holds (the lesson loads it into the
// browser); passing it up keeps this endpoint stateless and grade-agnostic.
$unitcontent = '';
if (isset($payload['unit'])) {
    $unitcontent = json_encode($payload['unit'], JSON_UNESCAPED_UNICODE);
    if (!is_string($unitcontent)) {
        $unitcontent = '';
    }
    // Matches UNIT_JSON_LIMIT in shell/wehel.js. Raised from 120000 on
    // 2026-08-15: the client now strips audio descriptors before sending
    // (63% of an English unit was media bookkeeping), and at the old cap the
    // cut landed just after the word lists — so in all 81 English units the
    // tutor could not see the readings, grammar, quizzes or answer keys, and
    // taught vocabulary because vocabulary was all it could see. Every one of
    // the academy's 410 units now fits whole. The unit prompt is cached, so
    // the larger payload is paid for once per learner per unit.
    if (core_text::strlen($unitcontent) > 200000) {
        $unitcontent = core_text::substr($unitcontent, 0, 200000) . ' …(unit content truncated)';
    }
}
if ($unitcontent === '') {
    $unitcontent = '(The unit content was not provided. Teach from the unit title and general Cambridge knowledge for this grade, and say when you are unsure what the lesson on screen shows.)';
}

// --- rate limit (per Moodle session, mirrors quiz_tts.php) --------------------

// A token-authenticated caller sends no cookie, so it gets a fresh $SESSION on
// every request and the counter below would read 1 every time — leaving a PAID
// endpoint with no cap at all. Those callers are counted by user id in an
// application cache; cookie callers keep the original counter untouched.
//
// SUSPENDED 2026-08-14 at the owner's request: the shipped default is 0 (no
// cap), because the 20/min limit kept reading as an outage during rollout
// testing — the client shows a 429 as the same fallback bubble as a real
// failure. This endpoint is PAID, per message, so the machinery stays and the
// cap comes back the moment a limit is configured:
//   php admin/cli/cfg.php --component=local_prequran --name=wehel_chat_rate_limit --set=20
$pqh_wehel_ratelimit = (int)pqh_wehel_config('wehel_chat_rate_limit', 'local_prequran_wehel_chat_rate_limit', 'WEHEL_CHAT_RATE_LIMIT', '0');
if ($pqh_wehel_ratelimit > 0) {
    if ($pqh_apiuserid > 0) {
        if (!pqh_api_rate_limit_ok('wehel_chat', $pqh_apiuserid, $pqh_wehel_ratelimit)) {
            pqh_wehel_json(429, ['ok' => false, 'message' => 'Wehel needs a short break. Please wait a minute.']);
        }
    } else {
        global $SESSION;
        $now = time();
        if (empty($SESSION->local_hubredirect_wehel_window) || !is_array($SESSION->local_hubredirect_wehel_window)) {
            $SESSION->local_hubredirect_wehel_window = ['start' => $now, 'count' => 0];
        }
        if (($now - (int)$SESSION->local_hubredirect_wehel_window['start']) > 60) {
            $SESSION->local_hubredirect_wehel_window = ['start' => $now, 'count' => 0];
        }
        $SESSION->local_hubredirect_wehel_window['count'] = (int)$SESSION->local_hubredirect_wehel_window['count'] + 1;
        if ($SESSION->local_hubredirect_wehel_window['count'] > $pqh_wehel_ratelimit) {
            pqh_wehel_json(429, ['ok' => false, 'message' => 'Wehel needs a short break. Please wait a minute.']);
        }
    }
}

// --- the daily tutoring allowance ----------------------------------------------
// Minutes per learner per day, by grade (see the bands at the top of this
// file). The clock is derived from REQUEST TIMESTAMPS, never from anything the
// client reports: each request charges the wall-clock gap since the learner's
// previous one, capped at WEHEL_IDLE_GAP_SECONDS, and the first request of the
// day charges nothing. So an unbroken conversation costs exactly as long as it
// lasts, a learner who leaves the tab open and walks away is charged one
// minute for the pause and not the afternoon, and the client's own timer can
// mirror the arithmetic exactly because it is arithmetic on the same two
// numbers.
//
// The ledger is a user preference ("YYYYMMDD|used|last") for the same reasons
// the attachment one is: it survives sessions, it costs no schema, and it
// resets itself at midnight. It runs AFTER the rate limit and BEFORE the
// attachment allowance, so a refused request consumes neither.
//
// An unidentifiable caller is not charged, exactly as pqh_api_rate_limit_ok
// does not rate-limit one. Every learner resolves — the launch token names one
// and a session names one — so this is the configured shared ws_token, an
// operator credential rather than a child.
$pqh_wehel_learnerid = pqh_wehel_learner_id($pqh_apiuserid, $requesttoken);
$pqh_wehel_dailyminutes = pqh_wehel_daily_minutes($grade, $subject, $learnercategory);
// tokens/weighted are MEASURED, never a conversion of the minutes: the two do
// not convert. What a day costs is driven by how many questions are asked, not
// how long the learner sits there — the same ten minutes is four questions for
// a slow reader and twenty for a quick one. See pqh_wehel_token_weight.
$pqh_wehel_time = [
    'limit' => $pqh_wehel_dailyminutes * 60,
    'used' => 0,
    'tokens' => 0,
    'weighted' => 0,
    'tokenLimit' => $pqh_wehel_dailyminutes * WEHEL_WEIGHTED_TOKENS_PER_MINUTE,
];
$pqh_wehel_today = date('Ymd');
$pqh_wehel_now = time();
if ($pqh_wehel_dailyminutes > 0 && $pqh_wehel_learnerid > 0) {
    $pqh_wehel_ledger = explode('|', (string)get_user_preferences('local_hubredirect_wehel_time', '', $pqh_wehel_learnerid));
    $pqh_wehel_sameday = ($pqh_wehel_ledger[0] ?? '') === $pqh_wehel_today;
    $pqh_wehel_used = $pqh_wehel_sameday ? max(0, (int)($pqh_wehel_ledger[1] ?? 0)) : 0;
    $pqh_wehel_last = $pqh_wehel_sameday ? max(0, (int)($pqh_wehel_ledger[2] ?? 0)) : 0;
    // Fields 4 and 5 are the day's token totals, written after the API call
    // answers. They are carried through this write rather than reset, or every
    // question would wipe the count made by the one before it.
    $pqh_wehel_time['tokens'] = $pqh_wehel_sameday ? max(0, (int)($pqh_wehel_ledger[3] ?? 0)) : 0;
    $pqh_wehel_time['weighted'] = $pqh_wehel_sameday ? max(0, (int)($pqh_wehel_ledger[4] ?? 0)) : 0;
    if ($pqh_wehel_last > 0 && $pqh_wehel_now > $pqh_wehel_last) {
        $pqh_wehel_used += min($pqh_wehel_now - $pqh_wehel_last, WEHEL_IDLE_GAP_SECONDS);
    }
    set_user_preference('local_hubredirect_wehel_time',
        $pqh_wehel_today . '|' . $pqh_wehel_used . '|' . $pqh_wehel_now
        . '|' . $pqh_wehel_time['tokens'] . '|' . $pqh_wehel_time['weighted'], $pqh_wehel_learnerid);
    $pqh_wehel_time['used'] = $pqh_wehel_used;
    if ($pqh_wehel_used >= $pqh_wehel_time['limit']) {
        // 429 with a code, not a bare 429: the panel renders a coded refusal as
        // a normal reply from the tutor, and an uncoded one as "Wehel could not
        // be reached" — which would be a lie the learner acts on by retrying
        // against a wall only midnight moves.
        pqh_wehel_json(429, [
            'ok' => false,
            'code' => 'time-limit',
            'message' => 'That is all ' . pqh_wehel_allowance_words($pqh_wehel_dailyminutes)
                . ' of Wehel for today — well done. I will be here again tomorrow!',
            'time' => $pqh_wehel_time,
        ]);
    }
}

// --- the day's spend ceiling ---------------------------------------------------
// The backstop on cost, checked against what the day has ALREADY cost — this
// request's own usage does not exist until the API answers, so the request that
// crosses the line is served and the next one is refused. That is the right way
// round for a backstop: it can never cut a learner off mid-answer for a cost it
// had not yet incurred.
//
// It runs after the clock and before the attachment allowance, so a refused
// request consumes neither. Its own code, not "time-limit": the panel says
// something different for a spent budget than for a spent clock, and telling a
// learner their time is up while a visible timer says otherwise would be a lie
// they can see.
if ($pqh_wehel_time['tokenLimit'] > 0 && $pqh_wehel_learnerid > 0
        && $pqh_wehel_time['weighted'] >= $pqh_wehel_time['tokenLimit']) {
    pqh_wehel_json(429, [
        'ok' => false,
        'code' => 'token-limit',
        'message' => 'We have done a great deal of work together today — that is all Wehel for now. I will be here again tomorrow!',
        'time' => $pqh_wehel_time,
    ]);
}

// --- homework attachment daily allowance ---------------------------------------
// WEHEL_ATTACH_DAILY_LIMIT files per learner per day, counted by CONTENT HASH so
// the client's one automatic retry — and the tool loop, which re-posts the same
// conversation — never bills the same photo twice. The ledger is a user
// preference ("YYYYMMDD|hash,hash,…") so it survives sessions and resets itself
// at midnight. It runs AFTER the rate limit above: a rate-limited request must
// not consume the day's allowance. Attachments require a resolvable learner —
// the launch token and a logged-in session both name one, a per-user external
// token maps to one, and the configured shared ws_token maps to nobody: that
// caller is refused, because an uncountable allowance is no allowance.
if ($attachmenthashes) {
    $attachuserid = $pqh_wehel_learnerid;
    if ($attachuserid <= 0) {
        pqh_wehel_json(403, ['ok' => false, 'code' => 'attach-login', 'message' => 'Homework files need a learner login — open the course from the platform and try again.']);
    }
    $today = date('Ymd');
    $ledger = explode('|', (string)get_user_preferences('local_hubredirect_wehel_attach', '', $attachuserid), 2);
    $counted = (($ledger[0] ?? '') === $today && !empty($ledger[1])) ? explode(',', $ledger[1]) : [];
    foreach (array_unique($attachmenthashes) as $hash) {
        $short = substr($hash, 0, 12);
        if (in_array($short, $counted, true)) {
            continue; // already counted today — a retry or a tool-loop round
        }
        if (count($counted) >= WEHEL_ATTACH_DAILY_LIMIT) {
            pqh_wehel_json(429, [
                'ok' => false,
                'code' => 'attach-limit',
                'message' => 'You have used all ' . WEHEL_ATTACH_DAILY_LIMIT . ' homework uploads for today — type the question instead, and the uploads come back tomorrow.',
            ]);
        }
        $counted[] = $short;
    }
    set_user_preference('local_hubredirect_wehel_attach', $today . '|' . implode(',', $counted), $attachuserid);
}

// --- assemble the prompt ------------------------------------------------------

$bands = $promptdata['stageBands'] ?? [];
$band = (string)($bands[(string)$grade] ?? 'upper-primary');
$subjectnotes = implode("\n", (array)$promptdata['subjectNotes'][$subject]);

// Focus — the module of this unit the learner picked in the chat panel. It
// narrows the tutor's attention only: UNIT CONTENT, the year outline and the
// tools all still travel. Unset, the replacement is the empty string, so the
// prompt builds exactly as it did before Focus existed. Mirror of the same step
// in tools/lib/wehel-dev-chat.js.
$focuslabel = $clean(is_array($payload['focus'] ?? null) ? ($payload['focus']['label'] ?? '') : '', 80);
$focusblock = '';
if ($focuslabel !== '' && !empty($promptdata['focusBlock'])) {
    $focusblock = "\n" . strtr(implode("\n", array_map('strval', (array)$promptdata['focusBlock'])), [
        '{{FOCUS_LABEL}}' => $focuslabel,
    ]) . "\n";
}

$system = implode("\n", (array)$promptdata['template']);
$system = strtr($system, [
    '{{LEARNER_NAME}}' => $learnername !== '' ? $learnername : 'the learner',
    '{{SUBJECT}}' => $subjectlabel,
    '{{GRADE}}' => (string)$grade,
    '{{STAGE_BAND}}' => $band,
    '{{CAMBRIDGE_CODE}}' => $cambridgecode !== '' ? $cambridgecode : 'curriculum',
    '{{UNIT_NO}}' => $unitno !== '' ? $unitno : '?',
    '{{UNIT_TITLE}}' => $unittitle !== '' ? $unittitle : 'this unit',
    '{{CHANNEL}}' => $channel,
    '{{SUBJECT_NOTES}}' => $subjectnotes,
    '{{STOCK_PHRASES}}' => implode("\n", array_map(static fn($phrase) => '- ' . $phrase, pqh_wehel_phrases($promptdata, $subject))),
    '{{OTHER_UNITS_NOTE}}' => (string)(($promptdata['otherUnitsNotes'] ?? [])[$usetool ? 'withTool' : 'withoutTool'] ?? ''),
    '{{COURSE_OUTLINE}}' => $courseoutline,
    '{{UNIT_CONTENT}}' => $unitcontent,
    '{{FOCUS}}' => $focusblock,
]);
// The learner-category framing correction (categoryNotes in wehel_prompt.json)
// — "tutoring" learners hear "this lesson", never "this unit", because they
// reached this lesson by searching a topic and hold no position in this
// course. Appended to the CACHED block, not the volatile tail: the category is
// per-learner-stable, so it caches with the template, and it must sit ABOVE
// the volatile hints it reframes. Only categories the prompt source defines
// append anything, so an absent or unknown value builds byte-identical to
// before this existed. Mirror of the same step in tools/lib/wehel-dev-chat.js.
// ($learnercategory is read up with the other cleaned fields — the daily
// allowance needs it long before the prompt does.)
$categorynote = ($promptdata['categoryNotes'] ?? [])[$learnercategory] ?? null;
if (is_array($categorynote) && $categorynote) {
    $system .= "\n\n" . implode("\n", array_map('strval', $categorynote));
}
// Everything from here down is the VOLATILE tail: it changes between questions
// in the same unit (the page the learner is on, the mode a quick prompt asked
// for). It is kept out of $system so the big stable block above — template plus
// the whole unit JSON, ~30k tokens — can be prompt-cached across a learner's
// questions. That cache is why a burst of questions stopped exhausting the
// per-minute token allowance: a cache read is a fraction of a fresh read.
$volatile = '';
$modehints = (array)($promptdata['modeHints'] ?? []);
if ($modehint !== '' && isset($modehints[$modehint])) {
    // A hint is one string, or an array of lines for the long ones (the
    // virtual-teacher playbook) — joined exactly as the template's arrays are.
    $hint = $modehints[$modehint];
    $volatile .= "\n\n" . (is_array($hint) ? implode("\n", array_map('strval', $hint)) : (string)$hint);
}
// Preferred teaching language — only languages the prompt source defines are
// honoured, and the block itself (e.g. Somali-for-vocabulary-only) lives in
// wehel_prompt.json. Mirror of the same step in tools/lib/wehel-dev-chat.js.
$teachinglanguage = core_text::strtolower(trim((string)($payload['teachingLanguage'] ?? '')));
$languageblock = ($promptdata['languageSupport'] ?? [])[$teachinglanguage] ?? null;
if (is_array($languageblock) && $languageblock) {
    $volatile .= "\n\n" . implode("\n", array_map('strval', $languageblock));
}
// The learner's real assigned homework — fetched by the client from
// wehel_homework.php and formatted by homeworkContextText in shell/wehel.js.
// Multi-line by design, like the course outline, so newlines survive. The cap
// matches HOMEWORK_CONTEXT_LIMIT in shell/wehel.js and the mirror in
// tools/lib/wehel-dev-chat.js; the contract gate holds the three equal.
$homeworkcontext = preg_replace('/[^\S\n]+/', ' ', trim((string)($payload['homework'] ?? '')));
if (core_text::strlen($homeworkcontext) > 6000) {
    $homeworkcontext = core_text::substr($homeworkcontext, 0, 6000) . ' …';
}
if ($homeworkcontext !== '' && !empty($promptdata['homeworkBlock'])) {
    $volatile .= "\n\n" . strtr(implode("\n", array_map('strval', (array)$promptdata['homeworkBlock'])), [
        '{{HOMEWORK_LIST}}' => $homeworkcontext,
    ]);
}
// Where the learner is standing right now. The dock opens over any lesson
// page, so "I don't get this" has a referent. For the tutoring category the
// wrapper drops "of this unit" — their hint may be a search page, and the
// framing correction above forbids the word anyway.
$sectionhint = $clean($payload['sectionHint'] ?? '', 80);
if ($sectionhint !== '') {
    $pageof = $learnercategory === 'tutoring' ? 'page' : 'page of this unit';
    $volatile .= "\n\nThe learner is on the \"" . $sectionhint . "\" " . $pageof . " right now — useful context for what they may mean, but their own words always come first: answer what they asked, not the page.";
}
// Finer than the page: the exact item on screen — the current slide of a
// Grade 1-4 deck ("Question 3 of 6 — …"), read by the dock at send time.
// This is what "this activity" means to the virtual teacher. Mirror of the
// same step in tools/lib/wehel-dev-chat.js.
$activityhint = $clean($payload['activityHint'] ?? '', 200);
if ($activityhint !== '') {
    $volatile .= "\n\nThe exact item on their screen right now is: \"" . $activityhint . "\".";
}

// --- call the Anthropic API ---------------------------------------------------

$apikey = pqh_wehel_config('anthropic_api_key', 'local_prequran_anthropic_api_key', 'ANTHROPIC_API_KEY');
if ($apikey === '') {
    pqh_wehel_json(503, ['ok' => false, 'message' => 'Wehel is not configured on this server.']);
}
$model = pqh_wehel_config('wehel_model', 'local_prequran_wehel_model', 'WEHEL_MODEL', (string)($promptdata['model'] ?? 'claude-sonnet-5'));
$maxtokens = max(200, min(2000, (int)($promptdata['maxTokens'] ?? 700)));

// The stable block carries cache_control so a learner's second and later
// questions in the same unit read it from cache instead of re-sending ~30k
// tokens. The volatile tail rides in its own uncached block after it.
$systemblocks = [
    ['type' => 'text', 'text' => $system, 'cache_control' => ['type' => 'ephemeral']],
];
if (trim($volatile) !== '') {
    $systemblocks[] = ['type' => 'text', 'text' => $volatile];
}
$request = [
    'model' => $model,
    'max_tokens' => $maxtokens,
    'system' => $systemblocks,
    'messages' => $conversation,
];
if ($tooldefs) {
    $request['tools'] = $tooldefs;
}
$body = json_encode($request, JSON_UNESCAPED_UNICODE);

// Transient upstream failures are retried HERE rather than shown to the
// learner. A rate limit (429) or an overloaded model (529) is a wait, not an
// answer, and the canned hint that a surfaced failure produces is a far worse
// reply than a two-second pause. Only these two plus 5xx are retried: a 400
// is our own bad request and would fail identically every time.
$response = false;
$status = 0;
$upstreamerror = '';
for ($attempt = 0; $attempt < 3; $attempt++) {
    if ($attempt > 0) {
        // 1s then 3s. Well inside the browser's patience, and long enough for
        // a per-minute allowance to free up after a burst of questions.
        sleep($attempt === 1 ? 1 : 3);
    }
    $curl = curl_init('https://api.anthropic.com/v1/messages');
    if ($curl === false) {
        pqh_wehel_json(500, ['ok' => false, 'message' => 'Wehel is unavailable right now.']);
    }
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'x-api-key: ' . $apikey,
            'anthropic-version: 2023-06-01',
        ],
    ]);
    $response = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $curlerror = curl_error($curl);
    curl_close($curl);

    if ($response !== false && $status >= 200 && $status < 300) {
        break;
    }
    $upstreamerror = $response === false ? ('connection: ' . $curlerror) : ('http ' . $status);
    $retryable = $response === false || $status === 429 || $status === 529 || $status >= 500;
    if (!$retryable) {
        break;
    }
}

if ($response === false || $status < 200 || $status >= 300) {
    // The upstream status rides along so a failure can be diagnosed from the
    // browser's network tab instead of guessing. It names no secret — the key
    // never appears in a response body.
    debugging('Wehel upstream failure: ' . $upstreamerror, DEBUG_DEVELOPER);
    pqh_wehel_json(502, [
        'ok' => false,
        'message' => 'Wehel could not answer just now. Please try again.',
        'upstream' => $upstreamerror,
    ]);
}
$result = json_decode((string)$response, true);

// What this exchange cost, added to the day's running totals before either
// answer leaves. It is recorded HERE rather than in the allowance block above
// because the usage does not exist until the API has answered — and it is
// recorded on the tool-call path too, since a tool round is a real call that
// was really paid for. The time fields are rewritten unchanged: this write and
// the one above are the same five-field ledger, and dropping the last-seen
// stamp here would restart the clock on every question.
$pqh_wehel_usage = is_array($result['usage'] ?? null) ? $result['usage'] : [];
if ($pqh_wehel_usage && $pqh_wehel_learnerid > 0) {
    $pqh_wehel_time['tokens'] += pqh_wehel_token_total($pqh_wehel_usage);
    $pqh_wehel_time['weighted'] += pqh_wehel_token_weight($pqh_wehel_usage);
    set_user_preference('local_hubredirect_wehel_time',
        $pqh_wehel_today . '|' . $pqh_wehel_time['used'] . '|' . $pqh_wehel_now
        . '|' . $pqh_wehel_time['tokens'] . '|' . $pqh_wehel_time['weighted'], $pqh_wehel_learnerid);
}

// A tool call goes back to the client, which holds the course data and will
// re-post with the tool_result appended.
foreach ((array)($result['content'] ?? []) as $block) {
    if (is_array($block) && ($block['type'] ?? '') === 'tool_use') {
        pqh_wehel_json(200, [
            'ok' => true,
            'toolUse' => ['id' => $block['id'] ?? '', 'name' => $block['name'] ?? '', 'input' => $block['input'] ?? new stdClass()],
            'assistantContent' => $result['content'],
            'model' => $model,
            'time' => $pqh_wehel_time,
        ]);
    }
}
$reply = '';
foreach ((array)($result['content'] ?? []) as $block) {
    if (is_array($block) && ($block['type'] ?? '') === 'text') {
        $reply .= (string)($block['text'] ?? '');
    }
}
$reply = trim($reply);
if ($reply === '') {
    pqh_wehel_json(502, ['ok' => false, 'message' => 'Wehel could not answer just now. Please try again.']);
}
$reply = pqh_wehel_canonicalise($reply, pqh_wehel_phrases($promptdata, $subject));

// The day's ledger rides the answer: the panel's timer is a reading of this
// count, not a second clock of its own that could drift away from it.
pqh_wehel_json(200, ['ok' => true, 'reply' => $reply, 'model' => $model, 'time' => $pqh_wehel_time]);
