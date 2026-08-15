<?php
declare(strict_types=1);

// The step before public_intake.php: a public, login-free page offering the
// explainer video in English or Somali, with an equally prominent way to skip
// it. Parents receive one link and land here; nothing on this page is required.
//
// Three rules this page is built around, in order of importance:
//
//  1. It must NEVER block the form. If the videos are unconfigured, missing, or
//     the CDN is down, the Continue button still works and still carries the
//     consumer scope. A guide page that can strand a family is worse than no
//     guide page.
//  2. Nothing downloads until asked. Each video is ~9 MB and most of these
//     families are on metered mobile data, so the players are preload="none"
//     behind a poster, and only the language actually chosen is ever inserted.
//  3. The written summary stands alone. A parent who never plays a video still
//     leaves this page knowing what to have ready and how long it takes.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/public_pageslib.php');

// Defaults point at the Bunny pull zone the rest of the platform serves from
// and are correct as shipped -- there is nothing to configure for the normal
// case. Overriding is for moving a file, and takes no code change or upgrade:
//
//   --set=<a real, complete URL>   point this language somewhere else
//   --unset                        go back to the default below
//   --set=''                       hide this language's button entirely,
//                                  which is how one language ships late
//
// on `php admin/cli/cfg.php --component=local_hubredirect --name=intake_guide_video_en`.
//
// NO EXAMPLE URL IS WRITTEN HERE ON PURPOSE. A placeholder in a copy-pasteable
// command is a live grenade: `https://your-url.mp4` was once pasted verbatim
// from a deploy note, passed the http(s) check below, failed DNS in the
// browser, and left the English guide as a dead black player while Somali --
// never configured, so still on its default -- worked perfectly. Prefer
// --unset over re-typing the URL, so it stays defined in one place.
const PQIG_CDN_BASE = 'https://ehelacademy.b-cdn.net/platform/portal/video/';
const PQIG_VIDEO_EN_DEFAULT = PQIG_CDN_BASE . 'ehel-intake-form-guide-english.mp4';
const PQIG_VIDEO_SO_DEFAULT = PQIG_CDN_BASE . 'ehel-intake-form-guide-somali.mp4';
// Posters come from the CDN beside the videos, NOT from local/hubredirect/pix.
// They shipped as two JPEGs in that directory once and were skipped in the file
// copy, so every player was a black rectangle until it started -- which reads as
// a broken video rather than an unplayed one. A poster is decoration for a file
// that already lives on the CDN; making the deploy carry binaries to earn it was
// the wrong trade. This page now deploys as PHP only.
const PQIG_POSTER_EN = PQIG_CDN_BASE . 'intake-guide-poster-en.jpg';
const PQIG_POSTER_SO = PQIG_CDN_BASE . 'intake-guide-poster-so.jpg';

function pqig_video_url(string $name, string $default): string {
    $configured = get_config('local_hubredirect', $name);
    // get_config returns false when unset -- that means "use the default", while
    // an explicitly configured empty string means "this language is not ready".
    if ($configured === false) {
        return $default;
    }
    $url = trim((string)$configured);
    if ($url === '') {
        return '';
    }
    // Only absolute http(s) URLs; anything else is a misconfiguration and is
    // safer dropped than emitted into a src attribute on a public page.
    return preg_match('#^https?://#i', $url) === 1 ? $url : '';
}

function pqig_consumer_initial(string $brandname): string {
    $clean = (string)preg_replace('/[^A-Za-z0-9]+/', '', $brandname);
    return strtoupper(core_text::substr($clean === '' ? 'E' : $clean, 0, 1));
}

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$requestedslug = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
if ($requestedslug !== '' && (string)($consumercontext->consumerslug ?? '') !== $requestedslug) {
    $slugcontext = pqh_consumer_context_by_slug($requestedslug);
    if ((string)($slugcontext->consumerslug ?? '') === $requestedslug) {
        $consumercontext = $slugcontext;
    }
}
if ($requestedworkspaceid > 0 && (int)($consumercontext->workspaceid ?? 0) !== $requestedworkspaceid) {
    $workspacecontext = pqh_consumer_context_by_workspace($requestedworkspaceid);
    if ($workspacecontext) {
        $consumercontext = $workspacecontext;
    }
}

