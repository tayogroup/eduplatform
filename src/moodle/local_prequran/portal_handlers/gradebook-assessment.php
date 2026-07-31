<?php
// ---- report: gradebook-assessment (workspace gradebook; read + 5 writes) ------
// Ported from local_hubredirect/gradebook_assessment.php. The legacy page
// defines no functions of its own, so there is no pqXXrl_ rename layer: the
// handler requires the two shared libraries the page already used
// (gradebook_progresslib.php for pqgp_*, accesslib.php for pqh_*) and the empty
// gradebook_assessment_portallib.php to honour the one-lib-per-report contract.
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent. The legacy
// page stays live in parallel and is untouched.
// (gradebook_assessment.php has no pqh_live_security_audit calls — none to keep.)
// GET  = the workspace offerings, weighted categories, assessments, student
//        options, recent grade entries, published course grades, and audit
//        trail — the page's data block verbatim, decorated with names.
// POST = do=save_category | save_assessment | save_grade | publish_course_grade
//        | save_dispute — the page's five POST action branches VERBATIM (same
//        tables, field defaults, PARAM types, pqgp_audit calls and course-grade
//        recalculation). require_sesskey() dropped: token auth replaces the
//        session key. The legacy try/catch that rendered $e->getMessage() inline
//        becomes a 400 JSON failure. save_category / save_assessment stay
//        manager-only (legacy gated them on $canmanage); a non-manager posting
//        them becomes a 403 JSON failure instead of the legacy silent no-op.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/gradebook_progresslib.php');
require_once($CFG->dirroot . '/local/hubredirect/gradebook_assessment_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// JSON-body equivalents of the page's optional_param reads (same PARAM types and
// defaults as the legacy action block).
$bint = static function (string $key, int $default = 0) use ($body): int {
    return array_key_exists($key, $body) ? (int)$body[$key] : $default;
};
$bclean = static function (string $key, string $default, string $paramtype) use ($body): string {
    return clean_param(array_key_exists($key, $body) ? (string)$body[$key] : $default, $paramtype);
};

// ---- Access: exact legacy gate (gradebook_assessment.php lines 9-15) ----------
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    // Legacy pqh_access_denied(...) -> the same message as a 403 JSON failure.
    pqpd_fail(403, 'Gradebook access requires teacher or workspace administrator access.');
}
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
// Legacy uses MUST_EXIST here; a missing row becomes a 403 JSON failure instead
// of a Moodle exception page.
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'The selected workspace was not found.');
}
$ready = pqgp_gradebook_ready();

