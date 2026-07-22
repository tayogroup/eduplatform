<?php
// Student-intake helper library — extracted VERBATIM from student_intake.php
// (renamed pqsi_ -> pqsil_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php + account_ids.php +
// institutionlib.php + course_offeringlib.php + user/lib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqsil_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqsil_table_has_field(string $table, string $field): bool {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqsil_record_for_existing_columns(string $table, stdClass $record): stdClass {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return $record;
    }
    $filtered = new stdClass();
    foreach ($record as $key => $value) {
        if (isset($columns[$key])) {
            $filtered->{$key} = $value;
        }
    }
    return $filtered;
}

function pqsil_profile_ready(): bool {
    return pqsil_table_exists('local_prequran_student_profile');
}

function pqsil_trim_param(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqsil_email_param(string $name): string {
    return trim(optional_param($name, '', PARAM_TEXT));
}

function pqsil_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqsil_phone_email(string $contact, string $prefix): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    if ($token === '') {
        $token = uniqid($prefix, false);
    }
    return $prefix . '.' . $token . '@eduplatform.local';
}

function pqsil_moodle_email_from_contact(string $contact, string $prefix): string {
    if ($contact !== '' && pqsil_contact_is_email($contact)) {
        return $contact;
    }
    return pqsil_phone_email($contact, $prefix);
}

function pqsil_normalize_username(string $seed): string {
    $seed = core_text::strtolower(trim($seed));
    $seed = preg_replace('/[^a-z0-9._-]+/', '.', $seed);
    $seed = trim((string)$seed, '.-_');
    return $seed !== '' ? $seed : 'qauser';
}

function pqsil_unique_username(string $seed): string {
    global $DB;
    $base = core_text::substr(pqsil_normalize_username($seed), 0, 80);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $GLOBALS['CFG']->mnet_localhost_id])) {
        $suffix++;
        $username = core_text::substr($base, 0, 70) . $suffix;
    }
    return $username;
}

function pqsil_age_band(int $age): string {
    if ($age <= 0) {
        return '';
    }
    if ($age <= 5) {
        return '4-5';
    }
    if ($age <= 8) {
        return '6-8';
    }
    if ($age <= 11) {
        return '9-11';
    }
    if ($age <= 14) {
        return '12-14';
    }
    return '15+';
}

function pqsil_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqsil_profile_ready() ? $DB->get_columns('local_prequran_student_profile') : [];
    }
    return $columns;
}

