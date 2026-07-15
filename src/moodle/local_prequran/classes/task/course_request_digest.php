<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/hubredirect/course_offeringlib.php');

class course_request_digest extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_course_request_digest', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        if (!$DB->get_manager()->table_exists('local_prequran_workspace')
            || !$DB->get_manager()->table_exists('local_prequran_course_enrol_req')
            || !$DB->get_manager()->table_exists('local_prequran_course_offering')) {
            mtrace('Course request digest skipped: course offering tables are not ready.');
            return;
        }

        $weekstart = strtotime('monday this week 00:00:00') ?: (time() - WEEKSECS);
        $sent = 0;
        $workspaces = $DB->get_records('local_prequran_workspace', ['status' => 'active'], 'name ASC', 'id,name');
        foreach ($workspaces as $workspace) {
            $workspaceid = (int)$workspace->id;
            if ($this->sent_this_week($workspaceid, (int)$weekstart)) {
                continue;
            }
            $summary = $this->summary($workspaceid);
            if ($summary['pending'] <= 0 && $summary['drop_requested'] <= 0 && $summary['needs_sync'] <= 0) {
                continue;
            }
            $url = new \moodle_url('/local/hubredirect/course_offerings.php', ['workspaceid' => $workspaceid, 'request_status' => 'pending']);
            $message = implode("\n", [
                'Weekly course request digest for ' . (string)$workspace->name . ':',
                'Pending enrollment requests: ' . (int)$summary['pending'],
                'Drop requests: ' . (int)$summary['drop_requested'],
                'Approved requests needing Moodle sync: ' . (int)$summary['needs_sync'],
                'Published offerings: ' . (int)$summary['published'],
            ]);
            $senthere = pqco_notify_workspace_admins(
                $workspaceid,
                'Weekly course request digest: ' . (string)$workspace->name,
                $message,
                $url,
                'Open course requests',
                'course_request_weekly_digest',
                [
                    'workspaceid' => $workspaceid,
                    'summary' => $summary,
                    'weekstart' => $weekstart,
                ]
            );
            $sent += $senthere;
            pqco_course_audit('course_request_digest_sent', 'workspace', $workspaceid, [
                'workspaceid' => $workspaceid,
                'recipient_count' => $senthere,
                'summary' => $summary,
                'weekstart' => $weekstart,
            ]);
        }
        mtrace('Course request digest sent ' . $sent . ' notification(s).');
    }

    private function sent_this_week(int $workspaceid, int $weekstart): bool {
        global $DB;
        if (!$DB->get_manager()->table_exists('local_prequran_course_audit')) {
            return false;
        }
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_course_audit}
              WHERE workspaceid = :workspaceid
                AND action = :action
                AND timecreated >= :weekstart",
            ['workspaceid' => $workspaceid, 'action' => 'course_request_digest_sent', 'weekstart' => $weekstart]
        );
    }

    private function summary(int $workspaceid): array {
        global $DB;
        return [
            'pending' => (int)$DB->count_records('local_prequran_course_enrol_req', ['workspaceid' => $workspaceid, 'status' => 'pending']),
            'drop_requested' => (int)$DB->count_records('local_prequran_course_enrol_req', ['workspaceid' => $workspaceid, 'status' => 'drop_requested']),
            'needs_sync' => (int)$DB->count_records_select('local_prequran_course_enrol_req', 'workspaceid = ? AND status = ? AND moodleenrolledat = ?', [$workspaceid, 'approved', 0]),
            'published' => (int)$DB->count_records('local_prequran_course_offering', ['workspaceid' => $workspaceid, 'status' => 'published']),
        ];
    }
}
