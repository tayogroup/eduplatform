<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Course cleanup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_english_level_courses.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete English Level 1/2 Courses');
$PAGE->set_heading('Delete English Level 1/2 Courses');
$PAGE->add_body_class('pqceng-page');

/**
 * Explicitly confirmed by the owner: course ids 5 (English Level 1,
 * eng-level-1) and 3 (English Level 2, eng-level-2).
 */
const PQCENG_COURSEIDS = [5, 3];

function pqceng_candidates(): array {
    global $DB;
    [$insql, $params] = $DB->get_in_or_equal(PQCENG_COURSEIDS, SQL_PARAMS_QM);
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.fullname, c.shortname, cc.name AS category
           FROM {course} c
           JOIN {course_categories} cc ON cc.id = c.category
          WHERE c.id $insql
       ORDER BY c.id ASC",
        $params
    ));
}

$message = '';
$error = '';
$results = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        require_once($CFG->dirroot . '/course/lib.php');
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'DELETE COURSES') {
            throw new Exception('Type DELETE COURSES exactly (all caps) to confirm.');
        }
        $candidates = pqceng_candidates();
        foreach ($candidates as $row) {
            $label = $row->shortname . ' (#' . $row->id . ')';
            try {
                $ok = delete_course((int)$row->id, false);
                $results[] = ['courseid' => (int)$row->id, 'ok' => (bool)$ok, 'detail' => $ok ? $label . ' deleted.' : $label . ': delete_course() returned false.'];
            } catch (Throwable $e) {
                $results[] = ['courseid' => (int)$row->id, 'ok' => false, 'detail' => $label . ': ' . $e->getMessage()];
            }
        }
        $okcount = count(array_filter($results, static function ($r) {
            return $r['ok'];
        }));
        $message = $okcount . ' of ' . count($results) . ' course(s) deleted.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$candidates = [];
try {
    $candidates = pqceng_candidates();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqceng-page header,body.pqceng-page footer,body.pqceng-page nav.navbar,body.pqceng-page #page-header,body.pqceng-page #page-footer,body.pqceng-page .drawer,body.pqceng-page .drawer-toggles,body.pqceng-page .block-region,body.pqceng-page [data-region="drawer"],body.pqceng-page [data-region="right-hand-drawer"]{display:none!important}
body.pqceng-page #page,body.pqceng-page #page-content,body.pqceng-page #region-main,body.pqceng-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqceng-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqceng-wrap{max-width:800px;margin:0 auto}.pqceng-top,.pqceng-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqceng-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqceng-title{margin:0;color:#221b22;font-size:26px;line-height:1.08;font-weight:950}.pqceng-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqceng-actions{display:flex;gap:8px;flex-wrap:wrap}.pqceng-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqceng-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqceng-card{padding:18px;margin-bottom:14px}.pqceng-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqceng-alert--ok{background:#edf9ef;color:#245c35}.pqceng-alert--bad{background:#fff0ed;color:#883526}.pqceng-table{width:100%;border-collapse:collapse}.pqceng-table th,.pqceng-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px}.pqceng-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqceng-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqceng-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqceng-confirm{max-width:260px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}
</style>
<main class="pqceng-shell">
  <div class="pqceng-wrap">
    <section class="pqceng-top">
      <div>
        <h1 class="pqceng-title">Delete English Level 1/2 Courses</h1>
        <p class="pqceng-sub">Permanently deletes course ids 5 and 3 via Moodle's own delete_course().</p>
      </div>
      <nav class="pqceng-actions">
        <a class="pqceng-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqceng-alert pqceng-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqceng-alert pqceng-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($results): ?>
    <section class="pqceng-card">
      <h2>Deletion Results</h2>
      <table class="pqceng-table">
        <thead><tr><th>Course ID</th><th>Result</th></tr></thead>
        <tbody>
          <?php foreach ($results as $r): ?>
            <tr><td>#<?php echo (int)$r['courseid']; ?></td><td><?php echo $r['ok'] ? '&#10003; ' : '&#10007; '; ?><?php echo s($r['detail']); ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <?php endif; ?>

    <section class="pqceng-card">
      <h2><?php echo count($candidates); ?> course(s) currently match</h2>
      <?php if (!$candidates): ?>
        <div class="pqceng-empty">No matching courses found -- already deleted.</div>
      <?php else: ?>
        <div class="pqceng-warn">This permanently deletes these <?php echo count($candidates); ?> course(s). This cannot be undone.</div>
        <table class="pqceng-table">
          <thead><tr><th>ID</th><th>Fullname</th><th>Shortname</th><th>Category</th></tr></thead>
          <tbody>
            <?php foreach ($candidates as $c): ?>
              <tr>
                <td>#<?php echo (int)$c->id; ?></td>
                <td><?php echo s((string)$c->fullname); ?></td>
                <td><?php echo s((string)$c->shortname); ?></td>
                <td><?php echo s((string)$c->category); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        <form method="post" style="margin-top:14px" onsubmit="return confirm('Really permanently delete these courses? This cannot be undone.');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <p><label>Type <strong>DELETE COURSES</strong> to confirm:<br>
          <input class="pqceng-confirm" type="text" name="confirmphrase" autocomplete="off" required></label></p>
          <button class="pqceng-btn pqceng-btn--danger" type="submit">Permanently delete these courses</button>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
