<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$pqlwizisadmin = is_siteadmin($USER) || pqh_can_manage_academy_operations((int)$USER->id);
$resolvedworkspaceid = $requestedworkspaceid;
if ($resolvedworkspaceid <= 0 && !$pqlwizisadmin && pqh_has_independent_teacher_profile((int)$USER->id)) {
    foreach (pqh_independent_teacher_workspace_ids((int)$USER->id) as $independentworkspaceid) {
        if ($independentworkspaceid > 0) {
            $resolvedworkspaceid = (int)$independentworkspaceid;
            break;
        }
    }
}
if ($resolvedworkspaceid <= 0) {
    $resolvedworkspaceid = (int)($consumercontext->workspaceid ?? 0);
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($resolvedworkspaceid > 0) {
    $urlparams['workspaceid'] = $resolvedworkspaceid;
}
$dashboardpath = !empty($urlparams['workspaceid']) ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php';
$dashboardurl = new moodle_url($dashboardpath, $urlparams);
$pqlwizworkspaceid = (int)($urlparams['workspaceid'] ?? 0);
if (!$pqlwizisadmin && !pqh_user_can_create_live_sessions((int)$USER->id, $pqlwizworkspaceid)) {
    pqh_access_denied(
        'Only approved teachers and administrators can use the guided live-session wizard.',
        $dashboardurl,
        'Live session wizard access required'
    );
}

function pqlwiz_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlwiz_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlwiz_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlwiz_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlwiz_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlwiz_valid_timezone(string $timezone): string {
    $timezone = trim($timezone);
    if ($timezone === '') {
        return 'Africa/Nairobi';
    }
    try {
        new DateTimeZone($timezone);
        return $timezone;
    } catch (Throwable $e) {
        return 'Africa/Nairobi';
    }
}

function pqlwiz_default_schedule_timezone(): string {
    $timezone = trim((string)get_config('local_prequran', 'live_schedule_timezone'));
    return pqlwiz_valid_timezone($timezone !== '' ? $timezone : 'Africa/Nairobi');
}

function pqlwiz_parse_local_datetime(string $date, string $time, string $timezone): int {
    $timezone = pqlwiz_valid_timezone($timezone);
    $value = trim($date) . ' ' . trim($time);
    try {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $value, new DateTimeZone($timezone));
        if (!$dt) {
            return 0;
        }
        return $dt->getTimestamp();
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlwiz_format_datetime(int $timestamp, string $timezone): string {
    $timezone = pqlwiz_valid_timezone($timezone);
    try {
        $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone($timezone));
        return $dt->format('d/m/y, H:i') . ' ' . $dt->format('T');
    } catch (Throwable $e) {
        return userdate($timestamp, get_string('strftimedatetimeshort'));
    }
}

function pqlwiz_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlwiz_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlwiz_weekdays(): array {
    return [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];
}

function pqlwiz_normalize_session_type(string $sessiontype): string {
    $sessiontype = strtolower(trim($sessiontype));
    return in_array($sessiontype, ['teacher_led', 'supervised_practice', 'parent_meeting', 'teacher_meeting', 'student_room', 'teacher_parent_room'], true) ? $sessiontype : 'teacher_led';
}

function pqlwiz_session_type_label(string $sessiontype): string {
    switch (pqlwiz_normalize_session_type($sessiontype)) {
        case 'supervised_practice':
            return 'Teacherless supervised practice';
        case 'parent_meeting':
            return 'Parent meeting room';
        case 'teacher_meeting':
            return 'Teacher meeting room';
        case 'student_room':
            return 'Student room';
        case 'teacher_parent_room':
            return 'Teacher-parent room';
        default:
            return 'Teacher-led live class';
    }
}

function pqlwiz_session_is_meeting_type(string $sessiontype): bool {
    return in_array(pqlwiz_normalize_session_type($sessiontype), ['parent_meeting', 'teacher_meeting', 'student_room', 'teacher_parent_room'], true);
}

function pqlwiz_room_owner_label(string $sessiontype): string {
    switch (pqlwiz_normalize_session_type($sessiontype)) {
        case 'parent_meeting':
            return 'Parent moderator';
        case 'teacher_meeting':
            return 'Head teacher';
        case 'student_room':
            return 'Student room moderator';
        case 'teacher_parent_room':
            return 'Teacher-parent moderator';
        default:
            return 'Teacher';
    }
}

function pqlwiz_room_detail_help(string $sessiontype): string {
    switch (pqlwiz_normalize_session_type($sessiontype)) {
        case 'parent_meeting':
            return 'Use the title/details to include time zone, language, and child age group.';
        case 'teacher_meeting':
            return 'Use the title/details to include time zone, language, and teaching level.';
        case 'student_room':
            return 'Use the title/details to include level, language, and practice focus.';
        case 'teacher_parent_room':
            return 'Use the title/details to include time zone, language, cohort, or support topic.';
        default:
            return '';
    }
}

function pqlwiz_room_owner_help(string $sessiontype): string {
    switch (pqlwiz_normalize_session_type($sessiontype)) {
        case 'parent_meeting':
            return 'Teacher availability is not required. The selected user opens the room as parent moderator.';
        case 'teacher_meeting':
            return 'The selected head teacher opens the room and can lead the discussion.';
        case 'student_room':
            return 'The selected moderator opens the student room before students can join.';
        case 'teacher_parent_room':
            return 'The selected moderator opens the shared teacher-parent room.';
        default:
            return '';
    }
}

function pqlwiz_normalize_practice_access_mode(string $mode): string {
    $mode = strtolower(trim($mode));
    return in_array($mode, ['bbb_and_lesson', 'lesson_only'], true) ? $mode : 'bbb_and_lesson';
}

function pqlwiz_practice_access_label(string $mode): string {
    return pqlwiz_normalize_practice_access_mode($mode) === 'lesson_only'
        ? 'Lesson-only supervised mode'
        : 'BBB room plus lesson monitor';
}

function pqlwiz_format_minute(int $minute): string {
    $minute = max(0, min(24 * 60, $minute));
    if ($minute === 24 * 60) {
        return '24:00';
    }
    return sprintf('%02d:%02d', intdiv($minute, 60), $minute % 60);
}

function pqlwiz_teacher_availability(int $teacherid): array {
    global $DB;
    $calendar = array_fill(0, 7, []);
    if ($teacherid <= 0 || !pqlwiz_table_exists('local_prequran_live_availability')) {
        return $calendar;
    }
    $windows = $DB->get_records(
        'local_prequran_live_availability',
        ['teacherid' => $teacherid, 'status' => 'active'],
        'weekday ASC, start_minute ASC'
    );
    foreach ($windows as $window) {
        $weekday = (int)$window->weekday;
        if ($weekday < 0 || $weekday > 6) {
            continue;
        }
        $start = (int)$window->start_minute;
        $end = (int)$window->end_minute;
        $calendar[$weekday][] = [
            'label' => pqlwiz_format_minute($start) . ' - ' . pqlwiz_format_minute($end),
            'timezone' => trim((string)($window->timezone ?? '')),
        ];
    }
    return $calendar;
}

function pqlwiz_render_availability_calendar(int $teacherid, int $selecteddate = 0, array $urlparams = []): string {
    $days = pqlwiz_weekdays();
    $calendar = pqlwiz_teacher_availability($teacherid);
    $selectedweekday = $selecteddate > 0 ? (int)date('w', $selecteddate) : -1;
    $teachername = $teacherid > 0 ? pqlwiz_user_name($teacherid, 'Teacher ' . $teacherid) : '';
    $html = '<section class="pqlwiz-availability">';
    $html .= '<div class="pqlwiz-availability-head"><div><h3>Teacher availability calendar</h3>';
    if ($teacherid <= 0) {
        $html .= '<p class="pqlwiz-meta">Choose a teacher first to view weekly availability.</p></div></div></section>';
        return $html;
    }
    $html .= '<p class="pqlwiz-meta">' . s($teachername) . ' #' . (int)$teacherid . ' - active weekly availability windows.</p></div>';
    $html .= '<a class="pqlwiz-btn pqlwiz-btn--light" href="' .
        (new moodle_url('/local/hubredirect/live_availability.php', pqlwiz_url_params($urlparams, ['teacherid' => $teacherid])))->out(false) .
        '">Manage availability</a></div>';
    $html .= '<div class="pqlwiz-availability-grid">';
    foreach ($days as $weekday => $dayname) {
        $classes = 'pqlwiz-day' . ($weekday === $selectedweekday ? ' pqlwiz-day--selected' : '');
        $html .= '<div class="' . $classes . '">';
        $html .= '<div class="pqlwiz-day-title">' . s($dayname) . '</div>';
        if (empty($calendar[$weekday])) {
            $html .= '<span class="pqlwiz-slot pqlwiz-slot--empty">No availability</span>';
        } else {
            foreach ($calendar[$weekday] as $slot) {
                $html .= '<span class="pqlwiz-slot">' . s($slot['label']);
                if ($slot['timezone'] !== '') {
                    $html .= '<small>' . s($slot['timezone']) . '</small>';
                }
                $html .= '</span>';
            }
        }
        $html .= '</div>';
    }
    $html .= '</div>';
    if ($selectedweekday >= 0) {
        $html .= '<p class="pqlwiz-meta">The selected date falls on ' . s($days[$selectedweekday]) . ', highlighted above.</p>';
    }
    $html .= '</section>';
    return $html;
}

function pqlwiz_teacher_candidates(int $workspaceid = 0): array {
    global $DB;
    $ids = [];
    if ($workspaceid > 0 && pqlwiz_table_exists('local_prequran_workspace_member')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT userid AS teacherid
               FROM {local_prequran_workspace_member}
              WHERE workspaceid = :workspaceid
                AND status = :status
                AND workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator')
                AND userid > 0",
            ['workspaceid' => $workspaceid, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    if (pqlwiz_table_exists('local_prequran_live_session')) {
        if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_live_session', 'workspaceid')) {
            $rows = $DB->get_records_sql(
                "SELECT DISTINCT teacherid
                   FROM {local_prequran_live_session}
                  WHERE teacherid > 0
                    AND workspaceid = :workspaceid",
                ['workspaceid' => $workspaceid]
            );
            foreach ($rows as $row) {
                $ids[(int)$row->teacherid] = true;
            }
        } else if ($workspaceid <= 0) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_live_session} WHERE teacherid > 0") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    }
    if ($workspaceid <= 0 && pqlwiz_table_exists('local_prequran_live_availability')) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_live_availability} WHERE teacherid > 0 AND status = 'active'") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    if (pqlwiz_table_exists('local_prequran_teacher_profile')
            && pqlwiz_column_exists('local_prequran_teacher_profile', 'teacher_work_models')) {
        $where = "userid > 0 AND LOWER(teacher_work_models) LIKE '%independent%'";
        $params = [];
        if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_teacher_profile', 'workspaceid')) {
            $where .= ' AND workspaceid = :workspaceid';
            $params['workspaceid'] = $workspaceid;
        }
        if (pqlwiz_column_exists('local_prequran_teacher_profile', 'status')) {
            $where .= ' AND LOWER(status) NOT IN (:archived, :inactive, :rejected)';
            $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        foreach ($DB->get_records_select('local_prequran_teacher_profile', $where, $params, '', 'DISTINCT userid') as $row) {
            $ids[(int)$row->userid] = true;
        }
    }
    if (pqlwiz_table_exists('local_prequran_teacher_student')) {
        if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_teacher_student', 'workspaceid')) {
            $rows = $DB->get_records_sql(
                "SELECT DISTINCT teacherid
                   FROM {local_prequran_teacher_student}
                  WHERE teacherid > 0
                    AND status = :status
                    AND workspaceid = :workspaceid",
                ['status' => 'active', 'workspaceid' => $workspaceid]
            );
            foreach ($rows as $row) {
                $ids[(int)$row->teacherid] = true;
            }
        } else if ($workspaceid <= 0) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_teacher_student} WHERE teacherid > 0 AND status = 'active'") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    }
    $teachers = [];
    foreach (array_keys($ids) as $teacherid) {
        $teachers[] = ['id' => $teacherid, 'name' => pqlwiz_user_name($teacherid, 'Teacher ' . $teacherid)];
    }
    usort($teachers, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $teachers;
}

