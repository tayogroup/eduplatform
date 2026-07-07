<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$pqea_brand = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
if ($pqea_brand === '') {
    $pqea_brand = 'EduPlatform';
}
$pqea_initials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $pqea_brand) ?: 'EP', 0, 2));
$studentid = optional_param('studentid', 0, PARAM_INT);
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/enrollment_approval.php', ['studentid' => $studentid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Enrollment Approval');
$PAGE->set_heading('Enrollment Approval');
$PAGE->add_body_class('pqh-enrollment-approval-page');

function pqea_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqea_table_has_field(string $table, string $field): bool {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqea_parent_is_linked(int $studentid, int $parentid): bool {
    global $DB;
    if ($studentid <= 0 || $parentid <= 0) {
        return false;
    }
    if (pqea_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid])) {
        return true;
    }
    if (pqea_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', ['studentid' => $studentid, 'guardianid' => $parentid])) {
        return true;
    }
    return false;
}

function pqea_current_status(int $studentid, int $parentid): string {
    global $DB;
    if (pqea_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', [
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'consent_type' => 'enrollment_approval',
            'granted' => 1,
        ])) {
        return 'approved';
    }
    if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
        $status = $DB->get_field('local_prequran_student_profile', 'enrollment_approval_status', ['userid' => $studentid]);
        if (is_string($status) && strtolower($status) === 'approved') {
            return 'approved';
        }
    }
    return 'pending_parent';
}

function pqea_upsert_enrollment_approval(int $studentid, int $parentid, string $notes): void {
    global $DB;
    $now = time();
    $details = 'Parent/guardian approved enrollment so the student can start lessons. ' . $notes;

    if (pqea_table_exists('local_prequran_live_consent')) {
        $record = (object)[
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'consent_type' => 'enrollment_approval',
            'granted' => 1,
            'version' => '1',
            'consent_source' => 'parent_portal',
            'details' => $details,
            'timemodified' => $now,
        ];
        $existing = $DB->get_record('local_prequran_live_consent', [
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'consent_type' => 'enrollment_approval',
        ]);
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_live_consent', $record);
        } else {
            $record->timecreated = $now;
            $DB->insert_record('local_prequran_live_consent', $record);
        }
    }

    if (pqea_table_exists('local_prequran_student_profile')) {
        $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
        if ($profile) {
            $profile->timemodified = $now;
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
                $profile->enrollment_approval_status = 'approved';
            }
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approvedby')) {
                $profile->enrollment_approvedby = $parentid;
            }
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approvedat')) {
                $profile->enrollment_approvedat = $now;
            }
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approval_notes')) {
                $profile->enrollment_approval_notes = $details;
            }
            $DB->update_record('local_prequran_student_profile', $profile);
        }
    }

    if (pqea_table_exists('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => $parentid,
            'action' => 'enrollment_approved',
            'targettype' => 'student',
            'targetid' => $studentid,
            'details' => json_encode(['source' => 'parent_portal'], JSON_UNESCAPED_SLASHES),
            'timecreated' => $now,
        ]);
    }
}

$student = $studentid > 0 ? core_user::get_user($studentid) : null;
if (!$student) {
    pqh_access_denied(
        'Choose a valid student before opening the enrollment approval page.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Enrollment approval unavailable'
    );
}

$islinkedparent = pqea_parent_is_linked($studentid, (int)$USER->id);
if (!$islinkedparent && !is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only the linked parent or guardian can approve this enrollment.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Enrollment approval access required'
    );
}

