<?php
// Portal data endpoint (hubredirect Phase C) — token-gated JSON for portal pages
// hosted on Bunny. First report: live-reports (ported query-for-query from
// local_hubredirect/live_reports.php, which stays live in parallel).
//
//   GET portal_data.php?report=summary&token=…&from=YYYY-MM-DD&to=…&teacherid=&studentid=&status=&seriesid=
//   GET portal_data.php?report=attendance&token=…&…same filters…&drillsessionid=&drillteacherid=
//
// Auth: a portal-scoped launch token (claims.course = "portal:live-reports")
// minted by portal_launch.php AFTER the same pqh_can_manage_academy_operations
// check the PHP page enforces. Query-string token keeps every request a simple
// CORS request (no preflight).

define('NO_MOODLE_COOKIES', true);
require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($allowed = pqpg_allowed_origin($origin)) {
    header('Access-Control-Allow-Origin: ' . $allowed);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function pqpd_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

$token = (string)($_GET['token'] ?? '');
if ($token === '' && preg_match('/Bearer\s+(\S+)/i', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''), $m)) {
    $token = $m[1];
}
if ($token === '') {
    pqpd_fail(401, 'Missing portal token.');
}
$claims = pqpg_verify_token($token);
if ($claims === null) {
    pqpd_fail(401, 'Invalid or expired portal token.');
}
$scope = preg_replace('/^portal:/', '', (string)($claims['course'] ?? ''));
$report = optional_param('report', 'summary', PARAM_ALPHANUMEXT);
// Each portal token opens exactly one report family.
$reportscopes = ['summary' => 'live-reports', 'attendance' => 'live-reports', 'managed' => 'managed-reports', 'dashboard' => 'dashboard', 'intake' => 'intake-requests', 'workspace' => 'workspace-reports', 'schedule' => 'live-schedule'];
if (!isset($reportscopes[$report]) || $scope !== $reportscopes[$report]) {
    pqpd_fail(403, 'This token does not grant access to that report.');
}

// Become the token's user (as the WS server does): the report libraries read
// the global $USER for workspace/role checks, and with NO_MOODLE_COOKIES that
// would otherwise be nobody — silently emptying every scoped list.
$tokenuserrec = core_user::get_user((int)($claims['sub'] ?? 0));
if (!$tokenuserrec || !empty($tokenuserrec->deleted) || !empty($tokenuserrec->suspended)) {
    pqpd_fail(401, 'Launch-token user is not available.');
}
\core\session\manager::set_user($tokenuserrec);

// API endpoints must answer JSON even when something breaks — surface the real
// error instead of Moodle's HTML error page.
set_exception_handler(function (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => get_class($e) . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine()]);
    exit;
});

// ---- report: schedule (live-class schedule; read-only) ------------------------
// Ported from local_hubredirect/live_schedule.php via live_schedulelib
// (pqlschl_*). Same mode resolution: teacher schedule (self, or admin viewing
// any teacher), a child's schedule (parent/managed-student), or a parent's
// child chooser. Join states + status labels computed server-side.

