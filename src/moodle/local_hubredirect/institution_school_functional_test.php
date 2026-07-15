<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution school functional test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution school test access required'
);

function pqisft_table_ready(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqisft_has_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqisft_record(string $table, array $record): stdClass {
    $out = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqisft_has_field($table, $field)) {
            $out[$field] = $value;
        }
    }
    return (object)$out;
}

function pqisft_huda_workspace_id(int $requestedid): int {
    global $DB;
    if ($requestedid > 0 && $DB->record_exists('local_prequran_workspace', ['id' => $requestedid])) {
        return $requestedid;
    }
    $records = $DB->get_records_sql(
        "SELECT id
           FROM {local_prequran_workspace}
          WHERE status <> :archived
            AND (" . $DB->sql_like('name', ':name', false) . "
                 OR " . $DB->sql_like('slug', ':slug', false) . ")
       ORDER BY id DESC",
        ['archived' => 'archived', 'name' => '%Huda%', 'slug' => '%huda%'],
        0,
        1
    );
    $record = reset($records);
    return $record ? (int)$record->id : 0;
}

function pqisft_workspace_id_by_slug(string $slug): int {
    global $DB;
    return (int)$DB->get_field('local_prequran_workspace', 'id', ['slug' => $slug], IGNORE_MISSING);
}

function pqisft_upsert_workspace(string $slug, string $name, string $type = 'institution'): int {
    global $DB, $USER;
    if (!pqisft_table_ready('local_prequran_workspace')) {
        return 0;
    }
    $existing = $DB->get_record('local_prequran_workspace', ['slug' => $slug], '*', IGNORE_MISSING);
    $record = [
        'name' => $name,
        'slug' => $slug,
        'workspace_type' => $type,
        'ownerid' => 0,
        'status' => 'active',
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['created_from' => 'institution_school_functional_test'], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
        'timecreated' => (int)($existing->timecreated ?? time()),
        'timemodified' => time(),
    ];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $DB->update_record('local_prequran_workspace', pqisft_record('local_prequran_workspace', $record));
        return (int)$existing->id;
    }
    return (int)$DB->insert_record('local_prequran_workspace', pqisft_record('local_prequran_workspace', $record));
}

function pqisft_upsert_org_group(string $slug, string $name, string $type, array $policy): int {
    global $DB, $USER;
    if (!pqh_org_group_schema_ready()) {
        return 0;
    }
    $existing = $DB->get_record('local_prequran_org_group', ['slug' => $slug], '*', IGNORE_MISSING);
    $record = [
        'slug' => $slug,
        'name' => $name,
        'group_type' => $type,
        'parentconsumerid' => (int)($existing->parentconsumerid ?? 0),
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
        'timecreated' => (int)($existing->timecreated ?? time()),
        'timemodified' => time(),
    ];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $DB->update_record('local_prequran_org_group', pqisft_record('local_prequran_org_group', $record));
        return (int)$existing->id;
    }
    return (int)$DB->insert_record('local_prequran_org_group', pqisft_record('local_prequran_org_group', $record));
}

function pqisft_ensure_operating_model_groups(): array {
    return [
        'owned' => pqisft_upsert_org_group('owned-schools', 'Owned Schools', 'owned_group', [
            'model' => 'wholly_owned_schools',
            'default_workspace_relationship' => 'owned_branch',
            'default_access_scope' => 'operations',
            'inherit_sensitive_access' => true,
        ]),
        'franchise' => pqisft_upsert_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', [
            'model' => 'independent_franchise_schools',
            'default_workspace_relationship' => 'franchise_member',
            'default_access_scope' => 'governance',
            'inherit_sensitive_access' => false,
        ]),
    ];
}

