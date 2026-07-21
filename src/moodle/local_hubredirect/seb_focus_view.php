<?php
declare(strict_types=1);

// Browser focus-mode exam view. Included from seb_exam.php when the exam mode
// is 'focus'. Runs in a normal browser (no Safe Exam Browser install): a
// "Begin exam" gesture requests fullscreen, then the content loads under a
// countdown while JS watches for tab switches, window blur, and leaving
// fullscreen - each is warned to the student and recorded server-side via
// seb_focus_event.php. It monitors and deters; it cannot physically lock the
// machine. Expects $exam, $examid, $durationsecs, $USER, $OUTPUT in scope.

defined('MOODLE_INTERNAL') || die();

$attempt = pqh_seb_attempt($examid, (int)$USER->id);
$finished = $attempt && (string)$attempt->status === 'finished';
$embedurl = trim((string)$exam->embedurl);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');
$eventurl = new moodle_url('/local/hubredirect/seb_focus_event.php');
$proctorurl = new moodle_url('/local/hubredirect/seb_proctor_event.php');
$proctored = pqh_seb_proctor_effective($exam, (int)$USER->id);
$retentiondays = pqh_seb_proctor_retention_days();

echo $OUTPUT->header();
?>
<style>
body.pqsx-page{margin:0;background:#f4f6f9}
.pqfx{font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#0f2237}
.pqfx-panel{max-width:600px;margin:56px auto;padding:30px;background:#fff;border:1px solid #e4e9ef;border-radius:16px;box-shadow:0 10px 28px -16px rgba(15,34,55,.2)}
.pqfx-panel h1{margin:0 0 8px;font-size:23px;font-weight:800;letter-spacing:-.02em}
.pqfx-panel p{margin:0 0 16px;color:#5b6b7c;font-weight:500;font-size:14px}
.pqfx-rules{margin:0 0 20px;padding:0;list-style:none;display:grid;gap:9px}
.pqfx-rules li{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:#0f2237;font-weight:550}
.pqfx-rules li::before{content:"";flex:0 0 auto;width:8px;height:8px;margin-top:6px;border-radius:50%;background:#2166d1}
.pqfx-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border:0;border-radius:11px;background:#2166d1;color:#fff!important;text-decoration:none!important;font-size:15px;font-weight:700;cursor:pointer}
.pqfx-btn--light{background:#fff;color:#0f2237!important;border:1px solid #e4e9ef}
.pqfx-exam{display:none;flex-direction:column;height:100vh}
.pqfx-exam.is-live{display:flex}
.pqfx-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 18px;background:linear-gradient(115deg,#2166d1,#4d8be0);color:#fff}
.pqfx-bar strong{font-size:15px;font-weight:800}
.pqfx-clock{font-variant-numeric:tabular-nums;font-size:15px;font-weight:750;padding:4px 12px;border-radius:8px;background:rgba(255,255,255,.18)}
.pqfx-finish{display:inline-flex;align-items:center;min-height:34px;padding:0 14px;border:0;border-radius:9px;background:#fff;color:#17498f;font-size:13px;font-weight:700;cursor:pointer}
.pqfx-stage{flex:1;min-height:0}
.pqfx-stage iframe{display:block;width:100%;height:100%;border:0;background:#fff}
.pqfx-overlay{position:fixed;inset:0;z-index:50;display:none;place-items:center;background:rgba(15,34,55,.86);color:#fff;text-align:center;padding:24px}
.pqfx-overlay.is-shown{display:grid}
.pqfx-overlay h2{margin:0 0 8px;font-size:24px;font-weight:800}
.pqfx-overlay p{margin:0 0 18px;color:#cfe0f4;font-weight:500;max-width:420px}
.pqfx-overlay .pqfx-btn{background:#fff;color:#17498f!important}
.pqfx-note{padding:11px 13px;border-radius:11px;background:#fdf6e9;border:1px solid #f0e0bd;color:#8a6a1f;font-size:12.5px;font-weight:550;margin-bottom:16px}
</style>
<div class="pqfx">
<?php if ($finished): ?>
  <div class="pqfx-panel">
    <h1>Exam submitted</h1>
    <p>Well done. Your work has been recorded. You can close this window or return to your dashboard.</p>
    <a class="pqfx-btn" href="<?php echo $dashboardurl->out(false); ?>">Back to dashboard</a>
  </div>
<?php elseif ($embedurl === ''): ?>
  <div class="pqfx-panel">
    <h1>Exam not ready</h1>
    <p>This exam has no content yet. Please tell your teacher.</p>
    <a class="pqfx-btn pqfx-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Back to dashboard</a>
  </div>
<?php else: ?>
  <!-- Intro / begin gesture -->
  <div class="pqfx-panel" id="pqfx-intro">
    <h1><?php echo s((string)$exam->title); ?></h1>
    <p><?php echo s((string)$exam->description); ?></p>
    <div class="pqfx-note">This exam runs in full screen and checks that you stay on the page. Leaving the exam, switching tabs, or opening another app is recorded and shown to your teacher.</div>
    <ul class="pqfx-rules">
      <li>You have <?php echo (int)$exam->duration_minutes; ?> minutes once you begin.</li>
      <li>Stay in full screen until you finish.</li>
      <li>Do not switch tabs or open other apps.</li>
      <?php if ($proctored): ?><li>Your camera takes periodic snapshots and your microphone is checked for voices.</li><?php endif; ?>
      <li>Press <strong>Finish</strong> when you are done.</li>
    </ul>
    <?php if ($proctored): ?>
    <div class="pqfx-note" style="background:#fdf6e9;border-color:#f0e0bd;color:#8a6a1f">
      This exam is proctored. When you begin, your browser will ask to use your <strong>camera and microphone</strong>. Snapshots are taken at intervals and reviewed by staff; audio is only checked for voices and is never recorded. This data is deleted after <?php echo (int)$retentiondays; ?> days. If you do not consent, close this page and ask your teacher for a supervised alternative.
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:600"><input type="checkbox" id="pqfx-consent"> I understand and consent to camera and microphone proctoring.</label>
    </div>
    <?php endif; ?>
    <button class="pqfx-btn" id="pqfx-begin" type="button">Begin exam in full screen</button>
    <a class="pqfx-btn pqfx-btn--light" style="margin-left:8px" href="<?php echo $dashboardurl->out(false); ?>">Cancel</a>
  </div>

  <!-- Exam stage -->
  <div class="pqfx-exam" id="pqfx-exam">
    <div class="pqfx-bar">
      <strong><?php echo s((string)$exam->title); ?></strong>
      <span class="pqfx-clock" id="pqfx-clock">--:--</span>
      <button class="pqfx-finish" id="pqfx-finish" type="button">Finish exam</button>
    </div>
    <div class="pqfx-stage"><iframe id="pqfx-frame" allow="autoplay; fullscreen" title="Exam content"></iframe></div>
  </div>

  <!-- Off-task overlay -->
  <div class="pqfx-overlay" id="pqfx-overlay">
    <div>
      <h2>Return to your exam</h2>
      <p>Leaving the exam is recorded. Click below to go back into full screen and continue.</p>
      <button class="pqfx-btn" id="pqfx-resume" type="button">Resume exam</button>
    </div>
  </div>

  <script>
  (function(){
    var examId = <?php echo (int)$examid; ?>;
    var sesskey = '<?php echo sesskey(); ?>';
    var eventUrl = '<?php echo $eventurl->out(false); ?>';
    var proctored = <?php echo $proctored ? 'true' : 'false'; ?>;
    var proctorUrl = '<?php echo $proctorurl->out(false); ?>';
    var intro = document.getElementById('pqfx-intro');
    var exam = document.getElementById('pqfx-exam');
    var frame = document.getElementById('pqfx-frame');
    var clock = document.getElementById('pqfx-clock');
    var overlay = document.getElementById('pqfx-overlay');
    var live = false, remaining = 0, ticking = false;

    function post(action, extra) {
      var body = 'action=' + action + '&examid=' + examId + '&sesskey=' + encodeURIComponent(sesskey);
      if (extra) { body += extra; }
      return fetch(eventUrl, {
        method: 'POST', credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: body
      }).then(function(r){ return r.json(); });
    }

    // ---- Proctoring (adults only): webcam snapshots + audio voice flags ----
    var mediaStream = null, snapTimer = null, voiceTimer = null;
    var video = null, canvas = null, lastVoicePost = 0;

    function proctorPost(type, extra) {
      var body = 'type=' + type + '&examid=' + examId + '&sesskey=' + encodeURIComponent(sesskey);
      if (extra) { body += extra; }
      return fetch(proctorUrl, {
        method: 'POST', credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: body
      }).then(function(r){ return r.json(); }).catch(function(){ return {ok:false}; });
    }
    function takeSnapshot() {
      if (!video || !video.videoWidth) { return; }
      var w = 320, h = Math.round(video.videoHeight * (w / video.videoWidth)) || 240;
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      var data = canvas.toDataURL('image/jpeg', 0.5);
      proctorPost('snapshot', '&image=' + encodeURIComponent(data));
    }
    function startProctoring() {
      return navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(function(stream){
        mediaStream = stream;
        proctorPost('consent');
        video = document.createElement('video');
        video.autoplay = true; video.muted = true; video.playsInline = true;
        video.srcObject = stream;
        canvas = document.createElement('canvas');
        window.setTimeout(takeSnapshot, 2500);
        snapTimer = window.setInterval(takeSnapshot, 20000);
        // Audio voice-activity: flag sustained sound, never record.
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          var ctx = new AC();
          var src = ctx.createMediaStreamSource(stream);
          var analyser = ctx.createAnalyser();
          analyser.fftSize = 512; src.connect(analyser);
          var buf = new Uint8Array(analyser.frequencyBinCount);
          var loud = 0;
          voiceTimer = window.setInterval(function(){
            analyser.getByteFrequencyData(buf);
            var sum = 0; for (var i = 0; i < buf.length; i++) { sum += buf[i]; }
            var avg = sum / buf.length;
            if (avg > 28) { loud += 1; } else { loud = 0; }
            // ~1.5s sustained sound, throttled to one flag per 8s.
            if (loud >= 3 && (Date.now() - lastVoicePost) > 8000) {
              lastVoicePost = Date.now();
              proctorPost('voice', '&level=' + Math.round(avg));
            }
          }, 500);
        } catch (e) {}
        return true;
      });
    }
    function stopProctoring() {
      if (snapTimer) { window.clearInterval(snapTimer); }
      if (voiceTimer) { window.clearInterval(voiceTimer); }
      if (mediaStream) { mediaStream.getTracks().forEach(function(t){ t.stop(); }); }
    }
    function enterFullscreen() {
      var el = document.documentElement;
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { try { var p = req.call(el); if (p && p.catch) { p.catch(function(){}); } } catch(e){} }
    }
    function fmt(s){ var m=Math.floor(s/60); var r=s%60; return m+':'+(r<10?'0':'')+r; }
    function tick(){
      if (!live) { return; }
      if (remaining <= 0) { finish(); return; }
      clock.textContent = fmt(remaining);
      remaining -= 1;
      window.setTimeout(tick, 1000);
    }
    function breach(kind){
      if (!live) { return; }
      overlay.classList.add('is-shown');
      post('break', '&kind=' + encodeURIComponent(kind));
    }
    function finish(){
      live = false;
      stopProctoring();
      post('finish').then(function(res){
        if (document.exitFullscreen && document.fullscreenElement) { document.exitFullscreen(); }
        window.location.href = (res && res.redirect) ? res.redirect : '<?php echo $dashboardurl->out(false); ?>';
      });
    }

    function beginExam(){
      enterFullscreen();
      post('start').then(function(res){
        if (!res || !res.ok) { alert((res && res.error) || 'Could not start the exam.'); return; }
        remaining = res.remaining;
        frame.src = res.embedurl;
        intro.style.display = 'none';
        exam.classList.add('is-live');
        live = true;
        if (!ticking) { ticking = true; tick(); }
      });
    }

    document.getElementById('pqfx-begin').addEventListener('click', function(){
      if (proctored) {
        var consent = document.getElementById('pqfx-consent');
        if (!consent || !consent.checked) { alert('Please tick the consent box to begin this proctored exam.'); return; }
        startProctoring().then(function(){ beginExam(); }).catch(function(){
          alert('This exam needs camera and microphone access. Please allow access, or ask your teacher for a supervised alternative.');
        });
        return;
      }
      beginExam();
    });
    document.getElementById('pqfx-finish').addEventListener('click', function(){
      if (window.confirm('Submit and finish this exam?')) { finish(); }
    });
    document.getElementById('pqfx-resume').addEventListener('click', function(){
      overlay.classList.remove('is-shown');
      enterFullscreen();
    });

    document.addEventListener('visibilitychange', function(){ if (document.hidden) { breach('tab_hidden'); } });
    window.addEventListener('blur', function(){ breach('window_blur'); });
    document.addEventListener('fullscreenchange', function(){ if (live && !document.fullscreenElement) { breach('left_fullscreen'); } });
  })();
  </script>
<?php endif; ?>
</div>
<?php
echo $OUTPUT->footer();
