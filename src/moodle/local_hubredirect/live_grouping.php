<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Choose a school workspace you manage before using student grouping.',
        new moodle_url('/local/hubredirect/workspaces.php'),
        'Student grouping access required'
    );
}
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

$pqlgrpoptions = require(__DIR__ . '/student_intake_config.php');

function pqlgrp_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlgrp_table_has_field(string $table, string $field): bool {
    global $DB;
    if (!pqlgrp_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqlgrp_required_ready(): bool {
    return pqlgrp_table_exists('local_prequran_student_profile')
        && pqlgrp_table_exists('local_prequran_group_pool')
        && pqlgrp_table_exists('local_prequran_class_group')
        && pqlgrp_table_exists('local_prequran_group_member');
}

function pqlgrp_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlgrp_teacher_profiles(int $workspaceid): array {
    global $DB;

    if (!pqlgrp_table_exists('local_prequran_teacher_profile')) {
        return [];
    }

    $where = "u.deleted = 0
            AND u.suspended = 0
            AND tp.status IN ('active', 'pending')";
    $params = [];
    if ($workspaceid > 0) {
        $workspacechecks = [];
        if (pqlgrp_table_has_field('local_prequran_teacher_profile', 'workspaceid')) {
            $workspacechecks[] = 'tp.workspaceid = :profileworkspaceid';
            $params['profileworkspaceid'] = $workspaceid;
        }
        if (pqlgrp_table_exists('local_prequran_workspace_member')) {
            $workspacechecks[] = "EXISTS (
                SELECT 1
                  FROM {local_prequran_workspace_member} wm
                 WHERE wm.userid = tp.userid
                   AND wm.workspaceid = :memberworkspaceid
                   AND wm.status = :memberstatus
                   AND wm.workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')
            )";
            $params['memberworkspaceid'] = $workspaceid;
            $params['memberstatus'] = 'active';
        }
        if ($workspacechecks) {
            $where .= ' AND (' . implode(' OR ', $workspacechecks) . ')';
        }
    }

    return $DB->get_records_sql(
        "SELECT tp.userid AS teacherkey,
                tp.*,
                u.firstname,
                u.lastname,
                u.username
           FROM {local_prequran_teacher_profile} tp
           JOIN {user} u ON u.id = tp.userid
          WHERE {$where}
       ORDER BY tp.status ASC, tp.teacher_display_name ASC, u.firstname ASC, u.lastname ASC",
        $params
    );
}

function pqlgrp_teacher_label($teacher): string {
    $name = trim((string)($teacher->teacher_display_name ?? ''));
    if ($name === '') {
        $name = trim((string)($teacher->firstname ?? '') . ' ' . (string)($teacher->lastname ?? ''));
    }
    if ($name === '') {
        $name = 'Teacher ' . (int)$teacher->userid;
    }

    $meta = [];
    if (!empty($teacher->username)) {
        $meta[] = (string)$teacher->username;
    }
    if (!empty($teacher->timezone)) {
        $meta[] = (string)$teacher->timezone;
    }
    if (!empty($teacher->primary_language)) {
        $meta[] = (string)$teacher->primary_language;
    }
    if (!empty($teacher->status) && (string)$teacher->status !== 'active') {
        $meta[] = (string)$teacher->status;
    }

    return $name . ($meta ? ' - ' . implode(' / ', $meta) : '');
}

function pqlgrp_teacher_capacity_counts(int $workspaceid): array {
    global $DB;

    if (!pqlgrp_table_exists('local_prequran_class_group')) {
        return [];
    }

    $where = "teacherid > 0
            AND status IN ('open', 'active')";
    $params = [];
    if ($workspaceid > 0 && pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $where .= ' AND workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    $records = $DB->get_records_sql(
        "SELECT teacherid, COUNT(1) AS group_count
           FROM {local_prequran_class_group}
          WHERE {$where}
       GROUP BY teacherid",
        $params
    );

    $counts = [];
    foreach ($records as $record) {
        $counts[(int)$record->teacherid] = (int)$record->group_count;
    }
    return $counts;
}

function pqlgrp_teacher_availability_counts(): array {
    global $DB;

    if (!pqlgrp_table_exists('local_prequran_live_availability')) {
        return [];
    }

    $records = $DB->get_records_sql(
        "SELECT teacherid, COUNT(1) AS slot_count
           FROM {local_prequran_live_availability}
          WHERE teacherid > 0
            AND status <> 'inactive'
       GROUP BY teacherid"
    );

    $counts = [];
    foreach ($records as $record) {
        $counts[(int)$record->teacherid] = (int)$record->slot_count;
    }
    return $counts;
}

function pqlgrp_text_matches(string $source, string $needle): bool {
    $source = pqlgrp_normal($source);
    $needle = pqlgrp_normal($needle);
    if ($source === '' || $needle === '') {
        return false;
    }
    return strpos($source, $needle) !== false || strpos($needle, $source) !== false;
}

function pqlgrp_teacher_match_score($teacher, ?object $criteria, array $capacitycounts, array $availabilitycounts): array {
    if (!$criteria) {
        return [0, ['available teacher']];
    }

    $score = 0;
    $reasons = [];
    $teacherid = (int)$teacher->userid;

    if (($teacher->status ?? '') === 'active') {
        $score += 10;
        $reasons[] = 'active';
    } elseif (($teacher->status ?? '') === 'pending') {
        $score -= 8;
        $reasons[] = 'pending profile';
    }

    $course = (string)($criteria->course_type ?? '');
    $teachercourses = (string)($teacher->course_type ?? '') . ' ' . (string)($teacher->courses ?? '');
    if ($course !== '' && pqlgrp_text_matches($teachercourses, $course)) {
        $score += 18;
        $reasons[] = 'course';
    } elseif ($course !== '' && trim($teachercourses) === '') {
        $score += 5;
        $reasons[] = 'course neutral';
    }

    $timezone = (string)($criteria->timezone ?? '');
    $teachertimezone = (string)($teacher->timezone ?? '');
    if ($timezone !== '' && pqlgrp_normal($timezone) === pqlgrp_normal($teachertimezone)) {
        $score += 24;
        $reasons[] = 'timezone';
    } elseif ($timezone !== '' && $teachertimezone !== '') {
        $groupregion = strtok($timezone, '/');
        $teacherregion = strtok($teachertimezone, '/');
        if ($groupregion && $teacherregion && pqlgrp_normal($groupregion) === pqlgrp_normal($teacherregion)) {
            $score += 10;
            $reasons[] = 'timezone region';
        }
    }

    $language = (string)($criteria->language ?? '');
    $teacherlanguages = (string)($teacher->primary_language ?? '') . ' ' . (string)($teacher->language ?? '') . ' ' . (string)($teacher->other_languages ?? '');
    if ($language !== '' && pqlgrp_text_matches($teacherlanguages, $language)) {
        $score += 20;
        $reasons[] = 'language';
    }

    $level = (string)($criteria->current_level ?? $criteria->level_min ?? '');
    $teacherlevels = (string)($teacher->current_level ?? '') . ' ' . (string)($teacher->level_min ?? '') . ' ' . (string)($teacher->level_max ?? '') . ' ' . (string)($teacher->levels ?? '');
    if ($level !== '' && pqlgrp_text_matches($teacherlevels, $level)) {
        $score += 15;
        $reasons[] = 'level';
    } elseif ($level !== '' && trim($teacherlevels) === '') {
        $score += 4;
        $reasons[] = 'level neutral';
    }

    $base = (string)($criteria->learning_base ?? '');
    $teacherbase = (string)($teacher->learning_base ?? '') . ' ' . (string)($teacher->base_of_learning ?? '');
    if ($base !== '' && pqlgrp_text_matches($teacherbase, $base)) {
        $score += 8;
        $reasons[] = 'learning base';
    } elseif ($base !== '' && trim($teacherbase) === '') {
        $score += 3;
    }

    $genderpolicy = pqlgrp_normal((string)($criteria->gender_policy ?? 'flexible'));
    $teachergender = pqlgrp_normal((string)($teacher->gender ?? ''));
    if ($genderpolicy === 'flexible' || $genderpolicy === 'mixed') {
        $score += 4;
    } elseif ($teachergender !== '' && $genderpolicy === $teachergender) {
        $score += 8;
        $reasons[] = 'gender policy';
    }

    $country = (string)($criteria->country ?? '');
    if ($country !== '' && pqlgrp_text_matches((string)($teacher->country ?? ''), $country)) {
        $score += 4;
        $reasons[] = 'country';
    }

    $city = (string)($criteria->city ?? '');
    if ($city !== '' && pqlgrp_text_matches((string)($teacher->city ?? ''), $city)) {
        $score += 3;
        $reasons[] = 'city';
    }

    $schedule = (string)($criteria->schedule_preferences ?? '') . ' ' . (string)($criteria->schedule_summary ?? '');
    $teacheravailability = (string)($teacher->availability ?? '') . ' ' . (string)($teacher->schedule_preferences ?? '');
    if (!empty($availabilitycounts[$teacherid])) {
        $score += 10;
        $reasons[] = 'availability set';
    }
    if ($schedule !== '' && $teacheravailability !== '' && pqlgrp_text_matches($teacheravailability, $schedule)) {
        $score += 10;
        $reasons[] = 'schedule notes';
    }

    $groupcount = $capacitycounts[$teacherid] ?? 0;
    if ($groupcount <= 1) {
        $score += 8;
        $reasons[] = 'capacity';
    } elseif ($groupcount <= 3) {
        $score += 4;
        $reasons[] = 'some capacity';
    }

    $score = max(0, min(100, $score));
    if (!$reasons) {
        $reasons[] = 'limited matching data';
    }

    return [$score, array_slice(array_values(array_unique($reasons)), 0, 5)];
}

function pqlgrp_ranked_teacher_options(?object $criteria = null, ?array $teachers = null, int $workspaceid = 0): array {
    $teachers = $teachers ?? pqlgrp_teacher_profiles($workspaceid);
    $capacitycounts = pqlgrp_teacher_capacity_counts($workspaceid);
    $availabilitycounts = pqlgrp_teacher_availability_counts();
    $ranked = [];

    foreach ($teachers as $teacher) {
        [$score, $reasons] = pqlgrp_teacher_match_score($teacher, $criteria, $capacitycounts, $availabilitycounts);
        $label = pqlgrp_teacher_label($teacher);
        if ($criteria) {
            $label .= ' - ' . $score . '% match - ' . implode(', ', $reasons);
        }
        $ranked[] = [
            'userid' => (int)$teacher->userid,
            'label' => $label,
            'score' => $score,
            'reasons' => implode(', ', $reasons),
        ];
    }

    usort($ranked, static function(array $a, array $b): int {
        $scorecmp = $b['score'] <=> $a['score'];
        return $scorecmp !== 0 ? $scorecmp : strcmp($a['label'], $b['label']);
    });

    $options = [];
    foreach ($ranked as $teacher) {
        $options[(string)$teacher['userid']] = $teacher['label'];
    }

    return [$options, $ranked];
}

function pqlgrp_teacher_options(): array {
    global $workspaceid;
    [$options] = pqlgrp_ranked_teacher_options(null, null, (int)$workspaceid);
    return $options;
}

function pqlgrp_teacher_link_data(array $teachers): array {
    $links = [];
    foreach ($teachers as $teacher) {
        $teacherid = (int)($teacher->userid ?? 0);
        if ($teacherid <= 0) {
            continue;
        }
        $links[(string)$teacherid] = [
            'profile' => (new moodle_url('/local/hubredirect/live_teacher_profile.php', ['teacherid' => $teacherid]))->out(false),
            'availability' => (new moodle_url('/local/hubredirect/live_availability.php', ['teacherid' => $teacherid]))->out(false),
            'classes' => (new moodle_url('/local/hubredirect/teacher_workspace.php', ['teacherid' => $teacherid]))->out(false),
            'directory' => (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false),
            'moodle' => (new moodle_url('/user/profile.php', ['id' => $teacherid]))->out(false),
        ];
    }
    return $links;
}

function pqlgrp_trim_param(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqlgrp_email_param(string $name): string {
    return trim(optional_param($name, '', PARAM_EMAIL));
}

function pqlgrp_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqlgrp_table_exists('local_prequran_student_profile') ? $DB->get_columns('local_prequran_student_profile') : [];
    }
    return $columns;
}

