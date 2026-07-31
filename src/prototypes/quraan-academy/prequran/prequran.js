// PreQuraan — Quraan Academy's first course on the unified shell (fresh build,
// zero legacy runtime). Subject module for createCourseApp(): Level 0 starts
// with Unit 1 "The Arabic Alphabet" (29 letters, recorded human audio/video).
//
// Design notes:
// - UI chrome is English/LTR (platform convention); Arabic is rendered in
//   dir="rtl" lang="ar" islands (grid tiles, words) — the pragmatic RTL answer.
// - Letter/word/animal audio is the RECORDED library (never TTS). The shell
//   voice engine stays enabled for UI narration only (ttsPurpose qrn_prequran).
// - Media descriptors in unit JSON use the canonical fresh layout
//   (audio/letters/…). In local dev they map onto the legacy alphabet media
//   folders (DEV_MEDIA_MAP below) until the library is re-uploaded to the
//   quraanacademy zone as media/prequran/gNN/… — then the map dies.
// - Folder gNN = shell-core convention; the semantic label is Level N.

import { createCourseApp } from "../../ehel-academy/shell/course-app.js?v=20260722a";

const pad2 = (n) => String(n).padStart(2, "0");
const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);

// Release stamp derived from THIS module's own URL (prequran-<release>.js in
// production, ?v=qrn-<release> in dev). Appended as ?r= to content fetches so a
// new JS release always pulls MATCHING content — content files have stable URLs
// and the quraan pull zone has no edge rules yet, so browsers otherwise cache
// unit JSON for 30 days and a returning learner runs new code on old data.
// The pull zone ignores query strings for its edge cache key, so ?r= busts the
// BROWSER cache without fragmenting the edge cache.
const RELEASE = (() => {
  const url = import.meta.url;
  const m = /prequran-([0-9a-z]+)\.js/.exec(url) || /[?&]v=(?:qrn-)?([0-9a-z]+)/.exec(url);
  return m ? m[1] : "dev";
})();

// ---- Quraan-scoped practice cadence (headmaster self-service) ---------------
// The practice repetition cadence (passes / repeats / gap / echo) is authored by
// Quraan Academy workspace admins on the prequran-practice-settings portal page
// and served, per level, by this PUBLIC, cacheable, tokenless Moodle endpoint.
// We overlay it onto the unit JSON's baked-in `practice` block at boot so a
// change takes effect without a code release. Best-effort and non-blocking: on
// any failure (Moodle unreachable, standalone dev, timeout) the unit JSON
// defaults stand and nothing about the app breaks.
const PRACTICE_CONFIG_ENDPOINT = "https://eduplatform.ai/local/prequran/practice_config.php";
const PRACTICE_CONSUMER_SLUG = "quraan-academy";
async function applyPublishedCadence(ctx) {
  try {
    const url = new URL(PRACTICE_CONFIG_ENDPOINT);
    url.searchParams.set("consumer", PRACTICE_CONSUMER_SLUG);
    url.searchParams.set("level", String(ctx.stageNumber ?? 0));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    let cfg;
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return;
      cfg = await res.json();
    } finally {
      clearTimeout(timer);
    }
    if (!cfg || !cfg.practice || typeof cfg.practice !== "object") return;
    const course = ctx.course;
    course.practice = course.practice || {};
    for (const section of Object.keys(cfg.practice)) {
      course.practice[section] = { ...(course.practice[section] || {}), ...cfg.practice[section] };
    }
  } catch (e) {
    /* Moodle unreachable / standalone / timeout → unit JSON defaults apply */
  }
}

// ---- recorded-media resolution ---------------------------------------------
// Dev servers differ in web root (vite = repo root, serve-src-preview = src/),
// so resolve the legacy media library RELATIVE to this page — three levels up
// from prototypes/quraan-academy/prequran/ is src/ under both.
const DEV_MEDIA_ROOT = new URL("../../../media/lessons/alphabet/media/", document.baseURI).href;
const DEV_MEDIA_MAP = [
  ["audio/letters/", "audio/male/"],
  ["audio/sounds/", "audio/sound/"],
  ["audio/captions/", "captions/audio/"],
  ["audio/animals/", "listen_plus/animals/audio/"],
  ["audio/words/", "words/audio/"],
  ["images/animals/", "listen_plus/animals/images/"],
  ["images/words/", "words/images/"],
  ["video/articulation/", "video/"],
  ["video/writing/", "animate/"],
];
function mediaUrl(descriptor, stage) {
  if (!descriptor) return "";
  if (IS_LOCAL_DEV) {
    for (const [canonical, legacy] of DEV_MEDIA_MAP) {
      if (descriptor.startsWith(canonical)) return DEV_MEDIA_ROOT + legacy + descriptor.slice(canonical.length);
    }
    return DEV_MEDIA_ROOT + descriptor;
  }
  return new URL(`../../media/prequran/g${pad2(stage)}/${descriptor}`, document.baseURI).href;
}

// One player for all recorded clips so plays never overlap.
const clipPlayer = typeof Audio === "function" ? new Audio() : null;
let playingButton = null;
function stopClip() {
  if (clipPlayer) { clipPlayer.pause(); clipPlayer.removeAttribute("src"); clipPlayer.load(); }
  if (playingButton) playingButton.classList.remove("is-playing");
  playingButton = null;
}
function playClip(url, button) {
  return new Promise((resolve) => {
    if (!clipPlayer || !url) return resolve();
    if (playingButton === button && button) { stopClip(); return resolve(); }
    stopClip();
    playingButton = button || null;
    if (button) button.classList.add("is-playing");
    clipPlayer.src = url;
    clipPlayer.onended = () => { stopClip(); resolve(); };
    clipPlayer.onerror = () => { stopClip(); resolve(); };
    clipPlayer.play().catch(() => { stopClip(); resolve(); });
  });
}

// ---- module state (populated by bind) --------------------------------------
let C = null;            // the shell ctx
let selectedLetterId = null;
let playAllActive = false;
let boardAmbientStop = null;

const prefersReducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Letter family drives tile colour AND teaches the groups (vowels stretch,
// heavy letters are deep) — the colour is a curriculum cue, not decoration.
function letterFamily(letter) {
  const g = C.course.groups || {};
  if ((g.vowels || []).includes(letter.number)) return "vowel";
  if ((g.heavy || []).includes(letter.number)) return "heavy";
  return "light";
}

// Gentle Canvas-2D starfield behind the board (deliberately not WebGL: robust on
// low-end kids' tablets, respects reduced-motion). Returns a stop() cleanup.
function startBoardAmbient(canvas) {
  if (!canvas || !canvas.getContext) return null;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0, h = 0, raf = 0;
  const stars = [];
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width); h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const seed = () => {
    stars.length = 0;
    const count = Math.max(16, Math.min(44, Math.round(w / 28)));
    for (let i = 0; i < count; i += 1) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.2,
        tw: Math.random() * Math.PI * 2, sp: 0.05 + Math.random() * 0.18, drift: (Math.random() - 0.5) * 0.1,
        gold: Math.random() < 0.4 });
    }
  };
  const draw = (animate) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      if (animate) { s.y -= s.sp; s.x += s.drift; s.tw += 0.03; if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; } }
      ctx.globalAlpha = 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(s.tw));
      ctx.fillStyle = s.gold ? "#f2c14e" : "#9cc0f0";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const frame = () => { draw(true); raf = requestAnimationFrame(frame); };
  const onResize = () => { resize(); seed(); draw(false); };
  resize(); seed();
  window.addEventListener("resize", onResize);
  if (prefersReducedMotion()) draw(false); else raf = requestAnimationFrame(frame);
  return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
}

