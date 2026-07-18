<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/office_materials_lib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqho_resolve_teacher_workspace_id((int)$USER->id, $requestedworkspaceid, 0, $consumercontext);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php', $urlparams);
if ($workspaceid <= 0 || !pqho_user_is_student_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Choose a student workspace before opening Student Workplace.',
        $dashboardurl,
        'Student workplace access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied('The selected workspace was not found.', $dashboardurl, 'Student workplace unavailable');
}

function pqhsw_default_environment(): string {
    global $CFG;
    $requested = strtolower(trim(optional_param('pq_env', '', PARAM_ALPHANUMEXT)));
    if (in_array($requested, ['integration', 'staging', 'production'], true)) {
        return $requested;
    }
    $configured = strtolower(trim((string)get_config('local_prequran', 'bunny_environment')));
    if (in_array($configured, ['integration', 'staging', 'production'], true)) {
        return $configured;
    }
    $host = strtolower((string)(parse_url((string)$CFG->wwwroot, PHP_URL_HOST) ?: ''));
    if ($host !== '' && (strpos($host, 'test') !== false || preg_match('/(^|[.\-])(integration|qa)([.\-]|$)/', $host))) {
        return 'integration';
    }
    if ($host !== '' && preg_match('/(^|[.\-])staging([.\-]|$)/', $host)) {
        return 'staging';
    }
    return 'production';
}

$studentid = (int)$USER->id;
$lessonurl = new moodle_url('/local/hubredirect/issue_child.php', [
    'goto' => 'alphabet_listen',
    'pq_env' => pqhsw_default_environment(),
    'managed_student' => 1,
]);
$studio = new moodle_url('/local/hubredirect/teacher_office.php', $urlparams);
$materials = new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams);
$homework = new moodle_url('/local/hubredirect/student_homework.php', $urlparams);
$studenttools = [
    'Virtual tutor' => new moodle_url('/local/hubredirect/virtual_tutor.php', ['studentid' => $studentid]),
    'Parent live hub' => new moodle_url('/local/hubredirect/live_parent_trust.php', $urlparams + ['childid' => $studentid]),
    'Live schedule' => new moodle_url('/local/hubredirect/live_schedule.php', $urlparams + ['childid' => $studentid]),
    'Class series' => new moodle_url('/local/hubredirect/live_series_schedule.php', $urlparams + ['childid' => $studentid]),
    'Live calendar' => new moodle_url('/local/hubredirect/live_calendar.php', $urlparams + ['childid' => $studentid]),
    'Unofficial transcript' => new moodle_url('/local/hubredirect/course_transcript.php', $urlparams + ['studentid' => $studentid]),
    'Live summaries' => new moodle_url('/local/hubredirect/live_summaries.php', $urlparams + ['childid' => $studentid]),
    'Trust center' => new moodle_url('/local/hubredirect/live_trust.php', $urlparams + ['childid' => $studentid]),
    'Live recordings' => new moodle_url('/local/hubredirect/live_recordings.php', $urlparams + ['childid' => $studentid]),
    'Managed report' => new moodle_url('/local/hubredirect/managed_reports.php', $urlparams + ['studentid' => $studentid]),
    'Speak recordings' => new moodle_url('/local/hubredirect/recordings.php', ['childid' => $studentid]),
    'Quiz report' => new moodle_url('/local/hubredirect/quiz_report.php', [
        'pq_env' => pqhsw_default_environment(),
        'lessonid' => 'alphabet',
        'unitid' => 'alphabet_quiz',
        'userid' => $studentid,
    ]),
];
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/student_workplace.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Workplace');
$PAGE->set_heading('Student Workplace');
$PAGE->add_body_class('pqhsw-page');

