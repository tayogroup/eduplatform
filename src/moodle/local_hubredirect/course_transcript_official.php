<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

function pqcto_status_label(string $status): string {
    $status = trim($status);
    return $status === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $status));
}

function pqcto_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : 'Not recorded';
}

function pqcto_snapshot_value(array $line, string $key, string $fallback = 'Not recorded'): string {
    $display = $line['display'] ?? [];
    return trim((string)($display[$key] ?? '')) !== '' ? (string)$display[$key] : $fallback;
}

global $DB, $OUTPUT, $PAGE, $USER;

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
$documentid = trim(optional_param('documentid', '', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHA);
$issued = optional_param('issued', 0, PARAM_INT);
$error = '';
$snapshot = [];

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

if ($documentid !== '') {
    $doc = pqct_load_official_transcript_doc($documentid, (int)$USER->id);
    if (!$doc) {
        pqh_access_denied('The requested official transcript could not be found or is outside your workspace access.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Official transcript access required');
    }
    $workspaceid = (int)$doc->workspaceid;
    $studentid = (int)$doc->studentid;
    $baseparams['workspaceid'] = $workspaceid;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!confirm_sesskey()) {
            pqh_access_denied('Please reopen the official transcript and try again.', new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['documentid' => $documentid]), 'Official transcript form expired');
        }
        try {
            if ($action === 'revoke') {
                pqct_revoke_official_transcript($documentid, (int)$USER->id, trim(required_param('reason', PARAM_TEXT)));
                redirect(new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['documentid' => $documentid]));
            }
            if ($action === 'reissue') {
                $issuedrecord = pqct_reissue_official_transcript($documentid, (int)$USER->id, $consumercontext, trim(required_param('reason', PARAM_TEXT)));
                redirect(new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['documentid' => (string)$issuedrecord['record']->documentid, 'issued' => 1]));
            }
        } catch (Throwable $e) {
            $error = $e->getMessage();
            $doc = pqct_load_official_transcript_doc($documentid, (int)$USER->id) ?: $doc;
        }
    }
    $snapshot = json_decode((string)$doc->snapshotjson, true);
    $snapshot = is_array($snapshot) ? $snapshot : [];
    $payload = [
        'header' => $snapshot['header'] ?? [],
        'lines' => $snapshot['lines'] ?? [],
        'summary' => $snapshot['summary'] ?? [],
        'policy' => $snapshot['policy'] ?? [],
        'warnings' => $snapshot['warnings'] ?? [],
    ];
    $mode = 'issued';
} else {
    if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
        pqh_access_denied('Only workspace admins can draft or issue official transcripts.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Official transcript issue access required');
    }
    if (!pqct_document_schema_ready()) {
        pqh_access_denied('Official transcript document tables are not ready yet. Run the local_prequran plugin upgrade first.', new moodle_url('/local/hubredirect/course_transcript.php', $baseparams + ['studentid' => $studentid]), 'Official transcript unavailable');
    }
    if ($studentid <= 0) {
        $students = pqct_students_for_transcript_viewer((int)$USER->id, $workspaceid);
        if ($students) {
            $studentid = (int)array_key_first($students);
        }
    }
    if ($studentid <= 0 || !pqct_user_can_view_student_transcript((int)$USER->id, $studentid, $workspaceid)) {
        pqh_access_denied('Choose a valid managed student before drafting an official transcript.', new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams), 'Student transcript access required');
    }

    if ($action === 'issue' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!confirm_sesskey()) {
            pqh_access_denied('Please reopen the official transcript draft and try again.', new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['studentid' => $studentid]), 'Official transcript form expired');
        }
        try {
            $reason = trim(required_param('issuereason', PARAM_TEXT));
            $issuedrecord = pqct_issue_official_transcript($studentid, $workspaceid, $consumercontext, (int)$USER->id, $reason);
            redirect(new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['documentid' => (string)$issuedrecord['record']->documentid, 'issued' => 1]));
        } catch (Throwable $e) {
            $error = $e->getMessage();
        }
    }

    $payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
        'viewerid' => (int)$USER->id,
        'include_internal' => false,
    ]);
    $blockers = pqct_official_issue_blockers($payload);
    pqco_course_audit('official_transcript_draft_previewed', 'student', $studentid, [
        'workspaceid' => $workspaceid,
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'studentid' => $studentid,
        'blocker_count' => count($blockers),
    ]);
    $recentdocs = pqct_recent_official_transcript_docs($studentid, $workspaceid, 8);
    $mode = 'draft';
}

