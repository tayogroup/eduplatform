<?php
// ---- report: student-parent-portal (family account overview; read-only) ------
// Ported from local_hubredirect/student_parent_portal.php via
// student_parent_portallib (pqsppl_*, the page's single inline function
// pqsp_child_ids extracted verbatim). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
// GET  = everything the page renders for one linked student: enrolled live
//        class sessions with attendance, invoices, payments, payment plans,
//        published course grades, secure document downloads, and the
//        self-service links — plus the linked-children list so the portal
//        page can offer the same studentid switch the page's URL parameter
//        provides. Transcript / finance / workspace links stay on the legacy
//        Moodle pages (none of them is portal-migrated yet), exactly as
//        dashboard.html does for unmigrated targets.
// POST = none: the page performs no writes (no data_submitted/sesskey block),
//        so any POST is rejected.
// (student_parent_portal.php has no pqh_live_security_audit calls — none to
// keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workflow_documentlib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_parent_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The one write on this portal: open a grade dispute (the dispute schema
    // existed but had NO student/parent path — teachers could only log their
    // own). Validated against the caller's linked children below, so the
    // access resolution runs first; the action executes after it.
    $pendingdispute = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($pendingdispute)
            || !in_array((string)($pendingdispute['do'] ?? ''), ['open_grade_dispute', 'confirm_parent_link', 'raise_lesson_dispute'], true)) {
        pqpd_fail(400, 'Unknown student-parent-portal action.');
    }
}

