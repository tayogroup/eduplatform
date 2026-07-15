<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function ehp_url(string $path): string {
    return (new moodle_url($path))->out(false);
}

function ehp_page_urls(): array {
    return [
        'home' => ehp_url('/local/ehelhome/index.php'),
        'about' => ehp_url('/local/ehelhome/about.php'),
        'courses' => ehp_url('/local/ehelhome/courses.php'),
        'live' => ehp_url('/local/ehelhome/live-sessions.php'),
        'dashboards' => ehp_url('/local/ehelhome/dashboards.php'),
        'reports' => ehp_url('/local/ehelhome/reports.php'),
        'features' => ehp_url('/local/ehelhome/features.php'),
        'pricing' => ehp_url('/local/ehelhome/pricing.php'),
        'contact' => ehp_url('/local/ehelhome/contact.php'),
        'inquiry' => ehp_url('/local/ehelhome/inquiry.php'),
        'enroll' => ehp_url('/local/hubredirect/public_intake.php'),
        'dashboard' => ehp_url('/local/hubredirect/dashboard.php'),
    ];
}

function ehp_header(string $active = ''): string {
    global $CFG;

    $urls = ehp_page_urls();
    $logo = $CFG->wwwroot . '/local/ehelhome/pix/ehelquraanacademy_logo.svg';
    $items = [
        'home' => 'Home',
        'about' => 'About',
        'courses' => 'Courses',
        'live' => 'Live Sessions',
        'dashboards' => 'Dashboards',
        'reports' => 'Reports',
        'features' => 'Features',
        'pricing' => 'Pricing',
        'contact' => 'Contact',
    ];
    $html = '<div class="ehp-topbar" aria-label="Academy contact bar"><div class="ehp-wrap">';
    $html .= '<span>Online Quran and Arabic learning for children, families, and institutions</span>';
    $html .= '<span>Live classes, student rooms, gamified practice, and parent visibility</span>';
    $html .= '</div></div>';
    $html .= '<header class="ehp-navshell"><div class="ehp-wrap">';
    $html .= '<a class="ehp-brand" href="' . s($urls['home']) . '" aria-label="Ehel Quraan Academy home">';
    $html .= '<img src="' . s($logo) . '" alt="Ehel Quraan Academy logo">';
    $html .= '<span><span class="ehp-brand-name">Ehel Quraan Academy</span>';
    $html .= '<span class="ehp-brand-sub">Online Quran and Arabic learning academy</span></span>';
    $html .= '</a>';
    $html .= '<nav class="ehp-nav" aria-label="Public navigation">';
    foreach ($items as $key => $label) {
        $class = $key === $active ? ' class="ehp-active"' : '';
        $html .= '<a' . $class . ' href="' . s($urls[$key]) . '">' . s($label) . '</a>';
    }
    $html .= '<a href="' . s($urls['enroll']) . '">Enroll</a>';
    $html .= '</nav></div></header>';
    return $html;
}

