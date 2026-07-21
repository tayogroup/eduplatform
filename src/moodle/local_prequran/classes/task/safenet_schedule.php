<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

/**
 * Ehel Safe Internet — applies per-device Learning-Mode schedules. Flips a
 * device to allowlist-only during its scheduled learning window and back to
 * child-safe outside it. Acts only on boundary crossings (tracked in
 * sched_applied) so a manual toggle mid-window is not immediately reverted,
 * and never overrides a manual pause.
 */
class safenet_schedule extends \core\task\scheduled_task {

    public function get_name(): string {
        return 'Safe Internet learning schedule';
    }

    public function execute(): void {
        global $DB, $CFG;

        $lib = $CFG->dirroot . '/local/hubredirect/safenetlib.php';
        if (!is_readable($lib)) {
            return;
        }
        require_once($lib);

        $now = time();
        $devices = $DB->get_records('local_prequran_safenet_dev', ['status' => 'active']);
        foreach ($devices as $device) {
            if (trim((string)$device->schedulejson) === '') {
                continue;
            }
            if ((string)$device->policy === 'paused') {
                continue;
            }
            $desired = pqsn_schedule_is_active((string)$device->schedulejson, $now) ? 'learning' : 'childsafe';
            if ((string)$device->sched_applied === $desired) {
                continue;
            }

            $device->policy = $desired;
            $device->sched_applied = $desired;
            $device->syncstatus = 'pending';
            $device->timemodified = $now;
            $DB->update_record('local_prequran_safenet_dev', $device);

            if ($desired === 'learning') {
                pqsn_ensure_learning_rules();
            }
            pqsn_sync_device($device);
            pqsn_audit((int)$device->consumerid, (int)$device->workspaceid, (int)$device->id, 'sched_' . $desired, []);
        }
    }
}
