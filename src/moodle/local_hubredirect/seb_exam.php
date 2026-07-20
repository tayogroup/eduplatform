<?php
declare(strict_types=1);

// SEB-gated exam page. Outside Safe Exam Browser this renders a launch page
// (install links + config download); inside a verified SEB session it embeds
// the exam content in kiosk mode with a countdown and a finish/unlock flow.
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$examid = required_param('examid', PARAM_ALPHANUMEXT);
$exam = pqh_seb_exam($examid);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');
if (!$exam) {
    pqh_access_denied('This exam does not exist.', $dashboardurl, 'Exam unavailable');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqh_seb_exam_url($examid));
$PAGE->set_pagelayout('embedded');
$PAGE->set_title((string)$exam['title']);
$PAGE->set_heading((string)$exam['title']);
$PAGE->add_body_class('pqsx-page');

$verified = pqh_seb_request_verified($examid);
$durationsecs = max(5, (int)$exam['duration']) * 60;
$startpref = 'pqh_seb_start_' . $examid;
$donepref = 'pqh_seb_done_' . $examid;

if ($verified && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'finish') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reload the exam page and try again.', pqh_seb_exam_url($examid), 'Exam action expired');
    }
    $started = (int)get_user_preferences($startpref, 0);
    set_user_preference($donepref, (string)time());
    pqh_seb_audit('seb_exam_finished', $examid, [
        'elapsed_seconds' => $started > 0 ? time() - $started : null,
    ]);
    redirect(pqh_seb_exam_url($examid));
}

echo $OUTPUT->header();

if (!$verified) {
    // ---- Launch page (normal browser) ----
    pqh_seb_audit('seb_exam_launchpage', $examid, ['engine_ready' => pqh_seb_engine_ready()]);
    ?>
<style>
<?php echo pqh_design_system_css('.pqsx-shell'); ?>
<?php echo pqh_design_shell_css('.pqsx-shell'); ?>
.pqsx-wrap{max-width:860px;margin:0 auto;padding:26px 24px 60px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqsx-card{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);padding:26px}
.pqsx-card h1{margin:0 0 6px;color:var(--pqh-ink);font-size:24px;font-weight:800;letter-spacing:-.02em}
.pqsx-card>p{margin:0 0 18px;color:var(--pqh-muted);font-weight:500}
.pqsx-steps{margin:0 0 20px;padding:0;list-style:none;display:grid;gap:12px}
.pqsx-steps li{display:flex;gap:12px;align-items:flex-start}
.pqsx-num{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--pqh-tint);color:var(--pqh-primary);font-weight:750;font-size:13px}
.pqsx-steps strong{display:block;color:var(--pqh-ink);font-weight:700;font-size:14px}
.pqsx-steps span{display:block;color:var(--pqh-muted);font-size:12.5px;font-weight:500;margin-top:2px}
.pqsx-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.pqsx-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:0;border-radius:10px;background:var(--pqh-primary);color:#fff!important;text-decoration:none!important;font-size:14px;font-weight:650;cursor:pointer;box-shadow:0 6px 14px -8px rgba(33,102,209,.55)}
.pqsx-btn--light{background:var(--pqh-surface);color:var(--pqh-ink)!important;border:1px solid var(--pqh-line);box-shadow:none}
.pqsx-btn--light:hover{background:var(--pqh-tint)}
.pqsx-meta{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 18px}
.pqsx-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:8px;background:var(--pqh-tint);color:var(--pqh-primary-ink);font-size:12.5px;font-weight:650}
.pqsx-note{padding:12px 14px;border-radius:11px;background:var(--pqh-tint);border:1px solid var(--pqh-tint-2);color:var(--pqh-primary-ink);font-size:12.5px;font-weight:550}
.pqsx-warn{padding:12px 14px;border-radius:11px;background:#fdeeee;border:1px solid #f3d2d0;color:#b3453e;font-size:12.5px;font-weight:550;margin-bottom:14px}
</style>
<main class="pqsx-shell">
<?php echo pqh_design_shell_html('pqsx-shell', '', ['title' => 'Exam']); ?>
  <div class="pqsx-wrap">
    <div class="pqsx-card">
      <h1><?php echo s((string)$exam['title']); ?></h1>
      <p><?php echo s((string)$exam['description']); ?></p>
      <div class="pqsx-meta">
        <span class="pqsx-pill"><?php echo (int)$exam['duration']; ?> minutes</span>
        <span class="pqsx-pill">Requires Safe Exam Browser</span>
      </div>
      <?php if (!pqh_seb_engine_ready()): ?>
        <div class="pqsx-warn">The Moodle SEB engine (quizaccess_seb) is not available on this installation, so exam verification cannot run. Please ask support to restore the core plugin.</div>
      <?php endif; ?>
      <?php if (trim((string)$exam['embedurl']) === ''): ?>
        <div class="pqsx-warn">This exam's content location has not been configured yet (registry entry has no embed URL). An administrator must set it in seb_lib.php before students can take this exam.</div>
      <?php endif; ?>
      <ol class="pqsx-steps">
        <li><span class="pqsx-num">1</span><div><strong>Install Safe Exam Browser (one time)</strong><span>Free for Windows, macOS, and iPad. Not available on Android devices.</span></div></li>
        <li><span class="pqsx-num">2</span><div><strong>Download the exam file below and open it</strong><span>Safe Exam Browser will start and lock this computer to the exam.</span></div></li>
        <li><span class="pqsx-num">3</span><div><strong>Sign in inside the exam browser</strong><span>Use your normal account. The exam opens automatically after sign-in.</span></div></li>
        <li><span class="pqsx-num">4</span><div><strong>Finish to unlock</strong><span>When you submit, an unlock button releases the computer. Your teacher holds the emergency exit password.</span></div></li>
      </ol>
      <div class="pqsx-actions">
        <a class="pqsx-btn" href="<?php echo pqh_seb_config_download_url($examid)->out(false); ?>">Download exam file (.seb)</a>
        <a class="pqsx-btn pqsx-btn--light" target="_blank" rel="noopener" href="https://safeexambrowser.org/download_en.html">Get Safe Exam Browser</a>
        <a class="pqsx-btn pqsx-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Back to dashboard</a>
      </div>
      <div class="pqsx-note">This page cannot display the exam in a normal browser. The exam only opens inside Safe Exam Browser, which proves itself to the server with a cryptographic key on every request.</div>
    </div>
  </div>
</main>
    <?php
    echo $OUTPUT->footer();
    exit;
}

