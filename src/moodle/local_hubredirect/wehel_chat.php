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
if ($raw === false || strlen($raw) > 600 * 1024) {
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
    // client's get_unit tool loop sends tool_use/tool_result turns as blocks.
    if (is_array($content)) {
        $encoded = json_encode($content, JSON_UNESCAPED_UNICODE);
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
    if (core_text::strlen($unitcontent) > 120000) {
        $unitcontent = core_text::substr($unitcontent, 0, 120000) . ' …(unit content truncated)';
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
$modehints = (array)($promptdata['modeHints'] ?? []);
if ($modehint !== '' && isset($modehints[$modehint])) {
    $system .= "\n\n" . (string)$modehints[$modehint];
}
// Preferred teaching language — only languages the prompt source defines are
// honoured, and the block itself (e.g. Somali-for-vocabulary-only) lives in
// wehel_prompt.json. Mirror of the same step in tools/lib/wehel-dev-chat.js.
$teachinglanguage = core_text::strtolower(trim((string)($payload['teachingLanguage'] ?? '')));
$languageblock = ($promptdata['languageSupport'] ?? [])[$teachinglanguage] ?? null;
if (is_array($languageblock) && $languageblock) {
    $system .= "\n\n" . implode("\n", array_map('strval', $languageblock));
}
// Where the learner is standing right now. The dock opens over any lesson
// page, so "I don't get this" has a referent.
$sectionhint = $clean($payload['sectionHint'] ?? '', 80);
if ($sectionhint !== '') {
    $system .= "\n\nThe learner is on the \"" . $sectionhint . "\" page of this unit right now, and is most likely asking about what is on it.";
}

// --- call the Anthropic API ---------------------------------------------------

$apikey = pqh_wehel_config('anthropic_api_key', 'local_prequran_anthropic_api_key', 'ANTHROPIC_API_KEY');
if ($apikey === '') {
    pqh_wehel_json(503, ['ok' => false, 'message' => 'Wehel is not configured on this server.']);
}
$model = pqh_wehel_config('wehel_model', 'local_prequran_wehel_model', 'WEHEL_MODEL', (string)($promptdata['model'] ?? 'claude-sonnet-5'));
$maxtokens = max(200, min(2000, (int)($promptdata['maxTokens'] ?? 700)));

$request = [
    'model' => $model,
    'max_tokens' => $maxtokens,
    'system' => $system,
    'messages' => $conversation,
];
if ($tooldefs) {
    $request['tools'] = $tooldefs;
}
$body = json_encode($request, JSON_UNESCAPED_UNICODE);

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
curl_close($curl);

if ($response === false || $status < 200 || $status >= 300) {
    pqh_wehel_json(502, ['ok' => false, 'message' => 'Wehel could not answer just now. Please try again.']);
}
$result = json_decode((string)$response, true);
// A tool call goes back to the client, which holds the course data and will
// re-post with the tool_result appended.
foreach ((array)($result['content'] ?? []) as $block) {
    if (is_array($block) && ($block['type'] ?? '') === 'tool_use') {
        pqh_wehel_json(200, [
            'ok' => true,
            'toolUse' => ['id' => $block['id'] ?? '', 'name' => $block['name'] ?? '', 'input' => $block['input'] ?? new stdClass()],
            'assistantContent' => $result['content'],
            'model' => $model,
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

pqh_wehel_json(200, ['ok' => true, 'reply' => $reply, 'model' => $model]);