function pqsil_set_profile_field(stdClass $record, string $field, $value): void {
    $columns = pqsil_profile_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqsil_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '' || !pqsil_contact_is_email($email)) {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqsil_existing_user(int $userid): stdClass {
    global $DB, $CFG;
    $user = $DB->get_record('user', [
        'id' => $userid,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MISSING);
    if (!$user) {
        throw new invalid_parameter_exception('Choose a valid existing Moodle student account.');
    }
    return $user;
}

function pqsil_find_duplicate_profile(string $displayname, string $parentemail, string $studentemail): ?stdClass {
    global $DB;

    if ($studentemail !== '') {
        $sql = "SELECT sp.id, sp.userid, sp.student_display_name, sp.parent_email, u.email AS student_email
                  FROM {local_prequran_student_profile} sp
                  JOIN {user} u ON u.id = sp.userid
                 WHERE u.deleted = 0 AND LOWER(u.email) = LOWER(:studentemail)
              ORDER BY sp.id DESC";
        $record = $DB->get_record_sql($sql, ['studentemail' => $studentemail], IGNORE_MULTIPLE);
        if ($record) {
            $record->duplicate_reason = 'student_email';
            return $record;
        }
    }

    if ($displayname !== '' && $parentemail !== '') {
        $sql = "SELECT sp.id, sp.userid, sp.student_display_name, sp.parent_email, u.email AS student_email
                  FROM {local_prequran_student_profile} sp
                  JOIN {user} u ON u.id = sp.userid
                 WHERE u.deleted = 0
                   AND LOWER(sp.student_display_name) = LOWER(:displayname)
                   AND LOWER(sp.parent_email) = LOWER(:parentemail)
              ORDER BY sp.id DESC";
        $record = $DB->get_record_sql($sql, [
            'displayname' => $displayname,
            'parentemail' => $parentemail,
        ], IGNORE_MULTIPLE);
        if ($record) {
            $record->duplicate_reason = 'student_parent';
            return $record;
        }
    }

    return null;
}

function pqsil_create_user(string $firstname, string $lastname, string $email, string $username, bool $emailstop): array {
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

function pqsil_send_parent_intake_email(stdClass $parent, stdClass $student, string $approvalurl, bool $parentcreated): bool {
    global $CFG, $SITE;
    if (empty($parent->email) || !pqsil_contact_is_email((string)$parent->email) || !empty($parent->emailstop)) {
        return false;
    }
    $studentname = fullname($student);
    $consumer = null;
    try {
        $consumer = pqh_current_consumer_context();
    } catch (Throwable $e) {
        $consumer = null;
    }
    $brandname = trim((string)($consumer->consumername ?? ''));
    if ($brandname === '') {
        $brandname = format_string($SITE->fullname ?? ($CFG->wwwroot ?? 'EduPlatform'));
    }
    $subject = 'Student intake update';
    $lines = [
        'Assalamu alaikum ' . fullname($parent) . ',',
        '',
        'A ' . $brandname . ' student intake record has been created or updated for ' . $studentname . '.',
        '',
    ];
    if ($approvalurl !== '') {
        $lines[] = 'Please review the parent approval page here:';
        $lines[] = $approvalurl;
        $lines[] = '';
    }
    if ($parentcreated) {
        $lines[] = 'A parent/guardian Moodle account has also been created for you. Please use the login details shared by the academy team.';
        $lines[] = '';
    }
    $lines[] = 'Thank you,';
    $lines[] = $brandname;
    $messagetext = implode("\n", $lines);
    $messagehtml = nl2br(s($messagetext));
    return pqhi_send_consumer_email($parent, $consumer, $subject, $messagetext, $messagehtml);
}

function pqsil_save_profile(int $studentid, array $data): int {
    global $DB, $USER;
    $now = time();
    $age = (int)$data['age_years'];
    $primarylanguage = (string)$data['primary_language'];
    $otherlanguages = (string)$data['other_languages'];

    $record = (object)[
        'userid' => $studentid,
        'timezone' => (string)$data['timezone'],
        'language' => $primarylanguage !== '' ? $primarylanguage : $otherlanguages,
        'age_years' => $age,
        'age_band' => pqsil_age_band($age),
        'current_level' => (string)$data['current_level'],
        'learning_base' => (string)$data['learning_base'],
        'country' => (string)$data['country'],
        'city' => (string)$data['city'],
        'gender' => (string)$data['gender'],
        'availability' => (string)$data['availability'],
        'parent_preferences' => (string)$data['parent_preferences'],
        'status' => 'active',
        'timemodified' => $now,
    ];
    pqsil_set_profile_field($record, 'student_display_name', (string)$data['student_display_name']);
    pqsil_set_profile_field($record, 'student_middle_name', (string)$data['student_middle_name']);
    pqsil_set_profile_field($record, 'student_access_type', (string)$data['student_access_type']);
    pqsil_set_profile_field($record, 'date_of_birth', (string)($data['date_of_birth'] ?? ''));
    pqsil_set_profile_field($record, 'primary_language', $primarylanguage);
    pqsil_set_profile_field($record, 'preferred_teaching_language', (string)$data['preferred_teaching_language']);
    pqsil_set_profile_field($record, 'tajweed_sub_level', (string)$data['tajweed_sub_level']);
    pqsil_set_profile_field($record, 'special_needs', (string)$data['special_needs']);
    pqsil_set_profile_field($record, 'course_type', (string)$data['course_type']);
    pqsil_set_profile_field($record, 'parent_name', (string)$data['parent_name']);
    pqsil_set_profile_field($record, 'parent_relationship', (string)($data['parent_relationship'] ?? ''));
    pqsil_set_profile_field($record, 'parent_relationship_other', (string)($data['parent_relationship_other'] ?? ''));
    pqsil_set_profile_field($record, 'parent_email', (string)$data['parent_email']);
    pqsil_set_profile_field($record, 'parent_email_enabled', (int)$data['parent_email_enabled']);
    pqsil_set_profile_field($record, 'parent_phone', (string)$data['parent_phone']);
    pqsil_set_profile_field($record, 'emergency_contact_name', (string)($data['emergency_contact_name'] ?? ''));
    pqsil_set_profile_field($record, 'emergency_contact_phone', (string)($data['emergency_contact_phone'] ?? ''));
    foreach ([
        'current_grade',
        'school_curriculum',
        'current_school_name',
        'student_lives_with',
        'primary_learning_goal',
        'medical_safety_notes',
        'preferred_class_format',
        'preferred_group_size',
        'preferred_teacher_gender',
        'school_term',
        'islamic_program_interest',
        'quran_reading_level',
        'tajweed_level',
        'memorization_status',
        'memorized_portion',
        'arabic_reading_ability',
        'prior_islamic_studies',
        'islamic_learning_goal',
        'previous_learning_method',
        'tafsir_level',
        'islamic_notes',
        'christian_program_interest',
        'bible_reading_level',
        'bible_knowledge_level',
        'christian_studies_level',
        'prior_christian_studies',
        'christian_previous_learning_method',
        'christian_learning_goal',
        'christian_notes',
        'higher_application_level',
        'higher_program_field',
        'higher_specialization',
        'higher_highest_qualification',
        'higher_previous_institution',
        'higher_qualification_title',
        'higher_completion_year',
        'higher_academic_result',
        'higher_academic_status',
        'higher_admission_route',
        'higher_transfer_credits',
        'higher_study_mode',
        'higher_study_load',
        'higher_preferred_intake',
        'higher_research_interest',
        'higher_funding_method',
        'higher_financial_aid_interest',
        'higher_support_needs',
        'technical_program',
        'technical_specialization',
        'technical_training_level',
        'technical_previous_experience',
        'technical_previous_learning_method',
        'technical_experience_duration',
        'technical_employment_status',
        'technical_employer_workshop',
        'technical_training_goal',
        'technical_certification_sought',
        'technical_training_format',
        'technical_training_schedule',
        'technical_tools_experience',
        'technical_tool_access',
        'technical_digital_skill_level',
        'technical_safety_training',
        'technical_protective_equipment',
        'technical_support_needs',
        'technical_notes',
        'professional_area',
        'professional_topic_skill',
        'professional_current_role',
        'professional_industry',
        'professional_employment_status',
        'professional_employer',
        'professional_experience_years',
        'professional_responsibility_level',
        'professional_development_goal',
        'professional_skill_level',
        'professional_credential_sought',
        'professional_certification_deadline',
        'professional_learning_format',
        'professional_learning_schedule',
        'professional_course_intensity',
        'professional_employer_sponsored',
        'professional_cpd_required',
        'professional_cpd_credits',
        'professional_workplace_outcome',
        'professional_support_needs',
        'professional_notes',
        'adult_learning_area',
        'adult_subject_skill',
        'adult_education_level',
        'adult_literacy_level',
        'adult_numeracy_level',
        'adult_digital_skill_level',
        'adult_previous_experience',
        'adult_previous_learning_method',
        'adult_learning_goal',
        'adult_employment_status',
        'adult_learning_format',
        'adult_learning_pace',
        'adult_class_arrangement',
        'adult_childcare_impact',
        'adult_work_impact',
        'adult_access_limitations',
        'adult_learning_confidence',
        'adult_support_needs',
        'adult_notes',
    ] as $field) {
        pqsil_set_profile_field($record, $field, (string)($data[$field] ?? ''));
    }
    pqsil_set_profile_field($record, 'live_class_consent', (int)$data['live_class_consent']);
    pqsil_set_profile_field($record, 'recording_consent', (int)$data['recording_consent']);
    pqsil_set_profile_field($record, 'consent_notes', (string)$data['consent_notes']);
    pqsil_set_profile_field($record, 'enrollment_approval_status', (string)($data['enrollment_approval_status'] ?? 'approved'));
    pqsil_set_profile_field($record, 'enrollment_approvedby', (int)($data['enrollment_approvedby'] ?? 0));
    pqsil_set_profile_field($record, 'enrollment_approvedat', (int)($data['enrollment_approvedat'] ?? 0));
    pqsil_set_profile_field($record, 'enrollment_approval_notes', (string)($data['enrollment_approval_notes'] ?? ''));
    pqsil_set_profile_field($record, 'workspaceid', (int)($data['workspaceid'] ?? 0));

    $existing = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_student_profile', $record);
        return (int)$existing->id;
    }

    $record->createdby = (int)$USER->id;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_student_profile', $record);
}

function pqsil_upsert_comm_consent(int $studentid, int $parentid): void {
    global $DB;
    if (!pqsil_table_exists('local_prequran_comm_consent') || $studentid <= 0 || $parentid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'student_messaging_enabled' => 0,
        'free_text_enabled' => 0,
        'parent_visible' => 1,
        'consent_source' => 'student_intake',
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_comm_consent', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_comm_consent', $record);
}

function pqsil_upsert_live_consent(int $studentid, int $parentid, string $type, int $granted, string $details): void {
    global $DB;
    if (!pqsil_table_exists('local_prequran_live_consent') || $studentid <= 0 || $parentid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
        'granted' => $granted,
        'version' => '1',
        'consent_source' => 'student_intake',
        'details' => $details,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
    ]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_live_consent', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_live_consent', $record);
}

function pqsil_enrollment_already_approved(int $studentid, int $parentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (pqsil_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
        $status = $DB->get_field('local_prequran_student_profile', 'enrollment_approval_status', ['userid' => $studentid]);
        if (is_string($status) && strtolower($status) === 'approved') {
            return true;
        }
    }
    if (!pqsil_table_exists('local_prequran_live_consent') || $parentid <= 0) {
        return false;
    }
    return $DB->record_exists('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => 'enrollment_approval',
        'granted' => 1,
    ]);
}

