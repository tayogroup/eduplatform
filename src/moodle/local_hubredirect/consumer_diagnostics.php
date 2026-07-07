<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only platform administrators can view consumer diagnostics.',
        new moodle_url('/local/hubredirect/platform_dashboard.php'),
        'Consumer diagnostics access required'
    );
}

$testhost = optional_param('host', '', PARAM_RAW_TRIMMED);
$consumerslug = optional_param('consumer', '', PARAM_ALPHANUMEXT);
$currenthost = pqh_request_host();
$currentcontext = pqh_current_consumer_context();
$testcontext = $testhost !== '' ? pqh_resolve_consumer_context($testhost) : null;
$selectedconsumer = null;
$selecteddomains = [];

if ($consumerslug !== '' && pqh_consumer_schema_ready()) {
    $selectedconsumer = $DB->get_record('local_prequran_consumer', ['slug' => $consumerslug, 'status' => 'active'], '*', IGNORE_MISSING) ?: null;
} else if ($testcontext && !empty($testcontext->consumerid) && pqh_consumer_schema_ready()) {
    $selectedconsumer = $DB->get_record('local_prequran_consumer', ['id' => (int)$testcontext->consumerid, 'status' => 'active'], '*', IGNORE_MISSING) ?: null;
}
if ($selectedconsumer && pqh_table_exists_safe('local_prequran_consumer_domain')) {
    $selecteddomains = array_values($DB->get_records('local_prequran_consumer_domain', [
        'consumerid' => (int)$selectedconsumer->id,
        'status' => 'active',
    ], 'isprimary DESC, domain ASC'));
}

$seedhosts = [
    'eduplatform.ai',
    'www.eduplatform.ai',
    'app.eduplatform.ai',
    'quraan.academy',
    'quraantest.academy',
    'quraanacademy.info',
    'edufortomorrow.com',
    'www.edufortomorrow.com',
    'app.edufortomorrow.com',
];

