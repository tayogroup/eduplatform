<?php
// Workspace-people query/write library — extracted VERBATIM from
// workspace_people.php (renamed pqwp_ -> pqwpl_) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
// Requires: local/hubredirect/accesslib.php, account_ids.php and
// institutionlib.php loaded first (pqh_* / pqhi_* helpers), plus user/lib.php
// for user_create_user().

defined('MOODLE_INTERNAL') || die();

function pqwpl_find_user(string $needle): ?stdClass {
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

function pqwpl_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwpl_unique_username(string $base): string {
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

function pqwpl_create_moodle_user(string $firstname, string $lastname, string $email, string $username = '', string $accounttype = 'workspace'): array {
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
        $username = pqwpl_unique_username($email);
    } else {
        $username = pqwpl_unique_username($username);
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

function pqwpl_upsert_member(int $workspaceid, int $userid, string $role, int $createdby): void {
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

function pqwpl_workspace_members(int $workspaceid, array $roles): array {
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

function pqwpl_all_workspace_members(int $workspaceid): array {
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

function pqwpl_active_manager_count(int $workspaceid): int {
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

function pqwpl_set_member_status(int $workspaceid, int $memberid, string $status, int $actorid): string {
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
        && pqwpl_active_manager_count($workspaceid) <= 1) {
        throw new invalid_parameter_exception('At least one active owner or admin must remain in the workspace.');
    }
    $member->status = $status;
    $member->timemodified = time();
    $DB->update_record('local_prequran_workspace_member', $member);
    return $status === 'active' ? 'Workspace member reactivated.' : 'Workspace member deactivated.';
}

function pqwpl_is_workspace_member(int $workspaceid, int $userid, array $roles): bool {
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

function pqwpl_upsert_assignment(int $workspaceid, int $teacherid, int $studentid, int $assignedby): void {
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

function pqwpl_assignments(int $workspaceid): array {
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

function pqwpl_candidate_users(int $limit = 80): array {
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

function pqwpl_likely_role(stdClass $user): string {
    $haystack = strtolower(trim(($user->username ?? '') . ' ' . ($user->email ?? '') . ' ' . ($user->firstname ?? '') . ' ' . ($user->lastname ?? '')));
    if (strpos($haystack, 'parent') !== false) {
        return 'parent';
    }
    if (strpos($haystack, 'teacher') !== false || strpos($haystack, 'principal') !== false || strpos($haystack, 'admin') !== false) {
        return 'teacher';
    }
    return 'student';
}

function pqwpl_assignment_map(array $assignments): array {
    $map = [];
    foreach ($assignments as $assignment) {
        $map[(int)$assignment->teacherid . ':' . (int)$assignment->studentid] = true;
    }
    return $map;
}

function pqwpl_assigned_student_map(array $assignments): array {
    $map = [];
    foreach ($assignments as $assignment) {
        $map[(int)$assignment->studentid] = true;
    }
    return $map;
}

function pqwpl_membership_map(array $membergroups): array {
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

function pqwpl_role_label(string $role): string {
    return pqh_workspace_roles()[$role] ?? $role;
}

function pqwpl_workspace_settings(stdClass $workspace): array {
    $settings = json_decode((string)($workspace->settingsjson ?? ''), true);
    return is_array($settings) ? $settings : [];
}

function pqwpl_save_workspace_settings(stdClass $workspace, array $settings): void {
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

function pqwpl_pending_invites(stdClass $workspace): array {
    $settings = pqwpl_workspace_settings($workspace);
    $rows = $settings['pending_invites'] ?? [];
    return is_array($rows) ? array_values($rows) : [];
}

function pqwpl_add_pending_invite(stdClass $workspace, string $email, string $role, int $createdby, string $name = '', string $parentemail = '', string $teacheremail = ''): void {
    $email = clean_param(trim($email), PARAM_EMAIL);
    if ($email === '' || !validate_email($email)) {
        throw new invalid_parameter_exception('Pending invites require a valid email address.');
    }
    if (!array_key_exists($role, pqh_workspace_roles())) {
        throw new invalid_parameter_exception('Invalid invite role.');
    }
    $settings = pqwpl_workspace_settings($workspace);
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
    pqwpl_save_workspace_settings($workspace, $settings);
}

function pqwpl_clear_pending_invite(stdClass $workspace, string $invitekey): bool {
    $settings = pqwpl_workspace_settings($workspace);
    $pending = is_array($settings['pending_invites'] ?? null) ? $settings['pending_invites'] : [];
    if (!isset($pending[$invitekey])) {
        return false;
    }
    unset($pending[$invitekey]);
    $settings['pending_invites'] = $pending;
    pqwpl_save_workspace_settings($workspace, $settings);
    return true;
}

function pqwpl_upsert_parent_link(int $workspaceid, int $studentid, int $parentid, int $createdby): void {
    global $DB;
    if (!pqwpl_is_workspace_member($workspaceid, $studentid, ['student'])) {
        throw new invalid_parameter_exception('Student is not an active student member of this workspace.');
    }
    if (!pqwpl_is_workspace_member($workspaceid, $parentid, ['parent'])) {
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

function pqwpl_parent_links(int $workspaceid): array {
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

function pqwpl_bulk_import(stdClass $workspace, string $text, int $createdby): array {
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
        $user = pqwpl_find_user($identity);
        if ($user) {
            pqwpl_upsert_member((int)$workspace->id, (int)$user->id, $role, $createdby);
            $stats['added']++;
            if ($role === 'student' && $parentidentity !== '') {
                $parent = pqwpl_find_user($parentidentity);
                if ($parent) {
                    pqwpl_upsert_member((int)$workspace->id, (int)$parent->id, 'parent', $createdby);
                    pqwpl_upsert_parent_link((int)$workspace->id, (int)$user->id, (int)$parent->id, $createdby);
                    $stats['linked']++;
                } else if (validate_email($parentidentity)) {
                    pqwpl_add_pending_invite($workspace, $parentidentity, 'parent', $createdby, '', '', '');
                    $stats['invited']++;
                }
            }
            if ($role === 'student' && $teacheridentity !== '') {
                $teacher = pqwpl_find_user($teacheridentity);
                if ($teacher) {
                    pqwpl_upsert_member((int)$workspace->id, (int)$teacher->id, 'teacher', $createdby);
                    pqwpl_upsert_assignment((int)$workspace->id, (int)$teacher->id, (int)$user->id, $createdby);
                    $stats['linked']++;
                }
            }
        } else if (validate_email($identity)) {
            pqwpl_add_pending_invite($workspace, $identity, $role, $createdby, $name, $parentidentity, $teacheridentity);
            $stats['invited']++;
        } else {
            $stats['skipped']++;
        }
    }
    return $stats;
}
