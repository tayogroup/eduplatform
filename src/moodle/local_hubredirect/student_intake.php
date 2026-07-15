<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');
require_once(__DIR__ . '/course_offeringlib.php');

$pqsiconsumercontext = pqh_requested_consumer_context();
$pqsioptions = require(__DIR__ . '/student_intake_config.php');
$pqsioptions['course_types'] = pqco_workspace_course_options($pqsiconsumercontext, [], false);
$pqsiinstitutiontype = pqhi_clean_institution_type((string)($pqsiconsumercontext->institution_type ?? ''), '');
$pqsifaithsubcategory = pqhi_clean_faith_subcategory((string)($pqsiconsumercontext->faith_subcategory ?? ''));
$pqsiisprimaryeducation = $pqsiinstitutiontype === 'primary_education';
$pqsiishighereducation = $pqsiinstitutiontype === 'higher_education';
$pqsiistechnicaltraining = $pqsiinstitutiontype === 'technical_training';
$pqsiisprofessionaldevelopment = $pqsiinstitutiontype === 'professional_development';
$pqsiisadultlearning = $pqsiinstitutiontype === 'adult_learning';
$pqsiisislamicstudies = $pqsiinstitutiontype === 'faith_based_education' && $pqsifaithsubcategory === 'islamic_studies';
$pqsiischristianstudies = $pqsiinstitutiontype === 'faith_based_education' && $pqsifaithsubcategory === 'christian_studies';

$pqsiisoperationsuser = pqh_can_manage_academy_operations((int)$USER->id);
$pqsiisindependentteacher = pqh_has_independent_teacher_profile((int)$USER->id);
if (!$pqsiisoperationsuser && !$pqsiisindependentteacher) {
    pqh_access_denied(
        'Only platform operations users and approved independent teachers can create student intake records.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Student intake access required'
    );
}

function pqsi_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqsi_table_has_field(string $table, string $field): bool {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqsi_record_for_existing_columns(string $table, stdClass $record): stdClass {
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

function pqsi_profile_ready(): bool {
    return pqsi_table_exists('local_prequran_student_profile');
}

function pqsi_trim_param(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqsi_email_param(string $name): string {
    return trim(optional_param($name, '', PARAM_TEXT));
}

function pqsi_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqsi_phone_email(string $contact, string $prefix): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    if ($token === '') {
        $token = uniqid($prefix, false);
    }
    return $prefix . '.' . $token . '@eduplatform.local';
}

function pqsi_moodle_email_from_contact(string $contact, string $prefix): string {
    if ($contact !== '' && pqsi_contact_is_email($contact)) {
        return $contact;
    }
    return pqsi_phone_email($contact, $prefix);
}

function pqsi_normalize_username(string $seed): string {
    $seed = core_text::strtolower(trim($seed));
    $seed = preg_replace('/[^a-z0-9._-]+/', '.', $seed);
    $seed = trim((string)$seed, '.-_');
    return $seed !== '' ? $seed : 'qauser';
}

function pqsi_unique_username(string $seed): string {
    global $DB;
    $base = core_text::substr(pqsi_normalize_username($seed), 0, 80);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $GLOBALS['CFG']->mnet_localhost_id])) {
        $suffix++;
        $username = core_text::substr($base, 0, 70) . $suffix;
    }
    return $username;
}

function pqsi_age_band(int $age): string {
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

function pqsi_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqsi_profile_ready() ? $DB->get_columns('local_prequran_student_profile') : [];
    }
    return $columns;
}

