<?php
// ---- report: teacher-workspace (independent-teacher workspace console) --------
// Ported from local_hubredirect/teacher_workspace.php via
// teacher_workspace_portallib (pqltchl_*). Dispatched from portal_data.php AFTER
// token auth: $claims is verified, $USER is the token user, JSON exception
// handler + CORS headers are installed. The legacy page stays live in parallel
// and is untouched.
//
// GET  ?report=teacher-workspace&token=…[&workspaceid=&consumer=&teacherid=&childid=]
//      -> console data: teacher/workspace identity, metrics band, today /
//         upcoming / needs-review / recent-completed session rows, open parent
//         follow-ups, quality-coaching queue, improvement-plan queue (+names).
// POST body JSON {"do": …, "sessionid": …[, "workspaceid": …, "teacherid": …]}:
//      do=ack_quality_coaching   (qa_coaching_status assigned|acknowledged ->
//                                 acknowledged + ackby/ackat + audit, verbatim)
//      do=ack_improvement_plan   (improvement_plan_status assigned|in_progress ->
//                                 in_progress + ackby/ackat + audit, verbatim)
// Access is the legacy page check verbatim: pqltchl_is_teacher() at entry, then
// the workspace resolution (pqh_current_workspace_id + own-teacher-workspace
// fallback + pqh_user_can_teach_in_workspace) with identical denial messages.
// The legacy page never calls pqh_live_security_audit, so there is none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_workspace_portallib.php');

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
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}

// ---- ENTRY access check (legacy denial message, verbatim) ---------------------
if (!pqltchl_is_teacher((int)$USER->id)) {
    pqpd_fail(403, 'Only teachers and administrators can view the live-class workspace.');
}

$teacherid = $ispost ? (int)($body['teacherid'] ?? (int)$USER->id) : optional_param('teacherid', (int)$USER->id, PARAM_INT);
if ($teacherid <= 0) {
    $teacherid = (int)$USER->id;
}
if (!is_siteadmin($USER)) {
    $teacherid = (int)$USER->id;
}

// ---- workspace resolution (legacy logic + denial message, verbatim) -----------
$workspaceid = 0;
$workspace = null;
if ($requestedworkspaceid > 0) {
    $resolvedworkspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
    $isownteacherworkspace = (int)$USER->id === $teacherid && pqltchl_is_teacher((int)$USER->id);
    $workspaceid = $resolvedworkspaceid > 0 ? $resolvedworkspaceid : ($isownteacherworkspace ? $requestedworkspaceid : 0);
    $canviewworkspace = $workspaceid > 0
        && (pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid) || $isownteacherworkspace);
    if (!$canviewworkspace) {
        pqpd_fail(403, 'This workspace live-class view is not available for your account.');
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
}
$workspacewhere = $workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND s.workspaceid = :workspaceid' : '';
$workspaceplainwhere = $workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND workspaceid = :workspaceid' : '';
$workspaceparams = $workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') ? ['workspaceid' => $workspaceid] : [];

$ready = pqltchl_ready();

