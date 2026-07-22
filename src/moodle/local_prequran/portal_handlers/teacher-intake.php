<?php
// ---- report: teacher-intake (academy-ops teacher onboarding wizard) ----------
// Ported from local_hubredirect/teacher_intake.php via teacher_intake_portallib
// (pqtil_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = wizard bootstrap: option lists (teacher_intake_config.php + workspace
//        course types), prefill from a public application (?teacher_requestid=)
//        or an existing teacher (?existing_teacherid=), recent applications,
//        conversion checklist, schema-readiness state. Opening a 'new'
//        application marks it 'reviewing' exactly like the page does.
// POST = do=submit_intake: the page's single submit action verbatim (same
//        validation order and error messages, same transaction: user create/
//        link, profile upsert, workspace member upsert, availability slots,
//        audit, application -> converted). confirm_sesskey() dropped: token
//        auth replaces the session key. No file uploads exist on this page.
// Consumer context comes from the same request params the page reads
// (?consumer=<slug>&workspaceid=) via pqh_requested_consumer_context().

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/local/hubredirect/account_ids.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_intake_portallib.php');

$pqtioptions = require($CFG->dirroot . '/local/hubredirect/teacher_intake_config.php');

$userid = (int)($claims['sub'] ?? 0);

// Legacy entry check: pqh_require_academy_operations(...) -> pqh_access_denied.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can create teacher intake records.');
}

// JSON-body equivalents of the page's pqti_trim_param / pqti_array_param /
// pqti_single_array_param (same PARAM_TEXT cleaning, same trim/filter order).
function pqtih_body_trim(array $body, string $name, string $default = ''): string {
    $value = $body[$name] ?? $default;
    if (is_array($value)) {
        $value = $default;
    }
    return trim(clean_param((string)$value, PARAM_TEXT));
}

function pqtih_body_array(array $body, string $name): array {
    $raw = $body[$name] ?? [];
    if (!is_array($raw)) {
        $raw = $raw === '' || $raw === null ? [] : [$raw];
    }
    return array_values(array_filter(array_map(static function($value): string {
        return trim(clean_param((string)$value, PARAM_TEXT));
    }, $raw), static function($value): bool {
        return $value !== '';
    }));
}

function pqtih_body_single_array(array $body, string $name): array {
    $values = pqtih_body_array($body, $name);
    return $values ? [reset($values)] : [];
}

// Consumer / institution context — identical resolution to the page.
$consumercontext = pqh_requested_consumer_context();
$pqtioptions['course_types'] = pqco_workspace_course_options($consumercontext, [], false);
$pqtiinstitutiontype = pqhi_clean_institution_type((string)($consumercontext->institution_type ?? ''), '');
$pqtifaithsubcategory = pqhi_clean_faith_subcategory((string)($consumercontext->faith_subcategory ?? ''));
$pqtiisprimaryeducation = $pqtiinstitutiontype === 'primary_education';
$pqtiishighereducation = $pqtiinstitutiontype === 'higher_education';
$pqtiistechnicaltraining = $pqtiinstitutiontype === 'technical_training';
$pqtiisadultlearning = $pqtiinstitutiontype === 'adult_learning';
$pqtiisprofessionaldevelopment = $pqtiinstitutiontype === 'professional_development';
$pqtiisfaithbased = $pqtiinstitutiontype === 'faith_based_education';
$pqtifaithsubjectoptionkey = $pqtifaithsubcategory === 'christian_studies' ? 'christian_teacher_subjects' : ($pqtifaithsubcategory === 'hindu_studies' ? 'hindu_teacher_subjects' : 'islamic_teacher_subjects');
$pqtifaithscripturelabel = $pqtifaithsubcategory === 'christian_studies' ? 'Bible knowledge proficiency' : ($pqtifaithsubcategory === 'hindu_studies' ? 'Hindu scripture proficiency' : 'Quran proficiency');
$pqtifaithinterpretationlabel = $pqtifaithsubcategory === 'christian_studies' ? 'Theology level' : ($pqtifaithsubcategory === 'hindu_studies' ? 'Philosophy and interpretation level' : 'Tafsir level');
$pqtifaithlanguagelabel = $pqtifaithsubcategory === 'christian_studies' ? 'Biblical-language proficiency' : ($pqtifaithsubcategory === 'hindu_studies' ? 'Sanskrit proficiency' : 'Arabic proficiency');
$pqtifaithpracticelabel = $pqtifaithsubcategory === 'christian_studies' ? 'Ministry or liturgical-practice experience' : ($pqtifaithsubcategory === 'hindu_studies' ? 'Devotional or liturgical-practice experience' : 'Tajweed and recitation proficiency');
$contextworkspaceid = (int)$consumercontext->workspaceid;

$ready = pqtil_ready();
$missingprofilecolumns = $ready ? pqtil_missing_profile_columns() : [];
$error = '';
$fielderrors = [];
$recentapplications = [];

