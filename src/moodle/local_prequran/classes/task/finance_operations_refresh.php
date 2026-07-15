<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/hubredirect/finance_lib.php');

class finance_operations_refresh extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_finance_operations_refresh', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        if (!pqfin_invoice_schema_ready()) {
            mtrace('Finance operations refresh skipped: invoice schema is not ready.');
            return;
        }
        if (!pqh_table_exists_safe('local_prequran_workspace')) {
            mtrace('Finance operations refresh skipped: workspace schema is not ready.');
            return;
        }

        $workspaces = $DB->get_records_select('local_prequran_workspace', "status <> :status", ['status' => 'archived'], 'id ASC', 'id');
        $refreshed = 0;
        foreach ($workspaces as $workspace) {
            $workspaceid = (int)$workspace->id;
            if ($workspaceid <= 0) {
                continue;
            }
            $context = pqh_consumer_context_by_workspace($workspaceid);
            pqfin_refresh_operations_snapshot($workspaceid, $context, 0);
            pqfin_send_admin_exception_alert($workspaceid, $context, 0);
            $refreshed++;
        }
        mtrace('Finance operations refresh updated ' . $refreshed . ' workspace snapshot(s).');
    }
}
