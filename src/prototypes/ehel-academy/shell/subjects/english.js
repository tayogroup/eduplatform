// English subject module for the unified course-app shell (P1.5).
// English is the outlier: grade param, three localStorage stores (main +
// final-quiz + AI), six data files, and its own audio engine (file-based
// reading/grammar/speaking narration + ElevenLabs TTS/STT pronunciation) — so it
// sets config.disableShellVoice and keeps its bespoke subsystems. The shell owns
// boot/route, the main progress store + ProgressClient, nav, and layout. Section
// renderers and all English subsystems are kept BYTE-FOR-BYTE from
// english/shared/course-ui.js via `let` bindings populated by bind(ctx).
import { escapeHtml as sharedEscapeHtml, icon as sharedIcon, pageHeader as sharedPageHeader } from "../../shared/course-shell.js?v=20260721a";
import { grammarDiagram, phonicsDiagram } from "../../english/shared/grammar-visuals.js?v=english-20260723a";
import { createCourseApp } from "../course-app.js?v=t2";
import { createDeck } from "../deck.js?v=deck-1";
import { wordPicture } from "./word-pictures.js?v=pictures-1";
import { cursiveWord, cursiveCanWrite } from "./cursive-strokes.js?v=cursive-1";
import { SCHOOL_CALENDAR, calendarTerm, termDatesLabel, termWeekTotal, halfTermRow, formatDay } from "../study-plan.js?v=study-plan-2";
import { platformHeaders, askWehel, focusModule, setFocusModule, onFocusChange, modulesFromSections, outlineFromManifest, unitFetcher, browserSpeechSupported, speakBrowser, speechRateForGrade, stopBrowserSpeech, speechRecognitionCtor, recognizeSpeech, wehelIcon, platformUrl } from "../wehel.js?v=wehel-4";
import { createGetHelp } from "../get-help.js?v=get-help-1";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const routeParams = new URLSearchParams(location.search);
// Must resolve to the same number as course-app.js's stageNumber, which reads
// `grade` then `stage` from the query and then from data- attributes. English is
// the only subject that derives this twice — the others read ctx.stageNumber —
// and reading one fewer source made the two disagree: with ?stage=1 the shell
// built dataRootUrl content/english/g01/ while this fell through to its default
// of 2 and asked for master-dictionary.grade2.json, a 404 that left the course
// blank. Learners arrive via grade-N/index.html carrying data-grade, so only a
// ?stage= link hit it. Keep this chain in step with that one.
const requestedGrade = Number(routeParams.get("grade") || routeParams.get("stage")
  || document.documentElement.dataset.grade || document.documentElement.dataset.stage || 2);
const gradeNumber = requestedGrade >= 1 && requestedGrade <= 8 ? requestedGrade : 2;
const gradeLabel = `Grade ${gradeNumber}`;
function cambridgeFramework(stage) {
  return Number(stage) <= 6
    ? { level: "Cambridge Primary English", code: "0058" }
    : { level: "Cambridge Lower Secondary English", code: "0861" };
}
function cambridgeLabel(stage) {
  const fw = cambridgeFramework(stage);
  return `${fw.level} ${fw.code} — Stage ${stage}`;
}
// Whether THIS unit is still waiting on a curriculum reviewer.
//
// The overview used to state "AI-assisted content review complete — human
// curriculum sign-off pending" as a fixed sentence, so it appeared on all 81
// units — including the 44 whose reviewStatus reads "Approved v1.2". A learner
// (or the parent reading over their shoulder) was told the work in front of
// them was unreviewed even where a reviewer had signed it off, and the notice
// meant nothing precisely because it was on everything.
//
// It is a disclosure worth keeping where it is TRUE, so it is now driven by the
// unit's own reviewStatus rather than deleted. Unknown or missing status counts
// as pending: the honest default for "we cannot tell" is to disclose, not to
// imply approval.
function unitAwaitsSignOff() {
  const status = String(course?.unit?.reviewStatus || "").trim();
  if (!status) return true;
  return !/^approved\b/i.test(status);
}
const gradeRootUrl = new URL(`./grade-${gradeNumber}/`, location.href);
const AUDIO_IS_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);

// Bump this whenever English audio is re-uploaded. It is the only thing that
// makes a repaired recording reach a learner who has already heard the broken
// one.
//
// English clips are named for their CONTENT (u1-g1-1-coal-sentence-1.mp3), so a
// re-recording keeps its filename and its URL. Bunny serves media as
// `Cache-Control: public, max-age=31536000` with no ETag, so a browser that has
// played a clip holds it for A YEAR and never revalidates. Re-uploading fixes
// storage and cannot reach that cache: after 17,178 clips were re-uploaded to
// repair a months-old backlog, the learner who reported the fault still heard
// the old audio, because their browser was never going to ask again.
//
// The stamp rides as a query string. The pull zone ignores query strings when
// it caches — a never-before-seen `?probe=` returns `CDN-Cache: HIT` off the
// bare path — so this cannot fragment or poison the edge; it is invisible to
// Bunny. A BROWSER keys its cache on the full URL, which is precisely the cache
// that needs busting.
//
// A date, not a hash: one stamp covers the whole tree, so an audio release is
// one edit rather than 17,178. The cost is that everyone refetches everything
// once per bump, which is the correct trade for audio that is otherwise wrong
// for a year. upload-media-to-bunny.js prints a reminder when it sends English
// clips, because a stamp nobody remembers to bump is worse than none.
// 20260824a: Grade 8 Unit 7's connoisseur meaning was re-recorded onto its own
// filename. The unit taught a definition authored onto a cross-reference the
// build mistook for a word, and the restored text needed new audio; the
// vocabulary clip kept its path, so every browser that played the wrong one
// still holds it. The glossary clip moved to a new name and never needed this.
// Two clips is a small reason to make the whole course refetch once, and it is
// still the correct trade — the alternative is a definition nobody can hear
// corrected, for a year, on a word the unit is teaching.
const AUDIO_RELEASE = "20260824b";
function withAudioRelease(url) {
  // Dev serves from disk with no caching worth defeating, and a bare filename
  // is easier to grep for in the network panel.
  if (AUDIO_IS_DEV) return url;
  // Only http(s) media has a browser cache to bust. On-demand ElevenLabs voice
  // (aiVoiceUrl) hands playAudio a blob: URL, and a blob URL is looked up by
  // its exact serialisation minus the fragment — so `blob:…?a=20260814` names
  // an object that does not exist and the element fails with
  // MEDIA_ERR_SRC_NOT_SUPPORTED. That took "Hear ElevenLabs model" and the game
  // instruction voice down with "The ElevenLabs recording could not be played"
  // the day this stamp shipped. Same for data: URLs, which carry their bytes.
  if (!/^https?:/i.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + `a=${AUDIO_RELEASE}`;
}

function resolveMediaUrl(source) {
  let s = String(source);
  if (!AUDIO_IS_DEV) {
    const m = s.match(/media\/audio\/grade-(\d+)\/([a-z]+)\/(.+)$/i);
    if (m) s = `../../media/english/g${String(m[1]).padStart(2, "0")}/audio/${m[2]}/${m[3]}`;
  }
  return withAudioRelease(new URL(s, document.baseURI).href);
}
// Bunny serves .vtt as application/octet-stream: it ignores the Content-Type
// the upload sends and derives one from the extension, and its table has no
// entry for .vtt (every other extension we ship resolves correctly). The HTML
// spec requires text/vtt for a text track, so a browser stricter than Chrome
// is entitled to drop the captions. Re-serve the cues from a blob we type
// ourselves, which depends on nothing the CDN reports. Failure is silent by
// design — the track keeps its original src, exactly as before.
async function attachCaptions(video) {
  const track = video.querySelector("track");
  if (!track || !track.src) return;
  try {
    const res = await fetch(track.src);
    if (!res.ok) return;
    const vtt = await res.text();
    if (!/^﻿?WEBVTT/.test(vtt)) return;
    track.src = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
  } catch {
    /* keep the original src; captions are an enhancement, not a gate */
  }
}
// Grade 1 opened at Unit 0 (Alphabet & Sounds) until 2026-08-20, when the
// owner withdrew it from learners — hidden, not deleted. Its data, games and
// audio stay published, and two explicit doors still reach it: the teacher
// preview (#teacher) and a placement-remediation visit (?review=1) — the
// Grade 1 readiness check prescribes Unit 0 in all four of its sections, and
// remediation is already the mechanism that opens exactly one unit outside
// the learner's sequence. Everywhere else Grade 1 now behaves like every
// other grade: it opens at Unit 1, the unit gate chains from Unit 1, and
// Unit 0 is out of the pickers. To restore Unit 0, make this
// `gradeNumber === 1 ? 0 : 1` again, mirror it in config.defaultUnit at the
// bottom of this file and in placementLocation()'s fallback, and drop the
// `unit0Visit` escape below, the filter in renderUnitPickers() and the one in
// renderFinalQuizResults().
const defaultUnit = 1;
// Unit -1 is the Prerequisite unit, present on every grade before Unit 1: a
// placement exam over the previous grades' essential outcomes. It has no
// units/unit-*.json of its own — load() fetches placement-exam.json instead
// and synthesizes the small course shell the shared chrome needs.
const PREREQ_UNIT = -1;
const requestedUnit = Number(routeParams.get("unit") ?? defaultUnit);
const isPrereqUnit = requestedUnit === PREREQ_UNIT;
// The two doors into withdrawn Unit 0. TEACHER_PREVIEW and REVIEW_VISIT are
// declared hundreds of lines down and this line runs first at module scope,
// so the same two markers are read inline here rather than referenced.
const unit0Visit = gradeNumber === 1 && requestedUnit === 0 && (location.hash.slice(1) === "teacher" || routeParams.get("review") === "1");
const unitNumber = isPrereqUnit ? PREREQ_UNIT : unit0Visit ? 0 : (requestedUnit >= defaultUnit && requestedUnit <= 10 ? requestedUnit : defaultUnit);
const STORAGE_KEY = `ehel-english-g${gradeNumber}-u${unitNumber}-progress-v1`;
const FINAL_QUIZ_STORAGE_KEY = `ehel-english-g${gradeNumber}-course-final-quiz-v1`;
const PLACEMENT_STORAGE_KEY = `ehel-english-g${gradeNumber}-placement-exam-v1`;
const AI_STORAGE_KEY = `ehel-english-g${gradeNumber}-u${unitNumber}-ai-v1`;
const AI_VOICE_ID = "XfNU2rGpBa01ckF309OY";
const AI_NARRATION_RATE = 0.90;
// Absolute once a launch names the platform, root-relative otherwise — see
// wehel.js :: platformOrigin. English is served from the CDN like every other
// subject, so a bare "/local/hubredirect/…" here reached the CDN and 404ed,
// taking "Listen to this page", on-demand reading narration and the
// pronunciation check with it. platformUrl is the one definition; restating the
// rule here is what let the tutor and the voice disagree about the same server.
const AI_TTS_ENDPOINT = AUDIO_IS_DEV && location.port === "4287" ? "/api/elevenlabs-tts" : platformUrl("/local/hubredirect/quiz_tts.php");
const AI_STT_ENDPOINT = platformUrl("/local/hubredirect/quiz_stt.php");

// Shell-provided bindings (populated by bind(ctx)). English keeps its own
// pageHeader/toast/escapeHtml/icon(s) — only progress + nav come from the shell.
let progress, complete, updateProgress, saveProgress, navigate, renderNav, emitProgress, unitSectionIds, dataRootUrl, PROGRESS_UNIT;
let shellCtx;
function bind(ctx) {
  ({ complete, updateProgress, saveProgress, navigate, renderNav, emitProgress, unitSectionIds, dataRootUrl, PROGRESS_UNIT } = ctx);
  progress = ctx.progress;
  shellCtx = ctx;
  // Every renderer in this file finishes a section through complete(), so this
  // is the one place to say so on the page. The shell's own message is a toast
  // that is gone in 2.6 seconds; the card renderSectionCompletion draws stays,
  // names what was finished, and offers the way on. `wasDone` keeps the
  // celebration (scroll + focus) for the moment the tick is earned — completing
  // an already-finished section again (a second Mark complete, a re-saved
  // draft) only refreshes the card in place.
  const shellComplete = ctx.complete;
  complete = (section, message) => {
    const wasDone = progress.completed.includes(section);
    shellComplete(section, message);
    if (section === route) { renderSectionCompletion({ celebrate: !wasDone }); activeDeck?.refreshClosing(); }
  };
}

// --- who is looking ----------------------------------------------------------
// Moodle mints `role` into the signed launch token (progress_gatewaylib.php ::
// pqpg_launch_role). It is READ here, never verified — the app holds no secret —
// so it decides what is drawn and nothing else. That is the right weight for it:
// the grade picker only rewrites ?grade=, which anyone can type, so hiding it
// tidies a learner's chrome rather than restricting them. Anything that must be
// enforced has to be enforced at the gateway, against the token's signature.
//
// No token at all means this is not a learner launch — local dev, a direct link,
// QA — and the picker stays. A learner who strips their own token loses progress
// sync to gain a control they could have reached by editing the URL.
// The token's payload, or null when there is no readable one. One decoder, so
// the claims cannot be read two different ways as more of them are added.
function launchClaims() {
  const token = routeParams.get("pwsToken") || "";
  if (!token) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(base64));
    return claims && typeof claims === "object" ? claims : null;
  } catch {
    return null; /* not a token we can read */
  }
}
const LAUNCH_CLAIMS = launchClaims();

function launchRole() {
  if (!routeParams.get("pwsToken")) return "staff";
  const role = LAUNCH_CLAIMS?.role;
  if (typeof role === "string" && role) return role;
  // Tokens predating the claim carry no role. Treating them as staff would show
  // every learner the picker; treating them as students is the safer default and
  // costs a teacher on an old token one refreshed launch.
  return "student";
}
const IS_STAFF = ["admin", "teacher", "staff"].includes(launchRole());

// ===================== english body (verbatim) =====================

// The grades with a Story Library (renderStoryLibrary, far below). Declared up
// here rather than beside its renderer for the same reason the `unitIsLocked`
// comment gives: visibleSections() is reached while this module is still being
// evaluated, and a `const` it reads from 4,000 lines further down is a temporal
// dead zone ReferenceError that blanks the whole page. tools/check-english-story-library.mjs
// reads this array by name and fails if it disagrees with the builder's.
const STORY_LIBRARY_GRADES = [5, 6, 7, 8];
const hasStoryLibrary = () => STORY_LIBRARY_GRADES.includes(gradeNumber);

const sections = [
  ["overview", "layout-dashboard", "Overview"],
  // The unit-level Study Plan, on every grade (Grade 1 first, the rest
  // extended on the owner's request the same day). A reference page, not a
  // step: excluded from countableSectionIds and config.nonCountable-listed,
  // and absent from SECTION_CHAIN, so it can neither gate nor count. The
  // grade-level plan lives on the Prerequisite unit under the same name; this
  // one plans the unit the learner is inside.
  ["unit-plan", "calendar-days", "Unit Study Plan"],
  // Only a handful of Grade 1 units carry a grownUpGuide (the Year 1 source
  // pack's own Teacher & Parent Guide docs; see
  // tools/build-ehel-grade1-teacher-guides.js) — every other unit in every
  // other grade has none, so this drops out of the nav the same way Games and
  // Books already do for a unit that cannot offer them (visibleSections()
  // below). Not in nonCountable's sibling list of "sections a unit is allowed
  // to lack" by accident — it belongs there for the same reason.
  ["teacherguide", "users", "Teacher & Parent Guide"],
  // "Video lesson", not "Teacher lecture". The section IS a teacher's recorded
  // lesson, but these courses are self-paced and naming it for whose it is
  // tells a learner working alone that the explainer belongs to someone else.
  // Computing and Global Perspectives made the same rename for the same reason.
  ["lecture", "play-square", "Video lesson"],
  ["dictionary", "book-a", "Vocabulary"],
  ["reading", "book-open", "Reading & story"],
  ["comprehension", "list-checks", "Comprehension"],
  ["grammar", "braces", "Grammar"],
  ["speaking", "messages-square", "Speaking"],
  ["writing", "pencil-line", "Writing"],
  ["activities", "shapes", "Activities"],
  ["games", "gamepad-2", "Games"],
  ["quiz", "badge-check", "Quiz"],
  ["ebooks", "library-big", "Books"],
  // Grades 5-8 only, and it is the counterpart to Books rather than a copy of
  // it: those grades' stories already exist inside the units, so this shelves
  // what is there instead of adding illustrated books the owner has ruled out
  // above Grade 4. Reference reading, never a step — excluded from
  // countableSectionIds and nonCountable-listed, and absent from SECTION_CHAIN,
  // so it can neither gate nor count. Free reading that decides whether a unit
  // is finished is not free reading.
  ["story-library", "book-marked", "Story Library"],
  ["live", "video", "Live sessions"],
  ["reflect", "sparkles", "My progress"],
];

// One line under each row of the overview's unit guide: what a learner does in
// the section, and what finishes it. Each line is written from the section's
// own completion rule — every word known, the eight-word draft, the 60% pass
// mark are the numbers the renderers enforce, so a line here that drifts from
// its renderer is telling the learner the wrong thing. Written for the
// youngest reader who meets it (Grade 1), so every grade gets the plain form.
const SECTION_HINTS = {
  "unit-plan": "See what you will do each week of this unit — it is not required to move on.",
  "story-library": "Every story from your grade, whole and in one place. Nothing here is marked — read one because you want to.",
  teacherguide: "Read this whenever it helps — it is not required to move on.",
  lecture: "Watch the video to the end. Listen and read the captions.",
  dictionary: "Learn the new words and press “I know this word” on each one. The story words are there to look up while you read.",
  reading: "Read the story, or listen to it. Then press the button to say you have read it.",
  comprehension: "Answer the questions about the story, then press the button to finish.",
  grammar: "Look at the pattern and try the practice, then press the button to finish.",
  speaking: "Say the sentences out loud. Record yourself if you can, then press the button to finish.",
  writing: "Write your own sentences — at least eight words — and press Submit.",
  activities: "Do the activities, then press the button to finish.",
  games: "Play every game once.",
  quiz: "Answer all the questions. Get more than half right to pass. You can try again.",
  ebooks: "Read or watch one book to the end.",
  reflect: "Choose an answer for every sentence about how you did.",
};
// Unit 10 has no video: its first step is a page that launches the capstone.
const CAPSTONE_LAUNCH_HINT = "Read about your capstone project, then press the button to start.";
// Vocabulary completes when every word the unit TEACHES has been marked known —
// the one rule for both designs (the lab and the deck), so they cannot finish
// the section at different points. It was 80% of the words; a tick that arrived
// at 56 of 70 made the guide's "all the words" a lie, so it became all of them.
// Checked by id, not by count: knownWords is per unit, but an id list is what
// "every word" means.
//
// TAUGHT is the load-bearing word, and it is not the whole list. 79 of the 81
// units end with a group titled "Words from our stories" — a glossary of that
// unit's passages, laid out in reading order — and it is 79% of all the
// vocabulary in the course: 8,107 glossary words against 2,211 taught. Counting
// it made Vocabulary a 198-word gate at Grade 3 Unit 1 and a 423-word one at
// Grade 8 Unit 1, and Vocabulary sits in front of Reading in SECTION_CHAIN. So
// a learner had to press "I know this word" on every word of a story before
// being allowed to read it — the story's own glossary was a prerequisite for
// the story — and the unit Study Plan's week-by-week word chunks could not be
// walked at all, because week 1's reading needed week 4's words.
//
// Outside the glossary a unit holds 13-70 words (median 29), which is the range
// the deck's own note was written for and a section a learner can finish in the
// week the plan allots it.
//
// The glossary is not hidden and not un-markable. Every word stays in the list,
// stays searchable, stays filterable by its group and stays reachable from the
// passage through linkGlossaryWords — it is reference, and reference does not
// gate. Marking one still counts toward My Word Book.
//
// Monotone in the safe direction: this asks for FEWER words than before, so no
// learner who had already finished the section is un-finished by the change.
const STORY_GLOSSARY_GROUP = "Words from our stories";
const taughtGroups = () => (course.vocabularyGroups || []).filter((group) => group.title !== STORY_GLOSSARY_GROUP);
// Two units have no glossary group at all (Grade 1 Unit 0, Grade 6 Unit 10) and
// both are wholly taught, so the filter is a no-op there. The second guard is
// for the shape that would be silent rather than wrong: a unit that is NOTHING
// but a glossary would come back with an empty taught set, and an empty set
// completes the section on sight — allWordsKnown() answers false for it, but
// only by the length test that exists for exactly this reason. Falling back to
// the whole list keeps such a unit gated as it is today. check-english-content
// fails on both shapes, so neither can arrive unannounced.
function taughtWords() {
  const groups = taughtGroups();
  const words = linkedWords();
  if (groups.length === (course.vocabularyGroups || []).length) return words;
  const ids = new Set(groups.map((group) => group.id));
  const taught = words.filter((item) => ids.has(item.groupId));
  return taught.length ? taught : words;
}
const allWordsKnown = (words) => words.length > 0 && words.every((item) => progress.knownWords.includes(item.vocabularyId));

// The one line for a section, with the two per-unit exceptions applied — used
// by the overview's checklist, so it and the page guide below never describe
// the same section differently.
function sectionHint(id) {
  if (id === "lecture" && unitNumber === CAPSTONE_UNIT) return CAPSTONE_LAUNCH_HINT;
  // A unit whose readings are written to the parent shows the grown-up guide
  // in place of the story (renderReadingGrownUp), and finishes on a button the
  // two of them press together.
  if (id === "reading" && course && readingsAreForTheGrownUp()) return "Go through the reading with your grown-up, then press the button together.";
  return SECTION_HINTS[id] || "";
}

// --- the page guide: a teacher explaining the page ---------------------------
// Every section page opens with a guide that walks the learner through the
// page the way a teacher would: what is on it, what to read, what to listen
// to, which button does what, and what makes the section count as finished.
// The one-line hint above is the summary; this is the explanation.
//
// Each guide is a function, not a literal, because it names what THIS unit
// holds — the five texts on the shelf and which are for listening, six
// grammar lessons by title, 8 of 10 to pass — and the numbers come from the
// same fields the renderers draw and the completion rules read, so the guide
// cannot promise a count the page does not have. Written for the youngest
// reader who meets it; short sentences, one action each.
// “A”, “B” and “C”. A title that already carries quotes (A Poem: “When I Open
// Up a Book”) is left bare rather than double-wrapped.
const listNames = (items, key = "title") => {
  const names = items.map((item) => (/[“"]/.test(item[key]) ? item[key] : `“${item[key]}”`));
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};
const SECTION_GUIDES = {
  lecture: () => (course.visual.lectureMode === "capstone-launch" || unitNumber === CAPSTONE_UNIT
    ? {
      steps: [
        "This is the start of your capstone project. There is no video here — read the page instead.",
        "Read the four milestones. They tell you what you will make and show this unit.",
        "Press “I have seen the whole project” when you have read them.",
        "Then press “Open review vocabulary” to go on.",
      ],
      finish: "This section is finished when you press “I have seen the whole project”.",
    }
    : course.visual.lectureVideo ? {
      steps: [
        "Press play on the video. Teacher Musa teaches the whole lesson.",
        "Read the captions under the picture while you listen. If you miss something, drag the bar back and watch that part again.",
        "Watch right to the end. The gold button says “Watch to complete” until then, and turns into “Lecture complete” by itself when the video finishes.",
        "Then press “Open vocabulary” to go to the next section.",
      ],
      finish: "This section is finished when the video has played to the end. You cannot skip it — the buttons stay grey until then.",
    } : {
      steps: [
        "Read the unit preview on this page. It tells you what you will learn.",
        "Read the four steps under “How to learn” — that is how you will work in this unit.",
        "Press “I have previewed this unit”, then “Open vocabulary” to go on.",
      ],
      finish: "This section is marked complete once the video lesson is ready. For now, read the preview and go on to Vocabulary.",
    }),
  dictionary: () => {
    const total = course.dictionaryLinks.length;
    return {
      steps: [
        `On the left is the list of the ${total} words in this unit. Press a word to open it.`,
        "On the word card, press the speaker to hear the word, then say it out loud. Press the second speaker to hear it again.",
        "Read the meaning. Press its speaker to hear it read to you.",
        "Read the example sentences. Press “Hear sentence” to listen, and use the arrows to go through all of them.",
        "Look at the spelling. Then type your own sentence with the word in the box and press “Check sentence”.",
        "When you know the word, press “I know this word”. It gets a LEARNED tag in the list.",
        "Do this for every word. Click the next word in the word list on the left until you have learned all the words.",
      ],
      finish: "Vocabulary is finished when you have learned all the words and marked each one as known.",
    };
  },
  reading: () => {
    if (readingsAreForTheGrownUp()) {
      return {
        steps: [
          "This reading is for you and your grown-up to do together.",
          "Ask your grown-up to open the page with you. They read the notes; you do the reading and the sounds with them.",
          "Go through every part on the page together.",
        ],
        finish: "Press “We have been through this together” at the bottom when you have finished.",
      };
    }
    const texts = course.readings;
    const listening = texts.filter((text) => /listen/i.test(text.type));
    const story = texts.filter((text) => /story/i.test(text.type));
    return {
      steps: [
        `There are ${texts.length} texts on your reading shelf: ${listNames(texts)}.`,
        "Read the text on the screen. Read it slowly, and read it out loud if you can.",
        "To hear it read to you, press “Prepare audio” and then the play button. Listen and follow the words with your finger.",
        ...(listening.length ? [`${listNames(listening)} ${listening.length === 1 ? "is a listening text" : "are listening texts"}: listen to ${listening.length === 1 ? "it" : "them"} first, then read along.`] : []),
        ...(story.length ? [`${listNames(story)} is the story of this unit. Read it carefully — the Comprehension questions are about it and the other texts.`] : []),
        "Use “Next text” and “Previous text” to move between the texts. Read every one.",
      ],
      finish: "Press “Finished reading” when you have read all the texts.",
    };
  },
  comprehension: () => ({
    steps: [
      `There are ${course.comprehension.length} questions about the texts you read.`,
      "Read each question. Think about the text.",
      "Type your answer in the box in a full sentence.",
      "Press “Check guidance” to see a good answer. Compare it with yours. If your box is empty, the page asks you to write your answer first.",
      "Do this for every question.",
    ],
    finish: "Press “Finish comprehension” at the bottom when you have answered them all.",
  }),
  grammar: () => ({
    steps: [
      `There are ${course.grammar.length} grammar lessons: ${listNames(course.grammar)}.`,
      "Read the rule and the examples in each lesson. Press the speaker or “Replay” to hear it read to you.",
      "Say the examples out loud.",
      "Open “Show practice” under the lesson and try the practice sentences. Press “Hear the practice” to check how they sound.",
      "Do this for every lesson.",
    ],
    finish: `Press “I practised all ${numberWord(course.grammar.length)} lessons” at the bottom.`,
  }),
  speaking: () => ({
    steps: [
      `There are ${course.speaking.length} speaking practices.`,
      "In each one, press the speaker or “Replay” to hear the model. Listen twice. Then say it out loud yourself.",
      "Step 1, Record: press the microphone, say the sentence, and press it again to stop.",
      "Step 2, Listen: play your recording back and listen to yourself.",
      "Step 3, Submit: press “Submit for pronunciation check”. It turns on after you have listened back.",
      "Step 4, Feedback: read what the checker says. Record again if you want to do better.",
      "Do this for every practice.",
    ],
    finish: `Press “Finish ${numberWord(course.speaking.length)} speaking practices” at the bottom.`,
  }),
  writing: () => ({
    steps: [
      `There are ${course.writing.length} writing tasks. Choose one from the list.`,
      "Read the task. Press “Hear the task” if there is a speaker.",
      "Open “View model text” to see an example of good writing.",
      "Write your own in the big box — at least 8 words. Use the Writer's checklist. “Support” helps you if you are stuck; “Challenge” gives you more to do.",
      "Press “Submit this draft”. Your writing is saved. You can come back and make it better any time.",
    ],
    finish: "Writing is finished as soon as you submit one draft — but do every task, one after another.",
  }),
  activities: () => ({
    steps: [
      `There are ${course.activities.length} activities.`,
      "Read the instructions for each activity. Press “Hear the instructions” to listen to them.",
      "Do the activity. Some ask you to write your answer in the box.",
      "Press “Mark complete” under each activity when you have done it.",
    ],
    finish: "Press “Finish activities” at the bottom when you have done them all.",
  }),
  games: () => ({
    steps: [
      `There are ${gamePack?.games?.length ?? "several"} games. Press a game to open it.`,
      "Play the game. You earn stars and XP for what you know. Hints and retries are always there — use them.",
      "Play every game at least once. Play again to get more stars.",
    ],
    finish: "When you have played them all, press “I have played them all”. If you master every game, the section finishes by itself.",
  }),
  quiz: () => {
    const total = course.quizzes.length;
    return {
      steps: [
        `There are ${total} questions. Read each one and choose one answer.`,
        "You see your score at the end.",
        "If your score is not high enough, press “Try again” and do the quiz once more.",
        "Then press “Continue” to go to My progress.",
      ],
      finish: `The quiz is passed with ${Math.ceil(total * 0.6)} right out of ${total} — more than half.`,
    };
  },
  ebooks: () => ({
    steps: [
      "Choose a book from the shelf.",
      "Read it page by page with the arrows, or watch it if it plays as a video.",
      "Read or watch it right to the end.",
    ],
    finish: "Press “Finish book” on the last page. One book finishes this section — read more if you like.",
  }),
  reflect: () => ({
    steps: [
      "The top of the page shows how much of the unit you have finished.",
      `Read the ${course.selfAssessment.length} sentences about your learning. For each one, choose the answer that is true for you.`,
      "Be honest — this shows your teacher where you need help.",
    ],
    finish: "Press “Save reflection” when every sentence has an answer.",
  }),
  live: () => ({
    steps: [
      "This page lists the live classes for this unit, if your school runs them.",
      "Read “Before class” to get ready, then press “I'm ready”.",
      "Join the class at its time. Afterwards, read “After class” to remember what to practise.",
    ],
    finish: "Live sessions are extra. They do not count toward finishing the unit.",
  }),
};
function numberWord(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n); }

// Mounted OUTSIDE #app, as a sibling before it: a section redraws #app freely
// as the learner works (Games after "I have played them all", the vocabulary
// lab on every filter), and a guide inside it would vanish on the first redraw.
// Refreshed on every route render, removed where there is no lesson to guide —
// the overview has its own guide, and a locked page already says the one thing
// it has to say. Open at every grade — it started folded from Grade 5 on the
// theory that an older learner scans, and was asked open: the steps are the
// point, and a folded guide is one more thing to find.
function renderSectionGuide() {
  const app = $("#app");
  let host = $("#section-guide");
  const build = !isPrereqUnit && !unitIsLocked() && SECTION_GUIDES[route] && sectionUnlocked(route);
  if (!build) { host?.remove(); return; }
  if (!host) { host = document.createElement("section"); host.id = "section-guide"; app.parentNode.insertBefore(host, app); }
  const guide = SECTION_GUIDES[route]();
  const hasDeck = Boolean($("#deck-design"));
  host.className = "section-guide";
  host.innerHTML = `<details open>
      <summary>${icon("info")}<span><strong>How to use this page</strong><small>${escapeHtml(sectionLabel(route))} — what to do, step by step</small></span></summary>
      <ol class="section-guide-steps">${guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      <p class="section-guide-finish">${icon("check-circle")}<span><strong>To finish:</strong> ${escapeHtml(guide.finish)}</span></p>
      ${hasDeck ? `<p class="section-guide-deck">${icon("gallery-horizontal")}<span>Under the page there are slides with the same things, one at a time. <button class="link-button" type="button" data-jump-deck>Go to the slides</button></span></p>` : ""}
    </details>`;
  host.querySelector("[data-jump-deck]")?.addEventListener("click", () => $("#deck-design")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  icons();
}

// The completion card — the bookend to the section guide above. The guide sits
// BEFORE #app and says what to do; this sits AFTER it and says it is done. Both
// live outside #app on purpose: renderers rewrite #app.innerHTML freely (games
// after a round, reflect after a choice, the eBook reader on every page turn),
// and a card drawn inside it would vanish on the next repaint. Out here it is
// redrawn from progress on every route render and every complete(), so it can
// never disagree with the ticks in the nav — it reads the same list
// (unitSectionIds) the progress bar divides by.
//
// Two states, one card. While the unit has sections left it names the one just
// finished, counts the ticks, and offers the next open section — the learner
// who has just pressed Finish is standing at the bottom of a page with nowhere
// obvious to go. When the last tick lands the same card becomes the unit's
// finish line: what was finished, and what it opened (the next unit under the
// gate, the final quiz on the capstone, the overview otherwise). The Overview
// also shows the finish line, so a learner returning to a done unit meets it
// where they land rather than only on whichever section they finished last.
//
// `celebrate` — the tick was earned this moment, so bring the learner to the
// card. Without it a Grade 1-4 learner who finishes on the deck's last slide
// would have the card below the fold and see only the 2.6-second toast, which
// is the gap this exists to close.
// The words and the way on, computed once so the card under the page and the
// deck's closing slide (deckClosingSlide) cannot tell the learner two different
// things. `buttons` names the button classes, because the two surfaces dress
// their controls differently (.button on the page, .gc-btn on a slide); the
// action itself is `data-complete-go` either way, or a link for the next unit.
function completionCopy({ buttons = { primary: "button primary", gold: "button gold" } } = {}) {
  const countable = unitSectionIds();
  const done = countable.filter((id) => progress.completed.includes(id));
  const unitDone = countable.length > 0 && done.length === countable.length;
  let eyebrow, title, body, action;
  if (unitDone) {
    const nextUnit = manifest?.units?.find((unit) => Number(unit.number) === unitNumber + 1) || null;
    const nextOpen = nextUnit && unitIsUnlocked(nextUnit.number);
    eyebrow = "Unit finished";
    title = `Unit ${course.unit.unitNo} is finished. Brilliant work!`;
    body = `Every section of “${course.unit.unitTitle}” has a tick.`;
    if (unitNumber === CAPSTONE_UNIT) {
      body += " One thing is left for the whole course: the final quiz.";
      action = `<button class="${buttons.gold}" type="button" data-complete-go="final-quiz">${finalQuizProgress.completed ? "View my final quiz results" : "Open the final course quiz"} ${icon("arrow-right")}</button>`;
    } else if (nextOpen) {
      body += ` Unit ${nextUnit.number}: ${nextUnit.title} is open now.`;
      action = `<a class="${buttons.gold}" href="${courseLocation(nextUnit.number)}">Go on to Unit ${nextUnit.number} ${icon("arrow-right")}</a>`;
    } else if (nextUnit) {
      // The gate is on and an EARLIER unit is still unfinished, so the next one
      // stays shut; the overview's guide names what is missing.
      body += ` Unit ${nextUnit.number} opens when every unit before it is finished.`;
      action = `<button class="${buttons.primary}" type="button" data-complete-go="overview">Back to the overview ${icon("arrow-right")}</button>`;
    } else {
      action = `<button class="${buttons.primary}" type="button" data-complete-go="overview">Back to the overview ${icon("arrow-right")}</button>`;
    }
  } else {
    // The next section in the chain the learner can actually open; failing that
    // the first one still to do — its own page explains what stands in the way.
    const pending = sectionChain().filter((id) => countable.includes(id) && !progress.completed.includes(id));
    const next = pending.find((id) => sectionUnlocked(id)) || pending[0];
    // `next` is the FIRST gap in the chain, not the section after this one, so it
    // can sit BEHIND the learner: finish Reading & story with Video lesson still
    // open and the earliest gap is two steps back. Pointing there is right — the
    // unit cannot reach 100% while it is open, and the alternative walks the
    // learner past sections they never did — but "Next up" then describes it
    // wrongly, and a card that says "next" while sending you backwards reads as
    // the app having lost its place. So the same pick gets different words.
    //
    // Only reachable with the unit gate suspended (or in teacher preview): with
    // it on, sectionUnlocked() would not have let the learner open a section
    // whose earlier steps are unfinished, so the first gap is always ahead.
    const chain = sectionChain();
    const here = chain.indexOf(route);
    const behind = next && here > 0 && chain.indexOf(next) > -1 && chain.indexOf(next) < here;
    eyebrow = "Section finished";
    title = `Well done! ${sectionLabel(route)} is finished.`;
    const whereNext = !next ? ""
      : behind ? ` ${sectionLabel(next)} is still to do — it comes earlier in this unit.`
      : ` Next up: ${sectionLabel(next)}.`;
    body = `That is ${done.length} of ${countable.length} sections in Unit ${course.unit.unitNo} ticked.${whereNext}`;
    action = next ? `<button class="${buttons.primary}" type="button" data-complete-go="${escapeHtml(next)}">${behind ? "Go back to" : "Continue to"} ${escapeHtml(sectionLabel(next))} ${icon("arrow-right")}</button>` : "";
  }
  return { unitDone, countable, eyebrow, title, body, action };
}

function renderSectionCompletion({ celebrate = false } = {}) {
  const app = $("#app");
  let host = $("#section-complete");
  const { unitDone, countable, eyebrow, title, body, action } = completionCopy();
  // A finished section waiting behind an unfinished earlier step draws the
  // locked page (gated → renderLockedSection), and a "finished" card under a
  // "not open yet" heading contradicts itself — same rule the section guide
  // follows.
  const isSection = countable.includes(route) && progress.completed.includes(route) && sectionUnlocked(route);
  const build = !isPrereqUnit && !unitIsLocked() && route !== "teacher" && (isSection || (unitDone && route === "overview"));
  if (!build) { host?.remove(); return; }
  if (!host) { host = document.createElement("section"); host.id = "section-complete"; app.parentNode.insertBefore(host, app.nextSibling); }
  host.className = `section-complete ${unitDone ? "is-unit" : "is-section"}`;
  host.setAttribute("aria-labelledby", "section-complete-title");
  host.innerHTML = `<div class="section-complete-mark" aria-hidden="true">${icon(unitDone ? "trophy" : "check")}</div>
    <div class="section-complete-copy">
      <span class="eyebrow">${escapeHtml(eyebrow)}</span>
      <h2 id="section-complete-title">${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      ${action}
    </div>`;
  host.querySelector("[data-complete-go]")?.addEventListener("click", (event) => navigate(event.currentTarget.dataset.completeGo));
  icons();
  if (celebrate) {
    host.scrollIntoView({ behavior: "smooth", block: "center" });
    focusDynamicContent("#section-complete-title", `${title} ${body}`);
  }
}

// --- unit gate: one unit at a time -------------------------------------------
// The early grades are walked in order rather than browsed. The first unit is
// open from the start; every later one opens when the unit before it is
// finished, up to and including the Unit 10 capstone.
//
// "Finished" is the shell's own definition — every countable section done, the
// same thing that drives the progress bar to 100% and emits `unit.completed`
// (course-app.js :: updateProgress). Inventing a second rule here would let the
// lock, the bar and the Moodle event disagree about the same unit.
//
// Whether a unit CAN reach 100% depends on it carrying every section the chain
// demands: a grade whose Unit 3 ships no lecture video could never complete
// `lecture`, and the gate would shut the learner out for good.
//
// Every grade, each one checked before being added — the flag was widened four
// times and never by editing a number alone. What has to hold is that every
// section the chain demands can actually be finished in every unit of that
// grade, because an uncompletable step locks a learner out permanently:
//   Grade 1  — 11 units, all game packs, lecture videos, and the only grade
//              with an eBook library. Unit 10 is the capstone launch, which
//              completes on its own button rather than on a video.
//   Grades 2-8 — 10 units each, every game pack present, lecture videos on disk
//              for Units 1-9, Unit 10 the capstone launch. None has eBooks,
//              which is why visibleSections() drops Books where a unit has none,
//              exactly as it drops Games.
//
// Grades 5-8 additionally needed a check Grades 1-4 did not. They are the
// grades WITHOUT decks (BOTH_DESIGNS is gradeNumber <= 4), and at Grades 1-4
// several sections can be finished from a deck's finish card. Every classic
// renderer was confirmed to carry its own completion control first — walking all
// eleven countable sections of Grade 5 Unit 1 in the browser, each one offering
// a way to finish and no deck rendering — or gating them would have stranded
// learners in sections with no way out.
//
// This is now true for every grade the app serves. Narrowing it later means
// putting a grade test back here, not deleting the constant: everything that
// reads it treats "not gated" as a real state.
// Every grade is gated by default, and an admin can suspend a whole course
// without a code change or a release: data/gating.json beside the manifest
// carries `sequentialLocking`, and "suspended" opens that course completely.
// It lives in the CONTENT tier, which is cached for five minutes, so a change
// reaches learners in minutes through upload-content-to-bunny.js.
//
// Not final at module scope — the file has not been fetched yet. load() settles
// it, and everything that reads it does so at render time or later, exactly as
// with unitLocked. A missing or unreadable file leaves gating ON: the safe
// default is the course behaving as it was built to, not silently unlocked.
let UNIT_GATE_ENABLED = true;
let gatingSuspendedReason = "";

// Reads data/gating.json for this course and applies it. Deliberately forgiving
// in one direction only: a 404, a parse error, an unreachable network or a value
// it does not recognise all leave gating ON. A course that opens itself because
// a file failed to load is a silent failure a learner would never report, while
// a course that stays gated when it should not is one an admin sees at once and
// can fix by re-checking the file.
//
// "suspended" is the only word that switches it off, and it is compared
// case-insensitively after trimming — an admin editing JSON by hand should not
// be defeated by " Suspended".
async function applyCourseGating(ctx) {
  // The Moodle setting first. It rides in the signed token as `gate`, set by the
  // admin screen (local_prequran :: Sequential locking), and it is checked before
  // the file because it is the lever with a human behind it and no CDN in the
  // way — it applies at the launch itself rather than waiting on a cache.
  //
  // Either lever can suspend and neither can force locking back ON: the claim is
  // absent unless an admin has ticked the box, so an un-ticked setting simply has
  // no opinion and the file decides. Both must be clear for a course to gate.
  if (LAUNCH_CLAIMS?.gate === "suspended") {
    UNIT_GATE_ENABLED = false;
    gatingSuspendedReason = "Suspended by an administrator in Moodle";
    return;
  }
  try {
    // no-store, and a cache-busting query. This file is CONFIG, not content:
    // an admin flips it expecting an effect, and the default cache mode made
    // restoring one unreliable. Suspending Grade 1 on production and switching
    // it straight back, the browser kept applying "suspended" through a full
    // page reload, because its own copy was still inside the five-minute TTL —
    // and the edge object it came from was serving past that TTL as well. The
    // query defeats both: the browser treats it as a URL it has never seen, and
    // it misses the stuck edge entry (verified on production — the plain URL
    // returned "suspended" while ?x=… returned "on" from the same POP).
    //
    // It costs one uncached request of about 200 bytes per course load, which is
    // the right price for a control an admin has to be able to trust.
    const response = await fetch(new URL(`gating.json?t=${Date.now()}`, ctx.dataRootUrl), { cache: "no-store" });
    if (!response.ok) return; // not published for this course yet — gated
    const config = await response.json();
    const setting = String(config?.sequentialLocking ?? "").trim().toLowerCase();
    if (setting === "suspended") {
      UNIT_GATE_ENABLED = false;
      gatingSuspendedReason = String(config?.suspendedReason ?? "").trim();
    }
  } catch {
    /* offline, malformed, or absent: the course stays as it was built */
  }
}
const CAPSTONE_UNIT = 10;
// The Teacher view is a preview, not a lesson: a teacher or parent planning
// ahead has to be able to open Unit 6 in week one. This is no weaker than what
// is already there — #teacher has never been gated — and a learner who lands on
// it gets the teacher's page, not the lesson.
const TEACHER_PREVIEW = location.hash.slice(1) === "teacher";
// A remediation visit. The placement exam is the one part of the course that
// sends a learner BACKWARDS on purpose: fail a section and the report names the
// earlier units that rebuild exactly what it tested. Those units are in an
// earlier grade the learner has never walked, so the gate locked every one of
// them that was not that grade's first — the exam offered "Grade 2, Unit 5:
// Let's Measure" and the link landed on "finish Unit 4 first". Targeted
// remediation is the whole point; a learner sent to rebuild measurement cannot
// rebuild it in Welcome and Calendar.
//
// It opens ONE unit — the one the link names — and travels no further, because
// courseLocation() and gradeLocation() strip it. Navigate anywhere from here
// and the gate is back. Finishing this unit opens nothing either: unitIsUnlocked
// still counts every earlier unit, and this learner has not done them.
const REVIEW_VISIT = new URLSearchParams(location.search).get("review") === "1";
const unitProgressKey = (unit) => `ehel-english-g${gradeNumber}-u${unit}-progress-v1`;
// Everything the shell counts toward 100%: the section list minus the two it
// never counts, minus the two a unit can fail to offer. `final-quiz` is
// nonCountable too, but it is never in `sections` — it is appended to the nav
// for Unit 10 alone.
//
// The availability filter here must match visibleSections()'s, or the gate and
// the progress bar count different things: with Books excluded from the nav but
// still demanded here, a Grade 2 unit read 100% on the bar and stayed unfinished
// to the gate, so the next unit never opened. It cannot simply CALL
// visibleSections() — that reads unitIsLocked(), which resolves through this,
// and the cycle throws before either exists.
//
// The exclusion list must match config.nonCountable below, for the same reason:
// `ai` was dropped there because Wehel Tutor is help rather than a lesson, and
// leaving it demanded here would have made the bar read 100% while the gate held
// the next unit shut.
const countableSectionIds = () => sections
  .filter(([id]) => !["overview", "live", "teacherguide", "unit-plan", "story-library"].includes(id))
  .filter(([id]) => (id !== "games" || gamePack) && (id !== "ebooks" || unitEbooks().length))
  .map(([id]) => id);
// The server's view of every unit, handed over by the shell before load() and
// null on a per-device launch. localStorage alone made this gate a per-device
// gate: a learner who finished Units 0-6 at school opened the course at home,
// where nothing is stored, and found the whole year locked again. The two are
// merged rather than swapped — a section finished on THIS device but not yet
// flushed to the gateway still counts.
let remoteUnits = null;
const remoteUnitKey = (unit) => `u${String(unit).padStart(2, "0")}`;
function unitSectionsDone(unit) {
  let local = [];
  try {
    const stored = JSON.parse(localStorage.getItem(unitProgressKey(unit)) || "{}");
    if (Array.isArray(stored.completed)) local = stored.completed;
  } catch {
    local = [];
  }
  const remote = remoteUnits?.[remoteUnitKey(unit)]?.sectionsDone;
  return Array.isArray(remote) ? [...new Set([...local, ...remote])] : local;
}
function unitIsComplete(unit) {
  const done = unitSectionsDone(unit);
  return countableSectionIds().every((id) => done.includes(id));
}
// EVERY earlier unit, not just the one immediately before. Testing only the
// predecessor left holes: a learner carrying progress from before the gate —
// or from a unit they were sent straight to — could have Unit 5 finished and
// Units 1-4 not, which opened Unit 6 while Units 2-5 stayed shut. A sequence
// with gaps in it is not a sequence, and it reads as a bug on the page.
function unitIsUnlocked(unit) {
  const number = Number(unit);
  if (!UNIT_GATE_ENABLED || number === PREREQ_UNIT || number <= defaultUnit) return true;
  for (let earlier = defaultUnit; earlier < number; earlier += 1) {
    if (!unitIsComplete(earlier)) return false;
  }
  return true;
}
// The unit the learner is actually up to: the first one they have not finished.
// Always unlocked by construction, so it is the safe place to send anyone who
// arrives at a locked one.
function currentOpenUnit() {
  let unit = defaultUnit;
  while (unit < CAPSTONE_UNIT && unitIsComplete(unit)) unit += 1;
  return unit;
}
// Not final until load() has seen the server's progress: this module is
// evaluated long before the gateway answers, so the first answer here is only
// the per-device guess. Everything that reads it does so at render time or
// later, and that is now load-bearing rather than incidental.
//
// COMPUTED ON FIRST READ, never at module scope. unitIsUnlocked() reaches
// countableSectionIds(), which reads `gamePack` (`let`, declared ~500 lines
// below) and `ebookCatalog` (`const`, declared below). Evaluating either
// before its declaration is a temporal-dead-zone ReferenceError, and it threw
// while the module was still initialising — so nothing rendered at all. Every
// gated unit past its grade's first went blank: Grade 1 Units 1-10 and Grade 2
// Units 2-10, a white page with `Cannot access 'gamePack' before
// initialization` in the console. It hid from the obvious checks because
// unitIsUnlocked() returns early for the prerequisite unit and for
// `number <= defaultUnit`, so Grade 1 Unit 0, Grade 2 Unit 1 and every
// ungated grade loaded perfectly.
//
// Reading it lazily is the fix rather than hoisting: `ebookCatalog` is a
// 400-line literal, and moving that above the gate to satisfy an
// initialisation order would bury the thing this file is actually about.
const computeUnitLocked = () => !isPrereqUnit && !TEACHER_PREVIEW && !REVIEW_VISIT && !unitIsUnlocked(unitNumber);
let unitLockedCache = null;
function unitIsLocked() {
  if (unitLockedCache === null) unitLockedCache = computeUnitLocked();
  return unitLockedCache;
}

// --- section gate: the sidebar walked in order -------------------------------
// The same chain one level down. Inside an open unit the teaching sections come
// one at a time — the lecture, then the words, then the story — and a finished
// section stays open, because going back over Reading is not a step backwards.
//
// Three sidebar entries are deliberately NOT steps:
//   overview — the landing page, and the route every guard falls back to.
//   ai       — Wehel Tutor is the help. Locking a stuck learner out of the tutor
//              is the opposite of what it is for, and the floating dock puts the
//              same chat on every page anyway, so locking the nav entry would
//              only be a lie about where help lives.
//   live     — a scheduled class happens when it is scheduled.
// `ai` still counts toward finishing the unit; it is available throughout
// rather than at one point in the line.
// Overview is step ONE, not scenery: a learner meets what the unit is about
// before Teacher Musa starts teaching it. It is the one step with no "done" of
// its own, so pressing a button that leads out of it — "Start with Teacher
// Musa", or Continue — is what finishes it (see renderOverview). Auto-finishing
// it on sight was the alternative and is worthless: Overview is the route the
// app lands on, so the lecture would unlock before the page had been read.
// It stays nonCountable, so completing it adds nothing to the unit's 100%.
const SECTION_CHAIN = ["overview", "lecture", "dictionary", "reading", "comprehension", "grammar", "speaking", "writing", "activities", "games", "quiz", "ebooks", "reflect", "final-quiz"];
// Built against what this unit actually shows: a unit with no game pack has no
// Games entry, and a chain that still demanded it would stall the learner at
// the Quiz forever. `final-quiz` only exists on Unit 10, and comes last there.
const sectionChain = () => SECTION_CHAIN.filter((id) => visibleSections().some(([visible]) => visible === id));
// `fromOverview` answers the question as the Overview's own guide asks it: the
// button on that page is what completes Overview, so from there the lecture is
// one press away and must read as open, not padlocked behind the page it is on.
function sectionUnlocked(id, { fromOverview = false } = {}) {
  if (!UNIT_GATE_ENABLED || isPrereqUnit || TEACHER_PREVIEW) return true;
  const chain = sectionChain();
  const index = chain.indexOf(id);
  if (index <= 0) return true; // not a step, or the first one
  if (fromOverview) return chain.slice(1, index).every((step) => progress.completed.includes(step));
  // EVERY earlier step, and nothing else. A section being finished does NOT open
  // it: that exemption was here as "revisiting is free" and it punched exactly
  // the holes the rule above was written to close. A Grade 2 learner carrying a
  // finished Grammar from before the gate existed saw it open and current with
  // Vocabulary, Reading and Comprehension locked above it — a padlocked list
  // with a live item in the middle, which reads as the lock being broken.
  //
  // Revisiting is not lost, it is ordered: once the steps above a finished
  // section are done, its prefix is complete and it opens again. On the normal
  // forward path that is always true, so a learner going back over their own
  // work never meets a lock.
  return chain.slice(0, index).every((step) => progress.completed.includes(step));
}
// Where the learner is up to: the first step they have not finished.
function nextOpenSection() {
  const chain = sectionChain();
  return chain.find((id) => !progress.completed.includes(id)) || chain[chain.length - 1];
}
const sectionLabel = (id) => (sections.find(([sid]) => sid === id) || [null, null, id])[2];

// The shell renders the nav from one shared template that has no idea about
// locking, so the locks are painted on afterwards, on every nav render. Only
// locked buttons are touched: the shell rebuilds the markup each time, so an
// unlocked one is already clean, and rewriting its label here would drop the
// ", completed" the shell puts there for a screen reader.
function paintSectionLocks() {
  if (!UNIT_GATE_ENABLED || unitIsLocked()) return;
  for (const button of $$("#section-nav [data-route]")) {
    if (sectionUnlocked(button.dataset.route)) continue;
    button.disabled = true; // a disabled button fires no click, so this IS the block
    button.style.opacity = ".55";
    button.style.cursor = "not-allowed";
    // Locked looks locked, always — including a section already finished that is
    // waiting for the steps above it. Keeping the ✓ on those was tried and
    // reported as a bug twice: a padlocked list with green ticks scattered up it
    // reads as the lock being broken, and the reader cannot tell a finished-but-
    // waiting row from one that is simply open. One state, one icon.
    //
    // Nothing is lost. The completion is still stored, the tick returns the
    // moment the section opens, and the label still says so for a screen reader
    // — which is where "you have done this" belongs while the row is not
    // actionable anyway.
    const done = progress.completed.includes(button.dataset.route);
    const label = button.getAttribute("title") || button.dataset.route;
    button.setAttribute("aria-label", done ? `${label}, completed, opens again in order` : `${label}, locked`);
    const state = button.querySelector(".nav-state");
    if (state) { state.classList.remove("done"); state.textContent = "🔒"; }
  }
}

// The pickers are repainted on every nav render, not only at boot: finishing the
// last section of Unit 6 opens Unit 7 with no reload, and a picker that only
// knew the state at boot would still show it locked — the learner would have
// done the work and watched nothing open.
let announcedOpenUnit = null;
function renderUnitPickers() {
  if (!manifest) return;
  // The Year plan rides in the unit picker directly under the Prerequisite
  // entry, so it is one press away from anywhere in the course rather than
  // only from the Prerequisite unit's own sidebar. Its option value is a
  // route, not a unit number — the change handler below the pickers routes it.
  const onYearPlan = isPrereqUnit && location.hash.slice(1) === "year-plan";
  const options = [
    `<option value="${PREREQ_UNIT}" ${isPrereqUnit && !onYearPlan ? "selected" : ""}>Prerequisite: Placement exam</option>`,
    `<option value="year-plan" ${onYearPlan ? "selected" : ""}>Grade Study Plan</option>`,
    // A unit below defaultUnit is withdrawn from learners (Grade 1 Unit 0).
    // It is listed only while it is the page actually open — a teacher preview
    // or a remediation visit — so the picker never contradicts where the
    // visitor is standing; every other render leaves it out entirely. Even
    // then it is drawn selected and DISABLED with a "review only" marker, the
    // withdrawn-stage treatment Global Perspectives uses, so it cannot be read
    // as a live unit of the year.
    ...manifest.units.filter((unit) => Number(unit.number) >= defaultUnit || Number(unit.number) === unitNumber).map((unit) => {
      if (Number(unit.number) < defaultUnit) {
        return `<option value="${unit.number}" selected disabled>Unit ${unit.number}: ${escapeHtml(unit.title)} — review only</option>`;
      }
      // The unit a remediation link opened is not drawn as locked, or the page
      // contradicts itself: the lesson renders while its own picker calls it shut.
      // Only that one — the rest of the grade stays locked in the list.
      const locked = !TEACHER_PREVIEW && !(REVIEW_VISIT && unit.number === unitNumber) && !unitIsUnlocked(unit.number);
      const label = `Unit ${unit.number}: ${escapeHtml(unit.title)}`;
      return `<option value="${unit.number}" ${unit.number === unitNumber ? "selected" : ""} ${locked ? "disabled" : ""}>${locked ? `🔒 ${label} (locked)` : label}</option>`;
    }),
  ].join("");
  for (const picker of [$("#unit-select"), $("#top-unit-select")]) {
    if (picker) picker.innerHTML = options;
  }
  if (!UNIT_GATE_ENABLED) return;
  const open = currentOpenUnit();
  // First paint records where the learner stands; only a later advance is news.
  if (announcedOpenUnit !== null && open > announcedOpenUnit) toast(`Unit ${open} is open now. Great work!`);
  announcedOpenUnit = open;
}

const ebookCatalog = [
  {
    id: "smile-please",
    title: "Smile Please!",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "Follow a young fawn as he races through the forest and discovers a reason to smile.",
    author: "Sanjiv Jaiswal 'Sanjay'",
    illustrator: "Ajit Narayan",
    translator: "Manisha Chaudhry",
    sourcePdf: "./ebooks/smile-please/original.pdf",
    attribution: "Smile Please! (English), translated by Manisha Chaudhry, published by Pratham Books (© Pratham Books, 2007), based on the original Hindi story written by Sanjiv Jaiswal 'Sanjay' and illustrated by Ajit Narayan. Licensed CC BY 4.0 on StoryWeaver. Digitally adapted by Ehel Academy; the illustrations and story wording are preserved.",
    pages: [
      { image: "page-01.webp", text: "Smile Please! Written by Sanjiv Jaiswal 'Sanjay'. Illustrated by Ajit Narayan. Translated by Manisha Chaudhry.", alt: "Cover illustration of a fawn and rabbit racing through a green forest" },
      { image: "page-02.webp", text: "A fawn was racing in the forest.", alt: "A young fawn running quickly through the forest" },
      { image: "page-03.webp", text: "He was ahead of the rabbit.", alt: "The fawn racing ahead of a white rabbit" },
      { image: "page-04.webp", text: "He was ahead of the elephant.", alt: "The fawn racing ahead of a smiling elephant" },
      { image: "page-05.webp", text: "He leapt and cleared the stream.", alt: "The fawn leaping over a stream" },
      { image: "page-06.webp", text: "He ran past the crumbling wall.", alt: "The fawn running past an old wall" },
      { image: "page-07.webp", text: "There was a large boulder on the grassy plain. He stumbled and fell down.", alt: "The fawn stumbling over a boulder on the grass" },
      { image: "page-08.webp", text: "He burst into tears.", alt: "The fawn sitting on the ground and crying" },
      { image: "page-09.webp", text: "The monkey massaged his leg. Tears flowed from the fawn's eyes.", alt: "A monkey gently massaging the crying fawn's leg" },
      { image: "page-10.webp", text: "Brother Bear picked him up. The fawn didn't stop crying.", alt: "A bear comforting and lifting the crying fawn" },
      { image: "page-11.webp", text: "His mother came. She said, “Look, we'll beat up this bad boulder!”", alt: "The mother deer standing beside her young fawn" },
      { image: "page-12.webp", text: "The fawn said, “Oh, don't do that or he will also start crying.” His mother laughed. So did the fawn.", alt: "The mother deer and fawn smiling and laughing together" },
    ],
  },
  {
    id: "too-big-too-small",
    title: "Too Big! Too Small!",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "Shanu wonders how she can be too big for some things and too small for others.",
    author: "Lavanya Karthik",
    illustrator: "Lavanya Karthik",
    sourcePdf: "./ebooks/too-big-too-small/original.pdf",
    attribution: "Too Big! Too Small! (English), written and illustrated by Lavanya Karthik, supported by Parag: A Sir Ratan Tata Trust Initiative, published by Pratham Books (© Pratham Books, 2017). Licensed CC BY 4.0 on StoryWeaver. Digitally adapted by Ehel Academy; the illustrations and story wording are preserved.",
    pages: [
      { image: "page-01.webp", text: "Too Big! Too Small! Written and illustrated by Lavanya Karthik.", alt: "Cover illustration showing Shanu, two cats and a pair of grown-up feet" },
      { image: "page-02.webp", text: "“I can't lift you up, Shanu!” says Ammi. “You are too big!”", alt: "Shanu asking Ammi to lift her" },
      { image: "page-03.webp", text: "“You can't walk to school alone, Shanu!” says Abbu. “You are too small!”", alt: "Abbu following Shanu as she walks with her school bag" },
      { image: "page-04.webp", text: "“You can't sleep in the baby's cot, Shanu!” says Dadu. “You are too big!”", alt: "Shanu trying to climb into the baby's cot while Dadu watches" },
      { image: "page-05.webp", text: "“You can't carry the baby to the park, Shanu!” says Dadi. “You are too small!”", alt: "Shanu trying to carry the baby while Dadi watches" },
      { image: "page-06.webp", text: "Shanu is puzzled. Too big! Too small! How can she be too big and too small all at once?", alt: "A puzzled Shanu imagining herself as very small" },
      { image: "page-07.webp", text: "Too big to wear her old pink frock. Too small to make dosas at the stove.", alt: "Shanu holding her old pink frock and looking at a dosa cooking on the stove" },
      { image: "page-08.webp", text: "Too big to climb up on Dadu's back? Too small to carry the baby on hers?", alt: "Shanu sitting on Dadu's back and imagining carrying the baby" },
      { image: "page-09.webp", text: "“What am I the right size for?” Shanu wonders.", alt: "Shanu sitting on a large cat and wondering about her size" },
      { image: "page-10.webp", text: "Ammi smiles and says, “Why, you are just big enough to go to big school.”", alt: "Ammi smiling as she shows Shanu her school uniform" },
      { image: "page-11.webp", text: "“And you are just small enough for me to carry you on my shoulders,” says Abbu.", alt: "A happy Shanu riding on Abbu's shoulders" },
      { image: "page-12.webp", text: "“You are just big enough to take me for my morning walks,” says Dadu.", alt: "Shanu and Dadu enjoying a morning walk together" },
      { image: "page-13.webp", text: "“And you are just small enough for me to tell stories to,” says Dadi.", alt: "Dadi telling Shanu a story filled with imaginative characters" },
      { image: "page-14.webp", text: "“And you will always, always be the perfect size for this!” all say, and give her a warm, wonderful hug.", alt: "Shanu receiving a warm family hug" },
    ],
  },
  {
    id: "musas-muddy-stripes",
    title: "Musa's Muddy Stripes",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "Musa slips into a muddy puddle, and his savanna friends help his stripes shine again.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    sourcePdf: "./ebooks/musas-muddy-stripes/original.pdf",
    attribution: "Musa's Muddy Stripes is an original Grade 1 story created for Ehel Academy in 2026. Story and illustrations by Ehel Academy Learning Studio, drawn in the shared Musa series vector style. No story wording or artwork from Smile Please! was reused.",
    pages: [
      { image: "page-01.svg", sound: "zebra-happy", text: "Musa's Muddy Stripes. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa the young zebra standing with a giraffe, elephant, ostrich and vervet monkey on the African savanna" },
      { image: "page-02.svg", text: "Musa the zebra loved to run.", alt: "Musa running through golden savanna grass on a sunny morning" },
      { image: "page-03.svg", sound: "giraffe", text: "He ran past the tall giraffe.", alt: "Musa running ahead of his smiling giraffe friend" },
      { image: "page-04.svg", sound: "elephant-happy", text: "He ran past the little elephant.", alt: "Musa running ahead while a young elephant waves her trunk" },
      { image: "page-05.svg", sound: "ostrich", text: "He ran past the swift ostrich.", alt: "Musa and his ostrich friend running together across the savanna" },
      { image: "page-06.svg", text: "He leapt over a fallen branch.", alt: "Musa making a joyful leap over a small fallen branch" },
      { image: "page-07.svg", sound: "puddle", text: "Then - SPLASH! Musa slipped into a muddy puddle.", alt: "A surprised Musa landing safely in a shallow muddy puddle" },
      { image: "page-08.svg", sound: "zebra-sad", text: "Mud covered his stripes. Musa felt sad.", alt: "Musa standing sadly beside the puddle with wet mud on his stripes" },
      { image: "page-09.svg", sound: "monkey", text: "The vervet monkey brushed him with soft leaves. But the mud stayed.", alt: "A vervet monkey gently brushing mud from Musa with green leaves" },
      { image: "page-10.svg", sound: "elephant-happy", text: "The elephant sprayed Musa with cool water. Splash, splash, splash!", alt: "The young elephant rinsing muddy Musa with a sparkling arc of water" },
      { image: "page-11.svg", sound: "ostrich", text: "The ostrich fanned him. The giraffe found a warm, sunny place.", alt: "The ostrich fanning Musa while the giraffe points toward the warm sun" },
      { image: "page-12.svg", sound: "zebra-happy", text: "Musa's stripes shone again. \"Thank you, friends!\" he said. Then everyone splashed and laughed.", alt: "A clean and happy Musa splashing in the puddle while all his friends laugh together" },
    ],
  },
  {
    id: "musa-helps-a-friend",
    title: "Musa Helps a Friend",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "The little elephant is stuck in the mud, and Musa knows just what good friends can do.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Musa Helps a Friend is an original Grade 1 story created for Ehel Academy in 2026, the sequel to Musa's Muddy Stripes. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "zebra-happy", text: "Musa Helps a Friend. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa the young zebra with the giraffe, little elephant, ostrich and vervet monkey around a big puddle on the savanna" },
      { image: "page-02.svg", sound: "tree", text: "Rain fell all night. The savanna was full of puddles.", alt: "The savanna on a gray morning after rain, dotted with fresh puddles" },
      { image: "page-03.svg", sound: "puddle", text: "Musa the zebra ran out to play. Splish, splash!", alt: "Musa happily splashing through a shallow puddle in the morning light" },
      { image: "page-04.svg", sound: "elephant-sad", text: "Then he heard a sad sound. \"Help! Help!\"", alt: "Musa standing alert with his ears up, listening toward the tall reeds" },
      { image: "page-05.svg", text: "The little elephant was stuck in the deep mud.", alt: "The little elephant stuck belly-deep in a wide muddy puddle, looking sad" },
      { image: "page-06.svg", sound: "zebra-happy", text: "\"Do not be sad,\" said Musa. \"Friends can help!\"", alt: "Musa at the edge of the puddle speaking kindly to the sad little elephant" },
      { image: "page-07.svg", sound: "monkey", text: "Musa called the giraffe, the ostrich, and the monkey.", alt: "The giraffe, ostrich and vervet monkey hurrying across the grass toward Musa" },
      { image: "page-08.svg", text: "The monkey found a long, strong vine. The elephant held it with her trunk.", alt: "The vervet monkey holding one end of a long vine while the little elephant grips the other end with her trunk" },
      { image: "page-09.svg", sound: "ostrich", text: "Musa pulled. The giraffe pulled. The ostrich pulled. \"One, two, three!\"", alt: "Musa, the giraffe and the ostrich pulling the vine together while the monkey cheers" },
      { image: "page-10.svg", sound: "elephant-surprised", text: "POP! Out came the little elephant. Mud flew everywhere!", alt: "The little elephant popping free of the mud as drops of mud fly through the air" },
      { image: "page-11.svg", sound: "monkey", text: "Now everyone was muddy. They laughed and laughed.", alt: "All five friends speckled with mud, laughing together beside the puddle" },
      { image: "page-12.svg", sound: "elephant-happy", text: "\"Thank you, friends!\" said the little elephant. \"Helping a friend is the best game of all.\"", alt: "The friends splashing in clean rainwater under a soft rainbow while the little elephant beams" },
    ],
  },
  {
    id: "musas-big-race",
    title: "Musa's Big Race",
    grades: [1],
    units: [0],
    level: "Level 1",
    description: "It is race day on the savanna, and Musa must choose between winning and a friend.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Musa's Big Race is an original Grade 1 story created for Ehel Academy in 2026, book three of the Musa series after Musa's Muddy Stripes and Musa Helps a Friend. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "zebra-happy", text: "Musa's Big Race. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa the young zebra with the giraffe, little elephant, ostrich and vervet monkey under a colorful race-day banner" },
      { image: "page-02.svg", text: "It was race day on the savanna. All the friends came to run.", alt: "The five friends lining up near the bunting banner on a bright morning" },
      { image: "page-03.svg", sound: "monkey", text: "\"Ready, steady, go!\" called the monkey.", alt: "The monkey raising both arms to start the race as Musa, the ostrich and the elephant burst into a run" },
      { image: "page-04.svg", sound: "zebra-happy", text: "Musa ran fast. He was in front!", alt: "Musa running joyfully in front while the giraffe, ostrich and elephant follow behind" },
      { image: "page-05.svg", sound: "tree", text: "He ran past the big acacia tree.", alt: "Musa running past one grand old acacia tree" },
      { image: "page-06.svg", text: "He leapt over the fallen branch.", alt: "Musa making a clean joyful leap over the familiar fallen branch" },
      { image: "page-07.svg", sound: "elephant-sad", text: "Then - BUMP! The little elephant tripped and fell.", alt: "The little elephant sitting fallen in the grass with soft dust puffs around her while the ostrich races ahead" },
      { image: "page-08.svg", sound: "zebra-surprised", text: "Musa stopped. The finish line was so close!", alt: "Musa stopped mid-race, looking back toward his fallen friend with the finish banner close behind him" },
      { image: "page-09.svg", text: "Musa ran back. \"Are you hurt, my friend?\" he asked.", alt: "Musa running back to the sad little elephant with a small heart floating in the air" },
      { image: "page-10.svg", sound: "elephant-happy", text: "He helped her up. They ran the last part together.", alt: "Musa and the smiling little elephant running side by side toward the distant banner" },
      { image: "page-11.svg", sound: "ostrich", text: "The ostrich won the race. Everyone cheered and cheered!", alt: "The ostrich under the finish banner amid falling confetti while all the friends cheer" },
      { image: "page-12.svg", sound: "zebra-happy", text: "\"You stopped for me,\" said the little elephant. \"You are a real winner, Musa.\"", alt: "All five friends together under a soft rainbow with the little elephant beaming beside Musa" },
    ],
  },
  {
    id: "kiki-goes-to-school",
    title: "Kiki Goes to School",
    grades: [1],
    units: [1],
    level: "Level 1",
    description: "It is Kiki's first day at the tree school, and she is a little shy.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Kiki Goes to School is an original Grade 1 story created for Ehel Academy in 2026, book one of the Kiki series, set in the same storyworld as the Musa books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "kiki-happy", text: "Kiki Goes to School. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Kiki the young vervet monkey with her red school bag at the tree school with her teacher and classmates" },
      { image: "page-02.svg", text: "Today was Kiki's first day of school. She had a new red bag.", alt: "Kiki setting off from the baobab home with her red backpack while Mama and Papa wave" },
      { image: "page-03.svg", sound: "zebra-happy", text: "On the path she met Musa. \"Good luck, Kiki!\" he said.", alt: "Musa the zebra greeting Kiki on the path to school" },
      { image: "page-04.svg", sound: "kiki-sad", text: "The school was big. Kiki felt shy.", alt: "Kiki standing small and shy in front of the big tree school with its chalkboard and bell" },
      { image: "page-05.svg", sound: "giraffe", text: "\"Welcome!\" said Miss Twiga, the teacher.", alt: "Miss Twiga the giraffe teacher with her reading glasses bending down to welcome Kiki" },
      { image: "page-06.svg", sound: "elephant-happy", text: "Kiki sat on a bench next to the little elephant.", alt: "Kiki and the little elephant sitting together at a school bench" },
      { image: "page-07.svg", text: "They learned to say hello. \"Hello! Hello!\"", alt: "The class raising their hands by the chalkboard as they learn to say hello" },
      { image: "page-08.svg", text: "They counted one, two, three!", alt: "The class counting three dots drawn on the chalkboard" },
      { image: "page-09.svg", sound: "kiki-happy", text: "At playtime, Kiki shared her sweet mango.", alt: "Kiki sharing her mango with the little elephant at playtime" },
      { image: "page-10.svg", sound: "ostrich", text: "She made a new friend, the little ostrich.", alt: "Kiki playing with her new friend the little ostrich in the grass" },
      { image: "page-11.svg", sound: "bell", text: "Ring, ring! The school bell rang. Home time!", alt: "The school bell ringing as the children wave goodbye to Miss Twiga" },
      { image: "page-12.svg", sound: "crickets", text: "\"I love school!\" Kiki told her family that night.", alt: "Kiki telling her family about school outside the lit baobab home under the stars" },
    ],
  },
  {
    id: "kikis-family-day",
    title: "Kiki's Family Day",
    grades: [1],
    units: [2],
    level: "Level 1",
    description: "A day at home with Mama, Papa and little sister Nia in the big baobab tree.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Kiki's Family Day is an original Grade 1 story created for Ehel Academy in 2026, book two of the Kiki series, set in the same storyworld as the Musa books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "kiki-happy", text: "Kiki's Family Day. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Kiki with Mama, Papa and little sister Nia in front of the big baobab tree" },
      { image: "page-02.svg", sound: "tree", text: "Kiki's home was in the big baobab tree.", alt: "The big baobab tree home with its round door and window" },
      { image: "page-03.svg", sound: "monkey", text: "This is Mama. This is Papa. And this is her little sister, Nia.", alt: "Mama with a flower behind her ear, big Papa, and tiny little sister Nia" },
      { image: "page-04.svg", text: "Mama cooked dinner. Kiki helped stir the pot.", alt: "Mama and Kiki cooking dinner in a big pot over the fire" },
      { image: "page-05.svg", text: "Papa picked mangoes. Kiki helped carry them.", alt: "Papa picking mangoes from the tree while Kiki carries some" },
      { image: "page-06.svg", sound: "kiki-sad", text: "Little Nia dropped her banana. She cried and cried.", alt: "Little Nia crying over her dropped banana while Kiki looks around in surprise" },
      { image: "page-07.svg", sound: "kiki-happy", text: "\"Do not cry,\" said Kiki. \"You can have mine.\"", alt: "Kiki giving her own banana to little Nia with a small heart floating in the air" },
      { image: "page-08.svg", sound: "monkey", text: "The family ate dinner together. Yum, yum!", alt: "The whole monkey family eating dinner together around the pot" },
      { image: "page-09.svg", sound: "zebra-happy", text: "Papa told a story about a brave little zebra.", alt: "Papa telling a bedtime story while a little zebra runs through a thought bubble" },
      { image: "page-10.svg", sound: "lullaby", text: "Mama sang a soft, sweet song.", alt: "Mama singing a lullaby under the stars with music notes floating" },
      { image: "page-11.svg", text: "Kiki hugged her family. \"Good night, good night!\"", alt: "Kiki and Nia hugging Mama and Papa good night by the lit baobab home" },
      { image: "page-12.svg", sound: "crickets", text: "Kiki slept and dreamed of her happy home.", alt: "The quiet baobab home at night under the moon and stars" },
    ],
  },
  {
    id: "kiki-and-the-big-game",
    title: "Kiki and the Big Game",
    grades: [1],
    units: [3],
    level: "Level 1",
    description: "Ball, swing and a runaway kite - play day with Kiki and her friends.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Kiki and the Big Game is an original Grade 1 story created for Ehel Academy in 2026, book three of the Kiki series, set in the same storyworld as the Musa books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "kiki-happy", text: "Kiki and the Big Game. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the school playground with Kiki, the swing, the ball and a red kite" },
      { image: "page-02.svg", sound: "bell", text: "It was play day at school. Hooray!", alt: "Miss Twiga and the excited children at school on play day" },
      { image: "page-03.svg", sound: "ball", text: "Kiki and her friends played with the ball.", alt: "Kiki, the little elephant and the little ostrich playing with a striped ball" },
      { image: "page-04.svg", sound: "ostrich", text: "The little ostrich ran fast. Run, run, run!", alt: "The little ostrich running fast while Kiki cheers" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Kiki went high on the swing. Whee!", alt: "Kiki swinging high on the rope swing under the big acacia" },
      { image: "page-06.svg", sound: "wind", text: "They flew a big red kite. Up, up, up!", alt: "Kiki and the little elephant flying a big red kite" },
      { image: "page-07.svg", sound: "wind", text: "Then the wind took the kite. Oh no!", alt: "The wind carrying the red kite away while Kiki and the elephant watch in surprise" },
      { image: "page-08.svg", sound: "kiki-sad", text: "The kite was stuck in the tall, tall tree.", alt: "The red kite stuck high in the tall acacia while Kiki and the elephant look sad" },
      { image: "page-09.svg", sound: "kiki-surprised", text: "\"I know!\" said Kiki. \"Let us ask a tall friend.\"", alt: "Kiki jumping up with an idea while her friends watch" },
      { image: "page-10.svg", sound: "giraffe", text: "The giraffe reached up, up, up. She got the kite!", alt: "The tall giraffe reaching high into the acacia for the stuck kite" },
      { image: "page-11.svg", sound: "zebra-happy", text: "\"Thank you!\" they cheered. Musa came to play too.", alt: "The friends cheering with the rescued kite as Musa the zebra arrives to play" },
      { image: "page-12.svg", sound: "kiki-happy", text: "Everyone took turns. Games are best with friends!", alt: "All the friends playing together with the ball, the swing and the kite flying high" },
    ],
  },
  {
    id: "duku-makes-a-scarecrow",
    title: "Duku Makes a Scarecrow",
    grades: [1],
    units: [4],
    level: "Level 1",
    description: "The birds are eating Koko's seeds, so Duku and his farm friends make something wonderful.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Duku Makes a Scarecrow is an original Grade 1 story created for Ehel Academy in 2026, book one of the Duku farm series, set in the same storyworld as the Musa and Kiki books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "duku-happy", text: "Duku Makes a Scarecrow. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Duku the little donkey with Koko the hen, Gigi the goat and their scarecrow by the barn" },
      { image: "page-02.svg", sound: "duku-happy", text: "Duku the little donkey lived on a green farm.", alt: "Duku the little gray donkey standing happily on the farm by the barn and fence" },
      { image: "page-03.svg", sound: "hen", text: "Koko the hen planted little seeds.", alt: "Koko the rust-brown hen planting a neat row of little seeds" },
      { image: "page-04.svg", sound: "bird", text: "But the birds came to eat them. Oh no!", alt: "Little blue birds landing on the seed row while Koko flaps in surprise" },
      { image: "page-05.svg", sound: "duku-surprised", text: "\"Let us make a scarecrow!\" said Duku.", alt: "Duku having a bright idea while Koko and Gigi listen" },
      { image: "page-06.svg", sound: "goat", text: "Gigi the goat found a long stick.", alt: "Gigi the cream goat carrying a long wooden stick" },
      { image: "page-07.svg", sound: "hen", text: "Koko brought straw. Duku brought an old hat.", alt: "Koko by the haystack and Duku with an old brown hat" },
      { image: "page-08.svg", text: "They worked and worked. Tap, tap, tap!", alt: "The three friends building the scarecrow together with dust puffing up" },
      { image: "page-09.svg", sound: "duku-happy", text: "The scarecrow was done. It looked funny!", alt: "The finished friendly scarecrow with its hat while the friends laugh" },
      { image: "page-10.svg", sound: "bird", text: "The birds flew away... but they looked hungry.", alt: "The little birds flying away from the scarecrow while Duku watches with a sad face" },
      { image: "page-11.svg", text: "So the friends made a little garden just for the birds.", alt: "The friends planting a small garden while the little birds watch happily" },
      { image: "page-12.svg", sound: "duku-happy", text: "Now everyone had food. What a good thing to make!", alt: "The scarecrow guarding the big garden while the birds eat from their own little garden" },
    ],
  },
  {
    id: "the-little-lost-chick",
    title: "The Little Lost Chick",
    grades: [1],
    units: [5],
    level: "Level 1",
    description: "Little Pip the chick is missing, and the whole farm helps to look.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Little Lost Chick is an original Grade 1 story created for Ehel Academy in 2026, book two of the Duku farm series, set in the same storyworld as the Musa and Kiki books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "hen", text: "The Little Lost Chick. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Koko the hen with her five little yellow chicks by the barn" },
      { image: "page-02.svg", sound: "bird", text: "Good morning, farm! The sun was up.", alt: "The farm on a bright morning with Duku by the barn" },
      { image: "page-03.svg", sound: "chick", text: "Koko the hen had five little chicks.", alt: "Koko proudly watching her five little chicks in a row" },
      { image: "page-04.svg", sound: "chick", text: "One little chick liked to hop. Hop, hop, hop!", alt: "Little Pip the chick hopping happily while Koko watches" },
      { image: "page-05.svg", sound: "hen", text: "At lunch, Koko counted: one, two, three, four... Oh no!", alt: "Koko counting only four chicks and looking surprised" },
      { image: "page-06.svg", sound: "duku-sad", text: "\"Where is little Pip?\" Everyone looked and looked.", alt: "Koko, Duku and Gigi looking worried about the missing chick" },
      { image: "page-07.svg", sound: "duku-surprised", text: "Duku looked in the big barn.", alt: "Duku peering into the big red barn" },
      { image: "page-08.svg", sound: "goat", text: "Gigi looked by the pond.", alt: "Gigi the goat searching beside the blue pond" },
      { image: "page-09.svg", sound: "zebra-happy", text: "Musa looked in the tall, tall grass.", alt: "Musa the zebra searching through the tall savanna grass" },
      { image: "page-10.svg", text: "Then they heard a tiny sound. \"Peep! Peep!\"", alt: "The friends listening to a tiny sound coming from the haystack" },
      { image: "page-11.svg", sound: "chick", text: "Little Pip was asleep in the soft hay.", alt: "Little Pip the chick asleep on top of the soft haystack" },
      { image: "page-12.svg", sound: "hen", text: "\"Safe at home!\" said Koko. The whole farm was happy.", alt: "Koko with all five chicks together again while Duku and Gigi smile" },
    ],
  },
  {
    id: "dukus-five-senses",
    title: "Duku's Five Senses",
    grades: [1],
    units: [6],
    level: "Level 1",
    description: "See, hear, smell, touch and taste - a fresh farm day with Duku and a visit from Kiki.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Duku's Five Senses is an original Grade 1 story created for Ehel Academy in 2026, book three of the Duku farm series, set in the same storyworld as the Musa and Kiki books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "duku-happy", text: "Duku's Five Senses. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Duku the donkey and Kiki the monkey on the farm with a flower and a mango" },
      { image: "page-02.svg", sound: "duku-happy", text: "Duku woke up. What a fresh new day!", alt: "Duku waking up happily by the barn on a fresh morning" },
      { image: "page-03.svg", sound: "sun", text: "He saw the bright yellow sun.", alt: "Duku looking at the big bright glowing sun" },
      { image: "page-04.svg", sound: "bird", text: "He heard the little birds sing.", alt: "Duku listening to little blue birds singing in the acacia tree" },
      { image: "page-05.svg", sound: "tree", text: "He smelled the sweet mango tree.", alt: "Duku smelling the sweet scent drifting from the mango tree" },
      { image: "page-06.svg", text: "He touched the soft, soft hay.", alt: "Duku pressing his nose into the big soft haystack" },
      { image: "page-07.svg", sound: "crunch", text: "He tasted a crunchy carrot. Yum!", alt: "Duku happily tasting a big crunchy carrot" },
      { image: "page-08.svg", sound: "kiki-happy", text: "Then Kiki came to visit the farm!", alt: "Kiki the monkey arriving at the farm to visit Duku" },
      { image: "page-09.svg", sound: "bell", text: "\"Close your eyes,\" said Kiki. \"What do you hear?\" \"A bell!\"", alt: "Kiki ringing the bell while Duku guesses with his ears up" },
      { image: "page-10.svg", text: "\"What do you smell?\" \"A flower!\"", alt: "Duku smelling a big pink flower while Kiki smiles" },
      { image: "page-11.svg", sound: "crunch", text: "\"What do you taste?\" \"Sweet mango!\"", alt: "Duku tasting a sweet mango in the guessing game" },
      { image: "page-12.svg", sound: "duku-happy", text: "Eyes, ears, nose, hooves and mouth. Five senses - hooray!", alt: "Duku and Kiki celebrating with the flower, carrot, mango and a little bird" },
    ],
  },
  {
    id: "lulu-says-lets-go",
    title: "Lulu Says Let's Go!",
    grades: [1],
    units: [7],
    level: "Level 1",
    description: "Lulu the little swallow sets off on her big journey to the great lake.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Lulu Says Let's Go! is an original Grade 1 story created for Ehel Academy in 2026, book one of the Lulu journey series, set in the same storyworld as the Musa, Kiki and Duku books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "Lulu Says Let's Go! Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Lulu the little swallow flying high over the savanna while Musa and the monkey wave below" },
      { image: "page-02.svg", sound: "bird", text: "Lulu was a little swallow. She lived by the big acacia.", alt: "Lulu the blue swallow perched in the big acacia tree" },
      { image: "page-03.svg", sound: "lulu-happy", text: "It was time to fly to the great lake. \"Let's go!\"", alt: "Lulu taking off into the sky with another bird" },
      { image: "page-04.svg", sound: "zebra-happy", text: "\"Goodbye, Musa!\" called Lulu. \"See you soon!\"", alt: "Musa the zebra by his puddle waving goodbye as Lulu flies over" },
      { image: "page-05.svg", sound: "duku-happy", text: "She flew over Duku's farm. \"Good luck, Lulu!\"", alt: "Lulu flying over the farm while Duku the donkey calls up from below" },
      { image: "page-06.svg", sound: "wind", text: "Up, up, up went Lulu. The world looked small.", alt: "Lulu high in the sky with tiny trees and a tiny barn far below" },
      { image: "page-07.svg", sound: "wind", text: "She flew fast. She flew far.", alt: "Lulu speeding through the sky with wind lines behind her" },
      { image: "page-08.svg", sound: "lulu-sad", text: "Then Lulu felt tired. Her wings were slow.", alt: "A tired Lulu flying slowly under a gray sky" },
      { image: "page-09.svg", sound: "tree", text: "She stopped to rest in a tall tree.", alt: "Lulu resting quietly in a tall acacia tree" },
      { image: "page-10.svg", sound: "bird", text: "A kind old bird shared her seeds.", alt: "A kind bird sharing seeds with Lulu in the tree" },
      { image: "page-11.svg", sound: "lulu-happy", text: "\"Thank you! Now I can go on,\" said Lulu.", alt: "Lulu flying strongly again while the kind bird waves" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"The great lake is near. Let's go, let's go!\"", alt: "Lulu flying toward the sparkling water shining on the horizon" },
    ],
  },
  {
    id: "lulu-and-the-wonderful-water",
    title: "Lulu and the Wonderful Water",
    grades: [1],
    units: [8],
    level: "Level 1",
    description: "Rivers, rain, a rainbow and the great blue lake - Lulu's watery adventure.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Lulu and the Wonderful Water is an original Grade 1 story created for Ehel Academy in 2026, book two of the Lulu journey series, set in the same storyworld as the Musa, Kiki and Duku books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "Lulu and the Wonderful Water. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Lulu flying over the sparkling lake with a sailboat and a jumping fish" },
      { image: "page-02.svg", sound: "river", text: "Lulu followed the little river.", alt: "Lulu flying above a winding blue river" },
      { image: "page-03.svg", sound: "river", text: "The river ran down the hills. Splish, splash!", alt: "The river rushing down the hills while Lulu flies alongside" },
      { image: "page-04.svg", sound: "rain", text: "Rain began to fall. Drip, drop, drip!", alt: "Rain falling from a big cloud around a surprised Lulu" },
      { image: "page-05.svg", sound: "rain", text: "Lulu hid under a big leaf.", alt: "Lulu sheltering from the rain under a big green leaf" },
      { image: "page-06.svg", sound: "sun", text: "The rain stopped. A rainbow came out!", alt: "Lulu flying happily under a bright rainbow with fresh puddles below" },
      { image: "page-07.svg", sound: "lulu-surprised", text: "At last - the great lake! It was so big and blue.", alt: "Lulu seeing the huge blue lake spread out below her" },
      { image: "page-08.svg", sound: "puddle", text: "A little fish jumped. Hello, fish!", alt: "A little orange fish jumping from the lake to greet Lulu" },
      { image: "page-09.svg", sound: "elephant-happy", text: "The little elephant was there too, splashing!", alt: "The little elephant splashing happily in the lake while Lulu flies over" },
      { image: "page-10.svg", sound: "wind", text: "A white boat sailed by. \"Hello, Lulu!\"", alt: "A little sailboat gliding across the lake as Lulu waves" },
      { image: "page-11.svg", sound: "river", text: "Lulu drank the cool, clean water.", alt: "Lulu at the edge of the lake drinking the clean water beside a fish" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"Water is wonderful!\" sang Lulu.", alt: "Lulu flying joyfully over the lake under a rainbow with the fish and the sailboat" },
    ],
  },
  {
    id: "lulu-in-the-city",
    title: "Lulu in the City",
    grades: [1],
    units: [9],
    level: "Level 1",
    description: "Tall buildings, a busy market and city lights - Lulu finds friends in the big city.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Lulu in the City is an original Grade 1 story created for Ehel Academy in 2026, book three of the Lulu journey series, set in the same storyworld as the Musa, Kiki and Duku books. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "Lulu in the City. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Lulu flying toward the colorful buildings of the big city" },
      { image: "page-02.svg", sound: "lulu-surprised", text: "Past the lake was the big city. Wow!", alt: "Lulu seeing the city skyline rise up beyond the lake" },
      { image: "page-03.svg", sound: "market", text: "The streets were busy. The buildings were tall.", alt: "Lulu flying along a busy street between tall colorful buildings and lamp posts" },
      { image: "page-04.svg", sound: "market", text: "Lulu found the market. So many mangoes!", alt: "The market stall piled with mangoes under a striped awning" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Kiki and Mama were there! \"Lulu! Welcome!\"", alt: "Kiki and Mama at the market waving up at Lulu" },
      { image: "page-06.svg", sound: "bird", text: "They showed her the city park.", alt: "The green city park with trees and a lamp post where Kiki plays" },
      { image: "page-07.svg", sound: "lulu-surprised", text: "They showed her the big clock tower.", alt: "The tall clock tower rising above Lulu and Kiki" },
      { image: "page-08.svg", sound: "bell", text: "Ding! Dong! The clock sang to the city.", alt: "Sound waves ringing out from the clock tower as Lulu flies past" },
      { image: "page-09.svg", sound: "sun", text: "At night, the city lights came on. So pretty!", alt: "The city at night with glowing golden windows and street lamps" },
      { image: "page-10.svg", sound: "lulu-happy", text: "Lulu made a nest by the park lamp.", alt: "Lulu settling into her new nest in the park tree beside the glowing lamp" },
      { image: "page-11.svg", sound: "lullaby", text: "The city hummed a soft good-night song.", alt: "Lulu in her nest as soft music notes float over the sleeping city" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"New places, new friends,\" said Lulu. \"But friends make every place home.\"", alt: "Lulu flying happily over the city park with Kiki, Mama and a little bird friend" },
    ],
  },
  {
    id: "the-big-friends-party",
    title: "The Big Friends Party",
    grades: [1],
    units: [10],
    level: "Level 1",
    description: "Lulu flies home, Musa calls a party, and every friend from the whole year comes.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Big Friends Party is an original Grade 1 story created for Ehel Academy in 2026, the capstone crossover of the Musa, Kiki, Duku and Lulu series. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lulu-happy", text: "The Big Friends Party. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Musa, Kiki, Duku, Lulu, the little elephant and the monkey gathered under a party banner and rainbow" },
      { image: "page-02.svg", sound: "lulu-happy", text: "One bright day, Lulu flew home from the big city.", alt: "Lulu flying home across the savanna with the city small behind her" },
      { image: "page-03.svg", sound: "zebra-happy", text: "\"Let us have a party!\" said Musa. \"A party for all our friends!\"", alt: "Musa having his big party idea while Lulu circles overhead" },
      { image: "page-04.svg", sound: "kiki-happy", text: "Kiki came from school with Miss Twiga and the games.", alt: "Kiki with her backpack, Miss Twiga the teacher, the ball and the red kite" },
      { image: "page-05.svg", sound: "duku-happy", text: "Duku came from the farm with mangoes and sweet carrots.", alt: "Duku, Koko and Gigi arriving from the farm with mangoes and carrots" },
      { image: "page-06.svg", sound: "elephant-happy", text: "The little elephant filled the puddle with clean water.", alt: "The little elephant spraying clean water into the big puddle while Lulu watches" },
      { image: "page-07.svg", text: "They made a long, long table. Tap, tap, tap!", alt: "Duku, Kiki and Gigi building a long party table together" },
      { image: "page-08.svg", sound: "monkey", text: "\"Hello! Hello!\" Everyone said hello to everyone.", alt: "All the friends greeting each other under the party banner" },
      { image: "page-09.svg", sound: "ball", text: "They played ball. They flew the kite. They took turns.", alt: "The friends playing with the ball, the kite and the swing together" },
      { image: "page-10.svg", sound: "lullaby", text: "They ate. They sang. Mama sang the soft song.", alt: "The friends eating at the long table while Mama sings with music notes floating" },
      { image: "page-11.svg", sound: "crickets", text: "At night, the stars came out. The chicks slept in the hay.", alt: "The party under the stars with the chicks asleep in the hay and Lulu in her nest" },
      { image: "page-12.svg", sound: "lulu-happy", text: "\"Look at our world,\" said Lulu. \"School and farm, water and city - and friends everywhere!\"", alt: "All the friends together under the rainbow with the city small on the horizon" },
    ],
  },
  {
    id: "bheema-the-sleepyhead",
    title: "Bheema, the Sleepyhead",
    grades: [1],
    units: [0],
    level: "Level 1 · developing reader",
    description: "Bheema tries several ways to wake up early before a tiny friend finally helps him.",
    author: "Kiran Kasturia",
    illustrator: "Shweta Mohapatra",
    translator: "Rajesh Khar",
    sourcePdf: "./ebooks/bheema-the-sleepyhead/original.pdf",
    attribution: "Bheema, the Sleepyhead (English), translated by Rajesh Khar, published by Pratham Books (© Pratham Books, 2012), based on the original Hindi story written by Kiran Kasturia and illustrated by Shweta Mohapatra. Licensed CC BY 4.0 on StoryWeaver. Digitally adapted by Ehel Academy; the illustrations and story wording are preserved.",
    pages: [
      { image: "page-01.webp", text: "Bheema, the Sleepyhead. Written by Kiran Kasturia. Illustrated by Shweta Mohapatra. Translated by Rajesh Khar.", alt: "Cover illustration of a sleepy donkey with a fly on his head" },
      { image: "page-02.webp", text: "Bheema loves to sleep and just cannot get up early. Ramu, the washerman, scolds Bheema often.", alt: "Bheema the donkey sleeping peacefully" },
      { image: "page-03.webp", text: "One day, Gauri, the cow, asked him, “Bheema, why are you so sad?” Bheema said, “I cannot get up early and Ramu shouts at me every day. Will you wake me up every morning, please?” “Yes, I will,” said Gauri. Early next morning, Gauri mooed loudly, but Bheema did not wake up.", alt: "Gauri the cow looking at Bheema while he sleeps" },
      { image: "page-04.webp", text: "Coming back from the river in the evening, Bheema met Moti, the dog. “I can never get up in the morning on time. Will you wake me up?” Bheema asked Moti. “Yes, I will,” said Moti, and the next morning he barked and barked, but did Bheema wake up? No, sir!", alt: "Bheema speaking to Moti the dog beside some steps" },
      { image: "page-05.webp", text: "That evening Bheema met Cheenu, the rooster. He said to Cheenu, “You crow in the morning and everybody wakes up. Will you wake me up too?” Cheenu agreed. The next morning, Cheenu crowed long and loud, but Bheema did not wake up.", alt: "Cheenu the rooster crowing beside the sleeping Bheema" },
      { image: "page-06.webp", text: "The next evening, Bheema saw Kalu, the crow, cawing away happily. “Kalu, will you wake me up in the morning, please?” he asked. Kalu said, “Why not? I will caw and wake you up.” The next morning Kalu cawed all he could, but Bheema did not wake up.", alt: "Kalu the crow sitting on Bheema's back" },
      { image: "page-07.webp", text: "Bheema was sad. The next morning, a fly came and sat on his nose. “Aaah… chhoooo… ahchhoo!” Bheema got up with a big sneeze.", alt: "A tiny fly sitting on the sad donkey's nose" },
      { image: "page-08.webp", text: "“Wow! I woke up. How did I wake up?” he asked in wonder. “I woke you up,” said the fly. “Will you wake me up like this early every morning?” “Sure,” said the fly. Bheema was happy. Now he would have no problem getting up early every morning!", alt: "The fly sitting on Bheema's head while Bheema smiles" },
    ],
  },

  // ---------------------------------------------------------------- Grade 1, second book
  // The Amal series: a SECOND book for each of units 1 to 10, beside the animal
  // book each unit already had. Every one is the unit's own Reading, retold as
  // twelve picture-book pages — "Amal's First Day", "Breakfast at Grandma's
  // House", "Amal and the Big Ball" and so on. So a unit shelf now holds a
  // fable and the child's own day rather than two of the same thing.
  //
  // The cast is the course's own: Amal, her brother Adam, her friend Samira,
  // little Leo, baby Idris, her sister Hodan, Ayeeyo her grandmother, Grandpa,
  // Omar the shopkeeper and Faduma the doctor all appear by name in the Year 1
  // passages. They are drawn with the same person() the Grade 3 and Grade 4
  // books use, two years younger.
  // Illustrations: tools/create-amal-ebook-illustrations.js.
  {
    id: "amals-first-day",
    title: "Amal's First Day",
    grades: [1],
    units: [1],
    level: "Level 1",
    description: "Amal starts school, names everything she sees, and makes a friend called Adam.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal's First Day is an original Grade 1 picture book created for Ehel Academy in 2026, book one of the Amal series. It retells the Unit 1 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "child-happy", text: "Amal's First Day. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal in her classroom with her teacher, Adam and Samira, beside a table and the alphabet chart" },
      { image: "page-02.svg", sound: "woman-happy", text: "Today was Amal's first day at school. She held her mother's hand.", alt: "Amal and her mother standing outside the school building in the morning sun" },
      { image: "page-03.svg", sound: "woman-happy", text: "\"Hello!\" said a kind lady at the door. \"I am your teacher.\"", alt: "The teacher welcoming Amal at the school door with her arm held out" },
      { image: "page-04.svg", sound: "child-happy", text: "\"My name is Amal,\" she said. \"I am six years old.\"", alt: "Amal standing tall in the classroom telling her teacher her name" },
      { image: "page-05.svg", sound: "child-surprised", text: "Inside, Amal saw many things. There were tables and chairs.", alt: "Amal pointing at the tables and chairs in her new classroom" },
      { image: "page-06.svg", text: "There were books and crayons. There was a big clock on the wall.", alt: "A book and a crayon on the table below the classroom clock and alphabet chart" },
      { image: "page-07.svg", sound: "child-surprised", text: "\"Look!\" said Amal. \"A red book! And a blue pencil!\"", alt: "Amal pointing at a red book and a blue pencil lying on the table" },
      { image: "page-08.svg", sound: "child-happy", text: "A boy smiled at her. \"Hello, my name is Adam. Do you want to be my friend?\"", alt: "Adam smiling and pointing as he introduces himself to Amal" },
      { image: "page-09.svg", text: "\"Let us sing!\" said the teacher. All the children sang. \"A, B, C, D...\"", alt: "The class singing the alphabet song with their hands in the air beside the alphabet chart" },
      { image: "page-10.svg", sound: "child-happy", text: "\"Find something green!\" said the teacher. Amal found a green crayon.", alt: "Amal pointing at a green crayon on the table while her teacher watches" },
      { image: "page-11.svg", text: "At the end of the day, Amal drew a picture of her school.", alt: "Amal beside her drawing of the school with its red roof and two children" },
      { image: "page-12.svg", sound: "child-happy", text: "\"I learned new words. I made a friend. And I can sing!\" said Amal.", alt: "Amal walking home with her mother, both smiling, the school small behind them" },
    ],
  },
  {
    id: "breakfast-at-grandmas-house",
    title: "Breakfast at Grandma's House",
    grades: [1],
    units: [2],
    level: "Level 1",
    description: "Amal's whole family goes to Grandma's for breakfast, and Amal counts every grape.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Breakfast at Grandma's House is an original Grade 1 picture book created for Ehel Academy in 2026, book two of the Amal series. It retells the Unit 2 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "woman-happy", text: "Breakfast at Grandma's House. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Grandma and Grandpa either side of the breakfast table with Amal beside them" },
      { image: "page-02.svg", sound: "child-surprised", text: "It was Saturday. Amal woke up early. \"We are going to Grandma's house!\"", alt: "Amal waking up beside her bed with both arms in the air" },
      { image: "page-03.svg", text: "Amal has a mother and a father. She has a little brother, Idris. He is a baby.", alt: "Amal's mother and father standing with Amal and baby Idris in his blue blanket" },
      { image: "page-04.svg", sound: "woman-happy", text: "\"Come, Amal,\" said her mum. \"Hold my hand.\" They walked together.", alt: "Amal and her mother walking towards Grandma's house" },
      { image: "page-05.svg", sound: "woman-happy", text: "Grandma opened the door. \"Hello, my dear ones!\" She gave everyone a big hug.", alt: "Grandma with her arms up in welcome as Amal arrives" },
      { image: "page-06.svg", sound: "man-happy", text: "Grandpa was in the kitchen. \"Who is hungry? It is time to eat!\"", alt: "Grandpa pointing at a bowl of cereal on the table" },
      { image: "page-07.svg", text: "On the table there was one mango, one banana, ten grapes and four strawberries.", alt: "The breakfast table with a mango, a banana, a bunch of grapes and strawberries" },
      { image: "page-08.svg", sound: "child-happy", text: "\"Let us count the grapes,\" said Grandpa. \"One, two, three... ten!\" said Amal.", alt: "Amal counting the bunch of grapes on the table while Grandpa points" },
      { image: "page-09.svg", text: "\"Can I help?\" asked Amal. She laid the table. One, two, three, four, five bowls.", alt: "Amal carrying a bowl to a table already laid with four more" },
      { image: "page-10.svg", sound: "child-happy", text: "Baby Idris ate his cereal with milk. Some of it went on his nose!", alt: "Baby Idris with cereal on his nose beside the breakfast bowl and cup of milk" },
      { image: "page-11.svg", sound: "child-happy", text: "Everyone began to laugh. \"Idris is a funny baby,\" said Amal.", alt: "The whole family laughing together around baby Idris" },
      { image: "page-12.svg", text: "After breakfast, the grown-ups talked and Amal helped to tidy the bowls.", alt: "Grandma and Mum talking while Amal carries a bowl to the table" },
    ],
  },
  {
    id: "amal-and-the-big-ball",
    title: "Amal and the Big Ball",
    grades: [1],
    units: [3],
    level: "Level 1",
    description: "Amal has a big red ball, and the best game is the one everybody gets to play.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal and the Big Ball is an original Grade 1 picture book created for Ehel Academy in 2026, book three of the Amal series. It retells the Unit 3 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "ball", text: "Amal and the Big Ball. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal, Samira and little Leo with a big red ball under the acacia tree" },
      { image: "page-02.svg", sound: "child-happy", text: "It was a sunny day. Amal ran outside to play. She had a big red ball.", alt: "Amal outside with her big red ball and both arms in the air" },
      { image: "page-03.svg", sound: "ball", text: "\"Look at my ball!\" said Amal. She could bounce it. Bounce, bounce, bounce!", alt: "The red ball bouncing along a dotted arc beside Amal" },
      { image: "page-04.svg", sound: "child-happy", text: "Her friend Samira came to play. \"Can you catch the ball?\" asked Amal.", alt: "Amal pointing at the ball as Samira arrives to play" },
      { image: "page-05.svg", sound: "ball", text: "Amal did throw the ball. Samira did catch it. \"Well done!\" said Amal.", alt: "The ball flying between Amal and Samira, both with their arms up" },
      { image: "page-06.svg", sound: "child-sad", text: "Then little Leo came. \"Can I play too?\" he asked. Leo looked sad.", alt: "Leo standing sadly to one side while Amal and Samira hold the ball" },
      { image: "page-07.svg", sound: "child-happy", text: "\"Yes!\" said Amal. \"Let us all play. We can take turns.\"", alt: "Amal, Samira and Leo all smiling with their arms up" },
      { image: "page-08.svg", sound: "ball", text: "Amal did roll the ball to Leo. Roll, roll, roll! Leo was happy.", alt: "The red ball rolling across the ground to Leo in a puff of dust" },
      { image: "page-09.svg", sound: "child-surprised", text: "Leo did throw the ball. Up, up, up! It went into the big tree.", alt: "The ball high in the branches of the acacia tree with Amal and Leo looking up" },
      { image: "page-10.svg", text: "\"Let us jump!\" said Samira. They all did jump. But the ball was too high.", alt: "All three children jumping with their arms up under the tree" },
      { image: "page-11.svg", sound: "child-happy", text: "Big brother Adam came. He did shake the branch. Shake, shake, shake!", alt: "Adam reaching up to shake the branch as the ball falls" },
      { image: "page-12.svg", sound: "child-happy", text: "They played all day. \"Sharing is the best game of all,\" said Amal.", alt: "Amal, Samira and Leo playing together with the ball as confetti falls" },
    ],
  },
  {
    id: "amal-makes-a-mat",
    title: "Amal Makes a Mat",
    grades: [1],
    units: [4],
    level: "Level 1",
    description: "Amal's first mat is bumpy and full of holes, so she takes a deep breath and starts again.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal Makes a Mat is an original Grade 1 picture book created for Ehel Academy in 2026, book four of the Amal series. It retells the Unit 4 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "woman-happy", text: "Amal Makes a Mat. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal with Ayeeyo her grandmother and little Hodan under the big tree, beside a finished mat" },
      { image: "page-02.svg", text: "It was a warm afternoon. Ayeeyo was making a mat from soft grass.", alt: "Ayeeyo sitting under the big tree beside a neat woven grass mat" },
      { image: "page-03.svg", sound: "child-happy", text: "Her hands moved fast. Over, under, over, under. \"I want to make a mat too!\"", alt: "Amal with her arms up asking Ayeeyo if she can make a mat" },
      { image: "page-04.svg", text: "\"Good,\" said Ayeeyo. \"Here is some grass.\" Amal started to weave.", alt: "Amal beginning to weave her own mat on the ground" },
      { image: "page-05.svg", sound: "child-sad", text: "But her mat was not neat. It was bumpy and full of holes. \"Oh no!\"", alt: "A sad Amal standing beside her bumpy, uneven mat" },
      { image: "page-06.svg", text: "Her big brother Adam walked by with paper and crayons.", alt: "Adam walking past holding a sheet of paper while Amal looks unhappy" },
      { image: "page-07.svg", sound: "child-happy", text: "\"Look,\" said Adam. \"I cut a red circle and a blue square.\"", alt: "Adam pointing at his picture of a red circle and a blue square" },
      { image: "page-08.svg", sound: "child-surprised", text: "\"There is a green triangle and a yellow rectangle too. It is beautiful!\"", alt: "Amal pointing at the green triangle and yellow rectangle on Adam's picture" },
      { image: "page-09.svg", sound: "child-happy", text: "\"My first picture was not good either,\" said Adam. \"I tried again and again.\"", alt: "Adam smiling beside Amal, with a pair of scissors on the ground" },
      { image: "page-10.svg", text: "Amal took a deep breath. Over, under, over, under. Slow and careful.", alt: "Amal weaving her mat again, slowly and carefully" },
      { image: "page-11.svg", sound: "child-happy", text: "The holes were gone. It was flat and neat. \"You were patient,\" said Ayeeyo.", alt: "Amal with her arms up beside her finished neat mat while Ayeeyo smiles" },
      { image: "page-12.svg", sound: "child-happy", text: "\"I want to make a mat too!\" said Hodan. \"Come,\" said Amal. \"I will help you.\"", alt: "Ayeeyo, Amal, Hodan and Adam together under the tree with the finished mat" },
    ],
  },
  {
    id: "amal-and-the-little-hen",
    title: "Amal and the Little Hen",
    grades: [1],
    units: [5],
    level: "Level 1",
    description: "Amal feeds the hungry hen on Ayeeyo's farm, and the hen gives her something back.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal and the Little Hen is an original Grade 1 picture book created for Ehel Academy in 2026, book five of the Amal series. It retells the Unit 5 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "hen", text: "Amal and the Little Hen. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Ayeeyo on the farm with the cow, the hen and a chick beside the barn" },
      { image: "page-02.svg", sound: "woman-happy", text: "Amal loved the farm. \"Come,\" said Ayeeyo. \"There is much work to do today.\"", alt: "Ayeeyo pointing towards the barn while Amal listens" },
      { image: "page-03.svg", sound: "child-happy", text: "First they went to see the cow. \"Good morning, cow!\" The big cow said, \"Moo!\"", alt: "Amal greeting the big brown-and-white cow with her arms in the air" },
      { image: "page-04.svg", sound: "goat-happy", text: "The sheep said, \"Baa!\" The goat wanted to eat Amal's hat. Amal laughed.", alt: "A woolly sheep and a goat beside Amal near the barn" },
      { image: "page-05.svg", text: "\"Now we must feed the hens,\" said Ayeeyo. She gave Amal a bowl of seed.", alt: "Ayeeyo handing Amal a small bowl of seed" },
      { image: "page-06.svg", sound: "hen-sad", text: "The little hen looked hungry. \"I will feed her,\" said Amal.", alt: "A hungry hen beside the haystack while Amal looks on" },
      { image: "page-07.svg", sound: "hen-happy", text: "She threw the seed on the ground. \"Cluck, cluck!\" said the happy hen.", alt: "The happy hen and a chick pecking at seed on the ground" },
      { image: "page-08.svg", sound: "child-surprised", text: "Then Amal saw something warm in the straw. It was a little white egg!", alt: "A single white egg in the straw with Amal's arms in the air" },
      { image: "page-09.svg", sound: "woman-happy", text: "\"Well done, Amal. When you are kind to the animals, they are kind to you.\"", alt: "Ayeeyo smiling at Amal, who holds the egg carefully" },
      { image: "page-10.svg", text: "In the field, Amal planted a tiny seed. \"With water and sun, it will grow.\"", alt: "Amal and Ayeeyo beside a row of planted seed and a small bean plant" },
      { image: "page-11.svg", sound: "child-happy", text: "Adam drove past on the tractor. \"Hard work, little sister!\" he called.", alt: "Adam waving from the green tractor as Amal waves back" },
      { image: "page-12.svg", sound: "lullaby", text: "That night Amal ate warm bread and drank fresh milk. \"I love the farm.\"", alt: "Amal and Ayeeyo at the table at night with bread and a cup of milk, stars at the window" },
    ],
  },
  {
    id: "amal-at-the-market",
    title: "Amal at the Market",
    grades: [1],
    units: [6],
    level: "Level 1",
    description: "Ayeeyo takes Amal to the market and asks her to use all five of her senses.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal at the Market is an original Grade 1 picture book created for Ehel Academy in 2026, book six of the Amal series. It retells the Unit 6 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Amal at the Market. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Ayeeyo at the busy market beside the shops and a fruit stall" },
      { image: "page-02.svg", sound: "woman-happy", text: "The market was big and busy. \"Come, Amal. Use your five senses today!\"", alt: "Ayeeyo pointing across the market while Amal listens" },
      { image: "page-03.svg", text: "First, Amal used her eyes to see. Red tomatoes. Yellow bananas. Green mangoes.", alt: "Three baskets of tomatoes, bananas and mangoes below a card showing an eye" },
      { image: "page-04.svg", sound: "goat-happy", text: "Next she used her ears to hear. \"Fresh fish!\" called a man. A goat said, \"Baa!\"", alt: "A goat beside Amal in the market below a card showing an ear" },
      { image: "page-05.svg", text: "Then she used her nose to smell. She smelled warm bread.", alt: "A fresh loaf of bread steaming beside Amal, below a card showing a nose" },
      { image: "page-06.svg", text: "She smelled sweet flowers. She smelled hot spices from a big pot.", alt: "A bright flower and two spice pots steaming beside Amal" },
      { image: "page-07.svg", sound: "man-happy", text: "A kind man named Omar gave Amal a piece of ripe mango.", alt: "Omar the shopkeeper pointing at a basket of mangoes beside his stall" },
      { image: "page-08.svg", sound: "child-happy", text: "She used her tongue to taste it. \"It is sweet and juicy!\" said Amal.", alt: "Amal holding a piece of mango below a card showing a tongue" },
      { image: "page-09.svg", text: "Last, she used her hands to touch. She touched a soft cloth.", alt: "A folded purple cloth beside Amal, below a card showing a hand" },
      { image: "page-10.svg", text: "She touched a smooth stone. It felt hard and cold.", alt: "A smooth grey stone on the ground beside Amal" },
      { image: "page-11.svg", sound: "child-surprised", text: "\"Look, Ayeeyo! This melon is big. But that melon is bigger!\"", alt: "Amal pointing at two baskets, one bigger than the other" },
      { image: "page-12.svg", sound: "child-happy", text: "\"I am thankful for my eyes, my ears, my nose, my tongue and my hands!\"", alt: "Amal and Ayeeyo walking home below five cards showing all five senses" },
    ],
  },
  {
    id: "amals-big-bus-ride",
    title: "Amal's Big Bus Ride",
    grades: [1],
    units: [7],
    level: "Level 1",
    description: "Amal and Mum walk, then ride the big bus all the way to Grandmother by the sea.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal's Big Bus Ride is an original Grade 1 picture book created for Ehel Academy in 2026, book seven of the Amal series. It retells the Unit 7 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "child-happy", text: "Amal's Big Bus Ride. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her mother beside the yellow and red bus" },
      { image: "page-02.svg", sound: "woman-happy", text: "\"How will we get there?\" asked Amal. \"First we walk. Then we go by bus.\"", alt: "Amal asking her mother how they will travel" },
      { image: "page-03.svg", text: "Amal and Mum walked down the road. They walked past the market.", alt: "Amal and her mother walking past a market stall" },
      { image: "page-04.svg", text: "They walked to the bus stop and waited.", alt: "Amal and her mother standing at the bus stop sign" },
      { image: "page-05.svg", sound: "child-surprised", text: "Soon a big bus came. It was yellow and red. \"Beep, beep!\" went the bus.", alt: "The big yellow and red bus arriving at the bus stop" },
      { image: "page-06.svg", sound: "woman-happy", text: "\"Find a seat. Then sit down,\" said Mum. Amal found a seat by the window.", alt: "Mum pointing to a seat as Amal climbs onto the bus" },
      { image: "page-07.svg", text: "The wheels on the bus went round and round.", alt: "The bus driving along the road with motion lines behind it" },
      { image: "page-08.svg", sound: "child-happy", text: "\"Look, Mum! A boy on a bicycle!\" The boy waved. His name was Adam.", alt: "Adam waving from his green bicycle as the bus passes" },
      { image: "page-09.svg", text: "\"And look - a red car!\" The car went fast. The bus went slow and bumpy.", alt: "A red car speeding past the slow yellow bus" },
      { image: "page-10.svg", sound: "child-happy", text: "Amal saw a girl named Samira, going to school. Samira waved too.", alt: "Samira waving outside the school as the bus goes by" },
      { image: "page-11.svg", text: "The bus drove past the shops. It drove past the library. It drove to the sea.", alt: "The bus passing the shop row and the library" },
      { image: "page-12.svg", sound: "woman-happy", text: "\"Amal!\" called Grandmother, by the little blue boat. \"You came to see me!\"", alt: "Grandmother waving beside a sailing boat at the sea as Amal and Mum arrive" },
    ],
  },
  {
    id: "the-well-in-the-village",
    title: "The Well in the Village",
    grades: [1],
    units: [8],
    level: "Level 1",
    description: "The rain does not come, so the whole village shares the water in the deep well.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Well in the Village is an original Grade 1 picture book created for Ehel Academy in 2026, book eight of the Amal series. It retells the Unit 8 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "river", text: "The Well in the Village. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her brother Adam beside the deep village well" },
      { image: "page-02.svg", text: "Every morning, Amal walked to the well with Adam. They carried an empty pot.", alt: "Amal carrying an empty pot beside Adam on the way to the well" },
      { image: "page-03.svg", sound: "child-sad", text: "\"Fill it slowly,\" said Adam. \"Water is precious. We must not waste one drop.\"", alt: "Adam pointing at the empty pot on the ground beside the well" },
      { image: "page-04.svg", sound: "child-happy", text: "Amal helped pull the rope. Up came the pot, full and heavy. \"We did it!\"", alt: "The full pot rising on the well rope while Amal and Adam cheer" },
      { image: "page-05.svg", text: "At home, Mama used the water. \"We use water to cook,\" she said.", alt: "Mama beside a bowl of warm soup on the table" },
      { image: "page-06.svg", text: "\"And we use water to wash,\" said Amal. She washed her hands until they were clean.", alt: "Amal beside the water pot, washing her hands" },
      { image: "page-07.svg", sound: "child-happy", text: "\"And we use water to drink,\" said little Hodan. She drank a big cup and smiled.", alt: "Hodan drinking from a big cup while Amal watches" },
      { image: "page-08.svg", sound: "child-sad", text: "One day, the land was very dry. No rain came. The grass was brown.", alt: "Amal standing sadly on dry brown ground with wilted grass" },
      { image: "page-09.svg", sound: "child-sad", text: "\"The well is getting low,\" said Adam. \"We must share and be careful.\"", alt: "Adam and Amal looking at the low well on the dry ground" },
      { image: "page-10.svg", sound: "rain", text: "Then the sky went grey. Big clouds came. Drip... drip... drip. \"Rain!\"", alt: "Grey clouds and falling rain over the village with Amal cheering" },
      { image: "page-11.svg", sound: "puddle", text: "The children ran outside and danced in the rain. The rain filled the well.", alt: "Amal, Hodan and Adam dancing in the rain among the puddles" },
      { image: "page-12.svg", sound: "crickets", text: "\"How lucky we are to have water,\" said Amal. \"Water is wonderful.\"", alt: "Amal beside the full well at night under the stars" },
    ],
  },
  {
    id: "a-walk-around-town",
    title: "A Walk Around Town",
    grades: [1],
    units: [9],
    level: "Level 1",
    description: "Amal and Mum walk around their town and meet all the people who help.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "A Walk Around Town is an original Grade 1 picture book created for Ehel Academy in 2026, book nine of the Amal series. It retells the Unit 9 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "child-happy", text: "A Walk Around Town. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her mother walking through town past the shops and the library" },
      { image: "page-02.svg", text: "First they came to the big road. The traffic lights were red. \"Red means stop.\"", alt: "Amal and her mother waiting at the crossing while the traffic light shows red" },
      { image: "page-03.svg", sound: "child-happy", text: "Then the light was green. \"Green means go!\" said Amal, and they walked across.", alt: "The traffic light showing green as Amal and her mother cross the road" },
      { image: "page-04.svg", sound: "child-happy", text: "\"Look, Mum! There is my school.\" Adam waved from the gate. \"Hello, Amal!\"", alt: "Adam waving outside the school as Amal waves back" },
      { image: "page-05.svg", sound: "market", text: "Next to the school was the market. It was very busy.", alt: "The busy market stall and a basket of fruit beside Amal and her mother" },
      { image: "page-06.svg", sound: "man-happy", text: "\"Good morning,\" said Omar the shopkeeper. \"Would you like a mango?\"", alt: "Omar pointing at a basket of mangoes beside his stall" },
      { image: "page-07.svg", sound: "child-happy", text: "\"Yes, please. Thank you!\" said Amal. \"You are a polite girl,\" said Omar.", alt: "Amal holding a mango and thanking Omar" },
      { image: "page-08.svg", text: "They walked past the hospital. \"Faduma the doctor works here,\" said Mum.", alt: "Faduma the doctor standing outside the hospital as Amal and her mother pass" },
      { image: "page-09.svg", sound: "child-sad", text: "Near the park, Leo dropped his paper. \"Please put it in the bin,\" said Amal.", alt: "Litter on the ground in the park with Leo looking sorry and Amal pointing" },
      { image: "page-10.svg", sound: "child-happy", text: "\"Sorry,\" said Leo, and he put the paper in the bin. Now the park was clean.", alt: "Leo smiling beside the bin in the clean park" },
      { image: "page-11.svg", sound: "woman-happy", text: "Last of all came the library. It was quiet. Ayeeyo was there. \"Come, my dear.\"", alt: "Ayeeyo waving outside the library as Amal and her mother arrive" },
      { image: "page-12.svg", sound: "child-happy", text: "\"Red means stop, green means go - and we keep our town clean. I love my town!\"", alt: "Amal and her mother walking home past the shops with her arms in the air" },
    ],
  },
  {
    id: "amals-english-year",
    title: "Amal's English Year",
    grades: [1],
    units: [10],
    level: "Level 1",
    description: "In the last week of Grade 1, Amal opens her folder and makes a book of her whole year.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal's English Year is an original Grade 1 picture book created for Ehel Academy in 2026, book ten of the Amal series. It retells the Unit 10 reading of the same name from the Ehel Year 1 English course. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "child-happy", text: "Amal's English Year. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal in her classroom beside her own book, My First English World" },
      { image: "page-02.svg", sound: "woman-happy", text: "It was the last week of Grade 1. Amal wanted to remember everything.", alt: "Amal and her teacher in the classroom on the last week of the year" },
      { image: "page-03.svg", sound: "child-happy", text: "She opened her big learning folder and looked inside.", alt: "Amal pointing at her open folder full of pages of work" },
      { image: "page-04.svg", text: "There were letters from the very first week. A, B, C.", alt: "Amal beside a big alphabet chart showing the letters A to I" },
      { image: "page-05.svg", text: "There were family pictures she had drawn.", alt: "Amal with her mother and baby Idris beside a framed picture of shapes" },
      { image: "page-06.svg", sound: "ball", text: "There were colourful games, and shapes, and numbers.", alt: "A red ball on the floor beside a framed picture of coloured shapes" },
      { image: "page-07.svg", sound: "hen", text: "There were farm animals - the cow and the little hen.", alt: "Amal on the farm with the cow and the hen beside the barn" },
      { image: "page-08.svg", text: "There were pictures about her five senses.", alt: "Four cards showing an eye, an ear, a nose and a tongue beside Amal" },
      { image: "page-09.svg", text: "There were vehicles, water, and town places like the library.", alt: "Three cards showing a bus, a water pot and the library beside Amal" },
      { image: "page-10.svg", sound: "child-happy", text: "She made a new book. She called it My First English World.", alt: "Amal beside her finished book standing on the table" },
      { image: "page-11.svg", text: "On celebration day, Amal stood at the front and read a few words out loud.", alt: "Amal holding her book at the front of the class while Adam, Samira and Leo listen" },
      { image: "page-12.svg", sound: "child-happy", text: "\"My name is Amal. I can speak English. I like my book.\" Everyone clapped.", alt: "The whole class clapping for Amal with confetti falling and the teacher smiling" },
    ],
  },

  // ---------------------------------------------------------------- Grade 2
  // The Zuri series: one book per unit, on the Grade 1 pattern — a story that
  // reuses the unit's own vocabulary, so the shelf is revision a learner wants
  // to open rather than a second exercise. Same storyworld a year on, so Musa,
  // Kiki, Duku, Lulu and Miss Twiga all return; the new lead is Zuri, a young
  // meerkat who notices things and writes them down.
  // Illustrations: tools/create-grade2-ebook-illustrations.js.
  {
    id: "zuris-first-week",
    title: "Zuri's First Week",
    grades: [2],
    units: [1],
    level: "Level 2",
    description: "A new pupil learns names, colours, numbers and every day of the week - and finds a friend.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Zuri's First Week is an original Grade 2 story created for Ehel Academy in 2026, book one of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Zuri's First Week. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri the young meerkat with Kiki, Miss Twiga the giraffe and the class beside a big calendar at the tree school" },
      { image: "page-02.svg", sound: "chick", text: "\"Hello! My name is Zuri,\" said the new pupil. \"Z-U-R-I. Zuri.\"", alt: "Zuri the meerkat standing tall in front of the class and spelling out her name" },
      { image: "page-03.svg", sound: "giraffe", text: "Miss Twiga smiled. \"Hello, Zuri. This is Kiki. She will be your partner this week.\"", alt: "Miss Twiga the giraffe bending down to introduce Kiki the young monkey to Zuri" },
      { image: "page-04.svg", sound: "bell", text: "On Monday the class made a big calendar. It showed every day of the week.", alt: "Zuri and Kiki beside a large classroom calendar with a week of coloured days along the top" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Kiki wrote the first day, Monday. Zuri wrote the second day, Tuesday.", alt: "Kiki and Zuri writing the first and second days onto the class calendar" },
      { image: "page-06.svg", sound: "sun", text: "On Wednesday they made a colour chart. Red, blue, green, yellow and pink.", alt: "A string of ten paint colours pegged above Zuri and Kiki in the classroom" },
      { image: "page-07.svg", sound: "elephant-happy", text: "On Thursday they counted the books on the shelf. One, two, three - twelve books!", alt: "Zuri counting twelve coloured books on a shelf while the little elephant watches" },
      { image: "page-08.svg", sound: "giraffe", text: "On Friday Miss Twiga asked, \"What do you like, Zuri?\" \"I like words,\" said Zuri.", alt: "Miss Twiga leaning down to ask Zuri a question with an open book between them" },
      { image: "page-09.svg", sound: "chick", text: "Zuri found English words everywhere. On the chart. In her book. On the tablet.", alt: "Zuri looking from the chalkboard to an open book and a tablet, all showing words" },
      { image: "page-10.svg", sound: "kiki-happy", text: "Then Kiki pointed at the calendar. \"Look! The twelfth of the month is my birthday.\"", alt: "Kiki pointing excitedly at the twelfth date ringed in red on the calendar" },
      { image: "page-11.svg", sound: "bell", text: "The whole class made Kiki a card. Zuri wrote every letter by herself.", alt: "The class around a big birthday card with a red heart on it while Zuri writes" },
      { image: "page-12.svg", sound: "chick", text: "\"Goodbye, Zuri! See you next week,\" said Kiki. Zuri smiled. She had a friend now.", alt: "Zuri and Kiki waving goodbye to each other in the sunny school yard" },
    ],
  },
  {
    id: "the-word-hunt",
    title: "The Word Hunt",
    grades: [2],
    units: [1],
    level: "Level 2",
    description: "Miss Twiga sets the class a hunt - ten English words, anywhere at all. Zuri finds twelve.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Word Hunt is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 1. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Word Hunt. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri the meerkat and Kiki the monkey at the tree school beside a chalkboard, a colour chart, an open book and a tablet" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Here is your hunt,\" said Miss Twiga. \"Find ten English words. They can be anywhere.\"", alt: "Miss Twiga the giraffe bending down to set the class their word hunt" },
      { image: "page-03.svg", sound: "chick", text: "The first word was on the chalkboard. Zuri read it out loud. B-O-O-K. Book!", alt: "Zuri pointing at a word chalked on the big classroom board" },
      { image: "page-04.svg", sound: "kiki-happy", text: "The second word was on a book. The third word was right beside it, on the same page.", alt: "Zuri beside a large open book on the bench, reading the words on the page" },
      { image: "page-05.svg", sound: "bell", text: "The fourth word was on the tablet. Zuri touched it, and the tablet said it back to her.", alt: "Zuri pointing at a word glowing on a tablet screen" },
      { image: "page-06.svg", sound: "sun", text: "The fifth, sixth and seventh words were on the colour chart. Red. Blue. Green.", alt: "Zuri and Kiki beside a string of ten paint colours pegged up in the classroom" },
      { image: "page-07.svg", sound: "kiki-happy", text: "\"Yellow and pink!\" said Kiki. That made nine. One more word to find.", alt: "Five coloured circles in a row - red, blue, green, yellow and pink - with Zuri below them" },
      { image: "page-08.svg", sound: "elephant-happy", text: "So Zuri counted the books on the shelf. One, two, three - twelve books, and twelve words.", alt: "Zuri counting twelve coloured books on a shelf while the little elephant watches" },
      { image: "page-09.svg", sound: "market", text: "Outside there were words too. A word on the side of the bus. Zuri did not know that one.", alt: "Zuri and Kiki looking up at a word painted on the side of the town bus" },
      { image: "page-10.svg", sound: "market", text: "A word on the market sign. \"Fruit,\" read Zuri. \"I know that word. I like fruit.\"", alt: "Zuri reading the sign above a market stall while the shopkeeper hen watches" },
      { image: "page-11.svg", sound: "lullaby", text: "That night, at her burrow, Zuri wrote every word into her book. Twelve of them.", alt: "Zuri writing in her book beside her burrow under the stars" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Twelve words,\" said Zuri. \"Tomorrow I will find twelve more.\" \"Then I am coming too,\" said Kiki.", alt: "Zuri holding up her book in the sunshine with Kiki cheering beside her" },
    ],
  },
  {
    id: "this-is-my-partner",
    title: "This Is My Partner",
    grades: [2],
    units: [1],
    level: "Level 2",
    description: "Zuri and Kiki ask each other questions, then stand up and introduce each other to the whole class.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "This Is My Partner is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 1. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "This Is My Partner. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki standing together in front of the class calendar with Miss Twiga behind them" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Today,\" said Miss Twiga, \"you will not talk about yourself. You will talk about your partner.\"", alt: "Miss Twiga the giraffe bending down to explain the task to Zuri and Kiki" },
      { image: "page-03.svg", sound: "chick", text: "So Zuri asked first. \"What is your name? How do you spell it?\" \"K-I-K-I. Kiki.\"", alt: "Zuri asking Kiki a question while Kiki raises her arms to answer" },
      { image: "page-04.svg", sound: "kiki-happy", text: "\"And what do you like?\" \"I like mangoes,\" said Kiki. \"And I like Fridays.\"", alt: "Kiki answering beside a large ripe mango while Zuri holds her book" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Then Kiki asked. \"What do you like, Zuri?\" \"I like words,\" said Zuri. \"All of them.\"", alt: "Kiki pointing a question at Zuri, who raises her arms to answer" },
      { image: "page-06.svg", sound: "chick", text: "Zuri wrote every answer down. A name, a spelling, and two things her partner likes.", alt: "Zuri writing in a big open book on the bench while Kiki waits" },
      { image: "page-07.svg", sound: "bell", text: "Then the whole class sang the days. Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.", alt: "The class singing under bunting beside the big classroom calendar" },
      { image: "page-08.svg", sound: "sun", text: "And the months, from January all the way to December. Kiki's birthday is in May.", alt: "Zuri pointing at the fifth month ringed in red on the class calendar" },
      { image: "page-09.svg", sound: "zuri-happy", text: "Zuri stood up first. \"This is Kiki. K-I-K-I. She likes mangoes and she likes Fridays.\"", alt: "Zuri standing tall with her arms up, introducing Kiki to the class" },
      { image: "page-10.svg", sound: "kiki-happy", text: "Then Kiki stood up. \"This is Zuri. Z-U-R-I. She likes words. All of them.\"", alt: "Kiki introducing Zuri to the class while Zuri holds her book" },
      { image: "page-11.svg", sound: "bell", text: "The whole class clapped. Nobody had forgotten a single name.", alt: "The class clapping under bunting with confetti falling around Zuri and Kiki" },
      { image: "page-12.svg", sound: "zuri-happy", text: "First Zuri, second Kiki, third the little elephant. Everybody had a partner now.", alt: "Zuri and Kiki cheering in the sunny school yard with Miss Twiga, a goat and a hen nearby" },
    ],
  },
  {
    id: "who-helps-our-street",
    title: "Who Helps Our Street?",
    grades: [2],
    units: [2],
    level: "Level 2",
    description: "Zuri watches her neighbours go to work and finds out what every helper does.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Who Helps Our Street? is an original Grade 2 story created for Ehel Academy in 2026, book two of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Who Helps Our Street? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri on a busy town street with shops, a bus, a crossing and a street lamp" },
      { image: "page-02.svg", sound: "chick", text: "Zuri lived on a busy street. Every morning she watched the neighbours go to work.", alt: "Zuri outside her burrow watching neighbours walk along the shop-lined street" },
      { image: "page-03.svg", sound: "bell", text: "First came the bus driver. Her bus was long and yellow. \"Good morning!\" she called.", alt: "A long yellow town bus at the stop with its driver greeting Zuri" },
      { image: "page-04.svg", sound: "monkey", text: "Next came the window cleaner. He was up a tall ladder, helping the shop.", alt: "The window cleaner up a ladder against a shop front with his bucket and squeegee below" },
      { image: "page-05.svg", sound: "ostrich", text: "A police officer stood at the corner. She helped everybody cross the road safely.", alt: "A police officer beside a zebra crossing and a stop sign while Zuri and Kiki wait" },
      { image: "page-06.svg", sound: "elephant-surprised", text: "Then a siren! The firefighters raced past in their helmets, boots and gloves.", alt: "A red fire engine speeding down the street with its light flashing and dust behind it" },
      { image: "page-07.svg", sound: "tree", text: "They were rescuing a kite from the top of a tree. Everybody clapped.", alt: "A ladder up an acacia tree where a red kite is caught, with the friends cheering below" },
      { image: "page-08.svg", sound: "hen", text: "At the clinic the doctor listened carefully. The nurse said, \"You are well!\"", alt: "The clinic with its green cross, a doctor's bag, the doctor and the nurse beside Zuri" },
      { image: "page-09.svg", sound: "giraffe", text: "At school, Miss Twiga was teaching. \"A neighbour is someone who helps,\" she said.", alt: "Miss Twiga teaching at the chalkboard while Zuri and Kiki sit on the bench" },
      { image: "page-10.svg", sound: "market", text: "At the farm the farmer was growing beans. At the shop the shopkeeper was counting mangoes.", alt: "Duku the donkey beside a row of young bean plants and the hen shopkeeper at her market stall" },
      { image: "page-11.svg", sound: "monkey", text: "A reporter wrote it all down. \"Our street is full of helpers,\" she said.", alt: "A reporter with a notepad and pencil taking notes in front of the shops" },
      { image: "page-12.svg", sound: "lullaby", text: "That night Zuri drew every helper in her book. \"One day,\" she said, \"I will help too.\"", alt: "Zuri drawing in her book by her burrow at night while the shop windows and the street lamp glow" },
    ],
  },
  {
    id: "the-day-the-fire-bell-rang",
    title: "The Day the Fire Bell Rang",
    grades: [2],
    units: [2],
    level: "Level 2",
    description: "The bell rings in the middle of a lesson, and Zuri gets to see a firefighter's helmet, boots and gloves up close.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Day the Fire Bell Rang is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 2. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Day the Fire Bell Rang. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of a red fire engine on Warta Street with a firefighter's helmet, boots and gloves beside it and Zuri waving" },
      { image: "page-02.svg", sound: "bell", text: "The bell rang in the middle of the lesson. It was not the lesson bell. It was the fire bell.", alt: "Zuri and Kiki looking up in surprise at the big school bell as it swings" },
      { image: "page-03.svg", sound: "zuri-surprised", text: "The fire engine came down Warta Street. It was red, and it was very, very loud.", alt: "The red fire engine racing along the street while a startled Zuri watches" },
      { image: "page-04.svg", sound: "chick", text: "The firefighter had a helmet, boots and gloves. \"This is my equipment,\" she said.", alt: "A firefighter's helmet, boots and gloves laid out large on the street while Zuri points at them" },
      { image: "page-05.svg", sound: "monkey", text: "The ladder went up the wall of the shop. Up, up, up, all the way to the roof.", alt: "A long ladder leaning against the shop wall with the window cleaner monkey climbing it" },
      { image: "page-06.svg", sound: "river", text: "Then the hose sent water right up after it. Zuri had never seen water go so high.", alt: "An arc of water rising from the fire engine's hose towards the shop roof" },
      { image: "page-07.svg", sound: "zuri-happy", text: "The little fire was out. Nobody was hurt. The shopkeeper said thank you six times.", alt: "Everybody safe outside the shop with the fire engine parked and Zuri and Kiki cheering" },
      { image: "page-08.svg", sound: "chick", text: "\"Hold this,\" said the firefighter. Zuri held the helmet. It was heavier than her book.", alt: "Zuri reaching up to hold a firefighter's helmet while the firefighter watches" },
      { image: "page-09.svg", sound: "kiki-happy", text: "Zuri wrote it all down. Helmet. Boots. Gloves. Ladder. Hose. And one red fire engine.", alt: "Zuri writing on a notepad on the street with Kiki beside her" },
      { image: "page-10.svg", sound: "giraffe", text: "Back at school, Miss Twiga asked what each thing was for. Zuri knew every answer.", alt: "Miss Twiga bending down beside the chalkboard while Zuri and Kiki answer" },
      { image: "page-11.svg", sound: "chick", text: "Then Zuri painted the fire engine. She made it as red as she possibly could.", alt: "Zuri's painting of the red fire engine standing on an easel while Kiki cheers" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"When I am big,\" said Zuri, \"I will help too.\" \"Me too,\" said Kiki.", alt: "Zuri and Kiki with their arms up on the lit street at sunset" },
    ],
  },
  {
    id: "zuri-asks-the-questions",
    title: "Zuri Asks the Questions",
    grades: [2],
    units: [2],
    level: "Level 2",
    description: "Zuri is the reporter for a day - one notepad, one question, and every helper on Warta Street.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Zuri Asks the Questions is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 2. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Zuri Asks the Questions. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri holding her book beside a big notepad on Warta Street with the shops behind her" },
      { image: "page-02.svg", sound: "giraffe", text: "\"A reporter asks questions,\" said Miss Twiga, \"and writes the answers down. Off you go.\"", alt: "Miss Twiga explaining beside a notepad while Zuri listens with her book" },
      { image: "page-03.svg", sound: "chick", text: "\"What do you do?\" Zuri asked the bus driver. \"I am driving,\" he said. \"All day long.\"", alt: "Zuri asking the bus driver a question beside the town bus while a goat waits" },
      { image: "page-04.svg", sound: "monkey", text: "\"And what do you do?\" \"I am cleaning,\" said the window cleaner, from the top of his ladder.", alt: "The window cleaner monkey answering from his ladder while Zuri writes below" },
      { image: "page-05.svg", sound: "hen", text: "\"I am selling,\" said the shopkeeper. \"Fruit today. Bread tomorrow.\"", alt: "The shopkeeper hen beside her market stall answering Zuri's question" },
      { image: "page-06.svg", sound: "goat", text: "\"I am growing,\" said the farmer. \"Everything you eat starts here, in this field.\"", alt: "The farmer donkey in his field of young plants answering Zuri, with a fence behind him" },
      { image: "page-07.svg", sound: "giraffe", text: "\"I am helping,\" said the doctor. \"People come here when they feel poorly.\"", alt: "The doctor outside the clinic with a doctor's bag while Zuri writes" },
      { image: "page-08.svg", sound: "giraffe", text: "\"I am teaching,\" said Miss Twiga. \"That is a job too, you know.\"", alt: "Miss Twiga beside the chalkboard with Kiki and Zuri in front of her" },
      { image: "page-09.svg", sound: "bell", text: "\"I am rescuing,\" said the firefighter. \"Mostly I am checking that nothing needs rescuing.\"", alt: "The fire engine parked on the street with the firefighter's kit beside it and Zuri writing" },
      { image: "page-10.svg", sound: "chick", text: "Zuri read her notepad back. Driving. Cleaning. Selling. Growing. Helping. Teaching. Rescuing.", alt: "Zuri reading a large notepad full of answers on the street" },
      { image: "page-11.svg", sound: "kiki-happy", text: "Then she wrote the whole report on the class board, in her very best letters.", alt: "Zuri's report chalked on the big board with Kiki cheering beside it" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Seven jobs,\" said Zuri, \"and every one of them helps somebody on our street.\"", alt: "Zuri with her book held high on Warta Street with the monkey, a goat and a hen around her" },
    ],
  },
  {
    id: "move-like-me",
    title: "Move Like Me",
    grades: [2],
    units: [3],
    level: "Level 2",
    description: "It is Move Day at school, and the whole class waves, hops, jumps and claps.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Move Like Me is an original Grade 2 story created for Ehel Academy in 2026, book three of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "ball", text: "Move Like Me. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri, Kiki and their friends stretching and waving under bunting on Move Day" },
      { image: "page-02.svg", sound: "giraffe", text: "It was Move Day at school. \"Stand up, everybody!\" said Miss Twiga.", alt: "Miss Twiga calling the class to their feet under the school tree" },
      { image: "page-03.svg", sound: "chick", text: "\"Touch your head. Touch your arm. Touch your hand. Touch every finger.\"", alt: "Zuri pointing to her head while Kiki copies her" },
      { image: "page-04.svg", sound: "elephant-happy", text: "\"Now wave!\" Zuri waved. The little elephant waved with her trunk.", alt: "Zuri waving both arms while the little elephant lifts her trunk to wave" },
      { image: "page-05.svg", sound: "kiki-happy", text: "\"Now hop!\" Everybody hopped. Kiki hopped the highest of all.", alt: "Kiki hopping high above the ground with dust puffing below her" },
      { image: "page-06.svg", sound: "ball", text: "\"Now jump, clap and turn around!\" The whole class laughed.", alt: "Zuri, Kiki and the little elephant jumping and clapping together" },
      { image: "page-07.svg", sound: "ostrich", text: "\"Wiggle your toes. Nod your head. Flap like a bird. Reach up high!\"", alt: "The ostrich flapping her wings and two small birds flying while Zuri reaches up" },
      { image: "page-08.svg", sound: "zebra-happy", text: "Musa ran round the field one, two, three times. He was strong and fast.", alt: "Musa the zebra running across the field with dust and motion lines behind him" },
      { image: "page-09.svg", sound: "crunch", text: "\"My tummy is hungry,\" said Zuri. So they ate fruit and drank cool water.", alt: "A bowl of fruit and a water bottle on the bench with Zuri and Kiki beside it" },
      { image: "page-10.svg", sound: "sun", text: "\"Exercise every day,\" said Miss Twiga. \"It gives you energy.\"", alt: "Miss Twiga at the chalkboard in the sunshine while Zuri stretches" },
      { image: "page-11.svg", sound: "lullaby", text: "\"And sleep well at night,\" said Kiki, with a very big yawn.", alt: "Kiki yawning on the bench at sunset with sleepy Zs rising above her" },
      { image: "page-12.svg", sound: "crickets", text: "Zuri went home tired and happy. Moving every day keeps you healthy and strong.", alt: "Zuri walking home to her burrow under the stars with sleepy Zs above her" },
    ],
  },
  {
    id: "sports-day-at-the-tree-school",
    title: "Sports Day at the Tree School",
    grades: [2],
    units: [3],
    level: "Level 2",
    description: "It is Sports Day, and Zuri comes last in every race - and finishes every single one.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Sports Day at the Tree School is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 3. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Sports Day at the Tree School. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the tree school under bunting and a race banner with Musa, the ostrich, Zuri and Kiki ready to run" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Ready,\" said Miss Twiga. \"Steady...\"", alt: "Miss Twiga at the start line with Zuri, Kiki and the ostrich waiting to run" },
      { image: "page-03.svg", sound: "zebra-happy", text: "\"GO!\" Musa the zebra was away first. Musa is always away first.", alt: "Musa the zebra running across the savanna in a cloud of dust" },
      { image: "page-04.svg", sound: "ostrich", text: "But the ostrich ran faster. Two long legs, and hardly any noise at all.", alt: "The ostrich running ahead across the grass with dust rising behind" },
      { image: "page-05.svg", sound: "zuri-happy", text: "In the hop race, Zuri hopped. Hop, hop, hop. Her legs are short, so she hopped a lot.", alt: "Zuri hopping across the school yard with puffs of dust below her" },
      { image: "page-06.svg", sound: "kiki-happy", text: "In the jump, Kiki jumped the highest. She is a monkey. It is not really fair.", alt: "Kiki leaping high above the ground with dust below her and Zuri cheering" },
      { image: "page-07.svg", sound: "elephant-happy", text: "In the throw, the little elephant threw the ball so far that nobody ever found it.", alt: "The little elephant lifting her trunk as a ball flies high across the sky" },
      { image: "page-08.svg", sound: "zuri-happy", text: "Zuri came last in every race. She did not stop once.", alt: "Zuri running steadily past the race banner on her own with dust behind her" },
      { image: "page-09.svg", sound: "chick", text: "At the finish there was cool water and a bowl of fruit. Zuri had both of them.", alt: "A bowl of fruit and a water bottle on the bench with Zuri resting beside them" },
      { image: "page-10.svg", sound: "bell", text: "Then everybody clapped for everybody. That is the rule at the tree school.", alt: "The whole school cheering under bunting as confetti falls" },
      { image: "page-11.svg", sound: "zuri-happy", text: "There was a flag for every runner. Not only for the fast ones. Zuri kept hers.", alt: "Zuri holding up her flag beside an easel showing a red heart, with the ostrich behind her" },
      { image: "page-12.svg", sound: "giraffe", text: "\"Move every day,\" said Miss Twiga, \"and you will be strong. Fast is a different thing.\"", alt: "Miss Twiga, Zuri and Kiki resting at the bench as the sun goes down" },
    ],
  },
  {
    id: "miss-twiga-says",
    title: "Miss Twiga Says",
    grades: [2],
    units: [3],
    level: "Level 2",
    description: "Stand up, touch your head, turn around - a whole lesson made of instructions, and one pupil who is not listening.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Miss Twiga Says is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 3. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "giraffe", text: "Miss Twiga Says. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Miss Twiga in front of the class with Zuri, Kiki and the little elephant waiting for the next instruction" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Stand up, everybody!\" said Miss Twiga. And everybody stood up.", alt: "The whole class standing up with their arms raised beside the school bench" },
      { image: "page-03.svg", sound: "chick", text: "\"Touch your head.\" Zuri touched her head. It is a small head, so it was easy.", alt: "Zuri reaching up to touch her head while Kiki does the same" },
      { image: "page-04.svg", sound: "kiki-happy", text: "\"Clap your hands.\" Clap, clap, clap. Kiki clapped the loudest.", alt: "Zuri and Kiki clapping with motion arcs on both sides of them" },
      { image: "page-05.svg", sound: "zuri-happy", text: "\"Wiggle your fingers.\" Ten fingers, all wiggling at once.", alt: "Zuri wiggling her fingers above her head while the little elephant watches" },
      { image: "page-06.svg", sound: "giraffe", text: "\"Nod your head.\" Zuri nodded. Kiki nodded. Miss Twiga nodded a very long way down.", alt: "Miss Twiga bending her long neck down to nod at Zuri and Kiki" },
      { image: "page-07.svg", sound: "zuri-surprised", text: "\"Turn around!\" Everybody turned. Now the whole class was facing the wrong way.", alt: "Zuri and Kiki with their backs turned, standing in puffs of dust" },
      { image: "page-08.svg", sound: "sun", text: "\"Reach for the sky!\" Zuri reached. She did not reach the sky, but she reached.", alt: "Zuri stretching both arms up towards the sun with a bird flying past" },
      { image: "page-09.svg", sound: "kiki-surprised", text: "\"Sit down.\" Everybody sat down. Except Kiki. Kiki was still reaching.", alt: "Zuri lowering her arms beside the bench while Kiki stands with hers still up, looking surprised" },
      { image: "page-10.svg", sound: "zuri-happy", text: "\"Your turn, Zuri,\" said Miss Twiga. So Zuri went to the front. \"Stand on one leg!\"", alt: "Zuri at the front of the class pointing while Kiki, the elephant and the ostrich follow" },
      { image: "page-11.svg", sound: "bell", text: "Nobody could do it. Everybody laughed, and Miss Twiga laughed the loudest of all.", alt: "The whole class laughing together under the bunting" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"An instruction is easy,\" said Zuri. \"Somebody says it, and then you do it.\"", alt: "Zuri holding up her book in the sunshine with Kiki beside her" },
    ],
  },
  {
    id: "zuri-and-her-shadow",
    title: "Zuri and Her Shadow",
    grades: [2],
    units: [4],
    level: "Level 2",
    description: "A shadow that is long, then short, then gone - until Zuri works out what makes it.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Zuri and Her Shadow is an original Grade 2 story created for Ehel Academy in 2026, book four of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "sun", text: "Zuri and Her Shadow. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri in the early morning sun with a very long shadow stretching across the grass" },
      { image: "page-02.svg", sound: "chick", text: "Early in the morning the sun came up. Zuri saw a long, dark shape beside her.", alt: "The low morning sun and Zuri with a long dark shape on the ground next to her" },
      { image: "page-03.svg", sound: "chick", text: "\"Who are you?\" she asked. The shape said nothing at all. It was her shadow.", alt: "Zuri pointing down at her own shadow on the sunlit grass" },
      { image: "page-04.svg", sound: "sun", text: "The shadow copied everything. Zuri hopped. The shadow hopped too.", alt: "Zuri hopping with her arms up while her shadow makes the same shape beside her" },
      { image: "page-05.svg", sound: "sun", text: "At midday the sun was high. Zuri's shadow was very short. \"Where did you go?\"", alt: "The sun high overhead and Zuri with only a small shadow under her feet" },
      { image: "page-06.svg", sound: "giraffe", text: "Miss Twiga explained. \"The sun is the light. You block the light. That makes a shadow.\"", alt: "Miss Twiga at the chalkboard pointing from the sun to the shadow Zuri casts" },
      { image: "page-07.svg", sound: "wind", text: "In the evening the sun went low. The shadow grew long again, all the way to the house.", alt: "The low evening sun throwing Zuri's long shadow towards a small house" },
      { image: "page-08.svg", sound: "bird", text: "At sunset the sky turned orange and pink. Then the shadow slipped away.", alt: "An orange and pink sunset sky with birds flying and Zuri's shadow fading" },
      { image: "page-09.svg", sound: "crickets", text: "Night came. The sky was dark. Zuri looked up at the moon and the stars.", alt: "Zuri looking up at the bright moon and stars in the dark night sky" },
      { image: "page-10.svg", sound: "lullaby", text: "\"Where is my shadow now?\" she asked. \"Waiting,\" said Mama. \"It waits for the light.\"", alt: "Zuri and her mama outside their burrow under the stars" },
      { image: "page-11.svg", sound: "rain", text: "The next morning was cloudy and grey. No sun, no shadow. But Zuri waited.", alt: "A grey cloudy morning with no sun and Zuri waiting on the empty grass" },
      { image: "page-12.svg", sound: "sun", text: "At last the clouds moved. Sunrise! \"Good morning, shadow,\" said Zuri. \"You came back.\"", alt: "The sun rising past the clouds and Zuri's long shadow returning across the grass" },
    ],
  },
  {
    id: "what-is-the-weather-today",
    title: "What Is the Weather Today?",
    grades: [2],
    units: [4],
    level: "Level 2",
    description: "One week, one weather chart, and every kind of sky Zuri knows how to name.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "What Is the Weather Today? is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 4. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "sun", text: "What Is the Weather Today? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki under a sky that is bright on one side and grey on the other" },
      { image: "page-02.svg", sound: "sun", text: "Monday was sunny. The sun was hot and the grass was warm to stand on.", alt: "Zuri with her arms up under a high bright sun on the savanna" },
      { image: "page-03.svg", sound: "wind", text: "Tuesday was cloudy. The sun was still there. It was just behind something.", alt: "Zuri under a sky filled with three big grey clouds" },
      { image: "page-04.svg", sound: "rain", text: "On Wednesday it rained all morning. Zuri counted the drops and lost count at forty.", alt: "Rain falling across the savanna while Zuri and Kiki stand and watch" },
      { image: "page-05.svg", sound: "puddle", text: "Then it stopped, and there were puddles everywhere. That is the best part of rain.", alt: "Zuri and Kiki cheering beside a wide shining puddle in the sunshine" },
      { image: "page-06.svg", sound: "wind", text: "Thursday was windy. The kite went up on its own, and Zuri only had to hold on.", alt: "A red kite high in a windy sky above Zuri, who has both arms raised" },
      { image: "page-07.svg", sound: "sun", text: "Friday was hot. They sat in the shade of the acacia and drank cool water.", alt: "Zuri in the shade of a large acacia tree with a water bottle beside her" },
      { image: "page-08.svg", sound: "sun", text: "And after the rain came a rainbow. Red, orange, yellow, green and blue.", alt: "A wide rainbow over the savanna with Zuri and Kiki cheering below it" },
      { image: "page-09.svg", sound: "chick", text: "Every day went on the weather chart. Sunny. Cloudy. Rainy. Windy. Hot.", alt: "Zuri pointing at the weather chalked on the big class board" },
      { image: "page-10.svg", sound: "giraffe", text: "\"Weather is what the sky is doing today,\" said Miss Twiga. \"It changes. That is its job.\"", alt: "Miss Twiga bending down to explain to Zuri and Kiki with a cloud above them" },
      { image: "page-11.svg", sound: "crickets", text: "Saturday night was clear and cold. Zuri could see every single star.", alt: "Zuri with her arms up under a sky full of stars beside her burrow" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"And tomorrow?\" said Kiki. Zuri looked at the sky. \"Tomorrow,\" she said, \"we will see.\"", alt: "Zuri with her book at sunrise under a sky with two small clouds" },
    ],
  },
  {
    id: "where-does-the-sun-go",
    title: "Where Does the Sun Go?",
    grades: [2],
    units: [4],
    level: "Level 2",
    description: "Zuri watches the sun all day long, then asks the one question nobody had answered yet.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Where Does the Sun Go? is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 4. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "sun", text: "Where Does the Sun Go? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri standing on the savanna with her arms up as the sun rises low and orange behind her" },
      { image: "page-02.svg", sound: "zuri-happy", text: "Zuri wakes up when the light reaches her burrow. That moment is called sunrise.", alt: "Zuri stepping out of her burrow into the low orange light of sunrise" },
      { image: "page-03.svg", sound: "chick", text: "In the morning the sun is low. Everything has a long, long shadow.", alt: "Zuri pointing at her own very long shadow stretching across the grass" },
      { image: "page-04.svg", sound: "sun", text: "At midday the sun is right at the top of the sky. Now the shadow is tiny.", alt: "Zuri with her arms up under a high sun, with only a small shadow at her feet" },
      { image: "page-05.svg", sound: "chick", text: "In the evening the sun is low again - but this time on the other side.", alt: "Zuri standing with a long shadow stretching the other way as the sun sets" },
      { image: "page-06.svg", sound: "bird", text: "Then sunset. The sky turns orange and pink, and the birds all go home.", alt: "Two birds flying home across an orange and pink sunset sky above Zuri" },
      { image: "page-07.svg", sound: "giraffe", text: "\"Where does the sun go?\" Zuri asked. \"Nowhere,\" said Miss Twiga. \"That is the surprise.\"", alt: "Miss Twiga bending down to answer Zuri at sunset beside the school bench" },
      { image: "page-08.svg", sound: "giraffe", text: "\"The sun stays still. We turn. The Earth is turning under your feet right now.\"", alt: "Miss Twiga holding up a ball as the Earth beside the chalkboard while Zuri listens" },
      { image: "page-09.svg", sound: "lullaby", text: "At night the moon takes the sun's place, and the stars come out behind it.", alt: "Zuri with her arms up under a night sky with a bright moon and many stars" },
      { image: "page-10.svg", sound: "chick", text: "\"So somewhere far away,\" said Zuri, \"somebody is watching the sun come up right now.\"", alt: "Zuri at night beside her burrow, imagining a rising sun inside a thought bubble" },
      { image: "page-11.svg", sound: "lullaby", text: "Zuri went to sleep. The Earth kept turning. It does not need anybody to watch it.", alt: "Zuri asleep beside her burrow with sleepy Zs rising into the night sky" },
      { image: "page-12.svg", sound: "sun", text: "And in the morning the sun was back. Day, night, day, night, all the way round.", alt: "Zuri and Kiki with their arms up at sunrise on the sunny savanna" },
    ],
  },
  {
    id: "how-tall-how-long",
    title: "How Tall? How Long?",
    grades: [2],
    units: [5],
    level: "Level 2",
    description: "Rulers, shapes, patterns and counting in tens - the day the class measured everything.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "How Tall? How Long? is an original Grade 2 story created for Ehel Academy in 2026, book five of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "How Tall? How Long? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki with a ruler, a blue circle and a red triangle at the tree school" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Today we measure!\" said Miss Twiga. She gave every pupil a ruler.", alt: "Miss Twiga handing out wooden rulers to Zuri and Kiki" },
      { image: "page-03.svg", sound: "chick", text: "Zuri measured her book. \"Twenty centimetres long,\" she said.", alt: "A ruler lying along an open book while Zuri points at the marks" },
      { image: "page-04.svg", sound: "kiki-happy", text: "Kiki measured the bench. \"One metre! That is one hundred centimetres.\"", alt: "Kiki measuring a long wooden bench with a ruler while Zuri writes it down" },
      { image: "page-05.svg", sound: "giraffe", text: "Who is tall? Miss Twiga is tall. Who is small? The little chick is small.", alt: "Miss Twiga standing beside a metre stick with a tiny chick at her feet" },
      { image: "page-06.svg", sound: "elephant-happy", text: "The elephant is heavy. A feather is light. Zuri wrote it all down.", alt: "A pan balance with a mango on one side and a feather on the other, the elephant nearby" },
      { image: "page-07.svg", sound: "tree", text: "They found shapes everywhere. The window was a square. The roof was a triangle.", alt: "A small house with a triangular roof and square windows, with shape cards beside it" },
      { image: "page-08.svg", sound: "sun", text: "A circle, a square, a triangle, a rectangle. Zuri drew a heart as well.", alt: "Five shape cards in a row: circle, square, triangle, rectangle and heart" },
      { image: "page-09.svg", sound: "kiki-happy", text: "Kiki made a pattern: circle, square, circle, square. \"What comes next?\"", alt: "A pattern strip of circles and squares with the last space left empty and a question mark" },
      { image: "page-10.svg", sound: "bell", text: "They counted in tens: ten, twenty, thirty, forty, fifty - all the way to one hundred!", alt: "A number line of ten coloured dots counting up to a big red hundred" },
      { image: "page-11.svg", sound: "wind", text: "The path was long and narrow. The field was short and wide.", alt: "A narrow winding path across a wide open field with Zuri pointing at it" },
      { image: "page-12.svg", sound: "chick", text: "\"Measuring is everywhere,\" said Zuri. \"You just have to look.\"", alt: "Zuri holding her book in the sunshine with a ruler and a red heart shape beside her" },
    ],
  },
  {
    id: "the-shape-hunt",
    title: "The Shape Hunt",
    grades: [2],
    units: [5],
    level: "Level 2",
    description: "Circles, squares, triangles, rectangles and one heart - all of them hiding in things Zuri sees every day.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Shape Hunt is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 5. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Shape Hunt. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki at the tree school with a circle, a triangle and a square floating above them" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Today we are hunting shapes,\" said Miss Twiga. \"Start with a circle.\"", alt: "Miss Twiga bending down beside a large blue circle while Zuri listens" },
      { image: "page-03.svg", sound: "sun", text: "The sun is a circle. It is the biggest circle Zuri has ever found.", alt: "Zuri pointing up at the round sun high in the sky" },
      { image: "page-04.svg", sound: "chick", text: "The roof of the house is a triangle. The window is a square.", alt: "Zuri pointing at a house while a triangle and a square float beside her" },
      { image: "page-05.svg", sound: "chick", text: "The door is a rectangle. \"A squashed square,\" said Kiki. Miss Twiga said no.", alt: "Zuri pointing at the door of the house with a purple rectangle beside her" },
      { image: "page-06.svg", sound: "market", text: "The wheels of the bus are circles. Four of them, all turning at once.", alt: "Zuri pointing at the wheels of the town bus with a dark circle beside her" },
      { image: "page-07.svg", sound: "kiki-happy", text: "And there is a heart on Kiki's card. A heart is a shape too, even if it is a tricky one.", alt: "A big birthday card with a red heart on it, with Zuri and Kiki beside it" },
      { image: "page-08.svg", sound: "zuri-happy", text: "Five shapes found. Circle, square, triangle, rectangle, heart.", alt: "Five shapes in a row - circle, square, triangle, rectangle and heart - with Zuri and Kiki below" },
      { image: "page-09.svg", sound: "chick", text: "Shapes can make a pattern. Circle, square, circle, square.", alt: "A strip of shapes alternating circle, square, circle, square, with Zuri pointing at it" },
      { image: "page-10.svg", sound: "kiki-happy", text: "\"So what comes next?\" said Kiki. Zuri knew. It has to be a circle.", alt: "The same pattern strip with an empty question-mark box at the end" },
      { image: "page-11.svg", sound: "kiki-happy", text: "Then Kiki made a harder one. Triangle, triangle, heart. Triangle, triangle, and then?", alt: "A longer pattern strip of triangles and hearts with Kiki pointing at it" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Once you have seen a shape,\" said Zuri, \"you see it everywhere. I cannot stop.\"", alt: "Zuri holding her book beside her own shape painting on an easel in the sunshine" },
    ],
  },
  {
    id: "ten-twenty-one-hundred",
    title: "Ten, Twenty, One Hundred!",
    grades: [2],
    units: [5],
    level: "Level 2",
    description: "Counting one by one takes all morning. Counting in tens gets you to a hundred before lunch.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Ten, Twenty, One Hundred! is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 5. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Ten, Twenty, One Hundred! Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki cheering beside a counting line of ten coloured beads ending in a red one" },
      { image: "page-02.svg", sound: "chick", text: "Zuri counted the books one by one. One, two, three, four. It took all morning.", alt: "Zuri pointing at a shelf of twelve books, counting them one at a time" },
      { image: "page-03.svg", sound: "kiki-happy", text: "\"Count in tens,\" said Kiki. \"Ten. Twenty. Thirty.\"", alt: "Kiki pointing at the counting line while Zuri writes in her book" },
      { image: "page-04.svg", sound: "elephant-happy", text: "\"Forty. Fifty. Sixty.\" The little elephant counted along with her trunk.", alt: "Zuri counting along the line with her arms up while the little elephant joins in" },
      { image: "page-05.svg", sound: "zuri-happy", text: "\"Seventy. Eighty. Ninety.\" Nearly there now.", alt: "Zuri and Kiki cheering beside the counting line while the ostrich watches" },
      { image: "page-06.svg", sound: "bell", text: "\"ONE HUNDRED!\" Ten tens. It took less time than counting the books had.", alt: "The counting line under bunting and confetti with Zuri and Kiki cheering" },
      { image: "page-07.svg", sound: "elephant-happy", text: "Big and small. The elephant is big. The chick is small. Both of them are one.", alt: "The little elephant beside a tiny chick with Zuri pointing between them" },
      { image: "page-08.svg", sound: "kiki-happy", text: "Tall and short. Kiki is one metre tall. Zuri is shorter, and does not mind at all.", alt: "Kiki standing beside a metre stick while Zuri points and Miss Twiga watches" },
      { image: "page-09.svg", sound: "chick", text: "Heavy and light. The mango went down. The feather stayed up.", alt: "A pan balance with a mango on the low side and a feather on the high side" },
      { image: "page-10.svg", sound: "chick", text: "Long and short. This ruler is long. That one is short. Both of them measure.", alt: "A long ruler and a short ruler laid on the bench with Zuri pointing at them" },
      { image: "page-11.svg", sound: "kiki-happy", text: "Wide and narrow. The path is narrow at one end and wide at the other.", alt: "Zuri and Kiki beside a path that is wide at the front and narrow behind, with a metre stick" },
      { image: "page-12.svg", sound: "zuri-happy", text: "Zuri counted her steps home in tens. She reached a hundred, and then she reached the door.", alt: "Zuri with her arms up at sunset beside her burrow with a counting line above her" },
    ],
  },
  {
    id: "the-six-leg-club",
    title: "The Six-Leg Club",
    grades: [2],
    units: [6],
    level: "Level 2",
    description: "A garden full of bugs, and one rule that decides who is really an insect.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Six-Leg Club is an original Grade 2 story created for Ehel Academy in 2026, book six of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "crickets", text: "The Six-Leg Club. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki in a garden full of a butterfly, a bee, ants and a spider's web" },
      { image: "page-02.svg", sound: "chick", text: "In the garden, Zuri found a tiny world. \"Come and look!\" she called.", alt: "Zuri calling Kiki over to a leafy corner of the garden" },
      { image: "page-03.svg", sound: "bird", text: "A butterfly with big orange wings sat on a leaf.", alt: "A large orange butterfly resting on the leaf of a garden plant" },
      { image: "page-04.svg", sound: "kiki-happy", text: "\"Six legs, three body parts and two antennae,\" said Kiki. \"That is an insect.\"", alt: "Kiki pointing out the legs and antennae of a big butterfly while Zuri writes" },
      { image: "page-05.svg", sound: "crickets", text: "An ant crawled under the stone. Then another. Then a hundred more!", alt: "Ants crawling under and around a flat grey stone in the garden" },
      { image: "page-06.svg", sound: "crickets", text: "They marched in a line to the anthill, collecting seeds as they went.", alt: "A line of ants carrying green seeds towards a big earth anthill" },
      { image: "page-07.svg", sound: "crickets", text: "A bee flew above the flowers. Buzz, buzz. She was collecting sweet nectar.", alt: "A striped bee hovering above three flowering garden plants" },
      { image: "page-08.svg", sound: "crickets", text: "A cricket chirped between two blades of grass. Chirp! Chirp!", alt: "A green cricket sitting between two clumps of tall grass" },
      { image: "page-09.svg", sound: "crickets", text: "A spider was spinning a web in front of the gate. Round and round and round.", alt: "A spider on its round web with Zuri looking up in surprise" },
      { image: "page-10.svg", sound: "giraffe", text: "\"A spider has eight legs,\" said Miss Twiga. \"So a spider is not an insect.\"", alt: "Miss Twiga explaining the spider on its web to Zuri and Kiki" },
      { image: "page-11.svg", sound: "tree", text: "Under a wet log they found a worm. No legs at all!", alt: "A pink worm curled in the damp soil under a fallen log" },
      { image: "page-12.svg", sound: "chick", text: "Zuri drew them all in her book. \"The Six-Leg Club,\" she wrote. \"And friends.\"", alt: "Zuri writing in her big open book with the butterfly, bee, cricket and ant around her" },
    ],
  },
  {
    id: "where-is-the-cricket",
    title: "Where Is the Cricket?",
    grades: [2],
    units: [6],
    level: "Level 2",
    description: "Something is chirping in the garden. Zuri looks under, on, in, between, above and behind - in that order.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Where Is the Cricket? is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 6. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "crickets", text: "Where Is the Cricket? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki in the school garden with a green cricket chirping among the plants" },
      { image: "page-02.svg", sound: "zuri-surprised", text: "Something was chirping in the garden. Zuri could hear it. She could not see it.", alt: "Zuri looking around the garden in surprise with her ears up" },
      { image: "page-03.svg", sound: "chick", text: "Under the flat stone? No. That is an ant, and an ant does not chirp.", alt: "Zuri pointing under a flat stone where a single ant is walking" },
      { image: "page-04.svg", sound: "chick", text: "On the leaf? No. That is a butterfly, and a butterfly is very quiet.", alt: "A large butterfly resting on a garden plant while Zuri points at it" },
      { image: "page-05.svg", sound: "chick", text: "In the flower? No. That is a bee. A bee hums. It is not the same sound at all.", alt: "A bee above two flowering garden plants while Zuri watches with her book" },
      { image: "page-06.svg", sound: "chick", text: "Between the tall grass? No. That is a worm, and a worm has no legs to rub together.", alt: "A worm on the soil between two clumps of tall grass with Zuri pointing" },
      { image: "page-07.svg", sound: "zuri-surprised", text: "Above, in the web? No! And that one has eight legs, so it is not an insect either.", alt: "A spider sitting in its web while a surprised Zuri points at it" },
      { image: "page-08.svg", sound: "zuri-sad", text: "In front of the log there was nothing at all. Zuri sat down. The chirping stopped.", alt: "Zuri sitting sadly in front of a fallen log in the garden" },
      { image: "page-09.svg", sound: "zuri-surprised", text: "So she waited, and kept still. Chirp. Chirp. It was BEHIND the log.", alt: "A green cricket on the far side of the fallen log with a delighted Zuri nearby" },
      { image: "page-10.svg", sound: "crickets", text: "Six legs. Two long back ones, for jumping. And two wings, for chirping.", alt: "A large green cricket seen close up while Zuri writes in her book" },
      { image: "page-11.svg", sound: "crickets", text: "Zuri did not catch it. She sat very still and listened to it instead.", alt: "Zuri and Kiki sitting still in the garden at sunset while the cricket chirps" },
      { image: "page-12.svg", sound: "zuri-happy", text: "Now, every evening, Zuri knows exactly where to look. Behind things.", alt: "Zuri with her arms up outside her burrow at night while a cricket chirps nearby" },
    ],
  },
  {
    id: "the-ants-and-the-big-crumb",
    title: "The Ants and the Big Crumb",
    grades: [2],
    units: [6],
    level: "Level 2",
    description: "One crumb, one ant, and then ten of them. Zuri watches a job get done the only way it can be.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Ants and the Big Crumb is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 6. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "chick", text: "The Ants and the Big Crumb. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of a line of ants carrying a crumb towards an anthill while Zuri and Kiki watch" },
      { image: "page-02.svg", sound: "zuri-surprised", text: "Zuri dropped one crumb of her bread. She was going to pick it up. She never got the chance.", alt: "A single crumb on the soil with a surprised Zuri looking down at it" },
      { image: "page-03.svg", sound: "chick", text: "An ant found it. One ant, out of the whole garden, and it took less than a minute.", alt: "One ant beside the crumb on the soil while Zuri points" },
      { image: "page-04.svg", sound: "chick", text: "The ant pushed. The crumb did not move. An ant is strong, but a crumb is very big.", alt: "A single ant straining against the crumb with motion arcs beside it" },
      { image: "page-05.svg", sound: "chick", text: "So the ant ran all the way back to the anthill. It did not give up. It went for help.", alt: "The ant hurrying across the soil towards the anthill while Zuri watches" },
      { image: "page-06.svg", sound: "chick", text: "Two ants. They pushed together. Still too heavy.", alt: "Two ants pushing the crumb from either side while Zuri watches" },
      { image: "page-07.svg", sound: "zuri-surprised", text: "Then ten ants came out of the anthill at once.", alt: "Five ants marching out of the anthill in a line while Zuri looks surprised" },
      { image: "page-08.svg", sound: "zuri-happy", text: "And up it went. Ten ants, one crumb, and no fuss at all.", alt: "Three ants lifting the crumb clear of the ground while Zuri cheers" },
      { image: "page-09.svg", sound: "chick", text: "The line crawled all the way across the flat stone.", alt: "A line of ants carrying the crumb over a flat stone while Zuri points" },
      { image: "page-10.svg", sound: "chick", text: "Over the log. Under the big leaf. Round the plant instead of through it.", alt: "Ants carrying the crumb along the top of a fallen log past a garden plant" },
      { image: "page-11.svg", sound: "zuri-happy", text: "And in it went, right into the anthill, where Zuri could not follow.", alt: "Ants carrying the crumb into a large anthill while Zuri cheers" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"A little and a little,\" wrote Zuri, \"makes a lot. Ask any ant.\"", alt: "Zuri writing in her open book in the garden with an ant and a butterfly nearby" },
    ],
  },
  {
    id: "one-small-seed",
    title: "One Small Seed",
    grades: [2],
    units: [7],
    level: "Level 2",
    description: "Zuri plants one seed, waits a long time, and learns how to look after the earth.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "One Small Seed is an original Grade 2 story created for Ehel Academy in 2026, book seven of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "sun", text: "One Small Seed. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri holding one small seed in a garden with a young tree and a yellow flower" },
      { image: "page-02.svg", sound: "giraffe", text: "Miss Twiga gave every pupil one small seed. \"Plant it and look after it.\"", alt: "Miss Twiga giving a seed to Zuri and Kiki in the school garden" },
      { image: "page-03.svg", sound: "chick", text: "Zuri dug a little hole in the soft, dark soil.", alt: "A small scooped hole in dark soil with a pile of earth beside it" },
      { image: "page-04.svg", sound: "river", text: "She put the seed in and covered it up. Then she began watering it.", alt: "Zuri tipping a green watering can over the covered seed" },
      { image: "page-05.svg", sound: "chick", text: "Day after day, nothing. \"Be patient,\" said Mama. \"Roots grow first, under the ground.\"", alt: "Zuri looking sadly at the soil while roots spread underground and her mama stands beside her" },
      { image: "page-06.svg", sound: "sun", text: "Then, one morning - a green stem! Two little leaves opened to the sun.", alt: "A small green sprout with two leaves in the sunshine and a delighted Zuri" },
      { image: "page-07.svg", sound: "crunch", text: "The class picked up the litter around the garden. Zuri filled a whole bag.", alt: "Paper, a tin and a bottle on the grass with Zuri and Kiki picking them up" },
      { image: "page-08.svg", sound: "bell", text: "Paper here, tins there. \"This is recycling,\" said Kiki. \"We use it all again.\"", alt: "Three recycling bins in blue, gold and green with Zuri and Kiki sorting litter" },
      { image: "page-09.svg", sound: "tree", text: "Trees keep our air clean, said Miss Twiga. So the class planted a small tree too.", alt: "A newly planted young tree with a stake, Miss Twiga and the class around it" },
      { image: "page-10.svg", sound: "river", text: "They gave it water. They gave it good soil. They gave it time.", alt: "Zuri watering the young tree in the sunshine" },
      { image: "page-11.svg", sound: "sun", text: "At last, a flower! Yellow petals, and new seeds hiding inside.", alt: "A tall yellow flower with a butterfly and a bee, and Zuri cheering beside it" },
      { image: "page-12.svg", sound: "chick", text: "\"One small seed, one whole flower,\" said Zuri. \"I am thankful for our earth.\"", alt: "A cutaway of the plant showing roots, stem, leaves and flower, with Zuri writing beside it" },
    ],
  },
  {
    id: "the-stream-clean-up",
    title: "The Stream Clean-Up",
    grades: [2],
    units: [7],
    level: "Level 2",
    description: "The stream behind the school is full of litter, so the class spends a Saturday putting it right.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Stream Clean-Up is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 7. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "river", text: "The Stream Clean-Up. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki beside a stream with a recycling bin and litter on the bank" },
      { image: "page-02.svg", sound: "giraffe", text: "On Saturday the whole class walked down to the stream. Miss Twiga brought the bags.", alt: "Miss Twiga leading Zuri, Kiki and the little elephant down to the stream" },
      { image: "page-03.svg", sound: "zuri-sad", text: "The water was not clean. There was litter on the bank and litter in the stream.", alt: "Litter scattered along the bank and in the water while a sad Zuri looks on" },
      { image: "page-04.svg", sound: "chick", text: "Zuri picked up a bottle. Somebody had left it there. Nobody knew who.", alt: "Zuri reaching for a plastic bottle on the bank of the stream" },
      { image: "page-05.svg", sound: "kiki-happy", text: "Kiki picked up the paper. Paper goes soft in water, so she had to be quick.", alt: "Kiki gathering paper litter beside the stream while Zuri writes" },
      { image: "page-06.svg", sound: "elephant-happy", text: "The little elephant carried the big bag. She was the only one who could.", alt: "The little elephant carrying a full bag with her trunk beside the stream" },
      { image: "page-07.svg", sound: "zuri-happy", text: "Then they sorted it. Paper in one bin. Tins in the next. Glass in the last one.", alt: "Three recycling bins for paper, tins and glass with Zuri and Kiki beside them" },
      { image: "page-08.svg", sound: "river", text: "By the afternoon the water ran clear. Zuri could see the stones on the bottom.", alt: "A fish swimming in the clear stream while Zuri cheers on the bank" },
      { image: "page-09.svg", sound: "bird", text: "And a bird came back to drink. It had not been there in the morning.", alt: "A bird drinking at the edge of the clear stream while Zuri points" },
      { image: "page-10.svg", sound: "giraffe", text: "\"Who put it here?\" asked Miss Twiga. \"Somebody.\" \"And who takes it away?\" \"We do.\"", alt: "Miss Twiga bending down to talk to Zuri and Kiki beside the clean stream" },
      { image: "page-11.svg", sound: "chick", text: "So the class painted a sign for the bank. A green heart, and four words under it.", alt: "A painted sign on an easel beside the stream while Zuri cheers" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Next Saturday,\" said Zuri, \"we will come again.\" And they did.", alt: "Zuri and Kiki with their arms up beside the stream in the evening light, a recycling bin nearby" },
    ],
  },
  {
    id: "thank-you-tree",
    title: "Thank You, Tree",
    grades: [2],
    units: [7],
    level: "Level 2",
    description: "Zuri sits under the old acacia on a hot day and works out everything the tree is quietly doing.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Thank You, Tree is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 7. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "tree", text: "Thank You, Tree. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki under a very large acacia tree with a bird flying above it" },
      { image: "page-02.svg", sound: "sun", text: "At midday the sun was hot. Out on the grass there was nowhere to hide from it.", alt: "Zuri standing in bright sunshine on the open savanna at midday" },
      { image: "page-03.svg", sound: "tree", text: "But under the tree it was cool. The tree was doing something, and Zuri wanted to know what.", alt: "Zuri and Kiki sitting in the shade of a large acacia tree" },
      { image: "page-04.svg", sound: "chick", text: "The roots hold the soil, down where nobody sees them. Without them the rain takes it away.", alt: "A cutaway of a plant showing its roots below the soil, with Zuri pointing" },
      { image: "page-05.svg", sound: "chick", text: "The stem carries the water all the way up. Every leaf gets a drink.", alt: "The cutaway plant showing its stem and leaves, with a watering can beside it" },
      { image: "page-06.svg", sound: "tree", text: "The leaves make the air clean. Zuri took a big breath. It was the tree's air.", alt: "Zuri with her arms up beside a big acacia and one large green leaf" },
      { image: "page-07.svg", sound: "chick", text: "The flowers bring the bees, and the bees bring more flowers.", alt: "A bee above flowering garden plants with a butterfly nearby and Zuri pointing" },
      { image: "page-08.svg", sound: "chick", text: "And the seeds make new trees. One seed is the whole thing, folded up small.", alt: "A large seed on the soil beside a young sapling while Zuri writes" },
      { image: "page-09.svg", sound: "zuri-happy", text: "So Zuri planted a young one right beside the old one.", alt: "Zuri planting a small staked sapling next to a large acacia while Kiki watches" },
      { image: "page-10.svg", sound: "river", text: "And watered it. Every day. Even on the days when nothing seemed to happen.", alt: "Zuri pouring water from a watering can onto the young sapling" },
      { image: "page-11.svg", sound: "bird", text: "The birds nest in the old acacia. One day they will nest in this one.", alt: "A nest with a bird high in the branches of the big acacia while Zuri points" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Thank you, tree,\" said Zuri. The tree did not answer. It went on working.", alt: "Zuri and Kiki with their arms up under the acacia at sunset" },
    ],
  },
  {
    id: "every-home-is-different",
    title: "Every Home Is Different",
    grades: [2],
    units: [8],
    level: "Level 2",
    description: "A burrow, a tree house, a nest, a hive - and all the rooms inside a home.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Every Home Is Different is an original Grade 2 story created for Ehel Academy in 2026, book eight of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "chick", text: "Every Home Is Different. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of a burrow, a house, a tree house, a nest and a beehive with Zuri and Kiki" },
      { image: "page-02.svg", sound: "chick", text: "Zuri lived in a small hole under the ground. It was warm, dark and safe.", alt: "Zuri standing proudly beside the round door of her grassy burrow" },
      { image: "page-03.svg", sound: "kiki-happy", text: "Kiki lived up in a tree house, high in the big baobab.", alt: "Kiki's wooden tree house up the baobab with a rope ladder down to the ground" },
      { image: "page-04.svg", sound: "zebra-happy", text: "Musa had no house at all. The wide savanna was his home.", alt: "Musa the zebra standing on the open savanna between two acacia trees" },
      { image: "page-05.svg", sound: "bird", text: "A bird had a nest of twigs. A bee had a hive full of honey.", alt: "A twig nest and a golden beehive hanging in the branches of an acacia" },
      { image: "page-06.svg", sound: "kiki-happy", text: "\"Come and see my home,\" said Kiki. Inside there was a room for everything.", alt: "A cutaway of a kitchen and a living room side by side with Kiki and Zuri in front" },
      { image: "page-07.svg", sound: "hen", text: "In the kitchen there was a sink and a table. In the dining room, four chairs.", alt: "A kitchen with a sink and cupboards beside a dining room with a table and chairs" },
      { image: "page-08.svg", sound: "kiki-happy", text: "In the living room there was a soft sofa and a warm red rug.", alt: "A living room with a blue sofa, two cushions and a red rug" },
      { image: "page-09.svg", sound: "lullaby", text: "In the bedroom there was a bed by the window. In the bathroom, water and soap.", alt: "A bedroom with a bed under a window beside a bathroom with a bath and a mirror" },
      { image: "page-10.svg", sound: "bell", text: "Kiki made her bed and tidied her room. Zuri swept the floor and set the table.", alt: "Kiki beside the made bed and Zuri setting the dining table" },
      { image: "page-11.svg", sound: "giraffe", text: "Miss Twiga showed them homes far away: an adobe house, a stilt house, a cave house and a tall skyscraper.", alt: "Four homes side by side: an adobe house, a stilt house over water, a cave house and a skyscraper" },
      { image: "page-12.svg", sound: "chick", text: "\"Every home is different,\" said Zuri. \"But every home is somewhere you belong.\"", alt: "Zuri and Kiki at sunset in front of a burrow, a hut, a house and a tree house" },
    ],
  },
  {
    id: "a-room-for-everything",
    title: "A Room for Everything",
    grades: [2],
    units: [8],
    level: "Level 2",
    description: "Kiki has five rooms and Zuri has one. They go and look at both, and neither of them minds.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "A Room for Everything is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 8. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "chick", text: "A Room for Everything. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of two cutaway rooms - a kitchen and a bedroom - with Zuri and Kiki standing between them" },
      { image: "page-02.svg", sound: "kiki-happy", text: "\"Come and see my home,\" said Kiki. Her home is a tree house, up in the big baobab.", alt: "Kiki waving from below her tree house in the baobab while Zuri looks up" },
      { image: "page-03.svg", sound: "chick", text: "The kitchen has a sink, a cooker and a cupboard. The bananas live in the cupboard.", alt: "A cutaway kitchen with a sink, a cooker and a cupboard, with Zuri pointing" },
      { image: "page-04.svg", sound: "kiki-happy", text: "The dining room has a table and four chairs. Four, because visitors come.", alt: "A cutaway dining room with a table and chairs, with Zuri and Kiki beside it" },
      { image: "page-05.svg", sound: "chick", text: "The living room has a soft sofa and a warm rug. This is the best room.", alt: "A cutaway living room with a blue sofa and a red rug, with Kiki and Zuri beside it" },
      { image: "page-06.svg", sound: "chick", text: "The bedroom has a bed, a pillow and a window. The window is for looking at the stars.", alt: "A cutaway bedroom with a bed, a pillow and a window, with Zuri beside it" },
      { image: "page-07.svg", sound: "chick", text: "And the bathroom has a bath and a tap. The tap drips. Kiki says she likes it.", alt: "A cutaway bathroom with a bath and a dripping tap, with Zuri pointing" },
      { image: "page-08.svg", sound: "kiki-happy", text: "\"And where do you keep your books?\" asked Zuri. Kiki showed her the shelf. Twelve.", alt: "A shelf of twelve coloured books indoors with Zuri pointing and Kiki cheering" },
      { image: "page-09.svg", sound: "zuri-happy", text: "Then they went to Zuri's home. A burrow has one room, and it is for everything.", alt: "Zuri with her arms up outside her burrow on the sunny savanna" },
      { image: "page-10.svg", sound: "chick", text: "\"Is one room enough?\" asked Kiki. \"It is enough for me,\" said Zuri. \"It is warm and it is safe.\"", alt: "Zuri and Kiki talking outside the burrow under the night sky" },
      { image: "page-11.svg", sound: "chick", text: "So they drew both homes, side by side, and put them on the wall together.", alt: "Two drawings on easels - a house and a burrow - with Zuri holding her book" },
      { image: "page-12.svg", sound: "zuri-happy", text: "Five rooms or one room. Every home has a place for everything it needs.", alt: "Zuri and Kiki with their arms up at sunset in front of a tree house and a burrow" },
    ],
  },
  {
    id: "far-away-homes",
    title: "Far Away Homes",
    grades: [2],
    units: [8],
    level: "Level 2",
    description: "Miss Twiga's big book of homes - adobe, stilt, cave and skyscraper, and a nest, a hive and a burrow.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Far Away Homes is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 8. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "chick", text: "Far Away Homes. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of four homes in a row - an adobe house, a stilt house, a cave house and a skyscraper - with Zuri in front" },
      { image: "page-02.svg", sound: "giraffe", text: "Miss Twiga brought a big book of homes. \"None of these,\" she said, \"is anywhere near here.\"", alt: "Miss Twiga bending over a large open book on the bench with Zuri and Kiki" },
      { image: "page-03.svg", sound: "sun", text: "An adobe house, where it is hot and dry. Thick mud walls keep the day outside.", alt: "A large adobe house with thick sandy walls and small windows, with Zuri pointing at it" },
      { image: "page-04.svg", sound: "zuri-surprised", text: "A stilt house, where the water rises. When the river comes up, the house stays dry.", alt: "A house standing on tall wooden stilts above the water, with a surprised Zuri below" },
      { image: "page-05.svg", sound: "chick", text: "A cave house, cut into the cool rock. Somebody made it, a long time ago.", alt: "A home cut into a large rock with a warm light inside, with Zuri looking at it" },
      { image: "page-06.svg", sound: "market", text: "A skyscraper, with more windows than Zuri could count. People live in every one.", alt: "A tall skyscraper full of lit windows with Zuri and Kiki looking up at it" },
      { image: "page-07.svg", sound: "bird", text: "A nest of twigs, high in the acacia. One bird built it in one week.", alt: "A nest with a bird in it high in an acacia tree, with Zuri pointing" },
      { image: "page-08.svg", sound: "chick", text: "A hive of wax, humming all day. The bees made every wall of it themselves.", alt: "A beehive hanging from an acacia branch with a bee nearby and Zuri watching" },
      { image: "page-09.svg", sound: "zuri-happy", text: "And a burrow, under the ground, where the sand stays cool. Zuri knows that one.", alt: "Zuri with her arms up outside her burrow on the savanna" },
      { image: "page-10.svg", sound: "chick", text: "Different walls. Different roofs. Different doors.", alt: "A house, a block of flats, a thatched hut and a tree house side by side with Zuri in front" },
      { image: "page-11.svg", sound: "kiki-happy", text: "But the same thing inside every one - a place to sit, and somebody glad you came.", alt: "A cutaway living room with a sofa and a rug, with Zuri and Kiki cheering" },
      { image: "page-12.svg", sound: "zuri-happy", text: "Zuri drew them all into her book, and left a page for the ones she has not seen.", alt: "Four faraway homes in a row at sunset with Zuri holding up her book" },
    ],
  },
  {
    id: "a-day-in-the-big-city",
    title: "A Day in the Big City",
    grades: [2],
    units: [9],
    level: "Level 2",
    description: "A map, a bus, an underground train and an aquarium full of amazing animals.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "A Day in the Big City is an original Grade 2 story created for Ehel Academy in 2026, book nine of the Zuri series. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "A Day in the Big City. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki in front of tall city buildings, a yellow bus and a Ferris wheel" },
      { image: "page-02.svg", sound: "bell", text: "The class took the bus into the big city. Traffic hummed all around them.", alt: "The yellow bus on a city road with cars behind it and tall buildings ahead" },
      { image: "page-03.svg", sound: "wind", text: "A helicopter flew above the rooftops. \"Amazing!\" said Zuri.", alt: "A teal helicopter flying over the city rooftops while Zuri points up at it" },
      { image: "page-04.svg", sound: "giraffe", text: "Miss Twiga gave them a map. \"Read the directions. We go straight ahead.\"", alt: "A folded street map with a dotted red route, held out for Zuri and Kiki" },
      { image: "page-05.svg", sound: "bell", text: "First, the library. So many books, and so very quiet!", alt: "The city library with tall columns, a sign and an open book carved above the door" },
      { image: "page-06.svg", sound: "market", text: "Next, the market. Then the huge shopping centre, with a lift to the top.", alt: "A market stall beside a big purple shopping centre with rows of windows" },
      { image: "page-07.svg", sound: "wind", text: "They rode the underground. It was fast and dark and a little bit scary.", alt: "A red underground train arriving at a tiled platform with its headlight glowing" },
      { image: "page-08.svg", sound: "river", text: "Then a ferry across the water. The city looked beautiful from there.", alt: "A white ferry crossing blue water with the city skyline behind it and Lulu flying above" },
      { image: "page-09.svg", sound: "puddle", text: "At the aquarium, an octopus waved eight clever arms.", alt: "A pink octopus with eight curling arms in a big lit aquarium tank" },
      { image: "page-10.svg", sound: "chick", text: "A penguin dived. A turtle sailed slowly past, like an old, wise boat.", alt: "A penguin diving through the water while a green sea turtle glides by" },
      { image: "page-11.svg", sound: "puddle", text: "Behind thick glass swam a shark. \"Dangerous,\" whispered Kiki. \"And huge.\"", alt: "A large grey shark swimming behind the thick glass of the aquarium tank" },
      { image: "page-12.svg", sound: "bell", text: "On the Ferris wheel they went up and up. \"What a day,\" said Zuri. \"What a city!\"", alt: "The lit Ferris wheel above the city at sunset with Zuri and Kiki cheering" },
    ],
  },
  {
    id: "ten-oclock-at-the-aquarium",
    title: "Ten O'Clock at the Aquarium",
    grades: [2],
    units: [9],
    level: "Level 2",
    description: "The aquarium runs to a schedule, and Zuri means to see every single thing on it.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Ten O'Clock at the Aquarium is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 9. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "puddle", text: "Ten O'Clock at the Aquarium. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri and Kiki in front of a huge aquarium tank with an octopus, a penguin and fish inside" },
      { image: "page-02.svg", sound: "chick", text: "The schedule on the wall said what would happen and when. Zuri read all of it twice.", alt: "Zuri pointing at a large schedule sheet on the aquarium wall while Kiki waits" },
      { image: "page-03.svg", sound: "zuri-surprised", text: "Ten o'clock: the octopus. Eight arms, and every one of them is clever.", alt: "An octopus moving through the water of the big tank while Zuri cheers" },
      { image: "page-04.svg", sound: "chick", text: "Eleven o'clock: the penguins. On land they are slow. In the water they are the fastest thing there.", alt: "Two penguins swimming and diving in the tank while Zuri and Kiki watch" },
      { image: "page-05.svg", sound: "chick", text: "Twelve o'clock: the turtle is fed. The turtle is old, and slow, and does not care.", alt: "A large sea turtle swimming slowly in the tank while Zuri writes in her book" },
      { image: "page-06.svg", sound: "zuri-surprised", text: "One o'clock: the shark. It is huge. It is behind very thick glass. Zuri checked.", alt: "A large shark gliding through the tank while a surprised Zuri and Kiki look on" },
      { image: "page-07.svg", sound: "kiki-sad", text: "Kiki did not like the shark. So Zuri stood next to her until it swam away.", alt: "Kiki looking frightened at the tank while Zuri stands close beside her" },
      { image: "page-08.svg", sound: "chick", text: "Two o'clock: a hundred small fish, all turning at exactly the same moment.", alt: "A shoal of small orange fish turning together inside the aquarium tank" },
      { image: "page-09.svg", sound: "giraffe", text: "Three o'clock: the talk. \"The sea is a home too,\" said Miss Twiga. \"Do not drop anything into it.\"", alt: "Miss Twiga the giraffe talking to Zuri and Kiki in the dim aquarium hall" },
      { image: "page-10.svg", sound: "chick", text: "Zuri copied the whole schedule into her book, so she could do it all again one day.", alt: "Zuri writing in her open book beside the schedule in the aquarium hall" },
      { image: "page-11.svg", sound: "market", text: "Then out into the city again - loud, bright and dry.", alt: "Zuri and Kiki back on the busy city street with a bus behind them" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Amazing,\" said Zuri. It was the best word she had, and it was not quite big enough.", alt: "Zuri and Kiki cheering at sunset with the city skyline and a lit Ferris wheel" },
    ],
  },
  {
    id: "which-way-to-the-library",
    title: "Which Way to the Library?",
    grades: [2],
    units: [9],
    level: "Level 2",
    description: "Miss Twiga hands Zuri the map, and the class has to find the library before lunch.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Which Way to the Library? is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 9. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Which Way to the Library? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri holding a city map on a busy street with tall buildings and a zebra crossing" },
      { image: "page-02.svg", sound: "giraffe", text: "The class had to find the library before lunch. Nobody had ever been there before.", alt: "Miss Twiga with Zuri and Kiki on a city street beside the tall buildings" },
      { image: "page-03.svg", sound: "giraffe", text: "\"You lead,\" said Miss Twiga, and she gave Zuri the map.", alt: "Miss Twiga handing a folded city map to Zuri on the street" },
      { image: "page-04.svg", sound: "chick", text: "\"Straight ahead,\" said the map. So they went straight ahead, past the cars.", alt: "Zuri pointing straight ahead along the street past a row of cars" },
      { image: "page-05.svg", sound: "market", text: "Past the market, where everybody was calling at once and it was hard to think.", alt: "Zuri passing a busy market stall while the shopkeeper hen calls out" },
      { image: "page-06.svg", sound: "chick", text: "\"Turn left at the shopping centre.\" Left is the hand you do not write with.", alt: "Zuri pointing left beside a large shopping centre while Kiki follows" },
      { image: "page-07.svg", sound: "bell", text: "Stop. Look. Listen. Then cross at the zebra crossing, all together.", alt: "Zuri and Kiki waiting at a zebra crossing with a stop sign and traffic beyond" },
      { image: "page-08.svg", sound: "bell", text: "Past the clock tower. It said half past eleven, so there was still time.", alt: "Zuri pointing up at a clock tower on the city street with Kiki beside her" },
      { image: "page-09.svg", sound: "kiki-sad", text: "\"Are we lost?\" said Kiki. \"No,\" said Zuri. \"I just have to read it again.\"", alt: "A worried Kiki beside Zuri, who is studying the map on the street" },
      { image: "page-10.svg", sound: "chick", text: "The map said right. Zuri did not feel like right. They went right.", alt: "Zuri pointing right along the street while Kiki cheers" },
      { image: "page-11.svg", sound: "zuri-happy", text: "And there it was.", alt: "Zuri and Kiki cheering in front of the library building" },
      { image: "page-12.svg", sound: "chick", text: "Inside it was quiet and cool and full of words. \"A big city is not lost,\" said Zuri, \"if you can read a map.\"", alt: "Zuri reading an open book inside the library beside a shelf of twelve books, with Kiki nearby" },
    ],
  },
  {
    id: "zuris-book-of-the-year",
    title: "Zuri's Book of the Year",
    grades: [2],
    units: [10],
    level: "Level 2",
    description: "One page for every unit of Year 2, made into a book of Zuri's own.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Zuri's Book of the Year is an original Grade 2 story created for Ehel Academy in 2026, book ten of the Zuri series and the close of the Grade 2 shelf. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Zuri's Book of the Year. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri holding her book at a classroom exhibition with bunting and two easels" },
      { image: "page-02.svg", sound: "giraffe", text: "It was the last week of Year 2. \"Make a book about your year,\" said Miss Twiga.", alt: "Miss Twiga at the chalkboard while Zuri and Kiki look at a big open book" },
      { image: "page-03.svg", sound: "chick", text: "On the first page Zuri wrote her name, and spelled it: Z-U-R-I.", alt: "Zuri beside an easel holding a card with a red heart on it" },
      { image: "page-04.svg", sound: "bell", text: "On the second page she drew her neighbours: the bus driver, the firefighter and the reporter.", alt: "An easel showing a bus, with a firefighter's helmet and a reporter's notepad beside it" },
      { image: "page-05.svg", sound: "ball", text: "On the third page: a head, two arms, two hands and ten fingers. \"This is me!\"", alt: "An easel with a small drawing of Zuri while Zuri herself stretches beside it" },
      { image: "page-06.svg", sound: "sun", text: "On the fourth page she drew the sun, the light and her own long shadow.", alt: "Zuri pointing at her long shadow beside an easel with a yellow sun on it" },
      { image: "page-07.svg", sound: "bell", text: "On the fifth page she counted in tens: ten, twenty, thirty - one hundred.", alt: "A number line counting in tens above Zuri with her arms raised" },
      { image: "page-08.svg", sound: "crickets", text: "On the sixth page: a butterfly, a cricket and one busy little ant.", alt: "A butterfly, a cricket and an ant around Zuri and an easel" },
      { image: "page-09.svg", sound: "river", text: "On the seventh page: planting, watering and picking up litter.", alt: "A yellow flower, a watering can and a recycling bin beside Zuri" },
      { image: "page-10.svg", sound: "chick", text: "On the eighth page: a house, a flat and a hut. Every home is different.", alt: "A small house, a block of flats and a thatched hut in a row with Zuri in front" },
      { image: "page-11.svg", sound: "market", text: "On the ninth page: the library, the shopping centre and the underground.", alt: "The library, the shopping centre and an underground train drawn small in a row" },
      { image: "page-12.svg", sound: "bell", text: "On the last page Zuri drew all her friends. \"Goodbye, Year 2,\" she said. \"Hello, Year 3!\"", alt: "All the friends together under bunting and confetti with Zuri and Kiki cheering" },
    ],
  },
  {
    id: "zuri-makes-a-plan",
    title: "Zuri Makes a Plan",
    grades: [2],
    units: [10],
    level: "Level 2",
    description: "Before you make anything, you make a plan. Six steps, and Zuri does all of them in order.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Zuri Makes a Plan is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 10. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Zuri Makes a Plan. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Zuri at the tree school beside a plan on an easel and a chalkboard, with Kiki cheering" },
      { image: "page-02.svg", sound: "giraffe", text: "\"Make a book called My English World,\" read Miss Twiga. \"You have three weeks.\"", alt: "Miss Twiga reading the project brief from a big open book to Zuri and Kiki" },
      { image: "page-03.svg", sound: "chick", text: "Step one: choose. Zuri chose her year. All of it. She did not want to leave anything out.", alt: "Zuri thinking, with a red heart inside a thought bubble above her" },
      { image: "page-04.svg", sound: "chick", text: "Step two: plan. Nine pages, one for every unit. She wrote the list on the board.", alt: "Zuri pointing at her nine-page plan chalked on the big board" },
      { image: "page-05.svg", sound: "chick", text: "Step three: collect. Zuri already had most of it, in the book she writes in every day.", alt: "Zuri with her open book on the bench and a shelf of nine books beside her" },
      { image: "page-06.svg", sound: "zuri-happy", text: "Step four: draw. This was the long step. It was also the best one.", alt: "Zuri cheering beside her butterfly drawing standing on an easel" },
      { image: "page-07.svg", sound: "chick", text: "Step five: write. One sentence under every drawing. Only one. That is harder than it sounds.", alt: "Zuri writing in a large open book on the bench with Kiki nearby" },
      { image: "page-08.svg", sound: "chick", text: "Step six: check. Every word, twice, out loud.", alt: "Zuri pointing at a notepad, checking her writing line by line" },
      { image: "page-09.svg", sound: "kiki-happy", text: "Kiki checked Zuri's pages and Zuri checked Kiki's. That is faster than checking your own.", alt: "Zuri and Kiki reading each other's open books on the bench" },
      { image: "page-10.svg", sound: "zuri-surprised", text: "They found one mistake. Zuri had spelled Wednesday with no d in it. She mended it.", alt: "A surprised Zuri pointing at a corrected word on the class board" },
      { image: "page-11.svg", sound: "zuri-happy", text: "Then the plan went up on the wall with every step ticked off.", alt: "Two easels showing the finished plan and a green heart, with Zuri cheering" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Now,\" said Zuri, closing her book, \"it is ready.\"", alt: "Zuri holding up her finished book at sunset with Kiki beside her" },
    ],
  },
  {
    id: "the-day-of-the-showcase",
    title: "The Day of the Showcase",
    grades: [2],
    units: [10],
    level: "Level 2",
    description: "Showcase Day - the families come, the easels go up, and Zuri reads her whole year out loud.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Day of the Showcase is an original Grade 2 story created for Ehel Academy in 2026, one of the three Zuri books for Unit 10. Story and vector illustrations by Ehel Academy Learning Studio, set in the same storyworld as the Grade 1 Musa, Kiki, Duku and Lulu books. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Day of the Showcase. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the tree school under bunting with easels of pupils' work and Zuri holding up her book" },
      { image: "page-02.svg", sound: "zebra-happy", text: "The families came on Saturday morning. Musa's family came early and stood at the front.", alt: "Musa the zebra and Duku the donkey arriving at the tree school under bunting" },
      { image: "page-03.svg", sound: "zuri-happy", text: "Zuri stood beside her own easel. Her hands were shaking a little. She started anyway.", alt: "Zuri pointing at her card on an easel in front of the class" },
      { image: "page-04.svg", sound: "chick", text: "Page one: \"My name is Zuri. Z-U-R-I. I am seven.\"", alt: "Zuri with her arms up beside an easel showing her open-book page" },
      { image: "page-05.svg", sound: "chick", text: "Page two: the neighbours. The bus driver, the window cleaner, the firefighter.", alt: "Zuri beside an easel showing the town bus, with a firefighter's kit nearby" },
      { image: "page-06.svg", sound: "sun", text: "Page four: the sun, the light, and her own very long shadow.", alt: "Zuri pointing at her sun page on an easel with her long shadow across the ground" },
      { image: "page-07.svg", sound: "chick", text: "Page six: the Six-Leg Club. Butterfly, cricket, ant. No spiders.", alt: "Zuri beside her butterfly page on an easel with a butterfly and a cricket nearby" },
      { image: "page-08.svg", sound: "kiki-happy", text: "Then it was Kiki's turn, and Kiki talked for a very long time.", alt: "Kiki presenting her page on an easel while Zuri holds her book" },
      { image: "page-09.svg", sound: "lulu-happy", text: "Musa came to look. Duku came to look. Lulu the swallow watched from the air.", alt: "Musa, Duku and Lulu at the showcase while Zuri cheers below the bunting" },
      { image: "page-10.svg", sound: "zuri-happy", text: "And Zuri's mama clapped louder than anybody in the whole school yard.", alt: "Zuri's mother clapping beside Zuri as confetti falls" },
      { image: "page-11.svg", sound: "giraffe", text: "Miss Twiga gave every pupil a card. Zuri read hers four times on the way home.", alt: "Miss Twiga beside a large card on the bench with Zuri and Kiki" },
      { image: "page-12.svg", sound: "zuri-happy", text: "\"Goodbye, Year 2,\" said Zuri. \"And hello, Year 3.\"", alt: "Zuri holding up her book at sunset under bunting and confetti with Kiki beside her" },
    ],
  },

  // ---------------------------------------------------------------- Grade 3
  // Grade 3 keeps the one-book-per-unit shape and drops the animals, because by
  // Grade 3 the course has a cast of its own: Amal, her friend Nora, Teacher
  // Yasmin and Omar the shopkeeper run through all ten units of the readings —
  // 604 mentions — and Unit 7 is written as a trip "following Amal, Nora and
  // Teacher Yasmin from the coast to the forest". A shelf starring anybody else
  // would contradict the lesson beside it.
  //
  // Several books borrow their unit's own device on purpose — the spelling
  // contest, the calendar on the wall, the wall behind the garden, the two roads
  // to school, the million shells, the Box of Ideas, the Showcase — so a learner
  // recognises the book from the unit they just read.
  //
  // The stories are longer than Grade 2's and carry a real turn: Amal does not
  // win the contest, and the page says so. Illustrations:
  // tools/create-grade3-ebook-illustrations.js.
  {
    id: "the-family-who-helps",
    title: "The Family Who Helps",
    grades: [3],
    units: [1],
    level: "Level 3",
    description: "Amal's house is full of people, and everybody in it has a job to do - including her.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Family Who Helps is an original Grade 3 story created for Ehel Academy in 2026, book one of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Family Who Helps. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal's whole family together at home: Grandma Hana, Dad, Mum, Adam, Amal, Idris and little Mina" },
      { image: "page-02.svg", sound: "bird", text: "My name is Amal. I am eight years old, and I live with my family in a small house near the town centre.", alt: "Amal standing outside her family's house with her arms raised" },
      { image: "page-03.svg", sound: "bell", text: "There are a lot of us. Adam is my older brother, Idris is younger, and Mina is the littlest of all.", alt: "Adam, Idris and Mina lined up in the front room while Amal points them out" },
      { image: "page-04.svg", sound: "lullaby", text: "Grandma Hana lives with us too. At night she tells us stories - some of them true, some brand new.", alt: "Grandma Hana reading to Mina, Idris and Amal in a lamplit room at night" },
      { image: "page-05.svg", sound: "hen", text: "Every evening we eat together. Dad asks each of us to name one good thing that happened that day.", alt: "The family around the dining table while Dad asks each child a question" },
      { image: "page-06.svg", sound: "bell", text: "It is my duty to keep my room tidy. It is Adam's duty to help Idris with his reading.", alt: "Amal beside a tidy bedroom while Adam reads with Idris" },
      { image: "page-07.svg", sound: "chick", text: "Mum says a family is a place where everybody is needed. Even Mina has a job: she puts her toys away.", alt: "Mum pointing out the living room while little Mina raises her arms" },
      { image: "page-08.svg", sound: "bell", text: "At school we show respect too. We listen when other people talk, even when we are bursting to speak.", alt: "Teacher Yasmin talking to the class while Amal and Nora listen at their desks" },
      { image: "page-09.svg", sound: "wind", text: "In a public place we walk calmly. In our own rooms at home we can be as noisy as we like.", alt: "Amal and Nora walking quietly across the schoolyard with a house behind them" },
      { image: "page-10.svg", sound: "bell", text: "Nora and I walk the junior students to their classrooms. It can feel confusing to be new at a big school.", alt: "Amal and Nora walking a small junior student across the schoolyard" },
      { image: "page-11.svg", sound: "bell", text: "Teacher Yasmin says good listening means \"I care what you think.\" I am practising every day.", alt: "Teacher Yasmin explaining to Amal and Nora in the classroom" },
      { image: "page-12.svg", sound: "bird", text: "My family helps me, and I help them. That is what makes our house feel warm.", alt: "Amal, Mina and Mum outside their house at sunset" },
    ],
  },
  {
    id: "the-spelling-contest",
    title: "The Spelling Contest",
    grades: [3],
    units: [2],
    level: "Level 3",
    description: "Thirty words, one week, and a lesson about what studying actually looks like.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Spelling Contest is an original Grade 3 story created for Ehel Academy in 2026, book two of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Spelling Contest. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora in the classroom under bunting with Teacher Yasmin and the word list" },
      { image: "page-02.svg", sound: "bell", text: "Our class was getting ready for the spelling contest. Teacher Yasmin gave us a practice list on Monday.", alt: "Teacher Yasmin handing out the practice list while Amal and Nora cheer" },
      { image: "page-03.svg", sound: "bell", text: "The list had thirty words on it. Some of them were easy. Some were not easy at all.", alt: "Amal looking up in alarm at a long word list pinned to the classroom wall" },
      { image: "page-04.svg", sound: "market", text: "Nora studied at the library after school. I studied at home with Adam.", alt: "Nora and Amal outside the town library, each holding a book" },
      { image: "page-05.svg", sound: "bell", text: "I lost my eraser on Tuesday, so Idris lent me his. A good brother is a good supply.", alt: "A downcast Amal at her desk while Idris offers her his eraser" },
      { image: "page-06.svg", sound: "bell", text: "On Wednesday we wrote a short report about spelling rules and read it out to the class.", alt: "Amal reading her report aloud while Teacher Yasmin and Nora listen" },
      { image: "page-07.svg", sound: "bell", text: "Teacher Yasmin taught us a rule: \"i before e, most of the time.\" Rules have exceptions.", alt: "Teacher Yasmin pointing at a spelling rule written on the board" },
      { image: "page-08.svg", sound: "wind", text: "On Thursday I got three words wrong. I wanted to give up.", alt: "Amal alone at her desk in the empty classroom, looking sad" },
      { image: "page-09.svg", sound: "lullaby", text: "Grandma Hana said, \"An author does not write a book in one night. Study a little, every day.\"", alt: "Grandma Hana in her reading glasses talking to a downcast Amal beside a shelf of books" },
      { image: "page-10.svg", sound: "bell", text: "So I studied the details. Just five words each evening, until I knew every one of them.", alt: "Amal working through her book at home while Adam sits with her" },
      { image: "page-11.svg", sound: "bell", text: "On Friday the contest began. When my word came, I closed my eyes and spelled it slowly.", alt: "Amal standing to spell her word while Teacher Yasmin holds the list and Nora cheers" },
      { image: "page-12.svg", sound: "bell", text: "I did not win. But I knew every word on my card, and Teacher Yasmin said that is what learning looks like.", alt: "Confetti in the classroom with Amal and Nora celebrating and Teacher Yasmin applauding" },
    ],
  },
  {
    id: "the-calendar-on-the-wall",
    title: "The Calendar on the Wall",
    grades: [3],
    units: [3],
    level: "Level 3",
    description: "Twelve months go up on the classroom wall, and Amal learns how fast a year can go.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Calendar on the Wall is an original Grade 3 story created for Ehel Academy in 2026, book three of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Calendar on the Wall. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the class calendar of twelve months on the wall with Amal and Nora beside it" },
      { image: "page-02.svg", sound: "bell", text: "Our class made a calendar and hung it on the wall. It had all twelve months, from January to December.", alt: "The full twelve-month calendar on the classroom wall with Teacher Yasmin pointing at it" },
      { image: "page-03.svg", sound: "bell", text: "January, February, March. I wrote the first three months in my very best handwriting.", alt: "Amal writing on the calendar with January ringed in red" },
      { image: "page-04.svg", sound: "rain", text: "April, May, June. Nora drew rain on one month and sunshine on the next.", alt: "Nora pointing at the spring months on the class calendar" },
      { image: "page-05.svg", sound: "wind", text: "July, August, September. Idris drew a kite on every single page, because he likes kites.", alt: "Idris holding his drawing beside the calendar while a kite flies above" },
      { image: "page-06.svg", sound: "bell", text: "October, November, December. Mina coloured the very last month completely purple.", alt: "Little Mina cheering beside the calendar with December ringed" },
      { image: "page-07.svg", sound: "bell", text: "Teacher Yasmin said, \"A year has twelve months. A day has twenty-four hours. Use them well.\"", alt: "Teacher Yasmin beside a globe, explaining to the class" },
      { image: "page-08.svg", sound: "hen", text: "Every morning I get up at six. I eat at seven, and by eight o'clock I am at school.", alt: "Amal and Mum in the kitchen early in the morning" },
      { image: "page-09.svg", sound: "bell", text: "Yesterday I finished my homework early. Today I am helping Mina with hers.", alt: "Amal helping Mina with her book at the table" },
      { image: "page-10.svg", sound: "bird", text: "Tomorrow the vacation begins, and I will read all the books I have been saving up.", alt: "Amal cheering in the schoolyard beside a shelf of books" },
      { image: "page-11.svg", sound: "lullaby", text: "Grandma Hana laughed. \"A century is a hundred years,\" she said, \"and it still goes by.\"", alt: "Grandma Hana laughing with Amal and Idris at home" },
      { image: "page-12.svg", sound: "bell", text: "On the last page I wrote a poem: \"The months go fast, the hours too - so do the thing you mean to do.\"", alt: "Amal holding her poem beside it pinned up on the classroom wall" },
    ],
  },
  {
    id: "the-places-that-help-us",
    title: "The Places That Help Us",
    grades: [3],
    units: [4],
    level: "Level 3",
    description: "A walk through the whole community, and the job that every place in it does.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Places That Help Us is an original Grade 3 story created for Ehel Academy in 2026, book four of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "The Places That Help Us. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora in town between the hospital and the library" },
      { image: "page-02.svg", sound: "bell", text: "A community is a place where people live together and help one another.", alt: "Teacher Yasmin showing Amal the houses, the flats and the crossing in town" },
      { image: "page-03.svg", sound: "bell", text: "At the hospital, doctors and nurses look after people who are sick or hurt.", alt: "The town hospital with its green cross, and Mum and Amal outside it" },
      { image: "page-04.svg", sound: "market", text: "At the market, Omar calls out beside his baskets of bananas, maize and rice.", alt: "Omar the shopkeeper at his market stall while Amal writes it down" },
      { image: "page-05.svg", sound: "bell", text: "A police officer stands at the corner of the road and helps everybody cross safely.", alt: "An officer at the zebra crossing with Amal and Mina waiting, and a bus behind" },
      { image: "page-06.svg", sound: "river", text: "Down at the coast, a sailor ties up his boat and carries the day's catch to the market.", alt: "A sailor on the shore holding a shell, with a ferry out on the water and Amal beside him" },
      { image: "page-07.svg", sound: "bell", text: "The college is where Adam will study when he is older. The court is where people settle what is fair.", alt: "Adam with a book in front of the college and the courthouse" },
      { image: "page-08.svg", sound: "bell", text: "The library has the door I like best. It is the quietest door in the whole county.", alt: "Amal holding a book outside the tall columns of the town library" },
      { image: "page-09.svg", sound: "bell", text: "Teacher Yasmin showed us a map. \"Here is our village. Here is our county. Here is the border.\"", alt: "Teacher Yasmin pointing at a folded map with a route marked on it" },
      { image: "page-10.svg", sound: "bell", text: "She asked us to learn our address by heart, in case we are ever lost.", alt: "Amal and Nora writing their addresses at their desks" },
      { image: "page-11.svg", sound: "bell", text: "We found the exit signs in every building. Knowing the way out is part of being safe.", alt: "Amal pointing at a green exit sign outside the hospital" },
      { image: "page-12.svg", sound: "market", text: "Every place has its own job to do. So does every person in it - including me.", alt: "Amal and Nora cheering at sunset with the hospital, the market and the library behind them" },
    ],
  },
  {
    id: "the-wall-behind-the-garden",
    title: "The Wall Behind the Garden",
    grades: [3],
    units: [5],
    level: "Level 3",
    description: "A fallen wall, one hot Saturday, and a whole family that will not leave it fallen.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Wall Behind the Garden is an original Grade 3 story created for Ehel Academy in 2026, book five of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "The Wall Behind the Garden. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Dad, Amal, Adam and Idris in the garden beside a low brick wall" },
      { image: "page-02.svg", sound: "hen", text: "On Saturday our family had a busy day. Mum said we should work together before the sun got too hot.", alt: "Mum giving out the jobs in the garden while Amal and Adam listen" },
      { image: "page-03.svg", sound: "wind", text: "First we cleaned the yard. Dad swept the path while I picked up the loose leaves.", alt: "Dad sweeping the path while Amal points out the litter to be cleared" },
      { image: "page-04.svg", sound: "bird", text: "Then we discussed the garden. Adam wanted maize. Mina wanted flowers. We decided to plant both.", alt: "Adam, Mina and Amal discussing the garden beside a seed row and a flowering plant" },
      { image: "page-05.svg", sound: "tree", text: "But we could not plant anything yet, because the old wall behind the garden had fallen down.", alt: "A surprised Amal in front of a heap of tumbled bricks where the wall used to stand" },
      { image: "page-06.svg", sound: "bell", text: "So we built it again, stone by stone. Idris carried, Adam lifted, and I fitted the stones together.", alt: "Idris, Adam and Amal rebuilding the low brick wall together" },
      { image: "page-07.svg", sound: "river", text: "Nora came to help. Omar brought us water, and Grandma Hana told us where the wall used to end.", alt: "Grandma Hana pointing along the wall while Nora and Omar help" },
      { image: "page-08.svg", sound: "wind", text: "By noon we had a heap of broken stones to remove. It was hot, and my arms ached.", alt: "A tired Amal and Idris in the midday sun beside a cloud of dust" },
      { image: "page-09.svg", sound: "bell", text: "\"Nearly done,\" said Dad. \"A wall protects a garden. A garden feeds a family.\"", alt: "Dad explaining to Amal beside the half-built wall" },
      { image: "page-10.svg", sound: "bell", text: "In the afternoon we completed it. The wall stood straight, and the garden was safe.", alt: "Amal and Adam cheering at either end of the finished wall" },
      { image: "page-11.svg", sound: "bird", text: "Then we planted: maize along one side and flowers along the other, because that is what we agreed.", alt: "Amal and Mina planting a seed row and flowers beside the new wall" },
      { image: "page-12.svg", sound: "lullaby", text: "That evening we celebrated with sweet tea. It happened because we did it together.", alt: "Dad, Mum, Amal and Adam together at sunset beside the finished wall" },
    ],
  },
  {
    id: "the-girl-who-carried-kindness",
    title: "The Girl Who Carried Kindness",
    grades: [3],
    units: [6],
    level: "Level 3",
    description: "Two roads to school, and the reason Nora always takes the long one.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Girl Who Carried Kindness is an original Grade 3 story created for Ehel Academy in 2026, book six of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "The Girl Who Carried Kindness. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora standing where the two roads to school divide" },
      { image: "page-02.svg", sound: "bell", text: "My cousin Noah is my favourite person in the family. He is kind and honest, and he never says one thing while thinking another.", alt: "Noah at home with Amal pointing him out" },
      { image: "page-03.svg", sound: "bird", text: "Nora is my favourite person outside it. She is friendly and calm, even when everybody else is busy.", alt: "Nora standing calmly in the schoolyard with Amal beside her" },
      { image: "page-04.svg", sound: "wind", text: "There are two roads to school. One is short and rough. The other is long and smooth.", alt: "Amal looking at the place where the short rough road and the long smooth road divide" },
      { image: "page-05.svg", sound: "wind", text: "I always take the short one, because I am always late. Nora always takes the long one.", alt: "Amal hurrying up the short road while Nora walks the long one" },
      { image: "page-06.svg", sound: "bell", text: "One morning I found out why. A junior student walks that way, and Nora walks beside her.", alt: "Nora walking with a small junior student while a surprised Amal watches" },
      { image: "page-07.svg", sound: "bell", text: "\"Is that not a lot of extra walking?\" I asked. \"It is,\" said Nora. \"But she is small, and the road is busy.\"", alt: "Amal and Nora talking beside a crossing with a bus going past" },
      { image: "page-08.svg", sound: "wind", text: "I thought about that all day. Being clever is not the same thing as being kind.", alt: "Amal alone at her desk in the classroom, thinking" },
      { image: "page-09.svg", sound: "wind", text: "The next morning I was careless and left late again. But this time I took the long road.", alt: "Amal running up the long road with dust behind her" },
      { image: "page-10.svg", sound: "bird", text: "Nora was already there. We walked together, all three of us, and we were not late at all.", alt: "Nora, the junior student and Amal walking the long road together" },
      { image: "page-11.svg", sound: "tree", text: "Later that day, Nora and I sat together under the tall tree. Nothing needed to be said.", alt: "Nora and Amal sitting quietly together under the big schoolyard tree" },
      { image: "page-12.svg", sound: "bird", text: "Kind is not a thing you are. It is a thing you carry, and you can pick it up any morning you like.", alt: "Amal and Nora together at sunset with their arms raised" },
    ],
  },
  {
    id: "from-coast-to-forest",
    title: "From Coast to Forest",
    grades: [3],
    units: [7],
    level: "Level 3",
    description: "One morning, three places: the coast, the forest and the top of the mountain.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "From Coast to Forest is an original Grade 3 story created for Ehel Academy in 2026, book seven of the Amal series, following the class trip described in the Grade 3 Unit 7 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "river", text: "From Coast to Forest. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Teacher Yasmin, Amal and Nora on the shore with shells in the sand" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin planned a trip. \"We will start at the coast,\" she said, \"and finish on the mountain.\"", alt: "Teacher Yasmin at the classroom map and globe, explaining the route" },
      { image: "page-03.svg", sound: "wind", text: "We packed water and hats. The weather can change from morning to night, even when the climate stays the same.", alt: "Amal and Nora getting ready in the schoolyard under a drifting cloud" },
      { image: "page-04.svg", sound: "river", text: "At the beach the sunshine warmed the sand. The sea went out and came back, out and back.", alt: "Amal on the shore with her arms raised and shells scattered in the sand" },
      { image: "page-05.svg", sound: "puddle", text: "Nora had never seen the sea before. \"Have you ever tasted it?\" she asked. She tasted it once, and only once.", alt: "A startled Nora at the water's edge with Amal laughing beside her" },
      { image: "page-06.svg", sound: "river", text: "We found metal bottle tops in the sand and carried them away in a bag.", alt: "Amal pointing out litter on the beach while Nora helps collect it" },
      { image: "page-07.svg", sound: "tree", text: "Then the forest. Under the trees the temperature dropped, and it was suddenly cool and green.", alt: "Teacher Yasmin, Amal and Nora walking a trail between tall forest trees" },
      { image: "page-08.svg", sound: "tree", text: "\"Everything here is matter,\" said Teacher Yasmin. \"And everything here uses energy. Even the trees.\"", alt: "Teacher Yasmin explaining in the forest while a butterfly passes and Amal takes notes" },
      { image: "page-09.svg", sound: "crickets", text: "We have seen a beetle carry a leaf twice its size. We have heard a bird we could not find.", alt: "Nora pointing up into the forest canopy at a bird, with a bee nearby" },
      { image: "page-10.svg", sound: "wind", text: "The trail went up. Higher and higher, until the trees were below us instead of above us.", alt: "The three of them climbing the mountain path with the ridges rising behind" },
      { image: "page-11.svg", sound: "wind", text: "Near the top, the water in our bottles was so cold it almost froze. We could see the whole coast.", alt: "An amazed Amal high on the mountain with a cloud beside her" },
      { image: "page-12.svg", sound: "bird", text: "\"One planet,\" said Teacher Yasmin. \"Coast, forest and mountain, all in one morning.\" I have never forgotten it.", alt: "Teacher Yasmin, Amal and Nora at the top of the mountain in the sunshine" },
    ],
  },
  {
    id: "the-mystery-of-the-million-shells",
    title: "The Mystery of the Million Shells",
    grades: [3],
    units: [8],
    level: "Level 3",
    description: "How many shells are on the beach? Amal finds out without counting a single one.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Mystery of the Million Shells is an original Grade 3 story created for Ehel Academy in 2026, book eight of the Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "river", text: "The Mystery of the Million Shells. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Teacher Yasmin and Amal on a beach covered in shells" },
      { image: "page-02.svg", sound: "river", text: "Teacher Yasmin asked us a question. \"How many shells are on our beach? Give me a number.\"", alt: "Teacher Yasmin on the shore asking the class a question" },
      { image: "page-03.svg", sound: "bell", text: "\"A hundred,\" said Idris. \"A thousand,\" said Nora. \"A million,\" I said, because it was the biggest number I knew.", alt: "Idris, Nora and Amal all guessing at once with their arms in the air" },
      { image: "page-04.svg", sound: "wind", text: "\"Good,\" she said. \"Now prove it.\"", alt: "Teacher Yasmin standing calmly while a surprised Amal looks at her" },
      { image: "page-05.svg", sound: "river", text: "So we measured one square metre of sand with a straight tape, and counted the shells inside it.", alt: "Amal and Nora measuring a square of sand with a metre stick and a ruler" },
      { image: "page-06.svg", sound: "river", text: "There were sixty-four. Sixty-four shells in one single square metre.", alt: "A marked-out square of beach full of shells with Amal writing the number down" },
      { image: "page-07.svg", sound: "river", text: "Then we measured the beach itself: two hundred metres long, and thirty metres wide.", alt: "Nora pointing along the beach beside a long measuring tape" },
      { image: "page-08.svg", sound: "bell", text: "Multiplication is faster than counting. Two hundred times thirty is six thousand square metres.", alt: "Teacher Yasmin working the multiplication on the classroom board" },
      { image: "page-09.svg", sound: "bell", text: "Six thousand times sixty-four. Adam did the addition twice, to check the fact.", alt: "Adam checking his working at a desk while Amal watches" },
      { image: "page-10.svg", sound: "bell", text: "Three hundred and eighty-four thousand. Not a million - but much closer to a million than to a hundred.", alt: "Amal cheering beside a number line on the classroom wall" },
      { image: "page-11.svg", sound: "river", text: "\"You did not count them,\" said Teacher Yasmin. \"You measured. That is what maths is for.\"", alt: "Teacher Yasmin and Amal back on the shell-covered shore" },
      { image: "page-12.svg", sound: "river", text: "I looked at the whole beach and, for the very first time, I could see the size of it.", alt: "Amal alone on the beach looking out over the shells and the sea" },
    ],
  },
  {
    id: "the-box-of-ideas",
    title: "The Box of Ideas",
    grades: [3],
    units: [9],
    level: "Level 3",
    description: "One idea each - a dream, a memory or a hope - and the hardest one to write is Amal's.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Box of Ideas is an original Grade 3 story created for Ehel Academy in 2026, book nine of the Amal series, built on the Box of Ideas described in the Grade 3 Unit 9 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Box of Ideas. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the bright Box of Ideas on a classroom desk with Teacher Yasmin and Amal beside it" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin brought a bright box into class. \"This is our Box of Ideas,\" she said.", alt: "Teacher Yasmin setting the Box of Ideas down in front of the class" },
      { image: "page-03.svg", sound: "bell", text: "\"Every child will add one idea. It can be a dream, a memory, or a hope.\"", alt: "Teacher Yasmin explaining the box while Amal and Nora listen" },
      { image: "page-04.svg", sound: "wind", text: "The whole room went quiet. An idea is easy to have and hard to write down.", alt: "A hushed classroom with Amal looking uncertain at her desk" },
      { image: "page-05.svg", sound: "bell", text: "Nora wrote about a library with no walls at all. That was her dream.", alt: "Nora holding her written idea beside a shelf of books" },
      { image: "page-06.svg", sound: "rain", text: "Idris wrote about the smell of rain on hot ground. That was his memory.", alt: "Idris holding up his idea beside a pinned-up drawing" },
      { image: "page-07.svg", sound: "wind", text: "I could not choose. I had three ideas, and not one of them felt sincere enough.", alt: "Amal alone at her desk with a blank paper, looking sad" },
      { image: "page-08.svg", sound: "lullaby", text: "Sami wrote one line: \"I hope my sister gets well.\" Nobody said anything for a moment.", alt: "A quiet classroom as Sami holds his single line of writing, with Amal listening" },
      { image: "page-09.svg", sound: "bell", text: "Teacher Yasmin said, \"Feelings are not good or bad. Sadness is not a mistake. It is information.\"", alt: "Teacher Yasmin explaining gently to Amal and Nora" },
      { image: "page-10.svg", sound: "bell", text: "So I wrote what I actually felt, which was that I was scared about the contest next week.", alt: "Amal writing her real idea down at her desk" },
      { image: "page-11.svg", sound: "bell", text: "We read them out loud, and nobody laughed. Every single idea was allowed.", alt: "The class reading their ideas aloud around the Box of Ideas" },
      { image: "page-12.svg", sound: "bird", text: "An idea is small until you say it. Then it belongs to everybody, and it is not heavy any more.", alt: "Amal with her arms raised beside the Box of Ideas in the sunlight" },
    ],
  },
  {
    id: "nine-doors",
    title: "Nine Doors",
    grades: [3],
    units: [10],
    level: "Level 3",
    description: "Nine units, nine doors, and everything Amal found behind them in one year.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Nine Doors is an original Grade 3 story created for Ehel Academy in 2026, book ten of the Amal series and the close of the Grade 3 shelf, built on the Year 3 Showcase described in the Grade 3 Unit 10 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Nine Doors. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the Year 3 Showcase with bunting, two easels, and Amal and Nora presenting" },
      { image: "page-02.svg", sound: "bell", text: "It was the last week of Year 3. Teacher Yasmin gave us a project: the Year 3 Showcase.", alt: "Teacher Yasmin presenting the project brief on the classroom wall" },
      { image: "page-03.svg", sound: "bell", text: "\"Nine units,\" she said. \"Nine doors. Choose what you learned behind each one.\"", alt: "Nine numbered coloured doors in rows across the classroom wall" },
      { image: "page-04.svg", sound: "hen", text: "Behind the first door: my family, and the duty I keep at home.", alt: "Amal with her showcase page beside the dining room, with Mina nearby" },
      { image: "page-05.svg", sound: "bell", text: "Behind the second: the spelling contest, and studying a little every day.", alt: "Amal holding a book beside her contest page pinned to the wall" },
      { image: "page-06.svg", sound: "bell", text: "Behind the third: twelve months, and a poem about the hours going by.", alt: "Amal with her poem beside the twelve-month calendar" },
      { image: "page-07.svg", sound: "market", text: "Behind the fourth: the market, the hospital, and the sailor down at the coast.", alt: "Omar at his market stall with the hospital behind and Amal holding her page" },
      { image: "page-08.svg", sound: "bird", text: "Behind the fifth: a wall we built together, and the garden it keeps safe.", alt: "Amal cheering beside the finished garden wall and the planted garden" },
      { image: "page-09.svg", sound: "wind", text: "Behind the sixth: the long road to school, and my friend Nora walking it.", alt: "Nora and Amal on the long road to school" },
      { image: "page-10.svg", sound: "wind", text: "Behind the seventh: coast, forest and mountain, all in one single morning.", alt: "Amal and Nora high on the mountain trail" },
      { image: "page-11.svg", sound: "river", text: "Behind the eighth: a beach I measured instead of counting.", alt: "Amal holding a shell on the measured beach with a metre stick beside her" },
      { image: "page-12.svg", sound: "bell", text: "Behind the ninth: a box of ideas. On Showcase Day I read mine out loud, and my voice did not shake.", alt: "Showcase Day with bunting and confetti, Amal reading aloud while Teacher Yasmin and Nora cheer" },
    ],
  },


  // ------------------------------------------------- Grade 3, books 2, 3 and 4
  // Every Grade 3 unit now carries four books instead of one. The first is built
  // from the unit's Story; these three take the unit's other four texts — the
  // Readings, the poem or song, and the two Listening dialogues — so a shelf of
  // 40 books came out of material the units already teach rather than out of a
  // new invention per slot. Each entry's attribution names the text it retells.
  //
  // The cast grows with them: Sami, Leo, Maya, Theo and Daniel are the classmates
  // the readings name (137, 55, 47, 24 and 23 times), and Nadia the bus driver,
  // Doctor Sarah and Officer Rami are the three adults the Unit 4 trip meets.
  // Illustrations: tools/create-grade3-ebook-illustrations-2.js, -3.js and -4.js.
  {
    id: "junior",
    title: "Junior",
    grades: [3],
    units: [1],
    level: "Level 3",
    description: "Amal is the youngest in the drama club, and everybody calls her Junior. Then the play begins.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Junior is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 1, and it retells the drama club of the unit's story \"Amal's Big Day\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Junior. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the drama club on the school stage, with Amal in the middle and Teacher Yasmin beside them" },
      { image: "page-02.svg", sound: "bell", text: "Everybody in the drama club calls me Junior, because I am the youngest one there.", alt: "Leo, Daniel and Nora standing in the classroom with a much smaller Amal beside them" },
      { image: "page-03.svg", sound: "bell", text: "My brother Adam joined first. The senior students still say his name with respect.", alt: "Adam holding a book while Theo listens and Amal watches him from across the room" },
      { image: "page-04.svg", sound: "bell", text: "This term our play is about health and safety at school. Teacher Yasmin gave out the parts.", alt: "Teacher Yasmin pointing at a poster while Amal holds her page and Nora listens" },
      { image: "page-05.svg", sound: "bell", text: "Nora is playing the senior student. My duty is to teach her how to behave in public.", alt: "Amal pointing something out to Nora on the school stage" },
      { image: "page-06.svg", sound: "bell", text: "I made my hat myself, out of an old newspaper. Mum pressed my yellow vest twice.", alt: "Amal holding her paper costume while Mum stands beside her at home" },
      { image: "page-07.svg", sound: "chick", text: "I practised in front of Mina. She clapped in all the wrong places, every single time.", alt: "Amal acting in the front room while little Mina claps and Grandma Hana watches" },
      { image: "page-08.svg", sound: "wind", text: "On the morning of the play, my hands would not keep still.", alt: "Amal alone at her desk in the classroom, looking startled" },
      { image: "page-09.svg", sound: "bell", text: "Teacher Yasmin clapped once. The room went quiet, and I stepped forward with my chin up.", alt: "Teacher Yasmin with her arms raised while Amal steps forward on the stage" },
      { image: "page-10.svg", sound: "bell", text: "\"Sit down, eat nicely, and speak softly,\" I said. \"That is how we behave in a public place.\"", alt: "Amal pointing while Nora looks surprised in their play on the stage" },
      { image: "page-11.svg", sound: "bird", text: "Afterwards a junior student dropped her bag, and I helped her pick up every pencil.", alt: "Amal helping a small junior student gather her spilled books in the schoolyard" },
      { image: "page-12.svg", sound: "bell", text: "I am still the youngest in the club. But Junior does not sound small to me any more.", alt: "Amal and Nora outside at sunset with the house behind them" },
    ],
  },
  {
    id: "the-interview",
    title: "The Interview",
    grades: [3],
    units: [1],
    level: "Level 3",
    description: "The class sets up an interview corner, and Amal has to say out loud who her role models are.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Interview is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 1, and it retells the listening text \"Amal Talks About Her Family\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Interview. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal at a microphone in the classroom with Maya interviewing her" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin made an interview corner: one chair, one microphone, and one question at a time.", alt: "Teacher Yasmin pointing out the microphone and chair to Amal" },
      { image: "page-03.svg", sound: "bell", text: "\"Hello, Amal. Can you tell us a little about yourself?\" My mouth went completely dry.", alt: "Amal looking startled at the microphone while Maya asks her a question" },
      { image: "page-04.svg", sound: "bell", text: "\"My name is Amal, and I am a student at Ehel Academy.\" For a moment that was all I had.", alt: "Amal standing alone at the microphone in the quiet classroom" },
      { image: "page-05.svg", sound: "bell", text: "\"Who do you live with at home?\" asked Maya. That question was easier.", alt: "Maya pointing her question at Amal beside the microphone" },
      { image: "page-06.svg", sound: "bell", text: "My parents, my two brothers, my little sister, and my grandmother. All of us, in one house.", alt: "The whole family lined up at home: Grandma Hana, Dad, Mum, Adam, Idris and Mina" },
      { image: "page-07.svg", sound: "bird", text: "\"Our house is small,\" I said, \"but it is always full of noise and laughter.\"", alt: "Amal and Mina outside their small house with their arms raised" },
      { image: "page-08.svg", sound: "bell", text: "Then she asked, \"Who are your role models?\" and I did not know what to answer.", alt: "Amal looking startled at the microphone with a thought bubble above her" },
      { image: "page-09.svg", sound: "hen", text: "So I said what my mother actually does. She is patient with everybody, even at the end of the day.", alt: "Mum in the kitchen at home with little Mina beside her" },
      { image: "page-10.svg", sound: "bell", text: "And what my father actually does. He listens carefully before he speaks, every time.", alt: "Dad listening at the dining table while Idris talks" },
      { image: "page-11.svg", sound: "bell", text: "\"What is your duty at home?\" \"To honour them,\" I said, \"and to be a good student.\"", alt: "Amal answering at the microphone beside a poster on the classroom wall" },
      { image: "page-12.svg", sound: "bell", text: "\"Thank you for talking with us, Amal.\" \"Thank you,\" I said, \"for listening to my story.\"", alt: "Confetti in the classroom with Amal and Maya cheering and Teacher Yasmin looking on" },
    ],
  },
  {
    id: "minas-two-voices",
    title: "Mina's Two Voices",
    grades: [3],
    units: [1],
    level: "Level 3",
    description: "Mina wants to know why she can shout at home but not at the market. Then the market gives her a reason to shout.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Mina's Two Voices is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 1, and it retells the listening text \"Public and Private\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Mina's Two Voices. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and little Mina at the market gate" },
      { image: "page-02.svg", sound: "bell", text: "\"Amal, why can I shout at home, but you tell me to be quiet at the market?\"", alt: "Mina asking Amal a question in the front room at home" },
      { image: "page-03.svg", sound: "ball", text: "\"At home, in private, you can play and be as loud as you like.\"", alt: "Mina and Idris playing loudly at home with a ball" },
      { image: "page-04.svg", sound: "bell", text: "\"Nobody minds if we laugh, or bang a toy drum, in our own house.\"", alt: "Mina and Amal celebrating noisily at home" },
      { image: "page-05.svg", sound: "market", text: "\"But outside, in public, we stay calm and we speak softly.\"", alt: "Amal explaining to Mina in the street beside a market stall" },
      { image: "page-06.svg", sound: "market", text: "\"Other people near you are shopping, or working, or resting.\"", alt: "Omar at his market stall and Grandma Hana resting on a bench nearby" },
      { image: "page-07.svg", sound: "bell", text: "\"So it is like taking turns with noise?\" said Mina. \"Exactly,\" I said.", alt: "Mina and Amal talking in the street with a thought bubble above them" },
      { image: "page-08.svg", sound: "market", text: "The next morning we went to the market, and Mina held my hand the whole way.", alt: "Amal and Mina walking to the market gate together" },
      { image: "page-09.svg", sound: "market", text: "She used her small voice at the fruit stall, and Omar smiled at her.", alt: "Mina speaking quietly to Omar at his fruit stall" },
      { image: "page-10.svg", sound: "market", text: "Then a little boy started to cry. He was lost between the baskets.", alt: "A small boy crying between two market baskets while Mina notices him" },
      { image: "page-11.svg", sound: "market", text: "Mina used her big voice. \"IS ANYBODY LOOKING FOR THIS BOY?\" And somebody was.", alt: "Mina calling out loudly at the market while a mother hurries over to the boy" },
      { image: "page-12.svg", sound: "bell", text: "A quiet voice and a loud voice are both good voices. It depends who else is there.", alt: "Amal and Mina walking home at sunset" },
    ],
  },
  {
    id: "a-normal-day-at-school",
    title: "A Normal Day at School",
    grades: [3],
    units: [2],
    level: "Level 3",
    description: "Adam walks you through one ordinary school day, from the packed bag to the last page of homework.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "A Normal Day at School is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 2, and it retells the reading \"A Day at School\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "A Normal Day at School. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Adam with his book at the school gate, with Idris beside him" },
      { image: "page-02.svg", sound: "bell", text: "Every morning my mother helps me pack my bag: my books, my pencils, and my eraser.", alt: "Mum and Adam packing his school bag at home" },
      { image: "page-03.svg", sound: "bell", text: "First we have mathematics. I like working with numbers and with shapes.", alt: "Teacher Yasmin at a board of sums while Adam and Daniel work at their desks" },
      { image: "page-04.svg", sound: "bell", text: "But grammar is my favourite subject, because it helps me write well and speak clearly.", alt: "Adam holding his page beside a grammar poster with Nora next to him" },
      { image: "page-05.svg", sound: "bell", text: "Teacher Yasmin explains every lesson slowly, so that nobody in the room feels lost.", alt: "Teacher Yasmin explaining to Amal and Theo in the classroom" },
      { image: "page-06.svg", sound: "bell", text: "Today she read us a story by a famous author, and everybody asked good questions about it.", alt: "Teacher Yasmin reading aloud from a book while Adam, Maya and Nora listen" },
      { image: "page-07.svg", sound: "bell", text: "At break I go to the library, because it is quiet in there.", alt: "Adam holding a book between two library shelves" },
      { image: "page-08.svg", sound: "bell", text: "I can choose any book I like. That is the best part of the whole day.", alt: "Adam cheering in the library while Maya chooses a book beside him" },
      { image: "page-09.svg", sound: "bell", text: "Later our class talked about a contest coming next month.", alt: "Teacher Yasmin pointing at a calendar in the classroom with Adam listening" },
      { image: "page-10.svg", sound: "bell", text: "Everyone began to prepare a topic, with plenty of details.", alt: "Adam and Theo working on their notes at a classroom desk" },
      { image: "page-11.svg", sound: "lullaby", text: "At home my parents remind me to study every night, and my mother sits with me.", alt: "Adam studying with Mum in the lamplit front room at night" },
      { image: "page-12.svg", sound: "bell", text: "One day I want to graduate and be a teacher too, so that I can help other children learn.", alt: "Adam with his arms raised in the classroom beside Teacher Yasmin" },
    ],
  },
  {
    id: "the-grammar-champions",
    title: "The Grammar Champions",
    grades: [3],
    units: [2],
    level: "Level 3",
    description: "Three friends, one grammar contest, and three small words: in, on and under.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Grammar Champions is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 2, and it retells the unit's story of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Grammar Champions. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Daniel, Amal and Nora under bunting in the classroom" },
      { image: "page-02.svg", sound: "bell", text: "\"Next Friday,\" said Teacher Yasmin, \"we will have a grammar contest.\" The whole class cheered.", alt: "Teacher Yasmin pointing at a calendar while Amal listens" },
      { image: "page-03.svg", sound: "bell", text: "I worked with Daniel and Nora. Our group was called The Grammar Champions.", alt: "Amal, Daniel and Nora cheering in front of their group poster" },
      { image: "page-04.svg", sound: "bell", text: "We needed a topic. \"Prepositions,\" I said. \"We can show how to use in, on and under.\"", alt: "Amal pointing at an open book on a desk while Daniel listens" },
      { image: "page-05.svg", sound: "bell", text: "\"I like it,\" said Daniel. \"It is simple, but it is important.\"", alt: "Daniel explaining beside a strip of shapes while Nora listens" },
      { image: "page-06.svg", sound: "bell", text: "We met in the library to study together and to write our report.", alt: "Amal and Nora working between the library shelves" },
      { image: "page-07.svg", sound: "bell", text: "Nora found an author who explains grammar with cartoons. \"He is funny,\" she said.", alt: "Nora cheering beside a big open book in the library" },
      { image: "page-08.svg", sound: "bell", text: "Daniel brought a notebook full of details from his sister, who has already graduated.", alt: "Daniel showing his notes to Amal beside a notepad in the library" },
      { image: "page-09.svg", sound: "bell", text: "We practised our lesson, checked every spelling twice, and collected our supplies.", alt: "Amal, Nora and Daniel preparing at their classroom desks" },
      { image: "page-10.svg", sound: "bell", text: "On the day, the classroom had bright decorations and rows of chairs for the visitors.", alt: "The decorated classroom with bunting and benches and Teacher Yasmin waiting" },
      { image: "page-11.svg", sound: "bell", text: "\"The pen is ON the desk,\" I said. \"The bag is UNDER the table.\" Daniel drew a funny cartoon.", alt: "Amal pointing at a desk with an open book on it while Daniel cheers" },
      { image: "page-12.svg", sound: "bell", text: "\"The winners are - The Grammar Champions!\" We won because our lesson was clear.", alt: "Confetti in the classroom with Teacher Yasmin, Amal, Nora and Daniel all cheering" },
    ],
  },
  {
    id: "the-quietest-room",
    title: "The Quietest Room",
    grades: [3],
    units: [2],
    level: "Level 3",
    description: "Everyone in the class has a book and a topic. Amal has neither, until she says something out loud.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Quietest Room is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 2, and it retells the listening dialogue \"In the Classroom\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Quietest Room. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding a book between the tall library shelves" },
      { image: "page-02.svg", sound: "bell", text: "\"Today's lesson is about authors,\" said Teacher Yasmin. \"Did everybody bring a book?\"", alt: "Teacher Yasmin asking the class while Maya holds up her book and Daniel listens" },
      { image: "page-03.svg", sound: "bell", text: "Maya brought her book and her eraser too, in case her notes needed fixing.", alt: "Maya at her desk with a book open in front of her" },
      { image: "page-04.svg", sound: "bell", text: "She had read a story about a clever camel. \"The author is very funny,\" she said.", alt: "Maya cheering with a thought bubble showing an open book" },
      { image: "page-05.svg", sound: "bell", text: "Daniel's book came from the library. It was about a girl who wanted to be a scientist.", alt: "Daniel holding his book beside a globe in the classroom" },
      { image: "page-06.svg", sound: "bell", text: "\"Reading at home is a good way to prepare for our lessons,\" said Teacher Yasmin.", alt: "Teacher Yasmin beside a poster with Nora listening" },
      { image: "page-07.svg", sound: "bell", text: "\"Choose a topic,\" she said, \"and put in plenty of details, just as a real author would.\"", alt: "Teacher Yasmin pointing while Amal holds her page beside a notepad" },
      { image: "page-08.svg", sound: "wind", text: "But I could not choose. Every book on the shelf was somebody else's idea.", alt: "Amal looking downcast in front of a full library shelf" },
      { image: "page-09.svg", sound: "bell", text: "\"Can we talk about our books with a friend first?\" asked Maya. \"Of course,\" said Teacher Yasmin.", alt: "Maya asking a question in the library while Teacher Yasmin answers" },
      { image: "page-10.svg", sound: "bell", text: "So I told Nora about the teacher in my book, the one who helps children learn to read.", alt: "Amal telling Nora about her book between the library shelves" },
      { image: "page-11.svg", sound: "bell", text: "And that was my topic. It had been my topic all along. I had just not said it out loud.", alt: "Amal writing on her page beside a notepad in the library" },
      { image: "page-12.svg", sound: "bell", text: "The library is the quietest room in our school. It is where I found the loudest idea I had.", alt: "Amal cheering between the library shelves" },
    ],
  },
  {
    id: "six-oclock-seven-oclock",
    title: "Six O'Clock, Seven O'Clock",
    grades: [3],
    units: [3],
    level: "Level 3",
    description: "Idris walks through one day of his own, hour by hour, from six in the morning to the lamp at night.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Six O'Clock, Seven O'Clock is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 3, and it retells the reading \"My Day, Hour by Hour\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Six O'Clock, Seven O'Clock. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Idris at home with a clock on the wall showing six o'clock" },
      { image: "page-02.svg", sound: "bell", text: "At six o'clock I wake up. The rest of the house is not fully awake yet.", alt: "Idris standing in his room at six o'clock with the bed behind him" },
      { image: "page-03.svg", sound: "bell", text: "I stretch, I wash my face, and I make my bed before anybody asks me to.", alt: "Idris beside the washroom at home with the cleaning things nearby" },
      { image: "page-04.svg", sound: "hen", text: "At seven we eat breakfast together: warm bread, tea, and everybody talking at once.", alt: "Mum, Idris and Mina at the breakfast table with a clock showing seven" },
      { image: "page-05.svg", sound: "bird", text: "At eight I walk to school with my neighbour Sami, and we talk about the months as we go.", alt: "Idris and Sami walking past the town clock tower on their way to school" },
      { image: "page-06.svg", sound: "bell", text: "We study for many hours: reading, writing, and sometimes drawing maps of faraway places.", alt: "Teacher Yasmin at a map in the classroom while Idris and Sami work" },
      { image: "page-07.svg", sound: "bird", text: "At one o'clock we eat lunch in the playground, under the big tree.", alt: "Idris and Sami eating lunch under the acacia tree beside a bench" },
      { image: "page-08.svg", sound: "bird", text: "At four I go home and help: sweeping the yard, or carrying water from the tap.", alt: "Idris sweeping outside the house with a water bottle beside him" },
      { image: "page-09.svg", sound: "lullaby", text: "In the evening I read by the lamp, and I like the quiet after such a busy day.", alt: "Idris reading a book in the lamplit room at night" },
      { image: "page-10.svg", sound: "ball", text: "Some days are different. Sometimes there is extra homework, and sometimes there is football.", alt: "Idris and Theo playing football in the schoolyard" },
      { image: "page-11.svg", sound: "bell", text: "Grandma Hana says a day fits, if you put the things in it in order.", alt: "Grandma Hana talking to Idris at home beside a clock showing four" },
      { image: "page-12.svg", sound: "bell", text: "And tomorrow it all begins again at six o'clock.", alt: "Idris in his room again with the clock showing six o'clock" },
    ],
  },
  {
    id: "twelve-months-of-work",
    title: "Twelve Months of Work",
    grades: [3],
    units: [3],
    level: "Level 3",
    description: "Twelve months, and the work each one brings - to a school, to a family, and to a farm.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Twelve Months of Work is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 3, and it retells the reading \"The Twelve Months\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Twelve Months of Work. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal beside the twelve months of the calendar on the classroom wall" },
      { image: "page-02.svg", sound: "bell", text: "A year has twelve months. The first one is January, and the last one is December.", alt: "Teacher Yasmin pointing at January on the wall of twelve months" },
      { image: "page-03.svg", sound: "sun", text: "Some months are hot and dry. The sun is strong, and the fields turn golden.", alt: "Amal in the hot sun beside a stand of dry golden grass and an acacia tree" },
      { image: "page-04.svg", sound: "wind", text: "Some months are cool, and a light jacket feels just right in the morning.", alt: "Amal and Idris outside under grey clouds" },
      { image: "page-05.svg", sound: "rain", text: "Some months bring rain that fills the rivers and helps the crops to grow.", alt: "Amal in the rain with a puddle beside her on the street" },
      { image: "page-06.svg", sound: "bell", text: "Our school year begins in January and it ends in November.", alt: "Nora beside the calendar wall with November ringed" },
      { image: "page-07.svg", sound: "river", text: "So the long holiday falls in December, right before the new year begins again.", alt: "Amal and Mina cheering on the beach beside a scatter of shells" },
      { image: "page-08.svg", sound: "bell", text: "Teachers plan by the months too: a spelling test in one, a trip in another, sports day in the best weather.", alt: "Teacher Yasmin pointing at a calendar board while Theo listens" },
      { image: "page-09.svg", sound: "bell", text: "Families mark the calendar for birthdays, weddings and holidays.", alt: "Mum and Amal at a calendar board at home" },
      { image: "page-10.svg", sound: "bird", text: "Farmers mark it more carefully still: the day to plant the seeds, and the day to pick the crops.", alt: "Dad pointing along the planted rows in the garden with a watering can nearby" },
      { image: "page-11.svg", sound: "lullaby", text: "Grandma Hana remembers which month brought the biggest harvest, and which brought the coldest night.", alt: "Grandma Hana and Amal in the evening room beside a basket of grain" },
      { image: "page-12.svg", sound: "bell", text: "Learning the twelve months in order helps me plan ahead, and remember back.", alt: "Amal with her page beside the wall of twelve months" },
    ],
  },
  {
    id: "samis-calendar",
    title: "Sami's Calendar",
    grades: [3],
    units: [3],
    level: "Level 3",
    description: "Amal shows Sami how to make a calendar. His twelve months turn out to hold completely different things.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Sami's Calendar is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 3, and it retells the listening text \"Making a Calendar\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Sami's Calendar. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding her calendar page across the classroom from Sami" },
      { image: "page-02.svg", sound: "bell", text: "\"Look at my calendar,\" I said. \"I made it for the whole year, and I coloured every month.\"", alt: "Amal pointing at a calendar board while Sami looks at it" },
      { image: "page-03.svg", sound: "ball", text: "\"In June we have the school games, so I drew a little football next to that month.\"", alt: "Amal cheering in the schoolyard beside a football" },
      { image: "page-04.svg", sound: "bird", text: "\"In August we visit my grandmother, so I drew a small house with a heart on it.\"", alt: "Grandma Hana outside her house with Amal cheering nearby" },
      { image: "page-05.svg", sound: "bird", text: "\"And in October we pick mangoes, so I drew a whole basket of them.\"", alt: "Amal in the garden under a mango tree with a full basket beside her" },
      { image: "page-06.svg", sound: "bell", text: "\"Can I make a calendar too?\" asked Sami.", alt: "Sami cheering at his desk with a notepad on it" },
      { image: "page-07.svg", sound: "bell", text: "\"Of course. First write the months in order. Then think about what happens in each one.\"", alt: "Amal pointing at January on the wall of twelve months" },
      { image: "page-08.svg", sound: "river", text: "But Sami's June was not my June. In his June, his grandfather takes him out in the boat.", alt: "Sami cheering on the shore with a sailing boat out on the water" },
      { image: "page-09.svg", sound: "bell", text: "And his August was not my August. In his August, his baby cousin was born.", alt: "Sami at home with a small child beside him" },
      { image: "page-10.svg", sound: "river", text: "His December had a fishing net drawn right across the page.", alt: "Sami holding his calendar page on the shore beside a scatter of shells" },
      { image: "page-11.svg", sound: "bell", text: "Twelve months, the very same twelve, and two completely different years.", alt: "Amal and Sami standing either side of the wall of twelve months" },
      { image: "page-12.svg", sound: "bell", text: "So we hung both calendars on the wall, side by side.", alt: "Amal and Sami cheering beside their two calendar boards" },
    ],
  },
  {
    id: "the-bus-to-the-county",
    title: "The Bus to the County",
    grades: [3],
    units: [4],
    level: "Level 3",
    description: "One school bus, one morning, and every place in the county that does a job for somebody.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Bus to the County is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 4, and it retells the unit's story \"From Our Village to the County\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings, including Nadia the driver, Doctor Sarah and Officer Rami. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "The Bus to the County. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nadia the driver waving the class aboard the school bus" },
      { image: "page-02.svg", sound: "bird", text: "\"Look out of the window,\" said Teacher Yasmin. \"What can you see?\"", alt: "Teacher Yasmin pointing out of the bus window at a market stall and a garden while Nora looks" },
      { image: "page-03.svg", sound: "bell", text: "Our first stop was the hospital, and a kind doctor met us at the door.", alt: "Doctor Sarah outside the county hospital with Amal cheering beside her" },
      { image: "page-04.svg", sound: "bell", text: "\"Doctor Sarah works here,\" said the nurse. \"She helps people who are sick or hurt.\"", alt: "Doctor Sarah explaining her work to Amal and Nora inside the hospital" },
      { image: "page-05.svg", sound: "bell", text: "\"Exit the hospital quietly,\" said Teacher Yasmin. \"People here are resting.\"", alt: "Teacher Yasmin, Sami and Amal walking quietly past an exit sign" },
      { image: "page-06.svg", sound: "bell", text: "Next was the court. \"This is where problems are solved fairly,\" said Officer Rami.", alt: "Officer Rami pointing out the county court to Nora" },
      { image: "page-07.svg", sound: "bell", text: "\"Sit quietly on the wooden benches. Can you see the big chair? That is where the judge sits.\"", alt: "Officer Rami and Amal inside the court with rows of benches" },
      { image: "page-08.svg", sound: "market", text: "Then the market, where Omar called out beside his baskets of bananas, maize and rice.", alt: "Omar calling out at his market stall while Amal and Sami look at the baskets" },
      { image: "page-09.svg", sound: "bird", text: "We bought sweet mangoes and ate them sitting beside a small garden.", alt: "Amal and Nora in the garden beside a mango tree" },
      { image: "page-10.svg", sound: "bell", text: "At the college gate my brother Adam met us. \"I study health and safety here,\" he said.", alt: "Adam holding a book outside the college with Amal cheering beside him" },
      { image: "page-11.svg", sound: "wind", text: "On the way back I saw a sign. \"That is the border,\" said Teacher Yasmin. \"One county ends, and another begins.\"", alt: "Teacher Yasmin pointing at a border sign on the road with Amal beside her" },
      { image: "page-12.svg", sound: "bell", text: "Back at school we wrote it all down. Our village is small. The county is big. Both of them are ours.", alt: "Amal writing at her classroom desk beside a map on the wall" },
    ],
  },
  {
    id: "places-i-know",
    title: "Places I Know",
    grades: [3],
    units: [4],
    level: "Level 3",
    description: "The class poem, one line at a time - and then Amal's own list of the places that know her.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Places I Know is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 4. The four quoted lines are the unit's own poem \"Places I Know\"; the rest of the book is original. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "goat", text: "Places I Know. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal in the village with a goat and a hut behind her" },
      { image: "page-02.svg", sound: "bird", text: "\"In my village the days are slow,\"", alt: "Amal standing in the quiet village beside a hut and a bench" },
      { image: "page-03.svg", sound: "goat", text: "\"Past the garden the goats all go.\"", alt: "Two goats walking past the garden fence while Amal points at them" },
      { image: "page-04.svg", sound: "market", text: "\"The market is busy,\"", alt: "Omar calling out at his busy market stall while Amal carries a basket" },
      { image: "page-05.svg", sound: "bell", text: "\"the court is grand,\"", alt: "Amal and Nora looking up at the white county court" },
      { image: "page-06.svg", sound: "wind", text: "\"So many places across our land!\"", alt: "Teacher Yasmin pointing at a big map with Amal beside her" },
      { image: "page-07.svg", sound: "bell", text: "Then I made my own list. The hospital, where Doctor Sarah works all day and half the night.", alt: "Doctor Sarah outside the county hospital with Amal beside her" },
      { image: "page-08.svg", sound: "bell", text: "The college, where my brother Adam will study when he is older.", alt: "Adam holding a book outside the college gate" },
      { image: "page-09.svg", sound: "bird", text: "The crossing, where the officer stops the whole road so that we can walk across it.", alt: "Officer Rami holding the traffic at the crossing while Mina walks over" },
      { image: "page-10.svg", sound: "bell", text: "The library, which has the quietest door in the whole county.", alt: "Amal with a book outside the town library" },
      { image: "page-11.svg", sound: "bird", text: "And our own address, which I learned by heart in case I am ever lost.", alt: "Amal holding her page outside her house beside a village sign" },
      { image: "page-12.svg", sound: "bird", text: "Under the poem I wrote one more line: and every one of them knows my name.", alt: "Amal and Nora outside at sunset with a hut behind them" },
    ],
  },
  {
    id: "friday-at-the-market",
    title: "Friday at the Market",
    grades: [3],
    units: [4],
    level: "Level 3",
    description: "Sami has never been to the Friday market. Amal tells him what to expect, and then brings him.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Friday at the Market is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 4, and it retells the listening text \"At the Market\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Friday at the Market. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Mum, Amal and Sami at the market gate at eight o'clock" },
      { image: "page-02.svg", sound: "bird", text: "\"Where are we going this morning?\" \"To the market. On Friday my mother always goes.\"", alt: "Sami asking Amal a question as they walk down the street" },
      { image: "page-03.svg", sound: "market", text: "\"Is the market busy on Fridays?\" \"Very busy. Look at all the people between the stalls.\"", alt: "The busy market with Omar at his stall and Nora, Theo and Amal among the crowd" },
      { image: "page-04.svg", sound: "market", text: "\"What do you usually buy?\" \"Bananas and rice. Tomatoes and mangoes too, if they look fresh.\"", alt: "Mum and Amal at the market stall beside a basket of grain" },
      { image: "page-05.svg", sound: "market", text: "\"I like markets,\" said Sami, \"because they are noisy and full of life.\"", alt: "Sami cheering in the middle of the busy market" },
      { image: "page-06.svg", sound: "market", text: "\"I like the colours,\" I said. \"Yellow bananas, red tomatoes, green vegetables everywhere.\"", alt: "Amal with her arms raised between two full market baskets" },
      { image: "page-07.svg", sound: "market", text: "\"Do you ever get lost in such a big crowd?\" he asked.", alt: "Sami looking worried between two market stalls with Amal beside him" },
      { image: "page-08.svg", sound: "market", text: "\"Not really. I hold my mother's hand, and I stay close beside her.\"", alt: "Mum and Amal side by side at the market" },
      { image: "page-09.svg", sound: "bell", text: "\"Meet us by the gate at eight o'clock,\" I said, \"and bring a basket for the rice.\"", alt: "Amal pointing at the market gate sign beside a clock showing eight" },
      { image: "page-10.svg", sound: "market", text: "So the next Friday Sami came with the biggest basket in his house.", alt: "Sami cheering beside an enormous empty basket" },
      { image: "page-11.svg", sound: "market", text: "We filled it. Then we could hardly carry it, and we laughed the whole way home.", alt: "Sami and Amal cheering over a full basket set down between them at the market" },
      { image: "page-12.svg", sound: "bird", text: "A market is a crowd if you have no plan. With a plan, it is just a Friday morning.", alt: "Mum, Amal and Sami walking home at sunset past a market stall" },
    ],
  },
  {
    id: "helping-hands",
    title: "Helping Hands",
    grades: [3],
    units: [5],
    level: "Level 3",
    description: "Nora sees Omar struggling with a basket that is too heavy for one person, and stops.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Helping Hands is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 5, and it retells the reading of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Helping Hands. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nora and Omar with the basket between them outside his shop" },
      { image: "page-02.svg", sound: "bird", text: "One afternoon I was walking home from school, the same way I always walk.", alt: "Nora walking home along the street with a book under her arm" },
      { image: "page-03.svg", sound: "market", text: "Omar was outside his shop with a basket full of fruit and vegetables.", alt: "Omar looking startled beside a heavy basket outside his stall" },
      { image: "page-04.svg", sound: "market", text: "It looked much too heavy for one person. I stopped and watched him for a moment.", alt: "Nora watching Omar struggle with the basket from across the street" },
      { image: "page-05.svg", sound: "bell", text: "Then I remembered what Teacher Yasmin says about being kind to your neighbours.", alt: "Nora in the street with a thought bubble showing Teacher Yasmin" },
      { image: "page-06.svg", sound: "market", text: "\"Can I offer some help?\" I asked. Omar looked surprised, and grateful.", alt: "Nora offering to help Omar beside the heavy basket" },
      { image: "page-07.svg", sound: "market", text: "\"That would be wonderful,\" he said. \"This basket is heavier than I expected today.\"", alt: "Nora and Omar lifting the basket together" },
      { image: "page-08.svg", sound: "market", text: "We lifted it together, and took small steps, so that nothing would fall out.", alt: "Nora and Omar carrying the basket carefully along the street" },
      { image: "page-09.svg", sound: "market", text: "At the door he set it down and wiped his forehead.", alt: "Omar setting the basket down outside his shop with Nora beside him" },
      { image: "page-10.svg", sound: "market", text: "\"Thank you,\" he said. \"You have a kind heart.\"", alt: "Omar and Nora cheering outside the shop with confetti in the air" },
      { image: "page-11.svg", sound: "bird", text: "The feeling stayed with me the whole way home, and all evening as well.", alt: "Nora walking home at sunset past her house" },
      { image: "page-12.svg", sound: "bird", text: "Now I look for small ways to help, every single day. There are more of them than I thought.", alt: "Nora helping Mina and Grandma Hana in the schoolyard" },
    ],
  },
  {
    id: "first-the-seeds",
    title: "First the Seeds",
    grades: [3],
    units: [5],
    level: "Level 3",
    description: "Amal and Leo write a plan for a garden in four steps, and then have to do all four.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "First the Seeds is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 5, and it retells the listening text \"Planning the Garden\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "First the Seeds. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding a plan beside Leo in the empty garden" },
      { image: "page-02.svg", sound: "bird", text: "\"Let's make a plan for our new garden,\" I said. \"What should we do first?\"", alt: "Amal and Leo talking beside a notepad in the garden" },
      { image: "page-03.svg", sound: "market", text: "\"First, we will search for good seeds,\" said Leo. So we went to see Omar.", alt: "Leo pointing at seeds at Omar's market stall" },
      { image: "page-04.svg", sound: "bird", text: "\"We want strong seeds,\" he said, \"that will grow into healthy plants.\"", alt: "Amal holding seeds in the garden beside an empty row" },
      { image: "page-05.svg", sound: "bird", text: "\"Then we build a small fence, to protect the young leaves.\"", alt: "Leo and Amal building a fence around the garden bed" },
      { image: "page-06.svg", sound: "goat", text: "A goat came to test the fence on the very first evening. The fence held.", alt: "A goat at the garden fence at sunset while Amal looks surprised" },
      { image: "page-07.svg", sound: "river", text: "\"After that, we water the garden every day, even when it does not rain.\"", alt: "Amal watering the planted rows in the garden" },
      { image: "page-08.svg", sound: "wind", text: "Some mornings I did not want to. I went anyway, because the plan said every day.", alt: "Amal looking tired beside the watering can in the garden" },
      { image: "page-09.svg", sound: "wind", text: "Two whole weeks, and nothing. \"The plan did not say hurry,\" said Leo.", alt: "Leo pointing at the empty seed rows while Amal looks downcast" },
      { image: "page-10.svg", sound: "bird", text: "Then one green leaf. Then four.", alt: "Amal cheering beside two small green sprouts in the garden" },
      { image: "page-11.svg", sound: "bird", text: "\"Finally, we celebrate when the first flower grows,\" said Leo. And it did.", alt: "Amal and Leo cheering beside a flowering plant with confetti in the air" },
      { image: "page-12.svg", sound: "bird", text: "First the seeds, then the fence, then the water, and then this. We remembered every step.", alt: "Amal, Nora and Teacher Yasmin in the finished garden beside the fence" },
    ],
  },
  {
    id: "the-night-the-wall-shook",
    title: "The Night the Wall Shook",
    grades: [3],
    units: [5],
    level: "Level 3",
    description: "The wind came, the reading wall shook, and two boys held the frame. The next day they did the part they had missed.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Night the Wall Shook is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 5, and it retells the listening recount \"What Happened?\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "The Night the Wall Shook. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the school reading wall under a dark, windy sky with Sami beside it" },
      { image: "page-02.svg", sound: "bell", text: "\"Let me tell you what happened yesterday,\" said Sami.", alt: "Sami telling the story to Nora in the classroom" },
      { image: "page-03.svg", sound: "wind", text: "\"The wind blew very hard, and the wall began to shake because of it.\"", alt: "The garden wall shaking in the wind while Sami looks alarmed" },
      { image: "page-04.svg", sound: "wind", text: "\"I was standing near the garden when I first heard the creaking sound.\"", alt: "Sami standing in the dark garden beside the plants" },
      { image: "page-05.svg", sound: "wind", text: "\"What did you do?\" \"We ran to hold the frame.\"", alt: "Sami and Leo running to the shaking wall" },
      { image: "page-06.svg", sound: "wind", text: "\"Leo grabbed one side, and I grabbed the other.\"", alt: "Leo and Sami holding the wall from either side in the wind" },
      { image: "page-07.svg", sound: "wind", text: "\"We held on tightly until the wind slowed down again.\"", alt: "Sami holding the wall as the wind eases" },
      { image: "page-08.svg", sound: "bird", text: "\"Did the wall fall down?\" \"No. But we did not complete the support in time.\"", alt: "Sami looking downcast beside the wall in daylight with a flat stone nearby" },
      { image: "page-09.svg", sound: "bird", text: "\"The wooden frame still needs more stones underneath it.\"", alt: "Leo pointing at the base of the wall where the stones are missing" },
      { image: "page-10.svg", sound: "crunch", text: "\"What will you do differently?\" \"Add more stones. Then it will be much stronger.\"", alt: "Sami and Nora with a pile of flat stones and a ladder in the garden" },
      { image: "page-11.svg", sound: "bird", text: "\"Can I help you fix it after school?\" \"Yes, please. Two pairs of hands finish faster than one.\"", alt: "Sami and Nora cheering beside the wall" },
      { image: "page-12.svg", sound: "bird", text: "We finished on the Thursday. The next wind came, and the wall did not move at all.", alt: "Sami, Leo and Teacher Yasmin in front of the finished garden wall" },
    ],
  },
  {
    id: "my-cousin-noah",
    title: "My Cousin Noah",
    grades: [3],
    units: [6],
    level: "Level 3",
    description: "Noah is kind, honest, calm and always busy. Amal decides to start being one of those things.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "My Cousin Noah is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 6, and it retells the reading of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "My Cousin Noah. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her cousin Noah in the garden" },
      { image: "page-02.svg", sound: "bird", text: "My cousin Noah is my favourite person in the whole family. He does not live far from us.", alt: "Noah and Amal outside between their two houses" },
      { image: "page-03.svg", sound: "bird", text: "He is kind and honest, and he never says one thing while he is thinking another.", alt: "Noah talking with Amal beside a bench in the schoolyard" },
      { image: "page-04.svg", sound: "hen", text: "He is always busy. After school he helps his mother in the kitchen.", alt: "Noah working in the kitchen at home beside a cooking pot" },
      { image: "page-05.svg", sound: "goat", text: "He shuts the neighbour's goats in before dark, without anybody asking him to.", alt: "Noah closing the fence on a goat at sunset" },
      { image: "page-06.svg", sound: "bell", text: "And still he finds time to sit down and help me with my spelling.", alt: "Noah helping Amal with a book at the desk at home" },
      { image: "page-07.svg", sound: "bird", text: "When I am worried, he stays calm and speaks in a friendly voice, and the worry gets smaller.", alt: "Amal looking sad in the garden while Noah stands calmly beside her" },
      { image: "page-08.svg", sound: "chick", text: "He never shouts, not even when his little sister makes a mess of his things.", alt: "Noah standing calmly at home while a small child looks surprised" },
      { image: "page-09.svg", sound: "bell", text: "At school he says hello to the pupils nobody knows yet.", alt: "Noah greeting Theo and Maya in the schoolyard" },
      { image: "page-10.svg", sound: "bird", text: "He shares his lunch when somebody has forgotten theirs.", alt: "Noah offering food to Leo beside a bench in the schoolyard" },
      { image: "page-11.svg", sound: "bell", text: "Our neighbours say he will grow up to be a wonderful teacher. He already explains things patiently.", alt: "Noah explaining something to Amal in the classroom" },
      { image: "page-12.svg", sound: "bird", text: "I want to be like him. So I started with one small thing: I said hello to somebody new.", alt: "Amal greeting Maya in the schoolyard with her arms raised" },
    ],
  },
  {
    id: "two-roads",
    title: "Two Roads",
    grades: [3],
    units: [6],
    level: "Level 3",
    description: "One road is smooth and long. The other is rough and short. Amal walks both, and compares them properly.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Two Roads is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 6, and it retells the reading of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "Two Roads. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal standing where the smooth road and the rough road divide" },
      { image: "page-02.svg", sound: "bird", text: "There are two roads near my home. They both lead to the same market.", alt: "Amal pointing along the two roads with the market in the distance" },
      { image: "page-03.svg", sound: "bird", text: "The first road is smooth and easy to walk on. It was paved a few years ago.", alt: "Amal standing on the smooth paved road" },
      { image: "page-04.svg", sound: "wind", text: "Cyclists use it every morning, because their wheels glide over it without a single bump.", alt: "Theo and Leo moving quickly along the smooth road" },
      { image: "page-05.svg", sound: "crunch", text: "The second road is much older. It is rough, so I watch my feet the whole way.", alt: "Amal looking down at the rough stony road" },
      { image: "page-06.svg", sound: "puddle", text: "Some of the stones are as big as a fist, and puddles collect between them when it rains.", alt: "Amal beside a puddle on the rough road with a big flat stone nearby" },
      { image: "page-07.svg", sound: "crunch", text: "My father takes the rough road every day, because it is shorter than the smooth one.", alt: "Dad walking the rough road with a basket of grain beside him" },
      { image: "page-08.svg", sound: "crunch", text: "\"My old boots are tough,\" he says, and he laughs at the wet stones.", alt: "Dad laughing on the rough road beside a puddle while Amal watches" },
      { image: "page-09.svg", sound: "wind", text: "My little sister prefers the smooth road, because she can ride without stopping.", alt: "Mina moving along the smooth road with Amal behind her" },
      { image: "page-10.svg", sound: "bird", text: "I like to explore both: one on quiet mornings, and one when I want an adventure.", alt: "Amal with her arms raised where the two roads divide" },
      { image: "page-11.svg", sound: "bird", text: "They are not similar at all, and that is exactly what I like about them.", alt: "Amal and Noah on the road beside a market sign" },
      { image: "page-12.svg", sound: "bird", text: "Whichever road I choose, I remember what my father told me. Both of them arrive.", alt: "Dad and Amal at the market at sunset" },
    ],
  },
  {
    id: "who-is-kinder",
    title: "Who Is Kinder?",
    grades: [3],
    units: [6],
    level: "Level 3",
    description: "Sami and Leo argue about whose brother is kinder. The argument ends in the only way it can.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Who Is Kinder? is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 6, and it retells the listening comparison of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "Who Is Kinder? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Sami and Leo pointing at each other in the schoolyard" },
      { image: "page-02.svg", sound: "bird", text: "\"My brother is kind to everybody,\" said Sami. \"He always shares his snacks at lunchtime.\"", alt: "Sami cheering beside Theo and a bowl of fruit in the schoolyard" },
      { image: "page-03.svg", sound: "bell", text: "\"He never says an unkind word, even to the noisiest pupils in our class.\"", alt: "Theo standing calmly beside Daniel in the classroom" },
      { image: "page-04.svg", sound: "bird", text: "\"That is nice,\" said Leo, \"but my brother is kinder than yours!\"", alt: "Leo pointing at Sami, who looks surprised, in the schoolyard" },
      { image: "page-05.svg", sound: "bird", text: "\"He carries our neighbour's shopping every single Friday, and nobody asks him to.\"", alt: "Noah carrying a heavy basket for Grandma Hana along the street" },
      { image: "page-06.svg", sound: "bell", text: "\"My brother helps our neighbours too,\" said Sami. \"But does yours help at school as well?\"", alt: "Sami and Leo arguing in the schoolyard beside the school bell" },
      { image: "page-07.svg", sound: "bird", text: "\"Of course! The younger pupils follow him around at break, because they like him so much.\"", alt: "Noah with his arms raised while Mina and Idris follow him in the schoolyard" },
      { image: "page-08.svg", sound: "bird", text: "\"All right,\" said Sami. \"But is your brother strong as well as kind?\"", alt: "Sami pointing at Leo beside a bench in the schoolyard" },
      { image: "page-09.svg", sound: "market", text: "\"He could carry ten bags of rice when he was only twelve!\" said Leo, proudly.", alt: "Leo cheering beside two big baskets of grain in the street" },
      { image: "page-10.svg", sound: "bird", text: "\"That is impressive,\" said Sami. \"But I still think kindness matters more than strength.\"", alt: "Sami and Leo standing quietly together in the schoolyard" },
      { image: "page-11.svg", sound: "bird", text: "\"I agree,\" said Leo. And then they both stopped, because there was nothing left to win.", alt: "Leo and Sami standing under the acacia tree beside a bench" },
      { image: "page-12.svg", sound: "bird", text: "\"Then we are both lucky,\" said Sami. And they went off to carry something for somebody.", alt: "Sami and Leo cheering at sunset beside a basket of fruit" },
    ],
  },
  {
    id: "today-and-always",
    title: "Today and Always",
    grades: [3],
    units: [7],
    level: "Level 3",
    description: "Weather is what today is doing. Climate is what a place has always done. Amal learns to tell them apart.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Today and Always is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 7, and it retells the reading \"Our Wonderful Nature\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "Today and Always. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal under a wide sky beside a big thermometer" },
      { image: "page-02.svg", sound: "rain", text: "Weather is what today is doing. Today it is raining, and my shoes are wet.", alt: "Amal in the rain in the street beside a puddle" },
      { image: "page-03.svg", sound: "bird", text: "Climate is what a place does for years and years. Ours is warm, whatever today says.", alt: "Teacher Yasmin explaining to Amal outside between two acacia trees" },
      { image: "page-04.svg", sound: "sun", text: "The sunshine warms the land, and on a hot afternoon the temperature climbs higher than we expect.", alt: "Amal beside a thermometer reading high, with dry planted rows nearby" },
      { image: "page-05.svg", sound: "crunch", text: "On a cold night, the water in a quiet pond froze into a smooth sheet of ice.", alt: "Amal and Nora looking at a patch of frost on the forest floor" },
      { image: "page-06.svg", sound: "tree", text: "In the forest the air smells of leaves and rain, and the trees grow tall.", alt: "Amal standing among the tall forest trees with a bird flying above" },
      { image: "page-07.svg", sound: "river", text: "On the beach the waves come in, and shells hide between the wet stones.", alt: "Amal pointing at a scatter of shells on the sand" },
      { image: "page-08.svg", sound: "wind", text: "High above, the mountain touches the clouds, and its rocky path is steep and quiet.", alt: "Amal and Nora on the mountain path beneath a cloud" },
      { image: "page-09.svg", sound: "bell", text: "Everything we touch is matter - the metal in a bicycle, and even the air that we breathe.", alt: "Teacher Yasmin explaining beside a balance scale in the classroom" },
      { image: "page-10.svg", sound: "wind", text: "The wind and the sun give us energy: the power that helps plants grow and machines work.", alt: "Amal with her arms raised outside as the wind blows past her" },
      { image: "page-11.svg", sound: "bell", text: "All of this is one planet. It is our home, and there is only the one.", alt: "Amal pointing at a globe in the classroom with Nora beside her" },
      { image: "page-12.svg", sound: "bird", text: "Nature gives us so much. It needs our help in return, and that part is ours to do.", alt: "Amal and Nora clearing litter into a recycling bin in the garden" },
    ],
  },
  {
    id: "nature-is-our-home",
    title: "Nature Is Our Home",
    grades: [3],
    units: [7],
    level: "Level 3",
    description: "The unit's poem, one line to a page, answered by the coast, the forest and the mountain themselves.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Nature Is Our Home is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 7. The quoted lines are the unit's own poem of the same name; the rest of the book is original. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "Nature Is Our Home. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora high on the mountain trail" },
      { image: "page-02.svg", sound: "tree", text: "\"Nature is our home,\"", alt: "Amal standing among the tall forest trees" },
      { image: "page-03.svg", sound: "river", text: "\"It gives us water,\"", alt: "Amal pointing at a stream running through the forest" },
      { image: "page-04.svg", sound: "tree", text: "\"trees,\"", alt: "Nora with her arms raised under the forest canopy with a bird above her" },
      { image: "page-05.svg", sound: "wind", text: "\"and air.\"", alt: "Amal flying a kite in the wind outside" },
      { image: "page-06.svg", sound: "sun", text: "\"The sun,\"", alt: "Amal on the shore in the bright sun, with shells on the sand" },
      { image: "page-07.svg", sound: "river", text: "\"the sea,\"", alt: "Nora pointing out to sea at a sailing boat, with shells on the sand" },
      { image: "page-08.svg", sound: "wind", text: "\"the mountain tall -\"", alt: "Amal and Nora on the mountain path beneath a cloud" },
      { image: "page-09.svg", sound: "river", text: "\"Let's take care,\"", alt: "Amal and Leo clearing litter on the beach beside a recycling bin" },
      { image: "page-10.svg", sound: "bird", text: "\"and share it all.\"", alt: "Amal and Nora planting a young tree in the garden" },
      { image: "page-11.svg", sound: "tree", text: "\"Take only pictures,\" says Teacher Yasmin, \"and leave only footprints.\"", alt: "Teacher Yasmin in the forest beside a framed photograph of a tree" },
      { image: "page-12.svg", sound: "river", text: "We said the whole poem out loud on the beach, and the sea did not mind at all.", alt: "Amal reading from her page on the shore while Nora cheers, with a boat behind them" },
    ],
  },
  {
    id: "have-you-ever",
    title: "Have You Ever?",
    grades: [3],
    units: [7],
    level: "Level 3",
    description: "Three friends swap the places they have been. Amal has been to fewer of them, and finds the right word for that.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Have You Ever? is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 7, and it retells the listening dialogue \"Have You Ever...?\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "tree", text: "Have You Ever? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nora, Amal and Leo talking together in the forest" },
      { image: "page-02.svg", sound: "tree", text: "\"Have you ever explored a forest?\" asked Nora.", alt: "Nora asking Amal a question among the forest trees" },
      { image: "page-03.svg", sound: "tree", text: "\"Yes, I have!\" said Leo. \"I walked under the tall trees last year.\"", alt: "Leo cheering under the forest canopy with a bird flying above" },
      { image: "page-04.svg", sound: "wind", text: "\"No, I haven't,\" I said. \"I have only ever seen pictures of a forest.\"", alt: "Amal looking downcast in the classroom beside a framed photograph of a tree" },
      { image: "page-05.svg", sound: "river", text: "\"It smells like rain and leaves,\" said Nora, smiling.", alt: "Nora standing beside a stream in the forest" },
      { image: "page-06.svg", sound: "wind", text: "\"Have you ever visited the mountains, Amal?\" \"No, I haven't.\"", alt: "Nora and Amal talking on the mountain path" },
      { image: "page-07.svg", sound: "bell", text: "\"But I have seen a photograph of snow on a mountain top.\"", alt: "Amal pointing at a framed photograph of snow in the classroom" },
      { image: "page-08.svg", sound: "wind", text: "\"I have climbed one,\" said Nora. \"It was steep, but the view from the top was amazing.\"", alt: "Nora with her arms raised high on the mountain beneath a cloud" },
      { image: "page-09.svg", sound: "river", text: "\"Has anybody here explored the rock pools?\" asked Leo.", alt: "Leo pointing along the shore at a scatter of shells" },
      { image: "page-10.svg", sound: "river", text: "\"I have!\" said Nora. \"I have found tiny crabs and shiny stones hiding near the water.\"", alt: "Nora holding a shell on the shore beside a flat stone" },
      { image: "page-11.svg", sound: "river", text: "\"Have you ever seen sunshine make a rainbow?\" I asked. \"Yes, I have,\" laughed Leo.", alt: "Amal and Leo cheering on the shore under a rainbow" },
      { image: "page-12.svg", sound: "wind", text: "I have not done half of these things. But \"not yet\" is a completely different word from \"never\".", alt: "Amal and Nora at sunset with a distant mountain behind them" },
    ],
  },
  {
    id: "maths-before-dinner",
    title: "Maths Before Dinner",
    grades: [3],
    units: [8],
    level: "Level 3",
    description: "Amal uses addition, division and measuring in one ordinary day, and does not open a maths book once.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Maths Before Dinner is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 8, and it retells the reading \"Maths Is Everywhere\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Maths Before Dinner. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal at home with her page and a staircase of big numbers behind her" },
      { image: "page-02.svg", sound: "hen", text: "The first thing I do in the morning is count the eggs in the basket.", alt: "Amal counting eggs in the kitchen at home with a hen nearby" },
      { image: "page-03.svg", sound: "river", text: "Then we walk to the busy market by the coast to buy food for the week.", alt: "Mum and Amal walking to the market beside the sea" },
      { image: "page-04.svg", sound: "market", text: "The stalls are piled high with mangoes, dates and bags of flour.", alt: "Omar calling out beside his stall with a basket of grain and a mango tree nearby" },
      { image: "page-05.svg", sound: "market", text: "I help my mother add up the prices, item by item, until every coin is counted.", alt: "Amal writing on her page at the market beside a notepad" },
      { image: "page-06.svg", sound: "bell", text: "At home there is a big bowl of sweet dates, and four cousins have come to visit.", alt: "Noah, Idris and Mina at the dining table with a bowl of fruit" },
      { image: "page-07.svg", sound: "bell", text: "We use division to split the dates, so that everybody gets exactly the same.", alt: "Amal pointing at four equal shares while Mina cheers" },
      { image: "page-08.svg", sound: "bell", text: "Before I put the flour away, I measure the size of the bag.", alt: "Amal measuring with a long ruler at home" },
      { image: "page-09.svg", sound: "bell", text: "Then I check its weight on the kitchen scales.", alt: "Amal and Mum weighing the flour on the kitchen scales" },
      { image: "page-10.svg", sound: "bell", text: "Both numbers go into my notebook, right next to the date.", alt: "Amal writing at the desk at home beside a notepad" },
      { image: "page-11.svg", sound: "bird", text: "Walking my cousins home, I count my steps. That is how I know the distance.", alt: "Amal and Noah walking home at sunset beside a counting line" },
      { image: "page-12.svg", sound: "bell", text: "Addition, division and measuring - all of it before dinner. Maths is a tool, not only a subject.", alt: "Amal cheering at home beside the dining room and a staircase of numbers" },
    ],
  },
  {
    id: "the-measuring-challenge",
    title: "The Measuring Challenge",
    grades: [3],
    units: [8],
    level: "Level 3",
    description: "Three things to measure before break: a desk, a room and a school bag. Sami thinks it sounds easy.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Measuring Challenge is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 8, and it retells the listening instructions of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Measuring Challenge. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Teacher Yasmin holding up a metre stick with Sami beside her" },
      { image: "page-02.svg", sound: "bell", text: "\"Today we have a measuring challenge. There are three things to measure before break time.\"", alt: "Teacher Yasmin at a board of sums while Nora listens" },
      { image: "page-03.svg", sound: "bell", text: "\"Only three, Teacher Yasmin?\" said Sami. \"That sounds easy!\"", alt: "Sami cheering at his classroom desk" },
      { image: "page-04.svg", sound: "bell", text: "\"First, measure the height of your desk, from the floor to the top. Write it in centimetres.\"", alt: "Sami measuring the height of a desk with a ruler standing on end" },
      { image: "page-05.svg", sound: "bell", text: "\"Got it,\" said Nora, kneeling down with her ruler.", alt: "Nora measuring beside a desk with a long ruler" },
      { image: "page-06.svg", sound: "bell", text: "\"Next, measure the distance from the door to the window.\"", alt: "Teacher Yasmin pointing across the room while Sami looks, with a metre stick nearby" },
      { image: "page-07.svg", sound: "bell", text: "\"Walk in a straight line and count your steps, or use the metre stick if you have one.\"", alt: "Sami walking along a counting line across the classroom" },
      { image: "page-08.svg", sound: "bell", text: "\"That's a long way,\" said Sami, looking right across the room.", alt: "Sami looking startled across the classroom" },
      { image: "page-09.svg", sound: "bell", text: "\"Then, for the third thing, find the weight of your school bag.\"", alt: "Nora and Sami weighing a bag on the scales in the classroom" },
      { image: "page-10.svg", sound: "bell", text: "\"What if our bag is very heavy?\" \"Write the exact number anyway. A fact is a fact, heavy or light!\"", alt: "Teacher Yasmin explaining beside a notepad while Nora writes" },
      { image: "page-11.svg", sound: "bell", text: "\"Write each number neatly, next to its unit. Use whichever tool fits the job best.\"", alt: "Sami writing his numbers at a desk beside a ruler" },
      { image: "page-12.svg", sound: "bell", text: "Three numbers, three tools, and the bell had not even gone yet.", alt: "Sami and Nora cheering in the classroom beside the metre stick and the scales" },
    ],
  },
  {
    id: "ten-to-a-million",
    title: "Ten to a Million",
    grades: [3],
    units: [8],
    level: "Level 3",
    description: "Ten, a hundred, a thousand - and up, one step at a time, until a million stops being just a word.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Ten to a Million is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 8, and it retells the listening text \"Numbers Big and Small\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Ten to a Million. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal beside a staircase of numbers climbing to a million" },
      { image: "page-02.svg", sound: "bell", text: "\"Let's count big numbers together. Start small, and we will grow bigger and bigger.\"", alt: "Teacher Yasmin at a board of sums with Amal listening" },
      { image: "page-03.svg", sound: "bell", text: "\"Ten,\" she said. \"That is easy - like ten fingers.\"", alt: "Amal cheering beside the first step of the number staircase" },
      { image: "page-04.svg", sound: "bell", text: "\"Now, one hundred. That is ten groups of ten.\"", alt: "Amal beside the second step of the number staircase and a counting line" },
      { image: "page-05.svg", sound: "river", text: "\"Next comes one thousand. Imagine one thousand shells on the beach.\"", alt: "Amal holding a shell on a beach covered with shells" },
      { image: "page-06.svg", sound: "river", text: "I tried to imagine them all, and they would not fit on the sand in front of me.", alt: "Amal looking startled at a beach scattered with shells" },
      { image: "page-07.svg", sound: "bell", text: "\"Then ten thousand, which is ten groups of one thousand.\"", alt: "Amal beside four lit steps of the number staircase" },
      { image: "page-08.svg", sound: "bell", text: "\"After that, one hundred thousand. We are getting close to the biggest one.\"", alt: "Teacher Yasmin pointing at five lit steps of the number staircase" },
      { image: "page-09.svg", sound: "bell", text: "\"And finally,\" said the tutor, pausing, \"one million.\"", alt: "Amal looking amazed at the full number staircase" },
      { image: "page-10.svg", sound: "bell", text: "\"One million!\" I shouted. \"That's the biggest number we said!\"", alt: "Amal cheering with confetti beside the full number staircase" },
      { image: "page-11.svg", sound: "bell", text: "\"That's right. A million is one thousand thousands.\"", alt: "Teacher Yasmin explaining to Amal beside a strip of shapes" },
      { image: "page-12.svg", sound: "river", text: "Ten, one hundred, one thousand, ten thousand, one hundred thousand, one million. I will remember that.", alt: "Amal cheering on the beach beside the number staircase and a scatter of shells" },
    ],
  },
  {
    id: "rain-is-a-kind-of-weather",
    title: "Rain Is a Kind of Weather",
    grades: [3],
    units: [9],
    level: "Level 3",
    description: "Nora's cat does not come home. She says nothing for two days, and then she says something.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Rain Is a Kind of Weather is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 9, and it retells the reading \"Feelings Are Not Bad or Good\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "lullaby", text: "Rain Is a Kind of Weather. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nora and her mother in the evening beside a framed photograph of a cat" },
      { image: "page-02.svg", sound: "bell", text: "Every day I feel a lot of different things inside. All of them are part of growing up.", alt: "Nora in the classroom with Maya and Leo beside her" },
      { image: "page-03.svg", sound: "bird", text: "Sometimes I feel joy. Sometimes I feel sadness. Both of them are normal.", alt: "Nora with her arms raised in the garden under a rainbow" },
      { image: "page-04.svg", sound: "rain", text: "Rain is a kind of weather. In the very same way, sadness is a kind of feeling.", alt: "Nora looking sad in the rain beside a puddle in the street" },
      { image: "page-05.svg", sound: "lullaby", text: "One evening my cat did not come home.", alt: "Nora alone and sad in the front room in the evening" },
      { image: "page-06.svg", sound: "wind", text: "I looked in the garden, and along the wall, and all the way down the street.", alt: "Nora searching the street at dusk beside a lamp post and a fence" },
      { image: "page-07.svg", sound: "wind", text: "For two days I said nothing about it, and the feeling got heavier.", alt: "Nora sitting sadly at her desk in the classroom" },
      { image: "page-08.svg", sound: "bell", text: "Then I told my mother.", alt: "Nora telling her mother at home, still looking sad" },
      { image: "page-09.svg", sound: "bell", text: "She put down her book and listened with a sincere heart. She did not hurry me at all.", alt: "Mum listening to Nora at home beside an open book" },
      { image: "page-10.svg", sound: "bell", text: "\"When we talk about sadness,\" she said, \"the heavy feeling starts to get lighter.\"", alt: "Mum explaining to Nora with a thought bubble showing a curled-up cat" },
      { image: "page-11.svg", sound: "lullaby", text: "We looked at the old photographs together, and I laughed at the one with the leaves.", alt: "Nora cheering beside her mother and a framed photograph of the cat" },
      { image: "page-12.svg", sound: "bird", text: "Feelings come and they go, like the weather. Neither one of them lasts for ever.", alt: "Nora in the garden under a rainbow with a cat nearby" },
    ],
  },
  {
    id: "what-sami-said",
    title: "What Sami Said",
    grades: [3],
    units: [9],
    level: "Level 3",
    description: "Sami imagines flying to the lighthouse. Amal listens properly, and the idea grows because she did.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "What Sami Said is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 9, and it retells the listening dialogue of the same name. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "river", text: "What Sami Said. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Sami on the shore looking out at the lighthouse" },
      { image: "page-02.svg", sound: "wind", text: "\"Sometimes I imagine that I can fly over the sea,\" said Sami.", alt: "Sami with his arms raised on the shore while a bird flies overhead" },
      { image: "page-03.svg", sound: "river", text: "\"Past the boats and the seagulls, all the way to the lighthouse.\"", alt: "Sami pointing at the lighthouse across the water, with a sailing boat between" },
      { image: "page-04.svg", sound: "river", text: "He smiled as he said it, and his eyes seemed far away.", alt: "Sami on the shore with a thought bubble showing the lighthouse" },
      { image: "page-05.svg", sound: "bird", text: "Later that afternoon I walked home with my mother, and I told her all about it.", alt: "Amal and Mum walking home at sunset past their house" },
      { image: "page-06.svg", sound: "bell", text: "\"He said it made him feel free and calm, as if nothing could worry him.\"", alt: "Amal telling her mother about it in the front room at home" },
      { image: "page-07.svg", sound: "bell", text: "My mother listened carefully. \"Did Sami say why he chose flying?\" she asked.", alt: "Mum asking Amal a question at home" },
      { image: "page-08.svg", sound: "wind", text: "\"He said that flying feels like a kind of freedom.\"", alt: "Amal at home with a thought bubble showing a bird in flight" },
      { image: "page-09.svg", sound: "lullaby", text: "\"That sounds sincere and thoughtful,\" she said, \"and I am glad you listened so well.\"", alt: "Mum and Amal talking in the front room in the evening" },
      { image: "page-10.svg", sound: "bell", text: "\"I suggest we ask him to draw it too,\" I said, \"so everyone can imagine it the way he does.\"", alt: "Amal pointing at an easel in the classroom" },
      { image: "page-11.svg", sound: "bell", text: "So Sami drew the lighthouse, and the boats, and the birds above them.", alt: "Sami beside his drawing of the lighthouse on an easel" },
      { image: "page-12.svg", sound: "bell", text: "His idea went into the Box of Ideas, and now it belongs to all of us.", alt: "Sami and Amal cheering beside the Box of Ideas with Teacher Yasmin" },
    ],
  },
  {
    id: "everyone-gets-a-turn",
    title: "Everyone Gets a Turn",
    grades: [3],
    units: [9],
    level: "Level 3",
    description: "The class plans a garden. Four ideas, four reasons, one vote - and three straight rows in the end.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Everyone Gets a Turn is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 9, and it retells the listening dialogue \"A Group Discussion\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Everyone Gets a Turn. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Leo, Maya, Adam and Teacher Yasmin planning together in the classroom" },
      { image: "page-02.svg", sound: "bell", text: "\"Today we plan our class garden. Suggest an idea, and allow everybody a turn to speak.\"", alt: "Teacher Yasmin pointing at a poster while Maya listens" },
      { image: "page-03.svg", sound: "bell", text: "\"I suggest we grow tomatoes,\" said Leo, \"because we can eat them at lunch.\"", alt: "Leo cheering beside a flowering plant in the classroom" },
      { image: "page-04.svg", sound: "bird", text: "\"And they do not need very much space.\"", alt: "Leo pointing along a planted row in the garden" },
      { image: "page-05.svg", sound: "bird", text: "\"Flowers too,\" said Maya, \"so the garden looks beautiful and the bees have somewhere to visit.\"", alt: "Maya cheering beside a flowering plant in the garden" },
      { image: "page-06.svg", sound: "bell", text: "\"Could we grow herbs as well?\" asked Adam. \"My grandmother says mint is easy to grow.\"", alt: "Adam pointing at a small green sprout in the classroom" },
      { image: "page-07.svg", sound: "bell", text: "\"Thank you, everybody. I like how each of you gave a reason for your idea.\"", alt: "Teacher Yasmin beside a notepad with Leo listening" },
      { image: "page-08.svg", sound: "bell", text: "\"Can we vote to decide which ideas we use first?\" asked Leo. \"That is a sensible suggestion.\"", alt: "Leo, Maya and Adam with their hands up while Teacher Yasmin counts" },
      { image: "page-09.svg", sound: "bell", text: "Hands went up for the flowers. Hands went up for the tomatoes. Hands went up for the mint.", alt: "Nora, Amal and Theo with their hands raised in the classroom" },
      { image: "page-10.svg", sound: "bird", text: "Every idea got a turn, so in the end every idea got some ground.", alt: "Amal and Maya beside the planted rows in the garden" },
      { image: "page-11.svg", sound: "bird", text: "\"I hope we plant this week,\" said Maya, \"because the weather looks sunny.\"", alt: "Maya cheering beside a watering can in the garden" },
      { image: "page-12.svg", sound: "bird", text: "We started on Friday: tomatoes, flowers and mint, in three straight rows.", alt: "Leo, Maya and Adam in the finished garden with the planted rows" },
    ],
  },
  {
    id: "the-green-folder",
    title: "The Green Folder",
    grades: [3],
    units: [10],
    level: "Level 3",
    description: "One folder on every desk, and a whole year of work inside it. Amal reads her own year from the outside.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Green Folder is an original Grade 3 story created for Ehel Academy in 2026, the second of four books for Unit 10, and it retells the story \"Amal's Year of Words\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Green Folder. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding a big green folder under bunting, with Nora beside her" },
      { image: "page-02.svg", sound: "bell", text: "It was the last Monday of Year 3. Teacher Yasmin put one large green folder on every desk.", alt: "Teacher Yasmin beside a classroom desk with a green folder on it" },
      { image: "page-03.svg", sound: "bell", text: "\"Inside this folder is your whole year,\" she said. \"Choose the work that shows how far you have come.\"", alt: "Teacher Yasmin and Amal beside a big green folder in the classroom" },
      { image: "page-04.svg", sound: "bell", text: "On the very first page I found my family tree from Unit 1, with Mina drawn in the corner.", alt: "Amal holding her family tree page beside a poster, with Mina next to her" },
      { image: "page-05.svg", sound: "bell", text: "Behind it lay my calendar chart. January blue, February green, March grey for the heavy rains.", alt: "Amal holding her page beside the wall of twelve months with March ringed" },
      { image: "page-06.svg", sound: "bell", text: "Under the chart was my report about the county hospital, where Doctor Sarah answered every question.", alt: "Amal with her report in the classroom beside a picture of the hospital" },
      { image: "page-07.svg", sound: "bell", text: "Then my poster about climate and weather, with the temperature written down for a whole week.", alt: "Amal beside her weather poster and a thermometer in the classroom" },
      { image: "page-08.svg", sound: "bell", text: "Next came my page of big numbers, all the way up to a million.", alt: "Amal cheering beside a staircase of numbers in the classroom" },
      { image: "page-09.svg", sound: "bell", text: "\"You spelt million with two letters l,\" said Nora. \"I remember, because I spelt it wrongly first.\"", alt: "Nora pointing something out to Amal at a classroom desk" },
      { image: "page-10.svg", sound: "bell", text: "At the back was my kindness jar page, with one honest sentence written on it.", alt: "Amal holding her kindness page beside a poster in the classroom" },
      { image: "page-11.svg", sound: "lullaby", text: "\"In January you could hardly write one paragraph,\" said Grandma Hana. \"Now you write a whole page.\"", alt: "Grandma Hana talking to Amal in the evening beside the green folder" },
      { image: "page-12.svg", sound: "bell", text: "On the last sheet I wrote my goal for Grade 4, and then I read it back twice.", alt: "Amal writing at her page beside an open book in the classroom" },
    ],
  },
  {
    id: "the-last-friday",
    title: "The Last Friday",
    grades: [3],
    units: [10],
    level: "Level 3",
    description: "The Showcase brief has four parts, and they happen in order. Amal works through every one of them.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Last Friday is an original Grade 3 story created for Ehel Academy in 2026, the third of four books for Unit 10, and it retells the instructions \"The Year 3 Showcase: Project Brief\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Last Friday. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding the project brief beside a poster in the classroom" },
      { image: "page-02.svg", sound: "bell", text: "The Year 3 Showcase has four parts, and you complete them in order.", alt: "Teacher Yasmin pointing at a row of four squares on the classroom wall" },
      { image: "page-03.svg", sound: "bell", text: "Part one: choose your pages. Pick six, from at least four different units.", alt: "Amal holding a folder beside a big green folder in the classroom" },
      { image: "page-04.svg", sound: "bell", text: "Look for work that shows reading, writing, speaking and new words.", alt: "Amal and Nora sorting pages at a desk with an open book on it" },
      { image: "page-05.svg", sound: "bell", text: "Part two: build your booklet. Write two full paragraphs on every page.", alt: "Amal with her page beside a large open book in the classroom" },
      { image: "page-06.svg", sound: "bell", text: "Add one picture and one clear label to each page.", alt: "Nora pointing at a poster on an easel in the classroom" },
      { image: "page-07.svg", sound: "bell", text: "Put your name and your class on the title page. Then write the word Author underneath.", alt: "Amal holding her title page beside a poster in the classroom" },
      { image: "page-08.svg", sound: "bell", text: "Part three: present your work. Speak for about two minutes beside your display table.", alt: "Amal with her arms raised beside a display table under bunting" },
      { image: "page-09.svg", sound: "bell", text: "Point at your pictures, and answer two questions from your listeners.", alt: "Amal pointing at her poster on an easel while Theo listens" },
      { image: "page-10.svg", sound: "bell", text: "Part four: reflect. Write four honest sentences about what you can do now, and one goal for Grade 4.", alt: "Amal writing beside a notepad in the classroom" },
      { image: "page-11.svg", sound: "lullaby", text: "Read every page aloud before you hand it in. Your ears will find the missing full stops for you.", alt: "Amal reading her pages aloud in the evening beside an open book" },
      { image: "page-12.svg", sound: "bell", text: "Ask a partner for one kind idea and one careful question. Then hand it in, on the last Friday.", alt: "Nora and Amal handing their folders to Teacher Yasmin in the classroom" },
    ],
  },
  {
    id: "showcase-day",
    title: "Showcase Day",
    grades: [3],
    units: [10],
    level: "Level 3",
    description: "Tables in the school garden, twenty-eight chairs, and the questions that turn out to be the best part.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Showcase Day is an original Grade 3 story created for Ehel Academy in 2026, the fourth of four books for Unit 10, and it retells the listening dialogues \"Planning the Showcase\" and \"Showcase Day\". Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 3 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "Showcase Day. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the display tables in the school garden under bunting, with Amal and Nora" },
      { image: "page-02.svg", sound: "bell", text: "\"We have one week left,\" said Teacher Yasmin, \"so let us plan the showcase carefully.\"", alt: "Teacher Yasmin at a calendar board in the classroom with Amal beside her" },
      { image: "page-03.svg", sound: "bird", text: "\"Where will we put the display tables?\" \"In the school garden, if the weather stays dry.\"", alt: "Amal and Teacher Yasmin beside two display tables in the garden" },
      { image: "page-04.svg", sound: "bird", text: "Maya measured the long table that morning. It was two metres and forty centimetres.", alt: "Maya measuring the long table in the garden with a metre stick" },
      { image: "page-05.svg", sound: "bird", text: "\"Then six booklets fit on it,\" said Sami, \"with one small gap between each of them.\"", alt: "Sami pointing at a table set with a folder and a row of spaces" },
      { image: "page-06.svg", sound: "bird", text: "Twenty-eight chairs, because every single parent had answered the invitation.", alt: "Nora counting benches set out in the school garden" },
      { image: "page-07.svg", sound: "crunch", text: "Sami and Leo built the folder stand out of the strong boxes.", alt: "Sami and Leo building the folder stand in the garden beside a ladder" },
      { image: "page-08.svg", sound: "rain", text: "\"And if the heavy rain comes back?\" \"Then we move into the library, and it still goes ahead.\"", alt: "Teacher Yasmin pointing at the library in the rain" },
      { image: "page-09.svg", sound: "bird", text: "On the evening itself, I presented first. My booklet is called My Year of Words.", alt: "Amal presenting her booklet beside a display table under bunting" },
      { image: "page-10.svg", sound: "bird", text: "Grandma Hana asked which page I was proudest of. Page five: my kindness jar, and one honest sentence.", alt: "Grandma Hana asking Amal a question beside her poster in the garden" },
      { image: "page-11.svg", sound: "bird", text: "Doctor Sarah asked which page was hardest. The climate poster - seven whole days of temperature.", alt: "Doctor Sarah and Amal beside the weather poster and a thermometer in the garden" },
      { image: "page-12.svg", sound: "bell", text: "Then Teacher Yasmin asked my goal for Grade 4, and I told the whole garden what it was.", alt: "Amal, Nora, Teacher Yasmin and Grandma Hana celebrating at sunset under bunting" },
    ],
  },

  // ---------------------------------------------------------------- Grade 4
  // The same cast a year on — Amal, Nora, Teacher Yasmin, Omar, Sami and the
  // family all continue through the Grade 4 readings — plus Maya, the young
  // reporter Unit 4 introduces. Every book is built on its unit's own story
  // device, so the shelf and the lesson are recognisably the same world.
  // Illustrations: tools/create-grade4-ebook-illustrations.js.
  {
    id: "the-post-counter",
    title: "The Post Counter",
    grades: [4],
    units: [1],
    level: "Level 4",
    description: "Omar sorts the town's mail, reads letters aloud for neighbours, and never leaves a job half finished.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Post Counter is an original Grade 4 story created for Ehel Academy in 2026, book one of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 4 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Post Counter. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Omar behind the town post counter with Amal holding her interview notes" },
      { image: "page-02.svg", sound: "bell", text: "Omar runs the market shop, and the town post counter stands beside his till.", alt: "Omar at the post counter with the pigeonholes and shop shelves behind him" },
      { image: "page-03.svg", sound: "bell", text: "Every morning he sorts the mail, weighs the parcels, and checks each address twice. A small mistake could send a letter to the wrong street.", alt: "Omar weighing a parcel on the counter scales beside a stack of parcels" },
      { image: "page-04.svg", sound: "lullaby", text: "He reads letters aloud for neighbours who find long words difficult. Grandmother Salma listens for news of a cousin far away.", alt: "Omar reading an open letter aloud while Grandmother Salma listens at the counter" },
      { image: "page-05.svg", sound: "market", text: "\"Not everyone owns a phone,\" Omar says. \"A letter can bring peace, and make somebody feel remembered.\"", alt: "Omar outside his market stall talking with Amal and Maya on the town street" },
      { image: "page-06.svg", sound: "bell", text: "I came to interview him for the school paper. Maya lent me her list of questions.", alt: "Amal at the counter with her notes while Omar answers her" },
      { image: "page-07.svg", sound: "hen", text: "\"How do you keep it fair?\" I asked. \"First come, first served,\" he said. \"Every parcel matters to somebody.\"", alt: "Amal writing up her notes at home in the kitchen with Mum" },
      { image: "page-08.svg", sound: "bird", text: "At home I wrote up my notes. Mum said a good interview is mostly listening.", alt: "Amal and Nora sitting in the schoolyard going over the draft" },
      { image: "page-09.svg", sound: "bell", text: "Nora read my draft and said the middle was slow. So I cut it, clearly and without arguing.", alt: "Omar working on at the counter with a taller stack of parcels" },
      { image: "page-10.svg", sound: "bell", text: "On busy days Omar simply works a little longer, instead of leaving a job half finished.", alt: "Teacher Yasmin reading Amal's report to the class while Amal and Maya listen" },
      { image: "page-11.svg", sound: "bell", text: "Teacher Yasmin read my report to the class. \"Daily effort,\" she said. \"That is the whole story.\"", alt: "Omar and Amal both cheering at the counter beside an open letter" },
      { image: "page-12.svg", sound: "wind", text: "I posted a copy to my cousin. It is a small thing to send a letter - and a large thing to get one.", alt: "Amal walking home at sunset with her copy of the report under a lit street lamp" },
    ],
  },
  {
    id: "the-storm-and-the-science-tent",
    title: "The Storm and the Science Tent",
    grades: [4],
    units: [2],
    level: "Level 4",
    description: "A science fair, a sky the colour of iron, and the one pupil who came prepared.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Storm and the Science Tent is an original Grade 4 story created for Ehel Academy in 2026, book two of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 4 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "rain", text: "The Storm and the Science Tent. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the science tent in a rainstorm with lightning behind it and Amal and Nora outside" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin planned a science fair, and the whole class built a tent on the village field.", alt: "The science tent on the field under bunting with Teacher Yasmin and Amal" },
      { image: "page-03.svg", sound: "bell", text: "Nora's project was the weather. Mine was moisture - how the air holds water you cannot see.", alt: "Nora holding her project book beside Amal and a globe on the field" },
      { image: "page-04.svg", sound: "wind", text: "In the morning the sky was clear. By midday there were clouds the colour of iron.", alt: "Amal pointing up at heavy clouds gathering over the field" },
      { image: "page-05.svg", sound: "wind", text: "We taped down our posters. The temperature dropped, and the air smelled of rain.", alt: "Teacher Yasmin and Nora securing the science tent as the weather turns" },
      { image: "page-06.svg", sound: "rain", text: "Then the storm arrived. Hail rattled on the canvas like a drum, and everybody ran for the tent.", alt: "Amal and Nora startled in heavy rain beside the science tent" },
      { image: "page-07.svg", sound: "rain", text: "Lightning split the sky. Nora counted the seconds until the thunder, the way her project said to.", alt: "Lightning above the science tent while Teacher Yasmin and Amal shelter" },
      { image: "page-08.svg", sound: "rain", text: "\"Six seconds,\" she said. \"The storm is two kilometres away.\" Nobody laughed at the weather project after that.", alt: "Amal and Nora cheering in the rain beside the tent" },
      { image: "page-09.svg", sound: "rain", text: "We waited it out together, twenty of us under one roof, dripping and delighted.", alt: "Teacher Yasmin, Amal and Nora standing together in the rain" },
      { image: "page-10.svg", sound: "wind", text: "When it passed, the field was a lake, and every poster on the outside table was ruined.", alt: "The field after the storm with grey cloud clearing and the tent standing" },
      { image: "page-11.svg", sound: "sun", text: "Nora's poster survived, because she had brought a plastic sleeve. Preparation is not luck.", alt: "Nora and Amal cheering in the sunshine beside the science tent" },
      { image: "page-12.svg", sound: "bird", text: "The judges gave her first place. \"The weather did the demonstration,\" said Teacher Yasmin.", alt: "Amal and Nora at sunset with the science tent behind them" },
    ],
  },
  {
    id: "from-farm-to-plate",
    title: "From Farm to Plate",
    grades: [4],
    units: [3],
    level: "Level 4",
    description: "Amal follows her dinner all the way back to the soil it started in.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "From Farm to Plate is an original Grade 4 story created for Ehel Academy in 2026, book three of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 4 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "From Farm to Plate. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her father at the edge of a ploughed field" },
      { image: "page-02.svg", sound: "bird", text: "My father took me to the farm where our food begins.", alt: "Dad pointing out the furrows of the farm field to Amal" },
      { image: "page-03.svg", sound: "goat", text: "The field was full of furrows. \"Everything you ate this week started in soil like this,\" he said.", alt: "Adam and Idris working along the furrows with a goat nearby" },
      { image: "page-04.svg", sound: "market", text: "Adam and Idris helped gather the harvest. Labour, my father calls it - the work nobody sees on the plate.", alt: "Omar at his market stall with mangoes while Amal takes notes" },
      { image: "page-05.svg", sound: "market", text: "At the market, Omar weighed the rice and told me the price had risen. Rain in the north, he said.", alt: "Mum and Amal choosing food at the market stall with a hen nearby" },
      { image: "page-06.svg", sound: "hen", text: "Mum chose what was fresh, and left what was not. \"Look at food,\" she said. \"Do not just buy it.\"", alt: "Grandma Hana showing Amal the kitchen" },
      { image: "page-07.svg", sound: "hen", text: "Grandma Hana showed me how she keeps a kitchen clean, because food that is not safe is not food.", alt: "Mum explaining something to little Mina in the kitchen" },
      { image: "page-08.svg", sound: "bell", text: "Mina wanted only sweet things. Mum let her choose one, and no more.", alt: "Amal looking downcast with Mum outside the town clinic" },
      { image: "page-09.svg", sound: "bell", text: "At the clinic the nurse explained what fresh food does for a growing brain and stomach.", alt: "Teacher Yasmin at a food poster in the classroom with Amal" },
      { image: "page-10.svg", sound: "bell", text: "Cousin Noah asked why some families have plenty and some do not. Nobody had a short answer.", alt: "Amal and Noah talking at the family dining table" },
      { image: "page-11.svg", sound: "river", text: "We planted a row of our own, so that at least one meal would begin in our yard.", alt: "Amal cheering beside a flowering plant at the edge of the ploughed field" },
      { image: "page-12.svg", sound: "bird", text: "Now when I eat, I can see the whole trail behind it: a field, a market, a kitchen, a table.", alt: "Amal, Mum and Mina outside their house at sunset" },
    ],
  },
  {
    id: "the-library-that-came-by-cart",
    title: "The Library That Came by Cart",
    grades: [4],
    units: [4],
    level: "Level 4",
    description: "A town with no library, a cart with two shelves, and a reporter who counted who was reading.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Library That Came by Cart is an original Grade 4 story created for Ehel Academy in 2026, book four of the Grade 4 Amal series, built on the travelling library and the young reporter of the Grade 4 Unit 4 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "The Library That Came by Cart. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the blue library cart on the town street with Maya and Amal beside it" },
      { image: "page-02.svg", sound: "bell", text: "Our town has no library building. What it has is a cart.", alt: "Amal looking in surprise at the library cart on the street" },
      { image: "page-03.svg", sound: "bell", text: "Every Thursday it arrives, painted blue, with two shelves of books and one squeaky wheel.", alt: "Teacher Yasmin and Nora choosing books from the library cart" },
      { image: "page-04.svg", sound: "bell", text: "Teacher Yasmin says a library is a service, not a building. The cart proves her right.", alt: "Amal holding a book between the cart and a shelf of books" },
      { image: "page-05.svg", sound: "market", text: "Maya writes for the town paper. She is twelve, and she has a notebook for everything.", alt: "Maya interviewing Omar beside the market stall" },
      { image: "page-06.svg", sound: "bell", text: "She interviewed Omar about how many people ask him to read to them. The number surprised the whole town.", alt: "Maya presenting her notes to the class with Amal and Teacher Yasmin" },
      { image: "page-07.svg", sound: "bell", text: "So Maya wrote an article: \"A town that wants to read.\" It was printed on the front page.", alt: "Teacher Yasmin and Maya beside the article pinned up on the wall" },
      { image: "page-08.svg", sound: "bell", text: "At the town meeting, people argued about priorities. A road, a roof, or a room full of books?", alt: "Omar, Grandmother Salma, Dad, Amal and Maya standing together at the town meeting" },
      { image: "page-09.svg", sound: "bell", text: "Little Mina asked why we could not simply keep the cart. That got the biggest laugh of the evening.", alt: "Amal pointing out the library cart to little Mina" },
      { image: "page-10.svg", sound: "bell", text: "In the end the vote was for a community centre, with one room for the books.", alt: "Maya and Nora cheering outside the new library building under bunting" },
      { image: "page-11.svg", sound: "bell", text: "The cart still comes on Thursdays. Nobody wanted to give it up.", alt: "Amal with a book between the library building and the old cart" },
      { image: "page-12.svg", sound: "bird", text: "Maya kept the front page. \"Information,\" she says, \"is just knowledge that somebody bothered to share.\"", alt: "Maya and Amal at sunset outside the library" },
    ],
  },
  {
    id: "the-spiral-cave",
    title: "The Spiral Cave",
    grades: [4],
    units: [5],
    level: "Level 4",
    description: "Adam is winning the race when the goat escapes. He stops anyway.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Spiral Cave is an original Grade 4 story created for Ehel Academy in 2026, book five of the Grade 4 Amal series, built on the village race, the lost goat and the spiral cave of the Grade 4 Unit 5 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "The Spiral Cave. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal, Nora and Adam inside a dark cave coiled like a shell" },
      { image: "page-02.svg", sound: "ball", text: "It was race day at the village field, and my brother Adam was the fastest runner in town.", alt: "Amal, Nora and Adam at the start line under bunting on the village field" },
      { image: "page-03.svg", sound: "ball", text: "I am not fast. But I can keep going, which is a different thing.", alt: "Nora running hard across the field with dust and motion lines behind her" },
      { image: "page-04.svg", sound: "goat", text: "Halfway through the race, Idris shouted. The goat had escaped again.", alt: "Amal pointing at the escaped goat while a worried Idris stands beside her" },
      { image: "page-05.svg", sound: "goat", text: "Adam stopped running. He was winning, and he stopped.", alt: "Adam and Amal turning away from the race to follow the goat" },
      { image: "page-06.svg", sound: "wind", text: "We followed the goat up the hill, past the mountain trail, until it disappeared into a hole in the rock.", alt: "Amal and Nora on the mountain trail following the goat's path" },
      { image: "page-07.svg", sound: "crickets", text: "Inside was a cave we had never seen: cool, dark, and coiled like a shell.", alt: "Amal and Nora amazed inside the spiral cave" },
      { image: "page-08.svg", sound: "crickets", text: "Adam went first, and made us walk slowly. \"Never rush in a place you cannot see,\" he said.", alt: "Adam leading Amal and Idris carefully into the cave" },
      { image: "page-09.svg", sound: "goat", text: "The goat was at the centre of the spiral, perfectly calm, chewing something it should not have.", alt: "Amal and Nora finding the goat calmly standing at the centre of the cave" },
      { image: "page-10.svg", sound: "goat", text: "Idris carried it out. It weighed more than he did, and he refused to admit that.", alt: "Idris and Amal walking the goat back out of the cave" },
      { image: "page-11.svg", sound: "ball", text: "We got back to the field long after the race had finished. Nobody had won it.", alt: "Amal, Adam and Idris back on the sunny field with the goat safe beside them" },
      { image: "page-12.svg", sound: "wind", text: "\"You lost the race,\" I told Adam. \"I rescued a goat,\" he said. \"Ask me which one I will remember.\"", alt: "Amal and Nora talking at sunset under an acacia tree" },
    ],
  },
  {
    id: "the-community-parade",
    title: "The Community Parade",
    grades: [4],
    units: [6],
    level: "Level 4",
    description: "Once a year the town marches for the people who keep it working - and Maya writes down every name.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Community Parade is an original Grade 4 story created for Ehel Academy in 2026, book six of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, using the cast and setting of the Grade 4 English readings. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "The Community Parade. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the town parade under bunting with a banner, Amal, Maya and Omar" },
      { image: "page-02.svg", sound: "bell", text: "Once a year our town holds a parade for the people who keep it working.", alt: "Teacher Yasmin explaining the parade route to Amal on the town street" },
      { image: "page-03.svg", sound: "market", text: "The carpenter came first, then the engineer, then the caretaker who unlocks the school every morning at six.", alt: "Omar, Dad and Amal on the street beside the market stall" },
      { image: "page-04.svg", sound: "bell", text: "Omar closed the shop for one hour - the only hour it closes all year.", alt: "Mum and Grandmother Salma outside the town hospital" },
      { image: "page-05.svg", sound: "bell", text: "Maya walked the whole route with her notebook, asking everybody the same question: what do you do?", alt: "Maya interviewing Noah beside a poster on the wall" },
      { image: "page-06.svg", sound: "bell", text: "Our neighbours carried a banner. One family arrived here as refugees; the other has farmed the same field for a hundred years.", alt: "Noah, Sami and Amal talking together in front of a house" },
      { image: "page-07.svg", sound: "bell", text: "Sami's father is a nurse. Noah's mother is a lawyer. Both were marching.", alt: "Maya and Teacher Yasmin outside the town library" },
      { image: "page-08.svg", sound: "bell", text: "Teacher Yasmin marched with the school. So did every child who wanted to.", alt: "Amal and Nora cheering under bunting beside a parade banner in the schoolyard" },
      { image: "page-09.svg", sound: "market", text: "There was music, and there was too much of it, and nobody minded.", alt: "Sami and Noah cheering beside a parade banner in the street" },
      { image: "page-10.svg", sound: "market", text: "At the end, the mayor gave the shortest speech I have ever heard: \"Thank you. Go home. Come back next year.\"", alt: "Confetti over the whole crowd: Omar, Salma, Maya, Amal and Mina together" },
      { image: "page-11.svg", sound: "bell", text: "Maya's article was one page of names. Just names, and what each person does.", alt: "Maya showing Amal her notes beside a coral parade banner" },
      { image: "page-12.svg", sound: "bird", text: "I read every one. It took a while. That was rather the point.", alt: "Amal and Maya cheering at sunset with bunting above them" },
    ],
  },
  {
    id: "the-day-of-the-play",
    title: "The Day of the Play",
    grades: [4],
    units: [7],
    level: "Level 4",
    description: "Sami is the shyest person Amal knows, and Teacher Yasmin has given him the biggest part.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Day of the Play is an original Grade 4 story created for Ehel Academy in 2026, book seven of the Grade 4 Amal series, built on the school play of the Grade 4 Unit 7 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Day of the Play. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Sami on a curtained stage with Amal beside him under bunting" },
      { image: "page-02.svg", sound: "bell", text: "Our class was putting on a play, and Teacher Yasmin gave Sami the biggest part.", alt: "Teacher Yasmin announcing the parts in the classroom while Amal listens" },
      { image: "page-03.svg", sound: "wind", text: "Sami is the shyest person I know. He went white when she read out his name.", alt: "Sami alone at his classroom desk looking stricken" },
      { image: "page-04.svg", sound: "bell", text: "\"I cannot do it,\" he told me. \"Everybody will look at me.\"", alt: "Amal and Nora with a downcast Sami in the classroom" },
      { image: "page-05.svg", sound: "tree", text: "We practised in the yard, just the two of us, until he could say his lines to a tree.", alt: "Amal encouraging a nervous Sami on a schoolyard bench" },
      { image: "page-06.svg", sound: "tree", text: "Then to me. Then to Nora. Then to three people, which was harder than one.", alt: "Sami reciting under the big schoolyard tree while Amal points him on" },
      { image: "page-07.svg", sound: "bell", text: "\"Nervous is not the same as unable,\" said Teacher Yasmin. \"It only feels the same.\"", alt: "Teacher Yasmin talking to Sami and Amal in the classroom" },
      { image: "page-08.svg", sound: "lullaby", text: "On the night, the hall was full. Behind the curtain Sami was terrified, and so was I.", alt: "Amal, Nora and Sami waiting behind a closed stage curtain" },
      { image: "page-09.svg", sound: "bell", text: "The curtain opened.", alt: "Sami alone in the middle of the open stage" },
      { image: "page-10.svg", sound: "bell", text: "He said every line. He said them well, and he said them loudly, and he did not stop once.", alt: "Sami performing on stage with Amal and Nora cheering beside him" },
      { image: "page-11.svg", sound: "bell", text: "Afterwards he sat down very suddenly and laughed until he had to hold onto a chair.", alt: "Confetti on stage with Teacher Yasmin, Sami and Amal all celebrating" },
      { image: "page-12.svg", sound: "bird", text: "Being brave is not feeling calm. It is doing the thing while you do not.", alt: "Sami and Amal walking home together at sunset" },
    ],
  },
  {
    id: "the-attic-clue",
    title: "The Attic Clue",
    grades: [4],
    units: [8],
    level: "Level 4",
    description: "Three taped boxes, a brass telescope, and a letter addressed to nobody.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Attic Clue is an original Grade 4 story created for Ehel Academy in 2026, book eight of the Grade 4 Amal series, built on the attic and the telescope of the Grade 4 Unit 8 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "crickets", text: "The Attic Clue. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Idris in a dusty attic with old boxes and a brass telescope" },
      { image: "page-02.svg", sound: "bell", text: "Dad said the attic needed clearing, which is how the whole thing started.", alt: "Dad pointing up towards the attic while Amal listens in the living room" },
      { image: "page-03.svg", sound: "crunch", text: "Idris found the boxes first: three of them, taped shut, older than either of us.", alt: "A surprised Amal and Idris beside a stack of old boxes in the attic" },
      { image: "page-04.svg", sound: "crickets", text: "Inside was a telescope. Brass, heavy, and folded up like a puzzle.", alt: "Amal holding a paper beside the opened boxes in the attic" },
      { image: "page-05.svg", sound: "crickets", text: "There was also a letter, in handwriting we did not recognise, addressed to nobody.", alt: "Idris pointing at the telescope while a surprised Amal looks on" },
      { image: "page-06.svg", sound: "crickets", text: "Idris wanted to use the telescope immediately. I wanted to know whose it was.", alt: "Amal pointing at the brass telescope standing in the attic light" },
      { image: "page-07.svg", sound: "lullaby", text: "Grandma Hana put on her reading glasses and went very quiet.", alt: "Grandma Hana in her reading glasses talking to Amal in the living room" },
      { image: "page-08.svg", sound: "bell", text: "It had belonged to her brother, who taught himself the names of the stars from a library book.", alt: "Teacher Yasmin at a globe in the classroom explaining to Amal" },
      { image: "page-09.svg", sound: "crickets", text: "Teacher Yasmin helped us clean the lens with the right cloth and no shortcuts.", alt: "Amal and Sami with the cleaned telescope in the attic" },
      { image: "page-10.svg", sound: "crickets", text: "That night we carried it into the yard. Idris found Orion in under a minute, which was infuriating.", alt: "Amal and Idris under a sky full of stars with the telescope set up in the yard" },
      { image: "page-11.svg", sound: "crickets", text: "Grandma Hana looked last, and for a long time, and did not say anything at all.", alt: "Amal holding the old letter in the attic beside the telescope and boxes" },
      { image: "page-12.svg", sound: "lullaby", text: "Some tools are just tools. And some of them are somebody, kept.", alt: "Amal, Idris and Grandma Hana outside the house at sunset" },
    ],
  },
  {
    id: "the-day-we-got-lost",
    title: "The Day We Got Lost",
    grades: [4],
    units: [9],
    level: "Level 4",
    description: "A class trip to the capital, one wrong turn, and a map read properly for the first time.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Day We Got Lost is an original Grade 4 story created for Ehel Academy in 2026, book nine of the Grade 4 Amal series, built on the trip to the capital in the Grade 4 Unit 9 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "The Day We Got Lost. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal, Nora and Teacher Yasmin on a capital-city street beside a signpost" },
      { image: "page-02.svg", sound: "bell", text: "Our class took the train to the capital. It was four hours, and I did not sleep for one of them.", alt: "Teacher Yasmin at a map in the classroom with Amal holding her copy" },
      { image: "page-03.svg", sound: "wind", text: "The station was the biggest room I had ever stood in.", alt: "Amal and Nora beside a red train at the station platform" },
      { image: "page-04.svg", sound: "market", text: "Teacher Yasmin gave each pair a map and a meeting time. \"Do not be late. Do not go alone.\"", alt: "An amazed Amal looking up at the tall buildings of the capital with Nora" },
      { image: "page-05.svg", sound: "bell", text: "Nora and I found the museum, the mall, and a restaurant that sold nothing we recognised.", alt: "Teacher Yasmin pointing out the museum to Amal in the capital" },
      { image: "page-06.svg", sound: "market", text: "Then we took one wrong turn, and then another, and the street names stopped matching the map.", alt: "Nora pointing along a city street beside the shopping centre and a signpost" },
      { image: "page-07.svg", sound: "wind", text: "We were lost. Properly lost, in a city of two million people.", alt: "A worried Amal and Nora at a four-armed signpost in the capital" },
      { image: "page-08.svg", sound: "bell", text: "Nora did not panic. She found a signpost, then a street name, then the same name on our map.", alt: "Amal and Nora working out their position from the map" },
      { image: "page-09.svg", sound: "bell", text: "We walked back the way the map said, not the way we felt like going. Those are rarely the same.", alt: "Amal pointing the way past the museum towards the signpost with Nora" },
      { image: "page-10.svg", sound: "bell", text: "We reached the meeting point four minutes early. Teacher Yasmin never knew.", alt: "Teacher Yasmin, Amal and Nora all cheering outside the museum" },
      { image: "page-11.svg", sound: "river", text: "On the train home Nora fell asleep against the window and I kept the map.", alt: "Amal holding a shell on the shore with a ferry out on the water" },
      { image: "page-12.svg", sound: "wind", text: "I still have it. There is a small pencil cross where we worked out where we were.", alt: "Amal, Nora and Teacher Yasmin at sunset with the city skyline behind them" },
    ],
  },
  {
    id: "nine-rooms",
    title: "Nine Rooms",
    grades: [4],
    units: [10],
    level: "Level 4",
    description: "Nine units, nine rooms, and everything Amal carried out of each one.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Nine Rooms is an original Grade 4 story created for Ehel Academy in 2026, book ten of the Grade 4 Amal series and the close of the Grade 4 shelf, built on the Year 4 Exhibition and the poem \"Nine Rooms\" in the Grade 4 Unit 10 readings. Story and vector illustrations by Ehel Academy Learning Studio. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Nine Rooms. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the Year 4 Exhibition with bunting, easels, Amal and Maya" },
      { image: "page-02.svg", sound: "bell", text: "It was the last week of Year 4, and Teacher Yasmin gave us the Exhibition.", alt: "Teacher Yasmin presenting the project brief while Amal holds her notes" },
      { image: "page-03.svg", sound: "bell", text: "\"Nine units,\" she said. \"Think of them as nine rooms. Show me what is in each one.\"", alt: "Nine numbered cutaway rooms across the wall with Teacher Yasmin pointing" },
      { image: "page-04.svg", sound: "bell", text: "In the first room: Omar at the post counter, and a letter that made somebody feel remembered.", alt: "Amal with her exhibition page at the post counter beside Omar" },
      { image: "page-05.svg", sound: "rain", text: "In the second: a storm, a tent, and a girl who brought a plastic sleeve.", alt: "Amal holding her page in front of the science tent on the field" },
      { image: "page-06.svg", sound: "bird", text: "In the third: a field, a market, a kitchen, and everything in between.", alt: "Amal with her page beside the farm field and a mango" },
      { image: "page-07.svg", sound: "market", text: "In the fourth: a library that arrives on Thursdays with one squeaky wheel.", alt: "Maya and Amal beside the library cart on the street" },
      { image: "page-08.svg", sound: "market", text: "In the fifth: a race nobody won, and a goat worth more than winning. In the sixth: a parade, and a page of names.", alt: "Amal cheering beside a parade banner under bunting" },
      { image: "page-09.svg", sound: "bell", text: "In the seventh: a curtain opening, and Sami saying every line.", alt: "Sami cheering on the stage with Amal holding her exhibition page" },
      { image: "page-10.svg", sound: "crickets", text: "In the eighth: a telescope, an attic, and a great-uncle who learned the stars from a book.", alt: "Amal with her page in the attic beside the telescope and the old boxes" },
      { image: "page-11.svg", sound: "market", text: "In the ninth: a map with a pencil cross on it.", alt: "Amal holding her page in the capital beside the museum and a signpost" },
      { image: "page-12.svg", sound: "bell", text: "On Exhibition evening I walked people through all nine rooms. It took a while. I did not hurry once.", alt: "Exhibition evening with bunting and confetti, Amal presenting while Teacher Yasmin, Maya and Nora cheer" },
    ],
  },
  // ---- Grade 4, Units 1-3: the four extra books on each unit's shelf. Each is
  // built on one of the unit's remaining readings, so the five books on a unit
  // cover the whole unit rather than five versions of its closing story.
  {
    id: "amals-steady-day",
    title: "Amal's Steady Day",
    grades: [4],
    units: [1],
    level: "Level 4",
    description: "One ordinary day, from the first sweep of the floor to the last quiet page before bed.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal's Steady Day is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 1 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 1 reading \"My Daily Routine\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Amal's Steady Day. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal walking to school at sunrise with her friend Maya, her bag on her shoulder" },
      { image: "page-02.svg", sound: "lullaby", text: "Amal wakes up early, before anybody else in the house is ready.", alt: "Amal getting up in a quiet room while the sky outside is still pale" },
      { image: "page-03.svg", sound: "bell", text: "First she helps her mother sweep the floor. It is a small task, but small tasks show real effort.", alt: "Amal sweeping the kitchen floor while her mother stands beside her" },
      { image: "page-04.svg", sound: "bell", text: "Then she boils the water for the morning tea, standing well back from the hot pot.", alt: "Amal watching a pot on the stove with her mother close beside her" },
      { image: "page-05.svg", sound: "bell", text: "She folds her school clothes neatly and packs her bag. She checks twice that her reading book is inside.", alt: "Amal folding her clothes beside her open school bag and a shelf of books" },
      { image: "page-06.svg", sound: "bird", text: "Amal walks to school with Maya. They talk about their homework the whole way, and the road is never long.", alt: "Amal and Maya walking along the town street together with their bags" },
      { image: "page-07.svg", sound: "bell", text: "She likes to arrive early. There is time to greet Teacher Yasmin and put her books away calmly, instead of rushing.", alt: "Amal greeting Teacher Yasmin at the classroom bookshelf" },
      { image: "page-08.svg", sound: "bell", text: "In class there is a daily reading time. For a few quiet minutes Amal loses herself in a story.", alt: "Amal reading at her desk while the classroom is quiet around her" },
      { image: "page-09.svg", sound: "ball", text: "At break she plays with Sami and Theo. She never forgets that the bell will ring soon.", alt: "Amal, Sami and Theo playing with a ball in the school yard" },
      { image: "page-10.svg", sound: "bell", text: "After school come the chores, and then the homework. Amal does both before she allows herself to rest.", alt: "Amal at the table at home with her work in front of her and a broom by the door" },
      { image: "page-11.svg", sound: "lullaby", text: "In the evening she keeps a balance. There is still a little time to draw, or to read something just for fun.", alt: "Amal drawing at the table in the warm evening light" },
      { image: "page-12.svg", sound: "crickets", text: "\"If I use my time well, I can do it all,\" Amal says. She goes to bed proud of a steady, usual day.", alt: "Amal outside her lit home under a starry sky at the end of the day" },
    ],
  },
  {
    id: "may-i-interview-you",
    title: "May I Interview You?",
    grades: [4],
    units: [1],
    level: "Level 4",
    description: "Amal takes her notebook to the post counter and asks Omar every question on her list.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "May I Interview You? is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 1 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 1 playscript \"An Interview\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "May I Interview You? Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding her notebook at the post counter while Omar works behind it" },
      { image: "page-02.svg", sound: "market", text: "\"May I interview you for my school report?\" Amal asked.", alt: "Amal asking Omar a question outside his market stall" },
      { image: "page-03.svg", sound: "bell", text: "\"Of course. That sounds like a good project. Come and sit by the counter while I finish weighing this parcel.\"", alt: "Omar pointing to a seat beside the counter with parcels stacked on it" },
      { image: "page-04.svg", sound: "bell", text: "\"What do you do in your daily work?\" \"I sort the mail, help people send letters, and serve customers.\"", alt: "Omar behind the counter with a letter lying on it and Amal writing" },
      { image: "page-05.svg", sound: "lullaby", text: "\"I also read letters aloud for neighbours who find long words difficult,\" Omar said.", alt: "Omar reading an open letter aloud while Grandmother Salma listens" },
      { image: "page-06.svg", sound: "bell", text: "\"Why is mail still important?\" \"Because not everyone owns a phone. A letter can make someone feel remembered.\"", alt: "Amal writing in her notebook while Omar holds a sealed letter" },
      { image: "page-07.svg", sound: "market", text: "\"Do you always work here alone?\" \"Mostly. But a good citizen from the market often stops to help me carry the heavier parcels.\"", alt: "Omar and Karim the carpenter talking in the market while Amal listens" },
      { image: "page-08.svg", sound: "bell", text: "\"How do you keep going when the shop is busy?\" \"I work at a steady speed, and I never leave a job half done.\"", alt: "Omar working at a counter piled with five parcels" },
      { image: "page-09.svg", sound: "bell", text: "\"Is it hard to serve people who speak a different language?\" \"Not for me. I learned two, so I can help almost anyone.\"", alt: "Omar serving a customer at the counter while Amal writes" },
      { image: "page-10.svg", sound: "bell", text: "\"What do you enjoy most?\" \"Watching a worried customer smile again, once their letter is safely on its way.\"", alt: "Omar with his arms raised beside an open letter on the counter" },
      { image: "page-11.svg", sound: "bell", text: "Amal read every answer back to him before she left, so that nothing in her report would be unfair.", alt: "Amal reading from her notebook to Omar across the counter" },
      { image: "page-12.svg", sound: "lullaby", text: "At home she copied it out neatly. She had come to the counter for answers, and she had learned how to ask.", alt: "Amal writing her report at the table at home beside a shelf of books" },
    ],
  },
  {
    id: "the-writing-contest",
    title: "The Writing Contest",
    grades: [4],
    units: [1],
    level: "Level 4",
    description: "A dictionary for the best report in the class, and a week in which everything else still has to be done.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Writing Contest is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 1 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 1 story \"Fair Effort, Daily Gains\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Writing Contest. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal holding her report in the school library with Teacher Yasmin cheering" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin pinned a notice on the door. \"Writing Contest! Write a report about someone in your community. The winner gains a dictionary.\"", alt: "Teacher Yasmin pointing at the contest notice while Amal and Nora read it" },
      { image: "page-03.svg", sound: "bell", text: "Amal wanted that dictionary. She wanted to master new words and improve her own language.", alt: "Amal holding a book and smiling in the classroom" },
      { image: "page-04.svg", sound: "lullaby", text: "She still had homework, chores and her daily reading. \"I must find a balance,\" she told herself.", alt: "Amal at her table at home with her work, a broom leaning nearby" },
      { image: "page-05.svg", sound: "bell", text: "\"Can you manage the contest and your schoolwork?\" her mother asked. \"I will try my best,\" said Amal, \"and I will continue.\"", alt: "Amal's mother speaking to her in the kitchen" },
      { image: "page-06.svg", sound: "market", text: "Many people in the town worked hard, but one stood out: Omar, who ran the market shop and looked after the post counter.", alt: "Omar pointing something out to Amal beside his market stall" },
      { image: "page-07.svg", sound: "bell", text: "After class the next day she walked to the shop with her notebook and asked him for an interview.", alt: "Amal interviewing Omar across the post counter with her notebook open" },
      { image: "page-08.svg", sound: "bell", text: "At home she used every detail. She checked her spelling and kept her handwriting neat, because she wanted the report to be fair and honest.", alt: "Amal writing her report carefully at her desk at home" },
      { image: "page-09.svg", sound: "bell", text: "\"Take your time,\" her father said gently. \"Do not leave out anything important.\" \"I won't. This report has a purpose.\"", alt: "Amal's father reading over her shoulder at home" },
      { image: "page-10.svg", sound: "rain", text: "On the morning of the contest it rained hard. \"It is cancelled!\" shouted Sami. \"Nobody will cancel anything,\" said Teacher Yasmin. \"We will hold it in the library.\"", alt: "Sami shouting in the wet street while Teacher Yasmin answers him calmly" },
      { image: "page-11.svg", sound: "bell", text: "The class sat in a circle and read in turn. Nora forgot two of her lines. Amal waited quietly, and when her turn came she read clearly.", alt: "Nora, Amal and Teacher Yasmin in the library between the bookshelves" },
      { image: "page-12.svg", sound: "bell", text: "\"The winner is Amal. Her report was honest, clear and full of meaning.\" She opened her new dictionary and found the word effort: work done with care.", alt: "Amal holding her new dictionary with her arms raised under bunting and falling confetti" },
    ],
  },
  {
    id: "two-languages-at-the-counter",
    title: "Two Languages at the Counter",
    grades: [4],
    units: [1],
    level: "Level 4",
    description: "A customer who cannot read the form, and the second language Omar learned so that nobody would leave without help.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Two Languages at the Counter is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 1 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on Omar's own answer in the Unit 1 readings: that he had to master two languages so that nobody leaves the counter without help. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "Two Languages at the Counter. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Omar serving a new customer at the post counter while Amal waits behind him" },
      { image: "page-02.svg", sound: "market", text: "The market was busy, and a queue had grown at the post counter.", alt: "A line of people waiting on the town street outside Omar's shop" },
      { image: "page-03.svg", sound: "bell", text: "A man near the front held a form he could not fill in. He turned it over twice and said nothing at all.", alt: "A worried customer at the counter holding a printed form" },
      { image: "page-04.svg", sound: "bell", text: "Omar looked up. \"Good morning,\" he said — and then he said it again, in the man's own language.", alt: "Omar greeting the customer, who looks up in surprise" },
      { image: "page-05.svg", sound: "bell", text: "The man's shoulders dropped. He began to talk quickly, and Omar wrote the address down for him, letter by letter.", alt: "Omar filling in the form while the customer explains" },
      { image: "page-06.svg", sound: "bell", text: "Amal was waiting behind him with a parcel for her cousin. She had never heard Omar speak that language before.", alt: "Amal watching from the back of the queue with her notebook" },
      { image: "page-07.svg", sound: "market", text: "\"How many languages do you know?\" she asked, when it was her turn. \"Two,\" said Omar. \"I had to master the second one.\"", alt: "Amal asking Omar a question beside the fruit at his stall" },
      { image: "page-08.svg", sound: "bell", text: "\"Why did you have to?\" \"Because people come to this counter who cannot read the form. It is necessary, so that nobody leaves without help.\"", alt: "Omar explaining across the counter while Amal writes it down" },
      { image: "page-09.svg", sound: "bell", text: "\"Was it hard?\" \"It took a year of daily effort,\" he said. \"I learned ten words a week, and I kept going.\"", alt: "Omar at the counter with a letter floating in a thought bubble above him" },
      { image: "page-10.svg", sound: "market", text: "By midday he had served a woman in one language and her neighbour in the other, without ever losing his patient smile.", alt: "Omar with his arms raised between two customers at the market stalls" },
      { image: "page-11.svg", sound: "bell", text: "Amal wrote one line in her notebook: a language is a door, and Omar keeps two of them open.", alt: "Amal writing in her notebook beside the counter, an open letter behind her" },
      { image: "page-12.svg", sound: "lullaby", text: "That evening she began a list of her own. Ten new words a week, she wrote at the top. It was a fair place to start.", alt: "Amal starting her word list at the table at home beside a shelf of books" },
    ],
  },
  {
    id: "weather-around-the-world",
    title: "Weather Around the World",
    grades: [4],
    units: [2],
    level: "Level 4",
    description: "Fog, sun, snow, hail and a tornado — the whole sky, drawn for one science-fair display.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Weather Around the World is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 2 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 2 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "Weather Around the World. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora beside the lake with a globe and a grey cloud above them" },
      { image: "page-02.svg", sound: "bell", text: "Weather is not the same everywhere. Amal and Nora set out to draw every kind of weather they could find.", alt: "Amal and Nora planning their display in the classroom beside a globe" },
      { image: "page-03.svg", sound: "wind", text: "In some places the morning is foggy and grey, and people walk slowly along the path until the mist begins to lift.", alt: "Amal and Nora standing on a hillside path lost in thick grey fog" },
      { image: "page-04.svg", sound: "sun", text: "In others a hot sun makes people sweat, especially where dry canyons stretch for miles under a clear sky.", alt: "Amal pointing along a deep red canyon with a thread of river at the bottom" },
      { image: "page-05.svg", sound: "bird", text: "Near a quiet bay or a green meadow the weather feels gentler — but even a calm place changes quickly once the wind turns.", alt: "Amal and Nora on the shore with sea birds flying over the bay" },
      { image: "page-06.svg", sound: "wind", text: "High in the mountains snow falls softly and covers the ground in white.", alt: "Amal and Nora standing in falling snow below white mountain peaks" },
      { image: "page-07.svg", sound: "river", text: "Down by the coast, moisture from the sea keeps the air feeling damp all day.", alt: "Amal on the shore under heavy grey clouds rolling in from the sea" },
      { image: "page-08.svg", sound: "rain", text: "Rain helps plants grow, because plants need moisture. Farmers watch the clouds and hope for a steady shower rather than a flood.", alt: "Amal pointing at a ploughed field in the rain with new green shoots in the furrows" },
      { image: "page-09.svg", sound: "wind", text: "Not all weather is gentle. A storm brings rain, but a hurricane brings wind strong enough to bend trees and tear roofs from houses.", alt: "Amal and Nora in a dark storm with heavy rain falling around them" },
      { image: "page-10.svg", sound: "rain", text: "Sometimes hail rattles down from dark clouds like handfuls of small stones.", alt: "Amal looking up in surprise as balls of hail fall out of a dark sky" },
      { image: "page-11.svg", sound: "wind", text: "In open country a tornado can spin across the land faster than almost anything a person has ever seen.", alt: "Nora pointing across a stormy field as dust lifts from the ground" },
      { image: "page-12.svg", sound: "sun", text: "Scientists study the wind, the clouds and the temperature every day. Wherever we live, we watch the sky and learn.", alt: "Amal and Nora cheering beside the lake under a rainbow with their weather chart" },
    ],
  },
  {
    id: "the-foggy-morning",
    title: "The Foggy Morning",
    grades: [4],
    units: [2],
    level: "Level 4",
    description: "A walk up a hill that has almost gone away, and the poem Amal writes when it comes back.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Foggy Morning is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 2 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio; the four-line poem on the last page is the Unit 2 poem of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "The Foggy Morning. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her father on a hillside path in soft grey fog" },
      { image: "page-02.svg", sound: "lullaby", text: "Amal woke before the sun and found the window grey.", alt: "Amal getting up in her room while the window shows only grey" },
      { image: "page-03.svg", sound: "wind", text: "The morning air was damp and cool, and the hills had almost gone away.", alt: "Amal alone on the hillside, the hills behind her lost in fog" },
      { image: "page-04.svg", sound: "bell", text: "\"Walk slowly,\" said her father. \"The path is still there. We simply cannot see all of it at once.\"", alt: "Amal's father pointing along the hidden path while she listens" },
      { image: "page-05.svg", sound: "wind", text: "They went up through the meadow. The grass was wet, and every sound came out soft and slow.", alt: "Amal and her father walking through tall wet grass in the mist" },
      { image: "page-06.svg", sound: "bird", text: "A bird called somewhere above them. They heard it clearly, but they never saw it.", alt: "Amal pointing up into the fog towards a bird she cannot see" },
      { image: "page-07.svg", sound: "wind", text: "The fence came out of the fog one post at a time, like words appearing on a page.", alt: "A fence emerging post by post from the mist beside Amal and her father" },
      { image: "page-08.svg", sound: "tree", text: "A tall tree stood over them, grey at the top and green only where they stood close.", alt: "Amal reaching up towards a tall tree that fades into the fog above" },
      { image: "page-09.svg", sound: "wind", text: "\"Is the hill still up there?\" Amal asked. \"It is,\" said her father. \"Fog hides a thing; it does not take it away.\"", alt: "Amal and her father both pointing up the hidden hillside" },
      { image: "page-10.svg", sound: "sun", text: "Then the mist began to lift. The meadow came back first, then the roofs, then the far blue hills.", alt: "Amal cheering in bright sunshine with a hut and the hills clear behind her" },
      { image: "page-11.svg", sound: "bell", text: "At school Amal wrote what she had seen, and it came out as a poem.", alt: "Amal showing her written page to Teacher Yasmin at her desk" },
      { image: "page-12.svg", sound: "lullaby", text: "\"The morning air is damp and grey, the hills have almost gone away. So still, so quiet, soft and slow — the whole world hides in fog below.\"", alt: "Amal holding her poem on the foggy hillside beside it pinned up on a board" },
    ],
  },
  {
    id: "the-weather-report",
    title: "The Weather Report",
    grades: [4],
    units: [2],
    level: "Level 4",
    description: "A morning at the radio desk beside the lake, and a storm that arrives exactly when the report says it will.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Weather Report is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 2 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 2 listening text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Weather Report. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora at the radio weather desk beside the microphone and the on-air lamp" },
      { image: "page-02.svg", sound: "river", text: "The weather desk stands in a small room beside the lake. Every morning somebody sits down and tells the whole town what the sky is doing.", alt: "Teacher Yasmin pointing towards the small weather station beside the lake" },
      { image: "page-03.svg", sound: "bell", text: "Today Teacher Yasmin's class had been invited to watch. Amal was allowed to hold the script.", alt: "Amal and Leo at the radio desk while Teacher Yasmin points out the equipment" },
      { image: "page-04.svg", sound: "wind", text: "\"Good morning, listeners. It is foggy near the lake this morning, so please walk slowly and take care on the path until the mist clears.\"", alt: "Grandmother Salma walking slowly past a lamp post in thick fog" },
      { image: "page-05.svg", sound: "sun", text: "\"By midday the sun will come out, and it will be warm and pleasant for anyone visiting the meadow or the bay.\"", alt: "Nora with her arms raised in the sunshine beside the lake" },
      { image: "page-06.svg", sound: "river", text: "\"The breeze may pick up a little near the water,\" she said, \"so hold on to your hat.\"", alt: "Amal on the shore watching a small sailing boat out on the water" },
      { image: "page-07.svg", sound: "rain", text: "\"But the weather will not stay calm all day. Tonight a storm may bring rain and hail. Bring your washing in early and shut your windows tight.\"", alt: "Amal's mother pointing at the house as rain sweeps across the garden" },
      { image: "page-08.svg", sound: "wind", text: "\"If you hear thunder, go inside and stay calm — and never shelter under a tall tree during a storm.\"", alt: "Amal looking up in surprise at a tree bending in the storm" },
      { image: "page-09.svg", sound: "bell", text: "Amal looked up from the script. That last line was the one her class had learned only the week before.", alt: "Amal at the radio desk pointing at the line on her script" },
      { image: "page-10.svg", sound: "sun", text: "\"Tomorrow should be calmer, with light cloud in the morning and clearer skies by the afternoon.\"", alt: "Leo cheering under a thin cloud with sunshine breaking through" },
      { image: "page-11.svg", sound: "bird", text: "\"Farmers near the canyon fields will be glad of a little extra moisture after such a dry week. That is all from the weather desk today.\"", alt: "Karim raising his arms beside a ploughed field with new shoots in it" },
      { image: "page-12.svg", sound: "lullaby", text: "That night the storm came exactly as the report had said. Amal shut her window, and she was not frightened at all.", alt: "Amal calm in her room at home with the night outside" },
    ],
  },
  {
    id: "the-science-fair-poster",
    title: "The Science Fair Poster",
    grades: [4],
    units: [2],
    level: "Level 4",
    description: "One afternoon to finish the poster, and two friends who decide to explain it instead of reading it out.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Science Fair Poster is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 2 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 2 dialogue \"Two Friends at the Science Fair\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Science Fair Poster. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora with their poster on an easel beside the science tent" },
      { image: "page-02.svg", sound: "bell", text: "Amal and Nora had one afternoon left to finish their science-fair poster.", alt: "Amal and Nora working at an easel in the classroom" },
      { image: "page-03.svg", sound: "wind", text: "\"Look at our poster,\" said Amal. \"A tornado spins faster than any other storm.\"", alt: "Amal pointing at the tornado on their poster" },
      { image: "page-04.svg", sound: "wind", text: "\"Yes,\" said Nora, \"and a hurricane is stronger than a normal storm. The volcano is the most powerful of all.\"", alt: "Nora pointing at the volcano on the poster" },
      { image: "page-05.svg", sound: "sun", text: "\"I still love the canyon picture best,\" Amal said. \"It shows just how deep a canyon can be — deeper even than the lake.\"", alt: "Amal and Nora looking at the canyon picture on the easel" },
      { image: "page-06.svg", sound: "river", text: "\"True. But look at our moisture chart. It shows how rain forms over the bay and drifts across the meadow.\"", alt: "Nora pointing at their weather chart while Amal watches" },
      { image: "page-07.svg", sound: "rain", text: "\"Do you remember when hail fell on the school roof last week? It rattled like tiny stones for ten whole minutes.\"", alt: "Amal and Nora surprised as hail falls past them" },
      { image: "page-08.svg", sound: "bird", text: "\"I do. My little brother roamed around the garden afterwards, collecting the biggest pieces before they melted.\"", alt: "Nora pointing out Idris in the garden among the plants" },
      { image: "page-09.svg", sound: "bell", text: "\"We should tell visitors that a storm can be dangerous,\" said Amal, \"but that we can stay safe if we watch the sky.\"", alt: "Amal pointing at the safety notes on the poster while Nora listens" },
      { image: "page-10.svg", sound: "bell", text: "\"Good idea. Let us practise our safety facts once more before the judges arrive.\"", alt: "Nora holding her notes while Amal listens beside a desk" },
      { image: "page-11.svg", sound: "bell", text: "They said them twice through, and the second time neither girl needed to look.", alt: "Amal and Nora with their arms raised in the empty classroom" },
      { image: "page-12.svg", sound: "sun", text: "When the judges came, the two friends did not read their poster aloud. They explained it, and that was better.", alt: "Amal and Nora presenting to Teacher Yasmin beside the science tent under bunting" },
    ],
  },
  {
    id: "the-bitter-lunch",
    title: "The Bitter Lunch",
    grades: [4],
    units: [3],
    level: "Level 4",
    description: "A sandwich that looked fine, a night that did not, and the story Amal writes about it afterwards.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Bitter Lunch is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 3 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 3 story of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "The Bitter Lunch. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal outside the village bakery while Omar warns her about the meat" },
      { image: "page-02.svg", sound: "river", text: "Amal lived beside the river, where the fields were hot and green. She helped Grandma Hana grow rice and care for the cattle.", alt: "Amal and Grandma Hana beside the river with the rice field behind them" },
      { image: "page-03.svg", sound: "hen", text: "Every morning before school she fed the animals and carried water from the well. It was hard labour.", alt: "Amal at the farm with a goat and a hen beside the barn" },
      { image: "page-04.svg", sound: "bell", text: "\"We work hard now to eat well later,\" Grandma Hana always said.", alt: "Grandma Hana at the cooking pot in the kitchen with Amal" },
      { image: "page-05.svg", sound: "bell", text: "At school Teacher Yasmin set a project. \"Write a story about food, and give it a health message.\"", alt: "Teacher Yasmin pointing at a health poster on the classroom wall" },
      { image: "page-06.svg", sound: "crunch", text: "That evening Amal walked to the bakery. It smelled of warm bread, and she was hungry, so she bought a sandwich.", alt: "Amal outside the bakery holding her list" },
      { image: "page-07.svg", sound: "market", text: "\"I should tell you,\" said Omar, \"this meat is not fresh.\" Amal was too hungry to care.", alt: "Omar warning Amal beside a tray of food outside the bakery" },
      { image: "page-08.svg", sound: "bell", text: "At home her cousin Noah frowned at it. \"There is a strange smell.\" \"You worry too much,\" said Amal, and she ate the rest.", alt: "Noah pointing unhappily at the food on the table while Amal eats" },
      { image: "page-09.svg", sound: "crickets", text: "Late that night her stomach hurt badly. Noah heard her and woke the family.", alt: "Amal unwell in her room at night while Noah looks on in alarm" },
      { image: "page-10.svg", sound: "bell", text: "At the clinic Doctor Sarah checked her carefully. \"This may be food poisoning. You must always check your food first.\"", alt: "Doctor Sarah examining Amal outside the clinic with her bag beside her" },
      { image: "page-11.svg", sound: "lullaby", text: "The next day Amal stayed at home with warm soup, and she wrote: \"I once ate a bad sandwich. It looked fine, but it was not fresh.\"", alt: "Amal writing at her table at home with a bottle of clean water beside her" },
      { image: "page-12.svg", sound: "market", text: "At the community lunch she read it aloud, and the room went quiet. Then she ate lamb and rice that were clean and fresh.", alt: "Amal reading her story at the community lunch beside Grandma Hana and a tray of food" },
    ],
  },
  {
    id: "the-poster-on-the-wall",
    title: "The Poster on the Wall",
    grades: [4],
    units: [3],
    level: "Level 4",
    description: "Eight lines of advice in bold letters, one more in red pen, and a list copied out with a comma after every item.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Poster on the Wall is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 3 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 3 persuasive text \"A Poster on the Wall\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Poster on the Wall. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the health poster on the classroom wall with Teacher Yasmin and Amal beside it" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin put a new health poster on the classroom wall, and asked every child to read it carefully before break.", alt: "Teacher Yasmin pointing at the poster while Nora and Leo read it" },
      { image: "page-03.svg", sound: "bell", text: "\"Eat fresh food to stay strong. Choose rice, lamb, fruit and vegetables instead of sweets from the shop.\"", alt: "Amal pointing at a tray of fresh food" },
      { image: "page-04.svg", sound: "bell", text: "\"Wash your hands before you eat — and wash every piece of fruit as well, because dust and pesticide can hide on the skin.\"", alt: "Amal beside a bowl of fruit and a bottle of clean water" },
      { image: "page-05.svg", sound: "river", text: "\"Drink clean water every day, to help your brain and your stomach work well.\"", alt: "Amal raising her arms beside a large bottle of clean water in the kitchen" },
      { image: "page-06.svg", sound: "bell", text: "\"Gather your family at the table and share a meal together whenever you can.\"", alt: "Grandma Hana and Amal at the dining table with a tray of food" },
      { image: "page-07.svg", sound: "market", text: "\"Fresh fruit is better than sweets, so keep sweets for special days only.\"", alt: "Omar pointing at the fruit on his market stall while Amal looks" },
      { image: "page-08.svg", sound: "crunch", text: "\"Never eat food that smells strange, or comes from a bakery shelf that has sat out for too long.\"", alt: "Amal looking doubtfully at the bakery window" },
      { image: "page-09.svg", sound: "bell", text: "At the bottom, in red pen, Teacher Yasmin had written one more line: \"A healthy body starts with a healthy plate.\"", alt: "Teacher Yasmin pointing at the red line at the bottom of the poster" },
      { image: "page-10.svg", sound: "bell", text: "\"Ask an adult if you are ever unsure about a food,\" it went on. Amal read the whole poster twice.", alt: "Amal and Mina reading the poster together in the classroom" },
      { image: "page-11.svg", sound: "bell", text: "She copied her favourite line into her notebook, remembering to add a comma after every item in her list.", alt: "Amal writing at her desk with the poster behind her" },
      { image: "page-12.svg", sound: "market", text: "On the way home she stopped at Omar's stall and chose the fruit she had just read about.", alt: "Amal choosing fruit at the market while Omar cheers" },
    ],
  },
  {
    id: "at-the-clinic",
    title: "At the Clinic",
    grades: [4],
    units: [3],
    level: "Level 4",
    description: "Ten questions from Doctor Sarah, one honest answer at a time, and one rule to take home.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "At the Clinic is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 3 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 3 dialogue of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "At the Clinic. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal outside the village clinic with Doctor Sarah and her medical bag" },
      { image: "page-02.svg", sound: "bell", text: "\"Good morning, Amal. How do you feel today?\" asked Doctor Sarah.", alt: "Doctor Sarah greeting Amal inside the clinic" },
      { image: "page-03.svg", sound: "bell", text: "\"Not very well. My stomach hurts, and I feel a little dizzy.\"", alt: "Amal sitting unhappily in the clinic beside the doctor's bag" },
      { image: "page-04.svg", sound: "bell", text: "\"I am sorry to hear that. Can you tell me what you ate?\"", alt: "Doctor Sarah asking Amal a question in the clinic" },
      { image: "page-05.svg", sound: "crunch", text: "\"An old sandwich, last night. It had meat, chewy cheese and spice inside.\"", alt: "Amal remembering the sandwich, shown in a thought bubble above her" },
      { image: "page-06.svg", sound: "bell", text: "\"Was the meat fresh?\" \"No. It smelled strange. But I was very hungry, so I ate it anyway.\"", alt: "Amal answering quietly while Doctor Sarah listens" },
      { image: "page-07.svg", sound: "bell", text: "\"That was not a wise choice,\" said Doctor Sarah. \"When meat is not fresh, chemicals can build up inside it.\"", alt: "Doctor Sarah explaining beside a health poster on the clinic wall" },
      { image: "page-08.svg", sound: "river", text: "\"What should I do now?\" \"Drink plenty of clean water, and rest at home today instead of going to school.\"", alt: "Doctor Sarah pointing at a bottle of clean water while Amal listens" },
      { image: "page-09.svg", sound: "bell", text: "\"You must be more careful. Old food might make you very sick. Always check your food first.\"", alt: "Doctor Sarah giving her advice beside her medical bag" },
      { image: "page-10.svg", sound: "bell", text: "\"I will remember that, Doctor Sarah. Thank you for helping me.\"", alt: "Amal thanking Doctor Sarah in the clinic" },
      { image: "page-11.svg", sound: "market", text: "\"You are welcome. Tell your grandmother to gather only fresh food from the market from now on.\"", alt: "Doctor Sarah pointing at the fresh fruit on the market stall beside Amal" },
      { image: "page-12.svg", sound: "lullaby", text: "Amal walked home slowly, with a bottle of clean water and one clear rule to keep.", alt: "Amal walking home along the town street with her water bottle" },
    ],
  },
  {
    id: "the-market-song",
    title: "The Market Song",
    grades: [4],
    units: [3],
    level: "Level 4",
    description: "A basket, one instruction — bring back only what is fresh — and a rhyme that turns out to be a rule.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Market Song is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 3 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 3 rhyme of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "market", text: "The Market Song. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal at the market stalls with a bowl of fruit and Omar behind his counter" },
      { image: "page-02.svg", sound: "market", text: "On Saturday the whole village goes to the market, and the stalls sing before the people do.", alt: "Grandma Hana and Amal walking between the market stalls" },
      { image: "page-03.svg", sound: "bell", text: "Grandma Hana gave Amal a basket and one instruction: \"Bring back only what is fresh.\"", alt: "Grandma Hana giving Amal her instruction in the kitchen" },
      { image: "page-04.svg", sound: "market", text: "\"Rice and lamb and fresh green peas — gather them with care, if you please!\"", alt: "Amal and Omar with their arms raised beside a tray of food at the market" },
      { image: "page-05.svg", sound: "market", text: "Amal chose the rice first, and let a handful run through her fingers to check it was dry and clean.", alt: "Amal pointing at the sacks on a market stall" },
      { image: "page-06.svg", sound: "market", text: "Omar weighed out the lamb. \"This came in this morning,\" he said. \"Smell it, and you will know.\"", alt: "Omar pointing at the meat tray on his stall while Amal watches" },
      { image: "page-07.svg", sound: "market", text: "The peas were bright green and firm. Amal put back the soft ones without being told.", alt: "Amal choosing from a bowl of fruit and vegetables at the market" },
      { image: "page-08.svg", sound: "river", text: "\"Wash them well and cook them slow — healthy food helps children grow!\"", alt: "Amal at the kitchen worktop with a water bottle and a tray of food" },
      { image: "page-09.svg", sound: "bell", text: "At home she washed every piece under clean water, because dust and pesticide can hide on the skin.", alt: "Amal pointing at the kitchen sink at home" },
      { image: "page-10.svg", sound: "bell", text: "Grandma Hana let her stir the pot. \"Slowly,\" she said. \"Good food is not in a hurry.\"", alt: "Grandma Hana and Amal at the cooking pot in the kitchen" },
      { image: "page-11.svg", sound: "crunch", text: "They ate together at the table, and Amal named every item in her list, with a comma between each one.", alt: "Amal and Grandma Hana at the dining table with a full tray of food" },
      { image: "page-12.svg", sound: "lullaby", text: "That night Amal sang the market song to herself. It was not a poem for school. It was a rule she could remember.", alt: "Amal in her room at home at the end of the day" },
    ],
  },
  {
    id: "maya-the-young-reporter",
    title: "Maya the Young Reporter",
    grades: [4],
    units: [4],
    level: "Level 4",
    description: "A class newspaper written every Monday by somebody who is nine, and the classmate who stops teasing once he reads it.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Maya the Young Reporter is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 4 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 4 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Maya the Young Reporter. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Maya at her classroom desk with her notebook and the class newspaper pinned behind her" },
      { image: "page-02.svg", sound: "bell", text: "Maya is nine years old, and she wants to be a scientist one day.", alt: "Maya standing in the classroom beside a globe" },
      { image: "page-03.svg", sound: "bell", text: "Right now her biggest challenge is the class newspaper she writes every week for Teacher Yasmin's class.", alt: "Maya holding the class newspaper beside Teacher Yasmin" },
      { image: "page-04.svg", sound: "bell", text: "Every Monday she opens her notebook, taps her pencil, and thinks of a good headline before she starts.", alt: "Maya at her desk with her notebook open in front of her" },
      { image: "page-05.svg", sound: "market", text: "She must find real information about her town and share it clearly, so that nobody is left confused.", alt: "Maya interviewing Omar at his market stall with her notebook" },
      { image: "page-06.svg", sound: "market", text: "Last week she learned that the population of her neighbourhood was growing, because new families had come to open shops near the market.", alt: "Maya talking to Theo on the town street outside the new shops" },
      { image: "page-07.svg", sound: "bell", text: "\"That is important news,\" said Teacher Yasmin. \"Write it clearly, and do not judge the new families.\"", alt: "Teacher Yasmin reading over Maya's shoulder at her desk" },
      { image: "page-08.svg", sound: "bell", text: "\"Welcome them,\" she said, \"and ask them what they hope to discover here.\"", alt: "Teacher Yasmin pointing at a poster while Maya listens" },
      { image: "page-09.svg", sound: "bell", text: "Maya wrote her report neatly, choosing each word with care.", alt: "Maya writing at her desk beside a shelf of books" },
      { image: "page-10.svg", sound: "bell", text: "She erased every mistake before she stuck the pages onto the notice board, because a good reporter checks her own work twice.", alt: "Maya pointing at her finished report on the notice board" },
      { image: "page-11.svg", sound: "bell", text: "Sami leaned over her desk. \"A newspaper written by a nine-year-old?\" he laughed.", alt: "Sami laughing with his arms up beside Maya's desk" },
      { image: "page-12.svg", sound: "bell", text: "Then he sat down and read it, word by word. \"This is high-quality work,\" he said. \"Can I help you next week? I have an idea too.\"", alt: "Sami holding the newspaper while Maya raises her arms beside the notice board" },
    ],
  },
  {
    id: "the-town-meeting",
    title: "The Town Meeting",
    grades: [4],
    units: [4],
    level: "Level 4",
    description: "A new community centre with a reading room, a clinic and an open hall — and no priority list at the door.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Town Meeting is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 4 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 4 listening text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Town Meeting. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the mayor addressing the town hall with rows of chairs in front of him" },
      { image: "page-02.svg", sound: "bell", text: "\"Good evening, everyone, and thank you for coming to the town hall tonight,\" said the mayor.", alt: "The mayor speaking to the rows of chairs in the town hall" },
      { image: "page-03.svg", sound: "bell", text: "\"I want to share some information about our new community centre, which opens next month near the market square.\"", alt: "The mayor pointing at a plan on the hall wall while Amal listens" },
      { image: "page-04.svg", sound: "bell", text: "\"First, there is a reading room, and there are many books already stacked on the new shelves.\"", alt: "The librarian holding a book beside two full bookshelves in the hall" },
      { image: "page-05.svg", sound: "bell", text: "\"Then, there is a small clinic, where a nurse will give health advice every morning.\"", alt: "Doctor Sarah pointing at the small clinic front with her bag beside her" },
      { image: "page-06.svg", sound: "bell", text: "\"Finally, there is an open hall for meetings, lessons and community events. This whole centre is a service for all of us.\"", alt: "The empty town hall filled with rows of chairs under bunting" },
      { image: "page-07.svg", sound: "bell", text: "A woman near the front raised her hand. \"Will the reading room be open for children after school?\"", alt: "A woman with her hand raised among the chairs while the mayor listens" },
      { image: "page-08.svg", sound: "bell", text: "\"Yes,\" the mayor replied. \"Every child in the population of our town is welcome, and there is no priority list.\"", alt: "The mayor answering while Mina stands among the chairs" },
      { image: "page-09.svg", sound: "bell", text: "\"Everyone may come,\" he said, and for a moment the hall was quiet.", alt: "The mayor standing alone beside three rows of chairs" },
      { image: "page-10.svg", sound: "bell", text: "An older man called out, \"How will we know when it opens?\"", alt: "Karim the carpenter calling out with his arms raised among the chairs" },
      { image: "page-11.svg", sound: "bell", text: "\"Please spread the news, tell your neighbours, and bring your ideas to the next meeting.\"", alt: "The mayor pointing at Maya, who is writing in her notebook" },
      { image: "page-12.svg", sound: "bell", text: "\"Communication is how a community grows strong,\" said the mayor, \"and this centre belongs to every one of you.\"", alt: "The mayor with his arms raised over a full hall of chairs, confetti in the air" },
    ],
  },
  {
    id: "the-circular-plan",
    title: "The Circular Plan",
    grades: [4],
    units: [4],
    level: "Level 4",
    description: "A news wheel by the school gate that anybody can spin — and, in the end, add a page to.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Circular Plan is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 4 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 4 story of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Circular Plan. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the six-part circular news wheel by the school gate with Amal and Nora beside it" },
      { image: "page-02.svg", sound: "bell", text: "Teacher Yasmin wrote the week's challenge on the board: \"Create a way to share information with the community.\"", alt: "Teacher Yasmin pointing at the classroom board while Amal reads it" },
      { image: "page-03.svg", sound: "bell", text: "\"Do you mean a newspaper?\" asked Amal. \"Something like that. But you must use what you already know.\"", alt: "Amal with her hand up in class while Teacher Yasmin answers" },
      { image: "page-04.svg", sound: "bell", text: "The students talked at break. \"We could build one enormous sign!\" said Leo. \"People will just walk past it,\" said Nora.", alt: "Leo, Nora and Amal arguing about the plan in the school yard" },
      { image: "page-05.svg", sound: "bell", text: "\"It has to be circular,\" Amal added. \"That is my rule.\" \"Why circular?\" Leo teased. Amal only smiled.", alt: "Amal pointing while a circle of coloured wedges floats in a thought bubble above her" },
      { image: "page-06.svg", sound: "bell", text: "After school she went to the town library and looked at the location of every shelf, news board and reading chair.", alt: "Amal in the library between the shelves with the book cart beside her" },
      { image: "page-07.svg", sound: "bell", text: "\"Good service always starts small,\" the librarian said kindly.", alt: "The librarian pointing something out to Amal between the shelves" },
      { image: "page-08.svg", sound: "bell", text: "Amal stopped at the school gate. \"Everybody passes this spot,\" she whispered. \"This is the right location.\"", alt: "Amal standing alone by the school fence on the town street" },
      { image: "page-09.svg", sound: "bell", text: "The next day they brought cardboard, tape, scissors and markers. Amal drew the circle. Leo wrote the headlines. Nora added a comic.", alt: "Amal, Leo and Nora building the news wheel beside the gate" },
      { image: "page-10.svg", sound: "bell", text: "\"Check your spelling before you stick anything down,\" said Teacher Yasmin, \"and do not forget to erase the pencil lines.\"", alt: "Teacher Yasmin pointing at the news wheel while Amal holds her page" },
      { image: "page-11.svg", sound: "bell", text: "By Friday it stood by the gate. \"Turn it,\" Amal explained, \"and read what is on each side.\"", alt: "Amal explaining the news wheel to her mother beside the school gate" },
      { image: "page-12.svg", sound: "bell", text: "\"It is not about how big the quantity is,\" said Nora. \"It is about what people learn.\" People stopped, spun the circle, and sometimes added a page of their own.", alt: "Amal and Nora celebrating beside the news wheel with confetti in the air" },
    ],
  },
  {
    id: "samis-first-story",
    title: "Sami's First Story",
    grades: [4],
    units: [4],
    level: "Level 4",
    description: "Sami promised Maya an idea for the newspaper. Now it is Monday, and he has to find one.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Sami's First Story is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 4 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the promise Sami makes at the end of the Unit 4 reading \"Maya the Young Reporter\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Sami's First Story. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Sami with a notebook beside Maya, who is holding the class newspaper" },
      { image: "page-02.svg", sound: "bell", text: "Sami had promised Maya an idea for a story, and now it was Monday.", alt: "Sami standing at the front of the classroom beside a poster" },
      { image: "page-03.svg", sound: "bell", text: "\"What is your story about?\" Maya asked, opening her notebook. Sami went quiet.", alt: "Maya waiting with her notebook while Sami looks uncomfortable" },
      { image: "page-04.svg", sound: "market", text: "\"I do not know yet,\" he admitted. \"Teasing you was easier than writing.\"", alt: "Sami and Maya standing among the market stalls" },
      { image: "page-05.svg", sound: "bell", text: "\"Then start where I start,\" said Maya. \"Find real information, and share it clearly.\"", alt: "Maya pointing at her notebook while Sami listens in the classroom" },
      { image: "page-06.svg", sound: "market", text: "They walked to the market together, and Sami counted the stalls: nineteen, and four of them new.", alt: "Sami counting the stalls with his notebook while Maya watches" },
      { image: "page-07.svg", sound: "market", text: "He asked Karim the carpenter how long he had mended stalls in the square. \"Eleven years,\" said Karim. Sami wrote it down.", alt: "Karim answering Sami's question at his stall in the market" },
      { image: "page-08.svg", sound: "bell", text: "\"That is a fact,\" said Maya. \"A fact is where a story begins.\"", alt: "Maya pointing something out to Sami on a bench in the town street" },
      { image: "page-09.svg", sound: "bell", text: "Sami wrote his first draft that evening. It had a good idea in it and eleven spelling mistakes.", alt: "Sami writing at his desk at home beside a shelf of books" },
      { image: "page-10.svg", sound: "bell", text: "He erased every one of them, because a good reporter checks his own work twice.", alt: "Sami looking up in surprise at the page he is correcting" },
      { image: "page-11.svg", sound: "bell", text: "\"Nineteen stalls, and four of them new,\" read his headline. Teacher Yasmin read it twice and nodded.", alt: "Teacher Yasmin pointing at Sami's article while he holds the newspaper" },
      { image: "page-12.svg", sound: "bell", text: "They stuck it on the notice board side by side. \"Next week,\" said Sami, \"I will find the story myself.\"", alt: "Sami cheering beside Maya and their two articles pinned to the board" },
    ],
  },
  {
    id: "the-race-at-the-village-field",
    title: "The Race at the Village Field",
    grades: [4],
    units: [5],
    level: "Level 4",
    description: "A whole village watching, a horse that wants to join in, and a runner who does not look back.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Race at the Village Field is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 5 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 5 recount of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "wind", text: "The Race at the Village Field. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal with her arms raised at the village field while a horse gallops beside the fence" },
      { image: "page-02.svg", sound: "bell", text: "On Saturday morning the whole village gathered at the field for the running race.", alt: "Amal, Nora and Sami waiting under the banner at the village field" },
      { image: "page-03.svg", sound: "bell", text: "Amal stood at the starting line and felt a rush of pressure. Her family and her friends had all come to watch.", alt: "Amal looking nervous while her mother and Idris watch from a bench" },
      { image: "page-04.svg", sound: "bell", text: "She checked her shoelaces twice and took a deep breath to stay calm.", alt: "Amal at the starting line with Nora and Leo beside her" },
      { image: "page-05.svg", sound: "bell", text: "Teacher Yasmin blew her whistle, and the runners set off together.", alt: "Teacher Yasmin raising her arms as Amal and Nora start to run" },
      { image: "page-06.svg", sound: "wind", text: "At first Amal ran slowly, saving her energy for the long stretch ahead.", alt: "Amal running steadily across the field with Nora behind her" },
      { image: "page-07.svg", sound: "wind", text: "Then, as the finish line came into view, she began to accelerate.", alt: "Amal running faster with motion arcs and dust behind her" },
      { image: "page-08.svg", sound: "wind", text: "Her heart rate grew faster and faster, and the sound of her own breathing filled her ears.", alt: "Amal running hard past a bench with dust rising behind her" },
      { image: "page-09.svg", sound: "wind", text: "In the next field a horse began to gallop beside the fence, as if it wanted to join the race.", alt: "A horse galloping along the fence in the next field while Amal runs" },
      { image: "page-10.svg", sound: "wind", text: "Amal did not look back, and she did not let it distract her. She ran quickly, but she watched her footing on the uneven grass.", alt: "Amal running past the fence under the race banner" },
      { image: "page-11.svg", sound: "bell", text: "She crossed the finish line first, with her arms high in the air. Her little brother waved a homemade flag.", alt: "Amal and Idris cheering under the banner with confetti in the air" },
      { image: "page-12.svg", sound: "bell", text: "\"You stayed calm under pressure, and you paced yourself perfectly,\" said Teacher Yasmin. \"That is how a good runner races.\"", alt: "Teacher Yasmin congratulating Amal beside a bench at the field" },
    ],
  },
  {
    id: "how-animals-move",
    title: "How Animals Move",
    grades: [4],
    units: [5],
    level: "Level 4",
    description: "A gallop, a spiral, a squeeze and a signal — four animals, and four reasons each one moves that way.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "How Animals Move is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 5 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 5 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bird", text: "How Animals Move. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal with her notebook between a galloping horse and a snail on the grass" },
      { image: "page-02.svg", sound: "bell", text: "Animals move in many different ways, and each way helps them live safely in their world.", alt: "Amal and Nora standing in the field with a notebook open" },
      { image: "page-03.svg", sound: "wind", text: "A horse can gallop swiftly across open grass, using its long legs to cover ground fast.", alt: "A horse galloping across the field past a fence" },
      { image: "page-04.svg", sound: "wind", text: "It runs like that to escape danger — or simply because it enjoys running free.", alt: "A horse galloping across open grass with motion arcs behind it" },
      { image: "page-05.svg", sound: "tree", text: "A snail moves slowly and steadily, tracing a spiral shape into its shell as it grows.", alt: "A large snail on the forest floor beside a fallen branch" },
      { image: "page-06.svg", sound: "bell", text: "A cat will squeeze through a narrow gap in a fence, bending its flexible body to fit through an opening that looks far too small.", alt: "A cat flattening itself to slip through a gap in a fence" },
      { image: "page-07.svg", sound: "bird", text: "Birds often move as a group, and they rely on signals to stay safe.", alt: "Nora pointing up at three birds flying together over the grassland" },
      { image: "page-08.svg", sound: "bird", text: "When one bird spots danger, it may give a signal to warn the others.", alt: "One bird calling to another across the sky above an acacia tree" },
      { image: "page-09.svg", sound: "bird", text: "The whole flock will then fly away together, to prevent being caught by a predator.", alt: "Five birds rising together from the grassland" },
      { image: "page-10.svg", sound: "river", text: "Some animals suffer when there is no water nearby, so they must travel far to find a pool where they can drink and rest.", alt: "Amal pointing at a goat drinking at the edge of a small lake" },
      { image: "page-11.svg", sound: "bell", text: "Amal wrote it all into a fact file: gallop, spiral, squeeze, signal.", alt: "Amal writing at her classroom desk while Nora reads over her shoulder" },
      { image: "page-12.svg", sound: "bird", text: "Watching how animals move teaches us a great deal about the world we share. Every movement has its own purpose in nature.", alt: "Amal with her arms raised in the field between a horse, a cat and a snail" },
    ],
  },
  {
    id: "the-lost-goat",
    title: "The Lost Goat",
    grades: [4],
    units: [5],
    level: "Level 4",
    description: "An empty rope by the well, an afternoon of looking, and one soft sound behind some crates.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Lost Goat is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 5 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 5 listening script of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "goat", text: "The Lost Goat. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Adam searching the market lanes while his little goat waits nearby" },
      { image: "page-02.svg", sound: "goat", text: "Yesterday Adam tied his little goat by the well while he helped at the market.", alt: "Adam standing beside his goat near the market stalls" },
      { image: "page-03.svg", sound: "market", text: "One moment she was there, and the next moment the rope was empty.", alt: "Adam standing alone and startled among the market stalls" },
      { image: "page-04.svg", sound: "market", text: "Adam's heart raced. He began to gaze in every direction, hoping to spot her white coat among the stalls.", alt: "Adam pointing and looking across the market for his goat" },
      { image: "page-05.svg", sound: "market", text: "\"I must find her before dark,\" he said quietly to himself.", alt: "Adam looking worried on the town street outside the shops" },
      { image: "page-06.svg", sound: "bell", text: "He decided to check behind the shops first, where she sometimes liked to hide from the midday sun.", alt: "Adam searching behind the bakery and the market stalls" },
      { image: "page-07.svg", sound: "bell", text: "First he took a quick peek into the narrow alley, moving fast because he was worried, not because he wanted to admire the view. Nothing there.", alt: "Adam looking unhappily down a narrow lane between two blocks" },
      { image: "page-08.svg", sound: "bell", text: "Then he proceeded slowly along the lane behind the bakery, listening carefully for any sound.", alt: "Adam walking slowly past the bakery on the town street" },
      { image: "page-09.svg", sound: "goat", text: "Suddenly he heard a soft sound, like a gentle bleat coming from behind some crates.", alt: "Adam looking up in surprise with a goat pictured in a thought bubble" },
      { image: "page-10.svg", sound: "goat", text: "There she was, calmly chewing on a piece of straw.", alt: "The goat chewing straw beside a haystack while Adam finds her" },
      { image: "page-11.svg", sound: "goat", text: "Adam ran to rescue her. \"I will always defend you,\" he said. \"You gave me such a fright.\"", alt: "Adam with his arms raised beside his goat in the market" },
      { image: "page-12.svg", sound: "lullaby", text: "He carried her home along the quiet lanes, promising himself he would check the rope twice from now on.", alt: "Adam walking home at sunset with his goat beside him and a lit lamp post" },
    ],
  },
  {
    id: "the-posters-for-simba",
    title: "The Posters for Simba",
    grades: [4],
    units: [5],
    level: "Level 4",
    description: "The children make posters for the dog they found in the cave — and then have to decide what to do when nobody comes.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Posters for Simba is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 5 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the poster plan Nora proposes at the end of the Unit 5 story \"The Spiral Cave\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Posters for Simba. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Nora putting up a poster in the town street while Simba the dog watches" },
      { image: "page-02.svg", sound: "river", text: "Simba was safe at Talia's, with clean water and food, and he had already stopped shivering.", alt: "Talia pointing at the thin dog sitting beside a bottle of water" },
      { image: "page-03.svg", sound: "bell", text: "\"Someone might be looking for him,\" said Nora. \"Let us make posters and describe him.\"", alt: "Nora explaining her plan to Amal, who is holding a sheet of paper" },
      { image: "page-04.svg", sound: "bell", text: "So they described him carefully: thin, brown, with one ear that never quite stands up.", alt: "Leo pointing at the dog sitting in the middle of the room" },
      { image: "page-05.svg", sound: "bell", text: "Amal wrote the words. She used every detail, and she checked her spelling twice.", alt: "Amal writing the poster at her classroom desk" },
      { image: "page-06.svg", sound: "bell", text: "Leo drew the picture. It took him three attempts before the ear looked right.", alt: "Leo pointing at his drawing on an easel in the classroom" },
      { image: "page-07.svg", sound: "bell", text: "Nora read the whole thing back to them before they made a single copy.", alt: "Nora reading the poster aloud while Amal points at a line" },
      { image: "page-08.svg", sound: "market", text: "They put one up at the market, one at the school gate, and one in the bakery window.", alt: "Amal putting up a poster beside Omar at the market stalls" },
      { image: "page-09.svg", sound: "bell", text: "Three days went by. Nobody came.", alt: "Leo and Nora looking sadly at the poster on the town street" },
      { image: "page-10.svg", sound: "bell", text: "\"Then he has a home already,\" said Talia. \"He has had one since the day you carried him out.\"", alt: "Talia explaining to Amal while the dog stands beside them" },
      { image: "page-11.svg", sound: "ball", text: "Simba was not thin any more. He could run the length of the yard without stopping once.", alt: "Simba running in the school yard while Amal cheers" },
      { image: "page-12.svg", sound: "bell", text: "They kept one poster — the picture — and pinned it up in the classroom, where everybody could see him.", alt: "Amal, Nora and Leo beside the poster of Simba on an easel in the classroom" },
    ],
  },
  {
    id: "the-people-of-our-town",
    title: "The People of Our Town",
    grades: [4],
    units: [6],
    level: "Level 4",
    description: "The caretaker, the merchant, the carpenter, the engineer, the labourer, the governor and the lawyer — one town, from first light to the streetlamps.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The People of Our Town is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 6 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 6 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The People of Our Town. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the caretaker, the carpenter and the engineer standing together on the town street" },
      { image: "page-02.svg", sound: "bell", text: "Every town is full of people who play important roles.", alt: "Amal pointing along the town street past the crossing" },
      { image: "page-03.svg", sound: "bell", text: "Early in the morning, the caretaker cleans the school before the pupils arrive.", alt: "The caretaker sweeping the empty school corridor with his broom" },
      { image: "page-04.svg", sound: "market", text: "In the market, a merchant sells fresh fruit.", alt: "Omar the merchant pointing at the fruit on his stall" },
      { image: "page-05.svg", sound: "market", text: "Beside him, a carpenter mends a wooden stall with the tools laid out on his bench.", alt: "Karim the carpenter at the market beside his tool bench" },
      { image: "page-06.svg", sound: "river", text: "Near the river, an engineer checks the new bridge, with the plans in her hand and her helmet beside her.", alt: "Elena the engineer holding her plans beside the half-built bridge over the river" },
      { image: "page-07.svg", sound: "river", text: "A labourer carries the heavy stones, and stacks them exactly where she points.", alt: "A labourer working beside the bridge while Elena points" },
      { image: "page-08.svg", sound: "bell", text: "At the town hall, the governor reads a new plan. She is deciding how the town's money should be spent this year.", alt: "The governor reading a plan at a desk in the town hall" },
      { image: "page-09.svg", sound: "bell", text: "Close by, a lawyer helps a family understand the law.", alt: "The lawyer explaining something to a woman in the town hall" },
      { image: "page-10.svg", sound: "bell", text: "He reads the difficult words slowly, until even the youngest child in the room understands.", alt: "The lawyer reading a page aloud to Mina in the town hall" },
      { image: "page-11.svg", sound: "bell", text: "We do not always notice these people.", alt: "Amal standing alone on the quiet town street" },
      { image: "page-12.svg", sound: "lullaby", text: "But our town could not work without them. Every one of them helps us to live, to learn, and to stay safe.", alt: "The caretaker, the carpenter and the engineer on the town street at sunset under a lit lamp" },
    ],
  },
  {
    id: "two-neighbours",
    title: "Two Neighbours",
    grades: [4],
    units: [6],
    level: "Level 4",
    description: "One family ran from danger and one walked towards a dream. They live next door to each other.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Two Neighbours is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 6 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 6 information text \"Two Neighbours: A Refugee and an Immigrant\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Two Neighbours. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Theo and Omar standing between their two houses at the end of the street" },
      { image: "page-02.svg", sound: "bell", text: "Theo and his family are refugees. They left their home because it was not safe.", alt: "Theo standing quietly outside a house on the town street" },
      { image: "page-03.svg", sound: "lullaby", text: "They travelled a long way, crossing three borders and sleeping in strange rooms, before they reached our town.", alt: "Theo and his mother beside a signpost at sunset" },
      { image: "page-04.svg", sound: "bell", text: "Now Theo lives at the end of our street, in a small house with a garden full of tomato plants.", alt: "Theo outside his house with two garden plants growing beside it" },
      { image: "page-05.svg", sound: "bell", text: "He waters them every evening after school.", alt: "Theo pointing at the plants in his garden" },
      { image: "page-06.svg", sound: "bell", text: "Next door lives Omar, who came here as an immigrant.", alt: "Omar standing between the two houses on the street" },
      { image: "page-07.svg", sound: "market", text: "He moved to our town to open a market stall and build a better life.", alt: "Omar pointing at the fruit on his market stall" },
      { image: "page-08.svg", sound: "bell", text: "He wanted his children to grow up somewhere calm and safe, with good schools and kind neighbours.", alt: "Omar and Mina outside the houses on the street" },
      { image: "page-09.svg", sound: "market", text: "Every morning, before the sun is fully up, Omar arranges baskets of mangoes and bags of spices.", alt: "Omar setting out mangoes and a bowl of fruit at his stall" },
      { image: "page-10.svg", sound: "market", text: "He always saves the sweetest fruit for the children on his street.", alt: "Omar handing fruit to Idris and Mina at the market" },
      { image: "page-11.svg", sound: "bell", text: "\"A refugee runs from danger. An immigrant walks towards a dream,\" says Theo's mother. \"We should welcome both.\"", alt: "Theo's mother explaining to him between the two houses" },
      { image: "page-12.svg", sound: "ball", text: "Theo says he is learning to feel at home here, one football match and one new word at a time.", alt: "Theo and Sami cheering over a ball in the school yard" },
    ],
  },
  {
    id: "elenas-bridge",
    title: "Elena's Bridge",
    grades: [4],
    units: [6],
    level: "Level 4",
    description: "An interview at the riverside, six more months of work, and a seat saved at the opening.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Elena's Bridge is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 6 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 6 listening text \"An Interview with a Community Helper\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "river", text: "Elena's Bridge. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Elena the engineer and Nora at the half-built bridge over the river" },
      { image: "page-02.svg", sound: "river", text: "\"Good morning, Elena. Thank you for talking to our school newspaper today.\"", alt: "Nora greeting Elena at the riverside with her notebook open" },
      { image: "page-03.svg", sound: "river", text: "\"What does an engineer do?\" \"An engineer designs and builds things like roads, bridges and machines.\"", alt: "Elena pointing at the bridge while Nora writes, her helmet on the ground" },
      { image: "page-04.svg", sound: "river", text: "\"I am building a new bridge for our town.\"", alt: "Elena pointing along the span of the half-built bridge" },
      { image: "page-05.svg", sound: "wind", text: "\"That sounds like a big job. How long will it take?\" \"About six more months, if the weather stays kind to us.\"", alt: "Elena and Nora at the riverside with a cloud gathering above them" },
      { image: "page-06.svg", sound: "river", text: "\"Where do you work?\" \"Near the river, and sometimes in an office. Today I am standing by the water, checking the plans.\"", alt: "Elena holding her plans at a desk beside the river" },
      { image: "page-07.svg", sound: "river", text: "\"What do you wear to stay safe on the site?\" \"A bright helmet and strong boots, every single day, without exception.\"", alt: "Elena beside the bridge with a bright helmet in the foreground" },
      { image: "page-08.svg", sound: "river", text: "\"Why is your work important?\" \"Because a strong bridge helps people cross the river safely.\"", alt: "Elena pointing across the bridge while a labourer works at the far end" },
      { image: "page-09.svg", sound: "river", text: "\"You mustn't build in a hurry,\" she said. \"You should plan carefully, and check everything twice.\"", alt: "Elena explaining to Nora, who is writing it down" },
      { image: "page-10.svg", sound: "river", text: "\"Thank you, Elena. I can't wait to walk across your bridge when it opens.\"", alt: "Nora with her arms raised at the riverside" },
      { image: "page-11.svg", sound: "river", text: "\"Neither can I, Nora. Save me a seat at the opening.\"", alt: "Elena raising her arms beside Nora at the bridge" },
      { image: "page-12.svg", sound: "bell", text: "Six months later the cones came away, and the whole town walked across together. Nora had saved her a seat.", alt: "The finished bridge under bunting with Nora and Elena cheering at either end" },
    ],
  },
  {
    id: "the-caretakers-keys",
    title: "The Caretaker's Keys",
    grades: [4],
    units: [6],
    level: "Level 4",
    description: "Eleven years of the same corridor, swept before anybody arrives — and the morning somebody finally stops to say thank you.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Caretaker's Keys is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 6 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the line the Unit 6 story ends on: that heroes do not always wear capes, and sometimes carry brooms. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Caretaker's Keys. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of the caretaker in the empty school corridor with his broom and a ring of keys" },
      { image: "page-02.svg", sound: "lullaby", text: "The caretaker reaches the school before anybody else, while the corridor is still dark.", alt: "The caretaker alone in the dim school corridor" },
      { image: "page-03.svg", sound: "bell", text: "He carries a ring of keys, and he knows which key belongs to which door without looking.", alt: "The caretaker holding up a key with the full ring hanging beside him" },
      { image: "page-04.svg", sound: "bell", text: "He unlocks the gate first, so that no child ever waits outside in the rain.", alt: "The caretaker unlocking the school gate on the town street" },
      { image: "page-05.svg", sound: "bell", text: "Then he sweeps the corridor from one end to the other. For eleven years, the same corridor.", alt: "The caretaker sweeping the length of the corridor with his broom" },
      { image: "page-06.svg", sound: "bell", text: "He wipes the board, straightens the chairs, and picks up the paper yesterday's class dropped.", alt: "The caretaker tidying the classroom with his broom beside him" },
      { image: "page-07.svg", sound: "bell", text: "By the time the first bell rings, the school looks as if nobody had ever made a mess in it.", alt: "Amal and Nora walking down the clean corridor past the caretaker" },
      { image: "page-08.svg", sound: "bell", text: "Amal had walked past him a hundred times. On the day of the parade, she finally stopped.", alt: "Amal holding her parade sign beside the caretaker under the bunting" },
      { image: "page-09.svg", sound: "bell", text: "\"Thank you,\" she said. \"I saw your job on a sign this morning, and I had never said it before.\"", alt: "Amal thanking the caretaker with her arms raised on the town street" },
      { image: "page-10.svg", sound: "bell", text: "The caretaker leaned on his broom. \"Nobody notices when a floor is clean,\" he said. \"They only notice when it is not.\"", alt: "The caretaker leaning on his broom in the corridor while Amal listens" },
      { image: "page-11.svg", sound: "bell", text: "\"I noticed,\" said Amal, and she meant it.", alt: "Amal and the caretaker standing together in the corridor" },
      { image: "page-12.svg", sound: "lullaby", text: "Heroes do not always wear capes, she wrote in her journal that night. Sometimes they carry brooms.", alt: "Amal writing in her journal at home beside a shelf of books" },
    ],
  },
  {
    id: "the-day-before-the-test",
    title: "The Day Before the Test",
    grades: [4],
    units: [7],
    level: "Level 4",
    description: "A spelling list, a worry that will not sit still, and two people who know exactly what to say.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Day Before the Test is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 7 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 7 realistic fiction of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Day Before the Test. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal at the kitchen table with her spelling list while her brother Adam sits beside her" },
      { image: "page-02.svg", sound: "bell", text: "Amal sat quietly at the kitchen table, staring at her spelling list.", alt: "Amal alone at the kitchen table holding her list" },
      { image: "page-03.svg", sound: "bell", text: "Tomorrow was her big spelling test, and she felt nervous every time she looked at the long words.", alt: "Amal looking unhappily at the list floating in a thought bubble above her" },
      { image: "page-04.svg", sound: "bell", text: "Her thoughts were anxious ones. What if I forget the words? What if my mind goes blank in front of the whole class?", alt: "Amal in the kitchen with three question marks in a thought bubble above her" },
      { image: "page-05.svg", sound: "bell", text: "Her older brother Adam came in and saw her worried face.", alt: "Adam coming into the kitchen and noticing Amal" },
      { image: "page-06.svg", sound: "bell", text: "\"Don't be so hard on yourself,\" he said kindly, pulling out the chair beside her. \"You have studied every day this week.\"", alt: "Adam pointing at the list on the table while Amal listens" },
      { image: "page-07.svg", sound: "bell", text: "\"I have felt nervous before a test too, and it was fine in the end.\"", alt: "Adam and Amal sitting together in the kitchen" },
      { image: "page-08.svg", sound: "bell", text: "\"Really?\" Amal asked, looking doubtful. \"You always seem so calm.\" \"Everybody feels nervous sometimes.\"", alt: "Amal looking surprised while Adam answers her" },
      { image: "page-09.svg", sound: "bell", text: "\"The trick is not to let the worry win,\" said Adam. Amal was still doubtful, but she felt a little braver.", alt: "Adam pointing while Amal listens in the kitchen" },
      { image: "page-10.svg", sound: "lullaby", text: "After dinner Mum brought her warm milk. \"Be polite to your worry,\" she said. \"Listen to it calmly, then tell it to go to sleep.\"", alt: "Amal's mother beside her at home with a drink on the side" },
      { image: "page-11.svg", sound: "bell", text: "Amal laughed, and the tight feeling in her chest loosened a little. She read her list one more time.", alt: "Amal reading her list at the kitchen table beside a shelf of books" },
      { image: "page-12.svg", sound: "bell", text: "The next morning she walked into the classroom with the words still fresh in her mind. When the test was over, she had remembered every single one.", alt: "Amal cheering at her classroom desk beside Teacher Yasmin" },
    ],
  },
  {
    id: "where-my-family-comes-from",
    title: "Where My Family Comes From",
    grades: [4],
    units: [7],
    level: "Level 4",
    description: "Nora's own page: two languages at home, a grandmother's honey cakes, and a class where everybody comes from somewhere.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Where My Family Comes From is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 7 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on Nora's Unit 7 personal recount of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Where My Family Comes From. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nora with her grandmother at home beside a tray of honey cakes" },
      { image: "page-02.svg", sound: "bell", text: "My name is Nora, and I am proud of who I am.", alt: "Nora with her arms raised in her room at home" },
      { image: "page-03.svg", sound: "river", text: "My family comes from a small town beside the river, where the water moves slowly past old stone bridges.", alt: "Nora standing by the river with two village huts behind her" },
      { image: "page-04.svg", sound: "bell", text: "We speak two languages at home, and only English at school, so my head is always busy switching between them.", alt: "Nora holding a book at her desk beside Teacher Yasmin" },
      { image: "page-05.svg", sound: "bell", text: "On special days my grandmother sits by the window and tells stories about her childhood in that same small town.", alt: "Nora's grandmother telling a story at home while Nora listens" },
      { image: "page-06.svg", sound: "bell", text: "She bakes sweet honey cakes for our guests, and the whole house smells warm.", alt: "Nora's grandmother at the cooking pot with a tray of cakes beside her" },
      { image: "page-07.svg", sound: "bell", text: "\"A guest is a gift,\" my grandmother always says, and she means it.", alt: "Nora's grandmother raising her arms beside a full table at home" },
      { image: "page-08.svg", sound: "bell", text: "Even when visitors arrive without any warning, she never lets anyone leave hungry.", alt: "Nora's grandmother serving Theo at the dining table while Nora watches" },
      { image: "page-09.svg", sound: "bell", text: "My friends come from many ethnic groups: some from the city, some from farming villages, some from countries far across the sea.", alt: "Nora, Maya, Sami and Theo standing together in the school yard" },
      { image: "page-10.svg", sound: "bird", text: "Maya's family speaks three languages, and Sami's grandparents grow olives on a hillside.", alt: "Maya pointing something out to Sami under a mango tree in the yard" },
      { image: "page-11.svg", sound: "bell", text: "At school we sometimes bring food from home to share at lunchtime, and everybody is curious to try something new.", alt: "Nora and Maya beside two trays of shared food in the school hall" },
      { image: "page-12.svg", sound: "bell", text: "We are all different, and I think that is wonderful. Being kind and generous to each other is the most important thing.", alt: "Nora, Maya and Theo cheering under bunting beside a tray of shared food" },
    ],
  },
  {
    id: "getting-ready-for-the-play",
    title: "Getting Ready for the Play",
    grades: [4],
    units: [7],
    level: "Level 4",
    description: "Three things to remember before the curtain goes up, and one answer for the child who asks what happens if he forgets his lines.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Getting Ready for the Play is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 7 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 7 spoken talk of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Getting Ready for the Play. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Teacher Yasmin talking to Amal and Sami in the classroom before the play" },
      { image: "page-02.svg", sound: "bell", text: "\"Good morning, class. Tomorrow is our school play, and I know some of you feel nervous.\"", alt: "Teacher Yasmin addressing Nora and Leo in the classroom" },
      { image: "page-03.svg", sound: "bell", text: "\"That is completely normal. Even actors on the biggest stages feel nervous before the curtain goes up.\"", alt: "Teacher Yasmin pointing at the closed stage curtain" },
      { image: "page-04.svg", sound: "bell", text: "\"Remember three things. First, you have practised hard every single day this week, so you are ready.\"", alt: "Teacher Yasmin pointing at a poster on the classroom wall while Amal listens" },
      { image: "page-05.svg", sound: "bell", text: "\"You know your lines, your songs, and your places on the stage.\"", alt: "Amal, Nora and Sami standing in their places on the lit stage" },
      { image: "page-06.svg", sound: "bell", text: "\"Second, be gentle and polite to each other backstage. It will be busy back there, with costumes, masks and props everywhere.\"", alt: "Teacher Yasmin, Sami and Mina backstage under bunting beside a poster" },
      { image: "page-07.svg", sound: "bell", text: "\"Don't be selfish with the costumes. Share the mirror, and help each other with the buttons you cannot reach.\"", alt: "Nora helping Mina backstage beside a costume board" },
      { image: "page-08.svg", sound: "bell", text: "\"Third, if you make a small mistake, just smile and keep going.\"", alt: "Teacher Yasmin reassuring Leo in the classroom" },
      { image: "page-09.svg", sound: "bell", text: "\"Nobody in the audience will notice a tiny slip if you stay calm.\"", alt: "Amal alone on the lit stage with her arms raised" },
      { image: "page-10.svg", sound: "bell", text: "\"What if I forget my lines completely?\" asked Sami.", alt: "Sami with his hand up and a worried face in the classroom" },
      { image: "page-11.svg", sound: "bell", text: "\"Then look at a friend on stage. We have all practised together, and we will help each other.\"", alt: "Teacher Yasmin answering Sami while Amal listens" },
      { image: "page-12.svg", sound: "bell", text: "\"I am so proud of every one of you. Now, let's do one more run-through before home time.\"", alt: "The whole class with their arms raised on the lit stage as confetti falls" },
    ],
  },
  {
    id: "the-cultural-fair",
    title: "The Cultural Fair",
    grades: [4],
    units: [7],
    level: "Level 4",
    description: "Curious the day before, brave on the day, and eleven questions written down by the end of it.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Cultural Fair is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 7 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 7 dialogue \"A Chat About Feelings\" and the fair the two friends are talking about. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Cultural Fair. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nora and Maya at the cultural fair between two tables of shared food under bunting" },
      { image: "page-02.svg", sound: "bird", text: "\"How do you feel today, Nora?\" asked Maya. \"I feel curious. We are visiting a cultural fair tomorrow.\"", alt: "Maya and Nora talking in the school yard beside a bench" },
      { image: "page-03.svg", sound: "bird", text: "\"Have you ever been to one?\" \"Yes. I went last year, and I felt so proud to show my family's food.\"", alt: "Maya raising her arms in the yard while Nora listens" },
      { image: "page-04.svg", sound: "bird", text: "\"Why are you curious?\" \"Because I have never tried food from so many different places before.\"", alt: "Nora in the yard with a tray of food pictured in a thought bubble above her" },
      { image: "page-05.svg", sound: "bell", text: "\"What did your family bring to the fair?\" \"A big tray of rice and spiced chicken.\"", alt: "Maya pointing at a large tray of food in the school hall" },
      { image: "page-06.svg", sound: "bell", text: "\"My little brother helped carry the plates, even though he felt shy at first.\"", alt: "Maya beside Idris, who looks shy, at the food table" },
      { image: "page-07.svg", sound: "bell", text: "\"Were you nervous standing behind the table?\" \"A little, at the start.\"", alt: "Maya standing alone behind a table of food under bunting" },
      { image: "page-08.svg", sound: "bell", text: "\"But everyone was so polite, and lots of people asked kind questions about our food.\"", alt: "Maya at the table with Grandmother Salma and Theo asking about the food" },
      { image: "page-09.svg", sound: "bird", text: "\"By the end I wasn't nervous at all.\" \"I hope I feel that brave tomorrow.\"", alt: "Maya with her arms raised beside Nora in the school yard" },
      { image: "page-10.svg", sound: "bell", text: "The next day the hall was full of tables, and Nora tried five new foods without once feeling shy.", alt: "Nora cheering beside Mina between two tables of food under bunting" },
      { image: "page-11.svg", sound: "bell", text: "\"Don't be shy about asking people questions,\" Maya had said. \"Most families are proud to talk about where their food comes from.\"", alt: "Maya pointing while Nora writes in her notebook beside a food table" },
      { image: "page-12.svg", sound: "bell", text: "Nora asked eleven of them, and wrote every answer down. Curious, it turned out, was a good way to feel.", alt: "Nora writing at a desk in the hall under bunting with her notebook full" },
    ],
  },
  {
    id: "the-right-tool-for-the-job",
    title: "The Right Tool for the Job",
    grades: [4],
    units: [8],
    level: "Level 4",
    description: "A stapler, a microwave, a briefcase and a factory full of machinery — every tool with its own special job.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Right Tool for the Job is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 8 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 8 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Right Tool for the Job. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal beside a bench holding a stapler, a folder and a briefcase" },
      { image: "page-02.svg", sound: "bell", text: "Every job needs the right tool, and every tool has its own special job to do.", alt: "Amal standing between a desk and a bench of tools" },
      { image: "page-03.svg", sound: "bell", text: "When Amal wants to join her homework pages together, she reaches for a stapler instead of tape or glue.", alt: "Amal pointing at the stapler on the bench in the classroom" },
      { image: "page-04.svg", sound: "bell", text: "A stapler holds pages firmly, without any mess.", alt: "Amal holding her joined pages at her classroom desk" },
      { image: "page-05.svg", sound: "bell", text: "At home, when her mother wants to heat the soup quickly, she uses the microwave rather than lighting the stove.", alt: "Amal's mother pointing at the microwave on the kitchen worktop" },
      { image: "page-06.svg", sound: "bell", text: "It warms the food in just a few minutes.", alt: "Amal's mother beside the lit microwave and a cooking pot" },
      { image: "page-07.svg", sound: "bell", text: "When her father carries his work papers to the office, he keeps them safe and tidy inside a briefcase.", alt: "Amal's father at home beside the bench with the briefcase on it" },
      { image: "page-08.svg", sound: "bell", text: "Even a folder or a plastic shield can be the right tool for a small job, keeping papers neat or protecting something fragile.", alt: "Amal beside the tool bench with a folder and a desk of papers" },
      { image: "page-09.svg", sound: "bell", text: "Big jobs need big machines. In a factory, heavy machinery helps people build cars and lift boxes far too heavy to carry alone.", alt: "A factory with smoking chimneys and a lorry waiting outside" },
      { image: "page-10.svg", sound: "bell", text: "On a farm, a strong crew works together with rakes, shovels and other hardware, sharing the resources they have.", alt: "A labourer and Karim working beside a ploughed field with a tool bench" },
      { image: "page-11.svg", sound: "bell", text: "Whether the job is tiny, like fixing a torn page, or huge, like lifting a car engine, the same rule applies.", alt: "Amal and Leo standing beside the bench of tools" },
      { image: "page-12.svg", sound: "bell", text: "The right tool, used the right way, makes hard work easy, saves valuable time, and keeps everyone safe.", alt: "Amal with her arms raised beside the tool bench and a safety helmet" },
    ],
  },
  {
    id: "a-look-at-the-stars",
    title: "A Look at the Stars",
    grades: [4],
    units: [8],
    level: "Level 4",
    description: "A tool made of curved glass that brings the sky closer, even though nothing up there moves an inch.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "A Look at the Stars is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 8 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 8 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "crickets", text: "A Look at the Stars. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal pointing at the moon beside a telescope on a tripod at night" },
      { image: "page-02.svg", sound: "crickets", text: "On a clear night in the desert, the sky fills with thousands of tiny, twinkling stars.", alt: "Amal and Noah standing under a night sky full of stars and a bright moon" },
      { image: "page-03.svg", sound: "crickets", text: "Long ago, people could only look up with their own eyes, so the moon and the planets stayed small, pale dots.", alt: "Amal pointing up at a small moon far away in the night sky" },
      { image: "page-04.svg", sound: "crickets", text: "Then somebody built the very first telescope — a tool made of curved glass lenses.", alt: "Noah standing beside a telescope on its tripod under the stars" },
      { image: "page-05.svg", sound: "crickets", text: "It helps us see things that are very far away as if they were much nearer.", alt: "Amal beside the telescope with the moon low in the sky behind her" },
      { image: "page-06.svg", sound: "crickets", text: "With a telescope you can see the craters on the moon, dotted across its grey surface like tiny bowls carved into rock.", alt: "A large close view of the moon and its craters filling the night sky" },
      { image: "page-07.svg", sound: "crickets", text: "Turn it towards a planet, and you might spot the rings around it, glowing like a thin, glittering bracelet.", alt: "A ringed planet glowing against the night sky" },
      { image: "page-08.svg", sound: "crickets", text: "Some telescopes are small enough to carry outside in a case.", alt: "Amal beside a telescope and a stack of old boxes under the stars" },
      { image: "page-09.svg", sound: "crickets", text: "Others are so large that scientists build a whole observatory, a round building with a roof that opens, just to hold them steady.", alt: "Amal pointing at a domed observatory with a telescope leaning out of the open roof" },
      { image: "page-10.svg", sound: "crickets", text: "A telescope brings the sky closer, even though the stars and planets never actually move an inch.", alt: "Noah at the telescope with a ringed planet small in the sky above" },
      { image: "page-11.svg", sound: "crickets", text: "It simply gathers more light than our eyes alone ever could, so distant, blurry shapes turn into clear, sharp pictures.", alt: "Amal at the telescope with the moon and a ringed planet in the sky" },
      { image: "page-12.svg", sound: "crickets", text: "Every time astronomers look through one, they learn something new — and the sky turns out to be bigger than we thought.", alt: "Amal and Noah cheering beside the observatory and their telescope" },
    ],
  },
  {
    id: "the-careful-cook",
    title: "The Careful Cook",
    grades: [4],
    units: [8],
    level: "Level 4",
    description: "Ten safe steps at the microwave, from choosing the bowl to stirring the middle before you eat.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Careful Cook is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 8 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 8 listening text \"How to Use the Microwave Safely\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Careful Cook. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Leo at the kitchen worktop beside the microwave with an adult nearby" },
      { image: "page-02.svg", sound: "bell", text: "\"Today I will show you how to use a microwave safely. Listen carefully, and try this at home only with an adult nearby.\"", alt: "Leo's mother pointing at the microwave on the kitchen worktop" },
      { image: "page-03.svg", sound: "bell", text: "\"First, put your food in a bowl or a plate that is safe for the microwave, like glass or certain plastic.\"", alt: "Leo pointing at a tray of bowls beside the open microwave" },
      { image: "page-04.svg", sound: "bell", text: "\"Check the bottom if you are not sure.\"", alt: "Leo looking closely at a bowl in front of the open microwave" },
      { image: "page-05.svg", sound: "bell", text: "\"Never use metal, not even a spoon or a piece of foil, because metal can cause sparks.\"", alt: "Leo's mother pointing at the metal tools on the bench beside the open microwave" },
      { image: "page-06.svg", sound: "bell", text: "\"Next, close the door firmly and set the time. A small bowl of soup needs less time than a big plate of rice.\"", alt: "Leo pointing at the microwave keypad beside a cooking pot" },
      { image: "page-07.svg", sound: "bell", text: "\"While the microwave is running, stay close, so the food does not get too hot or bubble over the sides.\"", alt: "Leo standing beside the lit microwave on the worktop" },
      { image: "page-08.svg", sound: "bell", text: "\"This is a good moment to find a clean utensil, so you are not searching for one with hot hands.\"", alt: "Leo pointing at the tools on the bench while the microwave runs" },
      { image: "page-09.svg", sound: "bell", text: "\"When it beeps, do not rush. Open the door carefully — the bowl will be hot even if the food still looks cool.\"", alt: "Leo opening the lit microwave with a surprised face" },
      { image: "page-10.svg", sound: "bell", text: "\"Use a cloth to take it out — never your bare fingers.\"", alt: "Leo's mother pointing at the open microwave while Leo watches" },
      { image: "page-11.svg", sound: "bell", text: "\"Stir the food with a clean utensil before you eat, because the middle can be much hotter than the edges.\"", alt: "Leo stirring a bowl on the worktop beside a tray and the tool bench" },
      { image: "page-12.svg", sound: "bell", text: "\"Let it cool for a moment if it is steaming. Now you know the safe steps. Enjoy your warm meal!\"", alt: "Leo cheering beside a tray of three warm bowls in the kitchen" },
    ],
  },
  {
    id: "the-helper-vehicles",
    title: "The Helper Vehicles",
    grades: [4],
    units: [8],
    level: "Level 4",
    description: "A helicopter, an ambulance and a fire engine — and the people who keep each one ready.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "The Helper Vehicles is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 8 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 8 song \"The Helper Vehicles Song\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "The Helper Vehicles. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of a helicopter above the town street with an ambulance below it" },
      { image: "page-02.svg", sound: "wind", text: "\"Up goes the helicopter, spinning in the sky.\"", alt: "Amal pointing up at a helicopter flying over the grassland" },
      { image: "page-03.svg", sound: "wind", text: "It carries a doctor to a village the road cannot reach.", alt: "Doctor Sarah holding her papers below a helicopter near a village hut" },
      { image: "page-04.svg", sound: "bell", text: "\"Fast comes the ambulance, hurry, hurry by!\"", alt: "An ambulance driving along the town street past the buildings" },
      { image: "page-05.svg", sound: "bell", text: "Everyone steps back from the road, because the ambulance must not wait.", alt: "Amal and Leo standing well back at the crossing as the ambulance passes" },
      { image: "page-06.svg", sound: "bell", text: "Inside it there is equipment for helping somebody before they reach the hospital.", alt: "Doctor Sarah beside the ambulance with her medical bag on the ground" },
      { image: "page-07.svg", sound: "bell", text: "The fire engine comes next, with its ladder folded flat along the roof.", alt: "A fire engine on the town street beside a lamp post" },
      { image: "page-08.svg", sound: "wind", text: "\"Big machines to help us, working night and day.\"", alt: "A fire engine and an ambulance on the street with a helicopter above them" },
      { image: "page-09.svg", sound: "bell", text: "Somebody drives each one, and somebody keeps each one ready.", alt: "The caretaker standing between an ambulance and a fire engine" },
      { image: "page-10.svg", sound: "bell", text: "Amal watched the ambulance pass the school gate and did not wave. \"They are working,\" she said.", alt: "Amal standing quietly by the school fence as the ambulance passes" },
      { image: "page-11.svg", sound: "bell", text: "\"We have to learn about safety too,\" said Leo, \"so that we do not need an ambulance.\"", alt: "Leo pointing at the crossing while Amal listens and the ambulance passes" },
      { image: "page-12.svg", sound: "bell", text: "\"Thank you to the people who keep us safe this way!\"", alt: "Amal with her arms raised on the street beneath a helicopter, an ambulance and a fire engine" },
    ],
  },
  {
    id: "a-trip-to-the-capital",
    title: "A Trip to the Capital",
    grades: [4],
    units: [9],
    level: "Level 4",
    description: "A train under a big clock, a museum, a glass lift, and a little brother asleep before the journey home.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "A Trip to the Capital is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 9 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 9 recount of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "A Trip to the Capital. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and her mother on the station platform under the big clock, the train waiting" },
      { image: "page-02.svg", sound: "lullaby", text: "Last month my family took a trip to the capital city, and I could not wait to see the tall buildings I had only seen in photos.", alt: "Amal cheering in her room at home before the journey" },
      { image: "page-03.svg", sound: "bell", text: "First we went to the big station and waited for the train under a large clock.", alt: "Amal, her mother and Idris waiting on the platform below the station clock" },
      { image: "page-04.svg", sound: "market", text: "The platform was noisy with travellers carrying suitcases and baskets, and a vendor sold warm bread near the entrance.", alt: "Amal pointing at a bread stall on the platform beside Grandmother Salma" },
      { image: "page-05.svg", sound: "bell", text: "When the train arrived, we found seats near the window.", alt: "Amal and Idris on the platform beside the arriving train" },
      { image: "page-06.svg", sound: "wind", text: "We watched the horizon rush past as green fields slowly turned into rooftops.", alt: "The train passing a ploughed field with city buildings ahead" },
      { image: "page-07.svg", sound: "bell", text: "In the city there was so much to see. We visited a museum full of old maps and tools.", alt: "Amal pointing at the museum in the capital beside a signpost" },
      { image: "page-08.svg", sound: "bell", text: "A kind guide showed us a stone that was thousands of years old.", alt: "Amal's uncle pointing at a map on the museum wall while she looks at it" },
      { image: "page-09.svg", sound: "bell", text: "Then we walked past shops, offices, and a tall building with a glass lift that seemed to touch the sky.", alt: "Amal with her arms raised beside a lift in the capital city street" },
      { image: "page-10.svg", sound: "bell", text: "Tourism brings many people to the capital, so the streets were full, and we held hands so we would not get separated.", alt: "Amal and her mother crossing the busy capital street beside the traffic" },
      { image: "page-11.svg", sound: "market", text: "At the end of the day we ate at a small restaurant near the entrance of the market: rice, grilled fish and cold juice.", alt: "Amal and Idris beside a tray of food at a stall in the capital" },
      { image: "page-12.svg", sound: "lullaby", text: "My little brother fell asleep before we even reached the station. I was tired, but I would like to go again next year.", alt: "Amal on the platform at sunset beside the waiting train and a lit lamp" },
    ],
  },
  {
    id: "living-near-the-equator",
    title: "Living Near the Equator",
    grades: [4],
    units: [9],
    level: "Level 4",
    description: "Long warm days, crops in the afternoon heat, and lorries carrying the factories' goods to every neighbourhood.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Living Near the Equator is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 9 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 9 information text of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "sun", text: "Living Near the Equator. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal pointing at a large globe under a bright sun on the grassland" },
      { image: "page-02.svg", sound: "bell", text: "Kenya sits close to the equator, the imaginary line around the middle of the Earth.", alt: "Teacher Yasmin pointing at a globe in the classroom while Amal watches" },
      { image: "page-03.svg", sound: "sun", text: "Near the equator the sun is strong and the days are warm all year, so people wear light clothes and drink plenty of water.", alt: "Amal standing in the bright sun beside a large water bottle" },
      { image: "page-04.svg", sound: "bell", text: "Farmers still grow crops such as maize, tea and coffee, even when the afternoon heat is at its highest.", alt: "A labourer working beside a ploughed field with new shoots in the furrows" },
      { image: "page-05.svg", sound: "bell", text: "Children walk to school in the early morning, before the sun climbs too high above the horizon.", alt: "Amal and Idris walking to school past the crossing on the town street" },
      { image: "page-06.svg", sound: "bell", text: "In the towns, workers repair the roads and the offices.", alt: "A labourer beside the traffic on the town street with the buildings behind" },
      { image: "page-07.svg", sound: "hen", text: "In the countryside, families care for animals and fields.", alt: "Grandma Hana at the farm with a goat and a hen beside the barn" },
      { image: "page-08.svg", sound: "river", text: "Trains run on the railway, and ships arrive at the coast.", alt: "A ferry on the sea beyond the beach with a train on the sand road" },
      { image: "page-09.svg", sound: "bell", text: "Factories make goods for the whole nation, from cloth and shoes to tools for the farm.", alt: "A factory with smoking chimneys and a lorry waiting outside" },
      { image: "page-10.svg", sound: "market", text: "Lorries carry those goods to markets in every neighbourhood, so shops in small towns and big cities both stay busy.", alt: "Omar beside a lorry unloading at the market stalls" },
      { image: "page-11.svg", sound: "bell", text: "At the weekend some families plan a trip to the museum or the mall.", alt: "Nora and Leo on the street between a shopping centre and a museum" },
      { image: "page-12.svg", sound: "lullaby", text: "Others simply walk out to watch the sun set beyond the fields. Living near the equator means long, warm days — and plenty of time to explore.", alt: "Amal with her arms raised at sunset beside a field and an acacia tree" },
    ],
  },
  {
    id: "making-a-plan",
    title: "Making a Plan",
    grades: [4],
    units: [9],
    level: "Level 4",
    description: "The museum first, then the restaurant near the station — and who brings the map and who brings the notebook.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Making a Plan is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 9 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 9 listening script of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Making a Plan. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Nora and Leo planning their Saturday beneath a map on the classroom wall" },
      { image: "page-02.svg", sound: "bird", text: "\"We're going to explore the capital on Saturday, aren't we?\" asked Nora.", alt: "Nora asking Leo the question on a bench in the school yard" },
      { image: "page-03.svg", sound: "bird", text: "\"Yes! I've been looking forward to it all week,\" said Leo.", alt: "Leo with his arms raised in the school yard" },
      { image: "page-04.svg", sound: "bell", text: "\"First we are going to the museum. I want to see the old maps and the model train.\"", alt: "Leo pointing at the map on the classroom wall while Nora listens" },
      { image: "page-05.svg", sound: "bell", text: "\"That sounds wonderful. Then what?\"", alt: "Nora writing in her notebook at her classroom desk" },
      { image: "page-06.svg", sound: "bell", text: "\"Then we would like to try the new restaurant near the station. My cousin says they serve the best grilled fish in the city.\"", alt: "Leo in the classroom with a tray of food pictured in a thought bubble" },
      { image: "page-07.svg", sound: "bell", text: "\"Shall we go by train, or take the bus from our neighbourhood?\"", alt: "Nora pointing between a town bus and a train on the street" },
      { image: "page-08.svg", sound: "bell", text: "\"Let's take the train. It's faster, and we can watch the horizon from the window.\"", alt: "Leo pointing at the waiting train on the station platform while Nora stands beside him" },
      { image: "page-09.svg", sound: "bell", text: "\"Good idea. Let's arrive early, so we have more time to look around before lunch.\"", alt: "Nora and Leo standing under the station clock on the platform" },
      { image: "page-10.svg", sound: "bell", text: "\"I'll bring the map, so we don't get lost near the station.\"", alt: "Leo pointing at the large map on the classroom wall" },
      { image: "page-11.svg", sound: "bell", text: "\"And I'll bring my notebook, so I can write down three facts from the museum.\"", alt: "Nora writing in her notebook at her desk in the classroom" },
      { image: "page-12.svg", sound: "bird", text: "\"Perfect. Saturday cannot come fast enough!\"", alt: "Leo and Nora cheering in the school yard with confetti in the air" },
    ],
  },
  {
    id: "directions-at-the-mall",
    title: "Directions at the Mall",
    grades: [4],
    units: [9],
    level: "Level 4",
    description: "Take the lift to the second floor, turn left, past the toy shop — and the bookshop is next to the juice stand.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Directions at the Mall is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 9 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 9 listening script of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Directions at the Mall. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal and Noah in the mall corridor between the lift and the fountain" },
      { image: "page-02.svg", sound: "bell", text: "\"Welcome to the mall. We hope you enjoy your visit today.\"", alt: "Amal and Noah standing in the bright mall corridor beside the fountain" },
      { image: "page-03.svg", sound: "bell", text: "\"To find the bookshop, take the lift to the second floor.\"", alt: "Amal pointing at the lift and its lit floor indicator" },
      { image: "page-04.svg", sound: "river", text: "\"While you wait for the lift, you can see the fountain in the corridor below.\"", alt: "Noah pointing at the fountain in the middle of the mall floor" },
      { image: "page-05.svg", sound: "bell", text: "\"When the doors open on the second floor, turn left and walk down the long corridor.\"", alt: "Amal and Noah stepping out of the open lift on the second floor" },
      { image: "page-06.svg", sound: "bell", text: "\"Go past the toy shop and the phone stand.\"", alt: "Noah pointing at a shop display along the mall corridor" },
      { image: "page-07.svg", sound: "bell", text: "\"The bookshop is near the entrance, next to the juice stand, and you will see its blue sign from a distance.\"", alt: "Amal cheering beside two full bookshelves in the mall" },
      { image: "page-08.svg", sound: "bell", text: "\"If you would like a snack first, the restaurant is on the ground floor, close to the main entrance.\"", alt: "Amal and Noah beside a tray of food in the mall" },
      { image: "page-09.svg", sound: "ball", text: "\"For families with small children, the play area is just past the lift, on the right.\"", alt: "Mina playing with a ball beside the lift in the mall" },
      { image: "page-10.svg", sound: "river", text: "\"Please walk carefully — the floor can be slippery near the juice stand, especially after it rains.\"", alt: "Noah looking surprised beside the fountain while Amal steadies herself" },
      { image: "page-11.svg", sound: "bell", text: "\"If you need help finding a shop, ask any worker wearing a red badge. They will be happy to give you directions.\"", alt: "A mall worker pointing the way for Amal beside the lift" },
      { image: "page-12.svg", sound: "bell", text: "\"The mall closes at nine o'clock this evening, so please finish your shopping in good time. Thank you for visiting.\"", alt: "Amal and Noah each holding a book beside the fountain and the bookshelves" },
    ],
  },
  {
    id: "amals-english-voice",
    title: "Amal's English Voice",
    grades: [4],
    units: [10],
    level: "Level 4",
    description: "One thick blue folder, six pages to choose from a whole year, and the dullest page of all, kept.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Amal's English Voice is an original Grade 4 story created for Ehel Academy in 2026, book two of five for Unit 10 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 10 story of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Amal's English Voice. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal at her desk with her thick blue folder and Teacher Yasmin beside her" },
      { image: "page-02.svg", sound: "bell", text: "It was the last Monday of Year 4. Teacher Yasmin placed one thick folder on every desk.", alt: "Teacher Yasmin pointing at the folders on the classroom desks" },
      { image: "page-03.svg", sound: "bell", text: "\"Everything you have written this year is inside,\" she said. \"Choose the six pages that carry your own English voice.\"", alt: "Teacher Yasmin explaining while Nora and Amal listen at their desks" },
      { image: "page-04.svg", sound: "bell", text: "Amal found her Unit 1 report about Omar. \"A letter can make someone feel remembered,\" he had told her.", alt: "Amal holding her report beside a large open letter on the wall" },
      { image: "page-05.svg", sound: "wind", text: "Behind it sat her weather poster from Unit 2, with a tornado drawn in thick grey pencil.", alt: "Amal beside her weather poster on an easel" },
      { image: "page-06.svg", sound: "bell", text: "Beside that lay her food-safety leaflet from Unit 3. \"I remember the bitter sandwich,\" laughed Nora.", alt: "Nora laughing beside Amal and a health poster on the wall" },
      { image: "page-07.svg", sound: "bell", text: "Unit 5 held the map of the spiral cave. Unit 6 held her parade sign for Elena the engineer.", alt: "Amal holding her pages beside a map and a parade banner" },
      { image: "page-08.svg", sound: "bell", text: "Unit 8 held the attic list, written in careful columns: equipment, folder, telescope.", alt: "Amal beside a telescope and a stack of old boxes with her list in hand" },
      { image: "page-09.svg", sound: "bell", text: "Adam had called it her dullest page, and for a moment she nearly slid it into the bin.", alt: "Adam pointing at the page while Amal looks unhappy at the table" },
      { image: "page-10.svg", sound: "bell", text: "Then she read her own last line again: \"We wore gloves and masks, because the attic had been closed for eleven years.\" She kept it.", alt: "Amal rereading her page at the table at home beside a shelf of books" },
      { image: "page-11.svg", sound: "lullaby", text: "That evening she read her six pages aloud at the kitchen table. \"Tonight you read like somebody who owns the words,\" said Grandma Hana.", alt: "Amal reading aloud at the dining table with Grandma Hana and Idris listening" },
      { image: "page-12.svg", sound: "bell", text: "On Friday she stood beside her display, took one steady breath, and began. \"Good evening. My name is Amal, and this is my English voice.\"", alt: "Amal presenting beside her display board under bunting" },
    ],
  },
  {
    id: "four-parts-and-a-friday",
    title: "Four Parts and a Friday",
    grades: [4],
    units: [10],
    level: "Level 4",
    description: "The Exhibition brief, part by part: six pages, a board, a two-minute talk, and one reflection.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Four Parts and a Friday is an original Grade 4 story created for Ehel Academy in 2026, book three of five for Unit 10 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 10 instructions \"The Year 4 Exhibition: Project Brief\". No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Four Parts and a Friday. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Teacher Yasmin presenting the Exhibition brief on an easel while Amal reads it" },
      { image: "page-02.svg", sound: "bell", text: "The Year 4 Exhibition closes your English year. It has four parts, and you complete them in order.", alt: "Teacher Yasmin explaining to Maya and Sami in the classroom" },
      { image: "page-03.svg", sound: "bell", text: "Part 1: choose your six pages. Take them from at least five different units.", alt: "Amal choosing pages between two desks covered in her work" },
      { image: "page-04.svg", sound: "bell", text: "Your set must show reading, writing, speaking and new words.", alt: "Nora holding her page beside a poster listing the four parts" },
      { image: "page-05.svg", sound: "bell", text: "Part 2: build your display board. Write two paragraphs on every page.", alt: "Leo pointing at a display board on an easel" },
      { image: "page-06.svg", sound: "bell", text: "Add one picture and one clear label to each page, and print your name and your class on the front.", alt: "Maya working on her display board beside a desk of pages" },
      { image: "page-07.svg", sound: "bell", text: "Part 3: prepare your talk. It lasts two minutes.", alt: "Sami practising in front of two rows of chairs" },
      { image: "page-08.svg", sound: "bell", text: "Open with your name, present three pages, then answer two questions from the audience.", alt: "Amal presenting to the empty rows of chairs" },
      { image: "page-09.svg", sound: "bell", text: "Part 4: write your reflection. Name one thing that was genuinely hard, one thing that improved, and one goal for Grade 5.", alt: "Nora writing her reflection at her desk while Teacher Yasmin stands nearby" },
      { image: "page-10.svg", sound: "bell", text: "Pages chosen by Tuesday. Board finished by Thursday. Talk rehearsed with a partner by Thursday evening.", alt: "Teacher Yasmin pointing at the deadlines on the classroom poster while Leo reads" },
      { image: "page-11.svg", sound: "bell", text: "The Exhibition opens on Friday at five o'clock in the school hall. Sixteen marks for the board, sixteen for the talk, sixteen for the draft, sixteen for the reflection.", alt: "The school hall set out with rows of chairs under bunting" },
      { image: "page-12.svg", sound: "bell", text: "One rule matters more than the rest: every page must be your own work, written in your own English voice.", alt: "Teacher Yasmin pointing at the final rule on the board while Amal holds her page" },
    ],
  },
  {
    id: "planning-the-exhibition",
    title: "Planning the Exhibition",
    grades: [4],
    units: [10],
    level: "Level 4",
    description: "Nine metres and sixty centimetres of wall, thirty boards, four days — and one child who would rather present to nobody.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Planning the Exhibition is an original Grade 4 story created for Ehel Academy in 2026, book four of five for Unit 10 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 10 dialogue of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Planning the Exhibition. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Teacher Yasmin and Leo measuring the long wall of the school hall" },
      { image: "page-02.svg", sound: "bell", text: "\"We have four days left,\" said Teacher Yasmin, \"so let us plan the hall properly.\"", alt: "Teacher Yasmin with her arms raised in the empty school hall" },
      { image: "page-03.svg", sound: "bell", text: "\"Where should we put the display boards?\" asked Nora.", alt: "Nora pointing at a display board on an easel beside Teacher Yasmin" },
      { image: "page-04.svg", sound: "bell", text: "\"Along the long wall, so that visitors walk past them in order.\"", alt: "Teacher Yasmin pointing along a line of two display boards in the hall" },
      { image: "page-05.svg", sound: "bell", text: "\"I measured that wall this morning,\" said Leo. \"It is nine metres and sixty centimetres.\"", alt: "Leo with his arms raised beside a metre stick in the hall" },
      { image: "page-06.svg", sound: "bell", text: "\"Then thirty boards will not fit in one row,\" said Maya. \"We need two rows.\"", alt: "Maya pointing at two display boards while Nora stands beside her" },
      { image: "page-07.svg", sound: "bell", text: "\"Elena, you build bridges,\" said Sami. \"How do we make one board stand up by itself?\"", alt: "Sami asking Elena a question beside a display board in the hall" },
      { image: "page-08.svg", sound: "bell", text: "\"Lean two boards together at the top, like a tent,\" said Elena. \"A carpenter would call that a simple frame.\"", alt: "Elena explaining beside a board and her safety helmet" },
      { image: "page-09.svg", sound: "bell", text: "\"Who is going to deliver the invitations?\" asked Nora. \"Sami and Maya will take them to the office; the rest will go out as mail.\"", alt: "Teacher Yasmin pointing at a large letter while Maya holds a page" },
      { image: "page-10.svg", sound: "bell", text: "\"What if somebody is too nervous to speak on Friday?\" asked Leo.", alt: "Leo looking worried beside Teacher Yasmin and a row of chairs" },
      { image: "page-11.svg", sound: "bell", text: "\"Then that person presents to me first, on Thursday, with nobody else in the room.\"", alt: "Teacher Yasmin talking quietly with Nora beside a desk in the hall" },
      { image: "page-12.svg", sound: "bell", text: "\"Should we ask the caretaker to open the hall early?\" asked Maya. \"Yes. Ask politely, and thank him afterwards.\"", alt: "Maya thanking the caretaker in the hall, his broom beside him" },
    ],
  },
  {
    id: "exhibition-evening",
    title: "Exhibition Evening",
    grades: [4],
    units: [10],
    level: "Level 4",
    description: "Two rows of boards, one hall full of families, and six questions Amal answers standing up.",
    author: "Ehel Academy",
    illustrator: "Ehel Academy Learning Studio",
    attribution: "Exhibition Evening is an original Grade 4 story created for Ehel Academy in 2026, book five of five for Unit 10 of the Grade 4 Amal series. Story and vector illustrations by Ehel Academy Learning Studio, built on the Unit 10 dialogue of the same name. No third-party story wording or artwork was reused.",
    pages: [
      { image: "page-01.svg", sound: "bell", text: "Exhibition Evening. Written by Ehel Academy. Illustrated by Ehel Academy Learning Studio.", alt: "Cover illustration of Amal beside her display board in the decorated school hall" },
      { image: "page-02.svg", sound: "bell", text: "\"Good evening, everybody, and welcome to the Year 4 Exhibition.\"", alt: "Teacher Yasmin welcoming a hall full of chairs under bunting" },
      { image: "page-03.svg", sound: "bell", text: "\"The hall looks wonderful,\" said Adam. \"Two rows of boards, and every one is different.\"", alt: "Adam with his arms raised beside Teacher Yasmin and two display boards" },
      { image: "page-04.svg", sound: "bell", text: "\"Thank you, Adam. Please find a seat, because Amal will present first.\"", alt: "Teacher Yasmin pointing to a seat while Amal waits with her pages" },
      { image: "page-05.svg", sound: "bell", text: "\"Good evening. My name is Amal, and my display is called My English Voice.\"", alt: "Amal presenting beside her display board to the rows of chairs" },
      { image: "page-06.svg", sound: "bell", text: "\"Which page are you most proud of?\" asked Grandma Hana. \"Page four, because I wrote it twice, and the second time was far better.\"", alt: "Grandma Hana with her hand raised while Amal answers beside her board" },
      { image: "page-07.svg", sound: "bell", text: "\"Which page was the hardest to finish?\" asked Doctor Sarah. \"The attic list. I checked the spelling of equipment eleven times.\"", alt: "Doctor Sarah asking a question while Amal answers beside her board" },
      { image: "page-08.svg", sound: "bell", text: "\"You interviewed me in Unit 1,\" said Omar. \"Did that report help you?\" \"Yes. It taught me to ask one question and then stop talking.\"", alt: "Omar raising his hand beside a large letter while Amal answers" },
      { image: "page-09.svg", sound: "bell", text: "\"What will you carry with you into Grade 5?\" asked Elena. \"The habit of reading my work aloud before I hand it in.\"", alt: "Elena asking a question beside her helmet while Amal answers" },
      { image: "page-10.svg", sound: "bell", text: "\"Were you nervous before you started?\" asked Idris. \"A little, but I took one steady breath, and my voice felt steady too.\"", alt: "Idris with his hand up while Amal answers beside her display board" },
      { image: "page-11.svg", sound: "bell", text: "\"Thank you, Amal. Everyone, please give her a round of applause.\"", alt: "Amal with her arms raised before a full hall of chairs as confetti falls" },
      { image: "page-12.svg", sound: "bell", text: "\"Nora, you are next.\" \"Good evening. My display is about the weather unit, and I have brought my tornado poster.\"", alt: "Nora presenting beside her weather board while Teacher Yasmin stands at the side" },
    ],
  },
];

let course;
let dictionary;
let manifest;
let finalAssessment;
let placementExam;
let gamePack;
// A word that appears inside a practice sentence but has no dictionary entry
// of its own — "The lion roars in the hot sun" names "lion" but leaves
// "roars" undefined. Deliberately NOT a full vocabulary entry: no audio, no
// practice sentences, not tracked in My Word Book — just enough for a tap on
// the word to show what it means without leaving the sentence. Optional per
// grade (sentence-glossary.json may not exist yet), so a missing file is not
// a load failure — the words in that grade's sentences simply are not
// clickable until it does.
let sentenceGlossary = {};
let route = location.hash.slice(1) || "overview";
let audioEnabled = true;
let mediaRecorder;
let recordedChunks = [];
let activeRecordingId = null;
let activeAudioEnd = null;
let activeAudioButton = null;
let audioRequestId = 0;
let pageNarrationActive = false;
let pageNarrationCancel = null;
let activeWordId;
// Set by renderWordCarousel while both designs are mounted, cleared by
// onBeforeRender with the other region state — a handler in the lab must never
// reach into a deck belonging to a section that has already been replaced.
let showWordInDeck = null;
// The other direction, and the same contract. Both designs draw the same
// section, so a word marked in the lab is marked in the deck too — but only the
// deck repaints its own chip, and the chip now names a TARGET ("12 of 15 new
// words") rather than a running total. A learner who works in the lab would
// otherwise finish the section under a chip still reading "14 of 15", which is
// the section's completion rule appearing to be broken. Published by
// renderWordCarousel, cleared with the rest of the region state.
let refreshDeckWordCount = null;
// Same contract for the other three sections whose classic half has a selector:
// the shelf in Reading, the task subtabs in Writing, the group subtabs in
// Comprehension. Each is published by its own carousel and cleared with the rest.
let showReadingInDeck = null;
let showWritingInDeck = null;
let showComprehensionGroupInDeck = null;
let activeSentence = 0;
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let finalQuizIndex = 0;
let placementIndex = 0;
let activeGameId = null;
let gameRoundIndex = 0;
let gameScore = 0;
let gameLocked = false;
let gameSelection = [];
let gamePairSelection = [];
let gameMistakes = 0;
let currentPageNarration = "";
let activeEbookId = ebookCatalog[0].id;
let ebookWatchActive = false;
let ebookWatchToken = 0;

// goat, hen and monkey joined on 2026-08-20. They were always DRAWN with three
// moods — the kit emits data-mood for them like any other character — but had a
// single clip each, so a sad goat played a cheerful bleat. Adding them here needs
// no change to the art at all.
//
// The plain goat.mp3 / hen.mp3 / monkey.mp3 stay on disk and are NOT orphans:
// thirty page story cues name them directly, and playStorySound takes the raw key
// without going near this table.
const TAP_SOUND_MOOD_TYPES = new Set(["zebra", "elephant", "kiki", "duku", "lulu", "zuri", "goat", "hen", "monkey"]);
const TAP_SOUND_MOODS = new Set(["happy", "sad", "surprised"]);
const TAP_SOUND_ALIASES = { kite: "wind", moon: "lullaby", carrot: "crunch", scarecrow: "tree", lake: "puddle", fish: "puddle", boat: "wind", clock: "bell" };
// The Grade 3 and 4 casts are PEOPLE, and they share a voice by type rather than
// one clip each. Fourteen separate child giggles would be indistinguishable from
// one another on the page and cost fourteen times as much to record; three groups
// keep every character's mood working with nine clips.
//
// This is a third resolution path, not a variant of the two above:
// TAP_SOUND_MOOD_TYPES gives a character its OWN <name>-<mood>.mp3, and
// TAP_SOUND_ALIASES swaps one tap for another clip and loses the mood. Neither
// can express "several characters, one voice, moods intact".
const TAP_VOICE_GROUPS = {
  amal: "child", nora: "child", mina: "child", adam: "child", idris: "child",
  noah: "child", sami: "child", maya: "child",
  samira: "child", hodan: "child", leo: "child",
  daniel: "child", theo: "child",
  yasmin: "woman", mum: "woman", hana: "woman", salma: "woman", faduma: "woman",
  nadia: "woman", sarah: "woman", elena: "woman", talia: "woman", librarian: "woman",
  governor: "woman",
  omar: "man", dad: "man", grandpa: "man", rami: "man", mayor: "man", karim: "man",
  uncle: "man", lawyer: "man", caretaker: "man", labourer: "man",
};
let tapSoundPlayer = null;

function ensureTapSoundPlayer() {
  if (!tapSoundPlayer) {
    tapSoundPlayer = new Audio();
    tapSoundPlayer.volume = 1;
    tapSoundPlayer.preload = "auto";
  }
  return tapSoundPlayer;
}

function tapSoundUrl(soundKey) {
  return new URL(`./ebooks/tap-sounds/${soundKey}.mp3`, document.baseURI).href;
}

function playTapSound(type, mood) {
  if (!audioEnabled || !type) return;
  const voiceGroup = TAP_VOICE_GROUPS[type];
  const soundKey = voiceGroup
    ? `${voiceGroup}-${TAP_SOUND_MOODS.has(mood) ? mood : "happy"}`
    : TAP_SOUND_MOOD_TYPES.has(type)
      ? `${type}-${TAP_SOUND_MOODS.has(mood) ? mood : "happy"}`
      : TAP_SOUND_ALIASES[type] || type;
  try {
    const player = ensureTapSoundPlayer();
    player.pause();
    player.src = tapSoundUrl(soundKey);
    player.currentTime = 0;
    player.play().catch(() => {});
  } catch {
    // Tap sounds are a garnish; never let them break the reader.
  }
}

// Plays a page's story sound cue and resolves when it finishes (or after a
// short safety timeout), so narration can follow it like a storybook sting.
function playStorySound(soundKey) {
  if (!audioEnabled || !soundKey) return Promise.resolve();
  let player;
  try {
    player = ensureTapSoundPlayer();
  } catch {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      player.removeEventListener("ended", done);
      player.removeEventListener("error", done);
      resolve();
    };
    const timer = setTimeout(done, 2600);
    player.addEventListener("ended", done);
    player.addEventListener("error", done);
    try {
      player.pause();
      player.src = tapSoundUrl(soundKey);
      player.currentTime = 0;
      player.play().catch(done);
    } catch {
      done();
    }
  });
}

// Theatre mode: the body class that leaves only the story on screen. It is what
// actually delivers "Watch the story shows the story and nothing else" — see the
// body.ebook-watching block in english/shared/course-ui.css for why this cannot
// be left to the Fullscreen API. Turning a page keeps it on (the learner is
// still inside the reader); ending the watch takes it off.
let ebookFullscreenBound = false;
let ebookHadFullscreen = false;

function stopEbookWatch({ keepFullscreen = false } = {}) {
  ebookWatchActive = false;
  ebookWatchToken += 1;
  if (tapSoundPlayer) tapSoundPlayer.pause();
  if (!keepFullscreen) {
    document.body.classList.remove("ebook-watching");
    ebookHadFullscreen = false;
  }
  if (!keepFullscreen && document.fullscreenElement?.classList?.contains("course-ebook-reader") && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  const watchButton = $("#watch-ebook");
  if (watchButton) {
    watchButton.classList.remove("watching");
    watchButton.innerHTML = `${icon("play")} Watch the story`;
    watchButton.setAttribute("aria-label", "Watch the story: narrated pages that turn by themselves");
    icons();
  }
  stopAudio();
}
let activeEbookPage = 0;
const aiVoiceCache = new Map();
const aiVoicePending = new Map();
const readingVoiceSources = new Map();
// The chunk texts behind each entry in readingVoiceSources, so the read-along
// highlight knows which character range of the text each source file narrates.
const readingVoiceChunks = new Map();
const recordings = new Map();
const speakingReviewState = new Map();



function loadAIState() {
  try {
    return { mode: "teach", messages: [], interactions: 0, practiceWords: [], needs: [], ...JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || "{}") };
  } catch {
    return { mode: "teach", messages: [], interactions: 0, practiceWords: [], needs: [] };
  }
}

function saveAIState() {
  aiState.messages = aiState.messages.slice(-24);
  localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiState));
}


function loadFinalQuizProgress() {
  try {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, passed: false, submitted: false, ...JSON.parse(localStorage.getItem(FINAL_QUIZ_STORAGE_KEY) || "{}") };
  } catch {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, passed: false, submitted: false };
  }
}

function saveFinalQuizProgress() {
  localStorage.setItem(FINAL_QUIZ_STORAGE_KEY, JSON.stringify(finalQuizProgress));
  renderNav();
}

function loadPlacementProgress() {
  try {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, band: null, submitted: false, startedAt: null, ...JSON.parse(localStorage.getItem(PLACEMENT_STORAGE_KEY) || "{}") };
  } catch {
    return { answers: {}, attempts: [], currentIndex: 0, completed: false, band: null, submitted: false, startedAt: null };
  }
}

// The books this unit can actually offer. Defined once because two places ask
// the question and they must not drift: the nav decides whether Books exists at
// all, and the renderer decides what to draw. A book with no `units` belongs to
// every unit of its grades.
function unitEbooks() {
  return ebookCatalog.filter((item) => item.grades.includes(gradeNumber) && (!item.units || item.units.includes(unitNumber)));
}

function savePlacementProgress() {
  localStorage.setItem(PLACEMENT_STORAGE_KEY, JSON.stringify(placementProgress));
  renderNav();
}

function visibleSections() {
  // A locked unit has one page, so it offers one nav entry. This also empties
  // the countable list the shell divides by, which is what keeps the progress
  // bar at 0% instead of reporting on a unit nobody has opened.
  if (unitIsLocked()) return [["overview", "lock", "Locked"]];
  if (isPrereqUnit) {
    return [
      ["overview", "layout-dashboard", "Overview"],
      ["placement", "clipboard-check", placementExam?.kind === "readiness" ? "Readiness check" : "Placement exam"],
      // The year plan lives here, under the Prerequisite entries, because it is
      // read BEFORE the year is walked — the same reason the placement exam
      // lives here. It is a reference page, not a step: never counted, never
      // locked (sectionUnlocked already answers true for the whole prereq unit).
      ["year-plan", "calendar-days", "Grade Study Plan"],
    ];
  }
  // Books drops out the same way Games does, and for the same reason: a section
  // the unit cannot offer is not a section. Only Grade 1 has an approved eBook
  // library, so at every other grade this entry could say one thing — "there are
  // no approved eBooks for this unit yet" — while still counting toward the
  // unit's 100%, which is why those grades' progress bars stopped at 92% and
  // could never read complete. It is also what made the gate unsafe beyond
  // Grade 1: an uncompletable step in the chain shuts the learner out for good.
  const available = sections.filter(([id]) => (id !== "games" || gamePack) && (id !== "ebooks" || unitEbooks().length) && (id !== "teacherguide" || hasGrownUpGuide()) && (id !== "story-library" || hasStoryLibrary()));
  return unitNumber === 10 ? [...available, ["final-quiz", "trophy", "Final course quiz"]] : available;
}


function icon(name, label = "") {
  return sharedIcon(name, label);
}

function icons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } });
}

function escapeHtml(value = "") {
  return sharedEscapeHtml(value);
}

// Wrap any word in `text` that sentenceGlossary defines in a clickable span,
// leaving everything else untouched. Built by walking regex matches and
// escaping each literal segment in between, rather than String#replace: a
// replacer only transforms the MATCHED text, so the untouched punctuation and
// spacing around it would reach the page unescaped — the same content this
// file escapes everywhere else it renders learner-facing text. `excludeWord`
// is the card's own target word (already named above the sentence); linking
// it back to itself would be a click that does nothing useful.
function linkGlossaryWords(text, excludeWord = "") {
  const excludeLower = String(excludeWord || "").toLowerCase();
  const source = String(text || "");
  const pattern = /[A-Za-z']+/g;
  let out = "";
  let last = 0;
  let match;
  while ((match = pattern.exec(source))) {
    out += escapeHtml(source.slice(last, match.index));
    const word = match[0];
    const lw = word.toLowerCase();
    const entry = lw !== excludeLower ? sentenceGlossary[lw] : null;
    out += entry
      ? `<button type="button" class="glossary-word" data-glossary-word="${escapeHtml(lw)}">${escapeHtml(word)}</button>`
      : escapeHtml(word);
    last = match.index + word.length;
  }
  out += escapeHtml(source.slice(last));
  return out;
}

let activeGlossaryButton = null;
function hideGlossaryPopover() {
  document.querySelectorAll(".glossary-popover").forEach((el) => el.remove());
  if (activeGlossaryButton) activeGlossaryButton.setAttribute("aria-expanded", "false");
  activeGlossaryButton = null;
}
function showGlossaryPopover(button) {
  const word = button.dataset.glossaryWord;
  const entry = sentenceGlossary[word];
  if (!entry) return;
  hideGlossaryPopover();
  const pop = document.createElement("div");
  pop.className = "glossary-popover";
  pop.setAttribute("role", "status");
  // Rendered only once a clip exists, same rule as the vocabulary page's
  // #hear-meaning: the descriptors ship ahead of the audio while scripts are
  // in review, and a button that can only ever say "not available" is worse
  // than none.
  pop.innerHTML = `<strong>${escapeHtml(word)}${entry.wordAudio?.available ? ` <button class="icon-button" type="button" id="glossary-hear-word" title="Listen" aria-label="Listen to ${escapeHtml(word)}">${icon("volume-2")}</button>` : ""}</strong><p>${escapeHtml(entry.definition)}${entry.definitionAudio?.available ? ` <button class="icon-button" type="button" id="glossary-hear-definition" title="Listen to the meaning" aria-label="Listen to the meaning of ${escapeHtml(word)}">${icon("volume-2")}</button>` : ""}</p>`;
  document.body.appendChild(pop);
  const rect = button.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 6;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8;
  const left = Math.max(8, Math.min(rect.left + window.scrollX, maxLeft));
  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;
  pop.querySelector("#glossary-hear-word")?.addEventListener("click", (event) => playAudio(entry.wordAudio.source, {
    rate: AI_NARRATION_RATE, start: entry.wordAudio.cueStart, end: entry.wordAudio.cueEnd, button: event.currentTarget,
  }));
  pop.querySelector("#glossary-hear-definition")?.addEventListener("click", (event) => playAudio(entry.definitionAudio.source, {
    rate: AI_NARRATION_RATE, start: entry.definitionAudio.cueStart, end: entry.definitionAudio.cueEnd, button: event.currentTarget,
  }));
  icons();
  button.setAttribute("aria-expanded", "true");
  activeGlossaryButton = button;
}
// One delegated listener for the whole app, registered once at module load —
// a word can be clicked on any page a sentence renders on, and re-attaching
// this per render would stack duplicate listeners.
document.addEventListener("click", (event) => {
  const button = event.target.closest(".glossary-word");
  if (button) {
    event.preventDefault();
    if (activeGlossaryButton === button) hideGlossaryPopover();
    else showGlossaryPopover(button);
    return;
  }
  if (!event.target.closest(".glossary-popover")) hideGlossaryPopover();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") hideGlossaryPopover(); });

// Narration clips live in one shared tree (english/media/audio/grade-N/{cat}/)
// beside the app, not under the per-grade app folder, so rebasing them against
// gradeRootUrl produced english/grade-N/media/audio/grade-N/… and 404ed on every
// clip in local dev. Deployed builds are unaffected either way: resolveMediaUrl
// discards this prefix when it rewrites to the Bunny media tree. Kept identical to
// the same guard in english/shared/course-ui.js — this module is the copy the
// deployed shell serves, so the two must not drift.
const SHARED_AUDIO = /(^|\/)media\/audio\/grade-\d+\//;

// lectureVideo and lecturePoster keep a stable filename across a re-render —
// unlike an individual clip's `source`, there is no `?a=` stamp anywhere on
// this path, so a browser that already played a lecture caches the OLD file
// for a year and a redeploy at the same URL never reaches it. lectureCaptions
// does not need this: its filename is a content hash (version-lecture-
// captions.js), so a caption edit already mints a new URL on its own.
const CACHE_BUST_ASSET_KEYS = new Set(["lectureVideo", "lecturePoster"]);

function resolveGradeAssets(value) {
  const assetKeys = new Set(["source", "normal", "slow", "image", "lectureVideo", "lecturePoster", "lectureCaptions"]);
  if (Array.isArray(value)) {
    value.forEach(resolveGradeAssets);
    return value;
  }
  if (!value || typeof value !== "object") return value;
  for (const [key, item] of Object.entries(value)) {
    if (assetKeys.has(key) && typeof item === "string" && SHARED_AUDIO.test(item)) continue;
    else if (assetKeys.has(key) && typeof item === "string" && /^(\.\.?[/\\])/.test(item)) {
      const resolved = new URL(item.replace(/\\/g, "/"), gradeRootUrl).href;
      value[key] = CACHE_BUST_ASSET_KEYS.has(key) ? withAudioRelease(resolved) : resolved;
    }
    else resolveGradeAssets(item);
  }
  return value;
}

function pageHeader(kicker, title, description, status = "Approved content") {
  currentPageNarration = `${String(title).replace(/<[^>]*>/g, " ")}. ${String(description).replace(/<[^>]*>/g, " ")}`.replace(/\s+/g, " ").trim();
  return sharedPageHeader({ kicker, title, description, status });
}

function prepareNarrationText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .map((line) => /[.!?;:…][\"'”’)]*$/.test(line) ? line : `${line}.`)
    .join("\n\n");
}

function collectPageNarration() {
  // On a both-designs page the deck below repeats the section word for word, so
  // "read this page" reads the original half only. Narrating #app there would say
  // everything twice.
  const source = $("#classic-design") || $("#app");
  if (!source) return currentPageNarration;
  const copy = source.cloneNode(true);
  copy.querySelectorAll("button, .audio-source, .status-chip, script, style, [hidden], [aria-hidden='true'], details:not([open]) > *:not(summary)").forEach((element) => element.remove());
  copy.querySelectorAll("input, textarea, select").forEach((element) => {
    const description = element.getAttribute("aria-label") || element.getAttribute("placeholder") || "";
    if (description) element.replaceWith(document.createTextNode(description));
    else element.remove();
  });
  copy.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, label, summary").forEach((element) => {
    element.append(document.createTextNode("\n"));
  });
  return prepareNarrationText(copy.textContent) || prepareNarrationText(currentPageNarration);
}

// A sentence, with any closing quote or bracket kept on the end of it — a line
// that stops before the “ of “Hello!” reads as a typo when it is the thing
// being highlighted.
function narrationSentences(value) {
  const parts = String(value || "").match(/[^.!?]+[.!?]+[”’"')\]]*|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) || [];
  // A break inside quoted speech is not a sentence break. These stories are
  // mostly dialogue, and “Hello!” / said a kind lady at the door. splits the
  // one thing the narrator says in a single breath across two highlights. A
  // fragment starting lowercase is the back half of the sentence above it.
  return parts.reduce((kept, part) => {
    if (kept.length && /^[a-z]/.test(part)) kept[kept.length - 1] += ` ${part}`;
    else kept.push(part);
    return kept;
  }, []);
}

// Where each narration file starts and ends in the character space the
// highlight measures segments in. The chunk texts and the on-screen lines are
// two descriptions of the same narration, so the ranges are proportional
// rather than absolute — the chunker trims and rejoins, so the two character
// counts never agree exactly.
function narrationChunkRanges(chunks, total) {
  const weights = chunks.map(narrationWeight);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let position = 0;
  return weights.map((weight) => {
    const start = position;
    position += (weight / sum) * total;
    return [start, position];
  });
}

function narrationChunks(text, maximum = 620) {
  const clean = prepareNarrationText(text);
  if (!clean) return [];
  const lines = clean.split(/\n{2,}/).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const line of lines) {
    const parts = line.length <= maximum ? [line] : (line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line]);
    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (!part) continue;
      const separator = current ? (parts.length === 1 ? "\n\n" : " ") : "";
      if (`${current}${separator}${part}`.length <= maximum) current = `${current}${separator}${part}`;
      else {
        if (current) chunks.push(current);
        if (part.length <= maximum) current = part;
        else {
          for (let start = 0; start < part.length; start += maximum) chunks.push(part.slice(start, start + maximum));
          current = "";
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = "";
  element.classList.add("show");
  requestAnimationFrame(() => { element.textContent = message; });
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function announceScreenReader(message) {
  const announcer = $("#sr-announcer");
  if (!announcer) return;
  announcer.textContent = "";
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function focusDynamicContent(selector, message) {
  const target = $(selector);
  if (!target) return;
  target.tabIndex = -1;
  requestAnimationFrame(() => target.focus({ preventScroll: true }));
  announceScreenReader(message || target.textContent.trim());
}

function prepareScreenReaderView() {
  const sectionLabel = visibleSections().find(([id]) => id === route)?.[2] || (route === "teacher" ? "Teacher resources" : route === "student" ? "Student resources" : "Overview");
  const heading = $("#app h1");
  $$('[id$="feedback"], #save-status, #video-status, [data-record-status]', $("#app")).forEach((element) => {
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-atomic", "true");
  });
  if (heading) {
    heading.tabIndex = -1;
    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  }
  announceScreenReader(`${gradeLabel}, Unit ${course.unit.unitNo}, ${sectionLabel}. Page ready.`);
}


// Both of these clone the CURRENT url, so anything in it rides along. `review`
// must not: it opens a locked unit, and a bypass that propagates through the
// links on the page it unlocked is not a bypass, it is the gate switched off.
function courseLocation(nextUnit, nextRoute = "overview") {
  const url = new URL(location.href);
  url.searchParams.set("grade", gradeNumber);
  url.searchParams.set("unit", nextUnit);
  url.searchParams.delete("review");
  url.hash = nextRoute;
  return url.href;
}

function gradeLocation(nextGrade) {
  const url = new URL(location.href);
  url.searchParams.set("grade", nextGrade);
  url.searchParams.set("unit", Number(nextGrade) === 1 ? 0 : 1);
  url.searchParams.delete("review");
  url.hash = "overview";
  return url.href;
}


// --- overview narration ------------------------------------------------------
// One clip per panel, not one per page. The banner, the outcomes and the
// recommended path are authored independently, and ElevenLabs bills per
// character: a reworded outcome must re-buy the outcomes clip alone. The panels
// that are counts ("Your unit at a glance"), compliance notes (the Cambridge
// approval banner) or progress-dependent (the unit guide reads "You have
// finished 3 of 11 sections") carry no button — the last of those cannot be
// pre-rendered at all, since the text differs per learner.
//
// Descriptors are written by `node tools/generate-ehel-english-audio.js
// overview <grade>`; a panel whose clip has not been generated renders no
// button, so the page degrades quietly rather than offering silence.
function overviewAudioButton(holder, key, label) {
  const descriptor = holder?.overviewAudio?.[key];
  return descriptor?.available
    ? `<button class="button secondary" data-overview-audio="${escapeHtml(key)}" type="button">${icon("volume-2")} ${escapeHtml(label)}</button>`
    : "";
}
function bindOverviewAudio(holder) {
  $$("[data-overview-audio]").forEach((button) => button.addEventListener("click", () => {
    const descriptor = holder?.overviewAudio?.[button.dataset.overviewAudio];
    if (descriptor?.source) playAudio(descriptor.source, { rate: AI_NARRATION_RATE, button });
  }));
}

// Wraps a renderer map so each entry re-checks both gates at the moment it runs,
// rather than the map being chosen once while the module is still evaluating.
// The greyed-out nav button is the polite half of the section gate; this is the
// half a typed #quiz cannot walk around.
function gated(renderers) {
  return Object.fromEntries(Object.entries(renderers).map(([id, render]) => [id, () => {
    if (unitIsLocked()) return renderLockedUnit();
    if (!sectionUnlocked(id)) return renderLockedSection(id);
    return render();
  }]));
}

// The locked-section page. Same job as the locked-unit page one level down:
// name the one thing standing in the way, and offer the way to it.
function renderLockedSection(id) {
  const open = nextOpenSection();
  const chain = sectionChain();
  const previous = chain[chain.indexOf(id) - 1];
  $("#app").innerHTML = `${pageHeader(
    `${escapeHtml(course.grade.label)} · Unit ${course.unit.unitNo}`,
    `${escapeHtml(sectionLabel(id))} is not open yet`,
    previous === "overview"
      ? "Start from the unit's Overview page and this part opens."
      : `Finish ${escapeHtml(sectionLabel(previous))} and this part opens by itself.`,
    "Locked",
  )}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="panel">
          <h2>${icon("lock")} One part at a time</h2>
          <p>You learn this unit in order, so every part gets your full attention. <strong>${escapeHtml(sectionLabel(id))}</strong> opens as soon as <strong>${escapeHtml(sectionLabel(previous))}</strong> has its tick.</p>
          <p>You are up to <strong>${escapeHtml(sectionLabel(open))}</strong>.</p>
          <button class="button gold" data-go="${escapeHtml(open)}" type="button">Go to ${escapeHtml(sectionLabel(open))} ${icon("arrow-right")}</button>
        </section>
      </div>
      <div class="section-stack">
        <section class="panel">
          <h3>Your order for this unit</h3>
          <ol class="path-list">${chain.map((step) => `<li>${icon(progress.completed.includes(step) ? "circle-check-big" : sectionUnlocked(step) ? "circle-dot" : "lock")}<span>${escapeHtml(sectionLabel(step))}</span></li>`).join("")}</ol>
        </section>
      </div>
    </div>`;
  $$("[data-go]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

// The locked page. It is the page every route draws while a unit is locked,
// and the shell falls back to `overview` for any route it does not know — so a
// bookmarked ?unit=7#reading lands here too rather than opening a lesson the
// learner has not reached. The picker is the polite gate; this is the real one.
//
// It names the work rather than just refusing: which unit is in the way, what
// is still unticked in it, and one button back to where the learner actually is.
function renderLockedUnit() {
  const previous = unitNumber - 1;
  const previousTitle = manifest.units.find((unit) => Number(unit.number) === previous)?.title || `Unit ${previous}`;
  const open = currentOpenUnit();
  const openTitle = manifest.units.find((unit) => Number(unit.number) === open)?.title || `Unit ${open}`;
  const done = unitSectionsDone(previous);
  const remaining = sections.filter(([id]) => !["overview", "live"].includes(id) && !done.includes(id)).map(([, , label]) => label);
  $("#app").innerHTML = `${pageHeader(
    `${escapeHtml(course.grade.label)} · Unit ${unitNumber}`,
    `${escapeHtml(course.unit.unitTitle)} is not open yet`,
    `Finish Unit ${previous}: ${escapeHtml(previousTitle)} and this unit opens by itself.`,
    "Locked",
  )}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="panel">
          <h2>${icon("lock")} Unit ${unitNumber} opens after Unit ${previous}</h2>
          <p>You learn one unit at a time, in order. When every part of <strong>Unit ${previous}: ${escapeHtml(previousTitle)}</strong> has a tick, Unit ${unitNumber} opens on its own — nobody has to unlock it for you.</p>
          <p>You are working on <strong>Unit ${open}: ${escapeHtml(openTitle)}</strong> right now.</p>
          <a class="button gold" href="${courseLocation(open)}">Go to Unit ${open}: ${escapeHtml(openTitle)} ${icon("arrow-right")}</a>
        </section>
      </div>
      <div class="section-stack">
        <section class="panel">
          <h3>Still to finish in Unit ${previous}</h3>
          ${remaining.length
            ? `<ol class="path-list">${remaining.map((label) => `<li>${icon("circle")}<span>${escapeHtml(label)}</span></li>`).join("")}</ol>`
            : `<p>Open Unit ${previous} to see what is left.</p>`}
        </section>
      </div>
    </div>`;
}

function renderOverview() {
  const learningPath = course.unit.learningPath.split("\n").filter(Boolean);
  // The shell's checklist of what finishing this unit takes, with the section
  // gate painted on so a locked row looks locked here as it does in the nav.
  // It goes FIRST in the column, above the banner: under it, the panel began
  // at 731px on a 720px viewport, and a guide that starts below the fold is a
  // guide the learner it is for never sees.
  // The closing sentence is this subject's rule, not the shell's: the shell
  // knows which sections count, only english knows that a finished unit opens
  // the next one — and only while the gate is on.
  const nextUnitOpens = UNIT_GATE_ENABLED && unitNumber < CAPSTONE_UNIT && !isPrereqUnit;
  const unitGuide = shellCtx.unitGuide({
    isUnlocked: (id) => sectionUnlocked(id, { fromOverview: true }),
    // Authored per unit, only where the unit's shape needs saying (unit.howToUse
    // in the unit JSON); check-english-content.mjs holds it to learner voice.
    howToUse: Array.isArray(course.unit.howToUse) ? course.unit.howToUse : [],
    hints: Object.fromEntries(Object.keys(SECTION_HINTS).map((id) => [id, sectionHint(id)])),
    rule: nextUnitOpens
      ? `When every section has a tick, this unit is finished and Unit ${unitNumber + 1} opens.`
      : "When every section has a tick, this unit is finished.",
  });
  $("#app").innerHTML = `${pageHeader(`${course.grade.label} · ${course.term.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}
    <div class="overview-grid">
      <div class="section-stack">
        ${unitGuide}
        <section class="unit-banner">
          <img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}">
          <div class="banner-copy"><span>Your learning journey</span><h2>Explore ${escapeHtml(course.unit.unitTitle)}</h2><p>${escapeHtml(course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}</p><button class="button gold" data-go="lecture" type="button">${icon("play")} ${unitNumber === 10 ? "Launch my capstone" : "Start with Teacher Musa"}</button>${overviewAudioButton(course, "intro", "Hear the overview")}</div>
        </section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome) => `<div class="outcome"><span>${outcome.sequence}</span><p>${escapeHtml(outcome.learningOutcome)}</p></div>`).join("")}</div>${overviewAudioButton(course, "outcomes", "Hear what you will learn")}</section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">${escapeHtml(cambridgeFramework(gradeNumber).level)} ${cambridgeFramework(gradeNumber).code}</span><h3>Aligned to ${escapeHtml(cambridgeLabel(gradeNumber))}</h3><p>Unit ${course.unit.unitNo} is structured from the ${escapeHtml(cambridgeLabel(gradeNumber))} content package.${unitAwaitsSignOff() ? " AI-assisted content review complete — human curriculum sign-off pending." : ""}</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.dictionaryLinks.length}</strong><small>words</small></div><div class="stat"><strong>${course.readings.length}</strong><small>texts</small></div><div class="stat"><strong>${course.quizzes.length}</strong><small>quiz points</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list">${learningPath.map((item) => `<li>${icon("circle-check-big")}<span>${escapeHtml(item)}</span></li>`).join("")}</ol>${overviewAudioButton(course, "path", "Hear the recommended path")}</section>
        ${unitNumber === defaultUnit && !placementProgress.completed ? `<section class="panel final-quiz-callout"><span class="eyebrow">New to ${gradeLabel}?</span><h3>Prerequisite: placement exam</h3><p>A short exam over your earlier English finds your perfect starting point and suggests review lessons if you need them.</p><a class="button gold" href="${courseLocation(PREREQ_UNIT, "placement")}">Take the placement exam ${icon("arrow-right")}</a></section>` : ""}
        ${unitNumber === 10 ? `<section class="panel final-quiz-callout"><span class="eyebrow">After your capstone</span><h3>Final course quiz</h3><p>Complete 30 questions across words, reading, grammar, speaking and writing. Your answers save as you work.</p><button class="button gold" data-go="final-quiz" type="button">${finalQuizProgress.completed ? "View my results" : "Open final quiz"} ${icon("arrow-right")}</button></section>` : ""}
      </div>
    </div>`;
  // Leaving the Overview by one of its own buttons is what completes it — the
  // page has no other "done", and it is the first step of the unit chain, so
  // Teacher lecture stays locked until the learner has actually started here.
  // complete() before navigate(), or the section being opened is still locked
  // at the moment we ask for it.
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => {
    if (!progress.completed.includes("overview")) complete("overview");
    navigate(button.dataset.go);
  }));
  bindOverviewAudio(course);
}

// The lecture's journey: the steps a learner is walked through before the
// independent lesson. Defined once because two designs draw it now — the launch
// page as a list, the deck one step per slide — and a step that existed in only
// one of them would be a step some learners never see.
//
// `finish` is deliberately not uniform. The capstone launch completes the
// section on a button; a guided launch REFUSES to (completion waits for the
// video, and the original only toasts to say so); a video unit completes by
// being watched to the end. The deck inherits each of those exactly, so it
// cannot hand out a completion the original design withholds.
function lectureJourney() {
  if (course.visual.lectureMode === "capstone-launch") {
    return {
      list: "path-list",
      eyebrow: "Four milestones",
      heading: "Your capstone journey",
      finish: { action: "complete", label: "I have seen the whole project", message: "Capstone launched. Your review vocabulary is ready." },
      steps: [
        ["folder-heart", "Choose and explain your strongest portfolio work."],
        ["book-open", "Create, review and improve your final product."],
        ["mic-2", "Present clearly and respond to a question."],
        ["sparkles", "Reflect on your growth and set a next-grade goal."],
      ],
    };
  }
  if (course.visual.lectureMode === "guided-launch" || !course.visual.lectureVideo) {
    return {
      list: "path-list",
      eyebrow: "How to learn",
      heading: "Use language with purpose",
      finish: { action: "toast", label: "I have previewed this unit", message: "Unit preview opened. The video lesson is marked complete once the video is ready." },
      steps: [
        ["eye", "Preview the unit goals and connect them to what you know."],
        ["ear", "Listen, read and notice how English works in context."],
        ["message-circle", "Discuss, explain and support ideas clearly."],
        ["pencil", "Practise, check feedback and improve your response."],
      ],
    };
  }
  return {
    list: "checklist",
    eyebrow: "Before you learn",
    heading: "Listen, look and repeat",
    // No finish control: the video above is what completes this section, and a
    // button here would let a learner skip the lecture by swiping past it.
    finish: null,
    steps: [
      ["ear", "Hear the approved ElevenLabs teacher voice"],
      ["captions", "Read along with captions"],
      ["message-circle", "Pause, take notes and repeat key language"],
    ],
  };
}

// The two list shapes the launch page already used, kept apart because they are
// different elements: an ordered path of steps, and a checklist of what to do
// while the video plays.
function lectureJourneyList(journey) {
  return journey.list === "path-list"
    ? `<ol class="path-list">${journey.steps.map(([name, text]) => `<li>${icon(name)}<span>${escapeHtml(text)}</span></li>`).join("")}</ol>`
    : `<ul class="checklist">${journey.steps.map(([name, text]) => `<li>${icon(name)} ${escapeHtml(text)}</li>`).join("")}</ul>`;
}

// The ONE section at Grades 1-4 that does not draw both designs. The deck under
// this page restated a video the learner had just watched — a second thing to
// click and no second thing to learn — so the lecture keeps the original alone:
// the player with its own slide arrows, the checklist beside it, and the button
// that completes the section.
//
// Nothing is lost with the deck. Its only control was a finish button, and it
// only ever appeared on the capstone and guided-launch variants, where the
// original half already carries the same one ("Begin my capstone", "Preview this
// unit"). A video lecture's deck deliberately had no finish control at all: the
// video is what completes this section.
//
// Calling the classic renderer directly is exactly how Grades 5-8 draw this page
// today — classicScope() falls back to #app when there is no both-designs region
// — so the top half is byte-identical either way.
function renderLecture() {
  return renderLectureClassic();
}

function renderLectureClassic() {
  const { $ } = classicScope();
  const groups = course.vocabularyGroups.map((group) => group.title.toLowerCase()).join(", ");
  const journey = lectureJourney();
  if (course.visual.lectureMode === "capstone-launch") {
    $("#app").innerHTML = `${pageHeader("Capstone launch", "Welcome to My English World", "See the whole project before you begin. Your teacher will guide each stage during six live sessions.")}
      <div class="lecture-layout">
        <section class="unit-banner capstone-launch"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}"><div class="banner-copy"><span>Your final ${gradeLabel} project</span><h2>Choose. Create. Present. Reflect.</h2><p>Bring together your strongest English work, create a purposeful final product and present it with confidence.</p><button class="button gold" id="capstone-launch-done" type="button">${icon("flag")} Begin my capstone</button></div></section>
        <div class="section-stack"><section class="panel"><span class="eyebrow">${escapeHtml(journey.eyebrow)}</span><h2>${escapeHtml(journey.heading)}</h2>${lectureJourneyList(journey)}</section><section class="panel"><h3>Start with your review words</h3><p>The capstone dictionary brings together useful words selected across the course.</p><button class="button primary" id="to-dictionary" type="button">Open review vocabulary ${icon("arrow-right")}</button></section></div>
      </div>`;
    $("#capstone-launch-done").addEventListener("click", () => complete("lecture", "Capstone launched. Your review vocabulary is ready."));
    $("#to-dictionary").addEventListener("click", () => { complete("lecture"); navigate("dictionary"); });
    return;
  }
  if (course.visual.lectureMode === "guided-launch" || !course.visual.lectureVideo) {
    $("#app").innerHTML = `${pageHeader("Lesson video pending", "Video lesson", "Preview what this unit is about while the video lesson is being prepared.", "Video pending")}
      <div class="lecture-layout">
        <section class="unit-banner"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}"><div class="banner-copy"><span>${gradeLabel} unit preview</span><h2>Explore. Practise. Apply. Improve.</h2><p>${escapeHtml(course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}</p><button class="button gold" id="guided-launch-done" type="button">${icon("eye")} Preview this unit</button></div></section>
        <div class="section-stack"><section class="panel"><span class="eyebrow">${escapeHtml(journey.eyebrow)}</span><h2>${escapeHtml(journey.heading)}</h2>${lectureJourneyList(journey)}</section><section class="panel"><h3>Words in this unit</h3><p>Explore ${escapeHtml(groups)} in the linked ${gradeLabel} dictionary.</p><button class="button primary" id="to-dictionary" type="button">Open vocabulary ${icon("arrow-right")}</button></section></div>
      </div>`;
    $("#guided-launch-done").addEventListener("click", () => toast("Unit preview opened. The video lesson is marked complete once the video is ready."));
    $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
    return;
  }
  // Slide-by-slide playback. The lecture is one rendered video of consecutive
  // slides, so the slide times come from the manifest (lecture-media.json ::
  // lectureSlides, written by the lecture renderer and backfilled for the
  // lectures that predate it). Without them the player behaves exactly as it
  // always did — plays straight through — so a lecture whose times are missing
  // degrades to the old lecture rather than to a broken one.
  const lectureSlides = Array.isArray(course.visual.lectureSlides) ? course.visual.lectureSlides : [];
  $("#app").innerHTML = `${pageHeader("Begin here", "Teacher audiovisual lecture", lectureSlides.length > 1
    ? "One slide at a time. Each slide reads itself aloud and then waits — use the arrows to move on when you are ready."
    : "Watch and listen before you begin the independent lesson. Captions are available in the player.")}
    <div class="lecture-layout">
      <section class="panel video-shell"><div class="lecture-stage"><video id="lecture-video" controls preload="metadata" poster="${course.visual.lecturePoster}"><source src="${course.visual.lectureVideo}" type="video/mp4"><track kind="captions" src="${course.visual.lectureCaptions}" srclang="en" label="English" default></video>${lectureSlides.length > 1 ? `<button class="lecture-nav prev" id="slide-prev" type="button" aria-label="Previous slide">${icon("chevron-left")}</button><button class="lecture-nav next" id="slide-next" type="button" aria-label="Next slide">${icon("chevron-right")}</button>` : ""}</div><div class="video-footer"><p id="video-status">Teacher Musa · Unit ${course.unit.unitNo} lecture</p><button class="button gold" id="lecture-done" type="button" ${progress.completed.includes("lecture") ? "" : "disabled"}>${progress.completed.includes("lecture") ? icon("check") + " Lecture complete" : icon("play") + " Watch to complete"}</button></div></section>
      <div class="section-stack"><section class="panel"><span class="eyebrow">${escapeHtml(journey.eyebrow)}</span><h2>${escapeHtml(journey.heading)}</h2><p>Teacher Musa introduces ${escapeHtml(groups)}.</p>${lectureJourneyList(journey)}</section><section class="panel"><h3>Ready after the video?</h3><p>Complete the lecture before continuing to the vocabulary dictionary.</p><button class="button primary" id="to-dictionary" type="button" ${progress.completed.includes("lecture") ? "" : "disabled"}>Open vocabulary ${icon("arrow-right")}</button></section></div>
    </div>`;
  $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
  const lectureVideo = $("#lecture-video");
  const lectureDone = $("#lecture-done");
  lectureVideo.defaultPlaybackRate = AI_NARRATION_RATE;
  lectureVideo.playbackRate = AI_NARRATION_RATE;
  attachCaptions(lectureVideo);
  let slideIndex = 0;
  let lectureLength = "";
  const finishLecture = () => {
    if (progress.completed.includes("lecture")) return;
    lectureDone.disabled = false;
    $("#to-dictionary").disabled = false;
    lectureDone.innerHTML = `${icon("check")} Lecture complete`;
    complete("lecture", "Lecture complete. Your vocabulary lesson is ready.");
    icons();
  };
  lectureVideo.addEventListener("loadedmetadata", () => {
    const minutes = Math.max(1, Math.round(lectureVideo.duration / 60));
    lectureLength = `${minutes}-minute audiovisual lecture`;
    showStatus();
  });
  lectureVideo.addEventListener("error", () => {
    $("#video-status").textContent = "Lecture video could not be loaded.";
    toast("The lecture video is unavailable. Please refresh and try again.");
  });
  // Playing to the very end still completes: a learner who scrubs or lets the
  // last slide run out arrives here rather than at the boundary pause below.
  lectureVideo.addEventListener("ended", finishLecture);
  // Reaching the end of the lecture ARMS the button; the video finishing by
  // itself still completes without one. Both exist because the video is now the
  // only door into the rest of the unit — Vocabulary and everything after it
  // wait on this section — and "watched to the end" is not the same event as
  // "listened to the end". A stalled buffer, a player that never fires `ended`,
  // or a learner who stops half a second early all leave somebody who did the
  // work with no way to say so, and nothing else in the unit reachable.
  //
  // It cannot be used to skip: it stays disabled until the learner is ON the
  // final slide (or within a second of the end of a lecture with no slides),
  // which is the guarantee the no-finish-control rule was protecting.
  const armFinish = () => {
    if (progress.completed.includes("lecture") || !lectureDone.disabled) return;
    lectureDone.disabled = false;
    lectureDone.innerHTML = `${icon("check")} I have listened`;
    icons();
  };
  lectureDone.addEventListener("click", () => {
    if (!progress.completed.includes("lecture")) finishLecture();
    navigate("dictionary");
  });
  // Covers a lecture with no slide times, where the boundary check below never
  // runs and `ended` was the only path.
  lectureVideo.addEventListener("timeupdate", () => {
    if (lectureVideo.duration && lectureVideo.duration - lectureVideo.currentTime <= 1) armFinish();
  });

  // --- one slide at a time -------------------------------------------------
  // The video is not stopped from playing on: it is paused the moment it
  // reaches the end of the slide being watched. So a slide reads itself aloud
  // and then waits, and the arrows are what move the lecture forward.
  function showStatus() {
    if (!lectureSlides.length) {
      $("#video-status").textContent = `Teacher Musa · ${lectureLength || `Unit ${course.unit.unitNo} lecture`}`;
      return;
    }
    const slide = lectureSlides[slideIndex];
    const title = slide.title ? ` · ${slide.title}` : "";
    $("#video-status").textContent = `Slide ${slideIndex + 1} of ${lectureSlides.length}${title}`;
  }
  if (lectureSlides.length > 1) {
    const prev = $("#slide-prev");
    const next = $("#slide-next");
    // The slide being watched is authoritative; it is only re-derived from the
    // clock when the learner moves the clock themselves. Deriving it on every
    // timeupdate looked tidier and was wrong: the moment playback crossed into
    // the next slide the boundary check started testing the NEXT slide's end,
    // so the stop was silently skipped. It survived only while the slides had a
    // gap between them wide enough for a timeupdate to land in.
    const slideAt = (time) => {
      let found = 0;
      lectureSlides.forEach((slide, index) => { if (time >= slide.start - 0.02) found = index; });
      return found;
    };
    const syncNav = () => {
      prev.disabled = slideIndex === 0;
      next.disabled = slideIndex === lectureSlides.length - 1;
      // On the last slide the lecture has been walked to its end, so the finish
      // button becomes pressable — whether or not the clock reaches the end.
      if (slideIndex === lectureSlides.length - 1) armFinish();
      showStatus();
    };
    // Parked a frame short of the change, never on it: at the boundary itself
    // the video already shows the next slide, and the label would follow.
    const PARK_BEFORE_END = 0.05;
    let parking = false;
    const goToSlide = (index) => {
      slideIndex = Math.max(0, Math.min(lectureSlides.length - 1, index));
      parking = true;
      lectureVideo.currentTime = lectureSlides[slideIndex].start;
      syncNav();
      // A click is a user gesture, so this play() is always allowed — which is
      // what makes "arrive at a slide and it reads itself" possible at all.
      lectureVideo.play().catch(() => { /* the learner can press play */ });
    };
    prev.addEventListener("click", () => goToSlide(slideIndex - 1));
    next.addEventListener("click", () => goToSlide(slideIndex + 1));
    // Pressing play while parked at the end of a slide means "carry on", so the
    // next slide becomes the one being watched — otherwise it would stop again
    // immediately on the boundary it is already sitting on.
    lectureVideo.addEventListener("play", () => {
      const slide = lectureSlides[slideIndex];
      if (slideIndex < lectureSlides.length - 1 && lectureVideo.currentTime >= slide.end - 0.15) {
        slideIndex += 1;
        syncNav();
      }
    });
    lectureVideo.addEventListener("timeupdate", () => {
      if (lectureVideo.paused) return;
      const slide = lectureSlides[slideIndex];
      if (lectureVideo.currentTime >= slide.end - PARK_BEFORE_END) {
        lectureVideo.pause();
        parking = true;
        lectureVideo.currentTime = slide.end - PARK_BEFORE_END;
        if (slideIndex === lectureSlides.length - 1) finishLecture();
      }
    });
    lectureVideo.addEventListener("seeked", () => {
      // Our own parking seek must not be read as the learner jumping somewhere.
      if (parking) { parking = false; return; }
      slideIndex = slideAt(lectureVideo.currentTime);
      syncNav();
    });
    syncNav();
  }
  showStatus();
}

function linkedWords() {
  return course.dictionaryLinks.map((link) => ({ ...link, master: dictionary.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId) }));
}

// ── Grades 1-4: the original design AND the slide deck ───────────────────────
// A unit module at Grades 1-4 shows both designs, in this order: the original
// section first, then the same content as an inline deck under it. The deck used
// to REPLACE the original page here; now it joins it. Grades 5-8 are untouched —
// they never had a deck, and the boundary is still 4 (see DECK_MAX_STAGE in the
// other subjects: by Grade 5 a learner scans a page rather than being walked
// through it one item at a time).
//
// Two things make this more than an extra function call. Both designs draw the
// same section, so both carry the same hooks: #word-search and #group-filter,
// data-word, data-check-answer, data-writing-audio, data-record. A
// document-wide querySelector would hand the vocabulary lab the deck's search
// box, and the recorder the wrong <audio>. And the original renderers paint by
// assigning to #app.innerHTML, which would erase a deck mounted below them the
// moment a subtab or a filter redrew.
//
// So each design gets its own region. The original renderer queries through
// classicScope, whose "#app" IS that region — so it keeps writing the line it
// always wrote and lands in .classic-design instead of over the whole page — and
// the deck mounts into .deck-design with full-bleed off. At Grades 5-8 the
// region is null, "#app" is the page root again and the document is the scope,
// so those grades run exactly the code they ran before.
const BOTH_DESIGNS = gradeNumber <= 4;
let classicRegion = null;
let deckMount = null;

// Called once at the top of an original renderer. It captures the region THEN,
// so the redraws a subtab or a search box triggers keep painting into the same
// half of the page rather than over the whole app.
//
// "#app" resolves to the region rather than to the page root, which is what lets
// the original renderers keep the line they always had — `$("#app").innerHTML =
// …` — and paint into their half of a both-designs page without being rewritten.
// Same form Mathematics uses (shell/subjects/mathematics.js :: classicScope);
// the two subjects do the same thing and should not do it two ways.
function classicScope() {
  const region = classicRegion;
  const scope = region || document;
  return {
    $: (selector) => (selector === "#app" ? (region || document.querySelector("#app")) : scope.querySelector(selector)),
    $$: (selector) => [...scope.querySelectorAll(selector)],
  };
}

function renderBothDesigns(classic, carousel, intro) {
  // The page guide (renderSectionGuide, run by onAfterRender) sits above this
  // whole block and links down to the deck: the original paints first and is
  // tall, so the deck and its instruction slide are below the fold.
  $("#app").innerHTML = `<div class="both-designs">
      <div class="classic-design" id="classic-design"></div>
      <section class="deck-design">
        <div class="deck-design-head"><span class="eyebrow">Slides</span><p>${escapeHtml(intro)}</p></div>
        <div id="deck-design"></div>
      </section>
    </div>`;
  classicRegion = $("#classic-design");
  classic();
  // The deck is mounted second and left mounted: the region survives the
  // original's own redraws, which now stop at .classic-design. Both flags are
  // cleared by onBeforeRender before the next section draws.
  deckMount = "#deck-design";
  carousel();
  deckMount = null;
}

function renderDictionary() {
  // Grades 1-4 meet one word at a time in the deck, and keep the searchable
  // two-column lab above it. From Grade 5 the lab is the whole section: by then
  // a learner is looking words UP, and a unit can carry 70 of them.
  if (BOTH_DESIGNS) return renderBothDesigns(renderDictionaryClassic, renderWordCarousel, "The same words, one at a time.");
  return renderDictionaryClassic();
}

// The picture beside a word, wherever the dictionary draws one. The lemma is
// tried first so that "feet" and "foot" — one master entry — get one picture,
// and a word with no honest picture in word-pictures.js gets none rather than a
// decorative stand-in.
//
// EVERY grade draws pictures, 1 through 8. This started as a Grades 1-4 feature
// on the same line as the deck and was extended on request; the line was never
// load-bearing, because a picture beside a word is not the slide deck the upper
// stages are gated against. What the upper stages actually keep is their layout
// — the two-column lab, no gc-* nodes, no body.gc-full — and a picture column
// inside that lab does not touch any of it.
//
// What DOES differ by grade is how much of the vocabulary can honestly carry a
// picture: about four fifths at Grade 1 against roughly a third at Grade 8,
// because the words turn abstract. That is why the gutter is decided per list
// rather than per grade (see drawList) — a section with nothing picturable in
// it keeps the original two-column row.
//
// The grade goes in because a few lemmas are two different words across the
// course — Grade 1's "light" is a traffic signal and Grade 3's "march" is a
// month — and word-pictures.js resolves that per grade.
const dictionaryPicture = (entry) => (entry ? wordPicture(entry.lemma, gradeNumber) || wordPicture(entry.displayWord, gradeNumber) : "");

function renderDictionaryClassic() {
  const { $, $$ } = classicScope();
  const words = linkedWords();
  // The lab LISTS every word and COMPLETES on the taught ones (see taughtWords).
  const taught = taughtWords();
  activeWordId = activeWordId || words[0].vocabularyId;
  $("#app").innerHTML = `${pageHeader("Linked master dictionary", "Vocabulary lab", `Search the ${gradeLabel} sub-dictionary. Every word links to one reusable master entry and approved pronunciation.`, `${dictionary.entryCount} master entries`)}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search dictionary"></label><select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${escapeHtml(group.title)}</option>`).join("")}</select><span id="dictionary-count" class="status-chip">${words.length} words</span></div>
    <div class="dictionary-layout"><section class="panel word-list" id="word-list"></section><section class="panel word-card" id="word-card"></section></div>`;
  const drawList = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    const filtered = words.filter((item) => (group === "all" || item.groupId === group) && (!query || `${item.master.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    $("#dictionary-count").textContent = `${filtered.length} words`;
    // The picture column is decided for the LIST, not per row: about a fifth of
    // Grade 1's words have no honest picture, and giving only the pictured rows
    // a gutter left the words themselves on a ragged left edge, which is harder
    // to scan than a blank square. So once any word in the section has a
    // picture every row reserves the same column, and the ones without simply
    // leave it empty. A section where nothing is pictured keeps the original
    // two-column row untouched.
    //
    // Decided from the WHOLE section, never from the filtered view. Filtering is
    // what the search box and the group menu do on every keystroke, and a gutter
    // computed from `filtered` appears and disappears as a learner types —
    // every word in the list jumping 45px sideways when a query happens to
    // match nothing pictured. That is most visible at Grades 7-8, where under a
    // third of the words carry a picture, so the empty-view case is common
    // rather than a curiosity.
    const pictured = words.some((item) => dictionaryPicture(item.master));
    $("#word-list").classList.toggle("pictured", pictured);
    $("#word-list").innerHTML = filtered.length ? filtered.map((item) => `<button class="word-row ${item.vocabularyId === activeWordId ? "active" : ""}" data-word="${item.vocabularyId}" type="button">${pictured ? `<span class="word-row-picture" aria-hidden="true">${dictionaryPicture(item.master)}</span>` : ""}<span><strong>${escapeHtml(item.master.displayWord)}</strong><small>${escapeHtml(item.master.partOfSpeech)} · ${escapeHtml(item.groupTitle)}</small></span>${progress.knownWords.includes(item.vocabularyId) ? "<span>LEARNED</span>" : ""}</button>`).join("") : `<div class="empty">No matching words found.</div>`;
    $$('[data-word]').forEach((button) => button.addEventListener("click", () => { activeWordId = button.dataset.word; activeSentence = 0; drawList(); drawWord(); showWordInDeck?.(activeWordId); }));
  };
  const drawWord = () => {
    const item = words.find((word) => word.vocabularyId === activeWordId) || words[0];
    const sentence = item.practiceSentences[activeSentence] || item.exampleSentence;
    // The word's own pronunciation, same "ship ahead of the audio" rule as
    // meaningAudio below: these buttons are drawn only once a clip exists, so
    // a newly-added word with no recording yet shows no control that could
    // only ever fail to play.
    const wordAudioActions = item.master.audio?.available ? `<div class="audio-actions"><button class="icon-button" id="listen-word" type="button" title="Listen at 0.90x" aria-label="Listen to ${escapeHtml(item.master.displayWord)} at 0.90x">${icon("volume-2")}</button><button class="icon-button" id="slow-word" type="button" title="Replay at 0.90x" aria-label="Replay at 0.90x">${icon("rotate-ccw")}</button></div>` : "";
    // The picture leads the card, ahead of the part of speech: a Grade 1 reader
    // recognises the thing before they can read "noun · a naming word".
    const cardPicture = dictionaryPicture(item.master);
    $("#word-card").innerHTML = `<div class="word-card-head">${cardPicture ? `<div class="word-card-picture" aria-hidden="true">${cardPicture}</div>` : ""}<div><span class="word-type">${escapeHtml(item.master.partOfSpeech)}</span><h2>${escapeHtml(item.master.displayWord)}</h2><small>${escapeHtml(item.master.partOfSpeechDefinition)}</small></div>${wordAudioActions}</div><p class="meaning"><span class="field-label">Meaning:</span> ${escapeHtml(item.childMeaning)}${item.meaningAudio?.available ? ` <button class="icon-button" id="hear-meaning" type="button" title="Listen to the meaning" aria-label="Listen to the meaning of ${escapeHtml(item.master.displayWord)}">${icon("volume-2")}</button>` : ""}</p><div class="sentence-card"><small>In a sentence · ${activeSentence + 1} of ${item.practiceSentences.length}</small><p>${linkGlossaryWords(sentence, item.master.displayWord)}</p><div class="sentence-controls"><button class="icon-button" id="previous-sentence" type="button" aria-label="Previous sentence">${icon("arrow-left")}</button><div class="sentence-dots">${item.practiceSentences.map((_, index) => `<button class="sentence-dot ${index === activeSentence ? "active" : ""}" data-sentence="${index}" type="button" aria-label="Sentence ${index + 1}"></button>`).join("")}</div><button class="button ghost" id="hear-sentence" type="button">${icon("volume-2")} Hear sentence</button><button class="icon-button" id="next-sentence" type="button" aria-label="Next sentence">${icon("arrow-right")}</button></div></div><div><span class="field-label">Spelling:</span> ${escapeHtml(item.spellingPractice)}</div><div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="${escapeHtml(item.sentenceStarter)}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div><div id="word-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button secondary" id="know-word" type="button">${progress.knownWords.includes(item.vocabularyId) ? icon("check-circle") + " Learned" : icon("bookmark-plus") + " I know this word"}</button>`;
    if (item.master.audio?.available) {
      const play = (button = null) => playAudio(item.master.audio.normal, {
        rate: AI_NARRATION_RATE,
        start: item.master.audio.cueStart,
        end: item.master.audio.cueEnd,
        button,
      });
      $("#listen-word").addEventListener("click", (event) => play(event.currentTarget));
      $("#slow-word").addEventListener("click", (event) => play(event.currentTarget));
    }
    // The definition read aloud, distinct from the word itself and from the practice
    // sentences. Rendered only once a clip exists: the descriptors ship ahead of the
    // audio (available:false, "Not yet generated") while the scripts are in review,
    // and a control that could only ever say "not available" on every word is worse
    // than no control. It appears on its own as soon as a clip is generated.
    if (item.meaningAudio?.available) {
      $("#hear-meaning").addEventListener("click", (event) => playAudio(item.meaningAudio.source, {
        rate: AI_NARRATION_RATE,
        start: item.meaningAudio.cueStart,
        end: item.meaningAudio.cueEnd,
        button: event.currentTarget,
      }));
    }
    $("#hear-sentence").addEventListener("click", (event) => {
      const descriptor = item.sentenceAudio[activeSentence];
      if (!descriptor || descriptor.available === false) return toast("This sentence recording is not available yet.");
      playAudio(descriptor.source, { rate: AI_NARRATION_RATE, start: descriptor.cueStart, end: descriptor.cueEnd, button: event.currentTarget });
    });
    $("#previous-sentence").addEventListener("click", () => { activeSentence = (activeSentence - 1 + item.practiceSentences.length) % item.practiceSentences.length; drawWord(); icons(); });
    $("#next-sentence").addEventListener("click", () => { activeSentence = (activeSentence + 1) % item.practiceSentences.length; drawWord(); icons(); });
    $$('[data-sentence]').forEach((dot) => dot.addEventListener("click", () => { activeSentence = Number(dot.dataset.sentence); drawWord(); icons(); }));
    $("#check-word-sentence").addEventListener("click", (event) => {
      const value = $("#word-sentence").value.trim();
      // A free local gate for the "nothing to check yet" case, so an empty or
      // near-empty box gets an instant answer instead of spending a real
      // request on it. Everything past that goes to Wehel — a regex can tell
      // whether the word appears, not whether the sentence is any good.
      if (value.length < 3) {
        $("#word-feedback").innerHTML = `<p class="feedback try">Write a sentence using "${escapeHtml(item.master.displayWord)}" first.</p>`;
        return;
      }
      checkWritingWithWehel(`Check my sentence using the word "${item.master.displayWord}": "${value}"`, event.currentTarget, $("#word-feedback"));
    });
    $("#know-word").addEventListener("click", () => {
      if (!progress.knownWords.includes(item.vocabularyId)) progress.knownWords.push(item.vocabularyId);
      if (allWordsKnown(taught)) complete("dictionary"); else saveProgress();
      refreshDeckWordCount?.();
      drawList(); drawWord(); icons(); toast(`${item.master.displayWord} added to My Word Book.`);
    });
    icons();
  };
  $("#word-search").addEventListener("input", drawList);
  $("#group-filter").addEventListener("change", drawList);
  drawList(); drawWord();
}

// ── The gc-* slide deck ──────────────────────────────────────────────────────
// How Grades 1-4 meet a section: one item per full-screen slide, big audio
// buttons, side arrows, a dot strip, swipe. The plumbing now lives in
// ../deck.js, shared with Mathematics, which meets a Stage 1 learner the same
// way. English keeps its own audio player and its lucide icons; the deck is told
// what to silence on a slide change and what to re-bind after a repaint.
const baseDeck = createDeck({ $, escapeHtml, icon, stopAudio, afterPaint: icons });
const { deckFinish } = baseDeck;
// Where a deck lands is decided by whoever is rendering, not by the six
// carousels: a both-designs page sets deckMount and every carousel below mounts
// inline under the original section without knowing about it. Every English deck
// arrives that way now — the unset branch is what a carousel would get if it were
// ever mounted as a section on its own again, which is how Grades 1-4 worked
// before the original designs were restored above them.
//
// Every English deck also ends on a CLOSING slide, added here so the six
// carousels get it without knowing about it — the mirror of the intro slide the
// shared deck puts in front. Before the section is finished it holds the deck's
// Finish button (`finish: [action, label]`, the same data-deck-finish the
// subject's onClick already handles) or, for a deck that finishes some other
// way, a line saying what does (`closingHint`). Once the tick lands it is
// redrawn as the celebration — the same words as the card under the page
// (completionCopy) — with the way on. So a Grade 1-4 learner who never scrolls
// below the deck still meets "you finished this" where they are.
//
// The closing slide is the subject's LAST slide, so it counts in `count` and
// gets a dot; the subject's own onSlide is not told about it (nothing to look at
// there). The shared deck numbers everything it holds, so left alone it would
// say "Pattern 7 of 7" over six patterns — relabel() re-counts over the content
// slides alone and calls the closing one "The end", in the counter, the dots
// and each slide's aria-label. It runs after every move (onSlide, and a click
// on the deck for the intro dot, which onSlide never reports) because the deck
// rewrites those labels on every goTo. A subject that re-decks (setSlides) gets
// the closing slide appended again.
let activeDeck = null;
const mountDeck = (options) => {
  const { finish = null, closingHint = "", onSlide = null, slides = [], ...rest } = options;
  const label = options.label || "Slide";
  const closing = () => deckClosingSlide({ finish, hint: closingHint });
  const withClosing = (list) => (list.length ? [...list, closing()] : list);
  const relabel = (deck) => {
    const n = deck.count - 1;
    if (n < 0) return;
    const name = (i) => (i === n ? "The end" : `${label} ${i + 1} of ${n}`);
    const slideNodes = deck.root.querySelectorAll(".gc-track > .gc-slide");
    const offset = slideNodes.length - deck.count; // 1 with an intro slide in front
    slideNodes.forEach((node, pos) => { if (pos - offset >= 0) node.setAttribute("aria-label", name(pos - offset)); });
    deck.root.querySelectorAll("[data-dot]").forEach((dot, pos) => { if (pos - offset >= 0) dot.setAttribute("aria-label", name(pos - offset)); });
    const count = deck.root.querySelector("#gc-count");
    if (!count) return;
    if (deck.index >= 0) count.textContent = name(deck.index);
    else count.textContent = count.textContent.replace(/^\d+/, String(n)); // the intro's "14 words"
  };
  const deck = baseDeck.mountDeck({
    ...rest,
    ...(deckMount ? { mount: deckMount, fullBleed: false } : {}),
    slides: withClosing(slides),
    onSlide: (index, self) => {
      relabel(self);
      if (index < self.count - 1) onSlide?.(index, self);
    },
  });
  const baseSetSlides = deck.setSlides;
  deck.setSlides = (next, opts) => { baseSetSlides(withClosing([...next]), opts); relabel(deck); };
  deck.refreshClosing = () => { if (deck.count) { deck.redrawSlide(deck.count - 1, closing()); relabel(deck); } };
  deck.root.addEventListener("click", (event) => {
    relabel(deck); // the deck's own listeners ran first, so any move has happened
    const go = event.target.closest("[data-complete-go]");
    if (go) navigate(go.dataset.completeGo);
  });
  relabel(deck);
  activeDeck = deck;
  return deck;
};

function deckClosingSlide({ finish, hint }) {
  if (!progress.completed.includes(route)) {
    return `<section class="gc-slide gc-closing gc-v0"><div class="gc-inner">
      <span class="gc-eyebrow">The end of the slides</span>
      <h3 class="gc-title">You reached the end!</h3>
      <p class="gc-lead">${escapeHtml(hint || (finish ? "Press the button to finish this section." : "Finish the task on the slides and this section gets its tick."))}</p>
      ${finish ? deckFinish(finish[0], finish[1]) : ""}
    </div></section>`;
  }
  const { unitDone, eyebrow, title, body, action } = completionCopy({ buttons: { primary: "gc-btn", gold: "gc-btn gc-gold" } });
  return `<section class="gc-slide gc-closing is-done ${unitDone ? "is-unit" : ""} gc-v0"><div class="gc-inner">
      <div class="gc-closing-mark" aria-hidden="true">${icon(unitDone ? "trophy" : "check")}</div>
      <span class="gc-eyebrow">${escapeHtml(eyebrow)}</span>
      <h3 class="gc-title">${escapeHtml(title)}</h3>
      <p class="gc-lead">${escapeHtml(body)}</p>
      ${action}
    </div></section>`;
}

// The instruction slide in front of each deck: what the learner does on the
// slides, and what finishes the section. One line is the section's own; the
// two about moving on and listening are the same everywhere, because the deck
// works the same everywhere. Written for the youngest reader — this deck is
// what a Grade 1 learner meets — and kept to three lines, since a slide of
// instructions the learner cannot read is a slide they swipe past.
const DECK_STEP_NEXT = ["chevron-right", "Press the arrow to go to the next slide."];
const DECK_STEP_LISTEN = ["volume-2", "Press the speaker to hear it read to you."];
const DECK_INTROS = {
  dictionary: { title: "Say the words", steps: [["book-a", "One word at a time. Say each word out loud, then press “I know this word”."], DECK_STEP_LISTEN, DECK_STEP_NEXT] },
  reading: { title: "Read the story", steps: [["book-open", "One page at a time. Read it, or listen to it."], DECK_STEP_LISTEN, ["check", "On the last page, press “I have read this text”."]] },
  comprehension: { title: "Think about the story", steps: [["list-checks", "One question at a time. Say your answer, then press “Check guidance” to see a good answer."], DECK_STEP_NEXT, ["check", "On the last slide, press “Finish comprehension”."]] },
  grammar: { title: "Say the patterns", steps: [["braces", "One pattern at a time. Say it out loud and try the practice."], DECK_STEP_LISTEN, ["check", "Go through every pattern to the last slide to finish."]] },
  speaking: { title: "Use your voice", steps: [["messages-square", "One practice at a time. Press “Hear model”, then say it yourself."], ["mic", "Press Record to record yourself, then Submit."], DECK_STEP_NEXT] },
  writing: { title: "Plan, write and improve", steps: [["pencil-line", "One task at a time. Write your own sentences in the box — at least eight words."], ["send", "Press “Submit this draft” to save your writing."], DECK_STEP_NEXT] },
  activities: { title: "Learn by doing", steps: [["shapes", "One activity at a time. Do it, then press “Mark complete”."], DECK_STEP_LISTEN, ["check", "On the last slide, press “Finish activities”."]] },
};
const deckIntro = (id) => DECK_INTROS[id] || null;

// Vocabulary as a slide deck, on the Grade 1 grammar carousel's design (gc-*):
// one word per vivid slide, big Hear buttons, side arrows, dots, swipe.
//
// Everything the two-column lab shows is preserved — the word, part of speech
// and its definition, the child-facing meaning, all five practice sentences with
// their own audio, the spelling practice, the write-your-own-sentence check and
// "I know this word" — only the layout changes. What does NOT carry over from
// grammar is the assumption of six items: a unit holds 30-423 words once the
// story glossary is counted (13-70 without it), so the search and group filter
// come with it and narrow the deck itself. They sit under the dots rather than
// in .gc-top, which the full-bleed CSS hid.
function renderWordCarousel() {
  const allWords = linkedWords();
  // Same split as the lab: the deck WALKS every word and COMPLETES on the taught
  // ones. The two lists are already in the right order — the glossary group is
  // last in every unit that has one — so a learner meets the section's own words
  // before the reference and never has to reach slide 400 to earn the tick.
  const taught = taughtWords();
  const learnedTaught = () => taught.filter((item) => progress.knownWords.includes(item.vocabularyId)).length;
  const esc = escapeHtml;
  // One sentence position per word: in a deck each word keeps its own place,
  // where the lab had a single cursor because only one word was ever on screen.
  const sentenceAt = new Map();
  let words = allWords;

  const wordSlide = (item, index) => {
    const sentences = item.practiceSentences?.length ? item.practiceSentences : [item.exampleSentence].filter(Boolean);
    const position = Math.min(sentenceAt.get(item.vocabularyId) || 0, Math.max(0, sentences.length - 1));
    const known = progress.knownWords.includes(item.vocabularyId);
    const sentenceAudio = item.sentenceAudio?.[position];
    const picture = dictionaryPicture(item.master);
    return `<section class="gc-slide gc-v${index % 5}" data-slide="${esc(item.vocabularyId)}"><div class="gc-inner">
      <span class="gc-eyebrow">Word ${index + 1} of ${words.length} · ${esc(item.master.partOfSpeech)}${item.groupTitle ? ` · ${esc(item.groupTitle)}` : ""}</span>
      ${picture ? `<div class="wc-picture" aria-hidden="true">${picture}</div>` : ""}
      <div class="gc-pattern" lang="en">${esc(item.master.displayWord)}</div>
      <p class="gc-lead">${esc(item.childMeaning)}</p>
      <div class="gc-actions">
        ${item.master.audio?.available ? `<button class="gc-btn play" type="button" data-word-audio="${esc(item.vocabularyId)}">${icon("volume-2")} Hear it</button>
        <button class="gc-btn ghost" type="button" data-word-audio="${esc(item.vocabularyId)}">${icon("rotate-ccw")} Again</button>` : ""}
        ${item.meaningAudio?.available ? `<button class="gc-btn ghost" type="button" data-meaning-audio="${esc(item.vocabularyId)}">${icon("volume-2")} Meaning</button>` : ""}
      </div>
      <small class="gc-source">ElevenLabs · approved Ehel voice · 0.90x</small>
      ${sentences.length ? `<div class="wc-sentence">
        <small>In a sentence · ${position + 1} of ${sentences.length}</small>
        <p>${linkGlossaryWords(sentences[position], item.master.displayWord)}</p>
        <div class="wc-sentence-controls">
          <button class="icon-button" type="button" data-sentence-step="-1" data-word="${esc(item.vocabularyId)}" aria-label="Previous sentence" ${sentences.length < 2 ? "disabled" : ""}>${icon("arrow-left")}</button>
          <div class="sentence-dots">${sentences.map((_, i) => `<button class="sentence-dot ${i === position ? "active" : ""}" type="button" data-sentence-dot="${i}" data-word="${esc(item.vocabularyId)}" aria-label="Sentence ${i + 1}"></button>`).join("")}</div>
          <button class="gc-btn ghost small" type="button" data-sentence-audio="${esc(item.vocabularyId)}" ${sentenceAudio?.available ? "" : "disabled"}>${icon("volume-2")} Hear sentence</button>
          <button class="icon-button" type="button" data-sentence-step="1" data-word="${esc(item.vocabularyId)}" aria-label="Next sentence" ${sentences.length < 2 ? "disabled" : ""}>${icon("arrow-right")}</button>
        </div>
      </div>` : ""}
      ${item.spellingPractice ? `<p class="gc-note"><span class="field-label">Spelling:</span> ${esc(item.spellingPractice)}</p>` : ""}
      <details class="gc-practice"><summary>Write your own sentence</summary>
        <div class="practice-box"><input data-write="${esc(item.vocabularyId)}" maxlength="180" placeholder="${esc(item.sentenceStarter || "")}…" aria-label="Write your own sentence using ${esc(item.master.displayWord)}"><button class="button primary" type="button" data-check="${esc(item.vocabularyId)}">Check sentence</button></div>
        <div data-feedback="${esc(item.vocabularyId)}" role="status" aria-live="polite" aria-atomic="true"></div>
      </details>
      <button class="gc-btn ${known ? "done" : "ghost"}" type="button" data-know="${esc(item.vocabularyId)}">${known ? `${icon("check-circle")} Learned` : `${icon("bookmark-plus")} I know this word`}</button>
    </div></section>`;
  };

  const wordFor = (id) => words.find((item) => item.vocabularyId === id);
  const sentencesFor = (item) => (item.practiceSentences?.length ? item.practiceSentences : [item.exampleSentence].filter(Boolean));
  // Repaint one slide in place, addressed by word rather than by position: the
  // deck is filtered, so a word's index moves under it.
  const redrawWord = (id) => {
    const position = words.findIndex((item) => item.vocabularyId === id);
    if (position < 0) return;
    deck.redrawSlide(position, wordSlide(words[position], position));
  };

  // Lets the word list ABOVE move this deck. At Grades 1-4 both designs are on
  // screen showing the same words, so picking a word in the lab and watching the
  // deck stay on the previous one reads as the page ignoring the click — which
  // is what a learner reported. The lab already repaints its own card; this is
  // the other half of that.
  //
  // Published as a function rather than the deck itself so the lookup happens
  // against `words` AS IT IS WHEN CLICKED — the deck filters itself, so a word's
  // index moves under it, the same reason redrawWord addresses slides by id.
  //
  // A word the deck has filtered out has no slide to show, so the click moves
  // the lab alone. The two halves filter independently on purpose (see inDeck
  // below), and yanking the deck's filter open from the other design would be a
  // bigger surprise than leaving it where the learner put it.
  showWordInDeck = (id) => {
    const position = words.findIndex((item) => item.vocabularyId === id);
    if (position >= 0) deck.goTo(position);
  };
  // Reads through inDeck, so it writes into THIS deck's chip and never the
  // lab's — and it is a no-op before mountDeck has painted, which is why it
  // guards rather than assuming the node is there.
  refreshDeckWordCount = () => {
    const chip = inDeck("#wc-known");
    if (chip) chip.textContent = `${learnedTaught()} of ${taught.length} new words`;
  };

  const deck = mountDeck({
    heading: "Say the words",
    label: "Word",
    intro: deckIntro("dictionary"),
    finish: ["dictionary", "I have learned these words"],
    emptyMessage: "No matching words. Clear the search to see them all.",
    // Sits below the dots, not in .gc-top, which the full-bleed CSS hides. A unit
    // holds up to 423 words, so the deck itself is what the search narrows.
    tools: `<div class="wc-tools">
        <label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search vocabulary"></label>
        <select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${esc(group.title)}</option>`).join("")}</select>
        <span class="status-chip" id="wc-known">${learnedTaught()} of ${taught.length} new words</span>
      </div>`,
    onSlide: (position) => { activeWordId = words[position]?.vocabularyId || activeWordId; },
    onClick: (event) => {
      const target = event.target.closest("[data-word-audio], [data-meaning-audio], [data-sentence-audio], [data-sentence-step], [data-sentence-dot], [data-check], [data-know], [data-deck-finish]");
      if (!target) return undefined;
      const id = target.dataset.word || target.dataset.wordAudio || target.dataset.meaningAudio
        || target.dataset.sentenceAudio || target.dataset.check || target.dataset.know;
      const item = wordFor(id);

      // The last slide's finish button holds to the same rule as the lab: it
      // used to complete the section outright, which let a learner swipe to the
      // end and take the tick with no word marked. Now it names what is left.
      if (target.dataset.deckFinish) {
        if (allWordsKnown(taught)) return complete("dictionary", "Vocabulary complete. Well done!");
        const left = taught.length - learnedTaught();
        return toast(`Mark every new word with “I know this word” first — ${left} to go.`);
      }
      if (!item) return undefined;
      if (target.dataset.wordAudio) {
        return playAudio(item.master.audio.normal, { rate: AI_NARRATION_RATE, start: item.master.audio.cueStart, end: item.master.audio.cueEnd, button: target });
      }
      if (target.dataset.meaningAudio) {
        return playAudio(item.meaningAudio.source, { rate: AI_NARRATION_RATE, start: item.meaningAudio.cueStart, end: item.meaningAudio.cueEnd, button: target });
      }
      if (target.dataset.sentenceAudio) {
        const descriptor = item.sentenceAudio?.[sentenceAt.get(id) || 0];
        if (!descriptor?.available) return toast("This sentence recording is not available yet.");
        return playAudio(descriptor.source, { rate: AI_NARRATION_RATE, start: descriptor.cueStart, end: descriptor.cueEnd, button: target });
      }
      if (target.dataset.sentenceStep || target.dataset.sentenceDot !== undefined) {
        const total = sentencesFor(item).length;
        const current = sentenceAt.get(id) || 0;
        const next = target.dataset.sentenceDot !== undefined
          ? Number(target.dataset.sentenceDot)
          : (current + Number(target.dataset.sentenceStep) + total) % total;
        sentenceAt.set(id, next);
        return redrawWord(id);
      }
      if (target.dataset.check) {
        const value = (inDeck(`[data-write="${CSS.escape(id)}"]`)?.value || "").trim();
        const box = inDeck(`[data-feedback="${CSS.escape(id)}"]`);
        if (value.length < 3) {
          if (box) box.innerHTML = `<p class="feedback try">Write a sentence using "${escapeHtml(item.master.displayWord)}" first.</p>`;
          return undefined;
        }
        checkWritingWithWehel(`Check my sentence using the word "${item.master.displayWord}": "${value}"`, target, box);
        return undefined;
      }
      if (target.dataset.know) {
        if (!progress.knownWords.includes(id)) progress.knownWords.push(id);
        // Same rule as the lab: the section completes when every word the unit
        // TEACHES is known, counted over the whole taught set and never over the
        // filtered deck — a learner who has searched down to one word would
        // otherwise finish the section on it.
        if (allWordsKnown(taught)) complete("dictionary"); else saveProgress();
        refreshDeckWordCount();
        redrawWord(id);
        toast(`${item.master.displayWord} added to My Word Book.`);
      }
      return undefined;
    },
  });

  // The deck's own controls, found inside the deck. At Grade 1 the vocabulary lab
  // is on the same page with a search box and a group filter under the very same
  // ids, and it is painted first — a document-wide lookup would leave the deck
  // filtering itself by whatever the lab's box said.
  const inDeck = (selector) => deck.root.querySelector(selector);
  const drawDeck = () => {
    const query = inDeck("#word-search").value.trim().toLowerCase();
    const group = inDeck("#group-filter").value;
    words = allWords.filter((item) => (group === "all" || item.groupId === group)
      && (!query || `${item.master.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    deck.setSlides(words.map(wordSlide));
  };
  inDeck("#word-search").addEventListener("input", drawDeck);
  inDeck("#group-filter").addEventListener("change", drawDeck);
  drawDeck();
}

// ===================== read-along line highlighting =====================
// No clip in this course carries word timings — a reading is one recording of
// the whole passage and a book page is one TTS render — so the highlight is
// estimated: each line's window of the audio is its share of the narration
// text's characters. That tracks a steady narrator closely enough to follow
// with a finger, which is the job; it is a guide for the eye, not a caption
// track.
let narrationSync = null;

function clearNarrationSync(player = null) {
  if (!narrationSync) return;
  if (player && narrationSync.player !== player) return;
  narrationSync.segments.forEach((segment) => segment.el?.classList?.remove("is-narrating"));
  narrationSync = null;
}

function narrationWeight(text) {
  return Math.max(1, prepareNarrationText(text).length);
}

// segments: [{ el, chars }] in narration order (el may be null for narrated
// text with no line on screen). sourceRanges: when the narration is split
// across several files, the [start, end) character range each file covers;
// null when one file reads everything.
function startNarrationSync(player, segments, sourceRanges = null) {
  clearNarrationSync();
  let total = 0;
  const bounds = segments.map((segment) => { const range = [total, total + segment.chars]; total += segment.chars; return range; });
  narrationSync = { player, segments, bounds, total, sourceRanges, sourceIndex: 0, active: -1 };
}

function narrationSyncTick(player) {
  const sync = narrationSync;
  if (!sync || sync.player !== player || !sync.total) return;
  const duration = player.duration;
  if (!Number.isFinite(duration) || duration <= 0) return;
  const fraction = Math.min(Math.max(player.currentTime / duration, 0), 1);
  let position;
  if (sync.sourceRanges) {
    const range = sync.sourceRanges[sync.sourceIndex] || [0, sync.total];
    position = range[0] + fraction * (range[1] - range[0]);
  } else {
    position = fraction * sync.total;
  }
  let index = sync.bounds.findIndex(([, end]) => position < end);
  if (index === -1) index = sync.segments.length - 1;
  if (index === sync.active) return;
  sync.segments[sync.active]?.el?.classList?.remove("is-narrating");
  sync.active = index;
  const el = sync.segments[index]?.el;
  if (el?.isConnected) {
    el.classList.add("is-narrating");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function setAudioButton(button, playing) {
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-busy", String(playing));
}

function stopAudio() {
  audioRequestId += 1;
  const player = $("#word-audio");
  player.pause();
  // Pause only — never strip src/load() here. stopAudio() is the shared kill
  // switch for every audio feature (mute toggle, Wehel's spoken replies, word
  // audio), none of which know the ebook reader exists or ever remount it.
  // Clearing src left the native player with nothing loaded: Chrome renders
  // that as fully disabled, unclickable transport controls, and only a manual
  // switch to another text in the shelf (which calls mountReadingAudioPlayer
  // again) brought it back. Pausing stops playback, which is the actual job.
  $("#ebook-reading-audio")?.pause();
  clearNarrationSync();
  if (pageNarrationCancel) pageNarrationCancel();
  pageNarrationCancel = null;
  pageNarrationActive = false;
  activeAudioEnd = null;
  if (activeAudioButton?.dataset?.voiceIdleHtml) {
    activeAudioButton.innerHTML = activeAudioButton.dataset.voiceIdleHtml;
    activeAudioButton.setAttribute("aria-label", activeAudioButton.dataset.voiceIdleLabel || "Listen");
    activeAudioButton.disabled = false;
    activeAudioButton.classList.remove("loading");
    icons();
  } else if (activeAudioButton?.matches?.("[data-page-voice]")) {
    activeAudioButton.innerHTML = `${icon("volume-2")} <span>Listen to this page</span>`;
    activeAudioButton.setAttribute("aria-label", "Listen to this page");
    activeAudioButton.disabled = false;
    activeAudioButton.classList.remove("loading");
    icons();
  }
  setAudioButton(activeAudioButton, false);
  activeAudioButton = null;
}

function playAudio(source, { rate = AI_NARRATION_RATE, start = 0, end = null, button = null } = {}) {
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  const player = $("#word-audio");
  stopAudio();
  const requestId = audioRequestId;
  activeAudioEnd = Number.isFinite(end) ? end : null;
  activeAudioButton = button;
  setAudioButton(button, true);
  const absoluteSource = resolveMediaUrl(source);
  const begin = () => {
    if (requestId !== audioRequestId) return;
    player.currentTime = Number.isFinite(start) ? start : 0;
    player.playbackRate = rate;
    player.play().catch(() => {
      if (requestId !== audioRequestId) return;
      setAudioButton(button, false);
      toast("The ElevenLabs recording could not be played. Please try again.");
    });
  };
  if (player.currentSrc !== absoluteSource) {
    player.src = absoluteSource; // rebased media-tier URL; raw `source` 404s on the CDN
    player.addEventListener("loadedmetadata", begin, { once: true });
    player.load();
  } else {
    begin();
  }
}

async function aiVoiceUrl(text) {
  const clean = prepareNarrationText(text).slice(0, 5000);
  if (!clean) throw new Error("There is nothing to read.");
  if (aiVoiceCache.has(clean)) return aiVoiceCache.get(clean);
  if (aiVoicePending.has(clean)) return aiVoicePending.get(clean);
  const pending = fetch(AI_TTS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: platformHeaders({ Accept: "audio/mpeg", "Content-Type": "application/json" }),
    body: JSON.stringify({ text: clean, purpose: "ehel_course_page", voiceId: AI_VOICE_ID }),
  }).then(async (response) => {
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `ElevenLabs voice failed (${response.status}).`);
    }
    const blob = await response.blob();
    if (!blob.size || !/^audio\//i.test(blob.type || "audio/mpeg")) throw new Error("The voice service returned invalid audio.");
    const url = URL.createObjectURL(blob);
    aiVoiceCache.set(clean, url);
    if (aiVoiceCache.size > 24) {
      const oldest = aiVoiceCache.keys().next().value;
      URL.revokeObjectURL(aiVoiceCache.get(oldest));
      aiVoiceCache.delete(oldest);
    }
    return url;
  }).finally(() => aiVoicePending.delete(clean));
  aiVoicePending.set(clean, pending);
  return pending;
}

async function playPageNarration(button, narrationOverride = null, readAlong = null) {
  if (!audioEnabled) { toast("Sound is muted. Use the sound button in the header to turn it on."); return false; }
  if (activeAudioButton === button) {
    stopAudio();
    return false;
  }
  let narrationOk = true;
  const narration = narrationOverride || collectPageNarration();
  if (!narration) return toast("There is nothing on this page to read yet.");
  stopAudio();
  const requestId = audioRequestId;
  const player = $("#word-audio");
  activeAudioButton = button;
  pageNarrationActive = true;
  button.dataset.voiceIdleHtml ||= button.innerHTML;
  button.dataset.voiceIdleLabel ||= button.getAttribute("aria-label") || "Listen";
  setAudioButton(button, true);
  button.innerHTML = `${icon("loader-circle")} <span>Preparing voice</span>`;
  button.classList.add("loading");
  icons();
  try {
    const chunks = narrationChunks(narration);
    const segments = readAlong?.length ? readAlong : null;
    const chunkRanges = segments ? narrationChunkRanges(chunks, segments.reduce((sum, segment) => sum + segment.chars, 0)) : null;
    if (segments) startNarrationSync(player, segments, chunkRanges);
    for (let index = 0; index < chunks.length; index += 1) {
      const source = await aiVoiceUrl(chunks[index]);
      if (requestId !== audioRequestId || !button.isConnected) return;
      if (segments && narrationSync?.player === player) narrationSync.sourceIndex = index;
      button.innerHTML = `${icon("square")} <span>Stop listening</span>`;
      button.setAttribute("aria-label", `Stop listening. Part ${index + 1} of ${chunks.length}`);
      button.classList.remove("loading");
      icons();
      await new Promise((resolve, reject) => {
        const finish = () => { cleanup(); resolve(); };
        const fail = () => { cleanup(); reject(new Error("The ElevenLabs recording could not be played.")); };
        const cleanup = () => {
          player.removeEventListener("ended", finish);
          player.removeEventListener("error", fail);
          if (pageNarrationCancel === cancel) pageNarrationCancel = null;
        };
        const cancel = () => { cleanup(); resolve(); };
        pageNarrationCancel = cancel;
        player.addEventListener("ended", finish, { once: true });
        player.addEventListener("error", fail, { once: true });
        player.src = source;
        player.playbackRate = AI_NARRATION_RATE;
        player.play().catch(fail);
      });
    }
  } catch (error) {
    narrationOk = false;
    if (requestId === audioRequestId && button.isConnected) toast("ElevenLabs narration is unavailable. Please try again.");
  } finally {
    if (requestId === audioRequestId) stopAudio();
  }
  return narrationOk;
}

async function prepareReadingNarration(reading, button) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Preparing audio`;
  button.classList.add("loading");
  icons();
  try {
    const chunks = narrationChunks(`${reading.title}\n${reading.passageScript}`);
    const sources = [];
    for (const chunk of chunks) sources.push(await aiVoiceUrl(chunk));
    readingVoiceSources.set(reading.readingId, sources);
    readingVoiceChunks.set(reading.readingId, chunks);
    if (button.isConnected) {
      button.hidden = true;
      const status = button.closest(".ebook-audio-wrap")?.querySelector("small");
      if (status) status.textContent = "ElevenLabs · ready · 0.90x";
      mountReadingAudioPlayer(reading);
      toast("Reading audio is ready. Press Play in the audio player.");
    }
  } catch {
    if (button.isConnected) {
      button.innerHTML = original;
      toast("ElevenLabs narration is unavailable. Please try again.");
    }
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.classList.remove("loading");
      icons();
    }
  }
}

function mountReadingAudioPlayer(reading) {
  const player = $("#ebook-reading-audio");
  if (!player) return;
  const sources = reading.audio?.available
    ? [resolveMediaUrl(reading.audio.source)]
    : readingVoiceSources.get(reading.readingId) || [];
  if (!sources.length) {
    player.hidden = true;
    return;
  }
  let index = 0;
  player.hidden = false;
  player.src = sources[index];
  player.playbackRate = AI_NARRATION_RATE;
  player.defaultPlaybackRate = AI_NARRATION_RATE;

  // Read-along. The recorded clip narrates the passage alone; the on-demand
  // ElevenLabs render is asked for the title first (prepareReadingNarration),
  // so that gets a title segment with no line on screen to highlight.
  const segments = readAlongSegments($("#reading-panel"));
  if (segments.length) {
    if (!reading.audio?.available) segments.unshift({ el: null, chars: narrationWeight(reading.title) });
    const chunks = reading.audio?.available ? null : readingVoiceChunks.get(reading.readingId);
    const total = segments.reduce((sum, segment) => sum + segment.chars, 0);
    const ranges = chunks?.length > 1 ? narrationChunkRanges(chunks, total) : null;
    // Nothing clears the highlight on pause: the marked line is where the
    // learner stopped, which is what they want to see when they come back.
    const sync = () => { startNarrationSync(player, segments, ranges); if (narrationSync) narrationSync.sourceIndex = index; };
    player.addEventListener("play", sync);
    player.addEventListener("timeupdate", () => narrationSyncTick(player));
  }

  player.addEventListener("play", () => {
    player.playbackRate = AI_NARRATION_RATE;
  });
  player.addEventListener("ended", () => {
    index += 1;
    if (index >= sources.length) return clearNarrationSync(player);
    player.src = sources[index];
    player.playbackRate = AI_NARRATION_RATE;
    player.play().catch(() => toast("Press Play to continue the reading."));
  });
}

// Chat replies speak with the browser voice, not ElevenLabs: a reply is
// written at request time, so no recorded clip can exist and every play would
// be a paid TTS call. Lesson narration elsewhere keeps the recorded Ehel voice.
let speakingAIIndex = null;
async function playAIMessage(index, button) {
  const message = aiState.messages[index];
  if (!message) return;
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  if (!browserSpeechSupported) return toast("This browser has no voice to read with.");
  if (speakingAIIndex === index) { stopBrowserSpeech(); speakingAIIndex = null; return; }
  speakingAIIndex = index;
  const original = button.innerHTML;
  button.classList.add("loading");
  await speakBrowser(message.text, {
    rate: speechRateForGrade(gradeNumber),
    onStart: () => { button.innerHTML = `${icon("square")} Stop`; icons(); },
  });
  if (speakingAIIndex === index) speakingAIIndex = null;
  button.innerHTML = original;
  button.classList.remove("loading");
  icons();
}

$("#word-audio").addEventListener("timeupdate", (event) => {
  narrationSyncTick(event.currentTarget);
  if (activeAudioEnd !== null && event.currentTarget.currentTime >= activeAudioEnd) stopAudio();
});
$("#word-audio").addEventListener("ended", () => {
  if (!pageNarrationActive) stopAudio();
});

// A passage broken into the blocks the reader draws: subheadings, and paragraphs
// (long ones split into groups of three sentences). Split out of
// readingBodyHtml so the page deck can group the SAME blocks into pages — a
// second splitter would eventually disagree with the reader about where a
// paragraph starts, and the two designs are showing one story.
function readingBlocks(value) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const blocks = [];
  for (const line of lines) {
    // A sentence may close on its quotation mark. Requiring the terminator to
    // be the LAST character called 483 lines of story dialogue headings —
    // “Look!” said Amal. “A red book!” drawn gold-bordered as if it introduced
    // a section, in every grade. The closing quote is part of the sentence end.
    const isHeading = line.length <= 72 && (!/[.!?][”’"')\]]*$/.test(line) || /:$/.test(line));
    if (isHeading) {
      blocks.push({ heading: true, words: 0, text: line.replace(/:$/, ""), html: `<h3 class="ebook-subheading">${escapeHtml(line.replace(/:$/, ""))}</h3>` });
      continue;
    }
    const sentences = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
    const groups = line.length > 320
      ? Array.from({ length: Math.ceil(sentences.length / 3) }, (_, index) => sentences.slice(index * 3, index * 3 + 3).join(" ").trim())
      : [line];
    // Each sentence is its own element so the read-along highlight has a line
    // to land on. Spans are inline and unstyled by default, so the printed
    // sheet and the deck draw exactly what they drew before.
    // `text` is the plain string the block was built from, carried alongside the
    // markup so a consumer that cannot use these classes — the printed worksheet,
    // whose window has none of this stylesheet — draws the SAME segmentation
    // rather than re-deriving the heading heuristic above and drifting from it.
    groups.filter(Boolean).forEach((paragraph) => blocks.push({ heading: false, words: readingWordCount(paragraph), text: paragraph, html: `<p>${readingLinesHtml(paragraph)}</p>` }));
  }
  return blocks;
}

function readingLinesHtml(value) {
  const sentences = narrationSentences(value);
  if (sentences.length < 2) return `<span class="rd-line">${escapeHtml(String(value).trim())}</span>`;
  return sentences.map((sentence) => `<span class="rd-line">${escapeHtml(sentence)}</span>`).join(" ");
}

function readingBodyHtml(value) {
  return readingBlocks(value).map((block) => block.html).join("");
}

// The lines the highlight walks, in narration order. A heading is one line; a
// paragraph is one line per sentence.
function readAlongSegments(root, selector = ".ebook-copy .rd-line, .ebook-copy .ebook-subheading") {
  if (!root) return [];
  return [...root.querySelectorAll(selector)].map((el) => ({ el, chars: narrationWeight(el.textContent) }));
}

// The same blocks gathered into pages for the deck. A paragraph is never split
// across a page boundary — it is already at most three sentences — so a page
// runs over budget rather than cutting a sentence group in half, and a page
// always holds at least one paragraph however long that paragraph is. A
// subheading opens the page it introduces instead of ending the one before it.
const READING_PAGE_WORDS = gradeNumber <= 2 ? 60 : 110;
function readingPages(value, budget = READING_PAGE_WORDS) {
  const pages = [];
  let page = [];
  let words = 0;
  const flush = () => { if (page.length) pages.push(page.join("")); page = []; words = 0; };
  for (const block of readingBlocks(value)) {
    // A subheading opens the page it introduces — but only once the page it is
    // leaving carries some story. Breaking on every heading gave the Grade 1
    // lesson-plan texts pages holding a title and one line, which reads as a
    // bug rather than as a page.
    if (block.heading) { if (words >= budget / 3) flush(); page.push(block.html); continue; }
    if (words && words + block.words > budget) flush();
    page.push(block.html);
    words += block.words;
  }
  flush();
  // A page of nothing but a subheading has no story on it; fold it forward.
  return pages.reduce((kept, html) => {
    if (kept.length && !/<p>/.test(kept[kept.length - 1])) kept[kept.length - 1] += html;
    else kept.push(html);
    return kept;
  }, []);
}

function readingWordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

// A unit whose texts are all written for the adult draws a grown-up panel here
// instead of the learner's e-book. Grade 1 Unit 0 is the case that forced it:
// all six of its "readings" are the weekly teacher plans — "Teacher Lesson
// Plan", "a quick note for the teacher", "By the end of Week 1, children will
// begin to" — and every one was narrated to a five-year-old.
//
// Marked, not moved. A section of their own is what Global Perspectives does
// with `grownUpGuide`, and it cannot work here: this unit's twelve
// comprehension questions ask about these documents ("The plan says q is
// special") and all twelve carry a readingId, so emptying `readings` would
// hard-fail validate-unit.mjs's comprehension.readingId cross-reference AND
// break the unit gate — `reading` is countable, so Unit 0 would finish without
// it while Unit 1 re-tests Unit 0 against a set that still demands it, and
// Unit 2 would never open.
//
// So `reading` stays countable and completable everywhere, and only what is
// DRAWN changes. No deck: a weekly plan is not something a child swipes
// through, and the adult reading it wants the whole week on one page.
const readingsAreForTheGrownUp = () => course.readings.length > 0
  && course.readings.every((text) => text.audience === "adult");

function renderReading() {
  if (readingsAreForTheGrownUp()) return renderReadingGrownUp();
  if (BOTH_DESIGNS) return renderBothDesigns(renderReadingClassic, renderReadingCarousel, "The same text, one page at a time.");
  return renderReadingClassic();
}

// Deliberately no Listen button. The narration is switched off in the data for
// these texts, and a weekly planning document is not something to read aloud to
// the learner — the same line Global Perspectives draws, where the toolkit and
// the grown-up guide are read rather than heard.
function renderReadingGrownUp() {
  const guide = course.grownUpGuide || {};
  const texts = course.readings.map((text, index) => `
    <article class="panel">
      <span class="eyebrow">${escapeHtml(text.type || "Teacher plan")} · ${index + 1} of ${course.readings.length}</span>
      <h2>${escapeHtml(text.title)}</h2>
      <div class="reading-text">${readingBodyHtml(text.passageScript)}</div>
    </article>`).join("");
  $("#app").innerHTML = `${pageHeader(
    "For the grown-up",
    "This unit's texts are for you",
    escapeHtml(guide.intro || "These texts are written for the parent or teacher, not for the learner to read alone."),
    "Adult-audience text",
  )}
  <section class="panel grownup-guide">
    <span class="grownup-flag">${icon("users")} ${escapeHtml(guide.label || "For the grown-up")}</span>
    ${guide.notes?.length ? `<ul class="checklist">${guide.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}
  </section>
  ${texts}
  <p><button class="button primary" id="reading-done" type="button">We have been through this together ${icon("check")}</button></p>`;
  $("#reading-done").addEventListener("click", () => complete("reading", "Grown-up guide marked as read."));
  icons();
}

// A unit's own "Teacher & Parent Guide" tab — distinct from renderReadingGrownUp
// above. That one REPLACES the Reading & story page because Unit 0 has no real
// story to protect; these units have one (their Story doc), so the guide gets
// its own tab instead, the way Global Perspectives' grownUpGuide does
// (shell/subjects/global-perspectives.js :: renderGrownUp). Only Grade 1 Units
// 1-9 currently carry this data (tools/build-ehel-grade1-teacher-guides.js),
// so the tab is conditional — see hasGrownUpGuide() and visibleSections().
//
// Not narrated and not countable (nonCountable, countableSectionIds): the same
// two calls Unit 0's own grown-up panel and Global Perspectives both make. A
// parent or teacher who never opens this should not find the unit stuck open.
const hasGrownUpGuide = () => Boolean(course.grownUpGuide?.sections?.length);

function renderTeacherGuide() {
  const guide = course.grownUpGuide || {};
  const parts = (guide.sections || []).map((part) => `
    <article class="panel">
      <h2>${escapeHtml(part.title)}</h2>
      ${part.body ? readingBodyHtml(part.body) : ""}
      ${part.items?.length ? `<ul class="checklist">${part.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </article>`).join("");
  $("#app").innerHTML = `${pageHeader(
    "For the grown-up",
    guide.label || "Teacher & Parent Guide",
    guide.intro || "This part is written for you, the parent or teacher, not for the learner to read alone.",
    "Adult-audience text",
  )}
  ${parts}`;
  icons();
}

// Reading as a deck: one PAGE of the story per slide, not one text. A text runs
// 160-666 words, so a slide per text would be the wall of words the deck exists
// to break up; the pages come from readingPages, which groups the reader's own
// paragraphs to a word budget that is tighter for Grades 1-2 than 3-4.
//
// The one thing the deck does NOT carry is the narration. A reading clip is one
// recording of the whole text — there is no per-page audio — so a Listen button
// on page four would start the story from page one. The e-book above keeps the
// player, and this stays a deck for reading with your eyes.
function renderReadingCarousel() {
  const esc = escapeHtml;
  const texts = course.readings;
  let reading = texts[0];
  let pages = [];

  const pageSlide = (html, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">${esc(reading.type)} · Page ${index + 1} of ${pages.length}</span>
      ${index === 0 ? `<h3 class="gc-title">${esc(reading.title)}</h3>${reading.setting ? `<small class="gc-source">${esc(reading.setting)}</small>` : ""}` : ""}
      <div class="rd-page">${html}</div>
    </div></section>`;

  const deck = mountDeck({
    heading: "Read, listen and imagine",
    label: "Page",
    intro: deckIntro("reading"),
    finish: ["reading", "I have read this text"],
    emptyMessage: "This text has no pages yet.",
    // A unit holds four to six texts, so the deck needs a way to reach them —
    // the same job the shelf does in the e-book above, in the place every other
    // deck puts its filter.
    tools: `<div class="wc-tools">
        <select id="reading-filter" aria-label="Choose a text">${texts.map((text, index) => `<option value="${esc(text.readingId)}">${index + 1}. ${esc(text.title)}</option>`).join("")}</select>
        <span class="status-chip" id="rd-pages"></span>
      </div>`,
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return undefined;
      return complete("reading", `${reading.title} marked as read.`);
    },
  });

  const inDeck = (selector) => deck.root.querySelector(selector);
  const drawDeck = () => {
    reading = texts.find((text) => text.readingId === inDeck("#reading-filter").value) || texts[0];
    pages = readingPages(reading.passageScript);
    deck.setSlides(pages.map(pageSlide));
    inDeck("#rd-pages").textContent = `${pages.length} page${pages.length === 1 ? "" : "s"}`;
  };
  inDeck("#reading-filter").addEventListener("change", drawDeck);
  // The shelf above picks a text; this deck's filter is how it reaches one.
  // Setting the select and redrawing is the same path the learner's own change
  // event takes, so the page count and slides stay consistent with it.
  showReadingInDeck = (readingId) => {
    const select = inDeck("#reading-filter");
    if (!select || !texts.some((text) => text.readingId === readingId)) return;
    select.value = readingId;
    drawDeck();
  };
  drawDeck();
}

// A print window rather than an in-page print stylesheet, the same choice
// openEbookReadAloud makes below for the same reason: it needs its own
// document so the app chrome (topbar, sidebar, shelf, audio controls) never
// has to be fought with @media print rules, and a popup-blocked user gets the
// same "allow pop-ups" recovery already established for that button.
function printReading(reading) {
  const printWindow = window.open("", "_blank", "popup=yes,width=860,height=1000,resizable=yes,scrollbars=yes");
  if (!printWindow) {
    toast("Allow pop-ups to print this text.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(reading.title)} | Ehel Academy English</title>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 40px 48px; color: #17324d; background: white; font: 17px/1.75 Georgia, "Times New Roman", serif; }
        header { margin-bottom: 26px; padding-bottom: 16px; border-bottom: 2px solid #dce4ea; }
        header span { display: block; color: #0f766e; font: 700 12px/1.4 Arial, sans-serif; text-transform: uppercase; letter-spacing: .05em; }
        header h1 { margin: 6px 0 0; font-size: 30px; line-height: 1.15; }
        header p { margin: 8px 0 0; color: #64748b; font: 14px/1.4 Arial, sans-serif; }
        .body p { margin: 0 0 1.1em; }
        .print-footer { margin-top: 34px; padding-top: 14px; border-top: 1px solid #dce4ea; color: #64748b; font: 12px/1.4 Arial, sans-serif; }
        @page { margin: 18mm; }
      </style>
    </head>
    <body>
      <header><span>${escapeHtml(reading.type || "Reading")} · ${escapeHtml(course.unit.unitTitle)}</span><h1>${escapeHtml(reading.title)}</h1>${reading.setting ? `<p>${escapeHtml(reading.setting)}</p>` : ""}</header>
      <div class="body">${readingBodyHtml(reading.passageScript)}</div>
      <div class="print-footer">Ehel Academy English · Grade ${gradeNumber} · Unit ${unitNumber}</div>
    </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
  printWindow.addEventListener("afterprint", () => printWindow.close());
}

function renderReadingClassic() {
  const { $, $$ } = classicScope();
  let selected = course.readings[0].readingId;
  $("#app").innerHTML = `${pageHeader("Read, listen and imagine", "Reading & story", "Open a text, listen to the narration, and enjoy it like your own digital book.")}<div class="reading-layout ebook-layout"><nav class="reading-list ebook-library" id="reading-list" aria-label="Reading library"></nav><article class="ebook-reader" id="reading-panel"></article></div>`;
  const draw = () => {
    $("#reading-list").innerHTML = `<div class="ebook-library-title"><span>${icon("library-big")}</span><div><strong>My reading shelf</strong><small>${course.readings.length} texts in this unit</small></div></div>${course.readings.map((reading, index) => `<button class="reading-button ebook-spine ${selected === reading.readingId ? "active" : ""}" data-reading="${reading.readingId}" type="button" aria-current="${selected === reading.readingId ? "page" : "false"}"><span>${index + 1}</span><div><strong>${escapeHtml(reading.title)}</strong><small>${escapeHtml(reading.type)}</small></div>${icon("chevron-right")}</button>`).join("")}`;
    const reading = course.readings.find((item) => item.readingId === selected);
    const readingIndex = course.readings.findIndex((item) => item.readingId === selected);
    const wordCount = readingWordCount(reading.passageScript);
    const readingMinutes = Math.max(1, Math.ceil(wordCount / (gradeNumber <= 2 ? 100 : gradeNumber <= 4 ? 135 : 170)));
    const audioReady = reading.audio?.available || readingVoiceSources.has(reading.readingId);
    const audioMode = reading.audio?.available ? "recorded" : audioReady ? "ready" : "on demand";
    const audioControls = `<div class="ebook-audio-wrap"><small>ElevenLabs · ${audioMode} · 0.90x</small>${audioReady ? "" : `<button class="button secondary" id="prepare-reading-audio" type="button" aria-label="Prepare ElevenLabs narration for ${escapeHtml(reading.title)}">${icon("audio-lines")} Prepare audio</button>`}<audio id="ebook-reading-audio" class="ebook-native-audio" controls ${audioReady ? "" : "hidden"} aria-label="Reading narration for ${escapeHtml(reading.title)}"></audio></div>`;
    $("#reading-panel").innerHTML = `<div class="ebook-progress" aria-label="Text ${readingIndex + 1} of ${course.readings.length}"><span style="width:${((readingIndex + 1) / course.readings.length) * 100}%"></span></div><header class="ebook-toolbar"><div><span class="ebook-count">Book ${readingIndex + 1} of ${course.readings.length}</span><span>${wordCount} words · about ${readingMinutes} min</span></div><div class="ebook-toolbar-actions"><button class="button secondary" id="print-reading" type="button" aria-label="Print ${escapeHtml(reading.title)} as a PDF">${icon("printer")} Print</button>${audioControls}</div></header><figure class="ebook-cover"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt || course.unit.unitTitle)}"><figcaption><span>${escapeHtml(reading.type)}</span><h2>${escapeHtml(reading.title)}</h2><p>${escapeHtml(course.unit.unitTitle)}</p></figcaption></figure><section class="ebook-page"><div class="ebook-page-heading"><span>${icon("bookmark")}</span><div><small>${reading.genre ? escapeHtml(reading.genre) : "Ehel Academy English"}</small><h2>${escapeHtml(reading.title)}</h2>${reading.setting ? `<p>${icon("map-pin")} ${escapeHtml(reading.setting)}</p>` : ""}</div></div><div class="reading-text ebook-copy">${readingBodyHtml(reading.passageScript)}</div><div class="ebook-page-number">${readingIndex + 1}</div></section><footer class="ebook-footer"><button class="button secondary" data-reading-step="-1" type="button" ${readingIndex === 0 ? "disabled" : ""}>${icon("arrow-left")} Previous text</button><button class="button primary" id="reading-done" type="button">Finished reading ${icon("check")}</button><button class="button secondary" data-reading-step="1" type="button" ${readingIndex === course.readings.length - 1 ? "disabled" : ""}>Next text ${icon("arrow-right")}</button></footer>`;
    $$('[data-reading]').forEach((button) => button.addEventListener("click", () => { selected = button.dataset.reading; stopAudio(); draw(); icons(); showReadingInDeck?.(selected); focusDynamicContent("#reading-panel .ebook-page-heading h2", "Reading selected. " + $("#reading-panel .ebook-page-heading h2").textContent); }));
    $$('[data-reading-step]').forEach((button) => button.addEventListener("click", () => {
      const next = course.readings[readingIndex + Number(button.dataset.readingStep)];
      if (!next) return;
      selected = next.readingId;
      stopAudio();
      draw();
      $("#reading-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      icons();
      focusDynamicContent("#reading-panel .ebook-page-heading h2", "Reading selected. " + $("#reading-panel .ebook-page-heading h2").textContent);
    }));
    if (audioReady) mountReadingAudioPlayer(reading);
    $("#print-reading").addEventListener("click", () => printReading(reading));
    $("#prepare-reading-audio")?.addEventListener("click", (event) => prepareReadingNarration(reading, event.currentTarget));
    $("#reading-done").addEventListener("click", () => complete("reading", `${reading.title} marked as read.`));
    icons();
  };
  draw();
}

// ===================== the Story Library (Grades 5-8) =====================
// A Grade 1-4 unit ends with an illustrated picture book. Grades 5-8 have none
// and, by the owner's decision of 2026-08-20, never will — see CLAUDE.md, which
// gives the reasons and is not being relitigated here.
//
// What those grades DO have is already written and already recorded: 41 original
// short stories across the four grades, ~41,900 words, every one of the 95 parts
// narrated. And every one of them sits three readings deep inside a single
// unit's Reading section, chopped into "part 1 / part 2 / part 3", reachable
// only while that unit is the unit you happen to be in.
//
// This section shelves them. It writes no text and buys no audio: the index is
// derived from the units by tools/build-english-story-library.mjs and the clips
// are the reading clips. What it adds is that a story can be found, read whole,
// and read again after its unit has gone by — reading for its own sake, which is
// the thing that quietly disappears at Grade 5.
//
// Three rules it holds to:
//
//  - It is not a walk-through. No deck, no page turn, no one-item-at-a-time —
//    a shelf you scan and a story you read down the page, which is what an
//    upper-stage page is supposed to be (CLAUDE.md, Grades/Stages 5-8).
//  - It is not assessed. Nothing here is marked, and finishing a story
//    completes nothing: the moment free reading counts toward a unit it stops
//    being free reading. Hence its own storage key rather than complete().
//  - It does not leak locked units. A story is shelved from the unit it belongs
//    to, so a shelf that ignored the gate would hand a learner in Unit 2 the
//    story from Unit 9. Locked ones show as locked, which also makes the shelf
//    fill up as the year is walked.
let storyLibrary = null;
let storyLibraryPending = null;
let activeStoryId = null;

const storyReadKey = () => `ehel-english-g${gradeNumber}-story-library-v1`;

function storiesRead() {
  try {
    const stored = JSON.parse(localStorage.getItem(storyReadKey()) || "{}");
    return Array.isArray(stored.read) ? stored.read : [];
  } catch {
    return [];
  }
}

function markStoryRead(storyId) {
  const read = [...new Set([...storiesRead(), storyId])];
  localStorage.setItem(storyReadKey(), JSON.stringify({ read }));
}

// Fetched on first open, not in load(): a learner who never opens the shelf
// should not pay ~90 KB for it on every unit page they visit. Cached on the
// module, so moving between sections re-reads it for free.
function loadStoryLibrary() {
  if (storyLibrary) return Promise.resolve(storyLibrary);
  if (!storyLibraryPending) {
    storyLibraryPending = fetch(new URL("story-library.json", dataRootUrl))
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.url}`);
        return response.json();
      })
      .then((library) => { storyLibrary = library; return library; })
      // Cleared so a learner who lost the network for one tap can simply open
      // the section again, rather than being stuck with a rejected promise for
      // the life of the page.
      .catch((error) => { storyLibraryPending = null; throw error; });
  }
  return storyLibraryPending;
}

// TEACHER_PREVIEW, not REVIEW_VISIT. A teacher planning ahead needs the whole
// shelf; a remediation link opens ONE named unit and travels no further, and a
// shelf is exactly the "travelling further" that link is built to prevent.
const storyPartOpen = (unit) => TEACHER_PREVIEW || unitIsUnlocked(unit);
const storyMinutes = (words) => Math.max(1, Math.ceil(words / (gradeNumber <= 2 ? 100 : gradeNumber <= 4 ? 135 : 170)));

async function renderStoryLibrary() {
  const { $, $$ } = classicScope();
  const header = pageHeader(
    "Read for the pleasure of it",
    "Story Library",
    `Every story from your Grade ${gradeNumber} units, gathered in one place and joined back together. Nothing here is marked — read for the story.`,
    "Reading for pleasure",
  );
  $("#app").innerHTML = `${header}<section class="panel"><p>Opening your shelf…</p></section>`;

  let library;
  try {
    library = await loadStoryLibrary();
  } catch (error) {
    $("#app").innerHTML = `${header}<section class="panel empty-library"><span>${icon("book-marked")}</span><h2>The shelf could not be opened</h2><p>${escapeHtml(String(error.message || error))}</p></section>`;
    icons();
    return;
  }
  // The fetch is slower than a tap. Without this the shelf paints itself over
  // whatever section the learner moved on to while it was in flight.
  if (route !== "story-library") return;

  const stories = library.stories || [];
  if (!stories.length) {
    $("#app").innerHTML = `${header}<section class="panel empty-library"><span>${icon("book-marked")}</span><h2>No stories yet</h2><p>This grade's stories will appear here as they are approved.</p></section>`;
    icons();
    return;
  }

  const draw = () => {
    const read = storiesRead();
    const open = stories.filter((story) => storyPartOpen(story.unitNumber));
    const story = stories.find((item) => item.storyId === activeStoryId && storyPartOpen(item.unitNumber)) || open[0] || null;
    activeStoryId = story ? story.storyId : null;
    const openIndex = story ? open.indexOf(story) : -1;

    const spine = (item, index) => {
      const unlocked = storyPartOpen(item.unitNumber);
      const done = read.includes(item.storyId);
      const meta = `Unit ${item.unitNumber} · ${item.parts.length} part${item.parts.length === 1 ? "" : "s"} · ${storyMinutes(item.words)} min`;
      if (!unlocked) {
        return `<div class="reading-button ebook-spine is-locked" aria-disabled="true"><span>${icon("lock")}</span><div><strong>${escapeHtml(item.title)}</strong><small>Opens when you reach Unit ${item.unitNumber}</small></div></div>`;
      }
      return `<button class="reading-button ebook-spine ${item.storyId === activeStoryId ? "active" : ""} ${done ? "is-read" : ""}" data-story="${escapeHtml(item.storyId)}" type="button" aria-current="${item.storyId === activeStoryId ? "page" : "false"}"><span>${done ? icon("check") : index + 1}</span><div><strong>${escapeHtml(item.title)}</strong><small>${meta}</small></div>${icon("chevron-right")}</button>`;
    };

    $("#story-shelf").innerHTML = `<div class="ebook-library-title"><span>${icon("book-marked")}</span><div><strong>My story shelf</strong><small>${read.length} of ${stories.length} read</small></div></div>${stories.map(spine).join("")}`;

    if (!story) {
      $("#story-panel").innerHTML = `<section class="ebook-page"><p>Your stories open as you work through the units.</p></section>`;
      icons();
      return;
    }

    // Only the parts this learner has reached. The two Grade 5 stories whose
    // ending was printed in the review unit are the reason this is per PART and
    // not per story: "The Silence After the Rumble" is two parts in Unit 1 and
    // finishes in Unit 10, and holding the whole story back until then would
    // hide a story the learner has already been taught.
    const readable = story.parts.filter((part) => storyPartOpen(part.unitNumber));
    const held = story.parts.filter((part) => !storyPartOpen(part.unitNumber));
    const readableWords = readable.reduce((sum, part) => sum + part.words, 0);
    const narrated = readable.filter((part) => part.audio);
    const partHeading = (part) => (story.parts.length === 1 ? "" : `<h3 class="story-part-heading">Part ${part.part}${part.subtitle ? ` · ${escapeHtml(part.subtitle)}` : ""}</h3>`);

    $("#story-panel").innerHTML = `<div class="ebook-progress" aria-label="Story ${openIndex + 1} of ${open.length}"><span style="width:${((openIndex + 1) / open.length) * 100}%"></span></div>
      <header class="ebook-toolbar">
        <div><span class="ebook-count">Story ${openIndex + 1} of ${open.length}</span><span>${readableWords} words · about ${storyMinutes(readableWords)} min${story.parts.length > 1 ? ` · ${readable.length} of ${story.parts.length} parts` : ""}</span></div>
        <div class="ebook-toolbar-actions">
          <button class="button secondary" id="print-story" type="button" aria-label="Print ${escapeHtml(story.title)} as a PDF">${icon("printer")} Print</button>
          <div class="ebook-audio-wrap"><small>ElevenLabs · recorded · ${AI_NARRATION_RATE.toFixed(2)}x</small><audio id="story-audio" class="ebook-native-audio" controls ${narrated.length ? "" : "hidden"} aria-label="Narration for ${escapeHtml(story.title)}"></audio></div>
        </div>
      </header>
      <figure class="story-cover story-cover-v${openIndex % 5}">
        <figcaption>
          <span>${escapeHtml(story.genre)}</span>
          <h2>${escapeHtml(story.title)}</h2>
          <p>Unit ${story.unitNumber} · ${escapeHtml(story.unitTitle)}</p>
        </figcaption>
      </figure>
      <section class="ebook-page">
        <div class="ebook-page-heading"><span>${icon("bookmark")}</span><div><small>${escapeHtml(story.theme || story.genre)}</small><h2>${escapeHtml(story.title)}</h2>${story.setting ? `<p>${icon("map-pin")} ${escapeHtml(story.setting)}</p>` : ""}</div></div>
        <div class="reading-text ebook-copy">${readable.map((part) => `${partHeading(part)}${readingBodyHtml(part.passageScript)}`).join("")}</div>
        ${held.length ? `<p class="story-held">${icon("lock")} ${held.length === 1 ? "The ending of this story arrives" : `${held.length} more parts arrive`} with Unit ${held[0].unitNumber}.</p>` : ""}
      </section>
      <footer class="ebook-footer">
        <button class="button secondary" data-story-step="-1" type="button" ${openIndex <= 0 ? "disabled" : ""}>${icon("arrow-left")} Previous story</button>
        <button class="button primary" id="story-read" type="button" ${read.includes(story.storyId) ? "disabled" : ""}>${read.includes(story.storyId) ? `Read ${icon("check")}` : `I have read this ${icon("check")}`}</button>
        <button class="button secondary" data-story-step="1" type="button" ${openIndex === open.length - 1 ? "disabled" : ""}>Next story ${icon("arrow-right")}</button>
      </footer>`;

    const go = (storyId) => {
      activeStoryId = storyId;
      stopAudio();
      draw();
      focusDynamicContent("#story-panel .ebook-page-heading h2", `Story selected. ${$("#story-panel .ebook-page-heading h2").textContent}`);
    };
    $$("[data-story]").forEach((button) => button.addEventListener("click", () => go(button.dataset.story)));
    $$("[data-story-step]").forEach((button) => button.addEventListener("click", () => {
      const next = open[openIndex + Number(button.dataset.storyStep)];
      if (!next) return;
      go(next.storyId);
      $("#story-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    $("#print-story").addEventListener("click", () => printStory(story, readable));
    // Marks the shelf, and nothing else. No complete(), no progress event: this
    // section is nonCountable and outside SECTION_CHAIN, so a story read (or
    // never read) cannot move a unit one way or the other.
    $("#story-read").addEventListener("click", () => {
      markStoryRead(story.storyId);
      toast(`“${story.title}” added to your read shelf.`);
      draw();
    });
    if (narrated.length) mountStoryAudioPlayer(story, narrated);
    icons();
  };

  $("#app").innerHTML = `${header}<div class="reading-layout ebook-layout"><nav class="reading-list ebook-library" id="story-shelf" aria-label="Story library"></nav><article class="ebook-reader" id="story-panel"></article></div>`;
  draw();
  prepareScreenReaderView();
}

// One player for the whole story, playing its parts back to back — the point of
// the shelf is that the story is one thing again, and three separate players
// would put the seams back.
//
// The read-along highlight follows across the join. narrationChunkRanges maps
// each clip onto its slice of the on-screen lines, which is the same machinery
// that already carries a reading split into several on-demand renders; without
// the ranges the highlight would restart at line one on every part.
function mountStoryAudioPlayer(story, parts) {
  const player = $("#story-audio");
  if (!player) return;
  const sources = parts.map((part) => resolveMediaUrl(part.audio.source));
  let index = 0;
  player.hidden = false;
  player.src = sources[index];
  player.playbackRate = AI_NARRATION_RATE;
  player.defaultPlaybackRate = AI_NARRATION_RATE;

  const segments = readAlongSegments($("#story-panel"));
  if (segments.length) {
    const total = segments.reduce((sum, segment) => sum + segment.chars, 0);
    const ranges = parts.length > 1 ? narrationChunkRanges(parts.map((part) => part.passageScript), total) : null;
    const sync = () => { startNarrationSync(player, segments, ranges); if (narrationSync) narrationSync.sourceIndex = index; };
    player.addEventListener("play", sync);
    player.addEventListener("timeupdate", () => narrationSyncTick(player));
  }

  player.addEventListener("play", () => { player.playbackRate = AI_NARRATION_RATE; });
  player.addEventListener("ended", () => {
    index += 1;
    if (index >= sources.length) return clearNarrationSync(player);
    player.src = sources[index];
    player.playbackRate = AI_NARRATION_RATE;
    if (narrationSync) narrationSync.sourceIndex = index;
    player.play().catch(() => toast("Press Play to continue the story."));
  });
}

// The whole story on paper, parts joined, in a window of its own — the same
// choice printReading makes above and for the same reason: its own document
// means the app chrome never has to be fought with @media print rules.
function printStory(story, parts) {
  const printWindow = window.open("", "_blank", "popup=yes,width=860,height=1000,resizable=yes,scrollbars=yes");
  if (!printWindow) {
    toast("Allow pop-ups to print this story.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(story.title)} | Ehel Academy English</title>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 40px 48px; color: #17324d; background: white; font: 17px/1.75 Georgia, "Times New Roman", serif; }
        header { margin-bottom: 26px; padding-bottom: 16px; border-bottom: 2px solid #dce4ea; }
        header span { display: block; color: #0f766e; font: 700 12px/1.4 Arial, sans-serif; text-transform: uppercase; letter-spacing: .05em; }
        header h1 { margin: 6px 0 0; font-size: 30px; line-height: 1.15; }
        header p { margin: 8px 0 0; color: #64748b; font: 14px/1.4 Arial, sans-serif; }
        h2 { margin: 1.6em 0 .6em; color: #0f766e; font: 700 15px/1.3 Arial, sans-serif; text-transform: uppercase; letter-spacing: .05em; }
        .body p { margin: 0 0 1.1em; }
        .print-footer { margin-top: 34px; padding-top: 14px; border-top: 1px solid #dce4ea; color: #64748b; font: 12px/1.4 Arial, sans-serif; }
        @page { margin: 18mm; }
      </style>
    </head>
    <body>
      <header><span>${escapeHtml(story.genre)} · Unit ${story.unitNumber}, ${escapeHtml(story.unitTitle)}</span><h1>${escapeHtml(story.title)}</h1>${story.setting ? `<p>${escapeHtml(story.setting)}</p>` : ""}</header>
      <div class="body">${parts.map((part) => `${parts.length > 1 ? `<h2>Part ${part.part}${part.subtitle ? ` · ${escapeHtml(part.subtitle)}` : ""}</h2>` : ""}${readingBodyHtml(part.passageScript)}`).join("")}</div>
      <div class="print-footer">Ehel Academy English · Grade ${gradeNumber} · Story Library</div>
    </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
  printWindow.addEventListener("afterprint", () => printWindow.close());
}

function renderComprehension() {
  if (BOTH_DESIGNS) return renderBothDesigns(renderComprehensionClassic, renderComprehensionCarousel, "The same questions, one at a time.");
  return renderComprehensionClassic();
}

function renderComprehensionClassic() {
  const { $, $$ } = classicScope();
  const groups = [...new Set(course.comprehension.map((question) => question.section))];
  let active = groups[0];
  const draw = () => {
    const questions = course.comprehension.filter((question) => question.section === active);
    $("#app").innerHTML = `${pageHeader("Think about the text", "Comprehension", "Write your answer first. Then reveal the reviewed guidance and improve your response.")}<div class="subtabs">${groups.map((group) => `<button class="subtab ${group === active ? "active" : ""}" data-group="${escapeHtml(group)}" type="button">${escapeHtml(group)}</button>`).join("")}</div><section class="panel"><div class="question-list">${questions.map((question) => `<div class="question"><label for="answer-${question.questionId}">${question.sequence}. ${escapeHtml(question.question)}</label><textarea id="answer-${question.questionId}" data-answer-input="${question.questionId}" placeholder="Write a complete answer…"></textarea><button class="button secondary" data-check-answer="${question.questionId}" type="button">Check guidance</button><div id="feedback-${question.questionId}" role="status" aria-live="polite" aria-atomic="true"></div></div>`).join("")}</div><button class="button primary" id="comprehension-done" type="button">Finish comprehension ${icon("check")}</button></section>`;
    $$('[data-group]').forEach((button) => button.addEventListener("click", () => { active = button.dataset.group; draw(); showComprehensionGroupInDeck?.(active); }));
    $$('[data-check-answer]').forEach((button) => button.addEventListener("click", () => {
      const question = course.comprehension.find((item) => item.questionId === button.dataset.checkAnswer);
      const value = $(`#answer-${question.questionId}`).value.trim();
      $(`#feedback-${question.questionId}`).innerHTML = value.length < 4 ? `<p class="feedback try">Write your own answer before viewing the guidance.</p>` : `<p class="feedback good"><span class="field-label">Reviewed guidance:</span> ${escapeHtml(question.correctAnswer)}</p>`;
    }));
    $("#comprehension-done").addEventListener("click", () => complete("comprehension", "Comprehension practice complete."));
    icons();
  };
  draw();
}

// Comprehension as a deck: one question per slide, so a Grade 1-4 learner faces
// the question they are answering rather than a wall of twelve.
//
// The subtabs become the group filter under the dots — same job (a unit's
// questions are grouped by the reading they belong to), same place the
// vocabulary deck puts its filter, and the section a question belongs to also
// rides on the slide so nobody has to remember which text this is about. Answer,
// guidance-on-request and the write-first rule are unchanged: guidance only
// appears once the learner has written something of their own.
function renderComprehensionCarousel() {
  const esc = escapeHtml;
  const all = course.comprehension;
  const groups = [...new Set(all.map((question) => question.section))];
  let questions = all;

  const questionSlide = (question, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${questions.length} · ${esc(question.questionType)}</span>
      ${question.section ? `<small class="gc-source">${esc(question.section)}</small>` : ""}
      <h3 class="gc-title">${esc(question.question)}</h3>
      <div class="wc-sentence">
        <small>Your answer · ${question.marks} mark${Number(question.marks) === 1 ? "" : "s"}${question.difficulty ? ` · ${esc(question.difficulty)}` : ""}</small>
        <textarea data-answer="${esc(question.questionId)}" rows="4" placeholder="Write a complete answer…" aria-label="Your answer to question ${index + 1}"></textarea>
      </div>
      <div class="gc-actions"><button class="gc-btn" type="button" data-check-answer="${esc(question.questionId)}">${icon("list-checks")} Check guidance</button></div>
      <div data-feedback="${esc(question.questionId)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`;

  const deck = mountDeck({
    heading: "Think about the text",
    label: "Question",
    intro: deckIntro("comprehension"),
    finish: ["comprehension", "Finish comprehension"],
    emptyMessage: "No questions in this section yet.",
    tools: groups.length > 1 ? `<div class="wc-tools">
        <select id="section-filter" aria-label="Filter questions by text"><option value="all">All texts</option>${groups.map((group) => `<option value="${esc(group)}">${esc(group)}</option>`).join("")}</select>
        <span class="status-chip" id="cq-count">${all.length} questions</span>
      </div>` : "",
    onClick: (event) => {
      const target = event.target.closest("[data-check-answer], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.deckFinish) return complete("comprehension", "Comprehension practice complete.");
      const question = all.find((item) => item.questionId === target.dataset.checkAnswer);
      const value = (inDeck(`[data-answer="${CSS.escape(question.questionId)}"]`)?.value || "").trim();
      const box = inDeck(`[data-feedback="${CSS.escape(question.questionId)}"]`);
      if (box) {
        box.innerHTML = value.length < 4
          ? `<p class="feedback try">Write your own answer before viewing the guidance.</p>`
          : `<p class="feedback good"><span class="field-label">Reviewed guidance:</span> ${esc(question.correctAnswer)}</p>`;
      }
      return undefined;
    },
  });

  const inDeck = (selector) => deck.root.querySelector(selector);
  const drawDeck = () => {
    const group = inDeck("#section-filter")?.value || "all";
    questions = group === "all" ? all : all.filter((question) => question.section === group);
    deck.setSlides(questions.map(questionSlide));
    const counter = inDeck("#cq-count");
    if (counter) counter.textContent = `${questions.length} question${questions.length === 1 ? "" : "s"}`;
  };
  inDeck("#section-filter")?.addEventListener("change", drawDeck);
  // The subtabs above are the same grouping as this deck's filter, so a learner
  // narrowing one expects the other to follow. A unit with a single group has no
  // filter to set (tools is empty), hence the optional lookup.
  showComprehensionGroupInDeck = (group) => {
    const select = inDeck("#section-filter");
    if (!select) return;
    select.value = group;
    drawDeck();
  };
  drawDeck();
}

function renderGrammar() {
  // Grades 1-4 get the kid-friendly carousel (one pattern at a time), modelled on
  // the Arabic Alphabet unit's Learn section, with the grid workshop kept above
  // it. Grade 5 and up are the workshop alone.
  if (BOTH_DESIGNS) return renderBothDesigns(renderGrammarClassic, renderGrammarCarousel, "The same patterns, one at a time.");
  return renderGrammarClassic();
}

function renderGrammarClassic() {
  const { $, $$ } = classicScope();
  // Each grade keeps its own visual, the same rule the deck follows: Grade 1 is
  // phonics, so its picture is built from the rule ("A says /a/"), while Grades 5
  // and up teach sentence structure, which is what grammarDiagram draws. The two
  // halves of a Grade 1 page would otherwise disagree — a subject/verb/object
  // strip on the card and a letter-to-sound strip on the slide beneath it, for
  // one and the same lesson. phonicsDiagram returns "" for a rule that is not a
  // phonics shape, and the card then shows no diagram, exactly as its slide does.
  $("#app").innerHTML = `${pageHeader("Language focus", "Grammar workshop", "Complete six practices: guided recognition followed by independent language use.")}<div class="grammar-grid">${course.grammar.map((lesson) => `<article class="panel grammar-card"><div class="word-card-head"><span class="lesson-number">${lesson.sequence}</span><span class="word-type">${escapeHtml(lesson.practiceType)}</span></div><h3>${escapeHtml(lesson.title)}</h3>${gradeNumber === 1 ? phonicsDiagram(lesson.ruleAndExamples) : grammarDiagram(lesson.title, lesson.explanation)}<p>${escapeHtml(lesson.explanation)}</p>${lesson.ruleAndExamples ? `<div class="rule-box">${escapeHtml(lesson.ruleAndExamples)}</div>` : ""}${lesson.commonMistake ? `<p class="mistake">${escapeHtml(lesson.commonMistake)}</p>` : ""}${lesson.memoryTip ? `<p><span class="field-label">Memory tip:</span> ${escapeHtml(lesson.memoryTip)}</p>` : ""}<details><summary>Show practice</summary><p class="rule-box">${escapeHtml(lesson.practice)}</p>${lesson.practiceAudio?.available ? `<button class="button secondary" data-practice-audio="${lesson.grammarId}" type="button">${icon("volume-2")} Hear the practice</button>` : ""}</details>${lesson.audio?.available ? `<div class="audio-actions"><button class="button secondary" data-grammar-audio="${lesson.grammarId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("volume-2")} Listen</button><button class="button secondary" data-grammar-audio="${lesson.grammarId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("rotate-ccw")} Replay</button></div><small class="audio-source">ElevenLabs · approved Ehel voice · 0.90x</small>` : `<span class="audio-pending">${icon("clock-3")} ElevenLabs audio pending</span>`}</article>`).join("")}</div><p><button class="button primary" id="grammar-done" type="button">I practised all six lessons ${icon("check")}</button></p>`;
  $$('[data-grammar-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = course.grammar.find((item) => item.grammarId === button.dataset.grammarAudio);
    playAudio(lesson.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  // Same practice-audio control as the Grade 1 carousel, for the grid workshop.
  $$('[data-practice-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = course.grammar.find((item) => item.grammarId === button.dataset.practiceAudio);
    playAudio(lesson.practiceAudio.source, { rate: AI_NARRATION_RATE, button });
  }));
  $("#grammar-done").addEventListener("click", () => complete("grammar", "Grammar workshop complete."));
}

// Grades 1-4 grammar as a full-screen slide carousel (Arabic-Alphabet Learn
// style): one language pattern per vibrant slide, big "Hear it" button, side
// arrows, dots, swipe. Reaching the last slide completes the section.
const GC_EMOJI = ["🔤", "👂", "🧩", "🗣️", "👀", "⭐", "🌈", "🎈"];
function renderGrammarCarousel() {
  const lessons = course.grammar;
  const esc = escapeHtml;
  // Every field the grid workshop shows is preserved — only the layout changes:
  // title, the S/V/O diagram, explanation, the rule (ruleAndExamples), the
  // common-mistake teacher note, the memory tip, the practice, audio + source.
  //
  // Each grade keeps its own visual: Grade 1 is phonics, so its diagram is built
  // from the rule ("A says /a/"); Grades 2-4 teach sentence structure, which is
  // what grammarDiagram draws — the same picture the grid workshop gave them
  // before, not a phonics strip that would have nothing to show.
  const slides = lessons.map((lesson, i) => {
    const emoji = GC_EMOJI[i % GC_EMOJI.length];
    return `<section class="gc-slide gc-v${i % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Pattern ${lesson.sequence} of ${lessons.length} · ${esc(lesson.practiceType)}</span>
      <h3 class="gc-title">${esc(lesson.title)}</h3>
      ${gradeNumber === 1 ? phonicsDiagram(lesson.ruleAndExamples) : grammarDiagram(lesson.title, lesson.explanation)}
      <p class="gc-lead"><span class="gc-emoji" aria-hidden="true">${emoji}</span> ${esc(lesson.explanation)}</p>
      ${lesson.ruleAndExamples ? `<div class="gc-pattern" lang="en">${esc(lesson.ruleAndExamples)}</div>` : ""}
      <div class="gc-actions">
        ${lesson.audio?.available
          ? `<button class="gc-btn play" type="button" data-grammar-audio="${esc(lesson.grammarId)}" data-rate="${AI_NARRATION_RATE}">${icon("volume-2")} Hear it</button>
             <button class="gc-btn ghost" type="button" data-grammar-audio="${esc(lesson.grammarId)}" data-rate="${AI_NARRATION_RATE}">${icon("rotate-ccw")} Again</button>`
          : `<span class="audio-pending">${icon("clock-3")} ElevenLabs audio pending</span>`}
      </div>
      ${lesson.audio?.available ? `<small class="gc-source">ElevenLabs · approved Ehel voice · 0.90x</small>` : ""}
      ${lesson.commonMistake ? `<p class="gc-note gc-mistake">${esc(lesson.commonMistake)}</p>` : ""}
      ${lesson.memoryTip ? `<p class="gc-note"><span class="field-label">Memory tip:</span> ${esc(lesson.memoryTip)}</p>` : ""}
      ${lesson.practice ? `<details class="gc-practice"><summary>Show practice</summary><p class="gc-note gc-try">${esc(lesson.practice)}</p>${lesson.practiceAudio?.available ? `<button class="gc-btn" data-practice-audio="${lesson.grammarId}" type="button">${icon("volume-2")} Hear the practice</button>` : ""}</details>` : ""}
    </div></section>`;
  });

  const finish = () => { if (!progress.completed.includes("grammar")) complete("grammar", "Grammar patterns complete. Well done!"); };
  mountDeck({
    heading: "Say the patterns",
    label: "Pattern",
    intro: deckIntro("grammar"),
    finish: ["grammar", `I practised all ${lessons.length} lessons`],
    slides,
    // Reaching the last slide is the completion: a learner who swiped through
    // every pattern has done the section, button or no button.
    onSlide: (index) => { if (index === slides.length - 1) finish(); },
    onClick: (event) => {
      const target = event.target.closest("[data-grammar-audio], [data-practice-audio], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.deckFinish) return finish();
      if (target.dataset.grammarAudio) {
        const lesson = lessons.find((item) => item.grammarId === target.dataset.grammarAudio);
        return playAudio(lesson.audio.source, { rate: Number(target.dataset.rate), button: target });
      }
      // The practice task read aloud, separate from the explanation above it, so
      // a learner working alone can hear what they are being asked to do.
      const lesson = lessons.find((item) => item.grammarId === target.dataset.practiceAudio);
      return playAudio(lesson.practiceAudio.source, { rate: AI_NARRATION_RATE, button: target });
    },
  });
}

function renderSpeaking() {
  if (BOTH_DESIGNS) return renderBothDesigns(renderSpeakingClassic, renderSpeakingCarousel, "The same practices, one at a time.");
  return renderSpeakingClassic();
}

// The record → listen → submit → feedback flow the speaking GAME already runs,
// on the speaking practices themselves. It was wired only into the game and the
// tutor page, so this section recorded a learner's voice and then did nothing
// with it — "your recording stays on this device", and no way to find out
// whether it was any good. Both callers go through the shared
// submitSpeakingRecording, so this adds a third caller rather than a second
// implementation, and the ids are per-task because Speaking shows six at once.
// Both halves at Grades 1-4 draw this, so it is written once. The recording id
// is deliberately the SAME in both — toggleRecording resolves the status line
// and the <audio> from the pressed button's own region, so one id is correct and
// the two designs share a learner's recording rather than each holding half of
// it. Only the feedback element takes a prefix, because that one is looked up by
// id and a duplicate id would send the deck's result into the original above it.
function speakingCoachHtml(task, { idPrefix = "", buttonClass = "button primary" } = {}) {
  const id = task.speakingId;
  const review = speakingReviewState.get(id);
  const recorded = recordings.has(id);
  return `<div class="recorder"><button class="record-button" data-record="${id}" type="button" aria-label="Start recording for ${escapeHtml(task.title)}">${icon("mic")}</button><div><strong data-record-status="${id}" role="status" aria-live="polite" aria-atomic="true">${recorded ? "Recording ready. Listen back." : "Ready to record"}</strong><small> Your recording stays on this device until you submit it.</small></div></div>
    <audio data-playback="${id}" controls ${recorded ? "" : "hidden"} aria-label="Your recording for ${escapeHtml(task.title)}"></audio>
    <div class="speaking-flow"><span class="flow-step active"><strong>1</strong> Record</span><span class="flow-step ${recorded ? "active" : ""}"><strong>2</strong> Listen</span><span class="flow-step ${review?.listened ? "active" : ""}"><strong>3</strong> Submit</span><span class="flow-step ${review?.feedback ? "active" : ""}"><strong>4</strong> Feedback</span></div>
    <button class="${buttonClass}" data-speaking-submit="${id}" type="button" ${review?.listened ? "" : "disabled"}>${icon("send")} Submit for pronunciation check</button>
    <div id="${idPrefix}speaking-feedback-${id}" role="status" aria-live="polite" aria-atomic="true">${pronunciationFeedbackHtml(review?.feedback)}</div>`;
}

function renderSpeakingClassic() {
  const { $, $$ } = classicScope();
  $("#app").innerHTML = `${pageHeader("Use your voice", "Dialogue & speaking", "Complete six speaking practices. Rehearse, record, and listen back.")}<div class="task-grid">${course.speaking.map((task) => `<article class="panel task-card"><span class="eyebrow">Practice ${task.sequence} · ${escapeHtml(task.activityType)}</span><h3>${escapeHtml(task.title)}</h3><p class="rule-box">${escapeHtml(task.instructionsAndModelLines)}</p>${task.audio?.available ? `<div class="audio-actions"><button class="button secondary" data-model="${task.speakingId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("volume-2")} Hear model</button><button class="button secondary" data-model="${task.speakingId}" data-rate="${AI_NARRATION_RATE}" type="button">${icon("rotate-ccw")} Replay</button></div><small class="audio-source">ElevenLabs · approved Ehel voice · 0.90x</small>` : `<span class="audio-pending">${icon("clock-3")} ElevenLabs model audio pending</span>`}${task.recordingRequired ? speakingCoachHtml(task) : ""}</article>`).join("")}</div><p><button class="button primary" id="speaking-done" type="button">Finish six speaking practices ${icon("check")}</button></p>`;
  $$('[data-model]').forEach((button) => button.addEventListener("click", () => {
    const task = course.speaking.find((item) => item.speakingId === button.dataset.model);
    playAudio(task.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  $$('[data-record]').forEach((button) => button.addEventListener("click", () => toggleRecording(button.dataset.record, button)));
  // Listening all the way through is what arms Submit — the same gate the game
  // uses. A learner who has not heard their own recording cannot judge the
  // feedback they are about to be given.
  $$('[data-playback]').forEach((audio) => audio.addEventListener("ended", () => {
    const id = audio.dataset.playback;
    const review = speakingReviewState.get(id) || { feedback: null };
    review.listened = true;
    speakingReviewState.set(id, review);
    const submit = $(`[data-speaking-submit="${id}"]`);
    if (submit) submit.disabled = false;
    toast("You listened to the full recording. It is ready to submit.");
  }));
  $$('[data-speaking-submit]').forEach((button) => button.addEventListener("click", (event) => {
    const id = button.dataset.speakingSubmit;
    const task = course.speaking.find((item) => item.speakingId === id);
    submitSpeakingRecording(id, speakingModelText(task), event.currentTarget, { feedbackSelector: `#speaking-feedback-${id}` });
  }));
  $("#speaking-done").addEventListener("click", () => complete("speaking", "Speaking practice complete."));
}

// Speaking as a deck: one practice per slide — hear the model, then record
// yourself, with nothing else on screen competing for a young learner's turn.
//
// The recorder keeps the same data-record / data-record-status / data-playback
// attributes the card grid used, because toggleRecording() addresses them by
// selector from outside the renderer. Slides are never repainted here, so a
// recording made on slide 3 is still attached to its player when the learner
// swipes back to it.
function renderSpeakingCarousel() {
  const esc = escapeHtml;
  const tasks = course.speaking;
  const slides = tasks.map((task, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Practice ${task.sequence} of ${tasks.length} · ${esc(task.activityType)}</span>
      <h3 class="gc-title">${esc(task.title)}</h3>
      <p class="gc-note gc-try">${esc(task.instructionsAndModelLines)}</p>
      ${task.audio?.available
        ? `<div class="gc-actions">
             <button class="gc-btn play" type="button" data-model="${esc(task.speakingId)}" data-rate="${AI_NARRATION_RATE}">${icon("volume-2")} Hear model</button>
             <button class="gc-btn ghost" type="button" data-model="${esc(task.speakingId)}" data-rate="${AI_NARRATION_RATE}">${icon("rotate-ccw")} Replay</button>
           </div>
           <small class="gc-source">ElevenLabs · approved Ehel voice · 0.90x</small>`
        : `<span class="audio-pending">${icon("clock-3")} ElevenLabs model audio pending</span>`}
      ${task.recordingRequired ? speakingCoachHtml(task, { idPrefix: "deck-", buttonClass: "gc-btn" }) : ""}
    </div></section>`);

  mountDeck({
    heading: "Use your voice",
    label: "Practice",
    intro: deckIntro("speaking"),
    finish: ["speaking", `I finished all ${tasks.length} speaking practices`],
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-model], [data-record], [data-speaking-submit], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.deckFinish) return complete("speaking", "Speaking practice complete.");
      if (target.dataset.record) return toggleRecording(target.dataset.record, target);
      if (target.dataset.speakingSubmit) {
        const id = target.dataset.speakingSubmit;
        const speaking = tasks.find((item) => item.speakingId === id);
        // The deck's own feedback element, not the original's above it.
        return submitSpeakingRecording(id, speakingModelText(speaking), target, { feedbackSelector: `#deck-speaking-feedback-${id}` });
      }
      const task = tasks.find((item) => item.speakingId === target.dataset.model);
      return playAudio(task.audio.source, { rate: Number(target.dataset.rate), button: target });
    },
  });

  // "Listened to the end" is not a click, so it cannot come through the deck's
  // delegated handler and has to be bound after the deck is mounted. Scoped to
  // the deck's own region: the original above carries the same data-playback
  // ids, and a document-wide bind would arm the wrong half's Submit.
  const deckRegion = deckMount ? $(deckMount) : null;
  (deckRegion ? [...deckRegion.querySelectorAll("[data-playback]")] : []).forEach((audio) => {
    audio.addEventListener("ended", () => {
      const id = audio.dataset.playback;
      const review = speakingReviewState.get(id) || { feedback: null };
      review.listened = true;
      speakingReviewState.set(id, review);
      const submit = deckRegion.querySelector(`[data-speaking-submit="${id}"]`);
      if (submit) submit.disabled = false;
      toast("You listened to the full recording. It is ready to submit.");
    });
  });
}

async function toggleRecording(taskId, button) {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Audio recording is not supported in this browser.");
  // The recorder belongs to the half of the page the learner pressed. At Grades
  // 1-4 the card grid and the deck are both on screen carrying the same
  // data-record, data-record-status and data-playback ids, so the status line and
  // the <audio> are found from the button's own region — a document-wide lookup
  // would put the recording into the other design's player and leave this one
  // silent.
  const region = button.closest(".gc-wrap, .classic-design") || document;
  const find = (selector) => region.querySelector(selector);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeRecordingId = taskId;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => { if (event.data.size) recordedChunks.push(event.data); });
    mediaRecorder.addEventListener("stop", () => {
      const audio = find(`[data-playback="${activeRecordingId}"]`);
      const previous = recordings.get(activeRecordingId);
      if (previous?.url) URL.revokeObjectURL(previous.url);
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
      const url = URL.createObjectURL(blob);
      recordings.set(activeRecordingId, { blob, url });
      speakingReviewState.set(activeRecordingId, { listened: false, feedback: null });
      audio.src = url;
      audio.hidden = false;
      find(`[data-record-status="${activeRecordingId}"]`).textContent = "Recording ready. Listen back.";
      const activeButton = find(`[data-record="${activeRecordingId}"]`);
      activeButton.classList.remove("recording");
      activeButton.innerHTML = icon("mic");
      stream.getTracks().forEach((track) => track.stop());
      audio.dispatchEvent(new CustomEvent("recordingready"));
      icons();
    });
    mediaRecorder.start();
    find(`[data-record-status="${taskId}"]`).textContent = "Recording… tap to stop";
    button.classList.add("recording");
    button.innerHTML = icon("square");
    icons();
  } catch {
    toast("Microphone permission is needed to record your introduction.");
  }
}

function renderWriting() {
  if (BOTH_DESIGNS) return renderBothDesigns(renderWritingClassic, renderWritingCarousel, "The same writing tasks, one at a time.");
  return renderWritingClassic();
}

// Shows what a finished response can look like, plus other answers that would
// also count. Grades 1-4 tasks carry `completedExample`; Grades 5-8 don't have
// it yet, so this renders nothing for them.
function completedExampleHtml(task, esc, detailsClass = "") {
  if (!task.completedExample) return "";
  const { items = [], otherAnswers = [] } = task.completedExample;
  const otherAnswersHtml = otherAnswers.length
    ? `<p class="field-label">Other suitable answers include:</p><ul class="completed-example">${otherAnswers.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
    : "";
  return `<details${detailsClass ? ` class="${detailsClass}"` : ""}><summary>Completed example</summary><ul class="completed-example">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>${otherAnswersHtml}</details>`;
}

function renderWritingClassic() {
  const { $, $$ } = classicScope();
  let active = course.writing[0].writingId;
  const draw = () => {
    const task = course.writing.find((item) => item.writingId === active);
    const saved = progress.writing[active] || "";
    $("#app").innerHTML = `${pageHeader("Plan, write and improve", "Writing studio", "Choose a task. Your draft saves automatically on this device.")}<div class="subtabs">${course.writing.map((item) => `<button class="subtab ${active === item.writingId ? "active" : ""}" data-writing="${item.writingId}" type="button">Writing ${item.sequence}</button>`).join("")}</div><div class="task-grid"><section class="panel"><h2>${escapeHtml(task.title)}</h2><p class="rule-box">${escapeHtml(task.promptAndInstructions)}</p>${task.audio?.available ? `<button class="button secondary" data-writing-audio="${task.writingId}" type="button">${icon("volume-2")} Hear the task</button>` : ""}<details><summary>View model text</summary><p class="model">${escapeHtml(task.modelText)}</p></details>${completedExampleHtml(task, escapeHtml)}<p><span class="field-label">Expected:</span> ${escapeHtml(task.expectedLength)}</p><textarea id="writing-draft" placeholder="${escapeHtml(task.sentenceStarter)}">${escapeHtml(saved)}</textarea><p id="save-status"><small>${saved ? "Draft restored" : "Start writing when you are ready"}</small></p></section><aside class="panel"><h3>Writer's checklist</h3><ul class="checklist">${task.successCriteria.split(";").map((criterion, index) => `<li><label><input type="checkbox" data-writing-check="${index}"><span>${escapeHtml(criterion.trim())}</span></label></li>`).join("")}</ul><h3>Support</h3><p>${escapeHtml(task.support)}</p><h3>Challenge</h3><p>${escapeHtml(task.extension)}</p><button class="button secondary" id="writing-feedback-btn" type="button">${icon("message-circle")} Get feedback</button><div id="writing-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button primary" id="writing-done" type="button">Submit this draft ${icon("send")}</button></aside></div>`;
    $$('[data-writing]').forEach((button) => button.addEventListener("click", () => { active = button.dataset.writing; draw(); showWritingInDeck?.(active); }));
    $$('[data-writing-audio]').forEach((button) => button.addEventListener("click", () => {
      const item = course.writing.find((w) => w.writingId === button.dataset.writingAudio);
      playAudio(item.audio.source, { rate: AI_NARRATION_RATE, button });
    }));
    let saveTimer;
    $("#writing-draft").addEventListener("input", (event) => { clearTimeout(saveTimer); $("#save-status").innerHTML = "<small>Saving…</small>"; saveTimer = setTimeout(() => { progress.writing[active] = event.target.value; saveProgress(); emitProgress({ type: "draft.saved", unit: PROGRESS_UNIT, section: `writing:${active}`, text: event.target.value, words: event.target.value.trim().split(/\s+/).filter(Boolean).length }); $("#save-status").innerHTML = "<small>Draft saved</small>"; }, 350); });
    $("#writing-feedback-btn").addEventListener("click", (event) => {
      const draft = $("#writing-draft").value.trim();
      if (draft.split(/\s+/).filter(Boolean).length < 5) return toast("Write a little more before asking for feedback.");
      checkWritingWithWehel(`Check my writing for "${task.title}": "${draft}"`, event.currentTarget, $("#writing-feedback"));
    });
    $("#writing-done").addEventListener("click", () => {
      const draft = $("#writing-draft").value.trim();
      if (draft.split(/\s+/).length < 8) return toast("Add a little more to your draft before submitting.");
      progress.writing[active] = draft; complete("writing", "Writing draft saved to your learning portfolio.");
    });
    icons();
  };
  draw();
}

// Writing as a deck: one task per slide, the draft box the centre of it.
//
// The studio's side panel does not survive as a panel — a slide has no room for
// a column beside the writing space, and a Grade 1-4 writer should be looking at
// what they are writing. The checklist, the support note and the challenge fold
// into <details> on the task's own slide, next to the draft they belong to,
// rather than becoming a second slide the learner has to leave their draft for.
//
// Each slide owns its textarea and its save line, so all drafts are live at once
// and swiping between tasks neither loses a draft nor re-renders the deck. The
// autosave, its 350 ms debounce, the ProgressClient event and the eight-word
// submit gate are the studio's, unchanged.
function renderWritingCarousel() {
  const esc = escapeHtml;
  const tasks = course.writing;
  const slides = tasks.map((task, index) => {
    const saved = progress.writing[task.writingId] || "";
    return `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Writing ${task.sequence} of ${tasks.length}${task.practiceType ? ` · ${esc(task.practiceType)}` : ""}</span>
      <h3 class="gc-title">${esc(task.title)}</h3>
      <p class="gc-note gc-try">${esc(task.promptAndInstructions)}</p>
      ${task.audio?.available ? `<div class="gc-actions"><button class="gc-btn play" type="button" data-writing-audio="${esc(task.writingId)}">${icon("volume-2")} Hear the task</button></div>` : ""}
      <p class="gc-note"><span class="field-label">Expected:</span> ${esc(task.expectedLength)}</p>
      <div class="wc-sentence">
        <small>Your draft</small>
        <textarea data-draft="${esc(task.writingId)}" rows="7" placeholder="${esc(task.sentenceStarter)}" aria-label="Writing draft for ${esc(task.title)}">${esc(saved)}</textarea>
        <small data-save-status="${esc(task.writingId)}" role="status" aria-live="polite" aria-atomic="true">${saved ? "Draft restored" : "Start writing when you are ready"}</small>
      </div>
      <button class="gc-btn" type="button" data-writing-feedback="${esc(task.writingId)}">${icon("message-circle")} Get feedback</button>
      <div data-writing-feedback-out="${esc(task.writingId)}" role="status" aria-live="polite" aria-atomic="true"></div>
      <details class="gc-practice"><summary>Writer's checklist</summary>
        <ul class="checklist">${task.successCriteria.split(";").map((criterion, position) => `<li><label><input type="checkbox" data-writing-check="${esc(task.writingId)}-${position}"><span>${esc(criterion.trim())}</span></label></li>`).join("")}</ul>
      </details>
      <details class="gc-practice"><summary>View model text</summary><p class="model">${esc(task.modelText)}</p></details>
      ${completedExampleHtml(task, esc, "gc-practice")}
      <details class="gc-practice"><summary>Support and challenge</summary>
        <p class="gc-note"><span class="field-label">Support:</span> ${esc(task.support)}</p>
        <p class="gc-note"><span class="field-label">Challenge:</span> ${esc(task.extension)}</p>
      </details>
      <button class="gc-btn done" type="button" data-writing-submit="${esc(task.writingId)}">${icon("send")} Submit this draft</button>
    </div></section>`;
  });

  const deck = mountDeck({
    heading: "Plan, write and improve",
    label: "Task",
    intro: deckIntro("writing"),
    closingHint: "Submit one draft on the task slides and Writing gets its tick.",
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-writing-audio], [data-writing-submit], [data-writing-feedback]");
      if (!target) return undefined;
      if (target.dataset.writingFeedback) {
        const id = target.dataset.writingFeedback;
        const draft = (deck.root.querySelector(`[data-draft="${CSS.escape(id)}"]`)?.value || "").trim();
        if (draft.split(/\s+/).filter(Boolean).length < 5) return toast("Write a little more before asking for feedback.");
        const writingTask = tasks.find((item) => item.writingId === id);
        checkWritingWithWehel(`Check my writing for "${writingTask.title}": "${draft}"`, target, deck.root.querySelector(`[data-writing-feedback-out="${CSS.escape(id)}"]`));
        return undefined;
      }
      if (target.dataset.writingAudio) {
        const task = tasks.find((item) => item.writingId === target.dataset.writingAudio);
        return playAudio(task.audio.source, { rate: AI_NARRATION_RATE, button: target });
      }
      const id = target.dataset.writingSubmit;
      const draft = (deck.root.querySelector(`[data-draft="${CSS.escape(id)}"]`)?.value || "").trim();
      if (draft.split(/\s+/).filter(Boolean).length < 8) return toast("Add a little more to your draft before submitting.");
      progress.writing[id] = draft;
      return complete("writing", "Writing draft saved to your learning portfolio.");
    },
  });

  const saveTimers = new Map();
  deck.root.addEventListener("input", (event) => {
    const field = event.target.closest("[data-draft]");
    if (!field) return;
    const id = field.dataset.draft;
    const status = deck.root.querySelector(`[data-save-status="${CSS.escape(id)}"]`);
    clearTimeout(saveTimers.get(id));
    if (status) status.textContent = "Saving…";
    saveTimers.set(id, setTimeout(() => {
      progress.writing[id] = field.value;
      saveProgress();
      emitProgress({ type: "draft.saved", unit: PROGRESS_UNIT, section: `writing:${id}`, text: field.value, words: field.value.trim().split(/\s+/).filter(Boolean).length });
      if (status) status.textContent = "Draft saved";
    }, 350));
  });

  // One slide per task and no filter, so the subtabs above map straight onto a
  // slide index. Unlike the vocabulary deck this list cannot be narrowed, so the
  // index is stable and does not need looking up at click time.
  showWritingInDeck = (writingId) => {
    const position = tasks.findIndex((task) => task.writingId === writingId);
    if (position >= 0) deck.goTo(position);
  };
}

function renderActivities() {
  if (BOTH_DESIGNS) return renderBothDesigns(renderActivitiesClassic, renderActivitiesCarousel, "The same activities, one at a time.");
  return renderActivitiesClassic();
}

function renderActivitiesClassic() {
  const { $, $$ } = classicScope();
  $("#app").innerHTML = `${pageHeader("Learn by doing", "Activities", `Complete six practical ${escapeHtml(course.unit.unitTitle)} challenges.`)}<div class="task-grid">${course.activities.map((activity) => `<article class="panel task-card"><span class="eyebrow">Activity ${activity.sequence} · ${escapeHtml(activity.activityType)}</span><h3>${escapeHtml(activity.title)}</h3><p class="rule-box">${escapeHtml(activity.instructionsAndItems)}</p>${activity.audio?.available ? `<button class="button secondary" data-activity-audio="${activity.activityId}" type="button">${icon("volume-2")} Hear the instructions</button>` : ""}<textarea class="activity-response" rows="4" placeholder="Record your answer or notes…" aria-label="Response for ${escapeHtml(activity.title)}"></textarea><button class="button secondary" data-activity-done="${activity.activityId}" type="button">${icon("check")} Mark complete</button></article>`).join("")}</div><p><button class="button primary" id="activities-done" type="button">Finish activities ${icon("check")}</button></p>`;
  $$('[data-activity-done]').forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.innerHTML = `${icon("check-circle")} Complete`; icons(); }));
  $$('[data-activity-audio]').forEach((button) => button.addEventListener("click", () => {
    const item = course.activities.find((a) => a.activityId === button.dataset.activityAudio);
    playAudio(item.audio.source, { rate: AI_NARRATION_RATE, button });
  }));
  $("#activities-done").addEventListener("click", () => complete("activities", "Unit activities complete."));
}

// Activities as a deck: one challenge per slide — instructions, the voice that
// reads them, and the box to answer in. The per-activity "Mark complete" is kept
// (it is how a learner tracks six separate challenges) and marks its own slide
// without repainting it, so the note they just typed stays where they left it.
function renderActivitiesCarousel() {
  const esc = escapeHtml;
  const activities = course.activities;
  const slides = activities.map((activity, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Activity ${activity.sequence} of ${activities.length} · ${esc(activity.activityType)}</span>
      <h3 class="gc-title">${esc(activity.title)}</h3>
      <p class="gc-note gc-try">${esc(activity.instructionsAndItems)}</p>
      ${activity.audio?.available ? `<div class="gc-actions"><button class="gc-btn play" type="button" data-activity-audio="${esc(activity.activityId)}">${icon("volume-2")} Hear the instructions</button></div>` : ""}
      <div class="wc-sentence">
        <small>Your answer or notes</small>
        <textarea data-activity-response="${esc(activity.activityId)}" rows="5" placeholder="Record your answer or notes…" aria-label="Response for ${esc(activity.title)}"></textarea>
      </div>
      <button class="gc-btn ghost" type="button" data-activity-done="${esc(activity.activityId)}">${icon("check")} Mark complete</button>
    </div></section>`);

  mountDeck({
    heading: "Learn by doing",
    label: "Activity",
    intro: deckIntro("activities"),
    finish: ["activities", "Finish activities"],
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-activity-audio], [data-activity-done], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.deckFinish) return complete("activities", "Unit activities complete.");
      if (target.dataset.activityDone) {
        target.disabled = true;
        target.classList.remove("ghost");
        target.classList.add("done");
        target.innerHTML = `${icon("check-circle")} Complete`;
        icons();
        return undefined;
      }
      const activity = activities.find((item) => item.activityId === target.dataset.activityAudio);
      return playAudio(activity.audio.source, { rate: AI_NARRATION_RATE, button: target });
    },
  });
}

async function playGameInstruction(text, button) {
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Preparing voice`;
  icons();
  try {
    const source = await aiVoiceUrl(text);
    playAudio(source, { rate: AI_NARRATION_RATE, button });
  } catch {
    toast("The ElevenLabs game voice is unavailable. Please try again.");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
    icons();
  }
}

function gameProgress(gameId) {
  progress.games ||= {};
  return progress.games[gameId] || { bestScore: 0, attempts: 0, xp: 0 };
}

function renderGames() {
  if (!gamePack) {
    $("#app").innerHTML = `${pageHeader("Game zone", "Games coming soon", "This unit's curriculum-linked games are still being prepared.", "Pilot pending")}`;
    return;
  }
  if (activeGameId) return renderActiveGame();
  const mastered = gamePack.games.filter((game) => gameProgress(game.id).bestScore >= gamePack.masteryScore).length;
  // Games is the one section with no deck, so it had no "I have finished this"
  // control of its own — mastering every game was the only way through, and
  // with the section gate that made one game a learner cannot beat into a wall
  // across the rest of the unit. Every other section has a way to say "I did
  // this": the word deck, the reading deck, the comprehension deck. This is the
  // same thing, and it is not a skip — every game has to have been PLAYED.
  // Mastery keeps its own path and its own celebration.
  const played = gamePack.games.filter((game) => gameProgress(game.id).attempts > 0).length;
  const gamesDone = progress.completed.includes("games");
  const canFinish = !gamesDone && played === gamePack.games.length;
  const xp = gamePack.games.reduce((total, game) => total + gameProgress(game.id).xp, 0);
  $("#app").innerHTML = `${pageHeader("Play, practise, master", "Game zone", `${gamePack.games.length} short learning games turn ${escapeHtml(course.unit.unitTitle)} vocabulary, reading, grammar, sentences and speaking into active practice.`, `${gradeLabel} games`)}
    <section class="games-hero"><img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}"><div><span class="eyebrow">Unit ${course.unit.unitNo} · ${escapeHtml(course.unit.unitTitle)}</span><h2>Choose your next challenge</h2><p>Earn stars by showing what you know. Hints and retries are always available.</p><div class="game-hero-stats"><strong>${mastered}/${gamePack.games.length} mastered</strong><strong>${played}/${gamePack.games.length} played</strong><strong>${xp} XP earned</strong></div>${canFinish
      ? `<button class="button gold" id="games-done" type="button">${icon("check")} I have played them all</button>`
      : gamesDone ? "" : `<p class="gc-note">Play every game once and you can finish this part — you do not have to master them all.</p>`}</div></section>
    <div class="game-grid">${gamePack.games.map((game, index) => {
      const saved = gameProgress(game.id);
      const passed = saved.bestScore >= gamePack.masteryScore;
      return `<article class="game-card ${passed ? "mastered" : ""}"><div class="game-card-top"><span class="game-icon">${icon(game.icon)}</span><span class="game-number">${index + 1}</span></div><span class="eyebrow">${escapeHtml(game.skill)}</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><div class="game-stars" aria-label="Best score ${saved.bestScore} out of ${game.rounds.length}">${game.rounds.map((_, star) => `<span class="${star < saved.bestScore ? "earned" : ""}">★</span>`).join("")}</div><button class="button ${passed ? "secondary" : "primary"}" data-start-game="${game.id}" type="button">${passed ? icon("rotate-ccw") + " Play again" : icon("play") + " Start game"}</button></article>`;
    }).join("")}</div>`;
  $$('[data-start-game]').forEach((button) => button.addEventListener("click", () => startGame(button.dataset.startGame)));
  // Re-render after completing, so the button gives way to the finished state
  // rather than sitting there inviting a second press. complete() repaints the
  // nav on its own, which is what opens the next section.
  $("#games-done")?.addEventListener("click", () => { complete("games", `All ${gamePack.games.length} games played. Well done!`); renderGames(); });
  icons();
}

function startGame(gameId) {
  activeGameId = gameId;
  gameRoundIndex = 0;
  gameScore = 0;
  gameLocked = false;
  gameSelection = [];
  gamePairSelection = [];
  gameMistakes = 0;
  renderActiveGame();
}

function currentGame() {
  return gamePack.games.find((game) => game.id === activeGameId);
}

function gameHint(game, round) {
  if (round.clue) return round.clue;
  if (["sentence", "sequence"].includes(game.type)) return "Begin with the word that has a capital letter or belongs first in the sequence. Check the ending carefully.";
  if (game.type === "pairs") return "Remember where each revealed word or meaning appears. Match one word with one meaning.";
  if (game.id === "reading-detective") return "Look again at the story evidence and find the sentence that answers the question.";
  if (game.id === "grammar-sort") return "Read the complete sentence aloud and use the unit grammar rule.";
  if (game.type === "speaking") return "Listen to the model, then practise one short phrase at a time before recording.";
  return "Say each choice with the meaning. One choice should sound like a clear match.";
}

function gameRoundMarkup(game, round) {
  if (game.type === "choice") {
    return `${game.passage ? `<div class="game-passage"><span>Story evidence</span><p>${escapeHtml(game.passage)}</p></div>` : ""}<div class="game-choices">${round.choices.map((choice, index) => `<button data-game-choice="${index}" type="button">${escapeHtml(choice)}</button>`).join("")}</div>`;
  }
  if (game.type === "spelling") {
    const letters = [...round.answer].reverse();
    return `<p class="game-clue">${escapeHtml(round.clue)}</p><div class="game-answer-slots" id="game-answer">${round.answer.split("").map(() => "<span></span>").join("")}</div><div class="game-tiles">${letters.map((letter, index) => `<button data-game-tile="${index}" data-value="${letter}" type="button">${letter.toUpperCase()}</button>`).join("")}</div><div class="game-tools"><button class="button secondary" id="game-reset" type="button">${icon("rotate-ccw")} Reset</button><button class="button primary" id="game-check" type="button">Check word ${icon("check")}</button></div>`;
  }
  if (["sentence", "sequence"].includes(game.type)) {
    return `<div class="game-sentence-answer" id="game-answer"><span>Choose the words below</span></div><div class="game-word-tiles">${round.tokens.map((token, index) => `<button data-game-tile="${index}" data-value="${escapeHtml(token)}" type="button">${escapeHtml(token)}</button>`).join("")}</div><div class="game-tools"><button class="button secondary" id="game-reset" type="button">${icon("rotate-ccw")} Reset</button><button class="button primary" id="game-check" type="button">${game.type === "sequence" ? "Check order" : "Check sentence"} ${icon("check")}</button></div>`;
  }
  if (game.type === "pairs") {
    const tiles = round.pairs.flatMap((pair, pairIndex) => pair.map((text, side) => ({ text, pairIndex, side })));
    const ordered = [0, 3, 4, 1, 2, 5].map((index) => tiles[index]);
    return `<div class="memory-grid">${ordered.map((tile, index) => `<button data-memory-tile="${index}" data-pair="${tile.pairIndex}" data-value="${escapeHtml(tile.text)}" type="button" aria-label="Hidden matching tile ${index + 1}"><span>?</span></button>`).join("")}</div><p class="game-clue">Match each word with its meaning. A perfect round earns a star.</p>`;
  }
  const recordingId = `game-speaking-${gameRoundIndex}`;
  const review = speakingReviewState.get(recordingId);
  return `<div class="speaking-target game-speaking-target"><span>Say this</span><p>${escapeHtml(round.target)}</p><button class="button secondary" id="game-speaking-model" type="button">${icon("volume-2")} Hear ElevenLabs model</button></div><div class="speaking-flow"><span class="flow-step active"><strong>1</strong> Record</span><span class="flow-step ${review ? "active" : ""}"><strong>2</strong> Listen</span><span class="flow-step ${review?.listened ? "active" : ""}"><strong>3</strong> Submit</span><span class="flow-step ${review?.feedback ? "active" : ""}"><strong>4</strong> Feedback</span></div><div class="recorder"><button class="record-button" data-record="${recordingId}" type="button" aria-label="Record speaking game answer">${icon("mic")}</button><div><strong data-record-status="${recordingId}" role="status" aria-live="polite" aria-atomic="true">${recordings.has(recordingId) ? "Recording ready. Listen back." : "Ready to record"}</strong><small> Your recording stays on this device until you submit it.</small></div></div><audio data-playback="${recordingId}" controls ${recordings.has(recordingId) ? "" : "hidden"} aria-label="Your speaking game recording"></audio><button class="button primary game-speaking-submit" id="game-speaking-submit" type="button" ${review?.listened ? "" : "disabled"}>${icon("send")} Submit for pronunciation check</button><div id="game-speaking-feedback" role="status" aria-live="polite" aria-atomic="true">${pronunciationFeedbackHtml(review?.feedback)}</div>`;
}

function renderActiveGame() {
  const game = currentGame();
  if (!game) { activeGameId = null; return renderGames(); }
  if (gameRoundIndex >= game.rounds.length) return renderGameResult(game);
  const round = game.rounds[gameRoundIndex];
  gameLocked = false;
  gameSelection = [];
  gamePairSelection = [];
  gameMistakes = 0;
  $("#app").innerHTML = `<div class="game-play-top"><button class="button ghost" id="games-home" type="button">${icon("arrow-left")} All games</button><div><span>Challenge ${gameRoundIndex + 1} of ${game.rounds.length}</span><strong>${gameScore} stars</strong></div></div><section class="panel game-stage"><div class="game-stage-head"><span class="game-icon">${icon(game.icon)}</span><div><span class="eyebrow">${escapeHtml(game.skill)}</span><h1>${escapeHtml(game.title)}</h1></div><button class="icon-button" id="game-listen" type="button" title="Listen to instructions" aria-label="Listen to game instructions">${icon("volume-2")}</button></div><div class="game-progress"><span style="width:${(gameRoundIndex / game.rounds.length) * 100}%"></span></div><div class="game-prompt"><span>Your challenge</span><h2>${escapeHtml(round.prompt)}</h2><button class="button ghost game-hint" id="game-hint" type="button">${icon("lightbulb")} Hint</button></div>${gameRoundMarkup(game, round)}<div id="game-feedback" role="status" aria-live="polite" aria-atomic="true"></div></section>`;
  $("#games-home").addEventListener("click", () => { activeGameId = null; renderGames(); });
  $("#game-listen").addEventListener("click", (event) => playGameInstruction(`${round.prompt} ${round.clue || round.target || ""}`, event.currentTarget));
  $("#game-hint").addEventListener("click", () => toast(gameHint(game, round)));
  if (game.type === "choice") bindChoiceGame(game, round);
  if (["spelling", "sentence", "sequence"].includes(game.type)) bindBuilderGame(game, round);
  if (game.type === "pairs") bindPairsGame(round);
  if (game.type === "speaking") bindSpeakingGame(game, round);
  icons();
}

function bindChoiceGame(game, round) {
  $$('[data-game-choice]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked) return;
    const choice = round.choices[Number(button.dataset.gameChoice)];
    const correct = choice === round.answer;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$('[data-game-choice]').find((item) => round.choices[Number(item.dataset.gameChoice)] === round.answer)?.classList.add("correct");
    completeGameRound(correct, round.explanation);
  }));
}

function bindBuilderGame(game, round) {
  const drawSelection = () => {
    const values = gameSelection.map((item) => item.value);
    if (game.type === "spelling") {
      $("#game-answer").innerHTML = round.answer.split("").map((_, index) => `<span>${escapeHtml(values[index] || "")}</span>`).join("");
    } else {
      $("#game-answer").innerHTML = values.length ? values.map((value) => `<strong>${escapeHtml(value)}</strong>`).join("") : "<span>Choose the words below</span>";
    }
  };
  $$('[data-game-tile]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked || button.disabled) return;
    gameSelection.push({ index: button.dataset.gameTile, value: button.dataset.value });
    button.disabled = true;
    drawSelection();
  }));
  $("#game-reset").addEventListener("click", () => { gameSelection = []; $$('[data-game-tile]').forEach((button) => { button.disabled = false; }); drawSelection(); });
  $("#game-check").addEventListener("click", () => {
    if (!gameSelection.length) return toast("Choose some tiles first.");
    const response = game.type === "spelling" ? gameSelection.map((item) => item.value).join("") : gameSelection.map((item) => item.value).join(" ");
    completeGameRound(response === round.answer, response === round.answer ? "You built it correctly." : `The correct answer is: ${round.answer}`);
  });
}

function bindPairsGame(round) {
  let matchedPairs = 0;
  $$('[data-memory-tile]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked || button.disabled || gamePairSelection.includes(button)) return;
    button.classList.add("revealed");
    button.querySelector("span").textContent = button.dataset.value;
    gamePairSelection.push(button);
    if (gamePairSelection.length < 2) return;
    const [first, second] = gamePairSelection;
    if (first.dataset.pair === second.dataset.pair) {
      first.classList.add("matched");
      second.classList.add("matched");
      first.disabled = true;
      second.disabled = true;
      gamePairSelection = [];
      matchedPairs += 1;
      if (matchedPairs === round.pairs.length) completeGameRound(gameMistakes === 0, gameMistakes === 0 ? "Perfect memory! Every pair matched." : "All pairs matched. Replay for a perfect star.");
      return;
    }
    gameMistakes += 1;
    first.classList.add("wrong");
    second.classList.add("wrong");
    setTimeout(() => {
      for (const item of [first, second]) {
        item.classList.remove("revealed", "wrong");
        item.querySelector("span").textContent = "?";
      }
      gamePairSelection = [];
    }, 650);
  }));
}

function bindSpeakingGame(game, round) {
  const recordingId = `game-speaking-${gameRoundIndex}`;
  const recordButton = $(`[data-record="${recordingId}"]`);
  const playback = $(`[data-playback="${recordingId}"]`);
  const saved = recordings.get(recordingId);
  if (saved) playback.src = saved.url;
  recordButton.addEventListener("click", () => toggleRecording(recordingId, recordButton));
  playback.addEventListener("recordingready", () => { $("#game-speaking-submit").disabled = true; $("#game-speaking-feedback").innerHTML = ""; });
  playback.addEventListener("ended", () => {
    const review = speakingReviewState.get(recordingId) || { feedback: null };
    review.listened = true;
    speakingReviewState.set(recordingId, review);
    $("#game-speaking-submit").disabled = false;
    toast("You listened to the full recording. It is ready to submit.");
  });
  $("#game-speaking-model").addEventListener("click", (event) => playGameInstruction(round.target, event.currentTarget));
  $("#game-speaking-submit").addEventListener("click", (event) => submitSpeakingRecording(recordingId, round.target, event.currentTarget, {
    feedbackSelector: "#game-speaking-feedback",
    onFeedback: (feedback) => completeGameRound(feedback.score >= 65, feedback.score >= 65 ? "Your key words were recognised clearly." : "Listen to the model and practise the highlighted words again."),
  }));
}

function completeGameRound(correct, explanation) {
  if (gameLocked) return;
  gameLocked = true;
  if (correct) gameScore += 1;
  const feedback = $("#game-feedback");
  feedback.innerHTML = `<div class="game-round-feedback ${correct ? "good" : "try"}"><span>${correct ? icon("star") : icon("lightbulb")}</span><div><span class="status-note">${correct ? "Star earned!" : "Good try!"}</span><p>${escapeHtml(explanation || "Review the clue and keep going.")}</p></div></div><button class="button primary" id="game-next" type="button">${gameRoundIndex + 1 === currentGame().rounds.length ? "See my result" : "Next challenge"} ${icon("arrow-right")}</button>`;
  $("#game-next").addEventListener("click", () => { gameRoundIndex += 1; renderActiveGame(); });
  icons();
}

function renderGameResult(game) {
  const passed = gameScore >= gamePack.masteryScore;
  const previous = gameProgress(game.id);
  const bestScore = Math.max(previous.bestScore, gameScore);
  const xp = Math.max(previous.xp, gameScore * 20 + (passed ? 20 : 0));
  progress.games[game.id] = { bestScore, attempts: previous.attempts + 1, xp };
  saveProgress();
  const mastered = gamePack.games.filter((item) => gameProgress(item.id).bestScore >= gamePack.masteryScore).length;
  if (mastered === gamePack.games.length) complete("games", `All ${gamePack.games.length} games mastered. Brilliant work!`);
  $("#app").innerHTML = `<section class="panel game-result"><div class="score-ring">${gameScore}/${game.rounds.length}</div><span class="eyebrow">${passed ? "Game mastered" : "Keep practising"}</span><h1>${passed ? "Brilliant work!" : "Nearly there!"}</h1><p>You earned ${gameScore} stars and ${gameScore * 20 + (passed ? 20 : 0)} XP in ${escapeHtml(game.title)}.</p><div class="game-stars large">${game.rounds.map((_, index) => `<span class="${index < gameScore ? "earned" : ""}">★</span>`).join("")}</div><div class="game-tools"><button class="button secondary" id="replay-game" type="button">${icon("rotate-ccw")} Play again</button><button class="button primary" id="games-home" type="button">Choose another game ${icon("arrow-right")}</button></div></section>`;
  $("#replay-game").addEventListener("click", () => startGame(game.id));
  $("#games-home").addEventListener("click", () => { activeGameId = null; renderGames(); });
  icons();
}

function renderQuiz() {
  quizIndex = 0; quizScore = 0; quizLocked = false;
  $("#app").innerHTML = `${pageHeader("Unit checkpoint", "Quick quiz", "Answer ten questions. You will see feedback after each answer and can try again.")}<section class="panel quiz-shell" id="quiz-shell"></section>`;
  drawQuizQuestion();
}

function drawQuizQuestion(shouldFocus = false) {
  const shell = $("#quiz-shell");
  if (quizIndex >= course.quizzes.length) {
    const percent = Math.round((quizScore / course.quizzes.length) * 100);
    emitProgress({ type: "checkpoint.result", unit: PROGRESS_UNIT, section: "quiz", score: percent, passed: percent >= 60, attempt: 1 });
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${quizScore}/${course.quizzes.length}</div><span class="eyebrow">Checkpoint complete</span><h2>${percent >= 80 ? "Excellent word power!" : "Good effort. Review and try again."}</h2><p>You scored ${percent}% and earned ${quizScore * 10} XP.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="quiz-done" type="button">Continue ${icon("arrow-right")}</button></div></div>`;
    $("#retry-quiz").addEventListener("click", renderQuiz);
    $("#quiz-done").addEventListener("click", () => { if (percent >= 60) complete("quiz"); navigate("reflect"); });
    if (percent >= 60) complete("quiz", "Quiz passed. Well done!");
    icons();
    if (shouldFocus) focusDynamicContent("#quiz-shell h2", `Quiz complete. You scored ${percent} percent.`);
    return;
  }
  const question = course.quizzes[quizIndex];
  const options = question.options.split(" | ");
  shell.innerHTML = `<div class="quiz-top"><span>Question ${quizIndex + 1} of ${course.quizzes.length}</span><strong>${quizScore} correct</strong></div><div class="progress-track"><span style="width:${(quizIndex / course.quizzes.length) * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(question.question)}</h2><div class="quiz-options">${options.map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button primary" id="next-quiz" type="button" hidden>Next question ${icon("arrow-right")}</button>`;
  quizLocked = false;
  $$('[data-option]').forEach((button) => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.option === String(question.correctAnswer);
    if (correct) quizScore += 1;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$('[data-option]').find((option) => option.dataset.option === String(question.correctAnswer))?.classList.add("correct");
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(question.explanation)}</p>`;
    $("#next-quiz").hidden = false;
    $("#next-quiz").addEventListener("click", () => { quizIndex += 1; drawQuizQuestion(true); });
  }));
  icons();
  if (shouldFocus) focusDynamicContent(".quiz-question", `Question ${quizIndex + 1} of ${course.quizzes.length}. ${question.question}`);
}

function calculateFinalQuizResults(answers = finalQuizProgress.answers) {
  const answered = finalAssessment.questions.filter((question) => answers[question.questionId]);
  const correct = answered.filter((question) => answers[question.questionId].selected === question.correctAnswer);
  const summarize = (key, definitions) => definitions.map((definition) => {
    const questions = finalAssessment.questions.filter((question) => question[key] === definition.id);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { ...definition, score, total: questions.length, percent: Math.round((score / questions.length) * 100) };
  });
  const sectionScores = summarize("sectionId", finalAssessment.sections.map((section) => ({ id: section.sectionId, label: section.title })));
  const areaNames = [...new Set(finalAssessment.questions.map((question) => question.curriculumArea))];
  const areaScores = summarize("curriculumArea", areaNames.map((area) => ({ id: area, label: area })));
  const unitScores = summarize("sourceUnitNo", manifest.units.map((unit) => ({ id: unit.number, label: `Unit ${unit.number}: ${unit.title}` })));
  const percent = Math.round((correct.length / finalAssessment.totalMarks) * 100);
  return { answered: answered.length, score: correct.length, total: finalAssessment.totalMarks, percent, passed: percent >= finalAssessment.passPercent, sectionScores, areaScores, unitScores };
}

function finalizeFinalQuiz() {
  const results = calculateFinalQuizResults();
  if (!finalQuizProgress.submitted) {
    finalQuizProgress.attempts.push({
      attempt: finalQuizProgress.attempts.length + 1,
      startedAt: finalQuizProgress.startedAt,
      submittedAt: new Date().toISOString(),
      answers: { ...finalQuizProgress.answers },
      score: results.score,
      total: results.total,
      percent: results.percent,
      passed: results.passed,
      sectionScores: results.sectionScores,
      areaScores: results.areaScores,
      unitScores: results.unitScores,
    });
  }
  finalQuizProgress.currentIndex = finalAssessment.questions.length;
  finalQuizProgress.completed = true;
  finalQuizProgress.passed = results.passed;
  finalQuizProgress.submitted = true;
  saveFinalQuizProgress();
  emitProgress({ type: "checkpoint.result", unit: "final", section: "course-quiz", score: results.percent, passed: results.passed, attempt: finalQuizProgress.attempts.length });
  renderFinalQuizResults(results);
}

function renderFinalQuiz() {
  if (unitNumber !== 10) return navigate("overview");
  if (finalQuizProgress.submitted) return renderFinalQuizResults(calculateFinalQuizResults());
  const hasStarted = Object.keys(finalQuizProgress.answers).length > 0 || finalQuizProgress.startedAt;
  if (!hasStarted) {
    $("#app").innerHTML = `${pageHeader("Course-level assessment", finalAssessment.title, finalAssessment.description, "Approved final assessment")}
      <div class="final-quiz-intro">
        <section class="panel final-quiz-hero"><div class="final-quiz-mark">${icon("trophy")}</div><span class="eyebrow">Your ${gradeLabel} finish line</span><h2>Three short sections. One complete picture of your progress.</h2><p>Your answer saves after every question. Reach ${finalAssessment.passPercent}% for mastery, or review the suggested lessons and try again.</p><div class="final-quiz-facts"><span><strong>${finalAssessment.questionCount}</strong> questions</span><span><strong>${finalAssessment.estimatedMinutes}</strong> minutes</span><span><strong>${finalAssessment.passPercent}%</strong> mastery</span></div><button class="button gold" id="start-final-quiz" type="button">Start final quiz ${icon("arrow-right")}</button></section>
        <div class="final-section-grid">${finalAssessment.sections.map((section) => `<article class="panel final-section-card"><span>${String(section.sequence).padStart(2, "0")}</span><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.description)}</p><small>${section.questionCount} questions</small></article>`).join("")}</div>
      </div>`;
    $("#start-final-quiz").addEventListener("click", () => {
      finalQuizProgress.startedAt = new Date().toISOString();
      finalQuizProgress.currentIndex = 0;
      saveFinalQuizProgress();
      finalQuizIndex = 0;
      drawFinalQuizQuestion();
    });
    icons();
    return;
  }
  finalQuizIndex = Math.min(finalQuizProgress.currentIndex || 0, finalAssessment.questions.length - 1);
  drawFinalQuizQuestion();
}

function drawFinalQuizQuestion() {
  const question = finalAssessment.questions[finalQuizIndex];
  if (!question) return finalizeFinalQuiz();
  const section = finalAssessment.sections.find((item) => item.sectionId === question.sectionId);
  const savedAnswer = finalQuizProgress.answers[question.questionId];
  const options = question.options.split(" | ");
  const sectionQuestionNumber = finalAssessment.questions.filter((item) => item.sectionId === question.sectionId && item.sequence <= question.sequence).length;
  const audioControl = question.audio?.available
    ? `<button class="button secondary" id="listen-final-question" type="button">${icon("volume-2")} Listen</button>`
    : `<span class="audio-pending">${icon("headphones")} ElevenLabs read-aloud pending</span>`;
  $("#app").innerHTML = `${pageHeader(`Section ${section.sequence} of ${finalAssessment.sections.length}`, section.title, section.description, `Question ${finalQuizIndex + 1} of ${finalAssessment.questionCount}`)}
    <section class="panel quiz-shell final-quiz-shell">
      <div class="quiz-top"><span>${sectionQuestionNumber} of ${section.questionCount} in this section</span><strong>${Object.keys(finalQuizProgress.answers).length} answers saved</strong></div>
      <div class="progress-track"><span style="width:${(finalQuizIndex / finalAssessment.questionCount) * 100}%"></span></div>
      <div class="final-question-meta"><span>Review source: Unit ${question.sourceUnitNo}</span>${audioControl}</div>
      <h2 class="quiz-question">${escapeHtml(question.question)}</h2>
      <div class="quiz-options">${options.map((option) => {
        const isSelected = savedAnswer?.selected === option;
        const state = savedAnswer ? (option === question.correctAnswer ? "correct" : isSelected ? "wrong" : "") : "";
        return `<button class="quiz-option ${state}" data-final-option="${escapeHtml(option)}" type="button" ${savedAnswer ? "disabled" : ""}>${escapeHtml(option)}</button>`;
      }).join("")}</div>
      <div id="final-quiz-feedback" role="status" aria-live="polite" aria-atomic="true">${savedAnswer ? `<p class="feedback ${savedAnswer.correct ? "good" : "try"}"><span class="status-note">${savedAnswer.correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(question.explanation)}</p>` : ""}</div>
      <div class="final-quiz-actions"><span>${icon("save")} Answers save on this device</span><button class="button primary" id="next-final-question" type="button" ${savedAnswer ? "" : "hidden"}>${finalQuizIndex === finalAssessment.questionCount - 1 ? "Finish quiz" : "Next question"} ${icon("arrow-right")}</button></div>
    </section>`;
  if (question.audio?.available) $("#listen-final-question").addEventListener("click", (event) => playAudio(question.audio.source, { rate: AI_NARRATION_RATE, button: event.currentTarget }));
  $$('[data-final-option]').forEach((button) => button.addEventListener("click", () => {
    if (finalQuizProgress.answers[question.questionId]) return;
    const selected = button.dataset.finalOption;
    finalQuizProgress.answers[question.questionId] = { selected, correct: selected === question.correctAnswer, answeredAt: new Date().toISOString() };
    finalQuizProgress.currentIndex = finalQuizIndex;
    saveFinalQuizProgress();
    drawFinalQuizQuestion();
  }));
  if (savedAnswer) $("#next-final-question").addEventListener("click", () => {
    if (finalQuizIndex >= finalAssessment.questionCount - 1) return finalizeFinalQuiz();
    finalQuizIndex += 1;
    finalQuizProgress.currentIndex = finalQuizIndex;
    saveFinalQuizProgress();
    drawFinalQuizQuestion();
  });
  icons();
}

function renderFinalQuizResults(results) {
  // A withdrawn unit (Grade 1 Unit 0) is never recommended for review: its
  // plain link would clamp to Unit 1 and land the learner somewhere the label
  // did not promise. Its questions still count toward the score above; the
  // readiness check's remediation links are the one door that prescribes it.
  const reviewUnits = results.unitScores.filter((item) => Number(item.id) >= defaultUnit && item.percent < finalAssessment.passPercent).sort((a, b) => a.percent - b.percent).slice(0, 3);
  $("#app").innerHTML = `${pageHeader("Course assessment complete", `Your ${gradeLabel} English results`, "Your report brings together all three sections and shows exactly where to review next.", results.passed ? "Mastery achieved" : "Review recommended")}
    <div class="final-results-layout">
      <section class="panel final-result-summary"><div class="score-ring">${results.score}/${results.total}</div><span class="eyebrow">${results.percent}% overall</span><h2>${results.passed ? `You reached ${gradeLabel} mastery!` : "Your next attempt can be stronger."}</h2><p>${results.passed ? `You showed secure understanding across the ${gradeLabel} English course.` : `Review the suggested Units, then try again. The mastery target is ${finalAssessment.passPercent}%.`}</p><div class="audio-actions"><button class="button secondary" id="retry-final-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="back-to-capstone" type="button">Return to capstone ${icon("arrow-right")}</button></div></section>
      <section class="panel"><h2>Section scores</h2><div class="result-bars">${results.sectionScores.map((item) => `<div class="result-bar"><div><strong>${escapeHtml(item.label)}</strong><span>${item.score}/${item.total}</span></div><div class="progress-track"><span style="width:${item.percent}%"></span></div></div>`).join("")}</div></section>
      <section class="panel"><h2>Skills report</h2><div class="skill-score-grid">${results.areaScores.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.percent}%</strong><small>${item.score} of ${item.total}</small></div>`).join("")}</div></section>
      <section class="panel"><h2>${reviewUnits.length ? "Recommended review" : "Every Unit is secure"}</h2>${reviewUnits.length ? `<div class="review-list">${reviewUnits.map((item) => `<a href="${courseLocation(item.id)}"><span><strong>${escapeHtml(item.label)}</strong><small>${item.score} of ${item.total} correct</small></span>${icon("arrow-up-right")}</a>`).join("")}</div>` : "<p>You met the mastery target in every source Unit represented in the final quiz.</p>"}</section>
    </div>`;
  $("#retry-final-quiz").addEventListener("click", () => {
    finalQuizProgress.answers = {};
    finalQuizProgress.currentIndex = 0;
    finalQuizProgress.completed = false;
    finalQuizProgress.passed = false;
    finalQuizProgress.submitted = false;
    finalQuizProgress.startedAt = null;
    saveFinalQuizProgress();
    finalQuizIndex = 0;
    renderFinalQuiz();
  });
  $("#back-to-capstone").addEventListener("click", () => navigate("reflect"));
  icons();
}

// ===================== prerequisite unit: placement exam =====================
// Unit -1 on every grade. The exam data (questions, banding thresholds,
// remediation links) lives in grade-N/data/placement-exam.json — the UI only
// applies it, so curriculum can retune bands without a code change.

function placementLocation(targetGrade, targetUnit, nextRoute = "overview", { review = false } = {}) {
  const url = new URL(location.href);
  url.searchParams.set("grade", targetGrade);
  // Every grade opens at Unit 1 now that Grade 1's Unit 0 is withdrawn from
  // learners; a remediation item that means Unit 0 names it explicitly and
  // arrives with the ?review=1 marker that unit0Visit honours.
  url.searchParams.set("unit", targetUnit ?? 1);
  // Set for remediation, deleted for everything else. "Start Grade 2 English"
  // is a course to begin at its first unit and walk in order, not a unit to
  // reopen, so it must not inherit the marker from a url that carries one.
  if (review) url.searchParams.set("review", "1");
  else url.searchParams.delete("review");
  url.hash = nextRoute;
  return url.href;
}

function remediationHref(item) {
  if (item.href) return new URL(item.href, location.href).href;
  return placementLocation(item.grade, item.unit, "overview", { review: true });
}

function remediationLabel(item) {
  if (item.href) return item.title || "Foundation course";
  return `${item.grade != null ? `Grade ${item.grade}, ` : ""}Unit ${item.unit}: ${item.title}`;
}

function placementBand(percent, sectionScores) {
  const banding = placementExam.banding || {};
  const ready = banding.ready || {};
  const review = banding.readyWithReview || {};
  const criticalRule = banding.criticalSection;
  const critical = criticalRule && sectionScores.find((item) => item.id === criticalRule.sectionId);
  if (percent < (review.minOverallPercent ?? 50) || (critical && critical.percent <= (criticalRule.maxFailPercent ?? 40))) return "notReady";
  if (percent >= (ready.minOverallPercent ?? 80) && sectionScores.every((item) => item.percent >= (ready.minSectionPercent ?? 60))) return "ready";
  return "readyWithReview";
}

function calculatePlacementResults(answers = placementProgress.answers) {
  const answered = placementExam.questions.filter((question) => answers[question.questionId]);
  const correct = answered.filter((question) => answers[question.questionId].selected === question.correctAnswer);
  const sectionScores = placementExam.sections.map((section) => {
    const questions = placementExam.questions.filter((question) => question.sectionId === section.sectionId);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { id: section.sectionId, label: section.title, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0, remediation: section.remediation || [] };
  });
  const areaNames = [...new Set(placementExam.questions.map((question) => question.curriculumArea))];
  const areaScores = areaNames.map((area) => {
    const questions = placementExam.questions.filter((question) => question.curriculumArea === area);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { id: area, label: area, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0 };
  });
  const percent = Math.round((correct.length / placementExam.totalMarks) * 100);
  return { answered: answered.length, score: correct.length, total: placementExam.totalMarks, percent, sectionScores, areaScores, band: placementBand(percent, sectionScores) };
}

function finalizePlacement() {
  const results = calculatePlacementResults();
  if (!placementProgress.submitted) {
    placementProgress.attempts.push({
      attempt: placementProgress.attempts.length + 1,
      startedAt: placementProgress.startedAt,
      submittedAt: new Date().toISOString(),
      answers: { ...placementProgress.answers },
      score: results.score,
      total: results.total,
      percent: results.percent,
      band: results.band,
      sectionScores: results.sectionScores,
      areaScores: results.areaScores,
    });
  }
  placementProgress.currentIndex = placementExam.questions.length;
  placementProgress.completed = true;
  placementProgress.band = results.band;
  placementProgress.submitted = true;
  savePlacementProgress();
  complete("placement");
  emitProgress({ type: "checkpoint.result", unit: "prereq", section: "placement-exam", score: results.percent, passed: results.band !== "notReady", attempt: placementProgress.attempts.length });
  renderPlacementResults(results);
}

function renderPrereqOverview() {
  const isReadiness = placementExam.kind === "readiness";
  const facts = `<div class="final-quiz-facts"><span><strong>${placementExam.questionCount}</strong> questions</span><span><strong>${placementExam.estimatedMinutes}</strong> minutes</span><span><strong>${placementExam.sections.length}</strong> sections</span></div>`;
  const bandInfo = placementProgress.submitted && placementProgress.band ? (placementExam.banding[placementProgress.band] || {}) : null;
  $("#app").innerHTML = `${pageHeader(`${gradeLabel} · Prerequisite unit`, placementExam.title, placementExam.description, isReadiness ? "Readiness check" : "Placement exam")}
    <div class="final-quiz-intro">
      <section class="panel final-quiz-hero"><div class="final-quiz-mark">${icon("compass")}</div><span class="eyebrow">Before Unit 1</span><h2>${isReadiness ? "Let's see what you already know." : `Show what you remember — we'll find your perfect start.`}</h2><p>${escapeHtml(placementExam.attemptsAllowed || "You can try as many times as you like.")} Your answers save on this device after every question.</p>${facts}
      ${bandInfo
        ? `<div class="audio-actions"><button class="button gold" data-go="placement" type="button">${icon("chart-no-axes-column-increasing")} View my placement report</button><a class="button secondary" href="${courseLocation(defaultUnit)}">Go to Unit 1 ${icon("arrow-right")}</a></div>`
        : `<div class="audio-actions"><button class="button gold" data-go="placement" type="button">${isReadiness ? "Start readiness check" : "Start placement exam"} ${icon("arrow-right")}</button><a class="button secondary" href="${courseLocation(defaultUnit)}">Skip for now — open Unit 1</a></div>`}
      ${overviewAudioButton(placementExam, "intro", "Hear the overview")}
      </section>
      <div class="final-section-grid">${placementExam.sections.map((section) => `<article class="panel final-section-card"><span>${String(section.sequence).padStart(2, "0")}</span><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.description)}</p><small>${section.questionCount} questions</small></article>`).join("")}</div>
      ${overviewAudioButton(placementExam, "sections", "Hear what the exam covers")}
      <section class="panel"><h3>How placement works</h3><ol class="path-list">
        <li>${icon("circle-check-big")}<span><strong>Ready:</strong> you move straight on to Unit 1.</span></li>
        <li>${icon("book-open")}<span><strong>Ready with review:</strong> you start Unit 1 and warm up with a few review lessons.</span></li>
        <li>${icon("sprout")}<span><strong>Build strong roots first:</strong> we suggest the best course to grow from — a grown-up or teacher can help you choose.</span></li>
      </ol>${overviewAudioButton(placementExam, "path", "Hear how placement works")}</section>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  bindOverviewAudio(placementExam);
  icons();
}

// ===================== prerequisite unit: year plan ==========================
// One page per grade, drawn from the course manifest at render time so it can
// never disagree with the course it describes: the units, their terms and word
// counts are read off the manifest, not restated here. It lives in the
// Prerequisite unit's nav because it is read before the year is walked, and it
// is a reference page, not a step — never counted, never locked.
//
// Weeks are the school calendar's real teaching weeks (SCHOOL_CALENDAR in
// shell/study-plan.js — the one definition every subject's plans read),
// allocated evenly across the term's units with the remainder given to the
// earlier units. Units below defaultUnit are excluded the same way the
// pickers exclude them: Grade 1's withdrawn Unit 0 must not reappear here as
// a scheduled week.
function yearPlanTerms() {
  const byTerm = new Map();
  for (const unit of manifest.units.filter((entry) => Number(entry.number) >= defaultUnit)) {
    const key = unit.termId || "t01";
    if (!byTerm.has(key)) byTerm.set(key, []);
    byTerm.get(key).push(unit);
  }
  return [...byTerm.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([termId, units], index) => ({ termNo: index + 1, units }));
}
function yearPlanWeekRows(units, weekTotal) {
  const base = Math.floor(weekTotal / units.length);
  const extra = weekTotal - base * units.length;
  let start = 1;
  return units.map((unit, index) => {
    const span = base + (index < extra ? 1 : 0);
    const row = { unit, from: start, to: start + span - 1 };
    start += span;
    return row;
  });
}
function renderYearPlan() {
  if (!isPrereqUnit) return navigate("overview");
  const isReadiness = placementExam?.kind === "readiness";
  const checkLabel = isReadiness ? "Readiness check" : "Placement exam";
  const terms = yearPlanTerms();
  const allUnits = terms.flatMap((term) => term.units);
  const totalWords = allUnits.reduce((sum, unit) => sum + (Number(unit.vocabularyCount) || 0), 0);
  const finalQuiz = manifest.finalAssessment;
  const rhythm = [
    ["Day 1", "Words", "Meet the unit's new words with the word cards, and listen to each one."],
    ["Day 2", "Reading", "Read one story with its narration, then answer its comprehension questions."],
    ["Day 3", "Grammar", "Work through two grammar lessons, said aloud and practised with examples."],
    ["Day 4", "Speak & write", "Do two speaking tasks and two writing tasks from the unit."],
    ["Day 5", "Play & check", "Play the unit games, try the quiz, and join the live session when one is scheduled."],
  ];
  const termTable = (term) => {
    const cal = calendarTerm(term.termNo);
    const weekTotal = termWeekTotal(term.termNo);
    const rows = yearPlanWeekRows(term.units, weekTotal);
    const isFirstTerm = term.termNo === 1;
    const isLastTerm = term.termNo === terms.length;
    // Week numbers carry their real week-commencing dates, and the half-term
    // break is drawn as its own row at its calendar position.
    const weekLabel = (row) => {
      const range = row.from === row.to ? `Week ${row.from}` : `Weeks ${row.from}–${row.to}`;
      if (!cal) return range;
      return `${range}<br><small>${formatDay(cal.weeks[row.from - 1])} – ${formatDay(new Date(cal.weeks[row.to - 1].getTime() + 4 * 24 * 3600 * 1000))}</small>`;
    };
    // The column is "Words in the unit", not "New words". manifest
    // vocabularyCount is every dictionaryLink, and most of those are the story
    // glossary rather than words the unit teaches (see STORY_GLOSSARY_GROUP) —
    // at Grade 8 Unit 1 it is 423 against 31 taught. This page reads the
    // manifest and never opens a unit, so it cannot split the two; the unit
    // Study Plan can and does. Naming the column honestly is what keeps the two
    // pages from contradicting each other over the same unit.
    const rowsHtml = rows.map((row) => {
      const unitRow = `<tr><td>${weekLabel(row)}</td><td><strong>Unit ${row.unit.number}: ${escapeHtml(row.unit.title)}</strong></td><td>${Number(row.unit.vocabularyCount) || "—"}</td></tr>`;
      const breakHere = cal && cal.halfIndex !== null && row.from <= cal.halfIndex && cal.halfIndex <= row.to && (row === rows[rows.length - 1] || cal.halfIndex < rows[rows.indexOf(row) + 1].from);
      return unitRow + (breakHere ? halfTermRow(term.termNo, 3) : "");
    }).join("");
    return `<section class="panel">
      <span class="eyebrow">Term ${term.termNo}${cal ? ` · ${termDatesLabel(term.termNo)}` : ""}</span>
      <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Weeks</th><th>Unit</th><th>Words in the unit</th></tr></thead><tbody>
        ${isFirstTerm ? `<tr><td>Week 1${cal ? `<br><small>from ${formatDay(cal.weeks[0])}</small>` : ""}</td><td><strong>${checkLabel}</strong> — finds your starting point before Unit ${defaultUnit}; it is never a fail</td><td>—</td></tr>` : ""}
        ${rowsHtml}
        ${isLastTerm && finalQuiz ? `<tr><td>Week ${weekTotal}${cal ? `<br><small>from ${formatDay(cal.weeks[weekTotal - 1])}</small>` : ""}</td><td><strong>${escapeHtml(finalQuiz.title || "Final course quiz")}</strong> — ${finalQuiz.questionCount} questions, mastery at ${finalQuiz.passPercent}%</td><td>—</td></tr>` : ""}
      </tbody></table></div>
    </section>`;
  };
  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · Prerequisite unit`,
    `${gradeLabel} English Study Plan`,
    `Your ${SCHOOL_CALENDAR.yearLabel} year at a glance: ${terms.length} terms, ${allUnits.length} units, and where each one falls. The dates follow the school calendar, half terms included.`,
    "Grade Study Plan",
  )}
    <div class="final-quiz-intro">
      <section class="panel">
        <div class="final-quiz-facts"><span><strong>${SCHOOL_CALENDAR.yearLabel}</strong> school year</span><span><strong>${allUnits.length}</strong> units</span><span><strong>${totalWords}</strong> words in all</span><span><strong>${terms.length}</strong> terms</span><span><strong>5</strong> short sessions a week</span></div>
        ${isReadiness && gradeNumber === 1 ? `<p>If the readiness check finds the letters are still new, it opens the Alphabet &amp; Sounds review programme for you — six extra weeks on letters and sounds, alongside or ahead of Unit 1.</p>` : ""}
      </section>
      ${terms.map(termTable).join("")}
      <section class="panel"><h3>The weekly rhythm</h3><p>Every unit runs on the same five-day pattern, so you always know what kind of work today brings.</p><ol class="path-list">
        ${rhythm.map(([day, name, what]) => `<li>${icon("circle-check-big")}<span><strong>${day} · ${name}:</strong> ${what}</span></li>`).join("")}
      </ol></section>
      <div class="audio-actions"><button class="button gold" data-go="placement" type="button">${isReadiness ? "Start the readiness check" : "Start the placement exam"} ${icon("arrow-right")}</button><a class="button secondary" href="${courseLocation(defaultUnit)}">Open Unit ${defaultUnit} ${icon("arrow-right")}</a></div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  icons();
}

// ===================== unit study plan (every grade) =========================
// The unit-level companion to the grade Study Plan above: the year plan
// says WHERE each unit falls; this page says what the learner does on each day
// of the weeks they are inside it. Drawn entirely from the loaded unit's own
// data — word group, reading, grammar, speaking and writing titles are read,
// not restated — so it can never disagree with the unit it plans. The unit's
// week span comes from the same yearPlanTerms()/yearPlanWeekRows() the grade
// plan draws, so the two pages always agree about the calendar.
function unitPlanWeekSpan() {
  for (const term of yearPlanTerms()) {
    const row = yearPlanWeekRows(term.units, termWeekTotal(term.termNo)).find((entry) => Number(entry.unit.number) === unitNumber);
    if (row) return { termNo: term.termNo, from: row.from, to: row.to, cal: calendarTerm(term.termNo) };
  }
  // Unit 0, reached through a review door: not in the year's terms, so it has
  // no calendar slot — it runs alongside the regular units for six weeks.
  return null;
}
// Even shares, remainder to the earlier weeks — one array of items per week.
function spreadAcrossWeeks(items, weeks) {
  const list = items || [];
  const base = Math.floor(list.length / weeks);
  const extra = list.length % weeks;
  let start = 0;
  return Array.from({ length: weeks }, (_, index) => {
    const size = base + (index < extra ? 1 : 0);
    const slice = list.slice(start, start + size);
    start += size;
    return slice;
  });
}
function renderUnitStudyPlan() {
  const span = unitPlanWeekSpan();
  const weekCount = span ? span.to - span.from + 1 : Math.max(3, (course.readings || []).length);
  const titlesOf = (items) => items.map((item) => item.title).filter(Boolean).map((title) => escapeHtml(title)).join(" · ");
  // Speaking, writing and activities carry formulaic titles ("Speaking 1 —
  // Listen and point"), so the plan names them by number range instead; words,
  // readings and grammar have real titles worth printing.
  const rangeText = (slices, weekIndex, word) => {
    const before = slices.slice(0, weekIndex).reduce((sum, slice) => sum + slice.length, 0);
    const count = slices[weekIndex].length;
    if (!count) return "";
    return count === 1 ? `${word} ${before + 1}` : `${word}s ${before + 1}–${before + count}`;
  };
  // Vocabulary is scheduled ALL IN WEEK 1 rather than a group per week, because
  // Vocabulary is one step in SECTION_CHAIN and Reading sits directly behind it:
  // whatever this page says, the app opens Reading only once every taught word
  // is marked. A group-per-week plan therefore described a walk nobody could
  // take — Week 1 Day 2 sent the learner to a padlock and every day after it was
  // unreachable — and it read as chunking while doing none, because the chunks
  // were GROUPS and one group is most of the list. Grade 8 Unit 1 came out as
  // 31 words, then 392, then three weeks of "no new words this week".
  //
  // The story glossary is not scheduled at all: 79% of the unit's list is
  // reference (see STORY_GLOSSARY_GROUP), so the plan names it once as something
  // to look up rather than booking a week to "learn" 392 words in.
  //
  // The fallback mirrors taughtWords() exactly — a unit that is nothing but a
  // glossary schedules the whole list, because that is what its gate asks for.
  const newWordGroups = taughtGroups().length ? taughtGroups() : (course.vocabularyGroups || []);
  const wordsIn = (groups) => groups.reduce((sum, group) => sum + (group.vocabularyIds?.length || 0), 0);
  const newWordCount = wordsIn(newWordGroups);
  const storyWordCount = wordsIn(course.vocabularyGroups || []) - newWordCount;
  const readings = spreadAcrossWeeks(course.readings, weekCount);
  const grammar = spreadAcrossWeeks(course.grammar, weekCount);
  const speaking = spreadAcrossWeeks(course.speaking, weekCount);
  const writing = spreadAcrossWeeks(course.writing, weekCount);
  const activities = spreadAcrossWeeks(course.activities, weekCount);
  const lectureLabel = unitNumber === CAPSTONE_UNIT ? "the capstone launch" : "the video lesson";
  const dayLine = (name, what) => `<li>${icon("circle-check-big")}<span><strong>${name}:</strong> ${what}</span></li>`;
  const weekPanel = (weekIndex) => {
    const isFirst = weekIndex === 0;
    const isLast = weekIndex === weekCount - 1;
    const weekReadings = readings[weekIndex];
    const speakWrite = [
      speaking[weekIndex].length ? `Do speaking ${rangeText(speaking, weekIndex, "task")}` : "",
      writing[weekIndex].length ? `writing ${rangeText(writing, weekIndex, "task")}` : "",
    ].filter(Boolean).join(", then ");
    return `<section class="panel">
      <span class="eyebrow">${span ? `Week ${span.from + weekIndex} · Term ${span.termNo}${span.cal ? ` · week of ${formatDay(span.cal.weeks[span.from + weekIndex - 1])}${span.cal.halfIndex === span.from + weekIndex - 1 ? " (after half term)" : ""}` : ""}` : `Week ${weekIndex + 1} of the review programme`}</span>
      <ol class="path-list">
        ${dayLine("Day 1 · Words", isFirst
          ? `Start with ${lectureLabel}. Then meet all this unit's new words${newWordGroups.length ? ` — <strong>${titlesOf(newWordGroups)}</strong>` : ""} — and mark every one, which is what opens the reading.`
          : `Go back over your new words${storyWordCount ? ", and look up any story word you meet while you read" : ""}.`)}
        ${dayLine("Day 2 · Reading", weekReadings.length ? `Read <strong>${titlesOf(weekReadings)}</strong>, then answer ${weekReadings.length > 1 ? "their" : "its"} questions.` : "Read your favourite story from this unit again.")}
        ${dayLine("Day 3 · Grammar", grammar[weekIndex].length ? `${titlesOf(grammar[weekIndex])}.` : "Go back over the patterns you have learned.")}
        ${dayLine("Day 4 · Speak & write", speakWrite ? `${speakWrite}.` : "Practise saying and writing your favourite sentences.")}
        ${dayLine("Day 5 · Play & check", isLast ? "Play the games, take the quiz, hand in your assignment and fill in My progress." : `${activities[weekIndex].length ? `Do ${rangeText(activities, weekIndex, "activity").replace("activitys", "activities")}, and play` : "Play"} the games.`)}
      </ol>
    </section>`;
  };
  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · Unit ${course.unit.unitNo}`,
    `Your plan for ${escapeHtml(course.unit.unitTitle)}`,
    span
      ? `This unit takes ${weekCount} weeks — weeks ${span.from} to ${span.to} of Term ${span.termNo}${span.cal ? ` (${formatDay(span.cal.weeks[span.from - 1])} – ${formatDay(new Date(span.cal.weeks[span.to - 1].getTime() + 4 * 24 * 3600 * 1000))})` : ""}. Five short days a week; here is what each one brings.`
      : `This review programme runs for ${weekCount} weeks alongside your regular units. Five short days a week; here is what each one brings.`,
    "Unit Study Plan",
  )}
    <div class="final-quiz-intro">
      <section class="panel">
        <div class="final-quiz-facts"><span><strong>${weekCount}</strong> weeks</span>${newWordCount ? `<span><strong>${newWordCount}</strong> new words</span>` : ""}${storyWordCount > 0 ? `<span><strong>${storyWordCount}</strong> story words to look up</span>` : ""}<span><strong>${(course.readings || []).length}</strong> readings</span><span><strong>${(course.grammar || []).length}</strong> grammar lessons</span></div>
      </section>
      ${Array.from({ length: weekCount }, (_, index) => weekPanel(index)).join("")}
      <div class="audio-actions"><button class="button gold" data-go="lecture" type="button">Start with ${lectureLabel} ${icon("arrow-right")}</button><button class="button secondary" data-go="overview" type="button">Back to the overview</button></div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  icons();
}

function renderPlacementExam() {
  if (!isPrereqUnit) return navigate("overview");
  if (placementProgress.submitted) return renderPlacementResults(calculatePlacementResults());
  const hasStarted = Object.keys(placementProgress.answers).length > 0 || placementProgress.startedAt;
  if (!hasStarted) {
    placementProgress.startedAt = new Date().toISOString();
    placementProgress.currentIndex = 0;
    savePlacementProgress();
    placementIndex = 0;
    drawPlacementQuestion();
    return;
  }
  placementIndex = Math.min(placementProgress.currentIndex || 0, placementExam.questions.length - 1);
  drawPlacementQuestion();
}

function drawPlacementQuestion() {
  const question = placementExam.questions[placementIndex];
  if (!question) return finalizePlacement();
  const section = placementExam.sections.find((item) => item.sectionId === question.sectionId);
  const savedAnswer = placementProgress.answers[question.questionId];
  const options = question.options.split(" | ");
  const sectionQuestionNumber = placementExam.questions.filter((item) => item.sectionId === question.sectionId && item.sequence <= question.sequence).length;
  const sourceNote = question.sourceGrade ? `From Grade ${question.sourceGrade}${question.sourceUnitNo ? ` · Unit ${question.sourceUnitNo}` : ""}` : "Getting-ready skills";
  $("#app").innerHTML = `${pageHeader(`Section ${section.sequence} of ${placementExam.sections.length}`, section.title, section.description, `Question ${placementIndex + 1} of ${placementExam.questionCount}`)}
    <section class="panel quiz-shell final-quiz-shell">
      <div class="quiz-top"><span>${sectionQuestionNumber} of ${section.questionCount} in this section</span><strong>${Object.keys(placementProgress.answers).length} answers saved</strong></div>
      <div class="progress-track"><span style="width:${(placementIndex / placementExam.questionCount) * 100}%"></span></div>
      <div class="final-question-meta"><span>${escapeHtml(sourceNote)}</span></div>
      <h2 class="quiz-question">${escapeHtml(question.question)}</h2>
      <div class="quiz-options">${options.map((option) => {
        const isSelected = savedAnswer?.selected === option;
        const state = savedAnswer ? (option === question.correctAnswer ? "correct" : isSelected ? "wrong" : "") : "";
        return `<button class="quiz-option ${state}" data-placement-option="${escapeHtml(option)}" type="button" ${savedAnswer ? "disabled" : ""}>${escapeHtml(option)}</button>`;
      }).join("")}</div>
      <div id="placement-feedback" role="status" aria-live="polite" aria-atomic="true">${savedAnswer ? `<p class="feedback ${savedAnswer.correct ? "good" : "try"}"><span class="status-note">${savedAnswer.correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(question.explanation)}</p>` : ""}</div>
      <div class="final-quiz-actions"><span>${icon("save")} Answers save on this device</span><button class="button primary" id="next-placement-question" type="button" ${savedAnswer ? "" : "hidden"}>${placementIndex === placementExam.questionCount - 1 ? "Finish and see my report" : "Next question"} ${icon("arrow-right")}</button></div>
    </section>`;
  $$('[data-placement-option]').forEach((button) => button.addEventListener("click", () => {
    if (placementProgress.answers[question.questionId]) return;
    const selected = button.dataset.placementOption;
    placementProgress.answers[question.questionId] = { selected, correct: selected === question.correctAnswer, answeredAt: new Date().toISOString() };
    placementProgress.currentIndex = placementIndex;
    savePlacementProgress();
    drawPlacementQuestion();
  }));
  if (savedAnswer) $("#next-placement-question").addEventListener("click", () => {
    if (placementIndex >= placementExam.questionCount - 1) return finalizePlacement();
    placementIndex += 1;
    placementProgress.currentIndex = placementIndex;
    savePlacementProgress();
    drawPlacementQuestion();
  });
  icons();
}

function renderPlacementResults(results) {
  const banding = placementExam.banding || {};
  const bandInfo = banding[results.band] || {};
  const minSectionPercent = banding.ready?.minSectionPercent ?? 60;
  const weakSections = results.sectionScores.filter((item) => item.percent < minSectionPercent);
  const reviewSections = weakSections.length ? weakSections : results.sectionScores.filter((item) => item.percent < (banding.ready?.minOverallPercent ?? 80));
  const recommendation = banding.notReady?.recommendation;
  const heroActions = results.band === "notReady"
    ? `<div class="audio-actions">${recommendation ? `<a class="button gold" href="${recommendation.href ? new URL(recommendation.href, location.href).href : placementLocation(recommendation.grade)}">${icon("sprout")} Start ${escapeHtml(recommendation.label || "the recommended course")}</a>` : ""}<button class="button secondary" id="retry-placement" type="button">${icon("rotate-ccw")} Try again</button><a class="button secondary" href="${courseLocation(defaultUnit)}">My teacher says continue to ${gradeLabel} ${icon("arrow-right")}</a></div>`
    : `<div class="audio-actions"><a class="button gold" href="${courseLocation(defaultUnit)}">Start ${gradeLabel}, Unit ${defaultUnit} ${icon("arrow-right")}</a><button class="button secondary" id="retry-placement" type="button">${icon("rotate-ccw")} Try again</button></div>`;
  $("#app").innerHTML = `${pageHeader("Your placement report", bandInfo.label || "Placement report", placementExam.title, `${results.percent}% overall`)}
    <div class="final-results-layout">
      <section class="panel final-result-summary"><div class="score-ring">${results.score}/${results.total}</div><span class="eyebrow">${results.percent}% overall</span><h2>${escapeHtml(bandInfo.label || "Your report is ready")}</h2><p>${escapeHtml(bandInfo.message || "Here is how you did in each section.")}</p>${heroActions}</section>
      <section class="panel"><h2>Section scores</h2><div class="result-bars">${results.sectionScores.map((item) => `<div class="result-bar"><div><strong>${escapeHtml(item.label)}</strong><span>${item.score}/${item.total}</span></div><div class="progress-track"><span style="width:${item.percent}%"></span></div></div>`).join("")}</div></section>
      <section class="panel"><h2>Skills report</h2><div class="skill-score-grid">${results.areaScores.map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${item.percent}%</strong><small>${item.score} of ${item.total}</small></div>`).join("")}</div></section>
      <section class="panel"><h2>${reviewSections.length ? "Your review plan" : "Every section is secure"}</h2>${reviewSections.length
        ? `<p>These lessons rebuild exactly what each section tests. Do them in order, then try the exam again.</p><div class="review-list">${reviewSections.flatMap((item) => (item.remediation || []).map((entry) => `<a href="${remediationHref(entry)}"><span><strong>${escapeHtml(remediationLabel(entry))}</strong><small>Rebuilds: ${escapeHtml(item.label)} (${item.percent}%)</small></span>${icon("arrow-up-right")}</a>`)).join("")}</div>`
        : `<p>You met the target in every section. ${gradeLabel} is the right place for you.</p>`}
      </section>
      <section class="panel"><h2>Need help understanding your report?</h2><p>Wehel Tutor can explain any question you found hard — open it with the <strong>Wehel Tutor</strong> button in the corner of any page. A grown-up or teacher can help you choose your path.</p></section>
    </div>`;
  $("#retry-placement")?.addEventListener("click", () => {
    placementProgress.answers = {};
    placementProgress.currentIndex = 0;
    placementProgress.completed = false;
    placementProgress.band = null;
    placementProgress.submitted = false;
    placementProgress.startedAt = null;
    savePlacementProgress();
    placementIndex = 0;
    renderPlacementExam();
  });
  icons();
}

function renderPrereqTeacher() {
  const latest = placementProgress.attempts[placementProgress.attempts.length - 1];
  const bandLabel = (band) => (placementExam.banding?.[band]?.label) || band || "—";
  $("#app").innerHTML = `${pageHeader("Teacher view", `${gradeLabel} placement exam`, "Placement evidence for entry to this grade, with per-section remediation guidance.", "Placement diagnostics")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Purpose</h2><p>The prerequisite unit measures readiness for ${escapeHtml(cambridgeLabel(gradeNumber))}. Bands are advisory: a teacher or parent can override the recommendation. Thresholds live in placement-exam.json.</p></section>
      ${latest ? `<section class="panel"><h2>Latest attempt</h2><div class="teacher-assessment-summary"><div><strong>${latest.percent}%</strong><span>${latest.score}/${latest.total} marks</span></div><div><strong>${escapeHtml(bandLabel(latest.band))}</strong><span>Attempt ${latest.attempt} of ${placementProgress.attempts.length}</span></div><div><strong>${new Date(latest.submittedAt).toLocaleDateString()}</strong><span>Latest submission</span></div></div>
      <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Section</th><th>Score</th><th>Percent</th><th>Teaching response</th></tr></thead><tbody>${latest.sectionScores.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.score}/${item.total}</td><td>${item.percent}%</td><td>${item.percent >= (placementExam.banding?.ready?.minSectionPercent ?? 60) ? "Secure for entry." : "Re-teach via the section's linked review units before or alongside Unit 1."}</td></tr>`).join("")}</tbody></table></div></section>` : `<section class="panel"><h2>No attempt yet</h2><p>No submitted attempt is stored on this device. The exam holds ${placementExam.questionCount} questions across ${placementExam.sections.length} sections and reports one of three bands: Ready, Ready with review, or a recommendation to start from ${escapeHtml(placementExam.banding?.notReady?.recommendation?.label || "an earlier course")}.</p></section>`}
    </div>`;
}


function unitVocabulary() {
  return course.dictionaryLinks.map((link) => ({ link, entry: dictionary.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId) })).filter((item) => item.entry);
}

function findVocabulary(text) {
  const lower = text.toLowerCase();
  return unitVocabulary().find(({ entry }) => lower.includes(entry.displayWord.toLowerCase()));
}

function rememberNeed(need) {
  if (!aiState.needs.includes(need)) aiState.needs.push(need);
  aiState.needs = aiState.needs.slice(-5);
}

function teacherLesson() {
  const words = unitVocabulary().slice(0, 3).map(({ entry }) => entry.displayWord);
  return `Today we are learning ${course.unit.unitTitle}. First, say these words with me: ${words.join(", ")}. Next, we will read “${course.readings[0].title}”. Then we will practise ${course.grammar[0].title}. At the end, tell me one new thing you learned. Which word would you like to start with?`;
}

function writingFeedback(text) {
  const work = text.replace(/^(check|please check|can you check)( my work)?[:\s-]*/i, "").trim();
  if (work.split(/\s+/).length < 3) {
    rememberNeed("writing detail");
    return "Write one complete sentence for me. Try: My name is ____. I like ____. Then I will help you improve it.";
  }
  const notes = [];
  if (!/^[A-Z]/.test(work)) notes.push("Start with a capital letter");
  if (!/[.!?]$/.test(work)) notes.push("finish with a full stop or question mark");
  if (!/\b(is|am|are|like|likes|have|has|can)\b/i.test(work)) notes.push("check that your sentence has an action or linking word");
  if (!notes.length) return `Good checking. “${work}” is a complete sentence. Now add one describing detail or a reason with “because”.`;
  rememberNeed("sentence checking");
  return `You have a useful idea. Improve it in this order: ${notes.join("; ")}. Try the sentence again, and I will check your new version.`;
}

function buildAIReply(message, mode) {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (/\b(give|tell|show)\b.*\b(answer|answers)\b|what is the answer|do my quiz/i.test(lower)) {
    rememberNeed("independent quiz thinking");
    return "I will help you think, but I will not choose a quiz answer for you. Read the question, cross out one answer that does not fit, and tell me which two choices you are considering. I will give you a hint.";
  }
  if (mode === "check") return writingFeedback(text);
  const vocabulary = findVocabulary(text);
  if (vocabulary) {
    const { entry, link } = vocabulary;
    if (!aiState.practiceWords.includes(entry.displayWord)) aiState.practiceWords.push(entry.displayWord);
    return `${entry.displayWord} is a ${entry.partOfSpeech}. It means: ${link.childMeaning || entry.canonicalMeaning}. Example: ${link.exampleSentence}. Now make your own short sentence with ${entry.displayWord}.`;
  }
  if (mode === "teach") return teacherLesson();
  if (mode === "speaking") {
    const task = course.speaking[aiState.interactions % course.speaking.length];
    return `Let us practise speaking. ${task.instructionsAndModelLines.split("\n").slice(0, 3).join(" ")} Speak slowly, use a complete sentence, and listen to your recording. Then tell me one part you want to improve.`;
  }
  if (mode === "practice") {
    const item = unitVocabulary()[aiState.interactions % unitVocabulary().length];
    return `Word challenge: ${item.entry.displayWord}. Say the word, spell it, and explain it in your own words. Then use it in a sentence. I will check your attempt before showing the model.`;
  }
  if (mode === "progress") {
    const completed = progress.completed.filter((item) => !["overview", "live"].includes(item)).length;
    const needs = aiState.needs.length ? aiState.needs.join(", ") : "no repeated difficulty yet";
    return `You have completed ${completed} learning sections and marked ${progress.knownWords.length} words as known. We have practised ${aiState.practiceWords.length} words together. Your current support areas are: ${needs}. A good next step is ${completed < 3 ? "the teacher lesson and vocabulary" : "one reading question and one complete sentence"}.`;
  }
  if (/read|story|poem/.test(lower)) return `Open “${course.readings[0].title}”. Read the first part slowly. Tell me who or what it is about, then find one detail that supports your answer. I will help with any hard word.`;
  if (/grammar|he|she|like|likes|sentence/.test(lower)) return `${course.grammar[0].title}: ${course.grammar[0].explanation.split("\n")[0]} Try one example of your own. I will give a hint before I correct it.`;
  if (/write|writing|check/.test(lower)) return writingFeedback(text);
  return `I am using ${gradeLabel} Unit ${course.unit.unitNo}: ${course.unit.unitTitle}. Ask me about a unit word, the story, grammar, speaking, or your writing. You can also choose a mode above for guided practice.`;
}


function currentSpeakingTask() {
  const index = Number(aiState.speakingTaskIndex || 0) % course.speaking.length;
  return course.speaking[index];
}

function speakingModelText(task) {
  const script = String(task.instructionsAndModelLines || "");
  const quoted = [...script.matchAll(/[“"]([^”"]{3,})[”"]/g)].map((match) => match[1].trim());
  if (quoted.length) return quoted.slice(0, 3).join(" ");
  return script.split("\n").map((line) => line.trim()).filter((line) => line && !/^(get ready|record|check:|did you)/i.test(line)).slice(0, 2).join(" ");
}

function speechWords(value) {
  return String(value || "").toLowerCase().replace(/[_]+/g, " ").replace(/[^a-z'\s]/g, " ").split(/\s+/).filter((word) => word.length > 1);
}

function evaluatePronunciation(target, transcript) {
  const expected = [...new Set(speechWords(target))];
  const heard = new Set(speechWords(transcript));
  const matched = expected.filter((word) => heard.has(word));
  const missing = expected.filter((word) => !heard.has(word));
  const score = expected.length ? Math.round((matched.length / expected.length) * 100) : 0;
  const rating = score >= 85 ? "Clear and confident" : score >= 65 ? "Good progress" : "Practise once more";
  const guidance = score >= 85
    ? "Your key words were recognised clearly. Repeat once with smooth expression."
    : score >= 65
      ? `Say ${missing.slice(0, 3).join(", ")} more slowly, then record again.`
      : "Listen to the model again. Say one short phrase at a time and keep your voice close to the microphone.";
  return { score, rating, guidance, transcript, matched, missing };
}

function pronunciationFeedbackHtml(feedback) {
  if (!feedback) return "";
  const words = feedback.missing.length
    ? `<div class="phonetic-words"><span>Practise:</span>${feedback.missing.slice(0, 5).map((word) => `<strong>${escapeHtml(word)}</strong>`).join("")}</div>`
    : `<div class="phonetic-words success"><span>Key words:</span><span class="status-note">Recognised clearly</span></div>`;
  return `<section class="pronunciation-result"><div class="pronunciation-score"><strong>${feedback.score}%</strong><span>${escapeHtml(feedback.rating)}</span></div><div><p><span class="field-label">We heard:</span> ${escapeHtml(feedback.transcript || "No clear words detected")}</p><p>${escapeHtml(feedback.guidance)}</p>${words}</div></section>`;
}

function blobAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function submitSpeakingRecording(recordingId, target, button, { feedbackSelector = "#ai-speaking-feedback", onFeedback = null } = {}) {
  const recording = recordings.get(recordingId);
  const review = speakingReviewState.get(recordingId);
  if (!recording) return toast("Record your voice first.");
  if (!review?.listened) return toast("Listen to your full recording before submitting it.");
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Checking pronunciation`;
  button.classList.add("loading");
  icons();
  try {
    const audioBase64 = await blobAsBase64(recording.blob);
    const response = await fetch(AI_STT_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: platformHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
      body: JSON.stringify({ audioBase64, mimeType: recording.blob.type || "audio/webm", purpose: "ehel_english" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.text) throw new Error(result.message || "No clear speech was detected.");
    review.feedback = evaluatePronunciation(target, result.text);
    if (review.feedback.score < 65) rememberNeed("clear pronunciation");
    speakingReviewState.set(recordingId, review);
    const feedbackTarget = $(feedbackSelector);
    if (feedbackTarget) feedbackTarget.innerHTML = pronunciationFeedbackHtml(review.feedback);
    if (onFeedback) onFeedback(review.feedback);
  } catch (error) {
    toast(error.message || "Pronunciation checking is unavailable. Please try again.");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
    button.classList.remove("loading");
    icons();
  }
}

// Proofread a word-sentence or a writing draft through Wehel's own "check"
// mode, rather than a separate feedback pipeline. subjectNotes.english in
// wehel_prompt.json already carries the pedagogy for this — celebrate ideas
// first, polish second; recast an error instead of correcting it head-on — so
// reusing askWehel means a change to how corrections are phrased only has to
// be made once, in the tutor's own prompt, and stays consistent with what the
// same learner sees if they ask Wehel directly. One retry on a transient
// failure mirrors the dock's own submit(): a dropped connection is far more
// likely than a real outage, and a canned "try again" is a worse reply than a
// two-second wait would have been.
// `target` is a resolved element, not a selector — the classic half and the
// deck half of a BOTH_DESIGNS page both paint at once and each carries its
// own feedback container, so the caller must resolve it with ITS OWN scoped
// helper (classicScope()'s $, or a carousel's inDeck()) rather than this
// function reaching into the whole document and risking the other half's.
async function checkWritingWithWehel(prompt, button, target) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle")} Checking`;
  button.classList.add("loading");
  icons();
  const ask = () => askWehel({ meta: wehelOptions().meta, messages: [{ role: "user", text: prompt }], mode: "check" });
  try {
    let reply;
    try {
      reply = await ask();
    } catch (firstError) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      reply = await ask();
    }
    if (target) target.innerHTML = `<p class="feedback good">${escapeHtml(reply)}</p>`;
  } catch (error) {
    if (target) target.innerHTML = `<p class="feedback try">I cannot reach my thinking engine right now. Please try again in a moment.</p>`;
  } finally {
    button.disabled = false;
    button.innerHTML = original;
    button.classList.remove("loading");
    icons();
  }
}

// The shell's floating dock mounts the SHARED Wehel panel, while this course
// keeps its own mode-tabbed page. Both read and write aiState.messages, so the
// drawer and the page are one conversation — a question asked in the drawer is
// still there when the learner opens the full tutor page.
function wehelOptions() {
  return {
    meta: {
      subject: "english", subjectLabel: "English", grade: gradeNumber,
      cambridgeCode: cambridgeLabel(gradeNumber),
      unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle,
      courseOutline: outlineFromManifest(manifest), unit: course,
      // What the Focus control offers: the unit's teaching pages, from the same
      // filter the nav uses. Read by the shared panel the shell's dock mounts;
      // this course's own tutor page has its own mode tabs and no picker, but
      // it honours the same setting (see the askWehel call below).
      // "reflect" is this course's progress report, not a module — it cannot be
      // dropped by the shared list, where the same id is Global Perspectives'
      // real Reflection teaching.
      modules: modulesFromSections(visibleSections().filter(([id]) => id !== "reflect")),
    },
    store: aiState,
    key: "messages",
    ui: { escapeHtml, toast },
    tutorLabel: "Wehel Tutor",
    greeting: `Hello! I am Wehel Tutor. Ask me anything about Unit ${course.unit.unitNo}: ${course.unit.unitTitle}.`,
    placeholder: `Ask about ${course.unit.unitTitle}…`,
    quickPrompts: [
      { label: "Explain this", message: "Can you explain what is on this page in a simpler way?" },
      { label: "Teach me words", message: "Teach me three words from this unit." },
      { label: "Quiz me", message: "Quiz me on this unit, one question at a time." },
      { label: "Check my sentence", message: "I will write a sentence. Please help me make it better." },
    ],
    mode: aiState.mode,
    fallbackReply: (message) => buildAIReply(message, aiState.mode),
    fetchUnit: unitFetcher(manifest, dataRootUrl),
    onSaved: () => saveAIState(),
  };
}

// Focus can be changed from the shell's drawer as well as from this page's own
// picker, and this page is not one of the panels syncPanels repaints. Registered
// once at module scope; `route` is read at call time, so a change made from the
// drawer over some other section repaints nothing here until the learner is
// actually on the tutor page.



function ebookAsset(book, filename) {
  const asset = new URL(`./ebooks/${book.id}/${filename}`, document.baseURI);
  if (/\.(?:webp|png|jpe?g)$/i.test(filename)) asset.searchParams.set("v", "illustration-crop-20260715b");
  return asset.href;
}

function openEbookReadAloud(book) {
  const readerWindow = window.open("", "_blank", "popup=yes,width=1100,height=860,resizable=yes,scrollbars=yes");
  if (!readerWindow) {
    toast("Allow pop-ups to open the eBook read-aloud window.");
    return;
  }

  const firstPage = book.pages[0];
  readerWindow.document.open();
  readerWindow.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(book.title)} | Ehel Academy Read-Aloud</title>
      <style>
        :root { color-scheme: light; --ink:#17324d; --teal:#0f766e; --gold:#f4c95d; --coral:#e76f51; --line:#dce4ea; --muted:#64748b; }
        * { box-sizing:border-box; }
        body { margin:0; color:var(--ink); background:#eef3f5; font-family:Inter,Aptos,"Segoe UI",sans-serif; letter-spacing:0; }
        button,audio { font:inherit; }
        button:focus-visible,audio:focus-visible { outline:3px solid rgba(45,108,223,.35); outline-offset:2px; }
        header { min-height:82px; display:flex; align-items:center; justify-content:space-between; gap:18px; padding:16px 24px; border-bottom:1px solid var(--line); background:white; }
        header div { min-width:0; }
        header span { color:var(--teal); font-size:12px; font-weight:800; text-transform:uppercase; }
        h1 { margin:4px 0 0; font:700 31px/1.1 Georgia,serif; letter-spacing:0; }
        .status { flex:none; padding:8px 11px; border-radius:99px; color:#0b5f59; background:#dff3ef; font-size:12px; font-weight:800; }
        main { width:min(1050px,100%); margin:0 auto; padding:22px; }
        .reader { overflow:hidden; border:1px solid #cbd7df; border-radius:8px; background:white; box-shadow:0 10px 30px rgba(23,50,77,.09); }
        .progress { height:7px; background:#dbe4e9; }
        .progress span { display:block; height:100%; background:var(--coral); transition:width .25s ease; }
        .toolbar { min-height:64px; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px 18px; background:#f7fafb; }
        .toolbar strong { font-size:14px; }
        audio { width:min(460px,60vw); height:42px; }
        figure { margin:0; padding:18px 18px 0; background:#eef3f5; }
        figure img { width:100%; max-height:600px; display:block; object-fit:contain; background:white; box-shadow:0 8px 24px rgba(23,50,77,.12); }
        .copy { margin:0 18px; padding:20px clamp(20px,5vw,48px); border:1px solid var(--line); border-top:0; background:#fffdf7; }
        .copy span { color:var(--teal); font-size:11px; font-weight:850; text-transform:uppercase; }
        .copy p { margin:7px 0 0; font:700 clamp(21px,3vw,29px)/1.5 Georgia,serif; letter-spacing:0; }
        .rd-line { padding:2px 4px; margin:0 -4px; border-radius:4px; transition:background-color .2s ease, color .2s ease; }
        .rd-line.is-narrating { color:#0b3a35; background:var(--gold); box-shadow:0 0 0 2px var(--gold); }
        @media (prefers-reduced-motion:reduce) { .rd-line { transition:none; } }
        .controls { min-height:72px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; padding:14px 18px; border-top:1px solid var(--line); }
        .controls button,.start { min-height:42px; padding:9px 15px; border:1px solid var(--line); border-radius:6px; color:var(--ink); background:white; font-weight:750; cursor:pointer; }
        .controls button:first-child { justify-self:start; }
        .controls button:last-child { justify-self:end; }
        .start { color:white; border-color:var(--teal); background:var(--teal); }
        .start[hidden] { display:none; }
        footer { padding:16px 22px; color:#41566a; background:#e5ecef; font-size:12px; line-height:1.5; }
        footer p { margin:5px 0 0; }
        @media (max-width:680px) {
          header { align-items:flex-start; flex-direction:column; padding:14px 16px; }
          main { padding:10px; }
          .toolbar { align-items:flex-start; flex-direction:column; }
          audio { width:100%; }
          figure { padding:10px 10px 0; }
          .copy { margin:0 10px; padding:18px; }
          .controls { grid-template-columns:1fr 1fr; }
          .controls .start { grid-column:1/-1; grid-row:1; }
        }
      </style>
    </head>
    <body>
      <header><div><span>${escapeHtml(book.level)} · Ehel Academy read-aloud</span><h1>${escapeHtml(book.title)}</h1></div><div class="status" id="reader-status" role="status" aria-live="polite">Preparing ElevenLabs voice</div></header>
      <main><article class="reader" aria-label="${escapeHtml(book.title)}">
        <div class="progress" role="progressbar" aria-label="Book progress" aria-valuemin="1" aria-valuemax="${book.pages.length}" aria-valuenow="1"><span></span></div>
        <div class="toolbar"><strong id="page-count">Page 1 of ${book.pages.length}</strong><audio id="reader-audio" controls preload="auto" aria-label="ElevenLabs book narration"></audio></div>
        <figure><img id="page-image" src="${ebookAsset(book, firstPage.image)}" alt="${escapeHtml(firstPage.alt)}"></figure>
        <section class="copy"><span>Read along</span><p id="page-text">${readingLinesHtml(firstPage.text)}</p></section>
        <div class="controls"><button id="previous-page" type="button" disabled>← Previous page</button><button class="start" id="start-audio" type="button" hidden>▶ Start narration</button><button id="next-page" type="button">Next page →</button></div>
        <footer><strong>Book credit</strong><p>${escapeHtml(book.attribution)}</p></footer>
      </article></main>
    </body>
    </html>`);
  readerWindow.document.close();

  const readerDocument = readerWindow.document;
  const audio = readerDocument.querySelector("#reader-audio");
  const status = readerDocument.querySelector("#reader-status");
  const startButton = readerDocument.querySelector("#start-audio");
  let pageIndex = 0;
  let playbackToken = 0;

  // Read-along in the popup. It cannot reuse narrationSync — that tracks the
  // app document's players and these elements live in another window — but it
  // is the same estimate: a line's share of the page's characters is its share
  // of the clip. One page is one clip here, so there are no chunk ranges.
  let readerLines = [];
  audio.addEventListener("timeupdate", () => {
    const duration = audio.duration;
    if (!readerLines.length || !Number.isFinite(duration) || duration <= 0) return;
    const total = readerLines.reduce((sum, line) => sum + line.chars, 0);
    const position = Math.min(Math.max(audio.currentTime / duration, 0), 1) * total;
    let running = 0;
    let active = readerLines.length - 1;
    for (let index = 0; index < readerLines.length; index += 1) {
      running += readerLines[index].chars;
      if (position < running) { active = index; break; }
    }
    readerLines.forEach((line, index) => line.el.classList.toggle("is-narrating", index === active));
  });

  const drawPage = () => {
    const page = book.pages[pageIndex];
    readerDocument.querySelector("#page-image").src = ebookAsset(book, page.image);
    readerDocument.querySelector("#page-image").alt = page.alt;
    readerDocument.querySelector("#page-text").innerHTML = readingLinesHtml(page.text);
    readerLines = [...readerDocument.querySelectorAll("#page-text .rd-line")].map((el) => ({ el, chars: Math.max(1, el.textContent.length) }));
    readerDocument.querySelector("#page-count").textContent = `Page ${pageIndex + 1} of ${book.pages.length}`;
    const progressBar = readerDocument.querySelector(".progress");
    progressBar.setAttribute("aria-valuenow", String(pageIndex + 1));
    progressBar.querySelector("span").style.width = `${((pageIndex + 1) / book.pages.length) * 100}%`;
    readerDocument.querySelector("#previous-page").disabled = pageIndex === 0;
    readerDocument.querySelector("#next-page").disabled = pageIndex === book.pages.length - 1;
    readerWindow.document.title = `${book.title} · Page ${pageIndex + 1}`;
  };

  const waitForPlayback = async (source, token) => {
    audio.src = source;
    audio.playbackRate = AI_NARRATION_RATE;
    audio.defaultPlaybackRate = AI_NARRATION_RATE;
    const finished = new Promise((resolve) => {
      audio.addEventListener("ended", resolve, { once: true });
      audio.addEventListener("error", resolve, { once: true });
    });
    try {
      await audio.play();
    } catch {
      if (token !== playbackToken || readerWindow.closed) return;
      startButton.hidden = false;
      status.textContent = "Press Start narration";
      await new Promise((resolve) => {
        startButton.onclick = async () => {
          startButton.hidden = true;
          status.textContent = "Playing ElevenLabs voice";
          try { await audio.play(); } catch { status.textContent = "Press Play in the audio controls"; }
          resolve();
        };
      });
    }
    await finished;
  };

  const playFromPage = async (startIndex) => {
    const token = ++playbackToken;
    audio.pause();
    pageIndex = Math.max(0, Math.min(startIndex, book.pages.length - 1));
    for (; pageIndex < book.pages.length; pageIndex += 1) {
      if (token !== playbackToken || readerWindow.closed) return;
      drawPage();
      status.textContent = "Preparing ElevenLabs voice";
      try {
        const source = await aiVoiceUrl(book.pages[pageIndex].text);
        if (token !== playbackToken || readerWindow.closed) return;
        status.textContent = "Playing ElevenLabs voice";
        await waitForPlayback(source, token);
      } catch {
        status.textContent = "Narration is unavailable. Try again.";
        return;
      }
    }
    pageIndex = book.pages.length - 1;
    drawPage();
    status.textContent = "Book complete";
  };

  readerDocument.querySelector("#previous-page").addEventListener("click", () => playFromPage(pageIndex - 1));
  readerDocument.querySelector("#next-page").addEventListener("click", () => playFromPage(pageIndex + 1));
  readerWindow.addEventListener("beforeunload", () => { playbackToken += 1; audio.pause(); });
  drawPage();
  playFromPage(0);
}

// Same popup-window print approach as printReading above, but the on-screen
// reader only ever holds one page's markup at a time (activeEbookPage), so
// this builds all of the book's pages up front rather than printing whatever
// happens to be drawn. Each page gets its own printed sheet (page-break-after)
// the way a real picture book does — one page, one page.
function printBook(book) {
  const printWindow = window.open("", "_blank", "popup=yes,width=900,height=1000,resizable=yes,scrollbars=yes");
  if (!printWindow) {
    toast("Allow pop-ups to print this book.");
    return;
  }
  const pages = book.pages.map((page, index) => `
    <section class="print-page">
      <span class="print-page-number">Page ${index + 1} of ${book.pages.length}</span>
      <img src="${ebookAsset(book, page.image)}" alt="${escapeHtml(page.alt)}">
      <p>${escapeHtml(page.text)}</p>
    </section>`).join("");
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(book.title)} | Ehel Academy English</title>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 40px 48px; color: #17324d; background: white; font: 17px/1.75 Georgia, "Times New Roman", serif; }
        header { margin-bottom: 26px; padding-bottom: 16px; border-bottom: 2px solid #dce4ea; }
        header span { display: block; color: #0f766e; font: 700 12px/1.4 Arial, sans-serif; text-transform: uppercase; letter-spacing: .05em; }
        header h1 { margin: 6px 0 0; font-size: 30px; line-height: 1.15; }
        header p { margin: 8px 0 0; color: #64748b; font: 14px/1.4 Arial, sans-serif; }
        .print-page { page-break-after: always; }
        .print-page:last-child { page-break-after: auto; }
        .print-page-number { display: block; margin-bottom: 10px; color: #64748b; font: 700 12px/1.4 Arial, sans-serif; text-transform: uppercase; letter-spacing: .05em; }
        .print-page img { width: 100%; max-height: 60vh; display: block; margin: 0 0 16px; object-fit: contain; }
        .print-page p { margin: 0; font-weight: 700; }
        .print-footer { margin-top: 34px; padding-top: 14px; border-top: 1px solid #dce4ea; color: #64748b; font: 12px/1.4 Arial, sans-serif; }
        @page { margin: 18mm; }
      </style>
    </head>
    <body>
      <header><span>${escapeHtml(book.level)} · Independent reading library</span><h1>${escapeHtml(book.title)}</h1><p>${escapeHtml(book.description)}</p></header>
      ${pages}
      <div class="print-footer">${escapeHtml(book.attribution || "")} · Ehel Academy English</div>
    </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
  printWindow.addEventListener("afterprint", () => printWindow.close());
}

// "recommended for early readers" was hard-coded here while Grade 1 was the only
// shelf. It now reaches Grade 3, where telling an eight-year-old reading a
// twelve-page chapter story that she is an early reader is simply wrong — and it
// is the kind of wrong a learner notices about themselves. Derived from the
// book's own grades so a new shelf cannot inherit the wrong label again.
function readerLabel(book) {
  const lowest = Math.min(...book.grades);
  if (lowest <= 2) return "recommended for early readers";
  if (lowest <= 4) return "recommended for growing readers";
  return "recommended for confident readers";
}

// Esc, or the browser's own "exit fullscreen" control, ends the story as surely
// as the Stop button does — so theatre mode has to come off with it, or the page
// stays stripped around a story that is no longer filling the screen. Bound once
// rather than per render, and it only acts when fullscreen was ours to lose:
// on a platform with no Fullscreen API nothing here ever fires, which is the
// point of not building theatre mode on top of it.
function bindEbookFullscreenExit() {
  if (ebookFullscreenBound) return;
  ebookFullscreenBound = true;
  document.addEventListener("fullscreenchange", () => {
    const reader = $(".course-ebook-reader");
    if (reader && document.fullscreenElement === reader) { ebookHadFullscreen = true; return; }
    if (!ebookHadFullscreen) return;
    ebookHadFullscreen = false;
    if (document.body.classList.contains("ebook-watching")) stopEbookWatch();
  });
}

function renderEbooks() {
  ebookWatchActive = false;
  ebookWatchToken += 1;
  // Leaving the reader — a page change, another section — must not leave the
  // rest of the course hidden behind a theatre mode nobody can now switch off.
  document.body.classList.remove("ebook-watching");
  ebookHadFullscreen = false;
  const gradeEbooks = unitEbooks();
  if (!gradeEbooks.length) {
    $("#app").innerHTML = `${pageHeader("Independent reading library", "Books", `Grade ${gradeNumber} illustrated books for this unit will appear here as they are approved.`, "Library being prepared")}
      <section class="panel empty-library"><span>${icon("library-big")}</span><h2>Your Unit ${unitNumber} shelf</h2><p>There are no approved eBooks for this unit yet. Each unit gets its own story - keep learning!</p></section>`;
    return;
  }
  const book = gradeEbooks.find((item) => item.id === activeEbookId) || gradeEbooks[0];
  activeEbookId = book.id;
  activeEbookPage = Math.max(0, Math.min(activeEbookPage, book.pages.length - 1));

  currentPageNarration = `Books. ${book.title}. ${book.description}`;
  $("#app").innerHTML = `<header class="page-header books-header"><div><span class="eyebrow">Independent reading library</span><h1>Books</h1></div>
      <div class="books-header-side">
      <button class="button secondary" id="listen-whole-ebook" type="button">${icon("audio-lines")} Listen to whole book</button>
      <button class="button secondary" id="print-ebook" type="button" aria-label="Print ${escapeHtml(book.title)} as a PDF">${icon("printer")} Print book</button>
      <div class="course-ebook-shelfbar">
        <button class="course-ebook-shelf-title course-ebook-shelf-chip" id="shelf-toggle" type="button" aria-expanded="false" aria-controls="shelf-pop">${icon("library-big")}<div><strong>My shelf</strong><small>${gradeEbooks.length} ${gradeEbooks.length === 1 ? "book" : "books"} · tap to browse</small></div>${icon("chevron-down")}</button>
        <nav class="course-ebook-shelf-pop" id="shelf-pop" hidden aria-label="Book library">
          ${gradeEbooks.map((item) => `<button class="course-ebook-book ${item.id === book.id ? "active" : ""}" data-ebook="${item.id}" type="button" aria-current="${item.id === book.id ? "page" : "false"}"><img src="${ebookAsset(item, item.pages[0].image)}" alt=""><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.level)} · Illustrated story</small></span>${icon("chevron-right")}</button>`).join("")}
        </nav>
      </div>
      </div></header>
    <div class="course-ebook-layout compact">
      <section class="course-ebook-reader" aria-label="${escapeHtml(book.title)} eBook reader">
        <header class="course-ebook-header">
          <div><span class="eyebrow">${escapeHtml(book.level)} · ${readerLabel(book)}</span><h2>${escapeHtml(book.title)}</h2><p>${escapeHtml(book.description)}</p></div>
          <div class="course-ebook-header-actions">
            <button class="button primary" id="watch-ebook" type="button" aria-label="Watch the story: narrated pages that turn by themselves">${icon("play")} Watch the story</button>
            <span class="course-ebook-pagecount" id="ebook-page-count" aria-live="polite"></span>
          </div>
        </header>
        <div id="course-ebook-page"></div>
      </section>
    </div>`;

  const drawPage = (shouldFocus = false) => {
    stopAudio();
    const page = book.pages[activeEbookPage];
    const isLastPage = activeEbookPage === book.pages.length - 1;
    $("#course-ebook-page").innerHTML = `<div class="course-ebook-progress" role="progressbar" aria-label="Book progress" aria-valuemin="1" aria-valuemax="${book.pages.length}" aria-valuenow="${activeEbookPage + 1}" aria-valuetext="Page ${activeEbookPage + 1} of ${book.pages.length}"><span style="width:${((activeEbookPage + 1) / book.pages.length) * 100}%"></span></div>
      <button class="sr-only" id="listen-ebook-page" type="button" tabindex="-1" aria-hidden="true">Narration</button>
      <figure class="course-ebook-illustration" id="ebook-stage">
        <button class="course-ebook-nav prev" id="previous-ebook-page" type="button" aria-label="Previous page" ${activeEbookPage === 0 ? "disabled" : ""}>${icon("chevron-left")}</button>
        <img src="${ebookAsset(book, page.image)}" alt="${escapeHtml(page.alt)}">
        <button class="course-ebook-nav next" id="next-ebook-page" type="button" aria-label="Next page" ${isLastPage ? "disabled" : ""}>${icon("chevron-right")}</button>
        <figcaption class="sr-only">Original illustration by ${escapeHtml(book.illustrator)}.</figcaption>
      </figure>
      <div class="course-ebook-transcript" aria-live="polite"><div class="course-ebook-transcript-head"><span>Read along</span><h3 tabindex="-1">Page ${activeEbookPage + 1}</h3></div><p>${readingLinesHtml(page.text)}</p></div>
      ${isLastPage ? `<div class="course-ebook-controls"><button class="button gold" id="finish-ebook" type="button">${icon("check")} Finish book</button></div>` : ""}`;

    const stage = $("#ebook-stage");
    if (stage && /\.svg$/i.test(page.image)) {
      const pageAtRequest = activeEbookPage;
      fetch(ebookAsset(book, page.image))
        .then((response) => (response.ok ? response.text() : Promise.reject(new Error("illustration fetch failed"))))
        .then((markup) => {
          if (activeEbookPage !== pageAtRequest || !stage.isConnected) return;
          const svg = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
          if (!svg || svg.nodeName.toLowerCase() !== "svg") return;
          svg.setAttribute("role", "img");
          svg.setAttribute("aria-label", page.alt);
          svg.classList.add("course-ebook-stage-svg");
          stage.querySelector("img")?.replaceWith(svg);
          svg.addEventListener("pointerdown", (event) => {
            const target = event.target.closest?.("[data-tap]");
            if (!target) return;
            playTapSound(target.dataset.tap, target.dataset.mood);
            target.classList.remove("tap-play");
            void target.getBoundingClientRect();
            target.classList.add("tap-play");
            const clearTap = () => target.classList.remove("tap-play");
            target.addEventListener("animationend", function clear(ended) {
              if (ended.target !== target) return;
              clearTap();
              target.removeEventListener("animationend", clear);
            });
            setTimeout(clearTap, 1400);
          });
        })
        .catch(() => {});
    }
    const pageCount = $("#ebook-page-count");
    if (pageCount) pageCount.innerHTML = `Page <strong>${activeEbookPage + 1}</strong> of ${book.pages.length}`;
    $("#listen-ebook-page").addEventListener("click", async (event) => {
      if (ebookWatchActive) { stopEbookWatch(); return; }
      const listenButton = event.currentTarget;
      const lines = () => readAlongSegments($("#course-ebook-page"), ".course-ebook-transcript .rd-line");
      if (activeAudioButton === listenButton) { playPageNarration(listenButton, page.text, lines()); return; }
      await playStorySound(page.sound);
      if (listenButton.isConnected) playPageNarration(listenButton, page.text, lines());
    });
    $("#previous-ebook-page").addEventListener("click", () => { stopEbookWatch({ keepFullscreen: true }); activeEbookPage -= 1; drawPage(true); });
    $("#next-ebook-page").addEventListener("click", () => { stopEbookWatch({ keepFullscreen: true }); activeEbookPage += 1; drawPage(true); });
    if ($("#finish-ebook")) $("#finish-ebook").addEventListener("click", () => { stopEbookWatch(); complete("ebooks", `${book.title} complete. Well read!`); });
    icons();
    if (shouldFocus) focusDynamicContent(".course-ebook-transcript h3", `Page ${activeEbookPage + 1} of ${book.pages.length}. ${page.text}`);
  };

  const runWatch = async () => {
    if (ebookWatchActive) { stopEbookWatch(); return; }
    if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
    ebookWatchActive = true;
    const token = ++ebookWatchToken;
    const watchButton = $("#watch-ebook");
    watchButton.classList.add("watching");
    watchButton.innerHTML = `${icon("square")} Stop watching`;
    watchButton.setAttribute("aria-label", "Stop watching the story");
    icons();
    // Only the story on screen, whether or not the browser grants fullscreen.
    document.body.classList.add("ebook-watching");
    bindEbookFullscreenExit();
    const readerElement = $(".course-ebook-reader");
    // The old guard was `!document.fullscreenElement`, and it never let this
    // run: focus mode (seb-session.js) and the lesson gate both request
    // fullscreen on <html> from a CAPTURE-phase pointerdown, which fires before
    // this click — so something always held fullscreen already and the reader
    // never got it. What the learner saw full-screen was the whole page, guide
    // and all. Requesting on a descendant while an ancestor holds it pushes onto
    // the fullscreen element stack, so exitFullscreen() below pops back to the
    // document-level fullscreen rather than dropping the learner out of it.
    if (readerElement?.requestFullscreen && document.fullscreenElement !== readerElement) {
      readerElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    }
    $("#ebook-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    while (ebookWatchActive && ebookWatchToken === token) {
      if (!$("#course-ebook-page")) break;
      drawPage();
      const pageButton = $("#listen-ebook-page");
      if (!pageButton) break;
      await playStorySound(book.pages[activeEbookPage].sound);
      if (!ebookWatchActive || ebookWatchToken !== token) return;
      const narrated = await playPageNarration(pageButton, book.pages[activeEbookPage].text, readAlongSegments($("#course-ebook-page"), ".course-ebook-transcript .rd-line"));
      if (!ebookWatchActive || ebookWatchToken !== token) return;
      if (!narrated) break;
      if (activeEbookPage >= book.pages.length - 1) {
        stopEbookWatch();
        drawPage();
        complete("ebooks", `${book.title} complete. Well watched!`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
      if (!ebookWatchActive || ebookWatchToken !== token) return;
      activeEbookPage += 1;
    }
    if (ebookWatchActive && ebookWatchToken === token) stopEbookWatch();
  };
  $("#watch-ebook").addEventListener("click", runWatch);
  const shelfToggle = $("#shelf-toggle");
  const shelfPop = $("#shelf-pop");
  shelfToggle.addEventListener("click", () => {
    const open = shelfPop.hidden;
    shelfPop.hidden = !open;
    shelfToggle.setAttribute("aria-expanded", String(open));
  });
  [$(".books-header"), $(".course-ebook-layout")].forEach((zone) => zone && zone.addEventListener("click", (event) => {
    if (!shelfPop.hidden && !event.target.closest(".course-ebook-shelfbar")) {
      shelfPop.hidden = true;
      shelfToggle.setAttribute("aria-expanded", "false");
    }
  }));
  $("#listen-whole-ebook").addEventListener("click", () => { stopEbookWatch(); openEbookReadAloud(book); });
  $("#print-ebook").addEventListener("click", () => printBook(book));
  $$('[data-ebook]').forEach((button) => button.addEventListener("click", () => {
    stopEbookWatch();
    activeEbookId = button.dataset.ebook;
    activeEbookPage = 0;
    const selectedBook = gradeEbooks.find((item) => item.id === activeEbookId);
    renderEbooks();
    focusDynamicContent(".course-ebook-header h2", `${selectedBook?.title || "Book"} selected.`);
  }));
  drawPage();
}

function renderLive() {
  $("#app").innerHTML = `${pageHeader("Learn with your teacher", "Live sessions", "Bring your self-paced work and one question. Your teacher will help you practise, receive feedback and improve.")}<div class="live-grid">${course.liveSessions.map((session) => `<article class="panel live-card"><time>Session ${session.sessionNo} · ${session.durationMin} minutes</time><h2>${escapeHtml(session.title)}</h2><h3>Before class</h3><p>${escapeHtml(session.beforeSession)}</p><h3>Class plan</h3><ol class="agenda">${session.agenda.split(";").map((item) => `<li>${escapeHtml(item.trim())}</li>`).join("")}</ol><h3>After class</h3><p>${escapeHtml(session.afterSession)}</p><button class="button primary" data-live-ready="${session.liveSessionId}" type="button">${icon("calendar-check")} I'm ready</button></article>`).join("")}</div>`;
  $$('[data-live-ready]').forEach((button) => button.addEventListener("click", () => { button.innerHTML = `${icon("check-circle")} Ready for class`; button.disabled = true; icons(); toast("Your live-session preparation is marked ready."); }));
}

function renderReflect() {
  $("#app").innerHTML = `${pageHeader("Pause and reflect", "My progress", "Choose the statement that best describes what you can do today. Honest reflection helps your teacher support you.")}<section class="panel"><div class="self-list">${course.selfAssessment.map((item) => `<div class="self-row"><strong>${escapeHtml(item.statement)}</strong>${item.scale.split(" | ").map((choice) => `<button class="self-choice ${progress.self[item.selfAssessmentId] === choice ? "selected" : ""}" data-self="${item.selfAssessmentId}" data-choice="${choice}" type="button">${choice}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="reflection-done" type="button">Save reflection ${icon("check")}</button></p></section>`;
  $$('[data-self]').forEach((button) => button.addEventListener("click", () => { progress.self[button.dataset.self] = button.dataset.choice; saveProgress(); renderReflect(); icons(); }));
  $("#reflection-done").addEventListener("click", () => {
    if (Object.keys(progress.self).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("reflect", "Reflection saved. Your teacher can now see where you need help.");
  });
}

function finalQuizTeacherPanel() {
  if (unitNumber !== 10 || !finalAssessment) return "";
  const latest = finalQuizProgress.attempts[finalQuizProgress.attempts.length - 1];
  if (!latest) return `<section class="panel"><span class="eyebrow">Course-level assessment</span><h2>Final course quiz</h2><p>No submitted attempt is stored on this device yet. The assessment contains ${finalAssessment.questionCount} questions, carries ${finalAssessment.totalMarks} marks and uses an ${finalAssessment.passPercent}% mastery threshold.</p></section>`;
  return `<section class="panel"><span class="eyebrow">Course-level assessment</span><h2>Latest final quiz result</h2><div class="teacher-assessment-summary"><div><strong>${latest.percent}%</strong><span>${latest.score}/${latest.total} marks</span></div><div><strong>${latest.passed ? "Mastery" : "Review"}</strong><span>Attempt ${latest.attempt} of ${finalQuizProgress.attempts.length}</span></div><div><strong>${new Date(latest.submittedAt).toLocaleDateString()}</strong><span>Latest submission</span></div></div><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Curriculum area</th><th>Score</th><th>Percent</th><th>Teaching response</th></tr></thead><tbody>${latest.areaScores.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.score}/${item.total}</td><td>${item.percent}%</td><td>${item.percent >= finalAssessment.passPercent ? "Secure: extend through independent application." : "Review the linked source Units and reassess."}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function gamesTeacherPanel() {
  if (!gamePack) return "";
  const rows = gamePack.games.map((game) => {
    const saved = gameProgress(game.id);
    const percent = Math.round((saved.bestScore / game.rounds.length) * 100);
    return `<tr><td>${escapeHtml(game.title)}</td><td>${escapeHtml(game.skill)}</td><td>${saved.bestScore}/${game.rounds.length}</td><td>${saved.attempts}</td><td>${saved.xp}</td><td>${saved.bestScore >= gamePack.masteryScore ? "Mastered" : saved.attempts ? "Review" : "Not started"}</td></tr>`;
  }).join("");
  return `<section class="panel"><span class="eyebrow">Gamified practice</span><h2>Game mastery</h2><p>Best scores and attempts saved for this learner on this device.</p><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Game</th><th>Skill</th><th>Best</th><th>Attempts</th><th>XP</th><th>Teaching response</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

// ===================== the cursive handwriting worksheet =====================
// A printable, not a section. The learner prints it once and writes on paper as
// the unit's words are met, so it is reached only from Student resources, never
// from the nav, and it ticks nothing — the same standing the two study plans
// have (nonCountable, absent from SECTION_CHAIN, so sectionUnlocked() finds no
// index for it and it is always open).
//
// Grades 1-4 only, the line the picture dictionary and the picture books already
// draw. Handwriting is not being taught by Grade 5, and a Grade 8 unit carries
// up to 423 words — a print job nobody wants.
//
// A PRINT WINDOW, not a generated PDF file. printReading() above made this
// choice first and for the same reasons: the popup owns its document, so the app
// chrome never has to be fought with @media print rules, and a popup-blocked
// user gets the recovery that button already established. The browser's own
// "Save as PDF" is the PDF; nothing here writes one.

// The one cursive face, self-hosted beside Inter and Fraunces. The CSS generic
// `cursive` is Comic Sans on Windows — unjoined print — so shipping the font is
// what makes this a cursive worksheet at all rather than a page of ruled lines.
//
// Edu NSW ACT Cursive (OFL-1.1, AU School Handwriting Fonts Project). Picked by
// rendering all five OFL school hands on Google Fonts and LOOKING at them: it is
// the only one that joins, and it carries lead-in strokes, which is what UK
// continuous cursive means. Edu VIC WA NT, Edu AU VIC WA NT, Edu QLD and Edu SA
// are all pre-cursive — entry and exit flicks, letters never touching —
// whatever their names suggest. Do not swap it for one of those on the strength
// of a style name.
//
// `../../shared/fonts/` resolves to the same folder from both layouts: in dev
// shell/subjects/ → ehel-academy/shared/fonts/, and in a release
// app/english/v{TAG}/ → app/shared/fonts/. deploy-app-version.js already exempts
// that one prefix from its "reference escapes the version path" warning, because
// a woff2 is immutable under its own name.
const CURSIVE_FONT_URL = new URL("../../shared/fonts/EduNSWACTCursive-normal-400-700.woff2", import.meta.url).href;
const CURSIVE_FAMILY = "Ehel Cursive";

// Measured off the shipped woff2 with canvas TextMetrics at 100px, NOT taken
// from the family's design notes: the rules have to sit where this file's
// outlines actually sit, or every model letter floats above its baseline and the
// sheet teaches the wrong thing. baseline→midline .54em, baseline→ascender
// 1.01em, baseline→descender .47em. Re-measure if the woff2 is ever replaced.
const CURSIVE_X_HEIGHT = 0.54, CURSIVE_ASCENDER = 1.01, CURSIVE_DESCENDER = 0.47;

// A4 portrait at 14mm margins. Every length below is millimetres, and the ruled
// lines are drawn as SVG in a viewBox whose user unit IS one millimetre — so a
// baseline is an `y` attribute rather than something inferred from line-height,
// which is the only way to put the letters ON the rule instead of near it.
const SHEET_W = 182, SHEET_H = 269, SHEET_HEADER = 26;

// x-height in mm. Sized the way school handwriting paper is: a beginner needs a
// tall band, and the band shrinks as the hand steadies.
const WORKSHEET_SIZES = {
  large: { label: "Large", xMm: 7, note: "for a hand still learning to join" },
  medium: { label: "Medium", xMm: 5.5, note: "the usual size for Grades 3-4" },
  small: { label: "Small", xMm: 4.5, note: "more words on a page" },
};
const defaultWorksheetSize = () => (gradeNumber <= 2 ? "large" : "medium");

function worksheetGeometry(sizeKey) {
  const em = (WORKSHEET_SIZES[sizeKey] || WORKSHEET_SIZES.medium).xMm / CURSIVE_X_HEIGHT;
  const band = em * (CURSIVE_ASCENDER + CURSIVE_DESCENDER);
  // The trace line and the write line need to read as a PAIR, and the pair needs
  // to separate from the next word. At 1mm apart the trace line's descender rule
  // and the write line's ascender rule printed as one doubled grey line and the
  // whole sheet read as an undifferentiated block of ruling — a learner could not
  // see which line was theirs. The gap between words has to stay clearly larger
  // than the gap inside one.
  const label = 3.4, gapLines = 3, gapWords = 8;
  return { em, band, label, gapLines, gapWords, row: label + band + gapLines + band + gapWords };
}

// The font has to be in the DOCUMENT before anything measures or draws with it.
// A FontFace rather than an injected @font-face rule so the same promise covers
// the on-page preview and the canvas measuring, and so nothing is added to the
// shared stylesheet for a page five subjects never open.
let cursiveFacePromise = null;
function loadCursiveFace() {
  if (!cursiveFacePromise) {
    cursiveFacePromise = new FontFace(CURSIVE_FAMILY, `url("${CURSIVE_FONT_URL}") format("woff2")`, { weight: "400 700" })
      .load()
      .then((face) => { document.fonts.add(face); return face; })
      .catch((error) => { cursiveFacePromise = null; throw error; });
  }
  return cursiveFacePromise;
}

// Widths in em, measured with the real font. A count of characters will not do:
// this face runs .44em per character on average but "understanding" is 7.13em,
// and at the large size that is 93mm of a 182mm line — so a fixed two ghosts
// would push the third copy through the right margin on the longest words in
// every grade.
// One measuring context, cached. Wrapping a sentence asks for the width of a
// growing prefix once per word, so building a canvas per call would mean a new
// 2d context for every word of every sentence on the sheet.
let cursiveMeasureContext = null;
function cursiveWidthOf(text) {
  if (!cursiveMeasureContext) {
    cursiveMeasureContext = document.createElement("canvas").getContext("2d");
    cursiveMeasureContext.font = `400 100px "${CURSIVE_FAMILY}"`;
  }
  return cursiveMeasureContext.measureText(String(text)).width / 100;
}

function measureCursive(words) {
  const widths = new Map();
  for (const word of words) if (!widths.has(word)) widths.set(word, cursiveWidthOf(word));
  return widths;
}

// The model plus as many trace ghosts as genuinely fit, and never more than two:
// the rest of the line is left blank on purpose, because a line packed edge to
// edge with ghosts is a tracing exercise and the second line below is where the
// learner writes it alone.
function traceCopies(widthEm, geo) {
  const wordMm = widthEm * geo.em;
  const gap = geo.em * 0.7;
  return Math.max(1, Math.min(3, Math.floor((SHEET_W + gap) / (wordMm + gap))));
}

// One ruled line. `y` in the viewBox is the baseline, so the four rules and the
// text share one coordinate system and cannot drift apart.
function worksheetLineSvg(geo, word = "", widthEm = 0) {
  const baseline = geo.em * CURSIVE_ASCENDER;
  const midline = geo.em * (CURSIVE_ASCENDER - CURSIVE_X_HEIGHT);
  const foot = geo.band;
  const copies = [];
  if (word) {
    const gap = geo.em * 0.7;
    const step = widthEm * geo.em + gap;
    for (let index = 0; index < traceCopies(widthEm, geo); index += 1) {
      copies.push(`<text x="${(index * step).toFixed(2)}" y="${baseline.toFixed(2)}" class="${index ? "cw-ghost" : "cw-model"}">${escapeHtml(word)}</text>`);
    }
  }
  return `<svg class="cw-svg" viewBox="0 0 ${SHEET_W} ${foot.toFixed(2)}" preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false">
    <line class="cw-rule" x1="0" y1="0" x2="${SHEET_W}" y2="0"></line>
    <line class="cw-rule cw-dashed" x1="0" y1="${midline.toFixed(2)}" x2="${SHEET_W}" y2="${midline.toFixed(2)}"></line>
    <line class="cw-baseline" x1="0" y1="${baseline.toFixed(2)}" x2="${SHEET_W}" y2="${baseline.toFixed(2)}"></line>
    <line class="cw-rule" x1="0" y1="${foot.toFixed(2)}" x2="${SHEET_W}" y2="${foot.toFixed(2)}"></line>
    ${copies.join("")}
  </svg>`;
}

// A whole line of text on the rules, left-aligned, rather than a word repeated
// across it. Used for a sentence, where the point is to read it and copy it
// underneath — not to trace it.
function worksheetTextLineSvg(geo, text, { model }) {
  const baseline = geo.em * CURSIVE_ASCENDER;
  const midline = geo.em * (CURSIVE_ASCENDER - CURSIVE_X_HEIGHT);
  const foot = geo.band;
  return `<svg class="cw-svg" viewBox="0 0 ${SHEET_W} ${foot.toFixed(2)}" preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false">
    <line class="cw-rule" x1="0" y1="0" x2="${SHEET_W}" y2="0"></line>
    <line class="cw-rule cw-dashed" x1="0" y1="${midline.toFixed(2)}" x2="${SHEET_W}" y2="${midline.toFixed(2)}"></line>
    <line class="cw-baseline" x1="0" y1="${baseline.toFixed(2)}" x2="${SHEET_W}" y2="${baseline.toFixed(2)}"></line>
    <line class="cw-rule" x1="0" y1="${foot.toFixed(2)}" x2="${SHEET_W}" y2="${foot.toFixed(2)}"></line>
    ${text && model ? `<text x="0" y="${baseline.toFixed(2)}" class="cw-model">${escapeHtml(text)}</text>` : ""}
  </svg>`;
}

// The spelling line: one ruled line divided into the SAME slots the trace line
// puts its copies in, so the learner writes the word from memory in the positions
// they just traced it. Reusing that rhythm is why spelling costs one band rather
// than the three a "write it three times" block would take on its own lines.
//
// The dividers are faint and stop at the baseline — a full-height rule would read
// as a column edge and box the letters in, which is the opposite of joined writing.
function worksheetSpellSvg(geo, widthEm) {
  const baseline = geo.em * CURSIVE_ASCENDER;
  const midline = geo.em * (CURSIVE_ASCENDER - CURSIVE_X_HEIGHT);
  const foot = geo.band;
  const gap = geo.em * 0.7;
  const step = widthEm * geo.em + gap;
  const slots = traceCopies(widthEm, geo);
  const dividers = [];
  for (let index = 1; index < slots; index += 1) {
    const x = (index * step - gap / 2).toFixed(2);
    dividers.push(`<line class="cw-slot" x1="${x}" y1="${(baseline - geo.em * CURSIVE_X_HEIGHT * 1.15).toFixed(2)}" x2="${x}" y2="${baseline.toFixed(2)}"></line>`);
  }
  return `<svg class="cw-svg" viewBox="0 0 ${SHEET_W} ${foot.toFixed(2)}" preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false">
    <line class="cw-rule" x1="0" y1="0" x2="${SHEET_W}" y2="0"></line>
    <line class="cw-rule cw-dashed" x1="0" y1="${midline.toFixed(2)}" x2="${SHEET_W}" y2="${midline.toFixed(2)}"></line>
    <line class="cw-baseline" x1="0" y1="${baseline.toFixed(2)}" x2="${SHEET_W}" y2="${baseline.toFixed(2)}"></line>
    <line class="cw-rule" x1="0" y1="${foot.toFixed(2)}" x2="${SHEET_W}" y2="${foot.toFixed(2)}"></line>
    ${dividers.join("")}
  </svg>`;
}

// The punctuation exercise: the word's own sentence with its capitals and its
// punctuation taken out, for the learner to put back.
//
// APOSTROPHES AND HYPHENS SURVIVE. Stripping them would turn "didn't" into "didnt"
// and "great-great-grandparents" into one run of letters — that is a spelling
// question, not a punctuation one, and a learner cannot restore an apostrophe from
// a non-word by reasoning about punctuation. 208 of the 3,563 sentences carry one.
//
// Capitals ARE stripped, including mid-sentence ones. 401 sentences have a capital
// after the first letter — "Amal", "Miss Twiga", "I" — and knowing those take one
// is the same skill as knowing a sentence opens with one. That is the exercise.
function stripPunctuation(sentence) {
  return String(sentence)
    .replace(/[.,!?;:"“”]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Greedy wrap to the width of one ruled line. Never breaks inside a word, which
// is safe rather than hopeful: the widest single token in the whole course is
// "great-great-grandparents." at 11.76em — 152mm of a 182mm line even at the
// large size — measured across all 12,952 tokens in all eight grades.
function wrapCursive(text, geo, widthOf) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && widthOf(next) * geo.em > SHEET_W) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// A word is two lines: trace, then write it alone. One line carrying the model
// and a blank remainder was the alternative and it is worse — how much blank
// space a learner gets would then depend on how long the word happens to be,
// which is exactly the wrong thing to vary.
//
// With sentence practice on, the word's own sentence follows: the sentence set
// on the rules to READ, then the same number of blank lines to copy it onto.
// Not traced — a sentence traced in grey is a tracing exercise, and by the time a
// learner is writing sentences the thing being practised is reading a model and
// reproducing it. The blank lines match the model's line count exactly, so the
// space to write in never depends on how long the sentence happens to be.
// With spelling practice on, the word's authored spellingPractice line comes
// first — verbatim, not rewritten. It is the content team's wording and it varies
// by grade on purpose: "Say, tap and trace: t - a - b - l - e" at Grade 1, a bare
// "n - a - m - e" higher up, and "Clap the parts, then copy: whiteboard" for the
// compounds. Every one of the 3,563 Grade 1-4 links has one.
function worksheetRowHtml(word, widths, geo, { sentence = "", spelling = "", punctuation = "", widthOf = null } = {}) {
  const widthEm = widths.get(word) || 0;
  const spellingHtml = spelling ? `<div class="cw-spell">
    <p class="cw-spell-label">${escapeHtml(spelling)}</p>
    ${worksheetSpellSvg(geo, widthEm)}
  </div>` : "";
  const lines = sentence && widthOf ? wrapCursive(sentence, geo, widthOf) : [];
  const sentenceHtml = lines.length ? `<div class="cw-sentence">
    <p class="cw-sentence-label">Now write this sentence.</p>
    ${lines.map((line) => worksheetTextLineSvg(geo, line, { model: true })).join("")}
    ${lines.map(() => worksheetTextLineSvg(geo, "", { model: false })).join("")}
  </div>` : "";
  // The prompt is set in PRINT, not on the rules in cursive. A stripped sentence
  // laid out like a model invites tracing, which is the one thing this exercise
  // must not accept — the learner has to write it out changed, not copied. The
  // blank lines are counted from the CORRECT sentence, which is the longer of the
  // two, so restoring the capitals and stops can never run out of room.
  const punctLines = punctuation && widthOf ? wrapCursive(punctuation, geo, widthOf) : [];
  const punctuationHtml = punctLines.length ? `<div class="cw-punct">
    <p class="cw-punct-label">Write this again with the capital letters and punctuation put back.</p>
    <p class="cw-punct-prompt">${escapeHtml(stripPunctuation(punctuation))}</p>
    ${punctLines.map(() => worksheetTextLineSvg(geo, "", { model: false })).join("")}
  </div>` : "";
  return `<div class="cw-row">
    <p class="cw-label">${escapeHtml(word)}</p>
    ${worksheetLineSvg(geo, word, widthEm)}
    ${worksheetLineSvg(geo)}
    ${spellingHtml}
    ${sentenceHtml}
    ${punctuationHtml}
  </div>`;
}

// ── grammar practice ─────────────────────────────────────────────────────────
// Unlike spelling, sentences and punctuation, grammar is NOT per word — a unit has
// six grammar items and they belong to the unit, not to any one word in it. So it
// is a section of its own at the end of the sheet rather than a block under each
// row, and it reuses .cw-group so it gets the same fresh page every group gets.
//
// GRADES 2-4 ONLY, and Grade 1 is excluded on the evidence rather than by taste:
// all 66 of its grammar items are practiceType "Listen, point and choose" or
// "Say, build and use". That grammar is spoken work — "Hum the mmm sound slowly",
// "Hiss like a snake for three seconds" — and printing it above a ruled line would
// tell a learner to write down something the course asks them to say.
const GRAMMAR_ORAL_TYPES = /^(Listen, point and choose|Say, build and use)$/;

// The practice string holds its exercises in one of three layouts and the split has
// to cover all of them: pipe-separated (114 of 246 items), newline-numbered (35),
// both (6), and 91 with no separator at all. Those 91 are single tasks rather than
// several run together — checked by reading them, and all of them are Grades 1-2 —
// so one piece is the honest answer there, not a parser that found nothing.
const splitGrammarPractice = (practice) => String(practice || "").split(/\n|\|/).map((part) => part.trim()).filter(Boolean);

// 149 of the 1,047 practice pieces carry the ANSWER KEY — "Check yourself: 1. He
// 2. She 3. He 4. She." On screen the learner reveals it after trying; printed
// under the questions it is simply the answers, on the learner's own page, with
// blank lines inviting them to be copied down.
//
// THE KEY IS NOT ALWAYS ITS OWN PIECE. 104 of the 149 are appended to the LAST
// QUESTION on the same line — "5. ______ is your teacher? Check yourself: 1. Who
// 2. What…" — so a pattern anchored with ^ matches only the 45 that start one, and
// the other 104 print. That is exactly what the first version of this did.
//
// So the marker is found ANYWHERE and the piece is cut at it. A piece that opens
// with the marker cuts to nothing and drops; a question with the key stuck on the
// end keeps the question and loses the answers. Three wordings appear inline
// (answer key 45, check yourself 30, self-check 29) and the anchored ones add
// "answers:"; all are in the one pattern.
//
// This is the one place the sheet leaves authored content out on purpose, and it is
// worth being explicit that nothing else is: no other exercise is capped, sampled or
// truncated. A learner loses the answers, not the practice. check-english-content.mjs
// fails if a key ever survives into a prompt, so a fifth wording cannot start
// printing quietly.
// The separator is rarely a plain colon. What actually appears between the words
// and the answers: ", Part A:", ", examples only:", " (self-check) —", and a
// parenthetical long enough to run to sixty characters. Three widenings were needed
// and each was driven by a leak the pattern had not anticipated, not by re-reading
// it — which is why the gate's detector is keyed on the ANSWER RUN rather than on
// the wording, and found every one of them.
//
// The two halves are not symmetrical, on purpose. The multi-word phrases are
// unambiguous, so anything up to the colon may sit between them and the answers.
// Bare "answers" is an ordinary word — "Ask and answer three times:", "Write each
// answer in two ways:" are INSTRUCTIONS — so it keeps a strict separator. Loosening
// that half cut 84 pieces, and the extras were real teaching text.
const GRAMMAR_ANSWER_KEY = /(?:\b(?:check yourself|check your work|answer key|self[- ]check)\b[^:\n]{0,60}[:\-—])|(?:\banswers?\b\s*(?:,?\s*part\s+[a-z0-9]+)?\s*[:\-—])/i;
const stripGrammarAnswerKey = (piece) => {
  const found = piece.match(GRAMMAR_ANSWER_KEY);
  return found ? piece.slice(0, found.index).trim() : piece;
};
// The other half of the same cut. The key is not thrown away — it is kept so the
// sheet can print it on its OWN pages at the end, for whoever marks the work. The
// objection was never that the answers are secret; it is that beside the question
// they are the answer, and at the back of the sheet they are a mark scheme.
const takeGrammarAnswerKey = (piece) => {
  const found = piece.match(GRAMMAR_ANSWER_KEY);
  return found ? piece.slice(found.index).trim() : "";
};

// A gap-fill wants one line to answer on; an open task wants room to write. The
// prompt's own shape decides, which is a proxy but a legible one — 647 of the 981
// prompts carry a gap marker and 334 do not.
const grammarPromptLines = (prompt) => (/_{2,}|\(.+\/.+\)/.test(prompt) ? 1 : 3);

// The first piece is usually the INSTRUCTION for the ones after it — "Write he or
// she in each gap.", "Rewrite each pair so the second sentence starts with…" —
// and it is not itself a question. 135 of the 155 multi-piece items are that shape.
// Left as a prompt it collected three blank lines nobody should write on.
//
// It is only treated as an instruction when the pieces after it actually look like
// exercises, so the 20 items that open with a real question keep their lines.
function grammarInstructionSplit(pieces) {
  if (pieces.length < 2) return { instruction: "", prompts: pieces };
  const isExercise = (piece) => /_{2,}|\(.+\/.+\)/.test(piece) || /^\d+[.)]/.test(piece);
  const rest = pieces.slice(1);
  const restAreExercises = rest.filter(isExercise).length >= Math.ceil(rest.length * 0.6);
  if (!isExercise(pieces[0]) && restAreExercises) return { instruction: pieces[0], prompts: rest };
  return { instruction: "", prompts: pieces };
}

function worksheetGrammar() {
  return (course.grammar || [])
    .filter((item) => !GRAMMAR_ORAL_TYPES.test(item.practiceType || ""))
    .map((item) => {
      const raw = splitGrammarPractice(item.practice);
      const pieces = raw.map(stripGrammarAnswerKey).filter(Boolean);
      const { instruction, prompts } = grammarInstructionSplit(pieces);
      return {
        title: item.title || "",
        rule: String(item.ruleAndExamples || item.explanation || "").split(/\n+/).map((line) => line.trim()).filter(Boolean),
        instruction,
        prompts: prompts.map((text) => ({ text, lines: grammarPromptLines(text) })),
        answers: raw.map(takeGrammarAnswerKey).filter(Boolean),
      };
    })
    .filter((item) => item.prompts.length);
}

// READING COMPREHENSION — a passage and the questions about it, on the same pages.
//
// GRADES 2-4 ONLY, and Grade 1 is excluded on the evidence rather than by taste,
// exactly as its grammar is. Of the 558 comprehension questions across Grades
// 1-4, 132 are questionType "Oral response", "Point, act or say", "Oral, point or
// choose", "Listen, point and say" or "Do and explain" — and every one of the 132
// is at Grade 1, which has no other kind. So the filter is on the type and Grade
// 1 ends up with no comprehension box on its worksheet at all, which is the
// honest outcome: an empty section on a printable is a page of nothing.
const COMPREHENSION_ORAL_TYPES = /^(Oral response|Point, act or say|Oral, point or choose|Listen, point and say|Do and explain)$/;

// THE PASSAGE IS PRINTED, and it is the expensive decision on this page. It runs
// to about 7,000 characters per unit — three or four pages before a single
// question — where every other option on the sheet costs a line or two per word.
//
// It is printed anyway because a comprehension question without its text is not
// a harder exercise, it is an impossible one: "The text names four places where
// we can see words. What are they?" cannot be answered away from the screen, and
// away from the screen is the entire point of a sheet you print. The page count
// shown beside the tick box includes the passages, so nobody meets the cost at
// the printer.
//
// Grouped by READING, not by the section the app groups by on screen. 42 of the
// 77 question sections at Grades 2-4 draw on more than one reading, so a section
// is not something that can sit under one passage. A reading is.
const comprehensionAnswerLines = (marks) => (Number(marks) >= 2 ? 3 : 2);

function worksheetComprehension() {
  const written = (course.comprehension || [])
    .filter((question) => !COMPREHENSION_ORAL_TYPES.test(question.questionType || ""));
  if (!written.length) return [];
  // Driven from course.readings so the passages come out in the unit's own order
  // and a reading nothing asks about is simply not printed. Every one of the 558
  // questions resolves to a reading in its own unit — checked across all 41 units
  // of Grades 1-4, none orphaned — so no question is lost by keying on that.
  // Questions are numbered CONTINUOUSLY across the whole section — 1 to 17 for a
  // Grade 2 unit — not 1..n restarting under each text.
  //
  // Restarting is what an exam paper does, and it works there because the answers
  // are printed under the same section headings the questions were. Here the two
  // are pages apart: the questions are spread over four or five texts and the key
  // is one block at the very back. "Question 2" then names five different
  // questions, and whoever is marking has to match on the reading title to know
  // which. A number that does not identify the thing it numbers is decoration.
  //
  // The key keeps its per-reading headings, so it is still browsable by text; what
  // changes is that each line's number is unique in the unit, so a number alone is
  // enough to find it from either direction.
  let number = 0;
  return (course.readings || [])
    .map((reading) => {
      const questions = written.filter((question) => question.readingId === reading.readingId);
      if (!questions.length) return null;
      return {
        title: reading.title || "",
        type: reading.type || "",
        // 50 of the readings at Grades 2-4 are type "Listening", and printing one
        // hands the learner the script of something they were meant to HEAR —
        // which quietly turns a listening exercise into a reading one and reports
        // nothing wrong, because every question still has its text.
        //
        // Dropping them instead would drop their questions with them, so the sheet
        // says what the text is and who should read it: the grown-up reads it
        // aloud, the learner listens and answers. That is what the exercise is,
        // moved onto paper, rather than a different exercise wearing its name.
        listening: /listening/i.test(reading.type || ""),
        blocks: readingBlocks(reading.passageScript).map((block) => ({ heading: block.heading, text: block.text })),
        questions: questions.map((question) => ({
          // Assigned here, in the ONE place that walks every question in order, so
          // the questions and the answer key cannot disagree about what a number
          // means — each reads `number` rather than deriving one from its own
          // position in its own loop.
          number: (number += 1),
          text: question.question || "",
          marks: Number(question.marks) || 1,
          lines: comprehensionAnswerLines(question.marks),
          // Read by the answer-key builder and by nothing else. correctAnswer is
          // the mark scheme — "Any two real places that are not in the text, such
          // as…" — and beside the question it is simply the answer, printed on
          // the learner's own page above the lines they were going to write it
          // on. Same objection as the grammar keys above, and the same remedy:
          // it goes to the back of the sheet, behind its own tick box.
          answer: String(question.correctAnswer || "").trim(),
        })),
      };
    })
    .filter(Boolean);
}

// One section per reading, so each passage opens a fresh page with its own
// questions under it — .cw-group + .cw-group already breaks the page, which is
// the same rule that gives every vocabulary group a page of its own.
//
// The passage is set in PRINT, not on the ruled lines in cursive. It is there to
// be read, and cursive on the rules is this sheet's signal for "copy this".
function worksheetComprehensionHtml(readings, geo) {
  if (!readings.length) return "";
  return readings.map((reading, index) => `<section class="cw-group cw-comp">
    <header class="cw-group-head">
      <!-- The ordinal counts TEXTS, and it is kept out of the eyebrow on purpose:
           "Listening 4" for the fourth text of five reads as the fourth listening,
           which it is not — the readings and the listenings are interleaved. -->
      <span>${reading.listening ? "Listening" : "Reading"}</span>
      <small>Text ${index + 1} of ${readings.length} · ${escapeHtml(reading.title)}${reading.type ? ` · ${escapeHtml(reading.type)}` : ""}</small>
      <em>${escapeHtml(gradeLabel)} · Unit ${course.unit.unitNo}</em>
    </header>
    ${reading.listening ? `<p class="cw-comp-aloud">This is a listening text. Ask a grown-up to read it aloud to you — listen to the whole thing before you look at the questions.</p>` : ""}
    <div class="cw-comp-passage">${reading.blocks.map((block) => (block.heading
      ? `<h3 class="cw-comp-head">${escapeHtml(block.text)}</h3>`
      : `<p class="cw-comp-para">${escapeHtml(block.text)}</p>`)).join("")}</div>
    <p class="cw-comp-instruction">${reading.listening ? "Now answer the questions in your best handwriting." : "Read the text above, then answer the questions in your best handwriting."}</p>
    ${reading.questions.map((question) => `<div class="cw-comp-item">
      <p class="cw-comp-question"><span class="cw-comp-no">${question.number}.</span> ${escapeHtml(question.text)} <span class="cw-comp-marks">[${question.marks} mark${question.marks === 1 ? "" : "s"}]</span></p>
      ${Array.from({ length: question.lines }, () => worksheetTextLineSvg(geo, "", { model: false })).join("")}
    </div>`).join("")}
  </section>`).join("");
}

// The answer key, on its own pages at the very end and addressed to the adult
// rather than the learner. Deliberately the plainest thing on the sheet: no ruled
// lines, no room to write, nothing that reads as an exercise — it is a mark scheme,
// and anything that looks like a task invites the learner to do it.
//
// It is LAST on purpose. A learner who turns the page mid-exercise should meet more
// exercises, not the answers, and the sheet's own pagination puts every group on a
// fresh page so this cannot creep up behind the questions.
const listPhrase = (parts) => (parts.length > 1
  ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
  : parts[0] || "");

// The note has to stay true whichever parts are switched on, and the tempting
// version — "the answers to the X and Y and Z pages" — is not, because SPELLING
// IS NOT ITS OWN PAGES. Grammar and comprehension each get pages at the end;
// spelling sits under each word on the vocabulary pages the learner already has.
// So the two kinds are described separately rather than joined into one list that
// quietly invents a section of the sheet.
// Which sources have PAGES of their own and which sit under each word, and the
// exact words for the ones that do not. Grammar and comprehension each get their
// own pages at the end; spelling and punctuation are blocks under a word on the
// vocabulary pages the learner already has. Describing either of the latter as
// "pages" invents a section of the sheet — which is precisely what happened when
// spelling was added, so the distinction is a table now rather than a condition.
const KEY_INLINE_PHRASES = {
  spelling: "the correct spellings of the words this sheet set",
  sentences: "the sentences the words come from",
  punctuation: "the sentences with their capital letters and punctuation put back",
};

// The two sentence exercises share ONE block of answers, so when both are on the
// note describes it once. Two phrases side by side either repeat "the sentences"
// twice or lean on "those sentences" to refer back — and the second reads as a
// dangling reference the moment punctuation is on by itself, which is exactly what
// it did. A pair gets its own sentence rather than a conjunction of two.
const KEY_SENTENCE_PAIR_PHRASE = "the sentences the words come from, for the copying and the punctuation";

function answerKeyCovers(covers) {
  const paged = covers.filter((part) => !KEY_INLINE_PHRASES[part]);
  const parts = [];
  if (paged.length) parts.push(`the answers to the ${listPhrase(paged)} pages`);
  const bothSentenceExercises = covers.includes("sentences") && covers.includes("punctuation");
  for (const part of covers) {
    if (!KEY_INLINE_PHRASES[part]) continue;
    if (bothSentenceExercises && part === "sentences") { parts.push(KEY_SENTENCE_PAIR_PHRASE); continue; }
    if (bothSentenceExercises && part === "punctuation") continue;
    parts.push(KEY_INLINE_PHRASES[part]);
  }
  return listPhrase(parts);
}

// The printed note and the on-screen hint say the same thing and are built from
// the same function ON PURPOSE. They were written separately at first and drifted
// within the hour: the note was corrected to stop calling spelling "pages" and the
// hint went on saying "the answers to the spelling pages" — describing a section
// of the sheet that does not exist, in the one place a learner reads before
// ticking the box.
function answerKeyNote(covers) {
  return `These are ${answerKeyCovers(covers)}. They are printed here, at the back, so the learner meets the questions first.`;
}

// The spelling half of the key: which words were set, and how they are spelled,
// per group, in the order the sheet printed them.
//
// UNLIKE the other two, this is not a reveal, and it is worth being plain about
// why it is here anyway. The spelling exercise prints its own prompt above the
// slots — "Say, tap and trace: m - o - t - h - e - r" — and the word is traced in
// grey on the row directly above that. Measured across Grades 1-4: 136 of 145
// blocks sampled spell the answer out in the prompt itself. So nothing at the
// back of the sheet can give away a spelling the front has already given twice.
//
// What it IS, is the marking sheet. Checking spelling means comparing what the
// learner wrote in the slots against the correct spelling, and without this that
// means turning back through every group page one word at a time. Here it is one
// list. That is a smaller claim than the grammar and comprehension keys make, and
// it is the honest one.
function worksheetSpellingKey(chosenGroups) {
  return (chosenGroups || [])
    .map((group) => ({
      title: group.title,
      // Only the words the sheet actually set a spelling exercise for, so the key
      // cannot list a word the learner was never asked to spell.
      words: group.words.filter((word) => group.spellings?.get(word)),
    }))
    .filter((group) => group.words.length);
}

// The sentence half, serving BOTH the copying exercise and the punctuation one.
//
// ONE BLOCK, NOT TWO, and this is the whole design decision. "A sentence to copy"
// and "Punctuation" are different exercises but they are built from the same map —
// group.sentences — so their answers are the same list of sentences. Keyed
// separately they would print every sentence twice, under two headings, in a
// section whose only job is to be quick to look something up in. The heading says
// which exercises the block serves; the sentences appear once.
//
// UNLIKE SPELLING, THIS IS A REAL REVEAL, and the difference is worth knowing
// before deciding what the section is for. The spelling prompt spells its answer
// out; the punctuation prompt is the sentence with its capitals and stops REMOVED,
// so the correct version appears nowhere on the sheet — unless "A sentence to
// copy" is also ticked, which prints it in cursive directly above. So this key is
// the only copy of the answer for a learner practising punctuation alone, and
// redundant for one doing both. Both are legitimate sheets, so it is offered
// either way rather than guessed at.
function worksheetSentenceAnswers(chosenGroups) {
  return (chosenGroups || [])
    .map((group) => ({
      title: group.title,
      // Keyed on the same map the exercise itself reads, so the key cannot list a
      // sentence the sheet never set, or miss one it did.
      items: group.words
        .map((word) => ({ word, sentence: group.sentences?.get(word) }))
        .filter((item) => item.sentence),
    }))
    .filter((group) => group.items.length);
}

// One options object rather than a fifth positional argument. Four optional
// arrays in a row is how a call site comes to pass comprehension where spelling
// was expected: every one of them is an array of objects, so nothing would throw
// and the key would simply print the wrong section.
function worksheetAnswerKeyHtml({ grammar, comprehension, spelling, sentenceAnswers, sentenceLabels = [] } = {}, geo) {
  const items = grammar;
  const readings = comprehension;
  const withAnswers = (items || []).filter((item) => item.answers.length);
  // A comprehension question always carries a correctAnswer — all 558 of them do,
  // checked, not assumed — but the filter stays because a reading whose answers
  // were all blank would otherwise print a heading with nothing under it.
  const withGuidance = (readings || []).filter((reading) => reading.questions.some((question) => question.answer));
  const withSpelling = spelling || [];
  const withSentences = sentenceLabels.length ? (sentenceAnswers || []) : [];
  if (!withAnswers.length && !withGuidance.length && !withSpelling.length && !withSentences.length) return "";
  const covers = [
    withAnswers.length && "grammar",
    withGuidance.length && "comprehension",
    withSpelling.length && "spelling",
    withSentences.length && sentenceLabels.includes("copy") && "sentences",
    withSentences.length && sentenceLabels.includes("punctuate") && "punctuation",
  ].filter(Boolean);
  // "6 sentences to copy and punctuate" — the heading is where the two exercises
  // are distinguished, since the sentences under it answer both.
  const sentenceWhat = sentenceLabels.length > 1
    ? `${sentenceLabels[0]} and ${sentenceLabels[1]}`
    : sentenceLabels[0] || "";
  return `<section class="cw-group cw-answers">
    <header class="cw-group-head">
      <span>Answer key</span>
      <small>for the grown-up marking this</small>
      <em>${escapeHtml(gradeLabel)} · Unit ${course.unit.unitNo}</em>
    </header>
    <p class="cw-answers-note">${answerKeyNote(covers)}</p>
    ${withAnswers.map((item) => `<div class="cw-answers-item">
      <h3 class="cw-gram-title">${escapeHtml(item.title)}</h3>
      ${item.answers.map((answer) => `<p class="cw-answers-line">${escapeHtml(answer)}</p>`).join("")}
    </div>`).join("")}
    ${withGuidance.map((reading) => `<div class="cw-answers-item">
      <!-- The range is here so the key can be navigated from either direction: by
           text, for somebody marking one passage, and by number, for somebody
           holding a sheet that says 11. -->
      <h3 class="cw-gram-title">${escapeHtml(reading.title)} <span class="cw-answers-range">questions ${reading.questions[0].number}${reading.questions.length > 1 ? `–${reading.questions[reading.questions.length - 1].number}` : ""}</span></h3>
      ${reading.questions.map((question) => (question.answer
        ? `<p class="cw-answers-line">${question.number}. ${escapeHtml(question.answer)}</p>`
        : "")).join("")}
    </div>`).join("")}
    ${withSpelling.map((group) => `<div class="cw-answers-item">
      <h3 class="cw-gram-title">${escapeHtml(group.title)} <span class="cw-answers-range">${group.words.length} word${group.words.length === 1 ? "" : "s"} to spell</span></h3>
      <p class="cw-answers-line cw-answers-words">${group.words.map((word) => escapeHtml(word)).join(" · ")}</p>
    </div>`).join("")}
    ${withSentences.map((group) => `<div class="cw-answers-item">
      <h3 class="cw-gram-title">${escapeHtml(group.title)} <span class="cw-answers-range">${group.items.length} sentence${group.items.length === 1 ? "" : "s"} to ${escapeHtml(sentenceWhat)}</span></h3>
      ${group.items.map((item) => `<p class="cw-answers-line"><span class="cw-answers-key">${escapeHtml(item.word)}</span> ${escapeHtml(item.sentence)}</p>`).join("")}
    </div>`).join("")}
  </section>`;
}

function worksheetGrammarHtml(items, geo) {
  if (!items.length) return "";
  return `<section class="cw-group cw-grammar">
    <header class="cw-group-head">
      <span>Grammar</span>
      <small>${items.length} thing${items.length === 1 ? "" : "s"} to practise</small>
      <em>${escapeHtml(gradeLabel)} · Unit ${course.unit.unitNo}</em>
    </header>
    ${items.map((item) => `<div class="cw-gram-item">
      <h3 class="cw-gram-title">${escapeHtml(item.title)}</h3>
      ${item.rule.map((line) => `<p class="cw-gram-rule">${escapeHtml(line)}</p>`).join("")}
      ${item.instruction ? `<p class="cw-gram-instruction">${escapeHtml(item.instruction)}</p>` : ""}
      ${item.prompts.map((prompt) => `<div class="cw-gram-task">
        <p class="cw-gram-prompt">${escapeHtml(prompt.text)}</p>
        ${Array.from({ length: prompt.lines }, () => worksheetTextLineSvg(geo, "", { model: false })).join("")}
      </div>`).join("")}
    </div>`).join("")}
  </section>`;
}

// A vocabulary group is a page of its own: its heading, then its words. The unit
// teaches these as sets — "Jobs and Equipment", "Numbers 1 to 12" — and a learner
// working through one sitting wants the set in front of them, not a page that
// ends halfway through one group and starts another. A group longer than a page
// runs on; only the START of a group is forced to a page break.
// The heading also carries the grade and unit, which a footer used to. A footer
// sits after the last row, so on a sheet whose last group just fills its page it
// was pushed onto a page of its own — a whole sheet of paper for one grey line.
// Every group starts a page, so putting the identification here puts it on the
// first page of every group instead, and it cannot orphan.
// `rows` draws fewer rows than the group holds — the on-page preview shows two.
// The heading still counts the WHOLE group: it is describing the group, not the
// sample, and a preview headed "2 words" over a seven-word group misreports what
// will print.
function worksheetGroupHtml(group, widths, geo, { first, rows = group.words.length, sentences = false, spelling = false, punctuation = false }) {
  return `<section class="cw-group${first ? " is-first" : ""}">
    <header class="cw-group-head">
      <span>${escapeHtml(group.title)}</span>
      <small>${group.words.length} word${group.words.length === 1 ? "" : "s"}</small>
      <em>${escapeHtml(gradeLabel)} · Unit ${course.unit.unitNo}</em>
    </header>
    ${group.words.slice(0, rows).map((word) => worksheetRowHtml(word, widths, geo, {
      sentence: sentences ? group.sentences?.get(word) || "" : "",
      spelling: spelling ? group.spellings?.get(word) || "" : "",
      punctuation: punctuation ? group.sentences?.get(word) || "" : "",
      widthOf: cursiveWidthOf,
    })).join("")}
  </section>`;
}

// One stylesheet, used by the on-page preview AND by the print document, so the
// preview cannot promise something the printed sheet does not deliver. Sizes are
// in mm throughout; the svg carries its own viewBox, so `width` is all the print
// side has to pin.
function worksheetCss(geo, { print }) {
  return `
    /* break-before on the ADJACENT sibling selector, not on every group: putting it
       on all of them makes the printer emit a blank leading page before the first.
       No backticks in this comment — the whole stylesheet is a template literal, so
       one would end the string and take the rest of the module with it. */
    .cw-group + .cw-group { break-before: page; page-break-before: always; }
    .cw-group-head { display: flex; align-items: baseline; gap: 3mm;
                     margin: 0 0 ${print ? "4mm" : "12px"}; padding-bottom: ${print ? "1.5mm" : "6px"};
                     border-bottom: ${print ? ".3mm" : "1px"} solid #dce4ea; }
    .cw-group-head span { color: #0f766e; font-weight: 700; letter-spacing: .05em; text-transform: uppercase;
                          font-size: ${print ? "3mm" : "13px"}; }
    .cw-group-head small { color: #5d6b80; font-size: ${print ? "2.6mm" : "12px"}; }
    .cw-group-head em { margin-left: auto; color: #5d6b80; font-style: normal;
                        font-size: ${print ? "2.4mm" : "12px"}; }
    .cw-row { break-inside: avoid; page-break-inside: avoid; margin: 0 0 ${geo.gapWords}mm; }
    /* The sentence block sits under its word and must not be split from it — a
       model on one page and its blank copy lines on the next is unusable. It is
       inside .cw-row, which already avoids breaking, so this only has to hold the
       block together if that ever changes. */
    /* A grammar item stays whole. Splitting a rule from the exercise it explains,
       or a prompt from the line it is answered on, makes the page unusable. */
    /* The answer key is the plainest block on the sheet on purpose: no rules, no
       space to write, nothing that reads as a task. It is a mark scheme. */
    .cw-answers-note { margin: 0 0 4mm; color: #5d6b80;
                       font: 400 ${print ? "2.9mm" : "14px"}/1.4 Arial, Helvetica, sans-serif; }
    .cw-answers-item { break-inside: avoid; page-break-inside: avoid; margin: 0 0 ${(geo.gapWords * 0.7).toFixed(1)}mm; }
    /* The spelling answers are a wrapped RUN, not one line per word: a group can
       set thirty words, and thirty lines of one word each is three pages of key
       for something the marker reads by scanning. */
    .cw-answers-words { line-height: 1.6; }
    /* The word each sentence belongs to. The sheet identifies every block by its
       word, so the key has to as well or a marker cannot find the one they want. */
    .cw-answers-key { font-weight: 700; }
    .cw-answers-range { color: #5d6b80; font-weight: 400;
                        font-size: ${print ? "2.7mm" : "13px"}; }
    .cw-answers-line { margin: .6mm 0 0; color: #17324d;
                       font: 400 ${print ? "3mm" : "15px"}/1.45 Arial, Helvetica, sans-serif; }
    .cw-gram-item { break-inside: avoid; page-break-inside: avoid; margin: 0 0 ${geo.gapWords}mm; }
    .cw-gram-title { margin: 0 0 1.2mm; color: #17324d;
                     font: 700 ${print ? "3.6mm" : "17px"}/1.25 Arial, Helvetica, sans-serif; }
    .cw-gram-rule { margin: 0 0 1mm; color: #5d6b80;
                    font: 400 ${print ? "2.9mm" : "14px"}/1.35 Arial, Helvetica, sans-serif; }
    .cw-gram-instruction { margin: 1.4mm 0 0; color: #17324d; font-weight: 700;
                           font-size: ${print ? "3.1mm" : "15px"}; font-family: Arial, Helvetica, sans-serif; }
    .cw-gram-task { margin-top: ${(geo.gapWords * 0.5).toFixed(1)}mm; break-inside: avoid; page-break-inside: avoid; }
    .cw-gram-prompt { margin: 0 0 1.2mm; color: #17324d;
                      font: 400 ${print ? "3.1mm" : "15px"}/1.4 Arial, Helvetica, sans-serif; }
    /* The passage is the one block on the sheet that is ALLOWED to break — it runs
       to several pages on its own and break-inside: avoid on something taller than
       a page is ignored anyway, so saying so would only be a lie in the stylesheet.
       Its questions each stay whole, the way a grammar task does. */
    .cw-comp-aloud { margin: 0 0 2.5mm; padding: ${print ? "1.8mm 2.4mm" : "8px 10px"};
                     border-left: ${print ? ".8mm" : "3px"} solid #0f766e; background: #f2f8f7; color: #17324d;
                     font: 400 ${print ? "2.9mm" : "14px"}/1.4 Arial, Helvetica, sans-serif; }
    .cw-comp-passage { margin: 0 0 ${geo.gapWords}mm; }
    .cw-comp-head { margin: ${(geo.gapWords * 0.5).toFixed(1)}mm 0 1mm; color: #17324d;
                    font: 700 ${print ? "3.4mm" : "16px"}/1.25 Arial, Helvetica, sans-serif; }
    .cw-comp-para { margin: 0 0 1.8mm; color: #17324d;
                    font: 400 ${print ? "3.1mm" : "15px"}/1.5 Arial, Helvetica, sans-serif; }
    .cw-comp-instruction { margin: 0 0 ${(geo.gapWords * 0.7).toFixed(1)}mm; color: #17324d; font-weight: 700;
                           font-size: ${print ? "3.1mm" : "15px"}; font-family: Arial, Helvetica, sans-serif; }
    .cw-comp-item { break-inside: avoid; page-break-inside: avoid; margin: 0 0 ${geo.gapWords}mm; }
    .cw-comp-question { margin: 0 0 1.2mm; color: #17324d;
                        font: 400 ${print ? "3.1mm" : "15px"}/1.4 Arial, Helvetica, sans-serif; }
    .cw-comp-no { font-weight: 700; }
    .cw-comp-marks { color: #5d6b80; white-space: nowrap;
                     font-size: ${print ? "2.6mm" : "12px"}; }
    .cw-punct { break-inside: avoid; page-break-inside: avoid; margin-top: ${(geo.gapWords * 0.6).toFixed(1)}mm; }
    .cw-punct-label { margin: 0 0 .8mm; color: #5d6b80; letter-spacing: .04em;
                      font: 500 ${print ? "2.7mm" : "12px"}/1.2 Arial, Helvetica, sans-serif; }
    /* The stripped sentence is set in PRINT, deliberately unlike every other line
       on the sheet. In cursive on the rules it would read as a model to trace, and
       this is the one exercise where copying the prompt is the wrong answer. */
    .cw-punct-prompt { margin: 0 0 1.6mm; color: #17324d;
                       font: 400 ${print ? "3.2mm" : "15px"}/1.4 Arial, Helvetica, sans-serif; }
    .cw-spell { break-inside: avoid; page-break-inside: avoid; margin-top: ${(geo.gapWords * 0.6).toFixed(1)}mm; }
    .cw-spell-label { margin: 0 0 .8mm; color: #5d6b80; letter-spacing: .06em;
                      font: 500 ${print ? "2.7mm" : "12px"}/1.2 Arial, Helvetica, sans-serif; }
    /* Slot dividers: faint, and stopping at the baseline. A full-height rule reads
       as a column edge and boxes the letters in, which is the opposite of joined
       writing — the point is three places to write, not three cells. */
    .cw-slot { stroke: #dbe6ee; stroke-width: .25; }
    .cw-sentence { break-inside: avoid; page-break-inside: avoid; margin-top: ${(geo.gapWords * 0.6).toFixed(1)}mm; }
    .cw-sentence-label { margin: 0 0 .8mm; color: #5d6b80; letter-spacing: .04em;
                         font: 500 ${print ? "2.7mm" : "12px"}/1.2 Arial, Helvetica, sans-serif; }
    .cw-label { margin: 0 0 .8mm; color: #5d6b80; letter-spacing: .04em;
                font: 500 ${print ? "2.7mm" : "12px"}/1.2 Arial, Helvetica, sans-serif; }
    .cw-svg { display: block; width: ${print ? `${SHEET_W}mm` : "100%"}; height: auto; overflow: visible; }
    .cw-svg + .cw-svg { margin-top: ${geo.gapLines}mm; }
    .cw-rule { stroke: #b9c7d2; stroke-width: .18; }
    .cw-dashed { stroke: #ccd8e0; stroke-dasharray: 1.6 1.6; }
    .cw-baseline { stroke: #17324d; stroke-width: .3; }
    .cw-model, .cw-ghost { font-family: "${CURSIVE_FAMILY}", cursive; font-size: ${geo.em.toFixed(3)}px; }
    .cw-model { fill: #17324d; }
    .cw-ghost { fill: #c2ced8; }`;
}

// Vocabulary groups, each with its words, in the unit's own order.
function worksheetGroups() {
  const words = linkedWords();
  return course.vocabularyGroups.map((group) => ({
    id: group.id,
    title: group.title,
    words: words.filter((item) => item.groupId === group.id)
      .map((item) => item.master?.displayWord)
      .filter(Boolean),
    // Each word's own example sentence, for sentence practice. exampleSentence is
    // present on every dictionaryLink in every unit of every grade — checked
    // across all eight, not assumed — so a word never loses its sentence, and a
    // word that somehow had none simply gets no sentence block rather than an
    // empty pair of ruled lines.
    sentences: new Map(words
      .filter((item) => item.groupId === group.id && item.master?.displayWord && item.exampleSentence)
      .map((item) => [item.master.displayWord, item.exampleSentence])),
    // The authored spelling prompt, same shape and same guarantee.
    spellings: new Map(words
      .filter((item) => item.groupId === group.id && item.master?.displayWord && item.spellingPractice)
      .map((item) => [item.master.displayWord, item.spellingPractice])),
  })).filter((group) => group.words.length);
}

// Which groups start ticked. The unit's LAST group is a glossary harvested from
// the readings — 18 to 231 words of it — rather than words the unit teaches, and
// printing it by default turns a 4-page sheet into a 40-page one.
//
// It is matched by its exact title, and that is a deliberate second choice: a
// size threshold was measured against all 41 Grade 1-4 units and does not
// separate them. Taught groups reach 30 words ("Order Words for Dates", the two
// Review Words groups) while "Words from our stories" drops to 18, so any cutoff
// mislabels one or the other. Nothing in the data marks the group structurally.
//
// Getting this wrong only changes which box starts ticked — every group is
// listed with its word count and the learner can tick anything — so a title
// match is an acceptable default here in a way it would not be in a gate.
const GLOSSARY_GROUP_TITLE = "Words from our stories";

// The chrome of the printed sheet, and the CSS for it. Both are builders rather
// than inline markup because worksheetPageCount() below renders them into an
// off-screen probe to measure their real heights — a second copy would drift and
// the page count would quietly start lying.
function worksheetPrintChromeCss() {
  return `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 14mm; }
    body { margin: 0; color: #17324d; background: white;
           font: 3mm/1.4 Arial, Helvetica, sans-serif; }
    .cw-head { margin: 0 0 6mm; padding-bottom: 3mm; border-bottom: .4mm solid #dce4ea; }
    .cw-head span { display: block; color: #0f766e; font-weight: 700; font-size: 2.6mm;
                    text-transform: uppercase; letter-spacing: .06em; }
    .cw-head h1 { margin: 1.5mm 0 0; font-size: 6mm; line-height: 1.1; }
    .cw-head p { margin: 1.5mm 0 0; color: #5d6b80; font-size: 2.8mm; }
    .cw-name { display: flex; gap: 8mm; margin: 3mm 0 0; color: #5d6b80; font-size: 2.8mm; }
    .cw-name span { flex: 1; border-bottom: .3mm solid #b9c7d2; padding-bottom: 1mm; }
`;
}

function worksheetSheetHeaderHtml({ sentences = false, spelling = false, punctuation = false, comprehension = false, answerKey = false } = {}) {
  return `<header class="cw-head">
    <span>${escapeHtml(gradeLabel)} · Unit ${course.unit.unitNo} · ${escapeHtml(course.unit.unitTitle)}</span>
    <h1>Cursive writing practice</h1>
    <p>Trace the grey words, then write each word yourself on the line underneath.${spelling ? " Say the letters, cover the word, and write it again from memory." : ""}${sentences ? " Then copy the sentence onto the empty lines." : ""}${punctuation ? " Where a sentence has lost its capital letters and punctuation, write it out again with them put back." : ""}${comprehension ? " At the end there are texts to read with questions underneath — read each one all the way through before you answer." : ""}${answerKey ? " The answers are on the last pages — leave those to the grown-up until you have finished." : ""}</p>
    <div class="cw-name"><span>Name</span><span>Date</span></div>
  </header>`;
}

// Pages, counted per GROUP because each one starts on a fresh page.
//
// The heights are MEASURED, not derived from the geometry constants above. The
// arithmetic version was two pages out of seventeen on a six-group Grade 2 sheet,
// and the reasons are all things arithmetic cannot see: a row's trailing margin is
// dropped where a page breaks, a heading's height is its line box rather than the
// millimetres it was specified in, and the engine rounds. So the probe renders the
// real chrome, the real group heading and one real row into an off-screen 182mm
// box — mm resolve at 96dpi on screen exactly as they do in print — and asks the
// engine the question the engine will answer at print time.
//
// The probe is built and thrown away per call. It is one layout of three small
// elements, and caching it across size changes was the alternative — which is a
// stale-cache bug waiting for the first person to add a control.
// With sentence practice on, a row's height depends on how far its sentence wraps,
// so one row height is no longer enough. The probe therefore renders a plain row
// AND two sentence rows whose wrap counts it knows, and derives the cost of one
// extra wrapped line by subtraction. Derived from two real layouts rather than
// from the CSS, for the same reason the rest of this probe exists.

function worksheetProbe(geo, { groups = [], widths = new Map(), sentences = false, spelling = false, punctuation = false, grammar = null, comprehension = null, spellingKey = null, sentenceKey = null, sentenceLabels = [], answerKey = false } = {}) {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:absolute;left:-10000mm;top:0;width:182mm;visibility:hidden;pointer-events:none";
  probe.innerHTML = `<style>${worksheetPrintChromeCss()}${worksheetCss(geo, { print: true })}</style>`
    + `<div style="width:100mm" id="cw-probe-mm"></div>`
    // THE SAME HEADER THE SHEET WILL PRINT, not the bare one. It gains a sentence
    // per option — "Say the letters, cover the word…", "Then copy the sentence…" —
    // and those wrap, so the printed header is TALLER than the default. Measuring
    // the default made the estimate believe there was more room on page one than
    // there is: at Grade 4 on large lines the first row misses the page by 13px and
    // the whole sheet came out a page short. The probe was measuring a header that
    // never gets printed.
    + worksheetSheetHeaderHtml({ sentences, spelling, punctuation, comprehension: !!(comprehension && comprehension.length), answerKey })
    + `<div id="cw-probe-groups">`
    + groups.map((group, index) => worksheetGroupHtml(group, widths, geo, { first: index === 0, sentences, spelling, punctuation })).join("")
    + `</div>`
    + (grammar && grammar.length ? `<div id="cw-probe-grammar">${worksheetGrammarHtml(grammar, geo)}</div>` : "")
    + (comprehension && comprehension.length ? `<div id="cw-probe-comp">${worksheetComprehensionHtml(comprehension, geo)}</div>` : "")
    + (answerKey ? `<div id="cw-probe-answers">${worksheetAnswerKeyHtml({ grammar, comprehension, spelling: spellingKey, sentenceAnswers: sentenceKey, sentenceLabels }, geo)}</div>` : "");
  document.body.appendChild(probe);
  // WITH margins. getBoundingClientRect excludes them, and taking the row's height
  // from it while separately allowing for the gap discounted that gap twice — the
  // estimate then claimed 8 rows on a page that holds 6, and ran 8 pages short on a
  // 183-word group. The row is the one box measured bare, because its bottom margin
  // is exactly what does NOT have to fit before a break.
  const withMargins = (selector) => {
    const element = probe.querySelector(selector);
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().height
      + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
  };
  const measurement = {
    perMm: probe.querySelector("#cw-probe-mm").getBoundingClientRect().width / 100,
    sheetHeader: withMargins(".cw-head"),
    groups: [],
    grammarHeader: 0,
    grammarItems: [],
    compReadings: [],
    answerHeader: 0,
    answerItems: [],
  };
  // Every one of these is measured the same way and for the same reason: the
  // block's own box PLUS its margins, because a margin is height the packer has
  // to account for and getBoundingClientRect does not report it.
  // eslint-disable-next-line no-unused-vars
  // An ITEM: the height that must fit before a page break, and the gap after it,
  // which must not. The gap is dropped where a break lands, so folding it into the
  // height pushes an item onto the next page that would have fitted on this one.
  const itemBox = (element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0),
      gap: parseFloat(style.marginBottom) || 0,
    };
  };
  const boxHeight = (element) => {
    if (!element) return 0;
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().height
      + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
  };
  if (comprehension && comprehension.length) {
    // Per READING, because each one is a section and so starts its own page. Its
    // "head" is everything above the first question — the heading, the whole
    // passage and the instruction — and that is routinely taller than a page,
    // which the page counter below handles rather than assuming away.
    measurement.compReadings = [...probe.querySelectorAll("#cw-probe-comp .cw-comp")].map((section) => ({
      head: boxHeight(section.querySelector(".cw-group-head"))
        + boxHeight(section.querySelector(".cw-comp-aloud"))
        + boxHeight(section.querySelector(".cw-comp-passage"))
        + boxHeight(section.querySelector(".cw-comp-instruction")),
      // A question is measured WITHOUT its trailing margin, and that margin is
      // carried separately — the same split the word rows make, for the same
      // reason: the gap after the last item on a page is dropped at the break, so
      // requiring it to fit pushes an item to the next page that would have fitted
      // on this one. Grade 2 Unit 7 on large lines was one page over because of it.
      items: [...section.querySelectorAll(".cw-comp-item")].map(itemBox),
    }));
  }
  if (answerKey) {
    const section = probe.querySelector("#cw-probe-answers .cw-answers");
    if (section) {
      const head = section.querySelector(".cw-group-head");
      const style = head && getComputedStyle(head);
      measurement.answerHeader = head
        ? head.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0)
        : 0;
      measurement.answerItems = [...section.querySelectorAll(".cw-answers-item")].map(itemBox);
      const intro = section.querySelector(".cw-answers-note");
      if (intro) {
        const s3 = getComputedStyle(intro);
        measurement.answerHeader += intro.getBoundingClientRect().height + (parseFloat(s3.marginTop) || 0) + (parseFloat(s3.marginBottom) || 0);
      }
    }
  }
  if (grammar && grammar.length) {
    const section = probe.querySelector("#cw-probe-grammar .cw-grammar");
    if (section) {
      const head = section.querySelector(".cw-group-head");
      const style = head && getComputedStyle(head);
      measurement.grammarHeader = head
        ? head.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0)
        : 0;
      measurement.grammarItems = [...section.querySelectorAll(".cw-gram-item")].map(itemBox);
    }
  }
  // EVERY ROW OF EVERY CHOSEN GROUP, measured as rendered.
  //
  // This used to be a model: one bare row, plus a measured delta for spelling, plus
  // one for the first sentence line and one for each extra, plus the same pair for
  // punctuation — and a word's height was the sum. The parts were all measured, so
  // it looked like measurement, but the SUM was an assumption: that the add-ons do
  // not interact, and that no row can exceed a page. Both fail once spelling, a
  // sentence and a punctuation exercise stack on one row. At Grade 4 on large lines
  // the tallest such row is 1,099px against a 1,017px page, break-inside: avoid
  // cannot hold it, and the sheet ran a page short — while every single-option
  // configuration stayed exact, which is why it survived so long.
  //
  // Now the probe renders the same builder the print document uses, with the same
  // groups and the same measured widths, and asks the engine for each row's height.
  // There is nothing left to model, so there is nothing left to be wrong about.
  measurement.groups = [...probe.querySelectorAll("#cw-probe-groups .cw-group")].map((section) => ({
    header: boxHeight(section.querySelector(".cw-group-head")),
    // Height WITHOUT the trailing margin, and that margin carried separately: the
    // gap after the last row on a page is dropped at the break, so requiring it to
    // fit pushes a row onto the next page that would have fitted on this one.
    rows: [...section.querySelectorAll(".cw-row")].map(itemBox),
  }));
  probe.remove();
  return measurement;
}

function worksheetPageCount(chosenGroups, geo, { widths = new Map(), sentences = false, spelling = false, punctuation = false, grammar = null, comprehension = null, spellingKey = null, sentenceKey = null, sentenceLabels = [], answerKey = false } = {}) {
  if (!chosenGroups.length && !(grammar && grammar.length) && !(comprehension && comprehension.length)) return 0;
  const probe = worksheetProbe(geo, { groups: chosenGroups, widths, sentences, spelling, punctuation, grammar, comprehension, spellingKey, sentenceKey, sentenceLabels, answerKey });
  if (!probe.perMm) return 0;
  const pageHeight = SHEET_H * probe.perMm;
  // One packer, over measured boxes. Every section is the same shape now — a
  // header, then a run of items that each have to fit whole — so grammar,
  // comprehension, the answer key and the word groups all go through this.
  const pack = (header, items, extraLead = 0) => {
    let pages = 1;
    let left = pageHeight - header - extraLead;
    // A lead taller than the page — a comprehension passage — spills like an item.
    if (left < 0) {
      const spilled = Math.ceil((header + extraLead) / pageHeight) - 1;
      pages += spilled;
      left = pageHeight - ((header + extraLead) - spilled * pageHeight);
    }
    for (const item of items) {
      if (item.height > left) { pages += 1; left = pageHeight; }
      // An item taller than a whole page cannot honour break-inside: avoid — the
      // engine breaks it regardless and it spans as many pages as it needs.
      if (item.height > pageHeight) {
        // AN OVERSIZED ITEM DOES NOT SHARE ITS LAST PAGE. break-inside: avoid
        // cannot hold a block taller than the page, so the engine breaks it — but
        // it does not then flow the next item alongside the remainder. Modelling
        // the leftover as usable space (pageHeight minus the overhang) was one
        // page short per oversized row, which is how a Grade 4 sheet on large
        // lines came out four pages under across 156 rows.
        //
        // Derived from the produced PDFs, not from the spec: the two groups that
        // disagreed predict 8 and 162 under this rule and 7 and 158 under the
        // sharing one, and the PDFs are 8 and 162.
        pages += Math.ceil(item.height / pageHeight) - 1;
        left = 0;
      } else {
        left -= item.height;
        left -= item.gap || 0;
      }
    }
    return pages;
  };
  let pages = 0;
  // Every group starts a page; the first shares its page with the sheet header.
  probe.groups.forEach((group, index) => {
    pages += pack(group.header, group.rows, index === 0 ? probe.sheetHeader : 0);
  });
  // Grammar follows the word groups on a page of its own; each reading of the
  // comprehension is a section of its own after that; the answer key is last. All
  // three are a header and a run of unsplittable items, which is what the word
  // groups are, so all four go through the same packer over the same measured
  // boxes. There is one page-breaking rule on this sheet now, not four copies of
  // it that could drift.
  if (probe.grammarItems.length) pages += pack(probe.grammarHeader, probe.grammarItems);
  for (const reading of probe.compReadings) pages += pack(reading.head, reading.items);
  if (probe.answerItems.length) pages += pack(probe.answerHeader, probe.answerItems);
  return pages;
}

function renderCursiveWorksheet() {
  // Grades 5-8 have no card for this page, but a hidden card is not a closed
  // route — the hash is typeable and was reachable at every grade. renderYearPlan
  // bounces the same way for the same reason: the decision is "this page does not
  // exist here", and a page that only LOOKS absent drifts back into use.
  if (!BOTH_DESIGNS) return navigate("overview");
  const groups = worksheetGroups();
  const chosen = new Set(groups.filter((group) => group.title !== GLOSSARY_GROUP_TITLE).map((group) => group.id));
  if (!chosen.size && groups.length) chosen.add(groups[0].id);
  let size = defaultWorksheetSize();
  // Off by default: a sentence under every word roughly triples the sheet, and a
  // learner who wanted the words alone should not have to turn it off.
  let sentences = false;
  let spelling = false;
  let punctuation = false;
  let grammar = false;
  let comprehension = false;
  let answerKey = false;
  const grammarItems = worksheetGrammar();
  const compReadings = worksheetComprehension();
  const compQuestions = compReadings.reduce((total, reading) => total + reading.questions.length, 0);
  // The answer key covers whichever of the two is switched on, so its box needs
  // both to have something to answer before it can offer anything.
  const hasGrammarAnswers = grammarItems.some((item) => item.answers.length);
  const hasCompAnswers = compReadings.some((reading) => reading.questions.some((question) => question.answer));
  // Whether the control exists at all, asked of EVERY group rather than the ticked
  // ones: the box has to be in the markup before anything is ticked, and a learner
  // can tick a spelling group later.
  const hasSpellingWords = groups.some((group) => group.words.some((word) => group.spellings?.get(word)));
  const hasPunctuationSentences = groups.some((group) => group.words.some((word) => group.sentences?.get(word)));
  // Spelling is the third source, and unlike the other two its availability
  // depends on WHICH groups are ticked — untick every group with spelling words
  // and there is nothing to key, so it is asked at draw time rather than once.
  const spellingKeyOf = (picked) => (spelling ? worksheetSpellingKey(picked) : []);
  // Either exercise wants the same answers, so one lookup serves both and the
  // labels say which are switched on.
  const sentenceAnswersOf = (picked) => ((sentences || punctuation) ? worksheetSentenceAnswers(picked) : []);
  const sentenceLabelsNow = () => [sentences && "copy", punctuation && "punctuate"].filter(Boolean);
  // WHAT THE KEY ACTUALLY COVERS, asked of the currently ticked options and the
  // currently ticked groups. Three things read this — the summary above the print
  // button, the hint under the tick box and the note printed at the top of the key
  // — and they must agree, because they are three descriptions of one section.
  // The hint and the note drifted apart when spelling was added; a third
  // hand-written copy for the summary would have been the same defect again.
  const keyCoversOf = (picked) => {
    const hasSentenceAnswers = sentenceAnswersOf(picked).length > 0;
    return [
      grammar && hasGrammarAnswers && "grammar",
      comprehension && hasCompAnswers && "comprehension",
      spelling && spellingKeyOf(picked).length && "spelling",
      // Named per EXERCISE even though they share one block, because the learner
      // ticked two different boxes and the key has to answer for both by name.
      hasSentenceAnswers && sentences && "sentences",
      hasSentenceAnswers && punctuation && "punctuation",
    ].filter(Boolean);
  };
  const keyAvailable = () => keyCoversOf(selectedGroups()).length > 0;
  let widths = new Map();

  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · Unit ${course.unit.unitNo}`,
    "Cursive writing worksheet",
    "Print this and write each word by hand as you learn it. Trace the grey words first, then write the word yourself on the line underneath.",
    "For learners",
  )}
    <div class="section-stack">
      <section class="panel">
        <h2>Choose your words</h2>
        <p>Tick the word groups you want on the sheet.</p>
        <div class="cw-groups">${groups.map((group) => `<label class="cw-check"><input type="checkbox" data-cw-group="${escapeHtml(group.id)}" ${chosen.has(group.id) ? "checked" : ""}><span><strong>${escapeHtml(group.title)}</strong><small>${group.words.length} word${group.words.length === 1 ? "" : "s"}</small></span></label>`).join("")}</div>
      </section>
      <section class="panel">
        <h2>Choose your line size</h2>
        <div class="cw-sizes">${Object.entries(WORKSHEET_SIZES).map(([key, value]) => `<label class="cw-check"><input type="radio" name="cw-size" value="${key}" ${key === size ? "checked" : ""}><span><strong>${escapeHtml(value.label)}</strong><small>${escapeHtml(value.note)}</small></span></label>`).join("")}</div>
      </section>
      <section class="panel">
        <h2>What to practise</h2>
        <p>Every word is traced and written on its own. You can add more under each one.</p>
        <div class="cw-sizes">
          <label class="cw-check"><input type="checkbox" id="cw-opt-spelling" ${spelling ? "checked" : ""}><span><strong>Spelling</strong><small>say the letters, then write the word from memory</small></span></label>
          <label class="cw-check"><input type="checkbox" id="cw-opt-sentences" ${sentences ? "checked" : ""}><span><strong>A sentence to copy</strong><small>the sentence the word comes from — a much longer sheet</small></span></label>
          <label class="cw-check"><input type="checkbox" id="cw-opt-punctuation" ${punctuation ? "checked" : ""}><span><strong>Punctuation</strong><small>the same sentence with its capitals and stops taken out, to put back</small></span></label>
          ${grammarItems.length ? `<label class="cw-check"><input type="checkbox" id="cw-opt-grammar" ${grammar ? "checked" : ""}><span><strong>Grammar</strong><small>this unit's ${grammarItems.length} grammar exercises, on their own pages at the end</small></span></label>` : ""}
          ${compReadings.length ? `<label class="cw-check"><input type="checkbox" id="cw-opt-comprehension" ${comprehension ? "checked" : ""}><span><strong>Reading comprehension</strong><small>${compReadings.length} text${compReadings.length === 1 ? "" : "s"} printed in full with ${compQuestions} question${compQuestions === 1 ? "" : "s"} — much the longest thing you can add</small></span></label>` : ""}
          ${hasGrammarAnswers || hasCompAnswers || hasSpellingWords || hasPunctuationSentences ? `<label class="cw-check is-disabled"><input type="checkbox" id="cw-opt-answers" disabled><span><strong>Answer key</strong><small></small></span></label>` : ""}
        </div>
      </section>
      <section class="panel">
        <h2>Your sheet</h2>
        <p id="cw-summary" role="status" aria-live="polite">Getting the handwriting ready…</p>
        <div class="cw-preview" id="cw-preview"></div>
        <button class="button primary" id="cw-print" type="button" disabled>${icon("printer")} Print worksheet</button>
      </section>
    </div>
    <style id="cw-style"></style>`;

  const selectedGroups = () => groups.filter((group) => chosen.has(group.id));
  const selectedWords = () => selectedGroups().flatMap((group) => group.words);

  const draw = () => {
    const geo = worksheetGeometry(size);
    const picked = selectedGroups();
    const words = selectedWords();
    const pages = worksheetPageCount(picked, geo, { widths, sentences, spelling, punctuation, grammar: grammar ? grammarItems : null, comprehension: comprehension ? compReadings : null, spellingKey: spellingKeyOf(picked), sentenceKey: sentenceAnswersOf(picked), sentenceLabels: sentenceLabelsNow(), answerKey: answerKey && keyAvailable() });
    $("#cw-style").textContent = worksheetCss(geo, { print: false });
    const extras = [spelling && "spelling practice", sentences && "a sentence to copy", punctuation && "punctuation to put back"].filter(Boolean);
    const added = [
      grammar && grammarItems.length && `${grammarItems.length} grammar exercise${grammarItems.length === 1 ? "" : "s"}`,
      comprehension && compReadings.length && `${compReadings.length} text${compReadings.length === 1 ? "" : "s"} to read with ${compQuestions} question${compQuestions === 1 ? "" : "s"}`,
    ].filter(Boolean);
    // Phrased as a list rather than a sentence with a verb: the parts are counts
    // that can each be one or many, and every verb form is wrong for one of them.
    //
    // The answer key is named SEPARATELY from that list, and says what it covers.
    // It used to be a suffix on the list — so with Spelling and the answer key on
    // and no grammar or comprehension, the list was empty, the whole clause was
    // dropped and the summary never mentioned the key at all, while quietly
    // counting its pages. And when it did appear it said only "then the answer
    // key", which is the one thing about it nobody needs telling.
    const keyParts = answerKey ? keyCoversOf(picked) : [];
    const keyPhrase = keyParts.length ? `the answer key — ${listPhrase(keyParts)}` : "";
    const tail = added.length
      ? ` At the end: ${listPhrase(added)}${keyPhrase ? `, then ${keyPhrase}` : ""}.`
      : keyPhrase ? ` At the back: ${keyPhrase}.` : "";
    $("#cw-summary").textContent = words.length
      ? `${words.length} word${words.length === 1 ? "" : "s"}${extras.length ? ", each with " + (extras.length > 1 ? extras.slice(0, -1).join(", ") + " and " + extras[extras.length - 1] : extras[0]) : ""} in ${picked.length} group${picked.length === 1 ? "" : "s"} · about ${pages} page${pages === 1 ? "" : "s"} of A4. Each group starts on its own page.${tail}`
      : "Tick at least one group of words to make a sheet.";
    // The first group's heading and its first two words, so the preview shows the
    // shape of a page rather than a pair of loose lines. Drawn by the same builders
    // the print document uses, so it cannot show a sheet the printer will not
    // produce.
    $("#cw-preview").innerHTML = picked[0] ? worksheetGroupHtml(picked[0], widths, geo, { first: true, rows: 2, sentences, spelling, punctuation }) : "";
    $("#cw-print").disabled = !words.length;
  };

  const refreshWidths = () => { widths = measureCursive(selectedWords()); };

  loadCursiveFace().then(() => { refreshWidths(); draw(); }).catch(() => {
    $("#cw-summary").textContent = "The handwriting font could not be loaded, so the worksheet cannot be drawn. Check your connection and open this page again.";
  });

  $$('[data-cw-group]').forEach((box) => box.addEventListener("change", () => {
    if (box.checked) chosen.add(box.dataset.cwGroup); else chosen.delete(box.dataset.cwGroup);
    refreshWidths();
    // Untick the last group that sets spellings and the key loses its only
    // source, so the control has to be re-asked here as well as on the options.
    drawOptions();
    draw();
  }));
  $$('input[name="cw-size"]').forEach((radio) => radio.addEventListener("change", () => { size = radio.value; draw(); }));
  $("#cw-opt-sentences").addEventListener("change", (event) => { sentences = event.target.checked; drawOptions(); draw(); });
  $("#cw-opt-spelling").addEventListener("change", (event) => { spelling = event.target.checked; drawOptions(); draw(); });
  $("#cw-opt-punctuation").addEventListener("change", (event) => { punctuation = event.target.checked; drawOptions(); draw(); });
  // The answer key follows the grammar exercises, so its control follows the
  // grammar checkbox: enabled when there are exercises to answer, and saying why
  // when there are not. Turning grammar OFF also clears the answer key rather than
  // leaving it ticked and inert — a ticked box that does nothing is worse than a
  // disabled one, because it claims the sheet has something it does not.
  const drawOptions = () => {
    const box = $("#cw-opt-answers");
    if (!box) return;
    const available = keyAvailable();
    box.disabled = !available;
    box.closest(".cw-check")?.classList.toggle("is-disabled", !available);
    if (!available) { answerKey = false; box.checked = false; }
    const hint = box.closest(".cw-check")?.querySelector("small");
    if (hint) {
      const covers = keyCoversOf(selectedGroups());
    const offer = [hasGrammarAnswers && "Grammar", hasCompAnswers && "Reading comprehension", hasSpellingWords && "Spelling", hasPunctuationSentences && "A sentence to copy", hasPunctuationSentences && "Punctuation"].filter(Boolean);
      hint.textContent = available
        ? `${answerKeyCovers(covers)}, at the very back, for whoever marks it`
        : `turn on ${offer.length > 1 ? `${offer.slice(0, -1).join(", ")} or ${offer[offer.length - 1]}` : offer[0]} first — the answers are to those exercises`;
    }
  };
  $("#cw-opt-grammar")?.addEventListener("change", (event) => { grammar = event.target.checked; drawOptions(); draw(); });
  $("#cw-opt-comprehension")?.addEventListener("change", (event) => { comprehension = event.target.checked; drawOptions(); draw(); });
  $("#cw-opt-answers")?.addEventListener("change", (event) => { answerKey = event.target.checked; draw(); });
  // The hint above is written by drawOptions rather than by the markup, because it
  // now names whichever sources are switched on. Run it once so the box does not
  // sit there disabled with an empty explanation.
  drawOptions();
  $("#cw-print").addEventListener("click", () => printCursiveWorksheet(selectedGroups(), size, widths, { sentences, spelling, punctuation, grammar: grammar ? grammarItems : null, comprehension: comprehension ? compReadings : null, spellingKey: spellingKeyOf(selectedGroups()), sentenceKey: sentenceAnswersOf(selectedGroups()), sentenceLabels: sentenceLabelsNow(), answerKey: answerKey && keyAvailable() }));
  icons();
}

function printCursiveWorksheet(chosenGroups, size, widths, { sentences = false, spelling = false, punctuation = false, grammar = null, comprehension = null, spellingKey = null, sentenceKey = null, sentenceLabels = [], answerKey = false } = {}) {
  const words = chosenGroups.flatMap((group) => group.words);
  if (!words.length) return;
  const printWindow = window.open("", "_blank", "popup=yes,width=900,height=1000,resizable=yes,scrollbars=yes");
  if (!printWindow) {
    toast("Allow pop-ups to print this worksheet.");
    return;
  }
  const geo = worksheetGeometry(size);
  const title = `Cursive writing · ${gradeLabel} Unit ${course.unit.unitNo}`;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)} | Ehel Academy English</title>
      <style>
        /* font-display:block, not swap: a fallback flash is cosmetic on screen
           but on paper it is the whole worksheet printed in the wrong hand. The
           print() call below waits on document.fonts.ready for the same reason. */
        @font-face { font-family: "${CURSIVE_FAMILY}"; font-weight: 400 700; font-display: block;
                     src: url("${CURSIVE_FONT_URL}") format("woff2"); }
        ${worksheetPrintChromeCss()}
        ${worksheetCss(geo, { print: true })}
      </style>
    </head>
    <body>
      ${worksheetSheetHeaderHtml({ sentences, spelling, punctuation, comprehension: !!(comprehension && comprehension.length), answerKey })}
      ${chosenGroups.map((group, index) => worksheetGroupHtml(group, widths, geo, { first: index === 0, sentences, spelling, punctuation })).join("")}
      ${grammar && grammar.length ? worksheetGrammarHtml(grammar, geo) : ""}
      ${comprehension && comprehension.length ? worksheetComprehensionHtml(comprehension, geo) : ""}
      ${answerKey ? worksheetAnswerKeyHtml({ grammar, comprehension, spelling: spellingKey, sentenceAnswers: sentenceKey, sentenceLabels }, geo) : ""}
    </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  // Wait for the face, never for onload alone: a document that has finished
  // loading has not necessarily finished loading its FONTS, and printing early
  // renders the whole sheet in the fallback hand.
  const send = () => {
    const ready = printWindow.document.fonts?.ready || Promise.resolve();
    ready.then(() => printWindow.print()).catch(() => printWindow.print());
  };
  if (printWindow.document.readyState === "complete") send();
  else printWindow.addEventListener("load", send);
  printWindow.addEventListener("afterprint", () => printWindow.close());
}

// ===================== the handwriting animation =====================
// The worksheet's companion on screen: the same words, but showing HOW the pen
// moves rather than what the finished letter looks like. A printed model tells a
// learner where the ink ends up and nothing about where to start or which way to
// go, which is exactly what they get wrong.
//
// Every grade, 1 to 8. It covers the "Words from our stories" glossary — 283 /
// 653 / 727 / 847 / 1,023 / 1,270 / 1,398 / 1,905 distinct words by grade — which
// are the words a learner meets in a reading without ever being taught to write
// them, and that is as true at Grade 8 as at Grade 1.
//
// This is NOT the deck, and going past Grade 4 does not touch the rule that keeps
// the upper stages' design. It is a standalone reference page like the study
// plans: outside the BOTH_DESIGNS split entirely, drawing no gc-* node at any
// grade — asserted in the browser at every one of the eight, not reasoned about.
//
// No grade needed a new letterform: all 6,418 distinct words across the eight
// grades use the same a-z and the apostrophe. The single exception is "POV" at
// Grade 5 Unit 9, an acronym — see the note beside `skipped`.
//
// What grows is the LISTS. Grade 8 Unit 4 carries 392 words against 91 at Grade 2,
// which is why the list is searchable.
//
// The letterforms are NOT the printed font. A glyph is a filled contour, so
// stroking it traces the letter's edge — up one side and back down the other,
// with the dot of an i as a separate ring — and no centreline can be recovered
// from it. cursive-strokes.js authors the pen path instead; see its header.

const HANDWRITING_MAX_GRADE = 8;

// The glossary group, by the same exact title the worksheet uses. Both read the
// same constant so a rename cannot leave one of them pointing at nothing.
function handwritingWords() {
  const groups = worksheetGroups();
  const glossary = groups.find((group) => group.title === GLOSSARY_GROUP_TITLE);
  // Every word the stroke alphabet can actually write. It covers a-z and the
  // apostrophe, which across all eight grades is 6,417 of the 6,418 distinct
  // glossary words — but a word it cannot compose must be dropped rather than
  // drawn wrong, and NAMED rather than merely counted.
  //
  // The one exception in the whole course is "POV" at Grade 5 Unit 9. It is an
  // acronym, so it is not a gap in the alphabet waiting to be filled: capitals are
  // printed rather than joined, and writing POV in joined lowercase would teach
  // the wrong thing. The page says which word and why, because "1 word is not
  // shown" invites someone to go looking for a missing letterform.
  const all = (glossary?.words || []);
  const writable = all.filter((word) => cursiveCanWrite(word));
  const skippedWords = all.filter((word) => !cursiveCanWrite(word));
  return { all, writable, skippedWords, skipped: skippedWords.length, title: glossary?.title || "" };
}

// One word, drawn as the sequence of strokes the pen makes. Every stroke is its
// own <path> so each can be revealed in turn and the pen dot can ride along it.
function handwritingSvg(composed, { id }) {
  const frame = composed.frame;
  const pad = 26;
  const width = composed.width + pad * 2;
  const height = frame.desc + 40;
  const strokes = composed.strokes.map((stroke, index) => `
    <g transform="translate(${stroke.dx},0)">
      <path id="${id}-s${index}" class="hw-stroke hw-${stroke.kind}" d="${stroke.d}"/>
    </g>`).join("");
  // Ghost of the finished word, so the learner can see where the stroke is going
  // before it gets there. Drawn from the same paths — it cannot disagree.
  const ghost = composed.strokes.map((stroke) => `
    <g transform="translate(${stroke.dx},0)"><path class="hw-ghost" d="${stroke.d}"/></g>`).join("");
  return `<svg class="hw-svg" viewBox="${-pad} -12 ${width} ${height}" role="img"
      aria-label="How to write ${escapeHtml(composed.word)} in cursive">
    <line class="hw-rule" x1="${-pad}" y1="${frame.asc}" x2="${width - pad}" y2="${frame.asc}"/>
    <line class="hw-rule hw-dash" x1="${-pad}" y1="${frame.mid}" x2="${width - pad}" y2="${frame.mid}"/>
    <line class="hw-base" x1="${-pad}" y1="${frame.base}" x2="${width - pad}" y2="${frame.base}"/>
    <line class="hw-rule" x1="${-pad}" y1="${frame.desc}" x2="${width - pad}" y2="${frame.desc}"/>
    ${ghost}
    ${strokes}
    <circle class="hw-pen" id="${id}-pen" r="9" cx="0" cy="${frame.base}" opacity="0"/>
  </svg>`;
}

// Drives one word's animation. Returns a handle so the page can restart it, slow
// it down, or stop it when the learner picks another word — an animation left
// running against a detached SVG keeps calling getPointAtLength on nodes nobody
// can see, and on a 30-word page that is 30 timers.
function runHandwriting(root, composed, { id, speed = 1, onStep }) {
  const paths = composed.strokes.map((_, index) => root.querySelector(`#${id}-s${index}`));
  const pen = root.querySelector(`#${id}-pen`);
  if (paths.some((path) => !path) || !pen) return { stop() {} };
  const lengths = paths.map((path) => path.getTotalLength());
  paths.forEach((path, index) => {
    path.style.strokeDasharray = `${lengths[index]}`;
    path.style.strokeDashoffset = `${lengths[index]}`;
  });
  let frame = 0;
  let stopped = false;
  let index = 0;
  let drawn = 0;
  let last = null;

  const step = (now) => {
    if (stopped) return;
    if (last === null) last = now;
    const delta = now - last;
    last = now;
    const stroke = composed.strokes[index];
    // A join is travel, not writing, so it goes at three times the pace — the
    // pen really does move faster between letters than through them.
    const pace = (stroke.kind === "join" ? 1.1 : 0.38) * speed;
    drawn += delta * pace;
    const total = lengths[index];
    const shown = Math.min(drawn, total);
    paths[index].style.strokeDashoffset = `${total - shown}`;
    const point = paths[index].getPointAtLength(shown);
    pen.setAttribute("cx", point.x + stroke.dx);
    pen.setAttribute("cy", point.y);
    pen.setAttribute("opacity", "1");
    if (shown >= total) {
      index += 1;
      drawn = 0;
      if (index >= paths.length) {
        pen.setAttribute("opacity", "0");
        onStep?.(null);
        return;
      }
      onStep?.(index);
      // The pen LIFTS before a mark, so pause and hide it rather than sliding
      // across — the lift is the thing being taught.
      if (composed.strokes[index].kind === "mark") {
        pen.setAttribute("opacity", "0");
        frame = setTimeout(() => { last = null; frame = requestAnimationFrame(step); }, 520 / speed);
        return;
      }
    }
    frame = requestAnimationFrame(step);
  };
  onStep?.(0);
  frame = requestAnimationFrame(step);
  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(frame);
    },
  };
}

// The steps in words, one line per thing the pen does. Joins are folded into the
// letter they lead to rather than listed — "travel to the next letter" is not an
// instruction a learner acts on, and listing it doubles the length of every list.
function handwritingSteps(composed) {
  const steps = [];
  composed.strokes.forEach((stroke, index) => {
    if (stroke.kind === "join") return;
    steps.push({ index, ch: stroke.ch, say: stroke.say || "", lift: stroke.kind === "mark" });
  });
  return steps;
}

function renderHandwriting() {
  if (gradeNumber > HANDWRITING_MAX_GRADE) return navigate("overview");
  const { writable, skipped, skippedWords, title } = handwritingWords();
  let active = writable[0] || null;
  let speed = 1;
  let running = null;

  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · Unit ${course.unit.unitNo}`,
    "How to write it",
    "Watch the pen write each word, then copy it. The green dot shows where to start and which way to go.",
    "For learners",
  )}
    <div class="section-stack">
      <section class="panel">
        <h2>${escapeHtml(title || "Words from our stories")}</h2>
        <p>${writable.length} word${writable.length === 1 ? "" : "s"} from this unit's stories. Tap one to see it written.</p>
        <label class="search-box hw-search">${icon("search")}<input id="hw-filter" type="search" placeholder="Find a word" aria-label="Find a word to write" aria-controls="hw-words"></label>
        <div class="hw-words" id="hw-words"></div>
        ${skipped ? `<p class="hw-note">${skipped === 1 ? "One word is" : `${skipped} words are`} not shown here: ${escapeHtml(skippedWords.join(", "))}. ${skipped === 1 ? "It is written" : "They are written"} in capitals, which are printed rather than joined up.</p>` : ""}
      </section>
      <section class="panel" id="hw-stage"></section>
    </div>`;

  const drawStage = () => {
    running?.stop();
    running = null;
    if (!active) { $("#hw-stage").innerHTML = `<p>No words from the stories in this unit yet.</p>`; return; }
    const composed = cursiveWord(active);
    if (!composed) { $("#hw-stage").innerHTML = `<p>${escapeHtml(active)} cannot be drawn yet.</p>`; return; }
    const steps = handwritingSteps(composed);
    $("#hw-stage").innerHTML = `
      <div class="hw-head"><h2>${escapeHtml(active)}</h2>
        <div class="hw-actions">
          <button class="button secondary" id="hw-replay" type="button">${icon("rotate-ccw")} Watch again</button>
          <button class="button secondary" id="hw-slow" type="button" aria-pressed="${speed < 1}">${icon("gauge")} ${speed < 1 ? "Normal speed" : "Slower"}</button>
        </div>
      </div>
      ${handwritingSvg(composed, { id: "hw" })}
      <ol class="hw-steps">${steps.map((step) => `<li data-step="${step.index}"><b>${escapeHtml(step.ch)}</b><span>${escapeHtml(step.say)}</span></li>`).join("")}</ol>`;
    const markStep = (strokeIndex) => {
      $$("#hw-stage .hw-steps li").forEach((li) => li.classList.remove("is-now"));
      if (strokeIndex === null) return;
      // A join has no step of its own, so highlight the letter it leads to.
      const next = steps.find((step) => step.index >= strokeIndex);
      if (next) $(`#hw-stage .hw-steps li[data-step="${next.index}"]`)?.classList.add("is-now");
    };
    const play = () => {
      running?.stop();
      running = runHandwriting($("#hw-stage"), composed, { id: "hw", speed, onStep: markStep });
    };
    $("#hw-replay").addEventListener("click", play);
    $("#hw-slow").addEventListener("click", () => { speed = speed < 1 ? 1 : 0.45; drawStage(); });
    icons();
    play();
  };

  // The chips are redrawn on every keystroke, so the click handler is delegated
  // rather than rebound — rebinding per chip leaks a listener per keystroke on a
  // 183-word Grade 3 list, and the handler would be lost on the next filter.
  const drawWords = (query = "") => {
    const needle = query.trim().toLowerCase();
    const shown = needle ? writable.filter((word) => word.toLowerCase().includes(needle)) : writable;
    $("#hw-words").innerHTML = shown.length
      ? shown.map((word) => `<button class="hw-word${word === active ? " active" : ""}" data-hw="${escapeHtml(word)}" type="button">${escapeHtml(word)}</button>`).join("")
      : `<p class="hw-note">No word here matches “${escapeHtml(query.trim())}”.</p>`;
  };
  $("#hw-words").addEventListener("click", (event) => {
    const button = event.target.closest("[data-hw]");
    if (!button) return;
    active = button.dataset.hw;
    $$("#hw-words [data-hw]").forEach((other) => other.classList.toggle("active", other === button));
    drawStage();
  });
  $("#hw-filter").addEventListener("input", (event) => drawWords(event.target.value));
  drawWords();
  drawStage();
  icons();
}

// ===================== the grade dictionary =====================
// Every word the grade teaches, in one alphabetical list, reachable without
// walking the units.
//
// The per-unit Vocabulary section owns the TEACHING — the practice sentences,
// the spelling drill, "I know this word" — and this owns LOOKING SOMETHING UP.
// They are not the same job, and until now only the first existed: a learner
// who meets a word in Unit 9 and half-remembers it from Unit 2 had nowhere to
// go, because dictionaryLinks are per unit and a unit only ever shows its own.
// That gap widened with the Reading & Story expansion — Grade 8 now teaches
// 2,184 words and no single unit shows more than a tenth of them.
//
// It reads `dictionary` (the master file) directly rather than linkedWords(),
// which is what makes it grade-wide: load() already fetches the whole file for
// the grade, so the page costs no extra request.
//
// Deliberately NOT a teaching step: nonCountable, and absent from
// SECTION_CHAIN, so sectionUnlocked() finds no index for it and it is always
// open — the standing the two study plans and the worksheet already have.
// Nothing here ticks, so nothing here moves a percentage.
//
// One design at every grade, like the study plans. A reference page is scanned,
// not walked, so it is outside the deck/original split (BOTH_DESIGNS) entirely
// and draws no gc-* node at any stage.
//
// NO word pictures, unlike the per-unit page. That page draws one because it
// shows one unit's words; this shows the grade's, and 2,184 inline SVGs is a
// page that takes seconds to paint for a picture beside maybe a third of them.
// The picture belongs where the word is taught.

// Sorted by the word as it is SHOWN. Sorting on `lemma` looks equivalent and is
// not: where displayWord differs from lemma the entry would file under a letter
// the learner cannot see, and they would look for it where it is not.
function gradeDictionaryEntries() {
  const seen = new Set();
  return (dictionary.entries || [])
    .filter((entry) => {
      if (!entry?.displayWord) return false;
      // One row per word AND part of speech: the master file carries a separate
      // entry per sense (…-noun-01, …-verb-01) and both belong here, but a word
      // taught in two units arrives twice identically, and a dictionary that
      // lists "harvest" twice under "noun" reads as a bug rather than a sense.
      const key = `${String(entry.displayWord).toLowerCase()}|${entry.partOfSpeech || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(a.displayWord).localeCompare(String(b.displayWord), "en", { sensitivity: "base" }));
}

function renderGradeDictionary() {
  const esc = escapeHtml;
  const entries = gradeDictionaryEntries();
  const letterOf = (entry) => {
    const first = String(entry.displayWord).trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(first) ? first : "#";
  };
  // Grouped in one pass over the already-sorted list, so the headings follow the
  // sort rather than being a second opinion about it.
  const groups = [];
  entries.forEach((entry, index) => {
    const letter = letterOf(entry);
    if (!groups.length || groups[groups.length - 1].letter !== letter) groups.push({ letter, rows: [] });
    groups[groups.length - 1].rows.push({ entry, index });
  });
  // `.word-row` gives the two-column row and `.icon-button` the speaker, both
  // already in the shared stylesheet — this page adds no CSS, which matters
  // because course-ui.css is @imported by the other five subjects and editing it
  // makes every one of their app tiers stale.
  //
  // The inline text-transform is the one exception: `.word-row small` is
  // capitalize, which is right for the part of speech it was built for and wrong
  // for a sentence-shaped meaning ("A Small Soft Bag Or Pocket").
  const rowHtml = ({ entry, index }) => `<div class="word-row" data-gd-row="${index}" data-gd-term="${esc(`${entry.displayWord} ${entry.canonicalMeaning || ""}`.toLowerCase())}">
      <span><strong lang="en">${esc(entry.displayWord)}</strong><small style="text-transform: none;">${esc(entry.partOfSpeech || "")}${entry.canonicalMeaning ? ` · ${esc(entry.canonicalMeaning)}` : ""}</small></span>
      ${entry.audio?.available ? `<button class="icon-button" type="button" data-gd-audio="${index}" aria-label="Listen to ${esc(entry.displayWord)}">${icon("volume-2")}</button>` : "<span></span>"}
    </div>`;
  const groupsHtml = groups.map((group) => `<div class="gd-group" data-gd-group="${esc(group.letter)}"><h3>${esc(group.letter)}</h3>${group.rows.map(rowHtml).join("")}</div>`).join("");
  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · Dictionary`,
    `Every word in ${gradeLabel}`,
    "Look up any word this grade teaches, from any unit. Search for it, or scroll to its letter. This page is only for looking things up — nothing here is a step you have to finish.",
    `${entries.length} words`,
  )}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="gd-search" type="search" placeholder="Search any word or meaning" aria-label="Search the grade dictionary"></label><span id="gd-count" class="status-chip">${entries.length} words</span></div>
    <section class="panel word-list" id="gd-list">${groupsHtml || `<div class="empty">This grade has no dictionary words yet.</div>`}</section>`;
  const rows = $$("[data-gd-row]");
  const search = $("#gd-search");
  const applyFilter = () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row) => {
      const match = !query || row.dataset.gdTerm.includes(query);
      row.hidden = !match;
      if (match) shown += 1;
    });
    // A letter heading with nothing under it is a heading that lies about what
    // the page holds, so it goes when its last row does.
    $$("[data-gd-group]").forEach((group) => { group.hidden = !group.querySelector("[data-gd-row]:not([hidden])"); });
    $("#gd-count").textContent = `${shown} word${shown === 1 ? "" : "s"}`;
  };
  search.addEventListener("input", applyFilter);
  $$("[data-gd-audio]").forEach((button) => button.addEventListener("click", () => {
    const entry = entries[Number(button.dataset.gdAudio)];
    if (entry?.audio?.available) playAudio(entry.audio.normal, { button });
  }));
}

// ===================== student resources =====================
// The learner's counterpart to the Teacher resources button, and the same
// shape: a switch under the section list that leads to one page. It collects
// what a learner (or the grown-up beside them) may want to reach DIRECTLY
// rather than by walking the gated chain — the two study plans, the books, the
// word cards, the games, the progress page.
//
// It links; it never restates. Every card navigates to the section that already
// owns the material, so nothing here can drift from what it describes. A card is
// drawn only for material this unit actually has — the same rule
// visibleSections() applies to the nav — and a card whose section is not open
// yet says so rather than leading the learner to a locked page.
//
// Every grade, and the per-unit filtering is what makes that safe: Books appears
// only where unitEbooks() finds one (Grades 1-3 today), Games only where the
// unit ships a game pack. Nothing here is grade-gated by hand, so a grade that
// gains books gains the card with them.
//
// One design at every grade, deliberately. This is a reference page like the
// study plans, not a taught section, so it is outside the deck/original split
// (BOTH_DESIGNS) entirely and draws no gc-* node at any stage.

// Card titles come from the nav's own table rather than being retyped, so a
// card and the entry it opens can never call the same thing two names — the
// learner reads "Vocabulary" here and finds "Vocabulary" in the list.
const navLabelOf = (id, fallback = "") => (sections.find(([sectionId]) => sectionId === id) || [])[2] || fallback;

// The page is grouped into categories, in this order. A card carries a
// `category`; one that names none falls into the first, so a card added later
// lands somewhere sensible rather than vanishing. A category with no cards is
// not drawn at all — which is what keeps Worksheets off the page at Grades 5-8
// and on the Prerequisite unit, with no grade test written here.
const STUDENT_CATEGORIES = [
  ["learning", "Learning", "Open any of these whenever you like."],
  ["worksheets", "Handwriting", "Learn to write this unit's words — on screen, or printed to write on by hand."],
];

function studentResourceCards() {
  // The Prerequisite unit has no unit content to point at: its two pages are
  // the exam and the year plan, and renderYearPlan/renderPlacementExam bounce
  // any other unit back to the overview, so the normal list would be links to
  // pages that redirect.
  if (isPrereqUnit) {
    return [
      { route: "placement", iconName: "clipboard-check", title: placementExam?.kind === "readiness" ? "Readiness check" : "Placement exam", blurb: "A short exam that finds the best place for you to start. You can try it as many times as you like." },
      { route: "year-plan", iconName: "calendar-days", title: `${gradeLabel} Study Plan`, blurb: "The whole year: every unit, the weeks it takes and the words it teaches." },
    ];
  }
  const books = unitEbooks().length;
  const cards = [
    { route: "unit-plan", iconName: "calendar-days", title: navLabelOf("unit-plan", "Unit Study Plan"), blurb: "What to do each day of this unit, from the video lesson to the quiz." },
    // The grade plan lives on the Prerequisite unit, so this one leaves the
    // page rather than navigating — a route here would redirect (renderYearPlan
    // returns to the overview outside that unit).
    { href: courseLocation(PREREQ_UNIT, "year-plan"), iconName: "map", title: `${gradeLabel} Study Plan`, blurb: "The whole year at a glance: every unit and what it brings." },
    // "a picture where there is one", not "with a picture": word-pictures.js
    // only draws a picture that can BE the word, so the promise has to survive
    // the words it cannot describe — which is most of them by Grade 8, where the
    // vocabulary is abstract. One wording for all eight grades, because it is
    // true at all eight.
    { route: "dictionary", iconName: "book-a", title: navLabelOf("dictionary", "Vocabulary"), blurb: "Every new word in this unit, with a picture where there is one, its meaning and a voice to listen to." },
    // The grade's whole word list, and always open — unlike the card above,
    // which is this unit's words and locks with the section. Looking a word up
    // is the case the unit page cannot serve: a learner who half-remembers a
    // word has usually met it in some OTHER unit, and by Grade 8 no single unit
    // holds more than a tenth of what the grade teaches.
    { route: "grade-dictionary", iconName: "book-open-text", title: `${gradeLabel} Dictionary`, blurb: `Look up any word ${gradeLabel} teaches, from any unit — its meaning, and a voice to listen to.` },
  ];
  if (books) cards.push({ route: "ebooks", iconName: "library-big", title: navLabelOf("ebooks", "Books"), blurb: `${books === 1 ? "A story book" : `${books} story books`} to read or listen to, with pictures that move when you tap them.` });
  if (gamePack) cards.push({ route: "games", iconName: "gamepad-2", title: navLabelOf("games", "Games"), blurb: "Play with this unit's words and sentences until they stick." });
  cards.push({ route: "reflect", iconName: "sparkles", title: navLabelOf("reflect", "My progress"), blurb: "See what you have finished in this unit, and what comes next." });
  cards.push({ route: "live", iconName: "video", title: navLabelOf("live", "Live sessions"), blurb: "When your class meets your teacher online, the link is here." });
  // Grades 1-4 only, on the same line the picture dictionary and the picture
  // books already draw — see the worksheet section above for why.
  if (BOTH_DESIGNS) cards.push({ category: "worksheets", route: "worksheet", iconName: "pen-line", title: "Cursive writing worksheet", blurb: "Print this unit's words on handwriting lines. Trace each word, then write it yourself." });
  // Grades 1-2 only, and its own constant rather than BOTH_DESIGNS: the printable
  // runs to Grade 4, this covers the story glossary and stops at 2.
  if (gradeNumber <= HANDWRITING_MAX_GRADE) cards.push({ category: "worksheets", route: "handwriting", iconName: "pen-tool", title: "How to write it", blurb: "Watch the pen write each word from this unit's stories, and see where to start." });
  return cards;
}

function renderStudentResources() {
  const cardHtml = (card) => {
    const locked = card.route ? !sectionUnlocked(card.route) : false;
    const action = locked
      ? `<small>${icon("lock")} Opens when you get there</small>`
      : card.href
        ? `<a class="button secondary" href="${card.href}">Open ${icon("arrow-right")}</a>`
        : `<button class="button secondary" data-go="${escapeHtml(card.route)}" type="button">Open ${icon("arrow-right")}</button>`;
    return `<article class="panel final-section-card student-resource-card${locked ? " is-locked" : ""}">
      <span>${icon(card.iconName)}</span>
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.blurb)}</p>
      ${action}
    </article>`;
  };
  const all = studentResourceCards();
  const groups = STUDENT_CATEGORIES.map(([id, title, blurb]) => {
    // A card with no category belongs to the first one, so nothing can be added
    // later and quietly disappear off the page.
    const cards = all.filter((card) => (card.category || STUDENT_CATEGORIES[0][0]) === id);
    if (!cards.length) return "";
    return `<section class="student-resource-group">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(blurb)}</p>
      <div class="final-section-grid">${cards.map(cardHtml).join("")}</div>
    </section>`;
  }).join("");
  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · ${isPrereqUnit ? "Prerequisite unit" : `Unit ${course.unit.unitNo}`}`,
    "Student resources",
    "Everything here is for you. Open any of them whenever you like — none of them is a step you have to finish first.",
    "For learners",
  )}
    <div class="final-quiz-intro">
      ${groups}
      <section class="panel"><h2>Stuck on something?</h2><p>Press <strong>Wehel Tutor</strong> at the bottom of any page and ask. Wehel knows which page you are on, so you can say “I don't understand this” and get help there and then.</p></section>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  icons();
}

// The switch itself, repainted on every nav render for the same reason the
// teacher switch is: the shell's `route` is current at nav time, this module's
// copy is not set until onBeforeRender, which runs after. It is drawn by
// english/index.html at every grade, so nothing here shows or hides it.
function paintStudentSwitch() {
  const button = $("#student-switch");
  if (!button) return;
  button.classList.toggle("active", shellCtx?.route === "student");
}

function renderTeacher() {
  const assignment = course.assignments[0];
  $("#app").innerHTML = `${pageHeader("Teacher view", `Unit ${course.unit.unitNo} teaching resources`, "Implementation view for lesson delivery, assessment evidence and curriculum alignment.", "AI-assisted review · sign-off pending")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Curriculum status</h2><p><strong>${escapeHtml(cambridgeLabel(gradeNumber))}.</strong> Content, progression and assessment guidance follow this framework. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
      <section class="panel teacher-banner"><h2>${escapeHtml(assignment.title)}</h2><p>${escapeHtml(assignment.instructions)}</p><p><strong>${assignment.marks} marks</strong> · ${escapeHtml(assignment.submissionType)} · Rubrics: ${escapeHtml(assignment.rubricIds)}</p></section>
      <section class="panel"><h2>Outcome alignment</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>ID</th><th>Learning outcome</th><th>Evidence</th></tr></thead><tbody>${course.outcomes.map((outcome) => `<tr><td>${escapeHtml(outcome.outcomeId.split("-").pop())}</td><td>${escapeHtml(outcome.learningOutcome)}</td><td>${escapeHtml(outcome.evidenceOfLearning)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Teaching notes</h2>${course.teacherNotes.map((note) => `<details><summary>${escapeHtml(note.noteType)}</summary><p class="reading-text" style="font-family:inherit;font-size:14px">${escapeHtml(note.note)}</p></details>`).join("")}</section>
      ${gamesTeacherPanel()}
      ${finalQuizTeacherPanel()}
      <section class="panel"><h2>Answer key and guidance</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Content</th><th>Type</th><th>Reviewed answer or guidance</th></tr></thead><tbody>${course.answerKey.map((answer) => `<tr><td>${escapeHtml(answer.contentId)}</td><td>${escapeHtml(answer.contentType)}</td><td>${escapeHtml(answer.answerOrGuidance)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Rubric criteria</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Target</th><th>Criterion</th><th>Beginning</th><th>Secure</th><th>Marks</th></tr></thead><tbody>${course.rubrics.map((rubric) => `<tr><td>${escapeHtml(rubric.target)}</td><td>${escapeHtml(rubric.criterion)}</td><td>${escapeHtml(rubric.level1)}</td><td>${escapeHtml(rubric.level4)}</td><td>${rubric.maximumMarks}</td></tr>`).join("")}</tbody></table></div></section>
    </div>`;
}
// ===================== stores + config + boot =====================
// The two English-only stores load here (their load fns are hoisted above).
const finalQuizProgress = loadFinalQuizProgress();
const placementProgress = loadPlacementProgress();
const aiState = loadAIState();

const config = {
  subjectKey: "english",
  param: "grade",
  mediaSubject: "english",
  ttsPurpose: "ehel_english",
  disableShellVoice: true, // English runs its own audio engine (file-based + TTS/STT)
  // Grade 1's Unit 0 is withdrawn from learners — see the `defaultUnit`
  // comment near the top of this file. Every grade opens at Unit 1.
  defaultUnit: () => 1,
  sections,
  // `ai` is here because Wehel Tutor is help, not a lesson. Counting it meant a
  // learner who had done all twelve teaching sections but never chatted sat at
  // 92% and could not open the next unit — a support tool gating progression.
  // It stays in the nav and still ticks when used; it just no longer decides
  // whether a unit is finished.
  nonCountable: ["overview", "live", "final-quiz", "teacherguide", "year-plan", "unit-plan", "story-library", "worksheet", "handwriting", "grade-dictionary"],
  gradeSections: [],
  // English draws its own card (renderSectionCompletion): its sections open
  // in a gated chain and its units unlock one another, which the shell's
  // generic card does not know about.
  completionCard: false,
  progressDefaults: { completed: [], knownWords: [], self: {}, writing: {}, games: {} },
  gradeDefaults: { completed: [] },
  keys: (g, u) => ({ progress: `ehel-english-g${g}-u${u}-progress-v1` }),
  courseKey: (g) => `ehel-eng-g${String(g).padStart(2, "0")}`,
  // "Get help with…" — the tutoring search page (shell/get-help.js). The shell
  // appends its nav entry and dispatches its route ahead of the gated
  // renderers, so it is reachable from a locked unit too — it teaches nothing
  // itself. Every link it emits goes through placementLocation with
  // review: true and lands on the unit's OVERVIEW: sections stay chained
  // inside a review visit (sectionUnlocked knows no REVIEW_VISIT exemption),
  // so a section deep-link would draw a padlock — the remediation contract,
  // "open ONE unit at its overview", is the door that works. The topic chips
  // still name what to look for once inside.
  getHelp: createGetHelp({
    deps: () => ({ $, escapeHtml, icon, pageHeader }),
    subjectKey: "english", subjectLabel: "English", param: "grade", stageWord: "Grade", maxStage: 8,
    stage: () => gradeNumber,
    course: () => course,
    sections: () => sections,
    hrefFor: (targetGrade, targetUnit) => placementLocation(targetGrade, targetUnit, "overview", { review: true }),
    // The help session's own route rides the same review door — the shell
    // dispatches it ahead of the gated renderers, so it renders on a locked
    // unit; every link it then emits lands on the overview per hrefFor above.
    sessionHref: (targetGrade, targetUnit) => placementLocation(targetGrade, targetUnit, "help-session", { review: true }),
    // Sections are chained here, so the session names its stops instead of
    // deep-linking them, and sends the learner through the overview in order.
    orderedUnit: true,
    examples: ["adverbs", "persuasive writing", "reading a story"],
  }),
  extendSummary: (p, base) => ({ ...base, knownWords: p.knownWords ? [...p.knownWords] : undefined }),
  visibleSections: () => visibleSections().map(([id, ic, lb]) => (id === "lecture" && unitNumber === 10 ? [id, ic, "Capstone launch"] : [id, ic, lb])),
  isSectionDone: (id) => (id === "final-quiz" ? finalQuizProgress.completed : id === "placement" ? placementProgress.completed : progress.completed.includes(id)),
  onNavigate: () => stopAudio(),
  // classicRegion and deckMount are per-render state: a section that draws both
  // designs sets them, and every other section must find them clear or it would
  // paint into a region the previous section left behind.
  onBeforeRender: () => { route = shellCtx.route; stopAudio(); stopEbookWatch(); document.body.classList.remove("gc-full"); classicRegion = null; deckMount = null; activeDeck = null; showWordInDeck = null; refreshDeckWordCount = null; showReadingInDeck = null; showWritingInDeck = null; showComprehensionGroupInDeck = null; $("#app").setAttribute("aria-busy", "true"); },
  onAfterRender: () => { $("#app").setAttribute("aria-busy", "false"); renderSectionGuide(); renderSectionCompletion(); prepareScreenReaderView(); icons(); },
  onNavRendered: () => { renderUnitPickers(); paintSectionLocks(); paintStudentSwitch(); icons(); },
  // Every route draws the locked page while a unit is locked. The check is
  // inside each entry, not a swapped-out map: the lock is not settled until
  // load() has heard from the progress gateway, and this object is built while
  // the module is still being evaluated. The shell also falls back to `overview`
  // for any route it cannot find (course-app.js :: renderRoute), so a route that
  // isn't in this map is covered by the same guard rather than by rewriting the
  // hash, which would race the first render.
  renderers: gated({
    overview: () => (isPrereqUnit ? renderPrereqOverview() : renderOverview()),
    placement: () => renderPlacementExam(),
    "year-plan": () => renderYearPlan(),
    "unit-plan": () => renderUnitStudyPlan(),
    teacherguide: () => renderTeacherGuide(),
    lecture: () => renderLecture(),
    dictionary: () => renderDictionary(),
    reading: () => renderReading(),
    comprehension: () => renderComprehension(),
    grammar: () => renderGrammar(),
    speaking: () => renderSpeaking(),
    writing: () => renderWriting(),
    activities: () => renderActivities(),
    games: () => renderGames(),
    quiz: () => renderQuiz(),
    ebooks: () => renderEbooks(),
    "story-library": () => renderStoryLibrary(),
    live: () => renderLive(),
    reflect: () => renderReflect(),
    "final-quiz": () => renderFinalQuiz(),
    teacher: () => (isPrereqUnit ? renderPrereqTeacher() : renderTeacher()),
    worksheet: () => renderCursiveWorksheet(),
    handwriting: () => renderHandwriting(),
    "grade-dictionary": () => renderGradeDictionary(),
    student: () => renderStudentResources(),
  }),
  bind,
  wehelOptions,
  async load(ctx) {
    // The shell has hydrated the gateway by now, so this is where the gate is
    // settled: the learner's units as the SERVER knows them, merged with this
    // device's. A learner who finished Units 0-6 at school opens the course at
    // home to Unit 7, not to a locked year. Offline, or on a per-device launch,
    // ctx.remoteUnits is null and the answer is the local one, unchanged.
    remoteUnits = ctx.remoteUnits || null;
    await applyCourseGating(ctx);
    // Recompute, don't just read: remoteUnits has only now arrived, and the
    // cached answer above was taken from this device alone.
    unitLockedCache = computeUnitLocked();
    // A locked unit loads its manifest entry and nothing else. Fetching the
    // unit, dictionary, games and lecture media would be paying for content the
    // learner is not going to be shown, and it is the one honest way to be sure
    // no renderer can reach a locked unit's material.
    if (unitIsLocked()) {
      const manifestResponse = await fetch(new URL("course-manifest.json", ctx.dataRootUrl));
      if (!manifestResponse.ok) throw new Error(`Course data could not be loaded (${manifestResponse.status} ${manifestResponse.url}).`);
      manifest = await manifestResponse.json();
      const entry = manifest.units.find((unit) => Number(unit.number) === unitNumber);
      course = {
        grade: manifest.grade,
        subject: manifest.subject,
        term: { label: "Not open yet" },
        unit: { unitNo: unitNumber, unitTitle: entry?.title || `Unit ${unitNumber}` },
        visual: {},
      };
      return { manifest, course };
    }
    if (isPrereqUnit) {
      const [manifestResponse, placementResponse] = await Promise.all([
        fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
        fetch(new URL("placement-exam.json", ctx.dataRootUrl)),
      ]);
      const failed = [manifestResponse, placementResponse].find((response) => !response.ok);
      if (failed) throw new Error(`Course data could not be loaded (${failed.status} ${failed.url}).`);
      [manifest, placementExam] = await Promise.all([manifestResponse.json(), placementResponse.json()]);
      // Synthetic course shell: just enough for the shared chrome (labels,
      // screen-reader announcements) — no unit.json exists for unit -1.
      course = {
        grade: manifest.grade,
        subject: manifest.subject,
        term: { label: "Before you begin" },
        unit: { unitNo: "P", unitTitle: placementExam.shortTitle || "Prerequisite" },
        visual: {},
      };
      return { manifest, course };
    }
    const [manifestResponse, courseResponse, dictionaryResponse, finalAssessmentResponse, lectureMediaResponse, sentenceGlossaryResponse] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${unitNumber}.json`, ctx.dataRootUrl)),
      fetch(new URL(`master-dictionary.grade${gradeNumber}.json`, ctx.dataRootUrl)),
      fetch(new URL("course-final-quiz.json", ctx.dataRootUrl)),
      fetch(new URL("lecture-media.json", ctx.dataRootUrl)),
      // Not every grade has this file yet (pilot: Grade 1), and it is not
      // taught content — a 404 here is not a course failure the way a
      // missing dictionary is.
      fetch(new URL("sentence-glossary.json", ctx.dataRootUrl)).catch(() => null),
    ]);
    const failedResponse = [manifestResponse, courseResponse, dictionaryResponse, finalAssessmentResponse].find((response) => !response.ok);
    if (failedResponse) throw new Error(`Course data could not be loaded (${failedResponse.status} ${failedResponse.url}).`);
    [manifest, course, dictionary, finalAssessment] = await Promise.all([manifestResponse.json(), courseResponse.json(), dictionaryResponse.json(), finalAssessmentResponse.json()]);
    sentenceGlossary = sentenceGlossaryResponse?.ok ? (await sentenceGlossaryResponse.json())?.entries || {} : {};
    const gameResponse = await fetch(new URL(`games/unit-${unitNumber}.json`, ctx.dataRootUrl));
    if (!gameResponse.ok) throw new Error(`Game data could not be loaded (${gameResponse.status}).`);
    gamePack = await gameResponse.json();
    if (lectureMediaResponse.ok) {
      const lectureMedia = await lectureMediaResponse.json();
      Object.assign(course.visual, lectureMedia.units?.[String(unitNumber)] || {});
    }
    resolveGradeAssets(course);
    resolveGradeAssets(dictionary);
    resolveGradeAssets(finalAssessment);
    return { manifest, course };
  },
  async onReady(ctx) {
    // Lecture-version cache-bust: a re-recorded lecture resets its completion.
    if (course.visual.lectureVersion) {
      const versionKey = `${STORAGE_KEY}-lecture-version`;
      if (localStorage.getItem(versionKey) !== course.visual.lectureVersion) {
        ctx.progress.completed = ctx.progress.completed.filter((section) => section !== "lecture");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx.progress));
        localStorage.setItem(versionKey, course.visual.lectureVersion);
      }
    }
    if (location.hash.slice(1) === "final-quiz" && unitNumber !== 10) location.hash = "overview";
    if (location.hash.slice(1) === "games" && !gamePack) location.hash = "overview";
    if (isPrereqUnit && !["overview", "placement", "year-plan", "teacher", "student"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && ["placement", "year-plan"].includes(location.hash.slice(1))) location.hash = "overview";
    if (location.hash.slice(1) === "unit-plan" && isPrereqUnit) location.hash = "overview";
    // Cosmetic only — the lock screen renders whatever the hash says. This just
    // stops the nav highlighting a section that is no longer on the page.
    if (unitIsLocked() && location.hash.slice(1) !== "overview") location.hash = "overview";
    document.title = isPrereqUnit
      ? `${gradeLabel} English | Prerequisite: ${placementExam.title}`
      : unitIsLocked()
        ? `${gradeLabel} English | Unit ${unitNumber} is locked`
        : `${gradeLabel} English | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    $("#course-label").textContent = `${course.grade.label} · ${course.subject} · ${course.term.label}`;
    $("#unit-title").textContent = course.unit.unitTitle;
    // Staff only. A learner is in one grade; the picker offers them the other
    // seven, which is chrome for somebody else's job. Hidden rather than
    // removed so the markup stays identical across subjects, and hidden without
    // being built at all — an option list nobody can see is work for nothing.
    const gradePicker = $("#grade-select");
    if (IS_STAFF) {
      gradePicker.innerHTML = Array.from({ length: 8 }, (_, index) => index + 1).map((grade) => `<option value="${grade}" ${grade === gradeNumber ? "selected" : ""}>Grade ${grade}</option>`).join("");
      gradePicker.addEventListener("change", (event) => { location.href = gradeLocation(event.target.value); });
    } else {
      gradePicker.hidden = true;
      gradePicker.setAttribute("aria-hidden", "true");
    }
    // The options are painted by renderUnitPickers, which runs again on every
    // nav render so a unit opened mid-session appears without a reload. The
    // listener is on the <select>, not the options, so it survives the repaint —
    // and is bound once, or a repaint would stack a second navigation on it.
    renderUnitPickers();
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) {
      if (picker.dataset.unitPickerBound) continue;
      picker.dataset.unitPickerBound = "true";
      picker.addEventListener("change", (event) => { location.href = event.target.value === "year-plan" ? courseLocation(PREREQ_UNIT, "year-plan") : courseLocation(event.target.value); });
    }
    // English-only listeners (the shell handles teacher-switch + hashchange).
    // The student switch is English's own — bound once here, shown or hidden by
    // paintStudentSwitch() on every nav render.
    const studentSwitch = $("#student-switch");
    if (studentSwitch) {
      paintStudentSwitch();
      studentSwitch.addEventListener("click", () => navigate("student"));
    }
    $("#sound-toggle").addEventListener("click", () => {
      audioEnabled = !audioEnabled;
      $("#sound-toggle").innerHTML = icon(audioEnabled ? "volume-2" : "volume-x");
      $("#sound-toggle").setAttribute("aria-label", audioEnabled ? "Mute sound" : "Turn on sound");
      if (!audioEnabled) stopAudio();
      icons(); toast(audioEnabled ? "Sound is on." : "Sound is muted.");
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page-voice]");
      if (button) playPageNarration(button);
    });
  },
};

createCourseApp(config);
