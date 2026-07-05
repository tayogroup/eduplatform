<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_login();

pqh_require_platform_operations('Only platform administrators can view notification branding diagnostics.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/notification_diagnostics.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Notification Branding Diagnostics');
$PAGE->set_heading('Notification Branding Diagnostics');
$PAGE->add_body_class('pqnd-page');

function pqnd_consumer_by_slug(string $slug): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer')) {
        return null;
    }
    return $DB->get_record('local_prequran_consumer', ['slug' => $slug], '*', IGNORE_MISSING) ?: null;
}

function pqnd_domain_for_consumer(int $consumerid, string $type): string {
    global $DB;
    if ($consumerid <= 0 || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return '';
    }
    $domain = $DB->get_record_sql(
        "SELECT domain
           FROM {local_prequran_consumer_domain}
          WHERE consumerid = :consumerid
            AND domain_type = :type
            AND status = :status
       ORDER BY isprimary DESC, id ASC",
        ['consumerid' => $consumerid, 'type' => $type, 'status' => 'active'],
        IGNORE_MULTIPLE
    );
    return $domain ? (string)$domain->domain : '';
}

function pqnd_sample_row(string $slug, string $expected): array {
    $consumer = pqnd_consumer_by_slug($slug);
    if (!$consumer) {
        return [
            'slug' => $slug,
            'expected' => $expected,
            'resolved' => 'Missing consumer',
            'status' => false,
            'subject' => '',
            'body' => '',
            'support' => '',
            'replyto' => '',
            'domain' => '',
        ];
    }
    $workspaceid = (int)($consumer->primaryworkspaceid ?? 0);
    $brand = local_prequran_notify_brand_context(0, $workspaceid, (int)$consumer->id);
    $subject = local_prequran_notify_brand_subject('Live class reminder', $brand);
    $body = local_prequran_notify_brand_message('A live-class follow-up is ready for review.', $brand);
    $resolved = trim((string)($brand->emailfromname ?? $brand->name ?? ''));
    $expectedok = strcasecmp($resolved, $expected) === 0
        || strcasecmp(trim((string)($brand->name ?? '')), $expected) === 0;
    return [
        'slug' => $slug,
        'expected' => $expected,
        'resolved' => $resolved !== '' ? $resolved : (string)($brand->name ?? ''),
        'status' => $expectedok && strpos($subject, '[' . $expected . ']') === 0,
        'subject' => $subject,
        'body' => $body,
        'support' => (string)($brand->supportemail ?? ''),
        'replyto' => (string)($brand->emailreplyto ?? ''),
        'domain' => pqnd_domain_for_consumer((int)$consumer->id, 'public') ?: pqnd_domain_for_consumer((int)$consumer->id, 'app'),
    ];
}

$samples = [
    pqnd_sample_row('eduplatform', 'EduPlatform'),
    pqnd_sample_row('huda-school', 'Huda-school'),
    pqnd_sample_row('quraan-academy', 'Quraan Academy'),
    pqnd_sample_row('edu-for-tomorrow', 'EduForTomorrow'),
];

$flows = [
    ['Live reminders', 'local_prequran_notify_user_live_update()', 'Consumer/workspace/session brand context prefixes subject and footer.'],
    ['Recordings', 'live_recording_automation', 'Recording ready/expiry reminders call the branded live update sender.'],
    ['Follow-up notices', 'live_session_reminders', 'Parent, teacher, admin, QA, coaching, and improvement reminders resolve brand from session/workspace.'],
    ['Intake and approval', 'pqhi_send_consumer_email()', 'Consumer support sender and subject prefix use the selected consumer record.'],
    ['Marketplace', 'teacher marketplace flows', 'Marketplace pages resolve EduForTomorrow or selected consumer context before actions.'],
];

