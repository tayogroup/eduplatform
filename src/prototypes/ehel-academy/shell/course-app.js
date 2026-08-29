// Unified course-app shell (P1.5). One data-driven core that every subject plugs
// into via a config module, replacing the three near-duplicate course-ui.js
// scaffoldings. The core owns the whole lifecycle — boot/route, data load, nav,
// the ElevenLabs voice engine, progress (localStorage + ProgressClient), and the
// page layout — and dispatches section rendering to the subject's registry.
//
// A subject module exports { config, bind }:
//   config = { subjectKey, subjectLabel, param, maxStage, maxUnit, keys,
//              progressDefaults, gradeDefaults, courseKey, mediaSubject,
//              ttsPurpose, sections, nonCountable, gradeSections, renderers,
//              load(ctx), onReady(ctx), extendSummary?(progress, base),
//              staticVoiceUrl?(text), isSectionDone?(id), stageDir?(stage),
//              completionCard?: false, nextUnit?(unitNumber, manifest) }
//   bind(ctx) — populates the module's shell-provided `let` bindings so the
//   renderer bodies (kept verbatim from the original apps) run unchanged.
//
// createCourseApp(config) wires it all and boots.

import { escapeHtml as sharedEscapeHtml, icon as sharedIcon, pageHeader as sharedPageHeader, sectionNavigation } from "../shared/course-shell.js?v=20260721a";
import { createProgressClient } from "../shared/progress-client.js?v=20260722a";
// Self-mounting: renders the countdown/finish bar only on an SEB launch.
import "../shared/seb-session.js?v=20260724a";
// Welcome gate (adopted from PreQuraan): one tap into fullscreen, every launch.
import { mountLessonGate } from "../shared/lesson-gate.js?v=20260724a";
import { mountWehelChat, platformUrl } from "./wehel.js?v=wehel-4";

const pad2 = (n) => String(n).padStart(2, "0");

// Storage can be UNAVAILABLE rather than merely empty. Every course runs inside
// a cross-origin iframe (Moodle -> CDN, see local_hubredirect/issue_child.php),
// and a browser that blocks third-party storage throws SecurityError on the
// `localStorage` property itself — not on the call. That is the default in
// Chrome Incognito, Safari's cross-site tracking prevention and Firefox strict.
//
// The reads inside loadProgress()/loadGradeProgress() were already guarded, but
// the property access at setup was not, and it runs BEFORE init() — so the
// throw escaped the one try/catch that would have shown "We could not prepare
// the lesson", and the learner got a stuck loading pane with no message at all.
// The writes were unguarded too, so a blocked device threw on every save.
//
// Guarding here means a blocked device loses persistence and nothing else: the
// lesson boots, plays and scores; only resume-where-you-left-off is gone. Same
// shape as the guards wehel.js applies to its own accesses — though note that
// file was not fully covered either: its read-aloud toggle had no guard until
// this pass, so don't read it as the worked example.
const storageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* progress stays per-session on this device */ } };

