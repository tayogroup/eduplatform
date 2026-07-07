<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqwm_fields(string $table, array $wanted): string {
    $fields = [];
    foreach ($wanted as $field) {
        if (pqh_table_has_field_safe($table, $field)) {
            $fields[] = $field;
        }
    }
    return $fields ? implode(',', $fields) : '*';
}
function pqwm_uploaded_file(array $upload): ?array {
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($upload['tmp_name']) || !is_uploaded_file((string)$upload['tmp_name'])) {
        throw new invalid_parameter_exception('The uploaded material file could not be read.');
    }
    $filename = clean_filename((string)($upload['name'] ?? 'material'));
    if ($filename === '') {
        $filename = 'material';
    }
    return [
        'tmpname' => (string)$upload['tmp_name'],
        'filename' => $filename,
        'mimetype' => trim((string)($upload['type'] ?? '')) ?: 'application/octet-stream',
        'size' => (int)($upload['size'] ?? 0),
    ];
}

function pqwm_bunny_config(): array {
    $zone = trim((string)get_config('local_prequran', 'bunny_storage_zone'));
    $host = trim((string)get_config('local_prequran', 'bunny_storage_host'));
    $accesskey = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));
    $prefix = trim((string)get_config('local_prequran', 'bunny_workspace_material_prefix'));

    if ($host === '') {
        $host = 'storage.bunnycdn.com';
    }
    if ($prefix === '') {
        $prefix = 'pre_quraan/workspace_materials';
    }
    $prefix = trim(str_replace('\\', '/', $prefix), '/');

    if ($zone === '' || $accesskey === '' || !function_exists('curl_init')) {
        throw new invalid_parameter_exception('Bunny storage is not configured for workspace material uploads.');
    }

    return [
        'zone' => $zone,
        'host' => $host,
        'accesskey' => $accesskey,
        'prefix' => $prefix,
    ];
}

function pqwm_safe_path_part(string $value, string $fallback): string {
    $value = clean_param($value, PARAM_FILE);
    $value = trim($value, ". \t\n\r\0\x0B");
    return $value !== '' ? $value : $fallback;
}

function pqwm_encode_storage_path(string $path): string {
    $parts = array_filter(explode('/', str_replace('\\', '/', $path)), function($part) {
        return $part !== '' && $part !== '.' && $part !== '..';
    });
    return implode('/', array_map('rawurlencode', $parts));
}

function pqwm_bunny_path(int $workspaceid, int $materialid, string $filename): string {
    $config = pqwm_bunny_config();
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $basename = pathinfo($filename, PATHINFO_FILENAME);
    $safe = pqwm_safe_path_part($basename, 'material');
    if ($extension !== '') {
        $safe .= '.' . pqwm_safe_path_part($extension, 'file');
    }
    return $config['prefix'] . '/workspace_' . $workspaceid . '/material_' . $materialid . '/' . time() . '_' . $safe;
}

function pqwm_upload_to_bunny(string $path, string $tmpname, string $mimetype): void {
    $config = pqwm_bunny_config();
    $bytes = file_get_contents($tmpname);
    if ($bytes === false) {
        throw new invalid_parameter_exception('The uploaded material file could not be read.');
    }

    $url = 'https://' . $config['host'] . '/' . rawurlencode($config['zone']) . '/' . pqwm_encode_storage_path($path);
    $headers = [
        'AccessKey: ' . $config['accesskey'],
        'Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'),
        'Content-Length: ' . strlen($bytes),
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $bytes);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $response === false) {
        throw new invalid_parameter_exception('The material file could not be saved to Bunny storage.');
    }
}

function pqwm_download_url(int $workspaceid, int $materialid): string {
    return (new moodle_url('/local/hubredirect/workspace_materials.php', [
        'workspaceid' => $workspaceid,
        'action' => 'download',
        'materialid' => $materialid,
    ]))->out(false);
}

function pqwm_can_view_material(stdClass $material, int $userid): bool {
    global $DB;
    $workspaceid = (int)($material->workspaceid ?? 0);
    $materialid = (int)($material->id ?? 0);
    if ($workspaceid <= 0 || $materialid <= 0) {
        return false;
    }
    if (!pqh_consumer_context_allows_workspace(null, $workspaceid)) {
        return false;
    }
    if (pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
        return true;
    }
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return false;
    }
    if ($DB->record_exists_select(
        'local_prequran_workspace_mat_assign',
        'workspaceid = ? AND materialid = ? AND targetid = ? AND status = ?',
        [$workspaceid, $materialid, $userid, 'active']
    )) {
        return true;
    }
    $guardianlinks = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqh_table_exists_safe($table)) {
            $guardianlinks[] = "EXISTS (SELECT 1 FROM {{$table}} gl WHERE gl.studentid = a.targetid AND gl.guardianid = :guardianid)";
        }
    }
    if (!$guardianlinks) {
        return false;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_workspace_mat_assign} a
          WHERE a.workspaceid = :workspaceid
            AND a.materialid = :materialid
            AND a.target_type = :targettype
            AND a.status = :status
            AND (" . implode(' OR ', $guardianlinks) . ")",
        [
            'workspaceid' => $workspaceid,
            'materialid' => $materialid,
            'targettype' => 'student',
            'status' => 'active',
            'guardianid' => $userid,
        ]
    );
}

