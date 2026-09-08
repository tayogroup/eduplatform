<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqh_access_denied(string $message, ?moodle_url $returnurl = null, string $title = 'Access not available'): void {
    $params = [
        'message' => $message,
        'title' => $title,
    ];
    $consumerslug = '';
    if (function_exists('optional_param')) {
        $consumerslug = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
    }
    if ($consumerslug !== '') {
        $params['consumer'] = $consumerslug;
    }
    $workspaceid = 0;
    if (function_exists('optional_param')) {
        $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
    }
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    if ($returnurl) {
        $params['return'] = $returnurl->out(false);
    }
    redirect(new moodle_url('/local/hubredirect/access_denied.php', $params));
}

function pqh_user_has_role_shortname(int $userid, array $shortnames): bool {
    global $DB;
    if ($userid <= 0 || !$shortnames) {
        return false;
    }
    [$insql, $params] = $DB->get_in_or_equal(array_values($shortnames), SQL_PARAMS_NAMED, 'role');
    $params['userid'] = $userid;
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = :userid
            AND r.shortname {$insql}",
        $params
    );
}

function pqh_is_school_principal(int $userid): bool {
    return pqh_user_has_role_shortname($userid, ['school_principal']);
}

function pqh_is_sqa_tester(int $userid): bool {
    return pqh_user_has_role_shortname($userid, ['sqa_tester']);
}

function pqh_can_manage_academy_operations(int $userid): bool {
    return is_siteadmin($userid) || pqh_is_school_principal($userid);
}

function pqh_can_view_sqa_dashboard(int $userid): bool {
    return pqh_can_manage_academy_operations($userid) || pqh_is_sqa_tester($userid);
}

/**
 * How long a live class may be scheduled for, in minutes, by this user.
 *
 * 90 for everyone; administrators (site admins and school principals, via
 * pqh_can_manage_academy_operations) may overwrite up to 240 (4 hours).
 * The cap is keyed on the ACTOR doing the scheduling, not the teacher the
 * session is created for - "an administrator may schedule a long class for a
 * teacher" is the point, "a teacher may by naming an admin" is not.
 *
 * Every BBB room gets a further 30-minute grace on top at the create call
 * sites ("+ 30" on scheduled_end - scheduled_start), so the longest room an
 * administrator can start runs 4.5 hours. local_prequran_bbb_meeting_defaults()
 * in local/prequran/locallib.php holds that 270-minute room ceiling and must
 * move together with this cap.
 */
function pqh_live_duration_cap_minutes(int $userid): int {
    return pqh_can_manage_academy_operations($userid) ? 240 : 90;
}

function pqh_live_duration_clamp(int $userid, int $minutes): int {
    return max(15, min(pqh_live_duration_cap_minutes($userid), $minutes));
}

/**
 * The duration choices a scheduling form offers this user, capped by
 * pqh_live_duration_cap_minutes - so the form never offers a length the
 * server would silently clamp away.
 */
function pqh_live_duration_options(int $userid): array {
    $cap = pqh_live_duration_cap_minutes($userid);
    return array_values(array_filter(
        [45, 60, 75, 90, 120, 150, 180, 210, 240],
        static function (int $minutes) use ($cap): bool {
            return $minutes <= $cap;
        }
    ));
}

function pqh_require_academy_operations(string $message, ?moodle_url $returnurl = null, string $title = 'Platform operations access required'): void {
    global $USER;
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return;
    }
    pqh_access_denied($message, $returnurl, $title);
}

function pqh_require_platform_operations(string $message, ?moodle_url $returnurl = null, string $title = 'Platform operations access required'): void {
    $consumercontext = pqh_current_consumer_context();
    $isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
        && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
        && !empty($consumercontext->trusted_domain);

    if (!$isfoundationdomain) {
        $returnparams = [];
        $consumerslug = trim((string)($consumercontext->consumerslug ?? ''));
        if ($consumerslug !== '') {
            $returnparams['consumer'] = $consumerslug;
        }
        $workspaceid = (int)($consumercontext->workspaceid ?? 0);
        if ($workspaceid > 0) {
            $returnparams['workspaceid'] = $workspaceid;
        }

        $dashboardpath = trim((string)($consumercontext->defaultdashboardpath ?? ''));
        if ($workspaceid > 0 && ($dashboardpath === '' || $dashboardpath === '/local/hubredirect/dashboard.php'
                || $dashboardpath === '/local/hubredirect/platform_dashboard.php')) {
            $dashboardpath = '/local/hubredirect/workspace_dashboard.php';
        }
        if ($dashboardpath === '' || $dashboardpath === '/local/hubredirect/platform_dashboard.php') {
            $dashboardpath = trim((string)($consumercontext->defaultpublicpath ?? ''));
        }
        if ($dashboardpath === '') {
            $dashboardpath = '/local/hubredirect/consumer_landing.php';
        }

        pqh_access_denied(
            'EduPlatform administration is only available from the EduPlatform foundation domain.',
            new moodle_url($dashboardpath, $returnparams),
            'Platform access not available'
        );
    }

    pqh_require_academy_operations($message, $returnurl, $title);
}

function pqh_table_exists_safe(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqh_table_has_field_safe(string $table, string $field): bool {
    global $DB;
    if (!pqh_table_exists_safe($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqh_active_teacher_profile_models(int $userid): array {
    global $DB;
    if ($userid <= 0 || !pqh_table_exists_safe('local_prequran_teacher_profile')
            || !pqh_table_has_field_safe('local_prequran_teacher_profile', 'teacher_work_models')) {
        return [];
    }
    $statusfilter = '';
    $params = ['userid' => $userid];
    if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'status')) {
        $statusfilter = ' AND LOWER(status) NOT IN (:archived, :inactive, :rejected)';
        $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
    }
    $storedvalues = $DB->get_fieldset_select(
        'local_prequran_teacher_profile',
        'teacher_work_models',
        'userid = :userid' . $statusfilter,
        $params
    );
    if (!$storedvalues) {
        return [];
    }
    $aliases = [
        'independent_teacher' => 'independent_teacher',
        'independent teacher' => 'independent_teacher',
        'independent teacher/tutor' => 'independent_teacher',
        'private/internal teacher only' => 'independent_teacher',
        'school_teacher' => 'independent_teacher',
        'teach for one school' => 'independent_teacher',
        'multi_school_teacher' => 'independent_teacher',
        'teach for multiple schools' => 'independent_teacher',
        'marketplace_teacher' => 'marketplace_teacher',
        'marketplace teacher/tutor' => 'marketplace_teacher',
        'marketplace_tutor' => 'marketplace_teacher',
        'public marketplace tutor' => 'marketplace_teacher',
    ];
    $models = [];
    foreach ($storedvalues as $stored) {
        foreach (array_map('trim', explode(',', (string)$stored)) as $part) {
            $key = strtolower((string)$part);
            if ($key !== '' && isset($aliases[$key]) && !in_array($aliases[$key], $models, true)) {
                $models[] = $aliases[$key];
            }
        }
    }
    return $models;
}

function pqh_has_independent_teacher_profile(int $userid): bool {
    return in_array('independent_teacher', pqh_active_teacher_profile_models($userid), true);
}

function pqh_has_teacher_profile(int $userid): bool {
    return pqh_active_teacher_profile_models($userid) !== [];
}

function pqh_independent_teacher_workspace_ids(int $userid): array {
    global $DB;
    if ($userid <= 0 || !pqh_has_independent_teacher_profile($userid)
            || !pqh_table_exists_safe('local_prequran_teacher_profile')) {
        return [];
    }
    $ids = [];
    if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')) {
        $statusfilter = '';
        $params = ['userid' => $userid, 'zeroworkspace' => 0];
        if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'status')) {
            $statusfilter = ' AND LOWER(status) NOT IN (:archived, :inactive, :rejected)';
            $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        $rows = $DB->get_records_select(
            'local_prequran_teacher_profile',
            'userid = :userid AND workspaceid > :zeroworkspace' . $statusfilter,
            $params,
            'timemodified DESC, id DESC',
            'id, workspaceid'
        );
        foreach ($rows as $row) {
            $workspaceid = (int)($row->workspaceid ?? 0);
            if ($workspaceid > 0 && pqh_consumer_context_allows_workspace(null, $workspaceid)) {
                $ids[$workspaceid] = $workspaceid;
            }
        }
    }
    if (!$ids && pqh_table_has_field_safe('local_prequran_teacher_profile', 'consumerid')) {
        $consumerid = (int)$DB->get_field('local_prequran_teacher_profile', 'consumerid', ['userid' => $userid], IGNORE_MISSING);
        if ($consumerid > 0 && pqh_consumer_schema_ready()) {
            $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid, 'status' => 'active'], '*', IGNORE_MISSING);
            if ($consumer) {
                $context = pqh_consumer_context_from_records($consumer, null);
                foreach (pqh_consumer_context_workspace_ids($context) as $workspaceid) {
                    if ($workspaceid > 0 && pqh_consumer_context_allows_workspace(null, $workspaceid)) {
                        $ids[$workspaceid] = $workspaceid;
                    }
                }
            }
        }
    }
    return array_values($ids);
}

function pqh_account_no_value($userorid): string {
    global $DB;

    $idnumber = '';
    $userid = 0;
    if (is_object($userorid)) {
        $userid = (int)($userorid->id ?? $userorid->userid ?? $userorid->studentid ?? $userorid->teacherid ?? $userorid->parentid ?? $userorid->guardianid ?? $userorid->requesterid ?? 0);
        if (property_exists($userorid, 'idnumber')) {
            $idnumber = trim((string)$userorid->idnumber);
        }
    } else {
        $userid = (int)$userorid;
    }

    if ($idnumber === '' && $userid > 0) {
        try {
            $idnumber = trim((string)$DB->get_field('user', 'idnumber', ['id' => $userid, 'deleted' => 0], IGNORE_MISSING));
        } catch (Throwable $e) {
            $idnumber = '';
        }
    }

    return preg_match('/^[0-9]{5}$/', $idnumber) ? $idnumber : '';
}

function pqh_account_no_label($userorid, string $empty = 'Account No. pending repair'): string {
    $accountno = pqh_account_no_value($userorid);
    return $accountno !== '' ? 'Account No. ' . $accountno : $empty;
}

function pqh_default_workspace_id(): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return 0;
    }
    return (int)$DB->get_field_select(
        'local_prequran_workspace',
        'id',
        "workspace_type = ? AND status = ?",
        ['academy_managed', 'active'],
        IGNORE_MISSING
    );
}

function pqh_normalize_consumer_host(string $host): string {
    $host = strtolower(trim($host));
    $host = preg_replace('/^https?:\/\//', '', $host);
    $host = preg_replace('/\/.*$/', '', $host);
    $host = preg_replace('/:\d+$/', '', $host);
    $host = trim((string)$host, " \t\n\r\0\x0B.");
    if ($host === '') {
        return '';
    }
    return clean_param($host, PARAM_HOST);
}

function pqh_request_host(): string {
    $host = (string)($_SERVER['HTTP_HOST'] ?? '');
    if ($host === '') {
        $host = (string)($_SERVER['SERVER_NAME'] ?? '');
    }
    return pqh_normalize_consumer_host($host);
}

function pqh_consumer_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_consumer')
        && pqh_table_exists_safe('local_prequran_consumer_domain');
}

function pqh_org_group_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_org_group')
        && pqh_table_exists_safe('local_prequran_org_group_member');
}

function pqh_org_group_types(): array {
    return [
        'owned_group' => 'Owned schools',
        'franchise_network' => 'Franchise network',
    ];
}

function pqh_org_group_relationship_types(): array {
    return [
        'owned_branch' => 'Owned branch',
        'franchise_member' => 'Franchise member',
    ];
}

/**
 * Parse a stored comma-separated access_scope column value back into its
 * individual scope keys, dropping anything that is no longer a valid scope
 * (see pqw_org_access_scope_options() in workspaces.php for the option list
 * this validates against).
 */
function pqh_org_group_access_scopes(string $accessscope): array {
    $allowed = ['governance', 'operations', 'audit', 'shared_support'];
    $scopes = array_filter(array_map('trim', explode(',', $accessscope)));
    return array_values(array_intersect($scopes, $allowed));
}

function pqh_fallback_consumer_context(string $host = ''): stdClass {
    global $CFG;
    $platformhost = pqh_normalize_consumer_host((string)(parse_url((string)($CFG->wwwroot ?? ''), PHP_URL_HOST) ?: ''));
    $supportemail = trim((string)($CFG->supportemail ?? ''));
    $context = (object)[
        'consumerid' => 0,
        'consumerslug' => 'eduplatform',
        'consumername' => 'EduPlatform',
        'consumer_type' => 'platform_foundation',
        'institution_type' => '',
        'faith_subcategory' => '',
        'teaching_method' => '',
        'operator_type' => '',
        'website_mode' => 'hosted',
        'externalwebsiteurl' => '',
        'domainmanagement' => 'eduplatform_managed',
        'portallabel' => 'Learning portal',
        'brandingsource' => 'eduplatform_settings',
        'intakelocation' => 'eduplatform',
        'integrationmethod' => 'links',
        'returnurl' => '',
        'workspaceid' => 0,
        'domain' => $host !== '' ? $host : $platformhost,
        'domain_type' => 'public',
        'isprimarydomain' => 1,
        'trusted_domain' => false,
        'supportemail' => $supportemail,
        'logourl' => '',
        'themejson' => '',
        'copyjson' => '',
        'defaultpublicpath' => '/local/hubredirect/platform_landing.php',
        'defaultdashboardpath' => '/local/hubredirect/platform_dashboard.php',
        'emailfromname' => 'EduPlatform',
        'emailreplyto' => $supportemail,
    ];
    return $context;
}

function pqh_consumer_context_from_records(stdClass $consumer, ?stdClass $domain = null): stdClass {
    $workspaceid = $domain ? (int)($domain->workspaceid ?? 0) : 0;
    if ($workspaceid <= 0) {
        $workspaceid = (int)($consumer->primaryworkspaceid ?? 0);
    }
    return (object)[
        'consumerid' => (int)$consumer->id,
        'consumerslug' => (string)$consumer->slug,
        'consumername' => (string)$consumer->name,
        'consumer_type' => (string)($consumer->consumer_type ?? ''),
        'institution_type' => (string)($consumer->institution_type ?? ''),
        'faith_subcategory' => (string)($consumer->faith_subcategory ?? ''),
        'teaching_method' => (string)($consumer->teaching_method ?? ''),
        'operator_type' => (string)($consumer->operator_type ?? ''),
        'website_mode' => (string)($consumer->website_mode ?? 'hosted'),
        'externalwebsiteurl' => (string)($consumer->externalwebsiteurl ?? ''),
        'domainmanagement' => (string)($consumer->domainmanagement ?? 'consumer_managed'),
        'portallabel' => (string)($consumer->portallabel ?? 'Learning portal'),
        'brandingsource' => (string)($consumer->brandingsource ?? 'eduplatform_settings'),
        'intakelocation' => (string)($consumer->intakelocation ?? 'eduplatform'),
        'integrationmethod' => (string)($consumer->integrationmethod ?? 'links'),
        'returnurl' => (string)($consumer->returnurl ?? ''),
        'workspaceid' => $workspaceid,
        'domain' => $domain ? (string)$domain->domain : '',
        'domain_type' => $domain ? (string)$domain->domain_type : '',
        'isprimarydomain' => $domain ? (int)$domain->isprimary : 0,
        'trusted_domain' => $domain !== null,
        'supportemail' => (string)($consumer->supportemail ?? ''),
        'logourl' => (string)($consumer->logourl ?? ''),
        'themejson' => (string)($consumer->themejson ?? ''),
        'copyjson' => (string)($consumer->copyjson ?? ''),
        'defaultpublicpath' => (string)($consumer->defaultpublicpath ?? '/'),
        'defaultdashboardpath' => (string)($consumer->defaultdashboardpath ?? '/local/hubredirect/dashboard.php'),
        'emailfromname' => (string)($consumer->emailfromname ?? $consumer->name),
        'emailreplyto' => (string)($consumer->emailreplyto ?? $consumer->supportemail ?? ''),
    ];
}

function pqh_apply_consumer_embed_headers(stdClass $context): void {
    $embedenabled = (string)($context->website_mode ?? '') === 'external_with_embeds'
        || (string)($context->intakelocation ?? '') === 'embedded'
        || (string)($context->integrationmethod ?? '') === 'embedded';
    if (!$embedenabled) {
        return;
    }
    $websiteurl = trim((string)($context->externalwebsiteurl ?? ''));
    $scheme = strtolower((string)(parse_url($websiteurl, PHP_URL_SCHEME) ?: ''));
    $host = pqh_normalize_consumer_host((string)(parse_url($websiteurl, PHP_URL_HOST) ?: ''));
    if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
        return;
    }
    @header_remove('X-Frame-Options');
    @header("Content-Security-Policy: frame-ancestors 'self' " . $scheme . '://' . $host, true);
}

function pqh_json_array(string $json): array {
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqh_clean_brand_url(string $value): string {
    $value = trim(str_replace(["\r", "\n", '"', "'", '\\'], '', $value));
    if ($value === '') {
        return '';
    }
    if (preg_match('/^https?:\/\//i', $value)) {
        $url = clean_param($value, PARAM_URL);
        return filter_var($url, FILTER_VALIDATE_URL) ? $url : '';
    }
    if ($value[0] !== '/') {
        return '';
    }
    $path = clean_param($value, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        return '';
    }
    return $path;
}

function pqh_consumer_theme(?stdClass $consumer = null): array {
    $theme = pqh_json_array((string)($consumer->themejson ?? ''));
    $clean = static function(string $value, string $fallback): string {
        return preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? $value : $fallback;
    };
    $primary = $clean((string)($theme['primary_color'] ?? ''), '#2166d1');
    $accent = $clean((string)($theme['accent_color'] ?? ''), '#4d8be0');
    $surface = $clean((string)($theme['surface_color'] ?? ''), '#eef4fa');
    $headerbg = $clean((string)($theme['dashboard_header_bg'] ?? ''), $primary);
    $headertext = $clean((string)($theme['dashboard_header_text'] ?? ''), '#ffffff');
    $pagebody = $clean((string)($theme['page_body_bg'] ?? ''), $surface);
    $reportheader = $clean((string)($theme['report_header_bg'] ?? ''), $primary);
    $reportheadertext = $clean((string)($theme['report_header_text'] ?? ''), '#ffffff');
    $reportbody = $clean((string)($theme['report_body_bg'] ?? ''), '#ffffff');
    return [
        'primary_color' => $primary,
        'accent_color' => $accent,
        'surface_color' => $surface,
        'dashboard_header_bg' => $headerbg,
        'dashboard_header_text' => $headertext,
        'page_body_bg' => $pagebody,
        'report_header_bg' => $reportheader,
        'report_header_text' => $reportheadertext,
        'report_body_bg' => $reportbody,
    ];
}

function pqh_consumer_copy(?stdClass $consumer = null): array {
    return pqh_json_array((string)($consumer->copyjson ?? ''));
}

function pqh_consumer_feature_enabled(?stdClass $consumer, string $feature, bool $default = false): bool {
    $copy = pqh_consumer_copy($consumer);
    $features = isset($copy['features']) && is_array($copy['features']) ? $copy['features'] : [];
    if (array_key_exists($feature, $features)) {
        return (bool)$features[$feature];
    }
    if ($feature === 'teacher_marketplace') {
        return (string)($consumer->consumer_type ?? '') === 'marketplace';
    }
    return $default;
}

function pqh_consumer_hero_image_url(?stdClass $consumer = null, string $fallback = '/local/hubredirect/pix/landing-welcome.jpg'): string {
    $copy = pqh_consumer_copy($consumer);
    $hero = pqh_clean_brand_url((string)($copy['hero_image_url'] ?? ''));
    if ($hero !== '') {
        return $hero;
    }
    return pqh_clean_brand_url($fallback) ?: '/local/hubredirect/pix/landing-welcome.jpg';
}

function pqh_consumer_brand_initials(?stdClass $consumer = null, string $fallback = 'W'): string {
    $brand = trim((string)($consumer->consumername ?? $consumer->name ?? ''));
    $copy = pqh_consumer_copy($consumer);
    $initials = strtoupper(substr(trim((string)($copy['brand_initials'] ?? '')), 0, 6));
    if ($initials !== '') {
        return $initials;
    }
    $source = preg_replace('/[^a-z0-9]/i', '', $brand);
    $initials = strtoupper(substr((string)$source, 0, 1));
    return $initials !== '' ? $initials : $fallback;
}

function pqh_consumer_context_by_slug(string $slug): stdClass {
    global $DB;
    $slug = clean_param(trim($slug), PARAM_ALPHANUMEXT);
    if ($slug === '' || !pqh_consumer_schema_ready()) {
        return pqh_fallback_consumer_context(pqh_request_host());
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['slug' => $slug, 'status' => 'active'], '*', IGNORE_MISSING);
    if (!$consumer) {
        return pqh_fallback_consumer_context(pqh_request_host());
    }
    $domain = $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_consumer_domain}
          WHERE consumerid = :consumerid
            AND status = :status
       ORDER BY isprimary DESC, id ASC",
        ['consumerid' => (int)$consumer->id, 'status' => 'active'],
        IGNORE_MULTIPLE
    );
    return pqh_consumer_context_from_records($consumer, $domain ?: null);
}

function pqh_consumer_context_by_workspace(int $workspaceid): ?stdClass {
    global $DB;
    if ($workspaceid <= 0 || !pqh_consumer_schema_ready()) {
        return null;
    }
    $consumer = $DB->get_record('local_prequran_consumer', [
        'primaryworkspaceid' => $workspaceid,
        'status' => 'active',
    ], '*', IGNORE_MISSING);
    $context = $consumer ? pqh_consumer_context_from_records($consumer, null) : null;

    $parentcontext = null;
    if (pqh_org_group_schema_ready()) {
        $parentconsumer = $DB->get_record_sql(
            "SELECT c.*
               FROM {local_prequran_org_group_member} gm
               JOIN {local_prequran_org_group} g ON g.id = gm.groupid
               JOIN {local_prequran_consumer} c ON c.id = g.parentconsumerid
              WHERE gm.member_type = :membertype
                AND gm.memberid = :workspaceid
                AND gm.relationship_type = :relationship
                AND gm.status = :memberstatus
                AND g.group_type = :grouptype
                AND g.status = :groupstatus
                AND c.status = :consumerstatus
           ORDER BY gm.id ASC",
            [
                'membertype' => 'workspace',
                'workspaceid' => $workspaceid,
                'relationship' => 'owned_branch',
                'memberstatus' => 'active',
                'grouptype' => 'owned_group',
                'groupstatus' => 'active',
                'consumerstatus' => 'active',
            ],
            IGNORE_MULTIPLE
        );
        if ($parentconsumer) {
            $parentcontext = pqh_consumer_context_from_records($parentconsumer, null);
        }
    }
    if (!$context) {
        if ($parentcontext) {
            $parentcontext->workspaceid = $workspaceid;
            $parentcontext->inherited_theme_from_consumerid = (int)($parentcontext->consumerid ?? 0);
        }
        return $parentcontext;
    }
    if ($parentcontext) {
        $parenttheme = pqh_json_array((string)($parentcontext->themejson ?? ''));
        $localtheme = pqh_json_array((string)($context->themejson ?? ''));
        $context->themejson = json_encode(array_merge($parenttheme, $localtheme), JSON_UNESCAPED_SLASHES);
        $context->inherited_theme_from_consumerid = (int)($parentcontext->consumerid ?? 0);
    }
    return $context;
}

/**
 * Active child schools linked under a parent consumer's owned org_group
 * (for example the K-12 and Languages schools owned by the Ehel Academy
 * parent consumer). Used to let a visitor on the parent's own domain pick
 * which actual school a public request is for.
 *
 * @return stdClass[] consumer contexts, in the order they were linked
 */
function pqh_org_group_child_schools(int $parentconsumerid): array {
    global $DB;
    if ($parentconsumerid <= 0 || !pqh_org_group_schema_ready() || !pqh_consumer_schema_ready()) {
        return [];
    }
    try {
        $rows = $DB->get_records_sql(
            "SELECT c.*, gm.id AS gm_id
               FROM {local_prequran_org_group_member} gm
               JOIN {local_prequran_org_group} g ON g.id = gm.groupid
               JOIN {local_prequran_consumer} c ON c.primaryworkspaceid = gm.memberid
              WHERE g.parentconsumerid = :parentconsumerid
                AND g.status = :groupstatus
                AND g.group_type = :grouptype
                AND gm.member_type = :membertype
                AND gm.relationship_type = :relationship
                AND gm.status = :memberstatus
                AND c.status = :consumerstatus
           ORDER BY gm.id ASC",
            [
                'parentconsumerid' => $parentconsumerid,
                'groupstatus' => 'active',
                'grouptype' => 'owned_group',
                'membertype' => 'workspace',
                'relationship' => 'owned_branch',
                'memberstatus' => 'active',
                'consumerstatus' => 'active',
            ]
        );
    } catch (Throwable $e) {
        return [];
    }
    $schools = [];
    foreach ($rows as $row) {
        $schools[] = pqh_consumer_context_from_records($row, null);
    }
    return $schools;
}

/**
 * Course category ids owned by a workspace's institution: the category bound
 * to the consumer by idnumber (pqco_consumer_<consumerid>, the key
 * pqco_consumer_category_id() writes), or one simply named after the consumer
 * or workspace, plus every descendant category.
 *
 * Returns [] when nothing matches. Callers must read that as "this workspace
 * has no category binding" and fall back to their own scoping -- NOT as "this
 * workspace owns no courses", which would empty their listings.
 */
function pqh_workspace_course_category_ids(int $workspaceid): array {
    global $DB;

    if ($workspaceid <= 0 || !pqh_table_exists_safe('course_categories')) {
        return [];
    }

    $context = pqh_consumer_context_by_workspace($workspaceid);
    $consumerid = (int)($context->consumerid ?? 0);
    $consumername = trim((string)($context->consumername ?? ''));
    $workspacename = '';
    try {
        $workspacename = trim((string)$DB->get_field('local_prequran_workspace', 'name', ['id' => $workspaceid], IGNORE_MISSING));
    } catch (Throwable $e) {
        $workspacename = '';
    }
    if ($consumername === '') {
        $consumername = $workspacename;
    }
    if ($consumerid <= 0 && $consumername === '') {
        return [];
    }

    $categoryids = [];
    try {
        $roots = $DB->get_records_select(
            'course_categories',
            'idnumber = :idnumber OR name = :consumername OR name = :workspacename',
            [
                'idnumber' => $consumerid > 0 ? 'pqco_consumer_' . $consumerid : '__none__',
                'consumername' => $consumername !== '' ? $consumername : '__none__',
                'workspacename' => $workspacename !== '' ? $workspacename : '__none__',
            ],
            '',
            'id,path'
        );
        foreach ($roots as $root) {
            $categoryids[(int)$root->id] = (int)$root->id;
            $path = (string)($root->path ?? '');
            if ($path === '') {
                continue;
            }
            foreach ($DB->get_records_select('course_categories', $DB->sql_like('path', ':path'), ['path' => $path . '/%'], '', 'id') as $child) {
                $categoryids[(int)$child->id] = (int)$child->id;
            }
        }
    } catch (Throwable $e) {
        return [];
    }
    return array_values($categoryids);
}

function pqh_user_primary_workspace_id(int $userid): int {
    global $CFG, $DB;
    if ($userid <= 0) {
        return 0;
    }
    if (is_siteadmin($userid)) {
        return 0;
    }

    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $workspaceid = (int)$DB->get_field_sql(
            "SELECT workspaceid
               FROM {local_prequran_workspace_member}
              WHERE userid = :userid
                AND status = :status
           ORDER BY CASE workspace_role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'coordinator' THEN 3
                    WHEN 'teacher' THEN 4
                    WHEN 'assistant_teacher' THEN 5
                    WHEN 'parent' THEN 6
                    WHEN 'student' THEN 7
                    ELSE 8 END,
                    timemodified DESC,
                    id DESC",
            ['userid' => $userid, 'status' => 'active'],
            IGNORE_MISSING
        );
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    if (pqh_table_exists_safe('local_prequran_student_profile')
            && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')) {
        $workspaceid = (int)$DB->get_field('local_prequran_student_profile', 'workspaceid', ['userid' => $userid], IGNORE_MISSING);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')) {
        $workspaceid = (int)$DB->get_field('local_prequran_teacher_profile', 'workspaceid', ['userid' => $userid], IGNORE_MISSING);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $workspaceid = (int)$DB->get_field_select(
            'local_prequran_teacher_student',
            'workspaceid',
            '(teacherid = ? OR studentid = ?) AND workspaceid > ? AND status <> ?',
            [$userid, $userid, 0, 'archived'],
            IGNORE_MISSING
        );
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }

    if (!function_exists('local_prequran_dashboard_redirect_role')) {
        $lib = (string)($CFG->dirroot ?? '') . '/local/prequran/lib.php';
        if (is_readable($lib)) {
            require_once($lib);
        }
    }
    if (function_exists('local_prequran_dashboard_redirect_role')
            && local_prequran_dashboard_redirect_role($userid) !== '') {
        return pqh_default_workspace_id();
    }

    return 0;
}

function pqh_user_primary_consumer_context(int $userid): ?stdClass {
    global $DB;
    $workspaceid = pqh_user_primary_workspace_id($userid);
    if ($workspaceid > 0) {
        $context = pqh_consumer_context_by_workspace($workspaceid);
        if ($context) {
            return $context;
        }
    }

    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'consumerid')
            && pqh_consumer_schema_ready()) {
        $consumerid = (int)$DB->get_field('local_prequran_teacher_profile', 'consumerid', ['userid' => $userid], IGNORE_MISSING);
        if ($consumerid > 0) {
            $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid, 'status' => 'active'], '*', IGNORE_MISSING);
            if ($consumer) {
                return pqh_consumer_context_from_records($consumer, null);
            }
        }
    }

    return null;
}

function pqh_consumer_dashboard_domain(stdClass $context): string {
    global $DB;

    $consumerid = (int)($context->consumerid ?? 0);
    if ($consumerid > 0 && pqh_consumer_schema_ready()) {
        $domain = $DB->get_field_sql(
            "SELECT domain
               FROM {local_prequran_consumer_domain}
              WHERE consumerid = :consumerid
                AND status = :status
           ORDER BY CASE domain_type WHEN 'app' THEN 1 WHEN 'public' THEN 2 ELSE 3 END,
                    isprimary DESC,
                    id ASC",
            [
                'consumerid' => $consumerid,
                'status' => 'active',
            ],
            IGNORE_MISSING
        );
        $domain = pqh_normalize_consumer_host((string)$domain);
        if ($domain !== '') {
            return $domain;
        }
    }

    return pqh_normalize_consumer_host((string)($context->domain ?? ''));
}

function pqh_user_consumer_dashboard_url(stdClass $context): moodle_url {
    $path = trim((string)($context->defaultdashboardpath ?? ''));
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^https?:/i', $path)) {
        $path = '/local/hubredirect/dashboard.php';
    }
    $params = [];
    if ((string)($context->consumerslug ?? '') !== '') {
        $params['consumer'] = (string)$context->consumerslug;
    }
    if ((int)($context->workspaceid ?? 0) > 0) {
        $params['workspaceid'] = (int)$context->workspaceid;
    }
    $domain = pqh_consumer_dashboard_domain($context);
    if ($domain !== '') {
        return new moodle_url('https://' . $domain . '/' . ltrim($path, '/'), $params);
    }
    return new moodle_url('/' . ltrim($path, '/'), $params);
}

/**
 * The user's own consumer dashboard, but only when it lives on a different
 * host than the current request. pqh_user_consumer_dashboard_url() falls back
 * to a path-only URL when the consumer has no active domain row, and wwwroot
 * follows the request host, so following that fallback from another
 * consumer's domain sends the page straight back to itself: the host still
 * resolves to the foreign consumer, the same branch fires again, and the
 * browser reports a redirect loop. Returns null when the target would stay on
 * this host; callers must fall through to their access-denied path.
 */
function pqh_user_consumer_dashboard_url_offhost(stdClass $context): ?moodle_url {
    $url = pqh_user_consumer_dashboard_url($context);
    $targethost = pqh_normalize_consumer_host((string)parse_url($url->out(false), PHP_URL_HOST));
    if ($targethost === '' || $targethost === pqh_request_host()) {
        return null;
    }
    return $url;
}

/**
 * Which consumer_domain domain_type a workspace role should live on after
 * login, e.g. 'teacher'/'assistant_teacher' -> 'teacher_portal'. Roles with
 * no mapping (registrar, support, sponsor, unassigned) return '' so callers
 * can treat that as "no role-domain enforcement for this user."
 */
function pqh_role_portal_domain_type(string $role): string {
    $map = [
        'student' => 'student_portal',
        'parent' => 'parent_portal',
        'teacher' => 'teacher_portal',
        'assistant_teacher' => 'teacher_portal',
        'owner' => 'admin_portal',
        'admin' => 'admin_portal',
        'platform_admin' => 'admin_portal',
        'coordinator' => 'admin_portal',
        'auditor' => 'admin_portal',
        'finance' => 'finance_portal',
    ];
    return $map[$role] ?? '';
}

/**
 * The active consumer_domain host registered for a given consumer + role
 * portal domain_type (e.g. consumerid for Ehel K-12 + 'admin_portal' ->
 * 'admins.k-12.ehelacademy.org'), or '' if none is configured yet.
 */
