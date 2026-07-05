<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

function pqctr_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}

function pqctr_warning_repair_url(array $row, array $baseparams): array {
    $code = (string)($row['code'] ?? '');
    $offeringid = (int)($row['offeringid'] ?? 0);
    $requestid = (int)($row['requestid'] ?? 0);
    $studentid = (int)($row['studentid'] ?? 0);
    $moodlecourseid = (int)($row['moodlecourseid'] ?? 0);

    if (in_array($code, ['approved_pending_moodle_sync', 'moodle_only_enrollment'], true)) {
        return ['Moodle sync', new moodle_url('/local/hubredirect/course_sync_report.php', $baseparams)];
    }
    if (in_array($code, ['moodle_course_missing', 'moodle_course_hidden'], true)) {
        return ['Edit offering', new moodle_url('/local/hubredirect/course_offerings.php', $baseparams + ['editid' => $offeringid])];
    }
    if (in_array($code, ['student_not_workspace_member', 'student_identity_incomplete', 'student_account_no_missing'], true)) {
        return ['Workspace people', new moodle_url('/local/hubredirect/workspace_people.php', $baseparams)];
    }
    if ($code === 'transcript_policy_defaulted') {
        return ['Transcript policy', new moodle_url('/local/hubredirect/transcript_policy.php', $baseparams)];
    }
    if (in_array($code, ['grade_not_recorded', 'grade_hidden_or_locked'], true) && $moodlecourseid > 0) {
        return ['Gradebook', new moodle_url('/grade/report/grader/index.php', ['id' => $moodlecourseid])];
    }
    if ($requestid > 0 || $studentid > 0) {
        return ['Course history', new moodle_url('/local/hubredirect/course_student_history.php', $baseparams + ['studentid' => $studentid])];
    }
    return ['Course offerings', new moodle_url('/local/hubredirect/course_offerings.php', $baseparams)];
}

function pqctr_build_warning_rows(array $students, int $workspaceid, stdClass $consumercontext, array $baseparams): array {
    $rows = [];
    foreach ($students as $student) {
        $studentid = (int)$student->id;
        $payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
            'viewerid' => (int)($GLOBALS['USER']->id ?? 0),
            'include_internal' => false,
        ]);
        $studentname = (string)($payload['header']['student']['name'] ?? fullname($student));
        $accountno = (string)($payload['header']['student']['account_no'] ?? pqh_account_no_value($student));
        $linewarningcodes = [];

        foreach (($payload['lines'] ?? []) as $line) {
            $teachers = $line['teachers'] ?? [];
            $teacherids = array_map(static function(array $teacher): int {
                return (int)($teacher['id'] ?? 0);
            }, $teachers);
            $teachernames = array_filter(array_map(static function(array $teacher): string {
                return (string)($teacher['name'] ?? '');
            }, $teachers));

            foreach (($line['warnings'] ?? []) as $warning) {
                $context = $warning['context'] ?? [];
                $linewarningcodes[(string)($warning['code'] ?? '')] = true;
                $row = [
                    'studentid' => $studentid,
                    'student' => $studentname,
                    'account_no' => $accountno,
                    'email' => (string)($student->email ?? ''),
                    'course' => (string)($line['course']['title'] ?? ''),
                    'course_key' => (string)($line['course']['key'] ?? ''),
                    'moodlecourseid' => (int)($line['course']['moodlecourseid'] ?? ($context['moodlecourseid'] ?? 0)),
                    'offeringid' => (int)($line['offeringid'] ?? ($context['offeringid'] ?? 0)),
                    'requestid' => (int)($line['requestid'] ?? ($context['requestid'] ?? 0)),
                    'status' => (string)($line['status']['normalized'] ?? ''),
                    'teacherids' => array_values(array_filter($teacherids)),
                    'teachers' => implode(', ', $teachernames),
                    'severity' => (string)($warning['severity'] ?? 'warning'),
                    'code' => (string)($warning['code'] ?? ''),
                    'message' => (string)($warning['message'] ?? ''),
                    'recommended_action' => (string)($warning['recommended_action'] ?? ''),
                    'transcripturl' => pqct_transcript_url($studentid, $workspaceid, $consumercontext),
                ];
                [$repairlabel, $repairurl] = pqctr_warning_repair_url($row, $baseparams);
                $row['repairlabel'] = $repairlabel;
                $row['repairurl'] = $repairurl;
                $rows[] = $row;
            }
        }

        foreach (($payload['warnings'] ?? []) as $warning) {
            $code = (string)($warning['code'] ?? '');
            $context = $warning['context'] ?? [];
            if (isset($linewarningcodes[$code])) {
                continue;
            }
            $row = [
                'studentid' => $studentid,
                'student' => $studentname,
                'account_no' => $accountno,
                'email' => (string)($student->email ?? ''),
                'course' => '',
                'course_key' => '',
                'moodlecourseid' => (int)($context['moodlecourseid'] ?? 0),
                'offeringid' => (int)($context['offeringid'] ?? 0),
                'requestid' => (int)($context['requestid'] ?? 0),
                'status' => '',
                'teacherids' => [],
                'teachers' => '',
                'severity' => (string)($warning['severity'] ?? 'warning'),
                'code' => $code,
                'message' => (string)($warning['message'] ?? ''),
                'recommended_action' => (string)($warning['recommended_action'] ?? ''),
                'transcripturl' => pqct_transcript_url($studentid, $workspaceid, $consumercontext),
            ];
            [$repairlabel, $repairurl] = pqctr_warning_repair_url($row, $baseparams);
            $row['repairlabel'] = $repairlabel;
            $row['repairurl'] = $repairurl;
            $rows[] = $row;
        }
    }
    return $rows;
}

