<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/account_ids.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can repair Moodle ID numbers.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'ID number repair access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/repair_random_5_digit_idnumbers.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Repair 5-Digit ID Numbers');
$PAGE->set_heading('Repair 5-Digit ID Numbers');
$PAGE->add_body_class('pqidfix-page');

function pqidfix_needs_repair_sql(): string {
    return "(idnumber IS NULL OR idnumber = '' OR idnumber NOT REGEXP '^[0-9]{5}$')";
}

function pqidfix_repair(int $limit = 500): array {
    global $DB, $CFG;

    $where = 'deleted = 0 AND id > 1 AND mnethostid = :mnethostid AND ' . pqidfix_needs_repair_sql();
    $rows = $DB->get_records_select(
        'user',
        $where,
        ['mnethostid' => $CFG->mnet_localhost_id],
        'timecreated DESC, id DESC',
        'id,username,firstname,lastname,email,idnumber',
        0,
        max(1, min(5000, $limit))
    );

    $repaired = [];
    foreach ($rows as $row) {
        $old = trim((string)($row->idnumber ?? ''));
        $new = pqh_assign_account_id((int)$row->id, 'user');
        $repaired[] = [
            'userid' => (int)$row->id,
            'name' => fullname($row),
            'username' => (string)$row->username,
            'old' => $old,
            'new' => $new,
        ];
    }

    return $repaired;
}

$message = '';
$error = '';
$repaired = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        $limit = optional_param('limit', 500, PARAM_INT);
        $repaired = pqidfix_repair($limit);
        $message = count($repaired) . ' user ID number row(s) repaired.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$remaining = 0;
try {
    $remaining = (int)$DB->count_records_select(
        'user',
        'deleted = 0 AND id > 1 AND mnethostid = :mnethostid AND ' . pqidfix_needs_repair_sql(),
        ['mnethostid' => $CFG->mnet_localhost_id]
    );
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqidfix-page header,body.pqidfix-page footer,body.pqidfix-page nav.navbar,body.pqidfix-page #page-header,body.pqidfix-page #page-footer,body.pqidfix-page .drawer,body.pqidfix-page .drawer-toggles,body.pqidfix-page .block-region,body.pqidfix-page [data-region="drawer"],body.pqidfix-page [data-region="right-hand-drawer"]{display:none!important}
body.pqidfix-page #page,body.pqidfix-page #page-content,body.pqidfix-page #region-main,body.pqidfix-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqidfix-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqidfix-wrap{max-width:980px;margin:0 auto}.pqidfix-top,.pqidfix-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqidfix-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#eaffea 0%,#fff 62%,#fff7e7 100%)}.pqidfix-title{margin:0;color:#221b22;font-size:30px;line-height:1.08;font-weight:950}.pqidfix-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqidfix-actions{display:flex;gap:8px;flex-wrap:wrap}.pqidfix-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqidfix-btn--gold{background:#d6a642;border-color:#d6a642;color:#211b12!important}.pqidfix-card{padding:18px;margin-bottom:14px}.pqidfix-num{display:block;color:#221b22;font-size:38px;line-height:1;font-weight:950}.pqidfix-label{display:block;margin-top:6px;color:#60707d;font-size:12px;font-weight:900;text-transform:uppercase}.pqidfix-field{display:grid;gap:6px;margin:12px 0}.pqidfix-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqidfix-input{max-width:180px;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqidfix-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqidfix-alert--ok{background:#edf9ef;color:#245c35}.pqidfix-alert--bad{background:#fff0ed;color:#883526}.pqidfix-table{width:100%;border-collapse:collapse}.pqidfix-table th,.pqidfix-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:13px}.pqidfix-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqidfix-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}
</style>
<main class="pqidfix-shell">
  <div class="pqidfix-wrap">
    <section class="pqidfix-top">
      <div>
        <h1 class="pqidfix-title">Repair 5-Digit ID Numbers</h1>
        <p class="pqidfix-sub">Replace blank or old-format Moodle user ID numbers with unique random 5-digit values.</p>
      </div>
      <nav class="pqidfix-actions">
        <a class="pqidfix-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqidfix-alert pqidfix-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqidfix-alert pqidfix-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqidfix-card">
      <span class="pqidfix-num"><?php echo (int)$remaining; ?></span>
      <span class="pqidfix-label">active users still missing a valid 5-digit ID number</span>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <div class="pqidfix-field">
          <label>Maximum rows this run</label>
          <input class="pqidfix-input" type="number" name="limit" min="1" max="5000" value="500">
        </div>
        <button class="pqidfix-btn pqidfix-btn--gold" type="submit">Repair now</button>
      </form>
    </section>

    <section class="pqidfix-card">
      <h2>Last Repair Run</h2>
      <?php if (!$repaired): ?>
        <div class="pqidfix-empty">No rows repaired in this page load.</div>
      <?php else: ?>
        <table class="pqidfix-table">
          <thead><tr><th>User</th><th>Old ID number</th><th>Account No.</th></tr></thead>
          <tbody>
            <?php foreach ($repaired as $row): ?>
              <tr>
                <td><?php echo s($row['name']); ?><br><small>Account No. <?php echo s($row['new']); ?> / #<?php echo (int)$row['userid']; ?> / <?php echo s($row['username']); ?></small></td>
                <td><?php echo s($row['old'] !== '' ? $row['old'] : 'blank'); ?></td>
                <td><strong><?php echo s($row['new']); ?></strong></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
