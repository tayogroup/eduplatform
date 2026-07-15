<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_drift_json_response(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function pqh_drift_read_token_file(string $filepath): string {
    $realpath = realpath($filepath);
    if ($realpath === false || dirname($realpath) !== __DIR__ || !is_readable($realpath)) {
        return '';
    }
    $token = trim((string)file_get_contents($realpath));
    return $token !== '' && strpos($token, "\n") === false ? $token : '';
}

function pqh_drift_configured_token(): string {
    global $CFG;

    $candidates = [
        (string)getenv('EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN'),
        defined('EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN') ? (string)constant('EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN') : '',
        isset($CFG->eduplatform_deployment_drift_token) ? (string)$CFG->eduplatform_deployment_drift_token : '',
        function_exists('get_config') ? (string)get_config('local_hubredirect', 'deployment_drift_token') : '',
        pqh_drift_read_token_file(__DIR__ . '/.deployment_drift_token'),
        pqh_drift_read_token_file(__DIR__ . '/deployment_drift_token.txt'),
    ];

    foreach ($candidates as $candidate) {
        $candidate = trim($candidate);
        if ($candidate !== '') {
            return $candidate;
        }
    }
    return '';
}

$configuredtoken = pqh_drift_configured_token();
if ($configuredtoken !== '') {
    $providedtoken = optional_param('token', '', PARAM_RAW);
    if (!hash_equals($configuredtoken, $providedtoken)) {
        pqh_drift_json_response(403, [
            'ok' => false,
            'error' => 'invalid_token',
        ]);
    }
} else {
    if (!isloggedin() || isguestuser()) {
        pqh_drift_json_response(401, [
            'ok' => false,
            'error' => 'authentication_required',
            'message' => 'Configure EDUPLATFORM_DEPLOYMENT_DRIFT_TOKEN, CFG eduplatform_deployment_drift_token, or local/hubredirect/.deployment_drift_token for CLI checksum checks.',
        ]);
    }
    if (!is_siteadmin()) {
        pqh_drift_json_response(403, [
            'ok' => false,
            'error' => 'site_admin_required',
        ]);
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
