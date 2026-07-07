<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function local_hubredirect_pluginfile($course, $cm, $context, string $filearea, array $args, bool $forcedownload, array $options = []): bool {
    global $DB, $USER;

    if (!in_array($filearea, ['workspace_material', 'pq_document'], true) || (int)$context->contextlevel !== CONTEXT_SYSTEM) {
        return false;
    }
    require_login();
    require_once(__DIR__ . '/accesslib.php');

    if ($filearea === 'pq_document') {
        $documentid = isset($args[0]) ? (int)array_shift($args) : 0;
        $filename = array_pop($args);
        if ($documentid <= 0 || !$filename || !pqh_table_exists_safe('local_prequran_document')) {
            return false;
        }
        $document = $DB->get_record('local_prequran_document', ['id' => $documentid], '*', IGNORE_MISSING);
        if (!$document || (string)$document->status === 'archived') {
            return false;
        }
        $canview = pqh_user_can_teach_in_workspace((int)$USER->id, (int)$document->workspaceid)
            || (int)$document->studentid === (int)$USER->id
            || (int)$document->ownerid === (int)$USER->id;
        if (!$canview) {
            return false;
        }
        $filepath = $args ? '/' . implode('/', $args) . '/' : '/';
        $fs = get_file_storage();
        $file = $fs->get_file($context->id, 'local_hubredirect', 'pq_document', $documentid, $filepath, $filename);
        if (!$file || $file->is_directory()) {
            return false;
        }
        send_stored_file($file, 0, 0, true, $options);
        return true;
    }

    $materialid = isset($args[0]) ? (int)array_shift($args) : 0;
    $filename = array_pop($args);
    if ($materialid <= 0 || !$filename || !pqh_table_exists_safe('local_prequran_workspace_material')) {
        return false;
    }

    $material = $DB->get_record('local_prequran_workspace_material', ['id' => $materialid, 'status' => 'active'], '*', IGNORE_MISSING);
    if (!$material) {
        return false;
    }
    $canview = pqh_user_can_teach_in_workspace((int)$USER->id, (int)$material->workspaceid);
    if (!$canview && pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        $canview = $DB->record_exists('local_prequran_workspace_mat_assign', [
            'workspaceid' => (int)$material->workspaceid,
            'materialid' => $materialid,
            'target_type' => 'student',
            'targetid' => (int)$USER->id,
            'status' => 'active',
        ]);
    }
    if (!$canview) {
        return false;
    }

    $filepath = $args ? '/' . implode('/', $args) . '/' : '/';
    $fs = get_file_storage();
    $file = $fs->get_file($context->id, 'local_hubredirect', 'workspace_material', $materialid, $filepath, $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }

    send_stored_file($file, 0, 0, $forcedownload, $options);
    return true;
}
