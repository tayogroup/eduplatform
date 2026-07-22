<?php
// ---- report: communications-center (workspace comms hub; read + staff writes) ----
// Ported from local_hubredirect/communications_center.php via
// communications_center_portallib (pqcom_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel.
//
//   GET  ?report=communications-center&token=…[&workspaceid=] -> hub state
//        (roster options, templates, campaigns, deliveries, consents, cases,
//         thread history, recent messages) exactly as the page renders it.
//   POST ?report=communications-center&token=…  body {"do":"…", …}
//        do = send_message | save_case            (workspace teacher/admin)
//        do = save_template | save_campaign | save_consent (manager-only)
//
// Access is replicated verbatim from the page preamble: require_login is
// replaced by the token; the same pqh_current_workspace_id +
// pqh_user_can_teach_in_workspace gate and pqh_user_can_manage_workspace
// manager check apply. All five writes are DB writes with no CDN/WS dependency,
// so every write is ported; require_sesskey() is dropped (token auth replaces
// it) and each redirect/$notice becomes an ok JSON reply.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/operations_layerlib.php');
require_once($CFG->dirroot . '/local/hubredirect/communications_center_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- access (verbatim semantics from the page preamble) ---------------------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    // Legacy: pqh_access_denied(...) -> 403 JSON with the same message.
    pqpd_fail(403, 'Communications Center requires teacher or workspace administrator access.');
}
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// ---- writes -----------------------------------------------------------------
// One POST per action, ported verbatim (same guards, field assignments, DB
// records) from the page's $_SERVER['REQUEST_METHOD']==='POST' block. The
// require_sesskey() gate is replaced by token auth; $notice becomes ok JSON.

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    if (!pqops_comm_tables_ready()) {
        pqpd_fail(503, 'Communication tables are not ready. Run Moodle upgrade.');
    }
    $now = time();

    if ($do === 'send_message') {
        $studentid = (int)($body['studentid'] ?? 0);
        $participants = [];
        foreach (['parentid' => 'parent', 'teacherid' => 'teacher', 'studentid' => 'student'] as $param => $role) {
            $puserid = (int)($body[$param] ?? 0);
            if ($puserid > 0) {
                $participants[$puserid] = $role;
            }
        }
        $caseid = (int)($body['caseid'] ?? 0);
        $threadid = pqops_create_thread_message(
            $workspaceid,
            $studentid,
            $participants,
            clean_param((string)($body['thread_type'] ?? 'parent_teacher'), PARAM_ALPHANUMEXT),
            clean_param((string)($body['subject'] ?? ''), PARAM_TEXT),
            clean_param((string)($body['body'] ?? ''), PARAM_TEXT),
            (int)$USER->id,
            $caseid
        );
        echo json_encode([
            'ok' => true,
            'message' => 'Message thread #' . $threadid . ' created.',
            'threadid' => (int)$threadid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'save_template') {
        if (!$canmanage) {
            pqpd_fail(403, 'Only workspace managers can save communication templates.');
        }
        $DB->insert_record('local_prequran_comm_template', (object)[
            'workspaceid' => $workspaceid,
            'templatekey' => core_text::substr(clean_param((string)($body['templatekey'] ?? ''), PARAM_ALPHANUMEXT), 0, 120),
            'channel' => clean_param((string)($body['channel'] ?? 'email'), PARAM_ALPHANUMEXT),
            'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
            'subject' => clean_param((string)($body['subject'] ?? ''), PARAM_TEXT),
            'body' => clean_param((string)($body['body'] ?? ''), PARAM_TEXT),
            'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
            'createdby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        echo json_encode(['ok' => true, 'message' => 'Communication template saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'save_campaign') {
        if (!$canmanage) {
            pqpd_fail(403, 'Only workspace managers can queue campaigns.');
        }
        $audience = clean_param((string)($body['audience'] ?? 'parents'), PARAM_ALPHANUMEXT);
        $channel = clean_param((string)($body['channel'] ?? 'email'), PARAM_ALPHANUMEXT);
        $campaignid = (int)$DB->insert_record('local_prequran_comm_campaign', (object)[
            'workspaceid' => $workspaceid,
            'campaign_type' => clean_param((string)($body['campaign_type'] ?? 'announcement'), PARAM_ALPHANUMEXT),
            'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
            'channel' => $channel,
            'templateid' => (int)($body['templateid'] ?? 0),
            'audience' => $audience,
            'status' => clean_param((string)($body['status'] ?? 'queued'), PARAM_ALPHANUMEXT),
            'scheduledat' => pqops_datetime_from_parts(clean_param((string)($body['scheduled_date'] ?? ''), PARAM_TEXT), clean_param((string)($body['scheduled_time'] ?? ''), PARAM_TEXT)),
            'sentat' => 0,
            'messagebody' => clean_param((string)($body['messagebody'] ?? ''), PARAM_TEXT),
            'createdby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        $created = 0;
        foreach (pqcom_campaign_recipients($workspaceid, $audience) as $recipientid => $entry) {
            $user = $entry['user'];
            $DB->insert_record('local_prequran_comm_delivery', (object)[
                'workspaceid' => $workspaceid,
                'campaignid' => $campaignid,
                'threadid' => 0,
                'messageid' => 0,
                'studentid' => 0,
                'recipientid' => $recipientid,
                'channel' => $channel,
                'recipient_address' => (string)($user->email ?? ''),
                'status' => 'queued',
                'provider_response' => pqops_json(['audience_role' => $entry['role']]),
                'sentat' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $created++;
        }
        echo json_encode([
            'ok' => true,
            'message' => 'Campaign queued with ' . $created . ' delivery log row(s).',
            'campaignid' => $campaignid,
            'created' => $created,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'save_consent') {
        if (!$canmanage) {
            pqpd_fail(403, 'Only workspace managers can record communication consent.');
        }
        $studentid = (int)($body['studentid'] ?? 0);
        $guardianid = (int)($body['guardianid'] ?? 0);
        $channel = clean_param((string)($body['channel'] ?? 'email'), PARAM_ALPHANUMEXT);
        $existing = $DB->get_record('local_prequran_comm_consent', pqcom_existing_consent_conditions($workspaceid, $studentid, $guardianid, $channel), '*', IGNORE_MISSING);
        $source = clean_param((string)($body['source'] ?? 'manual'), PARAM_ALPHANUMEXT);
        $notes = clean_param((string)($body['notes'] ?? ''), PARAM_TEXT);
        $record = (object)[
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'guardianid' => $guardianid,
            'channel' => $channel,
            'consented' => (int)($body['consented'] ?? 1) ? 1 : 0,
            'source' => $source,
            'consent_source' => $source,
            'student_messaging_enabled' => 1,
            'free_text_enabled' => 1,
            'parent_visible' => 1,
            'details' => $notes,
            'notes' => $notes,
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_comm_consent', pqcom_existing_columns_record('local_prequran_comm_consent', $record));
        } else {
            $DB->insert_record('local_prequran_comm_consent', pqcom_existing_columns_record('local_prequran_comm_consent', $record));
        }
        echo json_encode(['ok' => true, 'message' => 'Communication consent saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'save_case') {
        $caseid = (int)($body['caseid'] ?? 0);
        $existing = $caseid > 0 ? $DB->get_record('local_prequran_comm_case', ['id' => $caseid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
        $status = clean_param((string)($body['status'] ?? 'open'), PARAM_ALPHANUMEXT);
        $record = (object)[
            'workspaceid' => $workspaceid,
            'studentid' => (int)($body['studentid'] ?? ($existing->studentid ?? 0)),
            'case_type' => clean_param((string)($body['case_type'] ?? 'general'), PARAM_ALPHANUMEXT),
            'priority' => clean_param((string)($body['priority'] ?? 'normal'), PARAM_ALPHANUMEXT),
            'status' => $status,
            'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
            'summary' => clean_param((string)($body['summary'] ?? ''), PARAM_TEXT),
            'ownerid' => (int)($body['ownerid'] ?? $USER->id),
            'openedby' => (int)($existing->openedby ?? $USER->id),
            'closedby' => $status === 'closed' ? (int)$USER->id : 0,
            'closedat' => $status === 'closed' ? $now : 0,
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_comm_case', $record);
            $message = 'Case updated.';
        } else {
            $DB->insert_record('local_prequran_comm_case', $record);
            $message = 'Case opened.';
        }
        echo json_encode(['ok' => true, 'message' => $message], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown communications-center action.');
}

// ---- reads (GET) — the same roster + list loads the page runs -------------
$tablesready = pqops_comm_tables_ready();

$students = pqops_workspace_users($workspaceid, 'student');
$parents = pqops_workspace_users($workspaceid, 'parent');
$teachers = pqops_workspace_users($workspaceid, 'teacher');
$templates = pqh_table_exists_safe('local_prequran_comm_template') ? array_values($DB->get_records('local_prequran_comm_template', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$campaigns = pqh_table_exists_safe('local_prequran_comm_campaign') ? array_values($DB->get_records('local_prequran_comm_campaign', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 60)) : [];
$deliveries = pqh_table_exists_safe('local_prequran_comm_delivery') ? array_values($DB->get_records('local_prequran_comm_delivery', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$consents = pqh_table_exists_safe('local_prequran_comm_consent') ? array_values($DB->get_records('local_prequran_comm_consent', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$cases = pqh_table_exists_safe('local_prequran_comm_case') ? array_values($DB->get_records('local_prequran_comm_case', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$threads = pqh_table_exists_safe('local_prequran_comm_thread') ? array_values($DB->get_records_sql("SELECT t.*, u.firstname, u.lastname FROM {local_prequran_comm_thread} t LEFT JOIN {user} u ON u.id = t.studentid WHERE t.workspaceid = :workspaceid ORDER BY t.lastmessageat DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$messages = pqh_table_exists_safe('local_prequran_comm_message') ? array_values($DB->get_records_sql("SELECT m.*, t.subject, t.workspaceid, u.firstname, u.lastname FROM {local_prequran_comm_message} m JOIN {local_prequran_comm_thread} t ON t.id = m.threadid LEFT JOIN {user} u ON u.id = m.senderid WHERE t.workspaceid = :workspaceid ORDER BY m.timecreated DESC", ['workspaceid' => $workspaceid], 0, 100)) : [];

$nameids = [];
$roster = static function(array $rows) use (&$nameids): array {
    $out = [];
    foreach ($rows as $u) {
        $nameids[] = (int)$u->id;
        $out[] = ['id' => (int)$u->id, 'name' => pqcom_name($u)];
    }
    return $out;
};
$studentopts = $roster($students);
$parentopts = $roster($parents);
$teacheropts = $roster($teachers);

$templateopts = [];
foreach ($templates as $t) {
    $templateopts[] = [
        'id' => (int)$t->id,
        'title' => (string)$t->title,
        'channel' => (string)$t->channel,
        'status' => (string)$t->status,
        'timemodified' => (int)($t->timemodified ?? 0),
    ];
}

$threadrows = [];
foreach ($threads as $thread) {
    $threadrows[] = [
        'id' => (int)$thread->id,
        'subject' => (string)$thread->subject,
        'type' => (string)$thread->type,
        'status' => (string)$thread->status,
        'lastmessageat' => (int)($thread->lastmessageat ?? 0),
        'student' => trim((string)$thread->firstname . ' ' . (string)$thread->lastname),
    ];
}

$messagerows = [];
foreach ($messages as $m) {
    $messagerows[] = [
        'subject' => (string)$m->subject,
        'sender' => trim((string)$m->firstname . ' ' . (string)$m->lastname),
        'body' => core_text::substr((string)$m->body, 0, 180),
        'timecreated' => (int)($m->timecreated ?? 0),
    ];
}

$campaignrows = [];
foreach ($campaigns as $c) {
    $campaignrows[] = [
        'title' => (string)$c->title,
        'channel' => (string)$c->channel,
        'audience' => (string)$c->audience,
        'status' => (string)$c->status,
    ];
}

$deliveryrows = [];
foreach ($deliveries as $d) {
    $nameids[] = (int)$d->recipientid;
    $deliveryrows[] = [
        'recipientid' => (int)$d->recipientid,
        'recipient_address' => (string)$d->recipient_address,
        'channel' => (string)$d->channel,
        'status' => (string)$d->status,
    ];
}

$consentrows = [];
foreach ($consents as $c) {
    $nameids[] = (int)$c->studentid;
    $nameids[] = (int)$c->guardianid;
    $consentrows[] = [
        'studentid' => (int)$c->studentid,
        'guardianid' => (int)$c->guardianid,
        'consented' => (int)$c->consented ? 1 : 0,
        'channel' => (string)$c->channel,
    ];
}

$caserows = [];
foreach ($cases as $case) {
    $nameids[] = (int)$case->studentid;
    $caserows[] = [
        'id' => (int)$case->id,
        'title' => (string)$case->title,
        'case_type' => (string)$case->case_type,
        'priority' => (string)$case->priority,
        'studentid' => (int)$case->studentid,
        'status' => (string)$case->status,
    ];
}

echo json_encode([
    'ok' => true,
    'workspaceid' => $workspaceid,
    'workspace' => (string)$workspace->name,
    'canmanage' => (bool)$canmanage,
    'tablesready' => (bool)$tablesready,
    'students' => $studentopts,
    'parents' => $parentopts,
    'teachers' => $teacheropts,
    'templates' => $templateopts,
    'cases' => $caserows,
    'threads' => $threadrows,
    'messages' => $messagerows,
    'campaigns' => $campaignrows,
    'deliveries' => $deliveryrows,
    'consents' => $consentrows,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
