<?php
// ---- report: payment-gateway-settings (hosted payments config; read + save) --
// Ported from local_hubredirect/payment_gateway_settings.php via
// payment_gateway_settings_portallib (guard-only: the page defines no named
// functions — pqfin_*/pqh_* shared helpers are called at runtime; its inline
// save/read flow is ported below). Included from portal_data.php AFTER token
// auth: $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent.
// GET  = what the page renders: the effective gateway config WITHOUT secret
//        values (see SECURITY below), the schema-ready flag, the workspace
//        name, and the webhook URL note.
// POST = JSON do=save_settings, the page's single sesskey'd save (same field
//        list and PARAM types; pqfin_save_workspace_gateway_config keeps its
//        internal pqfin_audit 'payment_provider_config_saved' call).
//        require_sesskey() dropped: token auth replaces the session key.
//        Legacy redirect ?saved=1 -> ok JSON + message; legacy
//        catch-and-show-inline -> 400 JSON with the message.
// SECURITY adaptation (deliberate deviation from verbatim):
//  * GET never returns apikey/webhooksecret values — only the booleans
//    apikey_configured / webhooksecret_configured (the legacy page already
//    renders them as empty password fields with a "Saved" placeholder).
//  * POST only WRITES a secret when the body provides a non-empty value: the
//    key is omitted from $data so pqfin_save_workspace_gateway_config's
//    `?? $existing->apikey/webhooksecret` fallback preserves the stored value.
//    (The legacy page always passed the possibly-empty optional_param value,
//    which cleared stored secrets on any save with blank password fields; the
//    portal save keeps them instead.)
// (payment_gateway_settings.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/payment_gateway_settings_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from payment_gateway_settings.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace finance admins can configure hosted payments.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($body) ? $body : [];
    $do = (string)($body['do'] ?? '');

    // -- write: save_settings (the page's POST branch, same field list;
    //    optional_param(name, default, TYPE) -> clean_param(body[name] ?? default)) --
    if ($do === 'save_settings') {
        $data = [
            'status' => clean_param((string)($body['status'] ?? 'disabled'), PARAM_ALPHANUMEXT),
            'provider' => clean_param((string)($body['provider'] ?? 'generic_hosted'), PARAM_ALPHANUMEXT),
            'mode' => clean_param((string)($body['mode'] ?? 'test'), PARAM_ALPHANUMEXT),
            'accountid' => clean_param((string)($body['accountid'] ?? ''), PARAM_TEXT),
            'displayname' => clean_param((string)($body['displayname'] ?? 'Workspace hosted payments'), PARAM_TEXT),
            'checkoutbaseurl' => clean_param((string)($body['checkoutbaseurl'] ?? ''), PARAM_URL),
        ];
        // SECURITY: write-only secrets. Only include a secret when a non-empty
        // value was posted; omitting the key makes the save helper fall back
        // to the stored value instead of clearing it.
        $apikey = clean_param((string)($body['apikey'] ?? ''), PARAM_RAW_TRIMMED);
        if ($apikey !== '') {
            $data['apikey'] = $apikey;
        }
        $webhooksecret = clean_param((string)($body['webhooksecret'] ?? ''), PARAM_RAW_TRIMMED);
        if ($webhooksecret !== '') {
            $data['webhooksecret'] = $webhooksecret;
        }
        try {
            pqfin_save_workspace_gateway_config($workspaceid, $consumercontext, $userid, $data);
        } catch (Throwable $e) {
            // The page catches and shows the message inline; surface it as 400.
            pqpd_fail(400, $e->getMessage());
        }
        // Legacy redirect(...?saved=1) -> "Payment gateway settings saved." banner.
        echo json_encode([
            'ok' => true,
            'message' => 'Payment gateway settings saved.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown payment-gateway-settings action.');
}

// -- GET: same resolution the page performs before rendering --
$config = pqfin_effective_gateway_config($workspaceid, $consumercontext);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
$webhookurl = pqfin_domain_aware_url($workspaceid, $consumercontext, '/local/hubredirect/payment_webhook.php', []);

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)($workspace->name ?? 'Workspace')],
    'schemaready' => pqfin_gateway_schema_ready(),
    // SECURITY: secret VALUES are never returned — booleans only.
    'config' => [
        'scope' => (string)$config['scope'],
        'source' => (string)$config['source'],
        'status' => (string)$config['status'],
        'mode' => (string)$config['mode'],
        'provider' => (string)$config['provider'],
        'accountid' => (string)$config['accountid'],
        'displayname' => (string)$config['displayname'],
        'checkoutbaseurl' => (string)$config['checkoutbaseurl'],
        'apikey_configured' => trim((string)$config['apikey']) !== '',
        'webhooksecret_configured' => trim((string)$config['webhooksecret']) !== '',
    ],
    'webhookurl' => $webhookurl->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
