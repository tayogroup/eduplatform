<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

$sessionid = required_param('sessionid', PARAM_INT);

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can complete live-session quality review.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => $sessionid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Session Quality Review');
$PAGE->set_heading('Live Session Quality Review');
$PAGE->add_body_class('pqh-live-quality-page');

function pqlq_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlq_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlq_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlq_required_ready(): bool {
    return pqlq_table_exists('local_prequran_live_session')
        && pqlq_table_exists('local_prequran_live_participant')
        && pqlq_table_exists('local_prequran_live_attendance')
        && pqlq_table_exists('local_prequran_live_note')
        && pqlq_table_exists('local_prequran_live_recording')
        && pqlq_table_exists('local_prequran_live_audit')
        && pqlq_column_exists('local_prequran_live_session', 'qa_status')
        && pqlq_column_exists('local_prequran_live_session', 'qa_checklist');
}

function pqlq_clean_text(string $value, int $max = 3000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlq_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlq_audit(int $sessionid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqlq_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'session',
        'targetid' => $sessionid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlq_items(): array {
    return [
        'teacher_on_time' => 'Teacher joined and started on time',
        'student_safety' => 'Child safety and privacy expectations followed',
        'appropriate_interaction' => 'Teacher-student interaction was appropriate and respectful',
        'lesson_reviewed' => 'Target pre-Quran lesson was reviewed',
        'arabic_practice_quality' => 'Arabic letter or pre-Quran practice quality was strong',
        'interactive_tools' => 'Whiteboard, screen share, or class tools were used effectively',
        'student_participation' => 'Students had meaningful chances to participate',
        'parent_summary_ready' => 'Parent-visible summaries were completed',
        'recording_reviewed' => 'Recording reviewed if available',
        'technical_quality' => 'Audio/video and classroom flow were acceptable',
    ];
}

function pqlq_decode_checklist($session): array {
    $items = array_fill_keys(array_keys(pqlq_items()), 'not_checked');
    $raw = trim((string)($session->qa_checklist ?? ''));
    if ($raw === '') {
        return $items;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $items;
    }
    foreach ($items as $key => $default) {
        $value = isset($decoded[$key]) ? (string)$decoded[$key] : $default;
        $items[$key] = in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true) ? $value : $default;
    }
    return $items;
}

function pqlq_score(array $checklist): int {
    $scored = 0;
    $passed = 0;
    foreach ($checklist as $value) {
        if ($value === 'not_applicable') {
            continue;
        }
        $scored++;
        if ($value === 'pass') {
            $passed++;
        }
    }
    if ($scored === 0) {
        return 0;
    }
    return (int)round(($passed / $scored) * 100);
}

if (!pqlq_required_ready()) {
    throw new moodle_exception('missingfield', 'error', '', 'Run Phase 30 live quality SQL first.');
}

$session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', MUST_EXIST);
$notice = optional_param('result', '', PARAM_ALPHANUMEXT);
$coachingready = pqlq_column_exists('local_prequran_live_session', 'qa_coaching_status');
$leadershipready = pqlq_column_exists('local_prequran_live_session', 'leadership_review_status');

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'save_quality') {
    require_sesskey();
    $oldstatus = (string)($session->qa_status ?? 'not_reviewed');
    $oldcoachingstatus = (string)($session->qa_coaching_status ?? 'none');
    $oldleadershipstatus = (string)($session->leadership_review_status ?? 'none');
    $status = optional_param('qa_status', 'not_reviewed', PARAM_ALPHANUMEXT);
    if (!in_array($status, ['not_reviewed', 'passed', 'needs_coaching', 'serious_issue'], true)) {
        $status = 'not_reviewed';
    }
    $checklist = [];
    foreach (pqlq_items() as $key => $label) {
        $value = optional_param('qa_' . $key, 'not_checked', PARAM_ALPHANUMEXT);
        if (!in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true)) {
            $value = 'not_checked';
        }
        $checklist[$key] = $value;
    }
    $score = pqlq_score($checklist);
    $session->qa_status = $status;
    $session->qa_score = $score;
    $session->qa_checklist = json_encode($checklist);
    $session->qa_notes = pqlq_clean_text(optional_param('qa_notes', '', PARAM_RAW), 4000);
    $session->qa_coaching_notes = pqlq_clean_text(optional_param('qa_coaching_notes', '', PARAM_RAW), 4000);
    if ($coachingready) {
        $coachingstatus = optional_param('qa_coaching_status', 'none', PARAM_ALPHANUMEXT);
        if (!in_array($coachingstatus, ['none', 'assigned', 'acknowledged', 'completed'], true)) {
            $coachingstatus = 'none';
        }
        $priority = optional_param('qa_coaching_priority', 'normal', PARAM_ALPHANUMEXT);
        if (!in_array($priority, ['low', 'normal', 'high'], true)) {
            $priority = 'normal';
        }
        $duedate = optional_param('qa_coaching_due_date', '', PARAM_TEXT);
        $duetime = trim($duedate) !== '' ? strtotime($duedate . ' 23:59:59 ' . core_date::get_server_timezone()) : 0;
        $session->qa_coaching_status = $coachingstatus;
        $session->qa_coaching_priority = $priority;
        $session->qa_coaching_due_date = $duetime ?: 0;
        if ($coachingstatus === 'completed' && empty($session->qa_coaching_completedat)) {
            $session->qa_coaching_completedby = (int)$USER->id;
            $session->qa_coaching_completedat = time();
        } else if ($coachingstatus !== 'completed') {
            $session->qa_coaching_completedby = 0;
            $session->qa_coaching_completedat = 0;
        }
        if ($coachingstatus === 'none') {
            $session->qa_coaching_ackby = 0;
            $session->qa_coaching_ackat = 0;
        }
    }
    if ($leadershipready) {
        $leadershipstatus = optional_param('leadership_review_status', 'none', PARAM_ALPHANUMEXT);
        if (!in_array($leadershipstatus, ['none', 'flagged', 'in_review', 'cleared'], true)) {
            $leadershipstatus = 'none';
        }
        $session->leadership_review_status = $leadershipstatus;
        $session->leadership_review_reason = pqlq_clean_text(optional_param('leadership_review_reason', '', PARAM_RAW), 4000);
        $session->leadership_review_notes = pqlq_clean_text(optional_param('leadership_review_notes', '', PARAM_RAW), 4000);
        if ($leadershipstatus !== 'none' && $leadershipstatus !== 'cleared') {
            $session->leadership_reviewby = (int)$USER->id;
            $session->leadership_reviewat = time();
            $session->leadership_clearedby = 0;
            $session->leadership_clearedat = 0;
        } else if ($leadershipstatus === 'cleared') {
            $session->leadership_clearedby = (int)$USER->id;
            $session->leadership_clearedat = time();
        } else {
            $session->leadership_reviewby = 0;
            $session->leadership_reviewat = 0;
            $session->leadership_clearedby = 0;
            $session->leadership_clearedat = 0;
        }
    }
    $session->qa_reviewedby = (int)$USER->id;
    $session->qa_reviewedat = time();
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    $action = 'quality_review_saved';
    if ($status === 'passed') {
        $action = 'quality_review_passed';
    } else if ($status === 'needs_coaching') {
        $action = 'quality_review_needs_coaching';
    } else if ($status === 'serious_issue') {
        $action = 'quality_review_serious_issue';
    }
    pqlq_audit($sessionid, $action, [
        'oldstatus' => $oldstatus,
        'newstatus' => $status,
        'score' => $score,
    ]);
    if ($coachingready && (string)$session->qa_coaching_status !== $oldcoachingstatus) {
        $coachingaction = 'quality_coaching_updated';
        if ((string)$session->qa_coaching_status === 'assigned') {
            $coachingaction = 'quality_coaching_assigned';
        } else if ((string)$session->qa_coaching_status === 'completed') {
            $coachingaction = 'quality_coaching_completed';
        }
        pqlq_audit($sessionid, $coachingaction, [
            'oldstatus' => $oldcoachingstatus,
            'newstatus' => (string)$session->qa_coaching_status,
            'priority' => (string)($session->qa_coaching_priority ?? 'normal'),
            'due' => (int)($session->qa_coaching_due_date ?? 0),
        ]);
    }
    if ($leadershipready && (string)$session->leadership_review_status !== $oldleadershipstatus) {
        $leadershipaction = 'leadership_review_updated';
        if (in_array((string)$session->leadership_review_status, ['flagged', 'in_review'], true)) {
            $leadershipaction = 'leadership_review_flagged';
        } else if ((string)$session->leadership_review_status === 'cleared') {
            $leadershipaction = 'leadership_review_cleared';
        }
        pqlq_audit($sessionid, $leadershipaction, [
            'oldstatus' => $oldleadershipstatus,
            'newstatus' => (string)$session->leadership_review_status,
            'reason' => (string)($session->leadership_review_reason ?? ''),
        ]);
    }
    redirect(new moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => $sessionid, 'result' => 'saved']));
}

