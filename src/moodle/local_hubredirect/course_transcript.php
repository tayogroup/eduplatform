<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

function pqctui_status_label(string $status): string {
    $status = trim($status);
    return $status === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $status));
}

function pqctui_date(int $timestamp): string {
    return $timestamp > 0 ? userdate($timestamp, get_string('strftimedate')) : 'Not recorded';
}

function pqctui_short_date(int $timestamp): string {
    return $timestamp > 0 ? userdate($timestamp, get_string('strftimedateshort')) : '';
}

function pqctui_percent($value): string {
    return is_numeric($value) ? format_float((float)$value, 1) . '%' : 'Not recorded';
}

function pqctui_filter_timestamp(string $date, bool $endofday = false): int {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return 0;
    }
    $time = strtotime($date . ($endofday ? ' 23:59:59' : ' 00:00:00'));
    return $time ? (int)$time : 0;
}

function pqctui_course_filter_value(array $line): string {
    $course = $line['course'] ?? [];
    $key = trim((string)($course['key'] ?? ''));
    return $key !== '' ? 'key:' . $key : 'offering:' . (int)($line['offeringid'] ?? 0);
}

function pqctui_line_reference_timestamp(array $line): int {
    $course = $line['course'] ?? [];
    $dates = $line['dates'] ?? [];
    foreach ([
        (int)($course['startdate'] ?? 0),
        (int)($dates['moodle_timestart'] ?? 0),
        (int)($dates['moodleenrolledat'] ?? 0),
        (int)($dates['approvedat'] ?? 0),
        (int)($dates['requestedat'] ?? 0),
    ] as $timestamp) {
        if ($timestamp > 0) {
            return $timestamp;
        }
    }
    return 0;
}

function pqctui_warning_class(string $severity): string {
    return $severity === 'blocker' ? 'pqct-warn--blocker' : 'pqct-warn--warning';
}

global $DB, $OUTPUT, $PAGE, $USER;

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
$statusfilter = trim(optional_param('status', '', PARAM_TEXT));
$coursefilter = trim(optional_param('course', '', PARAM_TEXT));
$fromdate = trim(optional_param('from', '', PARAM_TEXT));
$todate = trim(optional_param('to', '', PARAM_TEXT));

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0) {
    pqh_access_denied('Choose an institution workspace before opening an unofficial transcript.', new moodle_url('/local/hubredirect/dashboard.php', $baseparams), 'Workspace required');
}

$students = pqct_students_for_transcript_viewer((int)$USER->id, $workspaceid);
if ($studentid <= 0 && $students) {
    $studentid = (int)array_key_first($students);
}

$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$canview = $studentid > 0 && pqct_user_can_view_student_transcript((int)$USER->id, $studentid, $workspaceid);
if (!$canview) {
    pqh_access_denied('You can only view unofficial transcripts for your own, linked, assigned, or managed students.', new moodle_url('/local/hubredirect/dashboard.php', $baseparams), 'Transcript access required');
}

$payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
    'viewerid' => (int)$USER->id,
    'include_internal' => false,
]);
pqco_course_audit('transcript_preview_viewed', 'student', $studentid, [
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'studentid' => $studentid,
    'warning_count' => (int)($payload['summary']['warning_count'] ?? 0),
    'blocker_count' => (int)($payload['summary']['blocker_count'] ?? 0),
]);
$header = $payload['header'] ?? [];
$student = $header['student'] ?? [];
$workspace = $header['workspace'] ?? [];
$consumer = $header['consumer'] ?? [];
$policyheader = $header['policy'] ?? [];
$lines = $payload['lines'] ?? [];
$fromts = pqctui_filter_timestamp($fromdate);
$tots = pqctui_filter_timestamp($todate, true);

