<?php
// ---- report: platform-settings (EduPlatform foundation settings; read + admin write) ----
// Ported from local_hubredirect/platform_settings.php via
// platform_settings_portallib (pqpsl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the foundation consumer's identity/theme/routing settings (normalized
//        through the same clean_* helpers the page renders with) + registered
//        foundation domains + legacy top links.
// POST = the page's single settings write, verbatim via the lib
//        (do=save -> pqpsl_update_foundation_consumer). confirm_sesskey()
//        dropped: token auth replaces the session key.
//
// Secret adaptation: NONE required. Every foundation setting here is public
// branding / routing metadata (name, colors, initials, logo URL, support &
// reply-to email addresses, local entry paths). There is no API key, token, or
// password field, so nothing is masked or made write-only; all values are
// echoed on GET. (The "secret -> configured boolean + masked placeholder,
// write-only on non-empty POST" rule was evaluated and found not applicable.)
//
// This page never calls pqh_live_security_audit, so there is no denial-audit
// write to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/platform_settings_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: the page's pqh_require_platform_operations('Only platform
//    administrators can manage EduPlatform foundation settings.') expands to a
//    two-stage gate (foundation-domain check, then academy-operations check),
//    with pqh_access_denied's redirects replaced by pqpd_fail(403, same message). --
$consumercontext = pqh_current_consumer_context();
$isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
    && !empty($consumercontext->trusted_domain);
if (!$isfoundationdomain) {
    pqpd_fail(403, 'EduPlatform administration is only available from the EduPlatform foundation domain.');
}
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only platform administrators can manage EduPlatform foundation settings.');
}

$consumer = pqpsl_foundation_consumer();
if (!$consumer) {
    // Legacy: pqh_access_denied('The EduPlatform foundation consumer has not been seeded yet.', ...).
    pqpd_fail(403, 'The EduPlatform foundation consumer has not been seeded yet.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);

    // The legacy pqps_update_foundation_consumer reads its fields through
    // optional_param() (i.e. $_POST/$_GET). Populate $_POST from the JSON body
    // so that verbatim function runs unchanged. Scalars only; PARAM cleaning
    // happens inside the lib.
    foreach ($body as $k => $v) {
        if (is_scalar($v)) {
            $_POST[$k] = (string)$v;
        }
    }

    if ($do !== 'save') {
        pqpd_fail(400, 'Unknown platform-settings action.');
    }

    try {
        // -- write: legacy POST branch (verbatim via the lib) --
        pqpsl_update_foundation_consumer($consumer);
        $consumer = pqpsl_foundation_consumer();
        echo json_encode([
            'ok' => true,
            'message' => 'EduPlatform foundation settings updated.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        // Legacy catches Throwable and shows $e->getMessage() in the error alert.
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: the same values the page renders (normalized through the lib's
//    clean_* helpers, exactly as the page does at render time) --
$domains = pqpsl_foundation_domains((int)$consumer->id);
$copy = pqpsl_json_array((string)($consumer->copyjson ?? ''));
$theme = pqpsl_json_array((string)($consumer->themejson ?? ''));
$brandinitials = pqpsl_clean_initials((string)($copy['brand_initials'] ?? 'EP'), 'EP');
$logourl = pqpsl_clean_logo_url((string)($copy['logo_url'] ?? ''));
$defaultloginpath = pqpsl_clean_local_path((string)($copy['default_login_path'] ?? '/local/hubredirect/consumer_login.php'), '/local/hubredirect/consumer_login.php');
$primarycolor = pqpsl_clean_hex_color((string)($theme['primary_color'] ?? '#2f6f4e'), '#2f6f4e');
$accentcolor = pqpsl_clean_hex_color((string)($theme['accent_color'] ?? '#d6a642'), '#d6a642');
$surfacecolor = pqpsl_clean_hex_color((string)($theme['surface_color'] ?? '#f5f8fb'), '#f5f8fb');

$domainsout = [];
foreach ($domains as $domain) {
    $domainsout[] = [
        'domain' => (string)$domain->domain,
        'domain_type' => (string)$domain->domain_type,
        'isprimary' => (int)$domain->isprimary,
        'status' => (string)$domain->status,
        'sslstatus' => (string)($domain->sslstatus ?? 'not_checked'),
        'verificationstatus' => (string)($domain->verificationstatus ?? 'unknown'),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'settings' => [
        'name' => (string)$consumer->name,
        'emailfromname' => (string)($consumer->emailfromname ?? 'EduPlatform'),
        'brand_initials' => $brandinitials,
        'logo_url' => $logourl,
        'supportemail' => (string)($consumer->supportemail ?? ''),
        'emailreplyto' => (string)($consumer->emailreplyto ?? ''),
        'primary_color' => $primarycolor,
        'accent_color' => $accentcolor,
        'surface_color' => $surfacecolor,
        'defaultloginpath' => $defaultloginpath,
        'defaultpublicpath' => (string)($consumer->defaultpublicpath ?? '/local/hubredirect/platform_landing.php'),
        'defaultdashboardpath' => (string)($consumer->defaultdashboardpath ?? '/local/hubredirect/platform_dashboard.php'),
    ],
    'domains' => $domainsout,
    'toplinks' => [
        'dashboard' => (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false),
        'consumers' => (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false),
        'landing' => (new moodle_url('/local/hubredirect/platform_landing.php'))->out(false),
        'diagnostics' => (new moodle_url('/local/hubredirect/consumer_diagnostics.php'))->out(false),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/platform_settings.php',
    'currentuserid' => $userid,
], JSON_UNESCAPED_SLASHES);
exit;