echo $OUTPUT->header();
?>
<style>
body.pqhsw-page header,body.pqhsw-page footer,body.pqhsw-page nav.navbar,body.pqhsw-page #page-header,body.pqhsw-page #page-footer,body.pqhsw-page .drawer,body.pqhsw-page .drawer-toggles,body.pqhsw-page .block-region{display:none!important}
body.pqhsw-page #page,body.pqhsw-page #page-content,body.pqhsw-page #region-main,body.pqhsw-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhsw-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqhsw-wrap{max-width:1180px;margin:0 auto}.pqhsw-top,.pqhsw-card{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqhsw-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqhsw-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqhsw-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqhsw-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqhsw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}.pqhsw-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqhsw-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.pqhsw-card h2{margin:0 0 8px;color:#4d3522;font-size:19px;font-weight:950}.pqhsw-card p{margin:0 0 14px;color:#5e7280;font-size:13px;font-weight:780;line-height:1.4}.pqhsw-card-actions{display:flex;gap:8px;flex-wrap:wrap}.pqhsw-card--primary{background:#f4fff2;border-color:rgba(47,111,78,.18)}.pqhsw-card--tools{grid-column:1/-1}.pqhsw-tool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pqhsw-tool-grid .pqhsw-btn{width:100%;min-width:0;text-align:center}@media(max-width:980px){.pqhsw-top,.pqhsw-grid{grid-template-columns:1fr}.pqhsw-actions{justify-content:flex-start}.pqhsw-tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.pqhsw-tool-grid{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css($workspaceid); ?>
/* ============================================================
   Student workplace design system (2026-07-18): same modern
   layer as the dashboard - tokens, blue header band, quiet
   white surfaces, ghost chips, single blue accent.
   ============================================================ */
.pqhsw-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;
  --pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#ffffff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;
  --pqh-primary-ink:#17498f;--pqh-r:14px;
  --pqh-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);
  background:var(--pqh-bg);color:var(--pqh-ink)}
