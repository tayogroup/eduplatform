<?php
// ---- report: workspace-materials (workspace material library + assignments) ---
// Ported from local_hubredirect/workspace_materials.php. That page defines no
// functions of its own, so there is no page-specific *_portallib body — every
// helper is a shared pqh_/pqho_/pqwm_ function loaded from the existing
// libraries below (see workspace_materials_portallib.php for the map). Included
// from portal_data.php AFTER token auth: $claims verified, $USER set to the
// token user, JSON exception handler installed, headers sent.
// GET  = the workspace material library + assignments + assign-form options,
//        decorated exactly as the legacy page renders them (open URLs, labels).
// POST = do=update_material_status | set_material_status | assign_material |
//        set_assignment_status — each the legacy action=... write VERBATIM
//        (same guards/whitelists/messages). confirm_sesskey() dropped: token
//        auth replaces it. do=add_material is SKIPPED (multipart file upload —
//        unportable to a JSON endpoint; stays on the legacy page).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_materials_files.php');
require_once($CFG->dirroot . '/local/hubredirect/office_materials_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_materials_workflow.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_materials_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
    // The legacy pqwm_* write helpers read their fields through optional_param()
    // (i.e. $_POST/$_GET). Populate $_POST from the JSON body so those verbatim
    // functions run unchanged. Scalars only; PARAM cleaning happens inside them.
    foreach ($body as $k => $v) {
        if (is_scalar($v)) {
            $_POST[$k] = (string)$v;
        }
    }
}

// -- workspace resolution + entry access check (same order and messages as the
// -- legacy page). No download branch here: file serving stays on the legacy
// -- workspace_materials.php?action=download endpoint (out of scope).
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$childid = $ispost
    ? (int)($body['childid'] ?? 0)
    : optional_param('childid', 0, PARAM_INT);
$workspaceid = pqho_resolve_teacher_workspace_id($userid, $requestedworkspaceid, $childid, $consumercontext);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($childid > 0) {
    $urlparams['childid'] = $childid;
}
if ($workspaceid <= 0 || !pqho_user_can_use_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace teaching and admin users can view workspace materials.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening workspace materials.');
}

$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$canteachmaterials = pqh_user_can_teach_in_workspace($userid, $workspaceid);
$isstudentmaterials = pqho_user_is_student_in_workspace($userid, $workspaceid) && !$canteachmaterials && !$canmanage;
$canaddmaterials = $canmanage || $canteachmaterials;
$candeletematerials = $canmanage || $canteachmaterials;
$canupdateassignments = $canmanage || $canteachmaterials;

