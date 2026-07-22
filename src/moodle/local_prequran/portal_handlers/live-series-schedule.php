<?php
// ---- report: live-series-schedule (recurring live-class series schedule) --------
// Ported from local_hubredirect/live_series_schedule.php via
// live_series_schedule_portallib (pqlps_*). Included from portal_data.php AFTER
// token auth: $claims is verified, $USER is the token user, the JSON exception
// handler + CORS headers are installed. The legacy page stays live in parallel
// and is untouched.
//
// GET  ?report=live-series-schedule&token=…[&childid=]
//      -> the child's recurring live-class series grouped by seriesid, exactly as
//         the legacy page renders it: per-series teacher name + active/cancelled
//         counts, each class decorated with the join-window state (BBB creds are
//         curated — only the derived state is exposed, never raw bbb_created), the
//         parent-safe change history, and the parent acknowledgement state. When
//         no child is resolved, the parent/teacher child chooser (mode=chooser).
//         Per-class links (join / summary / recording) are minted as portal_launch
//         relaunch URLs for the migrated targets instead of the legacy deep links.
// POST body JSON {"do":"ack_series_change"}:
//      the page's parent schedule-acknowledgement write verbatim (live_ack upsert
//      + pqlps_audit). confirm_sesskey() is dropped: token auth replaces the
//      session key (same bridge as the parent-trust handler).
// Access is the legacy page ENTRY check verbatim: pqlps_user_can_access_child(),
// with pqh_access_denied(...) -> pqpd_fail(403, same message). The legacy page
// never calls pqh_live_security_audit, so there is none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_series_schedule_portallib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);