function pqwm_stream_bunny_material(stdClass $material): void {
    $metadata = json_decode((string)($material->metadatajson ?? ''), true);
    if (!is_array($metadata) || empty($metadata['bunny_path'])) {
        throw new invalid_parameter_exception('Material file is not available.');
    }

    $config = pqwm_bunny_config();
    $url = 'https://' . $config['host'] . '/' . rawurlencode($config['zone']) . '/' . pqwm_encode_storage_path((string)$metadata['bunny_path']);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['AccessKey: ' . $config['accesskey']]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        throw new invalid_parameter_exception('Material file could not be loaded.');
    }

    $filename = clean_filename((string)($metadata['uploaded_filename'] ?? $material->title ?? 'material'));
    $mimetype = (string)($metadata['uploaded_mimetype'] ?? 'application/octet-stream');
    @header('Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'));
    @header('Content-Length: ' . strlen($bytes));
    @header('Content-Disposition: inline; filename="' . str_replace('"', '', $filename) . '"');
    @header('Cache-Control: private, max-age=300');
    @header('X-Content-Type-Options: nosniff');
    echo $bytes;
    exit;
}

function pqwm_insert_material(int $workspaceid): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        throw new invalid_parameter_exception('Workspace material table is not ready. Run the local_prequran Moodle upgrade.');
    }
    $title = trim(optional_param('title', '', PARAM_TEXT));
    if ($title === '') {
        throw new invalid_parameter_exception('Material title is required.');
    }
    $now = time();
    $metadata = ['created_from' => 'workspace_materials'];
    $upload = isset($_FILES['material_file']) && is_array($_FILES['material_file']) ? pqwm_uploaded_file($_FILES['material_file']) : null;
    if ($upload) {
        pqwm_bunny_config();
        $metadata['uploaded_filename'] = $upload['filename'];
        $metadata['uploaded_mimetype'] = $upload['mimetype'];
        $metadata['uploaded_size'] = $upload['size'];
        $metadata['storage'] = 'bunny';
    }

    $record = (object)[
        'workspaceid' => $workspaceid,
        'title' => $title,
        'material_type' => optional_param('material_type', 'link', PARAM_ALPHANUMEXT),
        'course_key' => trim(optional_param('course_key', '', PARAM_ALPHANUMEXT)),
        'description' => trim(optional_param('description', '', PARAM_TEXT)),
        'source_url' => trim(optional_param('source_url', '', PARAM_URL)),
        'metadatajson' => json_encode($metadata),
        'visibility' => optional_param('visibility', 'workspace', PARAM_ALPHANUMEXT),
        'status' => 'active',
        'createdby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $columns = $DB->get_columns('local_prequran_workspace_material');
    foreach (array_keys((array)$record) as $field) {
        if (!array_key_exists($field, $columns)) {
            unset($record->{$field});
        }
    }
    $materialid = (int)$DB->insert_record('local_prequran_workspace_material', $record);
    if ($upload) {
        pqwm_store_uploaded_file($workspaceid, $materialid, $upload);
    }
}

function pqwm_store_uploaded_file(int $workspaceid, int $materialid, array $upload): void {
    global $DB;
    $filename = (string)$upload['filename'];
    $path = pqwm_bunny_path($workspaceid, $materialid, $filename);
    pqwm_upload_to_bunny($path, (string)$upload['tmpname'], (string)$upload['mimetype']);

    if (pqh_table_exists_safe('local_prequran_workspace_material')) {
        $material = $DB->get_record('local_prequran_workspace_material', ['id' => $materialid], '*', IGNORE_MISSING);
        if ($material) {
            $metadata = json_decode((string)($material->metadatajson ?? ''), true);
            if (!is_array($metadata)) {
                $metadata = [];
            }
            $metadata['uploaded_filename'] = $filename;
            $metadata['uploaded_mimetype'] = (string)$upload['mimetype'];
            $metadata['uploaded_size'] = (int)$upload['size'];
            $metadata['storage'] = 'bunny';
            $metadata['bunny_path'] = $path;
            $material->metadatajson = json_encode($metadata);
            $material->source_url = pqwm_download_url($workspaceid, $materialid);
            $material->timemodified = time();
            $DB->update_record('local_prequran_workspace_material', $material);
        }
    }
}