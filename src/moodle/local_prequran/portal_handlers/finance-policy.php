<?php
// ---- report: finance-policy (workspace billing defaults; read + save) --------
// Ported from local_hubredirect/finance_policy.php via finance_policy_portallib
// (pqfpoll_*: the page's two inline helpers, extracted verbatim; the select
// markup itself is rebuilt client-side from the allowed-value lists below).
// Included from portal_data.php AFTER token auth: $claims verified, $USER set
// to the token user, JSON exception handler installed, headers sent.
// GET  = what the page renders: the normalized policy, the allowed option
//        lists (+labels via pqfpoll_option_label), and the Current Policy
//        sidebar meta (source/version/hash/last-saved + default warning).
// POST = JSON do=save_policy, the page's single sesskey'd save VERBATIM
//        (same field list, defaults, and PARAM types;
//        pqfin_save_workspace_finance_policy keeps its internal pqfin_audit
//        'finance_policy_saved' call). confirm_sesskey() dropped: token auth
//        replaces the session key. Legacy redirect ?saved=1 -> ok JSON +
//        message; legacy catch-and-show-inline -> 400 JSON with the message.
// (finance_policy.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_policy_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access checks (verbatim from finance_policy.php;
//    pqh_access_denied -> pqpd_fail(403, same messages)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can edit finance policy settings.');
}
if (!pqfin_policy_schema_ready()) {
    pqpd_fail(403, 'Finance policy tables are not ready yet. Run the local_prequran plugin upgrade first.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$allowed = pqfin_policy_allowed_values();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($body) ? $body : [];
    $do = (string)($body['do'] ?? '');

    // -- write: save_policy (the page's POST branch, verbatim field list;
    //    optional_param(name, default, TYPE) -> clean_param(body[name] ?? default)) --
    if ($do === 'save_policy') {
        try {
            $policy = [
                'policy_version' => 1,
                'default_currency' => clean_param((string)($body['default_currency'] ?? pqfin_default_currency()), PARAM_ALPHANUMEXT),
                'invoice_number_prefix' => clean_param((string)($body['invoice_number_prefix'] ?? 'INV'), PARAM_ALPHANUMEXT),
                'invoice_due_days' => (int)clean_param($body['invoice_due_days'] ?? 14, PARAM_INT),
                'invoice_issue_timing' => clean_param((string)($body['invoice_issue_timing'] ?? 'manual'), PARAM_ALPHANUMEXT),
                'payment_required_timing' => clean_param((string)($body['payment_required_timing'] ?? 'admin_review'), PARAM_ALPHANUMEXT),
                'deposit_requirement' => clean_param((string)($body['deposit_requirement'] ?? 'none'), PARAM_ALPHANUMEXT),
                'deposit_amount' => clean_param((string)($body['deposit_amount'] ?? ''), PARAM_RAW_TRIMMED),
                'student_billing_visibility' => clean_param((string)($body['student_billing_visibility'] ?? 'disabled'), PARAM_ALPHANUMEXT),
                'sponsor_billing_visibility' => clean_param((string)($body['sponsor_billing_visibility'] ?? 'assigned_invoices_only'), PARAM_ALPHANUMEXT),
                'finance_hold_balance_threshold' => clean_param((string)($body['finance_hold_balance_threshold'] ?? ''), PARAM_RAW_TRIMMED),
                'finance_hold_overdue_days' => (int)clean_param($body['finance_hold_overdue_days'] ?? 30, PARAM_INT),
                'transcript_hold_behavior' => clean_param((string)($body['transcript_hold_behavior'] ?? 'warning_only'), PARAM_ALPHANUMEXT),
                'certificate_hold_behavior' => clean_param((string)($body['certificate_hold_behavior'] ?? 'warning_only'), PARAM_ALPHANUMEXT),
                'late_fee_behavior' => clean_param((string)($body['late_fee_behavior'] ?? 'disabled'), PARAM_ALPHANUMEXT),
                'automatic_access_lockout' => clean_param((string)($body['automatic_access_lockout'] ?? 'disabled'), PARAM_ALPHANUMEXT),
            ];
            pqfin_save_workspace_finance_policy($workspaceid, $consumercontext, $policy, $userid);
        } catch (Throwable $e) {
            // The page catches and shows the message inline; surface it as 400.
            pqpd_fail(400, $e->getMessage());
        }
        // Legacy redirect(...?saved=1) -> "Finance policy saved." banner.
        echo json_encode([
            'ok' => true,
            'message' => 'Finance policy saved.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown finance-policy action.');
}

// -- GET: same resolution the page performs before rendering --
$policyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
$policy = pqfin_normalize_policy($policyinfo['policy']);

// The page builds each <select> via pqfpol_select(); the portal page rebuilds
// them client-side from the same allowed values + labels.
$allowedout = [];
foreach ($allowed as $field => $values) {
    $allowedout[$field] = array_map(static function(string $value): array {
        return ['value' => $value, 'label' => pqfpoll_option_label($value)];
    }, $values);
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'policy' => $policy,
    'allowed' => $allowedout,
    'policyinfo' => [
        'source' => (string)$policyinfo['source'],
        'policyversion' => (int)$policyinfo['policyversion'],
        'policyhash' => (string)$policyinfo['policyhash'],
        'timemodified' => (int)$policyinfo['timemodified'],
        'timemodified_label' => (int)$policyinfo['timemodified'] > 0
            ? userdate((int)$policyinfo['timemodified'], get_string('strftimedatetimeshort'))
            : 'Not saved yet',
        // The page's warning banner condition: !empty($policyinfo['warnings']).
        'defaultwarning' => !empty($policyinfo['warnings']),
        'warnings' => array_values($policyinfo['warnings']),
    ],
], JSON_UNESCAPED_SLASHES);
exit;
