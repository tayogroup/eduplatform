<?php
// Public-intake helper library — extracted VERBATIM from public_intake.php
// (renamed pqpir_ -> pqpirl_) for the cookieless public JSON endpoint
// local/prequran/public_intake_data.php. The legacy page keeps its inline
// copies and stays untouched (parallel-run).
//
// Exceptions to the verbatim rule:
//   - pqpirl_security_token: stateless HMAC over formtime|'public_intake'
//     keyed with local_prequran/progress_launch_secret (the legacy version is
//     session-bound: it mixes in sesskey(), which cannot exist cookieless).
//   - Rendering-only helpers that emit Moodle page HTML were not extracted:
//     pqpir_public_header, pqpir_error, pqpir_selected, pqpir_checked,
//     pqpir_select, pqpir_multi_select.
//   - The PQPIR_* class constants are exposed as pqpirl_*() functions with
//     identical values (PQPIR_SESSION_COOLDOWN_SECONDS is intentionally
//     absent: the $SESSION-based cooldown cannot exist cookieless).
//
// Requires: local/hubredirect/accesslib.php + course_offeringlib.php loaded
// first (pqh_normalize_course_key, pqh_account_no_label, pqco_*).

defined('MOODLE_INTERNAL') || die();

function pqpirl_min_form_seconds(): int {
    return 4; // Legacy PQPIR_MIN_FORM_SECONDS.
}

function pqpirl_max_form_seconds(): int {
    return 7200; // Legacy PQPIR_MAX_FORM_SECONDS.
}

function pqpirl_contact_window_seconds(): int {
    return 3600; // Legacy PQPIR_CONTACT_WINDOW_SECONDS.
}

function pqpirl_contact_window_limit(): int {
    return 3; // Legacy PQPIR_CONTACT_WINDOW_LIMIT.
}

function pqpirl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpirl_table_has_column(string $table, string $column): bool {
    global $DB;
    if (!pqpirl_table_exists($table)) {
        return false;
    }
    $columns = $DB->get_columns($table);
    return isset($columns[$column]);
}

function pqpirl_trim(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqpirl_contact(string $name): string {
    return core_text::substr(trim(optional_param($name, '', PARAM_TEXT)), 0, 255);
}

function pqpirl_param_array(string $name): array {
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

function pqpirl_consumer_initial(string $brandname): string {
    $clean = (string)preg_replace('/[^A-Za-z0-9]+/', '', $brandname);
    if ($clean === '') {
        $clean = 'E';
    }

    return strtoupper(core_text::substr($clean, 0, 1));
}

function pqpirl_label(string $value, array $options): string {
    return (string)($options[$value] ?? $value);
}

function pqpirl_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = pqpirl_label((string)$value, $options);
    }
    return $labels;
}

function pqpirl_placement_level_options(array $options): array {
    return $options['current_levels'] ?? [];
}

