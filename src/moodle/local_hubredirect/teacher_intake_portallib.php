<?php
// Teacher-intake helper library — extracted VERBATIM from teacher_intake.php
// (renamed pqti_ -> pqtil_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php + account_ids.php + user/lib.php
// loaded first (pqh_* helpers and user_create_user are called, not copied).
// teacher_intake_config.php stays where it is; callers require() it directly.

defined('MOODLE_INTERNAL') || die();

function pqtil_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtil_column_exists(string $table, string $column): bool {
    global $DB;
    $manager = $DB->get_manager();
    return $manager->table_exists($table) && $manager->field_exists(new xmldb_table($table), $column);
}

function pqtil_ready(): bool {
    return pqtil_table_exists('local_prequran_teacher_profile');
}

function pqtil_trim_param(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqtil_array_param(string $name): array {
    return array_values(array_filter(array_map('trim', optional_param_array($name, [], PARAM_TEXT)), static function($value): bool {
        return $value !== '';
    }));
}

function pqtil_single_array_param(string $name): array {
    $values = pqtil_array_param($name);
    return $values ? [reset($values)] : [];
}

function pqtil_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqtil_phone_email(string $contact, string $prefix): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    if ($token === '') {
        $token = uniqid($prefix, false);
    }
    return $prefix . '.' . $token . '@eduplatform.local';
}

function pqtil_moodle_email_from_contact(string $contact, string $prefix): string {
    if ($contact !== '' && pqtil_contact_is_email($contact)) {
        return $contact;
    }
    return pqtil_phone_email($contact, $prefix);
}

function pqtil_normalize_username(string $seed): string {
    $seed = core_text::strtolower(trim($seed));
    $seed = preg_replace('/[^a-z0-9._-]+/', '.', $seed);
    $seed = trim((string)$seed, '.-_');
    return $seed !== '' ? $seed : 'teacher';
}

function pqtil_unique_username(string $seed): string {
    global $DB, $CFG;
    $base = core_text::substr(pqtil_normalize_username($seed), 0, 80);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id])) {
        $suffix++;
        $username = core_text::substr($base, 0, 70) . $suffix;
    }
    return $username;
}

function pqtil_existing_user(int $userid): stdClass {
    global $DB, $CFG;
    $user = $DB->get_record('user', [
        'id' => $userid,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MISSING);
    if (!$user) {
        throw new invalid_parameter_exception('Choose a valid existing Moodle teacher account.');
    }
    return $user;
}

function pqtil_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '' || !pqtil_contact_is_email($email)) {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqtil_create_user(string $firstname, string $lastname, string $email, string $username, bool $emailstop): array {
    global $CFG;

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
        'emailstop' => $emailstop ? 1 : 0,
        'country' => '',
        'city' => '',
        'timezone' => '99',
        'lang' => $CFG->lang ?? 'en',
    ];

    $userid = (int)user_create_user($user, true, false);
    return [$userid, $password];
}

function pqtil_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqtil_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqtil_form_value(array $form, string $name, string $default = ''): string {
    $value = $form[$name] ?? $default;
    return is_array($value) ? implode(', ', $value) : (string)$value;
}

function pqtil_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = (string)($options[$value] ?? $value);
    }
    return $labels;
}

function pqtil_values_from_labels(string $stored, array $options): array {
    $parts = array_values(array_filter(array_map('trim', explode(',', $stored)), static function(string $value): bool {
        return $value !== '';
    }));
    if (!$parts) {
        return [];
    }

    $values = [];
    $reverse = [];
    foreach ($options as $value => $label) {
        $reverse[core_text::strtolower((string)$label)] = (string)$value;
        $reverse[core_text::strtolower((string)$value)] = (string)$value;
    }
    foreach ($parts as $part) {
        $key = core_text::strtolower($part);
        $values[] = $reverse[$key] ?? $part;
    }
    return array_values(array_unique($values));
}

function pqtil_work_model_values(array $values): array {
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
    $normalized = [];
    foreach ($values as $value) {
        $key = core_text::strtolower(trim((string)$value));
        if ($key !== '' && isset($aliases[$key]) && !in_array($aliases[$key], $normalized, true)) {
            $normalized[] = $aliases[$key];
        }
    }
    return $normalized;
}

