<?php
// Academic-quality-controls query library — extracted VERBATIM from
// academic_quality_controls.php (the pqaqc_* helpers) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqaqc_table_ready(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqaqc_has_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqaqc_workspace_filter(string $alias, string $table, array &$params, int $workspaceid): string {
    if (!pqaqc_has_field($table, 'workspaceid')) {
        return '1=1';
    }
    $key = preg_replace('/[^a-z0-9_]+/i', '', $alias . '_' . $table . '_workspaceid');
    $params[$key] = $workspaceid;
    return "({$alias}.workspaceid = :{$key} OR {$alias}.workspaceid = 0 OR {$alias}.workspaceid IS NULL)";
}

function pqaqc_issue(string $type, stdClass $row, string $title, string $status, string $severity, string $evidence): array {
    return [
        'issue_type' => $type,
        'studentid' => (string)(int)($row->studentid ?? $row->id ?? 0),
        'student_email' => (string)($row->email ?? ''),
        'title' => $title,
        'status' => $status,
        'severity' => $severity,
        'evidence' => $evidence,
        'updated' => (string)(int)($row->timemodified ?? $row->timecreated ?? 0),
    ];
}

function pqaqc_missing_grade_issues(int $workspaceid): array {
    global $DB;
    if (!pqaqc_table_ready('local_prequran_assessment') || !pqaqc_table_ready('local_prequran_teacher_student') || !pqaqc_table_ready('local_prequran_grade')) {
        return [];
    }
    $params = [
        'workspaceid' => $workspaceid,
        'tsstatus' => 'active',
        'astatus' => 'published',
    ];
    $tsfilter = pqaqc_workspace_filter('ts', 'local_prequran_teacher_student', $params, $workspaceid);
    $gfilter = pqaqc_workspace_filter('g', 'local_prequran_grade', $params, $workspaceid);
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT " . $DB->sql_concat('a.id', "'-'", 'ts.studentid') . " AS uniqid,
                ts.studentid,
                u.email,
                u.firstname,
                u.lastname,
                a.id AS assessmentid,
                a.title,
                a.assessment_type,
                a.status,
                a.timemodified
           FROM {local_prequran_assessment} a
           JOIN {local_prequran_teacher_student} ts ON (ts.workspaceid = a.workspaceid OR ts.workspaceid = 0 OR ts.workspaceid IS NULL) AND ts.status = :tsstatus
           JOIN {user} u ON u.id = ts.studentid
      LEFT JOIN {local_prequran_grade} g ON g.assessmentid = a.id AND g.studentid = ts.studentid AND {$gfilter}
          WHERE a.workspaceid = :workspaceid
            AND a.status = :astatus
            AND {$tsfilter}
            AND g.id IS NULL
       ORDER BY a.timemodified DESC, a.id DESC",
        $params,
        0,
        40
    );
    $issues = [];
    foreach ($rows as $row) {
        $issues[] = pqaqc_issue(
            'missing_grade',
            $row,
            (string)$row->title,
            'missing',
            'warning',
            'Published assessment has an active assigned student but no grade row.'
        );
    }
    return $issues;
}

function pqaqc_incomplete_attendance_issues(int $workspaceid): array {
    global $DB;
    if (!pqaqc_table_ready('local_prequran_live_session') || !pqaqc_table_ready('local_prequran_live_participant') || !pqaqc_table_ready('local_prequran_live_attendance')) {
        return [];
    }
    $params = [
        'workspaceid' => $workspaceid,
        'role' => 'student',
        'pstatus' => 'active',
        'cancelled' => 'cancelled',
    ];
    $pfilter = pqaqc_workspace_filter('p', 'local_prequran_live_participant', $params, $workspaceid);
    $afilter = pqaqc_workspace_filter('att', 'local_prequran_live_attendance', $params, $workspaceid);
    $rows = $DB->get_records_sql(
        "SELECT p.id AS participantid,
                p.studentid,
                u.email,
                u.firstname,
                u.lastname,
                s.id AS sessionid,
                s.title,
                s.status,
                s.scheduled_start,
                p.timemodified
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
           JOIN {user} u ON u.id = p.studentid
      LEFT JOIN {local_prequran_live_attendance} att ON att.sessionid = p.sessionid AND att.studentid = p.studentid AND {$afilter}
          WHERE s.workspaceid = :workspaceid
            AND s.status <> :cancelled
            AND p.role = :role
            AND p.status = :pstatus
            AND {$pfilter}
            AND (att.id IS NULL OR att.attendance_status = '')
       ORDER BY s.scheduled_start DESC, p.id DESC",
        $params,
        0,
        40
    );
    $issues = [];
    foreach ($rows as $row) {
        $issues[] = pqaqc_issue(
            'incomplete_attendance',
            $row,
            (string)$row->title,
            'missing',
            'warning',
            'Live-session participant has no completed attendance mark.'
        );
    }
    return $issues;
}

