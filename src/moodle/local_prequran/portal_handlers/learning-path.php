<?php
// ---- report: learning-path (student progress & learning path; read + writes) --
// Ported from local_hubredirect/learning_path.php. The legacy page defines no
// helpers of its own — every function it calls is shared (accesslib pqh_* and
// gradebook_progresslib pqgp_*) — so learning_path_portallib.php is guard-only
// and both shared libraries are required directly below.
//
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent. The legacy
// page stays live in parallel and is untouched.
//
// GET  = the learning-path workspace state the page renders: student options,
//        skill map, mastery records, advancement rules, student paths and
//        intervention plans (all name-decorated), plus workspace + role flags.
// POST = do=save_skill | save_mastery | save_rule | save_path | save_intervention
//        — the page's five write actions verbatim. require_sesskey() is dropped
//        (token auth replaces the session key); save_skill and save_rule keep
//        their canmanage gate; each write echoes ok JSON instead of re-rendering.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/gradebook_progresslib.php');
require_once($CFG->dirroot . '/local/hubredirect/learning_path_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- Access: exact legacy order and outcomes (learning_path.php lines 9-15).
// The legacy redirect on denial (pqh_access_denied -> workspace_dashboard.php)
// becomes a 403 JSON failure with the same message — the portal page cannot
// silently hop origins. There is no pqh_live_security_audit call on this page.
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Learning path access requires teacher or workspace administrator access.');
}
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$ready = pqgp_learning_path_ready();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // Body reader mirroring the legacy optional_param() types (session key check
    // dropped: token auth already authenticated the write).
    $bp = static function (string $key, $default, string $type) use ($body): string {
        return clean_param((string)(($body[$key] ?? $default)), $type);
    };
    $bpint = static function (string $key) use ($body): int {
        return (int)clean_param((string)($body[$key] ?? 0), PARAM_INT);
    };

    if (!$ready) {
        // Legacy: throw invalid_parameter_exception -> caught, shown as $error.
        pqpd_fail(400, 'Learning path tables are not installed yet. Run Moodle upgrade.');
    }
    $now = time();

    // -- write: save_skill (legacy action=save_skill, verbatim; canmanage) -------
    if ($do === 'save_skill' && $canmanage) {
        $record = (object)[
            'workspaceid' => $workspaceid,
            'skill_key' => $bp('skill_key', '', PARAM_ALPHANUMEXT),
            'domain' => $bp('domain', 'quran', PARAM_ALPHANUMEXT),
            'title' => $bp('title', '', PARAM_TEXT),
            'description' => $bp('description', '', PARAM_TEXT),
            'level_band' => $bp('level_band', '', PARAM_TEXT),
            'prerequisite_keys' => $bp('prerequisite_keys', '', PARAM_TEXT),
            'status' => $bp('status', 'active', PARAM_ALPHANUMEXT),
            'sortorder' => $bpint('sortorder'),
            'createdby' => $userid,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $DB->insert_record('local_prequran_skill', $record);
        echo json_encode(['ok' => true, 'message' => 'Skill map item saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: save_mastery (legacy action=save_mastery, verbatim upsert) -------
    if ($do === 'save_mastery') {
        $studentid = $bpint('studentid');
        $skillid = $bpint('skillid');
        $existing = $DB->get_record('local_prequran_skill_mastery', ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'skillid' => $skillid], '*', IGNORE_MISSING);
        $record = (object)[
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'skillid' => $skillid,
            'mastery_status' => $bp('mastery_status', 'introduced', PARAM_ALPHANUMEXT),
            'mastery_percent' => $bp('mastery_percent', '0', PARAM_TEXT),
            'evidence_json' => pqgp_json(['evidence' => $bp('evidence', '', PARAM_TEXT)]),
            'teacher_comment' => $bp('teacher_comment', '', PARAM_TEXT),
            'assessedby' => $userid,
            'assessedat' => $now,
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_skill_mastery', $record);
        } else {
            $DB->insert_record('local_prequran_skill_mastery', $record);
        }
        echo json_encode(['ok' => true, 'message' => 'Mastery record saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: save_rule (legacy action=save_rule, verbatim; canmanage) ---------
    if ($do === 'save_rule' && $canmanage) {
        $record = (object)[
            'workspaceid' => $workspaceid,
            'from_level' => $bp('from_level', '', PARAM_TEXT),
            'to_level' => $bp('to_level', '', PARAM_TEXT),
            'required_mastery_percent' => $bp('required_mastery_percent', '80', PARAM_TEXT),
            'required_attendance_percent' => $bp('required_attendance_percent', '70', PARAM_TEXT),
            'required_grade_percent' => $bp('required_grade_percent', '70', PARAM_TEXT),
            'recommended_course_key' => $bp('recommended_course_key', '', PARAM_ALPHANUMEXT),
            'status' => $bp('status', 'active', PARAM_ALPHANUMEXT),
            'notes' => $bp('notes', '', PARAM_TEXT),
            'createdby' => $userid,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $DB->insert_record('local_prequran_adv_rule', $record);
        echo json_encode(['ok' => true, 'message' => 'Advancement rule saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: save_path (legacy action=save_path, verbatim upsert) -------------
    if ($do === 'save_path') {
        $studentid = $bpint('studentid');
        $currentlevel = $bp('current_level', '', PARAM_TEXT);
        $recommendation = pqgp_recommend_next_course($workspaceid, $studentid, $currentlevel);
        $existing = $DB->get_record('local_prequran_student_path', ['workspaceid' => $workspaceid, 'studentid' => $studentid], '*', IGNORE_MISSING);
        $record = (object)[
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'current_level' => $currentlevel,
            'placement_level' => $bp('placement_level', '', PARAM_TEXT),
            'advancement_status' => $bp('advancement_status', (string)$recommendation['status'], PARAM_ALPHANUMEXT),
            'recommended_course_key' => $bp('recommended_course_key', (string)$recommendation['course_key'], PARAM_ALPHANUMEXT),
            'recommendation_reason' => $bp('recommendation_reason', (string)$recommendation['reason'], PARAM_TEXT),
            'teacher_comment' => $bp('teacher_comment', '', PARAM_TEXT),
            'reviewedby' => $userid,
            'reviewedat' => $now,
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_student_path', $record);
        } else {
            $DB->insert_record('local_prequran_student_path', $record);
        }
        echo json_encode(['ok' => true, 'message' => 'Student learning path saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: save_intervention (legacy action=save_intervention, verbatim) ----
    if ($do === 'save_intervention') {
        $status = $bp('status', 'open', PARAM_ALPHANUMEXT);
        $record = (object)[
            'workspaceid' => $workspaceid,
            'studentid' => $bpint('studentid'),
            'teacherid' => $userid,
            'plan_type' => $bp('plan_type', 'learning_support', PARAM_ALPHANUMEXT),
            'status' => $status,
            'priority' => $bp('priority', 'normal', PARAM_ALPHANUMEXT),
            'concern' => $bp('concern', '', PARAM_TEXT),
            'goal' => $bp('goal', '', PARAM_TEXT),
            'actions' => $bp('actions', '', PARAM_TEXT),
            'duedate' => strtotime($bp('duedate', '', PARAM_TEXT) . ' 00:00:00') ?: 0,
            'resolution' => $bp('resolution', '', PARAM_TEXT),
            'resolvedby' => $status === 'resolved' ? $userid : 0,
            'resolvedat' => $status === 'resolved' ? $now : 0,
            'createdby' => $userid,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $DB->insert_record('local_prequran_intervention', $record);
        echo json_encode(['ok' => true, 'message' => 'Intervention plan saved.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown learning-path action.');
}

// ---- GET: the learning-path workspace state (same queries as the page) --------
$students = pqgp_student_options($workspaceid);
$skills = $ready ? array_values($DB->get_records('local_prequran_skill', ['workspaceid' => $workspaceid], 'domain ASC, sortorder ASC, title ASC')) : [];
$mastery = $ready ? array_values($DB->get_records_sql(
    "SELECT sm.*, s.title AS skill_title, s.domain, u.firstname, u.lastname, u.email
       FROM {local_prequran_skill_mastery} sm
       JOIN {local_prequran_skill} s ON s.id = sm.skillid
  LEFT JOIN {user} u ON u.id = sm.studentid
      WHERE sm.workspaceid = :workspaceid
   ORDER BY sm.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    120
)) : [];
$paths = $ready ? array_values($DB->get_records_sql(
    "SELECT sp.*, u.firstname, u.lastname, u.email
       FROM {local_prequran_student_path} sp
  LEFT JOIN {user} u ON u.id = sp.studentid
      WHERE sp.workspaceid = :workspaceid
   ORDER BY sp.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    80
)) : [];
$rules = $ready ? array_values($DB->get_records('local_prequran_adv_rule', ['workspaceid' => $workspaceid], 'from_level ASC')) : [];
$interventions = $ready ? array_values($DB->get_records_sql(
    "SELECT i.*, u.firstname, u.lastname, u.email
       FROM {local_prequran_intervention} i
  LEFT JOIN {user} u ON u.id = i.studentid
      WHERE i.workspaceid = :workspaceid
   ORDER BY i.status ASC, i.duedate ASC, i.id DESC",
    ['workspaceid' => $workspaceid],
    0,
    80
)) : [];

// Decorate the client-facing rows with the display name the page renders inline
// via fullname()/select option labels — the legacy joins already carry the name
// parts, so this is purely presentational (no extra queries).
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = [
        'id' => (int)$student->id,
        'name' => fullname($student),
        'email' => (string)$student->email,
    ];
}
$namerow = static function ($row): string {
    return fullname((object)[
        'firstname' => (string)($row->firstname ?? ''),
        'lastname' => (string)($row->lastname ?? ''),
    ]);
};
foreach ($mastery as $row) {
    $row->fullname = $namerow($row);
}
foreach ($paths as $row) {
    $row->fullname = $namerow($row);
}
foreach ($interventions as $row) {
    $row->fullname = $namerow($row);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'canmanage' => $canmanage,
    'students' => $studentsout,
    'skills' => $skills,
    'mastery' => $mastery,
    'paths' => $paths,
    'rules' => $rules,
    'interventions' => $interventions,
], JSON_UNESCAPED_SLASHES);
exit;
