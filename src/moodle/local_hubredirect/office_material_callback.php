<?php
declare(strict_types=1);

define('NO_DEBUG_DISPLAY', true);
define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/office_materials_lib.php');

$materialid = optional_param('materialid', 0, PARAM_INT);
$key = optional_param('key', '', PARAM_ALPHANUMEXT);
$consumercontext = pqh_requested_consumer_context();
$material = false;
$PQHOC_DOWNLOAD_ATTEMPTS = [];

function pqhoc_json_response(int $error): void {
    @header('Content-Type: application/json');
    echo json_encode(['error' => $error]);
    exit;
}

function pqhoc_debug_trim($value) {
    if (is_array($value)) {
        $trimmed = [];
        foreach ($value as $key => $item) {
            $trimmed[$key] = pqhoc_debug_trim($item);
        }
        return $trimmed;
    }
    if (is_string($value) && strlen($value) > 700) {
        return substr($value, 0, 700) . '...';
    }
    return $value;
}

function pqhoc_log_failure($material, string $event, array $details = []): void {
    $materialid = $material && !empty($material->id) ? (int)$material->id : 0;
    error_log('Office material callback ' . $event . ' materialid=' . $materialid . ' details=' . json_encode(pqhoc_debug_trim($details)));
}

function pqhoc_base64url_decode(string $value): string {
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    return $decoded === false ? '' : $decoded;
}

function pqhoc_jwt_payload(string $token, string $secret): array {
    $parts = explode('.', trim($token));
    if (count($parts) !== 3 || $secret === '') {
        return [];
    }
    $header = json_decode(pqhoc_base64url_decode($parts[0]), true);
    if (!is_array($header) || strtoupper((string)($header['alg'] ?? '')) !== 'HS256') {
        return [];
    }
    $expected = pqh_base64url_encode(hash_hmac('sha256', $parts[0] . '.' . $parts[1], $secret, true));
    if (!hash_equals($expected, $parts[2])) {
        return [];
    }
    $payload = json_decode(pqhoc_base64url_decode($parts[1]), true);
    if (!is_array($payload)) {
        return [];
    }
    if (isset($payload['exp']) && (int)$payload['exp'] > 0 && (int)$payload['exp'] < time()) {
        return [];
    }
    return $payload;
}

function pqhoc_authorization_bearer(): string {
    $header = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim((string)$matches[1]);
    }
    return '';
}

function pqhoc_callback_payload(string $raw): array {
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        $payload = [];
    }
    $secret = trim((string)get_config('local_prequran', 'onlyoffice_jwt_secret'));
    $tokens = [];
    if (!empty($payload['token'])) {
        $tokens[] = (string)$payload['token'];
    }
    $bearer = pqhoc_authorization_bearer();
    if ($bearer !== '') {
        $tokens[] = $bearer;
    }
    foreach ($tokens as $token) {
        $decoded = pqhoc_jwt_payload($token, $secret);
        if ($decoded) {
            if (isset($decoded['payload']) && is_array($decoded['payload'])) {
                $decoded = $decoded['payload'];
            } else if (isset($decoded['payload']) && is_string($decoded['payload'])) {
                $nested = json_decode($decoded['payload'], true);
                if (is_array($nested)) {
                    $decoded = $nested;
                }
            }
            $payload = array_replace($payload, $decoded);
            break;
        }
    }
    return $payload;
}

function pqhoc_fetch_url(string $url, string $token = ''): string {
    global $PQHOC_DOWNLOAD_ATTEMPTS;
    if (!preg_match('#^https?://#i', $url) || !function_exists('curl_init')) {
        $PQHOC_DOWNLOAD_ATTEMPTS[] = [
            'url' => $url,
            'valid_http_url' => false,
            'curl_available' => function_exists('curl_init'),
            'used_token' => $token !== '',
        ];
        return '';
    }
    $started = microtime(true);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_USERAGENT, 'QuraanAcademy-OnlyOfficeCallback/1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    if ($token !== '') {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
    }
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $contenttype = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    $parts = parse_url($url);
    $PQHOC_DOWNLOAD_ATTEMPTS[] = [
        'url' => $url,
        'host' => (string)($parts['host'] ?? ''),
        'used_token' => $token !== '',
        'http_status' => $status,
        'curl_errno' => $errno,
        'curl_error' => $error,
        'content_type' => $contenttype,
        'bytes' => is_string($bytes) ? strlen($bytes) : 0,
        'seconds' => round(microtime(true) - $started, 3),
    ];
    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        debugging('Office material callback download failed: errno=' . $errno . ' status=' . $status . ' error=' . $error, DEBUG_DEVELOPER);
        return '';
    }
    return (string)$bytes;
}

function pqhoc_public_docserver_download_url(string $url): string {
    $docserver = rtrim(trim((string)get_config('local_prequran', 'onlyoffice_document_server_url')), '/');
    if ($docserver === '' || !preg_match('#^https?://#i', $url)) {
        return '';
    }
    $source = parse_url($url);
    $base = parse_url($docserver);
    if (!is_array($source) || !is_array($base) || empty($base['scheme']) || empty($base['host'])) {
        return '';
    }
    $sourcehost = strtolower((string)($source['host'] ?? ''));
    $basehost = strtolower((string)($base['host'] ?? ''));
    if ($sourcehost === '' || $sourcehost === $basehost) {
        return '';
    }
    $rebuilt = (string)$base['scheme'] . '://' . (string)$base['host'];
    if (!empty($base['port'])) {
        $rebuilt .= ':' . (int)$base['port'];
    }
    $basepath = rtrim((string)($base['path'] ?? ''), '/');
    $sourcepath = '/' . ltrim((string)($source['path'] ?? ''), '/');
    $rebuilt .= $basepath . $sourcepath;
    if (!empty($source['query'])) {
        $rebuilt .= '?' . (string)$source['query'];
    }
    return $rebuilt;
}

