<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

pqh_require_platform_operations('Only platform administrators can manage consumer apps.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_consumers.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Platform Consumer Management');
$PAGE->set_heading('Platform Consumer Management');
$PAGE->add_body_class('pqpc-page');

function pqpc_status_options(): array {
    return ['active' => 'Active', 'paused' => 'Paused', 'archived' => 'Archived'];
}

function pqpc_domain_status_options(): array {
    return ['active' => 'Active', 'pending' => 'Pending', 'disabled' => 'Disabled'];
}

function pqpc_domain_type_options(): array {
    return ['public' => 'Public', 'app' => 'App'];
}

function pqpc_clean_local_path(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '') {
        return $fallback;
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new invalid_parameter_exception('Choose a local Moodle path such as /local/hubredirect/consumer_landing.php.');
    }
    return $path;
}

function pqpc_update_workspace(int $workspaceid, string $status): void {
    global $DB;
    if ($workspaceid <= 0 || !array_key_exists($status, pqpc_status_options())) {
        throw new invalid_parameter_exception('Choose a valid workspace status.');
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    if (!$workspace) {
        throw new invalid_parameter_exception('Workspace was not found.');
    }
    $workspace->status = $status;
    if (pqh_table_has_field_safe('local_prequran_workspace', 'timemodified')) {
        $workspace->timemodified = time();
    }
    $DB->update_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', $workspace));
}

function pqpc_update_consumer(
    int $consumerid,
    string $name,
    string $slug,
    string $consumertype,
    string $status,
    string $supportemail,
    string $publicpath,
    string $dashboardpath,
    string $logourl,
    string $brandinitials,
    string $primarycolor,
    string $accentcolor,
    string $surfacecolor,
    string $heroimage,
    string $headline,
    string $subtitle,
    string $bodycopy,
    string $initialcourses
): void {
    global $DB;
    if ($consumerid <= 0 || !array_key_exists($status, pqpc_status_options())) {
        throw new invalid_parameter_exception('Choose a valid consumer status.');
    }
    if (!array_key_exists($consumertype, pqhi_consumer_type_options()) && $consumertype !== 'platform_foundation') {
        throw new invalid_parameter_exception('Choose a valid consumer type.');
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
    if (!$consumer) {
        throw new invalid_parameter_exception('Consumer was not found.');
    }
    $name = trim($name);
    $slug = pqhi_clean_slug($slug);
    if ($name === '' || $slug === '') {
        throw new invalid_parameter_exception('Consumer name and slug are required.');
    }
    if (!pqhi_consumer_slug_available($slug, $consumerid)) {
        throw new invalid_parameter_exception('Consumer slug is already used.');
    }
    $consumer->name = $name;
    $consumer->slug = $slug;
    $consumer->consumer_type = $consumertype;
    $consumer->status = $status;
    $supportemail = clean_param(trim($supportemail), PARAM_EMAIL);
    if ($supportemail !== '' && !validate_email($supportemail)) {
        throw new invalid_parameter_exception('Support email is not valid.');
    }
    if ($supportemail !== '') {
        $consumer->supportemail = $supportemail;
        $consumer->emailreplyto = $supportemail;
    }
    $consumer->defaultpublicpath = pqpc_clean_local_path($publicpath, (string)($consumer->defaultpublicpath ?? '/'));
    $consumer->defaultdashboardpath = pqpc_clean_local_path($dashboardpath, (string)($consumer->defaultdashboardpath ?? '/local/hubredirect/dashboard.php'));
    $oldcopy = pqhi_json_array((string)($consumer->copyjson ?? ''));
    $consumer->logourl = pqhi_clean_url($logourl);
    $theme = pqhi_default_theme([
        'primary_color' => $primarycolor,
        'accent_color' => $accentcolor,
        'surface_color' => $surfacecolor,
    ]);
    $copy = pqhi_default_copy($name, [
        'brand_initials' => $brandinitials,
        'landing_headline' => $headline,
        'landing_subtitle' => $subtitle,
        'landing_body' => $bodycopy,
        'hero_image_url' => $heroimage,
        'initial_courses' => $initialcourses,
    ]);
    if (!empty($oldcopy['default_login_path'])) {
        $copy['default_login_path'] = (string)$oldcopy['default_login_path'];
    }
    $consumer->themejson = json_encode($theme, JSON_UNESCAPED_SLASHES);
    $consumer->copyjson = json_encode($copy, JSON_UNESCAPED_SLASHES);
    if (pqh_table_has_field_safe('local_prequran_consumer', 'timemodified')) {
        $consumer->timemodified = time();
    }
    $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $consumer));
}

