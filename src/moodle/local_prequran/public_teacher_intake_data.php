<?php
// Public teacher-intake endpoint (hubredirect migration) — cookieless JSON API
// for the Bunny-hosted public teacher-application page
// (portal/public-teacher-intake.html). Ported query-for-query from
// local_hubredirect/public_teacher_intake.php, which stays live in parallel
// (parallel-run; legacy untouched).
//
//   GET  public_teacher_intake_data.php?consumer=<slug>[&workspaceid=]
//        -> bootstrap JSON: formtime + stateless formtoken, consumer branding +
//           institution-type flags/faith labels, option lists, field labels.
//   POST public_teacher_intake_data.php?consumer=<slug>  (JSON body)
//        -> validates + inserts local_prequran_teacher_intake_request exactly
//           like the legacy page.
//
// This is a PUBLIC endpoint by design (the legacy page has no require_login
// either — it runs as guest). There is no authenticated user and no launch
// token: abuse control is the same layered set the legacy page uses — honeypot
// 'website' field and a min/max form-time trap bound into an HMAC form token —
// plus live_audit events. The legacy page's require_sesskey and 60s $SESSION
// cooldown cannot exist cookieless and are intentionally dropped; the HMAC
// token + time trap remain the limiter. (The legacy teacher page had NO
// per-contact rate window, so none is added here.)

