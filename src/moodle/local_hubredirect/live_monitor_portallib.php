<?php
// Live-monitor query library — extracted VERBATIM from live_monitor.php
// (renamed pqlmon_ -> pqlmonl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (shared pqh_* helpers).

defined('MOODLE_INTERNAL') || die();

function pqlmonl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlmonl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlmonl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlmonl_is_teacher_or_admin($session): bool {
    global $USER;
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return true;
    }
    if (pqlmonl_column_exists('local_prequran_live_session', 'workspaceid')
        && (int)($session->workspaceid ?? 0) > 0
        && pqh_user_can_manage_workspace((int)$USER->id, (int)$session->workspaceid)) {
        return true;
    }
    return (int)$session->teacherid === (int)$USER->id;
}

function pqlmonl_student_cohort(int $studentid, int $fallback = 0): int {
    global $DB;
    if ($fallback > 0) {
        return $fallback;
    }
    $cohortid = $DB->get_field_sql(
        "SELECT cohortid FROM {cohort_members} WHERE userid = ? ORDER BY id DESC",
        [$studentid],
        IGNORE_MULTIPLE
    );
    return $cohortid ? (int)$cohortid : 0;
}

function pqlmonl_lesson_link(int $studentid, int $cohortid, string $unitid, int $sessionid, array $workspaceurlparams = []): moodle_url {
    $params = [
        'goto' => $unitid !== '' ? $unitid : 'alphabet_listen',
        'managed_student' => 0,
    ] + $workspaceurlparams;
    if ($cohortid > 0) {
        $params['cohortid'] = $cohortid;
    }
    $params['monitor_studentid'] = $studentid;
    if ($sessionid > 0) {
        $params['live_sessionid'] = $sessionid;
    }
    return new moodle_url('/local/hubredirect/issue_child.php', $params);
}

function pqlmonl_progress(int $studentid): array {
    global $DB;
    $summary = [
        'units' => 0,
        'completed' => 0,
        'inprogress' => 0,
        'steps' => 0,
        'latest' => null,
    ];
    if (!pqlmonl_table_exists('local_prequran_lessonprog')) {
        return $summary;
    }
    $summary['units'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid]);
    $summary['completed'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'completed']);
    $summary['inprogress'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'in_progress']);
    $summary['steps'] = (int)$DB->get_field_sql(
        "SELECT COALESCE(SUM(steps_completed), 0) FROM {local_prequran_lessonprog} WHERE userid = ?",
        [$studentid]
    );
    $stepstotalfield = pqlmonl_column_exists('local_prequran_lessonprog', 'steps_total')
        ? 'steps_total'
        : (pqlmonl_column_exists('local_prequran_lessonprog', 'total_steps') ? 'total_steps' : '0');
    $summary['latest'] = $DB->get_record_sql(
        "SELECT lessonid, unitid, lesson_title, unit_title, overall_status, overall_lastactivity, completion_percent, steps_completed, {$stepstotalfield} AS steps_total
           FROM {local_prequran_lessonprog}
          WHERE userid = ?
       ORDER BY overall_lastactivity DESC, timemodified DESC",
        [$studentid],
        IGNORE_MULTIPLE
    );
    return $summary;
}

function pqlmonl_focus(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'scoped' => false,
        'sessions' => 0,
        'active_ms' => 0,
        'idle_count' => 0,
        'leave_count' => 0,
        'latest' => null,
    ];
    if (!pqlmonl_table_exists('local_prequran_focusagg')) {
        return $summary;
    }
    $summary['ready'] = true;
    $haslivesession = pqlmonl_column_exists('local_prequran_focusagg', 'live_sessionid');
    if (!$haslivesession || $sessionid <= 0) {
        return $summary;
    }
    $summary['scoped'] = true;
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS sessions,
                COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                COALESCE(SUM(leave_count), 0) AS leave_count
           FROM {local_prequran_focusagg}
          WHERE userid = ?
            AND live_sessionid = ?",
        [$studentid, $sessionid]
    );
    if ($row) {
        $summary['sessions'] = (int)$row->sessions;
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['leave_count'] = (int)$row->leave_count;
    }
    $summary['latest'] = $DB->get_record_sql(
        "SELECT lessonid, unitid, step_id, active_ms, idle_count, leave_count, last_time, live_sessionid
           FROM {local_prequran_focusagg}
          WHERE userid = ?
            AND live_sessionid = ?
       ORDER BY last_time DESC",
        [$studentid, $sessionid],
        IGNORE_MULTIPLE
    );
    return $summary;
}

function pqlmonl_speak(int $studentid): array {
    global $DB;
    $summary = ['ready' => false, 'count' => 0, 'latest' => null];
    if (!pqlmonl_table_exists('local_prequran_speakrec')) {
        return $summary;
    }
    $summary['ready'] = true;
    $summary['count'] = (int)$DB->count_records_select(
        'local_prequran_speakrec',
        'userid = :userid AND status <> :failed',
        ['userid' => $studentid, 'failed' => 'upload_failed']
    );
    $summary['latest'] = $DB->get_record_sql(
        "SELECT id, lessonid, unitid, letter_name, letter_text, duration_ms, timecreated
           FROM {local_prequran_speakrec}
          WHERE userid = ?
            AND status <> ?
       ORDER BY timecreated DESC, id DESC",
        [$studentid, 'upload_failed'],
        IGNORE_MULTIPLE
    );
    return $summary;
}