function pqpc_link_workspace(int $consumerid, int $workspaceid, int $ownerid): void {
    global $DB;
    if ($consumerid <= 0 || $workspaceid <= 0) {
        throw new invalid_parameter_exception('Choose a consumer and workspace to link.');
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    if (!$consumer || !$workspace) {
        throw new invalid_parameter_exception('Consumer or workspace was not found.');
    }
    $consumer->primaryworkspaceid = $workspaceid;
    if ($ownerid > 0) {
        $consumer->owneruserid = $ownerid;
    }
    if (pqh_table_has_field_safe('local_prequran_consumer', 'timemodified')) {
        $consumer->timemodified = time();
    }
    $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $consumer));
}

function pqpc_create_workspace_for_consumer(int $consumerid, int $ownerid): int {
    global $DB, $USER;
    if ($consumerid <= 0) {
        throw new invalid_parameter_exception('Choose a consumer before creating a workspace.');
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
    if (!$consumer) {
        throw new invalid_parameter_exception('Consumer was not found.');
    }
    $ownerid = $ownerid > 0 ? $ownerid : (int)($consumer->owneruserid ?? 0);
    if ($ownerid <= 0) {
        $ownerid = (int)$USER->id;
    }
    $workspaceid = pqhi_create_workspace_for_consumer(
        (string)$consumer->name,
        (string)$consumer->slug,
        (string)$consumer->consumer_type,
        $ownerid,
        ['created_from' => 'platform_consumers'],
        (int)$USER->id
    );
    pqpc_link_workspace($consumerid, $workspaceid, $ownerid);
    pqhi_upsert_workspace_member($workspaceid, $ownerid, 'owner', (int)$USER->id, 'Linked by platform consumer manager.');
    pqhi_upsert_workspace_member($workspaceid, $ownerid, 'admin', (int)$USER->id, 'Linked by platform consumer manager.');
    return $workspaceid;
}

function pqpc_update_domain(int $domainid, string $status, string $domaintype, int $isprimary): void {
    global $DB;
    if ($domainid <= 0 || !array_key_exists($status, pqpc_domain_status_options()) || !array_key_exists($domaintype, pqpc_domain_type_options())) {
        throw new invalid_parameter_exception('Choose valid domain settings.');
    }
    $domain = $DB->get_record('local_prequran_consumer_domain', ['id' => $domainid], '*', IGNORE_MISSING);
    if (!$domain) {
        throw new invalid_parameter_exception('Domain row was not found.');
    }
    if ($isprimary === 1) {
        $DB->set_field('local_prequran_consumer_domain', 'isprimary', 0, [
            'consumerid' => (int)$domain->consumerid,
            'domain_type' => $domaintype,
        ]);
    }
    $domain->status = $status;
    $domain->domain_type = $domaintype;
    $domain->isprimary = $isprimary;
    if (pqh_table_has_field_safe('local_prequran_consumer_domain', 'timemodified')) {
        $domain->timemodified = time();
    }
    $DB->update_record('local_prequran_consumer_domain', pqhi_record_for_existing_columns('local_prequran_consumer_domain', $domain));
}

function pqpc_add_domain(int $consumerid, int $workspaceid, string $domain, string $domaintype, int $isprimary): void {
    global $DB, $USER;
    if ($consumerid <= 0 || $workspaceid <= 0 || !array_key_exists($domaintype, pqpc_domain_type_options())) {
        throw new invalid_parameter_exception('Choose valid domain settings.');
    }
    if ($isprimary === 1) {
        $DB->set_field('local_prequran_consumer_domain', 'isprimary', 0, [
            'consumerid' => $consumerid,
            'domain_type' => $domaintype,
        ]);
    }
    pqhi_upsert_consumer_domain($consumerid, $workspaceid, $domain, $domaintype, $isprimary, (int)$USER->id);
}

function pqpc_consumer_rows(): array {
    global $DB;
    if (!pqh_consumer_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.slug, c.name, c.consumer_type, c.status, c.primaryworkspaceid, c.owneruserid,
                c.supportemail, c.emailfromname, c.emailreplyto, c.defaultpublicpath, c.defaultdashboardpath,
                c.logourl, c.themejson, c.copyjson, c.timemodified,
                w.name AS workspacename, w.slug AS workspaceslug, w.status AS workspacestatus,
                w.workspace_type, w.ownerid
           FROM {local_prequran_consumer} c
      LEFT JOIN {local_prequran_workspace} w ON w.id = c.primaryworkspaceid
          WHERE c.consumer_type <> :foundation
       ORDER BY c.status ASC, c.name ASC",
        ['foundation' => 'platform_foundation']
    ));
}

