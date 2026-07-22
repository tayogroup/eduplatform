<?php
// ---- report: live-followups (ops follow-up command center; read + staff write) ----
// Ported from local_hubredirect/live_followups.php via live_followups_portallib
// (pqlfl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the follow-up queue (metrics, filters by status/teacher/search/workspace,
//        overdue flags, per-row audit timeline) exactly as the page builds it.
// POST = do=update_followup — the page's only write, verbatim (operation
//        branches resolve/reopen/admin_support/update, status whitelist,
//        workspace scoping, manage guard, audit row). confirm_sesskey dropped:
//        token auth replaces the session key. redirect result=saved -> ok:true.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_followups_portallib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);

// Entry access check — same test and denial message as the page (runs before
// both the write and the read, exactly like the legacy flow).
$isadmin = is_siteadmin($USER);
if (!$isadmin && !pqlfl_is_teacher((int)$USER->id)) {
    pqpd_fail(403, 'Only teachers and administrators can manage live follow-ups.');
}

$ready = pqlfl_ready();
$now = time();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: update_followup (legacy action=update_followup, verbatim) --
    if ($do === 'update_followup') {
        // Legacy only accepts the write when the follow-up schema is installed.
        if (!$ready) {
            pqpd_fail(403, 'Follow-up fields are not installed yet. Complete Phases 25, 26, and 28 first.');
        }
        $noteid = (int)($body['noteid'] ?? 0);
        if ($noteid <= 0) {
            pqpd_fail(403, 'Choose a valid follow-up item before updating it.');
        }
        $note = $DB->get_record('local_prequran_live_note', ['id' => $noteid], '*', IGNORE_MISSING);
        if (!$note) {
            pqpd_fail(403, 'Choose a valid follow-up item before updating it.');
        }
        $session = $DB->get_record('local_prequran_live_session', ['id' => (int)$note->sessionid], '*', IGNORE_MISSING);
        if (!$session) {
            pqpd_fail(403, 'This follow-up is not linked to an available live session.');
        }
        $workspaceid = (int)($body['workspaceid'] ?? 0);
        if ($workspaceid > 0
                && pqlfl_column_exists('local_prequran_live_session', 'workspaceid')
                && (int)($session->workspaceid ?? 0) !== $workspaceid) {
            pqpd_fail(403, 'This follow-up is not scoped to the selected workspace.');
        }
        if (!pqlfl_can_manage_note($note, $session)) {
            pqpd_fail(403, 'You cannot manage this live follow-up.');
        }

        $operation = clean_param((string)($body['operation'] ?? 'resolve'), PARAM_ALPHANUMEXT);
        $internalnote = pqlfl_clean_text((string)($body['internal_note'] ?? ''), 1000);
        $status = clean_param((string)($body['followup_status'] ?? (string)$note->followup_status), PARAM_ALPHANUMEXT);
        if (!in_array($status, ['none', 'review_homework', 'parent_contact_requested', 'admin_support_requested'], true)) {
            $status = (string)$note->followup_status;
        }

        $oldstatus = (string)$note->followup_status;
        $oldresolved = !empty($note->followup_resolved);
        $note->timemodified = $now;
        if ($operation === 'resolve') {
            $note->followup_resolved = 1;
            $note->followup_resolvedby = (int)$USER->id;
            $note->followup_resolvedat = $now;
            if ($status !== 'none') {
                $note->followup_status = $status;
            }
            $auditaction = 'followup_resolved_command_center';
        } else if ($operation === 'reopen') {
            $note->followup_resolved = 0;
            $note->followup_resolvedby = 0;
            $note->followup_resolvedat = 0;
            $note->followup_status = $status === 'none' ? 'parent_contact_requested' : $status;
            $auditaction = 'followup_reopened_command_center';
        } else if ($operation === 'admin_support') {
            $note->followup_status = 'admin_support_requested';
            $note->followup_resolved = 0;
            $note->followup_resolvedby = 0;
            $note->followup_resolvedat = 0;
            $auditaction = 'followup_escalated_command_center';
        } else {
            $note->followup_status = $status;
            $auditaction = 'followup_updated_command_center';
        }
        $DB->update_record('local_prequran_live_note', $note);
        pqlfl_audit((int)$note->sessionid, $auditaction, 'followup', $noteid, [
            'studentid' => (int)$note->studentid,
            'oldstatus' => $oldstatus,
            'newstatus' => (string)$note->followup_status,
            'oldresolved' => $oldresolved,
            'newresolved' => !empty($note->followup_resolved),
            'note' => $internalnote,
        ]);
        echo json_encode([
            'ok' => true,
            'result' => 'saved',
            'message' => 'Follow-up updated.',
            'noteid' => $noteid,
            'followup_status' => (string)$note->followup_status,
            'followup_resolved' => !empty($note->followup_resolved),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-followups action.');
}

// -- GET: the follow-up queue (same filters, metrics, and row query as the page) --
$filter = optional_param('filter', 'open', PARAM_ALPHANUMEXT);
if (!in_array($filter, ['all', 'open', 'needs_help', 'overdue', 'escalated', 'resolved'], true)) {
    $filter = 'open';
}
$teacherfilter = $isadmin ? optional_param('teacherid', 0, PARAM_INT) : (int)$USER->id;
$q = trim(optional_param('q', '', PARAM_TEXT));
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);

$metrics = [
    'open' => 0,
    'needs_help' => 0,
    'overdue' => 0,
    'escalated' => 0,
    'resolved' => 0,
];
$rows = [];
$teachers = [];

if ($ready) {
    $workspacefilteralias = '';
    $workspaceparams = [];
    if ($workspaceid > 0 && pqlfl_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilteralias = ' AND s.workspaceid = :workspaceid';
        $workspaceparams = ['workspaceid' => $workspaceid];
    }
    $parentresponseready = pqlfl_column_exists('local_prequran_live_note', 'parent_response_status');
    $parentresponseselect = $parentresponseready
        ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
        : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
    $contactexpr = "COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified)";

    $baseparams = array_merge(['none' => 'none'], $workspaceparams);
    $teachersql = ($isadmin ? '' : ' AND s.teacherid = :currentteacher') . $workspacefilteralias;
    if (!$isadmin) {
        $baseparams['currentteacher'] = (int)$USER->id;
    }

    $metrics['open'] = pqlfl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 0{$teachersql}",
        $baseparams
    );
    $metrics['needs_help'] = $parentresponseready ? pqlfl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 0
            AND n.parent_response_status = :needshelp{$teachersql}",
        $baseparams + ['needshelp' => 'needs_help']
    ) : 0;
    $metrics['overdue'] = pqlfl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 0
            AND {$contactexpr} <= :cutoff{$teachersql}",
        $baseparams + ['cutoff' => $now - (2 * DAYSECS)]
    );
    $metrics['escalated'] = pqlfl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status = :adminsupport
            AND n.followup_resolved = 0{$teachersql}",
        $baseparams + ['adminsupport' => 'admin_support_requested']
    );
    $metrics['resolved'] = pqlfl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.followup_status <> :none
            AND n.followup_resolved = 1{$teachersql}",
        $baseparams
    );

    if ($isadmin) {
        $teachers = $DB->get_records_sql(
            "SELECT DISTINCT s.teacherid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_note} n ON n.sessionid = s.id
              WHERE n.followup_status <> :none
                {$workspacefilteralias}
           ORDER BY s.teacherid ASC",
            array_merge(['none' => 'none'], $workspaceparams)
        );
    }

    $where = ['n.followup_status <> :none'];
    $params = ['none' => 'none'];
    if ($teacherfilter > 0) {
        $where[] = 's.teacherid = :teacherfilter';
        $params['teacherfilter'] = $teacherfilter;
    }
    if ($filter === 'open') {
        $where[] = 'n.followup_resolved = 0';
    } else if ($filter === 'needs_help') {
        if ($parentresponseready) {
            $where[] = 'n.followup_resolved = 0';
            $where[] = 'n.parent_response_status = :needshelp';
            $params['needshelp'] = 'needs_help';
        } else {
            $where[] = '1 = 0';
        }
    } else if ($filter === 'overdue') {
        $where[] = 'n.followup_resolved = 0';
        $where[] = "{$contactexpr} <= :cutoff";
        $params['cutoff'] = $now - (2 * DAYSECS);
    } else if ($filter === 'escalated') {
        $where[] = 'n.followup_status = :adminsupport';
        $where[] = 'n.followup_resolved = 0';
        $params['adminsupport'] = 'admin_support_requested';
    } else if ($filter === 'resolved') {
        $where[] = 'n.followup_resolved = 1';
    }
    if ($q !== '') {
        $querylike = '%' . $DB->sql_like_escape($q) . '%';
        $where[] = '(s.title LIKE :querytitle OR n.followup_message LIKE :querymessage OR n.parent_summary LIKE :querysummary)';
        $params['querytitle'] = $querylike;
        $params['querymessage'] = $querylike;
        $params['querysummary'] = $querylike;
    }
    if (!$isadmin) {
        $where[] = 's.teacherid = :currentteacher';
        $params['currentteacher'] = (int)$USER->id;
    }
    if ($workspacefilteralias !== '') {
        $where[] = 's.workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }

    $wheresql = implode(' AND ', $where);
    $rows = array_values($DB->get_records_sql(
        "SELECT n.*,
                {$parentresponseselect}
                s.title AS session_title,
                s.teacherid,
                s.scheduled_start,
                s.scheduled_end,
                s.status AS session_status,
                {$contactexpr} AS followup_age_base
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE {$wheresql}
       ORDER BY n.followup_resolved ASC,
                CASE WHEN n.followup_status = 'admin_support_requested' THEN 0 ELSE 1 END ASC,
                {$contactexpr} ASC,
                n.timemodified DESC",
        $params,
        0,
        100
    ));
}

