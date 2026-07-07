<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
$q = trim(optional_param('q', '', PARAM_TEXT));
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace admins can view student finance profiles.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Finance access required');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    try {
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $targetstudentid = optional_param('studentid', 0, PARAM_INT);
        if (!in_array($action, ['resolve_family_account', 'create_finance_hold', 'refresh_finance_hold_candidates', 'activate_finance_hold', 'resolve_finance_hold'], true)) {
            throw new invalid_parameter_exception('Choose a valid finance action.');
        }
        if (!pqfin_student_in_workspace($targetstudentid, $workspaceid)) {
            throw new invalid_parameter_exception('Choose a valid student in this workspace.');
        }
        $studentid = $targetstudentid;
        if ($action === 'resolve_family_account') {
            $billingaccountid = pqfin_resolve_or_create_family_billing_account($targetstudentid, $workspaceid, $consumercontext, (int)$USER->id);
            $message = 'Student finance profile linked to billing account #' . $billingaccountid . '.';
        } else if ($action === 'create_finance_hold') {
            pqfin_create_finance_hold($targetstudentid, $workspaceid, $consumercontext, (int)$USER->id, [
                'holdtype' => optional_param('holdtype', 'manual', PARAM_ALPHANUMEXT),
                'status' => 'active',
                'source' => 'manual',
                'severity' => 'blocker',
                'reasoncode' => 'manual_finance_hold',
                'reason' => trim(required_param('reason', PARAM_TEXT)),
                'parentmessage' => trim(optional_param('parentmessage', '', PARAM_TEXT)),
            ]);
            $message = 'Manual finance hold created.';
        } else if ($action === 'refresh_finance_hold_candidates') {
            $created = pqfin_refresh_finance_hold_candidates($targetstudentid, $workspaceid, $consumercontext, (int)$USER->id);
            $message = count($created) . ' finance hold candidate' . (count($created) === 1 ? '' : 's') . ' queued.';
        } else if ($action === 'activate_finance_hold') {
            pqfin_activate_finance_hold(required_param('holdid', PARAM_INT), $workspaceid, (int)$USER->id);
            $message = 'Finance hold activated.';
        } else if ($action === 'resolve_finance_hold') {
            pqfin_resolve_finance_hold(required_param('holdid', PARAM_INT), $workspaceid, (int)$USER->id, trim(required_param('resolutionnote', PARAM_TEXT)));
            $message = 'Finance hold resolved.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$students = pqco_workspace_students_for_user($workspaceid, (int)$USER->id);
if ($q !== '') {
    $needle = core_text::strtolower($q);
    $students = array_filter($students, static function($student) use ($needle): bool {
        $haystack = core_text::strtolower(fullname($student) . ' ' . (string)($student->email ?? '') . ' ' . (string)($student->idnumber ?? ''));
        return strpos($haystack, $needle) !== false;
    });
}
if ($studentid <= 0 && $students) {
    $first = reset($students);
    $studentid = (int)$first->id;
}
$selectedstudent = $studentid > 0 && isset($students[$studentid])
    ? $students[$studentid]
    : ($studentid > 0 ? core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null);
if ($selectedstudent && !pqfin_student_in_workspace((int)$selectedstudent->id, $workspaceid)) {
    $selectedstudent = null;
    $studentid = 0;
}

$profile = $selectedstudent
    ? pqfin_student_finance_profile((int)$selectedstudent->id, $workspaceid, $consumercontext)
    : ['finance' => null, 'billingaccount' => null, 'warnings' => []];
$holds = $selectedstudent ? pqfin_finance_holds((int)$selectedstudent->id, $workspaceid) : [];
$releasecheck = $selectedstudent ? pqfin_finance_hold_release_check((int)$selectedstudent->id, $workspaceid, $consumercontext, 'transcript') : ['warnings' => [], 'blocked' => false, 'behavior' => 'disabled'];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/student_finance.php', $urlparams + ($studentid > 0 ? ['studentid' => $studentid] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Finance Profiles');
$PAGE->set_heading('Student Finance Profiles');
$PAGE->add_body_class('pqfin-page');