// One-shot celebration when the whole alphabet is explored.
function fireConfetti() {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement("canvas");
  canvas.className = "qrn-confetti";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ["#f2c14e", "#4f86e0", "#e86a92", "#6d4bd8", "#1f9d8f"];
  const parts = Array.from({ length: 130 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 90, y: H * 0.32,
    vx: (Math.random() - 0.5) * 10, vy: -7 - Math.random() * 8, g: 0.26 + Math.random() * 0.12,
    s: 5 + Math.random() * 7, c: cols[(Math.random() * cols.length) | 0], rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.34,
  }));
  let raf = 0, start = null;
  const frame = (t) => {
    if (start === null) start = t;
    const el = t - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - el / 2800); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62); ctx.restore();
    }
    if (el < 2800) raf = requestAnimationFrame(frame); else canvas.remove();
  };
  raf = requestAnimationFrame(frame);
}

const arabic = (text, extra = "") => `<span dir="rtl" lang="ar" class="ar ${extra}">${C.escapeHtml(text)}</span>`;
const clipButton = (descriptor, label, cls = "secondary") =>
  `<button class="button ${cls} clip-button" type="button" data-clip="${C.escapeHtml(descriptor)}">${C.icon("play")} <span>${C.escapeHtml(label)}</span></button>`;
function bindClipButtons() {
  C.$$("[data-clip]").forEach((button) => {
    if (button.dataset.clipBound) return;
    button.dataset.clipBound = "true";
    button.addEventListener("click", async () => {
      await playClip(mediaUrl(button.dataset.clip, C.stageNumber), button);
      // "After it is pronounced": a clip button can hand off to a spoken
      // explainer (data-then-explain = the explainer button's selector) — the
      // letter name → Transliteration explainer, the word → word explainer.
      if (button.dataset.thenExplain) {
        const explainButton = document.querySelector(button.dataset.thenExplain);
        if (explainButton && !explainButton.disabled) explainButton.click();
      }
    });
  });
}

const lettersVisited = () => C.progress.lettersVisited || (C.progress.lettersVisited = []);
function markLetterVisited(id) {
  if (!lettersVisited().includes(id)) {
    lettersVisited().push(id);
    C.saveProgress();
    if (lettersVisited().length >= C.course.letters.length && !C.progress.completed.includes("learn")) {
      C.complete("learn", "Every letter explored — the Letters section is complete. ماشاء الله");
      fireConfetti();
    }
  }
}

// ---- renderers --------------------------------------------------------------
function renderOverview() {
  const done = lettersVisited().length;
  const total = C.course.letters.length;
  C.$("#app").innerHTML = `
    ${C.pageHeader("Quraan Academy · PreQuraan · Level 0", C.course.title, C.course.summary, "Recorded recitation audio")}
    <div class="overview-hero panel">
      <div class="overview-glyphs" dir="rtl" lang="ar" aria-hidden="true">ا ب ت ث</div>
      <h2>${arabic(C.course.arabicTitle)}</h2>
      <p>Every letter has a face, a name, a sound, and a way your mouth makes it.
         Explore all ${total} letters, hear each one recited, meet its animal sound-friend,
         and learn your first Arabic word for every letter.</p>
      <div class="overview-stats">
        <div class="stat"><strong>${total}</strong><span>letters</span></div>
        <div class="stat"><strong>${done}</strong><span>explored</span></div>
        <div class="stat"><strong>${total - done}</strong><span>to go</span></div>
      </div>
      <button class="button primary" type="button" data-route-jump="letters">${C.icon("layout-grid")} Start with the letters</button>
    </div>
    <div class="group-legend panel">
      <h3>${C.icon("tags")} Letter families you will meet</h3>
      <ul>
        <li><strong>Light letters</strong> — ${C.course.groups.light.length} gentle sounds</li>
        <li><strong>Heavy letters</strong> — ${C.course.groups.heavy.length} full, deep sounds</li>
        <li><strong>Long-vowel letters</strong> — ${C.course.groups.vowels.length} letters that stretch sounds</li>
      </ul>
    </div>`;
  C.$("[data-route-jump]").addEventListener("click", () => C.navigate("letters"));
}

function letterById(id) { return C.course.letters.find((l) => l.id === id); }

// Learn is a guided TWO-STEP flow over the same 29-tile board:
//   step "meet" — "Meet the letters": tap a tile to HEAR the sound the letter
//                 makes (media.sound) and stay on the board. Next arrow →
//   step "deep" — "Deep dive": tap a tile to OPEN the letter carousel (this is
//                 the original Meet-the-letters behaviour). Back arrow → meet.
// Deep dive is a step inside Learn, not a nav pill, so the journey stays guided
// and the section denominator is unchanged. Clicking the Learn pill always
// returns to step 1 (see config.onNavigate).
let learnStep = "meet"; // "meet" | "deep"
let boardWalking = false; // "Play all" auto-walk is running on the Meet-the-letters board
// Letter filter for the board (and everything downstream of it: the auto-walk and
// the carousel's cross-letter flow). Keys match course.groups, so the tajweed
// sets the curriculum already defines are what the child can drill.
let boardFilter = "all"; // "all" | "light" | "heavy" | "vowels"
// [key, chip label, adjective used in the walk hint ("the 3 long-vowel sounds")]
const BOARD_FILTERS = [
  ["all", "All letters", "letter"],
  ["light", "Light", "light"],
  ["heavy", "Heavy", "heavy"],
  ["vowels", "Long vowels", "long-vowel"],
];
// The filtered set every board view works from (practiceLetters falls back to the
// full alphabet if a group is missing/empty, so this is always non-empty).
const boardLetters = () => practiceLetters(boardFilter);

// Sounds heard drive step 1's ribbon; lettersVisited (carousels opened) still
// drives Learn's COMPLETION, so no existing progress or percentage regresses.
const lettersHeard = () => C.progress.lettersHeard || (C.progress.lettersHeard = []);
function markLetterHeard(id) {
  if (lettersHeard().includes(id)) return false;
  lettersHeard().push(id);
  C.saveProgress();
  return true;
}

