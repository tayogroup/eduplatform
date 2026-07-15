<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

pqh_require_academy_operations('Only academy operations users can manage teaching workspaces.');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspaces.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teaching Workspaces');
$PAGE->set_heading('Teaching Workspaces');
$PAGE->add_body_class('pqw-workspaces-page');

function pqw_clean_slug(string $value): string {
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? substr($slug, 0, 120) : 'workspace-' . time();
}

function pqw_unique_slug(string $name): string {
    global $DB;
    $base = pqw_clean_slug($name);
    $slug = $base;
    $suffix = 1;
    while ($DB->record_exists('local_prequran_workspace', ['slug' => $slug])) {
        $suffix++;
        $slug = substr($base, 0, 112) . '-' . $suffix;
    }
    return $slug;
}

function pqw_normalize_domain(string $domain): string {
    $domain = strtolower(trim($domain));
    $domain = preg_replace('/^https?:\/\//', '', $domain) ?? '';
    $domain = preg_replace('/\/.*$/', '', $domain) ?? '';
    $domain = preg_replace('/:\d+$/', '', $domain) ?? '';
    $domain = trim($domain, " \t\n\r\0\x0B.");
    return $domain !== '' ? clean_param($domain, PARAM_HOST) : '';
}

function pqw_consumer_slug_available(string $slug, int $consumerid = 0): bool {
    global $DB;
    if ($slug === '' || !pqh_table_exists_safe('local_prequran_consumer')) {
        return false;
    }
    $existingid = (int)$DB->get_field('local_prequran_consumer', 'id', ['slug' => $slug], IGNORE_MISSING);
    return $existingid <= 0 || $existingid === $consumerid;
}

