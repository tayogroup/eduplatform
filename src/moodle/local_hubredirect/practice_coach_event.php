<?php
// Server-side Practice Coach endpoint for supervised practice live sessions.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_practice_coach_origin_allowed(string $origin): bool {
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

function pqh_practice_coach_send_cors(): void {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    if (pqh_practice_coach_origin_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

function pqh_practice_coach_json(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function pqh_practice_coach_table_exists(string $table): bool {
    global $DB;

    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqh_practice_coach_column_exists(string $table, string $column): bool {
    global $DB;

    try {
        $columns = $DB->get_columns($table);
        return array_key_exists($column, $columns);
    } catch (Throwable $e) {
        return false;
    }
}

function pqh_practice_coach_audit(int $sessionid, int $studentid, string $action, array $details = []): void {
    global $DB;

    if (!pqh_practice_coach_table_exists('local_prequran_live_audit')) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $sessionid,
            'actorid' => 0,
            'action' => $action,
            'targettype' => 'student',
            'targetid' => $studentid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // Audit must never block the student-facing coach response.
    }
}

function pqh_practice_coach_clean_key($value, int $max = 100): string {
    $clean = preg_replace('/[^a-zA-Z0-9_\-:.]/', '', trim((string)$value));
    return core_text::substr($clean ?? '', 0, $max);
}

function pqh_practice_coach_clean_sentence(string $value, int $max = 220): string {
    $value = trim(preg_replace('/\s+/', ' ', strip_tags($value)) ?? '');
    $value = str_replace(["\r", "\n", "\t"], ' ', $value);
    $value = preg_replace('/https?:\/\/\S+/i', '', $value) ?? $value;
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return core_text::substr($value, 0, $max);
}

function pqh_practice_coach_valid_ws_token(string $token, int $userid): bool {
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
        $record = $DB->get_record('external_tokens', ['token' => $token], 'id, userid, validuntil', IGNORE_MISSING);
        if (!$record) {
            return false;
        }
        $validuntil = (int)($record->validuntil ?? 0);
        if ($validuntil !== 0 && $validuntil <= time()) {
            return false;
        }
        return $userid <= 0 || (int)($record->userid ?? 0) === $userid;
    } catch (Throwable $e) {
        return false;
    }
}

function pqh_practice_coach_ai_rewrite(string $templatekey, string $base, string $stepname, string $trigger): array {
    $enabled = (string)get_config('local_prequran', 'practice_coach_ai_rewrite_enabled') === '1';
    $apikey = trim((string)get_config('local_prequran', 'practice_coach_openai_api_key'));
    $model = trim((string)get_config('local_prequran', 'practice_coach_openai_model'));
    if (!$enabled || $apikey === '' || $model === '' || !function_exists('curl_init')) {
        return ['message' => $base, 'source' => 'rule_based', 'model' => ''];
    }

    $prompt = "Rewrite this approved child-safety coaching template in one warm sentence, 22 words or fewer. Keep the same instruction. Do not add new advice, links, contact instructions, promises, names, or religious/legal/medical claims.\nTemplate key: {$templatekey}\nStep: {$stepname}\nTrigger: {$trigger}\nApproved template: {$base}";
    $body = json_encode([
        'model' => $model,
        'input' => [
            [
                'role' => 'system',
                'content' => 'You rewrite approved learning coach templates for children. You must preserve intent and keep responses short, safe, and classroom-appropriate.',
            ],
            [
                'role' => 'user',
                'content' => $prompt,
            ],
        ],
        'max_output_tokens' => 80,
    ]);

    $ch = curl_init('https://api.openai.com/v1/responses');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apikey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 8,
    ]);
    $response = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($response === false || $status < 200 || $status >= 300) {
        return ['message' => $base, 'source' => 'rule_based', 'model' => ''];
    }
    $json = json_decode((string)$response, true);
    $text = '';
    if (is_array($json)) {
        if (isset($json['output_text']) && is_string($json['output_text'])) {
            $text = $json['output_text'];
        } else if (!empty($json['output']) && is_array($json['output'])) {
            foreach ($json['output'] as $item) {
                foreach (($item['content'] ?? []) as $content) {
                    if (($content['type'] ?? '') === 'output_text' && isset($content['text'])) {
                        $text .= ' ' . (string)$content['text'];
                    }
                }
            }
        }
    }
    $text = pqh_practice_coach_clean_sentence($text);
    $wordcount = str_word_count($text);
    if ($text === '' || $wordcount > 28 || preg_match('/\b(secret|private message|meet me|call me|phone|email|link|http|medical|lawyer)\b/i', $text)) {
        return ['message' => $base, 'source' => 'rule_based', 'model' => ''];
    }
    return ['message' => $text, 'source' => 'ai_rewrite', 'model' => $model];
}

