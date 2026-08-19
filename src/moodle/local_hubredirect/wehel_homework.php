<?php
// The learner's real assigned homework, for Wehel the AI tutor.
//
// Read-only. Two sources, merged into one list the tutor can name tasks from:
//
//   1. The workspace homework system (local_prequran_homework +
//      local_prequran_homework_sub) — teacher-assigned tasks with instructions,
//      due dates and points, the same rows student-homework.php renders.
//      Open work only: assigned / in_progress / returned.
//   2. The BBB live-class homework loop (local_prequran_live_note.homework and
//      its Phase 24 structured fields) — what the teacher set after a live
//      session, from recent classes.
//
// The client (shell/wehel.js :: fetchWehelHomework) calls this once per page
// load and sends the formatted list with every tutoring request; wehel_chat.php
// folds it into the prompt's homeworkBlock. A learner the platform cannot
// resolve — the configured shared ws_token names nobody — gets an empty list,
// never an error: the tutor simply has no homework to talk about, which is
// also what every learner without homework gets. Same CORS/auth model as
// wehel_chat.php: the app lives on the CDN, so the signed launch token is the
// credential that actually arrives (see accesslib.php::pqh_launch_token_userid).

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_wehel_hw_origin_allowed(string $origin): bool {
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

function pqh_wehel_hw_send_cors(): void {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    if (pqh_wehel_hw_origin_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

function pqh_wehel_hw_json(int $status, array $payload): void {
    http_response_code($status);
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// Teacher instructions arrive as HTML from the editor; the tutor wants prose.
function pqh_wehel_hw_text(string $html, int $max = 800): string {
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = trim(preg_replace('/\s+/u', ' ', $text));
    return core_text::substr($text, 0, $max);
}

function pqh_wehel_hw_due_label(int $timestamp): string {
    return $timestamp > 0 ? userdate($timestamp, '%d %b %Y') : '';
}

pqh_wehel_hw_send_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_wehel_hw_json(405, ['ok' => false, 'message' => 'Use POST.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 64 * 1024) {
    pqh_wehel_hw_json(400, ['ok' => false, 'message' => 'The request is too large.']);
}
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    $payload = [];
}

// --- who is asking --------------------------------------------------------------
// Same credential order as wehel_chat.php, but this endpoint additionally needs
// a USER, not just a valid caller: homework rows are the learner's own. The
// configured shared ws_token authenticates the call yet names nobody — that
// caller gets an empty list rather than a guess.
$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
$userid = 0;
if ($requesttoken !== '') {
    $configured = trim((string)get_config('local_prequran', 'ws_token'));
    if ($configured !== '' && hash_equals($configured, $requesttoken)) {
        $userid = 0; // valid shared token, anonymous caller
    } else {
        try {
            $record = $DB->get_record('external_tokens', ['token' => $requesttoken], 'id, userid, validuntil', IGNORE_MISSING);
            if ($record && ((int)($record->validuntil ?? 0) === 0 || (int)$record->validuntil > time())) {
                $userid = (int)$record->userid;
            } else {
                $requesttoken = ''; // not a usable ws token — fall through to the launch token
            }
        } catch (Throwable $e) {
            $requesttoken = '';
        }
    }
}
if ($userid <= 0 && $requesttoken === '') {
    $userid = pqh_launch_token_userid($payload);
    if ($userid <= 0) {
        require_login();
        $userid = (int)$USER->id;
    }
}
if ($userid <= 0) {
    pqh_wehel_hw_json(200, ['ok' => true, 'homework' => []]);
}

if (!pqh_api_rate_limit_ok('wehel_homework', $userid, 30)) {
    pqh_wehel_hw_json(429, ['ok' => false, 'message' => 'Please wait a moment.']);
}

$items = [];

// --- source 1: workspace homework -----------------------------------------------
if (pqh_table_exists_safe('local_prequran_homework') && pqh_table_exists_safe('local_prequran_homework_sub')) {
    try {
        $rows = $DB->get_records_sql(
            "SELECT s.id, s.status, h.title, h.instructions, h.duedate, h.maxpoints, c.fullname AS coursename
               FROM {local_prequran_homework_sub} s
               JOIN {local_prequran_homework} h ON h.id = s.homeworkid
               JOIN {course} c ON c.id = h.moodlecourseid
              WHERE s.studentid = :studentid
                AND h.status = :published
                AND s.status IN ('assigned', 'in_progress', 'returned')
           ORDER BY CASE WHEN h.duedate > 0 THEN h.duedate ELSE 9999999999 END ASC, h.id DESC",
            ['studentid' => $userid, 'published' => 'published'],
            0,
            8
        );
        foreach ($rows as $row) {
            $items[] = [
                'source' => 'workspace',
                'title' => pqh_wehel_hw_text((string)$row->title, 160),
                'course' => pqh_wehel_hw_text((string)$row->coursename, 120),
                'text' => pqh_wehel_hw_text((string)$row->instructions),
                'dueLabel' => pqh_wehel_hw_due_label((int)$row->duedate),
                'status' => (string)$row->status,
                'points' => (int)$row->maxpoints,
            ];
        }
    } catch (Throwable $e) {
        // A source that cannot be read contributes nothing — never an error:
        // the other source's homework should still reach the tutor.
    }
}

// --- source 2: live-class homework -----------------------------------------------
// Homework set on a live session's note, from classes in the last 45 days
// (or with a due date still ahead). The Phase 24 structured fields may not
// exist on an older schema, so they are selected conditionally, the same way
// live_schedulelib.php does.
if (pqh_table_exists_safe('local_prequran_live_note') && pqh_table_exists_safe('local_prequran_live_session')) {
    try {
        $structured = pqh_table_has_field_safe('local_prequran_live_note', 'homework_unitid');
        $homeworkselect = $structured
            ? "n.homework_unitid, n.homework_due_date, n.homework_priority"
            : "'' AS homework_unitid, 0 AS homework_due_date, 'normal' AS homework_priority";
        $recent = time() - 45 * DAYSECS;
        $rows = $DB->get_records_sql(
            "SELECT n.id, n.homework, {$homeworkselect}, s.title AS classtitle, s.scheduled_start
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE n.studentid = :studentid
                AND n.homework <> ''
                AND (s.scheduled_start >= :recent" . ($structured ? " OR n.homework_due_date >= :today" : "") . ")
           ORDER BY s.scheduled_start DESC",
            ['studentid' => $userid, 'recent' => $recent] + ($structured ? ['today' => time()] : []),
            0,
            8
        );
        foreach ($rows as $row) {
            $short = pqh_wehel_hw_text((string)$row->homework, 160);
            $full = pqh_wehel_hw_text((string)$row->homework);
            $items[] = [
                'source' => 'live-class',
                'title' => $short,
                'classTitle' => pqh_wehel_hw_text((string)$row->classtitle, 120)
                    . ($row->scheduled_start ? ' (' . userdate((int)$row->scheduled_start, '%d %b') . ')' : ''),
                // The homework text IS the title when it is short — sending it
                // twice would print the same sentence twice in the prompt.
                'text' => $full === $short ? '' : $full,
                'dueLabel' => pqh_wehel_hw_due_label((int)$row->homework_due_date),
                'priority' => (string)$row->homework_priority,
                'unitid' => (string)$row->homework_unitid,
            ];
        }
    } catch (Throwable $e) {
        // Same rule as above: a broken source is an empty source.
    }
}

pqh_wehel_hw_json(200, ['ok' => true, 'homework' => array_slice($items, 0, 10)]);
