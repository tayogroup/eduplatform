<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/workflow_documentlib.php');

function pqsp_child_ids(int $workspaceid, int $userid): array {
    global $DB;
    $ids = [];
    if (pqh_user_workspace_role($userid, $workspaceid) === 'student') {
        $ids[$userid] = $userid;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqh_table_exists_safe($table) || !pqh_table_has_field_safe($table, 'guardianid')) {
            continue;
        }
        $params = ['guardianid' => $userid];
        $where = 'guardianid = :guardianid';
        if (pqh_table_has_field_safe($table, 'workspaceid')) {
            $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0)';
            $params['workspaceid'] = $workspaceid;
        }
        foreach ($DB->get_fieldset_select($table, 'studentid', $where, $params) as $studentid) {
            if ((int)$studentid > 0) {
                $ids[(int)$studentid] = (int)$studentid;
            }
        }
    }
    return array_values($ids);
}

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$role = $workspaceid > 0 ? pqh_user_workspace_role((int)$USER->id, $workspaceid) : '';
if ($workspaceid <= 0 || !in_array($role, ['platform_admin', 'owner', 'admin', 'student', 'parent', 'sponsor'], true)) {
    pqh_access_denied('Student and parent portal requires student, parent, sponsor, or workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Portal access denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$childids = pqsp_child_ids($workspaceid, (int)$USER->id);
if (pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) && optional_param('studentid', 0, PARAM_INT) > 0) {
    $childids = [optional_param('studentid', 0, PARAM_INT)];
}
$studentid = optional_param('studentid', $childids[0] ?? (int)$USER->id, PARAM_INT);
if (!in_array($studentid, $childids, true) && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) && $role !== 'sponsor') {
    pqh_access_denied('That student is not linked to your portal.', new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]), 'Student access denied');
}
$student = core_user::get_user($studentid, 'id,firstname,lastname,email', IGNORE_MISSING);
$urlparams = ['workspaceid' => $workspaceid, 'studentid' => $studentid];

$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records_sql(
    "SELECT s.*, a.attendance_status
       FROM {local_prequran_live_session} s
       JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
  LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = :astudentid
      WHERE s.workspaceid = :workspaceid
        AND (p.studentid = :studentid OR p.userid = :userid)
   ORDER BY s.scheduled_start DESC",
    ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'userid' => $studentid, 'astudentid' => $studentid],
    0,
    20
)) : [];
$invoices = pqh_table_exists_safe('local_prequran_invoice') ? array_values($DB->get_records('local_prequran_invoice', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'issuedat DESC, id DESC', '*', 0, 20)) : [];
$payments = pqh_table_exists_safe('local_prequran_payment') ? array_values($DB->get_records('local_prequran_payment', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'receivedat DESC, id DESC', '*', 0, 20)) : [];
$plans = pqh_table_exists_safe('local_prequran_payment_plan') ? array_values($DB->get_records('local_prequran_payment_plan', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'timecreated DESC', '*', 0, 20)) : [];
$grades = pqh_table_exists_safe('local_prequran_course_grade') ? array_values($DB->get_records('local_prequran_course_grade', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'publishedat DESC, id DESC', '*', 0, 20)) : [];
$documents = pqh_table_exists_safe('local_prequran_document') ? array_values($DB->get_records_select('local_prequran_document', 'workspaceid = :workspaceid AND studentid = :studentid AND status <> :archived', ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'archived' => 'archived'], 'timemodified DESC', '*', 0, 40)) : [];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/student_parent_portal.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student And Parent Portal');
$PAGE->set_heading('Student And Parent Portal');

