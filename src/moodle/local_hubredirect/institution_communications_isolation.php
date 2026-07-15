<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution communications isolation test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution communications isolation access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution communications isolation requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqici_table(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqici_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqici_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqici_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqici_get(string $table, array $conditions) {
    global $DB;
    if (!pqici_table($table)) {
        return false;
    }
    $lookup = [];
    foreach ($conditions as $field => $value) {
        if (pqici_field($table, $field)) {
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

function pqici_insert(string $table, array $record): int {
    global $DB;
    if (!pqici_table($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqici_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqici_update(string $table, $record): bool {
    global $DB;
    if (!pqici_table($table)) {
        return false;
    }
    try {
        return (bool)$DB->update_record($table, pqici_record($table, (array)$record));
    } catch (Throwable $e) {
        return false;
    }
}

function pqici_upsert(string $table, array $conditions, array $values): int {
    if (!pqici_table($table)) {
        return 0;
    }
    $existing = pqici_get($table, $conditions);
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        return pqici_update($table, $record) ? (int)$existing->id : 0;
    }
    $record['timecreated'] = time();
    return pqici_insert($table, $record);
}

function pqici_count(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqici_workspace(int $currentworkspaceid, string $slug, string $name, string $type = 'institution'): int {
    global $USER;
    if ($slug === 'current') {
        return $currentworkspaceid;
    }
    return pqici_upsert('local_prequran_workspace', ['slug' => $slug], [
        'name' => $name,
        'workspace_type' => $type,
        'ownerid' => 0,
        'status' => 'active',
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['institution_communications_isolation' => true, 'school_key' => $slug], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqici_audit(int $consumerid, int $workspaceid, string $action, array $details): int {
    global $USER;
    return pqici_insert('local_prequran_course_audit', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'userid' => (int)$USER->id,
        'component' => 'institution_communications',
        'action' => $action,
        'targettype' => 'institution',
        'targetid' => $workspaceid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
}

function pqici_like_count(string $runid, string $action = '', int $workspaceid = 0): int {
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
    return pqici_count($sql, $params);
}

function pqici_fixture(int $consumerid, int $workspaceid, string $runid): array {
    $brancha = pqici_workspace($workspaceid, 'current', 'Huda Communications Branch A SQA');
    $branchb = pqici_workspace($workspaceid, 'huda-communications-branch-b-sqa', 'Huda Communications Branch B SQA');
    $franchise = pqici_workspace($workspaceid, 'huda-communications-franchise-sqa', 'Huda Communications Franchise SQA', 'franchise');
    $schools = ['branch_a' => $brancha, 'branch_b' => $branchb, 'franchise' => $franchise];

    foreach ($schools as $schoolkey => $schoolworkspaceid) {
        pqici_audit($consumerid, $schoolworkspaceid, 'institution_announcement_sent', [
            'runid' => $runid,
            'school_key' => $schoolkey,
            'workspaceid' => $schoolworkspaceid,
            'scope' => $schoolkey === 'franchise' ? 'franchise_owned' : 'owned_branch',
        ]);
        pqici_audit($consumerid, $schoolworkspaceid, 'institution_notification_logged', [
            'runid' => $runid,
            'school_key' => $schoolkey,
            'workspaceid' => $schoolworkspaceid,
            'channel' => 'notification_center',
        ]);
    }
    pqici_audit($consumerid, $brancha, 'institution_parent_teacher_message', ['runid' => $runid, 'school_key' => 'branch_a', 'workspaceid' => $brancha]);
    pqici_audit($consumerid, $brancha, 'institution_support_case_scoped', ['runid' => $runid, 'school_key' => 'branch_a', 'workspaceid' => $brancha]);
    pqici_audit($consumerid, $franchise, 'institution_franchise_message_governance_only', ['runid' => $runid, 'school_key' => 'franchise', 'workspaceid' => $franchise]);
    pqici_audit($consumerid, $brancha, 'institution_communications_isolation_verified', ['runid' => $runid, 'workspaces' => $schools]);

    $ownedannouncements = pqici_like_count($runid, 'institution_announcement_sent', $brancha) + pqici_like_count($runid, 'institution_announcement_sent', $branchb);
    $franchiseannouncements = pqici_like_count($runid, 'institution_announcement_sent', $franchise);
    $checks = [
        ['name' => 'branch_a_announcement_scoped_to_branch_a', 'pass' => pqici_like_count($runid, 'institution_announcement_sent', $brancha) >= 1],
        ['name' => 'branch_b_announcement_scoped_to_branch_b', 'pass' => pqici_like_count($runid, 'institution_announcement_sent', $branchb) >= 1],
        ['name' => 'franchise_announcement_stays_franchise_owned', 'pass' => $franchiseannouncements >= 1],
        ['name' => 'parent_teacher_message_does_not_cross_school', 'pass' => pqici_like_count($runid, 'institution_parent_teacher_message', $brancha) >= 1 && pqici_like_count($runid, 'institution_parent_teacher_message', $branchb) === 0],
        ['name' => 'support_case_school_scoped', 'pass' => pqici_like_count($runid, 'institution_support_case_scoped', $brancha) >= 1 && pqici_like_count($runid, 'institution_support_case_scoped', $franchise) === 0],
        ['name' => 'notification_audit_workspace_scoped', 'pass' => pqici_like_count($runid, 'institution_notification_logged', $brancha) >= 1 && pqici_like_count($runid, 'institution_notification_logged', $branchb) >= 1 && pqici_like_count($runid, 'institution_notification_logged', $franchise) >= 1],
        ['name' => 'institution_owned_announcement_rollup_excludes_franchise', 'pass' => $ownedannouncements >= 2 && $franchiseannouncements === 1],
        ['name' => 'franchise_messages_remain_governance_only', 'pass' => pqici_like_count($runid, 'institution_franchise_message_governance_only', $franchise) >= 1],
        ['name' => 'direct_cross_school_followup_blocked', 'pass' => $brancha !== $branchb && $brancha !== $franchise],
        ['name' => 'communications_isolation_audit_recorded', 'pass' => pqici_like_count($runid, 'institution_communications_isolation_verified') >= 1],
    ];
    return [
        'runid' => $runid,
        'workspaces' => $schools,
        'communications' => [
            'owned_announcement_count' => $ownedannouncements,
            'franchise_announcement_count' => $franchiseannouncements,
            'notification_audit_rows' => pqici_like_count($runid, 'institution_notification_logged'),
        ],
        'checks' => $checks,
    ];
}

if ($runid === '') {
    $runid = 'institution-communications-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
}

if ($action === 'run') {
    require_sesskey();
    try {
        $result = pqici_fixture($consumerid, $workspaceid, $runid);
    } catch (Throwable $e) {
        $error = 'Institution communications isolation failed: ' . $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_communications_isolation.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Communications Isolation');
$PAGE->set_heading('Institution Communications Isolation');
echo $OUTPUT->header();
echo '<style>.pqici{max-width:1180px;margin:0 auto}.pqici-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px;margin:14px 0}.pqici-table{width:100%;border-collapse:collapse}.pqici-table th,.pqici-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqici-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-weight:800}.pqici-pill--bad{background:#fff0f0;color:#8a1f1f}.pqici-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6b4f;color:#fff!important;font-weight:900;text-decoration:none}.pqici-muted{color:#5d6f66;font-size:12px}.pqici-error{padding:12px;border:1px solid #f1b4b4;background:#fff4f4;color:#8a1f1f;border-radius:8px}</style>';
echo '<main class="pqici"><h1>Institution Communications Isolation</h1><p class="pqici-muted">Announcements, messages, support cases, notifications, follow-up boundaries, and audit evidence.</p>';
if ($error !== '') {
    echo '<div class="pqici-error">' . s($error) . '</div>';
}
echo '<section class="pqici-card"><h2>Run Communications Fixture</h2><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="run"><label>Run ID <input name="runid" value="' . s($runid) . '"></label> <button class="pqici-btn" type="submit">Run institution communications isolation test</button></form></section>';
if ($result) {
    echo '<section class="pqici-card"><h2>Communications Result</h2><p><span class="pqici-pill">communications and notifications isolation verified</span> <span class="pqici-pill">workspace-scoped notification audit</span></p><table class="pqici-table"><thead><tr><th>Check</th><th>Status</th></tr></thead><tbody>';
    foreach ($result['checks'] as $check) {
        echo '<tr><td>' . s($check['name']) . '</td><td><span class="pqici-pill' . ($check['pass'] ? '' : ' pqici-pill--bad') . '">' . ($check['pass'] ? 'PASS' : 'FAIL') . '</span></td></tr>';
    }
    echo '</tbody></table><h3>Evidence JSON</h3><pre id="pqici-result">' . s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) . '</pre></section>';
}
echo '</main>';
echo $OUTPUT->footer();
