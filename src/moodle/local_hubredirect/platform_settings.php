<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

pqh_require_platform_operations('Only platform administrators can manage EduPlatform foundation settings.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_settings.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('EduPlatform Settings');
$PAGE->set_heading('EduPlatform Settings');
$PAGE->add_body_class('pqps-page');

function pqps_clean_local_path(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '') {
        return $fallback;
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new invalid_parameter_exception('Choose a local Moodle path such as /local/hubredirect/platform_landing.php.');
    }
    return $path;
}

function pqps_json_array(string $json): array {
    if (trim($json) === '') {
        return [];
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqps_clean_initials(string $initials, string $fallback): string {
    $initials = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $initials) ?? '');
    if ($initials === '') {
        $initials = $fallback;
    }
    return substr($initials, 0, 4);
}

function pqps_clean_hex_color(string $color, string $fallback): string {
    $color = trim($color);
    if ($color === '') {
        return $fallback;
    }
    if ($color[0] !== '#') {
        $color = '#' . $color;
    }
    return preg_match('/^#[0-9a-fA-F]{6}$/', $color) ? strtolower($color) : $fallback;
}

function pqps_clean_logo_url(string $url): string {
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if ($url[0] === '/') {
        return clean_param($url, PARAM_LOCALURL);
    }
    $url = clean_param($url, PARAM_URL);
    return preg_match('/^https:\/\//i', $url) ? $url : '';
}

function pqps_foundation_consumer(): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer')) {
        return null;
    }
    return $DB->get_record('local_prequran_consumer', ['slug' => 'eduplatform'], '*', IGNORE_MISSING) ?: null;
}

function pqps_foundation_domains(int $consumerid): array {
    global $DB;
    if ($consumerid <= 0 || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_consumer_domain', ['consumerid' => $consumerid], 'isprimary DESC, domain ASC'));
}

function pqps_update_foundation_consumer(stdClass $consumer): void {
    global $DB;

    $supportemail = trim(optional_param('supportemail', '', PARAM_EMAIL));
    if ($supportemail !== '' && !validate_email($supportemail)) {
        throw new invalid_parameter_exception('Enter a valid support email address.');
    }

    $replyto = trim(optional_param('emailreplyto', '', PARAM_EMAIL));
    if ($replyto !== '' && !validate_email($replyto)) {
        throw new invalid_parameter_exception('Enter a valid reply-to email address.');
    }

    $fromname = trim(optional_param('emailfromname', 'EduPlatform', PARAM_TEXT));
    $consumer->name = trim(optional_param('name', 'EduPlatform', PARAM_TEXT)) ?: 'EduPlatform';
    $consumer->supportemail = $supportemail;
    $consumer->emailfromname = $fromname !== '' ? $fromname : 'EduPlatform';
    $consumer->emailreplyto = $replyto !== '' ? $replyto : $supportemail;
    $consumer->defaultpublicpath = pqps_clean_local_path(
        optional_param('defaultpublicpath', '/local/hubredirect/platform_landing.php', PARAM_RAW_TRIMMED),
        '/local/hubredirect/platform_landing.php'
    );
    $consumer->defaultdashboardpath = pqps_clean_local_path(
        optional_param('defaultdashboardpath', '/local/hubredirect/platform_dashboard.php', PARAM_RAW_TRIMMED),
        '/local/hubredirect/platform_dashboard.php'
    );

    $copy = pqps_json_array((string)($consumer->copyjson ?? ''));
    $copy['brand_initials'] = pqps_clean_initials(optional_param('brand_initials', 'EP', PARAM_RAW_TRIMMED), 'EP');
    $copy['logo_url'] = pqps_clean_logo_url(optional_param('logo_url', '', PARAM_RAW_TRIMMED));
    $copy['default_login_path'] = pqps_clean_local_path(
        optional_param('defaultloginpath', '/local/hubredirect/consumer_login.php', PARAM_RAW_TRIMMED),
        '/local/hubredirect/consumer_login.php'
    );
    $consumer->copyjson = json_encode($copy);

    $theme = pqps_json_array((string)($consumer->themejson ?? ''));
    $theme['primary_color'] = pqps_clean_hex_color(optional_param('primary_color', '#2f6f4e', PARAM_RAW_TRIMMED), '#2f6f4e');
    $theme['accent_color'] = pqps_clean_hex_color(optional_param('accent_color', '#d6a642', PARAM_RAW_TRIMMED), '#d6a642');
    $theme['surface_color'] = pqps_clean_hex_color(optional_param('surface_color', '#f5f8fb', PARAM_RAW_TRIMMED), '#f5f8fb');
    $consumer->themejson = json_encode($theme);

    if (pqh_table_has_field_safe('local_prequran_consumer', 'timemodified')) {
        $consumer->timemodified = time();
    }

    $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $consumer));
}

