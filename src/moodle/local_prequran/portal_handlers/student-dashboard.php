<?php
// ---- report: student-dashboard (student home; read-only) ----------------------
// Ported from local_hubredirect/student_dashboard.php via student_dashboard_portallib
// (pqsdl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = everything the student home renders: continue-learning course cards,
//        homework KPIs (due this week / missing / average), next live class,
//        "up next" items, and recent teacher feedback.
// POST = none. The legacy page has no write actions (no sesskey, no forms).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_catalog.php');
require_once($CFG->dirroot . '/local/hubredirect/student_dashboard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The student dashboard has no write actions.');
}

// -- access: the page is students-only; staff are redirected to the combined
// dashboard. A JSON endpoint cannot redirect, so surface the same routing.
if (pqh_shell_viewer_kind($userid) === 'staff') {
    pqpd_fail(403, 'Staff accounts use the combined dashboard at /local/hubredirect/dashboard.php.');
}

$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

// The student's workspace (first active membership) drives homework links.
$studentworkspaceid = 0;
try {
    $member = $DB->get_records_select(
        'local_prequran_workspace_member',
        "userid = ? AND status = 'active' AND workspace_role = 'student'",
        [$userid], 'id ASC', 'id,workspaceid', 0, 1
    );
    if ($member) {
        $studentworkspaceid = (int)reset($member)->workspaceid;
    }
} catch (Throwable $e) {
    $studentworkspaceid = 0;
}
if ($studentworkspaceid > 0) {
    $urlparams['workspaceid'] = $studentworkspaceid;
}
$homeworkurl = new moodle_url('/local/hubredirect/student_homework.php', $urlparams);
$scheduleurl = new moodle_url('/local/hubredirect/live_schedule.php', $urlparams + ['childid' => $userid]);
$workplaceurl = new moodle_url('/local/hubredirect/student_workplace.php', $urlparams);

// ---- homework signals: due this week, missing, average, feedback ----
$hwrows = [];
if (pqh_table_exists_safe('local_prequran_homework_sub') && pqh_table_exists_safe('local_prequran_homework')) {
    try {
        $hwrows = array_values($DB->get_records_sql(
            "SELECT s.*, h.title, h.duedate, h.maxpoints, h.moodlecourseid, c.fullname AS coursename
               FROM {local_prequran_homework_sub} s
               JOIN {local_prequran_homework} h ON h.id = s.homeworkid
               JOIN {course} c ON c.id = h.moodlecourseid
              WHERE s.studentid = :studentid AND h.status = :status
           ORDER BY h.duedate ASC, h.id DESC",
            ['studentid' => $userid, 'status' => 'published']
        ));
    } catch (Throwable $e) {
        $hwrows = [];
    }
}

$now = time();
$openstatuses = ['assigned', 'in_progress', 'returned'];
$dueweek = [];
$missing = [];
$gradedpct = [];
$feedbackrows = [];
foreach ($hwrows as $row) {
    $due = (int)$row->duedate;
    $status = (string)$row->status;
    if (in_array($status, $openstatuses, true) && $due > $now && $due <= $now + 7 * DAYSECS) {
        $dueweek[] = $row;
    }
    if ($due > 0 && $due < $now && in_array($status, $openstatuses, true)) {
        $missing[] = $row;
    }
    if ($status === 'graded' && (float)$row->maxpoints > 0) {
        $pct = max(0.0, min(100.0, (float)$row->scorepoints / (float)$row->maxpoints * 100));
        $gradedpct[] = $pct;
        $row->gradepct = $pct;
    }
    if (trim((string)($row->feedback ?? '')) !== '') {
        $feedbackrows[] = $row;
    }
}
usort($feedbackrows, static function($a, $b) {
    return (int)($b->timemodified ?? 0) <=> (int)($a->timemodified ?? 0);
});
$feedbackrows = array_slice($feedbackrows, 0, 3);
$avgpct = $gradedpct ? array_sum($gradedpct) / count($gradedpct) : null;

// ---- next live class ----
$nextsession = null;
try {
    $sessions = array_values($DB->get_records_sql(
        "SELECT ls.id, ls.title, ls.scheduled_start
           FROM {local_prequran_live_session} ls
           JOIN {local_prequran_live_participant} p ON p.sessionid = ls.id
          WHERE p.userid = :userid AND ls.status <> 'cancelled' AND ls.scheduled_start > :now
       ORDER BY ls.scheduled_start ASC",
        ['userid' => $userid, 'now' => $now], 0, 1
    ));
    $nextsession = $sessions ? reset($sessions) : null;
} catch (Throwable $e) {
    $nextsession = null;
}

