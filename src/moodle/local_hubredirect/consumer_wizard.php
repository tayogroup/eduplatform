<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/institutionlib.php');

pqh_require_platform_operations('Only platform administrators can create consumer apps.');

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
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new invalid_parameter_exception('Use local Moodle paths only, such as /local/hubredirect/consumer_landing.php.');
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
            throw new invalid_parameter_exception('Workspace and consumer tables are not ready.');
        }
        $type = optional_param('consumer_type', 'institution', PARAM_ALPHANUMEXT);
        if (!array_key_exists($type, pqhi_consumer_type_options())) {
            throw new invalid_parameter_exception('Choose a valid consumer type.');
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
            throw new invalid_parameter_exception('Consumer name is required.');
        }
        $slug = pqhi_clean_slug(optional_param('slug', $name, PARAM_TEXT));
        $routes = pqhi_default_routes_for_consumer($type);
        $admin = pqhi_find_or_create_admin_user([
            'adminuser' => optional_param('adminuser', '', PARAM_TEXT),
            'adminemail' => optional_param('adminemail', '', PARAM_EMAIL),
            'adminusername' => optional_param('adminusername', '', PARAM_ALPHANUMEXT),
            'adminfirstname' => optional_param('adminfirstname', '', PARAM_TEXT),
            'adminlastname' => optional_param('adminlastname', '', PARAM_TEXT),
        ], (int)$USER->id);
        if (!empty($admin->deleted) || !empty($admin->suspended)) {
            throw new invalid_parameter_exception('Choose an active Moodle user for the first admin.');
        }

        $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
        if ($workspaceid > 0) {
            $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
            if (!$workspace) {
                throw new invalid_parameter_exception('Linked workspace was not found.');
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
        $publicdomain = pqhi_normalize_domain(optional_param('publicdomain', '', PARAM_TEXT));
        $appdomain = pqhi_normalize_domain(optional_param('appdomain', '', PARAM_TEXT));
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
.pqcwiz-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcwiz-wrap{max-width:1180px;margin:0 auto}.pqcwiz-top,.pqcwiz-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcwiz-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqcwiz-title{margin:0;color:#221b22;font-size:30px;font-weight:950}.pqcwiz-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcwiz-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqcwiz-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqcwiz-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqcwiz-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.pqcwiz-formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqcwiz-field{display:grid;gap:5px;margin-bottom:8px}.pqcwiz-field--wide{grid-column:1/-1}.pqcwiz-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqcwiz-input,.pqcwiz-select,.pqcwiz-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqcwiz-input,.pqcwiz-select{min-height:40px;padding:0 10px}.pqcwiz-textarea{min-height:82px;padding:10px}.pqcwiz-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqcwiz-alert--ok{background:#edf9ef;color:#245c35}.pqcwiz-alert--bad{background:#fff0ed;color:#883526}.pqcwiz-step{display:grid;grid-template-columns:32px 1fr;gap:9px;margin-bottom:13px}.pqcwiz-step b:first-child{display:grid;place-items:center;height:30px;border-radius:8px;background:#edf9ef;color:#245c35}.pqcwiz-step strong{display:block;color:#221b22}.pqcwiz-step span{display:block;color:#5e7280;font-size:12px;font-weight:800}.pqcwiz-note{padding:12px;border:1px dashed rgba(23,48,68,.2);border-radius:8px;color:#5e7280;font-weight:850}
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
          <div class="pqcwiz-field"><label>Consumer type</label><select class="pqcwiz-select" name="consumer_type"><?php foreach (pqhi_consumer_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedtype === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Institution type</label><select class="pqcwiz-select" name="institution_type"><?php foreach (pqhi_institution_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedinstitutiontype === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field pqhi-faith-subcategory-field"><label>Faith sub-category</label><select class="pqcwiz-select" name="faith_subcategory"><option value="">Select</option><?php foreach (pqhi_faith_subcategory_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedfaithsubcategory === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Teaching method</label><select class="pqcwiz-select" name="teaching_method"><?php foreach (pqhi_teaching_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedteachingmethod === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Operator type</label><select class="pqcwiz-select" name="operator_type"><?php foreach (pqhi_operator_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedoperatortype === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Name</label><input class="pqcwiz-input" name="name" required></div>
          <div class="pqcwiz-field"><label>Slug</label><input class="pqcwiz-input" name="slug" placeholder="auto if blank"></div>
          <div class="pqcwiz-field"><label>Link workspace</label><select class="pqcwiz-select" name="workspaceid"><option value="0">Create new workspace</option><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>">#<?php echo (int)$workspace->id; ?> <?php echo s((string)$workspace->name); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Existing first admin</label><input class="pqcwiz-input" name="adminuser" placeholder="Moodle user ID, username, or email"></div>
          <div class="pqcwiz-field"><label>New admin first name</label><input class="pqcwiz-input" name="adminfirstname"></div>
          <div class="pqcwiz-field"><label>New admin last name</label><input class="pqcwiz-input" name="adminlastname"></div>
          <div class="pqcwiz-field"><label>New admin email</label><input class="pqcwiz-input" name="adminemail"></div>
          <div class="pqcwiz-field"><label>New admin username</label><input class="pqcwiz-input" name="adminusername"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Website hosting mode</label><select class="pqcwiz-select" name="website_mode"><?php foreach (pqhi_website_mode_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $requestedwebsitemode === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field pqhi-hosted-website-field"><label>EduPlatform-hosted public domain</label><input class="pqcwiz-input" name="publicdomain" placeholder="school.example.org"></div>
          <div class="pqcwiz-field pqhi-external-website-field"><label>Existing website URL</label><input class="pqcwiz-input" name="externalwebsiteurl" placeholder="https://www.example.org"></div>
          <div class="pqcwiz-field"><label>Learning portal domain</label><input class="pqcwiz-input" name="appdomain" placeholder="learn.example.org"></div>
          <div class="pqcwiz-field"><label>Portal label</label><input class="pqcwiz-input" name="portallabel" value="Learning portal"></div>
          <div class="pqcwiz-field"><label>Portal domain management</label><select class="pqcwiz-select" name="domainmanagement"><?php foreach (pqhi_domain_management_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Branding source</label><select class="pqcwiz-select" name="brandingsource"><?php foreach (pqhi_branding_source_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Public intake location</label><select class="pqcwiz-select" name="intakelocation"><?php foreach (pqhi_intake_location_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Website integration</label><select class="pqcwiz-select" name="integrationmethod"><?php foreach (pqhi_integration_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqcwiz-field"><label>Return URL after intake</label><input class="pqcwiz-input" name="returnurl" placeholder="https://www.example.org/thank-you"></div>
          <div class="pqcwiz-field"><label>Support email</label><input class="pqcwiz-input" name="supportemail"></div>
          <div class="pqcwiz-field"><label>Logo URL</label><input class="pqcwiz-input" name="logourl"></div>
          <div class="pqcwiz-field"><label>Initials</label><input class="pqcwiz-input" name="brandinitials" maxlength="6"></div>
          <div class="pqcwiz-field"><label>Plan code</label><input class="pqcwiz-input" name="plancode" value="pilot"></div>
          <div class="pqcwiz-field"><label>Primary color</label><input class="pqcwiz-input" name="primarycolor" value="#2f6f4e"></div>
          <div class="pqcwiz-field"><label>Accent color</label><input class="pqcwiz-input" name="accentcolor" value="#d99a26"></div>
          <div class="pqcwiz-field"><label>Surface color</label><input class="pqcwiz-input" name="surfacecolor" value="#f4f8fb"></div>
          <div class="pqcwiz-field"><label>Student limit</label><input class="pqcwiz-input" name="studentlimit" value="0"></div>
          <div class="pqcwiz-field"><label>Teacher limit</label><input class="pqcwiz-input" name="teacherlimit" value="0"></div>
          <div class="pqcwiz-field"><label>Session limit</label><input class="pqcwiz-input" name="sessionlimit" value="0"></div>
          <div class="pqcwiz-field"><label>Storage MB</label><input class="pqcwiz-input" name="storagelimit" value="0"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Default public path</label><input class="pqcwiz-input" name="defaultpublicpath" placeholder="/local/hubredirect/consumer_landing.php"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Default dashboard path</label><input class="pqcwiz-input" name="defaultdashboardpath" placeholder="/local/hubredirect/workspace_dashboard.php"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Default login path</label><input class="pqcwiz-input" name="defaultloginpath" placeholder="/local/hubredirect/consumer_login.php"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Hero image URL</label><input class="pqcwiz-input" name="heroimage"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Landing headline</label><input class="pqcwiz-input" name="headline"></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Landing subtitle</label><textarea class="pqcwiz-textarea" name="subtitle"></textarea></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Landing body</label><textarea class="pqcwiz-textarea" name="bodycopy"></textarea></div>
          <div class="pqcwiz-field pqcwiz-field--wide"><label>Initial courses</label><input class="pqcwiz-input" name="initialcourses" value="Pre-Quraan"></div>
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