function pqsil_clean_referrer_code(string $code): string {
    return preg_replace('/\D+/', '', $code);
}

function pqsil_find_referrer_by_code(string $code): ?stdClass {
    global $DB;
    $code = pqsil_clean_referrer_code($code);
    if ($code === '' || !pqsil_table_exists('local_prequran_referrer')) {
        return null;
    }
    $referrer = $DB->get_record('local_prequran_referrer', ['referrer_code' => $code], '*', IGNORE_MULTIPLE);
    if (!$referrer || !in_array(strtolower((string)$referrer->status), ['active', 'pending'], true)) {
        return null;
    }
    return $referrer;
}

function pqsil_date_to_time(string $date, int $fallback): int {
    $date = trim($date);
    if ($date === '') {
        return $fallback;
    }
    $time = strtotime($date . ' 00:00:00');
    return $time !== false ? (int)$time : $fallback;
}

function pqsil_upsert_referral(int $studentid, ?stdClass $referrer, array $data): int {
    global $DB, $USER;
    if (!$referrer || !pqsil_table_exists('local_prequran_referral') || $studentid <= 0) {
        return 0;
    }
    $now = time();

    if (pqsil_table_exists('local_prequran_referrer')) {
        $referrerrecord = (object)[
            'id' => (int)$referrer->id,
            'name' => trim((string)($data['referrer_name'] ?? '')) !== '' ? (string)$data['referrer_name'] : (string)($referrer->name ?? ''),
            'contact' => trim((string)($data['referrer_contact_number'] ?? '')) !== '' ? (string)$data['referrer_contact_number'] : (string)($referrer->contact ?? ''),
            'phone' => trim((string)($data['referrer_contact_number'] ?? '')) !== '' ? (string)$data['referrer_contact_number'] : (string)($referrer->phone ?? ''),
            'email' => (string)($data['referrer_email'] ?? ($referrer->email ?? '')),
            'city' => (string)($data['referrer_city'] ?? ($referrer->city ?? '')),
            'state' => (string)($data['referrer_state'] ?? ($referrer->state ?? '')),
            'country' => (string)($data['referrer_country'] ?? ($referrer->country ?? '')),
            'timemodified' => $now,
        ];
        $DB->update_record('local_prequran_referrer', pqsil_record_for_existing_columns('local_prequran_referrer', $referrerrecord));
    }

    $record = (object)[
        'referrerid' => (int)$referrer->id,
        'studentid' => $studentid,
        'datereferred' => pqsil_date_to_time((string)($data['referral_datereferred'] ?? ''), $now),
        'effectiveat' => pqsil_date_to_time((string)($data['referral_effective_date'] ?? ''), pqsil_date_to_time((string)($data['referral_datereferred'] ?? ''), $now)),
        'referrer_name' => trim((string)($data['referrer_name'] ?? '')) !== '' ? (string)$data['referrer_name'] : (string)($referrer->name ?? ''),
        'referrer_contact_number' => trim((string)($data['referrer_contact_number'] ?? '')) !== '' ? (string)$data['referrer_contact_number'] : (string)($referrer->phone ?? ($referrer->contact ?? '')),
        'referrer_email' => (string)($data['referrer_email'] ?? ($referrer->email ?? '')),
        'referrer_city' => (string)($data['referrer_city'] ?? ($referrer->city ?? '')),
        'referrer_state' => (string)($data['referrer_state'] ?? ($referrer->state ?? '')),
        'referrer_country' => (string)($data['referrer_country'] ?? ($referrer->country ?? '')),
        'referral_status' => (string)($data['referral_status'] ?? 'pending'),
        'dateexpires' => pqsil_date_to_time((string)($data['referral_dateexpires'] ?? ''), $now + 90 * DAYSECS),
        'commission_amount' => (string)($data['commission_amount'] ?? ''),
        'commission_rate' => (string)($data['commission_rate'] ?? ''),
        'commission_currency' => (string)($data['commission_currency'] ?? 'USD'),
        'approvedat' => (string)($data['referral_status'] ?? '') === 'approved' ? $now : 0,
        'approvedby' => (string)($data['referral_status'] ?? '') === 'approved' ? (int)$USER->id : 0,
        'payment_status' => 'unpaid',
        'paidat' => 0,
        'payment_reference' => '',
        'notes' => (string)($data['referral_notes'] ?? ''),
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_referral', ['studentid' => $studentid]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $record->createdby = (int)($existing->createdby ?? 0);
        $record->timecreated = (int)($existing->timecreated ?? $now);
        if (!empty($existing->approvedat) && (string)$record->referral_status === 'approved') {
            $record->approvedat = (int)$existing->approvedat;
            $record->approvedby = (int)($existing->approvedby ?? 0);
        }
        $DB->update_record('local_prequran_referral', pqsil_record_for_existing_columns('local_prequran_referral', $record));
        return (int)$existing->id;
    }
    $record->createdby = (int)$USER->id;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_referral', pqsil_record_for_existing_columns('local_prequran_referral', $record));
}

