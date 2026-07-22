<?php
// ---- report: consumer-wizard (consumer/tenant creation wizard; read + one
//      admin write) ----
// Ported from local_hubredirect/consumer_wizard.php via consumer_wizard_portallib
// (pqcwl_*). The page defines a single function of its own — pqcw_clean_route,
// carried verbatim into the lib as pqcwl_clean_route — and otherwise drives the
// shared pqhi_* helpers in local/hubredirect/institutionlib.php plus the pqh_*
// access helpers in local/hubredirect/accesslib.php directly; both shared
// libraries are required here, never copied. Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the wizard bootstrap: option lists every select is built from, the
//        requested sticky form defaults, the non-archived workspaces the "Link
//        workspace" select offers, and schema readiness.
// POST = the page's single create-consumer write, verbatim: workspace (new or
//        linked), consumer app row, first admin owner/admin membership, public +
//        app domains, and default landing/route settings. do=create_consumer;
//        confirm_sesskey() dropped (token auth replaces the session key); the
//        legacy re-render is replaced by an ok JSON payload carrying the created
//        ids + follow-up links.
//
// Access mirrors the page's pqh_require_platform_operations() gate exactly — the
// same two-stage foundation-domain + academy-operations check the two sibling
// handlers (platform-consumers.php, institution-onboarding.php) use, with
// pqh_access_denied's redirects replaced by pqpd_fail(403, same message). The
// legacy consumer_wizard.php performs no pqh_live_security_audit call, so none is
// added here.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/consumer_wizard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same two-stage gate as the page's
//    pqh_require_platform_operations('Only platform administrators can create consumer apps.')
//    (foundation-domain check, then academy-operations check), with
//    pqh_access_denied's redirects replaced by pqpd_fail(403, same message). --
$consumercontext = pqh_current_consumer_context();
$isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
    && !empty($consumercontext->trusted_domain);
