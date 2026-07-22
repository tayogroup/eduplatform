<?php
// Teaching-workspaces query/write library — extracted VERBATIM from
// local_hubredirect/workspaces.php (renamed pqw_ -> pqwsl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Shared pqh_*/pqhi_* helpers are called at runtime, never
// copied. Requires: local/hubredirect/accesslib.php and institutionlib.php
// loaded first.

defined('MOODLE_INTERNAL') || die();

function pqwsl_clean_slug(string $value): string {
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? substr($slug, 0, 120) : 'workspace-' . time();
}

function pqwsl_unique_slug(string $name): string {
    global $DB;
    $base = pqwsl_clean_slug($name);
    $slug = $base;
    $suffix = 1;
    while ($DB->record_exists('local_prequran_workspace', ['slug' => $slug])) {
        $suffix++;
        $slug = substr($base, 0, 112) . '-' . $suffix;
    }
    return $slug;
}

function pqwsl_normalize_domain(string $domain): string {
    $domain = strtolower(trim($domain));
    $domain = preg_replace('/^https?:\/\//', '', $domain) ?? '';
    $domain = preg_replace('/\/.*$/', '', $domain) ?? '';
    $domain = preg_replace('/:\d+$/', '', $domain) ?? '';
    $domain = trim($domain, " \t\n\r\0\x0B.");
    return $domain !== '' ? clean_param($domain, PARAM_HOST) : '';
}

function pqwsl_consumer_slug_available(string $slug, int $consumerid = 0): bool {
    global $DB;
    if ($slug === '' || !pqh_table_exists_safe('local_prequran_consumer')) {
        return false;
    }
    $existingid = (int)$DB->get_field('local_prequran_consumer', 'id', ['slug' => $slug], IGNORE_MISSING);
    return $existingid <= 0 || $existingid === $consumerid;
}

function pqwsl_json_array(string $json): array {
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqwsl_clean_hex_color(string $value): string {
    $value = trim($value);
    if (preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        return strtolower($value);
    }
    return '';
}

function pqwsl_clean_url(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return clean_param($value, PARAM_URL);
}

function pqwsl_upsert_consumer_for_workspace(int $workspaceid, string $workspace_name, string $slug, int $ownerid, string $supportemail, array $branding = []): int {
    global $DB, $USER;

    if (!pqh_consumer_schema_ready()) {
        throw new invalid_parameter_exception('Consumer/domain tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    if ($workspaceid <= 0) {
        throw new invalid_parameter_exception('Workspace is required before creating a consumer.');
    }
    $slug = pqwsl_clean_slug($slug !== '' ? $slug : $workspace_name);
    if (!pqwsl_consumer_slug_available($slug)) {
        throw new invalid_parameter_exception('Consumer slug is already used.');
    }

    $now = time();
    $supportemail = clean_param($supportemail, PARAM_EMAIL);
    $existing = $DB->get_record('local_prequran_consumer', ['primaryworkspaceid' => $workspaceid], '*', IGNORE_MISSING);
    if ($supportemail === '' && $existing) {
        $supportemail = clean_param((string)($existing->supportemail ?? ''), PARAM_EMAIL);
    }
    $existingtheme = $existing ? pqwsl_json_array((string)($existing->themejson ?? '')) : [];
    $existingcopy = $existing ? pqwsl_json_array((string)($existing->copyjson ?? '')) : ['created_from' => 'workspaces_page'];
    $displayname = trim((string)($branding['displayname'] ?? ''));
    $displayname = $displayname !== '' ? clean_param($displayname, PARAM_TEXT) : (string)($existing->name ?? $workspace_name);
    $logourl = array_key_exists('logourl', $branding) ? pqwsl_clean_url((string)$branding['logourl']) : (string)($existing->logourl ?? '');
    $headline = array_key_exists('headline', $branding) ? trim(clean_param((string)$branding['headline'], PARAM_TEXT)) : (string)($existingcopy['landing_headline'] ?? '');
    $subtitle = array_key_exists('subtitle', $branding) ? trim(clean_param((string)$branding['subtitle'], PARAM_TEXT)) : (string)($existingcopy['landing_subtitle'] ?? '');
    $theme = $existingtheme;
    $themefields = [
        'primarycolor' => 'primary_color',
        'accentcolor' => 'accent_color',
        'surfacecolor' => 'surface_color',
        'dashboardheaderbg' => 'dashboard_header_bg',
        'dashboardheadertext' => 'dashboard_header_text',
        'pagebodybg' => 'page_body_bg',
        'reportheaderbg' => 'report_header_bg',
        'reportheadertext' => 'report_header_text',
        'reportbodybg' => 'report_body_bg',
    ];
    foreach ($themefields as $inputkey => $themekey) {
        if (!array_key_exists($inputkey, $branding)) {
            continue;
        }
        $color = pqwsl_clean_hex_color((string)$branding[$inputkey]);
        if ($color !== '') {
            $theme[$themekey] = $color;
        } else {
            unset($theme[$themekey]);
        }
    }
    $copy = $existingcopy;
    if ($headline !== '') {
        $copy['landing_headline'] = $headline;
    }
    if ($subtitle !== '') {
        $copy['landing_subtitle'] = $subtitle;
    }
    $websiteprofile = pqhi_consumer_website_profile([
        'website_mode' => $branding['websitemode'] ?? ($existing->website_mode ?? 'hosted'),
        'external_website_url' => $branding['externalwebsiteurl'] ?? ($existing->externalwebsiteurl ?? ''),
        'domain_management' => $branding['domainmanagement'] ?? ($existing->domainmanagement ?? 'consumer_managed'),
        'portal_label' => $branding['portallabel'] ?? ($existing->portallabel ?? 'Learning portal'),
        'branding_source' => $branding['brandingsource'] ?? ($existing->brandingsource ?? 'eduplatform_settings'),
        'intake_location' => $branding['intakelocation'] ?? ($existing->intakelocation ?? 'eduplatform'),
        'integration_method' => $branding['integrationmethod'] ?? ($existing->integrationmethod ?? 'links'),
        'return_url' => $branding['returnurl'] ?? ($existing->returnurl ?? ''),
    ], $existing ?: null);
    $record = (object)[
        'slug' => $slug,
        'name' => $displayname,
        'consumer_type' => 'institution',
        'status' => 'active',
        'primaryworkspaceid' => $workspaceid,
        'owneruserid' => $ownerid,
        'supportemail' => $supportemail,
        'logourl' => $logourl,
        'website_mode' => $websiteprofile['website_mode'],
        'externalwebsiteurl' => $websiteprofile['external_website_url'],
        'domainmanagement' => $websiteprofile['domain_management'],
        'portallabel' => $websiteprofile['portal_label'],
        'brandingsource' => $websiteprofile['branding_source'],
        'intakelocation' => $websiteprofile['intake_location'],
        'integrationmethod' => $websiteprofile['integration_method'],
        'returnurl' => $websiteprofile['return_url'],
        'themejson' => $theme ? json_encode($theme, JSON_UNESCAPED_SLASHES) : '',
        'copyjson' => json_encode($copy, JSON_UNESCAPED_SLASHES),
        'defaultpublicpath' => '/local/hubredirect/consumer_landing.php',
        'defaultdashboardpath' => '/local/hubredirect/workspace_dashboard.php',
        'emailfromname' => $displayname,
        'emailreplyto' => $supportemail,
        'createdby' => (int)$USER->id,
        'timemodified' => $now,
    ];
    if ($existing) {
        if (!pqwsl_consumer_slug_available($slug, (int)$existing->id)) {
            throw new invalid_parameter_exception('Consumer slug is already used.');
        }
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $record));
        return (int)$existing->id;
    }

    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $record));
}