function pqlmonl_practice_coach(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'count' => 0,
        'idle' => 0,
        'away' => 0,
        'latest' => null,
        'events' => [],
    ];
    if (!pqlmonl_table_exists('local_prequran_practice_coach_event')) {
        return $summary;
    }
    $summary['ready'] = true;
    $recommendationselect = pqlmonl_column_exists('local_prequran_practice_coach_event', 'recommendation_key')
        ? 'recommendation_key, recommendation_message, message_source, ai_model,'
        : "'' AS recommendation_key, '' AS recommendation_message, '' AS message_source, '' AS ai_model,";
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS coach_count,
                SUM(CASE WHEN trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                MAX(timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['count'] = (int)$row->coach_count;
        $summary['idle'] = (int)$row->idle_count;
        $summary['away'] = (int)$row->away_count;
    }
    $summary['latest'] = $DB->get_record_sql(
        "SELECT trigger_key, {$recommendationselect} message, timecreated
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY timecreated DESC, id DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        IGNORE_MULTIPLE
    );
    $summary['events'] = array_values($DB->get_records_sql(
        "SELECT id, trigger_key, event_type, step_id, {$recommendationselect} message, timecreated
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY timecreated DESC, id DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        0,
        5
    ));
    return $summary;
}

function pqlmonl_format_minutes(int $ms): string {
    $minutes = (int)round($ms / 60000);
    return $minutes . ' min';
}

function pqlmonl_time_ago(int $timestamp): string {
    if ($timestamp <= 0) {
        return 'no activity yet';
    }
    $seconds = max(0, time() - $timestamp);
    if ($seconds < 10) {
        return 'just now';
    }
    if ($seconds < MINSECS) {
        return $seconds . ' seconds ago';
    }
    if ($seconds < HOURSECS) {
        $minutes = (int)floor($seconds / MINSECS);
        return $minutes . ' min ago';
    }
    $hours = (int)floor($seconds / HOURSECS);
    return $hours . ' hr ago';
}

function pqlmonl_duration_since(int $timestamp): string {
    if ($timestamp <= 0) {
        return 'unknown';
    }
    $seconds = max(0, time() - $timestamp);
    if ($seconds < MINSECS) {
        return $seconds . ' sec';
    }
    if ($seconds < HOURSECS) {
        return (int)floor($seconds / MINSECS) . ' min';
    }
    return (int)floor($seconds / HOURSECS) . ' hr';
}

function pqlmonl_step_label(string $stepid): string {
    $stepid = trim($stepid);
    if ($stepid === '') {
        return 'Not started';
    }
    $labels = [
        'lecture' => 'Lecture',
        'listen' => 'Listen',
        'watch' => 'Watch',
        'speak' => 'Speak',
        'write' => 'Write',
        'trace' => 'Trace',
        'submit' => 'Submit',
        'practice' => 'Practice',
        'rules' => 'Rules',
    ];
    $normalized = strtolower($stepid);
    foreach ($labels as $needle => $label) {
        if ($normalized === $needle || strpos($normalized, $needle) !== false) {
            return $label;
        }
    }
    return ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqlmonl_live_indicators(array $focus, array $progress): array {
    $latestfocus = $focus['latest'] ?? null;
    $lastfocus = $latestfocus ? (int)$latestfocus->last_time : 0;
    $lastactivity = $lastfocus;
    $age = $lastactivity > 0 ? max(0, time() - $lastactivity) : PHP_INT_MAX;

    $latestidle = $latestfocus ? (int)$latestfocus->idle_count : 0;
    $latestleave = $latestfocus ? (int)$latestfocus->leave_count : 0;
    $totalidle = (int)($focus['idle_count'] ?? 0);
    $totalleave = (int)($focus['leave_count'] ?? 0);

    if ($lastactivity <= 0) {
        $status = 'Not opened yet';
        $tone = 'muted';
    } else if ($age <= 75) {
        $status = 'Currently active';
        $tone = 'active';
    } else if ($age <= 5 * MINSECS && ($latestidle > 0 || $totalidle > 0)) {
        $status = 'Idle for ' . pqlmonl_duration_since($lastactivity);
        $tone = 'idle';
    } else if ($latestleave > 0 || ($age > 5 * MINSECS && $totalleave > 0)) {
        $status = 'Left lesson tab';
        $tone = 'away';
    } else {
        $status = 'Last seen ' . pqlmonl_time_ago($lastactivity);
        $tone = 'muted';
    }

    $stepid = $latestfocus ? (string)$latestfocus->step_id : '';
    return [
        'status' => $status,
        'tone' => $tone,
        'step' => pqlmonl_step_label($stepid),
        'last_activity' => pqlmonl_time_ago($lastactivity),
        'idle_summary' => $totalidle > 0 ? 'Idle events: ' . $totalidle : 'No idle events',
        'leave_summary' => $totalleave > 0 ? 'Left tab: ' . $totalleave : 'No tab leaves',
    ];
}

function pqlmonl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlmonl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}
