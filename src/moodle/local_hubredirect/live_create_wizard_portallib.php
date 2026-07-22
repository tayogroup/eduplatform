<?php
// Live-create-wizard function library — extracted VERBATIM from
// live_create_wizard.php (renamed pqlwiz_ -> pqlcwl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
//
// Functions the wizard shared byte-for-byte with live_sessions.php are NOT
// duplicated here — the calls go to the already-deployed pqlsesl_* library:
//   pqlwiz_table_exists              -> pqlsesl_table_exists
//   pqlwiz_column_exists             -> pqlsesl_column_exists
//   pqlwiz_valid_timezone            -> pqlsesl_valid_timezone
//   pqlwiz_default_schedule_timezone -> pqlsesl_default_schedule_timezone
//   pqlwiz_parse_local_datetime      -> pqlsesl_parse_local_datetime
// Requires: local/hubredirect/accesslib.php and
// local/hubredirect/live_sessions_portallib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlcwl_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlcwl_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlcwl_format_datetime(int $timestamp, string $timezone): string {
    $timezone = pqlsesl_valid_timezone($timezone);
    try {
        $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone($timezone));
        return $dt->format('d/m/y, H:i') . ' ' . $dt->format('T');
    } catch (Throwable $e) {
        return userdate($timestamp, get_string('strftimedatetimeshort'));
    }
}