function pqisft_upsert_user(string $role, string $prefix = 'huda.sqa', string $firstname = 'Huda'): array {
    global $CFG, $DB;
    $username = $prefix . '.' . $role;
    $email = $username . '@example.test';
    $password = 'Mock@001!';
    $user = $DB->get_record('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id], '*', IGNORE_MISSING);
    if ($user) {
        update_internal_user_password($user, $password);
        $user->auth = 'manual';
        $user->confirmed = 1;
        $user->deleted = 0;
        $user->suspended = 0;
        $user->emailstop = 1;
        $user->timemodified = time();
        $DB->update_record('user', $user);
        $userid = (int)$user->id;
    } else {
        $userid = (int)user_create_user((object)[
            'auth' => 'manual',
            'confirmed' => 1,
            'mnethostid' => $CFG->mnet_localhost_id,
            'username' => $username,
            'password' => $password,
            'firstname' => $firstname,
            'lastname' => 'SQA ' . ucfirst(str_replace('_', ' ', $role)),
            'email' => $email,
            'emailstop' => 1,
            'city' => 'SQA City',
            'timezone' => 'Africa/Nairobi',
            'lang' => $CFG->lang ?? 'en',
            'description' => 'Generated by the institution school functional test.',
        ], true, false);
        pqh_assign_account_id($userid, $role === 'parent' ? 'parent' : $role);
    }
    return ['id' => $userid, 'username' => $username, 'email' => $email, 'password' => $password];
}

function pqisft_upsert_workspace_member(int $workspaceid, int $userid, string $role): void {
    global $DB, $USER;
    if (!pqisft_table_ready('local_prequran_workspace_member')) {
        return;
    }
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], '*', IGNORE_MISSING);
    $record = [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'role' => $role,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => 'Huda-school institution functional test fixture.',
        'createdby' => (int)$USER->id,
        'timecreated' => (int)($existing->timecreated ?? time()),
        'timemodified' => time(),
    ];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $DB->update_record('local_prequran_workspace_member', pqisft_record('local_prequran_workspace_member', $record));
    } else {
        $DB->insert_record('local_prequran_workspace_member', pqisft_record('local_prequran_workspace_member', $record));
    }
}

function pqisft_upsert_org_group_user(string $groupslug, int $userid, string $role, string $accessscope = 'governance', int $inheritsensitive = 0): void {
    global $DB, $USER;
    if (!pqh_org_group_schema_ready()) {
        return;
    }
    $groupid = (int)$DB->get_field('local_prequran_org_group', 'id', ['slug' => $groupslug, 'status' => 'active'], IGNORE_MISSING);
    if ($groupid <= 0) {
        return;
    }
    $existing = $DB->get_record('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'user',
        'memberid' => $userid,
        'group_role' => $role,
    ], '*', IGNORE_MISSING);
    $record = [
        'groupid' => $groupid,
        'member_type' => 'user',
        'memberid' => $userid,
        'relationship_type' => 'member',
        'group_role' => $role,
        'access_scope' => $accessscope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => 'active',
        'notes' => 'Institution school functional test fixture.',
        'createdby' => (int)$USER->id,
        'timecreated' => (int)($existing->timecreated ?? time()),
        'timemodified' => time(),
    ];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $DB->update_record('local_prequran_org_group_member', pqisft_record('local_prequran_org_group_member', $record));
    } else {
        $DB->insert_record('local_prequran_org_group_member', pqisft_record('local_prequran_org_group_member', $record));
    }
}

function pqisft_upsert_org_user(int $userid, string $role): void {
    pqisft_upsert_org_group_user('owned-schools', $userid, $role, 'governance,operations', 1);
}

function pqisft_ensure_org_workspace_link(
    string $groupslug,
    int $workspaceid,
    string $relationship,
    string $accessscope,
    int $inheritsensitive,
    string $notes
): void {
    global $DB, $USER;
    if (!pqh_org_group_schema_ready()) {
        return;
    }
    $groupid = (int)$DB->get_field('local_prequran_org_group', 'id', ['slug' => $groupslug, 'status' => 'active'], IGNORE_MISSING);
    if ($groupid <= 0) {
        return;
    }
    $othergroups = ['owned-schools', 'franchise-schools'];
    if (in_array($groupslug, $othergroups, true)) {
        [$insql, $params] = $DB->get_in_or_equal($othergroups, SQL_PARAMS_NAMED, 'orgslug');
        $params['membertype'] = 'workspace';
        $params['workspaceid'] = $workspaceid;
        $params['status'] = 'active';
        $params['groupid'] = $groupid;
        $oldlinks = $DB->get_records_sql(
            "SELECT gm.*
               FROM {local_prequran_org_group_member} gm
               JOIN {local_prequran_org_group} g ON g.id = gm.groupid
              WHERE gm.member_type = :membertype
                AND gm.memberid = :workspaceid
                AND gm.status = :status
                AND g.slug {$insql}
                AND g.id <> :groupid",
            $params
        );
        foreach ($oldlinks as $oldlink) {
            $oldlink->status = 'inactive';
            $oldlink->timemodified = time();
            $DB->update_record('local_prequran_org_group_member', $oldlink);
        }
    }
    $existing = $DB->get_record('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'group_role' => 'member',
    ], '*', IGNORE_MISSING);
    $record = [
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'relationship_type' => $relationship,
        'group_role' => 'member',
        'access_scope' => $accessscope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => 'active',
        'notes' => $notes,
        'createdby' => (int)$USER->id,
        'timecreated' => (int)($existing->timecreated ?? time()),
        'timemodified' => time(),
    ];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $DB->update_record('local_prequran_org_group_member', pqisft_record('local_prequran_org_group_member', $record));
    } else {
        $DB->insert_record('local_prequran_org_group_member', pqisft_record('local_prequran_org_group_member', $record));
    }
}

