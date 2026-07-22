<?php
// ---- report: institution-settings (per-workspace institution/tenant settings) ----
// Ported from local_hubredirect/institution_settings.php. The page defines no
// helpers of its own, so there is no *_portallib to extract — every helper is
// shared: pqhi_* (institutionlib) and pqh_* (accesslib), both require_once'd
// below, never copied. institution_settings_portallib.php is the guard-only
// companion for this report. Included from portal_data.php AFTER token auth:
// $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent. The legacy page stays untouched (parallel-run).
//
// GET  = the institution settings state for the caller's workspace: consumer
//        identity, theme colours, landing copy, website profile, public/app
//        domains, the option lists the form's <select>s are built from, and a
//        preview hero URL.
// POST = do=save_settings — the page's single sesskey-guarded save VERBATIM
//        (upsert consumer, sync public+app domains, update workspace name +
//        settingsjson). confirm_sesskey() dropped: token auth replaces it; the
//        legacy redirect(?saved=1) becomes an ok JSON response.
//
// SECRET HANDLING: this page has NO secret / API-key settings. Every field is
// non-sensitive branding, domain, support-email or landing-copy data, so GET
// returns each value plainly. (If a secret existed, GET would return only a
// `configured` boolean + masked placeholder and the POST would write it only
// when a non-empty replacement is supplied — no secret is echoed here because
// none exists on this page.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_settings_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// Mirror of the legacy optional_param(name, default, PARAM_*) reads, but from
// the JSON POST body.
$bparam = static function (string $name, $default, string $type) use ($body) {
    if (!array_key_exists($name, $body) || $body[$name] === null) {
        return $default;
    }
    if ($type === PARAM_INT) {
        return (int)clean_param($body[$name], PARAM_INT);
    }
    return clean_param((string)$body[$name], $type);
};

// -- workspace resolution + entry access check (same order and messages as the
// -- legacy page): requested consumer context, current-workspace fallback,
// -- manage check, workspace record, consumer-schema readiness. Each legacy
// -- pqh_access_denied() becomes pqpd_fail(403, <same message>). --
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace owners and admins can edit institution settings.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening institution settings.');
}
if (!pqh_consumer_schema_ready()) {
    pqpd_fail(403, 'Institution branding tables are not ready yet.');
}

$consumer = pqhi_consumer_for_workspace($workspaceid, (string)($consumercontext->consumerslug ?? ''));