// Whatever scope the visitor arrived with is handed to the form verbatim. The
// guide deliberately does NOT resolve the school itself -- public_intake.php
// owns that choice, including its K-12 default, and duplicating the rule here
// is how the two would drift apart.
$formparams = [];
if ($requestedslug !== '') {
    $formparams['consumer'] = $requestedslug;
} else if ((string)($consumercontext->consumerslug ?? '') !== '') {
    $formparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $formparams['workspaceid'] = $requestedworkspaceid;
}
if ($requestedteacherid > 0) {
    $formparams['teacherid'] = $requestedteacherid;
}
$formurl = (new moodle_url('/local/hubredirect/public_intake.php', $formparams))->out(false);

pqh_apply_consumer_embed_headers($consumercontext);
$brandname = trim((string)($consumercontext->consumername ?? ''));
if ($brandname === '') {
    $brandname = 'Ehel Academy';
}
$brandlogo = trim((string)($consumercontext->logourl ?? ''));

$videoen = pqig_video_url('intake_guide_video_en', PQIG_VIDEO_EN_DEFAULT);
$videoso = pqig_video_url('intake_guide_video_so', PQIG_VIDEO_SO_DEFAULT);
$hasvideo = $videoen !== '' || $videoso !== '';

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/public_intake_guide.php', $formparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Enrolment Guide');
$PAGE->set_heading($brandname . ' Enrolment Guide');
$PAGE->add_body_class('pqh-public-intake-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}
@header('X-Robots-Tag: noindex, nofollow', true);
@header('Referrer-Policy: strict-origin-when-cross-origin', true);

$posteren = PQIG_POSTER_EN;
$posterso = PQIG_POSTER_SO;

echo $OUTPUT->header();
echo ehp_styles();
?>
<style>
/* Same tokens as public_intake.php so the two pages read as one flow. */
.pqig-shell{--pq-green:#2f6f4e;--pq-green-dark:#1f5138;--pq-ink:#1c2b22;--pq-muted:#5c7267;--pq-line:#e3dcc8;--pq-line-strong:#c9bd9d;--pq-paper:#f7f4ec;--pq-card:#fffdf8;--pq-gold:#a5741e;--pq-gold-soft:#f4e6c8;--pq-serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--pq-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;position:fixed;inset:0;z-index:2147483000;overflow:auto;min-height:100vh;padding:0 0 56px;background:var(--pq-paper);font-family:var(--pq-sans);color:var(--pq-ink);-webkit-font-smoothing:antialiased}
@media(prefers-color-scheme:dark){.pqig-shell{--pq-green:#7fc79e;--pq-green-dark:#63a883;--pq-ink:#e8e3d3;--pq-muted:#9fb0a4;--pq-line:#2a3a30;--pq-line-strong:#3a4c40;--pq-paper:#121d17;--pq-card:#16241c;--pq-gold:#dcaa54;--pq-gold-soft:#3a301a}}
.pqig-wrap{width:min(760px,calc(100% - 32px));margin:0 auto}
/* The header band, matching public_intake.php and public_teacher_intake.php.
   Colours come from the shared skin's own header tokens rather than a copied
   hex, so all three public pages follow if that navy is ever retuned. */
.pqig-hero{margin-top:18px;padding:28px 32px;border-radius:14px;background:var(--op-header-bg,#162b48);border:1px solid var(--op-header-bg,#162b48);color:var(--op-header-ink,#fff)}
.pqig-shell .pqh-workspace-top{background:var(--op-header-bg,#162b48)!important;border-color:var(--op-header-bg,#162b48)!important;box-shadow:0 2px 10px rgba(22,38,30,.10)!important;border-radius:14px!important}
.pqig-shell .pqh-workspace-title{color:var(--op-header-ink,#fff)!important;text-shadow:none!important}
.pqig-shell .pqh-workspace-sub{color:var(--op-header-ink-soft,rgba(255,255,255,.72))!important;opacity:1!important}
.pqig-navbrand{display:inline-flex;align-items:center;gap:11px;margin-bottom:14px;color:var(--op-header-ink,#fff)}
.pqig-navmark{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.16);color:var(--op-header-ink,#fff);font-weight:700;font-size:17px}
.pqig-navmark--img{background:transparent;width:auto;height:38px}
.pqig-navmark--img img{height:38px;width:auto;display:block}
.pqig-navname{font-size:16px;font-weight:700;color:var(--op-header-ink,#fff)}
.pqig-panel{margin-top:16px;padding:26px 24px;border-radius:14px;background:var(--pq-card);border:1px solid var(--pq-line)}
.pqig-title{margin:0;font-family:var(--pq-serif);font-size:24px;line-height:1.25;font-weight:600;color:var(--op-header-ink,#fff)}
.pqig-lede{margin:12px 0 0;font-size:16px;line-height:1.6;color:var(--op-header-ink-soft,rgba(255,255,255,.72))}
/* The skip route sits with the watch buttons, not below the fold: a parent who
   does not want a video should not have to scroll past one to leave. */
.pqig-choices{display:grid;gap:11px;margin-top:22px}
@media(min-width:620px){.pqig-choices{grid-template-columns:1fr 1fr}.pqig-choices .pqig-skip{grid-column:1/-1}}
.pqig-btn{display:flex;align-items:center;justify-content:center;gap:9px;min-height:54px;padding:12px 18px;border:1px solid var(--pq-line-strong);border-radius:11px;background:var(--pq-card);color:var(--pq-ink);font:600 16px/1.3 var(--pq-sans);text-align:center;text-decoration:none;cursor:pointer}
.pqig-btn:hover{border-color:var(--pq-green);color:var(--pq-ink)}
.pqig-btn[aria-pressed="true"]{background:var(--pq-green);border-color:var(--pq-green);color:#fff}
.pqig-skip{background:var(--pq-green);border-color:var(--pq-green);color:#fff!important;font-weight:700}
.pqig-skip:hover{background:var(--pq-green-dark);border-color:var(--pq-green-dark);color:#fff!important}
.pqig-player{margin-top:18px}
.pqig-player[hidden]{display:none}
.pqig-player video{width:100%;max-height:74vh;display:block;border-radius:12px;background:#000}
.pqig-note{margin:10px 0 0;font-size:13px;color:var(--pq-muted)}
.pqig-summary{margin-top:20px;padding:20px 22px;border-radius:12px;background:var(--pq-gold-soft);border:1px solid var(--pq-line)}
.pqig-summary h2{margin:0 0 10px;font-size:16px;font-weight:700;color:var(--pq-ink)}
.pqig-summary ul{margin:0;padding-left:20px}
.pqig-summary li{margin:7px 0;font-size:15px;line-height:1.55;color:var(--pq-ink)}
.pqig-foot{margin-top:18px}
.pqig-foot .pqig-skip{width:100%}
.pqig-muted{margin:14px 0 0;font-size:13.5px;line-height:1.55;color:var(--pq-muted)}
.pqig-steps{margin-top:20px;padding:4px 22px;border-radius:12px;background:var(--pq-card);border:1px solid var(--pq-line)}
.pqig-steps>summary{padding:16px 0;font-size:15.5px;font-weight:700;color:var(--pq-ink);cursor:pointer;list-style:none}
.pqig-steps>summary::-webkit-details-marker{display:none}
.pqig-steps>summary::after{content:" \25BE";color:var(--pq-muted)}
.pqig-steps[open]>summary{border-bottom:1px solid var(--pq-line)}
.pqig-steps[open]>summary::after{content:" \25B4"}
.pqig-steps h3{margin:20px 0 6px;font-size:15px;font-weight:700;color:var(--pq-ink)}
.pqig-steps p{margin:0 0 10px;font-size:14.5px;line-height:1.6;color:var(--pq-ink)}
.pqig-steps .pqig-muted{margin:0 0 10px}
.pqig-steps-lede{margin-top:14px!important}
.pqig-steps>*:last-child{margin-bottom:18px}
</style>
<style><?php echo pqh_openproject_skin_css('pqig', 'pqh-public-intake-page'); ?></style>
<main class="pqig-shell">
  <div class="pqig-wrap">
    <?php // Same header shape as public_intake.php and public_teacher_intake.php:
          // the brand row, title and lede live inside a .pqh-workspace-top band so
          // the shared skin paints all three public pages identically. The choices
          // move to their own panel below, as the form's do. ?>
    <section class="pqig-hero pqh-workspace-top">
      <span class="pqig-navbrand">
        <?php if ($brandlogo !== ''): ?>
          <span class="pqig-navmark pqig-navmark--img"><img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brandname); ?>"></span>
        <?php else: ?>
          <span class="pqig-navmark"><?php echo s(pqig_consumer_initial($brandname)); ?></span>
        <?php endif; ?>
        <span class="pqig-navname"><?php echo s($brandname); ?></span>
      </span>
      <h1 class="pqig-title pqh-workspace-title">Before you start</h1>
      <p class="pqig-lede pqh-workspace-sub">
        Requesting a place takes about 10 minutes and you can do it all on your phone.
        Watch the short guide if it helps, or go straight to the form — it is entirely up to you.
      </p>
    </section>

    <section class="pqig-panel">
      <div class="pqig-choices">
        <?php if ($videoen !== ''): ?>
          <button type="button" class="pqig-btn" data-guide-play="en" aria-pressed="false" aria-controls="pqig-player">Watch the guide (English)</button>
        <?php endif; ?>
        <?php if ($videoso !== ''): ?>
          <button type="button" class="pqig-btn" data-guide-play="so" aria-pressed="false" aria-controls="pqig-player" lang="so">Daawo hagaha (Af-Soomaali)</button>
        <?php endif; ?>
        <a class="pqig-btn pqig-skip" href="<?php echo s($formurl); ?>">Skip the video — go to the form</a>
      </div>

      <?php if ($hasvideo): ?>
        <div class="pqig-player" id="pqig-player" hidden></div>
        <p class="pqig-note">The guide is about 5 minutes and uses roughly 9 MB of data. It only starts downloading once you choose a language.</p>
      <?php endif; ?>
    </section>

    <section class="pqig-summary">
      <h2>What to have ready</h2>
      <ul>
        <li><strong>Your email address</strong> — this is where our decision and your child's login details are sent.</li>
        <li><strong>Your child's age</strong> in whole years.</li>
        <li><strong>The grade your child is in right now</strong> — not the grade they are moving up to.</li>
        <li><strong>Enrolling more than one child?</strong> You only need one form. Have each child's age and current grade ready.</li>
      </ul>
      <p class="pqig-muted">
        When you reach the timetable, tick every day and time that could work, not only your first choice —
        the more you tick, the easier it is for us to find your child a class.
        Sending the form does not enrol your child and does not commit you to anything.
      </p>
    </section>

    <?php // The written walkthrough. It exists for two reasons the video cannot
          // cover: a parent on a metered connection who will not spend 9 MB, and
          // the "Another child?" section, which was added to the form after both
          // videos were recorded. Collapsed by default so the page still reads as
          // "watch, or skip to the form" -- this is the third option, not a wall
          // of text in front of the first two. ?>
    <details class="pqig-steps">
      <summary>Prefer to read? The six steps, in order</summary>

      <p class="pqig-muted pqig-steps-lede">The form takes about ten minutes and works on a phone.
        A bar at the top shows which step you are on. Nothing is sent until you press
        <strong>Submit Enrolment Request</strong> on the last step.</p>

      <h3>Step 1 — Parent / guardian</h3>
      <p>Your full name, and how you are related to the student. Then your email address —
        this is the important one, because our decision and your child's login details are
        sent there. Add your phone number, ideally one with WhatsApp, and include the country
        code. Finally, a second person we can call if we cannot reach you.</p>

      <h3>Step 2 — Your child</h3>
      <?php // Deliberately does NOT say "as on the birth certificate". Date of birth was taken
            // off this form so a parent on a phone would not have to go and find paperwork
            // before they could finish; sending them after a certificate for the spelling
            // would put that back. ?>
      <p>Their name, spelled the way you want it to appear on their school records. Middle name
        is optional — leave it blank if there isn't one. If they are known at home by a shorter
        name, put that under <em>Preferred name</em>. Then choose your country first, because
        that fills in the city list and the time zone for you.</p>

      <h3>Step 3 — School details, and any other children</h3>
      <p>Your child's age in whole years, and the grade they are in <strong>right now</strong> —
        not the one they are moving up to. If you are not sure, choose <em>Other</em> and we will
        work it out with you. Tell us the curriculum their school follows and its name; if they
        are not in school, or you teach them at home, just write that.</p>
      <p>Answer <em>Yes</em> to special learning needs if your child needs extra help — more time,
        help with reading, larger print, a quiet room. Use the notes box for allergies, medication,
        or anything a teacher should know to keep them safe.</p>
      <p><strong>Enrolling more than one child? Scroll to the bottom of this step.</strong> Under
        <em>Another child?</em>, press <em>+ Add another child</em> and fill in their name, age,
        gender and grade. Add a card for each child. Everything you have already answered — your
        details, where you live, languages, class preferences and the timetable — is used for
        every child, so you only fill in what is different. You will get one email listing them all,
        and each child gets their own place and their own login.</p>

      <h3>Step 4 — How your child learns best</h3>
      <p>The language you speak at home, and the language you want lessons taught in. These can be
        different, and that is normal. Then the class format, the group size, and whether you would
        prefer a male or female teacher. If it does not matter to you, choose
        <em>No preference</em> — it is a real answer, not a blank.</p>

      <h3>Step 5 — Lessons and times</h3>
      <p>Choose how many live lessons a week you would like, from one to five. Then the timetable.
        <strong>This is the most useful part of the whole form.</strong> Tick every day and time that
        could work for your family, not only your favourite. The more you tick, the easier it is for
        us to find your child a class. On a phone, drag the timetable sideways to see later times.</p>

      <h3>Step 6 — Consent</h3>
      <p>The middle box is required: it says you agree to your child joining live online lessons.
        The first is for email reminders and progress updates, and the last covers lessons being
        recorded so your child can watch them again. Both of those are optional.</p>
      <p>Then press <strong>Submit Enrolment Request</strong>.</p>

      <h3>What happens next</h3>
      <p>You will get an email confirming we have your request, with a reference number for each
        child. Our team reviews it and comes back to you. If your child is offered a place, a second
        email arrives with their login details.</p>
      <p class="pqig-muted">If you get stuck at any point, reply to the message that sent you this
        page and a person will help you.</p>
    </details>

    <div class="pqig-foot">
      <a class="pqig-btn pqig-skip" href="<?php echo s($formurl); ?>">Continue to the enrolment form</a>
    </div>
  </div>
</main>
<?php if ($hasvideo): ?>
<script>
(function () {
  // The <video> is built here rather than shipped in the HTML so that an
  // untouched page costs a poster image and nothing else -- no manifest, no
  // range request, no autoplay heuristics on the browsers that ignore
  // preload="none".
  var sources = {
    en: { src: <?php echo json_encode($videoen, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>, poster: <?php echo json_encode($posteren, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>, label: 'Enrolment guide, English' },
    so: { src: <?php echo json_encode($videoso, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>, poster: <?php echo json_encode($posterso, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>, label: 'Enrolment guide, Somali' }
  };
  var host = document.getElementById('pqig-player');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-guide-play]'));
  var current = null;

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var lang = button.getAttribute('data-guide-play');
      var source = sources[lang];
      if (!source || !source.src) { return; }

      if (current === lang) {                 // same language again: collapse it
        host.hidden = true;
        host.innerHTML = '';
        current = null;
      } else {
        // Replacing innerHTML drops the previous <video>, which stops its
        // download too -- switching language must not leave both streaming.
        host.innerHTML = '';
        var video = document.createElement('video');
        video.setAttribute('controls', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'none');
        video.setAttribute('poster', source.poster);
        video.setAttribute('aria-label', source.label);
        video.src = source.src;
        host.appendChild(video);
        host.hidden = false;
        current = lang;
        // play() can reject (autoplay policy, or the file is unreachable). The
        // poster and controls are already there, so a failure is silent and the
        // parent can press play -- and the Continue button is untouched either way.
        var started = video.play();
        if (started && typeof started.catch === 'function') { started.catch(function () {}); }
        host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      buttons.forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button && current !== null));
      });
    });
  });
})();
</script>
<?php endif; ?>
<?php
echo $OUTPUT->footer();