function pqh_practice_coach_message(string $trigger, array $payload): array {
    $stepid = strtolower(pqh_practice_coach_clean_key($payload['step_id'] ?? '', 60));
    $stepnames = [
        'lecture' => 'Lecture',
        'rules' => 'Rules',
        'listen' => 'Listen',
        'watch' => 'Watch',
        'phonetics' => 'Phonetics',
        'practice' => 'Practice',
        'quiz' => 'Quiz',
    ];
    $stepname = $stepnames[$stepid] ?? 'your current step';

    $messages = [
        'practice_start' => 'Assalamu alaikum. I am your Chatbot Practice Coach. I will help while you practise. Start with one small step and keep your lesson screen open.',
        'idle_nudge' => 'Let us come back to the lesson. Try one small action in ' . $stepname . ' now.',
        'screen_return' => 'Please stay on the lesson screen so your progress is saved. When you are ready, continue with ' . $stepname . '.',
        'focus_return' => 'Good, you are back. Keep going with the next small activity in ' . $stepname . '.',
        'progress_check' => 'Nice steady work. If something feels hard, repeat the current item once, then continue.',
        'step_changed' => 'You are now on ' . $stepname . '. Take it slowly and finish the next activity.',
    ];

    $templatekey = array_key_exists($trigger, $messages) ? $trigger : 'progress_check';
    $base = $messages[$templatekey];
    $rewrite = pqh_practice_coach_ai_rewrite($templatekey, $base, $stepname, $trigger);
    $autospeak = (string)get_config('local_prequran', 'practice_coach_autospeak') !== '0';

    return [
        'message' => $rewrite['message'],
        'base_message' => $base,
        'template_key' => $templatekey,
        'message_source' => $rewrite['source'],
        'ai_model' => $rewrite['model'],
        'autospeak' => $autospeak,
    ];
}

function pqh_practice_coach_recommendation(string $trigger, array $payload, int $userid, int $liveid): array {
    global $DB;

    $stepid = pqh_practice_coach_clean_key($payload['step_id'] ?? '', 60);
    $idlecount = max(0, (int)($payload['idle_count'] ?? 0));
    $leavecount = max(0, (int)($payload['leave_count'] ?? 0));
    if (pqh_practice_coach_table_exists('local_prequran_practice_coach_event')) {
        try {
            $recentidle = (int)$DB->count_records_select(
                'local_prequran_practice_coach_event',
                'live_sessionid = ? AND userid = ? AND trigger_key = ? AND timecreated >= ?',
                [$liveid, $userid, 'idle_nudge', time() - (15 * MINSECS)]
            );
            $recentaway = (int)$DB->count_records_select(
                'local_prequran_practice_coach_event',
                'live_sessionid = ? AND userid = ? AND trigger_key IN (?, ?) AND timecreated >= ?',
                [$liveid, $userid, 'screen_return', 'focus_return', time() - (15 * MINSECS)]
            );
            $idlecount = max($idlecount, $recentidle);
            $leavecount = max($leavecount, $recentaway);
        } catch (Throwable $e) {
            // Keep recommendation local and best-effort.
        }
    }

    if ($idlecount >= 3 || $leavecount >= 3) {
        return [
            'key' => 'teacher_followup',
            'message' => 'Teacher follow-up recommended if this pattern continues.',
        ];
    }
    if ($trigger === 'idle_nudge' || $trigger === 'screen_return') {
        return [
            'key' => 'repeat_current_step',
            'message' => 'Repeat the current step once before moving forward.',
        ];
    }
    if ($stepid === 'listen' && $trigger === 'step_changed') {
        return [
            'key' => 'complete_listen_then_quiz',
            'message' => 'Complete Listen, then continue to the next practice item.',
        ];
    }
    return [
        'key' => 'continue_current_lesson',
        'message' => 'Continue the current lesson at a steady pace.',
    ];
}