function pqisft_ensure_owned_branch_link(int $workspaceid, string $notes = 'Institution school functional test owned branch.'): void {
    pqisft_ensure_org_workspace_link($workspaceid > 0 ? 'owned-schools' : '', $workspaceid, 'owned_branch', 'governance,operations', 1, $notes);
}

function pqisft_ensure_franchise_link(int $workspaceid): void {
    pqisft_ensure_org_workspace_link(
        'franchise-schools',
        $workspaceid,
        'franchise_member',
        'governance',
        0,
        'Institution school functional test franchise member.'
    );
}

function pqisft_upsert_simple(string $table, array $conditions, array $values): int {
    global $DB;
    if (!pqisft_table_ready($table)) {
        return 0;
    }
    $existing = $DB->get_record($table, $conditions, '*', IGNORE_MISSING);
    if (!$existing && $table === 'local_prequran_live_session' && !empty($values['bbb_meeting_id'])) {
        $existing = $DB->get_record($table, ['bbb_meeting_id' => (string)$values['bbb_meeting_id']], '*', IGNORE_MISSING);
    }
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        $DB->update_record($table, pqisft_record($table, $record));
        return (int)$existing->id;
    }
    $record['timecreated'] = time();
    return (int)$DB->insert_record($table, pqisft_record($table, $record));
}