function pqsil_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqsil_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqsil_preferred_teacherid_from_text(string $text): int {
    if ($text === '') {
        return 0;
    }
    if (preg_match('/Marketplace teacher preference:\s*.+?\([^)]*Moodle ID\s+(\d+)\)/i', $text, $matches)) {
        return (int)$matches[1];
    }
    if (preg_match('/Preferred teacher:\s*.+?\([^)]*Moodle ID\s+(\d+)\)/i', $text, $matches)) {
        return (int)$matches[1];
    }
    return 0;
}

function pqsil_consumerid_for_intake_request(?stdClass $request): int {
    if (!$request || !pqsil_table_has_field('local_prequran_intake_request', 'consumerid')) {
        return 0;
    }
    return (int)($request->consumerid ?? 0);
}

function pqsil_workspaceid_for_intake_request(?stdClass $request): int {
    if (!$request || !pqsil_table_has_field('local_prequran_intake_request', 'workspaceid')) {
        return 0;
    }
    return (int)($request->workspaceid ?? 0);
}

function pqsil_workspaceid_for_requestid(int $requestid): int {
    global $DB;
    if ($requestid <= 0 || !pqsil_table_exists('local_prequran_intake_request') || !pqsil_table_has_field('local_prequran_intake_request', 'workspaceid')) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_intake_request', 'workspaceid', ['id' => $requestid], IGNORE_MISSING);
}

