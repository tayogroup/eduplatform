<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class support_sla_monitor extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_support_sla_monitor', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        $manager = $DB->get_manager();
        foreach (['local_prequran_support_ticket', 'local_prequran_support_event'] as $table) {
            if (!$manager->table_exists($table)) {
                mtrace('Support SLA monitor skipped: support ticket schema is not ready.');
                return;
            }
        }

        $now = time();
        $checked = 0;
        $warned = 0;
        $breached = 0;
        $rows = $DB->get_records_sql(
            "SELECT t.*, s.breach_warning_minutes, s.escalationqueueid, s.pause_on_waiting
               FROM {local_prequran_support_ticket} t
          LEFT JOIN {local_prequran_support_sla} s ON s.id = t.sla_policy_id
              WHERE t.status NOT IN ('resolved', 'closed')
                AND t.sla_resolution_due > 0
           ORDER BY t.sla_resolution_due ASC, t.id ASC",
            [],
            0,
            500
        );

        foreach ($rows as $ticket) {
            $checked++;
            if ((string)$ticket->status === 'waiting_for_user' && !empty($ticket->pause_on_waiting)) {
                continue;
            }
            $due = (int)$ticket->sla_resolution_due;
            $warningseconds = max(0, (int)($ticket->breach_warning_minutes ?? 120)) * 60;
            if ($due <= $now) {
                if (!$this->event_exists((int)$ticket->id, 'sla_breached')) {
                    $this->write_event($ticket, 'sla_breached', (string)$due, (string)$now, ['due' => $due]);
                    $breached++;
                }
                $queueid = (int)($ticket->escalationqueueid ?? 0);
                if ($queueid > 0 && (int)$ticket->assignmentgroupid !== $queueid) {
                    $ticket->assignmentgroupid = $queueid;
                    $ticket->timemodified = $now;
                    $DB->update_record('local_prequran_support_ticket', $ticket);
                    $this->write_event($ticket, 'sla_escalated', '', (string)$queueid, ['reason' => 'sla_breached']);
                }
                continue;
            }
            if ($warningseconds > 0 && $due - $warningseconds <= $now && !$this->event_exists((int)$ticket->id, 'sla_warning')) {
                $this->write_event($ticket, 'sla_warning', '', (string)$due, ['due' => $due, 'warning_seconds' => $warningseconds]);
                $warned++;
            }
        }

        mtrace('Support SLA monitor checked ' . $checked . ' ticket(s), warned ' . $warned . ', breached ' . $breached . '.');
    }

    private function event_exists(int $ticketid, string $eventtype): bool {
        global $DB;
        return $DB->record_exists('local_prequran_support_event', [
            'ticketid' => $ticketid,
            'eventtype' => $eventtype,
        ]);
    }

    private function write_event($ticket, string $eventtype, string $oldvalue = '', string $newvalue = '', array $details = []): void {
        global $DB;
        $DB->insert_record('local_prequran_support_event', (object)[
            'ticketid' => (int)$ticket->id,
            'conversationid' => (int)$ticket->sourceconversationid,
            'messageid' => 0,
            'actorid' => 0,
            'eventtype' => $eventtype,
            'visibility' => 'staff_only',
            'oldvalue' => $oldvalue,
            'newvalue' => $newvalue,
            'body' => '',
            'detailsjson' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }
}
