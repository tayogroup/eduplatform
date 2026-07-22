<?php
// Student-grouping query/helper library — extracted VERBATIM from
// local_hubredirect/live_grouping.php (its page-defined pqlgrp_* functions) for
// the token-gated portal endpoint. The legacy page keeps its own inline copies
// and stays untouched (parallel-run). Only the page-defined pqlgrp_* functions
// live here; the shared pqh_* helpers (workspace resolution, access checks,
// teach-in-workspace) stay in accesslib.php and are NOT copied. The page's
// top-level `require student_intake_config.php` is NOT included here — the
// handler loads that config itself.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

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
