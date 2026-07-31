<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Category cleanup access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/delete_huda_school_category.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Delete Huda-school Course Category');
$PAGE->set_heading('Delete Huda-school Course Category');
$PAGE->add_body_class('pqcatdel-page');

const PQCATDEL_CATEGORYID = 8;

function pqcatdel_info(): ?stdClass {
    global $DB;
    $cat = $DB->get_record('course_categories', ['id' => PQCATDEL_CATEGORYID], '*', IGNORE_MISSING);
    if (!$cat) {
        return null;
    }
    $cat->coursecount = (int)$DB->count_records('course', ['category' => PQCATDEL_CATEGORYID]);
    $cat->subcatcount = (int)$DB->count_records('course_categories', ['parent' => PQCATDEL_CATEGORYID]);
    return $cat;
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'DELETE CATEGORY') {
            throw new Exception('Type DELETE CATEGORY exactly (all caps) to confirm.');
        }
        $category = core_course_category::get(PQCATDEL_CATEGORYID, MUST_EXIST, true);
        $category->delete_full(false);
        $message = 'Category #' . PQCATDEL_CATEGORYID . ' ("Huda-school") deleted.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$info = null;
try {
    $info = pqcatdel_info();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqcatdel-page header,body.pqcatdel-page footer,body.pqcatdel-page nav.navbar,body.pqcatdel-page #page-header,body.pqcatdel-page #page-footer,body.pqcatdel-page .drawer,body.pqcatdel-page .drawer-toggles,body.pqcatdel-page .block-region,body.pqcatdel-page [data-region="drawer"],body.pqcatdel-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcatdel-page #page,body.pqcatdel-page #page-content,body.pqcatdel-page #region-main,body.pqcatdel-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcatdel-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcatdel-wrap{max-width:760px;margin:0 auto}.pqcatdel-top,.pqcatdel-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcatdel-top{padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#fff0ed 0%,#fff 62%,#fff7e7 100%)}.pqcatdel-title{margin:0;color:#221b22;font-size:26px;line-height:1.08;font-weight:950}.pqcatdel-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcatdel-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer;margin-top:10px}.pqcatdel-btn--danger{background:#883526;border-color:#883526;color:#fff!important}.pqcatdel-card{padding:18px;margin-bottom:14px}.pqcatdel-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqcatdel-alert--ok{background:#edf9ef;color:#245c35}.pqcatdel-alert--bad{background:#fff0ed;color:#883526}.pqcatdel-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}.pqcatdel-warn{padding:14px;border-radius:8px;background:#fff0ed;color:#883526;font-weight:850;border:1px solid #f2b7a8;margin-bottom:14px}.pqcatdel-confirm{max-width:260px;min-height:40px;border:2px solid #883526;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}.pqcatdel-field{display:block;margin:6px 0 0}
</style>
<main class="pqcatdel-shell">
  <div class="pqcatdel-wrap">
    <section class="pqcatdel-top">
      <h1 class="pqcatdel-title">Delete Huda-school Course Category</h1>
      <p class="pqcatdel-sub">Deletes exactly category id 8 ("Huda-school") via Moodle's own delete_full(). No other category is touched.</p>
      <a class="pqcatdel-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
    </section>

    <?php if ($message !== ''): ?><div class="pqcatdel-alert pqcatdel-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqcatdel-alert pqcatdel-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqcatdel-card">
      <?php if (!$info): ?>
        <div class="pqcatdel-empty">Category #8 no longer exists -- already deleted.</div>
      <?php else: ?>
        <p><strong>Name:</strong> <?php echo s((string)$info->name); ?><br>
        <strong>Courses inside:</strong> <?php echo (int)$info->coursecount; ?><br>
        <strong>Subcategories inside:</strong> <?php echo (int)$info->subcatcount; ?></p>
        <div class="pqcatdel-warn">This permanently deletes category #8 ("Huda-school"). This cannot be undone.</div>
        <form method="post" onsubmit="return confirm('Really permanently delete the Huda-school category? This cannot be undone.');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <label class="pqcatdel-field">Type <strong>DELETE CATEGORY</strong> to confirm:
          <input class="pqcatdel-confirm" type="text" name="confirmphrase" autocomplete="off" required></label>
          <button class="pqcatdel-btn pqcatdel-btn--danger" type="submit">Permanently delete category #8</button>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