// portal_launch relaunch URLs for migrated targets (same convention as the
// live-calendar handler): the click re-mints a scoped token; deep-link ints
// travel through portal_launch's passthrough.
$pqlpslaunch = static function (string $report, array $params = []) use ($CFG): string {
    $url = $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $report;
    foreach ($params as $key => $value) {
        if ((string)$value === '' || $value === 0 || $value === '0') {
            continue;
        }
        $url .= '&' . $key . '=' . rawurlencode((string)$value);
    }
    return $url;
};

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: ack_series_change (legacy action=ack_series_change, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'ack_series_change') {
        $seriesid = (int)($body['seriesid'] ?? 0);
        $studentid = (int)($body['studentid'] ?? 0);
        if ($seriesid <= 0 || $studentid <= 0) {
            pqpd_fail(403, 'Choose a valid recurring class schedule before acknowledging a change.');
        }
        if (!pqlps_parent_can_access_child($userid, $studentid)) {
            pqpd_fail(403, 'Only a linked parent can acknowledge this schedule change.');
        }
        if (!pqlps_ack_ready()) {
            pqpd_fail(403, 'Schedule acknowledgement is not available yet.');
        }
        // Legacy: changetime = latest recorded series change, else now.
        $history = pqlps_change_history([$seriesid]);
        $changetime = pqlps_latest_change_time($history[$seriesid] ?? []);
        if ($changetime <= 0) {
            $changetime = time();
        }
        $now = time();
        $record = pqlps_ack_record($seriesid, $studentid, $userid);
        if ($record) {
            $record->ack_status = 'acknowledged';
            $record->ack_message = 'Parent acknowledged the latest recurring class schedule change.';
            $record->acknowledgedat = $now;
            $record->lastchangeat = $changetime;
            $record->timemodified = $now;
            $DB->update_record('local_prequran_live_ack', $record);
        } else {
            $DB->insert_record('local_prequran_live_ack', (object)[
                'seriesid' => $seriesid,
                'studentid' => $studentid,
                'parentid' => $userid,
                'ack_status' => 'acknowledged',
                'ack_message' => 'Parent acknowledged the latest recurring class schedule change.',
                'acknowledgedat' => $now,
                'lastchangeat' => $changetime,
                'remindedat' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        pqlps_audit(0, 'series_schedule_acknowledged', 'series', $seriesid, [
            'studentid' => $studentid,
            'parentid' => $userid,
            'lastchangeat' => $changetime,
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Schedule change acknowledged. Thank you.',
            'seriesid' => $seriesid,
            'studentid' => $studentid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-series-schedule action.');
}

// -- GET: the recurring series schedule state (same resolution order as page) --
$childid = optional_param('childid', 0, PARAM_INT);

if ($childid > 0 && !pqlps_user_can_access_child($userid, $childid)) {
    pqpd_fail(403, 'You cannot view this recurring live class schedule.');
}

// Legacy child resolution (page lines 345-357).
$modechildren = [];
if ($childid <= 0) {
    if (pqlps_is_managed_student($userid)) {
        $childid = $userid;
    } else if (pqlps_has_teacher_role($userid)) {
        $modechildren = pqlps_teacher_students($userid);
    } else {
        $modechildren = pqlps_parent_children($userid);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$sessions = $childid > 0 ? pqlps_series_rows($childid) : [];
$seriesgroups = [];
foreach ($sessions as $session) {
    $seriesgroups[(int)$session->seriesid][] = $session;
}
$history = pqlps_change_history(array_keys($seriesgroups));

// A viewer who can acknowledge as a linked parent (page: !siteadmin + linked).
$canackasparent = $childid > 0 && !is_siteadmin($USER) && pqlps_parent_can_access_child($userid, $childid);
$ackready = pqlps_ack_ready();

$nameids = [];
$seriesout = [];
foreach ($seriesgroups as $seriesid => $items) {
    $first = $items[0];
    $nameids[] = (int)$first->teacherid;
    $activecount = 0;
    $cancelledcount = 0;
    $sessionsout = [];
    foreach ($items as $s) {
        if ((string)$s->status === 'cancelled') {
            $cancelledcount++;
        } else {
            $activecount++;
        }
        [$joinstate, $joinlabel] = pqlps_join_state($s);
        // Curate BBB creds: expose only the derived join state, never bbb_created.
        $sessionsout[] = [
            'id' => (int)$s->id,
            'series_sequence' => (int)$s->series_sequence,
            'title' => (string)$s->title,
            'scheduled_start' => (int)$s->scheduled_start,
            'scheduled_end' => (int)$s->scheduled_end,
            'status' => (string)$s->status,
            'cancellation_reason' => (string)$s->cancellation_reason,
            'noteid' => (int)$s->noteid,
            'visible_recordings' => (int)$s->visible_recordings,
            'join_state' => $joinstate,
            'join_label' => $joinlabel,
            'joinlaunch' => $joinstate === 'open' ? $pqlpslaunch('live-sessions', ['sessionid' => (int)$s->id]) : '',
            'summarylaunch' => (int)$s->noteid > 0 ? $pqlpslaunch('live-summaries', ['childid' => $childid]) : '',
            'recordinglaunch' => (int)$s->visible_recordings > 0 ? $pqlpslaunch('recordings', ['childid' => $childid]) : '',
        ];
    }
    $serieshistory = array_slice($history[(int)$seriesid] ?? [], 0, 8);
    $changes = [];
    foreach ($serieshistory as $change) {
        $changes[] = [
            'timecreated' => (int)$change->timecreated,
            'label' => pqlps_parent_safe_change_label((string)$change->action),
        ];
    }
    $latestchange = pqlps_latest_change_time($history[(int)$seriesid] ?? []);
    $ack = pqlps_ack_record((int)$seriesid, $childid, $userid);
    $ackcurrent = $ack && (int)$ack->acknowledgedat >= $latestchange;
    $canack = $ackready && $latestchange > 0 && $canackasparent;
    $seriesout[] = [
        'seriesid' => (int)$seriesid,
        'title' => (string)$first->title,
        'teacherid' => (int)$first->teacherid,
        'review_target' => trim((string)$first->lessonid . ' / ' . (string)$first->unitid, ' /'),
        'active_count' => $activecount,
        'cancelled_count' => $cancelledcount,
        'sessions' => $sessionsout,
        'changes' => $changes,
        'latestchange' => $latestchange,
        'canack' => (bool)$canack,
        'ackcurrent' => (bool)$ackcurrent,
        'acknowledgedat' => $ack ? (int)$ack->acknowledgedat : 0,
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ackready,
    'mode' => $childid > 0 ? 'child' : 'chooser',
    'child' => ['id' => $childid, 'name' => $childname],
    'children' => $modechildren,
    'series' => $seriesout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
