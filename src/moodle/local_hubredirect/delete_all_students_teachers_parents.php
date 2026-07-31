<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Full student/teacher/parent cleanup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_all_students_teachers_parents.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete All Students, Teachers, and Parents');
$PAGE->set_heading('Delete All Students, Teachers, and Parents');
$PAGE->add_body_class('pqwipe-page');

const PQWIPE_ROLES = ['student', 'teacher', 'assistant_teacher', 'parent'];

/**
 * Every account currently holding an active student/teacher/assistant_teacher
 * /parent role in ANY workspace -- no naming/pattern filter this time, since
 * the owner confirmed there is no real data in the system yet. Accounts
 * whose only roles are owner/admin/coordinator/registrar/finance/support/
 * auditor/sponsor are never included, matching "keep all other roles".
 */
const PQWIPE_PROTECTED_ROLES = ['owner', 'admin', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor'];

function pqwipe_candidates(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    $candidates = [];

    // A. Accounts holding an active student/teacher/assistant_teacher/parent role today.
    [$insql, $params] = $DB->get_in_or_equal(PQWIPE_ROLES, SQL_PARAMS_NAMED, 'role');
    $sql = "SELECT DISTINCT u.id, u.username, u.email, u.firstname, u.lastname, u.idnumber
              FROM {user} u
              JOIN {local_prequran_workspace_member} wm ON wm.userid = u.id AND wm.status = 'active'
             WHERE u.deleted = 0
               AND u.id > 1
               AND wm.workspace_role $insql";
    foreach ($DB->get_records_sql($sql, $params) as $row) {
        $candidates[(int)$row->id] = $row;
    }

    // B. Leftover test-fixture accounts named like a student/teacher/parent that
    //    never picked up an active workspace role at all (so bucket A above
    //    never catches them). Explicitly excludes anyone currently holding a
    //    protected role (owner/admin/etc.) regardless of what their username
    //    says -- e.g. an account named "teacher.something" that is actually an
    //    active admin on a real or test workspace is left alone here.
    [$protectedsql, $protectedparams] = $DB->get_in_or_equal(PQWIPE_PROTECTED_ROLES, SQL_PARAMS_NAMED, 'protectedrole');
    $namesql = "SELECT u.id, u.username, u.email, u.firstname, u.lastname, u.idnumber
                  FROM {user} u
                 WHERE u.deleted = 0
                   AND u.id > 1
                   AND (LOWER(u.username) LIKE '%student%' OR LOWER(u.username) LIKE '%teacher%' OR LOWER(u.username) LIKE '%parent%')
                   AND NOT EXISTS (
                       SELECT 1
                         FROM {local_prequran_workspace_member} wm2
                        WHERE wm2.userid = u.id AND wm2.status = 'active' AND wm2.workspace_role $protectedsql
                   )";
    foreach ($DB->get_records_sql($namesql, $protectedparams) as $row) {
        $candidates[(int)$row->id] = $row;
    }

    ksort($candidates);
    return array_values($candidates);
}

function pqwipe_role_breakdown(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal(PQWIPE_ROLES, SQL_PARAMS_NAMED, 'role');
    return $DB->get_records_sql_menu(
        "SELECT wm.workspace_role, COUNT(DISTINCT wm.userid) AS cnt
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.status = 'active' AND u.deleted = 0 AND u.id > 1 AND wm.workspace_role $insql
       GROUP BY wm.workspace_role",
        $params
    );
}

$message = '';
$error = '';
$results = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        require_once($CFG->dirroot . '/user/lib.php');
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'DELETE ALL') {
            throw new Exception('Type DELETE ALL exactly (all caps) to confirm.');
        }
        $batchsize = max(1, min(500, optional_param('batchsize', 100, PARAM_INT)));
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }
        $candidates = array_slice(pqwipe_candidates(), 0, $batchsize);
        foreach ($candidates as $row) {
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
        $remainingafter = count(pqwipe_candidates());
        $message = $okcount . ' of ' . count($results) . ' account(s) in this batch deleted. '
            . ($remainingafter > 0
                ? $remainingafter . ' account(s) still remain -- submit the form again (as many times as needed) to keep deleting in batches.'
                : 'No matching accounts remain.');
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$candidates = [];
$breakdown = [];
try {
    $candidates = pqwipe_candidates();
    $breakdown = pqwipe_role_breakdown();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqwipe-page header,body.pqwipe-page footer,body.pqwipe-page nav.navbar,body.pqwipe-page #page-header,body.pqwipe-page #page-footer,body.pqwipe-page .drawer,body.pqwipe-page .drawer-toggles,body.pqwipe-page .block-region,body.pqwipe-page [data-region="drawer"],body.pqwipe-page [data-region="right-hand-drawer"]{display:none!important}
body.pqwipe-page #page,body.pqwipe-page #page-content,body.pqwipe-page #region-main,body.pqwipe-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwipe-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwipe-wrap{max-width:1100px;margin:0 auto}.pqwipe-top,.pqwipe-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwipe-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqwipe-title{margin:0;color:#221b22;font-size:28px;line-height:1.08;font-weight:950}.pqwipe-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwipe-actions{display:flex;gap:8px;flex-wrap:wrap}.pqwipe-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwipe-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqwipe-card{padding:18px;margin-bottom:14px}.pqwipe-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqwipe-alert--ok{background:#edf9ef;color:#245c35}.pqwipe-alert--bad{background:#fff0ed;color:#883526}.pqwipe-table{width:100%;border-collapse:collapse}.pqwipe-table th,.pqwipe-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px;vertical-align:top}.pqwipe-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwipe-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqwipe-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqwipe-summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px}.pqwipe-pill{padding:8px 14px;border-radius:8px;background:#f5f8fb;border:1px solid rgba(23,48,68,.12);font-weight:900}.pqwipe-scroll{max-height:520px;overflow:auto;border:1px solid rgba(23,48,68,.1);border-radius:8px}.pqwipe-confirm{max-width:260px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}
</style>
<main class="pqwipe-shell">
  <div class="pqwipe-wrap">
    <section class="pqwipe-top">
      <div>
        <h1 class="pqwipe-title">Delete All Students, Teachers, and Parents</h1>
        <p class="pqwipe-sub">Permanently deletes every account holding an active student, teacher, assistant teacher, or parent role in any workspace, plus any leftover account named like a student/teacher/parent that never picked up an active role at all. Any account currently holding an owner/admin/coordinator/registrar/finance/support/auditor/sponsor role is never touched, even if its username matches.</p>
      </div>
      <nav class="pqwipe-actions">
        <a class="pqwipe-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqwipe-alert pqwipe-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqwipe-alert pqwipe-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($results): ?>
    <section class="pqwipe-card">
      <h2>Deletion Results</h2>
      <div class="pqwipe-scroll">
      <table class="pqwipe-table">
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

    <section class="pqwipe-card">
      <h2><?php echo count($candidates); ?> account(s) currently match</h2>
      <div class="pqwipe-summary">
        <?php foreach ($breakdown as $role => $cnt): ?>
          <span class="pqwipe-pill"><?php echo (int)$cnt; ?> <?php echo s($role); ?></span>
        <?php endforeach; ?>
      </div>
      <?php if (!$candidates): ?>
        <div class="pqwipe-empty">No matching accounts found.</div>
      <?php else: ?>
        <div class="pqwipe-warn">This permanently deletes ALL <?php echo count($candidates); ?> accounts listed below via delete_user() -- unenrolls every course, removes every role assignment, and marks each account deleted. This cannot be undone. Only proceed if you're certain none of this is real data.</div>
        <div class="pqwipe-scroll">
        <table class="pqwipe-table">
          <thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Account No.</th></tr></thead>
          <tbody>
            <?php foreach ($candidates as $c): ?>
              <tr>
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
          <p><label>Batch size (accounts to delete per submit -- keep this modest to avoid a server timeout on large totals):<br>
          <input class="pqwipe-confirm" type="number" name="batchsize" min="1" max="500" value="100"></label></p>
          <p><label>Type <strong>DELETE ALL</strong> to confirm:<br>
          <input class="pqwipe-confirm" type="text" name="confirmphrase" autocomplete="off" required></label></p>
          <button class="pqwipe-btn pqwipe-btn--danger" type="submit">Delete next batch (up to the batch size above)</button>
        </form>
        <p style="margin-top:10px;color:#5e7280;font-size:12.5px">With <?php echo count($candidates); ?> account(s) currently matching, you may need to submit this form more than once -- each submit re-checks what's left and only processes one batch.</p>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