// The page's full form-state default array, verbatim.
$form = [
    'teacher_requestid' => '',
    'workspaceid' => $contextworkspaceid > 0 ? (string)$contextworkspaceid : '',
    'existing_teacherid' => '',
    'teacher_firstname' => '',
    'teacher_lastname' => '',
    'teacher_display_name' => '',
    'teacher_contact' => '',
    'teacher_phone' => '',
    'teacher_username' => '',
    'preferred_contact' => 'email',
    'gender' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => '',
    'primary_language' => '',
    'other_languages' => [],
    'teacher_work_models' => [],
    'service_modes' => [],
    'subject_language' => '',
    'subject_areas' => [],
    'subject_other' => '',
    'age_groups' => [],
    'general_levels' => [],
    'workspace_preferences' => '',
    'years_experience' => '',
    'institution_experience' => '',
    'teaching_experience_range' => '',
    'highest_qualification' => '',
    'qualification_title' => '',
    'awarding_institution' => '',
    'graduation_year' => '',
    'teaching_qualification' => '',
    'preferred_teaching_format' => '',
    'preferred_learner_arrangement' => '',
    'preferred_weekly_hours' => '',
    'available_start_date' => '',
    'technology_readiness' => '',
    'teacher_support_needs' => '',
    'professional_reference' => '',
    'verification_consent' => '',
    'referral_source' => '',
    'primary_grades_taught' => [],
    'primary_curricula_taught' => [],
    'primary_classroom_management' => '',
    'primary_parent_communication' => '',
    'primary_safeguarding_status' => '',
    'primary_learning_support' => '',
    'primary_lesson_assessment' => '',
    'primary_teaching_credential' => '',
    'primary_background_check' => '',
    'primary_teacher_notes' => '',
    'higher_teacher_academic_rank' => '',
    'higher_teacher_disciplines' => [],
    'higher_teacher_experience' => '',
    'higher_teacher_research_level' => '',
    'higher_teacher_publications' => '',
    'higher_teacher_supervision' => [],
    'higher_teacher_course_design' => '',
    'higher_teacher_assessment' => '',
    'higher_teacher_accreditation' => '',
    'higher_teacher_notes' => '',
    'technical_teacher_trades' => [],
    'technical_teacher_industry_experience' => '',
    'technical_teacher_qualification' => '',
    'technical_teacher_licenses' => '',
    'technical_teacher_workshop_level' => '',
    'technical_teacher_equipment_level' => '',
    'technical_teacher_safety_status' => '',
    'technical_teacher_apprenticeship' => '',
    'technical_teacher_assessment' => '',
    'technical_teacher_workplace_training' => '',
    'technical_teacher_notes' => '',
    'adult_teacher_areas' => [],
    'adult_teacher_experience' => '',
    'adult_teacher_literacy_instruction' => '',
    'adult_teacher_numeracy_instruction' => '',
    'adult_teacher_digital_instruction' => '',
    'adult_teacher_multilevel_facilitation' => '',
    'adult_teacher_confidence_support' => '',
    'adult_teacher_community_outreach' => '',
    'adult_teacher_barrier_support' => '',
    'adult_teacher_notes' => '',
    'professional_teacher_areas' => [],
    'professional_teacher_industry_experience' => '',
    'professional_teacher_responsibility' => '',
    'professional_teacher_credentials' => '',
    'professional_teacher_facilitation' => '',
    'professional_teacher_coaching' => '',
    'professional_teacher_corporate_training' => '',
    'professional_teacher_cpd' => '',
    'professional_teacher_outcome_measurement' => '',
    'professional_teacher_case_studies' => '',
    'professional_teacher_notes' => '',
    'faith_teacher_subjects' => [],
    'faith_teacher_experience' => '',
    'faith_teacher_qualification' => '',
    'faith_teacher_scripture_proficiency' => '',
    'faith_teacher_interpretation_level' => '',
    'faith_teacher_language_level' => '',
    'faith_teacher_practice_level' => '',
    'faith_teacher_community_experience' => '',
    'faith_teacher_reference' => '',
    'faith_teacher_notes' => '',
    'online_profile_name' => '',
    'instagram_handle' => '',
    'social_profile_url' => '',
    'website_or_booking_url' => '',
    'demo_video_url' => '',
    'teaching_offer_summary' => '',
    'learner_outcomes' => '',
    'curriculum_materials' => '',
    'social_proof' => '',
    'courses_taught' => [],
    'levels_taught' => [],
    'session_count' => '1',
    'slots' => [],
    'availability_summary' => '',
    'max_students_per_class' => '9',
    'max_weekly_hours' => '10',
    'bbb_trained' => '',
    'safeguarding_trained' => '',
    'recording_qa_ack' => '',
    'status' => 'pending',
    'marketplace_visible' => '',
    'marketplace_status' => 'draft',
    'marketplace_bio' => '',
    'marketplace_skills' => '',
    'marketplace_experience' => '',
    'marketplace_education' => '',
    'marketplace_teaching_style' => '',
    'marketplace_courses' => '',
    'vetting_status' => 'not_reviewed',
    'vetting_summary' => '',
    'admin_notes' => '',
];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: submit_intake (legacy submit_intake=1, verbatim) --------------
    if ($do === 'submit_intake') {
        foreach ($form as $key => $default) {
            if ($key === 'teacher_work_models') {
                $form[$key] = pqtil_work_model_values(pqtih_body_single_array($body, $key));
            } else {
                $form[$key] = is_array($default) ? pqtih_body_array($body, $key) : pqtih_body_trim($body, $key, (string)$default);
            }
        }

        $transaction = null;
        try {
            // confirm_sesskey() dropped: token auth replaces the session key.
            if (!$ready) {
                throw new invalid_parameter_exception('Teacher profile table is not ready.');
            }
            if ($missingprofilecolumns) {
                throw new RuntimeException('Teacher profile table is missing columns needed to save the updated intake fields: ' . implode(', ', $missingprofilecolumns));
            }

            $existingteacherid = (int)$form['existing_teacherid'];
            $teacherrequestid = (int)$form['teacher_requestid'];
            $workspaceid = (int)$form['workspaceid'];
            if ($workspaceid <= 0 && $teacherrequestid > 0) {
                $workspaceid = pqtil_workspaceid_for_requestid($teacherrequestid);
            }
            if ($workspaceid <= 0) {
                $workspaceid = $contextworkspaceid;
            }
            $form['workspaceid'] = $workspaceid > 0 ? (string)$workspaceid : '';
            $firstname = $form['teacher_firstname'];
            $lastname = $form['teacher_lastname'];
            $displayname = $form['teacher_display_name'] !== '' ? $form['teacher_display_name'] : trim($firstname . ' ' . $lastname);
            $contact = $form['teacher_contact'];
            $phone = $form['teacher_phone'];
            $city = $form['city'];
            $cityother = $form['city_other'];
            $savedcity = $city === 'Other' ? $cityother : $city;

            if ($existingteacherid <= 0) {
                if ($firstname === '') {
                    $fielderrors['teacher_firstname'] = 'First name is required when creating a new teacher account.';
                }
                if ($lastname === '') {
                    $fielderrors['teacher_lastname'] = 'Last name is required when creating a new teacher account.';
                }
                if ($contact === '' && $phone === '') {
                    $fielderrors['teacher_contact'] = 'Enter a teacher email or phone number.';
                }
            } else {
                pqtil_existing_user($existingteacherid);
            }

            foreach ([
                'gender' => 'Gender is required.',
                'country' => 'Country is required.',
                'city' => 'City is required.',
                'timezone' => 'Time zone is required.',
                'primary_language' => 'Primary teaching language is required.',
                'status' => 'Teacher status is required.',
                'teaching_experience_range' => 'Teaching or training experience is required.',
                'highest_qualification' => 'Highest qualification is required.',
                'preferred_teaching_format' => 'Preferred teaching format is required.',
            ] as $field => $fieldmessage) {
                if (trim((string)$form[$field]) === '') {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
            if ((string)$form['verification_consent'] !== '1') {
                $fielderrors['verification_consent'] = 'Consent to verify qualifications and references is required.';
            }
            foreach ([
                'teaching_experience_range' => 'teaching_experience_ranges',
                'highest_qualification' => 'teacher_qualification_levels',
                'preferred_teaching_format' => 'preferred_teaching_formats',
                'preferred_learner_arrangement' => 'preferred_learner_arrangements',
                'technology_readiness' => 'technology_readiness_options',
                'professional_reference' => 'professional_reference_options',
            ] as $field => $optionkey) {
                if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                    $fielderrors[$field] = 'Select a valid option.';
                }
            }
            if ($pqtiisprimaryeducation) {
                if (!$form['primary_grades_taught']) {
                    $fielderrors['primary_grades_taught'] = 'Select at least one primary grade or year level taught.';
                }
                if (!$form['primary_curricula_taught']) {
                    $fielderrors['primary_curricula_taught'] = 'Select at least one primary curriculum taught.';
                }
                foreach ([
                    'primary_classroom_management' => 'Classroom-management experience is required.',
                    'primary_safeguarding_status' => 'Child-safeguarding training status is required.',
                ] as $field => $message) {
                    if ((string)$form[$field] === '') {
                        $fielderrors[$field] = $message;
                    }
                }
                foreach ([
                    'primary_classroom_management' => 'primary_classroom_management_levels',
                    'primary_parent_communication' => 'primary_parent_communication_levels',
                    'primary_safeguarding_status' => 'primary_safeguarding_statuses',
                    'primary_learning_support' => 'primary_learning_support_levels',
                    'primary_lesson_assessment' => 'primary_assessment_experience_options',
                    'primary_background_check' => 'primary_background_check_statuses',
                ] as $field => $optionkey) {
                    if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                        $fielderrors[$field] = 'Select a valid option.';
                    }
                }
                foreach ([
                    'primary_grades_taught' => 'primary_teacher_grade_levels',
                    'primary_curricula_taught' => 'primary_teacher_curricula',
                ] as $field => $optionkey) {
                    foreach ($form[$field] as $value) {
                        if (!array_key_exists((string)$value, $pqtioptions[$optionkey] ?? [])) {
                            $fielderrors[$field] = 'Select valid options.';
                            break;
                        }
                    }
                }
            }
            if ($pqtiishighereducation) {
                if (!$form['higher_teacher_disciplines']) {
                    $fielderrors['higher_teacher_disciplines'] = 'Select at least one higher-education discipline.';
                }
                foreach ([
                    'higher_teacher_academic_rank' => 'Academic rank or teaching role is required.',
                    'higher_teacher_experience' => 'Higher-education teaching experience is required.',
                    'higher_teacher_course_design' => 'Course-design experience is required.',
                    'higher_teacher_assessment' => 'Assessment experience is required.',
                ] as $field => $message) {
                    if ((string)$form[$field] === '') {
                        $fielderrors[$field] = $message;
                    }
                }
                foreach ([
                    'higher_teacher_academic_rank' => 'higher_teacher_academic_ranks',
                    'higher_teacher_experience' => 'higher_teacher_experience_levels',
                    'higher_teacher_research_level' => 'higher_teacher_research_levels',
                    'higher_teacher_course_design' => 'higher_teacher_course_design_levels',
                    'higher_teacher_assessment' => 'higher_teacher_assessment_levels',
                    'higher_teacher_accreditation' => 'higher_teacher_accreditation_levels',
                ] as $field => $optionkey) {
                    if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                        $fielderrors[$field] = 'Select a valid option.';
                    }
                }
                foreach ([
                    'higher_teacher_disciplines' => 'higher_teacher_disciplines',
                    'higher_teacher_supervision' => 'higher_teacher_supervision_levels',
                ] as $field => $optionkey) {
                    foreach ($form[$field] as $value) {
                        if (!array_key_exists((string)$value, $pqtioptions[$optionkey] ?? [])) {
                            $fielderrors[$field] = 'Select valid options.';
                            break;
                        }
                    }
                }
            }
            if ($pqtiistechnicaltraining) {
                if (!$form['technical_teacher_trades']) {
                    $fielderrors['technical_teacher_trades'] = 'Select at least one technical trade or programme taught.';
                }
                foreach ([
                    'technical_teacher_industry_experience' => 'Relevant industry experience is required.',
                    'technical_teacher_equipment_level' => 'Tools and equipment competence is required.',
                    'technical_teacher_safety_status' => 'Safety-certification status is required.',
                ] as $field => $message) {
                    if ((string)$form[$field] === '') {
                        $fielderrors[$field] = $message;
                    }
                }
                foreach ([
                    'technical_teacher_industry_experience' => 'technical_teacher_industry_experience',
                    'technical_teacher_workshop_level' => 'technical_teacher_practical_levels',
                    'technical_teacher_equipment_level' => 'technical_teacher_practical_levels',
                    'technical_teacher_safety_status' => 'technical_teacher_safety_statuses',
                    'technical_teacher_apprenticeship' => 'technical_teacher_supervision_levels',
                    'technical_teacher_assessment' => 'technical_teacher_assessment_levels',
                    'technical_teacher_workplace_training' => 'technical_teacher_workplace_training_levels',
                ] as $field => $optionkey) {
                    if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                        $fielderrors[$field] = 'Select a valid option.';
                    }
                }
                foreach ($form['technical_teacher_trades'] as $value) {
                    if (!array_key_exists((string)$value, $pqtioptions['technical_teacher_trades'] ?? [])) {
                        $fielderrors['technical_teacher_trades'] = 'Select valid trades.';
                        break;
                    }
                }
            }
            if ($pqtiisadultlearning) {
                if (!$form['adult_teacher_areas']) {
                    $fielderrors['adult_teacher_areas'] = 'Select at least one adult-learning area taught.';
                }
                foreach ([
                    'adult_teacher_experience' => 'Adult-learning teaching experience is required.',
                    'adult_teacher_multilevel_facilitation' => 'Multi-level facilitation experience is required.',
                    'adult_teacher_confidence_support' => 'Experience supporting adults returning to learning is required.',
                ] as $field => $message) {
                    if ((string)$form[$field] === '') {
                        $fielderrors[$field] = $message;
                    }
                }
                foreach ([
                    'adult_teacher_experience' => 'adult_teacher_experience_levels',
                    'adult_teacher_literacy_instruction' => 'adult_teacher_instruction_levels',
                    'adult_teacher_numeracy_instruction' => 'adult_teacher_instruction_levels',
                    'adult_teacher_digital_instruction' => 'adult_teacher_instruction_levels',
                    'adult_teacher_multilevel_facilitation' => 'adult_teacher_facilitation_levels',
                    'adult_teacher_confidence_support' => 'adult_teacher_learner_support_levels',
                    'adult_teacher_community_outreach' => 'adult_teacher_community_levels',
                    'adult_teacher_barrier_support' => 'adult_teacher_barrier_support_levels',
                ] as $field => $optionkey) {
                    if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                        $fielderrors[$field] = 'Select a valid option.';
                    }
                }
                foreach ($form['adult_teacher_areas'] as $value) {
                    if (!array_key_exists((string)$value, $pqtioptions['adult_teacher_learning_areas'] ?? [])) {
                        $fielderrors['adult_teacher_areas'] = 'Select valid adult-learning areas.';
                        break;
                    }
                }
            }
            if ($pqtiisprofessionaldevelopment) {
                if (!$form['professional_teacher_areas']) {
                    $fielderrors['professional_teacher_areas'] = 'Select at least one professional-development area.';
                }
                foreach ([
                    'professional_teacher_industry_experience' => 'Relevant industry experience is required.',
                    'professional_teacher_facilitation' => 'Facilitation experience is required.',
                    'professional_teacher_outcome_measurement' => 'Workplace-outcome measurement experience is required.',
                ] as $field => $message) {
                    if ((string)$form[$field] === '') {
                        $fielderrors[$field] = $message;
                    }
                }
                foreach ([
                    'professional_teacher_industry_experience' => 'professional_teacher_industry_experience',
                    'professional_teacher_responsibility' => 'professional_teacher_responsibility_levels',
                    'professional_teacher_facilitation' => 'professional_teacher_facilitation_levels',
                    'professional_teacher_coaching' => 'professional_teacher_coaching_levels',
                    'professional_teacher_corporate_training' => 'professional_teacher_corporate_levels',
                    'professional_teacher_cpd' => 'professional_teacher_cpd_levels',
                    'professional_teacher_outcome_measurement' => 'professional_teacher_outcome_levels',
                ] as $field => $optionkey) {
                    if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                        $fielderrors[$field] = 'Select a valid option.';
                    }
                }
                foreach ($form['professional_teacher_areas'] as $value) {
                    if (!array_key_exists((string)$value, $pqtioptions['professional_teacher_areas'] ?? [])) {
                        $fielderrors['professional_teacher_areas'] = 'Select valid professional-development areas.';
                        break;
                    }
                }
            }
            if ($pqtiisfaithbased) {
                if (!$form['faith_teacher_subjects']) {
                    $fielderrors['faith_teacher_subjects'] = 'Select at least one faith-study area taught.';
                }
                foreach ([
                    'faith_teacher_experience' => 'Faith-based teaching experience is required.',
                    'faith_teacher_qualification' => 'Relevant faith-study qualification or authorisation is required.',
                    'faith_teacher_scripture_proficiency' => 'Scripture proficiency is required.',
                ] as $field => $message) {
                    if ((string)$form[$field] === '') {
                        $fielderrors[$field] = $message;
                    }
                }
                foreach ([
                    'faith_teacher_experience' => 'faith_teacher_experience_levels',
                    'faith_teacher_scripture_proficiency' => 'faith_teacher_proficiency_levels',
                    'faith_teacher_interpretation_level' => 'faith_teacher_interpretation_levels',
                    'faith_teacher_language_level' => 'faith_teacher_language_levels',
                    'faith_teacher_practice_level' => 'faith_teacher_practice_levels',
                    'faith_teacher_community_experience' => 'faith_teacher_community_levels',
                    'faith_teacher_reference' => 'faith_teacher_reference_options',
                ] as $field => $optionkey) {
                    if ((string)$form[$field] !== '' && !array_key_exists((string)$form[$field], $pqtioptions[$optionkey] ?? [])) {
                        $fielderrors[$field] = 'Select a valid option.';
                    }
                }
                foreach ($form['faith_teacher_subjects'] as $value) {
                    if (!array_key_exists((string)$value, $pqtioptions[$pqtifaithsubjectoptionkey] ?? [])) {
                        $fielderrors['faith_teacher_subjects'] = 'Select valid faith-study areas.';
                        break;
                    }
                }
            }
            if ($city === 'Other' && $cityother === '') {
                $fielderrors['city_other'] = 'Enter the city name.';
            }
            if (!$form['teacher_work_models']) {
                $fielderrors['teacher_work_models'] = 'Select whether this teacher is independent or marketplace-only.';
            }
            if (!$form['service_modes']) {
                $fielderrors['service_modes'] = 'Select at least one service mode.';
            }
            if (trim((string)$form['subject_language']) === '' && !$form['subject_areas']) {
                $fielderrors['subject_areas'] = 'Select at least one subject area or choose a language subject.';
            }
            if (in_array('other_subjects', $form['subject_areas'], true) && trim((string)$form['subject_other']) === '') {
                $fielderrors['subject_other'] = 'Describe the other subject area.';
            }
            if (!$form['age_groups']) {
                $fielderrors['age_groups'] = 'Select at least one learner level.';
            }
            if (!$form['general_levels']) {
                $fielderrors['general_levels'] = 'Select at least one teaching level.';
            }
            if ((int)$form['max_students_per_class'] <= 0 || (int)$form['max_students_per_class'] > 20) {
                $fielderrors['max_students_per_class'] = 'Enter a class size between 1 and 20.';
            }
            if ((int)$form['max_weekly_hours'] <= 0 || (int)$form['max_weekly_hours'] > 60) {
                $fielderrors['max_weekly_hours'] = 'Enter weekly live hours between 1 and 60.';
            }
            if ($form['years_experience'] !== '' && ((int)$form['years_experience'] < 0 || (int)$form['years_experience'] > 80)) {
                $fielderrors['years_experience'] = 'Enter years of experience between 0 and 80.';
            }
            if ($form['preferred_weekly_hours'] !== '' && ((int)$form['preferred_weekly_hours'] < 1 || (int)$form['preferred_weekly_hours'] > 60)) {
                $fielderrors['preferred_weekly_hours'] = 'Enter preferred weekly hours between 1 and 60.';
            }
            if ($form['graduation_year'] !== '' && ((int)$form['graduation_year'] < 1900 || (int)$form['graduation_year'] > 2100)) {
                $fielderrors['graduation_year'] = 'Enter a valid graduation year.';
            }
            if ((int)$form['session_count'] <= 0 || (int)$form['session_count'] > 5) {
                $fielderrors['session_count'] = 'Select a number of sessions between 1 and 5.';
            }
            $validdays = array_keys($pqtioptions['availability_days'] ?? []);
            $validhours = array_keys($pqtioptions['availability_time_windows'] ?? []);
            foreach ($form['slots'] as $slot) {
                [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
                if (!in_array($day, $validdays, true) || !in_array($hour, $validhours, true)) {
                    $fielderrors['slots'] = 'Select availability from the weekly calendar.';
                    break;
                }
            }
            foreach ([
                'bbb_trained' => 'Confirm whether BBB/live classroom training is complete.',
                'safeguarding_trained' => 'Confirm whether child safety training is complete.',
                'recording_qa_ack' => 'Confirm whether recording and QA policy was acknowledged.',
            ] as $field => $fieldmessage) {
                if (!in_array((string)$form[$field], ['0', '1'], true)) {
                    $fielderrors[$field] = $fieldmessage;
                }
            }
            if (!in_array((string)$form['marketplace_visible'], ['', '0', '1'], true)) {
                $fielderrors['marketplace_visible'] = 'Choose whether parents can see this marketplace profile.';
            }
            if (!in_array((string)$form['marketplace_status'], ['draft', 'review', 'published', 'paused'], true)) {
                $fielderrors['marketplace_status'] = 'Choose a valid marketplace status.';
            }
            if (!in_array((string)$form['vetting_status'], ['not_reviewed', 'in_review', 'approved', 'needs_update', 'rejected'], true)) {
                $fielderrors['vetting_status'] = 'Choose a valid vetting status.';
            }
            if ($fielderrors) {
                throw new InvalidArgumentException('__validation__');
            }

            $transaction = $DB->start_delegated_transaction();

            $teacherusername = '';
            $teacherpassword = '';
            $existingteacher = false;
            $teacheraccountid = '';
            if ($existingteacherid > 0) {
                $teacheruser = pqtil_existing_user($existingteacherid);
                $teacherid = (int)$teacheruser->id;
                $teacherusername = (string)$teacheruser->username;
                $existingteacher = true;
                if ($displayname === '') {
                    $displayname = fullname($teacheruser);
                }
            } else {
                $preferredcontact = $contact !== '' ? $contact : $phone;
                $teacheremail = pqtil_moodle_email_from_contact($preferredcontact, 'teacher');
                $existinguser = pqtil_find_user_by_email($teacheremail);
                if ($existinguser) {
                    $teacherid = (int)$existinguser->id;
                    $teacherusername = (string)$existinguser->username;
                    $existingteacher = true;
                } else {
                    // Legacy: optional_param('teacher_username', '', PARAM_USERNAME) from the form post.
                    $requestedusername = clean_param((string)($body['teacher_username'] ?? ''), PARAM_USERNAME);
                    $teacherusername = pqtil_unique_username($requestedusername ?: 'teacher.' . $firstname . '.' . $lastname);
                    [$teacherid, $teacherpassword] = pqtil_create_user($firstname, $lastname, $teacheremail, $teacherusername, !pqtil_contact_is_email($preferredcontact));
                }
            }
            $teacheraccountid = pqh_assign_account_id($teacherid, 'teacher');

            $teacheruser = core_user::get_user($teacherid);
            if ($teacheruser) {
                if (core_text::strlen($form['country']) <= 2) {
                    $teacheruser->country = core_text::strtoupper($form['country']);
                }
                $teacheruser->city = $savedcity;
                $teacheruser->timezone = $form['timezone'];
                user_update_user($teacheruser, false, false);
            }

            $isindependentteacher = in_array('independent_teacher', $form['teacher_work_models'], true);
            if ($isindependentteacher) {
                $independentworkspaceid = pqtil_ensure_independent_teacher_workspace($teacherid, $displayname, $consumercontext);
                if ($independentworkspaceid > 0) {
                    $workspaceid = $independentworkspaceid;
                    $form['workspaceid'] = (string)$workspaceid;
                }
            }

            $slotsummary = pqtil_slot_summary(
                $form['slots'],
                $pqtioptions['availability_days'] ?? [],
                $pqtioptions['availability_time_windows'] ?? [],
                (int)$form['session_count']
            );
            $availabilitysummary = trim((string)$form['availability_summary']);
            if ($slotsummary !== '') {
                $availabilitysummary = $availabilitysummary !== '' ? $slotsummary . "\nNotes: " . $availabilitysummary : $slotsummary;
            }

            $data = [
                'teacher_display_name' => $displayname,
                'teacher_phone' => $phone,
                'preferred_contact' => $form['preferred_contact'],
                'gender' => $form['gender'],
                'country' => $form['country'],
                'city' => $savedcity,
                'timezone' => $form['timezone'],
                'primary_language' => $form['primary_language'],
                'other_languages' => implode(', ', pqtil_labels($form['other_languages'], $pqtioptions['other_languages'] ?? [])),
                'teacher_work_models' => implode(', ', pqtil_labels($form['teacher_work_models'], $pqtioptions['teacher_work_models'] ?? [])),
                'service_modes' => implode(', ', pqtil_labels($form['service_modes'], $pqtioptions['service_modes'] ?? [])),
                'subject_language' => (string)($pqtioptions['subject_languages'][$form['subject_language']] ?? $form['subject_language']),
                'subject_areas' => implode(', ', pqtil_labels($form['subject_areas'], $pqtioptions['subject_areas'] ?? [])),
                'subject_other' => $form['subject_other'],
                'age_groups' => implode(', ', pqtil_labels($form['age_groups'], $pqtioptions['age_groups'] ?? [])),
                'general_levels' => implode(', ', pqtil_labels($form['general_levels'], $pqtioptions['general_levels'] ?? [])),
                'workspace_preferences' => $form['workspace_preferences'],
                'years_experience' => (int)$form['years_experience'],
                'institution_experience' => $form['institution_experience'],
                'application_json' => json_encode([
                    'teacher_work_models' => $form['teacher_work_models'],
                    'service_modes' => $form['service_modes'],
                    'subject_language' => $form['subject_language'],
                    'subject_areas' => $form['subject_areas'],
                    'subject_other' => $form['subject_other'],
                    'age_groups' => $form['age_groups'],
                    'general_levels' => $form['general_levels'],
                    'courses_taught' => $form['courses_taught'],
                    'levels_taught' => $form['levels_taught'],
                    'workspace_preferences' => $form['workspace_preferences'],
                    'years_experience' => (int)$form['years_experience'],
                    'institution_experience' => $form['institution_experience'],
                    'preferred_contact' => $form['preferred_contact'],
                    'teaching_experience_range' => $form['teaching_experience_range'],
                    'highest_qualification' => $form['highest_qualification'],
                    'qualification_title' => $form['qualification_title'],
                    'awarding_institution' => $form['awarding_institution'],
                    'graduation_year' => $form['graduation_year'],
                    'teaching_qualification' => $form['teaching_qualification'],
                    'preferred_teaching_format' => $form['preferred_teaching_format'],
                    'preferred_learner_arrangement' => $form['preferred_learner_arrangement'],
                    'preferred_weekly_hours' => $form['preferred_weekly_hours'],
                    'available_start_date' => $form['available_start_date'],
                    'technology_readiness' => $form['technology_readiness'],
                    'teacher_support_needs' => $form['teacher_support_needs'],
                    'professional_reference' => $form['professional_reference'],
                    'verification_consent' => $form['verification_consent'],
                    'referral_source' => $form['referral_source'],
                    'primary_grades_taught' => $form['primary_grades_taught'],
                    'primary_curricula_taught' => $form['primary_curricula_taught'],
                    'primary_classroom_management' => $form['primary_classroom_management'],
                    'primary_parent_communication' => $form['primary_parent_communication'],
                    'primary_safeguarding_status' => $form['primary_safeguarding_status'],
                    'primary_learning_support' => $form['primary_learning_support'],
                    'primary_lesson_assessment' => $form['primary_lesson_assessment'],
                    'primary_teaching_credential' => $form['primary_teaching_credential'],
                    'primary_background_check' => $form['primary_background_check'],
                    'primary_teacher_notes' => $form['primary_teacher_notes'],
                    'higher_teacher_academic_rank' => $form['higher_teacher_academic_rank'],
                    'higher_teacher_disciplines' => $form['higher_teacher_disciplines'],
                    'higher_teacher_experience' => $form['higher_teacher_experience'],
                    'higher_teacher_research_level' => $form['higher_teacher_research_level'],
                    'higher_teacher_publications' => $form['higher_teacher_publications'],
                    'higher_teacher_supervision' => $form['higher_teacher_supervision'],
                    'higher_teacher_course_design' => $form['higher_teacher_course_design'],
                    'higher_teacher_assessment' => $form['higher_teacher_assessment'],
                    'higher_teacher_accreditation' => $form['higher_teacher_accreditation'],
                    'higher_teacher_notes' => $form['higher_teacher_notes'],
                    'technical_teacher_trades' => $form['technical_teacher_trades'],
                    'technical_teacher_industry_experience' => $form['technical_teacher_industry_experience'],
                    'technical_teacher_qualification' => $form['technical_teacher_qualification'],
                    'technical_teacher_licenses' => $form['technical_teacher_licenses'],
                    'technical_teacher_workshop_level' => $form['technical_teacher_workshop_level'],
                    'technical_teacher_equipment_level' => $form['technical_teacher_equipment_level'],
                    'technical_teacher_safety_status' => $form['technical_teacher_safety_status'],
                    'technical_teacher_apprenticeship' => $form['technical_teacher_apprenticeship'],
                    'technical_teacher_assessment' => $form['technical_teacher_assessment'],
                    'technical_teacher_workplace_training' => $form['technical_teacher_workplace_training'],
                    'technical_teacher_notes' => $form['technical_teacher_notes'],
                    'adult_teacher_areas' => $form['adult_teacher_areas'],
                    'adult_teacher_experience' => $form['adult_teacher_experience'],
                    'adult_teacher_literacy_instruction' => $form['adult_teacher_literacy_instruction'],
                    'adult_teacher_numeracy_instruction' => $form['adult_teacher_numeracy_instruction'],
                    'adult_teacher_digital_instruction' => $form['adult_teacher_digital_instruction'],
                    'adult_teacher_multilevel_facilitation' => $form['adult_teacher_multilevel_facilitation'],
                    'adult_teacher_confidence_support' => $form['adult_teacher_confidence_support'],
                    'adult_teacher_community_outreach' => $form['adult_teacher_community_outreach'],
                    'adult_teacher_barrier_support' => $form['adult_teacher_barrier_support'],
                    'adult_teacher_notes' => $form['adult_teacher_notes'],
                    'professional_teacher_areas' => $form['professional_teacher_areas'],
                    'professional_teacher_industry_experience' => $form['professional_teacher_industry_experience'],
                    'professional_teacher_responsibility' => $form['professional_teacher_responsibility'],
                    'professional_teacher_credentials' => $form['professional_teacher_credentials'],
                    'professional_teacher_facilitation' => $form['professional_teacher_facilitation'],
                    'professional_teacher_coaching' => $form['professional_teacher_coaching'],
                    'professional_teacher_corporate_training' => $form['professional_teacher_corporate_training'],
                    'professional_teacher_cpd' => $form['professional_teacher_cpd'],
                    'professional_teacher_outcome_measurement' => $form['professional_teacher_outcome_measurement'],
                    'professional_teacher_case_studies' => $form['professional_teacher_case_studies'],
                    'professional_teacher_notes' => $form['professional_teacher_notes'],
                    'faith_subcategory' => $pqtifaithsubcategory,
                    'faith_teacher_subjects' => $form['faith_teacher_subjects'],
                    'faith_teacher_experience' => $form['faith_teacher_experience'],
                    'faith_teacher_qualification' => $form['faith_teacher_qualification'],
                    'faith_teacher_scripture_proficiency' => $form['faith_teacher_scripture_proficiency'],
                    'faith_teacher_interpretation_level' => $form['faith_teacher_interpretation_level'],
                    'faith_teacher_language_level' => $form['faith_teacher_language_level'],
                    'faith_teacher_practice_level' => $form['faith_teacher_practice_level'],
                    'faith_teacher_community_experience' => $form['faith_teacher_community_experience'],
                    'faith_teacher_reference' => $form['faith_teacher_reference'],
                    'faith_teacher_notes' => $form['faith_teacher_notes'],
                    'online_profile_name' => $form['online_profile_name'],
                    'instagram_handle' => $form['instagram_handle'],
                    'social_profile_url' => $form['social_profile_url'],
                    'website_or_booking_url' => $form['website_or_booking_url'],
                    'demo_video_url' => $form['demo_video_url'],
                    'teaching_offer_summary' => $form['teaching_offer_summary'],
                    'learner_outcomes' => $form['learner_outcomes'],
                    'curriculum_materials' => $form['curriculum_materials'],
                    'social_proof' => $form['social_proof'],
                ], JSON_UNESCAPED_SLASHES),
                'courses_taught' => implode(', ', pqtil_labels($form['courses_taught'], $pqtioptions['course_types'] ?? [])),
                'levels_taught' => implode(', ', pqtil_labels($form['general_levels'], $pqtioptions['general_levels'] ?? [])),
                'max_students_per_class' => (int)$form['max_students_per_class'],
                'max_weekly_hours' => (int)$form['max_weekly_hours'],
                'availability_summary' => $availabilitysummary,
                'bbb_trained' => (int)$form['bbb_trained'],
                'safeguarding_trained' => (int)$form['safeguarding_trained'],
                'recording_qa_ack' => (int)$form['recording_qa_ack'],
                'status' => $form['status'],
                'marketplace_visible' => (int)($form['marketplace_visible'] === '1'),
                'marketplace_status' => $form['marketplace_status'],
                'marketplace_bio' => $form['marketplace_bio'],
                'marketplace_skills' => $form['marketplace_skills'],
                'marketplace_experience' => $form['marketplace_experience'],
                'marketplace_education' => $form['marketplace_education'],
                'marketplace_teaching_style' => $form['marketplace_teaching_style'],
                'marketplace_courses' => $form['marketplace_courses'],
                'vetting_status' => $form['vetting_status'],
                'vetting_summary' => $form['vetting_summary'],
                'vetting_reviewedby' => in_array((string)$form['vetting_status'], ['approved', 'needs_update', 'rejected'], true) ? (int)$USER->id : 0,
                'vetting_reviewedat' => in_array((string)$form['vetting_status'], ['approved', 'needs_update', 'rejected'], true) ? time() : 0,
                'admin_notes' => $form['admin_notes'],
                'consumerid' => (int)$consumercontext->consumerid,
                'workspaceid' => $workspaceid,
            ];

            $profileid = pqtil_save_profile($teacherid, $data);
            if ($workspaceid > 0) {
                pqtil_upsert_workspace_member($workspaceid, $teacherid, 'teacher', 'Added from teacher intake.');
            }
            $availabilityrows = pqtil_save_availability_slots(
                $teacherid,
                $form['slots'],
                $form['timezone'],
                (int)($pqtioptions['availability_slot_minutes'] ?? 60)
            );
            pqtil_audit($existingteacher ? 'teacher_intake_updated' : 'teacher_intake_created', 'teacher', $teacherid, [
                'profileid' => $profileid,
                'existing_teacher' => $existingteacher ? 1 : 0,
                'availability_rows_created' => $availabilityrows,
                'session_count' => (int)$form['session_count'],
                'slots_count' => count($form['slots']),
                'teacher_account_id' => $teacheraccountid,
                'consumerid' => (int)$consumercontext->consumerid,
                'consumerslug' => (string)$consumercontext->consumerslug,
                'teacher_requestid' => $teacherrequestid,
                'workspaceid' => $workspaceid,
            ]);

            if ($teacherrequestid > 0 && pqtil_table_exists('local_prequran_teacher_intake_request')) {
                $teacherrequest = $DB->get_record('local_prequran_teacher_intake_request', ['id' => $teacherrequestid], '*', IGNORE_MISSING);
                if ($teacherrequest) {
                    $teacherrequest->status = 'converted';
                    $teacherrequest->converted_userid = $teacherid;
                    $teacherrequest->converted_profileid = $profileid;
                    if (pqtil_column_exists('local_prequran_teacher_intake_request', 'workspaceid')) {
                        $teacherrequest->workspaceid = $workspaceid;
                    }
                    $teacherrequest->reviewedby = (int)$USER->id;
                    $teacherrequest->reviewedat = time();
                    $teacherrequest->timemodified = time();
                    $DB->update_record('local_prequran_teacher_intake_request', $teacherrequest);
                }
            }

            $transaction->allow_commit();
            $transaction = null;

            // Legacy stores this in $SESSION->pqti_created and redirects; the
            // portal returns the same success payload directly.
            echo json_encode([
                'ok' => true,
                'message' => 'Teacher intake completed. The teacher is now ready for scheduling and BBB assignment.',
                'created' => [
                    'teacherid' => $teacherid,
                    'teacheraccountid' => $teacheraccountid,
                    'teacherusername' => $teacherusername,
                    'teacherpassword' => $teacherpassword,
                    'existingteacher' => $existingteacher,
                    'profileid' => $profileid,
                    'availabilityrows' => $availabilityrows,
                    'consumerid' => (int)$consumercontext->consumerid,
                    'consumerslug' => (string)$consumercontext->consumerslug,
                    'teacherrequestid' => $teacherrequestid,
                    'workspaceid' => $workspaceid,
                ],
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
                // Same page-level message; per-field errors keep the page's
                // exact wording, plus the page's anchor labels for display.
                $fieldlabels = [];
                foreach ($fielderrors as $fieldname => $unused) {
                    $fieldlabels[$fieldname] = pqtil_field_label((string)$fieldname);
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
            pqpd_fail(400, 'Teacher intake did not complete: ' . $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown teacher-intake action.');
}

// -- GET: wizard bootstrap (same prefill resolution order as the page) ---------
$sourceapplication = null;
$prefillrequestid = optional_param('teacher_requestid', 0, PARAM_INT);
if ($prefillrequestid <= 0) {
    $prefillrequestid = optional_param('requestid', 0, PARAM_INT);
}
if ($prefillrequestid > 0) {
    try {
        if (!pqtil_table_exists('local_prequran_teacher_intake_request')) {
            throw new invalid_parameter_exception('Teacher application table is not ready.');
        }
        $teacherrequest = $DB->get_record('local_prequran_teacher_intake_request', ['id' => $prefillrequestid], '*', IGNORE_MISSING);
        if (!$teacherrequest) {
            throw new invalid_parameter_exception('The selected teacher application could not be found.');
        }
        $sourceapplication = clone $teacherrequest;
        $application = pqtil_application_json($teacherrequest);
        [$firstname, $lastname] = pqtil_split_name((string)$teacherrequest->teacher_name);
        $form['teacher_requestid'] = (string)$prefillrequestid;
        if (!empty($teacherrequest->workspaceid)) {
            $form['workspaceid'] = (string)(int)$teacherrequest->workspaceid;
        }
        $form['teacher_firstname'] = $firstname;
        $form['teacher_lastname'] = $lastname;
        $form['teacher_display_name'] = (string)$teacherrequest->teacher_name;
        $form['teacher_contact'] = (string)$teacherrequest->email;
        $form['teacher_phone'] = (string)$teacherrequest->phone;
        $form['preferred_contact'] = validate_email((string)$teacherrequest->email) ? 'email' : 'phone';
        $form['gender'] = pqtil_app_value($application, 'gender');
        $form['country'] = (string)$teacherrequest->country;
        $form['city'] = (string)$teacherrequest->city;
        $form['timezone'] = pqtil_normalize_timezone((string)$teacherrequest->timezone, $pqtioptions['timezones'] ?? []);
        $form['primary_language'] = (string)$teacherrequest->primary_language;
        $form['other_languages'] = pqtil_values_from_labels((string)$teacherrequest->other_languages, $pqtioptions['other_languages'] ?? []);
        $form['teacher_work_models'] = pqtil_work_model_values(pqtil_prefill_values($teacherrequest, $application, 'teacher_work_models', 'teacher_work_model_labels', $pqtioptions['teacher_work_models'] ?? []));
        $form['service_modes'] = pqtil_prefill_values($teacherrequest, $application, 'service_modes', 'service_mode_labels', $pqtioptions['service_modes'] ?? []);
        $form['subject_language'] = pqtil_prefill_select($teacherrequest, $application, 'subject_language', 'subject_language_label', $pqtioptions['subject_languages'] ?? []);
        $form['subject_areas'] = pqtil_prefill_values($teacherrequest, $application, 'subject_areas', 'subject_area_labels', $pqtioptions['subject_areas'] ?? []);
        $form['subject_other'] = pqtil_app_value($application, 'subject_other') !== '' ? pqtil_app_value($application, 'subject_other') : (string)($teacherrequest->subject_other ?? '');
        $form['age_groups'] = pqtil_prefill_values($teacherrequest, $application, 'age_groups', 'age_group_labels', $pqtioptions['age_groups'] ?? []);
        $form['general_levels'] = pqtil_prefill_values($teacherrequest, $application, 'general_levels', 'general_level_labels', $pqtioptions['general_levels'] ?? []);
        if (!$form['general_levels']) {
            $form['general_levels'] = pqtil_values_from_labels((string)($teacherrequest->levels ?? ''), $pqtioptions['general_levels'] ?? []);
        }
        $form['workspace_preferences'] = pqtil_app_value($application, 'workspace_preferences') !== '' ? pqtil_app_value($application, 'workspace_preferences') : (string)($teacherrequest->workspace_preferences ?? '');
        $form['years_experience'] = pqtil_app_value($application, 'years_experience') !== '' ? (string)(int)pqtil_app_value($application, 'years_experience') : (string)(int)($teacherrequest->years_experience ?? 0);
        $form['institution_experience'] = pqtil_app_value($application, 'institution_experience') !== '' ? pqtil_app_value($application, 'institution_experience') : (string)($teacherrequest->institution_experience ?? '');
        foreach ([
            'preferred_contact',
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
        ] as $commonfield) {
            if (pqtil_app_value($application, $commonfield) !== '') {
                $form[$commonfield] = pqtil_app_value($application, $commonfield);
            }
        }
        $form['primary_grades_taught'] = array_values(array_filter((array)($application['primary_grades_taught'] ?? []), 'is_string'));
        $form['primary_curricula_taught'] = array_values(array_filter((array)($application['primary_curricula_taught'] ?? []), 'is_string'));
        $form['higher_teacher_disciplines'] = array_values(array_filter((array)($application['higher_teacher_disciplines'] ?? []), 'is_string'));
        $form['higher_teacher_supervision'] = array_values(array_filter((array)($application['higher_teacher_supervision'] ?? []), 'is_string'));
        $form['technical_teacher_trades'] = array_values(array_filter((array)($application['technical_teacher_trades'] ?? []), 'is_string'));
        $form['adult_teacher_areas'] = array_values(array_filter((array)($application['adult_teacher_areas'] ?? []), 'is_string'));
        $form['professional_teacher_areas'] = array_values(array_filter((array)($application['professional_teacher_areas'] ?? []), 'is_string'));
        $form['faith_teacher_subjects'] = array_values(array_filter((array)($application['faith_teacher_subjects'] ?? []), 'is_string'));
        if (pqtil_app_value($application, 'preferred_name') !== '') {
            $form['teacher_display_name'] = pqtil_app_value($application, 'preferred_name');
        }
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
        ] as $jsonfield) {
            $form[$jsonfield] = pqtil_app_value($application, $jsonfield);
        }
        $form['courses_taught'] = pqtil_values_from_labels((string)$teacherrequest->courses, $pqtioptions['course_types'] ?? []);
        $form['levels_taught'] = $form['general_levels'] ?: pqtil_values_from_labels((string)$teacherrequest->levels, $pqtioptions['current_levels'] ?? []);
        $form['slots'] = pqtil_slots_from_availability_json((string)$teacherrequest->availability_json);
        $form['availability_summary'] = (string)$teacherrequest->availability_summary;
        $form['marketplace_bio'] = pqtil_join_nonempty([
            (string)$teacherrequest->bio,
            pqtil_app_value($application, 'teaching_offer_summary'),
            pqtil_app_value($application, 'learner_outcomes'),
        ], "\n\n");
        $form['marketplace_experience'] = pqtil_join_nonempty([
            (string)$teacherrequest->experience,
            pqtil_app_value($application, 'social_proof') !== '' ? 'Social proof / reviews: ' . pqtil_app_value($application, 'social_proof') : '',
        ], "\n\n");
        $form['marketplace_education'] = (string)$teacherrequest->education;
        $form['marketplace_teaching_style'] = pqtil_join_nonempty([
            (string)$teacherrequest->teaching_style,
            pqtil_app_value($application, 'curriculum_materials') !== '' ? 'Curriculum and materials: ' . pqtil_app_value($application, 'curriculum_materials') : '',
        ], "\n\n");
        $form['marketplace_courses'] = pqtil_join_nonempty([
            (string)($teacherrequest->subject_language ?? ''),
            (string)($teacherrequest->subject_areas ?? ''),
            (string)($teacherrequest->subject_other ?? ''),
            (string)$teacherrequest->courses,
            pqtil_app_value($application, 'teaching_offer_summary'),
        ]);
        $form['marketplace_skills'] = pqtil_join_nonempty([
            (string)($teacherrequest->service_modes ?? ''),
            (string)($teacherrequest->age_groups ?? ''),
            (string)($teacherrequest->general_levels ?? $teacherrequest->levels ?? ''),
            pqtil_app_value($application, 'learner_outcomes') !== '' ? 'Learner outcomes: ' . pqtil_app_value($application, 'learner_outcomes') : '',
        ]);
        $onlineadminnotes = pqtil_join_nonempty([
            pqtil_app_value($application, 'online_profile_name') !== '' ? 'Online profile: ' . pqtil_app_value($application, 'online_profile_name') : '',
            pqtil_app_value($application, 'instagram_handle') !== '' ? 'Social media handle: ' . pqtil_app_value($application, 'instagram_handle') : '',
            pqtil_app_value($application, 'social_profile_url') !== '' ? 'Social profile URL: ' . pqtil_app_value($application, 'social_profile_url') : '',
            pqtil_app_value($application, 'website_or_booking_url') !== '' ? 'Website/booking: ' . pqtil_app_value($application, 'website_or_booking_url') : '',
            pqtil_app_value($application, 'demo_video_url') !== '' ? 'Demo/sample: ' . pqtil_app_value($application, 'demo_video_url') : '',
        ]);
        $form['vetting_status'] = (string)$teacherrequest->status === 'approved' ? 'approved' : 'in_review';
        $form['vetting_summary'] = trim((string)$teacherrequest->admin_notes) !== ''
            ? (string)$teacherrequest->admin_notes
            : 'Loaded from public teacher application #' . $prefillrequestid . '.';
        $form['admin_notes'] = pqtil_join_nonempty([
            trim((string)$teacherrequest->notes) !== '' ? 'Applicant notes: ' . (string)$teacherrequest->notes : 'Loaded from public teacher application #' . $prefillrequestid . '.',
            $onlineadminnotes,
        ], "\n\n");
        $form['marketplace_status'] = 'review';
        $form['marketplace_visible'] = '0';
        if ((int)$teacherrequest->converted_userid > 0) {
            pqtil_apply_teacher_profile_prefill($form, (int)$teacherrequest->converted_userid, $pqtioptions);
        }

        // The page marks a freshly-opened application as 'reviewing' — keep the
        // same write on the portal read.
        if ((string)$teacherrequest->status === 'new') {
            $teacherrequest->status = 'reviewing';
            $teacherrequest->reviewedby = (int)$USER->id;
            $teacherrequest->reviewedat = time();
            $teacherrequest->timemodified = time();
            $DB->update_record('local_prequran_teacher_intake_request', $teacherrequest);
            $sourceapplication = clone $teacherrequest;
        }
    } catch (Throwable $e) {
        $error = 'Could not load teacher application into intake: ' . $e->getMessage();
    }
}

$prefillteacherid = optional_param('existing_teacherid', 0, PARAM_INT);
if ($prefillteacherid > 0 && $prefillrequestid <= 0) {
    try {
        pqtil_apply_teacher_profile_prefill($form, $prefillteacherid, $pqtioptions);
    } catch (Throwable $e) {
        $error = 'Could not load existing teacher intake details: ' . $e->getMessage();
    }
}

if ($prefillrequestid <= 0 && $prefillteacherid <= 0 && pqtil_table_exists('local_prequran_teacher_intake_request')) {
    try {
        $where = '';
        $params = [];
        if ((int)($consumercontext->consumerid ?? 0) > 0 && pqtil_column_exists('local_prequran_teacher_intake_request', 'consumerid')) {
            $where = 'WHERE consumerid = :consumerid';
            $params['consumerid'] = (int)$consumercontext->consumerid;
        }
        $recentapplications = array_values($DB->get_records_sql(
            "SELECT id, teacher_name, email, phone, status, timecreated
               FROM {local_prequran_teacher_intake_request}
             $where
           ORDER BY timecreated DESC",
            $params,
            0,
            8
        ));
    } catch (Throwable $e) {
        $recentapplications = [];
    }
}

// City normalisation for prefill values not present in the country list.
$formcity = pqtil_form_value($form, 'city');
if ($formcity !== '' && $formcity !== 'Other') {
    $countrycities = $pqtioptions['country_cities'][pqtil_form_value($form, 'country')] ?? [];
    if ($countrycities && !array_key_exists($formcity, $countrycities)) {
        $form['city'] = 'Other';
        $form['city_other'] = $formcity;
    }
}

$sourceapplicationid = (int)pqtil_form_value($form, 'teacher_requestid');
if (!$sourceapplication && $sourceapplicationid > 0 && pqtil_table_exists('local_prequran_teacher_intake_request')) {
    $sourceapplication = $DB->get_record('local_prequran_teacher_intake_request', ['id' => $sourceapplicationid], '*', IGNORE_MISSING) ?: null;
}
$sourceapplicationjson = $sourceapplication ? pqtil_application_json($sourceapplication) : [];

$missingconversion = [];
foreach ([
    'teacher_firstname' => 'First name',
    'teacher_lastname' => 'Last name',
    'teacher_contact' => 'Teacher email or phone',
    'gender' => 'Gender',
    'country' => 'Country',
    'city' => 'City',
    'timezone' => 'Time zone',
    'primary_language' => 'Primary teaching language',
    'bbb_trained' => 'BBB/live classroom training',
    'safeguarding_trained' => 'Child safety training',
    'recording_qa_ack' => 'Recording and QA acknowledgement',
] as $field => $label) {
    if (trim(pqtil_form_value($form, $field)) === '') {
        $missingconversion[] = $label;
    }
}
if (!$form['teacher_work_models']) {
    $missingconversion[] = 'Teacher pathway';
}
if (!$form['service_modes']) {
    $missingconversion[] = 'Service modes';
}
if (trim(pqtil_form_value($form, 'subject_language')) === '' && !$form['subject_areas']) {
    $missingconversion[] = 'Subjects you can teach';
}
if (!$form['age_groups']) {
    $missingconversion[] = 'Age groups';
}
if (!$form['general_levels']) {
    $missingconversion[] = 'Teaching levels';
}
$willpublish = pqtil_form_value($form, 'status') === 'active'
    && pqtil_form_value($form, 'marketplace_visible') === '1'
    && pqtil_form_value($form, 'marketplace_status') === 'published'
    && pqtil_form_value($form, 'vetting_status') === 'approved';

$isupdate = (int)pqtil_form_value($form, 'existing_teacherid') > 0;
$pagetitle = $isupdate ? 'Update Teacher Intake' : 'Teacher Intake';
$pagesubtitle = $isupdate
    ? 'Update an existing Moodle teacher account, marketplace profile, vetting state, and BBB availability.'
    : 'Create or link a Moodle teacher account, capture live-class readiness, and set initial BBB availability.';
$paneltitle = $isupdate ? 'Update Teacher Onboarding' : 'Teacher Onboarding';
$submitlabel = $isupdate ? 'Update teacher intake' : 'Create teacher intake';

// Source online presence panel (same map + filter as the page).
$sourceonline = [
    'Online profile' => pqtil_app_value($sourceapplicationjson, 'online_profile_name'),
    'Social media handle' => pqtil_app_value($sourceapplicationjson, 'instagram_handle'),
    'Social profile URL' => pqtil_app_value($sourceapplicationjson, 'social_profile_url'),
    'Website / booking URL' => pqtil_app_value($sourceapplicationjson, 'website_or_booking_url'),
    'Demo / sample URL' => pqtil_app_value($sourceapplicationjson, 'demo_video_url'),
];
$sourceonline = array_filter($sourceonline, static function(string $value): bool {
    return trim($value) !== '';
});

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'missingprofilecolumns' => $missingprofilecolumns,
    'loaderror' => $error,
    'form' => $form,
    'options' => $pqtioptions,
    'institution' => [
        'type' => $pqtiinstitutiontype,
        'faith_subcategory' => $pqtifaithsubcategory,
        'is_primary_education' => $pqtiisprimaryeducation,
        'is_higher_education' => $pqtiishighereducation,
        'is_technical_training' => $pqtiistechnicaltraining,
        'is_adult_learning' => $pqtiisadultlearning,
        'is_professional_development' => $pqtiisprofessionaldevelopment,
        'is_faith_based' => $pqtiisfaithbased,
        'faith_subject_optionkey' => $pqtifaithsubjectoptionkey,
        'faith_scripture_label' => $pqtifaithscripturelabel,
        'faith_interpretation_label' => $pqtifaithinterpretationlabel,
        'faith_language_label' => $pqtifaithlanguagelabel,
        'faith_practice_label' => $pqtifaithpracticelabel,
    ],
    'consumer' => [
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'consumerslug' => (string)($consumercontext->consumerslug ?? ''),
        'consumername' => (string)($consumercontext->consumername ?? ''),
        'workspaceid' => $contextworkspaceid,
    ],
    'recentapplications' => array_map(static function($row): array {
        return [
            'id' => (int)$row->id,
            'teacher_name' => (string)$row->teacher_name,
            'email' => (string)($row->email ?? ''),
            'phone' => (string)($row->phone ?? ''),
            'status' => (string)$row->status,
            'timecreated' => (int)$row->timecreated,
        ];
    }, $recentapplications),
    'source' => [
        'id' => $sourceapplicationid,
        'name' => $sourceapplication ? (string)$sourceapplication->teacher_name : '',
        'status' => $sourceapplication ? (string)$sourceapplication->status : '',
        'online' => $sourceonline,
    ],
    'missingconversion' => $missingconversion,
    'willpublish' => $willpublish,
    'isupdate' => $isupdate,
    'pagetitle' => $pagetitle,
    'pagesubtitle' => $pagesubtitle,
    'paneltitle' => $paneltitle,
    'submitlabel' => $submitlabel,
], JSON_UNESCAPED_SLASHES);
exit;