function pqsil_upsert_workspace_member(int $workspaceid, int $userid, string $role, string $note): void {
    global $DB, $USER;
    if ($workspaceid <= 0 || $userid <= 0 || !pqsil_table_exists('local_prequran_workspace_member')) {
        return;
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ]);
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

function pqsil_upsert_teacher_marketplace_request(int $teacherid, int $parentid, int $studentid, int $consumerid, string $source): int {
    global $DB;
    if ($teacherid <= 0 || $studentid <= 0 || !pqsil_table_exists('local_prequran_teacher_request')) {
        return 0;
    }
    $now = time();
    $params = [
        'teacherid' => $teacherid,
        'parentid' => $parentid,
        'studentid' => $studentid,
    ];
    $consumerwhere = '';
    if ($consumerid > 0 && pqsil_table_has_field('local_prequran_teacher_request', 'consumerid')) {
        $consumerwhere = ' AND consumerid = :consumerid';
        $params['consumerid'] = $consumerid;
    }
    $existing = $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_teacher_request}
          WHERE teacherid = :teacherid
            AND parentid = :parentid
            AND studentid = :studentid
            {$consumerwhere}
            AND request_status NOT IN ('assigned', 'declined', 'closed')
       ORDER BY timecreated DESC, id DESC",
        $params,
        IGNORE_MULTIPLE
    );
    $message = 'Teacher selection request created from student intake. ' . $source;
    if ($existing) {
        $existing->request_status = 'selection_requested';
        $existing->message = trim((string)$existing->message) !== '' ? (string)$existing->message . "\n\n" . $message : $message;
        if ($consumerid > 0 && pqsil_table_has_field('local_prequran_teacher_request', 'consumerid')) {
            $existing->consumerid = $consumerid;
        }
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_teacher_request', $existing);
        return (int)$existing->id;
    }
    $record = (object)[
        'teacherid' => $teacherid,
        'parentid' => $parentid,
        'studentid' => $studentid,
        'request_status' => 'selection_requested',
        'message' => $message,
        'threadid' => 0,
        'admin_notes' => 'Auto-created from transferred public student intake.',
        'reviewedby' => 0,
        'reviewedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    if ($consumerid > 0 && pqsil_table_has_field('local_prequran_teacher_request', 'consumerid')) {
        $record->consumerid = $consumerid;
    }
    return (int)$DB->insert_record('local_prequran_teacher_request', $record);
}

