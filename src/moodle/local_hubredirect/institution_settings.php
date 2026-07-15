<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/institutionlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and admins can edit institution settings.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Institution settings access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening institution settings.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Institution settings unavailable'
    );
}
if (!pqh_consumer_schema_ready()) {
    pqh_access_denied(
        'Institution branding tables are not ready yet.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Institution settings unavailable'
    );
}

$consumer = pqhi_consumer_for_workspace($workspaceid, (string)($consumercontext->consumerslug ?? ''));
$message = optional_param('saved', 0, PARAM_INT) === 1 ? 'Institution settings saved.' : '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen institution settings and try again.',
            new moodle_url('/local/hubredirect/institution_settings.php', $urlparams),
            'Institution settings form expired'
        );
    }
    try {
        $name = trim(optional_param('name', (string)$workspace->name, PARAM_TEXT));
        $slug = trim(optional_param('slug', (string)($consumer->slug ?? $workspace->slug), PARAM_ALPHANUMEXT));
        $supportemail = trim(optional_param('supportemail', '', PARAM_EMAIL));
        $logourl = trim(optional_param('logourl', '', PARAM_URL));
        $publicdomain = pqhi_normalize_domain(optional_param('publicdomain', '', PARAM_TEXT));
        $appdomain = pqhi_normalize_domain(optional_param('appdomain', '', PARAM_TEXT));
        $websiteprofile = pqhi_consumer_website_profile([
            'website_mode' => optional_param('website_mode', 'hosted', PARAM_ALPHANUMEXT),
            'external_website_url' => optional_param('externalwebsiteurl', '', PARAM_URL),
            'domain_management' => optional_param('domainmanagement', 'consumer_managed', PARAM_ALPHANUMEXT),
            'portal_label' => optional_param('portallabel', 'Learning portal', PARAM_TEXT),
            'branding_source' => optional_param('brandingsource', 'eduplatform_settings', PARAM_ALPHANUMEXT),
            'intake_location' => optional_param('intakelocation', 'eduplatform', PARAM_ALPHANUMEXT),
            'integration_method' => optional_param('integrationmethod', 'links', PARAM_ALPHANUMEXT),
            'return_url' => optional_param('returnurl', '', PARAM_URL),
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
            'brand_initials' => trim(optional_param('brandinitials', '', PARAM_TEXT)),
            'primary_color' => trim(optional_param('primarycolor', '', PARAM_TEXT)),
            'accent_color' => trim(optional_param('accentcolor', '', PARAM_TEXT)),
            'surface_color' => trim(optional_param('surfacecolor', '', PARAM_TEXT)),
            'dashboard_header_bg' => trim(optional_param('dashboardheaderbg', '', PARAM_TEXT)),
            'dashboard_header_text' => trim(optional_param('dashboardheadertext', '', PARAM_TEXT)),
            'page_body_bg' => trim(optional_param('pagebodybg', '', PARAM_TEXT)),
            'report_header_bg' => trim(optional_param('reportheaderbg', '', PARAM_TEXT)),
            'report_header_text' => trim(optional_param('reportheadertext', '', PARAM_TEXT)),
            'report_body_bg' => trim(optional_param('reportbodybg', '', PARAM_TEXT)),
            'landing_headline' => trim(optional_param('headline', '', PARAM_TEXT)),
            'landing_subtitle' => trim(optional_param('subtitle', '', PARAM_TEXT)),
            'landing_body' => trim(optional_param('bodycopy', '', PARAM_TEXT)),
            'hero_image_url' => trim(optional_param('heroimage', '', PARAM_URL)),
            'initial_courses' => trim(optional_param('initialcourses', '', PARAM_TEXT)),
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
        $settings['initial_courses'] = trim(optional_param('initialcourses', '', PARAM_TEXT));
        $settings['website_mode'] = $websiteprofile['website_mode'];
        $settings['external_website_url'] = $websiteprofile['external_website_url'];
        $settings['default_public_domain'] = $publicdomain;
        $settings['default_app_domain'] = $appdomain;
        $workspace->settingsjson = json_encode($settings, JSON_UNESCAPED_SLASHES);
        $DB->update_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', $workspace));
        redirect(new moodle_url('/local/hubredirect/institution_settings.php', $urlparams + ['saved' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
    $consumer = pqhi_consumer_for_workspace($workspaceid, $slug ?? '');
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING) ?: $workspace;
}

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
foreach ($domains as $domain) {
    if ((string)$domain->domain_type === 'app' && $appdomain === '') {
        $appdomain = (string)$domain->domain;
    }
    if ((string)$domain->domain_type === 'public' && $publicdomain === '') {
        $publicdomain = (string)$domain->domain;
    }
}
$params = ['consumer' => (string)$consumer->slug, 'workspaceid' => $workspaceid];
$landingurl = new moodle_url('/local/hubredirect/consumer_landing.php', $params);
$profileurl = new moodle_url('/local/hubredirect/institution_profile.php', $params);
$dashboardurl = new moodle_url('/local/hubredirect/workspace_dashboard.php', $params);
$peopleurl = new moodle_url('/local/hubredirect/workspace_people.php', $params);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_settings.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Settings');
$PAGE->set_heading('Institution Settings');
$PAGE->add_body_class('pqhis-page');

echo $OUTPUT->header();
?>
<style>
body.pqhis-page header,body.pqhis-page footer,body.pqhis-page nav.navbar,body.pqhis-page #page-header,body.pqhis-page #page-footer,body.pqhis-page .drawer,body.pqhis-page .drawer-toggles,body.pqhis-page .block-region,body.pqhis-page [data-region="drawer"],body.pqhis-page [data-region="right-hand-drawer"]{display:none!important}
body.pqhis-page #page,body.pqhis-page #page-content,body.pqhis-page #region-main,body.pqhis-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhis-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqhis-wrap{max-width:1180px;margin:0 auto}.pqhis-top,.pqhis-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqhis-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqhis-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqhis-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqhis-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqhis-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqhis-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqhis-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.pqhis-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqhis-field{display:grid;gap:5px;margin-bottom:10px}.pqhis-field--wide{grid-column:1/-1}.pqhis-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqhis-input,.pqhis-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqhis-input{min-height:40px}.pqhis-textarea{min-height:96px;padding-top:10px}.pqhis-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqhis-alert--ok{background:#edf9ef;color:#245c35}.pqhis-alert--bad{background:#fff0ed;color:#883526}.pqhis-preview{overflow:hidden;border-radius:8px;border:1px solid rgba(23,48,68,.12);background:#fff}.pqhis-preview-hero{min-height:280px;padding:24px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(90deg,rgba(9,37,32,.92),rgba(16,74,60,.45)),var(--pqhis-hero) center/cover no-repeat;color:#fff}.pqhis-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:var(--pqhis-primary);color:#fff;font-weight:950;overflow:hidden}.pqhis-mark img{width:100%;height:100%;object-fit:cover}.pqhis-preview h2{max-width:620px;margin:18px 0 0;color:#fff;font-size:42px;line-height:1;font-weight:950}.pqhis-preview p{max-width:620px;margin:12px 0 0;color:rgba(255,255,255,.88);font-weight:800}.pqhis-cardrow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px}.pqhis-card{padding:12px;border-radius:8px;background:#f7fbf8;border:1px solid rgba(47,111,78,.14);font-weight:900}.pqhis-muted{color:#5e7280;font-size:12px;font-weight:800}.pqhis-domain{display:inline-flex;margin:4px 4px 0 0;padding:5px 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
@media(max-width:900px){.pqhis-top,.pqhis-grid,.pqhis-formgrid{grid-template-columns:1fr}.pqhis-actions{justify-content:flex-start}.pqhis-preview h2{font-size:32px}}
<?php echo pqh_workspace_header_css($workspaceid); ?>
</style>
<main class="pqhis-shell">
  <div class="pqhis-wrap">
    <section class="pqhis-top pqh-workspace-top">
      <div>
        <h1 class="pqhis-title pqh-workspace-title">Institution Settings</h1>
        <p class="pqhis-sub pqh-workspace-sub"><?php echo s((string)$workspace->name); ?> branding, domains, support, and landing page copy.</p>
      </div>
      <nav class="pqhis-actions pqh-workspace-actions" aria-label="Institution settings navigation">
        <a class="pqhis-btn pqhis-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Workspace</a>
        <a class="pqhis-btn pqhis-btn--light" href="<?php echo $peopleurl->out(false); ?>">People</a>
        <a class="pqhis-btn pqhis-btn--light" href="<?php echo $landingurl->out(false); ?>">Landing</a>
        <a class="pqhis-btn pqhis-btn--light" href="<?php echo $profileurl->out(false); ?>">Profile</a>
        <a class="pqhis-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqhis-alert pqhis-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqhis-alert pqhis-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqhis-grid">
      <form class="pqhis-panel" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <div class="pqhis-formgrid">
          <div class="pqhis-field"><label>Institution name</label><input class="pqhis-input" name="name" value="<?php echo s((string)$consumer->name); ?>" required></div>
          <div class="pqhis-field"><label>Consumer slug</label><input class="pqhis-input" name="slug" value="<?php echo s((string)$consumer->slug); ?>" required></div>
          <div class="pqhis-field"><label>Logo URL</label><input class="pqhis-input" name="logourl" value="<?php echo s((string)($consumer->logourl ?? '')); ?>"></div>
          <div class="pqhis-field"><label>Initials</label><input class="pqhis-input" name="brandinitials" value="<?php echo s((string)$copy['brand_initials']); ?>" maxlength="6"></div>
          <div class="pqhis-field"><label>Primary color</label><input class="pqhis-input" name="primarycolor" value="<?php echo s((string)$theme['primary_color']); ?>"></div>
          <div class="pqhis-field"><label>Accent color</label><input class="pqhis-input" name="accentcolor" value="<?php echo s((string)$theme['accent_color']); ?>"></div>
          <div class="pqhis-field"><label>Surface color</label><input class="pqhis-input" name="surfacecolor" value="<?php echo s((string)$theme['surface_color']); ?>"></div>
          <div class="pqhis-field"><label>Dashboard header</label><input class="pqhis-input" name="dashboardheaderbg" maxlength="7" value="<?php echo s((string)$theme['dashboard_header_bg']); ?>"></div>
          <div class="pqhis-field"><label>Header text</label><input class="pqhis-input" name="dashboardheadertext" maxlength="7" value="<?php echo s((string)$theme['dashboard_header_text']); ?>"></div>
          <div class="pqhis-field"><label>Page body</label><input class="pqhis-input" name="pagebodybg" maxlength="7" value="<?php echo s((string)$theme['page_body_bg']); ?>"></div>
          <div class="pqhis-field"><label>Report header</label><input class="pqhis-input" name="reportheaderbg" maxlength="7" value="<?php echo s((string)$theme['report_header_bg']); ?>"></div>
          <div class="pqhis-field"><label>Report header text</label><input class="pqhis-input" name="reportheadertext" maxlength="7" value="<?php echo s((string)$theme['report_header_text']); ?>"></div>
          <div class="pqhis-field"><label>Report body</label><input class="pqhis-input" name="reportbodybg" maxlength="7" value="<?php echo s((string)$theme['report_body_bg']); ?>"></div>
          <div class="pqhis-field"><label>Support email</label><input class="pqhis-input" name="supportemail" value="<?php echo s((string)($consumer->supportemail ?? '')); ?>"></div>
          <div class="pqhis-field pqhis-field--wide"><label>Website hosting mode</label><select class="pqhis-input" name="website_mode"><?php foreach (pqhi_website_mode_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $websiteprofile['website_mode'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqhis-field pqhi-hosted-website-field"><label>EduPlatform-hosted public domain</label><input class="pqhis-input" name="publicdomain" value="<?php echo s($publicdomain); ?>" placeholder="school.example.org"></div>
          <div class="pqhis-field pqhi-external-website-field"><label>Existing website URL</label><input class="pqhis-input" name="externalwebsiteurl" value="<?php echo s($websiteprofile['external_website_url']); ?>" placeholder="https://www.example.org"></div>
          <div class="pqhis-field"><label>Learning portal domain</label><input class="pqhis-input" name="appdomain" value="<?php echo s($appdomain); ?>" placeholder="learn.example.org"></div>
          <div class="pqhis-field"><label>Portal label</label><input class="pqhis-input" name="portallabel" value="<?php echo s($websiteprofile['portal_label']); ?>"></div>
          <div class="pqhis-field"><label>Portal domain management</label><select class="pqhis-input" name="domainmanagement"><?php foreach (pqhi_domain_management_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $websiteprofile['domain_management'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqhis-field"><label>Branding source</label><select class="pqhis-input" name="brandingsource"><?php foreach (pqhi_branding_source_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $websiteprofile['branding_source'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqhis-field"><label>Public intake location</label><select class="pqhis-input" name="intakelocation"><?php foreach (pqhi_intake_location_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $websiteprofile['intake_location'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqhis-field"><label>Website integration</label><select class="pqhis-input" name="integrationmethod"><?php foreach (pqhi_integration_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $websiteprofile['integration_method'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqhis-field"><label>Return URL after intake</label><input class="pqhis-input" name="returnurl" value="<?php echo s($websiteprofile['return_url']); ?>" placeholder="https://www.example.org/thank-you"></div>
          <div class="pqhis-field pqhis-field--wide"><label>Hero image URL</label><input class="pqhis-input" name="heroimage" value="<?php echo s((string)$copy['hero_image_url']); ?>"></div>
          <div class="pqhis-field pqhis-field--wide"><label>Landing headline</label><input class="pqhis-input" name="headline" value="<?php echo s((string)$copy['landing_headline']); ?>"></div>
          <div class="pqhis-field pqhis-field--wide"><label>Landing subtitle</label><textarea class="pqhis-textarea" name="subtitle"><?php echo s((string)$copy['landing_subtitle']); ?></textarea></div>
          <div class="pqhis-field pqhis-field--wide"><label>Landing body</label><textarea class="pqhis-textarea" name="bodycopy"><?php echo s((string)$copy['landing_body']); ?></textarea></div>
          <div class="pqhis-field pqhis-field--wide"><label>Initial courses</label><input class="pqhis-input" name="initialcourses" value="<?php echo s((string)$copy['initial_courses']); ?>"></div>
        </div>
        <button class="pqhis-btn" type="submit">Save settings</button>
      </form>

      <aside class="pqhis-preview" style="--pqhis-primary: <?php echo s((string)$theme['primary_color']); ?>; --pqhis-hero: url('<?php echo s($previewhero); ?>');">
        <div class="pqhis-preview-hero">
          <span class="pqhis-mark">
            <?php if (trim((string)($consumer->logourl ?? '')) !== ''): ?><img src="<?php echo s((string)$consumer->logourl); ?>" alt="<?php echo s((string)$consumer->name); ?>"><?php else: ?><?php echo s((string)$copy['brand_initials']); ?><?php endif; ?>
          </span>
          <h2><?php echo s((string)$copy['landing_headline']); ?></h2>
          <p><?php echo s((string)$copy['landing_subtitle']); ?></p>
        </div>
        <div class="pqhis-cardrow">
          <div class="pqhis-card">Students</div>
          <div class="pqhis-card">Teachers</div>
          <div class="pqhis-card">Live sessions</div>
          <div class="pqhis-card">Reports</div>
        </div>
        <div style="padding:0 12px 12px">
          <?php foreach ($domains as $domain): ?><span class="pqhis-domain"><?php echo s((string)$domain->domain); ?> / <?php echo s((string)$domain->domain_type); ?></span><?php endforeach; ?>
          <?php if (!$domains): ?><span class="pqhis-muted">No custom domain rows found.</span><?php endif; ?>
        </div>
      </aside>
    </section>
  </div>
</main>
<script>
(function() {
  var websiteMode = document.querySelector('select[name="website_mode"]');
  var hostedWebsiteField = document.querySelector('.pqhi-hosted-website-field');
  var externalWebsiteField = document.querySelector('.pqhi-external-website-field');
  var externalWebsiteInput = externalWebsiteField ? externalWebsiteField.querySelector('input') : null;
  function syncWebsiteMode() {
    var external = websiteMode && websiteMode.value !== 'hosted';
    if (hostedWebsiteField) hostedWebsiteField.style.display = external ? 'none' : '';
    if (externalWebsiteField) externalWebsiteField.style.display = external ? '' : 'none';
    if (externalWebsiteInput) externalWebsiteInput.required = !!external;
  }
  if (websiteMode) {
    websiteMode.addEventListener('change', syncWebsiteMode);
    syncWebsiteMode();
  }
})();
</script>
<?php
echo $OUTPUT->footer();
