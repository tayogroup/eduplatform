<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/institutionlib.php');

pqh_require_platform_operations('Only platform administrators can create consumer apps.');
pqh_enforce_role_domain(pqh_current_consumer_context(), pqh_current_workspace_id((int)$USER->id), (int)$USER->id);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/consumer_wizard.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Consumer Creation Wizard');
$PAGE->set_heading('Consumer Creation Wizard');
$PAGE->add_body_class('pqcwiz-page');

function pqcw_clean_route(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '') {
        return $fallback;
    }
    $bare = ltrim($path, '/');
    if (strpos($bare, '/') === false
            && substr($bare, -4) !== '.php'
            && preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i', $bare)) {
        throw new Exception('"' . $bare . '" looks like a domain, not a Moodle path. Enter domains in the domain fields above -- this field takes a local route such as /local/hubredirect/consumer_landing.php.');
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new Exception('Use local Moodle paths only, such as /local/hubredirect/consumer_landing.php.');
    }
    return $path;
}

$created = null;
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the consumer wizard and try again.',
            new moodle_url('/local/hubredirect/consumer_wizard.php'),
            'Consumer wizard form expired'
        );
    }
    try {
        if (!pqh_table_exists_safe('local_prequran_workspace') || !pqh_table_exists_safe('local_prequran_workspace_member') || !pqh_consumer_schema_ready()) {
            throw new Exception('Workspace and consumer tables are not ready.');
        }
        $type = optional_param('consumer_type', 'institution', PARAM_ALPHANUMEXT);
        if (!array_key_exists($type, pqhi_consumer_type_options())) {
            throw new Exception('Choose a valid consumer type.');
        }
        $institutiontype = pqhi_clean_institution_type(optional_param('institution_type', 'primary_education', PARAM_ALPHANUMEXT));
        $faithsubcategory = $type === 'institution' && $institutiontype === 'faith_based_education'
            ? pqhi_clean_faith_subcategory(optional_param('faith_subcategory', '', PARAM_ALPHANUMEXT))
            : '';
        $teachingmethod = $type === 'institution'
            ? pqhi_clean_teaching_method(optional_param('teaching_method', 'regular', PARAM_ALPHANUMEXT))
            : '';
        $operatortype = $type === 'institution'
            ? pqhi_clean_operator_type(optional_param('operator_type', 'private_entity', PARAM_ALPHANUMEXT))
            : '';
        $websiteprofile = pqhi_consumer_website_profile([
            'website_mode' => optional_param('website_mode', 'hosted', PARAM_ALPHANUMEXT),
            'external_website_url' => optional_param('externalwebsiteurl', '', PARAM_URL),
            'domain_management' => optional_param('domainmanagement', 'consumer_managed', PARAM_ALPHANUMEXT),
            'portal_label' => optional_param('portallabel', 'Learning portal', PARAM_TEXT),
            'branding_source' => optional_param('brandingsource', 'eduplatform_settings', PARAM_ALPHANUMEXT),
            'intake_location' => optional_param('intakelocation', 'eduplatform', PARAM_ALPHANUMEXT),
            'integration_method' => optional_param('integrationmethod', 'links', PARAM_ALPHANUMEXT),
            'return_url' => optional_param('returnurl', '', PARAM_URL),
        ]);
        $name = trim(optional_param('name', '', PARAM_TEXT));
        if ($name === '') {
            throw new Exception('Consumer name is required.');
        }
        $publicdomain = pqhi_normalize_domain(optional_param('publicdomain', '', PARAM_TEXT));
        $appdomain = pqhi_normalize_domain(optional_param('appdomain', '', PARAM_TEXT));
        if ($websiteprofile['website_mode'] === 'hosted' && $publicdomain === '') {
            throw new Exception('EduPlatform-hosted public domain is required when Website mode is Hosted -- this is the domain visitors use to reach the landing page.');
        }
        if ($appdomain === '') {
            throw new Exception('Learning portal domain is required in every hosting mode.');
        }
        $slug = pqhi_clean_slug(optional_param('slug', $name, PARAM_TEXT));
        $routes = pqhi_default_routes_for_consumer($type);
        $admin = pqhi_find_or_create_admin_user([
            'adminuser' => optional_param('adminuser', '', PARAM_TEXT),
            'adminemail' => optional_param('adminemail', '', PARAM_EMAIL),
            'adminusername' => optional_param('adminusername', '', PARAM_ALPHANUMEXT),
            'adminfirstname' => optional_param('adminfirstname', '', PARAM_TEXT),
            'adminlastname' => optional_param('adminlastname', '', PARAM_TEXT),
            'schoolslug' => $slug,
        ], (int)$USER->id);
        if (!empty($admin->deleted) || !empty($admin->suspended)) {
            throw new Exception('Choose an active Moodle user for the first admin.');
        }

        $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
        if ($workspaceid > 0) {
            $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
            if (!$workspace) {
                throw new Exception('Linked workspace was not found.');
            }
        } else {
            $workspaceid = pqhi_create_workspace_for_consumer($name, $slug, $type, (int)$admin->id, [
                'created_from' => 'consumer_wizard',
                'plancode' => optional_param('plancode', 'pilot', PARAM_ALPHANUMEXT),
                'studentlimit' => optional_param('studentlimit', 0, PARAM_INT),
                'teacherlimit' => optional_param('teacherlimit', 0, PARAM_INT),
                'sessionlimit' => optional_param('sessionlimit', 0, PARAM_INT),
                'storagelimit' => optional_param('storagelimit', 0, PARAM_INT),
                'institution_type' => $institutiontype,
                'faith_subcategory' => $faithsubcategory,
                'teaching_method' => $teachingmethod,
                'operator_type' => $operatortype,
                'initial_courses' => optional_param('initialcourses', 'Pre-Quraan', PARAM_TEXT),
                'publicdomain' => optional_param('publicdomain', '', PARAM_TEXT),
                'appdomain' => optional_param('appdomain', '', PARAM_TEXT),
                'website_mode' => $websiteprofile['website_mode'],
                'external_website_url' => $websiteprofile['external_website_url'],
            ], (int)$USER->id);
        }

        $consumerid = pqhi_upsert_consumer_app($workspaceid, $name, $slug, $type, (int)$admin->id, [
            'supportemail' => optional_param('supportemail', '', PARAM_EMAIL),
            'logourl' => optional_param('logourl', '', PARAM_URL),
            'brand_initials' => optional_param('brandinitials', '', PARAM_TEXT),
            'primary_color' => optional_param('primarycolor', '#2f6f4e', PARAM_TEXT),
            'accent_color' => optional_param('accentcolor', '#d99a26', PARAM_TEXT),
            'surface_color' => optional_param('surfacecolor', '#f4f8fb', PARAM_TEXT),
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
            'landing_headline' => optional_param('headline', $name, PARAM_TEXT),
            'landing_subtitle' => optional_param('subtitle', '', PARAM_TEXT),
            'landing_body' => optional_param('bodycopy', '', PARAM_TEXT),
            'hero_image_url' => optional_param('heroimage', '', PARAM_URL),
            'initial_courses' => optional_param('initialcourses', 'Pre-Quraan', PARAM_TEXT),
            'defaultpublicpath' => pqcw_clean_route(optional_param('defaultpublicpath', $routes['public'], PARAM_LOCALURL), $routes['public']),
            'defaultdashboardpath' => pqcw_clean_route(optional_param('defaultdashboardpath', $routes['dashboard'], PARAM_LOCALURL), $routes['dashboard']),
            'defaultloginpath' => pqcw_clean_route(optional_param('defaultloginpath', $routes['login'], PARAM_LOCALURL), $routes['login']),
        ], (int)$USER->id);

        pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'owner', (int)$USER->id, 'Created by consumer wizard.');
        pqhi_upsert_workspace_member($workspaceid, (int)$admin->id, 'admin', (int)$USER->id, 'Created by consumer wizard.');
        if ($websiteprofile['website_mode'] !== 'hosted') {
            $publicdomain = '';
        }
        pqhi_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1, (int)$USER->id);
        pqhi_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0, (int)$USER->id);
        $created = ['slug' => $slug, 'workspaceid' => $workspaceid, 'consumerid' => $consumerid, 'admin' => fullname($admin)];
        $message = 'Consumer app, workspace, first admin, routes, and default landing settings are ready.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$workspaces = [];
