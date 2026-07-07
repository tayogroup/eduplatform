<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

function pqhi_clean_slug(string $value): string {
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? substr($slug, 0, 120) : 'institution-' . time();
}

function pqhi_unique_workspace_slug(string $name): string {
    global $DB;
    $base = pqhi_clean_slug($name);
    $slug = $base;
    $suffix = 1;
    while ($DB->record_exists('local_prequran_workspace', ['slug' => $slug])) {
        $suffix++;
        $slug = substr($base, 0, 112) . '-' . $suffix;
    }
    return $slug;
}

function pqhi_normalize_domain(string $domain): string {
    $domain = strtolower(trim($domain));
    $domain = preg_replace('/^https?:\/\//', '', $domain) ?? '';
    $domain = preg_replace('/\/.*$/', '', $domain) ?? '';
    $domain = preg_replace('/:\d+$/', '', $domain) ?? '';
    $domain = trim($domain, " \t\n\r\0\x0B.");
    return $domain !== '' ? clean_param($domain, PARAM_HOST) : '';
}

function pqhi_clean_hex_color(string $value, string $fallback = ''): string {
    $value = trim($value);
    if (preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        return strtolower($value);
    }
    return $fallback;
}

function pqhi_clean_url(string $value): string {
    if (function_exists('pqh_clean_brand_url')) {
        return pqh_clean_brand_url($value);
    }
    $value = trim(str_replace(["\r", "\n", '"', "'", '\\'], '', $value));
    return $value !== '' ? clean_param($value, PARAM_URL) : '';
}

function pqhi_json_array(string $json): array {
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function pqhi_record_for_existing_columns(string $table, stdClass $record): stdClass {
    global $DB;
    $columns = $DB->get_columns($table);
    $clean = new stdClass();
    foreach ((array)$record as $field => $value) {
        if (isset($columns[$field])) {
            $clean->{$field} = $value;
        }
    }
    return $clean;
}

function pqhi_find_user(string $needle): ?stdClass {
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

function pqhi_default_theme(array $theme = []): array {
    $primary = pqhi_clean_hex_color((string)($theme['primary_color'] ?? ''), '#2f6f4e');
    $accent = pqhi_clean_hex_color((string)($theme['accent_color'] ?? ''), '#d99a26');
    $surface = pqhi_clean_hex_color((string)($theme['surface_color'] ?? ''), '#f4f8fb');
    return [
        'primary_color' => $primary,
        'accent_color' => $accent,
        'surface_color' => $surface,
    ];
}

function pqhi_default_copy(string $name, array $copy = []): array {
    $headline = trim((string)($copy['landing_headline'] ?? ''));
    $subtitle = trim((string)($copy['landing_subtitle'] ?? ''));
    return [
        'brand_initials' => trim((string)($copy['brand_initials'] ?? strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $name) ?: 'I', 0, 2)))),
        'landing_headline' => $headline !== '' ? $headline : $name,
        'landing_subtitle' => $subtitle !== ''
            ? $subtitle
            : 'A branded teaching workspace for students, teachers, live sessions, reporting, and custom-domain access.',
        'landing_body' => trim((string)($copy['landing_body'] ?? '')),
        'hero_image_url' => pqhi_clean_url((string)($copy['hero_image_url'] ?? '')),
        'initial_courses' => trim((string)($copy['initial_courses'] ?? 'Pre-Quraan')),
    ];
}

function pqhi_consumer_type_options(): array {
    return [
        'academy_consumer' => 'Academy consumer',
        'institution' => 'Institution consumer',
        'marketplace' => 'Marketplace consumer',
        'teacher_workspace' => 'Teacher workspace consumer',
    ];
}

function pqhi_workspace_type_for_consumer(string $consumertype): string {
    return match ($consumertype) {
        'academy_consumer' => 'academy_managed',
        'teacher_workspace' => 'solo_teacher',
        'marketplace' => 'partner',
        default => 'institution',
    };
}