function pqlcwl_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlcwl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlcwl_weekdays(): array {
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

function pqlcwl_normalize_session_type(string $sessiontype): string {
    $sessiontype = strtolower(trim($sessiontype));
    return in_array($sessiontype, ['teacher_led', 'supervised_practice', 'parent_meeting', 'teacher_meeting', 'student_room', 'teacher_parent_room'], true) ? $sessiontype : 'teacher_led';
}

function pqlcwl_session_type_label(string $sessiontype): string {
    switch (pqlcwl_normalize_session_type($sessiontype)) {
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

function pqlcwl_session_is_meeting_type(string $sessiontype): bool {
    return in_array(pqlcwl_normalize_session_type($sessiontype), ['parent_meeting', 'teacher_meeting', 'student_room', 'teacher_parent_room'], true);
}

function pqlcwl_room_owner_label(string $sessiontype): string {
    switch (pqlcwl_normalize_session_type($sessiontype)) {
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

function pqlcwl_room_detail_help(string $sessiontype): string {
    switch (pqlcwl_normalize_session_type($sessiontype)) {
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

function pqlcwl_room_owner_help(string $sessiontype): string {
    switch (pqlcwl_normalize_session_type($sessiontype)) {
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

function pqlcwl_normalize_practice_access_mode(string $mode): string {
    $mode = strtolower(trim($mode));
    return in_array($mode, ['bbb_and_lesson', 'lesson_only'], true) ? $mode : 'bbb_and_lesson';
}

function pqlcwl_practice_access_label(string $mode): string {
    return pqlcwl_normalize_practice_access_mode($mode) === 'lesson_only'
        ? 'Lesson-only supervised mode'
        : 'BBB room plus lesson monitor';
}

function pqlcwl_format_minute(int $minute): string {
    $minute = max(0, min(24 * 60, $minute));
    if ($minute === 24 * 60) {
        return '24:00';
    }
    return sprintf('%02d:%02d', intdiv($minute, 60), $minute % 60);
}

function pqlcwl_teacher_availability(int $teacherid): array {
    global $DB;
    $calendar = array_fill(0, 7, []);
    if ($teacherid <= 0 || !pqlsesl_table_exists('local_prequran_live_availability')) {
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
            'label' => pqlcwl_format_minute($start) . ' - ' . pqlcwl_format_minute($end),
            'timezone' => trim((string)($window->timezone ?? '')),
        ];
    }
    return $calendar;
}

function pqlcwl_render_availability_calendar(int $teacherid, int $selecteddate = 0, array $urlparams = []): string {
    $days = pqlcwl_weekdays();
    $calendar = pqlcwl_teacher_availability($teacherid);
    $selectedweekday = $selecteddate > 0 ? (int)date('w', $selecteddate) : -1;
    $teachername = $teacherid > 0 ? pqlcwl_user_name($teacherid, 'Teacher ' . $teacherid) : '';
    $html = '<section class="pqlwiz-availability">';
    $html .= '<div class="pqlwiz-availability-head"><div><h3>Teacher availability calendar</h3>';
    if ($teacherid <= 0) {
        $html .= '<p class="pqlwiz-meta">Choose a teacher first to view weekly availability.</p></div></div></section>';
        return $html;
    }
    $html .= '<p class="pqlwiz-meta">' . s($teachername) . ' #' . (int)$teacherid . ' - active weekly availability windows.</p></div>';
    $html .= '<a class="pqlwiz-btn pqlwiz-btn--light" href="' .
        (new moodle_url('/local/hubredirect/live_availability.php', pqlcwl_url_params($urlparams, ['teacherid' => $teacherid])))->out(false) .
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

function pqlcwl_teacher_candidates(int $workspaceid = 0): array {
    global $DB;
    $ids = [];
    if ($workspaceid > 0 && pqlsesl_table_exists('local_prequran_workspace_member')) {
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
    if (pqlsesl_table_exists('local_prequran_live_session')) {
        if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_live_session', 'workspaceid')) {
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
    if ($workspaceid <= 0 && pqlsesl_table_exists('local_prequran_live_availability')) {
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {local_prequran_live_availability} WHERE teacherid > 0 AND status = 'active'") as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    if (pqlsesl_table_exists('local_prequran_teacher_profile')
            && pqlsesl_column_exists('local_prequran_teacher_profile', 'teacher_work_models')) {
        $where = "userid > 0 AND LOWER(teacher_work_models) LIKE '%independent%'";
        $params = [];
        if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_teacher_profile', 'workspaceid')) {
            $where .= ' AND workspaceid = :workspaceid';
            $params['workspaceid'] = $workspaceid;
        }
        if (pqlsesl_column_exists('local_prequran_teacher_profile', 'status')) {
            $where .= ' AND LOWER(status) NOT IN (:archived, :inactive, :rejected)';
            $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        foreach ($DB->get_records_select('local_prequran_teacher_profile', $where, $params, '', 'DISTINCT userid') as $row) {
            $ids[(int)$row->userid] = true;
        }
    }
    if (pqlsesl_table_exists('local_prequran_teacher_student')) {
        if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_teacher_student', 'workspaceid')) {
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
        $teachers[] = ['id' => $teacherid, 'name' => pqlcwl_user_name($teacherid, 'Teacher ' . $teacherid)];
    }
    usort($teachers, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $teachers;
}

function pqlcwl_student_names(array $studentids): array {
    $names = [];
    foreach (array_values(array_unique(array_filter(array_map('intval', $studentids)))) as $studentid) {
        $names[$studentid] = pqlcwl_user_name($studentid, 'Student ' . $studentid);
    }
    return $names;
}

function pqlcwl_profile_field($profile, string $field): string {
    return trim((string)($profile->{$field} ?? ''));
}

function pqlcwl_student_picker_profiles(int $workspaceid = 0, int $teacherid = 0, int $limit = 400): array {
    global $DB;
    $hasprofiletable = pqlsesl_table_exists('local_prequran_student_profile');

    $isindependentteacher = $teacherid > 0
        && $workspaceid > 0
        && in_array($workspaceid, pqh_independent_teacher_workspace_ids($teacherid), true);
    if (!$isindependentteacher && $teacherid > 0 && $workspaceid > 0
            && pqlsesl_table_exists('local_prequran_workspace')) {
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
    if ($teacherid > 0 && pqlsesl_table_exists('local_prequran_teacher_student')) {
        $assignmentwhere = 'teacherid = :teacherid AND status = :status';
        $assignmentparams = ['teacherid' => $teacherid, 'status' => 'active'];
        if (!$isindependentteacher && $workspaceid > 0
                && pqlsesl_column_exists('local_prequran_teacher_student', 'workspaceid')) {
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
        if (pqlsesl_table_exists('local_prequran_workspace_member')) {
            $join = "LEFT JOIN {local_prequran_workspace_member} wm
                       ON wm.userid = sp.userid
                      AND wm.workspaceid = :memberworkspaceid
                      AND wm.status = :memberstatus
                      AND wm.workspace_role = 'student'";
            $workspacewhere[] = 'wm.id IS NOT NULL';
            $params['memberworkspaceid'] = $workspaceid;
            $params['memberstatus'] = 'active';
        }
        if (pqlsesl_column_exists('local_prequran_student_profile', 'workspaceid')) {
            $workspacewhere[] = 'sp.workspaceid = :profileworkspaceid';
            $params['profileworkspaceid'] = $workspaceid;
        }
        $where[] = $workspacewhere ? '(' . implode(' OR ', $workspacewhere) . ')' : '1 = 0';
    }
    if ($teacherid > 0 && pqlsesl_table_exists('local_prequran_teacher_student')) {
        $assignmentworkspace = '';
        if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_teacher_student', 'workspaceid')) {
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

function pqlcwl_student_picker_timezones(array $profiles): array {
    $timezones = [];
    foreach ($profiles as $profile) {
        $timezone = pqlcwl_profile_field($profile, 'timezone');
        if ($timezone !== '') {
            $timezones[$timezone] = $timezone;
        }
    }
    ksort($timezones, SORT_NATURAL | SORT_FLAG_CASE);
    return $timezones;
}

function pqlcwl_student_picker_name($profile): string {
    $display = pqlcwl_profile_field($profile, 'student_display_name');
    if ($display !== '') {
        return $display;
    }
    $name = trim(pqlcwl_profile_field($profile, 'firstname') . ' ' . pqlcwl_profile_field($profile, 'lastname'));
    return $name !== '' ? $name : 'Student ' . (int)$profile->userid;
}

function pqlcwl_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw));
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlcwl_class_groups(int $workspaceid = 0): array {
    global $DB;
    if (!pqlsesl_table_exists('local_prequran_class_group')) {
        return [];
    }
    $where = "status IN ('open', 'active')";
    $params = [];
    if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_class_group', 'workspaceid')) {
        $where .= ' AND workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    return $DB->get_records_select('local_prequran_class_group', $where, $params, 'title ASC', '*', 0, 100);
}

function pqlcwl_group_student_ids(int $groupid, int $workspaceid = 0): array {
    global $DB;
    if ($groupid <= 0 || !pqlsesl_table_exists('local_prequran_group_member')) {
        return [];
    }
    if ($workspaceid > 0
        && pqlsesl_table_exists('local_prequran_class_group')
        && pqlsesl_column_exists('local_prequran_class_group', 'workspaceid')
        && !$DB->record_exists('local_prequran_class_group', ['id' => $groupid, 'workspaceid' => $workspaceid])) {
        return [];
    }
    $ids = [];
    foreach ($DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid') as $member) {
        $ids[] = (int)$member->studentid;
    }
    return array_values(array_unique(array_filter($ids)));
}

function pqlcwl_conflicts(int $teacherid, array $studentids, int $start, int $duration, bool $teacherrequired = true, int $workspaceid = 0): array {
    global $DB;
    $conflicts = [];
    if ($start <= 0 || !pqlsesl_table_exists('local_prequran_live_session')) {
        return $conflicts;
    }
    $end = $start + (max(15, $duration) * MINSECS);
    if ($teacherrequired && $teacherid <= 0) {
        $conflicts[] = 'Choose the teacher who will lead this session.';
    }
    if ($teacherrequired && $teacherid > 0 && pqlsesl_table_exists('local_prequran_live_availability')) {
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
        if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_live_session', 'workspaceid')) {
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
            $conflicts[] = 'Teacher overlaps with "' . (string)$session->title . '" at ' . pqlcwl_format_datetime((int)$session->scheduled_start, (string)($session->timezone ?? '')) . '.';
        }
    }
    if ($studentids && pqlsesl_table_exists('local_prequran_live_participant')) {
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
        if ($workspaceid > 0 && pqlsesl_column_exists('local_prequran_live_session', 'workspaceid')) {
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
            $conflicts[] = pqlcwl_user_name((int)$session->studentid, 'Student ' . (int)$session->studentid) . ' overlaps with "' . (string)$session->title . '" at ' . pqlcwl_format_datetime((int)$session->scheduled_start, (string)($session->timezone ?? '')) . '.';
        }
    }
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    $participantcount = count($studentids) + ($teacherrequired ? 1 : 0);
    if ($participantcount > $maxparticipants) {
        $conflicts[] = 'Participant count is ' . $participantcount . ', above the configured BBB limit of ' . $maxparticipants . '.';
    }
    return array_slice($conflicts, 0, 20);
}
