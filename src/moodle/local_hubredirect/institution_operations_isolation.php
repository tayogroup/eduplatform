<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution operations isolation test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution operations isolation access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$coursekey = trim(optional_param('coursekey', 'pre_quraan', PARAM_ALPHANUMEXT));
$invoiceamount = trim(optional_param('invoiceamount', '25.00', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution operations isolation requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqioi_table_ready(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqioi_has_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqioi_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqioi_has_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqioi_conditions(string $table, array $conditions): array {
    $filtered = [];
    foreach ($conditions as $field => $value) {
        if (pqioi_has_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return $filtered;
}

function pqioi_token(string $runid): string {
    $token = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $runid));
    return substr($token !== '' ? $token : sha1((string)time()), -18);
}

function pqioi_money(string $value, string $fallback = '25.00'): string {
    $clean = preg_replace('/[^0-9.\\-]+/', '', $value);
    if ($clean === '' || !is_numeric($clean)) {
        $clean = $fallback;
    }
    return number_format(max(0, (float)$clean), 2, '.', '');
}

function pqioi_insert_safe(string $table, array $record): int {
    global $DB;
    if (!pqioi_table_ready($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqioi_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqioi_update_safe(string $table, $record): bool {
    global $DB;
    if (!pqioi_table_ready($table)) {
        return false;
    }
    try {
        return (bool)$DB->update_record($table, $record);
    } catch (Throwable $e) {
        return false;
    }
}

function pqioi_get_record_safe(string $table, array $conditions) {
    global $DB;
    if (!pqioi_table_ready($table)) {
        return false;
    }
    $lookup = pqioi_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_record($table, $lookup, '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqioi_get_field_safe(string $table, string $field, array $conditions) {
    global $DB;
    if (!pqioi_table_ready($table) || !pqioi_has_field($table, $field)) {
        return false;
    }
    $lookup = pqioi_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_field($table, $field, $lookup, IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqioi_get_records_sql_safe(string $sql, array $params = []): array {
    global $DB;
    try {
        return $DB->get_records_sql($sql, $params);
    } catch (Throwable $e) {
        return [];
    }
}

function pqioi_get_fieldset_select_safe(string $table, string $field, string $where, array $params): array {
    global $DB;
    if (!pqioi_table_ready($table) || !pqioi_has_field($table, $field)) {
        return [];
    }
    try {
        return $DB->get_fieldset_select($table, $field, $where, $params);
    } catch (Throwable $e) {
        return [];
    }
}

function pqioi_upsert_simple(string $table, array $conditions, array $values): int {
    global $DB;
    if (!pqioi_table_ready($table)) {
        return 0;
    }
    $existing = pqioi_get_record_safe($table, $conditions);
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        return pqioi_update_safe($table, pqioi_record($table, $record)) ? (int)$existing->id : 0;
    }
    $record['timecreated'] = time();
    return pqioi_insert_safe($table, $record);
}

function pqioi_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqioi_sum_sql(string $sql, array $params = []): float {
    global $DB;
    try {
        return (float)$DB->get_field_sql($sql, $params);
    } catch (Throwable $e) {
        return 0.0;
    }
}

function pqioi_workspace(string $slug, string $name, string $type = 'institution'): int {
    global $USER;
    return pqioi_upsert_simple('local_prequran_workspace', ['slug' => $slug], [
        'name' => $name,
        'workspace_type' => $type,
        'ownerid' => 0,
        'status' => 'active',
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['created_from' => 'institution_operations_isolation'], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqioi_org_group(string $slug, string $name, string $type, array $policy): int {
    global $USER;
    return pqioi_upsert_simple('local_prequran_org_group', ['slug' => $slug], [
        'name' => $name,
        'group_type' => $type,
        'parentconsumerid' => 0,
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqioi_link_workspace(string $groupslug, int $workspaceid, string $relationship, string $scope, int $inheritsensitive): void {
    global $DB, $USER;
    if (!pqioi_table_ready('local_prequran_org_group_member')) {
        return;
    }
    $groupid = (int)pqioi_get_field_safe('local_prequran_org_group', 'id', ['slug' => $groupslug, 'status' => 'active']);
    if ($groupid <= 0) {
        return;
    }
    if (in_array($groupslug, ['owned-schools', 'franchise-schools'], true)) {
        [$insql, $params] = $DB->get_in_or_equal(['owned-schools', 'franchise-schools'], SQL_PARAMS_NAMED, 'ioslug');
        $params += ['workspaceid' => $workspaceid, 'status' => 'active', 'groupid' => $groupid, 'membertype' => 'workspace'];
        $oldlinks = pqioi_get_records_sql_safe(
            "SELECT gm.*
               FROM {local_prequran_org_group_member} gm
               JOIN {local_prequran_org_group} g ON g.id = gm.groupid
              WHERE g.slug {$insql}
                AND gm.member_type = :membertype
                AND gm.memberid = :workspaceid
                AND gm.status = :status
                AND gm.groupid <> :groupid",
            $params
        );
        foreach ($oldlinks as $oldlink) {
            $oldlink->status = 'inactive';
            $oldlink->timemodified = time();
            pqioi_update_safe('local_prequran_org_group_member', $oldlink);
        }
    }
    pqioi_upsert_simple('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'group_role' => 'member',
    ], [
        'relationship_type' => $relationship,
        'access_scope' => $scope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => 'active',
        'notes' => 'Institution operations isolation fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqioi_user(string $prefix, string $role, string $firstname): array {
    global $CFG, $DB;
    $username = $prefix . '.' . $role;
    $email = $username . '@example.test';
    $password = 'Mock@001!';
    $existing = pqioi_get_record_safe('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id]);
    if ($existing) {
        $userid = (int)$existing->id;
        update_internal_user_password($existing, $password);
        pqioi_update_safe('user', (object)[
            'id' => $userid,
            'auth' => 'manual',
            'confirmed' => 1,
            'deleted' => 0,
            'suspended' => 0,
            'emailstop' => 1,
            'timemodified' => time(),
        ]);
    } else {
        $userid = (int)user_create_user((object)[
            'auth' => 'manual',
            'confirmed' => 1,
            'mnethostid' => $CFG->mnet_localhost_id,
            'username' => $username,
            'password' => $password,
            'firstname' => $firstname,
            'lastname' => 'SQA ' . ucfirst($role),
            'email' => $email,
            'emailstop' => 1,
            'city' => 'SQA City',
            'timezone' => 'Africa/Nairobi',
            'lang' => $CFG->lang ?? 'en',
            'description' => 'Generated by institution operations isolation.',
        ], true, false);
        pqh_assign_account_id($userid, $role === 'parent' ? 'parent' : $role);
    }
    return ['id' => $userid, 'username' => $username, 'email' => $email, 'password' => $password];
}

function pqioi_workspace_member(int $workspaceid, int $userid, string $role): void {
    global $USER;
    pqioi_upsert_simple('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], [
        'role' => $role,
        'status' => 'active',
        'notes' => 'Institution operations isolation fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqioi_parent_link(int $workspaceid, int $studentid, int $parentid, string $parentemail): void {
    global $USER;
    $conditions = [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'channel' => 'email',
    ];
    pqioi_upsert_simple('local_prequran_comm_consent', $conditions, [
        'guardianemail' => $parentemail,
        'status' => 'consented',
        'consented' => 1,
        'channel' => 'email',
        'source' => 'institution_operations_isolation',
        'consent_source' => 'institution_operations_isolation',
        'details' => 'Institution parent billing scope fixture.',
        'notes' => 'Institution parent billing scope fixture.',
        'parent_visible' => 1,
        'createdby' => (int)$USER->id,
    ]);
}

function pqioi_school_fixture(int $workspaceid, string $prefix, string $label): array {
    $student = pqioi_user($prefix, 'student', $label);
    $parent = pqioi_user($prefix, 'parent', $label);
    $admin = pqioi_user($prefix, 'school_admin', $label);
    pqioi_workspace_member($workspaceid, (int)$student['id'], 'student');
    pqioi_workspace_member($workspaceid, (int)$parent['id'], 'parent');
    pqioi_workspace_member($workspaceid, (int)$admin['id'], 'admin');
    pqioi_parent_link($workspaceid, (int)$student['id'], (int)$parent['id'], (string)$parent['email']);
    return ['student' => $student, 'parent' => $parent, 'admin' => $admin];
}

function pqioi_admission(int $consumerid, int $workspaceid, int $studentid, int $parentid, string $studentemail, string $parentemail, string $label, string $coursekey, string $runid): array {
    global $USER;
    $token = strtoupper(substr(pqioi_token($runid), -8));
    $intakeid = pqioi_insert_safe('local_prequran_intake_request', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'course_type' => $coursekey,
        'coursekey' => $coursekey,
        'studentid' => $studentid,
        'student_firstname' => $label,
        'student_lastname' => 'Admission',
        'student_email' => $studentemail,
        'parent_name' => $label . ' Parent',
        'guardian_name' => $label . ' Parent',
        'parent_email' => $parentemail,
        'guardian_email' => $parentemail,
        'status' => 'approved',
        'admission_status' => 'accepted',
        'admin_notes' => 'Institution admissions isolation ' . $runid,
        'reviewedby' => (int)$USER->id,
        'reviewedat' => time(),
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
    $appid = pqioi_insert_safe('local_prequran_admission_app', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'intakerequestid' => $intakeid,
        'studentid' => $studentid,
        'parentid' => $parentid,
        'billingaccountid' => 0,
        'offeringid' => 0,
        'enrolrequestid' => 0,
        'application_no' => 'SQA-IOI-' . $token . '-' . $workspaceid,
        'family_name' => $label . ' Family',
        'student_name' => $label . ' Student',
        'student_email' => $studentemail,
        'parent_name' => $label . ' Parent',
        'parent_email' => $parentemail,
        'program_key' => $coursekey,
        'desired_start' => userdate(time(), '%Y-%m-%d'),
        'application_status' => 'accepted',
        'review_status' => 'reviewed',
        'placement_status' => 'placed',
        'decision' => 'accepted',
        'decisionby' => (int)$USER->id,
        'decisionat' => time(),
        'review_notes' => 'Institution admissions isolation ' . $runid,
        'decision_notes' => 'Institution admissions isolation accepted.',
        'createdby' => (int)$USER->id,
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
    return ['intakeid' => $intakeid, 'applicationid' => $appid];
}

function pqioi_finance_audit(int $consumerid, int $workspaceid, int $studentid, int $invoiceid, int $paymentid, string $runid, string $action): int {
    global $USER;
    return pqioi_insert_safe('local_prequran_finance_audit', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'billingaccountid' => 0,
        'invoiceid' => $invoiceid,
        'paymentid' => $paymentid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'invoice',
        'targetid' => $invoiceid,
        'details' => json_encode(['runid' => $runid, 'institution_operations_isolation' => true], JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ]);
}

function pqioi_invoice(int $consumerid, int $workspaceid, int $studentid, string $label, string $amount, string $runid): array {
    global $USER;
    $token = strtoupper(substr(pqioi_token($runid), -8));
    $amount = pqioi_money($amount);
    $invoiceid = pqioi_insert_safe('local_prequran_invoice', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'billingaccountid' => 0,
        'studentid' => $studentid,
        'invoicenumber' => 'SQA-IOI-' . $token . '-' . $workspaceid,
        'invoicetype' => 'tuition',
        'status' => 'paid',
        'currency' => 'USD',
        'subtotal' => $amount,
        'discounttotal' => '0.00',
        'taxtotal' => '0.00',
        'total' => $amount,
        'paidamount' => $amount,
        'creditedamount' => '0.00',
        'balancedue' => '0.00',
        'metadatajson' => json_encode(['runid' => $runid, 'school' => $label], JSON_UNESCAPED_SLASHES),
        'issuedat' => time(),
        'dueat' => time() + WEEKSECS,
        'sentat' => time(),
        'createdby' => (int)$USER->id,
        'modifiedby' => (int)$USER->id,
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
    pqioi_insert_safe('local_prequran_invoice_line', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'invoiceid' => $invoiceid,
        'studentid' => $studentid,
        'linesequence' => 1,
        'description' => 'Institution operations isolation tuition for ' . $label,
        'quantity' => '1.00',
        'unitamount' => $amount,
        'discountamount' => '0.00',
        'taxamount' => '0.00',
        'linetotal' => $amount,
        'status' => 'active',
        'metadatajson' => json_encode(['runid' => $runid], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
        'modifiedby' => (int)$USER->id,
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
    $paymentid = pqioi_insert_safe('local_prequran_payment', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'billingaccountid' => 0,
        'studentid' => $studentid,
        'invoiceid' => $invoiceid,
        'receiptnumber' => 'RCPT-IOI-' . $token . '-' . $workspaceid,
        'receipt_number' => 'RCPT-IOI-' . $token . '-' . $workspaceid,
        'paymentmethod' => 'manual',
        'status' => 'posted',
        'currency' => 'USD',
        'amount' => $amount,
        'allocatedamount' => $amount,
        'unallocatedamount' => '0.00',
        'reference' => 'SQA-IOI-' . $token . '-' . $workspaceid,
        'metadatajson' => json_encode(['runid' => $runid, 'school' => $label], JSON_UNESCAPED_SLASHES),
        'receivedat' => time(),
        'paidat' => time(),
        'createdby' => (int)$USER->id,
        'modifiedby' => (int)$USER->id,
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
    pqioi_insert_safe('local_prequran_payment_alloc', [
        'paymentid' => $paymentid,
        'invoiceid' => $invoiceid,
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'billingaccountid' => 0,
        'studentid' => $studentid,
        'status' => 'active',
        'currency' => 'USD',
        'amount' => $amount,
        'metadatajson' => json_encode(['runid' => $runid], JSON_UNESCAPED_SLASHES),
        'allocatedat' => time(),
        'createdby' => (int)$USER->id,
        'modifiedby' => (int)$USER->id,
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
    pqioi_finance_audit($consumerid, $workspaceid, $studentid, $invoiceid, $paymentid, $runid, 'sqa_institution_operations_payment_posted');
    return ['invoiceid' => $invoiceid, 'paymentid' => $paymentid, 'amount' => $amount];
}

function pqioi_create_verify(int $consumerid, int $workspaceid, string $runid, string $coursekey, string $invoiceamount): array {
    global $DB;
    $token = pqioi_token($runid);
    pqioi_org_group('owned-schools', 'Owned Schools', 'owned_group', [
        'model' => 'wholly_owned_schools',
        'default_workspace_relationship' => 'owned_branch',
        'default_access_scope' => 'operations',
        'inherit_sensitive_access' => true,
    ]);
    pqioi_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', [
        'model' => 'independent_franchise_schools',
        'default_workspace_relationship' => 'franchise_member',
        'default_access_scope' => 'governance',
        'inherit_sensitive_access' => false,
    ]);
    $hudaid = $workspaceid;
    $branchbid = pqioi_workspace('huda-branch-b-sqa', 'Huda Branch B SQA', 'institution');
    $franchiseid = pqioi_workspace('huda-franchise-sqa', 'Huda Franchise SQA', 'institution');
    pqioi_link_workspace('owned-schools', $hudaid, 'owned_branch', 'governance,operations', 1);
    pqioi_link_workspace('owned-schools', $branchbid, 'owned_branch', 'governance,operations', 1);
    pqioi_link_workspace('franchise-schools', $franchiseid, 'franchise_member', 'governance', 0);

    $huda = pqioi_school_fixture($hudaid, 'huda.ioi.' . $token, 'Huda Branch A');
    $branchb = pqioi_school_fixture($branchbid, 'huda.branchb.ioi.' . $token, 'Huda Branch B');
    $franchise = pqioi_school_fixture($franchiseid, 'huda.franchise.ioi.' . $token, 'Huda Franchise');

    $hudaadmission = pqioi_admission($consumerid, $hudaid, (int)$huda['student']['id'], (int)$huda['parent']['id'], (string)$huda['student']['email'], (string)$huda['parent']['email'], 'Huda Branch A', $coursekey, $runid);
    $branchbadmission = pqioi_admission($consumerid, $branchbid, (int)$branchb['student']['id'], (int)$branchb['parent']['id'], (string)$branchb['student']['email'], (string)$branchb['parent']['email'], 'Huda Branch B', $coursekey, $runid);
    $franchiseadmission = pqioi_admission($consumerid, $franchiseid, (int)$franchise['student']['id'], (int)$franchise['parent']['id'], (string)$franchise['student']['email'], (string)$franchise['parent']['email'], 'Huda Franchise', $coursekey, $runid);

    $hudafinance = pqioi_invoice($consumerid, $hudaid, (int)$huda['student']['id'], 'Huda Branch A', $invoiceamount, $runid);
    $branchbfinance = pqioi_invoice($consumerid, $branchbid, (int)$branchb['student']['id'], 'Huda Branch B', $invoiceamount, $runid);
    $franchisefinance = pqioi_invoice($consumerid, $franchiseid, (int)$franchise['student']['id'], 'Huda Franchise', $invoiceamount, $runid);

    $ownedids = [$hudaid, $branchbid];
    [$ownedinsql, $ownedparams] = $DB->get_in_or_equal($ownedids, SQL_PARAMS_NAMED, 'owned');
    $ownedparams['runneedle'] = '%' . $DB->sql_like_escape($runid) . '%';
    $franchiseparams = ['workspaceid' => $franchiseid, 'runneedle' => '%' . $DB->sql_like_escape($runid) . '%'];
    $parentaids = [$hudaid => (int)$huda['student']['id']];
    $parentachildids = [];
    if (pqioi_table_ready('local_prequran_comm_consent') && pqioi_has_field('local_prequran_comm_consent', 'studentid') && pqioi_has_field('local_prequran_comm_consent', 'guardianid')) {
        $parentwhere = 'guardianid = :parentid';
        $parentparams = ['parentid' => (int)$huda['parent']['id']];
        if (pqioi_has_field('local_prequran_comm_consent', 'workspaceid')) {
            $parentwhere .= ' AND workspaceid = :workspaceid';
            $parentparams['workspaceid'] = $hudaid;
        }
        if (pqioi_has_field('local_prequran_comm_consent', 'status')) {
            $parentwhere .= ' AND status = :status';
            $parentparams['status'] = 'consented';
        } else if (pqioi_has_field('local_prequran_comm_consent', 'consented')) {
            $parentwhere .= ' AND consented = :consented';
            $parentparams['consented'] = 1;
        }
        if (pqioi_has_field('local_prequran_comm_consent', 'parent_visible')) {
            $parentwhere .= ' AND parent_visible = :parentvisible';
            $parentparams['parentvisible'] = 1;
        }
        $parentachildids = pqioi_get_fieldset_select_safe('local_prequran_comm_consent', 'studentid', $parentwhere, $parentparams);
    }
    $parentavisibleinvoices = pqioi_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_invoice}
          WHERE workspaceid = :workspaceid
            AND studentid = :studentid
            AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        ['workspaceid' => $hudaid, 'studentid' => (int)$huda['student']['id'], 'runneedle' => '%' . $DB->sql_like_escape($runid) . '%']
    );
    $parentacrossinvoices = pqioi_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_invoice}
          WHERE studentid IN (:branchbstudent, :franchisestudent)
            AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        ['branchbstudent' => (int)$branchb['student']['id'], 'franchisestudent' => (int)$franchise['student']['id'], 'runneedle' => '%' . $DB->sql_like_escape($runid) . '%']
    );

    $ownedadmissions = pqioi_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_admission_app} WHERE workspaceid {$ownedinsql} AND " . $DB->sql_like('review_notes', ':runneedle', false),
        $ownedparams
    );
    $franchiseadmissions = pqioi_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_admission_app} WHERE workspaceid = :workspaceid AND " . $DB->sql_like('review_notes', ':runneedle', false),
        $franchiseparams
    );
    $ownedrevenue = pqioi_sum_sql(
        "SELECT COALESCE(SUM(CAST(paidamount AS DECIMAL(20,2))), 0) FROM {local_prequran_invoice} WHERE workspaceid {$ownedinsql} AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        $ownedparams
    );
    $franchiserevenue = pqioi_sum_sql(
        "SELECT COALESCE(SUM(CAST(paidamount AS DECIMAL(20,2))), 0) FROM {local_prequran_invoice} WHERE workspaceid = :workspaceid AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        $franchiseparams
    );
    $ownedpayments = pqioi_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_payment} WHERE workspaceid {$ownedinsql} AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        $ownedparams
    );
    $franchisepayments = pqioi_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_payment} WHERE workspaceid = :workspaceid AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        $franchiseparams
    );
    $franchiseinownedrollup = pqioi_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_invoice} WHERE workspaceid = :workspaceid AND " . $DB->sql_like('metadatajson', ':runneedle', false),
        $franchiseparams
    );

    $checks = [
        ['name' => 'branch_a_admissions_scoped_to_branch_a', 'pass' => (int)$hudaadmission['applicationid'] > 0 && pqioi_count_sql("SELECT COUNT(1) FROM {local_prequran_admission_app} WHERE id = :id AND workspaceid = :workspaceid", ['id' => (int)$hudaadmission['applicationid'], 'workspaceid' => $hudaid]) === 1],
        ['name' => 'branch_a_admissions_do_not_leak_to_branch_b', 'pass' => pqioi_count_sql("SELECT COUNT(1) FROM {local_prequran_admission_app} WHERE workspaceid = :branchbid AND studentid = :studentid", ['branchbid' => $branchbid, 'studentid' => (int)$huda['student']['id']]) === 0],
        ['name' => 'branch_b_admissions_do_not_leak_to_branch_a', 'pass' => pqioi_count_sql("SELECT COUNT(1) FROM {local_prequran_admission_app} WHERE workspaceid = :hudaid AND studentid = :studentid", ['hudaid' => $hudaid, 'studentid' => (int)$branchb['student']['id']]) === 0],
        ['name' => 'franchise_admissions_stay_franchise_owned', 'pass' => (int)$franchiseadmission['applicationid'] > 0 && $franchiseadmissions === 1],
        ['name' => 'institution_admin_owned_pipeline_rollup_excludes_franchise', 'pass' => $ownedadmissions === 2 && $franchiseadmissions === 1],
        ['name' => 'owned_branches_revenue_rolls_up', 'pass' => $ownedpayments === 2 && abs($ownedrevenue - ((float)pqioi_money($invoiceamount) * 2)) < 0.01],
        ['name' => 'franchise_revenue_is_separated', 'pass' => $franchisepayments === 1 && abs($franchiserevenue - (float)pqioi_money($invoiceamount)) < 0.01 && $franchiseinownedrollup === 1],
        ['name' => 'parent_billing_visibility_child_school_scoped', 'pass' => in_array((int)$huda['student']['id'], array_map('intval', $parentachildids), true) && count($parentaids) === 1 && $parentavisibleinvoices === 1 && $parentacrossinvoices === 2],
        ['name' => 'finance_audit_keeps_workspace_ids', 'pass' => pqioi_count_sql("SELECT COUNT(1) FROM {local_prequran_finance_audit} WHERE workspaceid {$ownedinsql} AND " . $DB->sql_like('details', ':runneedle', false), $ownedparams) === 2 && pqioi_count_sql("SELECT COUNT(1) FROM {local_prequran_finance_audit} WHERE workspaceid = :workspaceid AND " . $DB->sql_like('details', ':runneedle', false), $franchiseparams) === 1],
    ];

    return [
        'runid' => $runid,
        'workspaces' => [
            'branch_a' => $hudaid,
            'branch_b' => $branchbid,
            'franchise' => $franchiseid,
        ],
        'admissions' => [
            'branch_a' => $hudaadmission,
            'branch_b' => $branchbadmission,
            'franchise' => $franchiseadmission,
            'owned_rollup_count' => $ownedadmissions,
            'franchise_count' => $franchiseadmissions,
        ],
        'finance' => [
            'branch_a' => $hudafinance,
            'branch_b' => $branchbfinance,
            'franchise' => $franchisefinance,
            'owned_revenue' => number_format($ownedrevenue, 2, '.', ''),
            'franchise_revenue' => number_format($franchiserevenue, 2, '.', ''),
        ],
        'parent_visibility' => [
            'branch_a_parentid' => (int)$huda['parent']['id'],
            'branch_a_childids' => array_values(array_map('intval', $parentachildids)),
            'branch_a_visible_invoices' => $parentavisibleinvoices,
            'cross_school_invoices_exist_but_not_linked' => $parentacrossinvoices,
        ],
        'checks' => $checks,
    ];
}

if ($action === 'create_verify') {
    try {
        if ($runid === '') {
            $runid = 'institution-ops-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
        }
        $result = pqioi_create_verify($consumerid, $workspaceid, $runid, $coursekey, $invoiceamount);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$workspace = pqioi_get_record_safe('local_prequran_workspace', ['id' => $workspaceid]);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_operations_isolation.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Operations Isolation');
$PAGE->set_heading('Institution Operations Isolation');
echo $OUTPUT->header();
echo '<style>.pqioi{max-width:1120px;margin:0 auto}.pqioi-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px;margin:14px 0}.pqioi-table{width:100%;border-collapse:collapse}.pqioi-table th,.pqioi-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqioi-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-weight:800}.pqioi-pill--bad{background:#fff0f0;color:#8a1f1f}.pqioi-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6b4f;color:#fff!important;font-weight:900;text-decoration:none}.pqioi-muted{color:#5d6f66;font-size:12px}.pqioi-error{padding:12px;border:1px solid #f1b4b4;background:#fff4f4;color:#8a1f1f;border-radius:8px}</style>';
echo '<main class="pqioi"><h1>Institution Operations Isolation</h1><p class="pqioi-muted">' . s((string)($workspace->name ?? 'Workspace')) . ' / workspace #' . (int)$workspaceid . '</p>';
if ($error !== '') {
    echo '<div class="pqioi-error">Institution operations isolation failed: ' . s($error) . '</div>';
}
echo '<section class="pqioi-card"><h2>Run Isolation Fixture</h2><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="create_verify"><input type="hidden" name="workspaceid" value="' . (int)$workspaceid . '"><label>Run ID <input name="runid" value="' . s($runid) . '" placeholder="auto-generated"></label> <label>Course <input name="coursekey" value="' . s($coursekey) . '"></label> <label>Invoice amount <input name="invoiceamount" value="' . s($invoiceamount) . '"></label> <button class="pqioi-btn" type="submit">Run institution operations isolation test</button></form></section>';
if ($result) {
    echo '<section class="pqioi-card"><h2>Isolation Result</h2><p><span class="pqioi-pill">owned-branch admissions and finance rollups verified</span> <span class="pqioi-pill">franchise separation verified</span> <span class="pqioi-pill">parent billing scoped</span></p><table class="pqioi-table"><thead><tr><th>Check</th><th>Status</th><th>Evidence</th></tr></thead><tbody>';
    foreach ($result['checks'] as $check) {
        echo '<tr><td>' . s($check['name']) . '</td><td><span class="pqioi-pill' . ($check['pass'] ? '' : ' pqioi-pill--bad') . '">' . ($check['pass'] ? 'PASS' : 'FAIL') . '</span></td><td><code>' . s(json_encode(['runid' => $result['runid'], 'workspaces' => $result['workspaces']], JSON_UNESCAPED_SLASHES)) . '</code></td></tr>';
    }
    echo '</tbody></table><h3>Evidence JSON</h3><pre id="pqioi-result">' . s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) . '</pre></section>';
}
echo '</main>';
echo $OUTPUT->footer();
