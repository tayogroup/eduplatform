<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can review data export compliance evidence.',
    new moodle_url('/local/hubredirect/workspace_dashboard.php'),
    'Data export compliance access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$studentid = optional_param('studentid', 0, PARAM_INT);
$parentid = optional_param('parentid', 0, PARAM_INT);
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$assessmentid = optional_param('assessmentid', 0, PARAM_INT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);

if ($workspaceid <= 0) {
    pqh_access_denied('Data export compliance requires a workspace context.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Workspace required');
}

function pqdxc_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqdxc_recent_sql(string $sql, array $params = []): string {
    global $DB;
    try {
        $row = $DB->get_record_sql($sql, $params, IGNORE_MULTIPLE);
        if (!$row) {
            return '';
        }
        $parts = [];
        foreach ((array)$row as $key => $value) {
            if ($value !== null && $value !== '') {
                $parts[] = $key . '=' . core_text::substr((string)$value, 0, 140);
            }
        }
        return implode('; ', $parts);
    } catch (Throwable $e) {
        return '';
    }
}

function pqdxc_row(string $category, string $source, int $count, string $evidence): array {
    return [
        'category' => $category,
        'source' => $source,
        'status' => $count > 0 ? 'PASS' : 'CHECK',
        'count' => $count,
        'evidence' => $evidence !== '' ? $evidence : 'No matching evidence found for the supplied student identifiers.',
    ];
}

function pqdxc_pdf_escape(string $text): string {
    return str_replace(["\\", "(", ")", "\r"], ["\\\\", "\\(", "\\)", ""], $text);
}

function pqdxc_send_pdf(array $rows, string $runid): void {
    $lines = ['EduPlatform Data Export Compliance', 'Run: ' . ($runid !== '' ? $runid : 'manual'), ''];
    foreach ($rows as $row) {
        $lines[] = $row['category'] . ' - ' . $row['status'] . ' - ' . $row['source'] . ' - count ' . $row['count'];
    }
    $content = "BT\n/F1 10 Tf\n50 790 Td\n";
    foreach ($lines as $index => $line) {
        if ($index > 0) {
            $content .= "0 -16 Td\n";
        }
        $content .= '(' . pqdxc_pdf_escape(core_text::substr($line, 0, 100)) . ") Tj\n";
    }
    $content .= "ET\n";
    $objects = [];
    $objects[] = "<< /Type /Catalog /Pages 2 0 R >>";
    $objects[] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    $objects[] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
    $objects[] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    $objects[] = "<< /Length " . strlen($content) . " >>\nstream\n" . $content . "endstream";
    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $index => $object) {
        $offsets[] = strlen($pdf);
        $pdf .= ($index + 1) . " 0 obj\n" . $object . "\nendobj\n";
    }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="data-export-compliance-' . clean_filename($runid !== '' ? $runid : (string)time()) . '.pdf"');
    echo $pdf;
    exit;
}

$rows = [];
$student = $studentid > 0 ? core_user::get_user($studentid, 'id,username,firstname,lastname,email,idnumber,deleted,suspended', IGNORE_MISSING) : null;
$parent = $parentid > 0 ? core_user::get_user($parentid, 'id,username,firstname,lastname,email,idnumber,deleted,suspended', IGNORE_MISSING) : null;

if ($studentid > 0) {
    $studentcount = $student ? 1 : 0;
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $studentcount += pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_workspace_member}
              WHERE workspaceid = :workspaceid
                AND userid = :studentid",
            ['workspaceid' => $workspaceid, 'studentid' => $studentid]
        );
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')) {
        $studentcount += pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_student_profile}
              WHERE workspaceid = :workspaceid
                AND userid = :studentid",
            ['workspaceid' => $workspaceid, 'studentid' => $studentid]
        );
    }
    $rows[] = pqdxc_row(
        'student record export',
        'user, workspace membership, student profile',
        $studentcount,
        $student ? 'student=' . fullname($student) . '; email=' . (string)$student->email : ''
    );
}

if ($studentid > 0 && $parentid > 0) {
    $parentcount = $parent ? 1 : 0;
    if (pqh_table_exists_safe('local_prequran_comm_consent')) {
        $parentcount += pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_comm_consent}
              WHERE studentid = :studentid
                AND guardianid = :parentid",
            ['studentid' => $studentid, 'parentid' => $parentid]
        );
    }
    if (pqh_table_exists_safe('local_prequran_live_consent')) {
        $parentcount += pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_consent}
              WHERE studentid = :studentid
                AND guardianid = :parentid",
            ['studentid' => $studentid, 'parentid' => $parentid]
        );
    }
    $rows[] = pqdxc_row(
        'parent/guardian data visibility',
        'guardian link and parent-visible consent',
        $parentcount,
        $parent ? 'guardian=' . fullname($parent) . '; email=' . (string)$parent->email : ''
    );
}

