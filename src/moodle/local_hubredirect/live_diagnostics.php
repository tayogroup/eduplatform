<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!is_siteadmin($USER)) {
    pqh_access_denied(
        'Only site administrators can view live-session diagnostics.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Live diagnostics access required'
    );
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_diagnostics.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Session Diagnostics');
$PAGE->set_heading('Live Session Diagnostics');
$PAGE->add_body_class('pqh-live-diagnostics-page');

function pqld_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqld_status(bool $ok): string {
    return $ok ? 'PASS' : 'FAIL';
}

function pqld_bbb_api_base_url(string $baseurl): string {
    $baseurl = trim($baseurl);
    if ($baseurl === '') {
        return '';
    }
    $baseurl = rtrim($baseurl, '/') . '/';
    if (preg_match('#/api/$#', $baseurl)) {
        return $baseurl;
    }
    if (preg_match('#/bigbluebutton/$#', $baseurl)) {
        return $baseurl . 'api/';
    }
    if (preg_match('#/bigbluebutton/[^/]+/$#', $baseurl)) {
        return $baseurl . 'api/';
    }
    return $baseurl . 'bigbluebutton/api/';
}

function pqld_host(string $url): string {
    $host = parse_url($url, PHP_URL_HOST);
    return is_string($host) ? strtolower($host) : '';
}

$tables = [
    'local_prequran_live_session',
    'local_prequran_live_participant',
    'local_prequran_live_attendance',
    'local_prequran_live_note',
    'local_prequran_live_recording',
    'local_prequran_live_consent',
    'local_prequran_live_audit',
];

$bbbbase = trim((string)get_config('local_prequran', 'bbb_base_url'));
$bbbsecret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
$bbbapiurl = pqld_bbb_api_base_url($bbbbase);
$bbbhost = pqld_host($bbbbase);
$bbbdomainmode = $bbbhost === '' ? 'NOT SET' : (preg_match('/(^|\.)biggerbluebutton\.com$/', $bbbhost) ? 'PROVIDER' : 'CUSTOM');
$locallib = $CFG->dirroot . '/local/prequran/locallib.php';

$sessions = [];
$audits = [];
$recordingpolicy = [];
if (pqld_table_exists('local_prequran_live_session')) {
    $sessions = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_session}
       ORDER BY timecreated DESC, id DESC",
        [],
        0,
        10
    );
}
if (pqld_table_exists('local_prequran_live_audit')) {
    [$actionsql, $actionparams] = $DB->get_in_or_equal([
        'video_recording_disabled_missing_consent',
        'recording_disabled_missing_consent',
    ], SQL_PARAMS_NAMED, 'recordingpolicy');
    $recordingaudits = $DB->get_records_select(
        'local_prequran_live_audit',
        "action {$actionsql} AND targettype = :targettype",
        $actionparams + ['targettype' => 'session'],
        'timecreated DESC',
        'id, sessionid, details, timecreated',
        0,
        100
    );
    foreach ($recordingaudits as $audit) {
        $sessionid = (int)$audit->sessionid;
        if ($sessionid > 0 && !isset($recordingpolicy[$sessionid])) {
            $recordingpolicy[$sessionid] = $audit;
        }
    }
    $audits = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
       ORDER BY timecreated DESC, id DESC",
        [],
        0,
        20
    );
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-diagnostics-page header,
body.pqh-live-diagnostics-page footer,
body.pqh-live-diagnostics-page nav.navbar,
body.pqh-live-diagnostics-page #page-header,
body.pqh-live-diagnostics-page #page-footer,
body.pqh-live-diagnostics-page .drawer,
body.pqh-live-diagnostics-page .drawer-toggles,
body.pqh-live-diagnostics-page .block-region,
body.pqh-live-diagnostics-page [data-region="drawer"],
body.pqh-live-diagnostics-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-diagnostics-page #page,
body.pqh-live-diagnostics-page #page-content,
body.pqh-live-diagnostics-page #region-main,
body.pqh-live-diagnostics-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqld-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqld-wrap{max-width:1120px;margin:0 auto}
.pqld-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqld-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqld-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqld-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12);text-decoration:none;font-size:14px;font-weight:950}
.pqld-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqld-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqld-panel--wide{grid-column:1/-1}
.pqld-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqld-table{width:100%;border-collapse:collapse;font-size:13px}
.pqld-table th,.pqld-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqld-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqld-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqld-pill--ok{background:#edf9ef;color:#245c35}
.pqld-pill--bad{background:#fff0ed;color:#883526}
.pqld-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:850px){.pqld-grid{grid-template-columns:1fr}.pqld-top{display:block}.pqld-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqld-shell">
  <div class="pqld-wrap">
    <section class="pqld-top pqh-workspace-top">
      <div>
        <h1 class="pqld-title pqh-workspace-title">Live Session Diagnostics</h1>
        <p class="pqld-sub pqh-workspace-sub">Check BBB configuration, live-session tables, recent sessions, and audit records.</p>
      </div>
      <div>
        <a class="pqld-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqld-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqld-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings_admin.php'))->out(false); ?>">Recording review</a>
        <a class="pqld-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <section class="pqld-grid">
      <article class="pqld-panel">
        <h2>Configuration</h2>
        <table class="pqld-table">
          <tr><th>Check</th><th>Status</th></tr>
          <tr><td>BBB base URL configured</td><td><span class="pqld-pill <?php echo $bbbbase !== '' ? 'pqld-pill--ok' : 'pqld-pill--bad'; ?>"><?php echo s(pqld_status($bbbbase !== '')); ?></span></td></tr>
          <tr><td>Configured BBB URL</td><td class="pqld-code"><?php echo $bbbbase !== '' ? s($bbbbase) : 'Not set'; ?></td></tr>
          <tr><td>Normalized BBB API URL</td><td class="pqld-code"><?php echo $bbbapiurl !== '' ? s($bbbapiurl) : 'Not set'; ?></td></tr>
          <tr><td>BBB domain mode</td><td><span class="pqld-pill <?php echo $bbbdomainmode === 'CUSTOM' ? 'pqld-pill--ok' : 'pqld-pill--bad'; ?>"><?php echo s($bbbdomainmode); ?></span><?php if ($bbbhost !== ''): ?><br><span class="pqld-code"><?php echo s($bbbhost); ?></span><?php endif; ?></td></tr>
          <tr><td>BBB shared secret configured</td><td><span class="pqld-pill <?php echo $bbbsecret !== '' ? 'pqld-pill--ok' : 'pqld-pill--bad'; ?>"><?php echo s(pqld_status($bbbsecret !== '')); ?></span></td></tr>
          <tr><td>BBB helper file exists</td><td><span class="pqld-pill <?php echo file_exists($locallib) ? 'pqld-pill--ok' : 'pqld-pill--bad'; ?>"><?php echo s(pqld_status(file_exists($locallib))); ?></span></td></tr>
          <tr><td>Recording consent policy</td><td>Audio recording is enabled for safeguarding. Student camera/video is consent-controlled.</td></tr>
          <tr><td>Join before minutes</td><td><?php echo (int)get_config('local_prequran', 'bbb_join_window_before_minutes'); ?></td></tr>
          <tr><td>Join after minutes</td><td><?php echo (int)get_config('local_prequran', 'bbb_join_window_after_minutes'); ?></td></tr>
          <tr><td>Default max participants</td><td><?php echo (int)get_config('local_prequran', 'bbb_max_participants_default'); ?></td></tr>
        </table>
      </article>

      <article class="pqld-panel">
        <h2>Tables</h2>
        <table class="pqld-table">
          <tr><th>Table</th><th>Status</th></tr>
          <?php foreach ($tables as $table): ?>
            <?php $exists = pqld_table_exists($table); ?>
            <tr>
              <td class="pqld-code"><?php echo s($table); ?></td>
              <td><span class="pqld-pill <?php echo $exists ? 'pqld-pill--ok' : 'pqld-pill--bad'; ?>"><?php echo s(pqld_status($exists)); ?></span></td>
            </tr>
          <?php endforeach; ?>
        </table>
      </article>

      <article class="pqld-panel pqld-panel--wide">
        <h2>Recent Sessions</h2>
        <table class="pqld-table">
          <tr><th>ID</th><th>Title</th><th>Teacher</th><th>Start</th><th>Status</th><th>BBB</th><th>Recording</th><th>Last Error</th></tr>
          <?php foreach ($sessions as $session): ?>
            <?php $recordingdisabled = $recordingpolicy[(int)$session->id] ?? null; ?>
            <tr>
              <td><?php echo (int)$session->id; ?></td>
              <td><?php echo s($session->title); ?><br><span class="pqld-code"><?php echo s($session->bbb_meeting_id); ?></span></td>
              <td><?php echo (int)$session->teacherid; ?></td>
              <td><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?></td>
              <td><?php echo s($session->status); ?></td>
              <td><?php echo !empty($session->bbb_created) ? 'created' : 'pending'; ?></td>
              <td>
                <?php if ($recordingdisabled): ?>
                  <span class="pqld-pill pqld-pill--bad">video disabled: missing consent</span><br>
                  <span class="pqld-code"><?php echo s((string)$recordingdisabled->details); ?></span>
                <?php else: ?>
                  <?php echo !empty($session->recording_enabled) ? 'audio on; video consent-controlled' : 'audio policy not marked'; ?>
                <?php endif; ?>
              </td>
              <td><?php echo s((string)$session->bbb_last_error); ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$sessions): ?><tr><td colspan="8">No live sessions found.</td></tr><?php endif; ?>
        </table>
      </article>

      <article class="pqld-panel pqld-panel--wide">
        <h2>Recent Audit</h2>
        <table class="pqld-table">
          <tr><th>Time</th><th>Session</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr>
          <?php foreach ($audits as $audit): ?>
            <tr>
              <td><?php echo userdate((int)$audit->timecreated, get_string('strftimedatetimeshort')); ?></td>
              <td><?php echo (int)$audit->sessionid; ?></td>
              <td><?php echo (int)$audit->actorid; ?></td>
              <td><?php echo s($audit->action); ?></td>
              <td><?php echo s($audit->targettype . ' #' . (int)$audit->targetid); ?></td>
              <td class="pqld-code"><?php echo s((string)$audit->details); ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$audits): ?><tr><td colspan="6">No audit records found.</td></tr><?php endif; ?>
        </table>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
