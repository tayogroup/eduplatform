<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/hubredirect/finance_lib.php');

class finance_api_hardening extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_finance_api_hardening', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        if (!pqfin_invoice_schema_ready()) {
            mtrace('Finance API hardening skipped: invoice schema is not ready.');
            return;
        }
        if (!pqh_table_exists_safe('local_prequran_workspace')) {
            mtrace('Finance API hardening skipped: workspace schema is not ready.');
            return;
        }

        $workspaces = $DB->get_records_select('local_prequran_workspace', "status <> :status", ['status' => 'archived'], 'id ASC', 'id');
        $checked = 0;
        foreach ($workspaces as $workspace) {
            $workspaceid = (int)$workspace->id;
            if ($workspaceid <= 0) {
                continue;
            }
            pqfin_refresh_finance_hardening_snapshot($workspaceid, pqh_consumer_context_by_workspace($workspaceid), 0);
            $checked++;
        }
        mtrace('Finance API hardening checked ' . $checked . ' workspace(s).');
    }
}
