<?php
// ---- report: platform-landing (public platform-foundation marketing landing; read-only) ----
// Ported from local_hubredirect/platform_landing.php. That page is PUBLIC — it
// has no require_login and renders fully for guests; the ONLY dynamic parts are
// the brand/consumer context, a platform-admin flag (pqh_can_manage_academy_operations)
// that toggles the admin CTAs, and a single redirect branch that sends
// non-foundation trusted-domain consumers to consumer_landing.php. There are no
// page-defined functions to extract, so platform_landing_portallib is a
// guard-only marker.
//
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent — so behind the
// dispatcher this public page still requires a valid portal token. The legacy
// consumer context is resolved from ?consumer=/?workspaceid= like the sibling
// public endpoints (public_intake_data.php, institution-profile.php); the CDN
// host the portal page is served from carries no consumer meaning.
//
// (platform_landing.php has no pqh_live_security_audit calls — none to keep.)
//
// GET  = brand, platform-admin flag, the page's CTA target URLs, and the legacy
//        non-foundation redirect signal (all the static marketing copy lives in
//        the HTML shell, verbatim from the legacy page).
// POST = 400 (the legacy landing is read-only; it performs no writes).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/platform_landing_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// The legacy landing is read-only — no form posts. Mirror institution-profile's
// read-only siblings: reject writes with a 400.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The platform landing page is read-only.');
}

// -- consumer context: resolved from ?consumer=/?workspaceid= exactly like the
//    sibling public endpoints. Defaults to the current (host-derived) context. --
$consumer = pqh_requested_consumer_context();
$requestedslug = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedslug !== '' && (string)($consumer->consumerslug ?? '') !== $requestedslug) {
    $slugcontext = pqh_consumer_context_by_slug($requestedslug);
    if ((string)($slugcontext->consumerslug ?? '') === $requestedslug
        && ($requestedworkspaceid <= 0 || (int)($slugcontext->workspaceid ?? 0) === $requestedworkspaceid)) {
        $consumer = $slugcontext;
    }
}
if ($requestedworkspaceid > 0 && (int)($consumer->workspaceid ?? 0) !== $requestedworkspaceid) {
    $workspacecontext = pqh_consumer_context_by_workspace($requestedworkspaceid);
    if ($workspacecontext) {
        $consumer = $workspacecontext;
    }
}

$consumertype = (string)($consumer->consumer_type ?? '');
$slug = (string)($consumer->consumerslug ?? '');
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = trim((string)($consumer->consumername ?? '')) ?: 'EduPlatform';

// -- legacy redirect branch (verbatim condition): a non-foundation consumer on a
//    trusted domain is bounced to consumer_landing.php. Surfaced here as a
//    `redirect` URL so the client honours the same routing the page enforced. --
$redirect = '';
if ($consumertype !== 'platform_foundation' && !empty($consumer->trusted_domain)) {
    $params = ['consumer' => $slug];
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    $redirect = (new moodle_url('/local/hubredirect/consumer_landing.php', $params))->out(false);
}

// -- platform-admin flag: legacy $isplatformadmin gated on the logged-in user;
//    behind the dispatcher the token user stands in for that login. Toggles the
//    admin CTAs exactly as the page does. --
$isplatformadmin = pqh_can_manage_academy_operations($userid);

echo json_encode([
    'ok' => true,
    'ready' => true,
    'brand' => $brand,
    'slug' => $slug,
    'workspaceid' => $workspaceid,
    'consumer_type' => $consumertype,
    'is_platform_admin' => $isplatformadmin,
    // Non-foundation trusted-domain redirect (empty for the foundation landing).
    'redirect' => $redirect,
    // The page's CTA targets, built with the same moodle_url paths as the legacy
    // page so the marketing shell links exactly where the PHP page did.
    'urls' => [
        'login' => (new moodle_url('/local/hubredirect/platform_login.php'))->out(false),
        'admin' => (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false),
        'consumers' => (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false),
        'settings' => (new moodle_url('/local/hubredirect/platform_settings.php'))->out(false),
        'diagnostics' => (new moodle_url('/local/hubredirect/consumer_diagnostics.php'))->out(false),
        'landing' => (new moodle_url('/local/hubredirect/platform_landing.php'))->out(false),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/platform_landing.php',
], JSON_UNESCAPED_SLASHES);
exit;