function pqctr_filter_rows(array $rows, string $severity, string $code, string $course, string $status, int $teacherid, string $q): array {
    $q = core_text::strtolower(trim($q));
    return array_values(array_filter($rows, static function(array $row) use ($severity, $code, $course, $status, $teacherid, $q): bool {
        if ($severity !== '' && (string)$row['severity'] !== $severity) {
            return false;
        }
        if ($code !== '' && (string)$row['code'] !== $code) {
            return false;
        }
        if ($course !== '' && (string)$row['course_key'] !== $course && (string)$row['offeringid'] !== $course && (string)$row['moodlecourseid'] !== $course) {
            return false;
        }
        if ($status !== '' && (string)$row['status'] !== $status) {
            return false;
        }
        if ($teacherid > 0 && !in_array($teacherid, $row['teacherids'], true)) {
            return false;
        }
        if ($q !== '') {
            $haystack = core_text::strtolower(implode(' ', [
                (string)$row['student'],
                (string)$row['account_no'],
                (string)$row['email'],
                (string)$row['course'],
                (string)$row['course_key'],
                (string)$row['code'],
            ]));
            if (strpos($haystack, $q) === false) {
                return false;
            }
        }
        return true;
    }));
}

global $DB, $OUTPUT, $PAGE, $USER;

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$severityfilter = trim(optional_param('severity', '', PARAM_ALPHANUMEXT));
$codefilter = trim(optional_param('warning', '', PARAM_ALPHANUMEXT));
$coursefilter = trim(optional_param('course', '', PARAM_TEXT));
$statusfilter = trim(optional_param('status', '', PARAM_ALPHANUMEXT));
$teacherfilter = optional_param('teacherid', 0, PARAM_INT);
$q = trim(optional_param('q', '', PARAM_TEXT));
$export = optional_param('export', '', PARAM_ALPHA);

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace admins can view transcript readiness.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Transcript readiness access required');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$students = pqct_students_for_transcript_viewer((int)$USER->id, $workspaceid);
$rows = pqctr_build_warning_rows($students, $workspaceid, $consumercontext, $baseparams);
$filteredrows = pqctr_filter_rows($rows, $severityfilter, $codefilter, $coursefilter, $statusfilter, $teacherfilter, $q);

$codeoptions = [];
$courseoptions = [];
$statusoptions = [];
$teacheroptions = [];
foreach ($rows as $row) {
    if ((string)$row['code'] !== '') {
        $codeoptions[(string)$row['code']] = pqctr_label((string)$row['code']);
    }
    if ((string)$row['course_key'] !== '') {
        $courseoptions[(string)$row['course_key']] = (string)$row['course'];
    } else if ((int)$row['offeringid'] > 0 && (string)$row['course'] !== '') {
        $courseoptions[(string)$row['offeringid']] = (string)$row['course'];
    }
    if ((string)$row['status'] !== '') {
        $statusoptions[(string)$row['status']] = pqctr_label((string)$row['status']);
    }
    foreach ($row['teacherids'] as $index => $teacherid) {
        $names = array_map('trim', explode(',', (string)$row['teachers']));
        $teacheroptions[(int)$teacherid] = $names[$index] ?? ('Teacher #' . (int)$teacherid);
    }
}
asort($codeoptions);
asort($courseoptions);
asort($statusoptions);
asort($teacheroptions);

$blockers = count(array_filter($rows, static function(array $row): bool {
    return (string)$row['severity'] === 'blocker';
}));
$warningcount = count(array_filter($rows, static function(array $row): bool {
    return (string)$row['severity'] !== 'blocker';
}));
$affectedstudents = count(array_unique(array_map(static function(array $row): int {
    return (int)$row['studentid'];
}, $rows)));

