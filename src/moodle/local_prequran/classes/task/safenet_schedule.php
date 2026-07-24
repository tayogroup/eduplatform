<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

/**
 * Ehel Safe Internet — Learning-Mode automation. Each run computes the desired
 * automated policy per device and applies it only when it changes:
 *   priority: live session in progress  >  weekly schedule  >  (manual, untouched)
 * When automation releases a device it reverts to child-safe. A manual pause is
 * always respected. sched_applied records the last automated state so manual
 * toggles between boundaries are not clobbered.
 */
class safenet_schedule extends \core\task\scheduled_task {

    public function get_name(): string {
        return 'Safe Internet learning automation';
    }

    public function execute(): void {
        global $DB, $CFG;

        $lib = $CFG->dirroot . '/local/hubredirect/safenetlib.php';
        if (!is_readable($lib)) {
            return;
        }
        require_once($lib);

        $now = time();

        // Keep the static learning ruleset present on the resolvers (self-heal).
        // Done once per run so per-device syncs are never blocked by a reload.
        try {
            pqsn_ensure_learning_rules();
        } catch (\Throwable $e) {
            // Resolvers unreachable this run; devices still track policy in the DB.
        }

        // Student userids currently inside a live session's scheduled window.
        $insession = [];
        try {
            $rows = $DB->get_records_sql(
                "SELECT DISTINCT p.userid AS userid
                   FROM {local_prequran_live_participant} p
                   JOIN {local_prequran_live_session} s ON s.id = p.sessionid
                  WHERE p.role = 'student'
                    AND p.status = 'active'
                    AND s.scheduled_start <= :now1
                    AND s.scheduled_end >= :now2
                    AND s.status NOT IN ('cancelled', 'canceled', 'completed')",
                ['now1' => $now, 'now2' => $now]
            );
            foreach ($rows as $r) {
                $insession[(int)$r->userid] = true;
            }
        } catch (\Throwable $e) {
            // Live-session tables not present on this install; sessions just don't drive.
        }

        // Latest activity per ClientID across resolvers (for lastseen + silence).
        $activity = [];
        try {
            $activity = pqsn_recent_client_activity();
        } catch (\Throwable $e) {
            $activity = [];
        }

        $silencethreshold = 15 * 60;   // silent this long while expected online -> alert
        $realertafter = 6 * 60 * 60;   // don't re-alert the same device more often than this

        $devices = $DB->get_records('local_prequran_safenet_dev', ['status' => 'active']);
        foreach ($devices as $device) {
            // Keep lastseen fresh from the resolvers' query logs.
            $cid = (string)$device->clientid;
            $dirty = false;
            if (isset($activity[$cid]) && (int)$activity[$cid] > (int)$device->lastseen) {
                $device->lastseen = (int)$activity[$cid];
                $dirty = true;
            }

            if ((string)$device->policy === 'paused') {
                if ($dirty) {
                    $DB->update_record('local_prequran_safenet_dev', $device);
                }
                continue;
            }

            $hasschedule = trim((string)$device->schedulejson) !== '';
            if (isset($insession[(int)$device->childid])) {
                $auto = 'learning';                          // live session wins
            } else if ($hasschedule) {
                $auto = pqsn_schedule_is_active((string)$device->schedulejson, $now) ? 'learning' : 'childsafe';
            } else {
                $auto = null;                                // no automation driving this device
            }

            // Silence detection: only when we EXPECT the device online and filtered
            // (in a session or an active scheduled window) to avoid false positives.
            $expectedonline = ($auto === 'learning');
            $silent = $expectedonline && ((int)$device->lastseen > 0)
                && ($now - (int)$device->lastseen > $silencethreshold);
            if ($silent) {
                if ((int)$device->alerted_at === 0 || ($now - (int)$device->alerted_at > $realertafter)) {
                    if (pqsn_notify_silent_device($device)) {
                        $device->alerted_at = $now;
                        pqsn_audit((int)$device->consumerid, (int)$device->workspaceid, (int)$device->id, 'device_silent', []);
                        $dirty = true;
                    }
                }
            } else if ((int)$device->alerted_at !== 0 && $expectedonline) {
                // Reporting again — clear the alert so a future silence re-alerts.
                $device->alerted_at = 0;
                $dirty = true;
            }

            if ($auto === null) {
                if ((string)$device->sched_applied !== '') {
                    $this->apply_policy($device, 'childsafe', '', $now);
                    $dirty = false; // apply_policy already saved.
                } else if ($dirty) {
                    $DB->update_record('local_prequran_safenet_dev', $device);
                }
                continue;
            }

            if ((string)$device->sched_applied !== $auto) {
                $this->apply_policy($device, $auto, $auto, $now);
            } else if ($dirty) {
                $DB->update_record('local_prequran_safenet_dev', $device);
            }
        }
    }

    private function apply_policy(\stdClass $device, string $policy, string $applied, int $now): void {
        global $DB;
        $device->policy = $policy;
        $device->sched_applied = $applied;
        $device->syncstatus = 'pending';
        $device->timemodified = $now;
        $DB->update_record('local_prequran_safenet_dev', $device);
        pqsn_sync_device($device);
        pqsn_audit((int)$device->consumerid, (int)$device->workspaceid, (int)$device->id, 'auto_' . $policy, []);
    }
}