if ($ispost) {
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);

    // -- write: save_settings (legacy POST handler, verbatim call order) --
    if ($do === 'save_settings') {
        try {
            $name = trim($bparam('name', (string)$workspace->name, PARAM_TEXT));
            $slug = trim($bparam('slug', (string)($consumer->slug ?? $workspace->slug), PARAM_ALPHANUMEXT));
            $supportemail = trim($bparam('supportemail', '', PARAM_EMAIL));
            $logourl = trim($bparam('logourl', '', PARAM_URL));
            $publicdomain = pqhi_normalize_domain($bparam('publicdomain', '', PARAM_TEXT));
            $appdomain = pqhi_normalize_domain($bparam('appdomain', '', PARAM_TEXT));
            $websiteprofile = pqhi_consumer_website_profile([
                'website_mode' => $bparam('website_mode', 'hosted', PARAM_ALPHANUMEXT),
                'external_website_url' => $bparam('externalwebsiteurl', '', PARAM_URL),
                'domain_management' => $bparam('domainmanagement', 'consumer_managed', PARAM_ALPHANUMEXT),
                'portal_label' => $bparam('portallabel', 'Learning portal', PARAM_TEXT),
                'branding_source' => $bparam('brandingsource', 'eduplatform_settings', PARAM_ALPHANUMEXT),
                'intake_location' => $bparam('intakelocation', 'eduplatform', PARAM_ALPHANUMEXT),
                'integration_method' => $bparam('integrationmethod', 'links', PARAM_ALPHANUMEXT),
                'return_url' => $bparam('returnurl', '', PARAM_URL),
            ], $consumer ?: null);
            if ($websiteprofile['website_mode'] !== 'hosted') {
                $publicdomain = '';
            }
            if ($name === '') {
                throw new invalid_parameter_exception('Institution name is required.');
            }
            $consumerid = pqhi_upsert_consumer($workspaceid, $name, $slug, (int)$workspace->ownerid, [
                'supportemail' => $supportemail,
                'logourl' => $logourl,
                'brand_initials' => trim($bparam('brandinitials', '', PARAM_TEXT)),
                'primary_color' => trim($bparam('primarycolor', '', PARAM_TEXT)),
                'accent_color' => trim($bparam('accentcolor', '', PARAM_TEXT)),
                'surface_color' => trim($bparam('surfacecolor', '', PARAM_TEXT)),
                'dashboard_header_bg' => trim($bparam('dashboardheaderbg', '', PARAM_TEXT)),
                'dashboard_header_text' => trim($bparam('dashboardheadertext', '', PARAM_TEXT)),
                'page_body_bg' => trim($bparam('pagebodybg', '', PARAM_TEXT)),
                'report_header_bg' => trim($bparam('reportheaderbg', '', PARAM_TEXT)),
                'report_header_text' => trim($bparam('reportheadertext', '', PARAM_TEXT)),
                'report_body_bg' => trim($bparam('reportbodybg', '', PARAM_TEXT)),
                'landing_headline' => trim($bparam('headline', '', PARAM_TEXT)),
                'landing_subtitle' => trim($bparam('subtitle', '', PARAM_TEXT)),
                'landing_body' => trim($bparam('bodycopy', '', PARAM_TEXT)),
                'hero_image_url' => trim($bparam('heroimage', '', PARAM_URL)),
                'initial_courses' => trim($bparam('initialcourses', '', PARAM_TEXT)),
                'website_mode' => $websiteprofile['website_mode'],
                'external_website_url' => $websiteprofile['external_website_url'],
                'domain_management' => $websiteprofile['domain_management'],
                'portal_label' => $websiteprofile['portal_label'],
                'branding_source' => $websiteprofile['branding_source'],
                'intake_location' => $websiteprofile['intake_location'],
                'integration_method' => $websiteprofile['integration_method'],
                'return_url' => $websiteprofile['return_url'],
            ], (int)$USER->id);
            pqhi_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1, (int)$USER->id);
            pqhi_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0, (int)$USER->id);
            $workspace->name = $name;
            $workspace->timemodified = time();
            $settings = pqhi_json_array((string)($workspace->settingsjson ?? ''));
            $settings['initial_courses'] = trim($bparam('initialcourses', '', PARAM_TEXT));
            $settings['website_mode'] = $websiteprofile['website_mode'];
            $settings['external_website_url'] = $websiteprofile['external_website_url'];
            $settings['default_public_domain'] = $publicdomain;
            $settings['default_app_domain'] = $appdomain;
            $workspace->settingsjson = json_encode($settings, JSON_UNESCAPED_SLASHES);
            $DB->update_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', $workspace));
            // Legacy redirect(?saved=1) -> ok JSON.
            echo json_encode(['ok' => true, 'message' => 'Institution settings saved.', 'consumerid' => (int)$consumerid], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            // Legacy catches Throwable and shows $e->getMessage() in the error alert.
            pqpd_fail(400, $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown institution-settings action.');
}

// -- GET: the settings state the page renders. Same "ensure a consumer row
//    exists" bootstrap the legacy page performs before rendering. --
if (!$consumer) {
    $consumerid = pqhi_upsert_consumer($workspaceid, (string)$workspace->name, (string)$workspace->slug, (int)$workspace->ownerid, [], (int)$USER->id);
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
}

$theme = pqhi_default_theme(pqhi_json_array((string)($consumer->themejson ?? '')));
$copy = pqhi_default_copy((string)($consumer->name ?? $workspace->name), pqhi_json_array((string)($consumer->copyjson ?? '')));
$websiteprofile = pqhi_consumer_website_profile([], $consumer);
$previewhero = pqh_consumer_hero_image_url($consumer);
$domains = pqhi_consumer_domains($workspaceid, (int)($consumer->id ?? 0));
$publicdomain = '';
$appdomain = '';
$domainsout = [];
foreach ($domains as $domain) {
    if ((string)$domain->domain_type === 'app' && $appdomain === '') {
        $appdomain = (string)$domain->domain;
    }
    if ((string)$domain->domain_type === 'public' && $publicdomain === '') {
        $publicdomain = (string)$domain->domain;
    }
    $domainsout[] = [
        'domain' => (string)$domain->domain,
        'domain_type' => (string)$domain->domain_type,
        'status' => (string)($domain->status ?? ''),
        'isprimary' => (int)($domain->isprimary ?? 0),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'schema_ready' => pqh_consumer_schema_ready(),
    'workspaceid' => $workspaceid,
    'consumer' => [
        'id' => (int)($consumer->id ?? 0),
        'name' => (string)$consumer->name,
        'slug' => (string)$consumer->slug,
        'logourl' => (string)($consumer->logourl ?? ''),
        'supportemail' => (string)($consumer->supportemail ?? ''),
    ],
    'workspacename' => (string)$workspace->name,
    'theme' => $theme,
    'copy' => $copy,
    'websiteprofile' => $websiteprofile,
    'publicdomain' => $publicdomain,
    'appdomain' => $appdomain,
    'domains' => $domainsout,
    'previewhero' => $previewhero,
    'options' => [
        'website_mode' => pqhi_website_mode_options(),
        'domain_management' => pqhi_domain_management_options(),
        'branding_source' => pqhi_branding_source_options(),
        'intake_location' => pqhi_intake_location_options(),
        'integration_method' => pqhi_integration_method_options(),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/institution_settings.php',
], JSON_UNESCAPED_SLASHES);
exit;
