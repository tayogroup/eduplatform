<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
} else if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
}
if ($sessionid > 0) {
    $urlparams['sessionid'] = $sessionid;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_live_room.php', $urlparams));
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Live Classroom');
$PAGE->set_heading('Live Classroom');
$PAGE->add_body_class('pqh-live-room-page');

function pqlroom_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqlroom_user_name(int $userid, string $fallback = ''): string {
    if ($userid <= 0) {
        return $fallback;
    }
    $user = core_user::get_user($userid);
    return $user ? fullname($user) : ($fallback !== '' ? $fallback : 'User ' . $userid);
}

function pqlroom_can_view_session($session): bool {
    global $DB, $USER;
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return true;
    }
    if ((int)($session->workspaceid ?? 0) > 0
        && pqh_user_can_manage_workspace((int)$USER->id, (int)$session->workspaceid)) {
        return true;
    }
    if ((int)($session->teacherid ?? 0) === (int)$USER->id) {
        return true;
    }
    if (!pqlroom_table_exists('local_prequran_live_participant')) {
        return false;
    }
    return $DB->record_exists('local_prequran_live_participant', [
        'sessionid' => (int)$session->id,
        'userid' => (int)$USER->id,
        'status' => 'active',
    ]);
}

function pqlroom_primary_studentid(int $sessionid): int {
    global $DB, $USER;
    if (!pqlroom_table_exists('local_prequran_live_participant')) {
        return 0;
    }
    $participant = $DB->get_record('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'userid' => (int)$USER->id,
        'status' => 'active',
    ], '*', IGNORE_MULTIPLE);
    if ($participant && (int)($participant->studentid ?? 0) > 0) {
        return (int)$participant->studentid;
    }
    if ($participant && (string)($participant->role ?? '') === 'student') {
        return (int)$USER->id;
    }
    $studentid = $DB->get_field_select(
        'local_prequran_live_participant',
        'studentid',
        'sessionid = ? AND status = ? AND role = ? AND studentid > 0',
        [$sessionid, 'active', 'student'],
        IGNORE_MULTIPLE
    );
    return $studentid ? (int)$studentid : 0;
}

if (!pqlroom_table_exists('local_prequran_live_session')) {
    pqh_access_denied(
        'Live session tables are not available yet. Run the live session upgrade before opening the classroom.',
        new moodle_url('/local/hubredirect/live_sessions.php', array_diff_key($urlparams, ['sessionid' => true])),
        'Live classroom unavailable'
    );
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqh_access_denied(
        'Choose a valid live session before opening the classroom.',
        new moodle_url('/local/hubredirect/live_sessions.php', array_diff_key($urlparams, ['sessionid' => true])),
        'Live classroom unavailable'
    );
}
if (!pqh_record_belongs_to_consumer_context($session)) {
    pqh_access_denied(
        'This live session does not belong to the active consumer.',
        new moodle_url('/local/hubredirect/live_sessions.php', array_diff_key($urlparams, ['sessionid' => true])),
        'Live classroom unavailable'
    );
}
if ($workspaceid > 0 && (int)($session->workspaceid ?? 0) > 0 && (int)$session->workspaceid !== $workspaceid) {
    pqh_access_denied(
        'This live session is not scoped to the selected workspace.',
        new moodle_url('/local/hubredirect/live_sessions.php', array_diff_key($urlparams, ['sessionid' => true])),
        'Workspace live classroom access required'
    );
}
if (!pqlroom_can_view_session($session)) {
    pqh_access_denied(
        'This live classroom is available only to assigned students, parents, teachers, and allowed workspace administrators.',
        new moodle_url('/local/hubredirect/live_sessions.php', array_diff_key($urlparams, ['sessionid' => true])),
        'Live classroom access required'
    );
}

if ($workspaceid <= 0 && !empty($session->workspaceid)) {
    $workspaceid = (int)$session->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
}

$studentid = pqlroom_primary_studentid($sessionid);
$joinparams = [
    'action' => 'join',
    'sessionid' => $sessionid,
    'rawbbb' => 1,
    'sesskey' => sesskey(),
];
if ($workspaceid > 0) {
    $joinparams['workspaceid'] = $workspaceid;
}
if (!empty($urlparams['consumer'])) {
    $joinparams['consumer'] = (string)$urlparams['consumer'];
}
$bbburl = new moodle_url('/local/hubredirect/live_sessions.php', $joinparams);
$tutorparams = [
    'sessionid' => $sessionid,
    'embed' => 1,
    'panel' => 1,
    'returnurl' => (new moodle_url('/local/hubredirect/workspace_live_room.php', $urlparams))->out(false),
];
if (!empty($urlparams['consumer'])) {
    $tutorparams['consumer'] = (string)$urlparams['consumer'];
}
if ($workspaceid > 0) {
    $tutorparams['workspaceid'] = $workspaceid;
}
if ($studentid > 0) {
    $tutorparams['studentid'] = $studentid;
}
$tutorurl = new moodle_url('/local/hubredirect/live_virtual_tutor.php', $tutorparams);
$workspaceurlparams = array_diff_key($urlparams, ['sessionid' => true]);
$sessionsurl = new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams);
$dashboardurl = $workspaceid > 0
    ? new moodle_url('/local/hubredirect/workspace_dashboard.php', $workspaceurlparams)
    : new moodle_url('/local/hubredirect/dashboard.php', $workspaceurlparams);