pqh_practice_coach_send_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_practice_coach_json(405, ['ok' => false, 'message' => 'Use POST.']);
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    pqh_practice_coach_json(400, ['ok' => false, 'message' => 'Invalid JSON.']);
}

$userid = (int)($payload['userid'] ?? 0);
$liveid = (int)($payload['live_sessionid'] ?? 0);
$token = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));

if (!pqh_practice_coach_valid_ws_token($token, $userid)) {
    require_login();
    global $USER;
    if ($userid > 0 && (int)$USER->id !== $userid) {
        pqh_practice_coach_json(403, ['ok' => false, 'message' => 'Practice Coach access is not available for this user.']);
    }
}

if ((string)get_config('local_prequran', 'practice_coach_enabled') === '0') {
    pqh_practice_coach_json(200, ['ok' => true, 'message' => '', 'reason' => 'disabled']);
}

if ($userid <= 0 || $liveid <= 0) {
    pqh_practice_coach_json(400, ['ok' => false, 'message' => 'Missing live session or user.']);
}

if (!pqh_practice_coach_table_exists('local_prequran_live_session') ||
        !pqh_practice_coach_table_exists('local_prequran_live_participant')) {
    pqh_practice_coach_json(200, ['ok' => true, 'message' => '', 'reason' => 'live_schema_missing']);
}

global $DB;
$session = $DB->get_record('local_prequran_live_session', ['id' => $liveid], '*', IGNORE_MISSING);
if (!$session) {
    pqh_practice_coach_json(200, ['ok' => true, 'message' => '', 'reason' => 'session_not_found']);
}
if (!pqh_record_belongs_to_consumer_context($session)) {
    pqh_practice_coach_json(200, ['ok' => true, 'message' => '', 'reason' => 'session_scope_mismatch']);
}

$sessiontype = pqh_practice_coach_column_exists('local_prequran_live_session', 'session_type')
    ? strtolower(trim((string)($session->session_type ?? 'teacher_led')))
    : 'teacher_led';
$teacherrequired = pqh_practice_coach_column_exists('local_prequran_live_session', 'teacher_required')
    ? (int)($session->teacher_required ?? 1)
    : 1;
if ($sessiontype !== 'supervised_practice' && $teacherrequired !== 0) {
    pqh_practice_coach_json(200, ['ok' => true, 'message' => '', 'reason' => 'not_supervised_practice']);
}

$status = strtolower(trim((string)($session->status ?? 'scheduled')));
if (in_array($status, ['cancelled', 'completed', 'failed'], true)) {
    pqh_practice_coach_json(200, ['ok' => true, 'message' => '', 'reason' => 'session_closed']);
}

$participant = $DB->get_record('local_prequran_live_participant', [
    'sessionid' => $liveid,
    'userid' => $userid,
    'role' => 'student',
], 'id, status', IGNORE_MISSING);
if (!$participant || strtolower((string)($participant->status ?? 'active')) !== 'active') {
    pqh_practice_coach_json(403, ['ok' => false, 'message' => 'Practice Coach is only available to students enrolled in this practice session.']);
}

global $SESSION;
$now = time();
$window = 60;
$limit = 24;
if (empty($SESSION->local_hubredirect_practice_coach_window) || !is_array($SESSION->local_hubredirect_practice_coach_window)) {
    $SESSION->local_hubredirect_practice_coach_window = ['start' => $now, 'count' => 0];
}
if (($now - (int)$SESSION->local_hubredirect_practice_coach_window['start']) > $window) {
    $SESSION->local_hubredirect_practice_coach_window = ['start' => $now, 'count' => 0];
}
$SESSION->local_hubredirect_practice_coach_window['count'] = (int)$SESSION->local_hubredirect_practice_coach_window['count'] + 1;
if ($SESSION->local_hubredirect_practice_coach_window['count'] > $limit) {
    pqh_practice_coach_json(429, ['ok' => false, 'message' => 'Practice Coach is receiving too many events.']);
}