function pqw_json_array(string $json): array {
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqw_clean_hex_color(string $value): string {
    $value = trim($value);
    if (preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        return strtolower($value);
    }
    return '';
}

function pqw_clean_url(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return clean_param($value, PARAM_URL);
}

function pqw_upsert_consumer_for_workspace(int $workspaceid, string $workspace_name, string $slug, int $ownerid, string $supportemail, array $branding = []): int {
    global $DB, $USER;

    if (!pqh_consumer_schema_ready()) {
        throw new invalid_parameter_exception('Consumer/domain tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    if ($workspaceid <= 0) {
        throw new invalid_parameter_exception('Workspace is required before creating a consumer.');
    }
    $slug = pqw_clean_slug($slug !== '' ? $slug : $workspace_name);
    if (!pqw_consumer_slug_available($slug)) {
        throw new invalid_parameter_exception('Consumer slug is already used.');
    }

    $now = time();
    $supportemail = clean_param($supportemail, PARAM_EMAIL);
    $existing = $DB->get_record('local_prequran_consumer', ['primaryworkspaceid' => $workspaceid], '*', IGNORE_MISSING);
    if ($supportemail === '' && $existing) {
        $supportemail = clean_param((string)($existing->supportemail ?? ''), PARAM_EMAIL);
    }
    $existingtheme = $existing ? pqw_json_array((string)($existing->themejson ?? '')) : [];
    $existingcopy = $existing ? pqw_json_array((string)($existing->copyjson ?? '')) : ['created_from' => 'workspaces_page'];
    $displayname = trim((string)($branding['displayname'] ?? ''));
    $displayname = $displayname !== '' ? clean_param($displayname, PARAM_TEXT) : (string)($existing->name ?? $workspace_name);
    $logourl = array_key_exists('logourl', $branding) ? pqw_clean_url((string)$branding['logourl']) : (string)($existing->logourl ?? '');
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
        $color = pqw_clean_hex_color((string)$branding[$inputkey]);
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
        if (!pqw_consumer_slug_available($slug, (int)$existing->id)) {
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

function pqw_sync_consumer_domain(int $consumerid, int $workspaceid, string $domain, string $domaintype, int $isprimary): void {
    global $USER;
    pqhi_sync_consumer_domain($consumerid, $workspaceid, $domain, $domaintype, $isprimary, (int)$USER->id);
}

function pqw_workspace_ownerid(int $workspaceid): int {
    global $DB;
    if ($workspaceid <= 0) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_workspace', 'ownerid', ['id' => $workspaceid], IGNORE_MISSING);
}

function pqw_find_user(string $needle): ?stdClass {
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

function pqw_upsert_member(int $workspaceid, int $userid, string $role, int $createdby): void {
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

function pqw_upsert_org_group(string $slug, string $name, string $grouptype, int $parentconsumerid, array $policy): int {
    global $DB, $USER;

    if (!pqh_org_group_schema_ready()) {
        throw new invalid_parameter_exception('Organization group tables are not ready. Run the local_prequran Moodle upgrade first.');
    }
    if (!array_key_exists($grouptype, pqh_org_group_types())) {
        throw new invalid_parameter_exception('Invalid organization group type.');
    }

    $now = time();
    $slug = pqw_clean_slug($slug !== '' ? $slug : $name);
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

function pqw_seed_operating_model_groups(): array {
    global $DB;

    $quraanconsumerid = 0;
    $educonsumerid = 0;

    $ownedid = pqw_upsert_org_group('owned-schools', 'Owned Schools', 'owned_group', $quraanconsumerid, [
        'model' => 'wholly_owned_schools',
        'default_workspace_relationship' => 'owned_branch',
        'default_access_scope' => 'operations',
        'inherit_sensitive_access' => true,
    ]);
    $franchiseid = pqw_upsert_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', $educonsumerid, [
        'model' => 'independent_franchise_schools',
        'default_workspace_relationship' => 'franchise_member',
        'default_access_scope' => 'governance',
        'inherit_sensitive_access' => false,
    ]);

    return [$ownedid, $franchiseid];
}

function pqw_org_access_scope_options(): array {
    return [
        'governance' => 'Governance',
        'operations' => 'Operations',
        'audit' => 'Audit',
        'shared_support' => 'Shared support',
    ];
}

function pqw_clean_org_access_scopes(array $values): string {
    $allowed = array_keys(pqw_org_access_scope_options());
    $scopes = [];
    foreach ($values as $value) {
        $value = clean_param((string)$value, PARAM_ALPHANUMEXT);
        if (in_array($value, $allowed, true) && !in_array($value, $scopes, true)) {
            $scopes[] = $value;
        }
    }
    return implode(',', $scopes ?: ['governance']);
}

function pqw_org_group_role_options(): array {
    return [
        'owner' => 'Owner',
        'admin' => 'Admin',
        'auditor' => 'Auditor',
        'support' => 'Support',
    ];
}

function pqw_add_eligible_org_user(array &$users, stdClass $user, string $source): void {
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

function pqw_eligible_org_group_users(): array {
    global $CFG, $DB;

    $users = [];
    $siteadminids = array_values(array_filter(array_map('intval', explode(',', (string)($CFG->siteadmins ?? '')))));
    if ($siteadminids) {
        [$insql, $params] = $DB->get_in_or_equal($siteadminids, SQL_PARAMS_NAMED, 'siteadmin');
        $siteadmins = $DB->get_records_select('user', "id {$insql} AND deleted = 0", $params);
        foreach ($siteadmins as $user) {
            pqw_add_eligible_org_user($users, $user, 'site admin');
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
        pqw_add_eligible_org_user($users, $user, str_replace('_', ' ', (string)$user->shortname));
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
            pqw_add_eligible_org_user($users, $user, 'workspace ' . (string)$user->workspace_role);
        }
    }

    usort($users, static function(stdClass $a, stdClass $b): int {
        return strcasecmp(fullname($a), fullname($b));
    });
    return $users;
}

function pqw_normalize_operating_model_link(stdClass $group, string $relationship, string $accessscope, int $inheritsensitive): array {
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

function pqw_upsert_org_group_workspace_link(
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
    if ($accessscopes !== array_intersect($accessscopes, array_keys(pqw_org_access_scope_options()))) {
        throw new invalid_parameter_exception('Invalid access scope.');
    }
    [$accessscope, $inheritsensitive] = pqw_normalize_operating_model_link($group, $relationship, $accessscope, $inheritsensitive);

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

function pqw_upsert_org_group_user_link(int $groupid, int $userid, string $role, string $notes): void {
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
    if (!array_key_exists($role, pqw_org_group_role_options())) {
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

$ready = pqh_table_exists_safe('local_prequran_workspace') && pqh_table_exists_safe('local_prequran_workspace_member');
$orgready = pqh_org_group_schema_ready();
$message = '';
$error = '';

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'create_workspace') {
            $name = trim(optional_param('name', '', PARAM_TEXT));
            $type = optional_param('workspace_type', 'solo_teacher', PARAM_ALPHANUMEXT);
            $ownerneedle = trim(optional_param('owner', '', PARAM_TEXT));
            $plan = trim(optional_param('plan_code', 'pilot', PARAM_ALPHANUMEXT));
            $consumerenabled = optional_param('provision_consumer', 0, PARAM_INT) === 1;
            $consumerslug = trim(optional_param('consumer_slug', '', PARAM_ALPHANUMEXT));
            $publicdomain = pqw_normalize_domain(optional_param('public_domain', '', PARAM_TEXT));
            $appdomain = pqw_normalize_domain(optional_param('app_domain', '', PARAM_TEXT));
            $supportemail = trim(optional_param('supportemail', '', PARAM_EMAIL));
            $branding = [
                'displayname' => trim(optional_param('display_name', '', PARAM_TEXT)),
                'logourl' => trim(optional_param('logo_url', '', PARAM_URL)),
                'primarycolor' => trim(optional_param('primary_color', '', PARAM_TEXT)),
                'accentcolor' => trim(optional_param('accent_color', '', PARAM_TEXT)),
                'surfacecolor' => trim(optional_param('surface_color', '', PARAM_TEXT)),
                'dashboardheaderbg' => trim(optional_param('dashboard_header_bg', '', PARAM_TEXT)),
                'dashboardheadertext' => trim(optional_param('dashboard_header_text', '', PARAM_TEXT)),
                'pagebodybg' => trim(optional_param('page_body_bg', '', PARAM_TEXT)),
                'reportheaderbg' => trim(optional_param('report_header_bg', '', PARAM_TEXT)),
                'reportheadertext' => trim(optional_param('report_header_text', '', PARAM_TEXT)),
                'reportbodybg' => trim(optional_param('report_body_bg', '', PARAM_TEXT)),
                'headline' => trim(optional_param('landing_headline', '', PARAM_TEXT)),
                'subtitle' => trim(optional_param('landing_subtitle', '', PARAM_TEXT)),
                'websitemode' => optional_param('website_mode', 'hosted', PARAM_ALPHANUMEXT),
                'externalwebsiteurl' => optional_param('external_website_url', '', PARAM_URL),
                'domainmanagement' => optional_param('domain_management', 'consumer_managed', PARAM_ALPHANUMEXT),
                'portallabel' => optional_param('portal_label', 'Learning portal', PARAM_TEXT),
                'brandingsource' => optional_param('branding_source', 'eduplatform_settings', PARAM_ALPHANUMEXT),
                'intakelocation' => optional_param('intake_location', 'eduplatform', PARAM_ALPHANUMEXT),
                'integrationmethod' => optional_param('integration_method', 'links', PARAM_ALPHANUMEXT),
                'returnurl' => optional_param('return_url', '', PARAM_URL),
            ];
            if ($name === '') {
                throw new invalid_parameter_exception('Workspace name is required.');
            }
            if (!array_key_exists($type, pqh_workspace_types())) {
                throw new invalid_parameter_exception('Invalid workspace type.');
            }
            $owner = $ownerneedle !== '' ? pqw_find_user($ownerneedle) : null;
            $ownerid = $owner ? (int)$owner->id : 0;
            $now = time();
            $workspaceid = (int)$DB->insert_record('local_prequran_workspace', (object)[
                'name' => $name,
                'slug' => pqw_unique_slug($name),
                'workspace_type' => $type,
                'ownerid' => $ownerid,
                'status' => 'active',
                'plan_code' => $plan !== '' ? $plan : 'pilot',
                'student_limit' => optional_param('student_limit', 0, PARAM_INT),
                'teacher_limit' => optional_param('teacher_limit', 0, PARAM_INT),
                'session_limit' => optional_param('session_limit', 0, PARAM_INT),
                'storage_limit_mb' => optional_param('storage_limit_mb', 0, PARAM_INT),
                'settingsjson' => json_encode(['created_from' => 'workspaces_page'], JSON_UNESCAPED_SLASHES),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            if ($ownerid > 0) {
                pqw_upsert_member($workspaceid, $ownerid, 'owner', (int)$USER->id);
            }
            $consumerid = 0;
            if ($consumerenabled || $publicdomain !== '' || $appdomain !== '') {
                $consumerid = pqw_upsert_consumer_for_workspace($workspaceid, $name, $consumerslug, $ownerid, $supportemail, $branding);
                if ($branding['websitemode'] !== 'hosted') {
                    $publicdomain = '';
                }
                pqw_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1);
                pqw_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0);
            }
            $message = $consumerid > 0 ? 'Workspace and institution consumer created.' : 'Workspace created.';
        } else if ($action === 'add_member') {
            $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
            $role = optional_param('workspace_role', 'teacher', PARAM_ALPHANUMEXT);
            $needle = trim(optional_param('member', '', PARAM_TEXT));
            if (!$DB->record_exists('local_prequran_workspace', ['id' => $workspaceid])) {
                throw new invalid_parameter_exception('Workspace was not found.');
            }
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            $member = pqw_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('User was not found by ID, email, or username.');
            }
            pqw_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = 'Workspace member added.';
        } else if ($action === 'update_consumer') {
            $workspaceid = optional_param('consumer_workspaceid', 0, PARAM_INT);
            $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
            if (!$workspace) {
                throw new invalid_parameter_exception('Workspace was not found.');
            }
            $consumerslug = trim(optional_param('consumer_slug_existing', '', PARAM_ALPHANUMEXT));
            $supportemail = trim(optional_param('supportemail_existing', '', PARAM_EMAIL));
            $publicdomain = pqw_normalize_domain(optional_param('public_domain_existing', '', PARAM_TEXT));
            $appdomain = pqw_normalize_domain(optional_param('app_domain_existing', '', PARAM_TEXT));
            $branding = [
                'displayname' => trim(optional_param('display_name_existing', '', PARAM_TEXT)),
                'logourl' => trim(optional_param('logo_url_existing', '', PARAM_URL)),
                'primarycolor' => trim(optional_param('primary_color_existing', '', PARAM_TEXT)),
                'accentcolor' => trim(optional_param('accent_color_existing', '', PARAM_TEXT)),
                'surfacecolor' => trim(optional_param('surface_color_existing', '', PARAM_TEXT)),
                'dashboardheaderbg' => trim(optional_param('dashboard_header_bg_existing', '', PARAM_TEXT)),
                'dashboardheadertext' => trim(optional_param('dashboard_header_text_existing', '', PARAM_TEXT)),
                'pagebodybg' => trim(optional_param('page_body_bg_existing', '', PARAM_TEXT)),
                'reportheaderbg' => trim(optional_param('report_header_bg_existing', '', PARAM_TEXT)),
                'reportheadertext' => trim(optional_param('report_header_text_existing', '', PARAM_TEXT)),
                'reportbodybg' => trim(optional_param('report_body_bg_existing', '', PARAM_TEXT)),
                'headline' => trim(optional_param('landing_headline_existing', '', PARAM_TEXT)),
                'subtitle' => trim(optional_param('landing_subtitle_existing', '', PARAM_TEXT)),
                'websitemode' => optional_param('website_mode_existing', 'hosted', PARAM_ALPHANUMEXT),
                'externalwebsiteurl' => optional_param('external_website_url_existing', '', PARAM_URL),
                'domainmanagement' => optional_param('domain_management_existing', 'consumer_managed', PARAM_ALPHANUMEXT),
                'portallabel' => optional_param('portal_label_existing', 'Learning portal', PARAM_TEXT),
                'brandingsource' => optional_param('branding_source_existing', 'eduplatform_settings', PARAM_ALPHANUMEXT),
                'intakelocation' => optional_param('intake_location_existing', 'eduplatform', PARAM_ALPHANUMEXT),
                'integrationmethod' => optional_param('integration_method_existing', 'links', PARAM_ALPHANUMEXT),
                'returnurl' => optional_param('return_url_existing', '', PARAM_URL),
            ];
            $consumerid = pqw_upsert_consumer_for_workspace(
                $workspaceid,
                (string)$workspace->name,
                $consumerslug,
                pqw_workspace_ownerid($workspaceid),
                $supportemail,
                $branding
            );
            if ($branding['websitemode'] !== 'hosted') {
                $publicdomain = '';
            }
            pqw_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1);
            pqw_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0);
            $message = 'Institution consumer and domains updated.';
        } else if ($action === 'seed_operating_model') {
            [$ownedid, $franchiseid] = pqw_seed_operating_model_groups();
            $message = 'Operating model groups are ready: Owned Schools #' . $ownedid . ' and Franchise Schools #' . $franchiseid . '.';
        } else if ($action === 'link_org_workspace') {
            $groupid = optional_param('org_groupid', 0, PARAM_INT);
            $workspaceid = optional_param('org_workspaceid', 0, PARAM_INT);
            $relationship = optional_param('org_relationship', 'owned_branch', PARAM_ALPHANUMEXT);
            $accessscope = pqw_clean_org_access_scopes(optional_param_array('org_access_scope', ['governance'], PARAM_ALPHANUMEXT));
            $inheritsensitive = optional_param('org_inherit_sensitive_access', 0, PARAM_INT) === 1 ? 1 : 0;
            $notes = trim(optional_param('org_notes', '', PARAM_TEXT));
            pqw_upsert_org_group_workspace_link($groupid, $workspaceid, $relationship, $accessscope, $inheritsensitive, $notes);
            $message = 'School workspace linked to the operating model.';
        } else if ($action === 'add_org_user') {
            $groupid = optional_param('org_user_groupid', 0, PARAM_INT);
            $role = optional_param('org_group_role', 'admin', PARAM_ALPHANUMEXT);
            $userid = optional_param('org_userid', 0, PARAM_INT);
            $needle = trim(optional_param('org_user', '', PARAM_TEXT));
            $notes = trim(optional_param('org_user_notes', '', PARAM_TEXT));
            if ($userid <= 0 && $needle === '') {
                throw new invalid_parameter_exception('Select an eligible user or enter a manual user ID, email, or username.');
            }
            $member = $userid > 0 ? core_user::get_user($userid, '*', IGNORE_MISSING) : pqw_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('User was not found by ID, email, or username.');
            }
            pqw_upsert_org_group_user_link($groupid, (int)$member->id, $role, $notes);
            $message = 'Institution group user added.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$workspaces = $ready ? array_values($DB->get_records_select(
    'local_prequran_workspace',
    "status <> ?",
    ['archived'],
    'name ASC',
    '*',
    0,
    200
)) : [];

$membercounts = [];
$recentmembers = [];
$workspaceconsumers = [];
$workspacedomains = [];
$orggroups = [];
$orggroupmembers = [];
$orggroupusers = [];
$eligibleorgusers = [];
$institutiondashboard = [
    'owned_workspaces' => 0,
    'franchise_workspaces' => 0,
    'owned_users' => 0,
    'franchise_users' => 0,
    'owned_operations' => 0,
    'franchise_operations' => 0,
    'franchise_sensitive' => 0,
    'sqa_workspaces' => 0,
    'sqa_users' => 0,
    'warnings' => [],
];
if ($ready && $workspaces) {
    $ids = array_map(static function(stdClass $workspace): int {
        return (int)$workspace->id;
    }, $workspaces);
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'pqw');
    $rows = $DB->get_records_sql(
        "SELECT workspaceid, COUNT(1) AS membercount
           FROM {local_prequran_workspace_member}
          WHERE workspaceid {$insql}
            AND status = :status
       GROUP BY workspaceid",
        $params + ['status' => 'active']
    );
    foreach ($rows as $row) {
        $membercounts[(int)$row->workspaceid] = (int)$row->membercount;
    }
    $members = $DB->get_records_sql(
        "SELECT wm.id, wm.workspaceid, wm.userid, wm.workspace_role, u.firstname, u.lastname, u.email
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid {$insql}
            AND wm.status = :status
       ORDER BY wm.timemodified DESC, wm.id DESC",
        $params + ['status' => 'active'],
        0,
        80
    );
    foreach ($members as $member) {
        $recentmembers[(int)$member->workspaceid][] = $member;
    }
    if (pqh_consumer_schema_ready()) {
        $consumers = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_consumer}
              WHERE primaryworkspaceid {$insql}
                AND status = :status
           ORDER BY id ASC",
            $params + ['status' => 'active']
        );
        foreach ($consumers as $consumer) {
            $workspaceconsumers[(int)$consumer->primaryworkspaceid] = $consumer;
        }
        $domains = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_consumer_domain}
              WHERE workspaceid {$insql}
                AND status = :status
           ORDER BY isprimary DESC, domain ASC",
            $params + ['status' => 'active']
        );
        foreach ($domains as $domain) {
            $workspacedomains[(int)$domain->workspaceid][] = $domain;
        }
    }
}

