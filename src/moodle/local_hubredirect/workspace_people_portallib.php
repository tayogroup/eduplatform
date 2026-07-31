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
        throw new Exception('First name and last name are required to create a user account.');
    }
    if ($email === '' || !validate_email($email)) {
        throw new Exception('A valid email address is required to create a user account.');
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
    // Staff-conveyed temp password: the first login must replace it.
    set_user_preference('auth_forcepasswordchange', 1, $userid);
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
        if (in_array($role, ['platform_admin', 'owner', 'admin'], true) && (string)$existing->status !== 'active') {
            pqwpl_governance_audit('workspace_manager_reactivated', $workspaceid, $userid, $createdby, ['role' => $role]);
        }
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_workspace_member', $record);
    // Governance: granting manager-tier access must leave a trail.
    if (in_array($role, ['platform_admin', 'owner', 'admin'], true)) {
        pqwpl_governance_audit('workspace_manager_granted', $workspaceid, $userid, $createdby, ['role' => $role]);
    }
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
        throw new Exception('Invalid member status.');
    }
    $member = $DB->get_record('local_prequran_workspace_member', [
        'id' => $memberid,
        'workspaceid' => $workspaceid,
    ], '*', IGNORE_MISSING);
    if (!$member) {
        throw new Exception('Workspace member was not found.');
    }
    if ($status === 'inactive'
        && (int)$member->userid === $actorid
        && in_array((string)$member->workspace_role, ['owner', 'admin'], true)) {
        throw new Exception('You cannot deactivate your own workspace management access.');
    }
    if ($status === 'inactive'
        && (string)$member->status === 'active'
        && in_array((string)$member->workspace_role, ['owner', 'admin'], true)
        && pqwpl_active_manager_count($workspaceid) <= 1) {
        throw new Exception('At least one active owner or admin must remain in the workspace.');
    }
    $previousstatus = (string)$member->status;
    $member->status = $status;
    $member->timemodified = time();
    $DB->update_record('local_prequran_workspace_member', $member);
    pqwpl_governance_audit('workspace_member_status_changed', $workspaceid, (int)$member->userid, $actorid, [
        'role' => (string)$member->workspace_role,
        'from' => $previousstatus,
        'to' => $status,
    ]);
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
        throw new Exception('Teacher-student assignment table is not ready. Run the local_prequran upgrade.');
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
        throw new Exception('Pending invites require a valid email address.');
    }
    if (!array_key_exists($role, pqh_workspace_roles())) {
        throw new Exception('Invalid invite role.');
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
        throw new Exception('Student is not an active student member of this workspace.');
    }
    if (!pqwpl_is_workspace_member($workspaceid, $parentid, ['parent'])) {
        throw new Exception('Parent is not an active parent member of this workspace.');
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

/** The teacher's vetting_status from their profile ('' when no profile/table). */
function pqwpl_teacher_vetting_status(int $teacherid): string {
    global $DB;
    try {
        if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_teacher_profile'))) {
            return '';
        }
        return (string)$DB->get_field('local_prequran_teacher_profile', 'vetting_status', ['userid' => $teacherid], IGNORE_MISSING);
    } catch (Throwable $e) {
        return '';
    }
}

/**
 * Offboard a teacher from a workspace with a FULL CASCADE (the lifecycle exit
 * that set_member_status never provided): membership -> inactive, every active
 * teacher-student assignment -> inactive (history preserved, never deleted),
 * class groups and FUTURE scheduled live sessions handed to the optional
 * replacement teacher (sessions via audited sub_request rows, mirroring the
 * single-session substitute action). Without a replacement, groups/sessions
 * are left intact and COUNTED in the returned summary so the admin can
 * substitute manually. Moodle course unenrolment is intentionally left to the
 * nightly enrolment_reconcile task (teacher_reconcile_mode), which unenrols
 * teachers whose assignments are gone - one authority for that decision.
 * Returns a summary array of counts.
 */
