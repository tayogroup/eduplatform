<?php
// ---- report: student-intake (staff student-enrolment intake wizard) ----------
// Ported from local_hubredirect/student_intake.php via student_intake_portallib
// (pqsil_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = wizard bootstrap: option lists (student_intake_config.php + workspace
//        course override), institution flags, form defaults, request/workspace
//        resolution.
// POST = do=create_intake: the page's single submit block verbatim (same
//        validation order, same messages, same account/profile/consent/referral
//        /workspace/marketplace writes, same audit calls). confirm_sesskey()
//        dropped: token auth replaces the session key.
// Legacy SESSION-only behaviour (pqsi_prefill from intake_requests.php and the
// pqsi_created post-redirect panel) is not portable over the cookieless token
// bridge: POST returns the created payload directly instead.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/account_ids.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_intake_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same context + option resolution as the page top (consumer slug comes from
// the ?consumer= query param exactly as pqh_requested_consumer_context reads).
$pqsiconsumercontext = pqh_requested_consumer_context();
$pqsioptions = require($CFG->dirroot . '/local/hubredirect/student_intake_config.php');
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

// -- entry access check (legacy pqh_access_denied -> pqpd_fail 403) -----------
$pqsiisoperationsuser = pqh_can_manage_academy_operations($userid);
$pqsiisindependentteacher = pqh_has_independent_teacher_profile($userid);
if (!$pqsiisoperationsuser && !$pqsiisindependentteacher) {
    pqpd_fail(403, 'Only platform operations users and approved independent teachers can create student intake records.');
}

$ready = pqsil_profile_ready();