function pqaqc_low_score_issues(int $workspaceid, float $threshold = 70.0): array {
    global $DB;
    if (!pqaqc_table_ready('local_prequran_grade')) {
        return [];
    }
    $joinassessment = pqaqc_table_ready('local_prequran_assessment');
    $titlefield = $joinassessment ? 'a.title' : "'Assessment grade'";
    $joinsql = $joinassessment ? 'LEFT JOIN {local_prequran_assessment} a ON a.id = g.assessmentid' : '';
    $params = [
        'workspaceid' => $workspaceid,
        'published' => 'published',
        'reviewed' => 'reviewed',
    ];
    $gfilter = pqaqc_workspace_filter('g', 'local_prequran_grade', $params, $workspaceid);
    $rows = $DB->get_records_sql(
        "SELECT g.id,
                g.studentid,
                u.email,
                u.firstname,
                u.lastname,
                g.score_percent,
                g.status,
                g.timemodified,
                {$titlefield} AS title
           FROM {local_prequran_grade} g
           JOIN {user} u ON u.id = g.studentid
                {$joinsql}
          WHERE {$gfilter}
            AND (g.status = :published OR g.status = :reviewed)
       ORDER BY g.timemodified DESC, g.id DESC",
        $params,
        0,
        80
    );
    $issues = [];
    foreach ($rows as $row) {
        $score = (float)((string)($row->score_percent ?? '0'));
        if ($score > 0 && $score < $threshold) {
            $issues[] = pqaqc_issue(
                'low_score_alert',
                $row,
                (string)($row->title ?? 'Assessment grade'),
                (string)$row->status,
                'alert',
                'Score ' . format_float($score, 2) . '% is below the academic quality threshold.'
            );
        }
    }
    return $issues;
}

function pqaqc_progress_alert_issues(int $workspaceid): array {
    global $DB;
    if (!pqaqc_table_ready('local_prequran_student_path')) {
        return [];
    }
    $params = ['workspaceid' => $workspaceid];
    $filter = pqaqc_workspace_filter('sp', 'local_prequran_student_path', $params, $workspaceid);
    $rows = $DB->get_records_sql(
        "SELECT sp.id,
                sp.studentid,
                u.email,
                u.firstname,
                u.lastname,
                sp.advancement_status,
                sp.current_level,
                sp.teacher_comment,
                sp.recommendation_reason,
                sp.timemodified
           FROM {local_prequran_student_path} sp
           JOIN {user} u ON u.id = sp.studentid
          WHERE {$filter}
       ORDER BY sp.timemodified DESC, sp.id DESC",
        $params,
        0,
        80
    );
    $normal = ['on_track', 'promoted', 'completed', 'complete', 'ready', 'ready_for_next', 'pending'];
    $issues = [];
    foreach ($rows as $row) {
        $status = strtolower(trim((string)($row->advancement_status ?? '')));
        if ($status !== '' && !in_array($status, $normal, true)) {
            $issues[] = pqaqc_issue(
                'progress_alert',
                $row,
                (string)($row->current_level ?? 'Student progress'),
                (string)$row->advancement_status,
                'alert',
                trim((string)($row->teacher_comment ?? $row->recommendation_reason ?? 'Progress status requires follow-up.'))
            );
        }
    }
    return $issues;
}

function pqaqc_all_issues(int $workspaceid): array {
    return array_merge(
        pqaqc_missing_grade_issues($workspaceid),
        pqaqc_incomplete_attendance_issues($workspaceid),
        pqaqc_low_score_issues($workspaceid),
        pqaqc_progress_alert_issues($workspaceid)
    );
}

function pqaqc_csv_cell(string $value): string {
    return '"' . str_replace('"', '""', $value) . '"';
}