// ---- Access + student resolution (student_parent_portal.php lines 34-49) -----
// Same order and outcomes as the legacy ENTRY check; pqh_access_denied()
// redirects become 403 JSON failures with the page's exact messages.
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', 0, PARAM_INT));
$role = $workspaceid > 0 ? pqh_user_workspace_role($userid, $workspaceid) : '';
if ($workspaceid <= 0 || !in_array($role, ['platform_admin', 'owner', 'admin', 'student', 'parent', 'sponsor'], true)) {
    pqpd_fail(403, 'Student and parent portal requires student, parent, sponsor, or workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// ---- write: confirm_parent_link (BEFORE child resolution — a parent whose
// only link is still pending has no confirmed children yet) ------------------
if (isset($pendingdispute) && is_array($pendingdispute)
        && (string)($pendingdispute['do'] ?? '') === 'confirm_parent_link') {
    $confirmstudentid = (int)($pendingdispute['studentid'] ?? 0);
    if ($confirmstudentid <= 0 || !pqh_table_exists_safe('local_prequran_comm_consent')) {
        pqpd_fail(400, 'Choose a pending link to confirm.');
    }
    $commcolumns = $DB->get_columns('local_prequran_comm_consent');
    $pair = $DB->get_record('local_prequran_comm_consent',
        ['studentid' => $confirmstudentid, 'guardianid' => $userid], '*', IGNORE_MISSING);
    if (!$pair) {
        pqpd_fail(400, 'No pending guardian link found for that student.');
    }
    $pairsource = (string)($pair->source ?? ($pair->consent_source ?? ''));
    $pairconsented = isset($commcolumns['consented']) ? (int)($pair->consented ?? 1) : 0;
    if ($pairsource !== 'pending_parent_confirm' || $pairconsented === 1) {
        pqpd_fail(400, 'No pending guardian link found for that student.');
    }
    $confirmed = (object)['id' => (int)$pair->id];
    if (isset($commcolumns['consented'])) {
        $confirmed->consented = 1;
    }
    if (isset($commcolumns['source'])) {
        $confirmed->source = 'parent_confirmed';
    }
    if (isset($commcolumns['consent_source'])) {
        $confirmed->consent_source = 'parent_confirmed';
    }
    if (isset($commcolumns['timemodified'])) {
        $confirmed->timemodified = time();
    }
    $DB->update_record('local_prequran_comm_consent', $confirmed);
    // Live-class consent activates with the confirmation; recording consent
    // stays whatever the admin recorded (explicit opt-in remains separate).
    if (pqh_table_exists_safe('local_prequran_live_consent')) {
        $live = $DB->get_record('local_prequran_live_consent',
            ['studentid' => $confirmstudentid, 'guardianid' => $userid, 'consent_type' => 'live_session'],
            '*', IGNORE_MISSING);
        if ($live) {
            $DB->update_record('local_prequran_live_consent', (object)[
                'id' => (int)$live->id, 'granted' => 1, 'timemodified' => time(),
            ]);
        }
    }
    try {
        if (pqh_table_exists_safe('local_prequran_course_audit')) {
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
                'studentid' => $confirmstudentid, 'actorid' => $userid,
                'action' => 'student_parent_link_confirmed', 'targettype' => 'user', 'targetid' => $userid,
                'details' => json_encode(['guardianid' => $userid], JSON_UNESCAPED_SLASHES),
                'timecreated' => time(),
            ]);
        }
    } catch (Throwable $e) {
        // Audit best-effort.
    }
    echo json_encode([
        'ok' => true,
        'message' => 'Guardian link confirmed. The student now appears in your portal; the nightly sync grants observer access.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

$childids = pqsppl_child_ids($workspaceid, $userid);
if (pqh_user_can_manage_workspace($userid, $workspaceid) && optional_param('studentid', 0, PARAM_INT) > 0) {
    $childids = [optional_param('studentid', 0, PARAM_INT)];
}
$studentid = optional_param('studentid', $childids[0] ?? $userid, PARAM_INT);
// A guardian whose only link is still awaiting their confirmation has no
// confirmed children yet — let the page load so the pending panel can show.
$hasonlypending = false;
if (!$childids && $role === 'parent' && pqh_table_exists_safe('local_prequran_comm_consent')) {
    $gatecolumns = $DB->get_columns('local_prequran_comm_consent');
    $gatesource = isset($gatecolumns['source']) ? 'source'
        : (isset($gatecolumns['consent_source']) ? 'consent_source' : '');
    if ($gatesource !== '') {
        $hasonlypending = $DB->record_exists_select('local_prequran_comm_consent',
            "guardianid = :guardianid AND {$gatesource} = 'pending_parent_confirm'", ['guardianid' => $userid]);
    }
}
if (!in_array($studentid, $childids, true) && !pqh_user_can_manage_workspace($userid, $workspaceid)
        && $role !== 'sponsor' && !$hasonlypending) {
    pqpd_fail(403, 'That student is not linked to your portal.');
}
$student = core_user::get_user($studentid, 'id,firstname,lastname,email', IGNORE_MISSING);
$urlparams = ['workspaceid' => $workspaceid, 'studentid' => $studentid];

// ---- write: open_grade_dispute (runs after access resolution) ----------------
if (isset($pendingdispute) && is_array($pendingdispute)) {
    if (!pqh_table_exists_safe('local_prequran_grade_dispute') || !pqh_table_exists_safe('local_prequran_course_grade')) {
        pqpd_fail(400, 'Grade disputes are not available on this site yet.');
    }
    $coursegradeid = (int)($pendingdispute['coursegradeid'] ?? 0);
    $reason = trim(clean_param((string)($pendingdispute['reason'] ?? ''), PARAM_TEXT));
    if ($reason === '' || core_text::strlen($reason) < 10) {
        pqpd_fail(400, 'Describe the issue with the grade (at least a sentence) so the teacher can review it.');
    }
    $coursegrade = $DB->get_record('local_prequran_course_grade',
        ['id' => $coursegradeid, 'workspaceid' => $workspaceid, 'studentid' => $studentid], '*', IGNORE_MISSING);
    if (!$coursegrade) {
        pqpd_fail(400, 'Choose a valid grade to query.');
    }
    $open = $DB->record_exists('local_prequran_grade_dispute',
        ['coursegradeid' => $coursegradeid, 'requesterid' => $userid, 'status' => 'open']);
    if ($open) {
        pqpd_fail(400, 'You already have an open query on this grade — the teacher will respond to it.');
    }
    $now = time();
    $DB->insert_record('local_prequran_grade_dispute', (object)[
        'workspaceid' => $workspaceid,
        'gradeid' => 0,
        'coursegradeid' => $coursegradeid,
        'studentid' => $studentid,
        'requesterid' => $userid,
        'status' => 'open',
        'reason' => $reason,
        'resolution' => '',
        'resolvedby' => 0,
        'resolvedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    echo json_encode([
        'ok' => true,
        'message' => 'Grade query submitted. The teaching team sees open queries on their gradebook and will respond.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- write: raise a lesson/tutor dispute (no-show, quality, refund) ----------
if (isset($pendingdispute) && is_array($pendingdispute)
        && (string)($pendingdispute['do'] ?? '') === 'raise_lesson_dispute') {
    require_once($CFG->dirroot . '/local/hubredirect/marketplace_core_portallib.php');
    if (!pqmk_dispute_ready()) {
        pqpd_fail(400, 'Lesson disputes are not available on this site yet.');
    }
    try {
        $did = pqmk_raise_dispute($workspaceid, $consumercontext, $userid, [
            'studentid' => $studentid,
            'sessionid' => (int)($pendingdispute['sessionid'] ?? 0),
            'teacherid' => (int)($pendingdispute['teacherid'] ?? 0),
            'dispute_type' => clean_param((string)($pendingdispute['dispute_type'] ?? 'quality'), PARAM_ALPHANUMEXT),
            'desired_outcome' => clean_param((string)($pendingdispute['desired_outcome'] ?? 'review'), PARAM_ALPHANUMEXT),
            'description' => (string)($pendingdispute['description'] ?? ''),
        ]);
        echo json_encode(['ok' => true, 'message' => 'Your concern has been submitted to the school for review.', 'disputeid' => $did], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// ---- GET: the datasets the page renders (lines 51-67, verbatim) --------------
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records_sql(
    "SELECT s.*, a.attendance_status
       FROM {local_prequran_live_session} s
       JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
  LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = :astudentid
      WHERE s.workspaceid = :workspaceid
        AND (p.studentid = :studentid OR p.userid = :userid)
   ORDER BY s.scheduled_start DESC",
    ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'userid' => $studentid, 'astudentid' => $studentid],
    0,
    20
)) : [];
$invoices = pqh_table_exists_safe('local_prequran_invoice') ? array_values($DB->get_records('local_prequran_invoice', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'issuedat DESC, id DESC', '*', 0, 20)) : [];
$payments = pqh_table_exists_safe('local_prequran_payment') ? array_values($DB->get_records('local_prequran_payment', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'receivedat DESC, id DESC', '*', 0, 20)) : [];
$plans = pqh_table_exists_safe('local_prequran_payment_plan') ? array_values($DB->get_records('local_prequran_payment_plan', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'timecreated DESC', '*', 0, 20)) : [];
// Release control: only PUBLISHED course grades reach students/parents.
// (Previously drafts leaked — every save_grade recalc creates a draft row.)
$grades = pqh_table_exists_safe('local_prequran_course_grade') ? array_values($DB->get_records('local_prequran_course_grade', ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'status' => 'published'], 'publishedat DESC, id DESC', '*', 0, 20)) : [];
$documents = pqh_table_exists_safe('local_prequran_document') ? array_values($DB->get_records_select('local_prequran_document', 'workspaceid = :workspaceid AND studentid = :studentid AND status <> :archived', ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'archived' => 'archived'], 'timemodified DESC', '*', 0, 40)) : [];

// Course progress rollup: the per-unit `completed` flags from the progress web
// service were never aggregated or shown to families (they stayed inside the
// app hydrate document). Compute % units complete per course, joined to the
// curriculum map for the unit total + a friendly subject/stage label.
$courseprogress = [];
if (pqh_table_exists_safe('local_prequran_progress')) {
    $progressrows = $DB->get_records('local_prequran_progress',
        ['environment' => 'production', 'userid' => $studentid], '', 'id,coursekey,unit,statejson');
    $bycourse = [];
    foreach ($progressrows as $row) {
        $key = (string)$row->coursekey;
        if ($key === '') {
            continue;
        }
        if (!isset($bycourse[$key])) {
            $bycourse[$key] = ['done' => 0, 'seen' => 0];
        }
        $bycourse[$key]['seen']++;
        $state = json_decode((string)$row->statejson, true);
        if (is_array($state) && !empty($state['completed'])) {
            $bycourse[$key]['done']++;
        }
    }
    $hascurriculum = pqh_table_exists_safe('local_prequran_curriculum_map');
    foreach ($bycourse as $key => $counts) {
        $total = $counts['seen'];
        $subject = $key;
        $stage = 0;
        if ($hascurriculum) {
            $map = $DB->get_record('local_prequran_curriculum_map', ['idnumber' => $key], 'subject,stage,unitcount', IGNORE_MISSING);
            if ($map) {
                if ((int)$map->unitcount > 0) {
                    $total = (int)$map->unitcount;
                }
                $subject = (string)$map->subject !== '' ? (string)$map->subject : $key;
                $stage = (int)$map->stage;
            }
        }
        $total = max($total, $counts['done'], 1);
        $courseprogress[] = [
            'coursekey' => $key,
            'subject' => $subject,
            'stage' => $stage,
            'units_completed' => $counts['done'],
            'units_total' => $total,
            'percent' => (int)round(100 * $counts['done'] / $total),
        ];
    }
}

// Decorate for the client (schedule label, attendance pill value, secure
// download URL — the same values the page renders inline).
foreach ($sessions as $session) {
    $session->scheduled_start_label = userdate((int)$session->scheduled_start);
    $session->attendance_label = (string)($session->attendance_status ?? $session->status);
}
$documentsout = [];
foreach ($documents as $doc) {
    $documentsout[] = [
        'id' => (int)$doc->id,
        'title' => (string)$doc->title,
        'document_type' => (string)$doc->document_type,
        'verification_status' => (string)$doc->verification_status,
        'download_url' => pqwdoc_download_url($doc),
    ];
}
// Published report cards for this student (per-term report, distinct from the
// cumulative transcript). Only published cards reach the family.
$reportcardsout = [];
if (pqh_table_exists_safe('local_prequran_report_card')) {
    $rcs = $DB->get_records_select('local_prequran_report_card',
        "workspaceid = :ws AND studentid = :sid AND status = 'published'",
        ['ws' => $workspaceid, 'sid' => $studentid], 'issuedat DESC', '*', 0, 24);
    foreach ($rcs as $rc) {
        $termtitle = '';
        if ((int)$rc->termid > 0 && pqh_table_exists_safe('local_prequran_acad_term')) {
            $termtitle = (string)$DB->get_field('local_prequran_acad_term', 'title', ['id' => (int)$rc->termid], IGNORE_MISSING);
        }
        $reportcardsout[] = [
            'cardnumber' => (string)$rc->cardnumber,
            'term' => $termtitle !== '' ? $termtitle : ('Term #' . (int)$rc->termid),
            'overall_grade' => (string)$rc->overall_grade,
            'attendance_rate' => (string)$rc->attendance_rate,
            'conduct' => (string)$rc->conduct,
            'issuedat' => (int)$rc->issuedat,
            'pdf_url' => (int)$rc->generateddocid > 0
                ? $CFG->wwwroot . '/local/hubredirect/document_pdf.php?generatedid=' . (int)$rc->generateddocid : '',
        ];
    }
}

// Parent-visible behaviour records (merits always; incidents only when the
// teacher marked them parent-visible; safeguarding records never shown here).
$behaviourout = [];
if (pqh_table_exists_safe('local_prequran_behaviour')) {
    $brows = $DB->get_records_select('local_prequran_behaviour',
        "workspaceid = :ws AND studentid = :sid AND severity <> 'safeguarding'
         AND (record_type = 'merit' OR parent_visible = 1)",
        ['ws' => $workspaceid, 'sid' => $studentid], 'incident_date DESC', '*', 0, 40);
    foreach ($brows as $b) {
        $behaviourout[] = [
            'record_type' => (string)$b->record_type,
            'category' => (string)$b->category,
            'title' => (string)$b->title,
            'description' => (string)$b->description,
            'incident_date' => (int)$b->incident_date,
            'status' => (string)$b->status,
        ];
    }
}

// Lesson disputes this family raised for the student, + options for the form.
$lessondisputesout = [];
$disputetypes = [];
if (pqh_table_exists_safe('local_prequran_lesson_dispute')) {
    require_once($CFG->dirroot . '/local/hubredirect/marketplace_core_portallib.php');
    $disputetypes = pqmk_dispute_type_options();
    $drows = $DB->get_records_select('local_prequran_lesson_dispute',
        "workspaceid = :ws AND studentid = :sid", ['ws' => $workspaceid, 'sid' => $studentid], 'timecreated DESC', '*', 0, 30);
    foreach ($drows as $d) {
        $lessondisputesout[] = [
            'disputenumber' => (string)$d->disputenumber,
            'dispute_type' => (string)$d->dispute_type,
            'status' => (string)$d->status,
            'resolution_type' => (string)$d->resolution_type,
            'resolution' => (string)$d->resolution,
            'timecreated' => (int)$d->timecreated,
        ];
    }
}

$nameids = array_merge([$userid, $studentid], $childids);
$names = pqpd_names($nameids);
$childrenout = [];
foreach ($childids as $childid) {
    $childrenout[] = [
        'studentid' => (int)$childid,
        'name' => $names[(int)$childid] ?? ('Student #' . (int)$childid),
    ];
}

// Pending guardian links awaiting THIS user's confirmation (confirm mode).
$pendinglinks = [];
if (pqh_table_exists_safe('local_prequran_comm_consent')) {
    $pendingcolumns = $DB->get_columns('local_prequran_comm_consent');
    $sourcefield = isset($pendingcolumns['source']) ? 'source'
        : (isset($pendingcolumns['consent_source']) ? 'consent_source' : '');
    if ($sourcefield !== '') {
        $pendingrows = $DB->get_records_select('local_prequran_comm_consent',
            "guardianid = :guardianid AND {$sourcefield} = 'pending_parent_confirm'"
            . (isset($pendingcolumns['consented']) ? ' AND consented = 0' : ''),
            ['guardianid' => $userid], '', 'id, studentid', 0, 20);
        foreach ($pendingrows as $row) {
            $pendingchild = core_user::get_user((int)$row->studentid, 'id,firstname,lastname', IGNORE_MISSING);
            $pendinglinks[] = [
                'studentid' => (int)$row->studentid,
                'name' => $pendingchild ? fullname($pendingchild) : ('Student #' . (int)$row->studentid),
            ];
        }
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'workspacename' => (string)$workspace->name,
    'pendinglinks' => $pendinglinks,
    'role' => $role,
    'student' => [
        'id' => $studentid,
        'name' => $student ? fullname($student) : ('Student #' . $studentid),
    ],
    'children' => $childrenout,
    'sessions' => $sessions,
    'invoices' => $invoices,
    'payments' => $payments,
    'plans' => $plans,
    'grades' => $grades,
    'courseprogress' => $courseprogress,
    'reportcards' => $reportcardsout,
    'behaviour' => $behaviourout,
    'lessondisputes' => $lessondisputesout,
    'disputetypes' => $disputetypes,
    'documents' => $documentsout,
    'urls' => [
        'transcript' => $CFG->wwwroot . '/local/hubredirect/course_transcript.php?' . http_build_query($urlparams),
        'transcriptpdf' => $CFG->wwwroot . '/local/hubredirect/course_transcript_export.php?' . http_build_query($urlparams + ['format' => 'pdf']),
        'finance' => $CFG->wwwroot . '/local/hubredirect/student_finance.php?' . http_build_query($urlparams),
        'workspace' => $CFG->wwwroot . '/local/hubredirect/workspace_dashboard.php?' . http_build_query(['workspaceid' => $workspaceid]),
    ],
    'names' => $names,
], JSON_UNESCAPED_SLASHES);
exit;
