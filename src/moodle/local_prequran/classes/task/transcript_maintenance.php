<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/hubredirect/course_transcriptlib.php');

class transcript_maintenance extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_transcript_maintenance', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        if (!pqct_document_schema_ready()) {
            mtrace('Transcript maintenance skipped: transcript document table is not ready.');
            return;
        }

        $docs = $DB->get_records('local_prequran_transcript_doc', ['status' => 'issued'], 'issuedat ASC, id ASC', '*', 0, 1000);
        $stale = 0;
        $checked = 0;
        foreach ($docs as $doc) {
            $checked++;
            $reason = $this->stale_reason($doc);
            if ($reason !== '' && pqct_mark_official_transcript_stale($doc, $reason)) {
                $stale++;
            }
        }

        pqco_course_audit('transcript_maintenance_completed', 'system', 0, [
            'workspaceid' => 0,
            'checked' => $checked,
            'stale' => $stale,
        ]);
        mtrace('Transcript maintenance checked ' . $checked . ' issued transcript(s) and flagged ' . $stale . ' stale transcript(s).');
    }

    private function stale_reason($doc): string {
        global $DB;

        $issuedat = (int)($doc->issuedat ?? 0);
        $workspaceid = (int)($doc->workspaceid ?? 0);
        $studentid = (int)($doc->studentid ?? 0);
        if ($issuedat <= 0 || $workspaceid <= 0 || $studentid <= 0) {
            return '';
        }

        if (pqh_table_exists_safe('local_prequran_course_enrol_req')) {
            $changed = $DB->record_exists_select(
                'local_prequran_course_enrol_req',
                'workspaceid = :workspaceid AND studentid = :studentid AND timemodified > :issuedat',
                ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'issuedat' => $issuedat]
            );
            if ($changed) {
                return 'course enrollment request changed after transcript issue';
            }
        }

        if (pqh_table_exists_safe('local_prequran_transcript_policy')) {
            $changed = $DB->record_exists_select(
                'local_prequran_transcript_policy',
                'workspaceid = :workspaceid AND timemodified > :issuedat',
                ['workspaceid' => $workspaceid, 'issuedat' => $issuedat]
            );
            if ($changed) {
                return 'transcript policy changed after transcript issue';
            }
        }

        return '';
    }
}
