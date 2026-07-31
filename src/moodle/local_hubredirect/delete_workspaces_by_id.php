<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Workspace cleanup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_workspaces_by_id.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete Workspaces Completely (Test Institute + Somali University)');
$PAGE->set_heading('Delete Workspaces Completely (Test Institute + Somali University)');
$PAGE->add_body_class('pqwsdel-page');

/**
 * Explicit workspace ids confirmed leftover from earlier cleanup passes:
 * workspace 2 (Test Institute) and workspace 15 (Somali University). Their
 * only members were already Moodle-deleted (visible from the ".timestamp"
 * suffix delete_user() stamps on username/email), but the custom
 * local_prequran_workspace_member rows and the workspace/consumer records
 * themselves were never touched by that account-only cleanup.
 */
const PQWSDEL_WORKSPACEIDS = [2, 15];

/**
 * Every plugin table with a 'workspaceid' and/or 'consumerid' column,
 * discovered live via Moodle's own DB introspection.
 */
function pqwsdel_scoped_tables(): array {
    global $DB;
    $tables = [];
    foreach ($DB->get_tables(false) as $tablename) {
        if (strpos($tablename, 'local_prequran_') !== 0 && strpos($tablename, 'local_hubredirect_') !== 0) {
            continue;
        }
        $columns = $DB->get_columns($tablename);
        $haswork = isset($columns['workspaceid']);
        $hasconsumer = isset($columns['consumerid']);
        if ($haswork || $hasconsumer) {
            $tables[] = ['table' => $tablename, 'hasworkspaceid' => $haswork, 'hasconsumerid' => $hasconsumer];
        }
    }
    return $tables;
}

