<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

function pqtc_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : '';
}

function pqtc_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}

global $DB, $OUTPUT, $PAGE, $USER;

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
$documentid = trim(optional_param('documentid', '', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHA);
$message = optional_param('saved', 0, PARAM_INT) ? 'Transcript control saved.' : '';
$error = '';

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace admins can manage transcript controls.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Transcript controls access required');
}
if ($studentid <= 0 && $documentid !== '') {
    $doc = pqct_load_official_transcript_doc($documentid, (int)$USER->id);
    if ($doc) {
        $studentid = (int)$doc->studentid;
    }
}
if ($studentid <= 0) {
    $students = pqct_students_for_transcript_viewer((int)$USER->id, $workspaceid);
    if ($students) {
        $studentid = (int)array_key_first($students);
    }
}
if ($studentid <= 0 || !pqct_user_can_view_student_transcript((int)$USER->id, $studentid, $workspaceid)) {
    pqh_access_denied('Choose a valid managed student before opening transcript controls.', new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams), 'Student transcript access required');
}

$student = core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber,deleted', MUST_EXIST);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen transcript controls and try again.', new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid]), 'Transcript controls form expired');
    }
    try {
        if ($action === 'hold') {
            pqct_create_transcript_hold($studentid, $workspaceid, (int)$USER->id, optional_param('holdtype', 'registrar', PARAM_TEXT), required_param('reason', PARAM_TEXT));
        } else if ($action === 'resolvehold') {
            pqct_resolve_transcript_hold(required_param('holdid', PARAM_INT), $workspaceid, (int)$USER->id, required_param('resolution', PARAM_TEXT));
        } else if ($action === 'correction') {
            pqct_create_transcript_correction(
                $studentid,
                $workspaceid,
                (int)$USER->id,
                trim(optional_param('documentid', $documentid, PARAM_TEXT)),
                required_param('fieldpath', PARAM_TEXT),
                optional_param('oldvalue', '', PARAM_TEXT),
                required_param('newvalue', PARAM_TEXT),
                required_param('reason', PARAM_TEXT)
            );
        }
        redirect(new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid, 'documentid' => $documentid, 'saved' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$holds = pqct_all_transcript_holds($studentid, $workspaceid);
$corrections = pqct_transcript_corrections($studentid, $workspaceid);
$docs = pqct_recent_official_transcript_docs($studentid, $workspaceid, 20);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Transcript Controls');
$PAGE->set_heading('Transcript Controls');
$PAGE->add_body_class('pqtc-page');

echo $OUTPUT->header();
?>
<style>
body.pqtc-page header,body.pqtc-page footer,body.pqtc-page nav.navbar,body.pqtc-page #page-header,body.pqtc-page #page-footer,body.pqtc-page .drawer,body.pqtc-page .drawer-toggles,body.pqtc-page .block-region,body.pqtc-page [data-region="drawer"],body.pqtc-page [data-region="right-hand-drawer"]{display:none!important}
body.pqtc-page #page,body.pqtc-page #page-content,body.pqtc-page #region-main,body.pqtc-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtc-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqtc-wrap{max-width:1260px;margin:0 auto}.pqtc-top,.pqtc-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqtc-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start;margin-bottom:14px}.pqtc-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqtc-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqtc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqtc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqtc-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqtc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}.pqtc-panel{margin-bottom:14px}.pqtc-panel h2{margin:0 0 12px;color:#221b22;font-size:20px;font-weight:950}.pqtc-field{display:grid;gap:5px;margin-bottom:10px}.pqtc-field label{font-size:11px;font-weight:950;color:#415665;text-transform:uppercase}.pqtc-input,.pqtc-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800;box-sizing:border-box}.pqtc-input{min-height:40px;padding:0 10px}.pqtc-textarea{min-height:80px;padding:10px}.pqtc-table{width:100%;border-collapse:collapse}.pqtc-table th,.pqtc-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqtc-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqtc-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqtc-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqtc-alert--ok{background:#edf9ef;color:#245c35}.pqtc-alert--bad{background:#fff0ed;color:#883526}.pqtc-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}
@media(max-width:900px){.pqtc-top,.pqtc-grid{grid-template-columns:1fr}.pqtc-actions{justify-content:flex-start}.pqtc-table{display:block;overflow-x:auto}}
</style>
<main class="pqtc-shell"><div class="pqtc-wrap">
  <section class="pqtc-top">
    <div>
      <h1 class="pqtc-title">Transcript Controls</h1>
      <p class="pqtc-sub"><?php echo s(fullname($student)); ?> / <?php echo s(pqh_account_no_label($student)); ?></p>
    </div>
    <nav class="pqtc-actions">
      <a class="pqtc-btn pqtc-btn--light" href="<?php echo pqct_transcript_url($studentid, $workspaceid, $consumercontext)->out(false); ?>">Transcript</a>
      <a class="pqtc-btn pqtc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['studentid' => $studentid]))->out(false); ?>">Official draft</a>
      <a class="pqtc-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams))->out(false); ?>">Workspace</a>
    </nav>
  </section>

  <?php if ($message !== ''): ?><div class="pqtc-alert pqtc-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqtc-alert pqtc-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

  <section class="pqtc-grid">
    <form class="pqtc-panel" method="post">
      <h2>Add Hold</h2>
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <input type="hidden" name="action" value="hold">
      <input type="hidden" name="studentid" value="<?php echo (int)$studentid; ?>">
      <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
      <div class="pqtc-field"><label>Hold type</label><input class="pqtc-input" name="holdtype" value="registrar"></div>
      <div class="pqtc-field"><label>Reason</label><textarea class="pqtc-textarea" name="reason" required></textarea></div>
      <button class="pqtc-btn" type="submit">Add hold</button>
    </form>

    <form class="pqtc-panel" method="post">
      <h2>Record Correction</h2>
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <input type="hidden" name="action" value="correction">
      <input type="hidden" name="studentid" value="<?php echo (int)$studentid; ?>">
      <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
      <div class="pqtc-field"><label>Document</label><select class="pqtc-input" name="documentid"><option value="<?php echo s($documentid); ?>"><?php echo $documentid !== '' ? s($documentid) : 'Live/current draft'; ?></option><?php foreach ($docs as $doc): ?><option value="<?php echo s((string)$doc->documentid); ?>"><?php echo s((string)$doc->documentid); ?> / <?php echo s(pqtc_label((string)$doc->status)); ?></option><?php endforeach; ?></select></div>
      <div class="pqtc-field"><label>Field path</label><input class="pqtc-input" name="fieldpath" required placeholder="course.grade or student.account_no"></div>
      <div class="pqtc-field"><label>Old value</label><input class="pqtc-input" name="oldvalue"></div>
      <div class="pqtc-field"><label>New value</label><input class="pqtc-input" name="newvalue" required></div>
      <div class="pqtc-field"><label>Reason</label><textarea class="pqtc-textarea" name="reason" required></textarea></div>
      <button class="pqtc-btn" type="submit">Record correction</button>
    </form>
  </section>

  <section class="pqtc-panel">
    <h2>Holds</h2>
    <table class="pqtc-table"><thead><tr><th>Status</th><th>Type</th><th>Reason</th><th>Created</th><th>Resolve</th></tr></thead><tbody>
    <?php foreach ($holds as $hold): ?>
      <tr>
        <td><span class="pqtc-pill"><?php echo s(pqtc_label((string)$hold->status)); ?></span></td>
        <td><?php echo s((string)$hold->holdtype); ?></td>
        <td><?php echo s((string)$hold->reason); ?><?php if (!empty($hold->resolutionnote)): ?><span class="pqtc-muted">Resolution: <?php echo s((string)$hold->resolutionnote); ?></span><?php endif; ?></td>
        <td><?php echo s(pqtc_date((int)$hold->timecreated)); ?></td>
        <td>
          <?php if ((string)$hold->status === 'active'): ?>
            <form method="post">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <input type="hidden" name="action" value="resolvehold">
              <input type="hidden" name="holdid" value="<?php echo (int)$hold->id; ?>">
              <input type="hidden" name="studentid" value="<?php echo (int)$studentid; ?>">
              <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
              <input class="pqtc-input" name="resolution" required placeholder="Resolution note">
              <button class="pqtc-btn pqtc-btn--light" type="submit">Resolve</button>
            </form>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$holds): ?><tr><td colspan="5">No transcript holds found.</td></tr><?php endif; ?>
    </tbody></table>
  </section>

  <section class="pqtc-panel">
    <h2>Corrections</h2>
    <table class="pqtc-table"><thead><tr><th>Status</th><th>Document</th><th>Field</th><th>Change</th><th>Reason</th><th>Recorded</th></tr></thead><tbody>
    <?php foreach ($corrections as $correction): ?>
      <tr>
        <td><span class="pqtc-pill"><?php echo s(pqtc_label((string)$correction->status)); ?></span></td>
        <td><?php echo s((string)$correction->documentid); ?></td>
        <td><?php echo s((string)$correction->fieldpath); ?></td>
        <td><span class="pqtc-muted">From: <?php echo s((string)$correction->oldvalue); ?></span><span class="pqtc-muted">To: <?php echo s((string)$correction->newvalue); ?></span></td>
        <td><?php echo s((string)$correction->reason); ?></td>
        <td><?php echo s(pqtc_date((int)$correction->timecreated)); ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$corrections): ?><tr><td colspan="6">No correction records found.</td></tr><?php endif; ?>
    </tbody></table>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
