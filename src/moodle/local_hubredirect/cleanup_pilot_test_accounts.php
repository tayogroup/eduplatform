<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Pilot/test account cleanup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/cleanup_pilot_test_accounts.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Clean Up Pilot/Test Accounts');
$PAGE->set_heading('Clean Up Pilot/Test Accounts');
$PAGE->add_body_class('pqcleanup-page');

/**
 * Matches the exact criteria confirmed with the owner: username contains
 * 'pilot', username starts with 'qa-', email is on a known test-only domain
 * (example.com / *.example.com), or the account is formally tagged with the
 * platform's own 'sqa_tester' Moodle role -- AND currently holds at least
 * one active student/teacher/assistant_teacher workspace role. Accounts
 * matching the test/pilot signals but holding only other roles (e.g. an
 * admin/owner account) are deliberately excluded, per "keep all other
 * roles". Accounts with no active workspace role at all (dangling test
 * fixtures such as a QA-suite login) are also excluded -- there is no
 * student/teacher role on them to justify deleting the whole account.
 */
function pqcleanup_candidates(): array {
    global $DB, $CFG;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    $sql = "SELECT DISTINCT u.id, u.username, u.email, u.firstname, u.lastname, u.idnumber
              FROM {user} u
              JOIN {local_prequran_workspace_member} wm ON wm.userid = u.id AND wm.status = 'active'
             WHERE u.deleted = 0
               AND u.mnethostid = :mnethostid
               AND wm.workspace_role IN ('student', 'teacher', 'assistant_teacher')
               AND (
                     u.username LIKE '%pilot%'
                  OR u.username LIKE 'qa-%'
                  OR u.email LIKE '%@ehel.example.com'
                  OR u.email LIKE '%@example.com'
                  OR EXISTS (
                      SELECT 1
                        FROM {role_assignments} ra
                        JOIN {role} r ON r.id = ra.roleid
                       WHERE ra.userid = u.id AND r.shortname = 'sqa_tester'
                  )
               )
          ORDER BY u.username ASC";
    $rows = $DB->get_records_sql($sql, ['mnethostid' => $CFG->mnet_localhost_id]);
    $candidates = [];
    foreach ($rows as $row) {
        $roles = $DB->get_records_sql(
            "SELECT DISTINCT wm.workspace_role, w.name AS workspacename
               FROM {local_prequran_workspace_member} wm
               JOIN {local_prequran_workspace} w ON w.id = wm.workspaceid
              WHERE wm.userid = :userid AND wm.status = 'active'
           ORDER BY wm.workspace_role ASC",
            ['userid' => $row->id]
        );
        $candidates[] = [
            'userid' => (int)$row->id,
            'username' => (string)$row->username,
            'email' => (string)$row->email,
            'name' => trim($row->firstname . ' ' . $row->lastname),
            'accountno' => (string)$row->idnumber,
            'roles' => array_map(static function ($r) {
                return $r->workspace_role . ' @ ' . $r->workspacename;
            }, array_values($roles)),
        ];
    }
    return $candidates;
}

$message = '';
$error = '';
$results = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        require_once($CFG->dirroot . '/user/lib.php');
        $confirmedids = optional_param_array('userid', [], PARAM_INT);
        $candidates = pqcleanup_candidates();
        $candidateids = array_column($candidates, 'userid');
        $todelete = array_intersect(array_map('intval', $confirmedids), $candidateids);
        foreach ($todelete as $targetid) {
            $targetuser = $DB->get_record('user', ['id' => (int)$targetid], '*', IGNORE_MISSING);
            if (!$targetuser) {
                $results[] = ['userid' => $targetid, 'ok' => false, 'detail' => 'User record not found.'];
                continue;
            }
            $label = $targetuser->username;
            try {
                $ok = delete_user($targetuser);
                $results[] = ['userid' => $targetid, 'ok' => (bool)$ok, 'detail' => $ok ? $label . ' deleted.' : $label . ': delete_user() returned false.'];
            } catch (Throwable $e) {
                $results[] = ['userid' => $targetid, 'ok' => false, 'detail' => $label . ': ' . $e->getMessage()];
            }
        }
        $okcount = count(array_filter($results, static function ($r) {
            return $r['ok'];
        }));
        $message = $okcount . ' of ' . count($results) . ' selected account(s) deleted.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$candidates = [];