$statusoptions = [];
$courseoptions = [];
foreach ($lines as $line) {
    $status = (string)($line['status']['normalized'] ?? '');
    if ($status !== '') {
        $statusoptions[$status] = pqctui_status_label($status);
    }
    $coursevalue = pqctui_course_filter_value($line);
    $coursetitle = (string)($line['course']['title'] ?? '');
    if ($coursevalue !== '' && $coursetitle !== '') {
        $courseoptions[$coursevalue] = $coursetitle;
    }
}
asort($statusoptions);
asort($courseoptions);

$filteredlines = array_values(array_filter($lines, static function(array $line) use ($statusfilter, $coursefilter, $fromts, $tots): bool {
    if ($statusfilter !== '' && (string)($line['status']['normalized'] ?? '') !== $statusfilter) {
        return false;
    }
    if ($coursefilter !== '' && pqctui_course_filter_value($line) !== $coursefilter) {
        return false;
    }
    $reference = pqctui_line_reference_timestamp($line);
    if ($fromts > 0 && ($reference <= 0 || $reference < $fromts)) {
        return false;
    }
    if ($tots > 0 && ($reference <= 0 || $reference > $tots)) {
        return false;
    }
    return true;
}));

$pageparams = $baseparams + ['studentid' => $studentid];
$clearurl = pqct_transcript_url($studentid, $workspaceid, $consumercontext);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_transcript.php', $pageparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Unofficial Transcript');
$PAGE->set_heading('Unofficial Transcript');
$PAGE->add_body_class('pqct-page');