// "Play all letters" on Meet the letters: the system walks the board and plays
// every letter's SOUND, driven entirely by the headmaster's cadence from
// prequran_practice_settings (fetched into course.practice.listen) — passes
// (loops through the set), repeats (plays per letter), gapMs (the SPEED between
// letters), echo ("your turn" pause). Cancellable via practiceToken (shared with
// runPractice), so leaving the section / tapping a tile / pressing Stop halts it.
function boardWalkLabelText(n, total) {
  return `${n} of ${total} sounds heard` + (n ? " " + "🌟".repeat(Math.min(5, Math.ceil(n / 6))) : "");
}
function stopBoardWalk() {
  if (!boardWalking) return;
  boardWalking = false;
  practiceToken += 1; // cancels the running loop
  stopClip();
  if (!C.$) return;
  C.$$(".letter-tile.walking").forEach((t) => t.classList.remove("walking"));
  const yt = C.$(".board-yourturn"); if (yt) yt.hidden = true;
  const wb = C.$("[data-board-walk]");
  if (wb) { wb.classList.remove("is-playing"); const l = wb.querySelector(".bw-label"); if (l) l.textContent = "Play all letters"; }
}
async function runBoardWalk() {
  const cfg = practiceConfig("listen"); // the headmaster cadence (prequran_practice_settings)
  const letters = boardLetters(); // walks only the letters the filter is showing
  const total = letters.length;
  const passes = Math.max(1, cfg.passes || 1);
  const repeats = Math.max(1, cfg.repeats || 1);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const token = ++practiceToken;
  boardWalking = true;
  const wb = C.$("[data-board-walk]");
  if (wb) { wb.classList.add("is-playing"); const l = wb.querySelector(".bw-label"); if (l) l.textContent = "Stop"; }
  const yt = C.$(".board-yourturn");
  const heardInSet = () => letters.filter((l) => lettersHeard().includes(l.id)).length;
  const setRibbon = () => {
    const n = heardInSet(); // within the filtered set, matching the board ribbon
    const f = C.$(".board-progress-fill"); if (f) f.style.width = `${Math.round(n / total * 100)}%`;
    const t = C.$(".board-progress-label"); if (t) t.textContent = boardWalkLabelText(n, total);
  };
  for (let pass = 0; pass < passes; pass += 1) {
    for (let i = 0; i < total; i += 1) {
      if (token !== practiceToken) return;
      const l = letters[i];
      const tile = C.$(`[data-letter="${l.id}"]`);
      C.$$(".letter-tile.walking").forEach((t) => t.classList.remove("walking"));
      if (tile) {
        tile.classList.add("walking");
        tile.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
      for (let r = 0; r < repeats; r += 1) {
        if (token !== practiceToken) return;
        await playClip(mediaUrl(l.media.sound, C.stageNumber), null); // Meet the letters = the SOUND
      }
      if (token !== practiceToken) return;
      if (markLetterHeard(l.id) && tile) tile.classList.add("visited");
      setRibbon();
      if (cfg.echo && yt) { yt.hidden = false; await wait(cfg.echoMs || 1500); yt.hidden = true; if (token !== practiceToken) return; }
      await wait(cfg.gapMs || 700); // the SPEED between letters
      if (token !== practiceToken) return;
    }
  }
  boardWalking = false;
  C.$$(".letter-tile.walking").forEach((t) => t.classList.remove("walking"));
  if (wb) { wb.classList.remove("is-playing"); const l = wb.querySelector(".bw-label"); if (l) l.textContent = "Play all letters"; }
  if (heardInSet() >= total) fireConfetti(); // finished the set they were drilling
}

// ---- activity hub: navigation as its own full-screen page -------------------
// The shared shell's dark sidebar is hidden for PreQuraan (prequran.css) and
// replaced by this hub: one full-screen, colourful "what shall I do?" page of
// big activity cards. It also retires the shell's lucide <i> icons, which never
// render here (no lucide script) and fall back to stray letters — emoji are
// self-contained and read better for young children.
const HUB_CARDS = [
  ["learn", "🔤", "Learn", "Meet all 29 letters and hear how each one sounds."],
  ["review", "🔁", "Review", "See the letters inside real Arabic words."],
  ["practice", "🎯", "Practice", "Listen and repeat, again and again."],
  ["games", "🎮", "Games", "Hear it, tap it — play and collect stars."],
  ["assessment", "🏆", "Assessment", "Show what you know."],
];
const onHubRoute = () => !location.hash || location.hash === "#overview";

// TRUE fullscreen ("the whole screen, nothing else" — no browser tabs or address
// bar) can only be requested from a USER GESTURE; every browser refuses it during
// page load. So the hub arms a one-shot listener: the child's very first tap or
// key press enters real fullscreen, and it stays there afterwards because the
// shell re-requests fullscreen on every navigate(). Re-armed whenever fullscreen
// is left (Esc / browser UI), so the next tap puts it back.
// ESCAPE: browsers GUARANTEE a user can always leave fullscreen, so it can never
// be fully disabled — that is a deliberate anti-kiosk-trap rule, not a gap we can
// patch. Best effort, in three layers:
//   1. swallow Escape in the CAPTURE phase so the shell's own
//      keydown→exitFocusMode()→exitFullscreen() handler never runs (this is our
//      code exiting fullscreen, and it is entirely within our control);
//   2. Keyboard Lock (Chromium + HTTPS + while fullscreen) so the BROWSER routes
//      Escape to the page instead of exiting — holding it ~2s still exits;
//   3. if they get out anyway (Firefox/Safari, or long-press), the existing
//      re-arm puts fullscreen back on the next tap.
function suppressEscapeKey() {
  if (suppressEscapeKey.bound) return;
  suppressEscapeKey.bound = true;
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.fullscreenElement) return;
    event.stopImmediatePropagation(); // beat the shell's exitFocusMode listener
    event.preventDefault();
  }, true);
}
function lockEscapeKey() {
  try { navigator.keyboard?.lock?.(["Escape"])?.catch?.(() => {}); } catch (e) { /* unsupported */ }
}
function unlockEscapeKey() {
  try { navigator.keyboard?.unlock?.(); } catch (e) { /* unsupported */ }
}

let fullscreenArmed = false;
function armFullscreenOnFirstGesture() {
  if (fullscreenArmed || document.fullscreenElement) return;
  fullscreenArmed = true;
  const enter = () => {
    document.removeEventListener("pointerdown", enter, true);
    document.removeEventListener("keydown", enter, true);
    fullscreenArmed = false;
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  };
  document.addEventListener("pointerdown", enter, true);
  document.addEventListener("keydown", enter, true);
}

function renderHub() {
  const total = C.course.letters.length;
  const isDone = (id) => C.progress.completed.includes(id);
  const units = (C.manifest.units || []).map((u) =>
    `<option value="${u.number}"${u.number === C.unitNumber ? " selected" : ""}${u.implementationStatus === "planned" ? " disabled" : ""}>Unit ${u.number} · ${C.escapeHtml(u.title)}${u.implementationStatus === "planned" ? " (coming soon)" : ""}</option>`).join("");
  const cards = HUB_CARDS.map(([id, emoji, title, blurb], i) => {
    const state = isDone(id)
      ? "✓ Done"
      : (id === "learn" ? `${lettersHeard().length} of ${total} sounds heard` : "Start");
    return `
      <button class="hub-card hub-${id}${isDone(id) ? " done" : ""}" type="button" data-hub="${id}" style="--i:${i}">
        <span class="hub-emoji" aria-hidden="true">${emoji}</span>
        <span class="hub-text">
          <span class="hub-title">${title}</span>
          <span class="hub-blurb">${blurb}</span>
        </span>
        <span class="hub-state">${state}</span>
      </button>`;
  }).join("");
  C.$("#app").innerHTML = `
    <section class="hub">
      <header class="hub-head">
        <span class="hub-brand"><span class="hub-mark" aria-hidden="true">ق</span> Quraan Academy · PreQuraan</span>
        <h1 class="hub-unit">${C.escapeHtml(C.course.title)}</h1>
        <p class="hub-lead">What would you like to do today?</p>
        <div class="hub-controls">
          <label class="hub-unitpick"><span>Unit</span><select id="hub-unit-select" aria-label="Choose unit">${units}</select></label>
          <button class="hub-full" type="button" data-hub-full aria-label="Fill the whole screen">⛶ <span>Full screen</span></button>
        </div>
      </header>
      <div class="hub-grid">${cards}</div>
    </section>`;
  C.$$("[data-hub]").forEach((card) => card.addEventListener("click", () => {
    card.classList.add("pop");
    const go = () => C.navigate(card.dataset.hub);
    if (prefersReducedMotion()) go(); else setTimeout(go, 170);
  }));
  const select = C.$("#hub-unit-select");
  if (select) select.addEventListener("change", () => { location.href = `?level=${C.stageNumber}&unit=${select.value}`; });
  // Entering fullscreen from the hub WITHOUT leaving it — tapping a card also
  // goes fullscreen, but it navigates away, so the hub itself would never be seen
  // filling the screen. This button is the gesture that browsers require, and it
  // hides itself once fullscreen so nothing else remains on the page.
  const fullBtn = C.$("[data-hub-full]");
  if (fullBtn) fullBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  });
}

// Keeps the page in the right "mode": on the hub the topbar is hidden too (so the
// hub really is its own full screen); inside a section a floating Menu button
// returns to it. Driven from onAfterRender so every route change stays in sync.
// A page can never START fullscreen — the browser demands a gesture first. Rather
// than let that gesture be a card tap (which throws the child straight into a
// section, so the HUB is never seen full screen), we open with a one-tap welcome
// gate: tap it and the app goes fullscreen with the hub already behind it.
// Skipped entirely when the app is already chromeless — an installed PWA
// (display-mode: fullscreen/standalone) or an existing fullscreen session.
let fsGateDismissed = false;
// Already-chromeless detection: real browser state only (true fullscreen, or an
// installed PWA launched with display-mode fullscreen/standalone). When either is
// true the welcome gate and the ⛶ button have nothing to do.
const isChromeless = () => !!document.fullscreenElement
  || (window.matchMedia && (matchMedia("(display-mode: fullscreen)").matches
    || matchMedia("(display-mode: standalone)").matches));

