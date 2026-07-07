<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

$consumer = pqh_requested_consumer_context();
$slug = (string)$consumer->consumerslug;
$consumertype = (string)($consumer->consumer_type ?? '');
$isprofileconsumer = in_array($consumertype, ['institution', 'academy_consumer'], true);
if (!$isprofileconsumer) {
    pqh_access_denied(
        'Choose an institution or academy before opening the public profile.',
        new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => $slug]),
        'Public profile unavailable'
    );
}
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;
$emailconsumer = $consumer;
if ((int)($consumer->consumerid ?? 0) > 0 && pqh_table_exists_safe('local_prequran_consumer')) {
    $emailconsumer = $DB->get_record('local_prequran_consumer', ['id' => (int)$consumer->consumerid], '*', IGNORE_MISSING) ?: $consumer;
}
$theme = pqh_consumer_theme($consumer);
$copy = pqh_consumer_copy($consumer);
$primary = (string)$theme['primary_color'];
$accent = (string)$theme['accent_color'];
$heroimage = pqh_consumer_hero_image_url($consumer);
$logo = trim((string)($consumer->logourl ?? ''));
$initials = pqh_consumer_brand_initials($consumer, 'I');
$headline = trim((string)($copy['landing_headline'] ?? '')) ?: $brand;
$subtitle = trim((string)($copy['landing_subtitle'] ?? '')) ?: 'A branded teaching workspace for students, teachers, live sessions, reporting, and custom-domain access.';
$body = trim((string)($copy['landing_body'] ?? ''));
$courses = trim((string)($copy['initial_courses'] ?? 'Pre-Quraan'));
$support = trim((string)($consumer->supportemail ?? ''));
$notice = optional_param('sent', 0, PARAM_INT) === 1 ? 'Your inquiry was sent.' : '';
$error = '';
$params = ['consumer' => $slug];
if ($workspaceid > 0) {
    $params['workspaceid'] = $workspaceid;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the public profile and submit the inquiry again.',
            new moodle_url('/local/hubredirect/institution_profile.php', $params),
            'Inquiry form expired'
        );
    }
    try {
        if (trim(optional_param('website', '', PARAM_TEXT)) !== '') {
            redirect(new moodle_url('/local/hubredirect/institution_profile.php', $params + ['sent' => 1]));
        }
        $inquirername = trim(optional_param('inquirer_name', '', PARAM_TEXT));
        $inquireremail = trim(optional_param('inquirer_email', '', PARAM_EMAIL));
        $inquirerphone = trim(optional_param('inquirer_phone', '', PARAM_TEXT));
        $interest = trim(optional_param('interest', '', PARAM_TEXT));
        $inquirymessage = trim(optional_param('inquiry_message', '', PARAM_TEXT));
        if ($inquirername === '' || $inquireremail === '' || !validate_email($inquireremail) || $inquirymessage === '') {
            throw new invalid_parameter_exception('Name, valid email, and message are required.');
        }
        $recipient = pqhi_support_recipient_for_consumer($emailconsumer);
        $text = "New public profile inquiry for {$brand}\n\n"
            . "Name: {$inquirername}\n"
            . "Email: {$inquireremail}\n"
            . "Phone: {$inquirerphone}\n"
            . "Interest: {$interest}\n\n"
            . "Message:\n{$inquirymessage}\n\n"
            . "Profile: " . (new moodle_url('/local/hubredirect/institution_profile.php', $params))->out(false);
        $html = '<p>New public profile inquiry for <strong>' . s($brand) . '</strong></p>'
            . '<p><strong>Name:</strong> ' . s($inquirername) . '<br>'
            . '<strong>Email:</strong> ' . s($inquireremail) . '<br>'
            . '<strong>Phone:</strong> ' . s($inquirerphone) . '<br>'
            . '<strong>Interest:</strong> ' . s($interest) . '</p>'
            . '<p>' . nl2br(s($inquirymessage)) . '</p>';
        if (!pqhi_send_consumer_email($recipient, $emailconsumer, 'Public profile inquiry', $text, $html)) {
            throw new RuntimeException('The inquiry could not be sent.');
        }
        redirect(new moodle_url('/local/hubredirect/institution_profile.php', $params + ['sent' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_profile.php', $params));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brand . ' Profile');
$PAGE->set_heading($brand . ' Profile');
$PAGE->add_body_class('pqip-page');
echo $OUTPUT->header();
?>
<style>
body.pqip-page header,body.pqip-page footer,body.pqip-page nav.navbar,body.pqip-page #page-header,body.pqip-page #page-footer,body.pqip-page .drawer,body.pqip-page .drawer-toggles,body.pqip-page .block-region,body.pqip-page [data-region="drawer"],body.pqip-page [data-region="right-hand-drawer"]{display:none!important}
body.pqip-page #page,body.pqip-page #page-content,body.pqip-page #region-main,body.pqip-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqip-shell{min-height:100vh;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqip-wrap{max-width:1180px;margin:0 auto;padding:34px 18px 64px}.pqip-nav{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}.pqip-brand{display:flex;align-items:center;gap:12px;color:#172d3d;text-decoration:none;font-weight:950}.pqip-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:10px;background:var(--pqi-primary);color:#fff;font-weight:950;overflow:hidden}.pqip-mark img{width:100%;height:100%;object-fit:cover}.pqip-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.pqip-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border-radius:8px;border:1px solid rgba(23,48,68,.13);background:#eef4f6;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950}.pqip-btn--primary{background:var(--pqi-accent);border-color:var(--pqi-accent);color:#1b1409!important}.pqip-hero{padding:54px 42px;border-radius:8px;background:#173044;background:linear-gradient(115deg,rgba(47,111,78,.94),rgba(47,111,78,.68)),var(--pqi-hero-image) center/cover no-repeat;color:#fff;box-shadow:0 18px 40px rgba(23,48,68,.16)}.pqip-kicker{display:inline-flex;min-height:28px;align-items:center;padding:0 10px;border-radius:999px;background:rgba(255,216,140,.16);border:1px solid rgba(255,216,140,.34);color:#ffd88c;font-size:12px;font-weight:950;text-transform:uppercase}.pqip-title{max-width:850px;margin:18px 0 0;font-size:54px;line-height:1;font-weight:950;color:#fff;letter-spacing:0}.pqip-sub{max-width:820px;margin:18px 0 0;font-size:18px;line-height:1.55;font-weight:780;color:rgba(255,255,255,.9)}.pqip-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin-top:16px}.pqip-card{padding:20px;border-radius:8px;background:#fff;border:1px solid rgba(23,48,68,.12);box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqip-card h2{margin:0 0 10px;color:#221b22;font-size:22px;font-weight:950}.pqip-card p,.pqip-card li{color:#536978;font-size:15px;line-height:1.58;font-weight:760}.pqip-list{margin:0;padding-left:18px}.pqip-pill{display:inline-flex;align-items:center;min-height:28px;margin:0 6px 6px 0;padding:0 10px;border-radius:999px;background:#eef4f6;color:#173044;font-size:13px;font-weight:950}
.pqip-alert{margin-top:16px;padding:12px 14px;border-radius:8px;font-weight:850}.pqip-alert--ok{background:#edf9ef;color:#245c35}.pqip-alert--bad{background:#fff0ed;color:#883526}.pqip-form{display:grid;gap:10px}.pqip-field{display:grid;gap:5px}.pqip-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqip-input,.pqip-textarea{width:100%;border:1px solid rgba(23,48,68,.18);border-radius:8px;box-sizing:border-box;background:#fbfdff;color:#173044;font-size:14px;font-weight:760}.pqip-input{min-height:42px;padding:0 11px}.pqip-textarea{min-height:116px;padding:10px;line-height:1.45}.pqip-hidden{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
@media(max-width:760px){.pqip-nav,.pqip-grid{display:block}.pqip-actions{justify-content:flex-start;margin-top:12px}.pqip-hero{padding:34px 22px}.pqip-title{font-size:36px}.pqip-card{margin-top:14px}}
</style>
<main class="pqip-shell" style="--pqi-primary: <?php echo s($primary); ?>; --pqi-accent: <?php echo s($accent); ?>; --pqi-hero-image: url('<?php echo s($heroimage); ?>');">
  <div class="pqip-wrap">
    <nav class="pqip-nav">
      <a class="pqip-brand" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $params))->out(false); ?>">
        <span class="pqip-mark"><?php if ($logo !== ''): ?><img src="<?php echo s($logo); ?>" alt="<?php echo s($brand); ?>"><?php else: ?><?php echo s($initials); ?><?php endif; ?></span>
        <span><?php echo s($brand); ?></span>
      </a>
      <div class="pqip-actions">
        <a class="pqip-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $params))->out(false); ?>">Landing</a>
        <a class="pqip-btn" href="<?php echo (new moodle_url('/local/hubredirect/public_intake.php', $params))->out(false); ?>">Student Intake</a>
        <a class="pqip-btn pqip-btn--primary" href="#contact">Contact</a>
      </div>
    </nav>
    <section class="pqip-hero">
      <span class="pqip-kicker"><?php echo $consumertype === 'academy_consumer' ? 'Academy profile' : 'Institution profile'; ?></span>
      <h1 class="pqip-title"><?php echo s($headline); ?></h1>
      <p class="pqip-sub"><?php echo s($subtitle); ?></p>
    </section>
    <?php if ($notice !== ''): ?><div class="pqip-alert pqip-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqip-alert pqip-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqip-grid" id="contact">
      <article class="pqip-card">
        <h2>About <?php echo s($brand); ?></h2>
        <p><?php echo s($body !== '' ? $body : $brand . ' uses a dedicated institution workspace for student intake, teacher management, live sessions, assignments, and operational reports.'); ?></p>
        <div>
          <?php foreach (array_filter(array_map('trim', preg_split('/[\r\n,]+/', $courses))) as $course): ?>
            <span class="pqip-pill"><?php echo s($course); ?></span>
          <?php endforeach; ?>
        </div>
      </article>
      <aside class="pqip-card">
        <h2>Institution Services</h2>
        <ul class="pqip-list">
          <li>Student and parent intake</li>
          <li>Teacher onboarding and assignment</li>
          <li>Live classes and recurring schedules</li>
          <li>Materials, attendance, and progress reporting</li>
        </ul>
        <?php if ($support !== ''): ?><p>Support: <?php echo s($support); ?></p><?php endif; ?>
      </aside>
    </section>
    <section class="pqip-grid">
      <article class="pqip-card">
        <h2>Contact <?php echo s($brand); ?></h2>
        <form class="pqip-form" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <div class="pqip-hidden"><label>Website</label><input name="website" autocomplete="off"></div>
          <div class="pqip-field"><label>Your name</label><input class="pqip-input" name="inquirer_name" required></div>
          <div class="pqip-field"><label>Email</label><input class="pqip-input" name="inquirer_email" type="email" required></div>
          <div class="pqip-field"><label>Phone / WhatsApp</label><input class="pqip-input" name="inquirer_phone"></div>
          <div class="pqip-field"><label>Interest</label><input class="pqip-input" name="interest" placeholder="Enrollment, partnership, teacher, support"></div>
          <div class="pqip-field"><label>Message</label><textarea class="pqip-textarea" name="inquiry_message" required></textarea></div>
          <button class="pqip-btn pqip-btn--primary" type="submit">Send inquiry</button>
        </form>
      </article>
      <aside class="pqip-card">
        <h2>Next Step</h2>
        <p>Families can submit student intake, existing users can open the workspace, and new inquiries are routed to the branded support contact for this consumer.</p>
        <p><a class="pqip-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $params))->out(false); ?>">Open landing</a></p>
      </aside>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