if ($orgready) {
    $eligibleorgusers = pqw_eligible_org_group_users();
    $orggroups = array_values($DB->get_records(
        'local_prequran_org_group',
        ['status' => 'active'],
        'name ASC',
        '*',
        0,
        100
    ));
    $members = $DB->get_records_sql(
        "SELECT gm.id,
                gm.groupid,
                gm.member_type,
                gm.memberid,
                gm.relationship_type,
                gm.group_role,
                gm.access_scope,
                gm.inherit_sensitive_access,
                gm.status,
                gm.notes,
                w.name AS workspacename,
                w.slug AS workspaceslug,
                w.workspace_type
           FROM {local_prequran_org_group_member} gm
      LEFT JOIN {local_prequran_workspace} w
             ON w.id = gm.memberid
            AND gm.member_type = :workspacetypejoin
          WHERE gm.status = :status
            AND gm.member_type = :workspacetype
       ORDER BY gm.groupid ASC, w.name ASC, gm.memberid ASC",
        ['workspacetypejoin' => 'workspace', 'workspacetype' => 'workspace', 'status' => 'active'],
        0,
        200
    );
    foreach ($members as $member) {
        $orggroupmembers[(int)$member->groupid][] = $member;
    }
    $users = $DB->get_records_sql(
        "SELECT gm.id,
                gm.groupid,
                gm.memberid,
                gm.group_role,
                gm.status,
                gm.notes,
                u.firstname,
                u.lastname,
                u.email,
                u.username
           FROM {local_prequran_org_group_member} gm
           JOIN {user} u ON u.id = gm.memberid
          WHERE gm.status = :status
            AND gm.member_type = :membertype
            AND u.deleted = 0
       ORDER BY gm.groupid ASC, gm.group_role ASC, u.lastname ASC, u.firstname ASC",
        ['status' => 'active', 'membertype' => 'user'],
        0,
        200
    );
    foreach ($users as $userlink) {
        $orggroupusers[(int)$userlink->groupid][] = $userlink;
    }

    $groupsbyslug = [];
    foreach ($orggroups as $group) {
        $groupsbyslug[(string)$group->slug] = $group;
    }
    $ownedgroupid = isset($groupsbyslug['owned-schools']) ? (int)$groupsbyslug['owned-schools']->id : 0;
    $franchisegroupid = isset($groupsbyslug['franchise-schools']) ? (int)$groupsbyslug['franchise-schools']->id : 0;
    foreach ($orggroupmembers[$ownedgroupid] ?? [] as $member) {
        $institutiondashboard['owned_workspaces']++;
        if (in_array('operations', pqh_org_group_access_scopes((string)$member->access_scope), true)) {
            $institutiondashboard['owned_operations']++;
        }
    }
    foreach ($orggroupmembers[$franchisegroupid] ?? [] as $member) {
        $institutiondashboard['franchise_workspaces']++;
        $scopes = pqh_org_group_access_scopes((string)$member->access_scope);
        if (in_array('operations', $scopes, true)) {
            $institutiondashboard['franchise_operations']++;
        }
        if ((int)($member->inherit_sensitive_access ?? 0) === 1) {
            $institutiondashboard['franchise_sensitive']++;
        }
    }
    $institutiondashboard['owned_users'] = count($orggroupusers[$ownedgroupid] ?? []);
    $institutiondashboard['franchise_users'] = count($orggroupusers[$franchisegroupid] ?? []);
    $institutiondashboard['sqa_workspaces'] = pqh_table_exists_safe('local_prequran_workspace')
        ? (int)$DB->count_records_select(
            'local_prequran_workspace',
            "slug IN ('huda-branch-b-sqa', 'huda-franchise-sqa') OR " . $DB->sql_like('slug', ':sqaslug', false) . " OR " . $DB->sql_like('name', ':sqaname', false),
            ['sqaslug' => '%sqa%', 'sqaname' => '%SQA%']
        )
        : 0;
    $institutiondashboard['sqa_users'] = (int)$DB->count_records_select(
        'user',
        $DB->sql_like('username', ':sqauser', false) . " AND deleted = 0",
        ['sqauser' => 'huda.%.sqa.%']
    ) + (int)$DB->count_records_select(
        'user',
        "username IN ('huda.sqa.institution_admin', 'huda.sqa.school_admin', 'huda.sqa.teacher', 'huda.sqa.student', 'huda.sqa.parent') AND deleted = 0"
    );
    if ($ownedgroupid <= 0) {
        $institutiondashboard['warnings'][] = 'Owned Schools operating group is not ready.';
    }
    if ($franchisegroupid <= 0) {
        $institutiondashboard['warnings'][] = 'Franchise Schools operating group is not ready.';
    }
    if ($institutiondashboard['franchise_operations'] > 0 || $institutiondashboard['franchise_sensitive'] > 0) {
        $institutiondashboard['warnings'][] = 'One or more franchise workspaces has operations or inherited sensitive access enabled.';
    }
    if ($institutiondashboard['sqa_workspaces'] > 0 || $institutiondashboard['sqa_users'] > 0) {
        $institutiondashboard['warnings'][] = 'SQA fixture records are still present; run the production cleanup script before real onboarding.';
    }
}

