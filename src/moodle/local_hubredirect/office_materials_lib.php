<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/workspace_materials_files.php');

function pqho_allowed_types(): array {
    return [
        'word' => [
            'label' => 'Word document',
            'extension' => 'docx',
            'mimetype' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'documentType' => 'word',
            'default' => 'New Word document',
        ],
        'excel' => [
            'label' => 'Excel spreadsheet',
            'extension' => 'xlsx',
            'mimetype' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'documentType' => 'cell',
            'default' => 'New spreadsheet',
        ],
        'powerpoint' => [
            'label' => 'PowerPoint presentation',
            'extension' => 'pptx',
            'mimetype' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'documentType' => 'slide',
            'default' => 'New presentation',
        ],
        'pdf' => [
            'label' => 'PDF',
            'extension' => 'pdf',
            'mimetype' => 'application/pdf',
            'documentType' => 'pdf',
            'default' => 'New PDF notes',
        ],
    ];
}

function pqho_type_config(string $type): array {
    $types = pqho_allowed_types();
    $type = strtolower(trim($type));
    if (!isset($types[$type])) {
        throw new invalid_parameter_exception('Choose a valid ONLYOFFICE material type.');
    }
    return $types[$type] + ['type' => $type];
}

function pqho_filename(string $title, array $config): string {
    $base = clean_filename($title);
    if ($base === '') {
        $base = clean_filename((string)$config['default']);
    }
    $extension = (string)$config['extension'];
    if (strtolower(pathinfo($base, PATHINFO_EXTENSION)) !== $extension) {
        $base .= '.' . $extension;
    }
    return $base;
}

function pqho_zip_bytes(array $files): string {
    $tmp = tempnam(sys_get_temp_dir(), 'pqho_');
    if ($tmp === false) {
        throw new invalid_parameter_exception('Temporary document storage is not available.');
    }
    $zip = new ZipArchive();
    if ($zip->open($tmp, ZipArchive::OVERWRITE) !== true) {
        @unlink($tmp);
        throw new invalid_parameter_exception('The office document template could not be created.');
    }
    foreach ($files as $path => $content) {
        $zip->addFromString($path, $content);
    }
    $zip->close();
    $bytes = file_get_contents($tmp);
    @unlink($tmp);
    if ($bytes === false) {
        throw new invalid_parameter_exception('The office document template could not be read.');
    }
    return $bytes;
}

function pqho_blank_docx(): string {
    return pqho_zip_bytes([
        '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
        '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
        'word/document.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t></w:t></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>',
    ]);
}

function pqho_blank_xlsx(): string {
    return pqho_zip_bytes([
        '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/_rels/workbook.xml.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        'xl/workbook.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/worksheets/sheet1.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>',
    ]);
}

function pqho_blank_pptx(): string {
    return pqho_zip_bytes([
        '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>',
        '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>',
        'ppt/_rels/presentation.xml.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>',
        'ppt/presentation.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/></p:presentation>',
        'ppt/slides/slide1.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>',
    ]);
}

function pqho_blank_pdf(): string {
    $stream = "BT /F1 18 Tf 72 720 Td (New PDF notes) Tj ET\n";
    $objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        "4 0 obj\n<< /Length " . strlen($stream) . " >>\nstream\n" . $stream . "endstream\nendobj\n",
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ];
    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $object) {
        $offsets[] = strlen($pdf);
        $pdf .= $object;
    }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
    $pdf .= "0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";
    return $pdf;
}

function pqho_template_bytes(string $type): string {
    $templates = [
        'word' => 'blank.docx',
        'excel' => 'blank.xlsx',
        'powerpoint' => 'blank.pptx',
        'pdf' => 'blank.pdf',
    ];
    $filename = $templates[$type] ?? '';
    if ($filename === '') {
        return '';
    }
    $path = __DIR__ . '/office_templates/' . $filename;
    if (!is_readable($path)) {
        return '';
    }
    $bytes = file_get_contents($path);
    return $bytes === false ? '' : (string)$bytes;
}

