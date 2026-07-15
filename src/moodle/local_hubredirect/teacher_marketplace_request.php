<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'the marketplace';
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$requesturl = new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => $teacherid] + $consumerparams);

$PAGE->set_context($context);
$PAGE->set_url($requesturl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Request Teacher');
$PAGE->set_heading('Request Teacher');
$PAGE->add_body_class('pqh-teacher-request-start-page');

if ($teacherid <= 0) {
    redirect(new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams));
}

$profile = null;
if ($DB->get_manager()->table_exists('local_prequran_teacher_profile')) {
    $profilecolumns = $DB->get_columns('local_prequran_teacher_profile');
    $conditions = ['userid' => $teacherid, 'status' => 'active'];
    if (array_key_exists('marketplace_visible', $profilecolumns)) {
        $conditions['marketplace_visible'] = 1;
    }
    if (array_key_exists('marketplace_status', $profilecolumns)) {
        $conditions['marketplace_status'] = 'published';
    }
    if (array_key_exists('vetting_status', $profilecolumns)) {
        $conditions['vetting_status'] = 'approved';
    }
    if (array_key_exists('consumerid', $profilecolumns)
            && (int)$consumercontext->consumerid > 0) {
        $conditions['consumerid'] = (int)$consumercontext->consumerid;
    }
    $profiles = $DB->get_records('local_prequran_teacher_profile', $conditions, 'timemodified DESC', '*', 0, 1);
    $profile = $profiles ? reset($profiles) : null;
}
$marketplaceurl = new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams);
if (!$profile) {
    redirect($marketplaceurl);
}
$profileurl = $profile
    ? pqh_teacher_public_profile_url($profile, $consumercontext)
    : new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => $teacherid] + $consumerparams);
if (isloggedin() && !isguestuser()) {
    redirect(new moodle_url('/local/hubredirect/marketplace_enrollment.php', ['teacherid' => $teacherid] + $consumerparams));
}

$teachername = trim((string)($profile->teacher_display_name ?? ''));
if ($teachername === '') {
    $teachername = 'this teacher';
}
$loginurl = new moodle_url('/local/hubredirect/consumer_login.php', [
    'consumer' => (string)$consumercontext->consumerslug,
    'intent' => 'login',
    'wantsurl' => $requesturl->out(false),
]);
$newrequesturl = new moodle_url('/local/hubredirect/marketplace_enrollment.php', ['teacherid' => $teacherid] + $consumerparams);

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-request-start-page header,body.pqh-teacher-request-start-page footer,body.pqh-teacher-request-start-page nav.navbar,body.pqh-teacher-request-start-page #page-header,body.pqh-teacher-request-start-page #page-footer,body.pqh-teacher-request-start-page .drawer,body.pqh-teacher-request-start-page .drawer-toggles{display:none!important}
body.pqh-teacher-request-start-page #page,body.pqh-teacher-request-start-page #page-content,body.pqh-teacher-request-start-page #region-main,body.pqh-teacher-request-start-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqtms-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqtms-wrap{max-width:920px;margin:0 auto}.pqtms-top,.pqtms-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqtms-top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:24px;margin-bottom:14px;background:linear-gradient(90deg,#3f7a50,#a8c3b5 58%,#fff)}.pqtms-title{margin:0;color:#fff;font-size:30px;font-weight:950}.pqtms-sub{margin:7px 0 0;color:rgba(255,255,255,.9);font-weight:800}.pqtms-back{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;background:#eef4f6;border:1px solid rgba(23,48,68,.12);color:#173044!important;text-decoration:none;font-weight:950}.pqtms-panel{padding:22px}.pqtms-panel h2{margin:0 0 8px;color:#241b24;font-size:22px;font-weight:950}.pqtms-intro{margin:0 0 18px;color:#526875;font-weight:780;line-height:1.5}.pqtms-options{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pqtms-option{padding:18px;border:1px solid rgba(23,48,68,.13);border-radius:8px;background:#f9fbfc}.pqtms-option h3{margin:0 0 8px;color:#241b24;font-size:18px;font-weight:950}.pqtms-option p{margin:0 0 16px;color:#526875;font-weight:760;line-height:1.48}.pqtms-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-weight:950}.pqtms-btn--gold{background:#d99a26;color:#1b1409!important}.pqtms-note{margin:18px 0 0;padding-top:16px;border-top:1px solid rgba(23,48,68,.1);color:#607582;font-size:13px;font-weight:760;line-height:1.45}@media(max-width:700px){.pqtms-top{display:block}.pqtms-back{margin-top:14px}.pqtms-options{grid-template-columns:1fr}.pqtms-title{font-size:25px}}
</style>
<main class="pqtms-shell">
  <div class="pqtms-wrap">
    <section class="pqtms-top">
      <div><h1 class="pqtms-title">Request <?php echo s($teachername); ?></h1><p class="pqtms-sub">Choose how you would like to continue.</p></div>
      <a class="pqtms-back" href="<?php echo $profileurl->out(false); ?>">Back to profile</a>
    </section>
    <section class="pqtms-panel">
      <h2>Continue your teacher request</h2>
      <p class="pqtms-intro">Existing families can sign in. New families and adult learners can submit a secure intake without creating a duplicate account.</p>
      <div class="pqtms-options">
        <article class="pqtms-option">
          <h3>I already have an account</h3>
          <p>Sign in with your existing <?php echo s($brandname); ?> account. You will return to the required marketplace enrollment for <?php echo s($teachername); ?>.</p>
          <a class="pqtms-btn" href="<?php echo $loginurl->out(false); ?>">Log in and continue</a>
        </article>
        <article class="pqtms-option">
          <h3>I am new to <?php echo s($brandname); ?></h3>
          <p>Share the learner's goals, level, contact information, and preferred schedule. <?php echo s($teachername); ?> will remain selected.</p>
          <a class="pqtms-btn pqtms-btn--gold" href="<?php echo $newrequesturl->out(false); ?>">Start a new request</a>
        </article>
      </div>
      <p class="pqtms-note"><?php echo s($brandname); ?> checks existing verified contact details before account conversion. Existing parent and learner identities are reused instead of creating duplicates.</p>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
