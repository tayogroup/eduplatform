<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/course_transcriptlib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$studentfilter = optional_param('studentid', 0, PARAM_INT);
$q = trim(optional_param('q', '', PARAM_TEXT));
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace admins can view student course history.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Course report access required');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_student_history.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Course History');
$PAGE->set_heading('Student Course History');
$PAGE->add_body_class('pqcsh-page');

$where = ['r.workspaceid = :workspaceid'];
$params = ['workspaceid' => $workspaceid];
if ($studentfilter > 0) {
    $where[] = 'r.studentid = :studentid';
    $params['studentid'] = $studentfilter;
}
if ($q !== '') {
    $like = '%' . $DB->sql_like_escape($q) . '%';
    $where[] = '(' . $DB->sql_like('u.firstname', ':qfirst', false) . ' OR ' . $DB->sql_like('u.lastname', ':qlast', false) . ' OR ' . $DB->sql_like('u.email', ':qemail', false) . ' OR ' . $DB->sql_like('u.idnumber', ':qidnumber', false) . ' OR ' . $DB->sql_like('o.title', ':qtitle', false) . ')';
    $params += ['qfirst' => $like, 'qlast' => $like, 'qemail' => $like, 'qidnumber' => $like, 'qtitle' => $like];
}

$rows = [];
if (pqco_table_ready()) {
    $rows = array_values($DB->get_records_sql(
        "SELECT r.*, o.title AS offering_title, o.course_key, o.moodlecourseid,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {user} u ON u.id = r.studentid
          WHERE " . implode(' AND ', $where) . "
       ORDER BY u.lastname ASC, u.firstname ASC, r.timecreated DESC",
        $params,
        0,
        500
    ));
}

echo $OUTPUT->header();
?>
<style>
body.pqcsh-page header,body.pqcsh-page footer,body.pqcsh-page nav.navbar,body.pqcsh-page #page-header,body.pqcsh-page #page-footer,body.pqcsh-page .drawer,body.pqcsh-page .drawer-toggles,body.pqcsh-page .block-region,body.pqcsh-page [data-region="drawer"],body.pqcsh-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcsh-page #page,body.pqcsh-page #page-content,body.pqcsh-page #region-main,body.pqcsh-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcsh-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcsh-wrap{max-width:1280px;margin:0 auto}.pqcsh-top,.pqcsh-panel,.pqcsh-filter{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcsh-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqcsh-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqcsh-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcsh-actions{display:flex;gap:8px;flex-wrap:wrap}.pqcsh-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqcsh-filter{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end;margin-bottom:14px}.pqcsh-field label{display:block;margin-bottom:5px;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqcsh-input{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800}.pqcsh-table{width:100%;border-collapse:collapse}.pqcsh-table th,.pqcsh-table td{padding:11px 10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqcsh-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqcsh-name{display:block;color:#221b22;font-weight:950}.pqcsh-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqcsh-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqcsh-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
</style>
<main class="pqcsh-shell"><div class="pqcsh-wrap">
  <section class="pqcsh-top">
    <div><h1 class="pqcsh-title"><?php echo s($workspace->name); ?> Student Course History</h1><p class="pqcsh-sub">Every course request and enrollment lifecycle event by student.</p></div>
    <nav class="pqcsh-actions"><a class="pqcsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false); ?>">Course offerings</a><a class="pqcsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a></nav>
  </section>
  <form class="pqcsh-filter" method="get">
    <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
    <div class="pqcsh-field"><label>Search student/course</label><input class="pqcsh-input" name="q" value="<?php echo s($q); ?>" placeholder="Name, email, Account No., course"></div>
    <button class="pqcsh-btn" type="submit">Filter</button>
    <a class="pqcsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/course_student_history.php', $urlparams))->out(false); ?>">Clear</a>
  </form>
  <section class="pqcsh-panel">
    <?php if (!$rows): ?><div class="pqcsh-empty">No course history found.</div><?php else: ?>
      <table class="pqcsh-table"><thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Requested</th><th>Approved</th><th>Moodle</th><th>Dropped</th><th>Notes</th></tr></thead><tbody>
      <?php foreach ($rows as $row): ?>
        <tr>
          <td><span class="pqcsh-name"><?php echo s(fullname($row)); ?></span><span class="pqcsh-muted"><?php echo s(pqh_account_no_label($row)); ?> / <?php echo s((string)$row->email); ?></span><a class="pqcsh-btn" href="<?php echo pqct_transcript_url((int)$row->studentid, $workspaceid, $consumercontext)->out(false); ?>">Transcript</a><a class="pqcsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/student_finance.php', $urlparams + ['studentid' => (int)$row->studentid]))->out(false); ?>">Finance</a></td>
          <td><span class="pqcsh-name"><?php echo s((string)$row->offering_title); ?></span><span class="pqcsh-muted"><?php echo s((string)$row->course_key); ?> / Moodle #<?php echo (int)$row->moodlecourseid; ?></span></td>
          <td><span class="pqcsh-pill"><?php echo s(pqco_request_status_label((string)$row->status)); ?></span></td>
          <td><?php echo (int)$row->timecreated > 0 ? s(userdate((int)$row->timecreated, get_string('strftimedatetimeshort'))) : ''; ?></td>
          <td><?php echo (int)$row->approvedat > 0 ? s(userdate((int)$row->approvedat, get_string('strftimedatetimeshort'))) : ''; ?></td>
          <td><?php echo (int)$row->moodleenrolledat > 0 ? s(userdate((int)$row->moodleenrolledat, get_string('strftimedatetimeshort'))) : ''; ?></td>
          <td><?php echo (int)($row->droppedat ?? 0) > 0 ? s(userdate((int)$row->droppedat, get_string('strftimedatetimeshort'))) : ''; ?></td>
          <td><span class="pqcsh-muted"><?php echo s((string)$row->request_notes); ?></span><span class="pqcsh-muted"><?php echo s((string)$row->admin_notes); ?></span></td>
        </tr>
      <?php endforeach; ?>
      </tbody></table>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