function pqho_blank_bytes(string $type): string {
    $templatebytes = pqho_template_bytes($type);
    if ($templatebytes !== '') {
        return $templatebytes;
    }
    switch ($type) {
        case 'word':
            return pqho_blank_docx();
        case 'excel':
            return pqho_blank_xlsx();
        case 'powerpoint':
            return pqho_blank_pptx();
        case 'pdf':
            return pqho_blank_pdf();
    }
    throw new invalid_parameter_exception('Unsupported office material type.');
}

function pqho_upload_bytes_to_bunny(string $path, string $bytes, string $mimetype): void {
    $config = pqwm_bunny_config();
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($errno || $status < 200 || $status >= 300 || $response === false) {
        throw new invalid_parameter_exception('The office material could not be saved to Bunny storage.');
    }
}

function pqho_material_bytes(stdClass $material): string {
    $metadata = pqh_workspace_material_bunny_metadata($material);
    $path = trim((string)($metadata['bunny_path'] ?? ''));
    if ($path === '') {
        throw new invalid_parameter_exception('Office material file is not available.');
    }
    $config = pqwm_bunny_config();
    $url = 'https://' . $config['host'] . '/' . rawurlencode($config['zone']) . '/' . pqwm_encode_storage_path($path);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['AccessKey: ' . $config['accesskey']]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        throw new invalid_parameter_exception('Office material file could not be loaded.');
    }
    return (string)$bytes;
}

function pqho_material_signature(stdClass $material): string {
    $secret = trim((string)get_config('local_prequran', 'onlyoffice_jwt_secret'));
    if ($secret === '') {
        $secret = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));
    }
    if ($secret === '') {
        $secret = get_site_identifier();
    }
    $metadata = pqh_workspace_material_bunny_metadata($material);
    return hash_hmac('sha256', implode('|', [
        (int)$material->id,
        (int)$material->workspaceid,
        (string)($metadata['bunny_path'] ?? ''),
    ]), $secret);
}

function pqho_material_signature_valid(stdClass $material, string $key): bool {
    return hash_equals(pqho_material_signature($material), trim($key));
}

function pqho_signed_material_context_allowed(stdClass $material, ?stdClass $consumercontext = null): bool {
    $workspaceid = (int)($material->workspaceid ?? 0);
    if ($workspaceid <= 0) {
        return false;
    }
    $requestedworkspaceid = function_exists('optional_param') ? optional_param('workspaceid', 0, PARAM_INT) : 0;
    if ($requestedworkspaceid > 0) {
        return $requestedworkspaceid === $workspaceid;
    }
    return pqh_consumer_context_allows_workspace($consumercontext, $workspaceid);
}

function pqho_create_material(int $workspaceid, int $userid, string $type, string $title = '', string $coursekey = '', int $studentid = 0): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        throw new invalid_parameter_exception('Workspace material table is not ready. Run the local_prequran Moodle upgrade.');
    }
    if (!class_exists('ZipArchive') && in_array($type, ['word', 'excel', 'powerpoint'], true)) {
        throw new invalid_parameter_exception('PHP ZipArchive is required to create Office documents.');
    }
    $config = pqho_type_config($type);
    $title = trim($title) !== '' ? trim($title) : (string)$config['default'];
    $filename = pqho_filename($title, $config);
    $bytes = pqho_blank_bytes($type);
    $now = time();
    $createdfrom = pqho_user_is_student_in_workspace($userid, $workspaceid) && !pqh_user_can_teach_in_workspace($userid, $workspaceid)
        ? 'student_document_studio'
        : 'teacher_document_studio';
    $metadata = [
        'created_from' => $createdfrom,
        'office_type' => $type,
        'uploaded_filename' => $filename,
        'uploaded_mimetype' => (string)$config['mimetype'],
        'uploaded_size' => strlen($bytes),
        'storage' => 'bunny',
        'studentid' => $studentid > 0 ? $studentid : ($createdfrom === 'student_document_studio' ? $userid : 0),
    ];
    $record = (object)[
        'workspaceid' => $workspaceid,
        'title' => $title,
        'material_type' => $type === 'pdf' ? 'document' : 'course',
        'course_key' => trim($coursekey),
        'description' => '',
        'source_url' => '',
        'metadatajson' => json_encode($metadata),
        'visibility' => $createdfrom === 'student_document_studio' ? 'students' : 'teachers',
        'status' => 'active',
        'createdby' => $userid,
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
    $path = pqwm_bunny_path($workspaceid, $materialid, $filename);
    pqho_upload_bytes_to_bunny($path, $bytes, (string)$config['mimetype']);
    $material = $DB->get_record('local_prequran_workspace_material', ['id' => $materialid], '*', MUST_EXIST);
    $metadata['bunny_path'] = $path;
    $material->metadatajson = json_encode($metadata);
    $material->source_url = (new moodle_url('/local/hubredirect/office_material_file.php', ['workspaceid' => $workspaceid, 'materialid' => $materialid]))->out(false);
    $material->timemodified = time();
    $DB->update_record('local_prequran_workspace_material', $material);
    return $materialid;
}