echo $OUTPUT->header();
?>
<style>
body.pqct-page header,body.pqct-page footer,body.pqct-page nav.navbar,body.pqct-page #page-header,body.pqct-page #page-footer,body.pqct-page .drawer,body.pqct-page .drawer-toggles,body.pqct-page .block-region,body.pqct-page [data-region="drawer"],body.pqct-page [data-region="right-hand-drawer"]{display:none!important}
body.pqct-page #page,body.pqct-page #page-content,body.pqct-page #region-main,body.pqct-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqct-shell{min-height:100vh;padding:28px 18px 56px;background:#f5f7f9;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqct-wrap{max-width:1320px;margin:0 auto}.pqct-top,.pqct-panel,.pqct-filter,.pqct-line{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqct-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start;padding:20px;margin-bottom:14px}.pqct-kicker{margin:0 0 6px;color:#6f4e32;font-size:12px;font-weight:950;text-transform:uppercase}.pqct-title{margin:0;color:#221b22;font-size:30px;line-height:1.1;font-weight:950}.pqct-sub{margin:8px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqct-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqct-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqct-btn--primary{background:#2f7d4f;color:#fff!important}.pqct-filter{display:grid;grid-template-columns:1.2fr 1fr .8fr .8fr auto auto;gap:10px;align-items:end;padding:16px;margin-bottom:14px}.pqct-field label{display:block;margin-bottom:5px;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqct-input{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800}.pqct-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqct-stat{padding:14px;border-radius:8px;background:#fff;border:1px solid rgba(23,48,68,.12)}.pqct-stat strong{display:block;color:#221b22;font-size:24px;font-weight:950}.pqct-stat span{display:block;margin-top:3px;color:#647887;font-size:12px;font-weight:900}.pqct-panel{padding:18px;margin-bottom:14px}.pqct-panel h2{margin:0 0 12px;color:#221b22;font-size:19px;font-weight:950}.pqct-student{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.pqct-meta{padding:12px;border-radius:8px;background:#f7fafb}.pqct-meta span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqct-meta strong{display:block;margin-top:4px;color:#173044;font-size:14px;font-weight:950;overflow-wrap:anywhere}.pqct-warning-list{display:grid;gap:8px}.pqct-warn{padding:10px 12px;border-radius:8px;border:1px solid rgba(23,48,68,.12);background:#fffaf2;color:#50370f}.pqct-warn--blocker{background:#fff2f2;color:#702222}.pqct-warn strong{display:block;font-size:13px;font-weight:950}.pqct-warn span{display:block;margin-top:3px;font-size:12px;font-weight:800}.pqct-lines{display:grid;gap:10px}.pqct-line{padding:16px}.pqct-line-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.pqct-course{margin:0;color:#221b22;font-size:18px;font-weight:950}.pqct-course-sub{margin:4px 0 0;color:#647887;font-size:12px;font-weight:850}.pqct-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:999px;background:#eaf4ed;color:#235f3d;font-size:12px;font-weight:950}.pqct-line-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}.pqct-line-cell{min-height:74px;padding:10px;border-radius:8px;background:#f7fafb}.pqct-line-cell span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqct-line-cell strong{display:block;margin-top:5px;color:#173044;font-size:13px;font-weight:950;overflow-wrap:anywhere}.pqct-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;background:#fff;color:#5e7280;font-weight:900}.pqct-admin{font-size:12px;color:#415363}.pqct-admin code{font-size:12px}.pqct-admin table{width:100%;border-collapse:collapse}.pqct-admin th,.pqct-admin td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}.pqct-admin th{background:#f2f6f8;font-size:11px;text-transform:uppercase}
@media(max-width:980px){.pqct-top,.pqct-filter,.pqct-student,.pqct-line-grid{grid-template-columns:1fr}.pqct-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pqct-actions{justify-content:flex-start}}
@media(max-width:560px){.pqct-shell{padding:18px 12px 42px}.pqct-grid{grid-template-columns:1fr}.pqct-title{font-size:25px}.pqct-line-head{grid-template-columns:1fr}}
</style>
<main class="pqct-shell"><div class="pqct-wrap">
  <section class="pqct-top">
    <div>
      <p class="pqct-kicker">Unofficial Transcript</p>
      <h1 class="pqct-title"><?php echo s((string)($student['name'] ?? 'Student')); ?></h1>
      <p class="pqct-sub">Live course record for <?php echo s((string)($workspace['name'] ?? 'this workspace')); ?>. This preview is not an issued official transcript.</p>
    </div>
    <nav class="pqct-actions">
      <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $baseparams))->out(false); ?>">Course catalog</a>
      <?php if ($canmanage): ?>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_student_history.php', $baseparams + ['studentid' => $studentid]))->out(false); ?>">Course history</a>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams))->out(false); ?>">Readiness</a>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['studentid' => $studentid]))->out(false); ?>">Official draft</a>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid]))->out(false); ?>">Controls</a>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['studentid' => $studentid, 'type' => 'unofficial', 'format' => 'csv']))->out(false); ?>">CSV</a>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/transcript_policy.php', $baseparams))->out(false); ?>">Transcript policy</a>
        <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_debug.php', $baseparams + ['studentid' => $studentid]))->out(false); ?>">Diagnostics</a>
      <?php endif; ?>
      <a class="pqct-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['studentid' => $studentid, 'type' => 'unofficial', 'format' => 'pdf']))->out(false); ?>">PDF</a>
      <a class="pqct-btn pqct-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', $baseparams))->out(false); ?>">Dashboard</a>
    </nav>
  </section>

  <section class="pqct-panel">
    <h2>Student Record</h2>
    <div class="pqct-student">
      <div class="pqct-meta"><span>Student</span><strong><?php echo s((string)($student['name'] ?? '')); ?></strong></div>
      <div class="pqct-meta"><span>Account No.</span><strong><?php echo s((string)($student['account_no'] ?? 'Not recorded')); ?></strong></div>
      <div class="pqct-meta"><span>Institution</span><strong><?php echo s((string)($consumer['name'] ?? '')); ?></strong></div>
      <div class="pqct-meta"><span>Generated</span><strong><?php echo s(userdate((int)($header['generated_at'] ?? time()), get_string('strftimedatetimeshort'))); ?></strong></div>
      <div class="pqct-meta"><span>Policy</span><strong><?php echo s(ucwords((string)($policyheader['source'] ?? 'default'))); ?> / v<?php echo (int)($policyheader['version'] ?? 1); ?></strong></div>
      <div class="pqct-meta"><span>Policy Hash</span><strong><?php echo s(substr((string)($policyheader['hash'] ?? ''), 0, 16)); ?></strong></div>
    </div>
  </section>

  <form class="pqct-filter" method="get">
    <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
    <div class="pqct-field">
      <label>Student</label>
      <select class="pqct-input" name="studentid" <?php echo count($students) <= 1 ? 'disabled' : ''; ?>>
        <?php foreach ($students as $option): ?>
          <option value="<?php echo (int)$option->id; ?>" <?php echo (int)$option->id === $studentid ? 'selected' : ''; ?>><?php echo s(fullname($option)); ?></option>
        <?php endforeach; ?>
      </select>
      <?php if (count($students) <= 1): ?><input type="hidden" name="studentid" value="<?php echo (int)$studentid; ?>"><?php endif; ?>
    </div>
    <div class="pqct-field">
      <label>Course</label>
      <select class="pqct-input" name="course">
        <option value="">All courses</option>
        <?php foreach ($courseoptions as $value => $label): ?>
          <option value="<?php echo s($value); ?>" <?php echo $value === $coursefilter ? 'selected' : ''; ?>><?php echo s($label); ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="pqct-field">
      <label>Status</label>
      <select class="pqct-input" name="status">
        <option value="">All statuses</option>
        <?php foreach ($statusoptions as $value => $label): ?>
          <option value="<?php echo s($value); ?>" <?php echo $value === $statusfilter ? 'selected' : ''; ?>><?php echo s($label); ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="pqct-field"><label>From</label><input class="pqct-input" type="date" name="from" value="<?php echo s($fromdate); ?>"></div>
    <div class="pqct-field"><label>To</label><input class="pqct-input" type="date" name="to" value="<?php echo s($todate); ?>"></div>
    <button class="pqct-btn pqct-btn--primary" type="submit">Apply</button>
    <a class="pqct-btn" href="<?php echo $clearurl->out(false); ?>">Clear</a>
  </form>

  <section class="pqct-grid" aria-label="Transcript summary">
    <div class="pqct-stat"><strong><?php echo count($lines); ?></strong><span>total course lines</span></div>
    <div class="pqct-stat"><strong><?php echo count($filteredlines); ?></strong><span>shown after filters</span></div>
    <div class="pqct-stat"><strong><?php echo (int)($payload['summary']['warning_count'] ?? 0); ?></strong><span>warnings</span></div>
    <div class="pqct-stat"><strong><?php echo (int)($payload['summary']['blocker_count'] ?? 0); ?></strong><span>blockers before official issue</span></div>
  </section>

  <?php if (!empty($payload['warnings'])): ?>
    <section class="pqct-panel">
      <h2>Transcript Warnings</h2>
      <div class="pqct-warning-list">
        <?php foreach (array_slice($payload['warnings'], 0, 10) as $warning): ?>
          <div class="pqct-warn <?php echo s(pqctui_warning_class((string)($warning['severity'] ?? 'warning'))); ?>">
            <strong><?php echo s((string)($warning['message'] ?? 'Transcript warning')); ?></strong>
            <?php if (!empty($warning['recommended_action'])): ?><span><?php echo s((string)$warning['recommended_action']); ?></span><?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
    </section>
  <?php endif; ?>

  <section class="pqct-panel">
    <h2>Course Lines</h2>
    <?php if (!$filteredlines): ?>
      <div class="pqct-empty">No transcript course lines match the current filters.</div>
    <?php else: ?>
      <div class="pqct-lines">
        <?php foreach ($filteredlines as $line): ?>
          <?php
            $course = $line['course'] ?? [];
            $dates = $line['dates'] ?? [];
            $grade = $line['grade'] ?? [];
            $completion = $line['completion'] ?? [];
            $attendance = $line['attendance'] ?? [];
            $display = $line['display'] ?? [];
            $enrollmentdate = (int)($dates['moodleenrolledat'] ?? 0);
            if ($enrollmentdate <= 0) {
                $enrollmentdate = (int)($dates['approvedat'] ?? 0);
            }
            if ($enrollmentdate <= 0) {
                $enrollmentdate = (int)($dates['requestedat'] ?? 0);
            }
            $teachers = array_map(static function(array $teacher): string {
                return (string)($teacher['name'] ?? '');
            }, $line['teachers'] ?? []);
            $teachers = array_filter($teachers);
          ?>
          <article class="pqct-line">
            <div class="pqct-line-head">
              <div>
                <h3 class="pqct-course"><?php echo s((string)($course['title'] ?? 'Course')); ?></h3>
                <p class="pqct-course-sub"><?php echo s((string)($course['key'] ?? '')); ?><?php if (!empty($course['moodle_shortname'])): ?> / <?php echo s((string)$course['moodle_shortname']); ?><?php endif; ?></p>
              </div>
              <span class="pqct-pill"><?php echo s(pqctui_status_label((string)($line['status']['normalized'] ?? 'unknown'))); ?></span>
            </div>
            <div class="pqct-line-grid">
              <div class="pqct-line-cell"><span>Course Dates</span><strong><?php echo s(pqctui_short_date((int)($course['startdate'] ?? 0)) ?: 'Not recorded'); ?><?php if ((int)($course['enddate'] ?? 0) > 0): ?> to <?php echo s(pqctui_short_date((int)$course['enddate'])); ?><?php endif; ?></strong></div>
              <div class="pqct-line-cell"><span>Enrollment</span><strong><?php echo s(pqctui_date($enrollmentdate)); ?></strong></div>
              <div class="pqct-line-cell"><span>Grade</span><strong><?php echo s((string)($display['grade'] ?? (!empty($grade['recorded']) ? pqctui_percent($grade['percentage']) : 'Not recorded'))); ?></strong></div>
              <div class="pqct-line-cell"><span>Completion</span><strong><?php echo s((string)($display['completion'] ?? 'Not recorded')); ?></strong></div>
              <div class="pqct-line-cell"><span>Attendance</span><strong><?php echo s((string)($display['attendance'] ?? ((int)($attendance['sessions'] ?? 0) . ' sessions'))); ?></strong></div>
              <div class="pqct-line-cell"><span>Quiz</span><strong><?php echo !empty($quiz['recorded']) ? s(pqctui_percent($quiz['best_percentage'] ?? null)) : 'Not recorded'; ?></strong></div>
              <div class="pqct-line-cell"><span>Teacher Of Record</span><strong><?php echo s($teachers ? implode(', ', $teachers) : 'Not recorded'); ?></strong></div>
              <div class="pqct-line-cell"><span>Local Status</span><strong><?php echo s(pqctui_status_label((string)($line['status']['local'] ?? 'unknown'))); ?></strong></div>
              <div class="pqct-line-cell"><span>Warnings</span><strong><?php echo count($line['warnings'] ?? []); ?></strong></div>
              <div class="pqct-line-cell"><span>Source</span><strong>Live course enrollment</strong></div>
            </div>
          </article>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </section>

  <?php if ($canmanage): ?>
    <section class="pqct-panel pqct-admin">
      <h2>Admin Diagnostics</h2>
      <table>
        <thead><tr><th>Course</th><th>Source IDs</th><th>Warning Codes</th></tr></thead>
        <tbody>
          <?php foreach ($filteredlines as $line): ?>
            <tr>
              <td><?php echo s((string)($line['course']['title'] ?? 'Course')); ?></td>
              <td><code>request <?php echo (int)($line['requestid'] ?? 0); ?> / offering <?php echo (int)($line['offeringid'] ?? 0); ?> / moodle <?php echo (int)($line['course']['moodlecourseid'] ?? 0); ?></code></td>
              <td><?php echo s(implode(', ', array_map(static function(array $warning): string { return (string)($warning['code'] ?? 'warning'); }, $line['warnings'] ?? [])) ?: 'none'); ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  <?php endif; ?>
</div></main>
<?php
echo $OUTPUT->footer();
