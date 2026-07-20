<?php
declare(strict_types=1);

// SEB exam results (Phase 3): per-student attempt status, timing, and
// integrity for one exam, with quiz-report deep links where the content is a
// known unit, attempt reset for interrupted students, and CSV export.
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$examid = required_param('examid', PARAM_INT);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');

if (!pqh_seb_tables_ready()) {
    pqh_access_denied('The exam tables are not installed yet. Please ask support to run the SEB exam SQL.', $dashboardurl, 'Exams not ready');
}
$exam = pqh_seb_exam_record($examid);
if (!$exam) {
    pqh_access_denied('This exam does not exist.', $dashboardurl, 'Exam unavailable');
}
if (!pqh_seb_can_manage($exam, (int)$USER->id)) {
    pqh_access_denied('Only the exam creator and workspace managers can view results.', $dashboardurl, 'Exam results access required');
}

$selfurl = pqh_seb_results_url($examid);
$manageurl = pqh_seb_manage_url((int)$exam->workspaceid);

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'resetattempt') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reload the results page and try again.', $selfurl, 'Exam action expired');
    }
    pqh_seb_attempt_reset($exam, optional_param('studentid', 0, PARAM_INT));
    redirect(new moodle_url($selfurl, ['reset' => 1]));
}

$results = pqh_seb_exam_results($exam);

$statuslabel = static function(?stdClass $attempt): string {
    if (!$attempt) {
        return 'Not started';
    }
    if ((string)$attempt->status === 'finished') {
        return 'Submitted';
    }
    if ((string)$attempt->status === 'expired') {
        return 'Time expired';
    }
    return 'In progress';
};
$elapsed = static function(?stdClass $attempt): string {
    if (!$attempt || (int)$attempt->timestarted <= 0) {
        return '-';
    }
    $end = (int)$attempt->timefinished > 0 ? (int)$attempt->timefinished : time();
    $seconds = max(0, $end - (int)$attempt->timestarted);
    return floor($seconds / 60) . 'm ' . ($seconds % 60) . 's';
};

