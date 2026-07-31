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
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_stray_duplicate_workspaces.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete Stray/Duplicate Workspaces');
$PAGE->set_heading('Delete Stray/Duplicate Workspaces');
$PAGE->add_body_class('pqstray-page');

/**
 * Explicit workspace ids confirmed as test/duplicate debris (not real
 * schools): 14 (Amal Teacher Workspace, a solo-teacher test workspace),
 * 17 (quraan-academy-2, a duplicate of the real Quraan Academy workspace #1
 * from a failed resubmission), and 18-21 (the four stray "Ehel Languages
 * School" duplicates from the earlier duplicate-workspace incident, already
 * archived but never fully purged).
 */
const PQSTRAY_WORKSPACEIDS = [14, 17, 18, 19, 20, 21];

/**
 * Every plugin table with a 'workspaceid' and/or 'consumerid' column,
 * discovered live via Moodle's own DB introspection.
 */
function pqstray_scoped_tables(): array {
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

function pqstray_consumer_ids(array $workspaceids): array {
    global $DB;
    if (!$workspaceids || !pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
    return array_map('intval', $DB->get_fieldset_select('local_prequran_consumer', 'id', "primaryworkspaceid $insql", $params));
}

function pqstray_affected_userids(array $workspaceids): array {
    global $DB;
    if (!$workspaceids || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_QM);
    return array_map('intval', $DB->get_fieldset_select('local_prequran_workspace_member', 'DISTINCT userid', "workspaceid $insql", $params));
}

function pqstray_preview(): array {
    global $DB;
    $workspaceids = array_values(array_filter(PQSTRAY_WORKSPACEIDS, static function ($id) use ($DB) {
        return $DB->record_exists('local_prequran_workspace', ['id' => $id]);
    }));
    $consumerids = pqstray_consumer_ids($workspaceids);
    $rows = [];
    if ($workspaceids || $consumerids) {
        foreach (pqstray_scoped_tables() as $t) {
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
        'userids' => pqstray_affected_userids($workspaceids),
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
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'DELETE STRAY') {
            throw new Exception('Type DELETE STRAY exactly (all caps) to confirm.');
        }
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }
        $preview = pqstray_preview();
        $workspaceids = $preview['workspaceids'];
        $consumerids = $preview['consumerids'];

        // 1. Delete the Moodle accounts (most are likely already deleted --
        //    delete_user() is skipped for those, only run for anything still live).
        foreach ($preview['userids'] as $uid) {
            $targetuser = $DB->get_record('user', ['id' => $uid], '*', IGNORE_MISSING);
            if (!$targetuser) {
                $deleteresults[] = ['label' => "user #$uid", 'ok' => false, 'detail' => 'Not found.'];
                continue;
            }
            if ((int)$targetuser->deleted === 1) {
                continue;
            }
            try {
                $ok = delete_user($targetuser);
                $deleteresults[] = ['label' => $targetuser->username, 'ok' => (bool)$ok, 'detail' => $ok ? 'Account deleted.' : 'delete_user() returned false.'];
            } catch (Throwable $e) {
                $deleteresults[] = ['label' => $targetuser->username, 'ok' => false, 'detail' => $e->getMessage()];
            }
        }

        // 2. Sweep every plugin table scoped by workspaceid/consumerid.
        foreach (pqstray_scoped_tables() as $t) {
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
    $preview = pqstray_preview();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqstray-page header,body.pqstray-page footer,body.pqstray-page nav.navbar,body.pqstray-page #page-header,body.pqstray-page #page-footer,body.pqstray-page .drawer,body.pqstray-page .drawer-toggles,body.pqstray-page .block-region,body.pqstray-page [data-region="drawer"],body.pqstray-page [data-region="right-hand-drawer"]{display:none!important}
body.pqstray-page #page,body.pqstray-page #page-content,body.pqstray-page #region-main,body.pqstray-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqstray-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqstray-wrap{max-width:1100px;margin:0 auto}.pqstray-top,.pqstray-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqstray-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqstray-title{margin:0;color:#221b22;font-size:26px;line-height:1.08;font-weight:950}.pqstray-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqstray-actions{display:flex;gap:8px;flex-wrap:wrap}.pqstray-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqstray-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqstray-card{padding:18px;margin-bottom:14px}.pqstray-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqstray-alert--ok{background:#edf9ef;color:#245c35}.pqstray-alert--bad{background:#fff0ed;color:#883526}.pqstray-table{width:100%;border-collapse:collapse}.pqstray-table th,.pqstray-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px;vertical-align:top}.pqstray-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqstray-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqstray-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqstray-summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px}.pqstray-pill{padding:8px 14px;border-radius:8px;background:#f5f8fb;border:1px solid rgba(23,48,68,.12);font-weight:900}.pqstray-scroll{max-height:420px;overflow:auto;border:1px solid rgba(23,48,68,.1);border-radius:8px}.pqstray-confirm{max-width:260px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}
</style>
<main class="pqstray-shell">
  <div class="pqstray-wrap">
    <section class="pqstray-top">
      <div>
        <h1 class="pqstray-title">Delete Stray/Duplicate Workspaces</h1>
        <p class="pqstray-sub">Permanently deletes workspace ids 14, 17, 18, 19, 20, 21 (Amal Teacher Workspace, the duplicate quraan-academy-2, and the 4 archived stray Ehel Languages School duplicates), their consumer/domain records, and every scoped row across the plugin's tables.</p>
      </div>
      <nav class="pqstray-actions">
        <a class="pqstray-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqstray-alert pqstray-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqstray-alert pqstray-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($deleteresults): ?>
    <section class="pqstray-card">
      <h2>This Pass's Results</h2>
      <div class="pqstray-scroll">
      <table class="pqstray-table">
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

    <section class="pqstray-card">
      <h2>What's Currently There</h2>
      <div class="pqstray-summary">
        <span class="pqstray-pill"><?php echo count($preview['workspaceids'] ?? []); ?> workspace(s): <?php echo s(implode(', ', $preview['workspaceids'] ?? [])); ?></span>
        <span class="pqstray-pill"><?php echo count($preview['consumerids'] ?? []); ?> consumer(s): <?php echo s(implode(', ', $preview['consumerids'] ?? [])); ?></span>
        <span class="pqstray-pill"><?php echo count($preview['userids'] ?? []); ?> member row account(s)</span>
        <span class="pqstray-pill"><?php echo (int)($preview['orggroupcount'] ?? 0); ?> org-group link(s)</span>
      </div>
      <?php if (empty($preview['workspaceids'])): ?>
        <div class="pqstray-empty">None of ids 14, 17, 18, 19, 20, 21 exist anymore. Already cleaned up.</div>
      <?php else: ?>
        <div class="pqstray-warn">This is permanent. There is no undo.</div>
        <h3>Tables with matching rows</h3>
        <div class="pqstray-scroll">
        <table class="pqstray-table">
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
          <p><label>Type <strong>DELETE STRAY</strong> to confirm:<br>
          <input class="pqstray-confirm" type="text" name="confirmphrase" autocomplete="off" required></label></p>
          <button class="pqstray-btn pqstray-btn--danger" type="submit">Delete these workspaces and all associated records</button>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