if ($studentid > 0) {
    $auditcount = 0;
    $evidenceparts = [];
    if (pqh_table_exists_safe('local_prequran_live_attendance') && $sessionid > 0) {
        $attendancecount = pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_attendance}
              WHERE studentid = :studentid
                AND sessionid = :sessionid",
            ['studentid' => $studentid, 'sessionid' => $sessionid]
        );
        $auditcount += $attendancecount;
        $evidenceparts[] = 'attendance=' . $attendancecount;
    }
    if (pqh_table_exists_safe('local_prequran_grade') && $assessmentid > 0) {
        $gradecount = pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_grade}
              WHERE studentid = :studentid
                AND assessmentid = :assessmentid",
            ['studentid' => $studentid, 'assessmentid' => $assessmentid]
        );
        $auditcount += $gradecount;
        $evidenceparts[] = 'grade=' . $gradecount;
    }
    if (pqh_table_exists_safe('local_prequran_live_audit')) {
        $needle = '%"studentid":' . $studentid . '%';
        $liveauditcount = pqdxc_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_audit}
              WHERE " . $DB->sql_like('details', ':needle', false),
            ['needle' => $needle]
        );
        $auditcount += $liveauditcount;
        $evidenceparts[] = 'live_audit=' . $liveauditcount;
    }
    $rows[] = pqdxc_row(
        'audit log completeness',
        'attendance, grade, live audit',
        $auditcount,
        implode('; ', $evidenceparts)
    );
}

if (!$rows) {
    $rows[] = pqdxc_row('data export input', 'configuration', 0, 'Provide generated student, guardian, session, and assessment identifiers.');
}

if ($export === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="data-export-compliance-' . clean_filename($runid !== '' ? $runid : (string)time()) . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['category', 'source', 'status', 'count', 'evidence']);
    foreach ($rows as $row) {
        fputcsv($out, [$row['category'], $row['source'], $row['status'], $row['count'], $row['evidence']]);
    }
    fclose($out);
    exit;
}

if ($export === 'pdf') {
    pqdxc_send_pdf($rows, $runid);
}

$params = [
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'workspaceid' => $workspaceid,
    'runid' => $runid,
    'studentid' => $studentid,
    'parentid' => $parentid,
    'teacherid' => $teacherid,
    'sessionid' => $sessionid,
    'assessmentid' => $assessmentid,
];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/data_export_compliance.php', array_filter($params, static fn($value) => $value !== '' && $value !== 0)));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Data Export Compliance');
$PAGE->set_heading('Data Export Compliance');
$PAGE->add_body_class('pqdxc-page');

$passcount = count(array_filter($rows, static fn($row) => $row['status'] === 'PASS'));

echo $OUTPUT->header();
?>
<style>
body.pqdxc-page header,body.pqdxc-page footer,body.pqdxc-page nav.navbar,body.pqdxc-page #page-header,body.pqdxc-page #page-footer,body.pqdxc-page .drawer,body.pqdxc-page .drawer-toggles,body.pqdxc-page .block-region,body.pqdxc-page [data-region="drawer"],body.pqdxc-page [data-region="right-hand-drawer"]{display:none!important}
body.pqdxc-page #page,body.pqdxc-page #page-content,body.pqdxc-page #region-main,body.pqdxc-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqdxc-shell{min-height:100vh;padding:30px 18px 58px;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqdxc-wrap{max-width:1180px;margin:0 auto}.pqdxc-top,.pqdxc-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqdxc-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqdxc-title{margin:0;color:#221b22;font-size:30px;font-weight:950}.pqdxc-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqdxc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqdxc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12);text-decoration:none;font-size:12px;font-weight:950}.pqdxc-table{width:100%;border-collapse:collapse}.pqdxc-table th,.pqdxc-table td{padding:11px 9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqdxc-table th{color:#5e7280;background:#fbfdff;font-size:12px;font-weight:950;text-transform:uppercase}.pqdxc-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#fff6dc;color:#79520f;font-size:12px;font-weight:950}.pqdxc-pill--ok{background:#edf9ef;color:#245c35}.pqdxc-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-word}.pqdxc-kpis{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.pqdxc-kpi{padding:10px 12px;border-radius:8px;background:#fbfdff;border:1px solid rgba(23,48,68,.1);font-weight:900}
</style>
<main class="pqdxc-shell">
  <div class="pqdxc-wrap">
    <section class="pqdxc-top">
      <div>
        <h1 class="pqdxc-title">Data Export Compliance</h1>
        <p class="pqdxc-sub">Student record export, guardian visibility, audit completeness, and CSV/PDF download evidence for one SQA run.</p>
        <div class="pqdxc-kpis">
          <span class="pqdxc-kpi"><?php echo (int)$passcount; ?> pass</span>
          <span class="pqdxc-kpi"><?php echo count($rows); ?> checks</span>
          <span class="pqdxc-kpi pqdxc-code"><?php echo s($runid !== '' ? $runid : 'no run id'); ?></span>
        </div>
      </div>
      <nav class="pqdxc-actions">
        <a class="pqdxc-btn" href="<?php echo (new moodle_url('/local/hubredirect/data_export_compliance.php', $params + ['export' => 'csv']))->out(false); ?>">Export CSV</a>
        <a class="pqdxc-btn" href="<?php echo (new moodle_url('/local/hubredirect/data_export_compliance.php', $params + ['export' => 'pdf']))->out(false); ?>">Export PDF</a>
      </nav>
    </section>
    <section class="pqdxc-panel">
      <table class="pqdxc-table">
        <thead><tr><th>Category</th><th>Status</th><th>Source</th><th>Count</th><th>Evidence</th></tr></thead>
        <tbody>
          <?php foreach ($rows as $row): ?>
            <tr>
              <td><strong><?php echo s($row['category']); ?></strong></td>
              <td><span class="pqdxc-pill <?php echo $row['status'] === 'PASS' ? 'pqdxc-pill--ok' : ''; ?>"><?php echo s($row['status']); ?></span></td>
              <td><span class="pqdxc-code"><?php echo s($row['source']); ?></span></td>
              <td><?php echo (int)$row['count']; ?></td>
              <td><span class="pqdxc-code"><?php echo s($row['evidence']); ?></span></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
