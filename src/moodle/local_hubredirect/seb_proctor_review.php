<?php
declare(strict_types=1);

// Proctoring review (adults-only): webcam snapshot gallery and audio
// voice-activity timeline for one student's proctored exam attempt, for human
// review. Opening the page also runs the retention purge. Managers only.
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$examid = required_param('examid', PARAM_INT);
$studentid = required_param('studentid', PARAM_INT);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');

if (!pqh_seb_tables_ready()) {
    pqh_access_denied('The exam tables are not installed yet.', $dashboardurl, 'Exams not ready');
}
$exam = pqh_seb_exam_record($examid);
if (!$exam) {
    pqh_access_denied('This exam does not exist.', $dashboardurl, 'Exam unavailable');
}
if (!pqh_seb_can_manage($exam, (int)$USER->id)) {
    pqh_access_denied('Only the exam creator and workspace managers can review proctoring.', $dashboardurl, 'Review access required');
}

pqh_seb_proctor_purge();

$student = core_user::get_user($studentid);
$studentname = $student ? fullname($student) : ('Student ' . $studentid);
$snapshots = pqh_seb_proctor_items($examid, $studentid, 'snapshot');
$voices = pqh_seb_proctor_items($examid, $studentid, 'voice');
$summary = pqh_seb_proctor_summary($examid, $studentid);
$resultsurl = pqh_seb_results_url($examid);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqh_seb_proctor_review_url($examid, $studentid));
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Proctoring review');
$PAGE->set_heading('Proctoring review');
$PAGE->add_body_class('pqpr-page');

echo $OUTPUT->header();
?>
<style>
<?php echo pqh_design_system_css('.pqpr-shell'); ?>
<?php echo pqh_design_shell_css('.pqpr-shell'); ?>
.pqpr-wrap{max-width:1100px;margin:0 auto;padding:26px 24px 60px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqpr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:0 0 14px;flex-wrap:wrap}
.pqpr-head h1{margin:0 0 4px;color:var(--pqh-ink);font-size:23px;font-weight:800;letter-spacing:-.02em}
.pqpr-head p{margin:0;color:var(--pqh-muted);font-weight:500;font-size:13.5px}
.pqpr-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 13px;border:1px solid var(--pqh-line);border-radius:10px;background:var(--pqh-surface);color:var(--pqh-ink)!important;text-decoration:none!important;font-size:13px;font-weight:650}
.pqpr-btn:hover{background:var(--pqh-tint)}
.pqpr-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 16px}
.pqpr-stat{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:12px;padding:13px 14px}
.pqpr-stat strong{display:block;color:var(--pqh-ink);font-size:22px;font-weight:750}
.pqpr-stat span{display:block;margin-top:3px;color:var(--pqh-faint);font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.05em}
.pqpr-card{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:14px;padding:18px;margin-bottom:16px}
.pqpr-card h2{margin:0 0 12px;color:var(--pqh-ink);font-size:16px;font-weight:750}
.pqpr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.pqpr-shot{border:1px solid var(--pqh-line);border-radius:10px;overflow:hidden;background:#000}
.pqpr-shot img{display:block;width:100%;height:auto}
.pqpr-shot span{display:block;padding:5px 8px;background:var(--pqh-surface);color:var(--pqh-muted);font-size:11px;font-weight:600}
.pqpr-voice{display:flex;flex-wrap:wrap;gap:7px}
.pqpr-vchip{display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:8px;background:#fdeeee;color:#b3453e;font-size:12px;font-weight:650}
.pqpr-empty{border:1px dashed var(--pqh-line);border-radius:12px;padding:20px;text-align:center;color:var(--pqh-muted);font-weight:550}
.pqpr-note{padding:11px 13px;border-radius:11px;background:var(--pqh-tint);border:1px solid var(--pqh-tint-2);color:var(--pqh-primary-ink);font-size:12.5px;font-weight:550;margin-bottom:16px}
</style>
<main class="pqpr-shell">
<?php echo pqh_design_shell_html('pqpr-shell', '', ['title' => 'Proctoring review']); ?>
  <div class="pqpr-wrap">
    <div class="pqpr-head">
      <div>
        <h1><?php echo s($studentname); ?></h1>
        <p><?php echo s((string)$exam->title); ?> · proctoring evidence for human review</p>
      </div>
      <a class="pqpr-btn" href="<?php echo $resultsurl->out(false); ?>">Back to results</a>
    </div>
    <div class="pqpr-note">Review these signals with judgement - they flag moments worth checking, not proof of cheating. Snapshots and voice flags are deleted automatically after <?php echo pqh_seb_proctor_retention_days(); ?> days.</div>
    <div class="pqpr-stats">
      <div class="pqpr-stat"><strong><?php echo (int)$summary['snapshots']; ?></strong><span>snapshots</span></div>
      <div class="pqpr-stat"><strong><?php echo (int)$summary['voice']; ?></strong><span>voice flags</span></div>
      <div class="pqpr-stat"><strong><?php echo $summary['consent'] ? 'Yes' : 'No'; ?></strong><span>consent recorded</span></div>
    </div>

    <div class="pqpr-card">
      <h2>Voice-activity flags</h2>
      <?php if (!$voices): ?>
        <div class="pqpr-empty">No voice activity was flagged during this attempt.</div>
      <?php else: ?>
        <div class="pqpr-voice">
          <?php foreach ($voices as $voice): ?>
            <span class="pqpr-vchip"><?php echo userdate((int)$voice->timecreated, get_string('strftimetime')); ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <div class="pqpr-card">
      <h2>Webcam snapshots</h2>
      <?php if (!$snapshots): ?>
        <div class="pqpr-empty">No snapshots were captured for this attempt.</div>
      <?php else: ?>
        <div class="pqpr-grid">
          <?php foreach ($snapshots as $shot): ?>
            <div class="pqpr-shot">
              <img src="<?php echo s((string)$shot->imagedata); ?>" alt="Snapshot" loading="lazy">
              <span><?php echo userdate((int)$shot->timecreated, get_string('strftimetime')); ?></span>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</main>
<?php
echo $OUTPUT->footer();