$trigger = pqh_practice_coach_clean_key($payload['trigger'] ?? 'progress_check', 60);
$allowedtriggers = ['practice_start', 'idle_nudge', 'screen_return', 'focus_return', 'progress_check', 'step_changed'];
if (!in_array($trigger, $allowedtriggers, true)) {
    $trigger = 'progress_check';
}

$coach = pqh_practice_coach_message($trigger, $payload);
$recommendation = pqh_practice_coach_recommendation($trigger, $payload, $userid, $liveid);
$message = $coach['message'];
$logged = false;
$eventid = 0;

if (pqh_practice_coach_table_exists('local_prequran_practice_coach_event')) {
    $record = (object)[
        'environment' => pqh_practice_coach_clean_key($payload['environment'] ?? 'production', 30),
        'live_sessionid' => $liveid,
        'userid' => $userid,
        'lessonid' => pqh_practice_coach_clean_key($payload['lessonid'] ?? ($session->lessonid ?? ''), 100),
        'unitid' => pqh_practice_coach_clean_key($payload['unitid'] ?? ($session->unitid ?? ''), 100),
        'step_id' => pqh_practice_coach_clean_key($payload['step_id'] ?? '', 80),
        'event_type' => pqh_practice_coach_clean_key($payload['event_type'] ?? '', 40),
        'trigger_key' => $trigger,
        'message' => $message,
        'meta_json' => json_encode([
            'reason' => (string)($payload['reason'] ?? ''),
            'leave_count' => (int)($payload['leave_count'] ?? 0),
            'idle_count' => (int)($payload['idle_count'] ?? 0),
            'active_ms' => (int)($payload['active_ms'] ?? 0),
            'session_type' => $sessiontype,
        ]),
        'coach_status' => 'delivered',
        'timecreated' => $now,
    ];
    $optionalfields = [
        'template_key' => pqh_practice_coach_clean_key($coach['template_key'] ?? '', 80),
        'base_message' => (string)($coach['base_message'] ?? ''),
        'message_source' => pqh_practice_coach_clean_key($coach['message_source'] ?? 'rule_based', 40),
        'ai_model' => pqh_practice_coach_clean_key($coach['ai_model'] ?? '', 80),
        'recommendation_key' => pqh_practice_coach_clean_key($recommendation['key'] ?? '', 80),
        'recommendation_message' => (string)($recommendation['message'] ?? ''),
    ];
    foreach ($optionalfields as $field => $value) {
        if (pqh_practice_coach_column_exists('local_prequran_practice_coach_event', $field)) {
            $record->{$field} = $value;
        }
    }
    try {
        $eventid = (int)$DB->insert_record('local_prequran_practice_coach_event', $record);
        $logged = true;
    } catch (Throwable $e) {
        $logged = false;
    }
}

pqh_practice_coach_audit($liveid, $userid, 'practice_coach_intervention', [
    'eventid' => $eventid,
    'trigger' => $trigger,
    'template_key' => (string)($coach['template_key'] ?? ''),
    'message_source' => (string)($coach['message_source'] ?? 'rule_based'),
    'recommendation_key' => (string)($recommendation['key'] ?? ''),
    'voice_autospeak' => (bool)$coach['autospeak'],
]);
if (in_array($trigger, ['idle_nudge', 'screen_return', 'focus_return'], true)) {
    pqh_practice_coach_audit($liveid, $userid, 'student_away_idle_event', [
        'eventid' => $eventid,
        'trigger' => $trigger,
        'idle_count' => (int)($payload['idle_count'] ?? 0),
        'leave_count' => (int)($payload['leave_count'] ?? 0),
    ]);
}

pqh_practice_coach_json(200, [
    'ok' => true,
    'coach' => 'Chatbot Practice Coach',
    'message' => $message,
    'autospeak' => (bool)$coach['autospeak'],
    'trigger' => $trigger,
    'template_key' => (string)($coach['template_key'] ?? ''),
    'message_source' => (string)($coach['message_source'] ?? 'rule_based'),
    'recommendation' => $recommendation,
    'logged' => $logged,
]);