export function createCourseApp(config) {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const stageNumber = Number(params.get(config.param) || params.get("stage") || params.get("grade") || document.documentElement.dataset[config.param] || document.documentElement.dataset.stage || document.documentElement.dataset.grade || 2);
  const unitNumber = Number(params.get("unit") ?? (config.defaultUnit ? config.defaultUnit(stageNumber) : 1));

  // --- the path nav ----------------------------------------------------------
  // Grades/Stages 1-4 draw the section list as a PATH: a trail of circular
  // nodes, filled green behind the learner and hollow ahead of them, with the
  // label beside each. Above that the list stays the flat row of icons it is
  // today, for the reason the deck is gated at the same number — by Stage 5 a
  // learner scans a list rather than being walked along it, and a trail of
  // beads is a six-year-old's affordance, not a thirteen-year-old's.
  //
  // ONE constant, and it lives here rather than in each subject, because unlike
  // DECK_MAX_STAGE this decides nothing but paint: no route, no gate, no count.
  // Every subject reaches this line -- English included, which renders its own
  // sections but takes nav, boot and routing from this core.
  //
  // Levelled courses are excluded rather than compared. Intensive English is
  // Levels 1-2, and a level says nothing about how old the learner is, so
  // `<= 4` would be an accident there rather than a decision.
  const PATH_NAV_MAX_STAGE = 4;
  const pathNav = config.param !== "level" && stageNumber >= 1 && stageNumber <= PATH_NAV_MAX_STAGE;
  // The same decision, published for CSS that has no markup to hang a class on.
  // The section list gets .nav-button--path per row because sectionNavigation()
  // builds those rows; the TOPBAR is static markup in each subject's index.html
  // -- six files, identical structure, none of it generated -- so the only way
  // to reach it is a flag on an ancestor. One gate, two mechanisms, because the
  // two surfaces are built differently.
  //
  // documentElement, not body: this module is imported at the end of <body> in
  // every subject today, but <html> exists from the first byte of the parse, so
  // the class cannot land after the topbar has already painted unstyled if that
  // ever changes.
  document.documentElement.classList.toggle("young-stage", pathNav);

  // --- the sections sheet (phones, Grades/Stages 1-4) ------------------------
  // On a phone the sidebar becomes a horizontal rail, and for a young learner
  // that is the wrong shape: eighteen 84px tiles is 1,512px of strip inside a
  // 222px window, nothing scrolls the current one into view, and the two pinned
  // resource tiles take 140px of a 390px screen. A six-year-old saw Overview and
  // half of Unit Study Plan and had to drag a seven-screen ribbon sideways to
  // find Reading.
  //
  // So at these stages the phone rail becomes a full-screen SHEET: one button
  // opens the same vertical path the desktop sidebar draws, with the same nodes,
  // trail and ticks. The button is created here rather than added to six
  // subjects' index.html, and it is inert everywhere else — CSS only reveals it
  // under html.young-stage inside the phone breakpoint.
  //
  // It does NOT invent a second way to leave a section. Tapping a row already
  // enters focus mode, which hides the sidebar; the sheet just closes with it.
  let sectionsToggle = null;
  const sheetOpen = () => document.body.classList.contains("sections-open");
  function closeSectionsSheet() {
    if (!sheetOpen()) return;
    document.body.classList.remove("sections-open");
    sectionsToggle?.setAttribute("aria-expanded", "false");
  }
  function mountSectionsSheet() {
    if (!pathNav || sectionsToggle) return;
    const sidebar = $(".sidebar");
    const nav = $("#section-nav");
    if (!sidebar || !nav) return;
    if (!nav.id) nav.id = "section-nav";
    sectionsToggle = document.createElement("button");
    sectionsToggle.type = "button";
    sectionsToggle.id = "sections-toggle";
    sectionsToggle.className = "sections-toggle";
    sectionsToggle.setAttribute("aria-controls", "section-nav");
    sectionsToggle.setAttribute("aria-expanded", "false");
    sectionsToggle.innerHTML = `${icon("list")}<span>Sections</span>`;
    sectionsToggle.addEventListener("click", () => {
      const open = !sheetOpen();
      document.body.classList.toggle("sections-open", open);
      sectionsToggle.setAttribute("aria-expanded", String(open));
      // Opening puts the learner at the top of their own path rather than
      // wherever the rail happened to be scrolled to.
      if (open) nav.scrollTop = 0;
    });
    sidebar.insertBefore(sectionsToggle, sidebar.firstChild);
    // Escape closes it, the same key that leaves focus mode — one habit, not two.
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSectionsSheet(); });
  }

  // --- learner category ------------------------------------------------------
  // "tutoring" marks the tutoring-support learners: children at OTHER schools
  // whose families use Ehel as tutoring (owner decision 2026-08-25 — real
  // accounts in a cohort inside ehel-k12, all-subjects bundle, all content).
  // They have no position in our school year, so their front door is the
  // Get-help search, the school-run chrome (study plans, live class, capstones)
  // is hidden, and English's sequential gate stands down — a search-driven
  // learner opens the unit their problem lives in, not Unit 1.
  //
  // The claim rides in the SIGNED launch token, minted by the gateway from
  // cohort membership (progress_gatewaylib.php :: pqpg_launch_category); the
  // bare ?category= param is the dev/QA door. Read here, never verified — the
  // app holds no secret — so it decides what is DRAWN and nothing else, the
  // same weight the role claim carries. Entitlement is enforced by Moodle
  // enrolment at launch, not by this flag. The decoder twins english.js ::
  // launchClaims() — one shape, kept in step by behaviour.
  const launchTokenClaims = () => {
    const token = params.get("pwsToken") || "";
    const [, payload] = token.split(".");
    if (!payload) return null;
    try {
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
      const claims = JSON.parse(atob(base64));
      return claims && typeof claims === "object" ? claims : null;
    } catch { return null; /* not a token we can read */ }
  };
  const LAUNCH_TOKEN_CLAIMS = launchTokenClaims();
  const IS_TUTORING = (LAUNCH_TOKEN_CLAIMS?.category || params.get("category")) === "tutoring";
  // The school-run sections a tutoring learner never walks. Hidden from the nav
  // AND dropped from the countable list in one place, because several subjects
  // count "live" toward a unit's 100% — hiding it while still counting it would
  // make every unit permanently incompletable for this category.
  const TUTORING_HIDDEN = ["unit-plan", "year-plan", "live", "capstone", "capstonequiz"];
  const tutoringVisible = (id) => !IS_TUTORING || !TUTORING_HIDDEN.includes(id);

  // Welcome gate: mounted immediately, before any data load, so the learner sees
  // it instantly rather than after a fetch.
  mountLessonGate({ subjectKey: config.subjectKey, stage: stageNumber });

  // Subjects whose stage axis is not a school grade name their folders
  // themselves (Kiswahili's stages are competency tracks, not grades).
  const stageDir = config.stageDir ? config.stageDir(stageNumber) : `grade-${stageNumber}`;
  const stageRootUrl = new URL(`./${stageDir}/`, location.href);
  const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
  const dataRootUrl = IS_LOCAL_DEV
    ? new URL("data/", stageRootUrl)
    : new URL(`../../content/${config.subjectKey}/g${pad2(stageNumber)}/`, document.baseURI);

  const keys = config.keys(stageNumber, unitNumber);
  const STORAGE_KEY = keys.progress;
  const STAGE_STORAGE_KEY = keys.grade;
  // serve-src-preview.js hosts /api/elevenlabs-tts and defaults to port 4287,
  // but autoPort can move it — treat every localhost port as dev except the
  // two servers with no API routes (vite 5173, bunny dist preview 4173) and
  // bare 80/443, which would be a local Moodle. Mirrors shell/wehel.js.
  const ELEVENLABS_ENDPOINT = IS_LOCAL_DEV && !["", "80", "443", "5173", "4173"].includes(location.port) ? "/api/elevenlabs-tts" : "/local/hubredirect/quiz_tts.php";
  const ELEVENLABS_VOICE_ID = "XfNU2rGpBa01ckF309OY";

  const sections = config.sections;
  const nonCountable = config.nonCountable || ["overview"];
  const gradeSections = config.gradeSections || [];

  // --- state ---------------------------------------------------------------
  let manifest, course, gradeCapstone;
  // Tutoring learners land on the search, not the unit overview — coming with
  // a problem rather than a curriculum position is their defining trait.
  let route = location.hash.slice(1) || (IS_TUTORING && config.getHelp ? "get-help" : "overview");
  let currentPageNarration = "";
  let speakingButton = null;
  let voiceRequestId = 0;
  const voicePlayer = typeof Audio === "function" ? new Audio() : null;
  const voiceAudioCache = new Map();
  const voiceAudioPending = new Map();
  const voiceSupported = Boolean(voicePlayer && typeof fetch === "function");
  let voiceEnabled = storageGet(`${STORAGE_KEY}-voice-enabled`) !== "false";

  const loadProgress = () => {
    try { return { ...config.progressDefaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || (keys.legacyProgress && localStorage.getItem(keys.legacyProgress)) || "{}") }; }
    catch { return { ...config.progressDefaults }; }
  };
  const loadGradeProgress = () => {
    if (!STAGE_STORAGE_KEY) return { ...(config.gradeDefaults || {}) };
    try { return { ...config.gradeDefaults, ...JSON.parse(localStorage.getItem(STAGE_STORAGE_KEY) || (keys.legacyGrade && localStorage.getItem(keys.legacyGrade)) || "{}") }; }
    catch { return { ...config.gradeDefaults }; }
  };
  const progress = loadProgress();
  const gradeProgress = loadGradeProgress();

  // --- progress web service (P1.4) -----------------------------------------
  // A tutoring launch's token is minted with the umbrella course key
  // (ehel-tutoring-<slug>) and the gateway REJECTS posts whose course disagrees
  // with the token — so the app adopts the token's course. That rejection is
  // the separation working: everything a tutoring learner does lands under the
  // tutoring course, never in a school course's record.
  const PROGRESS_COURSE = (IS_TUTORING && typeof LAUNCH_TOKEN_CLAIMS?.course === "string" && LAUNCH_TOKEN_CLAIMS.course)
    ? LAUNCH_TOKEN_CLAIMS.course
    : config.courseKey(stageNumber);
  const PROGRESS_STUDENT = params.get("studentid") || "local";
  // One tutoring course spans every stage of its subject, so the bare unit
  // number is ambiguous there — Grade 5 Unit 7 and Grade 6 Unit 7 would write
  // to the same key. The stage joins the unit id for this category only;
  // regular courses keep the shape every existing record uses.
  const PROGRESS_UNIT = IS_TUTORING ? `g${pad2(stageNumber)}-u${pad2(unitNumber)}` : `u${pad2(unitNumber)}`;
  // Launch URLs travel through chat/email copy-paste, which injects invisible
  // Unicode (zero-width chars, smart punctuation) that makes fetch() reject the
  // Authorization header outright. Strip anything outside the JWT alphabet.
  const launchEndpoint = (params.get("pwsEndpoint") || "").trim();
  const launchToken = (params.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
  const progressWS = createProgressClient({
    course: PROGRESS_COURSE, student: PROGRESS_STUDENT,
    backend: launchEndpoint ? "remote" : "local",
    endpoint: launchEndpoint || undefined,
    token: launchToken || undefined,
  });
  let unitCompletedSent = false;
  const emitProgress = (event) => { try { progressWS.emit(event); } catch { /* never break the lesson */ } };
  // The help-session flow emits its finished sessions server-side for the
  // tutoring category only — the record their parents' reports read, written
  // under the umbrella course this page's token was minted for. Regular
  // learners' sessions never leave the browser (see get-help.js::attachShell).
  // `hiddenSections` is TUTORING_HIDDEN itself, not a copy of it: the search and
  // the nav have to agree about what this category can reach, and the way to
  // guarantee that is for there to be one list. Without it they disagreed the
  // moment a hidden section gained topics — indexing the stage capstones put
  // "Run a Stage 5 Science Fair" first in a tutoring learner's results for a
  // section their own nav deliberately omits. (Owner, 2026-08-27.)
  // --- the tutoring learner's other subjects --------------------------------
  // One dashboard card ("Tutor Me") opens ONE subject's app, so the way out of
  // it and into another is here, on the search page this category lands on.
  //
  // The list is the token's, minted from ENROLMENT
  // (progress_gatewaylib.php :: pqpg_tutoring_subjects) — it is what the learner
  // can actually open, so a family who bought four subjects is not offered six,
  // and the shell holds no list of its own to go stale. Same reason the topbar
  // picker derives rather than lists.
  //
  // Each entry carries the stage its ±2 help window is anchored on, which is
  // the ONLY place a learner can see that number: it is resolved server-side
  // per subject and the app is simply told the answer.
  //
  // The href is built HERE rather than in get-help.js because this is where the
  // launch context is. platformUrl() resolves the Moodle origin from
  // pwsEndpoint and correctly falls back to a root-relative path when the app
  // is served BY Moodle — building the URL by hand in the page would have to
  // reproduce both cases. A launch with no token carries no claim, so this is
  // empty in local dev and the switcher does not draw.
  //
  // `dir` is the app directory, which is how a subject module names itself
  // (config.subjectKey); it is what marks the entry the learner is already
  // looking at, so the switcher never offers a link back to this page.
  const TUTORING_SUBJECTS = (IS_TUTORING && Array.isArray(LAUNCH_TOKEN_CLAIMS?.tutoring))
    ? LAUNCH_TOKEN_CLAIMS.tutoring
      .filter((entry) => entry && typeof entry.dir === "string" && typeof entry.course === "string")
      .map((entry) => ({
        dir: entry.dir,
        label: String(entry.label || entry.dir),
        stage: Number(entry.stage) || 0,
        stageWord: String(entry.stageWord || "Stage"),
        here: entry.dir === config.subjectKey,
        href: platformUrl(`/local/hubredirect/course_launch.php?course=${encodeURIComponent(entry.course)}`),
      }))
    : [];
  if (config.getHelp?.attachShell) config.getHelp.attachShell({ tutoring: IS_TUTORING, emitEvent: emitProgress, hiddenSections: TUTORING_HIDDEN, subjects: TUTORING_SUBJECTS });

  // The same list again, in the TOPBAR, so it is reachable from a content page.
  //
  // Owner, 2026-08-27: "once the student is in the content page, they cannot
  // change the course, for example from english to math." They were right, and
  // the panel above is why — subjectSwitcher() is called from get-help.js ::
  // render() alone, so "Your subjects" exists on the SEARCH page and nowhere
  // else. A tutoring learner reading a lesson has no sidebar either
  // (body.tutoring-nav hides it), so from a section there was no subject
  // switcher on screen and no visible way back to the page that has one. The
  // routes that did exist were the topbar's stage/unit pickers, which reach the
  // search only as a side effect of SEARCHING, and browser Back.
  //
  // So this is the missing half of a feature rather than a new one: same list,
  // same launch, same rules — drawn where the learner actually is. The panel on
  // the search page stays, because that page is this category's home and the
  // panel says the anchor stage per subject, which a <select> cannot.
  //
  // Built with DOM calls rather than innerHTML because escapeHtml is defined
  // below this point; it also means no escaping to get wrong. Injected into
  // .top-actions, which every subject's index.html already has, so this is one
  // shell change and not six — the same reason the tutoring pickers are an
  // overlay here rather than a branch in each subject file.
  //
  // Silent unless it can do something: no token means no list (local dev, a
  // direct CDN visit) and one subject means nothing to switch to. Selecting the
  // subject already open is a no-op with an empty value rather than a launch
  // spent arriving where you are — the rule the panel keeps by drawing that
  // entry as a span.
  function mountTutoringSubjectPicker() {
    if (!IS_TUTORING) return;
    const choices = TUTORING_SUBJECTS.filter((entry) => entry.here || entry.href);
    if (choices.length < 2) return;
    const actions = $(".top-actions");
    if (!actions || $("#subject-select")) return;
    const select = document.createElement("select");
    select.id = "subject-select";
    // top-grade-picker for the styling that already exists (adding a rule to
    // course-ui.css would make five other subjects' bundles stale over a
    // cosmetic change — see the shared-stylesheet coupling in CLAUDE.md);
    // top-subject-picker so a later stylesheet can tell them apart.
    select.className = "top-grade-picker top-subject-picker";
    select.setAttribute("aria-label", "Choose subject");
    for (const entry of choices) {
      const option = document.createElement("option");
      option.value = entry.here ? "" : entry.href;
      option.textContent = entry.label;
      option.selected = entry.here;
      select.append(option);
    }
    select.addEventListener("change", () => {
      const href = select.value;
      if (!href) return;
      // A full page load through course_launch.php, exactly as the panel's
      // links do: the launch mints that subject's own token and resolves its
      // own anchor stage, so a switch cannot land a learner in a subject at
      // another subject's level.
      location.href = href;
    });
    actions.prepend(select);
  }
  mountTutoringSubjectPicker();

  // --- raise a hand ---------------------------------------------------------
  //
  // One live teacher runs two groups of nine out of phase: while one group is
  // taught, this learner works here with no adult in the room. The escalation
  // ladder they are taught is worked example, then Wehel, then the group chat,
  // then the teacher — and until now there was no fourth step, because a child
  // in the other breakout room had no way to say "I am stuck" that did not mean
  // interrupting the lesson next door by voice.
  //
  // The teacher sees it on live_group_board.php, where a raised hand sorts above
  // every inferred signal: staleness is the board GUESSING who needs help, and
  // this is the one thing the learner said out loud.
  //
  // SILENT UNLESS IT CAN DO SOMETHING, the same rule the subject picker keeps
  // above. The server answers `watched` — is this learner in an active class
  // group with a teacher on it — and the button is not mounted at all when it
  // is false. A tutoring learner working alone at nine at night must not be
  // offered a button that reaches nobody: they would wait for help that is not
  // coming instead of asking Wehel or re-reading the worked example, which is
  // worse than having no button.
  //
  // Assigned to a CONST from platformUrl() because that is the pattern
  // check-platform-cors.mjs reads to discover endpoints and decide whether each
  // needs Allow-Credentials — this one is token-authenticated and sends none,
  // like the progress gateway.
  const HAND_ENDPOINT = platformUrl("/local/hubredirect/course_hand_raise.php");

  function mountHandRaise() {
    const actions = $(".top-actions");
    if (!actions || !launchToken || !launchEndpoint || $("#hand-raise")) return;

    // text/plain keeps this a SIMPLE request, so there is no CORS preflight —
    // the focus beacon's trick. Unlike that beacon this is a fetch and not
    // sendBeacon, because the learner needs the answer: the button's whole
    // honesty rests on knowing whether the hand actually went up.
    const post = (body) => fetch(HAND_ENDPOINT, {
      method: "POST", mode: "cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ token: launchToken, ...body }),
    }).then((response) => (response.ok ? response.json() : null)).catch(() => null);

    let up = false;
    let button = null;
    let poll = 0;

    const paint = () => {
      button.textContent = up ? "✋ Hand up" : "Raise hand";
      button.setAttribute("aria-pressed", up ? "true" : "false");
      button.title = up
        ? "Your teacher can see your hand. Press again to put it down."
        : "Tell your teacher you are stuck. Keep working while you wait.";
      // Raised state inline rather than in a stylesheet class: course-ui.css is
      // imported by all six subjects and bundled into each release as
      // design-system.css, so one cosmetic rule there makes five other
      // subjects' app tiers stale (CLAUDE.md, the shared-stylesheet coupling).
      // seb-session.js styles its injected controls the same way.
      button.style.background = up ? "#1a67a3" : "white";
      button.style.color = up ? "#fff" : "";
      button.style.borderColor = up ? "#1a67a3" : "";
    };

    // Only while a hand is UP, so an ordinary lesson makes no repeat requests.
    // It exists because the TEACHER can lower this hand from the board when
    // they answer, and without it the child would still see their hand up.
    const watch = () => {
      clearInterval(poll);
      if (!up) return;
      poll = setInterval(async () => {
        const state = await post({});
        if (state && state.ok && !state.up && up) { up = false; paint(); clearInterval(poll); }
      }, 30000);
    };

    const toggle = async () => {
      button.disabled = true;
      const wanted = !up;
      const state = await post({ up: wanted, unit: PROGRESS_UNIT, section: location.hash.replace("#", "") });
      button.disabled = false;
      if (!state || !state.ok) {
        // Say what is true. A hand that silently failed to go up is the one
        // failure this control must never have, because the child then waits.
        button.title = "That did not send. Check your connection and try again.";
        return;
      }
      up = !!state.up;
      paint();
      watch();
    };

    // One request on mount, which also settles what a RELOAD should show: the
    // hand lives on the server, so a learner who refreshes must not see their
    // raised hand come back down while the teacher still has it flagged.
    post({}).then((state) => {
      if (!state || !state.ok || !state.watched) return;
      button = document.createElement("button");
      button.type = "button";
      button.id = "hand-raise";
      // top-grade-picker for a pill that already exists and is NOT hidden on
      // mobile the way .icon-button is — this control must reach a learner on a
      // phone. It also inherits the html.young-stage sizing, which makes the
      // button bigger and rounder at Stages 1-4, the learners most likely to
      // need it. Only the select-specific width and padding are overridden.
      button.className = "top-grade-picker top-hand-raise";
      button.style.cssText = "width:auto;padding:8px 12px;cursor:pointer";
      up = !!state.up;
      paint();
      button.addEventListener("click", toggle);
      actions.prepend(button);
      watch();
    });
  }
  mountHandRaise();
  const emitProgressSummary = () => {
    const base = {
      type: "progress.summary", unit: PROGRESS_UNIT,
      sectionsDone: [...(progress.completed || [])],
      // WHERE THE LEARNER IS, which is not what sectionsDone says: that is what
      // they have finished, and a learner stuck twenty minutes into the next
      // section is exactly the one a supervising teacher needs to see. The
      // reducer and the stored state have carried a `resume` field since the
      // progress contract was written and nothing had ever populated it, so
      // this is the field being fed rather than a new one.
      resume: route || undefined,
      xp: Object.values(progress.games || {}).reduce((s, g) => s + (g.xp || 0), 0) || undefined,
    };
    emitProgress(config.extendSummary ? config.extendSummary(progress, base) : base);
  };

  const saveProgress = () => { storageSet(STORAGE_KEY, JSON.stringify(progress)); updateProgress(); emitProgressSummary(); };
  const saveGradeProgress = () => { if (STAGE_STORAGE_KEY) storageSet(STAGE_STORAGE_KEY, JSON.stringify(gradeProgress)); renderNav(); };
  const completeGradeSection = (section, message) => {
    if (!gradeProgress.completed.includes(section)) gradeProgress.completed.push(section);
    saveGradeProgress();
    if (message) toast(message);
  };
  const unitSectionIds = () => (config.visibleSections ? config.visibleSections() : sections).map(([id]) => id).filter((id) => !nonCountable.includes(id) && tutoringVisible(id));

  const escapeHtml = (v = "") => sharedEscapeHtml(v);
  const icon = (name, label = "") => sharedIcon(name, label);
  // `readAlong` is a CSS selector naming the on-screen elements this button's
  // narration walks, in narration order — see the read-along block below. Omit
  // it and the button behaves exactly as it always has.
  // `readAlong` names this button's narrated lines. `scope` narrows the search
  // to the button's OWN card or slide via closest() — required whenever a page
  // draws several narrated blocks, and required twice over in Computing, where
  // Stages 1-4 draw the original page and a deck of the same content at once
  // and a document-wide lookup would collect both halves' lines.
  const voiceButton = (text, label = "Listen", readAlong = "", scope = "") => `<button class="button secondary voice-button" data-speak="${escapeHtml(text)}"${readAlong ? ` data-readalong="${escapeHtml(readAlong)}"` : ""}${scope ? ` data-readalong-scope="${escapeHtml(scope)}"` : ""} type="button" aria-label="${escapeHtml(label)}">${icon("volume-2")} <span>${escapeHtml(label)}</span></button>`;

  // --- read-along (shared, opt-in) ------------------------------------------
  // Marks the line being narrated. No clip in these courses carries word
  // timings — a reading is one recording of the whole text — so a line's window
  // of the audio is estimated as its share of the narrated characters. Close
  // enough to follow with a finger; it is a guide for the eye, not a caption
  // track. Entirely inert unless a button carries data-readalong, so the four
  // other shell-voice subjects are unaffected until they ask for it.
  //
  // English runs its own audio engine (config.disableShellVoice) and therefore
  // carries its own copy of this in shell/subjects/english.js, where the line
  // splitter also has to cope with the headings readingBlocks() emits. Two
  // renderers, two copies — keep them in step by behaviour, not by sharing.
  let voiceSync = null;

  // A sentence, with any closing quote or bracket kept on the end of it, and
  // never broken inside quoted speech: a fragment that starts lowercase is the
  // back half of the sentence above it ("Hello!" / said the nurse.).
  function readAlongSentences(value) {
    const parts = String(value || "").match(/[^.!?]+[.!?]+[”’"')\]]*|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) || [];
    return parts.reduce((kept, part) => {
      if (kept.length && /^[a-z]/.test(part)) kept[kept.length - 1] += ` ${part}`;
      else kept.push(part);
      return kept;
    }, []);
  }

  // mode "sentences": prose, one line per sentence, paragraphs preserved.
  // mode "lines": a document — a form or notice, where a printed line IS the
  // unit and splitting "Name: A. COSTA" on its full stop would be nonsense.
  // Newlines are kept verbatim so a <pre> still lines up.
  // Just the sentence spans, no <p> around them, for a subject whose own
  // richText() already owns the paragraph and its class.
  function readAlongSpans(value) {
    const sentences = readAlongSentences(value);
    return (sentences.length ? sentences : [String(value || "").trim()])
      .map((sentence) => `<span class="rd-line">${escapeHtml(sentence)}</span>`).join(" ");
  }

  function readAlongLinesHtml(value, mode = "sentences") {
    const wrap = (line) => `<span class="rd-line">${escapeHtml(line)}</span>`;
    if (mode === "lines") {
      return String(value || "").replace(/\r\n?/g, "\n").split("\n")
        .map((line) => (line.trim() ? wrap(line) : line)).join("\n");
    }
    return String(value || "").replace(/\r\n?/g, "\n").split(/\n+/).map((line) => line.trim()).filter(Boolean)
      .map((paragraph) => {
        const sentences = readAlongSentences(paragraph);
        return `<p>${(sentences.length ? sentences : [paragraph]).map(wrap).join(" ")}</p>`;
      }).join("");
  }

  function clearVoiceSync() {
    if (!voiceSync) return;
    voiceSync.segments.forEach((segment) => segment.el.classList.remove("is-narrating"));
    voiceSync = null;
  }

  // sourceRanges: when the narration is split across several files, the
  // [start, end) character window each file covers. Null when one file reads
  // everything, which is the case for 120 of the 122 Intensive English texts.
  function startVoiceSync({ selector, scope = "", button = null }, sourceRanges = null) {
    clearVoiceSync();
    if (!selector || !voicePlayer) return;
    // A scoped lookup that finds no ancestor must find no lines either —
    // silently widening to the whole document is how one card's narration
    // would come to highlight another card's text.
    const root = scope ? button?.closest(scope) : document;
    if (!root) return;
    const elements = [...root.querySelectorAll(selector)];
    if (!elements.length) return;
    const segments = elements.map((el) => ({ el, chars: Math.max(1, el.textContent.replace(/\s+/g, " ").trim().length) }));
    let total = 0;
    const bounds = segments.map((segment) => { const range = [total, total + segment.chars]; total += segment.chars; return range; });
    voiceSync = { segments, bounds, total, sourceRanges, sourceIndex: 0, active: -1 };
  }

  // Proportional rather than absolute: the chunker trims, re-joins and injects
  // SSML break tags, so its character count and the on-screen one never agree
  // exactly. Sharing one scale keeps them comparable.
  function voiceChunkRanges(weights, total) {
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let position = 0;
    return weights.map((weight) => { const start = position; position += (weight / sum) * total; return [start, position]; });
  }

  function voiceSyncTick() {
    if (!voiceSync || !voicePlayer || !voiceSync.total) return;
    const duration = voicePlayer.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const fraction = Math.min(Math.max(voicePlayer.currentTime / duration, 0), 1);
    const range = voiceSync.sourceRanges ? (voiceSync.sourceRanges[voiceSync.sourceIndex] || [0, voiceSync.total]) : [0, voiceSync.total];
    const position = range[0] + fraction * (range[1] - range[0]);
    let index = voiceSync.bounds.findIndex(([, end]) => position < end);
    if (index === -1) index = voiceSync.segments.length - 1;
    if (index === voiceSync.active) return;
    voiceSync.segments[voiceSync.active]?.el.classList.remove("is-narrating");
    voiceSync.active = index;
    const el = voiceSync.segments[index]?.el;
    if (el?.isConnected) {
      el.classList.add("is-narrating");
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
  if (voicePlayer) voicePlayer.addEventListener("timeupdate", voiceSyncTick);

  // --- voice engine (shared) ------------------------------------------------
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i += 1) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const staticVoiceKey = (text) => cyrb53(String(text || "").replace(/\s+/g, " ").trim());
  const staticVoiceMisses = new Set();
  const staticVoicePath = (key) => IS_LOCAL_DEV
    ? new URL(`./media/audio/tts/${key}.mp3`, document.baseURI).href
    : new URL(`../../media/${config.mediaSubject}/g${pad2(stageNumber)}/audio/tts/${key}.mp3`, document.baseURI).href;
  const defaultStaticVoiceUrl = async (text) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return null;
    const key = staticVoiceKey(clean);
    if (staticVoiceMisses.has(key)) return null;
    const url = staticVoicePath(key);
    try { const r = await fetch(url, { method: "HEAD" }); if (r.ok) return url; } catch (e) { /* runtime fallback */ }
    staticVoiceMisses.add(key);
    return null;
  };
  const staticVoiceUrl = config.staticVoiceUrl || defaultStaticVoiceUrl;

  function stopVoice() {
    voiceRequestId += 1;
    if (voicePlayer) { voicePlayer.pause(); voicePlayer.removeAttribute("src"); voicePlayer.load(); }
    clearVoiceSync();
    if (speakingButton) { speakingButton.classList.remove("is-playing"); speakingButton.setAttribute("aria-label", speakingButton.dataset.voiceLabel || "Listen"); speakingButton.title = "ElevenLabs · approved Ehel voice"; }
    speakingButton = null;
  }
  function paceNumberSequences(text) {
    const number = "\\b\\d+(?:st|nd|rd|th)?\\b";
    const sequence = new RegExp(`${number}(?:\\s*(?:,|;|and|or)?\\s*${number}){2,}`, "gi");
    return String(text || "").replace(sequence, (match) => (match.match(new RegExp(number, "gi")) || []).join(' <break time="0.40s" /> '));
  }
  const containsNumberSequence = (text) => (String(text || "").match(/\b\d+(?:st|nd|rd|th)?\b/gi) || []).length >= 3;
  function narrationChunks(text, maximum = 2600) {
    const lines = String(text || "").split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!lines.length) return [];
    const pacedLines = lines.flatMap((line) => {
      const pieces = [];
      for (let start = 0; start < line.length; start += 2200) pieces.push(line.slice(start, start + 2200));
      return pieces.map((piece) => {
        const isCounting = containsNumberSequence(piece);
        const pacedPiece = paceNumberSequences(piece);
        return { text: `${/[.!?;:]$/.test(pacedPiece) ? pacedPiece : `${pacedPiece}.`} <break time="0.65s" />`, speed: isCounting ? 0.78 : 0.90, isCounting };
      });
    });
    const chunks = [];
    let current = "";
    for (const line of pacedLines) {
      if (line.isCounting) { if (current) chunks.push({ text: current, speed: 0.90 }); current = ""; chunks.push({ text: line.text, speed: line.speed }); }
      else if (`${current} ${line.text}`.trim().length <= maximum) current = `${current} ${line.text}`.trim();
      else { if (current) chunks.push({ text: current, speed: 0.90 }); current = line.text; }
    }
    if (current) chunks.push({ text: current, speed: 0.90 });
    return chunks;
  }
  function collectPageNarration() {
    // "Read this page" takes the ORIGINAL half where there is one — Stages 5+, and
    // Stages 1-4 until 2026-08-26, when they became the deck alone. On a deck page
    // #app is every slide at once (a deck paints all of them, not just the visible
    // one), so reading it would narrate the whole section in one go — 25 practice
    // questions, or an English unit's several hundred words. The slide the learner
    // is on is what "this page" means there, and the deck already marks it: every
    // other slide is `inert` (deck.js :: syncReachable).
    const source = $("#classic-design") || $("#app .gc-slide:not([inert])") || $("#app");
    if (!source) return currentPageNarration;
    const copy = source.cloneNode(true);
    copy.querySelectorAll(".voice-button, .audio-source, .status-chip, script, style, [hidden], [aria-hidden='true'], details:not([open]) > *:not(summary)").forEach((el) => el.remove());
    copy.querySelectorAll("input, textarea, select").forEach((el) => { const d = el.getAttribute("aria-label") || el.getAttribute("placeholder") || ""; if (d) el.replaceWith(document.createTextNode(d)); else el.remove(); });
    const blockTags = new Set(["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BUTTON", "DD", "DETAILS", "DIV", "DL", "DT", "FIGCAPTION", "FIGURE", "FOOTER", "H1", "H2", "H3", "H4", "HEADER", "LABEL", "LI", "MAIN", "NAV", "OL", "P", "SECTION", "SUMMARY", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"]);
    const readNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      if (node.tagName === "BR") return "\n";
      const content = [...node.childNodes].map(readNode).join("");
      return blockTags.has(node.tagName) ? `\n${content}\n` : content;
    };
    return readNode(copy).replace(/[✓★▶△◫☁▣⚑]/g, " ").replace(/→/g, " then ").replace(/·/g, ". ").split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
  }
  async function elevenLabsAudioUrl(text, speed = 0.90) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) throw new Error("There is nothing to read.");
    const safeSpeed = Math.max(0.70, Math.min(1, Number(speed) || 0.90));
    const cacheKey = `${safeSpeed.toFixed(2)}\n${clean}`;
    if (voiceAudioCache.has(cacheKey)) return voiceAudioCache.get(cacheKey);
    if (voiceAudioPending.has(cacheKey)) return voiceAudioPending.get(cacheKey);
    const pending = fetch(ELEVENLABS_ENDPOINT, {
      method: "POST", headers: { Accept: "audio/mpeg", "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, purpose: config.ttsPurpose, voiceId: ELEVENLABS_VOICE_ID, speed: safeSpeed }),
    }).then(async (response) => {
      if (!response.ok) throw new Error((await response.text()) || `ElevenLabs voice failed (${response.status}).`);
      const blob = await response.blob();
      if (!blob.size || !/^audio\//i.test(blob.type || "audio/mpeg")) throw new Error("The voice service returned invalid audio.");
      const url = URL.createObjectURL(blob);
      voiceAudioCache.set(cacheKey, url);
      if (voiceAudioCache.size > 30) { const oldest = voiceAudioCache.keys().next().value; URL.revokeObjectURL(voiceAudioCache.get(oldest)); voiceAudioCache.delete(oldest); }
      return url;
    }).finally(() => voiceAudioPending.delete(cacheKey));
    voiceAudioPending.set(cacheKey, pending);
    return pending;
  }
  function playVoiceSource(source, requestId) {
    return new Promise((resolve, reject) => {
      if (requestId !== voiceRequestId) return resolve();
      voicePlayer.src = source; voicePlayer.onended = resolve; voicePlayer.onemptied = resolve;
      voicePlayer.onerror = () => reject(new Error("The ElevenLabs recording could not be played."));
      voicePlayer.play().catch(reject);
    });
  }
  async function speakText(text, button, readAlong = "", readAlongScope = "") {
    if (!voiceEnabled) return toast("Turn on Voice Guide first.");
    if (!voiceSupported) return toast("ElevenLabs Voice Guide is not supported by this browser.");
    if (speakingButton === button) { stopVoice(); return; }
    stopVoice();
    const requestId = voiceRequestId;
    speakingButton = button;
    button.classList.add("is-playing");
    button.setAttribute("aria-label", "Stop ElevenLabs narration");
    try {
      const staticUrl = await staticVoiceUrl(text);
      if (staticUrl) {
        if (requestId !== voiceRequestId) return;
        startVoiceSync({ selector: readAlong, scope: readAlongScope, button });
        await playVoiceSource(staticUrl, requestId);
      }
      else {
        // Sentence-level mix: a text with no clip of its own may still contain
        // pre-recorded sentences — Wehel's stock phrases, or a quoted practice
        // question that lesson narration already paid for. Resolve each
        // sentence separately and buy TTS only for the gaps. Capped at 12
        // sentences so a whole-page narration doesn't fire dozens of HEAD
        // probes; chat replies are far below the cap.
        let chunks = null;
        const sentences = String(text || "").split(/(?<=[.!?…])\s+/).map((part) => part.trim()).filter(Boolean);
        if (sentences.length > 1 && sentences.length <= 12) {
          const urls = await Promise.all(sentences.map((sentence) => staticVoiceUrl(sentence)));
          if (requestId !== voiceRequestId) return;
          if (urls.some(Boolean)) {
            chunks = [];
            let gap = [];
            const flush = () => { if (gap.length) { chunks.push(...narrationChunks(gap.join(" "))); gap = []; } };
            sentences.forEach((sentence, index) => { if (urls[index]) { flush(); chunks.push({ url: urls[index], chars: sentence.length }); } else gap.push(sentence); });
            flush();
          }
        }
        if (!chunks) chunks = narrationChunks(text);
        // Each file covers a slice of the text, so the highlight needs to know
        // which slice is playing — without this every chunk would restart the
        // highlight at the first line.
        startVoiceSync({ selector: readAlong, scope: readAlongScope, button });
        if (voiceSync) voiceSync.sourceRanges = voiceChunkRanges(chunks.map((chunk) => Math.max(1, chunk.chars ?? String(chunk.text || "").length)), voiceSync.total);
        for (let index = 0; index < chunks.length; index += 1) {
          if (requestId !== voiceRequestId) return;
          if (voiceSync) voiceSync.sourceIndex = index;
          button.title = `ElevenLabs narration ${index + 1} of ${chunks.length}`;
          const source = chunks[index].url || await elevenLabsAudioUrl(chunks[index].text, chunks[index].speed);
          await playVoiceSource(source, requestId);
        }
      }
    } catch (error) { if (requestId === voiceRequestId) toast("ElevenLabs voice is unavailable. Please try again."); }
    finally {
      if (requestId === voiceRequestId) { button.classList.remove("is-playing"); button.setAttribute("aria-label", button.dataset.voiceLabel || "Listen"); button.title = "ElevenLabs · approved Ehel voice"; speakingButton = null; }
    }
  }
  function bindVoiceControls() {
    [...$$('[data-page-voice]'), ...$$('[data-speak]')].forEach((button) => {
      if (button.dataset.voiceBound) return;
      button.dataset.voiceBound = "true";
      button.dataset.voiceLabel = button.getAttribute("aria-label") || "Listen";
      button.disabled = !voiceSupported || !voiceEnabled;
      button.addEventListener("click", () => speakText(button.hasAttribute("data-page-voice") ? collectPageNarration() : button.dataset.speak, button, button.dataset.readalong || "", button.dataset.readalongScope || ""));
    });
  }
  function updateVoiceUI() {
    const toggle = $("#voice-toggle");
    if (!toggle) return;
    toggle.innerHTML = voiceEnabled ? icon("volume-2") : icon("volume-x");
    toggle.disabled = !voiceSupported;
    toggle.setAttribute("aria-label", voiceSupported ? (voiceEnabled ? "Turn ElevenLabs Voice Guide off" : "Turn ElevenLabs Voice Guide on") : "ElevenLabs Voice Guide unavailable");
    toggle.title = voiceSupported ? (voiceEnabled ? "ElevenLabs Voice Guide is on" : "ElevenLabs Voice Guide is off") : "ElevenLabs Voice Guide unavailable";
    $$('[data-page-voice], [data-speak]').forEach((button) => { button.disabled = !voiceSupported || !voiceEnabled; });
    // This button rewrites its own icon on every toggle, outside any render, so
    // it needs its own sweep — it was the one <i data-lucide> still surviving in
    // the topbar of all four shell-voice subjects after renderRoute and
    // renderNav had already run.
    paintIcons();
  }

  const pageHeader = (kicker, title, description, status = "Approved content") => {
    currentPageNarration = `${title}. ${description}`;
    queueMicrotask(() => { bindVoiceControls(); updateVoiceUI(); });
    return sharedPageHeader({ kicker: escapeHtml(kicker), title: escapeHtml(title), description: escapeHtml(description), status: escapeHtml(status) });
  };
  function toast(message) {
    const el = $("#toast");
    el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function complete(section, message) {
    const wasDone = progress.completed.includes(section);
    if (!wasDone) progress.completed.push(section);
    emitProgress({ type: "section.completed", unit: PROGRESS_UNIT, section });
    saveProgress();
    renderNav();
    if (message) toast(message);
    renderCompletionCard({ celebrate: !wasDone && section === route });
  }

  // --- the completion card: "this section is finished, here is the way on" ---
  // The toast above is gone in 2.4 seconds, and a learner who has just pressed
  // Finish is left at the bottom of the page with nothing saying it is done
  // and nowhere obvious to go. This card stays. It is drawn AFTER #app, never
  // inside it — renderers rewrite #app.innerHTML freely, and a card inside
  // would vanish on the next repaint — and it is redrawn from progress on
  // every route render and every complete(), so it reads the same lists the
  // nav ticks and the progress bar read (unitSectionIds, isSectionDone) and
  // can never disagree with them.
  //
  // Two states, one card. While sections remain it names the one just
  // finished, counts the ticks and offers the next unfinished section in nav
  // order. When the last tick lands it becomes the unit's finish line: what was
  // finished and what it opened — the next unit in the manifest (a link, since
  // a unit is a page load), the stage capstone where the subject has one, the
  // overview otherwise. The overview shows the finish line too, so a learner
  // returning to a done unit meets it where they land.
  //
  // A subject that draws its own card sets `completionCard: false` (English —
  // its sections open in a gated chain and its units unlock one another, rules
  // the shell does not know). `nextUnit(unitNumber, manifest)` lets a subject
  // override where a finished unit leads; the default is the next manifest
  // entry that is actually authored, reached by rewriting ?unit= on the current
  // URL, which every subject's own picker already does the same way.
  //
  // Not drawn on the prerequisite unit (its one section is the placement exam
  // — "Unit -1 is finished" is nobody's finish line), the teacher page, or a
  // unit with nothing countable (a withdrawn stage).
  function renderCompletionCard({ celebrate = false } = {}) {
    if (config.completionCard === false) return;
    const app = $("#app");
    if (!app) return;
    let host = $("#section-complete");
    const countable = unitSectionIds();
    const done = countable.filter((id) => isSectionDone(id));
    const unitDone = countable.length > 0 && done.length === countable.length;
    const isSection = countable.includes(route) && isSectionDone(route);
    const build = unitNumber >= 0 && route !== "teacher" && course && (isSection || (unitDone && route === "overview"));
    if (!build) { host?.remove(); return; }
    if (!host) { host = document.createElement("section"); host.id = "section-complete"; app.parentNode.insertBefore(host, app.nextSibling); }
    const unitNo = course.unit?.unitNo ?? unitNumber;
    const unitTitle = course.unit?.unitTitle || "";
    const labelOf = (id) => (navSections().find(([sid]) => sid === id) || [null, null, id])[2];
    let eyebrow, title, body, action;
    if (unitDone) {
      const nextUnit = config.nextUnit
        ? config.nextUnit(unitNumber, manifest)
        : (manifest?.units || []).find((unit) => Number(unit.number) === unitNumber + 1 && !String(unit.status || "").startsWith("Planned")) || null;
      const nextHref = nextUnit ? (nextUnit.href || (() => { const url = new URL(location.href); url.searchParams.set("unit", nextUnit.number); url.hash = "overview"; return url.href; })()) : "";
      const capstone = navSections().find(([id]) => gradeSections.includes(id));
      eyebrow = "Unit finished";
      title = `Unit ${unitNo} is finished. Brilliant work!`;
      body = unitTitle ? `Every section of “${unitTitle}” has a tick.` : "Every section has a tick.";
      if (nextUnit) {
        body += ` Unit ${nextUnit.number}${nextUnit.title ? `: ${nextUnit.title}` : ""} is next.`;
        action = `<a class="button gold" href="${escapeHtml(nextHref)}">Go on to Unit ${escapeHtml(nextUnit.number)} ${icon("arrow-right")}</a>`;
      } else if (capstone && !isSectionDone(capstone[0])) {
        body += ` That was the last unit — the ${capstone[2]} brings the whole stage together.`;
        action = `<button class="button gold" type="button" data-complete-go="${escapeHtml(capstone[0])}">Open the ${escapeHtml(capstone[2])} ${icon("arrow-right")}</button>`;
      } else {
        action = `<button class="button primary" type="button" data-complete-go="overview">Back to the overview ${icon("arrow-right")}</button>`;
      }
    } else {
      const next = countable.find((id) => !isSectionDone(id));
      eyebrow = "Section finished";
      title = `Well done! ${labelOf(route)} is finished.`;
      body = `That is ${done.length} of ${countable.length} sections in Unit ${unitNo} ticked.${next ? ` Next up: ${labelOf(next)}.` : ""}`;
      action = next ? `<button class="button primary" type="button" data-complete-go="${escapeHtml(next)}">Continue to ${escapeHtml(labelOf(next))} ${icon("arrow-right")}</button>` : "";
    }
    host.className = `section-complete ${unitDone ? "is-unit" : "is-section"}`;
    host.setAttribute("aria-labelledby", "section-complete-title");
    host.innerHTML = `<div class="section-complete-mark" aria-hidden="true">${icon(unitDone ? "trophy" : "check")}</div>
      <div class="section-complete-copy">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2 id="section-complete-title" tabindex="-1">${escapeHtml(title)}</h2>
        <p>${escapeHtml(body)}</p>
        ${action}
      </div>`;
    host.querySelector("[data-complete-go]")?.addEventListener("click", (event) => navigate(event.currentTarget.dataset.completeGo));
    paintIcons();
    if (celebrate) {
      host.scrollIntoView({ behavior: "smooth", block: "center" });
      requestAnimationFrame(() => host.querySelector("h2")?.focus({ preventScroll: true }));
    }
  }
  // navSections() lets a subject vary the nav list at runtime (english gates
  // `games` on a loaded gamePack and appends a unit-10-only `final-quiz`).
  const navSections = () => (config.visibleSections ? config.visibleSections() : sections);
  function updateProgress() {
    const countable = unitSectionIds();
    const done = countable.filter((id) => progress.completed.includes(id)).length;
    const value = countable.length ? Math.round(done / countable.length * 100) : 0;
    const valueEl = $("#progress-value"); if (valueEl) valueEl.textContent = `${value}%`;
    const fill = $("#progress-fill"); if (fill) fill.style.width = `${value}%`;
    const track = $(".progress-track"); if (track) { track.setAttribute("aria-valuenow", value); track.setAttribute("aria-valuetext", `${value} percent of this unit complete`); }
    if (value >= 100 && !unitCompletedSent) { unitCompletedSent = true; emitProgress({ type: "unit.completed", unit: PROGRESS_UNIT, sectionsDone: done, total: countable.length }); }
  }
  const isSectionDone = config.isSectionDone || ((id) => (gradeSections.includes(id) ? gradeProgress.completed.includes(id) : progress.completed.includes(id)));

  // --- unit guide: "how this unit works", drawn from what the shell already
  // knows ---------------------------------------------------------------------
  // The one place a learner is told what finishing a unit means. It reads the
  // SAME lists updateProgress() divides by — navSections() minus nonCountable —
  // so the checklist, the progress bar and the unit.completed event can never
  // disagree about which sections count. Overview itself is never listed: it is
  // the page this panel sits on.
  //
  // Returns HTML only. The button carries `data-go`, which every subject's
  // overview already binds (english completes Overview on it before navigating,
  // the others just navigate), so the panel inherits each subject's own rule for
  // leaving the overview rather than adding a second one.
  //
  // `isUnlocked(id)` is the hook for a subject that walks its sections in order
  // (english's section chain); the default treats every section as open.
  // `hints` is an optional {id: text} map of one-line "what to do here" notes.
  // `howToUse` is the unit's OWN instructions — a short array of learner-voice
  // sentences authored on the unit (`unit.howToUse`) for the few units whose
  // shape the generic checklist cannot explain: a capstone with no video, a
  // reading list where two texts are for listening. Most units carry none, and
  // the panel is complete without it.
  function unitGuide({ heading = "How this unit works", intro, rule, isUnlocked = () => true, hints = {}, howToUse = [], startLabel } = {}) {
    const rows = navSections().filter(([id]) => !nonCountable.includes(id) && id !== "overview");
    const done = rows.filter(([id]) => isSectionDone(id)).length;
    const next = rows.find(([id]) => !isSectionDone(id) && isUnlocked(id)) || null;
    const total = rows.length;
    const status = !total ? ""
      : done === total ? "All done! Every section has a tick."
      : done === 0 ? `There are ${total} sections to finish.`
      : `You have finished ${done} of ${total} sections.`;
    // Locked looks locked even when finished — the same rule the english nav
    // paints (paintSectionLocks): a tick inside a padlocked run reads as the
    // lock being broken. The completion still counts, and the row says so for
    // a screen reader.
    const items = rows.map(([id, sectionIcon, label]) => {
      const finished = isSectionDone(id);
      const locked = !isUnlocked(id);
      const current = next && next[0] === id;
      const state = locked ? "locked" : finished ? "done" : current ? "next" : "todo";
      const spoken = locked ? (finished ? "finished, opens again in order" : "locked, opens in order") : finished ? "finished" : current ? "up next" : "to do";
      const mark = locked ? "🔒" : finished ? "✓" : current ? "▶" : "";
      return `<li class="unit-guide-row is-${state}" data-guide-section="${escapeHtml(id)}">
        <span class="unit-guide-mark" aria-hidden="true">${mark}</span>
        ${icon(sectionIcon)}
        <span class="unit-guide-label">${escapeHtml(label)}<span class="sr-only">, ${spoken}</span>${hints[id] ? `<small>${escapeHtml(hints[id])}</small>` : ""}</span>
      </li>`;
    }).join("");
    const button = next
      ? `<button class="button primary" data-go="${escapeHtml(next[0])}" type="button">${escapeHtml(startLabel || (done ? `Continue with ${next[2]}` : `Start with ${next[2]}`))} ${icon("arrow-right")}</button>`
      : "";
    return `<section class="panel unit-guide" aria-labelledby="unit-guide-heading">
      <h2 id="unit-guide-heading">${escapeHtml(heading)}</h2>
      <p>${escapeHtml(intro || "Work through the sections below, one at a time. Each one gets a tick when it is finished.")}${rule ? ` ${escapeHtml(rule)}` : ""}</p>
      ${howToUse.length ? `<h3 class="unit-guide-subheading">Just for this unit</h3><ul class="unit-guide-howto">${howToUse.map((line) => `<li>${icon("info")}<span>${escapeHtml(line)}</span></li>`).join("")}</ul>` : ""}
      <ol class="unit-guide-list">${items}</ol>
      <p class="unit-guide-status"><strong>${escapeHtml(status)}</strong></p>
      ${button}
    </section>`;
  }

  function renderNav() {
    // Idempotent (it returns early once the button exists) and called here
    // rather than at boot because this is the first point at which the sidebar
    // is guaranteed to be in the document for every subject.
    mountSectionsSheet();
    const navItems = navSections().filter(([id]) => tutoringVisible(id)).map(([id, sectionIcon, label]) => ({ id, iconName: sectionIcon, label, active: route === id, done: isSectionDone(id) }));
    // "Get help with…" — the tutoring add-on's search page (shell/get-help.js).
    // Appended here rather than listed in any subject's sections so it can
    // neither gate nor count: it is a reference surface, and tutoring activity
    // stays out of course progress by decision (2026-08-24). Subjects opt in by
    // passing config.getHelp (a createGetHelp instance); done is always false
    // because there is nothing to complete.
    if (config.getHelp) {
      navItems.push({ id: "get-help", iconName: "life-buoy", label: "Get help", active: route === "get-help", done: false });
      // The active help session's home, shown only on its own target unit —
      // elsewhere the Get help page's resume card is the way back. Guarded:
      // sessionHere reads the loaded course, which a booting page lacks.
      let sessionHere = false;
      try { sessionHere = Boolean(config.getHelp.sessionHere?.()); } catch { /* not loaded yet */ }
      if (sessionHere) navItems.push({ id: "help-session", iconName: "compass", label: "Help session", active: route === "help-session", done: false });
    }
    $("#section-nav").innerHTML = sectionNavigation(navItems, { path: pathNav });
    $$('[data-route]').forEach((button) => button.addEventListener("click", () => { closeSectionsSheet(); navigate(button.dataset.route); }));
    const teacherSwitch = $("#teacher-switch");
    if (teacherSwitch) {
      teacherSwitch.classList.toggle("active", route === "teacher");
      if (!teacherSwitch.dataset.bound) { teacherSwitch.dataset.bound = "true"; teacherSwitch.addEventListener("click", () => navigate("teacher")); }
    }
    if (config.onNavRendered) config.onNavRendered();
    // The Study Plan is already in TUTORING_HIDDEN — dropped from the nav and
    // from the countable list — but every subject ALSO prints it in the unit
    // picker, which for this category is the door actually in front of the
    // learner, since the sidebar is gone. One school-run page, two doors, and
    // only one of them was shut. Pruned after onNavRendered because English
    // repaints its pickers there (english.js :: renderUnitPickers), so doing
    // it once at boot would not hold. The prerequisite entry is deliberately
    // left: a placement exam is not in TUTORING_HIDDEN and is a reasonable
    // thing for a search-driven learner to want.
    if (IS_TUTORING) {
      for (const option of $$('#unit-select option[value="year-plan"], #top-unit-select option[value="year-plan"]')) option.remove();
      paintTutoringSections();
    }
    // The nav repaints on its own — completing a section calls renderNav()
    // without a route change — so it cannot rely on renderRoute's sweep.
    paintIcons();
  }
  // --- focus mode: the lesson content owns the whole screen -----------------
  // (topbar + sidebar hidden via body.focus-mode; the floating Menu button or
  // Escape restores the navigation without changing the route).
  //
  // Focus mode is entered by a LEFT-NAV CLICK, or by booting on a URL that
  // carries ?focus=1 (get-help.js stamps every link it emits with this — a
  // tutoring visit is a targeted stop on one topic, never a browse of the
  // whole grade, so its destination should not hand the learner the full
  // topbar/sidebar/picker chrome). It is NOT entered by the lesson gate's
  // Start tile, which lands the learner on the overview where the grade and
  // unit pickers still need to be reachable — the gate takes the browser
  // fullscreen, this layout waits for the learner to choose a section or
  // arrive already knowing where they are going. (The reverse coupling is
  // real: leaving fullscreen always drops focus mode, so the two can never
  // strand the learner in a page with no navigation and no browser chrome.)
  function exitFocusMode() {
    document.body.classList.remove("focus-mode", "tutoring-nav");
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    // A manual exit is a standing choice — strip the URL's own door back to
    // focus mode so reloading this page (or coming back to it later) does
    // not silently re-enter a layout the learner just left.
    if (params.get("focus") === "1") {
      const url = new URL(location.href);
      url.searchParams.delete("focus");
      history.replaceState(null, "", url.href);
    }
  }
  // The Menu button is the only way back while the lesson gate's Keyboard Lock
  // is swallowing Escape, so it has to exist before the navigation disappears.
  function ensureFocusChrome() {
    if (document.getElementById("focus-exit")) return;
    const exitButton = document.createElement("button");
    exitButton.id = "focus-exit";
    exitButton.className = "focus-exit";
    exitButton.type = "button";
    exitButton.setAttribute("aria-label", "Show the menu and unit navigation");
    exitButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>';
    exitButton.addEventListener("click", exitFocusMode);
    document.body.appendChild(exitButton);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") exitFocusMode(); });
  }
  function enterFocusMode() {
    // The tutoring category hides the SIDEBAR only and keeps the topbar: its
    // grade and unit pickers are the roaming chrome this category was
    // deliberately given, and putting them behind a button would charge a tap
    // for every hop. It gets NO Menu button (owner, 2026-08-25) — hence no
    // ensureFocusChrome() here, so neither the button nor its Escape binding
    // exists for them, and nothing can reveal the sidebar this category is
    // meant not to have. No fullscreen request either: the page is not taking
    // the screen, only dropping a column, and a flip on every nav click would
    // be jarring.
    //
    // WHAT REPLACES THE SIDEBAR, since the v278 comment claimed the Menu
    // button was what made hiding it safe and that button is now gone: the
    // SEARCH is this category's route into a section, not the nav. Get-help's
    // topic chips deep-link straight to the teaching routes — measured on the
    // live bundle, one Mathematics query returned 63 chips pointing at
    // #lesson, #method, #examples and #explore, and English's point at
    // #reading, #dictionary, #grammar and #writing — and a help session's
    // learn step links its stops the same way. So the old comment
    // over-claimed: the sidebar was never how these learners got to
    // Vocabulary or Reading, which is why removing both costs them nothing.
    // What it does cost is the direct hop back to a RUNNING help session
    // mid-lesson; that returns via the search, their home route.
    if (IS_TUTORING) { document.body.classList.add("tutoring-nav"); return; }
    ensureFocusChrome();
    document.body.classList.add("focus-mode");
    // True fullscreen: the nav click is a user gesture, so the request is
    // allowed. Browsers that refuse (e.g. iPhone Safari) keep the CSS-only
    // full-viewport mode — the catch is deliberate.
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  }
  // Leaving browser fullscreen (the gate's Escape, browser UI, F11) restores
  // the navigation, so the two states never drift apart. Bound once at boot,
  // not lazily on first entry into focus mode: fullscreen can begin at the
  // gate, long before any nav click, and a listener registered afterwards
  // would have missed the exit that mattered.
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) document.body.classList.remove("focus-mode");
  });
  function navigate(next) {
    if (config.onNavigate) config.onNavigate();
    stopVoice(); route = next; location.hash = next;
    // Report the move. Without this, `resume` would only ever be written when
    // the learner COMPLETES something, which is the one moment it is least
    // interesting -- it would name the section they just left.
    //
    // This is a deliberate learner ACTION, never a timer, and the distinction
    // is load-bearing for the live group board: its whole sort is "time since
    // the learner's app last reported anything", so a periodic heartbeat would
    // make every open tab look busy and destroy the staleness signal. A
    // navigation is the learner doing something, so it belongs in that signal;
    // a clock tick does not.
    emitProgressSummary();
    enterFocusMode();
    renderNav(); renderRoute();
    $("#content")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- the tutoring picker offers PARTS OF THE COURSE ----------------------
  // What a learner picks from should be a thing they can be stuck on, and
  // whether the unit list is already that differs by subject. Mathematics'
  // titles ARE topics — "Probability", "Fractions: Halves" — so picking one and
  // searching it is a good question. English's and Intensive English's are
  // themes — "People and Work", "Who I Am" — and searching those finds the one
  // unit named that and nothing a learner wants. Same plumbing, opposite
  // usefulness, which is why this is not one behaviour for all six:
  //
  //   english, intensive-english   sections REPLACE the units
  //   the other four               sections are ADDED, units kept
  //
  // Removing a working unit search from Mathematics to make the six look alike
  // would be a regression dressed as consistency.
  //
  // WHICH sections are offered is derived, not listed. There used to be a table
  // here — six subjects, one array of ids each — and it was a hand-kept copy of
  // two things that both already know the answer:
  //
  //   the NAV    which sections THIS GRADE draws
  //   the INDEX  which sections the search can answer for
  //
  // A copy of somebody else's vocabulary is only as complete as the day it was
  // written, and nothing reports the difference. Both halves of that bill came
  // in within one day: `glossary` was added to English and was invisible to the
  // picker until the table was edited to admit it existed, and `ebooks` sat IN
  // the table with no topics behind it, so picking Books answered "No Books
  // lessons are indexed for grades 2-6" — an entry the table was confident about
  // and the searcher had never heard of.
  //
  // Derived, neither can happen: a new section with topics is offered the moment
  // it renders, and a section the index cannot answer for is never offered at
  // all. The order is the NAV's, so the picker reads down the page the learner
  // is looking at — which is also how `glossary` ends up last without anyone
  // deciding it should, it being a reference page rather than a part of the
  // course to be stuck on.
  const SECTIONS_REPLACE_UNITS = new Set(["english", "intensive-english"]);
  // The subject's OWN wording, never a second copy of it. Intensive English
  // calls `dictionary` "Words" and `grammar` "Patterns" where English says
  // "Vocabulary" and "Grammar", and a menu that renamed them would describe a
  // nav the learner does not have. Global Perspectives' rows are 4-tuples
  // (a render predicate trails the label); every subject keeps the label at
  // index 2, which is what makes one lookup work for all six.
  const tutoringSectionLabel = (id) => {
    const list = typeof config.sections === "function" ? config.sections() : (config.sections || []);
    const row = list.find((entry) => entry[0] === id);
    return row ? row[2] : id;
  };
  // What the topic index can answer for, once. null until it has been asked.
  // Held here rather than fetched per paint because paintTutoringSections runs
  // on EVERY nav render, and the answer is a property of the subject and the
  // learner's stage window, not of the render.
  let searchableSections = null;
  let searchableAsked = false;
  function askWhatIsSearchable() {
    if (searchableAsked || !config.getHelp?.sectionsWithTopics) return;
    searchableAsked = true;
    Promise.resolve()
      .then(() => config.getHelp.sectionsWithTopics())
      .then((ids) => {
        if (!ids || !ids.size) return;
        searchableSections = ids;
        // The nav has already been drawn by now, and the paint that started this
        // deliberately painted nothing, so this is the one that fills the picker
        // in. Nothing else will call it: a nav render is what normally repaints,
        // and there may never be another one.
        paintTutoringSections();
      })
      .catch(() => { /* no index, no section search — the units stay as they are */ });
  }

  // Repainted after onNavRendered on every nav render rather than once at boot,
  // because English rebuilds its own pickers there (english.js ::
  // renderUnitPickers, called from onNavRendered AND onReady) and would
  // otherwise put the unit list straight back.
  //
  // The idempotence test asks what the picker CONTAINS, not whether it was
  // painted before. A `data-` marker was tried and is wrong: renderUnitPickers
  // does `picker.innerHTML = options`, which replaces the options while the
  // attribute sits on the <select> and survives — so the guard read "already
  // done" over a picker whose sections had just been wiped, and English showed
  // units again from the first nav render onward. Correct at boot, wrong from
  // the first click, which is exactly the shape that reads as intermittent.
  // Asking for a `section:` option cannot go stale that way: whatever wipes it
  // also clears the answer, and the next render repaints.
  function paintTutoringSections() {
    if (!config.getHelp) return;
    // Only the sections THIS GRADE draws, in the order it draws them. A nav
    // entry is the grade's own answer to "does this section exist here",
    // produced by the code that actually draws it, so it cannot drift from what
    // renders — which a per-grade table would, English drawing Books at 1-4 for
    // a school learner and at every grade for a tutoring one.
    //
    // An empty nav means it has not been drawn yet, not that the grade has no
    // sections, so the picker is left untouched rather than painted with
    // nothing — the next nav render repaints it.
    const live = $$("[data-route]").map((el) => el.dataset.route);
    if (!live.length) return;
    // …and only the sections the SEARCH can answer for. Until the index says
    // otherwise this is null, and null means "not known yet" rather than
    // "none": painting the nav unfiltered for a moment would put eight dead
    // entries in front of a Mathematics learner (its nav draws 16 sections and
    // 5 carry topics), so nothing is painted until the answer arrives. That is
    // the honest degradation as well as the tidy one — if the index cannot be
    // loaded at all, section search cannot work either, and every entry the
    // picker could offer would be an entry that finds nothing.
    if (!searchableSections) { askWhatIsSearchable(); return; }
    const offered = live.filter((id) => searchableSections.has(id));
    if (!offered.length) return;
    const replace = SECTIONS_REPLACE_UNITS.has(config.subjectKey);
    const options = offered
      .map((id) => `<option value="section:${id}">${escapeHtml(tutoringSectionLabel(id))}</option>`).join("");
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) {
      if (!picker || picker.querySelector('option[value^="section:"]')) continue;
      if (replace) {
        // The prerequisite entry is kept, exactly as Mathematics keeps it: a
        // placement exam is a reasonable thing for a search-driven learner to
        // want, and it is the one entry here that is a PLACE rather than a topic.
        // -1 is PREREQ_UNIT (shell/placement.js), written as a literal because
        // the shell has no other use for that module and the value is already
        // hard-coded into every subject's option markup, which is what this
        // reads back.
        const prereq = picker.querySelector('option[value="-1"]')?.outerHTML || "";
        picker.innerHTML = prereq + options;
        // Nothing is selected on purpose: the shell loaded some unit behind this
        // page and none of these options describes it, so a selected entry would
        // be a claim about where the learner is. The placeholder asks instead.
        picker.insertAdjacentHTML("afterbegin", '<option value="" selected disabled>What are you stuck on?</option>');
        picker.setAttribute("aria-label", "Choose what you are stuck on");
      } else {
        // Units stay, and stay SELECTED — they are this subject's best topics and
        // the picker still reports which unit the shell has open. The sections go
        // above them in their own group, so the two axes are visibly different
        // things rather than one flat list of eleven.
        picker.insertAdjacentHTML("afterbegin", `<optgroup label="Parts of a lesson">${options}</optgroup>`);
      }
    }
  }

  // --- the tutoring category's topbar pickers SEARCH, they do not navigate ---
  // For a school learner the Stage and Unit pickers are position: "take me to
  // Unit 9". The tutoring category holds no position — the unit the shell
  // loaded behind the search page is an arbitrary landing — so the same two
  // controls mean something else there, and every subject was reading them the
  // school way: each binds `location.href = "?stage=…&unit=…#overview"`, which
  // both discards the topic the learner just named AND rebuilds the query
  // string from scratch, dropping ?category= and the ?pwsToken= that carries
  // the claim. So picking "Unit 9: Probability" landed a tutoring learner in
  // the ordinary course UI, no longer tutoring at all. (Owner, 2026-08-26.)
  //
  // ONE overlay in the shell rather than a tutoring branch in six subject
  // files, the same shape and for the same reason as tutoringWehelOptions
  // above. It is a CAPTURE-phase listener on `document`: the subjects bind
  // their own handlers directly on the <select>, so the only way to take the
  // event off them without holding a reference to six differently-shaped
  // closures is to stop it while it is still on the way down. stopPropagation
  // (not stopImmediate — the listener is on `document`, they are on the
  // element) keeps it from ever reaching them.
  //
  // Anything this does NOT claim still reaches the subject untouched, and the
  // two that matter are deliberate: "Stage Study Plan" (value "year-plan") and
  // "Prerequisite: Placement exam" (value PREREQ_UNIT, negative) are places,
  // not topics, so they navigate exactly as they did.
  function tutoringPickerSearch() {
    if (!IS_TUTORING || !config.getHelp) return;
    // "Unit 4: Addition and Subtraction (1)" -> "Addition and Subtraction".
    // The prefix is a course COORDINATE and the parenthesised tail is which
    // half of a split topic this unit holds; neither is a word anybody is
    // stuck on, and both only dilute the query. The status suffixes English
    // and Intensive English print are stripped too — those options carry
    // `disabled`, so no change event can fire from one, but the label is read
    // here rather than assumed.
    //
    // The separator is subject-specific and both forms must be matched: five
    // subjects write "Unit 1: Research", Global Perspectives writes
    // "Unit 1 — Research". Matching the colon alone leaves GP searching for
    // the literal words "Unit 1", which score nothing and dilute the title
    // that does.
    const topicOf = (option) => (option?.textContent || "")
      .replace(/^\s*🔒\s*/, "")
      .replace(/^\s*Unit\s+\d+\s*[:—–-]\s*/i, "")
      .replace(/\s*[—-]\s*(review only|not yet written)\s*$/i, "")
      .replace(/\s*\((?:locked|\d+)\)\s*$/i, "")
      .trim();
    const searchHere = (query) => {
      // render() writes into #app, so the page has to exist before the query
      // can go into its box — a picker used mid-lesson routes there first.
      if (route !== "get-help") navigate("get-help");
      config.getHelp.search(query);
      $("#gh-query")?.focus();
    };
    document.addEventListener("change", (event) => {
      const picker = event.target;
      if (!picker || picker.tagName !== "SELECT") return;
      // The stage axis is named differently by subject (#stage-select,
      // #grade-select, #level-select) but they all carry this one class, which
      // is what makes this overlay subject-agnostic.
      if (picker.classList.contains("top-grade-picker")) {
        const stage = Number(picker.value);
        if (!Number.isFinite(stage) || stage < 1) return;
        event.stopPropagation();
        // Order matters: record the stage first, so if we still have to route
        // to the search page its first render already draws the new window.
        config.getHelp.setStage(stage);
        if (route !== "get-help") navigate("get-help");
        return;
      }
      if (picker.id !== "unit-select" && picker.id !== "top-unit-select") return;
      // English's section picker (paintTutoringSections). Handled before the
      // unit test because these values are not numbers and would otherwise fall
      // through to the subject's own handler and navigate.
      if (String(picker.value).startsWith("section:")) {
        const id = picker.value.slice("section:".length);
        const label = topicOf(picker.selectedOptions[0]);
        event.stopPropagation();
        if (route !== "get-help") navigate("get-help");
        config.getHelp.searchSection(id, label);
        return;
      }
      // Everything except the two non-topic entries: "year-plan" is not a
      // number at all, and the prerequisite is PREREQ_UNIT (-1). Zero is NOT
      // one of them — Intensive English Level 1 opens on a real "Unit 0: The
      // Sounds That Are Hard", so a `< 1` guard silently sends that one unit
      // back down the school path while its neighbours search.
      const unit = Number(picker.value);
      if (!Number.isFinite(unit) || unit < 0) return;
      const topic = topicOf(picker.selectedOptions[0]);
      if (!topic) return;
      event.stopPropagation();
      searchHere(topic);
    }, true);
  }
  tutoringPickerSearch();
  // shared/course-shell.js :: icon() emits <i data-lucide> for EVERY subject, and
  // the runtime replaces those elements in place — so it has to run after
  // anything that paints, and a subject that never calls it shows blank icons
  // wherever the shell drew one. English called it from its own module and the
  // other four never did, which is why their sidebars and page headers were
  // empty. Calling it here covers whatever the shell renders, for every subject;
  // English's own sweep still runs and is harmless, since createIcons only ever
  // converts what is still an <i>.
  // A declaration, not a const: renderNav() sweeps too, and it is defined and
  // reachable earlier in this closure than this line runs.
  function paintIcons() { window.lucide?.createIcons({ attrs: { "stroke-width": 2.2 } }); }

  function renderRoute() {
    if (config.onBeforeRender) config.onBeforeRender();
    $("#app").innerHTML = "";
    // The shared help page dispatches ahead of the subject's renderers, so it
    // is reachable from anywhere — including a unit English's gate has locked.
    // Deliberate, and the same standing #teacher has always had: the page
    // teaches nothing itself, it only points at units, and every link it emits
    // goes through the subject's own door (English's carry ?review=1).
    if (route === "get-help" && config.getHelp) config.getHelp.render();
    else if (route === "help-session" && config.getHelp) config.getHelp.renderSession();
    else (config.renderers[route] || config.renderers.overview)();
    if (!config.disableShellVoice) bindVoiceControls();
    renderCompletionCard();
    if (config.onAfterRender) config.onAfterRender();
    paintIcons();
  }

  // --- Wehel dock ----------------------------------------------------------
  // The tutor is most useful mid-struggle — stuck on a practice question,
  // lost halfway through an explainer — but as a nav section it can only be
  // reached by leaving the page you are stuck on, and focus mode hides the nav
  // altogether. The dock puts the same chat one tap from every page. It mounts
  // over the SAME store as the section, so the two are one conversation, and
  // it tells Wehel which page the learner is on so "I don't get this" has a
  // referent.
  //
  // Deliberately quiet: no proactive popups, no attract animation, no
  // unsolicited messages. It sits still until a learner reaches for it.
  const DOCK_STYLE = `
  .wehel-dock-button{position:fixed;right:12px;bottom:10px;z-index:70;display:inline-flex;align-items:center;gap:6px;
    padding:7px 12px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:.82rem;font-weight:600;
    color:#fff;background:linear-gradient(135deg,#7c3aed,#4f46e5);box-shadow:0 4px 14px rgba(49,46,129,.3)}
  .wehel-dock-button svg{width:15px;height:15px}
  .wehel-dock-button:hover{transform:translateY(-1px)}
  .wehel-dock-button:focus-visible{outline:3px solid #c4b5fd;outline-offset:2px}
  .wehel-dock-button[hidden]{display:none}
  /* The pill floats over the bottom-right ~200x50px of every page. Reserve
     that footprint at the end of the app column so the LAST control on a
     page (Submit, Finish, a deck's closing button) can always scroll clear
     of it — on the final screen there is otherwise nothing left to scroll.
     Page-level and dock-gated: it changes no section's own layout, and a
     page without the dock gets no padding. */
  body.has-wehel-dock #app{padding-bottom:56px}
  .wehel-dock-backdrop{position:fixed;inset:0;z-index:71;background:rgba(15,23,42,.45);border:0;padding:0;cursor:pointer}
  .wehel-drawer{position:fixed;top:0;right:0;bottom:0;z-index:72;width:min(420px,100vw);display:flex;flex-direction:column;
    background:var(--surface,#fff);color:inherit;box-shadow:-8px 0 30px rgba(15,23,42,.22);border-left:1px solid rgba(15,23,42,.12)}
  .wehel-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;
    border-bottom:1px solid rgba(15,23,42,.12)}
  .wehel-drawer-head h2{margin:0;font-size:calc(1.02rem - 1px);line-height:1.25}
  .wehel-drawer-head small{display:block;font-weight:400;opacity:.7;font-size:calc(.8rem - 1px)}
  .wehel-drawer-close{border:0;background:transparent;color:inherit;font-size:1.5rem;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}
  .wehel-drawer-close:hover{background:rgba(15,23,42,.08)}
  .wehel-drawer-body{flex:1;overflow-y:auto;padding:14px 16px;font-size:calc(1rem - 1px)}
  .wehel-drawer-body button,.wehel-drawer-body input{font:inherit}
  .wehel-drawer-body .ai-prompts button{font-size:13px}
  .wehel-drawer-body .ai-message strong{font-size:12px}
  @media (max-width:640px){
    .wehel-drawer{width:100vw;top:auto;height:88vh;border-left:0;border-top-left-radius:16px;border-top-right-radius:16px}
    .wehel-dock-button span{display:none}
    .wehel-dock-button{padding:14px;border-radius:50%}
  }
  @media print{.wehel-dock-button,.wehel-drawer,.wehel-dock-backdrop{display:none}}`;

  const SPARKLE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>';

  function mountWehelDock() {
    if (!config.wehelOptions) return;
    const style = document.createElement("style");
    style.textContent = DOCK_STYLE;
    document.head.appendChild(style);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "wehel-dock-button";
    button.setAttribute("aria-label", "Ask Wehel Tutor");
    button.innerHTML = `${SPARKLE_ICON}<span>Wehel Tutor</span>`;

    let drawer = null, backdrop = null, chatPanel = null;
    // A direct topic-chip click — no guided help session started — still
    // carries the chip's own label and the search that found it, on the URL
    // (get-help.js :: defaultHrefFor / english.js :: placementLocation).
    // Read once per page load, same as every other get-help marker (focus,
    // review, topic): it names THIS landing, not a standing preference, so it
    // is gone the moment the learner navigates anywhere else. Never on the
    // get-help route itself — that page is about a NEW question, and a marker
    // that survived a hash navigation back to it would describe the old one.
    const ghHint = () => {
      if (route === "get-help") return null;
      const label = params.get("ghLabel");
      return label ? { label, query: params.get("ghQuery") || "" } : null;
    };
    // A tutoring learner ON the search page: their context is what they just
    // typed they are stuck on, read live from the search box — not the unit
    // the shell loaded behind the page, which for this category is an
    // arbitrary landing. Tutoring only: a school learner's dock on this page
    // keeps meaning "my current unit", which is their actual position.
    const searchHint = () => {
      if (!IS_TUTORING || route !== "get-help") return null;
      const q = config.getHelp?.searchQuery?.();
      return q ? { label: "Get help search", query: q } : null;
    };
    // The section label for the route the learner is on — what the drawer
    // reports to Wehel as context. Read at send time, not at mount time, so it
    // stays right as the learner moves around with the drawer open.
    const sectionHint = () => {
      // The help-session route never equals a real section id — the walk
      // stays on "help-session" throughout — so the generic lookup below
      // always misses here. get-help.js's own hint carries the section the
      // session's search actually landed on; ghHint covers the same case for
      // a bare topic-chip visit, which never reaches "help-session" at all;
      // searchHint covers a tutoring learner still on the search page.
      const hint = (route === "help-session" ? config.getHelp?.sessionHint?.() : null) || ghHint() || searchHint();
      if (hint) return hint.label;
      const match = (config.visibleSections ? config.visibleSections() : sections).find(([id]) => id === route);
      return match ? match[2] : "";
    };
    // Finer than the page: the exact item on screen, for the Virtual teacher
    // persona. A Grade 1-4 deck marks the visible slide by leaving it the only
    // one NOT inert (deck.js :: syncReachable) and labels every slide
    // ("Question 3 of 6"); the slide's heading and first words name the item.
    // Nothing is read from the deck's own "How to use these slides" intro.
    // Grades 5-8 grid pages carry no gc-* nodes by rule, so this is the empty
    // string there and the teacher works from the section. Read at send time.
    const activityHint = () => {
      // Finer still than the section: the exact topic the learner searched
      // for, plus the words they searched with — what "this activity" means
      // for a help session, the same way a deck's current slide names it for
      // a Grades 1-4 lesson page.
      const hint = (route === "help-session" ? config.getHelp?.sessionHint?.() : null) || ghHint() || searchHint();
      if (hint) return [hint.label, hint.query ? `searched: "${hint.query}"` : ""].filter(Boolean).join(" — ");
      const slide = document.querySelector(".gc-slide:not([inert])");
      if (!slide) return "";
      const label = (slide.getAttribute("aria-label") || "").trim();
      if (/^How to use/i.test(label)) return "";
      const title = slide.querySelector(".gc-title, h2, h3")?.textContent?.replace(/\s+/g, " ").trim() || "";
      // The slide's eyebrow repeats the label and its heading repeats the
      // title — drop both from the snippet so the 200 chars carry the item.
      let rest = (slide.textContent || "").replace(/\s+/g, " ").trim();
      for (const piece of [label, title]) if (piece) rest = rest.split(piece).join(" ");
      rest = rest.replace(/\s+/g, " ").trim();
      return [label, title, rest.slice(0, 140)].filter(Boolean).join(" — ").slice(0, 200);
    };

    // The tutoring category never hears "unit": those learners arrived by
    // SEARCHING a topic, not by walking a course, so "Unit N" is a coordinate
    // in somebody else's map. One overlay here rewrites every subject's
    // greeting/placeholder/quick prompts for that category — built from the
    // same topic context the hints above carry — instead of six subject files
    // each maintaining a second voice. School learners get the subject's own
    // options untouched. meta.learnerCategory also rides to the endpoint
    // (askWehel), where the prompt's framing correction reads it.
    const tutoringWehelOptions = (base) => {
      if (!IS_TUTORING || !base) return base;
      const hint = (route === "help-session" ? config.getHelp?.sessionHint?.() : null) || ghHint() || searchHint();
      const topic = hint && hint.label !== "Get help search" ? hint.label : "";
      const query = hint?.query || "";
      const name = topic || query;
      return {
        ...base,
        meta: { ...base.meta, learnerCategory: "tutoring" },
        greeting: name
          ? `Hello! I am Wehel Tutor. I can see you are working on "${name}"${topic && query && query !== topic ? ` — you searched for "${query}"` : ""}. Want me to teach it, quiz you on it, or explain it another way?`
          : `Hello! I am Wehel Tutor. Tell me what you are stuck on — a topic, a homework question, anything — and we will work on it together.`,
        placeholder: name ? `Ask about ${name}…` : "Ask about anything you are stuck on…",
        quickPrompts: [
          { label: "Teach me this", message: name ? `Teach me about ${name}, step by step.` : "Teach me the topic I am stuck on, step by step — I will tell you what it is." },
          { label: "Quiz me", message: name ? `Quiz me on ${name}, one question at a time.` : "Quiz me on this lesson, one question at a time." },
          { label: "Explain more simply", message: name ? `Can you explain ${name} in a simpler way?` : "Can you explain this lesson in a simpler way?" },
          { label: "Help with homework", message: "Can you help me with my homework? I will tell you the question." },
        ],
      };
    };

    function close() {
      if (!drawer) return;
      drawer.remove(); backdrop?.remove();
      drawer = null; backdrop = null; chatPanel = null;
      button.hidden = false;
      button.focus();
    }

    function open() {
      if (drawer) return;
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "wehel-dock-backdrop";
      backdrop.setAttribute("aria-label", "Close Wehel Tutor");
      backdrop.addEventListener("click", close);

      drawer = document.createElement("aside");
      drawer.className = "wehel-drawer";
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-label", "Wehel Tutor");
      drawer.innerHTML = `<div class="wehel-drawer-head">
          <h2>Wehel Tutor<small>Ask about anything on this page</small></h2>
          <button type="button" class="wehel-drawer-close" aria-label="Close Wehel Tutor">&times;</button>
        </div><div class="wehel-drawer-body"></div>`;
      drawer.querySelector(".wehel-drawer-close").addEventListener("click", close);

      document.body.append(backdrop, drawer);
      button.hidden = true;
      // A subject edge case (a stub unit, a data shape this page doesn't
      // carry) must degrade to a closed drawer, never a dead button.
      try {
        chatPanel = mountWehelChat({
          container: drawer.querySelector(".wehel-drawer-body"),
          sectionHint,
          // The section's id as well as its label: the stored Grade 1 teacher
          // scripts are keyed by id, read at send time like the hint.
          sectionId: () => route,
          activityHint,
          ...tutoringWehelOptions(config.wehelOptions()),
        });
      } catch (error) {
        console.error(error);
        close();
        toast("Wehel Tutor is not available on this page.");
        return;
      }
      drawer.querySelector("#wehel-input")?.focus();
    }

    button.addEventListener("click", open);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && drawer) close(); });
    document.body.classList.add("has-wehel-dock");
    document.body.appendChild(button);
  }

  // Where a picker sends the learner. Built from the CURRENT url and then
  // trimmed, never rebuilt from scratch: the query string carries the launch
  // (?pwsToken=, ?pwsEndpoint=, on which the remote progress backend depends)
  // and the category claim (?category=). Mathematics, Science and Computing
  // each wrote `location.href = "?stage=…&unit=…#overview"`, which silently
  // dropped all three — so a tutoring learner who picked the Study Plan or the
  // placement exam arrived as an ordinary school learner, sidebar and all,
  // which is the same symptom the unit picker had for a different reason.
  // English (courseLocation), Intensive English (unitLocation) and Global
  // Perspectives already did it this way; this is that helper, once.
  //
  // The five deletions are get-help's own landing markers plus English's
  // review flag. Each names the ONE unit the learner was SENT to, so none may
  // ride along to a unit they then chose for themselves — without this the
  // Wehel dock's ghHint() would keep reporting the old topic. They used to go
  // free, as a side effect of throwing the whole query string away.
  const courseHref = (unit, hash = "overview", stage = stageNumber) => {
    const url = new URL(location.href);
    url.searchParams.set(config.param, stage);
    url.searchParams.set("unit", unit);
    for (const marker of ["review", "topic", "focus", "ghLabel", "ghQuery"]) url.searchParams.delete(marker);
    url.hash = hash;
    return url.href;
  };

  // --- ctx: the surface the subject's renderers close over ------------------
  const ctx = {
    courseHref,
    $, $$, escapeHtml, icon, voiceButton, pageHeader, toast,
    // "tutoring" for the tutoring-support category (see launchCategory above),
    // "" for a regular learner. Subjects read it for their own category
    // behaviour — English stands its sequential gate down and shows the grade
    // picker, because this learner roams grades by design.
    learnerCategory: IS_TUTORING ? "tutoring" : "",
    // readAlongLinesHtml: wraps a text's lines in the .rd-line spans a
    // voiceButton's data-readalong selector then walks. See the read-along
    // block above.
    readAlongLinesHtml, readAlongSpans,
    complete, completeGradeSection, saveProgress, saveGradeProgress,
    // speakText: a word card's ♪ button narrates on demand rather than through
    // a voiceButton, so the renderer calls this directly. It was missing here,
    // which made science's Science Words listen button a ReferenceError in
    // every shell release since v110 — it worked in the standalone copy only
    // because speakText was a module-scope function there.
    // stopVoice: a slide deck silences the current narration when the learner
    // swipes to the next slide. navigate() already does this on a route change,
    // but a deck changes what is on screen without changing route.
    navigate, emitProgress, bindVoiceControls, updateVoiceUI, renderNav, renderRoute, speakText, stopVoice,
    unitSectionIds, updateProgress, unitGuide, stageNumber, unitNumber, params, dataRootUrl,
    STORAGE_KEY, STAGE_STORAGE_KEY, PROGRESS_UNIT,
    progress, gradeProgress,
    manifest: undefined, course: undefined, gradeCapstone: undefined,
    // Every unit the server knows about, keyed as `u00`…`u10`, or null when the
    // course is running per-device. The resume below only needs the unit being
    // opened; a subject that gates on whether EARLIER units are finished needs
    // them all, and localStorage cannot answer that on a device the learner has
    // not used before. Populated before config.load() so a subject can decide
    // what to fetch from it.
    remoteUnits: null,
    get route() { return route; },
  };

  // Remote resume (cross-device): in remote mode, pull the server's state
  // document on boot and seed the local progress store from it before first
  // render — completed sections, known words, and (empty-slot-only) drafts
  // follow the learner to this device. Offline or gateway-down degrades
  // silently to the local per-device resume.
  async function hydrateRemoteResume() {
    if (progressWS.backend !== "remote") return;
    try {
      const doc = await progressWS.hydrate();
      // Published before the early return below. A learner opening a unit they
      // have never touched has no record for it, and that is exactly the case a
      // unit gate has to reason about — bailing here would hand the subject
      // nothing precisely when it needs the other units most.
      ctx.remoteUnits = (doc && doc.units) || null;
      const unit = doc && doc.units && doc.units[PROGRESS_UNIT];
      if (!unit) return;
      let changed = false;
      for (const s of unit.sectionsDone || []) {
        if (!progress.completed.includes(s)) { progress.completed.push(s); changed = true; }
      }
      if (Array.isArray(unit.knownWords) && unit.knownWords.length && Array.isArray(progress.knownWords)) {
        for (const w of unit.knownWords) if (!progress.knownWords.includes(w)) { progress.knownWords.push(w); changed = true; }
      }
      // Drafts: fill only slots this device has no local draft for (local edits win).
      if (unit.drafts && progress.writing && typeof progress.writing === "object") {
        for (const [key, draft] of Object.entries(unit.drafts)) {
          const id = key.startsWith("writing:") ? key.slice(8) : key;
          if (draft && draft.text && !progress.writing[id]) { progress.writing[id] = draft.text; changed = true; }
        }
      }
      if (changed) storageSet(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* offline / gateway unreachable → per-device resume */ }
  }

  async function init() {
    try {
      // Hydration runs BEFORE the data load, not after. It reads nothing the
      // load produces (progressWS, the progress store and PROGRESS_UNIT are all
      // ready at boot), and load() is the point where a subject decides what to
      // fetch — english's Grade 1 unit gate skips a locked unit's data
      // entirely, so it has to know the server's answer first. Both were
      // already awaited before the first render, so the order costs no time.
      await hydrateRemoteResume();
      const loaded = await config.load(ctx); // { manifest, course, gradeCapstone? }
      manifest = loaded.manifest; course = loaded.course; gradeCapstone = loaded.gradeCapstone;
      ctx.manifest = manifest; ctx.course = course; ctx.gradeCapstone = gradeCapstone; // concrete refs for renderers
      config.bind(ctx);
      await config.onReady(ctx); // title, pickers
      $("#loading")?.remove();
      $("#app").hidden = false;
      renderNav(); updateProgress(); renderRoute();
      mountWehelDock();
      // A get-help link opens straight into focus mode — see enterFocusMode's
      // comment. Fullscreen itself is refused this way (no user gesture on a
      // page load), which enterFocusMode already treats as fine: the CSS-only
      // chrome-hidden layout still applies either way.
      //
      // The TUTORING category gets it on EVERY page (owner, 2026-08-25), not
      // only on a get-help link. The left sidebar is the reason: its course
      // context states a school position these learners do not have
      // ("Grade 5 · English · Term 2") and its unit menu is course browsing,
      // which is not their path — they arrive by searching a topic. Reusing
      // focus mode rather than hiding the sidebar separately is deliberate:
      // the floating Menu button comes with it, so the section nav is one tap
      // away instead of gone, and a nav click re-enters focus exactly as it
      // does for everyone else. Pressing Menu is therefore a peek, not a mode
      // — which is also why nothing needs to remember that they pressed it.
      if (IS_TUTORING || params.get("focus") === "1") enterFocusMode();
    } catch (error) {
      console.error(error);
      const target = $("#loading") || $("#app");
      target.hidden = false;
      target.innerHTML = `<p><span class="status-note">We could not prepare the lesson.</span><br>${escapeHtml(error.message)}</p>`;
    }
  }

  window.addEventListener("hashchange", () => {
    const next = location.hash.slice(1);
    // Back/forward and a pasted link reach a section without going through
    // navigate(), so they report here for the same reason it does.
    if (next && next !== route) { route = next; emitProgressSummary(); renderNav(); renderRoute(); }
  });
  // Ehel Academy logo: back to the learner's Moodle dashboard. pwsEndpoint
  // carries the Moodle host on a real launch; derive the dashboard from its
  // origin the same way seb-session.js derives its "I'm leaving" link. Local
  // dev/preview carries no pwsEndpoint, so the logo keeps its #overview jump —
  // there is no dashboard to send it to.
  const brandLink = $(".brand");
  if (brandLink && launchEndpoint) {
    try { brandLink.href = new URL(launchEndpoint).origin + "/local/hubredirect/student_dashboard.php"; }
    catch { /* keep #overview */ }
  }
  // Subjects with their own audio engine (english: file-based reading + TTS/STT)
  // opt out of the shell voice UI entirely via config.disableShellVoice.
  if (!config.disableShellVoice) {
    const voiceToggle = $("#voice-toggle");
    if (voiceToggle) voiceToggle.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      storageSet(`${STORAGE_KEY}-voice-enabled`, String(voiceEnabled));
      if (!voiceEnabled) stopVoice();
      updateVoiceUI();
      toast(voiceEnabled ? "Voice Guide is on." : "Voice Guide is off.");
    });
    updateVoiceUI();
  }
  init();

  return ctx;
}
