<?php
// ---- report: live-quality (QA review console; read + ops QA writes) ----------
// Ported from local_hubredirect/live_quality.php via live_quality_portallib
// (pqlql_*). Dispatched from portal_data.php AFTER token auth: $claims is
// verified, $USER is the token user, JSON exception handler + CORS headers are
// installed. The legacy page stays live in parallel and is untouched. The
// quality-analytics portal report reads what this page writes.
//
// GET  ?report=live-quality&token=…&sessionid=[&workspaceid=&consumer=&qastatus=]
//      sessionid > 0 -> the single-session review state: session QA fields,
//        checklist definition + saved values, coaching/leadership state,
//        student evidence, recordings, and the QA audit trail.
//      sessionid <= 0 -> the review queue (recent sessions with their QA state,
//        filterable by qastatus + workspaceid). The legacy page has no queue —
//        it is deep-linked with sessionid from live_sessions/live_ops and
//        denies without one — so the queue is a portal-only convenience read
//        behind the SAME academy-operations gate.
// POST body JSON {"do":"save_quality","sessionid":…,"checklist":{key:value},…}
//      -> the legacy action=save_quality block verbatim (status/checklist
//         whitelists, score, coaching loop, leadership review, audits). The
//         legacy form posts qa_<key> fields; the portal posts body.checklist —
//         the loop below still iterates the server-side item list, never the
//         client's keys. confirm_sesskey() dropped: token auth replaces it.
// Access is the legacy page chain verbatim, as JSON denials:
//   pqh_require_academy_operations -> pqpd_fail(403, same message)
//   pqlq_required_ready            -> pqpd_fail(403, same message)
//   missing session / consumer mismatch / workspace mismatch -> same messages.
// (live_quality.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_quality_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
}

// ---- page preamble, replicated from the legacy page ---------------------------
$sessionid = $ispost ? (int)($body['sessionid'] ?? 0) : optional_param('sessionid', 0, PARAM_INT);
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}

// Entry gate: legacy pqh_require_academy_operations(), identical message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can complete live-session quality review.');
}

if (!pqlql_required_ready()) {
    pqpd_fail(403, 'Live quality review fields are not installed yet. Run the live quality SQL upgrade before using this page.');
}

$coachingready = pqlql_column_exists('local_prequran_live_session', 'qa_coaching_status');
$leadershipready = pqlql_column_exists('local_prequran_live_session', 'leadership_review_status');
$workspacecolumn = pqlql_column_exists('local_prequran_live_session', 'workspaceid');
$statuslabels = ['not_reviewed' => 'Not reviewed', 'passed' => 'Passed', 'needs_coaching' => 'Needs coaching', 'serious_issue' => 'Serious issue'];

