<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution mobility and lifecycle test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution mobility lifecycle access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution mobility lifecycle requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqiml_table_ready(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqiml_has_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqiml_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqiml_has_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqiml_conditions(string $table, array $conditions): array {
    $filtered = [];
    foreach ($conditions as $field => $value) {
        if (pqiml_has_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return $filtered;
}

function pqiml_get_record_safe(string $table, array $conditions) {
    global $DB;
    if (!pqiml_table_ready($table)) {
        return false;
    }
    $lookup = pqiml_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_record($table, $lookup, '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqiml_get_field_safe(string $table, string $field, array $conditions) {
    global $DB;
    if (!pqiml_table_ready($table) || !pqiml_has_field($table, $field)) {
        return false;
    }
    $lookup = pqiml_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_field($table, $field, $lookup, IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqiml_insert_safe(string $table, array $record): int {
    global $DB;
    if (!pqiml_table_ready($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqiml_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqiml_update_safe(string $table, $record): bool {
    global $DB;
    if (!pqiml_table_ready($table)) {
        return false;
    }
    try {
        return (bool)$DB->update_record($table, pqiml_record($table, (array)$record));
    } catch (Throwable $e) {
        return false;
    }
}

function pqiml_upsert_simple(string $table, array $conditions, array $values): int {
    if (!pqiml_table_ready($table)) {
        return 0;
    }
    $existing = pqiml_get_record_safe($table, $conditions);
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        return pqiml_update_safe($table, $record) ? (int)$existing->id : 0;
    }
    $record['timecreated'] = time();
    return pqiml_insert_safe($table, $record);
}

function pqiml_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqiml_token(string $runid): string {
    $token = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $runid));
    return substr($token !== '' ? $token : sha1((string)time()), -18);
}

function pqiml_user(string $prefix, string $role, string $firstname): array {
    global $CFG, $DB;
    $username = $prefix . '.' . $role;
    $email = $username . '@example.test';
    $password = 'Mock@001!';
    $user = $DB->get_record('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id], '*', IGNORE_MISSING);
    if ($user) {
        update_internal_user_password($user, $password);
        $user->auth = 'manual';
        $user->confirmed = 1;
        $user->deleted = 0;
        $user->suspended = 0;
        $user->emailstop = 1;
        $user->timemodified = time();
        $DB->update_record('user', $user);
        $userid = (int)$user->id;
    } else {
        $userid = (int)user_create_user((object)[
            'auth' => 'manual',
            'confirmed' => 1,
            'mnethostid' => $CFG->mnet_localhost_id,
            'username' => $username,
            'password' => $password,
            'firstname' => $firstname,
            'lastname' => 'Mobility ' . ucfirst($role),
            'email' => $email,
            'emailstop' => 1,
            'city' => 'SQA City',
            'timezone' => 'Africa/Nairobi',
            'lang' => $CFG->lang ?? 'en',
            'description' => 'Generated by the institution mobility lifecycle test.',
        ], true, false);
        pqh_assign_account_id($userid, $role === 'parent' ? 'parent' : $role);
    }
    return ['id' => $userid, 'username' => $username, 'email' => $email];
}

function pqiml_workspace(int $currentworkspaceid, string $slug, string $name, string $type = 'institution', string $status = 'active'): int {
    global $USER;
    if ($slug === 'current') {
        $workspace = pqiml_get_record_safe('local_prequran_workspace', ['id' => $currentworkspaceid]);
        if ($workspace) {
            $workspace->status = $status;
            $workspace->settingsjson = json_encode(['institution_mobility_lifecycle' => true, 'school_key' => 'branch_a'], JSON_UNESCAPED_SLASHES);
            $workspace->timemodified = time();
            pqiml_update_safe('local_prequran_workspace', $workspace);
        }
        return $currentworkspaceid;
    }
    return pqiml_upsert_simple('local_prequran_workspace', ['slug' => $slug], [
        'name' => $name,
        'workspace_type' => $type,
        'ownerid' => 0,
        'status' => $status,
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['institution_mobility_lifecycle' => true, 'school_key' => $slug], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqiml_org_group(string $slug, string $name, string $type, array $policy): int {
    global $USER;
    return pqiml_upsert_simple('local_prequran_org_group', ['slug' => $slug], [
        'name' => $name,
        'group_type' => $type,
        'parentconsumerid' => 0,
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqiml_link_workspace(string $groupslug, int $workspaceid, string $relationship, string $scope, int $inheritsensitive, string $status = 'active'): void {
    global $USER;
    $groupid = (int)pqiml_get_field_safe('local_prequran_org_group', 'id', ['slug' => $groupslug, 'status' => 'active']);
    if ($groupid <= 0) {
        return;
    }
    pqiml_upsert_simple('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'group_role' => 'member',
    ], [
        'relationship_type' => $relationship,
        'access_scope' => $scope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => $status,
        'notes' => 'Institution mobility lifecycle fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqiml_workspace_member(int $workspaceid, int $userid, string $role, string $status = 'active', string $notes = ''): void {
    global $USER;
    pqiml_upsert_simple('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], [
        'role' => $role,
        'status' => $status,
        'notes' => $notes ?: 'Institution mobility lifecycle fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqiml_teacher_student(int $workspaceid, int $teacherid, int $studentid, string $status = 'active'): void {
    global $USER;
    if (!pqiml_table_ready('local_prequran_teacher_student')) {
        return;
    }
    $now = time();
    $conditions = [
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
    ];
    $values = [
        'cohortid' => 0,
        'status' => $status,
        'assignedby' => (int)$USER->id,
        'timemodified' => $now,
    ];

    $existing = pqiml_get_record_safe('local_prequran_teacher_student', $conditions);
    if ($existing) {
        $record = $conditions + $values + [
            'id' => (int)$existing->id,
            'timecreated' => (int)($existing->timecreated ?? $now),
        ];
        pqiml_update_safe('local_prequran_teacher_student', $record);
        return;
    }

    $record = $conditions + $values + ['timecreated' => $now];
    if (pqiml_insert_safe('local_prequran_teacher_student', $record) > 0) {
        return;
    }

    // Older live installs may still enforce a legacy unique key on teacherid/studentid.
    // In that shape the school transfer is represented by moving the single link row
    // to the destination workspace instead of keeping one inactive source row plus one
    // active destination row.
    $legacy = pqiml_get_record_safe('local_prequran_teacher_student', [
        'teacherid' => $teacherid,
        'studentid' => $studentid,
    ]);
    if ($legacy) {
        $record = $conditions + $values + [
            'id' => (int)$legacy->id,
            'timecreated' => (int)($legacy->timecreated ?? $now),
        ];
        pqiml_update_safe('local_prequran_teacher_student', $record);
    }
}

function pqiml_audit(int $consumerid, int $workspaceid, string $action, string $targettype, int $targetid, array $details): void {
    global $USER;
    pqiml_insert_safe('local_prequran_course_audit', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'offeringid' => 0,
        'requestid' => 0,
        'studentid' => (int)($details['studentid'] ?? 0),
        'actorid' => (int)$USER->id,
        'action' => substr($action, 0, 80),
        'targettype' => substr($targettype, 0, 80),
        'targetid' => $targetid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ]);
}

function pqiml_active_member_count(int $workspaceid): int {
    return pqiml_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND status = :status",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    );
}

function pqiml_audit_count(string $runid, string $action = ''): int {
    global $DB;
    $params = ['needle' => '%' . $DB->sql_like_escape($runid) . '%'];
    $sql = "SELECT COUNT(1) FROM {local_prequran_course_audit} WHERE " . $DB->sql_like('details', ':needle', false);
    if ($action !== '') {
        $sql .= " AND action = :action";
        $params['action'] = $action;
    }
    return pqiml_count_sql($sql, $params);
}

function pqiml_fixture(int $consumerid, int $workspaceid, string $runid): array {
    global $DB;
    pqiml_org_group('owned-schools', 'Owned Schools', 'owned_group', ['model' => 'wholly_owned_schools']);
    pqiml_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', ['model' => 'independent_franchise_schools']);

    $token = pqiml_token($runid);
    $branchaid = pqiml_workspace($workspaceid, 'current', 'Huda Branch A SQA', 'institution', 'active');
    $branchbid = pqiml_workspace($workspaceid, 'huda-mobility-branch-b-sqa', 'Huda Mobility Branch B SQA', 'institution', 'active');
    $franchiseid = pqiml_workspace($workspaceid, 'huda-mobility-franchise-sqa', 'Huda Mobility Franchise SQA', 'franchise', 'active');

    pqiml_link_workspace('owned-schools', $branchaid, 'owned_branch', 'governance,operations', 1);
    pqiml_link_workspace('owned-schools', $branchbid, 'owned_branch', 'governance,operations', 1);
    pqiml_link_workspace('franchise-schools', $franchiseid, 'franchise_member', 'governance', 0);

    $teacher = pqiml_user('inst.mob.' . $token, 'teacher', 'Mobility');
    $student = pqiml_user('inst.mob.' . $token, 'student', 'Mobility');
    $franchiseteacher = pqiml_user('inst.mob.' . $token, 'franchise_teacher', 'Lifecycle');

    pqiml_workspace_member($branchaid, (int)$teacher['id'], 'teacher', 'active', 'Initial Branch A assignment.');
    pqiml_workspace_member($branchaid, (int)$student['id'], 'student', 'active', 'Initial Branch A enrollment.');
    pqiml_teacher_student($branchaid, (int)$teacher['id'], (int)$student['id'], 'active');

    $teacherinitialbranchb = pqh_user_can_teach_in_workspace((int)$teacher['id'], $branchbid);
    pqiml_workspace_member($branchbid, (int)$teacher['id'], 'teacher', 'active', 'Explicit Branch B assignment.');
    pqiml_audit($consumerid, $branchbid, 'teacher_explicit_school_assignment', 'user', (int)$teacher['id'], [
        'runid' => $runid,
        'from_workspaceid' => $branchaid,
        'to_workspaceid' => $branchbid,
        'role' => 'teacher',
    ]);
    $teacherexplicitbranchb = pqh_user_can_teach_in_workspace((int)$teacher['id'], $branchbid);

    pqiml_workspace_member($branchaid, (int)$teacher['id'], 'teacher', 'inactive', 'Transferred from Branch A to Branch B.');
    pqiml_workspace_member($branchbid, (int)$student['id'], 'student', 'active', 'Transferred from Branch A to Branch B.');
    pqiml_workspace_member($branchaid, (int)$student['id'], 'student', 'inactive', 'Transferred from Branch A to Branch B.');
    pqiml_teacher_student($branchaid, (int)$teacher['id'], (int)$student['id'], 'inactive');
    pqiml_teacher_student($branchbid, (int)$teacher['id'], (int)$student['id'], 'active');
    pqiml_audit($consumerid, $branchbid, 'teacher_school_transfer_completed', 'user', (int)$teacher['id'], [
        'runid' => $runid,
        'from_workspaceid' => $branchaid,
        'to_workspaceid' => $branchbid,
        'teacherid' => (int)$teacher['id'],
    ]);
    pqiml_audit($consumerid, $branchbid, 'student_school_transfer_completed', 'student', (int)$student['id'], [
        'runid' => $runid,
        'from_workspaceid' => $branchaid,
        'to_workspaceid' => $branchbid,
        'studentid' => (int)$student['id'],
    ]);

    pqiml_workspace_member($franchiseid, (int)$franchiseteacher['id'], 'teacher', 'active', 'Franchise lifecycle fixture before archive.');
    $franchiseworkspace = pqiml_get_record_safe('local_prequran_workspace', ['id' => $franchiseid]);
    if ($franchiseworkspace) {
        $franchiseworkspace->status = 'archived';
        $franchiseworkspace->timemodified = time();
        pqiml_update_safe('local_prequran_workspace', $franchiseworkspace);
    }
    pqiml_link_workspace('franchise-schools', $franchiseid, 'franchise_member', 'governance', 0, 'archived');
    pqiml_audit($consumerid, $franchiseid, 'institution_school_archived', 'workspace', $franchiseid, [
        'runid' => $runid,
        'workspaceid' => $franchiseid,
        'relationship' => 'franchise_member',
        'active_members_before_archive' => pqiml_active_member_count($franchiseid),
    ]);

    $branchamemberactive = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND userid = :userid AND workspace_role = :role AND status = :status", ['workspaceid' => $branchaid, 'userid' => (int)$teacher['id'], 'role' => 'teacher', 'status' => 'active']);
    $branchbmemberactive = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND userid = :userid AND workspace_role = :role AND status = :status", ['workspaceid' => $branchbid, 'userid' => (int)$teacher['id'], 'role' => 'teacher', 'status' => 'active']);
    $studentbranchainactive = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND userid = :userid AND workspace_role = :role AND status = :status", ['workspaceid' => $branchaid, 'userid' => (int)$student['id'], 'role' => 'student', 'status' => 'inactive']);
    $studentbranchbactive = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND userid = :userid AND workspace_role = :role AND status = :status", ['workspaceid' => $branchbid, 'userid' => (int)$student['id'], 'role' => 'student', 'status' => 'active']);
    $teacherstudentbranchb = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_teacher_student} WHERE workspaceid = :workspaceid AND teacherid = :teacherid AND studentid = :studentid AND status = :status", ['workspaceid' => $branchbid, 'teacherid' => (int)$teacher['id'], 'studentid' => (int)$student['id'], 'status' => 'active']);
    $teacherstudentbrancha = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_teacher_student} WHERE workspaceid = :workspaceid AND teacherid = :teacherid AND studentid = :studentid AND status = :status", ['workspaceid' => $branchaid, 'teacherid' => (int)$teacher['id'], 'studentid' => (int)$student['id'], 'status' => 'active']);
    $activeworkspacequeue = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_workspace} WHERE id IN (:brancha, :branchb, :franchise) AND status = :status", ['brancha' => $branchaid, 'branchb' => $branchbid, 'franchise' => $franchiseid, 'status' => 'active']);
    $archivedworkspacequeue = pqiml_count_sql("SELECT COUNT(1) FROM {local_prequran_workspace} WHERE id = :workspaceid AND status = :status", ['workspaceid' => $franchiseid, 'status' => 'archived']);

    $checks = [
        ['name' => 'teacher_branch_a_cannot_access_branch_b_without_assignment', 'pass' => !$teacherinitialbranchb],
        ['name' => 'teacher_explicit_branch_b_assignment_grants_access', 'pass' => $teacherexplicitbranchb],
        ['name' => 'teacher_branch_a_assignment_removed_after_transfer', 'pass' => $branchamemberactive === 0 && $branchbmemberactive === 1],
        ['name' => 'student_transfer_updates_workspace_membership', 'pass' => $studentbranchainactive === 1 && $studentbranchbactive === 1],
        ['name' => 'teacher_student_link_updates_after_transfer', 'pass' => $teacherstudentbranchb === 1 && $teacherstudentbrancha === 0],
        ['name' => 'mobility_audit_records_teacher_transfer', 'pass' => pqiml_audit_count($runid, 'teacher_school_transfer_completed') >= 1],
        ['name' => 'mobility_audit_records_student_transfer', 'pass' => pqiml_audit_count($runid, 'student_school_transfer_completed') >= 1],
        ['name' => 'archive_franchise_does_not_archive_owned_branches', 'pass' => $activeworkspacequeue === 2 && $archivedworkspacequeue === 1],
        ['name' => 'archived_school_disappears_from_active_queues', 'pass' => $archivedworkspacequeue === 1],
        ['name' => 'archived_school_retained_in_institution_audit', 'pass' => pqiml_audit_count($runid, 'institution_school_archived') >= 1],
    ];

    return [
        'runid' => $runid,
        'workspaces' => [
            'branch_a' => $branchaid,
            'branch_b' => $branchbid,
            'franchise' => $franchiseid,
        ],
        'users' => [
            'teacher' => $teacher,
            'student' => $student,
            'franchise_teacher' => $franchiseteacher,
        ],
        'mobility' => [
            'teacher_initial_branch_b_access' => $teacherinitialbranchb,
            'teacher_explicit_branch_b_access' => $teacherexplicitbranchb,
            'teacher_branch_a_active_memberships' => $branchamemberactive,
            'teacher_branch_b_active_memberships' => $branchbmemberactive,
            'student_branch_a_inactive_memberships' => $studentbranchainactive,
            'student_branch_b_active_memberships' => $studentbranchbactive,
        ],
        'lifecycle' => [
            'active_workspace_queue_count' => $activeworkspacequeue,
            'archived_workspace_queue_count' => $archivedworkspacequeue,
            'audit_rows' => pqiml_audit_count($runid),
        ],
        'checks' => $checks,
    ];
}

if ($runid === '') {
    $runid = 'institution-mobility-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
}

if ($action === 'run') {
    require_sesskey();
    try {
        $result = pqiml_fixture($consumerid, $workspaceid, $runid);
    } catch (Throwable $e) {
        $error = 'Institution mobility lifecycle failed: ' . $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_mobility_lifecycle.php', ['workspaceid' => $workspaceid]));
$PAGE->set_title('Institution Mobility And Lifecycle');
$PAGE->set_heading('Institution Mobility And Lifecycle');

echo $OUTPUT->header();
?>
<style>
.pqiml{max-width:1180px;margin:0 auto;padding:24px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqiml-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
.pqiml-muted{color:#637381;font-size:13px}
.pqiml-card{background:#fff;border:1px solid #d9e2ec;border-radius:8px;padding:18px;margin-bottom:16px;box-shadow:0 8px 24px rgba(23,48,68,.08)}
.pqiml-form{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}
.pqiml-label{display:block;font-weight:700;margin-bottom:5px}
.pqiml-input{width:100%;padding:10px 12px;border:1px solid #bdc9d6;border-radius:6px}
.pqiml-btn{display:inline-block;border:0;border-radius:6px;background:#2f6b4f;color:#fff;font-weight:800;padding:10px 14px;text-decoration:none}
.pqiml-alert{padding:12px 14px;border-radius:6px;margin-bottom:16px;font-weight:800}
.pqiml-alert--ok{background:#e7f6ed;color:#1f6d3a}
.pqiml-error{background:#fff1f0;color:#9f2f2f}
.pqiml-table{width:100%;border-collapse:collapse;margin-top:12px}
.pqiml-table th,.pqiml-table td{border-bottom:1px solid #edf1f5;padding:9px;text-align:left;vertical-align:top}
.pqiml-pill{display:inline-block;border-radius:999px;padding:3px 9px;font-weight:800;font-size:12px;background:#edf4ff;color:#244a84}
.pqiml-pass{background:#e8f7ed;color:#1f6d3a}
.pqiml-fail{background:#fdecec;color:#a33a31}
@media(max-width:720px){.pqiml-form{grid-template-columns:1fr}.pqiml-top{display:block}}
</style>
<div class="pqiml">
  <div class="pqiml-top">
    <div>
      <h2>Institution Mobility And Lifecycle</h2>
      <div class="pqiml-muted">Staff/student transfer permissions, transfer audit, archive lifecycle, active queue hiding, and retained institution audit.</div>
    </div>
    <a class="pqiml-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspaces.php', ['workspaceid' => $workspaceid]))->out(false); ?>">Workspaces</a>
  </div>
  <?php if ($error !== ''): ?><div class="pqiml-alert pqiml-error"><?php echo s($error); ?></div><?php endif; ?>
  <?php if ($result): ?><div class="pqiml-alert pqiml-alert--ok">Staff mobility, transfer audit, and institution data lifecycle verified.</div><?php endif; ?>
  <section class="pqiml-card">
    <form class="pqiml-form" method="post">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <input type="hidden" name="action" value="run">
      <div>
        <label class="pqiml-label" for="pqiml-runid">Run identifier</label>
        <input class="pqiml-input" id="pqiml-runid" name="runid" value="<?php echo s($runid); ?>">
      </div>
      <button class="pqiml-btn" type="submit">Run institution mobility lifecycle test</button>
    </form>
  </section>
  <?php if ($result): ?>
    <section class="pqiml-card">
      <h3>Verification Checks</h3>
      <table class="pqiml-table">
        <thead><tr><th>Check</th><th>Status</th></tr></thead>
        <tbody>
          <?php foreach ($result['checks'] as $check): ?>
            <tr><td><?php echo s($check['name']); ?></td><td><span class="pqiml-pill <?php echo $check['pass'] ? 'pqiml-pass' : 'pqiml-fail'; ?>"><?php echo $check['pass'] ? 'PASS' : 'FAIL'; ?></span></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <section class="pqiml-card">
      <h3>Active Queues And Audit</h3>
      <table class="pqiml-table">
        <tbody>
          <tr><th>Branch A workspace</th><td>#<?php echo (int)$result['workspaces']['branch_a']; ?></td></tr>
          <tr><th>Branch B workspace</th><td>#<?php echo (int)$result['workspaces']['branch_b']; ?></td></tr>
          <tr><th>Archived franchise workspace</th><td>#<?php echo (int)$result['workspaces']['franchise']; ?></td></tr>
          <tr><th>Active workspace queue count</th><td><?php echo (int)$result['lifecycle']['active_workspace_queue_count']; ?></td></tr>
          <tr><th>Institution audit rows</th><td><?php echo (int)$result['lifecycle']['audit_rows']; ?></td></tr>
        </tbody>
      </table>
    </section>
    <pre id="pqiml-result" style="display:none"><?php echo s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)); ?></pre>
  <?php endif; ?>
</div>
<?php
echo $OUTPUT->footer();