$PAGE->set_context(context_system::instance());
$pageparams = [];
if ($testhost !== '') {
    $pageparams['host'] = $testhost;
}
if ($consumerslug !== '') {
    $pageparams['consumer'] = $consumerslug;
}
$PAGE->set_url(new moodle_url('/local/hubredirect/consumer_diagnostics.php', $pageparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Consumer Diagnostics');
$PAGE->set_heading('Consumer Diagnostics');
$PAGE->add_body_class('pqh-consumer-diagnostics-page');

function pqhcd_status(bool $ok): string {
    return $ok ? 'PASS' : 'FAIL';
}

function pqhcd_context_rows(stdClass $context): array {
    return [
        'consumerid' => (int)($context->consumerid ?? 0),
        'consumerslug' => (string)($context->consumerslug ?? ''),
        'consumername' => (string)($context->consumername ?? ''),
        'consumer_type' => (string)($context->consumer_type ?? ''),
        'workspaceid' => (int)($context->workspaceid ?? 0),
        'domain' => (string)($context->domain ?? ''),
        'domain_type' => (string)($context->domain_type ?? ''),
        'isprimarydomain' => (int)($context->isprimarydomain ?? 0),
        'trusted_domain' => !empty($context->trusted_domain) ? 'yes' : 'no',
        'supportemail' => (string)($context->supportemail ?? ''),
        'defaultpublicpath' => (string)($context->defaultpublicpath ?? ''),
        'defaultdashboardpath' => (string)($context->defaultdashboardpath ?? ''),
        'emailfromname' => (string)($context->emailfromname ?? ''),
        'emailreplyto' => (string)($context->emailreplyto ?? ''),
    ];
}

function pqhcd_domain_resolution_status(string $domain, int $expectedconsumerid): array {
    if ($domain === '') {
        return ['ok' => false, 'label' => 'missing'];
    }
    $context = pqh_resolve_consumer_context($domain);
    $ok = !empty($context->trusted_domain) && (int)($context->consumerid ?? 0) === $expectedconsumerid;
    return [
        'ok' => $ok,
        'label' => $ok ? 'resolves' : 'not resolving',
        'context' => $context,
    ];
}

echo $OUTPUT->header();
?>
<style>
body.pqh-consumer-diagnostics-page header,
body.pqh-consumer-diagnostics-page footer,
body.pqh-consumer-diagnostics-page nav.navbar,
body.pqh-consumer-diagnostics-page #page-header,
body.pqh-consumer-diagnostics-page #page-footer,
body.pqh-consumer-diagnostics-page .drawer,
body.pqh-consumer-diagnostics-page .drawer-toggles,
body.pqh-consumer-diagnostics-page .block-region,
body.pqh-consumer-diagnostics-page [data-region="drawer"],
body.pqh-consumer-diagnostics-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-consumer-diagnostics-page #page,
body.pqh-consumer-diagnostics-page #page-content,
body.pqh-consumer-diagnostics-page #region-main,
body.pqh-consumer-diagnostics-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhcd-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqhcd-wrap{max-width:1120px;margin:0 auto}
.pqhcd-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqhcd-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqhcd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqhcd-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.pqhcd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12);text-decoration:none;font-size:14px;font-weight:950}
.pqhcd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqhcd-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqhcd-panel--wide{grid-column:1/-1}
.pqhcd-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqhcd-table{width:100%;border-collapse:collapse;font-size:13px}
.pqhcd-table th,.pqhcd-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqhcd-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqhcd-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqhcd-pill--ok{background:#edf9ef;color:#245c35}
.pqhcd-pill--bad{background:#fff0ed;color:#883526}
.pqhcd-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqhcd-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;margin:0}
.pqhcd-input{min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 11px;color:#173044;font-size:14px;font-weight:800}
@media(max-width:850px){.pqhcd-grid{grid-template-columns:1fr}.pqhcd-top{display:block}.pqhcd-actions{justify-content:flex-start;margin-top:12px}.pqhcd-title{font-size:24px}.pqhcd-form{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqhcd-shell">
  <div class="pqhcd-wrap">
    <section class="pqhcd-top pqh-workspace-top">
      <div>
        <h1 class="pqhcd-title pqh-workspace-title">Consumer Diagnostics</h1>
        <p class="pqhcd-sub pqh-workspace-sub">Read-only checks for the multi-consumer/domain resolver.</p>
      </div>
      <div class="pqhcd-actions">
        <a class="pqhcd-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
        <a class="pqhcd-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Consumers</a>
        <a class="pqhcd-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_diagnostics.php'))->out(false); ?>">Refresh</a>
      </div>
    </section>

    <section class="pqhcd-grid">
      <article class="pqhcd-panel">
        <h2>Schema</h2>
        <table class="pqhcd-table">
          <tr><th>Check</th><th>Status</th></tr>
          <tr>
            <td>Consumer schema ready</td>
            <td><span class="pqhcd-pill <?php echo pqh_consumer_schema_ready() ? 'pqhcd-pill--ok' : 'pqhcd-pill--bad'; ?>"><?php echo s(pqhcd_status(pqh_consumer_schema_ready())); ?></span></td>
          </tr>
          <tr>
            <td class="pqhcd-code">local_prequran_consumer</td>
            <td><span class="pqhcd-pill <?php echo pqh_table_exists_safe('local_prequran_consumer') ? 'pqhcd-pill--ok' : 'pqhcd-pill--bad'; ?>"><?php echo s(pqhcd_status(pqh_table_exists_safe('local_prequran_consumer'))); ?></span></td>
          </tr>
          <tr>
            <td class="pqhcd-code">local_prequran_consumer_domain</td>
            <td><span class="pqhcd-pill <?php echo pqh_table_exists_safe('local_prequran_consumer_domain') ? 'pqhcd-pill--ok' : 'pqhcd-pill--bad'; ?>"><?php echo s(pqhcd_status(pqh_table_exists_safe('local_prequran_consumer_domain'))); ?></span></td>
          </tr>
          <tr>
            <td>Current request host</td>
            <td class="pqhcd-code"><?php echo s($currenthost !== '' ? $currenthost : '(none)'); ?></td>
          </tr>
        </table>
      </article>

      <article class="pqhcd-panel">
        <h2>Test Host</h2>
        <form class="pqhcd-form" method="get" action="<?php echo (new moodle_url('/local/hubredirect/consumer_diagnostics.php'))->out(false); ?>">
          <input class="pqhcd-input" name="host" value="<?php echo s($testhost); ?>" placeholder="edufortomorrow.com">
          <button class="pqhcd-btn" type="submit">Resolve</button>
        </form>
        <?php if ($testcontext): ?>
          <table class="pqhcd-table" style="margin-top:14px">
            <?php foreach (pqhcd_context_rows($testcontext) as $name => $value): ?>
              <tr><th><?php echo s($name); ?></th><td class="pqhcd-code"><?php echo s((string)$value); ?></td></tr>
            <?php endforeach; ?>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqhcd-panel pqhcd-panel--wide">
        <h2>Current Context</h2>
        <table class="pqhcd-table">
          <?php foreach (pqhcd_context_rows($currentcontext) as $name => $value): ?>
            <tr><th><?php echo s($name); ?></th><td class="pqhcd-code"><?php echo s((string)$value); ?></td></tr>
          <?php endforeach; ?>
        </table>
      </article>

      <?php if ($selectedconsumer): ?>
      <article class="pqhcd-panel pqhcd-panel--wide">
        <h2>Selected Consumer Domains</h2>
        <table class="pqhcd-table">
          <tr><th>Domain</th><th>Type</th><th>Primary</th><th>Verification</th><th>Resolver</th><th>Hosting Target</th></tr>
          <?php if (!$selecteddomains): ?>
            <tr><td colspan="6">No active domains are linked to <?php echo s((string)$selectedconsumer->name); ?> yet.</td></tr>
          <?php else: ?>
            <?php foreach ($selecteddomains as $domain): ?>
              <?php $domainstatus = pqhcd_domain_resolution_status((string)$domain->domain, (int)$selectedconsumer->id); ?>
              <tr>
                <td class="pqhcd-code"><?php echo s((string)$domain->domain); ?></td>
                <td><?php echo s((string)$domain->domain_type); ?></td>
                <td><?php echo (int)$domain->isprimary === 1 ? 'yes' : 'no'; ?></td>
                <td>
                  <span class="pqhcd-pill <?php echo in_array((string)$domain->verificationstatus, ['verified', 'seeded'], true) ? 'pqhcd-pill--ok' : ''; ?>"><?php echo s((string)$domain->verificationstatus); ?></span>
                  <br><span class="pqhcd-code">SSL: <?php echo s((string)$domain->sslstatus); ?></span>
                </td>
                <td><span class="pqhcd-pill <?php echo $domainstatus['ok'] ? 'pqhcd-pill--ok' : 'pqhcd-pill--bad'; ?>"><?php echo s((string)$domainstatus['label']); ?></span></td>
                <td class="pqhcd-code">Shared document root/server alias to the EduPlatform Moodle application; install/enable SSL for this host in cPanel.</td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </table>
      </article>
      <?php endif; ?>

      <article class="pqhcd-panel pqhcd-panel--wide">
        <h2>Seed Domain Resolution</h2>
        <table class="pqhcd-table">
          <tr><th>Host</th><th>Consumer</th><th>Type</th><th>Workspace</th><th>Domain Type</th><th>Trusted</th></tr>
          <?php foreach ($seedhosts as $host): ?>
            <?php $context = pqh_resolve_consumer_context($host); ?>
            <tr>
              <td class="pqhcd-code"><?php echo s($host); ?></td>
              <td><?php echo s((string)$context->consumername); ?><br><span class="pqhcd-code"><?php echo s((string)$context->consumerslug); ?></span></td>
              <td><?php echo s((string)$context->consumer_type); ?></td>
              <td><?php echo (int)$context->workspaceid; ?></td>
              <td><?php echo s((string)$context->domain_type); ?></td>
              <td><span class="pqhcd-pill <?php echo !empty($context->trusted_domain) ? 'pqhcd-pill--ok' : 'pqhcd-pill--bad'; ?>"><?php echo !empty($context->trusted_domain) ? 'yes' : 'no'; ?></span></td>
            </tr>
          <?php endforeach; ?>
        </table>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
