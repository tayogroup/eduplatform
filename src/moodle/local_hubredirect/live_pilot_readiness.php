<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations('Only academy operations users can view Live BBB pilot readiness.');

function pqlpr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlpr_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlpr_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlpr_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlpr_action_count(array $actions): int {
    global $DB;
    if (!$actions || !pqlpr_table_exists('local_prequran_live_audit')) {
        return 0;
    }
    [$actionsql, $params] = $DB->get_in_or_equal($actions, SQL_PARAMS_NAMED, 'pqlpraction');
    return pqlpr_count_sql("SELECT COUNT(1) FROM {local_prequran_live_audit} WHERE action {$actionsql}", $params);
}

function pqlpr_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email,username', IGNORE_MISSING) : null;
    if (!$user) {
        return 'User ' . $userid;
    }
    return fullname($user) . ' (' . (string)$user->username . ')';
}

function pqlpr_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqlpr_row(string $check, bool $ok, int $count, string $note): array {
    return [
        'check' => $check,
        'status' => $ok ? 'PASS' : 'FAIL',
        'count' => $count,
        'note' => $note,
    ];
}

function pqlpr_stale_active_sqa_sessions(int $cutoff): array {
    global $DB;
    if (!pqlpr_table_exists('local_prequran_live_session')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT id, title, teacherid, status, scheduled_start, scheduled_end
           FROM {local_prequran_live_session}
          WHERE scheduled_end < :cutoff
            AND status IN ('scheduled', 'live', 'awaiting_review')
            AND (
                title LIKE :titlea
                OR title LIKE :titleb
                OR title LIKE :titlec
                OR bbb_meeting_id LIKE :meeting
            )
       ORDER BY scheduled_end ASC, id ASC",
        [
            'cutoff' => $cutoff,
            'titlea' => 'SQA BBB%',
            'titleb' => 'Automated SQA Teacher Portal Class%',
            'titlec' => '%live-bbb-%',
            'meeting' => '%live-bbb-%',
        ],
        0,
        50
    ));
}

function pqlpr_stale_active_sqa_users(int $cutoff): array {
    global $DB;
    return array_values($DB->get_records_sql(
        "SELECT id, username, email, suspended, deleted, timecreated, timemodified
           FROM {user}
          WHERE deleted = 0
            AND suspended = 0
            AND COALESCE(timemodified, timecreated) < :cutoff
            AND (
                username LIKE :teacher
                OR username LIKE :student
                OR username LIKE :parent
                OR email LIKE :teachermail
                OR email LIKE :studentmail
                OR email LIKE :parentmail
            )
       ORDER BY timecreated ASC, id ASC",
        [
            'cutoff' => $cutoff,
            'teacher' => 'teacher.%',
            'student' => 'student.portal.%',
            'parent' => 'parent.portal.%',
            'teachermail' => 'teacher.%@example.test',
            'studentmail' => 'student.portal.%@example.test',
            'parentmail' => 'parent.portal.%@example.test',
        ],
        0,
        50
    ));
}

function pqlpr_stale_active_parent_links(int $cutoff): array {
    global $DB;
    if (!pqlpr_table_exists('local_prequran_comm_consent')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.studentid, c.guardianid, c.consent_source, c.parent_visible, c.timemodified
           FROM {local_prequran_comm_consent} c
           JOIN {user} su ON su.id = c.studentid
      LEFT JOIN {user} pu ON pu.id = c.guardianid
          WHERE c.parent_visible = 1
            AND COALESCE(c.timemodified, 0) < :cutoff
            AND (
                c.consent_source IN ('sqa_teacher_portal_fixture', 'manual_parent_student_link')
                OR su.username LIKE :student
                OR pu.username LIKE :parent
            )
       ORDER BY c.timemodified ASC, c.id ASC",
        [
            'cutoff' => $cutoff,
            'student' => 'student.portal.%',
            'parent' => 'parent.portal.%',
        ],
        0,
        50
    ));
}