if (pqh_table_exists_safe('local_prequran_workspace')) {
    $workspaces = array_values($DB->get_records_select('local_prequran_workspace', "status <> ?", ['archived'], 'name ASC', 'id,name,slug,workspace_type'));
}
$requestedtype = optional_param('type', '', PARAM_ALPHANUMEXT);
if (!array_key_exists($requestedtype, pqhi_consumer_type_options())) {
    $requestedtype = optional_param('consumer_type', 'institution', PARAM_ALPHANUMEXT);
}
if (!array_key_exists($requestedtype, pqhi_consumer_type_options())) {
    $requestedtype = 'institution';
}
$requestedinstitutiontype = pqhi_clean_institution_type(optional_param('institution_type', 'primary_education', PARAM_ALPHANUMEXT));
$requestedfaithsubcategory = pqhi_clean_faith_subcategory(optional_param('faith_subcategory', '', PARAM_ALPHANUMEXT));
$requestedteachingmethod = pqhi_clean_teaching_method(optional_param('teaching_method', 'regular', PARAM_ALPHANUMEXT));
$requestedoperatortype = pqhi_clean_operator_type(optional_param('operator_type', 'private_entity', PARAM_ALPHANUMEXT));
$requestedwebsitemode = pqhi_clean_option(optional_param('website_mode', 'hosted', PARAM_ALPHANUMEXT), pqhi_website_mode_options(), 'hosted');

