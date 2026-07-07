<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');

$consumer = pqh_requested_consumer_context();
$slug = (string)$consumer->consumerslug;
$isinstitution = (string)($consumer->consumer_type ?? '') === 'institution';
if (!$isinstitution) {
    pqh_access_denied(
        'Choose an institution before sending an inquiry.',
        new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => $slug]),
        'Institution inquiry unavailable'
    );
}
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;
$support = trim((string)($consumer->supportemail ?? ''));
$theme = json_decode((string)($consumer->themejson ?? ''), true);
$theme = is_array($theme) ? $theme : [];
$copy = json_decode((string)($consumer->copyjson ?? ''), true);
$copy = is_array($copy) ? $copy : [];
$primary = preg_match('/^#[0-9a-fA-F]{6}$/', (string)($theme['primary_color'] ?? '')) ? (string)$theme['primary_color'] : '#2f6f4e';
$accent = preg_match('/^#[0-9a-fA-F]{6}$/', (string)($theme['accent_color'] ?? '')) ? (string)$theme['accent_color'] : '#d99a26';
$initials = strtoupper(substr(trim((string)($copy['brand_initials'] ?? '')), 0, 6));
if ($initials === '') {
    $initials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $brand) ?: 'I', 0, 1));
}
$params = ['consumer' => $slug];
if ($workspaceid > 0) {
    $params['workspaceid'] = $workspaceid;
}

$message = '';
$error = '';
$form = [
    'name' => '',
    'email' => '',
    'phone' => '',
    'interest' => '',
    'details' => '',
];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the institution inquiry page and try again.',
            new moodle_url('/local/hubredirect/institution_inquiry.php', $params),
            'Institution inquiry form expired'
        );
    }
    $form = [
        'name' => trim(optional_param('name', '', PARAM_TEXT)),
        'email' => clean_param(trim(optional_param('email', '', PARAM_TEXT)), PARAM_EMAIL),
        'phone' => trim(optional_param('phone', '', PARAM_TEXT)),
        'interest' => trim(optional_param('interest', '', PARAM_TEXT)),
        'details' => trim(optional_param('details', '', PARAM_TEXT)),
    ];
    if ($form['name'] === '' || $form['email'] === '' || !validate_email($form['email']) || $form['details'] === '') {
        $error = 'Please enter your name, a valid email, and inquiry details.';
    } else {
        $supportuser = pqhi_support_recipient_for_consumer($consumer);
        $subject = 'Public inquiry';
        $lines = [
            'New public institution inquiry',
            '',
            'Institution: ' . $brand,
            'Name: ' . $form['name'],
            'Email: ' . $form['email'],
            'Phone: ' . $form['phone'],
            'Interest: ' . $form['interest'],
            '',
            $form['details'],
        ];
        $body = implode("\n", $lines);
        $sent = pqhi_send_consumer_email($supportuser, $consumer, $subject, $body, nl2br(s($body)));
        $message = $sent ? 'Inquiry sent. The institution team can follow up from the support mailbox.' : 'Inquiry received, but email delivery was not confirmed.';
        if ($sent) {
            $form = ['name' => '', 'email' => '', 'phone' => '', 'interest' => '', 'details' => ''];
        }
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_inquiry.php', $params));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brand . ' Inquiry');
$PAGE->set_heading($brand . ' Inquiry');
$PAGE->add_body_class('pqii-page');
echo $OUTPUT->header();
?>
<style>
body.pqii-page header,body.pqii-page footer,body.pqii-page nav.navbar,body.pqii-page #page-header,body.pqii-page #page-footer,body.pqii-page .drawer,body.pqii-page .drawer-toggles,body.pqii-page .block-region,body.pqii-page [data-region="drawer"],body.pqii-page [data-region="right-hand-drawer"]{display:none!important}
body.pqii-page #page,body.pqii-page #page-content,body.pqii-page #region-main,body.pqii-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqii-shell{min-height:100vh;padding:36px 18px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqii-wrap{max-width:980px;margin:0 auto}.pqii-top,.pqii-panel{padding:20px;border-radius:8px;border:1px solid rgba(23,48,68,.12);background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqii-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.pqii-brand{display:flex;gap:12px;align-items:center;font-weight:950}.pqii-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:10px;background:var(--pqi-primary);color:#fff;font-weight:950}.pqii-actions{display:flex;gap:9px;flex-wrap:wrap}.pqii-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;border:1px solid rgba(23,48,68,.13);background:#eef4f6;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqii-btn--primary{background:var(--pqi-accent);border-color:var(--pqi-accent);color:#1b1409!important}.pqii-title{margin:0;color:#221b22;font-size:34px;font-weight:950}.pqii-sub{margin:7px 0 0;color:#536978;font-size:15px;font-weight:760;line-height:1.55}.pqii-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pqii-field{display:grid;gap:5px;margin-bottom:12px}.pqii-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqii-input,.pqii-select,.pqii-textarea{width:100%;min-height:42px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:14px;font-weight:780}.pqii-textarea{min-height:130px;padding:10px;line-height:1.45}.pqii-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqii-alert--ok{background:#edf9ef;color:#245c35}.pqii-alert--bad{background:#fff0ed;color:#883526}
@media(max-width:760px){.pqii-top,.pqii-grid{display:block}.pqii-actions{margin-top:12px}.pqii-panel{margin-top:12px}}
</style>
<main class="pqii-shell" style="--pqi-primary: <?php echo s($primary); ?>; --pqi-accent: <?php echo s($accent); ?>;">
  <div class="pqii-wrap">
    <section class="pqii-top">
      <div class="pqii-brand"><span class="pqii-mark"><?php echo s($initials); ?></span><span><?php echo s($brand); ?></span></div>
      <nav class="pqii-actions">
        <a class="pqii-btn" href="<?php echo (new moodle_url('/local/hubredirect/institution_profile.php', $params))->out(false); ?>">Profile</a>
        <a class="pqii-btn" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $params))->out(false); ?>">Landing</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqii-alert pqii-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqii-alert pqii-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <form class="pqii-panel" method="post">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <h1 class="pqii-title">Contact <?php echo s($brand); ?></h1>
      <p class="pqii-sub">Send a public inquiry about enrollment, teacher services, schedules, or institution support.</p>
      <div class="pqii-grid">
        <div class="pqii-field"><label>Name</label><input class="pqii-input" name="name" value="<?php echo s($form['name']); ?>" required></div>
        <div class="pqii-field"><label>Email</label><input class="pqii-input" name="email" type="email" value="<?php echo s($form['email']); ?>" required></div>
      </div>
      <div class="pqii-grid">
        <div class="pqii-field"><label>Phone / WhatsApp</label><input class="pqii-input" name="phone" value="<?php echo s($form['phone']); ?>"></div>
        <div class="pqii-field"><label>Interest</label><select class="pqii-select" name="interest">
          <?php foreach (['Student enrollment', 'Teacher services', 'Institution partnership', 'Technical support', 'Other'] as $option): ?>
            <option value="<?php echo s($option); ?>" <?php echo $form['interest'] === $option ? 'selected' : ''; ?>><?php echo s($option); ?></option>
          <?php endforeach; ?>
        </select></div>
      </div>
      <div class="pqii-field"><label>Details</label><textarea class="pqii-textarea" name="details" required><?php echo s($form['details']); ?></textarea></div>
      <button class="pqii-btn pqii-btn--primary" type="submit">Send inquiry</button>
    </form>
  </div>
</main>
<?php
echo $OUTPUT->footer();
