<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Full-system cleanup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_all_except_keeplist.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete All Accounts Except Keep List');
$PAGE->set_heading('Delete All Accounts Except Keep List');
$PAGE->add_body_class('pqkeep-page');

/**
 * Explicitly confirmed keep list, by user id (not username -- avoids any
 * ambiguity if a username were ever reused/changed): System Administrator,
 * admin_lti, googledrive, moodle.bot, prequran_ws, eheladmin01,
 * malimire.sqa, languages_admin02. Every other active account gets deleted.
 */
const PQKEEP_USERIDS = [2, 6, 7, 8, 78, 218, 1179, 1255];

function pqkeep_candidates(): array {
    global $DB;
    [$insql, $params] = $DB->get_in_or_equal(PQKEEP_USERIDS, SQL_PARAMS_QM, 'k', false);
    return array_values($DB->get_records_select(
        'user',
        "deleted = 0 AND id > 1 AND id $insql",
        $params,
        'username ASC',
        'id, username, email, firstname, lastname, idnumber'
    ));
}

$message = '';
$error = '';
$results = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        require_once($CFG->dirroot . '/user/lib.php');
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'DELETE ALL EXCEPT KEEP LIST') {
            throw new Exception('Type DELETE ALL EXCEPT KEEP LIST exactly (all caps) to confirm.');
        }
        $batchsize = max(1, min(500, optional_param('batchsize', 100, PARAM_INT)));
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }
        $candidates = array_slice(pqkeep_candidates(), 0, $batchsize);
        foreach ($candidates as $row) {
            if (in_array((int)$row->id, PQKEEP_USERIDS, true)) {
                continue; // belt-and-braces, should never trigger given the query above
            }
            $targetuser = $DB->get_record('user', ['id' => (int)$row->id], '*', IGNORE_MISSING);
            if (!$targetuser) {
                $results[] = ['userid' => (int)$row->id, 'ok' => false, 'detail' => 'User record not found.'];
                continue;
            }
            $label = $targetuser->username;
            try {
                $ok = delete_user($targetuser);
                $results[] = ['userid' => (int)$row->id, 'ok' => (bool)$ok, 'detail' => $ok ? $label . ' deleted.' : $label . ': delete_user() returned false.'];
            } catch (Throwable $e) {
                $results[] = ['userid' => (int)$row->id, 'ok' => false, 'detail' => $label . ': ' . $e->getMessage()];
            }
        }
        $okcount = count(array_filter($results, static function ($r) {
            return $r['ok'];
        }));
        $remainingafter = count(pqkeep_candidates());
        $message = $okcount . ' of ' . count($results) . ' account(s) in this batch deleted. '
            . ($remainingafter > 0
                ? $remainingafter . ' account(s) still remain -- submit the form again (as many times as needed) to keep deleting in batches.'
                : 'No matching accounts remain -- only the keep list is left.');
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$candidates = [];
try {
    $candidates = pqkeep_candidates();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqkeep-page header,body.pqkeep-page footer,body.pqkeep-page nav.navbar,body.pqkeep-page #page-header,body.pqkeep-page #page-footer,body.pqkeep-page .drawer,body.pqkeep-page .drawer-toggles,body.pqkeep-page .block-region,body.pqkeep-page [data-region="drawer"],body.pqkeep-page [data-region="right-hand-drawer"]{display:none!important}
body.pqkeep-page #page,body.pqkeep-page #page-content,body.pqkeep-page #region-main,body.pqkeep-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqkeep-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqkeep-wrap{max-width:1100px;margin:0 auto}.pqkeep-top,.pqkeep-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqkeep-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqkeep-title{margin:0;color:#221b22;font-size:28px;line-height:1.08;font-weight:950}.pqkeep-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqkeep-actions{display:flex;gap:8px;flex-wrap:wrap}.pqkeep-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqkeep-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqkeep-card{padding:18px;margin-bottom:14px}.pqkeep-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqkeep-alert--ok{background:#edf9ef;color:#245c35}.pqkeep-alert--bad{background:#fff0ed;color:#883526}.pqkeep-table{width:100%;border-collapse:collapse}.pqkeep-table th,.pqkeep-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px;vertical-align:top}.pqkeep-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqkeep-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqkeep-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqkeep-keeplist{padding:12px 14px;border-radius:8px;background:#edf9ef;color:#245c35;font-weight:800;border:1px solid #b7e0c2;margin-bottom:14px;font-size:13px}.pqkeep-scroll{max-height:480px;overflow:auto;border:1px solid rgba(23,48,68,.1);border-radius:8px}.pqkeep-confirm{max-width:280px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}
</style>
<main class="pqkeep-shell">
  <div class="pqkeep-wrap">
    <section class="pqkeep-top">
      <div>
        <h1 class="pqkeep-title">Delete All Accounts Except Keep List</h1>
        <p class="pqkeep-sub">Permanently deletes every active account in the system except the 8 explicitly confirmed accounts below.</p>
      </div>
      <nav class="pqkeep-actions">
        <a class="pqkeep-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <div class="pqkeep-keeplist">Keep list (never touched): admin (#2), admin_lti (#7), googledrive (#6), moodle.bot (#78), prequran_ws (#8), eheladmin01 (#1179), malimire.sqa (#218), languages_admin02 (#1255)</div>

    <?php if ($message !== ''): ?><div class="pqkeep-alert pqkeep-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqkeep-alert pqkeep-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($results): ?>
    <section class="pqkeep-card">
      <h2>Deletion Results</h2>
      <div class="pqkeep-scroll">
      <table class="pqkeep-table">
        <thead><tr><th>User ID</th><th>Result</th></tr></thead>
        <tbody>
          <?php foreach ($results as $r): ?>
            <tr><td>#<?php echo (int)$r['userid']; ?></td><td><?php echo $r['ok'] ? '&#10003; ' : '&#10007; '; ?><?php echo s($r['detail']); ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      </div>
    </section>
    <?php endif; ?>

    <section class="pqkeep-card">
      <h2><?php echo count($candidates); ?> account(s) currently match for deletion</h2>
      <?php if (!$candidates): ?>
        <div class="pqkeep-empty">No matching accounts found -- only the keep list remains.</div>
      <?php else: ?>
        <div class="pqkeep-warn">This permanently deletes ALL <?php echo count($candidates); ?> accounts listed below via delete_user(). This cannot be undone.</div>
        <div class="pqkeep-scroll">
        <table class="pqkeep-table">
          <thead><tr><th>User ID</th><th>Username</th><th>Name</th><th>Email</th><th>Account No.</th></tr></thead>
          <tbody>
            <?php foreach ($candidates as $c): ?>
              <tr>
                <td>#<?php echo (int)$c->id; ?></td>
                <td><?php echo s((string)$c->username); ?></td>
                <td><?php echo s(trim($c->firstname . ' ' . $c->lastname)); ?></td>
                <td><?php echo s((string)$c->email); ?></td>
                <td><?php echo s((string)$c->idnumber); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        </div>
        <form method="post" style="margin-top:14px" onsubmit="return confirm('Really permanently delete this batch of accounts? This cannot be undone.');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <p><label>Batch size (accounts to delete per submit):<br>
          <input class="pqkeep-confirm" type="number" name="batchsize" min="1" max="500" value="100"></label></p>
          <p><label>Type <strong>DELETE ALL EXCEPT KEEP LIST</strong> to confirm:<br>
          <input class="pqkeep-confirm" type="text" name="confirmphrase" autocomplete="off" required></label></p>
          <button class="pqkeep-btn pqkeep-btn--danger" type="submit">Delete next batch</button>
        </form>
        <p style="margin-top:10px;color:#5e7280;font-size:12.5px">With <?php echo count($candidates); ?> account(s) currently matching, you'll likely need to submit this form more than once.</p>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
