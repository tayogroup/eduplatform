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
    $workspaceid = (int)$DB->get_field('local_prequran_workspace', 'id', ['slug' => 'quraan-academy'], IGNORE_MISSING);
    if ($workspaceid > 0) {
        return $workspaceid;
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

function pqh_fallback_consumer_context(string $host = ''): stdClass {
    $context = (object)[
        'consumerid' => 0,
        'consumerslug' => 'eduplatform',
        'consumername' => 'EduPlatform',
        'consumer_type' => 'platform_foundation',
        'workspaceid' => 0,
        'domain' => $host !== '' ? $host : 'eduplatform.ai',
        'domain_type' => 'public',
        'isprimarydomain' => 1,
        'trusted_domain' => false,
        'supportemail' => 'support@eduplatform.ai',
        'logourl' => '',
        'themejson' => '',
        'copyjson' => '',
        'defaultpublicpath' => '/local/hubredirect/platform_landing.php',
        'defaultdashboardpath' => '/local/hubredirect/platform_dashboard.php',
        'emailfromname' => 'EduPlatform',
        'emailreplyto' => 'support@eduplatform.ai',
    ];
    return $context;
}

function pqh_consumer_context_from_records(stdClass $consumer, ?stdClass $domain = null): stdClass {
    $workspaceid = $domain ? (int)($domain->workspaceid ?? 0) : 0;
    if ($workspaceid <= 0) {
        $workspaceid = (int)($consumer->primaryworkspaceid ?? 0);
    }
    if ($workspaceid <= 0 && (string)($consumer->slug ?? '') === 'quraan-academy') {
        $workspaceid = pqh_default_workspace_id();
    }

    return (object)[
        'consumerid' => (int)$consumer->id,
        'consumerslug' => (string)$consumer->slug,
        'consumername' => (string)$consumer->name,
        'consumer_type' => (string)($consumer->consumer_type ?? ''),
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
    $primary = (string)($theme['primary_color'] ?? '#2f6f4e');
    $accent = (string)($theme['accent_color'] ?? '#d99a26');
    $surface = (string)($theme['surface_color'] ?? '#f4f8fb');
    return [
        'primary_color' => preg_match('/^#[0-9a-fA-F]{6}$/', $primary) ? $primary : '#2f6f4e',
        'accent_color' => preg_match('/^#[0-9a-fA-F]{6}$/', $accent) ? $accent : '#d99a26',
        'surface_color' => preg_match('/^#[0-9a-fA-F]{6}$/', $surface) ? $surface : '#f4f8fb',
    ];
}

function pqh_consumer_copy(?stdClass $consumer = null): array {
    return pqh_json_array((string)($consumer->copyjson ?? ''));
}

function pqh_consumer_hero_image_url(?stdClass $consumer = null, string $fallback = '/local/ehelhome/pix/landing-welcome.jpg'): string {
    $copy = pqh_consumer_copy($consumer);
    $hero = pqh_clean_brand_url((string)($copy['hero_image_url'] ?? ''));
    if ($hero !== '') {
        return $hero;
    }
    return pqh_clean_brand_url($fallback) ?: '/local/ehelhome/pix/landing-welcome.jpg';
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
    if (!$consumer) {
        return null;
    }
    return pqh_consumer_context_from_records($consumer, null);
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
        if ($workspaceid === pqh_default_workspace_id()) {
            return pqh_consumer_context_by_slug('quraan-academy');
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
    if ($userid <= 0 || !pqh_table_exists_safe('local_prequran_workspace') || !pqh_table_exists_safe('local_prequran_workspace_member')) {
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
    return array_values($DB->get_records_sql(
        "SELECT w.id, w.name, w.slug, w.workspace_type, w.ownerid, w.status, w.plan_code,
                wm.workspace_role, wm.status AS member_status
           FROM {local_prequran_workspace} w
           JOIN {local_prequran_workspace_member} wm ON wm.workspaceid = w.id
          WHERE wm.userid = :userid
            AND wm.status = :memberstatus
            AND w.status <> :archived
       ORDER BY w.name ASC",
        ['userid' => $userid, 'memberstatus' => 'active', 'archived' => 'archived']
    ));
}

function pqh_user_workspace_role(int $userid, int $workspaceid): string {
    global $DB;
    if ($userid <= 0 || $workspaceid <= 0) {
        return '';
    }
    if (pqh_can_manage_academy_operations($userid)) {
        return 'platform_admin';
    }
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return '';
    }
    $roles = $DB->get_fieldset_select(
        'local_prequran_workspace_member',
        'workspace_role',
        'userid = ? AND workspaceid = ? AND status = ?',
        [$userid, $workspaceid, 'active']
    );
    $rank = ['owner', 'admin', 'coordinator', 'registrar', 'finance', 'support', 'teacher', 'assistant_teacher', 'auditor', 'sponsor', 'parent', 'student'];
    foreach ($rank as $role) {
        if (in_array($role, $roles, true)) {
            return $role;
        }
    }
    return '';
}

function pqh_user_can_manage_workspace(int $userid, int $workspaceid): bool {
    $role = pqh_user_workspace_role($userid, $workspaceid);
    return in_array($role, ['platform_admin', 'owner', 'admin'], true);
}

function pqh_user_can_teach_in_workspace(int $userid, int $workspaceid): bool {
    $role = pqh_user_workspace_role($userid, $workspaceid);
    return in_array($role, ['platform_admin', 'owner', 'admin', 'teacher', 'assistant_teacher'], true);
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
        $fallback = pqh_can_manage_academy_operations($userid) ? pqh_default_workspace_id() : 0;
        return pqh_consumer_context_allows_workspace(null, $fallback) ? $fallback : 0;
    }
    $consumercontext = pqh_current_consumer_context();
    $allowed = [];
    foreach ($workspaces as $workspace) {
        $id = (int)$workspace->id;
        if (pqh_consumer_context_allows_workspace($consumercontext, $id)) {
            $allowed[$id] = true;
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
    $first = (int)$workspaces[0]->id;
    $SESSION->local_prequran_workspaceid = $first;
    return $first;
}

function pqh_workspace_header_css(): string {
    return <<<'CSS'
.pqh-workspace-top{position:relative;overflow:hidden;grid-template-columns:minmax(0,1fr) auto!important;padding:22px 24px!important;border-color:rgba(105,76,45,.14)!important;border-radius:16px!important;background:linear-gradient(135deg,#eaffea 0%,#fff 58%,#fff7e7 100%)!important;box-shadow:0 16px 38px rgba(105,76,45,.08)!important}
.pqh-workspace-title{display:flex!important;align-items:center!important;gap:14px!important;margin:0!important;color:#221b22!important;font-size:30px!important;font-weight:950!important;line-height:1.08!important;letter-spacing:0!important}
.pqh-brand-mark{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:#2f6f4e;color:#fff;font-size:16px;font-weight:950;letter-spacing:.2px;overflow:hidden}
.pqh-brand-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqh-workspace-sub{margin:7px 0 0!important;color:#60735f!important;font-size:14px!important;font-weight:850!important}
.pqh-workspace-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:9px!important;flex-wrap:wrap!important}
.pqh-workspace-actions a,.pqh-workspace-actions button{min-height:40px!important;padding:0 14px!important;border-radius:10px!important;border:1px solid rgba(23,48,68,.12)!important;background:#eef7ee!important;color:#173044!important;text-decoration:none!important;font-size:13px!important;font-weight:950!important;box-shadow:0 2px 0 rgba(23,48,68,.04)!important;cursor:pointer!important}
.pqh-workspace-actions a:hover,.pqh-workspace-actions button:hover{background:#e1f2e1!important;border-color:rgba(47,111,78,.24)!important}
.pqh-workspace-actions a.pqh-live-guide-link,.pqh-live-guide-link,.pqh-workspace-actions a.pqh-live-template-link,.pqh-live-template-link{background:#fff4dc!important;border-color:rgba(214,166,66,.54)!important;color:#4d3522!important}
.pqh-workspace-actions a.pqh-live-guide-link:hover,.pqh-live-guide-link:hover,.pqh-workspace-actions a.pqh-live-template-link:hover,.pqh-live-template-link:hover{background:#ffe9b5!important;border-color:rgba(214,166,66,.78)!important;color:#4d3522!important}
.pqh-workspace-actions a.pqh-workspace-logout{background:#d6a642!important;border-color:#d6a642!important;color:#221b22!important}
.pqh-workspace-actions a.pqh-workspace-logout:hover{background:#c89632!important;border-color:#c89632!important}
.pqh-workspace-actions select{min-height:40px!important;border-radius:10px!important;border:1px solid rgba(23,48,68,.18)!important;background:#fff!important;color:#173044!important;font-size:13px!important;font-weight:900!important}
@media(max-width:760px){.pqh-workspace-top{grid-template-columns:1fr!important;padding:18px!important}.pqh-brand-mark{width:38px;height:38px}.pqh-workspace-actions{justify-content:flex-start!important}.pqh-workspace-actions a,.pqh-workspace-actions button,.pqh-workspace-actions select{width:auto;max-width:100%}}
CSS;
}

function pqh_dashboard_header_css(): string {
    return pqh_workspace_header_css();
}

function pqh_live_session_explainer_media_url(): moodle_url {
    return new moodle_url('/local/hubredirect/pix/live_session_explainer.mp4');
}

function pqh_live_session_explainer_url(): moodle_url {
    return new moodle_url('/local/hubredirect/live_session_guide.php');
}

function pqh_live_session_agenda_template_source_url(): moodle_url {
    return new moodle_url(pqh_bunny_cdn_url('pre_quraan/live-session-templates/live-session-agenda-template.pptx'));
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

function pqh_attach_default_agenda_to_live_session(int $sessionid, int $userid = 0): ?stdClass {
    global $DB;
    if ($sessionid <= 0 || !pqh_live_session_agenda_required_fields_ready()) {
        return null;
    }
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
    if (!$session || trim((string)($session->agenda_slides_path ?? '')) !== '') {
        return $session ?: null;
    }

    $config = pqh_bunny_storage_config('bunny_live_session_slides_prefix', 'pre_quraan/live-session-slides');
    $templatepath = trim((string)get_config('local_prequran', 'bunny_live_session_agenda_template_path'));
    if ($templatepath === '') {
        $templatepath = 'pre_quraan/live-session-templates/live-session-agenda-template.pptx';
    }
    $templatepath = trim(str_replace('\\', '/', $templatepath), '/');
    $filename = 'Live Session Agenda template.pptx';
    $mimetype = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    $bytes = pqh_fetch_from_bunny_storage($templatepath, $config);
    $path = pqh_live_session_agenda_storage_path($sessionid, $filename);
    pqh_upload_bytes_to_bunny_storage($path, $bytes, $mimetype, $config);

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
