<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

/**
 * Data-retention sweep. Two problems this closes:
 *
 * 1) SEB proctoring webcam frames (children-adjacent biometric data) were
 *    purged only OPPORTUNISTICALLY — when a staff member happened to open the
 *    results/review page. If no one opened it, frames persisted indefinitely
 *    past the 30-day policy. This task deletes expired frames unconditionally,
 *    nightly.
 * 2) Every custom audit table except live_audit grew UNBOUNDED (no purge
 *    path). Optional operational-audit trimming (course_audit) is gated by
 *    audit_retention_days; financial/safeguarding/grade/award audit trails are
 *    deliberately left intact (they carry their own retention obligations).
 *
 * The proctor purge always runs (a legal deletion duty); audit trimming is
 * opt-in.
 */
class data_retention extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_data_retention', 'local_prequran');
    }

    public function execute(): void {
        global $CFG, $DB;

        // 1) SEB proctor frames — always enforced.
        $seblib = $CFG->dirroot . '/local/hubredirect/seb_lib.php';
        if (is_readable($seblib)) {
            require_once($seblib);
        }
        if (function_exists('pqh_seb_proctor_retention_days')
                && $DB->get_manager()->table_exists(new \xmldb_table('local_prequran_seb_proctor'))) {
            $cutoff = time() - pqh_seb_proctor_retention_days() * DAYSECS;
            $expired = (int)$DB->count_records_select('local_prequran_seb_proctor', 'timecreated < :c', ['c' => $cutoff]);
            $DB->delete_records_select('local_prequran_seb_proctor', 'timecreated < :c', ['c' => $cutoff]);
            mtrace("Data retention: purged {$expired} expired SEB proctor frame(s).");
        }

        // Rate-limit hits are ephemeral — keep only the last day.
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_rate_hit'))) {
            $DB->delete_records_select('local_prequran_rate_hit', 'timecreated < :c', ['c' => time() - DAYSECS]);
        }

        // 2) Optional operational-audit trimming (course_audit only).
        $auditdays = (int)get_config('local_prequran', 'audit_retention_days');
        if ($auditdays > 0 && $DB->get_manager()->table_exists(new \xmldb_table('local_prequran_course_audit'))) {
            $auditcutoff = time() - $auditdays * DAYSECS;
            $trimmed = (int)$DB->count_records_select('local_prequran_course_audit', 'timecreated < :c', ['c' => $auditcutoff]);
            $DB->delete_records_select('local_prequran_course_audit', 'timecreated < :c', ['c' => $auditcutoff]);
            mtrace("Data retention: trimmed {$trimmed} course_audit row(s) older than {$auditdays} days.");
        } else {
            mtrace('Data retention: audit trimming off (audit_retention_days = 0).');
        }

        set_config('lastrun_data_retention', time(), 'local_prequran');
    }
}
