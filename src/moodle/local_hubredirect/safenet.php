<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/safenetlib.php');

$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$urlparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$pageurl = new moodle_url('/local/hubredirect/safenet.php', $urlparams);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php', $urlparams);

$isstaff = pqh_can_manage_academy_operations((int)$USER->id)
    || ($workspaceid > 0 && function_exists('pqh_user_can_manage_workspace') && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid))
    || ($workspaceid > 0 && function_exists('pqh_user_can_teach_in_workspace') && pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid));
$children = $isstaff ? pqsn_workspace_students($workspaceid) : pqsn_children_of((int)$USER->id);
$consumer = pqsn_consumer_record($consumerid);
$featureon = pqsn_feature_enabled($consumer);
$cfg = pqsn_config();

if (!$isstaff && !$children) {
    pqh_access_denied('Safe Internet device management is available to parents and staff.', $dashboardurl, 'Safe Internet');
}

function pqsn_load_device(int $deviceid): ?stdClass {
    global $DB;
    $device = $DB->get_record('local_prequran_safenet_dev', ['id' => $deviceid], '*', IGNORE_MISSING);
    return $device ?: null;
}

function pqsn_user_may_touch(stdClass $device, bool $isstaff, array $children): bool {
    global $USER;
    if ($isstaff) {
        return true;
    }
    return (int)$device->parentid === (int)$USER->id || isset($children[(int)$device->childid]);
}

// Apple profile download runs before any output.
$mobiledevice = optional_param('mobileconfig', 0, PARAM_INT);
if ($mobiledevice > 0) {
    $device = pqsn_load_device($mobiledevice);
    if ($device && pqsn_user_may_touch($device, $isstaff, $children) && (string)$device->status === 'active') {
        header('Content-Type: application/x-apple-aspen-config');
        header('Content-Disposition: attachment; filename="ehel-safe-internet-' . $device->clientid . '.mobileconfig"');
        echo pqsn_mobileconfig_xml($device);
        exit;
    }
    redirect($pageurl);
}

// Windows one-click setup script download runs before any output.
$windevice = optional_param('winsetup', 0, PARAM_INT);
if ($windevice > 0) {
    $device = pqsn_load_device($windevice);
    if ($device && pqsn_user_may_touch($device, $isstaff, $children) && (string)$device->status === 'active') {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="ehel-safe-internet-' . $device->clientid . '.bat"');
        echo pqsn_windows_setup_bat($device);
        exit;
    }
    redirect($pageurl);
}

// Windows removal script download runs before any output.
$winremovedevice = optional_param('winremove', 0, PARAM_INT);
if ($winremovedevice > 0) {
    $device = pqsn_load_device($winremovedevice);
    if ($device && pqsn_user_may_touch($device, $isstaff, $children)) {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="ehel-safe-internet-remove.bat"');
        echo pqsn_windows_uninstall_bat($device);
        exit;
    }
    redirect($pageurl);
}