if (!$isfoundationdomain) {
    pqpd_fail(403, 'EduPlatform administration is only available from the EduPlatform foundation domain.');
}
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only platform administrators can create consumer apps.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    // Mirror of the legacy optional_param(name, default, PARAM_*) reads.
    $bparam = static function (string $name, $default, string $type) use ($body) {
        if (!array_key_exists($name, $body) || $body[$name] === null) {
            return $default;
        }
        if ($type === PARAM_INT) {
            return (int)clean_param($body[$name], PARAM_INT);
        }
        return clean_param((string)$body[$name], $type);
    };

    if ($do === 'create_consumer') {
        try {
            // -- write: legacy consumer_wizard.php POST branch (verbatim) --
            if (!pqh_table_exists_safe('local_prequran_workspace') || !pqh_table_exists_safe('local_prequran_workspace_member') || !pqh_consumer_schema_ready()) {
                throw new invalid_parameter_exception('Workspace and consumer tables are not ready.');
            }
            $type = $bparam('consumer_type', 'institution', PARAM_ALPHANUMEXT);
            if (!array_key_exists($type, pqhi_consumer_type_options())) {
                throw new invalid_parameter_exception('Choose a valid consumer type.');
            }
            $institutiontype = pqhi_clean_institution_type($bparam('institution_type', 'primary_education', PARAM_ALPHANUMEXT));
            $faithsubcategory = $type === 'institution' && $institutiontype === 'faith_based_education'
                ? pqhi_clean_faith_subcategory($bparam('faith_subcategory', '', PARAM_ALPHANUMEXT))
                : '';
            $teachingmethod = $type === 'institution'
                ? pqhi_clean_teaching_method($bparam('teaching_method', 'regular', PARAM_ALPHANUMEXT))
                : '';
            $operatortype = $type === 'institution'
                ? pqhi_clean_operator_type($bparam('operator_type', 'private_entity', PARAM_ALPHANUMEXT))
                : '';
            $websiteprofile = pqhi_consumer_website_profile([
                'website_mode' => $bparam('website_mode', 'hosted', PARAM_ALPHANUMEXT),
                'external_website_url' => $bparam('externalwebsiteurl', '', PARAM_URL),
                'domain_management' => $bparam('domainmanagement', 'consumer_managed', PARAM_ALPHANUMEXT),
                'portal_label' => $bparam('portallabel', 'Learning portal', PARAM_TEXT),
                'branding_source' => $bparam('brandingsource', 'eduplatform_settings', PARAM_ALPHANUMEXT),
                'intake_location' => $bparam('intakelocation', 'eduplatform', PARAM_ALPHANUMEXT),
                'integration_method' => $bparam('integrationmethod', 'links', PARAM_ALPHANUMEXT),
                'return_url' => $bparam('returnurl', '', PARAM_URL),
            ]);
            $name = trim($bparam('name', '', PARAM_TEXT));
            if ($name === '') {
                throw new invalid_parameter_exception('Consumer name is required.');
            }
            $slug = pqhi_clean_slug($bparam('slug', $name, PARAM_TEXT));
            $routes = pqhi_default_routes_for_consumer($type);
            $admin = pqhi_find_or_create_admin_user([
                'adminuser' => $bparam('adminuser', '', PARAM_TEXT),
                'adminemail' => $bparam('adminemail', '', PARAM_EMAIL),
                'adminusername' => $bparam('adminusername', '', PARAM_ALPHANUMEXT),
                'adminfirstname' => $bparam('adminfirstname', '', PARAM_TEXT),
                'adminlastname' => $bparam('adminlastname', '', PARAM_TEXT),
            ], (int)$USER->id);
            if (!empty($admin->deleted) || !empty($admin->suspended)) {
                throw new invalid_parameter_exception('Choose an active Moodle user for the first admin.');
            }

            $workspaceid = $bparam('workspaceid', 0, PARAM_INT);
            if ($workspaceid > 0) {
                $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
                if (!$workspace) {
                    throw new invalid_parameter_exception('Linked workspace was not found.');
                }
            } else {
                $workspaceid = pqhi_create_workspace_for_consumer($name, $slug, $type, (int)$admin->id, [
                    'created_from' => 'consumer_wizard',
                    'plancode' => $bparam('plancode', 'pilot', PARAM_ALPHANUMEXT),
                    'studentlimit' => $bparam('studentlimit', 0, PARAM_INT),
                    'teacherlimit' => $bparam('teacherlimit', 0, PARAM_INT),
                    'sessionlimit' => $bparam('sessionlimit', 0, PARAM_INT),
                    'storagelimit' => $bparam('storagelimit', 0, PARAM_INT),
                    'institution_type' => $institutiontype,
                    'faith_subcategory' => $faithsubcategory,
                    'teaching_method' => $teachingmethod,
                    'operator_type' => $operatortype,
                    'initial_courses' => $bparam('initialcourses', 'Pre-Quraan', PARAM_TEXT),
                    'publicdomain' => $bparam('publicdomain', '', PARAM_TEXT),
                    'appdomain' => $bparam('appdomain', '', PARAM_TEXT),
                    'website_mode' => $websiteprofile['website_mode'],
                    'external_website_url' => $websiteprofile['external_website_url'],
                ], (int)$USER->id);
            }

            $consumerid = pqhi_upsert_consumer_app($workspaceid, $name, $slug, $type, (int)$admin->id, [
                'supportemail' => $bparam('supportemail', '', PARAM_EMAIL),
                'logourl' => $bparam('logourl', '', PARAM_URL),
                'brand_initials' => $bparam('brandinitials', '', PARAM_TEXT),
                'primary_color' => $bparam('primarycolor', '#2f6f4e', PARAM_TEXT),
                'accent_color' => $bparam('accentcolor', '#d99a26', PARAM_TEXT),
                'surface_color' => $bparam('surfacecolor', '#f4f8fb', PARAM_TEXT),
                'institution_type' => $institutiontype,
                'faith_subcategory' => $faithsubcategory,
                'teaching_method' => $teachingmethod,
                'operator_type' => $operatortype,
                'website_mode' => $websiteprofile['website_mode'],
                'external_website_url' => $websiteprofile['external_website_url'],
                'domain_management' => $websiteprofile['domain_management'],
                'portal_label' => $websiteprofile['portal_label'],
                'branding_source' => $websiteprofile['branding_source'],
                'intake_location' => $websiteprofile['intake_location'],
                'integration_method' => $websiteprofile['integration_method'],
                'return_url' => $websiteprofile['return_url'],
                'landing_headline' => $bparam('headline', $name, PARAM_TEXT),
                'landing_subtitle' => $bparam('subtitle', '', PARAM_TEXT),
                'landing_body' => $bparam('bodycopy', '', PARAM_TEXT),
                'hero_image_url' => $bparam('heroimage', '', PARAM_URL),
                'initial_courses' => $bparam('initialcourses', 'Pre-Quraan', PARAM_TEXT),
                'defaultpublicpath' => pqcwl_clean_route($bparam('defaultpublicpath', $routes['public'], PARAM_LOCALURL), $routes['public']),
                'defaultdashboardpath' => pqcwl_clean_route($bparam('defaultdashboardpath', $routes['dashboard'], PARAM_LOCALURL), $routes['dashboard']),
                'defaultloginpath' => pqcwl_clean_route($bparam('defaultloginpath', $routes['login'], PARAM_LOCALURL), $routes['login']),
            ], (int)$USER->id);

            pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'owner', (int)$USER->id, 'Created by consumer wizard.');
            pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'admin', (int)$USER->id, 'Created by consumer wizard.');
            $publicdomain = pqhi_normalize_domain($bparam('publicdomain', '', PARAM_TEXT));
            $appdomain = pqhi_normalize_domain($bparam('appdomain', '', PARAM_TEXT));
            if ($websiteprofile['website_mode'] !== 'hosted') {
                $publicdomain = '';
            }
            pqhi_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1, (int)$USER->id);
            pqhi_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0, (int)$USER->id);

            // Legacy renders "Open workspace" after a create — return the same
            // target URLs for the portal client.
            $created = [
                'slug' => $slug,
                'workspaceid' => $workspaceid,
                'consumerid' => $consumerid,
                'adminname' => fullname($admin),
                'links' => [
                    'workspace' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['consumer' => $slug, 'workspaceid' => $workspaceid]))->out(false),
                    'settings' => (new moodle_url('/local/hubredirect/institution_settings.php', ['consumer' => $slug, 'workspaceid' => $workspaceid]))->out(false),
                    'landing' => (new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => $slug, 'workspaceid' => $workspaceid]))->out(false),
                ],
            ];
            echo json_encode([
                'ok' => true,
                'message' => 'Consumer app, workspace, first admin, routes, and default landing settings are ready.',
                'created' => $created,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            // Legacy catches Throwable and shows $e->getMessage() in the error alert.
            pqpd_fail(400, $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown consumer-wizard action.');
}

// -- GET: the same option lists + workspace list + sticky defaults the page
//    renders. --
$workspaces = [];
if (pqh_table_exists_safe('local_prequran_workspace')) {
    $workspaces = array_values($DB->get_records_select('local_prequran_workspace', "status <> ?", ['archived'], 'name ASC', 'id,name,slug,workspace_type'));
}

$workspacesout = [];
foreach ($workspaces as $workspace) {
    $workspacesout[] = [
        'id' => (int)$workspace->id,
        'name' => (string)$workspace->name,
        'slug' => (string)$workspace->slug,
        'workspace_type' => (string)($workspace->workspace_type ?? ''),
    ];
}

// The requested (sticky) form defaults, mirroring the page's request-var reads.
$requestedtype = optional_param('type', '', PARAM_ALPHANUMEXT);
if (!array_key_exists($requestedtype, pqhi_consumer_type_options())) {
    $requestedtype = optional_param('consumer_type', 'institution', PARAM_ALPHANUMEXT);
}
if (!array_key_exists($requestedtype, pqhi_consumer_type_options())) {
    $requestedtype = 'institution';
}
$defaults = [
    'consumer_type' => $requestedtype,
    'institution_type' => pqhi_clean_institution_type(optional_param('institution_type', 'primary_education', PARAM_ALPHANUMEXT)),
    'faith_subcategory' => pqhi_clean_faith_subcategory(optional_param('faith_subcategory', '', PARAM_ALPHANUMEXT)),
    'teaching_method' => pqhi_clean_teaching_method(optional_param('teaching_method', 'regular', PARAM_ALPHANUMEXT)),
    'operator_type' => pqhi_clean_operator_type(optional_param('operator_type', 'private_entity', PARAM_ALPHANUMEXT)),
    'website_mode' => pqhi_clean_option(optional_param('website_mode', 'hosted', PARAM_ALPHANUMEXT), pqhi_website_mode_options(), 'hosted'),
];

echo json_encode([
    'ok' => true, 'ready' => true,
    'schema_ready' => pqh_consumer_schema_ready(),
    'workspaceoptions' => $workspacesout,
    'defaults' => $defaults,
    'options' => [
        'consumer_type' => pqhi_consumer_type_options(),
        'institution_type' => pqhi_institution_type_options(),
        'faith_subcategory' => pqhi_faith_subcategory_options(),
        'teaching_method' => pqhi_teaching_method_options(),
        'operator_type' => pqhi_operator_type_options(),
        'website_mode' => pqhi_website_mode_options(),
        'domain_management' => pqhi_domain_management_options(),
        'branding_source' => pqhi_branding_source_options(),
        'intake_location' => pqhi_intake_location_options(),
        'integration_method' => pqhi_integration_method_options(),
    ],
    'toplinks' => [
        'consumers' => (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false),
        'dashboard' => (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false),
        'institution_wizard' => (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/consumer_wizard.php',
    'currentuserid' => $userid,
], JSON_UNESCAPED_SLASHES);
exit;
