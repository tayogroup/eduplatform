<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can review public intake requests.');

$consumercontext = pqh_requested_consumer_context();

$options = require(__DIR__ . '/student_intake_config.php');

function pqireq_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqireq_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqireq_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqireq_request_in_consumer_scope(stdClass $request, stdClass $consumercontext): bool {
    if (pqh_context_is_platform_foundation($consumercontext)) {
        return true;
    }
    if (pqireq_column_exists('local_prequran_intake_request', 'consumerid')
            && (int)($consumercontext->consumerid ?? 0) > 0) {
        return (int)($request->consumerid ?? 0) === (int)$consumercontext->consumerid;
    }
    $workspaceid = (int)($request->workspaceid ?? 0);
    return $workspaceid > 0 && pqh_consumer_context_allows_workspace($consumercontext, $workspaceid);
}

function pqireq_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqireq_table_exists('local_prequran_live_audit')) {
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

function pqireq_json_slots($json): array {
    $decoded = json_decode((string)$json, true);
    if (!is_array($decoded) || empty($decoded['slots']) || !is_array($decoded['slots'])) {
        return [];
    }
    return $decoded['slots'];
}

function pqireq_slot_parts($json): array {
    $days = [];
    $times = [];
    foreach (pqireq_json_slots($json) as $slot) {
        if (!is_array($slot)) {
            continue;
        }
        $day = trim((string)($slot['day'] ?? ''));
        $time = trim((string)($slot['time'] ?? ''));
        if ($day !== '' && !in_array($day, $days, true)) {
            $days[] = $day;
        }
        if ($time !== '' && !in_array($time, $times, true)) {
            $times[] = $time;
        }
    }
    return [$days, $times];
}

function pqireq_split_csv(string $value): array {
    $parts = array_map('trim', explode(',', $value));
    return array_values(array_filter($parts, static fn($part) => $part !== ''));
}

function pqireq_prefill(stdClass $request): array {
    [$days, $times] = pqireq_slot_parts($request->availability_json ?? '');
    return [
        'requestid' => (string)$request->id,
        'student_firstname' => (string)$request->student_firstname,
        'student_middle_name' => (string)($request->student_middle_name ?? ''),
        'student_lastname' => (string)$request->student_lastname,
        'student_display_name' => (string)$request->student_display_name,
        'student_access_type' => (string)($request->student_access_type ?? 'managed'),
        'student_email' => (string)$request->student_email,
        'date_of_birth' => (string)$request->date_of_birth,
        'age_years' => (string)(int)$request->age_years,
        'gender' => (string)$request->gender,
        'special_needs' => (string)($request->special_needs ?? ''),
        'current_grade' => (string)($request->current_grade ?? ''),
        'school_curriculum' => (string)($request->school_curriculum ?? ''),
        'current_school_name' => (string)($request->current_school_name ?? ''),
        'student_lives_with' => (string)($request->student_lives_with ?? ''),
        'primary_learning_goal' => (string)($request->primary_learning_goal ?? ''),
        'medical_safety_notes' => (string)($request->medical_safety_notes ?? ''),
        'preferred_class_format' => (string)($request->preferred_class_format ?? ''),
        'preferred_group_size' => (string)($request->preferred_group_size ?? ''),
        'preferred_teacher_gender' => (string)($request->preferred_teacher_gender ?? ''),
        'school_term' => (string)($request->school_term ?? ''),
        'islamic_program_interest' => (string)($request->islamic_program_interest ?? ''),
        'quran_reading_level' => (string)($request->quran_reading_level ?? ''),
        'tajweed_level' => (string)($request->tajweed_level ?? ''),
        'memorization_status' => (string)($request->memorization_status ?? ''),
        'memorized_portion' => (string)($request->memorized_portion ?? ''),
        'arabic_reading_ability' => (string)($request->arabic_reading_ability ?? ''),
        'prior_islamic_studies' => (string)($request->prior_islamic_studies ?? ''),
        'islamic_learning_goal' => (string)($request->islamic_learning_goal ?? ''),
        'previous_learning_method' => (string)($request->previous_learning_method ?? ''),
        'tafsir_level' => (string)($request->tafsir_level ?? ''),
        'islamic_notes' => (string)($request->islamic_notes ?? ''),
        'christian_program_interest' => (string)($request->christian_program_interest ?? ''),
        'bible_reading_level' => (string)($request->bible_reading_level ?? ''),
        'bible_knowledge_level' => (string)($request->bible_knowledge_level ?? ''),
        'christian_studies_level' => (string)($request->christian_studies_level ?? ''),
        'prior_christian_studies' => (string)($request->prior_christian_studies ?? ''),
        'christian_previous_learning_method' => (string)($request->christian_previous_learning_method ?? ''),
        'christian_learning_goal' => (string)($request->christian_learning_goal ?? ''),
        'christian_notes' => (string)($request->christian_notes ?? ''),
        'higher_application_level' => (string)($request->higher_application_level ?? ''),
        'higher_program_field' => (string)($request->higher_program_field ?? ''),
        'higher_specialization' => (string)($request->higher_specialization ?? ''),
        'higher_highest_qualification' => (string)($request->higher_highest_qualification ?? ''),
        'higher_previous_institution' => (string)($request->higher_previous_institution ?? ''),
        'higher_qualification_title' => (string)($request->higher_qualification_title ?? ''),
        'higher_completion_year' => (string)($request->higher_completion_year ?? ''),
        'higher_academic_result' => (string)($request->higher_academic_result ?? ''),
        'higher_academic_status' => (string)($request->higher_academic_status ?? ''),
        'higher_admission_route' => (string)($request->higher_admission_route ?? ''),
        'higher_transfer_credits' => (string)($request->higher_transfer_credits ?? ''),
        'higher_study_mode' => (string)($request->higher_study_mode ?? ''),
        'higher_study_load' => (string)($request->higher_study_load ?? ''),
        'higher_preferred_intake' => (string)($request->higher_preferred_intake ?? ''),
        'higher_research_interest' => (string)($request->higher_research_interest ?? ''),
        'higher_funding_method' => (string)($request->higher_funding_method ?? ''),
        'higher_financial_aid_interest' => (string)($request->higher_financial_aid_interest ?? ''),
        'higher_support_needs' => (string)($request->higher_support_needs ?? ''),
        'technical_program' => (string)($request->technical_program ?? ''),
        'technical_specialization' => (string)($request->technical_specialization ?? ''),
        'technical_training_level' => (string)($request->technical_training_level ?? ''),
        'technical_previous_experience' => (string)($request->technical_previous_experience ?? ''),
        'technical_previous_learning_method' => (string)($request->technical_previous_learning_method ?? ''),
        'technical_experience_duration' => (string)($request->technical_experience_duration ?? ''),
        'technical_employment_status' => (string)($request->technical_employment_status ?? ''),
        'technical_employer_workshop' => (string)($request->technical_employer_workshop ?? ''),
        'technical_training_goal' => (string)($request->technical_training_goal ?? ''),
        'technical_certification_sought' => (string)($request->technical_certification_sought ?? ''),
        'technical_training_format' => (string)($request->technical_training_format ?? ''),
        'technical_training_schedule' => (string)($request->technical_training_schedule ?? ''),
        'technical_tools_experience' => (string)($request->technical_tools_experience ?? ''),
        'technical_tool_access' => (string)($request->technical_tool_access ?? ''),
        'technical_digital_skill_level' => (string)($request->technical_digital_skill_level ?? ''),
        'technical_safety_training' => (string)($request->technical_safety_training ?? ''),
        'technical_protective_equipment' => (string)($request->technical_protective_equipment ?? ''),
        'technical_support_needs' => (string)($request->technical_support_needs ?? ''),
        'technical_notes' => (string)($request->technical_notes ?? ''),
        'professional_area' => (string)($request->professional_area ?? ''),
        'professional_topic_skill' => (string)($request->professional_topic_skill ?? ''),
        'professional_current_role' => (string)($request->professional_current_role ?? ''),
        'professional_industry' => (string)($request->professional_industry ?? ''),
        'professional_employment_status' => (string)($request->professional_employment_status ?? ''),
        'professional_employer' => (string)($request->professional_employer ?? ''),
        'professional_experience_years' => (string)($request->professional_experience_years ?? ''),
        'professional_responsibility_level' => (string)($request->professional_responsibility_level ?? ''),
        'professional_development_goal' => (string)($request->professional_development_goal ?? ''),
        'professional_skill_level' => (string)($request->professional_skill_level ?? ''),
        'professional_credential_sought' => (string)($request->professional_credential_sought ?? ''),
        'professional_certification_deadline' => (string)($request->professional_certification_deadline ?? ''),
        'professional_learning_format' => (string)($request->professional_learning_format ?? ''),
        'professional_learning_schedule' => (string)($request->professional_learning_schedule ?? ''),
        'professional_course_intensity' => (string)($request->professional_course_intensity ?? ''),
        'professional_employer_sponsored' => (string)($request->professional_employer_sponsored ?? ''),
        'professional_cpd_required' => (string)($request->professional_cpd_required ?? ''),
        'professional_cpd_credits' => (string)($request->professional_cpd_credits ?? ''),
        'professional_workplace_outcome' => (string)($request->professional_workplace_outcome ?? ''),
        'professional_support_needs' => (string)($request->professional_support_needs ?? ''),
        'professional_notes' => (string)($request->professional_notes ?? ''),
        'adult_learning_area' => (string)($request->adult_learning_area ?? ''),
        'adult_subject_skill' => (string)($request->adult_subject_skill ?? ''),
        'adult_education_level' => (string)($request->adult_education_level ?? ''),
        'adult_literacy_level' => (string)($request->adult_literacy_level ?? ''),
        'adult_numeracy_level' => (string)($request->adult_numeracy_level ?? ''),
        'adult_digital_skill_level' => (string)($request->adult_digital_skill_level ?? ''),
        'adult_previous_experience' => (string)($request->adult_previous_experience ?? ''),
        'adult_previous_learning_method' => (string)($request->adult_previous_learning_method ?? ''),
        'adult_learning_goal' => (string)($request->adult_learning_goal ?? ''),
        'adult_employment_status' => (string)($request->adult_employment_status ?? ''),
        'adult_learning_format' => (string)($request->adult_learning_format ?? ''),
        'adult_learning_pace' => (string)($request->adult_learning_pace ?? ''),
        'adult_class_arrangement' => (string)($request->adult_class_arrangement ?? ''),
        'adult_childcare_impact' => (string)($request->adult_childcare_impact ?? ''),
        'adult_work_impact' => (string)($request->adult_work_impact ?? ''),
        'adult_access_limitations' => (string)($request->adult_access_limitations ?? ''),
        'adult_learning_confidence' => (string)($request->adult_learning_confidence ?? ''),
        'adult_support_needs' => (string)($request->adult_support_needs ?? ''),
        'adult_notes' => (string)($request->adult_notes ?? ''),
        'course_type' => (string)($request->course_type ?? ''),
        'country' => (string)$request->country,
        'city' => (string)$request->city,
        'timezone' => (string)$request->timezone,
        'primary_language' => (string)$request->primary_language,
        'preferred_teaching_language' => (string)($request->preferred_teaching_language ?? ''),
        'other_languages' => pqireq_split_csv((string)$request->other_languages),
        'current_level' => (string)$request->current_level,
        'tajweed_sub_level' => (string)($request->tajweed_sub_level ?? ''),
        'learning_base' => (string)$request->learning_base,
        'availability_days' => $days,
        'availability_time_windows' => $times,
        'availability' => (string)$request->availability_summary,
        'parent_name' => (string)$request->parent_name,
        'parent_relationship' => (string)($request->parent_relationship ?? ''),
        'parent_relationship_other' => (string)($request->parent_relationship_other ?? ''),
        'parent_email' => (string)$request->parent_email,
        'parent_phone' => (string)$request->parent_phone,
        'emergency_contact_name' => (string)($request->emergency_contact_name ?? ''),
        'emergency_contact_phone' => (string)($request->emergency_contact_phone ?? ''),
        'parent_preferences' => (string)$request->parent_preferences,
        'parent_email_enabled' => (int)($request->parent_email_enabled ?? 1),
        'live_class_consent' => (int)$request->live_class_consent,
        'recording_consent' => (int)$request->recording_consent,
        'consent_notes' => (string)$request->consent_notes,
        'workspaceid' => (string)(int)($request->workspaceid ?? 0),
    ];
}

function pqireq_normal(string $value): string {
    return core_text::strtolower(trim($value));
}

function pqireq_group_score(stdClass $request, stdClass $group): array {
    $score = 0;
    $reasons = [];
    if (pqireq_normal((string)($request->course_type ?? '')) !== '' && pqireq_normal((string)($request->course_type ?? '')) === pqireq_normal((string)($group->course_type ?? ''))) {
        $score += 20;
        $reasons[] = 'course';
    }
    if (pqireq_normal((string)$request->timezone) !== '' && pqireq_normal((string)$request->timezone) === pqireq_normal((string)$group->timezone)) {
        $score += 28;
        $reasons[] = 'timezone';
    }
    if (pqireq_normal((string)$request->primary_language) !== '' && pqireq_normal((string)$request->primary_language) === pqireq_normal((string)$group->language)) {
        $score += 20;
        $reasons[] = 'language';
    }
    if (pqireq_normal((string)$request->current_level) !== '' && pqireq_normal((string)$request->current_level) === pqireq_normal((string)$group->current_level)) {
        $score += 20;
        $reasons[] = 'level';
    }
    if (pqireq_normal((string)$request->learning_base) !== '' && pqireq_normal((string)$request->learning_base) === pqireq_normal((string)$group->learning_base)) {
        $score += 12;
        $reasons[] = 'base';
    }
    $age = (int)$request->age_years;
    if ($age > 0 && $age >= (int)$group->age_min && $age <= (int)$group->age_max) {
        $score += 10;
        $reasons[] = 'age';
    }
    $genderpolicy = pqireq_normal((string)$group->gender_policy);
    $gender = pqireq_normal((string)$request->gender);
    if ($genderpolicy === 'flexible' || $genderpolicy === 'mixed' || ($gender !== '' && $genderpolicy === $gender)) {
        $score += 5;
        $reasons[] = 'gender';
    }
    if (pqireq_normal((string)$request->country) !== '' && pqireq_normal((string)$request->country) === pqireq_normal((string)$group->country)) {
        $score += 3;
        $reasons[] = 'country';
    }
    if (pqireq_normal((string)$request->city) !== '' && pqireq_normal((string)$request->city) === pqireq_normal((string)$group->city)) {
        $score += 2;
        $reasons[] = 'city';
    }
    if ((int)$group->open_seats <= 0) {
        $score -= 20;
        $reasons[] = 'full';
    }
    return [max(0, min(100, $score)), implode(', ', $reasons)];
}

function pqireq_group_suggestions(stdClass $request, int $limit = 4): array {
    global $DB;
    if (!pqireq_table_exists('local_prequran_class_group') || !pqireq_table_exists('local_prequran_group_member')) {
        return [];
    }

    $groups = $DB->get_records_sql(
        "SELECT g.*, COUNT(DISTINCT gm.id) AS active_members
           FROM {local_prequran_class_group} g
      LEFT JOIN {local_prequran_group_member} gm
             ON gm.groupid = g.id AND gm.assignment_status = 'active'
          WHERE g.status IN ('open', 'active')
       GROUP BY g.id, g.poolid, g.teacherid, g.title, g.course_type, g.timezone, g.language, g.current_level, g.learning_base,
                g.country, g.city, g.age_min, g.age_max, g.gender_policy, g.schedule_summary, g.max_students,
                g.status, g.createdby, g.timecreated, g.timemodified
       ORDER BY g.timemodified DESC"
    );

    $ranked = [];
    foreach ($groups as $group) {
        $group->active_members = (int)($group->active_members ?? 0);
        $group->open_seats = max(0, (int)$group->max_students - $group->active_members);
        [$score, $reasons] = pqireq_group_score($request, $group);
        if ($score <= 0) {
            continue;
        }
        $group->match_score = $score;
        $group->match_reasons = $reasons;
        $ranked[] = $group;
    }
    usort($ranked, static function ($a, $b): int {
        if ((int)$a->match_score === (int)$b->match_score) {
            return (int)$b->open_seats <=> (int)$a->open_seats;
        }
        return (int)$b->match_score <=> (int)$a->match_score;
    });
    return array_slice($ranked, 0, $limit);
}

function pqireq_status_label(string $status): string {
    $labels = [
        'new' => 'New',
        'reviewing' => 'Reviewing',
        'needs_alternative' => 'Needs alternative',
        'rejected' => 'Rejected',
        'transferred' => 'Transferred',
    ];
    return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

$statusoptions = ['new', 'reviewing', 'needs_alternative', 'rejected', 'transferred'];
$filterstatus = optional_param('status', '', PARAM_ALPHANUMEXT);
if ($filterstatus !== '' && !in_array($filterstatus, $statusoptions, true)) {
    $filterstatus = '';
}
$filterquery = trim(optional_param('q', '', PARAM_TEXT));
$baseparams = [];
if ((string)($consumercontext->consumerslug ?? '') !== '') {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $baseparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$activefilterparams = $baseparams;
if ($filterstatus !== '') {
    $activefilterparams['status'] = $filterstatus;
}
if ($filterquery !== '') {
    $activefilterparams['q'] = $filterquery;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/intake_requests.php', $activefilterparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Public Intake Requests');
$PAGE->set_heading('Public Intake Requests');
$PAGE->add_body_class('pqh-intake-requests-page');

$ready = pqireq_table_exists('local_prequran_intake_request');
$message = '';
$error = '';

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This public intake review form expired. Please refresh and try again.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $requestid = optional_param('requestid', 0, PARAM_INT);
        $request = $requestid > 0 ? $DB->get_record('local_prequran_intake_request', ['id' => $requestid], '*', IGNORE_MISSING) : false;
        if (!$request) {
            throw new invalid_parameter_exception('Choose a valid public intake request before saving.');
        }
        if (!pqireq_request_in_consumer_scope($request, $consumercontext)) {
            throw new invalid_parameter_exception('This public intake request does not belong to the active consumer.');
        }
        if ($action === 'load_intake') {
            $previousstatus = (string)$request->status;
            $request->status = 'reviewing';
            $request->matched_groupid = optional_param('matched_groupid', (int)$request->matched_groupid, PARAM_INT);
            $request->admin_notes = trim(optional_param('admin_notes', (string)$request->admin_notes, PARAM_TEXT));
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_intake_request', $request);
            $SESSION->pqsi_prefill = pqireq_prefill($request);
            pqireq_audit('public_intake_loaded_for_transfer', 'intake_request', $requestid, [
                'previous_status' => $previousstatus,
                'status' => (string)$request->status,
                'matched_groupid' => (int)$request->matched_groupid,
                'admin_notes' => (string)$request->admin_notes,
                'workspaceid' => (int)($request->workspaceid ?? 0),
            ]);
            $transferparams = ['requestid' => $requestid];
            if (!empty($request->workspaceid)) {
                $transferparams['workspaceid'] = (int)$request->workspaceid;
            }
            redirect(new moodle_url('/local/hubredirect/student_intake.php', $transferparams));
        }

        if ($action === 'save_review') {
            $status = optional_param('status', '', PARAM_ALPHANUMEXT);
            if (!in_array($status, $statusoptions, true)) {
                throw new invalid_parameter_exception('Choose a valid public intake request status.');
            }
            $previousstatus = (string)$request->status;
            $request->status = $status;
            $request->matched_groupid = optional_param('matched_groupid', 0, PARAM_INT);
            $request->admin_notes = trim(optional_param('admin_notes', '', PARAM_TEXT));
            $request->reviewedby = (int)$USER->id;
            $request->reviewedat = time();
            $request->timemodified = time();
            $DB->update_record('local_prequran_intake_request', $request);
            pqireq_audit('public_intake_review_saved', 'intake_request', $requestid, [
                'previous_status' => $previousstatus,
                'status' => (string)$request->status,
                'matched_groupid' => (int)$request->matched_groupid,
                'admin_notes' => (string)$request->admin_notes,
            ]);
            $message = 'Request #' . $requestid . ' review saved.';
        } else {
            throw new invalid_parameter_exception('Choose a valid public intake review action.');
        }
    } catch (Throwable $e) {
        $error = 'Request update failed: ' . $e->getMessage();
    }
}

$requests = [];
$statuscounts = array_fill_keys($statusoptions, 0);
if ($ready) {
    $whereparts = [];
    $scopeparams = [];
    if (!pqh_context_is_platform_foundation($consumercontext)) {
        if (pqireq_column_exists('local_prequran_intake_request', 'consumerid')
                && (int)($consumercontext->consumerid ?? 0) > 0) {
            $whereparts[] = 'consumerid = :consumerid';
            $scopeparams['consumerid'] = (int)$consumercontext->consumerid;
        } else {
            $workspaceids = pqh_consumer_context_workspace_ids($consumercontext);
            if ($workspaceids && pqireq_column_exists('local_prequran_intake_request', 'workspaceid')) {
                [$insql, $scopeparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'scopeworkspace');
                $whereparts[] = "workspaceid {$insql}";
            } else {
                $whereparts[] = '1 = 0';
            }
        }
    }
    $scopewhere = $whereparts ? 'WHERE ' . implode(' AND ', $whereparts) : '';
    $statuscountrows = $DB->get_records_sql(
        "SELECT status, COUNT(1) AS total
           FROM {local_prequran_intake_request}
           {$scopewhere}
       GROUP BY status",
        $scopeparams
    );
    foreach ($statuscountrows as $row) {
        $statuscounts[(string)$row->status] = (int)$row->total;
    }

    $requestwhereparts = $whereparts;
    $requestparams = $scopeparams;
    if ($filterstatus !== '') {
        $requestwhereparts[] = 'status = :filterstatus';
        $requestparams['filterstatus'] = $filterstatus;
    }
    if ($filterquery !== '') {
        $requestwhereparts[] = $DB->sql_like(
            $DB->sql_concat(
                "' '",
                'student_display_name',
                "' '",
                'student_firstname',
                "' '",
                'student_lastname',
                "' '",
                'student_email',
                "' '",
                'parent_name',
                "' '",
                'parent_email',
                "' '",
                'parent_phone',
                "' '",
                'current_level',
                "' '",
                'admin_notes'
            ),
            ':filterquery',
            false
        );
        $requestparams['filterquery'] = '%' . $DB->sql_like_escape($filterquery) . '%';
    }
    $requestwhere = $requestwhereparts ? 'WHERE ' . implode(' AND ', $requestwhereparts) : '';
    $requests = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_intake_request}
           {$requestwhere}
       ORDER BY CASE status
                    WHEN 'new' THEN 1
                    WHEN 'reviewing' THEN 2
                    WHEN 'needs_alternative' THEN 3
                    WHEN 'transferred' THEN 4
                    ELSE 5
                END,
                timecreated DESC",
        $requestparams,
        0,
        50
    );
}

