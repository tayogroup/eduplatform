<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/scholarship_sponsorlib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$role = $workspaceid > 0 ? pqh_user_workspace_role((int)$USER->id, $workspaceid) : '';
$canmanage = $workspaceid > 0 && (pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) || pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'finance.manage'));
if ($workspaceid <= 0 || (!$canmanage && !in_array($role, ['student', 'parent'], true))) {
    pqh_access_denied('Scholarship applications require student, parent, or finance access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Scholarship access denied');
}
if (!pqss_schema_ready()) {
    pqh_access_denied('Scholarship application schema is not ready. Run the local_prequran upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]), 'Scholarship schema pending');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $action = required_param('action', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'submit_application') {
            $studentid = required_param('studentid', PARAM_INT);
            $applicationid = pqss_create_scholarship_application($workspaceid, $consumercontext, (int)$USER->id, [
                'studentid' => $studentid,
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'invoiceid' => optional_param('invoiceid', 0, PARAM_INT),
                'currency' => optional_param('currency', pqfin_default_currency(), PARAM_ALPHANUMEXT),
                'requestedamount' => optional_param('requestedamount', '0.00', PARAM_TEXT),
                'needlevel' => optional_param('needlevel', 'standard', PARAM_ALPHANUMEXT),
                'fundingpreference' => optional_param('fundingpreference', '', PARAM_TEXT),
                'householdnote' => optional_param('householdnote', '', PARAM_TEXT),
                'academicnote' => optional_param('academicnote', '', PARAM_TEXT),
                'documentnote' => optional_param('documentnote', '', PARAM_TEXT),
            ]);
            $notice = 'Scholarship application #' . $applicationid . ' submitted.';
        } else if ($action === 'review_application') {
            pqss_review_scholarship_application(
                required_param('applicationid', PARAM_INT),
                $workspaceid,
                $consumercontext,
                (int)$USER->id,
                required_param('status', PARAM_ALPHANUMEXT),
                optional_param('decisionnote', '', PARAM_TEXT),
                optional_param('invoiceid', 0, PARAM_INT)
            );
            $notice = 'Scholarship application reviewed.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$studentids = pqss_user_student_ids($workspaceid, (int)$USER->id);
$students = $canmanage ? pqss_workspace_students($workspaceid) : array_values(array_filter(pqss_workspace_students($workspaceid), static fn($student): bool => in_array((int)$student->id, $studentids, true)));
$offerings = pqss_offerings_for_scholarship($workspaceid);
$applications = pqss_scholarship_applications($workspaceid, (int)$USER->id);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/scholarship_portal.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Scholarship Application Portal');
$PAGE->set_heading('Scholarship Application Portal');
$PAGE->add_body_class('pqsch-page');

echo $OUTPUT->header();
?>
<style>
body.pqsch-page header,body.pqsch-page footer,body.pqsch-page nav.navbar,body.pqsch-page #page-header,body.pqsch-page #page-footer,body.pqsch-page .drawer,body.pqsch-page .drawer-toggles,body.pqsch-page .block-region,body.pqsch-page [data-region="drawer"],body.pqsch-page [data-region="right-hand-drawer"]{display:none!important}
body.pqsch-page #page,body.pqsch-page #page-content,body.pqsch-page #region-main,body.pqsch-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqsch{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqsch-wrap{max-width:1260px;margin:0 auto}.pqsch-top,.pqsch-panel,.pqsch-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqsch-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqsch-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.08}.pqsch-muted{color:#5e7280;font-size:13px;font-weight:800}.pqsch-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqsch-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqsch-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqsch-grid{display:grid;grid-template-columns:390px 1fr;gap:14px}.pqsch-field{display:grid;gap:5px;margin-bottom:10px}.pqsch-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqsch-input,.pqsch-select,.pqsch-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqsch-input,.pqsch-select{padding:0 10px}.pqsch-textarea{min-height:76px;padding:10px}.pqsch-table{width:100%;border-collapse:separate;border-spacing:0}.pqsch-table th,.pqsch-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqsch-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqsch-name{display:block;color:#221b22;font-weight:950}.pqsch-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqsch-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqsch-alert--ok{background:#edf9ef;color:#245c35}.pqsch-alert--bad{background:#fff0ed;color:#883526}.pqsch-inline{display:grid;gap:6px;min-width:210px}.pqsch-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:920px){.pqsch-top,.pqsch-grid{grid-template-columns:1fr}.pqsch-actions{justify-content:flex-start}.pqsch-table thead{display:none}.pqsch-table tr,.pqsch-table td{display:block}.pqsch-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqsch"><div class="pqsch-wrap">
  <section class="pqsch-top"><div><h1 class="pqsch-title">Scholarship Application Portal</h1><div class="pqsch-muted"><?php echo s((string)$workspace->name); ?> need-based aid intake, review, award conversion, and finance audit trail.</div></div><nav class="pqsch-actions"><a class="pqsch-btn pqsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><?php if ($canmanage): ?><a class="pqsch-btn pqsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams + ['report' => 'scholarships']))->out(false); ?>">Finance scholarships</a><?php endif; ?></nav></section>
  <?php if ($notice !== ''): ?><div class="pqsch-alert pqsch-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqsch-alert pqsch-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <div class="pqsch-grid">
    <section class="pqsch-panel">
      <h2 class="pqsch-title" style="font-size:21px">New Application</h2>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
        <input type="hidden" name="action" value="submit_application">
        <div class="pqsch-field"><label>Student</label><select class="pqsch-select" name="studentid" required><?php foreach ($students as $student): ?><option value="<?php echo (int)$student->id; ?>"><?php echo s(fullname($student)); ?></option><?php endforeach; ?></select></div>
        <div class="pqsch-field"><label>Course offering</label><select class="pqsch-select" name="offeringid"><option value="0">General scholarship</option><?php foreach ($offerings as $offering): ?><option value="<?php echo (int)$offering->id; ?>"><?php echo s((string)$offering->title); ?><?php echo (int)$offering->scholarship_eligible ? ' / eligible' : ''; ?></option><?php endforeach; ?></select></div>
        <div class="pqsch-field"><label>Invoice ID</label><input class="pqsch-input" name="invoiceid" placeholder="Optional invoice number ID"></div>
        <div class="pqsch-field"><label>Currency</label><input class="pqsch-input" name="currency" value="<?php echo s(pqfin_default_currency()); ?>"></div>
        <div class="pqsch-field"><label>Requested amount</label><input class="pqsch-input" name="requestedamount" required placeholder="250.00"></div>
        <div class="pqsch-field"><label>Need level</label><select class="pqsch-select" name="needlevel"><option value="standard">Standard</option><option value="high_need">High need</option><option value="emergency">Emergency</option><option value="merit">Merit</option></select></div>
        <div class="pqsch-field"><label>Funding preference</label><input class="pqsch-input" name="fundingpreference" placeholder="Zakat, donor fund, hardship, merit"></div>
        <div class="pqsch-field"><label>Household note</label><textarea class="pqsch-textarea" name="householdnote"></textarea></div>
        <div class="pqsch-field"><label>Academic note</label><textarea class="pqsch-textarea" name="academicnote"></textarea></div>
        <div class="pqsch-field"><label>Documents note</label><textarea class="pqsch-textarea" name="documentnote"></textarea></div>
        <button class="pqsch-btn" type="submit">Submit Application</button>
      </form>
    </section>
    <section class="pqsch-panel">
      <h2 class="pqsch-title" style="font-size:21px">Applications</h2>
      <?php if (!$applications): ?><div class="pqsch-empty">No scholarship applications yet.</div><?php endif; ?>
      <?php if ($applications): ?><table class="pqsch-table"><thead><tr><th>Application</th><th>Student</th><th>Need</th><th>Amount</th><th>Decision</th><?php if ($canmanage): ?><th>Review</th><?php endif; ?></tr></thead><tbody>
        <?php foreach ($applications as $application): ?>
          <tr>
            <td data-label="Application"><span class="pqsch-name"><?php echo s((string)$application->applicationnumber); ?></span><span class="pqsch-muted"><?php echo s((string)($application->offeringtitle ?? 'General scholarship')); ?></span><?php if ((int)$application->awardid > 0): ?><br><span class="pqsch-pill">Award #<?php echo (int)$application->awardid; ?></span><?php endif; ?></td>
            <td data-label="Student"><?php echo s(trim((string)$application->firstname . ' ' . (string)$application->lastname)); ?></td>
            <td data-label="Need"><span class="pqsch-pill"><?php echo s((string)$application->needlevel); ?></span><div class="pqsch-muted"><?php echo s((string)$application->fundingpreference); ?></div></td>
            <td data-label="Amount"><?php echo s((string)$application->currency . ' ' . (string)$application->requestedamount); ?></td>
            <td data-label="Decision"><span class="pqsch-pill"><?php echo s((string)$application->status); ?></span><div class="pqsch-muted"><?php echo s((string)$application->decisionnote); ?></div></td>
            <?php if ($canmanage): ?><td data-label="Review"><form class="pqsch-inline" method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="review_application"><input type="hidden" name="applicationid" value="<?php echo (int)$application->id; ?>"><select class="pqsch-select" name="status"><option value="under_review">Under review</option><option value="approved">Approve</option><option value="waitlist">Waitlist</option><option value="declined">Decline</option><option value="awarded">Award now</option></select><input class="pqsch-input" name="invoiceid" value="<?php echo (int)$application->invoiceid; ?>" placeholder="Invoice ID for award"><textarea class="pqsch-textarea" name="decisionnote" placeholder="Decision note"></textarea><button class="pqsch-btn pqsch-btn--light" type="submit">Save</button></form></td><?php endif; ?>
          </tr>
        <?php endforeach; ?>
      </tbody></table><?php endif; ?>
    </section>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
