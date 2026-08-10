<?php
// Public certificate verification — parity with transcript_verify.php. A third
// party holding an award number + verification code can confirm a certificate
// is genuine and current, with NO login, disclosing nothing beyond masked
// identifiers + status. For privacy it does not reveal whether an award number
// exists unless the code also matches.
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/certificates_placementlib.php');

function pqcv_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}

function pqcv_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : 'Not recorded';
}

function pqcv_mask_name(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return 'Not recorded';
    }
    $parts = preg_split('/\s+/', $value);
    $out = [];
    foreach ($parts as $part) {
        $out[] = core_text::substr($part, 0, 1) . str_repeat('*', max(1, core_text::strlen($part) - 1));
    }
    return implode(' ', $out);
}

function pqcv_rate_limited(): bool {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return false;
    }
    $now = time();
    $hits = $_SESSION['pqcv_verify_hits'] ?? [];
    if (!is_array($hits)) {
        $hits = [];
    }
    $hits = array_values(array_filter($hits, static function ($hit) use ($now): bool {
        return is_int($hit) && $hit >= ($now - 60);
    }));
    $hits[] = $now;
    $_SESSION['pqcv_verify_hits'] = $hits;
    return count($hits) > 30;
}

function pqcv_audit(string $action, ?stdClass $award, array $details): void {
    global $DB;
    if (!function_exists('pqh_table_exists_safe') || !pqh_table_exists_safe('local_prequran_course_audit')) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_course_audit', (object)[
            'consumerid' => 0, 'workspaceid' => (int)($award->workspaceid ?? 0), 'offeringid' => 0,
            'requestid' => 0, 'studentid' => 0, 'actorid' => 0,
            'action' => $action, 'targettype' => 'completion_award', 'targetid' => (int)($award->id ?? 0),
            'details' => json_encode($details + ['ip' => clean_param((string)($_SERVER['REMOTE_ADDR'] ?? ''), PARAM_TEXT)], JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // Verification auditing is best-effort.
    }
}

global $OUTPUT, $PAGE, $DB;

$awardnumber = trim(required_param('awardnumber', PARAM_TEXT));
$code = trim(optional_param('code', '', PARAM_ALPHANUMEXT));
// IP-keyed limit works even for a cookieless client (the $_SESSION limiter
// below does not); either tripping stops the request.
$limited = pqh_ip_rate_limited('certificate_verify', 30, 60) || pqcv_rate_limited();
$award = $limited ? null : pqcp_load_public_award($awardnumber);
$verified = !$limited && $award && pqcp_verify_certificate_code($award, $code);

$status = $verified ? (string)($award->status ?? 'issued') : 'not_found';
$isvalid = $verified && in_array($status, ['issued', 'draft'], true);
$isrevoked = $verified && $status === 'revoked';

$student = null;
$workspacename = '';
$consumername = '';
$support = '';
if ($verified) {
    $student = core_user::get_user((int)$award->studentid, 'id,firstname,lastname', IGNORE_MISSING);
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => (int)$award->workspaceid], 'id,name', IGNORE_MISSING);
    $workspacename = $workspace ? (string)$workspace->name : '';
    $consumerid = (int)$DB->get_field('local_prequran_consumer', 'id', ['primaryworkspaceid' => (int)$award->workspaceid], IGNORE_MULTIPLE);
    if ($consumerid > 0) {
        $consumer = $DB->get_record('local_prequran_consumer', ['id' => $consumerid], 'name,supportemail', IGNORE_MISSING);
        $consumername = $consumer ? (string)$consumer->name : '';
        $support = $consumer ? trim((string)$consumer->supportemail) : '';
    }
}

