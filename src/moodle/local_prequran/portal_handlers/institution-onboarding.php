<?php
// ---- report: institution-onboarding (institution/tenant onboarding wizard;
//      read + one admin write) ----
// Ported from local_hubredirect/institution_onboarding.php. That page defines no
// functions of its own — it drives the shared pqhi_* helpers in
// local/hubredirect/institutionlib.php directly — so its companion
// institution_onboarding_portallib.php is a guard-only stub and only the two
// shared libraries are required here. Included from portal_data.php AFTER token
// auth: $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent.
// GET  = the option lists the wizard's selects are built from, the requested
//        form defaults, and the 20 most recent institution workspaces.
// POST = the page's single create-institution write, verbatim: consumer + domain
//        rows, workspace, first admin owner/admin membership, landing defaults,
//        initial courses. do=create_institution; confirm_sesskey() dropped
//        (token auth replaces the session key); the legacy re-render is replaced
//        by an ok JSON payload carrying the created ids + follow-up links.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_onboarding_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same two-stage gate as the page's
//    pqh_require_platform_operations('Only platform administrators can create institution workspaces.')
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
    pqpd_fail(403, 'Only platform administrators can create institution workspaces.');
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

    if ($do === 'create_institution') {
        try {
            // -- write: legacy institution_onboarding.php POST branch (verbatim) --
            if (!pqh_table_exists_safe('local_prequran_workspace') || !pqh_table_exists_safe('local_prequran_workspace_member') || !pqh_consumer_schema_ready()) {
                throw new invalid_parameter_exception('Workspace and consumer tables are not ready.');
            }
            $name = trim($bparam('name', '', PARAM_TEXT));
            $slug = pqhi_clean_slug($bparam('slug', $name, PARAM_ALPHANUMEXT));
            $adminneedle = trim($bparam('adminuser', '', PARAM_TEXT));
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
            ]);
            if ($websiteprofile['website_mode'] !== 'hosted') {
                $publicdomain = '';
            }
            $institutiontype = pqhi_clean_institution_type($bparam('institution_type', 'primary_education', PARAM_ALPHANUMEXT));
            $faithsubcategory = $institutiontype === 'faith_based_education'
                ? pqhi_clean_faith_subcategory($bparam('faith_subcategory', '', PARAM_ALPHANUMEXT))
                : '';
            $teachingmethod = pqhi_clean_teaching_method($bparam('teaching_method', 'regular', PARAM_ALPHANUMEXT));
            $operatortype = pqhi_clean_operator_type($bparam('operator_type', 'private_entity', PARAM_ALPHANUMEXT));
            if ($name === '') {
                throw new invalid_parameter_exception('Institution name is required.');
            }
            $admin = pqhi_find_user($adminneedle);
            if (!$admin || !empty($admin->deleted) || !empty($admin->suspended)) {
                throw new invalid_parameter_exception('Choose an active Moodle user for the first institution admin.');
            }
            $now = time();
            $settings = [
                'created_from' => 'institution_onboarding',
                'institution_type' => $institutiontype,
                'faith_subcategory' => $faithsubcategory,
                'teaching_method' => $teachingmethod,
                'operator_type' => $operatortype,
                'initial_courses' => trim($bparam('initialcourses', 'Pre-Quraan', PARAM_TEXT)),
                'default_public_domain' => $publicdomain,
                'default_app_domain' => $appdomain,
                'website_mode' => $websiteprofile['website_mode'],
                'external_website_url' => $websiteprofile['external_website_url'],
            ];
            $workspaceid = (int)$DB->insert_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', (object)[
                'name' => $name,
                'slug' => pqhi_unique_workspace_slug($slug),
                'workspace_type' => 'institution',
                'ownerid' => (int)$admin->id,
                'status' => 'active',
                'plan_code' => trim($bparam('plancode', 'pilot', PARAM_ALPHANUMEXT)) ?: 'pilot',
                'student_limit' => $bparam('studentlimit', 0, PARAM_INT),
                'teacher_limit' => $bparam('teacherlimit', 0, PARAM_INT),
                'session_limit' => $bparam('sessionlimit', 0, PARAM_INT),
                'storage_limit_mb' => $bparam('storagelimit', 0, PARAM_INT),
                'settingsjson' => json_encode($settings, JSON_UNESCAPED_SLASHES),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]));
            $consumerid = pqhi_upsert_consumer($workspaceid, $name, $slug, (int)$admin->id, [
                'supportemail' => trim($bparam('supportemail', '', PARAM_EMAIL)),
                'logourl' => trim($bparam('logourl', '', PARAM_URL)),
                'brand_initials' => trim($bparam('brandinitials', '', PARAM_TEXT)),
                'primary_color' => trim($bparam('primarycolor', '#2f6f4e', PARAM_TEXT)),
                'accent_color' => trim($bparam('accentcolor', '#d99a26', PARAM_TEXT)),
                'surface_color' => trim($bparam('surfacecolor', '#f4f8fb', PARAM_TEXT)),
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
                'landing_headline' => trim($bparam('headline', $name, PARAM_TEXT)),
                'landing_subtitle' => trim($bparam('subtitle', '', PARAM_TEXT)),
                'landing_body' => trim($bparam('bodycopy', '', PARAM_TEXT)),
                'hero_image_url' => trim($bparam('heroimage', '', PARAM_URL)),
                'initial_courses' => (string)$settings['initial_courses'],
            ], (int)$USER->id);
            pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'owner', (int)$USER->id, 'Created by institution onboarding wizard.');
            pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'admin', (int)$USER->id, 'Created by institution onboarding wizard.');
            pqhi_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1, (int)$USER->id);
            pqhi_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0, (int)$USER->id);

            // Legacy renders "Open workspace / Settings / Landing" buttons after a
            // create — return the same target URLs for the portal client.
            $created = [
                'workspaceid' => $workspaceid,
                'consumerid' => $consumerid,
                'slug' => $slug,
                'adminname' => fullname($admin),
                'links' => [
                    'workspace' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['consumer' => $slug, 'workspaceid' => $workspaceid]))->out(false),
                    'settings' => (new moodle_url('/local/hubredirect/institution_settings.php', ['consumer' => $slug, 'workspaceid' => $workspaceid]))->out(false),
                    'landing' => (new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => $slug, 'workspaceid' => $workspaceid]))->out(false),
                ],
            ];
            echo json_encode(['ok' => true, 'message' => 'Institution workspace created.', 'created' => $created], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            // Legacy catches Throwable and shows $e->getMessage() in the error alert.
            pqpd_fail(400, $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown institution-onboarding action.');
}

// -- GET: the same option lists + recent-institution list the page renders --
$institutions = [];
if (pqh_table_exists_safe('local_prequran_workspace')) {
    $institutions = array_values($DB->get_records_select(
        'local_prequran_workspace',
        "workspace_type = ? AND status <> ?",
        ['institution', 'archived'],
        'timemodified DESC',
        '*',
        0,
        20
    ));
}

$nameids = [];
$institutionsout = [];
foreach ($institutions as $institution) {
    $nameids[] = (int)($institution->ownerid ?? 0);
    $institutionsout[] = [
        'id' => (int)$institution->id,
        'name' => (string)$institution->name,
        'slug' => (string)$institution->slug,
        'status' => (string)($institution->status ?? ''),
        'ownerid' => (int)($institution->ownerid ?? 0),
        'timemodified' => (int)($institution->timemodified ?? 0),
        'links' => [
            'workspace' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => (int)$institution->id]))->out(false),
            'settings' => (new moodle_url('/local/hubredirect/institution_settings.php', ['workspaceid' => (int)$institution->id]))->out(false),
        ],
    ];
}

// The requested form defaults the page seeds its selects with (sticky on reload).
$defaults = [
    'institution_type' => pqhi_clean_institution_type(optional_param('institution_type', 'primary_education', PARAM_ALPHANUMEXT)),
    'faith_subcategory' => pqhi_clean_faith_subcategory(optional_param('faith_subcategory', '', PARAM_ALPHANUMEXT)),
    'teaching_method' => pqhi_clean_teaching_method(optional_param('teaching_method', 'regular', PARAM_ALPHANUMEXT)),
    'operator_type' => pqhi_clean_operator_type(optional_param('operator_type', 'private_entity', PARAM_ALPHANUMEXT)),
    'website_mode' => pqhi_clean_option(optional_param('website_mode', 'hosted', PARAM_ALPHANUMEXT), pqhi_website_mode_options(), 'hosted'),
];

echo json_encode([
    'ok' => true, 'ready' => true,
    'schema_ready' => pqh_consumer_schema_ready(),
    'institutions' => $institutionsout,
    'defaults' => $defaults,
    'options' => [
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
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/institution_onboarding.php',
    'currentuserid' => $userid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
