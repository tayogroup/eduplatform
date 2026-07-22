<?php
// ---- report: workspaces (platform teaching-workspace administration) ----------
// Ported from local_hubredirect/workspaces.php via workspaces_portallib
// (pqwsl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the full workspaces admin state (workspaces + consumers/domains,
//        institution operating-model dashboard, org groups/links/users, eligible
//        users, quick-edit selection, and every option list the forms need).
// POST = do=create_workspace | add_member | update_consumer | seed_operating_model
//        | link_org_workspace | add_org_user — each the legacy action=... write
//        VERBATIM (same guards, whitelists and messages). require_sesskey()
//        dropped: token auth replaces the session key.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspaces_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- entry access check: same rule and message as the legacy page's
// -- pqh_require_academy_operations('Only academy operations users can manage
// -- teaching workspaces.') (which calls pqh_can_manage_academy_operations).
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can manage teaching workspaces.');
}

$ready = pqh_table_exists_safe('local_prequran_workspace') && pqh_table_exists_safe('local_prequran_workspace_member');
$orgready = pqh_org_group_schema_ready();

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

if ($ispost) {
    // Legacy gates every POST on $ready (otherwise the whole write block is
    // skipped and the page rerenders its "tables not ready" empty state).
    if (!$ready) {
        pqpd_fail(403, 'Workspace tables are not ready. Run the Moodle plugin upgrade for local_prequran first.');
    }
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $message = '';
    $result = [];
    try {
        if ($action === 'create_workspace') {
            // -- write: create_workspace (legacy action=create_workspace, verbatim) --
            $name = trim(clean_param((string)($body['name'] ?? ''), PARAM_TEXT));
            $type = clean_param((string)($body['workspace_type'] ?? 'solo_teacher'), PARAM_ALPHANUMEXT);
            $ownerneedle = trim(clean_param((string)($body['owner'] ?? ''), PARAM_TEXT));
            $plan = trim(clean_param((string)($body['plan_code'] ?? 'pilot'), PARAM_ALPHANUMEXT));
            $consumerenabled = (int)($body['provision_consumer'] ?? 0) === 1;
            $consumerslug = trim(clean_param((string)($body['consumer_slug'] ?? ''), PARAM_ALPHANUMEXT));
            $publicdomain = pqwsl_normalize_domain(clean_param((string)($body['public_domain'] ?? ''), PARAM_TEXT));
            $appdomain = pqwsl_normalize_domain(clean_param((string)($body['app_domain'] ?? ''), PARAM_TEXT));
            $supportemail = trim(clean_param((string)($body['supportemail'] ?? ''), PARAM_EMAIL));
            $branding = [
                'displayname' => trim(clean_param((string)($body['display_name'] ?? ''), PARAM_TEXT)),
                'logourl' => trim(clean_param((string)($body['logo_url'] ?? ''), PARAM_URL)),
                'primarycolor' => trim(clean_param((string)($body['primary_color'] ?? ''), PARAM_TEXT)),
                'accentcolor' => trim(clean_param((string)($body['accent_color'] ?? ''), PARAM_TEXT)),
                'surfacecolor' => trim(clean_param((string)($body['surface_color'] ?? ''), PARAM_TEXT)),
                'dashboardheaderbg' => trim(clean_param((string)($body['dashboard_header_bg'] ?? ''), PARAM_TEXT)),
                'dashboardheadertext' => trim(clean_param((string)($body['dashboard_header_text'] ?? ''), PARAM_TEXT)),
                'pagebodybg' => trim(clean_param((string)($body['page_body_bg'] ?? ''), PARAM_TEXT)),
                'reportheaderbg' => trim(clean_param((string)($body['report_header_bg'] ?? ''), PARAM_TEXT)),
                'reportheadertext' => trim(clean_param((string)($body['report_header_text'] ?? ''), PARAM_TEXT)),
                'reportbodybg' => trim(clean_param((string)($body['report_body_bg'] ?? ''), PARAM_TEXT)),
                'headline' => trim(clean_param((string)($body['landing_headline'] ?? ''), PARAM_TEXT)),
                'subtitle' => trim(clean_param((string)($body['landing_subtitle'] ?? ''), PARAM_TEXT)),
                'websitemode' => clean_param((string)($body['website_mode'] ?? 'hosted'), PARAM_ALPHANUMEXT),
                'externalwebsiteurl' => clean_param((string)($body['external_website_url'] ?? ''), PARAM_URL),
                'domainmanagement' => clean_param((string)($body['domain_management'] ?? 'consumer_managed'), PARAM_ALPHANUMEXT),
                'portallabel' => clean_param((string)($body['portal_label'] ?? 'Learning portal'), PARAM_TEXT),
                'brandingsource' => clean_param((string)($body['branding_source'] ?? 'eduplatform_settings'), PARAM_ALPHANUMEXT),
                'intakelocation' => clean_param((string)($body['intake_location'] ?? 'eduplatform'), PARAM_ALPHANUMEXT),
                'integrationmethod' => clean_param((string)($body['integration_method'] ?? 'links'), PARAM_ALPHANUMEXT),
                'returnurl' => clean_param((string)($body['return_url'] ?? ''), PARAM_URL),
            ];
            if ($name === '') {
                throw new invalid_parameter_exception('Workspace name is required.');
            }
            if (!array_key_exists($type, pqh_workspace_types())) {
                throw new invalid_parameter_exception('Invalid workspace type.');
            }
            $owner = $ownerneedle !== '' ? pqwsl_find_user($ownerneedle) : null;
            $ownerid = $owner ? (int)$owner->id : 0;
            $now = time();
            $workspaceid = (int)$DB->insert_record('local_prequran_workspace', (object)[
                'name' => $name,
                'slug' => pqwsl_unique_slug($name),
                'workspace_type' => $type,
                'ownerid' => $ownerid,
                'status' => 'active',
                'plan_code' => $plan !== '' ? $plan : 'pilot',
                'student_limit' => (int)($body['student_limit'] ?? 0),
                'teacher_limit' => (int)($body['teacher_limit'] ?? 0),
                'session_limit' => (int)($body['session_limit'] ?? 0),
                'storage_limit_mb' => (int)($body['storage_limit_mb'] ?? 0),
                'settingsjson' => json_encode(['created_from' => 'workspaces_page'], JSON_UNESCAPED_SLASHES),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            if ($ownerid > 0) {
                pqwsl_upsert_member($workspaceid, $ownerid, 'owner', (int)$USER->id);
            }
            $consumerid = 0;
            if ($consumerenabled || $publicdomain !== '' || $appdomain !== '') {
                $consumerid = pqwsl_upsert_consumer_for_workspace($workspaceid, $name, $consumerslug, $ownerid, $supportemail, $branding);
                if ($branding['websitemode'] !== 'hosted') {
                    $publicdomain = '';
                }
                pqwsl_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1);
                pqwsl_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0);
            }
            $message = $consumerid > 0 ? 'Workspace and institution consumer created.' : 'Workspace created.';
            $result = ['workspaceid' => $workspaceid, 'consumerid' => $consumerid];
        } else if ($action === 'add_member') {
            // -- write: add_member (legacy action=add_member, verbatim) --
            $workspaceid = (int)($body['workspaceid'] ?? 0);
            $role = clean_param((string)($body['workspace_role'] ?? 'teacher'), PARAM_ALPHANUMEXT);
            $needle = trim(clean_param((string)($body['member'] ?? ''), PARAM_TEXT));
            if (!$DB->record_exists('local_prequran_workspace', ['id' => $workspaceid])) {
                throw new invalid_parameter_exception('Workspace was not found.');
            }
            if (!array_key_exists($role, pqh_workspace_roles())) {
                throw new invalid_parameter_exception('Invalid workspace role.');
            }
            $member = pqwsl_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('User was not found by ID, email, or username.');
            }
            pqwsl_upsert_member($workspaceid, (int)$member->id, $role, (int)$USER->id);
            $message = 'Workspace member added.';
            $result = ['workspaceid' => $workspaceid, 'userid' => (int)$member->id];
        } else if ($action === 'update_consumer') {
            // -- write: update_consumer (legacy action=update_consumer, verbatim) --
            $workspaceid = (int)($body['consumer_workspaceid'] ?? 0);
            $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
            if (!$workspace) {
                throw new invalid_parameter_exception('Workspace was not found.');
            }
            $consumerslug = trim(clean_param((string)($body['consumer_slug_existing'] ?? ''), PARAM_ALPHANUMEXT));
            $supportemail = trim(clean_param((string)($body['supportemail_existing'] ?? ''), PARAM_EMAIL));
            $publicdomain = pqwsl_normalize_domain(clean_param((string)($body['public_domain_existing'] ?? ''), PARAM_TEXT));
            $appdomain = pqwsl_normalize_domain(clean_param((string)($body['app_domain_existing'] ?? ''), PARAM_TEXT));
            $branding = [
                'displayname' => trim(clean_param((string)($body['display_name_existing'] ?? ''), PARAM_TEXT)),
                'logourl' => trim(clean_param((string)($body['logo_url_existing'] ?? ''), PARAM_URL)),
                'primarycolor' => trim(clean_param((string)($body['primary_color_existing'] ?? ''), PARAM_TEXT)),
                'accentcolor' => trim(clean_param((string)($body['accent_color_existing'] ?? ''), PARAM_TEXT)),
                'surfacecolor' => trim(clean_param((string)($body['surface_color_existing'] ?? ''), PARAM_TEXT)),
                'dashboardheaderbg' => trim(clean_param((string)($body['dashboard_header_bg_existing'] ?? ''), PARAM_TEXT)),
                'dashboardheadertext' => trim(clean_param((string)($body['dashboard_header_text_existing'] ?? ''), PARAM_TEXT)),
                'pagebodybg' => trim(clean_param((string)($body['page_body_bg_existing'] ?? ''), PARAM_TEXT)),
                'reportheaderbg' => trim(clean_param((string)($body['report_header_bg_existing'] ?? ''), PARAM_TEXT)),
                'reportheadertext' => trim(clean_param((string)($body['report_header_text_existing'] ?? ''), PARAM_TEXT)),
                'reportbodybg' => trim(clean_param((string)($body['report_body_bg_existing'] ?? ''), PARAM_TEXT)),
                'headline' => trim(clean_param((string)($body['landing_headline_existing'] ?? ''), PARAM_TEXT)),
                'subtitle' => trim(clean_param((string)($body['landing_subtitle_existing'] ?? ''), PARAM_TEXT)),
                'websitemode' => clean_param((string)($body['website_mode_existing'] ?? 'hosted'), PARAM_ALPHANUMEXT),
                'externalwebsiteurl' => clean_param((string)($body['external_website_url_existing'] ?? ''), PARAM_URL),
                'domainmanagement' => clean_param((string)($body['domain_management_existing'] ?? 'consumer_managed'), PARAM_ALPHANUMEXT),
                'portallabel' => clean_param((string)($body['portal_label_existing'] ?? 'Learning portal'), PARAM_TEXT),
                'brandingsource' => clean_param((string)($body['branding_source_existing'] ?? 'eduplatform_settings'), PARAM_ALPHANUMEXT),
                'intakelocation' => clean_param((string)($body['intake_location_existing'] ?? 'eduplatform'), PARAM_ALPHANUMEXT),
                'integrationmethod' => clean_param((string)($body['integration_method_existing'] ?? 'links'), PARAM_ALPHANUMEXT),
                'returnurl' => clean_param((string)($body['return_url_existing'] ?? ''), PARAM_URL),
            ];
            $consumerid = pqwsl_upsert_consumer_for_workspace(
                $workspaceid,
                (string)$workspace->name,
                $consumerslug,
                pqwsl_workspace_ownerid($workspaceid),
                $supportemail,
                $branding
            );
            if ($branding['websitemode'] !== 'hosted') {
                $publicdomain = '';
            }
            pqwsl_sync_consumer_domain($consumerid, $workspaceid, $publicdomain, 'public', 1);
            pqwsl_sync_consumer_domain($consumerid, $workspaceid, $appdomain, 'app', $publicdomain === '' ? 1 : 0);
            $message = 'Institution consumer and domains updated.';
            $result = ['workspaceid' => $workspaceid, 'consumerid' => $consumerid];
        } else if ($action === 'seed_operating_model') {
            // -- write: seed_operating_model (legacy action=seed_operating_model, verbatim) --
            [$ownedid, $franchiseid] = pqwsl_seed_operating_model_groups();
            $message = 'Operating model groups are ready: Owned Schools #' . $ownedid . ' and Franchise Schools #' . $franchiseid . '.';
            $result = ['ownedid' => $ownedid, 'franchiseid' => $franchiseid];
        } else if ($action === 'link_org_workspace') {
            // -- write: link_org_workspace (legacy action=link_org_workspace, verbatim) --
            $groupid = (int)($body['org_groupid'] ?? 0);
            $workspaceid = (int)($body['org_workspaceid'] ?? 0);
            $relationship = clean_param((string)($body['org_relationship'] ?? 'owned_branch'), PARAM_ALPHANUMEXT);
            $scopeinput = is_array($body['org_access_scope'] ?? null) ? $body['org_access_scope'] : ['governance'];
            $accessscope = pqwsl_clean_org_access_scopes($scopeinput);
            $inheritsensitive = (int)($body['org_inherit_sensitive_access'] ?? 0) === 1 ? 1 : 0;
            $notes = trim(clean_param((string)($body['org_notes'] ?? ''), PARAM_TEXT));
            pqwsl_upsert_org_group_workspace_link($groupid, $workspaceid, $relationship, $accessscope, $inheritsensitive, $notes);
            $message = 'School workspace linked to the operating model.';
            $result = ['groupid' => $groupid, 'workspaceid' => $workspaceid];
        } else if ($action === 'add_org_user') {
            // -- write: add_org_user (legacy action=add_org_user, verbatim) --
            $groupid = (int)($body['org_user_groupid'] ?? 0);
            $role = clean_param((string)($body['org_group_role'] ?? 'admin'), PARAM_ALPHANUMEXT);
            $orguserid = (int)($body['org_userid'] ?? 0);
            $needle = trim(clean_param((string)($body['org_user'] ?? ''), PARAM_TEXT));
            $notes = trim(clean_param((string)($body['org_user_notes'] ?? ''), PARAM_TEXT));
            if ($orguserid <= 0 && $needle === '') {
                throw new invalid_parameter_exception('Select an eligible user or enter a manual user ID, email, or username.');
            }
            $member = $orguserid > 0 ? core_user::get_user($orguserid, '*', IGNORE_MISSING) : pqwsl_find_user($needle);
            if (!$member) {
                throw new invalid_parameter_exception('User was not found by ID, email, or username.');
            }
            pqwsl_upsert_org_group_user_link($groupid, (int)$member->id, $role, $notes);
            $message = 'Institution group user added.';
            $result = ['groupid' => $groupid, 'userid' => (int)$member->id];
        } else {
            pqpd_fail(400, 'Unknown workspaces action.');
        }
    } catch (Throwable $e) {
        // Legacy catches every write error into $error and shows it as the page
        // alert — same message text, delivered as JSON.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode(['ok' => true, 'message' => $message] + $result, JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the workspaces admin state exactly as the legacy page builds it --
$launchbase = $CFG->wwwroot . '/local/prequran/portal_launch.php';
$legacybase = $CFG->wwwroot . '/local/hubredirect';

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
    $eligibleorgusers = pqwsl_eligible_org_group_users();
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

// -- quick-edit selection (same fallback order as the legacy page) --
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
$edittheme = $editconsumer ? pqwsl_json_array((string)($editconsumer->themejson ?? '')) : [];
$editcopy = $editconsumer ? pqwsl_json_array((string)($editconsumer->copyjson ?? '')) : [];
$editwebsiteprofile = pqhi_consumer_website_profile([], $editconsumer ?: null);

// Whitelist the consumer fields the page renders — the raw record has internal
// columns (createdby, email plumbing, etc.) that never reach the client.
$decorateconsumer = static function (?stdClass $consumer): ?array {
    if (!$consumer) {
        return null;
    }
    return [
        'id' => (int)$consumer->id,
        'slug' => (string)$consumer->slug,
        'name' => (string)$consumer->name,
        'consumer_type' => (string)$consumer->consumer_type,
        'logourl' => (string)($consumer->logourl ?? ''),
        'supportemail' => (string)($consumer->supportemail ?? ''),
        'theme' => pqwsl_json_array((string)($consumer->themejson ?? '')),
        'copy' => pqwsl_json_array((string)($consumer->copyjson ?? '')),
        'website_profile' => pqhi_consumer_website_profile([], $consumer),
    ];
};
$decoratedomain = static function (stdClass $domain): array {
    return [
        'domain' => (string)$domain->domain,
        'domain_type' => (string)$domain->domain_type,
        'verificationstatus' => (string)($domain->verificationstatus ?? ''),
        'isprimary' => (int)($domain->isprimary ?? 0),
    ];
};

// Workspaces list (each row carries its consumer, domains, member count, and the
// first five recent members the legacy table shows).
$workspacesout = [];
foreach ($workspaces as $workspace) {
    $wid = (int)$workspace->id;
    $recent = [];
    foreach (array_slice($recentmembers[$wid] ?? [], 0, 5) as $member) {
        $recent[] = [
            'userid' => (int)$member->userid,
            'workspace_role' => (string)($member->workspace_role ?? 'member'),
            'fullname' => fullname($member),
        ];
    }
    $domainsout = [];
    foreach ($workspacedomains[$wid] ?? [] as $domain) {
        $domainsout[] = $decoratedomain($domain);
    }
    $consumer = $workspaceconsumers[$wid] ?? null;
    $workspacesout[] = [
        'id' => $wid,
        'name' => (string)$workspace->name,
        'slug' => (string)$workspace->slug,
        'workspace_type' => (string)$workspace->workspace_type,
        'type_label' => (string)(pqh_workspace_types()[$workspace->workspace_type] ?? $workspace->workspace_type),
        'plan_code' => (string)$workspace->plan_code,
        'status' => (string)$workspace->status,
        'ownerid' => (int)$workspace->ownerid,
        'student_limit' => (int)$workspace->student_limit,
        'teacher_limit' => (int)$workspace->teacher_limit,
        'session_limit' => (int)$workspace->session_limit,
        'storage_limit_mb' => (int)$workspace->storage_limit_mb,
        'membercount' => (int)($membercounts[$wid] ?? 0),
        'recentmembers' => $recent,
        'consumer' => $decorateconsumer($consumer),
        'domains' => $domainsout,
        'dashboard_launch' => $launchbase . '?report=workspace-dashboard&workspaceid=' . $wid,
        'institution_settings_url' => $legacybase . '/institution_settings.php?workspaceid=' . $wid,
        'diagnostics_url' => $consumer ? $legacybase . '/consumer_diagnostics.php?consumer=' . rawurlencode((string)$consumer->slug) : '',
    ];
}

// Org groups with their linked workspaces and users (drives the operating-model
// panels and the "current links" list).
$orggroupsout = [];
foreach ($orggroups as $group) {
    $gid = (int)$group->id;
    $memout = [];
    foreach ($orggroupmembers[$gid] ?? [] as $member) {
        $memout[] = [
            'memberid' => (int)$member->memberid,
            'workspacename' => (string)($member->workspacename ?? ('Workspace #' . $member->memberid)),
            'relationship_type' => (string)$member->relationship_type,
            'access_scope' => (string)$member->access_scope,
            'inherit_sensitive_access' => (int)($member->inherit_sensitive_access ?? 0),
        ];
    }
    $usrout = [];
    foreach ($orggroupusers[$gid] ?? [] as $userlink) {
        $usrout[] = [
            'memberid' => (int)$userlink->memberid,
            'group_role' => (string)$userlink->group_role,
            'fullname' => fullname($userlink),
            'email' => (string)($userlink->email ?? ''),
        ];
    }
    $orggroupsout[] = [
        'id' => $gid,
        'slug' => (string)$group->slug,
        'name' => (string)$group->name,
        'group_type' => (string)$group->group_type,
        'members' => $memout,
        'users' => $usrout,
    ];
}

$eligibleout = [];
foreach ($eligibleorgusers as $eligibleuser) {
    $eligibleout[] = [
        'id' => (int)$eligibleuser->id,
        'fullname' => fullname($eligibleuser),
        'email' => (string)($eligibleuser->email ?? ''),
        'sources' => array_values($eligibleuser->sources),
    ];
}

$editout = null;
if ($editworkspace) {
    $editout = [
        'workspaceid' => (int)$editworkspace->id,
        'workspacename' => (string)$editworkspace->name,
        'consumer' => $decorateconsumer($editconsumer),
        'publicdomain' => $editpublicdomain,
        'appdomain' => $editappdomain,
        'theme' => $edittheme,
        'copy' => $editcopy,
        'website_profile' => $editwebsiteprofile,
    ];
}

$nameids = [];
foreach ($workspaces as $workspace) {
    $nameids[] = (int)$workspace->ownerid;
}
foreach ($recentmembers as $memberlist) {
    foreach ($memberlist as $member) {
        $nameids[] = (int)$member->userid;
    }
}
foreach ($orggroupusers as $userlist) {
    foreach ($userlist as $userlink) {
        $nameids[] = (int)$userlink->memberid;
    }
}
foreach ($eligibleorgusers as $eligibleuser) {
    $nameids[] = (int)$eligibleuser->id;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'orgready' => $orgready,
    'workspaces' => $workspacesout,
    'institutiondashboard' => $institutiondashboard,
    'orggroups' => $orggroupsout,
    'eligibleorgusers' => $eligibleout,
    'edit' => $editout,
    'options' => [
        'workspace_types' => pqh_workspace_types(),
        'workspace_roles' => pqh_workspace_roles(),
        'org_access_scopes' => pqwsl_org_access_scope_options(),
        'org_group_roles' => pqwsl_org_group_role_options(),
        'website_modes' => pqhi_website_mode_options(),
        'domain_managements' => pqhi_domain_management_options(),
        'branding_sources' => pqhi_branding_source_options(),
        'intake_locations' => pqhi_intake_location_options(),
        'integration_methods' => pqhi_integration_method_options(),
    ],
    'links' => [
        'onboarding' => $legacybase . '/institution_onboarding.php',
        'liveadmin' => $legacybase . '/live_admin.php',
        'dashboard_launch' => $launchbase . '?report=dashboard',
    ],
    'legacyurl' => $legacybase . '/workspaces.php',
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