function pqhi_default_routes_for_consumer(string $consumertype): array {
    return match ($consumertype) {
        'academy_consumer' => [
            'public' => '/local/ehelhome/index.php',
            'dashboard' => '/local/hubredirect/dashboard.php',
            'login' => '/local/hubredirect/consumer_login.php',
        ],
        'marketplace' => [
            'public' => '/local/hubredirect/consumer_landing.php',
            'dashboard' => '/local/hubredirect/teacher_marketplace_admin.php',
            'login' => '/local/hubredirect/consumer_login.php',
        ],
        default => [
            'public' => '/local/hubredirect/consumer_landing.php',
            'dashboard' => '/local/hubredirect/workspace_dashboard.php',
            'login' => '/local/hubredirect/consumer_login.php',
        ],
    };
}

function pqhi_consumer_for_workspace(int $workspaceid, string $slug = ''): ?stdClass {
    global $DB;
    if ($workspaceid <= 0 || !pqh_consumer_schema_ready()) {
        return null;
    }
    if ($slug !== '') {
        $consumer = $DB->get_record('local_prequran_consumer', ['slug' => $slug], '*', IGNORE_MISSING);
        if ($consumer && (int)($consumer->primaryworkspaceid ?? 0) === $workspaceid) {
            return $consumer;
        }
    }
    return $DB->get_record('local_prequran_consumer', [
        'primaryworkspaceid' => $workspaceid,
        'status' => 'active',
    ], '*', IGNORE_MISSING) ?: null;
}

function pqhi_upsert_workspace_member(int $workspaceid, int $userid, string $role, int $createdby, string $notes = ''): void {
    global $DB;
    if ($workspaceid <= 0 || $userid <= 0 || !array_key_exists($role, pqh_workspace_roles())) {
        return;
    }
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
        'notes' => $notes,
        'createdby' => $createdby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_workspace_member', pqhi_record_for_existing_columns('local_prequran_workspace_member', $record));
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_workspace_member', pqhi_record_for_existing_columns('local_prequran_workspace_member', $record));
}

