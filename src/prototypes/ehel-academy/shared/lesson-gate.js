// Lesson welcome gate — adopted from PreQuraan's fs-gate
// (src/prototypes/quraan-academy/prequran/prequran.js :: syncFullscreenGate).
//
// A page can never START fullscreen: the browser demands a gesture first, and
// fullscreen does not survive navigation. Rather than let that gesture be an
// accidental tap somewhere in the lesson, we open with a one-tap welcome gate —
// tap it and the lesson goes fullscreen with the hub already behind it.
//
// Ported behaviours, not just the styling:
//   * shows only on the hub/overview route, never inside a section
//   * skipped when already chromeless (real fullscreen, or an installed PWA)
//   * skipped where requestFullscreen does not exist (e.g. iPhone Safari), so a
//     child is never gated for nothing
//   * dismiss-once, so it does not reappear on every route change
//   * Escape is suppressed and Keyboard Lock taken WHILE fullscreen
//
// NOT ported: PreQuraan's primed first gesture, which armed a capture-phase
// pointerdown on the document so that ANY click re-entered fullscreen. That
// suits a single-screen lesson; it does not suit a course shell whose topbar
// carries a grade picker and a unit picker. Here it meant opening the unit
// dropdown threw the learner into fullscreen — and, once the shell coupled
// fullscreen to its focus-mode layout, hid the very picker being opened. In
// this app fullscreen has exactly two deliberate entry points: the gate's own
// tile, and a left-nav route click (course-app.js :: enterFocusMode). Re-entry
// after Escape is therefore one nav click, not one stray tap.
//
// Shared by every subject. Unrecognised keys fall back to English (see
// mountLessonGate below), which is why computing and intensive-english
// showed the English tile until their entries were added here.

const SUBJECTS = {
  eng: { label: "English", mark: "A", tint: "#2a6cb0" },
  english: { label: "English", mark: "A", tint: "#2a6cb0" },
  math: { label: "Mathematics", mark: "+", tint: "#6d4bd8" },
  mathematics: { label: "Mathematics", mark: "+", tint: "#6d4bd8" },
  sci: { label: "Science", mark: "S", tint: "#e05a47" },
  science: { label: "Science", mark: "S", tint: "#e05a47" },
  computing: { label: "Computing", mark: "C", tint: "#0f766e" },
  "global-perspectives": { label: "Global Perspectives", mark: "G", tint: "#6d4aff" },
  "intensive-english": { label: "Intensive English", mark: "A", tint: "#2a6cb0" },
};

const CSS = `
.lg-gate{position:fixed;inset:0;z-index:2147483500;cursor:pointer;display:grid;place-items:center;
  padding:24px;text-align:center;color:#fff;
  background:radial-gradient(1200px 620px at 50% -10%,#24507a 0%,#17324d 55%,#102436 100%)}
.lg-gate-inner{display:flex;flex-direction:column;align-items:center;gap:14px;
  animation:lgTileIn .5s cubic-bezier(.2,.9,.3,1.3) backwards}
.lg-gate-mark{display:grid;place-items:center;width:88px;height:88px;border-radius:26px;
  font-size:48px;font-weight:900;box-shadow:0 14px 34px #0b1c2c66}
.lg-gate h2{margin:4px 0 0;font-size:clamp(28px,5vw,44px);font-weight:900;line-height:1.1}
.lg-gate p{margin:0;font-size:15.5px;color:#cfe0f0}
.lg-gate-btn{margin-top:8px;display:inline-flex;align-items:center;gap:9px;border-radius:999px;
  padding:14px 34px;background:#f2c14e;color:#17324d;font-size:19px;font-weight:900;
  box-shadow:0 12px 30px #f2c14e4d}
.lg-gate:hover .lg-gate-btn{background:#ffd469}
.lg-gate-plan{margin-top:2px;color:#cfe0f0;font-size:14.5px;font-weight:700;
  text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.lg-gate-plan:hover,.lg-gate-plan:focus-visible{color:#fff}
@keyframes lgTileIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.lg-gate-inner{animation:none}}
.lg-gate-diag{position:absolute;left:0;right:0;bottom:9px;font-size:11px;line-height:1.4;
  color:#cfe0f0;opacity:.45;pointer-events:none;user-select:text}`;

// Version stamp shown in the diagnostics line. Bump when this file's mount
// behaviour changes: a screenshot of the gate then says which code produced
// it. This exists because three fixes here "changed nothing" for a tester
// whose dev server was silently serving an out-of-date worktree copy — the
// only visible artefact was the gate itself, and it carried no provenance.
const LG_VERSION = "lg4";