function pqtil_application_json(stdClass $request): array {
    $decoded = json_decode((string)($request->application_json ?? ''), true);
    if (is_array($decoded) && $decoded) {
        return $decoded;
    }
    $map = [
        'Teaching work model' => 'teacher_work_model_labels',
        'Service modes' => 'service_mode_labels',
        'Language subject' => 'subject_language_label',
        'Subjects' => 'subject_area_labels',
        'Other subjects' => 'subject_other',
        'Learner levels' => 'age_group_labels',
        'Teaching levels' => 'general_level_labels',
        'School/workspace preferences' => 'workspace_preferences',
        'Years of experience' => 'years_experience',
        'Schools, institutions, and freelance teaching' => 'institution_experience',
        'Online profile' => 'online_profile_name',
        'Social media handle' => 'instagram_handle',
        'Social profile URL' => 'social_profile_url',
        'Website/booking URL' => 'website_or_booking_url',
        'Demo/sample URL' => 'demo_video_url',
    ];
    $backup = [];
    foreach (preg_split('/\R/', (string)($request->notes ?? '')) ?: [] as $line) {
        if (strpos($line, ':') === false) {
            continue;
        }
        [$label, $value] = array_map('trim', explode(':', $line, 2));
        if ($value !== '' && isset($map[$label])) {
            $backup[$map[$label]] = $value;
        }
    }
    return $backup;
}

function pqtil_app_value(array $application, string $key): string {
    $value = $application[$key] ?? '';
    return is_array($value) ? trim(implode(', ', array_map('strval', $value))) : trim((string)$value);
}

function pqtil_app_values(array $application, string $key): array {
    $value = $application[$key] ?? [];
    if (is_array($value)) {
        return array_values(array_filter(array_map(static function($item): string {
            return trim((string)$item);
        }, $value), static function(string $item): bool {
            return $item !== '';
        }));
    }
    $value = trim((string)$value);
    if ($value === '') {
        return [];
    }
    return array_values(array_filter(array_map('trim', explode(',', $value)), static function(string $item): bool {
        return $item !== '';
    }));
}

function pqtil_prefill_values(stdClass $request, array $application, string $field, string $labelkey, array $options): array {
    $rawvalues = pqtil_app_values($application, $field);
    if ($rawvalues) {
        return pqtil_values_from_labels(implode(', ', $rawvalues), $options);
    }

    $labelvalues = pqtil_app_values($application, $labelkey);
    if ($labelvalues) {
        return pqtil_values_from_labels(implode(', ', $labelvalues), $options);
    }

    return pqtil_values_from_labels((string)($request->{$field} ?? ''), $options);
}

function pqtil_prefill_select(stdClass $request, array $application, string $field, string $labelkey, array $options): string {
    $values = pqtil_prefill_values($request, $application, $field, $labelkey, $options);
    return $values[0] ?? '';
}

function pqtil_join_nonempty(array $parts, string $separator = "\n"): string {
    $clean = [];
    foreach ($parts as $part) {
        $part = trim((string)$part);
        if ($part !== '') {
            $clean[] = $part;
        }
    }
    return implode($separator, $clean);
}

function pqtil_split_name(string $name): array {
    $parts = array_values(array_filter(preg_split('/\s+/', trim($name)) ?: [], static function(string $part): bool {
        return $part !== '';
    }));
    if (!$parts) {
        return ['', ''];
    }
    if (count($parts) === 1) {
        return [$parts[0], $parts[0]];
    }
    $firstname = array_shift($parts);
    return [$firstname, implode(' ', $parts)];
}

function pqtil_slots_from_availability_json(string $json): array {
    $decoded = json_decode($json, true);
    if (!is_array($decoded) || empty($decoded['slots']) || !is_array($decoded['slots'])) {
        return [];
    }
    $slots = [];
    foreach ($decoded['slots'] as $slot) {
        if (!is_array($slot)) {
            continue;
        }
        $day = trim((string)($slot['day'] ?? ''));
        $time = trim((string)($slot['time'] ?? ''));
        if ($day !== '' && $time !== '') {
            $slots[] = $day . '|' . $time;
        }
    }
    return array_values(array_unique($slots));
}

function pqtil_normalize_timezone(string $timezone, array $options, string $fallback = ''): string {
    $timezone = trim($timezone);
    if ($timezone === '' || $timezone === '99') {
        return $fallback;
    }
    if (array_key_exists($timezone, $options)) {
        return $timezone;
    }
    foreach ($options as $value => $label) {
        if (core_text::strtolower((string)$value) === core_text::strtolower($timezone)
            || core_text::strtolower((string)$label) === core_text::strtolower($timezone)) {
            return (string)$value;
        }
    }
    return $timezone;
}

