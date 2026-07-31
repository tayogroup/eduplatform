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
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_huda_sqa_courses.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete Huda/SQA Test Courses');
$PAGE->set_heading('Delete Huda/SQA Test Courses');
$PAGE->add_body_class('pqcdel-page');

/**
 * Leftover Huda/SQA-test Moodle courses -- shortname containing "HUDA" or
 * category name starting with "SQA". Confirmed exact match against the
 * owner's own list of 16 course ids (13-28) before this tool was built.
 */
function pqcdel_candidates(): array {
    global $DB;
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.fullname, c.shortname, cc.name AS category
           FROM {course} c
           JOIN {course_categories} cc ON cc.id = c.category
          WHERE c.id <> 1
            AND (c.shortname LIKE '%HUDA%' OR cc.name LIKE 'SQA%')
       ORDER BY c.id ASC"
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
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }
        $candidates = pqcdel_candidates();
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
    $candidates = pqcdel_candidates();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqcdel-page header,body.pqcdel-page footer,body.pqcdel-page nav.navbar,body.pqcdel-page #page-header,body.pqcdel-page #page-footer,body.pqcdel-page .drawer,body.pqcdel-page .drawer-toggles,body.pqcdel-page .block-region,body.pqcdel-page [data-region="drawer"],body.pqcdel-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcdel-page #page,body.pqcdel-page #page-content,body.pqcdel-page #region-main,body.pqcdel-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcdel-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcdel-wrap{max-width:1000px;margin:0 auto}.pqcdel-top,.pqcdel-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcdel-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqcdel-title{margin:0;color:#221b22;font-size:28px;line-height:1.08;font-weight:950}.pqcdel-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcdel-actions{display:flex;gap:8px;flex-wrap:wrap}.pqcdel-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqcdel-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqcdel-card{padding:18px;margin-bottom:14px}.pqcdel-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqcdel-alert--ok{background:#edf9ef;color:#245c35}.pqcdel-alert--bad{background:#fff0ed;color:#883526}.pqcdel-table{width:100%;border-collapse:collapse}.pqcdel-table th,.pqcdel-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px;vertical-align:top}.pqcdel-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqcdel-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqcdel-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqcdel-scroll{max-height:480px;overflow:auto;border:1px solid rgba(23,48,68,.1);border-radius:8px}.pqcdel-confirm{max-width:260px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}
</style>
<main class="pqcdel-shell">
  <div class="pqcdel-wrap">
    <section class="pqcdel-top">
      <div>
        <h1 class="pqcdel-title">Delete Huda/SQA Test Courses</h1>
        <p class="pqcdel-sub">Permanently deletes every Moodle course whose shortname contains "HUDA" or whose category name starts with "SQA", via Moodle's own delete_course() -- sections, activities, enrollments, grades, and files all get cleaned up properly.</p>
      </div>
      <nav class="pqcdel-actions">
        <a class="pqcdel-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqcdel-alert pqcdel-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqcdel-alert pqcdel-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($results): ?>
    <section class="pqcdel-card">
      <h2>Deletion Results</h2>
      <table class="pqcdel-table">
        <thead><tr><th>Course ID</th><th>Result</th></tr></thead>
        <tbody>
          <?php foreach ($results as $r): ?>
            <tr><td>#<?php echo (int)$r['courseid']; ?></td><td><?php echo $r['ok'] ? '&#10003; ' : '&#10007; '; ?><?php echo s($r['detail']); ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <?php endif; ?>

    <section class="pqcdel-card">
      <h2><?php echo count($candidates); ?> course(s) currently match</h2>
      <?php if (!$candidates): ?>
        <div class="pqcdel-empty">No matching courses found -- already cleaned up.</div>
      <?php else: ?>
        <div class="pqcdel-warn">This permanently deletes ALL <?php echo count($candidates); ?> courses below. This cannot be undone.</div>
        <div class="pqcdel-scroll">
        <table class="pqcdel-table">
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
        </div>
        <form method="post" style="margin-top:14px" onsubmit="return confirm('Really permanently delete all <?php echo count($candidates); ?> listed courses? This cannot be undone.');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <p><label>Type <strong>DELETE COURSES</strong> to confirm:<br>
          <input class="pqcdel-confirm" type="text" name="confirmphrase" autocomplete="off" required></label></p>
          <button class="pqcdel-btn pqcdel-btn--danger" type="submit">Permanently delete all <?php echo count($candidates); ?> courses</button>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
