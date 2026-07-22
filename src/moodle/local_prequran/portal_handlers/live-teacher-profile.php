<?php
// ---- report: live-teacher-profile (teacher performance profile; read-only) ----
// Ported from local_hubredirect/live_teacher_profile.php via
// live_teacher_profile_portallib (pqltpl_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the teacher performance profile the legacy page renders (metrics, the
//        leadership review pack, class/QA/plan timeline, recurring QA concerns,
//        parent follow-up indicators, session record, and recent audit) with
//        the page's own filters (from, to, teacherid) plus a curated names map
//        (teacher/actor/student user ids resolved server-side).
// POST = rejected with 400: the legacy page is read-only (its only non-render
//        paths are the export=profile / export=reviewpack CSV downloads and the
//        printable pack, which the portal page builds client-side from the same
//        JSON rows).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_teacher_profile_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same entry gate as the page: pqh_require_academy_operations(...) checks
// pqh_can_manage_academy_operations and denies with this exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view teacher performance profiles.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Teacher performance profile is read-only.');
}

// -- GET: the teacher performance profile dataset (same filter parsing as the page) --
$now = time();
$defaultfrom = usergetmidnight($now - (180 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqltpl_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqltpl_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$ready = pqltpl_ready();

$teachername = $teacherid > 0 ? pqltpl_user_name($teacherid, 'Teacher ' . $teacherid) : 'Teacher not selected';
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
    $coachingready = pqltpl_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqltpl_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqltpl_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $checklistready = pqltpl_column_exists('local_prequran_live_session', 'qa_checklist');
    $followupready = pqltpl_table_exists('local_prequran_live_note') && pqltpl_column_exists('local_prequran_live_note', 'followup_status');

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
    foreach (pqltpl_items() as $key => $label) {
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

        foreach (pqltpl_decode_checklist((string)$session->qa_checklist) as $key => $value) {
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

    if (pqltpl_table_exists('local_prequran_live_participant')) {
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
        $arate = pqltpl_percent((int)$a['concern'], (int)$a['checked']);
        $brate = pqltpl_percent((int)$b['concern'], (int)$b['checked']);
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

    $passrate = pqltpl_percent((int)$metrics['passed'], (int)$metrics['reviewed']);
    $reviewcoverage = pqltpl_percent((int)$metrics['reviewed'], (int)$metrics['sessions']);
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
                'detail' => pqltpl_short((string)$session->improvement_plan_goals, 140),
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
                'detail' => pqltpl_short((string)$audit->details, 150),
            ];
        }
    }
    usort($timeline, static function(array $a, array $b): int {
        return $b['time'] <=> $a['time'];
    });
    $timeline = array_slice($timeline, 0, 120);
}

// Curate credentials shown to the client: resolve teacher/actor/student user ids
// to display names (the page uses pqltpl_user_name inline while rendering) and
// truncate long audit detail blobs exactly as the page does.
$nameids = [$teacherid];
foreach ($audits as $audit) {
    $nameids[] = (int)$audit->actorid;
}
foreach ($followups as $followup) {
    $nameids[] = (int)$followup->studentid;
}

$auditsout = [];
foreach ($audits as $audit) {
    $auditsout[] = [
        'timecreated' => (int)$audit->timecreated,
        'sessionid' => (int)$audit->sessionid,
        'actorid' => (int)$audit->actorid,
        'action' => (string)$audit->action,
        'details' => pqltpl_short((string)$audit->details, 260),
    ];
}
$followupsout = [];
foreach ($followups as $followup) {
    $followupsout[] = [
        'studentid' => (int)$followup->studentid,
        'session_title' => (string)$followup->session_title,
        'followup_status' => (string)$followup->followup_status,
        'followup_resolved' => (int)($followup->followup_resolved ?? 0),
        'timemodified' => (int)$followup->timemodified,
    ];
}
$sessionsout = [];
foreach (array_slice($sessions, 0, 80) as $session) {
    $sessionsout[] = [
        'id' => (int)$session->id,
        'title' => (string)$session->title,
        'scheduled_start' => (int)$session->scheduled_start,
        'status' => (string)$session->status,
        'student_count' => (int)$session->student_count,
        'attendance_count' => (int)$session->attendance_count,
        'parent_summary_count' => (int)$session->parent_summary_count,
        'qa_status' => (string)$session->qa_status,
        'qa_score' => (int)$session->qa_score,
        'qa_coaching_status' => (string)$session->qa_coaching_status,
        'leadership_review_status' => (string)$session->leadership_review_status,
        'improvement_plan_status' => (string)$session->improvement_plan_status,
        'improvement_plan_priority' => (string)$session->improvement_plan_priority,
        'improvement_plan_due_date' => (int)$session->improvement_plan_due_date,
    ];
}
$concernsout = [];
foreach ($concerns as $concern) {
    $concernsout[] = [
        'label' => (string)$concern['label'],
        'concern' => (int)$concern['concern'],
        'checked' => (int)$concern['checked'],
        'rate' => pqltpl_percent((int)$concern['concern'], (int)$concern['checked']),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'now' => $now,
    'teacherid' => $teacherid,
    'teachername' => $teachername,
    'filters' => [
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'teacherid' => $teacherid,
    ],
    'metrics' => $metrics,
    'reviewpack' => $reviewpack,
    'timeline' => $timeline,
    'concerns' => $concernsout,
    'followups' => $followupsout,
    'sessions' => $sessionsout,
    'audits' => $auditsout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