$notice = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $action = required_param('action', PARAM_ALPHANUMEXT);

    if ($action === 'register') {
        $childid = required_param('childid', PARAM_INT);
        $label = trim(required_param('label', PARAM_TEXT));
        $platform = required_param('platform', PARAM_ALPHANUMEXT);
        if (!isset($children[$childid])) {
            $error = 'Choose one of your students.';
        } else if ($label === '') {
            $error = 'Give the device a name, for example "Salman laptop".';
        } else if (!in_array($platform, ['android', 'windows', 'ios', 'macos', 'other'], true)) {
            $error = 'Choose the device type.';
        } else if (!$featureon && !$isstaff) {
            $error = 'Safe Internet is not enabled for your school yet.';
        } else {
            $device = new stdClass();
            $device->consumerid = $consumerid;
            $device->workspaceid = $workspaceid;
            $device->childid = $childid;
            $device->parentid = $isstaff ? 0 : (int)$USER->id;
            $device->clientid = pqsn_generate_clientid();
            $device->label = core_text::substr($label, 0, 255);
            $device->platform = $platform;
            $device->status = 'active';
            $device->policy = 'childsafe';
            $device->policy_until = 0;
            $device->syncstatus = 'pending';
            $device->lastseen = 0;
            $device->enrolledby = (int)$USER->id;
            $device->timecreated = time();
            $device->timemodified = time();
            $device->id = $DB->insert_record('local_prequran_safenet_dev', $device);
            pqsn_audit($consumerid, $workspaceid, (int)$device->id, 'device_registered', ['platform' => $platform, 'childid' => $childid]);
            if ($cfg->apiready) {
                pqsn_sync_device($device);
            }
            $notice = 'Device registered. Follow the setup steps under the new device card.';
        }
    } else if (in_array($action, ['remove', 'pause', 'resume', 'learn', 'unlearn'], true)) {
        $deviceid = required_param('deviceid', PARAM_INT);
        $device = pqsn_load_device($deviceid);
        if (!$device || !pqsn_user_may_touch($device, $isstaff, $children)) {
            $error = 'That device was not found.';
        } else if ($action === 'remove') {
            $device->status = 'removed';
            $device->timemodified = time();
            $DB->update_record('local_prequran_safenet_dev', $device);
            if ($cfg->apiready) {
                pqsn_remove_device_from_server($device);
            }
            pqsn_audit($consumerid, $workspaceid, (int)$device->id, 'device_removed', []);
            $notice = 'Device removed. Also delete the DNS setting or profile from the device itself.';
        } else {
            $policies = [
                'pause' => 'paused',
                'resume' => 'childsafe',
                'learn' => 'learning',
                'unlearn' => 'childsafe',
            ];
            $device->policy = $policies[$action];
            $device->policy_until = 0;
            $device->syncstatus = 'pending';
            $device->timemodified = time();
            $DB->update_record('local_prequran_safenet_dev', $device);
            if ($cfg->apiready) {
                if ($action === 'learn') {
                    pqsn_ensure_learning_rules();
                }
                pqsn_sync_device($device);
            }
            pqsn_audit($consumerid, $workspaceid, (int)$device->id, 'policy_' . $device->policy, []);
            $messages = [
                'pause' => 'Filtering paused for this device.',
                'resume' => 'Child-safe filtering restored.',
                'learn' => 'Learning Mode on — only approved educational sites work on this device.',
                'unlearn' => 'Learning Mode off — back to normal child-safe browsing.',
            ];
            $notice = $messages[$action];
        }
    } else if ($action === 'syncall' && $isstaff) {
        $pending = $DB->get_records('local_prequran_safenet_dev', ['syncstatus' => 'pending', 'status' => 'active']);
        $done = 0;
        foreach ($pending as $device) {
            [$ok] = pqsn_sync_device($device);
            $done += $ok ? 1 : 0;
        }
        $notice = "Synced {$done} of " . count($pending) . ' pending devices to the filtering servers.';
    }
}

