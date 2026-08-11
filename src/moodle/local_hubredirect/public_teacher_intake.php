<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');
require_once(__DIR__ . '/course_offeringlib.php');

$options = require(__DIR__ . '/teacher_intake_config.php');

const PQPTI_MIN_FORM_SECONDS = 4;
const PQPTI_MAX_FORM_SECONDS = 7200;
const PQPTI_SESSION_COOLDOWN_SECONDS = 60;

function pqpti_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpti_trim(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqpti_limit(string $value, int $limit): string {
    return core_text::substr(trim($value), 0, $limit);
}

function pqpti_array_param(string $name): array {
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

function pqpti_single_array_param(string $name): array {
    $values = pqpti_array_param($name);
    return $values ? [reset($values)] : [];
}

function pqpti_label(string $value, array $options): string {
    return (string)($options[$value] ?? $value);
}

function pqpti_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = pqpti_label((string)$value, $options);
    }
    return $labels;
}

function pqpti_value(array $form, string $name): string {
    $value = $form[$name] ?? '';
    return is_array($value) ? implode(', ', $value) : (string)$value;
}

function pqpti_selected(array $form, string $name, string $value): string {
    return pqpti_value($form, $name) === $value ? ' selected' : '';
}

function pqpti_checked(array $form, string $name, string $value): string {
    $selected = $form[$name] ?? [];
    return is_array($selected) && in_array($value, array_map('strval', $selected), true) ? ' checked' : '';
}

function pqpti_work_model_values(array $values): array {
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

function pqpti_field_label(string $name): string {
    $labels = [
        'teacher_name' => 'Teacher/tutor name',
        'email' => 'Email',
        'phone' => 'Phone / WhatsApp',
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
        'subject_other' => 'Other subjects',
        'age_groups' => 'Learner levels',
        'general_levels' => 'Teaching levels',
        'workspace_preferences' => 'School/workspace preferences',
        'years_experience' => 'Years of experience',
        'institution_experience' => 'Schools, institutions, and freelance teaching',
        'courses' => 'Legacy course data',
        'levels' => 'Legacy level data',
        'experience' => 'Teaching experience',
        'bio' => 'Public profile summary',
        'online_profile_name' => 'Online teaching brand/profile name',
        'instagram_handle' => 'Social media handle',
        'social_profile_url' => 'Public social profile URL',
        'website_or_booking_url' => 'Website or booking link',
        'demo_video_url' => 'Demo lesson or sample video link',
        'teaching_offer_summary' => 'Teaching offer summary',
        'learner_outcomes' => 'Learner outcomes',
        'curriculum_materials' => 'Curriculum and materials',
        'social_proof' => 'Social proof / reviews',
        'availability' => 'Availability',
        'preferred_contact' => 'Preferred contact method',
        'teaching_experience_range' => 'Teaching or training experience',
        'highest_qualification' => 'Highest qualification',
        'preferred_teaching_format' => 'Preferred teaching format',
        'verification_consent' => 'Qualification and reference verification consent',
        'desired_services' => 'Desired services',
        'form_security' => 'Form security',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqpti_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqpti-error">' . s(pqpti_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqpti_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $html = '<select class="pqpti-input" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . pqpti_selected($form, $name, (string)$value) . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>' . pqpti_error($errors, $name);
}

function pqpti_checkboxes(string $name, array $options, array $form, array $errors): string {
    $html = '<div class="pqpti-choicegrid">';
    foreach ($options as $value => $label) {
        $html .= '<label class="pqpti-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . pqpti_checked($form, $name, (string)$value) . '><span>' . s((string)$label) . '</span></label>';
    }
    return $html . '</div>' . pqpti_error($errors, $name);
}

function pqpti_radio_cards(string $name, array $options, array $form, array $errors): string {
    $selected = $form[$name] ?? [];
    $selectedvalue = is_array($selected) ? (string)($selected[0] ?? '') : (string)$selected;
    $html = '<div class="pqpti-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = (string)$value === $selectedvalue ? ' checked' : '';
        $html .= '<label class="pqpti-choice"><input type="radio" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    return $html . '</div>' . pqpti_error($errors, $name);
}

function pqpti_slot_summary(array $slots, array $days, array $hours): string {
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day !== '' && $hour !== '') {
            $byday[$day][] = pqpti_label($hour, $hours);
        }
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = pqpti_label($day, $days) . ': ' . implode(', ', $dayhours);
    }
    return implode('; ', $parts);
}

function pqpti_request_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqpti_table_exists('local_prequran_teacher_intake_request')
            ? $DB->get_columns('local_prequran_teacher_intake_request')
            : [];
    }
    return $columns;
}