if ($report === 'schedule') {
    global $CFG, $DB, $USER;
    require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
    require_once($CFG->dirroot . '/local/hubredirect/live_schedulelib.php');
    $userid = (int)($claims['sub'] ?? 0);

    $childid = optional_param('childid', 0, PARAM_INT);
    $requestedteacherid = optional_param('teacherid', 0, PARAM_INT);

    $modechildren = [];
    $teacherid = 0;
    if ($requestedteacherid > 0) {
        if (!pqlschl_has_teacher_role($requestedteacherid)) {
            pqpd_fail(404, 'The requested teacher schedule is not available.');
        }
        if (!is_siteadmin($USER) && $userid !== $requestedteacherid) {
            pqpd_fail(403, 'You cannot view this teacher live class schedule.');
        }
        $teacherid = $requestedteacherid;
        $childid = 0;
    } else if ($childid > 0 && pqlschl_has_teacher_role($childid)) {
        if (!is_siteadmin($USER) && $userid !== $childid) {
            pqpd_fail(403, 'You cannot view this teacher live class schedule.');
        }
        $teacherid = $childid;
        $childid = 0;
    } else if ($childid <= 0) {
        if (pqlschl_has_teacher_role($userid)) {
            $teacherid = $userid;
        } else if (pqlschl_is_managed_student($userid)) {
            $childid = $userid;
        } else {
            $modechildren = pqlschl_parent_children($userid);
        }
        if (count($modechildren) === 1) {
            $childid = (int)$modechildren[0]['studentid'];
        }
    }
    if ($childid > 0 && !pqlschl_user_can_access_child($userid, $childid)) {
        pqpd_fail(403, 'You cannot view this live class schedule.');
    }

    $isteacher = $teacherid > 0;
    $subject = $isteacher ? core_user::get_user($teacherid) : ($childid > 0 ? core_user::get_user($childid) : null);
    $subjectname = $subject ? fullname($subject) : ($isteacher ? 'Teacher ' . $teacherid : ($childid > 0 ? 'Student ' . $childid : ''));
    $now = time();
    $upcoming = $isteacher
        ? pqlschl_teacher_sessions($teacherid, $now - HOURSECS, $now + (30 * DAYSECS), 30)
        : ($childid > 0 ? pqlschl_sessions($childid, $now - HOURSECS, $now + (30 * DAYSECS), 30) : []);
    $recent = $isteacher
        ? pqlschl_teacher_sessions($teacherid, $now - (30 * DAYSECS), $now, 20)
        : ($childid > 0 ? pqlschl_sessions($childid, $now - (30 * DAYSECS), $now, 20) : []);
    usort($recent, function ($a, $b) {
        return (int)$b->scheduled_start <=> (int)$a->scheduled_start;
    });

    $decorate = function ($session) use ($isteacher) {
        [$joinstate, $joinlabel] = pqlschl_join_state($session);
        $session->join_state = $joinstate;
        $session->join_label = $joinlabel;
        $session->status_label = pqlschl_recent_status_label($session, $isteacher);
        $session->start_label = pqlschl_format_session_datetime($session, (int)$session->scheduled_start);
        $session->end_label = pqlschl_format_session_time($session, (int)$session->scheduled_end);
        return $session;
    };
    $upcoming = array_map($decorate, $upcoming);
    $recent = array_map($decorate, $recent);

    $nameids = [];
    foreach (array_merge($upcoming, $recent) as $s) {
        $nameids[] = (int)($s->teacherid ?? 0);
    }

    echo json_encode([
        'ok' => true, 'ready' => true,
        'mode' => $isteacher ? 'teacher' : ($childid > 0 ? 'child' : 'chooser'),
        'subject' => ['id' => $isteacher ? $teacherid : $childid, 'name' => $subjectname],
        'children' => $modechildren,
        'upcoming' => array_values($upcoming), 'recent' => array_values($recent),
        'names' => pqpd_names($nameids),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- report: workspace (workspace reports; read-only) ------------------------
// Ported from local_hubredirect/workspace_reports.php via workspace_reportslib
// (pqwrl_*). The lib's functions read page globals — this handler runs at file
// top level, so plain assignments below satisfy that contract.

if ($report === 'workspace') {
    global $CFG, $DB;
    require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
    require_once($CFG->dirroot . '/local/hubredirect/workspace_reportslib.php');
    $userid = (int)($claims['sub'] ?? 0);

    $requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
    $workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
    if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
        pqpd_fail(403, 'Only workspace teaching and admin users can view workspace reports.');
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    if (!$workspace) {
        pqpd_fail(404, 'Choose a valid workspace before opening workspace reports.');
    }
    $canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);

    // The globals the lib functions expect (same names/semantics as the page).
    $baseurlparams = [];
    $fromdate = optional_param('fromdate', '', PARAM_TEXT);
    $todate = optional_param('todate', '', PARAM_TEXT);
    $teacherid = optional_param('teacherid', 0, PARAM_INT);
    $studentid = optional_param('studentid', 0, PARAM_INT);
    $statusfilter = optional_param('status', '', PARAM_ALPHANUMEXT);
    $fromtime = pqwrl_parse_date_start($fromdate);
    $totime = pqwrl_parse_date_end($todate);
    $validstatuses = ['', 'present', 'late', 'absent', 'scheduled', 'started', 'completed', 'cancelled', 'assigned', 'in_progress', 'reviewed'];
    if (!in_array($statusfilter, $validstatuses, true)) {
        $statusfilter = '';
    }

    $teachers = pqwrl_user_options($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
    $students = pqwrl_user_options($workspaceid, ['student']);
    $studentids = pqwrl_workspace_student_ids($workspaceid);
    $roles = pqwrl_role_counts($workspaceid);
    $sessions = pqwrl_session_status_counts();
    $attendance = pqwrl_attendance_counts();
    $materialworkflow = pqwrl_material_workflow_counts();
    $teacherdrilldown = pqwrl_teacher_drilldown($workspaceid);
    $studentdrilldown = pqwrl_student_drilldown($workspaceid);
    $recentmaterials = pqwrl_recent_materials();
    $recentnotes = pqwrl_recent_notes();
    $recordings = pqwrl_recordings();
    $attendancechart = pqwrl_attendance_trend();
    $materialchart = pqwrl_material_completion_trend();
    $teacherworkloadchart = pqwrl_teacher_workload_chart($teacherdrilldown);
    $studenttimeline = pqwrl_student_progress_timeline();

    $attendancetotal = array_sum($attendance);
    $attendancepresent = 0;
    foreach (['present', 'late', 'attended'] as $st) {
        $attendancepresent += (int)($attendance[$st] ?? 0);
    }
    $materialtotal = array_sum($materialworkflow);
    $materialcomplete = (int)($materialworkflow['completed'] ?? 0) + (int)($materialworkflow['reviewed'] ?? 0);
    $parentnotes = 0;
    foreach ($studentdrilldown as $row) {
        $parentnotes += (int)$row->parentnotecount;
    }
    $metrics = [
        'students' => count($studentids),
        'teachers' => ($roles['teacher'] ?? 0) + ($roles['assistant_teacher'] ?? 0),
        'sessions' => array_sum($sessions),
        'attendance_rate' => pqwrl_percent($attendancepresent, $attendancetotal),
        'material_completion_rate' => pqwrl_percent($materialcomplete, $materialtotal),
        'reviewed_items' => (int)($materialworkflow['reviewed'] ?? 0),
        'parent_visible_notes' => $parentnotes,
        'materials' => pqwrl_count('local_prequran_workspace_material', ['workspaceid' => $workspaceid, 'status' => 'active']),
        'recordings' => count($recordings),
    ];

    echo json_encode([
        'ok' => true, 'ready' => true,
        'workspace' => ['id' => $workspaceid, 'name' => (string)($workspace->name ?? ('Workspace ' . $workspaceid)), 'canmanage' => (bool)$canmanage],
        'filters' => ['fromdate' => $fromdate, 'todate' => $todate, 'teacherid' => $teacherid, 'studentid' => $studentid, 'status' => $statusfilter],
        'options' => ['teachers' => $teachers, 'students' => $students],
        'metrics' => $metrics,
        'sessions' => $sessions, 'attendance' => $attendance, 'materialworkflow' => $materialworkflow,
        'teacherdrilldown' => $teacherdrilldown, 'studentdrilldown' => $studentdrilldown,
        'recentmaterials' => $recentmaterials, 'recentnotes' => $recentnotes, 'recordings' => $recordings,
        'charts' => ['attendance' => $attendancechart, 'materials' => $materialchart, 'teacherworkload' => $teacherworkloadchart],
        'timeline' => $studenttimeline,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- report: intake (public intake request queue; FIRST portal write) --------
// Ported from local_hubredirect/intake_requests.php. GET = status counts + the
// scoped request list. POST do=save_review = the page's save_review action
// verbatim (status/matched group/notes + reviewer stamp + audit row). The
// legacy load_intake transfer stays on the Moodle page (it hands off via
// $SESSION into student_intake.php).

if ($report === 'intake') {
    global $CFG, $DB, $USER;
    require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
    $userid = (int)($claims['sub'] ?? 0);
    if (!pqh_can_manage_academy_operations($userid)) {
        pqpd_fail(403, 'Academy operations users only.');
    }
    if (!$DB->get_manager()->table_exists('local_prequran_intake_request')) {
        echo json_encode(['ok' => true, 'ready' => false]);
        exit;
    }
    $consumercontext = pqh_requested_consumer_context();
    $statusoptions = ['new', 'reviewing', 'needs_alternative', 'rejected', 'transferred'];

    $intakehasfield = function (string $column) use ($DB): bool {
        try {
            return array_key_exists($column, $DB->get_columns('local_prequran_intake_request'));
        } catch (Throwable $e) {
            return false;
        }
    };
    // Mirrors pqireq_request_in_consumer_scope() on the legacy page.
    $inscope = function (stdClass $request) use ($consumercontext, $intakehasfield): bool {
        if (pqh_context_is_platform_foundation($consumercontext)) {
            return true;
        }
        if ($intakehasfield('consumerid') && (int)($consumercontext->consumerid ?? 0) > 0) {
            return (int)($request->consumerid ?? 0) === (int)$consumercontext->consumerid;
        }
        $workspaceid = (int)($request->workspaceid ?? 0);
        return $workspaceid > 0 && pqh_consumer_context_allows_workspace($consumercontext, $workspaceid);
    };

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true);
        if (!is_array($body) || (string)($body['do'] ?? '') !== 'save_review') {
            pqpd_fail(400, 'Unknown intake action.');
        }
        $requestid = (int)($body['requestid'] ?? 0);
        $status = (string)($body['status'] ?? '');
        if (!in_array($status, $statusoptions, true)) {
            pqpd_fail(400, 'Choose a valid public intake request status.');
        }
        $request = $requestid > 0 ? $DB->get_record('local_prequran_intake_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
        if (!$request) {
            pqpd_fail(404, 'Choose a valid public intake request before saving.');
        }
        if (!$inscope($request)) {
            pqpd_fail(403, 'This public intake request does not belong to the active consumer.');
        }
        $previousstatus = (string)$request->status;
        $request->status = $status;
        $request->matched_groupid = (int)($body['matched_groupid'] ?? 0);
        $request->admin_notes = trim((string)($body['admin_notes'] ?? ''));
        $request->reviewedby = $userid;
        $request->reviewedat = time();
        $request->timemodified = time();
        $DB->update_record('local_prequran_intake_request', $request);
        if ($DB->get_manager()->table_exists('local_prequran_live_audit')) {
            $DB->insert_record('local_prequran_live_audit', (object)[
                'sessionid' => 0,
                'actorid' => $userid,
                'action' => 'public_intake_review_saved',
                'targettype' => 'intake_request',
                'targetid' => $requestid,
                'details' => json_encode([
                    'previous_status' => $previousstatus,
                    'status' => (string)$request->status,
                    'matched_groupid' => (int)$request->matched_groupid,
                    'admin_notes' => (string)$request->admin_notes,
                    'via' => 'portal',
                ]),
                'timecreated' => time(),
            ]);
        }
        echo json_encode(['ok' => true, 'message' => 'Request #' . $requestid . ' review saved.', 'status' => $status]);
        exit;
    }

    // GET: status counts + scoped list (ported filters + ordering).
    $filterstatus = optional_param('status', '', PARAM_ALPHANUMEXT);
    if ($filterstatus !== '' && !in_array($filterstatus, $statusoptions, true)) {
        $filterstatus = '';
    }
    $filterquery = trim(optional_param('q', '', PARAM_TEXT));

    $whereparts = [];
    $scopeparams = [];
    if (!pqh_context_is_platform_foundation($consumercontext)) {
        if ($intakehasfield('consumerid') && (int)($consumercontext->consumerid ?? 0) > 0) {
            $whereparts[] = 'consumerid = :consumerid';
            $scopeparams['consumerid'] = (int)$consumercontext->consumerid;
        } else {
            $workspaceids = pqh_consumer_context_workspace_ids($consumercontext);
            if ($workspaceids && $intakehasfield('workspaceid')) {
                [$insql, $scopeparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'scopeworkspace');
                $whereparts[] = "workspaceid {$insql}";
            } else {
                $whereparts[] = '1 = 0';
            }
        }
    }
    $scopewhere = $whereparts ? 'WHERE ' . implode(' AND ', $whereparts) : '';
    $statuscounts = array_fill_keys($statusoptions, 0);
    foreach ($DB->get_records_sql("SELECT status, COUNT(1) AS total FROM {local_prequran_intake_request} {$scopewhere} GROUP BY status", $scopeparams) as $row) {
        $statuscounts[(string)$row->status] = (int)$row->total;
    }

    $requestwhereparts = $whereparts;
    $requestparams = $scopeparams;
    if ($filterstatus !== '') {
        $requestwhereparts[] = 'status = :filterstatus';
        $requestparams['filterstatus'] = $filterstatus;
    }
    if ($filterquery !== '') {
        $requestwhereparts[] = $DB->sql_like(
            $DB->sql_concat("' '", 'student_display_name', "' '", 'student_firstname', "' '", 'student_lastname', "' '", 'student_email', "' '", 'parent_name', "' '", 'parent_email', "' '", 'parent_phone', "' '", 'current_level', "' '", 'admin_notes'),
            ':filterquery', false
        );
        $requestparams['filterquery'] = '%' . $DB->sql_like_escape($filterquery) . '%';
    }
    $requestwhere = $requestwhereparts ? 'WHERE ' . implode(' AND ', $requestwhereparts) : '';
    $requests = array_values($DB->get_records_sql(
        "SELECT * FROM {local_prequran_intake_request} {$requestwhere}
      ORDER BY CASE status WHEN 'new' THEN 1 WHEN 'reviewing' THEN 2 WHEN 'needs_alternative' THEN 3 WHEN 'transferred' THEN 4 ELSE 5 END,
               timecreated DESC",
        $requestparams, 0, 50
    ));

    echo json_encode([
        'ok' => true, 'ready' => true,
        'filters' => ['status' => $filterstatus, 'q' => $filterquery],
        'statusoptions' => $statusoptions, 'statuscounts' => $statuscounts,
        'requests' => $requests,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- report: dashboard (role-aware portal hub) ------------------------------
// v1 of the dashboard.php migration: role + per-student rollups (reusing the
// managed-reports lib), upcoming live sessions, and (admin) platform counts.
// The legacy page's two writes are deferred: the QA step-config form is behind
// a hardcoded-false flag, and the widget-prefs save is cosmetic.

if ($report === 'dashboard') {
    global $CFG, $DB;
    require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
    require_once($CFG->dirroot . '/local/hubredirect/managed_reportslib.php');
    require_once($CFG->dirroot . '/local/hubredirect/dashboard_reslib.php');
    $userid = (int)($claims['sub'] ?? 0);
    // Display role with full fidelity (admin/school_principal/sqa_tester/
    // teacher/parent/referrer/student); DATA scoping still uses the managed-
    // reports role model, which folds principal into admin-style access.
    $role = pqh_user_role($userid);
    $datarole = pqmrl_role($userid);
    $students = pqmrl_allowed_students($datarole, $userid);
    $rows = pqmrl_report_rows($students, 'production', '', '', '', '');

    // Teacher live overview (the dashboard.php panels): today, upcoming,
    // needs-review, follow-ups, coaching, improvement plans.
    $teacheroverview = null;
    if ($role === 'teacher' || pqh_has_teacher_role($userid)) {
        $teacheroverview = pqh_teacher_live_overview($userid);
    }

    // Upcoming live sessions (next 7 days) for the students in scope.
    $upcoming = [];
    $ids = array_map(static function (array $s): int {
        return (int)$s['studentid'];
    }, $students);
    if ($ids && pqmrl_table_exists('local_prequran_live_session') && pqmrl_table_exists('local_prequran_live_participant')) {
        [$insql, $inparams] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'updash');
        $upcoming = array_values($DB->get_records_sql(
            "SELECT s.id, s.title, s.teacherid, s.scheduled_start, s.scheduled_end, s.status, p.studentid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
              WHERE p.studentid {$insql}
                AND s.scheduled_start >= :nowtime AND s.scheduled_start <= :weektime
                AND s.status <> 'cancelled'
           ORDER BY s.scheduled_start ASC",
            $inparams + ['nowtime' => time(), 'weektime' => time() + (7 * DAYSECS)], 0, 30
        ));
    }
    $nameids = $ids;
    foreach ($upcoming as $u) {
        $nameids[] = (int)$u->teacherid;
    }

    // Platform counts (admin only) — ported from dashboard.php's overview panel.
    $platform = null;
    if ($role === 'admin') {
        $platform = [];
        $platform['consumers'] = pqmrl_table_exists('local_prequran_consumer') ? (int)$DB->count_records('local_prequran_consumer') : 0;
        $platform['workspaces'] = pqmrl_table_exists('local_prequran_workspace') ? (int)$DB->count_records('local_prequran_workspace') : 0;
        $platform['activestudents'] = 0;
        if (pqmrl_table_exists('local_prequran_workspace_member') && pqmrl_table_has_field('local_prequran_workspace_member', 'workspace_role')) {
            $platform['activestudents'] = (int)$DB->count_records('local_prequran_workspace_member', ['workspace_role' => 'student', 'status' => 'active']);
        }
        $platform['teachers'] = pqmrl_table_exists('local_prequran_teacher_profile') ? (int)$DB->count_records('local_prequran_teacher_profile') : 0;
        $platform['sessionstoday'] = 0;
        $platform['sessionsweek'] = 0;
        if (pqmrl_table_exists('local_prequran_live_session')) {
            $daystart = usergetmidnight(time());
            $platform['sessionstoday'] = (int)$DB->count_records_select('local_prequran_live_session',
                'scheduled_start >= :s AND scheduled_start < :e', ['s' => $daystart, 'e' => $daystart + DAYSECS]);
            $platform['sessionsweek'] = (int)$DB->count_records_select('local_prequran_live_session',
                'scheduled_start >= :s AND scheduled_start < :e', ['s' => time(), 'e' => time() + (7 * DAYSECS)]);
        }
    }

    if ($teacheroverview) {
        foreach (array_merge($teacheroverview['today'] ?? [], $teacheroverview['upcoming'] ?? []) as $s) {
            $nameids[] = (int)($s->teacherid ?? 0);
        }
        foreach ($teacheroverview['followups'] ?? [] as $f) {
            $nameids[] = (int)($f->studentid ?? 0);
        }
    }

    echo json_encode([
        'ok' => true, 'ready' => true, 'role' => $role,
        'students' => $students, 'rows' => $rows, 'upcoming' => $upcoming,
        'platform' => $platform, 'teacher' => $teacheroverview,
        'names' => pqpd_names($nameids),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- report: managed (managed-student reports, role-scoped) -----------------

if ($report === 'managed') {
    global $CFG;
    require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
    require_once($CFG->dirroot . '/local/hubredirect/managed_reportslib.php');
    $userid = (int)($claims['sub'] ?? 0);
    $role = pqmrl_role($userid);
    $students = pqmrl_allowed_students($role, $userid);
    $allowedids = array_map(static function (array $student): int {
        return (int)$student['studentid'];
    }, $students);
    $onestudent = optional_param('studentid', 0, PARAM_INT);
    if ($onestudent > 0 && !in_array($onestudent, $allowedids, true)) {
        pqpd_fail(403, 'This account cannot view reports for that student.');
    }
    $environment = strtolower(trim(optional_param('pq_env', 'production', PARAM_ALPHANUMEXT)));
    if (!in_array($environment, ['production', 'staging', 'integration'], true)) {
        $environment = 'production';
    }
    $lessonid = trim(optional_param('lessonid', '', PARAM_ALPHANUMEXT));
    $unitid = trim(optional_param('unitid', '', PARAM_ALPHANUMEXT));
    $mstatus = strtolower(trim(optional_param('status', '', PARAM_ALPHANUMEXT)));
    $statusmap = ['notstarted' => 'not_started', 'inprogress' => 'in_progress', 'all' => ''];
    $mstatus = $statusmap[$mstatus] ?? $mstatus;
    if (!in_array($mstatus, ['', 'not_started', 'in_progress', 'completed'], true)) {
        $mstatus = '';
    }
    $search = optional_param('q', '', PARAM_TEXT);
    $scoped = $onestudent > 0 ? array_values(array_filter($students, static function (array $student) use ($onestudent): bool {
        return (int)$student['studentid'] === $onestudent;
    })) : $students;
    $rows = pqmrl_report_rows($scoped, $environment, $lessonid, $unitid, $mstatus, $search);
    $metrics = ['students' => count($rows), 'units' => 0, 'completed' => 0, 'recordings' => 0, 'quiz' => 0];
    foreach ($rows as $row) {
        $metrics['units'] += (int)$row['units'];
        $metrics['completed'] += (int)$row['completed'];
        $metrics['recordings'] += (int)$row['speak'] + (int)$row['submit'];
        $metrics['quiz'] += (int)$row['quiz'];
    }
    echo json_encode([
        'ok' => true, 'ready' => true, 'role' => $role,
        'students' => $students,
        'filters' => ['pq_env' => $environment, 'lessonid' => $lessonid, 'unitid' => $unitid, 'status' => $mstatus, 'q' => $search, 'studentid' => $onestudent],
        'metrics' => $metrics, 'rows' => $rows,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- helpers ported from live_reports.php ----------------------------------

function pqpd_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpd_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqpd_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqpd_ready(): bool {
    return pqpd_table_exists('local_prequran_live_session')
        && pqpd_table_exists('local_prequran_live_participant')
        && pqpd_table_exists('local_prequran_live_attendance')
        && pqpd_table_exists('local_prequran_live_note')
        && pqpd_table_exists('local_prequran_live_recording')
        && pqpd_table_exists('local_prequran_live_audit');
}

function pqpd_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqpd_names(array $userids): array {
    global $DB;
    $userids = array_values(array_unique(array_filter(array_map('intval', $userids))));
    if (!$userids) {
        return [];
    }
    $users = $DB->get_records_list('user', 'id', $userids, '', 'id,firstname,lastname,firstnamephonetic,lastnamephonetic,middlename,alternatename');
    $names = [];
    foreach ($users as $user) {
        $names[(int)$user->id] = fullname($user);
    }
    return $names; // int-keyed → JSON-encodes as an object map
}

// ---- live-reports filters (identical semantics to the PHP page) --------------

$now = time();
$defaultfrom = usergetmidnight($now - (30 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqpd_clean_date(optional_param('from', '', PARAM_TEXT), $defaultfrom);
$to = pqpd_clean_date(optional_param('to', '', PARAM_TEXT), $defaultto - DAYSECS + 1) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$status = optional_param('status', '', PARAM_ALPHANUMEXT);
$seriesid = optional_param('seriesid', 0, PARAM_INT);

$where = ["s.scheduled_start >= :fromtime", "s.scheduled_start <= :totime"];
$params = ['fromtime' => $from, 'totime' => $to];
if ($teacherid > 0) {
    $where[] = "s.teacherid = :teacherid";
    $params['teacherid'] = $teacherid;
}
if ($status !== '') {
    $where[] = "s.status = :status";
    $params['status'] = $status;
}
if ($seriesid > 0 && pqpd_column_exists('local_prequran_live_session', 'seriesid')) {
    $where[] = "s.seriesid = :seriesid";
    $params['seriesid'] = $seriesid;
}
if ($studentid > 0) {
    $where[] = "EXISTS (SELECT 1 FROM {local_prequran_live_participant} sp
        WHERE sp.sessionid = s.id AND sp.role = 'student' AND sp.status = 'active' AND sp.studentid = :studentid)";
    $params['studentid'] = $studentid;
}
$wheresql = implode(' AND ', $where);

if (!pqpd_ready()) {
    echo json_encode(['ok' => true, 'ready' => false]);
    exit;
}

// ---- report: attendance (also the drill view) --------------------------------

if ($report === 'attendance') {
    $drillsessionid = optional_param('drillsessionid', 0, PARAM_INT);
    $drillteacherid = optional_param('drillteacherid', 0, PARAM_INT);
    if ($drillsessionid > 0) {
        $where[] = "s.id = :drillsessionid";
        $params['drillsessionid'] = $drillsessionid;
    }
    if ($drillteacherid > 0) {
        $where[] = "s.teacherid = :drillteacherid";
        $params['drillteacherid'] = $drillteacherid;
    }
    $rows = array_values($DB->get_records_sql(
        "SELECT p.id AS participantid, s.id AS sessionid, s.title, s.teacherid, s.scheduled_start,
                p.studentid, a.attendance_status, a.participation_status, a.technical_issue, a.join_time
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
          WHERE " . implode(' AND ', $where) . "
       ORDER BY s.scheduled_start DESC, s.id DESC, p.studentid ASC",
        $params, 0, 5000
    ));
    $ids = [];
    foreach ($rows as $row) {
        $ids[] = (int)$row->teacherid;
        $ids[] = (int)$row->studentid;
    }
    echo json_encode(['ok' => true, 'ready' => true, 'rows' => $rows, 'names' => pqpd_names($ids)], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- report: summary (default) ----------------------------------------------

$qualityready = pqpd_column_exists('local_prequran_live_session', 'qa_status');
$coachingready = pqpd_column_exists('local_prequran_live_session', 'qa_coaching_status');

$sessionselect = "SELECT s.*,
        (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.attendance_status = 'present') AS present_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.attendance_status = 'late') AS late_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.attendance_status = 'absent') AS absent_count,
        (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id AND a.technical_issue = 1) AS technical_issue_count,
        (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1) AS visible_summary_count,
        (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(COALESCE(n.homework, '')) <> '') AS homework_count,
        (SELECT COUNT(1) FROM {local_prequran_live_recording} r WHERE r.sessionid = s.id AND r.status = 'available') AS recording_count,
        (SELECT COUNT(1) FROM {local_prequran_live_recording} r WHERE r.sessionid = s.id AND r.status = 'available' AND r.visible_to_parent = 1) AS visible_recording_count";

$sessions = array_values($DB->get_records_sql(
    "{$sessionselect} FROM {local_prequran_live_session} s WHERE {$wheresql}
     ORDER BY s.scheduled_start DESC, s.id DESC",
    $params, 0, 200
));

$metrics = [
    'sessions' => 0, 'completed' => 0, 'cancelled' => 0, 'students' => 0, 'attendance' => 0,
    'summaries' => 0, 'recordings' => 0, 'conflicts' => 0, 'notifications' => 0,
    'missingtargets' => 0, 'homework' => 0, 'qareview' => 0, 'qaissues' => 0,
    'coaching' => 0, 'coachingoverdue' => 0,
];
foreach ($sessions as $session) {
    $metrics['sessions']++;
    $metrics['completed'] += (string)$session->status === 'completed' ? 1 : 0;
    $metrics['cancelled'] += (string)$session->status === 'cancelled' ? 1 : 0;
    $metrics['students'] += (int)$session->student_count;
    $metrics['attendance'] += (int)$session->attendance_count;
    $metrics['summaries'] += (int)$session->visible_summary_count;
    $metrics['recordings'] += (int)$session->visible_recording_count;
    $metrics['missingtargets'] += trim((string)$session->lessonid) === '' || trim((string)$session->unitid) === '' ? 1 : 0;
    $metrics['homework'] += (int)$session->homework_count;
    if ($qualityready) {
        $qastatus = (string)($session->qa_status ?? 'not_reviewed');
        $metrics['qareview'] += in_array($qastatus, ['not_reviewed', 'needs_coaching', 'serious_issue'], true) ? 1 : 0;
        $metrics['qaissues'] += in_array($qastatus, ['needs_coaching', 'serious_issue'], true) ? 1 : 0;
    }
    if ($coachingready) {
        $coachingstatus = (string)($session->qa_coaching_status ?? 'none');
        $iscoaching = in_array($coachingstatus, ['assigned', 'acknowledged'], true);
        $metrics['coaching'] += $iscoaching ? 1 : 0;
        $metrics['coachingoverdue'] += $iscoaching && !empty($session->qa_coaching_due_date) && (int)$session->qa_coaching_due_date < $now ? 1 : 0;
    }
}
$metrics['conflicts'] = (int)$DB->count_records_sql(
    "SELECT COUNT(1) FROM {local_prequran_live_audit}
      WHERE action IN ('schedule_conflict_blocked', 'schedule_conflict_override')
        AND timecreated >= :fromtime AND timecreated <= :totime",
    ['fromtime' => $from, 'totime' => $to]
);
$metrics['notifications'] = (int)$DB->count_records_sql(
    "SELECT COUNT(1) FROM {local_prequran_live_audit}
      WHERE action IN ('notification_sent', 'notification_failed', 'notification_skipped', 'live_reminder_24h_sent', 'live_reminder_1h_sent')
        AND timecreated >= :fromtime AND timecreated <= :totime",
    ['fromtime' => $from, 'totime' => $to]
);

$teachers = array_values($DB->get_records_sql(
    "SELECT s.teacherid,
            COUNT(1) AS session_count,
            SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
            SUM((SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')) AS student_total,
            SUM((SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1)) AS summary_total
       FROM {local_prequran_live_session} s
      WHERE {$wheresql}
   GROUP BY s.teacherid
   ORDER BY session_count DESC, s.teacherid ASC",
    $params, 0, 50
));

$audit = array_values($DB->get_records_sql(
    "SELECT * FROM {local_prequran_live_audit}
      WHERE action IN (
          'schedule_conflict_blocked', 'schedule_conflict_override', 'notification_failed',
          'notification_skipped', 'calendar_downloaded', 'recording_published',
          'live_summary_published', 'quality_review_saved', 'quality_review_passed',
          'quality_review_needs_coaching', 'quality_review_serious_issue',
          'quality_coaching_assigned', 'quality_coaching_acknowledged',
          'quality_coaching_completed', 'quality_coaching_updated'
      )
        AND timecreated >= :fromtime AND timecreated <= :totime
   ORDER BY timecreated DESC, id DESC",
    ['fromtime' => $from, 'totime' => $to], 0, 100
));

$ids = [];
foreach ($sessions as $s) {
    $ids[] = (int)$s->teacherid;
}
foreach ($teachers as $t) {
    $ids[] = (int)$t->teacherid;
}
foreach ($audit as $a) {
    if (isset($a->userid)) {
        $ids[] = (int)$a->userid;
    }
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'filters' => ['from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'teacherid' => $teacherid, 'studentid' => $studentid, 'status' => $status, 'seriesid' => $seriesid],
    'metrics' => $metrics,
    'sessions' => $sessions,
    'teachers' => $teachers,
    'audit' => $audit,
    'names' => pqpd_names($ids),
], JSON_UNESCAPED_SLASHES);
