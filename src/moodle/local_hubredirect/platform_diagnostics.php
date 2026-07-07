<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_platform_operations('Only platform administrators can view EduPlatform diagnostics.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_diagnostics.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('EduPlatform Diagnostics');
$PAGE->set_heading('EduPlatform Diagnostics');
$PAGE->add_body_class('pqpfdiag-page');

function pqpfdiag_status(bool $ok): string {
    return $ok ? 'PASS' : 'CHECK';
}

function pqpfdiag_pill(bool $ok): string {
    return $ok ? 'pqpfdiag-pill--ok' : 'pqpfdiag-pill--warn';
}

function pqpfdiag_domain_url(string $domain, string $path, array $params = []): moodle_url {
    $domain = pqh_normalize_consumer_host($domain);
    if ($domain === '') {
        return new moodle_url($path, $params);
    }
    return new moodle_url('https://' . $domain . '/' . ltrim($path, '/'), $params);
}

function pqpfdiag_copy_setting(stdClass $consumer, string $key, string $fallback): string {
    $copy = [];
    if (!empty($consumer->copyjson)) {
        $decoded = json_decode((string)$consumer->copyjson, true);
        if (is_array($decoded)) {
            $copy = $decoded;
        }
    }
    $value = $copy[$key] ?? '';
    $value = is_string($value) ? trim($value) : '';
    return $value !== '' ? $value : $fallback;
}

function pqpfdiag_workspace_summary(int $workspaceid): array {
    global $DB;
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace')) {
        return ['ok' => $workspaceid === 0, 'label' => $workspaceid > 0 ? 'missing' : 'not required', 'detail' => 'Workspace #' . $workspaceid];
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    if (!$workspace) {
        return ['ok' => false, 'label' => 'missing', 'detail' => 'Workspace #' . $workspaceid];
    }
    $status = (string)($workspace->status ?? 'active');
    return [
        'ok' => $status === 'active',
        'label' => $status,
        'detail' => (string)($workspace->name ?? ('Workspace #' . $workspaceid)),
    ];
}

function pqpfdiag_domain_row(string $domain): ?stdClass {
    global $DB;
    if ($domain === '' || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return null;
    }
    return $DB->get_record('local_prequran_consumer_domain', ['domain' => pqh_normalize_consumer_host($domain)], '*', IGNORE_MISSING) ?: null;
}

function pqpfdiag_consumer_row(int $consumerid): ?stdClass {
    global $DB;
    if ($consumerid <= 0 || !pqh_table_exists_safe('local_prequran_consumer')) {
        return null;
    }
    return $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING) ?: null;
}

$domains = [
    'eduplatform.ai' => 'Foundation public domain',
    'www.eduplatform.ai' => 'Foundation public alias',
    'app.eduplatform.ai' => 'Foundation app domain',
    'quraantest.academy' => 'Quraan Academy app/test domain',
    'quraanacademy.info' => 'Huda-school institution app domain',
    'edufortomorrow.com' => 'EduForTomorrow marketplace public domain',
];

$rows = [];
foreach ($domains as $domain => $purpose) {
    $context = pqh_resolve_consumer_context($domain);
    $consumer = pqpfdiag_consumer_row((int)($context->consumerid ?? 0));
    $domainrow = pqpfdiag_domain_row($domain);
    $workspaceid = (int)($context->workspaceid ?? 0);
    $workspace = pqpfdiag_workspace_summary($workspaceid);
    $slug = (string)($context->consumerslug ?? '');
    $baseparams = [];
    if ($slug !== '') {
        $baseparams['consumer'] = $slug;
    }
    if ($workspaceid > 0) {
        $baseparams['workspaceid'] = $workspaceid;
    }
    $publicpath = (string)($context->defaultpublicpath ?? '/');
    $dashboardpath = (string)($context->defaultdashboardpath ?? '/local/hubredirect/dashboard.php');
    $loginpath = $consumer ? pqpfdiag_copy_setting($consumer, 'default_login_path', '/local/hubredirect/consumer_login.php') : '/local/hubredirect/consumer_login.php';
    $rows[] = [
        'domain' => $domain,
        'purpose' => $purpose,
        'context' => $context,
        'consumer' => $consumer,
        'domainrow' => $domainrow,
        'workspace' => $workspace,
        'publicurl' => pqpfdiag_domain_url($domain, $publicpath, $baseparams),
        'loginurl' => pqpfdiag_domain_url($domain, $loginpath, $baseparams),
        'dashboardurl' => pqpfdiag_domain_url($domain, $dashboardpath, $baseparams),
        'probeurl' => pqpfdiag_domain_url($domain, '/local/hubredirect/consumer_probe.php'),
    ];
}