.pqhsw-top.pqh-workspace-top{background:linear-gradient(120deg,#d7e6f9 0%,#e9f1fc 60%,#f3f8fe 100%)!important;border:1px solid #c5d9f1!important;box-shadow:none!important;border-radius:var(--pqh-r)!important;padding:20px 22px!important}
.pqhsw-title,.pqhsw-title.pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqhsw-sub,.pqhsw-sub.pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqhsw-btn,.pqh-workspace-actions a,.pqh-workspace-actions button{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqhsw-btn:hover,.pqh-workspace-actions a:hover,.pqh-workspace-actions button:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
.pqhsw-btn[data-pq-support-action="new"]{background:var(--pqh-primary)!important;border-color:var(--pqh-primary)!important;color:#fff!important}
.pqhsw-card-actions .pqhsw-btn:not(.pqhsw-btn--light){background:var(--pqh-primary)!important;border-color:var(--pqh-primary)!important;color:#fff!important}
.pqhsw-card{background:var(--pqh-surface);border:1px solid var(--pqh-line)!important;border-radius:var(--pqh-r);box-shadow:var(--pqh-shadow)}
.pqhsw-card--primary{background:var(--pqh-tint);border-color:var(--pqh-tint-2)!important}
.pqhsw-card h2{color:var(--pqh-ink);font-size:17px;font-weight:750;letter-spacing:-.01em}
.pqhsw-card p{color:var(--pqh-muted);font-weight:500}
.pqhsw-shell{padding:0 0 56px 76px}
.pqhsw-wrap{padding:24px 24px 0}
.pqh-gnav{position:fixed;left:0;top:0;bottom:0;width:76px;z-index:80;display:flex;flex-direction:column;gap:4px;padding:12px 8px;background:var(--pqh-surface);border-right:1px solid var(--pqh-line);overflow-y:auto}
.pqh-gnav__brand{display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin:0 auto 12px;border-radius:13px;background:linear-gradient(115deg,#2166d1,#4d8be0);color:#fff!important;font:800 15px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-decoration:none!important;box-shadow:0 6px 14px -6px rgba(33,102,209,.5)}
.pqh-gnav__item{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 2px;border:0;border-radius:11px;background:transparent;color:var(--pqh-muted)!important;font:600 10px/1.15 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-align:center;text-decoration:none!important;cursor:pointer}
.pqh-gnav__item svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pqh-gnav__item:hover{background:var(--pqh-tint);color:var(--pqh-primary-ink)!important;text-decoration:none!important}
.pqh-gnav__item.is-active{background:var(--pqh-tint);color:var(--pqh-primary)!important;font-weight:700}
.pqh-gnav__spacer{flex:1}
.pqh-appbar{position:sticky;top:0;z-index:70;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 24px;background:linear-gradient(115deg,#2166d1,#4d8be0);border-bottom:1px solid rgba(255,255,255,.22);box-shadow:0 6px 18px -12px rgba(23,73,143,.5)}
.pqh-appbar__brand{display:flex;align-items:center;gap:10px;color:#fff;font-size:17px;font-weight:800}
.pqh-appbar__mark{width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:#fff;color:#2166d1;font-weight:800}
.pqh-appbar__nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.pqh-appbar__nav a,.pqh-appbar__nav button{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0!important;border-radius:9px;background:transparent!important;color:rgba(255,255,255,.92)!important;font-size:13px;font-weight:650!important;text-decoration:none!important;cursor:pointer;box-shadow:none!important}
.pqh-appbar__nav a:hover,.pqh-appbar__nav button:hover{background:rgba(255,255,255,.18)!important;color:#fff!important}
.pqh-appbar__nav .pqh-appbar__logout{background:#fff!important;color:#17498f!important;font-weight:700!important}
.pqh-appbar__nav .pqh-appbar__logout:hover{background:#e9f1fc!important;color:#0f2237!important}
@media(max-width:900px){.pqhsw-shell{padding-left:0}.pqh-gnav{display:none}.pqh-appbar{flex-wrap:wrap}}
</style>
<main class="pqhsw-shell">
<?php
$pqhswctx = pqh_requested_consumer_context();
$pqhswbrandname = trim((string)($pqhswctx->consumername ?? '')) ?: 'EduPlatform';
$pqhswbrandinitials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $pqhswbrandname) ?: 'EP', 0, 2));
?>
<nav class="pqh-gnav" aria-label="Global navigation">
  <a class="pqh-gnav__brand" href="<?php echo $dashboardurl->out(false); ?>" title="<?php echo s($pqhswbrandname); ?>"><?php echo s($pqhswbrandinitials); ?></a>
  <a class="pqh-gnav__item" href="<?php echo $dashboardurl->out(false); ?>">
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    Dashboard
  </a>
  <a class="pqh-gnav__item is-active" href="<?php echo (new moodle_url('/local/hubredirect/student_workplace.php', ['workspaceid' => $workspaceid]))->out(false); ?>">
    <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    Workplace
  </a>
  <a class="pqh-gnav__item" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', ['workspaceid' => $workspaceid]))->out(false); ?>">
    <svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></svg>
    Live
  </a>
  <span class="pqh-gnav__spacer"></span>
  <a class="pqh-gnav__item" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">
    <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>
    Logout
  </a>
</nav>
<div class="pqh-appbar">
  <div class="pqh-appbar__brand"><span class="pqh-appbar__mark"><?php echo s($pqhswbrandinitials); ?></span><span><?php echo s($pqhswbrandname); ?></span></div>
  <div class="pqh-appbar__nav">
    <a href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
    <a href="<?php echo (new moodle_url('/local/hubredirect/communications.php', ['studentid' => $studentid, 'opencomm' => 'messages']))->out(false); ?>">Messages</a>
    <a href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', ['workspaceid' => $workspaceid]))->out(false); ?>">Live sessions</a>
    <a href="<?php echo (new moodle_url('/local/hubredirect/communications.php', ['studentid' => $studentid, 'opencomm' => 'announcements']))->out(false); ?>">Announcements</a>
    <button type="button" data-pq-support-action="open">Manage tickets</button>
    <button type="button" data-pq-support-action="new">Create a ticket</button>
    <a class="pqh-appbar__logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
  </div>
</div>
  <div class="pqhsw-wrap">
    <section class="pqhsw-top pqh-workspace-top">
      <div>
        <h1 class="pqhsw-title pqh-workspace-title">Student Workplace</h1>
        <p class="pqhsw-sub pqh-workspace-sub"><?php echo s((string)$workspace->name); ?> tasks, lessons, documents, and assigned materials.</p>
      </div>
    </section>
    <section class="pqhsw-grid" aria-label="Student work areas">
      <article class="pqhsw-card pqhsw-card--primary">
        <h2>Homework</h2>
        <p>Open course assignments, submit your work, and review teacher feedback and grades.</p>
        <div class="pqhsw-card-actions"><a class="pqhsw-btn" href="<?php echo $homework->out(false); ?>">Open homework</a></div>
      </article>
      <article class="pqhsw-card pqhsw-card--primary">
        <h2>Lesson Work</h2>
        <p>Continue the current lesson and complete practice steps that update your progress.</p>
        <div class="pqhsw-card-actions">
          <a class="pqhsw-btn" href="<?php echo $lessonurl->out(false); ?>">Continue lesson</a>
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $studenttools['Virtual tutor']->out(false); ?>">Virtual tutor</a>
        </div>
      </article>
      <article class="pqhsw-card">
        <h2>Document Studio</h2>
        <p>Create Word, Excel, PowerPoint, and PDF materials for your course work.</p>
        <div class="pqhsw-card-actions">
          <a class="pqhsw-btn" href="<?php echo $studio->out(false); ?>">Open studio</a>
        </div>
      </article>
      <article class="pqhsw-card">
        <h2>Materials Library</h2>
        <p>Open assigned materials, course resources, and your own student documents.</p>
        <div class="pqhsw-card-actions">
          <a class="pqhsw-btn" href="<?php echo $materials->out(false); ?>">Open library</a>
        </div>
      </article>
      <article class="pqhsw-card">
        <h2>Live Class Work</h2>
        <p>Join live sessions, review the schedule, and check class series work.</p>
        <div class="pqhsw-card-actions">
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', ['workspaceid' => $workspaceid]))->out(false); ?>">Live sessions</a>
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $studenttools['Live schedule']->out(false); ?>">Schedule</a>
        </div>
      </article>
      <article class="pqhsw-card">
        <h2>Submissions</h2>
        <p>Open speak recordings, quiz work, and assigned review tasks.</p>
        <div class="pqhsw-card-actions">
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $studenttools['Speak recordings']->out(false); ?>">Speak recordings</a>
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $studenttools['Quiz report']->out(false); ?>">Quiz work</a>
        </div>
      </article>
      <article class="pqhsw-card">
        <h2>Reviews</h2>
        <p>Check transcripts, reports, and teacher feedback after work is submitted.</p>
        <div class="pqhsw-card-actions">
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $studenttools['Unofficial transcript']->out(false); ?>">Transcript</a>
          <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $studenttools['Managed report']->out(false); ?>">Report</a>
        </div>
      </article>
      <article class="pqhsw-card pqhsw-card--tools">
        <h2>Student Tools</h2>
        <p>Open your live-class, progress, recording, and learning review tools.</p>
        <div class="pqhsw-tool-grid">
          <?php foreach ($studenttools as $label => $toolurl): ?>
            <a class="pqhsw-btn pqhsw-btn--light" href="<?php echo $toolurl->out(false); ?>"><?php echo s($label); ?></a>
          <?php endforeach; ?>
        </div>
      </article>
    </section>
  </div>
</main>
<?php
echo pqh_embedded_support_html($workspaceid, $studentid, 0, 'student_helpdesk', $consumercontext);
echo $OUTPUT->footer();
