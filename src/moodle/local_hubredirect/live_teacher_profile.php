<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can view teacher performance profiles.');

$pqltpconsumercontext = pqh_requested_consumer_context();
$pqltpbrandname = trim((string)($pqltpconsumercontext->consumername ?? 'EduPlatform')) ?: 'EduPlatform';

function pqltp_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltp_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqltp_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqltp_ready(): bool {
    return pqltp_table_exists('local_prequran_live_session')
        && pqltp_table_exists('local_prequran_live_participant')
        && pqltp_table_exists('local_prequran_live_attendance')
        && pqltp_table_exists('local_prequran_live_note')
        && pqltp_table_exists('local_prequran_live_audit')
        && pqltp_column_exists('local_prequran_live_session', 'qa_status')
        && pqltp_column_exists('local_prequran_live_session', 'qa_score');
}

function pqltp_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqltp_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqltp_short(string $value, int $max = 170): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqltp_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqltp_items(): array {
    return [
        'teacher_on_time' => 'Teacher started on time',
        'student_safety' => 'Student safety and privacy',
        'appropriate_interaction' => 'Appropriate interaction',
        'lesson_reviewed' => 'Lesson reviewed',
        'arabic_practice_quality' => 'Arabic practice quality',
        'interactive_tools' => 'Interactive tools used',
        'student_participation' => 'Student participation',
        'parent_summary_ready' => 'Parent summary ready',
        'recording_reviewed' => 'Recording reviewed',
        'technical_quality' => 'Technical quality',
    ];
}

function pqltp_decode_checklist(string $raw): array {
    $items = array_fill_keys(array_keys(pqltp_items()), 'not_checked');
    $decoded = json_decode(trim($raw), true);
    if (!is_array($decoded)) {
        return $items;
    }
    foreach ($items as $key => $default) {
        $value = isset($decoded[$key]) ? (string)$decoded[$key] : $default;
        $items[$key] = in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true) ? $value : $default;
    }
    return $items;
}