$now = time();
$staleafter = optional_param('staleafter', 15, PARAM_INT);
$staleafter = max(5, min(1440, $staleafter));
$cutoff = $now - ($staleafter * MINSECS);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);

$requiredtables = [
    'local_prequran_live_session',
    'local_prequran_live_participant',
    'local_prequran_live_attendance',
    'local_prequran_live_note',
    'local_prequran_live_recording',
    'local_prequran_live_consent',
    'local_prequran_live_audit',
];
$tablecount = 0;
foreach ($requiredtables as $table) {
    $tablecount += pqlpr_table_exists($table) ? 1 : 0;
}

$bbbbase = trim((string)get_config('local_prequran', 'bbb_base_url'));
$bbbsecret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
$sessioncount = pqlpr_table_exists('local_prequran_live_session')
    ? pqlpr_count_sql("SELECT COUNT(1) FROM {local_prequran_live_session}")
    : 0;
$reportablecount = pqlpr_table_exists('local_prequran_live_session')
    ? pqlpr_count_sql("SELECT COUNT(1) FROM {local_prequran_live_session} WHERE status IN ('completed', 'cancelled', 'archived', 'awaiting_review', 'live', 'scheduled')")
    : 0;
$auditcount = pqlpr_table_exists('local_prequran_live_audit')
    ? pqlpr_count_sql("SELECT COUNT(1) FROM {local_prequran_live_audit}")
    : 0;
$seriescount = pqlpr_action_count(['series_created', 'series_created_from_wizard', 'series_session_created']);
$reviewcount = pqlpr_action_count(['review_saved', 'session_completed', 'homework_published', 'live_summary_published', 'parent_followup_requested']);
$trustcount = pqlpr_action_count(['parent_trust_preview_opened', 'parent_trust_support_case_logged', 'parent_trust_purge_review_requested', 'parent_trust_purge_review_rejected', 'parent_trust_purge_blocked']);
$qualitycount = pqlpr_action_count(['quality_review_saved', 'quality_review_needs_coaching', 'quality_review_serious_issue', 'leadership_review_updated', 'leadership_review_cleared', 'improvement_plan_assigned', 'improvement_plan_updated']);
$resiliencecount = pqlpr_action_count(['series_single_session_cancelled', 'series_cancelled', 'session_cancelled']);
$consentcount = pqlpr_action_count(['availability_updated', 'grouping_profile_saved', 'student_parent_linked']);
$backupcount = pqlpr_table_exists('local_prequran_backup_check')
    ? pqlpr_count_sql("SELECT COUNT(1) FROM {local_prequran_backup_check}")
    : 0;

$stalesessions = pqlpr_stale_active_sqa_sessions($cutoff);
$staleusers = pqlpr_stale_active_sqa_users($cutoff);
$stalelinks = pqlpr_stale_active_parent_links($cutoff);