echo $OUTPUT->header();
?>
<style>
body.pqfin-page header,body.pqfin-page footer,body.pqfin-page nav.navbar,body.pqfin-page #page-header,body.pqfin-page #page-footer,body.pqfin-page .drawer,body.pqfin-page .drawer-toggles,body.pqfin-page .block-region,body.pqfin-page [data-region="drawer"],body.pqfin-page [data-region="right-hand-drawer"]{display:none!important}
body.pqfin-page #page,body.pqfin-page #page-content,body.pqfin-page #region-main,body.pqfin-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqfin-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqfin-wrap{max-width:1240px;margin:0 auto}.pqfin-top,.pqfin-panel,.pqfin-filter{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqfin-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqfin-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqfin-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqfin-actions{display:flex;gap:8px;flex-wrap:wrap}.pqfin-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqfin-btn--primary{background:#2f6f4e;color:#fff!important}.pqfin-grid{display:grid;grid-template-columns:330px minmax(0,1fr);gap:14px}.pqfin-filter{display:grid;grid-template-columns:1fr auto;gap:10px;margin-bottom:12px}.pqfin-field label{display:block;margin-bottom:5px;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqfin-input,.pqfin-select,.pqfin-textarea{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800}.pqfin-textarea{min-height:76px;padding:9px 10px}.pqfin-list{display:grid;gap:8px}.pqfin-student{display:block;padding:11px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;color:#173044!important;text-decoration:none}.pqfin-student[aria-current="true"]{border-color:#2f6f4e;background:#f0faf4}.pqfin-name{display:block;color:#221b22;font-weight:950}.pqfin-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqfin-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqfin-pill--warn{background:#fff4d6;color:#5f4300}.pqfin-pill--block{background:#ffe5e1;color:#8a3028}.pqfin-kv{display:grid;grid-template-columns:190px minmax(0,1fr);gap:0;border:1px solid rgba(23,48,68,.1);border-radius:8px;overflow:hidden}.pqfin-kv div{padding:10px;border-bottom:1px solid rgba(23,48,68,.08);font-size:13px;font-weight:850}.pqfin-kv div:nth-child(odd){background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqfin-kv div:nth-last-child(-n+2){border-bottom:0}.pqfin-card{margin-top:14px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqfin-card h3{margin:0 0 10px;color:#221b22;font-size:17px;font-weight:950}.pqfin-table{width:100%;border-collapse:collapse;margin-top:10px}.pqfin-table th,.pqfin-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:12px;font-weight:850}.pqfin-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqfin-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqfin-formgrid .pqfin-wide{grid-column:1/-1}.pqfin-inlineform{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}.pqfin-alert{margin:0 0 12px;padding:10px 12px;border-radius:8px;font-weight:900}.pqfin-alert--ok{background:#eaf7ef;color:#1f5d3f}.pqfin-alert--err{background:#fff0ef;color:#8a3028}.pqfin-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:820px){.pqfin-grid{grid-template-columns:1fr}.pqfin-top{align-items:flex-start;flex-direction:column}.pqfin-kv,.pqfin-formgrid{grid-template-columns:1fr}.pqfin-table{display:block;overflow-x:auto}}
</style>
<main class="pqfin-shell"><div class="pqfin-wrap">
  <section class="pqfin-top">
    <div><h1 class="pqfin-title"><?php echo s($workspace->name); ?> Student Finance Profiles</h1><p class="pqfin-sub">Phase 1 diagnostic view for billing account and student finance profile linkage.</p></div>
    <nav class="pqfin-actions">
      <a class="pqfin-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_student_history.php', $urlparams))->out(false); ?>">Course history</a>
      <a class="pqfin-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoices.php', $urlparams))->out(false); ?>">Invoices</a>
      <a class="pqfin-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams))->out(false); ?>">Finance operations</a>
      <a class="pqfin-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_policy.php', $urlparams))->out(false); ?>">Finance policy</a>
      <a class="pqfin-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
    </nav>
  </section>
  <?php if ($message !== ''): ?><div class="pqfin-alert pqfin-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqfin-alert pqfin-alert--err"><?php echo s($error); ?></div><?php endif; ?>
  <?php if (!pqfin_schema_ready()): ?>
    <div class="pqfin-alert pqfin-alert--err">Student finance schema is not ready. Run the local_prequran Moodle upgrade.</div>
  <?php endif; ?>
  <div class="pqfin-grid">
    <aside class="pqfin-panel">
      <form class="pqfin-filter" method="get">
        <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
        <div class="pqfin-field"><label>Search</label><input class="pqfin-input" name="q" value="<?php echo s($q); ?>" placeholder="Name, email, Account No."></div>
        <button class="pqfin-btn" type="submit">Filter</button>
      </form>
      <div class="pqfin-list">
        <?php if (!$students): ?><div class="pqfin-empty">No students found.</div><?php endif; ?>
        <?php foreach ($students as $student): ?>
          <?php $hrefparams = $urlparams + ['studentid' => (int)$student->id] + ($q !== '' ? ['q' => $q] : []); ?>
          <a class="pqfin-student" aria-current="<?php echo (int)$student->id === $studentid ? 'true' : 'false'; ?>" href="<?php echo (new moodle_url('/local/hubredirect/student_finance.php', $hrefparams))->out(false); ?>">
            <span class="pqfin-name"><?php echo s(fullname($student)); ?></span>
            <span class="pqfin-muted"><?php echo s(pqh_account_no_label($student)); ?> / <?php echo s((string)$student->email); ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    </aside>
    <section class="pqfin-panel">
      <?php if (!$selectedstudent): ?>
        <div class="pqfin-empty">Choose a student to view finance profile readiness.</div>
      <?php else: ?>
        <?php
          $finance = $profile['finance'];
          $account = $profile['billingaccount'];
          $warnings = $profile['warnings'];
        ?>
        <h2 class="pqfin-title" style="font-size:22px"><?php echo s(fullname($selectedstudent)); ?></h2>
        <p class="pqfin-sub"><?php echo s(pqh_account_no_label($selectedstudent)); ?> / <?php echo s((string)$selectedstudent->email); ?></p>
        <div style="margin:12px 0">
          <?php if (!$warnings): ?><span class="pqfin-pill">Finance profile ready</span><?php endif; ?>
          <?php foreach ($warnings as $warning): ?><span class="pqfin-pill pqfin-pill--warn"><?php echo s(str_replace('_', ' ', $warning)); ?></span><?php endforeach; ?>
        </div>
        <?php if (!$account && pqfin_schema_ready()): ?>
          <form method="post" style="margin-bottom:14px">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="resolve_family_account">
            <input type="hidden" name="studentid" value="<?php echo (int)$selectedstudent->id; ?>">
            <button class="pqfin-btn pqfin-btn--primary" type="submit">Create family billing profile</button>
          </form>
        <?php endif; ?>
        <div class="pqfin-kv">
          <div>Student ID</div><div><?php echo (int)$selectedstudent->id; ?></div>
          <div>Finance profile</div><div><?php echo $finance ? '#' . (int)$finance->id . ' / ' . s((string)$finance->status) : 'Not created'; ?></div>
          <div>Hold status</div><div><?php echo $finance ? s((string)$finance->holdstatus) : 'none'; ?></div>
          <div>Billing account</div><div><?php echo $account ? '#' . (int)$account->id : 'Not linked'; ?></div>
          <div>Account type</div><div><?php echo $account ? s(pqfin_account_type_label((string)$account->accounttype)) : ''; ?></div>
          <div>Account status</div><div><?php echo $account ? s(pqfin_status_label((string)$account->status)) : ''; ?></div>
          <div>Display name</div><div><?php echo $account ? s((string)$account->displayname) : ''; ?></div>
          <div>Billing email</div><div><?php echo $account ? s((string)$account->billingemail) : ''; ?></div>
          <div>Currency</div><div><?php echo $account ? s((string)$account->currency) : ''; ?></div>
          <div>Primary payer user</div><div><?php echo $account ? (int)$account->primaryuserid : ''; ?></div>
          <div>Consumer</div><div><?php echo $account ? (int)$account->consumerid : (int)($consumercontext->consumerid ?? 0); ?></div>
          <div>Workspace</div><div><?php echo $account ? (int)$account->workspaceid : $workspaceid; ?></div>
        </div>
        <div class="pqfin-card">
          <h3>Academic release controls</h3>
          <div style="margin-bottom:8px">
            <span class="pqfin-pill<?php echo !empty($releasecheck['blocked']) ? ' pqfin-pill--block' : ''; ?>">Transcript policy: <?php echo s(str_replace('_', ' ', (string)$releasecheck['behavior'])); ?></span>
            <?php foreach (($releasecheck['warnings'] ?? []) as $warning): ?><span class="pqfin-pill pqfin-pill--warn"><?php echo s($warning); ?></span><?php endforeach; ?>
          </div>
          <form method="post" class="pqfin-inlineform">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="refresh_finance_hold_candidates">
            <input type="hidden" name="studentid" value="<?php echo (int)$selectedstudent->id; ?>">
            <button class="pqfin-btn" type="submit">Refresh automatic hold candidates</button>
          </form>
        </div>
        <div class="pqfin-card">
          <h3>Create manual finance hold</h3>
          <form method="post" class="pqfin-formgrid">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="create_finance_hold">
            <input type="hidden" name="studentid" value="<?php echo (int)$selectedstudent->id; ?>">
            <div class="pqfin-field"><label>Hold type</label><select class="pqfin-select" name="holdtype"><option value="manual">Manual finance hold</option><option value="manual_review">Manual review</option></select></div>
            <div class="pqfin-field"><label>Parent-safe message</label><input class="pqfin-input" name="parentmessage" placeholder="Optional public billing message"></div>
            <div class="pqfin-field pqfin-wide"><label>Internal reason</label><textarea class="pqfin-textarea" name="reason" required></textarea></div>
            <div class="pqfin-wide"><button class="pqfin-btn pqfin-btn--primary" type="submit">Create hold</button></div>
          </form>
        </div>
        <div class="pqfin-card">
          <h3>Finance holds</h3>
          <?php if (!pqfin_hold_schema_ready()): ?>
            <div class="pqfin-empty">Finance hold schema is not ready. Run the local_prequran Moodle upgrade.</div>
          <?php elseif (!$holds): ?>
            <div class="pqfin-empty">No finance holds recorded for this student.</div>
          <?php else: ?>
            <table class="pqfin-table">
              <thead><tr><th>Status</th><th>Type</th><th>Reason</th><th>Public message</th><th>Action</th></tr></thead>
              <tbody>
              <?php foreach ($holds as $hold): ?>
                <tr>
                  <td><?php echo s(pqfin_hold_status_label((string)$hold->status)); ?></td>
                  <td><?php echo s(pqfin_hold_type_label((string)$hold->holdtype)); ?><br><span class="pqfin-muted"><?php echo s((string)$hold->amount . ' ' . (string)$hold->currency); ?></span></td>
                  <td><?php echo s((string)$hold->reason); ?></td>
                  <td><?php echo s(pqfin_hold_parent_safe_message($hold)); ?></td>
                  <td>
                    <?php if ((string)$hold->status === 'suggested'): ?>
                      <form method="post" style="margin-bottom:8px">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="activate_finance_hold">
                        <input type="hidden" name="studentid" value="<?php echo (int)$selectedstudent->id; ?>">
                        <input type="hidden" name="holdid" value="<?php echo (int)$hold->id; ?>">
                        <button class="pqfin-btn pqfin-btn--primary" type="submit">Activate</button>
                      </form>
                    <?php endif; ?>
                    <?php if (in_array((string)$hold->status, pqfin_unresolved_hold_statuses(), true)): ?>
                      <form method="post" class="pqfin-inlineform">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="resolve_finance_hold">
                        <input type="hidden" name="studentid" value="<?php echo (int)$selectedstudent->id; ?>">
                        <input type="hidden" name="holdid" value="<?php echo (int)$hold->id; ?>">
                        <input class="pqfin-input" name="resolutionnote" placeholder="Resolution note" required>
                        <button class="pqfin-btn" type="submit">Resolve</button>
                      </form>
                    <?php else: ?>
                      <span class="pqfin-muted"><?php echo s((string)$hold->resolutionnote); ?></span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </section>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