$educontext = pqh_resolve_consumer_context('eduplatform.ai');
$checks = [
    'Consumer schema ready' => pqh_consumer_schema_ready(),
    'EduPlatform consumer resolves' => (string)($educontext->consumerslug ?? '') === 'eduplatform',
    'EduPlatform domain trusted' => !empty($educontext->trusted_domain),
    'Foundation public path configured' => (string)($educontext->defaultpublicpath ?? '') === '/local/hubredirect/platform_landing.php',
    'Foundation dashboard path configured' => (string)($educontext->defaultdashboardpath ?? '') === '/local/hubredirect/platform_consumers.php',
    'www.eduplatform.ai DB row exists' => pqpfdiag_domain_row('www.eduplatform.ai') !== null,
    'app.eduplatform.ai DB row exists' => pqpfdiag_domain_row('app.eduplatform.ai') !== null,
];

$workflowchecks = [
    ['Create/edit consumer', '/local/hubredirect/consumer_wizard.php', [], 'Create a consumer app, default routes, workspace, and first admin.'],
    ['Attach domain and primary flags', '/local/hubredirect/platform_consumers.php', [], 'Attach public/app domains, set primary domains, and update statuses.'],
    ['Create/link workspace', '/local/hubredirect/platform_consumers.php', [], 'Link an existing workspace or create one through the wizard.'],
    ['Pause/archive consumer', '/local/hubredirect/platform_consumers.php', [], 'Set consumer/workspace status to paused, archived, or active.'],
    ['Open diagnostics/debug links', '/local/hubredirect/platform_diagnostics.php', [], 'Verify host routing, workspace scope, login route, and resolver state.'],
];

$wizardtests = [
    ['Academy consumer', ['type' => 'academy_consumer']],
    ['Institution consumer', ['type' => 'institution']],
    ['Marketplace consumer', ['type' => 'marketplace']],
    ['Teacher workspace consumer', ['type' => 'teacher_workspace']],
];