$rows = [
    pqlpr_row('phase 1 operations diagnostics readiness', $tablecount === count($requiredtables) && $bbbbase !== '' && $bbbsecret !== '', $tablecount, 'Live tables and BBB configuration are present.'),
    pqlpr_row('phase 2-4 lifecycle evidence', $sessioncount > 0 && ($reviewcount > 0 || pqlpr_action_count(['bbb_created', 'join_redirect']) > 0), $sessioncount, 'Sessions, bridge, review, parent visibility, and diagnostics evidence are available.'),
    pqlpr_row('phase 5 trust retention evidence', $trustcount > 0, $trustcount, 'Parent trust, retention, purge-review, or review-pack evidence is present.'),
    pqlpr_row('phase 6 instructional readiness evidence', pqlpr_table_exists('local_prequran_live_session') && pqlpr_column_exists('local_prequran_live_session', 'agenda_slides_path'), pqlpr_column_exists('local_prequran_live_session', 'agenda_slides_path') ? 1 : 0, 'Live guide/materials readiness columns are deployed.'),
    pqlpr_row('phase 7 quality leadership evidence', $qualitycount > 0, $qualitycount, 'QA review, leadership, analytics, or improvement-plan evidence is present.'),
    pqlpr_row('phase 8 scheduling capacity evidence', $seriescount > 0, $seriescount, 'Recurring series scheduling and capacity evidence is present.'),
    pqlpr_row('phase 9 operational resilience evidence', $resiliencecount > 0, $resiliencecount, 'Cancellation, direct URL block, or resilience audit evidence is present.'),
    pqlpr_row('phase 10 backup DR evidence', $backupcount > 0, $backupcount, 'Backup/DR readiness checks are recorded.'),
    pqlpr_row('phase 11 retention controls evidence', pqlpr_action_count(['parent_trust_purge_review_requested', 'parent_trust_purge_review_rejected', 'parent_trust_purge_blocked']) > 0, pqlpr_action_count(['parent_trust_purge_review_requested', 'parent_trust_purge_review_rejected', 'parent_trust_purge_blocked']), 'Guarded purge and retention review controls are evidenced.'),
    pqlpr_row('phase 12 consent grouping evidence', $consentcount > 0, $consentcount, 'Teacher availability, grouping consent, or parent-link evidence is present.'),
    pqlpr_row('no stale active SQA sessions', count($stalesessions) === 0, count($stalesessions), 'No expired generated BBB sessions remain scheduled, live, or awaiting review.'),
    pqlpr_row('no stale active SQA users', count($staleusers) === 0, count($staleusers), 'No generated teacher/student/parent accounts remain active beyond the grace window.'),
    pqlpr_row('no stale active SQA parent links', count($stalelinks) === 0, count($stalelinks), 'No generated parent links remain parent-visible beyond the grace window.'),
    pqlpr_row('final BBB readiness export', true, 1, 'This rollup can export CSV evidence for the pilot readiness package.'),
];
$failures = array_values(array_filter($rows, fn(array $row): bool => $row['status'] !== 'PASS'));

