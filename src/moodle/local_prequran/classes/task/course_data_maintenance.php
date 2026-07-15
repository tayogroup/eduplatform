<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/hubredirect/course_offeringlib.php');

class course_data_maintenance extends \core\task\scheduled_task {
    private const REQUEST_RETENTION_DAYS = 365;
    private const OFFERING_ARCHIVE_DAYS = 90;

    public function get_name(): string {
        return get_string('task_course_data_maintenance', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        if (!pqco_table_ready()) {
            mtrace('Course data maintenance skipped: course offering tables are not ready.');
            return;
        }

        $retentioncutoff = time() - (self::REQUEST_RETENTION_DAYS * DAYSECS);
        $archivecutoff = time() - (self::OFFERING_ARCHIVE_DAYS * DAYSECS);
        $deleted = $this->delete_old_terminal_requests($retentioncutoff);
        $archived = $this->archive_old_finished_offerings($archivecutoff);

        pqco_course_audit('course_data_maintenance_completed', 'system', 0, [
            'workspaceid' => 0,
            'request_retention_days' => self::REQUEST_RETENTION_DAYS,
            'offering_archive_days' => self::OFFERING_ARCHIVE_DAYS,
            'deleted_terminal_requests' => $deleted,
            'archived_offerings' => $archived,
        ]);
        mtrace('Course data maintenance deleted ' . $deleted . ' terminal request(s) and archived ' . $archived . ' old offering(s).');
    }

    private function delete_old_terminal_requests(int $cutoff): int {
        global $DB;

        $statuses = ['cancelled', 'rejected'];
        [$statussql, $params] = $DB->get_in_or_equal($statuses, SQL_PARAMS_NAMED, 'status');
        $params['cutoff'] = $cutoff;
        $rows = $DB->get_records_select(
            'local_prequran_course_enrol_req',
            "status {$statussql} AND timemodified > 0 AND timemodified < :cutoff",
            $params,
            '',
            'id,consumerid,workspaceid,offeringid,studentid,status,timemodified',
            0,
            5000
        );
        if (!$rows) {
            return 0;
        }

        $byworkspace = [];
        foreach ($rows as $row) {
            $workspaceid = (int)$row->workspaceid;
            if (!isset($byworkspace[$workspaceid])) {
                $byworkspace[$workspaceid] = ['cancelled' => 0, 'rejected' => 0, 'ids' => []];
            }
            $byworkspace[$workspaceid][(string)$row->status]++;
            $byworkspace[$workspaceid]['ids'][] = (int)$row->id;
        }
        foreach ($byworkspace as $workspaceid => $summary) {
            pqco_course_audit('terminal_requests_retained_then_deleted', 'workspace', (int)$workspaceid, [
                'workspaceid' => (int)$workspaceid,
                'retention_days' => self::REQUEST_RETENTION_DAYS,
                'cancelled' => (int)$summary['cancelled'],
                'rejected' => (int)$summary['rejected'],
                'requestids' => array_slice($summary['ids'], 0, 80),
            ]);
        }

        [$idsql, $idparams] = $DB->get_in_or_equal(array_map('intval', array_keys($rows)), SQL_PARAMS_NAMED, 'requestid');
        $DB->delete_records_select('local_prequran_course_enrol_req', "id {$idsql}", $idparams);
        return count($rows);
    }

    private function archive_old_finished_offerings(int $cutoff): int {
        global $DB;

        $offerings = $DB->get_records_sql(
            "SELECT o.*
               FROM {local_prequran_course_offering} o
              WHERE o.status IN ('published', 'closed')
                AND o.enddate > 0
                AND o.enddate < :cutoff
                AND NOT EXISTS (
                    SELECT 1
                      FROM {local_prequran_course_enrol_req} r
                     WHERE r.offeringid = o.id
                       AND r.status IN ('pending', 'approved', 'enrolled', 'drop_requested')
                )
           ORDER BY o.enddate ASC",
            ['cutoff' => $cutoff],
            0,
            1000
        );
        $archived = 0;
        foreach ($offerings as $offering) {
            $previousstatus = (string)$offering->status;
            $offering->status = 'archived';
            $offering->timemodified = time();
            $DB->update_record('local_prequran_course_offering', $offering);
            pqco_course_audit('old_offering_archived', 'course_offering', (int)$offering->id, [
                'consumerid' => (int)$offering->consumerid,
                'workspaceid' => (int)$offering->workspaceid,
                'offeringid' => (int)$offering->id,
                'previous_status' => $previousstatus,
                'status' => 'archived',
                'enddate' => (int)$offering->enddate,
                'archive_days' => self::OFFERING_ARCHIVE_DAYS,
            ]);
            $archived++;
        }
        return $archived;
    }
}