function pqwsl_sync_consumer_domain(int $consumerid, int $workspaceid, string $domain, string $domaintype, int $isprimary): void {
    global $USER;
    pqhi_sync_consumer_domain($consumerid, $workspaceid, $domain, $domaintype, $isprimary, (int)$USER->id);
}

function pqwsl_workspace_ownerid(int $workspaceid): int {
    global $DB;
    if ($workspaceid <= 0) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_workspace', 'ownerid', ['id' => $workspaceid], IGNORE_MISSING);
}

function pqwsl_find_user(string $needle): ?stdClass {
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

function pqwsl_upsert_member(int $workspaceid, int $userid, string $role, int $createdby): void {
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

function pqwsl_upsert_org_group(string $slug, string $name, string $grouptype, int $parentconsumerid, array $policy): int {
    global $DB, $USER;

    if (!pqh_org_group_schema_ready()) {
        throw new invalid_parameter_exception('Organization group tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    if (!array_key_exists($grouptype, pqh_org_group_types())) {
        throw new invalid_parameter_exception('Invalid organization group type.');
    }

    $now = time();
    $slug = pqwsl_clean_slug($slug !== '' ? $slug : $name);
    $existing = $DB->get_record('local_prequran_org_group', ['slug' => $slug], '*', IGNORE_MISSING);
    $record = (object)[
        'slug' => $slug,
        'name' => trim($name),
        'group_type' => $grouptype,
        'parentconsumerid' => $parentconsumerid,
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
        'timemodified' => $now,
    ];
    if ($record->name === '') {
        throw new invalid_parameter_exception('Organization group name is required.');
    }

    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_org_group', $record);
        return (int)$existing->id;
    }

    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_org_group', $record);
}

function pqwsl_seed_operating_model_groups(): array {
    global $DB;

    $quraanconsumerid = 0;
    $educonsumerid = 0;

    $ownedid = pqwsl_upsert_org_group('owned-schools', 'Owned Schools', 'owned_group', $quraanconsumerid, [
        'model' => 'wholly_owned_schools',
        'default_workspace_relationship' => 'owned_branch',
        'default_access_scope' => 'operations',
        'inherit_sensitive_access' => true,
    ]);
    $franchiseid = pqwsl_upsert_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', $educonsumerid, [
        'model' => 'independent_franchise_schools',
        'default_workspace_relationship' => 'franchise_member',
        'default_access_scope' => 'governance',
        'inherit_sensitive_access' => false,
    ]);

    return [$ownedid, $franchiseid];
}

