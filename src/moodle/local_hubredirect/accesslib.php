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
.pqh-workspace-top,.qqh-worksqace-toq{position:relative;overflow:hidden;grid-template-columns:minmax(0,1fr) auto!important;padding:22px 24px!important;border-color:rgba(105,76,45,.14)!important;border-radius:16px!important;background:linear-gradient(135deg,var(--pqh-dashboard-header-bg) 0%,var(--pqh-brand-surface) 62%,#fff 100%)!important;box-shadow:0 16px 38px rgba(105,76,45,.08)!important}
.pqh-workspace-title,.qqh-worksqace-title{display:flex!important;align-items:center!important;gap:14px!important;margin:0!important;color:var(--pqh-dashboard-header-text)!important;font-size:30px!important;font-weight:950!important;line-height:1.08!important;letter-spacing:0!important;text-shadow:0 1px 1px rgba(0,0,0,.12)}
.pqh-brand-mark{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:var(--pqh-brand-primary);color:#fff;font-size:16px;font-weight:950;letter-spacing:.2px;overflow:hidden}
.pqh-brand-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqh-workspace-sub,.qqh-worksqace-sub{margin:7px 0 0!important;color:var(--pqh-dashboard-header-text)!important;font-size:14px!important;font-weight:850!important;opacity:.9}
.pqh-workspace-actions,.qqh-worksqace-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:9px!important;flex-wrap:wrap!important}
.pqh-workspace-actions a,.pqh-workspace-actions button,.qqh-worksqace-actions a,.qqh-worksqace-actions button{min-height:40px!important;padding:0 14px!important;border-radius:10px!important;border:1px solid rgba(23,48,68,.12)!important;background:var(--pqh-brand-surface)!important;color:#173044!important;text-decoration:none!important;font-size:13px!important;font-weight:950!important;box-shadow:0 2px 0 rgba(23,48,68,.04)!important;cursor:pointer!important}
.pqh-workspace-actions a:hover,.pqh-workspace-actions button:hover,.qqh-worksqace-actions a:hover,.qqh-worksqace-actions button:hover{background:#fff!important;border-color:var(--pqh-brand-primary)!important}
.pqh-workspace-actions a.pqh-live-guide-link,.qqh-worksqace-actions a.pqh-live-guide-link,.pqh-live-guide-link,.pqh-workspace-actions a.pqh-live-template-link,.qqh-worksqace-actions a.pqh-live-template-link,.pqh-live-template-link{background:var(--pqh-brand-accent)!important;border-color:var(--pqh-brand-accent)!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-live-guide-link:hover,.qqh-worksqace-actions a.pqh-live-guide-link:hover,.pqh-live-guide-link:hover,.pqh-workspace-actions a.pqh-live-template-link:hover,.qqh-worksqace-actions a.pqh-live-template-link:hover,.pqh-live-template-link:hover{background:#fff!important;border-color:var(--pqh-brand-accent)!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-workspace-logout,.qqh-worksqace-actions a.pqh-workspace-logout{background:var(--pqh-brand-accent)!important;border-color:var(--pqh-brand-accent)!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-workspace-logout:hover,.qqh-worksqace-actions a.pqh-workspace-logout:hover{background:#fff!important;border-color:var(--pqh-brand-accent)!important}
.pqh-workspace-actions select,.qqh-worksqace-actions select{min-height:40px!important;border-radius:10px!important;border:1px solid rgba(23,48,68,.18)!important;background:#fff!important;color:#173044!important;font-size:13px!important;font-weight:900!important}
.pqh-report-header,.pqh-report-title,.pqirb-table thead,.pqw-table thead,.pqh-table thead{background:var(--pqh-report-header-bg)!important;color:var(--pqh-report-header-text)!important}
.pqh-report-body,.pqh-report-card,.pqirb-card,.pqw-panel,.pqh-panel{background:var(--pqh-report-body-bg)!important}
@media(max-width:760px){.pqh-workspace-top,.qqh-worksqace-toq{grid-template-columns:1fr!important;padding:18px!important}.pqh-brand-mark{width:38px;height:38px}.pqh-workspace-actions,.qqh-worksqace-actions{justify-content:flex-start!important}.pqh-workspace-actions a,.pqh-workspace-actions button,.pqh-workspace-actions select,.qqh-worksqace-actions a,.qqh-worksqace-actions button,.qqh-worksqace-actions select{width:auto;max-width:100%}}
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
.pqh-gnav{position:fixed;left:0;top:0;bottom:0;width:248px;z-index:80;display:flex;flex-direction:column;gap:2px;padding:14px 10px;background:#fff;border-right:1px solid #e4e9ef;overflow-y:auto;transition:width .18s ease}
{$scope}.pqh-rail-min .pqh-gnav{width:72px}
.pqh-gnav__brand{display:flex;align-items:center;gap:10px;padding:4px 8px 14px;text-decoration:none!important;background:transparent!important;border:0}
.pqh-gnav__mark{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(115deg,#2166d1,#4d8be0);color:#fff!important;font:800 14px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;box-shadow:0 6px 14px -6px rgba(33,102,209,.5)}
.pqh-gnav__name{font:800 15px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#0f2237;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pqh-gnav__item{display:flex;flex-direction:row;align-items:center;gap:11px;padding:9px 10px;border:0;border-radius:9px;background:transparent!important;color:#5b6b7c!important;font:600 13px/1.3 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-align:left;white-space:nowrap;width:100%;text-decoration:none!important;cursor:pointer;box-shadow:none!important}
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
.pqh-appbar__mark{display:none}
.pqh-appbar__nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.pqh-appbar__nav a,.pqh-appbar__nav button{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:1px solid transparent!important;border-radius:9px;background:transparent!important;color:#5b6b7c!important;font-size:12.5px;font-weight:650!important;text-decoration:none!important;cursor:pointer;box-shadow:none!important}
.pqh-appbar__nav a:hover,.pqh-appbar__nav button:hover{background:#edf3fc!important;color:#17498f!important}
.pqh-appbar__nav .pqh-appbar__logout{background:#2166d1!important;color:#fff!important;font-weight:700!important;box-shadow:0 6px 14px -8px rgba(33,102,209,.55)!important}
.pqh-appbar__nav .pqh-appbar__logout:hover{background:#17498f!important;color:#fff!important}
@media(max-width:900px){{$scope},{$scope}.pqh-rail-min{padding-left:0!important}.pqh-gnav{display:none}.pqh-appbar{height:auto;min-height:60px;padding:8px 14px;flex-wrap:wrap}}
CSS;
}

/**
 * Standard application shell markup: nav rail, blue app bar, and the
 * expandable-rail script. Echo directly after the page's <main> opens.
 */
function pqh_shell_viewer_kind(int $userid): string {
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
        'workspace' => '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
        'live' => '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/>',
        'schedule' => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    ];
    $viewer = pqh_shell_viewer_kind((int)$USER->id);
    if ($viewer === 'student') {
        $items = [
            'dashboard' => ['Dashboard', new moodle_url('/local/hubredirect/student_dashboard.php', $params), $icons['dashboard']],
            'workspace' => ['Workplace', new moodle_url('/local/hubredirect/student_workplace.php', $params), $icons['workspace']],
            'schedule' => ['Schedule', new moodle_url('/local/hubredirect/live_schedule.php', $params + ['childid' => (int)$USER->id]), $icons['schedule']],
        ];
        $appbar = [
            ['Dashboard', $items['dashboard'][1]],
            ['Student workplace', $items['workspace'][1]],
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
        $items = [
            'dashboard' => ['Dashboard', new moodle_url($staffhome, $params), $icons['dashboard']],
            'workspace' => ['Workspace', new moodle_url('/local/hubredirect/teacher_workspace.php', $params), $icons['workspace']],
            'live' => ['Live', new moodle_url('/local/hubredirect/live_sessions.php', $params), $icons['live']],
            'schedule' => ['Schedule', new moodle_url('/local/hubredirect/live_schedule.php', $params), $icons['schedule']],
        ];
        $appbar = [
            ['Dashboard', $items['dashboard'][1]],
            ['Teacher workspace', $items['workspace'][1]],
            ['Live sessions', $items['live'][1]],
        ];
    }
    $logouturl = (new moodle_url('/local/hubredirect/logout.php'))->out(false);
    $title = trim((string)($opts['title'] ?? '')) ?: $brand;
    $html = '<nav class="pqh-gnav" aria-label="Global navigation">';
    $html .= '<a class="pqh-gnav__brand" href="' . $items['dashboard'][1]->out(false) . '" title="' . s($brand) . '">'
        . '<span class="pqh-gnav__mark">' . s($initials) . '</span>'
        . '<span class="pqh-gnav__name">' . s($brand) . '</span></a>';
    foreach ($items as $key => $item) {
        $html .= '<a class="pqh-gnav__item' . ($key === $active ? ' is-active' : '') . '" href="' . $item[1]->out(false) . '">'
            . '<svg viewBox="0 0 24 24">' . $item[2] . '</svg><span class="pqh-gnav__label">' . s($item[0]) . '</span></a>';
    }
    if (!empty($opts['navitems']) && is_array($opts['navitems'])) {
        foreach ($opts['navitems'] as $item) {
            $url = ($item['url'] ?? '') instanceof moodle_url ? $item['url']->out(false) : (string)($item['url'] ?? '#');
            $attrs = trim((string)($item['attrs'] ?? ''));
            $html .= '<a class="pqh-gnav__item"' . ($attrs !== '' ? ' ' . $attrs : '') . ' href="' . $url . '">'
                . '<svg viewBox="0 0 24 24">' . (string)($item['icon'] ?? '') . '</svg>'
                . '<span class="pqh-gnav__label">' . s((string)($item['label'] ?? '')) . '</span></a>';
        }
    }
    $html .= '<div class="pqh-gnav__foot">';
    $html .= '<a class="pqh-gnav__item" href="' . $logouturl . '"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg><span class="pqh-gnav__label">Logout</span></a>';
    $html .= '<button class="pqh-gnav__item" id="pqh-rail-toggle" type="button" aria-label="Collapse or expand navigation"><svg viewBox="0 0 24 24"><path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/></svg><span class="pqh-gnav__label">Collapse</span></button>';
    $html .= '</div></nav>';
    $html .= '<div class="pqh-appbar"><div class="pqh-appbar__brand">' . s($title) . '</div><div class="pqh-appbar__nav">';
    foreach ($appbar as $link) {
        $html .= '<a href="' . $link[1]->out(false) . '">' . s($link[0]) . '</a>';
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
        . 'if(toggle){toggle.addEventListener("click",function(){var x=shell.classList.toggle("pqh-rail-min");try{window.localStorage.setItem(key,x?"1":"0");}catch(e){}});}})();</script>';
    return $html;
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

function pqh_resource_allowed_origins(): array {
    $origins = [];
    foreach (pqh_shared_resource_hosts() as $host) {
        $origins[] = 'https://' . $host;
    }
    return array_values(array_unique($origins));
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
