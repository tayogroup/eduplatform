<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/institutionlib.php');

$ehp_public_pages = __DIR__ . '/../ehelhome/public_pages.php';
if (!file_exists($ehp_public_pages)) {
    $ehp_public_pages = __DIR__ . '/../local_ehelhome/public_pages.php';
}
require_once($ehp_public_pages);

$options = require(__DIR__ . '/student_intake_config.php');

const PQPIR_MIN_FORM_SECONDS = 4;
const PQPIR_MAX_FORM_SECONDS = 7200;
const PQPIR_SESSION_COOLDOWN_SECONDS = 60;
const PQPIR_CONTACT_WINDOW_SECONDS = 3600;
const PQPIR_CONTACT_WINDOW_LIMIT = 3;

function pqpir_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqpir_table_has_column(string $table, string $column): bool {
    global $DB;
    if (!pqpir_table_exists($table)) {
        return false;
    }
    $columns = $DB->get_columns($table);
    return isset($columns[$column]);
}

function pqpir_trim(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqpir_contact(string $name): string {
    return core_text::substr(trim(optional_param($name, '', PARAM_TEXT)), 0, 255);
}

function pqpir_param_array(string $name): array {
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

function pqpir_consumer_initial(string $brandname): string {
    $clean = (string)preg_replace('/[^A-Za-z0-9]+/', '', $brandname);
    if ($clean === '') {
        $clean = 'E';
    }

    return strtoupper(core_text::substr($clean, 0, 1));
}

function pqpir_public_header(stdClass $consumercontext, array $params): string {
    $brandname = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
    if ($brandname === '') {
        $brandname = 'EduPlatform';
    }

    $baseparams = ['consumer' => (string)($consumercontext->consumerslug ?? '')];
    if ($baseparams['consumer'] === '') {
        $baseparams = $params;
    }
    if ((int)($consumercontext->workspaceid ?? 0) > 0) {
        $baseparams['workspaceid'] = (int)$consumercontext->workspaceid;
    } else if (!empty($params['workspaceid'])) {
        $baseparams['workspaceid'] = (int)$params['workspaceid'];
    }

    $links = [
        'Home' => new moodle_url('/local/hubredirect/consumer_landing.php', $baseparams),
        'Student Intake' => new moodle_url('/local/hubredirect/public_intake.php', $baseparams),
        'Profile' => new moodle_url('/local/hubredirect/institution_profile.php', $baseparams),
        'Contact' => new moodle_url('/local/hubredirect/institution_inquiry.php', $baseparams),
        'Workspace' => new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams),
    ];
    $loginurl = new moodle_url('/local/hubredirect/consumer_login.php', $baseparams);

    $html = '<header class="pqpir-navshell">';
    $html .= '<a class="pqpir-navbrand" href="' . s($links['Home']->out(false)) . '">';
    $html .= '<span class="pqpir-navmark">' . s(pqpir_consumer_initial($brandname)) . '</span>';
    $html .= '<span class="pqpir-navname">' . s($brandname) . '</span>';
    $html .= '</a><nav class="pqpir-navlinks" aria-label="' . s($brandname) . ' public navigation">';
    foreach ($links as $label => $url) {
        $active = ($label === 'Student Intake') ? ' pqpir-navlink--active' : '';
        $html .= '<a class="pqpir-navlink' . $active . '" href="' . s($url->out(false)) . '">' . s($label) . '</a>';
    }
    $html .= '<a class="pqpir-navlink pqpir-navlink--primary" href="' . s($loginurl->out(false)) . '">Log in</a>';
    $html .= '</nav></header>';

    return $html;
}

function pqpir_label(string $value, array $options): string {
    return (string)($options[$value] ?? $value);
}

function pqpir_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = pqpir_label((string)$value, $options);
    }
    return $labels;
}

function pqpir_placement_level_options(array $options): array {
    return $options['current_levels'] ?? [];
}

function pqpir_field_label(string $name): string {
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

function pqpir_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqpir-error">' . s(pqpir_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqpir_limit_text(string $value, int $limit): string {
    return core_text::substr(trim($value), 0, $limit);
}

