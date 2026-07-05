<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace teaching and admin users can view academic quality controls.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Academic quality controls access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening academic quality controls.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Academic quality controls unavailable'
    );
}

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

$issues = pqaqc_all_issues($workspaceid);

if (optional_param('export', '', PARAM_ALPHANUMEXT) === 'csv') {
    $filename = 'academic-quality-controls-' . $workspaceid . '-' . date('Ymd-His') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $headers = ['issue_type', 'studentid', 'student_email', 'title', 'status', 'severity', 'evidence', 'updated'];
    echo implode(',', array_map('pqaqc_csv_cell', $headers)) . "\n";
    foreach ($issues as $issue) {
        echo implode(',', array_map('pqaqc_csv_cell', array_map('strval', $issue))) . "\n";
    }
    exit;
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/academic_quality_controls.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Academic Quality Controls');
$PAGE->set_heading('Academic Quality Controls');
$PAGE->add_body_class('pqaqc-page');

$sections = [
    'Missing Grade Detection' => array_values(array_filter($issues, fn($issue) => $issue['issue_type'] === 'missing_grade')),
    'Incomplete Attendance Detection' => array_values(array_filter($issues, fn($issue) => $issue['issue_type'] === 'incomplete_attendance')),
    'Low-score / Progress Alerts' => array_values(array_filter($issues, fn($issue) => in_array($issue['issue_type'], ['low_score_alert', 'progress_alert'], true))),
];

echo $OUTPUT->header();
echo '<style>.pqaqc{max-width:1180px;margin:0 auto}.pqaqc-top{display:flex;justify-content:space-between;gap:16px;margin-bottom:16px}.pqaqc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.pqaqc-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:14px;margin-bottom:14px}.pqaqc-card{border:1px solid #e3ece5;border-radius:8px;padding:10px;margin:8px 0;background:#fbfdfb}.pqaqc-muted{color:#617064;font-size:12px}.pqaqc-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqaqc-pill--alert{background:#fff1db;color:#7c3c00}.pqaqc-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqaqc-btn--light{background:#f7fbf8;color:#173044}.pqaqc-table{width:100%;border-collapse:collapse}.pqaqc-table th,.pqaqc-table td{border-bottom:1px solid #e7eee8;padding:8px;text-align:left;vertical-align:top}@media(max-width:900px){.pqaqc-top,.pqaqc-grid{display:block}.pqaqc-panel{margin-bottom:12px}}</style>';
echo '<div class="pqaqc"><div class="pqaqc-top"><div><h2>Academic Quality Controls</h2><div class="pqaqc-muted">' . s($workspace->name) . ' missing grades, incomplete attendance, low-score alerts, progress alerts, and export evidence.</div></div><div><a class="pqaqc-btn pqaqc-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a> <a class="pqaqc-btn" href="' . (new moodle_url('/local/hubredirect/academic_quality_controls.php', $urlparams + ['export' => 'csv']))->out(false) . '">Export CSV</a></div></div>';
echo '<div class="pqaqc-grid">';
foreach ($sections as $title => $rows) {
    echo '<section class="pqaqc-panel"><h3>' . s($title) . '</h3><div class="pqaqc-pill' . (count($rows) ? ' pqaqc-pill--alert' : '') . '">' . count($rows) . ' open</div><div class="pqaqc-muted">Control evidence refreshed on page load.</div></section>';
}
echo '</div>';
foreach ($sections as $title => $rows) {
    echo '<section class="pqaqc-panel"><h3>' . s($title) . '</h3>';
    if ($rows) {
        echo '<table class="pqaqc-table"><thead><tr><th>Student</th><th>Evidence</th><th>Status</th></tr></thead><tbody>';
        foreach ($rows as $issue) {
            echo '<tr><td><strong>' . s($issue['student_email']) . '</strong><div class="pqaqc-muted">Student #' . s($issue['studentid']) . ' / ' . s($issue['issue_type']) . '</div></td><td><strong>' . s($issue['title']) . '</strong><div class="pqaqc-muted">' . s($issue['evidence']) . '</div></td><td><span class="pqaqc-pill pqaqc-pill--alert">' . s($issue['severity']) . '</span><div class="pqaqc-muted">' . s($issue['status']) . '</div></td></tr>';
        }
        echo '</tbody></table>';
    } else {
        echo '<div class="pqaqc-muted">No open issues found for this control.</div>';
    }
    echo '</section>';
}
echo '</div>';
echo $OUTPUT->footer();