if ($ispost) {
    $do = (string)($body['do'] ?? '');
    try {
        // Legacy: throw when the schema is not installed (all writes need it).
        if (!$ready) {
            throw new invalid_parameter_exception('Gradebook tables are not installed yet. Run Moodle upgrade.');
        }
        $now = time();

        // -- write: save_category (legacy action=save_category, verbatim) -------
        if ($do === 'save_category') {
            if (!$canmanage) {
                pqpd_fail(403, 'Weighted categories require workspace administrator access.');
            }
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => $bint('offeringid'),
                'category_key' => $bclean('category_key', '', PARAM_ALPHANUMEXT),
                'title' => $bclean('title', '', PARAM_TEXT),
                'weight_percent' => $bclean('weight_percent', '0', PARAM_TEXT),
                'drop_lowest_count' => $bclean('drop_lowest_count', '0', PARAM_TEXT),
                'status' => $bclean('status', 'active', PARAM_ALPHANUMEXT),
                'createdby' => $userid,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $id = (int)$DB->insert_record('local_prequran_grade_category', $record);
            pqgp_audit($workspaceid, 'grade_category_created', [], (array)$record, $userid, ['offeringid' => (int)$record->offeringid], 'Category created.');
            echo json_encode(['ok' => true, 'message' => 'Weighted grading category saved.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: save_assessment (legacy action=save_assessment, verbatim) --
        if ($do === 'save_assessment') {
            if (!$canmanage) {
                pqpd_fail(403, 'Assessments require workspace administrator access.');
            }
            $duedateraw = $bclean('duedate', '', PARAM_TEXT);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => $bint('offeringid'),
                'categoryid' => $bint('categoryid'),
                'assessment_type' => $bclean('assessment_type', 'assignment', PARAM_ALPHANUMEXT),
                'title' => $bclean('title', '', PARAM_TEXT),
                'description' => $bclean('description', '', PARAM_TEXT),
                'max_points' => $bclean('max_points', '100', PARAM_TEXT),
                'weight_override' => $bclean('weight_override', '', PARAM_TEXT),
                // Formative/summative/practice: practice never counts toward the
                // course grade; formative and summative both do.
                'grade_impact' => in_array($bclean('grade_impact', 'summative', PARAM_ALPHANUMEXT), ['summative', 'formative', 'practice'], true)
                    ? $bclean('grade_impact', 'summative', PARAM_ALPHANUMEXT) : 'summative',
                'max_attempts' => max(0, $bint('max_attempts')),
                'duedate' => $duedateraw !== '' ? (strtotime($duedateraw . ' 00:00:00') ?: 0) : 0,
                'publishdate' => 0,
                'status' => $bclean('status', 'draft', PARAM_ALPHANUMEXT),
                'createdby' => $userid,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $id = (int)$DB->insert_record('local_prequran_assessment', $record);
            pqgp_audit($workspaceid, 'assessment_created', [], (array)$record, $userid, ['offeringid' => (int)$record->offeringid, 'assessmentid' => $id], 'Assessment created.');
            echo json_encode(['ok' => true, 'message' => 'Assessment saved.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: save_grade (legacy action=save_grade, verbatim) ------------
        if ($do === 'save_grade') {
            $assessment = $DB->get_record('local_prequran_assessment', ['id' => $bint('assessmentid'), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $studentid = $bint('studentid');
            $existing = $DB->get_record('local_prequran_grade', ['assessmentid' => (int)$assessment->id, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $points = $bclean('score_points', '', PARAM_TEXT);
            $maxpoints = max(0.01, pqgp_money_float((string)$assessment->max_points));
            $percent = $bclean('score_percent', '', PARAM_TEXT);
            if ($percent === '' && $points !== '') {
                $percent = (string)round((pqgp_money_float($points) / $maxpoints) * 100, 2);
            }
            $status = $bclean('status', 'draft', PARAM_ALPHANUMEXT);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$assessment->offeringid,
                'assessmentid' => (int)$assessment->id,
                'studentid' => $studentid,
                'score_points' => $points,
                'score_percent' => $percent,
                'letter_grade' => $percent !== '' ? pqgp_letter(pqgp_money_float($percent)) : '',
                'status' => $status,
                'teacher_feedback' => $bclean('teacher_feedback', '', PARAM_TEXT),
                'rubric_json' => pqgp_json(['rubric_note' => $bclean('rubric_note', '', PARAM_TEXT)]),
                'gradedby' => $userid,
                'gradedat' => $now,
                'reviewedby' => $status === 'reviewed' ? $userid : (int)($existing->reviewedby ?? 0),
                'reviewedat' => $status === 'reviewed' ? $now : (int)($existing->reviewedat ?? 0),
                'publishedby' => $status === 'published' ? $userid : (int)($existing->publishedby ?? 0),
                'publishedat' => $status === 'published' ? $now : (int)($existing->publishedat ?? 0),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            // Moderation: when grade_moderation_mode=require, a freshly
            // graded/edited row needs an INDEPENDENT second marker before it can
            // be trusted. A new grade resets to 'pending'; a prior moderation is
            // invalidated by re-grading (score may have changed).
            if ((string)get_config('local_prequran', 'grade_moderation_mode') === 'require') {
                $record->moderation_status = 'pending';
                $record->moderatedby = 0;
                $record->moderatedat = 0;
            } else {
                $record->moderation_status = 'not_required';
            }
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_grade', $record);
                $gradeid = (int)$existing->id;
            } else {
                $gradeid = (int)$DB->insert_record('local_prequran_grade', $record);
            }
            pqgp_audit($workspaceid, 'grade_saved', $existing ? (array)$existing : [], (array)$record, $userid, ['offeringid' => (int)$assessment->offeringid, 'assessmentid' => (int)$assessment->id, 'gradeid' => $gradeid, 'studentid' => $studentid], $bclean('correction_reason', '', PARAM_TEXT));
            pqgp_recalculate_course_grade($workspaceid, (int)$assessment->offeringid, $studentid, $userid, false);
            echo json_encode(['ok' => true, 'message' => 'Grade saved and course grade recalculated.'
                . ($record->moderation_status === 'pending' ? ' Awaiting independent moderation before publish.' : ''), 'id' => $gradeid], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: moderate_grade (independent second-marker sign-off) --------
        if ($do === 'moderate_grade') {
            $grow = $DB->get_record('local_prequran_grade', ['id' => $bint('gradeid'), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$grow->gradedby === $userid) {
                pqpd_fail(400, 'A grade must be moderated by someone other than the marker who entered it.');
            }
            $decision = $bclean('decision', 'approved', PARAM_ALPHANUMEXT);
            if (!in_array($decision, ['approved', 'returned'], true)) {
                pqpd_fail(400, 'Moderation decision must be approved or returned.');
            }
            $DB->update_record('local_prequran_grade', (object)[
                'id' => (int)$grow->id,
                'moderation_status' => $decision === 'approved' ? 'moderated' : 'returned',
                'moderatedby' => $userid,
                'moderatedat' => $now,
                'moderation_note' => $bclean('moderation_note', '', PARAM_TEXT),
                'timemodified' => $now,
            ]);
            pqgp_audit($workspaceid, 'grade_moderated', (array)$grow, ['moderation_status' => $decision], $userid, ['gradeid' => (int)$grow->id, 'studentid' => (int)$grow->studentid], $bclean('moderation_note', '', PARAM_TEXT));
            echo json_encode(['ok' => true, 'message' => 'Grade ' . ($decision === 'approved' ? 'moderated and cleared for publish.' : 'returned to the marker.')], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: publish_course_grade (legacy action=publish_course_grade) --
        if ($do === 'publish_course_grade') {
            $pubofferingid = $bint('offeringid');
            $pubstudentid = $bint('studentid');
            // Moderation gate: when required, every counting grade feeding this
            // course grade must be independently moderated first.
            if ((string)get_config('local_prequran', 'grade_moderation_mode') === 'require') {
                $unmoderated = (int)$DB->count_records_sql(
                    "SELECT COUNT(g.id)
                       FROM {local_prequran_grade} g
                       JOIN {local_prequran_assessment} a ON a.id = g.assessmentid
                      WHERE g.workspaceid = :ws AND g.offeringid = :oid AND g.studentid = :sid
                        AND g.status IN ('reviewed','published')
                        AND COALESCE(a.grade_impact, 'summative') <> 'practice'
                        AND COALESCE(g.moderation_status, 'not_required') NOT IN ('moderated','not_required')",
                    ['ws' => $workspaceid, 'oid' => $pubofferingid, 'sid' => $pubstudentid]);
                if ($unmoderated > 0) {
                    pqpd_fail(400, $unmoderated . ' grade(s) still await independent moderation — moderate them before publishing the course grade.');
                }
            }
            $pubid = pqgp_recalculate_course_grade($workspaceid, $pubofferingid, $pubstudentid, $userid, true);
            // Milestone notification: publishing a course grade is an academic
            // event the family should learn about (previously silent). Gated by
            // achievement_notify_mode; best-effort, never blocks the publish.
            $notified = 0;
            if ($pubid > 0 && (string)get_config('local_prequran', 'achievement_notify_mode') === 'enforce') {
                @include_once($CFG->dirroot . '/local/prequran/notificationlib.php');
                if (function_exists('local_prequran_notify_achievement_family')) {
                    $grade = $DB->get_record('local_prequran_course_grade', ['id' => $pubid], 'final_percent,letter_grade', IGNORE_MISSING);
                    $gradetext = $grade ? (((string)$grade->final_percent) . '%' . ((string)$grade->letter_grade !== '' ? ' (' . $grade->letter_grade . ')' : '')) : '';
                    $notified = local_prequran_notify_achievement_family(
                        $pubstudentid,
                        'Course grade published',
                        'A course grade has been published' . ($gradetext !== '' ? ': ' . $gradetext : '') . '.',
                        new moodle_url('/local/prequran/portal_launch.php', ['report' => 'student-parent-portal', 'workspaceid' => $workspaceid, 'studentid' => $pubstudentid]),
                        'Family portal',
                        'course_grade_published'
                    );
                }
            }
            echo json_encode(['ok' => true, 'message' => 'Course grade published for transcript use.'
                . ($notified > 0 ? ' ' . $notified . ' notification(s) sent.' : '')], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: save_dispute (legacy action=save_dispute, verbatim) --------
        if ($do === 'save_dispute') {
            $status = $bclean('status', 'open', PARAM_ALPHANUMEXT);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'gradeid' => $bint('gradeid'),
                'coursegradeid' => $bint('coursegradeid'),
                'studentid' => $bint('studentid'),
                'requesterid' => $userid,
                'status' => $status,
                'reason' => $bclean('reason', '', PARAM_TEXT),
                'resolution' => $bclean('resolution', '', PARAM_TEXT),
                'resolvedby' => $status === 'resolved' ? $userid : 0,
                'resolvedat' => $status === 'resolved' ? $now : 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $id = (int)$DB->insert_record('local_prequran_grade_dispute', $record);
            pqgp_audit($workspaceid, 'grade_dispute_recorded', [], (array)$record, $userid, ['gradeid' => (int)$record->gradeid, 'coursegradeid' => (int)$record->coursegradeid, 'studentid' => (int)$record->studentid], 'Dispute/correction recorded.');
            echo json_encode(['ok' => true, 'message' => 'Dispute or correction recorded.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    pqpd_fail(400, 'Unknown gradebook-assessment action.');
}

// ---- GET: the page's data block (gradebook_assessment.php lines 138-164) ------
$offerings = pqh_table_exists_safe('local_prequran_course_offering')
    ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC'))
    : [];
$categories = $ready ? array_values($DB->get_records('local_prequran_grade_category', ['workspaceid' => $workspaceid], 'offeringid ASC, title ASC')) : [];
$assessments = $ready ? array_values($DB->get_records('local_prequran_assessment', ['workspaceid' => $workspaceid], 'duedate DESC, id DESC', '*', 0, 80)) : [];
$students = pqgp_student_options($workspaceid);
$grades = $ready ? array_values($DB->get_records_sql(
    "SELECT g.*, a.title AS assessment_title, a.assessment_type, u.firstname, u.lastname, u.email
       FROM {local_prequran_grade} g
       JOIN {local_prequran_assessment} a ON a.id = g.assessmentid
  LEFT JOIN {user} u ON u.id = g.studentid
      WHERE g.workspaceid = :workspaceid
   ORDER BY g.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    120
)) : [];
$coursegrades = $ready ? array_values($DB->get_records_sql(
    "SELECT cg.*, u.firstname, u.lastname, u.email, o.title AS offering_title
       FROM {local_prequran_course_grade} cg
  LEFT JOIN {user} u ON u.id = cg.studentid
  LEFT JOIN {local_prequran_course_offering} o ON o.id = cg.offeringid
      WHERE cg.workspaceid = :workspaceid
   ORDER BY cg.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    80
)) : [];
$audits = $ready ? array_values($DB->get_records('local_prequran_grade_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 30)) : [];

// Decorate for the client (names/labels the page computes inline while rendering).
$offeringsout = [];
foreach ($offerings as $offering) {
    $offeringsout[] = ['id' => (int)$offering->id, 'title' => (string)$offering->title];
}
$categoriesout = [];
foreach ($categories as $category) {
    $categoriesout[] = [
        'id' => (int)$category->id,
        'offeringid' => (int)$category->offeringid,
        'category_key' => (string)($category->category_key ?? ''),
        'title' => (string)$category->title,
        'weight_percent' => (string)$category->weight_percent,
        'drop_lowest_count' => (string)$category->drop_lowest_count,
        'status' => (string)$category->status,
    ];
}
$assessmentsout = [];
foreach ($assessments as $assessment) {
    $assessmentsout[] = [
        'id' => (int)$assessment->id,
        'offeringid' => (int)$assessment->offeringid,
        'categoryid' => (int)$assessment->categoryid,
        'title' => (string)$assessment->title,
        'assessment_type' => (string)$assessment->assessment_type,
        'max_points' => (string)$assessment->max_points,
        'grade_impact' => (string)($assessment->grade_impact ?? 'summative'),
        'max_attempts' => (int)($assessment->max_attempts ?? 0),
        'duedate' => (int)($assessment->duedate ?? 0),
        'status' => (string)$assessment->status,
    ];
}
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = ['id' => (int)$student->id, 'name' => fullname($student), 'email' => (string)$student->email];
}
$gradesout = [];
foreach ($grades as $grade) {
    $gradesout[] = [
        'id' => (int)$grade->id,
        'studentid' => (int)$grade->studentid,
        'name' => fullname($grade),
        'assessment_title' => (string)$grade->assessment_title,
        'assessment_type' => (string)$grade->assessment_type,
        'score_percent' => (string)$grade->score_percent,
        'score_points' => (string)$grade->score_points,
        'letter_grade' => (string)$grade->letter_grade,
        'status' => (string)$grade->status,
        'gradedby' => (int)($grade->gradedby ?? 0),
        'moderation_status' => (string)($grade->moderation_status ?? 'not_required'),
    ];
}
$coursegradesout = [];
foreach ($coursegrades as $row) {
    $coursegradesout[] = [
        'studentid' => (int)$row->studentid,
        'offeringid' => (int)$row->offeringid,
        'name' => fullname($row),
        'email' => (string)$row->email,
        'offering_title' => (string)($row->offering_title ?? ''),
        'final_percent' => (string)$row->final_percent,
        'letter_grade' => (string)$row->letter_grade,
        'status' => (string)$row->status,
    ];
}
$auditsout = [];
$nameids = [];
foreach ($audits as $audit) {
    $nameids[] = (int)$audit->studentid;
    $auditsout[] = [
        'action' => (string)$audit->action,
        'studentid' => (int)$audit->studentid,
        'gradeid' => (int)$audit->gradeid,
        'timecreated' => (int)$audit->timecreated,
    ];
}

// Grade disputes/queries (previously write-only dead schema — parents/students
// can now open them from the parent portal; teachers see them here).
$disputesout = [];
if (pqh_table_exists_safe('local_prequran_grade_dispute')) {
    $disputesout = array_values($DB->get_records('local_prequran_grade_dispute',
        ['workspaceid' => $workspaceid], "status ASC, timecreated DESC", '*', 0, 50));
    foreach ($disputesout as $d) {
        $nameids[] = (int)$d->studentid;
        $nameids[] = (int)$d->requesterid;
        $nameids[] = (int)$d->resolvedby;
    }
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'canmanage' => (bool)$canmanage,
    'userid' => $userid,
    'moderation_required' => (string)get_config('local_prequran', 'grade_moderation_mode') === 'require',
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'offerings' => $offeringsout,
    'categories' => $categoriesout,
    'assessments' => $assessmentsout,
    'students' => $studentsout,
    'grades' => $gradesout,
    'coursegrades' => $coursegradesout,
    'audits' => $auditsout,
    'disputes' => $disputesout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