if ($ispost) {
    $do = (string)($body['do'] ?? '');

    // ---- do: ack_quality_coaching (legacy action=ack_quality_coaching, --------
    // verbatim; confirm_sesskey() dropped — token auth replaces the session key).
    if ($do === 'ack_quality_coaching') {
        if (!$ready || !pqltchl_column_exists('local_prequran_live_session', 'qa_coaching_status')) {
            // Legacy silently skips the block when the column is missing; the
            // API reports it instead of pretending the write happened.
            pqpd_fail(403, 'Quality coaching is not installed yet.');
        }
        $sessionid = (int)($body['sessionid'] ?? 0);
        $coachsession = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
        if (!$coachsession) {
            pqpd_fail(403, 'Choose a valid live session before acknowledging coaching.');
        }
        if ((int)$coachsession->teacherid !== $teacherid
            || ($workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') && (int)($coachsession->workspaceid ?? 0) !== $workspaceid)
            || ((int)$coachsession->teacherid !== (int)$USER->id && !is_siteadmin($USER))) {
            pqpd_fail(403, 'You cannot acknowledge this coaching item for the selected workspace.');
        }
        if (in_array((string)$coachsession->qa_coaching_status, ['assigned', 'acknowledged'], true)) {
            $oldstatus = (string)$coachsession->qa_coaching_status;
            $coachsession->qa_coaching_status = 'acknowledged';
            $coachsession->qa_coaching_ackby = (int)$USER->id;
            $coachsession->qa_coaching_ackat = time();
            $coachsession->timemodified = time();
            $DB->update_record('local_prequran_live_session', $coachsession);
            pqltchl_audit($sessionid, 'quality_coaching_acknowledged', [
                'oldstatus' => $oldstatus,
                'teacherid' => $teacherid,
            ]);
        }
        // Legacy: redirect(...&result=coaching_acknowledged) -> ok JSON instead.
        echo json_encode([
            'ok' => true,
            'result' => 'coaching_acknowledged',
            'message' => 'Quality coaching acknowledged.',
            'sessionid' => $sessionid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: ack_improvement_plan (legacy action=ack_improvement_plan, --------
    // verbatim; confirm_sesskey() dropped — token auth replaces the session key).
    if ($do === 'ack_improvement_plan') {
        if (!$ready || !pqltchl_column_exists('local_prequran_live_session', 'improvement_plan_status')) {
            pqpd_fail(403, 'Improvement plans are not installed yet.');
        }
        $sessionid = (int)($body['sessionid'] ?? 0);
        $plansession = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
        if (!$plansession) {
            pqpd_fail(403, 'Choose a valid live session before acknowledging an improvement plan.');
        }
        if ((int)$plansession->teacherid !== $teacherid
            || ($workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') && (int)($plansession->workspaceid ?? 0) !== $workspaceid)
            || ((int)$plansession->teacherid !== (int)$USER->id && !is_siteadmin($USER))) {
            pqpd_fail(403, 'You cannot acknowledge this improvement plan for the selected workspace.');
        }
        if (in_array((string)$plansession->improvement_plan_status, ['assigned', 'in_progress'], true)) {
            $oldstatus = (string)$plansession->improvement_plan_status;
            $plansession->improvement_plan_status = 'in_progress';
            $plansession->improvement_plan_ackby = (int)$USER->id;
            $plansession->improvement_plan_ackat = time();
            $plansession->timemodified = time();
            $DB->update_record('local_prequran_live_session', $plansession);
            pqltchl_audit($sessionid, 'improvement_plan_acknowledged', [
                'oldstatus' => $oldstatus,
                'newstatus' => 'in_progress',
                'teacherid' => $teacherid,
            ]);
        }
        // Legacy: redirect(...&result=plan_acknowledged) -> ok JSON instead.
        echo json_encode([
            'ok' => true,
            'result' => 'plan_acknowledged',
            'message' => 'Improvement plan acknowledged.',
            'sessionid' => $sessionid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown teacher-workspace action.');
}

// ---- GET: the workspace console state (same computation order as the page) ----
$selectedchildid = optional_param('childid', 0, PARAM_INT);
$selectedchild = null;
if ($selectedchildid > 0) {
    $selectedchilduser = core_user::get_user($selectedchildid, 'id,firstname,lastname,deleted', IGNORE_MISSING);
    if ($selectedchilduser && empty($selectedchilduser->deleted)) {
        $selectedchild = [
            'studentid' => $selectedchildid,
            'name' => fullname($selectedchilduser),
            'managed' => pqltchl_is_managed_student($selectedchildid),
        ];
    }
}

$now = time();
$todaystart = usergetmidnight($now);
$todayend = $todaystart + DAYSECS;
$teacher = core_user::get_user($teacherid);
$teachername = $teacher ? fullname($teacher) : 'Teacher ' . $teacherid;

$metrics = ['today' => 0, 'upcoming' => 0, 'needsreview' => 0, 'followups' => 0, 'coaching' => 0, 'improvementplans' => 0, 'studentsweek' => 0];
$today = [];
$upcoming = [];
$needsreview = [];
$recentcompleted = [];
$followups = [];
$coaching = [];
$improvementplans = [];
$followupready = false;
$coachingready = false;
$improvementready = false;

if ($ready) {
    $followupready = pqltchl_column_exists('local_prequran_live_note', 'followup_status');
    $parentresponseready = pqltchl_column_exists('local_prequran_live_note', 'parent_response_status');
    $coachingready = pqltchl_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $improvementready = pqltchl_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $metrics['today'] = pqltchl_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND scheduled_start >= :starttime
            AND scheduled_start < :endtime
            AND status <> :cancelled
            {$workspaceplainwhere}",
        $workspaceparams + ['teacherid' => $teacherid, 'starttime' => $todaystart, 'endtime' => $todayend, 'cancelled' => 'cancelled']
    );
    $metrics['upcoming'] = pqltchl_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND scheduled_start >= :nowtime
            AND scheduled_start < :untiltime
            AND status <> :cancelled
            {$workspaceplainwhere}",
        $workspaceparams + ['teacherid' => $teacherid, 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled']
    );
    $metrics['needsreview'] = pqltchl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session} s
          WHERE s.teacherid = :teacherid
            AND s.scheduled_end >= :fromtime
            AND s.scheduled_end < :nowtime
            AND s.status <> :cancelled
            {$workspacewhere}
            AND (
                s.status <> :completed
                OR (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id)
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
                OR (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '')
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
            )",
        $workspaceparams + ['teacherid' => $teacherid, 'fromtime' => $now - (14 * DAYSECS), 'nowtime' => $now, 'cancelled' => 'cancelled', 'completed' => 'completed']
    );
    $metrics['studentsweek'] = pqltchl_count_sql(
        "SELECT COUNT(DISTINCT p.studentid)
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
          WHERE s.teacherid = :teacherid
            AND s.scheduled_start >= :nowtime
            AND s.scheduled_start < :untiltime
            AND s.status <> :cancelled
            {$workspacewhere}",
        $workspaceparams + ['teacherid' => $teacherid, 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled']
    );
    if ($followupready) {
        $parentresponseselect = $parentresponseready
            ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
            : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
        $metrics['followups'] = pqltchl_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_note} n
              JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE s.teacherid = :teacherid
                {$workspacewhere}
                AND n.followup_status <> :none
                AND n.followup_resolved = 0",
            $workspaceparams + ['teacherid' => $teacherid, 'none' => 'none']
        );
        $followups = array_values($DB->get_records_sql(
            "SELECT n.*,
                    {$parentresponseselect}
                    s.title AS session_title,
                    s.scheduled_start,
                    s.scheduled_end
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE s.teacherid = :teacherid
                {$workspacewhere}
                AND n.followup_status <> :none
                AND n.followup_resolved = 0
           ORDER BY CASE n.followup_status
                        WHEN 'admin_support_requested' THEN 1
                        WHEN 'parent_contact_requested' THEN 2
                        WHEN 'review_homework' THEN 3
                        ELSE 4
                    END,
                    n.timemodified DESC",
            $workspaceparams + ['teacherid' => $teacherid, 'none' => 'none'],
            0,
            12
        ));
    }
    if ($coachingready) {
        $metrics['coaching'] = pqltchl_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspaceplainwhere}",
            $workspaceparams + ['teacherid' => $teacherid]
        );
        $coaching = array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspaceplainwhere}
           ORDER BY CASE qa_coaching_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    qa_coaching_due_date ASC,
                    qa_reviewedat DESC",
            $workspaceparams + ['teacherid' => $teacherid],
            0,
            12
        ));
    }
    if ($improvementready) {
        $metrics['improvementplans'] = pqltchl_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND improvement_plan_status IN ('assigned', 'in_progress')
                {$workspaceplainwhere}",
            $workspaceparams + ['teacherid' => $teacherid]
        );
        $improvementplans = array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND improvement_plan_status IN ('assigned', 'in_progress')
                {$workspaceplainwhere}
           ORDER BY CASE improvement_plan_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    improvement_plan_due_date ASC,
                    improvement_plan_assignedat DESC",
            $workspaceparams + ['teacherid' => $teacherid],
            0,
            12
        ));
    }

    $today = pqltchl_session_rows($teacherid, $todaystart, $todayend, 20, $workspaceid);
    $upcoming = pqltchl_session_rows($teacherid, $now, $now + (7 * DAYSECS), 20, $workspaceid);
    $needsreview = pqltchl_review_gap_rows($teacherid, $now - (14 * DAYSECS), $now, $workspaceid);
    $recentcompleted = pqltchl_session_rows($teacherid, $now - (14 * DAYSECS), $now, 12, $workspaceid);
    usort($recentcompleted, function($a, $b) {
        return (int)$b->scheduled_start <=> (int)$a->scheduled_start;
    });
    $recentcompleted = array_values(array_filter($recentcompleted, function($session) {
        return (string)$session->status === 'completed';
    }));
}