echo $OUTPUT->header();
?>
<style>
body.pqnd-page header,body.pqnd-page footer,body.pqnd-page nav.navbar,body.pqnd-page #page-header,body.pqnd-page #page-footer,body.pqnd-page .drawer,body.pqnd-page .drawer-toggles,body.pqnd-page .block-region,body.pqnd-page [data-region="drawer"],body.pqnd-page [data-region="right-hand-drawer"]{display:none!important}
body.pqnd-page #page,body.pqnd-page #page-content,body.pqnd-page #region-main,body.pqnd-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqnd-shell{min-height:100vh;padding:32px 18px 58px;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqnd-wrap{max-width:1180px;margin:0 auto}.pqnd-top,.pqnd-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqnd-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqnd-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.1}.pqnd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqnd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqnd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12);text-decoration:none;font-size:12px;font-weight:950}.pqnd-table{width:100%;border-collapse:collapse}.pqnd-table th,.pqnd-table td{padding:11px 9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqnd-table th{color:#5e7280;background:#fbfdff;font-size:12px;font-weight:950;text-transform:uppercase}.pqnd-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqnd-pill--ok{background:#edf9ef;color:#245c35}.pqnd-pill--warn{background:#fff6dc;color:#79520f}.pqnd-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-word}.pqnd-muted{display:block;color:#728391;font-size:12px;font-weight:800}.pqnd-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}.pqnd-card{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqnd-card strong{display:block;color:#221b22;font-size:13px;font-weight:950}.pqnd-card span{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-weight:800;line-height:1.35}
@media(max-width:980px){.pqnd-top,.pqnd-grid{grid-template-columns:1fr}.pqnd-actions{justify-content:flex-start}.pqnd-table,.pqnd-table tbody,.pqnd-table tr,.pqnd-table td{display:block;width:100%}.pqnd-table thead{display:none}.pqnd-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqnd-table td{border-bottom:0}.pqnd-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqnd-shell">
  <div class="pqnd-wrap">
    <section class="pqnd-top">
      <div>
        <h1 class="pqnd-title">Notification Branding Diagnostics</h1>
        <p class="pqnd-sub">Read-only verification that shared email and Moodle message subjects resolve to the correct consumer brand.</p>
      </div>
      <nav class="pqnd-actions">
        <a class="pqnd-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_diagnostics.php'))->out(false); ?>">Diagnostics</a>
        <a class="pqnd-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php'))->out(false); ?>">Consumer manager</a>
      </nav>
    </section>

    <section class="pqnd-panel">
      <table class="pqnd-table">
        <thead><tr><th>Consumer</th><th>Status</th><th>Sample Subject</th><th>Support / Reply-To</th><th>Body Footer</th></tr></thead>
        <tbody>
          <?php foreach ($samples as $row): ?>
            <tr>
              <td data-label="Consumer">
                <strong><?php echo s($row['expected']); ?></strong>
                <span class="pqnd-muted pqnd-code"><?php echo s($row['slug']); ?> <?php echo $row['domain'] !== '' ? '/ ' . s($row['domain']) : ''; ?></span>
                <span class="pqnd-muted">resolved: <?php echo s($row['resolved']); ?></span>
              </td>
              <td data-label="Status"><span class="pqnd-pill <?php echo $row['status'] ? 'pqnd-pill--ok' : 'pqnd-pill--warn'; ?>"><?php echo $row['status'] ? 'PASS' : 'CHECK'; ?></span></td>
              <td data-label="Sample Subject"><span class="pqnd-code"><?php echo s($row['subject']); ?></span></td>
              <td data-label="Support / Reply-To">
                <span class="pqnd-muted">support: <?php echo s($row['support'] !== '' ? $row['support'] : 'not set'); ?></span>
                <span class="pqnd-muted">reply-to: <?php echo s($row['replyto'] !== '' ? $row['replyto'] : 'not set'); ?></span>
              </td>
              <td data-label="Body Footer"><span class="pqnd-code"><?php echo nl2br(s($row['body'])); ?></span></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <div class="pqnd-grid">
        <?php foreach ($flows as $flow): ?>
          <div class="pqnd-card">
            <strong><?php echo s($flow[0]); ?></strong>
            <span class="pqnd-code"><?php echo s($flow[1]); ?></span>
            <span><?php echo s($flow[2]); ?></span>
          </div>
        <?php endforeach; ?>
      </div>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
