<?php
// Public, tokenless PreQuraan practice-cadence read endpoint. The static
// PreQuraan app (app.quraan.academy) fetches this at load to overlay the
// headmaster-set cadence (passes / repeats / gap / echo) for a consumer+level
// onto the unit JSON defaults. It returns ONLY non-sensitive integers, so it
// needs no auth: CORS is open (no credentials) and the response is cacheable.
// An unknown consumer/level falls back to the canonical defaults so the app
// always receives a usable answer and never breaks when Moodle has no override.
//
//   GET practice_config.php?consumer=quraan-academy&level=0
//   -> {ok:true, consumer, level, source, practice:{listen:{passes,repeats,gapMs,echo}}}
//
// The cadence is authored by Quraan Academy workspace admins on the
// prequran-practice-settings portal page and stored on the consumer's workspace
// (settingsjson['prequran_practice'][<level>]). This endpoint only READS it.

define('NO_MOODLE_COOKIES', true); // stateless + cacheable, no session started
define('NO_DEBUG_DISPLAY', true);

require(__DIR__ . '/../../config.php');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$default = ['passes' => 2, 'repeats' => 1, 'gapMs' => 700, 'echo' => false];
$slug = optional_param('consumer', '', PARAM_ALPHANUMEXT);
$level = optional_param('level', 0, PARAM_INT);

$cadence = $default;
$source = 'default';

// Best-effort: on any DB/schema issue (e.g. consumer tables not installed on a
// given site) we simply serve the defaults rather than error — the app must
// always get a usable cadence.
if ($slug !== '') {
    try {
        $consumer = $DB->get_record('local_prequran_consumer', ['slug' => $slug], 'id, primaryworkspaceid', IGNORE_MISSING);
        $workspaceid = $consumer ? (int)($consumer->primaryworkspaceid ?? 0) : 0;
        if ($workspaceid > 0) {
            $ws = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], 'id, settingsjson', IGNORE_MISSING);
            if ($ws) {
                $settings = json_decode((string)($ws->settingsjson ?? ''), true);
                $store = (is_array($settings) && isset($settings['prequran_practice']) && is_array($settings['prequran_practice']))
                    ? $settings['prequran_practice'] : [];
                if (isset($store[(string)$level]) && is_array($store[(string)$level])) {
                    $row = $store[(string)$level];
                    $cadence = [
                        'passes' => max(1, min(20, (int)($row['passes'] ?? $default['passes']))),
                        'repeats' => max(1, min(20, (int)($row['repeats'] ?? $default['repeats']))),
                        'gapMs' => max(0, min(10000, (int)($row['gapMs'] ?? $default['gapMs']))),
                        'echo' => !empty($row['echo']),
                    ];
                    $source = 'workspace';
                }
            }
        }
    } catch (Throwable $e) {
        $cadence = $default;
        $source = 'default';
    }
}

echo json_encode([
    'ok' => true,
    'consumer' => $slug,
    'level' => $level,
    'source' => $source,
    'practice' => ['listen' => $cadence],
], JSON_UNESCAPED_SLASHES);
