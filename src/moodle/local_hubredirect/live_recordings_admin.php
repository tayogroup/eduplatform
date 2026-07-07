<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can review live-session recordings.');

$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_recordings_admin.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Recording Review');
$PAGE->set_heading('Live Recording Review');
$PAGE->add_body_class('pqh-live-recordings-page');

function pqlra_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlra_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlra_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlra_bbb_text($node, string $field): string {
    return isset($node->{$field}) ? trim((string)$node->{$field}) : '';
}

function pqlra_bbb_bool(string $value): int {
    return in_array(strtolower(trim($value)), ['true', '1', 'yes'], true) ? 1 : 0;
}

function pqlra_recording_playback($recording): array {
    $playbackurl = '';
    $format = '';
    $duration = 0;

    if (isset($recording->playback->format)) {
        foreach ($recording->playback->format as $item) {
            $candidateurl = pqlra_bbb_text($item, 'url');
            if ($candidateurl === '') {
                continue;
            }
            $candidateformat = pqlra_bbb_text($item, 'type');
            $candidateduration = (int)pqlra_bbb_text($item, 'length');
            if ($playbackurl === '' || $candidateformat === 'presentation') {
                $playbackurl = $candidateurl;
                $format = $candidateformat !== '' ? $candidateformat : 'presentation';
                $duration = $candidateduration;
            }
            if ($candidateformat === 'presentation') {
                break;
            }
        }
    }

    return [$playbackurl, $format, $duration];
}

function pqlra_local_recording_status(string $bbbstate, string $playbackurl): string {
    $state = strtolower(trim($bbbstate));
    if (in_array($state, ['processing', 'processed', 'queued'], true)) {
        return $playbackurl !== '' ? 'available' : 'processing';
    }
    if (in_array($state, ['deleted', 'removed'], true)) {
        return 'deleted';
    }
    if ($playbackurl !== '') {
        return 'available';
    }
    return $state !== '' ? $state : 'processing';
}

