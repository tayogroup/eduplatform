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
import { SCHOOL_CALENDAR, calendarTerm, termDatesLabel, termWeekTotal, halfTermRow, formatDay } from "../study-plan.js?v=study-plan-2";
import { platformHeaders, askWehel, focusModule, setFocusModule, onFocusChange, modulesFromSections, outlineFromManifest, unitFetcher, browserSpeechSupported, speakBrowser, speechRateForGrade, stopBrowserSpeech, speechRecognitionCtor, recognizeSpeech, wehelIcon, platformUrl } from "../wehel.js?v=wehel-4";

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
const AUDIO_RELEASE = "20260819a";
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
  teacherguide: "Read this whenever it helps — it is not required to move on.",
  lecture: "Watch the video to the end. Listen and read the captions.",
  dictionary: "Learn each word and press “I know this word”, until all the words are learned.",
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
// Vocabulary completes when EVERY word in the unit has been marked known — the
// one rule for both designs (the lab and the deck), so they cannot finish the
// section at different points. It was 80% of the words; the guide now tells the
// learner "all the words", and a tick that arrived at 56 of 70 would have made
// that a lie. Checked by id, not by count: knownWords is per unit, but an id
// list is what "every word" means.
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
    eyebrow = "Section finished";
    title = `Well done! ${sectionLabel(route)} is finished.`;
    body = `That is ${done.length} of ${countable.length} sections in Unit ${course.unit.unitNo} ticked.${next ? ` Next up: ${sectionLabel(next)}.` : ""}`;
    action = next ? `<button class="${buttons.primary}" type="button" data-complete-go="${escapeHtml(next)}">Continue to ${escapeHtml(sectionLabel(next))} ${icon("arrow-right")}</button>` : "";
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
  .filter(([id]) => !["overview", "live", "teacherguide", "unit-plan"].includes(id))
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

const TAP_SOUND_MOOD_TYPES = new Set(["zebra", "elephant", "kiki", "duku", "lulu", "zuri"]);
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
  yasmin: "woman", mum: "woman", hana: "woman", salma: "woman",
  omar: "man", dad: "man",
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