define('NO_MOODLE_COOKIES', true);
require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($allowed = pqpg_allowed_origin($origin)) {
    header('Access-Control-Allow-Origin: ' . $allowed);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function pqptid_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

// Field-level failure in the same shape the sibling public student-intake
// endpoint returns: {ok:false, error, fielderrors:{field:msg}, fieldlabels:{field:label}}.
function pqptid_field_errors(array $fielderrors): void {
    $fieldlabels = [];
    foreach ($fielderrors as $fieldname => $unused) {
        $fieldlabels[$fieldname] = pqptil_field_label((string)$fieldname);
    }
    echo json_encode([
        'ok' => false,
        'error' => 'Please fix the highlighted fields below.',
        'fielderrors' => $fielderrors,
        'fieldlabels' => $fieldlabels,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Answer JSON even when something breaks — but unlike the token-gated portal
// endpoint, this one is PUBLIC: keep the diagnostic detail in the server error
// log and return only a generic message to the caller.
set_exception_handler(function (Throwable $e) {
    error_log('public_teacher_intake_data: ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Unexpected server error. Please try again later.']);
    exit;
});

require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/public_teacher_intake_portallib.php');

$options = require($CFG->dirroot . '/local/hubredirect/teacher_intake_config.php');

// Fail closed if the HMAC secret is missing/blank (e.g. mid-rotation): with an
// empty key the form token would be forgeable by anyone, so refuse to serve.
if ((string)get_config('local_prequran', 'progress_launch_secret') === '') {
    pqptid_fail(503, 'The public teacher application form is not configured yet. Please try again later.');
}

// Consumer context — same resolution chain as the sibling public endpoint,
// driven by the ?consumer= / ?workspaceid= params (the CDN host the page is
// served from carries no consumer meaning; this endpoint's own host is the
// Moodle host).
$consumercontext = pqh_requested_consumer_context();
$requestedslug = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedslug !== '' && (string)($consumercontext->consumerslug ?? '') !== $requestedslug) {
    $slugcontext = pqh_consumer_context_by_slug($requestedslug);
    if ((string)($slugcontext->consumerslug ?? '') === $requestedslug
        && ($requestedworkspaceid <= 0 || (int)($slugcontext->workspaceid ?? 0) === $requestedworkspaceid)) {
        $consumercontext = $slugcontext;
    }
}
if ($requestedworkspaceid > 0 && (int)($consumercontext->workspaceid ?? 0) !== $requestedworkspaceid) {
    $workspacecontext = pqh_consumer_context_by_workspace($requestedworkspaceid);
    if ($workspacecontext) {
        $consumercontext = $workspacecontext;
    }
}
$options['course_types'] = pqco_workspace_course_options($consumercontext, [], true);
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

$ready = pqptil_table_exists('local_prequran_teacher_intake_request');
$method = (string)($_SERVER['REQUEST_METHOD'] ?? '');

if ($method === 'GET') {
    // Field labels for every field the public form can flag (mirror the legacy
    // pqpti_field_label map) so the page can echo legacy-exact error labels.
    $labelnames = [
        'form_security', 'availability',
        'teacher_name', 'email', 'phone', 'gender', 'country', 'city', 'city_other', 'timezone',
        'primary_language', 'teacher_work_models', 'service_modes', 'subject_language', 'subject_areas',
        'subject_other', 'age_groups', 'general_levels', 'workspace_preferences', 'years_experience',
        'institution_experience', 'courses', 'levels', 'experience', 'bio', 'online_profile_name',
        'instagram_handle', 'social_profile_url', 'website_or_booking_url', 'demo_video_url',
        'teaching_offer_summary', 'learner_outcomes', 'curriculum_materials', 'social_proof',
        'preferred_contact', 'teaching_experience_range', 'highest_qualification',
        'preferred_teaching_format', 'verification_consent', 'desired_services',
        'preferred_learner_arrangement', 'technology_readiness', 'professional_reference',
        'primary_grades_taught', 'primary_curricula_taught', 'primary_classroom_management',
        'primary_parent_communication', 'primary_safeguarding_status', 'primary_learning_support',
        'primary_lesson_assessment', 'primary_background_check',
        'higher_teacher_academic_rank', 'higher_teacher_disciplines', 'higher_teacher_experience',
        'higher_teacher_research_level', 'higher_teacher_supervision', 'higher_teacher_course_design',
        'higher_teacher_assessment', 'higher_teacher_accreditation',
        'technical_teacher_trades', 'technical_teacher_industry_experience', 'technical_teacher_workshop_level',
        'technical_teacher_equipment_level', 'technical_teacher_safety_status', 'technical_teacher_apprenticeship',
        'technical_teacher_assessment', 'technical_teacher_workplace_training',
        'adult_teacher_areas', 'adult_teacher_experience', 'adult_teacher_literacy_instruction',
        'adult_teacher_numeracy_instruction', 'adult_teacher_digital_instruction',
        'adult_teacher_multilevel_facilitation', 'adult_teacher_confidence_support',
        'adult_teacher_community_outreach', 'adult_teacher_barrier_support',
        'professional_teacher_areas', 'professional_teacher_industry_experience',
        'professional_teacher_responsibility', 'professional_teacher_facilitation',
        'professional_teacher_coaching', 'professional_teacher_corporate_training',
        'professional_teacher_cpd', 'professional_teacher_outcome_measurement',
        'faith_teacher_subjects', 'faith_teacher_experience', 'faith_teacher_qualification',
        'faith_teacher_scripture_proficiency', 'faith_teacher_interpretation_level',
        'faith_teacher_language_level', 'faith_teacher_practice_level',
        'faith_teacher_community_experience', 'faith_teacher_reference',
        'preferred_weekly_hours', 'graduation_year',
    ];
    $fieldlabels = [];
    foreach ($labelnames as $labelname) {
        $fieldlabels[$labelname] = pqptil_field_label($labelname);
    }

    $formtime = time();
    echo json_encode([
        'ok' => true,
        'ready' => $ready,
        'notready_message' => $ready ? '' : 'The teacher application form is not ready yet. Please contact ' . $brandname . ' support.',
        'formtime' => $formtime,
        'formtoken' => pqptil_security_token($formtime),
        'consumer' => [
            'slug' => (string)($consumercontext->consumerslug ?? ''),
            'name' => $brandname,
            'consumerid' => (int)($consumercontext->consumerid ?? 0),
            'workspaceid' => (int)($consumercontext->workspaceid ?? 0),
            'institution_type' => $institutiontype,
            'faith_subcategory' => $faithsubcategory,
            'is_primary_education' => $isprimaryeducation,
            'is_higher_education' => $ishighereducation,
            'is_technical_training' => $istechnicaltraining,
            'is_adult_learning' => $isadultlearning,
            'is_professional_development' => $isprofessionaldevelopment,
            'is_faith_based' => $isfaithbased,
            'faith_subject_optionkey' => $faithsubjectoptionkey,
            'faith_scripture_label' => $faithscripturelabel,
            'faith_interpretation_label' => $faithinterpretationlabel,
            'faith_language_label' => $faithlanguagelabel,
            'faith_practice_label' => $faithpracticelabel,
        ],
        'options' => $options,
        'fieldlabels' => $fieldlabels,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($method !== 'POST') {
    pqptid_fail(405, 'Method not allowed.');
}

// ---- POST: mirror the legacy verification flow, cookieless -----------------

// a) ready-check (same table gate as legacy; legacy shows the not-ready panel
// and never processes the POST).
if (!$ready) {
    pqptid_fail(503, 'The teacher application form is not ready yet. Please contact ' . $brandname . ' support.');
}

$body = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($body)) {
    pqptid_fail(400, 'Invalid JSON body.');
}

// Feed the JSON body through Moodle's param cleaning by populating $_POST so
// the verbatim legacy extraction (optional_param / optional_param_array via the
// pqptil_ helpers) applies the exact same PARAM_* cleaning.
$_POST = $body;

$honeypot = trim((string)($body['website'] ?? ''));
$postedformtime = (int)($body['formtime'] ?? 0);
$postedtoken = (string)($body['formtoken'] ?? '');

// Verbatim legacy form default map (public_teacher_intake.php).
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

// Verbatim legacy extraction (pqpti_ -> pqptil_).
foreach ($form as $field => $default) {
    if ($field === 'teacher_work_models') {
        $form[$field] = pqptil_work_model_values(pqptil_single_array_param($field));
    } else {
        $form[$field] = is_array($default) ? pqptil_array_param($field) : pqptil_limit(pqptil_trim($field, (string)$default), in_array($field, ['experience', 'education', 'teaching_style', 'bio', 'desired_services', 'notes', 'subject_other', 'workspace_preferences', 'institution_experience', 'teaching_offer_summary', 'learner_outcomes', 'curriculum_materials', 'social_proof', 'teacher_support_needs', 'primary_teacher_notes', 'higher_teacher_publications', 'higher_teacher_notes', 'technical_teacher_licenses', 'technical_teacher_notes', 'adult_teacher_notes', 'professional_teacher_credentials', 'professional_teacher_case_studies', 'professional_teacher_notes', 'faith_teacher_qualification', 'faith_teacher_notes'], true) ? 4000 : 255);
    }
}

// b) honeypot — legacy records the generic form_security error (it does NOT
// pretend success); mirror that and audit.
if ($honeypot !== '') {
    pqptil_security_audit('public_teacher_intake_blocked_honeypot');
    pqptid_field_errors(['form_security' => 'The request could not be accepted. Please reload the form and try again.']);
}

// c) stateless form token + time trap (legacy messages verbatim). The legacy
// require_sesskey() cannot exist cookieless and is intentionally dropped; the
// HMAC token below is the CSRF/replay control.
$elapsed = time() - $postedformtime;
if ($postedformtime <= 0 || !hash_equals(pqptil_security_token($postedformtime), $postedtoken)) {
    pqptil_security_audit('public_teacher_intake_blocked_token');
    pqptid_field_errors(['form_security' => 'The form security token expired. Please reload the form and try again.']);
} else if ($elapsed < pqptil_min_form_seconds() || $elapsed > pqptil_max_form_seconds()) {
    pqptil_security_audit('public_teacher_intake_blocked_timing', ['elapsed' => $elapsed]);
    pqptid_field_errors(['form_security' => 'Please reload the form and submit again.']);
}

// (Legacy's 60s $SESSION cooldown lived here; impossible cookieless and
// intentionally dropped. The legacy teacher page had no per-contact rate
// window, so none is added.)

// d) full legacy validation block (verbatim, pqpti_ -> pqptil_).
$errors = [];
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
    if (pqptil_value($form, $field) === '') {
        $errors[$field] = $error;
    }
}
if (pqptil_value($form, 'verification_consent') !== '1') {
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
    if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
        if (pqptil_value($form, $field) === '') {
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
        if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
        if (pqptil_value($form, $field) === '') {
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
        if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
        if (pqptil_value($form, $field) === '') {
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
        if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
        if (pqptil_value($form, $field) === '') {
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
        if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
        if (pqptil_value($form, $field) === '') {
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
        if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
        if (pqptil_value($form, $field) === '') {
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
        if (pqptil_value($form, $field) !== '' && !array_key_exists(pqptil_value($form, $field), $options[$optionkey] ?? [])) {
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
if (!pqptil_contact_ok(pqptil_value($form, 'email'), pqptil_value($form, 'phone'))) {
    $errors['email'] = 'Enter a valid email address or phone/WhatsApp number.';
}
if (!$form['teacher_work_models']) {
    $errors['teacher_work_models'] = 'Select whether you want to teach as an independent teacher/tutor or marketplace teacher/tutor.';
}
if (!$form['service_modes']) {
    $errors['service_modes'] = 'Select at least one teaching service mode.';
}
if (pqptil_value($form, 'subject_language') === '' && !$form['subject_areas']) {
    $errors['subject_areas'] = 'Select at least one subject you can teach or choose a language subject.';
}
if (in_array('other_subjects', $form['subject_areas'], true) && pqptil_value($form, 'subject_other') === '') {
    $errors['subject_other'] = 'Please describe the other subjects you can teach.';
}
if (!$form['age_groups']) {
    $errors['age_groups'] = 'Select at least one learner level.';
}
if (!$form['general_levels']) {
    $errors['general_levels'] = 'Select at least one teaching level.';
}
if (pqptil_value($form, 'years_experience') !== '' && ((int)pqptil_value($form, 'years_experience') < 0 || (int)pqptil_value($form, 'years_experience') > 80)) {
    $errors['years_experience'] = 'Enter years of experience between 0 and 80.';
}
if (pqptil_value($form, 'preferred_weekly_hours') !== '' && ((int)pqptil_value($form, 'preferred_weekly_hours') < 1 || (int)pqptil_value($form, 'preferred_weekly_hours') > 60)) {
    $errors['preferred_weekly_hours'] = 'Enter preferred weekly hours between 1 and 60.';
}
if (pqptil_value($form, 'graduation_year') !== '' && ((int)pqptil_value($form, 'graduation_year') < 1900 || (int)pqptil_value($form, 'graduation_year') > 2100)) {
    $errors['graduation_year'] = 'Enter a valid graduation year.';
}
if (!$form['slots']) {
    $errors['availability'] = 'Select at least one weekly availability time.';
}
if (pqptil_value($form, 'city') === 'Other' && pqptil_value($form, 'city_other') === '') {
    $errors['city_other'] = 'Please enter the city name.';
}
foreach (['social_profile_url', 'website_or_booking_url', 'demo_video_url'] as $urlfield) {
    if (!pqptil_url_ok(pqptil_value($form, $urlfield))) {
        $errors[$urlfield] = 'Enter a full URL starting with http:// or https://.';
    }
}
if ($errors) {
    pqptid_field_errors($errors);
}

// e) insert (verbatim legacy record build + guarded optional columns).
$now = time();
$slots = [];
foreach ($form['slots'] as $slot) {
    [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
    if ($day !== '' && $hour !== '') {
        $slots[] = [
            'day' => $day,
            'time' => $hour,
            'day_label' => pqptil_label($day, $options['availability_days'] ?? []),
            'time_label' => pqptil_label($hour, $options['availability_time_windows'] ?? []),
        ];
    }
}
$city = pqptil_value($form, 'city') === 'Other' ? pqptil_value($form, 'city_other') : pqptil_value($form, 'city');
$record = (object)[
    'consumerid' => (int)$consumercontext->consumerid,
    'workspaceid' => (int)$consumercontext->workspaceid,
    'teacher_name' => pqptil_value($form, 'teacher_name'),
    'email' => pqptil_value($form, 'email'),
    'phone' => pqptil_value($form, 'phone'),
    'country' => pqptil_value($form, 'country'),
    'city' => $city,
    'timezone' => pqptil_value($form, 'timezone'),
    'primary_language' => pqptil_value($form, 'primary_language'),
    'other_languages' => implode(', ', pqptil_labels($form['other_languages'], $options['other_languages'] ?? [])),
    'courses' => implode(', ', pqptil_labels($form['courses'], $options['course_types'] ?? [])),
    'levels' => implode(', ', pqptil_labels($form['general_levels'], $options['general_levels'] ?? [])),
    'experience' => pqptil_value($form, 'experience'),
    'education' => pqptil_value($form, 'education'),
    'teaching_style' => pqptil_value($form, 'teaching_style'),
    'bio' => pqptil_value($form, 'bio'),
    'availability_json' => json_encode(['timezone' => pqptil_value($form, 'timezone'), 'slots' => $slots], JSON_UNESCAPED_SLASHES),
    'availability_summary' => pqptil_slot_summary($form['slots'], $options['availability_days'] ?? [], $options['availability_time_windows'] ?? []),
    'desired_services' => pqptil_value($form, 'desired_services'),
    'notes' => pqptil_value($form, 'notes'),
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
    'teacher_work_model_labels' => pqptil_labels($form['teacher_work_models'], $options['teacher_work_models'] ?? []),
    'gender' => pqptil_value($form, 'gender'),
    'service_modes' => $form['service_modes'],
    'service_mode_labels' => pqptil_labels($form['service_modes'], $options['service_modes'] ?? []),
    'subject_language' => pqptil_value($form, 'subject_language'),
    'subject_language_label' => pqptil_label(pqptil_value($form, 'subject_language'), $options['subject_languages'] ?? []),
    'subject_areas' => $form['subject_areas'],
    'subject_area_labels' => pqptil_labels($form['subject_areas'], $options['subject_areas'] ?? []),
    'subject_other' => pqptil_value($form, 'subject_other'),
    'age_groups' => $form['age_groups'],
    'age_group_labels' => pqptil_labels($form['age_groups'], $options['age_groups'] ?? []),
    'general_levels' => $form['general_levels'],
    'general_level_labels' => pqptil_labels($form['general_levels'], $options['general_levels'] ?? []),
    'workspace_preferences' => pqptil_value($form, 'workspace_preferences'),
    'years_experience' => (int)pqptil_value($form, 'years_experience'),
    'institution_experience' => pqptil_value($form, 'institution_experience'),
    'preferred_contact' => pqptil_value($form, 'preferred_contact'),
    'preferred_name' => pqptil_value($form, 'preferred_name'),
    'teaching_experience_range' => pqptil_value($form, 'teaching_experience_range'),
    'highest_qualification' => pqptil_value($form, 'highest_qualification'),
    'qualification_title' => pqptil_value($form, 'qualification_title'),
    'awarding_institution' => pqptil_value($form, 'awarding_institution'),
    'graduation_year' => pqptil_value($form, 'graduation_year'),
    'teaching_qualification' => pqptil_value($form, 'teaching_qualification'),
    'preferred_teaching_format' => pqptil_value($form, 'preferred_teaching_format'),
    'preferred_learner_arrangement' => pqptil_value($form, 'preferred_learner_arrangement'),
    'preferred_weekly_hours' => pqptil_value($form, 'preferred_weekly_hours'),
    'available_start_date' => pqptil_value($form, 'available_start_date'),
    'technology_readiness' => pqptil_value($form, 'technology_readiness'),
    'teacher_support_needs' => pqptil_value($form, 'teacher_support_needs'),
    'professional_reference' => pqptil_value($form, 'professional_reference'),
    'verification_consent' => pqptil_value($form, 'verification_consent'),
    'referral_source' => pqptil_value($form, 'referral_source'),
    'primary_grades_taught' => $form['primary_grades_taught'],
    'primary_curricula_taught' => $form['primary_curricula_taught'],
    'primary_classroom_management' => pqptil_value($form, 'primary_classroom_management'),
    'primary_parent_communication' => pqptil_value($form, 'primary_parent_communication'),
    'primary_safeguarding_status' => pqptil_value($form, 'primary_safeguarding_status'),
    'primary_learning_support' => pqptil_value($form, 'primary_learning_support'),
    'primary_lesson_assessment' => pqptil_value($form, 'primary_lesson_assessment'),
    'primary_teaching_credential' => pqptil_value($form, 'primary_teaching_credential'),
    'primary_background_check' => pqptil_value($form, 'primary_background_check'),
    'primary_teacher_notes' => pqptil_value($form, 'primary_teacher_notes'),
    'higher_teacher_academic_rank' => pqptil_value($form, 'higher_teacher_academic_rank'),
    'higher_teacher_disciplines' => $form['higher_teacher_disciplines'],
    'higher_teacher_experience' => pqptil_value($form, 'higher_teacher_experience'),
    'higher_teacher_research_level' => pqptil_value($form, 'higher_teacher_research_level'),
    'higher_teacher_publications' => pqptil_value($form, 'higher_teacher_publications'),
    'higher_teacher_supervision' => $form['higher_teacher_supervision'],
    'higher_teacher_course_design' => pqptil_value($form, 'higher_teacher_course_design'),
    'higher_teacher_assessment' => pqptil_value($form, 'higher_teacher_assessment'),
    'higher_teacher_accreditation' => pqptil_value($form, 'higher_teacher_accreditation'),
    'higher_teacher_notes' => pqptil_value($form, 'higher_teacher_notes'),
    'technical_teacher_trades' => $form['technical_teacher_trades'],
    'technical_teacher_industry_experience' => pqptil_value($form, 'technical_teacher_industry_experience'),
    'technical_teacher_qualification' => pqptil_value($form, 'technical_teacher_qualification'),
    'technical_teacher_licenses' => pqptil_value($form, 'technical_teacher_licenses'),
    'technical_teacher_workshop_level' => pqptil_value($form, 'technical_teacher_workshop_level'),
    'technical_teacher_equipment_level' => pqptil_value($form, 'technical_teacher_equipment_level'),
    'technical_teacher_safety_status' => pqptil_value($form, 'technical_teacher_safety_status'),
    'technical_teacher_apprenticeship' => pqptil_value($form, 'technical_teacher_apprenticeship'),
    'technical_teacher_assessment' => pqptil_value($form, 'technical_teacher_assessment'),
    'technical_teacher_workplace_training' => pqptil_value($form, 'technical_teacher_workplace_training'),
    'technical_teacher_notes' => pqptil_value($form, 'technical_teacher_notes'),
    'adult_teacher_areas' => $form['adult_teacher_areas'],
    'adult_teacher_experience' => pqptil_value($form, 'adult_teacher_experience'),
    'adult_teacher_literacy_instruction' => pqptil_value($form, 'adult_teacher_literacy_instruction'),
    'adult_teacher_numeracy_instruction' => pqptil_value($form, 'adult_teacher_numeracy_instruction'),
    'adult_teacher_digital_instruction' => pqptil_value($form, 'adult_teacher_digital_instruction'),
    'adult_teacher_multilevel_facilitation' => pqptil_value($form, 'adult_teacher_multilevel_facilitation'),
    'adult_teacher_confidence_support' => pqptil_value($form, 'adult_teacher_confidence_support'),
    'adult_teacher_community_outreach' => pqptil_value($form, 'adult_teacher_community_outreach'),
    'adult_teacher_barrier_support' => pqptil_value($form, 'adult_teacher_barrier_support'),
    'adult_teacher_notes' => pqptil_value($form, 'adult_teacher_notes'),
    'professional_teacher_areas' => $form['professional_teacher_areas'],
    'professional_teacher_industry_experience' => pqptil_value($form, 'professional_teacher_industry_experience'),
    'professional_teacher_responsibility' => pqptil_value($form, 'professional_teacher_responsibility'),
    'professional_teacher_credentials' => pqptil_value($form, 'professional_teacher_credentials'),
    'professional_teacher_facilitation' => pqptil_value($form, 'professional_teacher_facilitation'),
    'professional_teacher_coaching' => pqptil_value($form, 'professional_teacher_coaching'),
    'professional_teacher_corporate_training' => pqptil_value($form, 'professional_teacher_corporate_training'),
    'professional_teacher_cpd' => pqptil_value($form, 'professional_teacher_cpd'),
    'professional_teacher_outcome_measurement' => pqptil_value($form, 'professional_teacher_outcome_measurement'),
    'professional_teacher_case_studies' => pqptil_value($form, 'professional_teacher_case_studies'),
    'professional_teacher_notes' => pqptil_value($form, 'professional_teacher_notes'),
    'faith_subcategory' => $faithsubcategory,
    'faith_teacher_subjects' => $form['faith_teacher_subjects'],
    'faith_teacher_experience' => pqptil_value($form, 'faith_teacher_experience'),
    'faith_teacher_qualification' => pqptil_value($form, 'faith_teacher_qualification'),
    'faith_teacher_scripture_proficiency' => pqptil_value($form, 'faith_teacher_scripture_proficiency'),
    'faith_teacher_interpretation_level' => pqptil_value($form, 'faith_teacher_interpretation_level'),
    'faith_teacher_language_level' => pqptil_value($form, 'faith_teacher_language_level'),
    'faith_teacher_practice_level' => pqptil_value($form, 'faith_teacher_practice_level'),
    'faith_teacher_community_experience' => pqptil_value($form, 'faith_teacher_community_experience'),
    'faith_teacher_reference' => pqptil_value($form, 'faith_teacher_reference'),
    'faith_teacher_notes' => pqptil_value($form, 'faith_teacher_notes'),
    'online_profile_name' => pqptil_value($form, 'online_profile_name'),
    'instagram_handle' => pqptil_value($form, 'instagram_handle'),
    'social_profile_url' => pqptil_value($form, 'social_profile_url'),
    'website_or_booking_url' => pqptil_value($form, 'website_or_booking_url'),
    'demo_video_url' => pqptil_value($form, 'demo_video_url'),
    'teaching_offer_summary' => pqptil_value($form, 'teaching_offer_summary'),
    'learner_outcomes' => pqptil_value($form, 'learner_outcomes'),
    'curriculum_materials' => pqptil_value($form, 'curriculum_materials'),
    'social_proof' => pqptil_value($form, 'social_proof'),
];
if (!isset(pqptil_request_columns()['application_json'])) {
    $record->notes = pqptil_join_nonempty([
        (string)$record->notes,
        "Flexible teacher intake backup:\n" . pqptil_application_backup_text($applicationjson),
    ], "\n\n");
}
pqptil_set_request_field($record, 'teacher_work_models', implode(', ', pqptil_labels($form['teacher_work_models'], $options['teacher_work_models'] ?? [])));
pqptil_set_request_field($record, 'service_modes', implode(', ', pqptil_labels($form['service_modes'], $options['service_modes'] ?? [])));
pqptil_set_request_field($record, 'subject_language', pqptil_label(pqptil_value($form, 'subject_language'), $options['subject_languages'] ?? []));
pqptil_set_request_field($record, 'subject_areas', implode(', ', pqptil_labels($form['subject_areas'], $options['subject_areas'] ?? [])));
pqptil_set_request_field($record, 'subject_other', pqptil_value($form, 'subject_other'));
pqptil_set_request_field($record, 'age_groups', implode(', ', pqptil_labels($form['age_groups'], $options['age_groups'] ?? [])));
pqptil_set_request_field($record, 'general_levels', implode(', ', pqptil_labels($form['general_levels'], $options['general_levels'] ?? [])));
pqptil_set_request_field($record, 'workspace_preferences', pqptil_value($form, 'workspace_preferences'));
pqptil_set_request_field($record, 'years_experience', (int)pqptil_value($form, 'years_experience'));
pqptil_set_request_field($record, 'institution_experience', pqptil_value($form, 'institution_experience'));
pqptil_set_request_field($record, 'application_json', json_encode($applicationjson, JSON_UNESCAPED_SLASHES));
$requestid = (int)$DB->insert_record('local_prequran_teacher_intake_request', $record);
pqptil_security_audit('public_teacher_intake_submitted', [
    'requestid' => $requestid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'consumerslug' => (string)($consumercontext->consumerslug ?? ''),
]);

// f) success — legacy redirects to consumer_landing.php?teacher_submitted=1;
// cookieless we answer JSON with the thank-you message. No emails are sent.
echo json_encode([
    'ok' => true,
    'message' => 'Thank you. Your teacher application was received and ' . $brandname . ' will review it before workspace access or marketplace visibility is created.',
    'requestid' => $requestid,
], JSON_UNESCAPED_SLASHES);
exit;
