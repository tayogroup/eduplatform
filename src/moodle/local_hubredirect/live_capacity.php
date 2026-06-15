<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can view teacher capacity planning.');
}

function pqlcap_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlcap_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlcap_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlcap_ready(): bool {
    return pqlcap_table_exists('local_prequran_live_session')
        && pqlcap_table_exists('local_prequran_live_participant');
}

function pqlcap_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlcap_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlcap_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : 'Teacher ' . $userid;
}

function pqlcap_percent(float $part, float $whole): int {
    return $whole > 0 ? (int)round(($part / $whole) * 100) : 0;
}

function pqlcap_csv(string $filename, array $headers, array $rows): void {
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

function pqlcap_week_start(int $date): int {
    $midnight = usergetmidnight($date);
    $weekday = (int)date('N', $midnight);
    return $midnight - (($weekday - 1) * DAYSECS);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_capacity.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Capacity Planning');
$PAGE->set_heading('Teacher Capacity Planning');
$PAGE->add_body_class('pqh-live-capacity-page');

$now = time();
$selecteddate = pqlcap_clean_date(optional_param('week', date('Y-m-d', $now), PARAM_TEXT), $now);
$weekstart = pqlcap_week_start($selecteddate);
$weekend = $weekstart + (7 * DAYSECS);
$proposeddate = pqlcap_clean_date(optional_param('classdate', '', PARAM_TEXT), 0);
$proposedtime = optional_param('classtime', '', PARAM_TEXT);
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$studentcount = max(1, min(30, optional_param('students', 9, PARAM_INT)));
$filter = optional_param('filter', 'all', PARAM_ALPHANUMEXT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$ready = pqlcap_ready();
$proposedstart = 0;
if ($proposeddate > 0 && pqlcap_minutes($proposedtime) >= 0) {
    $proposedstart = usergetmidnight($proposeddate) + (pqlcap_minutes($proposedtime) * MINSECS);
}
$proposedend = $proposedstart > 0 ? $proposedstart + ($duration * MINSECS) : 0;

$teachers = [];
$metrics = [
    'teachers' => 0,
    'available' => 0,
    'overloaded' => 0,
    'conflicts' => 0,
    'recommended' => 0,
];

if ($ready) {
    $availabilityready = pqlcap_table_exists('local_prequran_live_availability');
    $qaready = pqlcap_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqlcap_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqlcap_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqlcap_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $followupready = pqlcap_table_exists('local_prequran_live_note') && pqlcap_column_exists('local_prequran_live_note', 'followup_status');

    $candidateids = [];
    $sources = [
        "SELECT DISTINCT teacherid FROM {local_prequran_live_session} WHERE teacherid > 0",
    ];
    if ($availabilityready) {
        $sources[] = "SELECT DISTINCT teacherid FROM {local_prequran_live_availability} WHERE teacherid > 0 AND status = 'active'";
    }
    if (pqlcap_table_exists('local_prequran_teacher_student')) {
        $sources[] = "SELECT DISTINCT teacherid FROM {local_prequran_teacher_student} WHERE teacherid > 0 AND status = 'active'";
    }
    $candidatequery = implode(' UNION ', $sources);
    foreach ($DB->get_records_sql("SELECT teacherid FROM ({$candidatequery}) candidates ORDER BY teacherid ASC") as $row) {
        $candidateids[(int)$row->teacherid] = true;
    }

    foreach (array_keys($candidateids) as $teacherid) {
        $teachers[$teacherid] = (object)[
            'teacherid' => $teacherid,
            'name' => pqlcap_user_name($teacherid),
            'available_hours' => 0.0,
            'assigned_hours' => 0.0,
            'sessions' => 0,
            'students' => 0,
            'upcoming' => 0,
            'qa_reviewed' => 0,
            'avg_qa' => 0,
            'qa_issues' => 0,
            'coaching_open' => 0,
            'leadership_open' => 0,
            'plans_open' => 0,
            'followups_open' => 0,
            'slot_available' => false,
            'slot_conflict' => false,
            'capacity_rate' => 0,
            'fit_score' => 0,
            'fit_label' => 'Review',
            'flags' => [],
        ];
    }

    if ($availabilityready && $teachers) {
        $windows = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_availability}
              WHERE status = :status",
            ['status' => 'active']
        );
        foreach ($windows as $window) {
            $teacherid = (int)$window->teacherid;
            if (!isset($teachers[$teacherid])) {
                continue;
            }
            $minutes = max(0, (int)$window->end_minute - (int)$window->start_minute);
            $teachers[$teacherid]->available_hours += $minutes / 60;
            if ($proposedstart > 0) {
                $weekday = (int)date('w', $proposedstart);
                $startminute = ((int)date('G', $proposedstart) * 60) + (int)date('i', $proposedstart);
                $endminute = $startminute + $duration;
                if ((int)$window->weekday === $weekday && (int)$window->start_minute <= $startminute && (int)$window->end_minute >= $endminute) {
                    $teachers[$teacherid]->slot_available = true;
                }
            }
        }
    }

    $qaselect = $qaready
        ? "SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS qa_reviewed,
           ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa,
           SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issues,"
        : "0 AS qa_reviewed, 0 AS avg_qa, 0 AS qa_issues,";
    $coachingselect = $coachingready
        ? "SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,"
        : "0 AS coaching_open,";
    $leadershipselect = $leadershipready
        ? "SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open,"
        : "0 AS leadership_open,";
    $improvementselect = $improvementready
        ? "SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plans_open,"
        : "0 AS plans_open,";

    $sessionrows = $DB->get_records_sql(
        "SELECT s.teacherid,
                COUNT(1) AS sessions,
                SUM(GREATEST(0, s.scheduled_end - s.scheduled_start)) AS assigned_seconds,
                COUNT(DISTINCT p.studentid) AS students,
                SUM(CASE WHEN s.scheduled_start >= :nowtime THEN 1 ELSE 0 END) AS upcoming,
                {$qaselect}
                {$coachingselect}
                {$leadershipselect}
                {$improvementselect}
                MAX(s.scheduled_start) AS last_session
           FROM {local_prequran_live_session} s
      LEFT JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
          WHERE s.scheduled_start >= :weekstart
            AND s.scheduled_start < :weekend
            AND s.status NOT IN ('cancelled', 'failed')
       GROUP BY s.teacherid",
        ['nowtime' => $now, 'weekstart' => $weekstart, 'weekend' => $weekend]
    );
    foreach ($sessionrows as $row) {
        $teacherid = (int)$row->teacherid;
        if (!isset($teachers[$teacherid])) {
            continue;
        }
        $teachers[$teacherid]->sessions = (int)$row->sessions;
        $teachers[$teacherid]->assigned_hours = round(((int)$row->assigned_seconds) / HOURSECS, 1);
        $teachers[$teacherid]->students = (int)$row->students;
        $teachers[$teacherid]->upcoming = (int)$row->upcoming;
        $teachers[$teacherid]->qa_reviewed = (int)$row->qa_reviewed;
        $teachers[$teacherid]->avg_qa = (int)$row->avg_qa;
        $teachers[$teacherid]->qa_issues = (int)$row->qa_issues;
        $teachers[$teacherid]->coaching_open = (int)$row->coaching_open;
        $teachers[$teacherid]->leadership_open = (int)$row->leadership_open;
        $teachers[$teacherid]->plans_open = (int)$row->plans_open;
    }

    if ($followupready) {
        $followups = $DB->get_records_sql(
            "SELECT s.teacherid, COUNT(1) AS followups_open
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE n.followup_status <> :none
                AND n.followup_resolved = 0
           GROUP BY s.teacherid",
            ['none' => 'none']
        );
        foreach ($followups as $row) {
            $teacherid = (int)$row->teacherid;
            if (isset($teachers[$teacherid])) {
                $teachers[$teacherid]->followups_open = (int)$row->followups_open;
            }
        }
    }

    if ($proposedstart > 0) {
        $conflictrows = $DB->get_records_sql(
            "SELECT teacherid, COUNT(1) AS conflict_count
               FROM {local_prequran_live_session}
              WHERE scheduled_start < :proposedend
                AND scheduled_end > :proposedstart
                AND status NOT IN ('cancelled', 'failed')
           GROUP BY teacherid",
            ['proposedstart' => $proposedstart, 'proposedend' => $proposedend]
        );
        foreach ($conflictrows as $row) {
            $teacherid = (int)$row->teacherid;
            if (isset($teachers[$teacherid]) && (int)$row->conflict_count > 0) {
                $teachers[$teacherid]->slot_conflict = true;
            }
        }
    }

    foreach ($teachers as $teacherid => $row) {
        $row->capacity_rate = pqlcap_percent((float)$row->assigned_hours, max(1.0, (float)$row->available_hours));
        if ($row->available_hours <= 0) {
            $row->flags[] = 'No availability';
        }
        if ($row->capacity_rate >= 85) {
            $row->flags[] = 'High load';
        }
        if ($row->coaching_open > 0 || $row->plans_open > 0 || $row->leadership_open > 0) {
            $row->flags[] = 'Open quality work';
        }
        if ($row->followups_open > 0) {
            $row->flags[] = 'Parent follow-up';
        }
        if ($proposedstart > 0 && !$row->slot_available) {
            $row->flags[] = 'Unavailable for slot';
        }
        if ($proposedstart > 0 && $row->slot_conflict) {
            $row->flags[] = 'Schedule conflict';
        }

        $score = 100;
        $score -= min(40, max(0, $row->capacity_rate - 50));
        $score -= $row->qa_issues * 8;
        $score -= $row->coaching_open * 8;
        $score -= $row->plans_open * 8;
        $score -= $row->leadership_open * 15;
        $score -= $row->followups_open * 4;
        if ($row->available_hours <= 0) {
            $score -= 20;
        }
        if ($proposedstart > 0 && !$row->slot_available) {
            $score -= 35;
        }
        if ($proposedstart > 0 && $row->slot_conflict) {
            $score -= 50;
        }
        if ($studentcount > 12) {
            $score -= 10;
        }
        $row->fit_score = max(0, min(100, $score));
        if ($row->slot_conflict || ($proposedstart > 0 && !$row->slot_available) || $row->leadership_open > 0) {
            $row->fit_label = 'Avoid';
        } else if ($row->fit_score >= 80 && $row->capacity_rate < 80) {
            $row->fit_label = 'Recommended';
        } else if ($row->fit_score >= 60) {
            $row->fit_label = 'Usable';
        } else {
            $row->fit_label = 'Review';
        }

        if ($filter === 'recommended' && $row->fit_label !== 'Recommended') {
            unset($teachers[$teacherid]);
            continue;
        }
        if ($filter === 'available_slot' && ($proposedstart <= 0 || !$row->slot_available || $row->slot_conflict)) {
            unset($teachers[$teacherid]);
            continue;
        }
        if ($filter === 'overloaded' && $row->capacity_rate < 85) {
            unset($teachers[$teacherid]);
            continue;
        }
        if ($filter === 'open_quality' && ($row->coaching_open + $row->plans_open + $row->leadership_open) <= 0) {
            unset($teachers[$teacherid]);
            continue;
        }
    }

    usort($teachers, static function($a, $b): int {
        if ($a->fit_score === $b->fit_score) {
            return $a->capacity_rate <=> $b->capacity_rate;
        }
        return $b->fit_score <=> $a->fit_score;
    });

    foreach ($teachers as $row) {
        $metrics['teachers']++;
        $metrics['available'] += ($proposedstart > 0 && $row->slot_available && !$row->slot_conflict) ? 1 : 0;
        $metrics['overloaded'] += $row->capacity_rate >= 85 ? 1 : 0;
        $metrics['conflicts'] += $row->slot_conflict ? 1 : 0;
        $metrics['recommended'] += $row->fit_label === 'Recommended' ? 1 : 0;
    }
}

if ($ready && $export === 'capacity') {
    $rows = [];
    foreach ($teachers as $row) {
        $rows[] = [
            (int)$row->teacherid,
            (string)$row->name,
            (float)$row->available_hours,
            (float)$row->assigned_hours,
            (int)$row->capacity_rate . '%',
            (int)$row->sessions,
            (int)$row->students,
            (int)$row->qa_issues,
            (int)$row->coaching_open,
            (int)$row->plans_open,
            (int)$row->leadership_open,
            (int)$row->followups_open,
            $row->slot_available ? 'yes' : 'no',
            $row->slot_conflict ? 'yes' : 'no',
            (int)$row->fit_score,
            (string)$row->fit_label,
            implode(', ', $row->flags),
        ];
    }
    pqlcap_csv('quraan-teacher-capacity.csv', ['teacherid', 'teacher', 'available_hours', 'assigned_hours', 'capacity_rate', 'sessions', 'students', 'qa_issues', 'coaching_open', 'plans_open', 'leadership_open', 'followups_open', 'slot_available', 'slot_conflict', 'fit_score', 'fit_label', 'flags'], $rows);
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-capacity-page header,
body.pqh-live-capacity-page footer,
body.pqh-live-capacity-page nav.navbar,
body.pqh-live-capacity-page #page-header,
body.pqh-live-capacity-page #page-footer,
body.pqh-live-capacity-page .drawer,
body.pqh-live-capacity-page .drawer-toggles,
body.pqh-live-capacity-page .block-region,
body.pqh-live-capacity-page [data-region="drawer"],
body.pqh-live-capacity-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-capacity-page #page,
body.pqh-live-capacity-page #page-content,
body.pqh-live-capacity-page #region-main,
body.pqh-live-capacity-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlcap-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlcap-wrap{max-width:1320px;margin:0 auto}
.pqlcap-top,.pqlcap-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlcap-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlcap-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlcap-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlcap-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlcap-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlcap-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlcap-filters{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:12px}
.pqlcap-field{display:grid;gap:6px}
.pqlcap-field label{font-size:12px;font-weight:900;color:#415665}
.pqlcap-input,.pqlcap-select{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.25 system-ui;background:#fff;color:#173044}
.pqlcap-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:16px 0}
.pqlcap-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlcap-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlcap-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlcap-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlcap-table th,.pqlcap-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlcap-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqlcap-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlcap-pill--ok{background:#edf9ef;color:#245c35}
.pqlcap-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlcap-pill--bad{background:#fff0ed;color:#883526}
.pqlcap-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlcap-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1120px){.pqlcap-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlcap-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlcap-top{display:block}.pqlcap-actions{margin-top:12px}.pqlcap-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlcap-filters,.pqlcap-metrics{grid-template-columns:1fr}.pqlcap-title{font-size:24px}}
</style>
<main class="pqlcap-shell">
  <div class="pqlcap-wrap">
    <section class="pqlcap-top">
      <div>
        <h1 class="pqlcap-title">Teacher Assignment & Capacity Planning</h1>
        <p class="pqlcap-sub">Compare availability, assigned hours, quality workload, and slot conflicts before assigning live classes.</p>
      </div>
      <div class="pqlcap-actions">
        <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false); ?>">Teacher directory</a>
        <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php'))->out(false); ?>">Series wizard</a>
        <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_availability.php'))->out(false); ?>">Availability</a>
        <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqlcap-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlcap-empty">Capacity planning requires live-session and participant tables.</div>
    <?php else: ?>
      <section class="pqlcap-panel">
        <form method="get">
          <div class="pqlcap-filters">
            <div class="pqlcap-field"><label for="week">Week</label><input class="pqlcap-input" id="week" name="week" type="date" value="<?php echo s(date('Y-m-d', $weekstart)); ?>"></div>
            <div class="pqlcap-field"><label for="classdate">Proposed Date</label><input class="pqlcap-input" id="classdate" name="classdate" type="date" value="<?php echo $proposedstart > 0 ? s(date('Y-m-d', $proposedstart)) : ''; ?>"></div>
            <div class="pqlcap-field"><label for="classtime">Proposed Time</label><input class="pqlcap-input" id="classtime" name="classtime" type="time" value="<?php echo $proposedstart > 0 ? s(date('H:i', $proposedstart)) : ''; ?>"></div>
            <div class="pqlcap-field"><label for="duration">Minutes</label><input class="pqlcap-input" id="duration" name="duration" type="number" min="15" max="240" step="15" value="<?php echo (int)$duration; ?>"></div>
            <div class="pqlcap-field"><label for="students">Students</label><input class="pqlcap-input" id="students" name="students" type="number" min="1" max="30" value="<?php echo (int)$studentcount; ?>"></div>
            <div class="pqlcap-field"><label for="filter">Filter</label><select class="pqlcap-select" id="filter" name="filter">
              <?php foreach (['all' => 'All teachers', 'recommended' => 'Recommended', 'available_slot' => 'Available for slot', 'overloaded' => 'Overloaded', 'open_quality' => 'Open quality work'] as $value => $label): ?>
                <option value="<?php echo s($value); ?>" <?php echo $filter === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select></div>
          </div>
          <div class="pqlcap-actions">
            <button class="pqlcap-btn" type="submit">Calculate capacity</button>
            <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php'))->out(false); ?>">Reset</a>
            <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php', ['week' => date('Y-m-d', $weekstart), 'classdate' => $proposedstart > 0 ? date('Y-m-d', $proposedstart) : '', 'classtime' => $proposedstart > 0 ? date('H:i', $proposedstart) : '', 'duration' => $duration, 'students' => $studentcount, 'filter' => $filter, 'export' => 'capacity']))->out(false); ?>">Export CSV</a>
          </div>
        </form>
      </section>

      <section class="pqlcap-metrics">
        <div class="pqlcap-metric"><strong><?php echo (int)$metrics['teachers']; ?></strong><span>teachers shown</span></div>
        <div class="pqlcap-metric"><strong><?php echo (int)$metrics['recommended']; ?></strong><span>recommended</span></div>
        <div class="pqlcap-metric"><strong><?php echo (int)$metrics['available']; ?></strong><span>available slot</span></div>
        <div class="pqlcap-metric"><strong><?php echo (int)$metrics['overloaded']; ?></strong><span>high load</span></div>
        <div class="pqlcap-metric"><strong><?php echo (int)$metrics['conflicts']; ?></strong><span>slot conflicts</span></div>
      </section>

      <section class="pqlcap-panel">
        <table class="pqlcap-table">
          <tr><th>Teacher</th><th>Capacity</th><th>Week Load</th><th>Quality Load</th><th>Proposed Slot</th><th>Fit</th><th>Actions</th></tr>
          <?php foreach ($teachers as $teacher): ?>
            <?php
              $fitclass = $teacher->fit_label === 'Recommended' ? 'pqlcap-pill--ok' : ($teacher->fit_label === 'Avoid' ? 'pqlcap-pill--bad' : 'pqlcap-pill--warn');
              $capacityclass = $teacher->capacity_rate >= 85 ? 'pqlcap-pill--bad' : ($teacher->capacity_rate >= 70 ? 'pqlcap-pill--warn' : 'pqlcap-pill--ok');
            ?>
            <tr>
              <td><strong><?php echo s((string)$teacher->name); ?></strong><br><span class="pqlcap-code">#<?php echo (int)$teacher->teacherid; ?></span></td>
              <td><span class="pqlcap-pill <?php echo $capacityclass; ?>"><?php echo (int)$teacher->capacity_rate; ?>%</span><br><span class="pqlcap-code"><?php echo (float)$teacher->assigned_hours; ?>h assigned / <?php echo (float)$teacher->available_hours; ?>h available</span></td>
              <td><?php echo (int)$teacher->sessions; ?> sessions<br><span class="pqlcap-code"><?php echo (int)$teacher->students; ?> students, <?php echo (int)$teacher->upcoming; ?> upcoming</span></td>
              <td>
                <span class="pqlcap-code">QA <?php echo (int)$teacher->avg_qa; ?>%, <?php echo (int)$teacher->qa_issues; ?> issues</span><br>
                <span class="pqlcap-code"><?php echo (int)$teacher->coaching_open; ?> coaching, <?php echo (int)$teacher->plans_open; ?> plans</span><br>
                <span class="pqlcap-code"><?php echo (int)$teacher->leadership_open; ?> leadership, <?php echo (int)$teacher->followups_open; ?> follow-ups</span>
              </td>
              <td>
                <?php if ($proposedstart > 0): ?>
                  <span class="pqlcap-pill <?php echo $teacher->slot_available ? 'pqlcap-pill--ok' : 'pqlcap-pill--warn'; ?>"><?php echo $teacher->slot_available ? 'available' : 'outside availability'; ?></span>
                  <?php if ($teacher->slot_conflict): ?><br><span class="pqlcap-pill pqlcap-pill--bad">conflict</span><?php endif; ?>
                <?php else: ?>
                  <span class="pqlcap-code">Enter proposed date/time</span>
                <?php endif; ?>
              </td>
              <td><span class="pqlcap-pill <?php echo $fitclass; ?>"><?php echo s((string)$teacher->fit_label); ?> <?php echo (int)$teacher->fit_score; ?></span><br><span class="pqlcap-code"><?php echo s(implode(', ', $teacher->flags) ?: 'No major flags'); ?></span></td>
              <td>
                <div class="pqlcap-actions">
                  <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', ['teacherid' => (int)$teacher->teacherid]))->out(false); ?>">Profile</a>
                  <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_availability.php', ['teacherid' => (int)$teacher->teacherid]))->out(false); ?>">Availability</a>
                  <a class="pqlcap-btn pqlcap-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', ['step' => 2, 'teacherid' => (int)$teacher->teacherid, 'sessiondate' => $proposedstart > 0 ? date('Y-m-d', $proposedstart) : '', 'sessiontime' => $proposedstart > 0 ? date('H:i', $proposedstart) : '', 'duration' => $duration]))->out(false); ?>">Schedule</a>
                </div>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$teachers): ?><tr><td colspan="7">No teachers match this capacity filter.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
