<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');

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
.pqhsd-shell{min-height:100vh;background:#f4f6f9;color:#0f2237;font:400 13.5px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
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
.pqhsd-ccard{display:flex;flex-direction:column;background:#fff;border:1px solid #e4e9ef;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);transition:transform .15s ease,box-shadow .15s ease}
.pqhsd-ccard:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(15,34,55,.06),0 18px 38px -16px rgba(15,34,55,.22)}
.pqhsd-ccard__cover{height:74px;background:linear-gradient(115deg,var(--cc,#2166d1),var(--cc2,#4d8be0))}
.pqhsd-courses .pqhsd-ccard:nth-child(5n+1){--cc:#2166d1;--cc2:#4d8be0}
.pqhsd-courses .pqhsd-ccard:nth-child(5n+2){--cc:#0d5c8c;--cc2:#3383b4}
.pqhsd-courses .pqhsd-ccard:nth-child(5n+3){--cc:#0f7f9e;--cc2:#3aa7c4}
.pqhsd-courses .pqhsd-ccard:nth-child(5n+4){--cc:#4f5fc4;--cc2:#7b88dd}
.pqhsd-courses .pqhsd-ccard:nth-child(5n+5){--cc:#33567e;--cc2:#5c7ea6}
.pqhsd-ccard__body{display:flex;flex-direction:column;gap:8px;flex:1;padding:12px 14px 14px}
.pqhsd-ccard__body h3{margin:0;font-size:14.5px;font-weight:750;letter-spacing:-.01em}
.pqhsd-ccard__meta{color:#8494a5;font-size:11.5px;font-weight:600}
.pqhsd-chip{display:inline-flex;align-items:center;align-self:flex-start;min-height:22px;padding:1px 8px;border-radius:999px;background:#fbe9e7;color:#c0392b;font-size:11px;font-weight:700}
.pqhsd-progress{height:7px;border-radius:999px;background:#edf3fc;overflow:hidden}
.pqhsd-progress i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#2166d1,#4d8be0)}
.pqhsd-progress--warn i{background:#b7791f}
.pqhsd-ccard__actions{margin-top:auto}
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
@media(max-width:1100px){.pqhsd-cols{grid-template-columns:1fr}}
<?php echo pqh_design_shell_css('.pqhsd-shell'); ?>
</style>
<main class="pqhsd-shell">
<?php echo pqh_design_shell_html('pqhsd-shell', 'dashboard', ['title' => 'Dashboard']); ?>
<div class="pqhsd-wrap">
  <div class="pqhsd-pagehead">
    <div>
      <h1>Welcome back, <?php echo s((string)$USER->firstname); ?></h1>
      <p><?php echo $courses ? "You're on track in " . max(0, $oncourses) . ' of ' . count($courses) . ' course' . (count($courses) === 1 ? '' : 's') : 'Your learning home.'; ?></p>
    </div>
    <?php if ($courses): $pqhsdfirst = reset($courses); ?>
      <a class="pqhsd-cta" href="<?php echo $pqhsdfirst['continue']->out(false); ?>">Continue learning</a>
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
      <p class="pqhsd-label">My courses</p>
      <div class="pqhsd-courses">
        <?php if (!$courses): ?>
          <div class="pqhsd-empty">No course enrolments yet. Ask your teacher or browse the catalog.</div>
        <?php endif; ?>
        <?php foreach ($courses as $course): ?>
          <div class="pqhsd-ccard">
            <div class="pqhsd-ccard__cover"></div>
            <div class="pqhsd-ccard__body">
              <h3><?php echo s($course['title']); ?></h3>
              <?php if ($course['missing'] > 0): ?>
                <span class="pqhsd-chip"><?php echo (int)$course['missing']; ?> missing task<?php echo $course['missing'] === 1 ? '' : 's'; ?></span>
              <?php elseif ($course['next'] !== ''): ?>
                <div class="pqhsd-ccard__meta">Next: <?php echo $course['next']; ?></div>
              <?php elseif ($course['summary'] !== ''): ?>
                <div class="pqhsd-ccard__meta"><?php echo s($course['summary']); ?></div>
              <?php endif; ?>
              <?php if ($course['pct'] !== null): ?>
                <div class="pqhsd-progress<?php echo $course['missing'] > 0 ? ' pqhsd-progress--warn' : ''; ?>"><i style="width:<?php echo (int)$course['pct']; ?>%"></i></div>
                <div class="pqhsd-ccard__meta"><?php echo (int)$course['pct']; ?>% complete<?php echo $course['grade'] !== '' ? ' · grade ' . s($course['grade']) : ''; ?></div>
              <?php endif; ?>
              <div class="pqhsd-ccard__actions"><a class="pqhsd-btn" href="<?php echo $course['continue']->out(false); ?>">Continue</a></div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
    <div>
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
