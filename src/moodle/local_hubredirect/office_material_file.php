<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/office_materials_lib.php');

$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
$materialid = optional_param('materialid', 0, PARAM_INT);
$returnurl = new moodle_url('/local/hubredirect/teacher_office.php', $workspaceid > 0 ? ['workspaceid' => $workspaceid] : []);

if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
    pqh_access_denied('Workspace material table is not ready.', $returnurl, 'Material unavailable');
}
$material = $materialid > 0 ? $DB->get_record('local_prequran_workspace_material', ['id' => $materialid, 'status' => 'active'], '*', IGNORE_MISSING) : false;
if (!$material
        || ($workspaceid > 0 && (int)$material->workspaceid !== $workspaceid)
        || (!pqwm_can_view_material($material, (int)$USER->id) && !pqho_user_can_edit_material($material, (int)$USER->id))) {
    pqh_access_denied('You cannot open this material.', $returnurl, 'Material access required');
}
try {
    $bytes = pqho_material_bytes($material);
} catch (Throwable $e) {
    pqh_access_denied($e->getMessage(), $returnurl, 'Material unavailable');
}
$filename = pqh_workspace_material_filename($material);
$metadata = pqh_workspace_material_bunny_metadata($material);
$mimetype = trim((string)($metadata['uploaded_mimetype'] ?? 'application/octet-stream'));
@header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'));
@header('Content-Length: ' . strlen($bytes));
@header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
@header('Cache-Control: private, max-age=300');
@header('X-Content-Type-Options: nosniff');
echo $bytes;
exit;
