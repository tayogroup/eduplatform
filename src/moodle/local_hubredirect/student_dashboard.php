<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

$userid = (int)$USER->id;

// Staff keep the combined dashboard; this page is the student home.
if (pqh_shell_viewer_kind($userid) === 'staff') {
    redirect(new moodle_url('/local/hubredirect/dashboard.php'));
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

// How lessons open: Safe Exam Browser (locked), Focus mode (install-free —
// ordinary tab, fullscreen offer, focus breaks recorded), or Off. Deliberately
// placed AFTER $urlparams gains workspaceid, so the toggle links and the
// post-save redirect keep the workspace context. Governs COURSE launches only;
// exams keep their own enforcement.
require_once(__DIR__ . '/seb_lib.php');
$pqhsd_sebavailable = pqh_seb_course_launch_enabled();
$pqhsd_sebpref = pqh_seb_launch_pref($userid);
$pqhsd_sebrequest = optional_param('sebpref', '', PARAM_ALPHA);
if ($pqhsd_sebrequest !== '') {
    if (!confirm_sesskey()) {
        // A dashboard rendered in an earlier session carries a stale sesskey.
        // Say so and hand back a page with a fresh one — silently ignoring the
        // click just reads as "the toggle is broken".
        redirect(new moodle_url('/local/hubredirect/student_dashboard.php',
            $urlparams + ['sebnotice' => 'stale']));
    }
    $pqhsd_sebpref = in_array($pqhsd_sebrequest, ['seb', 'focus', 'off'], true) ? $pqhsd_sebrequest : 'seb';
    set_user_preference('local_prequran_seb_launch', $pqhsd_sebpref, $userid);
    redirect(new moodle_url('/local/hubredirect/student_dashboard.php',
        $urlparams + ['sebnotice' => 'saved']));
}
$pqhsd_sebnotice = optional_param('sebnotice', '', PARAM_ALPHA);
// All three are MODES, not an on/off switch. An option literally called "Off"
// inside a mode group reads as a power toggle: you pick Focus mode, then hunt
// for something to switch on, click "Off", and lose your selection. Naming the
// third one "Normal browser" makes the group unambiguous.
$pqhsd_sebmodes = [
    'seb' => ['Safe Exam Browser', 'Locked browser. Safe Exam Browser must be installed on this device.'],
    'focus' => ['Focus mode', 'Normal browser, full screen. Your teacher can see if you leave the lesson.'],
    'off' => ['Normal browser', 'No lock and no monitoring.'],
];
$pqhsd_seburl = static function (string $mode) use ($urlparams): moodle_url {
    return new moodle_url('/local/hubredirect/student_dashboard.php',
        $urlparams + ['sebpref' => $mode, 'sesskey' => sesskey()]);
};
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

function pqhsd_letter(float $pct): string {
    foreach ([[90, 'A'], [85, 'A-'], [80, 'B+'], [75, 'B'], [70, 'B-'], [65, 'C+'], [60, 'C'], [55, 'C-'], [50, 'D']] as $step) {
        if ($pct >= $step[0]) {
            return (string)$step[1];
        }
    }
    return 'F';
}

/**
 * The face of a course card: which subject it is, in a child's terms.
 *
 * The card is read by a seven-year-old, so it leads with the SUBJECT word and
 * carries the stage as a small pill: "Ehel English — Grade 2" on one line is
 * three ideas in eleven-point type, and the one a child scans for is
 * "English". Everything here is derived from the title alone — no new query,
 * and an unrecognised course still gets a colour, an icon and both halves of
 * whatever its title is.
 *
 * Two colours per subject, and they are not interchangeable. `c` is the bright
 * one and paints the progress fill and the icon tint, where nothing sits on
 * top of it. `deep` is what carries WHITE TEXT — the button and the pill ink —
 * so every one of them is dark enough to clear 4.5:1 against white. A card
 * that used the bright hue behind the button would read as a toy and fail
 * anybody reading it in sunlight.
 *
 * @return array{name:string,level:string,icon:string,c:string,deep:string,tint:string}
 */
function pqhsd_course_face(string $title): array {
    $subjects = [
        // needle          name                    bright     deep       tint       icon
        ['english',       'English',              '#ff9f1c', '#a35200', '#fff1de'],
        ['math',          'Mathematics',          '#1cb0f6', '#0a6fa8', '#e2f3fd'],
        ['science',       'Science',              '#58cc02', '#2e7d00', '#ecf8e1'],
        ['comput',        'Computing',            '#b565ff', '#6b21c8', '#f4eaff'],
        ['global',        'Global Perspectives',  '#ff5a5f', '#c02a2f', '#ffeaea'],
        ['quran',         'Quran',                '#2ec4b6', '#0f766e', '#e1f6f3'],
        ["qur'an",        'Quran',                '#2ec4b6', '#0f766e', '#e1f6f3'],
        ['arabic',        'Arabic',               '#2ec4b6', '#0f766e', '#e1f6f3'],
        ['islam',         'Islamic Studies',      '#2ec4b6', '#0f766e', '#e1f6f3'],
    ];
    $icons = [
        'English' => '<path d="M12 7.5C10.6 6 8.6 5.3 6 5.5A1 1 0 0 0 5 6.5v10a1 1 0 0 0 1.1 1c2.3-.2 4.2.4 5.9 1.8 1.7-1.4 3.6-2 5.9-1.8a1 1 0 0 0 1.1-1v-10a1 1 0 0 0-1-1c-2.6-.2-4.6.5-6 2z"/><path d="M12 7.5v11"/>',
        'Mathematics' => '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M7.2 9h3.6M9 7.2v3.6M13.2 9h3.6M13.6 14.4l2.8 2.8M16.4 14.4l-2.8 2.8M7.2 15.6h3.6"/>',
        'Science' => '<path d="M9.5 3h5M10.5 3v5.6l-4.3 8A2.4 2.4 0 0 0 8.3 20h7.4a2.4 2.4 0 0 0 2.1-3.4l-4.3-8V3"/><path d="M7.6 14.5h8.8"/>',
        'Computing' => '<rect x="2.5" y="4.5" width="19" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 17v3.5"/>',
        'Global Perspectives' => '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.3 2.4 3.5 5.3 3.5 8.5S14.3 18.1 12 20.5c-2.3-2.4-3.5-5.3-3.5-8.5S9.7 5.9 12 3.5z"/>',
        'Quran' => '<path d="M19.5 14.8A7.5 7.5 0 1 1 9.6 4.4a6 6 0 0 0 9.9 10.4z"/><path d="m17.6 4 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
        'Arabic' => '<path d="M19.5 14.8A7.5 7.5 0 1 1 9.6 4.4a6 6 0 0 0 9.9 10.4z"/><path d="m17.6 4 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
        'Islamic Studies' => '<path d="M19.5 14.8A7.5 7.5 0 1 1 9.6 4.4a6 6 0 0 0 9.9 10.4z"/><path d="m17.6 4 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
        'default' => '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/>',
    ];

    $clean = trim(preg_replace('/^\s*Ehel\s+/i', '', $title));
    // The catalogue writes "Subject — Grade 2"; an em dash, an en dash and a
    // spaced hyphen have all appeared in course titles, so all three split.
    $name = $clean;
    $level = '';
    if (preg_match('/^(.*?)\s*(?:—|–|\s-\s)\s*(.+)$/u', $clean, $m)) {
        $name = trim($m[1]);
        $level = trim($m[2]);
    }

    $hay = mb_strtolower($title);
    foreach ($subjects as $s) {
        if (mb_strpos($hay, $s[0]) !== false) {
            return ['name' => $name !== '' ? $name : $s[1], 'level' => $level,
                'icon' => $icons[$s[1]], 'c' => $s[2], 'deep' => $s[3], 'tint' => $s[4]];
        }
    }
    return ['name' => $name !== '' ? $name : $clean, 'level' => $level,
        'icon' => $icons['default'], 'c' => '#6c8cff', 'deep' => '#3b4fc4', 'tint' => '#ebefff'];
}

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
// A tutoring-support learner is enrolled in one ehel-tutoring-<slug> course per
// subject their family bought, and six cards is not what "one Tutor Me" means to
// them. These two closures pull those cards out of the ordinary lists so the
// block after the loops can put ONE back.
//
// The enrolments themselves are untouched — they are what entitlement is checked
// against at launch, and the family report still groups help sessions by the
// course key (portal_handlers/student-parent-portal.php). This is a
// presentation collapse and nothing else.
//
// Where the key lives differs by source: a Moodle enrolment card is keyed
// 'moodle_<id>' and carries the idnumber in course_number, while a catalog card
// is keyed by the catalog key itself. Asking both is why a tutoring course
// added to the catalog later would not quietly reappear as a seventh card.
$pqhsd_tutoringslugs = [];
$pqhsd_tutoring_card = static function (string $key, array $entry) use (&$pqhsd_tutoringslugs): bool {
    $idnumber = trim((string)($entry['course_number'] ?? ''));
    $slug = pqpg_tutoring_subject($idnumber !== '' ? $idnumber : $key);
    if ($slug === null) {
        return false;
    }
    $pqhsd_tutoringslugs[$slug] = true;
    return true;
};
$courses = [];
foreach (pqh_user_courses($userid) as $key => $entry) {
    if ($pqhsd_tutoring_card($key, (array)$entry)) {
        continue;
    }
    $courses[$key] = [
        'key' => (string)$key,
        'title' => (string)($entry['title'] ?? $key),
        'summary' => (string)($entry['summary'] ?? ''),
        'coursename' => '',
        'continue' => new moodle_url('/local/hubredirect/course_launch.php', ['course' => (string)$key]),
        // Where the learner is in this course, shown under the title in the card's
        // header -- "Unit 3, Module 2". Empty until a source is agreed, and the
        // line is not rendered while it is empty, so a card never claims a
        // position nobody measured.
        //
        // It is NOT derivable from what this page already reads. The dashboard
        // loads homework submissions and the next live session, neither of which
        // carries a position in course content. unitid/lessonid DO exist, but on
        // local_prequran_live_session and _live_series -- they describe what a
        // class covers, not where a learner has got to -- and a session's cohortid
        // is a Moodle cohort, not a class_group, so there is no verified join from
        // a session to the course key this card is built from.
        'position' => '',
    ];
}
try {
    foreach (pqh_user_moodle_course_cards($userid) as $key => $entry) {
        if (isset($courses[$key])) {
            continue;
        }
        if (array_intersect((array)($entry['catalogkeys'] ?? []), array_keys($courses))) {
            // Already represented by a catalog-key card (e.g. from the
            // student's declared profile course_type); avoid showing the
            // same course twice under two different keys.
            continue;
        }
        if ($pqhsd_tutoring_card($key, (array)$entry)) {
            continue;
        }
        $title = (string)($entry['title'] ?? ($entry['fullname'] ?? $key));
        $courses[$key] = [
            'key' => (string)$key,
            'title' => $title,
            'summary' => '',
            'coursename' => $title,
            'continue' => new moodle_url('/local/hubredirect/course_launch.php', ['course' => (string)$key]),
            // See the note on the catalog branch above.
            'position' => '',
        ];
    }
} catch (Throwable $e) {
    // Moodle enrolment cards unavailable; catalog courses still render.
}
// ---- the tutoring-support category: six umbrella courses, ONE card ------
// The card's KEY is the subject it will actually open, not a synthetic
// 'ehel-tutoring': the SEB hand-off below mints its ticket from
// $course['key'], so a key naming no real course would build a launch that
// cannot resolve. The TITLE is what says "Tutor Me" — and it deliberately
// matches none of pqhsd_course_face()'s subject needles, so the card takes the
// neutral star rather than borrowing one subject's colour for all six.
//
// Appended rather than inserted: a tutoring learner is at another school and has
// no other enrolments, so in practice this is their only card, and appending
// leaves everybody else's ordering exactly as it was.
if ($pqhsd_tutoringslugs) {
    // Resume where they were, so the one card is not always the same subject.
    // The rule lives in progress_gatewaylib beside the rest of the tutoring
    // server logic — it is gated there (tools/check-tutoring-anchor.php), and
    // the in-app subject picker needs the same answer.
    $pqhsd_opensubject = pqpg_tutoring_resume_subject($userid, array_keys($pqhsd_tutoringslugs));
    if ($pqhsd_opensubject !== '') {
        $pqhsd_tutkey = 'ehel-tutoring-' . $pqhsd_opensubject;
        $courses[$pqhsd_tutkey] = [
            'key' => $pqhsd_tutkey,
            'title' => 'Tutor Me',
            'summary' => '',
            // Deliberately empty. The rollup immediately below matches homework
            // on coursename, and a tutoring card must never adopt a school
            // course's homework — these learners are taught somewhere else.
            'coursename' => '',
            'continue' => new moodle_url('/local/hubredirect/course_launch.php', ['course' => $pqhsd_tutkey]),
            'position' => '',
        ];
    }
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
    $course['grade'] = $coursepcts ? pqhsd_letter(array_sum($coursepcts) / count($coursepcts)) : '';
    $course['missing'] = $coursemissing;
    $course['next'] = $nexthw ? s((string)$nexthw->title) . ' · due ' . userdate((int)$nexthw->duedate, '%a') : '';
}
unset($course);

$firstdue = null;
foreach ($dueweek as $r) {
    if (!$firstdue || (int)$r->duedate < (int)$firstdue->duedate) {
        $firstdue = $r;
    }
}
$oncourses = count($courses) - count(array_filter($courses, static fn($c) => $c['missing'] > 0));

pqh_enforce_role_domain($consumercontext, $studentworkspaceid, (int)$USER->id);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/student_dashboard.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Dashboard');
$PAGE->set_heading('Student Dashboard');
$PAGE->add_body_class('pqhsd-page');
echo $OUTPUT->header();
?>
<style>
body.pqhsd-page header,body.pqhsd-page footer,body.pqhsd-page nav.navbar,body.pqhsd-page #page-header,body.pqhsd-page #page-footer,body.pqhsd-page .drawer,body.pqhsd-page .drawer-toggles,body.pqhsd-page .block-region{display:none!important}
body.pqhsd-page #page,body.pqhsd-page #page-content,body.pqhsd-page #region-main,body.pqhsd-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhsd-shell{min-height:100vh;background:#fff;color:#0f2237;font:400 15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.pqhsd-wrap{max-width:1440px}
.pqhsd-pagehead{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.pqhsd-pagehead h1{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}
.pqhsd-pagehead p{margin:4px 0 0;color:#5b6b7c;font-weight:500}
.pqhsd-cta{display:inline-flex;align-items:center;min-height:40px;padding:0 18px;border-radius:12px;background:#2166d1;color:#fff!important;font-weight:700;font-size:13.5px;text-decoration:none!important;box-shadow:0 6px 14px -8px rgba(33,102,209,.55)}
.pqhsd-cta:hover{background:#17498f}
.pqhsd-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:20px}
.pqhsd-kpi{padding:14px 15px;background:#fff;border:1px solid #e4e9ef;border-radius:16px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14)}
.pqhsd-kpi b{display:block;color:#8494a5;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.pqhsd-kpi strong{display:block;margin-top:5px;font-size:25px;font-weight:800;letter-spacing:-.02em}
.pqhsd-kpi strong.is-risk{color:#c0392b}
.pqhsd-kpi .pqhsd-delta{color:#2e7d4f;font-size:13px}
.pqhsd-kpi a{display:inline-block;margin-top:8px;color:#2166d1;font-size:11.5px;font-weight:650;text-decoration:none}
.pqhsd-kpi a:hover{text-decoration:underline}
.pqhsd-label{margin:0 0 8px;color:#8494a5;font-size:10.5px;font-weight:750;text-transform:uppercase;letter-spacing:.07em}
.pqhsd-cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,1fr);gap:16px;align-items:start}
.pqhsd-courses{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
/* The course cards are styled further down, in the block AFTER the
   OpenProject skin -- see the note there. All that is left here is
   .pqhsd-ccard__meta, which the notices above the grid use too. */
.pqhsd-ccard__meta{color:#8494a5;font-size:11.5px;font-weight:600}
.pqhsd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 14px;border-radius:10px;background:#2166d1;color:#fff!important;font-size:12.5px;font-weight:700;text-decoration:none!important}
.pqhsd-btn:hover{background:#17498f}
.pqhsd-btn--light{background:#fff;color:#0f2237!important;border:1px solid #e4e9ef}
.pqhsd-btn--light:hover{background:#edf3fc}
.pqhsd-panel{background:#fff;border:1px solid #e4e9ef;border-radius:16px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);padding:16px}
.pqhsd-panel+.pqhsd-panel{margin-top:16px}
.pqhsd-panel h2{margin:0 0 4px;font-size:17px;font-weight:750;letter-spacing:-.01em}
.pqhsd-panel .pqhsd-sub{margin:0 0 12px;color:#5b6b7c;font-size:12px;font-weight:500}
.pqhsd-todo{display:grid;gap:8px}
.pqhsd-todo__item{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:12px;background:#f4f6f9}
.pqhsd-todo__ico{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.pqhsd-todo__ico svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pqhsd-todo__ico--risk{background:#fbe9e7;color:#c0392b}
.pqhsd-todo__ico--info{background:#e9f1fc;color:#2166d1}
.pqhsd-todo__ico--warn{background:#faf1dd;color:#b7791f}
.pqhsd-todo__ico--ok{background:#e8f4ec;color:#2e7d4f}
.pqhsd-todo__body{min-width:0;flex:1}
.pqhsd-todo__body strong{display:block;font-size:12.5px;font-weight:700}
.pqhsd-todo__body span{display:block;color:#5b6b7c;font-size:11.5px;font-weight:500}
.pqhsd-feedback{display:flex;gap:11px;align-items:flex-start;padding:12px;border-radius:12px;background:#f4f6f9}
.pqhsd-feedback+.pqhsd-feedback{margin-top:8px}
.pqhsd-feedback__ico{flex:0 0 auto;width:34px;height:34px;border-radius:10px;background:#e8f4ec;color:#2e7d4f;display:flex;align-items:center;justify-content:center}
.pqhsd-feedback__ico svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pqhsd-feedback strong{display:block;font-size:12.5px;font-weight:700}
.pqhsd-feedback span{display:block;color:#5b6b7c;font-size:11.5px;font-weight:500}
.pqhsd-empty{border:1px dashed #e4e9ef;border-radius:12px;padding:18px;text-align:center;color:#5b6b7c;font-weight:550}
.pqhsd-side{background:#edf3fc;border-radius:16px;padding:14px}
@media(max-width:1100px){.pqhsd-cols{grid-template-columns:1fr}}
<?php echo pqh_design_shell_css('.pqhsd-shell'); ?>
.pqhsd-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
</style>
<style><?php echo pqh_openproject_skin_css('pqhsd', 'pqhsd-page'); ?></style>
<style><?php echo pqh_openproject_skin_css(['pqhsd-todo', 'pqhsd-ccard', 'pqhsd-feedback'], '', '__'); ?></style>
<?php // The rail, its links and the top bar, in Duolingo's language. Same
      // ordering rule as the block below: it has to follow the skin, which
      // paints .pqh-gnav and .pqh-appbar with !important. ?>
<style><?php echo pqh_viewer_chrome_css('.pqhsd-shell'); ?></style>
<style>
/* ---------------------------------------------------------------------------
   The course cards, for a child.
   ---------------------------------------------------------------------------
   THIS BLOCK MUST STAY AFTER THE TWO SKIN BLOCKS ABOVE. pqh_openproject_skin_css
   is a later stylesheet on purpose -- that is how it restyles 27 pages without
   !important -- so anything written above it loses. Everything here uses the
   .pqhsd-jc- namespace, which the skin claims none of (its selectors are exact
   classes: .pqhsd-card, .pqhsd-btn, .pqhsd-chip, .pqhsd-ccard__body ...), so
   nothing has to fight it either.

   The shape is a chunky tile: one subject word, its stage as a pill, one line
   of "what is waiting", a fat progress bar and a single obvious button with a
   solid bottom edge that presses in. What the old card did -- a dark gradient
   band carrying the whole title, then a white body -- put the loudest thing on
   the page around the least useful reading of it, and tiled eight of them.
   Colour now identifies the SUBJECT rather than the position in the grid, so
   English is orange on every card that says English, and a child finds their
   course by colour before they can read it.
*/
.pqhsd-courses{grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:16px}
.pqhsd-jc{display:flex;flex-direction:column;gap:11px;padding:16px 15px 15px;background:#fff;border:2px solid #e7ecf3;border-radius:22px;box-shadow:0 4px 0 #e7ecf3;transition:transform .13s ease,box-shadow .13s ease,border-color .13s ease}
.pqhsd-jc:hover{transform:translateY(-3px);border-color:var(--jc);box-shadow:0 7px 0 var(--jct)}
.pqhsd-jc-head{display:flex;align-items:center;gap:12px}
.pqhsd-jc-badge{flex:0 0 auto;width:52px;height:52px;border-radius:17px;display:flex;align-items:center;justify-content:center;background:var(--jct);color:var(--jcd)}
.pqhsd-jc-badge svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pqhsd-jc-id{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.pqhsd-jc-name{margin:0;color:#16324f;font-size:19px;font-weight:800;line-height:1.15;letter-spacing:-.02em}
.pqhsd-jc-level{display:inline-block;padding:2px 10px;border-radius:999px;background:var(--jcd);color:#fff;font-size:11.5px;font-weight:800;line-height:1.5;letter-spacing:.01em}
.pqhsd-jc-pos{margin:0;color:#5b6b7c;font-size:12px;font-weight:700}
/* Two lines, then an ellipsis: a catalogue summary can be a paragraph, and a
   card that grows to fit one is a card that no longer matches the row it is
   in. -webkit-box is the only clamp with the support this needs. */
.pqhsd-jc-note{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;color:#5b6b7c;font-size:12.5px;font-weight:650;line-height:1.35}
.pqhsd-jc-note b{color:#16324f;font-weight:800}
.pqhsd-jc-todo{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;margin:0;padding:4px 11px 4px 8px;border-radius:999px;background:#ffe8e8;color:#a71d21;font-size:12px;font-weight:800}
.pqhsd-jc-todo svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
.pqhsd-jc-bar{height:13px;border-radius:999px;background:#eef1f6;overflow:hidden}
/* min-width so that 1% is still a visible nub rather than a hairline. The
   fill is not drawn at all at 0% -- a nub at zero reads as "you have started",
   which is the one thing the bar must not say. */
.pqhsd-jc-bar i{display:block;height:100%;min-width:13px;border-radius:999px;background:var(--jc);box-shadow:inset 0 3px 0 rgba(255,255,255,.4)}
.pqhsd-jc-pct{margin:0;color:#5b6b7c;font-size:12px;font-weight:750}
.pqhsd-jc-go{display:flex;gap:8px;margin-top:auto;padding-top:2px}
/* box-sizing + a transparent border so the primary and the outlined Syllabus
   button are the same 42px tall. Without it the secondary's 2px border makes
   it the taller of the two and the row sits crooked. */
.pqhsd-jc-btn{box-sizing:border-box;flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 14px;border:2px solid transparent;border-radius:14px;background:var(--jcd);color:#fff!important;font-size:13.5px;font-weight:800;letter-spacing:.01em;text-decoration:none!important;box-shadow:0 4px 0 rgba(0,0,0,.22);transition:transform .08s ease,box-shadow .08s ease,filter .13s ease}
.pqhsd-jc-btn svg{width:16px;height:16px;fill:currentColor;stroke:none}
.pqhsd-jc-btn:hover{filter:brightness(1.08);color:#fff!important}
.pqhsd-jc-btn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.22)}
.pqhsd-jc-btn:focus-visible{outline:3px solid var(--jc);outline-offset:2px}
.pqhsd-jc-btn2{flex:0 0 auto;background:#fff;color:#3f5468!important;border:2px solid #e7ecf3;box-shadow:0 4px 0 #e7ecf3}
.pqhsd-jc-btn2:hover{background:#f5f8fc;filter:none;color:#16324f!important}
.pqhsd-jc-btn2:active{box-shadow:0 1px 0 #e7ecf3}
.pqhsd-courses .pqhsd-empty{grid-column:1/-1;border:2px dashed #d8e0ea;border-radius:22px;background:#f8fafc;color:#5b6b7c;font-size:14px;font-weight:700}
@media(prefers-reduced-motion:reduce){.pqhsd-jc,.pqhsd-jc-btn{transition:none}.pqhsd-jc:hover{transform:none}.pqhsd-jc-btn:active{transform:none}}
</style>
<main class="pqhsd-shell">
<?php
echo pqh_design_shell_html('pqhsd-shell', 'dashboard', [
    'title' => 'Dashboard',
    'appbar' => [
        ['Workspace', new moodle_url('/local/hubredirect/student_workplace.php', $urlparams)],
        ['School Hub', new moodle_url('/local/hubredirect/consumer_landing.php', $urlparams)],
    ],
    'hideitems' => ['dashboard'],
    'navitems' => [
        [
            'label' => 'Messages',
            'url' => new moodle_url('/local/hubredirect/communications.php', ['studentid' => $userid, 'opencomm' => 'messages']),
            'icon' => '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
            'attrs' => 'data-opencomm="messages"',
        ],
        [
            'label' => 'Announcements',
            'url' => new moodle_url('/local/hubredirect/communications.php', ['studentid' => $userid, 'opencomm' => 'announcements']),
            'icon' => '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
            'attrs' => 'data-opencomm="announcements"',
        ],
        [
            'label' => 'Manage tickets',
            'url' => new moodle_url('/local/hubredirect/support.php', ['studentid' => $userid]),
            'icon' => '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
            'attrs' => 'data-pq-support-action="open"',
        ],
        [
            'label' => 'Create a ticket',
            'url' => new moodle_url('/local/hubredirect/support.php', ['studentid' => $userid, 'new' => 1]),
            'icon' => '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
            'attrs' => 'data-pq-support-action="new"',
        ],
    ],
]);
?>
<div class="pqhsd-wrap">
  <div class="pqhsd-pagehead">
    <div>
      <?php $pqhsdaccountno = pqh_account_no_value($USER); ?>
      <h1>Welcome back, <?php echo s((string)$USER->firstname); ?><?php echo $pqhsdaccountno !== '' ? ' (' . s($pqhsdaccountno) . ')' : ''; ?></h1>
      <p><?php echo $courses ? "You're on track in " . max(0, $oncourses) . ' of ' . count($courses) . ' course' . (count($courses) === 1 ? '' : 's') : 'Your learning home.'; ?></p>
    </div>
    <?php if ($courses): $pqhsdfirst = reset($courses);
      $pqhsd_ctahref = $pqhsdfirst['continue']->out(false);
      if ($pqhsd_sebavailable && $pqhsd_sebpref === 'seb') {
          $pqhsd_ctahref = pqh_seb_course_handoff_url((string)$pqhsdfirst['key'], $userid);
      }
    ?>
      <a class="pqhsd-cta" href="<?php echo s($pqhsd_ctahref); ?>">Continue learning</a>
    <?php endif; ?>
  </div>

  <div class="pqhsd-kpis" aria-label="This week at a glance">
    <div class="pqhsd-kpi"><b>Due this week</b><strong><?php echo count($dueweek); ?></strong><a href="<?php echo $homeworkurl->out(false); ?>">View deadlines</a></div>
    <div class="pqhsd-kpi"><b>Missing work</b><strong<?php echo $missing ? ' class="is-risk"' : ''; ?>><?php echo count($missing); ?></strong><a href="<?php echo $homeworkurl->out(false); ?>">Submit now</a></div>
    <div class="pqhsd-kpi"><b>Current average</b><strong><?php echo $avgpct !== null ? s(pqhsd_letter($avgpct)) : '—'; ?><?php echo $avgpct !== null && $avgpct >= 70 ? ' <span class="pqhsd-delta">▲</span>' : ''; ?></strong><a href="<?php echo $homeworkurl->out(false); ?>">Grades</a></div>
    <div class="pqhsd-kpi"><b>Next live class</b><strong style="font-size:19px"><?php echo $nextsession ? s(userdate((int)$nextsession->scheduled_start, '%a %H:%M')) : 'None booked'; ?></strong><a href="<?php echo $scheduleurl->out(false); ?>">Join info</a></div>
  </div>

  <div class="pqhsd-cols">
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <p class="pqhsd-label">My courses</p>
        <?php if ($pqhsd_sebavailable): ?>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#4a5b6e" role="group" aria-label="How lessons open">
            <span>Lessons open in</span>
            <span style="display:inline-flex;border:1px solid #cfd9e4;border-radius:999px;overflow:hidden">
              <?php foreach ($pqhsd_sebmodes as $pqhsd_mode => $pqhsd_meta): ?>
                <a href="<?php echo $pqhsd_seburl($pqhsd_mode)->out(false); ?>"
                   title="<?php echo s($pqhsd_meta[1]); ?>"
                   style="padding:4px 13px;text-decoration:none;font-weight:600;<?php echo $pqhsd_sebpref === $pqhsd_mode ? 'background:#1f5fa8;color:#fff' : 'color:#4a5b6e'; ?>"
                   <?php echo $pqhsd_sebpref === $pqhsd_mode ? 'aria-current="true"' : ''; ?>><?php echo s($pqhsd_meta[0]); ?></a>
              <?php endforeach; ?>
            </span>
          </div>
        <?php endif; ?>
      </div>
      <?php if ($pqhsd_sebnotice === 'keepgoing'): ?>
        <div class="pqhsd-ccard__meta" style="margin:-4px 0 10px;color:#7a6a3f">You're not finished yet — your lesson and homework are waiting when you're ready.</div>
      <?php endif; ?>
      <?php if ($pqhsd_sebavailable && $pqhsd_sebnotice === 'stale'): ?>
        <div class="pqhsd-ccard__meta" style="margin:-4px 0 10px;color:#8a3f3f">That page had expired, so the change was not saved. Try the buttons again.</div>
      <?php elseif ($pqhsd_sebavailable && $pqhsd_sebnotice === 'saved'): ?>
        <div class="pqhsd-ccard__meta" style="margin:-4px 0 10px;color:#1f5fa8">Saved — lessons will open in <?php echo s($pqhsd_sebmodes[$pqhsd_sebpref][0] ?? $pqhsd_sebpref); ?>.</div>
      <?php endif; ?>
      <?php if ($pqhsd_sebavailable && $pqhsd_sebpref !== 'seb'): ?>
        <div class="pqhsd-ccard__meta" style="margin:-4px 0 10px;color:#7a6a3f">
          <?php echo $pqhsd_sebpref === 'focus'
            ? 'Focus mode: lessons open in this browser and ask for full screen. Your teacher can see if you leave the lesson.'
            : 'Lessons open normally, with no lock and no monitoring. Choose Focus mode or Safe Exam Browser if your teacher asks for it.'; ?>
        </div>
      <?php endif; ?>
      <div class="pqhsd-courses">
        <?php if (!$courses): ?>
          <div class="pqhsd-empty">No course enrolments yet. Ask your teacher or browse the catalog.</div>
        <?php endif; ?>
        <?php foreach ($courses as $course): $pqhsd_face = pqhsd_course_face((string)$course['title']); ?>
          <?php
            // With SEB on, link straight to the sebs:// handoff: the browser
            // never navigates, so there is no interstitial and this dashboard
            // is still on screen when SEB closes.
            $pqhsd_href = $course['continue']->out(false);
            if ($pqhsd_sebavailable && $pqhsd_sebpref === 'seb') {
                $pqhsd_href = pqh_seb_course_handoff_url((string)$course['key'], $userid);
            }
            // Syllabus link: only for real Moodle courses (catalog keys have
            // no course to point at), and only when one exists to read.
            $pqhsd_syl = '';
            if (preg_match('/^moodle_(\d+)$/', (string)$course['key'], $pqhsd_mm)) {
                $pqhsd_cid = (int)$pqhsd_mm[1];
                $pqhsd_idn = (string)$DB->get_field('course', 'idnumber', ['id' => $pqhsd_cid]);
                if (pqh_table_exists_safe('local_prequran_syllabus')
                        && $DB->record_exists('local_prequran_syllabus', ['moodlecourseid' => $pqhsd_cid])) {
                    $pqhsd_syl = (new moodle_url('/local/hubredirect/syllabus_view.php',
                        ['course' => $pqhsd_idn !== '' ? $pqhsd_idn : $pqhsd_cid]))->out(false);
                }
            }
            // "Start" until there is progress to continue. A child who has not
            // opened a course yet is not continuing anything, and the word is
            // the difference between a card that invites and one that nags.
            $pqhsd_started = ($course['pct'] !== null && (int)$course['pct'] > 0);
          ?>
          <article class="pqhsd-jc" style="--jc:<?php echo s($pqhsd_face['c']); ?>;--jcd:<?php echo s($pqhsd_face['deep']); ?>;--jct:<?php echo s($pqhsd_face['tint']); ?>">
            <?php // The subject is the card's identity, so it leads: a coloured emblem,
                    // the subject word, and the stage as a pill under it. The full title
                    // ("Ehel English — Grade 2") still reaches assistive tech through the
                    // button's label, where it names the destination. ?>
            <div class="pqhsd-jc-head">
              <span class="pqhsd-jc-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><?php echo $pqhsd_face['icon']; ?></svg></span>
              <div class="pqhsd-jc-id">
                <h3 class="pqhsd-jc-name"><?php echo s($pqhsd_face['name']); ?></h3>
                <?php if ($pqhsd_face['level'] !== ''): ?>
                  <span class="pqhsd-jc-level"><?php echo s($pqhsd_face['level']); ?></span>
                <?php endif; ?>
              </div>
            </div>
            <?php if (($course['position'] ?? '') !== ''): ?>
              <p class="pqhsd-jc-pos"><?php echo s((string)$course['position']); ?></p>
            <?php endif; ?>
            <?php if ($course['missing'] > 0): ?>
              <p class="pqhsd-jc-todo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2h.01"/></svg><?php echo (int)$course['missing']; ?> to catch up</p>
            <?php elseif ($course['next'] !== ''): ?>
              <p class="pqhsd-jc-note"><b>Next:</b> <?php echo $course['next']; ?></p>
            <?php elseif ($course['summary'] !== ''): ?>
              <p class="pqhsd-jc-note"><?php echo s($course['summary']); ?></p>
            <?php else: ?>
              <p class="pqhsd-jc-note"><?php
                echo ($course['pct'] !== null && (int)$course['pct'] >= 100) ? 'All done — nice work!'
                    : ($pqhsd_started ? 'Nothing waiting — keep going!' : 'Ready when you are!');
              ?></p>
            <?php endif; ?>
            <?php if ($course['pct'] !== null): ?>
              <div class="pqhsd-jc-bar" role="img" aria-label="<?php echo (int)$course['pct']; ?>% of your work in this course is done"><?php
                echo $pqhsd_started ? '<i style="width:' . (int)$course['pct'] . '%"></i>' : '';
              ?></div>
              <p class="pqhsd-jc-pct"><?php echo (int)$course['pct']; ?>% done<?php echo $course['grade'] !== '' ? ' · grade ' . s($course['grade']) : ''; ?></p>
            <?php endif; ?>
            <div class="pqhsd-jc-go">
              <a class="pqhsd-jc-btn" href="<?php echo s($pqhsd_href); ?>" aria-label="<?php echo $pqhsd_started ? 'Continue' : 'Start'; ?> <?php echo s((string)$course['title']); ?>"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.9l11-6.8a1 1 0 0 0 0-1.8l-11-6.8a1 1 0 0 0-1.5.9z"/></svg><?php echo $pqhsd_started ? 'Continue' : 'Start'; ?></a>
              <?php if ($pqhsd_syl !== ''): ?>
                <a class="pqhsd-jc-btn pqhsd-jc-btn2" href="<?php echo s($pqhsd_syl); ?>" aria-label="Syllabus for <?php echo s((string)$course['title']); ?>">Syllabus</a>
              <?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    </div>
    <div class="pqhsd-side">
      <section class="pqhsd-panel" aria-label="Up next">
        <h2>Up next</h2>
        <p class="pqhsd-sub">Your week at a glance</p>
        <div class="pqhsd-todo">
          <?php if ($missing): $pqhsdmiss = reset($missing); ?>
            <div class="pqhsd-todo__item">
              <span class="pqhsd-todo__ico pqhsd-todo__ico--risk"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></span>
              <span class="pqhsd-todo__body"><strong><?php echo s((string)$pqhsdmiss->title); ?> — missing</strong><span>Was due <?php echo s(userdate((int)$pqhsdmiss->duedate, '%A')); ?></span></span>
              <a class="pqhsd-btn" href="<?php echo $homeworkurl->out(false); ?>">Do it</a>
            </div>
          <?php endif; ?>
          <?php if ($nextsession): ?>
            <div class="pqhsd-todo__item">
              <span class="pqhsd-todo__ico pqhsd-todo__ico--info"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></svg></span>
              <span class="pqhsd-todo__body"><strong>Live: <?php echo s((string)$nextsession->title); ?></strong><span><?php echo s(userdate((int)$nextsession->scheduled_start, '%a %H:%M')); ?></span></span>
              <a class="pqhsd-btn pqhsd-btn--light" href="<?php echo $scheduleurl->out(false); ?>">Join</a>
            </div>
          <?php endif; ?>
          <?php if ($firstdue): ?>
            <div class="pqhsd-todo__item">
              <span class="pqhsd-todo__ico pqhsd-todo__ico--warn"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
              <span class="pqhsd-todo__body"><strong><?php echo s((string)$firstdue->title); ?> due <?php echo s(userdate((int)$firstdue->duedate, '%A')); ?></strong><span><?php echo s((string)$firstdue->coursename); ?></span></span>
              <a class="pqhsd-btn pqhsd-btn--light" href="<?php echo $homeworkurl->out(false); ?>">Open</a>
            </div>
          <?php endif; ?>
          <?php if (!$missing && !$nextsession && !$firstdue): ?>
            <div class="pqhsd-todo__item">
              <span class="pqhsd-todo__ico pqhsd-todo__ico--ok"><svg viewBox="0 0 24 24"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/></svg></span>
              <span class="pqhsd-todo__body"><strong>All caught up</strong><span>Nothing waiting — keep learning!</span></span>
              <a class="pqhsd-btn pqhsd-btn--light" href="<?php echo $workplaceurl->out(false); ?>">Workplace</a>
            </div>
          <?php endif; ?>
        </div>
      </section>
      <section class="pqhsd-panel" aria-label="Recent feedback">
        <h2>Recent feedback</h2>
        <p class="pqhsd-sub">From your teachers</p>
        <?php if (!$feedbackrows): ?>
          <div class="pqhsd-empty">No feedback yet. Submit homework to hear from your teacher.</div>
        <?php endif; ?>
        <?php foreach ($feedbackrows as $fb): ?>
          <div class="pqhsd-feedback">
            <span class="pqhsd-feedback__ico"><svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></span>
            <span>
              <strong><?php echo s((string)$fb->title); ?><?php echo isset($fb->gradepct) ? ' · ' . round((float)$fb->gradepct) . '%' : ''; ?></strong>
              <span>"<?php echo s(shorten_text(trim((string)$fb->feedback), 90)); ?>"</span>
            </span>
          </div>
        <?php endforeach; ?>
      </section>
    </div>
  </div>
</div>
</main>
<?php
echo $OUTPUT->footer();