function pqho_material_editor_supported(stdClass $material): bool {
    $extension = strtolower(pathinfo(pqh_workspace_material_filename($material), PATHINFO_EXTENSION));
    return in_array($extension, ['docx', 'xlsx', 'pptx', 'pdf'], true) && pqh_workspace_material_bunny_path($material) !== '';
}

function pqho_repair_starter_material_if_needed(stdClass $material): stdClass {
    global $DB;
    $metadata = pqh_workspace_material_bunny_metadata($material);
    if (!in_array((string)($metadata['created_from'] ?? ''), ['teacher_document_studio', 'student_document_studio'], true)
            || !empty($metadata['last_onlyoffice_save_at'])) {
        return $material;
    }
    $type = (string)($metadata['office_type'] ?? '');
    if ($type === '') {
        $extension = strtolower(pathinfo(pqh_workspace_material_filename($material), PATHINFO_EXTENSION));
        $type = ['docx' => 'word', 'xlsx' => 'excel', 'pptx' => 'powerpoint', 'pdf' => 'pdf'][$extension] ?? '';
    }
    $templatebytes = $type !== '' ? pqho_template_bytes($type) : '';
    if ($templatebytes === '') {
        return $material;
    }
    $currentsize = (int)($metadata['uploaded_size'] ?? 0);
    if ($currentsize > 0 && $currentsize >= (int)(strlen($templatebytes) * 0.75)) {
        return $material;
    }
    $path = trim((string)($metadata['bunny_path'] ?? ''));
    if ($path === '') {
        $path = pqwm_bunny_path((int)$material->workspaceid, (int)$material->id, pqh_workspace_material_filename($material));
        $metadata['bunny_path'] = $path;
    }
    $mimetype = trim((string)($metadata['uploaded_mimetype'] ?? 'application/octet-stream'));
    pqho_upload_bytes_to_bunny($path, $templatebytes, $mimetype);
    $metadata['uploaded_size'] = strlen($templatebytes);
    $metadata['starter_repaired_at'] = time();
    $material->metadatajson = json_encode($metadata);
    $material->timemodified = time();
    $DB->update_record('local_prequran_workspace_material', $material);
    return $material;
}

function pqho_material_document_type(stdClass $material): string {
    $extension = strtolower(pathinfo(pqh_workspace_material_filename($material), PATHINFO_EXTENSION));
    return ['docx' => 'word', 'xlsx' => 'cell', 'pptx' => 'slide', 'pdf' => 'pdf'][$extension] ?? 'word';
}

function pqho_user_can_edit_material(stdClass $material, int $userid): bool {
    global $DB;
    $workspaceid = (int)($material->workspaceid ?? 0);
    if ($workspaceid <= 0 || $userid <= 0) {
        return false;
    }
    if (pqh_user_can_teach_in_workspace($userid, $workspaceid) || pqh_user_can_manage_workspace($userid, $workspaceid)) {
        return true;
    }
    $metadata = pqh_workspace_material_bunny_metadata($material);
    if ((int)($material->createdby ?? 0) === $userid || (int)($metadata['studentid'] ?? 0) === $userid) {
        return pqho_user_is_student_in_workspace($userid, $workspaceid);
    }
    return false;
}

