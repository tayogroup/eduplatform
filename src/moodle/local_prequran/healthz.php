<?php
// Lightweight health probe for uptime monitoring (UptimeRobot / load balancer).
// No login, no session, no PII — reports DB reachability + plugin version only.
// Returns HTTP 200 {"status":"ok",...} when healthy, 503 when the DB read fails.
define('NO_MOODLE_COOKIES', true);

require_once(__DIR__ . '/../../config.php');

global $DB;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ok = true;
$dbok = false;
$version = '';
try {
    // Cheapest possible liveness read.
    $DB->get_field_sql('SELECT 1', []);
    $dbok = true;
    $version = (string)get_config('local_prequran', 'version');
} catch (Throwable $e) {
    $ok = false;
}

http_response_code($ok ? 200 : 503);
echo json_encode([
    'status' => $ok ? 'ok' : 'error',
    'db' => $dbok ? 'up' : 'down',
    'component' => 'local_prequran',
    'version' => $version,
    'time' => time(),
], JSON_UNESCAPED_SLASHES);