if (optional_param('action', '', PARAM_ALPHANUMEXT) === 'export') {
    require_sesskey();
    pqh_seb_audit('seb_results_exported', $examid);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="exam-' . $examid . '-results.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Exam', (string)$exam->title]);
    fputcsv($out, ['Student', 'Status', 'Started', 'Finished', 'Elapsed', 'SEB verified']);
    foreach ($results as $row) {
        $attempt = $row->attempt;
        fputcsv($out, [
            $row->name,
            $statuslabel($attempt),
            $attempt && (int)$attempt->timestarted > 0 ? userdate((int)$attempt->timestarted, get_string('strftimedatetimeshort')) : '',
            $attempt && (int)$attempt->timefinished > 0 ? userdate((int)$attempt->timefinished, get_string('strftimedatetimeshort')) : '',
            $elapsed($attempt),
            $attempt ? ((int)$attempt->sebverified === 1 ? 'yes' : 'no') : '',
        ]);
    }
    fclose($out);
    exit;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url($selfurl);
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Exam results');
$PAGE->set_heading('Exam results');
$PAGE->add_body_class('pqsr-page');

$submitted = 0;
$expired = 0;
foreach ($results as $row) {
    if ($row->attempt && (string)$row->attempt->status === 'finished') {
        $submitted++;
    }
    if ($row->attempt && (string)$row->attempt->status === 'expired') {
        $expired++;
    }
}
$windowline = 'Any time';
if ((int)$exam->window_start > 0) {
    $windowline = userdate((int)$exam->window_start, get_string('strftimedatetimeshort'))
        . ((int)$exam->window_end > 0 ? ' - ' . userdate((int)$exam->window_end, get_string('strftimedatetimeshort')) : '');
}

echo $OUTPUT->header();
?>
<style>
<?php echo pqh_design_system_css('.pqsr-shell'); ?>
<?php echo pqh_design_shell_css('.pqsr-shell'); ?>
.pqsr-wrap{max-width:1100px;margin:0 auto;padding:26px 24px 60px;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqsr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin:0 0 16px;flex-wrap:wrap}
.pqsr-head h1{margin:0 0 4px;color:var(--pqh-ink);font-size:24px;font-weight:800;letter-spacing:-.02em}
.pqsr-head p{margin:0;color:var(--pqh-muted);font-weight:500;font-size:13.5px}
.pqsr-actions{display:flex;gap:8px;flex-wrap:wrap}
.pqsr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 13px;border:0;border-radius:10px;background:var(--pqh-primary);color:#fff!important;text-decoration:none!important;font-size:13px;font-weight:650;cursor:pointer}
.pqsr-btn--light{background:var(--pqh-surface);color:var(--pqh-ink)!important;border:1px solid var(--pqh-line)}
.pqsr-btn--light:hover{background:var(--pqh-tint)}
.pqsr-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 16px}
.pqsr-stat{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:12px;padding:13px 14px}
.pqsr-stat strong{display:block;color:var(--pqh-ink);font-size:23px;font-weight:750;letter-spacing:-.02em}
.pqsr-stat span{display:block;margin-top:3px;color:var(--pqh-faint);font-size:11px;font-weight:650;text-transform:uppercase;letter-spacing:.05em}
.pqsr-card{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);padding:6px 16px 14px;overflow-x:auto}
.pqsr-table{width:100%;border-collapse:collapse}
.pqsr-table th{padding:11px 10px;color:var(--pqh-faint);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:left;border-bottom:1px solid var(--pqh-line)}
.pqsr-table td{padding:10px;border-bottom:1px solid var(--pqh-line);font-size:13px;font-weight:550;color:var(--pqh-ink);vertical-align:middle}
.pqsr-table tr:last-child td{border-bottom:0}
.pqsr-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 9px;border-radius:8px;font-size:11.5px;font-weight:650}
.pqsr-pill--done{background:var(--pqh-primary);color:#fff}
.pqsr-pill--progress{background:var(--pqh-tint);color:var(--pqh-primary-ink)}
.pqsr-pill--expired{background:#fdeeee;color:#b3453e}
.pqsr-pill--none{background:#eef1f5;color:var(--pqh-muted)}
.pqsr-pill--seb{background:var(--pqh-tint);color:var(--pqh-primary-ink)}
.pqsr-muted{color:var(--pqh-muted)}
.pqsr-alert{margin:0 0 14px;padding:11px 13px;border-radius:11px;background:var(--pqh-tint);border:1px solid var(--pqh-tint-2);color:var(--pqh-primary-ink);font-size:13px;font-weight:550}
</style>
<main class="pqsr-shell">
<?php echo pqh_design_shell_html('pqsr-shell', '', ['title' => 'Exam results']); ?>
  <div class="pqsr-wrap">
    <div class="pqsr-head">
      <div>
        <h1><?php echo s((string)$exam->title); ?></h1>
        <p><?php echo (int)$exam->duration_minutes; ?> minutes · <?php echo s($windowline); ?></p>
      </div>
      <div class="pqsr-actions">
        <a class="pqsr-btn pqsr-btn--light" href="<?php echo $manageurl->out(false); ?>">Exam manager</a>
        <a class="pqsr-btn pqsr-btn--light" href="<?php echo pqh_seb_exam_url($examid)->out(false); ?>">Exam page</a>
        <a class="pqsr-btn" href="<?php echo (new moodle_url($selfurl, ['action' => 'export', 'sesskey' => sesskey()]))->out(false); ?>">Export CSV</a>
      </div>
    </div>
    <?php if (optional_param('reset', 0, PARAM_INT) > 0): ?><div class="pqsr-alert">Attempt reset. The student can start the exam again.</div><?php endif; ?>
    <div class="pqsr-stats">
      <div class="pqsr-stat"><strong><?php echo count($results); ?></strong><span>assigned</span></div>
      <div class="pqsr-stat"><strong><?php echo $submitted; ?></strong><span>submitted</span></div>
      <div class="pqsr-stat"><strong><?php echo $expired; ?></strong><span>time expired</span></div>
      <div class="pqsr-stat"><strong><?php echo count($results) - $submitted - $expired; ?></strong><span>outstanding</span></div>
    </div>
    <div class="pqsr-card">
      <table class="pqsr-table">
        <thead><tr><th>Student</th><th>Status</th><th>Started</th><th>Finished</th><th>Elapsed</th><th>Integrity</th><th>Actions</th></tr></thead>
        <tbody>
        <?php foreach ($results as $row): ?>
          <?php
            $attempt = $row->attempt;
            $label = $statuslabel($attempt);
            $pillclass = 'pqsr-pill--none';
            if ($label === 'Submitted') { $pillclass = 'pqsr-pill--done'; }
            if ($label === 'In progress') { $pillclass = 'pqsr-pill--progress'; }
            if ($label === 'Time expired') { $pillclass = 'pqsr-pill--expired'; }
            $reporturl = pqh_seb_quizreport_url($exam, (int)$row->studentid);
          ?>
          <tr>
            <td><?php echo s($row->name); ?></td>
            <td><span class="pqsr-pill <?php echo $pillclass; ?>"><?php echo s($label); ?></span></td>
            <td class="pqsr-muted"><?php echo $attempt && (int)$attempt->timestarted > 0 ? userdate((int)$attempt->timestarted, get_string('strftimedatetimeshort')) : '-'; ?></td>
            <td class="pqsr-muted"><?php echo $attempt && (int)$attempt->timefinished > 0 ? userdate((int)$attempt->timefinished, get_string('strftimedatetimeshort')) : '-'; ?></td>
            <td class="pqsr-muted"><?php echo s($elapsed($attempt)); ?></td>
            <td><?php echo $attempt ? ((int)$attempt->sebverified === 1 ? '<span class="pqsr-pill pqsr-pill--seb">SEB verified</span>' : '<span class="pqsr-pill pqsr-pill--expired">Unverified</span>') : '-'; ?></td>
            <td>
              <?php if ($reporturl && $attempt): ?><a class="pqsr-btn pqsr-btn--light" href="<?php echo $reporturl->out(false); ?>">Quiz report</a><?php endif; ?>
              <?php if ($attempt): ?>
                <form method="post" style="display:inline" onsubmit="return confirm('Reset this attempt so the student can start again? The current attempt record is removed (the action is audited).');">
                  <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                  <input type="hidden" name="action" value="resetattempt">
                  <input type="hidden" name="studentid" value="<?php echo (int)$row->studentid; ?>">
                  <button class="pqsr-btn pqsr-btn--light" type="submit">Reset attempt</button>
                </form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$results): ?>
          <tr><td colspan="7" class="pqsr-muted">No students are assigned to this exam.</td></tr>
        <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</main>
<?php
echo $OUTPUT->footer();
