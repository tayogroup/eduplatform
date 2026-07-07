<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
$username = trim(optional_param('username', '', PARAM_RAW_TRIMMED));

$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace admins can view transcript resolver diagnostics.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Transcript diagnostics access required'
    );
}

if ($studentid <= 0 && $username !== '') {
    $user = $DB->get_record('user', ['username' => $username, 'deleted' => 0], 'id', IGNORE_MISSING);
    if ($user) {
        $studentid = (int)$user->id;
    }
}

$students = pqco_workspace_students_for_user($workspaceid, (int)$USER->id);
if ($studentid <= 0 && $students) {
    $first = reset($students);
    $studentid = (int)$first->id;
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$payload = $studentid > 0
    ? pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, ['viewerid' => (int)$USER->id, 'include_internal' => true])
    : null;

$pageparams = $urlparams;
if ($studentid > 0) {
    $pageparams['studentid'] = $studentid;
}
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_transcript_debug.php', $pageparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Transcript Resolver Diagnostics');
$PAGE->set_heading('Transcript Resolver Diagnostics');
$PAGE->add_body_class('pqctd-page');

echo $OUTPUT->header();
?>
<style>
body.pqctd-page header,body.pqctd-page footer,body.pqctd-page nav.navbar,body.pqctd-page #page-header,body.pqctd-page #page-footer,body.pqctd-page .drawer,body.pqctd-page .drawer-toggles,body.pqctd-page .block-region,body.pqctd-page [data-region="drawer"],body.pqctd-page [data-region="right-hand-drawer"]{display:none!important}
body.pqctd-page #page,body.pqctd-page #page-content,body.pqctd-page #region-main,body.pqctd-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqctd-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqctd-wrap{max-width:1280px;margin:0 auto}.pqctd-top,.pqctd-panel,.pqctd-filter{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqctd-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqctd-panel{margin-bottom:14px}.pqctd-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqctd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqctd-actions{display:flex;gap:8px;flex-wrap:wrap}.pqctd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqctd-filter{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;margin-bottom:14px}.pqctd-field label{display:block;margin-bottom:5px;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqctd-select,.pqctd-input{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800}.pqctd-table{width:100%;border-collapse:collapse}.pqctd-table th,.pqctd-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqctd-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqctd-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqctd-pill--blocker{background:#ffe9e9;color:#8a2020}.pqctd-pill--warning{background:#fff4dc;color:#7a5637}.pqctd-pre{white-space:pre-wrap;overflow:auto;max-height:680px;margin:0;padding:14px;border-radius:8px;background:#102033;color:#eaf3ff;font-size:12px;line-height:1.45}.pqctd-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
</style>
<main class="pqctd-shell"><div class="pqctd-wrap">
  <section class="pqctd-top">
    <div>
      <h1 class="pqctd-title"><?php echo s($workspace->name); ?> Transcript Resolver</h1>
      <p class="pqctd-sub">Admin-only Phase 1 diagnostic preview. This does not issue, store, or export official transcripts.</p>
    </div>
    <nav class="pqctd-actions">
      <a class="pqctd-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_student_history.php', $urlparams))->out(false); ?>">Course history</a>
      <a class="pqctd-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
    </nav>
  </section>

  <form class="pqctd-filter" method="get">
    <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
    <div class="pqctd-field">
      <label>Student</label>
      <select class="pqctd-select" name="studentid">
        <?php foreach ($students as $student): ?>
          <option value="<?php echo (int)$student->id; ?>" <?php echo (int)$student->id === $studentid ? 'selected' : ''; ?>>
            <?php echo s(fullname($student) . ' - ' . pqh_account_no_label($student, 'Account No. missing')); ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>
    <button class="pqctd-btn" type="submit">Resolve</button>
  </form>

  <?php if (!$payload): ?>
    <section class="pqctd-panel"><div class="pqctd-empty">No active workspace students were found for transcript diagnostics.</div></section>
  <?php else: ?>
    <section class="pqctd-panel">
      <h2>Summary</h2>
      <p>
        <span class="pqctd-pill">Lines: <?php echo (int)$payload['summary']['line_count']; ?></span>
        <span class="pqctd-pill">Warnings: <?php echo (int)$payload['summary']['warning_count']; ?></span>
        <span class="pqctd-pill pqctd-pill--blocker">Blockers: <?php echo (int)$payload['summary']['blocker_count']; ?></span>
        <span class="pqctd-pill">Viewer role: <?php echo s((string)$payload['permission']['viewer_role']); ?></span>
      </p>
    </section>

    <section class="pqctd-panel">
      <h2>Course Lines</h2>
      <?php if (!$payload['lines']): ?><div class="pqctd-empty">No transcript course lines resolved for this student.</div><?php else: ?>
        <table class="pqctd-table">
          <thead><tr><th>Course</th><th>Status</th><th>Dates</th><th>Evidence</th><th>Warnings</th></tr></thead>
          <tbody>
          <?php foreach ($payload['lines'] as $line): ?>
            <tr>
              <td><?php echo s((string)$line['course']['title']); ?><br><span class="pqctd-pill"><?php echo s((string)$line['course']['key']); ?></span><span class="pqctd-pill">Moodle #<?php echo (int)$line['course']['moodlecourseid']; ?></span></td>
              <td><span class="pqctd-pill"><?php echo s((string)$line['status']['normalized']); ?></span><br><span class="pqctd-pill"><?php echo s((string)$line['status']['local']); ?></span></td>
              <td>Requested: <?php echo !empty($line['dates']['requestedat']) ? s(userdate((int)$line['dates']['requestedat'], get_string('strftimedatetimeshort'))) : ''; ?><br>Approved: <?php echo !empty($line['dates']['approvedat']) ? s(userdate((int)$line['dates']['approvedat'], get_string('strftimedatetimeshort'))) : ''; ?></td>
              <td>Grade: <?php echo !empty($line['grade']['recorded']) ? s((string)$line['grade']['percentage']) . '%' : 'not recorded'; ?><br>Completion: <?php echo s((string)$line['completion']['moodle']['status']); ?><br>Progress: <?php echo $line['completion']['local_progress']['completion_percent'] !== null ? (int)$line['completion']['local_progress']['completion_percent'] . '%' : 'not recorded'; ?></td>
              <td>
                <?php foreach ($line['warnings'] as $warning): ?>
                  <span class="pqctd-pill pqctd-pill--<?php echo s((string)$warning['severity']); ?>"><?php echo s((string)$warning['code']); ?></span>
                <?php endforeach; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>

    <section class="pqctd-panel">
      <h2>Warnings</h2>
      <?php if (!$payload['warnings']): ?><div class="pqctd-empty">No warnings returned.</div><?php else: ?>
        <table class="pqctd-table"><thead><tr><th>Severity</th><th>Code</th><th>Message</th><th>Action</th></tr></thead><tbody>
        <?php foreach ($payload['warnings'] as $warning): ?>
          <tr><td><span class="pqctd-pill pqctd-pill--<?php echo s((string)$warning['severity']); ?>"><?php echo s((string)$warning['severity']); ?></span></td><td><?php echo s((string)$warning['code']); ?></td><td><?php echo s((string)$warning['message']); ?></td><td><?php echo s((string)$warning['recommended_action']); ?></td></tr>
        <?php endforeach; ?>
        </tbody></table>
      <?php endif; ?>
    </section>

    <section class="pqctd-panel">
      <h2>Raw Payload</h2>
      <pre class="pqctd-pre"><?php echo s(json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)); ?></pre>
    </section>
  <?php endif; ?>
</div></main>
<?php
echo $OUTPUT->footer();
