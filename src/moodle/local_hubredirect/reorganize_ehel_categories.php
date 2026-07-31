<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can run this cleanup.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Category reorganization access required'
    );
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/reorganize_ehel_categories.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Reorganize Ehel Course Categories');
$PAGE->set_heading('Reorganize Ehel Course Categories');
$PAGE->add_body_class('pqehucat-page');

const PQEHUCAT_EHEL_ACADEMY = 14;
const PQEHUCAT_OLD_EHEL_PRIMARY = 9;
const PQEHUCAT_PRIMARY = 15;
const PQEHUCAT_LOWER_SECONDARY = 17;
const PQEHUCAT_OLD_EMPTY_CHILDREN = [13, 10, 11, 12]; // Grade 1, English, Math, Science under the old shell -- delete children before parents
const PQEHUCAT_LANGUAGE_SUBCATS = ['English', 'Arabic', 'Kiswahili', 'Somali'];

function pqehucat_plan(): array {
    global $DB;
    $steps = [];
    $steps['ehel_academy_exists'] = $DB->record_exists('course_categories', ['id' => PQEHUCAT_EHEL_ACADEMY]);
    $steps['old_shell_exists'] = $DB->record_exists('course_categories', ['id' => PQEHUCAT_OLD_EHEL_PRIMARY]);
    $steps['primary_exists'] = $DB->record_exists('course_categories', ['id' => PQEHUCAT_PRIMARY]);
    $steps['lower_secondary_exists'] = $DB->record_exists('course_categories', ['id' => PQEHUCAT_LOWER_SECONDARY]);
    $steps['language_school_exists'] = $DB->record_exists('course_categories', ['name' => 'Ehel Languages School', 'parent' => PQEHUCAT_EHEL_ACADEMY]);
    return $steps;
}

$message = '';
$error = '';
$results = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (trim((string)optional_param('confirmphrase', '', PARAM_TEXT)) !== 'REORGANIZE') {
            throw new Exception('Type REORGANIZE exactly (all caps) to confirm.');
        }

        $ehelacademy = core_course_category::get(PQEHUCAT_EHEL_ACADEMY, MUST_EXIST, true);

        // 1. Rename category 9 to "Ehel K-12 School" and reparent under Ehel Academy.
        $k12 = core_course_category::get(PQEHUCAT_OLD_EHEL_PRIMARY, MUST_EXIST, true);
        $k12->update(['name' => 'Ehel K-12 School']);
        $k12 = core_course_category::get(PQEHUCAT_OLD_EHEL_PRIMARY, MUST_EXIST, true);
        $k12->change_parent($ehelacademy);
        $results[] = ['label' => 'Category 9 renamed to "Ehel K-12 School" and moved under Ehel Academy', 'ok' => true, 'detail' => ''];

        // 2. Move Primary (15) and Lower Secondary (17) under the renamed category 9.
        $k12 = core_course_category::get(PQEHUCAT_OLD_EHEL_PRIMARY, MUST_EXIST, true);
        $primary = core_course_category::get(PQEHUCAT_PRIMARY, MUST_EXIST, true);
        $primary->change_parent($k12);
        $results[] = ['label' => '"Primary" (15) moved under "Ehel K-12 School"', 'ok' => true, 'detail' => ''];

        $lowersec = core_course_category::get(PQEHUCAT_LOWER_SECONDARY, MUST_EXIST, true);
        $lowersec->change_parent($k12);
        $results[] = ['label' => '"Lower Secondary" (17) moved under "Ehel K-12 School"', 'ok' => true, 'detail' => ''];

        // 3. Delete the old shell's empty subcategories (children before parents).
        foreach (PQEHUCAT_OLD_EMPTY_CHILDREN as $oldid) {
            $existing = $DB->get_record('course_categories', ['id' => $oldid], '*', IGNORE_MISSING);
            if (!$existing) {
                $results[] = ['label' => "Old empty category #$oldid", 'ok' => true, 'detail' => 'Already gone.'];
                continue;
            }
            $coursecount = (int)$DB->count_records('course', ['category' => $oldid]);
            if ($coursecount > 0) {
                $results[] = ['label' => "Old empty category #$oldid ({$existing->name})", 'ok' => false, 'detail' => "Skipped -- it actually has $coursecount course(s), not empty."];
                continue;
            }
            $cat = core_course_category::get($oldid, MUST_EXIST, true);
            $cat->delete_full(false);
            $results[] = ['label' => "Old empty category #$oldid ({$existing->name})", 'ok' => true, 'detail' => 'Deleted.'];
        }

        // 4. Create "Ehel Languages School" under Ehel Academy.
        $ehelacademy = core_course_category::get(PQEHUCAT_EHEL_ACADEMY, MUST_EXIST, true);
        $langschool = core_course_category::create(['name' => 'Ehel Languages School', 'parent' => PQEHUCAT_EHEL_ACADEMY]);
        $results[] = ['label' => 'Created "Ehel Languages School" (#' . $langschool->id . ') under Ehel Academy', 'ok' => true, 'detail' => ''];

        // 5. Create the four language subcategories under it.
        foreach (PQEHUCAT_LANGUAGE_SUBCATS as $subjectname) {
            $subcat = core_course_category::create(['name' => $subjectname, 'parent' => $langschool->id]);
            $results[] = ['label' => "Created \"$subjectname\" (#{$subcat->id}) under Ehel Languages School", 'ok' => true, 'detail' => ''];
        }

        $message = 'Reorganization complete.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$plan = [];
