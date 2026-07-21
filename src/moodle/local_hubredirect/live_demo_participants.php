<?php
declare(strict_types=1);

// Demo-participant join links for testing a live BBB room. Generates
// attendee join URLs with placeholder names so a teacher can open them in
// extra tabs and see the room as students do. These joins go straight to
// BBB: they do NOT create participant or attendance records.

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/locallib.php');

$sessionid = required_param('sessionid', PARAM_INT);
$count = max(1, min(10, optional_param('count', 5, PARAM_INT)));

$session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
$backurl = new moodle_url('/local/hubredirect/live_sessions.php', $session && (int)($session->workspaceid ?? 0) > 0 ? ['workspaceid' => (int)$session->workspaceid] : []);
if (!$session) {
    pqh_access_denied('This live session was not found.', $backurl, 'Session not found');
}
if ((int)$session->teacherid !== (int)$USER->id && !is_siteadmin() && !pqh_can_manage_academy_operations((int)$USER->id)) {
    pqh_access_denied('Only the session teacher or an administrator can create demo participants.', $backurl, 'Demo participants access required');
}

$secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
$roomready = $secret !== '' && !empty($session->bbb_created) && trim((string)$session->bbb_meeting_id) !== '';
$attendeepw = $secret !== ''
    ? substr(sha1('prequran-live|' . (int)$session->id . '|' . (string)$session->bbb_meeting_id . '|attendee|' . $secret), 0, 24)
    : '';

$demolinks = [];
if ($roomready) {
    for ($i = 1; $i <= $count; $i++) {
        try {
            $demolinks[] = [
                'name' => 'Demo Student ' . $i,
                'url' => local_prequran_bbb_join_url(
                    (string)$session->bbb_meeting_id,
                    'Demo Student ' . $i,
                    $attendeepw,
                    990000 + $i,
                    [
                        'userdata-prequran-role' => 'demo_student',
                        'userdata-bbb_auto_join_audio' => 'true',
                        'userdata-bbb_listen_only_mode' => 'true',
                        'userdata-bbb_skip_check_audio' => 'true',
                    ]
                ),
            ];
        } catch (Throwable $e) {
            $demolinks = [];
            $roomready = false;
            break;
        }
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/live_demo_participants.php', ['sessionid' => $sessionid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Demo participants');
$PAGE->set_heading('Demo participants');
$PAGE->add_body_class('pqldp-page');
echo $OUTPUT->header();
?>
<style>
body.pqldp-page header,body.pqldp-page footer,body.pqldp-page nav.navbar,body.pqldp-page #page-header,body.pqldp-page #page-footer,body.pqldp-page .drawer,body.pqldp-page .drawer-toggles{display:none!important}
body.pqldp-page #page,body.pqldp-page #page-content,body.pqldp-page #region-main,body.pqldp-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqldp-shell{min-height:100vh;background:#f4f6f9;color:#0f2237;font:400 13.5px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqldp-wrap{max-width:860px;margin:0 auto;padding:30px 18px 60px}
.pqldp-card{background:#fff;border:1px solid #e4e9ef;border-radius:16px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);padding:22px}
.pqldp-card h1{margin:0 0 4px;font-size:24px;font-weight:800;letter-spacing:-.02em}
.pqldp-sub{margin:0 0 16px;color:#5b6b7c;font-weight:500}
.pqldp-note{margin:0 0 18px;padding:11px 13px;border-radius:10px;background:#edf3fc;color:#17498f;font-size:12.5px;font-weight:600}
.pqldp-list{display:grid;gap:8px}
.pqldp-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:#f4f6f9}
.pqldp-row strong{flex:1;font-size:13px;font-weight:700}
.pqldp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 14px;border:0;border-radius:10px;background:#2166d1;color:#fff!important;font-size:12.5px;font-weight:700;text-decoration:none!important;cursor:pointer}
.pqldp-btn:hover{background:#17498f}
.pqldp-btn--light{background:#fff;color:#0f2237!important;border:1px solid #e4e9ef}
.pqldp-btn--light:hover{background:#edf3fc}
.pqldp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.pqldp-empty{padding:18px;border:1px dashed #e4e9ef;border-radius:12px;color:#5b6b7c;font-weight:550}
</style>
<main class="pqldp-shell">
<div class="pqldp-wrap">
  <div class="pqldp-card">
    <h1>Demo participants</h1>
    <p class="pqldp-sub"><?php echo s((string)$session->title); ?> · attendee joins with placeholder names</p>
    <p class="pqldp-note">Each link joins the live room as a listen-only attendee. Open them in separate tabs to fill the room for testing. These joins do not create participant or attendance records — use real demo student accounts for that.</p>
    <?php if (!$roomready): ?>
      <div class="pqldp-empty">The live room is not running yet. Click <strong>Start class</strong> on the session first (that creates the room), then reload this page.</div>
      <div class="pqldp-actions"><a class="pqldp-btn" href="<?php echo $backurl->out(false); ?>">Back to live sessions</a></div>
    <?php else: ?>
      <div class="pqldp-list">
        <?php foreach ($demolinks as $link): ?>
          <div class="pqldp-row">
            <strong><?php echo s($link['name']); ?></strong>
            <a class="pqldp-btn" href="<?php echo s($link['url']); ?>" target="_blank" rel="noopener">Join in new tab</a>
          </div>
        <?php endforeach; ?>
      </div>
      <div class="pqldp-actions">
        <button class="pqldp-btn" type="button" id="pqldp-open-all">Open all <?php echo count($demolinks); ?></button>
        <a class="pqldp-btn pqldp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_demo_participants.php', ['sessionid' => $sessionid, 'count' => $count]))->out(false); ?>">Refresh links</a>
        <a class="pqldp-btn pqldp-btn--light" href="<?php echo $backurl->out(false); ?>">Back to live sessions</a>
      </div>
      <script>
      document.getElementById('pqldp-open-all').addEventListener('click', function() {
        var links = document.querySelectorAll('.pqldp-row a[target="_blank"]');
        links.forEach(function(a, i) {
          window.setTimeout(function() { window.open(a.href, '_blank'); }, i * 400);
        });
      });
      </script>
    <?php endif; ?>
  </div>
</div>
</main>
<?php
echo $OUTPUT->footer();
