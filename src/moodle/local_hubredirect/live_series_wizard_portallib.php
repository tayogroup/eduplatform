<?php
// Live-series-wizard function library — extracted VERBATIM from
// live_series_wizard.php (renamed pqlsw_ -> pqlswl_) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
//
// Functions the wizard defined byte-for-byte identically to an already-deployed
// portal library are NOT duplicated here — the calls go to those libraries:
//   pqlsw_table_exists  -> pqlsesl_table_exists   (live_sessions_portallib)
//   pqlsw_column_exists -> pqlsesl_column_exists  (live_sessions_portallib)
//   pqlsw_user_name     -> pqlserl_user_name      (live_series_portallib)
// pqlsw_ready and pqlsw_parse_students differ from their pqlserl_ namesakes
// (different table/column set; different preg_split flags), so they are kept
// verbatim here. Requires: local/hubredirect/accesslib.php,
// local/hubredirect/live_sessions_portallib.php and
// local/hubredirect/live_series_portallib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlswl_ready(): bool {
    return pqlsesl_table_exists('local_prequran_live_series')
        && pqlsesl_table_exists('local_prequran_live_session')
        && pqlsesl_table_exists('local_prequran_live_participant')
        && pqlsesl_column_exists('local_prequran_live_session', 'seriesid')
        && pqlsesl_column_exists('local_prequran_live_session', 'series_sequence');
}

function pqlswl_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlswl_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    return (min(23, (int)$matches[1]) * 60) + (int)$matches[2];
}

function pqlswl_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw));
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlswl_class_groups(int $workspaceid = 0): array {
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

function pqlswl_group_student_ids(int $groupid, int $workspaceid = 0): array {
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

function pqlswl_teacher_candidates(int $workspaceid = 0): array {
    global $DB;
    $ids = [];
    foreach (['local_prequran_live_session', 'local_prequran_live_availability', 'local_prequran_teacher_student'] as $table) {
        if (!pqlsesl_table_exists($table)) {
            continue;
        }
        $where = $table === 'local_prequran_live_session' ? 'teacherid > 0' : "teacherid > 0 AND status = 'active'";
        $params = [];
        if ($workspaceid > 0 && pqlsesl_column_exists($table, 'workspaceid')) {
            $where .= ' AND workspaceid = :workspaceid';
            $params['workspaceid'] = $workspaceid;
        }
        foreach ($DB->get_records_sql("SELECT DISTINCT teacherid FROM {{$table}} WHERE {$where}", $params) as $row) {
            $ids[(int)$row->teacherid] = true;
        }
    }
    $teachers = [];
    foreach (array_keys($ids) as $teacherid) {
        $teachers[] = ['id' => $teacherid, 'name' => pqlserl_user_name($teacherid, 'Teacher ' . $teacherid)];
    }
    usort($teachers, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $teachers;
}

function pqlswl_generate_starts(int $firststart, string $pattern, array $weekdays, int $until, int $count): array {
    $starts = [];
    $count = max(1, min(60, $count));
    $until = $until > 0 ? $until : ($firststart + (30 * DAYSECS));
    if ($pattern === 'daily') {
        for ($cursor = $firststart; count($starts) < $count && $cursor <= $until; $cursor += DAYSECS) {
            $starts[] = $cursor;
        }
    } else if ($pattern === 'weekly') {
        for ($cursor = $firststart; count($starts) < $count && $cursor <= $until; $cursor += WEEKSECS) {
            $starts[] = $cursor;
        }
    } else {
        $weekdays = array_values(array_unique(array_filter(array_map('intval', $weekdays), static function(int $day): bool {
            return $day >= 0 && $day <= 6;
        })));
        if (!$weekdays) {
            $weekdays = [(int)date('w', $firststart)];
        }
        for ($cursor = $firststart; count($starts) < $count && $cursor <= $until; $cursor += DAYSECS) {
            if (in_array((int)date('w', $cursor), $weekdays, true)) {
                $starts[] = $cursor;
            }
        }
    }
    return $starts ?: [$firststart];
}

function pqlswl_conflicts(int $teacherid, array $studentids, array $starts, int $duration): array {
    global $DB;
    $rows = [];
    if ($teacherid <= 0 || !$starts || !pqlsesl_table_exists('local_prequran_live_session')) {
        return $rows;
    }
    $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
    foreach ($starts as $start) {
        $messages = [];
        $end = (int)$start + (max(15, $duration) * MINSECS);
        if (pqlsesl_table_exists('local_prequran_live_availability')) {
            $windows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active']);
            if ($windows) {
                $weekday = (int)date('w', (int)$start);
                $startminute = ((int)date('G', (int)$start) * 60) + (int)date('i', (int)$start);
                $endminute = $startminute + $duration;
                $allowed = false;
                foreach ($windows as $window) {
                    if ((int)$window->weekday === $weekday && (int)$window->start_minute <= $startminute && (int)$window->end_minute >= $endminute) {
                        $allowed = true;
                        break;
                    }
                }
                if (!$allowed) {
                    $messages[] = 'outside teacher availability';
                }
            }
        }
        $teacherconflicts = $DB->get_records_sql(
            "SELECT id, title, scheduled_start
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND status NOT IN ('cancelled', 'failed')
                AND scheduled_start < :endtime
                AND scheduled_end > :starttime",
            ['teacherid' => $teacherid, 'starttime' => (int)$start, 'endtime' => $end],
            0,
            3
        );
        foreach ($teacherconflicts as $session) {
            $messages[] = 'teacher overlaps with #' . (int)$session->id . ' ' . (string)$session->title;
        }
        if ($studentids && pqlsesl_table_exists('local_prequran_live_participant')) {
            list($insql, $inparams) = $DB->get_in_or_equal($studentids, SQL_PARAMS_NAMED, 'student');
            $studentconflicts = $DB->get_records_sql(
                "SELECT s.id, s.title, p.studentid
                   FROM {local_prequran_live_session} s
                   JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
                  WHERE p.role = 'student'
                    AND p.status = 'active'
                    AND p.studentid {$insql}
                    AND s.status NOT IN ('cancelled', 'failed')
                    AND s.scheduled_start < :endtime
                    AND s.scheduled_end > :starttime",
                $inparams + ['starttime' => (int)$start, 'endtime' => $end],
                0,
                5
            );
            foreach ($studentconflicts as $session) {
                $messages[] = pqlserl_user_name((int)$session->studentid, 'Student ' . (int)$session->studentid) . ' overlaps with #' . (int)$session->id;
            }
        }
        if ((count($studentids) + 1) > $maxparticipants) {
            $messages[] = 'above BBB participant limit of ' . $maxparticipants;
        }
        $rows[] = ['start' => (int)$start, 'messages' => $messages];
    }
    return $rows;
}