function pqlwiz_student_names(array $studentids): array {
    $names = [];
    foreach (array_values(array_unique(array_filter(array_map('intval', $studentids)))) as $studentid) {
        $names[$studentid] = pqlwiz_user_name($studentid, 'Student ' . $studentid);
    }
    return $names;
}

function pqlwiz_profile_field($profile, string $field): string {
    return trim((string)($profile->{$field} ?? ''));
}

function pqlwiz_student_picker_profiles(int $workspaceid = 0, int $teacherid = 0, int $limit = 400): array {
    global $DB;
    $hasprofiletable = pqlwiz_table_exists('local_prequran_student_profile');

    $isindependentteacher = $teacherid > 0
        && $workspaceid > 0
        && in_array($workspaceid, pqh_independent_teacher_workspace_ids($teacherid), true);
    if (!$isindependentteacher && $teacherid > 0 && $workspaceid > 0
            && pqlwiz_table_exists('local_prequran_workspace')) {
        $workspace = $DB->get_record(
            'local_prequran_workspace',
            ['id' => $workspaceid],
            'id,workspace_type,ownerid,status',
            IGNORE_MISSING
        );
        $isindependentteacher = $workspace
            && strtolower(trim((string)($workspace->workspace_type ?? ''))) === 'solo_teacher'
            && (int)($workspace->ownerid ?? 0) === $teacherid
            && strtolower(trim((string)($workspace->status ?? 'active'))) !== 'archived';
    }
    if ($teacherid > 0 && pqlwiz_table_exists('local_prequran_teacher_student')) {
        $assignmentwhere = 'teacherid = :teacherid AND status = :status';
        $assignmentparams = ['teacherid' => $teacherid, 'status' => 'active'];
        if (!$isindependentteacher && $workspaceid > 0
                && pqlwiz_column_exists('local_prequran_teacher_student', 'workspaceid')) {
            $assignmentwhere .= ' AND workspaceid = :workspaceid';
            $assignmentparams['workspaceid'] = $workspaceid;
        }
        $assignments = $DB->get_records_select(
            'local_prequran_teacher_student',
            $assignmentwhere,
            $assignmentparams,
            'timemodified DESC',
            'id,studentid',
            0,
            $limit
        );
        $profiles = [];
        foreach ($assignments as $assignment) {
            $studentid = (int)$assignment->studentid;
            if ($studentid <= 0 || isset($profiles[$studentid])) {
                continue;
            }
            $user = core_user::get_user($studentid, '*', IGNORE_MISSING);
            if (!$user || !empty($user->deleted) || !empty($user->suspended)) {
                continue;
            }
            $studentprofiles = $hasprofiletable ? $DB->get_records(
                    'local_prequran_student_profile',
                    ['userid' => $studentid],
                    'timemodified DESC, id DESC',
                    '*',
                    0,
                    1
                ) : [];
            $profile = $studentprofiles ? reset($studentprofiles) : new stdClass();
            $profile->profileid = (int)($profile->id ?? 0);
            $profile->userid = $studentid;
            $profile->student_display_name = trim((string)($profile->student_display_name ?? ''));
            if ($profile->student_display_name === '') {
                $profile->student_display_name = fullname($user);
            }
            foreach (['timezone', 'language', 'primary_language', 'age_years', 'age_band', 'current_level',
                      'country', 'city', 'gender', 'live_class_consent', 'recording_consent'] as $field) {
                $profile->{$field} = $profile->{$field} ?? '';
            }
            $profile->status = (string)($profile->status ?? 'active');
            $profile->firstname = (string)$user->firstname;
            $profile->lastname = (string)$user->lastname;
            $profile->idnumber = (string)$user->idnumber;
            $profile->username = (string)$user->username;
            $profiles[$studentid] = $profile;
        }
        return array_values($profiles);
    }

    if (!$hasprofiletable) {
        return [];
    }

    $join = '';
    $where = [
        'u.deleted = 0',
        'u.suspended = 0',
        'sp.status = :status',
    ];
    $params = ['status' => 'active'];
    if ($workspaceid > 0) {
        $workspacewhere = [];
        if (pqlwiz_table_exists('local_prequran_workspace_member')) {
            $join = "LEFT JOIN {local_prequran_workspace_member} wm
                       ON wm.userid = sp.userid
                      AND wm.workspaceid = :memberworkspaceid
                      AND wm.status = :memberstatus
                      AND wm.workspace_role = 'student'";
            $workspacewhere[] = 'wm.id IS NOT NULL';
            $params['memberworkspaceid'] = $workspaceid;
            $params['memberstatus'] = 'active';
        }
        if (pqlwiz_column_exists('local_prequran_student_profile', 'workspaceid')) {
            $workspacewhere[] = 'sp.workspaceid = :profileworkspaceid';
            $params['profileworkspaceid'] = $workspaceid;
        }
        $where[] = $workspacewhere ? '(' . implode(' OR ', $workspacewhere) . ')' : '1 = 0';
    }
    if ($teacherid > 0 && pqlwiz_table_exists('local_prequran_teacher_student')) {
        $assignmentworkspace = '';
        if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_teacher_student', 'workspaceid')) {
            $assignmentworkspace = ' AND ts.workspaceid = :assignmentworkspaceid';
            $params['assignmentworkspaceid'] = $workspaceid;
        }
        $join .= " JOIN {local_prequran_teacher_student} ts
                     ON ts.studentid = sp.userid
                    AND ts.teacherid = :assignmentteacherid
                    AND ts.status = :assignmentstatus
                    {$assignmentworkspace}";
        $params['assignmentteacherid'] = $teacherid;
        $params['assignmentstatus'] = 'active';
    }
    return array_values($DB->get_records_sql(
        "SELECT sp.id AS profileid,
                sp.userid,
                sp.student_display_name,
                sp.timezone,
                sp.language,
                sp.primary_language,
                sp.age_years,
                sp.age_band,
                sp.current_level,
                sp.country,
                sp.city,
                sp.gender,
                sp.live_class_consent,
                sp.recording_consent,
                sp.status,
                u.firstname,
                u.lastname,
                u.idnumber,
                u.username
           FROM {local_prequran_student_profile} sp
           JOIN {user} u ON u.id = sp.userid
           {$join}
          WHERE " . implode(' AND ', $where) . "
       ORDER BY sp.timezone ASC, sp.current_level ASC, sp.student_display_name ASC, u.firstname ASC, u.lastname ASC",
        $params,
        0,
        $limit
    ));
}

