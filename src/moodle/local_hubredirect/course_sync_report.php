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
    pqh_access_denied('Only workspace admins can view course sync reports.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Course report access required');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_sync_report.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Course Moodle Sync Report');
$PAGE->set_heading('Course Moodle Sync Report');
$PAGE->add_body_class('pqcsr-page');

$pending = [];
$linkissues = [];
if (pqco_table_ready()) {
    $pending = array_values($DB->get_records_sql(
        "SELECT r.*, o.title AS offering_title, o.course_key, o.moodlecourseid,
                u.firstname, u.lastname, u.email, u.idnumber,
                c.fullname AS moodle_fullname, c.visible AS moodle_visible,
                e.id AS manualenrolid, e.status AS manualstatus
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {user} u ON u.id = r.studentid
      LEFT JOIN {course} c ON c.id = o.moodlecourseid
      LEFT JOIN {enrol} e ON e.courseid = c.id AND e.enrol = 'manual'
          WHERE r.workspaceid = :workspaceid
            AND r.status = 'approved'
            AND COALESCE(r.moodleenrolledat, 0) = 0
       ORDER BY r.approvedat ASC, r.timecreated ASC",
        ['workspaceid' => $workspaceid],
        0,
        300
    ));
    $linkissues = array_values($DB->get_records_sql(
        "SELECT o.id AS offeringid, o.title, o.course_key, o.moodlecourseid, o.status,
                c.fullname AS moodle_fullname, c.visible AS moodle_visible,
                e.id AS manualenrolid, e.status AS manualstatus
           FROM {local_prequran_course_offering} o
      LEFT JOIN {course} c ON c.id = o.moodlecourseid
      LEFT JOIN {enrol} e ON e.courseid = c.id AND e.enrol = 'manual'
          WHERE o.workspaceid = :workspaceid
            AND (o.moodlecourseid <= 0 OR c.id IS NULL OR c.visible = 0 OR e.id IS NULL OR e.status <> 0)
       ORDER BY o.status ASC, o.title ASC",
        ['workspaceid' => $workspaceid],
        0,
        300
    ));
}

function pqcsr_manual_label($row): string {
    if ((int)($row->moodlecourseid ?? 0) <= 0 || empty($row->moodle_fullname)) {
        return 'Missing Moodle course';
    }
    if ((int)($row->moodle_visible ?? 0) !== 1) {
        return 'Moodle course hidden';
    }
    if (empty($row->manualenrolid)) {
        return 'Manual enrollment missing';
    }
    if ((int)$row->manualstatus !== 0) {
        return 'Manual enrollment disabled';
    }
    return 'Ready';
}

echo $OUTPUT->header();
?>
<style>
body.pqcsr-page header,body.pqcsr-page footer,body.pqcsr-page nav.navbar,body.pqcsr-page #page-header,body.pqcsr-page #page-footer,body.pqcsr-page .drawer,body.pqcsr-page .drawer-toggles,body.pqcsr-page .block-region,body.pqcsr-page [data-region="drawer"],body.pqcsr-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcsr-page #page,body.pqcsr-page #page-content,body.pqcsr-page #region-main,body.pqcsr-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcsr-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcsr-wrap{max-width:1280px;margin:0 auto}.pqcsr-top,.pqcsr-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcsr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqcsr-panel{margin-bottom:14px}.pqcsr-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqcsr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcsr-actions{display:flex;gap:8px;flex-wrap:wrap}.pqcsr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950}.pqcsr-table{width:100%;border-collapse:collapse}.pqcsr-table th,.pqcsr-table td{padding:11px 10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqcsr-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqcsr-name{display:block;color:#221b22;font-weight:950}.pqcsr-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqcsr-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#fff4dc;color:#7a5637;font-size:12px;font-weight:950}.pqcsr-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
</style>
<main class="pqcsr-shell"><div class="pqcsr-wrap">
  <section class="pqcsr-top">
    <div><h1 class="pqcsr-title"><?php echo s($workspace->name); ?> Moodle Sync Report</h1><p class="pqcsr-sub">Approved requests waiting for Moodle enrollment and offerings with linked-course setup issues.</p></div>
    <nav class="pqcsr-actions"><a class="pqcsr-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false); ?>">Course offerings</a><a class="pqcsr-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a></nav>
  </section>
  <section class="pqcsr-panel"><h2>Requests Needing Moodle Sync</h2>
    <?php if (!$pending): ?><div class="pqcsr-empty">No approved requests are waiting for Moodle sync.</div><?php else: ?>
      <table class="pqcsr-table"><thead><tr><th>Student</th><th>Offering</th><th>Approved</th><th>Moodle Setup</th><th>Action</th></tr></thead><tbody>
      <?php foreach ($pending as $row): ?><tr>
        <td><span class="pqcsr-name"><?php echo s(fullname($row)); ?></span><span class="pqcsr-muted"><?php echo s(pqh_account_no_label($row)); ?> / <?php echo s((string)$row->email); ?></span></td>
        <td><span class="pqcsr-name"><?php echo s((string)$row->offering_title); ?></span><span class="pqcsr-muted"><?php echo s((string)$row->course_key); ?> / Moodle #<?php echo (int)$row->moodlecourseid; ?></span></td>
        <td><?php echo (int)$row->approvedat > 0 ? s(userdate((int)$row->approvedat, get_string('strftimedatetimeshort'))) : ''; ?></td>
        <td><span class="pqcsr-pill"><?php echo s(pqcsr_manual_label($row)); ?></span></td>
        <td><a class="pqcsr-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['request_status' => 'approved', 'request_offeringid' => (int)$row->offeringid]))->out(false); ?>">Retry from requests</a></td>
      </tr><?php endforeach; ?></tbody></table>
    <?php endif; ?>
  </section>
  <section class="pqcsr-panel"><h2>Offering Link Issues</h2>
    <?php if (!$linkissues): ?><div class="pqcsr-empty">All linked Moodle courses look ready.</div><?php else: ?>
      <table class="pqcsr-table"><thead><tr><th>Offering</th><th>Moodle Course</th><th>Status</th><th>Action</th></tr></thead><tbody>
      <?php foreach ($linkissues as $row): ?><tr>
        <td><span class="pqcsr-name"><?php echo s((string)$row->title); ?></span><span class="pqcsr-muted"><?php echo s((string)$row->course_key); ?> / Offering #<?php echo (int)$row->offeringid; ?></span></td>
        <td><?php echo (int)$row->moodlecourseid > 0 ? 'Moodle #' . (int)$row->moodlecourseid . ' ' . s((string)$row->moodle_fullname) : 'Not linked'; ?></td>
        <td><span class="pqcsr-pill"><?php echo s(pqcsr_manual_label($row)); ?></span></td>
        <td><a class="pqcsr-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['editid' => (int)$row->offeringid]))->out(false); ?>">Edit offering</a></td>
      </tr><?php endforeach; ?></tbody></table>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