$editworkspaceid = optional_param('editworkspaceid', 0, PARAM_INT);
$editworkspace = $workspaces[0] ?? null;
if ($editworkspaceid > 0) {
    foreach ($workspaces as $candidateworkspace) {
        if ((int)$candidateworkspace->id === $editworkspaceid) {
            $editworkspace = $candidateworkspace;
            break;
        }
    }
}
$editconsumer = $editworkspace ? ($workspaceconsumers[(int)$editworkspace->id] ?? null) : null;
$editdomains = $editworkspace ? ($workspacedomains[(int)$editworkspace->id] ?? []) : [];
$editpublicdomain = '';
$editappdomain = '';
foreach ($editdomains as $editdomain) {
    if ((string)$editdomain->domain_type === 'public' && $editpublicdomain === '') {
        $editpublicdomain = (string)$editdomain->domain;
    }
    if ((string)$editdomain->domain_type === 'app' && $editappdomain === '') {
        $editappdomain = (string)$editdomain->domain;
    }
}
$edittheme = $editconsumer ? pqw_json_array((string)($editconsumer->themejson ?? '')) : [];
$editcopy = $editconsumer ? pqw_json_array((string)($editconsumer->copyjson ?? '')) : [];
$editwebsiteprofile = pqhi_consumer_website_profile([], $editconsumer ?: null);