function pqlwiz_student_picker_timezones(array $profiles): array {
    $timezones = [];
    foreach ($profiles as $profile) {
        $timezone = pqlwiz_profile_field($profile, 'timezone');
        if ($timezone !== '') {
            $timezones[$timezone] = $timezone;
        }
    }
    ksort($timezones, SORT_NATURAL | SORT_FLAG_CASE);
    return $timezones;
}

function pqlwiz_student_picker_name($profile): string {
    $display = pqlwiz_profile_field($profile, 'student_display_name');
    if ($display !== '') {
        return $display;
    }
    $name = trim(pqlwiz_profile_field($profile, 'firstname') . ' ' . pqlwiz_profile_field($profile, 'lastname'));
    return $name !== '' ? $name : 'Student ' . (int)$profile->userid;
}

function pqlwiz_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw));
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlwiz_class_groups(int $workspaceid = 0): array {
    global $DB;
    if (!pqlwiz_table_exists('local_prequran_class_group')) {
        return [];
    }
    $where = "status IN ('open', 'active')";
    $params = [];
    if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_class_group', 'workspaceid')) {
        $where .= ' AND workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    return $DB->get_records_select('local_prequran_class_group', $where, $params, 'title ASC', '*', 0, 100);
}

function pqlwiz_group_student_ids(int $groupid, int $workspaceid = 0): array {
    global $DB;
    if ($groupid <= 0 || !pqlwiz_table_exists('local_prequran_group_member')) {
        return [];
    }
    if ($workspaceid > 0
        && pqlwiz_table_exists('local_prequran_class_group')
        && pqlwiz_column_exists('local_prequran_class_group', 'workspaceid')
        && !$DB->record_exists('local_prequran_class_group', ['id' => $groupid, 'workspaceid' => $workspaceid])) {
        return [];
    }
    $ids = [];
    foreach ($DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid') as $member) {
        $ids[] = (int)$member->studentid;
    }
    return array_values(array_unique(array_filter($ids)));
}