$header = $payload['header'] ?? [];
$student = $header['student'] ?? [];
$workspace = $header['workspace'] ?? [];
$lines = $payload['lines'] ?? [];
$summary = $payload['summary'] ?? [];
$policy = $payload['policy'] ?? [];
$docmeta = $snapshot['document'] ?? [];
$verificationurl = '';
if ($mode === 'issued') {
    $recentdocs = [];
    $blockers = [];
    $verificationurl = pqct_verification_url($consumercontext, $documentid, pqct_verification_code($doc));
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ($documentid !== '' ? ['documentid' => $documentid] : ['studentid' => $studentid])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($mode === 'issued' ? 'Official Transcript' : 'Official Transcript Draft');
$PAGE->set_heading($mode === 'issued' ? 'Official Transcript' : 'Official Transcript Draft');
$PAGE->add_body_class('pqcto-page');

echo $OUTPUT->header();
?>
<style>
body.pqcto-page header,body.pqcto-page footer,body.pqcto-page nav.navbar,body.pqcto-page #page-header,body.pqcto-page #page-footer,body.pqcto-page .drawer,body.pqcto-page .drawer-toggles,body.pqcto-page .block-region,body.pqcto-page [data-region="drawer"],body.pqcto-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcto-page #page,body.pqcto-page #page-content,body.pqcto-page #region-main,body.pqcto-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcto-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcto-wrap{max-width:1260px;margin:0 auto}.pqcto-top,.pqcto-panel,.pqcto-issue{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqcto-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start;margin-bottom:14px}.pqcto-kicker{margin:0 0 6px;color:#6f4e32;font-size:12px;font-weight:950;text-transform:uppercase}.pqcto-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqcto-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcto-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqcto-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqcto-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqcto-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqcto-meta{padding:12px;border-radius:8px;background:#fff;border:1px solid rgba(23,48,68,.12)}.pqcto-meta span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqcto-meta strong{display:block;margin-top:4px;color:#173044;font-size:13px;font-weight:950;overflow-wrap:anywhere}.pqcto-panel{margin-bottom:14px}.pqcto-panel h2,.pqcto-issue h2{margin:0 0 12px;color:#221b22;font-size:20px;font-weight:950}.pqcto-table{width:100%;border-collapse:collapse}.pqcto-table th,.pqcto-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqcto-table th{background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqcto-name{display:block;color:#221b22;font-weight:950}.pqcto-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqcto-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqcto-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqcto-alert--ok{background:#edf9ef;color:#245c35}.pqcto-alert--bad{background:#fff0ed;color:#883526}.pqcto-alert--warn{background:#fff8e8;color:#725316}.pqcto-formgrid{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}.pqcto-field label{display:block;margin-bottom:5px;color:#415665;font-size:11px;font-weight:950;text-transform:uppercase}.pqcto-input{width:100%;min-height:42px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800}.pqcto-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;background:#fff;color:#5e7280;font-weight:900}
@media(max-width:900px){.pqcto-top,.pqcto-grid,.pqcto-formgrid{grid-template-columns:1fr}.pqcto-actions{justify-content:flex-start}.pqcto-table{display:block;overflow-x:auto}}
</style>
<main class="pqcto-shell"><div class="pqcto-wrap">
  <section class="pqcto-top">
    <div>
      <p class="pqcto-kicker"><?php echo $mode === 'issued' ? 'Issued Official Transcript' : 'Official Transcript Draft'; ?></p>
      <h1 class="pqcto-title"><?php echo s((string)($student['name'] ?? 'Student')); ?></h1>
      <p class="pqcto-sub"><?php echo $mode === 'issued' ? 'This page is rendering the immutable issued snapshot.' : 'Draft preview from current live data. Issuing stores an immutable snapshot.'; ?></p>
    </div>
    <nav class="pqcto-actions">
      <a class="pqcto-btn pqcto-btn--light" href="<?php echo pqct_transcript_url($studentid, $workspaceid, $consumercontext)->out(false); ?>">Unofficial preview</a>
      <?php if ($mode === 'issued'): ?>
        <a class="pqcto-btn pqcto-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['type' => 'official', 'format' => 'pdf', 'documentid' => $documentid]))->out(false); ?>">PDF</a>
        <a class="pqcto-btn pqcto-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['type' => 'official', 'format' => 'csv', 'documentid' => $documentid]))->out(false); ?>">CSV</a>
      <?php endif; ?>
      <a class="pqcto-btn pqcto-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid, 'documentid' => $documentid]))->out(false); ?>">Controls</a>
      <a class="pqcto-btn pqcto-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams))->out(false); ?>">Readiness</a>
      <a class="pqcto-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams))->out(false); ?>">Workspace</a>
    </nav>
  </section>

  <?php if ($issued): ?><div class="pqcto-alert pqcto-alert--ok">Official transcript issued and stored as a snapshot.</div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqcto-alert pqcto-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

  <section class="pqcto-grid" aria-label="Official transcript metadata">
    <div class="pqcto-meta"><span>Workspace</span><strong><?php echo s((string)($workspace['name'] ?? '')); ?></strong></div>
    <div class="pqcto-meta"><span>Account No.</span><strong><?php echo s((string)($student['account_no'] ?? 'Not recorded')); ?></strong></div>
    <div class="pqcto-meta"><span>Policy Hash</span><strong><?php echo s(substr((string)($policy['policyhash'] ?? ($header['policy']['hash'] ?? '')), 0, 16)); ?></strong></div>
    <div class="pqcto-meta"><span><?php echo $mode === 'issued' ? 'Document ID' : 'Draft Status'; ?></span><strong><?php echo $mode === 'issued' ? s((string)($docmeta['documentid'] ?? $documentid)) : (count($blockers) ? 'Blocked' : 'Ready'); ?></strong></div>
    <?php if ($mode === 'issued'): ?>
      <div class="pqcto-meta"><span>Issued</span><strong><?php echo s(pqcto_date((int)($docmeta['issuedat'] ?? $doc->issuedat ?? 0))); ?></strong></div>
      <div class="pqcto-meta"><span>Snapshot Hash</span><strong><?php echo s(substr((string)($doc->snapshothash ?? ''), 0, 16)); ?></strong></div>
      <div class="pqcto-meta"><span>Status</span><strong><?php echo s(pqcto_status_label((string)($doc->status ?? 'issued'))); ?></strong></div>
      <div class="pqcto-meta"><span>Verification</span><strong><a href="<?php echo s($verificationurl); ?>" target="_blank" rel="noopener">Public status</a></strong></div>
      <?php if (!empty($doc->replacedbydocumentid)): ?><div class="pqcto-meta"><span>Replaced By</span><strong><?php echo s((string)$doc->replacedbydocumentid); ?></strong></div><?php endif; ?>
    <?php endif; ?>
    <div class="pqcto-meta"><span>Lines</span><strong><?php echo count($lines); ?></strong></div>
    <div class="pqcto-meta"><span>Warnings</span><strong><?php echo (int)($summary['warning_count'] ?? count($payload['warnings'] ?? [])); ?></strong></div>
  </section>

  <?php if ($mode === 'draft' && $blockers): ?>
    <section class="pqcto-panel">
      <h2>Issue Blockers</h2>
      <?php foreach ($blockers as $blocker): ?><div class="pqcto-alert pqcto-alert--warn"><?php echo s($blocker); ?></div><?php endforeach; ?>
    </section>
  <?php endif; ?>

  <?php if ($mode === 'draft' && !$blockers): ?>
    <section class="pqcto-issue">
      <h2>Issue Official Transcript</h2>
      <form method="post" class="pqcto-formgrid">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="issue">
        <input type="hidden" name="studentid" value="<?php echo (int)$studentid; ?>">
        <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
        <div class="pqcto-field"><label>Issue reason</label><input class="pqcto-input" name="issuereason" required maxlength="500" placeholder="Registrar review complete"></div>
        <button class="pqcto-btn" type="submit">Issue official transcript</button>
      </form>
    </section>
  <?php endif; ?>

  <?php if ($mode === 'issued' && in_array((string)($doc->status ?? ''), ['issued', 'reissued', 'stale'], true)): ?>
    <section class="pqcto-issue">
      <h2>Registrar Actions</h2>
      <form method="post" class="pqcto-formgrid">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="documentid" value="<?php echo s($documentid); ?>">
        <?php foreach ($baseparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
        <div class="pqcto-field"><label>Reason</label><input class="pqcto-input" name="reason" required maxlength="500" placeholder="Required registrar reason"></div>
        <button class="pqcto-btn pqcto-btn--light" name="action" value="reissue" type="submit">Reissue</button>
        <button class="pqcto-btn" name="action" value="revoke" type="submit">Revoke</button>
      </form>
    </section>
  <?php endif; ?>

  <?php if ($mode === 'issued' && (string)($doc->status ?? '') === 'revoked'): ?>
    <section class="pqcto-panel">
      <h2>Revocation</h2>
      <div class="pqcto-alert pqcto-alert--bad"><?php echo s((string)($doc->revocationreason ?? 'This transcript has been revoked.')); ?></div>
    </section>
  <?php endif; ?>

  <section class="pqcto-panel">
    <h2>Course Lines</h2>
    <?php if (!$lines): ?><div class="pqcto-empty">No course lines are available for this transcript.</div><?php else: ?>
      <table class="pqcto-table">
        <thead><tr><th>Course</th><th>Status</th><th>Grade</th><th>Completion</th><th>Attendance</th><th>Warnings</th></tr></thead>
        <tbody>
          <?php foreach ($lines as $line): ?>
            <tr>
              <td><span class="pqcto-name"><?php echo s((string)($line['course']['title'] ?? 'Course')); ?></span><span class="pqcto-muted"><?php echo s((string)($line['course']['key'] ?? '')); ?> / Moodle #<?php echo (int)($line['course']['moodlecourseid'] ?? 0); ?></span></td>
              <td><span class="pqcto-pill"><?php echo s(pqcto_status_label((string)($line['status']['normalized'] ?? 'unknown'))); ?></span></td>
              <td><?php echo s(pqcto_snapshot_value($line, 'grade')); ?></td>
              <td><?php echo s(pqcto_snapshot_value($line, 'completion')); ?></td>
              <td><?php echo s(pqcto_snapshot_value($line, 'attendance')); ?></td>
              <td><?php echo count($line['warnings'] ?? []); ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </section>

  <?php if ($mode === 'draft' && $recentdocs): ?>
    <section class="pqcto-panel">
      <h2>Recent Issued Snapshots</h2>
      <table class="pqcto-table">
        <thead><tr><th>Document</th><th>Status</th><th>Issued</th><th>Snapshot</th></tr></thead>
        <tbody>
          <?php foreach ($recentdocs as $recent): ?>
            <tr>
              <td><a href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['documentid' => (string)$recent->documentid]))->out(false); ?>"><?php echo s((string)$recent->documentid); ?></a></td>
              <td><?php echo s(pqcto_status_label((string)$recent->status)); ?></td>
              <td><?php echo s(pqcto_date((int)$recent->issuedat)); ?></td>
              <td><?php echo s(substr((string)$recent->snapshothash, 0, 16)); ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  <?php endif; ?>
</div></main>
<?php
echo $OUTPUT->footer();
