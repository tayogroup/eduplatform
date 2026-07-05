<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and admins can manage workspace people.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Workspace people access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening workspace people.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Workspace people unavailable'
    );
}
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_people.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Workspace People');
$PAGE->set_heading('Workspace People');
$PAGE->add_body_class('pqw-people-page');

function pqwp_find_user(string $needle): ?stdClass {
    global $DB, $CFG;
    $needle = trim($needle);
    if ($needle === '') {
        return null;
    }
    if (ctype_digit($needle)) {
        $user = core_user::get_user((int)$needle, '*', IGNORE_MISSING);
        return $user && empty($user->deleted) ? $user : null;
    }
    $user = $DB->get_record('user', [
        'email' => $needle,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    if ($user) {
        return $user;
    }
    return $DB->get_record('user', [
        'username' => strtolower($needle),
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE) ?: null;
}

function pqwp_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwp_unique_username(string $base): string {
    global $DB;

    $base = strtolower(trim($base));
    $base = preg_replace('/@.*$/', '', $base) ?? '';
    $base = preg_replace('/[^a-z0-9._-]+/', '.', $base) ?? '';
    $base = trim($base, '.-_');
    if ($base === '') {
        $base = 'workspace.user';
    }
    $base = substr($base, 0, 82);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'deleted' => 0])) {
        $suffix++;
        $username = substr($base, 0, 82 - strlen((string)$suffix) - 1) . '.' . $suffix;
    }
    return $username;
}

function pqwp_create_moodle_user(string $firstname, string $lastname, string $email, string $username = '', string $accounttype = 'workspace'): array {
    global $CFG;

    $firstname = trim($firstname);
    $lastname = trim($lastname);
    $email = clean_param(trim($email), PARAM_EMAIL);
    $username = clean_param(trim($username), PARAM_USERNAME);
    if ($firstname === '' || $lastname === '') {
        throw new invalid_parameter_exception('First name and last name are required to create a Moodle user.');
    }
    if ($email === '' || !validate_email($email)) {
        throw new invalid_parameter_exception('A valid email address is required to create a Moodle user.');
    }
    if ($username === '') {
        $username = pqwp_unique_username($email);
    } else {
        $username = pqwp_unique_username($username);
    }

    $password = generate_password(12);
    $user = (object)[
        'auth' => 'manual',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
        'username' => $username,
        'password' => $password,
        'firstname' => $firstname,
        'lastname' => $lastname,
        'email' => $email,
        'emailstop' => 0,
        'country' => '',
        'city' => '',
        'timezone' => '99',
        'lang' => $CFG->lang ?? 'en',
    ];

    $userid = (int)user_create_user($user, true, false);
    $idnumber = pqh_assign_account_id($userid, $accounttype);
    return [$userid, $username, $password, $idnumber];
}

function pqwp_upsert_member(int $workspaceid, int $userid, string $role, int $createdby): void {
    global $DB;
    $now = time();
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], '*', IGNORE_MISSING);
    $record = (object)[
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => '',
        'createdby' => $createdby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_workspace_member', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_workspace_member', $record);
}

function pqwp_workspace_members(int $workspaceid, array $roles): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member') || !$roles) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return array_values($DB->get_records_sql(
        "SELECT wm.id, wm.userid, wm.workspace_role, wm.status, wm.timemodified,
                u.firstname, u.lastname, u.email, u.username, u.idnumber
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
            AND wm.workspace_role {$insql}
       ORDER BY u.lastname ASC, u.firstname ASC, wm.userid ASC",
        $params
    ));
}

function pqwp_all_workspace_members(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT wm.id, wm.userid, wm.workspace_role, wm.status, wm.timemodified,
                u.firstname, u.lastname, u.email, u.username, u.idnumber
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
       ORDER BY wm.status ASC, wm.workspace_role ASC, u.lastname ASC, u.firstname ASC, wm.userid ASC",
        ['workspaceid' => $workspaceid]
    ));
}

function pqwp_active_manager_count(int $workspaceid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return 0;
    }
    [$insql, $params] = $DB->get_in_or_equal(['owner', 'admin'], SQL_PARAMS_NAMED, 'managerrole');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return (int)$DB->count_records_select(
        'local_prequran_workspace_member',
        "workspaceid = :workspaceid AND status = :status AND workspace_role {$insql}",
        $params
    );
}

function pqwp_set_member_status(int $workspaceid, int $memberid, string $status, int $actorid): string {
    global $DB;
    if (!in_array($status, ['active', 'inactive'], true)) {
        throw new invalid_parameter_exception('Invalid member status.');
    }
    $member = $DB->get_record('local_prequran_workspace_member', [
        'id' => $memberid,
        'workspaceid' => $workspaceid,
    ], '*', IGNORE_MISSING);
    if (!$member) {
        throw new invalid_parameter_exception('Workspace member was not found.');
    }
    if ($status === 'inactive'
        && (int)$member->userid === $actorid
        && in_array((string)$member->workspace_role, ['owner', 'admin'], true)) {
        throw new invalid_parameter_exception('You cannot deactivate your own workspace management access.');
    }
    if ($status === 'inactive'
        && (string)$member->status === 'active'
        && in_array((string)$member->workspace_role, ['owner', 'admin'], true)
        && pqwp_active_manager_count($workspaceid) <= 1) {
        throw new invalid_parameter_exception('At least one active owner or admin must remain in the workspace.');
    }
    $member->status = $status;
    $member->timemodified = time();
    $DB->update_record('local_prequran_workspace_member', $member);
    return $status === 'active' ? 'Workspace member reactivated.' : 'Workspace member deactivated.';
}