function pqwpl_offboard_teacher(int $workspaceid, int $teacherid, int $replacementid, int $actorid): array {
    global $DB;

    $teachingroles = ['owner', 'admin', 'teacher', 'assistant_teacher'];
    [$rolesql, $roleparams] = $DB->get_in_or_equal($teachingroles, SQL_PARAMS_NAMED, 'wr');
    $memberships = $DB->get_records_select('local_prequran_workspace_member',
        "workspaceid = :ws AND userid = :uid AND status = 'active' AND workspace_role {$rolesql}",
        ['ws' => $workspaceid, 'uid' => $teacherid] + $roleparams);
    if (!$memberships) {
        throw new Exception('That user is not an active teaching member of this workspace.');
    }

    // Last-manager guard: never offboard the only remaining owner/admin.
    $ismanager = false;
    foreach ($memberships as $m) {
        if (in_array((string)$m->workspace_role, ['owner', 'admin'], true)) {
            $ismanager = true;
        }
    }
    if ($ismanager) {
        $othermanagers = $DB->count_records_select('local_prequran_workspace_member',
            "workspaceid = :ws AND userid <> :uid AND status = 'active' AND workspace_role IN ('owner', 'admin')",
            ['ws' => $workspaceid, 'uid' => $teacherid]);
        if ($othermanagers <= 0) {
            throw new Exception('This is the last active owner/admin - add another manager before offboarding.');
        }
    }

    // Replacement validation (optional).
    if ($replacementid > 0) {
        if ($replacementid === $teacherid) {
            throw new Exception('Replacement must be a different teacher.');
        }
        if (!pqwpl_is_workspace_member($workspaceid, $replacementid, $teachingroles)) {
            throw new Exception('Replacement is not an active teaching member of this workspace.');
        }
        if (pqwpl_teacher_vetting_status($replacementid) === 'rejected') {
            throw new Exception('Replacement teacher has a rejected vetting - pick another teacher.');
        }
    }

    $now = time();
    $tableexists = static function(string $table) use ($DB): bool {
        try {
            return $DB->get_manager()->table_exists(new xmldb_table($table));
        } catch (Throwable $e) {
            return false;
        }
    };
    $summary = ['memberships' => 0, 'assignments' => 0, 'reassigned' => 0,
        'groups_reassigned' => 0, 'groups_orphaned' => 0,
        'sessions_reassigned' => 0, 'sessions_needing_substitute' => 0];

    // 1) Workspace memberships -> inactive.
    foreach ($memberships as $m) {
        $DB->update_record('local_prequran_workspace_member', (object)[
            'id' => (int)$m->id, 'status' => 'inactive', 'timemodified' => $now,
        ]);
        $summary['memberships']++;
    }

    // 2) Teacher-student assignments: old rows -> inactive; replacement gets fresh active rows.
    if ($tableexists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student',
            ['workspaceid' => $workspaceid, 'teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $DB->update_record('local_prequran_teacher_student', (object)[
                'id' => (int)$row->id, 'status' => 'inactive', 'timemodified' => $now,
            ]);
            $summary['assignments']++;
            if ($replacementid > 0) {
                $existing = $DB->get_record('local_prequran_teacher_student', [
                    'workspaceid' => $workspaceid, 'teacherid' => $replacementid, 'studentid' => (int)$row->studentid,
                ], '*', IGNORE_MISSING);
                if ($existing) {
                    if ((string)$existing->status !== 'active') {
                        $DB->update_record('local_prequran_teacher_student', (object)[
                            'id' => (int)$existing->id, 'status' => 'active', 'assignedby' => $actorid, 'timemodified' => $now,
                        ]);
                    }
                } else {
                    $DB->insert_record('local_prequran_teacher_student', (object)[
                        'workspaceid' => $workspaceid, 'teacherid' => $replacementid,
                        'studentid' => (int)$row->studentid, 'cohortid' => 0, 'status' => 'active',
                        'notes' => 'Reassigned on teacher offboarding.', 'assignedby' => $actorid,
                        'timecreated' => $now, 'timemodified' => $now,
                    ]);
                }
                $summary['reassigned']++;
            }
        }
    }

    // 3) Class groups.
    if ($tableexists('local_prequran_class_group')) {
        $groups = $DB->get_records_select('local_prequran_class_group',
            "workspaceid = :ws AND teacherid = :uid AND status <> 'archived'",
            ['ws' => $workspaceid, 'uid' => $teacherid], '', 'id,teacherid');
        foreach ($groups as $g) {
            if ($replacementid > 0) {
                $DB->update_record('local_prequran_class_group', (object)[
                    'id' => (int)$g->id, 'teacherid' => $replacementid, 'timemodified' => $now,
                ]);
                $summary['groups_reassigned']++;
            } else {
                $summary['groups_orphaned']++;
            }
        }
    }

    // 4) Future scheduled live sessions.
    if ($tableexists('local_prequran_live_session')) {
        $sessions = $DB->get_records_select('local_prequran_live_session',
            "workspaceid = :ws AND teacherid = :uid AND status = 'scheduled' AND scheduled_start > :now",
            ['ws' => $workspaceid, 'uid' => $teacherid, 'now' => $now], 'scheduled_start ASC');
        foreach ($sessions as $session) {
            if ($replacementid > 0) {
                if ($tableexists('local_prequran_sub_request')) {
                    $DB->insert_record('local_prequran_sub_request', (object)[
                        'workspaceid' => $workspaceid, 'sessionid' => (int)$session->id,
                        'original_teacherid' => $teacherid, 'substitute_teacherid' => $replacementid,
                        'status' => 'approved', 'reason' => 'Teacher offboarded.',
                        'handoff_notes' => '', 'requestedby' => $actorid, 'approvedby' => $actorid,
                        'approvedat' => $now, 'timecreated' => $now, 'timemodified' => $now,
                    ]);
                }
                $DB->update_record('local_prequran_live_session', (object)[
                    'id' => (int)$session->id, 'teacherid' => $replacementid,
                    'substitute_teacherid' => $replacementid, 'timemodified' => $now,
                ]);
                $summary['sessions_reassigned']++;
            } else {
                $summary['sessions_needing_substitute']++;
            }
        }
    }

    // Audit one summarizing row (course_audit shape; guarded).
    if ($tableexists('local_prequran_course_audit')) {
        try {
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
                'studentid' => 0, 'actorid' => $actorid, 'action' => 'teacher_offboarded',
                'targettype' => 'user', 'targetid' => $teacherid,
                'details' => json_encode(['replacementid' => $replacementid] + $summary, JSON_UNESCAPED_SLASHES),
                'timecreated' => $now,
            ]);
        } catch (Throwable $e) {
            // Audit must not break the offboarding.
        }
    }

    $summary['account'] = pqwpl_identity_offboard_account($teacherid, $workspaceid, $actorid, 'teacher');

    return $summary;
}

