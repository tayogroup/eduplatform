<?php
// Public intake endpoint (hubredirect migration) — cookieless JSON API for the
// Bunny-hosted public sign-up page (portal/public-intake.html). Ported
// query-for-query from local_hubredirect/public_intake.php, which stays live
// in parallel (parallel-run; legacy untouched).
//
//   GET  public_intake_data.php?consumer=<slug>[&workspaceid=][&teacherid=]
//        -> bootstrap JSON: formtime + stateless formtoken, consumer branding,
//           option lists, public course offerings, field labels.
//   POST public_intake_data.php?consumer=<slug>  (JSON body)
//        -> validates + inserts local_prequran_intake_request exactly like the
//           legacy page.
//
// This is a PUBLIC endpoint by design (the legacy page has no require_login
// either — it runs as guest). There is no authenticated user and no token:
// abuse control is the same layered set the legacy page uses — honeypot
// 'website' field, min/max form-time trap bound into an HMAC form token, the
// per-contact 3-per-hour window, and live_audit events. The legacy 60s
// $SESSION cooldown cannot exist cookieless and is intentionally dropped;
// the 3/hour contact window remains the limiter.

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

function pqpid_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

// Field-level failure in the same shape the sibling student-intake handler
// returns: {ok:false, error, fielderrors:{field:msg}, fieldlabels:{field:label}}.
function pqpid_field_errors(array $fielderrors): void {
    $fieldlabels = [];
    foreach ($fielderrors as $fieldname => $unused) {
        $fieldlabels[$fieldname] = pqpirl_field_label((string)$fieldname);
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
    error_log('public_intake_data: ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Unexpected server error. Please try again later.']);
    exit;
});

require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/public_intake_portallib.php');

$options = require($CFG->dirroot . '/local/hubredirect/student_intake_config.php');

// Fail closed if the HMAC secret is missing/blank (e.g. mid-rotation): with an
// empty key the form token would be forgeable by anyone, so refuse to serve.
if ((string)get_config('local_prequran', 'progress_launch_secret') === '') {
    pqpid_fail(503, 'The public intake form is not configured yet. Please try again later.');
}

// Consumer context — same resolution chain as the legacy page, but driven by
// the ?consumer= / ?workspaceid= params (the CDN host the page is served from
// carries no consumer meaning; this endpoint's own host is the Moodle host).
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
$brandname = (string)$consumercontext->consumername;
$institutiontype = pqhi_clean_institution_type((string)($consumercontext->institution_type ?? ''), '');
$faithsubcategory = pqhi_clean_faith_subcategory((string)($consumercontext->faith_subcategory ?? ''));
$isprimaryeducation = $institutiontype === 'primary_education';
$ishighereducation = $institutiontype === 'higher_education';
$istechnicaltraining = $institutiontype === 'technical_training';
$isprofessionaldevelopment = $institutiontype === 'professional_development';
$isadultlearning = $institutiontype === 'adult_learning';
$isislamicstudies = $institutiontype === 'faith_based_education' && $faithsubcategory === 'islamic_studies';
$ischristianstudies = $institutiontype === 'faith_based_education' && $faithsubcategory === 'christian_studies';
$options['course_types'] = pqpirl_public_course_options($consumercontext, $options['course_types'] ?? []);

$ready = pqpirl_table_exists('local_prequran_intake_request');
$method = (string)($_SERVER['REQUEST_METHOD'] ?? '');