// "Already started" must survive the app's own reload (it reloads itself once
// after boot) and any later fullscreen exits — otherwise ESC mid-lesson lands
// the learner back on the entry gate instead of the leave warning. Persisted
// per LAUNCH (keyed by the launch token, like the countdown pins).
const lgSid = (() => {
  try {
    const p = new URLSearchParams(location.search);
    const fromToken = (p.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "").slice(-24);
    // Sticky launch identity: if the app's self-reload alters the URL and the
    // token disappears, fall back to the sid stored at launch — otherwise the
    // dismissed flag stops matching and the gate resurrects mid-lesson.
    if (fromToken) { sessionStorage.setItem("seb-sid", fromToken); return fromToken; }
    return sessionStorage.getItem("seb-sid") || "anon";
  } catch { return "anon"; }
})();
const LG_KEY = "lg-dismissed:" + lgSid;
let dismissed = (() => { try { return sessionStorage.getItem(LG_KEY) === "1"; } catch { return false; } })();
const setDismissed = () => { dismissed = true; try { sessionStorage.setItem(LG_KEY, "1"); } catch {} };
let escBound = false;

const isChromeless = () => !!document.fullscreenElement
  || (window.matchMedia && (matchMedia("(display-mode: fullscreen)").matches
    || matchMedia("(display-mode: standalone)").matches));

const onHubRoute = () => {
  const r = (location.hash || "").replace(/^#/, "");
  return r === "" || r === "overview";
};

function goFullscreen() {
  if (document.fullscreenElement) return;
  const el = document.documentElement;
  if (typeof el.requestFullscreen !== "function") return;
  try {
    const r = el.requestFullscreen();
    if (r && typeof r.catch === "function") r.catch(() => {});
  } catch { /* refused — the lesson still works */ }
}

// Escape suppression + Keyboard Lock. Capture phase and stopImmediatePropagation
// so this beats any listener the lesson itself registers. Keyboard Lock only
// works WHILE fullscreen, so it is taken and released on fullscreenchange.
function bindEscapeLock() {
  if (escBound) return;
  escBound = true;
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.fullscreenElement) return;
    event.stopImmediatePropagation();
    event.preventDefault();
  }, true);
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      try { navigator.keyboard?.lock?.(["Escape"])?.catch?.(() => {}); } catch { /* unsupported */ }
    } else {
      try { navigator.keyboard?.unlock?.(); } catch { /* unsupported */ }
    }
  });
}