/**
 * Offboard/withdraw a student with a FULL CASCADE (student counterpart of
 * pqwpl_offboard_teacher — until now a departing student left every row
 * active forever): workspace membership -> inactive, teacher-student
 * assignments -> inactive, class-group memberships -> inactive, FUTURE live
 * session participant rows -> removed, and open enrol requests -> withdrawn
 * with the Moodle enrolment SUSPENDED (never unenrolled — grades and history
 * survive, Canvas "inactive" semantics). Parent links/consents are kept as
 * historical record (revoke separately via the parent-links unlink action).
 * Returns a summary array of counts.
 */
function pqwpl_offboard_student(int $workspaceid, int $studentid, int $actorid): array {
    global $DB;

    $memberships = $DB->get_records('local_prequran_workspace_member',
        ['workspaceid' => $workspaceid, 'userid' => $studentid, 'workspace_role' => 'student', 'status' => 'active']);
    if (!$memberships) {
        throw new Exception('That user is not an active student member of this workspace.');
    }

    $now = time();
    $tableexists = static function(string $table) use ($DB): bool {
        try {
            return $DB->get_manager()->table_exists(new xmldb_table($table));
        } catch (Throwable $e) {
            return false;
        }
    };
    $summary = ['memberships' => 0, 'assignments' => 0, 'groups' => 0,
        'future_sessions' => 0, 'requests_withdrawn' => 0, 'enrolments_suspended' => 0];

    // 1) Workspace membership -> inactive.
    foreach ($memberships as $m) {
        $DB->update_record('local_prequran_workspace_member', (object)[
            'id' => (int)$m->id, 'status' => 'inactive', 'timemodified' => $now,
        ]);
        $summary['memberships']++;
    }

    // 2) Teacher-student assignments -> inactive (history preserved).
    if ($tableexists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student',
            ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'status' => 'active']);
        foreach ($rows as $row) {
            $DB->update_record('local_prequran_teacher_student', (object)[
                'id' => (int)$row->id, 'status' => 'inactive', 'timemodified' => $now,
            ]);
            $summary['assignments']++;
        }
    }

    // 3) Class-group memberships -> inactive.
    if ($tableexists('local_prequran_group_member') && $tableexists('local_prequran_class_group')) {
        $rows = $DB->get_records_sql(
            "SELECT gm.id
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE gm.studentid = :studentid AND gm.assignment_status = 'active'
                AND cg.workspaceid = :workspaceid",
            ['studentid' => $studentid, 'workspaceid' => $workspaceid]);
        foreach ($rows as $row) {
            $DB->update_record('local_prequran_group_member', (object)[
                'id' => (int)$row->id, 'assignment_status' => 'inactive', 'timemodified' => $now,
            ]);
            $summary['groups']++;
        }
    }

    // 4) Future scheduled live sessions: participant rows -> removed.
    if ($tableexists('local_prequran_live_session') && $tableexists('local_prequran_live_participant')) {
        $rows = $DB->get_records_sql(
            "SELECT p.id
               FROM {local_prequran_live_participant} p
               JOIN {local_prequran_live_session} ls ON ls.id = p.sessionid
              WHERE (p.userid = :sid OR p.studentid = :sid2)
                AND p.status = 'active'
                AND ls.workspaceid = :workspaceid
                AND ls.status = 'scheduled' AND ls.scheduled_start > :now",
            ['sid' => $studentid, 'sid2' => $studentid, 'workspaceid' => $workspaceid, 'now' => $now]);
        foreach ($rows as $row) {
            $DB->update_record('local_prequran_live_participant', (object)[
                'id' => (int)$row->id, 'status' => 'removed', 'timemodified' => $now,
            ]);
            $summary['future_sessions']++;
        }
    }

    // 5) Open enrol requests -> withdrawn; enrolled ones get the Moodle
    // enrolment SUSPENDED (grades/roster kept, access closed).
    if ($tableexists('local_prequran_course_enrol_req') && $tableexists('local_prequran_course_offering')) {
        $rows = $DB->get_records_sql(
            "SELECT r.id, r.status, o.moodlecourseid
               FROM {local_prequran_course_enrol_req} r
               JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
              WHERE r.workspaceid = :workspaceid AND r.studentid = :studentid
                AND r.status IN ('pending', 'approved', 'waitlisted', 'enrolled', 'drop_requested')",
            ['workspaceid' => $workspaceid, 'studentid' => $studentid]);
        foreach ($rows as $row) {
            $wasenrolled = in_array((string)$row->status, ['enrolled', 'drop_requested'], true);
            $DB->update_record('local_prequran_course_enrol_req', (object)[
                'id' => (int)$row->id, 'status' => 'withdrawn',
                'droppedby' => $actorid, 'droppedat' => $now, 'timemodified' => $now,
            ]);
            $summary['requests_withdrawn']++;
            if ($wasenrolled && (int)$row->moodlecourseid > 0
                    && pqwpl_suspend_manual_enrolment($studentid, (int)$row->moodlecourseid)) {
                $summary['enrolments_suspended']++;
            }
        }
    }

    // Audit one summarizing row.
    if ($tableexists('local_prequran_course_audit')) {
        try {
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
                'studentid' => $studentid, 'actorid' => $actorid, 'action' => 'student_offboarded',
                'targettype' => 'user', 'targetid' => $studentid,
                'details' => json_encode($summary, JSON_UNESCAPED_SLASHES),
                'timecreated' => $now,
            ]);
        } catch (Throwable $e) {
            // Audit must not break the offboarding.
        }
    }

    $summary['account'] = pqwpl_identity_offboard_account($studentid, $workspaceid, $actorid, 'student');

    return $summary;
}