function pqisft_create_school_fixture(int $workspaceid, string $prefix, string $label, bool $ownedbranch): array {
    global $DB, $USER;
    $shortlabel = preg_replace('/[^A-Za-z0-9]+/', ' ', $label) ?: $label;
    $sluglabel = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $label) ?: $label);
    $sluglabel = trim($sluglabel, '-');
    $users = [
        'school_admin' => pqisft_upsert_user('school_admin', $prefix, $shortlabel),
        'teacher' => pqisft_upsert_user('teacher', $prefix, $shortlabel),
        'student' => pqisft_upsert_user('student', $prefix, $shortlabel),
        'parent' => pqisft_upsert_user('parent', $prefix, $shortlabel),
    ];
    if ($ownedbranch) {
        pqisft_ensure_owned_branch_link($workspaceid, $label . ' owned branch fixture.');
    } else {
        pqisft_ensure_franchise_link($workspaceid);
    }
    pqisft_upsert_workspace_member($workspaceid, (int)$users['school_admin']['id'], 'admin');
    pqisft_upsert_workspace_member($workspaceid, (int)$users['teacher']['id'], 'teacher');
    pqisft_upsert_workspace_member($workspaceid, (int)$users['student']['id'], 'student');
    pqisft_upsert_workspace_member($workspaceid, (int)$users['parent']['id'], 'parent');

    pqisft_upsert_simple('local_prequran_teacher_student', [
        'workspaceid' => $workspaceid,
        'teacherid' => (int)$users['teacher']['id'],
        'studentid' => (int)$users['student']['id'],
    ], [
        'status' => 'active',
        'relationship_type' => 'primary',
        'notes' => $label . ' institution functional test.',
    ]);
    pqisft_upsert_simple('local_prequran_comm_consent', [
        'workspaceid' => $workspaceid,
        'studentid' => (int)$users['student']['id'],
        'guardianid' => (int)$users['parent']['id'],
    ], [
        'guardianemail' => (string)$users['parent']['email'],
        'status' => 'consented',
        'consent_source' => 'institution_school_functional_test',
        'details' => $label . ' parent/student fixture.',
    ]);
    pqisft_upsert_simple('local_prequran_live_consent', [
        'workspaceid' => $workspaceid,
        'studentid' => (int)$users['student']['id'],
        'guardianid' => (int)$users['parent']['id'],
    ], [
        'guardianemail' => (string)$users['parent']['email'],
        'status' => 'consented',
        'consent_source' => 'institution_school_functional_test',
        'details' => $label . ' live consent fixture.',
    ]);
    pqisft_upsert_simple('local_prequran_student_profile', [
        'workspaceid' => $workspaceid,
        'userid' => (int)$users['student']['id'],
    ], [
        'student_display_name' => $label . ' Student',
        'timezone' => 'Africa/Nairobi',
        'language' => 'English',
        'age_years' => 8,
        'age_band' => '6-8',
        'current_level' => 'pre_quraan',
        'learning_base' => 'beginner',
        'country' => 'Kenya',
        'city' => 'Nairobi',
        'gender' => '',
        'availability' => 'SQA fixture',
        'parent_preferences' => 'SQA fixture',
        'status' => 'active',
        'createdby' => (int)$USER->id,
    ]);
    pqisft_upsert_simple('local_prequran_teacher_profile', [
        'workspaceid' => $workspaceid,
        'userid' => (int)$users['teacher']['id'],
    ], [
        'teacher_display_name' => $label . ' Teacher',
        'timezone' => 'Africa/Nairobi',
        'primary_language' => 'English',
        'courses' => 'pre_quraan',
        'status' => 'active',
        'createdby' => (int)$USER->id,
    ]);

    $poolid = pqisft_upsert_simple('local_prequran_group_pool', [
        'workspaceid' => $workspaceid,
        'title' => $label . ' Functional Pool',
    ], [
        'course_type' => 'pre_quraan',
        'timezone' => 'Africa/Nairobi',
        'language' => 'English',
        'age_min' => 6,
        'age_max' => 10,
        'level_min' => 'beginner',
        'level_max' => 'beginner',
        'learning_base' => 'pre_quraan',
        'country' => 'Kenya',
        'city' => 'Nairobi',
        'gender_policy' => 'flexible',
        'schedule_preferences' => 'SQA fixture',
        'rule_notes' => $label . ' institution functional test.',
        'max_students' => 9,
        'status' => 'active',
        'createdby' => (int)$USER->id,
    ]);
    $groupid = pqisft_upsert_simple('local_prequran_class_group', [
        'workspaceid' => $workspaceid,
        'title' => $label . ' Functional Class',
    ], [
        'poolid' => $poolid,
        'teacherid' => (int)$users['teacher']['id'],
        'course_type' => 'pre_quraan',
        'timezone' => 'Africa/Nairobi',
        'language' => 'English',
        'current_level' => 'beginner',
        'learning_base' => 'pre_quraan',
        'country' => 'Kenya',
        'city' => 'Nairobi',
        'age_min' => 6,
        'age_max' => 10,
        'gender_policy' => 'flexible',
        'schedule_summary' => $label . ' SQA fixture',
        'max_students' => 9,
        'status' => 'active',
        'createdby' => (int)$USER->id,
    ]);
    pqisft_upsert_simple('local_prequran_group_member', [
        'workspaceid' => $workspaceid,
        'groupid' => $groupid,
        'studentid' => (int)$users['student']['id'],
    ], [
        'poolid' => $poolid,
        'match_score' => 100,
        'match_status' => 'best_match',
        'assignment_status' => 'active',
        'match_details' => $label . ' institution functional test.',
        'assignedby' => (int)$USER->id,
    ]);

    $sessionid = pqisft_upsert_simple('local_prequran_live_session', [
        'workspaceid' => $workspaceid,
        'title' => $label . ' Functional Live Session',
    ], [
        'groupid' => $groupid,
        'teacherid' => (int)$users['teacher']['id'],
        'lessonid' => 'sqa_' . ($sluglabel !== '' ? $sluglabel : 'school'),
        'unitid' => 'functional',
        'description' => $label . ' institution functional test.',
        'scheduled_start' => time() + DAYSECS,
        'scheduled_end' => time() + DAYSECS + HOURSECS,
        'timezone' => 'Africa/Nairobi',
        'status' => 'scheduled',
        'recording_enabled' => 0,
        'recording_consent_required' => 1,
        'parent_observer_allowed' => 0,
        'max_participants' => 12,
        'bbb_meeting_id' => ($sluglabel !== '' ? $sluglabel : 'school') . '-w' . $workspaceid . '-sqa-functional',
        'bbb_internal_meeting_id' => '',
        'bbb_created' => 0,
        'bbb_create_time' => 0,
        'bbb_last_error' => '',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
    ]);
    pqisft_upsert_simple('local_prequran_live_participant', [
        'workspaceid' => $workspaceid,
        'sessionid' => $sessionid,
        'userid' => (int)$users['teacher']['id'],
        'role' => 'teacher',
    ], [
        'studentid' => 0,
        'status' => 'active',
        'displayname' => $label . ' Teacher',
        'invitedby' => (int)$USER->id,
    ]);
    pqisft_upsert_simple('local_prequran_live_participant', [
        'workspaceid' => $workspaceid,
        'sessionid' => $sessionid,
        'userid' => (int)$users['student']['id'],
        'role' => 'student',
    ], [
        'studentid' => (int)$users['student']['id'],
        'status' => 'active',
        'displayname' => $label . ' Student',
        'invitedby' => (int)$USER->id,
    ]);

    return ['users' => $users, 'poolid' => $poolid, 'groupid' => $groupid, 'sessionid' => $sessionid];
}