function pqhi_upsert_consumer_domain(int $consumerid, int $workspaceid, string $domain, string $domaintype, int $isprimary, int $createdby): void {
    global $DB;
    $domain = pqhi_normalize_domain($domain);
    if ($consumerid <= 0 || $workspaceid <= 0 || $domain === '' || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return;
    }
    $domaintype = in_array($domaintype, ['public', 'app'], true) ? $domaintype : 'public';
    $now = time();
    $existing = $DB->get_record('local_prequran_consumer_domain', ['domain' => $domain], '*', IGNORE_MISSING);
    if ($existing && (int)$existing->consumerid !== $consumerid) {
        throw new invalid_parameter_exception('Domain ' . $domain . ' is already assigned to another institution.');
    }
    $record = (object)[
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'domain' => $domain,
        'domain_type' => $domaintype,
        'isprimary' => $isprimary,
        'sslstatus' => 'not_checked',
        'verificationstatus' => 'pending_dns',
        'verifiedat' => 0,
        'status' => 'active',
        'createdby' => $createdby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_consumer_domain', pqhi_record_for_existing_columns('local_prequran_consumer_domain', $record));
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_consumer_domain', pqhi_record_for_existing_columns('local_prequran_consumer_domain', $record));
}

function pqhi_consumer_slug_available(string $slug, int $consumerid = 0): bool {
    global $DB;
    if ($slug === '' || !pqh_table_exists_safe('local_prequran_consumer')) {
        return false;
    }
    $existingid = (int)$DB->get_field('local_prequran_consumer', 'id', ['slug' => $slug], IGNORE_MISSING);
    return $existingid <= 0 || $existingid === $consumerid;
}

function pqhi_upsert_consumer(int $workspaceid, string $name, string $slug, int $ownerid, array $data, int $createdby): int {
    global $DB;
    if ($workspaceid <= 0 || !pqh_consumer_schema_ready()) {
        throw new invalid_parameter_exception('Consumer/domain tables are not ready.');
    }
    $slug = pqhi_clean_slug($slug !== '' ? $slug : $name);
    $existing = pqhi_consumer_for_workspace($workspaceid, $slug);
    if (!$existing) {
        $existing = $DB->get_record('local_prequran_consumer', ['primaryworkspaceid' => $workspaceid], '*', IGNORE_MISSING);
    }
    if (!pqhi_consumer_slug_available($slug, $existing ? (int)$existing->id : 0)) {
        throw new invalid_parameter_exception('Institution slug is already used.');
    }
    $oldtheme = $existing ? pqhi_json_array((string)($existing->themejson ?? '')) : [];
    $oldcopy = $existing ? pqhi_json_array((string)($existing->copyjson ?? '')) : [];
    $theme = pqhi_default_theme([
        'primary_color' => $data['primary_color'] ?? ($oldtheme['primary_color'] ?? ''),
        'accent_color' => $data['accent_color'] ?? ($oldtheme['accent_color'] ?? ''),
        'surface_color' => $data['surface_color'] ?? ($oldtheme['surface_color'] ?? ''),
    ]);
    $copy = pqhi_default_copy($name, [
        'brand_initials' => $data['brand_initials'] ?? ($oldcopy['brand_initials'] ?? ''),
        'landing_headline' => $data['landing_headline'] ?? ($oldcopy['landing_headline'] ?? ''),
        'landing_subtitle' => $data['landing_subtitle'] ?? ($oldcopy['landing_subtitle'] ?? ''),
        'landing_body' => $data['landing_body'] ?? ($oldcopy['landing_body'] ?? ''),
        'hero_image_url' => $data['hero_image_url'] ?? ($oldcopy['hero_image_url'] ?? ''),
        'initial_courses' => $data['initial_courses'] ?? ($oldcopy['initial_courses'] ?? ''),
    ]);
    $supportemail = clean_param((string)($data['supportemail'] ?? ($existing->supportemail ?? '')), PARAM_EMAIL);
    $logourl = pqhi_clean_url((string)($data['logourl'] ?? ($existing->logourl ?? '')));
    $now = time();
    $record = (object)[
        'slug' => $slug,
        'name' => $name,
        'consumer_type' => 'institution',
        'status' => 'active',
        'primaryworkspaceid' => $workspaceid,
        'owneruserid' => $ownerid,
        'supportemail' => $supportemail,
        'logourl' => $logourl,
        'themejson' => json_encode($theme, JSON_UNESCAPED_SLASHES),
        'copyjson' => json_encode($copy, JSON_UNESCAPED_SLASHES),
        'defaultpublicpath' => '/local/hubredirect/consumer_landing.php',
        'defaultdashboardpath' => '/local/hubredirect/workspace_dashboard.php',
        'emailfromname' => $name,
        'emailreplyto' => $supportemail,
        'createdby' => $createdby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $record));
        return (int)$existing->id;
    }
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $record));
}

function pqhi_create_workspace_for_consumer(string $name, string $slug, string $consumertype, int $ownerid, array $data, int $createdby): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        throw new invalid_parameter_exception('Workspace table is not ready.');
    }
    $slug = pqhi_unique_workspace_slug($slug !== '' ? $slug : $name);
    $now = time();
    $settings = [
        'created_from' => (string)($data['created_from'] ?? 'consumer_wizard'),
        'consumer_type' => $consumertype,
        'initial_courses' => trim((string)($data['initial_courses'] ?? 'Pre-Quraan')),
        'default_public_domain' => pqhi_normalize_domain((string)($data['publicdomain'] ?? '')),
        'default_app_domain' => pqhi_normalize_domain((string)($data['appdomain'] ?? '')),
    ];
    return (int)$DB->insert_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', (object)[
        'name' => $name,
        'slug' => $slug,
        'workspace_type' => pqhi_workspace_type_for_consumer($consumertype),
        'ownerid' => $ownerid,
        'status' => 'active',
        'plan_code' => trim((string)($data['plancode'] ?? 'pilot')) ?: 'pilot',
        'student_limit' => (int)($data['studentlimit'] ?? 0),
        'teacher_limit' => (int)($data['teacherlimit'] ?? 0),
        'session_limit' => (int)($data['sessionlimit'] ?? 0),
        'storage_limit_mb' => (int)($data['storagelimit'] ?? 0),
        'settingsjson' => json_encode($settings, JSON_UNESCAPED_SLASHES),
        'createdby' => $createdby,
        'timecreated' => $now,
        'timemodified' => $now,
    ]));
}