try {
    $plan = pqehucat_plan();
} catch (Throwable $e) {
    $error = $error !== '' ? $error : $e->getMessage();
}

echo $OUTPUT->header();
?>
<style>
body.pqehucat-page header,body.pqehucat-page footer,body.pqehucat-page nav.navbar,body.pqehucat-page #page-header,body.pqehucat-page #page-footer,body.pqehucat-page .drawer,body.pqehucat-page .drawer-toggles,body.pqehucat-page .block-region,body.pqehucat-page [data-region="drawer"],body.pqehucat-page [data-region="right-hand-drawer"]{display:none!important}
body.pqehucat-page #page,body.pqehucat-page #page-content,body.pqehucat-page #region-main,body.pqehucat-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqehucat-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqehucat-wrap{max-width:900px;margin:0 auto}.pqehucat-top,.pqehucat-card{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqehucat-top{padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#edf9ef 0%,#fff 62%,#fff7e7 100%)}.pqehucat-title{margin:0;color:#221b22;font-size:26px;line-height:1.08;font-weight:950}.pqehucat-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqehucat-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer;margin-top:10px}.pqehucat-btn--go{background:#2f6f4e;border-color:#2f6f4e;color:#fff!important}.pqehucat-card{padding:18px;margin-bottom:14px}.pqehucat-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqehucat-alert--ok{background:#edf9ef;color:#245c35}.pqehucat-alert--bad{background:#fff0ed;color:#883526}.pqehucat-table{width:100%;border-collapse:collapse}.pqehucat-table th,.pqehucat-table td{padding:8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:12.5px}.pqehucat-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqehucat-confirm{max-width:260px;min-height:40px;border:2px solid #2f6f4e;border-radius:8px;padding:0 10px;font-size:14px;font-weight:900}.pqehucat-plan{padding:14px;border-radius:8px;background:#f5f8fb;border:1px solid rgba(23,48,68,.12);margin-bottom:14px;font-size:13px}
</style>
<main class="pqehucat-shell">
  <div class="pqehucat-wrap">
    <section class="pqehucat-top">
      <h1 class="pqehucat-title">Reorganize Ehel Course Categories</h1>
      <p class="pqehucat-sub">Renames category 9 to "Ehel K-12 School" and moves it under Ehel Academy; moves Primary (15) and Lower Secondary (17) under it; deletes the old shell's empty English/Math/Science/Grade 1 subcategories; creates "Ehel Languages School" under Ehel Academy with English/Arabic/Kiswahili/Somali subcategories.</p>
      <a class="pqehucat-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Platform dashboard</a>
    </section>

    <?php if ($message !== ''): ?><div class="pqehucat-alert pqehucat-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqehucat-alert pqehucat-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if ($results): ?>
    <section class="pqehucat-card">
      <h2>Results</h2>
      <table class="pqehucat-table">
        <thead><tr><th>Step</th><th>Result</th></tr></thead>
        <tbody>
          <?php foreach ($results as $r): ?>
            <tr><td><?php echo s($r['label']); ?></td><td><?php echo $r['ok'] ? '&#10003; ' : '&#10007; '; ?><?php echo s($r['detail']); ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <?php endif; ?>

    <section class="pqehucat-card">
      <h2>Current State</h2>
      <div class="pqehucat-plan">
        Ehel Academy (#14) exists: <?php echo !empty($plan['ehel_academy_exists']) ? 'yes' : 'NO'; ?><br>
        Old "Ehel Primary" shell (#9) exists: <?php echo !empty($plan['old_shell_exists']) ? 'yes -- will be renamed/moved' : 'no -- already done'; ?><br>
        "Primary" (#15) exists: <?php echo !empty($plan['primary_exists']) ? 'yes' : 'no'; ?><br>
        "Lower Secondary" (#17) exists: <?php echo !empty($plan['lower_secondary_exists']) ? 'yes' : 'no'; ?><br>
        "Ehel Languages School" already under Ehel Academy: <?php echo !empty($plan['language_school_exists']) ? 'yes -- running again would create a duplicate' : 'no -- will be created'; ?>
      </div>
      <?php if (empty($plan['old_shell_exists']) && !empty($plan['language_school_exists'])): ?>
        <p><strong>This appears to already be done.</strong> Running again would create a duplicate "Ehel Languages School" category.</p>
      <?php else: ?>
        <form method="post" onsubmit="return confirm('Run the category reorganization now?');">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <label>Type <strong>REORGANIZE</strong> to confirm:<br>
          <input class="pqehucat-confirm" type="text" name="confirmphrase" autocomplete="off" required></label>
          <br><button class="pqehucat-btn pqehucat-btn--go" type="submit">Run reorganization</button>
        </form>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
