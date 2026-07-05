<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

function pqctp_option_label(string $value): string {
    return ucwords(str_replace('_', ' ', $value));
}

function pqctp_select(string $name, array $options, string $selected): string {
    $html = '<select class="pqctp-input" name="' . s($name) . '">';
    foreach ($options as $value) {
        $html .= '<option value="' . s($value) . '"' . ($value === $selected ? ' selected' : '') . '>' . s(pqctp_option_label($value)) . '</option>';
    }
    return $html . '</select>';
}

global $DB, $OUTPUT, $PAGE, $USER;

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and admins can edit transcript policy settings.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Transcript policy access required'
    );
}
if (!pqh_table_exists_safe('local_prequran_transcript_policy')) {
    pqh_access_denied(
        'Transcript policy tables are not ready yet. Run the local_prequran plugin upgrade first.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Transcript policy unavailable'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$allowed = pqct_policy_allowed_values();
$message = optional_param('saved', 0, PARAM_INT) === 1 ? 'Transcript policy saved.' : '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen transcript policy settings and try again.',
            new moodle_url('/local/hubredirect/transcript_policy.php', $urlparams),
            'Transcript policy form expired'
        );
    }
    try {
        $policy = [
            'policy_version' => 1,
            'completion_source' => optional_param('completion_source', 'moodle_then_local', PARAM_ALPHANUMEXT),
            'passing_rule' => optional_param('passing_rule', 'completion_or_grade', PARAM_ALPHANUMEXT),
            'minimum_passing_percent' => optional_param('minimum_passing_percent', 60, PARAM_INT),
            'grade_display_mode' => optional_param('grade_display_mode', 'percent', PARAM_ALPHANUMEXT),
            'grade_rounding' => optional_param('grade_rounding', 1, PARAM_INT),
            'show_in_progress_grades' => optional_param('show_in_progress_grades', 0, PARAM_BOOL),
            'attendance_display' => optional_param('attendance_display', 'sessions_and_rate', PARAM_ALPHANUMEXT),
            'drop_withdrawal_display' => optional_param('drop_withdrawal_display', 'show_with_status', PARAM_ALPHANUMEXT),
            'teacher_note_official_display' => optional_param('teacher_note_official_display', 'none', PARAM_ALPHANUMEXT),
            'unofficial_pdf_permission' => optional_param('unofficial_pdf_permission', 'workspace_admin', PARAM_ALPHANUMEXT),
            'official_issue_permission' => optional_param('official_issue_permission', 'workspace_admin', PARAM_ALPHANUMEXT),
        ];
        pqct_save_workspace_transcript_policy($workspaceid, $policy, (int)$USER->id);
        redirect(new moodle_url('/local/hubredirect/transcript_policy.php', $urlparams + ['saved' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$policyinfo = pqct_workspace_transcript_policy($workspaceid);
$policy = pqct_normalize_transcript_policy($policyinfo['policy']);
$dashboardurl = new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams);
$previewurl = new moodle_url('/local/hubredirect/course_transcript.php', $urlparams);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/transcript_policy.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Transcript Policy Settings');
$PAGE->set_heading('Transcript Policy Settings');
$PAGE->add_body_class('pqctp-page');

echo $OUTPUT->header();
?>
<style>
body.pqctp-page header,body.pqctp-page footer,body.pqctp-page nav.navbar,body.pqctp-page #page-header,body.pqctp-page #page-footer,body.pqctp-page .drawer,body.pqctp-page .drawer-toggles,body.pqctp-page .block-region,body.pqctp-page [data-region="drawer"],body.pqctp-page [data-region="right-hand-drawer"]{display:none!important}
body.pqctp-page #page,body.pqctp-page #page-content,body.pqctp-page #region-main,body.pqctp-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqctp-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqctp-wrap{max-width:1180px;margin:0 auto}.pqctp-top,.pqctp-panel,.pqctp-side{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqctp-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqctp-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqctp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqctp-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqctp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqctp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqctp-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px}.pqctp-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqctp-field{display:grid;gap:5px;margin-bottom:10px}.pqctp-field--wide{grid-column:1/-1}.pqctp-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqctp-field small{color:#647887;font-size:12px;font-weight:750;line-height:1.35}.pqctp-input{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqctp-check{display:flex;gap:9px;align-items:center;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff;font-weight:900}.pqctp-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqctp-alert--ok{background:#edf9ef;color:#245c35}.pqctp-alert--bad{background:#fff0ed;color:#883526}.pqctp-side h2,.pqctp-panel h2{margin:0 0 12px;color:#221b22;font-size:18px;font-weight:950}.pqctp-meta{display:grid;gap:9px}.pqctp-meta div{padding:10px;border-radius:8px;background:#f7fafb}.pqctp-meta span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqctp-meta strong{display:block;margin-top:4px;color:#173044;font-size:13px;font-weight:950;overflow-wrap:anywhere}.pqctp-note{margin-top:12px;color:#5e7280;font-size:12px;font-weight:800;line-height:1.45}
@media(max-width:900px){.pqctp-top,.pqctp-grid,.pqctp-formgrid{grid-template-columns:1fr}.pqctp-actions{justify-content:flex-start}}
</style>
<main class="pqctp-shell">
  <div class="pqctp-wrap">
    <section class="pqctp-top">
      <div>
        <h1 class="pqctp-title">Transcript Policy Settings</h1>
        <p class="pqctp-sub"><?php echo s((string)$workspace->name); ?> grade, completion, attendance, and official display rules.</p>
      </div>
      <nav class="pqctp-actions" aria-label="Transcript policy navigation">
        <a class="pqctp-btn pqctp-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Workspace</a>
        <a class="pqctp-btn pqctp-btn--light" href="<?php echo $previewurl->out(false); ?>">Preview transcripts</a>
      </nav>
    </section>

    <?php if ($message !== ''): ?><div class="pqctp-alert pqctp-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqctp-alert pqctp-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqctp-grid">
      <form class="pqctp-panel" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <h2>Display And Issue Policy</h2>
        <div class="pqctp-formgrid">
          <div class="pqctp-field">
            <label>Completion source</label>
            <?php echo pqctp_select('completion_source', $allowed['completion_source'], (string)$policy['completion_source']); ?>
            <small>Controls which completion signal receives priority in transcript previews.</small>
          </div>
          <div class="pqctp-field">
            <label>Passing rule</label>
            <?php echo pqctp_select('passing_rule', $allowed['passing_rule'], (string)$policy['passing_rule']); ?>
            <small>Reserved for official issue checks and readiness reports.</small>
          </div>
          <div class="pqctp-field">
            <label>Minimum pass percent</label>
            <input class="pqctp-input" type="number" min="0" max="100" name="minimum_passing_percent" value="<?php echo (int)$policy['minimum_passing_percent']; ?>">
          </div>
          <div class="pqctp-field">
            <label>Grade display</label>
            <?php echo pqctp_select('grade_display_mode', $allowed['grade_display_mode'], (string)$policy['grade_display_mode']); ?>
          </div>
          <div class="pqctp-field">
            <label>Grade rounding</label>
            <input class="pqctp-input" type="number" min="0" max="2" name="grade_rounding" value="<?php echo (int)$policy['grade_rounding']; ?>">
          </div>
          <div class="pqctp-field">
            <label>In-progress grades</label>
            <label class="pqctp-check"><input type="checkbox" name="show_in_progress_grades" value="1" <?php echo !empty($policy['show_in_progress_grades']) ? 'checked' : ''; ?>> Show before completion</label>
          </div>
          <div class="pqctp-field">
            <label>Attendance display</label>
            <?php echo pqctp_select('attendance_display', $allowed['attendance_display'], (string)$policy['attendance_display']); ?>
          </div>
          <div class="pqctp-field">
            <label>Drop/withdrawal display</label>
            <?php echo pqctp_select('drop_withdrawal_display', $allowed['drop_withdrawal_display'], (string)$policy['drop_withdrawal_display']); ?>
          </div>
          <div class="pqctp-field">
            <label>Official teacher notes</label>
            <?php echo pqctp_select('teacher_note_official_display', $allowed['teacher_note_official_display'], (string)$policy['teacher_note_official_display']); ?>
          </div>
          <div class="pqctp-field">
            <label>Unofficial PDF</label>
            <?php echo pqctp_select('unofficial_pdf_permission', $allowed['unofficial_pdf_permission'], (string)$policy['unofficial_pdf_permission']); ?>
          </div>
          <div class="pqctp-field pqctp-field--wide">
            <label>Official issue permission</label>
            <?php echo pqctp_select('official_issue_permission', $allowed['official_issue_permission'], (string)$policy['official_issue_permission']); ?>
          </div>
        </div>
        <button class="pqctp-btn" type="submit">Save transcript policy</button>
      </form>

      <aside class="pqctp-side">
        <h2>Current Policy</h2>
        <div class="pqctp-meta">
          <div><span>Source</span><strong><?php echo s((string)$policyinfo['source']); ?></strong></div>
          <div><span>Version</span><strong><?php echo (int)$policyinfo['policyversion']; ?></strong></div>
          <div><span>Hash</span><strong><?php echo s((string)$policyinfo['policyhash']); ?></strong></div>
          <div><span>Last saved</span><strong><?php echo (int)$policyinfo['timemodified'] > 0 ? s(userdate((int)$policyinfo['timemodified'], get_string('strftimedatetimeshort'))) : 'Not saved yet'; ?></strong></div>
        </div>
        <p class="pqctp-note">Official issuing remains disabled until later transcript phases. These settings already affect unofficial transcript display and are included in resolver payloads for auditability.</p>
      </aside>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