function pqlra_sync_session_recordings($session): array {
    global $CFG, $DB, $USER;

    $locallib = $CFG->dirroot . '/local/prequran/locallib.php';
    if (!file_exists($locallib)) {
        throw new invalid_parameter_exception('Live recording sync is unavailable because the BBB helper library is not installed.');
    }
    require_once($locallib);

    $xml = local_prequran_bbb_get_recordings((string)$session->bbb_meeting_id);
    $synced = 0;
    $created = 0;
    $updated = 0;
    $now = time();
    $recordingcolumns = $DB->get_columns('local_prequran_live_recording');
    $retentiondays = (int)get_config('local_prequran', 'bbb_recording_retention_days');
    if ($retentiondays <= 0) {
        $retentiondays = 90;
    }

    if (!isset($xml->recordings->recording)) {
        pqlra_audit((int)$session->id, 'recordings_sync_empty', 'session', (int)$session->id);
        return ['synced' => 0, 'created' => 0, 'updated' => 0];
    }

    foreach ($xml->recordings->recording as $bbbrecording) {
        $recordid = pqlra_bbb_text($bbbrecording, 'recordID');
        if ($recordid === '') {
            continue;
        }
        [$playbackurl, $playbackformat, $duration] = pqlra_recording_playback($bbbrecording);
        $localstatus = pqlra_local_recording_status(pqlra_bbb_text($bbbrecording, 'state'), $playbackurl);
        $startms = (int)pqlra_bbb_text($bbbrecording, 'startTime');
        $recordtime = $startms > 0 ? (int)floor($startms / 1000) : $now;
        $expiresat = $recordtime + ($retentiondays * DAYSECS);
        $raw = $bbbrecording->asXML();

        $record = $DB->get_record('local_prequran_live_recording', ['bbb_record_id' => $recordid]);
        if ($record) {
            $record->sessionid = (int)$session->id;
            if (array_key_exists('workspaceid', $recordingcolumns)) {
                $record->workspaceid = (int)($session->workspaceid ?? 0);
            }
            $record->bbb_meeting_id = (string)$session->bbb_meeting_id;
            $record->name = pqlra_bbb_text($bbbrecording, 'name') ?: (string)$session->title;
            $record->playback_url = $playbackurl;
            $record->playback_format = $playbackformat;
            $record->duration_minutes = $duration;
            $record->published = pqlra_bbb_bool(pqlra_bbb_text($bbbrecording, 'published'));
            $record->status = $localstatus;
            $record->expiresat = $expiresat;
            $record->raw_metadata = $raw;
            $record->timemodified = $now;
            $DB->update_record('local_prequran_live_recording', $record);
            $updated++;
        } else {
            $newrecord = (object)[
                'sessionid' => (int)$session->id,
                'bbb_record_id' => $recordid,
                'bbb_meeting_id' => (string)$session->bbb_meeting_id,
                'name' => pqlra_bbb_text($bbbrecording, 'name') ?: (string)$session->title,
                'playback_url' => $playbackurl,
                'playback_format' => $playbackformat,
                'duration_minutes' => $duration,
                'published' => pqlra_bbb_bool(pqlra_bbb_text($bbbrecording, 'published')),
                'visible_to_parent' => 0,
                'status' => $localstatus,
                'reviewedby' => 0,
                'reviewedat' => 0,
                'expiresat' => $expiresat,
                'raw_metadata' => $raw,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (array_key_exists('workspaceid', $recordingcolumns)) {
                $newrecord->workspaceid = (int)($session->workspaceid ?? 0);
            }
            $DB->insert_record('local_prequran_live_recording', $newrecord);
            $created++;
        }
        $synced++;
    }

    pqlra_audit((int)$session->id, 'recordings_synced', 'session', (int)$session->id, [
        'synced' => $synced,
        'created' => $created,
        'updated' => $updated,
        'actor' => (int)$USER->id,
    ]);

    return ['synced' => $synced, 'created' => $created, 'updated' => $updated];
}

function pqlra_recordings(): array {
    global $DB;
    if (!pqlra_table_exists('local_prequran_live_recording')) {
        return [];
    }

    return array_values($DB->get_records_sql(
        "SELECT r.*,
                s.title AS session_title,
                s.teacherid,
                s.scheduled_start,
                s.status AS session_status
           FROM {local_prequran_live_recording} r
      LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
       ORDER BY r.timemodified DESC, r.id DESC",
        [],
        0,
        80
    ));
}

function pqlra_recording_studentids(int $sessionid): array {
    global $DB;
    if (!pqlra_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $rows = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => $sessionid,
        'role' => 'student',
        'status' => 'active',
    ]);
    $studentids = [];
    foreach ($rows as $row) {
        $studentid = (int)($row->studentid ?: $row->userid);
        if ($studentid > 0) {
            $studentids[$studentid] = $studentid;
        }
    }
    return array_values($studentids);
}

function pqlra_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

$notice = '';
$error = '';

if (!pqlra_table_exists('local_prequran_live_session') || !pqlra_table_exists('local_prequran_live_recording')) {
    $error = 'Live-session recording tables are not installed.';
}

