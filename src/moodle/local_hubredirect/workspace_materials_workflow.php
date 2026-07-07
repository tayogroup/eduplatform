<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqwm_workspace_members(int $workspaceid, array $roles): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member') || !$roles) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return array_values($DB->get_records_sql(
        "SELECT wm.id, wm.userid, wm.workspace_role, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
            AND wm.workspace_role {$insql}
       ORDER BY u.lastname ASC, u.firstname ASC",
        $params
    ));
}
function pqwm_notification_audit_exists(int $assignmentid, string $action): bool {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return false;
    }
    return $DB->record_exists('local_prequran_live_audit', [
        'sessionid' => 0,
        'targettype' => 'material_assignment',
        'targetid' => $assignmentid,
        'action' => $action,
    ]);
}

function pqwm_mark_notification_audit(int $workspaceid, int $assignmentid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $details['workspaceid'] = $workspaceid;
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'material_assignment',
        'targetid' => $assignmentid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqwm_notify_parent_material_reviewed(int $workspaceid, stdClass $assignment): void {
    global $DB;
    if ((string)($assignment->target_type ?? '') !== 'student') {
        return;
    }
    $assignmentid = (int)$assignment->id;
    if ($assignmentid <= 0 || pqwm_notification_audit_exists($assignmentid, 'workspace_material_reviewed_parent_notified')) {
        return;
    }
    $material = $DB->get_record('local_prequran_workspace_material', ['id' => (int)$assignment->materialid], 'id,title', IGNORE_MISSING);
    $title = $material ? (string)$material->title : 'Assigned material';
    $sent = local_prequran_notify_parent_live_update(
        0,
        (int)$assignment->targetid,
        'Material reviewed',
        $title . ' has been reviewed by your child\'s teacher.',
        new moodle_url('/local/hubredirect/workspace_parent.php'),
        'Open parent workspace',
        'workspace_material_reviewed'
    );
    pqwm_mark_notification_audit($workspaceid, $assignmentid, 'workspace_material_reviewed_parent_notified', [
        'studentid' => (int)$assignment->targetid,
        'materialid' => (int)$assignment->materialid,
        'parents_notified' => $sent,
    ]);
}

function pqwm_upsert_assignment(int $workspaceid): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        throw new invalid_parameter_exception('Workspace material assignment table is not ready. Run the local_prequran Moodle upgrade.');
    }
    $materialid = optional_param('materialid', 0, PARAM_INT);
    $target = optional_param('target', '', PARAM_TEXT);
    if (!preg_match('/^(student|teacher):([0-9]+)$/', $target, $matches)) {
        throw new invalid_parameter_exception('Choose a valid material target.');
    }
    $targettype = $matches[1];
    $targetid = (int)$matches[2];
    if (!$DB->record_exists('local_prequran_workspace_material', ['id' => $materialid, 'workspaceid' => $workspaceid, 'status' => 'active'])) {
        throw new invalid_parameter_exception('Choose an active material in this workspace.');
    }
    $roles = $targettype === 'teacher' ? ['owner', 'admin', 'teacher', 'assistant_teacher'] : ['student'];
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['userid'] = $targetid;
    $params['status'] = 'active';
    if (!$DB->record_exists_select('local_prequran_workspace_member', "workspaceid = :workspaceid AND userid = :userid AND status = :status AND workspace_role {$insql}", $params)) {
        throw new invalid_parameter_exception('Target is not an active member of this workspace.');
    }
    $now = time();
    $conditions = [
        'workspaceid' => $workspaceid,
        'materialid' => $materialid,
        'target_type' => $targettype,
        'targetid' => $targetid,
    ];
    $record = (object)($conditions + [
        'status' => 'active',
        'workflow_status' => 'assigned',
        'assignedby' => (int)$USER->id,
        'timemodified' => $now,
    ]);
    $columns = $DB->get_columns('local_prequran_workspace_mat_assign');
    foreach (array_keys((array)$record) as $field) {
        if (!array_key_exists($field, $columns)) {
            unset($record->{$field});
        }
    }
    $existing = $DB->get_record('local_prequran_workspace_mat_assign', $conditions, '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        if (pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'workflow_status')) {
            $record->workflow_status = (string)($existing->workflow_status ?? 'assigned');
        }
        $DB->update_record('local_prequran_workspace_mat_assign', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_workspace_mat_assign', $record);
}

function pqwm_material_workflow_statuses(): array {
    return [
        'assigned' => 'Assigned',
        'in_progress' => 'In progress',
        'completed' => 'Completed',
        'reviewed' => 'Reviewed',
    ];
}