echo $OUTPUT->header();
?>
<style>
body.pqh-intake-requests-page header,body.pqh-intake-requests-page footer,body.pqh-intake-requests-page nav.navbar,body.pqh-intake-requests-page #page-header,body.pqh-intake-requests-page #page-footer,body.pqh-intake-requests-page .drawer,body.pqh-intake-requests-page .drawer-toggles,body.pqh-intake-requests-page .block-region,body.pqh-intake-requests-page [data-region="drawer"],body.pqh-intake-requests-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-intake-requests-page #page,body.pqh-intake-requests-page #page-content,body.pqh-intake-requests-page #region-main,body.pqh-intake-requests-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqir-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqir-wrap{max-width:1240px;margin:0 auto}.pqir-top,.pqir-card,.pqir-filterbar{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqir-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqir-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqir-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqir-actions{display:flex;flex-wrap:wrap;gap:9px}.pqir-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqir-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqir-btn--brown{background:#7a5637}.pqir-btn--red{background:#9c392b}.pqir-filterbar{display:grid;grid-template-columns:minmax(260px,1fr) 220px auto auto;gap:10px;align-items:end;padding:14px;margin-bottom:14px}.pqir-results{margin:0 0 12px;color:#5e7280;font-size:13px;font-weight:850}.pqir-card{padding:18px;margin-bottom:14px}.pqir-cardhead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.pqir-card h2{margin:0;font-size:21px;font-weight:950}.pqir-meta{margin-top:5px;color:#5e7280;font-size:13px;font-weight:850}.pqir-pill{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044;white-space:nowrap}.pqir-pill--new{background:#fff4dc;color:#7a5637}.pqir-pill--ok{background:#edf9ef;color:#245c35}.pqir-pill--bad{background:#fff0ed;color:#883526}.pqir-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pqir-box{padding:11px;border:1px solid rgba(23,48,68,.1);border-radius:9px;background:#fbfdff;font-weight:850}.pqir-box strong{display:block;margin-bottom:4px;color:#7a5637}.pqir-suggestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.pqir-suggestion{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:9px;background:#f8fbfd}.pqir-suggestion strong{display:block;font-size:14px}.pqir-suggestion span{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-weight:850}.pqir-form{display:grid;grid-template-columns:180px 180px 1fr auto auto;gap:8px;align-items:end;margin-top:12px;padding-top:12px;border-top:1px solid rgba(23,48,68,.1)}.pqir-field{display:grid;gap:5px}.pqir-field label{font-size:12px;font-weight:900;color:#415665}.pqir-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:7px 9px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}.pqir-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqir-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqir-alert--ok{background:#edf9ef;color:#245c35}.pqir-alert--bad{background:#fff0ed;color:#883526}
@media(max-width:980px){.pqir-top{display:block}.pqir-actions{margin-top:12px}.pqir-filterbar,.pqir-grid,.pqir-suggestions{grid-template-columns:1fr}.pqir-form{grid-template-columns:1fr}.pqir-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqir-shell">
  <div class="pqir-wrap">
    <section class="pqir-top pqh-workspace-top">
      <div>
        <h1 class="pqir-title pqh-workspace-title">Public Intake Requests</h1>
        <p class="pqir-sub pqh-workspace-sub">Review parent-submitted live-class preferences, choose a likely group, and transfer accepted students into the Moodle intake flow.</p>
      </div>
      <div class="pqir-actions pqh-workspace-actions">
        <a class="pqir-btn pqir-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/public_intake.php'))->out(false); ?>">Public form</a>
        <a class="pqir-btn pqir-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php'))->out(false); ?>">Student intake</a>
        <a class="pqir-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqir-alert pqir-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqir-alert pqir-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqir-card"><div class="pqir-empty">Public intake request table is not ready. Run the local_prequran upgrade or create the intake request table first.</div></section>
    <?php else: ?>
      <form class="pqir-filterbar" method="get" action="<?php echo (new moodle_url('/local/hubredirect/intake_requests.php'))->out(false); ?>">
        <?php foreach ($baseparams as $key => $value): ?>
          <input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>">
        <?php endforeach; ?>
        <div class="pqir-field">
          <label for="pqir-q">Search requests</label>
          <input id="pqir-q" class="pqir-input" name="q" value="<?php echo s($filterquery); ?>" placeholder="Student, parent, email, phone, level, notes">
        </div>
        <div class="pqir-field">
          <label for="pqir-status">Status filter</label>
          <select id="pqir-status" class="pqir-input" name="status">
            <option value="">All statuses</option>
            <?php foreach ($statusoptions as $status): ?>
              <option value="<?php echo s($status); ?>"<?php echo $filterstatus === $status ? ' selected' : ''; ?>><?php echo s(pqireq_status_label($status)); ?> (<?php echo (int)($statuscounts[$status] ?? 0); ?>)</option>
            <?php endforeach; ?>
          </select>
        </div>
        <button class="pqir-btn" type="submit">Apply filters</button>
        <a class="pqir-btn pqir-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/intake_requests.php', $baseparams))->out(false); ?>">Clear</a>
      </form>
      <p class="pqir-results"><?php echo count($requests); ?> request(s) shown<?php echo $filterstatus !== '' ? ' / ' . s(pqireq_status_label($filterstatus)) : ''; ?><?php echo $filterquery !== '' ? ' / search: ' . s($filterquery) : ''; ?></p>
      <?php if (!$requests): ?>
        <section class="pqir-card"><div class="pqir-empty">No public intake requests match the current filters.</div></section>
      <?php endif; ?>
      <?php foreach ($requests as $request): ?>
        <?php $suggestions = pqireq_group_suggestions($request); ?>
        <article class="pqir-card">
          <div class="pqir-cardhead">
            <div>
              <h2><?php echo s((string)$request->student_display_name ?: trim((string)$request->student_firstname . ' ' . (string)$request->student_lastname)); ?></h2>
              <div class="pqir-meta">Request #<?php echo (int)$request->id; ?> - <?php echo userdate((int)$request->timecreated); ?> - Parent: <?php echo s((string)$request->parent_name); ?>, <?php echo s((string)$request->parent_email); ?></div>
            </div>
            <span class="pqir-pill <?php echo (string)$request->status === 'new' ? 'pqir-pill--new' : ((string)$request->status === 'transferred' ? 'pqir-pill--ok' : ''); ?>"><?php echo s(pqireq_status_label((string)$request->status)); ?></span>
          </div>

          <div class="pqir-grid">
            <div class="pqir-box"><strong>Student</strong>Age <?php echo (int)$request->age_years; ?>, <?php echo s((string)$request->gender); ?><br>Special Needs: <?php echo s((string)($request->special_needs ?? '') ?: 'Not set'); ?><br><?php echo s((string)$request->country); ?>, <?php echo s((string)$request->city); ?></div>
            <div class="pqir-box"><strong>Placement</strong><?php echo s((string)($options['course_types'][(string)($request->course_type ?? '')] ?? (($request->course_type ?? '') ?: 'Not set'))); ?><br><?php echo s((string)$request->current_level); ?><br><?php echo s((string)$request->learning_base); ?></div>
            <div class="pqir-box"><strong>Language</strong><?php echo s((string)$request->primary_language); ?><?php if ((string)$request->other_languages !== ''): ?><br>Also: <?php echo s((string)$request->other_languages); ?><?php endif; ?></div>
            <div class="pqir-box"><strong>Parent / emergency</strong><?php echo s((string)$request->parent_name); ?><?php $relationship = (string)($request->parent_relationship ?? ''); ?><?php if ($relationship !== ''): ?><br><?php echo s((string)($options['parent_relationships'][$relationship] ?? $relationship)); ?><?php if ($relationship === 'other' && trim((string)($request->parent_relationship_other ?? '')) !== ''): ?>: <?php echo s((string)$request->parent_relationship_other); ?><?php endif; ?><?php endif; ?><br><?php echo s((string)$request->parent_phone); ?><?php if (trim((string)($request->emergency_contact_name ?? '')) !== '' || trim((string)($request->emergency_contact_phone ?? '')) !== ''): ?><br>Emergency: <?php echo s(trim((string)($request->emergency_contact_name ?? ''))); ?> <?php echo s(trim((string)($request->emergency_contact_phone ?? ''))); ?><?php endif; ?></div>
            <div class="pqir-box"><strong>Schedule</strong><?php echo s((string)$request->timezone); ?><br><?php echo s((string)$request->availability_summary); ?></div>
            <div class="pqir-box"><strong>Consent</strong>Live class: <?php echo (int)$request->live_class_consent === 1 ? 'Yes' : 'No'; ?><br>Recording: <?php echo (int)$request->recording_consent === 1 ? 'Yes' : 'No'; ?></div>
            <div class="pqir-box"><strong>Transfer</strong><?php echo (int)$request->transferred_userid > 0 ? 'Moodle student ID ' . (int)$request->transferred_userid . '<br>' . s(pqh_account_no_label((int)$request->transferred_userid)) : 'Not transferred yet'; ?></div>
            <?php if (trim((string)$request->parent_preferences) !== '' || trim((string)$request->admin_notes) !== ''): ?>
              <div class="pqir-box"><strong>Marketplace / parent notes</strong><?php echo s(trim((string)$request->parent_preferences)); ?><?php if (trim((string)$request->admin_notes) !== ''): ?><br><?php echo s(trim((string)$request->admin_notes)); ?><?php endif; ?></div>
            <?php endif; ?>
          </div>

          <div class="pqir-suggestions">
            <?php if (!$suggestions): ?>
              <div class="pqir-empty">No active class group suggestions yet. Create groups in Student Grouping, or mark this request as needing an alternative time.</div>
            <?php else: ?>
              <?php foreach ($suggestions as $group): ?>
                <div class="pqir-suggestion">
                  <strong><?php echo s((string)$group->title); ?> <span class="pqir-pill"><?php echo (int)$group->match_score; ?>%</span></strong>
                  <span><?php echo s((string)$group->schedule_summary); ?></span>
                  <span><?php echo s((string)($options['course_types'][(string)($group->course_type ?? '')] ?? (($group->course_type ?? '') ?: 'Course not set'))); ?> - <?php echo s((string)$group->timezone); ?> - <?php echo s((string)$group->language); ?> - <?php echo s((string)$group->current_level); ?> - Seats open: <?php echo (int)$group->open_seats; ?></span>
                  <span>Match: <?php echo s((string)$group->match_reasons); ?></span>
                </div>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>

          <form class="pqir-form" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="requestid" value="<?php echo (int)$request->id; ?>">
            <div class="pqir-field">
              <label>Status</label>
              <select class="pqir-input" name="status">
                <?php foreach (['new', 'reviewing', 'needs_alternative', 'rejected', 'transferred'] as $status): ?>
                  <option value="<?php echo s($status); ?>"<?php echo (string)$request->status === $status ? ' selected' : ''; ?>><?php echo s(pqireq_status_label($status)); ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="pqir-field">
              <label>Matched group ID</label>
              <?php if ($suggestions): ?>
                <select class="pqir-input" name="matched_groupid">
                  <option value="0">No group selected</option>
                  <?php foreach ($suggestions as $group): ?>
                    <option value="<?php echo (int)$group->id; ?>"<?php echo (int)$request->matched_groupid === (int)$group->id ? ' selected' : ''; ?>>#<?php echo (int)$group->id; ?> - <?php echo s((string)$group->title); ?> (<?php echo (int)$group->match_score; ?>%)</option>
                  <?php endforeach; ?>
                </select>
              <?php else: ?>
                <input class="pqir-input" name="matched_groupid" type="number" min="0" value="<?php echo (int)$request->matched_groupid; ?>">
              <?php endif; ?>
            </div>
            <div class="pqir-field">
              <label>Admin notes</label>
              <input class="pqir-input" name="admin_notes" value="<?php echo s((string)$request->admin_notes); ?>" placeholder="Alternative offered, parent contacted, placement note">
            </div>
            <button class="pqir-btn pqir-btn--light" type="submit" name="action" value="save_review">Save review</button>
            <button class="pqir-btn pqir-btn--brown" type="submit" name="action" value="load_intake">Load into intake</button>
          </form>
        </article>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