if ($export === 'csv') {
    pqco_course_audit('transcript_readiness_exported', 'workspace', $workspaceid, [
        'workspaceid' => $workspaceid,
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'row_count' => count($filteredrows),
        'filters' => [
            'severity' => $severityfilter,
            'warning' => $codefilter,
            'course' => $coursefilter,
            'status' => $statusfilter,
            'teacherid' => $teacherfilter,
            'q' => $q,
        ],
    ]);
    $filename = clean_filename('transcript-readiness-' . $workspaceid . '-' . date('Ymd-His') . '.csv');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['workspaceid', 'studentid', 'student', 'account_no', 'course', 'course_key', 'moodlecourseid', 'offeringid', 'requestid', 'status', 'teachers', 'severity', 'warning_code', 'message', 'recommended_action']);
    foreach ($filteredrows as $row) {
        fputcsv($out, [
            $workspaceid,
            (int)$row['studentid'],
            (string)$row['student'],
            (string)$row['account_no'],
            (string)$row['course'],
            (string)$row['course_key'],
            (int)$row['moodlecourseid'],
            (int)$row['offeringid'],
            (int)$row['requestid'],
            (string)$row['status'],
            (string)$row['teachers'],
            (string)$row['severity'],
            (string)$row['code'],
            (string)$row['message'],
            (string)$row['recommended_action'],
        ]);
    }
    fclose($out);
    exit;
}

pqco_course_audit('transcript_readiness_viewed', 'workspace', $workspaceid, [
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'student_count' => count($students),
    'row_count' => count($filteredrows),
    'filters' => [
        'severity' => $severityfilter,
        'warning' => $codefilter,
        'course' => $coursefilter,
        'status' => $statusfilter,
        'teacherid' => $teacherfilter,
        'q' => $q,
    ],
]);

$filterparams = $baseparams + [
    'severity' => $severityfilter,
    'warning' => $codefilter,
    'course' => $coursefilter,
    'status' => $statusfilter,
    'teacherid' => $teacherfilter,
    'q' => $q,
];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Transcript Readiness');
$PAGE->set_heading('Transcript Readiness');
$PAGE->add_body_class('pqctr-page');