$rawbbburl = new moodle_url('/local/hubredirect/live_sessions.php', $joinparams);

$teachername = pqlroom_user_name((int)($session->teacherid ?? 0), 'Teacher');
$time = !empty($session->scheduled_start)
    ? userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))
    : 'Live class';

echo $OUTPUT->header();
?>
<script>
window.location.replace(<?php echo json_encode($rawbbburl->out(false)); ?>);
</script>
<style>
html,body{height:100%;min-height:100%;background:#f4f8f6!important;overflow:hidden}
body{margin:0!important}
body.pqh-live-room-page header,
body.pqh-live-room-page footer,
body.pqh-live-room-page nav.navbar,
body.pqh-live-room-page #page-header,
body.pqh-live-room-page #page-footer,
body.pqh-live-room-page .drawer,
body.pqh-live-room-page .drawer-toggles,
body.pqh-live-room-page .block-region,
body.pqh-live-room-page .secondary-navigation,
body.pqh-live-room-page .footer-popover,
body.pqh-live-room-page .popover-region,
body.pqh-live-room-page .usermenu,
body.pqh-live-room-page .logininfo,
body.pqh-live-room-page .homelink,
body.pqh-live-room-page [data-region="drawer"],
body.pqh-live-room-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-room-page #page-wrapper,
body.pqh-live-room-page #page,
body.pqh-live-room-page #page-content,
body.pqh-live-room-page #region-main,
body.pqh-live-room-page .main-inner,
body.pqh-live-room-page .container,
body.pqh-live-room-page .container-fluid{width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
body.pqh-live-room-page #page.drawers{margin-top:0!important}
.pqlroom{height:100vh;display:grid;grid-template-rows:auto minmax(0,1fr);color:#243325;font-family:inherit}
.pqlroom-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid rgba(105,76,45,.12);background:linear-gradient(135deg,#eaffea 0%,#fff 58%,#fff7e7 100%);box-shadow:0 12px 30px rgba(23,48,68,.08);z-index:5}
.pqlroom-brand{display:flex;align-items:center;gap:12px;min-width:0}
.pqlroom-logo{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:#6f4e32;color:#fff;font-weight:950}
.pqlroom-title{min-width:0}
.pqlroom-title h1{margin:0;color:#221b22;font-size:26px;line-height:1.08;font-weight:950;letter-spacing:0}
.pqlroom-title p{margin:5px 0 0;color:#60735f;font-size:13px;font-weight:850}
.pqlroom-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.pqlroom-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(23,48,68,.12);background:#eef7ee;color:#173044!important;text-decoration:none!important;font-size:13px;font-weight:950;box-shadow:0 2px 0 rgba(23,48,68,.04);cursor:pointer}
.pqlroom-btn:hover{background:#e1f2e1;border-color:rgba(47,111,78,.24)}
.pqlroom-btn--primary{background:#6f4e32;color:#fff!important;border-color:#6f4e32}
.pqlroom-btn--primary:hover{background:#5e4129;border-color:#5e4129}
.pqlroom-stage{min-height:0;display:grid;grid-template-columns:minmax(460px,65fr) minmax(320px,35fr);gap:10px;padding:10px;background:#f4f8f6}
.pqlroom-pane{min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;border:1px solid rgba(105,76,45,.12);border-radius:14px;background:#fff;box-shadow:0 12px 32px rgba(23,48,68,.08)}
.pqlroom-pane-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(105,76,45,.1);background:#fbfff8}
.pqlroom-pane-head h2{margin:0;color:#3f2c1f;font-size:16px;font-weight:950}
.pqlroom-pane-head span{color:#60735f;font-size:12px;font-weight:850}
.pqlroom-frame-wrap{position:relative;min-height:0;background:#fff}
.pqlroom-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}
.pqlroom-fallback{position:absolute;right:14px;bottom:14px;max-width:min(420px,calc(100% - 28px));padding:14px;border:1px solid rgba(214,166,66,.28);border-radius:12px;background:#fff7e7;color:#3f2c1f;box-shadow:0 12px 28px rgba(23,48,68,.12)}
.pqlroom-fallback strong{display:block;margin-bottom:5px;font-size:14px}
.pqlroom-fallback p{margin:0 0 10px;color:#60735f;font-size:13px;font-weight:800}
.pqlroom.is-live-full .pqlroom-stage{grid-template-columns:1fr}
.pqlroom.is-live-full .pqlroom-pane--tutor{display:none}
.pqlroom.is-tutor-full .pqlroom-stage{grid-template-columns:1fr}
.pqlroom.is-tutor-full .pqlroom-pane--live{display:none}
.pqlroom.is-live-full .pqlroom-pane--live,
.pqlroom.is-tutor-full .pqlroom-pane--tutor{border-radius:10px}
.pqlroom-floating-return{display:none;position:fixed;right:18px;bottom:18px;z-index:10}
.pqlroom.is-live-full .pqlroom-floating-return,
.pqlroom.is-tutor-full .pqlroom-floating-return{display:inline-flex}
@media(max-width:900px){
  html,body{overflow:auto}
  .pqlroom{min-height:100vh;height:auto}
  .pqlroom-head{align-items:flex-start;flex-direction:column}
  .pqlroom-actions{justify-content:flex-start}
  .pqlroom-stage{height:calc(100vh - 168px);grid-template-columns:1fr;padding:8px}
  .pqlroom-pane--tutor{display:none}
  .pqlroom.is-tutor-full .pqlroom-pane--tutor{display:grid}
  .pqlroom.is-tutor-full .pqlroom-pane--live{display:none}
  .pqlroom.is-live-full .pqlroom-pane--live{display:grid}
}
</style>
<main id="pqlroom" class="pqlroom">
  <header class="pqlroom-head">
    <div class="pqlroom-brand">
      <span class="pqlroom-logo">QA</span>
      <div class="pqlroom-title">
        <h1><?php echo s((string)$session->title); ?></h1>
        <p><?php echo s($time); ?> - <?php echo s($teachername); ?></p>
      </div>
    </div>
    <nav class="pqlroom-actions" aria-label="Classroom controls">
      <button class="pqlroom-btn pqlroom-btn--primary" type="button" data-mode="split">Split view</button>
      <button class="pqlroom-btn" type="button" data-mode="live-full">Full screen class</button>
      <button class="pqlroom-btn" type="button" data-mode="tutor-full">Full screen tutor</button>
      <a class="pqlroom-btn" href="<?php echo $rawbbburl->out(false); ?>" target="_blank" rel="noopener">Open class tab</a>
      <a class="pqlroom-btn" href="<?php echo $sessionsurl->out(false); ?>">Sessions</a>
      <a class="pqlroom-btn" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
    </nav>
  </header>

  <section class="pqlroom-stage" aria-label="Live classroom split screen">
    <article class="pqlroom-pane pqlroom-pane--live">
      <div class="pqlroom-pane-head">
        <div><h2>Live Class</h2><span>BigBlueButton room</span></div>
        <button class="pqlroom-btn" type="button" data-mode="live-full">Expand</button>
      </div>
      <div class="pqlroom-frame-wrap">
        <iframe class="pqlroom-frame" title="Live class" src="<?php echo $bbburl->out(false); ?>" allow="camera; microphone; fullscreen; display-capture; autoplay"></iframe>
        <div class="pqlroom-fallback">
          <strong>If the class does not appear</strong>
          <p>Open the live room in a separate tab and keep the tutor open here.</p>
          <a class="pqlroom-btn pqlroom-btn--primary" href="<?php echo $rawbbburl->out(false); ?>" target="_blank" rel="noopener">Open live class</a>
        </div>
      </div>
    </article>

    <article class="pqlroom-pane pqlroom-pane--tutor">
      <div class="pqlroom-pane-head">
        <div><h2>Virtual Tutor</h2><span>Lesson help beside the class</span></div>
        <button class="pqlroom-btn" type="button" data-mode="tutor-full">Expand</button>
      </div>
      <div class="pqlroom-frame-wrap">
        <iframe class="pqlroom-frame" title="Virtual tutor" src="<?php echo $tutorurl->out(false); ?>"></iframe>
      </div>
    </article>
  </section>
  <button class="pqlroom-btn pqlroom-btn--primary pqlroom-floating-return" type="button" data-mode="split">Back to split view</button>
</main>
<script>
(function(){
  var root = document.getElementById('pqlroom');
  if (!root) {
    return;
  }
  function setMode(mode) {
    root.classList.remove('is-live-full', 'is-tutor-full');
    if (mode === 'live-full') {
      root.classList.add('is-live-full');
    } else if (mode === 'tutor-full') {
      root.classList.add('is-tutor-full');
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function(button) {
    button.addEventListener('click', function() {
      setMode(button.getAttribute('data-mode') || 'split');
    });
  });
})();
</script>
<?php
echo $OUTPUT->footer();