// Default form state — identical keys/defaults to the legacy $form array.
$pqsidefaultform = [
    'requestid' => '', 'workspaceid' => '', 'existing_studentid' => '',
    'student_firstname' => '', 'student_middle_name' => '', 'student_lastname' => '',
    'student_display_name' => '', 'student_username' => '', 'student_email' => '',
    'student_access_type' => 'managed', 'date_of_birth' => '', 'age_years' => '',
    'gender' => '', 'special_needs' => '', 'current_grade' => '', 'school_curriculum' => '',
    'current_school_name' => '', 'student_lives_with' => '', 'primary_learning_goal' => '',
    'medical_safety_notes' => '', 'preferred_class_format' => '', 'preferred_group_size' => '',
    'preferred_teacher_gender' => '', 'school_term' => '', 'islamic_program_interest' => '',
    'quran_reading_level' => '', 'tajweed_level' => '', 'memorization_status' => '',
    'memorized_portion' => '', 'arabic_reading_ability' => '', 'prior_islamic_studies' => '',
    'islamic_learning_goal' => '', 'previous_learning_method' => '', 'tafsir_level' => '',
    'islamic_notes' => '', 'christian_program_interest' => '', 'bible_reading_level' => '',
    'bible_knowledge_level' => '', 'christian_studies_level' => '', 'prior_christian_studies' => '',
    'christian_previous_learning_method' => '', 'christian_learning_goal' => '', 'christian_notes' => '',
    'higher_application_level' => '', 'higher_program_field' => '', 'higher_specialization' => '',
    'higher_highest_qualification' => '', 'higher_previous_institution' => '', 'higher_qualification_title' => '',
    'higher_completion_year' => '', 'higher_academic_result' => '', 'higher_academic_status' => '',
    'higher_admission_route' => '', 'higher_transfer_credits' => '', 'higher_study_mode' => '',
    'higher_study_load' => '', 'higher_preferred_intake' => '', 'higher_research_interest' => '',
    'higher_funding_method' => '', 'higher_financial_aid_interest' => '', 'higher_support_needs' => '',
    'technical_program' => '', 'technical_specialization' => '', 'technical_training_level' => '',
    'technical_previous_experience' => '', 'technical_previous_learning_method' => '',
    'technical_experience_duration' => '', 'technical_employment_status' => '',
    'technical_employer_workshop' => '', 'technical_training_goal' => '', 'technical_certification_sought' => '',
    'technical_training_format' => '', 'technical_training_schedule' => '', 'technical_tools_experience' => '',
    'technical_tool_access' => '', 'technical_digital_skill_level' => '', 'technical_safety_training' => '',
    'technical_protective_equipment' => '', 'technical_support_needs' => '', 'technical_notes' => '',
    'professional_area' => '', 'professional_topic_skill' => '', 'professional_current_role' => '',
    'professional_industry' => '', 'professional_employment_status' => '', 'professional_employer' => '',
    'professional_experience_years' => '', 'professional_responsibility_level' => '',
    'professional_development_goal' => '', 'professional_skill_level' => '', 'professional_credential_sought' => '',
    'professional_certification_deadline' => '', 'professional_learning_format' => '',
    'professional_learning_schedule' => '', 'professional_course_intensity' => '',
    'professional_employer_sponsored' => '', 'professional_cpd_required' => '', 'professional_cpd_credits' => '',
    'professional_workplace_outcome' => '', 'professional_support_needs' => '', 'professional_notes' => '',
    'adult_learning_area' => '', 'adult_subject_skill' => '', 'adult_education_level' => '',
    'adult_literacy_level' => '', 'adult_numeracy_level' => '', 'adult_digital_skill_level' => '',
    'adult_previous_experience' => '', 'adult_previous_learning_method' => '', 'adult_learning_goal' => '',
    'adult_employment_status' => '', 'adult_learning_format' => '', 'adult_learning_pace' => '',
    'adult_class_arrangement' => '', 'adult_childcare_impact' => '', 'adult_work_impact' => '',
    'adult_access_limitations' => '', 'adult_learning_confidence' => '', 'adult_support_needs' => '',
    'adult_notes' => '',
    'course_type' => '', 'country' => '', 'city' => '', 'city_other' => '',
    'timezone' => 'Africa/Nairobi', 'primary_language' => '', 'preferred_teaching_language' => '',
    'other_languages' => [], 'current_level' => '', 'tajweed_sub_level' => '', 'learning_base' => '',
    'availability' => '', 'session_count' => '1', 'slots' => [],
    'availability_days' => [], 'availability_time_windows' => [],
    'parent_name' => '', 'parent_relationship' => '', 'parent_relationship_other' => '',
    'parent_email' => '', 'parent_email_enabled' => 1, 'parent_phone' => '',
    'emergency_contact_name' => '', 'emergency_contact_phone' => '',
    'parent_username' => '', 'parent_preferences' => '',
    'referrer_code' => '', 'referrer_name' => '', 'referrer_contact_number' => '', 'referrer_email' => '',
    'referrer_city' => '', 'referrer_state' => '', 'referrer_country' => '',
    'referral_datereferred' => date('Y-m-d'), 'referral_effective_date' => date('Y-m-d'),
    'referral_status' => 'pending', 'referral_dateexpires' => date('Y-m-d', time() + 90 * DAYSECS),
    'commission_amount' => '', 'commission_rate' => '', 'commission_currency' => 'USD',
    'referral_notes' => '',
    'live_class_consent' => 0, 'recording_consent' => 0, 'consent_notes' => '',
];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    $do = (string)($body['do'] ?? '');

    // JSON-body equivalents of the legacy param readers (same PARAM types:
    // pqsi_trim_param/pqsi_email_param = trim(PARAM_TEXT), plus PARAM_INT,
    // PARAM_BOOL, PARAM_USERNAME, and pqsi_param_array = trimmed PARAM_TEXT[]).
    $bodytrim = function (string $name, string $default = '') use ($body): string {
        if (!array_key_exists($name, $body)) {
            return $default;
        }
        return trim(clean_param((string)$body[$name], PARAM_TEXT));
    };
    $bodyint = function (string $name, int $default = 0) use ($body): int {
        if (!array_key_exists($name, $body)) {
            return $default;
        }
        return (int)clean_param((string)$body[$name], PARAM_INT);
    };
    $bodybool = function (string $name, $default = 0) use ($body) {
        if (!array_key_exists($name, $body)) {
            return $default;
        }
        return clean_param($body[$name], PARAM_BOOL);
    };
    $bodyusername = function (string $name) use ($body): string {
        return clean_param((string)($body[$name] ?? ''), PARAM_USERNAME);
    };
    $bodyarray = function (string $name) use ($body): array {
        $values = isset($body[$name]) && is_array($body[$name]) ? $body[$name] : [];
        $clean = [];
        foreach ($values as $value) {
            $value = trim(clean_param((string)$value, PARAM_TEXT));
            if ($value !== '' && !in_array($value, $clean, true)) {
                $clean[] = $value;
            }
        }
        return $clean;
    };

    // -- write: create_intake (legacy submit_intake POST block, verbatim) -----
    if ($do === 'create_intake') {
        if (!$ready) {
            pqpd_fail(400, 'Student profile table is not ready. Run the Moodle plugin upgrade for local_prequran first.');
        }
        $fielderrors = [];
        $transaction = null;
        try {
            $requestid = $bodyint('requestid', 0);
            $workspaceid = $bodyint('workspaceid', 0);
            if ($workspaceid <= 0 && $requestid > 0) {
                $workspaceid = pqsil_workspaceid_for_requestid($requestid);
            }
            // Legacy pre-POST workspace entry guard (runs on every request).
            if ($workspaceid > 0 && !$pqsiisoperationsuser && !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
                pqpd_fail(403, 'This student intake form is not available for that workspace.');
            }
            if ($workspaceid <= 0 && $pqsiisindependentteacher && !$pqsiisoperationsuser) {
                throw new invalid_parameter_exception('Independent teacher student intake requires a teacher workspace.');
            }
            $workspaceallowed = $workspaceid > 0 && pqh_consumer_context_allows_workspace($pqsiconsumercontext, $workspaceid);
            if ($workspaceid > 0 && $pqsiisindependentteacher && pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
                $workspaceallowed = true;
            }
            if ($workspaceid > 0 && !$workspaceallowed) {
                throw new invalid_parameter_exception('This workspace does not belong to the active consumer.');
            }
            $existingstudentid = $bodyint('existing_studentid', 0);
            if ($existingstudentid > 0 && $pqsiisindependentteacher && !$pqsiisoperationsuser) {
                throw new invalid_parameter_exception('Use Find existing student to request access to an existing learner. Existing profiles cannot be transferred through intake.');
            }
            $firstname = $bodytrim('student_firstname');
            $middlename = $bodytrim('student_middle_name');
            $lastname = $bodytrim('student_lastname');
            $displayname = $bodytrim('student_display_name', trim($firstname . ' ' . $middlename . ' ' . $lastname));
            $studentemail = $bodytrim('student_email');
            $parentname = $bodytrim('parent_name');
            $parentrelationship = $bodytrim('parent_relationship');
            $parentrelationshipother = $bodytrim('parent_relationship_other');
            $parentemail = $bodytrim('parent_email');
            $parentphone = $bodytrim('parent_phone');
            $emergencycontactname = $bodytrim('emergency_contact_name');
            $emergencycontactphone = $bodytrim('emergency_contact_phone');
            $parentcontact = $parentemail !== '' ? $parentemail : $parentphone;
            $referrercode = pqsil_clean_referrer_code($bodytrim('referrer_code'));
            $timezone = $bodytrim('timezone', 'Africa/Nairobi');
            $country = $bodytrim('country');
            $city = $bodytrim('city');
            $cityother = $bodytrim('city_other');
            $savedcity = $city === 'Other' ? $cityother : $city;

            $form = [
                'requestid' => $requestid > 0 ? (string)$requestid : '',
                'workspaceid' => $workspaceid > 0 ? (string)$workspaceid : '',
                'existing_studentid' => $existingstudentid > 0 ? (string)$existingstudentid : '',
                'student_firstname' => $firstname,
                'student_middle_name' => $middlename,
                'student_lastname' => $lastname,
                'student_display_name' => $displayname,
                'student_username' => $bodyusername('student_username'),
                'student_email' => $studentemail,
                'student_access_type' => $bodytrim('student_access_type', 'managed'),
                'date_of_birth' => $bodytrim('date_of_birth'),
                'age_years' => (string)$bodyint('age_years', 0),
                'gender' => $bodytrim('gender'),
                'special_needs' => $bodytrim('special_needs'),
                'current_grade' => $bodytrim('current_grade'),
                'school_curriculum' => $bodytrim('school_curriculum'),
                'current_school_name' => $bodytrim('current_school_name'),
                'student_lives_with' => $bodytrim('student_lives_with'),
                'primary_learning_goal' => $bodytrim('primary_learning_goal'),
                'medical_safety_notes' => $bodytrim('medical_safety_notes'),
                'preferred_class_format' => $bodytrim('preferred_class_format'),
                'preferred_group_size' => $bodytrim('preferred_group_size'),
                'preferred_teacher_gender' => $bodytrim('preferred_teacher_gender'),
                'school_term' => $bodytrim('school_term'),
                'islamic_program_interest' => $bodytrim('islamic_program_interest'),
                'quran_reading_level' => $bodytrim('quran_reading_level'),
                'tajweed_level' => $bodytrim('tajweed_level'),
                'memorization_status' => $bodytrim('memorization_status'),
                'memorized_portion' => $bodytrim('memorized_portion'),
                'arabic_reading_ability' => $bodytrim('arabic_reading_ability'),
                'prior_islamic_studies' => $bodytrim('prior_islamic_studies'),
                'islamic_learning_goal' => $bodytrim('islamic_learning_goal'),
                'previous_learning_method' => $bodytrim('previous_learning_method'),
                'tafsir_level' => $bodytrim('tafsir_level'),
                'islamic_notes' => $bodytrim('islamic_notes'),
                'christian_program_interest' => $bodytrim('christian_program_interest'),
                'bible_reading_level' => $bodytrim('bible_reading_level'),
                'bible_knowledge_level' => $bodytrim('bible_knowledge_level'),
                'christian_studies_level' => $bodytrim('christian_studies_level'),
                'prior_christian_studies' => $bodytrim('prior_christian_studies'),
                'christian_previous_learning_method' => $bodytrim('christian_previous_learning_method'),
                'christian_learning_goal' => $bodytrim('christian_learning_goal'),
                'christian_notes' => $bodytrim('christian_notes'),
                'higher_application_level' => $bodytrim('higher_application_level'),
                'higher_program_field' => $bodytrim('higher_program_field'),
                'higher_specialization' => $bodytrim('higher_specialization'),
                'higher_highest_qualification' => $bodytrim('higher_highest_qualification'),
                'higher_previous_institution' => $bodytrim('higher_previous_institution'),
                'higher_qualification_title' => $bodytrim('higher_qualification_title'),
                'higher_completion_year' => $bodytrim('higher_completion_year'),
                'higher_academic_result' => $bodytrim('higher_academic_result'),
                'higher_academic_status' => $bodytrim('higher_academic_status'),
                'higher_admission_route' => $bodytrim('higher_admission_route'),
                'higher_transfer_credits' => $bodytrim('higher_transfer_credits'),
                'higher_study_mode' => $bodytrim('higher_study_mode'),
                'higher_study_load' => $bodytrim('higher_study_load'),
                'higher_preferred_intake' => $bodytrim('higher_preferred_intake'),
                'higher_research_interest' => $bodytrim('higher_research_interest'),
                'higher_funding_method' => $bodytrim('higher_funding_method'),
                'higher_financial_aid_interest' => $bodytrim('higher_financial_aid_interest'),
                'higher_support_needs' => $bodytrim('higher_support_needs'),
                'technical_program' => $bodytrim('technical_program'),
                'technical_specialization' => $bodytrim('technical_specialization'),
                'technical_training_level' => $bodytrim('technical_training_level'),
                'technical_previous_experience' => $bodytrim('technical_previous_experience'),
                'technical_previous_learning_method' => $bodytrim('technical_previous_learning_method'),
                'technical_experience_duration' => $bodytrim('technical_experience_duration'),
                'technical_employment_status' => $bodytrim('technical_employment_status'),
                'technical_employer_workshop' => $bodytrim('technical_employer_workshop'),
                'technical_training_goal' => $bodytrim('technical_training_goal'),
                'technical_certification_sought' => $bodytrim('technical_certification_sought'),
                'technical_training_format' => $bodytrim('technical_training_format'),
                'technical_training_schedule' => $bodytrim('technical_training_schedule'),
                'technical_tools_experience' => $bodytrim('technical_tools_experience'),
                'technical_tool_access' => $bodytrim('technical_tool_access'),
                'technical_digital_skill_level' => $bodytrim('technical_digital_skill_level'),
                'technical_safety_training' => $bodytrim('technical_safety_training'),
                'technical_protective_equipment' => $bodytrim('technical_protective_equipment'),
                'technical_support_needs' => $bodytrim('technical_support_needs'),
                'technical_notes' => $bodytrim('technical_notes'),
                'professional_area' => $bodytrim('professional_area'),
                'professional_topic_skill' => $bodytrim('professional_topic_skill'),
                'professional_current_role' => $bodytrim('professional_current_role'),
                'professional_industry' => $bodytrim('professional_industry'),
                'professional_employment_status' => $bodytrim('professional_employment_status'),
                'professional_employer' => $bodytrim('professional_employer'),
                'professional_experience_years' => $bodytrim('professional_experience_years'),
                'professional_responsibility_level' => $bodytrim('professional_responsibility_level'),
                'professional_development_goal' => $bodytrim('professional_development_goal'),
                'professional_skill_level' => $bodytrim('professional_skill_level'),
                'professional_credential_sought' => $bodytrim('professional_credential_sought'),
                'professional_certification_deadline' => $bodytrim('professional_certification_deadline'),
                'professional_learning_format' => $bodytrim('professional_learning_format'),
                'professional_learning_schedule' => $bodytrim('professional_learning_schedule'),
                'professional_course_intensity' => $bodytrim('professional_course_intensity'),
                'professional_employer_sponsored' => $bodytrim('professional_employer_sponsored'),
                'professional_cpd_required' => $bodytrim('professional_cpd_required'),
                'professional_cpd_credits' => $bodytrim('professional_cpd_credits'),
                'professional_workplace_outcome' => $bodytrim('professional_workplace_outcome'),
                'professional_support_needs' => $bodytrim('professional_support_needs'),
                'professional_notes' => $bodytrim('professional_notes'),
                'adult_learning_area' => $bodytrim('adult_learning_area'),
                'adult_subject_skill' => $bodytrim('adult_subject_skill'),
                'adult_education_level' => $bodytrim('adult_education_level'),
                'adult_literacy_level' => $bodytrim('adult_literacy_level'),
                'adult_numeracy_level' => $bodytrim('adult_numeracy_level'),
                'adult_digital_skill_level' => $bodytrim('adult_digital_skill_level'),
                'adult_previous_experience' => $bodytrim('adult_previous_experience'),
                'adult_previous_learning_method' => $bodytrim('adult_previous_learning_method'),
                'adult_learning_goal' => $bodytrim('adult_learning_goal'),
                'adult_employment_status' => $bodytrim('adult_employment_status'),
                'adult_learning_format' => $bodytrim('adult_learning_format'),
                'adult_learning_pace' => $bodytrim('adult_learning_pace'),
                'adult_class_arrangement' => $bodytrim('adult_class_arrangement'),
                'adult_childcare_impact' => $bodytrim('adult_childcare_impact'),
                'adult_work_impact' => $bodytrim('adult_work_impact'),
                'adult_access_limitations' => $bodytrim('adult_access_limitations'),
                'adult_learning_confidence' => $bodytrim('adult_learning_confidence'),
                'adult_support_needs' => $bodytrim('adult_support_needs'),
                'adult_notes' => $bodytrim('adult_notes'),
                'course_type' => $bodytrim('course_type'),
                'country' => $country,
                'city' => $city,
                'city_other' => $cityother,
                'timezone' => $timezone,
                'primary_language' => $bodytrim('primary_language'),
                'preferred_teaching_language' => $bodytrim('preferred_teaching_language'),
                'other_languages' => $bodyarray('other_languages'),
                'current_level' => $bodytrim('current_level'),
                'tajweed_sub_level' => $bodytrim('tajweed_sub_level'),
                'learning_base' => $bodytrim('learning_base'),
                'session_count' => (string)$bodyint('session_count', 1),
                'slots' => $bodyarray('slots'),
                'availability_days' => [],
                'availability_time_windows' => [],
                'availability' => $bodytrim('availability_summary'),
                'parent_name' => $parentname,
                'parent_relationship' => $parentrelationship,
                'parent_relationship_other' => $parentrelationshipother,
                'parent_email' => $parentemail,
                'parent_email_enabled' => $bodybool('parent_email_enabled', 0) ? 1 : 0,
                'parent_phone' => $parentphone,
                'emergency_contact_name' => $emergencycontactname,
                'emergency_contact_phone' => $emergencycontactphone,
                'parent_username' => $bodyusername('parent_username'),
                'parent_preferences' => $bodytrim('parent_preferences'),
                'referrer_code' => $referrercode,
                'referrer_name' => $bodytrim('referrer_name'),
                'referrer_contact_number' => $bodytrim('referrer_contact_number'),
                'referrer_email' => $bodytrim('referrer_email'),
                'referrer_city' => $bodytrim('referrer_city'),
                'referrer_state' => $bodytrim('referrer_state'),
                'referrer_country' => $bodytrim('referrer_country'),
                'referral_datereferred' => $bodytrim('referral_datereferred', date('Y-m-d')),
                'referral_effective_date' => $bodytrim('referral_effective_date', date('Y-m-d')),
                'referral_status' => $bodytrim('referral_status', 'pending'),
                'referral_dateexpires' => $bodytrim('referral_dateexpires', date('Y-m-d', time() + 90 * DAYSECS)),
                'commission_amount' => $bodytrim('commission_amount'),
                'commission_rate' => $bodytrim('commission_rate'),
                'commission_currency' => $bodytrim('commission_currency', 'USD'),
                'referral_notes' => $bodytrim('referral_notes'),
                'live_class_consent' => $bodybool('live_class_consent', 0) ? 1 : 0,
                'recording_consent' => $bodybool('recording_consent', 0) ? 1 : 0,
                'consent_notes' => $bodytrim('consent_notes'),
            ];
            $sessioncount = max(1, min(5, (int)$form['session_count']));
            $form['session_count'] = (string)$sessioncount;
            $form['slots'] = pqsil_valid_slots(
                $form['slots'],
                $pqsioptions['availability_days'] ?? [],
                $pqsioptions['availability_time_windows'] ?? []
            );
            $slotsummary = pqsil_slot_summary(
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
            $ageyears = $bodyint('age_years', 0);
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
                'other_languages' => implode(', ', pqsil_labels($form['other_languages'], $pqsioptions['other_languages'] ?? [])),
                'current_level' => $form['current_level'],
                'tajweed_sub_level' => $form['tajweed_sub_level'],
                'learning_base' => $form['learning_base'],
                'availability' => $availabilityforsave,
                'parent_name' => $parentname,
                'parent_relationship' => $parentrelationship,
                'parent_relationship_other' => $parentrelationshipother,
                'parent_email' => $parentcontact,
                'parent_email_enabled' => (int)$form['parent_email_enabled'],
                'parent_phone' => $parentphone !== '' ? $parentphone : (!pqsil_contact_is_email($parentcontact) ? $parentcontact : ''),
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
                    $referrer = pqsil_find_referrer_by_code($referrercode);
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
                $studentduplicateemail = $studentemail !== '' ? pqsil_moodle_email_from_contact($studentemail, 'student') : '';
                $duplicate = pqsil_find_duplicate_profile($displayname, $parentcontact, $studentduplicateemail);
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
                $studentuser = pqsil_existing_user($existingstudentid);
                $studentid = (int)$studentuser->id;
                $studentusername = (string)$studentuser->username;
                if ($displayname === '') {
                    $displayname = fullname($studentuser);
                    $data['student_display_name'] = $displayname;
                }
            } else {
                $studentusername = pqsil_unique_username($bodyusername('student_username') ?: 'student.' . $firstname . '.' . $lastname);
                $studentmoodleemail = $studentemail !== '' ? pqsil_moodle_email_from_contact($studentemail, 'student') : $studentusername . '@eduplatform.local';

                [$studentid, $studentpassword] = pqsil_create_user($firstname, $lastname, $studentmoodleemail, $studentusername, true);
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
                $parentmoodleemail = pqsil_moodle_email_from_contact($parentcontact, 'parent');
                $parentuser = pqsil_find_user_by_email($parentmoodleemail);
                if (!$parentuser && pqsil_contact_is_email($parentcontact)) {
                    $parentuser = pqsil_find_user_by_email($parentcontact);
                }
                if ($parentuser) {
                    $parentid = (int)$parentuser->id;
                } else {
                    $parts = preg_split('/\s+/', trim($parentname));
                    $parentfirst = $parts && isset($parts[0]) && $parts[0] !== '' ? $parts[0] : 'Parent';
                    $parentlast = $parts && count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Guardian';
                    $parentusername = pqsil_unique_username($bodyusername('parent_username') ?: $parentcontact);
                    [$parentid, $parentpassword] = pqsil_create_user($parentfirst, $parentlast, $parentmoodleemail, $parentusername, false);
                    $parentcreated = true;
                }
                $parentaccountid = pqh_assign_account_id($parentid, 'parent');
            }

            $enrollmentapproved = $parentid <= 0 || pqsil_enrollment_already_approved($studentid, $parentid);
            $data['enrollment_approval_status'] = $enrollmentapproved ? 'approved' : 'pending_parent';
            $data['enrollment_approvedby'] = $enrollmentapproved && $parentid > 0 ? $parentid : 0;
            $data['enrollment_approvedat'] = $enrollmentapproved ? time() : 0;
            $data['enrollment_approval_notes'] = $enrollmentapproved
                ? 'No parent approval required, or enrollment was already approved.'
                : 'Parent or guardian approval is required before the student can start lessons.';

            $profileid = pqsil_save_profile($studentid, $data);
            $deferindependentmembership = $pqsiisindependentteacher && !$pqsiisoperationsuser;
            if ($workspaceid > 0 && !$deferindependentmembership) {
                pqsil_upsert_workspace_member($workspaceid, $studentid, 'student', 'Added from student intake.');
                if ($parentid > 0) {
                    pqsil_upsert_workspace_member($workspaceid, $parentid, 'parent', 'Linked as parent/guardian from student intake.');
                }
            }
            $referralid = pqsil_upsert_referral($studentid, $referrer, $form);
            pqsil_upsert_comm_consent($studentid, $parentid);
            pqsil_upsert_live_consent($studentid, $parentid, 'live_session', (int)$data['live_class_consent'], (string)$data['consent_notes']);
            pqsil_upsert_live_consent($studentid, $parentid, 'recording', (int)$data['recording_consent'], (string)$data['consent_notes']);
            if (!$enrollmentapproved) {
                pqsil_upsert_live_consent(
                    $studentid,
                    $parentid,
                    'enrollment_approval',
                    0,
                    'Pending parent or guardian approval. Student lessons remain locked until this approval is granted.'
                );
            }
            pqsil_upsert_live_consent(
                $studentid,
                $parentid,
                'audio_recording_policy',
                1,
                'Audio is always recorded for safeguarding, class quality, lesson review, parent/teacher review, and quiz/learning support. ' . (string)$data['consent_notes']
            );
            $approvalurl = $parentid > 0 ? (new moodle_url('/local/hubredirect/enrollment_approval.php', ['studentid' => $studentid]))->out(false) : '';
            $parentemailsent = false;
            $parentemailattempted = $parentid > 0 && !empty($data['parent_email_enabled']) && pqsil_contact_is_email($parentcontact);
            pqsil_audit('student_intake_created', 'student', $studentid, [
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

            if ($requestid > 0 && pqsil_table_exists('local_prequran_intake_request')) {
                $request = $DB->get_record('local_prequran_intake_request', ['id' => $requestid], '*', IGNORE_MISSING);
                if ($request) {
                    $preferredteacherid = pqsil_preferred_teacherid_from_text((string)($request->parent_preferences ?? '') . "\n" . (string)($request->admin_notes ?? ''));
                    $request->status = 'transferred';
                    $request->transferred_userid = $studentid;
                    $request->transferred_profileid = $profileid;
                    $request->reviewedby = (int)$USER->id;
                    $request->reviewedat = time();
                    $request->timemodified = time();
                    $DB->update_record('local_prequran_intake_request', $request);
                    $teacherrequestid = 0;
                    if ($preferredteacherid > 0) {
                        $teacherrequestid = pqsil_upsert_teacher_marketplace_request(
                            $preferredteacherid,
                            $parentid,
                            $studentid,
                            pqsil_consumerid_for_intake_request($request),
                            'Public intake request #' . $requestid . '.'
                        );
                        if ($teacherrequestid > 0) {
                            $request->admin_notes = trim((string)($request->admin_notes ?? '')) . "\nMarketplace teacher request #" . $teacherrequestid . ' created for preferred teacher Moodle ID ' . $preferredteacherid . '.';
                            $request->timemodified = time();
                            $DB->update_record('local_prequran_intake_request', $request);
                        }
                    }
                    $createdteacherrequestid = $teacherrequestid;
                    pqsil_audit('student_intake_request_transferred', 'intake_request', $requestid, [
                        'studentid' => $studentid,
                        'profileid' => $profileid,
                        'parentid' => $parentid,
                        'workspaceid' => pqsil_workspaceid_for_intake_request($request),
                        'preferredteacherid' => $preferredteacherid,
                        'teacherrequestid' => $teacherrequestid,
                    ]);
                }
            }

            if ($pqsiisindependentteacher && !$pqsiisoperationsuser && empty($createdteacherrequestid)) {
                $createdteacherrequestid = pqsil_upsert_teacher_marketplace_request(
                    (int)$USER->id,
                    $parentid,
                    $studentid,
                    (int)($pqsiconsumercontext->consumerid ?? 0),
                    'New learner invited from independent teacher workspace #' . $workspaceid . '.'
                );
                pqsil_audit('independent_teacher_student_connection_requested', 'teacher_request', $createdteacherrequestid, [
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
                    $parentemailsent = pqsil_send_parent_intake_email($parentuser, $studentuserforemail, $approvalurl, $parentcreated);
                }
                pqsil_audit('student_intake_parent_email', 'student', $studentid, [
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
            // Legacy redirect + $SESSION->pqsi_created panel -> direct JSON.
            echo json_encode([
                'ok' => true,
                'message' => !empty($created['approvalurl'])
                    ? 'Student intake completed. Parent/guardian approval is required before the student can start lessons.'
                    : 'Student intake completed. The student is now ready for grouping and lessons.',
                'created' => $created,
                'workspaceid' => $workspaceid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            if ($transaction) {
                try {
                    $transaction->rollback($e);
                } catch (Throwable $rollbackerror) {
                    $e = $rollbackerror;
                }
            }
            if ($e->getMessage() === '__validation__') {
                $fieldlabels = [];
                foreach ($fielderrors as $fieldname => $unused) {
                    $fieldlabels[$fieldname] = pqsil_field_label((string)$fieldname);
                }
                http_response_code(400);
                echo json_encode([
                    'ok' => false,
                    'error' => 'Please fix the highlighted fields below.',
                    'fielderrors' => $fielderrors,
                    'fieldlabels' => $fieldlabels,
                ], JSON_UNESCAPED_SLASHES);
                exit;
            }
            pqpd_fail(400, 'Student intake did not complete: ' . $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown student-intake action.');
}

// -- GET: wizard bootstrap (same resolution order as the page pre-render) -----
$getrequestid = optional_param('requestid', 0, PARAM_INT);
$getworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$bootform = $pqsidefaultform;
if ($getrequestid > 0) {
    $bootform['requestid'] = (string)$getrequestid;
}
if ($getworkspaceid <= 0 && $getrequestid > 0) {
    $getworkspaceid = pqsil_workspaceid_for_requestid($getrequestid);
}
if ($getworkspaceid <= 0 && $pqsiisindependentteacher) {
    $getworkspaceid = pqh_current_workspace_id($userid, 0);
}
if ($getworkspaceid > 0) {
    if (!$pqsiisoperationsuser && !pqh_user_can_teach_in_workspace($userid, $getworkspaceid)) {
        pqpd_fail(403, 'This student intake form is not available for that workspace.');
    }
    $bootform['workspaceid'] = (string)$getworkspaceid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'notready_message' => $ready ? '' : 'Student profile table is not ready. Run the Moodle plugin upgrade for local_prequran first.',
    'isoperationsuser' => $pqsiisoperationsuser,
    'isindependentteacher' => $pqsiisindependentteacher,
    'institution' => [
        'type' => $pqsiinstitutiontype,
        'faith_subcategory' => $pqsifaithsubcategory,
        'is_primary_education' => $pqsiisprimaryeducation,
        'is_higher_education' => $pqsiishighereducation,
        'is_technical_training' => $pqsiistechnicaltraining,
        'is_professional_development' => $pqsiisprofessionaldevelopment,
        'is_adult_learning' => $pqsiisadultlearning,
        'is_islamic_studies' => $pqsiisislamicstudies,
        'is_christian_studies' => $pqsiischristianstudies,
    ],
    'requestid' => $getrequestid,
    'workspaceid' => $getworkspaceid,
    'form' => $bootform,
    'options' => $pqsioptions,
], JSON_UNESCAPED_SLASHES);
exit;