echo $OUTPUT->header();
?>
<style>
body.pqcwiz-page header,body.pqcwiz-page footer,body.pqcwiz-page nav.navbar,body.pqcwiz-page #page-header,body.pqcwiz-page #page-footer,body.pqcwiz-page .drawer,body.pqcwiz-page .drawer-toggles,body.pqcwiz-page .block-region,body.pqcwiz-page [data-region="drawer"],body.pqcwiz-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcwiz-page #page,body.pqcwiz-page #page-content,body.pqcwiz-page #region-main,body.pqcwiz-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcwiz-shell{
  --paper:#f7f4ec;--paper-raised:#fffdf8;--ink:#16261f;--ink-soft:#4d6358;--ink-faint:#7c8d81;
  --line:#ddd5bf;--line-strong:#c9bd9d;--green:#2f6f4e;--green-soft:#e4efe6;--gold:#a5741e;--gold-soft:#f4e6c8;
  --slate:#3f5872;--slate-soft:#e4eaf0;--header-blue:#1f6feb;--header-blue-ink:#ffffff;--header-blue-ink-soft:#dbe9ff;--label-brown:#6b4423;--red:#9a3d2d;--red-soft:#f6e2dc;
  --serif:Iowan Old Style,Palatino Linotype,Palatino,Georgia,serif;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  min-height:100vh;padding:28px 18px 56px;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;
}
@media (prefers-color-scheme: dark){
  .pqcwiz-shell{
    --paper:#121d17;--paper-raised:#16241c;--ink:#e8e3d3;--ink-soft:#9fb0a4;--ink-faint:#6d7f73;
    --line:#2a3a30;--line-strong:#3a4c40;--green:#74c096;--green-soft:#1c3327;--gold:#dcaa54;--gold-soft:#3a301a;
    --slate:#8ba7c4;--slate-soft:#1e2c3a;--header-blue:#2f7bf0;--header-blue-ink:#ffffff;--header-blue-ink-soft:#dbe9ff;--label-brown:#c99361;--red:#e08876;--red-soft:#3a2420;
  }
}
.pqcwiz-wrap{max-width:1180px;margin:0 auto}
.pqcwiz-top,.pqcwiz-panel{padding:18px;border:1px solid var(--line);border-radius:10px;background:var(--paper-raised);box-shadow:0 12px 28px rgba(22,38,31,.06)}
.pqcwiz-top{background:var(--header-blue);border-color:var(--header-blue)}
.pqcwiz-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}
.pqcwiz-top .pqcwiz-title{color:var(--header-blue-ink)}
.pqcwiz-top .pqcwiz-sub{color:var(--header-blue-ink-soft)}
.pqcwiz-title{margin:0;font-family:var(--serif);font-size:33px;font-weight:600;letter-spacing:-.01em}
.pqcwiz-sub{margin:7px 0 0;font-size:17px;font-weight:500}
.pqcwiz-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pqcwiz-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border:0;border-radius:8px;background:var(--green);color:#fff!important;text-decoration:none;font-family:var(--sans);font-size:16px;font-weight:600;cursor:pointer}
.pqcwiz-btn--light{background:var(--paper-raised);color:var(--ink-soft)!important;border:1px solid var(--line-strong)}
.pqcwiz-top .pqcwiz-btn--light{background:var(--header-blue-ink);color:var(--header-blue)!important;border-color:transparent}
.pqcwiz-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}
.pqcwiz-formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pqcwiz-field{display:grid;gap:5px;margin-bottom:8px}
.pqcwiz-field--wide{grid-column:1/-1}
.pqcwiz-field label{font-family:var(--mono);font-size:15px;font-weight:600;letter-spacing:.05em;color:var(--label-brown);text-transform:uppercase}
.pqcwiz-input,.pqcwiz-select,.pqcwiz-textarea{width:100%;border:1px solid var(--line);border-radius:8px;background:var(--paper-raised);color:var(--ink);font-family:var(--sans);font-size:16.5px;box-sizing:border-box}
.pqcwiz-input,.pqcwiz-select{min-height:40px;padding:0 10px}
.pqcwiz-textarea{min-height:82px;padding:10px}
.pqcwiz-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:600}
.pqcwiz-alert--ok{background:var(--green-soft);color:var(--ink)}
.pqcwiz-alert--bad{background:var(--red-soft);color:var(--red)}
.pqcwiz-step{display:grid;grid-template-columns:32px 1fr;gap:9px;margin-bottom:13px}
.pqcwiz-step b:first-child{display:grid;place-items:center;height:30px;border-radius:8px;background:var(--green-soft);color:var(--green);font-family:var(--serif)}
.pqcwiz-step strong{display:block;color:var(--ink);font-weight:600}
.pqcwiz-step span{display:block;color:var(--ink-soft);font-size:15px;font-weight:500}
.pqcwiz-note{padding:12px 14px;border:1px dashed var(--line-strong);border-radius:10px;background:var(--slate-soft);color:var(--ink-soft);font-weight:500;font-size:16px}
.pqcwiz-help{display:block;margin-top:4px;padding:4px 8px;border-radius:6px;background:var(--slate-soft);color:var(--ink-faint);font-size:14.5px;font-weight:500;line-height:1.4}
@media(max-width:900px){.pqcwiz-top,.pqcwiz-grid,.pqcwiz-formgrid{grid-template-columns:1fr}.pqcwiz-actions{justify-content:flex-start}}
</style>
<main class="pqcwiz-shell">
  <div class="pqcwiz-wrap">
    <section class="pqcwiz-top">
      <div>
        <h1 class="pqcwiz-title">Consumer Creation Wizard</h1>
        <p class="pqcwiz-sub">Create an academy, institution, marketplace, or teacher workspace consumer with routes, workspace, first admin, domains, and landing defaults.</p>
      </div>
      <nav class="pqcwiz-actions">
        <a class="pqcwiz-btn pqcwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Consumers</a>
        <a class="pqcwiz-btn pqcwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Dashboard</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqcwiz-alert pqcwiz-alert--ok"><?php echo s($message); ?><?php if ($created): ?> <a href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['consumer' => $created['slug'], 'workspaceid' => $created['workspaceid']]))->out(false); ?>">Open workspace</a><?php endif; ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqcwiz-alert pqcwiz-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqcwiz-grid">
      <form class="pqcwiz-panel" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <div class="pqcwiz-formgrid">
          <div class="pqcwiz-field"><label>Consumer type</label><select class="pqcwiz-select" name="consumer_type"><?php foreach (pqhi_consumer_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedtype === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Academy = a platform-wide brand like Quraan Academy. Institution = a school with its own admin, students, and teachers. Marketplace = a public teacher-discovery surface. Teacher workspace = one independent tutor's own space.</span></div>
          <div class="pqcwiz-field"><label>Institution type</label><select class="pqcwiz-select" name="institution_type"><?php foreach (pqhi_institution_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedinstitutiontype === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Only takes effect when Consumer type is Institution. Choosing Religious / faith-based unlocks the sub-category field below it.</span></div>
          <div class="pqcwiz-field pqhi-faith-subcategory-field"><label>Faith sub-category</label><select class="pqcwiz-select" name="faith_subcategory"><option value="">Select</option><?php foreach (pqhi_faith_subcategory_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedfaithsubcategory === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Only shown, and only saved, when Institution type is Religious / faith-based.</span></div>
          <div class="pqcwiz-field"><label>Teaching method</label><select class="pqcwiz-select" name="teaching_method"><?php foreach (pqhi_teaching_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedteachingmethod === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">How this institution actually teaches — in person, homeschool-style, fully online, or a mix. Descriptive only; doesn't change routing.</span></div>
          <div class="pqcwiz-field"><label>Operator type</label><select class="pqcwiz-select" name="operator_type"><?php foreach (pqhi_operator_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedoperatortype === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Who legally runs the institution — government, nonprofit, private, or hybrid. Used for reporting, not access control.</span></div>
          <div class="pqcwiz-field"><label>Name</label><input class="pqcwiz-input" name="name" required><span class="pqcwiz-help">The consumer's display name — shown in branding, emails, and the workspace header.</span></div>
          <div class="pqcwiz-field"><label>Slug</label><input class="pqcwiz-input" name="slug" placeholder="auto if blank"><span class="pqcwiz-help">A short, URL-safe identifier used in links and reports. Leave blank to generate one from the name.</span></div>
          <div class="pqcwiz-field"><label>Link workspace</label><select class="pqcwiz-select" name="workspaceid"><option value="0">Create new workspace</option><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>">#<?php echo (int)$workspace->id; ?> <?php echo s((string)$workspace->name); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Attach this consumer to a workspace that already exists, or leave as "Create new workspace" to start from scratch.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Existing first admin</label><input class="pqcwiz-input" name="adminuser" placeholder="Moodle user ID, username, or email"><span class="pqcwiz-help">A Moodle user who should own this consumer. Leave blank to create a brand-new admin account from the four fields below instead.</span></div>
          <div class="pqcwiz-field"><label>New admin first name</label><input class="pqcwiz-input" name="adminfirstname"><span class="pqcwiz-help">Only used when Existing first admin above is left blank.</span></div>
          <div class="pqcwiz-field"><label>New admin last name</label><input class="pqcwiz-input" name="adminlastname"><span class="pqcwiz-help">Only used when Existing first admin above is left blank.</span></div>
          <div class="pqcwiz-field"><label>New admin email</label><input class="pqcwiz-input" name="adminemail"><span class="pqcwiz-help">Where this admin's account credentials and notifications are sent.</span></div>
          <div class="pqcwiz-field"><label>New admin username</label><input class="pqcwiz-input" name="adminusername"><span class="pqcwiz-help">Leave blank to generate one automatically from the name/email.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Website hosting mode</label><select class="pqcwiz-select" name="website_mode"><?php foreach (pqhi_website_mode_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedwebsitemode === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Choosing this is not about who owns the domain name — you can point your own domain at EduPlatform either way. It's about who serves the actual landing page content. Pick <strong>Hosted</strong> if you want EduPlatform to build and serve that page (the normal choice — works fine even on a domain you registered yourself, e.g. yourschool.org). Only pick <strong>External</strong> if the landing page content already lives on a separate, already-built website (Wix, Squarespace, another host) that you just want to link to the learning portal. Picking External when you actually want Hosted is the most common setup mistake — if in doubt, choose Hosted.</span></div>
          <div class="pqcwiz-field pqhi-hosted-website-field"><label>EduPlatform-hosted public domain</label><input class="pqcwiz-input" name="publicdomain" placeholder="school.example.org"><span class="pqcwiz-help">Required in Hosted mode. The domain visitors type in to reach this school's landing page — it can be a domain you already own. This is a domain name only (e.g. school.example.org), never a path.</span></div>
          <div class="pqcwiz-field pqhi-external-website-field"><label>Existing website URL</label><input class="pqcwiz-input" name="externalwebsiteurl" placeholder="https://www.example.org"><span class="pqcwiz-help">Only relevant in External or External-with-embeds mode: the full URL of the already-built website the landing page lives on. If you don't have a separate already-built site, switch Website hosting mode to Hosted instead of filling this in.</span></div>
          <div class="pqcwiz-field"><label>Learning portal domain</label><input class="pqcwiz-input" name="appdomain" placeholder="learn.example.org"><span class="pqcwiz-help">Where dashboards and course access live. Needed in every hosting mode, even when the landing page is external.</span></div>
          <div class="pqcwiz-field"><label>Portal label</label><input class="pqcwiz-input" name="portallabel" value="Learning portal"><span class="pqcwiz-help">What the portal is called in navigation and emails, e.g. "Learning portal" or "Student portal".</span></div>
          <div class="pqcwiz-field"><label>Portal domain management</label><select class="pqcwiz-select" name="domainmanagement"><?php foreach (pqhi_domain_management_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Who manages DNS for the domains above — informational only, doesn't change how EduPlatform routes traffic.</span></div>
          <div class="pqcwiz-field"><label>Branding source</label><select class="pqcwiz-select" name="brandingsource"><?php foreach (pqhi_branding_source_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Use EduPlatform's own colors/logo below, or match the external website's look instead. Forced to EduPlatform settings when hosting mode is Hosted.</span></div>
          <div class="pqcwiz-field"><label>Public intake location</label><select class="pqcwiz-select" name="intakelocation"><?php foreach (pqhi_intake_location_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">Where a new family actually applies: an EduPlatform-hosted form, a page on their own site, or embedded directly into it. Forced to embedded when hosting mode is External with embeds.</span></div>
          <div class="pqcwiz-field"><label>Website integration</label><select class="pqcwiz-select" name="integrationmethod"><?php foreach (pqhi_integration_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select><span class="pqcwiz-help">How their site connects to EduPlatform: plain links, embedded widgets, or a full API integration. Forced to embedded when hosting mode is External with embeds.</span></div>
          <div class="pqcwiz-field"><label>Return URL after intake</label><input class="pqcwiz-input" name="returnurl" placeholder="https://www.example.org/thank-you"><span class="pqcwiz-help">Where EduPlatform sends a visitor back to on their own site once an intake form is submitted, e.g. a "thank you" page.</span></div>
          <div class="pqcwiz-field"><label>Support email</label><input class="pqcwiz-input" name="supportemail"><span class="pqcwiz-help">Shown to families and used as the reply-to address on outgoing notifications.</span></div>
          <div class="pqcwiz-field"><label>Logo URL</label><input class="pqcwiz-input" name="logourl"><span class="pqcwiz-help">Shown in the header, emails, and landing page — unless Branding source above is set to match the external website.</span></div>
          <div class="pqcwiz-field"><label>Initials</label><input class="pqcwiz-input" name="brandinitials" maxlength="6"><span class="pqcwiz-help">A short fallback shown wherever there's no room for the full logo, e.g. "EA" for Ehel Academy.</span></div>
          <div class="pqcwiz-field"><label>Plan code</label><input class="pqcwiz-input" name="plancode" value="pilot"><span class="pqcwiz-help">An internal label for billing/plan tracking — doesn't enforce any limit by itself.</span></div>
          <div class="pqcwiz-field"><label>Primary color</label><input class="pqcwiz-input" name="primarycolor" value="#2f6f4e"><span class="pqcwiz-help">The main accent color across this consumer's branded dashboard, login, and landing page.</span></div>
          <div class="pqcwiz-field"><label>Accent color</label><input class="pqcwiz-input" name="accentcolor" value="#d99a26"><span class="pqcwiz-help">The secondary highlight color, used alongside the primary color.</span></div>
          <div class="pqcwiz-field"><label>Surface color</label><input class="pqcwiz-input" name="surfacecolor" value="#f4f8fb"><span class="pqcwiz-help">The background tone behind cards and panels in the branded pages.</span></div>
          <div class="pqcwiz-field"><label>Student limit</label><input class="pqcwiz-input" name="studentlimit" value="0"><span class="pqcwiz-help">0 means unlimited. Set a real number to cap enrollment for this plan.</span></div>
          <div class="pqcwiz-field"><label>Teacher limit</label><input class="pqcwiz-input" name="teacherlimit" value="0"><span class="pqcwiz-help">0 means unlimited. Set a real number to cap staff seats for this plan.</span></div>
          <div class="pqcwiz-field"><label>Session limit</label><input class="pqcwiz-input" name="sessionlimit" value="0"><span class="pqcwiz-help">0 means unlimited. Set a real number to cap concurrent or monthly live sessions.</span></div>
          <div class="pqcwiz-field"><label>Storage MB</label><input class="pqcwiz-input" name="storagelimit" value="0"><span class="pqcwiz-help">0 means unlimited. Set a real number to cap uploaded materials and recordings.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Default public path</label><input class="pqcwiz-input" name="defaultpublicpath" placeholder="/local/hubredirect/consumer_landing.php"><span class="pqcwiz-help">A Moodle route (a path starting with /), not a domain — leave this blank for almost every consumer. It only overrides which internal page the public domain above points to; it never affects which domain visitors type in.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Default dashboard path</label><input class="pqcwiz-input" name="defaultdashboardpath" placeholder="/local/hubredirect/workspace_dashboard.php"><span class="pqcwiz-help">Where a signed-in member lands after login. Leave blank to use the built-in default for its consumer type.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Default login path</label><input class="pqcwiz-input" name="defaultloginpath" placeholder="/local/hubredirect/consumer_login.php"><span class="pqcwiz-help">The branded sign-in page for this consumer. Leave blank to use the built-in default.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Hero image URL</label><input class="pqcwiz-input" name="heroimage"><span class="pqcwiz-help">The large image shown in the landing page's hero section.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Landing headline</label><input class="pqcwiz-input" name="headline"><span class="pqcwiz-help">The landing page's main heading. Defaults to the consumer name above if left blank.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Landing subtitle</label><textarea class="pqcwiz-textarea" name="subtitle"></textarea><span class="pqcwiz-help">A short supporting line shown directly under the headline.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Landing body</label><textarea class="pqcwiz-textarea" name="bodycopy"></textarea><span class="pqcwiz-help">The main paragraph of marketing copy on the landing page.</span></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Initial courses</label><input class="pqcwiz-input" name="initialcourses" value="Pre-Quraan"><span class="pqcwiz-help">A comma-separated starting course list shown on the landing page — descriptive copy, not a live catalog link.</span></div>
        </div>
        <button class="pqcwiz-btn" type="submit">Create consumer</button>
      </form>
      <aside class="pqcwiz-panel">
        <div class="pqcwiz-step"><b>1</b><div><strong>Choose consumer type</strong><span>Academy, institution, marketplace, or teacher workspace presets drive route defaults; institution type drives intake fields.</span></div></div>
        <div class="pqcwiz-step"><b>2</b><div><strong>Create or link workspace</strong><span>New workspaces are scoped and assigned to the first admin automatically.</span></div></div>
        <div class="pqcwiz-step"><b>3</b><div><strong>Attach domains</strong><span>Public and app domains are recorded for host-based routing after cPanel shared-root setup.</span></div></div>
        <div class="pqcwiz-step"><b>4</b><div><strong>Store landing defaults</strong><span>Logo, colors, support email, copy, hero image, and routes are stored in consumer settings.</span></div></div>
        <p class="pqcwiz-note">Map each public and app domain to the institution that owns it. Unmapped hosts use the configured platform foundation routes.</p>
      </aside>
    </section>
  </div>
</main>
<script>
(function() {
  var type = document.querySelector('select[name="institution_type"]');
  var field = document.querySelector('.pqhi-faith-subcategory-field');
  var subcategory = field ? field.querySelector('select[name="faith_subcategory"]') : null;
  var websiteMode = document.querySelector('select[name="website_mode"]');
  var hostedWebsiteField = document.querySelector('.pqhi-hosted-website-field');
  var externalWebsiteField = document.querySelector('.pqhi-external-website-field');
  var externalWebsiteInput = externalWebsiteField ? externalWebsiteField.querySelector('input') : null;
  function syncFaithSubcategory() {
    var show = type && type.value === 'faith_based_education';
    if (field) {
      field.style.display = show ? '' : 'none';
    }
    if (!show && subcategory) {
      subcategory.value = '';
    }
  }
  function syncWebsiteMode() {
    var external = websiteMode && websiteMode.value !== 'hosted';
    if (hostedWebsiteField) hostedWebsiteField.style.display = external ? 'none' : '';
    if (externalWebsiteField) externalWebsiteField.style.display = external ? '' : 'none';
    if (externalWebsiteInput) externalWebsiteInput.required = !!external;
  }
  if (type && field) {
    type.addEventListener('change', syncFaithSubcategory);
    syncFaithSubcategory();
  }
  if (websiteMode) {
    websiteMode.addEventListener('change', syncWebsiteMode);
    syncWebsiteMode();
  }
})();
</script>
<?php
echo $OUTPUT->footer();