// Device list for this viewer.
if ($isstaff) {
    $conditions = $workspaceid > 0 ? ['workspaceid' => $workspaceid, 'status' => 'active'] : ['consumerid' => $consumerid, 'status' => 'active'];
    $devices = $DB->get_records('local_prequran_safenet_dev', $conditions, 'timecreated DESC');
} else {
    $devices = [];
    if ($children) {
        [$insql, $inparams] = $DB->get_in_or_equal(array_keys($children), SQL_PARAMS_NAMED, 'child');
        $inparams['parentid'] = (int)$USER->id;
        $devices = $DB->get_records_select(
            'local_prequran_safenet_dev',
            "status = 'active' AND (childid {$insql} OR parentid = :parentid)",
            $inparams,
            'timecreated DESC'
        );
    }
}
$childnames = $children;
foreach ($devices as $device) {
    $cid = (int)$device->childid;
    if (!isset($childnames[$cid])) {
        $user = core_user::get_user($cid, '*', IGNORE_MISSING);
        $childnames[$cid] = $user ? fullname($user) : 'Student ' . $cid;
    }
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url($pageurl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Safe Internet');
$PAGE->set_heading('Safe Internet');
$PAGE->add_body_class('pqsn-page');
echo $OUTPUT->header();
?>
<style>
body.pqsn-page header,body.pqsn-page footer,body.pqsn-page nav.navbar,body.pqsn-page #page-header,body.pqsn-page #page-footer,body.pqsn-page .drawer,body.pqsn-page .drawer-toggles,body.pqsn-page .block-region{display:none!important}
body.pqsn-page #page,body.pqsn-page #page-content,body.pqsn-page #region-main,body.pqsn-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqsn-shell{min-height:100vh;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqsn-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px}
.pqsn-head h1{margin:0;font-size:26px}
.pqsn-head p{margin:6px 0 0}
.pqsn-grid{display:grid;grid-template-columns:minmax(280px,.9fr) 1.6fr;gap:14px;margin-top:14px;align-items:start}
.pqsn-panel{padding:18px}
.pqsn-panel h2{margin:0 0 10px;font-size:18px}
.pqsn-field{margin-bottom:10px}
.pqsn-field label{display:block;margin-bottom:4px;font-weight:700;font-size:13px}
.pqsn-input,.pqsn-select{width:100%;min-height:40px;padding:8px}
.pqsn-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;text-decoration:none;cursor:pointer;font-size:13px}
.pqsn-list{display:grid;gap:12px}
.pqsn-card{padding:16px}
.pqsn-card__head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.pqsn-card h3{margin:0;font-size:16px}
.pqsn-meta{margin:4px 0 0;font-size:13px}
.pqsn-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;font-size:12px;white-space:nowrap}
.pqsn-host{display:inline-block;margin:6px 0;padding:6px 10px;border-radius:8px;background:#edf3fc;color:#17498f;font-family:Consolas,monospace;font-size:13px;font-weight:700}
.pqsn-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.pqsn-steps{margin:10px 0 0;padding:12px;border-radius:10px;background:#f4f6f9;font-size:13px;line-height:1.55}
.pqsn-steps summary{cursor:pointer;font-weight:700}
.pqsn-steps ol{margin:8px 0 0 18px;padding:0}
.pqsn-alert{margin-top:12px;padding:11px;border-radius:8px;background:#edf3fc;color:#17498f;font-weight:700}
.pqsn-alert--error{background:#fdeaea;color:#8a2626}
.pqsn-note{font-size:12.5px;color:#8494a5}
@media(max-width:900px){.pqsn-grid{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css($workspaceid); ?>
<?php echo pqh_design_system_css('.pqsn-shell'); ?>
<?php echo pqh_design_shell_css('.pqsn-shell'); ?>
</style>
<main class="pqsn-shell">
<?php echo pqh_design_shell_html('pqsn-shell'); ?>
<div class="pqsn-wrap">
  <header class="pqsn-head pqh-workspace-top">
    <div>
      <h1 class="pqh-workspace-title">Safe Internet</h1>
      <p class="pqh-workspace-sub">Child-safe web filtering on every registered device — at home, at school, on any Wi-Fi.</p>
    </div>
    <a class="pqsn-btn" href="<?php echo $dashboardurl->out(false); ?>">Back to dashboard</a>
  </header>

  <?php if ($notice): ?><div class="pqsn-alert"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error): ?><div class="pqsn-alert pqsn-alert--error"><?php echo s($error); ?></div><?php endif; ?>

  <?php if ($isstaff && !$cfg->configured): ?>
    <div class="pqsn-alert pqsn-alert--error">The filtering servers are not configured yet. Set <code>safenet_dns_domain</code> (see ops/safenet/README.md). Devices can be registered now and synced later.</div>
  <?php endif; ?>
  <?php if (!$isstaff && !$featureon): ?>
    <div class="pqsn-alert">Safe Internet is being rolled out and is not switched on for your school yet. Your registered devices will activate as soon as it is.</div>
  <?php endif; ?>

  <div class="pqsn-grid">
    <section class="pqsn-panel">
      <h2>Register a device</h2>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="register">
        <div class="pqsn-field">
          <label for="pqsn-child">Student</label>
          <select id="pqsn-child" class="pqsn-select" name="childid" required>
            <option value="">Choose a student…</option>
            <?php foreach ($children as $cid => $cname): ?>
              <option value="<?php echo (int)$cid; ?>"><?php echo s($cname); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="pqsn-field">
          <label for="pqsn-label">Device name</label>
          <input id="pqsn-label" class="pqsn-input" name="label" maxlength="255" placeholder="e.g. Salman laptop" required>
        </div>
        <div class="pqsn-field">
          <label for="pqsn-platform">Device type</label>
          <select id="pqsn-platform" class="pqsn-select" name="platform" required>
            <option value="android">Android phone or tablet</option>
            <option value="windows">Windows laptop or PC</option>
            <option value="ios">iPhone or iPad</option>
            <option value="macos">Mac</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button class="pqsn-btn pqsn-btn--primary" type="submit">Register device</button>
      </form>
      <p class="pqsn-note" style="margin-top:12px">Registering creates the device's personal filtering address. You then set it on the device once — the steps appear on the device card.</p>
      <?php if ($isstaff): ?>
      <form method="post" style="margin-top:12px">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="syncall">
        <button class="pqsn-btn" type="submit">Sync pending devices to servers</button>
      </form>
      <?php endif; ?>
    </section>

    <section class="pqsn-panel">
      <h2>Registered devices</h2>
      <?php if (!$devices): ?>
        <p class="pqsn-note">No devices yet. Register the first one on the left.</p>
      <?php endif; ?>
      <div class="pqsn-list">
        <?php foreach ($devices as $device): ?>
          <?php $hosts = pqsn_dns_hostnames((string)$device->clientid); ?>
          <article class="pqsn-card">
            <div class="pqsn-card__head">
              <div>
                <h3><?php echo s((string)$device->label); ?></h3>
                <p class="pqsn-meta"><?php echo s($childnames[(int)$device->childid] ?? ('Student ' . (int)$device->childid)); ?> · <?php echo s(ucfirst((string)$device->platform)); ?> · registered <?php echo s(userdate((int)$device->timecreated, '%d %b %Y')); ?></p>
              </div>
              <div>
                <?php
                $policylabels = ['paused' => 'Paused', 'learning' => 'Learning Mode', 'childsafe' => 'Child-safe'];
                $policylabel = $policylabels[(string)$device->policy] ?? 'Child-safe';
                ?>
                <span class="pqsn-pill"><?php echo s($policylabel); ?></span>
                <span class="pqsn-pill"><?php echo (string)$device->syncstatus === 'synced' ? 'On servers' : 'Pending sync'; ?></span>
              </div>
            </div>
            <?php if ($hosts): ?>
              <div>Personal filtering address:</div>
              <?php foreach ($hosts as $host): ?><span class="pqsn-host"><?php echo s($host); ?></span> <?php endforeach; ?>
            <?php else: ?>
              <p class="pqsn-note">The filtering address appears once the service is configured.</p>
            <?php endif; ?>
            <?php if ($hosts && (string)$device->platform === 'windows'): ?>
              <div class="pqsn-actions" style="margin-top:12px">
                <a class="pqsn-btn pqsn-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/safenet.php', $urlparams + ['winsetup' => (int)$device->id]))->out(false); ?>">Download one-click setup (.bat)</a>
                <a class="pqsn-btn" href="<?php echo (new moodle_url('/local/hubredirect/safenet.php', $urlparams + ['winremove' => (int)$device->id]))->out(false); ?>">Removal script (.bat)</a>
              </div>
              <p class="pqsn-note" style="margin-top:6px">Run the setup once on the PC (double-click, approve the prompt). It protects every app and locks all browsers — no per-browser steps. Then put the child on a standard (non-admin) account. The removal script undoes it all.</p>
            <?php elseif ($hosts && ((string)$device->platform === 'ios' || (string)$device->platform === 'macos')): ?>
              <div class="pqsn-actions" style="margin-top:12px">
                <a class="pqsn-btn pqsn-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/safenet.php', $urlparams + ['mobileconfig' => (int)$device->id]))->out(false); ?>">Download Apple profile</a>
              </div>
            <?php endif; ?>
            <details class="pqsn-steps">
              <summary>Setup steps for this device</summary>
              <?php if ((string)$device->platform === 'android'): ?>
                <p class="pqsn-note"><strong>Android is the quickest — one setting, no download.</strong></p>
                <ol>
                  <li>Open <strong>Settings → Network &amp; internet → Private DNS</strong>.<br><span class="pqsn-note">On Samsung: Settings → Connections → More connection settings → Private DNS.</span></li>
                  <li>Choose <strong>"Private DNS provider hostname"</strong> and paste this exact address:<br><span class="pqsn-host"><?php echo s($hosts[0] ?? ''); ?></span></li>
                  <li>Tap <strong>Save</strong>. Every app is now filtered — on Wi-Fi and mobile data, anywhere.</li>
                  <li><strong>Lock it so the child can't turn it off:</strong> set up <strong>Google Family Link</strong> (free) on the parent's phone and block changes to the child device's settings.</li>
                </ol>
                <p class="pqsn-note">Tip: to check it's working, open a browser on the phone and try an adult site — it should fail to load.</p>
              <?php elseif ((string)$device->platform === 'ios' || (string)$device->platform === 'macos'): ?>
                <ol>
                  <li>Download the profile: <a href="<?php echo (new moodle_url('/local/hubredirect/safenet.php', $urlparams + ['mobileconfig' => (int)$device->id]))->out(false); ?>">Ehel Safe Internet profile</a> (open on the child's device).</li>
                  <li>Install it: Settings → General → VPN &amp; Device Management → install the downloaded profile.</li>
                  <li>Set a <strong>Screen Time</strong> passcode and disallow profile removal (Content &amp; Privacy Restrictions → Passcode Changes / Account Changes).</li>
                </ol>
              <?php elseif ((string)$device->platform === 'windows'): ?>
                <ol>
                  <li><strong>Easiest:</strong> download the one-click setup (button above), double-click it on the child's PC, and approve the prompt. It sets encrypted DNS for the whole PC and locks Chrome, Edge and Firefox — done.</li>
                  <li>Put the child on a <strong>standard (non-administrator)</strong> Windows account; the parent keeps the admin password so it can't be switched off.</li>
                  <li><em>Manual alternative:</em> Settings → Network &amp; internet → your connection → DNS server assignment → Edit → Manual, IPv4 On, servers <code>178.105.54.190</code> and <code>159.89.55.155</code>, encryption <strong>DNS over HTTPS</strong>, template = the personal address above.</li>
                </ol>
              <?php else: ?>
                <ol>
                  <li>Point the device's private/encrypted DNS setting at the personal filtering address above.</li>
                  <li>Lock the device's settings with the platform's parental controls.</li>
                </ol>
              <?php endif; ?>
            </details>
            <div class="pqsn-actions">
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="deviceid" value="<?php echo (int)$device->id; ?>">
                <?php if ((string)$device->policy === 'learning'): ?>
                  <input type="hidden" name="action" value="unlearn">
                  <button class="pqsn-btn pqsn-btn--primary" type="submit">Exit Learning Mode</button>
                <?php else: ?>
                  <input type="hidden" name="action" value="learn">
                  <button class="pqsn-btn" type="submit">Learning Mode</button>
                <?php endif; ?>
              </form>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="deviceid" value="<?php echo (int)$device->id; ?>">
                <?php if ((string)$device->policy === 'paused'): ?>
                  <input type="hidden" name="action" value="resume">
                  <button class="pqsn-btn" type="submit">Resume filtering</button>
                <?php else: ?>
                  <input type="hidden" name="action" value="pause">
                  <button class="pqsn-btn" type="submit">Pause filtering</button>
                <?php endif; ?>
              </form>
              <form method="post" onsubmit="return confirm('Remove this device from Safe Internet?');">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="deviceid" value="<?php echo (int)$device->id; ?>">
                <input type="hidden" name="action" value="remove">
                <button class="pqsn-btn" type="submit">Remove</button>
              </form>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </section>
  </div>
  <p class="pqsn-note" style="margin:16px 0 0"><strong>Learning Mode</strong> restricts a device to approved educational sites only (everything else is blocked) — useful for homework or focused study. Toggle it any time; it switches back to normal child-safe browsing with one tap. Ehel keeps device browsing summaries for 30 days so parents can review activity; only you and designated school staff can see your child's data. Removing a device deletes it from the filtering servers.</p>
</div>
</main>
<?php
echo $OUTPUT->footer();
