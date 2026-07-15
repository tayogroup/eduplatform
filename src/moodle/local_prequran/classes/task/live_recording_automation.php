<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/prequran/locallib.php');
require_once($GLOBALS['CFG']->dirroot . '/local/prequran/notificationlib.php');

class live_recording_automation extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_live_recording_automation', 'local_prequran');
    }

    public function execute(): void {
        if (!$this->tables_ready()) {
            mtrace('PreQuran recording automation skipped: live recording tables are not ready.');
            return;
        }

        $total = ['synced' => 0, 'created' => 0, 'updated' => 0, 'available' => 0];
        foreach ($this->sessions_to_sync() as $session) {
            try {
                $result = $this->sync_session_recordings($session);
                foreach ($total as $key => $value) {
                    $total[$key] += (int)($result[$key] ?? 0);
                }
            } catch (\Throwable $e) {
                $this->audit((int)$session->id, 'recordings_sync_failed', 'session', (int)$session->id, [
                    'error' => $e->getMessage(),
                ]);
                mtrace('PreQuran recording sync failed for session ' . (int)$session->id . ': ' . $e->getMessage());
            }
        }

        $expired = $this->expire_old_recordings();
        $reviewreminders = $this->send_review_queue_reminders();
        $expiryreminders = $this->send_expiry_reminders();

        mtrace('PreQuran recording automation complete: '
            . (int)$total['synced'] . ' synced, '
            . (int)$total['created'] . ' created, '
            . (int)$total['updated'] . ' updated, '
            . (int)$total['available'] . ' available, '
            . (int)$expired . ' expired, '
            . (int)$reviewreminders . ' review reminders, '
            . (int)$expiryreminders . ' expiry reminders.');
    }

    private function tables_ready(): bool {
        global $DB;
        $manager = $DB->get_manager();
        return $manager->table_exists('local_prequran_live_session')
            && $manager->table_exists('local_prequran_live_recording')
            && $manager->table_exists('local_prequran_live_audit');
    }

    private function has_field(string $table, string $field): bool {
        global $DB;
        return $DB->get_manager()->field_exists($table, $field);
    }

    private function audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
        global $DB;
        if (!$DB->get_manager()->table_exists('local_prequran_live_audit')) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $sessionid,
            'actorid' => 0,
            'action' => $action,
            'targettype' => $targettype,
            'targetid' => $targetid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }

    private function audit_exists(int $sessionid, string $action, string $targettype, int $targetid): bool {
        global $DB;
        return $DB->record_exists('local_prequran_live_audit', [
            'sessionid' => $sessionid,
            'action' => $action,
            'targettype' => $targettype,
            'targetid' => $targetid,
        ]);
    }

    private function sessions_to_sync(): array {
        global $DB;
        $lookbackdays = (int)get_config('local_prequran', 'bbb_recording_sync_lookback_days');
        if ($lookbackdays <= 0) {
            $lookbackdays = 14;
        }
        $limit = (int)get_config('local_prequran', 'bbb_recording_sync_limit');
        if ($limit <= 0) {
            $limit = 30;
        }
        $now = time();
        return array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE bbb_created = 1
                AND recording_enabled = 1
                AND bbb_meeting_id <> ''
                AND scheduled_end <= :endedbefore
                AND scheduled_end >= :since
           ORDER BY scheduled_end DESC, id DESC",
            [
                'endedbefore' => $now - (15 * MINSECS),
                'since' => $now - ($lookbackdays * DAYSECS),
            ],
            0,
            $limit
        ));
    }

    private function bbb_text($node, string $field): string {
        return isset($node->{$field}) ? trim((string)$node->{$field}) : '';
    }

    private function bbb_bool(string $value): int {
        return in_array(strtolower(trim($value)), ['true', '1', 'yes'], true) ? 1 : 0;
    }

    private function recording_playback($recording): array {
        $playbackurl = '';
        $format = '';
        $duration = 0;
        if (isset($recording->playback->format)) {
            foreach ($recording->playback->format as $item) {
                $candidateurl = $this->bbb_text($item, 'url');
                if ($candidateurl === '') {
                    continue;
                }
                $candidateformat = $this->bbb_text($item, 'type');
                $candidateduration = (int)$this->bbb_text($item, 'length');
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

    private function local_status(string $bbbstate, string $playbackurl): string {
        $state = strtolower(trim($bbbstate));
        if (in_array($state, ['processing', 'processed', 'queued'], true)) {
            return $playbackurl !== '' ? 'available' : 'processing';
        }
        if (in_array($state, ['deleted', 'removed'], true)) {
            return 'deleted';
        }
        return $playbackurl !== '' ? 'available' : ($state !== '' ? $state : 'processing');
    }

    private function sync_session_recordings($session): array {
        global $DB;
        $xml = local_prequran_bbb_get_recordings((string)$session->bbb_meeting_id);
        $total = ['synced' => 0, 'created' => 0, 'updated' => 0, 'available' => 0];
        $now = time();
        $retentiondays = (int)get_config('local_prequran', 'bbb_recording_retention_days');
        if ($retentiondays <= 0) {
            $retentiondays = 90;
        }

        if (!isset($xml->recordings->recording)) {
            $this->audit((int)$session->id, 'recordings_sync_empty', 'session', (int)$session->id);
            return $total;
        }

        foreach ($xml->recordings->recording as $bbbrecording) {
            $recordid = $this->bbb_text($bbbrecording, 'recordID');
            if ($recordid === '') {
                continue;
            }
            [$playbackurl, $playbackformat, $duration] = $this->recording_playback($bbbrecording);
            $localstatus = $this->local_status($this->bbb_text($bbbrecording, 'state'), $playbackurl);
            $startms = (int)$this->bbb_text($bbbrecording, 'startTime');
            $recordtime = $startms > 0 ? (int)floor($startms / 1000) : $now;
            $expiresat = $recordtime + ($retentiondays * DAYSECS);
            $raw = $bbbrecording->asXML();

            $record = $DB->get_record('local_prequran_live_recording', ['bbb_record_id' => $recordid]);
            $wasavailable = $record && (string)$record->status === 'available';
            if ($record) {
                $record->sessionid = (int)$session->id;
                if ($this->has_field('local_prequran_live_recording', 'workspaceid')) {
                    $record->workspaceid = (int)($session->workspaceid ?? 0);
                }
                $record->bbb_meeting_id = (string)$session->bbb_meeting_id;
                $record->name = $this->bbb_text($bbbrecording, 'name') ?: (string)$session->title;
                $record->playback_url = $playbackurl;
                $record->playback_format = $playbackformat;
                $record->duration_minutes = $duration;
                $record->published = $this->bbb_bool($this->bbb_text($bbbrecording, 'published'));
                if ((string)$record->status !== 'archived' && (string)$record->status !== 'expired') {
                    $record->status = $localstatus;
                }
                $record->expiresat = $expiresat;
                $record->raw_metadata = $raw;
                $record->timemodified = $now;
                $DB->update_record('local_prequran_live_recording', $record);
                $recordingid = (int)$record->id;
                $total['updated']++;
            } else {
                $newrecord = (object)[
                    'sessionid' => (int)$session->id,
                    'bbb_record_id' => $recordid,
                    'bbb_meeting_id' => (string)$session->bbb_meeting_id,
                    'name' => $this->bbb_text($bbbrecording, 'name') ?: (string)$session->title,
                    'playback_url' => $playbackurl,
                    'playback_format' => $playbackformat,
                    'duration_minutes' => $duration,
                    'published' => $this->bbb_bool($this->bbb_text($bbbrecording, 'published')),
                    'visible_to_parent' => 0,
                    'status' => $localstatus,
                    'reviewedby' => 0,
                    'reviewedat' => 0,
                    'expiresat' => $expiresat,
                    'raw_metadata' => $raw,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ];
                if ($this->has_field('local_prequran_live_recording', 'workspaceid')) {
                    $newrecord->workspaceid = (int)($session->workspaceid ?? 0);
                }
                $recordingid = (int)$DB->insert_record('local_prequran_live_recording', $newrecord);
                $total['created']++;
            }

            $total['synced']++;
            if ($localstatus === 'available') {
                $total['available']++;
                if (!$wasavailable) {
                    $this->audit((int)$session->id, 'recording_available_detected', 'recording', $recordingid, [
                        'bbb_record_id' => $recordid,
                    ]);
                }
            }
        }

        $this->audit((int)$session->id, 'recordings_auto_synced', 'session', (int)$session->id, $total);
        return $total;
    }

    private function expire_old_recordings(): int {
        global $DB;
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
            $this->audit((int)$recording->sessionid, 'recording_expired', 'recording', (int)$recording->id);
        }
        return count($records);
    }

    private function send_review_queue_reminders(): int {
        global $DB;
        $records = $DB->get_records_sql(
            "SELECT r.*, s.title AS session_title
               FROM {local_prequran_live_recording} r
          LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
              WHERE r.status = :available
                AND r.playback_url <> ''
                AND (r.reviewedat = 0 OR r.visible_to_parent = 0)
           ORDER BY r.timemodified DESC, r.id DESC",
            ['available' => 'available'],
            0,
            20
        );
        $sent = 0;
        foreach ($records as $recording) {
            if ($this->audit_exists((int)$recording->sessionid, 'recording_review_queue_reminder', 'recording', (int)$recording->id)) {
                continue;
            }
            foreach (get_admins() as $admin) {
                if (local_prequran_notify_user_live_update(
                    (int)$recording->sessionid,
                    (int)$admin->id,
                    'Recording ready for review',
                    'A BBB live-class recording is available and waiting for parent-visibility review.',
                    new \moodle_url('/local/hubredirect/live_recordings_admin.php'),
                    'Review recording',
                    'recording_review_queue_reminder'
                )) {
                    $sent++;
                }
            }
            $this->audit((int)$recording->sessionid, 'recording_review_queue_reminder', 'recording', (int)$recording->id, [
                'session_title' => (string)($recording->session_title ?? ''),
            ]);
        }
        return $sent;
    }

    private function send_expiry_reminders(): int {
        global $DB;
        $days = (int)get_config('local_prequran', 'bbb_recording_expiry_reminder_days');
        if ($days <= 0) {
            $days = 7;
        }
        $now = time();
        $records = $DB->get_records_sql(
            "SELECT r.*, s.title AS session_title
               FROM {local_prequran_live_recording} r
          LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
              WHERE r.status = :available
                AND r.visible_to_parent = 1
                AND r.expiresat > :now
                AND r.expiresat <= :until
           ORDER BY r.expiresat ASC, r.id ASC",
            ['available' => 'available', 'now' => $now, 'until' => $now + ($days * DAYSECS)],
            0,
            20
        );
        $sent = 0;
        foreach ($records as $recording) {
            if ($this->audit_exists((int)$recording->sessionid, 'recording_expiry_reminder', 'recording', (int)$recording->id)) {
                continue;
            }
            foreach (get_admins() as $admin) {
                if (local_prequran_notify_user_live_update(
                    (int)$recording->sessionid,
                    (int)$admin->id,
                    'Recording expiring soon',
                    'A parent-visible BBB recording is nearing its retention expiry date.',
                    new \moodle_url('/local/hubredirect/live_recordings_admin.php'),
                    'Review retention',
                    'recording_expiry_reminder'
                )) {
                    $sent++;
                }
            }
            $this->audit((int)$recording->sessionid, 'recording_expiry_reminder', 'recording', (int)$recording->id, [
                'expiresat' => (int)$recording->expiresat,
                'session_title' => (string)($recording->session_title ?? ''),
            ]);
        }
        return $sent;
    }
}