function pqhi_upsert_consumer_app(int $workspaceid, string $name, string $slug, string $consumertype, int $ownerid, array $data, int $createdby): int {
    global $DB;
    if (!pqh_consumer_schema_ready()) {
        throw new invalid_parameter_exception('Consumer/domain tables are not ready.');
    }
    $slug = pqhi_clean_slug($slug !== '' ? $slug : $name);
    if (!array_key_exists($consumertype, pqhi_consumer_type_options())) {
        throw new invalid_parameter_exception('Choose a valid consumer type.');
    }
    $existing = $DB->get_record('local_prequran_consumer', ['slug' => $slug], '*', IGNORE_MISSING);
    if (!pqhi_consumer_slug_available($slug, $existing ? (int)$existing->id : 0)) {
        throw new invalid_parameter_exception('Consumer slug is already used.');
    }
    $routes = pqhi_default_routes_for_consumer($consumertype);
    $oldtheme = $existing ? pqhi_json_array((string)($existing->themejson ?? '')) : [];
    $oldcopy = $existing ? pqhi_json_array((string)($existing->copyjson ?? '')) : [];
    $theme = pqhi_default_theme([
        'primary_color' => $data['primary_color'] ?? ($oldtheme['primary_color'] ?? ''),
        'accent_color' => $data['accent_color'] ?? ($oldtheme['accent_color'] ?? ''),
        'surface_color' => $data['surface_color'] ?? ($oldtheme['surface_color'] ?? ''),
    ]);
    $copy = pqhi_default_copy($name, [
        'brand_initials' => $data['brand_initials'] ?? ($oldcopy['brand_initials'] ?? ''),
        'landing_headline' => $data['landing_headline'] ?? ($oldcopy['landing_headline'] ?? ''),
        'landing_subtitle' => $data['landing_subtitle'] ?? ($oldcopy['landing_subtitle'] ?? ''),
        'landing_body' => $data['landing_body'] ?? ($oldcopy['landing_body'] ?? ''),
        'hero_image_url' => $data['hero_image_url'] ?? ($oldcopy['hero_image_url'] ?? ''),
        'initial_courses' => $data['initial_courses'] ?? ($oldcopy['initial_courses'] ?? ''),
    ]);
    $copy['default_login_path'] = (string)($data['defaultloginpath'] ?? $routes['login']);
    $supportemail = clean_param((string)($data['supportemail'] ?? ($existing->supportemail ?? '')), PARAM_EMAIL);
    $logourl = pqhi_clean_url((string)($data['logourl'] ?? ($existing->logourl ?? '')));
    $now = time();
    $record = (object)[
        'slug' => $slug,
        'name' => $name,
        'consumer_type' => $consumertype,
        'status' => (string)($data['status'] ?? 'active'),
        'primaryworkspaceid' => $workspaceid,
        'owneruserid' => $ownerid,
        'supportemail' => $supportemail,
        'logourl' => $logourl,
        'themejson' => json_encode($theme, JSON_UNESCAPED_SLASHES),
        'copyjson' => json_encode($copy, JSON_UNESCAPED_SLASHES),
        'defaultpublicpath' => (string)($data['defaultpublicpath'] ?? $routes['public']),
        'defaultdashboardpath' => (string)($data['defaultdashboardpath'] ?? $routes['dashboard']),
        'emailfromname' => trim((string)($data['emailfromname'] ?? $name)),
        'emailreplyto' => $supportemail,
        'createdby' => $createdby,
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->timecreated = (int)$existing->timecreated;
        $DB->update_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $record));
        return (int)$existing->id;
    }
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_consumer', pqhi_record_for_existing_columns('local_prequran_consumer', $record));
}

