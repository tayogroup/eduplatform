<?php
// Read-only diagnostic: shows ONLY the host/wwwroot-related lines of
// config.php so the allowed-domains list can be extended safely.
// Lines containing credentials are never emitted. Delete after use.

define('NO_MOODLE_COOKIES', true);
require_once(__DIR__ . '/../../config.php');

$key = isset($_GET['k']) ? (string)$_GET['k'] : '';
if (!hash_equals('bff9103454fb45b8b165606d2393b4a0', $key)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Not found';
    exit;
}

header('Content-Type: application/json');
header('Cache-Control: no-store');

global $CFG;
$out = ['marker' => 'config-host-v93', 'wwwroot_seen' => (string)$CFG->wwwroot];

$path = $CFG->dirroot . '/config.php';
$lines = @file($path, FILE_IGNORE_NEW_LINES);
$matches = [];
if (is_array($lines)) {
    foreach ($lines as $i => $line) {
        if (preg_match('/dbpass|dbuser|dbname|dbhost|password|salt|secret/i', $line)) {
            continue;
        }
        if (preg_match('/wwwroot|HTTP_HOST|SERVER_NAME|host|domain/i', $line)) {
            $matches[] = ['line' => $i + 1, 'text' => rtrim($line)];
        }
    }
}
$out['host_lines'] = $matches;
$out['total_lines'] = is_array($lines) ? count($lines) : -1;

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