export function mountLessonGate(opts = {}) {
  if (typeof document === "undefined") return;

  const keyRaw = String(opts.subjectKey || "").toLowerCase();
  const subject = SUBJECTS[keyRaw] || SUBJECTS.eng;
  const stage = Number(opts.stage || 0);
  const title = opts.title || (stage > 0 ? `Grade ${stage} ${subject.label}` : subject.label);
  // Provenance for the diagnostics line: which code version, which key was
  // asked for (∅ + English fallback is itself a finding), who called, where.
  const diag = `${LG_VERSION} · key=${keyRaw || "∅"}→${subject.label}`
    + ` · via=${opts.via || "shell"} · ${location.pathname}`;
  try { console.info(`[lesson-gate] ${diag}`); } catch { /* consoleless embedder */ }

  bindEscapeLock();

  if (!document.getElementById("lg-gate-style")) {
    const style = document.createElement("style");
    style.id = "lg-gate-style";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const sync = () => {
    const need = onHubRoute() && !dismissed && !isChromeless()
      && typeof document.documentElement.requestFullscreen === "function";
    let gate = document.getElementById("lg-gate");
    if (!need) { if (gate) gate.remove(); return; }
    if (gate) return;

    gate = document.createElement("div");
    gate.id = "lg-gate";
    gate.className = "lg-gate";
    gate.setAttribute("role", "button");
    gate.setAttribute("tabindex", "0");
    gate.setAttribute("aria-label", `Start ${title}`);
    const mark = `<span class="lg-gate-mark" style="background:${subject.tint}" aria-hidden="true">${subject.mark}</span>`;
    gate.innerHTML = `<div class="lg-gate-inner">${mark}`
      + `<h2></h2><p>Tap to begin — the lesson fills the whole screen.</p>`
      + `<span class="lg-gate-btn">▶ Start</span>`
      + `<a class="lg-gate-plan" href="#unit-plan">View Unit plan</a></div>`
      + `<small class="lg-gate-diag" aria-hidden="true"></small>`;
    // h2, not h1: the page behind the gate already carries the unit's h1, and
    // both are exposed at once while the gate is up — two h1s on one page. The
    // gate is role="button" with aria-label="Start <title>", so this heading is
    // only a visual echo of a name the control already announces.
    gate.querySelector("h2").textContent = title; // never inject the title as HTML
    // textContent, same reason; aria-hidden because the console already carries
    // this line and screen readers gain nothing from a build stamp.
    gate.querySelector(".lg-gate-diag").textContent = diag;

    // A peek at the plan, not a start: stays short of goFullscreen() and
    // setDismissed(), so the gate is exactly where it was when the learner
    // comes back to the hub route. Stopped from bubbling to the gate's own
    // click/keydown handlers below, which would otherwise treat this as the
    // Start tap (fullscreen + dismissed) on top of the link's own navigation.
    //
    // Routed through an event rather than left as a bare href: this module
    // has no access to the shell's own navigate(), and a plain hash change
    // only reaches course-app.js's "pasted link" hashchange handler, which
    // (correctly, for a real pasted link) skips enterFocusMode() and
    // closeSectionsSheet() — so the sidebar/board stayed on screen beside the
    // plan instead of the plan replacing it. navigate() does both. Mirrors
    // "lesson-gate:start" below: the shell owns the actual navigation, this
    // module just asks for it. The catch is a plain hash change same as
    // before, for an embedder with no CustomEvent — something happens either
    // way, never nothing.
    const planLink = gate.querySelector(".lg-gate-plan");
    const viewPlan = (event) => {
      event.stopPropagation();
      event.preventDefault();
      try { document.dispatchEvent(new CustomEvent("lesson-gate:view-plan")); }
      catch { location.hash = "unit-plan"; }
    };
    planLink.addEventListener("click", viewPlan);
    planLink.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") viewPlan(event);
    });

    const open = () => {
      setDismissed();
      goFullscreen(); // a real gesture, so the browser grants it
      gate.remove();
      // Announced as a DOM event rather than an opts callback, deliberately:
      // this module mounts TWICE on every page (self-mount at import, then the
      // shell's explicit call), the first mount wins the element and its click
      // handler, so an option passed by the second mount would never fire. An
      // event on document reaches every listener whichever mount built the
      // gate. course-app.js uses it to open the Grades/Stages 1-4 sticker
      // board on Start (owner, 2026-09-01).
      try { document.dispatchEvent(new CustomEvent("lesson-gate:start")); } catch { /* embedder without CustomEvent */ }
    };
    gate.addEventListener("click", open);
    gate.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    document.body.appendChild(gate);
    try { gate.focus({ preventScroll: true }); } catch { gate.focus(); }
  };

  sync();
  window.addEventListener("hashchange", sync);
  // Deliberately NOT bound to fullscreenchange: leaving fullscreen mid-lesson
  // is the leave-warning's moment, and re-showing the gate there swallowed it.
  // (Privacy modes — Brave shields — give CDN pages ephemeral storage, so the
  // dismissed flag cannot be trusted to survive; the gate must simply never
  // come back on fullscreen exit.)
}

// --- self-mount ------------------------------------------------------------
// Importing this module is enough (mirrors seb-session.js). Subject and stage
// are derived from the URL — /app/{subject}/ deployed, /ehel-academy/{subject}/
// in local dev — so the gate does not depend on any caller passing config.
// mountLessonGate() stays exported for explicit use; the dismissed/style
// guards make a second call a no-op.
//
// Self-mount runs at import time, BEFORE the shell's own explicit
// mountLessonGate(config) call — and a mounted gate makes that later call a
// no-op. So when the URL does not resolve to a subject this function must
// mount nothing at all: guessing (the old English fallback) planted a
// wrong-subject gate that the correctly-configured call could never replace.
// That is exactly how local dev pages — whose paths had no /app/ segment to
// match — showed an English tile on every course.
function selfMount() {
  // [a-z-] not [a-z]: global-perspectives and intensive-english are hyphenated
  // slugs, and a class without the hyphen fails to match them at all.
  const seg = (location.pathname.match(/\/(?:app|ehel-academy)\/([a-z-]+)\//i) || [])[1] || "";
  if (!SUBJECTS[seg.toLowerCase()]) {
    // Unknown subject: mount nothing and leave the gate to the shell's
    // explicit call — but say so, or this path is invisible when debugging.
    try { console.info(`[lesson-gate] ${LG_VERSION} · self-mount skipped (key=${seg || "∅"}) · ${location.pathname}`); } catch { /* consoleless embedder */ }
    return;
  }
  const p = new URLSearchParams(location.search);
  const stage = Number(p.get("grade") || p.get("stage") || 0);
  mountLessonGate({ subjectKey: seg, stage, via: "url" });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", selfMount, { once: true });
  } else {
    selfMount();
  }
}