function pqlwiz_conflicts(int $teacherid, array $studentids, int $start, int $duration, bool $teacherrequired = true, int $workspaceid = 0): array {
    global $DB;
    $conflicts = [];
    if ($start <= 0 || !pqlwiz_table_exists('local_prequran_live_session')) {
        return $conflicts;
    }
    $end = $start + (max(15, $duration) * MINSECS);
    if ($teacherrequired && $teacherid <= 0) {
        $conflicts[] = 'Choose the teacher who will lead this session.';
    }
    if ($teacherrequired && $teacherid > 0 && pqlwiz_table_exists('local_prequran_live_availability')) {
        $windows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($windows) {
            $weekday = (int)date('w', $start);
            $startminute = ((int)date('G', $start) * 60) + (int)date('i', $start);
            $endminute = $startminute + $duration;
            $allowed = false;
            foreach ($windows as $window) {
                if ((int)$window->weekday === $weekday && (int)$window->start_minute <= $startminute && (int)$window->end_minute >= $endminute) {
                    $allowed = true;
                    break;
                }
            }
            if (!$allowed) {
                $conflicts[] = 'Teacher is outside active availability for this proposed time.';
            }
        }
    }
    if ($teacherrequired && $teacherid > 0) {
        $teacherwhere = [
            'teacherid = :teacherid',
            "status NOT IN ('cancelled', 'failed')",
            'scheduled_start < :endtime',
            'scheduled_end > :starttime',
        ];
        $teacherparams = ['teacherid' => $teacherid, 'starttime' => $start, 'endtime' => $end];
        if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_live_session', 'workspaceid')) {
            $teacherwhere[] = 'workspaceid = :teacher_workspaceid';
            $teacherparams['teacher_workspaceid'] = $workspaceid;
        }
        $teacherconflicts = $DB->get_records_sql(
            "SELECT id, title, scheduled_start, timezone
               FROM {local_prequran_live_session}
              WHERE " . implode(' AND ', $teacherwhere) . "
           ORDER BY scheduled_start ASC",
            $teacherparams,
            0,
            5
        );
        foreach ($teacherconflicts as $session) {
            $conflicts[] = 'Teacher overlaps with "' . (string)$session->title . '" at ' . pqlwiz_format_datetime((int)$session->scheduled_start, (string)($session->timezone ?? '')) . '.';
        }
    }
    if ($studentids && pqlwiz_table_exists('local_prequran_live_participant')) {
        list($insql, $inparams) = $DB->get_in_or_equal(array_values($studentids), SQL_PARAMS_NAMED, 'student');
        $studentwhere = [
            'p.role = :studentrole',
            'p.status = :studentstatus',
            "p.studentid {$insql}",
            "s.status NOT IN ('cancelled', 'failed')",
            's.scheduled_start < :endtime',
            's.scheduled_end > :starttime',
        ];
        $studentparams = $inparams + [
            'studentrole' => 'student',
            'studentstatus' => 'active',
            'starttime' => $start,
            'endtime' => $end,
        ];
        if ($workspaceid > 0 && pqlwiz_column_exists('local_prequran_live_session', 'workspaceid')) {
            $studentwhere[] = 's.workspaceid = :student_workspaceid';
            $studentparams['student_workspaceid'] = $workspaceid;
        }
        $studentconflicts = $DB->get_records_sql(
            "SELECT s.id, s.title, s.scheduled_start, s.timezone, p.studentid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
              WHERE " . implode(' AND ', $studentwhere) . "
           ORDER BY s.scheduled_start ASC",
            $studentparams,
            0,
            10
        );
        foreach ($studentconflicts as $session) {
            $conflicts[] = pqlwiz_user_name((int)$session->studentid, 'Student ' . (int)$session->studentid) . ' overlaps with "' . (string)$session->title . '" at ' . pqlwiz_format_datetime((int)$session->scheduled_start, (string)($session->timezone ?? '')) . '.';
        }
    }
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    $participantcount = count($studentids) + ($teacherrequired ? 1 : 0);
    if ($participantcount > $maxparticipants) {
        $conflicts[] = 'Participant count is ' . $participantcount . ', above the configured BBB limit of ' . $maxparticipants . '.';
    }
    return array_slice($conflicts, 0, 20);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_create_wizard.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Create Live Session Wizard');
$PAGE->set_heading('Create Live Session Wizard');
$PAGE->add_body_class('pqh-live-create-wizard-page');

$step = max(1, min(6, optional_param('step', 1, PARAM_INT)));
$teacherid = $pqlwizisadmin ? optional_param('teacherid', 0, PARAM_INT) : (int)$USER->id;
$groupid = optional_param('groupid', 0, PARAM_INT);
$studentraw = trim(optional_param('studentids_raw', '', PARAM_TEXT));
$workspaceid = (int)($urlparams['workspaceid'] ?? 0);
$studentids = array_values(array_unique(array_merge(pqlwiz_group_student_ids($groupid, $workspaceid), pqlwiz_parse_students($studentraw))));
$title = trim(optional_param('title', 'Pre-Quran review session', PARAM_TEXT));
$lessonid = trim(optional_param('lessonid', 'alphabet', PARAM_TEXT));
$unitid = trim(optional_param('unitid', 'alphabet_listen', PARAM_TEXT));
$sessiondate = optional_param('sessiondate', '', PARAM_TEXT);
$sessiontime = optional_param('sessiontime', '', PARAM_TEXT);
$timezone = pqlwiz_valid_timezone(optional_param('timezone', pqlwiz_default_schedule_timezone(), PARAM_TEXT));
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$sessiontype = pqlwiz_normalize_session_type(optional_param('session_type', 'teacher_led', PARAM_ALPHANUMEXT));
$teacherrequired = !in_array($sessiontype, ['supervised_practice', 'parent_meeting'], true);
$meetingroom = pqlwiz_session_is_meeting_type($sessiontype);
$practiceaccessmode = pqlwiz_normalize_practice_access_mode(optional_param('practice_access_mode', 'bbb_and_lesson', PARAM_ALPHANUMEXT));
$participantidsraw = trim(optional_param('participantids_raw', '', PARAM_TEXT));
$recording = optional_param('recording_enabled', 0, PARAM_BOOL);
$override = optional_param('override_conflicts', 0, PARAM_BOOL);
$override_reason = trim(optional_param('override_reason', '', PARAM_TEXT));
$datevalue = pqlwiz_clean_date($sessiondate, 0);
$start = pqlwiz_parse_local_datetime($sessiondate, $sessiontime, $timezone);
$conflicts = pqlwiz_conflicts($teacherid, $studentids, $start, $duration, $teacherrequired, $workspaceid);
$teachers = $pqlwizisadmin
    ? pqlwiz_teacher_candidates($workspaceid)
    : [['id' => (int)$USER->id, 'name' => pqlwiz_user_name((int)$USER->id, 'Teacher ' . (int)$USER->id)]];
