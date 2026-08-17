// The gc-* slide deck — the shared definition.
//
// How a young learner meets a section: one item per full-screen slide, big audio
// buttons, side arrows, a dot strip, swipe. English Grades 1-4 use it for
// vocabulary, comprehension, grammar, speaking, writing and activities;
// Mathematics Stage 1 uses it for the lesson, words, explore, models, methods,
// examples, practice, activities, problems and reasoning.
//
// The plumbing — track transform, dot state, arrow disabling, stop-audio-on-
// slide-change, touch — is defined once HERE rather than per subject. It was
// already written three times inside english.js before it was collapsed into one
// mountDeck; two subjects on this design would have restarted that split, and a
// deck whose arrows behave differently in Mathematics than in English is exactly
// the drift the single definition exists to prevent.
//
// A subject supplies only its slides, plus the four things a deck cannot know:
//
//   $, escapeHtml, icon — the subject's own DOM helpers. `icon` matters: the
//     shell-voice subjects (Mathematics, Science, Computing, Global
//     Perspectives) never load the lucide runtime, so a <i data-lucide> arrow
//     renders as an empty 28px box there. They pass an inline-SVG icon instead.
//   stopAudio  — what to silence when the learner leaves a slide. English plays
//     pre-rendered clips through its own player; the shell-voice subjects play
//     through the shell's ElevenLabs voice. Neither knows about the other.
//   afterPaint — called with the DOM scope that just changed (the track on a
//     re-deck, the single slide on a redraw) so a subject can re-bind what its
//     markup needs: lucide icons, shell voice buttons, WebGL models. Scoping it
//     is what stops a redraw from initialising a canvas twice and leaving two
//     animation loops running on one context.
export function createDeck({ $, escapeHtml, icon, stopAudio = () => {}, afterPaint = () => {} }) {
  // `setSlides` re-decks in place (English vocabulary filters its own deck,
  // comprehension filters by reading section, Mathematics examples filter by
  // level), and `redrawSlide` repaints one slide without snapping the carousel
  // back to the first — which is exactly what the learner is in the middle of
  // when a Learned mark or a sentence position changes.
  // `mount` and `fullBleed` are what let a deck sit inside a page instead of
  // being the page. Every subject but English Grade 1 mounts exactly one deck
  // into #app and lets it own the screen, which is the default. English Grade 1
  // keeps the original section above the deck, so it passes its own container
  // and turns full-bleed off: the body class — and the 100vh slide CSS it
  // switches on — would swallow the page the deck is meant to sit under.
  //
  // `intro` — { title, steps: [[icon, text], …], start = "Start" } — puts one
  // instruction slide in front of the subject's slides: what this deck is, how
  // to move through it, what finishes it. It exists because the deck is where
  // the youngest learners meet a section and it was the one surface with no
  // framing at all — a five-year-old landed on "Word 1 of 14" with no idea the
  // arrow was the way on. The intro is the deck's own: every position a subject
  // sees or passes (goTo, redrawSlide, onSlide, index, count) is still numbered
  // over the subject's slides alone, so a subject that adds an intro changes no
  // other line. It is shown once, on the first paint — a re-deck (a filter, a
  // section change) lands where it is asked to, not back on the instructions.
  function mountDeck({ heading, label = "Slide", slides = [], tools = "", emptyMessage = "", onSlide = null, onClick = null, mount = "#app", fullBleed = true, intro = null }) {
    const lower = label.toLowerCase();
    // "activities", not "activitys" — the one irregular the labels here need.
    const plural = lower.endsWith("y") ? `${lower.slice(0, -1)}ies` : `${lower}s`;
    const host = typeof mount === "string" ? $(mount) : mount;
    host.innerHTML = `
    <div class="gc-wrap">
      <div class="gc-top"><h2 class="gc-heading">${escapeHtml(heading)}</h2><span class="gc-count" id="gc-count" aria-live="polite" aria-atomic="true"></span></div>
      <div class="gc-carousel" role="group" aria-roledescription="carousel" aria-label="${escapeHtml(heading)}">
        <button class="gc-arrow prev" type="button" aria-label="Previous ${lower}">${icon("chevron-left")}</button>
        <div class="gc-viewport"><div class="gc-track" id="gc-track"></div></div>
        <button class="gc-arrow next" type="button" aria-label="Next ${lower}">${icon("chevron-right")}</button>
      </div>
      <div class="gc-dots" id="gc-dots"></div>
      ${tools}
    </div>`;
    // Full-bleed: the deck fills the whole viewport (paired with focus mode, which
    // already hides the topbar/sidebar and requests browser fullscreen on the nav
    // click). Cleared in onBeforeRender when leaving the section.
    if (fullBleed) document.body.classList.add("gc-full");

    // Found inside the host, not across the document: on a page that also shows
    // another design of the same section, #gc-track and #gc-count are no longer
    // guaranteed unique, and a document-wide lookup would wire this deck's arrows
    // to the first markup that happened to match.
    const find = (selector) => host.querySelector(selector);
    const root = find(".gc-wrap");
    const track = find("#gc-track");
    const dotsRow = find("#gc-dots");
    const prevArrow = find(".gc-arrow.prev");
    const nextArrow = find(".gc-arrow.next");
    const countLabel = find("#gc-count");
    let items = [];
    let index = 0;
    // `index` is the subject's position; `pos` below is the track child. They
    // differ by one when an intro slide is in front, and by nothing otherwise.
    const offset = intro ? 1 : 0;
    let firstPaint = true;
    const introSlide = () => intro ? `<section class="gc-slide gc-intro gc-v0"><div class="gc-inner">
        <span class="gc-eyebrow">How to use these slides</span>
        <h3 class="gc-title">${escapeHtml(intro.title || heading)}</h3>
        <ol class="gc-intro-steps">${(intro.steps || []).map(([name, text]) => `<li>${icon(name)}<span>${escapeHtml(text)}</span></li>`).join("")}</ol>
        <button class="gc-btn" type="button" data-deck-start>${escapeHtml(intro.start || "Start")} ${icon("arrow-right")}</button>
      </div></section>` : "";

    // Only the slide on screen may be reached. The others are not hidden — they
    // sit in the track at full width beside it, so on a 1280px viewport slides
    // 3-6 of a six-slide deck lay out from x=2108 to x=5687. Without this a Tab
    // press walks straight into a Listen or Done button the learner cannot see,
    // and a screen reader reads all six slides as one continuous page.
    //
    // `inert` is the one attribute that does both halves: it takes the subtree
    // out of the tab order AND out of the accessibility tree. It does not touch
    // rendering, so the neighbouring slide still animates into view during a
    // transition exactly as before.
    //
    // The same walk carries each slide's semantics. Subjects author slides as
    // HTML strings, so a slide cannot describe itself without every subject
    // repeating the attributes — and setSlides and redrawSlide would drop them
    // on the next repaint anyway. Setting them here means they cannot be
    // forgotten or lost. "slide" rather than the subject's own noun: `label` is
    // already spoken in the aria-label ("Question 3 of 25"), and what
    // aria-roledescription has to convey is what KIND of thing this is.
    const syncReachable = () => {
      const pos = index + offset;
      for (const [position, slide] of [...track.children].entries()) {
        slide.inert = position !== pos;
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", position < offset ? "How to use these slides" : `${label} ${position + 1 - offset} of ${items.length}`);
      }
    };

    // `next` is a subject position; -1 is the intro slide when there is one.
    const goTo = (next) => {
      if (!items.length) return;
      index = Math.max(-offset, Math.min(items.length - 1, next));
      const pos = index + offset;
      track.style.transform = `translateX(-${pos * 100}%)`;
      syncReachable();
      // The dots carried a label ("Part 3 of 6") but nothing said which one the
      // learner is on, so the strip announced six identical-sounding choices.
      // aria-current is the state for "this is the one you are viewing";
      // aria-selected is not, outside a tab/listbox pattern these dots do not
      // implement — they are plain buttons that move a carousel.
      dotsRow.querySelectorAll("[data-dot]").forEach((dot, position) => {
        const isCurrent = position === pos;
        dot.classList.toggle("active", isCurrent);
        if (isCurrent) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      prevArrow.disabled = pos === 0;
      nextArrow.disabled = index === items.length - 1;
      countLabel.textContent = index < 0 ? `${items.length} ${plural}` : `${label} ${index + 1} of ${items.length}`;
      stopAudio();
      // The intro is the deck's slide, not the subject's: a subject watching for
      // "the last slide" or "which word is showing" never hears about it.
      if (index >= 0) onSlide?.(index, deck);
    };

    const setSlides = (next, { at = 0 } = {}) => {
      items = [...next];
      if (!items.length) {
        track.innerHTML = `<section class="gc-slide gc-v0"><div class="gc-inner"><p class="gc-lead">${escapeHtml(emptyMessage || "Nothing to show here yet.")}</p></div></section>`;
        dotsRow.innerHTML = "";
        prevArrow.disabled = true;
        nextArrow.disabled = true;
        countLabel.textContent = `No ${plural}`;
        index = 0;
        // Not a paint the intro counts: a subject that mounts empty and fills
        // its deck from a filter a line later (english vocabulary) has not shown
        // the learner anything yet.
        afterPaint(track);
        return;
      }
      track.innerHTML = introSlide() + items.join("");
      dotsRow.innerHTML = (intro ? `<button class="gc-dot gc-dot-intro" type="button" data-dot="-1" aria-label="How to use these slides"></button>` : "")
        + items.map((_, position) => `<button class="gc-dot" type="button" data-dot="${position}" aria-label="${label} ${position + 1} of ${items.length}"></button>`).join("");
      dotsRow.querySelectorAll("[data-dot]").forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.dot))));
      index = 0;
      goTo(firstPaint && intro ? -1 : Math.max(0, Math.min(items.length - 1, at)));
      firstPaint = false;
      afterPaint(track);
    };

    const redrawSlide = (position, html) => {
      const node = track.children[position + offset];
      if (!node) return;
      items[position] = html;
      node.outerHTML = html;
      // The replacement is a fresh element, so it does not carry the inert flag
      // the old one had — a redrawn off-screen slide would become tabbable again.
      syncReachable();
      afterPaint(track.children[position + offset] || track);
    };

    const deck = { root, goTo, setSlides, redrawSlide, get index() { return index; }, get count() { return items.length; } };

    // One delegated listener for the whole deck: slides are repainted as the
    // learner works, and rebinding every control on every repaint is how a dead
    // button appears three interactions later.
    if (onClick) root.addEventListener("click", (event) => onClick(event, deck));
    // The intro's Start button is the deck's own control, so it is handled here
    // and never reaches a subject's onClick as an unknown target.
    if (intro) root.addEventListener("click", (event) => { if (event.target.closest("[data-deck-start]")) goTo(0); });
    prevArrow.addEventListener("click", () => goTo(index - 1));
    nextArrow.addEventListener("click", () => goTo(index + 1));

    const viewport = find(".gc-viewport");
    let startX = null;
    viewport.addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
    viewport.addEventListener("touchend", (event) => {
      if (startX === null) return;
      const dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) goTo(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    setSlides(slides);
    return deck;
  }

  // The completion button a deck's last slide carries, so a learner who has swiped
  // to the end can finish the section without leaving the carousel.
  function deckFinish(action, labelText) {
    return `<button class="gc-btn done" type="button" data-deck-finish="${escapeHtml(action)}">${icon("check")} ${escapeHtml(labelText)}</button>`;
  }

  return { mountDeck, deckFinish };
}

// Inline-SVG lucide shapes for the shell-voice subjects, which never load the
// lucide runtime. Only the icons a deck actually draws are here; anything else
// falls back to an empty (but correctly sized) glyph rather than a broken one.
const DECK_ICON_PATHS = {
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "volume-2": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  "list-checks": '<path d="M3 5h2l1 1 2-2"/><path d="M3 12h2l1 1 2-2"/><path d="M3 19h2l1 1 2-2"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
};
export function deckIcon(name, label = "") {
  const accessible = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${accessible}>${DECK_ICON_PATHS[name] || ""}</svg>`;
}