function pqpc_domains_by_consumer(array $consumers): array {
    global $DB;
    if (!$consumers || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    $ids = array_map(static fn($row): int => (int)$row->id, $consumers);
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'consumer');
    $rows = $DB->get_records_select('local_prequran_consumer_domain', "consumerid {$insql}", $params, 'consumerid ASC, domain_type ASC, isprimary DESC, domain ASC');
    $grouped = [];
    foreach ($rows as $row) {
        $grouped[(int)$row->consumerid][] = $row;
    }
    return $grouped;
}

function pqpc_workspace_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_values($DB->get_records_select(
        'local_prequran_workspace',
        "status <> ?",
        ['archived'],
        'name ASC',
        'id,name,slug,workspace_type,status,ownerid'
    ));
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the platform consumers page and try again.',
            new moodle_url('/local/hubredirect/platform_consumers.php'),
            'Platform consumer form expired'
        );
    }
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'update_consumer') {
            pqpc_update_consumer(
                optional_param('consumerid', 0, PARAM_INT),
                optional_param('consumer_name', '', PARAM_TEXT),
                optional_param('consumer_slug', '', PARAM_TEXT),
                optional_param('consumer_type', 'institution', PARAM_ALPHANUMEXT),
                optional_param('consumer_status', 'active', PARAM_ALPHANUMEXT),
                optional_param('supportemail', '', PARAM_EMAIL),
                optional_param('defaultpublicpath', '/', PARAM_LOCALURL),
                optional_param('defaultdashboardpath', '/local/hubredirect/dashboard.php', PARAM_LOCALURL),
                optional_param('logourl', '', PARAM_TEXT),
                optional_param('brandinitials', '', PARAM_TEXT),
                optional_param('primarycolor', '#2f6f4e', PARAM_TEXT),
                optional_param('accentcolor', '#d99a26', PARAM_TEXT),
                optional_param('surfacecolor', '#f4f8fb', PARAM_TEXT),
                optional_param('heroimage', '', PARAM_TEXT),
                optional_param('headline', '', PARAM_TEXT),
                optional_param('subtitle', '', PARAM_TEXT),
                optional_param('bodycopy', '', PARAM_TEXT),
                optional_param('initialcourses', '', PARAM_TEXT)
            );
            $updateworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
            if ($updateworkspaceid > 0) {
                pqpc_update_workspace(
                    $updateworkspaceid,
                    optional_param('workspace_status', 'active', PARAM_ALPHANUMEXT)
                );
            }
            $message = 'Consumer settings and workspace status updated.';
        } else if ($action === 'update_domain') {
            pqpc_update_domain(
                optional_param('domainid', 0, PARAM_INT),
                optional_param('domain_status', 'active', PARAM_ALPHANUMEXT),
                optional_param('domain_type', 'public', PARAM_ALPHANUMEXT),
                optional_param('isprimary', 0, PARAM_INT)
            );
            $message = 'Domain updated.';
        } else if ($action === 'add_domain') {
            pqpc_add_domain(
                optional_param('consumerid', 0, PARAM_INT),
                optional_param('workspaceid', 0, PARAM_INT),
                optional_param('domain', '', PARAM_HOST),
                optional_param('domain_type', 'public', PARAM_ALPHANUMEXT),
                optional_param('isprimary', 0, PARAM_INT)
            );
            $message = 'Domain added or refreshed.';
        } else if ($action === 'link_workspace') {
            pqpc_link_workspace(
                optional_param('consumerid', 0, PARAM_INT),
                optional_param('linkworkspaceid', 0, PARAM_INT),
                optional_param('owneruserid', 0, PARAM_INT)
            );
            $message = 'Primary workspace linked.';
        } else if ($action === 'create_workspace') {
            $workspaceid = pqpc_create_workspace_for_consumer(
                optional_param('consumerid', 0, PARAM_INT),
                optional_param('owneruserid', 0, PARAM_INT)
            );
            $message = 'Workspace #' . $workspaceid . ' created and linked.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$consumers = pqpc_consumer_rows();
$domains = pqpc_domains_by_consumer($consumers);
$workspaceoptions = pqpc_workspace_options();

echo $OUTPUT->header();
?>
<style>
body.pqpc-page header,body.pqpc-page footer,body.pqpc-page nav.navbar,body.pqpc-page #page-header,body.pqpc-page #page-footer,body.pqpc-page .drawer,body.pqpc-page .drawer-toggles,body.pqpc-page .block-region,body.pqpc-page [data-region="drawer"],body.pqpc-page [data-region="right-hand-drawer"]{display:none!important}
body.pqpc-page #page,body.pqpc-page #page-content,body.pqpc-page #region-main,body.pqpc-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpc-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqpc-wrap{max-width:1320px;margin:0 auto}.pqpc-top,.pqpc-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqpc-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqpc-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqpc-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqpc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqpc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 11px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:12px;font-weight:950;cursor:pointer}.pqpc-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqpc-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqpc-alert--ok{background:#edf9ef;color:#245c35}.pqpc-alert--bad{background:#fff0ed;color:#883526}.pqpc-consumer{display:grid;gap:12px;margin-bottom:14px}.pqpc-row{display:grid;grid-template-columns:minmax(260px,1fr) minmax(440px,1.4fr);gap:12px}.pqpc-card{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqpc-card h2{margin:0 0 8px;color:#221b22;font-size:19px;font-weight:950}.pqpc-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqpc-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqpc-formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pqpc-field{display:grid;gap:4px;margin-bottom:8px}.pqpc-field label{font-size:11px;font-weight:950;color:#415665;text-transform:uppercase}.pqpc-input,.pqpc-select,.pqpc-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:12px;font-weight:800;box-sizing:border-box}.pqpc-input,.pqpc-select{min-height:34px;padding:0 9px}.pqpc-textarea{min-height:68px;padding:8px 9px;line-height:1.45}.pqpc-domain{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;padding:10px 0;border-bottom:1px solid rgba(23,48,68,.1)}.pqpc-domain:last-child{border-bottom:0}.pqpc-domain-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.pqpc-empty{padding:14px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
@media(max-width:980px){.pqpc-top,.pqpc-row,.pqpc-formgrid,.pqpc-domain{grid-template-columns:1fr}.pqpc-actions,.pqpc-domain-actions{justify-content:flex-start}}
</style>
<main class="pqpc-shell">
  <div class="pqpc-wrap">
    <section class="pqpc-top">
      <div>
        <h1 class="pqpc-title">Platform Consumer Management</h1>
        <p class="pqpc-sub">Foundation controls for academy, marketplace, institution, and teacher consumer apps, domains, workspace status, and debug links.</p>
      </div>
      <nav class="pqpc-actions">
        <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Dashboard</a>
        <a class="pqpc-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_wizard.php'))->out(false); ?>">Create consumer</a>
        <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false); ?>">Institution wizard</a>
        <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/platform_diagnostics.php'))->out(false); ?>">Diagnostics</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqpc-alert pqpc-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqpc-alert pqpc-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$consumers): ?>
      <div class="pqpc-empty">No consumer apps found yet.</div>
    <?php else: ?>
      <section class="pqpc-consumer">
        <?php foreach ($consumers as $consumer): ?>
          <?php
          $workspaceid = (int)$consumer->primaryworkspaceid;
          $params = ['consumer' => (string)$consumer->slug, 'workspaceid' => $workspaceid];
          $consumerdomains = $domains[(int)$consumer->id] ?? [];
          $theme = pqhi_default_theme(pqhi_json_array((string)($consumer->themejson ?? '')));
          $copy = pqhi_default_copy((string)$consumer->name, pqhi_json_array((string)($consumer->copyjson ?? '')));
          $heroimage = pqh_consumer_hero_image_url($consumer);
          ?>
          <article class="pqpc-row">
            <div class="pqpc-card">
              <h2><?php echo s((string)$consumer->name); ?></h2>
              <span class="pqpc-pill"><?php echo s((string)$consumer->slug); ?></span>
              <span class="pqpc-pill">type: <?php echo s((string)$consumer->consumer_type); ?></span>
              <span class="pqpc-pill">consumer: <?php echo s((string)$consumer->status); ?></span>
              <span class="pqpc-pill">workspace: <?php echo s((string)($consumer->workspacestatus ?? 'missing')); ?></span>
              <span class="pqpc-muted">Workspace #<?php echo $workspaceid; ?> / <?php echo s((string)($consumer->workspacename ?? 'missing')); ?></span>
              <span class="pqpc-muted">Support: <?php echo s((string)$consumer->supportemail); ?></span>
              <div class="pqpc-actions" style="justify-content:flex-start;margin-top:10px">
                <?php if ($workspaceid > 0): ?>
                  <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_settings.php', $params))->out(false); ?>">Settings</a>
                  <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $params))->out(false); ?>">Workspace</a>
                  <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_profile.php', $params))->out(false); ?>">Profile</a>
                <?php else: ?>
                  <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false); ?>">Create workspace</a>
                <?php endif; ?>
                <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => (string)$consumer->slug] + ($workspaceid > 0 ? ['workspaceid' => $workspaceid] : [])))->out(false); ?>">Landing</a>
                <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/consumer_diagnostics.php', ['consumer' => (string)$consumer->slug]))->out(false); ?>">Consumer diagnostics</a>
                <a class="pqpc-btn pqpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/consumer_probe.php', ['consumer' => (string)$consumer->slug]))->out(false); ?>">Probe</a>
              </div>
              <form method="post" style="margin-top:12px">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="update_consumer">
                <input type="hidden" name="consumerid" value="<?php echo (int)$consumer->id; ?>">
                <input type="hidden" name="workspaceid" value="<?php echo $workspaceid; ?>">
                <div class="pqpc-formgrid">
                  <div class="pqpc-field"><label>Name</label><input class="pqpc-input" name="consumer_name" value="<?php echo s((string)$consumer->name); ?>"></div>
                  <div class="pqpc-field"><label>Slug</label><input class="pqpc-input" name="consumer_slug" value="<?php echo s((string)$consumer->slug); ?>"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Consumer type</label><select class="pqpc-select" name="consumer_type"><?php foreach (pqhi_consumer_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)$consumer->consumer_type === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
                  <div class="pqpc-field"><label>Consumer status</label><select class="pqpc-select" name="consumer_status"><?php foreach (pqpc_status_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)$consumer->status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
                  <div class="pqpc-field"><label>Workspace status</label><select class="pqpc-select" name="workspace_status"><?php foreach (pqpc_status_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)($consumer->workspacestatus ?? '') === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Support email</label><input class="pqpc-input" name="supportemail" value="<?php echo s((string)$consumer->supportemail); ?>"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Logo URL</label><input class="pqpc-input" name="logourl" value="<?php echo s((string)($consumer->logourl ?? '')); ?>" placeholder="https://app.eduplatform.ai/... or /local/..."></div>
                  <div class="pqpc-field"><label>Initials</label><input class="pqpc-input" name="brandinitials" value="<?php echo s((string)$copy['brand_initials']); ?>" maxlength="6"></div>
                  <div class="pqpc-field"><label>Primary color</label><input class="pqpc-input" name="primarycolor" value="<?php echo s((string)$theme['primary_color']); ?>" placeholder="#2f6f4e"></div>
                  <div class="pqpc-field"><label>Accent color</label><input class="pqpc-input" name="accentcolor" value="<?php echo s((string)$theme['accent_color']); ?>" placeholder="#d99a26"></div>
                  <div class="pqpc-field"><label>Surface color</label><input class="pqpc-input" name="surfacecolor" value="<?php echo s((string)$theme['surface_color']); ?>" placeholder="#f4f8fb"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Hero image URL</label><input class="pqpc-input" name="heroimage" value="<?php echo s((string)$copy['hero_image_url']); ?>" placeholder="https://app.eduplatform.ai/consumers/example/hero.jpg"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Effective hero</label><input class="pqpc-input" value="<?php echo s($heroimage); ?>" readonly></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Landing headline</label><input class="pqpc-input" name="headline" value="<?php echo s((string)$copy['landing_headline']); ?>"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Landing subtitle</label><textarea class="pqpc-textarea" name="subtitle"><?php echo s((string)$copy['landing_subtitle']); ?></textarea></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Landing body</label><textarea class="pqpc-textarea" name="bodycopy"><?php echo s((string)$copy['landing_body']); ?></textarea></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Initial courses</label><input class="pqpc-input" name="initialcourses" value="<?php echo s((string)$copy['initial_courses']); ?>" placeholder="Pre-Quraan, Level 1"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Default public path</label><input class="pqpc-input" name="defaultpublicpath" value="<?php echo s((string)$consumer->defaultpublicpath); ?>" placeholder="/local/hubredirect/consumer_landing.php"></div>
                  <div class="pqpc-field" style="grid-column:1/-1"><label>Default dashboard path</label><input class="pqpc-input" name="defaultdashboardpath" value="<?php echo s((string)$consumer->defaultdashboardpath); ?>" placeholder="/local/hubredirect/workspace_dashboard.php"></div>
                </div>
                <button class="pqpc-btn" type="submit">Save consumer</button>
              </form>
              <div style="display:grid;gap:8px;margin-top:12px">
                <form method="post">
                  <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                  <input type="hidden" name="action" value="link_workspace">
                  <input type="hidden" name="consumerid" value="<?php echo (int)$consumer->id; ?>">
                  <div class="pqpc-formgrid">
                    <div class="pqpc-field"><label>Primary workspace</label><select class="pqpc-select" name="linkworkspaceid">
                      <option value="0">Choose workspace</option>
                      <?php foreach ($workspaceoptions as $workspaceoption): ?>
                        <option value="<?php echo (int)$workspaceoption->id; ?>" <?php echo (int)$workspaceoption->id === $workspaceid ? 'selected' : ''; ?>>#<?php echo (int)$workspaceoption->id; ?> <?php echo s((string)$workspaceoption->name); ?> (<?php echo s((string)$workspaceoption->workspace_type); ?>)</option>
                      <?php endforeach; ?>
                    </select></div>
                    <div class="pqpc-field"><label>Owner user ID</label><input class="pqpc-input" name="owneruserid" value="<?php echo (int)($consumer->owneruserid ?: ($consumer->ownerid ?? 0)); ?>"></div>
                  </div>
                  <button class="pqpc-btn pqpc-btn--light" type="submit">Link workspace</button>
                </form>
                <?php if ($workspaceid <= 0): ?>
                  <form method="post">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="create_workspace">
                    <input type="hidden" name="consumerid" value="<?php echo (int)$consumer->id; ?>">
                    <input type="hidden" name="owneruserid" value="<?php echo (int)$USER->id; ?>">
                    <button class="pqpc-btn" type="submit">Create workspace for this consumer</button>
                  </form>
                <?php endif; ?>
              </div>
            </div>
            <div class="pqpc-card">
              <h2>Domains</h2>
              <?php if (!$consumerdomains): ?><div class="pqpc-empty">No domains linked.</div><?php endif; ?>
              <?php foreach ($consumerdomains as $domain): ?>
                <div class="pqpc-domain">
                  <div>
                    <strong><?php echo s((string)$domain->domain); ?></strong>
                    <span class="pqpc-muted"><?php echo s((string)$domain->domain_type); ?> / <?php echo s((string)$domain->status); ?><?php echo (int)$domain->isprimary === 1 ? ' / primary' : ''; ?></span>
                    <span class="pqpc-muted">SSL: <?php echo s((string)$domain->sslstatus); ?> / verification: <?php echo s((string)$domain->verificationstatus); ?></span>
                  </div>
                  <form class="pqpc-domain-actions" method="post">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="update_domain">
                    <input type="hidden" name="domainid" value="<?php echo (int)$domain->id; ?>">
                    <select class="pqpc-select" name="domain_type"><?php foreach (pqpc_domain_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)$domain->domain_type === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select>
                    <select class="pqpc-select" name="domain_status"><?php foreach (pqpc_domain_status_options() as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo (string)$domain->status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select>
                    <label class="pqpc-pill"><input type="checkbox" name="isprimary" value="1" <?php echo (int)$domain->isprimary === 1 ? 'checked' : ''; ?>> Primary <?php echo s((string)$domain->domain_type); ?></label>
                    <button class="pqpc-btn pqpc-btn--light" type="submit">Update</button>
                  </form>
                </div>
              <?php endforeach; ?>
              <?php if ($workspaceid > 0): ?>
                <form method="post" style="margin-top:12px">
                  <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                  <input type="hidden" name="action" value="add_domain">
                  <input type="hidden" name="consumerid" value="<?php echo (int)$consumer->id; ?>">
                  <input type="hidden" name="workspaceid" value="<?php echo $workspaceid; ?>">
                  <div class="pqpc-formgrid">
                    <div class="pqpc-field"><label>New domain</label><input class="pqpc-input" name="domain" placeholder="school.example.org"></div>
                    <div class="pqpc-field"><label>Type</label><select class="pqpc-select" name="domain_type"><?php foreach (pqpc_domain_type_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
                  </div>
                  <label class="pqpc-pill"><input type="checkbox" name="isprimary" value="1"> Make primary</label>
                  <button class="pqpc-btn" type="submit">Add domain</button>
                </form>
              <?php else: ?>
                <div class="pqpc-empty" style="margin-top:12px">Create or link a primary workspace before adding more domains.</div>
              <?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
