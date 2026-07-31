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
//   * a gesture stays primed, so re-entry after Esc is a single tap
//   * Escape is suppressed and Keyboard Lock taken WHILE fullscreen
//
// Shared by English, Mathematics and Science.

const SUBJECTS = {
  eng: { label: "English", mark: "A", tint: "#2a6cb0" },
  english: { label: "English", mark: "A", tint: "#2a6cb0" },
  math: { label: "Mathematics", mark: "+", tint: "#6d4bd8" },
  mathematics: { label: "Mathematics", mark: "+", tint: "#6d4bd8" },
  sci: { label: "Science", mark: "S", tint: "#e05a47" },
  science: { label: "Science", mark: "S", tint: "#e05a47" },
};

const CSS = `
.lg-gate{position:fixed;inset:0;z-index:2147483500;cursor:pointer;display:grid;place-items:center;
  padding:24px;text-align:center;color:#fff;
  background:radial-gradient(1200px 620px at 50% -10%,#24507a 0%,#17324d 55%,#102436 100%)}
.lg-gate-inner{display:flex;flex-direction:column;align-items:center;gap:14px;
  animation:lgTileIn .5s cubic-bezier(.2,.9,.3,1.3) backwards}
.lg-gate-mark{display:grid;place-items:center;width:88px;height:88px;border-radius:26px;
  font-size:48px;font-weight:900;box-shadow:0 14px 34px #0b1c2c66}
.lg-gate h1{margin:4px 0 0;font-size:clamp(28px,5vw,44px);font-weight:900;line-height:1.1}
.lg-gate p{margin:0;font-size:15.5px;color:#cfe0f0}
.lg-gate-btn{margin-top:8px;display:inline-flex;align-items:center;gap:9px;border-radius:999px;
  padding:14px 34px;background:#f2c14e;color:#17324d;font-size:19px;font-weight:900;
  box-shadow:0 12px 30px #f2c14e4d}
.lg-gate:hover .lg-gate-btn{background:#ffd469}
@keyframes lgTileIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.lg-gate-inner{animation:none}}`;

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
let armed = false;
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

// Keep a gesture primed so the lesson is always one tap from real fullscreen —
// covers first load and re-entry after the child presses Esc.
function armFullscreenOnFirstGesture() {
  if (armed || document.fullscreenElement) return;
  armed = true;
  const enter = () => {
    document.removeEventListener("pointerdown", enter, true);
    document.removeEventListener("keydown", enter, true);
    armed = false;
    goFullscreen();
  };
  document.addEventListener("pointerdown", enter, true);
  document.addEventListener("keydown", enter, true);
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
      armFullscreenOnFirstGesture();
    }
  });
}

export function mountLessonGate(opts = {}) {
  if (typeof document === "undefined") return;

  const subject = SUBJECTS[String(opts.subjectKey || "").toLowerCase()] || SUBJECTS.eng;
  const stage = Number(opts.stage || 0);
  const title = opts.title || (stage > 0 ? `Grade ${stage} ${subject.label}` : subject.label);

  bindEscapeLock();
  armFullscreenOnFirstGesture();

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
      + `<h1></h1><p>Tap to begin — the lesson fills the whole screen.</p>`
      + `<span class="lg-gate-btn">▶ Start</span></div>`;
    gate.querySelector("h1").textContent = title; // never inject the title as HTML

    const open = () => {
      setDismissed();
      goFullscreen(); // a real gesture, so the browser grants it
      gate.remove();
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
// are derived from the URL — /app/{subject}/ and ?grade= / ?stage= — so the
// gate does not depend on any caller passing config. mountLessonGate() stays
// exported for explicit use; the dismissed/style guards make a second call a
// no-op.
function selfMount() {
  const seg = (location.pathname.match(/\/app\/([a-z]+)\//i) || [])[1] || "";
  const p = new URLSearchParams(location.search);
  const stage = Number(p.get("grade") || p.get("stage") || 0);
  mountLessonGate({ subjectKey: seg, stage });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", selfMount, { once: true });
  } else {
    selfMount();
  }
}