function stopEbookWatch({ keepFullscreen = false } = {}) {
  ebookWatchActive = false;
  ebookWatchToken += 1;
  if (tapSoundPlayer) tapSoundPlayer.pause();
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
  const available = sections.filter(([id]) => (id !== "games" || gamePack) && (id !== "ebooks" || unitEbooks().length) && (id !== "teacherguide" || hasGrownUpGuide()));
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

function renderDictionaryClassic() {
  const { $, $$ } = classicScope();
  const words = linkedWords();
  activeWordId = activeWordId || words[0].vocabularyId;
  $("#app").innerHTML = `${pageHeader("Linked master dictionary", "Vocabulary lab", `Search the ${gradeLabel} sub-dictionary. Every word links to one reusable master entry and approved pronunciation.`, `${dictionary.entryCount} master entries`)}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search dictionary"></label><select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${escapeHtml(group.title)}</option>`).join("")}</select><span id="dictionary-count" class="status-chip">${words.length} words</span></div>
    <div class="dictionary-layout"><section class="panel word-list" id="word-list"></section><section class="panel word-card" id="word-card"></section></div>`;
  const drawList = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    const filtered = words.filter((item) => (group === "all" || item.groupId === group) && (!query || `${item.master.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    $("#dictionary-count").textContent = `${filtered.length} words`;
    $("#word-list").innerHTML = filtered.length ? filtered.map((item) => `<button class="word-row ${item.vocabularyId === activeWordId ? "active" : ""}" data-word="${item.vocabularyId}" type="button"><span><strong>${escapeHtml(item.master.displayWord)}</strong><small>${escapeHtml(item.master.partOfSpeech)} · ${escapeHtml(item.groupTitle)}</small></span>${progress.knownWords.includes(item.vocabularyId) ? "<span>LEARNED</span>" : ""}</button>`).join("") : `<div class="empty">No matching words found.</div>`;
    $$('[data-word]').forEach((button) => button.addEventListener("click", () => { activeWordId = button.dataset.word; activeSentence = 0; drawList(); drawWord(); showWordInDeck?.(activeWordId); }));
  };
  const drawWord = () => {
    const item = words.find((word) => word.vocabularyId === activeWordId) || words[0];
    const sentence = item.practiceSentences[activeSentence] || item.exampleSentence;
    $("#word-card").innerHTML = `<div class="word-card-head"><div><span class="word-type">${escapeHtml(item.master.partOfSpeech)}</span><h2>${escapeHtml(item.master.displayWord)}</h2><small>${escapeHtml(item.master.partOfSpeechDefinition)}</small></div><div class="audio-actions"><button class="icon-button" id="listen-word" type="button" title="Listen at 0.90x" aria-label="Listen to ${escapeHtml(item.master.displayWord)} at 0.90x">${icon("volume-2")}</button><button class="icon-button" id="slow-word" type="button" title="Replay at 0.90x" aria-label="Replay at 0.90x">${icon("rotate-ccw")}</button></div></div><p class="meaning"><span class="field-label">Meaning:</span> ${escapeHtml(item.childMeaning)}${item.meaningAudio?.available ? ` <button class="icon-button" id="hear-meaning" type="button" title="Listen to the meaning" aria-label="Listen to the meaning of ${escapeHtml(item.master.displayWord)}">${icon("volume-2")}</button>` : ""}</p><div class="sentence-card"><small>In a sentence · ${activeSentence + 1} of ${item.practiceSentences.length}</small><p>${linkGlossaryWords(sentence, item.master.displayWord)}</p><div class="sentence-controls"><button class="icon-button" id="previous-sentence" type="button" aria-label="Previous sentence">${icon("arrow-left")}</button><div class="sentence-dots">${item.practiceSentences.map((_, index) => `<button class="sentence-dot ${index === activeSentence ? "active" : ""}" data-sentence="${index}" type="button" aria-label="Sentence ${index + 1}"></button>`).join("")}</div><button class="button ghost" id="hear-sentence" type="button">${icon("volume-2")} Hear sentence</button><button class="icon-button" id="next-sentence" type="button" aria-label="Next sentence">${icon("arrow-right")}</button></div></div><div><span class="field-label">Spelling:</span> ${escapeHtml(item.spellingPractice)}</div><div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="${escapeHtml(item.sentenceStarter)}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div><div id="word-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button secondary" id="know-word" type="button">${progress.knownWords.includes(item.vocabularyId) ? icon("check-circle") + " Learned" : icon("bookmark-plus") + " I know this word"}</button>`;
    const play = (button = null) => playAudio(item.master.audio.normal, {
      rate: AI_NARRATION_RATE,
      start: item.master.audio.cueStart,
      end: item.master.audio.cueEnd,
      button,
    });
    $("#listen-word").addEventListener("click", (event) => play(event.currentTarget));
    $("#slow-word").addEventListener("click", (event) => play(event.currentTarget));
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
      if (allWordsKnown(words)) complete("dictionary"); else saveProgress();
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
// grammar is the assumption of six items: a unit holds 13-70 words, so the
// search and group filter come with it and narrow the deck itself. They sit
// under the dots rather than in .gc-top, which the full-bleed CSS hid.
function renderWordCarousel() {
  const allWords = linkedWords();
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
    // The lemma, not the displayed form: "feet" and "foot" are one entry, and a
    // word with no honest picture shows none rather than a decorative stand-in.
    const picture = wordPicture(item.master.lemma) || wordPicture(item.master.displayWord);
    return `<section class="gc-slide gc-v${index % 5}" data-slide="${esc(item.vocabularyId)}"><div class="gc-inner">
      <span class="gc-eyebrow">Word ${index + 1} of ${words.length} · ${esc(item.master.partOfSpeech)}${item.groupTitle ? ` · ${esc(item.groupTitle)}` : ""}</span>
      ${picture ? `<div class="wc-picture" aria-hidden="true">${picture}</div>` : ""}
      <div class="gc-pattern" lang="en">${esc(item.master.displayWord)}</div>
      <p class="gc-lead">${esc(item.childMeaning)}</p>
      <div class="gc-actions">
        <button class="gc-btn play" type="button" data-word-audio="${esc(item.vocabularyId)}">${icon("volume-2")} Hear it</button>
        <button class="gc-btn ghost" type="button" data-word-audio="${esc(item.vocabularyId)}">${icon("rotate-ccw")} Again</button>
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

  const deck = mountDeck({
    heading: "Say the words",
    label: "Word",
    intro: deckIntro("dictionary"),
    finish: ["dictionary", "I have learned these words"],
    emptyMessage: "No matching words. Clear the search to see them all.",
    // Sits below the dots, not in .gc-top, which the full-bleed CSS hides. A unit
    // holds 13-70 words, so the deck itself is what the search narrows.
    tools: `<div class="wc-tools">
        <label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search vocabulary"></label>
        <select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${esc(group.title)}</option>`).join("")}</select>
        <span class="status-chip" id="wc-known">${progress.knownWords.length} learned</span>
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
        if (allWordsKnown(allWords)) return complete("dictionary", "Vocabulary complete. Well done!");
        const left = allWords.filter((word) => !progress.knownWords.includes(word.vocabularyId)).length;
        return toast(`Mark every word with “I know this word” first — ${left} to go.`);
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
        // Same rule as the lab: the section completes when every word in the unit is known,
        // counted over every word in the unit, not just the filtered deck.
        if (allWordsKnown(allWords)) complete("dictionary"); else saveProgress();
        inDeck("#wc-known").textContent = `${progress.knownWords.length} learned`;
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
      blocks.push({ heading: true, words: 0, html: `<h3 class="ebook-subheading">${escapeHtml(line.replace(/:$/, ""))}</h3>` });
      continue;
    }
    const sentences = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
    const groups = line.length > 320
      ? Array.from({ length: Math.ceil(sentences.length / 3) }, (_, index) => sentences.slice(index * 3, index * 3 + 3).join(" ").trim())
      : [line];
    // Each sentence is its own element so the read-along highlight has a line
    // to land on. Spans are inline and unstyled by default, so the printed
    // sheet and the deck draw exactly what they drew before.
    groups.filter(Boolean).forEach((paragraph) => blocks.push({ heading: false, words: readingWordCount(paragraph), html: `<p>${readingLinesHtml(paragraph)}</p>` }));
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
    const rowsHtml = rows.map((row) => {
      const unitRow = `<tr><td>${weekLabel(row)}</td><td><strong>Unit ${row.unit.number}: ${escapeHtml(row.unit.title)}</strong></td><td>${Number(row.unit.vocabularyCount) || "—"}</td></tr>`;
      const breakHere = cal && cal.halfIndex !== null && row.from <= cal.halfIndex && cal.halfIndex <= row.to && (row === rows[rows.length - 1] || cal.halfIndex < rows[rows.indexOf(row) + 1].from);
      return unitRow + (breakHere ? halfTermRow(term.termNo, 3) : "");
    }).join("");
    return `<section class="panel">
      <span class="eyebrow">Term ${term.termNo}${cal ? ` · ${termDatesLabel(term.termNo)}` : ""}</span>
      <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Weeks</th><th>Unit</th><th>New words</th></tr></thead><tbody>
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
        <div class="final-quiz-facts"><span><strong>${SCHOOL_CALENDAR.yearLabel}</strong> school year</span><span><strong>${allUnits.length}</strong> units</span><span><strong>${totalWords}</strong> new words</span><span><strong>${terms.length}</strong> terms</span><span><strong>5</strong> short sessions a week</span></div>
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
  const groups = spreadAcrossWeeks(course.vocabularyGroups, weekCount);
  const readings = spreadAcrossWeeks(course.readings, weekCount);
  const grammar = spreadAcrossWeeks(course.grammar, weekCount);
  const speaking = spreadAcrossWeeks(course.speaking, weekCount);
  const writing = spreadAcrossWeeks(course.writing, weekCount);
  const activities = spreadAcrossWeeks(course.activities, weekCount);
  const vocabularyCount = Number(manifest.units.find((unit) => Number(unit.number) === unitNumber)?.vocabularyCount) || null;
  const lectureLabel = unitNumber === CAPSTONE_UNIT ? "the capstone launch" : "the video lesson";
  const dayLine = (name, what) => `<li>${icon("circle-check-big")}<span><strong>${name}:</strong> ${what}</span></li>`;
  const weekPanel = (weekIndex) => {
    const isFirst = weekIndex === 0;
    const isLast = weekIndex === weekCount - 1;
    const weekReadings = readings[weekIndex];
    const weekGroups = groups[weekIndex];
    const speakWrite = [
      speaking[weekIndex].length ? `Do speaking ${rangeText(speaking, weekIndex, "task")}` : "",
      writing[weekIndex].length ? `writing ${rangeText(writing, weekIndex, "task")}` : "",
    ].filter(Boolean).join(", then ");
    return `<section class="panel">
      <span class="eyebrow">${span ? `Week ${span.from + weekIndex} · Term ${span.termNo}${span.cal ? ` · week of ${formatDay(span.cal.weeks[span.from + weekIndex - 1])}${span.cal.halfIndex === span.from + weekIndex - 1 ? " (after half term)" : ""}` : ""}` : `Week ${weekIndex + 1} of the review programme`}</span>
      <ol class="path-list">
        ${dayLine("Day 1 · Words", `${isFirst ? `Start with ${lectureLabel}. Then meet` : "Learn"} ${weekGroups.length ? `your new words: <strong>${titlesOf(weekGroups)}</strong>` : "no new words this week — go back over the ones you know"}.`)}
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
        <div class="final-quiz-facts"><span><strong>${weekCount}</strong> weeks</span>${vocabularyCount ? `<span><strong>${vocabularyCount}</strong> new words</span>` : ""}<span><strong>${(course.readings || []).length}</strong> readings</span><span><strong>${(course.grammar || []).length}</strong> grammar lessons</span></div>
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

function renderEbooks() {
  ebookWatchActive = false;
  ebookWatchToken += 1;
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
    const readerElement = $(".course-ebook-reader");
    if (readerElement?.requestFullscreen && !document.fullscreenElement) {
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
    // "with its meaning", not "with a picture": word-pictures.js only draws a
    // picture where one can BE the word, which is a minority of the vocabulary
    // once the words stop being concrete nouns.
    { route: "dictionary", iconName: "book-a", title: navLabelOf("dictionary", "Vocabulary"), blurb: "Every new word in this unit, with its meaning and a voice to listen to." },
  ];
  if (books) cards.push({ route: "ebooks", iconName: "library-big", title: navLabelOf("ebooks", "Books"), blurb: `${books === 1 ? "A story book" : `${books} story books`} to read or listen to, with pictures that move when you tap them.` });
  if (gamePack) cards.push({ route: "games", iconName: "gamepad-2", title: navLabelOf("games", "Games"), blurb: "Play with this unit's words and sentences until they stick." });
  cards.push({ route: "reflect", iconName: "sparkles", title: navLabelOf("reflect", "My progress"), blurb: "See what you have finished in this unit, and what comes next." });
  cards.push({ route: "live", iconName: "video", title: navLabelOf("live", "Live sessions"), blurb: "When your class meets your teacher online, the link is here." });
  return cards;
}

function renderStudentResources() {
  const cards = studentResourceCards().map((card) => {
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
  }).join("");
  $("#app").innerHTML = `${pageHeader(
    `${gradeLabel} · ${isPrereqUnit ? "Prerequisite unit" : `Unit ${course.unit.unitNo}`}`,
    "Student resources",
    "Everything here is for you. Open any of them whenever you like — none of them is a step you have to finish first.",
    "For learners",
  )}
    <div class="final-quiz-intro">
      <div class="final-section-grid">${cards}</div>
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
  nonCountable: ["overview", "live", "final-quiz", "teacherguide", "year-plan", "unit-plan"],
  gradeSections: [],
  // English draws its own card (renderSectionCompletion): its sections open
  // in a gated chain and its units unlock one another, which the shell's
  // generic card does not know about.
  completionCard: false,
  progressDefaults: { completed: [], knownWords: [], self: {}, writing: {}, games: {} },
  gradeDefaults: { completed: [] },
  keys: (g, u) => ({ progress: `ehel-english-g${g}-u${u}-progress-v1` }),
  courseKey: (g) => `ehel-eng-g${String(g).padStart(2, "0")}`,
  extendSummary: (p, base) => ({ ...base, knownWords: p.knownWords ? [...p.knownWords] : undefined }),
  visibleSections: () => visibleSections().map(([id, ic, lb]) => (id === "lecture" && unitNumber === 10 ? [id, ic, "Capstone launch"] : [id, ic, lb])),
  isSectionDone: (id) => (id === "final-quiz" ? finalQuizProgress.completed : id === "placement" ? placementProgress.completed : progress.completed.includes(id)),
  onNavigate: () => stopAudio(),
  // classicRegion and deckMount are per-render state: a section that draws both
  // designs sets them, and every other section must find them clear or it would
  // paint into a region the previous section left behind.
  onBeforeRender: () => { route = shellCtx.route; stopAudio(); document.body.classList.remove("gc-full"); classicRegion = null; deckMount = null; activeDeck = null; showWordInDeck = null; showReadingInDeck = null; showWritingInDeck = null; showComprehensionGroupInDeck = null; $("#app").setAttribute("aria-busy", "true"); },
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
    live: () => renderLive(),
    reflect: () => renderReflect(),
    "final-quiz": () => renderFinalQuiz(),
    teacher: () => (isPrereqUnit ? renderPrereqTeacher() : renderTeacher()),
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