function pqwp_is_workspace_member(int $workspaceid, int $userid, array $roles): bool {
    global $DB;
    if ($workspaceid <= 0 || $userid <= 0 || !$roles || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return false;
    }
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'mrole');
    $params['workspaceid'] = $workspaceid;
    $params['userid'] = $userid;
    $params['status'] = 'active';
    return $DB->record_exists_select(
        'local_prequran_workspace_member',
        "workspaceid = :workspaceid AND userid = :userid AND status = :status AND workspace_role {$insql}",
        $params
    );
}

function pqwp_upsert_assignment(int $workspaceid, int $teacherid, int $studentid, int $assignedby): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_student')) {
        throw new invalid_parameter_exception('Teacher-student assignment table is not ready. Run the local_prequran Moodle upgrade.');
    }
    $now = time();
    $conditions = [
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
    ];
    $existing = $DB->get_record('local_prequran_teacher_student', $conditions, '*', IGNORE_MISSING);
    if (!$existing) {
        $existing = $DB->get_record('local_prequran_teacher_student', [
            'teacherid' => $teacherid,
            'studentid' => $studentid,
        ], '*', IGNORE_MISSING);
    }
    $record = (object)[
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'cohortid' => 0,
        'status' => 'active',
        'assignedby' => $assignedby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_teacher_student', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_teacher_student', $record);
}