echo $OUTPUT->header();
?>
<style>
body.pqctr-page header,body.pqctr-page footer,body.pqctr-page nav.navbar,body.pqctr-page #page-header,body.pqctr-page #page-footer,body.pqctr-page .drawer,body.pqctr-page .drawer-toggles,body.pqctr-page .block-region,body.pqctr-page [data-region="drawer"],body.pqctr-page [data-region="right-hand-drawer"]{display:none!important}
body.pqctr-page #page,body.pqctr-page #page-content,body.pqctr-page #region-main,body.pqctr-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqctr-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqctr-wrap{max-width:1340px;margin:0 auto}.pqctr-top,.pqctr-panel,.pqctr-filter{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqctr-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;margin-bottom:14px}.pqctr-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqctr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqctr-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqctr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqctr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqctr-filter{display:grid;grid-template-columns:1.2fr repeat(5,minmax(130px,1fr)) auto auto auto;gap:10px;align-items:end;margin-bottom:14px}.pqctr-field label{display:block;margin-bottom:5px;color:#415665;font-size:11px;font-weight:950;text-transform:uppercase}.pqctr-input{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800}.pqctr-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqctr-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqctr-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqctr-metric span{display:block;margin-top:4px;color:#647887;font-size:12px;font-weight:900}.pqctr-table{width:100%;border-collapse:collapse}.pqctr-table th,.pqctr-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqctr-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqctr-name{display:block;color:#221b22;font-weight:950}.pqctr-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqctr-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqctr-pill--blocker{background:#fff2f2;color:#702222}.pqctr-pill--warning{background:#fff8e8;color:#725316}.pqctr-row-actions{display:flex;gap:6px;flex-wrap:wrap}.pqctr-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;background:#fff;color:#5e7280;font-weight:900}
@media(max-width:1060px){.pqctr-top,.pqctr-filter{grid-template-columns:1fr}.pqctr-actions{justify-content:flex-start}.pqctr-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.pqctr-shell{padding:18px 12px 42px}.pqctr-metrics{grid-template-columns:1fr}.pqctr-table{display:block;overflow-x:auto}}
</style>
<main class="pqctr-shell"><div class="pqctr-wrap">
  <section class="pqctr-top">
    <div>
      <h1 class="pqctr-title"><?php echo s((string)$workspace->name); ?> Transcript Readiness</h1>
      <p class="pqctr-sub">Data-quality blockers and warnings to repair before official transcript issue.</p>
    </div>
    <nav class="pqctr-actions">
      <a class="pqctr-btn pqctr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/transcript_policy.php', $baseparams))->out(false); ?>">Transcript policy</a>
      <a class="pqctr-btn pqctr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_sync_report.php', $baseparams))->out(false); ?>">Moodle sync</a>
      <a class="pqctr-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams))->out(false); ?>">Workspace</a>
    </nav>
  </section>

  <form class="pqctr-filter" method="get">
    <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
    <div class="pqctr-field"><label>Search</label><input class="pqctr-input" name="q" value="<?php echo s($q); ?>" placeholder="Student, account, email, course, warning"></div>
    <div class="pqctr-field"><label>Severity</label><select class="pqctr-input" name="severity"><option value="">All</option><option value="blocker" <?php echo $severityfilter === 'blocker' ? 'selected' : ''; ?>>Blockers</option><option value="warning" <?php echo $severityfilter === 'warning' ? 'selected' : ''; ?>>Warnings</option></select></div>
    <div class="pqctr-field"><label>Warning</label><select class="pqctr-input" name="warning"><option value="">All warnings</option><?php foreach ($codeoptions as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo $value === $codefilter ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
    <div class="pqctr-field"><label>Course</label><select class="pqctr-input" name="course"><option value="">All courses</option><?php foreach ($courseoptions as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo $value === $coursefilter ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
    <div class="pqctr-field"><label>Status</label><select class="pqctr-input" name="status"><option value="">All statuses</option><?php foreach ($statusoptions as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo $value === $statusfilter ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
    <div class="pqctr-field"><label>Teacher</label><select class="pqctr-input" name="teacherid"><option value="0">All teachers</option><?php foreach ($teacheroptions as $value => $label): ?><option value="<?php echo (int)$value; ?>" <?php echo (int)$value === $teacherfilter ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
    <button class="pqctr-btn" type="submit">Filter</button>
    <a class="pqctr-btn pqctr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams))->out(false); ?>">Clear</a>
    <button class="pqctr-btn pqctr-btn--light" name="export" value="csv" type="submit">Export CSV</button>
  </form>

  <section class="pqctr-metrics" aria-label="Readiness summary">
    <div class="pqctr-metric"><strong><?php echo count($students); ?></strong><span>students scanned</span></div>
    <div class="pqctr-metric"><strong><?php echo $affectedstudents; ?></strong><span>students with issues</span></div>
    <div class="pqctr-metric"><strong><?php echo $blockers; ?></strong><span>blockers</span></div>
    <div class="pqctr-metric"><strong><?php echo $warningcount; ?></strong><span>warnings</span></div>
    <div class="pqctr-metric"><strong><?php echo count($filteredrows); ?></strong><span>shown after filters</span></div>
  </section>

  <section class="pqctr-panel">
    <?php if (!$filteredrows): ?>
      <div class="pqctr-empty">No transcript readiness issues match the current filters.</div>
    <?php else: ?>
      <table class="pqctr-table">
        <thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Teacher</th><th>Issue</th><th>Recommended Repair</th><th>Actions</th></tr></thead>
        <tbody>
        <?php foreach ($filteredrows as $row): ?>
          <tr>
            <td><span class="pqctr-name"><?php echo s((string)$row['student']); ?></span><span class="pqctr-muted"><?php echo s((string)$row['account_no']); ?> / ID <?php echo (int)$row['studentid']; ?></span></td>
            <td><span class="pqctr-name"><?php echo s((string)($row['course'] ?: 'Student/workspace issue')); ?></span><span class="pqctr-muted"><?php echo s((string)$row['course_key']); ?><?php if ((int)$row['moodlecourseid'] > 0): ?> / Moodle #<?php echo (int)$row['moodlecourseid']; ?><?php endif; ?></span></td>
            <td><span class="pqctr-pill"><?php echo s(pqctr_label((string)$row['status'])); ?></span></td>
            <td><?php echo s((string)($row['teachers'] ?: 'Not assigned')); ?></td>
            <td><span class="pqctr-pill <?php echo (string)$row['severity'] === 'blocker' ? 'pqctr-pill--blocker' : 'pqctr-pill--warning'; ?>"><?php echo s(pqctr_label((string)$row['severity'])); ?></span><span class="pqctr-muted"><?php echo s(pqctr_label((string)$row['code'])); ?></span><span class="pqctr-muted"><?php echo s((string)$row['message']); ?></span></td>
            <td><?php echo s((string)($row['recommended_action'] ?: 'Review linked records and repair missing transcript data.')); ?></td>
            <td><div class="pqctr-row-actions"><a class="pqctr-btn pqctr-btn--light" href="<?php echo $row['transcripturl']->out(false); ?>">Transcript</a><a class="pqctr-btn pqctr-btn--light" href="<?php echo $row['repairurl']->out(false); ?>"><?php echo s((string)$row['repairlabel']); ?></a></div></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