echo $OUTPUT->header();
?>
<style>
body.pqw-workspaces-page header,body.pqw-workspaces-page footer,body.pqw-workspaces-page nav.navbar,body.pqw-workspaces-page #page-header,body.pqw-workspaces-page #page-footer,body.pqw-workspaces-page .drawer,body.pqw-workspaces-page .drawer-toggles,body.pqw-workspaces-page .block-region,body.pqw-workspaces-page [data-region="drawer"],body.pqw-workspaces-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-workspaces-page #page,body.pqw-workspaces-page #page-content,body.pqw-workspaces-page #region-main,body.pqw-workspaces-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqw-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqw-wrap{max-width:1280px;margin:0 auto}.pqw-top,.pqw-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqw-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqw-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqw-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqw-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqw-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqw-grid{display:grid;grid-template-columns:1.1fr .95fr .95fr;gap:14px;margin-bottom:14px}.pqw-org-grid{display:grid;grid-template-columns:repeat(2,minmax(280px,1fr));gap:18px;margin-bottom:14px}.pqw-org-current{grid-column:1/-1}.pqw-kpis{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;margin:14px 0}.pqw-kpi{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqw-kpi strong{display:block;color:#221b22;font-size:26px;line-height:1;font-weight:950}.pqw-kpi span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqw-split{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pqw-field{display:grid;gap:5px;margin-bottom:10px;min-width:0}.pqw-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqw-input,.pqw-select{width:100%;min-width:0;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqw-inline{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.pqw-inline--two{grid-template-columns:repeat(2,minmax(132px,1fr));align-items:start}.pqw-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pqw-check{display:flex!important;align-items:center;gap:7px;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fbfdff;color:#173044;font-size:12px!important;font-weight:900!important;text-transform:none!important}.pqw-check input{flex:0 0 auto}.pqw-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqw-alert--ok{background:#edf9ef;color:#245c35}.pqw-alert--bad{background:#fff0ed;color:#883526}.pqw-alert--warn{background:#fff8e7;color:#74501b}.pqw-table{width:100%;border-collapse:separate;border-spacing:0}.pqw-table th,.pqw-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqw-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqw-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqw-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqw-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqw-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
@media(max-width:980px){.pqw-top,.pqw-grid,.pqw-org-grid,.pqw-inline,.pqw-checks,.pqw-kpis,.pqw-split{grid-template-columns:1fr}.pqw-actions{justify-content:flex-start}.pqw-table,.pqw-table tbody,.pqw-table tr,.pqw-table td{display:block;width:100%}.pqw-table thead{display:none}.pqw-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqw-table td{border:0}.pqw-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqw-shell">
  <div class="pqw-wrap">
    <section class="pqw-top pqh-workspace-top">
      <div>
        <h1 class="pqw-title pqh-workspace-title">Teaching Workspaces</h1>
        <p class="pqw-sub pqh-workspace-sub">Create solo-teacher and institution workspaces, then attach owners, admins, teachers, parents, and students.</p>
      </div>
      <nav class="pqw-actions pqh-workspace-actions" aria-label="Workspace navigation">
        <a class="pqw-btn pqw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false); ?>">Institution onboarding</a>
        <a class="pqw-btn pqw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Live admin</a>
        <a class="pqw-btn pqw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqw-alert pqw-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqw-alert pqw-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <div class="pqw-empty">Workspace tables are not ready. Run the Moodle plugin upgrade for local_prequran first.</div>
    <?php else: ?>
      <section class="pqw-panel" style="margin-bottom:14px">
        <h2>Institution Dashboard</h2>
        <?php if (!$orgready): ?>
          <div class="pqw-empty">Organization group tables are not ready. Run the local_prequran Moodle upgrade first.</div>
        <?php else: ?>
          <div class="pqw-kpis">
            <div class="pqw-kpi"><strong><?php echo (int)$institutiondashboard['owned_workspaces']; ?></strong><span>Owned branches</span></div>
            <div class="pqw-kpi"><strong><?php echo (int)$institutiondashboard['owned_users']; ?></strong><span>Owned group users</span></div>
            <div class="pqw-kpi"><strong><?php echo (int)$institutiondashboard['franchise_workspaces']; ?></strong><span>Franchise schools</span></div>
            <div class="pqw-kpi"><strong><?php echo (int)$institutiondashboard['franchise_users']; ?></strong><span>Franchise users</span></div>
          </div>
          <?php if (!empty($institutiondashboard['warnings'])): ?>
            <div class="pqw-alert pqw-alert--warn">
              <?php foreach ($institutiondashboard['warnings'] as $warning): ?>
                <span class="pqw-name"><?php echo s($warning); ?></span>
              <?php endforeach; ?>
            </div>
          <?php else: ?>
            <div class="pqw-alert pqw-alert--ok">Institution operating model is ready for real school onboarding.</div>
          <?php endif; ?>
          <div class="pqw-split">
            <div>
              <h3>Owned School Model</h3>
              <span class="pqw-muted">Institution admins can manage linked owned branches when operations access is enabled.</span>
              <span class="pqw-pill"><?php echo (int)$institutiondashboard['owned_operations']; ?> operational branches</span>
              <?php foreach ($orggroups as $group): ?>
                <?php if ((string)$group->slug !== 'owned-schools') { continue; } ?>
                <?php foreach ($orggroupmembers[(int)$group->id] ?? [] as $member): ?>
                  <span class="pqw-pill"><?php echo s((string)($member->workspacename ?? ('Workspace #' . $member->memberid))); ?></span>
                <?php endforeach; ?>
              <?php endforeach; ?>
            </div>
            <div>
              <h3>Franchise Model</h3>
              <span class="pqw-muted">Franchise schools stay governance-only unless operations or shared support is deliberately expanded.</span>
              <span class="pqw-pill"><?php echo (int)$institutiondashboard['franchise_operations']; ?> operations-expanded</span>
              <span class="pqw-pill"><?php echo (int)$institutiondashboard['franchise_sensitive']; ?> sensitive-inherited</span>
              <?php foreach ($orggroups as $group): ?>
                <?php if ((string)$group->slug !== 'franchise-schools') { continue; } ?>
                <?php foreach ($orggroupmembers[(int)$group->id] ?? [] as $member): ?>
                  <span class="pqw-pill"><?php echo s((string)($member->workspacename ?? ('Workspace #' . $member->memberid))); ?> / <?php echo s((string)$member->access_scope); ?></span>
                <?php endforeach; ?>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>
      </section>

      <section class="pqw-panel" style="margin-bottom:14px">
        <h2>Institution Operating Model</h2>
        <?php if (!$orgready): ?>
          <div class="pqw-empty">Organization group tables are not ready. Run the local_prequran Moodle upgrade first.</div>
        <?php else: ?>
          <div class="pqw-org-grid">
            <form method="post">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <input type="hidden" name="action" value="seed_operating_model">
              <h3>Operating groups</h3>
              <p class="pqw-muted">Creates or refreshes one owned group and one franchise network.</p>
              <button class="pqw-btn" type="submit">Create operating groups</button>
            </form>

            <form method="post">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <input type="hidden" name="action" value="link_org_workspace">
              <h3>Link school workspace</h3>
              <div class="pqw-field"><label>Operating group</label><select class="pqw-select" id="pqw-org-group" name="org_groupid" required><?php foreach ($orggroups as $group): ?><option value="<?php echo (int)$group->id; ?>" data-slug="<?php echo s((string)$group->slug); ?>" data-group-type="<?php echo s((string)$group->group_type); ?>"><?php echo s($group->name . ' - ' . ($group->group_type ?? 'group')); ?></option><?php endforeach; ?></select></div>
              <div class="pqw-field"><label>School workspace</label><select class="pqw-select" name="org_workspaceid" required><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>"><?php echo s($workspace->name . ' #' . $workspace->id); ?></option><?php endforeach; ?></select></div>
              <div class="pqw-inline pqw-inline--two">
                <div class="pqw-field"><label>Relationship</label><select class="pqw-select" id="pqw-org-relationship" name="org_relationship"><option value="owned_branch">Owned branch</option><option value="franchise_member">Franchise member</option></select></div>
                <div class="pqw-field"><label>Access scope</label><div class="pqw-checks" id="pqw-org-access-scope"><?php foreach (pqw_org_access_scope_options() as $scopekey => $scopelabel): ?><label class="pqw-check"><input type="checkbox" name="org_access_scope[]" value="<?php echo s($scopekey); ?>" <?php echo $scopekey === 'governance' ? 'checked' : ''; ?>> <?php echo s($scopelabel); ?></label><?php endforeach; ?></div></div>
              </div>
              <div class="pqw-field"><label><input type="checkbox" id="pqw-org-inherit-sensitive" name="org_inherit_sensitive_access" value="1"> Inherit sensitive operational access</label></div>
              <div class="pqw-field"><label>Notes</label><input class="pqw-input" name="org_notes" placeholder="optional contract or ownership note"></div>
              <button class="pqw-btn" type="submit" <?php echo !$orggroups ? 'disabled' : ''; ?>>Link workspace</button>
            </form>

            <form method="post">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <input type="hidden" name="action" value="add_org_user">
              <h3>Add group user</h3>
              <div class="pqw-field"><label>Operating group</label><select class="pqw-select" name="org_user_groupid" required><?php foreach ($orggroups as $group): ?><option value="<?php echo (int)$group->id; ?>"><?php echo s($group->name . ' - ' . ($group->group_type ?? 'group')); ?></option><?php endforeach; ?></select></div>
              <div class="pqw-field"><label>Eligible user</label><select class="pqw-select" name="org_userid"><option value="0">Select eligible user</option><?php foreach ($eligibleorgusers as $eligibleuser): ?><option value="<?php echo (int)$eligibleuser->id; ?>"><?php echo s(fullname($eligibleuser) . ' - ' . $eligibleuser->email . ' (' . implode(', ', $eligibleuser->sources) . ')'); ?></option><?php endforeach; ?></select><?php if (!$eligibleorgusers): ?><span class="pqw-muted">No eligible users found from platform roles or workspace leadership roles.</span><?php endif; ?></div>
              <div class="pqw-field"><label>Manual user lookup</label><input class="pqw-input" name="org_user" placeholder="ID, email, or username if not listed"></div>
              <div class="pqw-field"><label>Group role</label><select class="pqw-select" name="org_group_role"><?php foreach (pqw_org_group_role_options() as $rolekey => $rolelabel): ?><option value="<?php echo s($rolekey); ?>" <?php echo $rolekey === 'admin' ? 'selected' : ''; ?>><?php echo s($rolelabel); ?></option><?php endforeach; ?></select></div>
              <div class="pqw-field"><label>Notes</label><input class="pqw-input" name="org_user_notes" placeholder="optional role note"></div>
              <button class="pqw-btn" type="submit" <?php echo !$orggroups ? 'disabled' : ''; ?>>Add group user</button>
            </form>

            <div class="pqw-org-current">
              <h3>Current links</h3>
              <?php if (!$orggroups): ?>
                <div class="pqw-empty">No operating groups yet.</div>
              <?php else: ?>
                <?php foreach ($orggroups as $group): ?>
                  <span class="pqw-name"><?php echo s((string)$group->name); ?></span>
                  <span class="pqw-muted"><?php echo s((string)$group->slug); ?> / <?php echo s((string)$group->group_type); ?></span>
                  <?php foreach ($orggroupmembers[(int)$group->id] ?? [] as $member): ?>
                    <span class="pqw-pill"><?php echo s((string)($member->workspacename ?? ('Workspace #' . $member->memberid))); ?> - <?php echo s((string)$member->relationship_type); ?> / <?php echo s((string)$member->access_scope); ?></span>
                  <?php endforeach; ?>
                  <?php if (empty($orggroupmembers[(int)$group->id])): ?><span class="pqw-muted">No linked school workspaces yet.</span><?php endif; ?>
                  <?php foreach ($orggroupusers[(int)$group->id] ?? [] as $userlink): ?>
                    <span class="pqw-pill"><?php echo s(fullname($userlink)); ?> - <?php echo s((string)$userlink->group_role); ?></span>
                  <?php endforeach; ?>
                  <?php if (empty($orggroupusers[(int)$group->id])): ?><span class="pqw-muted">No group users yet.</span><?php endif; ?>
                <?php endforeach; ?>
              <?php endif; ?>
            </div>
          </div>
        <?php endif; ?>
      </section>

      <section class="pqw-grid">
        <form class="pqw-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_workspace">
          <h2>Create Workspace</h2>
          <div class="pqw-field"><label>Name</label><input class="pqw-input" name="name" required placeholder="Teacher name, masjid, school, or institute"></div>
          <div class="pqw-field"><label>Type</label><select class="pqw-select" name="workspace_type"><?php foreach (pqh_workspace_types() as $key => $label): ?><option value="<?php echo s($key); ?>" <?php echo $key === 'institution' ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Owner user ID, email, or username</label><input class="pqw-input" name="owner" placeholder="optional"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Plan</label><input class="pqw-input" name="plan_code" value="pilot"></div>
            <div class="pqw-field"><label>Students</label><input class="pqw-input" type="number" name="student_limit" min="0" value="0"></div>
            <div class="pqw-field"><label>Teachers</label><input class="pqw-input" type="number" name="teacher_limit" min="0" value="0"></div>
            <div class="pqw-field"><label>Sessions</label><input class="pqw-input" type="number" name="session_limit" min="0" value="0"></div>
          </div>
          <h3>Institution consumer and domains</h3>
          <div class="pqw-field"><label><input type="checkbox" name="provision_consumer" value="1"> Create linked institution consumer</label></div>
          <div class="pqw-field"><label>Consumer slug</label><input class="pqw-input" name="consumer_slug" placeholder="auto from workspace name"></div>
          <div class="pqw-field"><label>Display name</label><input class="pqw-input" name="display_name" placeholder="public institution name"></div>
          <div class="pqw-field"><label>Logo URL</label><input class="pqw-input" name="logo_url" placeholder="https://example.org/logo.png"></div>
          <div class="pqw-field"><label>Support email</label><input class="pqw-input" type="email" name="supportemail" placeholder="support@example.org"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Primary color</label><input class="pqw-input" name="primary_color" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Accent color</label><input class="pqw-input" name="accent_color" placeholder="#d99a26"></div>
            <div class="pqw-field"><label>Surface color</label><input class="pqw-input" name="surface_color" placeholder="#f4f8fb"></div>
          </div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Dashboard header</label><input class="pqw-input" name="dashboard_header_bg" maxlength="7" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Header text</label><input class="pqw-input" name="dashboard_header_text" maxlength="7" placeholder="#ffffff"></div>
            <div class="pqw-field"><label>Page body</label><input class="pqw-input" name="page_body_bg" maxlength="7" placeholder="#f4f8fb"></div>
          </div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Report header</label><input class="pqw-input" name="report_header_bg" maxlength="7" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Report header text</label><input class="pqw-input" name="report_header_text" maxlength="7" placeholder="#ffffff"></div>
            <div class="pqw-field"><label>Report body</label><input class="pqw-input" name="report_body_bg" maxlength="7" placeholder="#ffffff"></div>
          </div>
          <div class="pqw-field"><label>Landing headline</label><input class="pqw-input" name="landing_headline" placeholder="optional custom headline"></div>
          <div class="pqw-field"><label>Landing subtitle</label><input class="pqw-input" name="landing_subtitle" placeholder="optional custom subtitle"></div>
          <div class="pqw-field"><label>Website hosting mode</label><select class="pqw-select pqw-website-mode" name="website_mode"><?php foreach (pqhi_website_mode_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field pqw-external-website-field"><label>Existing website URL</label><input class="pqw-input" name="external_website_url" placeholder="https://www.example.org"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Portal label</label><input class="pqw-input" name="portal_label" value="Learning portal"></div>
            <div class="pqw-field"><label>Portal DNS</label><select class="pqw-select" name="domain_management"><?php foreach (pqhi_domain_management_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          </div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Branding source</label><select class="pqw-select" name="branding_source"><?php foreach (pqhi_branding_source_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
            <div class="pqw-field"><label>Intake location</label><select class="pqw-select" name="intake_location"><?php foreach (pqhi_intake_location_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
            <div class="pqw-field"><label>Integration</label><select class="pqw-select" name="integration_method"><?php foreach (pqhi_integration_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          </div>
          <div class="pqw-field"><label>Return URL after intake</label><input class="pqw-input" name="return_url" placeholder="https://www.example.org/thank-you"></div>
          <div class="pqw-inline">
            <div class="pqw-field pqw-hosted-public-domain-field"><label>EduPlatform-hosted public domain</label><input class="pqw-input" name="public_domain" placeholder="school.example.org"></div>
            <div class="pqw-field"><label>Learning portal domain</label><input class="pqw-input" name="app_domain" placeholder="learn.example.org"></div>
          </div>
          <button class="pqw-btn" type="submit">Create workspace</button>
        </form>

        <form class="pqw-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="update_consumer">
          <h2>Update Institution Consumer</h2>
          <div class="pqw-field"><label>Workspace</label><select class="pqw-select" name="consumer_workspaceid"><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>" <?php echo $editworkspace && (int)$workspace->id === (int)$editworkspace->id ? 'selected' : ''; ?>><?php echo s($workspace->name . ' #' . $workspace->id); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Consumer slug</label><input class="pqw-input" name="consumer_slug_existing" value="<?php echo s((string)($editconsumer->slug ?? '')); ?>" placeholder="auto from workspace name"></div>
          <div class="pqw-field"><label>Display name</label><input class="pqw-input" name="display_name_existing" value="<?php echo s((string)($editconsumer->name ?? ($editworkspace->name ?? ''))); ?>" placeholder="public institution name"></div>
          <div class="pqw-field"><label>Logo URL</label><input class="pqw-input" name="logo_url_existing" value="<?php echo s((string)($editconsumer->logourl ?? '')); ?>" placeholder="https://example.org/logo.png"></div>
          <div class="pqw-field"><label>Support email</label><input class="pqw-input" type="email" name="supportemail_existing" value="<?php echo s((string)($editconsumer->supportemail ?? '')); ?>" placeholder="support@example.org"></div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Primary color</label><input class="pqw-input" name="primary_color_existing" value="<?php echo s((string)($edittheme['primary_color'] ?? '')); ?>" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Accent color</label><input class="pqw-input" name="accent_color_existing" value="<?php echo s((string)($edittheme['accent_color'] ?? '')); ?>" placeholder="#d99a26"></div>
            <div class="pqw-field"><label>Surface color</label><input class="pqw-input" name="surface_color_existing" value="<?php echo s((string)($edittheme['surface_color'] ?? '')); ?>" placeholder="#f4f8fb"></div>
          </div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Dashboard header</label><input class="pqw-input" name="dashboard_header_bg_existing" maxlength="7" value="<?php echo s((string)($edittheme['dashboard_header_bg'] ?? '')); ?>" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Header text</label><input class="pqw-input" name="dashboard_header_text_existing" maxlength="7" value="<?php echo s((string)($edittheme['dashboard_header_text'] ?? '')); ?>" placeholder="#ffffff"></div>
            <div class="pqw-field"><label>Page body</label><input class="pqw-input" name="page_body_bg_existing" maxlength="7" value="<?php echo s((string)($edittheme['page_body_bg'] ?? '')); ?>" placeholder="#f4f8fb"></div>
          </div>
          <div class="pqw-inline">
            <div class="pqw-field"><label>Report header</label><input class="pqw-input" name="report_header_bg_existing" maxlength="7" value="<?php echo s((string)($edittheme['report_header_bg'] ?? '')); ?>" placeholder="#2f6f4e"></div>
            <div class="pqw-field"><label>Report header text</label><input class="pqw-input" name="report_header_text_existing" maxlength="7" value="<?php echo s((string)($edittheme['report_header_text'] ?? '')); ?>" placeholder="#ffffff"></div>
            <div class="pqw-field"><label>Report body</label><input class="pqw-input" name="report_body_bg_existing" maxlength="7" value="<?php echo s((string)($edittheme['report_body_bg'] ?? '')); ?>" placeholder="#ffffff"></div>
          </div>
          <div class="pqw-field"><label>Landing headline</label><input class="pqw-input" name="landing_headline_existing" value="<?php echo s((string)($editcopy['landing_headline'] ?? '')); ?>" placeholder="optional custom headline"></div>
          <div class="pqw-field"><label>Landing subtitle</label><input class="pqw-input" name="landing_subtitle_existing" value="<?php echo s((string)($editcopy['landing_subtitle'] ?? '')); ?>" placeholder="optional custom subtitle"></div>
          <div class="pqw-field"><label>Website hosting mode</label><select class="pqw-select pqw-website-mode" name="website_mode_existing"><?php foreach (pqhi_website_mode_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $editwebsiteprofile['website_mode'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field pqw-external-website-field"><label>Existing website URL</label><input class="pqw-input" name="external_website_url_existing" value="<?php echo s($editwebsiteprofile['external_website_url']); ?>" placeholder="https://www.example.org"></div>
          <div class="pqw-field"><label>Portal label</label><input class="pqw-input" name="portal_label_existing" value="<?php echo s($editwebsiteprofile['portal_label']); ?>"></div>
          <div class="pqw-field"><label>Portal DNS</label><select class="pqw-select" name="domain_management_existing"><?php foreach (pqhi_domain_management_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $editwebsiteprofile['domain_management'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Branding source</label><select class="pqw-select" name="branding_source_existing"><?php foreach (pqhi_branding_source_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $editwebsiteprofile['branding_source'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Intake location</label><select class="pqw-select" name="intake_location_existing"><?php foreach (pqhi_intake_location_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $editwebsiteprofile['intake_location'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Integration</label><select class="pqw-select" name="integration_method_existing"><?php foreach (pqhi_integration_method_options() as $value => $label): ?><option value="<?php echo s($value); ?>"<?php echo $editwebsiteprofile['integration_method'] === $value ? ' selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>Return URL after intake</label><input class="pqw-input" name="return_url_existing" value="<?php echo s($editwebsiteprofile['return_url']); ?>" placeholder="https://www.example.org/thank-you"></div>
          <div class="pqw-field pqw-hosted-public-domain-field"><label>EduPlatform-hosted public domain</label><input class="pqw-input" name="public_domain_existing" value="<?php echo s($editpublicdomain); ?>" placeholder="school.example.org"></div>
          <div class="pqw-field"><label>Learning portal domain</label><input class="pqw-input" name="app_domain_existing" value="<?php echo s($editappdomain); ?>" placeholder="learn.example.org"></div>
          <button class="pqw-btn" type="submit">Save consumer/domain</button>
        </form>

        <form class="pqw-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="add_member">
          <h2>Add Member</h2>
          <div class="pqw-field"><label>Workspace</label><select class="pqw-select" name="workspaceid"><?php foreach ($workspaces as $workspace): ?><option value="<?php echo (int)$workspace->id; ?>"><?php echo s($workspace->name . ' #' . $workspace->id); ?></option><?php endforeach; ?></select></div>
          <div class="pqw-field"><label>User ID, email, or username</label><input class="pqw-input" name="member" required></div>
          <div class="pqw-field"><label>Role</label><select class="pqw-select" name="workspace_role"><?php foreach (pqh_workspace_roles() as $key => $label): ?><option value="<?php echo s($key); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <button class="pqw-btn" type="submit">Add member</button>
        </form>
      </section>

      <section class="pqw-panel">
        <h2>Active Workspaces</h2>
        <?php if (!$workspaces): ?>
          <div class="pqw-empty">No workspaces found.</div>
        <?php else: ?>
          <table class="pqw-table">
            <thead><tr><th>Workspace</th><th>Type and Plan</th><th>Consumer / Domains</th><th>Limits</th><th>Members</th><th>Recent Members</th></tr></thead>
            <tbody>
              <?php foreach ($workspaces as $workspace): ?>
                <?php $consumer = $workspaceconsumers[(int)$workspace->id] ?? null; ?>
                <tr>
                  <td data-label="Workspace"><span class="pqw-name"><?php echo s($workspace->name); ?></span><span class="pqw-muted">#<?php echo (int)$workspace->id; ?> / <?php echo s($workspace->slug); ?></span><a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => (int)$workspace->id]))->out(false); ?>">Open dashboard</a> <a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/institution_settings.php', ['workspaceid' => (int)$workspace->id]))->out(false); ?>">Institution settings</a> <a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/workspaces.php', ['editworkspaceid' => (int)$workspace->id]))->out(false); ?>">Quick edit</a></td>
                  <td data-label="Type and Plan"><span class="pqw-pill"><?php echo s(pqh_workspace_types()[$workspace->workspace_type] ?? $workspace->workspace_type); ?></span><span class="pqw-pill"><?php echo s($workspace->plan_code); ?></span><span class="pqw-muted">Status: <?php echo s($workspace->status); ?></span></td>
                  <td data-label="Consumer / Domains">
                    <?php if ($consumer): ?>
                      <span class="pqw-name"><?php echo s((string)$consumer->name); ?></span>
                      <span class="pqw-muted"><?php echo s((string)$consumer->slug); ?> / <?php echo s((string)$consumer->consumer_type); ?></span>
                      <?php $theme = pqw_json_array((string)($consumer->themejson ?? '')); ?>
                      <?php $copy = pqw_json_array((string)($consumer->copyjson ?? '')); ?>
                      <?php if (trim((string)($consumer->logourl ?? '')) !== ''): ?><span class="pqw-muted">Logo: <?php echo s((string)$consumer->logourl); ?></span><?php endif; ?>
                      <?php $themeparts = array_filter([
                          (string)($theme['primary_color'] ?? ''),
                          (string)($theme['accent_color'] ?? ''),
                          (string)($theme['surface_color'] ?? ''),
                          (string)($theme['dashboard_header_bg'] ?? ''),
                          (string)($theme['page_body_bg'] ?? ''),
                          (string)($theme['report_header_bg'] ?? ''),
                          (string)($theme['report_body_bg'] ?? ''),
                      ]); ?>
                      <?php if ($themeparts): ?><span class="pqw-muted">Colors: <?php echo s(implode(' ', $themeparts)); ?></span><?php endif; ?>
                      <?php if (!empty($copy['landing_headline'])): ?><span class="pqw-muted">Headline: <?php echo s((string)$copy['landing_headline']); ?></span><?php endif; ?>
                      <a class="pqw-btn pqw-btn--light" style="margin-top:8px" href="<?php echo (new moodle_url('/local/hubredirect/consumer_diagnostics.php', ['consumer' => (string)$consumer->slug]))->out(false); ?>">Diagnostics</a>
                      <?php foreach ($workspacedomains[(int)$workspace->id] ?? [] as $domain): ?>
                        <span class="pqw-pill"><?php echo s((string)$domain->domain); ?> - <?php echo s((string)$domain->domain_type); ?> / <?php echo s((string)$domain->verificationstatus); ?></span>
                      <?php endforeach; ?>
                    <?php else: ?>
                      <span class="pqw-muted">No linked consumer yet</span>
                    <?php endif; ?>
                  </td>
                  <td data-label="Limits"><span class="pqw-muted">Students: <?php echo (int)$workspace->student_limit; ?>, teachers: <?php echo (int)$workspace->teacher_limit; ?>, sessions: <?php echo (int)$workspace->session_limit; ?></span></td>
                  <td data-label="Members"><span class="pqw-name"><?php echo (int)($membercounts[(int)$workspace->id] ?? 0); ?></span><span class="pqw-muted">active members</span></td>
                  <td data-label="Recent Members">
                    <?php foreach (array_slice($recentmembers[(int)$workspace->id] ?? [], 0, 5) as $member): ?>
                      <span class="pqw-pill"><?php echo s(fullname($member) . ' - ' . ($member->workspace_role ?? 'member')); ?></span>
                    <?php endforeach; ?>
                    <?php if (empty($recentmembers[(int)$workspace->id])): ?><span class="pqw-muted">No members yet</span><?php endif; ?>
                  </td>
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
  var group = document.getElementById('pqw-org-group');
  var relationship = document.getElementById('pqw-org-relationship');
  var scopes = document.getElementById('pqw-org-access-scope');
  var inherit = document.getElementById('pqw-org-inherit-sensitive');
  function selectScopes(values) {
    if (!scopes) {
      return;
    }
    Array.prototype.forEach.call(scopes.querySelectorAll('input[type="checkbox"]'), function(option) {
      option.checked = values.indexOf(option.value) !== -1;
    });
  }
  function syncOperatingDefaults() {
    if (!group || !relationship) {
      return;
    }
    var option = group.options[group.selectedIndex];
    var slug = option ? option.getAttribute('data-slug') : '';
    var groupType = option ? option.getAttribute('data-group-type') : '';
    if (slug === 'franchise-schools' || groupType === 'franchise_network') {
      relationship.value = 'franchise_member';
      selectScopes(['governance']);
      if (inherit) {
        inherit.checked = false;
        inherit.disabled = true;
      }
      return;
    }
    if (slug === 'owned-schools' || groupType === 'owned_group') {
      relationship.value = 'owned_branch';
      selectScopes(['governance', 'operations']);
      if (inherit) {
        inherit.disabled = false;
      }
    }
  }
  if (group) {
    group.addEventListener('change', syncOperatingDefaults);
    syncOperatingDefaults();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.pqw-website-mode'), function(mode) {
    var form = mode.closest('form');
    var externalField = form ? form.querySelector('.pqw-external-website-field') : null;
    var hostedField = form ? form.querySelector('.pqw-hosted-public-domain-field') : null;
    var externalInput = externalField ? externalField.querySelector('input') : null;
    function syncWebsiteMode() {
      var external = mode.value !== 'hosted';
      if (externalField) externalField.style.display = external ? '' : 'none';
      if (hostedField) hostedField.style.display = external ? 'none' : '';
      if (externalInput) externalInput.required = external;
    }
    mode.addEventListener('change', syncWebsiteMode);
    syncWebsiteMode();
  });
})();
</script>
<?php
echo $OUTPUT->footer();