if ($ispost) {
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $message = '';
    try {
        if ($do === 'update_material_status') {
            // -- write: update_material_status (legacy action=update_material_status, verbatim) --
            if (!pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
                throw new invalid_parameter_exception('Only workspace teaching and admin users can update material assignment status.');
            }
            pqwm_update_assignment_workflow($workspaceid);
            $message = 'Material assignment status updated.';
        } else if ($do === 'set_material_status') {
            // -- write: set_material_status (legacy action=set_material_status, verbatim) --
            $status = optional_param('status', '', PARAM_ALPHANUMEXT);
            if ($status !== 'archived' && !$canmanage) {
                throw new invalid_parameter_exception('Only workspace owners and admins can restore materials.');
            }
            if (!$candeletematerials) {
                throw new invalid_parameter_exception('Only workspace teaching and admin users can delete materials.');
            }
            pqwm_set_material_status($workspaceid);
            $message = 'Workspace material updated.';
        } else if ($do === 'add_material') {
            // -- write: add_material -- SKIPPED (multipart file upload). The
            // legacy handler reads $_FILES['material_file'] via
            // pqwm_uploaded_file()/pqwm_store_uploaded_file(); a JSON POST cannot
            // carry the file. Adding materials stays on the legacy page.
            pqpd_fail(400, 'Adding materials (with an optional file upload) is only available on the legacy workspace materials page.');
        } else if (!$canmanage) {
            throw new invalid_parameter_exception('Only workspace owners and admins can manage materials.');
        } else if ($do === 'assign_material') {
            // -- write: assign_material (legacy action=assign_material, verbatim) --
            pqwm_upsert_assignment($workspaceid);
            $message = 'Workspace material assigned.';
        } else if ($do === 'set_assignment_status') {
            // -- write: set_assignment_status (legacy action=set_assignment_status, verbatim) --
            pqwm_set_assignment_status($workspaceid);
            $message = 'Material assignment updated.';
        } else {
            pqpd_fail(400, 'Unknown workspace-materials action.');
        }
    } catch (Throwable $e) {
        // Legacy catches every write error and shows it as the page alert —
        // same message text, delivered as JSON.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the material library + assignments exactly as the legacy page builds --
$materialtableready = pqh_table_exists_safe('local_prequran_workspace_material');
$assigntableready = pqh_table_exists_safe('local_prequran_workspace_mat_assign');

$materials = pqwm_materials($workspaceid);
$assignments = pqwm_assignments($workspaceid);
if ($isstudentmaterials) {
    $materials = array_values(array_filter($materials, static function($material) use ($userid): bool {
        return pqwm_can_view_material($material, $userid) || pqho_user_can_edit_material($material, $userid);
    }));
    $assignments = array_values(array_filter($assignments, static function($assignment) use ($userid): bool {
        return (string)($assignment->target_type ?? '') === 'student' && (int)($assignment->targetid ?? 0) === $userid;
    }));
}
$students = pqwm_workspace_members($workspaceid, ['student']);
$teachers = pqwm_workspace_members($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$reviewedassignments = 0;
$completedassignments = 0;
foreach ($assignments as $assignment) {
    $workflow = (string)($assignment->workflow_status ?? 'assigned');
    if ($workflow === 'reviewed') {
        $reviewedassignments++;
    }
    if (in_array($workflow, ['completed', 'reviewed'], true)) {
        $completedassignments++;
    }
}

$workflowstatuses = pqwm_material_workflow_statuses();

// Decorate materials with the server-computed open URL + labels the page renders
// inline (open-in-office editor / external source / legacy download — all
// wwwroot-absolute so the portal page links straight back to the live Moodle).
$materialsout = [];
foreach ($materials as $material) {
    $extension = strtolower(pathinfo(pqh_workspace_material_filename($material), PATHINFO_EXTENSION));
    $canopenonline = in_array($extension, ['docx', 'xlsx', 'pptx', 'pdf'], true) && pqh_workspace_material_bunny_path($material) !== '';
    $openurl = '';
    $openexternal = false;
    if ($canopenonline && pqho_user_can_edit_material($material, $userid)) {
        $openurl = (new moodle_url('/local/hubredirect/office_material_editor.php', $urlparams + ['materialid' => (int)$material->id]))->out(false);
    } else if (!empty($material->source_url) && pqwm_can_view_material($material, $userid)) {
        $openurl = (string)$material->source_url;
        $openexternal = true;
    } else if (pqwm_can_view_material($material, $userid)) {
        // Legacy file-serving endpoint (workspace_materials.php?action=download);
        // kept on Moodle, out of scope for this migration.
        $openurl = (new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams + ['action' => 'download', 'materialid' => (int)$material->id]))->out(false);
    }
    $materialtitle = (string)$material->title;
    $displaytitle = core_text::strlen($materialtitle) > 15 ? core_text::substr($materialtitle, 0, 15) : $materialtitle;
    $materialsout[] = [
        'id' => (int)$material->id,
        'title' => $materialtitle,
        'displaytitle' => $displaytitle,
        'material_type' => (string)$material->material_type,
        'visibility' => (string)$material->visibility,
        'course_key' => trim((string)($material->course_key ?? '')),
        'timemodified' => (int)($material->timemodified ?? 0),
        'openurl' => $openurl,
        'openexternal' => $openexternal,
    ];
}

$assignmentsout = [];
foreach ($assignments as $assignment) {
    $assignmentsout[] = [
        'id' => (int)$assignment->id,
        'materialid' => (int)$assignment->materialid,
        'title' => (string)$assignment->title,
        'material_type' => (string)$assignment->material_type,
        'target_type' => (string)$assignment->target_type,
        'targetid' => (int)$assignment->targetid,
        'fullname' => fullname($assignment),
        'account_label' => pqh_account_no_label($assignment),
        'email' => (string)($assignment->email ?? ''),
        'workflow_status' => (string)($assignment->workflow_status ?? 'assigned'),
        'workflow_label' => (string)($workflowstatuses[(string)($assignment->workflow_status ?? 'assigned')] ?? 'Assigned'),
        'review_notes' => (string)($assignment->review_notes ?? ''),
        'timemodified' => (int)$assignment->timemodified,
    ];
}

$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = [
        'userid' => (int)$student->userid,
        'label' => fullname($student) . ' - ' . pqh_account_no_label($student),
    ];
}
$teachersout = [];
foreach ($teachers as $teacher) {
    $teachersout[] = [
        'userid' => (int)$teacher->userid,
        'label' => fullname($teacher) . ' - ' . pqh_account_no_label($teacher),
    ];
}

$nameids = [];
foreach ($assignments as $row) {
    $nameids[] = (int)$row->targetid;
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'isstudentmaterials' => $isstudentmaterials,
    'materialtableready' => $materialtableready,
    'assigntableready' => $assigntableready,
    'can' => [
        'manage' => $canmanage,
        'teach' => $canteachmaterials,
        // Adding materials is a multipart file upload — unavailable in the portal.
        'add' => false,
        'delete' => $candeletematerials,
        'updateassignments' => $canupdateassignments,
    ],
    'metrics' => [
        'materials' => count($materials),
        'assignments' => count($assignments),
        'completed' => $completedassignments,
        'reviewed' => $reviewedassignments,
    ],
    'materials' => $materialsout,
    'assignments' => $assignmentsout,
    'students' => $studentsout,
    'teachers' => $teachersout,
    'workflowstatuses' => $workflowstatuses,
    'legacyurl' => (new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams))->out(false),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
