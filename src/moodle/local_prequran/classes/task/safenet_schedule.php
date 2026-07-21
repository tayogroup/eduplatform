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

        $devices = $DB->get_records('local_prequran_safenet_dev', ['status' => 'active']);
        foreach ($devices as $device) {
            if ((string)$device->policy === 'paused') {
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

            if ($auto === null) {
                // Automation just released the device — return it to child-safe once.
                if ((string)$device->sched_applied !== '') {
                    $this->apply_policy($device, 'childsafe', '', $now);
                }
                continue;
            }

            if ((string)$device->sched_applied !== $auto) {
                $this->apply_policy($device, $auto, $auto, $now);
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
        if ($policy === 'learning') {
            pqsn_ensure_learning_rules();
        }
        pqsn_sync_device($device);
        pqsn_audit((int)$device->consumerid, (int)$device->workspaceid, (int)$device->id, 'auto_' . $policy, []);
    }
}