$session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', MUST_EXIST);
$coachingready = pqlq_column_exists('local_prequran_live_session', 'qa_coaching_status');
$leadershipready = pqlq_column_exists('local_prequran_live_session', 'leadership_review_status');
$teachername = pqlq_user_name((int)$session->teacherid, 'Teacher ' . (int)$session->teacherid);
$checklist = pqlq_decode_checklist($session);
$students = array_values($DB->get_records_sql(
    "SELECT p.*,
            a.attendance_status,
            a.technical_issue,
            n.visible_to_parent,
            n.parent_summary,
            n.private_note,
            n.followup_status,
            n.followup_resolved
       FROM {local_prequran_live_participant} p
  LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = p.sessionid AND a.studentid = p.studentid
  LEFT JOIN {local_prequran_live_note} n ON n.sessionid = p.sessionid AND n.studentid = p.studentid
      WHERE p.sessionid = :sessionid
        AND p.role = :role
        AND p.status = :status
   ORDER BY p.displayname ASC, p.userid ASC",
    ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active']
));
$recordings = array_values($DB->get_records('local_prequran_live_recording', ['sessionid' => $sessionid], 'timemodified DESC, id DESC'));
$auditrows = array_values($DB->get_records_sql(
    "SELECT *
       FROM {local_prequran_live_audit}
      WHERE sessionid = :sessionid
        AND action IN (
            'quality_review_saved',
            'quality_review_passed',
            'quality_review_needs_coaching',
            'quality_review_serious_issue',
            'quality_coaching_assigned',
            'quality_coaching_acknowledged',
            'quality_coaching_completed',
            'quality_coaching_updated',
            'leadership_review_flagged',
            'leadership_review_updated',
            'leadership_review_cleared'
        )
   ORDER BY timecreated DESC, id DESC",
    ['sessionid' => $sessionid],
    0,
    20
));

