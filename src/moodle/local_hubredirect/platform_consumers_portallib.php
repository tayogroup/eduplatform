<?php
// Platform-consumers query/write library — extracted VERBATIM from
// platform_consumers.php (renamed pqpc_ -> pqpcl_) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
// Requires: local/hubredirect/accesslib.php AND local/hubredirect/institutionlib.php
// loaded first (pqh_* / pqhi_* helpers are called at runtime, not copied).

defined('MOODLE_INTERNAL') || die();

function pqpcl_status_options(): array {
    return ['active' => 'Active', 'paused' => 'Paused', 'archived' => 'Archived'];
}

function pqpcl_domain_status_options(): array {
    return ['active' => 'Active', 'pending' => 'Pending', 'disabled' => 'Disabled'];
}

function pqpcl_domain_type_options(): array {
    return ['public' => 'Public', 'app' => 'App'];
}

function pqpcl_clean_local_path(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '') {
        return $fallback;
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new invalid_parameter_exception('Choose a local Moodle path such as /local/hubredirect/consumer_landing.php.');
    }
    return $path;
}

function pqpcl_update_workspace(int $workspaceid, string $status): void {
    global $DB;
    if ($workspaceid <= 0 || !array_key_exists($status, pqpcl_status_options())) {
        throw new invalid_parameter_exception('Choose a valid workspace status.');
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    if (!$workspace) {
        throw new invalid_parameter_exception('Workspace was not found.');
    }
    $workspace->status = $status;
    if (pqh_table_has_field_safe('local_prequran_workspace', 'timemodified')) {
        $workspace->timemodified = time();
    }
    $DB->update_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', $workspace));
}

function pqpcl_update_consumer(
    int $consumerid,
    string $name,
    string $slug,
    string $consumertype,
    string $institutiontype,
    string $faithsubcategory,
    string $teachingmethod,
    string $operatortype,
    string $status,
    string $supportemail,
    string $publicpath,
    string $dashboardpath,
    string $logourl,
    string $brandinitials,
    string $primarycolor,
    string $accentcolor,
    string $surfacecolor,
    string $heroimage,
    string $headline,
    string $subtitle,
    string $bodycopy,
    string $initialcourses
): void {
    global $DB;
    if ($consumerid <= 0 || !array_key_exists($status, pqpcl_status_options())) {
        throw new invalid_parameter_exception('Choose a valid consumer status.');
    }
    if (!array_key_exists($consumertype, pqhi_consumer_type_options()) && $consumertype !== 'platform_foundation') {
        throw new invalid_parameter_exception('Choose a valid consumer type.');
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
    if (!$consumer) {
        throw new invalid_parameter_exception('Consumer was not found.');
    }
    $name = trim($name);
    $slug = pqhi_clean_slug($slug);
    if ($name === '' || $slug === '') {
        throw new invalid_parameter_exception('Consumer name and slug are required.');
    }
    if (!pqhi_consumer_slug_available($slug, $consumerid)) {
        throw new invalid_parameter_exception('Consumer slug is already used.');
    }
    $consumer->name = $name;
    $consumer->slug = $slug;
    $consumer->consumer_type = $consumertype;
    $cleaninstitutiontype = $consumertype === 'institution' ? pqhi_clean_institution_type($institutiontype) : '';
    $consumer->institution_type = $cleaninstitutiontype;
    $consumer->faith_subcategory = $cleaninstitutiontype === 'faith_based_education' ? pqhi_clean_faith_subcategory($faithsubcategory) : '';
    $consumer->teaching_method = $consumertype === 'institution' ? pqhi_clean_teaching_method($teachingmethod) : '';
    $consumer->operator_type = $consumertype === 'institution' ? pqhi_clean_operator_type($operatortype) : '';
    $consumer->status = $status;
    $supportemail = clean_param(trim($supportemail), PARAM_EMAIL);
    if ($supportemail !== '' && !validate_email($supportemail)) {
        throw new invalid_parameter_exception('Support email is not valid.');
    }
    if ($supportemail !== '') {
        $consumer->supportemail = $supportemail;
        $consumer->emailreplyto = $supportemail;
    }
    $consumer->defaultpublicpath = pqpcl_clean_local_path($publicpath, (string)($consumer->defaultpublicpath ?? '/'));
    $consumer->defaultdashboardpath = pqpcl_clean_local_path($dashboardpath, (string)($consumer->defaultdashboardpath ?? '/local/hubredirect/dashboard.php'));
    $oldcopy = pqhi_json_array((string)($consumer->copyjson ?? ''));
    $consumer->logourl = pqhi_clean_url($logourl);
    $theme = pqhi_default_theme([
        'primary_color' => $primarycolor,
        'accent_color' => $accentcolor,
        'surface_color' => $surfacecolor,
    ]);
    $copy = pqhi_default_copy($name, [
        'brand_initials' => $brandinitials,
        'landing_headline' => $headline,
        'landing_subtitle' => $subtitle,
        'landing_body' => $bodycopy,
        'hero_image_url' => $heroimage,
        'initial_courses' => $initialcourses,
    ]);
    if (!empty($oldcopy['default_login_path'])) {
        $copy['default_login_path'] = (string)$oldcopy['default_login_path'];
    }
    $consumer->themejson = json_encode($theme, JSON_UNESCAPED_SLASHES);
    $consumer->copyjson = json_encode($copy, JSON_UNESCAPED_SLASHES);
    if (pqh_table_has_field_safe('local_prequran_consumer', 'timemodified')) {
        $consumer->timemodified = time();
    }
    $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $consumer));
}