if ($error === '' && optional_param('action', '', PARAM_ALPHANUMEXT) !== '') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This recording review form expired. Please refresh and try again.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action === '') {
            throw new invalid_parameter_exception('Choose a valid recording action.');
        }
        if ($action === 'sync_session') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
            if (!$session) {
                throw new invalid_parameter_exception('Choose a valid live session before syncing recordings.');
            }
            $result = pqlra_sync_session_recordings($session);
            $notice = 'BBB sync complete: ' . (int)$result['synced'] . ' synced, ' . (int)$result['created'] . ' created, ' . (int)$result['updated'] . ' updated.';
        } else if ($action === 'sync_all') {
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
                $result = pqlra_sync_session_recordings($session);
                foreach ($total as $key => $value) {
                    $total[$key] += (int)$result[$key];
                }
            }
            $notice = 'BBB sync complete: ' . (int)$total['synced'] . ' synced, ' . (int)$total['created'] . ' created, ' . (int)$total['updated'] . ' updated.';
        } else if (in_array($action, ['publish', 'unpublish', 'mark_reviewed', 'archive'], true)) {
            $recordingid = optional_param('recordingid', 0, PARAM_INT);
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
            pqlra_audit((int)$recording->sessionid, $auditaction, 'recording', (int)$recording->id, [
                'visible_to_parent' => (int)$recording->visible_to_parent,
                'status' => (string)$recording->status,
                'expiresat' => (int)$recording->expiresat,
            ]);
            if ($action === 'publish' && !$wasvisible) {
                foreach (pqlra_recording_studentids((int)$recording->sessionid) as $studentid) {
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
                pqlra_audit((int)$recording->sessionid, 'recording_expired', 'recording', (int)$recording->id);
            }
            $notice = count($records) . ' expired recording(s) hidden from parents.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$sessions = [];
if (pqlra_table_exists('local_prequran_live_session')) {
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
$recordings = pqlra_recordings();
$now = time();
$retentiondays = (int)get_config('local_prequran', 'bbb_recording_retention_days');
if ($retentiondays <= 0) {
    $retentiondays = 90;
}
$metrics = [
    'synced_total' => pqlra_count_sql("SELECT COUNT(1) FROM {local_prequran_live_recording}"),
    'pending_review' => pqlra_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE status = :available
            AND (reviewedat = 0 OR visible_to_parent = 0)",
        ['available' => 'available']
    ),
    'parent_visible' => pqlra_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE visible_to_parent = 1
            AND status = :available",
        ['available' => 'available']
    ),
    'visible_without_review' => pqlra_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE visible_to_parent = 1
            AND reviewedat = 0"
    ),
    'expired_visible' => pqlra_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE visible_to_parent = 1
            AND expiresat > 0
            AND expiresat < :nowtime",
        ['nowtime' => $now]
    ),
    'expiring_7d' => pqlra_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_recording}
          WHERE status = :available
            AND expiresat > :nowtime
            AND expiresat <= :untiltime",
        ['available' => 'available', 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS)]
    ),
];
$lastsync = pqlra_table_exists('local_prequran_live_audit')
    ? $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action = :action
       ORDER BY timecreated DESC, id DESC",
        ['action' => 'recordings_synced'],
        IGNORE_MULTIPLE
    )
    : false;
$lastexpiry = pqlra_table_exists('local_prequran_live_audit')
    ? $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action = :action
       ORDER BY timecreated DESC, id DESC",
        ['action' => 'recording_expired'],
        IGNORE_MULTIPLE
    )
    : false;
$lastautosync = pqlra_table_exists('local_prequran_live_audit')
    ? $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action = :action
       ORDER BY timecreated DESC, id DESC",
        ['action' => 'recordings_auto_synced'],
        IGNORE_MULTIPLE
    )
    : false;
$lastqueue = pqlra_table_exists('local_prequran_live_audit')
    ? $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action = :action
       ORDER BY timecreated DESC, id DESC",
        ['action' => 'recording_review_queue_reminder'],
        IGNORE_MULTIPLE
    )
    : false;