function pqwsl_org_access_scope_options(): array {
    return [
        'governance' => 'Governance',
        'operations' => 'Operations',
        'audit' => 'Audit',
        'shared_support' => 'Shared support',
    ];
}

function pqwsl_clean_org_access_scopes(array $values): string {
    $allowed = array_keys(pqwsl_org_access_scope_options());
    $scopes = [];
    foreach ($values as $value) {
        $value = clean_param((string)$value, PARAM_ALPHANUMEXT);
        if (in_array($value, $allowed, true) && !in_array($value, $scopes, true)) {
            $scopes[] = $value;
        }
    }
    return implode(',', $scopes ?: ['governance']);
}

function pqwsl_org_group_role_options(): array {
    return [
        'owner' => 'Owner',
        'admin' => 'Admin',
        'auditor' => 'Auditor',
        'support' => 'Support',
    ];
}

function pqwsl_add_eligible_org_user(array &$users, stdClass $user, string $source): void {
    $userid = (int)($user->id ?? 0);
    if ($userid <= 0 || !empty($user->deleted)) {
        return;
    }
    if (!isset($users[$userid])) {
        $users[$userid] = (object)[
            'id' => $userid,
            'firstname' => (string)($user->firstname ?? ''),
            'lastname' => (string)($user->lastname ?? ''),
            'email' => (string)($user->email ?? ''),
            'username' => (string)($user->username ?? ''),
            'sources' => [],
        ];
    }
    if ($source !== '' && !in_array($source, $users[$userid]->sources, true)) {
        $users[$userid]->sources[] = $source;
    }
}

function pqwsl_eligible_org_group_users(): array {
    global $CFG, $DB;

    $users = [];
    $siteadminids = array_values(array_filter(array_map('intval', explode(',', (string)($CFG->siteadmins ?? '')))));
    if ($siteadminids) {
        [$insql, $params] = $DB->get_in_or_equal($siteadminids, SQL_PARAMS_NAMED, 'siteadmin');
        $siteadmins = $DB->get_records_select('user', "id {$insql} AND deleted = 0", $params);
        foreach ($siteadmins as $user) {
            pqwsl_add_eligible_org_user($users, $user, 'site admin');
        }
    }

    $roles = ['manager', 'school_principal', 'sqa_tester'];
    [$roleinsql, $roleparams] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'eligrole');
    $roleusers = $DB->get_records_sql(
        "SELECT DISTINCT u.id,
                u.firstname,
                u.lastname,
                u.email,
                u.username,
                r.shortname
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
           JOIN {user} u ON u.id = ra.userid
          WHERE r.shortname {$roleinsql}
            AND u.deleted = :deleted",
        $roleparams + ['deleted' => 0],
        0,
        200
    );
    foreach ($roleusers as $user) {
        pqwsl_add_eligible_org_user($users, $user, str_replace('_', ' ', (string)$user->shortname));
    }

    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $workspaceusers = $DB->get_records_sql(
            "SELECT DISTINCT u.id,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.username,
                    wm.workspace_role
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE wm.status = :status
                AND wm.workspace_role IN ('owner', 'admin', 'coordinator', 'auditor')
                AND u.deleted = :deleted",
            ['status' => 'active', 'deleted' => 0],
            0,
            200
        );
        foreach ($workspaceusers as $user) {
            pqwsl_add_eligible_org_user($users, $user, 'workspace ' . (string)$user->workspace_role);
        }
    }

    usort($users, static function(stdClass $a, stdClass $b): int {
        return strcasecmp(fullname($a), fullname($b));
    });
    return $users;
}

function pqwsl_normalize_operating_model_link(stdClass $group, string $relationship, string $accessscope, int $inheritsensitive): array {
    $grouptype = (string)($group->group_type ?? '');
    $slug = (string)($group->slug ?? '');
    $scopes = pqh_org_group_access_scopes($accessscope);

    if ($slug === 'owned-schools' || $grouptype === 'owned_group') {
        if ($relationship !== 'owned_branch') {
            throw new invalid_parameter_exception('Owned Schools must use the Owned branch relationship.');
        }
        if ($inheritsensitive && !in_array('operations', $scopes, true)) {
            $scopes[] = 'operations';
        }
    }

    if ($slug === 'franchise-schools' || $grouptype === 'franchise_network') {
        if ($relationship !== 'franchise_member') {
            throw new invalid_parameter_exception('Franchise Schools must use the Franchise member relationship.');
        }
        $inheritsensitive = 0;
        if (!in_array('governance', $scopes, true)) {
            array_unshift($scopes, 'governance');
        }
    }

    return [implode(',', array_values(array_unique($scopes))), $inheritsensitive];
}