function pqtil_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqtil_ready() ? $DB->get_columns('local_prequran_teacher_profile') : [];
    }
    return $columns;
}

function pqtil_set_profile_field(stdClass $record, string $field, $value): void {
    $columns = pqtil_profile_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqtil_required_profile_columns(): array {
    return [
        'teacher_work_models',
        'service_modes',
        'subject_language',
        'subject_areas',
        'subject_other',
        'age_groups',
        'general_levels',
        'workspace_preferences',
        'years_experience',
        'institution_experience',
        'application_json',
        'marketplace_visible',
        'marketplace_status',
        'marketplace_bio',
        'marketplace_skills',
        'marketplace_experience',
        'marketplace_education',
        'marketplace_teaching_style',
        'marketplace_courses',
        'vetting_status',
        'vetting_summary',
        'vetting_reviewedby',
        'vetting_reviewedat',
    ];
}

function pqtil_missing_profile_columns(): array {
    $columns = pqtil_profile_columns();
    $missing = [];
    foreach (pqtil_required_profile_columns() as $column) {
        if (!isset($columns[$column])) {
            $missing[] = $column;
        }
    }
    return $missing;
}

function pqtil_save_profile(int $teacherid, array $data): int {
    global $DB, $USER;
    $now = time();

    $record = (object)[
        'userid' => $teacherid,
        'teacher_display_name' => (string)$data['teacher_display_name'],
        'gender' => (string)$data['gender'],
        'country' => (string)$data['country'],
        'city' => (string)$data['city'],
        'timezone' => (string)$data['timezone'],
        'primary_language' => (string)$data['primary_language'],
        'other_languages' => (string)$data['other_languages'],
        'courses_taught' => (string)$data['courses_taught'],
        'levels_taught' => (string)$data['levels_taught'],
        'max_students_per_class' => (int)$data['max_students_per_class'],
        'max_weekly_hours' => (int)$data['max_weekly_hours'],
        'availability_summary' => (string)$data['availability_summary'],
        'bbb_trained' => (int)$data['bbb_trained'],
        'safeguarding_trained' => (int)$data['safeguarding_trained'],
        'recording_qa_ack' => (int)$data['recording_qa_ack'],
        'status' => (string)$data['status'],
        'admin_notes' => (string)$data['admin_notes'],
        'timemodified' => $now,
    ];
    pqtil_set_profile_field($record, 'teacher_phone', (string)$data['teacher_phone']);
    pqtil_set_profile_field($record, 'preferred_contact', (string)$data['preferred_contact']);
    pqtil_set_profile_field($record, 'teacher_work_models', (string)($data['teacher_work_models'] ?? ''));
    pqtil_set_profile_field($record, 'service_modes', (string)($data['service_modes'] ?? ''));
    pqtil_set_profile_field($record, 'subject_language', (string)($data['subject_language'] ?? ''));
    pqtil_set_profile_field($record, 'subject_areas', (string)($data['subject_areas'] ?? ''));
    pqtil_set_profile_field($record, 'subject_other', (string)($data['subject_other'] ?? ''));
    pqtil_set_profile_field($record, 'age_groups', (string)($data['age_groups'] ?? ''));
    pqtil_set_profile_field($record, 'general_levels', (string)($data['general_levels'] ?? ''));
    pqtil_set_profile_field($record, 'workspace_preferences', (string)($data['workspace_preferences'] ?? ''));
    pqtil_set_profile_field($record, 'years_experience', (int)($data['years_experience'] ?? 0));
    pqtil_set_profile_field($record, 'institution_experience', (string)($data['institution_experience'] ?? ''));
    pqtil_set_profile_field($record, 'application_json', (string)($data['application_json'] ?? ''));
    pqtil_set_profile_field($record, 'marketplace_visible', (int)$data['marketplace_visible']);
    pqtil_set_profile_field($record, 'marketplace_status', (string)$data['marketplace_status']);
    pqtil_set_profile_field($record, 'marketplace_bio', (string)$data['marketplace_bio']);
    pqtil_set_profile_field($record, 'marketplace_skills', (string)$data['marketplace_skills']);
    pqtil_set_profile_field($record, 'marketplace_experience', (string)$data['marketplace_experience']);
    pqtil_set_profile_field($record, 'marketplace_education', (string)$data['marketplace_education']);
    pqtil_set_profile_field($record, 'marketplace_teaching_style', (string)$data['marketplace_teaching_style']);
    pqtil_set_profile_field($record, 'marketplace_courses', (string)$data['marketplace_courses']);
    pqtil_set_profile_field($record, 'vetting_status', (string)$data['vetting_status']);
    pqtil_set_profile_field($record, 'vetting_summary', (string)$data['vetting_summary']);
    pqtil_set_profile_field($record, 'vetting_reviewedby', (int)$data['vetting_reviewedby']);
    pqtil_set_profile_field($record, 'vetting_reviewedat', (int)$data['vetting_reviewedat']);
    pqtil_set_profile_field($record, 'consumerid', (int)($data['consumerid'] ?? 0));
    pqtil_set_profile_field($record, 'workspaceid', (int)($data['workspaceid'] ?? 0));

    $existing = $DB->get_record('local_prequran_teacher_profile', ['userid' => $teacherid]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_teacher_profile', $record);
        return (int)$existing->id;
    }

    $record->createdby = (int)$USER->id;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_teacher_profile', $record);
}

function pqtil_apply_teacher_profile_prefill(array &$form, int $teacherid, array $pqtioptions): void {
    global $DB;

    $teacheruser = pqtil_existing_user($teacherid);
    $profile = pqtil_ready() ? $DB->get_record('local_prequran_teacher_profile', ['userid' => $teacherid], '*', IGNORE_MISSING) : null;

    $form['existing_teacherid'] = (string)$teacherid;
    $form['teacher_firstname'] = (string)($teacheruser->firstname ?? '');
    $form['teacher_lastname'] = (string)($teacheruser->lastname ?? '');
    $form['teacher_username'] = (string)($teacheruser->username ?? '');
    $form['teacher_contact'] = (string)($teacheruser->email ?? '');
    $form['country'] = (string)($teacheruser->country ?? '');
    $form['city'] = (string)($teacheruser->city ?? '');
    $form['timezone'] = pqtil_normalize_timezone((string)($teacheruser->timezone ?? ''), $pqtioptions['timezones'] ?? []);

    if (!$profile) {
        return;
    }

    $form['teacher_display_name'] = (string)($profile->teacher_display_name ?? '');
    $form['teacher_phone'] = (string)($profile->teacher_phone ?? '');
    $form['preferred_contact'] = (string)($profile->preferred_contact ?? 'email');
    $form['gender'] = (string)($profile->gender ?? '');
    $form['country'] = (string)($profile->country ?? $form['country']);
    $form['city'] = (string)($profile->city ?? $form['city']);
    $form['timezone'] = pqtil_normalize_timezone((string)($profile->timezone ?? ''), $pqtioptions['timezones'] ?? [], $form['timezone']);
    $form['primary_language'] = (string)($profile->primary_language ?? '');
    $form['other_languages'] = pqtil_values_from_labels((string)($profile->other_languages ?? ''), $pqtioptions['other_languages'] ?? []);
    $form['teacher_work_models'] = pqtil_work_model_values(pqtil_values_from_labels((string)($profile->teacher_work_models ?? ''), $pqtioptions['teacher_work_models'] ?? []));
    $form['service_modes'] = pqtil_values_from_labels((string)($profile->service_modes ?? ''), $pqtioptions['service_modes'] ?? []);
    $form['subject_language'] = pqtil_values_from_labels((string)($profile->subject_language ?? ''), $pqtioptions['subject_languages'] ?? [])[0] ?? '';
    $form['subject_areas'] = pqtil_values_from_labels((string)($profile->subject_areas ?? ''), $pqtioptions['subject_areas'] ?? []);
    $form['subject_other'] = (string)($profile->subject_other ?? '');
    $form['age_groups'] = pqtil_values_from_labels((string)($profile->age_groups ?? ''), $pqtioptions['age_groups'] ?? []);
    $form['general_levels'] = pqtil_values_from_labels((string)($profile->general_levels ?? ''), $pqtioptions['general_levels'] ?? []);
    $form['workspace_preferences'] = (string)($profile->workspace_preferences ?? '');
    $form['years_experience'] = (string)(int)($profile->years_experience ?? 0);
    $form['institution_experience'] = (string)($profile->institution_experience ?? '');
    $profileapplication = pqtil_application_json($profile);
    foreach ([
        'online_profile_name',
        'instagram_handle',
        'social_profile_url',
        'website_or_booking_url',
        'demo_video_url',
        'teaching_offer_summary',
        'learner_outcomes',
        'curriculum_materials',
        'social_proof',
        'teaching_experience_range',
        'highest_qualification',
        'qualification_title',
        'awarding_institution',
        'graduation_year',
        'teaching_qualification',
        'preferred_teaching_format',
        'preferred_learner_arrangement',
        'preferred_weekly_hours',
        'available_start_date',
        'technology_readiness',
        'teacher_support_needs',
        'professional_reference',
        'verification_consent',
        'referral_source',
        'primary_classroom_management',
        'primary_parent_communication',
        'primary_safeguarding_status',
        'primary_learning_support',
        'primary_lesson_assessment',
        'primary_teaching_credential',
        'primary_background_check',
        'primary_teacher_notes',
        'higher_teacher_academic_rank',
        'higher_teacher_experience',
        'higher_teacher_research_level',
        'higher_teacher_publications',
        'higher_teacher_course_design',
        'higher_teacher_assessment',
        'higher_teacher_accreditation',
        'higher_teacher_notes',
        'technical_teacher_industry_experience',
        'technical_teacher_qualification',
        'technical_teacher_licenses',
        'technical_teacher_workshop_level',
        'technical_teacher_equipment_level',
        'technical_teacher_safety_status',
        'technical_teacher_apprenticeship',
        'technical_teacher_assessment',
        'technical_teacher_workplace_training',
        'technical_teacher_notes',
        'adult_teacher_experience',
        'adult_teacher_literacy_instruction',
        'adult_teacher_numeracy_instruction',
        'adult_teacher_digital_instruction',
        'adult_teacher_multilevel_facilitation',
        'adult_teacher_confidence_support',
        'adult_teacher_community_outreach',
        'adult_teacher_barrier_support',
        'adult_teacher_notes',
        'professional_teacher_industry_experience',
        'professional_teacher_responsibility',
        'professional_teacher_credentials',
        'professional_teacher_facilitation',
        'professional_teacher_coaching',
        'professional_teacher_corporate_training',
        'professional_teacher_cpd',
        'professional_teacher_outcome_measurement',
        'professional_teacher_case_studies',
        'professional_teacher_notes',
        'faith_teacher_experience',
        'faith_teacher_qualification',
        'faith_teacher_scripture_proficiency',
        'faith_teacher_interpretation_level',
        'faith_teacher_language_level',
        'faith_teacher_practice_level',
        'faith_teacher_community_experience',
        'faith_teacher_reference',
        'faith_teacher_notes',
    ] as $jsonfield) {
        $form[$jsonfield] = pqtil_app_value($profileapplication, $jsonfield);
    }
    $form['primary_grades_taught'] = array_values(array_filter((array)($profileapplication['primary_grades_taught'] ?? []), 'is_string'));
    $form['primary_curricula_taught'] = array_values(array_filter((array)($profileapplication['primary_curricula_taught'] ?? []), 'is_string'));
    $form['higher_teacher_disciplines'] = array_values(array_filter((array)($profileapplication['higher_teacher_disciplines'] ?? []), 'is_string'));
    $form['higher_teacher_supervision'] = array_values(array_filter((array)($profileapplication['higher_teacher_supervision'] ?? []), 'is_string'));
    $form['technical_teacher_trades'] = array_values(array_filter((array)($profileapplication['technical_teacher_trades'] ?? []), 'is_string'));
    $form['adult_teacher_areas'] = array_values(array_filter((array)($profileapplication['adult_teacher_areas'] ?? []), 'is_string'));
    $form['professional_teacher_areas'] = array_values(array_filter((array)($profileapplication['professional_teacher_areas'] ?? []), 'is_string'));
    $form['faith_teacher_subjects'] = array_values(array_filter((array)($profileapplication['faith_teacher_subjects'] ?? []), 'is_string'));
    $form['courses_taught'] = pqtil_values_from_labels((string)($profile->courses_taught ?? ''), $pqtioptions['course_types'] ?? []);
    $form['levels_taught'] = $form['general_levels'] ?: pqtil_values_from_labels((string)($profile->levels_taught ?? ''), $pqtioptions['current_levels'] ?? []);
    $form['max_students_per_class'] = (string)($profile->max_students_per_class ?? '9');
    $form['max_weekly_hours'] = (string)($profile->max_weekly_hours ?? '10');
    $form['availability_summary'] = (string)($profile->availability_summary ?? '');
    $form['bbb_trained'] = (string)(int)($profile->bbb_trained ?? 0);
    $form['safeguarding_trained'] = (string)(int)($profile->safeguarding_trained ?? 0);
    $form['recording_qa_ack'] = (string)(int)($profile->recording_qa_ack ?? 0);
    $form['status'] = (string)($profile->status ?? 'pending');
    $form['marketplace_visible'] = isset($profile->marketplace_visible) ? (string)(int)$profile->marketplace_visible : '';
    $form['marketplace_status'] = (string)($profile->marketplace_status ?? 'draft');
    $form['marketplace_bio'] = (string)($profile->marketplace_bio ?? '');
    $form['marketplace_skills'] = (string)($profile->marketplace_skills ?? '');
    $form['marketplace_experience'] = (string)($profile->marketplace_experience ?? '');
    $form['marketplace_education'] = (string)($profile->marketplace_education ?? '');
    $form['marketplace_teaching_style'] = (string)($profile->marketplace_teaching_style ?? '');
    $form['marketplace_courses'] = (string)($profile->marketplace_courses ?? '');
    $form['vetting_status'] = (string)($profile->vetting_status ?? 'not_reviewed');
    $form['vetting_summary'] = (string)($profile->vetting_summary ?? '');
    $form['admin_notes'] = (string)($profile->admin_notes ?? '');
    $form['slots'] = pqtil_availability_slots($teacherid);
}

function pqtil_weekday_number(string $day): int {
    $map = ['sun' => 0, 'mon' => 1, 'tue' => 2, 'wed' => 3, 'thu' => 4, 'fri' => 5, 'sat' => 6];
    return $map[$day] ?? -1;
}

function pqtil_time_to_minutes(string $time): ?int {
    $time = trim(core_text::strtolower($time));
    if (!preg_match('/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/', $time, $matches)) {
        return null;
    }
    $hour = (int)$matches[1];
    $minute = isset($matches[2]) && $matches[2] !== '' ? (int)$matches[2] : 0;
    $ampm = $matches[3] ?? '';
    if ($ampm === 'pm' && $hour < 12) {
        $hour += 12;
    }
    if ($ampm === 'am' && $hour === 12) {
        $hour = 0;
    }
    if ($hour < 0 || $hour > 23 || $minute < 0 || $minute > 59) {
        return null;
    }
    return ($hour * 60) + $minute;
}

function pqtil_save_availability_slots(int $teacherid, array $slots, string $timezone, int $slotminutes = 60): int {
    global $DB, $USER;
    if (!pqtil_table_exists('local_prequran_live_availability')) {
        return 0;
    }
    $created = 0;
    $now = time();
    $slotminutes = max(1, min(24 * 60, $slotminutes));
    foreach ($slots as $slot) {
        [$day, $time] = array_pad(explode('|', (string)$slot, 2), 2, '');
        $weekday = pqtil_weekday_number((string)$day);
        if ($weekday < 0) {
            continue;
        }
        $start = pqtil_time_to_minutes((string)$time);
        if ($start === null) {
            continue;
        }
        $end = min(24 * 60, $start + $slotminutes);
        $exists = $DB->record_exists('local_prequran_live_availability', [
            'teacherid' => $teacherid,
            'weekday' => $weekday,
            'start_minute' => $start,
            'end_minute' => $end,
            'status' => 'active',
        ]);
        if ($exists) {
            continue;
        }
        $DB->insert_record('local_prequran_live_availability', (object)[
            'teacherid' => $teacherid,
            'weekday' => $weekday,
            'start_minute' => $start,
            'end_minute' => $end,
            'timezone' => $timezone !== '' ? $timezone : 'UTC',
            'status' => 'active',
            'createdby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        $created++;
    }
    return $created;
}

function pqtil_availability_slots(int $teacherid): array {
    global $DB;
    if ($teacherid <= 0 || !pqtil_table_exists('local_prequran_live_availability')) {
        return [];
    }
    $reverse = [0 => 'sun', 1 => 'mon', 2 => 'tue', 3 => 'wed', 4 => 'thu', 5 => 'fri', 6 => 'sat'];
    $slots = [];
    $rows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active'], 'weekday ASC, start_minute ASC');
    foreach ($rows as $row) {
        $weekday = (int)($row->weekday ?? -1);
        if (!isset($reverse[$weekday])) {
            continue;
        }
        $start = max(0, min(24 * 60, (int)($row->start_minute ?? 0)));
        $hour = str_pad((string)((int)floor($start / 60)), 2, '0', STR_PAD_LEFT) . ':' . str_pad((string)($start % 60), 2, '0', STR_PAD_LEFT);
        $slots[] = $reverse[$weekday] . '|' . $hour;
    }
    return array_values(array_unique($slots));
}

function pqtil_slot_summary(array $slots, array $days, array $hours, int $sessioncount): string {
    if (!$slots) {
        return '';
    }
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day === '' || $hour === '') {
            continue;
        }
        $byday[$day][] = (string)($hours[$hour] ?? $hour);
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = (string)($days[$day] ?? $day) . ': ' . implode(', ', array_unique($dayhours));
    }
    return $sessioncount . ' session' . ($sessioncount === 1 ? '' : 's') . ' per week; available slots: ' . implode('; ', $parts);
}

function pqtil_field_label(string $name): string {
    $labels = [
        'existing_teacherid' => 'Existing Moodle teacher ID',
        'teacher_requestid' => 'Teacher application ID',
        'teacher_firstname' => 'First name',
        'teacher_lastname' => 'Last name',
        'teacher_display_name' => 'Display name',
        'teacher_contact' => 'Teacher email or phone',
        'gender' => 'Gender',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary teaching language',
        'teacher_work_models' => 'Teacher pathway',
        'service_modes' => 'Service modes',
        'subject_language' => 'Language subject',
        'subject_areas' => 'Subjects you can teach',
        'subject_other' => 'Other subjects / specialties',
        'age_groups' => 'Learner levels',
        'general_levels' => 'Teaching levels',
        'workspace_preferences' => 'School/workspace preferences',
        'years_experience' => 'Years of experience',
        'institution_experience' => 'Schools, institutions, and freelance teaching',
        'courses_taught' => 'Legacy course data',
        'levels_taught' => 'Legacy levels',
        'session_count' => 'Number of sessions',
        'slots' => 'Preferred weekly live-session number of sessions and hours',
        'max_students_per_class' => 'Max students per class',
        'max_weekly_hours' => 'Max weekly live hours',
        'bbb_trained' => 'BBB/live classroom training',
        'safeguarding_trained' => 'Child safety training',
        'recording_qa_ack' => 'Recording and QA policy acknowledgement',
        'status' => 'Teacher status',
        'marketplace_status' => 'Marketplace status',
        'vetting_status' => 'Vetting status',
    ];
    return $labels[$name] ?? $name;
}

function pqtil_form_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqti-error">' . s($errors[$name]) . '</div>' : '';
}

