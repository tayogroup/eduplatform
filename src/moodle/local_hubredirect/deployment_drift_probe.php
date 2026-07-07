<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$configuredtoken = (string)getenv('EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN');
if ($configuredtoken !== '') {
    $providedtoken = required_param('token', PARAM_RAW);
    if (!hash_equals($configuredtoken, $providedtoken)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => 'invalid_token',
        ], JSON_PRETTY_PRINT);
        exit;
    }
} else {
    require_login();
    if (!is_siteadmin()) {
        pqh_access_denied(
            'Deployment drift checks require a site administrator or EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN.',
            new moodle_url('/local/hubredirect/dashboard.php'),
            'Deployment drift access denied'
        );
    }
}

$files = [];
foreach (glob(__DIR__ . '/*.php') ?: [] as $filepath) {
    $realpath = realpath($filepath);
    if ($realpath === false || dirname($realpath) !== __DIR__) {
        continue;
    }
    $files[] = [
        'name' => basename($realpath),
        'size' => filesize($realpath),
        'sha256' => hash_file('sha256', $realpath),
        'mtime' => filemtime($realpath),
    ];
}
usort($files, static function (array $left, array $right): int {
    return strcmp((string)$left['name'], (string)$right['name']);
});

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
echo json_encode([
    'ok' => true,
    'generatedat' => time(),
    'directory' => 'local/hubredirect',
    'files' => $files,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