if ($limited) {
    pqcv_audit('certificate_public_verification_rate_limited', null, ['awardnumber' => $awardnumber]);
} else if ($verified) {
    pqcv_audit('certificate_public_verified', $award, ['status' => $status]);
} else {
    pqcv_audit('certificate_public_verification_failed', $award, ['awardnumber' => $awardnumber, 'reason' => $award ? 'invalid_code' : 'not_found']);
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/certificate_verify.php', ['awardnumber' => $awardnumber] + ($code !== '' ? ['code' => $code] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Certificate Verification');
$PAGE->set_heading('Certificate Verification');
$PAGE->add_body_class('pqcv-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

echo $OUTPUT->header();
?>
<style>
body.pqcv-page header,body.pqcv-page footer,body.pqcv-page nav.navbar,body.pqcv-page #page-header,body.pqcv-page #page-footer,body.pqcv-page .drawer,body.pqcv-page .drawer-toggles,body.pqcv-page .block-region,body.pqcv-page [data-region="drawer"],body.pqcv-page [data-region="right-hand-drawer"]{display:none!important}
body.pqcv-page #page,body.pqcv-page #page-content,body.pqcv-page #region-main,body.pqcv-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqcv-shell{min-height:100vh;padding:34px 18px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqcv-card{max-width:820px;margin:0 auto;padding:22px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 14px 34px rgba(23,48,68,.07)}.pqcv-kicker{margin:0 0 6px;color:#2a4c74;font-size:12px;font-weight:950;text-transform:uppercase}.pqcv-title{margin:0;color:#221b22;font-size:30px;font-weight:950}.pqcv-sub{margin:8px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqcv-status{margin:18px 0;padding:14px;border-radius:8px;font-size:18px;font-weight:950}.pqcv-status--valid{background:#edf3f9;color:#24455c}.pqcv-status--bad{background:#fff0ed;color:#883526}.pqcv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqcv-meta{padding:12px;border-radius:8px;background:#f9fbfc;border:1px solid rgba(23,48,68,.1)}.pqcv-meta span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqcv-meta strong{display:block;margin-top:4px;color:#173044;font-size:14px;font-weight:950;overflow-wrap:anywhere}.pqcv-note{margin-top:16px;color:#5e7280;font-size:13px;font-weight:750;line-height:1.5}.pqcv-support{margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,48,68,.1);color:#415363;font-weight:850}
@media(max-width:720px){.pqcv-grid{grid-template-columns:1fr}.pqcv-title{font-size:25px}}
</style>
<style><?php echo pqh_openproject_skin_css('pqcv', 'pqcv-page'); ?></style>
<main class="pqcv-shell">
  <section class="pqcv-card">
    <p class="pqcv-kicker">Public Verification</p>
    <h1 class="pqcv-title">Certificate Status</h1>
    <p class="pqcv-sub">This page confirms whether a submitted certificate number and verification code match a genuine award.</p>

    <?php if ($limited): ?>
      <div class="pqcv-status pqcv-status--bad">Verification temporarily unavailable</div>
      <p class="pqcv-note">Too many verification attempts were received in a short period. Please wait a minute and try again.</p>
    <?php elseif (!$verified): ?>
      <div class="pqcv-status pqcv-status--bad">Not found or verification code mismatch</div>
      <div class="pqcv-grid">
        <div class="pqcv-meta"><span>Certificate number</span><strong><?php echo s($awardnumber); ?></strong></div>
        <div class="pqcv-meta"><span>Status</span><strong>Not verified</strong></div>
      </div>
      <p class="pqcv-note">For privacy, this page does not disclose whether a certificate number exists unless the verification code also matches.</p>
    <?php else: ?>
      <div class="pqcv-status <?php echo $isrevoked ? 'pqcv-status--bad' : 'pqcv-status--valid'; ?>">
        <?php echo $isrevoked ? 'Certificate REVOKED — no longer valid' : ($isvalid ? 'Valid certificate' : 'Certificate is ' . s(pqcv_label($status))); ?>
      </div>
      <div class="pqcv-grid">
        <div class="pqcv-meta"><span>Certificate number</span><strong><?php echo s((string)$award->awardnumber); ?></strong></div>
        <div class="pqcv-meta"><span>Status</span><strong><?php echo s(pqcv_label($status)); ?></strong></div>
        <div class="pqcv-meta"><span>Award</span><strong><?php echo s((string)$award->title); ?></strong></div>
        <div class="pqcv-meta"><span>Type</span><strong><?php echo s(pqcv_label((string)$award->award_type)); ?></strong></div>
        <div class="pqcv-meta"><span>Issuer</span><strong><?php echo s($consumername !== '' ? $consumername : ($workspacename !== '' ? $workspacename : 'EduPlatform')); ?></strong></div>
        <div class="pqcv-meta"><span>Issued</span><strong><?php echo s(pqcv_date((int)($award->issuedat ?? 0))); ?></strong></div>
        <div class="pqcv-meta"><span>Recipient</span><strong><?php echo s($student ? pqcv_mask_name(fullname($student)) : 'Student'); ?></strong></div>
      </div>
      <?php if ($isrevoked): ?><p class="pqcv-note">This certificate has been revoked by the issuing institution and must not be accepted. Contact the issuer before relying on it.</p><?php endif; ?>
      <p class="pqcv-note">The recipient's full name, grades, and other personal details are intentionally not shown on the public verification page.</p>
    <?php endif; ?>

    <?php if ($support !== ''): ?><div class="pqcv-support">Support: <?php echo s($support); ?></div><?php endif; ?>
  </section>
</main>
<?php
echo $OUTPUT->footer();