if ($method === 'GET') {
    $requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
    $teacherpreference = pqpirl_teacher_preference($requestedteacherid, (int)($consumercontext->consumerid ?? 0));
    $teacherpreferencelabel = pqpirl_teacher_preference_label($teacherpreference);

    // Field labels for every field the public form posts (plus the security
    // pseudo-field and the slots calendar) so the page can echo legacy-exact
    // error labels.
    $labelnames = [
        'form_security', 'slots', 'recording_consent',
        'parent_name', 'parent_relationship', 'parent_relationship_other', 'parent_email', 'parent_phone',
        'emergency_contact_name', 'emergency_contact_phone',
        'student_firstname', 'student_middle_name', 'student_lastname', 'student_display_name',
        'student_access_type', 'student_email', 'date_of_birth', 'age_years', 'gender', 'special_needs',
        'current_grade', 'school_curriculum', 'current_school_name', 'student_lives_with',
        'primary_learning_goal', 'medical_safety_notes', 'preferred_class_format', 'preferred_group_size',
        'preferred_teacher_gender', 'school_term',
        'islamic_program_interest', 'quran_reading_level', 'tajweed_level', 'memorization_status',
        'memorized_portion', 'arabic_reading_ability', 'prior_islamic_studies', 'islamic_learning_goal',
        'previous_learning_method', 'tafsir_level', 'islamic_notes',
        'christian_program_interest', 'bible_reading_level', 'bible_knowledge_level', 'christian_studies_level',
        'prior_christian_studies', 'christian_previous_learning_method', 'christian_learning_goal', 'christian_notes',
        'higher_application_level', 'higher_program_field', 'higher_specialization', 'higher_highest_qualification',
        'higher_previous_institution', 'higher_qualification_title', 'higher_completion_year', 'higher_academic_result',
        'higher_academic_status', 'higher_admission_route', 'higher_transfer_credits', 'higher_study_mode',
        'higher_study_load', 'higher_preferred_intake', 'higher_research_interest', 'higher_funding_method',
        'higher_financial_aid_interest', 'higher_support_needs',
        'technical_program', 'technical_specialization', 'technical_training_level', 'technical_previous_experience',
        'technical_previous_learning_method', 'technical_experience_duration', 'technical_employment_status',
        'technical_employer_workshop', 'technical_training_goal', 'technical_certification_sought',
        'technical_training_format', 'technical_training_schedule', 'technical_tools_experience',
        'technical_tool_access', 'technical_digital_skill_level', 'technical_safety_training',
        'technical_protective_equipment', 'technical_support_needs', 'technical_notes',
        'professional_area', 'professional_topic_skill', 'professional_current_role', 'professional_industry',
        'professional_employment_status', 'professional_employer', 'professional_experience_years',
        'professional_responsibility_level', 'professional_development_goal', 'professional_skill_level',
        'professional_credential_sought', 'professional_certification_deadline', 'professional_learning_format',
        'professional_learning_schedule', 'professional_course_intensity', 'professional_employer_sponsored',
        'professional_cpd_required', 'professional_cpd_credits', 'professional_workplace_outcome',
        'professional_support_needs', 'professional_notes',
        'adult_learning_area', 'adult_subject_skill', 'adult_education_level', 'adult_literacy_level',
        'adult_numeracy_level', 'adult_digital_skill_level', 'adult_previous_experience',
        'adult_previous_learning_method', 'adult_learning_goal', 'adult_employment_status',
        'adult_learning_format', 'adult_learning_pace', 'adult_class_arrangement', 'adult_childcare_impact',
        'adult_work_impact', 'adult_access_limitations', 'adult_learning_confidence', 'adult_support_needs',
        'adult_notes',
        'course_type', 'country', 'city', 'city_other', 'timezone', 'primary_language',
        'preferred_teaching_language', 'other_languages', 'current_level', 'tajweed_sub_level', 'learning_base',
        'session_count', 'parent_preferences', 'parent_email_enabled', 'live_class_consent', 'consent_notes',
    ];
    $fieldlabels = [];
    foreach ($labelnames as $labelname) {
        $fieldlabels[$labelname] = pqpirl_field_label($labelname);
    }

    $formtime = time();
    echo json_encode([
        'ok' => true,
        'ready' => $ready,
        'notready_message' => $ready ? '' : 'The live-class request form is not ready yet. Please contact ' . $brandname . ' support.',
        'formtime' => $formtime,
        'formtoken' => pqpirl_security_token($formtime),
        'consumer' => [
            'slug' => (string)($consumercontext->consumerslug ?? ''),
            'name' => $brandname,
            'initial' => pqpirl_consumer_initial($brandname),
            'consumerid' => (int)($consumercontext->consumerid ?? 0),
            'workspaceid' => (int)($consumercontext->workspaceid ?? 0),
            'institution_type' => $institutiontype,
            'faith_subcategory' => $faithsubcategory,
            'is_primary_education' => $isprimaryeducation,
            'is_higher_education' => $ishighereducation,
            'is_technical_training' => $istechnicaltraining,
            'is_professional_development' => $isprofessionaldevelopment,
            'is_adult_learning' => $isadultlearning,
            'is_islamic_studies' => $isislamicstudies,
            'is_christian_studies' => $ischristianstudies,
        ],
        'options' => $options,
        'courses' => $options['course_types'],
        'placement_levels' => pqpirl_placement_level_options($options),
        'teacherpref' => $teacherpreference ? [
            'teacherid' => (int)$teacherpreference->userid,
            'label' => $teacherpreferencelabel,
        ] : null,
        'fieldlabels' => $fieldlabels,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($method !== 'POST') {
    pqpid_fail(405, 'Method not allowed.');
}

// ---- POST: mirror the legacy verification flow, cookieless ----------------

// a) ready-check (same tables gate as legacy; legacy shows the not-ready panel
// and never processes the POST).
if (!$ready) {
    pqpid_fail(503, 'The live-class request form is not ready yet. Please contact ' . $brandname . ' support.');
}

$body = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($body)) {
    pqpid_fail(400, 'Invalid JSON body.');
}

// Feed the JSON body through Moodle's param cleaning by populating $_POST so
// the verbatim legacy extraction block (optional_param / optional_param_array
// via the pqpirl_ helpers) applies the exact same PARAM_* cleaning.
$_POST = $body;

$honeypot = trim((string)($body['website'] ?? ''));
$postedformtime = (int)($body['formtime'] ?? 0);
$postedtoken = (string)($body['formtoken'] ?? '');

// Verbatim legacy form extraction (pqpir_ -> pqpirl_).
$form = [
    'parent_name' => pqpirl_limit_text(pqpirl_trim('parent_name'), 255),
    'parent_relationship' => pqpirl_limit_text(pqpirl_trim('parent_relationship'), 40),
    'parent_relationship_other' => pqpirl_limit_text(pqpirl_trim('parent_relationship_other'), 255),
    'parent_email' => pqpirl_contact('parent_email'),
    'parent_phone' => pqpirl_contact('parent_phone'),
    'emergency_contact_name' => pqpirl_limit_text(pqpirl_trim('emergency_contact_name'), 255),
    'emergency_contact_phone' => pqpirl_contact('emergency_contact_phone'),
    'student_firstname' => pqpirl_limit_text(pqpirl_trim('student_firstname'), 100),
    'student_middle_name' => pqpirl_limit_text(pqpirl_trim('student_middle_name'), 100),
    'student_lastname' => pqpirl_limit_text(pqpirl_trim('student_lastname'), 100),
    'student_display_name' => pqpirl_limit_text(pqpirl_trim('student_display_name'), 255),
    'student_access_type' => pqpirl_trim('student_access_type', 'managed'),
    'student_email' => pqpirl_contact('student_email'),
    'date_of_birth' => pqpirl_limit_text(pqpirl_trim('date_of_birth'), 20),
    'age_years' => (string)optional_param('age_years', 0, PARAM_INT),
    'gender' => pqpirl_trim('gender'),
    'special_needs' => pqpirl_trim('special_needs'),
    'current_grade' => pqpirl_limit_text(pqpirl_trim('current_grade'), 80),
    'school_curriculum' => pqpirl_limit_text(pqpirl_trim('school_curriculum'), 120),
    'current_school_name' => pqpirl_limit_text(pqpirl_trim('current_school_name'), 255),
    'student_lives_with' => pqpirl_limit_text(pqpirl_trim('student_lives_with'), 80),
    'primary_learning_goal' => pqpirl_limit_text(pqpirl_trim('primary_learning_goal'), 255),
    'medical_safety_notes' => pqpirl_limit_text(pqpirl_trim('medical_safety_notes'), 2000),
    'preferred_class_format' => pqpirl_limit_text(pqpirl_trim('preferred_class_format'), 80),
    'preferred_group_size' => pqpirl_limit_text(pqpirl_trim('preferred_group_size'), 80),
    'preferred_teacher_gender' => pqpirl_limit_text(pqpirl_trim('preferred_teacher_gender'), 40),
    'school_term' => pqpirl_limit_text(pqpirl_trim('school_term'), 80),
    'islamic_program_interest' => pqpirl_limit_text(pqpirl_trim('islamic_program_interest'), 80),
    'quran_reading_level' => pqpirl_limit_text(pqpirl_trim('quran_reading_level'), 80),
    'tajweed_level' => pqpirl_limit_text(pqpirl_trim('tajweed_level'), 80),
    'memorization_status' => pqpirl_limit_text(pqpirl_trim('memorization_status'), 80),
    'memorized_portion' => pqpirl_limit_text(pqpirl_trim('memorized_portion'), 255),
    'arabic_reading_ability' => pqpirl_limit_text(pqpirl_trim('arabic_reading_ability'), 80),
    'prior_islamic_studies' => pqpirl_limit_text(pqpirl_trim('prior_islamic_studies'), 2000),
    'islamic_learning_goal' => pqpirl_limit_text(pqpirl_trim('islamic_learning_goal'), 255),
    'previous_learning_method' => pqpirl_limit_text(pqpirl_trim('previous_learning_method'), 80),
    'tafsir_level' => pqpirl_limit_text(pqpirl_trim('tafsir_level'), 80),
    'islamic_notes' => pqpirl_limit_text(pqpirl_trim('islamic_notes'), 2000),
    'christian_program_interest' => pqpirl_limit_text(pqpirl_trim('christian_program_interest'), 80),
    'bible_reading_level' => pqpirl_limit_text(pqpirl_trim('bible_reading_level'), 80),
    'bible_knowledge_level' => pqpirl_limit_text(pqpirl_trim('bible_knowledge_level'), 80),
    'christian_studies_level' => pqpirl_limit_text(pqpirl_trim('christian_studies_level'), 80),
    'prior_christian_studies' => pqpirl_limit_text(pqpirl_trim('prior_christian_studies'), 2000),
    'christian_previous_learning_method' => pqpirl_limit_text(pqpirl_trim('christian_previous_learning_method'), 80),
    'christian_learning_goal' => pqpirl_limit_text(pqpirl_trim('christian_learning_goal'), 255),
    'christian_notes' => pqpirl_limit_text(pqpirl_trim('christian_notes'), 2000),
    'higher_application_level' => pqpirl_limit_text(pqpirl_trim('higher_application_level'), 80),
    'higher_program_field' => pqpirl_limit_text(pqpirl_trim('higher_program_field'), 255),
    'higher_specialization' => pqpirl_limit_text(pqpirl_trim('higher_specialization'), 255),
    'higher_highest_qualification' => pqpirl_limit_text(pqpirl_trim('higher_highest_qualification'), 80),
    'higher_previous_institution' => pqpirl_limit_text(pqpirl_trim('higher_previous_institution'), 255),
    'higher_qualification_title' => pqpirl_limit_text(pqpirl_trim('higher_qualification_title'), 255),
    'higher_completion_year' => pqpirl_limit_text(pqpirl_trim('higher_completion_year'), 20),
    'higher_academic_result' => pqpirl_limit_text(pqpirl_trim('higher_academic_result'), 120),
    'higher_academic_status' => pqpirl_limit_text(pqpirl_trim('higher_academic_status'), 80),
    'higher_admission_route' => pqpirl_limit_text(pqpirl_trim('higher_admission_route'), 80),
    'higher_transfer_credits' => pqpirl_limit_text(pqpirl_trim('higher_transfer_credits'), 20),
    'higher_study_mode' => pqpirl_limit_text(pqpirl_trim('higher_study_mode'), 40),
    'higher_study_load' => pqpirl_limit_text(pqpirl_trim('higher_study_load'), 40),
    'higher_preferred_intake' => pqpirl_limit_text(pqpirl_trim('higher_preferred_intake'), 120),
    'higher_research_interest' => pqpirl_limit_text(pqpirl_trim('higher_research_interest'), 2000),
    'higher_funding_method' => pqpirl_limit_text(pqpirl_trim('higher_funding_method'), 80),
    'higher_financial_aid_interest' => pqpirl_limit_text(pqpirl_trim('higher_financial_aid_interest'), 20),
    'higher_support_needs' => pqpirl_limit_text(pqpirl_trim('higher_support_needs'), 2000),
    'technical_program' => pqpirl_limit_text(pqpirl_trim('technical_program'), 80),
    'technical_specialization' => pqpirl_limit_text(pqpirl_trim('technical_specialization'), 255),
    'technical_training_level' => pqpirl_limit_text(pqpirl_trim('technical_training_level'), 80),
    'technical_previous_experience' => pqpirl_limit_text(pqpirl_trim('technical_previous_experience'), 80),
    'technical_previous_learning_method' => pqpirl_limit_text(pqpirl_trim('technical_previous_learning_method'), 80),
    'technical_experience_duration' => pqpirl_limit_text(pqpirl_trim('technical_experience_duration'), 40),
    'technical_employment_status' => pqpirl_limit_text(pqpirl_trim('technical_employment_status'), 80),
    'technical_employer_workshop' => pqpirl_limit_text(pqpirl_trim('technical_employer_workshop'), 255),
    'technical_training_goal' => pqpirl_limit_text(pqpirl_trim('technical_training_goal'), 80),
    'technical_certification_sought' => pqpirl_limit_text(pqpirl_trim('technical_certification_sought'), 255),
    'technical_training_format' => pqpirl_limit_text(pqpirl_trim('technical_training_format'), 80),
    'technical_training_schedule' => pqpirl_limit_text(pqpirl_trim('technical_training_schedule'), 40),
    'technical_tools_experience' => pqpirl_limit_text(pqpirl_trim('technical_tools_experience'), 2000),
    'technical_tool_access' => pqpirl_limit_text(pqpirl_trim('technical_tool_access'), 40),
    'technical_digital_skill_level' => pqpirl_limit_text(pqpirl_trim('technical_digital_skill_level'), 40),
    'technical_safety_training' => pqpirl_limit_text(pqpirl_trim('technical_safety_training'), 20),
    'technical_protective_equipment' => pqpirl_limit_text(pqpirl_trim('technical_protective_equipment'), 40),
    'technical_support_needs' => pqpirl_limit_text(pqpirl_trim('technical_support_needs'), 2000),
    'technical_notes' => pqpirl_limit_text(pqpirl_trim('technical_notes'), 2000),
    'professional_area' => pqpirl_limit_text(pqpirl_trim('professional_area'), 80),
    'professional_topic_skill' => pqpirl_limit_text(pqpirl_trim('professional_topic_skill'), 255),
    'professional_current_role' => pqpirl_limit_text(pqpirl_trim('professional_current_role'), 255),
    'professional_industry' => pqpirl_limit_text(pqpirl_trim('professional_industry'), 80),
    'professional_employment_status' => pqpirl_limit_text(pqpirl_trim('professional_employment_status'), 80),
    'professional_employer' => pqpirl_limit_text(pqpirl_trim('professional_employer'), 255),
    'professional_experience_years' => pqpirl_limit_text(pqpirl_trim('professional_experience_years'), 40),
    'professional_responsibility_level' => pqpirl_limit_text(pqpirl_trim('professional_responsibility_level'), 80),
    'professional_development_goal' => pqpirl_limit_text(pqpirl_trim('professional_development_goal'), 80),
    'professional_skill_level' => pqpirl_limit_text(pqpirl_trim('professional_skill_level'), 40),
    'professional_credential_sought' => pqpirl_limit_text(pqpirl_trim('professional_credential_sought'), 255),
    'professional_certification_deadline' => pqpirl_limit_text(pqpirl_trim('professional_certification_deadline'), 20),
    'professional_learning_format' => pqpirl_limit_text(pqpirl_trim('professional_learning_format'), 80),
    'professional_learning_schedule' => pqpirl_limit_text(pqpirl_trim('professional_learning_schedule'), 40),
    'professional_course_intensity' => pqpirl_limit_text(pqpirl_trim('professional_course_intensity'), 80),
    'professional_employer_sponsored' => pqpirl_limit_text(pqpirl_trim('professional_employer_sponsored'), 40),
    'professional_cpd_required' => pqpirl_limit_text(pqpirl_trim('professional_cpd_required'), 20),
    'professional_cpd_credits' => pqpirl_limit_text(pqpirl_trim('professional_cpd_credits'), 40),
    'professional_workplace_outcome' => pqpirl_limit_text(pqpirl_trim('professional_workplace_outcome'), 2000),
    'professional_support_needs' => pqpirl_limit_text(pqpirl_trim('professional_support_needs'), 2000),
    'professional_notes' => pqpirl_limit_text(pqpirl_trim('professional_notes'), 2000),
    'adult_learning_area' => pqpirl_limit_text(pqpirl_trim('adult_learning_area'), 80),
    'adult_subject_skill' => pqpirl_limit_text(pqpirl_trim('adult_subject_skill'), 255),
    'adult_education_level' => pqpirl_limit_text(pqpirl_trim('adult_education_level'), 80),
    'adult_literacy_level' => pqpirl_limit_text(pqpirl_trim('adult_literacy_level'), 80),
    'adult_numeracy_level' => pqpirl_limit_text(pqpirl_trim('adult_numeracy_level'), 80),
    'adult_digital_skill_level' => pqpirl_limit_text(pqpirl_trim('adult_digital_skill_level'), 40),
    'adult_previous_experience' => pqpirl_limit_text(pqpirl_trim('adult_previous_experience'), 80),
    'adult_previous_learning_method' => pqpirl_limit_text(pqpirl_trim('adult_previous_learning_method'), 80),
    'adult_learning_goal' => pqpirl_limit_text(pqpirl_trim('adult_learning_goal'), 80),
    'adult_employment_status' => pqpirl_limit_text(pqpirl_trim('adult_employment_status'), 80),
    'adult_learning_format' => pqpirl_limit_text(pqpirl_trim('adult_learning_format'), 80),
    'adult_learning_pace' => pqpirl_limit_text(pqpirl_trim('adult_learning_pace'), 40),
    'adult_class_arrangement' => pqpirl_limit_text(pqpirl_trim('adult_class_arrangement'), 40),
    'adult_childcare_impact' => pqpirl_limit_text(pqpirl_trim('adult_childcare_impact'), 40),
    'adult_work_impact' => pqpirl_limit_text(pqpirl_trim('adult_work_impact'), 20),
    'adult_access_limitations' => pqpirl_limit_text(pqpirl_trim('adult_access_limitations'), 40),
    'adult_learning_confidence' => pqpirl_limit_text(pqpirl_trim('adult_learning_confidence'), 40),
    'adult_support_needs' => pqpirl_limit_text(pqpirl_trim('adult_support_needs'), 2000),
    'adult_notes' => pqpirl_limit_text(pqpirl_trim('adult_notes'), 2000),
    'course_type' => pqpirl_trim('course_type'),
    'country' => pqpirl_trim('country'),
    'city' => pqpirl_trim('city'),
    'city_other' => pqpirl_trim('city_other'),
    'timezone' => pqpirl_trim('timezone', 'Africa/Nairobi'),
    'primary_language' => pqpirl_trim('primary_language'),
    'preferred_teaching_language' => pqpirl_trim('preferred_teaching_language'),
    'other_languages' => pqpirl_param_array('other_languages'),
    'current_level' => pqpirl_trim('current_level'),
    'tajweed_sub_level' => pqpirl_trim('tajweed_sub_level'),
    'learning_base' => pqpirl_trim('learning_base'),
    'session_count' => (string)optional_param('session_count', 1, PARAM_INT),
    'slots' => pqpirl_param_array('slots'),
    'parent_preferences' => pqpirl_limit_text(pqpirl_trim('parent_preferences'), 4000),
    'parent_email_enabled' => optional_param('parent_email_enabled', 0, PARAM_BOOL) ? 1 : 0,
    'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
    'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
    'consent_notes' => pqpirl_limit_text(pqpirl_trim('consent_notes'), 2000),
];
$postedteacherid = optional_param('teacherid', 0, PARAM_INT);
$teacherpreference = pqpirl_teacher_preference($postedteacherid, (int)($consumercontext->consumerid ?? 0));
$teacherpreferencelabel = pqpirl_teacher_preference_label($teacherpreference);

$isadultstudent = (int)$form['age_years'] >= 18;

// b) honeypot — legacy records the audit and answers with the generic
// form_security error (it does NOT pretend success); mirror that.
if ($honeypot !== '') {
    pqpirl_security_audit('public_intake_blocked_honeypot');
    pqpid_field_errors(['form_security' => 'The request could not be accepted. Please reload the form and try again.']);
}

// c) stateless form token + time trap (legacy audits and messages verbatim).
$elapsed = time() - $postedformtime;
if ($postedformtime <= 0 || !hash_equals(pqpirl_security_token($postedformtime), $postedtoken)) {
    pqpirl_security_audit('public_intake_blocked_token');
    pqpid_field_errors(['form_security' => 'The form security token expired. Please reload the form and try again.']);
} else if ($elapsed < pqpirl_min_form_seconds() || $elapsed > pqpirl_max_form_seconds()) {
    pqpirl_security_audit('public_intake_blocked_timing', ['elapsed' => $elapsed]);
    pqpid_field_errors(['form_security' => 'Please reload the form and submit again.']);
}

// (Legacy's 60s $SESSION cooldown lived here; impossible cookieless — the
// 3-per-hour contact window below remains the limiter.)

// d) per-contact submission window: 3 per rolling hour across the same
// parent/student contact keys.
$recentcount = pqpirl_contact_submission_count([
    pqpirl_value($form, 'parent_email'),
    pqpirl_value($form, 'parent_phone'),
    pqpirl_value($form, 'student_email'),
], time() - pqpirl_contact_window_seconds());
if ($recentcount >= pqpirl_contact_window_limit()) {
    pqpirl_security_audit('public_intake_blocked_contact_rate', ['recent_count' => $recentcount]);
    pqpid_field_errors(['form_security' => 'We already received several recent requests with this contact information. Please wait before submitting another request.']);
}

// e) full legacy validation block (verbatim, pqpir_ -> pqpirl_).
$errors = [];
foreach ([
    'student_firstname' => 'Please enter the student first name.',
    'student_middle_name' => 'Please enter the student middle name.',
    'student_lastname' => 'Please enter the student last name.',
    'course_type' => 'Please select the course.',
    'country' => 'Please select the country.',
    'city' => 'Please select the city.',
    'timezone' => 'Please select the time zone.',
    'primary_language' => 'Please select the primary language.',
    'preferred_teaching_language' => 'Please select the preferred teaching language.',
    'current_level' => 'Please select the placement level.',
    'learning_base' => 'Please select the learning background.',
    'session_count' => 'Please select the number of weekly sessions.',
] as $field => $errormessage) {
    if (($field === 'age_years' && (int)$form[$field] <= 0) || ($field === 'session_count' && ((int)$form[$field] < 1 || (int)$form[$field] > 5)) || (!in_array($field, ['age_years', 'session_count'], true) && pqpirl_value($form, $field) === '')) {
        $errors[$field] = $errormessage;
    }
}
if ($isprimaryeducation) {
    foreach ([
        'date_of_birth' => 'Please enter the student date of birth.',
        'age_years' => 'Please enter the student age.',
        'gender' => 'Please select the student gender.',
        'special_needs' => 'Please select Yes or No for Special Needs.',
        'current_grade' => 'Please select the current grade/year.',
        'parent_name' => 'Please enter the parent/guardian name.',
        'parent_relationship' => 'Please select the parent/guardian relationship to the student.',
        'emergency_contact_phone' => 'Please enter an emergency contact phone.',
    ] as $field => $errormessage) {
        if (pqpirl_value($form, $field) === '') {
            $errors[$field] = $errormessage;
        }
    }
    if (pqpirl_value($form, 'parent_phone') === '' && pqpirl_value($form, 'parent_email') === '') {
        $errors['parent_phone'] = 'Please enter a parent/guardian phone, WhatsApp, or email contact.';
    }
}
if ($ishighereducation) {
    foreach ([
        'higher_application_level' => 'Please select the application level.',
        'higher_program_field' => 'Please enter the program or field of study.',
        'higher_highest_qualification' => 'Please select the highest qualification completed.',
        'higher_academic_status' => 'Please select the current academic status.',
        'higher_study_mode' => 'Please select the preferred study mode.',
        'higher_study_load' => 'Please select the preferred study load.',
    ] as $field => $errormessage) {
        if (pqpirl_value($form, $field) === '') {
            $errors[$field] = $errormessage;
        }
    }
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
        if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
}
if ($istechnicaltraining) {
    foreach ([
        'technical_program' => 'Please select the training program or trade.',
        'technical_training_level' => 'Please select the training level.',
        'technical_previous_experience' => 'Please select the previous technical experience.',
        'technical_training_goal' => 'Please select the primary training goal.',
        'technical_training_format' => 'Please select the preferred training format.',
        'technical_tool_access' => 'Please select access to required tools or equipment.',
    ] as $field => $errormessage) {
        if (pqpirl_value($form, $field) === '') {
            $errors[$field] = $errormessage;
        }
    }
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
        if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
}
if ($isprofessionaldevelopment) {
    foreach ([
        'professional_area' => 'Please select the professional development area.',
        'professional_current_role' => 'Please enter the current professional role.',
        'professional_employment_status' => 'Please select the employment status.',
        'professional_development_goal' => 'Please select the primary development goal.',
        'professional_skill_level' => 'Please select the current skill level.',
        'professional_learning_format' => 'Please select the preferred learning format.',
    ] as $field => $errormessage) {
        if (pqpirl_value($form, $field) === '') {
            $errors[$field] = $errormessage;
        }
    }
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
        if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
}
if ($isadultlearning) {
    foreach ([
        'adult_learning_area' => 'Please select the learning area of interest.',
        'adult_education_level' => 'Please select the highest education level completed.',
        'adult_learning_goal' => 'Please select the primary learning goal.',
        'adult_learning_format' => 'Please select the preferred learning format.',
        'adult_learning_pace' => 'Please select the preferred learning pace.',
    ] as $field => $errormessage) {
        if (pqpirl_value($form, $field) === '') {
            $errors[$field] = $errormessage;
        }
    }
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
        if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
}
if ($isadultstudent) {
    if (pqpirl_value($form, 'student_email') === '') {
        $errors['student_email'] = 'Adult students must provide their own email address or phone number.';
    }
} else {
    foreach ([
        'parent_name' => 'Please enter the parent/guardian name.',
        'parent_relationship' => 'Please select the parent/guardian relationship to the student.',
    ] as $field => $errormessage) {
        if (pqpirl_value($form, $field) === '') {
            $errors[$field] = $errormessage;
        }
    }
    if (pqpirl_value($form, 'parent_relationship') === 'other' && pqpirl_value($form, 'parent_relationship_other') === '') {
        $errors['parent_relationship_other'] = 'Please describe the parent/guardian relationship to the student.';
    }
    if (pqpirl_value($form, 'parent_phone') === '' && pqpirl_value($form, 'parent_email') === '') {
        $errors['parent_phone'] = 'Please enter a parent/guardian phone, WhatsApp, or email contact.';
    }
}
if (pqpirl_value($form, 'parent_relationship') !== '' && !array_key_exists(pqpirl_value($form, 'parent_relationship'), $options['parent_relationships'] ?? [])) {
    $errors['parent_relationship'] = 'Please select a valid relationship.';
}
foreach ([
    'current_grade' => 'primary_grade_levels',
    'school_curriculum' => 'primary_curricula',
    'student_lives_with' => 'student_lives_with_options',
    'preferred_class_format' => 'primary_class_formats',
    'preferred_group_size' => 'primary_group_sizes',
    'preferred_teacher_gender' => 'teacher_gender_preferences',
] as $field => $optionkey) {
    if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
        $errors[$field] = 'Please select a valid option.';
    }
}
if ($isislamicstudies) {
    foreach ([
        'islamic_program_interest' => 'islamic_program_interests',
        'quran_reading_level' => 'quran_reading_levels',
        'tajweed_level' => 'tajweed_levels',
        'memorization_status' => 'memorization_statuses',
        'arabic_reading_ability' => 'arabic_reading_abilities',
        'previous_learning_method' => 'previous_learning_methods',
        'tafsir_level' => 'tafsir_levels',
    ] as $field => $optionkey) {
        if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
}
if ($ischristianstudies) {
    foreach ([
        'christian_program_interest' => 'christian_program_interests',
        'bible_reading_level' => 'bible_reading_levels',
        'bible_knowledge_level' => 'bible_knowledge_levels',
        'christian_studies_level' => 'christian_studies_levels',
        'christian_previous_learning_method' => 'christian_previous_learning_methods',
    ] as $field => $optionkey) {
        if (pqpirl_value($form, $field) !== '' && !array_key_exists(pqpirl_value($form, $field), $options[$optionkey] ?? [])) {
            $errors[$field] = 'Please select a valid option.';
        }
    }
}
foreach (['parent_email', 'parent_phone', 'student_email', 'emergency_contact_phone'] as $contactfield) {
    if (!pqpirl_contact_ok(pqpirl_value($form, $contactfield))) {
        $errors[$contactfield] = 'Enter a valid email address or phone number.';
    }
}
if (($isprimaryeducation || pqpirl_value($form, 'special_needs') !== '') && !in_array(pqpirl_value($form, 'special_needs'), ['yes', 'no'], true)) {
    $errors['special_needs'] = 'Please select Yes or No for Special Needs.';
}
if (!array_key_exists(pqpirl_value($form, 'course_type'), $options['course_types'] ?? [])) {
    $errors['course_type'] = 'Please select a valid course.';
}
if (!array_key_exists(pqpirl_value($form, 'student_access_type'), $options['student_access_types'] ?? [])) {
    $errors['student_access_type'] = 'Please select Managed Student or Unmanaged Student.';
}
if (!array_key_exists(pqpirl_value($form, 'current_level'), $options['current_levels'] ?? [])) {
    $errors['current_level'] = 'Please select a valid placement level.';
}
if (!array_key_exists(pqpirl_value($form, 'preferred_teaching_language'), $options['primary_languages'] ?? [])) {
    $errors['preferred_teaching_language'] = 'Please select a valid preferred teaching language.';
}
if (pqpirl_value($form, 'current_level') === 'level_3' && !array_key_exists(pqpirl_value($form, 'tajweed_sub_level'), $options['tajweed_sub_levels'] ?? [])) {
    $errors['tajweed_sub_level'] = 'Please select Beginner, Middle, or Advanced for Level 3.';
}
if (!$form['slots']) {
    $errors['slots'] = 'Please select at least one preferred weekly live-session time.';
}
$validdays = array_keys($options['availability_days'] ?? []);
$validhours = array_keys($options['availability_time_windows'] ?? []);
foreach ($form['slots'] as $slot) {
    [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
    if (!in_array($day, $validdays, true) || !in_array($hour, $validhours, true)) {
        $errors['slots'] = 'Please select live-session times from the available calendar.';
        break;
    }
}
$countrycities = $options['country_cities'][$form['country']] ?? [];
if ($form['country'] !== '' && $form['city'] !== '' && $form['city'] !== 'Other' && $countrycities && !array_key_exists($form['city'], $countrycities)) {
    $errors['city'] = 'Please select a city listed for the selected country, or choose Other city not listed.';
}
if ($form['city'] === 'Other' && pqpirl_value($form, 'city_other') === '') {
    $errors['city_other'] = 'Please enter the city name.';
}
$countryzones = $options['country_timezones'][$form['country']] ?? [];
if ($form['country'] !== '' && $form['timezone'] !== '' && $countryzones && !in_array($form['timezone'], $countryzones, true)) {
    $errors['timezone'] = 'Please select a time zone listed for the selected country.';
}
if (empty($form['live_class_consent'])) {
    $errors['live_class_consent'] = 'Live class consent is required before we can review the request.';
}
if ($errors) {
    pqpid_field_errors($errors);
}

// f) insert (verbatim legacy record build + guarded optional columns).
$now = time();
$slots = [];
foreach ($form['slots'] as $slot) {
    [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
    if ($day === '' || $hour === '') {
        continue;
    }
    $slots[] = [
        'day' => $day,
        'time' => $hour,
        'day_label' => pqpirl_label($day, $options['availability_days'] ?? []),
        'time_label' => pqpirl_label($hour, $options['availability_time_windows'] ?? []),
    ];
}
$displayname = pqpirl_value($form, 'student_display_name');
if ($displayname === '') {
    $displayname = trim(pqpirl_value($form, 'student_firstname') . ' ' . pqpirl_value($form, 'student_middle_name') . ' ' . pqpirl_value($form, 'student_lastname'));
}
$city = pqpirl_value($form, 'city') === 'Other' ? pqpirl_value($form, 'city_other') : pqpirl_value($form, 'city');

$teacherprefnote = $teacherpreferencelabel !== '' ? 'Marketplace teacher preference: ' . $teacherpreferencelabel . '.' : '';
$parentpreferences = pqpirl_value($form, 'parent_preferences');
if ($teacherprefnote !== '' && stripos($parentpreferences, $teacherprefnote) === false) {
    $parentpreferences = trim($teacherprefnote . "\n" . $parentpreferences);
}

$requestrecord = (object)[
    'parent_name' => pqpirl_value($form, 'parent_name'),
    'parent_email' => pqpirl_value($form, 'parent_email'),
    'parent_phone' => pqpirl_value($form, 'parent_phone'),
    'student_firstname' => pqpirl_value($form, 'student_firstname'),
    'student_middle_name' => pqpirl_value($form, 'student_middle_name'),
    'student_lastname' => pqpirl_value($form, 'student_lastname'),
    'student_display_name' => $displayname,
    'student_access_type' => pqpirl_value($form, 'student_access_type'),
    'student_email' => pqpirl_value($form, 'student_email'),
    'date_of_birth' => pqpirl_value($form, 'date_of_birth'),
    'age_years' => (int)$form['age_years'],
    'gender' => pqpirl_value($form, 'gender'),
    'country' => pqpirl_value($form, 'country'),
    'city' => $city,
    'timezone' => pqpirl_value($form, 'timezone'),
    'primary_language' => pqpirl_value($form, 'primary_language'),
    'preferred_teaching_language' => pqpirl_value($form, 'preferred_teaching_language'),
    'other_languages' => implode(', ', pqpirl_labels($form['other_languages'], $options['other_languages'] ?? [])),
    'current_level' => pqpirl_value($form, 'current_level'),
    'tajweed_sub_level' => pqpirl_value($form, 'tajweed_sub_level'),
    'learning_base' => pqpirl_value($form, 'learning_base'),
    'availability_json' => json_encode(['timezone' => pqpirl_value($form, 'timezone'), 'session_count' => (int)$form['session_count'], 'slots' => $slots]),
    'availability_summary' => pqpirl_slot_summary($form['slots'], $options['availability_days'] ?? [], $options['availability_time_windows'] ?? [], (int)$form['session_count']),
    'parent_preferences' => $parentpreferences,
    'parent_email_enabled' => (int)$form['parent_email_enabled'],
    'live_class_consent' => (int)$form['live_class_consent'],
    'recording_consent' => (int)$form['recording_consent'],
    'consent_notes' => pqpirl_value($form, 'consent_notes'),
    'status' => 'new',
    'matched_groupid' => 0,
    'transferred_userid' => 0,
    'transferred_profileid' => 0,
    'admin_notes' => $teacherprefnote,
    'reviewedby' => 0,
    'reviewedat' => 0,
    'timecreated' => $now,
    'timemodified' => $now,
];
if (pqpirl_table_has_column('local_prequran_intake_request', 'special_needs')) {
    $requestrecord->special_needs = pqpirl_value($form, 'special_needs');
}
if (pqpirl_table_has_column('local_prequran_intake_request', 'course_type')) {
    $requestrecord->course_type = pqpirl_value($form, 'course_type');
}
foreach ([
    'parent_relationship',
    'parent_relationship_other',
    'emergency_contact_name',
    'emergency_contact_phone',
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
] as $extrafield) {
    if (pqpirl_table_has_column('local_prequran_intake_request', $extrafield)) {
        $requestrecord->{$extrafield} = pqpirl_value($form, $extrafield);
    }
}
if (pqpirl_table_has_column('local_prequran_intake_request', 'consumerid')) {
    $requestrecord->consumerid = (int)($consumercontext->consumerid ?? 0);
}
if (pqpirl_table_has_column('local_prequran_intake_request', 'workspaceid')) {
    $requestrecord->workspaceid = (int)($consumercontext->workspaceid ?? 0);
}
$requestid = $DB->insert_record('local_prequran_intake_request', $requestrecord);
pqpirl_security_audit('public_intake_submitted', [
    'requestid' => (int)$requestid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'consumerslug' => (string)($consumercontext->consumerslug ?? ''),
]);

// g) success — the legacy thank-you message (legacy redirects to
// ?submitted=1 and renders this alert; no notification emails are sent).
echo json_encode([
    'ok' => true,
    'message' => 'Thank you. Your request was received and ' . $brandname . ' will review the best live-class options.',
    'requestid' => (int)$requestid,
], JSON_UNESCAPED_SLASHES);
exit;
