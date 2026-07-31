<?php
// Portal handler: report-cards (teacher/admin). Build a per-term student report
// (grades + attendance snapshot + conduct + teacher narrative), edit it, and
// publish it to the family portal. Distinct from the cumulative transcript.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_records_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

$consumercontext = pqh_requested_consumer_context();
$workspaceid = isset($body['workspaceid'])
    ? (int)$body['workspaceid']
    : optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$role = $workspaceid > 0 ? pqh_user_workspace_role($userid, $workspaceid) : '';

if ($workspaceid <= 0 || !in_array($role, ['platform_admin', 'owner', 'admin', 'teacher', 'registrar', 'coordinator'], true)) {
    pqpd_fail(403, 'Report cards require teacher or workspace administrator access.');
}
if (!pqir_ready()) {
    pqpd_fail(503, 'Report card tables are not ready. Run the local_prequran plugin upgrade first.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $bint = static function (string $k, int $d = 0) use ($body): int {
        return isset($body[$k]) ? (int)$body[$k] : $d;
    };
    $btext = static function (string $k, string $d = '') use ($body): string {
        return clean_param((string)($body[$k] ?? $d), PARAM_TEXT);
    };
    $balnum = static function (string $k, string $d = '') use ($body): string {
        return clean_param((string)($body[$k] ?? $d), PARAM_ALPHANUMEXT);
    };
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $message = '';
        $extra = [];
        if ($do === 'build') {
            $cardid = pqir_upsert_report_card($workspaceid, $consumercontext, $bint('studentid'), $bint('termid'), $userid);
            $message = 'Report card drafted from the latest grades and attendance.';
            $extra['cardid'] = $cardid;
        } else if ($do === 'save_narrative') {
            pqir_save_report_card_narrative($bint('cardid'), $workspaceid, $userid, [
                'conduct' => $balnum('conduct', 'not_assessed'),
                'effort' => $balnum('effort', 'not_assessed'),
                'teacher_narrative' => (string)($body['teacher_narrative'] ?? ''),
                'head_comment' => (string)($body['head_comment'] ?? ''),
            ]);
            $message = 'Report card comments saved.';
        } else if ($do === 'publish') {
            pqir_publish_report_card($bint('cardid'), $workspaceid, $consumercontext, $userid, true);
            $message = 'Report card published to the family portal.';
        } else if ($do === 'unpublish') {
            pqir_publish_report_card($bint('cardid'), $workspaceid, $consumercontext, $userid, false);
            $message = 'Report card unpublished.';
        } else if ($do === 'set_student_status') {
            pqir_set_student_status($workspaceid, $bint('studentid'), $balnum('status', 'enrolled'), $userid, $btext('reason', ''));
            $message = 'Student status updated.';
        } else if ($do === 'assign_admission_number') {
            $number = pqir_assign_admission_number($workspaceid, $bint('studentid'));
            $message = $number !== '' ? ('Admission number ' . $number . ' assigned.') : 'No admission number assigned (already set or schema missing).';
            $extra['admission_number'] = $number;
        } else if ($do === 'save_demographics') {
            pqir_save_student_demographics($workspaceid, $bint('studentid'), $userid, [
                'nationality' => $btext('nationality', ''),
                'address_line' => $btext('address_line', ''),
                'postal_code' => $btext('postal_code', ''),
                'country' => $btext('country', ''),
                'city' => $btext('city', ''),
                'gender' => $btext('gender', ''),
                'date_of_birth' => $btext('date_of_birth', ''),
                'admission_date' => $btext('admission_date', ''),
            ]);
            $message = 'Student demographics saved.';
        } else if ($do === 'save_behaviour') {
            $bid = pqir_save_behaviour($workspaceid, $consumercontext, $userid, [
                'id' => $bint('behaviourid'),
                'studentid' => $bint('studentid'),
                'record_type' => $balnum('record_type', 'incident'),
                'category' => $btext('category', ''),
                'severity' => $balnum('severity', 'low'),
                'title' => $btext('title', ''),
                'description' => (string)($body['description'] ?? ''),
                'action_taken' => (string)($body['action_taken'] ?? ''),
                'incident_date' => $btext('incident_date', ''),
                'parent_visible' => $bint('parent_visible'),
                'status' => $balnum('behaviour_status', 'open'),
            ]);
            $message = 'Behaviour record saved.';
            $extra['behaviourid'] = $bid;
        } else {
            pqpd_fail(400, 'Choose a valid report-card action.');
        }
        echo json_encode(['ok' => true, 'message' => $message] + $extra, JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: terms, students, existing cards ------------------------------------
$nameids = [];

$terms = [];
if (pqh_table_exists_safe('local_prequran_acad_term')) {
    foreach ($DB->get_records('local_prequran_acad_term', ['workspaceid' => $workspaceid], 'startdate DESC', '*', 0, 100) as $t) {
        $terms[] = ['id' => (int)$t->id, 'title' => (string)$t->title, 'term_code' => (string)$t->term_code, 'status' => (string)$t->status];
    }
}

$students = [];
if (pqh_table_exists_safe('local_prequran_workspace_member')) {
    $rows = $DB->get_records_sql(
        "SELECT wm.userid, u.firstname, u.lastname, u.idnumber, sp.enrolment_status
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
      LEFT JOIN {local_prequran_student_profile} sp ON sp.userid = wm.userid
          WHERE wm.workspaceid = :ws AND wm.status = 'active' AND wm.workspace_role = 'student'
       ORDER BY u.lastname ASC, u.firstname ASC", ['ws' => $workspaceid], 0, 1000);
    foreach ($rows as $r) {
        $students[] = [
            'id' => (int)$r->userid,
            'name' => fullname($r),
            'account' => (string)$r->idnumber,
            'enrolment_status' => (string)($r->enrolment_status ?? 'enrolled'),
            'admission_number' => (string)($r->admission_number ?? ''),
            'nationality' => (string)($r->nationality ?? ''),
            'address_line' => (string)($r->address_line ?? ''),
            'postal_code' => (string)($r->postal_code ?? ''),
            'country' => (string)($r->country ?? ''),
            'city' => (string)($r->city ?? ''),
            'gender' => (string)($r->gender ?? ''),
            'date_of_birth' => (string)($r->date_of_birth ?? ''),
        ];
    }
}

// Behaviour / conduct records. Safeguarding-severity records are restricted to
// workspace managers (a class teacher does not see every safeguarding flag).
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$behaviour = [];
if (pqir_behaviour_ready()) {
    $bwhere = 'workspaceid = :ws';
    $bparams = ['ws' => $workspaceid];
    if (!$canmanage) {
        $bwhere .= " AND severity <> 'safeguarding'";
    }
    foreach ($DB->get_records_select('local_prequran_behaviour', $bwhere, $bparams, 'incident_date DESC', '*', 0, 300) as $b) {
        $nameids[] = (int)$b->studentid;
        $behaviour[] = [
            'id' => (int)$b->id,
            'studentid' => (int)$b->studentid,
            'record_type' => (string)$b->record_type,
            'category' => (string)$b->category,
            'severity' => (string)$b->severity,
            'title' => (string)$b->title,
            'description' => (string)$b->description,
            'action_taken' => (string)$b->action_taken,
            'incident_date' => (int)$b->incident_date,
            'parent_visible' => (int)$b->parent_visible,
            'status' => (string)$b->status,
        ];
    }
}

$cards = [];
foreach ($DB->get_records('local_prequran_report_card', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 300) as $c) {
    $nameids[] = (int)$c->studentid;
    $cards[] = [
        'id' => (int)$c->id,
        'cardnumber' => (string)$c->cardnumber,
        'studentid' => (int)$c->studentid,
        'termid' => (int)$c->termid,
        'status' => (string)$c->status,
        'overall_grade' => (string)$c->overall_grade,
        'attendance_rate' => (string)$c->attendance_rate,
        'conduct' => (string)$c->conduct,
        'effort' => (string)$c->effort,
        'teacher_narrative' => (string)$c->teacher_narrative,
        'head_comment' => (string)$c->head_comment,
        'grades' => json_decode((string)$c->grades_json, true) ?: [],
        'generateddocid' => (int)$c->generateddocid,
        'pdf_url' => (int)$c->generateddocid > 0
            ? $CFG->wwwroot . '/local/hubredirect/document_pdf.php?generatedid=' . (int)$c->generateddocid : '',
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'terms' => $terms,
    'students' => $students,
    'cards' => $cards,
    'behaviour' => $behaviour,
    'canmanage' => $canmanage,
    'conduct_options' => pqir_conduct_options(),
    'severity_options' => pqir_behaviour_severity_options(),
    'status_options' => pqir_student_status_options(),
    'names' => pqpd_names(array_values(array_unique(array_filter($nameids)))),
], JSON_UNESCAPED_SLASHES);
exit;
