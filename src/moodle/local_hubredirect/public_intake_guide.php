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

// Defaults point at the Bunny pull zone the rest of the platform serves from.
// Either can be overridden without a code change or a plugin upgrade:
//   php admin/cli/cfg.php --component=local_hubredirect \
//       --name=intake_guide_video_en --set=https://.../file.mp4
// Setting a URL to an empty string hides that language's player entirely, which
// is how a language ships late without holding back the page.
const PQIG_CDN_BASE = 'https://ehelacademy.b-cdn.net/platform/portal/video/';
const PQIG_VIDEO_EN_DEFAULT = PQIG_CDN_BASE . 'ehel-intake-form-guide-english.mp4';
const PQIG_VIDEO_SO_DEFAULT = PQIG_CDN_BASE . 'ehel-intake-form-guide-somali.mp4';

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

$posteren = (new moodle_url('/local/hubredirect/pix/intake-guide-poster-en.jpg'))->out(false);
$posterso = (new moodle_url('/local/hubredirect/pix/intake-guide-poster-so.jpg'))->out(false);

echo $OUTPUT->header();
echo ehp_styles();
?>
<style>
/* Same tokens as public_intake.php so the two pages read as one flow. */
.pqig-shell{--pq-green:#2f6f4e;--pq-green-dark:#1f5138;--pq-ink:#1c2b22;--pq-muted:#5c7267;--pq-line:#e3dcc8;--pq-line-strong:#c9bd9d;--pq-paper:#f7f4ec;--pq-card:#fffdf8;--pq-gold:#a5741e;--pq-gold-soft:#f4e6c8;--pq-serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--pq-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;position:fixed;inset:0;z-index:2147483000;overflow:auto;min-height:100vh;padding:0 0 56px;background:var(--pq-paper);font-family:var(--pq-sans);color:var(--pq-ink);-webkit-font-smoothing:antialiased}
@media(prefers-color-scheme:dark){.pqig-shell{--pq-green:#7fc79e;--pq-green-dark:#63a883;--pq-ink:#e8e3d3;--pq-muted:#9fb0a4;--pq-line:#2a3a30;--pq-line-strong:#3a4c40;--pq-paper:#121d17;--pq-card:#16241c;--pq-gold:#dcaa54;--pq-gold-soft:#3a301a}}
.pqig-wrap{width:min(760px,calc(100% - 32px));margin:0 auto}
.pqig-nav{padding:18px 0 4px}
.pqig-navbrand{display:inline-flex;align-items:center;gap:11px}
.pqig-navmark{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:var(--pq-green);color:#fff;font-weight:700;font-size:17px}
.pqig-navmark--img{background:transparent;width:auto;height:38px}
.pqig-navmark--img img{height:38px;width:auto;display:block}
.pqig-navname{font-size:16px;font-weight:700;color:var(--pq-ink)}
.pqig-panel{margin-top:16px;padding:26px 24px;border-radius:14px;background:var(--pq-card);border:1px solid var(--pq-line)}
.pqig-title{margin:0;font-family:var(--pq-serif);font-size:30px;line-height:1.15;font-weight:600;color:var(--pq-ink)}
.pqig-lede{margin:12px 0 0;font-size:16px;line-height:1.6;color:var(--pq-muted)}
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
</style>
<main class="pqig-shell">
  <div class="pqig-wrap">
    <div class="pqig-nav">
      <span class="pqig-navbrand">
        <?php if ($brandlogo !== ''): ?>
          <span class="pqig-navmark pqig-navmark--img"><img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brandname); ?>"></span>
        <?php else: ?>
          <span class="pqig-navmark"><?php echo s(pqig_consumer_initial($brandname)); ?></span>
        <?php endif; ?>
        <span class="pqig-navname"><?php echo s($brandname); ?></span>
      </span>
    </div>

    <section class="pqig-panel">
      <h1 class="pqig-title">Before you start</h1>
      <p class="pqig-lede">
        Requesting a place takes about 10 minutes and you can do it all on your phone.
        Watch the short guide if it helps, or go straight to the form — it is entirely up to you.
      </p>

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
        <li><strong>Your child's date of birth</strong>, as it appears on the birth certificate.</li>
        <li><strong>The grade your child is in right now</strong> — not the grade they are moving up to.</li>
      </ul>
      <p class="pqig-muted">
        When you reach the timetable, tick every day and time that could work, not only your first choice —
        the more you tick, the easier it is for us to find your child a class.
        Sending the form does not enrol your child and does not commit you to anything.
      </p>
    </section>

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