try {
    $candidates = pqcleanup_candidates();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqcleanup-page header,body.pqcleanup-page footer,body.pqcleanup-page nav.navbar,body.pqcleanup-page #page-header,body.pqcleanup-page #page-footer,body.pqcleanup-page .drawer,body.pqcleanup-page .drawer-toggles,body.pqcleanup-page .block-region,body.pqcleanup-page [data-region="drawer"],body.pqcleanup-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcleanup-page #page,body.pqcleanup-page #page-content,body.pqcleanup-page #region-main,body.pqcleanup-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcleanup-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcleanup-wrap{max-width:1100px;margin:0 auto}.pqcleanup-top,.pqcleanup-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcleanup-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqcleanup-title{margin:0;color:#221b22;font-size:28px;line-height:1.08;font-weight:950}.pqcleanup-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcleanup-actions{display:flex;gap:8px;flex-wrap:wrap}.pqcleanup-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqcleanup-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqcleanup-card{padding:18px;margin-bottom:14px}.pqcleanup-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqcleanup-alert--ok{background:#edf9ef;color:#245c35}.pqcleanup-alert--bad{background:#fff0ed;color:#883526}.pqcleanup-table{width:100%;border-collapse:collapse}.pqcleanup-table th,.pqcleanup-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:13px;vertical-align:top}.pqcleanup-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqcleanup-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqcleanup-warn{padding:12px 14px;border-radius:8px;background:#fff7e7;color:#7a5637;font-weight:800;border:1px solid #f2cda8;margin-bottom:14px}.pqcleanup-roles{font-size:11.5px;color:#5e7280}
</style>
<main class="pqcleanup-shell">
  <div class="pqcleanup-wrap">
    <section class="pqcleanup-top">
      <div>
        <h1 class="pqcleanup-title">Clean Up Pilot/Test Accounts</h1>
        <p class="pqcleanup-sub">Permanently delete accounts matching test/pilot signals that currently hold an active student, teacher, or assistant teacher role. Accounts whose only roles are owner/admin/parent/etc. are never included.</p>
      </div>
      <nav class="pqcleanup-actions">
        <a class="pqcleanup-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqcleanup-alert pqcleanup-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqcleanup-alert pqcleanup-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($results): ?>
    <section class="pqcleanup-card">
      <h2>Deletion Results</h2>
      <table class="pqcleanup-table">
        <thead><tr><th>User ID</th><th>Result</th></tr></thead>
        <tbody>
          <?php foreach ($results as $r): ?>
            <tr><td>#<?php echo (int)$r['userid']; ?></td><td><?php echo $r['ok'] ? '&#10003; ' : '&#10007; '; ?><?php echo s($r['detail']); ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <?php endif; ?>

    <section class="pqcleanup-card">
      <h2><?php echo count($candidates); ?> account(s) currently match</h2>
      <?php if (!$candidates): ?>
        <div class="pqcleanup-empty">No matching accounts found. Either they were already cleaned up, or nothing currently matches the criteria.</div>
      <?php else: ?>
        <div class="pqcleanup-warn">This permanently deletes these Moodle accounts via delete_user() -- unenrolls them from every course, removes every role assignment, and marks the account deleted. This cannot be undone from this page. Review the list below carefully before confirming.</div>
        <form method="post" onsubmit="return confirm('Permanently delete all checked accounts? This cannot be undone.');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <table class="pqcleanup-table">
            <thead><tr><th style="width:28px"></th><th>Username</th><th>Name</th><th>Email</th><th>Account No.</th><th>Active roles</th></tr></thead>
            <tbody>
              <?php foreach ($candidates as $c): ?>
                <tr>
                  <td><input type="checkbox" name="userid[]" value="<?php echo (int)$c['userid']; ?>" checked></td>
                  <td><?php echo s($c['username']); ?></td>
                  <td><?php echo s($c['name']); ?></td>
                  <td><?php echo s($c['email']); ?></td>
                  <td><?php echo s($c['accountno']); ?></td>
                  <td class="pqcleanup-roles"><?php echo s(implode(' | ', $c['roles'])); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
          <p style="margin-top:14px"><button class="pqcleanup-btn pqcleanup-btn--danger" type="submit">Permanently delete checked accounts</button></p>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