if ($export === 'csv') {
    $csvrows = [];
    foreach ($rows as $row) {
        $csvrows[] = [$row['check'], $row['status'], $row['count'], $row['note']];
    }
    $csvrows[] = ['generated_at', 'INFO', $now, userdate($now, get_string('strftimedatetimeshort'))];
    $csvrows[] = ['stale_grace_minutes', 'INFO', $staleafter, 'Generated records older than this must be archived or inactive.'];
    pqlpr_csv('quraan-live-bbb-pilot-readiness.csv', ['check', 'status', 'count', 'note'], $csvrows);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_pilot_readiness.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live BBB Pilot Readiness');
$PAGE->set_heading('Live BBB Pilot Readiness');
$PAGE->add_body_class('pqh-live-pilot-readiness-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-live-pilot-readiness-page header,
body.pqh-live-pilot-readiness-page footer,
body.pqh-live-pilot-readiness-page nav.navbar,
body.pqh-live-pilot-readiness-page #page-header,
body.pqh-live-pilot-readiness-page #page-footer,
body.pqh-live-pilot-readiness-page .drawer,
body.pqh-live-pilot-readiness-page .drawer-toggles,
body.pqh-live-pilot-readiness-page .block-region,
body.pqh-live-pilot-readiness-page [data-region="drawer"],
body.pqh-live-pilot-readiness-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-pilot-readiness-page #page,
body.pqh-live-pilot-readiness-page #page-content,
body.pqh-live-pilot-readiness-page #region-main,
body.pqh-live-pilot-readiness-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlpr-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlpr-wrap{max-width:1180px;margin:0 auto}
.pqlpr-top,.pqlpr-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlpr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlpr-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlpr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlpr-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlpr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlpr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlpr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlpr-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlpr-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlpr-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlpr-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlpr-table th,.pqlpr-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlpr-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqlpr-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#edf9ef;color:#245c35}
.pqlpr-pill--bad{background:#fff0ed;color:#883526}
.pqlpr-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqlpr-list{margin:0;padding-left:18px;color:#415665;font-size:13px;font-weight:750}
@media(max-width:900px){.pqlpr-top{display:block}.pqlpr-actions{margin-top:12px}.pqlpr-grid{grid-template-columns:1fr}.pqlpr-table{display:block;overflow:auto}.pqlpr-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlpr-shell">
  <div class="pqlpr-wrap">
    <section class="pqlpr-top pqh-workspace-top">
      <div>
        <h1 class="pqlpr-title pqh-workspace-title">Live BBB Pilot Readiness</h1>
        <p class="pqlpr-sub pqh-workspace-sub">Phase 1-12 evidence rollup, diagnostics/report readiness, stale active SQA cleanup checks, and final BBB readiness export.</p>
      </div>
      <nav class="pqlpr-actions pqh-workspace-actions">
        <a class="pqlpr-btn pqlpr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php'))->out(false); ?>">Reports</a>
        <a class="pqlpr-btn pqlpr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_diagnostics.php'))->out(false); ?>">Diagnostics</a>
        <a class="pqlpr-btn pqlpr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqlpr-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_pilot_readiness.php', ['staleafter' => $staleafter, 'export' => 'csv']))->out(false); ?>">Export CSV</a>
      </nav>
    </section>

    <section class="pqlpr-grid" aria-label="Pilot readiness metrics">
      <div class="pqlpr-metric"><strong><?php echo count($failures); ?></strong><span>failed checks</span></div>
      <div class="pqlpr-metric"><strong><?php echo (int)$reportablecount; ?></strong><span>reportable sessions</span></div>
      <div class="pqlpr-metric"><strong><?php echo (int)$auditcount; ?></strong><span>diagnostic audit rows</span></div>
    </section>

    <section class="pqlpr-panel">
      <h2>Phase Evidence And Cleanup Checks</h2>
      <table class="pqlpr-table">
        <thead><tr><th>Check</th><th>Status</th><th>Count</th><th>Note</th></tr></thead>
        <tbody>
          <?php foreach ($rows as $row): ?>
            <tr>
              <td><?php echo s($row['check']); ?></td>
              <td><span class="pqlpr-pill <?php echo $row['status'] === 'PASS' ? '' : 'pqlpr-pill--bad'; ?>"><?php echo s($row['status']); ?></span></td>
              <td><?php echo (int)$row['count']; ?></td>
              <td><?php echo s($row['note']); ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>

    <section class="pqlpr-panel" style="margin-top:16px">
      <h2>Stale Active SQA Detail</h2>
      <?php if (!$stalesessions && !$staleusers && !$stalelinks): ?>
        <p class="pqlpr-sub">No stale active SQA sessions, teachers, students, parents, or parent links were found beyond the <?php echo (int)$staleafter; ?> minute grace window.</p>
      <?php else: ?>
        <ul class="pqlpr-list">
          <?php foreach ($stalesessions as $session): ?>
            <li>Session #<?php echo (int)$session->id; ?> <?php echo s((string)$session->title); ?> is <?php echo s((string)$session->status); ?> for <?php echo s(pqlpr_user_name((int)$session->teacherid)); ?>.</li>
          <?php endforeach; ?>
          <?php foreach ($staleusers as $user): ?>
            <li>User #<?php echo (int)$user->id; ?> <?php echo s((string)$user->username); ?> remains active.</li>
          <?php endforeach; ?>
          <?php foreach ($stalelinks as $link): ?>
            <li>Parent link #<?php echo (int)$link->id; ?> remains parent-visible for student #<?php echo (int)$link->studentid; ?> and parent #<?php echo (int)$link->guardianid; ?>.</li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </section>

    <script type="application/json" id="pqlpr-result"><?php echo json_encode([
      'generated_at' => $now,
      'stale_grace_minutes' => $staleafter,
      'failed_checks' => count($failures),
      'reportable_sessions' => $reportablecount,
      'audit_rows' => $auditcount,
      'checks' => $rows,
    ], JSON_UNESCAPED_SLASHES); ?></script>
  </div>
</main>
<?php
echo $OUTPUT->footer();
