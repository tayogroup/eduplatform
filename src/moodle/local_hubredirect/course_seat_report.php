<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_offeringlib.php');

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
    pqh_access_denied('Only workspace admins can view course seat reports.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Course report access required');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_seat_report.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Course Seat Utilization');
$PAGE->set_heading('Course Seat Utilization');
$PAGE->add_body_class('pqcr-page');

$rows = [];
if (pqco_table_ready()) {
    $rows = array_values($DB->get_records_sql(
        "SELECT o.id AS offeringid, o.title, o.course_key, o.capacity, o.status, o.visibility, o.startdate, o.enddate,
                COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS activecount,
                COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pendingcount,
                COUNT(CASE WHEN r.status = 'drop_requested' THEN 1 END) AS droprequestedcount,
                COUNT(CASE WHEN r.status = 'dropped' THEN 1 END) AS droppedcount,
                COUNT(r.id) AS totalrequests
           FROM {local_prequran_course_offering} o
      LEFT JOIN {local_prequran_course_enrol_req} r ON r.offeringid = o.id
          WHERE o.workspaceid = :workspaceid
       GROUP BY o.id, o.title, o.course_key, o.capacity, o.status, o.visibility, o.startdate, o.enddate
       ORDER BY o.status ASC, o.startdate ASC, o.title ASC",
        ['workspaceid' => $workspaceid]
    ));
}

echo $OUTPUT->header();
?>
<style>
body.pqcr-page header,body.pqcr-page footer,body.pqcr-page nav.navbar,body.pqcr-page #page-header,body.pqcr-page #page-footer,body.pqcr-page .drawer,body.pqcr-page .drawer-toggles,body.pqcr-page .block-region,body.pqcr-page [data-region="drawer"],body.pqcr-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcr-page #page,body.pqcr-page #page-content,body.pqcr-page #region-main,body.pqcr-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcr-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcr-wrap{max-width:1240px;margin:0 auto}.pqcr-top,.pqcr-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqcr-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqcr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcr-actions{display:flex;gap:8px;flex-wrap:wrap}.pqcr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950}.pqcr-table{width:100%;border-collapse:collapse}.pqcr-table th,.pqcr-table td{padding:11px 10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqcr-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqcr-name{display:block;color:#221b22;font-weight:950}.pqcr-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqcr-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqcr-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
</style>
<main class="pqcr-shell"><div class="pqcr-wrap">
  <section class="pqcr-top">
    <div><h1 class="pqcr-title"><?php echo s($workspace->name); ?> Seat Utilization</h1><p class="pqcr-sub">Capacity, active enrollments, open seats, pending requests, and dropped counts by offering.</p></div>
    <nav class="pqcr-actions">
      <a class="pqcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false); ?>">Course offerings</a>
      <a class="pqcr-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
    </nav>
  </section>
  <section class="pqcr-panel">
    <?php if (!$rows): ?><div class="pqcr-empty">No offerings found.</div><?php else: ?>
      <table class="pqcr-table"><thead><tr><th>Offering</th><th>Status</th><th>Capacity</th><th>Active</th><th>Open</th><th>Utilization</th><th>Requests</th></tr></thead><tbody>
      <?php foreach ($rows as $row): ?>
        <?php $capacity = (int)$row->capacity; $active = (int)$row->activecount; $open = $capacity <= 0 ? 'Unlimited' : (string)max(0, $capacity - $active); $util = $capacity <= 0 ? 'n/a' : min(100, round(($active / max(1, $capacity)) * 100)) . '%'; ?>
        <tr>
          <td><span class="pqcr-name"><?php echo s((string)$row->title); ?></span><span class="pqcr-muted"><?php echo s((string)$row->course_key); ?> / Offering #<?php echo (int)$row->offeringid; ?></span></td>
          <td><span class="pqcr-pill"><?php echo s((string)$row->status); ?></span><span class="pqcr-pill"><?php echo s((string)$row->visibility); ?></span></td>
          <td><?php echo $capacity <= 0 ? 'Unlimited' : (int)$capacity; ?></td>
          <td><?php echo $active; ?></td>
          <td><?php echo s($open); ?></td>
          <td><?php echo s($util); ?></td>
          <td><span class="pqcr-pill"><?php echo (int)$row->pendingcount; ?> pending</span><span class="pqcr-pill"><?php echo (int)$row->droprequestedcount; ?> drop requested</span><span class="pqcr-pill"><?php echo (int)$row->droppedcount; ?> dropped</span><span class="pqcr-pill"><?php echo (int)$row->totalrequests; ?> total</span></td>
        </tr>
      <?php endforeach; ?>
      </tbody></table>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