function pqwm_update_assignment_workflow(int $workspaceid): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        throw new invalid_parameter_exception('Workspace material assignment table is not ready. Run the local_prequran Moodle upgrade.');
    }
    if (!pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'workflow_status')) {
        throw new invalid_parameter_exception('Material assignment workflow fields are not ready. Run the local_prequran Moodle upgrade.');
    }
    $assignmentid = optional_param('assignmentid', 0, PARAM_INT);
    $workflow = optional_param('workflow_status', '', PARAM_ALPHANUMEXT);
    if (!array_key_exists($workflow, pqwm_material_workflow_statuses())) {
        throw new invalid_parameter_exception('Choose a valid material assignment status.');
    }
    $assignment = $DB->get_record('local_prequran_workspace_mat_assign', [
        'id' => $assignmentid,
        'workspaceid' => $workspaceid,
        'status' => 'active',
    ]);
    if (!$assignment) {
        throw new invalid_parameter_exception('Material assignment was not found in this workspace.');
    }
    if (!pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) && $workflow === 'reviewed') {
        throw new invalid_parameter_exception('Only workspace owners and admins can review material assignments from this page.');
    }

    $now = time();
    $assignment->workflow_status = $workflow;
    if ($workflow === 'in_progress' && empty($assignment->startedat) && pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'startedat')) {
        $assignment->startedat = $now;
    }
    if ($workflow === 'completed' && pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'completedat')) {
        $assignment->completedat = empty($assignment->completedat) ? $now : (int)$assignment->completedat;
    }
    if ($workflow === 'reviewed') {
        if (pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'reviewedby')) {
            $assignment->reviewedby = (int)$USER->id;
        }
        if (pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'reviewedat')) {
            $assignment->reviewedat = $now;
        }
        if (pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'review_notes')) {
            $assignment->review_notes = trim(optional_param('review_notes', '', PARAM_TEXT));
        }
    }
    $assignment->timemodified = $now;
    $DB->update_record('local_prequran_workspace_mat_assign', $assignment);
    if ($workflow === 'reviewed') {
        pqwm_notify_parent_material_reviewed($workspaceid, $assignment);
    }
}

function pqwm_set_material_status(int $workspaceid): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        throw new invalid_parameter_exception('Workspace material table is not ready. Run the local_prequran Moodle upgrade.');
    }
    $materialid = optional_param('materialid', 0, PARAM_INT);
    $status = optional_param('status', '', PARAM_ALPHANUMEXT);
    if (!in_array($status, ['active', 'archived'], true)) {
        throw new invalid_parameter_exception('Choose a valid material status.');
    }
    $material = $DB->get_record('local_prequran_workspace_material', [
        'id' => $materialid,
        'workspaceid' => $workspaceid,
    ]);
    if (!$material) {
        throw new invalid_parameter_exception('Workspace material was not found.');
    }
    $material->status = $status;
    $material->timemodified = time();
    if (pqh_table_has_field_safe('local_prequran_workspace_material', 'updatedby')) {
        $material->updatedby = (int)$USER->id;
    }
    $DB->update_record('local_prequran_workspace_material', $material);
    if ($status === 'archived' && pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        $DB->set_field('local_prequran_workspace_mat_assign', 'status', 'inactive', [
            'workspaceid' => $workspaceid,
            'materialid' => $materialid,
        ]);
    }
}

function pqwm_set_assignment_status(int $workspaceid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        throw new invalid_parameter_exception('Workspace material assignment table is not ready. Run the local_prequran Moodle upgrade.');
    }
    $assignmentid = optional_param('assignmentid', 0, PARAM_INT);
    $status = optional_param('status', '', PARAM_ALPHANUMEXT);
    if (!in_array($status, ['active', 'inactive'], true)) {
        throw new invalid_parameter_exception('Choose a valid assignment status.');
    }
    $assignment = $DB->get_record('local_prequran_workspace_mat_assign', [
        'id' => $assignmentid,
        'workspaceid' => $workspaceid,
    ]);
    if (!$assignment) {
        throw new invalid_parameter_exception('Material assignment was not found in this workspace.');
    }
    $assignment->status = $status;
    $assignment->timemodified = time();
    $DB->update_record('local_prequran_workspace_mat_assign', $assignment);
}

function pqwm_materials(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        return [];
    }
    return array_values($DB->get_records(
        'local_prequran_workspace_material',
        ['workspaceid' => $workspaceid, 'status' => 'active'],
        'timemodified DESC',
        pqwm_fields('local_prequran_workspace_material', ['id', 'title', 'material_type', 'course_key', 'description', 'source_url', 'metadatajson', 'visibility', 'createdby', 'timemodified']),
        0,
        80
    ));
}

function pqwm_assignments(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT a.id, a.materialid, a.target_type, a.targetid, a.status, a.timemodified,
                a.workflow_status, a.startedat, a.completedat, a.reviewedby, a.reviewedat, a.review_notes,
                m.title, m.material_type, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_workspace_mat_assign} a
           JOIN {local_prequran_workspace_material} m ON m.id = a.materialid
           JOIN {user} u ON u.id = a.targetid
          WHERE a.workspaceid = :workspaceid
            AND a.status = :status
       ORDER BY a.timemodified DESC, a.id DESC",
        ['workspaceid' => $workspaceid, 'status' => 'active'],
        0,
        80
    ));
}