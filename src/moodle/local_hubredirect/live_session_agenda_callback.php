<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$key = optional_param('key', '', PARAM_ALPHANUMEXT);

function pqlagc_json_response(int $error): void {
    @header('Content-Type: application/json');
    echo json_encode(['error' => $error]);
    exit;
}

function pqlagc_fetch_url(string $url): string {
    if (!preg_match('#^https?://#i', $url) || !function_exists('curl_init')) {
        return '';
    }
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        return '';
    }
    return (string)$bytes;
}

try {
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        pqlagc_json_response(1);
    }
    $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
    if (!$session) {
        pqlagc_json_response(1);
    }
    if (!pqh_record_belongs_to_consumer_context($session)) {
        pqlagc_json_response(1);
    }
    if (!pqh_live_session_agenda_signature_valid($session, $key) || empty($session->agenda_slides_path)) {
        pqlagc_json_response(1);
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode((string)$raw, true);
    if (!is_array($payload)) {
        pqlagc_json_response(1);
    }
    $status = (int)($payload['status'] ?? 0);
    if (!in_array($status, [2, 6], true)) {
        pqlagc_json_response(0);
    }
    $url = trim((string)($payload['url'] ?? ''));
    if ($url === '') {
        pqlagc_json_response(1);
    }

    $bytes = pqlagc_fetch_url($url);
    if ($bytes === '') {
        pqlagc_json_response(1);
    }
    $mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    $config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
    $path = trim((string)$session->agenda_slides_path);
    if (pqh_live_session_agenda_template_from_marker($path) !== null) {
        $filename = clean_filename((string)($session->agenda_slides_filename ?? 'live-session-agenda.pptx'));
        if ($filename === '') {
            $filename = 'live-session-agenda.pptx';
        }
        $path = pqh_live_session_agenda_storage_path($sessionid, $filename);
    }
    pqh_upload_bytes_to_bunny_storage($path, $bytes, $mimetype, $config);

    $session->agenda_slides_path = $path;
    $session->agenda_slides_mimetype = $mimetype;
    $session->agenda_slides_size = strlen($bytes);
    $session->agenda_slides_uploadedat = time();
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    if (pqh_table_exists_safe('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $sessionid,
            'actorid' => 0,
            'action' => 'agenda_slides_online_saved',
            'targettype' => 'session',
            'targetid' => $sessionid,
            'details' => json_encode(['status' => $status, 'size' => strlen($bytes), 'editor' => 'onlyoffice']),
            'timecreated' => time(),
        ]);
    }
    pqlagc_json_response(0);
} catch (Throwable $e) {
    debugging('Agenda editor callback failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
    pqlagc_json_response(1);
}
