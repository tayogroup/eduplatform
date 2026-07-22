<?php
// ---- report: recordings-admin (admin recordings pipeline console; read + admin writes) ----
// Ported from local_hubredirect/live_recordings_admin.php via
// live_recordings_admin_portallib (pqradml_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the recording review queue (sessions, recordings, metrics, checklist).
// POST = do=sync_session|sync_all|publish|unpublish|mark_reviewed|archive|expire_old
//        (each ported verbatim from the legacy action blocks; confirm_sesskey()
//        dropped — token auth replaces the session key).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_recordings_admin_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Legacy entry check: pqh_require_academy_operations(...) — same predicate,
// same denial message, JSON instead of the access_denied redirect.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can review live-session recordings.');
}

$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

$tablesok = pqradml_table_exists('local_prequran_live_session')
    && pqradml_table_exists('local_prequran_live_recording');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Legacy runs writes only when $error === '' (tables installed).
    if (!$tablesok) {
        pqpd_fail(403, 'Live-session recording tables are not installed.');
    }
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    $notice = '';

    try {
        $action = clean_param($do, PARAM_ALPHANUMEXT);
        if ($action === '') {
            throw new invalid_parameter_exception('Choose a valid recording action.');
        }
        if ($action === 'sync_session') {
            // -- write: sync_session (legacy action=sync_session, verbatim) --
            $sessionid = (int)($body['sessionid'] ?? 0);
            $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
            if (!$session) {
                throw new invalid_parameter_exception('Choose a valid live session before syncing recordings.');
            }
            $result = pqradml_sync_session_recordings($session);
            $notice = 'BBB sync complete: ' . (int)$result['synced'] . ' synced, ' . (int)$result['created'] . ' created, ' . (int)$result['updated'] . ' updated.';
        } else if ($action === 'sync_all') {
            // -- write: sync_all (legacy action=sync_all, verbatim) --
            $sessions = $DB->get_records_sql(
                "SELECT *
                   FROM {local_prequran_live_session}
                  WHERE bbb_created = 1
                    AND recording_enabled = 1
               ORDER BY scheduled_start DESC, id DESC",
                [],
                0,
                25
            );
            $total = ['synced' => 0, 'created' => 0, 'updated' => 0];
            foreach ($sessions as $session) {
                $result = pqradml_sync_session_recordings($session);
                foreach ($total as $key => $value) {
                    $total[$key] += (int)$result[$key];
                }
            }
            $notice = 'BBB sync complete: ' . (int)$total['synced'] . ' synced, ' . (int)$total['created'] . ' created, ' . (int)$total['updated'] . ' updated.';
        } else if (in_array($action, ['publish', 'unpublish', 'mark_reviewed', 'archive'], true)) {
            // -- writes: publish / unpublish / mark_reviewed / archive (verbatim) --
            $recordingid = (int)($body['recordingid'] ?? 0);
            $recording = $recordingid > 0 ? $DB->get_record('local_prequran_live_recording', ['id' => $recordingid]) : false;
            if (!$recording) {
                throw new invalid_parameter_exception('Choose a valid recording before changing its review state.');
            }
            $wasvisible = !empty($recording->visible_to_parent);
            $auditaction = 'recording_reviewed';
            if ($action === 'publish') {
                if ((string)$recording->playback_url === '') {
                    throw new invalid_parameter_exception('Recording cannot be published because it has no playback URL.');
                }
                if (!empty($recording->expiresat) && (int)$recording->expiresat < time()) {
                    throw new invalid_parameter_exception('Recording cannot be published because its retention expiry has passed.');
                }
                $recording->visible_to_parent = 1;
                $recording->status = 'available';
                $notice = 'Recording published to parents.';
                $auditaction = 'recording_published';
            } else if ($action === 'unpublish') {
                $recording->visible_to_parent = 0;
                $notice = 'Recording hidden from parents.';
                $auditaction = 'recording_unpublished';
            } else if ($action === 'mark_reviewed') {
                $notice = 'Recording marked reviewed.';
                $auditaction = 'recording_reviewed';
            } else if ($action === 'archive') {
                $recording->visible_to_parent = 0;
                $recording->published = 0;
                $recording->status = 'archived';
                $notice = 'Recording archived and hidden from parents.';
                $auditaction = 'recording_archived';
            }
            $recording->reviewedby = (int)$USER->id;
            $recording->reviewedat = time();
            $recording->timemodified = time();
            $DB->update_record('local_prequran_live_recording', $recording);
            pqradml_audit((int)$recording->sessionid, $auditaction, 'recording', (int)$recording->id, [
                'visible_to_parent' => (int)$recording->visible_to_parent,
                'status' => (string)$recording->status,
                'expiresat' => (int)$recording->expiresat,
            ]);
            if ($action === 'publish' && !$wasvisible) {
                foreach (pqradml_recording_studentids((int)$recording->sessionid) as $studentid) {
                    local_prequran_notify_parent_live_update(
                        (int)$recording->sessionid,
                        (int)$studentid,
                        'Live class recording is ready',
                        'An approved recording from your child\'s ' . $brandname . ' live class is ready to view.',
                        new moodle_url('/local/hubredirect/live_recordings.php', ['childid' => (int)$studentid]),
                        'View live recording',
                        'live_recording_published'
                    );
                }
            }
        } else if ($action === 'expire_old') {
            // -- write: expire_old (legacy action=expire_old, verbatim) --
            $now = time();
            $records = $DB->get_records_sql(
                "SELECT *
                   FROM {local_prequran_live_recording}
                  WHERE expiresat > 0
                    AND expiresat < :now
                    AND status <> :expired",
                ['now' => $now, 'expired' => 'expired']
            );
            foreach ($records as $recording) {
                $recording->visible_to_parent = 0;
                $recording->published = 0;
                $recording->status = 'expired';
                $recording->timemodified = $now;
                $DB->update_record('local_prequran_live_recording', $recording);
                pqradml_audit((int)$recording->sessionid, 'recording_expired', 'recording', (int)$recording->id);
            }
            $notice = count($records) . ' expired recording(s) hidden from parents.';
        } else {
            throw new invalid_parameter_exception('Choose a valid recording action.');
        }
    } catch (Throwable $e) {
        // Legacy catches Throwable and surfaces the message in the error alert.
        pqpd_fail(400, $e->getMessage());
    }

    echo json_encode(['ok' => true, 'message' => $notice], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the review console state (same reads, same order as the page) --------
$error = $tablesok ? '' : 'Live-session recording tables are not installed.';

$sessions = [];
if (pqradml_table_exists('local_prequran_live_session')) {
    $sessions = $DB->get_records_sql(
        "SELECT s.*,
                COUNT(r.id) AS recording_count
           FROM {local_prequran_live_session} s
      LEFT JOIN {local_prequran_live_recording} r ON r.sessionid = s.id
          WHERE s.bbb_created = 1
       GROUP BY s.id, s.cohortid, s.teacherid, s.lessonid, s.unitid, s.title, s.description, s.scheduled_start,
                s.scheduled_end, s.timezone, s.status, s.recording_enabled, s.recording_consent_required,
                s.parent_observer_allowed, s.max_participants, s.bbb_meeting_id, s.bbb_internal_meeting_id,
                s.bbb_created, s.bbb_create_time, s.bbb_last_error, s.createdby, s.cancelledby,
                s.cancellation_reason, s.timecreated, s.timemodified
       ORDER BY s.scheduled_start DESC, s.id DESC",
        [],
        0,
        30
    );
}
$recordings = pqradml_recordings();
$now = time();
$retentiondays = (int)get_config('local_prequran', 'bbb_recording_retention_days');
if ($retentiondays <= 0) {
    $retentiondays = 90;
}
$metrics = [
    'synced_total' => pqradml_count_sql("SELECT COUNT(1) FROM {local_prequran_live_recording}"),
    'pending_review' => pqradml_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE status = :available
            AND (reviewedat = 0 OR visible_to_parent = 0)",
        ['available' => 'available']
    ),
    'parent_visible' => pqradml_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE visible_to_parent = 1
            AND status = :available",
        ['available' => 'available']
    ),
    'visible_without_review' => pqradml_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE visible_to_parent = 1
            AND reviewedat = 0"
    ),
    'expired_visible' => pqradml_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE visible_to_parent = 1
            AND expiresat > 0
            AND expiresat < :nowtime",
        ['nowtime' => $now]
    ),
    'expiring_7d' => pqradml_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE status = :available
            AND expiresat > :nowtime
            AND expiresat <= :untiltime",
        ['available' => 'available', 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS)]
    ),
];
$lastaudit = function (string $action) use ($DB) {
    if (!pqradml_table_exists('local_prequran_live_audit')) {
        return 0;
    }
    $row = $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action = :action
       ORDER BY timecreated DESC, id DESC",
        ['action' => $action],
        IGNORE_MULTIPLE
    );
    return $row ? (int)$row->timecreated : 0;
};

// Decorate for the client (same derivations the page computes while rendering);
// raw_metadata (the stored BBB XML blob) is never rendered by the page, so it
// is stripped from the JSON payload.
$recout = [];
$nameids = [];
foreach ($recordings as $recording) {
    $recording->expired = !empty($recording->expiresat) && (int)$recording->expiresat < time();
    $recording->reviewed = !empty($recording->reviewedat);
    unset($recording->raw_metadata);
    $nameids[] = (int)($recording->teacherid ?? 0);
    $nameids[] = (int)($recording->reviewedby ?? 0);
    $recout[] = $recording;
}
foreach ($sessions as $session) {
    $nameids[] = (int)($session->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => $tablesok,
    'error' => $error,
    'brand' => $brandname,
    'retentiondays' => $retentiondays,
    'metrics' => $metrics,
    'lastsync' => $lastaudit('recordings_synced'),
    'lastautosync' => $lastaudit('recordings_auto_synced'),
    'lastqueue' => $lastaudit('recording_review_queue_reminder'),
    'lastexpiry' => $lastaudit('recording_expired'),
    'sessions' => array_values($sessions),
    'recordings' => $recout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
