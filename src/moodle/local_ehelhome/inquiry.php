<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

function ehinq_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function ehinq_param(string $name, int $limit = 255): string {
    return core_text::substr(trim(optional_param($name, '', PARAM_TEXT)), 0, $limit);
}

function ehinq_message(string $name, int $limit = 3000): string {
    return core_text::substr(trim(optional_param($name, '', PARAM_RAW_TRIMMED)), 0, $limit);
}

function ehinq_audit(array $details): void {
    global $DB, $USER;
    if (!ehinq_table_exists('local_prequran_live_audit')) {
        return;
    }
    $details['ip_hash'] = hash('sha256', getremoteaddr() ?: 'unknown');
    $details['ua_hash'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => isloggedin() && !isguestuser() ? (int)$USER->id : 0,
        'action' => 'general_inquiry_submitted',
        'targettype' => 'general_inquiry',
        'targetid' => 0,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

$PAGE->set_url('/local/ehelhome/inquiry.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('General Inquiry');
$PAGE->set_heading('General Inquiry');
$PAGE->set_cacheable(false);

$submitted = optional_param('submitted', 0, PARAM_BOOL);
$errors = [];
$form = [
    'name' => '',
    'contact' => '',
    'role' => '',
    'subject' => '',
    'message' => '',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $form = [
        'name' => ehinq_param('name'),
        'contact' => ehinq_param('contact'),
        'role' => ehinq_param('role', 80),
        'subject' => ehinq_param('subject', 160),
        'message' => ehinq_message('message'),
    ];
    $website = ehinq_param('website');

    if ($website !== '') {
        $errors['form'] = 'Please submit the form again.';
    }
    if ($form['name'] === '') {
        $errors['name'] = 'Please enter your name.';
    }
    if ($form['contact'] === '') {
        $errors['contact'] = 'Please enter an email, phone, or WhatsApp number.';
    }
    if ($form['subject'] === '') {
        $errors['subject'] = 'Please enter a subject.';
    }
    if ($form['message'] === '') {
        $errors['message'] = 'Please enter your message.';
    }

    if (!$errors) {
        ehinq_audit($form);
        redirect(new moodle_url('/local/ehelhome/inquiry.php', ['submitted' => 1]));
    }
}

function ehinq_error(array $errors, string $field): string {
    return isset($errors[$field]) ? '<div class="ehi-error">' . s($errors[$field]) . '</div>' : '';
}

function ehinq_selected(array $form, string $value): string {
    return $form['role'] === $value ? ' selected' : '';
}

echo $OUTPUT->header();
echo ehp_styles();
?>
<style>
body{margin:0!important;background:#fffaf0!important;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#162b35}
.ehi-shell{min-height:100vh;background:linear-gradient(180deg,rgba(255,250,240,.94),rgba(246,255,248,.96)),url("/local/ehelhome/pix/landing-course-qaida.jpg") center/cover fixed no-repeat}
.ehi-wrap{width:min(980px,calc(100% - 32px));margin:0 auto}
.ehi-main{padding:48px 0 64px}
.ehi-panel{padding:30px;border-radius:10px;background:rgba(255,255,255,.94);border:1px solid rgba(22,43,53,.12);box-shadow:0 18px 50px rgba(22,43,53,.08);backdrop-filter:blur(8px)}
.ehi-eyebrow{margin:0 0 8px;color:#d99a26;font-size:13px;font-weight:950;text-transform:uppercase}
.ehi-title{margin:0;color:#0f3d2e;font-size:42px;line-height:1.08;font-weight:950}
.ehi-intro{max-width:760px;margin:14px 0 0;color:#5f6f75;font-size:17px;line-height:1.65;font-weight:700}
.ehi-form{display:grid;gap:16px;margin-top:26px}
.ehi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ehi-field label{display:block;margin:0 0 7px;color:#0f3d2e;font-size:14px;font-weight:950}
.ehi-input,.ehi-select,.ehi-textarea{width:100%;border:1px solid rgba(22,43,53,.18);border-radius:8px;background:#fff;color:#162b35;font:750 15px/1.4 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.ehi-input,.ehi-select{min-height:46px;padding:0 12px}
.ehi-textarea{min-height:150px;padding:12px;resize:vertical}
.ehi-input:focus,.ehi-select:focus,.ehi-textarea:focus{outline:0;border-color:#d99a26;box-shadow:0 0 0 4px rgba(217,154,38,.18)}
.ehi-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:4px}
.ehi-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:0;border-radius:8px;background:#d99a26;color:#16110a!important;text-decoration:none;font-weight:950;cursor:pointer}
.ehi-btn--light{background:#fff;border:1px solid rgba(15,61,46,.18);color:#0f3d2e!important}
.ehi-error{margin-top:6px;color:#8b1d1d;font-size:13px;font-weight:850}
.ehi-alert{margin-top:20px;padding:16px;border-radius:8px;background:#e9f8e6;color:#0f3d2e;font-weight:850}
.ehi-hidden{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
@media(max-width:760px){.ehi-grid{grid-template-columns:1fr}.ehi-title{font-size:32px}}
</style>
<main class="ehi-shell">
  <?php echo ehp_header('contact'); ?>
  <section class="ehi-main">
    <div class="ehi-wrap">
      <div class="ehi-panel">
        <p class="ehi-eyebrow">General inquiry</p>
        <h1 class="ehi-title">Ask Ehel Quraan Academy</h1>
        <p class="ehi-intro">Use this form for general questions about courses, schedules, parent support, institutional programs, student access, teacher communication, live sessions, reports, or academy services.</p>

        <?php if ($submitted): ?>
          <div class="ehi-alert">Thank you. Your inquiry has been received and the academy team will review it.</div>
          <div class="ehi-actions">
            <a class="ehi-btn" href="<?php echo (new moodle_url('/local/hubredirect/public_intake.php'))->out(false); ?>">Request Enrollment</a>
            <a class="ehi-btn ehi-btn--light" href="<?php echo (new moodle_url('/local/ehelhome/index.php'))->out(false); ?>">Back to Home</a>
          </div>
        <?php else: ?>
          <?php echo ehinq_error($errors, 'form'); ?>
          <form class="ehi-form" method="post" action="<?php echo (new moodle_url('/local/ehelhome/inquiry.php'))->out(false); ?>">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <div class="ehi-hidden"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
            <div class="ehi-grid">
              <div class="ehi-field">
                <label for="ehi-name">Name</label>
                <input class="ehi-input" id="ehi-name" name="name" value="<?php echo s($form['name']); ?>" required>
                <?php echo ehinq_error($errors, 'name'); ?>
              </div>
              <div class="ehi-field">
                <label for="ehi-contact">Email, phone, or WhatsApp</label>
                <input class="ehi-input" id="ehi-contact" name="contact" value="<?php echo s($form['contact']); ?>" required>
                <?php echo ehinq_error($errors, 'contact'); ?>
              </div>
            </div>
            <div class="ehi-grid">
              <div class="ehi-field">
                <label for="ehi-role">I am contacting as</label>
                <select class="ehi-select" id="ehi-role" name="role">
                  <option value="">Select one</option>
                  <option value="parent"<?php echo ehinq_selected($form, 'parent'); ?>>Parent or guardian</option>
                  <option value="student"<?php echo ehinq_selected($form, 'student'); ?>>Student</option>
                  <option value="teacher"<?php echo ehinq_selected($form, 'teacher'); ?>>Teacher</option>
                  <option value="institution"<?php echo ehinq_selected($form, 'institution'); ?>>School, masjid, or institution</option>
                  <option value="general"<?php echo ehinq_selected($form, 'general'); ?>>General inquiry</option>
                </select>
              </div>
              <div class="ehi-field">
                <label for="ehi-subject">Subject</label>
                <input class="ehi-input" id="ehi-subject" name="subject" value="<?php echo s($form['subject']); ?>" required>
                <?php echo ehinq_error($errors, 'subject'); ?>
              </div>
            </div>
            <div class="ehi-field">
              <label for="ehi-message">Message</label>
              <textarea class="ehi-textarea" id="ehi-message" name="message" required><?php echo s($form['message']); ?></textarea>
              <?php echo ehinq_error($errors, 'message'); ?>
            </div>
            <div class="ehi-actions">
              <button class="ehi-btn" type="submit">Send Inquiry</button>
              <a class="ehi-btn ehi-btn--light" href="<?php echo (new moodle_url('/local/ehelhome/contact.php'))->out(false); ?>">Back to Contact</a>
            </div>
          </form>
        <?php endif; ?>
      </div>
    </div>
  </section>
</main>
<!-- Start of LiveChat (www.livechat.com) code -->
<script>
    window.__lc = window.__lc || {};
    window.__lc.license = 19790025;
    window.__lc.integration_name = "manual_onboarding";
    window.__lc.product_name = "livechat";
    ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))
</script>
<noscript><a href="https://www.livechat.com/chat-with/19790025/" rel="nofollow">Chat with us</a>, powered by <a href="https://www.livechat.com/?welcome" rel="noopener nofollow" target="_blank">LiveChat</a></noscript>
<!-- End of LiveChat code -->
<?php echo ehp_faq_bot_code(); ?>
<?php
echo $OUTPUT->footer();
