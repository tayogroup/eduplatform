<?php
// ---- report: safenet (Safe Internet device management; read + parent/staff writes) ----
// Ported from local_hubredirect/safenet.php via safenet_portallib (pqsnpl_*).
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent. The legacy
// page stays live in parallel and is untouched.
//
// Legacy page = child-safe DNS filtering console for parents and school staff:
// register a child's device, view its personal filtering address + setup steps,
// toggle Learning Mode / pause / resume, set a learning schedule, remove it, and
// (staff only) sync pending devices. It also serves three device downloads
// (Apple .mobileconfig, Windows setup .bat, Windows removal .bat) inline before
// any HTML. Under the JSON endpoint those binary downloads are returned as
// base64 payloads (do=download) so the portal HTML can rebuild the file locally.
//
//   GET  = the viewer's device console state exactly as the page renders it
//          (register-form students, each device decorated with hosts/policy/
//          sync/last-seen/schedule), plus config + role flags and a child-name
//          map. GET download=mobileconfig|winsetup|winremove&deviceid= returns
//          the generated file as {ok, download:{filename,mime,b64}}.
//   POST = do=register | remove | pause | resume | learn | unlearn |
//          setschedule | syncall — every legacy write ported VERBATIM (same DB
//          writes, audit calls, server-sync calls and messages). Token auth
//          replaces require_sesskey().
// (safenet.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/safenetlib.php');
require_once($CFG->dirroot . '/local/hubredirect/safenet_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$body = [];
if ($method === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- consumer/workspace context (same resolution the page performs on load) --
// The page reads the consumer slug + workspaceid from the request; under the
// token endpoint the client passes them as query params (GET) or in the JSON
// body (POST). pqh_requested_consumer_context() reads the 'consumer' query slug.
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$workspaceid = $method === 'POST'
    ? (int)($body['workspaceid'] ?? (int)($consumercontext->workspaceid ?? 0))
    : optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);

$isstaff = pqh_can_manage_academy_operations($userid)
    || ($workspaceid > 0 && function_exists('pqh_user_can_manage_workspace') && pqh_user_can_manage_workspace($userid, $workspaceid))
    || ($workspaceid > 0 && function_exists('pqh_user_can_teach_in_workspace') && pqh_user_can_teach_in_workspace($userid, $workspaceid));
$children = $isstaff ? pqsn_workspace_students($workspaceid) : pqsn_children_of($userid);
$consumer = pqsn_consumer_record($consumerid);
$featureon = pqsn_feature_enabled($consumer);
$cfg = pqsn_config();

// -- entry access check (verbatim page preamble) --
// pqh_access_denied(...) -> pqpd_fail(403, same message).
if (!$isstaff && !$children) {
    pqpd_fail(403, 'Safe Internet device management is available to parents and staff.');
}

// ---------------------------------------------------------------------------
// Downloads. The legacy page streams these binaries before any output; here
// they are returned as base64 in JSON (same access rule + same generators).
// ---------------------------------------------------------------------------
if ($method !== 'POST') {
    $download = optional_param('download', '', PARAM_ALPHA);
    if ($download !== '') {
        $deviceid = optional_param('deviceid', 0, PARAM_INT);
        $device = $deviceid > 0 ? pqsnpl_load_device($deviceid) : null;
        if (!$device || !pqsnpl_user_may_touch($device, $isstaff, $children)) {
            pqpd_fail(403, 'That device was not found.');
        }
        if ($download === 'mobileconfig') {
            if ((string)$device->status !== 'active') {
                pqpd_fail(400, 'That device is not active.');
            }
            echo json_encode(['ok' => true, 'download' => [
                'filename' => 'ehel-safe-internet-' . $device->clientid . '.mobileconfig',
                'mime' => 'application/x-apple-aspen-config',
                'b64' => base64_encode(pqsn_mobileconfig_xml($device)),
            ]], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($download === 'winsetup') {
            if ((string)$device->status !== 'active') {
                pqpd_fail(400, 'That device is not active.');
            }
            echo json_encode(['ok' => true, 'download' => [
                'filename' => 'ehel-safe-internet-' . $device->clientid . '.bat',
                'mime' => 'application/octet-stream',
                'b64' => base64_encode(pqsn_windows_setup_bat($device)),
            ]], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($download === 'winremove') {
            echo json_encode(['ok' => true, 'download' => [
                'filename' => 'ehel-safe-internet-remove.bat',
                'mime' => 'application/octet-stream',
                'b64' => base64_encode(pqsn_windows_uninstall_bat($device)),
            ]], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Unknown download.');
    }
}

// ---------------------------------------------------------------------------
// Writes (each ported VERBATIM: same validation, DB writes, audit + sync calls
// and success messages; require_sesskey() dropped for token auth).
// ---------------------------------------------------------------------------
if ($method === 'POST') {
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);

    if ($action === 'register') {
        $childid = (int)($body['childid'] ?? 0);
        $label = trim((string)($body['label'] ?? ''));
        $platform = clean_param((string)($body['platform'] ?? ''), PARAM_ALPHANUMEXT);
        if (!isset($children[$childid])) {
            pqpd_fail(400, 'Choose one of your students.');
        } else if ($label === '') {
            pqpd_fail(400, 'Give the device a name, for example "Salman laptop".');
        } else if (!in_array($platform, ['android', 'windows', 'ios', 'macos', 'other'], true)) {
            pqpd_fail(400, 'Choose the device type.');
        } else if (!$featureon && !$isstaff) {
            pqpd_fail(400, 'Safe Internet is not enabled for your school yet.');
        }
        $label = clean_param($label, PARAM_TEXT);
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
        echo json_encode([
            'ok' => true,
            'message' => 'Device registered. Follow the setup steps under the new device card.',
            'deviceid' => (int)$device->id,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if (in_array($action, ['remove', 'pause', 'resume', 'learn', 'unlearn'], true)) {
        $deviceid = (int)($body['deviceid'] ?? 0);
        $device = pqsnpl_load_device($deviceid);
        if (!$device || !pqsnpl_user_may_touch($device, $isstaff, $children)) {
            pqpd_fail(400, 'That device was not found.');
        } else if ($action === 'remove') {
            $device->status = 'removed';
            $device->timemodified = time();
            $DB->update_record('local_prequran_safenet_dev', $device);
            if ($cfg->apiready) {
                pqsn_remove_device_from_server($device);
            }
            pqsn_audit($consumerid, $workspaceid, (int)$device->id, 'device_removed', []);
            echo json_encode(['ok' => true, 'message' => 'Device removed. Also delete the DNS setting or profile from the device itself.', 'deviceid' => (int)$device->id], JSON_UNESCAPED_SLASHES);
            exit;
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
            echo json_encode(['ok' => true, 'message' => $messages[$action], 'deviceid' => (int)$device->id], JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    if ($action === 'setschedule') {
        $deviceid = (int)($body['deviceid'] ?? 0);
        $device = pqsnpl_load_device($deviceid);
        if (!$device || !pqsnpl_user_may_touch($device, $isstaff, $children)) {
            pqpd_fail(400, 'That device was not found.');
        }
        $days = is_array($body['days'] ?? null) ? (array)$body['days'] : [];
        $days = array_values(array_filter(array_map('intval', $days), static function ($d) {
            return $d >= 1 && $d <= 7;
        }));
        $start = trim(clean_param((string)($body['start'] ?? ''), PARAM_TEXT));
        $end = trim(clean_param((string)($body['end'] ?? ''), PARAM_TEXT));
        $clear = (int)($body['clearschedule'] ?? 0);
        $valid = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $start) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $end);
        if ($clear || !$days || !$valid) {
            $device->schedulejson = '';
            $device->sched_applied = '';
            $message = 'Learning schedule cleared.';
        } else {
            $device->schedulejson = json_encode([
                'days' => $days,
                'start' => $start,
                'end' => $end,
                'tz' => \core_date::get_server_timezone(),
            ]);
            $device->sched_applied = '';
            $message = 'Learning schedule saved — it applies automatically each day.';
        }
        $device->timemodified = time();
        $DB->update_record('local_prequran_safenet_dev', $device);
        pqsn_audit($consumerid, $workspaceid, (int)$device->id, 'schedule_set', []);
        echo json_encode(['ok' => true, 'message' => $message, 'deviceid' => (int)$device->id], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($action === 'syncall' && $isstaff) {
        $pending = $DB->get_records('local_prequran_safenet_dev', ['syncstatus' => 'pending', 'status' => 'active']);
        $done = 0;
        foreach ($pending as $device) {
            [$ok] = pqsn_sync_device($device);
            $done += $ok ? 1 : 0;
        }
        echo json_encode(['ok' => true, 'message' => "Synced {$done} of " . count($pending) . ' pending devices to the filtering servers.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown safenet action.');
}

// ---------------------------------------------------------------------------
// GET: the device console state exactly as the page builds it.
// ---------------------------------------------------------------------------
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

// Register-form student list (chooser), preserving the page's option order.
$childrenout = [];
foreach ($children as $cid => $cname) {
    $childrenout[] = ['id' => (int)$cid, 'name' => (string)$cname];
}

$policylabels = ['paused' => 'Paused', 'learning' => 'Learning Mode', 'childsafe' => 'Child-safe'];
$daynames = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];

$devicesout = [];
$nameids = [];
foreach ($devices as $device) {
    $nameids[] = (int)$device->childid;
    $hosts = pqsn_dns_hostnames((string)$device->clientid);
    $lastseen = (int)($device->lastseen ?? 0);
    $stale = $lastseen > 0 && (time() - $lastseen > 30 * 60);
    // Same three-way state the page renders (green pill in legacy -> "active"
    // here; the portal palette carries no green, the HTML colours it in blue).
    $seenstate = $lastseen === 0 ? 'never' : ($stale ? 'stale' : 'active');

    $sched = json_decode((string)$device->schedulejson, true);
    $schedsummary = pqsn_schedule_summary((string)$device->schedulejson);
    $scheddays = is_array($sched) && !empty($sched['days']) ? array_map('intval', (array)$sched['days']) : [];

    $devicesout[] = [
        'id' => (int)$device->id,
        'label' => (string)$device->label,
        'childid' => (int)$device->childid,
        'childname' => $childnames[(int)$device->childid] ?? ('Student ' . (int)$device->childid),
        'platform' => (string)$device->platform,
        'platform_label' => ucfirst((string)$device->platform),
        'clientid' => (string)$device->clientid,
        'policy' => (string)$device->policy,
        'policy_label' => $policylabels[(string)$device->policy] ?? 'Child-safe',
        'syncstatus' => (string)$device->syncstatus,
        'onservers' => (string)$device->syncstatus === 'synced',
        'lastseen' => $lastseen,
        'lastseen_state' => $seenstate,
        'lastseen_label' => $lastseen > 0 ? userdate($lastseen, '%d %b %H:%M') : '',
        'timecreated' => (int)$device->timecreated,
        'timecreated_label' => userdate((int)$device->timecreated, '%d %b %Y'),
        'hosts' => array_values($hosts),
        'schedule' => [
            'days' => $scheddays,
            'start' => is_array($sched) ? (string)($sched['start'] ?? '') : '',
            'end' => is_array($sched) ? (string)($sched['end'] ?? '') : '',
        ],
        'schedule_summary' => $schedsummary,
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'isstaff' => (bool)$isstaff,
    'featureon' => (bool)$featureon,
    'configured' => (bool)$cfg->configured,
    'apiready' => (bool)$cfg->apiready,
    'children' => $childrenout,
    'devices' => $devicesout,
    'daynames' => $daynames,
    'dns_servers' => ['178.105.54.190', '159.89.55.155'],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/safenet.php',
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
