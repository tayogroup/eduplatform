<?php
// ---- report: workspace-series (workspace recurring live-class series manager) --
// Ported from local_hubredirect/workspace_series.php via
// workspace_series_portallib (pqwserl_*). Dispatched from portal_data.php AFTER
// token auth: $claims is verified, $USER is the token user, JSON exception
// handler + CORS headers are installed. The legacy page stays live in parallel
// and is untouched.
//
// GET  ?report=workspace-series&token=…[&workspaceid=&consumer=&seriesid=]
//      -> the workspace's recurring series list exactly as the legacy page
//         renders it; with seriesid, the selected series plus its class sessions
//         and distinct-student count (+ teacher names).
// POST body JSON {"do": …}:
//      do=update_series      (legacy action=update_series)
//      do=reschedule_session (legacy action=reschedule_session)
//      do=cancel_session     (legacy action=cancel_session)
//      do=cancel_series      (legacy action=cancel_series)
// The legacy write helpers read their fields with optional_param() (they were
// built for a form POST). Token auth already replaces confirm_sesskey(), so the
// only bridge needed is to map the JSON body onto $_POST before calling the
// verbatim helper; each helper's DB writes, audits (pqwserl_audit) and parent/
// teacher notifications then run byte-for-byte as on the page, and the legacy
// re-render-with-message is returned as ok JSON instead.
// Access is the legacy page check verbatim: pqh_current_workspace_id resolution
// + pqh_user_can_manage_workspace(), with pqh_access_denied(...) -> pqpd_fail(403,
// same message). The legacy page never calls pqh_live_security_audit, so there is
// none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_series_portallib.php');

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
}

// ---- page preamble + ENTRY access check (legacy denial messages, verbatim) ----
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$seriesid = $ispost ? (int)($body['seriesid'] ?? 0) : optional_param('seriesid', 0, PARAM_INT);

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqpd_fail(403, 'Only workspace owners and admins can manage recurring workspace sessions.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening recurring workspace sessions.');
}

if ($ispost) {
    $do = (string)($body['do'] ?? '');
    try {
        if ($do === 'update_series') {
            // Legacy: optional_param seriesid/title/duration_minutes/lessonid/unitid.
            $seriesid = (int)($body['seriesid'] ?? 0);
            $_POST['title'] = (string)($body['title'] ?? '');
            $_POST['duration_minutes'] = (string)($body['duration_minutes'] ?? 60);
            $_POST['lessonid'] = (string)($body['lessonid'] ?? '');
            $_POST['unitid'] = (string)($body['unitid'] ?? '');
            pqwserl_update_series($workspaceid, $seriesid);
            $message = 'Recurring series updated.';
        } else if ($do === 'reschedule_session') {
            // Legacy: optional_param sessionid + scheduled_start.
            $_POST['scheduled_start'] = (string)($body['scheduled_start'] ?? '');
            $seriesid = pqwserl_reschedule_session($workspaceid, (int)($body['sessionid'] ?? 0));
            $message = 'Class rescheduled.';
        } else if ($do === 'cancel_session') {
            // Legacy: optional_param sessionid + cancellation_reason.
            $_POST['cancellation_reason'] = (string)($body['cancellation_reason'] ?? '');
            $seriesid = pqwserl_cancel_session($workspaceid, (int)($body['sessionid'] ?? 0));
            $message = 'Class cancelled.';
        } else if ($do === 'cancel_series') {
            // Legacy: optional_param seriesid + cancellation_reason.
            $seriesid = (int)($body['seriesid'] ?? 0);
            $_POST['cancellation_reason'] = (string)($body['cancellation_reason'] ?? '');
            pqwserl_cancel_series($workspaceid, $seriesid);
            $message = 'Recurring series cancelled.';
        } else {
            pqpd_fail(400, 'Unknown workspace-series action.');
        }
    } catch (Throwable $e) {
        // Legacy sets $error and re-renders the page; the API returns it as 400.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'seriesid' => $seriesid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: the series manager state (same computation order as the page) -------
$selectedseries = pqwserl_get_series($workspaceid, $seriesid);
$seriesrows = pqwserl_series($workspaceid);
$sessions = $selectedseries ? pqwserl_sessions((int)$selectedseries->id) : [];
$seriesstudents = $selectedseries ? count(pqwserl_series_studentids((int)$selectedseries->id)) : 0;

$curateseries = static function($row): array {
    return [
        'id' => (int)$row->id,
        'workspaceid' => (int)($row->workspaceid ?? 0),
        'teacherid' => (int)($row->teacherid ?? 0),
        'title' => (string)($row->title ?? ''),
        'lessonid' => (string)($row->lessonid ?? ''),
        'unitid' => (string)($row->unitid ?? ''),
        'pattern' => (string)($row->pattern ?? 'weekly'),
        'duration_minutes' => (int)($row->duration_minutes ?? 60),
        'status' => (string)($row->status ?? 'active'),
        'session_total' => (int)($row->session_total ?? 0),
        'upcoming_total' => (int)($row->upcoming_total ?? 0),
        'cancelled_total' => (int)($row->cancelled_total ?? 0),
        'timemodified' => (int)($row->timemodified ?? 0),
    ];
};
$curatesession = static function($s): array {
    return [
        'id' => (int)$s->id,
        'seriesid' => (int)($s->seriesid ?? 0),
        'series_sequence' => (int)($s->series_sequence ?? 0),
        'title' => (string)($s->title ?? ''),
        'teacherid' => (int)($s->teacherid ?? 0),
        'lessonid' => (string)($s->lessonid ?? ''),
        'unitid' => (string)($s->unitid ?? ''),
        'scheduled_start' => (int)($s->scheduled_start ?? 0),
        'scheduled_end' => (int)($s->scheduled_end ?? 0),
        'timezone' => (string)($s->timezone ?? ''),
        'status' => (string)($s->status ?? ''),
    ];
};

$nameids = [];
foreach ($seriesrows as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($sessions as $s) {
    $nameids[] = (int)($s->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => pqwserl_ready(),
    'workspace' => ['id' => (int)$workspace->id, 'name' => (string)$workspace->name],
    'workspaceid' => $workspaceid,
    'seriesid' => $selectedseries ? (int)$selectedseries->id : 0,
    'mode' => $selectedseries ? 'series' : 'list',
    'series' => array_map($curateseries, $seriesrows),
    'selectedseries' => $selectedseries ? $curateseries($selectedseries) : null,
    'sessions' => array_map($curatesession, $sessions),
    'seriesstudents' => $seriesstudents,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