function pqtil_field_class(array $errors, string $name): string {
    return isset($errors[$name]) ? ' pqti-field--error' : '';
}

function pqtil_selected(array $form, string $name, string $value): string {
    return pqtil_form_value($form, $name) === $value ? ' selected' : '';
}

function pqtil_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqtil_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $selected = pqtil_form_value($form, $name);
    $html = '<select class="pqti-select" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . ($selected === (string)$value ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqtil_form_error($errors, $name);
    return $html;
}

function pqtil_workspaceid_for_requestid(int $requestid): int {
    global $DB;
    if ($requestid <= 0 || !pqtil_table_exists('local_prequran_teacher_intake_request')) {
        return 0;
    }
    try {
        $columns = $DB->get_columns('local_prequran_teacher_intake_request');
    } catch (Throwable $e) {
        return 0;
    }
    if (!array_key_exists('workspaceid', $columns)) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_teacher_intake_request', 'workspaceid', ['id' => $requestid], IGNORE_MISSING);
}

function pqtil_upsert_workspace_member(int $workspaceid, int $userid, string $role, string $note): void {
    global $DB, $USER;
    if ($workspaceid <= 0 || $userid <= 0 || !pqtil_table_exists('local_prequran_workspace_member')) {
        return;
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], '*', IGNORE_MISSING);
    if ($existing) {
        $existing->status = 'active';
        if (trim((string)($existing->notes ?? '')) === '') {
            $existing->notes = $note;
        }
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_workspace_member', $existing);
        return;
    }
    $DB->insert_record('local_prequran_workspace_member', (object)[
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => $note,
        'createdby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqtil_record_for_existing_columns(string $table, stdClass $record): stdClass {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return $record;
    }
    $filtered = new stdClass();
    foreach ($record as $key => $value) {
        if (array_key_exists($key, $columns)) {
            $filtered->{$key} = $value;
        }
    }
    return $filtered;
}