function pqpcl_link_workspace(int $consumerid, int $workspaceid, int $ownerid): void {
    global $DB;
    if ($consumerid <= 0 || $workspaceid <= 0) {
        throw new invalid_parameter_exception('Choose a consumer and workspace to link.');
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
    if (!$consumer || !$workspace) {
        throw new invalid_parameter_exception('Consumer or workspace was not found.');
    }
    $consumer->primaryworkspaceid = $workspaceid;
    if ($ownerid > 0) {
        $consumer->owneruserid = $ownerid;
    }
    if (pqh_table_has_field_safe('local_prequran_consumer', 'timemodified')) {
        $consumer->timemodified = time();
    }
    $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $consumer));
}

function pqpcl_create_workspace_for_consumer(int $consumerid, int $ownerid): int {
    global $DB, $USER;
    if ($consumerid <= 0) {
        throw new invalid_parameter_exception('Choose a consumer before creating a workspace.');
    }
    $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], '*', IGNORE_MISSING);
    if (!$consumer) {
        throw new invalid_parameter_exception('Consumer was not found.');
    }
    $ownerid = $ownerid > 0 ? $ownerid : (int)($consumer->owneruserid ?? 0);
    if ($ownerid <= 0) {
        $ownerid = (int)$USER->id;
    }
    $workspaceid = pqhi_create_workspace_for_consumer(
        (string)$consumer->name,
        (string)$consumer->slug,
        (string)$consumer->consumer_type,
        $ownerid,
        ['created_from' => 'platform_consumers'],
        (int)$USER->id
    );
    pqpcl_link_workspace($consumerid, $workspaceid, $ownerid);
    pqhi_upsert_workspace_member($workspaceid, $ownerid, 'owner', (int)$USER->id, 'Linked by platform consumer manager.');
    pqhi_upsert_workspace_member($workspaceid, $ownerid, 'admin', (int)$USER->id, 'Linked by platform consumer manager.');
    return $workspaceid;
}

function pqpcl_update_domain(int $domainid, string $status, string $domaintype, int $isprimary): void {
    global $DB;
    if ($domainid <= 0 || !array_key_exists($status, pqpcl_domain_status_options()) || !array_key_exists($domaintype, pqpcl_domain_type_options())) {
        throw new invalid_parameter_exception('Choose valid domain settings.');
    }
    $domain = $DB->get_record('local_prequran_consumer_domain', ['id' => $domainid], '*', IGNORE_MISSING);
    if (!$domain) {
        throw new invalid_parameter_exception('Domain row was not found.');
    }
    if ($isprimary === 1) {
        $DB->set_field('local_prequran_consumer_domain', 'isprimary', 0, [
            'consumerid' => (int)$domain->consumerid,
            'domain_type' => $domaintype,
        ]);
    }
    $domain->status = $status;
    $domain->domain_type = $domaintype;
    $domain->isprimary = $isprimary;
    if (pqh_table_has_field_safe('local_prequran_consumer_domain', 'timemodified')) {
        $domain->timemodified = time();
    }
    $DB->update_record('local_prequran_consumer_domain', pqhi_record_for_existing_columns('local_prequran_consumer_domain', $domain));
}

function pqpcl_add_domain(int $consumerid, int $workspaceid, string $domain, string $domaintype, int $isprimary): void {
    global $DB, $USER;
    if ($consumerid <= 0 || $workspaceid <= 0 || !array_key_exists($domaintype, pqpcl_domain_type_options())) {
        throw new invalid_parameter_exception('Choose valid domain settings.');
    }
    if ($isprimary === 1) {
        $DB->set_field('local_prequran_consumer_domain', 'isprimary', 0, [
            'consumerid' => $consumerid,
            'domain_type' => $domaintype,
        ]);
    }
    pqhi_upsert_consumer_domain($consumerid, $workspaceid, $domain, $domaintype, $isprimary, (int)$USER->id);
}

function pqpcl_consumer_rows(): array {
    global $DB;
    if (!pqh_consumer_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.slug, c.name, c.consumer_type, c.institution_type, c.faith_subcategory, c.teaching_method, c.status, c.primaryworkspaceid, c.owneruserid,
                c.operator_type,
                c.supportemail, c.emailfromname, c.emailreplyto, c.defaultpublicpath, c.defaultdashboardpath,
                c.logourl, c.themejson, c.copyjson, c.timemodified,
                w.name AS workspacename, w.slug AS workspaceslug, w.status AS workspacestatus,
                w.workspace_type, w.ownerid
           FROM {local_prequran_consumer} c
      LEFT JOIN {local_prequran_workspace} w ON w.id = c.primaryworkspaceid
          WHERE c.consumer_type <> :foundation
       ORDER BY c.status ASC, c.name ASC",
        ['foundation' => 'platform_foundation']
    ));
}

function pqpcl_domains_by_consumer(array $consumers): array {
    global $DB;
    if (!$consumers || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    $ids = array_map(static fn($row): int => (int)$row->id, $consumers);
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'consumer');
    $rows = $DB->get_records_select('local_prequran_consumer_domain', "consumerid {$insql}", $params, 'consumerid ASC, domain_type ASC, isprimary DESC, domain ASC');
    $grouped = [];
    foreach ($rows as $row) {
        $grouped[(int)$row->consumerid][] = $row;
    }
    return $grouped;
}

function pqpcl_workspace_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_values($DB->get_records_select(
        'local_prequran_workspace',
        "status <> ?",
        ['archived'],
        'name ASC',
        'id,name,slug,workspace_type,status,ownerid'
    ));
}
