// Exam lockdown gate for the Prerequisite unit (unit -1).
//
// The Prerequisite is a placement exam, not a lesson: it decides which stage a
// learner enters, so it is launched inside Safe Exam Browser under the EXAM
// profile (quit password, locked for the duration) rather than the free-exit
// lesson profile a course launch uses. This module is the one definition of
// that gate. Two call sites use it — shell/placement.js (Computing, Global
// Perspectives, Intensive English, Mathematics, Science) and English's
// hand-rolled placement code in shell/subjects/english.js — because English
// never adopted the shared placement module. Change the rule here, not in a
// copy.
//
// WHAT THIS GATE HONESTLY IS
//
// The course app is static files on the Bunny CDN. It has no server of its own,
// so it CANNOT validate a SEB Browser Exam Key — only Moodle can, and Moodle is
// not in the request path once the app has loaded. Everything below is
// therefore a client-side check that a determined adult can defeat by editing
// the URL.
//
// It is still worth having, for a reason that is not security theatre: the real
// enforcement is that a learner who bypasses the gate also has no progress
// token, so the attempt is never recorded against them and the placement is not
// awarded. Bypassing the exam gets you a score nobody stores. The gate stops a
// child wandering into the exam in an ordinary tab; the token is what makes the
// result mean anything.
//
// The server side (local_hubredirect/placement_launch.php + seb_config.php) is
// where the enforceable half lives: it checks enrolment, verifies the progress
// token, and mints the exam-grade .seb config.

/** True when this page is genuinely running inside Safe Exam Browser. */
export function isSafeExamBrowser() {
  if (typeof window === "undefined") return false;
  // SEB injects this object into every page it serves. Checked first because
  // the user agent is the easier of the two to fake.
  if (window.SafeExamBrowser && typeof window.SafeExamBrowser === "object") return true;
  const ua = String(navigator.userAgent || "");
  return /\bSEB[/\s]/i.test(ua);
}

/**
 * The launch context Moodle handed the app, read off the URL.
 *
 * `pwsEndpoint` is the progress gateway on the consumer host the learner
 * actually reached us on — which is how the CDN-served app knows where its
 * Moodle lives without a hostname baked in here. Several consumer hosts front
 * this install and $CFG->wwwroot may not be the one this learner can use, so
 * deriving it from the launch is the only correct source.
 */
