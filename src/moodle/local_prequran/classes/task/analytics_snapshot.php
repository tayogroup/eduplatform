<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

/**
 * Analytics snapshot capture. Every dashboard recomputes live on each load and
 * the only stored rollup (analytics_snap) was written solely by a manual
 * executive-dashboard button — so grade distributions, pass rates and
 * completion could never be trended over time. This task captures a nightly
 * per-workspace snapshot (grade distribution, pass rate, completion %,
 * attendance rate) into local_prequran_analytics_snap, seeding the missing
 * time series without any page having to be opened.
 *
 * Inert until analytics_snapshot_mode is set ('' = off, 'enabled').
 */
class analytics_snapshot extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_analytics_snapshot', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        if ((string)get_config('local_prequran', 'analytics_snapshot_mode') !== 'enabled') {
            mtrace('Analytics snapshot skipped: analytics_snapshot_mode is off.');
            return;
        }
        if (!$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_analytics_snap'))
                || !$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_workspace'))) {
            mtrace('Analytics snapshot skipped: required tables absent.');
            return;
        }
        $passpercent = (float)preg_replace('/[^0-9.]/', '',
            (string)get_config('local_prequran', 'completion_award_pass_percent'));
        if ($passpercent <= 0) {
            $passpercent = 60.0;
        }
        $now = time();
        $workspaces = $DB->get_records_select('local_prequran_workspace', "status = 'active'", [], '', 'id', 0, 2000);
        $written = 0;
        foreach ($workspaces as $ws) {
            $wid = (int)$ws->id;
            $metrics = $this->workspace_metrics($wid, $passpercent);
            if ($metrics['graded_students'] === 0 && $metrics['progress_rows'] === 0) {
                continue; // Nothing to snapshot for an empty workspace.
            }
            $DB->insert_record('local_prequran_analytics_snap', (object)[
                'workspaceid' => $wid,
                'snapshot_type' => 'nightly_academic',
                'period_start' => strtotime('today', $now),
                'period_end' => $now,
                'metricsjson' => json_encode($metrics, JSON_UNESCAPED_SLASHES),
                'generatedby' => 0,
                'timecreated' => $now,
            ]);
            $written++;
        }
        mtrace("Analytics snapshot: {$written} workspace snapshot(s) written.");
        set_config('lastrun_analytics_snapshot', $now, 'local_prequran');
    }

    private function workspace_metrics(int $workspaceid, float $passpercent): array {
        global $DB;

        // Grade distribution + pass rate from PUBLISHED course grades.
        $bands = ['A' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0];
        $passed = 0;
        $total = 0;
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_course_grade'))) {
            $grades = $DB->get_records_select('local_prequran_course_grade',
                "workspaceid = :ws AND status = 'published'", ['ws' => $workspaceid], '', 'id,final_percent', 0, 20000);
            foreach ($grades as $g) {
                $p = (float)preg_replace('/[^0-9.]/', '', (string)$g->final_percent);
                $total++;
                if ($p >= $passpercent) {
                    $passed++;
                }
                if ($p >= 90) {
                    $bands['A']++;
                } else if ($p >= 80) {
                    $bands['B']++;
                } else if ($p >= 70) {
                    $bands['C']++;
                } else if ($p >= 60) {
                    $bands['D']++;
                } else {
                    $bands['F']++;
                }
            }
        }

        // Attendance rate (present+late+excused+makeup over all recorded).
        $attpresent = 0;
        $atttotal = 0;
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_live_attendance'))) {
            $rows = $DB->get_records_select('local_prequran_live_attendance',
                "workspaceid = :ws", ['ws' => $workspaceid], '', 'id,attendance_status', 0, 50000);
            foreach ($rows as $r) {
                $atttotal++;
                if (in_array((string)$r->attendance_status, ['present', 'late', 'excused', 'makeup_completed'], true)) {
                    $attpresent++;
                }
            }
        }

        // Progress completion: count progress rows + completed units.
        $progressrows = 0;
        $unitsdone = 0;
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_progress'))) {
            // Only rows for students who belong to this workspace would require a
            // join; the progress table is workspace-agnostic, so this is a
            // platform-wide completion signal recorded once (workspaceid 0 rows
            // are deduped by the caller skipping empty workspaces).
            $sql = "SELECT p.id, p.statejson
                      FROM {local_prequran_progress} p
                      JOIN {local_prequran_workspace_member} m ON m.userid = p.userid
                     WHERE m.workspaceid = :ws AND m.status = 'active' AND m.workspace_role = 'student'
                       AND p.environment = 'production'";
            $rows = $DB->get_records_sql($sql, ['ws' => $workspaceid], 0, 50000);
            foreach ($rows as $r) {
                $progressrows++;
                $state = json_decode((string)$r->statejson, true);
                if (is_array($state) && !empty($state['completed'])) {
                    $unitsdone++;
                }
            }
        }

        return [
            'graded_students' => $total,
            'pass_rate' => $total > 0 ? round(100 * $passed / $total, 1) : null,
            'grade_distribution' => $bands,
            'attendance_rate' => $atttotal > 0 ? round(100 * $attpresent / $atttotal, 1) : null,
            'attendance_records' => $atttotal,
            'progress_rows' => $progressrows,
            'units_completed' => $unitsdone,
            'unit_completion_rate' => $progressrows > 0 ? round(100 * $unitsdone / $progressrows, 1) : null,
        ];
    }
}