function pqpir_contact_ok(string $contact): bool {
    if ($contact === '') {
        return true;
    }
    if (validate_email($contact)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $contact);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqpir_contact_key(string $contact): string {
    $contact = core_text::strtolower(trim($contact));
    if (validate_email($contact)) {
        return $contact;
    }
    return (string)preg_replace('/\D+/', '', $contact);
}

function pqpir_contact_keys(array $contacts): array {
    $keys = [];
    foreach ($contacts as $contact) {
        $raw = core_text::strtolower(trim((string)$contact));
        if ($raw !== '') {
            $keys[] = $raw;
        }
        $normalised = pqpir_contact_key($raw);
        if ($normalised !== '') {
            $keys[] = $normalised;
        }
    }
    return array_values(array_unique($keys));
}

function pqpir_security_token(int $formtime): string {
    global $CFG;
    $secret = !empty($CFG->passwordsaltmain) ? (string)$CFG->passwordsaltmain : (string)$CFG->wwwroot;
    return hash_hmac('sha256', $formtime . '|' . sesskey(), $secret);
}

function pqpir_security_audit(string $action, array $details = []): void {
    global $DB;
    if (!pqpir_table_exists('local_prequran_live_audit')) {
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

function pqpir_contact_submission_count(array $contacts, int $since): int {
    global $DB;
    $keys = pqpir_contact_keys($contacts);
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

function pqpir_value(array $form, string $name): string {
    if (!isset($form[$name])) {
        return '';
    }
    return is_array($form[$name]) ? implode(', ', array_map('strval', $form[$name])) : (string)$form[$name];
}

function pqpir_selected(array $form, string $name, string $value): string {
    return pqpir_value($form, $name) === $value ? ' selected' : '';
}

function pqpir_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqpir_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $html = '<select class="pqpir-input" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . pqpir_selected($form, $name, (string)$value) . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>' . pqpir_error($errors, $name);
}

function pqpir_public_course_options(stdClass $consumercontext, array $fallback): array {
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

function pqpir_multi_select(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqpir-input pqpir-multi" name="' . s($name) . '[]" multiple size="5">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>' . pqpir_error($errors, $name);
}

function pqpir_slot_summary(array $slots, array $days, array $hours, int $sessioncount = 0): string {
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day === '' || $hour === '') {
            continue;
        }
        $byday[$day][] = pqpir_label($hour, $hours);
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = pqpir_label($day, $days) . ': ' . implode(', ', $dayhours);
    }
    $summary = implode('; ', $parts);
    if ($sessioncount > 0) {
        $prefix = 'Requested sessions per week: ' . $sessioncount;
        return $summary !== '' ? $prefix . '; ' . $summary : $prefix;
    }
    return $summary;
}

function pqpir_teacher_preference(int $teacherid, int $consumerid): ?stdClass {
    global $DB;
    if ($teacherid <= 0 || !pqpir_table_exists('local_prequran_teacher_profile')) {
        return null;
    }
    $consumerwhere = '';
    $params = [
        'teacherid' => $teacherid,
        'activestatus' => 'active',
        'marketstatus' => 'published',
        'vettingstatus' => 'approved',
    ];
    if (pqpir_table_has_column('local_prequran_teacher_profile', 'consumerid') && $consumerid > 0) {
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

function pqpir_teacher_preference_label(?stdClass $teacher): string {
    if (!$teacher) {
        return '';
    }
    $name = trim((string)$teacher->teacher_display_name);
    if ($name === '') {
        $name = trim((string)$teacher->firstname . ' ' . (string)$teacher->lastname);
    }
    return $name . ' (' . pqh_account_no_label($teacher) . ', Moodle ID ' . (int)$teacher->userid . ')';
}

$context = context_system::instance();
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
pqh_apply_consumer_embed_headers($consumercontext);
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
$isprofessionaldevelopment = $institutiontype === 'professional_development';
$isadultlearning = $institutiontype === 'adult_learning';
$isislamicstudies = $institutiontype === 'faith_based_education' && $faithsubcategory === 'islamic_studies';
$ischristianstudies = $institutiontype === 'faith_based_education' && $faithsubcategory === 'christian_studies';
$options['course_types'] = pqpir_public_course_options($consumercontext, $options['course_types'] ?? []);
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
$teacherpreference = pqpir_teacher_preference($requestedteacherid, (int)$consumercontext->consumerid);
$teacherpreferencelabel = pqpir_teacher_preference_label($teacherpreference);
if ($teacherpreference) {
    $consumerparams['teacherid'] = (int)$teacherpreference->userid;
}
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/public_intake.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Prospective Student Inquiry');
$PAGE->set_heading($brandname . ' Prospective Student Inquiry');
$PAGE->add_body_class('pqh-public-intake-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}
@header('X-Robots-Tag: noindex, nofollow', true);
@header('Referrer-Policy: strict-origin-when-cross-origin', true);

$ready = pqpir_table_exists('local_prequran_intake_request');
$message = '';
$errors = [];
$now = time();
if (empty($SESSION->pqpir_formtime) || !is_int($SESSION->pqpir_formtime) || $SESSION->pqpir_formtime < $now - PQPIR_MAX_FORM_SECONDS) {
    $SESSION->pqpir_formtime = $now;
}
$formtime = (int)$SESSION->pqpir_formtime;
$formtoken = pqpir_security_token($formtime);
$form = [
    'parent_name' => '',
    'parent_relationship' => '',
    'parent_relationship_other' => '',
    'parent_email' => '',
    'parent_phone' => '',
    'emergency_contact_name' => '',
    'emergency_contact_phone' => '',
    'student_firstname' => '',
    'student_middle_name' => '',
    'student_lastname' => '',
    'student_display_name' => '',
    'student_access_type' => 'managed',
    'student_email' => '',
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
    'session_count' => '1',
    'slots' => [],
    'parent_preferences' => '',
    'parent_email_enabled' => 1,
    'live_class_consent' => 0,
    'recording_consent' => 0,
    'consent_notes' => '',
];

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $postedformtime = optional_param('formtime', 0, PARAM_INT);
    $postedtoken = optional_param('formtoken', '', PARAM_ALPHANUMEXT);
    $honeypot = optional_param('website', '', PARAM_TEXT);
    $form = [
        'parent_name' => pqpir_limit_text(pqpir_trim('parent_name'), 255),
        'parent_relationship' => pqpir_limit_text(pqpir_trim('parent_relationship'), 40),
        'parent_relationship_other' => pqpir_limit_text(pqpir_trim('parent_relationship_other'), 255),
        'parent_email' => pqpir_contact('parent_email'),
        'parent_phone' => pqpir_contact('parent_phone'),
        'emergency_contact_name' => pqpir_limit_text(pqpir_trim('emergency_contact_name'), 255),
        'emergency_contact_phone' => pqpir_contact('emergency_contact_phone'),
        'student_firstname' => pqpir_limit_text(pqpir_trim('student_firstname'), 100),
        'student_middle_name' => pqpir_limit_text(pqpir_trim('student_middle_name'), 100),
        'student_lastname' => pqpir_limit_text(pqpir_trim('student_lastname'), 100),
        'student_display_name' => pqpir_limit_text(pqpir_trim('student_display_name'), 255),
        'student_access_type' => pqpir_trim('student_access_type', 'managed'),
        'student_email' => pqpir_contact('student_email'),
        'date_of_birth' => pqpir_limit_text(pqpir_trim('date_of_birth'), 20),
        'age_years' => (string)optional_param('age_years', 0, PARAM_INT),
        'gender' => pqpir_trim('gender'),
        'special_needs' => pqpir_trim('special_needs'),
        'current_grade' => pqpir_limit_text(pqpir_trim('current_grade'), 80),
        'school_curriculum' => pqpir_limit_text(pqpir_trim('school_curriculum'), 120),
        'current_school_name' => pqpir_limit_text(pqpir_trim('current_school_name'), 255),
        'student_lives_with' => pqpir_limit_text(pqpir_trim('student_lives_with'), 80),
        'primary_learning_goal' => pqpir_limit_text(pqpir_trim('primary_learning_goal'), 255),
        'medical_safety_notes' => pqpir_limit_text(pqpir_trim('medical_safety_notes'), 2000),
        'preferred_class_format' => pqpir_limit_text(pqpir_trim('preferred_class_format'), 80),
        'preferred_group_size' => pqpir_limit_text(pqpir_trim('preferred_group_size'), 80),
        'preferred_teacher_gender' => pqpir_limit_text(pqpir_trim('preferred_teacher_gender'), 40),
        'school_term' => pqpir_limit_text(pqpir_trim('school_term'), 80),
        'islamic_program_interest' => pqpir_limit_text(pqpir_trim('islamic_program_interest'), 80),
        'quran_reading_level' => pqpir_limit_text(pqpir_trim('quran_reading_level'), 80),
        'tajweed_level' => pqpir_limit_text(pqpir_trim('tajweed_level'), 80),
        'memorization_status' => pqpir_limit_text(pqpir_trim('memorization_status'), 80),
        'memorized_portion' => pqpir_limit_text(pqpir_trim('memorized_portion'), 255),
        'arabic_reading_ability' => pqpir_limit_text(pqpir_trim('arabic_reading_ability'), 80),
        'prior_islamic_studies' => pqpir_limit_text(pqpir_trim('prior_islamic_studies'), 2000),
        'islamic_learning_goal' => pqpir_limit_text(pqpir_trim('islamic_learning_goal'), 255),
        'previous_learning_method' => pqpir_limit_text(pqpir_trim('previous_learning_method'), 80),
        'tafsir_level' => pqpir_limit_text(pqpir_trim('tafsir_level'), 80),
        'islamic_notes' => pqpir_limit_text(pqpir_trim('islamic_notes'), 2000),
        'christian_program_interest' => pqpir_limit_text(pqpir_trim('christian_program_interest'), 80),
        'bible_reading_level' => pqpir_limit_text(pqpir_trim('bible_reading_level'), 80),
        'bible_knowledge_level' => pqpir_limit_text(pqpir_trim('bible_knowledge_level'), 80),
        'christian_studies_level' => pqpir_limit_text(pqpir_trim('christian_studies_level'), 80),
        'prior_christian_studies' => pqpir_limit_text(pqpir_trim('prior_christian_studies'), 2000),
        'christian_previous_learning_method' => pqpir_limit_text(pqpir_trim('christian_previous_learning_method'), 80),
        'christian_learning_goal' => pqpir_limit_text(pqpir_trim('christian_learning_goal'), 255),
        'christian_notes' => pqpir_limit_text(pqpir_trim('christian_notes'), 2000),
        'higher_application_level' => pqpir_limit_text(pqpir_trim('higher_application_level'), 80),
        'higher_program_field' => pqpir_limit_text(pqpir_trim('higher_program_field'), 255),
        'higher_specialization' => pqpir_limit_text(pqpir_trim('higher_specialization'), 255),
        'higher_highest_qualification' => pqpir_limit_text(pqpir_trim('higher_highest_qualification'), 80),
        'higher_previous_institution' => pqpir_limit_text(pqpir_trim('higher_previous_institution'), 255),
        'higher_qualification_title' => pqpir_limit_text(pqpir_trim('higher_qualification_title'), 255),
        'higher_completion_year' => pqpir_limit_text(pqpir_trim('higher_completion_year'), 20),
        'higher_academic_result' => pqpir_limit_text(pqpir_trim('higher_academic_result'), 120),
        'higher_academic_status' => pqpir_limit_text(pqpir_trim('higher_academic_status'), 80),
        'higher_admission_route' => pqpir_limit_text(pqpir_trim('higher_admission_route'), 80),
        'higher_transfer_credits' => pqpir_limit_text(pqpir_trim('higher_transfer_credits'), 20),
        'higher_study_mode' => pqpir_limit_text(pqpir_trim('higher_study_mode'), 40),
        'higher_study_load' => pqpir_limit_text(pqpir_trim('higher_study_load'), 40),
        'higher_preferred_intake' => pqpir_limit_text(pqpir_trim('higher_preferred_intake'), 120),
        'higher_research_interest' => pqpir_limit_text(pqpir_trim('higher_research_interest'), 2000),
        'higher_funding_method' => pqpir_limit_text(pqpir_trim('higher_funding_method'), 80),
        'higher_financial_aid_interest' => pqpir_limit_text(pqpir_trim('higher_financial_aid_interest'), 20),
        'higher_support_needs' => pqpir_limit_text(pqpir_trim('higher_support_needs'), 2000),
        'technical_program' => pqpir_limit_text(pqpir_trim('technical_program'), 80),
        'technical_specialization' => pqpir_limit_text(pqpir_trim('technical_specialization'), 255),
        'technical_training_level' => pqpir_limit_text(pqpir_trim('technical_training_level'), 80),
        'technical_previous_experience' => pqpir_limit_text(pqpir_trim('technical_previous_experience'), 80),
        'technical_previous_learning_method' => pqpir_limit_text(pqpir_trim('technical_previous_learning_method'), 80),
        'technical_experience_duration' => pqpir_limit_text(pqpir_trim('technical_experience_duration'), 40),
        'technical_employment_status' => pqpir_limit_text(pqpir_trim('technical_employment_status'), 80),
        'technical_employer_workshop' => pqpir_limit_text(pqpir_trim('technical_employer_workshop'), 255),
        'technical_training_goal' => pqpir_limit_text(pqpir_trim('technical_training_goal'), 80),
        'technical_certification_sought' => pqpir_limit_text(pqpir_trim('technical_certification_sought'), 255),
        'technical_training_format' => pqpir_limit_text(pqpir_trim('technical_training_format'), 80),
        'technical_training_schedule' => pqpir_limit_text(pqpir_trim('technical_training_schedule'), 40),
        'technical_tools_experience' => pqpir_limit_text(pqpir_trim('technical_tools_experience'), 2000),
        'technical_tool_access' => pqpir_limit_text(pqpir_trim('technical_tool_access'), 40),
        'technical_digital_skill_level' => pqpir_limit_text(pqpir_trim('technical_digital_skill_level'), 40),
        'technical_safety_training' => pqpir_limit_text(pqpir_trim('technical_safety_training'), 20),
        'technical_protective_equipment' => pqpir_limit_text(pqpir_trim('technical_protective_equipment'), 40),
        'technical_support_needs' => pqpir_limit_text(pqpir_trim('technical_support_needs'), 2000),
        'technical_notes' => pqpir_limit_text(pqpir_trim('technical_notes'), 2000),
        'professional_area' => pqpir_limit_text(pqpir_trim('professional_area'), 80),
        'professional_topic_skill' => pqpir_limit_text(pqpir_trim('professional_topic_skill'), 255),
        'professional_current_role' => pqpir_limit_text(pqpir_trim('professional_current_role'), 255),
        'professional_industry' => pqpir_limit_text(pqpir_trim('professional_industry'), 80),
        'professional_employment_status' => pqpir_limit_text(pqpir_trim('professional_employment_status'), 80),
        'professional_employer' => pqpir_limit_text(pqpir_trim('professional_employer'), 255),
        'professional_experience_years' => pqpir_limit_text(pqpir_trim('professional_experience_years'), 40),
        'professional_responsibility_level' => pqpir_limit_text(pqpir_trim('professional_responsibility_level'), 80),
        'professional_development_goal' => pqpir_limit_text(pqpir_trim('professional_development_goal'), 80),
        'professional_skill_level' => pqpir_limit_text(pqpir_trim('professional_skill_level'), 40),
        'professional_credential_sought' => pqpir_limit_text(pqpir_trim('professional_credential_sought'), 255),
        'professional_certification_deadline' => pqpir_limit_text(pqpir_trim('professional_certification_deadline'), 20),
        'professional_learning_format' => pqpir_limit_text(pqpir_trim('professional_learning_format'), 80),
        'professional_learning_schedule' => pqpir_limit_text(pqpir_trim('professional_learning_schedule'), 40),
        'professional_course_intensity' => pqpir_limit_text(pqpir_trim('professional_course_intensity'), 80),
        'professional_employer_sponsored' => pqpir_limit_text(pqpir_trim('professional_employer_sponsored'), 40),
        'professional_cpd_required' => pqpir_limit_text(pqpir_trim('professional_cpd_required'), 20),
        'professional_cpd_credits' => pqpir_limit_text(pqpir_trim('professional_cpd_credits'), 40),
        'professional_workplace_outcome' => pqpir_limit_text(pqpir_trim('professional_workplace_outcome'), 2000),
        'professional_support_needs' => pqpir_limit_text(pqpir_trim('professional_support_needs'), 2000),
        'professional_notes' => pqpir_limit_text(pqpir_trim('professional_notes'), 2000),
        'adult_learning_area' => pqpir_limit_text(pqpir_trim('adult_learning_area'), 80),
        'adult_subject_skill' => pqpir_limit_text(pqpir_trim('adult_subject_skill'), 255),
        'adult_education_level' => pqpir_limit_text(pqpir_trim('adult_education_level'), 80),
        'adult_literacy_level' => pqpir_limit_text(pqpir_trim('adult_literacy_level'), 80),
        'adult_numeracy_level' => pqpir_limit_text(pqpir_trim('adult_numeracy_level'), 80),
        'adult_digital_skill_level' => pqpir_limit_text(pqpir_trim('adult_digital_skill_level'), 40),
        'adult_previous_experience' => pqpir_limit_text(pqpir_trim('adult_previous_experience'), 80),
        'adult_previous_learning_method' => pqpir_limit_text(pqpir_trim('adult_previous_learning_method'), 80),
        'adult_learning_goal' => pqpir_limit_text(pqpir_trim('adult_learning_goal'), 80),
        'adult_employment_status' => pqpir_limit_text(pqpir_trim('adult_employment_status'), 80),
        'adult_learning_format' => pqpir_limit_text(pqpir_trim('adult_learning_format'), 80),
        'adult_learning_pace' => pqpir_limit_text(pqpir_trim('adult_learning_pace'), 40),
        'adult_class_arrangement' => pqpir_limit_text(pqpir_trim('adult_class_arrangement'), 40),
        'adult_childcare_impact' => pqpir_limit_text(pqpir_trim('adult_childcare_impact'), 40),
        'adult_work_impact' => pqpir_limit_text(pqpir_trim('adult_work_impact'), 20),
        'adult_access_limitations' => pqpir_limit_text(pqpir_trim('adult_access_limitations'), 40),
        'adult_learning_confidence' => pqpir_limit_text(pqpir_trim('adult_learning_confidence'), 40),
        'adult_support_needs' => pqpir_limit_text(pqpir_trim('adult_support_needs'), 2000),
        'adult_notes' => pqpir_limit_text(pqpir_trim('adult_notes'), 2000),
        'course_type' => pqpir_trim('course_type'),
        'country' => pqpir_trim('country'),
        'city' => pqpir_trim('city'),
        'city_other' => pqpir_trim('city_other'),
        'timezone' => pqpir_trim('timezone', 'Africa/Nairobi'),
        'primary_language' => pqpir_trim('primary_language'),
        'preferred_teaching_language' => pqpir_trim('preferred_teaching_language'),
        'other_languages' => pqpir_param_array('other_languages'),
        'current_level' => pqpir_trim('current_level'),
        'tajweed_sub_level' => pqpir_trim('tajweed_sub_level'),
        'learning_base' => pqpir_trim('learning_base'),
        'session_count' => (string)optional_param('session_count', 1, PARAM_INT),
        'slots' => pqpir_param_array('slots'),
        'parent_preferences' => pqpir_limit_text(pqpir_trim('parent_preferences'), 4000),
        'parent_email_enabled' => optional_param('parent_email_enabled', 0, PARAM_BOOL) ? 1 : 0,
        'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
        'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
        'consent_notes' => pqpir_limit_text(pqpir_trim('consent_notes'), 2000),
    ];
    $postedteacherid = optional_param('teacherid', 0, PARAM_INT);
    $teacherpreference = pqpir_teacher_preference($postedteacherid, (int)$consumercontext->consumerid);
    $teacherpreferencelabel = pqpir_teacher_preference_label($teacherpreference);
    if ($teacherpreference) {
        $consumerparams['teacherid'] = (int)$teacherpreference->userid;
    }

    $isadultstudent = (int)$form['age_years'] >= 18;

    $elapsed = time() - $postedformtime;
    if ($honeypot !== '') {
        $errors['form_security'] = 'The request could not be accepted. Please reload the form and try again.';
        pqpir_security_audit('public_intake_blocked_honeypot');
    }
    if ($postedformtime <= 0 || !hash_equals(pqpir_security_token($postedformtime), $postedtoken)) {
        $errors['form_security'] = 'The form security token expired. Please reload the form and try again.';
        pqpir_security_audit('public_intake_blocked_token');
    } else if ($elapsed < PQPIR_MIN_FORM_SECONDS || $elapsed > PQPIR_MAX_FORM_SECONDS) {
        $errors['form_security'] = 'Please reload the form and submit again.';
        pqpir_security_audit('public_intake_blocked_timing', ['elapsed' => $elapsed]);
    }
    if (!empty($SESSION->pqpir_last_submit) && (time() - (int)$SESSION->pqpir_last_submit) < PQPIR_SESSION_COOLDOWN_SECONDS) {
        $errors['form_security'] = 'Please wait a minute before submitting another request.';
        pqpir_security_audit('public_intake_blocked_session_rate');
    }

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
        if (($field === 'age_years' && (int)$form[$field] <= 0) || ($field === 'session_count' && ((int)$form[$field] < 1 || (int)$form[$field] > 5)) || (!in_array($field, ['age_years', 'session_count'], true) && pqpir_value($form, $field) === '')) {
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
            if (pqpir_value($form, $field) === '') {
                $errors[$field] = $errormessage;
            }
        }
        if (pqpir_value($form, 'parent_phone') === '' && pqpir_value($form, 'parent_email') === '') {
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
            if (pqpir_value($form, $field) === '') {
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
            if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
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
            if (pqpir_value($form, $field) === '') {
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
            if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
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
            if (pqpir_value($form, $field) === '') {
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
            if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
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
            if (pqpir_value($form, $field) === '') {
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
            if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
    }
    if ($isadultstudent) {
        if (pqpir_value($form, 'student_email') === '') {
            $errors['student_email'] = 'Adult students must provide their own email address or phone number.';
        }
    } else {
        foreach ([
            'parent_name' => 'Please enter the parent/guardian name.',
            'parent_relationship' => 'Please select the parent/guardian relationship to the student.',
        ] as $field => $errormessage) {
            if (pqpir_value($form, $field) === '') {
                $errors[$field] = $errormessage;
            }
        }
        if (pqpir_value($form, 'parent_relationship') === 'other' && pqpir_value($form, 'parent_relationship_other') === '') {
            $errors['parent_relationship_other'] = 'Please describe the parent/guardian relationship to the student.';
        }
        if (pqpir_value($form, 'parent_phone') === '' && pqpir_value($form, 'parent_email') === '') {
            $errors['parent_phone'] = 'Please enter a parent/guardian phone, WhatsApp, or email contact.';
        }
    }
    if (pqpir_value($form, 'parent_relationship') !== '' && !array_key_exists(pqpir_value($form, 'parent_relationship'), $options['parent_relationships'] ?? [])) {
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
        if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
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
            if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
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
            if (pqpir_value($form, $field) !== '' && !array_key_exists(pqpir_value($form, $field), $options[$optionkey] ?? [])) {
                $errors[$field] = 'Please select a valid option.';
            }
        }
    }
    foreach (['parent_email', 'parent_phone', 'student_email', 'emergency_contact_phone'] as $contactfield) {
        if (!pqpir_contact_ok(pqpir_value($form, $contactfield))) {
            $errors[$contactfield] = 'Enter a valid email address or phone number.';
        }
    }
    if (($isprimaryeducation || pqpir_value($form, 'special_needs') !== '') && !in_array(pqpir_value($form, 'special_needs'), ['yes', 'no'], true)) {
        $errors['special_needs'] = 'Please select Yes or No for Special Needs.';
    }
    if (!array_key_exists(pqpir_value($form, 'course_type'), $options['course_types'] ?? [])) {
        $errors['course_type'] = 'Please select a valid course.';
    }
    if (!array_key_exists(pqpir_value($form, 'student_access_type'), $options['student_access_types'] ?? [])) {
        $errors['student_access_type'] = 'Please select Managed Student or Unmanaged Student.';
    }
    if (!array_key_exists(pqpir_value($form, 'current_level'), $options['current_levels'] ?? [])) {
        $errors['current_level'] = 'Please select a valid placement level.';
    }
    if (!array_key_exists(pqpir_value($form, 'preferred_teaching_language'), $options['primary_languages'] ?? [])) {
        $errors['preferred_teaching_language'] = 'Please select a valid preferred teaching language.';
    }
    if (pqpir_value($form, 'current_level') === 'level_3' && !array_key_exists(pqpir_value($form, 'tajweed_sub_level'), $options['tajweed_sub_levels'] ?? [])) {
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
    if ($form['city'] === 'Other' && pqpir_value($form, 'city_other') === '') {
        $errors['city_other'] = 'Please enter the city name.';
    }
    $countryzones = $options['country_timezones'][$form['country']] ?? [];
    if ($form['country'] !== '' && $form['timezone'] !== '' && $countryzones && !in_array($form['timezone'], $countryzones, true)) {
        $errors['timezone'] = 'Please select a time zone listed for the selected country.';
    }
    if (empty($form['live_class_consent'])) {
        $errors['live_class_consent'] = 'Live class consent is required before we can review the request.';
    }
    if (!$errors) {
        $recentcount = pqpir_contact_submission_count([
            pqpir_value($form, 'parent_email'),
            pqpir_value($form, 'parent_phone'),
            pqpir_value($form, 'student_email'),
        ], time() - PQPIR_CONTACT_WINDOW_SECONDS);
        if ($recentcount >= PQPIR_CONTACT_WINDOW_LIMIT) {
            $errors['form_security'] = 'We already received several recent requests with this contact information. Please wait before submitting another request.';
            pqpir_security_audit('public_intake_blocked_contact_rate', ['recent_count' => $recentcount]);
        }
    }

    if (!$errors) {
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
                'day_label' => pqpir_label($day, $options['availability_days'] ?? []),
                'time_label' => pqpir_label($hour, $options['availability_time_windows'] ?? []),
            ];
        }
        $displayname = pqpir_value($form, 'student_display_name');
        if ($displayname === '') {
            $displayname = trim(pqpir_value($form, 'student_firstname') . ' ' . pqpir_value($form, 'student_middle_name') . ' ' . pqpir_value($form, 'student_lastname'));
        }
        $city = pqpir_value($form, 'city') === 'Other' ? pqpir_value($form, 'city_other') : pqpir_value($form, 'city');

        $teacherprefnote = $teacherpreferencelabel !== '' ? 'Marketplace teacher preference: ' . $teacherpreferencelabel . '.' : '';
        $parentpreferences = pqpir_value($form, 'parent_preferences');
        if ($teacherprefnote !== '' && stripos($parentpreferences, $teacherprefnote) === false) {
            $parentpreferences = trim($teacherprefnote . "\n" . $parentpreferences);
        }

        $requestrecord = (object)[
            'parent_name' => pqpir_value($form, 'parent_name'),
            'parent_email' => pqpir_value($form, 'parent_email'),
            'parent_phone' => pqpir_value($form, 'parent_phone'),
            'student_firstname' => pqpir_value($form, 'student_firstname'),
            'student_middle_name' => pqpir_value($form, 'student_middle_name'),
            'student_lastname' => pqpir_value($form, 'student_lastname'),
            'student_display_name' => $displayname,
            'student_access_type' => pqpir_value($form, 'student_access_type'),
            'student_email' => pqpir_value($form, 'student_email'),
            'date_of_birth' => pqpir_value($form, 'date_of_birth'),
            'age_years' => (int)$form['age_years'],
            'gender' => pqpir_value($form, 'gender'),
            'country' => pqpir_value($form, 'country'),
            'city' => $city,
            'timezone' => pqpir_value($form, 'timezone'),
            'primary_language' => pqpir_value($form, 'primary_language'),
            'preferred_teaching_language' => pqpir_value($form, 'preferred_teaching_language'),
            'other_languages' => implode(', ', pqpir_labels($form['other_languages'], $options['other_languages'] ?? [])),
            'current_level' => pqpir_value($form, 'current_level'),
            'tajweed_sub_level' => pqpir_value($form, 'tajweed_sub_level'),
            'learning_base' => pqpir_value($form, 'learning_base'),
            'availability_json' => json_encode(['timezone' => pqpir_value($form, 'timezone'), 'session_count' => (int)$form['session_count'], 'slots' => $slots]),
            'availability_summary' => pqpir_slot_summary($form['slots'], $options['availability_days'] ?? [], $options['availability_time_windows'] ?? [], (int)$form['session_count']),
            'parent_preferences' => $parentpreferences,
            'parent_email_enabled' => (int)$form['parent_email_enabled'],
            'live_class_consent' => (int)$form['live_class_consent'],
            'recording_consent' => (int)$form['recording_consent'],
            'consent_notes' => pqpir_value($form, 'consent_notes'),
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
        if (pqpir_table_has_column('local_prequran_intake_request', 'special_needs')) {
            $requestrecord->special_needs = pqpir_value($form, 'special_needs');
        }
        if (pqpir_table_has_column('local_prequran_intake_request', 'course_type')) {
            $requestrecord->course_type = pqpir_value($form, 'course_type');
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
            if (pqpir_table_has_column('local_prequran_intake_request', $extrafield)) {
                $requestrecord->{$extrafield} = pqpir_value($form, $extrafield);
            }
        }
        if (pqpir_table_has_column('local_prequran_intake_request', 'consumerid')) {
            $requestrecord->consumerid = (int)$consumercontext->consumerid;
        }
        if (pqpir_table_has_column('local_prequran_intake_request', 'workspaceid')) {
            $requestrecord->workspaceid = (int)$consumercontext->workspaceid;
        }
        $requestid = $DB->insert_record('local_prequran_intake_request', $requestrecord);
        $SESSION->pqpir_last_submit = $now;
        $SESSION->pqpir_formtime = $now;
        pqpir_security_audit('public_intake_submitted', [
            'requestid' => (int)$requestid,
            'consumerid' => (int)$consumercontext->consumerid,
            'consumerslug' => (string)$consumercontext->consumerslug,
        ]);
        $returnurl = trim((string)($consumercontext->returnurl ?? ''));
        if ($returnurl !== '' && preg_match('#^https?://#i', $returnurl)) {
            redirect($returnurl);
        }
        redirect(new moodle_url('/local/hubredirect/public_intake.php', ['submitted' => 1] + $consumerparams));
    }
}

if (optional_param('submitted', 0, PARAM_BOOL)) {
    $message = 'Thank you. Your request was received and ' . $brandname . ' will review the best live-class options.';
}

echo $OUTPUT->header();
echo ehp_styles();
?>
<style>
body.pqh-public-intake-page header:not(.pqpir-navshell),body.pqh-public-intake-page header#page-header,body.pqh-public-intake-page header.navbar,body.pqh-public-intake-page .navbar,body.pqh-public-intake-page .navbar.fixed-top,body.pqh-public-intake-page .primary-navigation,body.pqh-public-intake-page .secondary-navigation,body.pqh-public-intake-page .moremenu,body.pqh-public-intake-page footer,body.pqh-public-intake-page nav.navbar,body.pqh-public-intake-page #page-header,body.pqh-public-intake-page #page-footer,body.pqh-public-intake-page .drawer,body.pqh-public-intake-page .drawer-toggles,body.pqh-public-intake-page .block-region,body.pqh-public-intake-page [data-region="drawer"],body.pqh-public-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-public-intake-page{padding-top:0!important}
body.pqh-public-intake-page #page-wrapper,body.pqh-public-intake-page #page,body.pqh-public-intake-page #page-content,body.pqh-public-intake-page #region-main,body.pqh-public-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqpir-shell{--pq-sky:#aee9ff;--pq-sky-soft:#e7f5ff;--pq-sun:#fff2cf;--pq-pink:#ffe1f4;--pq-green:#66d992;--pq-green-soft:#e8fff0;--pq-orange:#d99a26;--pq-orange-soft:#fff3e6;--pq-ink:#0f2230;--pq-ink-2:#234457;--pq-muted:#516a7a;--pq-stroke:rgba(15,34,48,.13);--pq-shadow:0 18px 46px rgba(15,34,48,.14);position:fixed;inset:0;z-index:2147483000;overflow:auto;min-height:100vh;padding:0 0 64px;background:radial-gradient(circle at 8% 6%,rgba(255,225,244,.72) 0,transparent 32%),radial-gradient(circle at 92% 2%,rgba(174,233,255,.78) 0,transparent 34%),linear-gradient(180deg,rgba(255,255,255,.93) 0,rgba(246,251,255,.94) 50%,rgba(255,249,239,.96) 100%),url("/local/ehelhome/pix/landing-welcome.jpg") center/cover fixed no-repeat;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:var(--pq-ink)}
.pqpir-wrap{max-width:1160px;margin:0 auto;padding:18px 18px 0}.pqpir-hero,.pqpir-panel{background:rgba(255,255,255,.92);border:1px solid var(--pq-stroke);border-radius:10px;box-shadow:var(--pq-shadow);backdrop-filter:blur(8px)}.pqpir-hero{position:relative;overflow:hidden;min-height:280px;padding:42px 36px;margin-bottom:18px;background:linear-gradient(90deg,rgba(8,31,24,.92),rgba(15,61,46,.72) 54%,rgba(15,61,46,.34)),url("/local/ehelhome/pix/landing-welcome.jpg") center/cover no-repeat;color:#fff}.pqpir-hero:before{display:none}.pqpir-brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:14px;color:#ffd88c;font-size:13px;font-weight:950;text-transform:uppercase}.pqpir-brand-mark{display:none}.pqpir-title{margin:0;font-size:44px;line-height:1.06;font-weight:950;color:#fff;letter-spacing:0;text-shadow:0 8px 28px rgba(0,0,0,.28)}.pqpir-sub{max-width:840px;margin:14px 0 0;color:rgba(255,255,255,.88);font-size:17px;font-weight:800;line-height:1.65}.pqpir-panel{padding:26px}.pqpir-panel h2{margin:0 0 16px;font-size:26px;line-height:1.1;font-weight:950;color:var(--pq-ink)}.pqpir-panel h3{display:inline-flex;align-items:center;margin:22px 0 12px;padding:7px 11px;border-radius:999px;background:var(--pq-orange-soft);border:1px solid rgba(217,154,38,.22);font-size:15px;font-weight:950;color:#6f4e32}.pqpir-muted{color:var(--pq-muted);font-size:12px}.pqpir-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqpir-field{display:grid;gap:7px;margin-bottom:12px;align-content:start;align-self:start}.pqpir-field label{font-size:13px;font-weight:950;color:var(--pq-ink-2)}.pqpir-pref{padding:13px 15px;margin:0 0 16px;border:1px solid rgba(47,111,78,.18);border-radius:10px;background:#edf9ef;color:#245c35;font-weight:950}.pqpir-city-other{display:none}.pqpir-city-other--visible{display:grid}.pqpir-input{width:100%;min-height:48px;border:2px solid #d9e7f7;border-radius:10px;padding:10px 12px;font:800 15px/1.2 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#fff;color:var(--pq-ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease}.pqpir-input:focus{outline:0;border-color:#7cc7ff;box-shadow:0 0 0 4px rgba(34,193,232,.14)}.pqpir-multi{min-height:136px}.pqpir-textarea{min-height:96px;line-height:1.45}.pqpir-error{font-size:12px;font-weight:950;color:#a33a2c}.pqpir-field--error .pqpir-input,.pqpir-field--error .pqpir-calendar{border-color:#d6543f;background:#fff8f6;box-shadow:0 0 0 4px rgba(214,84,63,.08)}.pqpir-alert{padding:15px 18px;border-radius:10px;margin-bottom:14px;font-weight:950;border:2px solid transparent}.pqpir-alert ul{margin:8px 0 0;padding-left:22px}.pqpir-alert--ok{background:linear-gradient(135deg,#e8fff0,#f7fff9);border-color:#b9f5c7;color:#0f5c3a}.pqpir-alert--bad{background:linear-gradient(135deg,#fff3e6,#fff8f6);border-color:#ffd6a5;color:#8a3a06}.pqpir-calendar{overflow:auto;border:2px solid #d9e7f7;border-radius:10px;background:#fff}.pqpir-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:850px}.pqpir-calendar th,.pqpir-calendar td{border-bottom:1px solid rgba(15,34,48,.1);border-right:1px solid rgba(15,34,48,.08);padding:10px;text-align:center;font-weight:900}.pqpir-calendar th{background:linear-gradient(135deg,#e3faff,#f7fcff);color:var(--pq-ink-2);font-size:12px}.pqpir-calendar td:first-child{text-align:left;color:var(--pq-ink);background:#fffdf6}.pqpir-calendar tr:nth-child(even) td:first-child{background:#f8fff8}.pqpir-slot{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#eef7ff;border:1px solid #d9e7f7}.pqpir-slot input{width:19px;height:19px;accent-color:var(--pq-orange)}.pqpir-checkrow{display:flex;gap:10px;align-items:flex-start;margin:10px 0 13px;font-size:14px;font-weight:950;color:var(--pq-ink)}.pqpir-checkrow input{width:20px;height:20px;accent-color:#22c55e}.pqpir-level-guide{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:4px 0 14px}.pqpir-level-card{padding:12px;border:1px solid rgba(15,34,48,.12);border-radius:10px;background:#fffdf6}.pqpir-level-card strong{display:block;margin-bottom:6px;color:var(--pq-ink);font-size:13px}.pqpir-level-card p{margin:4px 0;color:var(--pq-muted);font-size:12px;font-weight:850;line-height:1.35}.pqpir-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:0;border-radius:10px;background:#d99a26;color:#1b1409!important;text-decoration:none;font-size:16px;font-weight:950;cursor:pointer;box-shadow:0 12px 22px rgba(217,154,38,.25)}.pqpir-btn:hover{filter:saturate(1.05) brightness(.98)}.pqpir-empty{padding:18px;border:2px dashed rgba(15,34,48,.2);border-radius:10px;color:var(--pq-muted);font-weight:950;background:#fffdf6}.pqpir-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
@media(max-width:760px){.pqpir-grid,.pqpir-level-guide{grid-template-columns:1fr}.pqpir-title{font-size:30px}.pqpir-shell{padding:0 0 44px}.pqpir-wrap{padding:12px 10px 0}.pqpir-hero,.pqpir-panel{border-radius:18px}.pqpir-hero{padding:24px 18px}.pqpir-panel{padding:18px}.pqpir-sub{font-size:15px}}
.pqpir-navshell{max-width:1160px;margin:0 auto;padding:22px 18px 0;display:flex;align-items:center;justify-content:space-between;gap:18px}.pqpir-navbrand{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--pq-ink)!important;min-width:0}.pqpir-navmark{width:44px;height:44px;border-radius:10px;background:#3f7a50;color:#fff;display:grid;place-items:center;font-size:18px;font-weight:950;flex:0 0 auto}.pqpir-navname{font-size:19px;font-weight:950;line-height:1.1;white-space:normal}.pqpir-navlinks{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;align-items:center}.pqpir-navlink{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:10px;background:#f2f7f5;border:1px solid rgba(15,34,48,.12);color:var(--pq-ink)!important;text-decoration:none;font-weight:950;box-shadow:0 5px 14px rgba(15,34,48,.08)}.pqpir-navlink--active{background:#e9f8ef;border-color:rgba(63,122,80,.22)}.pqpir-navlink--primary{background:#d99a26;border-color:#d99a26;color:#1b1409!important}@media(max-width:760px){.pqpir-navshell{align-items:flex-start;flex-direction:column}.pqpir-navlinks{justify-content:flex-start}.pqpir-navlink{min-height:40px;padding:0 13px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqpir-shell">
  <?php echo pqpir_public_header($consumercontext, $consumerparams); ?>
  <div class="pqpir-wrap">
    <section class="pqpir-hero pqh-workspace-top">
      <div class="pqpir-brand"><span class="pqpir-brand-mark"><?php echo s(pqpir_consumer_initial($brandname)); ?></span><span>Enrollment</span></div>
      <h1 class="pqpir-title pqh-workspace-title">Request Enrollment</h1>
      <p class="pqpir-sub pqh-workspace-sub">Share the prospective student's details, preferred weekly session count, and available live-session hours. The <?php echo s($brandname); ?> team will review placement and confirm the best class options.</p>
    </section>

    <?php if ($message !== ''): ?><div class="pqpir-alert pqpir-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($errors): ?>
      <div class="pqpir-alert pqpir-alert--bad">
        Please fix the highlighted fields below.
        <ul>
          <?php foreach ($errors as $field => $msg): ?><li><?php echo s(pqpir_field_label((string)$field) . ': ' . $msg); ?></li><?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqpir-panel"><div class="pqpir-empty">The live-class request form is not ready yet. Please contact <?php echo s($brandname); ?> support.</div></section>
    <?php else: ?>
      <section class="pqpir-panel">
        <h2>Student Information</h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <?php if ((int)$consumercontext->workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
          <input type="hidden" name="formtime" value="<?php echo (int)$formtime; ?>">
          <input type="hidden" name="formtoken" value="<?php echo s($formtoken); ?>">
          <?php if ($teacherpreference): ?><input type="hidden" name="teacherid" value="<?php echo (int)$teacherpreference->userid; ?>"><?php endif; ?>
          <div class="pqpir-trap" aria-hidden="true">
            <label>Website <input name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <?php if ($teacherpreferencelabel !== ''): ?><div class="pqpir-pref">Preferred teacher: <?php echo s($teacherpreferencelabel); ?></div><?php endif; ?>

          <h3>Basic learner information</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['student_firstname']) ? ' pqpir-field--error' : ''; ?>"><label>First name</label><input class="pqpir-input" name="student_firstname" value="<?php echo s(pqpir_value($form, 'student_firstname')); ?>"><?php echo pqpir_error($errors, 'student_firstname'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['student_middle_name']) ? ' pqpir-field--error' : ''; ?>"><label>Middle name</label><input class="pqpir-input" name="student_middle_name" value="<?php echo s(pqpir_value($form, 'student_middle_name')); ?>"><?php echo pqpir_error($errors, 'student_middle_name'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['student_lastname']) ? ' pqpir-field--error' : ''; ?>"><label>Last name</label><input class="pqpir-input" name="student_lastname" value="<?php echo s(pqpir_value($form, 'student_lastname')); ?>"><?php echo pqpir_error($errors, 'student_lastname'); ?></div>
            <div class="pqpir-field"><label>Preferred name</label><input class="pqpir-input" name="student_display_name" value="<?php echo s(pqpir_value($form, 'student_display_name')); ?>"></div>
            <div class="pqpir-field<?php echo isset($errors['student_email']) ? ' pqpir-field--error' : ''; ?>"><label>Email address or phone / WhatsApp</label><input class="pqpir-input" name="student_email" value="<?php echo s(pqpir_value($form, 'student_email')); ?>"><?php echo pqpir_error($errors, 'student_email'); ?></div>
          </div>

          <?php if ($isprimaryeducation): ?>
            <h3>Primary education details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['date_of_birth']) ? ' pqpir-field--error' : ''; ?>"><label>Date of birth</label><input class="pqpir-input" name="date_of_birth" type="date" value="<?php echo s(pqpir_value($form, 'date_of_birth')); ?>"><?php echo pqpir_error($errors, 'date_of_birth'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['age_years']) ? ' pqpir-field--error' : ''; ?>"><label>Age</label><input class="pqpir-input" name="age_years" type="number" min="1" max="99" value="<?php echo s(pqpir_value($form, 'age_years')); ?>"><?php echo pqpir_error($errors, 'age_years'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['gender']) ? ' pqpir-field--error' : ''; ?>"><label>Gender</label><select class="pqpir-input" name="gender"><option value="">Select</option><option value="female"<?php echo pqpir_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqpir_selected($form, 'gender', 'male'); ?>>Male</option></select><?php echo pqpir_error($errors, 'gender'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['current_grade']) ? ' pqpir-field--error' : ''; ?>"><label>Current grade/year</label><?php echo pqpir_select('current_grade', $options['primary_grade_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['school_curriculum']) ? ' pqpir-field--error' : ''; ?>"><label>School curriculum</label><?php echo pqpir_select('school_curriculum', $options['primary_curricula'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['current_school_name']) ? ' pqpir-field--error' : ''; ?>"><label>Current school name</label><input class="pqpir-input" name="current_school_name" value="<?php echo s(pqpir_value($form, 'current_school_name')); ?>"><?php echo pqpir_error($errors, 'current_school_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['student_lives_with']) ? ' pqpir-field--error' : ''; ?>"><label>Student lives with</label><?php echo pqpir_select('student_lives_with', $options['student_lives_with_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['primary_learning_goal']) ? ' pqpir-field--error' : ''; ?>"><label>Primary learning goal</label><input class="pqpir-input" name="primary_learning_goal" value="<?php echo s(pqpir_value($form, 'primary_learning_goal')); ?>"><?php echo pqpir_error($errors, 'primary_learning_goal'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['preferred_class_format']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred class format</label><?php echo pqpir_select('preferred_class_format', $options['primary_class_formats'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['preferred_group_size']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred group size</label><?php echo pqpir_select('preferred_group_size', $options['primary_group_sizes'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['preferred_teacher_gender']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred teacher gender</label><?php echo pqpir_select('preferred_teacher_gender', $options['teacher_gender_preferences'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['school_term']) ? ' pqpir-field--error' : ''; ?>"><label>School term/admission year</label><input class="pqpir-input" name="school_term" value="<?php echo s(pqpir_value($form, 'school_term')); ?>"><?php echo pqpir_error($errors, 'school_term'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['special_needs']) ? ' pqpir-field--error' : ''; ?>"><label>Special learning needs / accommodations</label><select class="pqpir-input" name="special_needs"><option value="">Select</option><option value="no"<?php echo pqpir_selected($form, 'special_needs', 'no'); ?>>No</option><option value="yes"<?php echo pqpir_selected($form, 'special_needs', 'yes'); ?>>Yes</option></select><?php echo pqpir_error($errors, 'special_needs'); ?></div>
            </div>
            <div class="pqpir-field<?php echo isset($errors['medical_safety_notes']) ? ' pqpir-field--error' : ''; ?>"><label>Medical/allergy/safety notes</label><textarea class="pqpir-input pqpir-textarea" name="medical_safety_notes"><?php echo s(pqpir_value($form, 'medical_safety_notes')); ?></textarea><?php echo pqpir_error($errors, 'medical_safety_notes'); ?></div>

            <h3>Parent / guardian</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['parent_name']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian name</label><input class="pqpir-input" name="parent_name" value="<?php echo s(pqpir_value($form, 'parent_name')); ?>"><?php echo pqpir_error($errors, 'parent_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_relationship']) ? ' pqpir-field--error' : ''; ?>"><label>Relationship to student</label><?php echo pqpir_select('parent_relationship', $options['parent_relationships'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field pqpir-parent-relationship-other<?php echo isset($errors['parent_relationship_other']) ? ' pqpir-field--error' : ''; ?>"><label>Describe relationship</label><input class="pqpir-input" name="parent_relationship_other" value="<?php echo s(pqpir_value($form, 'parent_relationship_other')); ?>"><?php echo pqpir_error($errors, 'parent_relationship_other'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_email']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian email or phone</label><input class="pqpir-input" name="parent_email" value="<?php echo s(pqpir_value($form, 'parent_email')); ?>"><?php echo pqpir_error($errors, 'parent_email'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian phone / WhatsApp</label><input class="pqpir-input" name="parent_phone" value="<?php echo s(pqpir_value($form, 'parent_phone')); ?>"><?php echo pqpir_error($errors, 'parent_phone'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['emergency_contact_name']) ? ' pqpir-field--error' : ''; ?>"><label>Emergency contact name</label><input class="pqpir-input" name="emergency_contact_name" value="<?php echo s(pqpir_value($form, 'emergency_contact_name')); ?>"><?php echo pqpir_error($errors, 'emergency_contact_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['emergency_contact_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Emergency contact phone</label><input class="pqpir-input" name="emergency_contact_phone" value="<?php echo s(pqpir_value($form, 'emergency_contact_phone')); ?>"><?php echo pqpir_error($errors, 'emergency_contact_phone'); ?></div>
            </div>
          <?php else: ?>
            <h3>Parent / guardian <span class="pqpir-muted">(required only when the student is under 18)</span></h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['parent_name']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian name</label><input class="pqpir-input" name="parent_name" value="<?php echo s(pqpir_value($form, 'parent_name')); ?>"><?php echo pqpir_error($errors, 'parent_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_relationship']) ? ' pqpir-field--error' : ''; ?>"><label>Relationship to student</label><?php echo pqpir_select('parent_relationship', $options['parent_relationships'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field pqpir-parent-relationship-other<?php echo isset($errors['parent_relationship_other']) ? ' pqpir-field--error' : ''; ?>"><label>Describe relationship</label><input class="pqpir-input" name="parent_relationship_other" value="<?php echo s(pqpir_value($form, 'parent_relationship_other')); ?>"><?php echo pqpir_error($errors, 'parent_relationship_other'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_email']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian email or phone</label><input class="pqpir-input" name="parent_email" value="<?php echo s(pqpir_value($form, 'parent_email')); ?>"><?php echo pqpir_error($errors, 'parent_email'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian phone / WhatsApp</label><input class="pqpir-input" name="parent_phone" value="<?php echo s(pqpir_value($form, 'parent_phone')); ?>"><?php echo pqpir_error($errors, 'parent_phone'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['emergency_contact_name']) ? ' pqpir-field--error' : ''; ?>"><label>Emergency contact name</label><input class="pqpir-input" name="emergency_contact_name" value="<?php echo s(pqpir_value($form, 'emergency_contact_name')); ?>"><?php echo pqpir_error($errors, 'emergency_contact_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['emergency_contact_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Emergency contact phone</label><input class="pqpir-input" name="emergency_contact_phone" value="<?php echo s(pqpir_value($form, 'emergency_contact_phone')); ?>"><?php echo pqpir_error($errors, 'emergency_contact_phone'); ?></div>
            </div>
          <?php endif; ?>

          <?php if ($isadultlearning): ?>
            <h3>Adult learning details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['adult_learning_area']) ? ' pqpir-field--error' : ''; ?>"><label>Learning area of interest</label><?php echo pqpir_select('adult_learning_area', $options['adult_learning_areas'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Specific subject or skill</label><input class="pqpir-input" name="adult_subject_skill" value="<?php echo s(pqpir_value($form, 'adult_subject_skill')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['adult_education_level']) ? ' pqpir-field--error' : ''; ?>"><label>Highest education level completed</label><?php echo pqpir_select('adult_education_level', $options['adult_education_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Current literacy level</label><?php echo pqpir_select('adult_literacy_level', $options['adult_literacy_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Current numeracy level</label><?php echo pqpir_select('adult_numeracy_level', $options['adult_numeracy_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Digital skill level</label><?php echo pqpir_select('adult_digital_skill_level', $options['adult_digital_skill_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Previous adult-learning experience</label><?php echo pqpir_select('adult_previous_experience', $options['adult_previous_experiences'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Previous learning method</label><?php echo pqpir_select('adult_previous_learning_method', $options['adult_learning_methods'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['adult_learning_goal']) ? ' pqpir-field--error' : ''; ?>"><label>Primary learning goal</label><?php echo pqpir_select('adult_learning_goal', $options['adult_learning_goals'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Current employment status</label><?php echo pqpir_select('adult_employment_status', $options['adult_employment_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['adult_learning_format']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred learning format</label><?php echo pqpir_select('adult_learning_format', $options['adult_learning_formats'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['adult_learning_pace']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred learning pace</label><?php echo pqpir_select('adult_learning_pace', $options['adult_learning_paces'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Preferred class arrangement</label><?php echo pqpir_select('adult_class_arrangement', $options['adult_class_arrangements'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Childcare responsibilities affecting attendance</label><?php echo pqpir_select('adult_childcare_impact', $options['adult_childcare_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Work responsibilities affecting attendance</label><?php echo pqpir_select('adult_work_impact', $options['adult_attendance_impact_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Transport or connectivity limitations</label><?php echo pqpir_select('adult_access_limitations', $options['adult_access_limitations'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Confidence returning to learning</label><?php echo pqpir_select('adult_learning_confidence', $options['adult_learning_confidence_levels'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpir-field"><label>Learning support or accessibility needs</label><textarea class="pqpir-input pqpir-textarea" name="adult_support_needs"><?php echo s(pqpir_value($form, 'adult_support_needs')); ?></textarea></div>
            <div class="pqpir-field"><label>Additional adult-learning notes</label><textarea class="pqpir-input pqpir-textarea" name="adult_notes"><?php echo s(pqpir_value($form, 'adult_notes')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($isprofessionaldevelopment): ?>
            <h3>Professional development details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['professional_area']) ? ' pqpir-field--error' : ''; ?>"><label>Professional development area</label><?php echo pqpir_select('professional_area', $options['professional_development_areas'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Specific topic or skill</label><input class="pqpir-input" name="professional_topic_skill" value="<?php echo s(pqpir_value($form, 'professional_topic_skill')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['professional_current_role']) ? ' pqpir-field--error' : ''; ?>"><label>Current professional role</label><input class="pqpir-input" name="professional_current_role" value="<?php echo s(pqpir_value($form, 'professional_current_role')); ?>"><?php echo pqpir_error($errors, 'professional_current_role'); ?></div>
              <div class="pqpir-field"><label>Industry or sector</label><?php echo pqpir_select('professional_industry', $options['professional_industries'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['professional_employment_status']) ? ' pqpir-field--error' : ''; ?>"><label>Employment status</label><?php echo pqpir_select('professional_employment_status', $options['professional_employment_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Employer or organisation</label><input class="pqpir-input" name="professional_employer" value="<?php echo s(pqpir_value($form, 'professional_employer')); ?>"></div>
              <div class="pqpir-field"><label>Years of professional experience</label><?php echo pqpir_select('professional_experience_years', $options['professional_experience_ranges'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Current responsibility level</label><?php echo pqpir_select('professional_responsibility_level', $options['professional_responsibility_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['professional_development_goal']) ? ' pqpir-field--error' : ''; ?>"><label>Primary development goal</label><?php echo pqpir_select('professional_development_goal', $options['professional_development_goals'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['professional_skill_level']) ? ' pqpir-field--error' : ''; ?>"><label>Current skill level</label><?php echo pqpir_select('professional_skill_level', $options['professional_skill_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Certification or credential sought</label><input class="pqpir-input" name="professional_credential_sought" value="<?php echo s(pqpir_value($form, 'professional_credential_sought')); ?>"></div>
              <div class="pqpir-field"><label>Certification deadline</label><input class="pqpir-input" name="professional_certification_deadline" type="date" value="<?php echo s(pqpir_value($form, 'professional_certification_deadline')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['professional_learning_format']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred learning format</label><?php echo pqpir_select('professional_learning_format', $options['professional_learning_formats'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Preferred learning schedule</label><?php echo pqpir_select('professional_learning_schedule', $options['professional_learning_schedules'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Preferred course intensity</label><?php echo pqpir_select('professional_course_intensity', $options['professional_course_intensities'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Employer-sponsored training</label><?php echo pqpir_select('professional_employer_sponsored', $options['professional_sponsorship_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>CPD credits required</label><?php echo pqpir_select('professional_cpd_required', $options['professional_cpd_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Required CPD credits or hours</label><input class="pqpir-input" name="professional_cpd_credits" type="number" min="0" value="<?php echo s(pqpir_value($form, 'professional_cpd_credits')); ?>"></div>
            </div>
            <div class="pqpir-field"><label>Expected workplace outcome</label><textarea class="pqpir-input pqpir-textarea" name="professional_workplace_outcome"><?php echo s(pqpir_value($form, 'professional_workplace_outcome')); ?></textarea></div>
            <div class="pqpir-field"><label>Professional support or accessibility needs</label><textarea class="pqpir-input pqpir-textarea" name="professional_support_needs"><?php echo s(pqpir_value($form, 'professional_support_needs')); ?></textarea></div>
            <div class="pqpir-field"><label>Additional professional development notes</label><textarea class="pqpir-input pqpir-textarea" name="professional_notes"><?php echo s(pqpir_value($form, 'professional_notes')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($istechnicaltraining): ?>
            <h3>Technical training details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['technical_program']) ? ' pqpir-field--error' : ''; ?>"><label>Training program or trade</label><?php echo pqpir_select('technical_program', $options['technical_programs'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Specific specialization</label><input class="pqpir-input" name="technical_specialization" value="<?php echo s(pqpir_value($form, 'technical_specialization')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['technical_training_level']) ? ' pqpir-field--error' : ''; ?>"><label>Training level</label><?php echo pqpir_select('technical_training_level', $options['technical_training_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['technical_previous_experience']) ? ' pqpir-field--error' : ''; ?>"><label>Previous technical experience</label><?php echo pqpir_select('technical_previous_experience', $options['technical_experience_types'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Previous learning method</label><?php echo pqpir_select('technical_previous_learning_method', $options['technical_learning_methods'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Experience duration</label><?php echo pqpir_select('technical_experience_duration', $options['technical_experience_durations'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Current employment status</label><?php echo pqpir_select('technical_employment_status', $options['technical_employment_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Current employer or workshop</label><input class="pqpir-input" name="technical_employer_workshop" value="<?php echo s(pqpir_value($form, 'technical_employer_workshop')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['technical_training_goal']) ? ' pqpir-field--error' : ''; ?>"><label>Primary training goal</label><?php echo pqpir_select('technical_training_goal', $options['technical_training_goals'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Certification sought</label><input class="pqpir-input" name="technical_certification_sought" value="<?php echo s(pqpir_value($form, 'technical_certification_sought')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['technical_training_format']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred training format</label><?php echo pqpir_select('technical_training_format', $options['technical_training_formats'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Preferred training schedule</label><?php echo pqpir_select('technical_training_schedule', $options['technical_training_schedules'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['technical_tool_access']) ? ' pqpir-field--error' : ''; ?>"><label>Access to required tools or equipment</label><?php echo pqpir_select('technical_tool_access', $options['technical_tool_access_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Computer or digital skill level</label><?php echo pqpir_select('technical_digital_skill_level', $options['technical_digital_skill_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Safety training completed</label><?php echo pqpir_select('technical_safety_training', $options['technical_yes_no_unsure'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Protective equipment available</label><?php echo pqpir_select('technical_protective_equipment', $options['technical_protective_equipment_options'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpir-field"><label>Tools or equipment experience</label><textarea class="pqpir-input pqpir-textarea" name="technical_tools_experience"><?php echo s(pqpir_value($form, 'technical_tools_experience')); ?></textarea></div>
            <div class="pqpir-field"><label>Practical support or accessibility needs</label><textarea class="pqpir-input pqpir-textarea" name="technical_support_needs"><?php echo s(pqpir_value($form, 'technical_support_needs')); ?></textarea></div>
            <div class="pqpir-field"><label>Additional technical training notes</label><textarea class="pqpir-input pqpir-textarea" name="technical_notes"><?php echo s(pqpir_value($form, 'technical_notes')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($ishighereducation): ?>
            <h3>Higher education details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['higher_application_level']) ? ' pqpir-field--error' : ''; ?>"><label>Application level</label><?php echo pqpir_select('higher_application_level', $options['higher_application_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['higher_program_field']) ? ' pqpir-field--error' : ''; ?>"><label>Program or field of study</label><input class="pqpir-input" name="higher_program_field" value="<?php echo s(pqpir_value($form, 'higher_program_field')); ?>"><?php echo pqpir_error($errors, 'higher_program_field'); ?></div>
              <div class="pqpir-field"><label>Intended specialization</label><input class="pqpir-input" name="higher_specialization" value="<?php echo s(pqpir_value($form, 'higher_specialization')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['higher_highest_qualification']) ? ' pqpir-field--error' : ''; ?>"><label>Highest qualification completed</label><?php echo pqpir_select('higher_highest_qualification', $options['higher_qualification_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Previous institution</label><input class="pqpir-input" name="higher_previous_institution" value="<?php echo s(pqpir_value($form, 'higher_previous_institution')); ?>"></div>
              <div class="pqpir-field"><label>Qualification title</label><input class="pqpir-input" name="higher_qualification_title" value="<?php echo s(pqpir_value($form, 'higher_qualification_title')); ?>"></div>
              <div class="pqpir-field"><label>Graduation or expected completion year</label><input class="pqpir-input" name="higher_completion_year" type="number" min="1900" max="2100" value="<?php echo s(pqpir_value($form, 'higher_completion_year')); ?>"></div>
              <div class="pqpir-field"><label>Academic result</label><input class="pqpir-input" name="higher_academic_result" value="<?php echo s(pqpir_value($form, 'higher_academic_result')); ?>"></div>
              <div class="pqpir-field<?php echo isset($errors['higher_academic_status']) ? ' pqpir-field--error' : ''; ?>"><label>Current academic status</label><?php echo pqpir_select('higher_academic_status', $options['higher_academic_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Admission route</label><?php echo pqpir_select('higher_admission_route', $options['higher_admission_routes'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Transfer credits requested</label><?php echo pqpir_select('higher_transfer_credits', $options['higher_transfer_credit_options'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['higher_study_mode']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred study mode</label><?php echo pqpir_select('higher_study_mode', $options['higher_study_modes'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['higher_study_load']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred study load</label><?php echo pqpir_select('higher_study_load', $options['higher_study_loads'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Preferred intake or academic term</label><input class="pqpir-input" name="higher_preferred_intake" value="<?php echo s(pqpir_value($form, 'higher_preferred_intake')); ?>"></div>
              <div class="pqpir-field"><label>Funding method</label><?php echo pqpir_select('higher_funding_method', $options['higher_funding_methods'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field"><label>Scholarship or financial-aid interest</label><?php echo pqpir_select('higher_financial_aid_interest', $options['higher_financial_aid_options'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpir-field"><label>Research interest or proposed topic</label><textarea class="pqpir-input pqpir-textarea" name="higher_research_interest"><?php echo s(pqpir_value($form, 'higher_research_interest')); ?></textarea></div>
            <div class="pqpir-field"><label>Academic support or accessibility needs</label><textarea class="pqpir-input pqpir-textarea" name="higher_support_needs"><?php echo s(pqpir_value($form, 'higher_support_needs')); ?></textarea></div>
          <?php endif; ?>

          <?php if ($isislamicstudies): ?>
            <h3>Islamic studies details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['islamic_program_interest']) ? ' pqpir-field--error' : ''; ?>"><label>Islamic program interest</label><?php echo pqpir_select('islamic_program_interest', $options['islamic_program_interests'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['quran_reading_level']) ? ' pqpir-field--error' : ''; ?>"><label>Quran reading level</label><?php echo pqpir_select('quran_reading_level', $options['quran_reading_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['tajweed_level']) ? ' pqpir-field--error' : ''; ?>"><label>Tajweed level</label><?php echo pqpir_select('tajweed_level', $options['tajweed_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['memorization_status']) ? ' pqpir-field--error' : ''; ?>"><label>Memorization status</label><?php echo pqpir_select('memorization_status', $options['memorization_statuses'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['memorized_portion']) ? ' pqpir-field--error' : ''; ?>"><label>Memorized portion</label><input class="pqpir-input" name="memorized_portion" value="<?php echo s(pqpir_value($form, 'memorized_portion')); ?>"><?php echo pqpir_error($errors, 'memorized_portion'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['arabic_reading_ability']) ? ' pqpir-field--error' : ''; ?>"><label>Arabic reading ability</label><?php echo pqpir_select('arabic_reading_ability', $options['arabic_reading_abilities'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['islamic_learning_goal']) ? ' pqpir-field--error' : ''; ?>"><label>Islamic learning goal</label><input class="pqpir-input" name="islamic_learning_goal" value="<?php echo s(pqpir_value($form, 'islamic_learning_goal')); ?>"><?php echo pqpir_error($errors, 'islamic_learning_goal'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['previous_learning_method']) ? ' pqpir-field--error' : ''; ?>"><label>Previous learning method</label><?php echo pqpir_select('previous_learning_method', $options['previous_learning_methods'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['tafsir_level']) ? ' pqpir-field--error' : ''; ?>"><label>Tafsir level</label><?php echo pqpir_select('tafsir_level', $options['tafsir_levels'] ?? [], $form, $errors); ?></div>
            </div>
            <div class="pqpir-field<?php echo isset($errors['prior_islamic_studies']) ? ' pqpir-field--error' : ''; ?>"><label>Prior Islamic studies</label><textarea class="pqpir-input pqpir-textarea" name="prior_islamic_studies"><?php echo s(pqpir_value($form, 'prior_islamic_studies')); ?></textarea><?php echo pqpir_error($errors, 'prior_islamic_studies'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['islamic_notes']) ? ' pqpir-field--error' : ''; ?>"><label>Islamic studies notes</label><textarea class="pqpir-input pqpir-textarea" name="islamic_notes"><?php echo s(pqpir_value($form, 'islamic_notes')); ?></textarea><?php echo pqpir_error($errors, 'islamic_notes'); ?></div>
          <?php endif; ?>

          <?php if ($ischristianstudies): ?>
            <h3>Christian studies details</h3>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['christian_program_interest']) ? ' pqpir-field--error' : ''; ?>"><label>Christian program interest</label><?php echo pqpir_select('christian_program_interest', $options['christian_program_interests'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['bible_reading_level']) ? ' pqpir-field--error' : ''; ?>"><label>Bible reading level</label><?php echo pqpir_select('bible_reading_level', $options['bible_reading_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['bible_knowledge_level']) ? ' pqpir-field--error' : ''; ?>"><label>Bible knowledge level</label><?php echo pqpir_select('bible_knowledge_level', $options['bible_knowledge_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['christian_studies_level']) ? ' pqpir-field--error' : ''; ?>"><label>Christian studies level</label><?php echo pqpir_select('christian_studies_level', $options['christian_studies_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['christian_previous_learning_method']) ? ' pqpir-field--error' : ''; ?>"><label>Previous learning method</label><?php echo pqpir_select('christian_previous_learning_method', $options['christian_previous_learning_methods'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['christian_learning_goal']) ? ' pqpir-field--error' : ''; ?>"><label>Primary learning goal</label><input class="pqpir-input" name="christian_learning_goal" value="<?php echo s(pqpir_value($form, 'christian_learning_goal')); ?>"><?php echo pqpir_error($errors, 'christian_learning_goal'); ?></div>
            </div>
            <div class="pqpir-field<?php echo isset($errors['prior_christian_studies']) ? ' pqpir-field--error' : ''; ?>"><label>Previous Christian studies</label><textarea class="pqpir-input pqpir-textarea" name="prior_christian_studies"><?php echo s(pqpir_value($form, 'prior_christian_studies')); ?></textarea><?php echo pqpir_error($errors, 'prior_christian_studies'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['christian_notes']) ? ' pqpir-field--error' : ''; ?>"><label>Additional Christian studies notes</label><textarea class="pqpir-input pqpir-textarea" name="christian_notes"><?php echo s(pqpir_value($form, 'christian_notes')); ?></textarea><?php echo pqpir_error($errors, 'christian_notes'); ?></div>
          <?php endif; ?>

          <h3>Program and learning preferences</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['course_type']) ? ' pqpir-field--error' : ''; ?>"><label>Course</label><?php echo pqpir_select('course_type', $options['course_types'] ?? [], $form, $errors); ?><?php if (empty($options['course_types'])): ?><div class="pqpir-muted">No public courses are available for this institution yet.</div><?php endif; ?></div>
            <div class="pqpir-field<?php echo isset($errors['country']) ? ' pqpir-field--error' : ''; ?>"><label>Country</label><?php echo pqpir_select('country', $options['countries'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['city']) ? ' pqpir-field--error' : ''; ?>"><label>City</label><?php echo pqpir_select('city', $options['cities'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field pqpir-city-other<?php echo isset($errors['city_other']) ? ' pqpir-field--error' : ''; ?>"><label>City not listed</label><input class="pqpir-input" name="city_other" value="<?php echo s(pqpir_value($form, 'city_other')); ?>"><?php echo pqpir_error($errors, 'city_other'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['primary_language']) ? ' pqpir-field--error' : ''; ?>"><label>Primary language</label><?php echo pqpir_select('primary_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['preferred_teaching_language']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred teaching language</label><?php echo pqpir_select('preferred_teaching_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field"><label>Other languages</label><?php echo pqpir_multi_select('other_languages', $options['other_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['current_level']) ? ' pqpir-field--error' : ''; ?>"><label>Placement level</label><?php echo pqpir_select('current_level', pqpir_placement_level_options($options), $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['tajweed_sub_level']) ? ' pqpir-field--error' : ''; ?>"><label>Tajweed sub-level</label><?php echo pqpir_select('tajweed_sub_level', $options['tajweed_sub_levels'] ?? [], $form, $errors, 'Select when Level 3'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['learning_base']) ? ' pqpir-field--error' : ''; ?>"><label>Learning background</label><?php echo pqpir_select('learning_base', $options['learning_bases'] ?? [], $form, $errors); ?></div>
          </div>

          <h3>Preferred weekly live-session number of sessions and hours</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['session_count']) ? ' pqpir-field--error' : ''; ?>">
              <label>Number of sessions</label>
              <?php echo pqpir_select('session_count', $options['session_counts'] ?? [], $form, $errors, 'Select'); ?>
            </div>
            <div class="pqpir-field<?php echo isset($errors['timezone']) ? ' pqpir-field--error' : ''; ?>">
              <label>Time zone</label>
              <?php echo pqpir_select('timezone', $options['timezones'] ?? [], $form, $errors); ?>
            </div>
          </div>
          <div class="pqpir-field<?php echo isset($errors['slots']) ? ' pqpir-field--error' : ''; ?>">
            <label>Select all recurring times that could work</label>
            <div class="pqpir-calendar">
              <table>
                <thead><tr><th>Day</th><?php foreach (($options['availability_time_windows'] ?? []) as $hour => $label): ?><th><?php echo s((string)$label); ?></th><?php endforeach; ?></tr></thead>
                <tbody>
                  <?php foreach (($options['availability_days'] ?? []) as $day => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($options['availability_time_windows'] ?? []) as $hour => $hourlabel): $slot = (string)$day . '|' . (string)$hour; ?>
                        <td><label class="pqpir-slot" title="<?php echo s((string)$daylabel . ' ' . (string)$hourlabel); ?>"><input type="checkbox" name="slots[]" value="<?php echo s($slot); ?>"<?php echo in_array($slot, $form['slots'], true) ? ' checked' : ''; ?>></label></td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqpir_error($errors, 'slots'); ?>
          </div>

          <h3>Notes and consent</h3>
          <div class="pqpir-field"><label>Parent preferences</label><textarea class="pqpir-input pqpir-textarea" name="parent_preferences"><?php echo s(pqpir_value($form, 'parent_preferences')); ?></textarea></div>
          <label class="pqpir-checkrow"><input type="checkbox" name="parent_email_enabled" value="1"<?php echo pqpir_checked($form, 'parent_email_enabled'); ?>><span>Send parent email notifications when the parent contact is a valid email address.</span></label>
          <label class="pqpir-checkrow"><input type="checkbox" name="live_class_consent" value="1"<?php echo pqpir_checked($form, 'live_class_consent'); ?>><span>Student or parent/guardian consents to live interactive classes.</span></label><?php echo pqpir_error($errors, 'live_class_consent'); ?>
          <label class="pqpir-checkrow"><input type="checkbox" name="recording_consent" value="1"<?php echo pqpir_checked($form, 'recording_consent'); ?>><span>Student or parent/guardian consents to class recording when recording policy allows.</span></label>
          <div class="pqpir-field"><label>Consent notes/comment</label><textarea class="pqpir-input pqpir-textarea" name="consent_notes"><?php echo s(pqpir_value($form, 'consent_notes')); ?></textarea></div>

          <button class="pqpir-btn" type="submit">Submit live-class request</button>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var countryTimezones = <?php echo json_encode($options['country_timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var timezoneLabels = <?php echo json_encode($options['timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var countryCities = <?php echo json_encode($options['country_cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var cityLabels = <?php echo json_encode($options['cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var country = document.querySelector('select[name="country"]');
  var timezone = document.querySelector('select[name="timezone"]');
  var city = document.querySelector('select[name="city"]');
  var cityOther = document.querySelector('.pqpir-city-other');
  var parentRelationship = document.querySelector('select[name="parent_relationship"]');
  var parentRelationshipOther = document.querySelector('.pqpir-parent-relationship-other');
  if (!country || !timezone || !city) {
    return;
  }
  function option(value, label, selected) {
    var item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    if (selected) {
      item.selected = true;
    }
    return item;
  }
  function refreshTimezones() {
    var selected = timezone.value;
    var zones = countryTimezones[country.value] || Object.keys(timezoneLabels);
    timezone.innerHTML = '';
    timezone.appendChild(option('', 'Select', selected === ''));
    zones.forEach(function(zone) {
      timezone.appendChild(option(zone, timezoneLabels[zone] || zone, zone === selected));
    });
    if (selected && zones.indexOf(selected) === -1) {
      timezone.value = zones.length ? zones[0] : '';
    }
  }
  function refreshCities() {
    var selected = city.value;
    var cities = countryCities[country.value] ? Object.keys(countryCities[country.value]) : Object.keys(cityLabels);
    if (cities.indexOf('Other') === -1) {
      cities.push('Other');
    }
    city.innerHTML = '';
    city.appendChild(option('', 'Select', selected === ''));
    cities.forEach(function(cityname) {
      var label = (countryCities[country.value] && countryCities[country.value][cityname]) || cityLabels[cityname] || cityname;
      city.appendChild(option(cityname, label, cityname === selected));
    });
    if (selected && cities.indexOf(selected) === -1) {
      city.value = 'Other';
    }
    if (cityOther) {
      cityOther.classList.toggle('pqpir-city-other--visible', city.value === 'Other');
    }
  }
  function refreshParentRelationship() {
    if (parentRelationshipOther && parentRelationship) {
      parentRelationshipOther.style.display = parentRelationship.value === 'other' ? 'grid' : 'none';
    }
  }
  country.addEventListener('change', refreshTimezones);
  country.addEventListener('change', refreshCities);
  city.addEventListener('change', refreshCities);
  if (parentRelationship) {
    parentRelationship.addEventListener('change', refreshParentRelationship);
  }
  refreshTimezones();
  refreshCities();
  refreshParentRelationship();
})();
</script>
<?php
echo $OUTPUT->footer();