function pqlgrp_profile_has_field(string $field): bool {
    $columns = pqlgrp_profile_columns();
    return isset($columns[$field]);
}

function pqlgrp_set_profile_field(stdClass $record, string $field, $value): void {
    if (pqlgrp_profile_has_field($field)) {
        $record->{$field} = $value;
    }
}

function pqlgrp_select(string $name, array $options, string $selected = '', bool $required = false): string {
    $html = '<select class="pqlgrp-select" name="' . s($name) . '"' . ($required ? ' required' : '') . '>';
    $html .= '<option value="">Select</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . ((string)$selected === (string)$value ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    return $html . '</select>';
}

function pqlgrp_profile_age_band(int $age): string {
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

function pqlgrp_normal(string $value): string {
    return core_text::strtolower(trim($value));
}

function pqlgrp_match_score($profile, $group): array {
    $score = 0;
    $details = [];

    if (pqlgrp_normal((string)($profile->course_type ?? '')) !== '' && pqlgrp_normal((string)($profile->course_type ?? '')) === pqlgrp_normal((string)($group->course_type ?? ''))) {
        $score += 20;
        $details[] = 'course';
    }
    if (pqlgrp_normal((string)$profile->timezone) !== '' && pqlgrp_normal((string)$profile->timezone) === pqlgrp_normal((string)$group->timezone)) {
        $score += 30;
        $details[] = 'timezone';
    }
    if (pqlgrp_normal((string)$profile->current_level) !== '' && pqlgrp_normal((string)$profile->current_level) === pqlgrp_normal((string)$group->current_level)) {
        $score += 25;
        $details[] = 'level';
    }
    if (pqlgrp_normal((string)$profile->learning_base) !== '' && pqlgrp_normal((string)$profile->learning_base) === pqlgrp_normal((string)$group->learning_base)) {
        $score += 15;
        $details[] = 'learning_base';
    }
    $age = (int)$profile->age_years;
    if ($age > 0 && $age >= (int)$group->age_min && $age <= (int)$group->age_max) {
        $score += 10;
        $details[] = 'age';
    }
    if (pqlgrp_normal((string)$profile->language) !== '' && pqlgrp_normal((string)$profile->language) === pqlgrp_normal((string)$group->language)) {
        $score += 10;
        $details[] = 'language';
    }
    $genderpolicy = pqlgrp_normal((string)$group->gender_policy);
    $gender = pqlgrp_normal((string)$profile->gender);
    if ($genderpolicy === 'flexible' || $genderpolicy === 'mixed' || ($gender !== '' && $genderpolicy === $gender)) {
        $score += 5;
        $details[] = 'gender';
    }
    if (pqlgrp_normal((string)$profile->country) !== '' && pqlgrp_normal((string)$profile->country) === pqlgrp_normal((string)($group->country ?? ''))) {
        $score += 3;
        $details[] = 'country';
    }
    if (pqlgrp_normal((string)$profile->city) !== '' && pqlgrp_normal((string)$profile->city) === pqlgrp_normal((string)($group->city ?? ''))) {
        $score += 2;
        $details[] = 'city';
    }

    $status = $score >= 80 ? 'best_match' : ($score >= 60 ? 'good_match' : ($score >= 40 ? 'review' : 'weak_match'));
    return [min(100, $score), $status, implode(', ', $details)];
}

function pqlgrp_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqlgrp_table_exists('local_prequran_live_audit')) {
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

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_grouping.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Grouping');
$PAGE->set_heading('Student Grouping');
$PAGE->add_body_class('pqh-live-grouping-page');

$ready = pqlgrp_required_ready();
$message = '';
$error = '';
$now = time();

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This grouping form expired. Please refresh and try again.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action === '') {
            throw new invalid_parameter_exception('Choose a valid grouping action.');
        }
        if ($action === 'save_profile') {
            $userid = optional_param('userid', 0, PARAM_INT);
            if ($userid <= 0) {
                throw new invalid_parameter_exception('Choose a valid student before saving the profile.');
            }
            $age = max(0, min(25, optional_param('age_years', 0, PARAM_INT)));
            $primarylanguage = pqlgrp_trim_param('primary_language');
            $otherlanguages = pqlgrp_trim_param('language');
            $language = $primarylanguage !== '' ? $primarylanguage : $otherlanguages;
            $record = (object)[
                'userid' => $userid,
                'timezone' => pqlgrp_trim_param('timezone', 'UTC'),
                'language' => $language,
                'age_years' => $age,
                'age_band' => pqlgrp_profile_age_band($age),
                'current_level' => pqlgrp_trim_param('current_level'),
                'learning_base' => pqlgrp_trim_param('learning_base'),
                'country' => pqlgrp_trim_param('country'),
                'city' => pqlgrp_trim_param('city'),
                'gender' => pqlgrp_trim_param('gender'),
                'availability' => pqlgrp_trim_param('availability'),
                'parent_preferences' => pqlgrp_trim_param('parent_preferences'),
                'status' => pqlgrp_trim_param('status', 'active'),
                'timemodified' => $now,
            ];
            pqlgrp_set_profile_field($record, 'student_display_name', pqlgrp_trim_param('student_display_name'));
            pqlgrp_set_profile_field($record, 'date_of_birth', pqlgrp_trim_param('date_of_birth'));
            pqlgrp_set_profile_field($record, 'primary_language', $primarylanguage);
            pqlgrp_set_profile_field($record, 'special_needs', pqlgrp_trim_param('special_needs', 'no'));
            pqlgrp_set_profile_field($record, 'course_type', pqlgrp_trim_param('course_type', 'pre_quraan'));
            pqlgrp_set_profile_field($record, 'parent_name', pqlgrp_trim_param('parent_name'));
            pqlgrp_set_profile_field($record, 'parent_email', pqlgrp_email_param('parent_email'));
            pqlgrp_set_profile_field($record, 'parent_phone', pqlgrp_trim_param('parent_phone'));
            pqlgrp_set_profile_field($record, 'live_class_consent', optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0);
            pqlgrp_set_profile_field($record, 'recording_consent', optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0);
            pqlgrp_set_profile_field($record, 'consent_notes', pqlgrp_trim_param('consent_notes'));
            pqlgrp_set_profile_field($record, 'workspaceid', $workspaceid);
            $existingselect = ['userid' => $userid];
            if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
                $existingselect['workspaceid'] = $workspaceid;
            }
            $existing = $DB->get_record('local_prequran_student_profile', $existingselect);
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_student_profile', $record);
                $profileid = (int)$existing->id;
            } else {
                $record->createdby = (int)$USER->id;
                $record->timecreated = $now;
                $profileid = (int)$DB->insert_record('local_prequran_student_profile', $record);
            }
            pqlgrp_audit('grouping_profile_saved', 'student', $userid, [
                'profileid' => $profileid,
                'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
                'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
            ]);
            $message = 'Student intake profile saved.';
        } elseif ($action === 'create_pool') {
            $record = (object)[
                'title' => pqlgrp_trim_param('title'),
                'course_type' => pqlgrp_trim_param('course_type', 'pre_quraan'),
                'timezone' => pqlgrp_trim_param('timezone', 'UTC'),
                'language' => pqlgrp_trim_param('language'),
                'age_min' => max(0, min(25, optional_param('age_min', 0, PARAM_INT))),
                'age_max' => max(1, min(99, optional_param('age_max', 99, PARAM_INT))),
                'level_min' => pqlgrp_trim_param('level_min'),
                'level_max' => pqlgrp_trim_param('level_max'),
                'learning_base' => pqlgrp_trim_param('learning_base'),
                'country' => pqlgrp_trim_param('country'),
                'city' => pqlgrp_trim_param('city'),
                'gender_policy' => pqlgrp_trim_param('gender_policy', 'flexible'),
                'schedule_preferences' => pqlgrp_trim_param('schedule_preferences'),
                'rule_notes' => pqlgrp_trim_param('rule_notes'),
                'max_students' => max(1, min(15, optional_param('max_students', 9, PARAM_INT))),
                'status' => 'active',
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            $id = (int)$DB->insert_record('local_prequran_group_pool', $record);
            pqlgrp_audit('grouping_pool_created', 'pool', $id, ['title' => $record->title]);
            $message = 'Matching pool created.';
        } elseif ($action === 'create_group') {
            $poolid = optional_param('poolid', 0, PARAM_INT);
            $pool = $poolid > 0 ? $DB->get_record('local_prequran_group_pool', ['id' => $poolid]) : null;
            if ($pool && pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')
                    && (int)($pool->workspaceid ?? 0) > 0
                    && (int)$pool->workspaceid !== $workspaceid) {
                throw new invalid_parameter_exception('Choose a matching pool from the selected school workspace.');
            }
            $record = (object)[
                'poolid' => $poolid,
                'teacherid' => optional_param('teacherid', 0, PARAM_INT),
                'title' => pqlgrp_trim_param('title', $pool ? (string)$pool->title : ''),
                'course_type' => pqlgrp_trim_param('course_type', $pool ? (string)($pool->course_type ?? 'pre_quraan') : 'pre_quraan'),
                'timezone' => pqlgrp_trim_param('timezone', $pool ? (string)$pool->timezone : 'UTC'),
                'language' => pqlgrp_trim_param('language', $pool ? (string)$pool->language : ''),
                'current_level' => pqlgrp_trim_param('current_level', $pool ? (string)$pool->level_min : ''),
                'learning_base' => pqlgrp_trim_param('learning_base', $pool ? (string)$pool->learning_base : ''),
                'country' => pqlgrp_trim_param('country', $pool ? (string)$pool->country : ''),
                'city' => pqlgrp_trim_param('city', $pool ? (string)$pool->city : ''),
                'age_min' => max(0, min(25, optional_param('age_min', $pool ? (int)$pool->age_min : 0, PARAM_INT))),
                'age_max' => max(1, min(99, optional_param('age_max', $pool ? (int)$pool->age_max : 99, PARAM_INT))),
                'gender_policy' => pqlgrp_trim_param('gender_policy', $pool ? (string)$pool->gender_policy : 'flexible'),
                'schedule_summary' => pqlgrp_trim_param('schedule_summary', $pool ? (string)$pool->schedule_preferences : ''),
                'max_students' => max(1, min(15, optional_param('max_students', $pool ? (int)$pool->max_students : 9, PARAM_INT))),
                'status' => 'open',
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            if ((int)$record->teacherid > 0 && !pqh_user_can_teach_in_workspace((int)$record->teacherid, $workspaceid)) {
                throw new invalid_parameter_exception('Choose a teacher assigned to this school workspace.');
            }
            if ((int)$record->teacherid <= 0) {
                [, $automatches] = pqlgrp_ranked_teacher_options($record, null, $workspaceid);
                if ($automatches) {
                    $record->teacherid = (int)$automatches[0]['userid'];
                }
            }
            $id = (int)$DB->insert_record('local_prequran_class_group', $record);
            pqlgrp_audit('class_group_created', 'group', $id, ['title' => $record->title, 'poolid' => $poolid, 'teacherid' => (int)$record->teacherid]);
            $message = 'Class group created.';
        } elseif ($action === 'assign_student') {
            $groupid = optional_param('groupid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $group = $groupid > 0 ? $DB->get_record('local_prequran_class_group', ['id' => $groupid]) : false;
            $profile = $studentid > 0 ? $DB->get_record('local_prequran_student_profile', ['userid' => $studentid]) : false;
            if (!$group) {
                throw new invalid_parameter_exception('Choose a valid class group before assigning a student.');
            }
            if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')
                    && (int)($group->workspaceid ?? 0) > 0
                    && (int)$group->workspaceid !== $workspaceid) {
                throw new invalid_parameter_exception('Choose a class group from the selected school workspace.');
            }
            if (!$profile) {
                throw new invalid_parameter_exception('Choose a valid student profile before assigning a group.');
            }
            if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')
                    && (int)($profile->workspaceid ?? 0) > 0
                    && (int)$profile->workspaceid !== $workspaceid) {
                throw new invalid_parameter_exception('Choose a student from the selected school workspace.');
            }
            [$score, $matchstatus, $details] = pqlgrp_match_score($profile, $group);
            $record = (object)[
                'groupid' => $groupid,
                'poolid' => (int)$group->poolid,
                'studentid' => $studentid,
                'match_score' => $score,
                'match_status' => $matchstatus,
                'assignment_status' => 'active',
                'match_details' => $details,
                'assignedby' => (int)$USER->id,
                'timemodified' => $now,
            ];
            if (pqlgrp_table_has_field('local_prequran_group_member', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            $existing = $DB->get_record('local_prequran_group_member', ['groupid' => $groupid, 'studentid' => $studentid]);
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_group_member', $record);
            } else {
                $record->timecreated = $now;
                $DB->insert_record('local_prequran_group_member', $record);
            }
            pqlgrp_audit('student_assigned_group', 'group', $groupid, ['studentid' => $studentid, 'score' => $score, 'status' => $matchstatus]);
            $message = 'Student assigned to group.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$profilewhere = [];
$profileparams = [];
if ($ready && pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
    $profilewhere[] = 'workspaceid = :workspaceid';
    $profileparams['workspaceid'] = $workspaceid;
}
$poolwhere = [];
$poolparams = [];
if ($ready && pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')) {
    $poolwhere[] = 'workspaceid = :workspaceid';
    $poolparams['workspaceid'] = $workspaceid;
}
$profiles = $ready ? $DB->get_records_select(
    'local_prequran_student_profile',
    $profilewhere ? implode(' AND ', $profilewhere) : '',
    $profileparams,
    'timemodified DESC',
    '*',
    0,
    50
) : [];
$pools = $ready ? $DB->get_records_select(
    'local_prequran_group_pool',
    $poolwhere ? implode(' AND ', $poolwhere) : '',
    $poolparams,
    'timemodified DESC',
    '*',
    0,
    50
) : [];
$teacherprofiles = pqlgrp_teacher_profiles($workspaceid);
$teacherlinks = pqlgrp_teacher_link_data($teacherprofiles);
[$teachers, $teachermatches] = pqlgrp_ranked_teacher_options(null, $teacherprofiles, $workspaceid);
$teacheroptionsbypool = [];
$teachermatchesbypool = [];
$pooldefaults = [];
foreach ($pools as $pool) {
    [$poolteacheroptions, $poolteachermatches] = pqlgrp_ranked_teacher_options($pool, $teacherprofiles, $workspaceid);
    $poolid = (string)$pool->id;
    $teacheroptionsbypool[$poolid] = $poolteacheroptions;
    $teachermatchesbypool[$poolid] = array_slice($poolteachermatches, 0, 5);
    $pooldefaults[$poolid] = [
        'title' => (string)$pool->title,
        'course_type' => (string)($pool->course_type ?? 'pre_quraan'),
        'timezone' => (string)($pool->timezone ?? 'UTC'),
        'language' => (string)($pool->language ?? ''),
        'current_level' => (string)($pool->level_min ?? ''),
        'learning_base' => (string)($pool->learning_base ?? ''),
        'country' => (string)($pool->country ?? ''),
        'city' => (string)($pool->city ?? ''),
        'gender_policy' => (string)($pool->gender_policy ?? 'flexible'),
        'age_min' => (string)($pool->age_min ?? 0),
        'age_max' => (string)($pool->age_max ?? 99),
        'max_students' => (string)($pool->max_students ?? 9),
        'schedule_summary' => (string)($pool->schedule_preferences ?? ''),
    ];
}
$groups = [];
$recommendations = [];
$metrics = ['profiles' => 0, 'pools' => 0, 'groups' => 0, 'ungrouped' => 0];

if ($ready) {
    $groupwhere = '';
    $groupparams = [];
    if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $groupwhere = 'WHERE g.workspaceid = :workspaceid';
        $groupparams['workspaceid'] = $workspaceid;
    }
    $groups = $DB->get_records_sql(
        "SELECT g.*,
                COALESCE(gmc.active_students, 0) AS active_students
           FROM {local_prequran_class_group} g
      LEFT JOIN (
                SELECT groupid, COUNT(1) AS active_students
                  FROM {local_prequran_group_member}
                 WHERE assignment_status = 'active'
              GROUP BY groupid
                ) gmc ON gmc.groupid = g.id
          {$groupwhere}
       ORDER BY g.timemodified DESC",
        $groupparams,
        0,
        50
    );
    $profilecountwhere = 'status = :status';
    $profilecountparams = ['status' => 'active'];
    if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
        $profilecountwhere .= ' AND workspaceid = :workspaceid';
        $profilecountparams['workspaceid'] = $workspaceid;
    }
    $poolcountwhere = 'status = :status';
    $poolcountparams = ['status' => 'active'];
    if (pqlgrp_table_has_field('local_prequran_group_pool', 'workspaceid')) {
        $poolcountwhere .= ' AND workspaceid = :workspaceid';
        $poolcountparams['workspaceid'] = $workspaceid;
    }
    $groupcountwhere = "status IN ('open', 'active')";
    $groupcountparams = [];
    if (pqlgrp_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $groupcountwhere .= ' AND workspaceid = :workspaceid';
        $groupcountparams['workspaceid'] = $workspaceid;
    }
    $metrics['profiles'] = $DB->count_records_select('local_prequran_student_profile', $profilecountwhere, $profilecountparams);
    $metrics['pools'] = $DB->count_records_select('local_prequran_group_pool', $poolcountwhere, $poolcountparams);
    $metrics['groups'] = $DB->count_records_select('local_prequran_class_group', $groupcountwhere, $groupcountparams);
    $ungroupedworkspace = '';
    $ungroupedparams = ['workspaceid' => $workspaceid];
    if (pqlgrp_table_has_field('local_prequran_student_profile', 'workspaceid')) {
        $ungroupedworkspace = 'AND sp.workspaceid = :workspaceid';
    }
    $metrics['ungrouped'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_student_profile} sp
          WHERE sp.status = 'active'
            {$ungroupedworkspace}
            AND NOT EXISTS (
                SELECT 1
                  FROM {local_prequran_group_member} gm
                 WHERE gm.studentid = sp.userid
                   AND gm.assignment_status = 'active'
            )",
        $ungroupedworkspace !== '' ? $ungroupedparams : []
    );

    foreach ($profiles as $profile) {
        $best = null;
        foreach ($groups as $group) {
            if ((int)$group->active_students >= (int)$group->max_students) {
                continue;
            }
            [$score, $status, $details] = pqlgrp_match_score($profile, $group);
            if ($best === null || $score > $best['score']) {
                $best = ['student' => $profile, 'group' => $group, 'score' => $score, 'status' => $status, 'details' => $details];
            }
        }
        if ($best !== null) {
            $recommendations[] = $best;
        }
    }
    usort($recommendations, static function(array $a, array $b): int {
        return $b['score'] <=> $a['score'];
    });
    $recommendations = array_slice($recommendations, 0, 20);
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-grouping-page header,body.pqh-live-grouping-page footer,body.pqh-live-grouping-page nav.navbar,body.pqh-live-grouping-page #page-header,body.pqh-live-grouping-page #page-footer,body.pqh-live-grouping-page .drawer,body.pqh-live-grouping-page .drawer-toggles,body.pqh-live-grouping-page .block-region,body.pqh-live-grouping-page [data-region="drawer"],body.pqh-live-grouping-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-grouping-page #page,body.pqh-live-grouping-page #page-content,body.pqh-live-grouping-page #region-main,body.pqh-live-grouping-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlgrp-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlgrp-wrap{max-width:1260px;margin:0 auto}.pqlgrp-top,.pqlgrp-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlgrp-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqlgrp-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqlgrp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqlgrp-actions{display:flex;flex-wrap:wrap;gap:9px}.pqlgrp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqlgrp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqlgrp-btn--brown{background:#7a5637}
.pqlgrp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.pqlgrp-metric{padding:16px;border:1px solid rgba(23,48,68,.1);border-radius:10px;background:#fff}.pqlgrp-num{font-size:26px;font-weight:950;color:#7a5637}.pqlgrp-label{font-size:12px;font-weight:900;color:#5e7280}
.pqlgrp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pqlgrp-panel{padding:18px;margin-bottom:16px}.pqlgrp-panel--wide{grid-column:1/-1}.pqlgrp-panel h2{margin:0 0 12px;font-size:21px;font-weight:950}.pqlgrp-panel h3{margin:16px 0 10px;font-size:15px;font-weight:950;color:#7a5637}.pqlgrp-formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pqlgrp-field{display:grid;gap:6px;margin-bottom:10px}.pqlgrp-field label{font-size:12px;font-weight:900;color:#415665}.pqlgrp-input,.pqlgrp-select,.pqlgrp-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}.pqlgrp-textarea{min-height:78px}.pqlgrp-checkrow{display:flex;gap:10px;align-items:flex-start;margin:8px 0 12px;color:#173044;font-size:13px;font-weight:900}.pqlgrp-checkrow input{width:18px;height:18px;margin-top:1px}.pqlgrp-table{width:100%;border-collapse:collapse}.pqlgrp-table th,.pqlgrp-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;font-size:13px;vertical-align:top}.pqlgrp-table th{font-weight:950;color:#415665;background:#f8fbfd}.pqlgrp-pill{display:inline-flex;align-items:center;justify-content:center;min-height:24px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqlgrp-pill--ok{background:#edf9ef;color:#245c35}.pqlgrp-pill--warn{background:#fff6df;color:#7a5637}.pqlgrp-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqlgrp-alert--ok{background:#edf9ef;color:#245c35}.pqlgrp-alert--bad{background:#fff0ed;color:#883526}.pqlgrp-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlgrp-teacher-match{margin-top:8px;padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#f8fbfd;color:#415665;font-size:12px;font-weight:850;line-height:1.45}.pqlgrp-teacher-match strong{color:#173044}.pqlgrp-teacher-match div+div{margin-top:5px}.pqlgrp-teacher-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.pqlgrp-teacher-links a{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 9px;border:1px solid rgba(23,48,68,.12);border-radius:999px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:11px;font-weight:950}.pqlgrp-teacher-links a:hover{background:#e6f2e8;color:#245c35!important}
@media(max-width:920px){.pqlgrp-top{display:block}.pqlgrp-actions{margin-top:12px}.pqlgrp-grid,.pqlgrp-formgrid,.pqlgrp-metrics{grid-template-columns:1fr}.pqlgrp-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlgrp-shell">
  <div class="pqlgrp-wrap">
    <section class="pqlgrp-top pqh-workspace-top">
      <div>
        <h1 class="pqlgrp-title pqh-workspace-title">Student Grouping</h1>
        <p class="pqlgrp-sub pqh-workspace-sub">Manage student profiles, matching pools, live class groups, and suggested assignments.</p>
      </div>
      <div class="pqlgrp-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlgrp-btn pqlgrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php', $urlparams))->out(false); ?>">New student intake</a>
        <a class="pqlgrp-btn pqlgrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $urlparams))->out(false); ?>">Create session</a>
        <a class="pqlgrp-btn pqlgrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $urlparams))->out(false); ?>">Create series</a>
        <a class="pqlgrp-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php', $urlparams))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqlgrp-alert pqlgrp-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqlgrp-alert pqlgrp-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!$ready): ?>
      <section class="pqlgrp-panel"><div class="pqlgrp-empty">Grouping tables are not ready. Run the Moodle plugin upgrade for local_prequran, then return to this page.</div></section>
    <?php else: ?>
      <section class="pqlgrp-metrics">
        <div class="pqlgrp-metric"><div class="pqlgrp-num"><?php echo (int)$metrics['profiles']; ?></div><div class="pqlgrp-label">active student profiles</div></div>
        <div class="pqlgrp-metric"><div class="pqlgrp-num"><?php echo (int)$metrics['pools']; ?></div><div class="pqlgrp-label">matching pools</div></div>
        <div class="pqlgrp-metric"><div class="pqlgrp-num"><?php echo (int)$metrics['groups']; ?></div><div class="pqlgrp-label">open class groups</div></div>
        <div class="pqlgrp-metric"><div class="pqlgrp-num"><?php echo (int)$metrics['ungrouped']; ?></div><div class="pqlgrp-label">ungrouped active students</div></div>
      </section>

      <section class="pqlgrp-grid">
        <article class="pqlgrp-panel">
          <h2>Student Intake</h2>
          <form method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="save_profile">
            <h3>Student identity</h3>
            <div class="pqlgrp-formgrid">
              <div class="pqlgrp-field"><label>User ID</label><input class="pqlgrp-input" name="userid" type="number" min="1" required></div>
              <div class="pqlgrp-field"><label>Student display name</label><input class="pqlgrp-input" name="student_display_name" placeholder="Optional display name"></div>
              <div class="pqlgrp-field"><label>Course</label><?php echo pqlgrp_select('course_type', $pqlgrpoptions['course_types'] ?? [], 'pre_quraan', true); ?></div>
              <div class="pqlgrp-field"><label>Date of birth</label><input class="pqlgrp-input" name="date_of_birth" type="date"></div>
              <div class="pqlgrp-field"><label>Age</label><input class="pqlgrp-input" name="age_years" type="number" min="0" max="25" required></div>
              <div class="pqlgrp-field"><label>Gender</label><select class="pqlgrp-select" name="gender" required><option value="">Select</option><option value="female">Female</option><option value="male">Male</option></select></div>
              <div class="pqlgrp-field"><label>Special Needs</label><select class="pqlgrp-select" name="special_needs" required><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div class="pqlgrp-field"><label>Status</label><select class="pqlgrp-select" name="status"><option value="active">Active</option><option value="paused">Paused</option></select></div>
            </div>

            <h3>Location and language</h3>
            <div class="pqlgrp-formgrid">
              <div class="pqlgrp-field"><label>Country</label><input class="pqlgrp-input" name="country" required></div>
              <div class="pqlgrp-field"><label>City</label><input class="pqlgrp-input" name="city" required></div>
              <div class="pqlgrp-field"><label>Time zone</label><input class="pqlgrp-input" name="timezone" value="Africa/Nairobi"></div>
              <div class="pqlgrp-field"><label>Primary language</label><input class="pqlgrp-input" name="primary_language" placeholder="Somali" required></div>
              <div class="pqlgrp-field"><label>Other languages</label><input class="pqlgrp-input" name="language" placeholder="English, Arabic"></div>
            </div>

            <h3>Placement</h3>
            <div class="pqlgrp-formgrid">
              <div class="pqlgrp-field"><label>Current level</label><input class="pqlgrp-input" name="current_level" placeholder="alphabet, level_1" required></div>
              <div class="pqlgrp-field"><label>Base of learning</label><input class="pqlgrp-input" name="learning_base" placeholder="new_learner, knows_letters" required></div>
            </div>

            <h3>Schedule</h3>
            <div class="pqlgrp-field"><label>Availability</label><textarea class="pqlgrp-textarea" name="availability" placeholder="Mon/Wed 5 PM, Sat morning, parent notes"></textarea></div>

            <h3>Parent and consent</h3>
            <div class="pqlgrp-formgrid">
              <div class="pqlgrp-field"><label>Parent name</label><input class="pqlgrp-input" name="parent_name" required></div>
              <div class="pqlgrp-field"><label>Parent email</label><input class="pqlgrp-input" name="parent_email" type="email" required></div>
              <div class="pqlgrp-field"><label>Parent phone / WhatsApp</label><input class="pqlgrp-input" name="parent_phone" required></div>
            </div>
            <label class="pqlgrp-checkrow"><input type="checkbox" name="live_class_consent" value="1" required><span>Parent/guardian consents to live interactive classes.</span></label>
            <label class="pqlgrp-checkrow"><input type="checkbox" name="recording_consent" value="1"><span>Parent/guardian consents to class recording when recording policy allows.</span></label>
            <div class="pqlgrp-field"><label>Consent notes/comment</label><textarea class="pqlgrp-textarea" name="consent_notes" placeholder="How consent was collected, who confirmed, and any limits"></textarea></div>
            <div class="pqlgrp-field"><label>Parent preferences</label><textarea class="pqlgrp-textarea" name="parent_preferences" placeholder="Teacher/gender/language preferences"></textarea></div>
            <button class="pqlgrp-btn pqlgrp-btn--brown" type="submit">Save intake profile</button>
          </form>
        </article>

        <article class="pqlgrp-panel">
          <h2>Matching Pool</h2>
          <form method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="create_pool">
            <div class="pqlgrp-field"><label>Pool title</label><input class="pqlgrp-input" name="title" placeholder="Somali beginner girls 6-8" required></div>
            <div class="pqlgrp-formgrid">
              <div class="pqlgrp-field"><label>Course</label><?php echo pqlgrp_select('course_type', $pqlgrpoptions['course_types'] ?? [], 'pre_quraan', true); ?></div>
              <div class="pqlgrp-field"><label>Time zone</label><input class="pqlgrp-input" name="timezone" value="Africa/Nairobi"></div>
              <div class="pqlgrp-field"><label>Language</label><input class="pqlgrp-input" name="language"></div>
              <div class="pqlgrp-field"><label>Age min</label><input class="pqlgrp-input" name="age_min" type="number" min="0" max="25" value="6"></div>
              <div class="pqlgrp-field"><label>Age max</label><input class="pqlgrp-input" name="age_max" type="number" min="1" max="99" value="8"></div>
              <div class="pqlgrp-field"><label>Level min</label><input class="pqlgrp-input" name="level_min" placeholder="alphabet"></div>
              <div class="pqlgrp-field"><label>Level max</label><input class="pqlgrp-input" name="level_max" placeholder="alphabet"></div>
              <div class="pqlgrp-field"><label>Base</label><input class="pqlgrp-input" name="learning_base"></div>
              <div class="pqlgrp-field"><label>Gender policy</label><select class="pqlgrp-select" name="gender_policy"><option value="flexible">Flexible</option><option value="mixed">Mixed</option><option value="female">Female</option><option value="male">Male</option></select></div>
              <div class="pqlgrp-field"><label>Country</label><input class="pqlgrp-input" name="country"></div>
              <div class="pqlgrp-field"><label>City</label><input class="pqlgrp-input" name="city"></div>
              <div class="pqlgrp-field"><label>Max students</label><input class="pqlgrp-input" name="max_students" type="number" min="1" max="15" value="9"></div>
            </div>
            <div class="pqlgrp-field"><label>Schedule preferences</label><textarea class="pqlgrp-textarea" name="schedule_preferences"></textarea></div>
            <div class="pqlgrp-field"><label>Rule notes</label><textarea class="pqlgrp-textarea" name="rule_notes"></textarea></div>
            <button class="pqlgrp-btn pqlgrp-btn--brown" type="submit">Create pool</button>
          </form>
        </article>

        <article class="pqlgrp-panel">
          <h2>Class Group</h2>
          <form method="post" id="pqlgrp-class-group-form">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="create_group">
            <div class="pqlgrp-field"><label>Pool</label><select class="pqlgrp-select" name="poolid" id="pqlgrp-group-pool"><option value="0">No pool</option><?php foreach ($pools as $pool): ?><option value="<?php echo (int)$pool->id; ?>"><?php echo s((string)$pool->title); ?></option><?php endforeach; ?></select></div>
            <div class="pqlgrp-field"><label>Group title</label><input class="pqlgrp-input" name="title" required></div>
            <div class="pqlgrp-formgrid">
              <div class="pqlgrp-field"><label>Course</label><?php echo pqlgrp_select('course_type', $pqlgrpoptions['course_types'] ?? [], 'pre_quraan', true); ?></div>
              <div class="pqlgrp-field"><label>Teacher recommendation</label><?php echo $teachers ? pqlgrp_select('teacherid', $teachers, '', false) : '<input type="hidden" name="teacherid" value="0"><div class="pqlgrp-empty">No active teacher profiles found.</div>'; ?><div class="pqlgrp-teacher-match" id="pqlgrp-teacher-match">Choose a matching pool to rank teachers by timezone, language, level, availability, and capacity.</div></div>
              <div class="pqlgrp-field"><label>Time zone</label><input class="pqlgrp-input" name="timezone" value="Africa/Nairobi"></div>
              <div class="pqlgrp-field"><label>Language</label><input class="pqlgrp-input" name="language"></div>
              <div class="pqlgrp-field"><label>Current level</label><input class="pqlgrp-input" name="current_level"></div>
              <div class="pqlgrp-field"><label>Base</label><input class="pqlgrp-input" name="learning_base"></div>
              <div class="pqlgrp-field"><label>Country</label><input class="pqlgrp-input" name="country"></div>
              <div class="pqlgrp-field"><label>City</label><input class="pqlgrp-input" name="city"></div>
              <div class="pqlgrp-field"><label>Gender policy</label><select class="pqlgrp-select" name="gender_policy"><option value="flexible">Flexible</option><option value="mixed">Mixed</option><option value="female">Female</option><option value="male">Male</option></select></div>
              <div class="pqlgrp-field"><label>Age min</label><input class="pqlgrp-input" name="age_min" type="number" min="0" max="25" value="6"></div>
              <div class="pqlgrp-field"><label>Age max</label><input class="pqlgrp-input" name="age_max" type="number" min="1" max="99" value="8"></div>
              <div class="pqlgrp-field"><label>Max students</label><input class="pqlgrp-input" name="max_students" type="number" min="1" max="15" value="9"></div>
            </div>
            <div class="pqlgrp-field"><label>Schedule summary</label><textarea class="pqlgrp-textarea" name="schedule_summary"></textarea></div>
            <button class="pqlgrp-btn pqlgrp-btn--brown" type="submit">Create class group</button>
          </form>
        </article>

        <article class="pqlgrp-panel">
          <h2>Suggested Assignments</h2>
          <?php if (!$recommendations): ?>
            <div class="pqlgrp-empty">No recommendations yet. Add student profiles and class groups first.</div>
          <?php else: ?>
            <table class="pqlgrp-table"><thead><tr><th>Student</th><th>Best group</th><th>Score</th><th></th></tr></thead><tbody>
            <?php foreach ($recommendations as $rec): ?>
              <tr>
                <td><?php echo s(pqlgrp_user_name((int)$rec['student']->userid, 'Student ' . (int)$rec['student']->userid)); ?><br><span class="pqlgrp-pill"><?php echo s((string)$rec['student']->current_level); ?></span></td>
                <td><?php echo s((string)$rec['group']->title); ?><br><span class="pqlgrp-pill"><?php echo s($rec['details']); ?></span></td>
                <td><span class="pqlgrp-pill <?php echo $rec['score'] >= 80 ? 'pqlgrp-pill--ok' : 'pqlgrp-pill--warn'; ?>"><?php echo (int)$rec['score']; ?>%</span></td>
                <td>
                  <form method="post">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="assign_student">
                    <input type="hidden" name="groupid" value="<?php echo (int)$rec['group']->id; ?>">
                    <input type="hidden" name="studentid" value="<?php echo (int)$rec['student']->userid; ?>">
                    <button class="pqlgrp-btn" type="submit">Assign</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
            </tbody></table>
          <?php endif; ?>
        </article>

        <article class="pqlgrp-panel pqlgrp-panel--wide">
          <h2>Current Class Groups</h2>
          <?php if (!$groups): ?><div class="pqlgrp-empty">No class groups yet.</div><?php else: ?>
            <table class="pqlgrp-table"><thead><tr><th>Group</th><th>Teacher</th><th>Criteria</th><th>Capacity</th><th>Schedule</th></tr></thead><tbody>
            <?php foreach ($groups as $group): ?>
              <tr>
                <td><strong><?php echo s((string)$group->title); ?></strong><br><span class="pqlgrp-pill"><?php echo s((string)$group->status); ?></span></td>
                <td><?php echo s(pqlgrp_user_name((int)$group->teacherid, 'Teacher ' . (int)$group->teacherid)); ?></td>
                <td><?php echo s((string)($pqlgrpoptions['course_types'][(string)($group->course_type ?? '')] ?? (($group->course_type ?? '') ?: 'Course not set'))); ?><br><?php echo s((string)$group->language); ?> / <?php echo s((string)$group->current_level); ?> / <?php echo s((string)$group->learning_base); ?><br><?php echo s((string)$group->timezone); ?> / <?php echo s((string)$group->gender_policy); ?> / ages <?php echo (int)$group->age_min; ?>-<?php echo (int)$group->age_max; ?><br><?php echo s((string)$group->country); ?> / <?php echo s((string)$group->city); ?></td>
                <td><?php echo (int)$group->active_students; ?> / <?php echo (int)$group->max_students; ?></td>
                <td><?php echo s((string)$group->schedule_summary); ?></td>
              </tr>
            <?php endforeach; ?>
            </tbody></table>
          <?php endif; ?>
        </article>

        <article class="pqlgrp-panel pqlgrp-panel--wide">
          <h2>Recent Student Profiles</h2>
          <?php if (!$profiles): ?><div class="pqlgrp-empty">No student profiles yet.</div><?php else: ?>
            <table class="pqlgrp-table"><thead><tr><th>Student</th><th>Time/Language</th><th>Level</th><th>Parent/Consent</th><th>Location</th><th>Status</th></tr></thead><tbody>
            <?php foreach ($profiles as $profile): ?>
              <tr>
                <td><?php echo s((string)($profile->student_display_name ?? '') ?: pqlgrp_user_name((int)$profile->userid, 'Student ' . (int)$profile->userid)); ?><br>ID <?php echo (int)$profile->userid; ?></td>
                <td><?php echo s((string)$profile->timezone); ?><br><?php echo s((string)$profile->language); ?></td>
                <td><?php echo s((string)($pqlgrpoptions['course_types'][(string)($profile->course_type ?? '')] ?? (($profile->course_type ?? '') ?: 'Course not set'))); ?><br><?php echo s((string)$profile->current_level); ?><br><?php echo s((string)$profile->learning_base); ?></td>
                <td><?php echo s((string)($profile->parent_name ?? '')); ?><br><?php echo s((string)($profile->parent_email ?? '')); ?><br><span class="pqlgrp-pill <?php echo !empty($profile->live_class_consent) ? 'pqlgrp-pill--ok' : 'pqlgrp-pill--warn'; ?>">live <?php echo !empty($profile->live_class_consent) ? 'yes' : 'no'; ?></span> <span class="pqlgrp-pill <?php echo !empty($profile->recording_consent) ? 'pqlgrp-pill--ok' : 'pqlgrp-pill--warn'; ?>">record <?php echo !empty($profile->recording_consent) ? 'yes' : 'no'; ?></span></td>
                <td><?php echo s((string)$profile->country); ?> / <?php echo s((string)$profile->city); ?><br><?php echo s((string)$profile->gender); ?> / <?php echo s((string)$profile->age_band); ?><br>Special Needs: <?php echo s((string)($profile->special_needs ?? 'no')); ?></td>
                <td><span class="pqlgrp-pill"><?php echo s((string)$profile->status); ?></span></td>
              </tr>
            <?php endforeach; ?>
            </tbody></table>
          <?php endif; ?>
        </article>
      </section>
      <script>
      (function() {
        const poolDefaults = <?php echo json_encode($pooldefaults, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
        const teacherOptionsByPool = <?php echo json_encode($teacheroptionsbypool, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
        const teacherMatchesByPool = <?php echo json_encode($teachermatchesbypool, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
        const genericTeachers = <?php echo json_encode($teachers, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
        const teacherLinks = <?php echo json_encode($teacherlinks, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
        let currentMatches = [];
        const form = document.getElementById('pqlgrp-class-group-form');
        if (!form) {
          return;
        }
        const pool = form.querySelector('[name="poolid"]');
        const teacher = form.querySelector('[name="teacherid"]');
        const matchBox = document.getElementById('pqlgrp-teacher-match');
        const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char]));
        const setField = (name, value) => {
          const field = form.querySelector('[name="' + name + '"]');
          if (field && value !== undefined && value !== null) {
            field.value = value;
          }
        };
        const rebuildTeacherOptions = (options, autoselect) => {
          if (!teacher || teacher.tagName !== 'SELECT') {
            return;
          }
          teacher.innerHTML = '';
          const auto = document.createElement('option');
          auto.value = '';
          auto.textContent = 'Use top recommended teacher';
          teacher.appendChild(auto);
          let first = '';
          Object.entries(options || {}).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            teacher.appendChild(option);
            if (!first) {
              first = value;
            }
          });
          teacher.value = autoselect && first ? first : '';
        };
        const selectedTeacherId = () => {
          if (teacher && teacher.value) {
            return String(teacher.value);
          }
          if (currentMatches && currentMatches.length && currentMatches[0].userid) {
            return String(currentMatches[0].userid);
          }
          return '';
        };
        const renderTeacherLinks = () => {
          const links = teacherLinks[selectedTeacherId()];
          if (!links) {
            return '';
          }
          const item = (url, label) => url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(label) + '</a>' : '';
          return '<div class="pqlgrp-teacher-links">'
            + item(links.profile, 'Profile')
            + item(links.availability, 'Availability')
            + item(links.classes, 'Current classes')
            + item(links.directory, 'Teacher directory')
            + item(links.moodle, 'Moodle account')
            + '</div>';
        };
        const renderMatches = (matches) => {
          if (!matchBox) {
            return;
          }
          currentMatches = matches || [];
          if (!matches || !matches.length) {
            const linksHtml = renderTeacherLinks();
            matchBox.innerHTML = linksHtml || 'No teacher recommendations yet. Add teacher profiles with timezone, language, course, and availability.';
            return;
          }
          const matchHtml = matches.slice(0, 3).map((match) => {
            const label = String(match.label || '').split(' - ')[0];
            return '<div><strong>' + escapeHtml(label) + '</strong> ' + escapeHtml(match.score) + '% match - ' + escapeHtml(match.reasons) + '</div>';
          }).join('');
          matchBox.innerHTML = matchHtml + renderTeacherLinks();
        };
        const applyPool = () => {
          const id = pool ? pool.value : '0';
          const defaults = poolDefaults[id];
          if (defaults) {
            Object.entries(defaults).forEach(([name, value]) => setField(name, value));
            rebuildTeacherOptions(teacherOptionsByPool[id] || genericTeachers, true);
            renderMatches(teacherMatchesByPool[id] || []);
          } else {
            rebuildTeacherOptions(genericTeachers, false);
            if (matchBox) {
              matchBox.textContent = 'Choose a matching pool to rank teachers by timezone, language, level, availability, and capacity.';
            }
          }
        };
        if (pool) {
          pool.addEventListener('change', applyPool);
          applyPool();
        }
        if (teacher) {
          teacher.addEventListener('change', () => renderMatches(currentMatches));
        }
      })();
      </script>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
