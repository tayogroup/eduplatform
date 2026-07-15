<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/prequran/notificationlib.php');

class workspace_weekly_digest extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_workspace_weekly_digest', 'local_prequran');
    }

    public function execute(): void {
        if (!$this->table_exists('local_prequran_workspace') || !$this->table_exists('local_prequran_workspace_member')) {
            mtrace('PreQuran weekly workspace digest skipped: workspace tables are not ready.');
            return;
        }

        $weekstart = strtotime('monday this week 00:00:00');
        if (!$weekstart) {
            $weekstart = time() - WEEKSECS;
        }

        $sent = 0;
        foreach ($this->active_workspaces() as $workspace) {
            $workspaceid = (int)$workspace->id;
            if ($this->digest_sent_this_week($workspaceid, (int)$weekstart)) {
                continue;
            }
            $recipients = $this->workspace_admin_ids($workspaceid);
            if (!$recipients) {
                foreach (get_admins() as $admin) {
                    $recipients[(int)$admin->id] = (int)$admin->id;
                }
            }
            $summary = $this->workspace_summary($workspaceid, (int)$weekstart);
            $message = $this->format_summary((string)$workspace->name, $summary);
            $url = new \moodle_url('/local/hubredirect/workspace_reports.php', ['workspaceid' => $workspaceid]);
            foreach ($recipients as $recipientid) {
                if (local_prequran_notify_user_live_update(
                    0,
                    (int)$recipientid,
                    'Weekly workspace digest: ' . (string)$workspace->name,
                    $message,
                    $url,
                    'Open workspace reports',
                    'workspace_weekly_digest'
                )) {
                    $sent++;
                }
            }
            $this->mark_digest_sent($workspaceid, (int)$weekstart, count($recipients), $summary);
        }

        mtrace('PreQuran weekly workspace digest sent ' . $sent . ' notification(s).');
    }

    private function table_exists(string $table): bool {
        global $DB;
        return $DB->get_manager()->table_exists($table);
    }

    private function column_exists(string $table, string $column): bool {
        global $DB;
        try {
            $columns = $DB->get_columns($table);
        } catch (\Throwable $e) {
            return false;
        }
        return array_key_exists($column, $columns);
    }

    private function active_workspaces(): array {
        global $DB;
        return array_values($DB->get_records('local_prequran_workspace', ['status' => 'active'], 'name ASC', 'id,name,status'));
    }

    private function workspace_admin_ids(int $workspaceid): array {
        global $DB;
        $roles = ['owner', 'admin'];
        [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
        $params['workspaceid'] = $workspaceid;
        $params['status'] = 'active';
        $ids = [];
        foreach ($DB->get_records_sql(
            "SELECT userid
               FROM {local_prequran_workspace_member}
              WHERE workspaceid = :workspaceid
                AND status = :status
                AND workspace_role {$insql}",
            $params
        ) as $row) {
            $userid = (int)$row->userid;
            if ($userid > 0) {
                $ids[$userid] = $userid;
            }
        }
        return $ids;
    }

    private function digest_sent_this_week(int $workspaceid, int $weekstart): bool {
        global $DB;
        if (!$this->table_exists('local_prequran_live_audit')) {
            return false;
        }
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_live_audit}
              WHERE action = :action
                AND targettype = :targettype
                AND targetid = :workspaceid
                AND timecreated >= :weekstart",
            [
                'action' => 'workspace_weekly_digest_sent',
                'targettype' => 'workspace',
                'workspaceid' => $workspaceid,
                'weekstart' => $weekstart,
            ]
        );
    }

    private function workspace_summary(int $workspaceid, int $weekstart): array {
        global $DB;
        $summary = [
            'students' => 0,
            'teachers' => 0,
            'upcoming_sessions' => 0,
            'attendance_present' => 0,
            'attendance_total' => 0,
            'materials_assigned' => 0,
            'materials_completed' => 0,
            'materials_reviewed' => 0,
            'parent_visible_notes' => 0,
        ];

        $summary['students'] = (int)$DB->count_records('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'workspace_role' => 'student', 'status' => 'active']);
        $summary['teachers'] = (int)$DB->count_records_select(
            'local_prequran_workspace_member',
            "workspaceid = ? AND status = ? AND workspace_role IN ('owner','admin','teacher','assistant_teacher')",
            [$workspaceid, 'active']
        );

        if ($this->table_exists('local_prequran_live_session') && $this->column_exists('local_prequran_live_session', 'workspaceid')) {
            $summary['upcoming_sessions'] = (int)$DB->count_records_select(
                'local_prequran_live_session',
                'workspaceid = ? AND scheduled_start >= ? AND status <> ?',
                [$workspaceid, time(), 'cancelled']
            );
        }

        if ($this->table_exists('local_prequran_live_attendance') && $this->column_exists('local_prequran_live_attendance', 'workspaceid')) {
            $summary['attendance_total'] = (int)$DB->count_records_select(
                'local_prequran_live_attendance',
                'workspaceid = ? AND timecreated >= ?',
                [$workspaceid, $weekstart]
            );
            $summary['attendance_present'] = (int)$DB->count_records_select(
                'local_prequran_live_attendance',
                "workspaceid = ? AND timecreated >= ? AND attendance_status IN ('present','attended')",
                [$workspaceid, $weekstart]
            );
        }

        if ($this->table_exists('local_prequran_workspace_mat_assign')) {
            $summary['materials_assigned'] = (int)$DB->count_records_select(
                'local_prequran_workspace_mat_assign',
                'workspaceid = ? AND status = ?',
                [$workspaceid, 'active']
            );
            if ($this->column_exists('local_prequran_workspace_mat_assign', 'workflow_status')) {
                $summary['materials_completed'] = (int)$DB->count_records_select(
                    'local_prequran_workspace_mat_assign',
                    "workspaceid = ? AND status = ? AND workflow_status IN ('completed','reviewed')",
                    [$workspaceid, 'active']
                );
                $summary['materials_reviewed'] = (int)$DB->count_records('local_prequran_workspace_mat_assign', [
                    'workspaceid' => $workspaceid,
                    'status' => 'active',
                    'workflow_status' => 'reviewed',
                ]);
            }
        }

        if ($this->table_exists('local_prequran_live_note') && $this->column_exists('local_prequran_live_note', 'workspaceid')) {
            $summary['parent_visible_notes'] = (int)$DB->count_records_select(
                'local_prequran_live_note',
                'workspaceid = ? AND visible_to_parent = ? AND timecreated >= ?',
                [$workspaceid, 1, $weekstart]
            );
        }

        return $summary;
    }

    private function format_summary(string $workspacename, array $summary): string {
        $attendance = (int)$summary['attendance_total'] > 0
            ? round(((int)$summary['attendance_present'] / (int)$summary['attendance_total']) * 100) . '%'
            : 'n/a';
        $materials = (int)$summary['materials_assigned'] > 0
            ? round(((int)$summary['materials_completed'] / (int)$summary['materials_assigned']) * 100) . '%'
            : 'n/a';

        return implode("\n", [
            'Weekly summary for ' . $workspacename . ':',
            'Students: ' . (int)$summary['students'],
            'Teaching/admin members: ' . (int)$summary['teachers'],
            'Upcoming sessions: ' . (int)$summary['upcoming_sessions'],
            'Attendance this week: ' . (int)$summary['attendance_present'] . '/' . (int)$summary['attendance_total'] . ' (' . $attendance . ')',
            'Material completion: ' . (int)$summary['materials_completed'] . '/' . (int)$summary['materials_assigned'] . ' (' . $materials . ')',
            'Reviewed materials: ' . (int)$summary['materials_reviewed'],
            'Parent-visible notes this week: ' . (int)$summary['parent_visible_notes'],
        ]);
    }

    private function mark_digest_sent(int $workspaceid, int $weekstart, int $recipientcount, array $summary): void {
        global $DB;
        if (!$this->table_exists('local_prequran_live_audit')) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => 0,
            'action' => 'workspace_weekly_digest_sent',
            'targettype' => 'workspace',
            'targetid' => $workspaceid,
            'details' => json_encode([
                'weekstart' => $weekstart,
                'recipient_count' => $recipientcount,
                'summary' => $summary,
            ]),
            'timecreated' => time(),
        ]);
    }
}
