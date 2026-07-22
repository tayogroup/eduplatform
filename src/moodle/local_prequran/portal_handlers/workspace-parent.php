<?php
// ---- report: workspace-parent (parent's child dashboard; read-only) ----------
// Ported from local_hubredirect/workspace_parent.php via
// workspace_parent_portallib (pqwppl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
//
// The legacy page (titled "Parent Workspace") is a parent's read-only view of
// ONE linked child: assigned materials, attendance, parent-visible teacher
// notes, and approved recordings. It defines NO write blocks — no POST handler,
// no action=..., no insert/update/delete — so this handler is read-only:
//   GET  = the child dashboard state exactly as the page builds it (children
//          chooser + selected child's materials/attendance/notes/recordings),
//          decorated with the server-side labels and teacher names the page
//          renders inline.
//   POST = 400 (the parent workspace is read-only; nothing to port).
// (workspace_parent.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_parent_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// The legacy page is a pure read (require_login + render). It has no writes to
// port, so every POST is rejected — same as the other read-only reports.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The parent workspace is read-only.');
}

// -- entry access check (same order and messages as the legacy page preamble) --
// pqh_access_denied(...) -> pqpd_fail(403, same message).
$children = pqwppl_parent_children($userid);
if (!$children) {
    pqpd_fail(403, 'No student is linked to this parent account yet.');
}

$childid = optional_param('childid', 0, PARAM_INT);
if ($childid <= 0) {
    $childid = (int)$children[0]->id;
}
if (!pqwppl_parent_can_access_child($userid, $childid)) {
    pqpd_fail(403, 'This student is not linked to your parent account.');
}
$child = core_user::get_user($childid, 'id,firstname,lastname,email,username', IGNORE_MISSING);
if (!$child) {
    pqpd_fail(403, 'The selected student account was not found.');
}

// -- GET: the child dashboard lists exactly as the legacy page builds them -----
$materials = pqwppl_materials($childid);
$attendance = pqwppl_attendance_summary($childid);
$notes = pqwppl_parent_notes($childid);
$recordings = pqwppl_recordings($childid);

// Decorate materials with the status label the page renders inline
// (pqwppl_status_label is PHP-only).
$materialsout = [];
foreach ($materials as $material) {
    $material->status_label = pqwppl_status_label((string)($material->workflow_status ?? 'assigned'));
    $materialsout[] = $material;
}

// The page renders teacher references inline as "Teacher #id"; provide the same
// name map the batch-migrated reports return so the client can show real names.
$nameids = [];
foreach ($attendance['recent'] as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($notes as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($recordings as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}

$childrenout = [];
foreach ($children as $option) {
    $childrenout[] = [
        'id' => (int)$option->id,
        'name' => (string)$option->name,
        'email' => (string)$option->email,
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'children' => $childrenout,
    'child' => [
        'id' => $childid,
        'name' => fullname($child),
        'email' => (string)$child->email,
    ],
    'materials' => $materialsout,
    'attendance' => [
        'total' => (int)$attendance['total'],
        'present' => (int)$attendance['present'],
        'recent' => array_values($attendance['recent']),
    ],
    'notes' => array_values($notes),
    'recordings' => array_values($recordings),
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/workspace_parent.php?childid=' . $childid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