function pqsil_form_value(array $form, string $name): string {
    if (!isset($form[$name])) {
        return '';
    }
    return is_array($form[$name]) ? implode(', ', array_map('strval', $form[$name])) : (string)$form[$name];
}

function pqsil_field_label(string $name): string {
    $labels = [
        'existing_studentid' => 'Existing Moodle student ID',
        'student_firstname' => 'First name',
        'student_middle_name' => 'Middle name',
        'student_lastname' => 'Last name',
        'student_display_name' => 'Display name',
        'student_username' => 'Username',
        'student_email' => 'Student email or phone',
        'student_access_type' => 'Student access type',
        'date_of_birth' => 'Date of birth',
        'age_years' => 'Age',
        'gender' => 'Gender',
        'special_needs' => 'Special Needs',
        'current_grade' => 'Current grade/year',
        'school_curriculum' => 'School curriculum',
        'current_school_name' => 'Current school name',
        'student_lives_with' => 'Student lives with',
        'primary_learning_goal' => 'Primary learning goal',
        'medical_safety_notes' => 'Medical/allergy/safety notes',
        'preferred_class_format' => 'Preferred class format',
        'preferred_group_size' => 'Preferred group size',
        'preferred_teacher_gender' => 'Preferred teacher gender',
        'school_term' => 'School term/admission year',
        'islamic_program_interest' => 'Islamic program interest',
        'quran_reading_level' => 'Quran reading level',
        'tajweed_level' => 'Tajweed level',
        'memorization_status' => 'Memorization status',
        'memorized_portion' => 'Memorized portion',
        'arabic_reading_ability' => 'Arabic reading ability',
        'prior_islamic_studies' => 'Prior Islamic studies',
        'islamic_learning_goal' => 'Islamic learning goal',
        'previous_learning_method' => 'Previous learning method',
        'tafsir_level' => 'Tafsir level',
        'islamic_notes' => 'Islamic studies notes',
        'christian_program_interest' => 'Christian program interest',
        'bible_reading_level' => 'Bible reading level',
        'bible_knowledge_level' => 'Bible knowledge level',
        'christian_studies_level' => 'Christian studies level',
        'prior_christian_studies' => 'Previous Christian studies',
        'christian_previous_learning_method' => 'Previous learning method',
        'christian_learning_goal' => 'Primary learning goal',
        'christian_notes' => 'Additional Christian studies notes',
        'higher_application_level' => 'Application level',
        'higher_program_field' => 'Program or field of study',
        'higher_specialization' => 'Intended specialization',
        'higher_highest_qualification' => 'Highest qualification completed',
        'higher_previous_institution' => 'Previous institution',
        'higher_qualification_title' => 'Qualification title',
        'higher_completion_year' => 'Graduation or expected completion year',
        'higher_academic_result' => 'Academic result',
        'higher_academic_status' => 'Current academic status',
        'higher_admission_route' => 'Admission route',
        'higher_transfer_credits' => 'Transfer credits requested',
        'higher_study_mode' => 'Preferred study mode',
        'higher_study_load' => 'Preferred study load',
        'higher_preferred_intake' => 'Preferred intake or academic term',
        'higher_research_interest' => 'Research interest or proposed topic',
        'higher_funding_method' => 'Funding method',
        'higher_financial_aid_interest' => 'Scholarship or financial-aid interest',
        'higher_support_needs' => 'Academic support or accessibility needs',
        'technical_program' => 'Training program or trade',
        'technical_specialization' => 'Specific specialization',
        'technical_training_level' => 'Training level',
        'technical_previous_experience' => 'Previous technical experience',
        'technical_previous_learning_method' => 'Previous learning method',
        'technical_experience_duration' => 'Experience duration',
        'technical_employment_status' => 'Current employment status',
        'technical_employer_workshop' => 'Current employer or workshop',
        'technical_training_goal' => 'Primary training goal',
        'technical_certification_sought' => 'Certification sought',
        'technical_training_format' => 'Preferred training format',
        'technical_training_schedule' => 'Preferred training schedule',
        'technical_tools_experience' => 'Tools or equipment experience',
        'technical_tool_access' => 'Access to required tools or equipment',
        'technical_digital_skill_level' => 'Computer or digital skill level',
        'technical_safety_training' => 'Safety training completed',
        'technical_protective_equipment' => 'Protective equipment available',
        'technical_support_needs' => 'Practical support or accessibility needs',
        'technical_notes' => 'Additional technical training notes',
        'professional_area' => 'Professional development area',
        'professional_topic_skill' => 'Specific topic or skill',
        'professional_current_role' => 'Current professional role',
        'professional_industry' => 'Industry or sector',
        'professional_employment_status' => 'Employment status',
        'professional_employer' => 'Employer or organisation',
        'professional_experience_years' => 'Years of professional experience',
        'professional_responsibility_level' => 'Current responsibility level',
        'professional_development_goal' => 'Primary development goal',
        'professional_skill_level' => 'Current skill level',
        'professional_credential_sought' => 'Certification or credential sought',
        'professional_certification_deadline' => 'Certification deadline',
        'professional_learning_format' => 'Preferred learning format',
        'professional_learning_schedule' => 'Preferred learning schedule',
        'professional_course_intensity' => 'Preferred course intensity',
        'professional_employer_sponsored' => 'Employer-sponsored training',
        'professional_cpd_required' => 'Continuing professional development credits required',
        'professional_cpd_credits' => 'Required number of CPD credits or hours',
        'professional_workplace_outcome' => 'Expected workplace outcome',
        'professional_support_needs' => 'Professional support or accessibility needs',
        'professional_notes' => 'Additional professional development notes',
        'adult_learning_area' => 'Learning area of interest',
        'adult_subject_skill' => 'Specific subject or skill',
        'adult_education_level' => 'Highest education level completed',
        'adult_literacy_level' => 'Current literacy level',
        'adult_numeracy_level' => 'Current numeracy level',
        'adult_digital_skill_level' => 'Digital skill level',
        'adult_previous_experience' => 'Previous adult-learning experience',
        'adult_previous_learning_method' => 'Previous learning method',
        'adult_learning_goal' => 'Primary learning goal',
        'adult_employment_status' => 'Current employment status',
        'adult_learning_format' => 'Preferred learning format',
        'adult_learning_pace' => 'Preferred learning pace',
        'adult_class_arrangement' => 'Preferred class arrangement',
        'adult_childcare_impact' => 'Childcare responsibilities affecting attendance',
        'adult_work_impact' => 'Work responsibilities affecting attendance',
        'adult_access_limitations' => 'Transport or connectivity limitations',
        'adult_learning_confidence' => 'Confidence returning to learning',
        'adult_support_needs' => 'Learning support or accessibility needs',
        'adult_notes' => 'Additional adult-learning notes',
        'course_type' => 'Course',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary language',
        'preferred_teaching_language' => 'Preferred teaching language',
        'other_languages' => 'Other languages',
        'current_level' => 'Placement level',
        'tajweed_sub_level' => 'Tajweed sub-level',
        'learning_base' => 'Learning background',
        'availability' => 'Availability notes',
        'availability_days' => 'Available days',
        'availability_time_windows' => 'Available times',
        'session_count' => 'Number of sessions',
        'slots' => 'Preferred weekly live-session number of sessions and hours',
        'parent_name' => 'Parent/guardian name',
        'parent_relationship' => 'Relationship to student',
        'parent_relationship_other' => 'Relationship description',
        'parent_email' => 'Parent/guardian email or phone',
        'parent_email_enabled' => 'Parent email notifications',
        'parent_phone' => 'Parent/guardian phone / WhatsApp',
        'emergency_contact_name' => 'Emergency contact name',
        'emergency_contact_phone' => 'Emergency contact phone',
        'parent_username' => 'Parent username',
        'parent_preferences' => 'Parent preferences',
        'referrer_code' => 'Referrer Code',
        'referrer_name' => 'Referrer name',
        'referrer_contact_number' => 'Referrer contact number',
        'referrer_email' => 'Referrer email',
        'referrer_city' => 'Referrer city',
        'referrer_state' => 'Referrer state',
        'referrer_country' => 'Referrer country',
        'referral_datereferred' => 'Date referred',
        'referral_effective_date' => 'Referral effective date',
        'referral_status' => 'Referral status',
        'referral_dateexpires' => 'Referral expiry date',
        'commission_amount' => 'Commission amount',
        'commission_rate' => 'Commission rate',
        'commission_currency' => 'Commission currency',
        'referral_notes' => 'Referral notes',
        'live_class_consent' => 'Live class consent',
        'recording_consent' => 'Video recording consent',
        'consent_notes' => 'Consent notes/comment',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqsil_form_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqsi-error">' . s(pqsil_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqsil_field_class(array $errors, string $name): string {
    return isset($errors[$name]) ? ' pqsi-field--error' : '';
}

function pqsil_selected(array $form, string $name, string $value): string {
    return pqsil_form_value($form, $name) === $value ? ' selected' : '';
}

function pqsil_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqsil_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $selected = pqsil_form_value($form, $name);
    $html = '<select class="pqsi-select" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . ($selected === (string)$value ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqsil_form_error($errors, $name);
    return $html;
}