function pqtil_workspace_slug(string $seed): string {
    $slug = core_text::strtolower(trim($seed));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim((string)$slug, '-');
    return $slug !== '' ? core_text::substr($slug, 0, 80) : 'teacher-workspace';
}

function pqtil_unique_workspace_slug(string $seed, int $teacherid): string {
    global $DB;
    $base = pqtil_workspace_slug($seed);
    if (!preg_match('/-' . preg_quote((string)$teacherid, '/') . '$/', $base)) {
        $base = core_text::substr($base . '-' . $teacherid, 0, 90);
    }
    $slug = $base;
    $suffix = 1;
    while (pqtil_table_exists('local_prequran_workspace') && $DB->record_exists('local_prequran_workspace', ['slug' => $slug])) {
        $slug = core_text::substr($base, 0, 84) . '-' . $suffix;
        $suffix++;
    }
    return $slug;
}

function pqtil_existing_independent_workspaceid(int $teacherid): int {
    global $DB;
    if ($teacherid <= 0 || !pqtil_table_exists('local_prequran_workspace')) {
        return 0;
    }
    if (pqtil_column_exists('local_prequran_teacher_profile', 'workspaceid')) {
        $record = $DB->get_record_sql(
            "SELECT w.id
               FROM {local_prequran_teacher_profile} p
               JOIN {local_prequran_workspace} w ON w.id = p.workspaceid
              WHERE p.userid = :teacherid
                AND p.workspaceid > 0
                AND w.workspace_type = :workspacetype
                AND w.status <> :archived
           ORDER BY p.timemodified DESC, p.id DESC",
            ['teacherid' => $teacherid, 'workspacetype' => 'solo_teacher', 'archived' => 'archived'],
            IGNORE_MULTIPLE
        );
        if ($record) {
            return (int)$record->id;
        }
    }
    if (pqtil_column_exists('local_prequran_workspace', 'ownerid')) {
        $record = $DB->get_record_select(
            'local_prequran_workspace',
            'ownerid = ? AND workspace_type = ? AND status <> ?',
            [$teacherid, 'solo_teacher', 'archived'],
            'id',
            IGNORE_MULTIPLE
        );
        if ($record) {
            return (int)$record->id;
        }
    }
    return 0;
}

