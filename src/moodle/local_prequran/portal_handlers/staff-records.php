<?php
// Portal handler: staff-records (workspace admin). HR employment record for ALL
// staff including non-teaching roles (admin/registrar/finance/support) — the
// platform previously had only teacher pay-contracts, no employment file.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_records_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

$consumercontext = pqh_requested_consumer_context();
$workspaceid = isset($body['workspaceid'])
    ? (int)$body['workspaceid']
    : optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);

// HR records are sensitive — workspace owners/admins only.
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Staff records require workspace administrator access.');
}
if (!pqir_staff_ready()) {
    pqpd_fail(503, 'Staff record tables are not ready. Run the local_prequran plugin upgrade first.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $braw = static function (string $k, string $d = '') use ($body): string {
        return trim((string)($body[$k] ?? $d));
    };
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        if ($do === 'save') {
            $id = pqir_save_staff_record($workspaceid, $consumercontext, $userid, [
                'userid' => isset($body['userid']) ? (int)$body['userid'] : 0,
                'role_title' => $braw('role_title'),
                'employment_type' => clean_param((string)($body['employment_type'] ?? 'full_time'), PARAM_ALPHANUMEXT),
                'department' => $braw('department'),
                'start_date' => $braw('start_date'),
                'end_date' => $braw('end_date'),
                'payroll_ref' => $braw('payroll_ref'),
                'emergency_contact_name' => $braw('emergency_contact_name'),
                'emergency_contact_phone' => $braw('emergency_contact_phone'),
                'qualifications' => clean_param((string)($body['qualifications'] ?? ''), PARAM_TEXT),
                'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
                'notes' => clean_param((string)($body['notes'] ?? ''), PARAM_TEXT),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Staff record saved.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Choose a valid staff-record action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: staff members (all non-student active members) + their HR records --
$nameids = [];
$members = [];
if (pqh_table_exists_safe('local_prequran_workspace_member')) {
    $rows = $DB->get_records_sql(
        "SELECT wm.userid, wm.workspace_role, u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :ws AND wm.status = 'active'
            AND wm.workspace_role IN ('owner','admin','teacher','assistant_teacher','coordinator','registrar','finance','support','auditor')
       ORDER BY u.lastname ASC, u.firstname ASC", ['ws' => $workspaceid], 0, 500);
    foreach ($rows as $r) {
        $members[] = [
            'id' => (int)$r->userid,
            'name' => fullname($r),
            'role' => (string)$r->workspace_role,
            'email' => (string)$r->email,
            'account' => (string)$r->idnumber,
        ];
    }
}

$records = [];
foreach ($DB->get_records('local_prequran_staff_record', ['workspaceid' => $workspaceid], 'status ASC, timemodified DESC', '*', 0, 500) as $s) {
    $nameids[] = (int)$s->userid;
    $records[] = [
        'id' => (int)$s->id,
        'userid' => (int)$s->userid,
        'staff_number' => (string)$s->staff_number,
        'role_title' => (string)$s->role_title,
        'employment_type' => (string)$s->employment_type,
        'department' => (string)$s->department,
        'start_date' => (int)$s->start_date,
        'end_date' => (int)$s->end_date,
        'payroll_ref' => (string)$s->payroll_ref,
        'emergency_contact_name' => (string)$s->emergency_contact_name,
        'emergency_contact_phone' => (string)$s->emergency_contact_phone,
        'qualifications' => (string)$s->qualifications,
        'status' => (string)$s->status,
        'notes' => (string)$s->notes,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'members' => $members,
    'records' => $records,
    'employment_options' => pqir_staff_employment_options(),
    'names' => pqpd_names(array_values(array_unique(array_filter($nameids)))),
], JSON_UNESCAPED_SLASHES);
exit;