function pqhoc_fetch_onlyoffice_file(string $url, string $token = ''): string {
    $candidates = [$url];
    $publicurl = pqhoc_public_docserver_download_url($url);
    if ($publicurl !== '' && !in_array($publicurl, $candidates, true)) {
        $candidates[] = $publicurl;
    }
    foreach ($candidates as $candidate) {
        $bytes = pqhoc_fetch_url($candidate, $token);
        if ($bytes !== '') {
            return $bytes;
        }
        if ($token !== '') {
            $bytes = pqhoc_fetch_url($candidate);
            if ($bytes !== '') {
                return $bytes;
            }
        }
    }
    return '';
}

try {
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        error_log('Office material callback failed: material table missing for materialid=' . $materialid);
        pqhoc_json_response(1);
    }
    $material = $materialid > 0 ? $DB->get_record('local_prequran_workspace_material', ['id' => $materialid, 'status' => 'active'], '*', IGNORE_MISSING) : false;
    if (!$material || !pqho_material_signature_valid($material, $key) || !pqho_material_editor_supported($material)) {
        pqhoc_log_failure($material, 'material_validation_failed', [
            'materialid' => $materialid,
            'has_material' => (bool)$material,
            'signature_valid' => $material ? pqho_material_signature_valid($material, $key) : false,
            'editor_supported' => $material ? pqho_material_editor_supported($material) : false,
        ]);
        pqhoc_json_response(1);
    }
    if (!pqho_signed_material_context_allowed($material, $consumercontext)) {
        pqhoc_log_failure($material, 'consumer_context_rejected', [
            'workspaceid' => (int)$material->workspaceid,
            'requested_workspaceid' => optional_param('workspaceid', 0, PARAM_INT),
            'consumer' => (string)($consumercontext->consumerslug ?? ''),
            'context_workspaceid' => (int)($consumercontext->workspaceid ?? 0),
        ]);
        pqhoc_json_response(1);
    }
    $raw = (string)file_get_contents('php://input');
    $payload = pqhoc_callback_payload($raw);
    if (!is_array($payload)) {
        pqhoc_log_failure($material, 'payload_invalid', ['raw_length' => strlen($raw)]);
        pqhoc_json_response(1);
    }
    $status = (int)($payload['status'] ?? 0);
    if (!in_array($status, [2, 6], true)) {
        pqhoc_json_response(0);
    }
    $url = trim((string)($payload['url'] ?? ''));
    if ($url === '') {
        pqhoc_log_failure($material, 'save_url_missing', ['status' => $status, 'payload_keys' => array_keys($payload)]);
        pqhoc_json_response(1);
    }
    $downloadtoken = trim((string)($payload['token'] ?? ''));
    $bytes = pqhoc_fetch_onlyoffice_file($url, $downloadtoken);
    if ($bytes === '') {
        global $PQHOC_DOWNLOAD_ATTEMPTS;
        pqhoc_log_failure($material, 'download_failed', [
            'status' => $status,
            'source_url' => $url,
            'public_retry_url' => pqhoc_public_docserver_download_url($url),
            'attempts' => $PQHOC_DOWNLOAD_ATTEMPTS,
        ]);
        pqhoc_json_response(1);
    }
    $metadata = pqh_workspace_material_bunny_metadata($material);
    $path = trim((string)($metadata['bunny_path'] ?? ''));
    if ($path === '') {
        $path = pqwm_bunny_path((int)$material->workspaceid, (int)$material->id, pqh_workspace_material_filename($material));
        $metadata['bunny_path'] = $path;
    }
    $mimetype = trim((string)($metadata['uploaded_mimetype'] ?? 'application/octet-stream'));
    pqho_upload_bytes_to_bunny($path, $bytes, $mimetype);
    $metadata['uploaded_size'] = strlen($bytes);
    $metadata['last_onlyoffice_save_at'] = time();
    $metadata['last_onlyoffice_status'] = $status;
    unset($metadata['last_onlyoffice_debug'], $metadata['onlyoffice_debug_history']);
    $material->metadatajson = json_encode($metadata);
    $material->timemodified = time();
    if (pqh_table_has_field_safe('local_prequran_workspace_material', 'updatedby')) {
        $material->updatedby = 0;
    }
    $DB->update_record('local_prequran_workspace_material', $material);
    if (pqh_table_exists_safe('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => 0,
            'action' => 'office_material_online_saved',
            'targettype' => 'workspace_material',
            'targetid' => (int)$material->id,
            'details' => json_encode(['workspaceid' => (int)$material->workspaceid, 'status' => $status, 'size' => strlen($bytes), 'editor' => 'onlyoffice']),
            'timecreated' => time(),
        ]);
    }
    pqhoc_json_response(0);
} catch (Throwable $e) {
    pqhoc_log_failure($material, 'callback_exception', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    debugging('Office material callback failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
    pqhoc_json_response(1);
}