echo $OUTPUT->header();
?>
<style>
body.pqpfdiag-page header,body.pqpfdiag-page footer,body.pqpfdiag-page nav.navbar,body.pqpfdiag-page #page-header,body.pqpfdiag-page #page-footer,body.pqpfdiag-page .drawer,body.pqpfdiag-page .drawer-toggles,body.pqpfdiag-page .block-region,body.pqpfdiag-page [data-region="drawer"],body.pqpfdiag-page [data-region="right-hand-drawer"]{display:none!important}
body.pqpfdiag-page #page,body.pqpfdiag-page #page-content,body.pqpfdiag-page #region-main,body.pqpfdiag-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpfdiag-shell{min-height:100vh;padding:30px 18px 58px;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqpfdiag-wrap{max-width:1320px;margin:0 auto}.pqpfdiag-top,.pqpfdiag-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqpfdiag-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqpfdiag-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.1}.pqpfdiag-sub{margin:8px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqpfdiag-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqpfdiag-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12);text-decoration:none;font-size:12px;font-weight:950}.pqpfdiag-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqpfdiag-check{padding:12px;border-radius:8px;border:1px solid rgba(23,48,68,.12);background:#fff}.pqpfdiag-pill{display:inline-flex;align-items:center;min-height:24px;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqpfdiag-pill--ok{background:#edf9ef;color:#245c35}.pqpfdiag-pill--warn{background:#fff6dc;color:#79520f}.pqpfdiag-pill--bad{background:#fff0ed;color:#883526}.pqpfdiag-muted{display:block;color:#728391;font-size:12px;font-weight:800}.pqpfdiag-table{width:100%;border-collapse:collapse}.pqpfdiag-table th,.pqpfdiag-table td{padding:10px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:12px}.pqpfdiag-table th{color:#5e7280;background:#fbfdff;font-weight:950;text-transform:uppercase}.pqpfdiag-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-word}.pqpfdiag-links{display:flex;gap:6px;flex-wrap:wrap}.pqpfdiag-note{margin:14px 0 0;padding:13px;border:1px dashed rgba(23,48,68,.2);border-radius:8px;background:#fbfdff;color:#5e7280;font-size:13px;font-weight:850}.pqpfdiag-section-title{margin:0 0 10px;color:#221b22;font-size:20px;font-weight:950}.pqpfdiag-flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqpfdiag-flow-card{display:block;padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff;color:#173044!important;text-decoration:none}.pqpfdiag-flow-card strong{display:block;font-size:13px;font-weight:950}.pqpfdiag-flow-card span{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-weight:800;line-height:1.35}.pqpfdiag-wizard{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:980px){.pqpfdiag-top,.pqpfdiag-grid,.pqpfdiag-flow{grid-template-columns:1fr}.pqpfdiag-actions{justify-content:flex-start}.pqpfdiag-table,.pqpfdiag-table tbody,.pqpfdiag-table tr,.pqpfdiag-table td{display:block;width:100%}.pqpfdiag-table thead{display:none}.pqpfdiag-table td{border-bottom:0}.pqpfdiag-table tr{display:block;border-bottom:1px solid rgba(23,48,68,.12)}.pqpfdiag-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqpfdiag-shell">
  <div class="pqpfdiag-wrap">
    <section class="pqpfdiag-top">
      <div>
        <h1 class="pqpfdiag-title">EduPlatform Diagnostics</h1>
        <p class="pqpfdiag-sub">Foundation checks for host resolution, consumer routing, workspace scope, login routes, and public/dashboard paths.</p>
      </div>
      <nav class="pqpfdiag-actions">
        <a class="pqpfdiag-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_landing.php'))->out(false); ?>">Foundation landing</a>
        <a class="pqpfdiag-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Consumer manager</a>
        <a class="pqpfdiag-btn" href="<?php echo (new moodle_url('/local/hubredirect/notification_diagnostics.php'))->out(false); ?>">Notification branding</a>
        <a class="pqpfdiag-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_diagnostics.php'))->out(false); ?>">Legacy diagnostics</a>
      </nav>
    </section>

    <section class="pqpfdiag-grid">
      <?php foreach ($checks as $label => $ok): ?>
        <div class="pqpfdiag-check">
          <span class="pqpfdiag-pill <?php echo pqpfdiag_pill($ok); ?>"><?php echo s(pqpfdiag_status($ok)); ?></span>
          <span class="pqpfdiag-muted"><?php echo s($label); ?></span>
        </div>
      <?php endforeach; ?>
    </section>

    <section class="pqpfdiag-panel" style="margin-bottom:14px">
      <h2 class="pqpfdiag-section-title">Platform Owner Workflow</h2>
      <div class="pqpfdiag-flow">
        <?php foreach ($workflowchecks as $item): ?>
          <?php [$label, $path, $params, $description] = $item; ?>
          <a class="pqpfdiag-flow-card" href="<?php echo (new moodle_url($path, $params))->out(false); ?>">
            <strong><?php echo s($label); ?></strong>
            <span><?php echo s($description); ?></span>
          </a>
        <?php endforeach; ?>
      </div>
      <h2 class="pqpfdiag-section-title">Consumer Wizard End-to-End Tests</h2>
      <div class="pqpfdiag-wizard">
        <?php foreach ($wizardtests as $item): ?>
          <?php [$label, $params] = $item; ?>
          <a class="pqpfdiag-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_wizard.php', $params))->out(false); ?>"><?php echo s($label); ?></a>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="pqpfdiag-panel">
      <table class="pqpfdiag-table">
        <thead>
          <tr>
            <th>Host</th>
            <th>Consumer Lookup</th>
            <th>Trust / Domain</th>
            <th>Workspace Scope</th>
            <th>Routes</th>
            <th>SSL / Hosting Notes</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($rows as $row): ?>
            <?php
            $context = $row['context'];
            $domainrow = $row['domainrow'];
            $trusted = !empty($context->trusted_domain);
            $sslstatus = $domainrow ? (string)($domainrow->sslstatus ?? 'not_checked') : 'missing';
            $verification = $domainrow ? (string)($domainrow->verificationstatus ?? 'missing') : 'missing';
            ?>
            <tr>
              <td data-label="Host">
                <strong class="pqpfdiag-code"><?php echo s($row['domain']); ?></strong>
                <span class="pqpfdiag-muted"><?php echo s($row['purpose']); ?></span>
              </td>
              <td data-label="Consumer Lookup">
                <strong><?php echo s((string)($context->consumername ?? 'Not resolved')); ?></strong>
                <span class="pqpfdiag-muted pqpfdiag-code"><?php echo s((string)($context->consumerslug ?? '')); ?></span>
                <span class="pqpfdiag-pill"><?php echo s((string)($context->consumer_type ?? '')); ?></span>
              </td>
              <td data-label="Trust / Domain">
                <span class="pqpfdiag-pill <?php echo $trusted ? 'pqpfdiag-pill--ok' : 'pqpfdiag-pill--bad'; ?>"><?php echo $trusted ? 'trusted' : 'not trusted'; ?></span>
                <span class="pqpfdiag-muted">type: <?php echo s((string)($context->domain_type ?? '')); ?></span>
                <span class="pqpfdiag-muted">primary: <?php echo (int)($context->isprimarydomain ?? 0) === 1 ? 'yes' : 'no'; ?></span>
              </td>
              <td data-label="Workspace Scope">
                <span class="pqpfdiag-pill <?php echo $row['workspace']['ok'] ? 'pqpfdiag-pill--ok' : 'pqpfdiag-pill--warn'; ?>"><?php echo s($row['workspace']['label']); ?></span>
                <span class="pqpfdiag-muted">#<?php echo (int)($context->workspaceid ?? 0); ?> <?php echo s($row['workspace']['detail']); ?></span>
              </td>
              <td data-label="Routes">
                <div class="pqpfdiag-links">
                  <a class="pqpfdiag-btn" href="<?php echo $row['probeurl']->out(false); ?>">Probe</a>
                  <a class="pqpfdiag-btn" href="<?php echo $row['publicurl']->out(false); ?>">Public</a>
                  <a class="pqpfdiag-btn" href="<?php echo $row['loginurl']->out(false); ?>">Login</a>
                  <a class="pqpfdiag-btn" href="<?php echo $row['dashboardurl']->out(false); ?>">Dashboard</a>
                </div>
                <span class="pqpfdiag-muted pqpfdiag-code">public: <?php echo s((string)($context->defaultpublicpath ?? '')); ?></span>
                <span class="pqpfdiag-muted pqpfdiag-code">dashboard: <?php echo s((string)($context->defaultdashboardpath ?? '')); ?></span>
              </td>
              <td data-label="SSL / Hosting Notes">
                <span class="pqpfdiag-pill <?php echo in_array($verification, ['verified', 'seeded'], true) ? 'pqpfdiag-pill--ok' : 'pqpfdiag-pill--warn'; ?>">verification: <?php echo s($verification); ?></span>
                <span class="pqpfdiag-pill <?php echo $sslstatus === 'active' ? 'pqpfdiag-pill--ok' : 'pqpfdiag-pill--warn'; ?>">ssl: <?php echo s($sslstatus); ?></span>
                <span class="pqpfdiag-muted">cPanel should use shared document root/server alias to the Moodle folder. AutoSSL must cover this exact host.</span>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <div class="pqpfdiag-note">
        This page verifies Moodle's resolver and database configuration. Browser SSL warnings, DNS propagation, and cPanel document-root setup must still be confirmed in hosting for each host, especially www.eduplatform.ai and app.eduplatform.ai.
      </div>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
