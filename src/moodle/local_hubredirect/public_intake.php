<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/institutionlib.php');

require_once(__DIR__ . '/public_pageslib.php');

$options = require(__DIR__ . '/student_intake_config.php');

const PQPIR_MIN_FORM_SECONDS = 4;
const PQPIR_MAX_FORM_SECONDS = 7200;
const PQPIR_SESSION_COOLDOWN_SECONDS = 60;
const PQPIR_CONTACT_WINDOW_SECONDS = 3600;
const PQPIR_CONTACT_WINDOW_LIMIT = 3;
// Consumer slug of the school shown first in "Which school is this for?" and
// preselected when the visitor has not chosen one.
const PQPIR_DEFAULT_SCHOOL_SLUG = 'ehel-k12';

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

function pqpir_public_header(stdClass $consumercontext): string {
    $brandname = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
    if ($brandname === '') {
        $brandname = 'EduPlatform';
    }

    // No nav links here on purpose -- this is the enrollment form itself, so
    // the header stays branding-only (logo + name) to keep the visitor
    // focused on completing the form instead of navigating away mid-flow.
    // Not a link to consumer_landing.php: that page now requires login, and
    // this form is filled out by anonymous prospective families with no account.
    // Show the institution's own logo when one is configured, falling back to
    // the initial tile for consumers that have not uploaded one yet.
    $brandlogo = trim((string)($consumercontext->logourl ?? ''));

    $html = '<span class="pqpir-navbrand">';
    if ($brandlogo !== '') {
        $html .= '<span class="pqpir-navmark pqpir-navmark--img">'
            . '<img src="' . s($brandlogo) . '" alt="' . s($brandname) . '"></span>';
    } else {
        $html .= '<span class="pqpir-navmark">' . s(pqpir_consumer_initial($brandname)) . '</span>';
    }
    $html .= '<span class="pqpir-navname">' . s($brandname) . '</span>';
    $html .= '</span>';

    return $html;
}

/**
 * Move the K-12 school to the head of the child-school picker, leaving the rest
 * in their linked order. It is the school the public intake link is sent to
 * families for, so it is both first and the preselected default.
 *
 * Returns the list untouched, losing no school, when the slug matches nothing.
 * Note what that means for the caller: the preselected default then falls back
 * to whichever school is linked first, so re-slugging the K-12 consumer would
 * quietly start filing family requests against another school. The slug is the
 * thing to keep stable, not this list.
 */
