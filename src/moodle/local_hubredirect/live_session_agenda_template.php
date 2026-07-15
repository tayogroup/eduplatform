<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$returnurl = new moodle_url(
    $workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php',
    $urlparams
);
$templatevariant = strtolower(trim(optional_param('lang', optional_param('templatevariant', 'en', PARAM_ALPHA), PARAM_ALPHA)));
if (!in_array($templatevariant, ['ar', 'en'], true)) {
    $templatevariant = 'en';
}
$template = pqh_live_session_agenda_template_variant($templatevariant);

function pqlsat_can_download(int $userid): bool {
    if (pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if (pqh_user_has_role_shortname($userid, ['editingteacher', 'teacher', 'manager'])) {
        return true;
    }
    foreach (pqh_user_workspaces($userid) as $workspace) {
        $role = (string)($workspace->workspace_role ?? '');
        if (in_array($role, ['owner', 'admin', 'teacher', 'assistant_teacher'], true)) {
            return true;
        }
    }
    return false;
}

function pqlsat_encode_storage_path(string $path): string {
    $parts = array_filter(explode('/', str_replace('\\', '/', $path)), static function($part): bool {
        return $part !== '' && $part !== '.' && $part !== '..';
    });
    return implode('/', array_map('rawurlencode', $parts));
}

function pqlsat_fetch_with_curl(string $url, array $headers = []): ?string {
    if (!function_exists('curl_init')) {
        return null;
    }
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    if ($headers) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $bytes === false || $bytes === '') {
        return null;
    }
    return (string)$bytes;
}

function pqlsat_fetch_from_bunny_storage(array $template): ?string {
    $zone = trim((string)get_config('local_prequran', 'bunny_storage_zone'));
    $host = trim((string)get_config('local_prequran', 'bunny_storage_host'));
    $accesskey = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));
    if ($zone === '' || $accesskey === '') {
        return null;
    }
    if ($host === '') {
        $host = 'storage.bunnycdn.com';
    }
    $path = trim((string)get_config('local_prequran', (string)$template['configkey']));
    if ($path === '') {
        $path = (string)$template['path'];
    }
    $url = 'https://' . $host . '/' . rawurlencode($zone) . '/' . pqlsat_encode_storage_path($path);
    return pqlsat_fetch_with_curl($url, ['AccessKey: ' . $accesskey]);
}

if (!pqlsat_can_download((int)$USER->id)) {
    pqh_access_denied(
        'Only teachers and academy operations users can download the live-session agenda template.',
        $returnurl,
        'Live session template access required'
    );
}

$bytes = pqlsat_fetch_from_bunny_storage($template);
if ($bytes === null) {
    $bytes = pqlsat_fetch_with_curl(pqh_live_session_agenda_template_source_url($templatevariant)->out(false));
}
if ($bytes === null) {
    $bytes = pqh_live_session_agenda_local_template_bytes((string)$template['localfile']);
}
if ($bytes === null) {
    pqh_access_denied(
        'Live Session Agenda template could not be loaded. Please ask support to review the live-session template storage setup.',
        $returnurl,
        'Live session template unavailable'
    );
}

while (ob_get_level() > 0) {
    ob_end_clean();
}

$filename = (string)$template['filename'];
header('Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation');
header('Content-Length: ' . strlen($bytes));
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: private, max-age=300');
header('X-Content-Type-Options: nosniff');
echo $bytes;
exit;
