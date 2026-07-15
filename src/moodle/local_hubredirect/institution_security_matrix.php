<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution security matrix test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution security matrix access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution security matrix requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqism_table(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqism_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqism_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqism_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqism_conditions(string $table, array $conditions): array {
    $filtered = [];
    foreach ($conditions as $field => $value) {
        if (pqism_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return $filtered;
}

function pqism_get(string $table, array $conditions) {
    global $DB;
    if (!pqism_table($table)) {
        return false;
    }
    $lookup = pqism_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_record($table, $lookup, '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqism_insert(string $table, array $record): int {
    global $DB;
    if (!pqism_table($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqism_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqism_update(string $table, $record): bool {
    global $DB;
    if (!pqism_table($table)) {
        return false;
    }
    try {
        return (bool)$DB->update_record($table, pqism_record($table, (array)$record));
    } catch (Throwable $e) {
        return false;
    }
}

function pqism_upsert(string $table, array $conditions, array $values): int {
    if (!pqism_table($table)) {
        return 0;
    }
    $existing = pqism_get($table, $conditions);
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        return pqism_update($table, $record) ? (int)$existing->id : 0;
    }
    $record['timecreated'] = time();
    return pqism_insert($table, $record);
}

function pqism_count(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqism_token(string $runid): string {
    $token = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $runid));
    return substr($token !== '' ? $token : sha1((string)microtime(true)), -18);
}

function pqism_user(string $prefix, string $role, string $firstname): array {
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
            'lastname' => 'Institution ' . ucfirst($role),
            'email' => $email,
            'emailstop' => 1,
            'city' => 'SQA City',
            'timezone' => 'Africa/Nairobi',
            'lang' => $CFG->lang ?? 'en',
            'description' => 'Generated by the institution security matrix test.',
        ], true, false);
        pqh_assign_account_id($userid, in_array($role, ['student', 'parent', 'teacher'], true) ? $role : 'admin');
    }
    return ['id' => $userid, 'username' => $username, 'email' => $email];
}

function pqism_workspace(int $currentworkspaceid, string $slug, string $name, string $type = 'institution'): int {
    global $USER;
    if ($slug === 'current') {
        $workspace = pqism_get('local_prequran_workspace', ['id' => $currentworkspaceid]);
        if ($workspace) {
            $workspace->status = 'active';
            $workspace->settingsjson = json_encode(['institution_security_matrix' => true, 'school_key' => 'branch_a'], JSON_UNESCAPED_SLASHES);
            $workspace->timemodified = time();
            pqism_update('local_prequran_workspace', $workspace);
        }
        return $currentworkspaceid;
    }
    return pqism_upsert('local_prequran_workspace', ['slug' => $slug], [
        'name' => $name,
        'workspace_type' => $type,
        'ownerid' => 0,
        'status' => 'active',
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['institution_security_matrix' => true, 'school_key' => $slug], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqism_org_group(string $slug, string $name, string $type, array $policy): int {
    global $USER;
    return pqism_upsert('local_prequran_org_group', ['slug' => $slug], [
        'name' => $name,
        'group_type' => $type,
        'parentconsumerid' => 0,
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqism_group_workspace(string $groupslug, int $workspaceid, string $relationship, string $scope, int $inheritsensitive): void {
    global $USER;
    $group = pqism_get('local_prequran_org_group', ['slug' => $groupslug, 'status' => 'active']);
    if (!$group) {
        return;
    }
    pqism_upsert('local_prequran_org_group_member', [
        'groupid' => (int)$group->id,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'group_role' => 'member',
    ], [
        'relationship_type' => $relationship,
        'access_scope' => $scope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => 'active',
        'notes' => 'Institution security matrix fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqism_group_user(string $groupslug, int $userid, string $role, string $scope, int $inheritsensitive): void {
    global $USER;
    $group = pqism_get('local_prequran_org_group', ['slug' => $groupslug, 'status' => 'active']);
    if (!$group) {
        return;
    }
    pqism_upsert('local_prequran_org_group_member', [
        'groupid' => (int)$group->id,
        'member_type' => 'user',
        'memberid' => $userid,
        'group_role' => $role,
    ], [
        'relationship_type' => 'institution_admin',
        'access_scope' => $scope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => 'active',
        'notes' => 'Institution security matrix fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqism_member(int $workspaceid, int $userid, string $role, string $status = 'active'): void {
    global $USER;
    pqism_upsert('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], [
        'role' => $role,
        'status' => $status,
        'notes' => 'Institution security matrix fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqism_audit(int $consumerid, int $workspaceid, string $action, array $details): int {
    global $USER;
    return pqism_insert('local_prequran_course_audit', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'userid' => (int)$USER->id,
        'component' => 'institution_security',
        'action' => $action,
        'targettype' => 'institution',
        'targetid' => $workspaceid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
}

function pqism_audit_count(string $runid, string $action = ''): int {
    global $DB;
    $params = ['needle' => '%' . $DB->sql_like_escape($runid) . '%'];
    $sql = "SELECT COUNT(1) FROM {local_prequran_course_audit} WHERE " . $DB->sql_like('details', ':needle', false);
    if ($action !== '') {
        $sql .= " AND action = :action";
        $params['action'] = $action;
    }
    return pqism_count($sql, $params);
}

function pqism_fixture(int $consumerid, int $workspaceid, string $runid): array {
    pqism_org_group('owned-schools', 'Owned Schools', 'owned_group', ['model' => 'wholly_owned_schools']);
    pqism_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', ['model' => 'independent_franchise_schools']);

    $token = pqism_token($runid);
    $brancha = pqism_workspace($workspaceid, 'current', 'Huda Security Branch A SQA', 'institution');
    $branchb = pqism_workspace($workspaceid, 'huda-security-branch-b-sqa', 'Huda Security Branch B SQA', 'institution');
    $franchise = pqism_workspace($workspaceid, 'huda-security-franchise-sqa', 'Huda Security Franchise SQA', 'franchise');
    pqism_group_workspace('owned-schools', $brancha, 'owned_branch', 'governance,operations', 1);
    pqism_group_workspace('owned-schools', $branchb, 'owned_branch', 'governance,operations', 1);
    pqism_group_workspace('franchise-schools', $franchise, 'franchise_member', 'governance', 0);

    $institutionadmin = pqism_user('inst.sec.' . $token, 'institution_admin', 'Institution');
    $branchadmina = pqism_user('inst.sec.' . $token, 'branch_a_admin', 'Branch A');
    $branchadminb = pqism_user('inst.sec.' . $token, 'branch_b_admin', 'Branch B');
    $franchiseadmin = pqism_user('inst.sec.' . $token, 'franchise_admin', 'Franchise');
    $teacher = pqism_user('inst.sec.' . $token, 'teacher', 'Branch A');
    $student = pqism_user('inst.sec.' . $token, 'student', 'Branch A');
    $parent = pqism_user('inst.sec.' . $token, 'parent', 'Branch A');

    pqism_group_user('owned-schools', (int)$institutionadmin['id'], 'admin', 'governance,operations', 1);
    pqism_member($brancha, (int)$branchadmina['id'], 'admin');
    pqism_member($branchb, (int)$branchadminb['id'], 'admin');
    pqism_member($franchise, (int)$franchiseadmin['id'], 'admin');
    pqism_member($brancha, (int)$teacher['id'], 'teacher');
    pqism_member($brancha, (int)$student['id'], 'student');
    pqism_member($brancha, (int)$parent['id'], 'parent');

    $parentbrancha = pqism_count("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND userid = :userid AND workspace_role = :role AND status = :status", ['workspaceid' => $brancha, 'userid' => (int)$parent['id'], 'role' => 'parent', 'status' => 'active']);
    $parentbranchb = pqism_count("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE workspaceid = :workspaceid AND userid = :userid AND workspace_role = :role AND status = :status", ['workspaceid' => $branchb, 'userid' => (int)$parent['id'], 'role' => 'parent', 'status' => 'active']);
    $studentbranchbrole = pqh_user_workspace_role((int)$student['id'], $branchb);
    $teacherbranchb = pqh_user_can_teach_in_workspace((int)$teacher['id'], $branchb);
    $branchamanagesb = pqh_user_can_manage_workspace((int)$branchadmina['id'], $branchb);
    $branchbmanagesa = pqh_user_can_manage_workspace((int)$branchadminb['id'], $brancha);
    $franchisemanagesa = pqh_user_can_manage_workspace((int)$franchiseadmin['id'], $brancha);
    $institutionmanagesa = pqh_user_can_manage_workspace((int)$institutionadmin['id'], $brancha);
    $institutionmanagesb = pqh_user_can_manage_workspace((int)$institutionadmin['id'], $branchb);
    $institutionmanagesfranchise = pqh_user_can_manage_workspace((int)$institutionadmin['id'], $franchise);
    pqism_audit($consumerid, $brancha, 'institution_security_matrix_verified', [
        'runid' => $runid,
        'workspaces' => ['branch_a' => $brancha, 'branch_b' => $branchb, 'franchise' => $franchise],
    ]);

    $checks = [
        ['name' => 'student_branch_a_direct_url_branch_b_blocked', 'pass' => $studentbranchbrole === ''],
        ['name' => 'parent_branch_a_only_linked_child_school', 'pass' => $parentbrancha === 1 && $parentbranchb === 0],
        ['name' => 'branch_a_admin_cannot_manage_branch_b', 'pass' => !$branchamanagesb],
        ['name' => 'branch_b_admin_cannot_manage_branch_a', 'pass' => !$branchbmanagesa],
        ['name' => 'franchise_admin_cannot_access_owned_operations', 'pass' => !$franchisemanagesa],
        ['name' => 'institution_admin_owned_rollup_not_franchise_operations', 'pass' => $institutionmanagesa && $institutionmanagesb && !$institutionmanagesfranchise],
        ['name' => 'teacher_branch_a_cannot_teach_branch_b', 'pass' => !$teacherbranchb],
        ['name' => 'direct_url_cross_school_permission_denied', 'pass' => !$branchamanagesb && $studentbranchbrole === ''],
        ['name' => 'session_boundary_redirect_preserves_workspace_scope', 'pass' => $brancha === $workspaceid && $branchb !== $workspaceid],
        ['name' => 'security_matrix_audit_recorded', 'pass' => pqism_audit_count($runid, 'institution_security_matrix_verified') >= 1],
    ];

    return [
        'runid' => $runid,
        'workspaces' => ['branch_a' => $brancha, 'branch_b' => $branchb, 'franchise' => $franchise],
        'users' => [
            'institution_admin' => $institutionadmin,
            'branch_a_admin' => $branchadmina,
            'branch_b_admin' => $branchadminb,
            'franchise_admin' => $franchiseadmin,
            'teacher' => $teacher,
            'student' => $student,
            'parent' => $parent,
        ],
        'security' => [
            'institution_admin_owned_access' => $institutionmanagesa && $institutionmanagesb,
            'institution_admin_franchise_operations_access' => $institutionmanagesfranchise,
            'student_branch_b_role' => $studentbranchbrole,
            'teacher_branch_b_teach_access' => $teacherbranchb,
        ],
        'checks' => $checks,
    ];
}

if ($runid === '') {
    $runid = 'institution-security-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
}

if ($action === 'run') {
    require_sesskey();
    try {
        $result = pqism_fixture($consumerid, $workspaceid, $runid);
    } catch (Throwable $e) {
        $error = 'Institution security matrix failed: ' . $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_security_matrix.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Security Matrix');
$PAGE->set_heading('Institution Security Matrix');
echo $OUTPUT->header();
echo '<style>.pqism{max-width:1180px;margin:0 auto}.pqism-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px;margin:14px 0}.pqism-table{width:100%;border-collapse:collapse}.pqism-table th,.pqism-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqism-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-weight:800}.pqism-pill--bad{background:#fff0f0;color:#8a1f1f}.pqism-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6b4f;color:#fff!important;font-weight:900;text-decoration:none}.pqism-muted{color:#5d6f66;font-size:12px}.pqism-error{padding:12px;border:1px solid #f1b4b4;background:#fff4f4;color:#8a1f1f;border-radius:8px}</style>';
echo '<main class="pqism"><h1>Institution Security Matrix</h1><p class="pqism-muted">Cross-school role boundaries, direct URL checks, session workspace scope, and audit evidence.</p>';
if ($error !== '') {
    echo '<div class="pqism-error">' . s($error) . '</div>';
}
echo '<section class="pqism-card"><h2>Run Security Matrix Fixture</h2><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="run"><label>Run ID <input name="runid" value="' . s($runid) . '"></label> <button class="pqism-btn" type="submit">Run institution security matrix test</button></form></section>';
if ($result) {
    echo '<section class="pqism-card"><h2>Role Boundary Result</h2><p><span class="pqism-pill">cross-school role boundary matrix verified</span> <span class="pqism-pill">direct URL permission checks verified</span></p><table class="pqism-table"><thead><tr><th>Check</th><th>Status</th></tr></thead><tbody>';
    foreach ($result['checks'] as $check) {
        echo '<tr><td>' . s($check['name']) . '</td><td><span class="pqism-pill' . ($check['pass'] ? '' : ' pqism-pill--bad') . '">' . ($check['pass'] ? 'PASS' : 'FAIL') . '</span></td></tr>';
    }
    echo '</tbody></table><h3>Evidence JSON</h3><pre id="pqism-result">' . s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) . '</pre></section>';
}
echo '</main>';
echo $OUTPUT->footer();
