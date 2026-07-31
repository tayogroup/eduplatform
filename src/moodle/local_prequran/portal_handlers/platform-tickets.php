<?php
// ---- report: platform-tickets (LAYER 2, EduPlatform side) --------------------
// The platform team's cross-consumer board: every tenant ticket grouped by
// school, SLA-sorted, with first-response tracking that is actually ENFORCED
// (a platform reply stamps firstrespondedat; the SLA monitor alerts on both
// first-response and resolution deadlines). Also the outage broadcast channel:
// one active notice reaches every consumer tech team's platform-support page
// plus a push message to their owners/admins — so twenty schools don't each
// open the same outage ticket.
// Gate: siteadmin / academy operations only.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

$userid = (int)($claims['sub'] ?? 0);
if (!is_siteadmin($userid) && !pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'The platform tickets board requires EduPlatform operations access.');
}
if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_platform_ticket'))) {
    pqpd_fail(503, 'Platform support tables are not ready. Run the Moodle plugin upgrade for local_prequran first.');
}

$statuses = ['open', 'in_progress', 'waiting_on_school', 'resolved', 'closed'];

/** Message one user (best-effort). */
$notifyuser = static function (int $recipientid, string $subject, string $bodytext): void {
    $recipient = core_user::get_user($recipientid);
    if (!$recipient || !empty($recipient->deleted) || !empty($recipient->suspended)) {
        return;
    }
    try {
        $message = new \core\message\message();
        $message->component = 'local_prequran';
        $message->name = 'live_session_update';
        $message->userfrom = core_user::get_noreply_user();
        $message->userto = $recipient;
        $message->subject = $subject;
        $message->fullmessage = $bodytext;
        $message->fullmessageformat = FORMAT_PLAIN;
        $message->fullmessagehtml = '';
        $message->smallmessage = $subject;
        $message->notification = 1;
        $message->courseid = SITEID;
        message_send($message);
    } catch (Throwable $e) {
        // Never block the write.
    }
};

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    $now = time();

    if ($do === 'reply_ticket') {
        $ticket = $DB->get_record('local_prequran_platform_ticket', ['id' => (int)($body['ticketid'] ?? 0)], '*', MUST_EXIST);
        $replybody = trim(clean_param((string)($body['replybody'] ?? ''), PARAM_TEXT));
        if ($replybody === '') {
            pqpd_fail(400, 'Type a message first.');
        }
        $DB->insert_record('local_prequran_platform_tmsg', (object)[
            'ticketid' => (int)$ticket->id, 'senderid' => $userid, 'sender_side' => 'platform',
            'body' => $replybody, 'timecreated' => $now,
        ]);
        $update = (object)['id' => (int)$ticket->id, 'timemodified' => $now];
        // FIRST-RESPONSE SLA made real: the first platform reply stamps it.
        if ((int)$ticket->firstrespondedat === 0) {
            $update->firstrespondedat = $now;
        }
        if ((string)$ticket->status === 'open') {
            $update->status = 'in_progress';
        }
        if ((int)$ticket->assigneeid === 0) {
            $update->assigneeid = $userid;
        }
        $DB->update_record('local_prequran_platform_ticket', $update);
        $notifyuser((int)$ticket->requesterid, 'EduPlatform replied on ' . (string)$ticket->ticketnumber,
            'EduPlatform support replied on ' . (string)$ticket->ticketnumber . ' ("' . (string)$ticket->subject . "\"):\n\n"
            . core_text::substr($replybody, 0, 500) . "\n\nOpen Platform Support in your portal for the full thread.");
        echo json_encode(['ok' => true, 'message' => 'Reply sent — the school\'s technical contact has been notified.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'update_ticket') {
        $ticket = $DB->get_record('local_prequran_platform_ticket', ['id' => (int)($body['ticketid'] ?? 0)], '*', MUST_EXIST);
        $newstatus = clean_param((string)($body['status'] ?? (string)$ticket->status), PARAM_ALPHANUMEXT);
        if (!in_array($newstatus, $statuses, true)) {
            pqpd_fail(400, 'Choose a valid ticket status.');
        }
        $resolution = trim(clean_param((string)($body['resolution'] ?? ''), PARAM_TEXT));
        if (in_array($newstatus, ['resolved', 'closed'], true) && $resolution === '' && trim((string)$ticket->resolution) === '') {
            pqpd_fail(400, 'Describe the resolution before resolving/closing (the school relays it to their users).');
        }
        $update = (object)['id' => (int)$ticket->id, 'status' => $newstatus, 'timemodified' => $now];
        if ($resolution !== '') {
            $update->resolution = $resolution;
        }
        if ($newstatus === 'resolved' && (int)$ticket->resolvedat === 0) {
            $update->resolvedat = $now;
        }
        if ($newstatus === 'closed' && (int)$ticket->closedat === 0) {
            $update->closedat = $now;
        }
        $assigneeid = (int)($body['assigneeid'] ?? 0);
        if ($assigneeid > 0) {
            $update->assigneeid = $assigneeid;
        }
        $DB->update_record('local_prequran_platform_ticket', $update);
        $statusmessages = [
            'in_progress' => 'is being worked on',
            'waiting_on_school' => 'is WAITING ON YOU — EduPlatform needs information from your side',
            'resolved' => 'has been RESOLVED' . ($resolution !== '' ? ': ' . core_text::substr($resolution, 0, 300) : ''),
            'closed' => 'has been closed',
            'open' => 'was reopened',
        ];
        $notifyuser((int)$ticket->requesterid, 'Ticket ' . (string)$ticket->ticketnumber . ': ' . $newstatus,
            'Your platform ticket ' . (string)$ticket->ticketnumber . ' ("' . (string)$ticket->subject . '") '
            . ($statusmessages[$newstatus] ?? $newstatus) . '.');
        echo json_encode(['ok' => true, 'message' => 'Ticket updated and the school notified.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'broadcast_notice') {
        $subject = trim(clean_param((string)($body['subject'] ?? ''), PARAM_TEXT));
        $noticebody = trim(clean_param((string)($body['noticebody'] ?? ''), PARAM_TEXT));
        $severity = clean_param((string)($body['severity'] ?? 'info'), PARAM_ALPHANUMEXT);
        if ($subject === '' || $noticebody === '') {
            pqpd_fail(400, 'Give the notice a subject and body.');
        }
        if (!in_array($severity, ['info', 'degraded', 'outage'], true)) {
            $severity = 'info';
        }
        $noticeid = (int)$DB->insert_record('local_prequran_platform_notice', (object)[
            'subject' => $subject, 'body' => $noticebody, 'severity' => $severity,
            'status' => 'active', 'createdby' => $userid, 'resolvedat' => 0,
            'timecreated' => $now, 'timemodified' => $now,
        ]);
        // Push to every workspace owner/admin (the consumer tech teams), cap 300.
        $recipients = $DB->get_records_sql(
            "SELECT DISTINCT wm.userid
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
              WHERE wm.status = 'active' AND wm.workspace_role IN ('platform_admin', 'owner', 'admin')", [], 0, 300);
        foreach ($recipients as $r) {
            $notifyuser((int)$r->userid, 'EduPlatform ' . strtoupper($severity) . ': ' . $subject,
                $noticebody . "\n\nStatus updates appear on your Platform Support page. Please do not open duplicate tickets for this issue.");
        }
        echo json_encode(['ok' => true, 'message' => 'Notice broadcast to ' . count($recipients) . ' school technical contact(s).', 'noticeid' => $noticeid], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'resolve_notice') {
        $notice = $DB->get_record('local_prequran_platform_notice', ['id' => (int)($body['noticeid'] ?? 0)], '*', MUST_EXIST);
        $DB->update_record('local_prequran_platform_notice', (object)[
            'id' => (int)$notice->id, 'status' => 'resolved', 'resolvedat' => $now, 'timemodified' => $now,
        ]);
        echo json_encode(['ok' => true, 'message' => 'Notice marked resolved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown platform-tickets action.');
}

// ---- GET: cross-consumer board, SLA-aware ------------------------------------
$now = time();
$tickets = array_values($DB->get_records_select('local_prequran_platform_ticket', '1=1', [],
    "CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END ASC,
     CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END ASC,
     timecreated ASC", '*', 0, 200));
$ticketid = optional_param('ticketid', 0, PARAM_INT);
$nameids = [];
$consumernames = [];
$rows = [];
foreach ($tickets as $t) {
    $nameids[] = (int)$t->requesterid;
    $nameids[] = (int)$t->assigneeid;
    $cid = (int)$t->consumerid;
    if ($cid > 0 && !isset($consumernames[$cid])) {
        $consumernames[$cid] = (string)$DB->get_field('local_prequran_consumer', 'name', ['id' => $cid], IGNORE_MISSING) ?: ('Consumer #' . $cid);
    }
    $isopen = !in_array((string)$t->status, ['resolved', 'closed'], true);
    $row = [
        'id' => (int)$t->id,
        'ticketnumber' => (string)$t->ticketnumber,
        'consumerid' => $cid,
        'consumername' => $cid > 0 ? $consumernames[$cid] : ('Workspace #' . (int)$t->workspaceid),
        'subject' => (string)$t->subject,
        'category' => (string)$t->category,
        'priority' => (string)$t->priority,
        'status' => (string)$t->status,
        'requesterid' => (int)$t->requesterid,
        'assigneeid' => (int)$t->assigneeid,
        'first_overdue' => $isopen && (int)$t->firstrespondedat === 0 && (int)$t->sla_first_due > 0 && (int)$t->sla_first_due < $now,
        'resolve_overdue' => $isopen && (int)$t->sla_resolve_due > 0 && (int)$t->sla_resolve_due < $now,
        'sla_first_due' => (int)$t->sla_first_due,
        'sla_resolve_due' => (int)$t->sla_resolve_due,
        'timecreated' => (int)$t->timecreated,
    ];
    if ($ticketid > 0 && (int)$t->id === $ticketid) {
        $row['description'] = (string)$t->description;
        $row['internal_ref'] = (string)$t->internal_ref;
        $row['resolution'] = (string)$t->resolution;
        $msgs = array_values($DB->get_records('local_prequran_platform_tmsg', ['ticketid' => $ticketid], 'timecreated ASC', '*', 0, 200));
        $row['messages'] = array_map(static function ($m) use (&$nameids) {
            $nameids[] = (int)$m->senderid;
            return ['senderid' => (int)$m->senderid, 'side' => (string)$m->sender_side,
                'body' => (string)$m->body, 'timecreated' => (int)$m->timecreated];
        }, $msgs);
    }
    $rows[] = $row;
}
$notices = array_values($DB->get_records('local_prequran_platform_notice', null, 'status ASC, timecreated DESC', '*', 0, 20));

echo json_encode([
    'ok' => true,
    'statuses' => $statuses,
    'tickets' => $rows,
    'notices' => $notices,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