$classgroups = pqlwiz_class_groups($workspaceid);
$studentnames = pqlwiz_student_names($studentids);
$pickerteacherid = $meetingroom ? 0 : ($pqlwizisadmin ? $teacherid : (int)$USER->id);
$studentprofiles = pqlwiz_student_picker_profiles($workspaceid, $pickerteacherid);
$studenttimezones = pqlwiz_student_picker_timezones($studentprofiles);
$params = pqlwiz_url_params($urlparams, [
    'teacherid' => $teacherid,
    'groupid' => $groupid,
    'studentids_raw' => implode(', ', $studentids),
    'title' => $title,
    'lessonid' => $lessonid,
    'unitid' => $unitid,
    'sessiondate' => $sessiondate,
    'sessiontime' => $sessiontime,
    'timezone' => $timezone,
    'duration' => $duration,
    'session_type' => $sessiontype,
    'practice_access_mode' => $practiceaccessmode,
    'participantids_raw' => $participantidsraw,
    'recording_enabled' => $recording ? 1 : 0,
]);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-create-wizard-page header,
body.pqh-live-create-wizard-page footer,
body.pqh-live-create-wizard-page nav.navbar,
body.pqh-live-create-wizard-page #page-header,
body.pqh-live-create-wizard-page #page-footer,
body.pqh-live-create-wizard-page .drawer,
body.pqh-live-create-wizard-page .drawer-toggles,
body.pqh-live-create-wizard-page .block-region,
body.pqh-live-create-wizard-page [data-region="drawer"],
body.pqh-live-create-wizard-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-create-wizard-page #page,
body.pqh-live-create-wizard-page #page-content,
body.pqh-live-create-wizard-page #region-main,
body.pqh-live-create-wizard-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlwiz-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlwiz-wrap{max-width:1040px;margin:0 auto}
.pqlwiz-top,.pqlwiz-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlwiz-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlwiz-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlwiz-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlwiz-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlwiz-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlwiz-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlwiz-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:16px}
.pqlwiz-step{padding:10px;border-radius:8px;background:#eef4f6;color:#415665;font-size:12px;font-weight:950;text-align:center}
.pqlwiz-step--active{background:#2f6f4e;color:#fff}
.pqlwiz-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pqlwiz-field{display:grid;gap:6px;margin-bottom:12px}
.pqlwiz-field label{font-size:13px;font-weight:900;color:#415665}
.pqlwiz-input,.pqlwiz-select,.pqlwiz-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}
.pqlwiz-textarea{min-height:92px}
.pqlwiz-card{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff;margin-bottom:12px}
.pqlwiz-card h3{margin:0 0 6px;font-size:17px;font-weight:950}
.pqlwiz-meta{margin:3px 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlwiz-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-size:14px;font-weight:850;white-space:pre-wrap}
.pqlwiz-alert--bad{background:#fff0ed;color:#883526;border:1px solid rgba(136,53,38,.16)}
.pqlwiz-alert--ok{background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16)}
.pqlwiz-check{display:flex;gap:9px;align-items:center;font-size:13px;font-weight:850}
.pqlwiz-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlwiz-availability{margin:0 0 14px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#f8fbfd}
.pqlwiz-availability-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
.pqlwiz-availability h3{margin:0 0 4px;font-size:17px;font-weight:950}
.pqlwiz-availability-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.pqlwiz-day{min-height:96px;padding:10px;border:1px solid rgba(23,48,68,.12);border-radius:9px;background:#fff}
.pqlwiz-day--selected{border-color:#2f6f4e;box-shadow:0 0 0 2px rgba(47,111,78,.12)}
.pqlwiz-day-title{margin-bottom:8px;color:#415665;font-size:12px;font-weight:950}
.pqlwiz-slot{display:block;margin:5px 0;padding:6px 8px;border-radius:999px;background:#edf9ef;color:#245c35;font-size:12px;font-weight:900}
.pqlwiz-slot small{display:block;margin-top:2px;color:#5e7280;font-size:10px;font-weight:850}
.pqlwiz-slot--empty{background:#eef4f6;color:#5e7280}
.pqlwiz-picker{display:grid;gap:12px;margin-bottom:12px}
.pqlwiz-filter-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px}
.pqlwiz-roster{max-height:430px;overflow:auto;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlwiz-roster table{width:100%;border-collapse:collapse;font-size:13px}
.pqlwiz-roster th,.pqlwiz-roster td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlwiz-roster th{position:sticky;top:0;background:#f8fbfd;color:#415665;font-size:12px;font-weight:950;z-index:1}
.pqlwiz-student-main{font-weight:950;color:#173044}
.pqlwiz-student-meta{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:800}
.pqlwiz-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;white-space:nowrap}
.pqlwiz-pill--ok{background:#edf9ef;color:#245c35}
.pqlwiz-pill--warn{background:#fff6df;color:#7a5637}
.pqlwiz-selected{display:flex;flex-wrap:wrap;gap:8px;min-height:42px;padding:10px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#f8fbfd}
.pqlwiz-selected .pqlwiz-pill{cursor:pointer;border:0}
.pqlwiz-selected-count{font-weight:950;color:#173044}
.pqlwiz-manual{margin-top:12px}
@media(max-width:780px){.pqlwiz-top{display:block}.pqlwiz-actions{margin-top:12px}.pqlwiz-grid,.pqlwiz-steps,.pqlwiz-availability-grid,.pqlwiz-filter-grid{grid-template-columns:1fr}.pqlwiz-title{font-size:24px}.pqlwiz-availability-head{display:block}.pqlwiz-availability-head .pqlwiz-btn{margin-top:10px}.pqlwiz-roster table{min-width:760px}}
<?php echo pqh_design_system_css('.pqlwiz-shell'); ?>
<?php echo pqh_design_shell_css('.pqlwiz-shell'); ?>
</style>
<main class="pqlwiz-shell">
<?php echo pqh_design_shell_html('pqlwiz-shell'); ?>
  <div class="pqlwiz-wrap">
    <section class="pqlwiz-top">
      <div>
        <h1 class="pqlwiz-title">Guided Session Creation Wizard</h1>
        <p class="pqlwiz-sub">Create one live review session with capacity, availability, and conflict checks before final submission.</p>
      </div>
      <div class="pqlwiz-actions">
        <?php if ($pqlwizisadmin): ?><a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php', $urlparams))->out(false); ?>">Capacity</a><?php endif; ?>
        <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $urlparams))->out(false); ?>">Live sessions</a>
        <a class="pqlwiz-btn" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <section class="pqlwiz-steps">
      <?php foreach ([1 => 'Mode', 2 => ($meetingroom ? 'Participants' : 'Students'), 3 => ($meetingroom ? 'Details' : 'Lesson'), 4 => 'Time', 5 => 'Safety', 6 => 'Review'] as $num => $label): ?>
        <div class="pqlwiz-step <?php echo $step === $num ? 'pqlwiz-step--active' : ''; ?>"><?php echo (int)$num; ?>. <?php echo s($label); ?></div>
      <?php endforeach; ?>
    </section>

    <section class="pqlwiz-panel">
      <?php if (!pqlwiz_table_exists('local_prequran_live_session') || !pqlwiz_table_exists('local_prequran_live_participant')): ?>
        <div class="pqlwiz-empty">Live-session tables are required before using the wizard.</div>
      <?php else: ?>
        <?php if ($step === 1): ?>
          <form method="get">
            <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
            <input type="hidden" name="step" value="2">
            <div class="pqlwiz-field">
              <label for="session_type">Session type</label>
              <select class="pqlwiz-select" id="session_type" name="session_type" required>
                <option value="teacher_led" <?php echo $sessiontype === 'teacher_led' ? 'selected' : ''; ?>>Teacher-led live class</option>
                <option value="supervised_practice" <?php echo $sessiontype === 'supervised_practice' ? 'selected' : ''; ?>>Teacherless supervised practice</option>
                <option value="parent_meeting" <?php echo $sessiontype === 'parent_meeting' ? 'selected' : ''; ?>>Parent meeting room</option>
                <option value="teacher_meeting" <?php echo $sessiontype === 'teacher_meeting' ? 'selected' : ''; ?>>Teacher meeting room</option>
                <option value="student_room" <?php echo $sessiontype === 'student_room' ? 'selected' : ''; ?>>Student room</option>
                <option value="teacher_parent_room" <?php echo $sessiontype === 'teacher_parent_room' ? 'selected' : ''; ?>>Teacher-parent room</option>
              </select>
              <p class="pqlwiz-meta">Teacher-led sessions are student classes. Teacherless supervised practice is monitored student work. Meeting rooms are community rooms with an assigned moderator.</p>
            </div>
            <?php if ($pqlwizisadmin): ?>
              <div class="pqlwiz-field">
                <label for="teacherid">Teacher / reporting teacher / moderator</label>
                <select class="pqlwiz-select" id="teacherid" name="teacherid" required>
                  <option value="">Choose teacher</option>
                  <?php foreach ($teachers as $teacher): ?>
                    <option value="<?php echo (int)$teacher['id']; ?>" <?php echo $teacherid === (int)$teacher['id'] ? 'selected' : ''; ?>><?php echo s($teacher['name'] . ' #' . $teacher['id']); ?></option>
                  <?php endforeach; ?>
                </select>
                <p class="pqlwiz-meta">For meeting rooms this is the moderator who opens the room. For classes this is the teacher or reporting teacher.</p>
              </div>
            <?php else: ?>
              <input type="hidden" name="teacherid" value="<?php echo (int)$USER->id; ?>">
              <div class="pqlwiz-card"><h3>Teacher</h3><p class="pqlwiz-meta"><?php echo s(fullname($USER)); ?> #<?php echo (int)$USER->id; ?></p></div>
            <?php endif; ?>
            <div class="pqlwiz-field">
              <label for="practice_access_mode">Student access mode</label>
              <select class="pqlwiz-select" id="practice_access_mode" name="practice_access_mode">
                <option value="bbb_and_lesson" <?php echo $practiceaccessmode === 'bbb_and_lesson' ? 'selected' : ''; ?>>BBB room plus lesson monitor</option>
                <option value="lesson_only" <?php echo $practiceaccessmode === 'lesson_only' ? 'selected' : ''; ?>>Lesson-only supervised mode</option>
              </select>
              <p class="pqlwiz-meta">Used only for teacherless supervised practice. Meeting rooms always use the BBB room.</p>
            </div>
            <div class="pqlwiz-actions">
              <button class="pqlwiz-btn" type="submit">Next: <?php echo $meetingroom ? 'participants' : 'students'; ?></button>
              <?php if ($pqlwizisadmin): ?><a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php', $urlparams))->out(false); ?>">Review capacity first</a><?php endif; ?>
            </div>
          </form>
        <?php elseif ($step === 2): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if (!in_array($key, ['studentids_raw', 'groupid', 'participantids_raw'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="3">
            <?php if ($classgroups && !$meetingroom): ?>
              <div class="pqlwiz-field">
                <label for="groupid">Class group</label>
                <select class="pqlwiz-select" id="groupid" name="groupid">
                  <option value="0">No class group</option>
                  <?php foreach ($classgroups as $group): ?>
                    <option value="<?php echo (int)$group->id; ?>" <?php echo $groupid === (int)$group->id ? 'selected' : ''; ?>><?php echo s((string)$group->title . ' #' . (int)$group->id); ?></option>
                  <?php endforeach; ?>
                </select>
                <p class="pqlwiz-meta">A class group automatically adds active assigned students. Extra IDs below are optional.</p>
              </div>
            <?php endif; ?>
            <?php if (!$meetingroom): ?>
            <section class="pqlwiz-picker" aria-label="Student picker">
              <div class="pqlwiz-card">
                <h3><?php echo $meetingroom ? 'Optional invitees' : 'Choose students'; ?></h3>
                <p class="pqlwiz-meta"><?php echo $meetingroom ? 'Meeting rooms are visible by role. Add invited Moodle user IDs below only when you want explicit participants recorded on the room.' : 'Filter first, then select students. The selected Moodle IDs are copied into the manual ID box below.'; ?></p>
                <div class="pqlwiz-filter-grid">
                  <div class="pqlwiz-field">
                    <label for="student_filter_timezone">Time zone</label>
                    <select class="pqlwiz-select" id="student_filter_timezone">
                      <option value="">All time zones</option>
                      <?php foreach ($studenttimezones as $studenttimezone): ?>
                        <option value="<?php echo s($studenttimezone); ?>"><?php echo s($studenttimezone); ?></option>
                      <?php endforeach; ?>
                    </select>
                  </div>
                  <div class="pqlwiz-field">
                    <label for="student_filter_level">Level</label>
                    <input class="pqlwiz-input" id="student_filter_level" type="search" placeholder="alphabet, level 1">
                  </div>
                  <div class="pqlwiz-field">
                    <label for="student_filter_language">Language</label>
                    <input class="pqlwiz-input" id="student_filter_language" type="search" placeholder="Somali">
                  </div>
                  <div class="pqlwiz-field">
                    <label for="student_filter_search">Search</label>
                    <input class="pqlwiz-input" id="student_filter_search" type="search" placeholder="Name, city, ID">
                  </div>
                </div>
                <div class="pqlwiz-selected-count"><span id="pqlwiz-selected-count"><?php echo count($studentids); ?></span> students selected</div>
                <div class="pqlwiz-selected" id="pqlwiz-selected-list" aria-live="polite"></div>
              </div>
              <?php if (!$studentprofiles): ?>
                <div class="pqlwiz-empty">No approved student assignments are available for this teacher workspace. Parent confirmation alone does not activate access; a marketplace administrator must mark the connection request Assigned.</div>
              <?php else: ?>
                <div class="pqlwiz-roster">
                  <table>
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Student</th>
                        <th>Age / Gender</th>
                        <th>Level</th>
                        <th>Language</th>
                        <th>Time zone</th>
                        <th>Location</th>
                        <th>Consent</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php foreach ($studentprofiles as $profile): ?>
                        <?php
                        $userid = (int)$profile->userid;
                        $studentname = pqlwiz_student_picker_name($profile);
                        $language = pqlwiz_profile_field($profile, 'primary_language') ?: pqlwiz_profile_field($profile, 'language');
                        $rowtext = strtolower(implode(' ', [
                            $studentname,
                            (string)$userid,
                            pqlwiz_profile_field($profile, 'idnumber'),
                            pqlwiz_profile_field($profile, 'username'),
                            pqlwiz_profile_field($profile, 'city'),
                            pqlwiz_profile_field($profile, 'country'),
                            pqlwiz_profile_field($profile, 'current_level'),
                            $language,
                        ]));
                        ?>
                        <tr class="js-pqlwiz-student-row"
                            data-userid="<?php echo $userid; ?>"
                            data-name="<?php echo s($studentname); ?>"
                            data-timezone="<?php echo s(pqlwiz_profile_field($profile, 'timezone')); ?>"
                            data-level="<?php echo s(strtolower(pqlwiz_profile_field($profile, 'current_level'))); ?>"
                            data-language="<?php echo s(strtolower($language)); ?>"
                            data-search="<?php echo s($rowtext); ?>">
                          <td>
                            <label class="pqlwiz-check">
                              <input class="js-pqlwiz-student-check" type="checkbox" value="<?php echo $userid; ?>" <?php echo in_array($userid, $studentids, true) ? 'checked' : ''; ?>>
                              <span class="accesshide">Select <?php echo s($studentname); ?></span>
                            </label>
                          </td>
                          <td>
                            <span class="pqlwiz-student-main"><?php echo s($studentname); ?></span>
                            <span class="pqlwiz-student-meta"><?php echo s(pqh_account_no_label($userid)); ?> / Moodle ID <?php echo $userid; ?></span>
                          </td>
                          <td><?php echo (int)$profile->age_years; ?> / <?php echo s(pqlwiz_profile_field($profile, 'gender')); ?></td>
                          <td><?php echo s(pqlwiz_profile_field($profile, 'current_level')); ?></td>
                          <td><?php echo s($language); ?></td>
                          <td><?php echo s(pqlwiz_profile_field($profile, 'timezone')); ?></td>
                          <td><?php echo s(trim(pqlwiz_profile_field($profile, 'city') . ', ' . pqlwiz_profile_field($profile, 'country'), ' ,')); ?></td>
                          <td>
                            <span class="pqlwiz-pill <?php echo !empty($profile->live_class_consent) ? 'pqlwiz-pill--ok' : 'pqlwiz-pill--warn'; ?>">live <?php echo !empty($profile->live_class_consent) ? 'yes' : 'no'; ?></span>
                            <span class="pqlwiz-pill <?php echo !empty($profile->recording_consent) ? 'pqlwiz-pill--ok' : 'pqlwiz-pill--warn'; ?>">record <?php echo !empty($profile->recording_consent) ? 'yes' : 'no'; ?></span>
                          </td>
                        </tr>
                      <?php endforeach; ?>
                    </tbody>
                  </table>
                </div>
              <?php endif; ?>
            </section>
            <?php endif; ?>
            <?php if ($meetingroom): ?>
              <div class="pqlwiz-field pqlwiz-manual">
                <label for="participantids_raw">Optional invited participant user IDs</label>
                <textarea class="pqlwiz-textarea" id="participantids_raw" name="participantids_raw" placeholder="201, 202, 203"><?php echo s($participantidsraw); ?></textarea>
                <p class="pqlwiz-meta">Leave blank for a role-based room. Parent, teacher, teacher-parent, and student rooms are visible to their matching account roles.</p>
              </div>
              <input type="hidden" id="studentids_raw" name="studentids_raw" value="">
            <?php else: ?>
              <div class="pqlwiz-field pqlwiz-manual">
                <label for="studentids_raw">Student user IDs</label>
                <textarea class="pqlwiz-textarea" id="studentids_raw" name="studentids_raw" placeholder="101, 102, 103"><?php echo s(implode(', ', $studentids)); ?></textarea>
                <p class="pqlwiz-meta">Manual fallback. These are Moodle user IDs and will be combined with any selected class-group students.</p>
              </div>
            <?php endif; ?>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 1]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Next: <?php echo $meetingroom ? 'details' : 'lesson'; ?></button>
            </div>
          </form>
        <?php elseif ($step === 3): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if (!in_array($key, ['title', 'lessonid', 'unitid'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="4">
            <div class="pqlwiz-field"><label for="title">Title</label><input class="pqlwiz-input" id="title" name="title" type="text" value="<?php echo s($title); ?>" required></div>
            <div class="pqlwiz-grid">
              <div class="pqlwiz-field"><label for="lessonid">Lesson ID<?php echo $meetingroom ? ' (optional)' : ''; ?></label><input class="pqlwiz-input" id="lessonid" name="lessonid" type="text" value="<?php echo s($lessonid); ?>" <?php echo $meetingroom ? '' : 'required'; ?>></div>
              <div class="pqlwiz-field"><label for="unitid">Unit ID<?php echo $meetingroom ? ' (optional)' : ''; ?></label><input class="pqlwiz-input" id="unitid" name="unitid" type="text" value="<?php echo s($unitid); ?>" <?php echo $meetingroom ? '' : 'required'; ?>></div>
            </div>
            <?php if ($meetingroom): ?>
              <p class="pqlwiz-meta"><?php echo s(pqlwiz_room_detail_help($sessiontype)); ?></p>
            <?php endif; ?>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 2]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Next: time</button>
            </div>
          </form>
        <?php elseif ($step === 4): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if (!in_array($key, ['sessiondate', 'sessiontime', 'timezone', 'duration'], true)): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="5">
            <?php if ($meetingroom): ?>
              <div class="pqlwiz-card">
                <h3><?php echo s(pqlwiz_session_type_label($sessiontype)); ?></h3>
                <p class="pqlwiz-meta"><?php echo s(pqlwiz_room_owner_help($sessiontype)); ?></p>
              </div>
            <?php elseif ($teacherrequired): ?>
              <?php echo pqlwiz_render_availability_calendar($teacherid, $datevalue, $urlparams); ?>
            <?php else: ?>
              <div class="pqlwiz-card">
                <h3>Teacherless supervised practice</h3>
                <p class="pqlwiz-meta">Teacher availability is not required. The selected teacher remains the reporting teacher for Practice Coach summaries and follow-up.</p>
              </div>
            <?php endif; ?>
            <div class="pqlwiz-grid">
              <div class="pqlwiz-field"><label for="sessiondate">Date</label><input class="pqlwiz-input" id="sessiondate" name="sessiondate" type="date" value="<?php echo s($sessiondate); ?>" required></div>
              <div class="pqlwiz-field"><label for="sessiontime">Time</label><input class="pqlwiz-input" id="sessiontime" name="sessiontime" type="time" value="<?php echo s($sessiontime); ?>" required></div>
            </div>
            <div class="pqlwiz-field"><label for="timezone">Class timezone</label><input class="pqlwiz-input" id="timezone" name="timezone" type="text" value="<?php echo s($timezone); ?>" placeholder="Africa/Nairobi" required><p class="pqlwiz-meta">Use Africa/Nairobi for East Africa Time. The saved class time and all schedule pages will display using this timezone.</p></div>
            <div class="pqlwiz-field"><label for="duration">Duration</label><select class="pqlwiz-select" id="duration" name="duration">
              <?php foreach ([45, 60, 75, 90] as $minutes): ?><option value="<?php echo (int)$minutes; ?>" <?php echo $duration === $minutes ? 'selected' : ''; ?>><?php echo (int)$minutes; ?> minutes</option><?php endforeach; ?>
            </select></div>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 3]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Next: safety</button>
            </div>
          </form>
        <?php elseif ($step === 5): ?>
          <form method="get">
            <?php foreach ($params as $key => $value): if ($key !== 'recording_enabled'): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endif; endforeach; ?>
            <input type="hidden" name="step" value="6">
            <div class="pqlwiz-card">
              <h3>Recording & Consent</h3>
              <p class="pqlwiz-meta">Audio recording is always enabled for safeguarding and class quality. Student camera/video is allowed only where video consent exists.</p>
              <label class="pqlwiz-check"><input type="checkbox" name="recording_enabled" value="1" checked disabled> <span>Audio recording required; video is opt-in and consent-controlled</span></label>
            </div>
            <?php if ($sessiontype === 'supervised_practice'): ?>
              <div class="pqlwiz-card">
                <h3>Practice Coach</h3>
                <p class="pqlwiz-meta">Chatbot Practice Coach monitors lesson activity during teacherless practice, gives short prompts, and prepares a teacher and parent-safe summary.</p>
                <p class="pqlwiz-meta">Access mode: <?php echo s(pqlwiz_practice_access_label($practiceaccessmode)); ?></p>
              </div>
            <?php endif; ?>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 4]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Review session</button>
            </div>
          </form>
        <?php else: ?>
          <?php if ($conflicts): ?><div class="pqlwiz-alert pqlwiz-alert--bad"><?php echo s(implode("\n", $conflicts)); ?></div><?php else: ?><div class="pqlwiz-alert pqlwiz-alert--ok">No schedule conflicts detected for this teacher, group, and time.</div><?php endif; ?>
          <div class="pqlwiz-card">
            <h3><?php echo s($title); ?></h3>
            <p class="pqlwiz-meta">Mode: <?php echo s(pqlwiz_session_type_label($sessiontype)); ?></p>
            <p class="pqlwiz-meta"><?php echo s($meetingroom ? pqlwiz_room_owner_label($sessiontype) : ($teacherrequired ? 'Teacher' : 'Reporting teacher')); ?>: <?php echo s(pqlwiz_user_name($teacherid, 'User ' . $teacherid)); ?> #<?php echo (int)$teacherid; ?></p>
            <?php if ($sessiontype === 'supervised_practice'): ?><p class="pqlwiz-meta">Access: <?php echo s(pqlwiz_practice_access_label($practiceaccessmode)); ?></p><?php endif; ?>
            <?php if ($meetingroom): ?>
              <p class="pqlwiz-meta">Participants: role-based room<?php echo $participantidsraw !== '' ? '; invited users ' . s($participantidsraw) : ''; ?>.</p>
            <?php else: ?>
              <p class="pqlwiz-meta">Students: <?php echo s(implode(', ', $studentnames)); ?></p>
              <p class="pqlwiz-meta">Lesson: <?php echo s($lessonid); ?> / <?php echo s($unitid); ?></p>
            <?php endif; ?>
            <p class="pqlwiz-meta">Time: <?php echo $start > 0 ? s(pqlwiz_format_datetime($start, $timezone)) : 'Not set'; ?> for <?php echo (int)$duration; ?> minutes</p>
            <p class="pqlwiz-meta">Recording: audio always enabled for safeguarding/class quality; video is opt-in and consent-controlled.</p>
          </div>
          <form method="post" action="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $urlparams))->out(false); ?>">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
            <input type="hidden" name="action" value="create">
            <input type="hidden" name="created_from_wizard" value="1">
            <input type="hidden" name="teacherid" value="<?php echo (int)$teacherid; ?>">
            <input type="hidden" name="groupid" value="<?php echo (int)$groupid; ?>">
            <input type="hidden" name="studentids_raw" value="<?php echo s(implode(', ', $studentids)); ?>">
            <input type="hidden" name="participantids_raw" value="<?php echo s($participantidsraw); ?>">
            <input type="hidden" name="title" value="<?php echo s($title); ?>">
            <input type="hidden" name="lessonid" value="<?php echo s($lessonid); ?>">
            <input type="hidden" name="unitid" value="<?php echo s($unitid); ?>">
            <input type="hidden" name="sessiondate" value="<?php echo s($sessiondate); ?>">
            <input type="hidden" name="sessiontime" value="<?php echo s($sessiontime); ?>">
            <input type="hidden" name="timezone" value="<?php echo s($timezone); ?>">
            <input type="hidden" name="duration" value="<?php echo (int)$duration; ?>">
            <input type="hidden" name="session_type" value="<?php echo s($sessiontype); ?>">
            <input type="hidden" name="practice_access_mode" value="<?php echo s($practiceaccessmode); ?>">
            <input type="hidden" name="recording_enabled" value="1">
            <?php if ($conflicts): ?>
              <div class="pqlwiz-card">
                <h3><?php echo $pqlwizisadmin ? 'Schedule Conflict Override' : 'Request Schedule Exception'; ?></h3>
                <p class="pqlwiz-meta"><?php echo $pqlwizisadmin
                    ? 'The override and reason will be recorded in the session audit trail.'
                    : 'The session will remain pending approval. A marketplace administrator must review this exception before the session can start.'; ?></p>
                <label class="pqlwiz-check"><input id="pqlwiz_override_conflicts" type="checkbox" name="override_conflicts" value="1"> <span><?php echo $pqlwizisadmin ? 'Override schedule conflicts' : 'Submit despite this availability or schedule conflict'; ?></span></label>
                <div class="pqlwiz-field"><label for="override_reason"><?php echo $pqlwizisadmin ? 'Override Reason' : 'Exception Reason'; ?></label><input class="pqlwiz-input" id="override_reason" name="override_reason" type="text" placeholder="Required when submitting this exception"></div>
              </div>
            <?php endif; ?>
            <div class="pqlwiz-actions">
              <a class="pqlwiz-btn pqlwiz-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $params + ['step' => 5]))->out(false); ?>">Back</a>
              <button class="pqlwiz-btn" type="submit">Create live session</button>
            </div>
          </form>
        <?php endif; ?>
      <?php endif; ?>
    </section>
  </div>
</main>
<script>
(function() {
  const override = document.getElementById('pqlwiz_override_conflicts');
  const reason = document.getElementById('override_reason');
  if (override && reason) {
    function syncOverrideReason() {
      reason.required = override.checked;
    }
    override.addEventListener('change', syncOverrideReason);
    syncOverrideReason();
  }

  const manual = document.getElementById('studentids_raw');
  const rows = Array.from(document.querySelectorAll('.js-pqlwiz-student-row'));
  const checks = Array.from(document.querySelectorAll('.js-pqlwiz-student-check'));
  const selectedList = document.getElementById('pqlwiz-selected-list');
  const selectedCount = document.getElementById('pqlwiz-selected-count');
  const timezoneFilter = document.getElementById('student_filter_timezone');
  const levelFilter = document.getElementById('student_filter_level');
  const languageFilter = document.getElementById('student_filter_language');
  const searchFilter = document.getElementById('student_filter_search');

  if (!manual || !rows.length) {
    return;
  }

  function parseIds(value) {
    return (value || '')
      .split(/[\s,;]+/)
      .map(function(part) { return parseInt(part, 10); })
      .filter(function(id, index, list) { return id > 0 && list.indexOf(id) === index; });
  }

  function setManualIds(ids) {
    manual.value = ids.filter(function(id, index, list) {
      return id > 0 && list.indexOf(id) === index;
    }).join(', ');
  }

  function checkedIds() {
    return checks
      .filter(function(check) { return check.checked; })
      .map(function(check) { return parseInt(check.value, 10); })
      .filter(function(id) { return id > 0; });
  }

  function syncChecksFromManual() {
    const ids = parseIds(manual.value);
    checks.forEach(function(check) {
      check.checked = ids.indexOf(parseInt(check.value, 10)) !== -1;
    });
  }

  function renderSelected() {
    const ids = parseIds(manual.value);
    if (selectedCount) {
      selectedCount.textContent = String(ids.length);
    }
    if (!selectedList) {
      return;
    }
    selectedList.innerHTML = '';
    if (!ids.length) {
      const empty = document.createElement('span');
      empty.className = 'pqlwiz-meta';
      empty.textContent = 'No students selected yet.';
      selectedList.appendChild(empty);
      return;
    }
    ids.forEach(function(id) {
      const row = rows.find(function(item) {
        return parseInt(item.getAttribute('data-userid') || '0', 10) === id;
      });
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'pqlwiz-pill';
      pill.textContent = (row ? row.getAttribute('data-name') : 'Student') + ' #' + id + ' x';
      pill.addEventListener('click', function() {
        const next = parseIds(manual.value).filter(function(existing) { return existing !== id; });
        setManualIds(next);
        syncChecksFromManual();
        renderSelected();
      });
      selectedList.appendChild(pill);
    });
  }

  function syncManualFromChecks() {
    const rosterIds = rows.map(function(row) {
      return parseInt(row.getAttribute('data-userid') || '0', 10);
    }).filter(function(id) { return id > 0; });
    const manualIds = parseIds(manual.value);
    const manualOnlyIds = manualIds.filter(function(id) {
      return rosterIds.indexOf(id) === -1;
    });
    setManualIds(manualOnlyIds.concat(checkedIds()));
    syncChecksFromManual();
    renderSelected();
  }

  function rowMatches(row) {
    const timezone = timezoneFilter ? timezoneFilter.value : '';
    const level = levelFilter ? levelFilter.value.trim().toLowerCase() : '';
    const language = languageFilter ? languageFilter.value.trim().toLowerCase() : '';
    const search = searchFilter ? searchFilter.value.trim().toLowerCase() : '';
    if (timezone && row.getAttribute('data-timezone') !== timezone) {
      return false;
    }
    if (level && (row.getAttribute('data-level') || '').indexOf(level) === -1) {
      return false;
    }
    if (language && (row.getAttribute('data-language') || '').indexOf(language) === -1) {
      return false;
    }
    if (search && (row.getAttribute('data-search') || '').indexOf(search) === -1) {
      return false;
    }
    return true;
  }

  function applyFilters() {
    rows.forEach(function(row) {
      row.hidden = !rowMatches(row);
    });
  }

  checks.forEach(function(check) {
    check.addEventListener('change', syncManualFromChecks);
  });
  manual.addEventListener('input', function() {
    syncChecksFromManual();
    renderSelected();
  });
  [timezoneFilter, levelFilter, languageFilter, searchFilter].forEach(function(input) {
    if (input) {
      input.addEventListener('input', applyFilters);
      input.addEventListener('change', applyFilters);
    }
  });

  syncChecksFromManual();
  renderSelected();
  applyFilters();
})();
</script>
<?php
echo $OUTPUT->footer();