function pqwsl_upsert_org_group_workspace_link(
    int $groupid,
    int $workspaceid,
    string $relationship,
    string $accessscope,
    int $inheritsensitive,
    string $notes
): void {
    global $DB, $USER;

    if (!pqh_org_group_schema_ready()) {
        throw new invalid_parameter_exception('Organization group tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    $group = $DB->get_record('local_prequran_org_group', ['id' => $groupid, 'status' => 'active'], '*', IGNORE_MISSING);
    if (!$group) {
        throw new invalid_parameter_exception('Organization group was not found.');
    }
    if (!$DB->record_exists('local_prequran_workspace', ['id' => $workspaceid])) {
        throw new invalid_parameter_exception('Workspace was not found.');
    }
    if (!array_key_exists($relationship, pqh_org_group_relationship_types())) {
        throw new invalid_parameter_exception('Invalid organization relationship.');
    }
    $accessscopes = array_filter(explode(',', $accessscope));
    if ($accessscopes !== array_intersect($accessscopes, array_keys(pqwsl_org_access_scope_options()))) {
        throw new invalid_parameter_exception('Invalid access scope.');
    }
    [$accessscope, $inheritsensitive] = pqwsl_normalize_operating_model_link($group, $relationship, $accessscope, $inheritsensitive);

    if (in_array((string)$group->slug, ['owned-schools', 'franchise-schools'], true)) {
        $oldlinks = $DB->get_records_sql(
            "SELECT gm.*
               FROM {local_prequran_org_group_member} gm
               JOIN {local_prequran_org_group} g ON g.id = gm.groupid
              WHERE gm.member_type = :membertype
                AND gm.memberid = :workspaceid
                AND gm.status = :status
                AND g.slug IN ('owned-schools', 'franchise-schools')
                AND g.id <> :groupid",
            [
                'membertype' => 'workspace',
                'workspaceid' => $workspaceid,
                'status' => 'active',
                'groupid' => $groupid,
            ]
        );
        foreach ($oldlinks as $oldlink) {
            $oldlink->status = 'inactive';
            $oldlink->timemodified = time();
            $DB->update_record('local_prequran_org_group_member', $oldlink);
        }
    }

    $now = time();
    $existing = $DB->get_record('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'group_role' => 'member',
    ], '*', IGNORE_MISSING);
    $record = (object)[
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'relationship_type' => $relationship,
        'group_role' => 'member',
        'access_scope' => $accessscope,
        'inherit_sensitive_access' => $inheritsensitive ? 1 : 0,
        'status' => 'active',
        'notes' => trim($notes),
        'createdby' => (int)$USER->id,
        'timemodified' => $now,
    ];

    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_org_group_member', $record);
        return;
    }

    $record->timecreated = $now;
    $DB->insert_record('local_prequran_org_group_member', $record);
}

function pqwsl_upsert_org_group_user_link(int $groupid, int $userid, string $role, string $notes): void {
    global $DB, $USER;

    if (!pqh_org_group_schema_ready()) {
        throw new invalid_parameter_exception('Organization group tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    if (!$DB->record_exists('local_prequran_org_group', ['id' => $groupid, 'status' => 'active'])) {
        throw new invalid_parameter_exception('Organization group was not found.');
    }
    $user = core_user::get_user($userid, '*', IGNORE_MISSING);
    if (!$user || !empty($user->deleted)) {
        throw new invalid_parameter_exception('User was not found.');
    }
    if (!array_key_exists($role, pqwsl_org_group_role_options())) {
        throw new invalid_parameter_exception('Invalid organization group role.');
    }

    $now = time();
    $existing = $DB->get_record('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'user',
        'memberid' => $userid,
        'group_role' => $role,
    ], '*', IGNORE_MISSING);
    $record = (object)[
        'groupid' => $groupid,
        'member_type' => 'user',
        'memberid' => $userid,
        'relationship_type' => 'member',
        'group_role' => $role,
        'access_scope' => 'governance',
        'inherit_sensitive_access' => 0,
        'status' => 'active',
        'notes' => trim($notes),
        'createdby' => (int)$USER->id,
        'timemodified' => $now,
    ];

    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_org_group_member', $record);
        return;
    }

    $record->timecreated = $now;
    $DB->insert_record('local_prequran_org_group_member', $record);
}