export function examLaunchContext(search = (typeof location !== "undefined" ? location.search : "")) {
  const p = new URLSearchParams(search);
  const endpoint = (p.get("pwsEndpoint") || "").trim();
  let origin = "";
  try {
    if (/^https?:\/\//i.test(endpoint)) origin = new URL(endpoint).origin;
  } catch { origin = ""; }
  return {
    origin,
    token: (p.get("pwsToken") || "").trim(),
    studentId: (p.get("studentid") || "").trim(),
    focusMode: p.get("focusMode") === "1",
    // Set by placement_launch.php when an admin has turned placement lockdown
    // off site-wide. Without it the app would gate the exam, bounce the learner
    // to the launch endpoint, and be sent straight back — forever.
    exempt: p.get("sebExempt") === "1",
    exitUrl: (p.get("exitUrl") || "").trim(),
    seb: isSafeExamBrowser(),
    // Only seb_config.php's PLACEMENT profile sets this. Being inside SEB is
    // not on its own enough to sit the exam: a course launch also opens SEB,
    // but under the lesson profile — no quit password, no URL filtering, free
    // exit. Waving that session through would quietly downgrade the exam to
    // lesson terms, which is the whole thing this gate exists to prevent.
    examSession: p.get("sessionKind") === "exam",
  };
}

/**
 * How this page may run the exam.
 *   "seb"      — inside Safe Exam Browser under the EXAM profile. Allowed.
 *   "seb-lesson" — inside Safe Exam Browser, but on a session opened by an
 *                ordinary course launch, which is deliberately free-exit.
 *                BLOCKED: the handover re-opens SEB on the exam profile.
 *   "focus"    — install-free fallback (fullscreen + focus reporting), which
 *                the server chose because this device cannot run SEB. Allowed,
 *                and honestly weaker; the result records how it was taken.
 *   "exempt"   — the server says placement lockdown is off site-wide. Allowed.
 *   "unlaunched" — no Moodle launch at all (local dev, a bare CDN visit, a
 *                preview build). There is no learner, no enrolment and no
 *                progress token here, so there is nothing to protect and
 *                nothing to record. Allowed, or the exam could never be worked
 *                on or demonstrated.
 *   "open"     — a real launch, in an ordinary browser tab. BLOCKED: this is
 *                the case the gate exists for.
 */
export function examEnvironment(ctx = examLaunchContext()) {
  if (ctx.seb && ctx.examSession) return "seb";
  // focusMode alone is NOT enough, for exactly the reason SEB alone is not: an
  // ordinary COURSE launch also sets focusMode=1 for learners whose launch
  // preference is focus, so a learner already in a focus-mode lesson arrived at
  // unit -1 with the flag set, the gate waved them through, and the exam ran
  // with no Safe Exam Browser handover ever offered. Only a session the
  // placement launch itself opened carries sessionKind=exam.
  if (ctx.focusMode && ctx.examSession) return "focus";
  if (ctx.exempt) return "exempt";
  if (!ctx.origin || !ctx.token) return "unlaunched";
  if (ctx.seb) return "seb-lesson";
  if (ctx.focusMode) return "focus-lesson";
  return "open";
}

/** The Moodle endpoint that hands this learner's placement exam to SEB. */
export function placementLaunchUrl(ctx = examLaunchContext(), { fallback = "" } = {}) {
  if (!ctx.origin || !ctx.token) return "";
  const params = new URLSearchParams({ token: ctx.token });
  if (ctx.studentId) params.set("studentid", ctx.studentId);
  if (fallback) params.set("fallback", fallback);
  return `${ctx.origin}/local/hubredirect/placement_launch.php?${params}`;
}

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

/**
 * Gate the exam. Returns true when the caller may render it; when it returns
 * false it has already painted the handover page into `mount` and the caller
 * must render nothing.
 *
 * The OVERVIEW page is deliberately not gated — it only describes the exam, and
 * a learner reading what is coming has no integrity cost. Nor is the RESULTS
 * page: that is their own report, already earned. Only the questions are gated.
 */
export function requireExamLockdown({ mount, stageLabel = "", examTitle = "Placement exam", backHref = "" }) {
  const ctx = examLaunchContext();
  const environment = examEnvironment(ctx);
  const BLOCKED = ["open", "seb-lesson", "focus-lesson"];
  if (!BLOCKED.includes(environment)) return true;
  if (!mount) return true;

  const launch = placementLaunchUrl(ctx);
  const focusLaunch = placementLaunchUrl(ctx, { fallback: "focus" });
  // Arrived from an ordinary lesson session. In SEB that means reconfiguring
  // onto the exam profile rather than opening it; in focus mode it means the
  // lesson's fullscreen is not an exam session at all.
  const inSebLesson = environment === "seb-lesson";
  const inFocusLesson = environment === "focus-lesson";
  const inLesson = inSebLesson || inFocusLesson;
  // The install-free fallback is hidden only for a learner already running SEB,
  // where it plainly works. A focus-mode learner is the one MOST likely to need
  // it — they are usually in focus mode precisely because SEB will not install.
  const offerFallback = !inSebLesson;

  mount.innerHTML = `
    <div class="final-quiz-intro">
      <section class="panel final-quiz-hero">
        <span class="eyebrow">${esc(stageLabel)} · Prerequisite unit</span>
        <h2>${inLesson ? "This exam needs exam mode" : "This exam opens in Safe Exam Browser"}</h2>
        <p>${esc(examTitle)} decides which stage you start at, so it is taken in a locked
        browser — the same way a real exam is.${inSebLesson
          ? " You are in Safe Exam Browser already, but in lesson mode, which you can leave freely. Starting the exam switches it into exam mode."
          : inFocusLesson
          ? " You are in your lesson at the moment, not an exam. Starting the exam opens it properly."
          : " Your device opens Safe Exam Browser, you answer the questions there, and it closes again when you finish."}</p>
        <div class="audio-actions">
          ${launch ? `<a class="button gold" href="${esc(launch)}">${inLesson ? "Start the exam in exam mode" : "Open the exam in Safe Exam Browser"} →</a>` : ""}
          ${backHref ? `<a class="button secondary" href="${esc(backHref)}">Not now — go back</a>` : ""}
        </div>
      </section>
      ${!offerFallback ? "" : `
      <section class="panel">
        <h3>If Safe Exam Browser will not open</h3>
        <p>It cannot be installed on every device — there is no Android version at all.
        If your tablet or phone cannot run it, you can still take the exam in focus mode:
        the exam fills the screen and your teacher is told if you leave it.</p>
        <div class="audio-actions">
          ${focusLaunch ? `<a class="button secondary" href="${esc(focusLaunch)}">My device cannot use Safe Exam Browser</a>` : ""}
        </div>
      </section>`}
    </div>`;
  return false;
}

/**
 * Leave the exam session once the learner has submitted.
 *
 * In SEB this navigates to the release endpoint, which redirects to the quit
 * URL and SEB closes. `done=1` is the app telling the server the exam was
 * submitted — the server cannot verify that itself, because the questions are
 * answered client-side, so it trusts the claim and relies on the hard cap to
 * guarantee nobody is ever held past it. That is the same bargain the lesson
 * release already makes, and the cap is why a wrong claim cannot strand a child.
 *
 * Outside SEB there is nothing to quit, so this does nothing at all.
 */
export function finishExamSession() {
  const ctx = examLaunchContext();
  if (!/^https?:\/\//i.test(ctx.exitUrl)) return false;
  const url = ctx.exitUrl + (ctx.exitUrl.includes("?") ? "&" : "?") + "done=1";
  // Let the results paint and the progress write leave the tab before the
  // browser is taken away; an immediate navigation raced both.
  setTimeout(() => { location.href = url; }, 2500);
  return true;
}
