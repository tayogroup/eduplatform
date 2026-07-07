<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/gradebook_progresslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Learning path access requires teacher or workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Learning path access denied');
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$ready = pqgp_learning_path_ready();
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!$ready) {
            throw new invalid_parameter_exception('Learning path tables are not installed yet. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_skill' && $canmanage) {
            $record = (object)[
                'workspaceid' => $workspaceid,
                'skill_key' => optional_param('skill_key', '', PARAM_ALPHANUMEXT),
                'domain' => optional_param('domain', 'quran', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'description' => optional_param('description', '', PARAM_TEXT),
                'level_band' => optional_param('level_band', '', PARAM_TEXT),
                'prerequisite_keys' => optional_param('prerequisite_keys', '', PARAM_TEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'sortorder' => optional_param('sortorder', 0, PARAM_INT),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $DB->insert_record('local_prequran_skill', $record);
            $notice = 'Skill map item saved.';
        } else if ($action === 'save_mastery') {
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $skillid = optional_param('skillid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_skill_mastery', ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'skillid' => $skillid], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'skillid' => $skillid,
                'mastery_status' => optional_param('mastery_status', 'introduced', PARAM_ALPHANUMEXT),
                'mastery_percent' => optional_param('mastery_percent', '0', PARAM_TEXT),
                'evidence_json' => pqgp_json(['evidence' => optional_param('evidence', '', PARAM_TEXT)]),
                'teacher_comment' => optional_param('teacher_comment', '', PARAM_TEXT),
                'assessedby' => (int)$USER->id,
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
            $notice = 'Mastery record saved.';
        } else if ($action === 'save_rule' && $canmanage) {
            $record = (object)[
                'workspaceid' => $workspaceid,
                'from_level' => optional_param('from_level', '', PARAM_TEXT),
                'to_level' => optional_param('to_level', '', PARAM_TEXT),
                'required_mastery_percent' => optional_param('required_mastery_percent', '80', PARAM_TEXT),
                'required_attendance_percent' => optional_param('required_attendance_percent', '70', PARAM_TEXT),
                'required_grade_percent' => optional_param('required_grade_percent', '70', PARAM_TEXT),
                'recommended_course_key' => optional_param('recommended_course_key', '', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $DB->insert_record('local_prequran_adv_rule', $record);
            $notice = 'Advancement rule saved.';
        } else if ($action === 'save_path') {
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $currentlevel = optional_param('current_level', '', PARAM_TEXT);
            $recommendation = pqgp_recommend_next_course($workspaceid, $studentid, $currentlevel);
            $existing = $DB->get_record('local_prequran_student_path', ['workspaceid' => $workspaceid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'current_level' => $currentlevel,
                'placement_level' => optional_param('placement_level', '', PARAM_TEXT),
                'advancement_status' => optional_param('advancement_status', (string)$recommendation['status'], PARAM_ALPHANUMEXT),
                'recommended_course_key' => optional_param('recommended_course_key', (string)$recommendation['course_key'], PARAM_ALPHANUMEXT),
                'recommendation_reason' => optional_param('recommendation_reason', (string)$recommendation['reason'], PARAM_TEXT),
                'teacher_comment' => optional_param('teacher_comment', '', PARAM_TEXT),
                'reviewedby' => (int)$USER->id,
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
            $notice = 'Student learning path saved.';
        } else if ($action === 'save_intervention') {
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => optional_param('studentid', 0, PARAM_INT),
                'teacherid' => (int)$USER->id,
                'plan_type' => optional_param('plan_type', 'learning_support', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'open', PARAM_ALPHANUMEXT),
                'priority' => optional_param('priority', 'normal', PARAM_ALPHANUMEXT),
                'concern' => optional_param('concern', '', PARAM_TEXT),
                'goal' => optional_param('goal', '', PARAM_TEXT),
                'actions' => optional_param('actions', '', PARAM_TEXT),
                'duedate' => strtotime(optional_param('duedate', '', PARAM_TEXT) . ' 00:00:00') ?: 0,
                'resolution' => optional_param('resolution', '', PARAM_TEXT),
                'resolvedby' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'resolved' ? (int)$USER->id : 0,
                'resolvedat' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'resolved' ? $now : 0,
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $DB->insert_record('local_prequran_intervention', $record);
            $notice = 'Intervention plan saved.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/learning_path.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Progress And Learning Path');
$PAGE->set_heading('Student Progress And Learning Path');

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

echo $OUTPUT->header();
echo '<style>.pqlp-wrap{max-width:1180px;margin:0 auto}.pqlp-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px}.pqlp-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqlp-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqlp-field{margin-bottom:10px}.pqlp-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqlp-input,.pqlp-select,.pqlp-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqlp-textarea{min-height:70px}.pqlp-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqlp-btn--light{background:#f7fbf8;color:#173044}.pqlp-table{width:100%;border-collapse:collapse}.pqlp-table th,.pqlp-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqlp-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqlp-muted{color:#617064;font-size:12px}.pqlp-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqlp-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqlp-grid,.pqlp-top{display:block}}</style>';
echo '<div class="pqlp-wrap"><div class="pqlp-top"><div><h2>Student Progress And Learning Path</h2><div class="pqlp-muted">' . s($workspace->name) . ' placement, advancement rules, mastery, skill maps, recommendations, comments, and intervention plans.</div></div><a class="pqlp-btn pqlp-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqlp-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqlp-error">' . s($error) . '</div>'; }
if (!$ready) { echo '<div class="pqlp-error">Learning path schema is not ready. Run the Moodle local_prequran upgrade.</div>'; }
echo '<div class="pqlp-grid"><section class="pqlp-panel">';
if ($canmanage) {
    echo '<h3>Skill Map</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_skill">';
    foreach ([['skill_key','Skill key'],['domain','Domain'],['title','Title'],['level_band','Level band'],['prerequisite_keys','Prerequisites'],['sortorder','Sort order'],['status','Status']] as $field) { echo '<div class="pqlp-field"><label>' . s($field[1]) . '</label><input class="pqlp-input" name="' . s($field[0]) . '"></div>'; }
    echo '<div class="pqlp-field"><label>Description</label><textarea class="pqlp-textarea" name="description"></textarea></div><button class="pqlp-btn" type="submit">Save Skill</button></form><hr><h3>Advancement Rule</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_rule">';
    foreach ([['from_level','From level'],['to_level','To level'],['required_mastery_percent','Required mastery %'],['required_attendance_percent','Required attendance %'],['required_grade_percent','Required grade %'],['recommended_course_key','Recommended course key'],['status','Status']] as $field) { echo '<div class="pqlp-field"><label>' . s($field[1]) . '</label><input class="pqlp-input" name="' . s($field[0]) . '"></div>'; }
    echo '<div class="pqlp-field"><label>Notes</label><textarea class="pqlp-textarea" name="notes"></textarea></div><button class="pqlp-btn" type="submit">Save Rule</button></form><hr>';
}
echo '<h3>Mastery Tracking</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_mastery"><div class="pqlp-field"><label>Student</label><select class="pqlp-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student) . ' / ' . $student->email) . '</option>'; }
echo '</select></div><div class="pqlp-field"><label>Skill</label><select class="pqlp-select" name="skillid">';
foreach ($skills as $skill) { echo '<option value="' . (int)$skill->id . '">' . s($skill->title . ' / ' . $skill->domain) . '</option>'; }
echo '</select></div>';
foreach ([['mastery_status','Mastery status'],['mastery_percent','Mastery percent'],['evidence','Evidence']] as $field) { echo '<div class="pqlp-field"><label>' . s($field[1]) . '</label><input class="pqlp-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqlp-field"><label>Teacher comment</label><textarea class="pqlp-textarea" name="teacher_comment"></textarea></div><button class="pqlp-btn" type="submit">Save Mastery</button></form><hr><h3>Student Path</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_path"><div class="pqlp-field"><label>Student</label><select class="pqlp-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div>';
foreach ([['placement_level','Placement level'],['current_level','Current level'],['advancement_status','Advancement status'],['recommended_course_key','Recommended course key'],['recommendation_reason','Recommendation reason']] as $field) { echo '<div class="pqlp-field"><label>' . s($field[1]) . '</label><input class="pqlp-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqlp-field"><label>Teacher comment</label><textarea class="pqlp-textarea" name="teacher_comment"></textarea></div><button class="pqlp-btn" type="submit">Save Path</button></form><hr><h3>Intervention Plan</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_intervention"><div class="pqlp-field"><label>Student</label><select class="pqlp-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div>';
foreach ([['plan_type','Plan type'],['priority','Priority'],['status','Status'],['duedate','Due date']] as $field) { echo '<div class="pqlp-field"><label>' . s($field[1]) . '</label><input class="pqlp-input" name="' . s($field[0]) . '"></div>'; }
foreach ([['concern','Concern'],['goal','Goal'],['actions','Actions'],['resolution','Resolution']] as $field) { echo '<div class="pqlp-field"><label>' . s($field[1]) . '</label><textarea class="pqlp-textarea" name="' . s($field[0]) . '"></textarea></div>'; }
echo '<button class="pqlp-btn" type="submit">Save Intervention</button></form></section><section class="pqlp-panel"><h3>Student Paths</h3><table class="pqlp-table"><thead><tr><th>Student</th><th>Level</th><th>Recommendation</th></tr></thead><tbody>';
foreach ($paths as $path) { echo '<tr><td><strong>' . s(fullname($path)) . '</strong><div class="pqlp-muted">' . s($path->email) . '</div></td><td>' . s($path->placement_level . ' -> ' . $path->current_level) . '<br><span class="pqlp-pill">' . s($path->advancement_status) . '</span></td><td>' . s($path->recommended_course_key) . '<div class="pqlp-muted">' . s($path->recommendation_reason) . '</div></td></tr>'; }
if (!$paths) { echo '<tr><td colspan="3" class="pqlp-muted">No student paths yet.</td></tr>'; }
echo '</tbody></table><h3>Mastery</h3><table class="pqlp-table"><thead><tr><th>Student</th><th>Skill</th><th>Mastery</th></tr></thead><tbody>';
foreach ($mastery as $row) { echo '<tr><td><strong>' . s(fullname($row)) . '</strong></td><td>' . s($row->skill_title . ' / ' . $row->domain) . '</td><td><span class="pqlp-pill">' . s($row->mastery_status . ' / ' . $row->mastery_percent . '%') . '</span><div class="pqlp-muted">' . s($row->teacher_comment) . '</div></td></tr>'; }
if (!$mastery) { echo '<tr><td colspan="3" class="pqlp-muted">No mastery records yet.</td></tr>'; }
echo '</tbody></table><h3>Advancement Rules</h3><table class="pqlp-table"><thead><tr><th>From</th><th>To</th><th>Requirements</th></tr></thead><tbody>';
foreach ($rules as $rule) { echo '<tr><td>' . s($rule->from_level) . '</td><td>' . s($rule->to_level . ' / ' . $rule->recommended_course_key) . '</td><td>Mastery ' . s($rule->required_mastery_percent) . '% / Attendance ' . s($rule->required_attendance_percent) . '% / Grade ' . s($rule->required_grade_percent) . '%</td></tr>'; }
if (!$rules) { echo '<tr><td colspan="3" class="pqlp-muted">No advancement rules yet.</td></tr>'; }
echo '</tbody></table><h3>Intervention Plans</h3><table class="pqlp-table"><thead><tr><th>Student</th><th>Plan</th><th>Status</th></tr></thead><tbody>';
foreach ($interventions as $plan) { echo '<tr><td><strong>' . s(fullname($plan)) . '</strong></td><td>' . s($plan->plan_type . ' / ' . $plan->priority) . '<div class="pqlp-muted">' . s($plan->goal) . '</div></td><td><span class="pqlp-pill">' . s($plan->status) . '</span></td></tr>'; }
if (!$interventions) { echo '<tr><td colspan="3" class="pqlp-muted">No intervention plans yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