/**
 * Suspend a user's MANUAL enrolment in a course (grades/roster preserved).
 * Local replica of pqco_set_student_enrol_status — course_offeringlib is not
 * loaded by every caller of this lib. True when a status change applied.
 */
function pqwpl_suspend_manual_enrolment(int $userid, int $courseid): bool {
    global $CFG, $DB;

    require_once($CFG->libdir . '/enrollib.php');
    $manual = enrol_get_plugin('manual');
    if (!$manual || $userid <= 0 || $courseid <= 0) {
        return false;
    }
    foreach (enrol_get_instances($courseid, false) as $instance) {
        if ((string)$instance->enrol !== 'manual') {
            continue;
        }
        $ue = $DB->get_record('user_enrolments', ['enrolid' => $instance->id, 'userid' => $userid]);
        if (!$ue) {
            continue;
        }
        if ((int)$ue->status === ENROL_USER_SUSPENDED) {
            return false;
        }
        $manual->update_user_enrol($instance, $userid, ENROL_USER_SUSPENDED);
        return true;
    }
    return false;
}

/**
 * Governance audit: privileged-membership changes were the only writes in the
 * plugin with NO trail (granting workspace owner/admin, deactivating a
 * member). One row into course_audit per event; failures never break the
 * calling write.
 */