function syncFullscreenGate() {
  const need = onHubRoute() && !fsGateDismissed && !isChromeless()
    && !!document.documentElement.requestFullscreen;
  let gate = document.getElementById("fs-gate");
  if (!need) { if (gate) gate.remove(); return; }
  if (gate) return;
  gate = document.createElement("div");
  gate.id = "fs-gate";
  gate.className = "fs-gate";
  gate.innerHTML = `
    <div class="fs-gate-inner">
      <span class="fs-gate-mark" aria-hidden="true">ق</span>
      <h1>${C.escapeHtml(C.course.title)}</h1>
      <p>Tap to begin — the lesson fills the whole screen.</p>
      <span class="fs-gate-btn">▶ Start</span>
    </div>`;
  gate.addEventListener("click", () => {
    fsGateDismissed = true;
    // Requested from a real tap, so the browser grants it. If it refuses
    // (e.g. iOS Safari has no element fullscreen) we still reveal the hub.
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    gate.remove();
  });
  document.body.appendChild(gate);
}

function syncHubChrome() {
  const onHub = onHubRoute();
  document.body.classList.toggle("on-hub", onHub);
  syncFullscreenGate();
  // Keep a gesture primed so the app is always one tap away from real fullscreen
  // (covers first load, and re-entry after the child presses Esc).
  armFullscreenOnFirstGesture();
  // Once fullscreen, the "Full screen" button has nothing left to do — hide it so
  // the hub really is the whole screen and nothing else.
  const fullBtn = document.querySelector("[data-hub-full]");
  if (fullBtn) fullBtn.hidden = isChromeless(); // nothing to do when already chromeless
  if (!syncHubChrome.fsBound) {
    syncHubChrome.fsBound = true;
    suppressEscapeKey();
    document.addEventListener("fullscreenchange", () => {
      // Keyboard Lock only works WHILE fullscreen, so take/release it here.
      if (document.fullscreenElement) lockEscapeKey();
      else { unlockEscapeKey(); armFullscreenOnFirstGesture(); }
      syncHubChrome();
    });
  }
  let button = document.getElementById("hub-home");
  if (!button) {
    button = document.createElement("button");
    button.id = "hub-home";
    button.className = "hub-home";
    button.type = "button";
    button.setAttribute("aria-label", "Back to the activity menu");
    button.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
    button.addEventListener("click", () => C.navigate("overview"));
    document.body.appendChild(button);
  }
  button.hidden = onHub;
}

function renderLearn() {
  if (selectedLetterId) return renderLetterDetail(letterById(selectedLetterId));
  return renderLetterBoard(learnStep);
}

function renderLetterBoard(mode) {
  const deep = mode === "deep";
  const done = deep ? lettersVisited() : lettersHeard();
  const shown = boardLetters();
  const total = shown.length;
  const doneCount = shown.filter((l) => done.includes(l.id)).length;
  const rows = new Map();
  for (const letter of shown) {
    if (!rows.has(letter.row)) rows.set(letter.row, []);
    rows.get(letter.row).push(letter);
  }
  let idx = 0;
  const grid = [...rows.keys()].sort((a, b) => a - b).map((rowNumber) => {
    const tiles = rows.get(rowNumber)
      .sort((a, b) => b.col - a.col)
      .map((letter) => {
        const isDone = done.includes(letter.id);
        const i = idx++;
        return `
        <button class="letter-tile fam-${letterFamily(letter)} ${isDone ? "visited" : ""}" style="--i:${i}"
                type="button" data-letter="${letter.id}"
                aria-label="${C.escapeHtml(letter.name)}${isDone ? (deep ? ", explored" : ", heard") : ""}">
          <span class="tile-star" aria-hidden="true">★</span>
          <span class="tile-glyph" dir="rtl" lang="ar">${C.escapeHtml(letter.glyph)}</span>
          <span class="tile-name">${C.escapeHtml(letter.name)}</span>
        </button>`;
      }).join("");
    return `<div class="letter-row" dir="rtl">${tiles}</div>`;
  }).join("");
  const label = (n) => `${n} of ${total} ${deep ? "letters explored" : "sounds heard"}`
    + (n ? " " + "🌟".repeat(Math.min(5, Math.ceil(n / 6))) : "");
  const header = deep
    ? C.pageHeader("Letters", "Deep dive", "Tap a letter to open it and explore how it sounds, how it is written, and a word that uses it.", "Recorded recitation audio")
    : C.pageHeader("Letters", "Meet the letters", "Tap a letter to hear the sound it makes. Blue letters stretch sounds; golden letters are heavy and deep.", "Recorded recitation audio");
  const arrow = deep
    ? `<button class="carousel-arrow prev board-arrow" type="button" data-board-back aria-label="Back to Meet the letters" title="Back to Meet the letters">${C.icon("chevron-left")}</button>`
    : `<button class="carousel-arrow next board-arrow" type="button" data-board-next aria-label="Next: Deep dive" title="Next: Deep dive">${C.icon("chevron-right")}</button>`;
  // "Play all letters" auto-walk (Meet the letters only). Cadence + SPEED come
  // from the headmaster's prequran_practice_settings (course.practice.listen).
  const cfg = deep ? null : practiceConfig("listen");
  const walkBar = deep ? "" : `
    <div class="board-walk">
      <button class="button primary board-walk-btn" type="button" data-board-walk aria-label="Play all letter sounds">
        ${C.icon("play-circle")} <span class="bw-label">Play all letters</span>
      </button>
      <span class="board-walk-hint">Auto-plays ${boardFilter === "all" ? "every sound" : `the ${total} ${(BOARD_FILTERS.find(([k]) => k === boardFilter) || [])[2]} sounds`} — ${cfg.passes} pass${cfg.passes > 1 ? "es" : ""}${cfg.repeats > 1 ? `, ${cfg.repeats}× each` : ""}, ${cfg.gapMs}ms gap. Speed is set in PreQuraan practice settings.</span>
      <span class="board-yourturn" hidden>🎤 Your turn — say it!</span>
    </div>`;
  // Filter chips — the tajweed sets from course.groups. Tinted to match the tile
  // families, so the colour that teaches the group also labels the filter.
  const groupCount = (key) => key === "all"
    ? C.course.letters.length
    : ((C.course.groups || {})[key] || []).length;
  const chips = BOARD_FILTERS
    .filter(([key]) => key === "all" || groupCount(key) > 0)
    .map(([key, text]) => `
      <button class="board-chip chip-${key} ${boardFilter === key ? "active" : ""}" type="button"
              data-filter="${key}" aria-pressed="${boardFilter === key}">
        ${C.escapeHtml(text)} <span class="chip-count">${groupCount(key)}</span>
      </button>`).join("");
  C.$("#app").innerHTML = `
    ${header}
    <div class="board-flow">
      <div class="letter-board panel">
        <canvas class="board-sky" aria-hidden="true"></canvas>
        <div class="board-filters" role="group" aria-label="Filter letters">${chips}</div>
        <div class="board-progress">
          <div class="board-progress-track"><span class="board-progress-fill" style="width:${Math.round(doneCount / total * 100)}%"></span></div>
          <span class="board-progress-label">${label(doneCount)}</span>
        </div>
        ${walkBar}
        <div class="letter-grid">${grid}</div>
      </div>
      ${arrow}
    </div>`;
  boardAmbientStop = startBoardAmbient(C.$(".board-sky"));

  const stepTo = (next) => { stopBoardWalk(); learnStep = next; C.renderRoute(); };
  const nextBtn = C.$("[data-board-next]");
  if (nextBtn) nextBtn.addEventListener("click", () => stepTo("deep"));
  const backBtn = C.$("[data-board-back]");
  if (backBtn) backBtn.addEventListener("click", () => stepTo("meet"));

  const walkBtn = C.$("[data-board-walk]");
  if (walkBtn) walkBtn.addEventListener("click", () => (boardWalking ? stopBoardWalk() : runBoardWalk()));

  C.$$("[data-filter]").forEach((chip) => chip.addEventListener("click", () => {
    if (chip.dataset.filter === boardFilter) return;
    stopBoardWalk();          // a running walk belongs to the old set
    selectedLetterId = null;  // never keep a letter open that the new filter hides
    boardFilter = chip.dataset.filter;
    C.renderRoute();
  }));

  C.$$("[data-letter]").forEach((tile) => tile.addEventListener("click", () => {
    const id = tile.dataset.letter;
    const letter = letterById(id);
    tile.classList.add("pop");
    if (deep) {
      // Original behaviour: instant sound reward, then into the carousel.
      playClip(mediaUrl(letter.media.name, C.stageNumber), null);
      const go = () => { selectedLetterId = id; C.renderRoute(); };
      if (prefersReducedMotion()) go(); else setTimeout(go, 430);
      return;
    }
    // A manual tap takes over from the auto-walk (if running), then plays this
    // letter's SOUND and stays on the board. The ribbon updates in place so the
    // ambient canvas and tap animation are not reset.
    if (boardWalking) stopBoardWalk();
    playClip(mediaUrl(letter.media.sound, C.stageNumber), null);
    if (markLetterHeard(id)) {
      tile.classList.add("visited");
      // Count within the SHOWN set — under a filter the ribbon tracks that group,
      // not the whole alphabet (lettersHeard itself stays global).
      const heard = shown.filter((l) => lettersHeard().includes(l.id)).length;
      const fill = C.$(".board-progress-fill");
      const text = C.$(".board-progress-label");
      if (fill) fill.style.width = `${Math.round(heard / total * 100)}%`;
      if (text) text.textContent = label(heard);
      if (heard >= total) fireConfetti();
    }
  }));
}

