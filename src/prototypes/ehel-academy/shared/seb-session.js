// SEB lesson session bar — countdown to release + "Finish lesson" control.
//
// Driven entirely by launch-URL params that seb_config.php appends:
//   exitUrl    release endpoint; the SERVER decides whether release is earned
//   learnAfter seconds of learning that earn release (what we count down to)
//   exitAfter  hard cap in seconds; we navigate to exitUrl automatically
//   lockOn     "1" when the learner genuinely cannot quit SEB themselves
//
// The countdown is a DISPLAY aid only. The server is the authority: pressing
// Finish always asks seb_release.php, which may say "keep going". The cap
// navigation is the important part — it guarantees a locked learner is let out
// even if nobody presses anything.
//
// Self-mounting: importing this module is enough. Renders nothing at all when
// exitUrl is absent, so ordinary (non-SEB) launches are untouched.

const pad = (n) => String(n).padStart(2, "0");

// --- moving inside the course is not leaving ---------------------------------
// Every page of a course app is a separate DOCUMENT: the unit picker, "Go on to
// Unit N", the grade switch and the placement exam all assign location.href to
// the same index.html with a different ?unit=. beforeunload cannot see where a
// navigation is going, so all of those looked exactly like a learner walking
// out — the browser raised its "Leave site?" dialog on every unit change, and
// focus mode reported the same navigation to the teacher as leaving the lesson.
// A learner who has to dismiss that dialog to change unit learns to dismiss it,
// which is the one thing the warning cannot afford.
//
// So watch for the navigation BEFORE it starts and note when it stays inside
// this app's own directory. The Navigation API is the only way to see a
// scripted `location.href =` (window.location is unforgeable — it cannot be
// wrapped); where it is missing, link clicks are still covered and a <select>
// that navigates is not. That is a stale dialog on an old browser, not a
// learner trapped.
let courseNavAt = 0;
let courseNavWatched = false;

function staysInCourse(href) {
  try {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return false;
    // The app's own directory. A per-grade stub (…/english/grade-1/index.html)
    // redirects up into it, so its own segment must not narrow the root.
    const root = location.pathname.replace(/[^/]*$/, "").replace(/(?:grade|stage|level)-\d+\/$/, "");
    if (!url.pathname.startsWith(root)) return false;
    // A hash-only move never unloads the page, so noting it would only blind
    // the warning for the next few seconds.
    return url.pathname !== location.pathname || url.search !== location.search;
  } catch { return false; }
}

function watchCourseNavigation() {
  if (courseNavWatched) return;
  courseNavWatched = true;
  const mark = () => { courseNavAt = Date.now(); };
  const nav = window.navigation;
  if (nav && typeof nav.addEventListener === "function") {
    nav.addEventListener("navigate", (event) => {
      const dest = event && event.destination && event.destination.url;
      if (dest && staysInCourse(dest)) mark();
    });
  }
  document.addEventListener("click", (event) => {
    const link = event.target && event.target.closest && event.target.closest("a[href]");
    if (link && staysInCourse(link.href)) mark();
  }, true);
}

// A navigation that never happens (a cancelled link, a select set back to its
// own value) must expire rather than disarm the warning for the rest of the
// session.
const movingInsideCourse = () => Date.now() - courseNavAt < 3000;

// --- the app dropping fullscreen is not the learner leaving ------------------
// Exactly the distinction movingInsideCourse() draws for navigation, for the
// other signal this file reads. The course app leaves fullscreen deliberately
// when the learner asks for their board — the Back arrow, the Menu pill, the
// return out of the dialog below — and a fullscreen exit is indistinguishable
// from ESC here, so all three were read as walking out: the board came up under
// "You're not finished yet!", and the teacher was told the child had left the
// lesson. course-app.js announces its own exits (exitFocusMode's `appInitiated`)
// and never announces the Escape key, which is the one that really is the
// learner leaving.
//
// Time-boxed for the same reason as above: an announcement whose fullscreenchange
// never arrives must expire rather than mute the warning for the rest of the
// session.
let appLeftFullscreenAt = 0;
if (typeof document !== "undefined") {
  document.addEventListener("ehel:app-fullscreen-exit", () => { appLeftFullscreenAt = Date.now(); });
}
const appLeftFullscreen = () => Date.now() - appLeftFullscreenAt < 3000;