$consumer = pqps_foundation_consumer();
if (!$consumer) {
    pqh_access_denied(
        'The EduPlatform foundation consumer has not been seeded yet.',
        'Foundation settings unavailable',
        new moodle_url('/local/hubredirect/platform_dashboard.php')
    );
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Your session expired before the settings could be saved.',
            'Settings not saved',
            new moodle_url('/local/hubredirect/platform_settings.php')
        );
    }
    try {
        pqps_update_foundation_consumer($consumer);
        $consumer = pqps_foundation_consumer();
        $message = 'EduPlatform foundation settings updated.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$domains = pqps_foundation_domains((int)$consumer->id);
$copy = pqps_json_array((string)($consumer->copyjson ?? ''));
$theme = pqps_json_array((string)($consumer->themejson ?? ''));
$brandinitials = pqps_clean_initials((string)($copy['brand_initials'] ?? 'EP'), 'EP');
$logourl = pqps_clean_logo_url((string)($copy['logo_url'] ?? ''));
$defaultloginpath = pqps_clean_local_path((string)($copy['default_login_path'] ?? '/local/hubredirect/consumer_login.php'), '/local/hubredirect/consumer_login.php');
$primarycolor = pqps_clean_hex_color((string)($theme['primary_color'] ?? '#2f6f4e'), '#2f6f4e');
$accentcolor = pqps_clean_hex_color((string)($theme['accent_color'] ?? '#d6a642'), '#d6a642');
$surfacecolor = pqps_clean_hex_color((string)($theme['surface_color'] ?? '#f5f8fb'), '#f5f8fb');
$landingurl = new moodle_url('/local/hubredirect/platform_landing.php');
$dashboardurl = new moodle_url('/local/hubredirect/platform_dashboard.php');
$consumersurl = new moodle_url('/local/hubredirect/platform_consumers.php');
$diagnosticsurl = new moodle_url('/local/hubredirect/consumer_diagnostics.php');

echo $OUTPUT->header();
?>
<style>
body.pqps-page header,body.pqps-page footer,body.pqps-page nav.navbar,body.pqps-page #page-header,body.pqps-page #page-footer,body.pqps-page .drawer,body.pqps-page .drawer-toggles,body.pqps-page .block-region,body.pqps-page [data-region="drawer"],body.pqps-page [data-region="right-hand-drawer"]{display:none!important}
body.pqps-page #page,body.pqps-page #page-content,body.pqps-page #region-main,body.pqps-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqps-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqps-wrap{max-width:1120px;margin:0 auto}.pqps-top,.pqps-card,.pqps-panel{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqps-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#eaffea 0%,#fff 62%,#fff7e7 100%)}.pqps-brand{display:flex;align-items:center;gap:12px}.pqps-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:#2f6f4e;color:#fff;font-weight:950}.pqps-title{margin:0;color:#221b22;font-size:32px;line-height:1.05;font-weight:950}.pqps-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqps-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqps-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:12px;font-weight:950}.pqps-btn--gold{background:#d6a642;border-color:#d6a642;color:#211b12!important}.pqps-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:14px}.pqps-panel{padding:18px}.pqps-panel h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950}.pqps-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pqps-field{display:grid;gap:6px}.pqps-field--wide{grid-column:1/-1}.pqps-field label{font-size:12px;font-weight:950;text-transform:uppercase;color:#586b78}.pqps-field input{width:100%;min-height:44px;border:1px solid rgba(23,48,68,.14);border-radius:8px;padding:0 12px;color:#173044;font-weight:850}.pqps-message,.pqps-error{margin:0 0 14px;padding:12px 14px;border-radius:8px;font-weight:900}.pqps-message{background:#e8f8ec;color:#245b35}.pqps-error{background:#fff0ed;color:#883526}.pqps-domain{padding:12px 0;border-bottom:1px solid rgba(23,48,68,.1)}.pqps-domain:last-child{border-bottom:0}.pqps-domain strong{display:block;color:#221b22}.pqps-meta{display:block;margin-top:4px;color:#667886;font-size:12px;font-weight:850}.pqps-pill{display:inline-flex;min-height:24px;align-items:center;margin-top:7px;margin-right:5px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:11px;font-weight:950}.pqps-help{margin:0;color:#5e7280;font-size:13px;line-height:1.5;font-weight:750}.pqps-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}
@media(max-width:900px){.pqps-top,.pqps-layout,.pqps-grid{grid-template-columns:1fr}.pqps-actions{justify-content:flex-start}.pqps-title{font-size:26px}}
</style>
<main class="pqps-shell" style="background: <?php echo s($surfacecolor); ?>">
  <div class="pqps-wrap">
    <section class="pqps-top">
      <div class="pqps-brand">
        <span class="pqps-mark" style="background: <?php echo s($primarycolor); ?>"><?php echo $logourl !== '' ? '<img alt="" src="' . s($logourl) . '" style="max-width:34px;max-height:34px;border-radius:8px">' : s($brandinitials); ?></span>
        <div>
          <h1 class="pqps-title">EduPlatform Settings</h1>
          <p class="pqps-sub">Foundation identity, support routing, and default entry paths.</p>
        </div>
      </div>
      <nav class="pqps-actions">
        <a class="pqps-btn" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
        <a class="pqps-btn" href="<?php echo $consumersurl->out(false); ?>">Consumers</a>
        <a class="pqps-btn" href="<?php echo $landingurl->out(false); ?>">Landing</a>
        <a class="pqps-btn" href="<?php echo $diagnosticsurl->out(false); ?>">Diagnostics</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><p class="pqps-message"><?php echo s($message); ?></p><?php endif; ?>
    <?php if ($error !== ''): ?><p class="pqps-error"><?php echo s($error); ?></p><?php endif; ?>

    <div class="pqps-layout">
      <section class="pqps-panel">
        <h2>Foundation Profile</h2>
        <form method="post" action="<?php echo (new moodle_url('/local/hubredirect/platform_settings.php'))->out(false); ?>">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <div class="pqps-grid">
            <div class="pqps-field">
              <label for="pqps-name">Foundation name</label>
              <input id="pqps-name" name="name" type="text" value="<?php echo s((string)$consumer->name); ?>" maxlength="255">
            </div>
            <div class="pqps-field">
              <label for="pqps-from">Email from name</label>
              <input id="pqps-from" name="emailfromname" type="text" value="<?php echo s((string)($consumer->emailfromname ?? 'EduPlatform')); ?>" maxlength="255">
            </div>
            <div class="pqps-field">
              <label for="pqps-initials">Platform initials</label>
              <input id="pqps-initials" name="brand_initials" type="text" value="<?php echo s($brandinitials); ?>" maxlength="4">
            </div>
            <div class="pqps-field">
              <label for="pqps-logo">Logo URL</label>
              <input id="pqps-logo" name="logo_url" type="text" value="<?php echo s($logourl); ?>" maxlength="255" placeholder="/local/hubredirect/pix/logo.png or https://...">
            </div>
            <div class="pqps-field">
              <label for="pqps-support">Support email</label>
              <input id="pqps-support" name="supportemail" type="email" value="<?php echo s((string)($consumer->supportemail ?? '')); ?>" maxlength="255">
            </div>
            <div class="pqps-field">
              <label for="pqps-reply">Reply-to email</label>
              <input id="pqps-reply" name="emailreplyto" type="email" value="<?php echo s((string)($consumer->emailreplyto ?? '')); ?>" maxlength="255">
            </div>
            <div class="pqps-field">
              <label for="pqps-primary">Primary color</label>
              <input id="pqps-primary" name="primary_color" type="text" value="<?php echo s($primarycolor); ?>" maxlength="7">
            </div>
            <div class="pqps-field">
              <label for="pqps-accent">Accent color</label>
              <input id="pqps-accent" name="accent_color" type="text" value="<?php echo s($accentcolor); ?>" maxlength="7">
            </div>
            <div class="pqps-field pqps-field--wide">
              <label for="pqps-surface">Surface color</label>
              <input id="pqps-surface" name="surface_color" type="text" value="<?php echo s($surfacecolor); ?>" maxlength="7">
            </div>
            <div class="pqps-field pqps-field--wide">
              <label for="pqps-login">Default login path</label>
              <input id="pqps-login" name="defaultloginpath" type="text" value="<?php echo s($defaultloginpath); ?>" maxlength="255">
            </div>
            <div class="pqps-field pqps-field--wide">
              <label for="pqps-public">Default public path</label>
              <input id="pqps-public" name="defaultpublicpath" type="text" value="<?php echo s((string)($consumer->defaultpublicpath ?? '/local/hubredirect/platform_landing.php')); ?>" maxlength="255">
            </div>
            <div class="pqps-field pqps-field--wide">
              <label for="pqps-dashboard">Default dashboard path</label>
              <input id="pqps-dashboard" name="defaultdashboardpath" type="text" value="<?php echo s((string)($consumer->defaultdashboardpath ?? '/local/hubredirect/platform_dashboard.php')); ?>" maxlength="255">
            </div>
          </div>
          <p class="pqps-help" style="margin:12px 0 14px">Use local Moodle paths only. External URLs are intentionally blocked here so host routing stays inside the shared platform.</p>
          <button class="pqps-btn pqps-btn--gold" type="submit">Save settings</button>
        </form>
      </section>

      <aside class="pqps-panel">
        <h2>Foundation Domains</h2>
        <?php if (!$domains): ?>
          <div class="pqps-empty">No EduPlatform domains are registered yet.</div>
        <?php else: ?>
          <?php foreach ($domains as $domain): ?>
            <div class="pqps-domain">
              <strong><?php echo s((string)$domain->domain); ?></strong>
              <span class="pqps-meta"><?php echo s((string)$domain->domain_type); ?><?php echo (int)$domain->isprimary === 1 ? ' / primary' : ''; ?></span>
              <span class="pqps-pill"><?php echo s((string)$domain->status); ?></span>
              <span class="pqps-pill">SSL <?php echo s((string)($domain->sslstatus ?? 'not_checked')); ?></span>
              <span class="pqps-pill"><?php echo s((string)($domain->verificationstatus ?? 'unknown')); ?></span>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
        <p class="pqps-help" style="margin-top:12px">Domains should be shared-root aliases for the Moodle document root. SSL status is informational here; AutoSSL can show as pending or not checked while the certificate is still being issued.</p>
      </aside>
    </div>
  </div>
</main>
<?php
echo $OUTPUT->footer();
