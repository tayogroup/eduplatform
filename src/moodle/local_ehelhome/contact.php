<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/contact.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Contact Ehel Quraan Academy');
$PAGE->set_heading('Contact Ehel Quraan Academy');
$PAGE->set_cacheable(false);

echo $OUTPUT->header();
echo ehp_styles();
?>
<style>
body{margin:0!important;background:#fffaf0!important;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#162b35}
.ehc-shell{min-height:100vh;background:linear-gradient(180deg,#fffaf0 0%,#f6fff8 100%)}
.ehc-wrap{width:min(1240px,calc(100% - 32px));margin:0 auto}
.ehc-main{padding:48px 0 64px}
.ehc-hero{position:relative;overflow:hidden;min-height:280px;padding:42px 36px;border-radius:10px;background:linear-gradient(90deg,rgba(8,31,24,.92),rgba(15,61,46,.72) 54%,rgba(15,61,46,.34)),url("/local/ehelhome/pix/landing-welcome.jpg") center/cover no-repeat;border:1px solid rgba(22,43,53,.12);box-shadow:0 18px 50px rgba(22,43,53,.08);color:#fff}
.ehc-eyebrow{margin:0 0 8px;color:#d99a26;font-size:13px;font-weight:950;text-transform:uppercase}
.ehc-hero .ehc-eyebrow{color:#ffd88c}.ehc-title{margin:0;color:#fff;font-size:42px;line-height:1.08;font-weight:950;text-shadow:0 8px 28px rgba(0,0,0,.28)}
.ehc-intro{max-width:720px;margin:14px 0 0;color:rgba(255,255,255,.88);font-size:17px;line-height:1.65;font-weight:700}
.ehc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:20px;align-items:stretch}
.ehc-grid--audiences{grid-template-columns:repeat(4,minmax(0,1fr))}
.ehc-grid--support{grid-template-columns:repeat(6,minmax(0,1fr))}
.ehc-grid--support .ehc-card{grid-column:span 2}
.ehc-grid--support .ehc-card:nth-child(4){grid-column:2 / span 2}
.ehc-grid--support .ehc-card:nth-child(5){grid-column:4 / span 2}
.ehc-card{height:100%;padding:18px;border-radius:10px;background:#fff;border:1px solid rgba(22,43,53,.12)}
.ehc-card h2{margin:0 0 8px;color:#0f3d2e;font-size:19px;font-weight:950}
.ehc-card p{margin:0;color:#5f6f75;font-size:15px;line-height:1.55;font-weight:700}
.ehc-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.ehc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:8px;background:#d99a26;color:#16110a!important;text-decoration:none;font-weight:950}
.ehc-btn--light{background:#fff;border:1px solid rgba(15,61,46,.18);color:#0f3d2e!important}
@media(max-width:1020px){.ehc-grid--audiences{grid-template-columns:repeat(2,minmax(0,1fr))}.ehc-grid--support{grid-template-columns:repeat(2,minmax(0,1fr))}.ehc-grid--support .ehc-card,.ehc-grid--support .ehc-card:nth-child(4),.ehc-grid--support .ehc-card:nth-child(5){grid-column:auto}}
@media(max-width:760px){.ehc-grid,.ehc-grid--audiences,.ehc-grid--support{grid-template-columns:1fr}.ehc-title{font-size:32px}}
</style>
<main class="ehc-shell">
  <?php echo ehp_header('contact'); ?>
  <section class="ehc-main">
    <div class="ehc-wrap">
      <div class="ehc-hero">
        <p class="ehc-eyebrow">General contact</p>
        <h1 class="ehc-title">Contact Ehel Quraan Academy</h1>
        <p class="ehc-intro">For enrollment questions, course guidance, parent support, institutional programs, teacher inquiries, live-session help, or general academy information, please contact the academy team. We will direct your message to the right support path.</p>
        <div class="ehc-actions">
          <a class="ehc-btn" href="<?php echo (new moodle_url('/local/hubredirect/public_intake.php'))->out(false); ?>">Request Enrollment</a>
          <a class="ehc-btn" href="<?php echo (new moodle_url('/local/ehelhome/inquiry.php'))->out(false); ?>">General Inquiry</a>
          <a class="ehc-btn ehc-btn--light" href="<?php echo (new moodle_url('/local/ehelhome/index.php'))->out(false); ?>">Back to Home</a>
        </div>
      </div>
      <div class="ehc-grid ehc-grid--audiences">
        <article class="ehc-card">
          <h2>Families</h2>
          <p>Ask about course placement, schedules, parent dashboards, reports, consent, and learner support.</p>
        </article>
        <article class="ehc-card">
          <h2>Students</h2>
          <p>Get help with login, course access, assignments, live sessions, practice activities, or homework guidance.</p>
        </article>
        <article class="ehc-card">
          <h2>Teachers</h2>
          <p>Contact the academy about teaching roles, class groups, availability, quality review, and learner follow-up.</p>
        </article>
        <article class="ehc-card">
          <h2>Institutions</h2>
          <p>Ask about programs for schools, masjids, community groups, learner cohorts, reports, scheduling, and group support.</p>
        </article>
      </div>
      <div class="ehc-grid ehc-grid--rooms">
        <article class="ehc-card">
          <h2>Parent Rooms</h2>
          <p>Parents can use moderated meeting rooms for orientation, follow-up, schedule discussions, and family support.</p>
        </article>
        <article class="ehc-card">
          <h2>Student Rooms</h2>
          <p>Students can join live classes and supervised practice rooms for guided homework, correction, and monitored self-learning.</p>
        </article>
        <article class="ehc-card">
          <h2>Teacher-Parent Rooms</h2>
          <p>Teachers and families can meet in organized rooms for learner progress, feedback, goals, and next-step planning.</p>
        </article>
      </div>
      <div class="ehc-grid ehc-grid--support">
        <article class="ehc-card">
          <h2>WhatsApp Follow-Up</h2>
          <p>Important parent alerts and urgent follow-up can be supported through WhatsApp when configured for the family.</p>
        </article>
        <article class="ehc-card">
          <h2>Reports And Dashboards</h2>
          <p>Families and teachers can review attendance, progress, teacher notes, homework, quiz results, self-evaluation, and live-session history.</p>
        </article>
        <article class="ehc-card">
          <h2>Gamified Practice</h2>
          <p>Ask about practice games, stars, quizzes, progress signals, and how students can stay motivated between classes.</p>
        </article>
        <article class="ehc-card">
          <h2>Live Chat</h2>
          <p>Use the live chat widget for quick enrollment, placement, account, schedule, or class-access questions.</p>
        </article>
        <article class="ehc-card">
          <h2>Safe Communications</h2>
          <p>Messages, rooms, recordings, and access are organized with privacy, consent, and child protection in mind.</p>
        </article>
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