function pqtil_ensure_independent_teacher_workspace(int $teacherid, string $displayname, stdClass $consumercontext): int {
    global $DB, $USER;
    if ($teacherid <= 0 || !pqtil_table_exists('local_prequran_workspace')) {
        return 0;
    }

    $existingid = pqtil_existing_independent_workspaceid($teacherid);
    if ($existingid > 0) {
        pqtil_upsert_workspace_member($existingid, $teacherid, 'teacher', 'Independent teacher workspace owner.');
        return $existingid;
    }

    $now = time();
    $name = trim($displayname) !== '' ? trim($displayname) . ' Workspace' : 'Teacher ' . $teacherid . ' Workspace';
    $record = (object)[
        'name' => $name,
        'slug' => pqtil_unique_workspace_slug($name, $teacherid),
        'workspace_type' => 'solo_teacher',
        'ownerid' => $teacherid,
        'status' => 'active',
        'plan_code' => 'independent_teacher',
        'student_limit' => 0,
        'teacher_limit' => 1,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode([
            'created_from' => 'teacher_intake',
            'teacherid' => $teacherid,
            'consumerid' => (int)($consumercontext->consumerid ?? 0),
            'consumerslug' => (string)($consumercontext->consumerslug ?? ''),
            'independent_teacher_workspace' => 1,
        ], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $workspaceid = (int)$DB->insert_record('local_prequran_workspace', pqtil_record_for_existing_columns('local_prequran_workspace', $record));
    pqtil_upsert_workspace_member($workspaceid, $teacherid, 'teacher', 'Independent teacher workspace owner.');
    return $workspaceid;
}

function pqtil_multi_select(string $name, array $options, array $form, array $errors, int $size = 5): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqti-select pqti-select--multi" name="' . s($name) . '[]" multiple size="' . $size . '">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqtil_form_error($errors, $name);
    return $html;
}

function pqtil_checkbox_group(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<div class="pqti-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = in_array((string)$value, $selected, true) ? ' checked' : '';
        $html .= '<label class="pqti-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    $html .= '</div>' . pqtil_form_error($errors, $name);
    return $html;
}

function pqtil_radio_group(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? (string)($form[$name][0] ?? '') : (string)($form[$name] ?? '');
    $html = '<div class="pqti-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = (string)$value === $selected ? ' checked' : '';
        $html .= '<label class="pqti-choice"><input type="radio" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    $html .= '</div>' . pqtil_form_error($errors, $name);
    return $html;
}
