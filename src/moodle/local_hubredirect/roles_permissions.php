<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

function pqrp_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqrp_time_from_date(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time ? (int)$time : 0;
}

function pqrp_users_for_workspace(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, wm.workspace_role
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
       ORDER BY wm.workspace_role ASC, u.lastname ASC, u.firstname ASC",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    ));
}

function pqrp_run_isolation_audit(int $workspaceid, int $actorid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_tenant_audit')) {
        return 0;
    }
    $created = 0;
    $now = time();
    $checks = [
        ['workspace_members_active', 'pass', 'workspace', $workspaceid, ['active_members' => pqh_table_exists_safe('local_prequran_workspace_member') ? $DB->count_records('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'status' => 'active']) : 0]],
        ['documents_scoped_to_workspace', 'pass', 'document', 0, ['document_count' => pqh_table_exists_safe('local_prequran_document') ? $DB->count_records('local_prequran_document', ['workspaceid' => $workspaceid]) : 0]],
        ['sessions_scoped_to_workspace', 'pass', 'session', 0, ['session_count' => pqh_table_exists_safe('local_prequran_live_session') ? $DB->count_records('local_prequran_live_session', ['workspaceid' => $workspaceid]) : 0]],
        ['support_access_reviewed', 'pass', 'support_grant', 0, ['active_grants' => pqh_table_exists_safe('local_prequran_support_grant') ? $DB->count_records_select('local_prequran_support_grant', 'workspaceid = :workspaceid AND status = :status AND (expiresat = 0 OR expiresat > :now)', ['workspaceid' => $workspaceid, 'status' => 'approved', 'now' => $now]) : 0]],
    ];
    foreach ($checks as $check) {
        $DB->insert_record('local_prequran_tenant_audit', (object)[
            'workspaceid' => $workspaceid,
            'userid' => $actorid,
            'check_key' => $check[0],
            'status' => $check[1],
            'targettype' => $check[2],
            'targetid' => $check[3],
            'detailsjson' => pqrp_json($check[4]),
            'timecreated' => $now,
        ]);
        $created++;
    }
    return $created;
}

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Roles and permissions require workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Permission access denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_capability') {
            if (!pqh_table_exists_safe('local_prequran_role_cap')) {
                throw new invalid_parameter_exception('Role capability table is not ready.');
            }
            $role = optional_param('rolekey', 'registrar', PARAM_ALPHANUMEXT);
            $cap = optional_param('capability', 'student.view', PARAM_TEXT);
            $existing = $DB->get_record('local_prequran_role_cap', ['workspaceid' => $workspaceid, 'rolekey' => $role, 'capability' => $cap], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'rolekey' => $role,
                'capability' => $cap,
                'allowed' => optional_param('allowed', 1, PARAM_INT) ? 1 : 0,
                'scope' => optional_param('scope', 'workspace', PARAM_ALPHANUMEXT),
                'conditionsjson' => pqrp_json(['note' => optional_param('note', '', PARAM_TEXT)]),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_role_cap', $record);
            } else {
                $DB->insert_record('local_prequran_role_cap', $record);
            }
            $notice = 'Capability override saved.';
        } else if ($action === 'save_support_grant') {
            if (!pqh_table_exists_safe('local_prequran_support_grant')) {
                throw new invalid_parameter_exception('Support grant table is not ready.');
            }
            $grantid = (int)$DB->insert_record('local_prequran_support_grant', (object)[
                'workspaceid' => $workspaceid,
                'supportuserid' => optional_param('supportuserid', 0, PARAM_INT),
                'targetuserid' => optional_param('targetuserid', 0, PARAM_INT),
                'grant_type' => optional_param('grant_type', 'support_impersonation', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'approved', PARAM_ALPHANUMEXT),
                'reason' => optional_param('reason', '', PARAM_TEXT),
                'approvedby' => (int)$USER->id,
                'approvedat' => $now,
                'expiresat' => pqrp_time_from_date(optional_param('expiresat', '', PARAM_TEXT)),
                'revokedby' => 0,
                'revokedat' => 0,
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $notice = 'Support access grant #' . $grantid . ' saved.';
        } else if ($action === 'log_support_session') {
            if (!pqh_table_exists_safe('local_prequran_support_session')) {
                throw new invalid_parameter_exception('Support session table is not ready.');
            }
            $grantid = optional_param('grantid', 0, PARAM_INT);
            $grant = $grantid > 0 ? $DB->get_record('local_prequran_support_grant', ['id' => $grantid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : null;
            $DB->insert_record('local_prequran_support_session', (object)[
                'workspaceid' => $workspaceid,
                'grantid' => $grantid,
                'supportuserid' => optional_param('supportuserid', (int)($grant->supportuserid ?? 0), PARAM_INT),
                'targetuserid' => optional_param('targetuserid', (int)($grant->targetuserid ?? 0), PARAM_INT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'reason' => optional_param('reason', (string)($grant->reason ?? ''), PARAM_TEXT),
                'entry_contextjson' => pqrp_json(['url' => optional_param('entry_url', '', PARAM_URL)]),
                'startedat' => $now,
                'endedat' => optional_param('status', 'active', PARAM_ALPHANUMEXT) === 'ended' ? $now : 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $notice = 'Support access session logged.';
        } else if ($action === 'run_audit') {
            $notice = 'Tenant isolation audit created ' . pqrp_run_isolation_audit($workspaceid, (int)$USER->id) . ' check row(s).';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/roles_permissions.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Roles, Permissions, And Multi-Tenant Controls');
$PAGE->set_heading('Roles, Permissions, And Multi-Tenant Controls');

$users = pqrp_users_for_workspace($workspaceid);
$caps = pqh_table_exists_safe('local_prequran_role_cap') ? array_values($DB->get_records('local_prequran_role_cap', ['workspaceid' => $workspaceid], 'rolekey ASC, capability ASC', '*', 0, 120)) : [];
$grants = pqh_table_exists_safe('local_prequran_support_grant') ? array_values($DB->get_records('local_prequran_support_grant', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$sessions = pqh_table_exists_safe('local_prequran_support_session') ? array_values($DB->get_records('local_prequran_support_session', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$audits = pqh_table_exists_safe('local_prequran_tenant_audit') ? array_values($DB->get_records('local_prequran_tenant_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$rolekeys = ['registrar', 'finance', 'teacher', 'assistant_teacher', 'parent', 'sponsor', 'support', 'auditor', 'coordinator'];
$capkeys = ['admissions.manage', 'registrar.manage', 'documents.manage', 'finance.manage', 'invoices.manage', 'payments.manage', 'payment_plans.view', 'teacher.portal', 'attendance.manage', 'grades.manage', 'notes.manage', 'parent.portal', 'student.portal', 'sponsor.portal', 'support.manage', 'support.impersonate.request', 'tenant.audit.view'];

echo $OUTPUT->header();
echo '<style>.pqrp{max-width:1180px;margin:0 auto}.pqrp-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqrp-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqrp-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqrp-field{margin-bottom:10px}.pqrp-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqrp-input,.pqrp-select,.pqrp-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqrp-textarea{min-height:72px}.pqrp-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqrp-btn--light{background:#f7fbf8;color:#173044}.pqrp-table{width:100%;border-collapse:collapse}.pqrp-table th,.pqrp-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqrp-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqrp-muted{color:#617064;font-size:12px}.pqrp-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqrp-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqrp-grid,.pqrp-top{display:block}}</style>';
echo '<div class="pqrp"><div class="pqrp-top"><div><h2>Roles, Permissions, And Multi-Tenant Controls</h2><div class="pqrp-muted">' . s($workspace->name) . ' fine-grained role capabilities, isolation audits, and support access controls.</div></div><a class="pqrp-btn pqrp-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqrp-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqrp-error">' . s($error) . '</div>'; }
echo '<div class="pqrp-grid"><section class="pqrp-panel"><h3>Capability Override</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_capability"><div class="pqrp-field"><label>Role</label><select class="pqrp-select" name="rolekey">';
foreach ($rolekeys as $role) { echo '<option value="' . s($role) . '">' . s($role) . '</option>'; }
echo '</select></div><div class="pqrp-field"><label>Capability</label><select class="pqrp-select" name="capability">';
foreach ($capkeys as $cap) { echo '<option value="' . s($cap) . '">' . s($cap) . '</option>'; }
echo '</select></div><div class="pqrp-field"><label>Scope</label><input class="pqrp-input" name="scope" value="workspace"></div><div class="pqrp-field"><label><input type="checkbox" name="allowed" value="1" checked> Allowed</label></div><div class="pqrp-field"><label>Note</label><textarea class="pqrp-textarea" name="note"></textarea></div><button class="pqrp-btn" type="submit">Save Capability</button></form><hr><h3>Support Access Grant</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_support_grant"><div class="pqrp-field"><label>Support user</label><select class="pqrp-select" name="supportuserid">';
foreach ($users as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqrp-field"><label>Target user</label><select class="pqrp-select" name="targetuserid">';
foreach ($users as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqrp-field"><label>Status</label><input class="pqrp-input" name="status" value="approved"></div><div class="pqrp-field"><label>Expires date</label><input class="pqrp-input" name="expiresat"></div><div class="pqrp-field"><label>Reason</label><textarea class="pqrp-textarea" name="reason"></textarea></div><button class="pqrp-btn" type="submit">Save Grant</button></form><hr><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="run_audit"><button class="pqrp-btn" type="submit">Run Isolation Audit</button></form></section><section class="pqrp-panel"><h3>Capability Overrides</h3><table class="pqrp-table"><thead><tr><th>Role</th><th>Capability</th><th>Allowed</th></tr></thead><tbody>';
foreach ($caps as $cap) { echo '<tr><td>' . s($cap->rolekey) . '</td><td>' . s($cap->capability) . '<div class="pqrp-muted">' . s($cap->scope) . '</div></td><td><span class="pqrp-pill">' . ((int)$cap->allowed ? 'allow' : 'deny') . '</span></td></tr>'; }
if (!$caps) { echo '<tr><td colspan="3" class="pqrp-muted">No explicit overrides. Role defaults are active.</td></tr>'; }
echo '</tbody></table><h3>Support Grants</h3><table class="pqrp-table"><thead><tr><th>Grant</th><th>Users</th><th>Status</th></tr></thead><tbody>';
foreach ($grants as $grant) { echo '<tr><td>#' . (int)$grant->id . '<div class="pqrp-muted">' . s($grant->grant_type) . '</div></td><td>Support #' . (int)$grant->supportuserid . ' -> target #' . (int)$grant->targetuserid . '</td><td><span class="pqrp-pill">' . s($grant->status) . '</span><div class="pqrp-muted">Expires ' . s((int)$grant->expiresat > 0 ? userdate((int)$grant->expiresat, '%Y-%m-%d') : 'never') . '</div></td></tr>'; }
if (!$grants) { echo '<tr><td colspan="3" class="pqrp-muted">No support grants yet.</td></tr>'; }
echo '</tbody></table><h3>Support Sessions</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="log_support_session"><select class="pqrp-select" name="grantid"><option value="0">No grant</option>';
foreach ($grants as $grant) { echo '<option value="' . (int)$grant->id . '">Grant #' . (int)$grant->id . '</option>'; }
echo '</select><input class="pqrp-input" name="reason" placeholder="Reason"><button class="pqrp-btn pqrp-btn--light">Log Session</button></form><table class="pqrp-table"><tbody>';
foreach ($sessions as $session) { echo '<tr><td>#' . (int)$session->id . '</td><td>Support #' . (int)$session->supportuserid . ' -> target #' . (int)$session->targetuserid . '</td><td><span class="pqrp-pill">' . s($session->status) . '</span></td></tr>'; }
echo '</tbody></table><h3>Tenant Isolation Audit</h3><table class="pqrp-table"><thead><tr><th>Check</th><th>Status</th><th>When</th></tr></thead><tbody>';
foreach ($audits as $audit) { echo '<tr><td>' . s($audit->check_key) . '<div class="pqrp-muted">' . s($audit->targettype) . ' #' . (int)$audit->targetid . '</div></td><td><span class="pqrp-pill">' . s($audit->status) . '</span></td><td>' . s(userdate((int)$audit->timecreated)) . '</td></tr>'; }
if (!$audits) { echo '<tr><td colspan="3" class="pqrp-muted">No tenant audit rows yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
