<?php
// ---- report: platform-support (LAYER 2, consumer side) -----------------------
// The B2B door between a consumer school's TECHNICAL TEAM and the EduPlatform
// platform team. Strictly tiered: teachers/students/parents never see this —
// they use their school's internal desk (Layer 1); the school's owners/admins
// escalate SYSTEM problems (outage, sync, domain, platform bugs) here.
// Included from portal_data.php AFTER token auth: $claims verified, $USER set,
// pqpd_fail/pqpd_names available.
// GET  = the school's own platform tickets (full status/assignee/SLA — the
//        requester-visible progress the internal desk never had) + active
//        platform notices ("we are aware of the outage").
// POST = open_ticket | reply_ticket (school side).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- gate: the Layer-2 door is workspace owners/admins ONLY ------------------
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Platform support is for your school\'s technical team (workspace owners/admins). For help with lessons or your account, contact your school\'s own support.');
}
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
if ($consumerid <= 0) {
    $consumerid = (int)$DB->get_field('local_prequran_consumer', 'id', ['primaryworkspaceid' => $workspaceid], IGNORE_MISSING);
}
$consumerid = max(0, $consumerid);

if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_platform_ticket'))) {
    pqpd_fail(503, 'Platform support tables are not ready. Run the Moodle plugin upgrade for local_prequran first.');
}

$categories = ['outage' => 'Outage / nothing works', 'login_access' => 'Login or access problem',
    'sync_data' => 'Sync or data problem', 'domain_dns' => 'Domain / DNS', 'platform_bug' => 'Platform bug',
    'billing_platform' => 'Platform billing', 'other' => 'Other system issue'];
$priorities = ['urgent' => 'Urgent — school cannot operate', 'high' => 'High — major function broken',
    'normal' => 'Normal', 'low' => 'Low'];
// First-response / resolution SLA minutes by priority (outage-appropriate).
$slamatrix = ['urgent' => [30, 240], 'high' => [120, 1440], 'normal' => [1440, 4320], 'low' => [2880, 10080]];

