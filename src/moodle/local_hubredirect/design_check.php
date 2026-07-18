<?php
// Standalone OPcache diagnostic probe. No Moodle bootstrap. New filename on
// purpose: a fresh file is never in OPcache, so this code always runs current.
// Reports worker pid, OPcache ini config, and per-script cache staleness for
// the files in this directory; ?invalidate=1 force-recompiles them all.
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

$out = [
    'marker' => 'check-v67-20260719',
    'time' => gmdate('c'),
    'pid' => function_exists('getmypid') ? getmypid() : null,
    'sapi' => PHP_SAPI,
    'php' => PHP_VERSION,
    'docroot' => (string)($_SERVER['DOCUMENT_ROOT'] ?? ''),
    'dir' => __DIR__,
    'server_software' => (string)($_SERVER['SERVER_SOFTWARE'] ?? ''),
    'ini' => [
        'opcache.enable' => ini_get('opcache.enable'),
        'opcache.validate_timestamps' => ini_get('opcache.validate_timestamps'),
        'opcache.revalidate_freq' => ini_get('opcache.revalidate_freq'),
        'opcache.restrict_api' => ini_get('opcache.restrict_api'),
        'user_ini.filename' => ini_get('user_ini.filename'),
        'user_ini.cache_ttl' => ini_get('user_ini.cache_ttl'),
    ],
];

if (isset($_GET['invalidate']) && $_GET['invalidate'] === '1' && function_exists('opcache_invalidate')) {
    $inv = [];
    foreach (glob(__DIR__ . '/*.php') as $path) {
        $inv[basename($path)] = opcache_invalidate($path, true) ? 'ok' : 'no';
    }
    $out['invalidated'] = $inv;
}

if (function_exists('opcache_get_status')) {
    $status = @opcache_get_status(true);
    if (is_array($status)) {
        $out['opcache_enabled'] = (bool)($status['opcache_enabled'] ?? false);
        $out['cached_scripts_total'] = isset($status['scripts']) ? count($status['scripts']) : 0;
        $stale = [];
        $fresh = [];
        if (!empty($status['scripts'])) {
            foreach ($status['scripts'] as $path => $info) {
                if (strpos($path, 'hubredirect') === false) {
                    continue;
                }
                $name = basename($path);
                $cachedmtime = (int)($info['timestamp'] ?? 0);
                $diskmtime = is_file($path) ? (int)filemtime($path) : 0;
                $row = [
                    'cached_file_mtime' => $cachedmtime > 0 ? gmdate('Y-m-d H:i:s', $cachedmtime) : 'n/a',
                    'disk_mtime' => $diskmtime > 0 ? gmdate('Y-m-d H:i:s', $diskmtime) : 'n/a',
                    'hits' => (int)($info['hits'] ?? 0),
                ];
                if ($cachedmtime > 0 && $diskmtime > 0 && $cachedmtime < $diskmtime) {
                    $stale[$name] = $row;
                } else {
                    $fresh[$name] = $row;
                }
            }
        }
        ksort($stale);
        ksort($fresh);
        $out['stale_scripts'] = $stale;
        $out['fresh_scripts_count'] = count($fresh);
    } else {
        $out['opcache_status'] = 'unavailable (restrict_api?)';
    }
} else {
    $out['opcache_status'] = 'opcache_get_status missing';
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