function pqwpl_governance_audit(string $action, int $workspaceid, int $targetuserid, int $actorid, array $details = []): void {
    global $DB;
    try {
        if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_course_audit'))) {
            return;
        }
        $DB->insert_record('local_prequran_course_audit', (object)[
            'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
            'studentid' => 0, 'actorid' => $actorid,
            'action' => substr($action, 0, 80),
            'targettype' => 'user', 'targetid' => $targetuserid,
            'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // Audit must never break the write it describes.
    }
}

// ---------------------------------------------------------------------------
// Identity lifecycle: offboarding account suspension + admin password reset.
// ---------------------------------------------------------------------------

/**
 * Does this user still have an active identity ANYWHERE besides the given
 * workspace? Checks active workspace memberships elsewhere, active guardian
 * (parent) consent links, and active teacher-student assignments elsewhere.
 * Returns a list of human-readable reasons; empty = no other presence.
 */
function pqwpl_user_other_active_presence(int $userid, int $excludeworkspaceid): array {
    global $DB;

    $reasons = [];
    $members = (int)$DB->count_records_select('local_prequran_workspace_member',
        "userid = :userid AND status = 'active' AND workspaceid <> :ws",
        ['userid' => $userid, 'ws' => $excludeworkspaceid]);
    if ($members > 0) {
        $reasons[] = $members . ' active workspace membership(s) elsewhere';
    }
    if (pqh_table_exists_safe('local_prequran_comm_consent')) {
        $guardconditions = "guardianid = :userid";
        $columns = $DB->get_columns('local_prequran_comm_consent');
        if (isset($columns['consented'])) {
            $guardconditions .= " AND consented = 1";
        }
        $guardian = (int)$DB->count_records_select('local_prequran_comm_consent', $guardconditions,
            ['userid' => $userid]);
        if ($guardian > 0) {
            $reasons[] = $guardian . ' active guardian link(s)';
        }
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $teaching = (int)$DB->count_records_select('local_prequran_teacher_student',
            "teacherid = :userid AND status = 'active' AND workspaceid <> :ws",
            ['userid' => $userid, 'ws' => $excludeworkspaceid]);
        if ($teaching > 0) {
            $reasons[] = $teaching . ' active teaching assignment(s) elsewhere';
        }
    }
    return $reasons;
}

/**
 * Offboarding tail: suspend the Moodle ACCOUNT (not just memberships) when the
 * departing person has no remaining presence on the platform. Gated by
 * identity_offboard_mode (''=off, report, enforce); never touches siteadmins,
 * school principals, or accounts still active elsewhere. Enforce also kills
 * live sessions and revokes unexpired portal tokens.
 */
function pqwpl_identity_offboard_account(int $userid, int $workspaceid, int $actorid, string $rolelabel): string {
    global $CFG, $DB;

    $mode = (string)get_config('local_prequran', 'identity_offboard_mode');
    if ($mode !== 'report' && $mode !== 'enforce') {
        return 'account untouched (identity_offboard_mode off)';
    }
    if (is_siteadmin($userid) || (function_exists('pqh_is_school_principal') && pqh_is_school_principal($userid))) {
        return 'account kept (platform-privileged account; core roles are managed manually)';
    }
    $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0], 'id,username,suspended', IGNORE_MISSING);
    if (!$user || (int)$user->suspended === 1) {
        return 'account already suspended or deleted';
    }
    $reasons = pqwpl_user_other_active_presence($userid, $workspaceid);
    $auditrow = static function (string $action, array $details) use ($DB, $userid, $workspaceid, $actorid): void {
        try {
            if (pqh_table_exists_safe('local_prequran_course_audit')) {
                $DB->insert_record('local_prequran_course_audit', (object)[
                    'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
                    'studentid' => 0, 'actorid' => $actorid, 'action' => $action,
                    'targettype' => 'user', 'targetid' => $userid,
                    'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
                    'timecreated' => time(),
                ]);
            }
        } catch (Throwable $e) {
            // Audit must not break offboarding.
        }
    };
    if (count($reasons) > 0) {
        $auditrow('account_suspend_skipped', ['role' => $rolelabel, 'reasons' => $reasons]);
        return 'account kept (' . implode('; ', $reasons) . ')';
    }
    if ($mode === 'report') {
        $auditrow('account_suspend_candidate', ['role' => $rolelabel]);
        return 'account suspension CANDIDATE (report mode; set identity_offboard_mode=enforce to apply)';
    }
    $update = (object)['id' => $userid, 'suspended' => 1, 'timemodified' => time()];
    $DB->update_record('user', $update);
    \core\session\manager::kill_user_sessions($userid);
    $tokens = 0;
    $gatewaylib = $CFG->dirroot . '/local/prequran/progress_gatewaylib.php';
    if (is_readable($gatewaylib)) {
        require_once($gatewaylib);
    }
    if (function_exists('pqpg_revoke_user_tokens')) {
        $tokens = pqpg_revoke_user_tokens($userid, $actorid);
    }
    $auditrow('account_suspended_on_offboard', ['role' => $rolelabel, 'tokens_revoked' => $tokens]);
    return 'account SUSPENDED (sessions killed, ' . $tokens . ' portal token(s) revoked)';
}

