<?php
// ---- report: teacher-office (Document Studio; read + create-material write) --
// Ported from local_hubredirect/teacher_office.php via teacher_office_portallib
// (the page defines no functions — all helpers are pqho_*/pqh_* from
// office_materials_lib.php and accesslib.php). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent. The legacy page stays live in
// parallel and is untouched.
// (teacher_office.php has no pqh_live_security_audit calls — none to keep.)
// GET  = the Document Studio state: workspace, student-office flag, allowed
//        create types, recent editable materials, ONLYOFFICE readiness, and
//        the page's link hub (legacy editor/download/library URLs absolute).
// POST = do=create_material (the page's single write, verbatim: same params,
//        same pqho_create_material call; confirm_sesskey dropped — token auth
//        replaces the session key; the legacy redirect to the editor becomes
//        an editorurl in the JSON response).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/office_materials_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_office_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// ---- Access + workspace resolution: same order and outcomes as the legacy
// page (teacher_office.php lines 9-37). POST reads workspaceid/childid from the
// JSON body; GET reads them from the query string like the page does. Legacy
// pqh_access_denied redirects become 403 JSON failures with the same messages.
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$childid = $ispost ? (int)($body['childid'] ?? 0) : optional_param('childid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
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
$isstudentoffice = $workspaceid > 0
    && pqho_user_is_student_in_workspace($userid, $workspaceid)
    && !pqh_user_can_teach_in_workspace($userid, $workspaceid)
    && !pqh_user_can_manage_workspace($userid, $workspaceid);
if ($workspaceid <= 0 || !pqho_user_can_use_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Choose a workspace before opening Document Studio.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening Document Studio.');
}

$legacyurl = static function (string $file, array $params) use ($CFG): string {
    return (new moodle_url('/local/hubredirect/' . $file, $params))->out(false);
};

if ($ispost) {
    $do = (string)($body['do'] ?? '');

    // -- write: create_material (the page's POST block, verbatim) --------------
    // Legacy: required_param('office_type') + optional title/course_key, then
    // pqho_create_material($workspaceid, $USER->id, $type, $title, $coursekey,
    // $childid) and a redirect to office_material_editor.php. The try/catch
    // that showed $e->getMessage() inline becomes a 400 JSON failure.
    if ($do === 'create_material') {
        $type = clean_param((string)($body['office_type'] ?? ''), PARAM_ALPHANUMEXT);
        if ($type === '') {
            pqpd_fail(400, 'Missing office_type.');
        }
        $title = trim(clean_param((string)($body['title'] ?? ''), PARAM_TEXT));
        $coursekey = trim(clean_param((string)($body['course_key'] ?? ''), PARAM_ALPHANUMEXT));
        try {
            $materialid = pqho_create_material($workspaceid, $userid, $type, $title, $coursekey, $childid);
        } catch (Throwable $e) {
            pqpd_fail(400, $e->getMessage());
        }
        echo json_encode([
            'ok' => true,
            'message' => 'Material created — open it in the editor.',
            'materialid' => $materialid,
            'editorurl' => $legacyurl('office_material_editor.php', $urlparams + ['materialid' => $materialid]),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown teacher-office action.');
}

// ---- GET: the Document Studio state (verbatim data block, lines 56-75) -------
$materials = [];
if (pqh_table_exists_safe('local_prequran_workspace_material')) {
    $materials = array_values($DB->get_records_select(
        'local_prequran_workspace_material',
        'workspaceid = :workspaceid AND status = :status',
        ['workspaceid' => $workspaceid, 'status' => 'active'],
        'timemodified DESC',
        '*',
        0,
        50
    ));
    $materials = array_values(array_filter($materials, 'pqho_material_editor_supported'));
    if ($isstudentoffice) {
        $materials = array_values(array_filter($materials, static function($material) use ($userid): bool {
            return pqho_user_can_edit_material($material, $userid);
        }));
    }
}

$docserver = rtrim(trim((string)get_config('local_prequran', 'onlyoffice_document_server_url')), '/');

// Decorate for the client (filename + editor/download URLs the page renders
// inline; both editors stay legacy Moodle pages — the ONLYOFFICE editor is not
// part of this migration).
$materialsout = [];
foreach ($materials as $material) {
    $materialsout[] = [
        'id' => (int)$material->id,
        'title' => (string)$material->title,
        'filename' => pqh_workspace_material_filename($material),
        'timemodified' => (int)($material->timemodified ?? 0),
        'editorurl' => $legacyurl('office_material_editor.php', $urlparams + ['materialid' => (int)$material->id]),
        'downloadurl' => $legacyurl('office_material_file.php', ['workspaceid' => $workspaceid, 'materialid' => (int)$material->id]),
    ];
}

$typesout = [];
foreach (pqho_allowed_types() as $type => $config) {
    $typesout[] = [
        'type' => (string)$type,
        'label' => (string)$config['label'],
        'default' => (string)$config['default'],
    ];
}

// Link hub: the page's top-nav actions. teacher_workspace.php is migrating as
// report=teacher-workspace in this same wave, so the teacher return link goes
// through portal_launch; the student workplace and material library stay
// legacy Moodle pages.
$links = [];
if ($isstudentoffice) {
    $links[] = [
        'title' => 'Student workplace',
        'desc' => 'Back to your student workplace.',
        'url' => $legacyurl('student_workplace.php', $urlparams),
    ];
} else {
    $links[] = [
        'title' => 'Teacher workspace',
        'desc' => "Today's classes, attendance, notes, and post-class review.",
        'url' => $CFG->wwwroot . '/local/prequran/portal_launch.php?report=teacher-workspace&workspaceid=' . $workspaceid
            . (!empty($consumercontext->consumerslug) ? '&consumer=' . rawurlencode((string)$consumercontext->consumerslug) : ''),
    ];
}
$links[] = [
    'title' => 'Material library',
    'desc' => 'Review resources, assignment progress, and completed student materials.',
    'url' => $legacyurl('workspace_materials.php', $urlparams),
];

echo json_encode([
    'ok' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'childid' => $childid,
    'isstudentoffice' => $isstudentoffice,
    'docserver_configured' => $docserver !== '',
    'types' => $typesout,
    'materials' => $materialsout,
    'links' => $links,
], JSON_UNESCAPED_SLASHES);
exit;
