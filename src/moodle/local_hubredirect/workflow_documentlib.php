<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

function pqwdoc_ready(): bool {
    return pqh_table_exists_safe('local_prequran_work_task')
        && pqh_table_exists_safe('local_prequran_work_note')
        && pqh_table_exists_safe('local_prequran_work_audit')
        && pqh_table_exists_safe('local_prequran_document')
        && pqh_table_exists_safe('local_prequran_document_audit')
        && pqh_table_exists_safe('local_prequran_generated_doc');
}

function pqwdoc_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqwdoc_date_to_time(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? (int)$time : 0;
}

function pqwdoc_workspace_staff(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    list($insql, $params) = $DB->get_in_or_equal(['owner', 'admin', 'coordinator', 'teacher', 'assistant_teacher', 'auditor'], SQL_PARAMS_NAMED);
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, wm.workspace_role
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
            AND wm.workspace_role $insql
       ORDER BY wm.workspace_role ASC, u.lastname ASC, u.firstname ASC",
        $params
    ));
}

function pqwdoc_workspace_students(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.workspace_role = :role
            AND wm.status = :status
       ORDER BY u.lastname ASC, u.firstname ASC",
        ['workspaceid' => $workspaceid, 'role' => 'student', 'status' => 'active']
    ));
}

function pqwdoc_task_audit(int $workspaceid, int $taskid, int $actorid, string $action, array $old = [], array $new = []): void {
    global $DB;

    if (!pqh_table_exists_safe('local_prequran_work_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_work_audit', (object)[
        'workspaceid' => $workspaceid,
        'taskid' => $taskid,
        'actorid' => $actorid,
        'action' => core_text::substr($action, 0, 80),
        'oldvaluejson' => pqwdoc_json($old),
        'newvaluejson' => pqwdoc_json($new),
        'timecreated' => time(),
    ]);
}

function pqwdoc_document_audit(int $workspaceid, int $documentid, int $actorid, string $action, array $details = []): void {
    global $DB;

    if (!pqh_table_exists_safe('local_prequran_document_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_document_audit', (object)[
        'workspaceid' => $workspaceid,
        'documentid' => $documentid,
        'actorid' => $actorid,
        'action' => core_text::substr($action, 0, 80),
        'detailsjson' => pqwdoc_json($details),
        'timecreated' => time(),
    ]);
}

function pqwdoc_upload_info(array $upload): ?array {
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($upload['tmp_name']) || !is_uploaded_file((string)$upload['tmp_name'])) {
        throw new invalid_parameter_exception('The uploaded document could not be read.');
    }
    $filename = clean_filename((string)($upload['name'] ?? 'document'));
    if ($filename === '') {
        $filename = 'document';
    }
    return [
        'tmpname' => (string)$upload['tmp_name'],
        'filename' => $filename,
        'mimetype' => trim((string)($upload['type'] ?? '')) ?: 'application/octet-stream',
        'size' => (int)($upload['size'] ?? 0),
    ];
}

function pqwdoc_store_upload(int $documentid, array $upload): stored_file {
    $context = context_system::instance();
    $fs = get_file_storage();
    $fs->delete_area_files($context->id, 'local_hubredirect', 'pq_document', $documentid);
    return $fs->create_file_from_pathname([
        'contextid' => $context->id,
        'component' => 'local_hubredirect',
        'filearea' => 'pq_document',
        'itemid' => $documentid,
        'filepath' => '/',
        'filename' => (string)$upload['filename'],
        'mimetype' => (string)$upload['mimetype'],
        'userid' => 0,
    ], (string)$upload['tmpname']);
}

function pqwdoc_download_url(stdClass $document): string {
    if ((string)($document->filename ?? '') === '') {
        return '';
    }
    $context = context_system::instance();
    return moodle_url::make_pluginfile_url(
        $context->id,
        'local_hubredirect',
        'pq_document',
        (int)$document->id,
        '/',
        (string)$document->filename,
        true
    )->out(false);
}
