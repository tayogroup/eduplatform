<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/course_transcriptlib.php');

function pqctv_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}

function pqctv_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : 'Not recorded';
}

function pqctv_mask_identifier(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return 'Not recorded';
    }
    $tail = core_text::substr($value, max(0, core_text::strlen($value) - 4));
    return 'Ending ' . $tail;
}

function pqctv_rate_limited(): bool {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return false;
    }
    $now = time();
    $window = 60;
    $hits = $_SESSION['pqct_verify_hits'] ?? [];
    if (!is_array($hits)) {
        $hits = [];
    }
    $hits = array_values(array_filter($hits, static function($hit) use ($now, $window): bool {
        return is_int($hit) && $hit >= ($now - $window);
    }));
    $hits[] = $now;
    $_SESSION['pqct_verify_hits'] = $hits;
    return count($hits) > 30;
}

function pqctv_audit(string $action, ?stdClass $doc, array $details = []): void {
    $details += [
        'workspaceid' => (int)($doc->workspaceid ?? 0),
        'consumerid' => (int)($doc->consumerid ?? 0),
        'studentid' => (int)($doc->studentid ?? 0),
        'documentid' => (string)($doc->documentid ?? ''),
        'remoteaddr' => clean_param((string)($_SERVER['REMOTE_ADDR'] ?? ''), PARAM_TEXT),
    ];
    pqco_course_audit($action, 'transcript_doc', (int)($doc->id ?? 0), $details);
}

global $OUTPUT, $PAGE;

$documentid = trim(required_param('documentid', PARAM_TEXT));
$code = trim(optional_param('code', '', PARAM_ALPHANUMEXT));
$token = trim(optional_param('token', '', PARAM_ALPHANUMEXT));
$limited = pqctv_rate_limited();
$doc = $limited ? null : pqct_load_public_transcript_doc($documentid);
$verified = !$limited && $doc && pqct_verify_official_transcript_code($doc, $code, $token);
$payload = $verified ? pqct_official_doc_payload($doc) : [];
$header = $payload['header'] ?? [];
$student = $header['student'] ?? [];
$workspace = $header['workspace'] ?? [];
$consumer = $header['consumer'] ?? [];
$status = $verified ? (string)($doc->status ?? 'issued') : 'not_found';
$isvalid = $verified && $status === 'issued';
$isnonvalid = $verified && in_array($status, ['revoked', 'reissued', 'expired'], true);
$support = trim((string)($consumer['supportemail'] ?? ''));