function pqisft_create_fixture(int $workspaceid): array {
    $users = ['institution_admin' => pqisft_upsert_user('institution_admin')];
    pqisft_upsert_org_user((int)$users['institution_admin']['id'], 'admin');
    $fixture = pqisft_create_school_fixture($workspaceid, 'huda.sqa', 'Huda SQA', true);
    $fixture['users'] = $users + $fixture['users'];
    return $fixture;
}

function pqisft_create_extended_fixture(int $hudaspaceid): array {
    pqisft_ensure_operating_model_groups();
    $huda = pqisft_create_fixture($hudaspaceid);
    $branchbworkspaceid = pqisft_upsert_workspace('huda-branch-b-sqa', 'Huda Branch B SQA', 'institution');
    $branchb = pqisft_create_school_fixture($branchbworkspaceid, 'huda.branchb.sqa', 'Huda Branch B SQA', true);
    $franchiseworkspaceid = pqisft_upsert_workspace('huda-franchise-sqa', 'Huda Franchise SQA', 'institution');
    $franchise = pqisft_create_school_fixture($franchiseworkspaceid, 'huda.franchise.sqa', 'Huda Franchise SQA', false);
    $franchiseadmin = pqisft_upsert_user('franchise_admin', 'huda.franchise.sqa', 'Huda Franchise');
    pqisft_upsert_org_group_user('franchise-schools', (int)$franchiseadmin['id'], 'admin', 'governance', 0);

    return [
        'huda' => $huda + ['workspaceid' => $hudaspaceid, 'label' => 'Huda-school'],
        'branchb' => $branchb + ['workspaceid' => $branchbworkspaceid, 'label' => 'Huda Branch B'],
        'franchise' => $franchise + ['workspaceid' => $franchiseworkspaceid, 'label' => 'Huda Franchise', 'franchise_admin' => $franchiseadmin],
    ];
}