// Letter detail = a CAROUSEL of colourful full-screen activity slides (one
// thing at a time, kid-friendly). Big side arrows flow across the whole
// alphabet: at a letter's last slide, "next" opens the next letter; at its
// first slide, "prev" opens the previous one. Dots + swipe + video pause.
function renderLetterDetail(letter) {
  // Flow across the FILTERED set, so "next" never jumps to a letter the current
  // filter is hiding (falls back to the full alphabet when the filter is "all").
  const list = boardLetters();
  const index = list.indexOf(letter);
  const previous = list[index - 1];
  const next = list[index + 1];
  markLetterVisited(letter.id);

  const M = (d) => mediaUrl(d, C.stageNumber);
  const esc = C.escapeHtml;
  const title = (emoji, text) => `<div class="slide-title"><span class="slide-emoji" aria-hidden="true">${emoji}</span> ${esc(text)}</div>`;

  const slides = [];
  slides.push(`<section class="lslide slide-hero"><div class="lslide-inner">
    <span class="hero-eyebrow">Your new letter</span>
    <div class="hero-badge"><span dir="rtl" lang="ar">${esc(letter.glyph)}</span></div>
    <h1>${esc(letter.name)}</h1>
    <div class="lslide-actions">
      <button class="big-btn play clip-button" type="button" data-clip="${esc(letter.media.name)}">${C.icon("play")} Letter name</button>
      <button class="big-btn ghost clip-button" type="button" data-clip="${esc(letter.media.sound)}">${C.icon("play")} Letter sound</button>
    </div>
    <p class="swipe-hint">Swipe, or tap the arrows, to explore ${esc(letter.name)} →</p>
  </div></section>`);
  slides.push(`<section class="lslide slide-say"><div class="lslide-inner">
    ${title("🗣️", "Say it out loud!")}
    <p class="slide-lead">Watch how the mouth moves, then say it with me.</p>
    <video id="v-spoken" controls preload="none" src="${M(letter.media.articulationVideo)}"></video>
    <p class="slide-note">${esc(letter.articulation)}</p>
    <div class="lslide-actions">
      <button class="big-btn" type="button" data-play-video="v-spoken">${C.icon("play")} Watch &amp; listen</button>
      <button class="big-btn ghost clip-button" type="button" data-clip="${esc(letter.media.articulationAudio)}">${C.icon("volume-2")} Hear how</button>
    </div>
  </div></section>`);
  slides.push(`<section class="lslide slide-written"><div class="lslide-inner">
    ${title("✍️", "Now let's write it!")}
    <p class="slide-lead">Follow the pen from the very start to the end.</p>
    <video id="v-written" controls preload="none" src="${M(letter.media.writingVideo)}"></video>
    <div class="lslide-actions">
      <button class="big-btn" type="button" data-play-video="v-written">${C.icon("play")} Watch the letter written</button>
      ${letter.writing && letter.writing.explainer ? `<button class="big-btn ghost voice-button" type="button" data-speak="${esc(letter.writing.explainer)}" data-writing-explainer="1" aria-label="Hear the explainer">${C.icon("volume-2")} Hear the explainer</button>` : ""}
    </div>
    ${letter.writing && letter.writing.explainer ? `<p class="translit-explainer">${esc(letter.writing.explainer)}</p>` : ""}
  </div></section>`);
  if (letter.transliteration) {
    slides.push(`<section class="lslide slide-translit"><div class="lslide-inner">
      ${title("🔤", "Transliteration")}
      <div class="translit-big">${esc(letter.transliteration.latin)}</div>
      <p class="slide-lead">In English letters: <strong>${esc(letter.transliteration.latin)}</strong></p>
      <img class="companion-img" src="${M(letter.animal.image)}" alt="${esc(letter.animal.label)}">
      <p class="slide-note">${esc(letter.transliteration.simile)}</p>
      <div class="lslide-actions">
        <button class="big-btn ghost clip-button" type="button" data-clip="${esc(letter.animal.audio)}" data-then-explain="[data-translit-explainer]">${C.icon("play")} Animal sound</button>
        <button class="big-btn ghost voice-button" type="button" data-speak="${esc(letter.transliteration.explainer)}" data-translit-explainer="1" aria-label="Hear the explainer">${C.icon("volume-2")} Hear the explainer</button>
      </div>
      <p class="translit-explainer">${esc(letter.transliteration.explainer)}</p>
    </div></section>`);
  }
  slides.push(`<section class="lslide slide-word"><div class="lslide-inner">
    ${title("📖", "See it in a word")}
    <p class="slide-lead">A real Arabic word that starts with ${esc(letter.name)}.</p>
    <img class="companion-img" src="${M(letter.word.image)}" alt="${esc(letter.word.english)}">
    <p>${arabic(letter.word.arabic, "word-arabic")}<br><strong>${esc(letter.word.transliteration)}</strong> — ${esc(letter.word.english)}</p>
    <div class="lslide-actions">
      <button class="big-btn play clip-button" type="button" data-clip="${esc(letter.word.audio)}"${letter.word.explainer ? ' data-then-explain="[data-word-explainer]"' : ""}>${C.icon("play")} Say the word</button>
      ${letter.word.explainer ? `<button class="big-btn ghost voice-button" type="button" data-speak="${esc(letter.word.explainer)}" data-word-explainer="1" aria-label="Hear the explainer">${C.icon("volume-2")} Hear the explainer</button>` : ""}
    </div>
    ${letter.word.explainer ? `<p class="translit-explainer">${esc(letter.word.explainer)}</p>` : ""}
  </div></section>`);

  const count = slides.length;
  C.$("#app").innerHTML = `
    <div class="letter-detail-v2">
      <div class="carousel-top">
        <button class="button secondary" type="button" data-back>${C.icon("arrow-left")} All letters</button>
        <span class="detail-count">Letter ${index + 1} of ${list.length}</span>
      </div>
      <div class="letter-carousel">
        <button class="carousel-arrow prev" type="button" aria-label="Previous">${C.icon("chevron-left")}</button>
        <div class="carousel-viewport"><div class="carousel-track">${slides.join("")}</div></div>
        <button class="carousel-arrow next" type="button" aria-label="Next">${C.icon("chevron-right")}</button>
      </div>
      <div class="carousel-dots">${slides.map((_, i) => `<button class="dot" type="button" data-dot="${i}" aria-label="Step ${i + 1} of ${count}"></button>`).join("")}</div>
    </div>`;

  const track = C.$(".carousel-track");
  const dots = C.$$("[data-dot]");
  const prevArrow = C.$(".carousel-arrow.prev");
  const nextArrow = C.$(".carousel-arrow.next");
  let slide = 0;
  const goToSlide = (n) => {
    slide = Math.max(0, Math.min(count - 1, n));
    track.style.transform = `translateX(-${slide * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === slide));
    prevArrow.disabled = (slide === 0 && !previous);
    nextArrow.disabled = (slide === count - 1 && !next);
    stopClip();
    C.$$(".carousel-track video").forEach((v) => v.pause());
  };
  prevArrow.addEventListener("click", () => {
    if (slide > 0) goToSlide(slide - 1);
    else if (previous) { selectedLetterId = previous.id; stopClip(); C.renderRoute(); }
  });
  nextArrow.addEventListener("click", () => {
    if (slide < count - 1) goToSlide(slide + 1);
    else if (next) { selectedLetterId = next.id; stopClip(); C.renderRoute(); }
  });
  dots.forEach((d) => d.addEventListener("click", () => goToSlide(Number(d.dataset.dot))));

  // touch swipe (horizontal)
  const viewport = C.$(".carousel-viewport");
  let startX = 0, tracking = false;
  viewport.addEventListener("pointerdown", (e) => { startX = e.clientX; tracking = true; });
  viewport.addEventListener("pointerup", (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 55) (dx < 0 ? nextArrow : prevArrow).click();
  });

  C.$$("[data-play-video]").forEach((button) => button.addEventListener("click", () => {
    const video = document.getElementById(button.dataset.playVideo);
    if (!video) return;
    stopClip();
    if (video.paused) video.play().catch(() => {}); else video.pause();
  }));
  C.$("[data-back]").addEventListener("click", () => { selectedLetterId = null; stopClip(); C.renderRoute(); });
  bindClipButtons();
  goToSlide(0);
}

// ---- watch: the dedicated video section (legacy "Watch" + "Animate" steps) --
let watchIndex = 0;
let watchPlayAll = false;

function renderWatch() {
  const letter = C.course.letters[watchIndex];
  const total = C.course.letters.length;
  C.$("#app").innerHTML = `
    ${C.pageHeader("Watch", "See every letter come alive", "Watch how each letter is pronounced, then watch it being written. Play all runs through the whole alphabet.", "Recorded recitation video")}
    <div class="listen-controls panel">
      <button class="button primary" type="button" id="watch-play-all">${C.icon("play-circle")} ${watchPlayAll ? "Stop auto-play" : "Play all letters"}</button>
      <button class="button secondary" type="button" id="watch-done" ${C.progress.completed.includes("watch") ? "disabled" : ""}>${C.icon("check-circle-2")} ${C.progress.completed.includes("watch") ? "Completed" : "I watched them all"}</button>
    </div>
    <div class="watch-stage panel">
      <div class="watch-head">
        <button class="button secondary" type="button" id="watch-prev" ${watchIndex === 0 ? "disabled" : ""}>${C.icon("chevron-left")} Previous</button>
        <div class="watch-title"><span class="watch-glyph" dir="rtl" lang="ar">${C.escapeHtml(letter.glyph)}</span><strong>${C.escapeHtml(letter.name)}</strong><span class="detail-count">Letter ${letter.number} of ${total}</span></div>
        <button class="button secondary" type="button" id="watch-next" ${watchIndex >= total - 1 ? "disabled" : ""}>Next ${C.icon("chevron-right")}</button>
      </div>
      <div class="watch-videos">
        <figure><figcaption>${C.icon("mic")} How it sounds <span class="video-hint">Click to watch letter spoken</span></figcaption>
          <video id="watch-articulation" controls preload="metadata" src="${mediaUrl(letter.media.articulationVideo, C.stageNumber)}"></video></figure>
        <figure><figcaption>${C.icon("pen-tool")} How it is written <span class="video-hint">Click to watch letter written</span></figcaption>
          <video id="watch-writing" controls preload="metadata" src="${mediaUrl(letter.media.writingVideo, C.stageNumber)}"></video></figure>
      </div>
    </div>`;
  const articulation = C.$("#watch-articulation");
  if (watchPlayAll && articulation) {
    articulation.play().catch(() => {});
    articulation.onended = () => {
      if (!watchPlayAll) return;
      if (watchIndex < total - 1) { watchIndex += 1; renderWatch(); }
      else { watchPlayAll = false; C.complete("watch", "You watched the whole alphabet — beautiful."); renderWatch(); }
    };
  }
  C.$("#watch-play-all").addEventListener("click", () => { watchPlayAll = !watchPlayAll; renderWatch(); });
  C.$("#watch-done").addEventListener("click", () => C.complete("watch", "Watch section complete."));
  C.$("#watch-prev").addEventListener("click", () => { if (watchIndex > 0) { watchIndex -= 1; watchPlayAll = false; renderWatch(); } });
  C.$("#watch-next").addEventListener("click", () => { if (watchIndex < total - 1) { watchIndex += 1; watchPlayAll = false; renderWatch(); } });
}

// ---- repetition engine (legacy "passes/repeats per section", data-driven) --
// Arabic letters are learned by repetition; the unit JSON's `practice.<section>`
// block configures it (passes, filter, play name/sound/both, repeats, gap, echo).
const PRACTICE_DEFAULTS = {
  listen: { passes: 2, filter: "all", play: "name", repeats: 1, gapMs: 700, echoMs: 1500, echo: false },
};
function practiceConfig(sectionId) {
  const data = (C.course.practice && C.course.practice[sectionId]) || {};
  return { ...(PRACTICE_DEFAULTS[sectionId] || {}), ...data };
}
function practiceLetters(filter) {
  const letters = C.course.letters;
  if (!filter || filter === "all") return letters;
  const nums = new Set((C.course.groups || {})[filter] || []);
  const subset = letters.filter((l) => nums.has(l.number));
  return subset.length ? subset : letters;
}

let practiceToken = 0; // bumping cancels a running practice loop (pause / leave section)

// Renders a self-contained repetition player into `container` and drives it.
function runPractice(container, cfg, opts) {
  const letters = practiceLetters(cfg.filter);
  const total = letters.length;
  const passes = Math.max(1, cfg.passes || 1);
  const repeats = Math.max(1, cfg.repeats || 1);
  const clipsFor = (l) => cfg.play === "both" ? [l.media.name, l.media.sound]
    : cfg.play === "sound" ? [l.media.sound] : [l.media.name];
  const state = { pass: 0, index: 0, playing: false };

  container.innerHTML = `
    <div class="practice-player">
      <div class="pp-banner"><span id="pp-pass"></span><span class="pp-dot">•</span><span id="pp-item"></span></div>
      <div class="pp-track"><span class="pp-fill" id="pp-fill"></span></div>
      <div class="pp-stage">
        <button class="pp-arrow" id="pp-prev" type="button" aria-label="Previous letter">‹</button>
        <div class="pp-card" id="pp-card"></div>
        <button class="pp-arrow" id="pp-next" type="button" aria-label="Next letter">›</button>
      </div>
      <div class="pp-yourturn" id="pp-yourturn" hidden>🎤 Your turn — say it!</div>
      <div class="pp-controls">
        <button class="big-btn play" id="pp-toggle" type="button">▶ <span>Start</span></button>
        <button class="big-btn ghost" id="pp-replay" type="button">🔊 <span>Replay</span></button>
      </div>
    </div>`;

  const card = container.querySelector("#pp-card");
  const passEl = container.querySelector("#pp-pass");
  const itemEl = container.querySelector("#pp-item");
  const fill = container.querySelector("#pp-fill");
  const toggle = container.querySelector("#pp-toggle");
  const yourturn = container.querySelector("#pp-yourturn");
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  const renderCurrent = () => {
    const l = letters[Math.min(state.index, total - 1)];
    card.className = `pp-card fam-${letterFamily(l)}`;
    card.innerHTML = `<span class="pp-glyph" dir="rtl" lang="ar">${C.escapeHtml(l.glyph)}</span><span class="pp-name">${C.escapeHtml(l.name)}</span>`;
    passEl.textContent = `Pass ${Math.min(state.pass + 1, passes)} of ${passes}`;
    itemEl.textContent = `Letter ${state.index + 1} of ${total}`;
    fill.style.width = `${Math.round((state.pass * total + state.index) / (passes * total) * 100)}%`;
  };
  const setToggle = () => {
    toggle.innerHTML = state.playing ? "⏸ <span>Pause</span>"
      : `▶ <span>${state.pass === 0 && state.index === 0 ? "Start" : "Continue"}</span>`;
  };
  const playAudioFor = async (l, token) => {
    for (let r = 0; r < repeats; r += 1) {
      for (const clip of clipsFor(l)) {
        if (token !== practiceToken) return;
        await playClip(mediaUrl(clip, C.stageNumber), null);
      }
    }
  };
  async function loop() {
    const token = ++practiceToken;
    state.playing = true; setToggle();
    while (state.pass < passes) {
      while (state.index < total) {
        if (token !== practiceToken) return;
        renderCurrent();
        card.classList.remove("pulse"); void card.offsetWidth; card.classList.add("pulse");
        await playAudioFor(letters[state.index], token);
        if (token !== practiceToken) return;
        if (cfg.echo) { yourturn.hidden = false; await wait(cfg.echoMs || 1500); yourturn.hidden = true; if (token !== practiceToken) return; }
        await wait(cfg.gapMs || 600);
        if (token !== practiceToken) return;
        state.index += 1;
      }
      state.index = 0; state.pass += 1;
    }
    state.playing = false;
    fill.style.width = "100%";
    card.className = "pp-card";
    card.innerHTML = `<span class="pp-done">🎉</span><span class="pp-name">All done!</span>`;
    passEl.textContent = `${passes} of ${passes} passes`;
    itemEl.textContent = "Complete";
    setToggle();
    if (opts && opts.onComplete) opts.onComplete();
  }
  const pause = () => { practiceToken += 1; state.playing = false; stopClip(); setToggle(); };

  toggle.addEventListener("click", () => {
    if (state.playing) pause();
    else { if (state.pass >= passes) { state.pass = 0; state.index = 0; } loop(); }
  });
  container.querySelector("#pp-replay").addEventListener("click", () => playAudioFor(letters[Math.min(state.index, total - 1)], practiceToken));
  container.querySelector("#pp-prev").addEventListener("click", () => { pause(); state.index = Math.max(0, state.index - 1); renderCurrent(); });
  container.querySelector("#pp-next").addEventListener("click", () => { pause(); if (state.index < total - 1) state.index += 1; renderCurrent(); });

  renderCurrent(); setToggle();
}

function renderPractice() {
  const cfg = practiceConfig("listen");
  C.$("#app").innerHTML = `
    ${C.pageHeader("Listen", "Listen &amp; repeat", `Hear every letter, ${cfg.passes} times through. Press Start and follow along — say each letter after you hear it.`, "Recorded recitation audio")}
    <div class="practice-host panel" id="practice-host"></div>`;
  runPractice(C.$("#practice-host"), cfg, { onComplete: () => C.complete("practice", "Great listening — you heard them all! ماشاء الله") });
}

function renderReview() {
  const cards = C.course.letters.map((letter) => `
    <div class="word-card panel">
      <img loading="lazy" src="${mediaUrl(letter.word.image, C.stageNumber)}" alt="${C.escapeHtml(letter.word.english)}">
      <div class="word-lines">
        ${arabic(letter.word.arabic, "word-arabic")}
        <span><strong>${C.escapeHtml(letter.word.transliteration)}</strong> — ${C.escapeHtml(letter.word.english)}</span>
        <span class="word-letter">Letter: ${arabic(letter.glyph)} ${C.escapeHtml(letter.name)}</span>
      </div>
      ${clipButton(letter.word.audio, "Say it")}
    </div>`).join("");
  C.$("#app").innerHTML = `
    ${C.pageHeader("Review", "Review the letters", "Revisit every letter through a real word — hear it, say it, remember it.", "Recorded recitation audio")}
    <div class="word-controls panel">
      <button class="button secondary" type="button" id="words-done" ${C.progress.completed.includes("review") ? "disabled" : ""}>${C.icon("check-circle-2")} ${C.progress.completed.includes("review") ? "Completed" : "I reviewed them all"}</button>
    </div>
    <div class="word-grid">${cards}</div>`;
  bindClipButtons();
  C.$("#words-done").addEventListener("click", () => C.complete("review", "Twenty-nine first words — section complete."));
}

const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

// ---- Games: "Hear it, tap it!" (letter-sound recognition) -------------------
function renderGames() {
  const all = C.course.letters;
  const rounds = Math.min(8, all.length);
  const pool = shuffle([...all]).slice(0, rounds);
  let round = 0, stars = 0;

  const renderResult = () => {
    C.$("#app").innerHTML = `
      ${C.pageHeader("Games", "Great playing!", "You finished the letter game.", "Recorded recitation audio")}
      <div class="game-panel panel game-result">
        <div class="result-badge">🏆</div>
        <h2>${stars} of ${rounds} stars</h2>
        <div class="lslide-actions"><button class="big-btn play" id="game-again" type="button">🔁 <span>Play again</span></button></div>
      </div>`;
    C.$("#game-again").addEventListener("click", renderGames);
    C.emitProgress({ type: "checkpoint.result", unit: C.PROGRESS_UNIT, section: "games", score: stars, total: rounds });
    if (!C.progress.completed.includes("games")) C.complete("games", `Game complete — ${stars} stars!`);
    if (stars / rounds >= 0.6) fireConfetti();
  };
  const renderRound = () => {
    if (round >= rounds) return renderResult();
    const target = pool[round];
    const options = shuffle([target, ...shuffle(all.filter((l) => l.id !== target.id)).slice(0, 3)]);
    C.$("#app").innerHTML = `
      ${C.pageHeader("Games", "Hear it, tap it!", "Listen to the letter, then tap the one you heard.", "Recorded recitation audio")}
      <div class="game-panel panel">
        <div class="game-top"><span>Round ${round + 1} of ${rounds}</span><span>⭐ ${stars}</span></div>
        <button class="big-btn play" id="game-play" type="button">🔊 <span>Play the sound</span></button>
        <div class="game-grid">
          ${options.map((o) => `<button class="game-tile fam-${letterFamily(o)}" type="button" data-opt="${o.id}"><span dir="rtl" lang="ar">${C.escapeHtml(o.glyph)}</span></button>`).join("")}
        </div>
        <div class="game-feedback" id="game-fb">&nbsp;</div>
      </div>`;
    const play = () => playClip(mediaUrl(target.media.name, C.stageNumber), null);
    C.$("#game-play").addEventListener("click", play);
    play();
    let answered = false, firstTry = true;
    C.$$("[data-opt]").forEach((tile) => tile.addEventListener("click", () => {
      if (answered) return;
      if (tile.dataset.opt === target.id) {
        answered = true;
        tile.classList.add("correct");
        if (firstTry) stars += 1;
        C.$("#game-fb").textContent = firstTry ? "🎉 Yes!" : "✓ That's it!";
        setTimeout(() => { round += 1; renderRound(); }, 950);
      } else {
        firstTry = false;
        tile.classList.add("wrong"); tile.disabled = true;
      }
    }));
  };
  renderRound();
}

// ---- Assessment: "Show what you know" (recognition quiz, scored) ------------
function renderAssessment() {
  const all = C.course.letters;
  const qCount = Math.min(10, all.length);
  const quiz = shuffle([...all]).slice(0, qCount);
  let q = 0, correct = 0;

  const renderResult = () => {
    const pct = Math.round(correct / qCount * 100);
    const passed = pct >= 70;
    C.$("#app").innerHTML = `
      ${C.pageHeader("Assessment", "Your result", "", passed ? "Passed" : "Keep practising")}
      <div class="quiz-panel panel game-result">
        <div class="result-badge">${passed ? "🌟" : "💪"}</div>
        <h2>${correct} of ${qCount} correct · ${pct}%</h2>
        <p class="slide-lead">${passed ? "Wonderful — you know your letters!" : "Great effort! Review the letters and try again."}</p>
        <div class="lslide-actions"><button class="big-btn play" id="quiz-again" type="button">🔁 <span>Try again</span></button></div>
      </div>`;
    C.$("#quiz-again").addEventListener("click", renderAssessment);
    C.emitProgress({ type: "checkpoint.result", unit: C.PROGRESS_UNIT, section: "assessment", score: correct, total: qCount, passed });
    if (!C.progress.completed.includes("assessment")) C.complete("assessment", `Assessment done — ${pct}%`);
    if (passed) fireConfetti();
  };
  const renderQ = () => {
    if (q >= qCount) return renderResult();
    const target = quiz[q];
    const options = shuffle([target, ...shuffle(all.filter((l) => l.id !== target.id)).slice(0, 3)]);
    C.$("#app").innerHTML = `
      ${C.pageHeader("Assessment", "Show what you know", "Look at the letter and choose its name.", "Recorded recitation audio")}
      <div class="quiz-panel panel">
        <div class="game-top"><span>Question ${q + 1} of ${qCount}</span><span>${correct} ✓</span></div>
        <div class="quiz-glyph" dir="rtl" lang="ar">${C.escapeHtml(target.glyph)}</div>
        <div class="quiz-options">
          ${options.map((o) => `<button class="quiz-opt" type="button" data-opt="${o.id}">${C.escapeHtml(o.name)}</button>`).join("")}
        </div>
      </div>`;
    let answered = false;
    C.$$("[data-opt]").forEach((b) => b.addEventListener("click", () => {
      if (answered) return; answered = true;
      if (b.dataset.opt === target.id) { correct += 1; b.classList.add("correct"); }
      else { b.classList.add("wrong"); C.$$(`[data-opt="${target.id}"]`).forEach((t) => t.classList.add("correct")); }
      setTimeout(() => { q += 1; renderQ(); }, 900);
    }));
  };
  renderQ();
}

// ---- shell config -----------------------------------------------------------
const config = {
  subjectKey: "prequran",
  subjectLabel: "PreQuraan",
  param: "level",
  mediaSubject: "prequran",
  ttsPurpose: "qrn_prequran",
  courseKey: (stage) => `qrn-prequran-l${pad2(stage)}`,
  keys: (stage, unit) => ({ progress: `qrn-prequran-l${pad2(stage)}-u${unit}` }),
  progressDefaults: { completed: [], lettersVisited: [] },
  gradeDefaults: { completed: [] },
  defaultUnit: () => 1,
  // Unit sections: Learn → Review → Practice → Games → Assessment.
  // (learn = the letter board + per-letter carousel; review = letters in words;
  //  practice = the repetition player; games/assessment = recognition play + check.)
  sections: [
    ["learn", "graduation-cap", "Learn"],
    ["review", "repeat", "Review"],
    ["practice", "target", "Practice"],
    ["games", "gamepad-2", "Games"],
    ["assessment", "clipboard-check", "Assessment"],
  ],
  nonCountable: [],
  renderers: {
    overview: renderHub, // the activity hub IS the navigation (full-screen page)
    learn: renderLearn,
    review: renderReview,
    practice: renderPractice,
    games: renderGames,
    assessment: renderAssessment,
  },
  async load(ctx) {
    const fetchJson = async (file) => {
      const url = new URL(file, ctx.dataRootUrl);
      url.searchParams.set("r", RELEASE); // release-stamped: matching content per JS release
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${file} (${response.status}).`);
      return response.json();
    };
    const manifest = await fetchJson("course-manifest.json");
    const entry = manifest.units.find((u) => u.number === ctx.unitNumber) || manifest.units[0];
    const course = await fetchJson(entry.data);
    return { manifest, course };
  },
  bind(ctx) { C = ctx; },
  onBeforeRender() {
    // Tear down the board starfield's animation loop whenever we leave the
    // Letters board (to any section or into a letter detail) — prevents a
    // stray requestAnimationFrame leak. renderLetters restarts it if we stay.
    if (boardAmbientStop) { boardAmbientStop(); boardAmbientStop = null; }
    // Cancel any running repetition loop (bumping the token stops it) — this
    // also halts a Meet-the-letters auto-walk.
    practiceToken += 1;
    boardWalking = false;
  },
  onAfterRender() {
    // Hub = its own full screen (topbar hidden); sections get a floating Menu
    // button back to it. Runs after every render so the two never drift.
    syncHubChrome();
  },
  onNavigate() {
    // Sidebar nav (any section, incl. Letters) exits an open letter back to the
    // board — board→detail uses renderRoute directly and is unaffected.
    selectedLetterId = null;
    // Clicking "Learn" always lands on step 1 ("Meet the letters") with the full
    // alphabet; Deep dive is reached by the next arrow, never by the sidebar.
    learnStep = "meet";
    boardFilter = "all";
    stopClip();
  },
  async onReady(ctx) {
    // Overlay the Quraan-scoped headmaster cadence (best-effort, non-blocking):
    // it mutates ctx.course.practice in place, so practiceConfig() picks it up
    // when the learner reaches the Practice section (they land on Learn first).
    applyPublishedCadence(ctx);
    // No forced route: an empty hash leaves the shell on "overview", which is
    // now the activity hub — the child chooses where to go from there.
    document.title = `Quraan Academy · PreQuraan · ${ctx.course.title}`;
    const label = ctx.$("#course-label");
    if (label) label.textContent = `Quraan Academy · PreQuraan · ${ctx.manifest.stage.label}`;
    const unitTitle = ctx.$("#unit-title");
    if (unitTitle) unitTitle.textContent = `Unit ${ctx.course.unit} · ${ctx.course.title}`;
    const options = ctx.manifest.units.map((u) =>
      `<option value="${u.number}" ${u.number === ctx.unitNumber ? "selected" : ""} ${u.implementationStatus === "planned" ? "disabled" : ""}>Unit ${u.number} · ${u.title}${u.implementationStatus === "planned" ? " (coming soon)" : ""}</option>`).join("");
    for (const id of ["#unit-select", "#top-unit-select"]) {
      const select = ctx.$(id);
      if (!select) continue;
      select.innerHTML = options;
      select.addEventListener("change", () => { location.href = `?level=${ctx.stageNumber}&unit=${select.value}#learn`; });
    }
    const stageSelect = ctx.$("#stage-select");
    if (stageSelect) { stageSelect.innerHTML = `<option value="0" selected>${ctx.manifest.stage.label}</option>`; stageSelect.disabled = true; }
  },
};

createCourseApp(config);
