<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

/**
 * Completion-award candidate scan. Certificate issuance was 100% manual with
 * no link to actual course completion. This task finds students who have a
 * PUBLISHED passing course grade but no certificate for that offering, and
 * either reports them (report mode) or creates a DRAFT award candidate that a
 * registrar reviews and issues deliberately (enforce mode) — the human still
 * decides; the task only surfaces the earned-but-uncertified list.
 *
 * Inert until completion_award_mode is set (''=off, report, enforce).
 */
class completion_award_scan extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_completion_award_scan', 'local_prequran');
    }

    public function execute(): void {
        global $CFG, $DB;

        $mode = trim((string)get_config('local_prequran', 'completion_award_mode'));
        if ($mode !== 'report' && $mode !== 'enforce') {
            mtrace('Completion-award scan skipped: completion_award_mode is off.');
            return;
        }
        if (!$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_course_grade'))
                || !$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_completion_award'))) {
            mtrace('Completion-award scan skipped: gradebook or award tables absent.');
            return;
        }
        require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
        require_once($CFG->dirroot . '/local/hubredirect/certificates_placementlib.php');

        $passpercent = (float)preg_replace('/[^0-9.]/', '', (string)get_config('local_prequran', 'completion_award_pass_percent'));
        if ($passpercent <= 0) {
            $passpercent = 60.0;
        }
        $candidates = $DB->get_records_select('local_prequran_course_grade',
            "status = 'published' AND offeringid > 0", [], 'timemodified DESC', '*', 0, 1000);
        $found = 0;
        $created = 0;
        foreach ($candidates as $grade) {
            $percent = (float)preg_replace('/[^0-9.]/', '', (string)$grade->final_percent);
            if ($percent < $passpercent) {
                continue;
            }
            // Skip when a non-revoked award already exists for this pairing.
            $has = $DB->record_exists_select('local_prequran_completion_award',
                "workspaceid = :ws AND studentid = :sid AND offeringid = :oid AND status <> 'revoked'",
                ['ws' => (int)$grade->workspaceid, 'sid' => (int)$grade->studentid, 'oid' => (int)$grade->offeringid]);
            if ($has) {
                continue;
            }
            $found++;
            if ($mode === 'report') {
                mtrace("  [report] award candidate: student {$grade->studentid}, offering {$grade->offeringid}, grade {$percent}%");
                continue;
            }
            // Enforce: create a DRAFT award for registrar review (never issued
            // automatically — status draft, issuedat 0).
            $offering = $DB->get_record('local_prequran_course_offering', ['id' => (int)$grade->offeringid], 'id,title,moodlecourseid', IGNORE_MISSING);
            $title = $offering ? ('Certificate of Completion — ' . (string)$offering->title) : 'Certificate of Completion';
            $now = time();
            $award = (object)[
                'workspaceid' => (int)$grade->workspaceid,
                'studentid' => (int)$grade->studentid,
                'offeringid' => (int)$grade->offeringid,
                'courseid' => (int)($offering->moodlecourseid ?? 0),
                'templateid' => 0,
                'awardnumber' => pqcp_award_number((int)$grade->workspaceid),
                'award_type' => 'completion',
                'title' => $title,
                'status' => 'draft',
                'completion_percent' => (string)$percent,
                'final_grade' => (string)$grade->final_percent,
                'evidencejson' => json_encode(['source' => 'completion_award_scan', 'coursegradeid' => (int)$grade->id], JSON_UNESCAPED_SLASHES),
                'issuedby' => 0,
                'issuedat' => 0,
                'revokedby' => 0,
                'revokedat' => 0,
                'revocation_reason' => '',
                'documentid' => 0,
                'generateddocid' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $awardid = (int)$DB->insert_record('local_prequran_completion_award', $award);
            if (function_exists('pqcp_award_audit')) {
                pqcp_award_audit((int)$grade->workspaceid, $awardid, 0, 'award_candidate_drafted', [
                    'source' => 'completion_award_scan',
                    'grade' => $percent,
                ]);
            }
            $created++;
        }
        mtrace("Completion-award scan ({$mode}): {$found} candidate(s) found"
            . ($mode === 'enforce' ? ", {$created} draft award(s) created for registrar review." : '.'));
        set_config('lastrun_completion_award_scan', time(), 'local_prequran');
    }
}