function formatLeft(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

export function mountSebSession() {
  if (typeof document === "undefined" || document.getElementById("seb-session-bar")) return;

  const p = new URLSearchParams(location.search);
  const exitUrl = (p.get("exitUrl") || "").trim();
  const hasExit = /^https?:\/\//i.test(exitUrl);
  const focusMode = p.get("focusMode") === "1";
  // Mount for EITHER an exit route or focus mode. Requiring exitUrl alone used
  // to silently disable focus mode entirely, because the focus launch path does
  // not go through seb_config.php and so carries no exit URL.
  if (!hasExit && !focusMode) return; // ordinary launch — render nothing

  const locked = p.get("lockOn") === "1";
  const learnAfter = Math.max(0, Number(p.get("learnAfter") || 0));
  const exitAfter = Math.max(0, Number(p.get("exitAfter") || 0));
  // A placement exam is not a lesson, and the copy has to say so: "2:00:00 of
  // learning left" is the wrong thing to tell a child sitting an exam. The exam
  // carries no learning target at all (learnAfter=0), so the only clock it
  // shows is the hard cap.
  const isExam = p.get("sessionKind") === "exam";

  // Survive reloads inside a lesson: pin the deadlines once per LAUNCH rather
  // than restarting the clock every time the page reloads. The pins are keyed
  // to the launch token — globally-keyed pins persisted in the tab across
  // launches, so reopening a lesson hours later read a stale expired cap and
  // instantly navigated to the release endpoint ("opens and closes").
  // Sticky launch identity (mirrors lesson-gate): a self-reload that loses the
  // token must not orphan the pins, or the clock restarts / flags mismatch.
  const sid = (() => {
    try {
      const fromToken = (p.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "").slice(-24);
      if (fromToken) { sessionStorage.setItem("seb-sid", fromToken); return fromToken; }
      return sessionStorage.getItem("seb-sid") || "anon";
    } catch { return "anon"; }
  })();
  try { sessionStorage.removeItem("seb-release-at"); sessionStorage.removeItem("seb-cap-at"); } catch {}
  const pin = (key, seconds) => {
    if (!seconds) return 0;
    const k = key + ":" + sid;
    let at = Number(sessionStorage.getItem(k) || 0);
    if (!at) { at = Date.now() + seconds * 1000; try { sessionStorage.setItem(k, String(at)); } catch {} }
    return at;
  };
  const releaseAt = pin("seb-release-at", learnAfter);
  const capAt = pin("seb-cap-at", exitAfter);

  const bar = document.createElement("div");
  bar.id = "seb-session-bar";
  bar.setAttribute("role", "status");
  bar.style.cssText = [
    "position:fixed", "right:16px", "bottom:16px", "z-index:2147483000",
    "display:flex", "align-items:center", "gap:12px",
    "padding:10px 14px", "border-radius:999px",
    "background:#17324a", "color:#fff",
    "font:500 14px/1.2 system-ui,-apple-system,'Segoe UI',Arial,sans-serif",
    "box-shadow:0 6px 20px rgba(0,0,0,.25)",
  ].join(";");

  const label = document.createElement("span");
  bar.appendChild(label);

  // Only offer Finish when there is somewhere to finish TO.
  let btn = null;
  if (hasExit) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = isExam ? "Finish exam" : "Finish lesson";
    btn.style.cssText = [
      "border:0", "cursor:pointer", "padding:7px 14px", "border-radius:999px",
      "background:#f0f4f9", "color:#17324a", "font:600 14px/1 inherit",
    ].join(";");
    btn.addEventListener("click", () => { location.href = exitUrl; });
    bar.appendChild(btn);
  }
  document.body.appendChild(bar);

  let released = false;
  const tick = () => {
    const now = Date.now();

    // Hard cap: let them out regardless of anything else.
    if (hasExit && capAt && now >= capAt && !released) {
      released = true;
      location.href = exitUrl;
      return;
    }

    // The countdown shows whenever there IS a learning target — it tells the
    // learner how much work is left, which is useful whether or not the exit
    // is locked. Locking only changes whether Finish is refused before time.
    if (!releaseAt) {
      // An exam shows the cap counting down instead — it is the only deadline
      // it has, and a learner sitting an exam should be able to see the time.
      if (isExam && capAt) {
        label.textContent = `${formatLeft((capAt - now) / 1000)} left`;
        return;
      }
      label.textContent = isExam ? "Exam in progress" : "Lesson in progress";
      return;
    }
    const left = (releaseAt - now) / 1000;
    if (left > 0) {
      label.textContent = `${formatLeft(left)} of learning left`;
      if (btn) btn.style.opacity = locked ? "0.75" : "1";
    } else {
      label.textContent = locked ? "You can finish now" : "Learning time complete";
      if (btn) { btn.style.opacity = "1"; btn.style.background = "#fff"; }
    }
  };

  tick();
  setInterval(tick, 1000);

  // --- leaving early: warn until the learning target is met ----------------
  // ESC (fullscreen exit) gets our own message; closing the tab can only get
  // the browser's NATIVE "Leave site?" dialog — custom text there has been
  // impossible in every major browser for years, so we don't pretend otherwise.
  let leaveArmed = !!releaseAt;
  const disarmLeave = () => { leaveArmed = false; document.getElementById("seb-leave-warn")?.remove(); };
  // Finish/cap navigation must not trigger the leave dialog.
  if (btn) btn.addEventListener("click", disarmLeave);
  const timeDone = () => releaseAt && Date.now() >= releaseAt;
  watchCourseNavigation();

  window.addEventListener("beforeunload", (e) => {
    if (movingInsideCourse()) return; // another page of this same course
    // The hard cap navigating to the release endpoint is the session ENDING,
    // and a dialog there would hold a locked learner in past their own cap.
    if (released) return;
    if (leaveArmed && !timeDone()) { e.preventDefault(); e.returnValue = ""; }
  });

  const showLeaveWarning = () => {
    if (document.getElementById("seb-leave-warn")) return;
    // This warning only fires on a real fullscreen EXIT — and the only way
    // into fullscreen is tapping the gate's Start. So reaching here proves the
    // lesson was started, no stored flag needed (privacy modes like Brave
    // shields give CDN pages ephemeral storage, so flags cannot be trusted).
    // Any gate still standing is a resurrected one: remove it, never yield.
    document.getElementById("lg-gate")?.remove();
    const veil = document.createElement("div");
    veil.id = "seb-leave-warn";
    veil.style.cssText = "position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;background:rgba(11,26,42,.86);font:500 15px/1.5 system-ui,-apple-system,'Segoe UI',Arial,sans-serif";
    const card = document.createElement("div");
    card.style.cssText = "background:#fff;color:#17324a;border-radius:16px;padding:26px 28px;max-width:420px;text-align:center;display:flex;flex-direction:column;gap:14px";
    const h = document.createElement("div");
    h.textContent = "You're not finished yet!";
    h.style.cssText = "font-size:21px;font-weight:600";
    const m = document.createElement("div");
    m.style.color = "#5a6b7d";
    const mins = Math.max(1, Math.ceil((releaseAt - Date.now()) / 60000));
    m.textContent = "Please finish your lesson and homework before leaving. About " + mins + " minute" + (mins === 1 ? "" : "s") + " of learning left.";
    const stay = document.createElement("button");
    stay.type = "button";
    stay.textContent = "Keep learning";
    stay.style.cssText = "border:0;cursor:pointer;padding:13px 24px;border-radius:999px;background:#1f5fa8;color:#fff;font:600 16px/1 inherit";
    stay.addEventListener("click", () => {
      veil.remove();
      const el = document.documentElement;
      if (!document.fullscreenElement && typeof el.requestFullscreen === "function") {
        try { const r = el.requestFullscreen(); if (r && r.catch) r.catch(() => {}); } catch {}
      }
    });
    card.appendChild(h); card.appendChild(m); card.appendChild(stay);
    const minor = "border:0;cursor:pointer;padding:10px 18px;border-radius:999px;background:#eef3f8;color:#17324a;font:600 14px/1 inherit";
    // The dashboard lives on the consumer host; derive it from the release
    // endpoint's origin rather than hardcoding a hostname here.
    let dashUrl = "";
    if (hasExit) {
      try { dashUrl = new URL(exitUrl).origin + "/local/hubredirect/student_dashboard.php"; } catch {}
    }
    // Can the course app take them back to its own navigation instead of out?
    // Asked as a PROBE now, so the confirm button below can be honest about
    // where it goes; the same event, without `probe`, performs the move. The
    // app answers only when its board can actually open (course-app.js ::
    // boardCanOpen), so a levelled course, the tutoring category and a locked
    // unit all fall through to the behaviour this dialog always had.
    const askApp = (probe) => {
      try {
        const detail = { probe: !!probe, handled: false };
        document.dispatchEvent(new CustomEvent("ehel:leave-to-board", { detail }));
        return detail.handled === true;
      } catch { return false; } // an app that cannot answer is one we leave
    };
    const backToBoard = askApp(true);
    // "I'm leaving" — asks for a short reason first and saves it
    // (fire-and-forget: a failed save must never trap a child on the form).
    //
    // Where it goes then depends on what is behind the dialog. On a CONTENT
    // page it goes back to the unit board and stays in the app (owner,
    // 2026-09-01): a child who has stopped one lesson has not necessarily
    // finished for the day, and putting them out of the course to pick another
    // one is a longer way round than showing them the board they came from.
    // Otherwise, unchanged — the courses page, or simply closing the dialog on
    // a launch that carries no exit route. Progress and the session clock
    // survive either way.
    const later = document.createElement("button");
    later.type = "button";
    later.textContent = "I'm leaving";
    later.style.cssText = minor;
    later.addEventListener("click", () => {
      later.style.display = "none";
      stay.style.display = "none";
      const fin0 = card.querySelector("[data-fin]");
      if (fin0) fin0.style.display = "none";
      h.textContent = "Before you go…";
      m.textContent = "Please tell your teacher why you are leaving.";
      const box = document.createElement("textarea");
      box.rows = 3;
      box.placeholder = "Type your reason here";
      box.style.cssText = "width:100%;box-sizing:border-box;border:1px solid #cfd9e4;border-radius:10px;padding:10px 12px;font:inherit;resize:none";
      const go = document.createElement("button");
      go.type = "button";
      go.textContent = backToBoard ? "Send and go back" : "Send and leave";
      go.style.cssText = "border:0;cursor:pointer;padding:13px 24px;border-radius:999px;background:#1f5fa8;color:#fff;font:600 16px/1 inherit";
      go.addEventListener("click", () => {
        const endpoint = (p.get("focusEndpoint") || "").trim();
        const token = (p.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
        if (/^https?:\/\//i.test(endpoint) && token) {
          try {
            const minsLeft = releaseAt ? Math.max(0, Math.ceil((releaseAt - Date.now()) / 60000)) : 0;
            const body = JSON.stringify({ token, kind: "leaving",
              reason: String(box.value || "").slice(0, 500), minutesLeft: minsLeft });
            const blob = new Blob([body], { type: "text/plain" });
            if (!navigator.sendBeacon || !navigator.sendBeacon(endpoint, blob)) {
              fetch(endpoint, { method: "POST", body, keepalive: true, mode: "cors" }).catch(() => {});
            }
          } catch { /* leaving must never be blocked by the save */ }
        }
        // The reason is sent either way — it is the teacher's signal that this
        // learner stopped early, and that is as true of stopping a lesson as of
        // leaving the app.
        //
        // The app is asked AGAIN rather than trusted from the probe: the two
        // are a click apart, and a board that has become unopenable in between
        // must fall through to leaving rather than strand the learner on a
        // dialog that has just removed itself.
        if (backToBoard && askApp(false)) { veil.remove(); return; }
        // Disarmed only here, on the paths that actually LEAVE. Going back to
        // the board keeps the learner in the session, so the beforeunload guard
        // must stay armed — disarming for that case would silently drop the
        // tab-close warning for the rest of the afternoon. Doing it after the
        // question above rather than before it is what keeps the fall-through
        // from navigating with the guard still up, which the browser would
        // answer with its own "Leave site?" dialog.
        disarmLeave();
        if (dashUrl) { location.href = dashUrl; } else { veil.remove(); }
      });
      card.appendChild(box);
      card.appendChild(go);
      try { box.focus({ preventScroll: true }); } catch { box.focus(); }
    });
    card.appendChild(later);
    if (hasExit) {
      // "I'm done" — the SERVER decides. Released → courses page; not earned →
      // courses page too, with a "not finished yet" notice (back=1 path).
      const fin = document.createElement("button");
      fin.type = "button";
      fin.textContent = "I'm done";
      fin.dataset.fin = "1";
      fin.style.cssText = minor;
      // Explicit agreement before the claim goes to the server: the child
      // affirms completion in their own action, with an easy way back.
      fin.addEventListener("click", () => {
        stay.style.display = "none";
        later.style.display = "none";
        fin.style.display = "none";
        h.textContent = "Are you finished?";
        m.textContent = "I confirm that I have completed my lesson/homework.";
        const yes = document.createElement("button");
        yes.type = "button";
        yes.textContent = "I confirm";
        yes.style.cssText = "border:0;cursor:pointer;padding:13px 24px;border-radius:999px;background:#1f5fa8;color:#fff;font:600 16px/1 inherit";
        yes.addEventListener("click", () => { disarmLeave(); location.href = exitUrl; });
        const back = document.createElement("button");
        back.type = "button";
        back.textContent = "Go back";
        back.style.cssText = minor;
        back.addEventListener("click", () => { veil.remove(); });
        card.appendChild(yes);
        card.appendChild(back);
        try { yes.focus({ preventScroll: true }); } catch { yes.focus(); }
      });
      card.appendChild(fin);
    }
    veil.appendChild(card);
    document.body.appendChild(veil);
    try { stay.focus({ preventScroll: true }); } catch { stay.focus(); }
  };

  document.addEventListener("fullscreenchange", () => {
    // Loading the next page of the course drops fullscreen on the way out. That
    // is the navigation, not the learner pressing ESC.
    if (movingInsideCourse()) return;
    // Nor is the app showing the learner their own board — see above.
    if (appLeftFullscreen()) return;
    if (!document.fullscreenElement && leaveArmed && !timeDone()) showLeaveWarning();
  });

  mountFocusMode(p, bar);
}

/**
 * Focus mode — the install-free alternative to Safe Exam Browser, for devices
 * where SEB cannot be installed (there is no Android build) or a parent will
 * not install it. Asks for fullscreen and reports when the learner leaves the
 * lesson. This is DETERRENCE AND EVIDENCE, not prevention: a browser tab cannot
 * stop anyone switching away, and pretending otherwise would be dishonest.
 */
function mountFocusMode(p, bar) {
  if (p.get("focusMode") !== "1") return;
  const endpoint = (p.get("focusEndpoint") || "").trim();
  const token = (p.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
  if (!/^https?:\/\//i.test(endpoint) || !token) return;

  let breaks = 0;
  let lastSent = 0;

  const report = (kind) => {
    const now = Date.now();
    // A 'return' always goes through: the throttle exists because one blur
    // fires several events, but swallowing the return after a quick alt-tab
    // would leave the board saying "away" about a learner who is back.
    if (kind !== "return" && now - lastSent < 1500) return;
    lastSent = now;
    try {
      const body = JSON.stringify({ token, kind, count: breaks });
      // text/plain keeps this a simple request — no CORS preflight — and
      // sendBeacon still delivers while the page is being hidden.
      const blob = new Blob([body], { type: "text/plain" });
      if (!navigator.sendBeacon || !navigator.sendBeacon(endpoint, blob)) {
        fetch(endpoint, { method: "POST", body, keepalive: true, mode: "cors" }).catch(() => {});
      }
    } catch { /* monitoring must never break the lesson */ }
  };

  const note = document.createElement("span");
  note.style.cssText = "font-size:12px;opacity:.8";
  bar.insertBefore(note, bar.firstChild);
  const paint = () => { note.textContent = breaks ? `Left lesson ${breaks}×` : "Focus mode"; };
  paint();

  const broke = (kind) => { breaks += 1; paint(); report(kind); };

  // A page of this course being replaced by another page of this course hides
  // and blurs the document on its way out. Counting that as a break told the
  // teacher a learner had left the lesson every time they changed unit.
  document.addEventListener("visibilitychange", () => {
    if (movingInsideCourse()) return;
    if (document.visibilityState === "hidden") broke("hidden"); else report("return");
  });
  window.addEventListener("blur", () => { if (!movingInsideCourse()) broke("blur"); });
  // The counterpart 'return' for a blur: clicking another window never hides
  // the tab, so visibilitychange stays silent and only window focus says they
  // came back. Without this the board's away state could not clear after a
  // mere window switch.
  window.addEventListener("focus", () => { if (!movingInsideCourse()) report("return"); });
  // --- fullscreen: the default in focus mode -------------------------------
  // A browser will not grant fullscreen without a user gesture, so it cannot be
  // entered on load. Entering on the learner's FIRST interaction — a tap they
  // make anyway — is the closest honest equivalent to "default on", and we
  // re-enter on their next interaction if they leave.
  let fsAsked = 0;
  const goFullscreen = () => {
    if (document.fullscreenElement) return;
    const el = document.documentElement;
    if (typeof el.requestFullscreen !== "function") return; // e.g. iPhone Safari
    const now = Date.now();
    if (now - fsAsked < 3000) return; // never nag
    fsAsked = now;
    try {
      const r = el.requestFullscreen();
      if (r && typeof r.catch === "function") r.catch(() => {});
    } catch { /* blocked — the lesson still works */ }
  };
  // CAPTURE phase: the lesson app is highly interactive and any handler of its
  // own calling stopPropagation() would stop a bubble-phase listener from ever
  // seeing the tap — and fullscreen would silently never happen.
  ["pointerdown", "mousedown", "keydown", "touchstart"].forEach((ev) => {
    document.addEventListener(ev, goFullscreen, { capture: true, passive: true });
  });

  // No start overlay of our own: the lesson gate ("Grade 1 English · Start")
  // already provides the entry gesture, and its tap enters fullscreen via the
  // capture-phase listeners above. Two stacked start screens confused learners.

  const fs = document.createElement("button");
  fs.type = "button";
  fs.textContent = "Full screen";
  fs.style.cssText = "border:0;cursor:pointer;padding:7px 12px;border-radius:999px;background:#3d5a75;color:#fff;font:600 13px/1 inherit";
  fs.addEventListener("click", goFullscreen);
  bar.appendChild(fs);

  // Leaving fullscreen is a focus break; the button reappears so they can go
  // back, and the next tap restores it anyway.
  const paintFs = () => { fs.style.display = document.fullscreenElement ? "none" : ""; };
  document.addEventListener("fullscreenchange", () => {
    // A learner pressing Back to reach their own board has not left the lesson,
    // and reporting it as a focus break tells the teacher they did — the same
    // false report movingInsideCourse() exists to prevent for unit changes. The
    // button still repaints: fullscreen genuinely ended either way.
    if (!document.fullscreenElement && !appLeftFullscreen()) broke("fullscreen_exit");
    paintFs();
  });
  paintFs();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSebSession, { once: true });
  } else {
    mountSebSession();
  }
}