// ---- Verified SEB session: exam mode ----
$started = (int)get_user_preferences($startpref, 0);
if ($started <= 0) {
    $started = time();
    set_user_preference($startpref, (string)$started);
    pqh_seb_audit('seb_exam_started', $examid, ['duration_minutes' => (int)$exam['duration']]);
}
$finished = (int)get_user_preferences($donepref, 0) > 0;
$remaining = max(0, ($started + $durationsecs) - time());
$timeup = $remaining <= 0;
$embedurl = trim((string)$exam['embedurl']);
$quiturl = pqh_seb_quit_url($examid);
?>
<style>
body.pqsx-page{margin:0;background:#f4f6f9}
.pqsx-exam{display:flex;flex-direction:column;height:100vh;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#0f2237}
.pqsx-exambar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 18px;background:linear-gradient(115deg,#2166d1,#4d8be0);color:#fff}
.pqsx-exambar strong{font-size:15px;font-weight:800}
.pqsx-exambar .pqsx-clock{font-variant-numeric:tabular-nums;font-size:15px;font-weight:750;padding:4px 12px;border-radius:8px;background:rgba(255,255,255,.18)}
.pqsx-finish{display:inline-flex;align-items:center;min-height:34px;padding:0 14px;border:0;border-radius:9px;background:#fff;color:#17498f;font-size:13px;font-weight:700;cursor:pointer}
.pqsx-stage{flex:1;min-height:0}
.pqsx-stage iframe{display:block;width:100%;height:100%;border:0;background:#fff}
.pqsx-panel{max-width:560px;margin:60px auto;padding:30px;background:#fff;border:1px solid #e4e9ef;border-radius:14px;box-shadow:0 10px 28px -16px rgba(15,34,55,.2);text-align:center}
.pqsx-panel h1{margin:0 0 8px;font-size:22px;font-weight:800;color:#0f2237}
.pqsx-panel p{margin:0 0 18px;color:#5b6b7c;font-weight:500}
.pqsx-unlock{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border-radius:11px;background:#2166d1;color:#fff!important;text-decoration:none!important;font-size:15px;font-weight:700}
</style>
<div class="pqsx-exam">
<?php if ($finished || $timeup): ?>
  <div class="pqsx-panel">
    <h1><?php echo $finished ? 'Exam submitted' : 'Time is up'; ?></h1>
    <p><?php echo $finished ? 'Well done. Your work has been recorded.' : 'The exam time has ended.'; ?> Click below to unlock this computer.</p>
    <a class="pqsx-unlock" href="<?php echo s($quiturl); ?>">Finish &amp; unlock</a>
  </div>
<?php else: ?>
  <div class="pqsx-exambar">
    <strong><?php echo s((string)$exam['title']); ?></strong>
    <span class="pqsx-clock" id="pqsx-clock">--:--</span>
    <form method="post" style="margin:0" onsubmit="return confirm('Submit and finish this exam?');">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <input type="hidden" name="action" value="finish">
      <button class="pqsx-finish" type="submit">Finish exam</button>
    </form>
  </div>
  <div class="pqsx-stage">
    <?php if ($embedurl !== ''): ?>
      <iframe src="<?php echo s((new moodle_url($embedurl))->out(false)); ?>" allow="autoplay; fullscreen" title="Exam content"></iframe>
    <?php else: ?>
      <div class="pqsx-panel"><h1>Exam content not configured</h1><p>An administrator must set this exam's embed URL in seb_lib.php.</p></div>
    <?php endif; ?>
  </div>
  <script>
  (function(){
    var remaining = <?php echo (int)$remaining; ?>;
    var clock = document.getElementById('pqsx-clock');
    function tick() {
      if (remaining <= 0) { window.location.reload(); return; }
      var m = Math.floor(remaining / 60), s = remaining % 60;
      clock.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      remaining -= 1;
      window.setTimeout(tick, 1000);
    }
    tick();
  })();
  </script>
<?php endif; ?>
</div>
<?php
echo $OUTPUT->footer();