if ($limited) {
    pqctv_audit('transcript_public_verification_rate_limited', null, ['documentid' => $documentid]);
} else if ($verified) {
    pqctv_audit('transcript_public_verified', $doc, ['status' => $status, 'method' => $code !== '' ? 'signed_code' : 'token']);
} else {
    pqctv_audit('transcript_public_verification_failed', $doc, ['documentid' => $documentid, 'reason' => $doc ? 'invalid_code' : 'not_found']);
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/transcript_verify.php', ['documentid' => $documentid] + ($code !== '' ? ['code' => $code] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Transcript Verification');
$PAGE->set_heading('Transcript Verification');
$PAGE->add_body_class('pqctv-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

echo $OUTPUT->header();
?>
<style>
body.pqctv-page header,body.pqctv-page footer,body.pqctv-page nav.navbar,body.pqctv-page #page-header,body.pqctv-page #page-footer,body.pqctv-page .drawer,body.pqctv-page .drawer-toggles,body.pqctv-page .block-region,body.pqctv-page [data-region="drawer"],body.pqctv-page [data-region="right-hand-drawer"]{display:none!important}
body.pqctv-page #page,body.pqctv-page #page-content,body.pqctv-page #region-main,body.pqctv-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqctv-shell{min-height:100vh;padding:34px 18px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqctv-card{max-width:820px;margin:0 auto;padding:22px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 14px 34px rgba(23,48,68,.07)}.pqctv-kicker{margin:0 0 6px;color:#6f4e32;font-size:12px;font-weight:950;text-transform:uppercase}.pqctv-title{margin:0;color:#221b22;font-size:30px;font-weight:950}.pqctv-sub{margin:8px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqctv-status{margin:18px 0;padding:14px;border-radius:8px;font-size:18px;font-weight:950}.pqctv-status--valid{background:#edf9ef;color:#245c35}.pqctv-status--warn{background:#fff8e8;color:#725316}.pqctv-status--bad{background:#fff0ed;color:#883526}.pqctv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqctv-meta{padding:12px;border-radius:8px;background:#f9fbfc;border:1px solid rgba(23,48,68,.1)}.pqctv-meta span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqctv-meta strong{display:block;margin-top:4px;color:#173044;font-size:14px;font-weight:950;overflow-wrap:anywhere}.pqctv-note{margin-top:16px;color:#5e7280;font-size:13px;font-weight:750;line-height:1.5}.pqctv-support{margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,48,68,.1);color:#415363;font-weight:850}.pqctv-btn{display:inline-flex;align-items:center;justify-content:center;margin-top:14px;min-height:38px;padding:0 12px;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}
@media(max-width:720px){.pqctv-grid{grid-template-columns:1fr}.pqctv-title{font-size:25px}}
</style>
<main class="pqctv-shell">
  <section class="pqctv-card">
    <p class="pqctv-kicker">Public Verification</p>
    <h1 class="pqctv-title">Official Transcript Status</h1>
    <p class="pqctv-sub">This page confirms whether a submitted official transcript document ID and verification code match an issued snapshot.</p>

    <?php if ($limited): ?>
      <div class="pqctv-status pqctv-status--bad">Verification temporarily unavailable</div>
      <p class="pqctv-note">Too many verification attempts were received in a short period. Please wait a minute and try again.</p>
    <?php elseif (!$verified): ?>
      <div class="pqctv-status pqctv-status--bad">Not found or verification code mismatch</div>
      <div class="pqctv-grid">
        <div class="pqctv-meta"><span>Document ID</span><strong><?php echo s($documentid); ?></strong></div>
        <div class="pqctv-meta"><span>Status</span><strong>Not verified</strong></div>
      </div>
      <p class="pqctv-note">For privacy, this page does not disclose whether the document ID exists unless the verification code also matches.</p>
    <?php else: ?>
      <div class="pqctv-status <?php echo $isvalid ? 'pqctv-status--valid' : ($isnonvalid ? 'pqctv-status--warn' : 'pqctv-status--bad'); ?>">
        <?php echo $isvalid ? 'Valid issued transcript' : 'Transcript is ' . s(pqctv_label($status)); ?>
      </div>
      <div class="pqctv-grid">
        <div class="pqctv-meta"><span>Document ID</span><strong><?php echo s((string)$doc->documentid); ?></strong></div>
        <div class="pqctv-meta"><span>Status</span><strong><?php echo s(pqctv_label($status)); ?></strong></div>
        <div class="pqctv-meta"><span>Issuer</span><strong><?php echo s((string)($consumer['name'] ?? $workspace['name'] ?? 'Pre-Quraan')); ?></strong></div>
        <div class="pqctv-meta"><span>Workspace</span><strong><?php echo s((string)($workspace['name'] ?? '')); ?></strong></div>
        <div class="pqctv-meta"><span>Issued</span><strong><?php echo s(pqctv_date((int)($doc->issuedat ?? 0))); ?></strong></div>
        <div class="pqctv-meta"><span>Student</span><strong><?php echo s((string)($student['name'] ?? 'Student')); ?></strong></div>
        <div class="pqctv-meta"><span>Student Identifier</span><strong><?php echo s(pqctv_mask_identifier((string)($student['account_no'] ?? ''))); ?></strong></div>
        <div class="pqctv-meta"><span>Snapshot Hash</span><strong><?php echo s(substr((string)($doc->snapshothash ?? ''), 0, 16)); ?></strong></div>
        <?php if (!empty($doc->replacedbydocumentid)): ?><div class="pqctv-meta"><span>Replaced By</span><strong><?php echo s((string)$doc->replacedbydocumentid); ?></strong></div><?php endif; ?>
      </div>
      <?php if ($status === 'revoked'): ?><p class="pqctv-note">This document is no longer valid. Contact the issuing institution before accepting it.</p><?php endif; ?>
      <?php if ($status === 'reissued'): ?><p class="pqctv-note">This document has been superseded by a later official transcript.</p><?php endif; ?>
      <p class="pqctv-note">Course lines, grades, attendance, private notes, and warning details are intentionally not shown on the public verification page.</p>
    <?php endif; ?>

    <?php if ($support !== ''): ?><div class="pqctv-support">Support: <?php echo s($support); ?></div><?php endif; ?>
  </section>
</main>
<?php
echo $OUTPUT->footer();
