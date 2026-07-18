<?php
// Standalone deploy-verification probe. No Moodle bootstrap.
// Reports the on-disk state (mtime, size, md5) of the PHP files in this
// directory so a deploy can be confirmed remotely, and optionally resets
// OPcache when stale compiled code is suspected.
// Requires the access key; reveals nothing without it.

$key = isset($_GET['k']) ? (string)$_GET['k'] : '';
if (!hash_equals('bff9103454fb45b8b165606d2393b4a0', $key)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Not found';
    exit;
}

header('Content-Type: application/json');
header('Cache-Control: no-store');

$out = ['marker' => 'v66-20260719', 'time' => gmdate('c'), 'php' => PHP_VERSION];

if (isset($_GET['reset']) && $_GET['reset'] === '1') {
    $out['opcache_reset'] = function_exists('opcache_reset') ? (opcache_reset() ? 'done' : 'failed') : 'unavailable';
}

$files = [];
foreach (glob(__DIR__ . '/*.php') as $path) {
    $name = basename($path);
    $files[$name] = [
        'mtime' => gmdate('Y-m-d H:i:s', (int)filemtime($path)),
        'size' => (int)filesize($path),
        'md5' => md5_file($path),
    ];
}
ksort($files);
$out['files'] = $files;

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