echo $OUTPUT->header();
?>
<style>
body.pqh-live-quality-page header,
body.pqh-live-quality-page footer,
body.pqh-live-quality-page nav.navbar,
body.pqh-live-quality-page #page-header,
body.pqh-live-quality-page #page-footer,
body.pqh-live-quality-page .drawer,
body.pqh-live-quality-page .drawer-toggles,
body.pqh-live-quality-page .block-region,
body.pqh-live-quality-page [data-region="drawer"],
body.pqh-live-quality-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-quality-page #page,
body.pqh-live-quality-page #page-content,
body.pqh-live-quality-page #region-main,
body.pqh-live-quality-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlq-shell{min-height:100vh;padding:30px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlq-wrap{max-width:1180px;margin:0 auto}
.pqlq-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlq-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;letter-spacing:0}
.pqlq-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlq-actions{display:flex;flex-wrap:wrap;gap:8px}
.pqlq-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlq-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlq-btn--brown{background:#6f4e32}
.pqlq-coaching{padding:14px;border:1px solid rgba(122,84,47,.2);border-radius:10px;background:#fffaf2}
.pqlq-alert{margin-bottom:14px;padding:12px 14px;border-radius:10px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-weight:900}
.pqlq-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
.pqlq-metric{padding:16px;background:#fff;border:1px solid rgba(23,48,68,.1);border-radius:10px}
.pqlq-metric strong{display:block;font-size:24px;color:#7a542f}
.pqlq-metric span{display:block;margin-top:6px;color:#5e7280;font-size:13px;font-weight:850}
.pqlq-panel{margin-bottom:16px;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.1);border-radius:10px}
.pqlq-panel h2{margin:0 0 12px;font-size:20px;font-weight:950}
.pqlq-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pqlq-field{margin-bottom:12px}
.pqlq-field label,.pqlq-item strong{display:block;margin-bottom:5px;color:#40586a;font-size:12px;font-weight:950;text-transform:uppercase}
.pqlq-select,.pqlq-textarea{width:100%;min-height:40px;padding:9px 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font:800 14px/1.35 system-ui}
.pqlq-textarea{min-height:100px;resize:vertical}
.pqlq-checklist{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pqlq-item{padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#f9fbfc}
.pqlq-pill{display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlq-pill--warn{background:#fff0dc;color:#7a542f}
.pqlq-pill--bad{background:#ffe9e4;color:#8b2d22}
.pqlq-table{width:100%;border-collapse:collapse;background:#fff}
.pqlq-table th,.pqlq-table td{padding:10px 9px;border-bottom:1px solid rgba(23,48,68,.08);text-align:left;vertical-align:top;font-size:13px}
.pqlq-table th{color:#40586a;background:#f8fafb;font-weight:950}
.pqlq-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850}
@media(max-width:900px){.pqlq-top{display:block}.pqlq-actions{margin-top:12px}.pqlq-metrics,.pqlq-grid,.pqlq-checklist{grid-template-columns:1fr}}
</style>
<main class="pqlq-shell">
  <div class="pqlq-wrap">
    <section class="pqlq-top">
      <div>
        <h1 class="pqlq-title">Live Session Quality Review</h1>
        <p class="pqlq-sub"><?php echo s((string)$session->title); ?> - <?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?> - <?php echo s($teachername); ?></p>
      </div>
      <div class="pqlq-actions">
        <a class="pqlq-btn pqlq-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', ['sessionid' => $sessionid]))->out(false); ?>">Class review</a>
        <a class="pqlq-btn pqlq-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php'))->out(false); ?>">Leadership</a>
        <a class="pqlq-btn pqlq-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings_admin.php'))->out(false); ?>">Recordings</a>
        <a class="pqlq-btn pqlq-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Live ops</a>
        <a class="pqlq-btn pqlq-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php'))->out(false); ?>">Reports</a>
      </div>
    </section>

    <?php if ($notice === 'saved'): ?><div class="pqlq-alert">Quality review saved.</div><?php endif; ?>

    <section class="pqlq-metrics">
      <div class="pqlq-metric"><strong><?php echo s((string)($session->qa_status ?? 'not_reviewed')); ?></strong><span>QA status</span></div>
      <div class="pqlq-metric"><strong><?php echo (int)($session->qa_score ?? 0); ?>%</strong><span>QA score</span></div>
      <div class="pqlq-metric"><strong><?php echo count($students); ?></strong><span>students</span></div>
      <div class="pqlq-metric"><strong><?php echo $leadershipready ? s(str_replace('_', ' ', (string)($session->leadership_review_status ?? 'none'))) : count($recordings); ?></strong><span><?php echo $leadershipready ? 'leadership review' : 'recordings'; ?></span></div>
    </section>

    <form method="post">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <input type="hidden" name="action" value="save_quality">

      <section class="pqlq-panel">
        <h2>Quality Outcome</h2>
        <div class="pqlq-grid">
          <div class="pqlq-field">
            <label for="qa_status">QA Status</label>
            <select class="pqlq-select" id="qa_status" name="qa_status">
              <?php foreach (['not_reviewed' => 'Not reviewed', 'passed' => 'Passed', 'needs_coaching' => 'Needs coaching', 'serious_issue' => 'Serious issue'] as $value => $label): ?>
                <option value="<?php echo s($value); ?>" <?php echo (string)($session->qa_status ?? 'not_reviewed') === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="pqlq-field">
            <label>Last Reviewed</label>
            <div class="pqlq-pill"><?php echo !empty($session->qa_reviewedat) ? s(userdate((int)$session->qa_reviewedat, get_string('strftimedatetimeshort')) . ' by ' . pqlq_user_name((int)$session->qa_reviewedby, 'User ' . (int)$session->qa_reviewedby)) : 'Not reviewed yet'; ?></div>
          </div>
        </div>
      </section>

      <section class="pqlq-panel">
        <h2>Checklist</h2>
        <div class="pqlq-checklist">
          <?php foreach (pqlq_items() as $key => $label): ?>
            <div class="pqlq-item">
              <strong><?php echo s($label); ?></strong>
              <select class="pqlq-select" name="qa_<?php echo s($key); ?>">
                <?php foreach (['not_checked' => 'Not checked', 'pass' => 'Pass', 'concern' => 'Concern', 'not_applicable' => 'N/A'] as $value => $option): ?>
                  <option value="<?php echo s($value); ?>" <?php echo ($checklist[$key] ?? 'not_checked') === $value ? 'selected' : ''; ?>><?php echo s($option); ?></option>
                <?php endforeach; ?>
              </select>
            </div>
          <?php endforeach; ?>
        </div>
      </section>

      <section class="pqlq-panel">
        <h2>Notes</h2>
        <div class="pqlq-grid">
          <div class="pqlq-field">
            <label for="qa_notes">Quality Notes</label>
            <textarea class="pqlq-textarea" id="qa_notes" name="qa_notes"><?php echo s((string)($session->qa_notes ?? '')); ?></textarea>
          </div>
          <div class="pqlq-field">
            <label for="qa_coaching_notes">Coaching Notes</label>
            <textarea class="pqlq-textarea" id="qa_coaching_notes" name="qa_coaching_notes"><?php echo s((string)($session->qa_coaching_notes ?? '')); ?></textarea>
          </div>
        </div>
        <?php if ($coachingready): ?>
          <div class="pqlq-coaching">
            <h2>Teacher Coaching Loop</h2>
            <div class="pqlq-grid">
              <div class="pqlq-field">
                <label for="qa_coaching_status">Coaching Status</label>
                <select class="pqlq-select" id="qa_coaching_status" name="qa_coaching_status">
                  <?php foreach (['none' => 'No coaching', 'assigned' => 'Assigned', 'acknowledged' => 'Acknowledged', 'completed' => 'Completed'] as $value => $label): ?>
                    <option value="<?php echo s($value); ?>" <?php echo (string)($session->qa_coaching_status ?? 'none') === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="pqlq-field">
                <label for="qa_coaching_priority">Priority</label>
                <select class="pqlq-select" id="qa_coaching_priority" name="qa_coaching_priority">
                  <?php foreach (['low' => 'Low', 'normal' => 'Normal', 'high' => 'High'] as $value => $label): ?>
                    <option value="<?php echo s($value); ?>" <?php echo (string)($session->qa_coaching_priority ?? 'normal') === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="pqlq-field">
                <label for="qa_coaching_due_date">Due Date</label>
                <input class="pqlq-select" id="qa_coaching_due_date" type="date" name="qa_coaching_due_date" value="<?php echo !empty($session->qa_coaching_due_date) ? s(date('Y-m-d', (int)$session->qa_coaching_due_date)) : ''; ?>">
              </div>
              <div class="pqlq-field">
                <label>Teacher Acknowledgement</label>
                <div class="pqlq-pill"><?php echo !empty($session->qa_coaching_ackat) ? s(userdate((int)$session->qa_coaching_ackat, get_string('strftimedatetimeshort')) . ' by ' . pqlq_user_name((int)$session->qa_coaching_ackby, 'User ' . (int)$session->qa_coaching_ackby)) : 'Not acknowledged'; ?></div>
              </div>
            </div>
          </div>
        <?php endif; ?>
        <?php if ($leadershipready): ?>
          <div class="pqlq-coaching" style="margin-top:14px">
            <h2>Leadership Review</h2>
            <div class="pqlq-grid">
              <div class="pqlq-field">
                <label for="leadership_review_status">Leadership Status</label>
                <select class="pqlq-select" id="leadership_review_status" name="leadership_review_status">
                  <?php foreach (['none' => 'No leadership review', 'flagged' => 'Flagged', 'in_review' => 'In review', 'cleared' => 'Cleared'] as $value => $label): ?>
                    <option value="<?php echo s($value); ?>" <?php echo (string)($session->leadership_review_status ?? 'none') === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="pqlq-field">
                <label>Review Timeline</label>
                <div class="pqlq-pill">
                  <?php if (!empty($session->leadership_reviewat)): ?>
                    <?php echo s('Flagged ' . userdate((int)$session->leadership_reviewat, get_string('strftimedatetimeshort')) . ' by ' . pqlq_user_name((int)$session->leadership_reviewby, 'User ' . (int)$session->leadership_reviewby)); ?>
                  <?php elseif (!empty($session->leadership_clearedat)): ?>
                    <?php echo s('Cleared ' . userdate((int)$session->leadership_clearedat, get_string('strftimedatetimeshort')) . ' by ' . pqlq_user_name((int)$session->leadership_clearedby, 'User ' . (int)$session->leadership_clearedby)); ?>
                  <?php else: ?>
                    No leadership review activity
                  <?php endif; ?>
                </div>
              </div>
              <div class="pqlq-field">
                <label for="leadership_review_reason">Leadership Review Reason</label>
                <textarea class="pqlq-textarea" id="leadership_review_reason" name="leadership_review_reason"><?php echo s((string)($session->leadership_review_reason ?? '')); ?></textarea>
              </div>
              <div class="pqlq-field">
                <label for="leadership_review_notes">Leadership Notes</label>
                <textarea class="pqlq-textarea" id="leadership_review_notes" name="leadership_review_notes"><?php echo s((string)($session->leadership_review_notes ?? '')); ?></textarea>
              </div>
            </div>
          </div>
        <?php endif; ?>
        <button class="pqlq-btn pqlq-btn--brown" type="submit">Save quality review</button>
      </section>
    </form>

    <section class="pqlq-panel">
      <h2>Class Evidence</h2>
      <table class="pqlq-table">
        <thead><tr><th>Student</th><th>Attendance</th><th>Parent Summary</th><th>Follow-Up</th></tr></thead>
        <tbody>
          <?php foreach ($students as $student): ?>
            <?php $studentid = (int)($student->studentid ?: $student->userid); ?>
            <tr>
              <td><?php echo s(pqlq_user_name($studentid, (string)$student->displayname ?: 'Student ' . $studentid)); ?></td>
              <td><?php echo s((string)($student->attendance_status ?? 'not marked')); ?><?php echo !empty($student->technical_issue) ? ' - technical issue' : ''; ?></td>
              <td><?php echo !empty($student->visible_to_parent) && trim((string)($student->parent_summary ?? '')) !== '' ? 'Ready' : 'Missing'; ?></td>
              <td><?php echo s((string)($student->followup_status ?? 'none')); ?><?php echo !empty($student->followup_resolved) ? ' - resolved' : ''; ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$students): ?><tr><td colspan="4">No active students found.</td></tr><?php endif; ?>
        </tbody>
      </table>

      <h2 style="margin-top:18px">Recordings</h2>
      <table class="pqlq-table">
        <thead><tr><th>Name</th><th>Status</th><th>Parent Visible</th><th>Reviewed</th><th>Playback</th></tr></thead>
        <tbody>
          <?php foreach ($recordings as $recording): ?>
            <tr>
              <td><?php echo s((string)$recording->name); ?></td>
              <td><?php echo s((string)$recording->status); ?></td>
              <td><?php echo !empty($recording->visible_to_parent) ? 'Yes' : 'No'; ?></td>
              <td><?php echo !empty($recording->reviewedat) ? s(userdate((int)$recording->reviewedat, get_string('strftimedatetimeshort'))) : 'No'; ?></td>
              <td><?php echo trim((string)$recording->playback_url) !== '' ? '<a class="pqlq-btn pqlq-btn--light" href="' . s((string)$recording->playback_url) . '" target="_blank" rel="noopener">Open</a>' : ''; ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$recordings): ?><tr><td colspan="5">No recordings found for this session.</td></tr><?php endif; ?>
        </tbody>
      </table>
    </section>

    <section class="pqlq-panel">
      <h2>QA Audit</h2>
      <?php if (!$auditrows): ?>
        <div class="pqlq-empty">No QA audit rows yet.</div>
      <?php else: ?>
        <table class="pqlq-table">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            <?php foreach ($auditrows as $row): ?>
              <tr>
                <td><?php echo s(userdate((int)$row->timecreated, get_string('strftimedatetimeshort'))); ?></td>
                <td><?php echo s(pqlq_user_name((int)$row->actorid, 'User ' . (int)$row->actorid)); ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$row->action)); ?></td>
                <td><?php echo s((string)$row->details); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