/**
 * Staff password reset for a workspace member: random temp password + forced
 * change on first login + sessions/tokens revoked. Refuses platform-privileged
 * accounts and manager-tier members (they use core recovery — a workspace
 * admin must not be able to take over a peer admin's account).
 */
function pqwpl_reset_member_password(int $workspaceid, int $targetuserid, int $actorid): array {
    global $CFG, $DB;

    $member = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid, 'userid' => $targetuserid, 'status' => 'active',
    ], '*', IGNORE_MISSING);
    if (!$member) {
        throw new Exception('That user is not an active member of this workspace.');
    }
    if (is_siteadmin($targetuserid) || (function_exists('pqh_is_school_principal') && pqh_is_school_principal($targetuserid))) {
        throw new Exception('Platform-privileged accounts must use the standard password recovery.');
    }
    if (in_array((string)$member->workspace_role, ['owner', 'admin', 'platform_admin'], true)) {
        throw new Exception('Manager-tier accounts must use the standard password recovery (peer admins cannot reset each other).');
    }
    $user = $DB->get_record('user', ['id' => $targetuserid, 'deleted' => 0, 'suspended' => 0], '*', MUST_EXIST);
    $password = generate_password(12);
    update_internal_user_password($user, $password);
    set_user_preference('auth_forcepasswordchange', 1, $targetuserid);
    \core\session\manager::kill_user_sessions($targetuserid);
    $gatewaylib = $CFG->dirroot . '/local/prequran/progress_gatewaylib.php';
    if (is_readable($gatewaylib)) {
        require_once($gatewaylib);
    }
    if (function_exists('pqpg_revoke_user_tokens')) {
        pqpg_revoke_user_tokens($targetuserid, $actorid);
    }
    pqwpl_governance_audit('member_password_reset', $workspaceid, $targetuserid, $actorid, [
        'workspace_role' => (string)$member->workspace_role,
    ]);
    return [(string)$user->username, $password];
}
