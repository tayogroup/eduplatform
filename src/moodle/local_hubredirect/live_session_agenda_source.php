<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$key = optional_param('key', '', PARAM_ALPHANUMEXT);

function pqlags_fail(string $message, int $status = 404): void {
    http_response_code($status);
    @header('Content-Type: text/plain; charset=utf-8');
    @header('X-Content-Type-Options: nosniff');
    echo $message;
    exit;
}

if (!pqh_table_exists_safe('local_prequran_live_session')) {
    pqlags_fail('Live session tables are not installed.', 503);
}
$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqlags_fail('Live session was not found.');
}
if (!pqh_record_belongs_to_consumer_context($session)) {
    pqlags_fail('Live session was not found.');
}
if (!pqh_live_session_agenda_signature_valid($session, $key)) {
    pqlags_fail('Invalid agenda access key.', 403);
}
if (empty($session->agenda_slides_path)) {
    pqlags_fail('No agenda slides are attached to this live session yet.');
}

try {
    $bytes = pqh_live_session_agenda_bytes($session);
} catch (Throwable $e) {
    pqlags_fail('Agenda slides could not be loaded.', 502);
}
$filename = clean_filename((string)($session->agenda_slides_filename ?? 'live-session-agenda.pptx'));
if ($filename === '') {
    $filename = 'live-session-agenda.pptx';
}
$mimetype = trim((string)($session->agenda_slides_mimetype ?? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'));

@header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'));
@header('Content-Length: ' . strlen($bytes));
@header('Content-Disposition: inline; filename="' . str_replace('"', '', $filename) . '"');
@header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
@header('Pragma: no-cache');
@header('Expires: 0');
@header('X-Content-Type-Options: nosniff');
echo $bytes;
exit;
