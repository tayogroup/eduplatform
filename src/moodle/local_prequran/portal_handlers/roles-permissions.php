<?php
// ---- report: roles-permissions (fine-grained role capabilities, isolation
// ---- audits, and support access controls; read + permission writes) ----------
// Ported from local_hubredirect/roles_permissions.php via
// roles_permissions_portallib (pqrp_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the roles/permissions matrix as the legacy page builds it (workspace
//        members, capability overrides, support grants, support sessions,
//        tenant-isolation audit rows, plus the role/capability whitelists) +
//        names for the user ids referenced.
// POST = do=save_capability | save_support_grant | log_support_session |
//        run_audit — each the legacy action=... write VERBATIM (same table-ready
//        guards, same fields, same param types/defaults and messages).
//        require_sesskey() dropped: token auth replaces it.
// (roles_permissions.php has no pqh_live_security_audit calls — none to keep;
//  its entry check is pqh_access_denied(...), ported to pqpd_fail(403, same).)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/roles_permissions_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- workspace resolution + entry access check (same order and messages as the
// -- legacy page): current-workspace fallback, manage check, record check.
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    // Legacy: pqh_access_denied('Roles and permissions require workspace administrator access.', ...)
    pqpd_fail(403, 'Roles and permissions require workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if ($ispost) {
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $now = time();
    $notice = '';
    try {
        if ($do === 'save_capability') {
            // -- write: save_capability (legacy action=save_capability, verbatim) --
            if (!pqh_table_exists_safe('local_prequran_role_cap')) {
                throw new invalid_parameter_exception('Role capability table is not ready.');
            }
            $role = clean_param((string)($body['rolekey'] ?? 'registrar'), PARAM_ALPHANUMEXT);
            $cap = clean_param((string)($body['capability'] ?? 'student.view'), PARAM_TEXT);
            $existing = $DB->get_record('local_prequran_role_cap', ['workspaceid' => $workspaceid, 'rolekey' => $role, 'capability' => $cap], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'rolekey' => $role,
                'capability' => $cap,
                'allowed' => clean_param((string)($body['allowed'] ?? '1'), PARAM_INT) ? 1 : 0,
                'scope' => clean_param((string)($body['scope'] ?? 'workspace'), PARAM_ALPHANUMEXT),
                'conditionsjson' => pqrp_json(['note' => clean_param((string)($body['note'] ?? ''), PARAM_TEXT)]),
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
        } else if ($do === 'save_support_grant') {
            // -- write: save_support_grant (legacy action=save_support_grant, verbatim) --
            if (!pqh_table_exists_safe('local_prequran_support_grant')) {
                throw new invalid_parameter_exception('Support grant table is not ready.');
            }
            $grantid = (int)$DB->insert_record('local_prequran_support_grant', (object)[
                'workspaceid' => $workspaceid,
                'supportuserid' => clean_param((string)($body['supportuserid'] ?? '0'), PARAM_INT),
                'targetuserid' => clean_param((string)($body['targetuserid'] ?? '0'), PARAM_INT),
                'grant_type' => clean_param((string)($body['grant_type'] ?? 'support_impersonation'), PARAM_ALPHANUMEXT),
                'status' => clean_param((string)($body['status'] ?? 'approved'), PARAM_ALPHANUMEXT),
                'reason' => clean_param((string)($body['reason'] ?? ''), PARAM_TEXT),
                'approvedby' => (int)$USER->id,
                'approvedat' => $now,
                'expiresat' => pqrp_time_from_date(clean_param((string)($body['expiresat'] ?? ''), PARAM_TEXT)),
                'revokedby' => 0,
                'revokedat' => 0,
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $notice = 'Support access grant #' . $grantid . ' saved.';
        } else if ($do === 'log_support_session') {
            // -- write: log_support_session (legacy action=log_support_session, verbatim) --
            if (!pqh_table_exists_safe('local_prequran_support_session')) {
                throw new invalid_parameter_exception('Support session table is not ready.');
            }
            $grantid = clean_param((string)($body['grantid'] ?? '0'), PARAM_INT);
            $grant = $grantid > 0 ? $DB->get_record('local_prequran_support_grant', ['id' => $grantid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : null;
            $status = clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT);
            $DB->insert_record('local_prequran_support_session', (object)[
                'workspaceid' => $workspaceid,
                'grantid' => $grantid,
                'supportuserid' => clean_param((string)($body['supportuserid'] ?? (string)(int)($grant->supportuserid ?? 0)), PARAM_INT),
                'targetuserid' => clean_param((string)($body['targetuserid'] ?? (string)(int)($grant->targetuserid ?? 0)), PARAM_INT),
                'status' => $status,
                'reason' => clean_param((string)($body['reason'] ?? (string)($grant->reason ?? '')), PARAM_TEXT),
                'entry_contextjson' => pqrp_json(['url' => clean_param((string)($body['entry_url'] ?? ''), PARAM_URL)]),
                'startedat' => $now,
                'endedat' => $status === 'ended' ? $now : 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $notice = 'Support access session logged.';
        } else if ($do === 'run_audit') {
            // -- write: run_audit (legacy action=run_audit, verbatim) --
            $notice = 'Tenant isolation audit created ' . pqrp_run_isolation_audit($workspaceid, (int)$USER->id) . ' check row(s).';
        } else {
            pqpd_fail(400, 'Unknown roles-permissions action.');
        }
    } catch (Throwable $e) {
        // Legacy catches every write error and shows it as the page alert —
        // same message text, delivered as JSON.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $notice,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the roles/permissions matrix exactly as the legacy page builds it --
$users = pqrp_users_for_workspace($workspaceid);
$caps = pqh_table_exists_safe('local_prequran_role_cap') ? array_values($DB->get_records('local_prequran_role_cap', ['workspaceid' => $workspaceid], 'rolekey ASC, capability ASC', '*', 0, 120)) : [];
$grants = pqh_table_exists_safe('local_prequran_support_grant') ? array_values($DB->get_records('local_prequran_support_grant', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$sessions = pqh_table_exists_safe('local_prequran_support_session') ? array_values($DB->get_records('local_prequran_support_session', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$audits = pqh_table_exists_safe('local_prequran_tenant_audit') ? array_values($DB->get_records('local_prequran_tenant_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$rolekeys = ['registrar', 'finance', 'teacher', 'assistant_teacher', 'parent', 'sponsor', 'support', 'auditor', 'coordinator'];
$capkeys = ['admissions.manage', 'registrar.manage', 'documents.manage', 'finance.manage', 'invoices.manage', 'payments.manage', 'payment_plans.view', 'teacher.portal', 'attendance.manage', 'grades.manage', 'notes.manage', 'parent.portal', 'student.portal', 'sponsor.portal', 'support.manage', 'support.impersonate.request', 'tenant.audit.view'];

// Decorate the workspace members with the server-side label the page renders
// inline (fullname() is PHP-only).
$usersout = [];
foreach ($users as $user) {
    $usersout[] = [
        'id' => (int)$user->id,
        'fullname' => fullname($user),
        'workspace_role' => (string)$user->workspace_role,
        'email' => (string)($user->email ?? ''),
    ];
}
$capsout = [];
foreach ($caps as $cap) {
    $capsout[] = [
        'rolekey' => (string)$cap->rolekey,
        'capability' => (string)$cap->capability,
        'scope' => (string)$cap->scope,
        'allowed' => (int)$cap->allowed,
    ];
}
$grantsout = [];
foreach ($grants as $grant) {
    $grantsout[] = [
        'id' => (int)$grant->id,
        'grant_type' => (string)$grant->grant_type,
        'supportuserid' => (int)$grant->supportuserid,
        'targetuserid' => (int)$grant->targetuserid,
        'status' => (string)$grant->status,
        'expiresat' => (int)$grant->expiresat,
    ];
}
$sessionsout = [];
foreach ($sessions as $session) {
    $sessionsout[] = [
        'id' => (int)$session->id,
        'supportuserid' => (int)$session->supportuserid,
        'targetuserid' => (int)$session->targetuserid,
        'status' => (string)$session->status,
    ];
}
$auditsout = [];
foreach ($audits as $audit) {
    $auditsout[] = [
        'check_key' => (string)$audit->check_key,
        'targettype' => (string)$audit->targettype,
        'targetid' => (int)$audit->targetid,
        'status' => (string)$audit->status,
        'timecreated' => (int)$audit->timecreated,
    ];
}

$nameids = [];
foreach ($users as $row) {
    $nameids[] = (int)$row->id;
}
foreach ($grants as $row) {
    $nameids[] = (int)$row->supportuserid;
    $nameids[] = (int)$row->targetuserid;
}
foreach ($sessions as $row) {
    $nameids[] = (int)$row->supportuserid;
    $nameids[] = (int)$row->targetuserid;
}

echo json_encode([
    'ok' => true,
    'ready' => pqh_table_exists_safe('local_prequran_role_cap'),
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'users' => $usersout,
    'caps' => $capsout,
    'grants' => $grantsout,
    'sessions' => $sessionsout,
    'audits' => $auditsout,
    'rolekeys' => $rolekeys,
    'capkeys' => $capkeys,
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/roles_permissions.php?workspaceid=' . $workspaceid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