function pqisft_count(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqisft_checks(int $workspaceid, array $fixture): array {
    global $DB;
    $users = $fixture['users'];
    $instadmin = (int)$users['institution_admin']['id'];
    $schooladmin = (int)$users['school_admin']['id'];
    $teacherid = (int)$users['teacher']['id'];
    $studentid = (int)$users['student']['id'];
    $parentid = (int)$users['parent']['id'];
    $schooladminworkspaces = pqh_user_allowed_workspace_ids($schooladmin, 'operations.manage');
    $franchiseexpanded = pqisft_count(
        "SELECT COUNT(1)
           FROM {local_prequran_org_group} g
           JOIN {local_prequran_org_group_member} gm ON gm.groupid = g.id
          WHERE g.slug = :slug
            AND g.group_type = :grouptype
            AND g.status = :groupstatus
            AND gm.member_type = :membertype
            AND gm.relationship_type = :relationship
            AND gm.status = :memberstatus
            AND (" . $DB->sql_like("LOWER(CONCAT(',', REPLACE(gm.access_scope, ' ', ''), ','))", ':operations') . "
                 OR COALESCE(gm.inherit_sensitive_access, 0) <> 0)",
        [
            'slug' => 'franchise-schools',
            'grouptype' => 'franchise_network',
            'groupstatus' => 'active',
            'membertype' => 'workspace',
            'relationship' => 'franchise_member',
            'memberstatus' => 'active',
            'operations' => '%,operations,%',
        ]
    );

    return [
        ['name' => 'school_admin_member', 'pass' => $DB->record_exists('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'userid' => $schooladmin, 'workspace_role' => 'admin', 'status' => 'active'])],
        ['name' => 'teacher_member', 'pass' => $DB->record_exists('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'userid' => $teacherid, 'workspace_role' => 'teacher', 'status' => 'active'])],
        ['name' => 'student_member', 'pass' => $DB->record_exists('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'userid' => $studentid, 'workspace_role' => 'student', 'status' => 'active'])],
        ['name' => 'parent_member', 'pass' => $DB->record_exists('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'userid' => $parentid, 'workspace_role' => 'parent', 'status' => 'active'])],
        ['name' => 'class_group_workspaceid', 'pass' => $DB->record_exists('local_prequran_class_group', ['id' => (int)$fixture['groupid'], 'workspaceid' => $workspaceid])],
        ['name' => 'live_session_workspaceid', 'pass' => $DB->record_exists('local_prequran_live_session', ['id' => (int)$fixture['sessionid'], 'workspaceid' => $workspaceid])],
        ['name' => 'owned_branch_institution_admin_can_manage', 'pass' => pqh_user_can_manage_workspace($instadmin, $workspaceid)],
        ['name' => 'school_admin_only_huda', 'pass' => count($schooladminworkspaces) === 1 && in_array($workspaceid, $schooladminworkspaces, true)],
        ['name' => 'teacher_can_teach_huda', 'pass' => pqh_user_can_teach_in_workspace($teacherid, $workspaceid)],
        ['name' => 'teacher_no_other_school_classes', 'pass' => pqisft_count("SELECT COUNT(1) FROM {local_prequran_class_group} WHERE teacherid = :teacherid AND workspaceid <> :workspaceid", ['teacherid' => $teacherid, 'workspaceid' => $workspaceid]) === 0],
        ['name' => 'parent_only_huda_membership', 'pass' => pqisft_count("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE userid = :userid AND workspaceid <> :workspaceid AND status = :status", ['userid' => $parentid, 'workspaceid' => $workspaceid, 'status' => 'active']) === 0],
        ['name' => 'student_only_huda_membership', 'pass' => pqisft_count("SELECT COUNT(1) FROM {local_prequran_workspace_member} WHERE userid = :userid AND workspaceid <> :workspaceid AND status = :status", ['userid' => $studentid, 'workspaceid' => $workspaceid, 'status' => 'active']) === 0],
        ['name' => 'franchise_governance_only', 'pass' => $franchiseexpanded === 0],
    ];
}

function pqisft_extended_checks(array $fixture): array {
    global $DB;
    $huda = $fixture['huda'];
    $branchb = $fixture['branchb'];
    $franchise = $fixture['franchise'];
    $hudaid = (int)$huda['workspaceid'];
    $branchbid = (int)$branchb['workspaceid'];
    $franchiseid = (int)$franchise['workspaceid'];
    $instadmin = (int)$huda['users']['institution_admin']['id'];
    $hudaadmin = (int)$huda['users']['school_admin']['id'];
    $hudateacher = (int)$huda['users']['teacher']['id'];
    $branchbadmin = (int)$branchb['users']['school_admin']['id'];
    $branchbteacher = (int)$branchb['users']['teacher']['id'];
    $franchiseadmin = (int)$franchise['franchise_admin']['id'];

    $checks = pqisft_checks($hudaid, $huda);
    $hudaadminworkspaces = pqh_user_allowed_workspace_ids($hudaadmin, 'operations.manage');
    $branchbadminworkspaces = pqh_user_allowed_workspace_ids($branchbadmin, 'operations.manage');
    $instadminworkspaces = pqh_user_allowed_workspace_ids($instadmin, 'operations.manage');
    $franchisegovernanceworkspaces = pqh_user_org_group_workspace_ids($franchiseadmin, 'governance.view');
    $franchiseoperationsworkspaces = pqh_user_org_group_workspace_ids($franchiseadmin, 'operations.manage');

    $checks[] = ['name' => 'second_owned_branch_workspace_created', 'pass' => $branchbid > 0 && $DB->record_exists('local_prequran_workspace', ['id' => $branchbid, 'slug' => 'huda-branch-b-sqa', 'status' => 'active'])];
    $checks[] = ['name' => 'second_owned_branch_linked', 'pass' => pqisft_count(
        "SELECT COUNT(1)
           FROM {local_prequran_org_group} g
           JOIN {local_prequran_org_group_member} gm ON gm.groupid = g.id
          WHERE g.slug = :slug
            AND gm.member_type = :membertype
            AND gm.memberid = :workspaceid
            AND gm.relationship_type = :relationship
            AND gm.status = :status
            AND " . $DB->sql_like("LOWER(CONCAT(',', REPLACE(gm.access_scope, ' ', ''), ','))", ':operations') . "
            AND COALESCE(gm.inherit_sensitive_access, 0) = 1",
        ['slug' => 'owned-schools', 'membertype' => 'workspace', 'workspaceid' => $branchbid, 'relationship' => 'owned_branch', 'status' => 'active', 'operations' => '%,operations,%']
    ) >= 1];
    $checks[] = ['name' => 'institution_admin_can_manage_both_owned_branches', 'pass' => pqh_user_can_manage_workspace($instadmin, $hudaid) && pqh_user_can_manage_workspace($instadmin, $branchbid) && in_array($hudaid, $instadminworkspaces, true) && in_array($branchbid, $instadminworkspaces, true)];
    $checks[] = ['name' => 'huda_admin_cannot_manage_branch_b', 'pass' => !pqh_user_can_manage_workspace($hudaadmin, $branchbid) && count($hudaadminworkspaces) === 1 && in_array($hudaid, $hudaadminworkspaces, true)];
    $checks[] = ['name' => 'branch_b_admin_cannot_manage_huda', 'pass' => !pqh_user_can_manage_workspace($branchbadmin, $hudaid) && count($branchbadminworkspaces) === 1 && in_array($branchbid, $branchbadminworkspaces, true)];
    $checks[] = ['name' => 'huda_teacher_cannot_teach_branch_b', 'pass' => !pqh_user_can_teach_in_workspace($hudateacher, $branchbid)];
    $checks[] = ['name' => 'branch_b_teacher_cannot_teach_huda', 'pass' => !pqh_user_can_teach_in_workspace($branchbteacher, $hudaid)];
    $checks[] = ['name' => 'branch_b_teacher_no_huda_classes', 'pass' => pqisft_count("SELECT COUNT(1) FROM {local_prequran_class_group} WHERE teacherid = :teacherid AND workspaceid <> :workspaceid", ['teacherid' => $branchbteacher, 'workspaceid' => $branchbid]) === 0];
    $checks[] = ['name' => 'franchise_workspace_created', 'pass' => $franchiseid > 0 && $DB->record_exists('local_prequran_workspace', ['id' => $franchiseid, 'slug' => 'huda-franchise-sqa', 'status' => 'active'])];
    $checks[] = ['name' => 'franchise_workspace_governance_only_link', 'pass' => pqisft_count(
        "SELECT COUNT(1)
           FROM {local_prequran_org_group} g
           JOIN {local_prequran_org_group_member} gm ON gm.groupid = g.id
          WHERE g.slug = :slug
            AND g.group_type = :grouptype
            AND gm.member_type = :membertype
            AND gm.memberid = :workspaceid
            AND gm.relationship_type = :relationship
            AND gm.access_scope = :scope
            AND COALESCE(gm.inherit_sensitive_access, 0) = 0
            AND gm.status = :status",
        ['slug' => 'franchise-schools', 'grouptype' => 'franchise_network', 'membertype' => 'workspace', 'workspaceid' => $franchiseid, 'relationship' => 'franchise_member', 'scope' => 'governance', 'status' => 'active']
    ) >= 1];
    $checks[] = ['name' => 'franchise_admin_has_governance_not_operations', 'pass' => in_array($franchiseid, $franchisegovernanceworkspaces, true) && !in_array($franchiseid, $franchiseoperationsworkspaces, true) && !pqh_user_can_manage_workspace($franchiseadmin, $franchiseid)];
    $checks[] = ['name' => 'institution_admin_cannot_manage_franchise', 'pass' => !pqh_user_can_manage_workspace($instadmin, $franchiseid)];
    $checks[] = ['name' => 'franchise_not_linked_to_owned_group', 'pass' => pqisft_count(
        "SELECT COUNT(1)
           FROM {local_prequran_org_group} g
           JOIN {local_prequran_org_group_member} gm ON gm.groupid = g.id
          WHERE g.slug = :slug
            AND gm.member_type = :membertype
            AND gm.memberid = :workspaceid
            AND gm.status = :status",
        ['slug' => 'owned-schools', 'membertype' => 'workspace', 'workspaceid' => $franchiseid, 'status' => 'active']
    ) === 0];

    return $checks;
}

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqisft_huda_workspace_id($requestedworkspaceid);
if ($workspaceid <= 0) {
    pqh_access_denied('Could not find a Huda-school workspace. Pass workspaceid in the URL.', new moodle_url('/local/hubredirect/workspaces.php'), 'Huda workspace required');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$run = optional_param('run', 0, PARAM_BOOL);
$fixture = null;
$checks = [];
$message = '';
if ($run && confirm_sesskey()) {
    $fixture = pqisft_create_extended_fixture($workspaceid);
    $checks = pqisft_extended_checks($fixture);
    $message = 'Owned-branch isolation and franchise governance-only fixtures confirmed.';
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_school_functional_test.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution School Functional Test');
$PAGE->set_heading('Institution School Functional Test');

echo $OUTPUT->header();
?>
<style>
.pqisft{max-width:1100px;margin:24px auto;padding:0 16px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqisft-card{padding:18px;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06);margin-bottom:14px}
.pqisft h1{margin:0 0 8px;color:#221b22;font-size:28px;line-height:1.1;font-weight:900}
.pqisft-muted{color:#607080;font-weight:750}
.pqisft-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-weight:900;cursor:pointer}
.pqisft-table{width:100%;border-collapse:collapse}
.pqisft-table th,.pqisft-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left}
.pqisft-pill{display:inline-flex;min-height:24px;align-items:center;padding:0 8px;border-radius:999px;font-weight:900;font-size:12px}
.pqisft-pass{background:#edf9ef;color:#245c35}.pqisft-fail{background:#fff0ed;color:#883526}
</style>
<main class="pqisft">
  <section class="pqisft-card">
    <h1>Institution School Functional Test</h1>
    <div class="pqisft-muted"><?php echo s((string)$workspace->name); ?> / workspace #<?php echo (int)$workspaceid; ?></div>
    <form method="post" style="margin-top:14px">
      <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
      <input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>">
      <input type="hidden" name="run" value="1">
      <button class="pqisft-btn" type="submit">Run institution school isolation test</button>
    </form>
  </section>
  <?php if ($message !== ''): ?>
    <section class="pqisft-card"><strong><?php echo s($message); ?></strong></section>
  <?php endif; ?>
  <?php if ($fixture): ?>
    <section class="pqisft-card">
      <h2>Fixture Workspaces</h2>
      <?php foreach (['huda', 'branchb', 'franchise'] as $fixturekey): $school = $fixture[$fixturekey]; ?>
        <h3><?php echo s($school['label']); ?> / workspace #<?php echo (int)$school['workspaceid']; ?></h3>
        <table class="pqisft-table">
          <thead><tr><th>Role</th><th>User ID</th><th>Username</th></tr></thead>
          <tbody>
          <?php foreach ($school['users'] as $role => $user): ?>
            <tr><td><?php echo s($role); ?></td><td><?php echo (int)$user['id']; ?></td><td><?php echo s($user['username']); ?></td></tr>
          <?php endforeach; ?>
          <?php if (!empty($school['franchise_admin'])): ?>
            <tr><td>franchise_network_admin</td><td><?php echo (int)$school['franchise_admin']['id']; ?></td><td><?php echo s($school['franchise_admin']['username']); ?></td></tr>
          <?php endif; ?>
          </tbody>
        </table>
        <p class="pqisft-muted">Class group #<?php echo (int)$school['groupid']; ?> and live session #<?php echo (int)$school['sessionid']; ?> were created or refreshed with workspaceid <?php echo (int)$school['workspaceid']; ?>.</p>
      <?php endforeach; ?>
    </section>
    <section class="pqisft-card">
      <h2>Access Checks</h2>
      <table class="pqisft-table">
        <thead><tr><th>Check</th><th>Status</th></tr></thead>
        <tbody>
        <?php foreach ($checks as $check): ?>
          <tr>
            <td><?php echo s($check['name']); ?></td>
            <td><span class="pqisft-pill <?php echo !empty($check['pass']) ? 'pqisft-pass' : 'pqisft-fail'; ?>"><?php echo !empty($check['pass']) ? 'PASS' : 'FAIL'; ?></span></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  <?php endif; ?>
</main>
<?php
echo $OUTPUT->footer();
