<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/office_materials_lib.php');

$materialid = optional_param('materialid', 0, PARAM_INT);
$key = optional_param('key', '', PARAM_ALPHANUMEXT);
$consumercontext = pqh_requested_consumer_context();

function pqhos_fail(string $message, int $status = 404): void {
    http_response_code($status);
    @header('Content-Type: text/plain; charset=utf-8');
    @header('X-Content-Type-Options: nosniff');
    echo $message;
    exit;
}

if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
    pqhos_fail('Workspace material table is not ready.', 503);
}
$material = $materialid > 0 ? $DB->get_record('local_prequran_workspace_material', ['id' => $materialid, 'status' => 'active'], '*', IGNORE_MISSING) : false;
if (!$material || !pqho_material_signature_valid($material, $key) || !pqho_material_editor_supported($material)) {
    pqhos_fail('Material was not found.', 403);
}
if (!pqho_signed_material_context_allowed($material, $consumercontext)) {
    pqhos_fail('Material was not found.', 403);
}
try {
    $bytes = pqho_material_bytes($material);
} catch (Throwable $e) {
    pqhos_fail('Material file could not be loaded.', 502);
}
$filename = pqh_workspace_material_filename($material);
$metadata = pqh_workspace_material_bunny_metadata($material);
$mimetype = trim((string)($metadata['uploaded_mimetype'] ?? 'application/octet-stream'));

@header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'));
@header('Content-Length: ' . strlen($bytes));
@header('Content-Disposition: inline; filename="' . str_replace('"', '', $filename) . '"');
@header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
@header('Pragma: no-cache');
@header('Expires: 0');
@header('X-Content-Type-Options: nosniff');
echo $bytes;
exit;