// Decorate for the client (overdue flag + audit timeline computed server-side,
// the same expressions the page evaluates inline while rendering each card).
$nameids = [];
foreach ($rows as $note) {
    $note->overdue = empty($note->followup_resolved) && (int)$note->followup_age_base <= $now - (2 * DAYSECS);
    $note->timeline = pqlfl_timeline((int)$note->sessionid, (int)$note->studentid, (int)$note->id);
    $nameids[] = (int)$note->teacherid;
    $nameids[] = (int)$note->studentid;
    $nameids[] = (int)($note->followup_resolvedby ?? 0);
    $nameids[] = (int)($note->parent_responseby ?? 0);
    foreach ($note->timeline as $event) {
        $nameids[] = (int)$event->actorid;
    }
}
$teacherlist = [];
foreach ($teachers as $teacher) {
    $tid = (int)$teacher->teacherid;
    $teacherlist[] = ['teacherid' => $tid, 'name' => pqlfl_user_name($tid, 'Teacher ' . $tid)];
    $nameids[] = $tid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'isadmin' => $isadmin,
    'filter' => $filter,
    'teacherfilter' => $teacherfilter,
    'q' => $q,
    'workspaceid' => $workspaceid,
    'now' => $now,
    'metrics' => $metrics,
    'teachers' => $teacherlist,
    'rows' => $rows,
    'names' => pqpd_names($nameids),
    'wwwroot' => $CFG->wwwroot,
], JSON_UNESCAPED_SLASHES);
exit;
