<?php
// ---- report: live-capacity (academy-operations teacher capacity planning; read-only) ----
// Ported from local_hubredirect/live_capacity.php via live_capacity_portallib
// (pqlcapl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the full capacity table: candidate teachers with availability, assigned
//        hours, quality workload, proposed-slot fit/conflict and fit scoring,
//        workspace-filtered, plus the five headline metrics.
// POST = none. The legacy page has zero write blocks (no data_submitted()/
//        action= branches); its only side output is a GET-triggered CSV export,
//        which the portal client rebuilds from this JSON. Refuse POSTs.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_capacity_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same gate as the page top: pqh_require_academy_operations(...) -> allowed when
// pqh_can_manage_academy_operations(), otherwise pqh_access_denied with this
// exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view teacher capacity planning.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Capacity planning performs no writes — refuse anything sent here so a
    // future client bug cannot silently no-op.
    pqpd_fail(400, 'Teacher capacity planning is read-only; it has no portal write actions.');
}

// -- GET: the capacity table (computation verbatim from live_capacity.php) -----
// The page resolves the workspace from ?workspaceid= or the consumer context;
// the portal client passes it explicitly (consumer-host detection does not apply
// on the Bunny origin).
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);

$now = time();
$selecteddate = pqlcapl_clean_date(optional_param('week', date('Y-m-d', $now), PARAM_TEXT), $now);
$weekstart = pqlcapl_week_start($selecteddate);
$weekend = $weekstart + (7 * DAYSECS);
$proposeddate = pqlcapl_clean_date(optional_param('classdate', '', PARAM_TEXT), 0);
$proposedtime = optional_param('classtime', '', PARAM_TEXT);
$duration = max(15, min(240, optional_param('duration', 60, PARAM_INT)));
$studentcount = max(1, min(30, optional_param('students', 9, PARAM_INT)));
$filter = optional_param('filter', 'all', PARAM_ALPHANUMEXT);
$ready = pqlcapl_ready();
$proposedstart = 0;
if ($proposeddate > 0 && pqlcapl_minutes($proposedtime) >= 0) {
    $proposedstart = usergetmidnight($proposeddate) + (pqlcapl_minutes($proposedtime) * MINSECS);
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
    $availabilityready = pqlcapl_table_exists('local_prequran_live_availability');
    $sessionscoped = $workspaceid > 0 && pqlcapl_column_exists('local_prequran_live_session', 'workspaceid');
    $assignmentscoped = $workspaceid > 0
        && pqlcapl_table_exists('local_prequran_teacher_student')
        && pqlcapl_column_exists('local_prequran_teacher_student', 'workspaceid');
    $membersready = $workspaceid > 0 && pqlcapl_table_exists('local_prequran_workspace_member');
    $qaready = pqlcapl_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqlcapl_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqlcapl_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqlcapl_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $followupready = pqlcapl_table_exists('local_prequran_live_note') && pqlcapl_column_exists('local_prequran_live_note', 'followup_status');

    $candidateids = [];
    $sources = [];
    $candidateparams = [];
    if ($sessionscoped) {
        $sources[] = "SELECT DISTINCT teacherid FROM {local_prequran_live_session} WHERE teacherid > 0 AND workspaceid = :candidate_session_workspaceid";
        $candidateparams['candidate_session_workspaceid'] = $workspaceid;
    } else if ($workspaceid <= 0) {
        $sources[] = "SELECT DISTINCT teacherid FROM {local_prequran_live_session} WHERE teacherid > 0";
    }
    if ($membersready) {
        $sources[] = "SELECT DISTINCT userid AS teacherid
                        FROM {local_prequran_workspace_member}
                       WHERE userid > 0
                         AND workspaceid = :candidate_member_workspaceid
                         AND status = :candidate_member_status
                         AND workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator')";
        $candidateparams['candidate_member_workspaceid'] = $workspaceid;
        $candidateparams['candidate_member_status'] = 'active';
    }
    if ($availabilityready && $workspaceid <= 0) {
        $sources[] = "SELECT DISTINCT teacherid FROM {local_prequran_live_availability} WHERE teacherid > 0 AND status = 'active'";
    }
    if ($assignmentscoped) {
        $sources[] = "SELECT DISTINCT teacherid
                        FROM {local_prequran_teacher_student}
                       WHERE teacherid > 0
                         AND status = :candidate_assignment_status
                         AND workspaceid = :candidate_assignment_workspaceid";
        $candidateparams['candidate_assignment_status'] = 'active';
        $candidateparams['candidate_assignment_workspaceid'] = $workspaceid;
    } else if ($workspaceid <= 0 && pqlcapl_table_exists('local_prequran_teacher_student')) {
        $sources[] = "SELECT DISTINCT teacherid FROM {local_prequran_teacher_student} WHERE teacherid > 0 AND status = 'active'";
    }
    if ($sources) {
        $candidatequery = implode(' UNION ', $sources);
        foreach ($DB->get_records_sql("SELECT teacherid FROM ({$candidatequery}) candidates ORDER BY teacherid ASC", $candidateparams) as $row) {
            $candidateids[(int)$row->teacherid] = true;
        }
    }

    foreach (array_keys($candidateids) as $teacherid) {
        $teachers[$teacherid] = (object)[
            'teacherid' => $teacherid,
            'name' => pqlcapl_user_name($teacherid),
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

    $sessionwhere = [
        's.scheduled_start >= :weekstart',
        's.scheduled_start < :weekend',
        "s.status NOT IN ('cancelled', 'failed')",
    ];
    $sessionparams = ['nowtime' => $now, 'weekstart' => $weekstart, 'weekend' => $weekend];
    if ($sessionscoped) {
        $sessionwhere[] = 's.workspaceid = :session_workspaceid';
        $sessionparams['session_workspaceid'] = $workspaceid;
    }
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
          WHERE " . implode(' AND ', $sessionwhere) . "
       GROUP BY s.teacherid",
        $sessionparams
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
        $followupwhere = [
            'n.followup_status <> :none',
            'n.followup_resolved = 0',
        ];
        $followupparams = ['none' => 'none'];
        if ($sessionscoped) {
            $followupwhere[] = 's.workspaceid = :followup_workspaceid';
            $followupparams['followup_workspaceid'] = $workspaceid;
        }
        $followups = $DB->get_records_sql(
            "SELECT s.teacherid, COUNT(1) AS followups_open
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE " . implode(' AND ', $followupwhere) . "
           GROUP BY s.teacherid",
            $followupparams
        );
        foreach ($followups as $row) {
            $teacherid = (int)$row->teacherid;
            if (isset($teachers[$teacherid])) {
                $teachers[$teacherid]->followups_open = (int)$row->followups_open;
            }
        }
    }

    if ($proposedstart > 0) {
        $conflictwhere = [
            'scheduled_start < :proposedend',
            'scheduled_end > :proposedstart',
            "status NOT IN ('cancelled', 'failed')",
        ];
        $conflictparams = ['proposedstart' => $proposedstart, 'proposedend' => $proposedend];
        if ($sessionscoped) {
            $conflictwhere[] = 'workspaceid = :conflict_workspaceid';
            $conflictparams['conflict_workspaceid'] = $workspaceid;
        }
        $conflictrows = $DB->get_records_sql(
            "SELECT teacherid, COUNT(1) AS conflict_count
               FROM {local_prequran_live_session}
              WHERE " . implode(' AND ', $conflictwhere) . "
           GROUP BY teacherid",
            $conflictparams
        );
        foreach ($conflictrows as $row) {
            $teacherid = (int)$row->teacherid;
            if (isset($teachers[$teacherid]) && (int)$row->conflict_count > 0) {
                $teachers[$teacherid]->slot_conflict = true;
            }
        }
    }

    foreach ($teachers as $teacherid => $row) {
        $row->capacity_rate = pqlcapl_percent((float)$row->assigned_hours, max(1.0, (float)$row->available_hours));
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

// Names for every teacher rendered (the row already carries the resolved name;
// the map keeps parity with the other portal handlers).
$nameids = [];
foreach ($teachers as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'now' => $now,
    'weekstart' => $weekstart,
    'weekend' => $weekend,
    'workspaceid' => $workspaceid,
    'filter' => $filter,
    'proposed' => [
        'active' => $proposedstart > 0,
        'start' => $proposedstart,
        'end' => $proposedend,
        'date' => $proposedstart > 0 ? date('Y-m-d', $proposedstart) : '',
        'time' => $proposedstart > 0 ? date('H:i', $proposedstart) : '',
        'duration' => $duration,
        'students' => $studentcount,
    ],
    'metrics' => $metrics,
    'teachers' => array_values($teachers),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