function pqpirl_field_label(string $name): string {
    $labels = [
        'form_security' => 'Form security',
        'parent_name' => 'Parent/guardian name',
        'parent_relationship' => 'Relationship to student',
        'parent_relationship_other' => 'Relationship description',
        'parent_email' => 'Parent/guardian email or phone',
        'parent_phone' => 'Parent phone / WhatsApp',
        'emergency_contact_name' => 'Emergency contact name',
        'emergency_contact_phone' => 'Emergency contact phone',
        'student_firstname' => 'Student first name',
        'student_middle_name' => 'Student middle name',
        'student_lastname' => 'Student last name',
        'student_display_name' => 'Student display name',
        'student_access_type' => 'Student access type',
        'student_email' => 'Student email or phone',
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
        'current_level' => 'Placement level',
        'tajweed_sub_level' => 'Tajweed sub-level',
        'learning_base' => 'Learning background',
        'session_count' => 'Number of sessions',
        'slots' => 'Preferred live-session number of sessions and hours',
        'parent_email_enabled' => 'Parent email notifications',
        'live_class_consent' => 'Live class consent',
        'consent_notes' => 'Consent notes/comment',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqpirl_limit_text(string $value, int $limit): string {
    return core_text::substr(trim($value), 0, $limit);
}

function pqpirl_contact_ok(string $contact): bool {
    if ($contact === '') {
        return true;
    }
    if (validate_email($contact)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $contact);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqpirl_contact_key(string $contact): string {
    $contact = core_text::strtolower(trim($contact));
    if (validate_email($contact)) {
        return $contact;
    }
    return (string)preg_replace('/\D+/', '', $contact);
}

function pqpirl_contact_keys(array $contacts): array {
    $keys = [];
    foreach ($contacts as $contact) {
        $raw = core_text::strtolower(trim((string)$contact));
        if ($raw !== '') {
            $keys[] = $raw;
        }
        $normalised = pqpirl_contact_key($raw);
        if ($normalised !== '') {
            $keys[] = $normalised;
        }
    }
    return array_values(array_unique($keys));
}

// NOT verbatim (session-bound in legacy): stateless HMAC keyed with the
// existing server-side launch secret; no sesskey, no cookies.
function pqpirl_security_token(int $formtime): string {
    $secret = (string)get_config('local_prequran', 'progress_launch_secret');
    return hash_hmac('sha256', $formtime . '|public_intake', $secret);
}

function pqpirl_security_audit(string $action, array $details = []): void {
    global $DB;
    if (!pqpirl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $details['ip_hash'] = hash('sha256', getremoteaddr() ?: 'unknown');
    $details['ua_hash'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => 0,
        'action' => $action,
        'targettype' => 'public_intake',
        'targetid' => 0,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqpirl_contact_submission_count(array $contacts, int $since): int {
    global $DB;
    $keys = pqpirl_contact_keys($contacts);
    if (!$keys) {
        return 0;
    }
    $likes = [];
    $params = ['since' => $since];
    foreach ($keys as $index => $key) {
        $parentemailparam = 'contact_parent_email_' . $index;
        $parentphoneparam = 'contact_parent_phone_' . $index;
        $studentemailparam = 'contact_student_email_' . $index;
        $likes[] = "(LOWER(parent_email) = :{$parentemailparam} OR LOWER(parent_phone) = :{$parentphoneparam} OR LOWER(student_email) = :{$studentemailparam})";
        $params[$parentemailparam] = $key;
        $params[$parentphoneparam] = $key;
        $params[$studentemailparam] = $key;
    }
    return (int)$DB->count_records_select(
        'local_prequran_intake_request',
        'timecreated >= :since AND (' . implode(' OR ', $likes) . ')',
        $params
    );
}

function pqpirl_value(array $form, string $name): string {
    if (!isset($form[$name])) {
        return '';
    }
    return is_array($form[$name]) ? implode(', ', array_map('strval', $form[$name])) : (string)$form[$name];
}

function pqpirl_public_course_options(stdClass $consumercontext, array $fallback): array {
    global $DB;

    $workspaceid = (int)($consumercontext->workspaceid ?? 0);
    if ($workspaceid <= 0 || !pqco_table_ready()) {
        return $fallback;
    }
    try {
        $offerings = array_values($DB->get_records_select(
            'local_prequran_course_offering',
            'workspaceid = ? AND status = ? AND visibility = ?',
            [$workspaceid, 'published', 'institution_public'],
            'startdate ASC, title ASC'
        ));
    } catch (Throwable $e) {
        return [];
    }
    if (!$offerings) {
        return [];
    }

    $counts = pqco_offering_counts(array_map(static fn($offering): int => (int)$offering->id, $offerings));
    $options = [];
    foreach ($offerings as $offering) {
        $coursekey = pqh_normalize_course_key((string)$offering->course_key);
        if ($coursekey === '' || pqco_offering_has_ended($offering)) {
            continue;
        }
        $open = pqco_open_seats($offering, $counts);
        if ($open <= 0) {
            continue;
        }
        $label = trim((string)$offering->title);
        if ($label === '') {
            $label = (string)($fallback[$coursekey] ?? $coursekey);
        }
        $meta = [];
        if ((int)$offering->startdate > 0) {
            $meta[] = 'starts ' . userdate((int)$offering->startdate, get_string('strftimedate'));
        }
        $meta[] = (int)$offering->capacity <= 0 ? 'unlimited seats' : ((int)$open . ' seats open');
        $options[$coursekey] = $label . ' (' . implode(', ', $meta) . ')';
    }

    return $options;
}

function pqpirl_slot_summary(array $slots, array $days, array $hours, int $sessioncount = 0): string {
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day === '' || $hour === '') {
            continue;
        }
        $byday[$day][] = pqpirl_label($hour, $hours);
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = pqpirl_label($day, $days) . ': ' . implode(', ', $dayhours);
    }
    $summary = implode('; ', $parts);
    if ($sessioncount > 0) {
        $prefix = 'Requested sessions per week: ' . $sessioncount;
        return $summary !== '' ? $prefix . '; ' . $summary : $prefix;
    }
    return $summary;
}

function pqpirl_teacher_preference(int $teacherid, int $consumerid): ?stdClass {
    global $DB;
    if ($teacherid <= 0 || !pqpirl_table_exists('local_prequran_teacher_profile')) {
        return null;
    }
    $consumerwhere = '';
    $params = [
        'teacherid' => $teacherid,
        'activestatus' => 'active',
        'marketstatus' => 'published',
        'vettingstatus' => 'approved',
    ];
    if (pqpirl_table_has_column('local_prequran_teacher_profile', 'consumerid') && $consumerid > 0) {
        $consumerwhere = ' AND tp.consumerid = :consumerid';
        $params['consumerid'] = $consumerid;
    }
    return $DB->get_record_sql(
        "SELECT tp.userid, tp.teacher_display_name, u.firstname, u.lastname, u.idnumber
           FROM {local_prequran_teacher_profile} tp
           JOIN {user} u ON u.id = tp.userid
          WHERE tp.userid = :teacherid
            AND tp.status = :activestatus
            AND tp.marketplace_visible = 1
            AND tp.marketplace_status = :marketstatus
            AND tp.vetting_status = :vettingstatus
            {$consumerwhere}
            AND u.deleted = 0
            AND u.suspended = 0",
        $params,
        IGNORE_MISSING
    ) ?: null;
}

function pqpirl_teacher_preference_label(?stdClass $teacher): string {
    if (!$teacher) {
        return '';
    }
    $name = trim((string)$teacher->teacher_display_name);
    if ($name === '') {
        $name = trim((string)$teacher->firstname . ' ' . (string)$teacher->lastname);
    }
    return $name . ' (' . pqh_account_no_label($teacher) . ', Moodle ID ' . (int)$teacher->userid . ')';
}