$message = '';
$error = '';
$status = pqea_current_status($studentid, (int)$USER->id);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        $error = 'This enrollment approval form expired. Please refresh and try again.';
    } else if (!$islinkedparent) {
        $error = 'This action must be completed by the linked parent or guardian.';
    } else if (!optional_param('approve_enrollment', 0, PARAM_BOOL)) {
        $error = 'Please tick the declaration before approving enrollment.';
    } else {
        $notes = trim(optional_param('approval_notes', '', PARAM_TEXT));
        pqea_upsert_enrollment_approval($studentid, (int)$USER->id, $notes);
        $status = 'approved';
        $message = 'Enrollment approved. The student can now start lessons.';
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-enrollment-approval-page header,body.pqh-enrollment-approval-page footer,body.pqh-enrollment-approval-page nav.navbar,body.pqh-enrollment-approval-page #page-header,body.pqh-enrollment-approval-page #page-footer,body.pqh-enrollment-approval-page .drawer,body.pqh-enrollment-approval-page .drawer-toggles,body.pqh-enrollment-approval-page .block-region,body.pqh-enrollment-approval-page [data-region="drawer"],body.pqh-enrollment-approval-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-enrollment-approval-page #page,body.pqh-enrollment-approval-page #page-content,body.pqh-enrollment-approval-page #region-main,body.pqh-enrollment-approval-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqea-shell{min-height:100vh;padding:34px 18px;background:#f3fbf4;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqea-wrap{max-width:880px;margin:0 auto}.pqea-card{background:#fff;border:1px solid rgba(122,86,55,.18);border-radius:10px;box-shadow:0 16px 38px rgba(23,48,68,.08);padding:26px}
.pqea-logo{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:#7a5637;color:#fff;font-weight:950;margin-bottom:14px}.pqea-kicker{margin:0 0 8px;color:#7a5637;font-size:13px;font-weight:950;text-transform:uppercase}.pqea-title{margin:0;color:#241b24;font-size:34px;line-height:1.1;font-weight:950}.pqea-sub{margin:10px 0 18px;color:#5d6f5c;font-size:16px;font-weight:800}.pqea-notice{padding:13px 15px;border-radius:8px;margin:14px 0;font-weight:850}.pqea-notice--ok{background:#edf9ef;color:#245c35}.pqea-notice--bad{background:#fff0ed;color:#883526}.pqea-panel{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:9px;background:#fbfdf9;margin:12px 0}.pqea-panel h2{margin:0 0 8px;font-size:18px;font-weight:950;color:#3a281d}.pqea-panel p,.pqea-panel li{font-size:14px;font-weight:750;line-height:1.55}.pqea-panel ul{margin:8px 0 0;padding-left:20px}.pqea-check{display:flex;gap:10px;margin:16px 0;font-weight:900}.pqea-check input{width:20px;height:20px;margin-top:2px}.pqea-textarea{width:100%;min-height:80px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:10px;font:800 14px/1.3 system-ui;color:#173044}.pqea-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.pqea-btn{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 16px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:15px;font-weight:950;cursor:pointer}.pqea-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqea-badge{display:inline-flex;padding:7px 11px;border-radius:999px;background:#eaf7ee;color:#27603a;font-weight:950}.pqea-badge--pending{background:#fff4d9;color:#7a5637}
@media(max-width:720px){.pqea-title{font-size:27px}.pqea-card{padding:20px}}
</style>
<main class="pqea-shell">
  <div class="pqea-wrap">
    <section class="pqea-card">
      <div class="pqea-logo"><?php echo s($pqea_initials); ?></div>
      <p class="pqea-kicker">Parent approval</p>
      <h1 class="pqea-title">Approve enrollment for <?php echo s(fullname($student)); ?></h1>
      <p class="pqea-sub">A linked parent or guardian must approve the enrollment before the student can start lessons.</p>

      <?php if ($message !== ''): ?><div class="pqea-notice pqea-notice--ok"><?php echo s($message); ?></div><?php endif; ?>
      <?php if ($error !== ''): ?><div class="pqea-notice pqea-notice--bad"><?php echo s($error); ?></div><?php endif; ?>

      <div class="pqea-panel">
        <h2>Current status</h2>
        <span class="pqea-badge <?php echo $status === 'approved' ? '' : 'pqea-badge--pending'; ?>"><?php echo $status === 'approved' ? 'Approved' : 'Pending parent approval'; ?></span>
      </div>

      <div class="pqea-panel">
        <h2>Declaration</h2>
        <p>By approving, I confirm that I am the parent or guardian for this student and I allow the student to be enrolled in <?php echo s($pqea_brand); ?> lessons.</p>
        <ul>
          <li>I understand lessons may include live classes, teacher feedback, progress tracking, and learning reports.</li>
          <li>I understand lesson audio is recorded for safeguarding, class quality, parent/teacher review, quiz and learning support, and compliance review.</li>
          <li>I understand video/camera recording remains consent-controlled and can be limited unless video consent has been granted.</li>
        </ul>
      </div>

      <?php if ($status !== 'approved'): ?>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <label class="pqea-check">
            <input type="checkbox" name="approve_enrollment" value="1">
            <span>I approve this student's enrollment and understand how lessons, progress, audio recording, and consent-controlled video are used.</span>
          </label>
          <label>
            <span style="display:block;margin-bottom:6px;font-weight:950;color:#415665">Optional approval note</span>
            <textarea class="pqea-textarea" name="approval_notes" placeholder="Optional"></textarea>
          </label>
          <div class="pqea-actions">
            <button class="pqea-btn" type="submit">Approve enrollment</button>
            <a class="pqea-btn pqea-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Back to dashboard</a>
          </div>
        </form>
      <?php else: ?>
        <div class="pqea-actions">
          <a class="pqea-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Back to dashboard</a>
        </div>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
