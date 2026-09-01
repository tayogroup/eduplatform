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

  // --- the board nav ---------------------------------------------------------
  // EVERY grade and stage draws its section list as the BOARD -- a grid of
  // coloured tiles with stickers, padlocks and a you-are-here ring -- rather
  // than as a list in a sidebar. Owner, 2026-09-01: "extend the new UI to the
  // remaining grades."
  //
  // That REVERSES the split the owner set earlier the same day ("the current
  // design will be used for grades 5 and up"), and it reverses the argument
  // this comment used to carry -- that a trail of beads is a six-year-old's
  // affordance, not a thirteen-year-old's. Both are recorded rather than
  // deleted, because the next person to read `= 8` should be able to see that
  // the number was argued down as well as up.
  //
  // WHAT THIS DOES NOT TOUCH, and the distinction is the whole reason the
  // change is safe: the hard rule that Grades/Stages 5-8 keep their design is
  // about section CONTENT -- the deck (gc-*, shell/deck.js) must never replace
  // an upper stage's grids, tabs and two-column labs, and DECK_MAX_STAGE still
  // says 4 in every subject. This constant governs NAVIGATION only. An upper
  // stage still renders every section exactly as it did; it is reached from a
  // different menu.
  //
  // ONE constant, and it lives here rather than in each subject, because unlike
  // DECK_MAX_STAGE this decides nothing but paint: no route, no gate, no count.
  // Every subject reaches this line -- English included, which renders its own
  // sections but takes nav, boot and routing from this core.
  //
  // Levelled courses are STILL excluded, and now they are the only exclusion
  // left. Intensive English sends its CEFR LEVEL as the stage, so a comparison
  // here would be measuring the wrong thing whatever the number is -- the
  // owner was asked and kept it out (2026-09-01).
  const PATH_NAV_MAX_STAGE = 8;
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
  // The class is still called `young-stage`, and the name is now wider than
  // its meaning: since the board went to every grade it reads "this course is
  // staged, not levelled". Kept rather than renamed because it is the hook for
  // ~60 rules in course-ui.css, including the phone sections-sheet block that
  // predates the board -- a rename is pure churn in a stylesheet several
  // sessions share, and it would touch none of the behaviour. The gate is
  // live, not vestigial: Intensive English still fails it.
  document.documentElement.classList.toggle("young-stage", pathNav);

  // The sticker board (owner, 2026-09-01) splits the learner's nav into
  // LESSON tiles and META rows -- Overview, the study plan, the grown-up guide,
  // and the "my stuff" routes are things a learner visits once or a parent reads,
  // not steps of the unit, so they sit under the board as quiet pills rather
  // than as equal-looking tiles. ONE definition: the CSS keys on the .nav-quiet
  // class this set produces, and the album count excludes the same class, so
  // the two cannot disagree about what counts as a sticker. Ids missing from a
  // subject simply never match -- teacherguide, live and reflect are English's.
  const STICKER_QUIET_ROUTES = new Set(["overview", "unit-plan", "teacherguide", "capstone", "live", "reflect", "get-help", "help-session"]);

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
  function openSectionsSheet() {
    if (!sectionsToggle || sheetOpen()) return;
    // Painted on OPEN rather than on every renderNav: the album is only
    // visible while the board is, and opening is the one moment the nav-state
    // ticks are guaranteed final -- english's paintSectionLocks rewrites them
    // after renderNav, so a count taken mid-render would read relocked rows
    // as done.
    paintStickerAlbum();
    document.body.classList.add("sections-open");
    sectionsToggle.setAttribute("aria-expanded", "true");
    // Opening puts the learner at the top of their own board rather than
    // wherever the sheet happened to be scrolled to. The sheet's scroll
    // container is the sidebar at desktop widths and the nav on the phone,
    // so both are reset.
    const sidebar = $(".sidebar"); if (sidebar) sidebar.scrollTop = 0;
    const nav = $("#section-nav"); if (nav) nav.scrollTop = 0;
  }
  // The album row: one star slot per lesson tile, filled as sections finish.
  // Derived from the painted nav rather than from progress directly, so it can
  // never disagree with the ticks under it -- including english's rule that a
  // finished-but-relocked section reads as not-done.
  function paintStickerAlbum() {
    const album = document.getElementById("sticker-album");
    if (!album) return;
    const lesson = $$("#section-nav .nav-button:not(.nav-quiet)");
    const doneOf = (button) => Boolean(button.querySelector(".nav-state.done"));
    const doneCount = lesson.filter(doneOf).length;
    const slots = lesson.map((button) => doneOf(button) ? '<span class="slot full" aria-hidden="true">★</span>' : '<span class="slot empty" aria-hidden="true"></span>').join("");
    album.innerHTML = `<b>Unit/Sections</b><span class="album-slots">${slots}</span><span class="album-count">${doneCount} of ${lesson.length} stickers</span>`;
  }
  // Start lands on the BOARD, not on "Welcome to School" (owner, 2026-09-01).
  // The gate's Start is the young learner's first tap, and the page behind it
  // used to be the overview -- a page of prose about how the unit works. The
  // board is the answer to the question that tap is asking ("where do I go?"),
  // so it opens over the overview; closing it (Escape, the pill, or picking a
  // tile) reveals the overview exactly as before, so nothing is lost.
  //
  // A launch that names a SECTION keeps its promise: get-help's deep links and
  // any #hash arrive wanting one place, and a board over the top of it would
  // be chrome in the way. Only a plain launch -- no hash, or the overview
  // itself -- gets the board.
  //
  // The race is real and both sides are handled: the gate paints before any
  // data load, so Start can fire before renderNav has built the nav (toggle
  // not yet mounted -> remember and open on the first paint), or after it
  // (open now). Note the gate only renders where fullscreen is supported, so
  // an iPhone learner never fires this and simply lands on the overview with
  // the board pill at the foot -- the pre-existing behaviour.
  let boardOnGateStart = false;
  // The board is worth offering only where it has something to show. A locked
  // unit's nav is ONE row, and a one-tile board says less than the page behind
  // it; the tutoring category has no board by design, and a levelled course
  // (Intensive English) is not pathNav at all.
  const boardCanOpen = () => pathNav && !IS_TUTORING && Boolean(sectionsToggle) && $$("#section-nav .nav-button:not(.nav-quiet)").length > 1;
  document.addEventListener("lesson-gate:start", () => {
    if (!pathNav || IS_TUTORING) return;
    const hash = (location.hash || "").replace(/^#/, "");
    if (hash && hash !== "overview") return;
    if (sectionsToggle) { if (boardCanOpen()) openSectionsSheet(); }
    else boardOnGateStart = true;
  });
  // "I'm leaving", pressed on a content page, means leaving the PAGE — not the
  // app (owner, 2026-09-01). The dialog belongs to the focus-mode session bar
  // (shared/seb-session.js), which knows nothing about the board, so it asks
  // here: a PROBE while it draws the dialog, so the button can say "Send and go
  // back" instead of promising an exit it is not going to make, and the real
  // call on the press.
  //
  // Answering only when the board can actually open is what keeps that promise
  // honest — a levelled course, the tutoring category and a locked unit all
  // leave `handled` false and get the old behaviour untouched.
  //
  // openSectionsSheet() is called here rather than left to exitFocusMode's own
  // board-open, which cannot fire on this path: that one is guarded on the body
  // still carrying `focus-mode`, and the listener below has already stripped it
  // — leaving fullscreen is what raised this dialog in the first place. It is
  // idempotent, so calling both is safe.
  document.addEventListener("ehel:leave-to-board", (event) => {
    const detail = event.detail;
    // Not when the board is ALREADY what they are looking at. The dialog can be
    // raised from the board itself — that is where leaving the app is a real
    // thing to be doing — and claiming it there would answer "I'm leaving" by
    // returning the learner to the page they are standing on, with no way out
    // of the course at all. Somewhere to go back TO is the whole condition.
    if (!detail || sheetOpen() || !boardCanOpen()) return;
    detail.handled = true;
    if (detail.probe) return;
    exitFocusMode({ fromLeaveDialog: true });
    openSectionsSheet();
  });
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
    sectionsToggle.innerHTML = `${icon("star")}<span>Unit/Sections</span>`;
    sectionsToggle.addEventListener("click", () => { if (sheetOpen()) closeSectionsSheet(); else openSectionsSheet(); });
    sidebar.insertBefore(sectionsToggle, sidebar.firstChild);
    // The album row lives between the opener and the nav; display:none except
    // while the board is open, so every other stage and width never sees it.
    const album = document.createElement("div");
    album.id = "sticker-album";
    sidebar.insertBefore(album, sectionsToggle.nextSibling);
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
  //
  // A subject may EXEMPT a row from this list (`config.tutoringShows`) and may
  // not add to it. Subtraction only, and that is the whole design: the list
  // stays written once, a subject states only the row it differs on, and the
  // two readers below still share one value -- so no exemption can put the nav
  // and the search out of step with each other, which is what the note further
  // down is protecting.
  //
  // The one exemption today is English's `capstone`, which stopped being a row
  // about a whole-stage project on 2026-08-31 and became that UNIT's own recap
  // (see renderUnitRecap in shell/subjects/english.js). The reason this category
  // could not see it -- "a learner who arrives with one problem and no course
  // position is not helped by a whole-stage project" -- is a true statement
  // about the page that used to be there. What is there now is a summary of
  // what the unit teaches, which is orientation, and orientation is precisely
  // what arriving from a search without a position leaves you short of. The
  // other five subjects still mean a stage project by `capstone` and are
  // untouched.
  const TUTORING_HIDDEN_ROWS = ["unit-plan", "year-plan", "live", "capstone", "capstonequiz"];
  const TUTORING_HIDDEN = TUTORING_HIDDEN_ROWS.filter((id) => !(config.tutoringShows || []).includes(id));
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
  // The caption for a route, or "" when the route is not a section (get-help,
  // teacher) or the subject does not caption it. Empty rather than the id, so
  // the receiver can tell "no caption" from "captioned as its id" and choose.
  const sectionLabelOf = (id) => {
    if (!id) return "";
    const list = typeof config.sections === "function" ? config.sections() : (config.sections || []);
    for (const entry of list || []) {
      // Every subject declares these as ARRAYS -- [route, icon, label], with an
      // optional fourth availability predicate (Global Perspectives' grown-up
      // guide). The first version of this read entry.route / entry.title,
      // which an array does not have, so it matched nothing and returned ""
      // for every route: `resumeLabel` was omitted from every summary and four
      // releases shipped a field that was never once sent. The server said so
      // the whole time -- resumeLabel stayed null -- and I read that as a stale
      // bundle rather than as the feature not working.
      //
      // The object branch is kept because two section shapes already exist in
      // this file (the nav cards at the bottom of english.js are objects), and
      // the next one to be passed here should not repeat this.
      if (Array.isArray(entry)) {
        if (entry[0] === id) return typeof entry[2] === "string" ? entry[2] : "";
      } else if (entry && entry.route === id) {
        return typeof entry.title === "string" ? entry.title : "";
      }
    }
    return "";
  };
  const nonCountable = config.nonCountable || ["overview"];
  const gradeSections = config.gradeSections || [];

  // --- state ---------------------------------------------------------------
  let manifest, course, gradeCapstone;
  // Tutoring learners land on the search, not the unit overview — coming with
  // a problem rather than a curriculum position is their defining trait.
  let route = location.hash.slice(1) || (IS_TUTORING && config.getHelp ? "get-help" : "overview");
  // A plain landing on a young learner's overview opens the BOARD (owner,
  // 2026-09-01, extending the gate-Start decision): switching unit or grade in
  // the topbar is a full page reload, and the gate does not re-show
  // mid-session, so a learner who picked "Unit 3" from the dropdown arrived on
  // the overview with the board shut and no pill to open it. The rule that
  // covers every such arrival is the landing itself, not how it happened --
  // Start, the dropdowns, or a reload all end here. Excluded, each for its own
  // reason: a #hash names a section and keeps its promise; ?focus=1 boots
  // straight into a lesson (a board under focus mode is two answers to one
  // question); tutoring has no board; unit < 1 is the placement exam, whose
  // page is not the board's unit. The flag rides the same deferred flush as
  // the gate event -- renderNav's end, after english's lock pass -- and that
  // flush now also refuses a board with nothing on it (a LOCKED unit's nav is
  // one row, and a one-tile board says less than the locked page behind it).
  if (pathNav && !IS_TUTORING && unitNumber >= 1 && params.get("focus") !== "1" && (route === "overview")) boardOnGateStart = true;
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
    onAuthLost: (info) => showSessionExpired(info),
    onDeliveryFailing: (info) => showDeliveryProblem(info),
    onDeliveryRecovered: () => clearNotice("delivery-problem"),
  });
  let unitCompletedSent = false;
  const emitProgress = (event) => { try { progressWS.emit(event); } catch { /* never break the lesson */ } };
  // A POSITION REPORT IS SENT NOW, not on the idle timer.
  //
  // `progress.summary` is a "state" event, so it waits up to 20s for a quiet
  // moment; `section.completed` is durable and posts instantly. That asymmetry
  // predates the live group board and was right when the only consumer was
  // resume-across-devices, where 20 seconds is nothing.
  //
  // It is wrong for a board whose entire question is "where is this learner
  // RIGHT NOW". Measured on production: a learner moved through a unit for 14
  // minutes and the server's pointer never left the section they had last
  // COMPLETED, because only completions were flushing. The tile told a teacher
  // the learner was somewhere they had already left.
  //
  // flush() coalesces onto any in-flight request (`if (flushing) return
  // flushing`), so clicking quickly through five sections is one or two POSTs,
  // not five -- the same shape completions already have, at the same cost.
  const reportPosition = () => {
    emitProgressSummary();
    try { progressWS.flush?.(); } catch { /* never break the lesson */ }
  };
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
  const CHAT_ENDPOINT = platformUrl("/local/hubredirect/course_group_chat.php");

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
      button.textContent = up ? "✋ Hand up" : "✋ Raise hand";
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

  // --- the classroom chat, the learner's end --------------------------------
  // Step 3 of the escalation ladder, which named a group chat the platform did
  // not have. The room is ASYMMETRIC by safeguarding design ("no student-to-
  // student messaging", stated twice in the requirements and gated by
  // check-class-group-chat.php): the teacher's messages reach everyone, this
  // learner's reach the teacher alone — and their own bubble says so, because
  // a child must never believe the class read something the class cannot read.
  //
  // Mounts only when the server says the room exists and is enabled — the
  // Raise-hand rule. The server derives WHICH room from the roster; the app
  // never names a group.
  function mountClassChat() {
    const actions = $(".top-actions");
    if (!actions || !launchToken || !launchEndpoint || $("#class-chat-toggle")) return;

    // text/plain keeps this a SIMPLE request (no preflight), the hand's trick;
    // a fetch rather than a beacon because the reply carries the messages.
    const post = (body) => fetch(CHAT_ENDPOINT, {
      method: "POST", mode: "cors", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ token: launchToken, ...body }),
    }).then((response) => (response.ok ? response.json() : null)).catch(() => null);

    let lastId = 0;
    let open = false;
    let unread = false;
    let panel = null;
    let msgsEl = null;
    let button = null;

    // NOTIFY, not just mark. The unread dot alone assumes a child scans the
    // topbar; a five-year-old deep in an exercise does not. So a new message
    // from someone else pulses the button and plays one soft two-note chime.
    // The chime is Web Audio (no asset, no permission dialog); browsers gate
    // audio behind a user gesture, so a blocked context fails silently and the
    // pulse still carries the signal. One chime per quiet period -- the flag
    // resets when the panel opens -- because a repeating ping during a lesson
    // is noise, not notice.
    let chimed = false;
    let audioCtx = null;
    const chime = () => {
      if (chimed) return;
      chimed = true;
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const at = audioCtx.currentTime;
        [[523.25, 0], [659.25, 0.16]].forEach(([freq, delay]) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.0001, at + delay);
          gain.gain.exponentialRampToValueAtTime(0.06, at + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + delay + 0.35);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(at + delay);
          osc.stop(at + delay + 0.4);
        });
      } catch (e) { /* never break the lesson; the pulse still shows */ }
    };
    // The pulse needs @keyframes, which inline styles cannot carry. The style
    // tag ships inside this module (not course-ui.css), so the shared-
    // stylesheet coupling is untouched, and it respects reduced-motion.
    if (!document.getElementById("class-chat-pulse-style")) {
      const st = document.createElement("style");
      st.id = "class-chat-pulse-style";
      st.textContent = "@keyframes ccPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}"
        + ".cc-pulse{animation:ccPulse .9s ease-in-out 4}"
        + "@media (prefers-reduced-motion: reduce){.cc-pulse{animation:none}}";
      document.head.appendChild(st);
    }

    const paintButton = () => {
      button.textContent = unread ? "💬 Class chat •" : "💬 Class chat";
      button.title = unread
        ? "Your teacher wrote something new."
        : "Talk to your teacher. The class sees what your teacher writes; only your teacher sees what you write.";
      button.style.background = unread ? "#1a67a3" : "white";
      button.style.color = unread ? "#fff" : "";
    };

    const append = (list) => {
      if (!list || !list.length) return;
      let sawOther = false;
      const nearBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 60;
      for (const m of list) {
        if (m.id <= lastId) continue;
        lastId = Math.max(lastId, m.id);
        if (!m.mine) sawOther = true;
        if (m.screenshot) {
          appendShotBubble(m);
          continue;
        }
        const el = document.createElement("div");
        // Inline styles for the same reason the hand button carries them:
        // course-ui.css is bundled into all six subjects' releases, so one
        // cosmetic rule there makes five other app tiers stale.
        el.style.cssText = "max-width:92%;padding:" + PAD + ";border-radius:" + RADIUS + "px;"
          + "font-size:" + FS + "px;line-height:1.45;"
          + (m.mine
            ? "align-self:flex-end;background:#d7ecff;border-bottom-right-radius:6px;"
            : "background:#f2f4f6;border-bottom-left-radius:6px;");
        // An announcement is the teacher's raised voice: full-width banner, so
        // "everyone stop and listen" cannot be mistaken for conversation.
        if (m.announcement) {
          el.style.cssText = "max-width:100%;padding:" + (YOUNG ? "12px 15px" : "10px 13px") + ";"
            + "border-radius:" + RADIUS + "px;font-size:" + FS + "px;line-height:1.45;"
            + "background:#052c65;color:#fff;font-weight:700;";
          el.innerHTML = '<span style="display:block;font-size:10px;letter-spacing:.06em;'
            + 'text-transform:uppercase;opacity:.85;margin-bottom:3px">\uD83D\uDCE2 Teacher Message!</span>'
            + escapeHtml(m.body);
          msgsEl.appendChild(el);
          continue;
        }
        if (m.mine && m.toteacheronly) el.style.cssText += "background:#fff3cd;border:2px solid #ffe69c;";
        // No "(teacher)" suffix — the server sends staff as "Teacher" outright,
        // so the suffix would double it. Students arrive as first names.
        const who = m.mine ? "" : `<b style="display:block;font-size:11px;opacity:.75">${escapeHtml(m.name)}</b>`;
        const note = m.mine && m.toteacheronly
          ? '<small style="display:block;font-size:10px;color:#664d03;margin-top:3px">Only your teacher can see this</small>' : "";
        // An answer-to-class arrives with the question and without the asker.
        // The asker's own panel says "You asked" -- they know; nobody else does.
        const quote = m.quote
          ? `<span style="display:block;font-size:11px;font-style:italic;opacity:.8;border-left:3px solid #9ec5fe;padding-left:6px;margin-bottom:4px">${m.quote.mine ? "You asked" : "Someone asked"}: ${escapeHtml(m.quote.body)}</span>` : "";
        el.innerHTML = who + quote + escapeHtml(m.body) + note;
        msgsEl.appendChild(el);
      }
      if (nearBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
      if (sawOther && !open) {
        unread = true;
        paintButton();
        chime();
        button.classList.add("cc-pulse");
        setTimeout(() => button.classList.remove("cc-pulse"), 4000);
      }
    };

    // THE STUDENT'S GO LIVE, beside Raise hand. The server sends the group's
    // class on today's calendar with every chat poll -- the same lookup the
    // teacher's Go live uses, so the two ends cannot disagree about which
    // session is due. The link lands on live_sessions.php, which owns the join
    // window, approval states and waiting room; this button only says THAT
    // there is a class and WHEN, never re-implements whether joining is
    // allowed. Removed again when the calendar empties, so it can never offer
    // a class that is over -- the Raise-hand rule, applied to a link.
    let liveBtn = null;
    const paintLive = (sess) => {
      const actions = $(".top-actions");
      if (!sess || !sess.id || !actions) {
        if (liveBtn) { liveBtn.remove(); liveBtn = null; }
        return;
      }
      if (!liveBtn) {
        liveBtn = document.createElement("a");
        liveBtn.id = "class-go-live";
        liveBtn.className = "top-grade-picker top-class-live";
        liveBtn.target = "_blank";
        liveBtn.rel = "noopener";
        liveBtn.style.cssText = "width:auto;padding:8px 12px;cursor:pointer;border-radius:999px;"
          + "text-decoration:none;display:inline-flex;align-items:center";
        liveBtn.href = platformUrl("/local/hubredirect/live_sessions.php");
        actions.prepend(liveBtn);
      }
      // joinable, not due: due is the TEACHER'S lead (be in the room first);
      // a child's red button must mean the door will actually open. The
      // mismatch shipped and was caught by the owner's first real class.
      if (sess.joinable) {
        liveBtn.textContent = "🔴 Join class";
        liveBtn.title = "Your class is ready. Press to join your teacher.";
        liveBtn.style.background = "#b02a37";
        liveBtn.style.color = "#fff";
        liveBtn.style.borderColor = "#b02a37";
      } else {
        const when = new Date(sess.start * 1000);
        const hh = ("0" + when.getHours()).slice(-2) + ":" + ("0" + when.getMinutes()).slice(-2);
        liveBtn.textContent = "🔴 Class at " + hh;
        liveBtn.title = "Your class starts at " + hh + ". The button turns red when you can join.";
        liveBtn.style.background = "white";
        liveBtn.style.color = "";
        liveBtn.style.borderColor = "";
      }
    };

    const poll = async (body) => {
      const state = await post(body ? { body, since: lastId } : { since: lastId });
      if (state && state.ok && state.enabled) {
        append(state.messages);
        paintLive(state.livesession);
      }
      return state;
    };

    // A screenshot bubble: the image is fetched lazily per message through the
    // same door, which re-runs the visibility check -- so a bubble and its
    // pixels can never diverge in who may see them. "Expired" is a real state:
    // images age out after 30 days while the message row stays.
    const appendShotBubble = (m) => {
      const el = document.createElement("div");
      el.style.cssText = "max-width:92%;padding:" + PAD + ";border-radius:" + RADIUS + "px;"
        + "font-size:" + (FS - 1) + "px;"
        + (m.mine ? "align-self:flex-end;background:#fff3cd;border:2px solid #ffe69c;" : "background:#f2f4f6;");
      el.innerHTML = (m.mine ? "" : `<b style="display:block;font-size:11px;opacity:.75">${escapeHtml(m.name)}</b>`)
        + '<span>📷 Screenshot</span>'
        + (m.mine ? '<small style="display:block;font-size:10px;color:#664d03;margin-top:3px">Only your teacher can see this</small>' : "");
      msgsEl.appendChild(el);
      post({ image: m.id }).then((img) => {
        if (!img || !img.ok) return;
        if (img.gone) { el.querySelector("span").textContent = "📷 Screenshot (expired)"; return; }
        const pic = document.createElement("img");
        pic.src = "data:image/jpeg;base64," + img.jpegbase64;
        pic.alt = "Screenshot";
        pic.style.cssText = "display:block;max-width:100%;border-radius:8px;margin-top:4px";
        el.insertBefore(pic, el.querySelector("small"));
        el.querySelector("span").remove();
      });
    };

    // THE CAPTURE IS A RENDER OF THE LESSON PAGE'S OWN DOM -- deliberately not
    // the browser screen-capture API, whose picker lets a five-year-old share
    // the family's whole desktop. This can only contain what the app renders
    // and what the child typed into it; that boundary is the safeguarding
    // design, and the preview below is the child seeing exactly what the
    // teacher will see before anything is sent.
    //
    // html2canvas is vendored beside lucide and lazy-loaded by deriving its URL
    // from the lucide script tag already on every page -- correct in local dev
    // and under v{TAG}/ alike, and the 200KB only ever loads when a child
    // presses the camera.
    const loadCapturer = () => new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const lucideTag = document.querySelector('script[src*="lucide.min.js"]');
      if (!lucideTag) return reject(new Error("no anchor"));
      const tag = document.createElement("script");
      tag.src = lucideTag.src.replace(/lucide\.min\.js.*$/, "html2canvas.min.js");
      tag.onload = () => (window.html2canvas ? resolve(window.html2canvas) : reject(new Error("no symbol")));
      tag.onerror = () => reject(new Error("load failed"));
      document.head.appendChild(tag);
    });

    const shotFailNote = (text) => {
      if (!msgsEl) return;
      const note = document.createElement("div");
      note.textContent = text;
      note.style.cssText = "align-self:flex-end;font-size:11px;color:#664d03;background:#fff3cd;"
        + "border:1px solid #ffe69c;border-radius:8px;padding:4px 8px";
      msgsEl.appendChild(note);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    };

    const captureAndPreview = async (cameraBtn) => {
      cameraBtn.disabled = true;
      try {
        const h2c = await loadCapturer();
        const target = document.querySelector("#content") || document.body;
        const canvas = await h2c(target, { logging: false, useCORS: false, scale: 1 });
        // Downscale to <=1280 wide, JPEG at 0.7: the server caps at 500KB
        // decoded and a retina render of a full page is several megabytes.
        const w = Math.min(1280, canvas.width);
        const scaled = document.createElement("canvas");
        scaled.width = w;
        scaled.height = Math.round(canvas.height * (w / canvas.width));
        scaled.getContext("2d").drawImage(canvas, 0, 0, scaled.width, scaled.height);
        const dataUrl = scaled.toDataURL("image/jpeg", 0.7);

        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;z-index:70;background:rgba(10,30,45,.75);"
          + "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px";
        overlay.innerHTML = '<div style="color:#fff;font:700 14px system-ui,sans-serif">'
          + "Send this picture to your teacher? Your teacher will see exactly this.</div>"
          + '<img alt="Preview" style="max-width:min(720px,92vw);max-height:60vh;border-radius:10px;'
          + 'box-shadow:0 10px 40px rgba(0,0,0,.4)" src="' + dataUrl + '">'
          + '<div style="display:flex;gap:10px">'
          + '<button type="button" data-shot-send style="border:1px solid #1a67a3;background:#1a67a3;color:#fff;'
          + 'border-radius:10px;padding:10px 20px;font:700 14px system-ui,sans-serif;cursor:pointer">Send to teacher</button>'
          + '<button type="button" data-shot-cancel style="border:1px solid #fff;background:transparent;color:#fff;'
          + 'border-radius:10px;padding:10px 20px;font:700 14px system-ui,sans-serif;cursor:pointer">Cancel</button></div>';
        document.body.appendChild(overlay);
        overlay.querySelector("[data-shot-cancel]").addEventListener("click", () => overlay.remove());
        overlay.querySelector("[data-shot-send]").addEventListener("click", async () => {
          overlay.remove();
          const state = await post({ screenshot: dataUrl, since: lastId });
          if (state && state.ok && state.enabled) {
            append(state.messages);
          }
          // A refused shot must SAY so -- a picture that silently never
          // appears is the same wound as every silent failure fixed today.
          if (!state || !state.ok || state.shotrejected) {
            shotFailNote("The picture did not send. Try again, or describe the problem in a message.");
          }
        });
      } catch (e) {
        shotFailNote("The picture could not be taken. You can describe the problem in a message instead.");
      } finally {
        cameraBtn.disabled = false;
      }
    };

    // CHILD-FRIENDLY SIZING, keyed on html.young-stage exactly as the
    // Raise-hand button already is: Grades/Stages 1-4 get bigger type, fatter
    // tap targets and rounder everything, because the audience is five and the
    // failure mode of small controls is a child who gives up rather than one
    // who complains. Upper stages keep a calmer version of the same skin.
    // Inline styles throughout for the standing reason: one cosmetic rule in
    // the shared stylesheet makes five other subjects' app tiers stale.
    const YOUNG = document.documentElement.classList.contains("young-stage");
    const FS = YOUNG ? 16 : 14;      // message text
    const PAD = YOUNG ? "10px 14px" : "8px 11px";
    const RADIUS = YOUNG ? 18 : 12;  // bubble corners

    const buildPanel = () => {
      panel = document.createElement("div");
      panel.id = "class-chat-panel";
      panel.style.cssText = "position:fixed;right:12px;bottom:74px;z-index:55;"
        + "width:min(" + (YOUNG ? 360 : 330) + "px,94vw);"
        + "max-height:60vh;display:none;flex-direction:column;background:#fdfdfb;"
        + "border:2px solid #bcd9f0;border-radius:" + (RADIUS + 4) + "px;"
        + "box-shadow:0 10px 34px rgba(16,64,102,.22);overflow:hidden";
      // The header is the sky gradient the app's own banners use, and it says
      // the whole privacy rule in words a child reads: who can see what.
      panel.innerHTML = '<div style="padding:' + (YOUNG ? 13 : 10) + 'px 15px;'
        + 'background:linear-gradient(90deg,#cfe9ff,#e9f6ff);border-bottom:2px solid #bcd9f0">'
        + '<div style="font-weight:900;font-size:' + (FS + 1) + 'px;color:#0a2c47">\uD83D\uDCAC Class chat</div>'
        + '<div style="font-weight:600;font-size:' + (FS - 4) + 'px;color:#3d6a8c;margin-top:1px">'
        + 'Everyone sees your teacher. Only your teacher sees you.</div></div>'
        + '<div id="class-chat-msgs" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;'
        + 'flex-direction:column;gap:9px;min-height:110px;background:#fdfdfb"></div>'
        + '<form id="class-chat-form" style="display:flex;gap:8px;padding:11px 13px;'
        + 'border-top:2px solid #e3eef7;background:#f4f9fd">'
        + '<button type="button" id="class-chat-shot" title="Send a picture of this page to your teacher" '
        + 'style="border:2px solid #bcd9f0;background:#fff;border-radius:999px;'
        + 'padding:' + (YOUNG ? "9px 13px" : "7px 11px") + ';font-size:' + (FS + 2) + 'px;cursor:pointer;line-height:1">\uD83D\uDCF7</button>'
        + '<input id="class-chat-input" type="text" maxlength="1200" autocomplete="off" placeholder="Ask your teacher…" '
        + 'style="flex:1;border:2px solid #bcd9f0;border-radius:999px;padding:' + (YOUNG ? "9px 15px" : "7px 13px") + ';'
        + 'font:inherit;font-size:' + FS + 'px;min-width:0;background:#fff">'
        + '<button type="submit" style="border:none;background:#1a67a3;color:#fff;border-radius:999px;'
        + 'padding:' + (YOUNG ? "9px 18px" : "7px 15px") + ';font:inherit;font-size:' + FS + 'px;font-weight:800;cursor:pointer">Send</button></form>';
      document.body.appendChild(panel);
      msgsEl = panel.querySelector("#class-chat-msgs");
      const shotBtn = panel.querySelector("#class-chat-shot");
      shotBtn.addEventListener("click", () => captureAndPreview(shotBtn));
      panel.querySelector("#class-chat-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const inputEl = panel.querySelector("#class-chat-input");
        const text = (inputEl.value || "").trim();
        if (!text) return;
        inputEl.value = "";
        poll(text);
      });
    };

    post({}).then((state) => {
      if (!state || !state.ok || state.enabled === false) return;
      button = document.createElement("button");
      button.type = "button";
      button.id = "class-chat-toggle";
      button.className = "top-grade-picker top-class-chat";
      // young-stage sizing comes from the class; the radius makes it read as a
      // friendly pill next to Raise hand rather than another form control.
      button.style.cssText = "width:auto;padding:8px 12px;cursor:pointer;border-radius:999px";
      paintButton();
      buildPanel();
      append(state.messages);
      // Anything already in the room counts as read history, not news.
      unread = false;
      paintButton();
      button.addEventListener("click", () => {
        open = !open;
        panel.style.display = open ? "flex" : "none";
        if (open) {
          unread = false;
          chimed = false;
          button.classList.remove("cc-pulse");
          paintButton();
          poll();
          msgsEl.scrollTop = msgsEl.scrollHeight;
          panel.querySelector("#class-chat-input")?.focus();
        }
      });
      actions.prepend(button);
      paintLive(state.livesession);
      // Polled CLOSED as well as open, so a teacher's "everyone stop and
      // listen" reaches a child who never opened the panel — the unread dot is
      // the whole point of the broadcast half. ONE fixed cadence: a ternary on
      // `open` here would be evaluated once, at mount, when open is always
      // false — a dynamic cadence that does not exist. Opening the panel polls
      // immediately instead (the click handler above), which is the moment a
      // faster poll was for.
      setInterval(() => { if (!document.hidden) poll(); }, 15000);
    });
  }
  mountClassChat();
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
      // THE NAME THE LEARNER SEES, beside the id the code uses. English's
      // `dictionary` route is captioned "Vocabulary" in the nav, `lecture` is
      // "Video lesson", `teacherguide` is "Teacher & Parent Guide" -- so a
      // board printing the raw id shows a teacher a word that appears nowhere
      // on the child's screen, and reads as wrong even when it is right.
      //
      // Sent rather than mapped server-side because the caption is per subject
      // and per grade (navLabelOf), and a copy of it in PHP would be a second
      // vocabulary to drift. The app is captioning the nav anyway; this is the
      // same string.
      resumeLabel: sectionLabelOf(route) || undefined,
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

  // Younger learners need it slower (owner, 2026-08-28: Stages 1-4 read too
  // fast). The pacing lives in the PLAYER rather than in the render, because
  // the pre-rendered clips carry no speed of their own — tools/lib/ehel-tts.js
  // sends none, so every clip on the CDN is at the voice's natural 1x, and a
  // render-time fix would re-bill all of them AND leave the ones already on the
  // CDN at the old pace. One constant, gated on the stage, never per section.
  //
  // Levels are not stages, so Intensive English gets its own band rather than
  // being read as "Stages 1-2". It runs this same shell with param "level" and
  // two levels, and its learners are adults and older teenagers (the manifest's
  // own `audience`), so what makes it hard to follow is PROFICIENCY, not age.
  // The two levels are a real progression — Level 1 is CEFR A1-A2 (beginner and
  // elementary), Level 2 is B1 (intermediate) — so they take the two bands in
  // order. Flattening both onto 0.80 would read a whole course as one band and
  // hand a B1 learner the pace built for a five-year-old.
  const NARRATION_RATE = config.param === "level"
    ? (stageNumber <= 1 ? 0.80 : 0.85)
    : stageNumber <= 2 ? 0.80
    : stageNumber <= 4 ? 0.85
    : 1;
  // Stages 1-4 therefore ask the voice for its natural speed and let the player
  // do the slowing, so a runtime chunk and a pre-rendered clip on the same page
  // sound alike. Stages 5+ are untouched — paced at render time as before, and
  // played at 1. Counting stays the same fraction slower than prose either way
  // (0.78 / 0.90 = 0.87), which is what keeps the number-sequence slowdown
  // meaningful instead of merely absolute.
  const PROSE_SPEED = NARRATION_RATE < 1 ? 1 : 0.90;
  const COUNTING_SPEED = NARRATION_RATE < 1 ? 0.87 : 0.78;
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
        return { text: `${/[.!?;:]$/.test(pacedPiece) ? pacedPiece : `${pacedPiece}.`} <break time="0.65s" />`, speed: isCounting ? COUNTING_SPEED : PROSE_SPEED, isCounting };
      });
    });
    const chunks = [];
    let current = "";
    for (const line of pacedLines) {
      if (line.isCounting) { if (current) chunks.push({ text: current, speed: PROSE_SPEED }); current = ""; chunks.push({ text: line.text, speed: line.speed }); }
      else if (`${current} ${line.text}`.trim().length <= maximum) current = `${current} ${line.text}`.trim();
      else { if (current) chunks.push({ text: current, speed: PROSE_SPEED }); current = line.text; }
    }
    if (current) chunks.push({ text: current, speed: PROSE_SPEED });
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
      // Set per source, not once: stopVoice() calls load(), which resets
      // playbackRate to defaultPlaybackRate, so a rate set at boot survives
      // exactly until the learner stops one clip.
      voicePlayer.playbackRate = NARRATION_RATE;
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

  // THE LAUNCH TOKEN HAS EXPIRED (or been revoked). The learner carries on
  // working and nothing reaches the server -- and until this existed, nothing
  // said so: the flush threw, the events queued, and the teacher's board watched
  // them go quiet while they worked. "Gone" is precisely the signal that board
  // is read for, so the silence did not merely lose data, it manufactured a
  // false alarm.
  //
  // Deliberately NOT a toast. The one above clears itself in 2.4 seconds, which
  // the comment beside it already calls out as too little for something a
  // learner must act on. This follows the completion card instead: drawn
  // outside #app, because renderers rewrite #app.innerHTML on every route and
  // anything inside would vanish on the next repaint.
  //
  // It says RE-OPEN, never "reload": reloading this URL replays the same
  // expired token and fails identically. A fresh token only comes from a fresh
  // launch.
  //
  // Nothing is lost, and the wording says so because it is true -- the outbox
  // keeps every event, so a new launch delivers the work that could not be sent.
  // One notice bar, two conditions. Drawn outside #app for the reason the
  // completion card is: renderers rewrite #app.innerHTML on every route, so
  // anything inside vanishes on the next repaint.
  function showNotice(id, message) {
    if (document.getElementById(id)) return;
    const bar = document.createElement("div");
    bar.id = id;
    bar.setAttribute("role", "status");
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;gap:12px;"
      + "align-items:center;justify-content:center;flex-wrap:wrap;padding:12px 18px;"
      + "background:#fff3cd;color:#664d03;border-top:2px solid #ffe69c;"
      + "font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 -2px 10px rgba(0,0,0,.08)";
    const text = document.createElement("span");
    text.textContent = message;
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Hide";
    close.style.cssText = "border:1px solid #664d03;background:transparent;color:inherit;"
      + "border-radius:999px;padding:4px 14px;font:inherit;cursor:pointer";
    close.addEventListener("click", () => bar.remove());
    bar.append(text, close);
    document.body.appendChild(bar);
  }
  function clearNotice(id) { document.getElementById(id)?.remove(); }

  function showSessionExpired() {
    showNotice("session-expired",
      "Your lesson session has timed out, so new work is not being saved. "
      + "Open this lesson again from your dashboard — nothing you have done is lost.");
  }

  // THE WRITE PATH IS FAILING and it is not the token. Measured on production
  // 2026-08-29: a browser extension refused the POST before it was sent
  // (ERR_BLOCKED_BY_CLIENT), so nothing reached the server, nothing appeared in
  // any log, and every server-side check reported the stored data as correct --
  // because the writes never arrived to be wrong.
  //
  // The learner is the only one who can be told. A server receiving nothing
  // cannot tell a blocked learner from a closed tab, so the teacher's board
  // renders them as GONE, which is the one signal it exists to act on. Being
  // silent here does not merely lose data, it manufactures a false alarm about
  // a child who is sitting there working.
  //
  // Offline gets its own sentence. A learner on a train has lost nothing and
  // needs no alarm; one whose extension is eating the writes needs to know the
  // school cannot see their work. Identical to the code, opposite to a family.
  function showDeliveryProblem(info) {
    showNotice("delivery-problem", info && info.online === false
      ? "You are offline. Your work is saved on this device and will be sent to school "
        + "when you are back online."
      : "Your work is being saved on this device, but it is not reaching the school. "
        + "Ask a grown-up to check any ad blocker or privacy shield for this site, "
        + "then open the lesson again. Nothing you have done is lost.");
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
    // The board's own arrangement (owner, 2026-09-01), young stages only and
    // by id, so subjects without these rows are untouched:
    // - The Video lesson card is REPLACED by the Overview card in its slot --
    //   the video is reached through Overview ("Start with Video lesson" is
    //   the overview's own button), so the board starts with Unit Study Plan.
    //   The SECTION is untouched: lecture still exists, still gates the
    //   chain, still completes -- only its board card is gone, which is also
    //   why this runs after the get-help append and before the paint: the
    //   album counts painted cards, and a CSS-hidden card would leave it
    //   claiming a sticker no card can show.
    // - Teacher & Parent Guide moves to the very end, the last card above
    //   the Student resources row.
    if (pathNav) {
      const lectureAt = navItems.findIndex((item) => item.id === "lecture");
      const overviewAt = navItems.findIndex((item) => item.id === "overview");
      if (lectureAt >= 0 && overviewAt >= 0) { navItems[lectureAt] = navItems[overviewAt]; navItems.splice(overviewAt, 1); }
      const guideAt = navItems.findIndex((item) => item.id === "teacherguide");
      if (guideAt >= 0) navItems.push(navItems.splice(guideAt, 1)[0]);
    }
    $("#section-nav").innerHTML = sectionNavigation(navItems, { path: pathNav });
    // Board-only classification -- see STICKER_QUIET_ROUTES above. Toggle, not
    // add: renderNav runs on every completion, and the set is the one source.
    if (pathNav) for (const navButton of $$("#section-nav .nav-button")) navButton.classList.toggle("nav-quiet", STICKER_QUIET_ROUTES.has(navButton.dataset.route));
    $$('[data-route]').forEach((button) => button.addEventListener("click", () => { closeSectionsSheet(); navigate(button.dataset.route); }));
    const teacherSwitch = $("#teacher-switch");
    if (teacherSwitch) {
      teacherSwitch.classList.toggle("active", route === "teacher");
      if (!teacherSwitch.dataset.bound) { teacherSwitch.dataset.bound = "true"; teacherSwitch.addEventListener("click", () => navigate("teacher")); }
    }
    if (config.onNavRendered) config.onNavRendered();
    // The deferred half of the gate-Start board (see the listener above): by
    // here the nav is painted, .nav-quiet is tagged and english's lock pass
    // has run, so the album the open will paint counts the real board -- a
    // flush before the innerHTML above opened over an empty nav and said
    // "0 of 0 stickers".
    if (boardOnGateStart && sectionsToggle) {
      boardOnGateStart = false;
      if (boardCanOpen()) openSectionsSheet();
    }
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
  // `fromLeaveDialog` marks ONE caller: the leave dialog's own "go back to the
  // board". Nothing else, and deliberately not Back or Menu.
  //
  // v379 marked those two as well, which suppressed "You're not finished yet!"
  // when a learner left a section by pressing Back. The owner wants that warning
  // at the SECTION level, as it was — leaving a section is what it is there to
  // ask about — so Back and Menu announce nothing and raise it exactly as they
  // did before.
  //
  // What must stay suppressed is the dialog re-raising ITSELF. Touching the
  // dialog re-enters fullscreen (focus mode takes any tap as the gesture,
  // including a tap on the dialog), so its own return dropped fullscreen again
  // and the warning the learner had just answered came straight back. That was
  // the reported double, and it is the only case this flag now covers.
  function exitFocusMode({ fromLeaveDialog = false } = {}) {
    const wasFocus = document.body.classList.contains("focus-mode");
    document.body.classList.remove("focus-mode", "tutoring-nav");
    if (document.fullscreenElement) {
      // Announced from inside this branch only: if the browser has already left
      // fullscreen there is nothing of ours to explain away, and saying so
      // anyway would swallow the learner's genuine Escape.
      if (fromLeaveDialog) document.dispatchEvent(new CustomEvent("ehel:app-fullscreen-exit"));
      document.exitFullscreen?.().catch(() => {});
    }
    // A manual exit is a standing choice — strip the URL's own door back to
    // focus mode so reloading this page (or coming back to it later) does
    // not silently re-enter a layout the learner just left.
    if (params.get("focus") === "1") {
      const url = new URL(location.href);
      url.searchParams.delete("focus");
      history.replaceState(null, "", url.href);
    }
    // At Grades/Stages 1-4 the sticker board IS the menu: the Menu button's
    // whole job is "show me where I can go", and the board is the answer, not
    // a page with a pill at the foot of it. Guarded on wasFocus so the Escape
    // that CLOSES an open board (closeSectionsSheet's listener, registered
    // first, runs before this one) does not bounce it straight back open --
    // without the guard, Escape toggles the board forever. Tutoring is
    // excluded for the reason it has no Menu button at all: search is that
    // category's route into a section, never the nav.
    if (wasFocus && pathNav && !IS_TUTORING) openSectionsSheet();
  }
  // The Menu button is the only way back while the lesson gate's Keyboard Lock
  // is swallowing Escape, so it has to exist before the navigation disappears.
  function ensureFocusChrome() {
    if (document.getElementById("focus-exit")) return;
    // TWO floating controls, not one (owner, 2026-09-01). They lead to the same
    // place, and that is the point rather than an oversight: "Menu" is a
    // hamburger, which offers a list of everywhere a learner could go, and a
    // six-year-old halfway through a word deck is asking the other question —
    // "let me out of this page". A back arrow answers that in one glyph, with
    // no word to read.
    //
    // It carries the `focus-exit` CLASS rather than one of its own, and that is
    // load-bearing. Four separate rules deliberately suppress the Menu pill —
    // deck theatre, a book being watched, and the open board at each width —
    // and every one of them names `.focus-exit`. A `.focus-back` would have had
    // to be added to all four, and the one that got missed would float a Back
    // arrow over a full-screen deck. Sharing the class means a fifth rule
    // added later covers this button without knowing it exists; the modifier
    // only moves it and drops the label.
    //
    // Appended BEFORE the Menu pill so the tab order matches the reading order:
    // both are position:fixed with their own `left`, so the DOM cannot be read
    // off the screen.
    const backButton = document.createElement("button");
    backButton.id = "focus-back";
    backButton.className = "focus-exit focus-exit--back";
    backButton.type = "button";
    // Honest about where it actually lands. exitFocusMode() opens the board
    // where pathNav is on, which since v375 is every staged subject; Intensive
    // English is levelled, has no board, and gets its sidebar back instead.
    backButton.setAttribute("aria-label", pathNav ? "Back to the unit board" : "Back to the unit navigation");
    backButton.title = "Back";
    backButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
    backButton.addEventListener("click", exitFocusMode);
    document.body.appendChild(backButton);
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
    // Leaving the board is part of GOING somewhere, so it belongs here rather
    // than at each call site. The section tiles closed it themselves and the
    // two resource switches did not -- they bind their own handlers, the
    // teacher's in this file and the student's in english.js -- so pressing
    // Student resources from the board navigated correctly and then left the
    // board sitting on top of the page it had just opened. That is not merely
    // untidy: navigate() also enters focus mode, which hides the topbar, and
    // the board hides the Menu button while it is open, so a learner on a
    // touch device had no control at all until they tapped another tile.
    // One line here covers every present and future caller (the completion
    // card's Next up, the locked page's Go to, get-help's deep links).
    closeSectionsSheet();
    stopVoice(); route = next; location.hash = next;
    // Report the move, and send it NOW -- see reportPosition(). Without this,
    // `resume` would only ever be written when
    // the learner COMPLETES something, which is the one moment it is least
    // interesting -- it would name the section they just left.
    //
    // This is a deliberate learner ACTION, never a timer, and the distinction
    // is load-bearing for the live group board: its whole sort is "time since
    // the learner's app last reported anything", so a periodic heartbeat would
    // make every open tab look busy and destroy the staleness signal. A
    // navigation is the learner doing something, so it belongs in that signal;
    // a clock tick does not.
    reportPosition();
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
    if (next && next !== route) { route = next; reportPosition(); renderNav(); renderRoute(); }
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