function pqltp_percent(int $part, int $whole): int {
    return $whole > 0 ? (int)round(($part / $whole) * 100) : 0;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_teacher_profile.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Performance Profile');
$PAGE->set_heading('Teacher Performance Profile');
$PAGE->add_body_class('pqh-live-teacher-profile-page');

$now = time();
$defaultfrom = usergetmidnight($now - (180 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqltp_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqltp_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$export = optional_param('export', optional_param('exqort', '', PARAM_ALPHANUMEXT), PARAM_ALPHANUMEXT);
$printpack = optional_param('print', optional_param('qrint', 0, PARAM_BOOL), PARAM_BOOL);
$ready = pqltp_ready();
if ($printpack) {
    $PAGE->add_body_class('pqltp-print-pack');
}

$teachername = $teacherid > 0 ? pqltp_user_name($teacherid, 'Teacher ' . $teacherid) : 'Teacher not selected';
$sessions = [];
$timeline = [];
$audits = [];
$concerns = [];
$followups = [];
$reviewpack = [
    'verdict' => 'No review data yet',
    'strengths' => [],
    'risks' => [],
    'actions' => [],
];
$metrics = [
    'sessions' => 0,
    'students' => 0,
    'reviewed' => 0,
    'avgscore' => 0,
    'passed' => 0,
    'needscoaching' => 0,
    'serious' => 0,
    'coachingopen' => 0,
    'coachingdone' => 0,
    'coachingoverdue' => 0,
    'leadershipopen' => 0,
    'plansopen' => 0,
    'plansdone' => 0,
    'plansoverdue' => 0,
    'followupsopen' => 0,
];

if ($ready && $teacherid > 0) {
    $coachingready = pqltp_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqltp_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqltp_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $checklistready = pqltp_column_exists('local_prequran_live_session', 'qa_checklist');
    $followupready = pqltp_table_exists('local_prequran_live_note') && pqltp_column_exists('local_prequran_live_note', 'followup_status');

    $coachingselect = $coachingready
        ? 's.qa_coaching_status, s.qa_coaching_priority, s.qa_coaching_due_date, s.qa_coaching_ackat, s.qa_coaching_completedat,'
        : "'none' AS qa_coaching_status, 'normal' AS qa_coaching_priority, 0 AS qa_coaching_due_date, 0 AS qa_coaching_ackat, 0 AS qa_coaching_completedat,";
    $leadershipselect = $leadershipready
        ? 's.leadership_review_status, s.leadership_review_reason, s.leadership_reviewat, s.leadership_clearedat,'
        : "'none' AS leadership_review_status, '' AS leadership_review_reason, 0 AS leadership_reviewat, 0 AS leadership_clearedat,";
    $improvementselect = $improvementready
        ? 's.improvement_plan_status, s.improvement_plan_priority, s.improvement_plan_due_date, s.improvement_plan_assignedat, s.improvement_plan_ackat, s.improvement_plan_completedat, s.improvement_plan_goals, s.improvement_plan_actions,'
        : "'none' AS improvement_plan_status, 'normal' AS improvement_plan_priority, 0 AS improvement_plan_due_date, 0 AS improvement_plan_assignedat, 0 AS improvement_plan_ackat, 0 AS improvement_plan_completedat, '' AS improvement_plan_goals, '' AS improvement_plan_actions,";
    $checklistselect = $checklistready ? 's.qa_checklist,' : "'' AS qa_checklist,";

    $sessions = array_values($DB->get_records_sql(
        "SELECT s.id, s.title, s.teacherid, s.scheduled_start, s.scheduled_end, s.status,
                s.qa_status, s.qa_score, s.qa_reviewedby, s.qa_reviewedat,
                {$checklistselect}
                {$coachingselect}
                {$leadershipselect}
                {$improvementselect}
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1) AS parent_summary_count
           FROM {local_prequran_live_session} s
          WHERE s.teacherid = :teacherid
            AND s.scheduled_start >= :fromtime
            AND s.scheduled_start <= :totime
            AND s.status <> :cancelled
       ORDER BY s.scheduled_start DESC, s.id DESC",
        ['teacherid' => $teacherid, 'fromtime' => $from, 'totime' => $to, 'cancelled' => 'cancelled'],
        0,
        400
    ));

    $scoretotal = 0;
    $reviewedcount = 0;
    $studentids = [];
    $concernmap = [];
    foreach (pqltp_items() as $key => $label) {
        $concernmap[$key] = ['label' => $label, 'concern' => 0, 'checked' => 0];
    }

    foreach ($sessions as $session) {
        $metrics['sessions']++;
        $qastatus = (string)$session->qa_status;
        $reviewed = $qastatus !== 'not_reviewed' && (int)$session->qa_reviewedat > 0;
        if ($reviewed) {
            $reviewedcount++;
            $scoretotal += (int)$session->qa_score;
        }
        $metrics['reviewed'] += $reviewed ? 1 : 0;
        $metrics['passed'] += $qastatus === 'passed' ? 1 : 0;
        $metrics['needscoaching'] += $qastatus === 'needs_coaching' ? 1 : 0;
        $metrics['serious'] += $qastatus === 'serious_issue' ? 1 : 0;
        $metrics['coachingopen'] += in_array((string)$session->qa_coaching_status, ['assigned', 'acknowledged'], true) ? 1 : 0;
        $metrics['coachingdone'] += (string)$session->qa_coaching_status === 'completed' ? 1 : 0;
        $metrics['coachingoverdue'] += in_array((string)$session->qa_coaching_status, ['assigned', 'acknowledged'], true)
            && (int)$session->qa_coaching_due_date > 0
            && (int)$session->qa_coaching_due_date < $now ? 1 : 0;
        $metrics['leadershipopen'] += in_array((string)$session->leadership_review_status, ['flagged', 'in_review'], true) ? 1 : 0;
        $metrics['plansopen'] += in_array((string)$session->improvement_plan_status, ['assigned', 'in_progress'], true) ? 1 : 0;
        $metrics['plansdone'] += (string)$session->improvement_plan_status === 'completed' ? 1 : 0;
        $metrics['plansoverdue'] += in_array((string)$session->improvement_plan_status, ['assigned', 'in_progress'], true)
            && (int)$session->improvement_plan_due_date > 0
            && (int)$session->improvement_plan_due_date < $now ? 1 : 0;

        foreach (pqltp_decode_checklist((string)$session->qa_checklist) as $key => $value) {
            if (!isset($concernmap[$key]) || $value === 'not_applicable' || $value === 'not_checked') {
                continue;
            }
            $concernmap[$key]['checked']++;
            if ($value === 'concern') {
                $concernmap[$key]['concern']++;
            }
        }
    }
    $metrics['avgscore'] = $reviewedcount > 0 ? (int)round($scoretotal / $reviewedcount) : 0;

    if (pqltp_table_exists('local_prequran_live_participant')) {
        $studentrows = $DB->get_records_sql(
            "SELECT DISTINCT p.studentid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
              WHERE s.teacherid = :teacherid
                AND s.scheduled_start >= :fromtime
                AND s.scheduled_start <= :totime",
            ['teacherid' => $teacherid, 'fromtime' => $from, 'totime' => $to]
        );
        foreach ($studentrows as $row) {
            $studentids[(int)$row->studentid] = true;
        }
        $metrics['students'] = count($studentids);
    }

    $concerns = array_values($concernmap);
    usort($concerns, static function(array $a, array $b): int {
        $arate = pqltp_percent((int)$a['concern'], (int)$a['checked']);
        $brate = pqltp_percent((int)$b['concern'], (int)$b['checked']);
        if ($arate === $brate) {
            return ((int)$b['concern']) <=> ((int)$a['concern']);
        }
        return $brate <=> $arate;
    });

    if ($followupready) {
        $followups = array_values($DB->get_records_sql(
            "SELECT n.*,
                    s.title AS session_title,
                    s.scheduled_start
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE s.teacherid = :teacherid
                AND n.followup_status <> :none
           ORDER BY n.followup_resolved ASC, n.timemodified DESC",
            ['teacherid' => $teacherid, 'none' => 'none'],
            0,
            40
        ));
        foreach ($followups as $followup) {
            $metrics['followupsopen'] += empty($followup->followup_resolved) ? 1 : 0;
        }
    }

    $passrate = pqltp_percent((int)$metrics['passed'], (int)$metrics['reviewed']);
    $reviewcoverage = pqltp_percent((int)$metrics['reviewed'], (int)$metrics['sessions']);
    $issuecount = (int)$metrics['needscoaching'] + (int)$metrics['serious'];
    if ((int)$metrics['leadershipopen'] > 0 || (int)$metrics['serious'] > 0 || (int)$metrics['plansoverdue'] > 0) {
        $reviewpack['verdict'] = 'Leadership attention recommended';
    } else if ($issuecount > 0 || (int)$metrics['coachingopen'] > 0 || (int)$metrics['avgscore'] < 80) {
        $reviewpack['verdict'] = 'Coaching follow-up recommended';
    } else if ((int)$metrics['reviewed'] > 0) {
        $reviewpack['verdict'] = 'Performance currently stable';
    }

    if ($passrate >= 80 && (int)$metrics['reviewed'] > 0) {
        $reviewpack['strengths'][] = 'High QA pass rate across reviewed live sessions.';
    }
    if ($reviewcoverage >= 80 && (int)$metrics['sessions'] > 0) {
        $reviewpack['strengths'][] = 'Most sessions in the selected range have QA review coverage.';
    }
    if ((int)$metrics['plansdone'] > 0) {
        $reviewpack['strengths'][] = 'Completed improvement plan work is present in the history.';
    }
    if ((int)$metrics['followupsopen'] === 0) {
        $reviewpack['strengths'][] = 'No open parent follow-up items are currently visible in the profile.';
    }

    if ((int)$metrics['serious'] > 0) {
        $reviewpack['risks'][] = 'One or more QA reviews were marked as serious issue.';
    }
    if ((int)$metrics['coachingoverdue'] > 0) {
        $reviewpack['risks'][] = 'There are overdue QA coaching items.';
    }
    if ((int)$metrics['plansoverdue'] > 0) {
        $reviewpack['risks'][] = 'There are overdue teacher improvement plan items.';
    }
    if ((int)$metrics['followupsopen'] > 0) {
        $reviewpack['risks'][] = 'There are open parent follow-up items that may need closure.';
    }
    foreach (array_slice($concerns, 0, 3) as $concern) {
        if ((int)$concern['concern'] > 0) {
            $reviewpack['risks'][] = $concern['label'] . ' appears as a recurring QA concern.';
        }
    }

    if ((int)$metrics['coachingopen'] > 0) {
        $reviewpack['actions'][] = 'Review open QA coaching items with the teacher and confirm next steps.';
    }
    if ((int)$metrics['plansopen'] > 0) {
        $reviewpack['actions'][] = 'Use the improvement plan history to confirm progress, blockers, and due dates.';
    }
    if ((int)$metrics['leadershipopen'] > 0) {
        $reviewpack['actions'][] = 'Resolve open leadership review cases before marking the teacher profile stable.';
    }
    if ((int)$metrics['followupsopen'] > 0) {
        $reviewpack['actions'][] = 'Close or escalate parent follow-up items after parent-safe communication is complete.';
    }
    if (!$reviewpack['actions']) {
        $reviewpack['actions'][] = 'Continue routine QA sampling and keep parent follow-up records current.';
    }

    $audits = array_values($DB->get_records_sql(
        "SELECT a.*
           FROM {local_prequran_live_audit} a
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE s.teacherid = :teacherid
             OR (a.targettype = :targetuser AND a.targetid = :teacherid2)
       ORDER BY a.timecreated DESC, a.id DESC",
        ['teacherid' => $teacherid, 'targetuser' => 'user', 'teacherid2' => $teacherid],
        0,
        80
    ));

    foreach ($sessions as $session) {
        $timeline[] = [
            'time' => (int)$session->scheduled_start,
            'type' => 'live_session',
            'sessionid' => (int)$session->id,
            'title' => (string)$session->title,
            'status' => (string)$session->status,
            'detail' => 'Students ' . (int)$session->student_count . ', attendance ' . (int)$session->attendance_count . ', summaries ' . (int)$session->parent_summary_count,
        ];
        if ((int)$session->qa_reviewedat > 0) {
            $timeline[] = [
                'time' => (int)$session->qa_reviewedat,
                'type' => 'qa_review',
                'sessionid' => (int)$session->id,
                'title' => (string)$session->title,
                'status' => (string)$session->qa_status,
                'detail' => 'QA score ' . (int)$session->qa_score . '%',
            ];
        }
        if ((int)$session->improvement_plan_assignedat > 0) {
            $timeline[] = [
                'time' => (int)$session->improvement_plan_assignedat,
                'type' => 'improvement_plan',
                'sessionid' => (int)$session->id,
                'title' => (string)$session->title,
                'status' => (string)$session->improvement_plan_status,
                'detail' => pqltp_short((string)$session->improvement_plan_goals, 140),
            ];
        }
    }
    foreach ($audits as $audit) {
        if (in_array((string)$audit->action, ['quality_coaching_teacher_reminder_sent', 'quality_coaching_admin_escalated', 'leadership_review_auto_flagged', 'improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_admin_escalated', 'improvement_plan_acknowledged'], true)) {
            $timeline[] = [
                'time' => (int)$audit->timecreated,
                'type' => 'audit',
                'sessionid' => (int)$audit->sessionid,
                'title' => str_replace('_', ' ', (string)$audit->action),
                'status' => (string)$audit->targettype,
                'detail' => pqltp_short((string)$audit->details, 150),
            ];
        }
    }
    usort($timeline, static function(array $a, array $b): int {
        return $b['time'] <=> $a['time'];
    });
    $timeline = array_slice($timeline, 0, 120);
}

if ($ready && $teacherid > 0 && $export === 'reviewpack') {
    $rows = [
        ['profile', 'teacher', $teachername, 'Teacher ID ' . $teacherid],
        ['profile', 'range', date('Y-m-d', $from) . ' to ' . date('Y-m-d', $to), 'Generated ' . userdate(time(), get_string('strftimedatetimeshort'))],
        ['summary', 'verdict', $reviewpack['verdict'], ''],
        ['metric', 'sessions', (int)$metrics['sessions'], ''],
        ['metric', 'students', (int)$metrics['students'], 'distinct students'],
        ['metric', 'qa_reviewed', (int)$metrics['reviewed'], pqltp_percent((int)$metrics['reviewed'], (int)$metrics['sessions']) . '% review coverage'],
        ['metric', 'average_qa_score', (int)$metrics['avgscore'] . '%', ''],
        ['metric', 'qa_pass_rate', pqltp_percent((int)$metrics['passed'], (int)$metrics['reviewed']) . '%', ''],
        ['metric', 'qa_issues', (int)$metrics['needscoaching'] + (int)$metrics['serious'], (int)$metrics['serious'] . ' serious'],
        ['metric', 'open_coaching', (int)$metrics['coachingopen'], (int)$metrics['coachingoverdue'] . ' overdue'],
        ['metric', 'open_improvement_plans', (int)$metrics['plansopen'], (int)$metrics['plansoverdue'] . ' overdue'],
        ['metric', 'open_leadership_cases', (int)$metrics['leadershipopen'], ''],
        ['metric', 'open_parent_followups', (int)$metrics['followupsopen'], ''],
    ];
    foreach ($reviewpack['strengths'] as $item) {
        $rows[] = ['strength', $item, '', ''];
    }
    foreach ($reviewpack['risks'] as $item) {
        $rows[] = ['risk', $item, '', ''];
    }
    foreach ($reviewpack['actions'] as $item) {
        $rows[] = ['recommended_action', $item, '', ''];
    }
    foreach (array_slice($concerns, 0, 10) as $concern) {
        $rows[] = ['qa_concern', $concern['label'], (int)$concern['concern'], pqltp_percent((int)$concern['concern'], (int)$concern['checked']) . '% concern rate'];
    }
    foreach (array_slice($sessions, 0, 80) as $session) {
        $rows[] = [
            'session',
            '#' . (int)$session->id . ' ' . (string)$session->title,
            userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')),
            'QA ' . (string)$session->qa_status . ' ' . (int)$session->qa_score . '%; coaching ' . (string)$session->qa_coaching_status . '; plan ' . (string)$session->improvement_plan_status,
        ];
    }
    pqltp_csv('quraan-teacher-review-pack-' . $teacherid . '.csv', ['section', 'item', 'value', 'detail'], $rows);
}

if ($ready && $teacherid > 0 && $export === 'profile') {
    $rows = [];
    foreach ($sessions as $session) {
        $rows[] = [
            (int)$session->id,
            (string)$session->title,
            userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')),
            (string)$session->status,
            (int)$session->student_count,
            (int)$session->attendance_count,
            (int)$session->parent_summary_count,
            (string)$session->qa_status,
            (int)$session->qa_score,
            (string)$session->qa_coaching_status,
            (string)$session->leadership_review_status,
            (string)$session->improvement_plan_status,
            (string)$session->improvement_plan_priority,
            !empty($session->improvement_plan_due_date) ? userdate((int)$session->improvement_plan_due_date, get_string('strftimedatetimeshort')) : '',
        ];
    }
    pqltp_csv('quraan-teacher-performance-profile-' . $teacherid . '.csv', ['sessionid', 'title', 'start', 'status', 'students', 'attendance_rows', 'parent_summaries', 'qa_status', 'qa_score', 'coaching_status', 'leadership_status', 'improvement_status', 'improvement_priority', 'improvement_due'], $rows);
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-teacher-profile-page header,
body.pqh-live-teacher-profile-page footer,
body.pqh-live-teacher-profile-page nav.navbar,
body.pqh-live-teacher-profile-page #page-header,
body.pqh-live-teacher-profile-page #page-footer,
body.pqh-live-teacher-profile-page .drawer,
body.pqh-live-teacher-profile-page .drawer-toggles,
body.pqh-live-teacher-profile-page .block-region,
body.pqh-live-teacher-profile-page [data-region="drawer"],
body.pqh-live-teacher-profile-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-teacher-profile-page #page,
body.pqh-live-teacher-profile-page #page-content,
body.pqh-live-teacher-profile-page #region-main,
body.pqh-live-teacher-profile-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqltp-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqltp-wrap{max-width:1260px;margin:0 auto}
.pqltp-top,.pqltp-panel,.pqltp-card{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqltp-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqltp-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqltp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqltp-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqltp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqltp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqltp-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}
.pqltp-field{display:grid;gap:6px}
.pqltp-field label{font-size:12px;font-weight:900;color:#415665}
.pqltp-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.25 system-ui;background:#fff;color:#173044}
.pqltp-metrics{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:16px 0}
.pqltp-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqltp-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqltp-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqltp-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}
.pqltp-grid--single{display:grid;gap:14px}
.pqltp-panel h2,.pqltp-card h2{margin:0 0 12px;font-size:20px;font-weight:950}
.pqltp-list{display:grid;gap:12px}
.pqltp-card-head{display:flex;justify-content:space-between;gap:14px;margin-bottom:10px}
.pqltp-card h3{margin:0;font-size:18px;font-weight:950;color:#173044}
.pqltp-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqltp-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqltp-pill--ok{background:#edf9ef;color:#245c35}
.pqltp-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqltp-pill--bad{background:#fff0ed;color:#883526}
.pqltp-table{width:100%;border-collapse:collapse;font-size:13px}
.pqltp-table th,.pqltp-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqltp-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqltp-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqltp-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqltp-review{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0}
.pqltp-review-box{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqltp-review-box h2{margin:0 0 10px;font-size:18px;font-weight:950}
.pqltp-review-box ul{margin:0;padding-left:18px;color:#415665;font-size:13px;font-weight:760}
.pqltp-review-box li{margin:7px 0}
.pqltp-print-note{display:none;margin:0 0 12px;color:#415665;font-size:12px;font-weight:800}
@media(max-width:1100px){.pqltp-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqltp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqltp-grid{grid-template-columns:1fr}.pqltp-top{display:block}.pqltp-actions{margin-top:12px}.pqltp-table{display:block;overflow:auto}}
@media(max-width:900px){.pqltp-review{grid-template-columns:1fr}}
@media(max-width:620px){.pqltp-filters,.pqltp-metrics{grid-template-columns:1fr}.pqltp-title{font-size:24px}.pqltp-card-head{display:block}}
@media print{
  body.pqh-live-teacher-profile-page{background:#fff!important}
  .pqltp-shell{padding:0;background:#fff}
  .pqltp-wrap{max-width:none}
  .pqltp-actions,.pqltp-panel form,.pqltp-top .pqltp-actions{display:none!important}
  .pqltp-top,.pqltp-panel,.pqltp-card,.pqltp-metric,.pqltp-review-box{box-shadow:none!important;break-inside:avoid;border-color:#ccd6dd}
  .pqltp-print-note{display:block}
  .pqltp-metrics{grid-template-columns:repeat(5,minmax(0,1fr))}
  .pqltp-grid,.pqltp-review{grid-template-columns:1fr}
}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqltp-shell">
  <div class="pqltp-wrap">
    <section class="pqltp-top pqh-workspace-top">
      <div>
        <h1 class="pqltp-title pqh-workspace-title">Teacher Performance Profile</h1>
        <p class="pqltp-sub pqh-workspace-sub"><?php echo s($teachername); ?> - QA, coaching, leadership, improvement plans, and class timeline.</p>
      </div>
      <div class="pqltp-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false); ?>">Teacher directory</a>
        <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php'))->out(false); ?>">Improvement plans</a>
        <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php'))->out(false); ?>">QA analytics</a>
        <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php'))->out(false); ?>">Leadership</a>
        <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqltp-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqltp-empty">Teacher profile requires live-session and QA columns.</div>
    <?php else: ?>
      <section class="pqltp-panel">
        <form method="get">
          <div class="pqltp-filters">
            <div class="pqltp-field"><label for="teacherid">Teacher ID</label><input class="pqltp-input" id="teacherid" name="teacherid" type="number" min="1" value="<?php echo (int)$teacherid; ?>"></div>
            <div class="pqltp-field"><label for="from">From</label><input class="pqltp-input" id="from" name="from" type="date" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
            <div class="pqltp-field"><label for="to">To</label><input class="pqltp-input" id="to" name="to" type="date" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
            <div class="pqltp-field"><label>&nbsp;</label><button class="pqltp-btn" type="submit">Load profile</button></div>
          </div>
          <?php if ($teacherid > 0): ?>
            <div class="pqltp-actions pqh-workspace-actions">
              <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', ['teacherid' => $teacherid, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'export' => 'profile']))->out(false); ?>">Export CSV</a>
              <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', ['teacherid' => $teacherid, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'export' => 'reviewpack']))->out(false); ?>">Export review pack</a>
              <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', ['teacherid' => $teacherid, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'print' => 1]))->out(false); ?>">Printable review pack</a>
              <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_workspace.php', ['teacherid' => $teacherid]))->out(false); ?>">Teacher workspace</a>
            </div>
          <?php endif; ?>
        </form>
      </section>

      <?php if ($teacherid <= 0): ?>
        <div class="pqltp-empty">Enter a teacher user ID to view the performance profile.</div>
      <?php else: ?>
        <section class="pqltp-metrics">
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['sessions']; ?></strong><span>sessions</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['reviewed']; ?></strong><span>QA reviewed</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['avgscore']; ?>%</strong><span>avg QA</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['needscoaching'] + (int)$metrics['serious']; ?></strong><span>QA issues</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['coachingopen']; ?></strong><span>coaching open</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['plansopen']; ?></strong><span>plans open</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['plansoverdue']; ?></strong><span>plans overdue</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['leadershipopen']; ?></strong><span>leadership open</span></div>
          <div class="pqltp-metric"><strong><?php echo (int)$metrics['followupsopen']; ?></strong><span>follow-ups open</span></div>
        </section>

        <section class="pqltp-panel" style="margin-bottom:16px">
          <p class="pqltp-print-note"><?php echo s($pqltpbrandname); ?> teacher review pack - generated <?php echo s(userdate(time(), get_string('strftimedatetimeshort'))); ?>.</p>
          <div class="pqltp-card-head">
            <div>
              <h2>Leadership Review Pack</h2>
              <p class="pqltp-meta">Use this section for coaching meetings, leadership review, and internal documentation.</p>
            </div>
            <span class="pqltp-pill <?php echo $reviewpack['verdict'] === 'Performance currently stable' ? 'pqltp-pill--ok' : ($reviewpack['verdict'] === 'Leadership attention recommended' ? 'pqltp-pill--bad' : 'pqltp-pill--warn'); ?>"><?php echo s($reviewpack['verdict']); ?></span>
          </div>
          <div class="pqltp-review">
            <div class="pqltp-review-box">
              <h2>Strengths</h2>
              <ul>
                <?php foreach ($reviewpack['strengths'] ?: ['Not enough reviewed data to identify stable strengths yet.'] as $item): ?>
                  <li><?php echo s($item); ?></li>
                <?php endforeach; ?>
              </ul>
            </div>
            <div class="pqltp-review-box">
              <h2>Risks To Discuss</h2>
              <ul>
                <?php foreach ($reviewpack['risks'] ?: ['No major risks surfaced in the selected range.'] as $item): ?>
                  <li><?php echo s($item); ?></li>
                <?php endforeach; ?>
              </ul>
            </div>
            <div class="pqltp-review-box">
              <h2>Recommended Actions</h2>
              <ul>
                <?php foreach ($reviewpack['actions'] as $item): ?>
                  <li><?php echo s($item); ?></li>
                <?php endforeach; ?>
              </ul>
            </div>
          </div>
        </section>

        <section class="pqltp-grid">
          <article class="pqltp-panel">
            <h2>Timeline</h2>
            <div class="pqltp-list">
              <?php foreach ($timeline as $item): ?>
                <article class="pqltp-card">
                  <div class="pqltp-card-head">
                    <div>
                      <h3><?php echo s($item['title']); ?></h3>
                      <p class="pqltp-meta"><?php echo s(userdate((int)$item['time'], get_string('strftimedatetimeshort'))); ?> - <?php echo s(str_replace('_', ' ', $item['type'])); ?></p>
                    </div>
                    <span class="pqltp-pill"><?php echo s(str_replace('_', ' ', $item['status'])); ?></span>
                  </div>
                  <p class="pqltp-meta"><?php echo s($item['detail']); ?></p>
                  <?php if ((int)$item['sessionid'] > 0): ?>
                    <div class="pqltp-actions pqh-workspace-actions">
                      <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => (int)$item['sessionid']]))->out(false); ?>">QA</a>
                      <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', ['sessionid' => (int)$item['sessionid']]))->out(false); ?>">Review</a>
                    </div>
                  <?php endif; ?>
                </article>
              <?php endforeach; ?>
              <?php if (!$timeline): ?><div class="pqltp-empty">No timeline items in this range.</div><?php endif; ?>
            </div>
          </article>

          <aside class="pqltp-panel">
            <h2>Recurring QA Concerns</h2>
            <table class="pqltp-table">
              <tr><th>Area</th><th>Concern</th><th>Checked</th><th>Rate</th></tr>
              <?php foreach (array_slice($concerns, 0, 10) as $concern): ?>
                <tr>
                  <td><?php echo s($concern['label']); ?></td>
                  <td><?php echo (int)$concern['concern']; ?></td>
                  <td><?php echo (int)$concern['checked']; ?></td>
                  <td><span class="pqltp-pill <?php echo pqltp_percent((int)$concern['concern'], (int)$concern['checked']) >= 30 ? 'pqltp-pill--bad' : 'pqltp-pill--ok'; ?>"><?php echo pqltp_percent((int)$concern['concern'], (int)$concern['checked']); ?>%</span></td>
                </tr>
              <?php endforeach; ?>
              <?php if (!$concerns): ?><tr><td colspan="4">No QA checklist concerns found.</td></tr><?php endif; ?>
            </table>

            <h2 style="margin-top:18px">Parent Follow-Up Indicators</h2>
            <table class="pqltp-table">
              <tr><th>Student</th><th>Session</th><th>Status</th><th>Updated</th></tr>
              <?php foreach (array_slice($followups, 0, 12) as $followup): ?>
                <tr>
                  <td><?php echo s(pqltp_user_name((int)$followup->studentid, 'Student ' . (int)$followup->studentid)); ?></td>
                  <td><?php echo s((string)$followup->session_title); ?></td>
                  <td><span class="pqltp-pill <?php echo empty($followup->followup_resolved) ? 'pqltp-pill--warn' : 'pqltp-pill--ok'; ?>"><?php echo s(str_replace('_', ' ', (string)$followup->followup_status)); ?></span></td>
                  <td><?php echo s(userdate((int)$followup->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
              <?php if (!$followups): ?><tr><td colspan="4">No teacher-parent follow-up indicators.</td></tr><?php endif; ?>
            </table>
          </aside>
        </section>

        <section class="pqltp-panel" style="margin-top:16px">
          <h2>Session Record</h2>
          <table class="pqltp-table">
            <tr><th>Session</th><th>Date</th><th>Students</th><th>QA</th><th>Coaching</th><th>Leadership</th><th>Improvement</th><th>Action</th></tr>
            <?php foreach (array_slice($sessions, 0, 80) as $session): ?>
              <tr>
                <td><?php echo s((string)$session->title); ?><br><span class="pqltp-code">#<?php echo (int)$session->id; ?></span></td>
                <td><?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?></td>
                <td><?php echo (int)$session->student_count; ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$session->qa_status)); ?><br><span class="pqltp-code"><?php echo (int)$session->qa_score; ?>%</span></td>
                <td><?php echo s(str_replace('_', ' ', (string)$session->qa_coaching_status)); ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$session->leadership_review_status)); ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$session->improvement_plan_status)); ?><?php echo !empty($session->improvement_plan_due_date) ? '<br><span class="pqltp-code">Due ' . s(userdate((int)$session->improvement_plan_due_date, get_string('strftimedatetimeshort'))) . '</span>' : ''; ?></td>
                <td>
                  <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => (int)$session->id]))->out(false); ?>">QA</a>
                  <a class="pqltp-btn pqltp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', ['sessionid' => (int)$session->id]))->out(false); ?>">Review</a>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$sessions): ?><tr><td colspan="8">No live sessions for this teacher in this range.</td></tr><?php endif; ?>
          </table>
        </section>

        <section class="pqltp-panel" style="margin-top:16px">
          <h2>Recent Audit</h2>
          <table class="pqltp-table">
            <tr><th>Time</th><th>Session</th><th>Actor</th><th>Action</th><th>Details</th></tr>
            <?php foreach ($audits as $audit): ?>
              <tr>
                <td><?php echo s(userdate((int)$audit->timecreated, get_string('strftimedatetimeshort'))); ?></td>
                <td>#<?php echo (int)$audit->sessionid; ?></td>
                <td><?php echo (int)$audit->actorid > 0 ? s(pqltp_user_name((int)$audit->actorid, 'User ' . (int)$audit->actorid)) : 'System'; ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$audit->action)); ?></td>
                <td><span class="pqltp-code"><?php echo s(pqltp_short((string)$audit->details, 260)); ?></span></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$audits): ?><tr><td colspan="5">No audit rows for this teacher.</td></tr><?php endif; ?>
          </table>
        </section>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
