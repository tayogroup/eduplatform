<?php
// Portal handler: course-catalog-browse (the workspace course-catalog browsing
// UI for students/parents/staff). Ported query-for-query from
// local_hubredirect/course_catalog_browse.php, which stays live in parallel.
// Runs from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, CORS headers sent.
// (course_catalog_browse.php has no pqh_live_security_audit calls — none to
// keep.)
//
//   GET  ?report=course-catalog-browse&token=…[&workspaceid=&consumer=&course=&available_only=]
//   POST ?report=course-catalog-browse&token=…  body: {"do":"<action>", …}
//        do = request_enrollment | cancel_request | request_drop
//        (the page's three POST branches VERBATIM; confirm_sesskey() dropped:
//        token auth replaces the session key)
//
// Entry access is the legacy page chain verbatim (require_login is replaced by
// the token — this page is NOT public): consumer context -> workspace resolve
// -> a workspace role is required, with the page's exact denial message.
// Enrolment/launch links keep legacy Moodle URLs — course_launch.php is
// deliberately unmigrated (it needs the Moodle session).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_catalog.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_catalog_browse_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- entry access check (verbatim logic from the page preamble) --------------
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || pqh_user_workspace_role($userid, $workspaceid) === '') {
    // The page renders pqh_access_denied(); the portal answers the same message as JSON.
    pqpd_fail(403, 'This account is not linked to a teaching workspace with course offerings.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$role = pqh_user_workspace_role($userid, $workspaceid);
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$canrequestenrollment = in_array($role, ['student', 'parent'], true);
$students = pqco_workspace_students_for_user($workspaceid, $userid);
$requeststudents = $canrequestenrollment ? $students : [];
$studentids = array_keys($requeststudents);
$ready = pqco_table_ready();
$catalog = pqh_course_catalog();
$financepolicyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
$financepolicy = pqfin_normalize_policy($financepolicyinfo['policy']);
$showpricing = pqfin_pricing_visible_for_role($financepolicy, $role);
$coursefilter = pqh_normalize_course_key(optional_param('course', '', PARAM_ALPHANUMEXT));
if ($coursefilter !== '' && !isset($catalog[$coursefilter])) {
    $coursefilter = '';
}
$availableonly = optional_param('available_only', 0, PARAM_BOOL);

// ---- writes (the page's POST branches VERBATIM, JSON body instead of form) ---
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!$ready) {
        // The page silently skips POST handling when tables are missing; the
        // portal surfaces it so the client is not left guessing.
        pqpd_fail(409, 'Course offering tables are not ready yet.');
    }
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid request body.');
    }
    // JSON-body equivalents of the page's optional_param reads.
    $bint = static function (string $name, int $default = 0) use ($body): int {
        return (int)clean_param($body[$name] ?? $default, PARAM_INT);
    };
    $balpha = static function (string $name, string $default = '') use ($body): string {
        return clean_param((string)($body[$name] ?? $default), PARAM_ALPHANUMEXT);
    };
    $btext = static function (string $name) use ($body): string {
        return clean_param((string)($body[$name] ?? ''), PARAM_TEXT);
    };

    $message = '';
    try {
        $action = $balpha('do');
        if (!in_array($action, ['request_enrollment', 'cancel_request', 'request_drop'], true)) {
            throw new invalid_parameter_exception('Choose a valid course catalog action.');
        }
        if (!$canrequestenrollment) {
            throw new invalid_parameter_exception('Only students and parents can request or cancel course enrollment from the catalog.');
        }
        if ($action === 'cancel_request') {
            $requestid = $bint('requestid');
            $request = $DB->get_record('local_prequran_course_enrol_req', [
                'id' => $requestid,
                'workspaceid' => $workspaceid,
            ], '*', IGNORE_MISSING);
            if (!$request || !isset($requeststudents[(int)$request->studentid])) {
                throw new invalid_parameter_exception('Choose a valid enrollment request linked to this account.');
            }
            if ((string)$request->status !== 'pending') {
                throw new invalid_parameter_exception('Only pending enrollment requests can be cancelled.');
            }
            $request->status = 'cancelled';
            $request->timemodified = time();
            $DB->update_record('local_prequran_course_enrol_req', $request);
            pqco_course_audit('enrollment_request_cancelled', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'previous_status' => 'pending',
                'status' => 'cancelled',
            ]);
            $message = 'Enrollment request cancelled.';
        } else if ($action === 'request_drop') {
            $requestid = $bint('requestid');
            $request = $DB->get_record_sql(
                "SELECT r.*, o.title AS offering_title, o.course_key
                   FROM {local_prequran_course_enrol_req} r
                   JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
                  WHERE r.id = :requestid
                    AND r.workspaceid = :workspaceid",
                ['requestid' => $requestid, 'workspaceid' => $workspaceid],
                IGNORE_MISSING
            );
            if (!$request || !isset($requeststudents[(int)$request->studentid])) {
                throw new invalid_parameter_exception('Choose a valid enrollment linked to this account.');
            }
            if ((string)$request->status !== 'enrolled') {
                throw new invalid_parameter_exception('Only active enrollments can request a drop.');
            }
            $previousstatus = (string)$request->status;
            $request->status = 'drop_requested';
            $request->request_notes = trim($btext('request_notes'));
            $request->timemodified = time();
            $DB->update_record('local_prequran_course_enrol_req', $request);
            pqco_course_audit('drop_requested', 'course_enrol_req', (int)$request->id, [
                'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$request->offeringid,
                'requestid' => (int)$request->id,
                'studentid' => (int)$request->studentid,
                'previous_status' => $previousstatus,
                'status' => 'drop_requested',
                'request_notes' => (string)$request->request_notes,
            ]);
            $student = core_user::get_user((int)$request->studentid);
            pqco_notify_workspace_admins(
                $workspaceid,
                'Course drop request received',
                ($student ? fullname($student) : 'Student #' . (int)$request->studentid) . ' requested to drop ' . (string)$request->offering_title . '.',
                new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['request_status' => 'drop_requested']),
                'Review drop request',
                'course_drop_requested',
                [
                    'consumerid' => (int)($request->consumerid ?? $consumercontext->consumerid ?? 0),
                    'workspaceid' => $workspaceid,
                    'offeringid' => (int)$request->offeringid,
                    'requestid' => (int)$request->id,
                    'studentid' => (int)$request->studentid,
                ]
            );
            $message = 'Drop request sent for admin review.';
        } else {
            $offeringid = $bint('offeringid');
            $studentid = $bint('studentid');
            if (!isset($requeststudents[$studentid])) {
                throw new invalid_parameter_exception('Choose a student linked to this workspace account.');
            }
            $offering = $DB->get_record('local_prequran_course_offering', [
                'id' => $offeringid,
                'workspaceid' => $workspaceid,
                'status' => 'published',
            ], '*', IGNORE_MISSING);
            if (!$offering) {
                throw new invalid_parameter_exception('Choose a published course offering in this workspace.');
            }
            if (!pqco_offering_accepts_requests($offering)) {
                throw new invalid_parameter_exception('Enrollment has closed for this course offering.');
            }
            $counts = pqco_offering_counts([$offeringid]);
            if (pqco_open_seats($offering, $counts) <= 0) {
                throw new invalid_parameter_exception('This course offering has no open seats.');
            }
            $now = time();
            $existing = $DB->get_record('local_prequran_course_enrol_req', [
                'offeringid' => $offeringid,
                'studentid' => $studentid,
            ], '*', IGNORE_MISSING);
            $record = (object)[
                'offeringid' => $offeringid,
                'consumerid' => (int)($consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'requesterid' => $userid,
                'requester_role' => $role,
                'status' => 'pending',
                'request_notes' => trim($btext('request_notes')),
                'admin_notes' => '',
                'approvedby' => 0,
                'approvedat' => 0,
                'moodleenrolledat' => 0,
                'droppedby' => 0,
                'droppedat' => 0,
                'timemodified' => $now,
            ];
            if ($existing) {
                if (in_array((string)$existing->status, ['pending', 'approved', 'enrolled', 'drop_requested'], true)) {
                    throw new invalid_parameter_exception('This student already has an active request for that offering.');
                }
                $record->id = (int)$existing->id;
                $record->timecreated = (int)$existing->timecreated;
                $DB->update_record('local_prequran_course_enrol_req', $record);
            } else {
                $record->timecreated = $now;
                $record->id = (int)$DB->insert_record('local_prequran_course_enrol_req', $record);
            }
            pqco_course_audit('enrollment_requested', 'course_enrol_req', (int)$record->id, [
                'consumerid' => (int)($consumercontext->consumerid ?? 0),
                'workspaceid' => $workspaceid,
                'offeringid' => $offeringid,
                'requestid' => (int)$record->id,
                'studentid' => $studentid,
                'status' => 'pending',
                'request_notes' => (string)$record->request_notes,
            ]);
            pqco_notify_new_enrollment_request($record, $offering, $workspaceid, $urlparams);
            $message = 'Enrollment request sent for admin approval.';
        }
    } catch (Throwable $e) {
        // The page renders the message inline; the portal returns it as JSON.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode(['ok' => true, 'message' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: everything the page renders ----------------------------------------
if (!$ready) {
    echo json_encode([
        'ok' => true, 'ready' => false,
        'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
        'message' => 'Course offering tables are not ready yet.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Offerings query, availability filter, request map — verbatim from the page.
[$statussql, $statusparams] = $DB->get_in_or_equal(pqco_learner_visible_statuses(), SQL_PARAMS_QM);
$where = ["workspaceid = ? AND status {$statussql}"];
$params = array_merge([$workspaceid], $statusparams);
if ($coursefilter !== '') {
    $where[] = 'course_key = ?';
    $params[] = $coursefilter;
}
$offerings = array_values($DB->get_records_select(
    'local_prequran_course_offering',
    implode(' AND ', $where),
    $params,
    'status ASC, startdate ASC, title ASC'
));
$offeringids = array_map(static fn($offering): int => (int)$offering->id, $offerings);
$counts = pqco_offering_counts($offeringids);
if ($availableonly) {
    $offerings = array_values(array_filter($offerings, static function($offering) use ($counts): bool {
        return pqco_offering_accepts_requests($offering) && pqco_open_seats($offering, $counts) > 0;
    }));
    $offeringids = array_map(static fn($offering): int => (int)$offering->id, $offerings);
}
$requestmap = pqco_request_map_for_students($offeringids, $studentids);
$myrequests = pqco_requests_for_students($workspaceid, $studentids);

// Decorate for the client (the same helper outputs the page computes while
// rendering each card, modal and status row).
foreach ($offerings as $offering) {
    $open = pqco_open_seats($offering, $counts);
    $offering->open_seats = $open;
    $offering->availability = pqco_offering_availability_label($offering, $open);
    $offering->can_request = pqco_offering_accepts_requests($offering) && $open > 0;
    $offering->track_title = (string)($catalog[(string)$offering->course_key]['title'] ?? (string)$offering->course_key);
    $offering->has_prerequisites = trim((string)$offering->prerequisites) !== '';
    $offering->summary_short = pqcbl_short_text((string)$offering->summary);
    // Pre-rendered detail HTML exactly as the page's modal renders it
    // (pqcbl_detail_html escapes with s(), so this is injection-safe).
    $offering->summary_html = pqcbl_detail_html((string)$offering->summary);
    $offering->syllabus_html = pqcbl_detail_html((string)$offering->syllabus);
    $offering->prerequisites_html = pqcbl_detail_html((string)$offering->prerequisites);
    $offering->pricing = pqfin_offering_pricing_summary($offering, $financepolicy);
}

foreach ($myrequests as $request) {
    $request->student_name = fullname($request);
    $request->account_label = pqh_account_no_label($request);
    $request->status_label = pqco_request_status_label((string)$request->status);
    $request->track_title = (string)($catalog[(string)$request->course_key]['title'] ?? (string)$request->course_key);
    $request->can_cancel = (string)$request->status === 'pending';
    $request->can_open = (string)$request->status === 'enrolled'
        && pqco_user_has_moodle_offering_access((int)$request->studentid, (string)$request->course_key);
    $request->can_request_drop = (string)$request->status === 'enrolled' && $request->can_open;
    $request->pending_sync = (string)$request->status === 'approved';
    // Deliberately a legacy Moodle URL: course_launch.php needs the Moodle session.
    $request->launch_url = $request->can_open
        ? $CFG->wwwroot . '/local/hubredirect/course_launch.php?course=' . rawurlencode((string)$request->course_key) . '&studentid=' . (int)$request->studentid
        : '';
}

$studentsout = [];
foreach ($requeststudents as $student) {
    $studentsout[] = [
        'id' => (int)$student->id,
        'name' => fullname($student),
        'account_label' => pqh_account_no_label($student),
    ];
}

// Request map keyed "offeringid:studentid" -> status (drives the page's
// disabled-option and hasrequestable logic on the client).
$requestmapout = [];
foreach ($requestmap as $key => $request) {
    $requestmapout[$key] = [
        'status' => (string)$request->status,
        'status_label' => pqco_request_status_label((string)$request->status),
    ];
}

$catalogout = [];
foreach ($catalog as $key => $course) {
    $catalogout[] = ['key' => (string)$key, 'title' => (string)($course['title'] ?? $key)];
}

$legacyparams = pqcbl_filter_url_params($urlparams, $coursefilter, (bool)$availableonly);

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'consumer' => [
        'slug' => (string)($consumercontext->consumerslug ?? ''),
        'name' => (string)($consumercontext->consumername ?? ''),
    ],
    'role' => $role,
    'canmanage' => $canmanage,
    'canrequestenrollment' => $canrequestenrollment,
    'showpricing' => $showpricing,
    'catalog' => $catalogout,
    'filters' => ['course' => $coursefilter, 'available_only' => (bool)$availableonly],
    'offerings' => $offerings,
    'myrequests' => array_values($myrequests),
    'requeststudents' => $studentsout,
    'requestmap' => $requestmapout,
    // Legacy Moodle links (unmigrated pages keep their Moodle URLs).
    'links' => [
        'manage_offerings' => $canmanage ? $CFG->wwwroot . '/local/hubredirect/course_offerings.php' . ($urlparams ? '?' . http_build_query($urlparams) : '') : '',
        'workspace_dashboard' => $CFG->wwwroot . '/local/hubredirect/workspace_dashboard.php' . ($urlparams ? '?' . http_build_query($urlparams) : ''),
        'legacy_page' => $CFG->wwwroot . '/local/hubredirect/course_catalog_browse.php' . ($legacyparams ? '?' . http_build_query($legacyparams) : ''),
    ],
], JSON_UNESCAPED_SLASHES);
exit;