// Curated session fields only — the raw records carry BBB room credentials that
// must never reach the browser (same rule as the live-review handler).
$curatesession = static function($s): array {
    $out = [
        'id' => (int)$s->id,
        'title' => (string)$s->title,
        'status' => (string)$s->status,
        'session_type' => (string)($s->session_type ?? ''),
        'lessonid' => (string)($s->lessonid ?? ''),
        'unitid' => (string)($s->unitid ?? ''),
        'scheduled_start' => (int)$s->scheduled_start,
        'scheduled_end' => (int)$s->scheduled_end,
        'timezone' => (string)($s->timezone ?? ''),
        'teacherid' => (int)$s->teacherid,
        'workspaceid' => (int)($s->workspaceid ?? 0),
        'student_count' => (int)($s->student_count ?? 0),
        'attendance_count' => (int)($s->attendance_count ?? 0),
        'note_count' => (int)($s->note_count ?? 0),
        'visible_summary_count' => (int)($s->visible_summary_count ?? 0),
        'visible_recording_count' => (int)($s->visible_recording_count ?? 0),
    ];
    foreach ((array)$s as $key => $value) {
        if (preg_match('/^(qa_|improvement_plan_)/', (string)$key)) {
            $out[$key] = $value;
        }
    }
    return $out;
};
$curatefollowup = static function($n): array {
    return [
        'id' => (int)$n->id,
        'sessionid' => (int)$n->sessionid,
        'studentid' => (int)$n->studentid,
        'teacherid' => (int)($n->teacherid ?? 0),
        'homework' => (string)($n->homework ?? ''),
        'followup_status' => (string)($n->followup_status ?? 'none'),
        'followup_message' => (string)($n->followup_message ?? ''),
        'followup_resolved' => (int)!empty($n->followup_resolved),
        'parent_response_status' => (string)($n->parent_response_status ?? 'none'),
        'parent_response_message' => (string)($n->parent_response_message ?? ''),
        'parent_responseby' => (int)($n->parent_responseby ?? 0),
        'parent_responseat' => (int)($n->parent_responseat ?? 0),
        'session_title' => (string)($n->session_title ?? ''),
        'scheduled_start' => (int)($n->scheduled_start ?? 0),
        'scheduled_end' => (int)($n->scheduled_end ?? 0),
        'timemodified' => (int)($n->timemodified ?? 0),
    ];
};

$nameids = [$teacherid];
foreach ($followups as $row) {
    $nameids[] = (int)$row->studentid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'teacher' => ['id' => $teacherid, 'name' => $teachername],
    'isadmin' => is_siteadmin($USER),
    'workspace' => $workspace ? ['id' => (int)$workspace->id, 'name' => (string)$workspace->name] : null,
    'workspaceid' => $workspaceid,
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'selectedchild' => $selectedchild,
    'metrics' => $metrics,
    'today' => array_map($curatesession, $today),
    'upcoming' => array_map($curatesession, $upcoming),
    'needsreview' => array_map($curatesession, $needsreview),
    'recentcompleted' => array_map($curatesession, $recentcompleted),
    'followups' => array_map($curatefollowup, $followups),
    'coaching' => array_map($curatesession, $coaching),
    'improvementplans' => array_map($curatesession, $improvementplans),
    'followupready' => $followupready,
    'coachingready' => $coachingready,
    'improvementready' => $improvementready,
    'explainerurl' => pqh_live_session_explainer_url()->out(false),
    'agendatemplateurl' => pqh_live_session_agenda_template_url()->out(false),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