/** Notify the EduPlatform team (site admins) — best-effort. */
$notifyplatform = static function (string $subject, string $bodytext): void {
    foreach (get_admins() as $admin) {
        try {
            $message = new \core\message\message();
            $message->component = 'local_prequran';
            $message->name = 'live_session_update';
            $message->userfrom = core_user::get_noreply_user();
            $message->userto = $admin;
            $message->subject = $subject;
            $message->fullmessage = $bodytext;
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = '';
            $message->smallmessage = $subject;
            $message->notification = 1;
            $message->courseid = SITEID;
            message_send($message);
        } catch (Throwable $e) {
            // Never block the ticket write.
        }
    }
};

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    $now = time();

    if ($do === 'open_ticket') {
        $subject = trim(clean_param((string)($body['subject'] ?? ''), PARAM_TEXT));
        $description = trim(clean_param((string)($body['description'] ?? ''), PARAM_TEXT));
        $category = clean_param((string)($body['category'] ?? 'other'), PARAM_ALPHANUMEXT);
        $priority = clean_param((string)($body['priority'] ?? 'normal'), PARAM_ALPHANUMEXT);
        $internalref = trim(clean_param((string)($body['internal_ref'] ?? ''), PARAM_TEXT));
        if ($subject === '' || core_text::strlen($description) < 20) {
            pqpd_fail(400, 'Give the ticket a subject and describe the system problem (what broke, since when, who is affected).');
        }
        if (!isset($categories[$category])) {
            $category = 'other';
        }
        if (!isset($priorities[$priority])) {
            $priority = 'normal';
        }
        [$firstmins, $resolvemins] = $slamatrix[$priority];
        $ticketnumber = 'PLT-' . date('Ymd', $now) . '-' . str_pad((string)($DB->count_records('local_prequran_platform_ticket') + 1), 5, '0', STR_PAD_LEFT);
        $ticketid = (int)$DB->insert_record('local_prequran_platform_ticket', (object)[
            'ticketnumber' => $ticketnumber,
            'consumerid' => $consumerid,
            'workspaceid' => $workspaceid,
            'requesterid' => $userid,
            'subject' => $subject,
            'description' => $description . ($internalref !== '' ? "\n\nSchool internal ticket ref: " . $internalref : ''),
            'category' => $category,
            'priority' => $priority,
            'status' => 'open',
            'assigneeid' => 0,
            'internal_ref' => core_text::substr($internalref, 0, 120),
            'resolution' => '',
            'firstrespondedat' => 0,
            'resolvedat' => 0,
            'closedat' => 0,
            'sla_first_due' => $now + ($firstmins * MINSECS),
            'sla_resolve_due' => $now + ($resolvemins * MINSECS),
            'sla_first_alerted' => 0,
            'sla_resolve_alerted' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        $consumername = $consumerid > 0 ? (string)$DB->get_field('local_prequran_consumer', 'name', ['id' => $consumerid], IGNORE_MISSING) : ('workspace #' . $workspaceid);
        $notifyplatform('PLATFORM TICKET ' . $ticketnumber . ' [' . strtoupper($priority) . '] from ' . $consumername,
            $consumername . ' opened ' . $ticketnumber . ' (' . $categories[$category] . "):\n\n" . $subject . "\n\n"
            . core_text::substr($description, 0, 500) . "\n\nFirst response due " . userdate($now + ($firstmins * MINSECS)) . '. Open the Platform Tickets board.');
        echo json_encode(['ok' => true, 'message' => 'Ticket ' . $ticketnumber . ' opened — the EduPlatform team has been notified. First response due by ' . userdate($now + ($firstmins * MINSECS)) . '.', 'ticketid' => $ticketid], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'reply_ticket') {
        $ticket = $DB->get_record('local_prequran_platform_ticket', ['id' => (int)($body['ticketid'] ?? 0)], '*', IGNORE_MISSING);
        if (!$ticket || ((int)$ticket->workspaceid !== $workspaceid && ((int)$ticket->consumerid === 0 || (int)$ticket->consumerid !== $consumerid))) {
            pqpd_fail(403, 'That ticket does not belong to your school.');
        }
        $replybody = trim(clean_param((string)($body['replybody'] ?? ''), PARAM_TEXT));
        if ($replybody === '') {
            pqpd_fail(400, 'Type a message first.');
        }
        $DB->insert_record('local_prequran_platform_tmsg', (object)[
            'ticketid' => (int)$ticket->id, 'senderid' => $userid, 'sender_side' => 'school',
            'body' => $replybody, 'timecreated' => $now,
        ]);
        // A school reply while we were waiting on them re-opens the clock.
        if ((string)$ticket->status === 'waiting_on_school') {
            $DB->update_record('local_prequran_platform_ticket', (object)[
                'id' => (int)$ticket->id, 'status' => 'in_progress', 'timemodified' => $now,
            ]);
        }
        $notifyplatform('Reply on ' . (string)$ticket->ticketnumber . ': ' . (string)$ticket->subject,
            'The school replied on ' . (string)$ticket->ticketnumber . ":\n\n" . core_text::substr($replybody, 0, 500));
        echo json_encode(['ok' => true, 'message' => 'Reply sent to the EduPlatform team.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown platform-support action.');
}

// ---- GET: my school's tickets (with full status + SLA) + platform notices ----
$select = $consumerid > 0 ? '(consumerid = :cid OR workspaceid = :wsid)' : 'workspaceid = :wsid';
$params = $consumerid > 0 ? ['cid' => $consumerid, 'wsid' => $workspaceid] : ['wsid' => $workspaceid];
$tickets = array_values($DB->get_records_select('local_prequran_platform_ticket', $select, $params,
    "CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END ASC, timecreated DESC", '*', 0, 50));
$ticketid = optional_param('ticketid', 0, PARAM_INT);
$nameids = [];
$rows = [];
foreach ($tickets as $t) {
    $nameids[] = (int)$t->requesterid;
    $nameids[] = (int)$t->assigneeid;
    $row = [
        'id' => (int)$t->id,
        'ticketnumber' => (string)$t->ticketnumber,
        'subject' => (string)$t->subject,
        'category' => (string)$t->category,
        'priority' => (string)$t->priority,
        'status' => (string)$t->status,
        'assigneeid' => (int)$t->assigneeid,
        'requesterid' => (int)$t->requesterid,
        'firstresponded' => (int)$t->firstrespondedat > 0,
        'sla_first_due' => (int)$t->sla_first_due,
        'sla_resolve_due' => (int)$t->sla_resolve_due,
        'resolution' => (string)$t->resolution,
        'timecreated' => (int)$t->timecreated,
    ];
    if ($ticketid > 0 && (int)$t->id === $ticketid) {
        $msgs = array_values($DB->get_records('local_prequran_platform_tmsg', ['ticketid' => $ticketid], 'timecreated ASC', '*', 0, 200));
        $row['description'] = (string)$t->description;
        $row['messages'] = array_map(static function ($m) use (&$nameids) {
            $nameids[] = (int)$m->senderid;
            return ['senderid' => (int)$m->senderid, 'side' => (string)$m->sender_side,
                'body' => (string)$m->body, 'timecreated' => (int)$m->timecreated];
        }, $msgs);
    }
    $rows[] = $row;
}
$notices = [];
if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_platform_notice'))) {
    $notices = array_values($DB->get_records('local_prequran_platform_notice', ['status' => 'active'], 'timecreated DESC', 'id,subject,body,severity,timecreated', 0, 10));
}

// Settlement statements (B2B): the school sees its own ISSUED/PAID statements
// here — drafts stay EduPlatform-internal until issued.
$statements = [];
if ($consumerid > 0 && $DB->get_manager()->table_exists(new xmldb_table('local_prequran_platform_stmt'))) {
    $stmts = $DB->get_records_select('local_prequran_platform_stmt',
        "consumerid = :cid AND status IN ('issued', 'paid')", ['cid' => $consumerid],
        'periodstart DESC', '*', 0, 24);
    foreach ($stmts as $stmt) {
        $statements[] = [
            'statementnumber' => (string)$stmt->statementnumber,
            'periodstart' => (int)$stmt->periodstart,
            'periodend' => (int)$stmt->periodend,
            'currency' => (string)$stmt->currency,
            'grosscollected' => (string)$stmt->grosscollected,
            'feepercent' => (string)$stmt->feepercent,
            'feeamount' => (string)$stmt->feeamount,
            'adjustment' => (string)$stmt->adjustment,
            'netdue' => (string)$stmt->netdue,
            'status' => (string)$stmt->status,
            'paidat' => (int)$stmt->paidat,
        ];
    }
}

echo json_encode([
    'ok' => true,
    'workspaceid' => $workspaceid,
    'consumerid' => $consumerid,
    'categories' => $categories,
    'priorities' => $priorities,
    'tickets' => $rows,
    'notices' => $notices,
    'statements' => $statements,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
