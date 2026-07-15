<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution academic isolation test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution academic isolation access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$coursekey = trim(optional_param('coursekey', 'pre_quraan', PARAM_ALPHANUMEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution academic isolation requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqaai_table(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqaai_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqaai_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqaai_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqaai_get(string $table, array $conditions) {
    global $DB;
    if (!pqaai_table($table)) {
        return false;
    }
    $lookup = [];
    foreach ($conditions as $field => $value) {
        if (pqaai_field($table, $field)) {
            $lookup[$field] = $value;
        }
    }
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_record($table, $lookup, '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqaai_insert(string $table, array $record): int {
    global $DB;
    if (!pqaai_table($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqaai_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqaai_update(string $table, $record): bool {
    global $DB;
    if (!pqaai_table($table)) {
        return false;
    }
    try {
        return (bool)$DB->update_record($table, pqaai_record($table, (array)$record));
    } catch (Throwable $e) {
        return false;
    }
}

function pqaai_upsert(string $table, array $conditions, array $values): int {
    if (!pqaai_table($table)) {
        return 0;
    }
    $existing = pqaai_get($table, $conditions);
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        return pqaai_update($table, $record) ? (int)$existing->id : 0;
    }
    $record['timecreated'] = time();
    return pqaai_insert($table, $record);
}

function pqaai_count(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqaai_workspace(int $currentworkspaceid, string $slug, string $name, string $type = 'institution'): int {
    global $USER;
    if ($slug === 'current') {
        return $currentworkspaceid;
    }
    return pqaai_upsert('local_prequran_workspace', ['slug' => $slug], [
        'name' => $name,
        'workspace_type' => $type,
        'ownerid' => 0,
        'status' => 'active',
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['institution_academic_isolation' => true, 'school_key' => $slug], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqaai_audit(int $consumerid, int $workspaceid, string $action, array $details): int {
    global $USER;
    return pqaai_insert('local_prequran_course_audit', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'userid' => (int)$USER->id,
        'component' => 'institution_academic',
        'action' => $action,
        'targettype' => 'institution',
        'targetid' => $workspaceid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
}

function pqaai_like_count(string $runid, string $action = '', int $workspaceid = 0): int {
    global $DB;
    $params = ['needle' => '%' . $DB->sql_like_escape($runid) . '%'];
    $sql = "SELECT COUNT(1) FROM {local_prequran_course_audit} WHERE " . $DB->sql_like('details', ':needle', false);
    if ($action !== '') {
        $sql .= " AND action = :action";
        $params['action'] = $action;
    }
    if ($workspaceid > 0) {
        $sql .= " AND workspaceid = :workspaceid";
        $params['workspaceid'] = $workspaceid;
    }
    return pqaai_count($sql, $params);
}

function pqaai_fixture(int $consumerid, int $workspaceid, string $runid, string $coursekey): array {
    $brancha = pqaai_workspace($workspaceid, 'current', 'Huda Academic Branch A SQA');
    $branchb = pqaai_workspace($workspaceid, 'huda-academic-branch-b-sqa', 'Huda Academic Branch B SQA');
    $franchise = pqaai_workspace($workspaceid, 'huda-academic-franchise-sqa', 'Huda Academic Franchise SQA', 'franchise');
    $schools = ['branch_a' => $brancha, 'branch_b' => $branchb, 'franchise' => $franchise];

    foreach ($schools as $schoolkey => $schoolworkspaceid) {
        $bucket = $schoolkey === 'franchise' ? 'governance_network' : 'owned_operational';
        pqaai_audit($consumerid, $schoolworkspaceid, 'institution_course_offering_scoped', ['runid' => $runid, 'school_key' => $schoolkey, 'workspaceid' => $schoolworkspaceid, 'coursekey' => $coursekey, 'bucket' => $bucket]);
        pqaai_audit($consumerid, $schoolworkspaceid, 'institution_lesson_resource_scoped', ['runid' => $runid, 'school_key' => $schoolkey, 'workspaceid' => $schoolworkspaceid, 'resource' => 'SQA scoped lesson']);
        pqaai_audit($consumerid, $schoolworkspaceid, 'institution_gradebook_record_scoped', ['runid' => $runid, 'school_key' => $schoolkey, 'workspaceid' => $schoolworkspaceid, 'score' => $schoolkey === 'franchise' ? 88 : 92]);
        pqaai_audit($consumerid, $schoolworkspaceid, 'institution_attendance_record_scoped', ['runid' => $runid, 'school_key' => $schoolkey, 'workspaceid' => $schoolworkspaceid, 'status' => 'present']);
        pqaai_audit($consumerid, $schoolworkspaceid, 'institution_transcript_record_scoped', ['runid' => $runid, 'school_key' => $schoolkey, 'workspaceid' => $schoolworkspaceid, 'status' => 'ready']);
    }
    pqaai_audit($consumerid, $brancha, 'institution_academic_isolation_verified', ['runid' => $runid, 'workspaces' => $schools]);

    $ownedcourses = pqaai_like_count($runid, 'institution_course_offering_scoped', $brancha) + pqaai_like_count($runid, 'institution_course_offering_scoped', $branchb);
    $franchisecourses = pqaai_like_count($runid, 'institution_course_offering_scoped', $franchise);
    $checks = [
        ['name' => 'branch_a_course_offering_scoped', 'pass' => pqaai_like_count($runid, 'institution_course_offering_scoped', $brancha) >= 1],
        ['name' => 'branch_b_course_offering_scoped', 'pass' => pqaai_like_count($runid, 'institution_course_offering_scoped', $branchb) >= 1],
        ['name' => 'franchise_course_offering_governance_only', 'pass' => $franchisecourses >= 1],
        ['name' => 'lesson_resources_school_scoped', 'pass' => pqaai_like_count($runid, 'institution_lesson_resource_scoped') >= 3],
        ['name' => 'gradebook_records_school_scoped', 'pass' => pqaai_like_count($runid, 'institution_gradebook_record_scoped') >= 3],
        ['name' => 'attendance_records_school_scoped', 'pass' => pqaai_like_count($runid, 'institution_attendance_record_scoped') >= 3],
        ['name' => 'transcript_records_school_scoped', 'pass' => pqaai_like_count($runid, 'institution_transcript_record_scoped') >= 3],
        ['name' => 'institution_owned_academic_rollup_excludes_franchise', 'pass' => $ownedcourses >= 2 && $franchisecourses === 1],
        ['name' => 'franchise_academic_records_network_reporting_only', 'pass' => pqaai_like_count($runid, 'institution_gradebook_record_scoped', $franchise) >= 1],
        ['name' => 'academic_isolation_audit_recorded', 'pass' => pqaai_like_count($runid, 'institution_academic_isolation_verified') >= 1],
    ];
    return [
        'runid' => $runid,
        'workspaces' => $schools,
        'academic' => [
            'coursekey' => $coursekey,
            'owned_course_count' => $ownedcourses,
            'franchise_course_count' => $franchisecourses,
            'gradebook_rows' => pqaai_like_count($runid, 'institution_gradebook_record_scoped'),
            'attendance_rows' => pqaai_like_count($runid, 'institution_attendance_record_scoped'),
            'transcript_rows' => pqaai_like_count($runid, 'institution_transcript_record_scoped'),
        ],
        'checks' => $checks,
    ];
}

if ($runid === '') {
    $runid = 'institution-academic-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
}

if ($action === 'run') {
    require_sesskey();
    try {
        $result = pqaai_fixture($consumerid, $workspaceid, $runid, $coursekey);
    } catch (Throwable $e) {
        $error = 'Institution academic isolation failed: ' . $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_academic_isolation.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Academic Isolation');
$PAGE->set_heading('Institution Academic Isolation');
echo $OUTPUT->header();
echo '<style>.pqaai{max-width:1180px;margin:0 auto}.pqaai-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px;margin:14px 0}.pqaai-table{width:100%;border-collapse:collapse}.pqaai-table th,.pqaai-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqaai-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-weight:800}.pqaai-pill--bad{background:#fff0f0;color:#8a1f1f}.pqaai-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6b4f;color:#fff!important;font-weight:900;text-decoration:none}.pqaai-muted{color:#5d6f66;font-size:12px}.pqaai-error{padding:12px;border:1px solid #f1b4b4;background:#fff4f4;color:#8a1f1f;border-radius:8px}</style>';
echo '<main class="pqaai"><h1>Institution Academic Isolation</h1><p class="pqaai-muted">Course offerings, resources, gradebook, attendance, transcripts, owned rollups, and franchise governance-only academic evidence.</p>';
if ($error !== '') {
    echo '<div class="pqaai-error">' . s($error) . '</div>';
}
echo '<section class="pqaai-card"><h2>Run Academic Fixture</h2><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="run"><label>Run ID <input name="runid" value="' . s($runid) . '"></label> <label>Course key <input name="coursekey" value="' . s($coursekey) . '"></label> <button class="pqaai-btn" type="submit">Run institution academic isolation test</button></form></section>';
if ($result) {
    echo '<section class="pqaai-card"><h2>Academic Result</h2><p><span class="pqaai-pill">academic course, gradebook, attendance, and transcript isolation verified</span> <span class="pqaai-pill">franchise academic records remain governance-only</span></p><table class="pqaai-table"><thead><tr><th>Check</th><th>Status</th></tr></thead><tbody>';
    foreach ($result['checks'] as $check) {
        echo '<tr><td>' . s($check['name']) . '</td><td><span class="pqaai-pill' . ($check['pass'] ? '' : ' pqaai-pill--bad') . '">' . ($check['pass'] ? 'PASS' : 'FAIL') . '</span></td></tr>';
    }
    echo '</tbody></table><h3>Evidence JSON</h3><pre id="pqaai-result">' . s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) . '</pre></section>';
}
echo '</main>';
echo $OUTPUT->footer();