echo $OUTPUT->header();
?>
<style>
body.pqh-live-recordings-page header,
body.pqh-live-recordings-page footer,
body.pqh-live-recordings-page nav.navbar,
body.pqh-live-recordings-page #page-header,
body.pqh-live-recordings-page #page-footer,
body.pqh-live-recordings-page .drawer,
body.pqh-live-recordings-page .drawer-toggles,
body.pqh-live-recordings-page .block-region,
body.pqh-live-recordings-page [data-region="drawer"],
body.pqh-live-recordings-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-recordings-page #page,
body.pqh-live-recordings-page #page-content,
body.pqh-live-recordings-page #region-main,
body.pqh-live-recordings-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlra-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlra-wrap{max-width:1180px;margin:0 auto}
.pqlra-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlra-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlra-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlra-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlra-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlra-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlra-btn--warn{background:#8a5a2f}
.pqlra-alert{margin-bottom:14px;padding:12px 14px;border-radius:8px;font-size:14px;font-weight:850}
.pqlra-alert--ok{background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16)}
.pqlra-alert--bad{background:#fff0ed;color:#883526;border:1px solid rgba(136,53,38,.16)}
.pqlra-panel{margin-bottom:16px;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlra-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqlra-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlra-metric{padding:14px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlra-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlra-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlra-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlra-table th,.pqlra-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlra-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqlra-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqlra-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlra-pill--ok{background:#edf9ef;color:#245c35}
.pqlra-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlra-row-actions{display:flex;flex-wrap:wrap;gap:6px}
@media(max-width:900px){.pqlra-top{display:block}.pqlra-actions{margin-top:12px}.pqlra-table{display:block;overflow:auto}.pqlra-title{font-size:24px}.pqlra-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlra-shell">
  <div class="pqlra-wrap">
    <section class="pqlra-top pqh-workspace-top">
      <div>
        <h1 class="pqlra-title pqh-workspace-title">Live Recording Review</h1>
        <p class="pqlra-sub pqh-workspace-sub">Sync BBB recordings, keep them hidden by default, review quality, publish safely, and monitor retention automation.</p>
      </div>
      <div class="pqlra-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="sync_all">
          <button class="pqlra-btn" type="submit">Sync BBB recordings</button>
        </form>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="expire_old">
          <button class="pqlra-btn pqlra-btn--warn" type="submit">Apply retention expiry</button>
        </form>
        <a class="pqlra-btn pqlra-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqlra-btn pqlra-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlra-btn pqlra-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_diagnostics.php'))->out(false); ?>">Diagnostics</a>
      </div>
    </section>

    <?php if ($notice !== ''): ?><div class="pqlra-alert pqlra-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqlra-alert pqlra-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqlra-metrics" aria-label="Recording operations metrics">
      <div class="pqlra-metric"><strong><?php echo (int)$metrics['synced_total']; ?></strong><span>stored recordings</span></div>
      <div class="pqlra-metric"><strong><?php echo (int)$metrics['pending_review']; ?></strong><span>review queue</span></div>
      <div class="pqlra-metric"><strong><?php echo (int)$metrics['parent_visible']; ?></strong><span>parent visible</span></div>
      <div class="pqlra-metric"><strong><?php echo (int)$metrics['visible_without_review']; ?></strong><span>visible without review</span></div>
      <div class="pqlra-metric"><strong><?php echo (int)$metrics['expired_visible']; ?></strong><span>expired visible</span></div>
      <div class="pqlra-metric"><strong><?php echo (int)$metrics['expiring_7d']; ?></strong><span>expiring 7d</span></div>
    </section>

    <section class="pqlra-panel">
      <h2>Pilot Operations Checklist</h2>
      <table class="pqlra-table">
        <tr><th>Item</th><th>Status</th></tr>
        <tr><td>Operating model</td><td>Scheduled Moodle cron sync checks recent ended BBB sessions hourly. Manual sync remains available for immediate checks.</td></tr>
        <tr><td>Retention policy</td><td><?php echo (int)$retentiondays; ?> day(s). Expired recordings are automatically hidden from parents and marked expired.</td></tr>
        <tr><td>Last sync</td><td><?php echo $lastsync ? userdate((int)$lastsync->timecreated, get_string('strftimedatetimeshort')) : 'No sync audit yet'; ?></td></tr>
        <tr><td>Last automated sync</td><td><?php echo $lastautosync ? userdate((int)$lastautosync->timecreated, get_string('strftimedatetimeshort')) : 'No automated sync audit yet'; ?></td></tr>
        <tr><td>Last review queue reminder</td><td><?php echo $lastqueue ? userdate((int)$lastqueue->timecreated, get_string('strftimedatetimeshort')) : 'No review queue reminder audit yet'; ?></td></tr>
        <tr><td>Last expiry run</td><td><?php echo $lastexpiry ? userdate((int)$lastexpiry->timecreated, get_string('strftimedatetimeshort')) : 'No expired recording audit yet'; ?></td></tr>
        <tr><td>Publish rule</td><td>Recordings remain hidden until admin review. Expired recordings and recordings without playback URLs cannot be published.</td></tr>
      </table>
    </section>

    <section class="pqlra-panel">
      <h2>BBB Sessions</h2>
      <table class="pqlra-table">
        <tr><th>Session</th><th>Start</th><th>Recording</th><th>Stored</th><th>Action</th></tr>
        <?php foreach ($sessions as $session): ?>
          <tr>
            <td><?php echo s((string)$session->title); ?><br><span class="pqlra-code"><?php echo s((string)$session->bbb_meeting_id); ?></span></td>
            <td><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?></td>
            <td><?php echo !empty($session->recording_enabled) ? 'enabled' : 'off'; ?></td>
            <td><?php echo (int)$session->recording_count; ?></td>
            <td>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="sync_session">
                <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                <button class="pqlra-btn pqlra-btn--light" type="submit">Sync this session</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$sessions): ?><tr><td colspan="5">No BBB-created sessions found yet.</td></tr><?php endif; ?>
      </table>
    </section>

    <section class="pqlra-panel">
      <h2>Admin Quality Review</h2>
      <table class="pqlra-table">
        <tr><th>Recording</th><th>Session</th><th>Status</th><th>Parent Visibility</th><th>Retention</th><th>Review</th><th>Actions</th></tr>
        <?php foreach ($recordings as $recording): ?>
          <?php
            $expired = !empty($recording->expiresat) && (int)$recording->expiresat < time();
            $reviewed = !empty($recording->reviewedat);
          ?>
          <tr>
            <td>
              <strong><?php echo s((string)$recording->name); ?></strong><br>
              <span class="pqlra-code"><?php echo s((string)$recording->bbb_record_id); ?></span><br>
              <?php if ((string)$recording->playback_url !== ''): ?>
                <a href="<?php echo s((string)$recording->playback_url); ?>" target="_blank" rel="noopener noreferrer">Open playback</a>
              <?php endif; ?>
            </td>
            <td><?php echo s((string)($recording->session_title ?? 'Session ' . (int)$recording->sessionid)); ?><br><?php echo !empty($recording->scheduled_start) ? userdate((int)$recording->scheduled_start, get_string('strftimedatetimeshort')) : ''; ?></td>
            <td><span class="pqlra-pill <?php echo (string)$recording->status === 'available' ? 'pqlra-pill--ok' : 'pqlra-pill--warn'; ?>"><?php echo s((string)$recording->status); ?></span></td>
            <td><span class="pqlra-pill <?php echo !empty($recording->visible_to_parent) ? 'pqlra-pill--ok' : 'pqlra-pill--warn'; ?>"><?php echo !empty($recording->visible_to_parent) ? 'visible to parents' : 'hidden'; ?></span></td>
            <td><?php echo !empty($recording->expiresat) ? userdate((int)$recording->expiresat, get_string('strftimedatetimeshort')) : 'not set'; ?><?php echo $expired ? '<br><span class="pqlra-pill pqlra-pill--warn">expired</span>' : ''; ?></td>
            <td><?php echo $reviewed ? 'Reviewed by #' . (int)$recording->reviewedby . '<br>' . userdate((int)$recording->reviewedat, get_string('strftimedatetimeshort')) : 'Not reviewed'; ?></td>
            <td>
              <div class="pqlra-row-actions pqh-workspace-actions">
                <?php foreach ([
                    'mark_reviewed' => 'Mark reviewed',
                    'publish' => 'Publish',
                    'unpublish' => 'Hide',
                    'archive' => 'Archive',
                ] as $action => $label): ?>
                  <form method="post">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="<?php echo s($action); ?>">
                    <input type="hidden" name="recordingid" value="<?php echo (int)$recording->id; ?>">
                    <button class="pqlra-btn <?php echo in_array($action, ['unpublish', 'archive'], true) ? 'pqlra-btn--warn' : 'pqlra-btn--light'; ?>" type="submit"><?php echo s($label); ?></button>
                  </form>
                <?php endforeach; ?>
              </div>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$recordings): ?><tr><td colspan="7">No recordings synced yet.</td></tr><?php endif; ?>
      </table>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
