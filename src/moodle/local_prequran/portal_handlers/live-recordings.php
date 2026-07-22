<?php
// ---- report: live-recordings (approved live-class recordings; read-only) ------
// Ported from local_hubredirect/live_recordings.php via live_recordings_portallib
// (pqlrpl_*). Required from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token's user, JSON exception handler installed.
//
//   GET ?report=live-recordings&token=…             -> chooser (parent children)
//   GET ?report=live-recordings&token=…&childid=N   -> approved recordings JSON
//
// Same mode resolution as the legacy page: no childid = parent-child picker
// (parents only, exactly as the page's pqlrp_parent_children chooser); with
// childid = the legacy access gate verbatim (self / linked parent / teacher /
// admin), then the same visible-recordings query. Playback is the stored
// playback_url the legacy page links directly (opened in a new tab) — no Bunny
// storage stream here, so only browser-safe recording fields are shipped
// (title, teacher, schedule, lesson, expiry, playback_url); the raw r.* row
// (which may carry storage paths) never leaves the server.
// No write actions: the legacy page has no data_submitted()/action writes.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_security.php');
require_once($CFG->dirroot . '/local/hubredirect/live_recordings_portallib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);

// Read-only report: the legacy page has no writes, so POST is rejected.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Live recordings is a read-only report.');
}

$childid = optional_param('childid', 0, PARAM_INT);

// Legacy chooser: only linked parent children are offered (pqlrp_parent_children).
$modechildren = [];
if ($childid <= 0) {
    $modechildren = pqlrpl_parent_children($userid);
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid <= 0) {
    echo json_encode([
        'ok' => true, 'ready' => true,
        'mode' => 'chooser',
        'children' => $modechildren,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Legacy access gate, verbatim: self / linked parent / teacher / site admin.
// The denial audit (pqh_live_security_audit) is kept exactly as the page writes.
if (!pqlrpl_user_can_access_child($userid, $childid)) {
    pqh_live_security_audit(
        'live_recording_access_denied',
        'student',
        $childid,
        ['studentid' => $childid]
    );
    pqpd_fail(403, 'You cannot view live-class recordings for this student.');
}

$child = core_user::get_user($childid);
$childname = $child ? fullname($child) : 'Student ' . $childid;

$recordings = pqlrpl_visible_recordings($childid);
$teacherids = [];
$out = [];
foreach ($recordings as $r) {
    $teacherids[] = (int)$r->teacherid;
    // Curate: only browser-safe fields (the legacy page renders exactly these,
    // and links playback_url directly). Storage paths in r.* are dropped here.
    $out[] = [
        'id' => (int)$r->id,
        'title' => (string)$r->session_title,
        'teacherid' => (int)$r->teacherid,
        'scheduled_start' => (int)$r->scheduled_start,
        'lesson' => trim((string)$r->lessonid . ' / ' . (string)$r->unitid, ' /'),
        'expiresat' => (int)($r->expiresat ?? 0),
        'playback_url' => (string)($r->playback_url ?? ''),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'mode' => 'child',
    'child' => ['id' => $childid, 'name' => $childname],
    'recordings' => $out,
    'names' => pqpd_names($teacherids),
], JSON_UNESCAPED_SLASHES);
exit;