// ---- courses: catalog enrolments + Moodle enrolments, homework matched by course ----
$courses = [];
foreach (pqh_user_courses($userid) as $key => $entry) {
    $courses[$key] = [
        'key' => (string)$key,
        'title' => (string)($entry['title'] ?? $key),
        'summary' => (string)($entry['summary'] ?? ''),
        'coursename' => '',
        'continue' => new moodle_url('/local/hubredirect/course_launch.php', ['course' => (string)$key]),
    ];
}
try {
    foreach (pqh_user_moodle_course_cards($userid) as $key => $entry) {
        if (isset($courses[$key])) {
            continue;
        }
        $title = (string)($entry['title'] ?? ($entry['fullname'] ?? $key));
        $courses[$key] = [
            'key' => (string)$key,
            'title' => $title,
            'summary' => '',
            'coursename' => $title,
            'continue' => new moodle_url('/local/hubredirect/course_launch.php', ['course' => (string)$key]),
        ];
    }
} catch (Throwable $e) {
    // Moodle enrolment cards unavailable; catalog courses still render.
}
foreach ($courses as &$course) {
    $mine = array_values(array_filter($hwrows, static function($r) use ($course) {
        return $course['coursename'] !== '' && (string)$r->coursename === $course['coursename'];
    }));
    $total = count($mine);
    $done = count(array_filter($mine, static function($r) {
        return in_array((string)$r->status, ['submitted', 'graded'], true);
    }));
    $course['hwtotal'] = $total;
    $course['pct'] = $total > 0 ? (int)round($done / $total * 100) : null;
    $coursepcts = [];
    $coursemissing = 0;
    $nexthw = null;
    foreach ($mine as $r) {
        if (isset($r->gradepct)) {
            $coursepcts[] = (float)$r->gradepct;
        }
        if ((int)$r->duedate > 0 && (int)$r->duedate < $now && in_array((string)$r->status, ['assigned', 'in_progress', 'returned'], true)) {
            $coursemissing++;
        }
        if (!$nexthw && (int)$r->duedate > $now && in_array((string)$r->status, ['assigned', 'in_progress', 'returned'], true)) {
            $nexthw = $r;
        }
    }
    $course['grade'] = $coursepcts ? pqsdl_letter(array_sum($coursepcts) / count($coursepcts)) : '';
    $course['missing'] = $coursemissing;
    // Same label the page builds (client HTML-escapes, so no s() here).
    $course['next'] = $nexthw ? (string)$nexthw->title . ' · due ' . userdate((int)$nexthw->duedate, '%a') : '';
}
unset($course);

$firstdue = null;
foreach ($dueweek as $r) {
    if (!$firstdue || (int)$r->duedate < (int)$firstdue->duedate) {
        $firstdue = $r;
    }
}
$oncourses = count($courses) - count(array_filter($courses, static fn($c) => $c['missing'] > 0));

// -- serialize for the client ---------------------------------------------------
$hwlite = static function($row): array {
    return [
        'id' => (int)($row->id ?? 0),
        'title' => (string)($row->title ?? ''),
        'duedate' => (int)($row->duedate ?? 0),
        'duedate_day' => (int)($row->duedate ?? 0) > 0 ? userdate((int)$row->duedate, '%A') : '',
        'coursename' => (string)($row->coursename ?? ''),
        'status' => (string)($row->status ?? ''),
    ];
};

$coursesout = [];
foreach ($courses as $course) {
    $coursesout[] = [
        'key' => $course['key'],
        'title' => $course['title'],
        'summary' => $course['summary'],
        'coursename' => $course['coursename'],
        'continueurl' => $course['continue']->out(false),
        'hwtotal' => $course['hwtotal'],
        'pct' => $course['pct'],
        'grade' => $course['grade'],
        'missing' => $course['missing'],
        'next' => $course['next'],
    ];
}

$feedbackout = [];
foreach ($feedbackrows as $fb) {
    $feedbackout[] = [
        'title' => (string)$fb->title,
        'gradepct' => isset($fb->gradepct) ? round((float)$fb->gradepct) : null,
        'feedback' => shorten_text(trim((string)$fb->feedback), 90),
        'timemodified' => (int)($fb->timemodified ?? 0),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'firstname' => (string)$USER->firstname,
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'workspaceid' => $studentworkspaceid,
    'urls' => [
        'homework' => $homeworkurl->out(false),
        'schedule' => $scheduleurl->out(false),
        'workplace' => $workplaceurl->out(false),
    ],
    'kpis' => [
        'dueweek' => count($dueweek),
        'missing' => count($missing),
        'avg_letter' => $avgpct !== null ? pqsdl_letter($avgpct) : '',
        'avg_pct' => $avgpct !== null ? round($avgpct, 1) : null,
        'avg_up' => $avgpct !== null && $avgpct >= 70,
        'next_label' => $nextsession ? userdate((int)$nextsession->scheduled_start, '%a %H:%M') : '',
    ],
    'oncourses' => max(0, $oncourses),
    'coursecount' => count($courses),
    'courses' => $coursesout,
    'nextsession' => $nextsession ? [
        'id' => (int)$nextsession->id,
        'title' => (string)$nextsession->title,
        'scheduled_start' => (int)$nextsession->scheduled_start,
        'start_label' => userdate((int)$nextsession->scheduled_start, '%a %H:%M'),
    ] : null,
    'upnext' => [
        'missing' => $missing ? $hwlite(reset($missing)) : null,
        'firstdue' => $firstdue ? $hwlite($firstdue) : null,
    ],
    'feedback' => $feedbackout,
    'names' => pqpd_names([$userid]),
], JSON_UNESCAPED_SLASHES);
exit;