function pqpir_default_school_first(array $schools): array {
    $preferred = [];
    $rest = [];
    foreach ($schools as $school) {
        if ((string)($school->consumerslug ?? '') === PQPIR_DEFAULT_SCHOOL_SLUG) {
            $preferred[] = $school;
        } else {
            $rest[] = $school;
        }
    }
    return array_merge($preferred, $rest);
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
    // No 'Grade level' alias for course_type any more: primary education does not
    // render or validate that field, so the only reachable label is 'Course'.
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
        'district' => 'District',
        'division' => 'Division',
        'estate' => 'Estate',
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

/**
 * One line of plain-language guidance, rendered between a field's label and its
 * control. Written for a parent filling the form on a phone with no help from
 * us, so it says what to type rather than restating the label.
 *
 * The consent checkboxes nest their hint inside the row's <span>, which may hold
 * phrasing content only -- so those pass 'span' and the CSS makes it a block. A
 * <div> there is invalid markup even though every browser renders it anyway.
 */
function pqpir_hint(string $text, string $tag = 'div'): string {
    $tag = $tag === 'span' ? 'span' : 'div';
    return '<' . $tag . ' class="pqpir-hint">' . s($text) . '</' . $tag . '>';
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
    return $name . ' (' . pqh_account_no_label($teacher) . ', User ID ' . (int)$teacher->userid . ')';
}

function pqpir_parent_guardian_fields(array $form, array $errors, array $options): string {
    ob_start();
    ?>
            <div class="pqpir-grid">
              <div class="pqpir-field<?php echo isset($errors['parent_name']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian name</label><?php echo pqpir_hint('Your full name, as the parent or guardian we should deal with about this student.'); ?><input class="pqpir-input" name="parent_name" value="<?php echo s(pqpir_value($form, 'parent_name')); ?>"><?php echo pqpir_error($errors, 'parent_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_relationship']) ? ' pqpir-field--error' : ''; ?>"><label>Relationship to student</label><?php echo pqpir_hint('How you are related to the student. Pick Other if none of Father, Mother or Guardian fits.'); ?><?php echo pqpir_select('parent_relationship', $options['parent_relationships'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field pqpir-parent-relationship-other<?php echo isset($errors['parent_relationship_other']) ? ' pqpir-field--error' : ''; ?>"><label>Describe relationship</label><?php echo pqpir_hint('You only see this box because you chose Other. Tell us in a few words, e.g. grandmother, uncle, foster carer.'); ?><input class="pqpir-input" name="parent_relationship_other" value="<?php echo s(pqpir_value($form, 'parent_relationship_other')); ?>"><?php echo pqpir_error($errors, 'parent_relationship_other'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_email']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian email or phone</label><?php echo pqpir_hint('An email address is best — this is where the enrolment decision and the student login details are sent. A phone number is accepted if you have no email.'); ?><input class="pqpir-input" name="parent_email" value="<?php echo s(pqpir_value($form, 'parent_email')); ?>"><?php echo pqpir_error($errors, 'parent_email'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['parent_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Parent/guardian phone / WhatsApp</label><?php echo pqpir_hint('The number to reach you on day to day, ideally one that has WhatsApp. Include the country code, e.g. +254 712 345 678.'); ?><input class="pqpir-input" name="parent_phone" value="<?php echo s(pqpir_value($form, 'parent_phone')); ?>"><?php echo pqpir_error($errors, 'parent_phone'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['emergency_contact_name']) ? ' pqpir-field--error' : ''; ?>"><label>Emergency contact name</label><?php echo pqpir_hint('Someone else we can call if we cannot reach you — a relative, neighbour or family friend who knows the student.'); ?><input class="pqpir-input" name="emergency_contact_name" value="<?php echo s(pqpir_value($form, 'emergency_contact_name')); ?>"><?php echo pqpir_error($errors, 'emergency_contact_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['emergency_contact_phone']) ? ' pqpir-field--error' : ''; ?>"><label>Emergency contact phone</label><?php echo pqpir_hint('Phone number for the emergency contact above, with the country code. Best if it is a different number from your own.'); ?><input class="pqpir-input" name="emergency_contact_phone" value="<?php echo s(pqpir_value($form, 'emergency_contact_phone')); ?>"><?php echo pqpir_error($errors, 'emergency_contact_phone'); ?></div>
            </div>
    <?php
    return (string)ob_get_clean();
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

// On a parent domain (e.g. the Ehel Academy umbrella site) that owns child
// schools, the request has to be scoped to one actual school before the rest
// of the form (course offerings, institution-specific fields) can be built.
$domainbasecontext = pqh_current_consumer_context();
$childschoolchoices = pqh_org_group_child_schools((int)$domainbasecontext->consumerid);
// The K-12 school leads the list and is preselected: it is the one the intake
// link is sent to families for, and every other school was a scroll past it.
// Ordered here rather than in pqh_org_group_child_schools(), whose gm.id order
// is the link order and is also what public_teacher_intake.php renders.
// Matched on the consumer slug, not the workspace id, so restoring the
// workspace elsewhere cannot silently move the default to another school.
$childschoolchoices = pqpir_default_school_first($childschoolchoices);
$selectedchildworkspaceid = 0;
if ($childschoolchoices) {
    foreach ($childschoolchoices as $childschool) {
        if ((int)$childschool->workspaceid > 0 && (int)$childschool->workspaceid === (int)$consumercontext->workspaceid) {
            $selectedchildworkspaceid = (int)$consumercontext->workspaceid;
            break;
        }
    }
}
// Nothing chosen yet: adopt the school at the head of the list rather than
// holding the form back. The context has to move with the radio button --
// leaving it on the umbrella consumer would show a ticked school while
// building the form, and filing the request, against a different one.
if ($childschoolchoices && $selectedchildworkspaceid <= 0) {
    $defaultschool = $childschoolchoices[0];
    $defaultcontext = pqh_consumer_context_by_workspace((int)$defaultschool->workspaceid);
    if ($defaultcontext) {
        $consumercontext = $defaultcontext;
        $selectedchildworkspaceid = (int)$defaultschool->workspaceid;
    }
}
$needsschoolselection = $childschoolchoices && $selectedchildworkspaceid <= 0;
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
// Who is filling this in. Parent is preselected for a K-12 intake only, which a
// parent fills in by definition: the link goes to families, and the school
// requires the parent block whatever this says, so the default costs that
// school nothing. Every other institution type keeps the question genuinely
// unanswered -- defaulting there would have an adult learner who never touched
// the radio asked for a parent/guardian instead of their own email.
//
// Anything that is not one of the two known values is normalised the same way,
// so a junk respondent_role cannot reach the branches below. All of it lives
// here rather than beside the other request params because $isprimaryeducation
// is not resolved until now.
$respondentrole = optional_param('respondent_role', '', PARAM_ALPHA);
if (!in_array($respondentrole, ['parent', 'student'], true)) {
    $respondentrole = $isprimaryeducation ? 'parent' : '';
}
$overeighteenanswer = $respondentrole === 'student' ? optional_param('over18', '', PARAM_ALPHA) : '';
// Parent/guardian is required and shown first when a parent is filling the form
// or the student confirmed being under 18; it is skipped entirely once the
// student confirms being an adult. A K-12 intake always opens with the block,
// whatever the answer.
$parentguardianfirst = $isprimaryeducation
    || $respondentrole === 'parent'
    || ($respondentrole === 'student' && $overeighteenanswer === 'no');
$parentguardianrequired = !($respondentrole === 'student' && $overeighteenanswer === 'yes');
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
    'district' => '',
    'division' => '',
    'estate' => '',
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

if ($ready && !$needsschoolselection && $_SERVER['REQUEST_METHOD'] === 'POST') {
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
        'district' => pqpir_limit_text(pqpir_trim('district'), 120),
        'division' => pqpir_limit_text(pqpir_trim('division'), 120),
        'estate' => pqpir_limit_text(pqpir_trim('estate'), 120),
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

    $postedrespondentrole = optional_param('respondent_role', '', PARAM_ALPHA);
    $postedover18 = optional_param('over18', '', PARAM_ALPHA);
    $isadultstudent = (int)$form['age_years'] >= 18;
    if ($postedrespondentrole === 'parent') {
        $isadultstudent = false;
    } else if ($postedrespondentrole === 'student') {
        if ($postedover18 === 'yes') {
            $isadultstudent = true;
        } else if ($postedover18 === 'no') {
            $isadultstudent = false;
        }
    }

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

    // Middle name is deliberately absent: plenty of families do not have one, and
    // requiring it forced them to invent a placeholder to get past this step.
    // public_intake_data.php drops it too -- the two run in parallel over the same
    // form and must agree on what blocks a submission.
    $requiredfields = [
        'student_firstname' => 'Please enter the student first name.',
        'student_lastname' => 'Please enter the student last name.',
        'country' => 'Please select the country.',
        'city' => 'Please select the city.',
        'timezone' => 'Please select the time zone.',
        'primary_language' => 'Please select the primary language.',
        'preferred_teaching_language' => 'Please select the preferred teaching language.',
        'current_level' => 'Please select the placement level.',
        'learning_base' => 'Please select the learning background.',
        'session_count' => 'Please select the number of weekly sessions.',
    ];
    if ($isprimaryeducation) {
        // A K-12 school places by grade, not by a Quran placement level, and the
        // form no longer asks for either of these -- so they cannot be required.
        unset($requiredfields['current_level'], $requiredfields['learning_base']);
    }
    foreach ($requiredfields as $field => $errormessage) {
        if (($field === 'age_years' && (int)$form[$field] <= 0) || ($field === 'session_count' && ((int)$form[$field] < 1 || (int)$form[$field] > 5)) || (!in_array($field, ['age_years', 'session_count'], true) && pqpir_value($form, $field) === '')) {
            $errors[$field] = $errormessage;
        }
    }
    // Primary education asks for the current grade/year instead of a course or a
    // grade-applied-for selector, so course_type is left empty for that type --
    // the same empty value create_ehel_k12_qa_accounts.php writes deliberately.
    if (!$isprimaryeducation && pqpir_value($form, 'course_type') === '') {
        $errors['course_type'] = 'Please select the course.';
    }
    if ($isprimaryeducation) {
        // Date of birth is deliberately absent from this list and from the form.
        // Age carries the placement check on its own; asking a family to fetch a
        // birth certificate before they can submit cost more than it returned.
        // The column and every read of it stay, so records that already hold a
        // date keep it and nothing downstream has to change.
foreach ([
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
    if (!$isprimaryeducation && !array_key_exists(pqpir_value($form, 'course_type'), $options['course_types'] ?? [])) {
        $errors['course_type'] = 'Please select a valid course.';
    }
    if (!array_key_exists(pqpir_value($form, 'student_access_type'), $options['student_access_types'] ?? [])) {
        $errors['student_access_type'] = 'Please select Managed Student or Unmanaged Student.';
    }
    if (!$isprimaryeducation && !array_key_exists(pqpir_value($form, 'current_level'), $options['current_levels'] ?? [])) {
        $errors['current_level'] = 'Please select a valid placement level.';
    }
    if (!array_key_exists(pqpir_value($form, 'preferred_teaching_language'), $options['primary_languages'] ?? [])) {
        $errors['preferred_teaching_language'] = 'Please select a valid preferred teaching language.';
    }
    if (!$isprimaryeducation && pqpir_value($form, 'current_level') === 'level_3' && !array_key_exists(pqpir_value($form, 'tajweed_sub_level'), $options['tajweed_sub_levels'] ?? [])) {
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
            // Collapse the gap an absent middle name leaves: it is optional now, so
            // "Ayaan  Hassan" with a double space is a reachable display name.
            $displayname = (string)preg_replace('/\s+/u', ' ', trim(pqpir_value($form, 'student_firstname') . ' ' . pqpir_value($form, 'student_middle_name') . ' ' . pqpir_value($form, 'student_lastname')));
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
            'district',
            'division',
            'estate',
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
        // The receipt. Sent after the row is committed, so a mail failure can
        // never cost the family their submission -- and deliberately not gated on
        // parent_email_enabled, which governs ongoing notices rather than an
        // acknowledgement of what they just sent us.
        //
        // The parent contact field accepts "email or phone" by design, so this
        // returns false for every parent who gave a number. That is expected, not
        // an error; the audit records which, so the team can see who needs
        // contacting another way.
        $receiptsent = pqhi_send_intake_receipt(
            $consumercontext,
            pqpir_value($form, 'parent_email'),
            pqpir_value($form, 'parent_name'),
            trim(pqpir_value($form, 'student_firstname') . ' ' . pqpir_value($form, 'student_lastname')),
            (int)$requestid,
            $now,
            pqhi_intake_language(pqpir_value($form, 'primary_language'))
        );
        pqpir_security_audit('public_intake_submitted', [
            'requestid' => (int)$requestid,
            'consumerid' => (int)$consumercontext->consumerid,
            'consumerslug' => (string)$consumercontext->consumerslug,
            'receipt_email_sent' => $receiptsent ? 1 : 0,
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
body.pqh-public-intake-page header,body.pqh-public-intake-page header#page-header,body.pqh-public-intake-page header.navbar,body.pqh-public-intake-page .navbar,body.pqh-public-intake-page .navbar.fixed-top,body.pqh-public-intake-page .primary-navigation,body.pqh-public-intake-page .secondary-navigation,body.pqh-public-intake-page .moremenu,body.pqh-public-intake-page footer,body.pqh-public-intake-page nav.navbar,body.pqh-public-intake-page #page-header,body.pqh-public-intake-page #page-footer,body.pqh-public-intake-page .drawer,body.pqh-public-intake-page .drawer-toggles,body.pqh-public-intake-page .block-region,body.pqh-public-intake-page [data-region="drawer"],body.pqh-public-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-public-intake-page{padding-top:0!important}
body.pqh-public-intake-page #page-wrapper,body.pqh-public-intake-page #page,body.pqh-public-intake-page #page-content,body.pqh-public-intake-page #region-main,body.pqh-public-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqpir-shell{--pq-blue:#2f6f4e;--pq-blue-dark:#1f5138;--pq-blue-soft:#e4efe6;--pq-ink:#1c2b22;--pq-ink-2:#33463a;--pq-muted:#5c7267;--pq-line:#e3dcc8;--pq-line-strong:#c9bd9d;--pq-paper:#f7f4ec;--pq-card:#fffdf8;--pq-green:#2f6f4e;--pq-gold:#a5741e;--pq-gold-soft:#f4e6c8;--pq-hero-bg:#dbeafe;--pq-red:#9a3d2d;--pq-label:#2f5fad;--pq-serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--pq-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;--pq-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;position:fixed;inset:0;z-index:2147483000;overflow:auto;min-height:100vh;padding:0 0 64px;background:var(--pq-paper);font-family:var(--pq-sans);color:var(--pq-ink);-webkit-font-smoothing:antialiased}
@media(prefers-color-scheme:dark){.pqpir-shell{--pq-blue:#7fc79e;--pq-blue-dark:#63a883;--pq-blue-soft:#1c3327;--pq-ink:#e8e3d3;--pq-ink-2:#cdd7c9;--pq-muted:#9fb0a4;--pq-line:#2a3a30;--pq-line-strong:#3a4c40;--pq-paper:#121d17;--pq-card:#16241c;--pq-green:#7fc79e;--pq-gold:#dcaa54;--pq-gold-soft:#3a301a;--pq-hero-bg:#1c2e47;--pq-red:#e08876;--pq-label:#8ab4e8}}
.pqpir-wrap{max-width:920px;margin:0 auto;padding:18px 18px 0}.pqpir-hero,.pqpir-panel{background:var(--pq-card);border:1px solid var(--pq-line);border-radius:14px;box-shadow:0 2px 10px rgba(22,38,30,.06)}.pqpir-hero{padding:28px 32px;margin-bottom:16px}.pqpir-brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:10px;color:var(--pq-blue);font-family:var(--pq-mono);font-size:11.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase}.pqpir-brand-mark{display:none}.pqpir-title{margin:0;font-family:var(--pq-serif);font-size:clamp(28px,4vw,38px);line-height:1.12;font-weight:600;color:var(--pq-ink);letter-spacing:-.01em}.pqpir-sub{margin:8px 0 0;color:var(--pq-muted);font-size:14.5px;font-weight:400;line-height:1.6}.pqpir-panel{padding:26px;margin-bottom:16px;overflow:hidden}.pqpir-panel h2{margin:0 0 18px;font-size:22px;line-height:1.2;font-weight:700;color:var(--pq-ink)}.pqpir-panel h3{display:block;margin:8px 0 24px;padding:0 0 16px;border-bottom:2px solid var(--pq-line-strong);background:none;color:var(--pq-ink);font-family:var(--pq-serif);font-size:24px;line-height:1.2;font-weight:600;letter-spacing:-.01em}.pqpir-panel h3:first-of-type{margin-top:0}.pqpir-panel h3 .pqpir-muted{display:block;margin-top:6px;font-family:var(--pq-sans);font-size:13px;font-weight:600;text-transform:none;letter-spacing:0}.pqpir-muted{color:var(--pq-muted);font-size:12px}.pqpir-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 20px}.pqpir-field{display:grid;gap:6px;margin-bottom:16px;align-content:start;align-self:start}.pqpir-field label{font-size:13px;font-weight:600;color:var(--pq-label)}.pqpir-hint{margin:-1px 0 1px;color:var(--pq-muted);font-size:12.5px;font-weight:400;line-height:1.45}.pqpir-checkrow .pqpir-hint{display:block;margin:3px 0 0;font-weight:400}.pqpir-req{color:var(--pq-red);font-weight:700}.pqpir-pref{padding:12px 15px;margin:0 0 16px;border:1px solid rgba(47,158,92,.25);border-radius:8px;background:#eefaf1;color:#1d6b3c;font-weight:600;font-size:13.5px}.pqpir-city-other{display:none}.pqpir-city-other--visible{display:grid}.pqpir-input{width:100%;min-height:44px;border:1px solid var(--pq-line-strong);border-radius:8px;padding:10px 13px;font:400 14.5px/1.3 var(--pq-sans);background:var(--pq-card);color:var(--pq-ink);transition:border-color .15s ease,box-shadow .15s ease}.pqpir-input::placeholder{color:#a3adb8}.pqpir-input:focus{outline:0;border-color:var(--pq-blue);box-shadow:0 0 0 3px rgba(47,111,78,.15)}.pqpir-multi{min-height:120px}.pqpir-textarea{min-height:90px;line-height:1.5}.pqpir-error{font-size:12px;font-weight:600;color:var(--pq-red)}.pqpir-field--error .pqpir-input,.pqpir-field--error .pqpir-calendar{border-color:var(--pq-red);background:#fef6f5}.pqpir-alert{padding:13px 18px;border-radius:8px;margin-bottom:14px;font-weight:600;font-size:14px;border:1px solid transparent}.pqpir-alert ul{margin:8px 0 0;padding-left:22px}.pqpir-alert--ok{background:#eefaf1;border-color:#bfe8cb;color:#1d6b3c}.pqpir-alert--bad{background:#fdeeec;border-color:#f3c3bc;color:#a3382a}.pqpir-calendar{overflow:auto;border:1px solid var(--pq-line);border-radius:8px;background:var(--pq-card)}.pqpir-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:850px}.pqpir-calendar th,.pqpir-calendar td{border-bottom:1px solid var(--pq-line);border-right:1px solid var(--pq-line);padding:10px;text-align:center;font-weight:600}.pqpir-calendar th{background:var(--pq-blue-soft);color:var(--pq-blue-dark);font-size:12px}.pqpir-calendar td:first-child{text-align:left;color:var(--pq-ink);background:var(--pq-paper)}.pqpir-calendar tr:nth-child(even) td:first-child{background:#eef1f5}.pqpir-slot{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:7px;background:var(--pq-blue-soft);border:1px solid var(--pq-line-strong)}.pqpir-slot input{width:17px;height:17px;accent-color:var(--pq-blue)}.pqpir-checkrow{display:flex;gap:10px;align-items:flex-start;margin:10px 0 13px;font-size:13.5px;font-weight:500;color:var(--pq-ink)}.pqpir-checkrow input{width:18px;height:18px;accent-color:var(--pq-blue)}.pqpir-level-guide{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:4px 0 14px}.pqpir-level-card{padding:12px;border:1px solid var(--pq-line);border-radius:8px;background:var(--pq-paper)}.pqpir-level-card strong{display:block;margin-bottom:5px;color:var(--pq-ink);font-size:13px}.pqpir-level-card p{margin:4px 0;color:var(--pq-muted);font-size:12px;font-weight:400;line-height:1.4}.pqpir-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 24px;border:0;border-radius:8px;background:var(--pq-blue);color:#fff!important;text-decoration:none;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(47,111,78,.3)}.pqpir-btn:hover{background:var(--pq-blue-dark)}.pqpir-btn[hidden]{display:none!important}.pqpir-btn-ghost{background:transparent;color:var(--pq-ink)!important;border:1px solid var(--pq-line-strong);box-shadow:none}.pqpir-btn-ghost:hover{background:var(--pq-paper)}.pqpir-empty{padding:18px;border:1px dashed var(--pq-line-strong);border-radius:8px;color:var(--pq-muted);font-weight:500;background:var(--pq-paper)}.pqpir-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
@media(max-width:760px){.pqpir-grid,.pqpir-level-guide{grid-template-columns:1fr}.pqpir-title{font-size:24px}.pqpir-wrap{padding:12px 10px 0}.pqpir-hero{padding:20px 18px}.pqpir-panel{padding:18px}.pqpir-panel h3{font-size:19px;margin:4px 0 18px;padding:0 0 12px}.pqpir-sub{font-size:14px}}
.pqpir-navbrand{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--pq-ink)!important;min-width:0;margin-bottom:16px}.pqpir-navmark{width:40px;height:40px;border-radius:8px;background:var(--pq-blue);color:#fff;display:grid;place-items:center;font-size:16px;font-weight:700;flex:0 0 auto}.pqpir-navmark--img{width:58px;height:58px;padding:0;background:none;border:0;border-radius:0}.pqpir-navmark--img img{display:block;width:100%;height:100%;object-fit:contain}.pqpir-navname{font-size:17px;font-weight:700;line-height:1.1;white-space:normal}
<?php echo pqh_dashboard_header_css(); ?>
.pqpir-shell .pqh-workspace-top{background:var(--pq-hero-bg)!important;border:1px solid var(--pq-line)!important;box-shadow:0 2px 10px rgba(22,38,30,.06)!important;padding:28px 32px!important;border-radius:14px!important}
.pqpir-shell .pqh-workspace-title{color:var(--pq-ink)!important;font-size:28px!important;font-weight:700!important;letter-spacing:0!important;text-shadow:none!important}
.pqpir-shell .pqh-workspace-sub{color:var(--pq-muted)!important;font-size:14.5px!important;font-weight:400!important;opacity:1!important}
.pqpir-school-pick-form{display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}.pqpir-school-pick-option{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px;color:var(--pq-ink);cursor:pointer}.pqpir-school-pick-option input{width:18px;height:18px;accent-color:var(--pq-blue)}.pqpir-school-pick-hint{margin:10px 0 0}.pqpir-school-pick-age{margin-top:16px;padding-top:16px;border-top:1px solid var(--pq-line)}.pqpir-school-pick-question{font-weight:600;font-size:14.5px;color:var(--pq-ink)}

/* Multi-page horizontal wizard */
.pqpir-wizard{padding:0;overflow:hidden}
.pqpir-wizard-inner{padding:26px 30px 0}
.pqpir-progress{margin-bottom:22px}
.pqpir-progress-label{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px 16px;font-family:var(--pq-mono);font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--pq-blue);margin-bottom:10px}
.pqpir-progress-label span:last-child{color:var(--pq-muted);letter-spacing:.03em}
.pqpir-progress-track{height:4px;border-radius:999px;background:var(--pq-line);overflow:hidden}
.pqpir-progress-fill{height:100%;width:0;background:var(--pq-blue);border-radius:999px;transition:width .35s ease}
.pqpir-viewport{position:relative;overflow:hidden}
.pqpir-track{display:flex;width:100%;transition:transform .45s cubic-bezier(.16,1,.3,1);transform:translateX(calc(var(--pq-step,0) * -100%))}
.pqpir-page{flex:0 0 100%;min-width:0;box-sizing:border-box;padding:4px 66px 6px}
.pqpir-page[aria-hidden="true"]{visibility:hidden}
.pqpir-nav-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border-radius:50%;border:1px solid var(--pq-line-strong);background:var(--pq-card);color:var(--pq-ink);cursor:pointer;box-shadow:0 2px 8px rgba(22,38,30,.1);transition:background .15s ease,border-color .15s ease,color .15s ease}
.pqpir-nav-arrow:hover{background:var(--pq-blue);border-color:var(--pq-blue);color:#fff}
.pqpir-nav-arrow svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pqpir-nav-arrow[hidden]{display:none!important}
.pqpir-nav-back{left:10px}
.pqpir-nav-next{right:10px}
.pqpir-wizard-foot{display:flex;align-items:center;justify-content:flex-end;padding:22px 30px 28px;margin-top:6px;border-top:1px solid var(--pq-line)}
.pqpir-wizard-foot .pqpir-btn{min-width:112px}
@media(max-width:760px){.pqpir-wizard-inner{padding:18px 18px 0}.pqpir-page{padding:2px 46px 4px}.pqpir-nav-arrow{width:34px;height:34px}.pqpir-nav-arrow svg{width:16px;height:16px}.pqpir-nav-back{left:4px}.pqpir-nav-next{right:4px}.pqpir-wizard-foot{padding:18px 18px 20px}.pqpir-wizard-foot .pqpir-btn{min-width:0;flex:1}}
</style>
<style><?php echo pqh_openproject_skin_css('pqpir', 'pqh-public-intake-page'); ?></style>
<main class="pqpir-shell">
  <div class="pqpir-wrap">
    <section class="pqpir-hero pqh-workspace-top">
      <?php echo pqpir_public_header($consumercontext); ?>
      <h1 class="pqpir-title pqh-workspace-title">Request Enrollment</h1>
      <p class="pqpir-sub pqh-workspace-sub">Share the prospective student's details, preferred weekly session count, and available live-session hours. The <?php echo s($brandname); ?> team will review placement and confirm the best class options.</p>
    </section>

    <?php if ($childschoolchoices): ?>
      <section class="pqpir-panel pqpir-school-pick">
        <h2>Which school is this for?</h2>
        <form method="get" action="<?php echo s((new moodle_url('/local/hubredirect/public_intake.php'))->out(false)); ?>" class="pqpir-school-pick-form">
          <?php if ($teacherpreference): ?><input type="hidden" name="teacherid" value="<?php echo (int)$teacherpreference->userid; ?>"><?php endif; ?>
          <?php foreach ($childschoolchoices as $childschool): ?>
            <label class="pqpir-school-pick-option">
              <input type="radio" name="workspaceid" value="<?php echo (int)$childschool->workspaceid; ?>"<?php echo ((int)$childschool->workspaceid === $selectedchildworkspaceid) ? ' checked' : ''; ?> onchange="this.form.submit();">
              <span><?php echo s((string)$childschool->consumername); ?></span>
            </label>
          <?php endforeach; ?>
          <noscript><button type="submit" class="pqpir-btn">Continue</button></noscript>
        </form>
        <?php if ($needsschoolselection): ?><p class="pqpir-muted pqpir-school-pick-hint">Select a school above to continue.</p><?php endif; ?>
      </section>
    <?php endif; ?>

    <?php if (!$needsschoolselection): ?>
      <section class="pqpir-panel pqpir-school-pick">
        <form method="get" action="<?php echo s((new moodle_url('/local/hubredirect/public_intake.php'))->out(false)); ?>" class="pqpir-school-pick-form pqpir-school-pick-age">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <?php if ((int)$consumercontext->workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
          <?php if ($teacherpreference): ?><input type="hidden" name="teacherid" value="<?php echo (int)$teacherpreference->userid; ?>"><?php endif; ?>
          <?php // Parent leads and is preselected -- the question follows that order
                // rather than reading "student or a parent" above a Parent-first pair. ?>
          <span class="pqpir-school-pick-question">Are you a parent or a student?</span>
          <label class="pqpir-school-pick-option">
            <input type="radio" name="respondent_role" value="parent"<?php echo $respondentrole === 'parent' ? ' checked' : ''; ?> onchange="this.form.submit();">
            <span>Parent</span>
          </label>
          <label class="pqpir-school-pick-option">
            <input type="radio" name="respondent_role" value="student"<?php echo $respondentrole === 'student' ? ' checked' : ''; ?> onchange="this.form.submit();">
            <span>Student</span>
          </label>
          <noscript><button type="submit" class="pqpir-btn">Continue</button></noscript>
        </form>
        <?php if ($respondentrole === 'student'): ?>
        <form method="get" action="<?php echo s((new moodle_url('/local/hubredirect/public_intake.php'))->out(false)); ?>" class="pqpir-school-pick-form pqpir-school-pick-age">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <?php if ((int)$consumercontext->workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
          <?php if ($teacherpreference): ?><input type="hidden" name="teacherid" value="<?php echo (int)$teacherpreference->userid; ?>"><?php endif; ?>
          <input type="hidden" name="respondent_role" value="student">
          <span class="pqpir-school-pick-question">Are you over 18?</span>
          <label class="pqpir-school-pick-option">
            <input type="radio" name="over18" value="yes"<?php echo $overeighteenanswer === 'yes' ? ' checked' : ''; ?> onchange="this.form.submit();">
            <span>Yes</span>
          </label>
          <label class="pqpir-school-pick-option">
            <input type="radio" name="over18" value="no"<?php echo $overeighteenanswer === 'no' ? ' checked' : ''; ?> onchange="this.form.submit();">
            <span>No</span>
          </label>
          <noscript><button type="submit" class="pqpir-btn">Continue</button></noscript>
        </form>
        <?php endif; ?>
      </section>
    <?php endif; ?>

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
    <?php elseif ($needsschoolselection): ?>
      <?php // The rest of the form is intentionally hidden until a school is picked above. ?>
    <?php else: ?>
      <section class="pqpir-panel pqpir-wizard">
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <?php if ((int)$consumercontext->workspaceid > 0): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$consumercontext->workspaceid; ?>"><?php endif; ?>
          <input type="hidden" name="formtime" value="<?php echo (int)$formtime; ?>">
          <input type="hidden" name="formtoken" value="<?php echo s($formtoken); ?>">
          <?php if ($teacherpreference): ?><input type="hidden" name="teacherid" value="<?php echo (int)$teacherpreference->userid; ?>"><?php endif; ?>
          <?php if ($respondentrole !== ''): ?><input type="hidden" name="respondent_role" value="<?php echo s($respondentrole); ?>"><?php endif; ?>
          <?php if ($overeighteenanswer !== ''): ?><input type="hidden" name="over18" value="<?php echo s($overeighteenanswer); ?>"><?php endif; ?>
          <div class="pqpir-trap" aria-hidden="true">
            <label>Website <input name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <div class="pqpir-wizard-inner">
            <h2>Student Information</h2>
            <?php if ($teacherpreferencelabel !== ''): ?><div class="pqpir-pref">Preferred teacher: <?php echo s($teacherpreferencelabel); ?></div><?php endif; ?>
            <div class="pqpir-progress">
              <div class="pqpir-progress-label"><span data-wizard-step-text>Step 1</span><span data-wizard-step-title></span></div>
              <div class="pqpir-progress-track"><div class="pqpir-progress-fill" data-wizard-fill></div></div>
            </div>
          </div>
          <div class="pqpir-viewport">
          <button type="button" class="pqpir-nav-arrow pqpir-nav-back" data-wizard-back aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg></button>
          <button type="button" class="pqpir-nav-arrow pqpir-nav-next" data-wizard-next aria-label="Next"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg></button>
          <div class="pqpir-track" data-wizard-track>
          <div class="pqpir-page">
          <?php if ($parentguardianfirst): ?>
          <h3>Parent / guardian</h3>
          <?php echo pqpir_parent_guardian_fields($form, $errors, $options); ?>
          </div><div class="pqpir-page">
          <?php endif; ?>
          <h3>Basic learner information</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['student_firstname']) ? ' pqpir-field--error' : ''; ?>"><label>First name</label><?php echo pqpir_hint("The student's first name, spelt as it appears on their birth certificate or school records."); ?><input class="pqpir-input" name="student_firstname" value="<?php echo s(pqpir_value($form, 'student_firstname')); ?>"><?php echo pqpir_error($errors, 'student_firstname'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['student_middle_name']) ? ' pqpir-field--error' : ''; ?>"><label>Middle name</label><?php echo pqpir_hint('Optional. Middle or second name from the same records — leave it blank if the student has none.'); ?><input class="pqpir-input" name="student_middle_name" value="<?php echo s(pqpir_value($form, 'student_middle_name')); ?>"><?php echo pqpir_error($errors, 'student_middle_name'); ?></div>
            <div class="pqpir-field<?php echo isset($errors['student_lastname']) ? ' pqpir-field--error' : ''; ?>"><label>Last name</label><?php echo pqpir_hint('Family name or surname, spelt as it appears on official records.'); ?><input class="pqpir-input" name="student_lastname" value="<?php echo s(pqpir_value($form, 'student_lastname')); ?>"><?php echo pqpir_error($errors, 'student_lastname'); ?></div>
            <div class="pqpir-field"><label>Preferred name</label><?php echo pqpir_hint('Optional. What the teacher should call the student in class, if it differs from the first name. Leave blank to use the names above.'); ?><input class="pqpir-input" name="student_display_name" value="<?php echo s(pqpir_value($form, 'student_display_name')); ?>"></div>
            <div class="pqpir-field<?php echo isset($errors['student_email']) ? ' pqpir-field--error' : ''; ?>"><label>Email address or phone / WhatsApp</label><?php echo pqpir_hint("The student's own email or phone, if they have one. Leave blank for a younger child — we will use your contact details instead."); ?><input class="pqpir-input" name="student_email" value="<?php echo s(pqpir_value($form, 'student_email')); ?>"><?php echo pqpir_error($errors, 'student_email'); ?></div>
            <?php // K-12 asks where the family is on this same step; every other
                  // institution type keeps its own Location and language step below. ?>
            <?php if ($isprimaryeducation): ?>
              <div class="pqpir-field<?php echo isset($errors['country']) ? ' pqpir-field--error' : ''; ?>"><label>Country</label><?php echo pqpir_hint('The country the student will be learning from. Choosing it fills the City list and the time zone for you.'); ?><?php echo pqpir_select('country', $options['countries'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['city']) ? ' pqpir-field--error' : ''; ?>"><label>City</label><?php echo pqpir_hint('The city or town nearest to you. If yours is not on the list, choose the Other option and a box will appear for you to type it.'); ?><?php echo pqpir_select('city', $options['cities'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field pqpir-city-other<?php echo isset($errors['city_other']) ? ' pqpir-field--error' : ''; ?>"><label>City not listed</label><?php echo pqpir_hint('Type the name of your city or town.'); ?><input class="pqpir-input" name="city_other" value="<?php echo s(pqpir_value($form, 'city_other')); ?>"><?php echo pqpir_error($errors, 'city_other'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['district']) ? ' pqpir-field--error' : ''; ?>"><label>District</label><?php echo pqpir_hint('Optional. The district, county or sub-county your city sits in.'); ?><input class="pqpir-input" name="district" value="<?php echo s(pqpir_value($form, 'district')); ?>"><?php echo pqpir_error($errors, 'district'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['division']) ? ' pqpir-field--error' : ''; ?>"><label>Division</label><?php echo pqpir_hint('Optional. The division or ward within that district.'); ?><input class="pqpir-input" name="division" value="<?php echo s(pqpir_value($form, 'division')); ?>"><?php echo pqpir_error($errors, 'division'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['estate']) ? ' pqpir-field--error' : ''; ?>"><label>Estate</label><?php echo pqpir_hint('Optional. The estate, neighbourhood or street area — it helps us group students who live near each other.'); ?><input class="pqpir-input" name="estate" value="<?php echo s(pqpir_value($form, 'estate')); ?>"><?php echo pqpir_error($errors, 'estate'); ?></div>
            <?php endif; ?>
          </div>

          <?php if ($isprimaryeducation): ?>
            </div><div class="pqpir-page">
            <h3>Primary education details</h3>
            <div class="pqpir-grid">
              <?php // Date of birth is not asked for. Age answers the same question for
                    // placement, and a parent filling this in on a phone should not have to
                    // find a birth certificate first. The field is gone rather than hidden:
                    // a hidden input still posts, and an empty value that looks deliberate
                    // is worse than no value at all. ?>
              <div class="pqpir-field<?php echo isset($errors['age_years']) ? ' pqpir-field--error' : ''; ?>"><label>Age</label><?php echo pqpir_hint("The student's age in whole years today. We use it to check the grade is right for their age."); ?><input class="pqpir-input" name="age_years" type="number" min="1" max="99" value="<?php echo s(pqpir_value($form, 'age_years')); ?>"><?php echo pqpir_error($errors, 'age_years'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['gender']) ? ' pqpir-field--error' : ''; ?>"><label>Gender</label><?php echo pqpir_hint('Used for class grouping and, where you ask for it below, for matching a teacher of the same gender.'); ?><select class="pqpir-input" name="gender"><option value="">Select</option><option value="female"<?php echo pqpir_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqpir_selected($form, 'gender', 'male'); ?>>Male</option></select><?php echo pqpir_error($errors, 'gender'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['current_grade']) ? ' pqpir-field--error' : ''; ?>"><label>Current grade/year</label><?php echo pqpir_hint('The grade the student is in right now — not the one they are moving up to. Choose "Other / not sure" if the student is between schools or systems.'); ?><?php echo pqpir_select('current_grade', $options['primary_grade_levels'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['school_curriculum']) ? ' pqpir-field--error' : ''; ?>"><label>School curriculum</label><?php echo pqpir_hint('The curriculum the student\'s current school follows. Pick the closest match — it tells us how their grade compares to ours.'); ?><?php echo pqpir_select('school_curriculum', $options['primary_curricula'] ?? [], $form, $errors); ?></div>
              <div class="pqpir-field<?php echo isset($errors['current_school_name']) ? ' pqpir-field--error' : ''; ?>"><label>Current school name</label><?php echo pqpir_hint('The school the student attends now. Write "Home schooled" or "Not in school" if that is the case.'); ?><input class="pqpir-input" name="current_school_name" value="<?php echo s(pqpir_value($form, 'current_school_name')); ?>"><?php echo pqpir_error($errors, 'current_school_name'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['student_lives_with']) ? ' pqpir-field--error' : ''; ?>"><label>Student lives with</label><?php echo pqpir_hint('Who the student lives with day to day. It tells us who to speak to about attendance and progress.'); ?><?php echo pqpir_select('student_lives_with', $options['student_lives_with_options'] ?? [], $form, $errors); ?></div>
              <?php // Preferred class format / group size / teacher gender moved to the Preferences step below. ?>
              <div class="pqpir-field<?php echo isset($errors['school_term']) ? ' pqpir-field--error' : ''; ?>"><label>School term/admission year</label><?php echo pqpir_hint('Optional. When you would like the student to start, e.g. "Term 1 2027" or "January 2027".'); ?><input class="pqpir-input" name="school_term" value="<?php echo s(pqpir_value($form, 'school_term')); ?>"><?php echo pqpir_error($errors, 'school_term'); ?></div>
              <div class="pqpir-field<?php echo isset($errors['special_needs']) ? ' pqpir-field--error' : ''; ?>"><label>Special learning needs / accommodations</label><?php echo pqpir_hint('Choose Yes if the student needs any learning support or adjustment — extra time, help with reading, larger text, a quieter setting. Describe it in the notes box below.'); ?><select class="pqpir-input" name="special_needs"><option value="">Select</option><option value="no"<?php echo pqpir_selected($form, 'special_needs', 'no'); ?>>No</option><option value="yes"<?php echo pqpir_selected($form, 'special_needs', 'yes'); ?>>Yes</option></select><?php echo pqpir_error($errors, 'special_needs'); ?></div>
            </div>
            <div class="pqpir-field<?php echo isset($errors['medical_safety_notes']) ? ' pqpir-field--error' : ''; ?>"><label>Medical/allergy/safety notes</label><?php echo pqpir_hint('Optional. Allergies, medication, or any condition a teacher should know about to keep the student safe and supported. Leave blank if there is nothing to report.'); ?><textarea class="pqpir-input pqpir-textarea" name="medical_safety_notes"><?php echo s(pqpir_value($form, 'medical_safety_notes')); ?></textarea><?php echo pqpir_error($errors, 'medical_safety_notes'); ?></div>
          <?php endif; ?>

          <?php if ($parentguardianrequired && !$parentguardianfirst): ?>
            </div><div class="pqpir-page">
            <h3>Parent / guardian<?php if (!$isprimaryeducation): ?> <span class="pqpir-muted">(required only when the student is under 18)</span><?php endif; ?></h3>
            <?php echo pqpir_parent_guardian_fields($form, $errors, $options); ?>
          <?php endif; ?>

          <?php if ($isadultlearning): ?>
            </div><div class="pqpir-page">
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
            </div><div class="pqpir-page">
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
            </div><div class="pqpir-page">
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
            </div><div class="pqpir-page">
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
            </div><div class="pqpir-page">
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
            </div><div class="pqpir-page">
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

          </div><div class="pqpir-page">
          <?php // K-12 collects its location on the Basic learner information step and has
                // no course, placement level or learning background, so the whole program
                // step collapses to the five preferences below. ?>
          <?php if ($isprimaryeducation): ?>
          <h3>Learning preferences</h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['primary_language']) ? ' pqpir-field--error' : ''; ?>"><label>Primary language</label><?php echo pqpir_hint('The language spoken at home — the one the student is most comfortable in.'); ?><?php echo pqpir_select('primary_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['preferred_teaching_language']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred teaching language</label><?php echo pqpir_hint('The language you want lessons taught in. It can be the same as the language at home, or a different one.'); ?><?php echo pqpir_select('preferred_teaching_language', $options['primary_languages'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['preferred_class_format']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred class format</label><?php echo pqpir_hint('All classes are online. Choose how much live teaching you want: scheduled classes with a teacher, live classes without one, or study the student does in their own time.'); ?><?php echo pqpir_select('preferred_class_format', $options['primary_class_formats'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['preferred_group_size']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred group size</label><?php echo pqpir_hint('One-to-one gives the most attention; a small group or regular class costs less and lets the student learn alongside others. Choose "Not sure" and we will advise.'); ?><?php echo pqpir_select('preferred_group_size', $options['primary_group_sizes'] ?? [], $form, $errors); ?></div>
            <div class="pqpir-field<?php echo isset($errors['preferred_teacher_gender']) ? ' pqpir-field--error' : ''; ?>"><label>Preferred teacher gender</label><?php echo pqpir_hint('Choose "No preference" if it does not matter to you. We match your preference wherever a suitable teacher is available.'); ?><?php echo pqpir_select('preferred_teacher_gender', $options['teacher_gender_preferences'] ?? [], $form, $errors); ?></div>
          </div>
          <?php else: ?>
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
          <?php endif; ?>

          </div><div class="pqpir-page">
          <h3><?php echo $isprimaryeducation ? 'Preferred weekly live-sessions' : 'Preferred weekly live-session number of sessions and hours'; ?></h3>
          <div class="pqpir-grid">
            <div class="pqpir-field<?php echo isset($errors['session_count']) ? ' pqpir-field--error' : ''; ?>">
              <label>Number of sessions</label>
              <?php echo pqpir_hint('How many live lessons a week you would like the student to attend. This is what you are asking for — the final timetable is confirmed with you.'); ?>
              <?php echo pqpir_select('session_count', $options['session_counts'] ?? [], $form, $errors, 'Select'); ?>
            </div>
            <div class="pqpir-field<?php echo isset($errors['timezone']) ? ' pqpir-field--error' : ''; ?>">
              <label>Time zone</label>
              <?php echo pqpir_hint('Filled in from the country you chose. Change it only if the student will be joining from a different time zone. Every time below is read in this zone.'); ?>
              <?php echo pqpir_select('timezone', $options['timezones'] ?? [], $form, $errors); ?>
            </div>
          </div>
          <div class="pqpir-field<?php echo isset($errors['slots']) ? ' pqpir-field--error' : ''; ?>">
            <label>Select all recurring times that could work</label>
            <?php echo pqpir_hint('Tick every day and hour that could work every week, not only your first choice — the more you tick, the more likely we can place the student in a class. Tick at least one. Times shown are in the time zone above.'); ?>
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

          </div><div class="pqpir-page">
          <h3>Notes and consent</h3>
          <div class="pqpir-field"><label>Parent preferences</label><?php echo pqpir_hint('Optional. Anything else that would help us place the student — a teacher you have in mind, siblings to keep in the same class, days to avoid, or a question for the team.'); ?><textarea class="pqpir-input pqpir-textarea" name="parent_preferences"><?php echo s(pqpir_value($form, 'parent_preferences')); ?></textarea></div>
          <label class="pqpir-checkrow"><input type="checkbox" name="parent_email_enabled" value="1"<?php echo pqpir_checked($form, 'parent_email_enabled'); ?>><span>Send parent email notifications when the parent contact is a valid email address.<?php echo pqpir_hint('Tick this to get class reminders and progress updates by email. It only works if you gave an email address rather than a phone number above.', 'span'); ?></span></label>
          <label class="pqpir-checkrow"><input type="checkbox" name="live_class_consent" value="1"<?php echo pqpir_checked($form, 'live_class_consent'); ?>><span>Student or parent/guardian consents to live interactive classes.<?php echo pqpir_hint('You must tick this to submit the form. It confirms you agree to the student joining live online classes with a teacher and other students.', 'span'); ?></span></label><?php echo pqpir_error($errors, 'live_class_consent'); ?>
          <label class="pqpir-checkrow"><input type="checkbox" name="recording_consent" value="1"<?php echo pqpir_checked($form, 'recording_consent'); ?>><span>Student or parent/guardian consents to class recording when recording policy allows.<?php echo pqpir_hint('Optional. Some classes are recorded so students can watch them again. Leave this unticked if you would rather the student did not appear in a recording.', 'span'); ?></span></label>
          <div class="pqpir-field"><label>Consent notes/comment</label><?php echo pqpir_hint('Optional. Any condition or question about the two consents above.'); ?><textarea class="pqpir-input pqpir-textarea" name="consent_notes"><?php echo s(pqpir_value($form, 'consent_notes')); ?></textarea></div>

          <p class="pqpir-muted" style="margin:14px 0 10px">Submitting an Enrolment Request does not mean you are being enrolled at the school, nor does it obligate you to enrol. <?php echo s($brandname); ?> will review your request and follow up with next steps.</p>
          </div></div></div>
          <div class="pqpir-wizard-foot">
            <button class="pqpir-btn" type="submit" data-wizard-submit>Submit Enrolment Request</button>
          </div>
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
<script>
(function() {
  var wizard = document.querySelector('.pqpir-wizard');
  if (!wizard) {
    return;
  }
  var form = wizard.querySelector('form') || wizard;
  var track = wizard.querySelector('[data-wizard-track]');
  var pages = Array.prototype.slice.call(wizard.querySelectorAll('.pqpir-page'));
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
  var errorField = wizard.querySelector('.pqpir-field--error, .pqpir-error');
  if (errorField) {
    var errorPage = errorField.closest('.pqpir-page');
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