function pqsi_set_profile_field(stdClass $record, string $field, $value): void {
    $columns = pqsi_profile_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqsi_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '' || !pqsi_contact_is_email($email)) {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqsi_existing_user(int $userid): stdClass {
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

function pqsi_find_duplicate_profile(string $displayname, string $parentemail, string $studentemail): ?stdClass {
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

function pqsi_create_user(string $firstname, string $lastname, string $email, string $username, bool $emailstop): array {
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

function pqsi_send_parent_intake_email(stdClass $parent, stdClass $student, string $approvalurl, bool $parentcreated): bool {
    global $CFG, $SITE;
    if (empty($parent->email) || !pqsi_contact_is_email((string)$parent->email) || !empty($parent->emailstop)) {
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

function pqsi_save_profile(int $studentid, array $data): int {
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
        'age_band' => pqsi_age_band($age),
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
    pqsi_set_profile_field($record, 'student_display_name', (string)$data['student_display_name']);
    pqsi_set_profile_field($record, 'student_middle_name', (string)$data['student_middle_name']);
    pqsi_set_profile_field($record, 'student_access_type', (string)$data['student_access_type']);
    pqsi_set_profile_field($record, 'date_of_birth', (string)($data['date_of_birth'] ?? ''));
    pqsi_set_profile_field($record, 'primary_language', $primarylanguage);
    pqsi_set_profile_field($record, 'preferred_teaching_language', (string)$data['preferred_teaching_language']);
    pqsi_set_profile_field($record, 'tajweed_sub_level', (string)$data['tajweed_sub_level']);
    pqsi_set_profile_field($record, 'special_needs', (string)$data['special_needs']);
    pqsi_set_profile_field($record, 'course_type', (string)$data['course_type']);
    pqsi_set_profile_field($record, 'parent_name', (string)$data['parent_name']);
    pqsi_set_profile_field($record, 'parent_relationship', (string)($data['parent_relationship'] ?? ''));
    pqsi_set_profile_field($record, 'parent_relationship_other', (string)($data['parent_relationship_other'] ?? ''));
    pqsi_set_profile_field($record, 'parent_email', (string)$data['parent_email']);
    pqsi_set_profile_field($record, 'parent_email_enabled', (int)$data['parent_email_enabled']);
    pqsi_set_profile_field($record, 'parent_phone', (string)$data['parent_phone']);
    pqsi_set_profile_field($record, 'emergency_contact_name', (string)($data['emergency_contact_name'] ?? ''));
    pqsi_set_profile_field($record, 'emergency_contact_phone', (string)($data['emergency_contact_phone'] ?? ''));
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
        pqsi_set_profile_field($record, $field, (string)($data[$field] ?? ''));
    }
    pqsi_set_profile_field($record, 'live_class_consent', (int)$data['live_class_consent']);
    pqsi_set_profile_field($record, 'recording_consent', (int)$data['recording_consent']);
    pqsi_set_profile_field($record, 'consent_notes', (string)$data['consent_notes']);
    pqsi_set_profile_field($record, 'enrollment_approval_status', (string)($data['enrollment_approval_status'] ?? 'approved'));
    pqsi_set_profile_field($record, 'enrollment_approvedby', (int)($data['enrollment_approvedby'] ?? 0));
    pqsi_set_profile_field($record, 'enrollment_approvedat', (int)($data['enrollment_approvedat'] ?? 0));
    pqsi_set_profile_field($record, 'enrollment_approval_notes', (string)($data['enrollment_approval_notes'] ?? ''));
    pqsi_set_profile_field($record, 'workspaceid', (int)($data['workspaceid'] ?? 0));

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

function pqsi_upsert_comm_consent(int $studentid, int $parentid): void {
    global $DB;
    if (!pqsi_table_exists('local_prequran_comm_consent') || $studentid <= 0 || $parentid <= 0) {
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

function pqsi_upsert_live_consent(int $studentid, int $parentid, string $type, int $granted, string $details): void {
    global $DB;
    if (!pqsi_table_exists('local_prequran_live_consent') || $studentid <= 0 || $parentid <= 0) {
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

function pqsi_enrollment_already_approved(int $studentid, int $parentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (pqsi_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
        $status = $DB->get_field('local_prequran_student_profile', 'enrollment_approval_status', ['userid' => $studentid]);
        if (is_string($status) && strtolower($status) === 'approved') {
            return true;
        }
    }
    if (!pqsi_table_exists('local_prequran_live_consent') || $parentid <= 0) {
        return false;
    }
    return $DB->record_exists('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => 'enrollment_approval',
        'granted' => 1,
    ]);
}

function pqsi_clean_referrer_code(string $code): string {
    return preg_replace('/\D+/', '', $code);
}

function pqsi_find_referrer_by_code(string $code): ?stdClass {
    global $DB;
    $code = pqsi_clean_referrer_code($code);
    if ($code === '' || !pqsi_table_exists('local_prequran_referrer')) {
        return null;
    }
    $referrer = $DB->get_record('local_prequran_referrer', ['referrer_code' => $code], '*', IGNORE_MULTIPLE);
    if (!$referrer || !in_array(strtolower((string)$referrer->status), ['active', 'pending'], true)) {
        return null;
    }
    return $referrer;
}

function pqsi_date_to_time(string $date, int $fallback): int {
    $date = trim($date);
    if ($date === '') {
        return $fallback;
    }
    $time = strtotime($date . ' 00:00:00');
    return $time !== false ? (int)$time : $fallback;
}

function pqsi_upsert_referral(int $studentid, ?stdClass $referrer, array $data): int {
    global $DB, $USER;
    if (!$referrer || !pqsi_table_exists('local_prequran_referral') || $studentid <= 0) {
        return 0;
    }
    $now = time();

    if (pqsi_table_exists('local_prequran_referrer')) {
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
        $DB->update_record('local_prequran_referrer', pqsi_record_for_existing_columns('local_prequran_referrer', $referrerrecord));
    }

    $record = (object)[
        'referrerid' => (int)$referrer->id,
        'studentid' => $studentid,
        'datereferred' => pqsi_date_to_time((string)($data['referral_datereferred'] ?? ''), $now),
        'effectiveat' => pqsi_date_to_time((string)($data['referral_effective_date'] ?? ''), pqsi_date_to_time((string)($data['referral_datereferred'] ?? ''), $now)),
        'referrer_name' => trim((string)($data['referrer_name'] ?? '')) !== '' ? (string)$data['referrer_name'] : (string)($referrer->name ?? ''),
        'referrer_contact_number' => trim((string)($data['referrer_contact_number'] ?? '')) !== '' ? (string)$data['referrer_contact_number'] : (string)($referrer->phone ?? ($referrer->contact ?? '')),
        'referrer_email' => (string)($data['referrer_email'] ?? ($referrer->email ?? '')),
        'referrer_city' => (string)($data['referrer_city'] ?? ($referrer->city ?? '')),
        'referrer_state' => (string)($data['referrer_state'] ?? ($referrer->state ?? '')),
        'referrer_country' => (string)($data['referrer_country'] ?? ($referrer->country ?? '')),
        'referral_status' => (string)($data['referral_status'] ?? 'pending'),
        'dateexpires' => pqsi_date_to_time((string)($data['referral_dateexpires'] ?? ''), $now + 90 * DAYSECS),
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
        $DB->update_record('local_prequran_referral', pqsi_record_for_existing_columns('local_prequran_referral', $record));
        return (int)$existing->id;
    }
    $record->createdby = (int)$USER->id;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_referral', pqsi_record_for_existing_columns('local_prequran_referral', $record));
}

function pqsi_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqsi_table_exists('local_prequran_live_audit')) {
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

function pqsi_preferred_teacherid_from_text(string $text): int {
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

function pqsi_consumerid_for_intake_request(?stdClass $request): int {
    if (!$request || !pqsi_table_has_field('local_prequran_intake_request', 'consumerid')) {
        return 0;
    }
    return (int)($request->consumerid ?? 0);
}

function pqsi_workspaceid_for_intake_request(?stdClass $request): int {
    if (!$request || !pqsi_table_has_field('local_prequran_intake_request', 'workspaceid')) {
        return 0;
    }
    return (int)($request->workspaceid ?? 0);
}

function pqsi_workspaceid_for_requestid(int $requestid): int {
    global $DB;
    if ($requestid <= 0 || !pqsi_table_exists('local_prequran_intake_request') || !pqsi_table_has_field('local_prequran_intake_request', 'workspaceid')) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_intake_request', 'workspaceid', ['id' => $requestid], IGNORE_MISSING);
}

function pqsi_upsert_workspace_member(int $workspaceid, int $userid, string $role, string $note): void {
    global $DB, $USER;
    if ($workspaceid <= 0 || $userid <= 0 || !pqsi_table_exists('local_prequran_workspace_member')) {
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

function pqsi_upsert_teacher_marketplace_request(int $teacherid, int $parentid, int $studentid, int $consumerid, string $source): int {
    global $DB;
    if ($teacherid <= 0 || $studentid <= 0 || !pqsi_table_exists('local_prequran_teacher_request')) {
        return 0;
    }
    $now = time();
    $params = [
        'teacherid' => $teacherid,
        'parentid' => $parentid,
        'studentid' => $studentid,
    ];
    $consumerwhere = '';
    if ($consumerid > 0 && pqsi_table_has_field('local_prequran_teacher_request', 'consumerid')) {
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
        if ($consumerid > 0 && pqsi_table_has_field('local_prequran_teacher_request', 'consumerid')) {
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
    if ($consumerid > 0 && pqsi_table_has_field('local_prequran_teacher_request', 'consumerid')) {
        $record->consumerid = $consumerid;
    }
    return (int)$DB->insert_record('local_prequran_teacher_request', $record);
}

function pqsi_form_value(array $form, string $name): string {
    if (!isset($form[$name])) {
        return '';
    }
    return is_array($form[$name]) ? implode(', ', array_map('strval', $form[$name])) : (string)$form[$name];
}

function pqsi_field_label(string $name): string {
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

function pqsi_form_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqsi-error">' . s(pqsi_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqsi_field_class(array $errors, string $name): string {
    return isset($errors[$name]) ? ' pqsi-field--error' : '';
}

function pqsi_selected(array $form, string $name, string $value): string {
    return pqsi_form_value($form, $name) === $value ? ' selected' : '';
}

function pqsi_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqsi_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $selected = pqsi_form_value($form, $name);
    $html = '<select class="pqsi-select" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . ($selected === (string)$value ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqsi_form_error($errors, $name);
    return $html;
}

function pqsi_multi_select(string $name, array $options, array $form, array $errors, int $size = 5): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqsi-select pqsi-select--multi" name="' . s($name) . '[]" multiple size="' . max(2, $size) . '">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqsi_form_error($errors, $name);
    return $html;
}

function pqsi_checkbox_group(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<div class="pqsi-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = in_array((string)$value, $selected, true) ? ' checked' : '';
        $html .= '<label class="pqsi-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    $html .= '</div>' . pqsi_form_error($errors, $name);
    return $html;
}

function pqsi_param_array(string $name): array {
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

function pqsi_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = (string)($options[$value] ?? $value);
    }
    return $labels;
}

function pqsi_placement_level_options(array $options): array {
    return $options['current_levels'] ?? [];
}

function pqsi_valid_slots(array $slots, array $days, array $hours): array {
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

function pqsi_slot_summary(array $slots, array $days, array $hours, int $sessioncount): string {
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

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/student_intake.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Intake');
$PAGE->set_heading('Student Intake');
$PAGE->add_body_class('pqh-student-intake-page');

$ready = pqsi_profile_ready();
$message = '';
$error = '';
$created = [];
$fielderrors = [];
$form = [
    'requestid' => '',
    'workspaceid' => '',
    'existing_studentid' => '',
    'student_firstname' => '',
    'student_middle_name' => '',
    'student_lastname' => '',
    'student_display_name' => '',
    'student_username' => '',
    'student_email' => '',
    'student_access_type' => 'managed',
    'date_of_birth' => '',
    'age_years' => '',
    'gender' => '',
    'special_needs' => '',
    'current_grade' => '',
    'school_curriculum' => '',
    'current_school_name' => '',
    'student_lives_with' => '',
    'primary_learning_goal' => '',
    'medical_safety_notes' => '',
    'preferred_class_format' => '',
    'preferred_group_size' => '',
    'preferred_teacher_gender' => '',
    'school_term' => '',
    'islamic_program_interest' => '',
    'quran_reading_level' => '',
    'tajweed_level' => '',
    'memorization_status' => '',
    'memorized_portion' => '',
    'arabic_reading_ability' => '',
    'prior_islamic_studies' => '',
    'islamic_learning_goal' => '',
    'previous_learning_method' => '',
    'tafsir_level' => '',
    'islamic_notes' => '',
    'christian_program_interest' => '',
    'bible_reading_level' => '',
    'bible_knowledge_level' => '',
    'christian_studies_level' => '',
    'prior_christian_studies' => '',
    'christian_previous_learning_method' => '',
    'christian_learning_goal' => '',
    'christian_notes' => '',
    'higher_application_level' => '',
    'higher_program_field' => '',
    'higher_specialization' => '',
    'higher_highest_qualification' => '',
    'higher_previous_institution' => '',
    'higher_qualification_title' => '',
    'higher_completion_year' => '',
    'higher_academic_result' => '',
    'higher_academic_status' => '',
    'higher_admission_route' => '',
    'higher_transfer_credits' => '',
    'higher_study_mode' => '',
    'higher_study_load' => '',
    'higher_preferred_intake' => '',
    'higher_research_interest' => '',
    'higher_funding_method' => '',
    'higher_financial_aid_interest' => '',
    'higher_support_needs' => '',
    'technical_program' => '',
    'technical_specialization' => '',
    'technical_training_level' => '',
    'technical_previous_experience' => '',
    'technical_previous_learning_method' => '',
    'technical_experience_duration' => '',
    'technical_employment_status' => '',
    'technical_employer_workshop' => '',
    'technical_training_goal' => '',
    'technical_certification_sought' => '',
    'technical_training_format' => '',
    'technical_training_schedule' => '',
    'technical_tools_experience' => '',
    'technical_tool_access' => '',
    'technical_digital_skill_level' => '',
    'technical_safety_training' => '',
    'technical_protective_equipment' => '',
    'technical_support_needs' => '',
    'technical_notes' => '',
    'professional_area' => '',
    'professional_topic_skill' => '',
    'professional_current_role' => '',
    'professional_industry' => '',
    'professional_employment_status' => '',
    'professional_employer' => '',
    'professional_experience_years' => '',
    'professional_responsibility_level' => '',
    'professional_development_goal' => '',
    'professional_skill_level' => '',
    'professional_credential_sought' => '',
    'professional_certification_deadline' => '',
    'professional_learning_format' => '',
    'professional_learning_schedule' => '',
    'professional_course_intensity' => '',
    'professional_employer_sponsored' => '',
    'professional_cpd_required' => '',
    'professional_cpd_credits' => '',
    'professional_workplace_outcome' => '',
    'professional_support_needs' => '',
    'professional_notes' => '',
    'adult_learning_area' => '',
    'adult_subject_skill' => '',
    'adult_education_level' => '',
    'adult_literacy_level' => '',
    'adult_numeracy_level' => '',
    'adult_digital_skill_level' => '',
    'adult_previous_experience' => '',
    'adult_previous_learning_method' => '',
    'adult_learning_goal' => '',
    'adult_employment_status' => '',
    'adult_learning_format' => '',
    'adult_learning_pace' => '',
    'adult_class_arrangement' => '',
    'adult_childcare_impact' => '',
    'adult_work_impact' => '',
    'adult_access_limitations' => '',
    'adult_learning_confidence' => '',
    'adult_support_needs' => '',
    'adult_notes' => '',
    'course_type' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => 'Africa/Nairobi',
    'primary_language' => '',
    'preferred_teaching_language' => '',
    'other_languages' => [],
    'current_level' => '',
    'tajweed_sub_level' => '',
    'learning_base' => '',
    'availability' => '',
    'session_count' => '1',
    'slots' => [],
    'availability_days' => [],
    'availability_time_windows' => [],
    'parent_name' => '',
    'parent_relationship' => '',
    'parent_relationship_other' => '',
    'parent_email' => '',
    'parent_email_enabled' => 1,
    'parent_phone' => '',
    'emergency_contact_name' => '',
    'emergency_contact_phone' => '',
    'parent_username' => '',
    'parent_preferences' => '',
    'referrer_code' => '',
    'referrer_name' => '',
    'referrer_contact_number' => '',
    'referrer_email' => '',
    'referrer_city' => '',
    'referrer_state' => '',
    'referrer_country' => '',
    'referral_datereferred' => date('Y-m-d'),
    'referral_effective_date' => date('Y-m-d'),
    'referral_status' => 'pending',
    'referral_dateexpires' => date('Y-m-d', time() + 90 * DAYSECS),
    'commission_amount' => '',
    'commission_rate' => '',
    'commission_currency' => 'USD',
    'referral_notes' => '',
    'live_class_consent' => 0,
    'recording_consent' => 0,
    'consent_notes' => '',
];

$getrequestid = optional_param('requestid', 0, PARAM_INT);
$getworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($getrequestid > 0) {
    $form['requestid'] = (string)$getrequestid;
}
if ($getworkspaceid <= 0 && $getrequestid > 0) {
    $getworkspaceid = pqsi_workspaceid_for_requestid($getrequestid);
}
if ($getworkspaceid <= 0 && $pqsiisindependentteacher) {
    $getworkspaceid = pqh_current_workspace_id((int)$USER->id, 0);
}
if ($getworkspaceid > 0) {
    if (!$pqsiisoperationsuser && !pqh_user_can_teach_in_workspace((int)$USER->id, $getworkspaceid)) {
        pqh_access_denied(
            'This student intake form is not available for that workspace.',
            new moodle_url('/local/hubredirect/dashboard.php'),
            'Student intake workspace access required'
        );
    }
    $form['workspaceid'] = (string)$getworkspaceid;
}

$prefillrequestid = 0;
if ($ready && $_SERVER['REQUEST_METHOD'] !== 'POST' && !empty($SESSION->pqsi_prefill) && is_array($SESSION->pqsi_prefill)) {
    $prefill = $SESSION->pqsi_prefill;
    unset($SESSION->pqsi_prefill);
    foreach ($form as $field => $default) {
        if (array_key_exists($field, $prefill)) {
            $form[$field] = $prefill[$field];
        }
    }
    $prefillrequestid = (int)($form['requestid'] ?? 0);
    $message = $prefillrequestid > 0
        ? 'Public intake request #' . $prefillrequestid . ' loaded. Review the details, then create the Moodle student intake.'
        : 'Intake details loaded. Review the details, then create the Moodle student intake.';
}

if (!empty($SESSION->pqsi_created)) {
    $created = (array)$SESSION->pqsi_created;
    unset($SESSION->pqsi_created);
    $message = !empty($created['approvalurl'])
        ? 'Student intake completed. Parent/guardian approval is required before the student can start lessons.'
        : 'Student intake completed. The student is now ready for grouping and lessons.';
}

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $transaction = null;
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This student intake form expired. Please refresh and try again.');
        }
        $requestid = optional_param('requestid', 0, PARAM_INT);
        $workspaceid = optional_param('workspaceid', 0, PARAM_INT);
        if ($workspaceid <= 0 && $requestid > 0) {
            $workspaceid = pqsi_workspaceid_for_requestid($requestid);
        }
        if ($workspaceid <= 0 && $pqsiisindependentteacher && !$pqsiisoperationsuser) {
            throw new invalid_parameter_exception('Independent teacher student intake requires a teacher workspace.');
        }
        $workspaceallowed = $workspaceid > 0 && pqh_consumer_context_allows_workspace($pqsiconsumercontext, $workspaceid);
        if ($workspaceid > 0 && $pqsiisindependentteacher && pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
            $workspaceallowed = true;
        }
        if ($workspaceid > 0 && !$workspaceallowed) {
            throw new invalid_parameter_exception('This workspace does not belong to the active consumer.');
        }
        $existingstudentid = optional_param('existing_studentid', 0, PARAM_INT);
        if ($existingstudentid > 0 && $pqsiisindependentteacher && !$pqsiisoperationsuser) {
            throw new invalid_parameter_exception('Use Find existing student to request access to an existing learner. Existing profiles cannot be transferred through intake.');
        }
        $firstname = pqsi_trim_param('student_firstname');
        $middlename = pqsi_trim_param('student_middle_name');
        $lastname = pqsi_trim_param('student_lastname');
        $displayname = pqsi_trim_param('student_display_name', trim($firstname . ' ' . $middlename . ' ' . $lastname));
        $studentemail = pqsi_email_param('student_email');
        $parentname = pqsi_trim_param('parent_name');
        $parentrelationship = pqsi_trim_param('parent_relationship');
        $parentrelationshipother = pqsi_trim_param('parent_relationship_other');
        $parentemail = pqsi_email_param('parent_email');
        $parentphone = pqsi_trim_param('parent_phone');
        $emergencycontactname = pqsi_trim_param('emergency_contact_name');
        $emergencycontactphone = pqsi_trim_param('emergency_contact_phone');
        $parentcontact = $parentemail !== '' ? $parentemail : $parentphone;
        $referrercode = pqsi_clean_referrer_code(pqsi_trim_param('referrer_code'));
        $timezone = pqsi_trim_param('timezone', 'Africa/Nairobi');
        $country = pqsi_trim_param('country');
        $city = pqsi_trim_param('city');
        $cityother = pqsi_trim_param('city_other');
        $savedcity = $city === 'Other' ? $cityother : $city;

        $form = [
            'requestid' => $requestid > 0 ? (string)$requestid : '',
            'workspaceid' => $workspaceid > 0 ? (string)$workspaceid : '',
            'existing_studentid' => $existingstudentid > 0 ? (string)$existingstudentid : '',
            'student_firstname' => $firstname,
            'student_middle_name' => $middlename,
            'student_lastname' => $lastname,
            'student_display_name' => $displayname,
            'student_username' => optional_param('student_username', '', PARAM_USERNAME),
            'student_email' => $studentemail,
            'student_access_type' => pqsi_trim_param('student_access_type', 'managed'),
            'date_of_birth' => pqsi_trim_param('date_of_birth'),
            'age_years' => (string)optional_param('age_years', 0, PARAM_INT),
            'gender' => pqsi_trim_param('gender'),
            'special_needs' => pqsi_trim_param('special_needs'),
            'current_grade' => pqsi_trim_param('current_grade'),
            'school_curriculum' => pqsi_trim_param('school_curriculum'),
            'current_school_name' => pqsi_trim_param('current_school_name'),
            'student_lives_with' => pqsi_trim_param('student_lives_with'),
            'primary_learning_goal' => pqsi_trim_param('primary_learning_goal'),
            'medical_safety_notes' => pqsi_trim_param('medical_safety_notes'),
            'preferred_class_format' => pqsi_trim_param('preferred_class_format'),
            'preferred_group_size' => pqsi_trim_param('preferred_group_size'),
            'preferred_teacher_gender' => pqsi_trim_param('preferred_teacher_gender'),
            'school_term' => pqsi_trim_param('school_term'),
            'islamic_program_interest' => pqsi_trim_param('islamic_program_interest'),
            'quran_reading_level' => pqsi_trim_param('quran_reading_level'),
            'tajweed_level' => pqsi_trim_param('tajweed_level'),
            'memorization_status' => pqsi_trim_param('memorization_status'),
            'memorized_portion' => pqsi_trim_param('memorized_portion'),
            'arabic_reading_ability' => pqsi_trim_param('arabic_reading_ability'),
            'prior_islamic_studies' => pqsi_trim_param('prior_islamic_studies'),
            'islamic_learning_goal' => pqsi_trim_param('islamic_learning_goal'),
            'previous_learning_method' => pqsi_trim_param('previous_learning_method'),
            'tafsir_level' => pqsi_trim_param('tafsir_level'),
            'islamic_notes' => pqsi_trim_param('islamic_notes'),
            'christian_program_interest' => pqsi_trim_param('christian_program_interest'),
            'bible_reading_level' => pqsi_trim_param('bible_reading_level'),
            'bible_knowledge_level' => pqsi_trim_param('bible_knowledge_level'),
            'christian_studies_level' => pqsi_trim_param('christian_studies_level'),
            'prior_christian_studies' => pqsi_trim_param('prior_christian_studies'),
            'christian_previous_learning_method' => pqsi_trim_param('christian_previous_learning_method'),
            'christian_learning_goal' => pqsi_trim_param('christian_learning_goal'),
            'christian_notes' => pqsi_trim_param('christian_notes'),
            'higher_application_level' => pqsi_trim_param('higher_application_level'),
            'higher_program_field' => pqsi_trim_param('higher_program_field'),
            'higher_specialization' => pqsi_trim_param('higher_specialization'),
            'higher_highest_qualification' => pqsi_trim_param('higher_highest_qualification'),
            'higher_previous_institution' => pqsi_trim_param('higher_previous_institution'),
            'higher_qualification_title' => pqsi_trim_param('higher_qualification_title'),
            'higher_completion_year' => pqsi_trim_param('higher_completion_year'),
            'higher_academic_result' => pqsi_trim_param('higher_academic_result'),
            'higher_academic_status' => pqsi_trim_param('higher_academic_status'),
            'higher_admission_route' => pqsi_trim_param('higher_admission_route'),
            'higher_transfer_credits' => pqsi_trim_param('higher_transfer_credits'),
            'higher_study_mode' => pqsi_trim_param('higher_study_mode'),
            'higher_study_load' => pqsi_trim_param('higher_study_load'),
            'higher_preferred_intake' => pqsi_trim_param('higher_preferred_intake'),
            'higher_research_interest' => pqsi_trim_param('higher_research_interest'),
            'higher_funding_method' => pqsi_trim_param('higher_funding_method'),
            'higher_financial_aid_interest' => pqsi_trim_param('higher_financial_aid_interest'),
            'higher_support_needs' => pqsi_trim_param('higher_support_needs'),
            'technical_program' => pqsi_trim_param('technical_program'),
            'technical_specialization' => pqsi_trim_param('technical_specialization'),
            'technical_training_level' => pqsi_trim_param('technical_training_level'),
            'technical_previous_experience' => pqsi_trim_param('technical_previous_experience'),
            'technical_previous_learning_method' => pqsi_trim_param('technical_previous_learning_method'),
            'technical_experience_duration' => pqsi_trim_param('technical_experience_duration'),
            'technical_employment_status' => pqsi_trim_param('technical_employment_status'),
            'technical_employer_workshop' => pqsi_trim_param('technical_employer_workshop'),
            'technical_training_goal' => pqsi_trim_param('technical_training_goal'),
            'technical_certification_sought' => pqsi_trim_param('technical_certification_sought'),
            'technical_training_format' => pqsi_trim_param('technical_training_format'),
            'technical_training_schedule' => pqsi_trim_param('technical_training_schedule'),
            'technical_tools_experience' => pqsi_trim_param('technical_tools_experience'),
            'technical_tool_access' => pqsi_trim_param('technical_tool_access'),
            'technical_digital_skill_level' => pqsi_trim_param('technical_digital_skill_level'),
            'technical_safety_training' => pqsi_trim_param('technical_safety_training'),
            'technical_protective_equipment' => pqsi_trim_param('technical_protective_equipment'),
            'technical_support_needs' => pqsi_trim_param('technical_support_needs'),
            'technical_notes' => pqsi_trim_param('technical_notes'),
            'professional_area' => pqsi_trim_param('professional_area'),
            'professional_topic_skill' => pqsi_trim_param('professional_topic_skill'),
            'professional_current_role' => pqsi_trim_param('professional_current_role'),
            'professional_industry' => pqsi_trim_param('professional_industry'),
            'professional_employment_status' => pqsi_trim_param('professional_employment_status'),
            'professional_employer' => pqsi_trim_param('professional_employer'),
            'professional_experience_years' => pqsi_trim_param('professional_experience_years'),
            'professional_responsibility_level' => pqsi_trim_param('professional_responsibility_level'),
            'professional_development_goal' => pqsi_trim_param('professional_development_goal'),
            'professional_skill_level' => pqsi_trim_param('professional_skill_level'),
            'professional_credential_sought' => pqsi_trim_param('professional_credential_sought'),
            'professional_certification_deadline' => pqsi_trim_param('professional_certification_deadline'),
            'professional_learning_format' => pqsi_trim_param('professional_learning_format'),
            'professional_learning_schedule' => pqsi_trim_param('professional_learning_schedule'),
            'professional_course_intensity' => pqsi_trim_param('professional_course_intensity'),
            'professional_employer_sponsored' => pqsi_trim_param('professional_employer_sponsored'),
            'professional_cpd_required' => pqsi_trim_param('professional_cpd_required'),
            'professional_cpd_credits' => pqsi_trim_param('professional_cpd_credits'),
            'professional_workplace_outcome' => pqsi_trim_param('professional_workplace_outcome'),
            'professional_support_needs' => pqsi_trim_param('professional_support_needs'),
            'professional_notes' => pqsi_trim_param('professional_notes'),
            'adult_learning_area' => pqsi_trim_param('adult_learning_area'),
            'adult_subject_skill' => pqsi_trim_param('adult_subject_skill'),
            'adult_education_level' => pqsi_trim_param('adult_education_level'),
            'adult_literacy_level' => pqsi_trim_param('adult_literacy_level'),
            'adult_numeracy_level' => pqsi_trim_param('adult_numeracy_level'),
            'adult_digital_skill_level' => pqsi_trim_param('adult_digital_skill_level'),
            'adult_previous_experience' => pqsi_trim_param('adult_previous_experience'),
            'adult_previous_learning_method' => pqsi_trim_param('adult_previous_learning_method'),
            'adult_learning_goal' => pqsi_trim_param('adult_learning_goal'),
            'adult_employment_status' => pqsi_trim_param('adult_employment_status'),
            'adult_learning_format' => pqsi_trim_param('adult_learning_format'),
            'adult_learning_pace' => pqsi_trim_param('adult_learning_pace'),
            'adult_class_arrangement' => pqsi_trim_param('adult_class_arrangement'),
            'adult_childcare_impact' => pqsi_trim_param('adult_childcare_impact'),
            'adult_work_impact' => pqsi_trim_param('adult_work_impact'),
            'adult_access_limitations' => pqsi_trim_param('adult_access_limitations'),
            'adult_learning_confidence' => pqsi_trim_param('adult_learning_confidence'),
            'adult_support_needs' => pqsi_trim_param('adult_support_needs'),
            'adult_notes' => pqsi_trim_param('adult_notes'),
            'course_type' => pqsi_trim_param('course_type'),
            'country' => $country,
            'city' => $city,
            'city_other' => $cityother,
            'timezone' => $timezone,
            'primary_language' => pqsi_trim_param('primary_language'),
            'preferred_teaching_language' => pqsi_trim_param('preferred_teaching_language'),
            'other_languages' => pqsi_param_array('other_languages'),
            'current_level' => pqsi_trim_param('current_level'),
            'tajweed_sub_level' => pqsi_trim_param('tajweed_sub_level'),
            'learning_base' => pqsi_trim_param('learning_base'),
            'session_count' => (string)optional_param('session_count', 1, PARAM_INT),
            'slots' => pqsi_param_array('slots'),
            'availability_days' => [],
            'availability_time_windows' => [],
            'availability' => pqsi_trim_param('availability_summary'),
            'parent_name' => $parentname,
            'parent_relationship' => $parentrelationship,
            'parent_relationship_other' => $parentrelationshipother,
            'parent_email' => $parentemail,
            'parent_email_enabled' => optional_param('parent_email_enabled', 0, PARAM_BOOL) ? 1 : 0,
            'parent_phone' => $parentphone,
            'emergency_contact_name' => $emergencycontactname,
            'emergency_contact_phone' => $emergencycontactphone,
            'parent_username' => optional_param('parent_username', '', PARAM_USERNAME),
            'parent_preferences' => pqsi_trim_param('parent_preferences'),
            'referrer_code' => $referrercode,
            'referrer_name' => pqsi_trim_param('referrer_name'),
            'referrer_contact_number' => pqsi_trim_param('referrer_contact_number'),
            'referrer_email' => pqsi_email_param('referrer_email'),
            'referrer_city' => pqsi_trim_param('referrer_city'),
            'referrer_state' => pqsi_trim_param('referrer_state'),
            'referrer_country' => pqsi_trim_param('referrer_country'),
            'referral_datereferred' => pqsi_trim_param('referral_datereferred', date('Y-m-d')),
            'referral_effective_date' => pqsi_trim_param('referral_effective_date', date('Y-m-d')),
            'referral_status' => pqsi_trim_param('referral_status', 'pending'),
            'referral_dateexpires' => pqsi_trim_param('referral_dateexpires', date('Y-m-d', time() + 90 * DAYSECS)),
            'commission_amount' => pqsi_trim_param('commission_amount'),
            'commission_rate' => pqsi_trim_param('commission_rate'),
            'commission_currency' => pqsi_trim_param('commission_currency', 'USD'),
            'referral_notes' => pqsi_trim_param('referral_notes'),
            'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
            'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
            'consent_notes' => pqsi_trim_param('consent_notes'),
        ];
        $sessioncount = max(1, min(5, (int)$form['session_count']));
        $form['session_count'] = (string)$sessioncount;
        $form['slots'] = pqsi_valid_slots(
            $form['slots'],
            $pqsioptions['availability_days'] ?? [],
            $pqsioptions['availability_time_windows'] ?? []
        );
        $slotsummary = pqsi_slot_summary(
            $form['slots'],
            $pqsioptions['availability_days'] ?? [],
            $pqsioptions['availability_time_windows'] ?? [],
            $sessioncount
        );
        $availabilitynotes = $form['availability'];
        $availabilityforsave = $slotsummary;
        if ($availabilityforsave !== '' && $availabilitynotes !== '') {
            $availabilityforsave .= '; Notes: ' . $availabilitynotes;
        } else if ($availabilityforsave === '') {
            $availabilityforsave = $availabilitynotes;
        }

        if ($existingstudentid <= 0 && ($firstname === '' || $middlename === '' || $lastname === '')) {
            if ($firstname === '') {
                $fielderrors['student_firstname'] = 'First name is required when creating a new Moodle student account.';
            }
            if ($middlename === '') {
                $fielderrors['student_middle_name'] = 'Middle name is required.';
            }
            if ($lastname === '') {
                $fielderrors['student_lastname'] = 'Last name is required when creating a new Moodle student account.';
            }
        } else if ($middlename === '') {
            $fielderrors['student_middle_name'] = 'Middle name is required.';
        }
        $ageyears = optional_param('age_years', 0, PARAM_INT);
        $isadultstudent = $ageyears >= 18;
        if ($pqsiisprimaryeducation) {
            foreach ([
                'date_of_birth' => 'Date of birth is required for primary education students.',
                'age_years' => 'Age is required for primary education students.',
                'gender' => 'Gender is required for primary education students.',
                'special_needs' => 'Special Needs must be Yes or No for primary education students.',
                'current_grade' => 'Current grade/year is required for primary education students.',
                'parent_name' => 'Parent/guardian name is required for primary education students.',
                'parent_relationship' => 'Relationship to student is required for primary education students.',
                'emergency_contact_phone' => 'Emergency contact phone is required for primary education students.',
            ] as $field => $fieldmessage) {
                if (trim((string)($form[$field] ?? '')) === '') {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
            if ($parentcontact === '') {
                $fielderrors['parent_email'] = 'Parent/guardian email, phone, or WhatsApp is required for primary education students.';
            }
        }
        if ($pqsiishighereducation) {
            foreach ([
                'higher_application_level' => 'Application level is required for higher education students.',
                'higher_program_field' => 'Program or field of study is required for higher education students.',
                'higher_highest_qualification' => 'Highest qualification completed is required for higher education students.',
                'higher_academic_status' => 'Current academic status is required for higher education students.',
                'higher_study_mode' => 'Preferred study mode is required for higher education students.',
                'higher_study_load' => 'Preferred study load is required for higher education students.',
            ] as $field => $fieldmessage) {
                if (trim((string)($form[$field] ?? '')) === '') {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
        }
        if ($pqsiistechnicaltraining) {
            foreach ([
                'technical_program' => 'Training program or trade is required for technical training students.',
                'technical_training_level' => 'Training level is required for technical training students.',
                'technical_previous_experience' => 'Previous technical experience is required for technical training students.',
                'technical_training_goal' => 'Primary training goal is required for technical training students.',
                'technical_training_format' => 'Preferred training format is required for technical training students.',
                'technical_tool_access' => 'Access to required tools or equipment is required for technical training students.',
            ] as $field => $fieldmessage) {
                if (trim((string)($form[$field] ?? '')) === '') {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
        }
        if ($pqsiisprofessionaldevelopment) {
            foreach ([
                'professional_area' => 'Professional development area is required.',
                'professional_current_role' => 'Current professional role is required.',
                'professional_employment_status' => 'Employment status is required.',
                'professional_development_goal' => 'Primary development goal is required.',
                'professional_skill_level' => 'Current skill level is required.',
                'professional_learning_format' => 'Preferred learning format is required.',
            ] as $field => $fieldmessage) {
                if (trim((string)($form[$field] ?? '')) === '') {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
        }
        if ($pqsiisadultlearning) {
            foreach ([
                'adult_learning_area' => 'Learning area of interest is required.',
                'adult_education_level' => 'Highest education level completed is required.',
                'adult_learning_goal' => 'Primary learning goal is required.',
                'adult_learning_format' => 'Preferred learning format is required.',
                'adult_learning_pace' => 'Preferred learning pace is required.',
            ] as $field => $fieldmessage) {
                if (trim((string)($form[$field] ?? '')) === '') {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
        }
        if (!$isadultstudent) {
            if ($parentname === '') {
                $fielderrors['parent_name'] = 'Parent/guardian name is required for students under 18.';
            }
            if ($parentrelationship === '') {
                $fielderrors['parent_relationship'] = 'Relationship to student is required for students under 18.';
            }
            if ($parentcontact === '') {
                $fielderrors['parent_email'] = 'Parent/guardian email, phone, or WhatsApp is required for students under 18.';
            }
        } else if ($studentemail === '') {
            $fielderrors['student_email'] = 'Adult students must have their own email address or phone number when no parent/guardian is linked.';
        }
        if ($parentrelationship !== '' && !array_key_exists($parentrelationship, $pqsioptions['parent_relationships'] ?? [])) {
            $fielderrors['parent_relationship'] = 'Select a valid relationship to the student.';
        }
        if ($parentrelationship === 'other' && $parentrelationshipother === '') {
            $fielderrors['parent_relationship_other'] = 'Describe the relationship to the student.';
        }

        $data = [
            'student_display_name' => $displayname,
            'student_middle_name' => $middlename,
            'student_access_type' => $form['student_access_type'],
            'date_of_birth' => $form['date_of_birth'],
            'age_years' => max(0, min(99, $ageyears)),
            'gender' => $form['gender'],
            'special_needs' => $form['special_needs'],
            'current_grade' => $form['current_grade'],
            'school_curriculum' => $form['school_curriculum'],
            'current_school_name' => $form['current_school_name'],
            'student_lives_with' => $form['student_lives_with'],
            'primary_learning_goal' => $form['primary_learning_goal'],
            'medical_safety_notes' => $form['medical_safety_notes'],
            'preferred_class_format' => $form['preferred_class_format'],
            'preferred_group_size' => $form['preferred_group_size'],
            'preferred_teacher_gender' => $form['preferred_teacher_gender'],
            'school_term' => $form['school_term'],
            'islamic_program_interest' => $form['islamic_program_interest'],
            'quran_reading_level' => $form['quran_reading_level'],
            'tajweed_level' => $form['tajweed_level'],
            'memorization_status' => $form['memorization_status'],
            'memorized_portion' => $form['memorized_portion'],
            'arabic_reading_ability' => $form['arabic_reading_ability'],
            'prior_islamic_studies' => $form['prior_islamic_studies'],
            'islamic_learning_goal' => $form['islamic_learning_goal'],
            'previous_learning_method' => $form['previous_learning_method'],
            'tafsir_level' => $form['tafsir_level'],
            'islamic_notes' => $form['islamic_notes'],
            'christian_program_interest' => $form['christian_program_interest'],
            'bible_reading_level' => $form['bible_reading_level'],
            'bible_knowledge_level' => $form['bible_knowledge_level'],
            'christian_studies_level' => $form['christian_studies_level'],
            'prior_christian_studies' => $form['prior_christian_studies'],
            'christian_previous_learning_method' => $form['christian_previous_learning_method'],
            'christian_learning_goal' => $form['christian_learning_goal'],
            'christian_notes' => $form['christian_notes'],
            'higher_application_level' => $form['higher_application_level'],
            'higher_program_field' => $form['higher_program_field'],
            'higher_specialization' => $form['higher_specialization'],
            'higher_highest_qualification' => $form['higher_highest_qualification'],
            'higher_previous_institution' => $form['higher_previous_institution'],
            'higher_qualification_title' => $form['higher_qualification_title'],
            'higher_completion_year' => $form['higher_completion_year'],
            'higher_academic_result' => $form['higher_academic_result'],
            'higher_academic_status' => $form['higher_academic_status'],
            'higher_admission_route' => $form['higher_admission_route'],
            'higher_transfer_credits' => $form['higher_transfer_credits'],
            'higher_study_mode' => $form['higher_study_mode'],
            'higher_study_load' => $form['higher_study_load'],
            'higher_preferred_intake' => $form['higher_preferred_intake'],
            'higher_research_interest' => $form['higher_research_interest'],
            'higher_funding_method' => $form['higher_funding_method'],
            'higher_financial_aid_interest' => $form['higher_financial_aid_interest'],
            'higher_support_needs' => $form['higher_support_needs'],
            'technical_program' => $form['technical_program'],
            'technical_specialization' => $form['technical_specialization'],
            'technical_training_level' => $form['technical_training_level'],
            'technical_previous_experience' => $form['technical_previous_experience'],
            'technical_previous_learning_method' => $form['technical_previous_learning_method'],
            'technical_experience_duration' => $form['technical_experience_duration'],
            'technical_employment_status' => $form['technical_employment_status'],
            'technical_employer_workshop' => $form['technical_employer_workshop'],
            'technical_training_goal' => $form['technical_training_goal'],
            'technical_certification_sought' => $form['technical_certification_sought'],
            'technical_training_format' => $form['technical_training_format'],
            'technical_training_schedule' => $form['technical_training_schedule'],
            'technical_tools_experience' => $form['technical_tools_experience'],
            'technical_tool_access' => $form['technical_tool_access'],
            'technical_digital_skill_level' => $form['technical_digital_skill_level'],
            'technical_safety_training' => $form['technical_safety_training'],
            'technical_protective_equipment' => $form['technical_protective_equipment'],
            'technical_support_needs' => $form['technical_support_needs'],
            'technical_notes' => $form['technical_notes'],
            'professional_area' => $form['professional_area'],
            'professional_topic_skill' => $form['professional_topic_skill'],
            'professional_current_role' => $form['professional_current_role'],
            'professional_industry' => $form['professional_industry'],
            'professional_employment_status' => $form['professional_employment_status'],
            'professional_employer' => $form['professional_employer'],
            'professional_experience_years' => $form['professional_experience_years'],
            'professional_responsibility_level' => $form['professional_responsibility_level'],
            'professional_development_goal' => $form['professional_development_goal'],
            'professional_skill_level' => $form['professional_skill_level'],
            'professional_credential_sought' => $form['professional_credential_sought'],
            'professional_certification_deadline' => $form['professional_certification_deadline'],
            'professional_learning_format' => $form['professional_learning_format'],
            'professional_learning_schedule' => $form['professional_learning_schedule'],
            'professional_course_intensity' => $form['professional_course_intensity'],
            'professional_employer_sponsored' => $form['professional_employer_sponsored'],
            'professional_cpd_required' => $form['professional_cpd_required'],
            'professional_cpd_credits' => $form['professional_cpd_credits'],
            'professional_workplace_outcome' => $form['professional_workplace_outcome'],
            'professional_support_needs' => $form['professional_support_needs'],
            'professional_notes' => $form['professional_notes'],
            'adult_learning_area' => $form['adult_learning_area'],
            'adult_subject_skill' => $form['adult_subject_skill'],
            'adult_education_level' => $form['adult_education_level'],
            'adult_literacy_level' => $form['adult_literacy_level'],
            'adult_numeracy_level' => $form['adult_numeracy_level'],
            'adult_digital_skill_level' => $form['adult_digital_skill_level'],
            'adult_previous_experience' => $form['adult_previous_experience'],
            'adult_previous_learning_method' => $form['adult_previous_learning_method'],
            'adult_learning_goal' => $form['adult_learning_goal'],
            'adult_employment_status' => $form['adult_employment_status'],
            'adult_learning_format' => $form['adult_learning_format'],
            'adult_learning_pace' => $form['adult_learning_pace'],
            'adult_class_arrangement' => $form['adult_class_arrangement'],
            'adult_childcare_impact' => $form['adult_childcare_impact'],
            'adult_work_impact' => $form['adult_work_impact'],
            'adult_access_limitations' => $form['adult_access_limitations'],
            'adult_learning_confidence' => $form['adult_learning_confidence'],
            'adult_support_needs' => $form['adult_support_needs'],
            'adult_notes' => $form['adult_notes'],
            'course_type' => $form['course_type'],
            'country' => $country,
            'city' => $savedcity,
            'timezone' => $timezone,
            'primary_language' => $form['primary_language'],
            'preferred_teaching_language' => $form['preferred_teaching_language'],
            'other_languages' => implode(', ', pqsi_labels($form['other_languages'], $pqsioptions['other_languages'] ?? [])),
            'current_level' => $form['current_level'],
            'tajweed_sub_level' => $form['tajweed_sub_level'],
            'learning_base' => $form['learning_base'],
            'availability' => $availabilityforsave,
            'parent_name' => $parentname,
            'parent_relationship' => $parentrelationship,
            'parent_relationship_other' => $parentrelationshipother,
            'parent_email' => $parentcontact,
            'parent_email_enabled' => (int)$form['parent_email_enabled'],
            'parent_phone' => $parentphone !== '' ? $parentphone : (!pqsi_contact_is_email($parentcontact) ? $parentcontact : ''),
            'emergency_contact_name' => $emergencycontactname,
            'emergency_contact_phone' => $emergencycontactphone,
            'parent_preferences' => $form['parent_preferences'],
            'live_class_consent' => (int)$form['live_class_consent'],
            'recording_consent' => (int)$form['recording_consent'],
            'consent_notes' => $form['consent_notes'],
            'workspaceid' => $workspaceid,
        ];
        if ((int)$data['live_class_consent'] !== 1) {
            $fielderrors['live_class_consent'] = 'Live class consent is required before creating the student intake record.';
        }
        foreach ([
            'course_type' => 'Course is required.',
            'country' => 'Country is required.',
            'city' => 'City is required.',
            'timezone' => 'Time zone is required.',
            'primary_language' => 'Primary language is required.',
            'preferred_teaching_language' => 'Preferred teaching language is required.',
            'current_level' => 'Placement level is required.',
            'learning_base' => 'Learning background is required.',
        ] as $field => $fieldmessage) {
            if (($field === 'age_years' && (int)$data['age_years'] <= 0) || ($field !== 'age_years' && trim((string)$data[$field]) === '')) {
                $fielderrors[$field] = $fieldmessage;
            }
        }
        if (($pqsiisprimaryeducation || (string)$data['special_needs'] !== '') && !in_array((string)$data['special_needs'], ['yes', 'no'], true)) {
            $fielderrors['special_needs'] = 'Special Needs must be Yes or No.';
        }
        if (!array_key_exists((string)$data['student_access_type'], $pqsioptions['student_access_types'] ?? [])) {
            $fielderrors['student_access_type'] = 'Select Managed Student or Unmanaged Student.';
        }
        if (!array_key_exists((string)$data['course_type'], $pqsioptions['course_types'] ?? [])) {
            $fielderrors['course_type'] = 'Select a valid course.';
        }
        if (!array_key_exists((string)$data['current_level'], $pqsioptions['current_levels'] ?? [])) {
            $fielderrors['current_level'] = 'Select a valid placement level.';
        }
        if ((string)$data['current_level'] === 'level_3' && !array_key_exists((string)$data['tajweed_sub_level'], $pqsioptions['tajweed_sub_levels'] ?? [])) {
            $fielderrors['tajweed_sub_level'] = 'Select Beginner, Middle, or Advanced for Level 3.';
        }
        if (!array_key_exists((string)$data['preferred_teaching_language'], $pqsioptions['primary_languages'] ?? [])) {
            $fielderrors['preferred_teaching_language'] = 'Select a valid preferred teaching language.';
        }
        foreach ([
            'current_grade' => 'primary_grade_levels',
            'school_curriculum' => 'primary_curricula',
            'student_lives_with' => 'student_lives_with_options',
            'preferred_class_format' => 'primary_class_formats',
            'preferred_group_size' => 'primary_group_sizes',
            'preferred_teacher_gender' => 'teacher_gender_preferences',
        ] as $field => $optionkey) {
            if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                $fielderrors[$field] = 'Select a valid option.';
            }
        }
        if ($pqsiisislamicstudies) {
            foreach ([
                'islamic_program_interest' => 'islamic_program_interests',
                'quran_reading_level' => 'quran_reading_levels',
                'tajweed_level' => 'tajweed_levels',
                'memorization_status' => 'memorization_statuses',
                'arabic_reading_ability' => 'arabic_reading_abilities',
                'previous_learning_method' => 'previous_learning_methods',
                'tafsir_level' => 'tafsir_levels',
            ] as $field => $optionkey) {
                if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
        }
        if ($pqsiischristianstudies) {
            foreach ([
                'christian_program_interest' => 'christian_program_interests',
                'bible_reading_level' => 'bible_reading_levels',
                'bible_knowledge_level' => 'bible_knowledge_levels',
                'christian_studies_level' => 'christian_studies_levels',
                'christian_previous_learning_method' => 'christian_previous_learning_methods',
            ] as $field => $optionkey) {
                if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
        }
        if ($pqsiishighereducation) {
            foreach ([
                'higher_application_level' => 'higher_application_levels',
                'higher_highest_qualification' => 'higher_qualification_levels',
                'higher_academic_status' => 'higher_academic_statuses',
                'higher_admission_route' => 'higher_admission_routes',
                'higher_transfer_credits' => 'higher_transfer_credit_options',
                'higher_study_mode' => 'higher_study_modes',
                'higher_study_load' => 'higher_study_loads',
                'higher_funding_method' => 'higher_funding_methods',
                'higher_financial_aid_interest' => 'higher_financial_aid_options',
            ] as $field => $optionkey) {
                if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
        }
        if ($pqsiistechnicaltraining) {
            foreach ([
                'technical_program' => 'technical_programs',
                'technical_training_level' => 'technical_training_levels',
                'technical_previous_experience' => 'technical_experience_types',
                'technical_previous_learning_method' => 'technical_learning_methods',
                'technical_experience_duration' => 'technical_experience_durations',
                'technical_employment_status' => 'technical_employment_statuses',
                'technical_training_goal' => 'technical_training_goals',
                'technical_training_format' => 'technical_training_formats',
                'technical_training_schedule' => 'technical_training_schedules',
                'technical_tool_access' => 'technical_tool_access_options',
                'technical_digital_skill_level' => 'technical_digital_skill_levels',
                'technical_safety_training' => 'technical_yes_no_unsure',
                'technical_protective_equipment' => 'technical_protective_equipment_options',
            ] as $field => $optionkey) {
                if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
        }
        if ($pqsiisprofessionaldevelopment) {
            foreach ([
                'professional_area' => 'professional_development_areas',
                'professional_industry' => 'professional_industries',
                'professional_employment_status' => 'professional_employment_statuses',
                'professional_experience_years' => 'professional_experience_ranges',
                'professional_responsibility_level' => 'professional_responsibility_levels',
                'professional_development_goal' => 'professional_development_goals',
                'professional_skill_level' => 'professional_skill_levels',
                'professional_learning_format' => 'professional_learning_formats',
                'professional_learning_schedule' => 'professional_learning_schedules',
                'professional_course_intensity' => 'professional_course_intensities',
                'professional_employer_sponsored' => 'professional_sponsorship_options',
                'professional_cpd_required' => 'professional_cpd_options',
            ] as $field => $optionkey) {
                if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
        }
        if ($pqsiisadultlearning) {
            foreach ([
                'adult_learning_area' => 'adult_learning_areas',
                'adult_education_level' => 'adult_education_levels',
                'adult_literacy_level' => 'adult_literacy_levels',
                'adult_numeracy_level' => 'adult_numeracy_levels',
                'adult_digital_skill_level' => 'adult_digital_skill_levels',
                'adult_previous_experience' => 'adult_previous_experiences',
                'adult_previous_learning_method' => 'adult_learning_methods',
                'adult_learning_goal' => 'adult_learning_goals',
                'adult_employment_status' => 'adult_employment_statuses',
                'adult_learning_format' => 'adult_learning_formats',
                'adult_learning_pace' => 'adult_learning_paces',
                'adult_class_arrangement' => 'adult_class_arrangements',
                'adult_childcare_impact' => 'adult_childcare_options',
                'adult_work_impact' => 'adult_attendance_impact_options',
                'adult_access_limitations' => 'adult_access_limitations',
                'adult_learning_confidence' => 'adult_learning_confidence_levels',
            ] as $field => $optionkey) {
                if ((string)$data[$field] !== '' && !array_key_exists((string)$data[$field], $pqsioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
        }
        if (!array_key_exists((string)$form['session_count'], $pqsioptions['session_counts'] ?? [])) {
            $fielderrors['session_count'] = 'Select a valid number of sessions.';
        }
        if (!$form['slots']) {
            $fielderrors['slots'] = 'Select at least one weekly time that could work.';
        } else if (count($form['slots']) < (int)$form['session_count']) {
            $fielderrors['slots'] = 'Select at least as many weekly time options as the requested number of sessions.';
        }
        $countryzones = $pqsioptions['country_timezones'][$country] ?? [];
        if ($timezone !== '' && $countryzones && !in_array($timezone, array_map('strval', $countryzones), true)) {
            $fielderrors['timezone'] = 'Select a time zone for the selected country.';
        }
        if ($city === 'Other' && $cityother === '') {
            $fielderrors['city_other'] = 'Enter the city name.';
        }
        $referrer = null;
        if ($referrercode !== '') {
            if (strlen($referrercode) !== 5) {
                $fielderrors['referrer_code'] = 'Enter the five-digit referrer code.';
            } else {
                $referrer = pqsi_find_referrer_by_code($referrercode);
                if (!$referrer) {
                    $fielderrors['referrer_code'] = 'No active referrer was found for this code.';
                } else {
                    foreach ([
                        'referrer_name' => (string)($referrer->name ?? ''),
                        'referrer_contact_number' => (string)($referrer->phone ?? ($referrer->contact ?? '')),
                        'referrer_email' => (string)($referrer->email ?? ''),
                        'referrer_city' => (string)($referrer->city ?? ''),
                        'referrer_state' => (string)($referrer->state ?? ''),
                        'referrer_country' => (string)($referrer->country ?? ''),
                    ] as $referrerfield => $referrervalue) {
                        if (trim((string)$form[$referrerfield]) === '' && trim($referrervalue) !== '') {
                            $form[$referrerfield] = $referrervalue;
                        }
                    }
                }
            }
        }
        if (!in_array((string)$form['referral_status'], ['pending', 'contacted', 'enrolled', 'approved'], true)) {
            $fielderrors['referral_status'] = 'Select a valid referral status.';
        }
        if ($fielderrors) {
            throw new InvalidArgumentException('__validation__');
        }

        if ($existingstudentid <= 0) {
            $studentduplicateemail = $studentemail !== '' ? pqsi_moodle_email_from_contact($studentemail, 'student') : '';
            $duplicate = pqsi_find_duplicate_profile($displayname, $parentcontact, $studentduplicateemail);
            if ($duplicate) {
                $duplicateaccount = pqh_account_no_label((int)$duplicate->userid);
                if (($duplicate->duplicate_reason ?? '') === 'student_email') {
                    $fielderrors['student_email'] = 'This student email or phone is already used by an existing intake profile. ' . $duplicateaccount . ', existing Moodle student ID: ' . (int)$duplicate->userid . '. Use Existing Moodle student ID to update that profile instead of creating a duplicate.';
                } else {
                    $fielderrors['student_display_name'] = 'A student intake profile already exists with this display name and parent contact. ' . $duplicateaccount . ', existing Moodle student ID: ' . (int)$duplicate->userid . '. Use Existing Moodle student ID to update that profile instead of creating a duplicate.';
                    $fielderrors['parent_email'] = 'This exact student display name + parent contact already exists.';
                }
                throw new InvalidArgumentException('__validation__');
            }
        }

        $transaction = $DB->start_delegated_transaction();

        $studentusername = '';
        $studentpassword = '';
        $studentaccountid = '';
        if ($existingstudentid > 0) {
            $studentuser = pqsi_existing_user($existingstudentid);
            $studentid = (int)$studentuser->id;
            $studentusername = (string)$studentuser->username;
            if ($displayname === '') {
                $displayname = fullname($studentuser);
                $data['student_display_name'] = $displayname;
            }
        } else {
            $studentusername = pqsi_unique_username(optional_param('student_username', '', PARAM_USERNAME) ?: 'student.' . $firstname . '.' . $lastname);
            $studentmoodleemail = $studentemail !== '' ? pqsi_moodle_email_from_contact($studentemail, 'student') : $studentusername . '@eduplatform.local';

            [$studentid, $studentpassword] = pqsi_create_user($firstname, $lastname, $studentmoodleemail, $studentusername, true);
        }
        $studentaccountid = pqh_assign_account_id($studentid, 'student');

        $studentuser = core_user::get_user($studentid);
        if ($studentuser) {
            if (core_text::strlen($country) <= 2) {
                $studentuser->country = core_text::strtoupper($country);
            }
            $studentuser->city = $savedcity;
            $studentuser->timezone = $timezone;
            user_update_user($studentuser, false, false);
        }

        $parentid = 0;
        $parentpassword = '';
        $parentcreated = false;
        $parentaccountid = '';
        if ($parentcontact !== '') {
            $parentmoodleemail = pqsi_moodle_email_from_contact($parentcontact, 'parent');
            $parentuser = pqsi_find_user_by_email($parentmoodleemail);
            if (!$parentuser && pqsi_contact_is_email($parentcontact)) {
                $parentuser = pqsi_find_user_by_email($parentcontact);
            }
            if ($parentuser) {
                $parentid = (int)$parentuser->id;
            } else {
                $parts = preg_split('/\s+/', trim($parentname));
                $parentfirst = $parts && isset($parts[0]) && $parts[0] !== '' ? $parts[0] : 'Parent';
                $parentlast = $parts && count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Guardian';
                $parentusername = pqsi_unique_username(optional_param('parent_username', '', PARAM_USERNAME) ?: $parentcontact);
                [$parentid, $parentpassword] = pqsi_create_user($parentfirst, $parentlast, $parentmoodleemail, $parentusername, false);
                $parentcreated = true;
            }
            $parentaccountid = pqh_assign_account_id($parentid, 'parent');
        }

        $enrollmentapproved = $parentid <= 0 || pqsi_enrollment_already_approved($studentid, $parentid);
        $data['enrollment_approval_status'] = $enrollmentapproved ? 'approved' : 'pending_parent';
        $data['enrollment_approvedby'] = $enrollmentapproved && $parentid > 0 ? $parentid : 0;
        $data['enrollment_approvedat'] = $enrollmentapproved ? time() : 0;
        $data['enrollment_approval_notes'] = $enrollmentapproved
            ? 'No parent approval required, or enrollment was already approved.'
            : 'Parent or guardian approval is required before the student can start lessons.';

        $profileid = pqsi_save_profile($studentid, $data);
        $deferindependentmembership = $pqsiisindependentteacher && !$pqsiisoperationsuser;
        if ($workspaceid > 0 && !$deferindependentmembership) {
            pqsi_upsert_workspace_member($workspaceid, $studentid, 'student', 'Added from student intake.');
            if ($parentid > 0) {
                pqsi_upsert_workspace_member($workspaceid, $parentid, 'parent', 'Linked as parent/guardian from student intake.');
            }
        }
        $referralid = pqsi_upsert_referral($studentid, $referrer, $form);
        pqsi_upsert_comm_consent($studentid, $parentid);
        pqsi_upsert_live_consent($studentid, $parentid, 'live_session', (int)$data['live_class_consent'], (string)$data['consent_notes']);
        pqsi_upsert_live_consent($studentid, $parentid, 'recording', (int)$data['recording_consent'], (string)$data['consent_notes']);
        if (!$enrollmentapproved) {
            pqsi_upsert_live_consent(
                $studentid,
                $parentid,
                'enrollment_approval',
                0,
                'Pending parent or guardian approval. Student lessons remain locked until this approval is granted.'
            );
        }
        pqsi_upsert_live_consent(
            $studentid,
            $parentid,
            'audio_recording_policy',
            1,
            'Audio is always recorded for safeguarding, class quality, lesson review, parent/teacher review, and quiz/learning support. ' . (string)$data['consent_notes']
        );
        $approvalurl = $parentid > 0 ? (new moodle_url('/local/hubredirect/enrollment_approval.php', ['studentid' => $studentid]))->out(false) : '';
        $parentemailsent = false;
        $parentemailattempted = $parentid > 0 && !empty($data['parent_email_enabled']) && pqsi_contact_is_email($parentcontact);
        pqsi_audit('student_intake_created', 'student', $studentid, [
            'profileid' => $profileid,
            'parentid' => $parentid,
            'parent_created' => $parentcreated ? 1 : 0,
            'parent_email_attempted' => $parentemailattempted ? 1 : 0,
            'parent_email_sent' => $parentemailsent ? 1 : 0,
            'existing_student' => $existingstudentid > 0 ? 1 : 0,
            'requestid' => $requestid,
            'student_account_id' => $studentaccountid,
            'parent_account_id' => $parentaccountid,
            'enrollment_approval_status' => $data['enrollment_approval_status'],
            'referrerid' => $referrer ? (int)$referrer->id : 0,
            'referralid' => $referralid,
            'referrer_code' => $referrercode,
            'workspaceid' => $workspaceid,
        ]);

        if ($requestid > 0 && pqsi_table_exists('local_prequran_intake_request')) {
            $request = $DB->get_record('local_prequran_intake_request', ['id' => $requestid], '*', IGNORE_MISSING);
            if ($request) {
                $preferredteacherid = pqsi_preferred_teacherid_from_text((string)($request->parent_preferences ?? '') . "\n" . (string)($request->admin_notes ?? ''));
                $request->status = 'transferred';
                $request->transferred_userid = $studentid;
                $request->transferred_profileid = $profileid;
                $request->reviewedby = (int)$USER->id;
                $request->reviewedat = time();
                $request->timemodified = time();
                $DB->update_record('local_prequran_intake_request', $request);
                $teacherrequestid = 0;
                if ($preferredteacherid > 0) {
                    $teacherrequestid = pqsi_upsert_teacher_marketplace_request(
                        $preferredteacherid,
                        $parentid,
                        $studentid,
                        pqsi_consumerid_for_intake_request($request),
                        'Public intake request #' . $requestid . '.'
                    );
                    if ($teacherrequestid > 0) {
                        $request->admin_notes = trim((string)($request->admin_notes ?? '')) . "\nMarketplace teacher request #" . $teacherrequestid . ' created for preferred teacher Moodle ID ' . $preferredteacherid . '.';
                        $request->timemodified = time();
                        $DB->update_record('local_prequran_intake_request', $request);
                    }
                }
                $createdteacherrequestid = $teacherrequestid;
                pqsi_audit('student_intake_request_transferred', 'intake_request', $requestid, [
                    'studentid' => $studentid,
                    'profileid' => $profileid,
                    'parentid' => $parentid,
                    'workspaceid' => pqsi_workspaceid_for_intake_request($request),
                    'preferredteacherid' => $preferredteacherid,
                    'teacherrequestid' => $teacherrequestid,
                ]);
            }
        }

        if ($pqsiisindependentteacher && !$pqsiisoperationsuser && empty($createdteacherrequestid)) {
            $createdteacherrequestid = pqsi_upsert_teacher_marketplace_request(
                (int)$USER->id,
                $parentid,
                $studentid,
                (int)($pqsiconsumercontext->consumerid ?? 0),
                'New learner invited from independent teacher workspace #' . $workspaceid . '.'
            );
            pqsi_audit('independent_teacher_student_connection_requested', 'teacher_request', $createdteacherrequestid, [
                'teacherid' => (int)$USER->id,
                'studentid' => $studentid,
                'parentid' => $parentid,
                'workspaceid' => $workspaceid,
            ]);
        }

        $transaction->allow_commit();
        $transaction = null;

        if ($parentemailattempted) {
            $parentuser = core_user::get_user($parentid, '*', IGNORE_MISSING);
            $studentuserforemail = core_user::get_user($studentid, '*', IGNORE_MISSING);
            if ($parentuser && $studentuserforemail) {
                $parentemailsent = pqsi_send_parent_intake_email($parentuser, $studentuserforemail, $approvalurl, $parentcreated);
            }
            pqsi_audit('student_intake_parent_email', 'student', $studentid, [
                'parentid' => $parentid,
                'parent_email_sent' => $parentemailsent ? 1 : 0,
            ]);
        }

        $created = [
            'studentid' => $studentid,
            'studentusername' => $studentusername,
            'studentaccountid' => $studentaccountid,
            'studentpassword' => $studentpassword,
            'existingstudent' => $existingstudentid > 0,
            'parentid' => $parentid,
            'parentaccountid' => $parentaccountid,
            'parentcreated' => $parentcreated,
            'parentpassword' => $parentpassword,
            'enrollmentapprovalstatus' => $data['enrollment_approval_status'],
            'approvalurl' => $approvalurl,
            'parentemailattempted' => $parentemailattempted,
            'parentemailsent' => $parentemailsent,
            'referrername' => $referrer ? (trim((string)($form['referrer_name'] ?? '')) !== '' ? (string)$form['referrer_name'] : (string)$referrer->name) : '',
            'referrercode' => $referrercode,
            'referralid' => $referralid,
            'teacherrequestid' => $createdteacherrequestid ?? 0,
            'workspaceid' => $workspaceid,
        ];
        $SESSION->pqsi_created = $created;
        $redirectparams = ['created' => 1];
        if ($workspaceid > 0) {
            $redirectparams['workspaceid'] = $workspaceid;
        }
        redirect(new moodle_url('/local/hubredirect/student_intake.php', $redirectparams));
    } catch (Throwable $e) {
        if ($transaction) {
            try {
                $transaction->rollback($e);
            } catch (Throwable $rollbackerror) {
                $e = $rollbackerror;
            }
        }
        $error = $e->getMessage() === '__validation__'
            ? 'Please fix the highlighted fields below.'
            : 'Student intake did not complete: ' . $e->getMessage();
    }
}

$formcity = pqsi_form_value($form, 'city');
if ($formcity !== '' && $formcity !== 'Other') {
    $countrycities = $pqsioptions['country_cities'][pqsi_form_value($form, 'country')] ?? [];
    if ($countrycities && !array_key_exists($formcity, $countrycities)) {
        $form['city'] = 'Other';
        $form['city_other'] = $formcity;
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-student-intake-page header,body.pqh-student-intake-page footer,body.pqh-student-intake-page nav.navbar,body.pqh-student-intake-page #page-header,body.pqh-student-intake-page #page-footer,body.pqh-student-intake-page .drawer,body.pqh-student-intake-page .drawer-toggles,body.pqh-student-intake-page .block-region,body.pqh-student-intake-page [data-region="drawer"],body.pqh-student-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-student-intake-page #page,body.pqh-student-intake-page #page-content,body.pqh-student-intake-page #region-main,body.pqh-student-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqsi-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqsi-wrap{max-width:1120px;margin:0 auto}.pqsi-top,.pqsi-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqsi-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqsi-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqsi-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqsi-muted{color:#5e7280;font-size:12px}
.pqsi-actions{display:flex;flex-wrap:wrap;gap:9px}.pqsi-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqsi-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqsi-btn--brown{background:#7a5637}
.pqsi-panel{padding:20px;margin-bottom:16px}.pqsi-panel h2{margin:0 0 12px;font-size:22px;font-weight:950}.pqsi-panel h3{margin:18px 0 10px;font-size:15px;font-weight:950;color:#7a5637}.pqsi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pqsi-field{display:grid;gap:6px;margin-bottom:10px;align-content:start;align-self:start}.pqsi-field label{font-size:12px;font-weight:900;color:#415665}.pqsi-city-other{display:none}.pqsi-city-other--visible{display:grid}.pqsi-input,.pqsi-select,.pqsi-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}.pqsi-select--multi{min-height:124px}.pqsi-field--error .pqsi-input,.pqsi-field--error .pqsi-select,.pqsi-field--error .pqsi-textarea,.pqsi-field--error .pqsi-choicegrid,.pqsi-field--error .pqsi-calendar{border-color:#a33a2c;background:#fff8f6}.pqsi-error{font-size:12px;font-weight:900;color:#a33a2c}.pqsi-textarea{min-height:86px}.pqsi-checkrow{display:flex;gap:10px;align-items:flex-start;margin:8px 0 12px;color:#173044;font-size:13px;font-weight:900}.pqsi-checkrow input{width:18px;height:18px;margin-top:1px}.pqsi-checkrow--error{color:#a33a2c}.pqsi-choicegrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fff}.pqsi-choice{display:flex;gap:7px;align-items:center;font-size:13px;font-weight:850;color:#173044}.pqsi-choice input{width:17px;height:17px}.pqsi-field--full{grid-column:1/-1}.pqsi-section-pill{display:inline-flex;align-items:center;padding:8px 14px;border:1px solid #f2cda8;border-radius:999px;background:#fff5ea;color:#8a4518;font-weight:950}.pqsi-calendar{overflow:auto;border:2px solid #d9e7f7;border-radius:16px;background:#fff}.pqsi-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}.pqsi-calendar th,.pqsi-calendar td{border-right:1px solid #e0ebf3;border-bottom:1px solid #e0ebf3;padding:12px;text-align:center;vertical-align:middle}.pqsi-calendar th{background:#eaf7fb;color:#213747;font-weight:950}.pqsi-calendar td:first-child{font-weight:950;text-align:left;background:#fbfaf5;color:#122638}.pqsi-slot{display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border:1px solid #cfe1f5;border-radius:12px;background:#eef7ff}.pqsi-slot input{width:22px;height:22px}
.pqsi-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqsi-alert--ok{background:#edf9ef;color:#245c35}.pqsi-alert--bad{background:#fff0ed;color:#883526}.pqsi-errorlist{margin:8px 0 0;padding-left:20px}.pqsi-errorlist a{color:#883526!important;text-decoration:underline}.pqsi-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqsi-result{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqsi-result div{padding:12px;border-radius:8px;background:#f8fbfd;border:1px solid rgba(23,48,68,.1);font-weight:850}.pqsi-result strong{display:block;color:#7a5637;margin-bottom:4px}.pqsi-level-guide{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:2px 0 12px}.pqsi-level-card{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfaf5}.pqsi-level-card strong{display:block;margin-bottom:6px;color:#241b24;font-size:13px}.pqsi-level-card p{margin:4px 0;color:#5e7280;font-size:12px;font-weight:750;line-height:1.35}
@media(max-width:760px){.pqsi-top{display:block}.pqsi-actions{margin-top:12px}.pqsi-grid,.pqsi-result,.pqsi-choicegrid,.pqsi-level-guide{grid-template-columns:1fr}.pqsi-calendar table{min-width:820px}.pqsi-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqsi-shell">
  <div class="pqsi-wrap">
    <section class="pqsi-top pqh-workspace-top">
      <div>
        <h1 class="pqsi-title pqh-workspace-title">Student Intake</h1>
        <p class="pqsi-sub pqh-workspace-sub">Create a Moodle student account, link a parent when needed, capture consent, and prepare the student for grouping.</p>
      </div>
      <div class="pqsi-actions pqh-workspace-actions">
        <a class="pqsi-btn pqsi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/intake_requests.php'))->out(false); ?>">Public requests</a>
        <a class="pqsi-btn pqsi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_grouping.php'))->out(false); ?>">Student grouping</a>
        <a class="pqsi-btn pqsi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <a class="pqsi-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqsi-alert pqsi-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?>
      <div class="pqsi-alert pqsi-alert--bad">
        <?php echo s($error); ?>
        <?php if ($fielderrors): ?>
          <ul class="pqsi-errorlist">
            <?php foreach ($fielderrors as $fieldname => $fieldmessage): ?>
              <li><a href="#pqsi-<?php echo s($fieldname); ?>"><strong><?php echo s(pqsi_field_label((string)$fieldname)); ?>:</strong> <?php echo s($fieldmessage); ?></a></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
    <?php endif; ?>
    <?php if (!$ready): ?>
      <section class="pqsi-panel"><div class="pqsi-empty">Student profile table is not ready. Run the Moodle plugin upgrade for local_prequran first.</div></section>
    <?php else: ?>
      <?php if ($created): ?>
        <section class="pqsi-panel">
          <h2>Created Accounts</h2>
          <div class="pqsi-result">
            <div><strong>Student</strong>ID <?php echo s((string)($created['studentaccountid'] ?? '')); ?><br>Moodle user ID: <?php echo (int)$created['studentid']; ?><br>Username: <?php echo s($created['studentusername']); ?><?php if (empty($created['existingstudent'])): ?><br>Temporary password: <?php echo s($created['studentpassword']); ?><?php else: ?><br>Existing Moodle account linked.<?php endif; ?></div>
            <div><strong>Parent/guardian</strong><?php if (!empty($created['parentid'])): ?>ID <?php echo s((string)($created['parentaccountid'] ?? '')); ?><br>Moodle user ID: <?php echo (int)$created['parentid']; ?><br><?php echo !empty($created['parentcreated']) ? 'Parent/guardian account created.' : 'Existing parent/guardian account linked.'; ?><?php if (!empty($created['parentpassword'])): ?><br>Temporary password: <?php echo s($created['parentpassword']); ?><?php endif; ?><br>Email: <?php echo !empty($created['parentemailattempted']) ? (!empty($created['parentemailsent']) ? 'sent' : 'attempted but not confirmed') : 'not sent'; ?><?php else: ?><br>Not required for this adult student.<?php endif; ?></div>
            <div><strong>Referrer</strong><?php if (!empty($created['referralid'])): ?><?php echo s((string)($created['referrername'] ?? '')); ?><br>Code: <?php echo s((string)($created['referrercode'] ?? '')); ?><br>Referral ID: <?php echo (int)$created['referralid']; ?><?php else: ?>No referrer linked.<?php endif; ?></div>
            <?php if (!empty($created['workspaceid'])): ?><div><strong>Workspace</strong>Linked to workspace ID <?php echo (int)$created['workspaceid']; ?>.<br>Student and parent membership rows were created or reactivated.</div><?php endif; ?>
          </div>
          <?php if (!empty($created['approvalurl'])): ?>
            <div class="pqsi-empty" style="margin-top:12px">
              Parent approval status: <strong><?php echo s((string)($created['enrollmentapprovalstatus'] ?? 'pending_parent')); ?></strong><br>
              Parent approval link: <a href="<?php echo s((string)$created['approvalurl']); ?>"><?php echo s((string)$created['approvalurl']); ?></a>
            </div>
          <?php endif; ?>
          <?php if (!empty($created['teacherrequestid'])): ?>
            <div class="pqsi-empty" style="margin-top:12px">
              Marketplace teacher request created: <strong>#<?php echo (int)$created['teacherrequestid']; ?></strong><br>
              <a href="<?php echo pqh_consumer_url('/local/hubredirect/teacher_marketplace_admin.php', $pqsiconsumercontext)->out(false); ?>">Open marketplace request queue</a>
            </div>
          <?php endif; ?>
        </section>
      <?php endif; ?>

      <section class="pqsi-panel">
        <h2>Recommended Required Minimum</h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="requestid" value="<?php echo s(pqsi_form_value($form, 'requestid')); ?>">
          <input type="hidden" name="workspaceid" value="<?php echo s(pqsi_form_value($form, 'workspaceid')); ?>">

          <h3>Core student information</h3>
          <h3>Student account</h3>
          <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'existing_studentid'); ?>" id="pqsi-existing_studentid"><label>Existing Moodle student ID</label><input class="pqsi-input" name="existing_studentid" type="number" min="0" value="<?php echo s(pqsi_form_value($form, 'existing_studentid')); ?>" placeholder="Optional: use only to add an intake profile to an already-created student"><?php echo pqsi_form_error($fielderrors, 'existing_studentid'); ?></div>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_firstname'); ?>" id="pqsi-student_firstname"><label>First name</label><input class="pqsi-input" name="student_firstname" value="<?php echo s(pqsi_form_value($form, 'student_firstname')); ?>"><?php echo pqsi_form_error($fielderrors, 'student_firstname'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_middle_name'); ?>" id="pqsi-student_middle_name"><label>Middle name</label><input class="pqsi-input" name="student_middle_name" value="<?php echo s(pqsi_form_value($form, 'student_middle_name')); ?>" required><?php echo pqsi_form_error($fielderrors, 'student_middle_name'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_lastname'); ?>" id="pqsi-student_lastname"><label>Last name</label><input class="pqsi-input" name="student_lastname" value="<?php echo s(pqsi_form_value($form, 'student_lastname')); ?>"><?php echo pqsi_form_error($fielderrors, 'student_lastname'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_display_name'); ?>" id="pqsi-student_display_name"><label>Preferred name</label><input class="pqsi-input" name="student_display_name" value="<?php echo s(pqsi_form_value($form, 'student_display_name')); ?>" placeholder="Optional"><?php echo pqsi_form_error($fielderrors, 'student_display_name'); ?></div>
            <div class="pqsi-field" id="pqsi-student_username"><label>Username</label><input class="pqsi-input" name="student_username" value="<?php echo s(pqsi_form_value($form, 'student_username')); ?>" placeholder="Auto-generated if blank"></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_email'); ?>" id="pqsi-student_email"><label>Student email or phone</label><input class="pqsi-input" name="student_email" value="<?php echo s(pqsi_form_value($form, 'student_email')); ?>" placeholder="Optional for children; email or phone required for adults"><?php echo pqsi_form_error($fielderrors, 'student_email'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_access_type'); ?>" id="pqsi-student_access_type"><label>Student access type</label><?php echo pqsi_select('student_access_type', $pqsioptions['student_access_types'] ?? [], $form, $fielderrors); ?></div>
          </div>

          <?php if ($pqsiisprimaryeducation): ?>
            <h3>Primary education details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'date_of_birth'); ?>" id="pqsi-date_of_birth"><label>Date of birth</label><input class="pqsi-input" name="date_of_birth" type="date" value="<?php echo s(pqsi_form_value($form, 'date_of_birth')); ?>"><?php echo pqsi_form_error($fielderrors, 'date_of_birth'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'age_years'); ?>"><label>Age</label><input class="pqsi-input" name="age_years" type="number" min="0" max="99" value="<?php echo s(pqsi_form_value($form, 'age_years')); ?>"><?php echo pqsi_form_error($fielderrors, 'age_years'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'gender'); ?>"><label>Gender</label><select class="pqsi-select" name="gender"><option value="">Select</option><option value="female"<?php echo pqsi_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqsi_selected($form, 'gender', 'male'); ?>>Male</option></select><?php echo pqsi_form_error($fielderrors, 'gender'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'current_grade'); ?>" id="pqsi-current_grade"><label>Current grade/year</label><?php echo pqsi_select('current_grade', $pqsioptions['primary_grade_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'school_curriculum'); ?>" id="pqsi-school_curriculum"><label>School curriculum</label><?php echo pqsi_select('school_curriculum', $pqsioptions['primary_curricula'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'current_school_name'); ?>" id="pqsi-current_school_name"><label>Current school name</label><input class="pqsi-input" name="current_school_name" value="<?php echo s(pqsi_form_value($form, 'current_school_name')); ?>"><?php echo pqsi_form_error($fielderrors, 'current_school_name'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_lives_with'); ?>" id="pqsi-student_lives_with"><label>Student lives with</label><?php echo pqsi_select('student_lives_with', $pqsioptions['student_lives_with_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'primary_learning_goal'); ?>" id="pqsi-primary_learning_goal"><label>Primary learning goal</label><input class="pqsi-input" name="primary_learning_goal" value="<?php echo s(pqsi_form_value($form, 'primary_learning_goal')); ?>"><?php echo pqsi_form_error($fielderrors, 'primary_learning_goal'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'preferred_class_format'); ?>" id="pqsi-preferred_class_format"><label>Preferred class format</label><?php echo pqsi_select('preferred_class_format', $pqsioptions['primary_class_formats'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'preferred_group_size'); ?>" id="pqsi-preferred_group_size"><label>Preferred group size</label><?php echo pqsi_select('preferred_group_size', $pqsioptions['primary_group_sizes'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'preferred_teacher_gender'); ?>" id="pqsi-preferred_teacher_gender"><label>Preferred teacher gender</label><?php echo pqsi_select('preferred_teacher_gender', $pqsioptions['teacher_gender_preferences'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'school_term'); ?>" id="pqsi-school_term"><label>School term/admission year</label><input class="pqsi-input" name="school_term" value="<?php echo s(pqsi_form_value($form, 'school_term')); ?>"><?php echo pqsi_form_error($fielderrors, 'school_term'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'special_needs'); ?>"><label>Special learning needs / accommodations</label><select class="pqsi-select" name="special_needs"><option value="">Select</option><option value="no"<?php echo pqsi_selected($form, 'special_needs', 'no'); ?>>No</option><option value="yes"<?php echo pqsi_selected($form, 'special_needs', 'yes'); ?>>Yes</option></select><?php echo pqsi_form_error($fielderrors, 'special_needs'); ?></div>
            </div>
            <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'medical_safety_notes'); ?>" id="pqsi-medical_safety_notes"><label>Medical/allergy/safety notes</label><textarea class="pqsi-textarea" name="medical_safety_notes"><?php echo s(pqsi_form_value($form, 'medical_safety_notes')); ?></textarea><?php echo pqsi_form_error($fielderrors, 'medical_safety_notes'); ?></div>
          <?php endif; ?>

          <?php if ($pqsiisadultlearning): ?>
            <h3>Adult learning details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'adult_learning_area'); ?>"><label>Learning area of interest</label><?php echo pqsi_select('adult_learning_area', $pqsioptions['adult_learning_areas'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Specific subject or skill</label><input class="pqsi-input" name="adult_subject_skill" value="<?php echo s(pqsi_form_value($form, 'adult_subject_skill')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'adult_education_level'); ?>"><label>Highest education level completed</label><?php echo pqsi_select('adult_education_level', $pqsioptions['adult_education_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Current literacy level</label><?php echo pqsi_select('adult_literacy_level', $pqsioptions['adult_literacy_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Current numeracy level</label><?php echo pqsi_select('adult_numeracy_level', $pqsioptions['adult_numeracy_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Digital skill level</label><?php echo pqsi_select('adult_digital_skill_level', $pqsioptions['adult_digital_skill_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Previous adult-learning experience</label><?php echo pqsi_select('adult_previous_experience', $pqsioptions['adult_previous_experiences'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Previous learning method</label><?php echo pqsi_select('adult_previous_learning_method', $pqsioptions['adult_learning_methods'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'adult_learning_goal'); ?>"><label>Primary learning goal</label><?php echo pqsi_select('adult_learning_goal', $pqsioptions['adult_learning_goals'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Current employment status</label><?php echo pqsi_select('adult_employment_status', $pqsioptions['adult_employment_statuses'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'adult_learning_format'); ?>"><label>Preferred learning format</label><?php echo pqsi_select('adult_learning_format', $pqsioptions['adult_learning_formats'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'adult_learning_pace'); ?>"><label>Preferred learning pace</label><?php echo pqsi_select('adult_learning_pace', $pqsioptions['adult_learning_paces'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Preferred class arrangement</label><?php echo pqsi_select('adult_class_arrangement', $pqsioptions['adult_class_arrangements'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Childcare responsibilities affecting attendance</label><?php echo pqsi_select('adult_childcare_impact', $pqsioptions['adult_childcare_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Work responsibilities affecting attendance</label><?php echo pqsi_select('adult_work_impact', $pqsioptions['adult_attendance_impact_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Transport or connectivity limitations</label><?php echo pqsi_select('adult_access_limitations', $pqsioptions['adult_access_limitations'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Confidence returning to learning</label><?php echo pqsi_select('adult_learning_confidence', $pqsioptions['adult_learning_confidence_levels'] ?? [], $form, $fielderrors); ?></div>
            </div>
            <div class="pqsi-field pqsi-field--full"><label>Learning support or accessibility needs</label><textarea class="pqsi-textarea" name="adult_support_needs"><?php echo s(pqsi_form_value($form, 'adult_support_needs')); ?></textarea></div>
            <div class="pqsi-field pqsi-field--full"><label>Additional adult-learning notes</label><textarea class="pqsi-textarea" name="adult_notes"><?php echo s(pqsi_form_value($form, 'adult_notes')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($pqsiisprofessionaldevelopment): ?>
            <h3>Professional development details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'professional_area'); ?>"><label>Professional development area</label><?php echo pqsi_select('professional_area', $pqsioptions['professional_development_areas'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Specific topic or skill</label><input class="pqsi-input" name="professional_topic_skill" value="<?php echo s(pqsi_form_value($form, 'professional_topic_skill')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'professional_current_role'); ?>"><label>Current professional role</label><input class="pqsi-input" name="professional_current_role" value="<?php echo s(pqsi_form_value($form, 'professional_current_role')); ?>"><?php echo pqsi_form_error($fielderrors, 'professional_current_role'); ?></div>
              <div class="pqsi-field"><label>Industry or sector</label><?php echo pqsi_select('professional_industry', $pqsioptions['professional_industries'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'professional_employment_status'); ?>"><label>Employment status</label><?php echo pqsi_select('professional_employment_status', $pqsioptions['professional_employment_statuses'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Employer or organisation</label><input class="pqsi-input" name="professional_employer" value="<?php echo s(pqsi_form_value($form, 'professional_employer')); ?>"></div>
              <div class="pqsi-field"><label>Years of professional experience</label><?php echo pqsi_select('professional_experience_years', $pqsioptions['professional_experience_ranges'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Current responsibility level</label><?php echo pqsi_select('professional_responsibility_level', $pqsioptions['professional_responsibility_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'professional_development_goal'); ?>"><label>Primary development goal</label><?php echo pqsi_select('professional_development_goal', $pqsioptions['professional_development_goals'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'professional_skill_level'); ?>"><label>Current skill level</label><?php echo pqsi_select('professional_skill_level', $pqsioptions['professional_skill_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Certification or credential sought</label><input class="pqsi-input" name="professional_credential_sought" value="<?php echo s(pqsi_form_value($form, 'professional_credential_sought')); ?>"></div>
              <div class="pqsi-field"><label>Certification deadline</label><input class="pqsi-input" name="professional_certification_deadline" type="date" value="<?php echo s(pqsi_form_value($form, 'professional_certification_deadline')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'professional_learning_format'); ?>"><label>Preferred learning format</label><?php echo pqsi_select('professional_learning_format', $pqsioptions['professional_learning_formats'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Preferred learning schedule</label><?php echo pqsi_select('professional_learning_schedule', $pqsioptions['professional_learning_schedules'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Preferred course intensity</label><?php echo pqsi_select('professional_course_intensity', $pqsioptions['professional_course_intensities'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Employer-sponsored training</label><?php echo pqsi_select('professional_employer_sponsored', $pqsioptions['professional_sponsorship_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>CPD credits required</label><?php echo pqsi_select('professional_cpd_required', $pqsioptions['professional_cpd_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Required CPD credits or hours</label><input class="pqsi-input" name="professional_cpd_credits" type="number" min="0" value="<?php echo s(pqsi_form_value($form, 'professional_cpd_credits')); ?>"></div>
            </div>
            <div class="pqsi-field pqsi-field--full"><label>Expected workplace outcome</label><textarea class="pqsi-textarea" name="professional_workplace_outcome"><?php echo s(pqsi_form_value($form, 'professional_workplace_outcome')); ?></textarea></div>
            <div class="pqsi-field pqsi-field--full"><label>Professional support or accessibility needs</label><textarea class="pqsi-textarea" name="professional_support_needs"><?php echo s(pqsi_form_value($form, 'professional_support_needs')); ?></textarea></div>
            <div class="pqsi-field pqsi-field--full"><label>Additional professional development notes</label><textarea class="pqsi-textarea" name="professional_notes"><?php echo s(pqsi_form_value($form, 'professional_notes')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($pqsiistechnicaltraining): ?>
            <h3>Technical training details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'technical_program'); ?>"><label>Training program or trade</label><?php echo pqsi_select('technical_program', $pqsioptions['technical_programs'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Specific specialization</label><input class="pqsi-input" name="technical_specialization" value="<?php echo s(pqsi_form_value($form, 'technical_specialization')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'technical_training_level'); ?>"><label>Training level</label><?php echo pqsi_select('technical_training_level', $pqsioptions['technical_training_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'technical_previous_experience'); ?>"><label>Previous technical experience</label><?php echo pqsi_select('technical_previous_experience', $pqsioptions['technical_experience_types'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Previous learning method</label><?php echo pqsi_select('technical_previous_learning_method', $pqsioptions['technical_learning_methods'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Experience duration</label><?php echo pqsi_select('technical_experience_duration', $pqsioptions['technical_experience_durations'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Current employment status</label><?php echo pqsi_select('technical_employment_status', $pqsioptions['technical_employment_statuses'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Current employer or workshop</label><input class="pqsi-input" name="technical_employer_workshop" value="<?php echo s(pqsi_form_value($form, 'technical_employer_workshop')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'technical_training_goal'); ?>"><label>Primary training goal</label><?php echo pqsi_select('technical_training_goal', $pqsioptions['technical_training_goals'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Certification sought</label><input class="pqsi-input" name="technical_certification_sought" value="<?php echo s(pqsi_form_value($form, 'technical_certification_sought')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'technical_training_format'); ?>"><label>Preferred training format</label><?php echo pqsi_select('technical_training_format', $pqsioptions['technical_training_formats'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Preferred training schedule</label><?php echo pqsi_select('technical_training_schedule', $pqsioptions['technical_training_schedules'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'technical_tool_access'); ?>"><label>Access to required tools or equipment</label><?php echo pqsi_select('technical_tool_access', $pqsioptions['technical_tool_access_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Computer or digital skill level</label><?php echo pqsi_select('technical_digital_skill_level', $pqsioptions['technical_digital_skill_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Safety training completed</label><?php echo pqsi_select('technical_safety_training', $pqsioptions['technical_yes_no_unsure'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Protective equipment available</label><?php echo pqsi_select('technical_protective_equipment', $pqsioptions['technical_protective_equipment_options'] ?? [], $form, $fielderrors); ?></div>
            </div>
            <div class="pqsi-field pqsi-field--full"><label>Tools or equipment experience</label><textarea class="pqsi-textarea" name="technical_tools_experience"><?php echo s(pqsi_form_value($form, 'technical_tools_experience')); ?></textarea></div>
            <div class="pqsi-field pqsi-field--full"><label>Practical support or accessibility needs</label><textarea class="pqsi-textarea" name="technical_support_needs"><?php echo s(pqsi_form_value($form, 'technical_support_needs')); ?></textarea></div>
            <div class="pqsi-field pqsi-field--full"><label>Additional technical training notes</label><textarea class="pqsi-textarea" name="technical_notes"><?php echo s(pqsi_form_value($form, 'technical_notes')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($pqsiishighereducation): ?>
            <h3>Higher education details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'higher_application_level'); ?>"><label>Application level</label><?php echo pqsi_select('higher_application_level', $pqsioptions['higher_application_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'higher_program_field'); ?>"><label>Program or field of study</label><input class="pqsi-input" name="higher_program_field" value="<?php echo s(pqsi_form_value($form, 'higher_program_field')); ?>"><?php echo pqsi_form_error($fielderrors, 'higher_program_field'); ?></div>
              <div class="pqsi-field"><label>Intended specialization</label><input class="pqsi-input" name="higher_specialization" value="<?php echo s(pqsi_form_value($form, 'higher_specialization')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'higher_highest_qualification'); ?>"><label>Highest qualification completed</label><?php echo pqsi_select('higher_highest_qualification', $pqsioptions['higher_qualification_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Previous institution</label><input class="pqsi-input" name="higher_previous_institution" value="<?php echo s(pqsi_form_value($form, 'higher_previous_institution')); ?>"></div>
              <div class="pqsi-field"><label>Qualification title</label><input class="pqsi-input" name="higher_qualification_title" value="<?php echo s(pqsi_form_value($form, 'higher_qualification_title')); ?>"></div>
              <div class="pqsi-field"><label>Graduation or expected completion year</label><input class="pqsi-input" name="higher_completion_year" type="number" min="1900" max="2100" value="<?php echo s(pqsi_form_value($form, 'higher_completion_year')); ?>"></div>
              <div class="pqsi-field"><label>Academic result</label><input class="pqsi-input" name="higher_academic_result" value="<?php echo s(pqsi_form_value($form, 'higher_academic_result')); ?>"></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'higher_academic_status'); ?>"><label>Current academic status</label><?php echo pqsi_select('higher_academic_status', $pqsioptions['higher_academic_statuses'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Admission route</label><?php echo pqsi_select('higher_admission_route', $pqsioptions['higher_admission_routes'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Transfer credits requested</label><?php echo pqsi_select('higher_transfer_credits', $pqsioptions['higher_transfer_credit_options'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'higher_study_mode'); ?>"><label>Preferred study mode</label><?php echo pqsi_select('higher_study_mode', $pqsioptions['higher_study_modes'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'higher_study_load'); ?>"><label>Preferred study load</label><?php echo pqsi_select('higher_study_load', $pqsioptions['higher_study_loads'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Preferred intake or academic term</label><input class="pqsi-input" name="higher_preferred_intake" value="<?php echo s(pqsi_form_value($form, 'higher_preferred_intake')); ?>"></div>
              <div class="pqsi-field"><label>Funding method</label><?php echo pqsi_select('higher_funding_method', $pqsioptions['higher_funding_methods'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field"><label>Scholarship or financial-aid interest</label><?php echo pqsi_select('higher_financial_aid_interest', $pqsioptions['higher_financial_aid_options'] ?? [], $form, $fielderrors); ?></div>
            </div>
            <div class="pqsi-field pqsi-field--full"><label>Research interest or proposed topic</label><textarea class="pqsi-textarea" name="higher_research_interest"><?php echo s(pqsi_form_value($form, 'higher_research_interest')); ?></textarea></div>
            <div class="pqsi-field pqsi-field--full"><label>Academic support or accessibility needs</label><textarea class="pqsi-textarea" name="higher_support_needs"><?php echo s(pqsi_form_value($form, 'higher_support_needs')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($pqsiisislamicstudies): ?>
            <h3>Islamic studies details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'islamic_program_interest'); ?>" id="pqsi-islamic_program_interest"><label>Islamic program interest</label><?php echo pqsi_select('islamic_program_interest', $pqsioptions['islamic_program_interests'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'quran_reading_level'); ?>" id="pqsi-quran_reading_level"><label>Quran reading level</label><?php echo pqsi_select('quran_reading_level', $pqsioptions['quran_reading_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'tajweed_level'); ?>" id="pqsi-tajweed_level"><label>Tajweed level</label><?php echo pqsi_select('tajweed_level', $pqsioptions['tajweed_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'memorization_status'); ?>" id="pqsi-memorization_status"><label>Memorization status</label><?php echo pqsi_select('memorization_status', $pqsioptions['memorization_statuses'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'memorized_portion'); ?>" id="pqsi-memorized_portion"><label>Memorized portion</label><input class="pqsi-input" name="memorized_portion" value="<?php echo s(pqsi_form_value($form, 'memorized_portion')); ?>"><?php echo pqsi_form_error($fielderrors, 'memorized_portion'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'arabic_reading_ability'); ?>" id="pqsi-arabic_reading_ability"><label>Arabic reading ability</label><?php echo pqsi_select('arabic_reading_ability', $pqsioptions['arabic_reading_abilities'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'islamic_learning_goal'); ?>" id="pqsi-islamic_learning_goal"><label>Islamic learning goal</label><input class="pqsi-input" name="islamic_learning_goal" value="<?php echo s(pqsi_form_value($form, 'islamic_learning_goal')); ?>"><?php echo pqsi_form_error($fielderrors, 'islamic_learning_goal'); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'previous_learning_method'); ?>" id="pqsi-previous_learning_method"><label>Previous learning method</label><?php echo pqsi_select('previous_learning_method', $pqsioptions['previous_learning_methods'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'tafsir_level'); ?>" id="pqsi-tafsir_level"><label>Tafsir level</label><?php echo pqsi_select('tafsir_level', $pqsioptions['tafsir_levels'] ?? [], $form, $fielderrors); ?></div>
            </div>
            <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'prior_islamic_studies'); ?>" id="pqsi-prior_islamic_studies"><label>Prior Islamic studies</label><textarea class="pqsi-textarea" name="prior_islamic_studies"><?php echo s(pqsi_form_value($form, 'prior_islamic_studies')); ?></textarea><?php echo pqsi_form_error($fielderrors, 'prior_islamic_studies'); ?></div>
            <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'islamic_notes'); ?>" id="pqsi-islamic_notes"><label>Islamic studies notes</label><textarea class="pqsi-textarea" name="islamic_notes"><?php echo s(pqsi_form_value($form, 'islamic_notes')); ?></textarea><?php echo pqsi_form_error($fielderrors, 'islamic_notes'); ?></div>
          <?php endif; ?>

          <?php if ($pqsiischristianstudies): ?>
            <h3>Christian studies details</h3>
            <div class="pqsi-grid">
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'christian_program_interest'); ?>" id="pqsi-christian_program_interest"><label>Christian program interest</label><?php echo pqsi_select('christian_program_interest', $pqsioptions['christian_program_interests'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'bible_reading_level'); ?>" id="pqsi-bible_reading_level"><label>Bible reading level</label><?php echo pqsi_select('bible_reading_level', $pqsioptions['bible_reading_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'bible_knowledge_level'); ?>" id="pqsi-bible_knowledge_level"><label>Bible knowledge level</label><?php echo pqsi_select('bible_knowledge_level', $pqsioptions['bible_knowledge_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'christian_studies_level'); ?>" id="pqsi-christian_studies_level"><label>Christian studies level</label><?php echo pqsi_select('christian_studies_level', $pqsioptions['christian_studies_levels'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'christian_previous_learning_method'); ?>" id="pqsi-christian_previous_learning_method"><label>Previous learning method</label><?php echo pqsi_select('christian_previous_learning_method', $pqsioptions['christian_previous_learning_methods'] ?? [], $form, $fielderrors); ?></div>
              <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'christian_learning_goal'); ?>" id="pqsi-christian_learning_goal"><label>Primary learning goal</label><input class="pqsi-input" name="christian_learning_goal" value="<?php echo s(pqsi_form_value($form, 'christian_learning_goal')); ?>"><?php echo pqsi_form_error($fielderrors, 'christian_learning_goal'); ?></div>
            </div>
            <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'prior_christian_studies'); ?>" id="pqsi-prior_christian_studies"><label>Previous Christian studies</label><textarea class="pqsi-textarea" name="prior_christian_studies"><?php echo s(pqsi_form_value($form, 'prior_christian_studies')); ?></textarea><?php echo pqsi_form_error($fielderrors, 'prior_christian_studies'); ?></div>
            <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'christian_notes'); ?>" id="pqsi-christian_notes"><label>Additional Christian studies notes</label><textarea class="pqsi-textarea" name="christian_notes"><?php echo s(pqsi_form_value($form, 'christian_notes')); ?></textarea><?php echo pqsi_form_error($fielderrors, 'christian_notes'); ?></div>
          <?php endif; ?>

          <h3>Location and language</h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'country'); ?>" id="pqsi-country"><label>Country</label><?php echo pqsi_select('country', $pqsioptions['countries'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'city'); ?>" id="pqsi-city"><label>City</label><?php echo pqsi_select('city', $pqsioptions['cities'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field pqsi-city-other<?php echo pqsi_field_class($fielderrors, 'city_other'); ?>" id="pqsi-city_other"><label>City not listed</label><input class="pqsi-input" name="city_other" value="<?php echo s(pqsi_form_value($form, 'city_other')); ?>"><?php echo pqsi_form_error($fielderrors, 'city_other'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'primary_language'); ?>" id="pqsi-primary_language"><label>Primary language</label><?php echo pqsi_select('primary_language', $pqsioptions['primary_languages'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'preferred_teaching_language'); ?>" id="pqsi-preferred_teaching_language"><label>Preferred teaching language</label><?php echo pqsi_select('preferred_teaching_language', $pqsioptions['primary_languages'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field" id="pqsi-other_languages"><label>Other languages</label><?php echo pqsi_multi_select('other_languages', $pqsioptions['other_languages'] ?? [], $form, $fielderrors, 5); ?></div>
          </div>

          <h3>Learning placement</h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'course_type'); ?>" id="pqsi-course_type"><label>Course</label><?php echo pqsi_select('course_type', $pqsioptions['course_types'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'current_level'); ?>" id="pqsi-current_level"><label>Placement level</label><?php echo pqsi_select('current_level', pqsi_placement_level_options($pqsioptions), $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'tajweed_sub_level'); ?>" id="pqsi-tajweed_sub_level"><label>Tajweed sub-level</label><?php echo pqsi_select('tajweed_sub_level', $pqsioptions['tajweed_sub_levels'] ?? [], $form, $fielderrors, 'Select when Level 3'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'learning_base'); ?>" id="pqsi-learning_base"><label>Learning background</label><?php echo pqsi_select('learning_base', $pqsioptions['learning_bases'] ?? [], $form, $fielderrors); ?></div>
          </div>

          <h3><span class="pqsi-section-pill">Preferred weekly live-session number of sessions and hours</span></h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'session_count'); ?>" id="pqsi-session_count"><label>Number of sessions</label><?php echo pqsi_select('session_count', $pqsioptions['session_counts'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'timezone'); ?>" id="pqsi-timezone"><label>Time zone</label><?php echo pqsi_select('timezone', $pqsioptions['timezones'] ?? [], $form, $fielderrors); ?></div>
          </div>
          <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'slots'); ?>" id="pqsi-slots">
            <label>Select all recurring times that could work</label>
            <div class="pqsi-calendar">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <?php foreach (($pqsioptions['availability_time_windows'] ?? []) as $hourvalue => $hourlabel): ?>
                      <th><?php echo s((string)$hourlabel); ?></th>
                    <?php endforeach; ?>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach (($pqsioptions['availability_days'] ?? []) as $dayvalue => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($pqsioptions['availability_time_windows'] ?? []) as $hourvalue => $hourlabel): ?>
                        <?php $slotvalue = (string)$dayvalue . '|' . (string)$hourvalue; ?>
                        <td>
                          <label class="pqsi-slot" title="<?php echo s((string)$daylabel . ', ' . (string)$hourlabel); ?>">
                            <input type="checkbox" name="slots[]" value="<?php echo s($slotvalue); ?>"<?php echo in_array($slotvalue, (array)($form['slots'] ?? []), true) ? ' checked' : ''; ?>>
                          </label>
                        </td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqsi_form_error($fielderrors, 'slots'); ?>
          </div>
          <div class="pqsi-field" id="pqsi-availability"><label>Availability notes</label><textarea class="pqsi-textarea" name="availability_summary" placeholder="Exact availability, restrictions, preferred days, breaks, or admin notes"><?php echo s(pqsi_form_value($form, 'availability')); ?></textarea></div>

          <h3>Parent / guardian <span class="pqsi-muted"><?php echo $pqsiisprimaryeducation ? '(required for primary education)' : '(required only when the student is under 18)'; ?></span></h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_name'); ?>" id="pqsi-parent_name"><label>Parent/guardian name</label><input class="pqsi-input" name="parent_name" value="<?php echo s(pqsi_form_value($form, 'parent_name')); ?>"><?php echo pqsi_form_error($fielderrors, 'parent_name'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_relationship'); ?>" id="pqsi-parent_relationship"><label>Relationship to student</label><?php echo pqsi_select('parent_relationship', $pqsioptions['parent_relationships'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_relationship_other'); ?>" id="pqsi-parent_relationship_other"><label>Describe relationship</label><input class="pqsi-input" name="parent_relationship_other" value="<?php echo s(pqsi_form_value($form, 'parent_relationship_other')); ?>"><?php echo pqsi_form_error($fielderrors, 'parent_relationship_other'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_email'); ?>" id="pqsi-parent_email"><label>Parent/guardian email or phone</label><input class="pqsi-input" name="parent_email" value="<?php echo s(pqsi_form_value($form, 'parent_email')); ?>" placeholder="Email or phone number"><?php echo pqsi_form_error($fielderrors, 'parent_email'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_phone'); ?>" id="pqsi-parent_phone"><label>Parent/guardian phone / WhatsApp</label><input class="pqsi-input" name="parent_phone" value="<?php echo s(pqsi_form_value($form, 'parent_phone')); ?>"><?php echo pqsi_form_error($fielderrors, 'parent_phone'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'emergency_contact_name'); ?>" id="pqsi-emergency_contact_name"><label>Emergency contact name</label><input class="pqsi-input" name="emergency_contact_name" value="<?php echo s(pqsi_form_value($form, 'emergency_contact_name')); ?>"><?php echo pqsi_form_error($fielderrors, 'emergency_contact_name'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'emergency_contact_phone'); ?>" id="pqsi-emergency_contact_phone"><label>Emergency contact phone</label><input class="pqsi-input" name="emergency_contact_phone" value="<?php echo s(pqsi_form_value($form, 'emergency_contact_phone')); ?>"><?php echo pqsi_form_error($fielderrors, 'emergency_contact_phone'); ?></div>
            <div class="pqsi-field"><label>Parent username</label><input class="pqsi-input" name="parent_username" value="<?php echo s(pqsi_form_value($form, 'parent_username')); ?>" placeholder="Auto-generated if blank"></div>
          </div>
          <label class="pqsi-checkrow"><input type="checkbox" name="parent_email_enabled" value="1"<?php echo pqsi_checked($form, 'parent_email_enabled'); ?>><span>Send parent email notifications when the parent contact is a valid email address.</span></label>
          <div class="pqsi-field"><label>Parent preferences</label><textarea class="pqsi-textarea" name="parent_preferences" placeholder="Teacher gender, language, schedule, sibling grouping"><?php echo s(pqsi_form_value($form, 'parent_preferences')); ?></textarea></div>

          <h3>Referrer <span class="pqsi-muted">(optional, separate from parent/guardian access)</span></h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_code'); ?>" id="pqsi-referrer_code"><label>Referrer Code</label><input class="pqsi-input" name="referrer_code" inputmode="numeric" maxlength="5" value="<?php echo s(pqsi_form_value($form, 'referrer_code')); ?>" placeholder="Five-digit code"><?php echo pqsi_form_error($fielderrors, 'referrer_code'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_name'); ?>" id="pqsi-referrer_name"><label>Referrer name</label><input class="pqsi-input" name="referrer_name" value="<?php echo s(pqsi_form_value($form, 'referrer_name')); ?>"><?php echo pqsi_form_error($fielderrors, 'referrer_name'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_contact_number'); ?>" id="pqsi-referrer_contact_number"><label>Contact number</label><input class="pqsi-input" name="referrer_contact_number" value="<?php echo s(pqsi_form_value($form, 'referrer_contact_number')); ?>"><?php echo pqsi_form_error($fielderrors, 'referrer_contact_number'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_email'); ?>" id="pqsi-referrer_email"><label>Email</label><input class="pqsi-input" name="referrer_email" type="email" value="<?php echo s(pqsi_form_value($form, 'referrer_email')); ?>"><?php echo pqsi_form_error($fielderrors, 'referrer_email'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_city'); ?>" id="pqsi-referrer_city"><label>City</label><input class="pqsi-input" name="referrer_city" value="<?php echo s(pqsi_form_value($form, 'referrer_city')); ?>"><?php echo pqsi_form_error($fielderrors, 'referrer_city'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_state'); ?>" id="pqsi-referrer_state"><label>State</label><input class="pqsi-input" name="referrer_state" value="<?php echo s(pqsi_form_value($form, 'referrer_state')); ?>"><?php echo pqsi_form_error($fielderrors, 'referrer_state'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referrer_country'); ?>" id="pqsi-referrer_country"><label>Country</label><input class="pqsi-input" name="referrer_country" value="<?php echo s(pqsi_form_value($form, 'referrer_country')); ?>"><?php echo pqsi_form_error($fielderrors, 'referrer_country'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referral_datereferred'); ?>" id="pqsi-referral_datereferred"><label>Date referred</label><input class="pqsi-input" name="referral_datereferred" type="date" value="<?php echo s(pqsi_form_value($form, 'referral_datereferred')); ?>"><?php echo pqsi_form_error($fielderrors, 'referral_datereferred'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referral_effective_date'); ?>" id="pqsi-referral_effective_date"><label>Referral effective date</label><input class="pqsi-input" name="referral_effective_date" type="date" value="<?php echo s(pqsi_form_value($form, 'referral_effective_date')); ?>"><?php echo pqsi_form_error($fielderrors, 'referral_effective_date'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referral_status'); ?>" id="pqsi-referral_status"><label>Referral status</label><select class="pqsi-select" name="referral_status"><option value="pending"<?php echo pqsi_selected($form, 'referral_status', 'pending'); ?>>Pending</option><option value="contacted"<?php echo pqsi_selected($form, 'referral_status', 'contacted'); ?>>Contacted</option><option value="enrolled"<?php echo pqsi_selected($form, 'referral_status', 'enrolled'); ?>>Enrolled</option><option value="approved"<?php echo pqsi_selected($form, 'referral_status', 'approved'); ?>>Approved</option></select><?php echo pqsi_form_error($fielderrors, 'referral_status'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'referral_dateexpires'); ?>" id="pqsi-referral_dateexpires"><label>Referral expiry date</label><input class="pqsi-input" name="referral_dateexpires" type="date" value="<?php echo s(pqsi_form_value($form, 'referral_dateexpires')); ?>"><?php echo pqsi_form_error($fielderrors, 'referral_dateexpires'); ?></div>
            <div class="pqsi-field"><label>Commission amount</label><input class="pqsi-input" name="commission_amount" value="<?php echo s(pqsi_form_value($form, 'commission_amount')); ?>" placeholder="Example: 25.00"></div>
            <div class="pqsi-field"><label>Commission rate</label><input class="pqsi-input" name="commission_rate" value="<?php echo s(pqsi_form_value($form, 'commission_rate')); ?>" placeholder="Example: 10%"></div>
            <div class="pqsi-field"><label>Commission currency</label><input class="pqsi-input" name="commission_currency" value="<?php echo s(pqsi_form_value($form, 'commission_currency')); ?>" placeholder="USD"></div>
          </div>
          <div class="pqsi-field"><label>Referral notes</label><textarea class="pqsi-textarea" name="referral_notes" placeholder="Campaign, agreement, source notes, or commission context"><?php echo s(pqsi_form_value($form, 'referral_notes')); ?></textarea></div>

          <h3>Consent</h3>
          <label class="pqsi-checkrow<?php echo isset($fielderrors['live_class_consent']) ? ' pqsi-checkrow--error' : ''; ?>"><input type="checkbox" name="live_class_consent" value="1"<?php echo pqsi_checked($form, 'live_class_consent'); ?>><span>Student or parent/guardian consents to live interactive classes.</span></label><?php echo pqsi_form_error($fielderrors, 'live_class_consent'); ?>
          <div class="pqsi-field">
            <label>Audio recording declaration</label>
            <p class="pqsi-muted">Live-class audio is always recorded as part of safeguarding and class-quality practice. Audio may be used for teacher review, parent review, lesson quality checks, attendance or incident review, quiz and learning support, and compliance. Access is limited to authorised workspace users and linked parents/guardians according to the recording review and retention policy.</p>
          </div>
          <label class="pqsi-checkrow"><input type="checkbox" name="recording_consent" value="1"<?php echo pqsi_checked($form, 'recording_consent'); ?>><span>Student or parent/guardian gives opt-in consent for student camera/video recording and video playback visibility when policy allows.</span></label>
          <div class="pqsi-field"><label>Consent notes/comment</label><textarea class="pqsi-textarea" name="consent_notes" placeholder="How consent was collected, who confirmed, and any limits"><?php echo s(pqsi_form_value($form, 'consent_notes')); ?></textarea></div>

          <button class="pqsi-btn pqsi-btn--brown" type="submit" name="submit_intake" value="1">Create student intake</button>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var countryCities = <?php echo json_encode($pqsioptions['country_cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var cityLabels = <?php echo json_encode($pqsioptions['cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var countryTimezones = <?php echo json_encode($pqsioptions['country_timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var timezoneLabels = <?php echo json_encode($pqsioptions['timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var country = document.querySelector('select[name="country"]');
  var city = document.querySelector('select[name="city"]');
  var timezone = document.querySelector('select[name="timezone"]');
  var cityOther = document.querySelector('.pqsi-city-other');
  function option(value, label, selected) {
    var item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    if (selected) {
      item.selected = true;
    }
    return item;
  }
  function keys(source) {
    return Array.isArray(source) ? source.slice() : Object.keys(source || {});
  }
  function labelFor(source, value, fallback) {
    if (!source || Array.isArray(source)) {
      return fallback;
    }
    return source[value] || fallback;
  }
  function refreshCities() {
    if (!country || !city) {
      return;
    }
    var selected = city.value;
    var countryList = countryCities[country.value];
    var cities = countryList ? keys(countryList) : keys(cityLabels);
    if (cities.indexOf('Other') === -1) {
      cities.push('Other');
    }
    city.innerHTML = '';
    city.appendChild(option('', 'Select', selected === ''));
    cities.forEach(function(cityname) {
      var label = labelFor(countryList, cityname, labelFor(cityLabels, cityname, cityname));
      city.appendChild(option(cityname, label, cityname === selected));
    });
    if (selected && cities.indexOf(selected) === -1) {
      city.value = 'Other';
    }
    if (cityOther) {
      cityOther.classList.toggle('pqsi-city-other--visible', city.value === 'Other');
    }
  }
  function refreshTimezones() {
    if (!country || !timezone) {
      return;
    }
    var selected = timezone.value;
    var countryList = countryTimezones[country.value];
    var zones = countryList ? keys(countryList) : keys(timezoneLabels);
    timezone.innerHTML = '';
    timezone.appendChild(option('', 'Select', selected === ''));
    zones.forEach(function(zone) {
      var label = labelFor(countryList, zone, labelFor(timezoneLabels, zone, zone));
      timezone.appendChild(option(zone, label, zone === selected));
    });
    if (selected && zones.indexOf(selected) === -1) {
      timezone.value = zones.length === 1 ? zones[0] : '';
    }
  }
  if (country) {
    country.addEventListener('change', function() {
      refreshCities();
      refreshTimezones();
    });
  }
  if (city) {
    city.addEventListener('change', refreshCities);
  }
  refreshCities();
  refreshTimezones();
})();
</script>
<script>
(function() {
  function removeCourseStartingDateModal() {
    var found = false;
    var headings = Array.prototype.slice.call(document.querySelectorAll('.modal-title, .modal-header h1, .modal-header h2, .modal-header h3, h1, h2, h3'));
    headings.forEach(function(heading) {
      if ((heading.textContent || '').trim().toLowerCase() !== 'course starting date') {
        return;
      }
      found = true;
      var modal = heading.closest('.modal, [role="dialog"]');
      if (modal) {
        modal.remove();
      }
    });
    if (!found) {
      return;
    }
    document.querySelectorAll('.modal-backdrop, .modal-backdrop.show').forEach(function(backdrop) {
      backdrop.remove();
    });
    if (!document.querySelector('.modal.show, [role="dialog"][aria-modal="true"]')) {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  }
  removeCourseStartingDateModal();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeCourseStartingDateModal, {once: true});
  }
  if (document.documentElement) {
    new MutationObserver(removeCourseStartingDateModal).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
</script>
<?php
echo $OUTPUT->footer();
