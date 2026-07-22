<?php
// Live-recordings-admin query library — extracted VERBATIM from
// live_recordings_admin.php (renamed pqlra_ -> pqradml_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first;
// pqradml_sync_session_recordings loads local/prequran/locallib.php itself.

defined('MOODLE_INTERNAL') || die();

function pqradml_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqradml_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqradml_table_exists('local_prequran_live_audit')) {
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

function pqradml_bbb_text($node, string $field): string {
    return isset($node->{$field}) ? trim((string)$node->{$field}) : '';
}

function pqradml_bbb_bool(string $value): int {
    return in_array(strtolower(trim($value)), ['true', '1', 'yes'], true) ? 1 : 0;
}

function pqradml_recording_playback($recording): array {
    $playbackurl = '';
    $format = '';
    $duration = 0;

    if (isset($recording->playback->format)) {
        foreach ($recording->playback->format as $item) {
            $candidateurl = pqradml_bbb_text($item, 'url');
            if ($candidateurl === '') {
                continue;
            }
            $candidateformat = pqradml_bbb_text($item, 'type');
            $candidateduration = (int)pqradml_bbb_text($item, 'length');
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

function pqradml_local_recording_status(string $bbbstate, string $playbackurl): string {
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

function pqradml_sync_session_recordings($session): array {
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
        pqradml_audit((int)$session->id, 'recordings_sync_empty', 'session', (int)$session->id);
        return ['synced' => 0, 'created' => 0, 'updated' => 0];
    }

    foreach ($xml->recordings->recording as $bbbrecording) {
        $recordid = pqradml_bbb_text($bbbrecording, 'recordID');
        if ($recordid === '') {
            continue;
        }
        [$playbackurl, $playbackformat, $duration] = pqradml_recording_playback($bbbrecording);
        $localstatus = pqradml_local_recording_status(pqradml_bbb_text($bbbrecording, 'state'), $playbackurl);
        $startms = (int)pqradml_bbb_text($bbbrecording, 'startTime');
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
            $record->name = pqradml_bbb_text($bbbrecording, 'name') ?: (string)$session->title;
            $record->playback_url = $playbackurl;
            $record->playback_format = $playbackformat;
            $record->duration_minutes = $duration;
            $record->published = pqradml_bbb_bool(pqradml_bbb_text($bbbrecording, 'published'));
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
                'name' => pqradml_bbb_text($bbbrecording, 'name') ?: (string)$session->title,
                'playback_url' => $playbackurl,
                'playback_format' => $playbackformat,
                'duration_minutes' => $duration,
                'published' => pqradml_bbb_bool(pqradml_bbb_text($bbbrecording, 'published')),
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

    pqradml_audit((int)$session->id, 'recordings_synced', 'session', (int)$session->id, [
        'synced' => $synced,
        'created' => $created,
        'updated' => $updated,
        'actor' => (int)$USER->id,
    ]);

    return ['synced' => $synced, 'created' => $created, 'updated' => $updated];
}

function pqradml_recordings(): array {
    global $DB;
    if (!pqradml_table_exists('local_prequran_live_recording')) {
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

function pqradml_recording_studentids(int $sessionid): array {
    global $DB;
    if (!pqradml_table_exists('local_prequran_live_participant')) {
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

function pqradml_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}