function pqsil_multi_select(string $name, array $options, array $form, array $errors, int $size = 5): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqsi-select pqsi-select--multi" name="' . s($name) . '[]" multiple size="' . max(2, $size) . '">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqsil_form_error($errors, $name);
    return $html;
}

function pqsil_checkbox_group(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<div class="pqsi-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = in_array((string)$value, $selected, true) ? ' checked' : '';
        $html .= '<label class="pqsi-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    $html .= '</div>' . pqsil_form_error($errors, $name);
    return $html;
}

function pqsil_param_array(string $name): array {
    $values = optional_param_array($name, [], PARAM_TEXT);
    $clean = [];
    foreach ($values as $value) {
        $value = trim((string)$value);
        if ($value !== '' && !in_array($value, $clean, true)) {
            $clean[] = $value;
        }
    }
    return $clean;
}

function pqsil_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = (string)($options[$value] ?? $value);
    }
    return $labels;
}

function pqsil_placement_level_options(array $options): array {
    return $options['current_levels'] ?? [];
}

function pqsil_valid_slots(array $slots, array $days, array $hours): array {
    $clean = [];
    foreach ($slots as $slot) {
        $parts = explode('|', (string)$slot, 2);
        if (count($parts) !== 2) {
            continue;
        }
        [$day, $hour] = $parts;
        if (array_key_exists($day, $days) && array_key_exists($hour, $hours)) {
            $clean[$day . '|' . $hour] = $day . '|' . $hour;
        }
    }
    return array_values($clean);
}

function pqsil_slot_summary(array $slots, array $days, array $hours, int $sessioncount): string {
    $grouped = [];
    foreach ($slots as $slot) {
        $parts = explode('|', (string)$slot, 2);
        if (count($parts) !== 2) {
            continue;
        }
        [$day, $hour] = $parts;
        $daylabel = (string)($days[$day] ?? $day);
        $hourlabel = (string)($hours[$hour] ?? $hour);
        $grouped[$daylabel][$hourlabel] = $hourlabel;
    }
    $summary = ['Requested sessions per week: ' . $sessioncount];
    foreach ($grouped as $daylabel => $hourlabels) {
        $summary[] = $daylabel . ': ' . implode(', ', array_values($hourlabels));
    }
    return implode('; ', $summary);
}