function pqh_role_portal_domain(int $consumerid, string $domaintype): string {
    global $DB;
    if ($consumerid <= 0 || $domaintype === '' || !pqh_consumer_schema_ready()) {
        return '';
    }
    $domain = $DB->get_field_select(
        'local_prequran_consumer_domain',
        'domain',
        'consumerid = :consumerid AND domain_type = :domaintype AND status = :status',
        ['consumerid' => $consumerid, 'domaintype' => $domaintype, 'status' => 'active'],
        IGNORE_MULTIPLE
    );
    return pqh_normalize_consumer_host((string)$domain);
}

/**
 * Keep a logged-in user on their role's portal subdomain for the current
 * consumer, on every page that calls this -- not just a one-time redirect
 * at login. Resolves the user's workspace role, looks up the matching
 * role-portal domain for this consumer, and redirects (preserving the exact
 * path and query string) if the current host doesn't already match.
 *
 * Safe no-op when: not a GET request (never interrupts a POST submission),
 * the role has no portal mapping, or the consumer hasn't had that role's
 * domain configured yet (so unprovisioned schools are unaffected).
 */
function pqh_enforce_role_domain(stdClass $consumercontext, int $workspaceid = 0, int $userid = 0): void {
    global $USER;
    if ((string)($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        return;
    }
    $userid = $userid > 0 ? $userid : (int)($USER->id ?? 0);
    if ($userid <= 0) {
        return;
    }
    if ($workspaceid <= 0) {
        $workspaceid = pqh_current_workspace_id($userid);
    }
    if ($workspaceid <= 0) {
        return;
    }
    $role = pqh_user_workspace_role($userid, $workspaceid);
    $domaintype = pqh_role_portal_domain_type($role);
    if ($domaintype === '') {
        return;
    }
    $consumerid = (int)($consumercontext->consumerid ?? 0);
    $roledomain = pqh_role_portal_domain($consumerid, $domaintype);
    if ($roledomain === '') {
        return;
    }
    $currenthost = pqh_request_host();
    if ($currenthost === '' || $currenthost === $roledomain) {
        return;
    }
    $requesturi = (string)($_SERVER['REQUEST_URI'] ?? '');
    if ($requesturi === '') {
        return;
    }
    redirect(new moodle_url('https://' . $roledomain . $requesturi));
}

function pqh_resolve_consumer_context(?string $host = null): stdClass {
    global $DB;
    static $cache = [];

    $normalizedhost = pqh_normalize_consumer_host($host ?? pqh_request_host());
    $cachekey = $normalizedhost !== '' ? $normalizedhost : '__fallback__';
    if (isset($cache[$cachekey])) {
        return clone $cache[$cachekey];
    }

    if (!pqh_consumer_schema_ready()) {
        $cache[$cachekey] = pqh_fallback_consumer_context($normalizedhost);
        return clone $cache[$cachekey];
    }

    $domain = null;
    if ($normalizedhost !== '') {
        $domain = $DB->get_record('local_prequran_consumer_domain', ['domain' => $normalizedhost, 'status' => 'active'], '*', IGNORE_MISSING);
    }
    if ($domain) {
        $consumer = $DB->get_record('local_prequran_consumer', ['id' => (int)$domain->consumerid, 'status' => 'active'], '*', IGNORE_MISSING);
        if ($consumer) {
            $cache[$cachekey] = pqh_consumer_context_from_records($consumer, $domain);
            return clone $cache[$cachekey];
        }
    }

    $cache[$cachekey] = pqh_consumer_context_by_slug('eduplatform');
    $cache[$cachekey]->domain = $normalizedhost !== '' ? $normalizedhost : $cache[$cachekey]->domain;
    $cache[$cachekey]->trusted_domain = false;
    return clone $cache[$cachekey];
}

function pqh_current_consumer_context(): stdClass {
    return pqh_resolve_consumer_context();
}

function pqh_context_is_platform_foundation(?stdClass $context = null): bool {
    $context = $context ?: pqh_current_consumer_context();
    return (string)($context->consumerslug ?? '') === 'eduplatform'
        && (string)($context->consumer_type ?? '') === 'platform_foundation';
}

function pqh_requested_consumer_context(string $param = 'consumer'): stdClass {
    $slug = '';
    if (function_exists('optional_param')) {
        $slug = trim(optional_param($param, '', PARAM_ALPHANUMEXT));
    }
    if ($slug !== '') {
        $current = pqh_current_consumer_context();
        $requested = pqh_consumer_context_by_slug($slug);
        if (!pqh_context_is_platform_foundation($current)) {
            if (!empty($current->trusted_domain) && (int)($requested->consumerid ?? 0) !== (int)($current->consumerid ?? 0)) {
                return $current;
            }
            if (empty($current->trusted_domain) && !is_siteadmin()) {
                return $current;
            }
        }
        return $requested;
    }
    return pqh_current_consumer_context();
}

function pqh_consumer_url(string $path, ?stdClass $context = null, array $params = []): moodle_url {
    $context = $context ?: pqh_current_consumer_context();
    $path = '/' . ltrim($path, '/');
    $domain = pqh_normalize_consumer_host((string)($context->domain ?? ''));
    if ($domain === '') {
        return new moodle_url($path, $params);
    }
    $url = 'https://' . $domain . $path;
    return new moodle_url($url, $params);
}

function pqh_teacher_public_slug(stdClass $teacher): string {
    $application = json_decode((string)($teacher->application_json ?? ''), true);
    $configured = is_array($application) ? trim((string)($application['public_profile_slug'] ?? '')) : '';
    $name = $configured !== '' ? $configured : trim((string)($teacher->teacher_display_name ?? ''));
    if ($name === '') {
        $name = trim((string)($teacher->firstname ?? '') . ' ' . (string)($teacher->lastname ?? ''));
    }
    $name = core_text::strtolower($name);
    $name = preg_replace('/\s+(teacher|tutor|educator|instructor)$/u', '', $name);
    $slug = preg_replace('/[^a-z0-9]+/', '-', (string)$name);
    $slug = trim((string)$slug, '-');
    return $slug !== '' ? $slug : 'teacher-' . max(0, (int)($teacher->userid ?? 0));
}

function pqh_teacher_public_profile_url(stdClass $teacher, ?stdClass $context = null): moodle_url {
    $context = $context ?: pqh_current_consumer_context();
    if (!pqh_consumer_feature_enabled($context, 'teacher_marketplace')) {
        return new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', [
            'teacherid' => (int)($teacher->userid ?? 0),
            'consumer' => (string)($context->consumerslug ?? ''),
        ]);
    }
    $slug = pqh_teacher_public_slug($teacher);
    $domain = pqh_normalize_consumer_host((string)($context->domain ?? ''));
    if ($domain === '') {
        return new moodle_url('/teacher/' . rawurlencode($slug));
    }
    return new moodle_url('https://' . $domain . '/teacher/' . rawurlencode($slug));
}

function pqh_workspace_roles(): array {
    return [
        'owner' => 'Owner',
        'admin' => 'Workspace admin',
        'teacher' => 'Teacher',
        'assistant_teacher' => 'Assistant teacher',
        'coordinator' => 'Coordinator',
        'registrar' => 'Registrar',
        'finance' => 'Finance',
        'support' => 'Support',
        'auditor' => 'Auditor',
        'sponsor' => 'Sponsor',
        'parent' => 'Parent',
        'student' => 'Student',
    ];
}

function pqh_workspace_types(): array {
    return [
        'academy_managed' => 'Academy managed',
        'solo_teacher' => 'Solo teacher',
        'institution' => 'Institution',
        'partner' => 'Partner',
        'masjid' => 'Masjid program',
        'school' => 'School',
    ];
}

function pqh_user_workspaces(int $userid): array {
    global $DB;
    if ($userid <= 0 || !pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    if (pqh_can_manage_academy_operations($userid)) {
        return array_values($DB->get_records_select(
            'local_prequran_workspace',
            "status <> ?",
            ['archived'],
            'name ASC',
            'id,name,slug,workspace_type,ownerid,status,plan_code'
        ));
    }
    $workspaces = [];
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        foreach ($DB->get_records_sql(
            "SELECT w.id, w.name, w.slug, w.workspace_type, w.ownerid, w.status, w.plan_code,
                    wm.workspace_role, wm.status AS member_status
               FROM {local_prequran_workspace} w
               JOIN {local_prequran_workspace_member} wm ON wm.workspaceid = w.id
              WHERE wm.userid = :userid
                AND wm.status = :memberstatus
                AND w.status <> :archived
           ORDER BY w.name ASC",
            ['userid' => $userid, 'memberstatus' => 'active', 'archived' => 'archived']
        ) as $workspace) {
            $workspaces[(int)$workspace->id] = $workspace;
        }
    }
    foreach (pqh_independent_teacher_workspace_ids($userid) as $workspaceid) {
        if (isset($workspaces[$workspaceid])) {
            continue;
        }
        $workspace = $DB->get_record_select(
            'local_prequran_workspace',
            'id = ? AND status <> ?',
            [$workspaceid, 'archived'],
            'id,name,slug,workspace_type,ownerid,status,plan_code',
            IGNORE_MISSING
        );
        if ($workspace) {
            $workspace->workspace_role = 'teacher';
            $workspace->member_status = 'active';
            $workspaces[$workspaceid] = $workspace;
        }
    }
    uasort($workspaces, static function($a, $b): int {
        return strcasecmp((string)($a->name ?? ''), (string)($b->name ?? ''));
    });
    return array_values($workspaces);
}

function pqh_user_workspace_role(int $userid, int $workspaceid): string {
    global $DB;
    if ($userid <= 0 || $workspaceid <= 0) {
        return '';
    }
    if (pqh_can_manage_academy_operations($userid)) {
        return 'platform_admin';
    }
    $roles = [];
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $roles = $DB->get_fieldset_select(
            'local_prequran_workspace_member',
            'workspace_role',
            'userid = ? AND workspaceid = ? AND status = ?',
            [$userid, $workspaceid, 'active']
        );
    }
    $rank = ['owner', 'admin', 'coordinator', 'registrar', 'finance', 'support', 'teacher', 'assistant_teacher', 'auditor', 'sponsor', 'parent', 'student'];
    foreach ($rank as $role) {
        if (in_array($role, $roles, true)) {
            return $role;
        }
    }
    if (in_array($workspaceid, pqh_independent_teacher_workspace_ids($userid), true)) {
        return 'teacher';
    }
    return '';
}

function pqh_user_can_manage_workspace(int $userid, int $workspaceid): bool {
    $role = pqh_user_workspace_role($userid, $workspaceid);
    return in_array($role, ['platform_admin', 'owner', 'admin'], true);
}

function pqh_user_can_teach_in_workspace(int $userid, int $workspaceid): bool {
    if ($workspaceid > 0 && in_array($workspaceid, pqh_independent_teacher_workspace_ids($userid), true)) {
        return true;
    }
    $role = pqh_user_workspace_role($userid, $workspaceid);
    return in_array($role, ['platform_admin', 'owner', 'admin', 'teacher', 'assistant_teacher'], true);
}

/**
 * Clean one segment of a standardized username down to lowercase letters and
 * digits only -- dots are reserved as the separator between segments, so no
 * segment may contain one itself.
 */
function pqh_username_segment(string $value): string {
    $value = core_text::strtolower(trim($value));
    return (string)preg_replace('/[^a-z0-9]+/', '', $value);
}

/**
 * One-letter role tag used in standardized usernames: s=student, t=teacher,
 * p=parent, a=admin.
 */
function pqh_username_role_char(string $accounttype): string {
    $chars = ['student' => 's', 'teacher' => 't', 'parent' => 'p', 'admin' => 'a'];
    return $chars[$accounttype] ?? '';
}

/**
 * Standardized username: schoolslug.<rolechar><accountid> -- e.g.
 * ehelprimary.s32849 for a student, ehelprimary.t10234 for a teacher. The
 * account id is the platform's own already-unique 5-digit "Account No."
 * (user.idnumber), so the result is guaranteed unique by construction -- no
 * collision-retry loop needed. Returns '' if schoolslug or accountid is
 * missing (caller should keep whatever username it already had in that case).
 */
function pqh_generate_standard_username(string $schoolslug, string $accounttype, string $accountid): string {
    $school = pqh_username_segment($schoolslug);
    $account = pqh_username_segment($accountid);
    if ($school === '' || $account === '') {
        return '';
    }
    $role = pqh_username_role_char($accounttype);
    return core_text::substr($school . '.' . $role . $account, 0, 100);
}

/**
 * True if $viewerid and $targetid both hold an active membership row in at
 * least one of the same workspaces -- used to gate profile-photo viewing
 * (staff of a student's/teacher's own workspace, without needing to know
 * which specific workspace up front).
 */
function pqh_user_shares_active_workspace(int $viewerid, int $targetid): bool {
    global $DB;
    if ($viewerid <= 0 || $targetid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return false;
    }
    if ($viewerid === $targetid) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_workspace_member} a
           JOIN {local_prequran_workspace_member} b ON b.workspaceid = a.workspaceid
          WHERE a.userid = :viewerid
            AND a.status = :astatus
            AND b.userid = :targetid
            AND b.status = :bstatus",
        ['viewerid' => $viewerid, 'astatus' => 'active', 'targetid' => $targetid, 'bstatus' => 'active']
    );
}

/**
 * Validate a raw $_FILES[...] entry as a profile photo. Returns null when no
 * file was submitted (a normal, non-error case on these forms), a clean info
 * array when a valid image was uploaded, or throws when something was
 * submitted but isn't usable.
 */
function pqh_uploaded_photo_info(array $upload): ?array {
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ((int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
            || empty($upload['tmp_name']) || !is_uploaded_file((string)$upload['tmp_name'])) {
        throw new Exception('The uploaded photo could not be read. Try again with a JPG, PNG, or WEBP file.');
    }
    $maxbytes = 5 * 1024 * 1024;
    if ((int)($upload['size'] ?? 0) > $maxbytes) {
        throw new Exception('Photo is too large -- the limit is 5 MB.');
    }
    $imageinfo = @getimagesize((string)$upload['tmp_name']);
    $allowed = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    if (!$imageinfo || !isset($allowed[$imageinfo[2]])) {
        throw new Exception('Photo must be a JPG, PNG, or WEBP image.');
    }
    return [
        'tmpname' => (string)$upload['tmp_name'],
        'filename' => 'photo.' . $allowed[$imageinfo[2]],
        'mimetype' => (string)$imageinfo['mime'],
    ];
}

/**
 * Store a validated profile photo (see pqh_uploaded_photo_info) under the
 * shared local_hubredirect file areas, replacing any existing photo for the
 * same $itemid. $filearea is one of 'student_photo' / 'teacher_photo'.
 */
function pqh_store_profile_photo(string $filearea, int $itemid, array $upload, int $actorid): stored_file {
    $context = context_system::instance();
    $fs = get_file_storage();
    $fs->delete_area_files($context->id, 'local_hubredirect', $filearea, $itemid);
    return $fs->create_file_from_pathname([
        'contextid' => $context->id,
        'component' => 'local_hubredirect',
        'filearea' => $filearea,
        'itemid' => $itemid,
        'filepath' => '/',
        'filename' => (string)$upload['filename'],
        'mimetype' => (string)$upload['mimetype'],
        'userid' => $actorid,
    ], (string)$upload['tmpname']);
}

/**
 * Public URL for a stored profile photo, or '' if none has been uploaded.
 */
function pqh_profile_photo_url(string $filearea, int $itemid): string {
    if ($itemid <= 0) {
        return '';
    }
    $context = context_system::instance();
    $fs = get_file_storage();
    foreach ($fs->get_area_files($context->id, 'local_hubredirect', $filearea, $itemid, 'filename', false) as $file) {
        return moodle_url::make_pluginfile_url(
            $context->id, 'local_hubredirect', $filearea, $itemid, '/', $file->get_filename(), false
        )->out(false);
    }
    return '';
}

function pqh_user_can_create_live_sessions(int $userid, int $workspaceid = 0): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (is_siteadmin($userid) || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if ($workspaceid > 0 && pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = :userid
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        ['userid' => $userid]
    );
}

function pqh_workspace_role_default_caps(string $role): array {
    $defaults = [
        'platform_admin' => ['*'],
        'owner' => ['*'],
        'admin' => ['*'],
        'coordinator' => ['admissions.manage', 'registrar.manage', 'teacher.manage', 'support.manage', 'student.view', 'parent.view', 'documents.view'],
        'registrar' => ['admissions.manage', 'registrar.manage', 'documents.manage', 'transcripts.manage', 'student.view'],
        'finance' => ['finance.manage', 'invoices.manage', 'payments.manage', 'payment_plans.view', 'sponsor.view'],
        'support' => ['support.manage', 'support.impersonate.request', 'student.view', 'parent.view', 'tenant.audit.view'],
        'teacher' => ['teacher.portal', 'attendance.manage', 'grades.manage', 'notes.manage', 'student.view'],
        'assistant_teacher' => ['teacher.portal', 'attendance.manage', 'notes.manage', 'student.view'],
        'auditor' => ['tenant.audit.view', 'documents.view', 'student.view'],
        'sponsor' => ['sponsor.portal', 'invoices.view', 'payments.view', 'payment_plans.view'],
        'parent' => ['parent.portal', 'student.view', 'invoices.view', 'payments.view', 'attendance.view', 'grades.view', 'documents.view'],
        'student' => ['student.portal', 'courses.view', 'attendance.view', 'grades.view', 'transcripts.view', 'documents.view'],
    ];
    return $defaults[$role] ?? [];
}

function pqh_user_has_workspace_capability(int $userid, int $workspaceid, string $capability): bool {
    global $DB;

    if ($workspaceid > 0 && in_array($workspaceid, pqh_independent_teacher_workspace_ids($userid), true)) {
        $teachercaps = pqh_workspace_role_default_caps('teacher');
        if (in_array('*', $teachercaps, true) || in_array($capability, $teachercaps, true)) {
            return true;
        }
    }
    $role = pqh_user_workspace_role($userid, $workspaceid);
    if ($role === '') {
        return false;
    }
    if (pqh_table_exists_safe('local_prequran_role_cap')) {
        $explicit = $DB->get_record('local_prequran_role_cap', [
            'workspaceid' => $workspaceid,
            'rolekey' => $role,
            'capability' => $capability,
        ], 'id,allowed', IGNORE_MULTIPLE);
        if ($explicit) {
            return (int)$explicit->allowed === 1;
        }
        $global = $DB->get_record('local_prequran_role_cap', [
            'workspaceid' => 0,
            'rolekey' => $role,
            'capability' => $capability,
        ], 'id,allowed', IGNORE_MULTIPLE);
        if ($global) {
            return (int)$global->allowed === 1;
        }
    }
    $caps = pqh_workspace_role_default_caps($role);
    return in_array('*', $caps, true) || in_array($capability, $caps, true);
}

function pqh_user_allowed_workspace_ids(int $userid, string $capability): array {
    if ($userid <= 0) {
        return [];
    }
    $ids = [];
    $teachercaps = pqh_workspace_role_default_caps('teacher');
    if (in_array('*', $teachercaps, true) || in_array($capability, $teachercaps, true)) {
        foreach (pqh_independent_teacher_workspace_ids($userid) as $workspaceid) {
            $ids[] = $workspaceid;
        }
    }
    foreach (pqh_user_workspaces($userid) as $workspace) {
        $workspaceid = (int)($workspace->id ?? 0);
        if ($workspaceid > 0 && pqh_user_has_workspace_capability($userid, $workspaceid, $capability)) {
            $ids[] = $workspaceid;
        }
    }
    return array_values(array_unique($ids));
}

function pqh_consumer_context_workspace_ids(?stdClass $context = null): array {
    global $DB;
    $context = $context ?: pqh_current_consumer_context();
    $ids = [];
    $workspaceid = (int)($context->workspaceid ?? 0);
    if ($workspaceid > 0) {
        $ids[$workspaceid] = true;
    }
    $consumerid = (int)($context->consumerid ?? 0);
    if ($consumerid > 0 && pqh_consumer_schema_ready()) {
        try {
            $rows = $DB->get_fieldset_select(
                'local_prequran_consumer_domain',
                'workspaceid',
                'consumerid = ? AND workspaceid > ? AND status = ?',
                [$consumerid, 0, 'active']
            );
            foreach ($rows as $id) {
                $ids[(int)$id] = true;
            }
            $primary = (int)$DB->get_field('local_prequran_consumer', 'primaryworkspaceid', ['id' => $consumerid], IGNORE_MISSING);
            if ($primary > 0) {
                $ids[$primary] = true;
            }
        } catch (Throwable $e) {
            // Fall back to the workspace already resolved from the trusted domain.
        }
    }
    return array_keys($ids);
}

function pqh_consumer_context_allows_workspace(?stdClass $context, int $workspaceid): bool {
    if ($workspaceid <= 0) {
        return false;
    }
    $context = $context ?: pqh_current_consumer_context();
    if (pqh_context_is_platform_foundation($context)) {
        return true;
    }
    if (empty($context->trusted_domain) && (int)($context->consumerid ?? 0) <= 0) {
        return true;
    }
    return in_array($workspaceid, pqh_consumer_context_workspace_ids($context), true);
}

function pqh_user_belongs_to_consumer_context(int $userid, ?stdClass $context = null): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    $context = $context ?: pqh_current_consumer_context();
    if (pqh_context_is_platform_foundation($context)) {
        return true;
    }
    $workspaceids = pqh_consumer_context_workspace_ids($context);
    if (!$workspaceids) {
        return empty($context->trusted_domain);
    }
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'ctxworkspace');
        $params['userid'] = $userid;
        $params['status'] = 'active';
        if ($DB->record_exists_select(
            'local_prequran_workspace_member',
            "userid = :userid AND status = :status AND workspaceid {$insql}",
            $params
        )) {
            return true;
        }
    }
    foreach (['local_prequran_student_profile', 'local_prequran_teacher_profile'] as $table) {
        if (pqh_table_exists_safe($table) && pqh_table_has_field_safe($table, 'workspaceid')) {
            [$insql, $params] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'profileworkspace');
            $params['userid'] = $userid;
            if ($DB->record_exists_select($table, "userid = :userid AND workspaceid {$insql}", $params)) {
                return true;
            }
        }
    }
    return false;
}

function pqh_record_belongs_to_consumer_context($record, ?stdClass $context = null, string $workspacefield = 'workspaceid'): bool {
    $workspaceid = (int)($record->{$workspacefield} ?? 0);
    if ($workspaceid > 0) {
        return pqh_consumer_context_allows_workspace($context, $workspaceid);
    }
    $context = $context ?: pqh_current_consumer_context();
    return pqh_context_is_platform_foundation($context) || empty($context->trusted_domain);
}

function pqh_current_workspace_id(int $userid, int $requestedid = 0): int {
    global $SESSION;
    $workspaces = pqh_user_workspaces($userid);
    if (!$workspaces) {
        foreach (pqh_independent_teacher_workspace_ids($userid) as $workspaceid) {
            if ($workspaceid > 0) {
                $SESSION->local_prequran_workspaceid = $workspaceid;
                return $workspaceid;
            }
        }
        $fallback = pqh_can_manage_academy_operations($userid) ? pqh_default_workspace_id() : 0;
        return pqh_consumer_context_allows_workspace(null, $fallback) ? $fallback : 0;
    }
    $consumercontext = pqh_current_consumer_context();
    $allowed = [];
    foreach ($workspaces as $workspace) {
        $id = (int)$workspace->id;
        $issoloteacherworkspace = (string)($workspace->workspace_type ?? '') === 'solo_teacher'
            && pqh_has_independent_teacher_profile($userid)
            && pqh_user_workspace_role($userid, $id) === 'teacher';
        if (pqh_consumer_context_allows_workspace($consumercontext, $id) || $issoloteacherworkspace) {
            $allowed[$id] = true;
        }
    }
    if (!$allowed) {
        foreach (pqh_independent_teacher_workspace_ids($userid) as $workspaceid) {
            if ($workspaceid > 0) {
                $allowed[$workspaceid] = true;
            }
        }
    }
    if (!$allowed) {
        return 0;
    }
    if ($requestedid > 0 && isset($allowed[$requestedid])) {
        $SESSION->local_prequran_workspaceid = $requestedid;
        return $requestedid;
    }
    $sessionid = (int)($SESSION->local_prequran_workspaceid ?? 0);
    if ($sessionid > 0 && isset($allowed[$sessionid])) {
        return $sessionid;
    }
    $first = (int)array_key_first($allowed);
    $SESSION->local_prequran_workspaceid = $first;
    return $first;
}