// ---- GET: the review queue (portal-only read; sessionid missing) --------------
if (!$ispost && $sessionid <= 0) {
    $qastatusfilter = optional_param('qastatus', '', PARAM_ALPHANUMEXT);
    if (!array_key_exists($qastatusfilter, $statuslabels)) {
        $qastatusfilter = '';
    }
    $where = [];
    $params = [];
    if ($qastatusfilter === 'not_reviewed') {
        // Sessions never touched by QA carry NULL/'' in qa_status.
        $where[] = "(qa_status IS NULL OR qa_status = '' OR qa_status = :qastatus)";
        $params['qastatus'] = $qastatusfilter;
    } else if ($qastatusfilter !== '') {
        $where[] = 'qa_status = :qastatus';
        $params['qastatus'] = $qastatusfilter;
    }
    if ($requestedworkspaceid > 0 && $workspacecolumn) {
        $where[] = 'workspaceid = :workspaceid';
        $params['workspaceid'] = $requestedworkspaceid;
    }
    $rows = $DB->get_records_select(
        'local_prequran_live_session',
        $where ? implode(' AND ', $where) : '1 = 1',
        $params,
        'scheduled_start DESC, id DESC',
        '*',
        0,
        150
    );

    $queue = [];
    $nameids = [];
    foreach ($rows as $row) {
        // Same consumer scoping the page enforces per session.
        if (!pqh_record_belongs_to_consumer_context($row)) {
            continue;
        }
        $nameids[] = (int)$row->teacherid;
        $queue[] = [
            'id' => (int)$row->id,
            'title' => (string)$row->title,
            'status' => (string)$row->status,
            'scheduled_start' => (int)$row->scheduled_start,
            'scheduled_end' => (int)$row->scheduled_end,
            'teacherid' => (int)$row->teacherid,
            'workspaceid' => (int)($row->workspaceid ?? 0),
            'qa_status' => (string)($row->qa_status ?? '') !== '' ? (string)$row->qa_status : 'not_reviewed',
            'qa_score' => (int)($row->qa_score ?? 0),
            'qa_reviewedat' => (int)($row->qa_reviewedat ?? 0),
            'qa_reviewedby' => (int)($row->qa_reviewedby ?? 0),
            'qa_coaching_status' => $coachingready ? (string)($row->qa_coaching_status ?? 'none') : '',
            'leadership_review_status' => $leadershipready ? (string)($row->leadership_review_status ?? 'none') : '',
        ];
        $nameids[] = (int)($row->qa_reviewedby ?? 0);
    }

    echo json_encode([
        'ok' => true,
        'ready' => true,
        'mode' => 'queue',
        'queue' => $queue,
        'qastatus' => $qastatusfilter,
        'status_options' => $statuslabels,
        'coachingready' => $coachingready,
        'leadershipready' => $leadershipready,
        'names' => pqpd_names($nameids),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- session resolution + denials, legacy chain verbatim ----------------------
$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqpd_fail(403, 'Choose a valid live session before opening the quality review.');
}
if (!pqh_record_belongs_to_consumer_context($session)) {
    pqpd_fail(403, 'This live session does not belong to the active consumer.');
}
if ($requestedworkspaceid > 0
    && $workspacecolumn
    && (int)($session->workspaceid ?? 0) !== $requestedworkspaceid) {
    $actualworkspaceid = (int)($session->workspaceid ?? 0);
    pqpd_fail(403, 'This live session belongs to workspace #' . $actualworkspaceid . ', not workspace #' . $requestedworkspaceid . '. Choose a session from this workspace live-session list.');
}

if ($ispost) {
    $do = (string)($body['do'] ?? '');

    // ---- do: save_quality (legacy action=save_quality, verbatim) --------------
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'save_quality') {
        $oldstatus = (string)($session->qa_status ?? 'not_reviewed');
        $oldcoachingstatus = (string)($session->qa_coaching_status ?? 'none');
        $oldleadershipstatus = (string)($session->leadership_review_status ?? 'none');
        $status = clean_param((string)($body['qa_status'] ?? 'not_reviewed'), PARAM_ALPHANUMEXT);
        if (!in_array($status, ['not_reviewed', 'passed', 'needs_coaching', 'serious_issue'], true)) {
            $status = 'not_reviewed';
        }
        $checklistinput = is_array($body['checklist'] ?? null) ? $body['checklist'] : [];
        $checklist = [];
        foreach (pqlql_items() as $key => $label) {
            $value = clean_param((string)($checklistinput[$key] ?? 'not_checked'), PARAM_ALPHANUMEXT);
            if (!in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true)) {
                $value = 'not_checked';
            }
            $checklist[$key] = $value;
        }
        $score = pqlql_score($checklist);
        $session->qa_status = $status;
        $session->qa_score = $score;
        $session->qa_checklist = json_encode($checklist);
        $session->qa_notes = pqlql_clean_text((string)($body['qa_notes'] ?? ''), 4000);
        $session->qa_coaching_notes = pqlql_clean_text((string)($body['qa_coaching_notes'] ?? ''), 4000);
        if ($coachingready) {
            $coachingstatus = clean_param((string)($body['qa_coaching_status'] ?? 'none'), PARAM_ALPHANUMEXT);
            if (!in_array($coachingstatus, ['none', 'assigned', 'acknowledged', 'completed'], true)) {
                $coachingstatus = 'none';
            }
            $priority = clean_param((string)($body['qa_coaching_priority'] ?? 'normal'), PARAM_ALPHANUMEXT);
            if (!in_array($priority, ['low', 'normal', 'high'], true)) {
                $priority = 'normal';
            }
            $duedate = clean_param((string)($body['qa_coaching_due_date'] ?? ''), PARAM_TEXT);
            $duetime = trim($duedate) !== '' ? strtotime($duedate . ' 23:59:59 ' . core_date::get_server_timezone()) : 0;
            $session->qa_coaching_status = $coachingstatus;
            $session->qa_coaching_priority = $priority;
            $session->qa_coaching_due_date = $duetime ?: 0;
            if ($coachingstatus === 'completed' && empty($session->qa_coaching_completedat)) {
                $session->qa_coaching_completedby = (int)$USER->id;
                $session->qa_coaching_completedat = time();
            } else if ($coachingstatus !== 'completed') {
                $session->qa_coaching_completedby = 0;
                $session->qa_coaching_completedat = 0;
            }
            if ($coachingstatus === 'none') {
                $session->qa_coaching_ackby = 0;
                $session->qa_coaching_ackat = 0;
            }
        }
        if ($leadershipready) {
            $leadershipstatus = clean_param((string)($body['leadership_review_status'] ?? 'none'), PARAM_ALPHANUMEXT);
            if (!in_array($leadershipstatus, ['none', 'flagged', 'in_review', 'cleared'], true)) {
                $leadershipstatus = 'none';
            }
            $session->leadership_review_status = $leadershipstatus;
            $session->leadership_review_reason = pqlql_clean_text((string)($body['leadership_review_reason'] ?? ''), 4000);
            $session->leadership_review_notes = pqlql_clean_text((string)($body['leadership_review_notes'] ?? ''), 4000);
            if ($leadershipstatus !== 'none' && $leadershipstatus !== 'cleared') {
                $session->leadership_reviewby = (int)$USER->id;
                $session->leadership_reviewat = time();
                $session->leadership_clearedby = 0;
                $session->leadership_clearedat = 0;
            } else if ($leadershipstatus === 'cleared') {
                $session->leadership_clearedby = (int)$USER->id;
                $session->leadership_clearedat = time();
            } else {
                $session->leadership_reviewby = 0;
                $session->leadership_reviewat = 0;
                $session->leadership_clearedby = 0;
                $session->leadership_clearedat = 0;
            }
        }
        $session->qa_reviewedby = (int)$USER->id;
        $session->qa_reviewedat = time();
        $session->timemodified = time();
        $DB->update_record('local_prequran_live_session', $session);

        $action = 'quality_review_saved';
        if ($status === 'passed') {
            $action = 'quality_review_passed';
        } else if ($status === 'needs_coaching') {
            $action = 'quality_review_needs_coaching';
        } else if ($status === 'serious_issue') {
            $action = 'quality_review_serious_issue';
        }
        pqlql_audit($sessionid, $action, [
            'oldstatus' => $oldstatus,
            'newstatus' => $status,
            'score' => $score,
        ]);
        if ($coachingready && (string)$session->qa_coaching_status !== $oldcoachingstatus) {
            $coachingaction = 'quality_coaching_updated';
            if ((string)$session->qa_coaching_status === 'assigned') {
                $coachingaction = 'quality_coaching_assigned';
            } else if ((string)$session->qa_coaching_status === 'completed') {
                $coachingaction = 'quality_coaching_completed';
            }
            pqlql_audit($sessionid, $coachingaction, [
                'oldstatus' => $oldcoachingstatus,
                'newstatus' => (string)$session->qa_coaching_status,
                'priority' => (string)($session->qa_coaching_priority ?? 'normal'),
                'due' => (int)($session->qa_coaching_due_date ?? 0),
            ]);
        }
        if ($leadershipready && (string)$session->leadership_review_status !== $oldleadershipstatus) {
            $leadershipaction = 'leadership_review_updated';
            if (in_array((string)$session->leadership_review_status, ['flagged', 'in_review'], true)) {
                $leadershipaction = 'leadership_review_flagged';
            } else if ((string)$session->leadership_review_status === 'cleared') {
                $leadershipaction = 'leadership_review_cleared';
            }
            pqlql_audit($sessionid, $leadershipaction, [
                'oldstatus' => $oldleadershipstatus,
                'newstatus' => (string)$session->leadership_review_status,
                'reason' => (string)($session->leadership_review_reason ?? ''),
            ]);
        }
        // Legacy redirects with ?result=saved; the API answers JSON instead.
        echo json_encode([
            'ok' => true,
            'result' => 'saved',
            'message' => 'Quality review saved.',
            'qa_status' => $status,
            'qa_score' => $score,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-quality action.');
}

// ---- GET: the single-session review state (legacy render data) ----------------
$teachername = pqlql_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid);
$checklist = pqlql_decode_checklist($session);
$students = array_values($DB->get_records_sql(
    "SELECT p.*,
            a.attendance_status,
            a.technical_issue,
            n.visible_to_parent,
            n.parent_summary,
            n.private_note,
            n.followup_status,
            n.followup_resolved
       FROM {local_prequran_live_participant} p
  LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = p.sessionid AND a.studentid = p.studentid
  LEFT JOIN {local_prequran_live_note} n ON n.sessionid = p.sessionid AND n.studentid = p.studentid
      WHERE p.sessionid = :sessionid
        AND p.role = :role
        AND p.status = :status
   ORDER BY p.displayname ASC, p.userid ASC",
    ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active']
));
$recordings = array_values($DB->get_records('local_prequran_live_recording', ['sessionid' => $sessionid], 'timemodified DESC, id DESC'));
$auditrows = array_values($DB->get_records_sql(
    "SELECT *
       FROM {local_prequran_live_audit}
      WHERE sessionid = :sessionid
        AND action IN (
            'quality_review_saved',
            'quality_review_passed',
            'quality_review_needs_coaching',
            'quality_review_serious_issue',
            'quality_coaching_assigned',
            'quality_coaching_acknowledged',
            'quality_coaching_completed',
            'quality_coaching_updated',
            'leadership_review_flagged',
            'leadership_review_updated',
            'leadership_review_cleared'
        )
   ORDER BY timecreated DESC, id DESC",
    ['sessionid' => $sessionid],
    0,
    20
));

// Curated evidence rows — the legacy table renders only readiness and status,
// never the parent_summary/private_note bodies, so neither leaves the server.
$nameids = [(int)$session->teacherid, (int)($session->qa_reviewedby ?? 0)];
$evidence = [];
foreach ($students as $student) {
    $studentid = (int)($student->studentid ?: $student->userid);
    $nameids[] = $studentid;
    $evidence[] = [
        'studentid' => $studentid,
        'name' => pqlql_user_name($studentid, (string)$student->displayname ?: 'Student ' . $studentid),
        'attendance_status' => (string)($student->attendance_status ?? ''),
        'technical_issue' => (int)!empty($student->technical_issue),
        'parent_summary_ready' => (int)(!empty($student->visible_to_parent) && trim((string)($student->parent_summary ?? '')) !== ''),
        'followup_status' => (string)($student->followup_status ?? 'none'),
        'followup_resolved' => (int)!empty($student->followup_resolved),
    ];
}
$recordingsout = [];
foreach ($recordings as $recording) {
    $recordingsout[] = [
        'id' => (int)$recording->id,
        'name' => (string)$recording->name,
        'status' => (string)$recording->status,
        'visible_to_parent' => (int)!empty($recording->visible_to_parent),
        'reviewedat' => (int)($recording->reviewedat ?? 0),
        'playback_url' => trim((string)$recording->playback_url),
    ];
}
$auditout = [];
foreach ($auditrows as $row) {
    $nameids[] = (int)$row->actorid;
    $auditout[] = [
        'timecreated' => (int)$row->timecreated,
        'actorid' => (int)$row->actorid,
        'action' => (string)$row->action,
        'details' => (string)$row->details,
    ];
}

// Curated session fields only — the raw record carries BBB room credentials
// that must never reach the browser.
$sessionout = [
    'id' => (int)$session->id,
    'title' => (string)$session->title,
    'status' => (string)$session->status,
    'scheduled_start' => (int)$session->scheduled_start,
    'scheduled_end' => (int)$session->scheduled_end,
    'lessonid' => (string)($session->lessonid ?? ''),
    'unitid' => (string)($session->unitid ?? ''),
    'teacherid' => (int)$session->teacherid,
    'workspaceid' => (int)($session->workspaceid ?? 0),
    'qa_status' => (string)($session->qa_status ?? '') !== '' ? (string)$session->qa_status : 'not_reviewed',
    'qa_score' => (int)($session->qa_score ?? 0),
    'qa_notes' => (string)($session->qa_notes ?? ''),
    'qa_coaching_notes' => (string)($session->qa_coaching_notes ?? ''),
    'qa_reviewedby' => (int)($session->qa_reviewedby ?? 0),
    'qa_reviewedat' => (int)($session->qa_reviewedat ?? 0),
];
if ($coachingready) {
    $sessionout['qa_coaching_status'] = (string)($session->qa_coaching_status ?? 'none');
    $sessionout['qa_coaching_priority'] = (string)($session->qa_coaching_priority ?? 'normal');
    $sessionout['qa_coaching_due_date'] = (int)($session->qa_coaching_due_date ?? 0);
    $sessionout['qa_coaching_ackby'] = (int)($session->qa_coaching_ackby ?? 0);
    $sessionout['qa_coaching_ackat'] = (int)($session->qa_coaching_ackat ?? 0);
    $sessionout['qa_coaching_completedby'] = (int)($session->qa_coaching_completedby ?? 0);
    $sessionout['qa_coaching_completedat'] = (int)($session->qa_coaching_completedat ?? 0);
    $nameids[] = (int)($session->qa_coaching_ackby ?? 0);
    $nameids[] = (int)($session->qa_coaching_completedby ?? 0);
}
if ($leadershipready) {
    $sessionout['leadership_review_status'] = (string)($session->leadership_review_status ?? 'none');
    $sessionout['leadership_review_reason'] = (string)($session->leadership_review_reason ?? '');
    $sessionout['leadership_review_notes'] = (string)($session->leadership_review_notes ?? '');
    $sessionout['leadership_reviewby'] = (int)($session->leadership_reviewby ?? 0);
    $sessionout['leadership_reviewat'] = (int)($session->leadership_reviewat ?? 0);
    $sessionout['leadership_clearedby'] = (int)($session->leadership_clearedby ?? 0);
    $sessionout['leadership_clearedat'] = (int)($session->leadership_clearedat ?? 0);
    $nameids[] = (int)($session->leadership_reviewby ?? 0);
    $nameids[] = (int)($session->leadership_clearedby ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'mode' => 'review',
    'session' => $sessionout,
    'teachername' => $teachername,
    'checklist' => $checklist,
    'items' => pqlql_items(),
    'status_options' => $statuslabels,
    'checklist_options' => ['not_checked' => 'Not checked', 'pass' => 'Pass', 'concern' => 'Concern', 'not_applicable' => 'N/A'],
    'coaching_options' => ['none' => 'No coaching', 'assigned' => 'Assigned', 'acknowledged' => 'Acknowledged', 'completed' => 'Completed'],
    'priority_options' => ['low' => 'Low', 'normal' => 'Normal', 'high' => 'High'],
    'leadership_options' => ['none' => 'No leadership review', 'flagged' => 'Flagged', 'in_review' => 'In review', 'cleared' => 'Cleared'],
    'coachingready' => $coachingready,
    'leadershipready' => $leadershipready,
    'evidence' => $evidence,
    'recordings' => $recordingsout,
    'audit' => $auditout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
