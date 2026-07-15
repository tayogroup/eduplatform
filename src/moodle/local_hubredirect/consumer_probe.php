<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$host = pqh_request_host();
$context = pqh_current_consumer_context();

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/consumer_probe.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Consumer Probe');
$PAGE->set_heading('Consumer Probe');
$PAGE->add_body_class('pqh-consumer-probe-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

$rows = [
    'request_host' => $host,
    'consumer_slug' => (string)($context->consumerslug ?? ''),
    'consumer_name' => (string)($context->consumername ?? ''),
    'consumer_type' => (string)($context->consumer_type ?? ''),
    'website_mode' => (string)($context->website_mode ?? 'hosted'),
    'external_website_url' => (string)($context->externalwebsiteurl ?? ''),
    'domain_management' => (string)($context->domainmanagement ?? ''),
    'portal_label' => (string)($context->portallabel ?? ''),
    'intake_location' => (string)($context->intakelocation ?? ''),
    'integration_method' => (string)($context->integrationmethod ?? ''),
    'workspaceid' => (int)($context->workspaceid ?? 0),
    'domain' => (string)($context->domain ?? ''),
    'domain_type' => (string)($context->domain_type ?? ''),
    'trusted_domain' => !empty($context->trusted_domain) ? 'yes' : 'no',
    'default_public_path' => (string)($context->defaultpublicpath ?? ''),
    'default_dashboard_path' => (string)($context->defaultdashboardpath ?? ''),
];

echo $OUTPUT->header();
?>
<style>
body.pqh-consumer-probe-page header,
body.pqh-consumer-probe-page footer,
body.pqh-consumer-probe-page nav.navbar,
body.pqh-consumer-probe-page #page-header,
body.pqh-consumer-probe-page #page-footer,
body.pqh-consumer-probe-page .drawer,
body.pqh-consumer-probe-page .drawer-toggles{display:none!important}
body.pqh-consumer-probe-page #page,
body.pqh-consumer-probe-page #page-content,
body.pqh-consumer-probe-page #region-main,
body.pqh-consumer-probe-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhcp-shell{min-height:100vh;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;padding:42px 18px}
.pqhcp-card{max-width:860px;margin:0 auto;background:#fff;border:1px solid rgba(23,48,68,.14);border-radius:8px;box-shadow:0 16px 38px rgba(23,48,68,.1);padding:24px}
.pqhcp-card h1{margin:0 0 8px;color:#241b24;font-size:30px;line-height:1.12;font-weight:950}
.pqhcp-card p{margin:0 0 20px;color:#60717e;font-size:15px;font-weight:760}
.pqhcp-table{width:100%;border-collapse:collapse}
.pqhcp-table th,.pqhcp-table td{padding:11px 10px;border-top:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:14px}
.pqhcp-table th{width:250px;color:#536978;font-weight:900}
.pqhcp-table td{color:#173044;font-weight:850;word-break:break-word}
.pqhcp-ok{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#e8f8ed;color:#23643d;font-weight:950}
.pqhcp-bad{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#fff1df;color:#7c4a05;font-weight:950}
</style>
<main class="pqhcp-shell">
  <section class="pqhcp-card">
    <h1>Consumer Probe</h1>
    <p>Public read-only host resolution check for custom-domain setup.</p>
    <table class="pqhcp-table">
      <tbody>
        <?php foreach ($rows as $label => $value): ?>
          <tr>
            <th><?php echo s($label); ?></th>
            <td>
              <?php if ($label === 'trusted_domain'): ?>
                <span class="<?php echo $value === 'yes' ? 'pqhcp-ok' : 'pqhcp-bad'; ?>"><?php echo s((string)$value); ?></span>
              <?php else: ?>
                <?php echo s((string)$value); ?>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </section>
</main>
<?php
echo $OUTPUT->footer();