function pqh_workspace_header_css(?int $workspaceid = null): string {
    $workspaceid = $workspaceid ?? optional_param('workspaceid', 0, PARAM_INT);
    if ($workspaceid <= 0) {
        $workspaceid = optional_param('consumer_workspaceid', 0, PARAM_INT);
    }
    $consumer = $workspaceid > 0 ? pqh_consumer_context_by_workspace($workspaceid) : pqh_requested_consumer_context();
    $theme = pqh_consumer_theme($consumer);
    $primary = (string)$theme['primary_color'];
    $accent = (string)$theme['accent_color'];
    $surface = (string)$theme['surface_color'];
    $dashboardheader = (string)$theme['dashboard_header_bg'];
    $dashboardtext = (string)$theme['dashboard_header_text'];
    $pagebody = (string)$theme['page_body_bg'];
    $reportheader = (string)$theme['report_header_bg'];
    $reportheadertext = (string)$theme['report_header_text'];
    $reportbody = (string)$theme['report_body_bg'];
    return <<<CSS
:root{--pqh-brand-primary:{$primary};--pqh-brand-accent:{$accent};--pqh-brand-surface:{$surface};--pqh-dashboard-header-bg:{$dashboardheader};--pqh-dashboard-header-text:{$dashboardtext};--pqh-page-body-bg:{$pagebody};--pqh-report-header-bg:{$reportheader};--pqh-report-header-text:{$reportheadertext};--pqh-report-body-bg:{$reportbody}}
body{background:var(--pqh-page-body-bg)!important}
.pqh-workspace-top{position:relative;overflow:hidden;grid-template-columns:minmax(0,1fr) auto!important;padding:22px 24px!important;border-color:rgba(105,76,45,.14)!important;border-radius:16px!important;background:linear-gradient(135deg,var(--pqh-dashboard-header-bg) 0%,var(--pqh-brand-surface) 62%,#fff 100%)!important;box-shadow:0 16px 38px rgba(105,76,45,.08)!important}
.pqh-workspace-title{display:flex!important;align-items:center!important;gap:14px!important;margin:0!important;color:var(--pqh-dashboard-header-text)!important;font-size:30px!important;font-weight:950!important;line-height:1.08!important;letter-spacing:0!important;text-shadow:0 1px 1px rgba(0,0,0,.12)}
.pqh-brand-mark{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:var(--pqh-brand-primary);color:#fff;font-size:16px;font-weight:950;letter-spacing:.2px;overflow:hidden}
.pqh-brand-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqh-workspace-sub{margin:7px 0 0!important;color:var(--pqh-dashboard-header-text)!important;font-size:14px!important;font-weight:850!important;opacity:.9}
.pqh-workspace-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:9px!important;flex-wrap:wrap!important}
.pqh-workspace-actions a,.pqh-workspace-actions button{min-height:40px!important;padding:0 14px!important;border-radius:10px!important;border:1px solid rgba(23,48,68,.12)!important;background:var(--pqh-brand-surface)!important;color:#173044!important;text-decoration:none!important;font-size:13px!important;font-weight:950!important;box-shadow:0 2px 0 rgba(23,48,68,.04)!important;cursor:pointer!important}
.pqh-workspace-actions a:hover,.pqh-workspace-actions button:hover{background:#fff!important;border-color:var(--pqh-brand-primary)!important}
.pqh-workspace-actions a.pqh-live-guide-link,.pqh-live-guide-link,.pqh-workspace-actions a.pqh-live-template-link,.pqh-live-template-link{background:var(--pqh-brand-accent)!important;border-color:var(--pqh-brand-accent)!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-live-guide-link:hover,.pqh-live-guide-link:hover,.pqh-workspace-actions a.pqh-live-template-link:hover,.pqh-live-template-link:hover{background:#fff!important;border-color:var(--pqh-brand-accent)!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-workspace-logout{background:var(--pqh-brand-accent)!important;border-color:var(--pqh-brand-accent)!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-workspace-logout:hover{background:#fff!important;border-color:var(--pqh-brand-accent)!important}
.pqh-workspace-actions select{min-height:40px!important;border-radius:10px!important;border:1px solid rgba(23,48,68,.18)!important;background:#fff!important;color:#173044!important;font-size:13px!important;font-weight:900!important}
.pqh-report-header,.pqh-report-title,.pqirb-table thead,.pqw-table thead,.pqh-table thead{background:var(--pqh-report-header-bg)!important;color:var(--pqh-report-header-text)!important}
.pqh-report-body,.pqh-report-card,.pqirb-card,.pqw-panel,.pqh-panel{background:var(--pqh-report-body-bg)!important}
@media(max-width:760px){.pqh-workspace-top{grid-template-columns:1fr!important;padding:18px!important}.pqh-brand-mark{width:38px;height:38px}.pqh-workspace-actions{justify-content:flex-start!important}.pqh-workspace-actions a,.pqh-workspace-actions button,.pqh-workspace-actions select{width:auto;max-width:100%}}
CSS;
}

function pqh_dashboard_header_css(?int $workspaceid = null): string {
    return pqh_workspace_header_css($workspaceid);
}

/**
 * Shared EduPlatform design-system layer (2026-07-19). Appended at the end of
 * a page's style block, scoped to its shell class, it converts the legacy
 * look to the blue token system: light page, blue gradient header band,
 * ghost buttons, white hairline panels, tint pills. Generic attribute
 * selectors cover per-page class prefixes; unmatched rules are no-ops.
 */
function pqh_design_system_css(string $scope): string {
    return <<<CSS
/* ---- EduPlatform design system layer (shared) ---- */
{$scope}{--pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;--pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#fff;--pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;--pqh-primary-ink:#17498f;background:var(--pqh-bg)!important;color:var(--pqh-ink)}
{$scope} .pqh-workspace-top{background:linear-gradient(120deg,#d7e6f9 0%,#e9f1fc 60%,#f3f8fe 100%)!important;border:1px solid #c5d9f1!important;box-shadow:none!important;border-radius:14px!important}
{$scope} .pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
{$scope} .pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
{$scope} .pqh-workspace-actions a,{$scope} .pqh-workspace-actions button,{$scope} [class*="-btn"]{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
{$scope} .pqh-workspace-actions a:hover,{$scope} .pqh-workspace-actions button:hover,{$scope} [class*="-btn"]:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
{$scope} [class*="--start"],{$scope} [class*="--primary"],{$scope} button[type="submit"][class*="-btn"]{background:var(--pqh-primary)!important;border-color:var(--pqh-primary)!important;color:#fff!important}
{$scope} [class*="--danger"]{background:#c0392b!important;border-color:#c0392b!important;color:#fff!important}
{$scope} .pqh-workspace-actions a.pqh-workspace-logout{background:var(--pqh-ink)!important;border-color:var(--pqh-ink)!important;color:#fff!important}
{$scope} [class*="-panel"],{$scope} [class*="-card"],{$scope} [class*="-box"],{$scope} [class*="-group"]{background:var(--pqh-surface);border-color:var(--pqh-line)!important;border-radius:14px}
{$scope} [class*="-pill"],{$scope} [class*="-status"]{background:var(--pqh-tint)!important;color:var(--pqh-primary-ink)!important;border-radius:8px!important;font-weight:650!important;border-color:var(--pqh-tint-2)!important}
{$scope} [class*="-input"],{$scope} [class*="-select"]{border:1px solid var(--pqh-line)!important;border-radius:10px!important;background:var(--pqh-surface)!important;color:var(--pqh-ink)!important;font-weight:550!important}
{$scope} [class*="-fill"]{background:var(--pqh-primary)!important}
{$scope} [class*="-empty"]{background:var(--pqh-surface)!important;border:1px dashed var(--pqh-line)!important;border-radius:14px!important;color:var(--pqh-muted)!important;font-weight:550!important}
{$scope} h1,{$scope} h2,{$scope} h3{color:var(--pqh-ink)}
{$scope} th{color:var(--pqh-faint)!important;font-weight:700!important}
CSS;
}

/**
 * Standard application shell styles per the approved prototype
 * (deliverables/design/eduplatform-ui/prototype.html): wide labeled
 * sidebar, expanded by default and collapsible to icons, plus a white
 * blurred 60px top bar carrying the page title. Scoped to a page's
 * shell class. Pair with pqh_design_shell_html().
 */
function pqh_design_shell_css(string $scope): string {
    return <<<CSS
/* ---- standard shell: labeled sidebar + white top bar (prototype) ---- */
{$scope}{padding:0 0 54px 248px!important;transition:padding .18s ease}
{$scope}.pqh-rail-min{padding-left:72px!important}
{$scope}>[class*="-wrap"]{padding:24px 24px 0;max-width:1440px}
.pqh-gnav{position:fixed;left:0;top:0;bottom:0;width:248px;z-index:80;display:flex;flex-direction:column;gap:2px;padding:14px 10px;background:none;border-right:1px solid #e4e9ef;overflow-y:auto;transition:width .18s ease}
{$scope}.pqh-rail-min .pqh-gnav{width:72px}
.pqh-gnav__brand{display:flex;align-items:center;gap:10px;padding:4px 8px 14px;text-decoration:none!important;background:transparent!important;border:0}
.pqh-gnav__mark{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(115deg,#2166d1,#4d8be0);color:#fff!important;font:800 14px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;box-shadow:0 6px 14px -6px rgba(33,102,209,.5);overflow:hidden}
.pqh-gnav__mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqh-gnav__mark--img{width:58px;height:58px;background:#fff;box-shadow:none;padding:3px}
.pqh-gnav__mark--img img{object-fit:contain}
.pqh-gnav__name{font:800 15px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#0f2237;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pqh-gnav__item{display:flex;flex-direction:row;align-items:center;gap:11px;padding:9px 10px;border:0;border-radius:9px;background:#f4f6f9!important;color:#5b6b7c!important;font:600 13px/1.3 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-align:left;white-space:nowrap;width:100%;text-decoration:none!important;cursor:pointer;box-shadow:none!important}
.pqh-gnav__item svg{flex:0 0 auto;width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pqh-gnav__item:hover{background:#edf3fc!important;color:#17498f!important;text-decoration:none!important}
.pqh-gnav__item.is-active{background:#edf3fc!important;color:#2166d1!important;font-weight:700}
.pqh-gnav__spacer{flex:1}
.pqh-gnav__foot{margin-top:auto;border-top:1px solid #e4e9ef;padding-top:8px;display:flex;flex-direction:column;gap:2px}
.pqh-gnav__foot .pqh-gnav__item{color:#8494a5!important}
{$scope}.pqh-rail-min .pqh-gnav__label,{$scope}.pqh-rail-min .pqh-gnav__name{display:none}
{$scope}.pqh-rail-min .pqh-gnav__item{justify-content:center;padding:11px 0}
{$scope}.pqh-rail-min .pqh-gnav__brand{justify-content:center;padding-left:0;padding-right:0}
.pqh-appbar{position:sticky;top:0;z-index:70;display:flex;align-items:center;gap:12px;height:60px;padding:0 22px;background:rgba(255,255,255,.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid #e4e9ef;box-shadow:none}
.pqh-appbar__brand{display:flex;align-items:center;gap:10px;color:#0f2237;font-size:16px;font-weight:750;letter-spacing:-.01em;margin-right:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pqh-appbar__brand-icon{width:22px;height:22px;stroke:#2166d1;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
.pqh-appbar__mark{display:none}
.pqh-appbar__nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.pqh-appbar__nav a,.pqh-appbar__nav button{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:1px solid transparent!important;border-radius:9px;background:transparent!important;color:#5b6b7c!important;font-size:13.5px;font-weight:650!important;text-decoration:none!important;cursor:pointer;box-shadow:none!important}
.pqh-appbar__nav a:hover,.pqh-appbar__nav button:hover{background:#edf3fc!important;color:#17498f!important}
.pqh-appbar__nav .pqh-appbar__logout{background:#2166d1!important;color:#fff!important;font-weight:700!important;box-shadow:0 6px 14px -8px rgba(33,102,209,.55)!important}
.pqh-appbar__nav .pqh-appbar__logout:hover{background:#17498f!important;color:#fff!important}
.pqh-appbar__nav a.pqh-appbar__icon{padding:0;width:36px;justify-content:center}
.pqh-appbar__nav a.pqh-appbar__icon svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
@media(max-width:900px){{$scope},{$scope}.pqh-rail-min{padding-left:0!important}.pqh-gnav{display:none}.pqh-appbar{height:auto;min-height:60px;padding:8px 14px;flex-wrap:wrap}}
CSS;
}

/**
 * Duolingo-styled chrome: the left rail, its links and the top bar. Scoped to a
 * page's shell class, so it reaches only the pages that ask for it.
 *
 * This says nothing about WHO gets it -- that is pqh_viewer_chrome_css()'s job,
 * and since 2026-08-28 the answer is students and staff alike, parents aside.
 * The name is still "duolingo" rather than "learner" because the sheet is a
 * look, not an audience; it was drawn for a seven-year-old and it is now also
 * what a site admin sees on the finance pages, which is a decision recorded at
 * the gate rather than a property of these rules.
 *
 * THIS MUST BE EMITTED AFTER pqh_openproject_skin_css(). That generator paints
 * the rail and the app bar with doubled-class selectors carrying !important
 * (.pqh-gnav__item.pqh-gnav__item{...!important}), so a later stylesheet is the
 * only thing that can win. Every selector here is written to match or beat that
 * (0,2,0) / (0,3,0) shape -- `{$scope} .pqh-gnav__item` is (0,2,0) and later,
 * `{$scope} .pqh-gnav__item.is-active` is (0,3,0) and later -- which is why the
 * scope prefix is not decoration and must not be dropped.
 *
 * What "Duolingo" means here, concretely: white chrome held together by 2px
 * grey rules rather than fills; nav rows as uppercase bold labels beside big
 * chunky icons, each icon in its own colour; the active row a soft blue chip
 * with a blue outline; and buttons that carry a solid bottom edge and press
 * into it on :active instead of moving a shadow.
 *
 * Layout is left alone wherever the collapsed rail depends on it -- the 248px
 * width, the 72px collapsed width and the fixed positioning all still come from
 * pqh_design_shell_css(). The one geometry this does change (row padding) is
 * restated for .pqh-rail-min below, because forcing it here would otherwise
 * beat that rule and leave the collapsed icons off-centre.
 */
function pqh_duolingo_chrome_css(string $scope): string {
    return <<<CSS
/* ---- Duolingo-styled rail + top bar ---- */
{$scope}{--duo-green:#58cc02;--duo-green-dark:#58a700;--duo-blue:#1cb0f6;--duo-blue-dark:#1899d6;--duo-blue-soft:#ddf4ff;--duo-blue-line:#84d8ff;--duo-line:#e5e5e5;--duo-line-deep:#d6d6d6;--duo-ink:#4b4b4b;--duo-muted:#afafaf;--duo-wash:#f7f7f7;--duo-red:#ff4b4b;--duo-orange:#ff9600;--duo-purple:#ce82ff;--duo-gold:#ffc800;--duo-header:#235390;--duo-header-line:#1b4272;--duo-header-ink:#fff;--duo-header-ink-soft:rgba(255,255,255,.72);--duo-header-hover:rgba(255,255,255,.10);--duo-on-dark-green:#89e219;--duo-on-dark-red:#ff8080;--duo-chip-ink:#0a6fa8;--duo-pill:rgba(255,255,255,.16);--duo-pill-line:rgba(255,255,255,.34);--duo-pill-hover:rgba(255,255,255,.20);--duo-pill-hover-line:rgba(255,255,255,.48);--duo-on-bright:#0f2237}

/* the rail: white, held by a 2px rule, nothing filled until you touch it */
/* THE RAIL IS THE HEADER'S OTHER HALF. It was white beside a #235390 bar, which
   read as chrome on one edge and blank on the other; the two now make one block.
   Everything below re-inks the rail for a dark field, and every value in it was
   MEASURED rather than picked -- on #235390 the old label #4b4b4b is 1.13:1
   (invisible), the foot's #afafaf is 3.53:1 and the brand's #58cc02 is 3.71:1,
   all failing. White labels are 7.74:1 and 72% white is 4.89:1. */
{$scope} .pqh-gnav{background:var(--duo-header)!important;border-right:2px solid var(--duo-header-line)!important;gap:4px}
{$scope} .pqh-gnav__brand{padding:6px 8px 16px}
{$scope} .pqh-gnav__mark{border-radius:16px!important;background:var(--duo-green)!important;color:#fff!important;font-size:15px!important;font-weight:800!important;letter-spacing:.04em!important;box-shadow:0 4px 0 var(--duo-green-dark)!important}
{$scope} .pqh-gnav__mark--img{background:#fff!important;box-shadow:0 0 0 2px var(--duo-header-line)!important}
/* #58cc02 is 3.71:1 here and fails as text; Duolingo's lighter green is 4.78:1 */
{$scope} .pqh-gnav__name{color:var(--duo-on-dark-green)!important;font-size:15px!important;font-weight:800!important;letter-spacing:.01em!important}

/* A nav row is a label, not a chip. Uppercase at 12.5px with the icon stepped
   up to 26px and the stroke to 2.4 is what makes it read as Duolingo rather
   than as the same row in a different colour. */
{$scope} .pqh-gnav__item{box-sizing:border-box;gap:12px;min-height:48px;padding:0 12px!important;border:2px solid transparent!important;border-radius:14px!important;background:transparent!important;color:var(--duo-header-ink)!important;font-size:12.5px!important;font-weight:800!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:none!important;transition:background .12s ease,border-color .12s ease,color .12s ease}
{$scope} .pqh-gnav__item svg{width:26px;height:26px;stroke-width:2.4}
{$scope} .pqh-gnav__item:hover{background:var(--duo-header-hover)!important;color:var(--duo-header-ink)!important}
{$scope} .pqh-gnav__item.is-active{background:var(--duo-blue-soft)!important;border-color:var(--duo-blue-line)!important;color:var(--duo-chip-ink)!important}

/* One colour per destination, the way Duolingo colours LEARN / LEAGUES / SHOP.
   Keyed on position rather than on a name because the rail's contents differ by
   role and by page -- any row landing on any of these colours is correct, and a
   rail longer than the cycle simply repeats it. nth-child counts the brand link
   as 1, so the first nav row is 2. */
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(2) svg{color:var(--duo-green)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(3) svg{color:var(--duo-blue)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(4) svg{color:var(--duo-orange)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(5) svg{color:var(--duo-purple)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(6) svg{color:var(--duo-gold)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(7) svg{color:var(--duo-on-dark-red)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(8) svg{color:var(--duo-green)}
{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(9) svg{color:var(--duo-blue)}
/* !important because the nth-child rules above are (0,4,1) and this is (0,3,1) */
{$scope} .pqh-gnav__item.is-active svg{color:var(--duo-chip-ink)!important}

{$scope} .pqh-gnav__foot{border-top:2px solid var(--duo-header-line)!important;padding-top:10px}
{$scope} .pqh-gnav__foot .pqh-gnav__item{color:var(--duo-header-ink-soft)!important}
{$scope} .pqh-gnav__foot .pqh-gnav__item svg{color:var(--duo-header-ink-soft)}
{$scope} .pqh-gnav__foot .pqh-gnav__item:hover{background:var(--duo-header-hover)!important;color:var(--duo-header-ink)!important}
/* Logout is the only destructive row here, so it is the only one that goes red.
   Collapse sits beside it and must not. */
{$scope} .pqh-gnav__foot a.pqh-gnav__item:hover{color:var(--duo-on-dark-red)!important}
{$scope} .pqh-gnav__foot a.pqh-gnav__item:hover svg{color:var(--duo-on-dark-red)}

/* Collapsed rail: restate the centring, because the padding above would
   otherwise beat pqh_design_shell_css()'s own .pqh-rail-min rule. */
{$scope}.pqh-rail-min .pqh-gnav__item{justify-content:center;padding:0!important}
{$scope}.pqh-rail-min .pqh-gnav__item svg{width:28px;height:28px}

/* The top bar: white, the same 2px rule, no blur and no navy.
   The selector is doubled to (0,4,0) for ONE declaration's sake. The skin
   writes `.X-shell:has(.pqh-appbar) .pqh-appbar{border-bottom-width:0!important}`
   -- doubled by its own generator to (0,4,0) -- so that a navy app bar and a
   navy page header read as one block with no seam between them. A plain
   `{$scope} .pqh-appbar` is (0,2,0) and loses that one property while winning
   every other, which shows up as a white bar with no bottom rule at all. The
   seam rule has nothing left to close here: the bar is no longer navy, and this
   page draws no header block under it. */
{$scope}{$scope} .pqh-appbar.pqh-appbar{height:auto;min-height:66px;background:var(--duo-header)!important;background-image:none!important;border-bottom:2px solid var(--duo-header-line)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important}
{$scope} .pqh-appbar__brand{color:var(--duo-header-ink)!important;font-weight:800!important}
{$scope} .pqh-appbar__brand-icon{stroke:var(--duo-header-ink)!important}

/* THE BAR IS ONLY HALF THE HEADER on the pages that draw a <prefix>-top block.
   student_workplace and live_schedule both carry `class="X-top pqh-workspace-top"`,
   the skin paints it #162b48 with white ink, and its own :has(.pqh-appbar) rule
   pulls it flush against the bar with no radius and no seam -- the two are meant
   to read as ONE header. Leaving the bar white therefore did not produce a white
   header; it produced a blank strip sitting on a navy slab.
   Painting the block the same #235390 puts the two halves back together. The ink
   is deliberately NOT touched: white on #235390 is 7.7:1, so every heading, sub,
   kicker and ghost button the skin already styles stays exactly as it is. That is
   the whole reason for choosing a dark brand blue over a light tint -- a tint
   would have meant re-inking all of it, and one missed selector is white text on
   pale blue. Targets .pqh-workspace-top rather than each page's own prefix,
   because both student pages carry it and it needs no per-page rule. */
{$scope} .pqh-workspace-top{background:var(--duo-header)!important;border-color:var(--duo-header)!important}
{$scope} .pqh-appbar__nav{gap:8px}
/* The solid bottom edge is the whole trick: a 2px border plus a 0 2px 0 shadow
   reads as a physical key, and :active drops the button onto it. */
/* The pills were solid white on a #235390 bar -- the last white thing left in
   the chrome. They take a translucent white fill instead, which is what this
   design already does on a dark field (the rail's own hover, and the skin's
   ghost buttons on its navy bar), so they read as raised surfaces cut from the
   header rather than as objects dropped on it.
   .16 is not a taste call: white on that fill is 5.18:1 and the fill is 1.50:1
   against the header, so it is visibly a button. .24 would be a bolder fill and
   drops the label to 4.30:1, which fails -- the ceiling here is set by the text,
   not by the look. */
{$scope} .pqh-appbar__nav a,{$scope} .pqh-appbar__nav button{box-sizing:border-box;min-height:42px;padding:0 16px!important;border:2px solid var(--duo-pill-line)!important;border-radius:14px!important;background:var(--duo-pill)!important;color:var(--duo-header-ink)!important;font-size:12.5px!important;font-weight:800!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 2px 0 rgba(0,0,0,.20)!important;transition:background .1s ease,border-color .1s ease,color .1s ease,transform .06s ease,box-shadow .06s ease}
{$scope} .pqh-appbar__nav a:hover,{$scope} .pqh-appbar__nav button:hover{background:var(--duo-pill-hover)!important;border-color:var(--duo-pill-hover-line)!important;color:var(--duo-header-ink)!important}
{$scope} .pqh-appbar__nav a:active,{$scope} .pqh-appbar__nav button:active{transform:translateY(2px);box-shadow:none!important}
{$scope} .pqh-appbar__nav a:focus-visible,{$scope} .pqh-appbar__nav button:focus-visible{outline:3px solid var(--duo-blue-line);outline-offset:2px}
{$scope} .pqh-appbar__nav a.pqh-appbar__icon{width:42px;padding:0!important}
{$scope} .pqh-appbar__nav a.pqh-appbar__icon svg{width:20px;height:20px;stroke-width:2.4}
/* Logout keeps the emphasis it already had -- it is still the one filled button
   in the bar -- but takes Duolingo's blue rather than its green, so a solid
   pill can never be confused with "go". The active row's blue is a soft #ddf4ff
   fill with blue text, which does not collide with a solid #1cb0f6 pill. */
{$scope} .pqh-appbar__nav .pqh-appbar__logout{background:var(--duo-blue)!important;border-color:var(--duo-blue)!important;color:var(--duo-on-bright)!important;box-shadow:0 4px 0 var(--duo-blue-dark)!important}
{$scope} .pqh-appbar__nav .pqh-appbar__logout:hover{background:#3fbdf8!important;border-color:#3fbdf8!important;color:var(--duo-on-bright)!important}
{$scope} .pqh-appbar__nav .pqh-appbar__logout:active{transform:translateY(4px);box-shadow:none!important}

@media(max-width:900px){{$scope}{$scope} .pqh-appbar.pqh-appbar{min-height:60px}}
@media(prefers-reduced-motion:reduce){{$scope} .pqh-gnav__item,{$scope} .pqh-appbar__nav a,{$scope} .pqh-appbar__nav button{transition:none}{$scope} .pqh-appbar__nav a:active,{$scope} .pqh-appbar__nav button:active{transform:none}}
CSS;
}

/**
 * The chrome a VIEWER gets, chosen by who is reading rather than by page.
 *
 * Every page that draws this shell draws the same rail and top bar, and most of
 * them serve more than one kind of viewer -- a student sitting an exam and the
 * teacher who set it meet the same seb_exam.php. Gating on the filename would
 * mean hand-keeping a list of "student pages" beside a shell that already knows
 * who is looking, and this repo has the worked example of what that costs: the
 * tutoring topbar picker kept exactly such a table and it drifted in BOTH
 * directions within a day -- a section that rendered and could not be picked,
 * and a section it offered that had nothing behind it. So the question asked
 * here is "who is reading this", never "which file am I in".
 *
 * That is also what makes the call safe to put on every page that draws the
 * shell, which is the point rather than a side effect. Over-inclusion emits an
 * empty string and costs nothing; omitting a page a student can actually reach
 * is invisible until a child lands on it, and no gate in this repo would say so.
 *
 * Echo it AFTER pqh_openproject_skin_css(), for the reason set out above
 * pqh_duolingo_chrome_css().
 *
 * IT NOW GATES NOTHING, AND THAT IS DELIBERATE. The owner widened it twice in
 * one day: students only, then staff as well (2026-08-28), then parents too --
 * which is every kind pqh_shell_viewer_kind() can return, so the test is gone
 * and every page that calls this gets the chrome.
 *
 * Two consequences of the widening, both accepted rather than overlooked.
 * 'staff' is ONE bucket -- teachers, assistant teachers, workspace admins,
 * owners, managers, site admins and principals -- with no teacher kind inside
 * it, so the finance, compliance, governance and executive-reporting pages
 * those same people reach (admin_workspace, workspace_reports, at_risk_report,
 * managed_reports, safenet, the trust pages) render in a chrome drawn for a
 * seven-year-old. A narrower gate on pqh_has_teacher_profile() was offered and
 * declined. Parents then followed, so the family-facing dashboard and live
 * schedule match.
 *
 * THE FUNCTION IS KEPT rather than deleted, and the call sites are left alone.
 * It is now a pass-through, which is normally worth removing -- but it is also
 * the ONE place the audience has ever been decided, and that decision has moved
 * twice in a day. Keeping it costs a function call; deleting it means editing
 * 42 call sites to name pqh_duolingo_chrome_css() directly, and editing them
 * back the moment anyone wants a kind excluded again. If the audience settles
 * for good, delete this and call the sheet directly -- that is the tidy-up, and
 * it is a 42-file change plus a full re-upload, so do it once and deliberately.
 *
 * It no longer calls pqh_shell_viewer_kind(). There is nothing left to ask.
 */
function pqh_viewer_chrome_css(string $scope): string {
    return pqh_duolingo_chrome_css($scope);
}

/**
 * Bakes a small stroke-icon SVG into a `background-image:url(...)` data URI,
 * for the icon-in-a-circle stat tiles across the Ehel skins. Colour is baked
 * into the SVG rather than read from a CSS variable because each caller's
 * icon set is a fixed, small, build-time list -- there is nothing a custom
 * property would be buying, only another indirection to keep in sync.
 *
 * Pass a LITERAL '#', never a pre-encoded '%23': rawurlencode() runs on the
 * whole SVG string once, so it needs a real '#' to turn into '%23'. A
 * pre-encoded one gets encoded a second time (its own '%' becomes '%25'),
 * landing an invalid stroke value with nothing on the page to say why --
 * this shipped once and was only caught by decoding the computed
 * background-image in a browser, not by reading the code.
 */
function pqh_ehel_icon_data_uri(string $hex, string $paths): string {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' . $hex . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' . $paths . '</svg>';
    return "url('data:image/svg+xml," . rawurlencode($svg) . "')";
}

/**
 * The Ehel Academy foundation: the palette, ground and ink-reset every
 * Ehel-skinned page shares, factored out of pqh_ehel_academy_css() so the
 * live group board could be skinned to match without a second copy of it
 * (2026-09-08). See pqh_ehel_academy_css()'s own docblock for where the
 * palette comes from and why the ink is reset by ELEMENT rather than by
 * class -- both reasons apply unchanged here; only the component rules after
 * this foundation differ per page.
 *
 * Returns RAW css text, deliberately not yet run through
 * pqh_css_force_and_specify() -- each caller concatenates this with its own
 * component heredoc and forces the whole combined string exactly once, which
 * is what keeps this split behaviour-preserving: string concatenation does
 * not care which function assembled which half.
 *
 * @param string $scope the page's shell class, with its leading dot
 * @param string $bodyclass the page's body class, so the ground reaches the
 *                          overscroll area behind the shell ('' to skip)
 */
function pqh_ehel_tokens_css(string $scope, string $bodyclass = ''): string {
    // Outside the shell and therefore not reachable from the sheet below.
    // Moodle's canvas shows through above and below the page on an elastic
    // scroll, and the skin paints it var(--op-canvas) -- a token declared on
    // :root, which shadowing it on the shell cannot reach.
    //
    // It is prepended to the sheet rather than concatenated after the pass,
    // because the pass DOUBLES the first class of every selector: the skin's
    // own body rule lands at (0,2,1) and a hand-written body.X{...!important}
    // at (0,1,1) loses to it. Measured, not reasoned -- the page rendered on
    // #f2f2f2 until this was moved.
    $body = trim($bodyclass) !== ''
        ? "body.{$bodyclass}{background:#183B56;color-scheme:dark}\n"
        : '';

    return $body . <<<CSS
{$scope}{--ea-ground-a:#183B56;--ea-ground-b:#24556B;--ea-card:rgba(20,43,62,.88);--ea-cell:#22485F;--ea-cell-2:#1C3D53;--ea-line:#2B5673;--ea-line-soft:rgba(43,86,115,.55);--ea-ink:#FFFFFF;--ea-body:#C3D3DF;--ea-muted:#A4B7C8;--ea-teal:#35BFB2;--ea-teal-deep:#2AA79B;--ea-teal-ink:#06231F;--ea-teal-soft:rgba(53,191,178,.14);--ea-teal-line:rgba(53,191,178,.45);--ea-gold:#F4C95D;--ea-gold-press:#D0A326;--ea-gold-ink:#2A1F05;--ea-gold-soft:rgba(244,201,93,.12);--ea-gold-line:rgba(244,201,93,.42);--ea-coral:#ED8E70;--ea-coral-soft:rgba(237,142,112,.14);--ea-coral-line:rgba(237,142,112,.45);--ea-plum:#B78BD1;--ea-plum-soft:rgba(183,139,209,.16);--ea-plum-line:rgba(183,139,209,.42);--ea-green:#4FD1A0;--ea-green-soft:rgba(79,209,160,.14);--ea-green-line:rgba(79,209,160,.45);--ea-sky:#6FB6E8;--ea-sky-soft:rgba(111,182,232,.14);--ea-sky-line:rgba(111,182,232,.42);--ea-shadow:0 1px 2px rgba(0,0,0,.35),0 22px 50px rgba(0,0,0,.45);--ea-shadow-sm:0 1px 2px rgba(0,0,0,.28),0 10px 24px rgba(0,0,0,.28);--ea-sans:"Atkinson Hyperlegible","Segoe UI",Arial,sans-serif;--ea-display:"Inter","Segoe UI",Arial,sans-serif}

/* ---- the tokens the rest of the page is written in ----------------------
   Shadowed here rather than edited where they are declared, so every other
   page those two generators serve is untouched. --op-primary is deliberately
   NOT gold: the skin pairs it with white text, and white on gold is 1.6:1.
   Gold is applied by the button rules further down, which set their own ink. */
{$scope}{--pqh-ink:var(--ea-ink);--pqh-muted:var(--ea-body);--pqh-faint:var(--ea-muted);--pqh-line:var(--ea-line);--pqh-bg:var(--ea-cell);--pqh-surface:var(--ea-card);--pqh-tint:rgba(255,255,255,.06);--pqh-tint-2:var(--ea-line);--pqh-primary:var(--ea-teal);--pqh-primary-ink:var(--ea-teal);--pqh-r:18px;--pqh-shadow:var(--ea-shadow-sm)}
{$scope}{--op-font:var(--ea-sans);--op-ink:var(--ea-ink);--op-ink-muted:var(--ea-body);--op-ink-soft:var(--ea-muted);--op-ink-faint:var(--ea-muted);--op-line:var(--ea-line);--op-line-strong:var(--ea-line);--op-canvas:transparent;--op-surface:var(--ea-card);--op-surface-tint:var(--ea-cell);--op-surface-soft:var(--ea-cell-2);--op-primary:var(--ea-teal);--op-primary-hover:var(--ea-teal-deep);--op-primary-subtle:var(--ea-teal-soft);--op-primary-border:var(--ea-teal-line);--op-primary-emphasis:var(--ea-teal);--op-ok-bg:var(--ea-green-soft);--op-ok-line:var(--ea-green-line);--op-ok-ink:var(--ea-green);--op-warn-bg:var(--ea-gold-soft);--op-warn-line:var(--ea-gold-line);--op-warn-ink:var(--ea-gold);--op-bad-bg:var(--ea-coral-soft);--op-bad-line:var(--ea-coral-line);--op-bad-ink:var(--ea-coral);--op-radius:14px;--op-radius-lg:22px;--op-focus:0 0 0 3px rgba(53,191,178,.3);--op-shadow-lg:var(--ea-shadow);--op-header-bg:transparent;--op-header-ink:var(--ea-ink);--op-header-ink-soft:var(--ea-body)}

/* ---- the ground ----------------------------------------------------------
   A fixed pseudo-element rather than background-attachment:fixed, which is
   what the reference page does and for the same reason it gives: 135 degrees
   has to stay 135 degrees however long the page grows, and a dashboard grows
   to several thousand pixels. The pseudo-element also keeps the whole page off
   the browser's slow-scroll path, which a fixed attachment on a 14,000px
   element does not. */
/* line-height:1.55 here is the READING value, lifted from the reference page
   along with everything else -- and the reference page is a lesson, almost
   entirely paragraphs of text meant to be read. This page is almost entirely
   the opposite: single-line labels, numbers, pills and links, each of which
   inherited that same 1.55 with nothing here to narrow it back down, and it
   shows up as real, visible space -- half a line's worth above AND below
   every one of them -- not a layout gap at all, which is why the padding and
   grid-gap pass earlier did not touch it. Reported directly against a
   screenshot with the gaps marked one by one; nearly every mark sits under a
   single line of UI chrome, never under a paragraph. 1.3 is the new base --
   still readable for the handful of actual sentences on these two pages
   (the SEB notice, the empty-course line) -- and the compact chrome below is
   tightened further on top of that, explicitly, because 1.3 is still loose
   on an 11px pill. */
{$scope}{background:transparent;color:var(--ea-body);font-family:var(--ea-sans);font-size:15.5px;line-height:1.3;-webkit-font-smoothing:antialiased;color-scheme:dark}
{$scope}::before{content:"";position:fixed;inset:0;z-index:-1;background:linear-gradient(135deg,var(--ea-ground-a) 0%,var(--ea-ground-b) 100%)}

/* ---- ink reset -----------------------------------------------------------
   :where(:not([style*="color"])) on both rules below is not defensive
   padding -- it was added after this reset broke three elements that already
   had a correct, token-based inline colour of their own: the SEB launch-mode
   toggle's group label (a <div style="color:var(--ea-muted,...)">) and its
   three <a>s (one background:var(--ea-teal) + color:var(--ea-teal-ink) for
   the active mode, color:var(--ea-body) for the other two).
   `color:inherit!important` doesn't care that the value is a working token
   chain -- it stomps it flat to the page's base ink regardless, and for the
   active mode that made the button's text the same teal as its own
   background: invisible, verified by computed style (both resolved to
   rgb(53,191,178)). An element that already declares its own colour has made
   its choice; the reset's job is only for the ones that have not.

   It has to be :where(), not a bare :not(). A first attempt used
   `a:not([style*="color"])` directly and broke a SECOND, wider set of
   elements: :not()'s specificity is that of its own argument -- an attribute
   selector, one full class-column point -- so appending it to the already-
   doubled anchor rule pushed it from (0,2,1) to (0,3,1), which now OUTRANKS
   the button rule's (0,3,0) and made every plain-styled anchor button on both
   pages (`.pqhsd-cta`, `.pqhsd-btn`, the young-learner "Continue learning"
   pill) show teal text on gold instead of the button rule's own ink -- caught
   by the same automated contrast sweep that found the original bug, not by
   reading the CSS. :where() carries zero specificity by spec whatever its
   argument, so wrapping the same exclusion in it changes which ELEMENTS the
   rule reaches without moving where it ranks against anything else. */
{$scope} :is(p,span,div,li,dd,dt,td,th,strong,b,em,i,u,small,label,figcaption,summary,legend,time,section,article,header,footer,aside,ul,ol,dl,form,fieldset,blockquote,output,option,svg):where(:not([style*="color"])){color:inherit}
{$scope} :is(h1,h2,h3,h4,h5,h6){color:var(--ea-ink);font-family:var(--ea-display);font-weight:800;letter-spacing:-.02em;line-height:1.15;text-wrap:balance}
{$scope} hr{border-color:var(--ea-line)}
{$scope} a:where(:not([style*="color"])){color:var(--ea-teal)}
{$scope} a:hover{color:var(--ea-ink)}
{$scope} ::placeholder{color:var(--ea-muted)}
{$scope} :focus-visible{outline:3px solid var(--ea-teal);outline-offset:2px}
CSS;
}

/**
 * The Ehel Academy dashboard skin: the three home pages a family and a teacher
 * land on, dressed in the language of the lessons themselves.
 *
 * WHERE IT COMES FROM. Not invented here -- every token below is lifted from
 * app/mathematics/grade-1-v2/index.html, the Grade 1 Maths way-in, which is the
 * page the owner named on 2026-09-07. That page is a fixed 135-degree navy-teal
 * ground, Atkinson Hyperlegible over Inter, big soft-cornered cards floating on
 * it, one colour per subject carried by a rounded icon tile and an uppercase
 * strand label, and exactly one gold pill that means GO. The dashboards were a
 * light blue admin console with a navy rail; the point of this sheet is that a
 * learner who opens their dashboard and then opens a lesson should not feel
 * they have changed product.
 *
 * WHY A LAYER RATHER THAN AN EDIT. dashboard.php alone carries ~450 lines of
 * inline CSS written for a light page, under two generated skins
 * (pqh_openproject_skin_css, pqh_duolingo_chrome_css) that force colour with
 * !important. Rewriting all of that in place would be a diff nobody can review
 * and would strand every OTHER page those generators serve. So this is emitted
 * last and wins the same way the skins do -- see pqh_css_force_and_specify().
 *
 * TWO THINGS MAKE A DARK REPAINT SAFE, and neither is a list of fixes.
 *
 *   The TOKENS are re-pointed first. Both generated layers, and dashboard.php's
 *   own last block, are written in terms of --op-* and --pqh-* rather than
 *   literals, and those are declared on :root and on the shell -- so shadowing
 *   them here turns the great majority of the page dark by construction, before
 *   a single component rule is written. A skin that only chased component
 *   classes would be the allowlist-of-yesterday's-accidents this repo keeps
 *   recording; re-pointing the source is the version that also covers the rule
 *   somebody adds next month.
 *
 *   The INK is reset by element, not by class. A light page is full of colour
 *   chosen to sit on white -- #0f2237 headings, #5b6b7c body, and in
 *   student_dashboard.php a handful of INLINE style="color:#7a6a3f" notices.
 *   The reset is a typed selector, so it is (0,1,1) and every class rule below
 *   beats it, and it carries !important, so it also beats those inline styles.
 *   Everything that means something is then re-stated by class. Nothing is left
 *   to be discovered by a child who cannot read the page.
 *
 * What remains after those two is a short list of literal colours in the two
 * page files, and it is short enough to state: they are the chips at the end of
 * this sheet. They were found by measuring, not by reading -- walk the rendered
 * page, compute the luminance of every element's background, and print anything
 * light. Re-run that after any change here; it is the only check that answers
 * "is there something a learner cannot see".
 *
 * Contrast was measured against the card, not guessed. On the card colour over
 * the ground (~#16303F): white 11.6:1, #C3D3DF 8.2:1, #A4B7C8 6.2:1, teal
 * #35BFB2 5.0:1, gold #F4C95D 7.1:1, green #4FD1A0 6.7:1, sky #6FB6E8 5.7:1,
 * plum #B78BD1 4.7:1, coral #ED8E70 4.9:1. Text sitting ON a coloured chip uses
 * the reference page's own inks (--ea-teal-ink, --ea-gold-ink) rather than
 * white, which is where g1v2's own template-alignment pass ended up too.
 *
 * WHO GETS IT is decided at the call site and is deliberately narrow: the
 * student home, and dashboard.php for the teacher and parent roles. An admin,
 * principal or SQA tester on that same file keeps the console look, because
 * what they read there is finance, compliance and governance -- not a learner's
 * page, and not what was asked for.
 *
 * @param string $scope the page's shell class, with its leading dot
 * @param string $bodyclass the page's body class, so the ground reaches the
 *                          overscroll area behind the shell ('' to skip)
 */
function pqh_ehel_academy_css(string $scope, string $bodyclass = ''): string {
    // Five small stroke glyphs for the stat cards' icon circles (2026-09-07,
    // the LearnUp-modelled redesign). Reused paths rather than a new icon set
    // -- calendar from the schedule links, alert-circle from the risk pill,
    // the bar-chart from the data strand, the play-rect from the live badge --
    // so the stat row looks like the rest of this app rather than a fifth
    // icon style arriving with it. Position is what assigns an icon
    // (nth-child, the same convention the nav rail's own per-row colours
    // already use below), never the stat's label -- the row differs by role
    // and this asks nothing of it.
    $pqhiconcalendar = pqh_ehel_icon_data_uri('#35BFB2', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>');
    $pqhiconalert = pqh_ehel_icon_data_uri('#ED8E70', '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>');
    $pqhicondata = pqh_ehel_icon_data_uri('#6FB6E8', '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/>');
    $pqhiconlive = pqh_ehel_icon_data_uri('#F4C95D', '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/>');
    $pqhiconstar = pqh_ehel_icon_data_uri('#B78BD1', '<path d="M12 2.5 14.6 9l7 .6-5.3 4.6 1.6 6.8L12 17.6l-6 3.4 1.6-6.8L2.3 9.6l7-.6L12 2.5z"/>');

    // The "\n\n" here is doing real work, not decoration: a heredoc drops the
    // newline immediately before its own closing identifier, so
    // pqh_ehel_tokens_css()'s returned string already ends right at "...2px}"
    // with nothing trailing. Concatenating straight onto this heredoc's first
    // content line would collapse the blank line that used to separate the
    // ink-reset from the page-header section when both lived in one heredoc --
    // caught by a byte-for-byte diff against the pre-refactor output, not by
    // reading either heredoc, both of which look complete on their own.
    $css = pqh_ehel_tokens_css($scope, $bodyclass) . "\n\n" . <<<CSS
/* ---- page header, now the identity band -----------------------------------
   2026-09-07: the owner asked for LearnUp's dashboard
   (learn-up-moodle-frontend.vercel.app/dashboard) in this page's own fonts
   and colours. That page's signature is a full-width colour band with a
   profile card (avatar, name, a couple of quick numbers) overlapping it. This
   app already has a working nav rail on every one of ~40 shared pages, so a
   second sidebar squeezed in beside it would be furniture competing with a
   feature -- the identity card is folded into the hero instead: the hero
   itself becomes the colour band, and the avatar and quick numbers live on
   it, which is the same "card sits on its own band" idea with one surface
   instead of two.

   The band is a diagonal of three of this page's own accents (teal, the
   ground's own navy, plum) rather than LearnUp's pink-to-purple -- the ask
   was this page's palette, not that page's.

   A FLAT BLACK SCRIM SITS BETWEEN THE GRADIENT AND EVERY LINE OF TEXT ON IT,
   and it is load-bearing, not decoration. The automated contrast sweep this
   file's own history leans on passed this band with zero findings, and it
   was wrong: it samples one representative colour per gradient background
   (this file's own shorthand for "a gradient is behind this element"), so it
   checked white against the MIDPOINT of the gradient and never against either
   end. Computed directly against the three stops: white on the teal end is
   2.27:1, on the plum end 2.75:1 -- both fail even the 3:1 floor large bold
   text gets, right where this band puts its own title and its own numbers.
   The scrim is sized against the WORST stop on purpose (teal, the brightest
   of the three) at 45% black, which brings every text tone actually used
   here -- including the ones already below full white -- to 5.1:1 or better
   against all three stops, computed the same way. Re-run that computation,
   never the element-sampling sweep, if another colour is ever added to this
   gradient; the sweep's blind spot is structural; sampling a different point
   only relocates it. */
{$scope}{$scope} .pqh-hero,{$scope}{$scope} .pqh-workspace-top,{$scope}{$scope} .pqhsd-pagehead{position:relative;background:linear-gradient(120deg,var(--ea-teal) 0%,#1E4A63 52%,var(--ea-plum) 100%);border:0;border-radius:24px;box-shadow:var(--ea-shadow-sm);padding:20px 24px;overflow:hidden}
{$scope}{$scope} .pqh-hero::before,{$scope}{$scope} .pqh-workspace-top::before,{$scope}{$scope} .pqhsd-pagehead::before{content:"";position:absolute;inset:0;background:rgba(4,14,22,.45);pointer-events:none}
{$scope}{$scope} .pqh-hero>*,{$scope}{$scope} .pqh-workspace-top>*,{$scope}{$scope} .pqhsd-pagehead>*{position:relative}
/* The kicker/label rule stays teal for the many OTHER places it is used on
   the dark ground (".pqhsd-label" is "MY COURSES", sat on the card, not the
   band) -- only the band's OWN kicker/title/subtitle need to survive sitting
   on a gradient that is teal at one end, and a plain teal eyebrow on the
   teal end of its own background is close to unreadable. The override below
   is MORE specific (one more class) than this one on purpose, not accidental
   -- see the note further down about why that is safe here and was not the
   last time this file tried it. */
{$scope}{$scope} .pqh-kicker,{$scope}{$scope} .pqhsd-label,{$scope}{$scope} [class*="-kicker"],{$scope}{$scope} [class*="-eyebrow"]{color:var(--ea-teal);font-family:var(--ea-display);font-size:12.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;line-height:1.2}
{$scope}{$scope} .pqh-title,{$scope}{$scope} .pqh-workspace-title,{$scope}{$scope} .pqhsd-pagehead h1{color:var(--ea-ink);font-family:var(--ea-display);font-size:clamp(27.5px,3.6vw,37.5px);font-weight:800;letter-spacing:-.02em;text-shadow:none}
/* The third clause is a fallback for student_dashboard.php's lede, which
   carries no class at all in the source (a bare `<p>echo`d straight from PHP)
   -- so the lede is caught by TAG rather than by name. The kicker just above
   is ALSO a <p> in the same .pqhsd-pagehead, and a class+type selector beats
   a class+attribute one: measured, `.pqhsd-pagehead p` is (0,4,1) once scoped
   and doubled, one point ahead of the kicker rule's (0,4,0) -- so without this
   exclusion the fallback silently recoloured the kicker to the lede's muted
   tone. Verified via document.styleSheets before and after; the two rules
   never needed to compete, they were both trying to describe "the OTHER
   paragraph". */
{$scope}{$scope} .pqh-subtitle,{$scope}{$scope} .pqh-workspace-sub,{$scope}{$scope} .pqhsd-pagehead p:not([class*="-kicker"]){color:var(--ea-body);font-family:var(--ea-sans);font-size:17.5px;font-weight:400}

/* Band-only overrides. One class more specific than the two rules above by
   compounding an ancestor onto them ((0,5,0) against their (0,4,0)), which is
   deliberate rather than the trap the anchor ink-reset hit -- that bug came
   from a PSEUDO-CLASS argument silently adding specificity to a rule meant to
   stay level with its sibling; this is an ordinary descendant compound, doing
   exactly what compounding is for; there is no wider rule downstream for it
   to accidentally outrank. */
{$scope}{$scope} .pqh-hero .pqh-kicker,{$scope}{$scope} .pqhsd-pagehead .pqhsd-kicker{color:rgba(255,255,255,.90)}
{$scope}{$scope} .pqh-hero .pqh-subtitle,{$scope}{$scope} .pqh-hero .pqh-workspace-sub,{$scope}{$scope} .pqhsd-pagehead p.pqhsd-kicker+h1+p{color:rgba(255,255,255,.88)}

/* ---- the identity card -----------------------------------------------------
   Avatar (Moodle's own user_picture renderer -- the user's uploaded photo
   where one exists, its generated default otherwise, never invented here)
   beside the greeting, and the reference's two-up "12 Done Courses / 156
   Done Lessons": a role-appropriate pair of numbers already computed by the
   page for other reasons.

   NOT stacked under the greeting as first written here. .pqhsd-pagehead and
   .pqh-hero are both a flex ROW already (space-between, align-items:flex-end,
   from the base stylesheet neither page's redesign touched), so .pqhsd-
   idcard and this stats block are PEERS in that row, beside the greeting, not
   beneath it -- confirmed on a live screenshot, not assumed from reading the
   markup. A margin-top/border-top written for "the divider under the
   greeting" does something else entirely to a flex ROW sibling: it pushes the
   whole block down against the row's own bottom-alignment and draws a line
   that borders nothing, which is dead weight in exactly the "too much space"
   direction this pass exists to close. */
{$scope}{$scope} .pqhsd-idcard,{$scope}{$scope} .pqh-idcard{display:flex;align-items:center;gap:14px}
{$scope}{$scope} .pqhsd-avatar,{$scope}{$scope} .pqh-avatar{flex:0 0 auto;display:block;width:64px;height:64px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,255,255,.55);box-shadow:0 6px 16px rgba(0,0,0,.28)}
{$scope}{$scope} .pqhsd-avatar img,{$scope}{$scope} .pqh-avatar img{display:block;width:100%;height:100%;object-fit:cover}
{$scope}{$scope} .pqhsd-quickstats,{$scope}{$scope} .pqh-idcard-stats{display:flex;align-items:flex-end;gap:20px}
{$scope}{$scope} .pqhsd-quickstats div,{$scope}{$scope} .pqh-idcard-stats div{display:flex;flex-direction:column}
{$scope}{$scope} .pqhsd-quickstats strong,{$scope}{$scope} .pqh-idcard-stats strong{color:#fff;font-family:var(--ea-display);font-size:21.5px;font-weight:800;font-variant-numeric:tabular-nums}
{$scope}{$scope} .pqhsd-quickstats span,{$scope}{$scope} .pqh-idcard-stats span{color:rgba(255,255,255,.85);font-family:var(--ea-display);font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}

/* ---- surfaces ------------------------------------------------------------
   One card shape for everything that is a block on the ground.
   :not([class*="__"]) keeps the BEM CHILDREN out -- .pqh-course-card__number
   and .pqh-course-panel__head both contain "-card"/"-panel" and are a number
   and a heading row, not surfaces. They are rows, handled below. */
{$scope} [class*="-panel"]:not([class*="__"]),{$scope} [class*="-card"]:not([class*="__"]),{$scope} [class*="-tile"]:not([class*="__"]),{$scope} [class*="-kpi"]:not([class*="__"]),{$scope} [class*="-metric"]:not([class*="__"]),{$scope} [class*="-stat"]:not([class*="__"]),{$scope} [class*="-box"]:not([class*="__"]),{$scope} .pqh-notif__panel,{$scope} .pqh-customize__panel,{$scope} .pqh-tkpi__card,{$scope} .pqh-live-monitor,{$scope} .pqh-live-child,{$scope} .pqh-live-session,{$scope} .pqh-young,{$scope} .pqh-tools,{$scope} .pqh-config,{$scope} .pqh-filter{background:var(--ea-card);border:1px solid var(--ea-line);border-radius:22px;box-shadow:var(--ea-shadow-sm);color:var(--ea-body)}

/* Containers, not surfaces. A grid that happens to be called "-kpis" or
   "-cards" is matched by the plural-blind selectors above, and a card-coloured
   slab behind a row of cards reads as a fifth, empty card. Written with the
   scope twice so it is one class MORE specific than the rule it is undoing --
   the forcing pass adds a further class to each, so the two land at (0,4,0)
   and (0,5,0).

   align-items:start is here for a reason that has nothing to do with being a
   surface: every one of these rows is CSS Grid with no align-items of its own,
   so the default is stretch, and one long sibling stretches every card beside
   it to match. A live class time that wraps to two lines ("Tue" / "16:12")
   was enough to stretch the other three stat cards into having a blank third
   of themselves; an in-progress course card did the same to a "Ready when you
   are!" card beside it. Reported directly from a production screenshot after
   the first deploy -- the harness has no real data long or varied enough to
   have shown it. */
{$scope}{$scope} [class*="-kpis"],{$scope}{$scope} [class*="-metrics"],{$scope}{$scope} [class*="-stats"],{$scope}{$scope} [class*="-cards"],{$scope}{$scope} [class*="-tiles"],{$scope}{$scope} [class*="-panels"],{$scope}{$scope} [class*="-grid"],{$scope}{$scope} [class*="-list"],{$scope}{$scope} [class*="-cols"],{$scope}{$scope} [class*="-layout"],{$scope}{$scope} [class*="-chips"],{$scope}{$scope} .pqh-quick,{$scope}{$scope} .pqh-tkpi,{$scope}{$scope} .pqh-week,{$scope}{$scope} .pqh-tbars,{$scope}{$scope} .pqhsd-courses,{$scope}{$scope} .pqhsd-todo,{$scope}{$scope} .pqhsd-side,{$scope}{$scope} .pqh-dashboard-sidebar{background:transparent;border:0;box-shadow:none;padding:0;align-items:start}

{$scope} [class*="-panel"] h2,{$scope} [class*="-card"] h2,{$scope} [class*="-panel"] h3,{$scope} [class*="-card"] h3{color:var(--ea-ink);font-family:var(--ea-display);font-weight:800}
{$scope} [class*="-sub"],{$scope} [class*="-meta"],{$scope} [class*="-muted"],{$scope} [class*="-help"],{$scope} [class*="-note"],{$scope} [class*="-caption"],{$scope} [class*="-text"],{$scope} [class*="-body"]{color:var(--ea-body);line-height:1.3}
{$scope} [class*="-label"]:not(label),{$scope} [class*="-legend"]{color:var(--ea-muted);font-family:var(--ea-display);font-weight:700;letter-spacing:.08em;text-transform:uppercase;line-height:1.2}

/* ---- rows inside a card --------------------------------------------------
   The lesson deck's own idiom: a slightly lighter cell, no border, generous
   radius. The to-do rows, the notification rows, the student-profile fields
   and the week chips are all this shape. */
{$scope} [class*="__item"],{$scope} [class*="__row"],{$scope} [class*="-row"]:not([class*="-rows"]),{$scope} .pqh-student-profile__item,{$scope} .pqh-mini-stat,{$scope} .pqh-teacher-row,{$scope} .pqh-notif__item,{$scope} .pqhsd-feedback,{$scope} .pqh-detail,{$scope} .pqh-week>div,{$scope} .pqh-live-session__stat{background:var(--ea-cell);border:1px solid transparent;border-radius:16px;box-shadow:none;color:var(--ea-body);line-height:1.25}
{$scope} [class*="__head"],{$scope} [class*="-head"]:not([class*="-header"]),{$scope} [class*="__top"]{background:transparent;border-color:var(--ea-line);color:var(--ea-ink);font-family:var(--ea-display);font-weight:800}

/* ---- numbers -------------------------------------------------------------
   A dashboard is mostly counts, and the reference sets its one big number in
   Inter with tabular figures. Nothing here is coloured by value except the
   states below: a bare number is white. */
{$scope} [class*="-num"],{$scope} [class*="-value"],{$scope} [class*="-count"],{$scope} [class*="-number"],{$scope} .pqh-metric strong,{$scope} .pqh-teacher-metric strong,{$scope} .pqh-week b{color:var(--ea-ink);font-family:var(--ea-display);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em;line-height:1.1}
{$scope} .pqh-mini-stat span,{$scope} .pqh-teacher-metric span,{$scope} .pqh-week span,{$scope} .pqh-live-session__stat span{color:var(--ea-muted);font-family:var(--ea-display);font-weight:700;letter-spacing:.08em;text-transform:uppercase}

/* ---- stat cards: an icon in its own soft-tinted circle --------------------
   LearnUp's "at a glance" tile: a coloured glyph in a circle, then a big
   tabular number with its label stacked underneath. The DOM here is fixed --
   <b>label</b><strong>number</strong><a>link</a>, in that order, on both
   pages -- and the new reading order is icon | number-over-label, with the
   link as its own row underneath spanning both columns. Grid areas place
   existing children by NAME, not by source order, so this is a pure reflow:
   no markup changed on either page.

   The icon itself is a lone ::before, positioned by nth-child on the ROW
   (.pqhsd-kpis / .pqh-tkpi), the same "position assigns colour" convention
   the nav rail already uses a few hundred lines down -- these rows differ by
   role and by page, so nothing here can be keyed to what a card is actually
   about. */
{$scope}{$scope} .pqhsd-kpi,{$scope}{$scope} .pqh-tkpi__card{display:grid;grid-template-columns:48px 1fr;grid-template-areas:"icon number" "icon label" "link link";column-gap:12px;row-gap:2px;align-items:center;padding:14px}
{$scope}{$scope} .pqhsd-kpi::before,{$scope}{$scope} .pqh-tkpi__card::before{content:"";grid-area:icon;align-self:start;width:48px;height:48px;border-radius:14px;background-repeat:no-repeat;background-position:center;background-size:22px 22px}
{$scope}{$scope} .pqhsd-kpi strong,{$scope}{$scope} .pqh-tkpi__card strong{grid-area:number;font-size:27.5px;line-height:1.1}
{$scope}{$scope} .pqhsd-kpi b,{$scope}{$scope} .pqh-tkpi__card b{grid-area:label;color:var(--ea-muted);font-family:var(--ea-display);font-weight:600;font-size:12.5px;letter-spacing:0;text-transform:none;line-height:1.2}
{$scope}{$scope} .pqhsd-kpi a,{$scope}{$scope} .pqh-tkpi__card a{grid-area:link;margin-top:7px;padding-top:7px;border-top:1px solid var(--ea-line);font-size:12px;font-weight:700;line-height:1.2}
{$scope}{$scope} .pqhsd-kpis>*:nth-child(1)::before,{$scope}{$scope} .pqh-tkpi>*:nth-child(1)::before{background-color:var(--ea-teal-soft);background-image:{$pqhiconcalendar}}
{$scope}{$scope} .pqhsd-kpis>*:nth-child(2)::before,{$scope}{$scope} .pqh-tkpi>*:nth-child(2)::before{background-color:var(--ea-coral-soft);background-image:{$pqhiconalert}}
{$scope}{$scope} .pqhsd-kpis>*:nth-child(3)::before,{$scope}{$scope} .pqh-tkpi>*:nth-child(3)::before{background-color:var(--ea-sky-soft);background-image:{$pqhicondata}}
{$scope}{$scope} .pqhsd-kpis>*:nth-child(4)::before,{$scope}{$scope} .pqh-tkpi>*:nth-child(4)::before{background-color:var(--ea-gold-soft);background-image:{$pqhiconlive}}
{$scope}{$scope} .pqhsd-kpis>*:nth-child(5)::before,{$scope}{$scope} .pqh-tkpi>*:nth-child(5)::before{background-color:var(--ea-plum-soft);background-image:{$pqhiconstar}}
/* is-grade / is-risk still fire on <strong> inside these cards (To grade,
   Students needing attention) -- the "meaning" block below restates them at
   equal specificity to this rule and sits LATER in the sheet, so they still
   win the tie. Nothing to do here; noted so the ordering is not disturbed. */

/* ---- the one gold pill ---------------------------------------------------
   In the reference exactly one control on a card is filled, it is gold, and it
   presses into its own bottom edge. Kept literally, so "the gold thing" always
   means GO. Everything secondary is a hairline ghost, which is also what the
   deck does. */
{$scope} [class*="-btn"],{$scope} [class*="-cta"],{$scope} .pqh-ybig,{$scope} .pqh-top-action,{$scope} .pqh-back{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 20px;border:0;border-radius:999px;background:var(--ea-gold);color:var(--ea-gold-ink);font-family:var(--ea-display);font-size:14.5px;font-weight:800;letter-spacing:.01em;line-height:1.2;text-decoration:none;box-shadow:0 4px 0 var(--ea-gold-press);cursor:pointer;transition:transform .08s ease,box-shadow .08s ease,filter .13s ease}
{$scope} [class*="-btn"]:hover,{$scope} [class*="-cta"]:hover,{$scope} .pqh-ybig:hover{background:var(--ea-gold);color:var(--ea-gold-ink);filter:brightness(1.06);text-decoration:none}
{$scope} [class*="-btn"]:active,{$scope} [class*="-cta"]:active,{$scope} .pqh-ybig:active{transform:translateY(2px);box-shadow:0 2px 0 var(--ea-gold-press)}
{$scope} [class*="-btn"][disabled],{$scope} [class*="-btn"]:disabled{opacity:.45;box-shadow:none;cursor:not-allowed}
{$scope}{$scope} [class*="-btn--secondary"],{$scope}{$scope} [class*="-btn--light"],{$scope}{$scope} [class*="-btn--ghost"],{$scope}{$scope} .pqhsd-jc-btn2,{$scope}{$scope} .pqh-back,{$scope}{$scope} .pqh-top-action,{$scope}{$scope} .pqh-course-card__lesson{background:rgba(255,255,255,.07);color:var(--ea-ink);border:1px solid rgba(255,255,255,.24);box-shadow:none}
{$scope}{$scope} [class*="-btn--secondary"]:hover,{$scope}{$scope} [class*="-btn--light"]:hover,{$scope}{$scope} [class*="-btn--ghost"]:hover,{$scope}{$scope} .pqhsd-jc-btn2:hover,{$scope}{$scope} .pqh-back:hover,{$scope}{$scope} .pqh-top-action:hover,{$scope}{$scope} .pqh-course-card__lesson:hover{background:var(--ea-cell);color:var(--ea-ink);border-color:var(--ea-teal);filter:none}
{$scope}{$scope} [class*="-btn--secondary"]:active,{$scope}{$scope} [class*="-btn--light"]:active,{$scope}{$scope} .pqhsd-jc-btn2:active{transform:none;box-shadow:none}
{$scope}{$scope} [class*="-btn--danger"]{background:var(--ea-coral);color:#2A1008;border:0;box-shadow:0 4px 0 #B8604A}

/* ---- pills, chips, tags, statuses ---------------------------------------- */
{$scope} [class*="-pill"],{$scope} [class*="-chip"],{$scope} [class*="-tag"],{$scope} [class*="-status"],{$scope} [class*="-badge"],{$scope} .pqh-special-care,{$scope} .pqhsd-jc-level{border:1px solid var(--ea-teal-line);border-radius:999px;background:var(--ea-teal-soft);color:var(--ea-teal);font-family:var(--ea-display);font-size:12px;font-weight:700;letter-spacing:.02em;line-height:1;text-transform:none}

/* ---- meaning -------------------------------------------------------------
   Re-stated rather than inherited, because the ink reset above deliberately
   flattened everything. These are the four things a dashboard says with
   colour, and they keep saying it. */
{$scope}{$scope} [class*="--ok"],{$scope}{$scope} [class*="--good"],{$scope}{$scope} [class*="--done"],{$scope}{$scope} [class*="--success"],{$scope}{$scope} .is-ok,{$scope}{$scope} .pqhsd-delta,{$scope}{$scope} [class*="-delta"]{background:var(--ea-green-soft);border-color:var(--ea-green-line);color:var(--ea-green)}
{$scope}{$scope} [class*="--warn"],{$scope}{$scope} [class*="--pending"],{$scope}{$scope} [class*="--due"],{$scope}{$scope} .is-grade{background:var(--ea-gold-soft);border-color:var(--ea-gold-line);color:var(--ea-gold)}
{$scope}{$scope} [class*="--risk"],{$scope}{$scope} [class*="--bad"],{$scope}{$scope} [class*="--danger"],{$scope}{$scope} [class*="--error"],{$scope}{$scope} [class*="--overdue"],{$scope}{$scope} [class*="--blocked"],{$scope}{$scope} [class*="--missing"],{$scope}{$scope} .is-risk,{$scope}{$scope} .pqhsd-jc-todo{background:var(--ea-coral-soft);border-color:var(--ea-coral-line);color:var(--ea-coral)}
{$scope}{$scope} [class*="--info"],{$scope}{$scope} [class*="--readonly"],{$scope}{$scope} [class*="--live"],{$scope}{$scope} .is-live{background:var(--ea-sky-soft);border-color:var(--ea-sky-line);color:var(--ea-sky)}
/* A one-line note is not a chip: it takes the state's COLOUR and none of its
   box. student_dashboard.php's four lesson-mode notices are these, and they
   carried the meaning as an inline style until the ink reset flattened it. */
{$scope}{$scope} [class*="-note--warn"],{$scope}{$scope} [class*="-note--risk"],{$scope}{$scope} [class*="-note--info"],{$scope}{$scope} [class*="-note--ok"]{background:transparent;border:0;font-weight:600}
{$scope}{$scope} [class*="-note--warn"]{color:var(--ea-gold)}
{$scope}{$scope} [class*="-note--risk"]{color:var(--ea-coral)}
{$scope}{$scope} [class*="-note--info"]{color:var(--ea-sky)}
{$scope}{$scope} [class*="-note--ok"]{color:var(--ea-green)}

/* ---- notices -------------------------------------------------------------
   The reference's one aside is "For the grown-up": a soft gold wash behind a
   gold left rule. That shape is given to the things that are actually asides
   -- an alert, a notice -- and deliberately NOT to empty states, which are the
   commonest block on a dashboard with no data in it. A page of gold boxes
   saying "nothing here yet" would shout where the reference murmurs. */
{$scope} [class*="-alert"],{$scope} [class*="-notice"]{border:0;border-left:4px solid var(--ea-gold);border-radius:16px;background:var(--ea-gold-soft);color:var(--ea-body)}

/* ---- empty states --------------------------------------------------------
   Quiet: an outline where a card would be, and muted text. Nothing is missing,
   there is simply nothing yet. */
{$scope} [class*="-empty"]{border:1px dashed var(--ea-line);border-radius:18px;background:transparent;box-shadow:none;color:var(--ea-muted);font-family:var(--ea-sans);font-weight:400}

/* ---- fields -------------------------------------------------------------- */
{$scope} [class*="-input"],{$scope} [class*="-select"],{$scope} [class*="-textarea"],{$scope} input[type="text"],{$scope} input[type="search"],{$scope} input[type="email"],{$scope} input[type="number"],{$scope} input[type="date"],{$scope} select,{$scope} textarea{border:1px solid var(--ea-line);border-radius:14px;background:var(--ea-cell-2);color:var(--ea-ink);font-family:var(--ea-sans);font-size:14.5px;font-weight:400}
{$scope} [class*="-input"]:focus,{$scope} select:focus,{$scope} textarea:focus{border-color:var(--ea-teal);box-shadow:0 0 0 3px rgba(53,191,178,.28)}
{$scope} [class*="-field"] label,{$scope} label{color:var(--ea-muted);font-family:var(--ea-display);font-size:12.5px;font-weight:700}
{$scope} option{background:var(--ea-cell-2);color:var(--ea-ink)}
{$scope} [type="checkbox"],{$scope} [type="radio"]{accent-color:var(--ea-teal)}

/* ---- tables -------------------------------------------------------------- */
{$scope} [class*="-table"],{$scope} table{border-color:var(--ea-line);color:var(--ea-body);font-family:var(--ea-sans);font-size:14.5px}
{$scope} th{background:transparent;border-color:var(--ea-line);color:var(--ea-muted);font-family:var(--ea-display);font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
{$scope} td{background:transparent;border-color:var(--ea-line-soft);color:var(--ea-body)}
{$scope} tbody tr:hover td{background:var(--ea-cell)}

/* ---- progress ------------------------------------------------------------
   Track dark, fill teal. Nothing here sets width: the pages compute that from
   real progress and it has to survive. */
{$scope} [class*="-bar"]:not([class*="-barbox"]),{$scope} [class*="-track"],{$scope} [class*="-meter"],{$scope} [class*="-progress"],{$scope} .pqh-stackbar{background:var(--ea-cell-2);border:0;border-radius:999px;box-shadow:none}
{$scope} [class*="-bar"]>i,{$scope} [class*="-bar"]>span,{$scope} [class*="-fill"],{$scope} .pqhsd-jc-bar i{background:var(--ea-teal);border-radius:999px;box-shadow:none}

/* ---- the student's course cards, reshaped into LearnUp's tile ------------
   This catalogue has no course photography, but every subject already
   carries a colour and an icon everywhere else in this app (the Cambridge
   subject badges) -- so that identity becomes the full-bleed band LearnUp
   fills with a photo, the level pill takes the corner LearnUp's duration
   badge sits in, and the progress line, bar and button below follow its own
   order: status text and its percentage share a row, the bar sits under
   that, the action is last. --jc/--jcd/--jct arrive inline per card already;
   --jct (a pale tint meant for a white card) stays unused here.

   Grid areas do the reordering. DOM order is unchanged -- head, pos,
   note-OR-todo, bar, pct, go -- grid places children by NAME, so the visual
   order does not have to match it. pos/pct/bar/go all fall inside the card's
   OWN padding (16px 15px 15px, set in student_dashboard.php and left alone),
   so none of them repeats that inset -- only .pqhsd-jc-head escapes it, and
   only by exactly its negative.

   row-gap is set explicitly, and small, for a reason that has nothing to do
   with the rows that ARE populated. grid-template-areas declares five ROWS
   whatever the course, and gap inserts space between every adjacent pair of
   them regardless of whether either side has content -- a course with no
   position text and no progress yet (pos and bar both genuinely absent from
   the DOM, not just empty) still pays for four gaps at whatever gap this
   card inherited, which was 11px from student_dashboard.php's own
   `.pqhsd-jc{gap:11px}` never having been overridden here: 44px of pure
   spacing on a card whose only real content is a greeting line and a button
   row. Reported directly off a production screenshot of exactly that card.
   3px keeps the rows that DO have content from touching without reserving
   anything close to that for the ones that don't. */
{$scope}{$scope} .pqhsd-jc{display:grid;grid-template-columns:1fr auto;grid-template-areas:"head head" "pos pos" "note pct" "bar bar" "go go";row-gap:3px;column-gap:10px;background:var(--ea-card);border:1px solid var(--ea-line);border-radius:26px;box-shadow:var(--ea-shadow-sm);overflow:hidden}
{$scope}{$scope} .pqhsd-jc:hover{border-color:var(--jc);box-shadow:var(--ea-shadow)}
/* 2026-09-08: the full-bleed colour band this had (a stand-in for the photo
   LearnUp's own card carries) is gone. Reported directly off a screenshot
   of a course grid with all eight subjects on screen at once: a fully
   saturated block per card, eight different hues in one glance, read as
   noise rather than as identity -- and it was never what the STATED
   reference asked for besides. The math page this whole redesign takes its
   fonts and colours from spends colour on a small marked TILE per strand
   (`.mark`, 62px, one colour) on an otherwise unbroken dark ground; it never
   once fills a card edge to edge with a saturated colour. The band was this
   sheet's own addition on top of that brief, modelled on LearnUp's card
   instead. Subject identity moves back to where the actual source of truth
   already puts it: the icon, in a soft tint of its own colour, matching the
   tinted-circle language the stat cards above already use -- so the two
   card families read as one system instead of two different colour
   mechanisms on the same page. color-mix() keeps this to one rule for every
   subject; the alternative was a per-subject soft-tint variable to add
   alongside --jc/--jcd/--jct for every course this catalogue has. */
{$scope}{$scope} .pqhsd-jc-head{grid-area:head;display:flex;align-items:center;gap:12px}
{$scope}{$scope} .pqhsd-jc-badge{background:color-mix(in srgb,var(--jc) 20%,var(--ea-cell));color:var(--jc);border-radius:14px}
{$scope}{$scope} .pqhsd-jc-name{color:var(--ea-ink);font-family:var(--ea-display);font-size:19.5px;font-weight:800;line-height:1.15}
/* Neutral now, not per-subject -- one more colour this pass was removing.
   The icon alone carries which subject this is; a second, different-hued
   signal on the same card was the "too many colours" complaint restated in
   miniature. */
{$scope}{$scope} .pqhsd-jc-level{background:var(--ea-teal-soft);border-color:var(--ea-teal-line);color:var(--ea-teal);font-family:var(--ea-display);font-size:10.5px;font-weight:800;letter-spacing:.05em;line-height:1;text-transform:uppercase}
/* Neutral for the same reason the level pill is: a bold, uppercase,
   saturated-colour eyebrow line is still a per-subject colour signal, even
   small, and this pass is about there being only one of those (the icon) per
   card, not several in decreasing loudness. */
{$scope}{$scope} .pqhsd-jc-pos{grid-area:pos;background:transparent;border:0;color:var(--ea-muted);font-family:var(--ea-display);font-size:12.5px;font-weight:700;letter-spacing:.06em;line-height:1.2;text-transform:uppercase}
{$scope}{$scope} .pqhsd-jc-note{grid-area:note;align-self:center;background:transparent;border:0;padding:0;color:var(--ea-body);font-size:14.5px;font-weight:400;line-height:1.25}
{$scope}{$scope} .pqhsd-jc-note b{color:var(--ea-ink);font-weight:700}
/* Coloured text, not a chip -- the chip's own box is what the grid reflow
   removes here, and "N to catch up" keeps its urgency as ink instead. Its
   inline <svg> uses stroke="currentColor", so it follows for free. */
{$scope}{$scope} .pqhsd-jc-todo{grid-area:note;align-self:center;background:transparent;border:0;padding:0;color:var(--ea-coral);font-size:14.5px;font-weight:700;line-height:1.25}
{$scope}{$scope} .pqhsd-jc-pct{grid-area:pct;align-self:center;justify-self:end;color:var(--ea-muted);font-family:var(--ea-display);font-size:13.5px;font-weight:800;line-height:1.2}
{$scope}{$scope} .pqhsd-jc-bar{grid-area:bar}
{$scope}{$scope} .pqhsd-jc-bar i{background:var(--jc)}
{$scope}{$scope} .pqhsd-jc-go{grid-area:go;margin-top:5px;padding-top:0;border-top:0}

/* ---- the teacher/parent course card ---------------------------------------
   No colour or icon token reaches this card -- it is built from a course
   record, not a subject -- so it keeps a plain surface rather than a head
   band with nothing to fill it. Its OWN corner badge (a launch-mode chip,
   teacher only) still moves to the band-less version of the same spot, and
   the rest -- title, meta, an optional grade-progress bar, status chips,
   actions -- becomes rows on one clean tile instead of the flat block it
   was. */
{$scope}{$scope} .pqh-course-card{position:relative;display:flex;flex-direction:column;gap:10px;background:var(--ea-card);border:1px solid var(--ea-line);border-radius:22px;box-shadow:var(--ea-shadow-sm);padding:18px}
{$scope}{$scope} .pqh-tccard__chip{position:absolute;top:14px;right:14px;background:var(--ea-teal-soft);border:1px solid var(--ea-teal-line);color:var(--ea-teal);border-radius:999px;font-family:var(--ea-display);font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px}
{$scope}{$scope} .pqh-course-card>span>h3{color:var(--ea-ink);font-family:var(--ea-display);font-size:17.5px;font-weight:800;padding-right:64px}
{$scope}{$scope} .pqh-tccard__meta,{$scope}{$scope} .pqh-course-card__number{color:var(--ea-muted);font-size:12.5px;font-weight:600}
{$scope}{$scope} .pqh-tccard__bar{display:block;height:8px;margin-top:8px;border-radius:999px;background:var(--ea-cell-2)}
{$scope}{$scope} .pqh-tccard__bar i{display:block;height:100%;border-radius:999px;background:var(--ea-teal)}
{$scope}{$scope} .pqh-tccard__chips{display:flex;flex-wrap:wrap;gap:6px}
{$scope}{$scope} .pqh-course-card__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}

/* ---- icon tiles ----------------------------------------------------------
   Everywhere else an icon sits in a small square: the to-do rows, the feedback
   list, the young-learner cards. The reference's --mark tile, sized down, with
   the state colour on the glyph rather than behind it. */
{$scope} [class*="__ico"],{$scope} [class*="-ico"],{$scope} [class*="__icon"]{background:var(--ea-cell-2);border-radius:14px;color:var(--ea-teal)}
{$scope}{$scope} [class*="__ico--ok"]{background:var(--ea-green-soft);color:var(--ea-green)}
{$scope}{$scope} [class*="__ico--warn"]{background:var(--ea-gold-soft);color:var(--ea-gold)}
{$scope}{$scope} [class*="__ico--risk"]{background:var(--ea-coral-soft);color:var(--ea-coral)}
{$scope}{$scope} [class*="__ico--info"]{background:var(--ea-sky-soft);color:var(--ea-sky)}

/* ---- the young-learner cards ---------------------------------------------
   Four big tiles for a managed learner. They were four pastels on white; they
   take the reference's four marks instead, in its own order. */
{$scope}{$scope} .pqh-ycard{background:var(--ea-card);border:1px solid var(--ea-line);border-radius:26px;box-shadow:var(--ea-shadow-sm);color:var(--ea-ink)}
{$scope}{$scope} .pqh-ycard--1{border-color:var(--ea-teal)}
{$scope}{$scope} .pqh-ycard--2{border-color:var(--ea-gold)}
{$scope}{$scope} .pqh-ycard--3{border-color:var(--ea-coral)}
{$scope}{$scope} .pqh-ycard--4{border-color:var(--ea-plum)}
{$scope}{$scope} .pqh-ystars{background:transparent;border:0;color:var(--ea-gold)}

/* ---- the rail and the top bar --------------------------------------------
   These have to beat pqh_duolingo_chrome_css, which writes the app bar at
   (0,4,0) -- so the extra class is written by hand here and the forcing pass
   adds one more. The rail becomes the darker end of the same ground rather
   than a navy slab beside a navy page, which is the join that sheet was
   solving for while the page was still light. */
{$scope}{$scope} .pqh-gnav.pqh-gnav{background:rgba(11,29,44,.66);border-right:1px solid var(--ea-line)}
{$scope}{$scope} .pqh-gnav__mark.pqh-gnav__mark{background:var(--ea-teal);color:var(--ea-teal-ink);border-radius:16px;box-shadow:0 4px 0 var(--ea-teal-deep);font-family:var(--ea-display);font-weight:800}
{$scope}{$scope} .pqh-gnav__name.pqh-gnav__name{color:var(--ea-ink);font-family:var(--ea-display);font-size:14.5px;font-weight:800;letter-spacing:-.01em}
{$scope}{$scope} .pqh-gnav__item.pqh-gnav__item{border:1px solid transparent;border-radius:14px;background:transparent;color:var(--ea-body);font-family:var(--ea-display);font-size:12.5px;font-weight:700;letter-spacing:.02em;line-height:1.2;text-transform:none}
{$scope}{$scope} .pqh-gnav__item.pqh-gnav__item:hover{background:rgba(255,255,255,.07);color:var(--ea-ink)}
{$scope}{$scope} .pqh-gnav__item.is-active{background:var(--ea-teal-soft);border-color:var(--ea-teal-line);color:var(--ea-teal)}
{$scope}{$scope} .pqh-gnav__foot.pqh-gnav__foot{border-top:1px solid var(--ea-line)}
{$scope}{$scope} .pqh-gnav__foot .pqh-gnav__item{color:var(--ea-muted)}
{$scope}{$scope} .pqh-gnav__foot a.pqh-gnav__item:hover{color:var(--ea-coral)}
{$scope}{$scope} .pqh-gnav__foot a.pqh-gnav__item:hover svg{color:var(--ea-coral)}

/* One colour per destination, the way the reference gives one mark per strand.
   Keyed on position for the reason the sheet this replaces gives: the rail's
   contents differ by role and by page, so any row landing on any of these is
   correct, and a rail longer than the cycle repeats it. nth-child counts the
   brand link as 1, so the first nav row is 2. */
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(2) svg{color:var(--ea-teal)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(3) svg{color:var(--ea-gold)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(4) svg{color:var(--ea-coral)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(5) svg{color:var(--ea-plum)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(6) svg{color:var(--ea-green)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(7) svg{color:var(--ea-sky)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(8) svg{color:var(--ea-teal)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(9) svg{color:var(--ea-gold)}
{$scope}{$scope} .pqh-gnav__item.is-active svg{color:var(--ea-teal)}

{$scope}{$scope} .pqh-appbar.pqh-appbar{min-height:64px;background:rgba(11,29,44,.78);background-image:none;border-bottom:1px solid var(--ea-line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:none}
{$scope}{$scope} .pqh-appbar__brand.pqh-appbar__brand{color:var(--ea-ink);font-family:var(--ea-display);font-weight:800}
{$scope}{$scope} .pqh-appbar__nav a,{$scope}{$scope} .pqh-appbar__nav button{box-sizing:border-box;min-height:40px;padding:0 16px;border:1px solid var(--ea-line);border-radius:999px;background:rgba(255,255,255,.05);color:var(--ea-body);font-family:var(--ea-display);font-size:12.5px;font-weight:700;letter-spacing:.02em;line-height:1.2;text-transform:none;box-shadow:none}
{$scope}{$scope} .pqh-appbar__nav a:hover,{$scope}{$scope} .pqh-appbar__nav button:hover{background:var(--ea-cell);border-color:var(--ea-teal);color:var(--ea-ink)}
{$scope}{$scope} .pqh-appbar__nav a.pqh-appbar__icon{width:40px;padding:0}
{$scope}{$scope} .pqh-appbar__nav .pqh-appbar__logout{background:var(--ea-gold);border-color:var(--ea-gold);color:var(--ea-gold-ink);box-shadow:0 4px 0 var(--ea-gold-press)}
{$scope}{$scope} .pqh-appbar__nav .pqh-appbar__logout:hover{background:var(--ea-gold);border-color:var(--ea-gold);color:var(--ea-gold-ink);filter:brightness(1.06)}
{$scope}{$scope} .pqh-appbar__nav .pqh-appbar__logout:active{transform:translateY(2px);box-shadow:0 2px 0 var(--ea-gold-press)}

/* ---- narrow viewports ----------------------------------------------------
   BOTH media queries below carry the scope THREE times by hand, and that is
   not decoration. pqh_css_force_and_specify() skips any line beginning with
   '@', so it doubles the unconditional rules above and not these -- an
   ordinary "{$scope} .x" here is (0,2,0) against a doubled (0,3,0) outside and
   the whole query is silently dead. The same trap is documented, and paid for,
   in pqh_openproject_skin_css().

   The pill goes back to a compact size below 900px, and the rows it sits in
   are allowed to wrap. A reference-sized 42px pill with 20px of side padding
   is right beside a card and wrong at the end of a to-do row on a phone.

   Measured on dashboard.php at 375px, loaded at that width rather than resized
   into it: the to-do row overflowed the viewport by 8px BEFORE this sheet
   existed, because those rows are a flex that does not wrap, and the
   reference-sized pill took that to 20px. Compacting the pill and letting the
   row wrap closes both -- the 12px this sheet added and the 8px it found. That
   is one step past "leave it no worse": the row is the element being restyled
   here, so it is not somebody else's bug being fixed in passing. */
@media(max-width:900px){{$scope}{$scope}{$scope} [class*="-btn"],{$scope}{$scope}{$scope} [class*="-cta"],{$scope}{$scope}{$scope} .pqh-ybig,{$scope}{$scope}{$scope} .pqh-top-action,{$scope}{$scope}{$scope} .pqh-back{min-height:36px;padding:0 13px;font-size:13px}{$scope}{$scope}{$scope} [class*="__item"],{$scope}{$scope}{$scope} [class*="-row"]:not([class*="-rows"]){flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){{$scope}{$scope}{$scope} [class*="-btn"],{$scope}{$scope}{$scope} [class*="-cta"],{$scope}{$scope}{$scope} .pqhsd-jc{transition:none}{$scope}{$scope}{$scope} [class*="-btn"]:active,{$scope}{$scope}{$scope} [class*="-cta"]:active{transform:none}}
CSS;

    // The fonts have to lead the sheet -- a browser drops an @import that does
    // not. If Google Fonts is blocked the stack falls through to Segoe UI and
    // only the typeface changes, which is the same bargain the skin makes.
    // $body no longer needs folding in here -- pqh_ehel_tokens_css() already
    // returns it prepended to the token/ground/ink-reset text, and $css above
    // is that return value plus this function's own component heredoc.
    return "@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap');\n"
        . pqh_css_force_and_specify($css);
}

/**
 * The live group board, in the same visual language as the dashboards --
 * reused per the owner's 2026-09-07 request ("using the new dashboard
 * design/colors but make more functional for the teacher... it is not
 * serving well due to the design of the page and the way information is
 * organized").
 *
 * SAME LAYERING AS pqh_ehel_academy_css(): emitted last (after
 * pqh_viewer_chrome_css()), wins the same way via pqh_css_force_and_specify(),
 * and does not touch the board's own ~135-line light-theme <style> block or
 * ANY of its JS -- the class names below are exactly the ones
 * live_group_board.php's render()/tileHtml() already emit. That is
 * deliberate: the sort order, the state computation (liveState()), the
 * Wehel-vs-learning-time ledger split and the .is-flagged selective
 * highlighting are the carefully-documented, safety-relevant parts of this
 * page (CLAUDE.md's "live group board" section), and none of them are a
 * styling concern -- every improvement asked for here is reachable by
 * restyling and CSS-reordering the fixed markup those functions already
 * produce.
 *
 * WHAT "MORE FUNCTIONAL" MEANT HERE, since the request named no specific
 * changes: three information-architecture calls, all reversible by editing
 * this function alone and none of them touching a single other file.
 *
 *   1. The place-line pills (course / position / done-count / Wehel-minutes)
 *      go from four saturated hues to one neutral treatment. They are
 *      CONTEXT, not state -- the same "too many colours" lesson just applied
 *      to the dashboard's course cards, arriving on a page where the stakes
 *      are higher: four hues of context were competing for attention with
 *      the one thing that matters here, the coloured left border and the
 *      flag row that say a learner needs it.
 *   2. The flag chips (hand / moved / cycle / ok / bad / warn / live / time)
 *      keep their distinct colours -- this row IS the actionable layer -- but
 *      are now reordered by severity with CSS `order`, so a tile with three
 *      flags shows the one to act on first leftmost, regardless of the order
 *      tileHtml() happened to push them onto the array in.
 *   3. The totals row becomes icon-led stat tiles, matching the dashboard's
 *      KPI cards, so the seven headline numbers scan as a dashboard rather
 *      than a row of bare figures -- purely a `::before`-icon plus CSS-grid
 *      restructuring of the same `<div class="pqlgb-total">`, no markup
 *      change.
 *
 * @param string $scope the page's shell class, with its leading dot
 * @param string $bodyclass the page's body class, so the ground reaches the
 *                          overscroll area behind the shell ('' to skip)
 */
/**
 * The board COMPONENTS: totals row, tiles, pills, flags, the chat column and
 * the page chrome. One definition, two boards.
 *
 * It was inline in live_group_board.php, where it was the only copy and could
 * not be reached by the parent board -- which therefore loaded 34KB of
 * pqh_ehel_group_board_css() re-skin over components that did not exist, and
 * hand-rolled its own approximations underneath. Both sheets take a $prefix
 * now, so a parent tile IS a teacher tile rather than a second drawing of one.
 *
 * The teacher's rendered bytes are unchanged: the extraction is verified
 * byte-identical against the block it came from, which is the only thing that
 * makes moving a stylesheet out of a page a safe edit rather than a redesign.
 */
function pqh_ehel_board_components_css(string $prefix = 'pqlgb', string $bodyclass = 'pqlgb-page'): string {
    return <<<CSS
.{$prefix}{font-family:var(--op-font);color:var(--op-ink);max-width:1240px;margin:0 auto;padding:4px 0 40px}
.{$prefix}-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 16px;margin-bottom:16px;background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius)}
.{$prefix}-spacer{flex:1 1 auto}
.{$prefix}-form{display:flex;align-items:center;gap:8px}
.{$prefix}-form label{font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--op-ink-soft)}
.{$prefix}-select{min-height:34px;padding:0 8px;border:1px solid var(--op-line-strong);border-radius:var(--op-radius);background:var(--op-surface);color:var(--op-ink);font-family:var(--op-font);font-size:13px;font-weight:700}
.{$prefix}-freshness{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--op-ink-soft)}
.{$prefix}-dot{width:8px;height:8px;border-radius:50%;background:#2f8f5b;flex:none}
.{$prefix}-freshness.is-stale .{$prefix}-dot{background:var(--op-ink-faint)}
.{$prefix}-freshness.is-failing .{$prefix}-dot{background:#b02a37}

/* Grid, not wrapping flex: with flex:1 1 150px a fourth tile that does not fit
   wraps alone and then GROWS to the full row, so "Not started" ends up the
   widest thing on the board. auto-fit keeps them equal and wraps 2x2. */
.{$prefix}-totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.{$prefix}-total{padding:11px 14px;background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius)}
.{$prefix}-total b{display:block;font-size:24px;font-weight:900;line-height:1.1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.{$prefix}-total span{display:block;margin-top:2px;font-size:12px;font-weight:700;color:var(--op-ink-soft)}
.{$prefix}-total.is-flagged b{color:#b02a37}

.{$prefix}-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;align-items:start}
.{$prefix}-group{background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius);overflow:hidden}
.{$prefix}-group-head{display:flex;align-items:baseline;gap:10px;padding:12px 14px;border-bottom:1px solid var(--op-line);background:var(--op-surface-tint)}
.{$prefix}-group-head h3{margin:0;font-size:15px;font-weight:900}
.{$prefix}-group-head span{font-size:12px;font-weight:700;color:var(--op-ink-soft)}
.{$prefix}-golive{margin-left:auto;border:1px solid #052c65;background:#0d6efd;color:#fff;border-radius:999px;padding:3px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.{$prefix}-golive:disabled{opacity:.6;cursor:default}
a.{$prefix}-golive{text-decoration:none;display:inline-block}
.{$prefix}-golive.is-upcoming{background:transparent;color:#052c65;border-color:#9ec5fe}
.{$prefix}-tiles{display:flex;flex-direction:column}

.{$prefix}-tile{display:grid;grid-template-columns:38px 1fr auto;gap:11px;padding:11px 14px;border-bottom:1px solid var(--op-line);border-left:3px solid transparent}
.{$prefix}-tile:last-child{border-bottom:0}
.{$prefix}-tile--alert{border-left-color:#b02a37;background:var(--op-bad-bg)}
.{$prefix}-tile--warn{border-left-color:#997404;background:var(--op-warn-bg)}
.{$prefix}-tile--nodata{border-left-color:var(--op-line-strong);background:var(--op-surface-soft)}
/* A raised hand is the only state the LEARNER declared, so it gets the one
   saturated treatment on the board and outranks every inferred colour. */
.{$prefix}-tile--hand{border-left-color:#1a67a3;background:var(--op-primary-subtle)}
.{$prefix}-tile--hand .{$prefix}-avatar{background:#1a67a3;color:#fff}
.{$prefix}-tile--hand .{$prefix}-quiet b{color:var(--op-primary-emphasis)}
.{$prefix}-answer{margin-top:6px;min-height:28px;padding:0 10px;border:1px solid #1a67a3;border-radius:var(--op-pill);background:#1a67a3;color:#fff;font-family:var(--op-font);font-size:11.5px;font-weight:800;cursor:pointer}
.{$prefix}-answer:hover{background:var(--op-primary-hover);border-color:var(--op-primary-hover)}
.{$prefix}-answer[disabled]{opacity:.55;cursor:default}
.{$prefix}-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--op-primary-subtle);color:var(--op-primary-emphasis);font-size:13px;font-weight:900;letter-spacing:.02em}
.{$prefix}-tile--alert .{$prefix}-avatar{background:#f1aeb5;color:#58151c}
.{$prefix}-tile--warn .{$prefix}-avatar{background:#ffe69c;color:#664d03}
.{$prefix}-who{min-width:0}
.{$prefix}-who b{display:block;font-size:14px;font-weight:800;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.{$prefix}-where{margin-top:3px;display:flex;flex-wrap:wrap;gap:4px;font-size:11.5px;color:var(--op-ink-muted);line-height:1.4}
.{$prefix}-pl{display:inline-flex;align-items:center;padding:1px 8px;border:1px solid;border-radius:999px;font-weight:700;white-space:nowrap}
.{$prefix}-pl--course{background:#edf3fc;border-color:#d5e3f8;color:#17498f}
.{$prefix}-pl--pos{background:#cff4fc;border-color:#9eeaf9;color:#055160}
.{$prefix}-pl--done{background:#f7d6e6;border-color:#efadce;color:#801f4f}
.{$prefix}-pl--wehel{background:#e2d9f3;border-color:#c5b3e6;color:#432874}
.{$prefix}-pl--words{background:#d2f4ea;border-color:#a6e9d5;color:#114e3d}
.{$prefix}-flags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.{$prefix}-flag{display:inline-flex;align-items:center;padding:2px 7px;border:1px solid var(--op-line-strong);border-radius:var(--op-pill);background:var(--op-surface);font-size:11px;font-weight:800;letter-spacing:.02em}
.{$prefix}-flag--bad{border-color:#f1aeb5;background:#f8d7da;color:#58151c}
.{$prefix}-flag--warn{border-color:#ffe69c;background:#fff3cd;color:#664d03}
.{$prefix}-flag--ok{border-color:#a3cfbb;background:#d1e7dd;color:#0a3622}
.{$prefix}-flag--moved{border-color:#a3cfbb;background:#d1e7dd;color:#0a3622}
.{$prefix}-flag--cycle{border-color:#ced4da;background:#e9ecef;color:#41464b}
.{$prefix}-flag--time{border-color:#a6e9d5;background:#d2f4ea;color:#114e3d}
/* A raised hand is the one thing on this board the learner said out loud, and
   its flag had been rendering with no rule of its own since the feature
   shipped -- it read as an ordinary grey pill among the inferred signals it is
   meant to outrank. Blue rather than red: it is a request for help, not a
   fault. */
.{$prefix}-flag--hand{border-color:#9ec5fe;background:#cfe2ff;color:#052c65}
/* In Wehel right now. Same blue family as the hand, one step quieter: both say
   "this learner is already getting help", which is the reading that changes
   what the teacher does next. */
.{$prefix}-flag--live{border-color:#9ec5fe;background:#e7f1ff;color:#084298}
.{$prefix}-reason{margin-top:6px;padding:6px 8px;border-left:2px solid #f1aeb5;background:var(--op-surface);font-size:12px;font-style:italic;color:var(--op-ink-muted);line-height:1.4}
.{$prefix}-quiet{text-align:right;white-space:nowrap}
.{$prefix}-quiet b{display:block;font-size:17px;font-weight:900;line-height:1.15;font-variant-numeric:tabular-nums}
.{$prefix}-quiet span{display:block;margin-top:1px;font-size:11px;font-weight:700;color:var(--op-ink-soft);text-transform:uppercase;letter-spacing:.4px}
.{$prefix}-tile--alert .{$prefix}-quiet b{color:#b02a37}
.{$prefix}-tile--warn .{$prefix}-quiet b{color:#997404}

.{$prefix}-empty{padding:26px 16px;text-align:center;font-size:14px}
.{$prefix}-note{margin-top:18px;padding:12px 14px;background:var(--op-surface);border:1px solid var(--op-line);border-left:3px solid var(--op-primary);border-radius:var(--op-radius);font-size:12.5px;color:var(--op-ink-muted);line-height:1.55}
.{$prefix}-note b{color:var(--op-ink)}
.{$prefix}-noscript{padding:14px 16px;margin-bottom:16px;background:var(--op-warn-bg);border:1px solid var(--op-warn-line);border-radius:var(--op-radius);color:var(--op-warn-ink);font-size:13.5px;font-weight:700}
@media (max-width:640px){.{$prefix}-groups{grid-template-columns:1fr}}
/* The classroom chat, on the right of the tiles. A column rather than an
   overlay, because the board is left open all session and a drawer that covers
   tiles hides the thing the page exists to show. */
.{$prefix}-cols{display:flex;gap:16px;align-items:start}
.{$prefix}-main{flex:1;min-width:0}
.{$prefix}-chat{width:320px;flex:0 0 320px;background:var(--op-surface);border:1px solid var(--op-line-strong);border-radius:10px;display:flex;flex-direction:column;max-height:78vh;position:sticky;top:72px}
.{$prefix}-chat-head{padding:10px 12px;border-bottom:1px solid var(--op-line-strong);font-weight:800;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.{$prefix}-chat-tab{border:1px solid var(--op-line-strong);background:transparent;border-radius:999px;padding:3px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.{$prefix}-chat-tab.is-active{background:#cfe2ff;border-color:#9ec5fe;color:#052c65}
.{$prefix}-chat-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;min-height:120px}
.{$prefix}-chat-msg{max-width:92%;padding:7px 10px;border-radius:10px;background:#f1f3f5;font-size:13px;line-height:1.4}
.{$prefix}-chat-msg b{display:block;font-size:11px;margin-bottom:2px;opacity:.75}
.{$prefix}-chat-msg.is-mine{align-self:flex-end;background:#cfe2ff}
/* A learner's message: only the teacher and the child see it, and the tint
   says so — it must not read like something the room saw. */
.{$prefix}-chat-msg.is-private{background:#fff3cd;border:1px solid #ffe69c}
.{$prefix}-chat-msg.is-private small{display:block;font-size:10px;color:#664d03;margin-top:3px}
.{$prefix}-chat-empty{color:var(--op-muted,#6c757d);font-size:13px;padding:8px 2px}
.{$prefix}-chat-form{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border-top:1px solid var(--op-line-strong)}
.{$prefix}-chat-chip{width:100%;font-size:11px;color:#664d03;background:#fff3cd;border:1px solid #ffe69c;border-radius:8px;padding:4px 8px}
.{$prefix}-chat-chip-x{border:none;background:transparent;color:inherit;font:inherit;cursor:pointer;font-weight:800}
.{$prefix}-chat-quote{display:block;font-size:11px;font-style:italic;opacity:.8;border-left:3px solid #9ec5fe;padding-left:6px;margin-bottom:4px}
.{$prefix}-chat-msg.is-announcement{background:#052c65;color:#fff;max-width:100%;font-weight:700}
.{$prefix}-chat-msg.is-announcement b{opacity:.85}
.{$prefix}-chat-mega{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.85;margin-bottom:3px}
.{$prefix}-chat-announce{border:1px solid #052c65;background:transparent;color:#052c65;border-radius:8px;padding:3px 9px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.{$prefix}-chat-answer{display:block;margin-top:5px;border:1px solid #052c65;background:transparent;color:#052c65;border-radius:999px;padding:2px 9px;font:inherit;font-size:11px;font-weight:700;cursor:pointer}
.{$prefix}-chat-shot{display:block;max-width:100%;max-height:140px;object-fit:cover;object-position:top;border-radius:8px;margin-top:4px;cursor:zoom-in}
.{$prefix}-shot-lightbox{position:fixed;inset:0;z-index:120;background:rgba(10,30,45,.85);display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out}
.{$prefix}-shot-lightbox img{max-width:96vw;max-height:92vh;border-radius:10px;box-shadow:0 12px 48px rgba(0,0,0,.5);background:#fff}
.{$prefix}-chat-form input{flex:1;border:1px solid var(--op-line-strong);border-radius:8px;padding:7px 10px;font:inherit;font-size:13px;min-width:0}
.{$prefix}-chat-form button{border:1px solid #052c65;background:#0d6efd;color:#fff;border-radius:8px;padding:7px 14px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
@media (max-width:900px){.{$prefix}-cols{flex-direction:column}.{$prefix}-chat{width:100%;flex:1 1 auto;position:static;max-height:50vh}}

/* ---- the teacher-dashboard family's chrome: Moodle furniture hidden, the
   shared rail + app bar, and a workspace-style header card. Modelled on
   teacher_workspace.php so the board reads as a sibling of the pages the
   dashboard links, not a bare Moodle page. ---- */
body.{$bodyclass} header,body.{$bodyclass} footer,body.{$bodyclass} nav.navbar,body.{$bodyclass} #page-header,body.{$bodyclass} #page-footer,body.{$bodyclass} .drawer,body.{$bodyclass} .drawer-toggles,body.{$bodyclass} .block-region,body.{$bodyclass} [data-region="drawer"],body.{$bodyclass} [data-region="right-hand-drawer"]{display:none!important}
body.{$bodyclass} #page,body.{$bodyclass} #page-content,body.{$bodyclass} #region-main,body.{$bodyclass} .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.{$prefix}-shell{min-height:100vh;background:var(--op-canvas);font-family:var(--op-font);color:var(--op-ink)}
.{$prefix}-wrap{margin:0 auto}
.{$prefix}-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px;padding:20px 22px;background:#fff;border:1px solid #e4e9ef;border-radius:14px}
.{$prefix}-top h1{margin:0;font-size:26px;font-weight:800;letter-spacing:-.02em;color:#0f2237}
.{$prefix}-top p{margin:6px 0 0;color:#5b6b7c;font-size:14px;font-weight:500}
.{$prefix}-top-actions{display:flex;flex-wrap:wrap;gap:9px}
.{$prefix}-top-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid #e4e9ef;border-radius:10px;background:#fff;color:#0f2237!important;text-decoration:none;font-size:13px;font-weight:650}
.{$prefix}-top-actions a:hover{background:#edf3fc;border-color:#e0ebfa;text-decoration:none}
@media(max-width:560px){.{$prefix}-top{display:block}.{$prefix}-top-actions{margin-top:10px}}
CSS;
}

// $prefix is the CLASS prefix this sheet is written for. It defaults to the
// teacher board's own, so that call is unchanged and its output is verified
// byte-identical; the parent board passes 'pqpb'.
//
// It needed one because every component rule in here was a hardcoded
// `.pqlgb-` literal while the function took only a $scope. The parent board
// called it, got the 34KB, and matched NONE of the tiles, chips, pills or
// totals - it wore the chrome and had to hand-roll everything inside it. A
// stylesheet that silently applies to nothing is the same failure shape as a
// gate that is green because it did no work.
function pqh_ehel_group_board_css(string $scope, string $bodyclass = '', string $prefix = 'pqlgb', array $totalicons = []): string {
    // Seven icons for the totals row, one per position -- position is stable
    // here (render()'s totalsHtml array is a fixed seven-row literal, always
    // in this order: hands, in-Wehel, done-this-cycle, learners-on-screen,
    // quiet, left-the-page, not-started), unlike the dashboard's subject
    // cards where position is arbitrary. Colour is a visual rhythm only, not
    // a severity signal -- severity stays entirely on the .is-flagged rule
    // below, which recolours the NUMBER independent of the icon, exactly
    // preserving the board's own pre-existing mechanism for that.
    $pqlgbiconhand = pqh_ehel_icon_data_uri('#6FB6E8', '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v8"/><path d="M17 11.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5c-2.4 0-4-.8-5.5-2.8l-2.7-4.4c-.6-1 .4-2.1 1.5-1.6L8 14"/>');
    $pqlgbiconstar = pqh_ehel_icon_data_uri('#B78BD1', '<path d="M12 2.5 14.6 9l7 .6-5.3 4.6 1.6 6.8L12 17.6l-6 3.4 1.6-6.8L2.3 9.6l7-.6L12 2.5z"/>');
    $pqlgbicondata = pqh_ehel_icon_data_uri('#35BFB2', '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/>');
    $pqlgbiconusers = pqh_ehel_icon_data_uri('#4FD1A0', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
    $pqlgbiconalert = pqh_ehel_icon_data_uri('#ED8E70', '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>');
    $pqlgbiconexit = pqh_ehel_icon_data_uri('#6FB6E8', '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>');
    $pqlgbiconcalendar = pqh_ehel_icon_data_uri('#B78BD1', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>');

    // The totals row's icons are POSITIONAL, and position only carries meaning
    // while the board emitting them keeps a fixed row order -- which the
    // teacher's render() does, in a seven-row literal. A second board with a
    // different order inherits this one's meanings silently: the parent
    // board's FIRST total is its children, and it would have been handed the
    // raised-hand icon. So the order is an argument now, and each board states
    // its own; the default is the teacher's seven, unchanged.
    $pqlgbiconclock = pqh_ehel_icon_data_uri('#4FD1A0', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
    $pqlgbicons = [
        'hand' => $pqlgbiconhand, 'star' => $pqlgbiconstar, 'data' => $pqlgbicondata,
        'users' => $pqlgbiconusers, 'alert' => $pqlgbiconalert, 'exit' => $pqlgbiconexit,
        'calendar' => $pqlgbiconcalendar, 'clock' => $pqlgbiconclock,
    ];
    if (!$totalicons) {
        $totalicons = ['hand', 'star', 'data', 'users', 'alert', 'exit', 'calendar'];
    }
    $totaliconlines = [];
    foreach (array_values($totalicons) as $pqlgbi => $pqlgbkey) {
        if (!isset($pqlgbicons[$pqlgbkey])) {
            continue;   // an unknown name draws no icon rather than a broken one
        }
        $totaliconlines[] = $scope . ' .' . $prefix . '-total:nth-child(' . ($pqlgbi + 1)
            . ')::before{background-image:' . $pqlgbicons[$pqlgbkey] . '}';
    }
    $totaliconcss = implode("
", $totaliconlines);   // never PHP_EOL: CRLF here would rewrite every byte of the teacher sheet
    $css = pqh_ehel_tokens_css($scope, $bodyclass) . "\n\n" . <<<CSS
/* ---- the app bar and rail, same treatment as the dashboards' -------------
   Duplicated from pqh_ehel_academy_css() rather than hoisted into
   pqh_ehel_tokens_css() alongside it: that function's own output is verified
   byte-identical against its pre-refactor form for both dashboard call
   sites, and moving a rule that reorders the cascade is not a change a
   string-equality check can wave through on trust -- repetition is the
   cheaper thing to be wrong about.

   The rail copy is not optional the way a second dashboard-style component
   might be: pqh_ehel_tokens_css()'s own ink-reset sets
   `{$scope}{$scope} a:where(:not([style*="color"])){color:var(--ea-teal)}`,
   and .pqh-gnav__item is exactly such a plain anchor (pqh_design_shell_html()
   emits it with no inline style). Left at that, EVERY rail link -- not just
   the active one -- renders teal, at 3.41:1 against the rail's own
   background, measured in a sweep of the rendered page. Academy's hand-
   doubled `.pqh-gnav__item.pqh-gnav__item` (specificity (0,4,0)) is what
   already beats the reset's (0,2,1) on the dashboards; without the same
   override here the group board's rail would ship that failure for real,
   not hypothetically -- the sweep found it on THIS page, not by inspection. */
{$scope}{$scope} .pqh-appbar.pqh-appbar{min-height:64px;background:rgba(11,29,44,.78);background-image:none;border-bottom:1px solid var(--ea-line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:none}
{$scope}{$scope} .pqh-appbar__brand.pqh-appbar__brand{color:var(--ea-ink);font-family:var(--ea-display);font-weight:800}
{$scope}{$scope} .pqh-appbar__nav a,{$scope}{$scope} .pqh-appbar__nav button{box-sizing:border-box;min-height:40px;padding:0 16px;border:1px solid var(--ea-line);border-radius:999px;background:rgba(255,255,255,.05);color:var(--ea-body);font-family:var(--ea-display);font-size:12.5px;font-weight:700;letter-spacing:.02em;line-height:1.2;text-transform:none;box-shadow:none}
{$scope}{$scope} .pqh-appbar__nav a:hover,{$scope}{$scope} .pqh-appbar__nav button:hover{background:var(--ea-cell);border-color:var(--ea-teal);color:var(--ea-ink)}
{$scope}{$scope} .pqh-appbar__nav a.pqh-appbar__icon{width:40px;padding:0}
{$scope}{$scope} .pqh-appbar__nav .pqh-appbar__logout{background:var(--ea-gold);border-color:var(--ea-gold);color:var(--ea-gold-ink);box-shadow:0 4px 0 var(--ea-gold-press)}
{$scope}{$scope} .pqh-appbar__nav .pqh-appbar__logout:hover{background:var(--ea-gold);border-color:var(--ea-gold);color:var(--ea-gold-ink);filter:brightness(1.06)}
{$scope}{$scope} .pqh-appbar__nav .pqh-appbar__logout:active{transform:translateY(2px);box-shadow:0 2px 0 var(--ea-gold-press)}
{$scope}{$scope} .pqh-gnav.pqh-gnav{background:rgba(11,29,44,.66);border-right:1px solid var(--ea-line)}
{$scope}{$scope} .pqh-gnav__mark.pqh-gnav__mark{background:var(--ea-teal);color:var(--ea-teal-ink);border-radius:16px;box-shadow:0 4px 0 var(--ea-teal-deep);font-family:var(--ea-display);font-weight:800}
{$scope}{$scope} .pqh-gnav__name.pqh-gnav__name{color:var(--ea-ink);font-family:var(--ea-display);font-size:14.5px;font-weight:800;letter-spacing:-.01em}
{$scope}{$scope} .pqh-gnav__item.pqh-gnav__item{border:1px solid transparent;border-radius:14px;background:transparent;color:var(--ea-body);font-family:var(--ea-display);font-size:12.5px;font-weight:700;letter-spacing:.02em;line-height:1.2;text-transform:none}
{$scope}{$scope} .pqh-gnav__item.pqh-gnav__item:hover{background:rgba(255,255,255,.07);color:var(--ea-ink)}
{$scope}{$scope} .pqh-gnav__item.is-active{background:var(--ea-teal-soft);border-color:var(--ea-teal-line);color:var(--ea-teal)}
{$scope}{$scope} .pqh-gnav__foot.pqh-gnav__foot{border-top:1px solid var(--ea-line)}
{$scope}{$scope} .pqh-gnav__foot .pqh-gnav__item{color:var(--ea-muted)}
{$scope}{$scope} .pqh-gnav__foot a.pqh-gnav__item:hover{color:var(--ea-coral)}
{$scope}{$scope} .pqh-gnav__foot a.pqh-gnav__item:hover svg{color:var(--ea-coral)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(2) svg{color:var(--ea-teal)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(3) svg{color:var(--ea-gold)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(4) svg{color:var(--ea-coral)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(5) svg{color:var(--ea-plum)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(6) svg{color:var(--ea-green)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(7) svg{color:var(--ea-sky)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(8) svg{color:var(--ea-teal)}
{$scope}{$scope} .pqh-gnav>.pqh-gnav__item:nth-child(9) svg{color:var(--ea-gold)}
{$scope}{$scope} .pqh-gnav__item.is-active svg{color:var(--ea-teal)}

/* ---- the header card ------------------------------------------------------
   .{$prefix}-top keeps its light-theme rule (#fff/#e4e9ef/#0f2237/#5b6b7c) in the
   page's own <style> block untouched -- these are the literal-colour
   overrides pqh_ehel_academy_css()'s own docblock calls "the chips at the
   end of this sheet". h1 needs none of its own: the ink-reset above already
   colours every {$scope} heading var(--ea-ink) in var(--ea-display), at
   (0,2,1) after doubling against the page's own (0,1,1) .{$prefix}-top h1 rule. */
{$scope} .{$prefix}-top{background:var(--ea-card);border:1px solid var(--ea-line);box-shadow:var(--ea-shadow-sm)}
{$scope} .{$prefix}-top p{color:var(--ea-body)}
{$scope} .{$prefix}-top-actions a{border-color:var(--ea-line);background:var(--ea-cell);color:var(--ea-ink)}
{$scope} .{$prefix}-top-actions a:hover{background:var(--ea-cell-2);border-color:var(--ea-teal)}

/* ---- the filter bar ------------------------------------------------------ */
{$scope} .{$prefix}-bar{background:var(--ea-card);border-color:var(--ea-line)}
{$scope} .{$prefix}-form label{color:var(--ea-muted)}
{$scope} .{$prefix}-select{background:var(--ea-cell);border-color:var(--ea-line);color:var(--ea-ink)}
{$scope} .{$prefix}-select:focus-visible{border-color:var(--ea-teal)}
{$scope} .{$prefix}-freshness{color:var(--ea-muted)}
{$scope} .{$prefix}-dot{background:var(--ea-green)}
{$scope} .{$prefix}-freshness.is-stale .{$prefix}-dot{background:var(--ea-muted)}
{$scope} .{$prefix}-freshness.is-failing .{$prefix}-dot{background:var(--ea-coral)}
{$scope} .{$prefix}-noscript{background:var(--ea-gold-soft);border-color:var(--ea-gold-line);color:var(--ea-gold)}
{$scope} .{$prefix}-fullscreen-btn{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 12px;border:1px solid var(--ea-teal-line);border-radius:999px;background:transparent;color:var(--ea-teal);font-family:var(--ea-display);font-size:12.5px;font-weight:700;cursor:pointer}
{$scope} .{$prefix}-fullscreen-btn:hover{background:var(--ea-teal-soft)}
{$scope} .{$prefix}-fullscreen-btn[aria-pressed="true"]{background:var(--ea-teal);border-color:var(--ea-teal);color:var(--ea-teal-ink)}
{$scope} .{$prefix}-fullscreen-btn svg{flex:0 0 auto}

/* ---- fullscreen: the student monitoring data, alone --------------------
   One body class (pqlgb-fullscreen-on), toggled by a small dedicated
   <script> in live_group_board.php that the board's own render()/poll()
   never touches -- see that file for why it is a separate script rather
   than a branch inside the existing one. Hides the rail, the app bar, the
   header card and the bar's OWN configuration controls; the totals row, the
   tiles and the class chat are what is left -- chat included by the owner's
   own instruction (2026-09-08), against the first version's judgement call
   that it was a composing surface rather than monitoring data. The freshness
   dot and this button itself stay too -- both are live context for what is
   on screen, not configuration of it.

   The legend stays hidden: unlike chat, nothing asked for it back, and its
   "how to read this board" text describes furniture (the bar's controls)
   that fullscreen has just removed.

   The shell's reserved 248px of rail padding has to be reclaimed explicitly
   and with !important: pqh_design_shell_css() sets it with !important of
   its own, so a plain override loses regardless of specificity -- any
   !important beats any non-!important declaration outright, before
   specificity is ever consulted. */
body.{$prefix}-fullscreen-on {$scope} .pqh-gnav,
body.{$prefix}-fullscreen-on {$scope} .pqh-appbar,
body.{$prefix}-fullscreen-on {$scope} .{$prefix}-top,
body.{$prefix}-fullscreen-on {$scope} .{$prefix}-bar .{$prefix}-form,
body.{$prefix}-fullscreen-on {$scope} .{$prefix}-note{display:none}
body.{$prefix}-fullscreen-on {$scope}{padding:14px!important}
body.{$prefix}-fullscreen-on {$scope} .pqlgb,
body.{$prefix}-fullscreen-on {$scope} .{$prefix}-wrap{max-width:none}
/* .{$prefix}-chat's top:72px (in the page's own untouched stylesheet) clears the
   sticky app bar -- gone in fullscreen, so the offset is reclaimed the same
   way the shell's own padding is, down to the same 14px the ground now uses. */
body.{$prefix}-fullscreen-on {$scope} .{$prefix}-chat{top:14px}

/* ---- the totals row: icon-led stat tiles, matching the dashboard's KPIs ---
   No markup change -- render() still emits a bare <div class="pqlgb-total">
   with a <b> and a <span> inside. The icon is a ::before pseudo-element
   placed by CSS Grid, spanning both text rows; :nth-child assigns one of the
   seven icons above by POSITION, because position is genuinely stable here
   (see the comment above this function). is-flagged still only recolours
   the number, exactly as the page's own light-theme rule already does, so
   the selective-highlighting convention (only SOME totals ever turn red) is
   unchanged by this pass. */
{$scope} .{$prefix}-totals{gap:12px}
{$scope} .{$prefix}-total{display:grid;grid-template-columns:38px 1fr;column-gap:12px;align-items:center;background:var(--ea-card);border-color:var(--ea-line);box-shadow:var(--ea-shadow-sm)}
{$scope} .{$prefix}-total::before{content:"";grid-row:1/3;grid-column:1;width:38px;height:38px;border-radius:50%;background-color:var(--ea-cell-2);background-repeat:no-repeat;background-position:center;background-size:18px 18px}
{$scope} .{$prefix}-total b{grid-column:2;grid-row:1;color:var(--ea-ink)}
{$scope} .{$prefix}-total span{grid-column:2;grid-row:2;color:var(--ea-muted)}
{$scope} .{$prefix}-total.is-flagged b{color:var(--ea-coral)}
{$totaliconcss}

/* ---- groups and the Go live control ---------------------------------------
   Gold only for the due-now/live state, because that button is the one "go"
   action a teacher takes once per group per session -- the same scarcity
   rule pqh_ehel_academy_css()'s own docblock states ("exactly one gold pill
   that means GO"). is-upcoming (a class still due today, just not yet)
   stays a ghost outline: nothing to press yet. */
{$scope} .{$prefix}-group{background:var(--ea-card);border-color:var(--ea-line);box-shadow:var(--ea-shadow-sm)}
{$scope} .{$prefix}-group-head{background:var(--ea-cell-2);border-color:var(--ea-line)}
{$scope} .{$prefix}-group-head span{color:var(--ea-muted)}
{$scope} .{$prefix}-golive{border-color:var(--ea-gold);background:var(--ea-gold);color:var(--ea-gold-ink)}
{$scope} .{$prefix}-golive:hover{filter:brightness(1.06)}
{$scope} .{$prefix}-golive.is-upcoming{background:transparent;color:var(--ea-teal);border-color:var(--ea-teal-line)}
{$scope} .{$prefix}-golive.is-upcoming:hover{background:var(--ea-teal-soft)}
{$scope} .{$prefix}-empty{color:var(--ea-muted)}

/* ---- the tile: the left accent border carries the sort, so it stays the
   loudest thing on the row. State colours move from the bootstrap-ish
   literals (#b02a37, #997404, #1a67a3...) onto the same --ea-* palette
   everything else here uses; --tile--ok is still deliberately UNSTYLED --
   see CLAUDE.md, "no state = no colour treatment" is the point, not a gap.
   The two avatar circles use SOLID state colour as their background (sky,
   coral), which measures well under 4.5:1 against white -- 2.20:1 and
   2.41:1, computed, not guessed -- so both take the ground's own dark navy
   as ink instead, at 5.30:1 and 4.84:1. The gold avatar keeps --ea-gold-ink,
   already the established pairing (10.3:1). */
{$scope} .{$prefix}-tile{border-bottom-color:var(--ea-line)}
{$scope} .{$prefix}-tile--alert{border-left-color:var(--ea-coral);background:var(--ea-coral-soft)}
{$scope} .{$prefix}-tile--warn{border-left-color:var(--ea-gold);background:var(--ea-gold-soft)}
{$scope} .{$prefix}-tile--nodata{border-left-color:var(--ea-line);background:var(--ea-cell-2)}
{$scope} .{$prefix}-tile--hand{border-left-color:var(--ea-sky);background:var(--ea-sky-soft)}
{$scope} .{$prefix}-tile--hand .{$prefix}-avatar{background:var(--ea-sky);color:var(--ea-ground-a)}
{$scope} .{$prefix}-tile--hand .{$prefix}-quiet b{color:var(--ea-sky)}
{$scope} .{$prefix}-avatar{background:var(--ea-cell-2);color:var(--ea-body)}
{$scope} .{$prefix}-tile--alert .{$prefix}-avatar{background:var(--ea-coral);color:var(--ea-ground-a)}
{$scope} .{$prefix}-tile--warn .{$prefix}-avatar{background:var(--ea-gold);color:var(--ea-gold-ink)}
{$scope} .{$prefix}-who b{color:var(--ea-ink)}
{$scope} .{$prefix}-where{color:var(--ea-muted)}
{$scope} .{$prefix}-quiet span{color:var(--ea-muted)}
{$scope} .{$prefix}-tile--alert .{$prefix}-quiet b{color:var(--ea-coral)}
{$scope} .{$prefix}-tile--warn .{$prefix}-quiet b{color:var(--ea-gold)}
{$scope} .{$prefix}-reason{background:var(--ea-cell-2);border-left-color:var(--ea-coral);color:var(--ea-body)}
{$scope} .{$prefix}-answer{border-color:var(--ea-gold);background:var(--ea-gold);color:var(--ea-gold-ink)}
{$scope} .{$prefix}-answer:hover{filter:brightness(1.06)}

/* ---- the place line: context, not state -----------------------------------
   Four hues collapsed to one neutral treatment -- the "too many colours,
   simplify" lesson from the dashboard's course cards, applied here because
   the stakes are the same shape: the pills were competing for attention with
   the row that is actually meant to draw the eye, the flags below. */
{$scope} .{$prefix}-pl,{$scope} .{$prefix}-pl--course,{$scope} .{$prefix}-pl--pos,{$scope} .{$prefix}-pl--done,{$scope} .{$prefix}-pl--wehel{background:var(--ea-cell-2);border-color:var(--ea-line);color:var(--ea-muted)}

/* ---- the flag row: kept colourful (this IS the actionable layer) but
   reordered by severity so the thing to act on first is always leftmost,
   whatever order tileHtml() happened to push the flags into the array in.
   A raised hand outranks everything -- the one signal on this board the
   learner said out loud -- then a failed checkpoint or a focus break, then
   "already being helped", then good news, then the informational,
   least-urgent chips last. order only works because .{$prefix}-flags is already
   display:flex in the page's own untouched stylesheet.

   Background is SOLID --ea-cell-2 on every variant, not each hue's own
   -soft tint -- measured, not assumed, after the first version read fine
   against the card and then failed AA in the browser: a flag chip's -soft
   background composites OVER whatever tinted background its own TILE
   already has (a hand flag inside a hand tile is sky-soft-on-sky-soft; a bad
   flag inside a warn tile is coral-soft-on-gold-soft), and that compounding
   isn't visible reading the CSS -- it only showed up as six real failures
   (3.65-3.95:1 against the 4.5:1 this 11px text needs) in an automated
   sweep of the rendered page. Every one of the six text colours clears
   4.5:1 against solid cell-2 regardless of which tile it sits in (measured:
   sky 5.18, teal 5.02, coral 4.73, gold 7.25, green 5.95, muted 5.53), which
   a translucent background can never guarantee because it has no fixed
   value to measure against. The border keeps each chip's own hue for
   identity; only the fill changed. */
{$scope} .{$prefix}-flag--hand{order:1;border-color:var(--ea-sky-line);background:var(--ea-cell-2);color:var(--ea-sky)}
{$scope} .{$prefix}-flag--bad{order:2;border-color:var(--ea-coral-line);background:var(--ea-cell-2);color:var(--ea-coral)}
{$scope} .{$prefix}-flag--warn{order:3;border-color:var(--ea-gold-line);background:var(--ea-cell-2);color:var(--ea-gold)}
{$scope} .{$prefix}-flag--live{order:4;border-color:var(--ea-sky-line);background:var(--ea-cell-2);color:var(--ea-sky)}
{$scope} .{$prefix}-flag--ok{order:5;border-color:var(--ea-green-line);background:var(--ea-cell-2);color:var(--ea-green)}
{$scope} .{$prefix}-flag--moved{order:6;border-color:var(--ea-green-line);background:var(--ea-cell-2);color:var(--ea-green)}
{$scope} .{$prefix}-flag--time{order:7;border-color:var(--ea-teal-line);background:var(--ea-cell-2);color:var(--ea-teal)}
{$scope} .{$prefix}-flag--cycle{order:8;border-color:var(--ea-line);background:var(--ea-cell-2);color:var(--ea-muted)}

{$scope} .{$prefix}-note{background:var(--ea-card);border-color:var(--ea-line);border-left-color:var(--ea-teal);color:var(--ea-body)}
{$scope} .{$prefix}-note b{color:var(--ea-ink)}

/* ---- the classroom chat ----------------------------------------------------
   is-private keeps its OWN distinct tint (gold, not the mine/other teal) --
   CLAUDE.md is explicit that a learner's message must not read like
   something the room saw, and that distinction has to survive a reskin, not
   just the colours it was made of. is-announcement stays the banner it was,
   restated in the ground's own navy so it reads as "the room", not as one
   more bubble in the scrollback. */
{$scope} .{$prefix}-chat{background:var(--ea-card);border-color:var(--ea-line)}
{$scope} .{$prefix}-chat-head{border-color:var(--ea-line);color:var(--ea-ink)}
{$scope} .{$prefix}-chat-tab{border-color:var(--ea-line);color:var(--ea-muted)}
{$scope} .{$prefix}-chat-tab.is-active{background:var(--ea-teal-soft);border-color:var(--ea-teal-line);color:var(--ea-teal)}
{$scope} .{$prefix}-chat-msg{background:var(--ea-cell-2);color:var(--ea-body)}
{$scope} .{$prefix}-chat-msg.is-mine{background:var(--ea-teal-soft);color:var(--ea-ink)}
{$scope} .{$prefix}-chat-msg.is-private{background:var(--ea-gold-soft);border-color:var(--ea-gold-line);color:var(--ea-ink)}
{$scope} .{$prefix}-chat-msg.is-private small{color:var(--ea-gold)}
{$scope} .{$prefix}-chat-empty{color:var(--ea-muted)}
{$scope} .{$prefix}-chat-form{border-color:var(--ea-line)}
{$scope} .{$prefix}-chat-chip{color:var(--ea-gold);background:var(--ea-gold-soft);border-color:var(--ea-gold-line)}
{$scope} .{$prefix}-chat-quote{border-left-color:var(--ea-teal-line);color:var(--ea-muted)}
{$scope} .{$prefix}-chat-msg.is-announcement{background:var(--ea-ground-a);color:var(--ea-ink)}
{$scope} .{$prefix}-chat-announce{border-color:var(--ea-teal-line);color:var(--ea-teal)}
{$scope} .{$prefix}-chat-announce:hover{background:var(--ea-teal-soft)}
{$scope} .{$prefix}-chat-answer{border-color:var(--ea-teal-line);color:var(--ea-teal)}
{$scope} .{$prefix}-chat-answer:hover{background:var(--ea-teal-soft)}
{$scope} .{$prefix}-chat-shot{background:var(--ea-cell-2)}
{$scope} .{$prefix}-chat-form input{background:var(--ea-cell);border-color:var(--ea-line);color:var(--ea-ink)}
{$scope} .{$prefix}-chat-form input:focus-visible{border-color:var(--ea-teal)}
{$scope} .{$prefix}-chat-form button{border-color:var(--ea-teal);background:var(--ea-teal);color:var(--ea-teal-ink)}
{$scope} .{$prefix}-chat-form button:hover{background:var(--ea-teal-deep)}
CSS;

    return "@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap');\n"
        . pqh_css_force_and_specify($css);
}

/**
 * Standard application shell markup: nav rail, blue app bar, and the
 * expandable-rail script. Echo directly after the page's <main> opens.
 */
function pqh_shell_viewer_kind(int $userid): string {
    // Memoised per request. The answer is a fact about role assignments and
    // workspace membership, none of which can change while one page renders,
    // and it is now asked TWICE on every shell page -- once to build the rail,
    // once to choose the chrome -- at up to five record_exists queries a time.
    static $cache = [];
    if (!array_key_exists($userid, $cache)) {
        $cache[$userid] = pqh_shell_viewer_kind_uncached($userid);
    }
    return $cache[$userid];
}

function pqh_shell_viewer_kind_uncached(int $userid): string {
    global $DB;
    if ($userid <= 0) {
        return 'staff';
    }
    if (is_siteadmin($userid) || pqh_is_school_principal($userid)) {
        return 'staff';
    }
    try {
        if ($DB->record_exists_select(
            'local_prequran_workspace_member',
            "userid = ? AND status = 'active' AND workspace_role IN ('teacher', 'assistant_teacher', 'admin', 'owner', 'manager')",
            [$userid]
        )) {
            return 'staff';
        }
    } catch (Throwable $e) {
        // Table missing on older schemas; fall through.
    }
    try {
        if ($DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
            return 'staff';
        }
    } catch (Throwable $e) {
        // Fall through.
    }
    try {
        if ($DB->record_exists_select(
            'local_prequran_teacher_profile',
            'userid = ? AND LOWER(status) NOT IN (?, ?, ?)',
            [$userid, 'archived', 'inactive', 'rejected']
        )) {
            return 'staff';
        }
    } catch (Throwable $e) {
        // Fall through.
    }
    if ($DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    )) {
        return 'staff';
    }
    try {
        if ($DB->record_exists_select(
            'local_prequran_workspace_member',
            "userid = ? AND status = 'active' AND workspace_role = 'student'",
            [$userid]
        )) {
            return 'student';
        }
    } catch (Throwable $e) {
        // Fall through.
    }
    try {
        if ($DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
            return 'student';
        }
    } catch (Throwable $e) {
        // Fall through.
    }
    return 'parent';
}

function pqh_design_shell_html(string $shellclass, string $active = '', array $opts = []): string {
    global $USER;
    $ctx = pqh_requested_consumer_context();
    $brand = trim((string)($ctx->consumername ?? '')) ?: 'EduPlatform';
    $brandlogo = trim((string)($ctx->logourl ?? ''));
    $initials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $brand) ?: 'EP', 0, 2));
    $params = [];
    if (trim((string)($ctx->consumerslug ?? '')) !== '') {
        $params['consumer'] = (string)$ctx->consumerslug;
    }
    $ws = optional_param('workspaceid', 0, PARAM_INT);
    if ($ws > 0) {
        $params['workspaceid'] = $ws;
    }
    $icons = [
        'dashboard' => '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        'workspace' => '<rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v10M20 9v10M2 19h20"/>',
        'live' => '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/>',
        'schedule' => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        'hub' => '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
    ];
    $viewer = pqh_shell_viewer_kind((int)$USER->id);
    if ($viewer === 'student') {
        $items = [
            'dashboard' => ['Dashboard', new moodle_url('/local/hubredirect/student_dashboard.php', $params), $icons['dashboard']],
            'workspace' => ['Workplace', new moodle_url('/local/hubredirect/student_workplace.php', $params), $icons['workspace']],
            'hub' => ['School Hub', new moodle_url('/local/hubredirect/consumer_landing.php', $params), $icons['hub']],
            'schedule' => ['Schedule', new moodle_url('/local/hubredirect/live_schedule.php', $params + ['childid' => (int)$USER->id]), $icons['schedule']],
        ];
        $appbar = [
            ['Dashboard', $items['dashboard'][1]],
            ['Student workplace', $items['workspace'][1]],
            ['School Hub', $items['hub'][1]],
        ];
    } else if ($viewer === 'parent') {
        $items = [
            'dashboard' => ['Dashboard', new moodle_url('/local/hubredirect/dashboard.php', $params), $icons['dashboard']],
            'schedule' => ['Schedule', new moodle_url('/local/hubredirect/live_schedule.php', $params), $icons['schedule']],
        ];
        $appbar = [
            ['Dashboard', $items['dashboard'][1]],
            ['Live schedule', $items['schedule'][1]],
        ];
    } else {
        $staffhome = (is_siteadmin((int)$USER->id) || pqh_is_school_principal((int)$USER->id))
            ? '/local/hubredirect/dashboard.php'
            : '/local/hubredirect/teacher_dashboard.php';
        // One staff rail serves both workspace managers and teachers, but
        // teacher_workspace.php gates on pqltch_is_teacher() -- a workspace
        // owner/admin who has never taught fails it and lands on "Teacher
        // workspace access required". Send those viewers to the admin
        // workspace instead, which is what workspace_dashboard.php's own top
        // bar already links to. Anyone holding a teacher profile keeps the
        // teaching view.
        $staffworkspacepath = '/local/hubredirect/teacher_workspace.php';
        if ($ws > 0 && !pqh_has_teacher_profile((int)$USER->id)
                && pqh_user_can_manage_workspace((int)$USER->id, $ws)) {
            $staffworkspacepath = '/local/hubredirect/admin_workspace.php';
        }
        $items = [
            'dashboard' => ['Dashboard', new moodle_url($staffhome, $params), $icons['dashboard']],
            'workspace' => ['Workspace', new moodle_url($staffworkspacepath, $params), $icons['workspace']],
            'hub' => ['School Hub', new moodle_url('/local/hubredirect/consumer_landing.php', $params), $icons['hub']],
            'live' => ['Live sessions', new moodle_url('/local/hubredirect/live_sessions.php', $params), $icons['live']],
            'schedule' => ['Schedule', new moodle_url('/local/hubredirect/live_schedule.php', $params), $icons['schedule']],
        ];
        $appbar = [
            ['Dashboard', $items['dashboard'][1]],
            ['Workspace', $items['workspace'][1]],
        ];
    }
    $logouturl = (new moodle_url('/local/hubredirect/logout.php'))->out(false);
    $title = trim((string)($opts['title'] ?? '')) ?: $brand;
    $html = '<nav class="pqh-gnav" aria-label="Global navigation">';
    $html .= '<a class="pqh-gnav__brand" href="' . $items['dashboard'][1]->out(false) . '" title="' . s($brand) . '">'
        . '<span class="pqh-gnav__mark' . ($brandlogo !== '' ? ' pqh-gnav__mark--img' : '') . '">' . ($brandlogo !== '' ? '<img src="' . s($brandlogo) . '" alt="' . s($brand) . '">' : s($initials)) . '</span>'
        . '<span class="pqh-gnav__name">' . s($brand) . '</span></a>';
    // THE ROW FOR THE PAGE YOU ARE ON IS HIGHLIGHTED, NEVER HIDDEN.
    //
    // Five pages asked for both at once -- student_dashboard, student_workplace,
    // teacher_workspace, admin_workspace and workspace_dashboard each passed
    // $active AND listed that same key in hideitems, on the older convention
    // that you do not show somebody a link to the page they are already on.
    // The two instructions contradict, hiding ran second, and the effect was
    // that .is-active could not appear: measured across the five pages a
    // student can reach, ZERO rows carried it. The highlight was dead code on
    // every one of them.
    //
    // Marking wins, so a hideitems entry that names the active row is ignored.
    // Done here rather than by editing the five pages because it is one
    // convention, and a page that keeps saying "hide me" a year from now should
    // still get the current answer rather than a stale one.
    //
    // ...UNLESS the page has already built its own row for the current page.
    // The eight live_* pages hide all five defaults and rebuild the whole rail
    // out of navitems, so un-hiding the default there does not restore a
    // missing row -- it DUPLICATES one, and both copies then light up. Caught by
    // rendering live_schedule.php: "[Schedule] | Dashboard | Workspace | School
    // Hub | [Schedule] | Calendar | Live sessions". So a navitem claiming the
    // active key means the hide was deliberate and is honoured as written.
    $navclaims = [];
    if (!empty($opts['navitems']) && is_array($opts['navitems'])) {
        foreach ($opts['navitems'] as $navitem) {
            $navkey = (string)($navitem['key'] ?? '');
            if ($navkey !== '') {
                $navclaims[$navkey] = true;
            }
        }
    }
    $gnavitems = $items;
    if (!empty($opts['hideitems']) && is_array($opts['hideitems'])) {
        foreach ($opts['hideitems'] as $hidekey) {
            if ($active !== '' && (string)$hidekey === $active && !isset($navclaims[$active])) {
                continue;
            }
            unset($gnavitems[$hidekey]);
        }
    }
    foreach ($gnavitems as $key => $item) {
        $html .= '<a class="pqh-gnav__item' . ($key === $active ? ' is-active' : '') . '" href="' . $item[1]->out(false) . '">'
            . '<svg viewBox="0 0 24 24">' . $item[2] . '</svg><span class="pqh-gnav__label">' . s($item[0]) . '</span></a>';
    }
    if (!empty($opts['navitems']) && is_array($opts['navitems'])) {
        foreach ($opts['navitems'] as $item) {
            $url = ($item['url'] ?? '') instanceof moodle_url ? $item['url']->out(false) : (string)($item['url'] ?? '#');
            $attrs = trim((string)($item['attrs'] ?? ''));
            // A navitem can be the current page too, and until now it could not
            // say so: these were emitted with a bare class, so only the four
            // built-in $items could ever be marked. That is the second reason
            // the highlight never appeared -- the eight live_* pages hide all
            // five defaults and rebuild the rail entirely out of navitems, so
            // there was nothing left that COULD be active. Opt-in by 'key', so
            // a navitem without one behaves exactly as before.
            $navactive = ($active !== '' && (string)($item['key'] ?? '') === $active) ? ' is-active' : '';
            $html .= '<a class="pqh-gnav__item' . $navactive . '"' . ($attrs !== '' ? ' ' . $attrs : '') . ' href="' . $url . '">'
                . '<svg viewBox="0 0 24 24">' . (string)($item['icon'] ?? '') . '</svg>'
                . '<span class="pqh-gnav__label">' . s((string)($item['label'] ?? '')) . '</span></a>';
        }
    }
    $html .= '<div class="pqh-gnav__foot">';
    $html .= '<a class="pqh-gnav__item" href="' . $logouturl . '"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg><span class="pqh-gnav__label">Logout</span></a>';
    $html .= '<button class="pqh-gnav__item" id="pqh-rail-toggle" type="button" aria-label="Collapse or expand navigation"><svg viewBox="0 0 24 24"><path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/></svg><span class="pqh-gnav__label">Collapse</span></button>';
    $html .= '</div></nav>';
    // The header's top-left is EMPTY on purpose.
    //
    // The rail beside it already shows the institution's logo and name, so a
    // logo here was the same mark twice on one screen. Before that it was a
    // section icon plus the page name, which repeated the title sitting a
    // centimetre below it in <prefix>-top -- "Teacher Workspace" over "Teacher
    // Live-Class Workspace". Neither earns the space.
    //
    // The empty div stays because .pqh-appbar__brand carries margin-right:auto;
    // it is what pushes the nav links to the right edge. Dropping the element
    // would left-align them.
    //
    // Only workspace_dashboard has no title in its own -top, so it is the one
    // page with no page-name text at all. It passes the workspace name as the
    // title and its workspace switcher shows that name on the row below.
    $brandhtml = '';
    if (!empty($opts['appbar']) && is_array($opts['appbar'])) {
        $appbar = $opts['appbar'];
    }
    $html .= '<div class="pqh-appbar"><div class="pqh-appbar__brand">' . $brandhtml . '</div><div class="pqh-appbar__nav">';
    foreach ($appbar as $link) {
        if ($link[1] === 'BACK') {
            $fallback = ($link[2] ?? null) instanceof moodle_url ? $link[2]->out(false) : $items['dashboard'][1]->out(false);
            $html .= '<button class="pqh-back" type="button" data-fallback="' . s($fallback) . '">' . s($link[0]) . '</button>';
            continue;
        }
        $icon = (string)($link[2] ?? '');
        if ($icon !== '') {
            $html .= '<a class="pqh-appbar__icon" href="' . $link[1]->out(false) . '" title="' . s($link[0]) . '" aria-label="' . s($link[0]) . '"><svg viewBox="0 0 24 24">' . $icon . '</svg></a>';
        } else {
            $html .= '<a href="' . $link[1]->out(false) . '">' . s($link[0]) . '</a>';
        }
    }
    if (!empty($opts['links']) && is_array($opts['links'])) {
        foreach ($opts['links'] as $link) {
            $url = $link[1] instanceof moodle_url ? $link[1]->out(false) : (string)$link[1];
            $html .= '<a href="' . $url . '">' . s((string)$link[0]) . '</a>';
        }
    }
    if (!empty($opts['extrahtml'])) {
        $html .= (string)$opts['extrahtml'];
    }
    $html .= '<a class="pqh-appbar__logout" href="' . $logouturl . '">Logout</a>';
    $html .= '</div></div>';
    $html .= '<script>(function(){var shell=document.querySelector(".' . $shellclass . '");var toggle=document.getElementById("pqh-rail-toggle");var key="pqh_rail_min";'
        . 'try{if(window.localStorage.getItem(key)==="1"){shell.classList.add("pqh-rail-min");}}catch(e){}'
        . 'if(toggle){toggle.addEventListener("click",function(){var x=shell.classList.toggle("pqh-rail-min");try{window.localStorage.setItem(key,x?"1":"0");}catch(e){}});}'
        . 'document.querySelectorAll(".pqh-back").forEach(function(b){b.addEventListener("click",function(){'
        . 'if(window.history&&window.history.length>1){window.history.back();return;}'
        . 'window.location.href=b.getAttribute("data-fallback")||"/";});});})();</script>';
    return $html;
}

/**
 * Shared shell options for the live-class pages (summaries, recordings,
 * parent hub, schedule, calendar, series schedule, trust centre, sessions).
 * They all present the same destinations, so the top bar and left rail are
 * defined once here rather than repeated in every page.
 *
 * Every shared-shell default gnav item is hidden deliberately: the staff
 * viewer adds workspace/hub/live on top of the parent viewer's
 * dashboard/schedule, so leaving any default in place duplicates one of the
 * custom items below for at least one role.
 *
 * @param string $title page name shown beside the live icon in the top bar
 * @param array $urlparams consumer/workspace params the page already resolved
 * @param int $childid selected student, when the page tracks one (0 to omit)
 */
function pqh_live_page_shell_opts(string $title, array $urlparams = [], int $childid = 0): array {
    global $USER;

    $childparams = $childid > 0 ? ['childid' => $childid] : [];
    $isstaff = pqh_shell_viewer_kind((int)$USER->id) === 'staff';

    $dashboardurl = new moodle_url('/local/hubredirect/dashboard.php', $urlparams + $childparams);
    $workspaceurl = $isstaff
        ? new moodle_url('/local/hubredirect/teacher_workspace.php', $urlparams)
        : new moodle_url('/local/hubredirect/workspace_parent.php', $urlparams + $childparams);
    $huburl = new moodle_url('/local/hubredirect/consumer_landing.php', $urlparams);

    return [
        'title' => $title,
        'appbar' => [
            ['Dashboard', $dashboardurl],
            ['Workspace', $workspaceurl],
            ['School Hub', $huburl],
        ],
        'hideitems' => ['dashboard', 'workspace', 'hub', 'live', 'schedule'],
        'navitems' => [
            [
                'label' => 'Dashboard',
                'key' => 'dashboard',
                'url' => $dashboardurl,
                'icon' => '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
            ],
            [
                'label' => 'Workspace',
                'key' => 'workspace',
                'url' => $workspaceurl,
                'icon' => '<rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v10M20 9v10M2 19h20"/>',
            ],
            [
                'label' => 'School Hub',
                'key' => 'hub',
                'url' => $huburl,
                'icon' => '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
            ],
            [
                'label' => 'Schedule',
                'key' => 'schedule',
                'url' => new moodle_url('/local/hubredirect/live_schedule.php', $urlparams + $childparams),
                'icon' => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
            ],
            [
                'label' => 'Calendar',
                'key' => 'calendar',
                'url' => new moodle_url('/local/hubredirect/live_calendar.php', $urlparams + $childparams),
                'icon' => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
            ],
            [
                'label' => 'Live sessions',
                'key' => 'live',
                'url' => new moodle_url('/local/hubredirect/live_sessions.php', $urlparams),
                'icon' => '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/>',
            ],
        ],
    ];
}

function pqh_live_session_explainer_media_url(): moodle_url {
    return new moodle_url('/local/hubredirect/pix/live_session_explainer.mp4');
}

function pqh_live_session_explainer_url(): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_guide.php');
}

function pqh_live_session_agenda_template_variant(string $variant = 'en'): array {
    $variant = strtolower(trim($variant));
    if (in_array($variant, ['ar', 'arabic'], true)) {
        return [
            'variant' => 'ar',
            'configkey' => 'bunny_live_session_agenda_template_path_ar',
            'path' => 'pre_quraan/live-session-templates/live-session-agenda-template-ar.pptx',
            'filename' => 'Live Session Agenda template Arabic.pptx',
            'localfile' => 'live-session-agenda-template-ar.pptx',
        ];
    }
    return [
        'variant' => 'en',
        'configkey' => 'bunny_live_session_agenda_template_path',
        'path' => 'pre_quraan/live-session-templates/live-session-agenda-template.pptx',
        'filename' => 'Live Session Agenda template.pptx',
        'localfile' => 'live-session-agenda-template.pptx',
    ];
}

function pqh_live_session_agenda_template_source_url(string $variant = 'en'): moodle_url {
    $template = pqh_live_session_agenda_template_variant($variant);
    return new moodle_url(pqh_bunny_cdn_url((string)$template['path']));
}

function pqh_live_session_agenda_template_marker(string $variant = 'en'): string {
    $template = pqh_live_session_agenda_template_variant($variant);
    return 'local-template://' . (string)$template['variant'];
}

function pqh_live_session_agenda_template_from_marker(string $path): ?array {
    $path = strtolower(trim($path));
    if (!preg_match('#^local-template://(ar|en)$#', $path, $matches)) {
        return null;
    }
    return pqh_live_session_agenda_template_variant($matches[1]);
}

function pqh_live_session_agenda_template_url(): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_agenda_template.php');
}

function pqh_current_consumer_url_params(array $params = []): array {
    $context = pqh_requested_consumer_context();
    $base = [];
    $slug = trim((string)($context->consumerslug ?? ''));
    if ($slug !== '') {
        $base['consumer'] = $slug;
    }
    $workspaceid = (int)($context->workspaceid ?? 0);
    if ($workspaceid > 0) {
        $base['workspaceid'] = $workspaceid;
    }
    return array_merge($base, $params);
}

function pqh_live_session_agenda_upload_url(int $sessionid, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_agenda_upload.php', pqh_current_consumer_url_params(array_merge(['sessionid' => $sessionid], $params)));
}

function pqh_live_session_materials_url(int $sessionid, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_materials.php', pqh_current_consumer_url_params(array_merge(['sessionid' => $sessionid], $params)));
}

function pqh_live_session_materials_control_url(int $sessionid, array $params = []): moodle_url {
    return pqh_live_session_materials_url($sessionid, ['compact' => 1] + $params);
}

function pqh_live_session_agenda_file_url(int $sessionid, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_agenda_file.php', pqh_current_consumer_url_params(array_merge(['sessionid' => $sessionid], $params)));
}

function pqh_live_session_agenda_editor_url(int $sessionid, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_agenda_editor.php', pqh_current_consumer_url_params(array_merge(['sessionid' => $sessionid], $params)));
}

function pqh_live_session_agenda_source_url(int $sessionid, string $key, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_agenda_source.php', pqh_current_consumer_url_params(array_merge(['sessionid' => $sessionid, 'key' => $key], $params)));
}

function pqh_live_session_agenda_callback_url(int $sessionid, string $key, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_agenda_callback.php', pqh_current_consumer_url_params(array_merge(['sessionid' => $sessionid, 'key' => $key], $params)));
}

function pqh_bunny_storage_config(string $prefixconfig = '', string $defaultprefix = 'pre_quraan/live-session-slides'): array {
    $zone = trim((string)get_config('local_prequran', 'bunny_storage_zone'));
    $host = trim((string)get_config('local_prequran', 'bunny_storage_host'));
    $accesskey = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));
    $prefix = $prefixconfig !== '' ? trim((string)get_config('local_prequran', $prefixconfig)) : '';

    if ($host === '') {
        $host = 'storage.bunnycdn.com';
    }
    if ($prefix === '') {
        $prefix = $defaultprefix;
    }
    $prefix = trim(str_replace('\\', '/', $prefix), '/');

    if ($zone === '' || $accesskey === '' || !function_exists('curl_init')) {
        throw new invalid_parameter_exception('Bunny storage is not configured.');
    }

    return [
        'zone' => $zone,
        'host' => $host,
        'accesskey' => $accesskey,
        'prefix' => $prefix,
    ];
}

function pqh_safe_storage_part(string $value, string $fallback): string {
    $value = clean_param($value, PARAM_FILE);
    $value = trim($value, ". \t\n\r\0\x0B");
    return $value !== '' ? $value : $fallback;
}

function pqh_encode_bunny_storage_path(string $path): string {
    $parts = array_filter(explode('/', str_replace('\\', '/', $path)), function($part) {
        return $part !== '' && $part !== '.' && $part !== '..';
    });
    return implode('/', array_map('rawurlencode', $parts));
}

function pqh_bunny_storage_url(array $config, string $path): string {
    return 'https://' . $config['host'] . '/' . rawurlencode((string)$config['zone']) . '/' . pqh_encode_bunny_storage_path($path);
}

function pqh_legacy_quran_resource_hosts(): array {
    return [
        'app.quraan.academy',
    ];
}

function pqh_backward_compatible_shared_resource_hosts(): array {
    return [
        'quraanacademy.b-cdn.net',
        'ehelacademy.b-cdn.net',
    ];
}

function pqh_non_static_eduplatform_hosts(): array {
    return [
        'eduplatform.ai',
        'www.eduplatform.ai',
    ];
}

function pqh_normalize_url_host(string $url): string {
    return pqh_normalize_consumer_host((string)(parse_url(trim($url), PHP_URL_HOST) ?: ''));
}

function pqh_is_legacy_quran_resource_host(string $host): bool {
    return in_array(pqh_normalize_consumer_host($host), pqh_legacy_quran_resource_hosts(), true);
}

function pqh_is_non_static_eduplatform_host(string $host): bool {
    return in_array(pqh_normalize_consumer_host($host), pqh_non_static_eduplatform_hosts(), true);
}

function pqh_configured_shared_cdn_base_url(string $configkey = ''): string {
    $candidates = [];
    if ($configkey !== '') {
        $candidates[] = trim((string)get_config('local_prequran', $configkey));
    }
    $candidates[] = defined('HUB_SHARED_CDN_BASE') && HUB_SHARED_CDN_BASE ? (string)HUB_SHARED_CDN_BASE : '';
    $candidates[] = trim((string)get_config('local_prequran', 'bunny_shared_cdn_base_url'));
    $candidates[] = defined('HUB_CDN_BASE') && HUB_CDN_BASE ? (string)HUB_CDN_BASE : '';
    $candidates[] = trim((string)get_config('local_prequran', 'bunny_cdn_base_url'));

    foreach ($candidates as $candidate) {
        $candidate = trim($candidate);
        $candidatehost = pqh_normalize_url_host($candidate);
        if ($candidate === '' || pqh_is_legacy_quran_resource_host($candidatehost)
                || pqh_is_non_static_eduplatform_host($candidatehost)) {
            continue;
        }
        return rtrim($candidate, '/');
    }

    $fallbackhosts = pqh_backward_compatible_shared_resource_hosts();
    return 'https://' . reset($fallbackhosts);
}

function pqh_shared_resource_cdn_base_url(string $env = 'production'): string {
    $env = in_array($env, ['integration', 'staging', 'production'], true) ? $env : 'production';
    $envconfig = $env !== 'production' ? 'bunny_cdn_base_url_' . $env : '';
    return pqh_configured_shared_cdn_base_url($envconfig);
}

function pqh_shared_resource_hosts(): array {
    $hosts = [
        pqh_normalize_url_host(pqh_shared_resource_cdn_base_url('production')),
        pqh_normalize_url_host(pqh_shared_resource_cdn_base_url('staging')),
        pqh_normalize_url_host(pqh_shared_resource_cdn_base_url('integration')),
    ];
    return array_values(array_unique(array_filter($hosts)));
}

function pqh_is_known_resource_host(string $host): bool {
    $host = pqh_normalize_consumer_host($host);
    return in_array($host, pqh_shared_resource_hosts(), true);
}

/**
 * Every origin the static app may be served from, for CORS.
 *
 * This used to be pqh_shared_resource_hosts() alone, which is the CDN base
 * currently RESOLVED for each environment — one host, whichever
 * pqh_configured_shared_cdn_base_url() picks. With nothing configured that
 * falls back to reset($fallbackhosts), i.e. quraanacademy.b-cdn.net, so
 * ehelacademy.b-cdn.net — where the Ehel Academy app actually lives, and the
 * origin course_launch.php redirects every K-12 learner to — was never in the
 * allowlist. Measured on the live box: quiz_tts, quiz_stt, wehel_chat and
 * somali_tts all answered a preflight from that origin with no
 * Access-Control-Allow-Origin at all, so the browser dropped the response
 * before any of them got as far as authenticating. The runtime voice, the
 * pronunciation check and the Wehel tutor have never worked in production.
 *
 * The backward-compatible list is the set of hosts this platform is known to
 * serve the app from, so it is the right source: an origin is allowed because
 * we publish there, not because it happens to be the base URL today. Both
 * remain locked to https and to the exact host.
 */
function pqh_resource_allowed_origins(): array {
    $origins = [];
    foreach (pqh_shared_resource_hosts() as $host) {
        $origins[] = 'https://' . $host;
    }
    foreach (pqh_backward_compatible_shared_resource_hosts() as $host) {
        $host = pqh_normalize_consumer_host($host);
        if ($host !== '' && !pqh_is_legacy_quran_resource_host($host)) {
            $origins[] = 'https://' . $host;
        }
    }
    return array_values(array_unique($origins));
}

/**
 * Authenticate a cross-origin API call with the signed launch token.
 *
 * The app runs on the CDN, not on Moodle, so the session cookie is not
 * available to it: MoodleSessionep1 is issued with no SameSite attribute, which
 * every current browser treats as SameSite=Lax, and Lax is not sent on a
 * cross-site POST. credentials:"include" therefore delivers nothing and
 * require_login() redirects the fetch to /login/index.php — measured on the
 * live box, which answers an unauthenticated cross-origin POST with 303 and an
 * HTML login page where the caller expects audio.
 *
 * So these endpoints take the same proof progress_gateway.php takes: the HS256
 * launch token minted by pqpg_mint_token() at course launch, which is
 * server-signed, carries the user in `sub`, expires in 12 hours and can be
 * revoked by jti. Read from the Authorization header, or from the body for
 * callers that cannot set one.
 *
 * Returns the authenticated user id, or 0 when there is no usable token — the
 * caller then falls back to require_login() exactly as before, so a
 * same-origin page in a browser with a session is unaffected.
 */
function pqh_launch_token_userid(?array $payload = null): int {
    global $CFG, $DB;

    require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

    $auth = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    $token = '';
    if (preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
        $token = $matches[1];
    }
    if ($token === '' && is_array($payload)) {
        // Same field names the gateway accepts, so one client helper can talk
        // to both without knowing which is which.
        $token = trim((string)($payload['pwsToken'] ?? $payload['token'] ?? ''));
    }
    if ($token === '') {
        return 0;
    }

    $claims = pqpg_verify_token($token);
    if ($claims === null) {
        return 0;
    }
    $userid = (int)($claims['sub'] ?? 0);
    if ($userid <= 0) {
        return 0;
    }
    $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0, 'suspended' => 0]);
    if (!$user) {
        return 0;
    }
    // Establishes $USER for this request only. No session is created for the
    // caller — the token is the credential, and it is presented again on the
    // next call.
    \core\session\manager::set_user($user);

    return $userid;
}

/**
 * Per-minute cap for one caller.
 *
 * The existing counters live in $SESSION, which is right for a logged-in page
 * and useless for a token-authenticated one: that caller sends no cookie, so
 * every request begins a fresh session, the counter is always 1, and the cap
 * never fires. Keyed by user id in an application cache instead, so a launch
 * token is limited across its whole run. Fails OPEN if the cache is
 * unavailable — a rate limiter is not worth failing a lesson over.
 */
function pqh_api_rate_limit_ok(string $bucket, int $userid, int $limit, int $window = 60): bool {
    if ($userid <= 0) {
        return true;
    }
    try {
        $cache = cache::make_from_params(cache_store::MODE_APPLICATION, 'local_hubredirect', 'apiratelimit');
        $key = $bucket . ':' . $userid;
        $now = time();
        $entry = $cache->get($key);
        if (!is_array($entry) || ($now - (int)($entry['start'] ?? 0)) > $window) {
            $entry = ['start' => $now, 'count' => 0];
        }
        $entry['count'] = (int)$entry['count'] + 1;
        $cache->set($key, $entry);
        return $entry['count'] <= $limit;
    } catch (Throwable $e) {
        return true;
    }
}

function pqh_bunny_cdn_base_url(): string {
    return pqh_shared_resource_cdn_base_url('production');
}

function pqh_bunny_cdn_url(string $path): string {
    return pqh_bunny_cdn_base_url() . '/' . pqh_encode_bunny_storage_path($path);
}

function pqh_upload_bytes_to_bunny_storage(string $path, string $bytes, string $mimetype, array $config): void {
    $ch = curl_init(pqh_bunny_storage_url($config, $path));
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $bytes);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'AccessKey: ' . $config['accesskey'],
        'Content-Type: ' . ($mimetype !== '' ? $mimetype : 'application/octet-stream'),
        'Content-Length: ' . strlen($bytes),
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $response === false) {
        throw new invalid_parameter_exception('The file could not be saved to Bunny storage.');
    }
}

function pqh_upload_to_bunny_storage(string $path, string $tmpname, string $mimetype, array $config): void {
    $bytes = file_get_contents($tmpname);
    if ($bytes === false) {
        throw new invalid_parameter_exception('The uploaded file could not be read.');
    }

    pqh_upload_bytes_to_bunny_storage($path, $bytes, $mimetype, $config);
}

function pqh_fetch_from_bunny_storage(string $path, array $config): string {
    $ch = curl_init(pqh_bunny_storage_url($config, $path));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['AccessKey: ' . $config['accesskey']]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    $bytes = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($errno || $status < 200 || $status >= 300 || $bytes === false) {
        throw new invalid_parameter_exception('The session agenda slides could not be loaded.');
    }
    return (string)$bytes;
}

function pqh_live_session_agenda_local_template_bytes(string $filename): ?string {
    $filename = clean_filename($filename);
    if ($filename === '') {
        return null;
    }
    $localpath = __DIR__ . '/pix/' . $filename;
    if (!is_readable($localpath)) {
        return null;
    }
    $bytes = file_get_contents($localpath);
    return $bytes === false || $bytes === '' ? null : (string)$bytes;
}

function pqh_live_session_agenda_bytes($session): string {
    $path = trim((string)($session->agenda_slides_path ?? ''));
    if ($path === '') {
        throw new invalid_parameter_exception('No agenda slides are attached to this live session yet.');
    }
    $localtemplate = pqh_live_session_agenda_template_from_marker($path);
    if ($localtemplate !== null) {
        $bytes = pqh_live_session_agenda_local_template_bytes((string)$localtemplate['localfile']);
        if ($bytes === null) {
            throw new invalid_parameter_exception('The local agenda template file is missing.');
        }
        return $bytes;
    }

    $config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
    return pqh_fetch_from_bunny_storage($path, $config);
}

function pqh_live_session_agenda_storage_path(int $sessionid, string $filename): string {
    $config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $basename = pathinfo($filename, PATHINFO_FILENAME);
    $safe = pqh_safe_storage_part($basename, 'live-session-agenda');
    if ($extension !== '') {
        $safe .= '.' . pqh_safe_storage_part($extension, 'pptx');
    }
    return $config['prefix'] . '/session_' . $sessionid . '/' . time() . '_' . $safe;
}

function pqh_live_session_agenda_public_url($session): string {
    $path = trim((string)($session->agenda_slides_path ?? ''));
    return $path !== '' ? pqh_bunny_cdn_url($path) : '';
}

// The BBB moderator/attendee password for a session, derived rather than stored.
// The same sha1 expression is written out in four places; this is the copy new
// code should call, and live_sessions.php and live_sessions_portallib.php now
// delegate to it so those two cannot drift from each other. A wrong password is
// not a visible failure -- BBB simply refuses the call -- so the derivation is
// exactly the kind of thing that must not exist twice.
function pqh_live_session_bbb_password($session, string $role): string {
    $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
    if ($secret === '') {
        return '';
    }
    return substr(sha1('prequran-live|' . (int)$session->id . '|' . (string)$session->bbb_meeting_id . '|' . $role . '|' . $secret), 0, 24);
}

// Has the deck attached to this session changed since the one BigBlueButton is
// known to hold? Kept free of Moodle so the comparison can be exercised
// directly: it takes the path attached now, the CDN URL that path resolves to,
// and the details JSON of the last insert BBB received.
function pqh_live_session_agenda_bbb_document_changed(string $currentpath, string $currenturl, string $detailsjson): bool {
    $currentpath = trim($currentpath);
    if ($currentpath === '') {
        return false;
    }
    $details = json_decode($detailsjson, true);
    if (!is_array($details)) {
        return false;
    }
    $lastpath = trim((string)($details['bunny_path'] ?? ''));
    if ($lastpath !== '') {
        return $lastpath !== $currentpath;
    }
    // Rows written before the storage path was recorded carry only the document
    // URL. Compare it WITHOUT the cache-busting query: that version stamp falls
    // back to timemodified, which moves on an ordinary session update, and a URL
    // comparison would then read as a new deck on every single join -- the
    // re-conversion flashing the room-just-built gate was added to stop.
    $lasturl = trim((string)($details['url'] ?? ''));
    $currenturl = trim($currenturl);
    if ($lasturl === '' || $currenturl === '') {
        return false;
    }
    return rawurldecode(explode('?', $lasturl)[0]) !== rawurldecode(explode('?', $currenturl)[0]);
}

// True when the deck attached to this session is NOT the one BigBlueButton was
// last given, so a teacher who replaces the agenda after the room is built can
// have the new one pushed on their next start/join. The audit trail is the
// record of what BBB holds: rows are already written on every insert and on
// every Teacher Materials "Return to Agenda", so this needs no new column and
// no upgrade step. A restore counts, so a teacher who has already pushed the
// new deck by hand is not stomped a second time.
function pqh_live_session_agenda_awaiting_bbb($session): bool {
    global $DB;
    $path = trim((string)($session->agenda_slides_path ?? ''));
    $sessionid = (int)($session->id ?? 0);
    if ($path === '' || $sessionid <= 0 || !pqh_table_exists_safe('local_prequran_live_audit')) {
        return false;
    }
    $rows = $DB->get_records_select(
        'local_prequran_live_audit',
        'sessionid = :sessionid AND action IN (:inserted, :restored)',
        [
            'sessionid' => $sessionid,
            'inserted' => 'agenda_slides_bbb_inserted',
            'restored' => 'bbb_agenda_restored',
        ],
        'timecreated DESC, id DESC',
        'id, details',
        0,
        1
    );
    if (!$rows) {
        // Nothing has ever reached the room; the caller's own room-just-built
        // gate decides that case.
        return false;
    }
    $row = reset($rows);
    return pqh_live_session_agenda_bbb_document_changed(
        $path,
        pqh_live_session_agenda_public_url($session),
        (string)($row->details ?? '')
    );
}

function pqh_workspace_material_bunny_metadata($material): array {
    $metadata = json_decode((string)($material->metadatajson ?? ''), true);
    return is_array($metadata) ? $metadata : [];
}

function pqh_workspace_material_bunny_path($material): string {
    $metadata = pqh_workspace_material_bunny_metadata($material);
    return trim(str_replace('\\', '/', (string)($metadata['bunny_path'] ?? '')), '/');
}

function pqh_workspace_material_public_url($material): string {
    $path = pqh_workspace_material_bunny_path($material);
    return $path !== '' ? pqh_bunny_cdn_url($path) : '';
}

function pqh_workspace_material_filename($material): string {
    $metadata = pqh_workspace_material_bunny_metadata($material);
    $filename = clean_filename((string)($metadata['uploaded_filename'] ?? ''));
    if ($filename !== '') {
        return $filename;
    }
    $title = clean_filename((string)($material->title ?? 'material'));
    return $title !== '' ? $title : 'material.pdf';
}

function pqh_workspace_material_live_supported($material): bool {
    $path = pqh_workspace_material_bunny_path($material);
    if ($path === '') {
        return false;
    }
    $extension = strtolower(pathinfo(pqh_workspace_material_filename($material), PATHINFO_EXTENSION));
    return in_array($extension, ['pdf', 'ppt', 'pptx'], true);
}

function pqh_live_session_agenda_signature($session): string {
    $secret = trim((string)get_config('local_prequran', 'onlyoffice_jwt_secret'));
    if ($secret === '') {
        $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
    }
    if ($secret === '') {
        $secret = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));
    }
    if ($secret === '') {
        $secret = get_site_identifier();
    }
    $payload = implode('|', [
        (int)$session->id,
        (string)($session->agenda_slides_path ?? ''),
    ]);
    return hash_hmac('sha256', $payload, $secret);
}

function pqh_live_session_agenda_signature_valid($session, string $key): bool {
    return hash_equals(pqh_live_session_agenda_signature($session), trim($key));
}

function pqh_live_session_agenda_editor_enabled(): bool {
    return trim((string)get_config('local_prequran', 'onlyoffice_document_server_url')) !== '';
}

function pqh_onlyoffice_plugins_config(): array {
    return [
        'autostart' => [
            'asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}',
        ],
        'pluginsData' => [
            'https://onlyoffice.github.io/sdkjs-plugins/content/ai/config.json',
            'https://onlyoffice.github.io/sdkjs-plugins/content/languagetool/config.json',
            'https://onlyoffice.github.io/sdkjs-plugins/content/translator/config.json',
            'https://onlyoffice.github.io/sdkjs-plugins/content/zotero/config.json',
            'https://onlyoffice.github.io/sdkjs-plugins/content/youtube/config.json',
            'https://onlyoffice.github.io/sdkjs-plugins/content/ocr/config.json',
            'https://onlyoffice.github.io/sdkjs-plugins/content/drawio/config.json',
        ],
    ];
}

function pqh_live_session_user_can_manage_agenda($session, int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    $sessionworkspaceid = (int)($session->workspaceid ?? 0);
    if ($sessionworkspaceid > 0 && !pqh_consumer_context_allows_workspace(null, $sessionworkspaceid)) {
        return false;
    }
    if (pqh_can_manage_academy_operations($userid) || (int)$session->teacherid === $userid) {
        return true;
    }
    if (!empty($session->workspaceid) && pqh_user_can_teach_in_workspace($userid, (int)$session->workspaceid)) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'userid' => $userid,
            'role' => 'teacher',
            'status' => 'active',
        ])) {
        return true;
    }
    return pqh_user_has_role_shortname($userid, ['editingteacher', 'teacher', 'manager']);
}

function pqh_live_session_agenda_required_fields_ready(): bool {
    foreach (['agenda_slides_path', 'agenda_slides_filename', 'agenda_slides_mimetype', 'agenda_slides_size', 'agenda_slides_uploadedby', 'agenda_slides_uploadedat'] as $field) {
        if (!pqh_table_has_field_safe('local_prequran_live_session', $field)) {
            return false;
        }
    }
    return true;
}

function pqh_attach_default_agenda_to_live_session(int $sessionid, int $userid = 0, string $variant = 'en', bool $replace = false): ?stdClass {
    global $DB;
    if ($sessionid <= 0 || !pqh_live_session_agenda_required_fields_ready()) {
        return null;
    }
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
    if (!$session || (!$replace && trim((string)($session->agenda_slides_path ?? '')) !== '')) {
        return $session ?: null;
    }

    $config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
    $template = pqh_live_session_agenda_template_variant($variant);
    $templatepath = trim((string)get_config('local_prequran', (string)$template['configkey']));
    if ($templatepath === '') {
        $templatepath = (string)$template['path'];
    }
    $templatepath = trim(str_replace('\\', '/', $templatepath), '/');
    $filename = (string)$template['filename'];
    $mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    try {
        $bytes = pqh_fetch_from_bunny_storage($templatepath, $config);
    } catch (Throwable $e) {
        $bytes = pqh_live_session_agenda_local_template_bytes((string)$template['localfile']);
        if ($bytes === null) {
            throw $e;
        }
    }
    $path = pqh_live_session_agenda_storage_path($sessionid, $filename);
    try {
        pqh_upload_bytes_to_bunny_storage($path, $bytes, $mimetype, $config);
    } catch (Throwable $e) {
        $path = pqh_live_session_agenda_template_marker((string)$template['variant']);
    }

    $session->agenda_slides_path = $path;
    $session->agenda_slides_filename = $filename;
    $session->agenda_slides_mimetype = $mimetype;
    $session->agenda_slides_size = strlen($bytes);
    $session->agenda_slides_uploadedby = $userid;
    $session->agenda_slides_uploadedat = time();
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);
    return $session;
}

function pqh_base64url_encode(string $value): string {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function pqh_jwt_hs256(array $payload, string $secret): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $segments = [
        pqh_base64url_encode(json_encode($header, JSON_UNESCAPED_SLASHES)),
        pqh_base64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES)),
    ];
    $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
    $segments[] = pqh_base64url_encode($signature);
    return implode('.', $segments);
}

function pqh_live_session_explainer_link(string $class = ''): string {
    $classes = trim($class . ' pqh-live-guide-link');
    return html_writer::link(
        pqh_live_session_explainer_url(),
        'Watch live-session guide',
        [
            'class' => $classes,
            'target' => '_blank',
            'rel' => 'noopener',
        ]
    );
}

function pqh_live_session_agenda_template_link(string $class = ''): string {
    $classes = trim($class . ' pqh-live-template-link');
    return html_writer::link(
        pqh_live_session_agenda_template_url(),
        'Live Session Agenda template',
        [
            'class' => $classes,
            'target' => '_blank',
            'rel' => 'noopener',
            'download' => 'Live Session Agenda template.pptx',
        ]
    );
}

function pqh_embedded_support_ws_token(): string {
    global $CFG, $DB;

    require_once($CFG->libdir . '/externallib.php');
    $fallback = (string)get_config('local_prequran', 'ws_token');
    try {
        $service = $DB->get_record('external_services', [
            'shortname' => 'prequran_ws',
            'enabled' => 1,
        ]);
        if (!$service || !function_exists('external_generate_token_for_current_user')) {
            return $fallback;
        }
        $token = external_generate_token_for_current_user($service);
        return is_object($token) && !empty($token->token) ? (string)$token->token : $fallback;
    } catch (Throwable $e) {
        return $fallback;
    }
}

function pqh_embedded_support_html(
    int $workspaceid,
    int $studentid,
    int $teacherid = 0,
    string $supporttype = 'student_helpdesk',
    $consumercontext = null
): string {
    global $CFG, $USER;

    $token = pqh_embedded_support_ws_token();
    if (!in_array($supporttype, ['student_helpdesk', 'student_teacher', 'parent_teacher'], true)) {
        $supporttype = 'student_helpdesk';
    }
    if (!$consumercontext) {
        $consumercontext = pqh_current_consumer_context();
    }
    $consumerid = (int)($consumercontext->consumerid ?? 0);
    $managedstudent = $workspaceid > 0
        && pqh_user_workspace_role((int)$USER->id, $workspaceid) === 'student';
    $context = context_system::instance();
    $assetbase = rtrim(pqh_shared_resource_cdn_base_url(), '/') . '/pre_quraan';
    $cachekey = 'support-livechat-20260713b';
    $cssurl = $assetbase . '/shared/css/support.css?v=' . $cachekey;
    $jsurl = $assetbase . '/shared/js/shared-support-panel.js?v=' . $cachekey;
    $config = [
        '__prequran_ws_token' => $token,
        '__prequran_ws_endpoint' => rtrim((string)$CFG->wwwroot, '/') . '/webservice/rest/server.php',
        '__prequran_moodle_origin' => rtrim((string)$CFG->wwwroot, '/'),
        '__prequran_support_uid' => (int)$USER->id,
        '__prequran_support_consumerid' => $consumerid,
        '__prequran_support_workspaceid' => $workspaceid,
        '__prequran_support_studentid' => $studentid,
        '__prequran_support_teacherid' => $teacherid,
        '__prequran_support_type' => $supporttype,
        '__prequran_support_managed_student' => $managedstudent ? '1' : '0',
        '__prequran_support_staff' => is_siteadmin((int)$USER->id)
            || has_capability('local/prequran:supportviewqueue', $context),
        '__prequran_support_can_convert' => is_siteadmin((int)$USER->id)
            || has_capability('local/prequran:supportconvert', $context),
    ];
    $script = '';
    foreach ($config as $name => $value) {
        $script .= 'window.' . $name . '=' . json_encode($value) . ';';
    }

    return '<link rel="stylesheet" href="' . s($cssurl) . '">'
        . '<script>' . $script . '</script>'
        . '<script src="' . s($jsurl) . '"></script>';
}

/**
 * Session-independent, IP-keyed rate limiter for cookieless public endpoints
 * (the verification pages previously threw their $_SESSION counter away on
 * every cookie-less request). Records a hit for (bucket, hashed remote addr)
 * and returns true when the caller has exceeded $max hits in the trailing
 * window. Best-effort: if the backing table is absent it fails OPEN (never
 * blocks a legitimate user because of an ops gap) — the secret code remains
 * the real barrier.
 */
function pqh_ip_rate_limited(string $bucket, int $max = 30, int $windowsecs = 60): bool {
    global $DB;

    try {
        if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_rate_hit'))) {
            return false;
        }
        $now = time();
        $ip = (string)(getremoteaddr() ?? '');
        $iphash = hash('sha256', $ip . '|' . ($GLOBALS['CFG']->passwordsaltmain ?? ''));
        $bucket = core_text::substr($bucket, 0, 60);
        // Opportunistic prune of anything older than an hour keeps the table small.
        $DB->delete_records_select('local_prequran_rate_hit', 'timecreated < :cut', ['cut' => $now - HOURSECS]);
        $count = (int)$DB->count_records_select('local_prequran_rate_hit',
            'bucket = :b AND iphash = :h AND timecreated >= :since',
            ['b' => $bucket, 'h' => $iphash, 'since' => $now - $windowsecs]);
        $DB->insert_record('local_prequran_rate_hit', (object)[
            'bucket' => $bucket, 'iphash' => $iphash, 'timecreated' => $now,
        ]);
        return $count >= $max;
    } catch (Throwable $e) {
        return false;
    }
}

/**
 * Make a skin sheet win against the pages it is laid over. Two passes, and the
 * second is the one people forget:
 *
 *   1. !important on the properties pages force in their own CSS. 109 of the 137
 *      skinned pages write things like
 *      .pql-shell [class*="-panel"]{border-color:...!important}, and !important
 *      beats any specificity -- so without this a skin silently loses on the
 *      majority of pages and only appears to work on the handful that happen not
 *      to force anything. Measured, not guessed: color x252, background x48,
 *      font-weight x33, border-color x26, border-radius x22, box-shadow x20,
 *      border x19, font-size x14.
 *
 *      Forced on the LISTED properties only. Layout -- padding, display, gap,
 *      width -- is never forced, so a page keeps its own geometry (this is what
 *      lets .X-panel--wide and .X-panel--compact still work).
 *
 *      The cost: a page's own colour MODIFIER on a base component loses too,
 *      because equal specificity plus later position wins. Only one exists
 *      across all 137 pages -- .pqlf-card--overdue in live_followups.php -- and
 *      it carries its own !important now so it still reads as overdue.
 *
 *   2. Doubling the first class token of every selector. !important alone is not
 *      enough: between two !important declarations the MORE SPECIFIC one still
 *      wins, and the page rule above is (0,2,0) against a bare .pql-panel at
 *      (0,1,0). Doubling lifts the sheet to (0,2,0) and later position carries
 *      the tie. Done here rather than by writing .x.x throughout a template,
 *      which would treble its length and be silently wrong the moment somebody
 *      adds a rule and forgets the trick.
 *
 * A line opening with '@' or ':root' is left alone -- at-rules have no selector
 * to double, and the token block is not competing with anything. A rule that
 * needs to beat something already at (0,4,0) writes its own extra class by hand
 * and gets one more from this pass.
 */
function pqh_css_force_and_specify(string $css): string {
    $css = preg_replace_callback(
        '/(^|[;{])(\s*)(background|background-color|color|border|border-color|border-radius|box-shadow|'
            . 'font-family|font-size|font-weight|letter-spacing|text-transform|text-shadow)(\s*:\s*)([^;{}]+?)(\s*)(?=[;}])/mi',
        static function (array $m): string {
            if (stripos($m[5], '!important') !== false) {
                return $m[0];
            }
            return $m[1] . $m[2] . $m[3] . $m[4] . $m[5] . '!important' . $m[6];
        },
        $css
    ) ?? $css;

    return implode("\n", array_map(static function (string $line): string {
        $brace = strpos($line, '{');
        if ($brace === false || $line === '' || $line[0] === '@' || strpos($line, ':root') === 0) {
            return $line;
        }
        $selectors = explode(',', substr($line, 0, $brace));
        foreach ($selectors as &$sel) {
            // duplicate the first class token; +1 class of specificity, same match
            $sel = preg_replace('/(\.[A-Za-z_][A-Za-z0-9_-]*)/', '$1$1', $sel, 1);
        }
        unset($sel);
        return implode(',', $selectors) . substr($line, $brace);
    }, explode("\n", $css)));
}

/**
 * The OpenProject skin, generated for one page's class prefix.
 *
 * Tokens are measured off openproject.org, not guessed: Lato, #1a67a3 primary
 * (#134a81 hover), #1f1f1f ink over #707070 greys, #dfdfdf hairlines, 3px
 * radii, #ebf3f7 tinted table heads, 400 body / 700 emphasis, and a #162b48
 * header bar. course_offerings.php and course_catalog_browse.php were skinned
 * by hand first; this is that same skin with the prefix pulled out, so the two
 * reference pages and everything modelled on them cannot drift apart.
 *
 * Every hubredirect page names its components the same way -- <prefix>-btn,
 * -panel, -table, -pill, -field, -muted and the rest -- while the prefix itself
 * is unique per page (176 of them). So the prefix is the only variable, and
 * one definition here replaces a hand-edited <style> block on every page.
 *
 * HOW TO CALL IT. Put it in its OWN <style> element immediately after the
 * page's existing one:
 *
 *     </style>
 *     <style><?php echo pqh_openproject_skin_css('pqwd', 'pqw-dashboard-page'); ?></style>
 *
 * A separate element, not appended inside the page's own block, for two
 * reasons. The Lato @import has to be the first rule of the stylesheet it sits
 * in, which it cannot be if the page's rules come first; and being a later
 * stylesheet it still wins on source order, so the skin overrides the page
 * without needing !important on every rule and without editing what is
 * already there.
 *
 * WHAT IT DELIBERATELY DOES NOT TOUCH: layout. No grid-template-columns, no
 * widths, no padding on the page shell. 27 pages lay themselves out in ways
 * this function cannot see, and a skin that moves boxes around is a redesign
 * of each one rather than a restyle. Colour, type, borders, radii and gaps
 * only.
 *
 * ONE EXCEPTION, and it is not optional: the header band, .<prefix>-top. This
 * function PAINTS that element -- navy fill, white ink -- and 84 of the 149
 * pages that have a -top declare it as nothing but `display:flex;
 * justify-content:space-between;margin-bottom:16px`, with no padding at all.
 * Painting a box that has no padding puts its heading hard against the top-left
 * corner and its subtitle hard against the bottom edge, where the line reads as
 * cut off rather than as text. So -top carries padding here, the same
 * 16px/20px course_offerings.php and course_catalog_browse.php force on theirs.
 * Nothing else gains padding.
 *
 * The band also has to recolour what it contains, not just .<prefix>-title and
 * -sub. Counted over every -top in the plugin: the subtitle is .<prefix>-muted
 * 25 times against -sub twice, and the heading is a bare <h1>/<h2> 27 times
 * against .<prefix>-title 9 times. Left alone, -muted keeps the grey
 * (--op-ink-soft) the skin gives it everywhere else, which on navy is the
 * near-invisible line this fixed.
 *
 * @param string|string[] $prefixes the page's class prefix, e.g. 'pqwd'
 * @param string $bodyclass the page's add_body_class() value, for the canvas
 * @param string $sep prefix/component separator; '__' for the BEM pages
 */
function pqh_openproject_skin_css($prefixes, string $bodyclass = '', string $sep = '-'): string {
    static $emittedtokens = false;
    static $emittedprefix = [];

    $prefixes = is_array($prefixes) ? $prefixes : [$prefixes];

    // Idempotent within a request. A page that calls this twice -- directly and
    // again through an included renderer -- should not ship the token block or
    // a prefix's rules twice. Repeats are identical so a duplicate is only
    // wasted bytes, but this page is already 200KB of inline CSS on the big
    // dashboards and there is no reason to add to it.
    if ($emittedtokens) {
        $css = '';
    } else {
        $emittedtokens = true;
        // The @import must lead the stylesheet or the browser drops it. If
        // Google Fonts is blocked the stack falls through to
        // -apple-system/Segoe UI and only the typeface changes.
        $css = "@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');\n";
        $css .= ':root{--op-font:"Lato",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans",Ubuntu,Cantarell,"Helvetica Neue",sans-serif;'
        . '--op-primary:#1a67a3;--op-primary-hover:#134a81;--op-primary-subtle:#d1e1ed;--op-primary-border:#a3c2da;--op-primary-emphasis:#0a2941;'
        . '--op-ink:#1f1f1f;--op-ink-muted:#555;--op-ink-soft:#707070;--op-ink-faint:#919191;'
        . '--op-line:#dfdfdf;--op-line-strong:#ccc;'
        . '--op-canvas:#f2f2f2;--op-surface:#fff;--op-surface-tint:#ebf3f7;--op-surface-soft:#f9f9f9;'
        . '--op-ok-bg:#d1e7dd;--op-ok-line:#a3cfbb;--op-ok-ink:#0a3622;'
        . '--op-warn-bg:#fff3cd;--op-warn-line:#ffe69c;--op-warn-ink:#664d03;'
        . '--op-bad-bg:#f8d7da;--op-bad-line:#f1aeb5;--op-bad-ink:#58151c;'
        . '--op-radius:3px;--op-radius-lg:.5rem;--op-pill:50rem;'
        . '--op-focus:0 0 0 .25rem rgba(26,103,163,.25);--op-shadow-lg:0 1rem 3rem rgba(0,0,0,.175);'
        . "--op-header-bg:#162b48;--op-header-ink:#fff;--op-header-ink-soft:rgba(255,255,255,.72)}\n";
    }

    $bodyclass = trim($bodyclass);
    if ($bodyclass !== '' && !isset($emittedprefix['body:' . $bodyclass])) {
        $emittedprefix['body:' . $bodyclass] = true;
        $css .= "body.{$bodyclass}{background:var(--op-canvas)!important;font-family:var(--op-font)}\n";
    }

    foreach ($prefixes as $prefix) {
        $p = preg_replace('/[^a-z0-9_-]/i', '', (string)$prefix);
        $s = $sep === '__' ? '__' : '-';
        if ($p === '' || isset($emittedprefix[$p . $s])) {
            continue;
        }
        $emittedprefix[$p . $s] = true;

        // A BEM family (pqh-todo__item, pqhsd-ccard__body) is one component's
        // parts, not a whole page: it has no -table, -textarea, -filter and
        // never will. Emitting the full set for each would have put ~70KB of
        // dead rules on dashboard.php alone, which carries fourteen families.
        if ($s === '__') {
            $css .= <<<CSS
.{$p}{$s}card,.{$p}{$s}panel,.{$p}{$s}item{border-width:1px;border-style:solid;border-radius:var(--op-radius);box-shadow:none}
.{$p}{$s}card:not([class*="{$s}card--"]),.{$p}{$s}panel:not([class*="{$s}panel--"]),.{$p}{$s}item:not([class*="{$s}item--"]){border-color:var(--op-line);background:var(--op-surface)}
.{$p}{$s}head,.{$p}{$s}header{border-bottom:1px solid var(--op-line);color:var(--op-ink);font-family:var(--op-font);font-weight:700}
.{$p}{$s}title,.{$p}{$s}name{color:var(--op-ink);font-family:var(--op-font);font-weight:700;line-height:1.35}
.{$p}{$s}sub,.{$p}{$s}meta,.{$p}{$s}muted{color:var(--op-ink-soft);font-size:13px;font-weight:400;line-height:1.45}
.{$p}{$s}body,.{$p}{$s}text{color:var(--op-ink-muted);font-family:var(--op-font);font-size:14px;font-weight:400;line-height:1.5}
.{$p}{$s}kicker,.{$p}{$s}label{color:var(--op-ink-soft);font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.{$p}{$s}num,.{$p}{$s}value,.{$p}{$s}count{color:var(--op-ink);font-family:var(--op-font);font-weight:700;letter-spacing:-.01em}
.{$p}{$s}ico,.{$p}{$s}icon{color:var(--op-ink-soft)}
.{$p}{$s}actions{gap:8px}
.{$p}{$s}btn{border-width:1px;border-style:solid;border-radius:var(--op-radius);font-family:var(--op-font);font-size:14px;font-weight:700;line-height:1.2;text-decoration:none;cursor:pointer}
.{$p}{$s}btn:not([class*="{$s}btn--"]),.{$p}{$s}btn--primary{border-color:var(--op-primary);background:var(--op-primary);color:#fff!important}
.{$p}{$s}btn:not([class*="{$s}btn--"]):hover,.{$p}{$s}btn--primary:hover{background:var(--op-primary-hover);border-color:var(--op-primary-hover)}
.{$p}{$s}btn--light,.{$p}{$s}btn--secondary,.{$p}{$s}btn--ghost{background:var(--op-surface);border-color:var(--op-line-strong);color:var(--op-ink)!important}
.{$p}{$s}btn--light:hover,.{$p}{$s}btn--secondary:hover,.{$p}{$s}btn--ghost:hover{background:var(--op-surface-soft);border-color:var(--op-ink-faint);color:var(--op-primary-hover)!important}
.{$p}{$s}pill,.{$p}{$s}tag,.{$p}{$s}chip{border-width:1px;border-style:solid;border-radius:var(--op-pill);font-size:12px;font-weight:700;line-height:1}
.{$p}{$s}pill:not([class*="{$s}pill--"]),.{$p}{$s}tag:not([class*="{$s}tag--"]),.{$p}{$s}chip:not([class*="{$s}chip--"]){border-color:var(--op-primary-border);background:var(--op-primary-subtle);color:var(--op-primary-emphasis)}
.{$p}{$s}empty{border:1px dashed var(--op-line-strong);border-radius:var(--op-radius);background:var(--op-surface-soft);color:var(--op-ink-soft);font-weight:400}
.{$p}{$s}grid,.{$p}{$s}list{gap:16px}
.{$p}{$s}top{padding:16px 20px;border:1px solid var(--op-header-bg);border-radius:var(--op-radius);background:var(--op-header-bg);color:var(--op-header-ink)}
.{$p}{$s}top h1,.{$p}{$s}top h2,.{$p}{$s}top h3,.{$p}{$s}top .{$p}{$s}title{margin:0;color:var(--op-header-ink);font-size:24px;font-weight:700;line-height:1.25}
.{$p}{$s}top .{$p}{$s}sub,.{$p}{$s}top .{$p}{$s}muted,.{$p}{$s}top .{$p}{$s}meta,.{$p}{$s}top .{$p}{$s}text{color:var(--op-header-ink-soft)}
.{$p}{$s}top h1+*,.{$p}{$s}top h2+*,.{$p}{$s}top h3+*,.{$p}{$s}top .{$p}{$s}title+*{margin-top:6px}

CSS;
            continue;
        }

        // NO -track / -bar / -fill rule below, deliberately. "track" is a
        // progress groove on workspace_reports and executive_dashboard, but on
        // public_intake, public_teacher_intake and student_intake it is the
        // WIZARD SLIDER -- a flex row as wide as all its steps. Painting that
        // with the pill radius and the canvas grey drew an 883x843 lozenge
        // behind the whole form, reading as a giant pale circle that slid about
        // behind the fields. Both pages with real progress bars already colour
        // their own groove and fill, so the rule bought nothing and broke three.
        $css .= <<<CSS
.{$p}{$s}shell{background:var(--op-canvas);color:var(--op-ink);font-family:var(--op-font);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.{$p}{$s}panel,.{$p}{$s}card,.{$p}{$s}summary-card,.{$p}{$s}quick-card{border-width:1px;border-style:solid;border-radius:var(--op-radius);box-shadow:none}
.{$p}{$s}panel:not([class*="{$s}panel--"]),.{$p}{$s}card:not([class*="{$s}card--"]),.{$p}{$s}summary-card,.{$p}{$s}quick-card{border-color:var(--op-line);background:var(--op-surface)}
.{$p}{$s}panel h2,.{$p}{$s}card h2,.{$p}{$s}panel h3,.{$p}{$s}card h3{color:var(--op-ink);font-family:var(--op-font);font-weight:700;line-height:1.4}
.{$p}{$s}panel h2,.{$p}{$s}panel h3{font-size:16px}
.{$p}{$s}card h2,.{$p}{$s}card h3{font-size:18px}
.{$p}{$s}grid,.{$p}{$s}stack{gap:16px}
.{$p}{$s}actions,.{$p}{$s}card-actions,.{$p}{$s}row-actions{gap:8px}
.{$p}{$s}btn{border-width:1px;border-style:solid;border-radius:var(--op-radius);font-family:var(--op-font);font-size:14px;font-weight:700;line-height:1.2;text-decoration:none;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,color .15s ease}
.{$p}{$s}btn:not([class*="{$s}btn--"]),.{$p}{$s}btn--primary,.{$p}{$s}btn--main,.{$p}{$s}btn--compact,.{$p}{$s}btn--mini,.{$p}{$s}btn--tiny,.{$p}{$s}btn--sm,.{$p}{$s}btn--small,.{$p}{$s}btn--lg,.{$p}{$s}btn--large,.{$p}{$s}btn--block{border-color:var(--op-primary);background:var(--op-primary);color:#fff!important}
.{$p}{$s}btn:not([class*="{$s}btn--"]):hover,.{$p}{$s}btn--primary:hover,.{$p}{$s}btn--main:hover,.{$p}{$s}btn--compact:hover,.{$p}{$s}btn--mini:hover,.{$p}{$s}btn--tiny:hover{background:var(--op-primary-hover);border-color:var(--op-primary-hover)}
.{$p}{$s}btn:focus-visible{outline:0;box-shadow:var(--op-focus)}
.{$p}{$s}btn[disabled],.{$p}{$s}btn:disabled{opacity:.55;cursor:not-allowed}
.{$p}{$s}btn--light,.{$p}{$s}btn--secondary,.{$p}{$s}btn--ghost{background:var(--op-surface);border-color:var(--op-line-strong);color:var(--op-ink)!important}
.{$p}{$s}btn--light:hover,.{$p}{$s}btn--secondary:hover,.{$p}{$s}btn--ghost:hover{background:var(--op-surface-soft);border-color:var(--op-ink-faint);color:var(--op-primary-hover)!important}
.{$p}{$s}btn--danger{background:var(--op-bad-bg);border-color:var(--op-bad-line);color:var(--op-bad-ink)!important}
.{$p}{$s}btn--danger:hover{background:#f1aeb5;border-color:#e08d97;color:var(--op-bad-ink)!important}
.{$p}{$s}field label,.{$p}{$s}field>span:first-child{color:var(--op-ink-muted);font-size:13px;font-weight:700;letter-spacing:0;text-transform:none}
.{$p}{$s}input,.{$p}{$s}select,.{$p}{$s}textarea{box-sizing:border-box;min-width:0;border:1px solid var(--op-line-strong);border-radius:var(--op-radius);background:var(--op-surface);color:var(--op-ink);font-family:var(--op-font);font-size:14px;font-weight:400;line-height:1.5}
.{$p}{$s}input::placeholder,.{$p}{$s}textarea::placeholder{color:var(--op-ink-faint)}
.{$p}{$s}input:focus,.{$p}{$s}select:focus,.{$p}{$s}textarea:focus{outline:0;border-color:#8db3d1;box-shadow:var(--op-focus)}
.{$p}{$s}input:disabled,.{$p}{$s}select:disabled,.{$p}{$s}textarea:disabled{background:var(--op-surface-soft);color:var(--op-ink-soft)}
.{$p}{$s}check{accent-color:var(--op-primary)}
.{$p}{$s}table{border-collapse:separate;border-spacing:0;font-size:14px}
.{$p}{$s}table thead th{border-top:1px solid var(--op-line);border-bottom:1px solid var(--op-line);background:var(--op-surface-tint);color:var(--op-ink-muted);font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;vertical-align:middle}
.{$p}{$s}table td{border-bottom:1px solid var(--op-line);color:var(--op-ink);font-size:14px;font-weight:400;vertical-align:top}
.{$p}{$s}table tbody tr:hover td{background:var(--op-surface-soft)}
.{$p}{$s}name{color:var(--op-ink);font-size:14px;font-weight:700}
.{$p}{$s}muted,.{$p}{$s}help{font-weight:400;line-height:1.45}
.{$p}{$s}muted:not([class*="{$s}muted--"]),.{$p}{$s}help:not([class*="{$s}help--"]){color:var(--op-ink-soft)}
.{$p}{$s}text{font-size:14px;font-weight:400;line-height:1.6}
.{$p}{$s}text:not([class*="{$s}text--"]){color:var(--op-ink-muted)}
.{$p}{$s}pill,.{$p}{$s}chip{border-width:1px;border-style:solid;border-radius:var(--op-pill);font-size:12px;font-weight:700;line-height:1}
.{$p}{$s}pill:not([class*="{$s}pill--"]),.{$p}{$s}chip:not([class*="{$s}chip--"]){border-color:var(--op-primary-border);background:var(--op-primary-subtle);color:var(--op-primary-emphasis)}
.{$p}{$s}pill--ok,.{$p}{$s}pill--good{background:var(--op-ok-bg);border-color:var(--op-ok-line);color:var(--op-ok-ink)}
.{$p}{$s}pill--warn{background:var(--op-warn-bg);border-color:var(--op-warn-line);color:var(--op-warn-ink)}
.{$p}{$s}pill--bad,.{$p}{$s}pill--danger{background:var(--op-bad-bg);border-color:var(--op-bad-line);color:var(--op-bad-ink)}
.{$p}{$s}alert,.{$p}{$s}notice{border:1px solid transparent;border-radius:var(--op-radius);font-size:14px;font-weight:400}
.{$p}{$s}alert--ok,.{$p}{$s}notice--ok{background:var(--op-ok-bg);border-color:var(--op-ok-line);color:var(--op-ok-ink)}
.{$p}{$s}alert--bad,.{$p}{$s}notice--bad,.{$p}{$s}error{background:var(--op-bad-bg);border-color:var(--op-bad-line);color:var(--op-bad-ink)}
.{$p}{$s}alert--warn,.{$p}{$s}notice--warn{background:var(--op-warn-bg);border-color:var(--op-warn-line);color:var(--op-warn-ink)}
.{$p}{$s}error{border:1px solid var(--op-bad-line);border-radius:var(--op-radius);font-size:14px;font-weight:400}
.{$p}{$s}kicker{color:var(--op-ink-soft);font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.{$p}{$s}pre,.{$p}{$s}code{border:1px solid var(--op-line);border-radius:var(--op-radius);background:var(--op-surface-soft);color:var(--op-ink);font-family:"Space Mono",Menlo,Consolas,"Courier New",monospace;font-size:13px}
.{$p}{$s}empty{border:1px dashed var(--op-line-strong);border-radius:var(--op-radius);background:var(--op-surface-soft);color:var(--op-ink-soft);font-size:14px;font-weight:400;line-height:1.6}
.{$p}{$s}detail{border:1px solid var(--op-line);border-radius:var(--op-radius);background:var(--op-surface-soft)}
.{$p}{$s}detail strong{color:var(--op-ink-soft);font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.{$p}{$s}metric,.{$p}{$s}tile,.{$p}{$s}kpi,.{$p}{$s}stat,.{$p}{$s}mini-stat{border-width:1px;border-style:solid;border-radius:var(--op-radius);box-shadow:none}
.{$p}{$s}metric:not([class*="{$s}metric--"]),.{$p}{$s}tile:not([class*="{$s}tile--"]),.{$p}{$s}kpi:not([class*="{$s}kpi--"]),.{$p}{$s}stat:not([class*="{$s}stat--"]),.{$p}{$s}mini-stat:not([class*="{$s}mini-stat--"]){border-color:var(--op-line);background:var(--op-surface);color:var(--op-ink)}
.{$p}{$s}metrics,.{$p}{$s}kpis{gap:12px}
.{$p}{$s}num,.{$p}{$s}count,.{$p}{$s}value{color:var(--op-ink);font-family:var(--op-font);font-weight:700;letter-spacing:-.01em}
.{$p}{$s}label,.{$p}{$s}caption{color:var(--op-ink-soft);font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.{$p}{$s}head,.{$p}{$s}panel-head,.{$p}{$s}card-head{color:var(--op-ink);font-family:var(--op-font);font-weight:700}
.{$p}{$s}panel-head,.{$p}{$s}card-head{border-bottom-color:var(--op-line)}
.{$p}{$s}toolbar{border:1px solid var(--op-line);border-radius:var(--op-radius);background:var(--op-surface-soft)}
/* Colour only. -note is a bottom-bordered LIST ROW on workspace_parent and a
   callout elsewhere; giving it a box would turn those rows into cards. Same
   reasoning for -head above: recolour the rule a page already draws, never
   add one. */
.{$p}{$s}note,.{$p}{$s}summary{border-color:var(--op-line);color:var(--op-ink-muted)}
.{$p}{$s}chart,.{$p}{$s}barbox{border:1px solid var(--op-line);border-radius:var(--op-radius);background:var(--op-surface)}
.{$p}{$s}tag{border:1px solid var(--op-primary-border);border-radius:var(--op-pill);background:var(--op-primary-subtle);color:var(--op-primary-emphasis);font-size:12px;font-weight:700}
.{$p}{$s}item{border-color:var(--op-line)}
.{$p}{$s}body{color:var(--op-ink-muted);font-size:14px;line-height:1.5}
.{$p}{$s}ico{color:var(--op-ink-soft)}
.{$p}{$s}meta{gap:6px}
.{$p}{$s}modal-box{border:1px solid var(--op-line);border-radius:var(--op-radius-lg);background:var(--op-surface);box-shadow:var(--op-shadow-lg)}
.{$p}{$s}close{border:1px solid var(--op-line-strong);border-radius:var(--op-radius);background:var(--op-surface);color:var(--op-ink)!important;font-family:var(--op-font);font-weight:700}
.{$p}{$s}top{padding:16px 20px;border:1px solid var(--op-header-bg);border-radius:var(--op-radius);background:var(--op-header-bg);color:var(--op-header-ink);box-shadow:none}
.{$p}{$s}top h1,.{$p}{$s}top h2,.{$p}{$s}top h3,.{$p}{$s}top .{$p}{$s}title,.{$p}{$s}top .pqh-workspace-title{margin:0;color:var(--op-header-ink)!important;font-family:var(--op-font)!important;font-size:24px!important;font-weight:700!important;line-height:1.25!important;letter-spacing:0!important;text-shadow:none!important}
.{$p}{$s}top .{$p}{$s}sub,.{$p}{$s}top .pqh-workspace-sub{color:var(--op-header-ink-soft)!important;font-size:14px!important;font-weight:400!important;opacity:1}
.{$p}{$s}top .{$p}{$s}muted,.{$p}{$s}top .{$p}{$s}help,.{$p}{$s}top .{$p}{$s}meta,.{$p}{$s}top .{$p}{$s}text,.{$p}{$s}top .{$p}{$s}note,.{$p}{$s}top .{$p}{$s}label,.{$p}{$s}top .{$p}{$s}caption,.{$p}{$s}top .{$p}{$s}kicker{color:var(--op-header-ink-soft)!important}
.{$p}{$s}top .{$p}{$s}name,.{$p}{$s}top .{$p}{$s}num,.{$p}{$s}top .{$p}{$s}value,.{$p}{$s}top .{$p}{$s}count,.{$p}{$s}top .{$p}{$s}ico{color:var(--op-header-ink)!important}
.{$p}{$s}top a:not([class*="{$s}btn"]):not([class*="{$s}pill"]){color:var(--op-header-ink)!important}
.{$p}{$s}top h1+*,.{$p}{$s}top h2+*,.{$p}{$s}top h3+*,.{$p}{$s}top .{$p}{$s}title+*,.{$p}{$s}top .pqh-workspace-title+*{margin-top:6px}
.{$p}{$s}top .{$p}{$s}btn,.{$p}{$s}top .pqh-workspace-actions a,.{$p}{$s}top .pqh-workspace-actions button{border:1px solid rgba(255,255,255,.30)!important;border-radius:var(--op-radius)!important;background:rgba(255,255,255,.10)!important;color:var(--op-header-ink)!important;font-family:var(--op-font)!important;font-size:14px!important;font-weight:700!important;box-shadow:none!important}
.{$p}{$s}top .{$p}{$s}btn:hover,.{$p}{$s}top .pqh-workspace-actions a:hover,.{$p}{$s}top .pqh-workspace-actions button:hover{background:rgba(255,255,255,.20)!important;border-color:rgba(255,255,255,.50)!important;color:var(--op-header-ink)!important}
.{$p}{$s}top a.pqh-workspace-logout,.{$p}{$s}top .{$p}{$s}btn.pqh-workspace-logout{background:rgba(255,255,255,.18)!important;border-color:rgba(255,255,255,.60)!important;color:var(--op-header-ink)!important}
.{$p}{$s}top a.pqh-workspace-logout:hover,.{$p}{$s}top .{$p}{$s}btn.pqh-workspace-logout:hover{background:var(--op-header-ink)!important;border-color:var(--op-header-ink)!important;color:var(--op-header-bg)!important}
.{$p}{$s}top select{border:1px solid rgba(255,255,255,.30)!important;border-radius:var(--op-radius)!important;background:rgba(255,255,255,.10)!important;color:var(--op-header-ink)!important;font-family:var(--op-font)!important;font-size:14px!important;font-weight:400!important}
.{$p}{$s}top .{$p}{$s}pill{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.34);color:var(--op-header-ink)}
/* ...and where the page has an appbar, the two become ONE continuous navy
   block rather than two bars. -top keeps everything above -- navy fill, white
   title, ghost buttons -- and only its GEOMETRY changes, so nothing here has to
   restate colour.
   Three things close the seam:
     - the appbar drops its bottom border, so there is no line between them;
     - -top loses its corner radius, so the join is square;
     - -top is pulled out of the wrap's padding. pqh_design_shell_css sets
       {scope}>[class*="-wrap"]{padding:24px 24px 0}, so -24px on three sides
       cancels exactly that and the block reaches the same edges the appbar
       does. 22px of its own padding then lines its text up with the appbar
       brand, which sits at 0 22px.
   Caveat, stated rather than hidden: that same shared rule caps the wrap at
   max-width:1440px. On a viewport wider than roughly 1690px the wrap is
   narrower than the full-bleed appbar, so the lower half of the block stops
   short on the right. Everything below 1440px of content width is flush. */
.{$p}{$s}shell:has(.pqh-appbar) .pqh-appbar{border-bottom-width:0!important}
.{$p}{$s}shell:has(.pqh-appbar) .{$p}{$s}top{margin:-24px -24px 16px!important;padding:16px 22px!important;border:0!important;border-radius:0!important;box-shadow:none!important}
/* Below 900px the shell drops the rail and re-pads the appbar to 8px 14px, so
   the block's own padding has to follow or the title stops lining up with the
   brand -- 8px out, which is exactly the 22px-vs-14px difference.
   The leading class is doubled BY HAND here. The specificity pass above skips
   any line starting with '@', so it doubles the rule outside this media query
   and not the one inside it, leaving the unconditional (0,4,0) rule beating
   this (0,3,0) one and the media query silently dead. */
@media(max-width:900px){.{$p}{$s}shell.{$p}{$s}shell:has(.pqh-appbar) .{$p}{$s}top{padding:14px!important}}

CSS;
    }

    // Two passes that make this sheet beat the pages it is laid over. The
    // reasoning, and what each pass costs, is on pqh_css_force_and_specify().
    $css = pqh_css_force_and_specify($css);

    // The shared workspace header ships a gradient, 950-weight type and a deep
    // shadow with !important on every declaration. This is last in the sheet so
    // it lands whatever the page inherits. Prefix-independent, so once only.
    if (!isset($emittedprefix['@sharedheader'])) {
        $emittedprefix['@sharedheader'] = true;
        $css .= ".pqh-workspace-top{box-shadow:none!important;border-radius:var(--op-radius)!important;"
            . "background:var(--op-header-bg)!important;border-color:var(--op-header-bg)!important;color:var(--op-header-ink)!important}\n";
    }

    // TWO HEADERS, ONE PAGE. 30 of the 40 pages built on pqh_design_shell_html()
    // draw .pqh-appbar -- brand, nav links, Logout -- AND their own <prefix>-top
    // underneath it. That was always true; it was invisible because both were
    // white, so the lower one read as the first content card. Painting -top
    // #162b48 turned a redundancy into a visible second header, which is a
    // defect this skin introduced.
    //
    // Resolution: the APPBAR is the header, because it is the one that already
    // holds the links and is sticky. It goes navy. The page's own -top stops
    // painting on those pages and becomes an ordinary heading strip -- so
    // workspace_dashboard, whose -top carries no title at all and only a
    // workspace switcher, no longer shows an empty navy slab.
    //
    // :has() is what tells the two situations apart. A page with no design
    // shell -- course_offerings, workspace_requests -- has no .pqh-appbar, so
    // its -top keeps the navy band and stays its header. Both live inside
    // <main class="<prefix>-shell">, which is what makes the test possible.
    if (!isset($emittedprefix['@appbar'])) {
        $emittedprefix['@appbar'] = true;
        $css .= <<<CSS
.pqh-appbar.pqh-appbar{background:var(--op-header-bg)!important;background-image:none!important;border-bottom:1px solid var(--op-header-bg)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important}
.pqh-appbar__brand.pqh-appbar__brand{color:var(--op-header-ink)!important;font-family:var(--op-font)!important;font-size:16px!important;font-weight:700!important;letter-spacing:0!important}
.pqh-appbar__brand-icon.pqh-appbar__brand-icon{stroke:var(--op-header-ink)!important}
.pqh-appbar__nav.pqh-appbar__nav a,.pqh-appbar__nav.pqh-appbar__nav button{border:1px solid rgba(255,255,255,.30)!important;border-radius:var(--op-radius)!important;background:rgba(255,255,255,.10)!important;color:var(--op-header-ink)!important;font-family:var(--op-font)!important;font-size:14px!important;font-weight:700!important;box-shadow:none!important}
.pqh-appbar__nav.pqh-appbar__nav a:hover,.pqh-appbar__nav.pqh-appbar__nav button:hover{background:rgba(255,255,255,.20)!important;border-color:rgba(255,255,255,.50)!important;color:var(--op-header-ink)!important}
.pqh-appbar__nav.pqh-appbar__nav .pqh-appbar__logout{background:rgba(255,255,255,.18)!important;border-color:rgba(255,255,255,.60)!important;color:var(--op-header-ink)!important;box-shadow:none!important}
.pqh-appbar__nav.pqh-appbar__nav .pqh-appbar__logout:hover{background:var(--op-header-ink)!important;border-color:var(--op-header-ink)!important;color:var(--op-header-bg)!important}
.pqh-appbar__nav.pqh-appbar__nav a.pqh-appbar__icon svg{stroke:currentColor!important}

CSS;
    }

    // The sidebar rail. Also prefix-independent, so once only.
    //
    // Written here rather than in pqh_design_shell_css() where the rail is
    // defined, for the same reason nothing else in this skin edits a page's own
    // CSS: the rail is on 41 pages, and every one of them would change whether
    // or not it has a skin call. This way it follows the skin exactly.
    //
    // The rail's own rules carry !important on background and colour, so these
    // double the class to (0,2,0) and re-declare it -- the same trick the rest
    // of the generator uses. .is-active is (0,2,0) in the original, so the
    // active rule here needs all three classes to land.
    //
    // The redesign: items stop being filled chips (#f4f6f9 pills at 9px radius)
    // and become flat rows the way OpenProject's own sidebar reads -- transparent
    // until hovered, 3px corners, regular weight, bold only when active. The
    // brand square loses its blue gradient and drop shadow for a flat primary
    // tile. LAYOUT IS UNTOUCHED: no widths, no padding, no position, so the
    // 248px rail and its 72px collapsed state still behave exactly as before.
    if (!isset($emittedprefix['@railskin'])) {
        $emittedprefix['@railskin'] = true;
        $css .= <<<CSS
.pqh-gnav.pqh-gnav{background:var(--op-surface);border-right-color:var(--op-line)}
.pqh-gnav__name.pqh-gnav__name{color:var(--op-ink);font-family:var(--op-font);font-size:15px;font-weight:700;letter-spacing:0}
.pqh-gnav__mark.pqh-gnav__mark{border-radius:var(--op-radius);background:var(--op-primary);color:#fff!important;font-family:var(--op-font);font-size:14px;font-weight:700;box-shadow:none}
.pqh-gnav__mark--img.pqh-gnav__mark--img{background:var(--op-surface);box-shadow:none}
.pqh-gnav__item.pqh-gnav__item{border-radius:var(--op-radius)!important;background:transparent!important;color:var(--op-ink-muted)!important;font-family:var(--op-font)!important;font-size:14px!important;font-weight:400!important;box-shadow:none!important}
.pqh-gnav__item.pqh-gnav__item:hover{background:var(--op-canvas)!important;color:var(--op-ink)!important}
.pqh-gnav__item.pqh-gnav__item.is-active{background:var(--op-primary-subtle)!important;color:var(--op-primary-emphasis)!important;font-weight:700!important}
.pqh-gnav__foot.pqh-gnav__foot{border-top-color:var(--op-line)}
.pqh-gnav__foot .pqh-gnav__item.pqh-gnav__item{color:var(--op-ink-soft)!important}
.pqh-gnav__foot .pqh-gnav__item.pqh-gnav__item:hover{color:var(--op-ink)!important}

CSS;
    }

    return $css;
}