function pqhi_find_or_create_admin_user(array $data, int $createdby): stdClass {
    global $CFG, $DB;
    $needle = trim((string)($data['adminuser'] ?? ''));
    $existing = pqhi_find_user($needle);
    if ($existing) {
        return $existing;
    }
    $email = clean_param(trim((string)($data['adminemail'] ?? $needle)), PARAM_EMAIL);
    $firstname = trim((string)($data['adminfirstname'] ?? ''));
    $lastname = trim((string)($data['adminlastname'] ?? ''));
    if ($email === '' || !validate_email($email) || $firstname === '' || $lastname === '') {
        throw new invalid_parameter_exception('Enter an existing admin user, or provide first name, last name, and email to create one.');
    }
    require_once($CFG->dirroot . '/user/lib.php');
    $usernamebase = pqhi_clean_slug((string)($data['adminusername'] ?? strstr($email, '@', true) ?: $email));
    $username = $usernamebase;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id])) {
        $suffix++;
        $username = substr($usernamebase, 0, 92) . '-' . $suffix;
    }
    $password = function_exists('generate_password') ? generate_password(14) : random_string(14);
    $userid = create_user_record($username, $password, 'manual');
    $user = core_user::get_user((int)$userid, '*', MUST_EXIST);
    $user->firstname = $firstname;
    $user->lastname = $lastname;
    $user->email = $email;
    $user->auth = 'manual';
    $user->confirmed = 1;
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->timecreated = $user->timecreated ?: time();
    $user->timemodified = time();
    $user->description = trim((string)($user->description ?? '') . "\nCreated by EduPlatform consumer wizard user #" . $createdby);
    $DB->update_record('user', $user);
    set_user_preference('auth_forcepasswordchange', 1, (int)$userid);
    return core_user::get_user((int)$userid, '*', MUST_EXIST);
}

function pqhi_consumer_domains(int $workspaceid, int $consumerid = 0): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    $conditions = ['workspaceid' => $workspaceid, 'status' => 'active'];
    if ($consumerid > 0) {
        $conditions['consumerid'] = $consumerid;
    }
    return array_values($DB->get_records('local_prequran_consumer_domain', $conditions, 'isprimary DESC, domain_type ASC, domain ASC'));
}

function pqhi_email_sender_for_consumer(?stdClass $consumer = null): stdClass {
    $sender = core_user::get_noreply_user();
    if (!$consumer) {
        return $sender;
    }
    $fromname = trim((string)($consumer->emailfromname ?? ''));
    if ($fromname === '') {
        $fromname = trim((string)($consumer->name ?? ''));
    }
    $replyto = clean_param(trim((string)($consumer->emailreplyto ?? ($consumer->supportemail ?? ''))), PARAM_EMAIL);
    if ($fromname !== '') {
        $parts = preg_split('/\s+/', $fromname, 2);
        $sender->firstname = $parts[0] ?? $fromname;
        $sender->lastname = $parts[1] ?? '';
    }
    if ($replyto !== '' && validate_email($replyto)) {
        $sender->replyto = $replyto;
        $sender->replytoname = $fromname !== '' ? $fromname : fullname($sender);
    }
    return $sender;
}

function pqhi_support_recipient_for_consumer(?stdClass $consumer = null): stdClass {
    $recipient = core_user::get_support_user();
    if (!$consumer) {
        return $recipient;
    }
    $supportemail = clean_param(trim((string)($consumer->supportemail ?? '')), PARAM_EMAIL);
    $name = trim((string)($consumer->name ?? 'Institution'));
    if ($supportemail !== '' && validate_email($supportemail)) {
        $recipient->email = $supportemail;
        $recipient->firstname = $name;
        $recipient->lastname = 'Support';
    }
    return $recipient;
}

function pqhi_send_consumer_email(stdClass $to, ?stdClass $consumer, string $subject, string $messagetext, string $messagehtml = ''): bool {
    $brand = $consumer ? trim((string)($consumer->name ?? '')) : '';
    if ($brand !== '' && stripos($subject, $brand) === false) {
        $subject = $brand . ': ' . $subject;
    }
    if ($messagehtml === '') {
        $messagehtml = nl2br(s($messagetext));
    }
    return email_to_user($to, pqhi_email_sender_for_consumer($consumer), $subject, $messagetext, $messagehtml);
}