function pqwsdel_consumer_ids(array $workspaceids): array {
    global $DB;
    if (!$workspaceids || !pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
    return array_map('intval', $DB->get_fieldset_select('local_prequran_consumer', 'id', "primaryworkspaceid $insql", $params));
}

function pqwsdel_affected_userids(array $workspaceids): array {
    global $DB;
    if (!$workspaceids || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
    return array_map('intval', $DB->get_fieldset_select('local_prequran_workspace_member', 'DISTINCT userid', "workspaceid $insql", $params));
}

function pqwsdel_preview(): array {
    global $DB;
    $workspaceids = array_values(array_filter(PQWSDEL_WORKSPACEIDS, static function ($id) use ($DB) {
        return $DB->record_exists('local_prequran_workspace', ['id' => $id]);
    }));
    $consumerids = pqwsdel_consumer_ids($workspaceids);
    $rows = [];
    if ($workspaceids || $consumerids) {
        foreach (pqwsdel_scoped_tables() as $t) {
            $conditions = [];
            $params = [];
            if ($t['hasworkspaceid'] && $workspaceids) {
                [$insql, $inparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
                $conditions[] = "workspaceid $insql";
                $params = array_merge($params, $inparams);
            }
            if ($t['hasconsumerid'] && $consumerids) {
                [$insql, $inparams] = $DB->get_in_or_equal($consumerids, SQL_PARAMS_QM);
                $conditions[] = "consumerid $insql";
                $params = array_merge($params, $inparams);
            }
            if (!$conditions) {
                continue;
            }
            $count = (int)$DB->count_records_select($t['table'], implode(' OR ', $conditions), $params);
            if ($count > 0) {
                $rows[] = ['table' => $t['table'], 'count' => $count];
            }
        }
    }
    $orggroupcount = 0;
    if ($workspaceids && pqh_table_exists_safe('local_prequran_org_group_member')) {
        [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
        array_unshift($params, 'workspace');
        $orggroupcount = (int)$DB->count_records_select('local_prequran_org_group_member', "member_type = ? AND memberid $insql", $params);
    }
    return [
        'workspaceids' => $workspaceids,
        'consumerids' => $consumerids,
        'userids' => pqwsdel_affected_userids($workspaceids),
        'tablerows' => $rows,
        'orggroupcount' => $orggroupcount,
    ];
}

$message = '';
$error = '';
$deleteresults = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        require_once($CFG->dirroot . '/user/lib.php');
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'DELETE WORKSPACES') {
            throw new Exception('Type DELETE WORKSPACES exactly (all caps) to confirm.');
        }
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }
        $preview = pqwsdel_preview();
        $workspaceids = $preview['workspaceids'];
        $consumerids = $preview['consumerids'];

        // 1. Delete the Moodle accounts (most are likely already deleted from
        //    an earlier pass -- delete_user() safely no-ops on those).
        $userbatch = optional_param('userbatch', 200, PARAM_INT);
        $userbatch = max(1, min(1000, $userbatch));
        $userids = array_slice($preview['userids'], 0, $userbatch);
        foreach ($userids as $uid) {
            $targetuser = $DB->get_record('user', ['id' => $uid], '*', IGNORE_MISSING);
            if (!$targetuser) {
                $deleteresults[] = ['label' => "user #$uid", 'ok' => false, 'detail' => 'Not found.'];
                continue;
            }
            if ((int)$targetuser->deleted === 1) {
                continue; // already deleted in an earlier pass, nothing to do
            }
            try {
                $ok = delete_user($targetuser);
                $deleteresults[] = ['label' => $targetuser->username, 'ok' => (bool)$ok, 'detail' => $ok ? 'Account deleted.' : 'delete_user() returned false.'];
            } catch (Throwable $e) {
                $deleteresults[] = ['label' => $targetuser->username, 'ok' => false, 'detail' => $e->getMessage()];
            }
        }

        // 2. Sweep every plugin table scoped by workspaceid/consumerid.
        foreach (pqwsdel_scoped_tables() as $t) {
            $conditions = [];
            $params = [];
            if ($t['hasworkspaceid'] && $workspaceids) {
                [$insql, $inparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
                $conditions[] = "workspaceid $insql";
                $params = array_merge($params, $inparams);
            }
            if ($t['hasconsumerid'] && $consumerids) {
                [$insql, $inparams] = $DB->get_in_or_equal($consumerids, SQL_PARAMS_QM);
                $conditions[] = "consumerid $insql";
                $params = array_merge($params, $inparams);
            }
            if (!$conditions) {
                continue;
            }
            try {
                $affected = (int)$DB->count_records_select($t['table'], implode(' OR ', $conditions), $params);
                if ($affected > 0) {
                    $DB->delete_records_select($t['table'], implode(' OR ', $conditions), $params);
                    $deleteresults[] = ['label' => 'table ' . $t['table'], 'ok' => true, 'detail' => "$affected row(s) deleted."];
                }
            } catch (Throwable $e) {
                $deleteresults[] = ['label' => 'table ' . $t['table'], 'ok' => false, 'detail' => $e->getMessage()];
            }
        }

        // 3. Org group membership rows referencing these workspaces directly.
        if ($workspaceids && pqh_table_exists_safe('local_prequran_org_group_member')) {
            [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
            array_unshift($params, 'workspace');
            $affected = (int)$DB->count_records_select('local_prequran_org_group_member', "member_type = ? AND memberid $insql", $params);
            if ($affected > 0) {
                $DB->delete_records_select('local_prequran_org_group_member', "member_type = ? AND memberid $insql", $params);
                $deleteresults[] = ['label' => 'table local_prequran_org_group_member (workspace links)', 'ok' => true, 'detail' => "$affected row(s) deleted."];
            }
        }

        // 4. The consumer record(s), then the workspace record(s) themselves, last.
        if ($consumerids && pqh_table_exists_safe('local_prequran_consumer')) {
            [$insql, $params] = $DB->get_in_or_equal($consumerids, SQL_PARAMS_QM);
            $DB->delete_records_select('local_prequran_consumer', "id $insql", $params);
            $deleteresults[] = ['label' => 'table local_prequran_consumer', 'ok' => true, 'detail' => count($consumerids) . ' row(s) deleted.'];
        }
        if ($workspaceids && pqh_table_exists_safe('local_prequran_workspace')) {
            [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
            $DB->delete_records_select('local_prequran_workspace', "id $insql", $params);
            $deleteresults[] = ['label' => 'table local_prequran_workspace', 'ok' => true, 'detail' => count($workspaceids) . ' row(s) deleted.'];
        }

        $message = 'Cleanup pass complete. Reload this page to see what (if anything) still remains.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$preview = [];
try {
    $preview = pqwsdel_preview();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqwsdel-page header,body.pqwsdel-page footer,body.pqwsdel-page nav.navbar,body.pqwsdel-page #page-header,body.pqwsdel-page #page-footer,body.pqwsdel-page .drawer,body.pqwsdel-page .drawer-toggles,body.pqwsdel-page .block-region,body.pqwsdel-page [data-region="drawer"],body.pqwsdel-page [data-region="right-hand-drawer"]{display:none!important}
body.pqwsdel-page #page,body.pqwsdel-page #page-content,body.pqwsdel-page #region-main,body.pqwsdel-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwsdel-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwsdel-wrap{max-width:1100px;margin:0 auto}.pqwsdel-top,.pqwsdel-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwsdel-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqwsdel-title{margin:0;color:#221b22;font-size:26px;line-height:1.08;font-weight:950}.pqwsdel-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwsdel-actions{display:flex;gap:8px;flex-wrap:wrap}.pqwsdel-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwsdel-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqwsdel-card{padding:18px;margin-bottom:14px}.pqwsdel-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqwsdel-alert--ok{background:#edf9ef;color:#245c35}.pqwsdel-alert--bad{background:#fff0ed;color:#883526}.pqwsdel-table{width:100%;border-collapse:collapse}.pqwsdel-table th,.pqwsdel-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px;vertical-align:top}.pqwsdel-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwsdel-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqwsdel-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqwsdel-summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px}.pqwsdel-pill{padding:8px 14px;border-radius:8px;background:#f5f8fb;border:1px solid rgba(23,48,68,.12);font-weight:900}.pqwsdel-scroll{max-height:420px;overflow:auto;border:1px solid rgba(23,48,68,.1);border-radius:8px}.pqwsdel-confirm{max-width:260px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}
</style>
<main class="pqwsdel-shell">
  <div class="pqwsdel-wrap">
    <section class="pqwsdel-top">
      <div>
        <h1 class="pqwsdel-title">Delete Test Institute + Somali University Completely</h1>
        <p class="pqwsdel-sub">Permanently deletes workspace ids 2 and 15, their consumer/domain records, every account tied to them (most already Moodle-deleted), every org-group link, and every row in any plugin table scoped by workspaceid/consumerid.</p>
      </div>
      <nav class="pqwsdel-actions">
        <a class="pqwsdel-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqwsdel-alert pqwsdel-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqwsdel-alert pqwsdel-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($deleteresults): ?>
    <section class="pqwsdel-card">
      <h2>This Pass's Results</h2>
      <div class="pqwsdel-scroll">
      <table class="pqwsdel-table">
        <thead><tr><th>Item</th><th>Result</th></tr></thead>
        <tbody>
          <?php foreach ($deleteresults as $r): ?>
            <tr><td><?php echo s($r['label']); ?></td><td><?php echo $r['ok'] ? '&#10003; ' : '&#10007; '; ?><?php echo s($r['detail']); ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      </div>
    </section>
    <?php endif; ?>

    <section class="pqwsdel-card">
      <h2>What's Currently There</h2>
      <div class="pqwsdel-summary">
        <span class="pqwsdel-pill"><?php echo count($preview['workspaceids'] ?? []); ?> workspace(s): <?php echo s(implode(', ', $preview['workspaceids'] ?? [])); ?></span>
        <span class="pqwsdel-pill"><?php echo count($preview['consumerids'] ?? []); ?> consumer(s): <?php echo s(implode(', ', $preview['consumerids'] ?? [])); ?></span>
        <span class="pqwsdel-pill"><?php echo count($preview['userids'] ?? []); ?> member row account(s)</span>
        <span class="pqwsdel-pill"><?php echo (int)($preview['orggroupcount'] ?? 0); ?> org-group link(s)</span>
      </div>
      <?php if (empty($preview['workspaceids'])): ?>
        <div class="pqwsdel-empty">Neither workspace 2 nor 15 exists anymore. Already cleaned up.</div>
      <?php else: ?>
        <div class="pqwsdel-warn">This is permanent and cascades through every scoped table below. There is no undo.</div>
        <h3>Tables with matching rows</h3>
        <div class="pqwsdel-scroll">
        <table class="pqwsdel-table">
          <thead><tr><th>Table</th><th>Matching rows</th></tr></thead>
          <tbody>
            <?php foreach (($preview['tablerows'] ?? []) as $tr): ?>
              <tr><td><?php echo s($tr['table']); ?></td><td><?php echo (int)$tr['count']; ?></td></tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        </div>
        <form method="post" style="margin-top:14px" onsubmit="return confirm('Really permanently delete these workspaces and everything listed above? This cannot be undone.');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <p><label>Accounts to process per submit:<br>
          <input class="pqwsdel-confirm" type="number" name="userbatch" min="1" max="1000" value="200"></label></p>
          <p><label>Type <strong>DELETE WORKSPACES</strong> to confirm:<br>
          <input class="pqwsdel-confirm" type="text" name="confirmphrase" autocomplete="off" required></label></p>
          <button class="pqwsdel-btn pqwsdel-btn--danger" type="submit">Delete these workspaces and all associated records</button>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