echo $OUTPUT->header();
echo '<style>.pqsp{max-width:1180px;margin:0 auto}.pqsp-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqsp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqsp-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:14px}.pqsp-table{width:100%;border-collapse:collapse}.pqsp-table th,.pqsp-table td{border-bottom:1px solid #e7eee8;padding:8px;text-align:left;vertical-align:top}.pqsp-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqsp-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:1px solid #cfd8d0;border-radius:8px;background:#f7fbf8;color:#173044;font-weight:800;text-decoration:none}.pqsp-muted{color:#617064;font-size:12px}@media(max-width:760px){.pqsp-grid,.pqsp-top{display:block}.pqsp-panel{margin-bottom:12px}.pqsp-table,.pqsp-table tbody,.pqsp-table tr,.pqsp-table td{display:block}.pqsp-table th{display:none}.pqsp-table td{border-bottom:0;padding:6px 0}}</style>';
echo '<div class="pqsp"><div class="pqsp-top"><div><h2>Student And Parent Portal</h2><div class="pqsp-muted">' . s($workspace->name) . ' / ' . s($student ? fullname($student) : ('Student #' . $studentid)) . '</div></div><div><a class="pqsp-btn" href="' . (new moodle_url('/local/hubredirect/course_transcript.php', $urlparams))->out(false) . '">Transcript</a> <a class="pqsp-btn" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]))->out(false) . '">Workspace</a></div></div><div class="pqsp-grid">';
echo '<section class="pqsp-panel"><h3>Enrolled Courses / Classes</h3><table class="pqsp-table"><thead><tr><th>Class</th><th>When</th><th>Attendance</th></tr></thead><tbody>';
foreach ($sessions as $session) { echo '<tr><td><strong>' . s($session->title) . '</strong><div class="pqsp-muted">' . s($session->session_type) . '</div></td><td>' . s(userdate((int)$session->scheduled_start)) . '</td><td><span class="pqsp-pill">' . s((string)($session->attendance_status ?? $session->status)) . '</span></td></tr>'; }
if (!$sessions) { echo '<tr><td colspan="3" class="pqsp-muted">No enrolled class sessions found.</td></tr>'; }
echo '</tbody></table></section><section class="pqsp-panel"><h3>Invoices And Payments</h3><table class="pqsp-table"><tbody>';
foreach ($invoices as $invoice) { echo '<tr><td><strong>' . s($invoice->invoicenumber ?? ('Invoice #' . (int)$invoice->id)) . '</strong><div class="pqsp-muted">' . s(($invoice->balancedue ?? '') . ' ' . ($invoice->currency ?? '')) . '</div></td><td><span class="pqsp-pill">' . s($invoice->status ?? '') . '</span></td></tr>'; }
foreach ($payments as $payment) { echo '<tr><td><strong>' . s($payment->receiptnumber ?? ('Payment #' . (int)$payment->id)) . '</strong><div class="pqsp-muted">' . s(($payment->amount ?? '') . ' ' . ($payment->currency ?? '')) . '</div></td><td><span class="pqsp-pill">' . s($payment->status ?? '') . '</span></td></tr>'; }
if (!$invoices && !$payments) { echo '<tr><td class="pqsp-muted">No invoice or payment rows found.</td></tr>'; }
echo '</tbody></table></section><section class="pqsp-panel"><h3>Payment Plans</h3><table class="pqsp-table"><tbody>';
foreach ($plans as $plan) { echo '<tr><td><strong>' . s($plan->plannumber ?? ('Plan #' . (int)$plan->id)) . '</strong><div class="pqsp-muted">' . s(($plan->principalamount ?? '') . ' ' . ($plan->currency ?? '')) . '</div></td><td><span class="pqsp-pill">' . s($plan->status ?? '') . '</span></td></tr>'; }
if (!$plans) { echo '<tr><td class="pqsp-muted">No payment plan is visible for this student.</td></tr>'; }
echo '</tbody></table></section><section class="pqsp-panel"><h3>Grades</h3><table class="pqsp-table"><tbody>';
foreach ($grades as $grade) { echo '<tr><td><strong>Offering #' . (int)$grade->offeringid . '</strong><div class="pqsp-muted">' . s($grade->final_percent . '%') . '</div></td><td><span class="pqsp-pill">' . s($grade->letter_grade . ' / ' . $grade->status) . '</span></td></tr>'; }
if (!$grades) { echo '<tr><td class="pqsp-muted">No published course grades yet.</td></tr>'; }
echo '</tbody></table></section><section class="pqsp-panel"><h3>Secure Downloads</h3><table class="pqsp-table"><tbody>';
foreach ($documents as $doc) { $download = pqwdoc_download_url($doc); echo '<tr><td><strong>' . s($doc->title) . '</strong><div class="pqsp-muted">' . s($doc->document_type . ' / ' . $doc->verification_status) . '</div></td><td>' . ($download !== '' ? '<a class="pqsp-btn" href="' . s($download) . '">Download</a>' : '<span class="pqsp-muted">Registry row</span>') . '</td></tr>'; }
if (!$documents) { echo '<tr><td class="pqsp-muted">No secure documents are available yet.</td></tr>'; }
echo '</tbody></table></section><section class="pqsp-panel"><h3>Self-Service</h3><p><a class="pqsp-btn" href="' . (new moodle_url('/local/hubredirect/course_transcript_export.php', $urlparams + ['format' => 'pdf']))->out(false) . '">Download transcript PDF</a></p><p><a class="pqsp-btn" href="' . (new moodle_url('/local/hubredirect/student_finance.php', $urlparams))->out(false) . '">Open finance account</a></p></section></div></div>';
echo $OUTPUT->footer();