function pqpti_set_request_field(stdClass $record, string $field, $value): void {
    $columns = pqpti_request_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqpti_join_nonempty(array $parts, string $separator = "\n"): string {
    $clean = [];
    foreach ($parts as $part) {
        $part = trim((string)$part);
        if ($part !== '') {
            $clean[] = $part;
        }
    }
    return implode($separator, $clean);
}

function pqpti_application_backup_text(array $application): string {
    $lines = [
        'Teaching work model: ' . pqpti_value($application, 'teacher_work_model_labels'),
        'Service modes: ' . pqpti_value($application, 'service_mode_labels'),
        'Language subject: ' . pqpti_value($application, 'subject_language_label'),
        'Subjects: ' . pqpti_value($application, 'subject_area_labels'),
        'Other subjects: ' . pqpti_value($application, 'subject_other'),
        'Learner levels: ' . pqpti_value($application, 'age_group_labels'),
        'Teaching levels: ' . pqpti_value($application, 'general_level_labels'),
        'School/workspace preferences: ' . pqpti_value($application, 'workspace_preferences'),
        'Years of experience: ' . pqpti_value($application, 'years_experience'),
        'Schools, institutions, and freelance teaching: ' . pqpti_value($application, 'institution_experience'),
        'Online profile: ' . pqpti_value($application, 'online_profile_name'),
        'Social media handle: ' . pqpti_value($application, 'instagram_handle'),
        'Social profile URL: ' . pqpti_value($application, 'social_profile_url'),
        'Website/booking URL: ' . pqpti_value($application, 'website_or_booking_url'),
        'Demo/sample URL: ' . pqpti_value($application, 'demo_video_url'),
    ];
    return pqpti_join_nonempty(array_filter($lines, static function(string $line): bool {
        return !preg_match('/:\s*$/', $line);
    }));
}

function pqpti_security_token(int $formtime): string {
    global $CFG;
    $secret = !empty($CFG->passwordsaltmain) ? (string)$CFG->passwordsaltmain : (string)$CFG->wwwroot;
    return hash_hmac('sha256', $formtime . '|' . sesskey(), $secret);
}

function pqpti_contact_ok(string $email, string $phone): bool {
    if ($email !== '' && validate_email($email)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $phone);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqpti_url_ok(string $url): bool {
    if ($url === '') {
        return true;
    }
    return (bool)preg_match('/^https?:\/\/[^\s]+$/i', $url);
}

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid > 0 && (int)($consumercontext->workspaceid ?? 0) !== $requestedworkspaceid) {
    $workspacecontext = pqh_consumer_context_by_workspace($requestedworkspaceid);
    if ($workspacecontext) {
        $consumercontext = $workspacecontext;
    }
}

// On a parent domain (e.g. the Ehel Academy umbrella site) that owns child
// schools, the applicant must pick which actual school they're applying to
// before the rest of the form (course types, institution-specific fields)
// can be scoped correctly. Same pattern as public_intake.php's picker.
$domainbasecontext = pqh_current_consumer_context();
$childschoolchoices = pqh_org_group_child_schools((int)$domainbasecontext->consumerid);
$selectedchildworkspaceid = 0;
if ($childschoolchoices) {
    foreach ($childschoolchoices as $childschool) {
        if ((int)$childschool->workspaceid > 0 && (int)$childschool->workspaceid === (int)$consumercontext->workspaceid) {
            $selectedchildworkspaceid = (int)$consumercontext->workspaceid;
            break;
        }
    }
}
$needsschoolselection = $childschoolchoices && $selectedchildworkspaceid <= 0;

$consumerreturnurl = trim((string)($consumercontext->returnurl ?? ''));
pqh_apply_consumer_embed_headers($consumercontext);
$options['course_types'] = pqco_workspace_course_options($consumercontext, [], true);
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
if ((int)$consumercontext->workspaceid > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$brandname = (string)$consumercontext->consumername;
$institutiontype = pqhi_clean_institution_type((string)($consumercontext->institution_type ?? ''), '');
$faithsubcategory = pqhi_clean_faith_subcategory((string)($consumercontext->faith_subcategory ?? ''));
$isprimaryeducation = $institutiontype === 'primary_education';
$ishighereducation = $institutiontype === 'higher_education';
$istechnicaltraining = $institutiontype === 'technical_training';
$isadultlearning = $institutiontype === 'adult_learning';
$isprofessionaldevelopment = $institutiontype === 'professional_development';
$isfaithbased = $institutiontype === 'faith_based_education';
$faithsubjectoptionkey = $faithsubcategory === 'christian_studies' ? 'christian_teacher_subjects' : ($faithsubcategory === 'hindu_studies' ? 'hindu_teacher_subjects' : 'islamic_teacher_subjects');
$faithscripturelabel = $faithsubcategory === 'christian_studies' ? 'Bible knowledge proficiency' : ($faithsubcategory === 'hindu_studies' ? 'Hindu scripture proficiency' : 'Quran proficiency');
$faithinterpretationlabel = $faithsubcategory === 'christian_studies' ? 'Theology level' : ($faithsubcategory === 'hindu_studies' ? 'Philosophy and interpretation level' : 'Tafsir level');
$faithlanguagelabel = $faithsubcategory === 'christian_studies' ? 'Biblical-language proficiency' : ($faithsubcategory === 'hindu_studies' ? 'Sanskrit proficiency' : 'Arabic proficiency');
$faithpracticelabel = $faithsubcategory === 'christian_studies' ? 'Ministry or liturgical-practice experience' : ($faithsubcategory === 'hindu_studies' ? 'Devotional or liturgical-practice experience' : 'Tajweed and recitation proficiency');
$context = context_system::instance();

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/public_teacher_intake.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Educator Application');
$PAGE->set_heading($brandname . ' Educator Application');
$PAGE->add_body_class('pqh-public-teacher-intake-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}
@header('X-Robots-Tag: noindex, nofollow', true);
@header('Referrer-Policy: strict-origin-when-cross-origin', true);

$ready = pqpti_table_exists('local_prequran_teacher_intake_request');
$message = '';
$errors = [];
$now = time();
if (empty($SESSION->pqpti_formtime) || !is_int($SESSION->pqpti_formtime) || $SESSION->pqpti_formtime < $now - PQPTI_MAX_FORM_SECONDS) {
    $SESSION->pqpti_formtime = $now;
}
$formtime = (int)$SESSION->pqpti_formtime;
$formtoken = pqpti_security_token($formtime);
$form = [
    'teacher_name' => '',
    'preferred_name' => '',
    'email' => '',
    'phone' => '',
    'preferred_contact' => 'email',
    'gender' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => 'Africa/Nairobi',
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
    'teaching_experience_range' => '',
    'highest_qualification' => '',
    'qualification_title' => '',
    'awarding_institution' => '',
    'graduation_year' => '',
    'teaching_qualification' => '',
    'institution_experience' => '',
    'courses' => [],
    'levels' => [],
    'experience' => '',
    'education' => '',
    'teaching_style' => '',
    'bio' => '',
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
    'slots' => [],
    'desired_services' => '',
    'notes' => '',
];

if ($ready && !$needsschoolselection && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $postedformtime = optional_param('formtime', 0, PARAM_INT);
    $postedtoken = optional_param('formtoken', '', PARAM_ALPHANUMEXT);
    $honeypot = optional_param('website', '', PARAM_TEXT);
    foreach ($form as $field => $default) {
        if ($field === 'teacher_work_models') {
            $form[$field] = pqpti_work_model_values(pqpti_single_array_param($field));
        } else {
            $form[$field] = is_array($default) ? pqpti_array_param($field) : pqpti_limit(pqpti_trim($field, (string)$default), in_array($field, ['experience', 'education', 'teaching_style', 'bio', 'desired_services', 'notes', 'subject_other', 'workspace_preferences', 'institution_experience', 'teaching_offer_summary', 'learner_outcomes', 'curriculum_materials', 'social_proof', 'teacher_support_needs', 'primary_teacher_notes', 'higher_teacher_publications', 'higher_teacher_notes', 'technical_teacher_licenses', 'technical_teacher_notes', 'adult_teacher_notes', 'professional_teacher_credentials', 'professional_teacher_case_studies', 'professional_teacher_notes', 'faith_teacher_qualification', 'faith_teacher_notes'], true) ? 4000 : 255);
        }
    }

    $elapsed = time() - $postedformtime;
    if ($honeypot !== '') {
        $errors['form_security'] = 'The request could not be accepted. Please reload the form and try again.';
    }
    if ($postedformtime <= 0 || !hash_equals(pqpti_security_token($postedformtime), $postedtoken)) {
        $errors['form_security'] = 'The form security token expired. Please reload the form and try again.';
    } else if ($elapsed < PQPTI_MIN_FORM_SECONDS || $elapsed > PQPTI_MAX_FORM_SECONDS) {
        $errors['form_security'] = 'Please reload the form and submit again.';
    }
    if (!empty($SESSION->pqpti_last_submit) && (time() - (int)$SESSION->pqpti_last_submit) < PQPTI_SESSION_COOLDOWN_SECONDS) {
        $errors['form_security'] = 'Please wait a minute before submitting another request.';
    }

    foreach ([
        'teacher_name' => 'Please enter your teacher/tutor name.',
        'country' => 'Please select your country.',
        'city' => 'Please select your city.',
        'timezone' => 'Please select your time zone.',
        'primary_language' => 'Please select your primary teaching language.',
        'experience' => 'Please summarize your teaching experience.',
        'bio' => 'Please write a short public profile summary.',
        'teaching_experience_range' => 'Please select your teaching or training experience.',
        'highest_qualification' => 'Please select your highest qualification.',
        'preferred_teaching_format' => 'Please select your preferred teaching format.',
    ] as $field => $error) {
        if (pqpti_value($form, $field) === '') {
            $errors[$field] = $error;
        }
    }
    if (pqpti_value($form, 'verification_consent') !== '1') {
        $errors['verification_consent'] = 'Consent to verify qualifications and references is required.';
    }
    foreach ([
        'preferred_contact' => 'preferred_contact_methods',
        'teaching_experience_range' => 'teaching_experience_ranges',
        'highest_qualification' => 'teacher_qualification_levels',
        'preferred_teaching_format' => 'preferred_teaching_formats',
        'preferred_learner_arrangement' => 'preferred_learner_arrangements',
        'technology_readiness' => 'technology_readiness_options',
        'professional_reference' => 'professional_reference_options',
    ] as $field => $optionkey) {
        if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
    if ($isprimaryeducation) {
        if (!$form['primary_grades_taught']) {
            $errors['primary_grades_taught'] = 'Select at least one primary grade or year level taught.';
        }
        if (!$form['primary_curricula_taught']) {
            $errors['primary_curricula_taught'] = 'Select at least one primary curriculum taught.';
        }
        foreach ([
            'primary_classroom_management' => 'Please select classroom-management experience.',
            'primary_safeguarding_status' => 'Please select child-safeguarding training status.',
        ] as $field => $message) {
            if (pqpti_value($form, $field) === '') {
                $errors[$field] = $message;
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
            if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
        foreach ([
            'primary_grades_taught' => 'primary_teacher_grade_levels',
            'primary_curricula_taught' => 'primary_teacher_curricula',
        ] as $field => $optionkey) {
            foreach ($form[$field] as $value) {
                if (!array_key_exists((string)$value, $options[$optionkey] ?? [])) {
                    $errors[$field] = 'Please select valid options.';
                    break;
                }
            }
        }
    }
    if ($ishighereducation) {
        if (!$form['higher_teacher_disciplines']) {
            $errors['higher_teacher_disciplines'] = 'Select at least one higher-education discipline.';
        }
        foreach ([
            'higher_teacher_academic_rank' => 'Please select the academic rank or teaching role.',
            'higher_teacher_experience' => 'Please select higher-education teaching experience.',
            'higher_teacher_course_design' => 'Please select course-design experience.',
            'higher_teacher_assessment' => 'Please select assessment experience.',
        ] as $field => $message) {
            if (pqpti_value($form, $field) === '') {
                $errors[$field] = $message;
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
            if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
        foreach ([
            'higher_teacher_disciplines' => 'higher_teacher_disciplines',
            'higher_teacher_supervision' => 'higher_teacher_supervision_levels',
        ] as $field => $optionkey) {
            foreach ($form[$field] as $value) {
                if (!array_key_exists((string)$value, $options[$optionkey] ?? [])) {
                    $errors[$field] = 'Please select valid options.';
                    break;
                }
            }
        }
    }
    if ($istechnicaltraining) {
        if (!$form['technical_teacher_trades']) {
            $errors['technical_teacher_trades'] = 'Select at least one technical trade or programme taught.';
        }
        foreach ([
            'technical_teacher_industry_experience' => 'Please select relevant industry experience.',
            'technical_teacher_equipment_level' => 'Please select tools and equipment competence.',
            'technical_teacher_safety_status' => 'Please select safety-certification status.',
        ] as $field => $message) {
            if (pqpti_value($form, $field) === '') {
                $errors[$field] = $message;
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
            if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
        foreach ($form['technical_teacher_trades'] as $value) {
            if (!array_key_exists((string)$value, $options['technical_teacher_trades'] ?? [])) {
                $errors['technical_teacher_trades'] = 'Please select valid trades.';
                break;
            }
        }
    }
    if ($isadultlearning) {
        if (!$form['adult_teacher_areas']) {
            $errors['adult_teacher_areas'] = 'Select at least one adult-learning area taught.';
        }
        foreach ([
            'adult_teacher_experience' => 'Please select adult-learning teaching experience.',
            'adult_teacher_multilevel_facilitation' => 'Please select multi-level facilitation experience.',
            'adult_teacher_confidence_support' => 'Please select experience supporting adults returning to learning.',
        ] as $field => $message) {
            if (pqpti_value($form, $field) === '') {
                $errors[$field] = $message;
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
            if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
        foreach ($form['adult_teacher_areas'] as $value) {
            if (!array_key_exists((string)$value, $options['adult_teacher_learning_areas'] ?? [])) {
                $errors['adult_teacher_areas'] = 'Please select valid adult-learning areas.';
                break;
            }
        }
    }
    if ($isprofessionaldevelopment) {
        if (!$form['professional_teacher_areas']) {
            $errors['professional_teacher_areas'] = 'Select at least one professional-development area.';
        }
        foreach ([
            'professional_teacher_industry_experience' => 'Please select relevant industry experience.',
            'professional_teacher_facilitation' => 'Please select facilitation experience.',
            'professional_teacher_outcome_measurement' => 'Please select workplace-outcome measurement experience.',
        ] as $field => $message) {
            if (pqpti_value($form, $field) === '') {
                $errors[$field] = $message;
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
            if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
        foreach ($form['professional_teacher_areas'] as $value) {
            if (!array_key_exists((string)$value, $options['professional_teacher_areas'] ?? [])) {
                $errors['professional_teacher_areas'] = 'Please select valid professional-development areas.';
                break;
            }
        }
    }
    if ($isfaithbased) {
        if (!$form['faith_teacher_subjects']) {
            $errors['faith_teacher_subjects'] = 'Select at least one faith-study area taught.';
        }
        foreach ([
            'faith_teacher_experience' => 'Please select faith-based teaching experience.',
            'faith_teacher_qualification' => 'Please describe the relevant faith-study qualification or authorisation.',
            'faith_teacher_scripture_proficiency' => 'Please select scripture proficiency.',
        ] as $field => $message) {
            if (pqpti_value($form, $field) === '') {
                $errors[$field] = $message;
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
            if (pqpti_value($form, $field) !== '' && !array_key_exists(pqpti_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
        foreach ($form['faith_teacher_subjects'] as $value) {
            if (!array_key_exists((string)$value, $options[$faithsubjectoptionkey] ?? [])) {
                $errors['faith_teacher_subjects'] = 'Please select valid faith-study areas.';
                break;
            }
        }
    }
    if (!pqpti_contact_ok(pqpti_value($form, 'email'), pqpti_value($form, 'phone'))) {
        $errors['email'] = 'Enter a valid email address or phone/WhatsApp number.';
    }
    if (!$form['teacher_work_models']) {
        $errors['teacher_work_models'] = 'Select whether you want to teach as an independent teacher/tutor or marketplace teacher/tutor.';
    }
    if (!$form['service_modes']) {
        $errors['service_modes'] = 'Select at least one teaching service mode.';
    }
    if (pqpti_value($form, 'subject_language') === '' && !$form['subject_areas']) {
        $errors['subject_areas'] = 'Select at least one subject you can teach or choose a language subject.';
    }
    if (in_array('other_subjects', $form['subject_areas'], true) && pqpti_value($form, 'subject_other') === '') {
        $errors['subject_other'] = 'Please describe the other subjects you can teach.';
    }
    if (!$form['age_groups']) {
        $errors['age_groups'] = 'Select at least one learner level.';
    }
    if (!$form['general_levels']) {
        $errors['general_levels'] = 'Select at least one teaching level.';
    }
    if (pqpti_value($form, 'years_experience') !== '' && ((int)pqpti_value($form, 'years_experience') < 0 || (int)pqpti_value($form, 'years_experience') > 80)) {
        $errors['years_experience'] = 'Enter years of experience between 0 and 80.';
    }
    if (pqpti_value($form, 'preferred_weekly_hours') !== '' && ((int)pqpti_value($form, 'preferred_weekly_hours') < 1 || (int)pqpti_value($form, 'preferred_weekly_hours') > 60)) {
        $errors['preferred_weekly_hours'] = 'Enter preferred weekly hours between 1 and 60.';
    }
    if (pqpti_value($form, 'graduation_year') !== '' && ((int)pqpti_value($form, 'graduation_year') < 1900 || (int)pqpti_value($form, 'graduation_year') > 2100)) {
        $errors['graduation_year'] = 'Enter a valid graduation year.';
    }
    if (!$form['slots']) {
        $errors['availability'] = 'Select at least one weekly availability time.';
    }
    if (pqpti_value($form, 'city') === 'Other' && pqpti_value($form, 'city_other') === '') {
        $errors['city_other'] = 'Please enter the city name.';
    }
    foreach (['social_profile_url', 'website_or_booking_url', 'demo_video_url'] as $urlfield) {
        if (!pqpti_url_ok(pqpti_value($form, $urlfield))) {
            $errors[$urlfield] = 'Enter a full URL starting with http:// or https://.';
        }
    }

    if (!$errors) {
        $slots = [];
        foreach ($form['slots'] as $slot) {
            [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
            if ($day !== '' && $hour !== '') {
                $slots[] = [
                    'day' => $day,
                    'time' => $hour,
                    'day_label' => pqpti_label($day, $options['availability_days'] ?? []),
                    'time_label' => pqpti_label($hour, $options['availability_time_windows'] ?? []),
                ];
            }
        }
        $city = pqpti_value($form, 'city') === 'Other' ? pqpti_value($form, 'city_other') : pqpti_value($form, 'city');
        $record = (object)[
            'consumerid' => (int)$consumercontext->consumerid,
            'workspaceid' => (int)$consumercontext->workspaceid,
            'teacher_name' => pqpti_value($form, 'teacher_name'),
            'email' => pqpti_value($form, 'email'),
            'phone' => pqpti_value($form, 'phone'),
            'country' => pqpti_value($form, 'country'),
            'city' => $city,
            'timezone' => pqpti_value($form, 'timezone'),
            'primary_language' => pqpti_value($form, 'primary_language'),
            'other_languages' => implode(', ', pqpti_labels($form['other_languages'], $options['other_languages'] ?? [])),
            'courses' => implode(', ', pqpti_labels($form['courses'], $options['course_types'] ?? [])),
            'levels' => implode(', ', pqpti_labels($form['general_levels'], $options['general_levels'] ?? [])),
            'experience' => pqpti_value($form, 'experience'),
            'education' => pqpti_value($form, 'education'),
            'teaching_style' => pqpti_value($form, 'teaching_style'),
            'bio' => pqpti_value($form, 'bio'),
            'availability_json' => json_encode(['timezone' => pqpti_value($form, 'timezone'), 'slots' => $slots], JSON_UNESCAPED_SLASHES),
            'availability_summary' => pqpti_slot_summary($form['slots'], $options['availability_days'] ?? [], $options['availability_time_windows'] ?? []),
            'desired_services' => pqpti_value($form, 'desired_services'),
            'notes' => pqpti_value($form, 'notes'),
            'status' => 'new',
            'converted_userid' => 0,
            'converted_profileid' => 0,
            'admin_notes' => '',
            'reviewedby' => 0,
            'reviewedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $applicationjson = [
            'teacher_work_models' => $form['teacher_work_models'],
            'teacher_work_model_labels' => pqpti_labels($form['teacher_work_models'], $options['teacher_work_models'] ?? []),
            'gender' => pqpti_value($form, 'gender'),
            'service_modes' => $form['service_modes'],
            'service_mode_labels' => pqpti_labels($form['service_modes'], $options['service_modes'] ?? []),
            'subject_language' => pqpti_value($form, 'subject_language'),
            'subject_language_label' => pqpti_label(pqpti_value($form, 'subject_language'), $options['subject_languages'] ?? []),
            'subject_areas' => $form['subject_areas'],
            'subject_area_labels' => pqpti_labels($form['subject_areas'], $options['subject_areas'] ?? []),
            'subject_other' => pqpti_value($form, 'subject_other'),
            'age_groups' => $form['age_groups'],
            'age_group_labels' => pqpti_labels($form['age_groups'], $options['age_groups'] ?? []),
            'general_levels' => $form['general_levels'],
            'general_level_labels' => pqpti_labels($form['general_levels'], $options['general_levels'] ?? []),
            'workspace_preferences' => pqpti_value($form, 'workspace_preferences'),
            'years_experience' => (int)pqpti_value($form, 'years_experience'),
            'institution_experience' => pqpti_value($form, 'institution_experience'),
            'preferred_contact' => pqpti_value($form, 'preferred_contact'),
            'preferred_name' => pqpti_value($form, 'preferred_name'),
            'teaching_experience_range' => pqpti_value($form, 'teaching_experience_range'),
            'highest_qualification' => pqpti_value($form, 'highest_qualification'),
            'qualification_title' => pqpti_value($form, 'qualification_title'),
            'awarding_institution' => pqpti_value($form, 'awarding_institution'),
            'graduation_year' => pqpti_value($form, 'graduation_year'),
            'teaching_qualification' => pqpti_value($form, 'teaching_qualification'),
            'preferred_teaching_format' => pqpti_value($form, 'preferred_teaching_format'),
            'preferred_learner_arrangement' => pqpti_value($form, 'preferred_learner_arrangement'),
            'preferred_weekly_hours' => pqpti_value($form, 'preferred_weekly_hours'),
            'available_start_date' => pqpti_value($form, 'available_start_date'),
            'technology_readiness' => pqpti_value($form, 'technology_readiness'),
            'teacher_support_needs' => pqpti_value($form, 'teacher_support_needs'),
            'professional_reference' => pqpti_value($form, 'professional_reference'),
            'verification_consent' => pqpti_value($form, 'verification_consent'),
            'referral_source' => pqpti_value($form, 'referral_source'),
            'primary_grades_taught' => $form['primary_grades_taught'],
            'primary_curricula_taught' => $form['primary_curricula_taught'],
            'primary_classroom_management' => pqpti_value($form, 'primary_classroom_management'),
            'primary_parent_communication' => pqpti_value($form, 'primary_parent_communication'),
            'primary_safeguarding_status' => pqpti_value($form, 'primary_safeguarding_status'),
            'primary_learning_support' => pqpti_value($form, 'primary_learning_support'),
            'primary_lesson_assessment' => pqpti_value($form, 'primary_lesson_assessment'),
            'primary_teaching_credential' => pqpti_value($form, 'primary_teaching_credential'),
            'primary_background_check' => pqpti_value($form, 'primary_background_check'),
            'primary_teacher_notes' => pqpti_value($form, 'primary_teacher_notes'),
            'higher_teacher_academic_rank' => pqpti_value($form, 'higher_teacher_academic_rank'),
            'higher_teacher_disciplines' => $form['higher_teacher_disciplines'],
            'higher_teacher_experience' => pqpti_value($form, 'higher_teacher_experience'),
            'higher_teacher_research_level' => pqpti_value($form, 'higher_teacher_research_level'),
            'higher_teacher_publications' => pqpti_value($form, 'higher_teacher_publications'),
            'higher_teacher_supervision' => $form['higher_teacher_supervision'],
            'higher_teacher_course_design' => pqpti_value($form, 'higher_teacher_course_design'),
            'higher_teacher_assessment' => pqpti_value($form, 'higher_teacher_assessment'),
            'higher_teacher_accreditation' => pqpti_value($form, 'higher_teacher_accreditation'),
            'higher_teacher_notes' => pqpti_value($form, 'higher_teacher_notes'),
            'technical_teacher_trades' => $form['technical_teacher_trades'],
            'technical_teacher_industry_experience' => pqpti_value($form, 'technical_teacher_industry_experience'),
            'technical_teacher_qualification' => pqpti_value($form, 'technical_teacher_qualification'),
            'technical_teacher_licenses' => pqpti_value($form, 'technical_teacher_licenses'),
            'technical_teacher_workshop_level' => pqpti_value($form, 'technical_teacher_workshop_level'),
            'technical_teacher_equipment_level' => pqpti_value($form, 'technical_teacher_equipment_level'),
            'technical_teacher_safety_status' => pqpti_value($form, 'technical_teacher_safety_status'),
            'technical_teacher_apprenticeship' => pqpti_value($form, 'technical_teacher_apprenticeship'),
            'technical_teacher_assessment' => pqpti_value($form, 'technical_teacher_assessment'),
            'technical_teacher_workplace_training' => pqpti_value($form, 'technical_teacher_workplace_training'),
            'technical_teacher_notes' => pqpti_value($form, 'technical_teacher_notes'),
            'adult_teacher_areas' => $form['adult_teacher_areas'],
            'adult_teacher_experience' => pqpti_value($form, 'adult_teacher_experience'),
            'adult_teacher_literacy_instruction' => pqpti_value($form, 'adult_teacher_literacy_instruction'),
            'adult_teacher_numeracy_instruction' => pqpti_value($form, 'adult_teacher_numeracy_instruction'),
            'adult_teacher_digital_instruction' => pqpti_value($form, 'adult_teacher_digital_instruction'),
            'adult_teacher_multilevel_facilitation' => pqpti_value($form, 'adult_teacher_multilevel_facilitation'),
            'adult_teacher_confidence_support' => pqpti_value($form, 'adult_teacher_confidence_support'),
            'adult_teacher_community_outreach' => pqpti_value($form, 'adult_teacher_community_outreach'),
            'adult_teacher_barrier_support' => pqpti_value($form, 'adult_teacher_barrier_support'),
            'adult_teacher_notes' => pqpti_value($form, 'adult_teacher_notes'),
            'professional_teacher_areas' => $form['professional_teacher_areas'],
            'professional_teacher_industry_experience' => pqpti_value($form, 'professional_teacher_industry_experience'),
            'professional_teacher_responsibility' => pqpti_value($form, 'professional_teacher_responsibility'),
            'professional_teacher_credentials' => pqpti_value($form, 'professional_teacher_credentials'),
            'professional_teacher_facilitation' => pqpti_value($form, 'professional_teacher_facilitation'),
            'professional_teacher_coaching' => pqpti_value($form, 'professional_teacher_coaching'),
            'professional_teacher_corporate_training' => pqpti_value($form, 'professional_teacher_corporate_training'),
            'professional_teacher_cpd' => pqpti_value($form, 'professional_teacher_cpd'),
            'professional_teacher_outcome_measurement' => pqpti_value($form, 'professional_teacher_outcome_measurement'),
            'professional_teacher_case_studies' => pqpti_value($form, 'professional_teacher_case_studies'),
            'professional_teacher_notes' => pqpti_value($form, 'professional_teacher_notes'),
            'faith_subcategory' => $faithsubcategory,
            'faith_teacher_subjects' => $form['faith_teacher_subjects'],
            'faith_teacher_experience' => pqpti_value($form, 'faith_teacher_experience'),
            'faith_teacher_qualification' => pqpti_value($form, 'faith_teacher_qualification'),
            'faith_teacher_scripture_proficiency' => pqpti_value($form, 'faith_teacher_scripture_proficiency'),
            'faith_teacher_interpretation_level' => pqpti_value($form, 'faith_teacher_interpretation_level'),
            'faith_teacher_language_level' => pqpti_value($form, 'faith_teacher_language_level'),
            'faith_teacher_practice_level' => pqpti_value($form, 'faith_teacher_practice_level'),
            'faith_teacher_community_experience' => pqpti_value($form, 'faith_teacher_community_experience'),
            'faith_teacher_reference' => pqpti_value($form, 'faith_teacher_reference'),
            'faith_teacher_notes' => pqpti_value($form, 'faith_teacher_notes'),
            'online_profile_name' => pqpti_value($form, 'online_profile_name'),
            'instagram_handle' => pqpti_value($form, 'instagram_handle'),
            'social_profile_url' => pqpti_value($form, 'social_profile_url'),
            'website_or_booking_url' => pqpti_value($form, 'website_or_booking_url'),
            'demo_video_url' => pqpti_value($form, 'demo_video_url'),
            'teaching_offer_summary' => pqpti_value($form, 'teaching_offer_summary'),
            'learner_outcomes' => pqpti_value($form, 'learner_outcomes'),
            'curriculum_materials' => pqpti_value($form, 'curriculum_materials'),
            'social_proof' => pqpti_value($form, 'social_proof'),
        ];
        if (!isset(pqpti_request_columns()['application_json'])) {
            $record->notes = pqpti_join_nonempty([
                (string)$record->notes,
                "Flexible teacher intake backup:\n" . pqpti_application_backup_text($applicationjson),
            ], "\n\n");
        }
        pqpti_set_request_field($record, 'teacher_work_models', implode(', ', pqpti_labels($form['teacher_work_models'], $options['teacher_work_models'] ?? [])));
        pqpti_set_request_field($record, 'service_modes', implode(', ', pqpti_labels($form['service_modes'], $options['service_modes'] ?? [])));
        pqpti_set_request_field($record, 'subject_language', pqpti_label(pqpti_value($form, 'subject_language'), $options['subject_languages'] ?? []));
        pqpti_set_request_field($record, 'subject_areas', implode(', ', pqpti_labels($form['subject_areas'], $options['subject_areas'] ?? [])));
        pqpti_set_request_field($record, 'subject_other', pqpti_value($form, 'subject_other'));
        pqpti_set_request_field($record, 'age_groups', implode(', ', pqpti_labels($form['age_groups'], $options['age_groups'] ?? [])));
        pqpti_set_request_field($record, 'general_levels', implode(', ', pqpti_labels($form['general_levels'], $options['general_levels'] ?? [])));
        pqpti_set_request_field($record, 'workspace_preferences', pqpti_value($form, 'workspace_preferences'));
        pqpti_set_request_field($record, 'years_experience', (int)pqpti_value($form, 'years_experience'));
        pqpti_set_request_field($record, 'institution_experience', pqpti_value($form, 'institution_experience'));
        pqpti_set_request_field($record, 'application_json', json_encode($applicationjson, JSON_UNESCAPED_SLASHES));
        $requestid = (int)$DB->insert_record('local_prequran_teacher_intake_request', $record);
        $SESSION->pqpti_last_submit = $now;
        $SESSION->pqpti_formtime = $now;
        if ($consumerreturnurl !== '' && preg_match('#^https?://#i', $consumerreturnurl)) {
            redirect($consumerreturnurl);
        }
        // Redirect to self (post-redirect-GET) rather than consumer_landing.php --
        // that page now requires login, but an anonymous applicant with no
        // account must still see their confirmation.
        redirect(new moodle_url('/local/hubredirect/public_teacher_intake.php', array_merge($consumerparams, ['submitted' => 1])));
    }
}

if (optional_param('submitted', 0, PARAM_BOOL)) {
    $message = 'Thank you. Your application was received and will be reviewed.';
}

echo $OUTPUT->header();
?>
<style>
body.pqh-public-teacher-intake-page header,body.pqh-public-teacher-intake-page header#page-header,body.pqh-public-teacher-intake-page header.navbar,body.pqh-public-teacher-intake-page .navbar,body.pqh-public-teacher-intake-page .navbar.fixed-top,body.pqh-public-teacher-intake-page .primary-navigation,body.pqh-public-teacher-intake-page .secondary-navigation,body.pqh-public-teacher-intake-page .moremenu,body.pqh-public-teacher-intake-page footer,body.pqh-public-teacher-intake-page nav.navbar,body.pqh-public-teacher-intake-page #page-header,body.pqh-public-teacher-intake-page #page-footer,body.pqh-public-teacher-intake-page .drawer,body.pqh-public-teacher-intake-page .drawer-toggles,body.pqh-public-teacher-intake-page .block-region,body.pqh-public-teacher-intake-page [data-region="drawer"],body.pqh-public-teacher-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-public-teacher-intake-page{padding-top:0!important}
body.pqh-public-teacher-intake-page #page-wrapper,body.pqh-public-teacher-intake-page #page,body.pqh-public-teacher-intake-page #page-content,body.pqh-public-teacher-intake-page #region-main,body.pqh-public-teacher-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqpti-shell{--pq-blue:#2f6f4e;--pq-blue-dark:#1f5138;--pq-blue-soft:#e4efe6;--pq-ink:#1c2b22;--pq-ink-2:#33463a;--pq-muted:#5c7267;--pq-line:#e3dcc8;--pq-line-strong:#c9bd9d;--pq-paper:#f7f4ec;--pq-card:#fffdf8;--pq-green:#2f6f4e;--pq-gold:#a5741e;--pq-gold-soft:#f4e6c8;--pq-hero-bg:#dbeafe;--pq-red:#9a3d2d;--pq-label:#2f5fad;--pq-serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--pq-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;--pq-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;position:fixed;inset:0;z-index:2147483000;overflow:auto;min-height:100vh;padding:0 0 64px;background:var(--pq-paper);font-family:var(--pq-sans);color:var(--pq-ink);-webkit-font-smoothing:antialiased}
@media(prefers-color-scheme:dark){.pqpti-shell{--pq-blue:#7fc79e;--pq-blue-dark:#63a883;--pq-blue-soft:#1c3327;--pq-ink:#e8e3d3;--pq-ink-2:#cdd7c9;--pq-muted:#9fb0a4;--pq-line:#2a3a30;--pq-line-strong:#3a4c40;--pq-paper:#121d17;--pq-card:#16241c;--pq-green:#7fc79e;--pq-gold:#dcaa54;--pq-gold-soft:#3a301a;--pq-hero-bg:#1c2e47;--pq-red:#e08876;--pq-label:#8ab4e8}}
.pqpti-wrap{max-width:920px;margin:0 auto;padding:18px 18px 0}
.pqpti-hero,.pqpti-panel{background:var(--pq-card);border:1px solid var(--pq-line);border-radius:14px;box-shadow:0 2px 10px rgba(22,38,30,.06)}
.pqpti-hero{padding:28px 32px;margin-bottom:16px}
.pqpti-navbrand{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--pq-ink)!important;min-width:0;margin-bottom:16px}
.pqpti-navmark{width:40px;height:40px;border-radius:8px;background:var(--pq-blue);color:#fff;display:grid;place-items:center;font-size:16px;font-weight:700;flex:0 0 auto}
.pqpti-navmark--img{width:58px;height:58px;padding:0;background:none;border:0;border-radius:0}
.pqpti-navmark--img img{display:block;width:100%;height:100%;object-fit:contain}
.pqpti-navname{font-size:17px;font-weight:700;line-height:1.1;white-space:normal}
.pqpti-title{margin:0;font-family:var(--pq-serif);font-size:clamp(28px,4vw,38px);line-height:1.12;font-weight:600;color:var(--pq-ink);letter-spacing:-.01em}
.pqpti-sub{margin:8px 0 0;color:var(--pq-muted);font-size:14.5px;font-weight:400;line-height:1.6}
.pqpti-panel{padding:26px;margin-bottom:16px;overflow:hidden}
.pqpti-panel h2{margin:0 0 18px;font-size:22px;line-height:1.2;font-weight:700;color:var(--pq-ink)}
.pqpti-panel h3{display:block;margin:8px 0 24px;padding:0 0 16px;border-bottom:2px solid var(--pq-line-strong);background:none;color:var(--pq-ink);font-family:var(--pq-serif);font-size:24px;line-height:1.2;font-weight:600;letter-spacing:-.01em}
.pqpti-panel h3:first-of-type{margin-top:0}
.pqpti-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 20px;align-items:start}
.pqpti-field{display:grid;gap:6px;margin-bottom:16px;align-content:start;align-self:start}.pqpti-field--tight{gap:0}.pqpti-field--wide{grid-column:1/-1}.pqpti-field label{margin:0;font-size:13px;font-weight:600;color:var(--pq-label)}.pqpti-hint{color:var(--pq-muted);font-size:12px;font-weight:400}
.pqpti-input,.pqpti-textarea{width:100%;min-height:44px;border:1px solid var(--pq-line-strong);border-radius:8px;padding:10px 13px;font:400 14.5px/1.3 var(--pq-sans);background:var(--pq-card);color:var(--pq-ink);transition:border-color .15s ease,box-shadow .15s ease}
.pqpti-input::placeholder,.pqpti-textarea::placeholder{color:#a3adb8}
.pqpti-textarea{min-height:90px;line-height:1.5}.pqpti-input:focus,.pqpti-textarea:focus{outline:0;border-color:var(--pq-blue);box-shadow:0 0 0 3px rgba(47,111,78,.15)}
.pqpti-choicegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqpti-choice{display:flex;gap:10px;align-items:center;min-height:40px;padding:10px 12px;border:1px solid var(--pq-line);border-radius:8px;background:var(--pq-paper);font-size:13.5px;font-weight:500;color:var(--pq-ink)}.pqpti-choice input{width:18px;height:18px;accent-color:var(--pq-blue)}
.pqpti-calendar{overflow:auto;border:1px solid var(--pq-line);border-radius:8px;background:var(--pq-card)}.pqpti-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:840px}.pqpti-calendar th,.pqpti-calendar td{border-bottom:1px solid var(--pq-line);border-right:1px solid var(--pq-line);padding:10px;text-align:center;font-weight:600}.pqpti-calendar th{background:var(--pq-blue-soft);color:var(--pq-blue-dark);font-size:12px}.pqpti-calendar td:first-child{text-align:left;color:var(--pq-ink);background:var(--pq-paper)}.pqpti-calendar tr:nth-child(even) td:first-child{background:#eef1f5}.pqpti-slot{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:7px;background:var(--pq-blue-soft);border:1px solid var(--pq-line-strong)}.pqpti-slot input{width:17px;height:17px;accent-color:var(--pq-blue)}
.pqpti-alert{padding:13px 18px;border-radius:8px;margin-bottom:14px;font-weight:600;font-size:14px;border:1px solid transparent}.pqpti-alert--ok{background:#eefaf1;border-color:#bfe8cb;color:#1d6b3c}.pqpti-alert--bad{background:#fdeeec;border-color:#f3c3bc;color:#a3382a}.pqpti-alert ul{margin:8px 0 0;padding-left:22px}
.pqpti-error{font-size:12px;font-weight:600;color:var(--pq-red)}
.pqpti-field--error .pqpti-input,.pqpti-field--error .pqpti-textarea,.pqpti-field--error .pqpti-calendar{border-color:var(--pq-red);background:#fef6f5}
.pqpti-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 24px;border:0;border-radius:8px;background:var(--pq-blue);color:#fff!important;text-decoration:none;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(47,111,78,.3)}.pqpti-btn:hover{background:var(--pq-blue-dark)}
.pqpti-empty{padding:18px;border:1px dashed var(--pq-line-strong);border-radius:8px;color:var(--pq-muted);font-weight:500;background:var(--pq-paper)}
.pqpti-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
.pqpti-school-pick-form{display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}.pqpti-school-pick-option{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px;color:var(--pq-ink);cursor:pointer}.pqpti-school-pick-option input{width:18px;height:18px;accent-color:var(--pq-blue)}.pqpti-school-pick-hint{margin:10px 0 0}
@media(max-width:760px){.pqpti-grid,.pqpti-choicegrid{grid-template-columns:1fr}.pqpti-title{font-size:24px}.pqpti-wrap{padding:12px 10px 0}.pqpti-hero{padding:20px 18px}.pqpti-panel{padding:18px}.pqpti-panel h3{font-size:19px;margin:4px 0 18px;padding:0 0 12px}.pqpti-sub{font-size:14px}}
<?php echo pqh_dashboard_header_css(); ?>
.pqpti-shell .pqh-workspace-top{background:var(--op-header-bg,#162b48)!important;border:1px solid var(--op-header-bg,#162b48)!important;box-shadow:0 2px 10px rgba(22,38,30,.10)!important;padding:28px 32px!important;border-radius:14px!important}
.pqpti-shell .pqh-workspace-title{color:var(--op-header-ink,#fff)!important;font-size:28px!important;font-weight:700!important;letter-spacing:0!important;text-shadow:none!important}
.pqpti-shell .pqh-workspace-sub{color:var(--op-header-ink-soft,rgba(255,255,255,.72))!important;font-size:14.5px!important;font-weight:400!important;opacity:1!important}.pqpti-shell .pqh-workspace-top .pqpti-navbrand{color:var(--op-header-ink,#fff)!important}.pqpti-shell .pqh-workspace-top .pqpti-navname{color:var(--op-header-ink,#fff)}.pqpti-shell .pqh-workspace-top .pqpti-navmark{background:rgba(255,255,255,.16);color:var(--op-header-ink,#fff)}

/* Multi-page horizontal wizard */
.pqpti-wizard{padding:0;overflow:hidden}
.pqpti-wizard-inner{padding:26px 30px 0}
.pqpti-progress{margin-bottom:22px}
.pqpti-progress-label{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px 16px;font-family:var(--pq-mono);font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--pq-blue);margin-bottom:10px}
.pqpti-progress-label span:last-child{color:var(--pq-muted);letter-spacing:.03em}
.pqpti-progress-track{height:4px;border-radius:999px;background:var(--pq-line);overflow:hidden}
.pqpti-progress-fill{height:100%;width:0;background:var(--pq-blue);border-radius:999px;transition:width .35s ease}
.pqpti-viewport{position:relative;overflow:hidden}
.pqpti-track{display:flex;width:100%;transition:transform .45s cubic-bezier(.16,1,.3,1);transform:translateX(calc(var(--pq-step,0) * -100%))}
.pqpti-page{flex:0 0 100%;min-width:0;box-sizing:border-box;padding:4px 66px 6px}
.pqpti-page[aria-hidden="true"]{visibility:hidden}
.pqpti-nav-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border-radius:50%;border:1px solid var(--pq-line-strong);background:var(--pq-card);color:var(--pq-ink);cursor:pointer;box-shadow:0 2px 8px rgba(22,38,30,.1);transition:background .15s ease,border-color .15s ease,color .15s ease}
.pqpti-nav-arrow:hover{background:var(--pq-blue);border-color:var(--pq-blue);color:#fff}
.pqpti-nav-arrow svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pqpti-nav-arrow[hidden]{display:none!important}
.pqpti-nav-back{left:10px}
.pqpti-nav-next{right:10px}
.pqpti-wizard-foot{display:flex;align-items:center;justify-content:flex-end;padding:22px 30px 28px;margin-top:6px;border-top:1px solid var(--pq-line)}
.pqpti-wizard-foot .pqpti-btn{min-width:112px}
.pqpti-btn[hidden]{display:none!important}
@media(max-width:760px){.pqpti-wizard-inner{padding:18px 18px 0}.pqpti-page{padding:2px 46px 4px}.pqpti-nav-arrow{width:34px;height:34px}.pqpti-nav-arrow svg{width:16px;height:16px}.pqpti-nav-back{left:4px}.pqpti-nav-next{right:4px}.pqpti-wizard-foot{padding:18px 18px 20px}.pqpti-wizard-foot .pqpti-btn{min-width:0;flex:1}}
</style>
<style><?php echo pqh_openproject_skin_css('pqpti', 'pqh-public-teacher-intake-page'); ?></style>
<main class="pqpti-shell">
  <div class="pqpti-wrap">
    <section class="pqpti-hero pqh-workspace-top">
      <span class="pqpti-navbrand">
        <?php
        // Show the institution's own logo when one is configured, falling back
        // to the initial tile for consumers that have not uploaded one yet.
        $pqptibrandlogo = trim((string)($consumercontext->logourl ?? ''));
        ?>
        <?php if ($pqptibrandlogo !== ''): ?>
          <span class="pqpti-navmark pqpti-navmark--img"><img src="<?php echo s($pqptibrandlogo); ?>" alt="<?php echo s($brandname); ?>"></span>
        <?php else: ?>
          <span class="pqpti-navmark"><?php echo s(pqh_consumer_brand_initials($consumercontext, 'E')); ?></span>
        <?php endif; ?>
        <span class="pqpti-navname"><?php echo s($brandname); ?></span>
      </span>
      <h1 class="pqpti-title pqh-workspace-title">Educator / Tutor Application</h1>
      <p class="pqpti-sub pqh-workspace-sub">Share the subjects you teach, the schools or workspaces you want to support, your service model, profile summary, and weekly availability. The team will review your application before workspace access or marketplace visibility is created.</p>
    </section>

    <?php if ($childschoolchoices): ?>
      <section class="pqpti-panel pqpti-school-pick">
        <h2>Which school is this for?</h2>
        <form method="get" action="<?php echo s((new moodle_url('/local/hubredirect/public_teacher_intake.php'))->out(false)); ?>" class="pqpti-school-pick-form">
          <?php foreach ($childschoolchoices as $childschool): ?>
            <label class="pqpti-school-pick-option">
              <input type="radio" name="workspaceid" value="<?php echo (int)$childschool->workspaceid; ?>"<?php echo ((int)$childschool->workspaceid === $selectedchildworkspaceid) ? ' checked' : ''; ?> onchange="this.form.submit();">
              <span><?php echo s((string)$childschool->consumername); ?></span>
            </label>
          <?php endforeach; ?>
          <noscript><button type="submit" class="pqpti-btn">Continue</button></noscript>
        </form>
        <?php if ($needsschoolselection): ?><p class="pqpti-muted pqpti-school-pick-hint">Select a school above to continue.</p><?php endif; ?>
      </section>
    <?php endif; ?>

    <?php if ($message !== ''): ?><div class="pqpti-alert pqpti-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($errors): ?>
      <div class="pqpti-alert pqpti-alert--bad">
        Please fix the highlighted fields below.
        <ul><?php foreach ($errors as $field => $msg): ?><li><?php echo s(pqpti_field_label((string)$field) . ': ' . $msg); ?></li><?php endforeach; ?></ul>
      </div>
    <?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqpti-panel"><div class="pqpti-empty">The teacher application form is not ready yet. Please contact <?php echo s($brandname); ?> support.</div></section>
    <?php elseif ($needsschoolselection): ?>
      <?php // The rest of the form is intentionally hidden until a school is picked above. ?>
    <?php else: ?>
      <section class="pqpti-panel pqpti-wizard">
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <?php if ((int)$consumercontext->workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
          <input type="hidden" name="formtime" value="<?php echo (int)$formtime; ?>">
          <input type="hidden" name="formtoken" value="<?php echo s($formtoken); ?>">
          <div class="pqpti-trap" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
          <div class="pqpti-wizard-inner">
            <h2>Application Details</h2>
            <div class="pqpti-progress">
              <div class="pqpti-progress-label"><span data-wizard-step-text>Step 1</span><span data-wizard-step-title></span></div>
              <div class="pqpti-progress-track"><div class="pqpti-progress-fill" data-wizard-fill></div></div>
            </div>
          </div>
          <div class="pqpti-viewport">
          <button type="button" class="pqpti-nav-arrow pqpti-nav-back" data-wizard-back aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg></button>
          <button type="button" class="pqpti-nav-arrow pqpti-nav-next" data-wizard-next aria-label="Next"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg></button>
          <div class="pqpti-track" data-wizard-track>
          <div class="pqpti-page">

          <h3>Basic teacher information</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Teacher/tutor name</label><input class="pqpti-input" name="teacher_name" value="<?php echo s(pqpti_value($form, 'teacher_name')); ?>"><?php echo pqpti_error($errors, 'teacher_name'); ?></div>
            <div class="pqpti-field"><label>Preferred name</label><input class="pqpti-input" name="preferred_name" value="<?php echo s(pqpti_value($form, 'preferred_name')); ?>"></div>
            <div class="pqpti-field"><label>Email</label><input class="pqpti-input" name="email" value="<?php echo s(pqpti_value($form, 'email')); ?>"><?php echo pqpti_error($errors, 'email'); ?></div>
            <div class="pqpti-field"><label>Phone / WhatsApp</label><input class="pqpti-input" name="phone" value="<?php echo s(pqpti_value($form, 'phone')); ?>"></div>
            <div class="pqpti-field"><label>Preferred contact method</label><?php echo pqpti_select('preferred_contact', $options['preferred_contact_methods'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Gender</label><select class="pqpti-input" name="gender"><option value=""<?php echo pqpti_selected($form, 'gender', ''); ?>>Select</option><option value="female"<?php echo pqpti_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqpti_selected($form, 'gender', 'male'); ?>>Male</option></select></div>
            <div class="pqpti-field"><label>Primary teaching language</label><?php echo pqpti_select('primary_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Other languages</label><?php echo pqpti_checkboxes('other_languages', $options['other_languages'] ?? [], $form, $errors); ?></div>
          </div>

          </div><div class="pqpti-page">
          <h3>Location</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Country</label><?php echo pqpti_select('country', $options['countries'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>City</label><?php echo pqpti_select('city', $options['cities'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>City not listed</label><input class="pqpti-input" name="city_other" value="<?php echo s(pqpti_value($form, 'city_other')); ?>"><?php echo pqpti_error($errors, 'city_other'); ?></div>
            <div class="pqpti-field"><label>Time zone</label><?php echo pqpti_select('timezone', $options['timezones'] ?? [], $form, $errors); ?></div>
          </div>

          </div><div class="pqpti-page">
          <?php if ($isprimaryeducation): ?>
            <h3>Primary education teaching details</h3>
            <div class="pqpti-grid">
              <div class="pqpti-field"><label>Primary grades or year levels taught</label><?php echo pqpti_checkboxes('primary_grades_taught', $options['primary_teacher_grade_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Primary curricula taught</label><?php echo pqpti_checkboxes('primary_curricula_taught', $options['primary_teacher_curricula'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Classroom-management experience</label><?php echo pqpti_select('primary_classroom_management', $options['primary_classroom_management_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Parent/guardian communication experience</label><?php echo pqpti_select('primary_parent_communication', $options['primary_parent_communication_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Child-safeguarding training status</label><?php echo pqpti_select('primary_safeguarding_status', $options['primary_safeguarding_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Learning-support or special-needs experience</label><?php echo pqpti_select('primary_learning_support', $options['primary_learning_support_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Lesson-planning and assessment experience</label><?php echo pqpti_select('primary_lesson_assessment', $options['primary_assessment_experience_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Primary teaching credential</label><input class="pqpti-input" name="primary_teaching_credential" value="<?php echo s(pqpti_value($form, 'primary_teaching_credential')); ?>"></div>
              <div class="pqpti-field"><label>Background-check status</label><?php echo pqpti_select('primary_background_check', $options['primary_background_check_statuses'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpti-field"><label>Additional primary teaching notes</label><textarea class="pqpti-textarea" name="primary_teacher_notes"><?php echo s(pqpti_value($form, 'primary_teacher_notes')); ?></textarea></div>
          </div><div class="pqpti-page">
          <?php endif; ?>

          <?php if ($ishighereducation): ?>
            <h3>Higher education teaching details</h3>
            <div class="pqpti-grid">
              <div class="pqpti-field"><label>Academic rank or teaching role</label><?php echo pqpti_select('higher_teacher_academic_rank', $options['higher_teacher_academic_ranks'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Disciplines taught</label><?php echo pqpti_checkboxes('higher_teacher_disciplines', $options['higher_teacher_disciplines'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Higher-education teaching experience</label><?php echo pqpti_select('higher_teacher_experience', $options['higher_teacher_experience_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Research experience</label><?php echo pqpti_select('higher_teacher_research_level', $options['higher_teacher_research_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Research supervision</label><?php echo pqpti_checkboxes('higher_teacher_supervision', $options['higher_teacher_supervision_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Course or programme design experience</label><?php echo pqpti_select('higher_teacher_course_design', $options['higher_teacher_course_design_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Assessment and moderation experience</label><?php echo pqpti_select('higher_teacher_assessment', $options['higher_teacher_assessment_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Accreditation or quality-assurance experience</label><?php echo pqpti_select('higher_teacher_accreditation', $options['higher_teacher_accreditation_levels'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpti-field"><label>Publications or research output</label><textarea class="pqpti-textarea" name="higher_teacher_publications"><?php echo s(pqpti_value($form, 'higher_teacher_publications')); ?></textarea></div>
            <div class="pqpti-field"><label>Additional higher-education teaching notes</label><textarea class="pqpti-textarea" name="higher_teacher_notes"><?php echo s(pqpti_value($form, 'higher_teacher_notes')); ?></textarea></div>
          </div><div class="pqpti-page">
          <?php endif; ?>

          <?php if ($istechnicaltraining): ?>
            <h3>Technical training teaching details</h3>
            <div class="pqpti-grid">
              <div class="pqpti-field"><label>Technical trades or programmes taught</label><?php echo pqpti_checkboxes('technical_teacher_trades', $options['technical_teacher_trades'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Relevant industry experience</label><?php echo pqpti_select('technical_teacher_industry_experience', $options['technical_teacher_industry_experience'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Technical or vocational qualification</label><input class="pqpti-input" name="technical_teacher_qualification" value="<?php echo s(pqpti_value($form, 'technical_teacher_qualification')); ?>"></div>
              <div class="pqpti-field"><label>Workshop or practical-training competence</label><?php echo pqpti_select('technical_teacher_workshop_level', $options['technical_teacher_practical_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Tools and equipment competence</label><?php echo pqpti_select('technical_teacher_equipment_level', $options['technical_teacher_practical_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Safety-certification status</label><?php echo pqpti_select('technical_teacher_safety_status', $options['technical_teacher_safety_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Apprenticeship supervision experience</label><?php echo pqpti_select('technical_teacher_apprenticeship', $options['technical_teacher_supervision_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Practical competency assessment</label><?php echo pqpti_select('technical_teacher_assessment', $options['technical_teacher_assessment_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Workplace-based training experience</label><?php echo pqpti_select('technical_teacher_workplace_training', $options['technical_teacher_workplace_training_levels'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpti-field"><label>Trade licences or professional certifications</label><textarea class="pqpti-textarea" name="technical_teacher_licenses"><?php echo s(pqpti_value($form, 'technical_teacher_licenses')); ?></textarea></div>
            <div class="pqpti-field"><label>Additional technical-training teaching notes</label><textarea class="pqpti-textarea" name="technical_teacher_notes"><?php echo s(pqpti_value($form, 'technical_teacher_notes')); ?></textarea></div>
          </div><div class="pqpti-page">
          <?php endif; ?>

          <?php if ($isadultlearning): ?>
            <h3>Adult learning teaching details</h3>
            <div class="pqpti-grid">
              <div class="pqpti-field"><label>Adult-learning areas taught</label><?php echo pqpti_checkboxes('adult_teacher_areas', $options['adult_teacher_learning_areas'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Adult-learning teaching experience</label><?php echo pqpti_select('adult_teacher_experience', $options['adult_teacher_experience_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Adult literacy instruction</label><?php echo pqpti_select('adult_teacher_literacy_instruction', $options['adult_teacher_instruction_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Adult numeracy instruction</label><?php echo pqpti_select('adult_teacher_numeracy_instruction', $options['adult_teacher_instruction_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Digital-literacy instruction</label><?php echo pqpti_select('adult_teacher_digital_instruction', $options['adult_teacher_instruction_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Multi-level adult-group facilitation</label><?php echo pqpti_select('adult_teacher_multilevel_facilitation', $options['adult_teacher_facilitation_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Supporting adults returning to learning</label><?php echo pqpti_select('adult_teacher_confidence_support', $options['adult_teacher_learner_support_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Community outreach experience</label><?php echo pqpti_select('adult_teacher_community_outreach', $options['adult_teacher_community_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Supporting attendance or access barriers</label><?php echo pqpti_select('adult_teacher_barrier_support', $options['adult_teacher_barrier_support_levels'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpti-field"><label>Additional adult-learning teaching notes</label><textarea class="pqpti-textarea" name="adult_teacher_notes"><?php echo s(pqpti_value($form, 'adult_teacher_notes')); ?></textarea></div>
          </div><div class="pqpti-page">
          <?php endif; ?>

          <?php if ($isprofessionaldevelopment): ?>
            <h3>Professional development teaching details</h3>
            <div class="pqpti-grid">
              <div class="pqpti-field"><label>Professional-development areas</label><?php echo pqpti_checkboxes('professional_teacher_areas', $options['professional_teacher_areas'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Relevant industry experience</label><?php echo pqpti_select('professional_teacher_industry_experience', $options['professional_teacher_industry_experience'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Professional responsibility level</label><?php echo pqpti_select('professional_teacher_responsibility', $options['professional_teacher_responsibility_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Workshop and course facilitation experience</label><?php echo pqpti_select('professional_teacher_facilitation', $options['professional_teacher_facilitation_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Coaching or mentoring experience</label><?php echo pqpti_select('professional_teacher_coaching', $options['professional_teacher_coaching_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Corporate or organisational training</label><?php echo pqpti_select('professional_teacher_corporate_training', $options['professional_teacher_corporate_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>CPD or accreditation experience</label><?php echo pqpti_select('professional_teacher_cpd', $options['professional_teacher_cpd_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Workplace-outcome measurement</label><?php echo pqpti_select('professional_teacher_outcome_measurement', $options['professional_teacher_outcome_levels'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpti-field"><label>Professional credentials or certifications</label><textarea class="pqpti-textarea" name="professional_teacher_credentials"><?php echo s(pqpti_value($form, 'professional_teacher_credentials')); ?></textarea></div>
            <div class="pqpti-field"><label>Relevant workplace results or case studies</label><textarea class="pqpti-textarea" name="professional_teacher_case_studies"><?php echo s(pqpti_value($form, 'professional_teacher_case_studies')); ?></textarea></div>
            <div class="pqpti-field"><label>Additional professional-development teaching notes</label><textarea class="pqpti-textarea" name="professional_teacher_notes"><?php echo s(pqpti_value($form, 'professional_teacher_notes')); ?></textarea></div>
          </div><div class="pqpti-page">
          <?php endif; ?>

          <?php if ($isfaithbased): ?>
            <h3>Religious / faith-based teaching details</h3>
            <div class="pqpti-grid">
              <div class="pqpti-field"><label>Faith-study areas taught</label><?php echo pqpti_checkboxes('faith_teacher_subjects', $options[$faithsubjectoptionkey] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Faith-based teaching experience</label><?php echo pqpti_select('faith_teacher_experience', $options['faith_teacher_experience_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label><?php echo s($faithscripturelabel); ?></label><?php echo pqpti_select('faith_teacher_scripture_proficiency', $options['faith_teacher_proficiency_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label><?php echo s($faithinterpretationlabel); ?></label><?php echo pqpti_select('faith_teacher_interpretation_level', $options['faith_teacher_interpretation_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label><?php echo s($faithlanguagelabel); ?></label><?php echo pqpti_select('faith_teacher_language_level', $options['faith_teacher_language_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label><?php echo s($faithpracticelabel); ?></label><?php echo pqpti_select('faith_teacher_practice_level', $options['faith_teacher_practice_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Faith-community teaching experience</label><?php echo pqpti_select('faith_teacher_community_experience', $options['faith_teacher_community_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpti-field"><label>Faith-community reference</label><?php echo pqpti_select('faith_teacher_reference', $options['faith_teacher_reference_options'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpti-field"><label>Faith-study qualification, authorisation, or teaching credential</label><textarea class="pqpti-textarea" name="faith_teacher_qualification"><?php echo s(pqpti_value($form, 'faith_teacher_qualification')); ?></textarea><?php echo pqpti_error($errors, 'faith_teacher_qualification'); ?></div>
            <div class="pqpti-field"><label>Additional faith-based teaching notes</label><textarea class="pqpti-textarea" name="faith_teacher_notes"><?php echo s(pqpti_value($form, 'faith_teacher_notes')); ?></textarea></div>
          </div><div class="pqpti-page">
          <?php endif; ?>

          <h3>Teaching Services</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>How do you want to teach?</label><?php echo pqpti_radio_cards('teacher_work_models', $options['teacher_work_models'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field pqpti-field--wide"><label>Service modes</label><?php echo pqpti_checkboxes('service_modes', $options['service_modes'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field pqpti-field--wide"><label>Subjects you can teach</label><?php echo pqpti_checkboxes('subject_areas', $options['subject_areas'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field pqpti-field--tight"><label>Language subject</label><?php echo pqpti_select('subject_language', $options['subject_languages'] ?? [], $form, $errors, 'Select language'); ?></div>
            <div class="pqpti-field pqpti-field--tight"><label>Other subjects or specialties</label><textarea class="pqpti-textarea" name="subject_other" placeholder="Examples: biology, chemistry, accounting, robotics, Quran ijazah track, special curriculum"><?php echo s(pqpti_value($form, 'subject_other')); ?></textarea><?php echo pqpti_error($errors, 'subject_other'); ?></div>
            <div class="pqpti-field pqpti-field--wide"><label>Learner levels</label><?php echo pqpti_checkboxes('age_groups', $options['age_groups'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Teaching levels</label><?php echo pqpti_checkboxes('general_levels', $options['general_levels'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>School / workspace preferences</label><textarea class="pqpti-textarea" name="workspace_preferences" placeholder="Independent teachers: describe your current students, clients, school, or workspace needs. Marketplace teachers: describe the learners or clients you hope to be matched with."><?php echo s(pqpti_value($form, 'workspace_preferences')); ?></textarea><?php echo pqpti_error($errors, 'workspace_preferences'); ?></div>
            <div class="pqpti-field"><label>Desired services / notes</label><textarea class="pqpti-textarea" name="desired_services" placeholder="Describe the exact services you want to offer, including any school, tutoring, marketplace, live session, or subject-specific goals"><?php echo s(pqpti_value($form, 'desired_services')); ?></textarea></div>
          </div>

          </div><div class="pqpti-page">
          <h3>Qualifications and experience</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Teaching or training experience</label><?php echo pqpti_select('teaching_experience_range', $options['teaching_experience_ranges'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Years of experience</label><input class="pqpti-input" name="years_experience" type="number" min="0" max="80" value="<?php echo s(pqpti_value($form, 'years_experience')); ?>"><?php echo pqpti_error($errors, 'years_experience'); ?></div>
            <div class="pqpti-field"><label>Highest qualification</label><?php echo pqpti_select('highest_qualification', $options['teacher_qualification_levels'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Qualification title</label><input class="pqpti-input" name="qualification_title" value="<?php echo s(pqpti_value($form, 'qualification_title')); ?>"></div>
            <div class="pqpti-field"><label>Awarding institution</label><input class="pqpti-input" name="awarding_institution" value="<?php echo s(pqpti_value($form, 'awarding_institution')); ?>"></div>
            <div class="pqpti-field"><label>Graduation year</label><input class="pqpti-input" name="graduation_year" type="number" min="1900" max="2100" value="<?php echo s(pqpti_value($form, 'graduation_year')); ?>"></div>
            <div class="pqpti-field"><label>Teaching or training qualification</label><input class="pqpti-input" name="teaching_qualification" value="<?php echo s(pqpti_value($form, 'teaching_qualification')); ?>"></div>
            <div class="pqpti-field"><label>Schools, institutions, and freelance teaching</label><textarea class="pqpti-textarea" name="institution_experience" placeholder="List schools, institutions, tutoring centers, and freelance/independent teaching experience"><?php echo s(pqpti_value($form, 'institution_experience')); ?></textarea><?php echo pqpti_error($errors, 'institution_experience'); ?></div>
            <div class="pqpti-field"><label>Teaching experience</label><textarea class="pqpti-textarea" name="experience"><?php echo s(pqpti_value($form, 'experience')); ?></textarea><?php echo pqpti_error($errors, 'experience'); ?></div>
            <div class="pqpti-field"><label>Education / qualifications</label><textarea class="pqpti-textarea" name="education"><?php echo s(pqpti_value($form, 'education')); ?></textarea></div>
            <div class="pqpti-field"><label>Teaching style</label><textarea class="pqpti-textarea" name="teaching_style"><?php echo s(pqpti_value($form, 'teaching_style')); ?></textarea></div>
            <div class="pqpti-field"><label>Teaching offer summary</label><textarea class="pqpti-textarea" name="teaching_offer_summary" placeholder="Example: Arabic for beginners, conversational Arabic, reading, grammar, and private online tutoring"><?php echo s(pqpti_value($form, 'teaching_offer_summary')); ?></textarea><?php echo pqpti_error($errors, 'teaching_offer_summary'); ?></div>
            <div class="pqpti-field"><label>Learner outcomes</label><textarea class="pqpti-textarea" name="learner_outcomes" placeholder="What learners should be able to do after lessons or a course"><?php echo s(pqpti_value($form, 'learner_outcomes')); ?></textarea><?php echo pqpti_error($errors, 'learner_outcomes'); ?></div>
            <div class="pqpti-field"><label>Curriculum and materials</label><textarea class="pqpti-textarea" name="curriculum_materials" placeholder="Books, curriculum, worksheets, slides, assessments, or custom material used"><?php echo s(pqpti_value($form, 'curriculum_materials')); ?></textarea><?php echo pqpti_error($errors, 'curriculum_materials'); ?></div>
          </div>

          </div><div class="pqpti-page">
          <h3>Teaching preferences and readiness</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Preferred teaching format</label><?php echo pqpti_select('preferred_teaching_format', $options['preferred_teaching_formats'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Preferred learner arrangement</label><?php echo pqpti_select('preferred_learner_arrangement', $options['preferred_learner_arrangements'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Preferred weekly hours</label><input class="pqpti-input" name="preferred_weekly_hours" type="number" min="1" max="60" value="<?php echo s(pqpti_value($form, 'preferred_weekly_hours')); ?>"></div>
            <div class="pqpti-field"><label>Earliest available start date</label><input class="pqpti-input" name="available_start_date" type="date" value="<?php echo s(pqpti_value($form, 'available_start_date')); ?>"></div>
            <div class="pqpti-field"><label>Technology and internet readiness</label><?php echo pqpti_select('technology_readiness', $options['technology_readiness_options'] ?? [], $form, $errors); ?></div>
            <div class="pqpti-field"><label>Professional reference available</label><?php echo pqpti_select('professional_reference', $options['professional_reference_options'] ?? [], $form, $errors); ?></div>
          </div>
          <div class="pqpti-field"><label>Accessibility or workplace support needs</label><textarea class="pqpti-textarea" name="teacher_support_needs"><?php echo s(pqpti_value($form, 'teacher_support_needs')); ?></textarea></div>

          </div><div class="pqpti-page">
          <h3>Online Presence</h3>
          <div class="pqpti-grid">
            <div class="pqpti-field"><label>Online teaching brand/profile name</label><input class="pqpti-input" name="online_profile_name" value="<?php echo s(pqpti_value($form, 'online_profile_name')); ?>" placeholder="Example: MasterArabic Online"><?php echo pqpti_error($errors, 'online_profile_name'); ?></div>
            <div class="pqpti-field"><label>Social media handle</label><input class="pqpti-input" name="instagram_handle" value="<?php echo s(pqpti_value($form, 'instagram_handle')); ?>" placeholder="@masterarabic_online"><?php echo pqpti_error($errors, 'instagram_handle'); ?></div>
            <div class="pqpti-field"><label>Public social profile URL</label><input class="pqpti-input" name="social_profile_url" value="<?php echo s(pqpti_value($form, 'social_profile_url')); ?>" placeholder="https://www.instagram.com/masterarabic_online"><?php echo pqpti_error($errors, 'social_profile_url'); ?></div>
            <div class="pqpti-field"><label>Website or booking link</label><input class="pqpti-input" name="website_or_booking_url" value="<?php echo s(pqpti_value($form, 'website_or_booking_url')); ?>" placeholder="https://..."><?php echo pqpti_error($errors, 'website_or_booking_url'); ?></div>
            <div class="pqpti-field"><label>Demo lesson or sample video link</label><input class="pqpti-input" name="demo_video_url" value="<?php echo s(pqpti_value($form, 'demo_video_url')); ?>" placeholder="https://..."><?php echo pqpti_error($errors, 'demo_video_url'); ?></div>
            <div class="pqpti-field"><label>Public profile summary</label><textarea class="pqpti-textarea" name="bio"><?php echo s(pqpti_value($form, 'bio')); ?></textarea><?php echo pqpti_error($errors, 'bio'); ?></div>
            <div class="pqpti-field"><label>Social proof / reviews</label><textarea class="pqpti-textarea" name="social_proof" placeholder="Follower/community signal, testimonials, results, screenshots to review, or references"><?php echo s(pqpti_value($form, 'social_proof')); ?></textarea><?php echo pqpti_error($errors, 'social_proof'); ?></div>
          </div>

          </div><div class="pqpti-page">
          <h3>Weekly Availability</h3>
          <div class="pqpti-field">
            <label>Select all recurring times that could work</label>
            <div class="pqpti-calendar">
              <table>
                <thead><tr><th>Day</th><?php foreach (($options['availability_time_windows'] ?? []) as $hour => $label): ?><th><?php echo s((string)$label); ?></th><?php endforeach; ?></tr></thead>
                <tbody>
                  <?php foreach (($options['availability_days'] ?? []) as $day => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($options['availability_time_windows'] ?? []) as $hour => $hourlabel): $slot = (string)$day . '|' . (string)$hour; ?>
                        <td><label class="pqpti-slot" title="<?php echo s((string)$daylabel . ' ' . (string)$hourlabel); ?>"><input type="checkbox" name="slots[]" value="<?php echo s($slot); ?>"<?php echo pqpti_checked($form, 'slots', $slot); ?>></label></td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqpti_error($errors, 'availability'); ?>
          </div>

          </div><div class="pqpti-page">
          <h3>Additional Notes</h3>
          <div class="pqpti-field"><label>How did you hear about us?</label><input class="pqpti-input" name="referral_source" value="<?php echo s(pqpti_value($form, 'referral_source')); ?>"></div>
          <div class="pqpti-field"><label><input type="checkbox" name="verification_consent" value="1"<?php echo pqpti_value($form, 'verification_consent') === '1' ? ' checked' : ''; ?>> I consent to verification of my qualifications and professional references.</label><?php echo pqpti_error($errors, 'verification_consent'); ?></div>
          <div class="pqpti-field"><label>Anything else the review team should know?</label><textarea class="pqpti-textarea" name="notes"><?php echo s(pqpti_value($form, 'notes')); ?></textarea></div>

          </div></div></div>
          <div class="pqpti-wizard-foot">
            <button class="pqpti-btn" type="submit" data-wizard-submit>Submit teacher application</button>
          </div>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var wizard = document.querySelector('.pqpti-wizard');
  if (!wizard) {
    return;
  }
  var form = wizard.querySelector('form') || wizard;
  var track = wizard.querySelector('[data-wizard-track]');
  var pages = Array.prototype.slice.call(wizard.querySelectorAll('.pqpti-page'));
  var backBtn = wizard.querySelector('[data-wizard-back]');
  var nextBtn = wizard.querySelector('[data-wizard-next]');
  var submitBtn = wizard.querySelector('[data-wizard-submit]');
  var fill = wizard.querySelector('[data-wizard-fill]');
  var stepText = wizard.querySelector('[data-wizard-step-text]');
  var stepTitle = wizard.querySelector('[data-wizard-step-title]');
  if (!track || pages.length < 2 || !backBtn || !nextBtn || !submitBtn) {
    return;
  }

  var current = 0;
  var errorField = wizard.querySelector('.pqpti-field--error, .pqpti-error');
  if (errorField) {
    var errorPage = errorField.closest('.pqpti-page');
    var errorIndex = errorPage ? pages.indexOf(errorPage) : -1;
    if (errorIndex >= 0) {
      current = errorIndex;
    }
  }

  function pageTitle(page) {
    var heading = page.querySelector('h3');
    return heading ? heading.textContent.trim() : '';
  }

  function render() {
    track.style.setProperty('--pq-step', current);
    pages.forEach(function(page, index) {
      page.setAttribute('aria-hidden', index === current ? 'false' : 'true');
    });
    if (fill) {
      fill.style.width = (((current + 1) / pages.length) * 100) + '%';
    }
    if (stepText) {
      stepText.textContent = 'Step ' + (current + 1) + ' of ' + pages.length;
    }
    if (stepTitle) {
      stepTitle.textContent = pageTitle(pages[current]);
    }
    var isLast = current === pages.length - 1;
    backBtn.hidden = current === 0;
    nextBtn.hidden = isLast;
    submitBtn.hidden = !isLast;
  }

  function go(delta) {
    var target = current + delta;
    if (target < 0 || target >= pages.length) {
      return;
    }
    current = target;
    render();
    wizard.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  backBtn.addEventListener('click', function() { go(-1); });
  nextBtn.addEventListener('click', function() { go(1); });

  form.addEventListener('keydown', function(event) {
    if (event.key !== 'Enter') {
      return;
    }
    var tag = (event.target && event.target.tagName || '').toLowerCase();
    if (tag === 'textarea' || event.target === submitBtn) {
      return;
    }
    if (current !== pages.length - 1) {
      event.preventDefault();
      go(1);
    }
  });

  render();
})();
</script>
<?php
echo $OUTPUT->footer();
