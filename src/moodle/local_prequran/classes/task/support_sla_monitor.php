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
                    // Best practice: a breach reaches a HUMAN, not just a queue
                    // reassignment. One message per ticket (event dedup above).
                    $this->notify_admins_of_breach($ticket);
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

        // LAYER-2 platform tickets (consumer tech team <-> EduPlatform): the
        // first-response deadline is ENFORCED here — a tenant ticket with no
        // platform reply past sla_first_due alerts the whole platform team.
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_platform_ticket'))) {
            $pnow = time();
            $firstoverdue = $DB->get_records_select('local_prequran_platform_ticket',
                "status IN ('open', 'in_progress') AND firstrespondedat = 0 AND sla_first_due > 0
                 AND sla_first_due < :now AND sla_first_alerted = 0", ['now' => $pnow]);
            foreach ($firstoverdue as $pt) {
                $this->notify_admins_platform('PLATFORM SLA: no first response on ' . (string)$pt->ticketnumber,
                    'Platform ticket ' . (string)$pt->ticketnumber . ' ("' . (string)$pt->subject . '", priority '
                    . (string)$pt->priority . ') has had NO first response and its deadline ('
                    . userdate((int)$pt->sla_first_due) . ') has passed. A consumer technical team is waiting.');
                $DB->update_record('local_prequran_platform_ticket', (object)[
                    'id' => (int)$pt->id, 'sla_first_alerted' => 1, 'timemodified' => $pnow,
                ]);
                mtrace('  PLATFORM first-response overdue: ' . $pt->ticketnumber);
            }
            $resolveoverdue = $DB->get_records_select('local_prequran_platform_ticket',
                "status IN ('open', 'in_progress', 'waiting_on_school') AND sla_resolve_due > 0
                 AND sla_resolve_due < :now AND sla_resolve_alerted = 0", ['now' => $pnow]);
            foreach ($resolveoverdue as $pt) {
                $this->notify_admins_platform('PLATFORM SLA: resolution overdue on ' . (string)$pt->ticketnumber,
                    'Platform ticket ' . (string)$pt->ticketnumber . ' ("' . (string)$pt->subject . '", priority '
                    . (string)$pt->priority . ') passed its resolution deadline (' . userdate((int)$pt->sla_resolve_due) . ').');
                $DB->update_record('local_prequran_platform_ticket', (object)[
                    'id' => (int)$pt->id, 'sla_resolve_alerted' => 1, 'timemodified' => $pnow,
                ]);
                mtrace('  PLATFORM resolution overdue: ' . $pt->ticketnumber);
            }
        }
    }

    /** Alert every site admin about a platform-tier SLA event. */
    private function notify_admins_platform(string $subject, string $body): void {
        foreach (get_admins() as $admin) {
            try {
                $message = new \core\message\message();
                $message->component = 'local_prequran';
                $message->name = 'live_session_update';
                $message->userfrom = \core_user::get_noreply_user();
                $message->userto = $admin;
                $message->subject = $subject;
                $message->fullmessage = $body;
                $message->fullmessageformat = FORMAT_PLAIN;
                $message->fullmessagehtml = '';
                $message->smallmessage = $subject;
                $message->notification = 1;
                $message->courseid = SITEID;
                message_send($message);
            } catch (\Throwable $e) {
                mtrace('  platform SLA notification failed for admin ' . $admin->id . ': ' . $e->getMessage());
            }
        }
    }

    /** SLA breach → Moodle message to every site admin (best-effort). */
    private function notify_admins_of_breach($ticket): void {
        $label = (string)($ticket->subject ?? $ticket->title ?? '');
        $subject = 'Support SLA BREACHED: ticket #' . (int)$ticket->id . ($label !== '' ? ' — ' . $label : '');
        $body = 'Support ticket #' . (int)$ticket->id . ($label !== '' ? ' ("' . $label . '")' : '')
            . ' passed its SLA resolution deadline and was auto-escalated. Review it in the support console.';
        foreach (get_admins() as $admin) {
            try {
                $message = new \core\message\message();
                $message->component = 'local_prequran';
                $message->name = 'live_session_update';
                $message->userfrom = \core_user::get_noreply_user();
                $message->userto = $admin;
                $message->subject = $subject;
                $message->fullmessage = $body;
                $message->fullmessageformat = FORMAT_PLAIN;
                $message->fullmessagehtml = '';
                $message->smallmessage = $subject;
                $message->notification = 1;
                $message->courseid = SITEID;
                message_send($message);
            } catch (\Throwable $e) {
                mtrace('  SLA breach notification failed for admin ' . $admin->id . ': ' . $e->getMessage());
            }
        }
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