function ehp_styles(): string {
    return '<style>
body{margin:0!important;background:#fffaf0!important;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#162b35}
.ehp-shell{min-height:100vh;background:#fffaf0}.ehp-wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.ehp-topbar{background:#0f3d2e;color:rgba(255,255,255,.86);font-size:13px;font-weight:700}.ehp-topbar .ehp-wrap{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:16px}.ehp-topbar span{white-space:nowrap}.ehp-navshell{background:rgba(255,250,240,.94);border-bottom:1px solid rgba(22,43,53,.12)}.ehp-navshell .ehp-wrap{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:16px}.ehp-brand{display:inline-flex;align-items:center;gap:14px;color:#0f3d2e!important;text-decoration:none}.ehp-brand img{width:68px;height:auto;flex:0 0 auto}.ehp-brand-name{display:block;color:#0f3d2e;font-size:18px;line-height:1.05;font-weight:900}.ehp-brand-sub{display:block;margin-top:3px;color:#5f6f75;font-size:13px;font-weight:800}.ehp-nav{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.ehp-nav a{color:#162b35!important;text-decoration:none;font-weight:850;font-size:14px}.ehp-nav a:hover,.ehp-nav .ehp-active{color:#176f43!important;text-decoration:underline}.ehp-main{padding:46px 0 64px}.ehp-hero{padding:32px;border-radius:10px;background:#fff;border:1px solid rgba(22,43,53,.12);box-shadow:0 18px 50px rgba(22,43,53,.08)}.ehp-hero--image{position:relative;overflow:hidden;min-height:280px;padding:42px 36px;background:linear-gradient(90deg,rgba(8,31,24,.92),rgba(15,61,46,.72) 54%,rgba(15,61,46,.34)),var(--ehp-hero-bg) center/cover no-repeat;color:#fff}.ehp-hero--image .ehp-eyebrow{color:#ffd88c}.ehp-hero--image .ehp-title{color:#fff;text-shadow:0 8px 28px rgba(0,0,0,.28)}.ehp-hero--image .ehp-intro{color:rgba(255,255,255,.88)}.ehp-hero--courses{--ehp-hero-bg:url("/local/ehelhome/pix/landing-course-qaida.jpg")}.ehp-hero--live,.ehp-hero--dashboards{--ehp-hero-bg:url("/local/ehelhome/pix/landing-welcome.jpg")}.ehp-hero--reports,.ehp-hero--features{--ehp-hero-bg:url("/local/ehelhome/pix/landing-hero-quran.jpg")}.ehp-hero--pricing{position:relative;overflow:hidden;background:linear-gradient(135deg,#fffdf6 0%,#f8fff8 52%,#fff4dc 100%)}.ehp-hero--pricing:after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.22;background-image:linear-gradient(30deg,rgba(15,61,46,.08) 12%,transparent 12.5%,transparent 87%,rgba(15,61,46,.08) 87.5%,rgba(15,61,46,.08)),linear-gradient(150deg,rgba(15,61,46,.08) 12%,transparent 12.5%,transparent 87%,rgba(15,61,46,.08) 87.5%,rgba(15,61,46,.08));background-size:42px 42px}.ehp-hero--pricing>*{position:relative;z-index:1}.ehp-eyebrow{margin:0 0 8px;color:#d99a26;font-size:13px;font-weight:950;text-transform:uppercase}.ehp-title{max-width:820px;margin:0;color:#0f3d2e;font-size:44px;line-height:1.06;font-weight:950}.ehp-intro{max-width:800px;margin:14px 0 0;color:#5f6f75;font-size:17px;line-height:1.65;font-weight:700}.ehp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:20px}.ehp-grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}.ehp-card{padding:18px;border-radius:10px;background:#fff;border:1px solid rgba(22,43,53,.12)}.ehp-card h2,.ehp-card h3{margin:0 0 8px;color:#0f3d2e;font-size:20px;font-weight:950}.ehp-card p{margin:0;color:#5f6f75;font-size:15px;line-height:1.56;font-weight:700}.ehp-list{display:grid;gap:10px;margin:18px 0 0;padding:0;list-style:none}.ehp-list li{padding:14px 16px;border-radius:8px;background:#fff;border:1px solid rgba(22,43,53,.12);color:#40565f;font-weight:750;line-height:1.5}.ehp-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.ehp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:8px;background:#d99a26;color:#16110a!important;text-decoration:none;font-weight:950}.ehp-btn-light{background:#fff;border:1px solid rgba(15,61,46,.18);color:#0f3d2e!important}.ehp-footer{padding:20px 0;background:#081f18;color:rgba(255,255,255,.76);font-size:14px;font-weight:750}
.ehp-dashboard-hero{min-height:0!important;padding:28px 30px!important;border-radius:16px!important;border-color:rgba(105,76,45,.14)!important;background:linear-gradient(135deg,#eaffea 0%,#fff 58%,#fff7e7 100%)!important;color:#162b35!important;box-shadow:0 16px 38px rgba(105,76,45,.08)!important}.ehp-dashboard-hero .ehp-eyebrow{display:inline-flex;align-items:center;gap:9px;margin:0 0 12px;padding:8px 13px;border-radius:999px;background:#fff7df;color:#6f4e32;font-size:12px;font-weight:950}.ehp-dashboard-hero .ehp-eyebrow:before{content:"";width:9px;height:9px;border-radius:999px;background:#d6a642}.ehp-dashboard-hero .ehp-title{display:flex;align-items:center;gap:14px;color:#221b22!important;text-shadow:none!important;font-size:38px}.ehp-dashboard-hero .ehp-title:before{content:"QA";flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:#6f4e32;color:#fff;font-size:16px;font-weight:950}.ehp-dashboard-hero .ehp-intro{color:#60735f!important;font-weight:800}.ehp-dashboard-hero .ehp-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.ehp-dashboard-hero .ehp-btn{min-height:40px;padding:0 14px;border-radius:10px;background:#d6a642;color:#221b22!important}.ehp-dashboard-hero .ehp-btn-light{background:#eef7ee!important;border:1px solid rgba(23,48,68,.12);color:#173044!important}
@media(max-width:980px){.ehp-navshell .ehp-wrap{display:block;padding:14px 0}.ehp-nav{margin-top:12px}.ehp-grid,.ehp-grid-2{grid-template-columns:1fr}.ehp-title{font-size:34px}.ehp-dashboard-hero .ehp-title{font-size:32px}}
@media(max-width:640px){.ehp-wrap{width:min(100% - 24px,1180px)}.ehp-topbar .ehp-wrap{justify-content:center}.ehp-topbar span:nth-child(2){display:none}.ehp-brand img{width:56px}.ehp-brand-name{font-size:16px}.ehp-nav{gap:10px}.ehp-nav a{font-size:13px}}
</style>';
}

function ehp_footer(): string {
    return ehp_livechat_code() . ehp_faq_bot_code() . '<footer class="ehp-footer"><div class="ehp-wrap">Live teaching. Guided practice. Protected Quran learning.</div></footer>';
}

function ehp_livechat_code(): string {
    return <<<'HTML'
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
HTML;
}

function ehp_faq_bot_code(): string {
    return <<<'HTML'
<div class="ehfaq" data-ehfaq>
  <button class="ehfaq-toggle" type="button" data-ehfaq-toggle>Questions?</button>
  <section class="ehfaq-panel" aria-label="Ehel Quraan Academy FAQ bot" hidden>
    <div class="ehfaq-head">
      <strong>Academy FAQ</strong>
      <button type="button" data-ehfaq-close aria-label="Close FAQ bot">Close</button>
    </div>
    <div class="ehfaq-body">
      <p class="ehfaq-msg">Assalamu alaikum. I can answer basic questions about Ehel Quraan Academy.</p>
      <div class="ehfaq-answer" data-ehfaq-answer>Select a question below.</div>
      <div class="ehfaq-options" data-ehfaq-options></div>
    </div>
    <div class="ehfaq-foot">
      <button type="button" data-ehfaq-chat>Talk to a person</button>
    </div>
  </section>
</div>
<style>
.ehfaq{position:fixed;right:18px;bottom:18px;z-index:2147483001;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.ehfaq-toggle{min-height:46px;border:0;border-radius:999px;padding:0 18px;background:#0f3d2e;color:#fff;font-weight:950;box-shadow:0 14px 34px rgba(15,61,46,.28);cursor:pointer}.ehfaq-panel{width:min(360px,calc(100vw - 28px));overflow:hidden;border-radius:12px;background:#fffaf0;border:1px solid rgba(22,43,53,.16);box-shadow:0 22px 60px rgba(22,43,53,.24)}.ehfaq-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;background:#0f3d2e;color:#fff}.ehfaq-head strong{font-size:15px}.ehfaq-head button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:8px;padding:7px 9px;font-weight:850;cursor:pointer}.ehfaq-body{padding:14px}.ehfaq-msg,.ehfaq-answer{margin:0 0 10px;color:#40565f;font-size:14px;font-weight:700;line-height:1.45}.ehfaq-answer{padding:12px;border-radius:8px;background:#fff;border:1px solid rgba(22,43,53,.12)}.ehfaq-options{display:grid;gap:8px}.ehfaq-options button,.ehfaq-foot button{width:100%;min-height:38px;border:1px solid rgba(15,61,46,.18);border-radius:8px;background:#fff;color:#0f3d2e;font-weight:900;text-align:left;padding:8px 10px;cursor:pointer}.ehfaq-options button:hover,.ehfaq-foot button:hover{background:#f1f8f4}.ehfaq-foot{padding:12px 14px;border-top:1px solid rgba(22,43,53,.1);background:#fff}.ehfaq-foot button{background:#d99a26;color:#16110a;text-align:center;border:0}
</style>
<script>
(function(){
  var root = document.querySelector('[data-ehfaq]');
  if (!root) { return; }
  var panel = root.querySelector('.ehfaq-panel');
  var toggle = root.querySelector('[data-ehfaq-toggle]');
  var close = root.querySelector('[data-ehfaq-close]');
  var answer = root.querySelector('[data-ehfaq-answer]');
  var options = root.querySelector('[data-ehfaq-options]');
  var chat = root.querySelector('[data-ehfaq-chat]');
  var faqs = [
    ['What is Ehel Quraan Academy?', 'Ehel Quraan Academy is an online Quran learning academy for children, families, and institutions. It combines live teacher-led sessions, guided practice, supervised self-learning, parent visibility, and safe communication.'],
    ['What courses are available?', 'The academy offers Pre-Quraan, Tarbiyah Kids, Essential Arabic, Quran Reading, Quran Tafsir, and Quran Memorization. Students may be enrolled in one or more courses based on placement and family goals.'],
    ['How does enrollment work?', 'Families or institutions submit an enrollment request, the academy reviews placement and schedule needs, then the student is enrolled into the right course or courses. After login, students only see courses they are enrolled in.'],
    ['How do live sessions work?', 'Live sessions are teacher-led classes with attendance, scheduling, correction, encouragement, and follow-up. The academy also supports parent rooms, student rooms, teacher-parent rooms, supervised practice, and family support meetings.'],
    ['What can parents see?', 'Parents can use dashboards and reports to review linked children, attendance, course access, teacher feedback, homework, progress, recordings, room activity, and follow-up notes.'],
    ['How are students motivated?', 'Students can use gamified practice, quizzes, stars, completion signals, practice coach prompts, and self-evaluation so progress feels visible without replacing teacher guidance.'],
    ['Is there support for Arabic?', 'Yes. Essential Arabic helps students build basic Arabic reading, writing, vocabulary, sentence understanding, and comprehension.'],
    ['How is privacy handled?', 'Student access, parent visibility, teacher tools, live-session controls, recordings, communication, and reporting are organized with privacy, consent, and child protection in mind.'],
    ['Can I speak to someone?', 'Yes. Use the live chat button to reach the academy team for enrollment, placement, schedules, account help, live-session questions, family questions, or institutional program questions.']
  ];
  function render() {
    options.innerHTML = '';
    faqs.forEach(function(item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = item[0];
      button.addEventListener('click', function() { answer.textContent = item[1]; });
      options.appendChild(button);
    });
  }
  function openPanel() { panel.hidden = false; toggle.hidden = true; }
  function closePanel() { panel.hidden = true; toggle.hidden = false; }
  function openLiveChat() {
    if (window.LiveChatWidget && window.LiveChatWidget.call) {
      window.LiveChatWidget.call('maximize');
    } else {
      window.location.href = 'https://www.livechat.com/chat-with/19790025/';
    }
  }
  render();
  toggle.addEventListener('click', openPanel);
  close.addEventListener('click', closePanel);
  chat.addEventListener('click', openLiveChat);
})();
</script>
HTML;
}