function pqho_user_is_student_in_workspace(int $userid, int $workspaceid): bool {
    global $DB;
    if ($userid <= 0 || $workspaceid <= 0) {
        return false;
    }
    if (pqh_table_exists_safe('local_prequran_workspace_member')
            && $DB->record_exists('local_prequran_workspace_member', [
                'workspaceid' => $workspaceid,
                'userid' => $userid,
                'workspace_role' => 'student',
                'status' => 'active',
            ])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')
            && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')
            && $DB->record_exists('local_prequran_student_profile', [
                'workspaceid' => $workspaceid,
                'userid' => $userid,
            ])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')
            && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')
            && $DB->record_exists('local_prequran_teacher_student', [
                'workspaceid' => $workspaceid,
                'studentid' => $userid,
                'status' => 'active',
            ])) {
        return true;
    }
    return false;
}

function pqho_user_can_use_workspace(int $userid, int $workspaceid): bool {
    global $DB;
    if ($userid <= 0 || $workspaceid <= 0) {
        return false;
    }
    if (pqh_user_can_teach_in_workspace($userid, $workspaceid) || pqh_user_can_manage_workspace($userid, $workspaceid)) {
        return true;
    }
    if (pqho_user_is_student_in_workspace($userid, $workspaceid)) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')
            && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')
            && $DB->record_exists('local_prequran_teacher_student', [
                'workspaceid' => $workspaceid,
                'teacherid' => $userid,
                'status' => 'active',
            ])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')
            && $DB->record_exists_select(
                'local_prequran_teacher_profile',
                'userid = :userid AND workspaceid = :workspaceid AND (status IS NULL OR status = :blank OR LOWER(status) NOT IN (:archived, :inactive, :rejected))',
                [
                    'userid' => $userid,
                    'workspaceid' => $workspaceid,
                    'blank' => '',
                    'archived' => 'archived',
                    'inactive' => 'inactive',
                    'rejected' => 'rejected',
                ]
            )) {
        return true;
    }
    return false;
}

function pqho_workspace_from_teacher_student(int $teacherid, int $studentid = 0): int {
    global $DB;
    if ($teacherid <= 0 || !pqh_table_exists_safe('local_prequran_teacher_student') || !pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        return 0;
    }
    $params = ['teacherid' => $teacherid, 'status' => 'active', 'zeroworkspace' => 0];
    $studentsql = '';
    if ($studentid > 0) {
        $studentsql = ' AND studentid = :studentid';
        $params['studentid'] = $studentid;
    }
    $workspaceid = (int)$DB->get_field_sql(
        "SELECT workspaceid
           FROM {local_prequran_teacher_student}
          WHERE teacherid = :teacherid
            AND status = :status
            AND workspaceid > :zeroworkspace
            {$studentsql}
       ORDER BY timemodified DESC, id DESC",
        $params,
        IGNORE_MISSING
    );
    return $workspaceid > 0 && pqh_consumer_context_allows_workspace(null, $workspaceid) ? $workspaceid : 0;
}

function pqho_resolve_teacher_workspace_id(int $userid, int $requestedid = 0, int $studentid = 0, ?stdClass $consumercontext = null): int {
    $consumercontext = $consumercontext ?: pqh_requested_consumer_context();
    if ($requestedid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
        $requestedid = (int)$consumercontext->workspaceid;
    }
    if ($requestedid > 0 && pqho_user_can_use_workspace($userid, $requestedid)) {
        return $requestedid;
    }
    $workspaceid = pqh_current_workspace_id($userid, $requestedid);
    if ($workspaceid > 0 && pqho_user_can_use_workspace($userid, $workspaceid)) {
        return $workspaceid;
    }
    $workspaceid = pqho_workspace_from_teacher_student($userid, $studentid);
    if ($workspaceid > 0 && pqho_user_can_use_workspace($userid, $workspaceid)) {
        return $workspaceid;
    }
    $workspaceid = pqh_user_primary_workspace_id($userid);
    if ($workspaceid > 0 && pqho_user_can_use_workspace($userid, $workspaceid)) {
        return $workspaceid;
    }
    return 0;
}
