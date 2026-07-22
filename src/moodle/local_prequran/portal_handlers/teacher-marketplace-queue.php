<?php
// ---- report: teacher-marketplace-queue (my teacher requests review queue) ----
// Ported from local_hubredirect/teacher_marketplace_requests.php via
// teacher_marketplace_requests_portallib (pqtmrql_*). Included from
// portal_data.php AFTER token auth: $claims verified, $USER set to the token
// user, JSON exception handler installed, headers sent.
// GET  = the token user's teacher-request queue (rows where they are the
//        parent/guardian OR the requesting teacher), decorated with the same
//        names, labels, pill classes and action links the page renders.
// POST = do=connection_decision (guardian approve/decline, verbatim update).
// (teacher_marketplace_requests.php has no pqh_live_security_audit calls —
// none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_marketplace_requests_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Legacy ENTRY access check is require_login() only — every row below is
// scoped to the token user (parentid = user OR teacherid = user), so token
// auth alone matches the page's gate. The page's cross-consumer-domain
// redirect (lines 9-23) is browser navigation, not data access — skipped.
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$brandname = (string)$consumercontext->consumername;

$ready = pqtmrql_ready();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: connection_decision (legacy POST connection_decision, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key. The
    // legacy page's throw messages are returned as the exact denial strings.
    if ($do === 'connection_decision') {
        if (!$ready) {
            // Legacy silently skips POST handling when the schema is missing;
            // an API must say why instead.
            pqpd_fail(403, 'Teacher request schema is not ready yet. Please run the local_prequran Moodle upgrade.');
        }
        $requestid = (int)($body['requestid'] ?? 0);
        $decision = clean_param((string)($body['connection_decision'] ?? ''), PARAM_ALPHANUMEXT);
        if (!in_array($decision, ['approve', 'decline'], true)) {
            pqpd_fail(403, 'Choose approve or decline.');
        }
        $request = $DB->get_record('local_prequran_teacher_request', [
            'id' => $requestid,
            'parentid' => $userid,
        ], '*', IGNORE_MISSING);
        if (!$request) {
            pqpd_fail(403, 'This teacher connection request is not linked to your account.');
        }
        if (pqtmrql_column_exists('local_prequran_teacher_request', 'consumerid')
                && (int)$consumercontext->consumerid > 0
                && (int)$request->consumerid !== (int)$consumercontext->consumerid) {
            pqpd_fail(403, 'This request does not belong to the active marketplace.');
        }
        if (!in_array((string)$request->request_status, ['selection_requested', 'academy_review', 'teacher_contacted', 'parent_confirmed'], true)) {
            pqpd_fail(403, 'This request can no longer be changed from the parent dashboard.');
        }

        $request->request_status = $decision === 'approve' ? 'parent_confirmed' : 'declined';
        $decisionnote = userdate(time()) . ' - ' . fullname($USER) . ': Guardian ' . ($decision === 'approve' ? 'approved' : 'declined') . ' the teacher-student connection.';
        $request->admin_notes = trim((string)($request->admin_notes ?? '')) !== ''
            ? (string)$request->admin_notes . "\n" . $decisionnote
            : $decisionnote;
        $request->timemodified = time();
        $DB->update_record('local_prequran_teacher_request', $request);
        echo json_encode([
            'ok' => true,
            'message' => $decision === 'approve'
                ? 'Connection approved. Marketplace operations will complete the workspace assignment.'
                : 'Connection declined. No student records or workspace access were changed.',
            'requestid' => $requestid,
            'request_status' => (string)$request->request_status,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown teacher-marketplace-queue action.');
}

// -- GET: the queue (verbatim query — same joins, scoping, order, limit 100) --
$requests = [];
if ($ready) {
    $consumerselect = ", '' AS consumer_slug, '' AS consumer_name";
    $consumerjoin = '';
    $consumerwhere = '';
    $params = [
        'parentuserid' => $userid,
        'teacheruserid' => $userid,
    ];
    if (pqtmrql_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $consumerselect = ', c.slug AS consumer_slug, c.name AS consumer_name';
        $consumerjoin = 'LEFT JOIN {local_prequran_consumer} c ON c.id = tr.consumerid';
        if ((int)$consumercontext->consumerid > 0) {
            $consumerwhere = ' AND tr.consumerid = :consumerid';
            $params['consumerid'] = (int)$consumercontext->consumerid;
        }
    }
    $assignmentselect = pqtmrql_table_exists('local_prequran_teacher_student')
        ? ", COALESCE((SELECT MAX(ts.id)
                         FROM {local_prequran_teacher_student} ts
                        WHERE ts.teacherid = tr.teacherid
                          AND ts.studentid = tr.studentid
                          AND ts.status = 'active'), 0) AS assignmentid,
             COALESCE((SELECT MAX(ts.workspaceid)
                         FROM {local_prequran_teacher_student} ts
                        WHERE ts.teacherid = tr.teacherid
                          AND ts.studentid = tr.studentid
                          AND ts.status = 'active'), 0) AS assignmentworkspaceid"
        : ', 0 AS assignmentid, 0 AS assignmentworkspaceid';

    $requests = array_values($DB->get_records_sql(
        "SELECT tr.*, tp.teacher_display_name {$consumerselect} {$assignmentselect}
           FROM {local_prequran_teacher_request} tr
      LEFT JOIN {local_prequran_teacher_profile} tp ON tp.userid = tr.teacherid
           {$consumerjoin}
          WHERE (tr.parentid = :parentuserid OR (tr.teacherid = :teacheruserid AND tr.parentid > 0))
            {$consumerwhere}
       ORDER BY tr.timemodified DESC, tr.timecreated DESC",
        $params,
        0,
        100
    ));
}

// Decorate for the client — the same per-card computations the page performs
// inline while rendering (roles, names, pill bucket, contextual action links).
$out = [];
foreach ($requests as $request) {
    $status = (string)$request->request_status;
    $isrequestguardian = (int)$request->parentid === $userid;
    $isrequestteacher = (int)$request->teacherid === $userid;
    $teachername = trim((string)($request->teacher_display_name ?? '')) !== ''
        ? (string)$request->teacher_display_name
        : pqtmrql_user_name((int)$request->teacherid);
    $studentname = pqtmrql_user_name((int)$request->studentid);
    $requestcontextparams = $consumerparams;
    if ((string)($request->consumer_slug ?? '') !== '') {
        $requestcontextparams['consumer'] = (string)$request->consumer_slug;
    }
    if ((int)($request->assignmentworkspaceid ?? 0) > 0) {
        $requestcontextparams['workspaceid'] = (int)$request->assignmentworkspaceid;
    }
    $profileparams = $requestcontextparams + ['teacherid' => (int)$request->teacherid];
    $studentworkspaceurl = (int)($request->assignmentworkspaceid ?? 0) > 0 && (int)$request->studentid > 0
        ? (new moodle_url('/local/hubredirect/workspace_student.php', $requestcontextparams + ['studentid' => (int)$request->studentid]))->out(false)
        : '';
    $pill = in_array($status, ['assigned', 'matched', 'parent_confirmed'], true)
        ? 'ok'
        : (in_array($status, ['declined', 'closed'], true) ? 'bad' : 'warn');
    $out[] = [
        'id' => (int)$request->id,
        'status' => $status,
        'status_label' => pqtmrql_status_label($status),
        'pill' => $pill,
        'is_guardian' => $isrequestguardian,
        'is_teacher' => $isrequestteacher,
        'teacher_name' => $teachername,
        'student_name' => $studentname,
        'consumer_name' => (string)($request->consumer_name ?? ''),
        'timecreated' => (int)$request->timecreated,
        'timemodified' => (int)$request->timemodified,
        'message_short' => trim((string)$request->message) !== '' ? pqtmrql_short((string)$request->message, 260) : '',
        'notes_short' => trim((string)$request->admin_notes) !== '' ? pqtmrql_short((string)$request->admin_notes, 220) : '',
        'profileurl' => (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', $profileparams))->out(false),
        'messagesurl' => (int)$request->threadid > 0
            ? (new moodle_url('/local/hubredirect/communications.php', $requestcontextparams + ['threadid' => (int)$request->threadid, 'opencomm' => 'messages']))->out(false)
            : '',
        'calendarurl' => (int)($request->assignmentid ?? 0) > 0 && (int)$request->studentid > 0
            ? (new moodle_url('/local/hubredirect/live_calendar.php', $requestcontextparams + ['childid' => (int)$request->studentid]))->out(false)
            : '',
        'workspaceurl' => $studentworkspaceurl,
        // Same gate the page puts on the approve/decline form.
        'decisionable' => $isrequestguardian && in_array($status, ['selection_requested', 'academy_review', 'teacher_contacted'], true),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'brand' => $brandname,
    'user_fullname' => fullname($USER),
    'requests' => $out,
    'marketplaceurl' => (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false),
    'dashboardurl' => (new moodle_url((int)($consumercontext->workspaceid ?? 0) > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $consumerparams))->out(false),
    'legacyurl' => (new moodle_url('/local/hubredirect/teacher_marketplace_requests.php', $consumerparams))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