function pqwp_assignments(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_student')) {
        return [];
    }
    $workspacefilter = pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')
        ? 'ts.workspaceid = :workspaceid'
        : '1 = 0';
    return array_values($DB->get_records_sql(
        "SELECT ts.id, ts.workspaceid, ts.teacherid, ts.studentid, ts.status, ts.timemodified,
                tu.firstname AS teacher_firstname, tu.lastname AS teacher_lastname, tu.email AS teacher_email, tu.idnumber AS teacher_idnumber,
                su.firstname AS student_firstname, su.lastname AS student_lastname, su.email AS student_email, su.idnumber AS student_idnumber
           FROM {local_prequran_teacher_student} ts
           JOIN {user} tu ON tu.id = ts.teacherid
           JOIN {user} su ON su.id = ts.studentid
          WHERE {$workspacefilter}
            AND ts.status = :status
       ORDER BY ts.timemodified DESC, ts.id DESC",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    ));
}

function pqwp_candidate_users(int $limit = 80): array {
    global $DB, $CFG;
    return array_values($DB->get_records_sql(
        "SELECT id, username, email, firstname, lastname, idnumber
           FROM {user}
          WHERE deleted = 0
            AND suspended = 0
            AND mnethostid = :mnethostid
            AND id > 1
       ORDER BY id DESC",
        ['mnethostid' => $CFG->mnet_localhost_id],
        0,
        $limit
    ));
}

function pqwp_likely_role(stdClass $user): string {
    $haystack = strtolower(trim(($user->username ?? '') . ' ' . ($user->email ?? '') . ' ' . ($user->firstname ?? '') . ' ' . ($user->lastname ?? '')));
    if (strpos($haystack, 'parent') !== false) {
        return 'parent';
    }
    if (strpos($haystack, 'teacher') !== false || strpos($haystack, 'principal') !== false || strpos($haystack, 'admin') !== false) {
        return 'teacher';
    }
    return 'student';
}

function pqwp_assignment_map(array $assignments): array {
    $map = [];
    foreach ($assignments as $assignment) {
        $map[(int)$assignment->teacherid . ':' . (int)$assignment->studentid] = true;
    }
    return $map;
}

function pqwp_assigned_student_map(array $assignments): array {
    $map = [];
    foreach ($assignments as $assignment) {
        $map[(int)$assignment->studentid] = true;
    }
    return $map;
}

function pqwp_membership_map(array $membergroups): array {
    $map = [];
    foreach ($membergroups as $members) {
        foreach ($members as $member) {
            $userid = (int)$member->userid;
            if (!isset($map[$userid])) {
                $map[$userid] = [];
            }
            $map[$userid][$member->workspace_role] = true;
        }
    }
    return $map;
}

function pqwp_role_label(string $role): string {
    return pqh_workspace_roles()[$role] ?? $role;
}

function pqwp_workspace_settings(stdClass $workspace): array {
    $settings = json_decode((string)($workspace->settingsjson ?? ''), true);
    return is_array($settings) ? $settings : [];
}

function pqwp_save_workspace_settings(stdClass $workspace, array $settings): void {
    global $DB;
    if (!pqh_table_has_field_safe('local_prequran_workspace', 'settingsjson')) {
        return;
    }
    $workspace->settingsjson = json_encode($settings, JSON_UNESCAPED_SLASHES);
    if (pqh_table_has_field_safe('local_prequran_workspace', 'timemodified')) {
        $workspace->timemodified = time();
    }
    $DB->update_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', $workspace));
}

function pqwp_pending_invites(stdClass $workspace): array {
    $settings = pqwp_workspace_settings($workspace);
    $rows = $settings['pending_invites'] ?? [];
    return is_array($rows) ? array_values($rows) : [];
}

function pqwp_add_pending_invite(stdClass $workspace, string $email, string $role, int $createdby, string $name = '', string $parentemail = '', string $teacheremail = ''): void {
    $email = clean_param(trim($email), PARAM_EMAIL);
    if ($email === '' || !validate_email($email)) {
        throw new invalid_parameter_exception('Pending invites require a valid email address.');
    }
    if (!array_key_exists($role, pqh_workspace_roles())) {
        throw new invalid_parameter_exception('Invalid invite role.');
    }
    $settings = pqwp_workspace_settings($workspace);
    $pending = is_array($settings['pending_invites'] ?? null) ? $settings['pending_invites'] : [];
    $key = strtolower($email) . ':' . $role;
    $pending[$key] = [
        'email' => $email,
        'name' => trim($name),
        'role' => $role,
        'parent_email' => clean_param(trim($parentemail), PARAM_EMAIL),
        'teacher_email' => clean_param(trim($teacheremail), PARAM_EMAIL),
        'createdby' => $createdby,
        'timecreated' => $pending[$key]['timecreated'] ?? time(),
        'timemodified' => time(),
        'status' => 'pending',
    ];
    $settings['pending_invites'] = $pending;
    pqwp_save_workspace_settings($workspace, $settings);
}

function pqwp_clear_pending_invite(stdClass $workspace, string $invitekey): bool {
    $settings = pqwp_workspace_settings($workspace);
    $pending = is_array($settings['pending_invites'] ?? null) ? $settings['pending_invites'] : [];
    if (!isset($pending[$invitekey])) {
        return false;
    }
    unset($pending[$invitekey]);
    $settings['pending_invites'] = $pending;
    pqwp_save_workspace_settings($workspace, $settings);
    return true;
}

function pqwp_upsert_parent_link(int $workspaceid, int $studentid, int $parentid, int $createdby): void {
    global $DB;
    if (!pqwp_is_workspace_member($workspaceid, $studentid, ['student'])) {
        throw new invalid_parameter_exception('Student is not an active student member of this workspace.');
    }
    if (!pqwp_is_workspace_member($workspaceid, $parentid, ['parent'])) {
        throw new invalid_parameter_exception('Parent is not an active parent member of this workspace.');
    }
    $now = time();
    if (pqh_table_exists_safe('local_prequran_comm_consent')) {
        $record = (object)[
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'student_messaging_enabled' => 0,
            'free_text_enabled' => 0,
            'parent_visible' => 1,
            'consent_source' => 'workspace_people',
            'details' => 'Linked by workspace people manager.',
            'createdby' => $createdby,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $existing = $DB->get_record('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid], '*', IGNORE_MISSING);
        if ($existing) {
            $record->id = (int)$existing->id;
            $record->timecreated = (int)($existing->timecreated ?? $now);
            $DB->update_record('local_prequran_comm_consent', pqhi_record_for_existing_columns('local_prequran_comm_consent', $record));
        } else {
            $DB->insert_record('local_prequran_comm_consent', pqhi_record_for_existing_columns('local_prequran_comm_consent', $record));
        }
    }
    if (pqh_table_exists_safe('local_prequran_live_consent')) {
        foreach (['live_session', 'recording_policy'] as $type) {
            $record = (object)[
                'studentid' => $studentid,
                'guardianid' => $parentid,
                'consent_type' => $type,
                'granted' => 1,
                'version' => '1',
                'consent_source' => 'workspace_people',
                'details' => 'Guardian linked by workspace people manager.',
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $existing = $DB->get_record('local_prequran_live_consent', [
                'studentid' => $studentid,
                'guardianid' => $parentid,
                'consent_type' => $type,
            ], '*', IGNORE_MISSING);
            if ($existing) {
                $record->id = (int)$existing->id;
                $record->timecreated = (int)($existing->timecreated ?? $now);
                $DB->update_record('local_prequran_live_consent', pqhi_record_for_existing_columns('local_prequran_live_consent', $record));
            } else {
                $DB->insert_record('local_prequran_live_consent', pqhi_record_for_existing_columns('local_prequran_live_consent', $record));
            }
        }
    }
}

function pqwp_parent_links(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_comm_consent')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT cc.id, cc.studentid, cc.guardianid, cc.parent_visible, cc.timemodified,
                su.firstname AS student_firstname, su.lastname AS student_lastname, su.email AS student_email, su.idnumber AS student_idnumber,
                pu.firstname AS parent_firstname, pu.lastname AS parent_lastname, pu.email AS parent_email, pu.idnumber AS parent_idnumber
           FROM {local_prequran_comm_consent} cc
           JOIN {local_prequran_workspace_member} swm ON swm.workspaceid = :workspaceid1
                AND swm.userid = cc.studentid AND swm.workspace_role = :studentrole AND swm.status = :status1
           JOIN {local_prequran_workspace_member} pwm ON pwm.workspaceid = :workspaceid2
                AND pwm.userid = cc.guardianid AND pwm.workspace_role = :parentrole AND pwm.status = :status2
           JOIN {user} su ON su.id = cc.studentid
           JOIN {user} pu ON pu.id = cc.guardianid
       ORDER BY cc.timemodified DESC, cc.id DESC",
        [
            'workspaceid1' => $workspaceid,
            'workspaceid2' => $workspaceid,
            'studentrole' => 'student',
            'parentrole' => 'parent',
            'status1' => 'active',
            'status2' => 'active',
        ]
    ));
}

function pqwp_bulk_import(stdClass $workspace, string $text, int $createdby): array {
    $stats = ['added' => 0, 'invited' => 0, 'skipped' => 0, 'linked' => 0];
    $lines = preg_split('/\R+/', trim($text));
    if (!$lines) {
        return $stats;
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = array_map('trim', str_getcsv($line));
        if (!$parts || count($parts) < 2) {
            $stats['skipped']++;
            continue;
        }
        if (strtolower((string)$parts[0]) === 'role') {
            continue;
        }
        $role = strtolower((string)$parts[0]);
        $identity = (string)$parts[1];
        $name = (string)($parts[2] ?? '');
        $parentidentity = (string)($parts[3] ?? '');
        $teacheridentity = (string)($parts[4] ?? '');
        if (!in_array($role, ['owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent', 'student'], true)) {
            $stats['skipped']++;
            continue;
        }
        $user = pqwp_find_user($identity);
        if ($user) {
            pqwp_upsert_member((int)$workspace->id, (int)$user->id, $role, $createdby);
            $stats['added']++;
            if ($role === 'student' && $parentidentity !== '') {
                $parent = pqwp_find_user($parentidentity);
                if ($parent) {
                    pqwp_upsert_member((int)$workspace->id, (int)$parent->id, 'parent', $createdby);
                    pqwp_upsert_parent_link((int)$workspace->id, (int)$user->id, (int)$parent->id, $createdby);
                    $stats['linked']++;
                } else if (validate_email($parentidentity)) {
                    pqwp_add_pending_invite($workspace, $parentidentity, 'parent', $createdby, '', '', '');
                    $stats['invited']++;
                }
            }
            if ($role === 'student' && $teacheridentity !== '') {
                $teacher = pqwp_find_user($teacheridentity);
                if ($teacher) {
                    pqwp_upsert_member((int)$workspace->id, (int)$teacher->id, 'teacher', $createdby);
                    pqwp_upsert_assignment((int)$workspace->id, (int)$teacher->id, (int)$user->id, $createdby);
                    $stats['linked']++;
                }
            }
        } else if (validate_email($identity)) {
            pqwp_add_pending_invite($workspace, $identity, $role, $createdby, $name, $parentidentity, $teacheridentity);
            $stats['invited']++;
        } else {
            $stats['skipped']++;
        }
    }
    return $stats;
}

$message = '';
$error = '';
$ready = pqh_table_exists_safe('local_prequran_workspace_member');

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the workspace people page and try again.',
            new moodle_url('/local/hubredirect/workspace_people.php', $urlparams),
            'Workspace people form expired'
        );
    }
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'add_member') {
            $role = optional_param('workspace_role', 'student', PARAM_ALPHANUMEXT);
            $selecteduserid = optional_param('member_userid', 0, PARAM_INT);
            $needle = trim(optional_param('member', '', PARAM_TEXT));
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            if (!in_array($role, ['owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent', 'student'], true)) {
                throw new invalid_parameter_exception('That role cannot be added from this page.');
            }
            $member = $selecteduserid > 0 ? core_user::get_user($selecteduserid, '*', IGNORE_MISSING) : pqwp_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('Choose a user from the dropdown or enter a valid user ID, email, or username.');
            }
            if (!empty($member->deleted) || !empty($member->suspended)) {
                throw new invalid_parameter_exception('That Moodle user is deleted or suspended.');
            }
            pqwp_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = 'Workspace member added.';
        } else if ($action === 'create_member') {
            $role = optional_param('workspace_role', 'coordinator', PARAM_ALPHANUMEXT);
            $firstname = trim(optional_param('new_firstname', '', PARAM_TEXT));
            $lastname = trim(optional_param('new_lastname', '', PARAM_TEXT));
            $email = clean_param(trim(optional_param('new_email', '', PARAM_EMAIL)), PARAM_EMAIL);
            $username = clean_param(trim(optional_param('new_username', '', PARAM_USERNAME)), PARAM_USERNAME);
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            if (!in_array($role, ['owner', 'admin', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent'], true)) {
                throw new invalid_parameter_exception('Use student intake for students and teacher intake for teachers.');
            }
            if ($email === '' || !validate_email($email)) {
                throw new invalid_parameter_exception('Enter a valid email address for the new workspace member.');
            }
            $member = pqwp_find_user($email);
            if (!$member && $username !== '') {
                $member = pqwp_find_user($username);
            }
            $created = false;
            $createdusername = '';
            $createdpassword = '';
            if ($member) {
                if (!empty($member->deleted) || !empty($member->suspended)) {
                    throw new invalid_parameter_exception('A Moodle user with that email exists but is deleted or suspended.');
                }
            } else {
                [$userid, $createdusername, $createdpassword, $createdidnumber] = pqwp_create_moodle_user($firstname, $lastname, $email, $username, $role);
                $member = core_user::get_user($userid, '*', MUST_EXIST);
                $created = true;
            }
            pqwp_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = $created
                ? 'Moodle user created and added to workspace. User ID ' . (int)$member->id . ', Account No. ' . $createdidnumber . ', username ' . $createdusername . ', temporary password ' . $createdpassword . '.'
                : 'Existing Moodle user #' . (int)$member->id . ' added to workspace.';
        } else if ($action === 'assign_student') {
            $teacherid = optional_param('teacherid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            if (!pqwp_is_workspace_member($workspaceid, $teacherid, ['teacher', 'assistant_teacher', 'owner', 'admin'])) {
                throw new invalid_parameter_exception('Teacher is not an active teaching member of this workspace.');
            }
            if (!pqwp_is_workspace_member($workspaceid, $studentid, ['student'])) {
                throw new invalid_parameter_exception('Student is not an active student member of this workspace.');
            }
            pqwp_upsert_assignment($workspaceid, $teacherid, $studentid, (int)$USER->id);
            $message = 'Student assigned to teacher.';
        } else if ($action === 'link_parent_student') {
            $parentid = optional_param('parentid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            pqwp_upsert_parent_link($workspaceid, $studentid, $parentid, (int)$USER->id);
            $message = 'Parent linked to student.';
        } else if ($action === 'bulk_import_members') {
            $importtext = optional_param('bulk_members', '', PARAM_RAW_TRIMMED);
            $stats = pqwp_bulk_import($workspace, $importtext, (int)$USER->id);
            $message = 'Bulk import processed: ' . (int)$stats['added'] . ' members added, '
                . (int)$stats['invited'] . ' pending invites, '
                . (int)$stats['linked'] . ' relationships created, '
                . (int)$stats['skipped'] . ' rows skipped.';
        } else if ($action === 'clear_invite') {
            $invitekey = optional_param('invitekey', '', PARAM_RAW_TRIMMED);
            $message = pqwp_clear_pending_invite($workspace, $invitekey) ? 'Pending invite removed.' : 'Pending invite was not found.';
        } else if ($action === 'set_member_status') {
            $memberid = optional_param('memberid', 0, PARAM_INT);
            $status = optional_param('member_status', 'inactive', PARAM_ALPHANUMEXT);
            $message = pqwp_set_member_status($workspaceid, $memberid, $status, (int)$USER->id);
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$teachers = pqwp_workspace_members($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$students = pqwp_workspace_members($workspaceid, ['student']);
$parents = pqwp_workspace_members($workspaceid, ['parent']);
$allmembers = pqwp_all_workspace_members($workspaceid);
$inactivecount = 0;
foreach ($allmembers as $memberrow) {
    if ((string)$memberrow->status !== 'active') {
        $inactivecount++;
    }
}
$assignments = pqwp_assignments($workspaceid);
$parentlinks = pqwp_parent_links($workspaceid);
$pendinginvites = pqwp_pending_invites($workspace);
$assignmentmap = pqwp_assignment_map($assignments);
$assignedstudentmap = pqwp_assigned_student_map($assignments);
$membershipmap = pqwp_membership_map([$teachers, $students, $parents]);
$candidateusers = pqwp_candidate_users();

echo $OUTPUT->header();
?>
<style>
body.pqw-people-page header,body.pqw-people-page footer,body.pqw-people-page nav.navbar,body.pqw-people-page #page-header,body.pqw-people-page #page-footer,body.pqw-people-page .drawer,body.pqw-people-page .drawer-toggles,body.pqw-people-page .block-region,body.pqw-people-page [data-region="drawer"],body.pqw-people-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-people-page #page,body.pqw-people-page #page-content,body.pqw-people-page #region-main,body.pqw-people-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwp-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwp-wrap{max-width:1280px;margin:0 auto}.pqwp-top,.pqwp-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwp-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqwp-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqwp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwp-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqwp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwp-btn--danger{background:#fff0ed;color:#883526!important;border:1px solid rgba(136,53,38,.2)}.pqwp-btn[disabled],.pqwp-btn--done{background:#eef4f6;color:#5e7280!important;border:1px solid rgba(23,48,68,.12);cursor:default}.pqwp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}.pqwp-field{display:grid;gap:5px;margin-bottom:10px}.pqwp-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqwp-input,.pqwp-select,.pqwp-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqwp-textarea{min-height:132px;padding:10px;line-height:1.45}.pqwp-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqwp-alert--ok{background:#edf9ef;color:#245c35}.pqwp-alert--bad{background:#fff0ed;color:#883526}.pqwp-table{width:100%;border-collapse:separate;border-spacing:0}.pqwp-table th,.pqwp-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwp-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwp-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwp-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqwp-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqwp-pill--inactive{background:#fff0ed;color:#883526}.pqwp-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwp-stack{display:grid;gap:14px}.pqwp-toolbar{display:grid;grid-template-columns:minmax(220px,420px) auto;gap:10px;align-items:end;margin:8px 0 12px}.pqwp-role-actions{display:flex;gap:8px;flex-wrap:wrap}.pqwp-row-hidden{display:none}.pqwp-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwp-summary-card{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqwp-summary-card strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqwp-summary-card span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}
@media(max-width:980px){.pqwp-top,.pqwp-grid,.pqwp-summary{grid-template-columns:1fr}.pqwp-actions{justify-content:flex-start}.pqwp-table,.pqwp-table tbody,.pqwp-table tr,.pqwp-table td{display:block;width:100%}.pqwp-table thead{display:none}.pqwp-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqwp-table td{border:0}.pqwp-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqwp-shell">
  <div class="pqwp-wrap">
    <section class="pqwp-top pqh-workspace-top">
      <div>
        <h1 class="pqwp-title pqh-workspace-title"><?php echo s($workspace->name); ?> People</h1>
        <p class="pqwp-sub pqh-workspace-sub">Add existing Moodle users, create non-student workspace accounts, and assign students to teachers.</p>
      </div>
      <nav class="pqwp-actions pqh-workspace-actions" aria-label="Workspace people navigation">
        <button class="pqwp-btn pqwp-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqwp-btn pqwp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]))->out(false); ?>">Workspace dashboard</a>
        <a class="pqwp-btn pqwp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Home</a>
        <a class="pqwp-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqwp-alert pqwp-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqwp-alert pqwp-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <div class="pqwp-empty">Workspace membership tables are not ready. Run the local_prequran Moodle upgrade first.</div>
    <?php else: ?>
      <section class="pqwp-summary" aria-label="Workspace people summary">
        <div class="pqwp-summary-card"><strong><?php echo count($teachers); ?></strong><span>teaching members</span></div>
        <div class="pqwp-summary-card"><strong><?php echo count($students); ?></strong><span>students</span></div>
        <div class="pqwp-summary-card"><strong><?php echo count($parents); ?></strong><span>parents</span></div>
        <div class="pqwp-summary-card"><strong><?php echo count($pendinginvites); ?></strong><span>pending invites</span></div>
        <div class="pqwp-summary-card"><strong><?php echo (int)$inactivecount; ?></strong><span>inactive rows</span></div>
      </section>

      <section class="pqwp-grid">
        <form class="pqwp-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="add_member">
          <h2>Add Existing User</h2>
          <div class="pqwp-field"><label>Choose user</label><select class="pqwp-select" name="member_userid">
            <option value="0">Choose recent active Moodle user</option>
            <?php foreach ($candidateusers as $candidate): ?>
              <option value="<?php echo (int)$candidate->id; ?>"><?php echo s(pqh_account_no_label($candidate) . ' - #' . (int)$candidate->id . ' - ' . fullname($candidate) . ' - ' . ($candidate->email ?: $candidate->username)); ?></option>
            <?php endforeach; ?>
          </select></div>
          <div class="pqwp-field"><label>Or enter user ID, email, or username</label><input class="pqwp-input" name="member" placeholder="Optional if user is selected above"></div>
          <div class="pqwp-field"><label>Workspace Role</label><select class="pqwp-select" name="workspace_role">
            <?php foreach (['student', 'teacher', 'assistant_teacher', 'admin', 'owner', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent'] as $rolekey): ?>
              <option value="<?php echo s($rolekey); ?>"><?php echo s(pqh_workspace_roles()[$rolekey] ?? $rolekey); ?></option>
            <?php endforeach; ?>
          </select></div>
          <button class="pqwp-btn" type="submit">Add user</button>
        </form>

        <form class="pqwp-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_member">
          <h2>Create Moodle User</h2>
          <p class="pqwp-muted">For admins, coordinators, auditors, owners, and parents who do not already have a Moodle account. Use student or teacher intake for learner/teacher profiles.</p>
          <div class="pqwp-field"><label>First name</label><input class="pqwp-input" name="new_firstname" required></div>
          <div class="pqwp-field"><label>Last name</label><input class="pqwp-input" name="new_lastname" required></div>
          <div class="pqwp-field"><label>Email</label><input class="pqwp-input" type="email" name="new_email" required></div>
          <div class="pqwp-field"><label>Username optional</label><input class="pqwp-input" name="new_username" placeholder="Generated from email if blank"></div>
          <div class="pqwp-field"><label>Workspace Role</label><select class="pqwp-select" name="workspace_role">
            <?php foreach (['coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'admin', 'owner', 'parent'] as $rolekey): ?>
              <option value="<?php echo s($rolekey); ?>"><?php echo s(pqh_workspace_roles()[$rolekey] ?? $rolekey); ?></option>
            <?php endforeach; ?>
          </select></div>
          <button class="pqwp-btn" type="submit">Create and add</button>
        </form>

        <form class="pqwp-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="assign_student">
          <h2>Assign Student</h2>
          <div class="pqwp-field"><label>Teacher</label><select class="pqwp-select" name="teacherid" required>
            <?php foreach ($teachers as $teacher): ?><option value="<?php echo (int)$teacher->userid; ?>"><?php echo s(fullname($teacher) . ' - ' . pqh_account_no_label($teacher) . ' - #' . (int)$teacher->userid); ?></option><?php endforeach; ?>
          </select></div>
          <?php
          $unassignedstudents = [];
          foreach ($students as $student) {
              if (empty($assignedstudentmap[(int)$student->userid])) {
                  $unassignedstudents[] = $student;
              }
          }
          ?>
          <?php if (!$students): ?>
            <div class="pqwp-empty">Add student members before assigning them to a teacher.</div>
          <?php elseif (!$unassignedstudents): ?>
            <div class="pqwp-empty">All students in this workspace already have an active teacher assignment.</div>
          <?php else: ?>
            <div class="pqwp-field"><label>Student</label><select class="pqwp-select" name="studentid" required>
              <?php foreach ($unassignedstudents as $student): ?>
                <option value="<?php echo (int)$student->userid; ?>"><?php echo s(fullname($student) . ' - ' . pqh_account_no_label($student) . ' - #' . (int)$student->userid); ?></option>
              <?php endforeach; ?>
            </select></div>
          <?php endif; ?>
          <button class="pqwp-btn" type="submit" <?php echo (!$teachers || !$unassignedstudents) ? 'disabled' : ''; ?>>Assign student</button>
        </form>
      </section>

      <section class="pqwp-grid">
        <form class="pqwp-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="bulk_import_members">
          <h2>Bulk Import / Invite</h2>
          <p class="pqwp-muted">One CSV row per person: role,email-or-user-id-or-username,full name,parent email,teacher email.</p>
          <div class="pqwp-field"><label>Rows</label><textarea class="pqwp-textarea" name="bulk_members" placeholder="student,student@example.com,Ayan Mohamed,parent@example.com,teacher@example.com&#10;teacher,teacher@example.com,Ustad Ahmed&#10;parent,parent@example.com,Parent Mohamed"></textarea></div>
          <button class="pqwp-btn" type="submit">Process rows</button>
        </form>

        <form class="pqwp-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="link_parent_student">
          <h2>Link Parent to Student</h2>
          <?php if (!$parents || !$students): ?>
            <div class="pqwp-empty">Add at least one active parent and one active student before linking.</div>
          <?php else: ?>
            <div class="pqwp-field"><label>Parent</label><select class="pqwp-select" name="parentid" required>
              <?php foreach ($parents as $parent): ?><option value="<?php echo (int)$parent->userid; ?>"><?php echo s(fullname($parent) . ' - ' . pqh_account_no_label($parent) . ' - #' . (int)$parent->userid); ?></option><?php endforeach; ?>
            </select></div>
            <div class="pqwp-field"><label>Student</label><select class="pqwp-select" name="studentid" required>
              <?php foreach ($students as $student): ?><option value="<?php echo (int)$student->userid; ?>"><?php echo s(fullname($student) . ' - ' . pqh_account_no_label($student) . ' - #' . (int)$student->userid); ?></option><?php endforeach; ?>
            </select></div>
          <?php endif; ?>
          <button class="pqwp-btn" type="submit" <?php echo (!$parents || !$students) ? 'disabled' : ''; ?>>Link parent</button>
        </form>
      </section>

      <section class="pqwp-grid">
        <article class="pqwp-panel">
          <h2>Pending Invites</h2>
          <?php if (!$pendinginvites): ?>
            <div class="pqwp-empty">No pending invite rows are waiting for account creation.</div>
          <?php else: ?>
            <table class="pqwp-table">
              <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
              <tbody>
                <?php foreach ($pendinginvites as $invite): ?>
                  <?php $invitekey = strtolower((string)($invite['email'] ?? '')) . ':' . (string)($invite['role'] ?? ''); ?>
                  <tr>
                    <td data-label="Email"><span class="pqwp-name"><?php echo s((string)($invite['email'] ?? '')); ?></span><span class="pqwp-muted"><?php echo s((string)($invite['name'] ?? '')); ?></span></td>
                    <td data-label="Role"><span class="pqwp-pill"><?php echo s(pqwp_role_label((string)($invite['role'] ?? ''))); ?></span></td>
                    <td data-label="Status"><span class="pqwp-pill"><?php echo s((string)($invite['status'] ?? 'pending')); ?></span></td>
                    <td data-label="Updated"><?php echo s(userdate((int)($invite['timemodified'] ?? $invite['timecreated'] ?? time()), get_string('strftimedatetimeshort'))); ?></td>
                    <td data-label="Actions">
                      <form method="post" style="display:inline-flex;margin:0">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="clear_invite">
                        <input type="hidden" name="invitekey" value="<?php echo s($invitekey); ?>">
                        <button class="pqwp-btn pqwp-btn--danger" type="submit">Remove</button>
                      </form>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </article>

        <article class="pqwp-panel">
          <h2>Parent-Student Links</h2>
          <?php if (!$parentlinks): ?>
            <div class="pqwp-empty">No active parent-student links were found for this workspace.</div>
          <?php else: ?>
            <table class="pqwp-table">
              <thead><tr><th>Parent</th><th>Student</th><th>Visible</th><th>Updated</th></tr></thead>
              <tbody>
                <?php foreach ($parentlinks as $link): ?>
                  <tr>
                    <td data-label="Parent"><span class="pqwp-name"><?php echo s(fullname((object)['firstname' => $link->parent_firstname, 'lastname' => $link->parent_lastname])); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label((object)['userid' => $link->guardianid, 'idnumber' => $link->parent_idnumber])); ?> / <?php echo s($link->parent_email); ?></span></td>
                    <td data-label="Student"><span class="pqwp-name"><?php echo s(fullname((object)['firstname' => $link->student_firstname, 'lastname' => $link->student_lastname])); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label((object)['userid' => $link->studentid, 'idnumber' => $link->student_idnumber])); ?> / <?php echo s($link->student_email); ?></span></td>
                    <td data-label="Visible"><span class="pqwp-pill"><?php echo (int)$link->parent_visible === 1 ? 'parent visible' : 'limited'; ?></span></td>
                    <td data-label="Updated"><?php echo s(userdate((int)$link->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </article>
      </section>

      <section class="pqwp-panel">
        <h2>Workspace Members</h2>
        <?php if (!$allmembers): ?>
          <div class="pqwp-empty">No workspace members have been added yet.</div>
        <?php else: ?>
          <table class="pqwp-table">
            <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($allmembers as $memberrow): ?>
                <?php $isactive = (string)$memberrow->status === 'active'; ?>
                <tr>
                  <td data-label="Member"><span class="pqwp-name"><?php echo s(fullname($memberrow)); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label($memberrow)); ?> / #<?php echo (int)$memberrow->userid; ?> / <?php echo s($memberrow->email ?: $memberrow->username); ?></span></td>
                  <td data-label="Role"><span class="pqwp-pill"><?php echo s(pqwp_role_label((string)$memberrow->workspace_role)); ?></span></td>
                  <td data-label="Status"><span class="pqwp-pill <?php echo $isactive ? '' : 'pqwp-pill--inactive'; ?>"><?php echo s((string)$memberrow->status); ?></span></td>
                  <td data-label="Updated"><?php echo s(userdate((int)$memberrow->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                  <td data-label="Actions">
                    <form method="post" style="display:inline-flex;margin:0">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <input type="hidden" name="action" value="set_member_status">
                      <input type="hidden" name="memberid" value="<?php echo (int)$memberrow->id; ?>">
                      <input type="hidden" name="member_status" value="<?php echo $isactive ? 'inactive' : 'active'; ?>">
                      <button class="pqwp-btn <?php echo $isactive ? 'pqwp-btn--danger' : ''; ?>" type="submit"><?php echo $isactive ? 'Deactivate' : 'Reactivate'; ?></button>
                    </form>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>

      <section class="pqwp-panel">
        <h2>Recent Moodle Users</h2>
        <?php if (!$candidateusers): ?>
          <div class="pqwp-empty">No active Moodle users were found.</div>
        <?php else: ?>
          <div class="pqwp-toolbar">
            <div class="pqwp-field">
              <label>Search recent users</label>
              <input class="pqwp-input" id="pqwp-user-filter" type="search" placeholder="Search name, email, username, or user ID">
            </div>
            <span class="pqwp-muted">Showing the 30 newest active accounts.</span>
          </div>
          <table class="pqwp-table" id="pqwp-recent-users">
            <thead><tr><th>User</th><th>Email</th><th>Likely Role</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach (array_slice($candidateusers, 0, 30) as $candidate): ?>
                <?php $likelyrole = pqwp_likely_role($candidate); ?>
                <?php $existingroles = $membershipmap[(int)$candidate->id] ?? []; ?>
                <tr data-filter="<?php echo s(strtolower(pqh_account_no_value($candidate) . ' #' . (int)$candidate->id . ' ' . fullname($candidate) . ' ' . ($candidate->email ?? '') . ' ' . ($candidate->username ?? ''))); ?>">
                  <td data-label="User"><span class="pqwp-name"><?php echo s(fullname($candidate)); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label($candidate)); ?> / #<?php echo (int)$candidate->id; ?> / <?php echo s($candidate->username); ?></span></td>
                  <td data-label="Email"><?php echo s($candidate->email); ?></td>
                  <td data-label="Likely Role">
                    <span class="pqwp-pill"><?php echo s($likelyrole); ?></span>
                    <?php foreach (array_keys($existingroles) as $existingrole): ?>
                      <span class="pqwp-pill">Already <?php echo s(pqwp_role_label($existingrole)); ?></span>
                    <?php endforeach; ?>
                  </td>
                  <td data-label="Actions">
                    <div class="pqwp-role-actions">
                      <?php foreach ([$likelyrole, 'student', 'parent', 'teacher'] as $rolebutton): ?>
                        <?php if ($rolebutton !== 'student' && $rolebutton !== 'parent' && $rolebutton !== 'teacher') { continue; } ?>
                        <?php if (isset($seenrolebuttons[$rolebutton])) { continue; } ?>
                        <?php $seenrolebuttons[$rolebutton] = true; ?>
                        <?php $alreadyhasrole = !empty($existingroles[$rolebutton]) || ($rolebutton === 'teacher' && (!empty($existingroles['owner']) || !empty($existingroles['admin']) || !empty($existingroles['assistant_teacher']))); ?>
                        <?php if ($alreadyhasrole): ?>
                          <span class="pqwp-btn pqwp-btn--done">Already <?php echo s($rolebutton); ?></span>
                        <?php else: ?>
                          <form method="post">
                            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                            <input type="hidden" name="action" value="add_member">
                            <input type="hidden" name="member_userid" value="<?php echo (int)$candidate->id; ?>">
                            <input type="hidden" name="workspace_role" value="<?php echo s($rolebutton); ?>">
                            <button class="pqwp-btn <?php echo $rolebutton === $likelyrole ? '' : 'pqwp-btn--light'; ?>" type="submit">Add <?php echo s($rolebutton); ?></button>
                          </form>
                        <?php endif; ?>
                      <?php endforeach; unset($seenrolebuttons); ?>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>

      <section class="pqwp-grid">
        <article class="pqwp-panel">
          <h2>Teachers</h2>
          <?php if (!$teachers): ?><div class="pqwp-empty">No teaching members yet.</div><?php else: ?>
          <table class="pqwp-table"><thead><tr><th>Teacher</th><th>Role</th><th>Email</th></tr></thead><tbody>
            <?php foreach ($teachers as $teacher): ?><tr><td data-label="Teacher"><span class="pqwp-name"><?php echo s(fullname($teacher)); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label($teacher)); ?> / User #<?php echo (int)$teacher->userid; ?></span></td><td data-label="Role"><span class="pqwp-pill"><?php echo s($teacher->workspace_role); ?></span></td><td data-label="Email"><?php echo s($teacher->email); ?></td></tr><?php endforeach; ?>
          </tbody></table>
          <?php endif; ?>
        </article>

        <article class="pqwp-panel">
          <h2>Students</h2>
          <?php if (!$students): ?><div class="pqwp-empty">No student members yet.</div><?php else: ?>
          <table class="pqwp-table"><thead><tr><th>Student</th><th>Email</th><th>Assign</th><th>Updated</th></tr></thead><tbody>
            <?php foreach ($students as $student): ?>
              <tr>
                <td data-label="Student"><span class="pqwp-name"><?php echo s(fullname($student)); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label($student)); ?> / User #<?php echo (int)$student->userid; ?></span></td>
                <td data-label="Email"><?php echo s($student->email); ?></td>
                <td data-label="Assign">
                  <?php foreach ($teachers as $teacher): ?>
                    <?php $assigned = !empty($assignmentmap[(int)$teacher->userid . ':' . (int)$student->userid]); ?>
                    <?php if ($assigned): ?>
                      <span class="pqwp-btn pqwp-btn--done">Assigned to <?php echo s(fullname($teacher)); ?></span>
                    <?php else: ?>
                      <form method="post" style="display:inline-flex;margin:0 6px 6px 0">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="assign_student">
                        <input type="hidden" name="teacherid" value="<?php echo (int)$teacher->userid; ?>">
                        <input type="hidden" name="studentid" value="<?php echo (int)$student->userid; ?>">
                        <button class="pqwp-btn pqwp-btn--light" type="submit">Assign to <?php echo s(fullname($teacher)); ?></button>
                      </form>
                    <?php endif; ?>
                  <?php endforeach; ?>
                </td>
                <td data-label="Updated"><?php echo s(userdate((int)$student->timemodified, get_string('strftimedatetimeshort'))); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody></table>
          <?php endif; ?>
        </article>
      </section>

      <section class="pqwp-panel">
        <h2>Teacher-Student Assignments</h2>
        <?php if (!pqh_table_exists_safe('local_prequran_teacher_student')): ?>
          <div class="pqwp-empty">Teacher-student assignment table is not ready. Run the local_prequran Moodle upgrade first.</div>
        <?php elseif (!$assignments): ?>
          <div class="pqwp-empty">No active teacher-student assignments yet.</div>
        <?php else: ?>
          <table class="pqwp-table">
            <thead><tr><th>Teacher</th><th>Student</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($assignments as $assignment): ?>
                <tr>
                  <td data-label="Teacher"><span class="pqwp-name"><?php echo s(fullname((object)['firstname' => $assignment->teacher_firstname, 'lastname' => $assignment->teacher_lastname])); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label((object)['userid' => $assignment->teacherid, 'idnumber' => $assignment->teacher_idnumber])); ?> / <?php echo s($assignment->teacher_email); ?></span></td>
                  <td data-label="Student"><span class="pqwp-name"><?php echo s(fullname((object)['firstname' => $assignment->student_firstname, 'lastname' => $assignment->student_lastname])); ?></span><span class="pqwp-muted"><?php echo s(pqh_account_no_label((object)['userid' => $assignment->studentid, 'idnumber' => $assignment->student_idnumber])); ?> / <?php echo s($assignment->student_email); ?></span></td>
                  <td data-label="Status"><span class="pqwp-pill"><?php echo s($assignment->status); ?></span></td>
                  <td data-label="Updated"><?php echo s(userdate((int)$assignment->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var filter = document.getElementById('pqwp-user-filter');
  var table = document.getElementById('pqwp-recent-users');
  if (!filter || !table) {
    return;
  }
  filter.addEventListener('input', function() {
    var needle = filter.value.toLowerCase().trim();
    table.querySelectorAll('tbody tr').forEach(function(row) {
      var haystack = row.getAttribute('data-filter') || '';
      row.classList.toggle('pqwp-row-hidden', needle !== '' && haystack.indexOf(needle) === -1);
    });
  });
}());
</script>
<?php
echo $OUTPUT->footer();
