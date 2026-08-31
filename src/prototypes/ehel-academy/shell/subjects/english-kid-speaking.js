// The Grades 1-4 Speaking Studio.
//
// Speaking shipped one presentation for all eight grades: the whole task as a
// single paragraph of escaped prose in a rule-box, a Hear model button, a mic,
// and a four-word flow strip reading Record · Listen · Submit · Feedback. A
// Grade 1 practice reads
//
//   "Point to school things as an adult names them if one is nearby, or as the
//    audio names them, then name them yourself. Say: 'This is a pencil.' 'This
//    is a book.' 'This is a bag.'"
//
// — three things to say, buried mid-paragraph, at a reading age well above the
// child being asked to say them. The one genuinely interactive control on the
// page was a microphone, and it arrived before the learner had been walked
// through a single line. Owner, 2026-09-01: make it interactive, interesting
// and engaging for Grades 1 to 4.
//
// What changes is the PRESENTATION and the INTERACTION. Not one word of content
// is re-authored: this module reads the same `speaking` array out of the same
// unit JSON, plays the same ElevenLabs clip, sends the same recording to the
// same pronunciation endpoint against the same target text, and finishes the
// section through the same complete("speaking") call. `check:english` sees the
// content it always saw, nothing is re-narrated and nothing is re-billed.
//
// Four rules the build is held to, each from a scar already in CLAUDE.md:
//
//  - GRADES 5-8 ARE UNTOUCHED, and so is a TUTORING learner at any grade.
//    english.js routes on DECK_PAGE — the same question the rest of the subject
//    asks — so the studio stands exactly where the deck stood, and the original
//    card grid answers everybody else unchanged. Every class here is `ks-*` and
//    every rule lives in the stylesheet this file injects, so no upper-stage
//    page can match one even by accident.
//  - The section's COMPLETION CONTRACT is unchanged. Speaking has always been
//    finishable by pressing one button, with no practice required first, and the
//    unit gate holds the rest of the grade shut behind it — so the finish button
//    is offered on the studio map from the first visit, exactly as the deck's
//    finish slide and the card grid's button were. The studio makes finishing
//    more inviting; it must never make it harder.
//  - No new asset and no new fetch on load. The pictures come from
//    word-pictures.js (already loaded), the host character is drawn here in SVG,
//    and the sound effects are synthesised with WebAudio — so a slow connection
//    loses none of it and nothing can 404.
//
//    ONE new paid call exists and is worth naming rather than glossing: the
//    per-line "Hear" button on step 2 speaks a sentence that did not exist until
//    the child built it, so no pre-rendered clip can carry it. It goes through
//    the same runtime voice the Game Park and the picture books already use
//    (aiVoiceUrl, cached per text, on demand and never on load). The section's
//    own ElevenLabs clip is unchanged and still plays the model on step 1.
//  - Motion is decoration, never information. `prefers-reduced-motion` stills
//    every animation and the studio still says the same things; a finished line
//    is announced in text, not only by a tick that pops.
//
// The shape of a practice, and where each part of it comes from:
//
//   step 1  LISTEN   the task's own instruction, chunked into short steps, plus
//                    the existing ElevenLabs clip
//   step 2  SAY      the model lines, ONE AT A TIME, pulled out of the prose —
//                    with the `______` blanks turned into slots a child fills
//                    from this unit's own word bank, or with a word of their own
//   step 3  RECORD   the recorder english.js owns, inside a stage with a live
//                    microphone level
//   step 4  CHECK    the task's own "Check: did you …?" questions as ticks, and
//                    the pronunciation result read back warmly
//
// Step 2 is the one that did not exist before and is the reason this module was
// written. The lines were always in the data; nothing had ever separated them
// from the paragraph around them.

const STYLE_ID = "ks-speaking-studio-style";

// ---------------------------------------------------------------- the themes
// One theme per KIND of speaking, keyed by a word in the task's own
// `activityType`. There are 26 distinct types across the 246 practices of
// Grades 1-4 — most of them used once — so this matches on a substring and
// falls through to a default rather than listing them, which is the failure
// the Game Park's WORLDS map records: an unlisted id must show a themed card,
// never an untitled grey one.
const THEMES = [
  { match: /role|drama|perform|showcase|presentation|final/i, badge: "🎭", a: "#ffe6f0", b: "#b83a72", cheer: "Time to perform!" },
  { match: /partner|dialogue|paired|information gap|question/i, badge: "💬", a: "#e4f1ff", b: "#2a5f9e", cheer: "Take turns talking!" },
  { match: /game/i, badge: "🎲", a: "#e8f7e2", b: "#3d7a2c", cheer: "Let's play with words!" },
  { match: /phonics|sound/i, badge: "🔤", a: "#fff0d6", b: "#b1600f", cheer: "Listen to the sounds!" },
  { match: /adult|helper|family/i, badge: "🧑‍🍼", a: "#f0eaff", b: "#5a3fa0", cheer: "Say it with a grown-up!" },
  { match: /fluency|reading aloud|read/i, badge: "📖", a: "#e2f5f3", b: "#1f7a72", cheer: "Read it out loud!" },
  { match: /picture|describ/i, badge: "🖼️", a: "#fdeee2", b: "#a85520", cheer: "Tell me what you see!" },
  { match: /vocabulary|word/i, badge: "🧩", a: "#fff3d0", b: "#9a6a09", cheer: "Use your new words!" },
  { match: /capstone|unit show/i, badge: "🏆", a: "#fff2cf", b: "#9c6b00", cheer: "Show what you can do!" },
  { match: /reflect|explain/i, badge: "💡", a: "#eaf3ff", b: "#39568f", cheer: "Tell me what you think!" },
];
const DEFAULT_THEME = { badge: "🎤", a: "#e6f4f1", b: "#1f7a72", cheer: "Use your voice!" };
const themeFor = (type) => THEMES.find((theme) => theme.match.test(String(type || ""))) || DEFAULT_THEME;

// Varied on purpose: the same four words after every line stop being praise by
// the third practice of six.
const PRAISE = ["Lovely!", "Well said!", "Clear as a bell!", "Brilliant!", "That's it!", "Beautiful speaking!"];

// ----------------------------------------------------------------- the parse
// One paragraph in, a stage out. This is the whole reason the module exists, so
// it is written to be measured rather than trusted: it is exported, and
// tools-side probes run it over all 246 Grades 1-4 practices.
//
// Three things are pulled out, and every one of them may legitimately be empty.
// Only 146 of the 246 practices quote model lines, only 70 carry a blank and
// only 26 carry a "Check:" — so a task with none of them must still render a
// complete, warm stage rather than an empty one. Absence is the common case,
// not the error case.
export function parseSpeakingScript(raw) {
  const text = String(raw || "").replace(/\r/g, "").trim();

  // --- the self-check tail ------------------------------------------------
  // ONLY a literal "Check:" is treated as the self-check. The packs also write
  // "…and check that every one has a helping word" mid-sentence, which is part
  // of the instruction; splitting there would decapitate the sentence it lives
  // in and leave the learner an instruction with its verb removed.
  let body = text;
  let checks = [];
  const checkAt = text.match(/(^|[\s\n])check\s*:\s*/i);
  if (checkAt) {
    const start = checkAt.index + checkAt[0].length;
    body = text.slice(0, checkAt.index).trim();
    checks = text.slice(start)
      // Split on question marks first, then on the "…, did you …" run the packs
      // write as one sentence. No lookbehind anywhere: it is unsupported on
      // older iOS Safari, and a child's page is not the place to find out.
      .split("?")
      .flatMap((part) => part.split(/,\s*(?:and\s+)?(?=did\b|is\b|was\b|were\b|can\b)/i))
      .map((part) => part.replace(/^(?:and|then)\s+/i, "").replace(/^[\s.,;:]+|[\s.,;:]+$/g, "").trim())
      .filter((part) => part.length > 3)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}?`)
      .slice(0, 5);
  }

  // --- the model lines ----------------------------------------------------
  // Curly quotes are unambiguous and are how Grades 2-4 write a model line.
  // Grade 1 writes `Say: 'This is a pencil.'` in straight single quotes, which
  // an apostrophe would otherwise swallow whole — so that pass requires the
  // quoted run to END in sentence punctuation, which "don't" never does.
  //
  // The optional lead-in in front of each pattern is not decoration. A model
  // line is quoted mid-sentence as often as it is put on a line of its own —
  // "Say one comparing sentence about them, such as “This pencil is longer than
  // that pencil.”" — and lifting the quote out on its own leaves the
  // instruction ending on "such as". Measured over all 246 Grades 1-4
  // practices, 25 steps came back as those dangling fragments before the
  // lead-in was consumed with the quote. Only phrases that are purely
  // introductory are eaten: "say" is NOT one of them, because "Point to each
  // group as you say:" needs its verb and would be left ending on "as you".
  //
  // Its whitespace is `[^\S\n]` and never `\s`, because `\s` matches a newline:
  // a quote sitting on its own line would then have the line break before it
  // eaten with the lead-in, and the instruction above would be glued to
  // whatever followed the last quote. That is how "Get ready to say three
  // sentences about your day at school:" came back carrying "(name a supply)"
  // from four lines below it.
  const LEAD = String.raw`(?:[^\S\n]*[,;:]?[^\S\n]*(?:such as|for example|for instance|like this|including|namely|e\.g\.?)\b)?[^\S\n]*`;
  const lines = [];
  const spans = [];
  const take = (match, value) => {
    const line = String(value).replace(/\s+/g, " ").trim();
    spans.push(match);
    if (line.length >= 3 && !lines.some((existing) => existing.toLowerCase() === line.toLowerCase())) lines.push(line);
  };
  for (const match of body.matchAll(new RegExp(`${LEAD}[“”"]([^“”"]{3,})[“”"]`, "gi"))) take(match[0], match[1]);
  if (!lines.length) for (const match of body.matchAll(new RegExp(`${LEAD}'([^']{3,}?[.!?])'`, "gi"))) take(match[0], match[1]);

  // --- what is left is the instruction ------------------------------------
  // Each removed quote leaves a SENTINEL rather than a space, so the tidy-up
  // that follows can act on the removal points alone. The first version cleaned
  // the whole string instead — and "use First, Next, Then and Finally for the
  // four main events" came out as "First, Next Then and Finally". A parse that
  // rewrites the author's punctuation where no quote ever stood is editing the
  // content, which is the one thing this module must not do.
  // Each removed quote leaves a SENTINEL rather than a space, so the tidy-up
  // below can act on the removal points alone. The first version cleaned the
  // whole string instead — and "use First, Next, Then and Finally for the
  // four main events" came out as "First, Next Then and Finally". A parse
  // that rewrites the author's punctuation where no quote ever stood is
  // editing the content, which is the one thing this module must not do.
  const MARK = "\u0000";
  let rest = body;
  for (const span of spans) rest = rest.split(span).join(MARK);
  rest = rest
    // "…, such as “X”, and three Wh- questions" leaves ", and" hanging on the
    // removal point. Only a comma sitting directly against a sentinel is
    // touched; every other comma in the sentence is the author's.
    .replace(/\u0000[^\S\n]*,[^\S\n]*(and|or|then|but)\b/gi, " $1")
    // A quote introduced by a colon mid-line takes the colon with it, and the
    // sentence AFTER it then runs straight on from the one before: "say the
    // whole sentence: “This is a triangle.” All five shape names…" came back
    // as one 24-word step with no stop in it. Where a removal sits between a
    // word and a new capitalised sentence, it WAS the boundary — so it leaves
    // one behind.
    .replace(/(\w)[:;]?\u0000[^\S\n]+([A-Z])/g, "$1. $2")
    .split(MARK).join(" ");
  const steps = rest
    // Sentence-split without a lookbehind. `(?<=…)` is a PARSE error on iOS
    // Safari before 16.4, and a parse error in a module the English shell
    // imports takes down every section of the subject, not this one — so the
    // literal never enters the file.
    .replace(/([.!?])[^\S\n]+/g, "$1\n")
    .split(/\n+/)
    .map((part) => part
      .replace(/\s+/g, " ")
      // Punctuation left standing where a quote used to be: a doubled stop, a
      // space before its own full stop, a colon introducing nothing.
      .replace(/\s+([.,;:!?])/g, "$1")
      .replace(/([.,;:])\1+/g, "$1")
      .replace(/^[\s.,;:—-]+/, "")
      .replace(/[\s,;:]+$/, "")
      // A connective left at the end is the joint the example used to hang
      // off: "Say what it looks like, such as “…” or “…”" ends on a bare "or".
      .replace(/\s+(?:and|or|but|then|like|such as)$/i, "")
      .trim())
    // A step that is nothing but the lead-in to the quotes ("Say:", "Then
    // say:", "Ask:", "Answer:") has had its point removed with them, and
    // printing the orphan reads as a broken sentence. A wholly parenthetical
    // note ("(name a supply)") is dropped for the same reason: it annotated a
    // line that no longer sits beside it.
    .filter((part) => part.length > 3
      && !/^(?:then|now|next|first|finish by)?\s*(say|says|model|ask|answer|reply|respond|for example|such as|get ready to say)\s*:?\s*$/i.test(part)
      && !/^\(.*\)[.!?]?$/.test(part))
    .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`))
    .slice(0, 5);

  return { steps, lines: lines.slice(0, 6), checks };
}

// A model line broken into the pieces a stage can lay out: the words either
// side of each blank, and the blanks themselves. `______` and `___` are both
// written in the packs; anything from two underscores up is a blank.
export function splitBlanks(line) {
  const parts = [];
  const pattern = /_{2,}/g;
  let last = 0;
  let match = pattern.exec(line);
  while (match) {
    if (match.index > last) parts.push({ text: line.slice(last, match.index) });
    parts.push({ blank: true });
    last = match.index + match[0].length;
    match = pattern.exec(line);
  }
  if (last < line.length) parts.push({ text: line.slice(last) });
  return parts.length ? parts : [{ text: line }];
}

// ---------------------------------------------------------------- the host
// Echo, who keeps the studio. A parrot, because a parrot says it back — which
// is the whole of speaking practice at this age. Drawn here rather than
// imported: the ebook kit is a Node build-time module and its cast belongs to
// the books, and the Game Park's Pip belongs to the park. No ids and no <defs>,
// the same discipline english-core-word-scenes.js keeps, because two copies of
// this may share a document.
function echo(mood = "idle") {
  return `<svg class="ks-echo is-${mood}" viewBox="0 0 120 120" role="img" aria-hidden="true" focusable="false">
    <ellipse cx="60" cy="113" rx="24" ry="4.5" fill="#000" opacity=".10"/>
    <g class="ks-echo-body">
      <path class="ks-echo-tail" d="M74 88 q22 10 26 26 q-18 0 -30-14z" fill="#2f8fd0"/>
      <ellipse cx="60" cy="72" rx="30" ry="32" fill="#f2b134"/>
      <ellipse cx="60" cy="79" rx="19" ry="21" fill="#fdf0d0"/>
      <path class="ks-echo-wing" d="M32 60 q-14 12 -8 30 q14 2 22-14z" fill="#e0762a"/>
      <path d="M52 102 l-5 9 M68 102 l5 9" stroke="#c9611c" stroke-width="5" stroke-linecap="round"/>
      <g class="ks-echo-head">
        <ellipse cx="60" cy="40" rx="28" ry="27" fill="#f2b134"/>
        <path class="ks-echo-crest" d="M60 12 q6-11 13-3 q-4 3 -6 7 q7-4 10 3 q-8 2 -13 6z" fill="#e0453a"/>
        <circle cx="50" cy="38" r="8.5" fill="#fff"/><circle cx="70" cy="38" r="8.5" fill="#fff"/>
        <g class="ks-echo-eyes">
          <circle class="ks-echo-eye" cx="51" cy="39" r="4.4" fill="#22323f"/>
          <circle class="ks-echo-eye" cx="71" cy="39" r="4.4" fill="#22323f"/>
        </g>
        <path class="ks-echo-beak" d="M53 48 q7-4 14 0 q-2 13 -7 15 q-5-2 -7-15z" fill="#3f4a55"/>
        <path class="ks-echo-brow" d="M42 27 q8-6 15-2 M78 27 q-8-6 -15-2" stroke="#22323f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
}

// ------------------------------------------------------------------- sound
// Synthesised, so there is nothing to download, nothing to deploy and nothing
// that can 404 into a silent studio. Every call is wrapped: a browser that
// refuses the AudioContext must lose the garnish and keep the lesson. It is a
// second, smaller copy of the Game Park's engine on purpose — the two modules
// share no imports, and reaching into the other one for four tones would tie a
// section's sound to a file it has nothing else to do with.
function makeSound(isOn) {
  let ctx = null;
  const tone = (freq, at, dur, type = "sine", peak = 0.12) => {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    ctx ||= new Ctor();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + at;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.04);
  };
  const play = (notes) => {
    if (!isOn()) return;
    try { for (const note of notes) tone(...note); } catch { /* garnish only */ }
  };
  return {
    tap: () => play([[620, 0, 0.06, "triangle", 0.07]]),
    drop: () => play([[440, 0, 0.09, "sine", 0.08]]),
    tick: () => play([[659.25, 0, 0.14], [880, 0.09, 0.20]]),
    step: () => play([[523.25, 0, 0.12], [783.99, 0.1, 0.20]]),
    win: () => play([[523.25, 0, 0.16], [659.25, 0.1, 0.16], [783.99, 0.2, 0.16], [1046.5, 0.3, 0.42]]),
  };
}

const STEPS = [
  { key: "listen", icon: "ear", label: "Listen" },
  { key: "say", icon: "messages-square", label: "Say it" },
  { key: "record", icon: "mic", label: "Record" },
  { key: "check", icon: "check-circle", label: "Check" },
];

export function createSpeakingStudio(api) {
  const {
    tasks, unit, icon, icons, escapeHtml, toast,
    wordBank, wordPicture, soundOn, playClip, speak,
    speakingPanel, hasRecording, stateFor, saveState,
    sectionDone, finishSection,
  } = api;

  const sfx = makeSound(soundOn);
  const still = () => Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const host = () => document.getElementById("app");
  const $ = (selector) => host().querySelector(selector);
  const $$ = (selector) => [...host().querySelectorAll(selector)];

  // Parsed once per task and kept: the parse is pure, and re-running it on every
  // repaint of a stage would re-derive the same lines while a child is halfway
  // through filling their blanks.
  const scripts = new Map();
  const scriptFor = (task) => {
    if (!scripts.has(task.speakingId)) scripts.set(task.speakingId, parseSpeakingScript(task.instructionsAndModelLines));
    return scripts.get(task.speakingId);
  };

  // The lines a learner repeats — and nothing invented where there are none.
  const linesFor = (task) => scriptFor(task).lines;

  // 34 of the 246 Grades 1-4 practices quote no line: "Plan and record a
  // three-minute talk called My Week" is a task, not a sentence to copy. Showing
  // its instruction in a line card told a child to say the homework out loud, so
  // those practices get their own panel — the plan, and one tick for having done
  // it in their own words.
  const ownWords = (task) => linesFor(task).length === 0;

  // What "all of it said" means for this practice. Every count downstream asks
  // this rather than the line count, because an own-words practice has exactly
  // one thing to tick and zero lines — and a total of zero would hand out the
  // first star for doing nothing.
  const tickTotal = (task) => (ownWords(task) ? 1 : linesFor(task).length);

  let openIndex = null;
  let step = 0;
  let tray = null; // { line, blank } while a word tray is open

  // ------------------------------------------------------------------ state
  // Per-practice marks, persisted through english.js into the SAME per-unit
  // progress object every other section writes. Nothing gates on them and
  // nothing is emitted for them — course-app.js builds its summary payload from
  // an explicit whitelist — so this is a record of where a child got to, not a
  // second progress contract. It exists because a studio map that forgets which
  // practices are finished the moment the tab closes is a map of nothing.
  const blank = () => ({ said: [], fills: {}, recorded: false, checks: [], best: null, done: false });
  const state = (task) => ({ ...blank(), ...(stateFor(task.speakingId) || {}) });
  const write = (task, patch) => saveState(task.speakingId, { ...state(task), ...patch });

  // The self-check questions this practice shows. 26 of the 246 practices author
  // their own ("Check: did you say your name clearly…"); the rest get three that
  // fit any of them. It is ONE function because the page and the star have to
  // agree about what "all of them ticked" means — asking the authored list for a
  // practice that has none made the third star unreachable on 220 of them.
  const GENERIC_CHECKS = ["Did you say every part out loud?", "Did you speak slowly and clearly?", "Are you proud of how it sounded?"];
  const checksFor = (task) => (scriptFor(task).checks.length ? scriptFor(task).checks : GENERIC_CHECKS);

  const starsFor = (task) => {
    const saved = state(task);
    const total = tickTotal(task);
    let stars = 0;
    if (total && saved.said.filter(Boolean).length >= total) stars += 1;
    if (saved.recorded) stars += 1;
    // Either the machine heard it clearly, or the learner has been through every
    // question about their own effort. A practice that asks for no recording can
    // only ever earn this the second way, which is why it cannot depend on a
    // score.
    const checks = checksFor(task);
    if ((saved.best !== null && saved.best >= 65) || saved.checks.filter(Boolean).length >= checks.length) stars += 1;
    return Math.min(3, stars);
  };

  // The sentence a learner is actually asked to say, blanks filled with their
  // own choices. This is what gets spoken back to them and what the
  // pronunciation check is scored against — scoring against the raw frame would
  // mark a child down for the underscores.
  const sentence = (task, index) => {
    const saved = state(task);
    const line = linesFor(task)[index] || "";
    let slot = -1;
    return splitBlanks(line)
      .map((part) => {
        if (!part.blank) return part.text;
        slot += 1;
        return saved.fills[`${index}-${slot}`] || "something";
      })
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  };

  const targetFor = (task) => {
    const spoken = linesFor(task).map((_, index) => sentence(task, index)).filter(Boolean);
    return spoken.length ? spoken.join(" ") : String(task.instructionsAndModelLines || "").replace(/_{2,}/g, " ");
  };

  // ------------------------------------------------------------------ style
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function render() {
    ensureStyle();
    if (openIndex === null) return renderMap();
    return renderStage();
  }

  // ------------------------------------------------------------------- map
  function renderMap() {
    const done = tasks.filter((task) => state(task).done).length;
    const stars = tasks.reduce((total, task) => total + starsFor(task), 0);
    const finished = sectionDone();

    // The root carries `deck-only` for one reason and it is not styling: that
    // class is what renderSectionGuide (english.js) reads to decide whether the
    // page it is about to describe still exists. "How to use this page" for
    // Speaking describes the card grid's furniture — a rule-box, six cards, a
    // button at the bottom — none of which is here, so above the studio it
    // would be instructions for a page the child cannot see. Same test, same
    // reason, as the deck-only pages it was written for. No CSS rule in
    // course-ui.css matches `.deck-only` without `.both-designs`, so nothing is
    // inherited with it.
    host().innerHTML = `<div class="ks ks-map deck-only${still() ? " ks-still" : ""}">
      <section class="ks-hero">
        <div class="ks-hero-echo">${echo("idle")}</div>
        <div class="ks-hero-say">
          <span class="ks-eyebrow">Unit ${escapeHtml(String(unit.no))} · ${escapeHtml(unit.title)}</span>
          <h1>Speaking Studio</h1>
          <p class="ks-bubble">Hello! I am Echo. Pick a practice, listen to it, then say it in your own voice.</p>
          <div class="ks-hero-stats">
            <span class="ks-stat"><strong>${done}</strong> of ${tasks.length} finished</span>
            <span class="ks-stat"><strong>${stars}</strong> star${stars === 1 ? "" : "s"} ★</span>
          </div>
        </div>
      </section>

      <ol class="ks-path">${tasks.map((task, index) => {
        const theme = themeFor(task.activityType);
        const saved = state(task);
        const stageStars = starsFor(task);
        const status = saved.done ? "Finished" : (saved.said.some(Boolean) || saved.recorded) ? "Started" : "Not started yet";
        return `<li class="ks-path-item">
          <button class="ks-stagecard${saved.done ? " is-done" : ""}" type="button" data-open="${index}"
                  style="--ks-a:${theme.a};--ks-b:${theme.b}"
                  aria-label="Practice ${index + 1}, ${escapeHtml(task.title)}, ${status}">
            <span class="ks-stagecard-badge" aria-hidden="true">${theme.badge}</span>
            <span class="ks-stagecard-body">
              <span class="ks-stagecard-no">Practice ${index + 1}</span>
              <strong class="ks-stagecard-title">${escapeHtml(shortTitle(task.title))}</strong>
              <span class="ks-stagecard-type">${escapeHtml(task.activityType || "Speaking")}</span>
            </span>
            <span class="ks-stagecard-foot">
              <span class="ks-stars" aria-hidden="true">${[0, 1, 2].map((star) => `<i class="${star < stageStars ? "on" : ""}">★</i>`).join("")}</span>
              <span class="ks-stagecard-state">${saved.done ? `${icon("check")} Finished` : status}</span>
            </span>
          </button>
        </li>`;
      }).join("")}</ol>

      <section class="ks-finish">
        ${finished
          ? `<p class="ks-finish-done">${icon("check-circle")} You have finished Speaking for this unit. Come back any time to practise again.</p>`
          : `<p>${done === tasks.length
              ? "Every practice is finished — wonderful speaking!"
              : "You can finish Speaking whenever you are ready. Practising them all first earns the most stars."}</p>
             <button class="ks-btn ks-gold" id="ks-finish" type="button">${icon("check")} I have finished my speaking</button>`}
      </section>
    </div>`;

    $$("[data-open]").forEach((button) => button.addEventListener("click", () => {
      sfx.tap();
      openIndex = Number(button.dataset.open);
      step = firstUnfinishedStep(tasks[openIndex]);
      render();
    }));
    $("#ks-finish")?.addEventListener("click", () => {
      sfx.win();
      finishSection(`${done === tasks.length ? "Every speaking practice finished." : "Speaking practice complete."} Well done!`);
      render();
    });
    icons();
  }

  // Where to open a practice a learner has already been in: at the first step
  // they have not got through, not always at step 1. Re-walking a child through
  // the model they have already heard, every time they come back, is how a
  // section stops being worth coming back to.
  function firstUnfinishedStep(task) {
    const saved = state(task);
    const total = tickTotal(task);
    if (saved.said.filter(Boolean).length < total) return saved.said.some(Boolean) ? 1 : 0;
    if (task.recordingRequired && !saved.recorded) return 2;
    return 3;
  }

  // ----------------------------------------------------------------- stage
  function renderStage() {
    const task = tasks[openIndex];
    const theme = themeFor(task.activityType);
    const saved = state(task);

    host().innerHTML = `<div class="ks ks-stage deck-only${still() ? " ks-still" : ""}" style="--ks-a:${theme.a};--ks-b:${theme.b}">
      <div class="ks-topbar">
        <button class="ks-btn ks-ghost" id="ks-back" type="button">${icon("arrow-left")} Studio</button>
        <span class="ks-count">Practice ${openIndex + 1} of ${tasks.length}</span>
        <span class="ks-stars" aria-label="${starsFor(task)} of 3 stars">${[0, 1, 2].map((star) => `<i class="${star < starsFor(task) ? "on" : ""}">★</i>`).join("")}</span>
      </div>

      <header class="ks-stage-head">
        <span class="ks-stage-badge" aria-hidden="true">${theme.badge}</span>
        <div>
          <span class="ks-eyebrow">${escapeHtml(task.activityType || "Speaking")}</span>
          <h1>${escapeHtml(shortTitle(task.title))}</h1>
        </div>
        <div class="ks-stage-echo">${echo(step === 3 ? "cheer" : step === 0 ? "listen" : "talk")}</div>
      </header>

      <ol class="ks-ladder">${STEPS.map((entry, index) => `<li class="ks-rung${index === step ? " is-now" : ""}${index < step ? " is-past" : ""}">
        <button type="button" data-step="${index}" ${index > furthestStep(task) ? "disabled" : ""}>
          <span class="ks-rung-icon">${icon(entry.icon)}</span><span class="ks-rung-label">${entry.label}</span>
        </button>
      </li>`).join("")}</ol>

      <div class="ks-panel ks-narrate" id="ks-panel">${panelHtml(task, saved, theme)}</div>
    </div>`;

    $("#ks-back").addEventListener("click", () => { openIndex = null; tray = null; render(); });
    $$("[data-step]").forEach((button) => button.addEventListener("click", () => {
      if (button.disabled) return;
      sfx.tap();
      step = Number(button.dataset.step);
      tray = null;
      render();
    }));
    bindPanel(task);
    icons();
  }

  // A step is reachable once the one before it has been met. Step 4 is always
  // reachable once the lines are said, because on a practice with no recording
  // required there is nothing between them.
  function furthestStep(task) {
    const saved = state(task);
    const total = tickTotal(task);
    if (!saved.said.filter(Boolean).length && !saved.recorded && !saved.done) return Math.max(1, step);
    if (saved.said.filter(Boolean).length < total) return Math.max(1, step);
    if (task.recordingRequired && !saved.recorded) return Math.max(2, step);
    return 3;
  }

  function panelHtml(task, saved, theme) {
    if (step === 0) return listenHtml(task, theme);
    if (step === 1) return sayHtml(task, saved);
    if (step === 2) return recordHtml(task, saved);
    return checkHtml(task, saved);
  }

  // -------------------------------------------------------------- 1: listen
  function listenHtml(task, theme) {
    const script = scriptFor(task);
    const steps = script.steps.length ? script.steps : [String(task.instructionsAndModelLines || "").trim()];
    return `<h2 class="ks-panel-title">${icon("ear")} First, listen</h2>
      <p class="ks-cheer">${escapeHtml(theme.cheer)}</p>
      <ol class="ks-todo">${steps.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>
      <div class="ks-actions">
        ${task.audio?.available
          ? `<button class="ks-btn ks-play" id="ks-model" type="button">${icon("volume-2")} Hear it</button>`
          : `<button class="ks-btn ks-play" id="ks-read" type="button">${icon("volume-2")} Read it to me</button>`}
        <button class="ks-btn ks-next" id="ks-go-say" type="button">My turn ${icon("arrow-right")}</button>
      </div>`;
  }

  // ----------------------------------------------------------------- 2: say
  // The step that did not exist. One line at a time, big, with the blanks as
  // slots — so a child who cannot yet read the paragraph can still meet the
  // sentence they are being asked to produce.
  function sayHtml(task, saved) {
    if (ownWords(task)) return ownWordsHtml(task, saved);
    const lines = linesFor(task);
    const said = saved.said.filter(Boolean).length;
    return `<h2 class="ks-panel-title">${icon("messages-square")} Now say it</h2>
      <p class="ks-lead">Tap the speaker to hear a line, say it out loud, then tick it off. <strong>${said} of ${lines.length}</strong> said.</p>
      <ul class="ks-lines">${lines.map((line, index) => {
        const isSaid = Boolean(saved.said[index]);
        let slot = -1;
        const body = splitBlanks(line).map((part) => {
          if (!part.blank) return `<span>${escapeHtml(part.text)}</span>`;
          slot += 1;
          const key = `${index}-${slot}`;
          const filled = saved.fills[key];
          return `<button class="ks-slot${filled ? " is-filled" : ""}" type="button" data-slot="${key}" aria-label="${filled ? `Change the word ${escapeHtml(filled)}` : "Choose a word for this space"}">${filled ? escapeHtml(filled) : "＿＿"}</button>`;
        }).join("");
        return `<li class="ks-line${isSaid ? " is-said" : ""}">
          <p class="ks-line-text">${body}</p>
          <div class="ks-line-actions">
            <button class="ks-btn ks-play ks-small" type="button" data-hear="${index}">${icon("volume-2")} Hear</button>
            <button class="ks-btn ks-tick${isSaid ? " is-on" : ""}" type="button" data-said="${index}">${icon("check")} ${isSaid ? "Said it" : "I said it"}</button>
          </div>
        </li>`;
      }).join("")}</ul>
      ${tray ? trayHtml() : ""}
      <div class="ks-actions">
        <button class="ks-btn ks-next" id="ks-go-record" type="button">${task.recordingRequired ? `Record me ${icon("mic")}` : `Next ${icon("arrow-right")}`}</button>
      </div>`;
  }

  // The own-words panel. No line to copy, so nothing here pretends there is one:
  // the plan is shown as a plan, the tick says "I said my part", and the Hear
  // button reads the PLAN rather than a sentence the child is supposed to repeat.
  function ownWordsHtml(task, saved) {
    const steps = scriptFor(task).steps;
    const done = Boolean(saved.said[0]);
    return `<h2 class="ks-panel-title">${icon("messages-square")} Now say it, your way</h2>
      <p class="ks-lead">There is no line to copy for this one — the words are yours. Here is the plan.</p>
      <ol class="ks-todo">${steps.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>
      <div class="ks-actions">
        <button class="ks-btn ks-play" id="ks-hear-plan" type="button">${icon("volume-2")} Hear the plan</button>
        <button class="ks-btn ks-tick${done ? " is-on" : ""}" type="button" data-said="0">${icon("check")} ${done ? "Said it" : "I said my part"}</button>
      </div>
      <div class="ks-actions">
        <button class="ks-btn ks-next" id="ks-go-record" type="button">${task.recordingRequired ? `Record me ${icon("mic")}` : `Next ${icon("arrow-right")}`}</button>
      </div>`;
  }

  // The word tray. A blank is the child's to fill, so the offer is this unit's
  // OWN vocabulary — the words the rest of the unit has been teaching them —
  // with a picture wherever word-pictures.js has an honest one, and their own
  // word if none of ours is what they meant. Nothing here is marked right or
  // wrong: "I like ______" has no correct answer, and pretending otherwise
  // would turn a speaking frame into a quiz.
  function trayHtml() {
    const words = wordBank().slice(0, 24);
    return `<div class="ks-tray" role="group" aria-label="Choose a word">
      <div class="ks-tray-head"><strong>Choose a word</strong><button class="ks-btn ks-ghost ks-small" type="button" data-tray-close>${icon("x")} Close</button></div>
      <div class="ks-tray-words">${words.map((word) => {
        const picture = wordPicture(word);
        return `<button class="ks-word" type="button" data-word="${escapeHtml(word)}">${picture ? `<span class="ks-word-pic" aria-hidden="true">${picture}</span>` : ""}<span>${escapeHtml(word)}</span></button>`;
      }).join("")}</div>
      <div class="ks-tray-own">
        <label for="ks-own">…or a word of your own</label>
        <div><input id="ks-own" type="text" maxlength="32" autocomplete="off" placeholder="type your word"><button class="ks-btn ks-next ks-small" type="button" data-own>${icon("check")} Use it</button></div>
      </div>
    </div>`;
  }

  // -------------------------------------------------------------- 3: record
  function recordHtml(task, saved) {
    if (!task.recordingRequired) {
      // 18 Grade 1 practices and a handful above are adult-led by design — the
      // data says so with recordingRequired:false, and the instruction says so
      // in words. Offering a microphone there would invent a requirement the
      // content does not make; offering nothing would leave a dead step. So it
      // asks for the thing the task actually asks for, and takes the child's
      // word for it, which is what an adult-led practice has always relied on.
      return `<h2 class="ks-panel-title">${icon("users")} Say it out loud</h2>
        <p class="ks-lead">This practice is for saying out loud with a grown-up or on your own. There is nothing to record.</p>
        <div class="ks-outloud">
          <div class="ks-outloud-echo">${echo("listen")}</div>
          <p class="ks-bubble">I am listening! Say every line once more, nice and clearly.</p>
        </div>
        <div class="ks-actions">
          <button class="ks-btn ks-tick${saved.recorded ? " is-on" : ""}" id="ks-outloud" type="button">${icon("check")} ${saved.recorded ? "We said it" : "We said it out loud"}</button>
          <button class="ks-btn ks-next" id="ks-go-check" type="button">Next ${icon("arrow-right")}</button>
        </div>`;
    }
    const panel = speakingPanel({
      recordingId: task.speakingId,
      target: targetFor(task),
      onResult: (ok, feedback) => {
        write(task, { best: Math.max(state(task).best ?? 0, feedback.score) });
        if (ok) sfx.win(); else sfx.drop();
        render();
      },
    });
    pendingBind = panel.bind;
    return `<h2 class="ks-panel-title">${icon("mic")} Record your voice</h2>
      <p class="ks-lead">Press the microphone, say your lines, then press it again to stop. Listen back before you send it.</p>
      <div class="ks-mic">
        <div class="ks-mic-ring" id="ks-ring" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="ks-mic-panel">${panel.html}</div>
      </div>
      <div class="ks-actions">
        <button class="ks-btn ks-next" id="ks-go-check" type="button">Next ${icon("arrow-right")}</button>
      </div>`;
  }

  // --------------------------------------------------------------- 4: check
  function checkHtml(task, saved) {
    const allSaid = saved.said.filter(Boolean).length >= tickTotal(task);
    return `<h2 class="ks-panel-title">${icon("check-circle")} How did it go?</h2>
      <ul class="ks-checks">${checksFor(task).map((question, index) => `<li>
          <button class="ks-check${saved.checks[index] ? " is-on" : ""}" type="button" data-check="${index}" aria-pressed="${saved.checks[index] ? "true" : "false"}">
            <span class="ks-check-box" aria-hidden="true">${icon("check")}</span><span>${escapeHtml(question)}</span>
          </button></li>`).join("")}</ul>
      <div class="ks-tally">
        <span class="${allSaid ? "is-on" : ""}">${icon("messages-square")} ${ownWords(task) ? "Said my part" : "Lines said"} ${allSaid ? "★" : ""}</span>
        <span class="${saved.recorded ? "is-on" : ""}">${icon("mic")} ${task.recordingRequired ? "Recorded" : "Said out loud"} ${saved.recorded ? "★" : ""}</span>
        <span class="${saved.best !== null ? "is-on" : ""}">${icon("sparkles")} ${saved.best === null ? "Not checked yet" : `Pronunciation ${saved.best}%`}</span>
      </div>
      <div class="ks-actions">
        <button class="ks-btn ks-gold" id="ks-done" type="button">${icon("check")} ${saved.done ? "Finished — go back" : "Finish this practice"}</button>
        ${openIndex + 1 < tasks.length ? `<button class="ks-btn ks-next" id="ks-next-task" type="button">Next practice ${icon("arrow-right")}</button>` : ""}
      </div>`;
  }

  // The recorder's own binding, handed over by english.js. Held between building
  // the markup and mounting it, exactly as the Game Park does — the panel's
  // listeners can only be attached once its html is in the document.
  let pendingBind = null;

  function bindPanel(task) {
    // Every handler below reads state(task) fresh at click time rather than
    // closing over a snapshot: a value captured here is stale the moment the
    // first tick lands, and these handlers outlive several of them.

    // --- step 1
    $("#ks-model")?.addEventListener("click", (event) => playClip(task.audio.source, event.currentTarget));
    $("#ks-read")?.addEventListener("click", (event) => speak(scriptFor(task).steps.join(" ") || task.instructionsAndModelLines, event.currentTarget));
    $("#ks-go-say")?.addEventListener("click", () => { sfx.step(); step = 1; render(); });

    // --- step 2
    // One rule per button, rather than one button with two sources of truth.
    // The recorded clip is the model for the WHOLE task, so it belongs to step 1
    // and is played there; a three-line practice would otherwise say all three
    // lines when a child asked to hear the second. This one speaks the sentence
    // in front of them, blanks and all as they filled them.
    $$("[data-hear]").forEach((button) => button.addEventListener("click", (event) => {
      speak(sentence(task, Number(button.dataset.hear)), event.currentTarget);
    }));
    $("#ks-hear-plan")?.addEventListener("click", (event) => speak(scriptFor(task).steps.join(" "), event.currentTarget));
    $$("[data-said]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.said);
      const said = [...state(task).said];
      said[index] = !said[index];
      write(task, { said });
      if (said[index]) { sfx.tick(); toast(PRAISE[(index + openIndex) % PRAISE.length]); }
      render();
    }));
    $$("[data-slot]").forEach((button) => button.addEventListener("click", () => {
      sfx.tap();
      tray = button.dataset.slot;
      render();
      // Put the tray where the eye already is, not at the top of the page.
      $(".ks-tray")?.scrollIntoView({ block: "nearest", behavior: still() ? "auto" : "smooth" });
    }));
    $("[data-tray-close]")?.addEventListener("click", () => { tray = null; render(); });
    $$("[data-word]").forEach((button) => button.addEventListener("click", () => {
      fillSlot(task, button.dataset.word);
    }));
    $("[data-own]")?.addEventListener("click", () => {
      const value = $("#ks-own").value.trim();
      if (!value) return toast("Type a word first, then press Use it.");
      return fillSlot(task, value);
    });
    $("#ks-own")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      $("[data-own]").click();
    });
    $("#ks-go-record")?.addEventListener("click", () => { sfx.step(); step = 2; tray = null; render(); });

    // --- step 3
    $("#ks-outloud")?.addEventListener("click", () => {
      write(task, { recorded: !state(task).recorded });
      sfx.tick();
      render();
    });
    if (pendingBind) {
      pendingBind();
      pendingBind = null;
      bindMicLevel(task);
    }
    $("#ks-go-check")?.addEventListener("click", () => { sfx.step(); step = 3; render(); });

    // --- step 4
    $$("[data-check]").forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.check);
      const checks = [...state(task).checks];
      checks[index] = !checks[index];
      write(task, { checks });
      if (checks[index]) sfx.tick();
      render();
    }));
    $("#ks-done")?.addEventListener("click", () => {
      write(task, { done: true });
      sfx.win();
      toast(`Practice ${openIndex + 1} finished. ${starsFor(task)} of 3 stars.`);
      openIndex = null;
      render();
    });
    $("#ks-next-task")?.addEventListener("click", () => {
      write(task, { done: true });
      sfx.step();
      openIndex += 1;
      step = firstUnfinishedStep(tasks[openIndex]);
      render();
    });
  }

  function fillSlot(task, word) {
    if (!tray) return;
    const fills = { ...state(task).fills, [tray]: word };
    // Filling a blank changes the sentence, so a line already ticked as "said"
    // is a tick against words the child has not spoken yet. Clearing it is the
    // honest move — the same rule the recorder keeps when a new recording
    // arrives and the previous feedback is cleared with it.
    const said = [...state(task).said];
    said[Number(String(tray).split("-")[0])] = false;
    write(task, { fills, said });
    sfx.drop();
    tray = null;
    render();
  }

  // A five-year-old cannot tell a live microphone from a dead one. english.js's
  // recorder dispatches the level it is hearing on the button that started it,
  // so this is a listener rather than a second getUserMedia — two streams would
  // mean two permission prompts for one press.
  function bindMicLevel(task) {
    const button = $(`[data-record="${task.speakingId}"]`);
    const ring = $("#ks-ring");
    if (!button || !ring) return;
    button.addEventListener("recordinglevel", (event) => {
      ring.style.setProperty("--ks-level", String(Math.max(0.06, event.detail.level)));
    });
    // The recording that matters is the one that EXISTS, asked of english.js
    // rather than assumed from the press: a refused microphone permission leaves
    // a press and no recording, and a star for that would mean nothing. The
    // recorder announces the moment the blob is saved, so this listens for that
    // rather than racing it with a timer.
    //
    // It deliberately does NOT repaint. english.js has just set this element's
    // src and unhidden it, and a re-render here would drop the learner's fresh
    // recording out of the player they are about to listen to. The star strip
    // catches up on the next step, which is where it is read.
    const playback = document.querySelector(`[data-playback="${task.speakingId}"]`);
    playback?.addEventListener("recordingready", () => {
      ring.style.removeProperty("--ks-level");
      if (hasRecording(task.speakingId) && !state(task).recorded) write(task, { recorded: true });
    });
  }

  return { render, reset: () => { openIndex = null; step = 0; tray = null; scripts.clear(); } };
}

// A practice title is written for a contents list — "Speaking 1 — Introduce
// Yourself", "Speaking 3: Describe Your Daily Routine" — and the number is
// already above it on the card. Keeping both prints the number twice on a
// six-year-old's screen.
function shortTitle(title) {
  return String(title || "").replace(/^\s*speaking\s*\d+\s*[-—:.]\s*/i, "").trim() || String(title || "");
}

const STYLE = `
.ks { --ks-a: #e6f4f1; --ks-b: #1f7a72; --ks-ink: #22323f; font-synthesis-weight: none; }
.ks * { box-sizing: border-box; }
.ks-eyebrow { display:block; font-size:.78rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--ks-b); }

/* ---- the map ---- */
.ks-hero { display:flex; gap:1.25rem; align-items:center; flex-wrap:wrap;
  background:linear-gradient(135deg,#eaf6ff,#fff6e6); border:2px solid #dfe9f2; border-radius:22px; padding:1.25rem 1.5rem; }
.ks-hero-echo { flex:0 0 118px; }
.ks-hero-say { flex:1 1 260px; }
.ks-hero-say h1 { margin:.15rem 0 .5rem; font-size:clamp(1.6rem,4vw,2.3rem); color:var(--ks-ink); }
.ks-bubble { position:relative; display:inline-block; margin:0; background:#fff; border:2px solid #dfe9f2; border-radius:16px;
  padding:.6rem .9rem; font-size:1.02rem; line-height:1.45; color:var(--ks-ink); }
.ks-hero-stats { display:flex; gap:.6rem; flex-wrap:wrap; margin-top:.75rem; }
.ks-stat { background:#fff; border:2px solid #dfe9f2; border-radius:999px; padding:.3rem .8rem; font-size:.92rem; }
.ks-stat strong { color:var(--ks-b); }

.ks-path { list-style:none; display:grid; gap:1rem; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); padding:0; margin:1.25rem 0; }
.ks-stagecard { --ks-a:#e6f4f1; --ks-b:#1f7a72; width:100%; text-align:left; cursor:pointer; display:flex; flex-direction:column; gap:.55rem;
  background:var(--ks-a); border:3px solid transparent; border-radius:20px; padding:1rem; color:var(--ks-ink);
  box-shadow:0 3px 0 rgba(0,0,0,.08); transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease; }
.ks-stagecard:hover, .ks-stagecard:focus-visible { transform:translateY(-3px); border-color:var(--ks-b); box-shadow:0 7px 0 rgba(0,0,0,.10); outline:none; }
.ks-stagecard.is-done { border-color:var(--ks-b); }
.ks-stagecard-badge { font-size:2rem; line-height:1; }
.ks-stagecard-no { display:block; font-size:.76rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--ks-b); }
.ks-stagecard-title { display:block; font-size:1.12rem; line-height:1.3; margin:.1rem 0; }
.ks-stagecard-type { display:block; font-size:.85rem; opacity:.75; }
.ks-stagecard-foot { display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-top:auto; font-size:.86rem; }
.ks-stagecard-foot svg { width:1em; height:1em; vertical-align:-.12em; }
.ks-stars i { font-style:normal; color:#cfd8e0; font-size:1.05rem; }
.ks-stars i.on { color:#f0a92b; }

.ks-finish { background:#fff; border:2px dashed #cfd8e0; border-radius:20px; padding:1.1rem 1.25rem; text-align:center; }
.ks-finish p { margin:0 0 .7rem; }
.ks-finish-done { margin:0; color:#1f7a4a; font-weight:600; }
.ks-finish-done svg { width:1.1em; height:1.1em; vertical-align:-.18em; }

/* ---- a stage ---- */
.ks-topbar { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.9rem; flex-wrap:wrap; }
.ks-count { font-weight:700; color:var(--ks-b); }
.ks-stage-head { display:flex; gap:1rem; align-items:center; background:var(--ks-a); border-radius:22px; padding:1rem 1.25rem; }
.ks-stage-head h1 { margin:.1rem 0 0; font-size:clamp(1.35rem,3.2vw,1.9rem); color:var(--ks-ink); }
.ks-stage-badge { font-size:2.4rem; line-height:1; }
.ks-stage-echo { margin-left:auto; flex:0 0 92px; }

.ks-ladder { list-style:none; display:flex; gap:.5rem; padding:0; margin:1rem 0; flex-wrap:wrap; }
.ks-rung { flex:1 1 120px; }
.ks-rung button { width:100%; display:flex; flex-direction:column; align-items:center; gap:.25rem; cursor:pointer;
  background:#fff; border:2px solid #dfe9f2; border-radius:16px; padding:.6rem .4rem; color:var(--ks-ink); font-weight:600; }
.ks-rung button:disabled { opacity:.45; cursor:not-allowed; }
.ks-rung.is-now button { background:var(--ks-b); border-color:var(--ks-b); color:#fff; }
.ks-rung.is-past button { border-color:var(--ks-b); }
.ks-rung-icon svg { width:1.35rem; height:1.35rem; }
.ks-rung-label { font-size:.9rem; }

.ks-panel { background:#fff; border:2px solid #dfe9f2; border-radius:22px; padding:1.25rem; }
.ks-panel-title { margin:0 0 .5rem; font-size:1.25rem; display:flex; align-items:center; gap:.5rem; color:var(--ks-ink); }
.ks-panel-title svg { width:1.3rem; height:1.3rem; color:var(--ks-b); }
.ks-cheer { margin:0 0 .75rem; font-size:1.1rem; font-weight:600; color:var(--ks-b); }
.ks-lead { margin:0 0 .9rem; font-size:1.02rem; line-height:1.5; }
.ks-todo { margin:0 0 1rem; padding-left:1.3rem; }
.ks-todo li { font-size:1.05rem; line-height:1.55; margin-bottom:.4rem; }

.ks-actions { display:flex; gap:.6rem; flex-wrap:wrap; margin-top:1rem; }
.ks-btn { display:inline-flex; align-items:center; gap:.45rem; cursor:pointer; font-weight:700; font-size:1rem;
  border-radius:999px; padding:.7rem 1.15rem; border:2px solid var(--ks-b); background:#fff; color:var(--ks-b); }
.ks-btn svg { width:1.15em; height:1.15em; }
.ks-btn:hover, .ks-btn:focus-visible { background:var(--ks-a); outline:none; }
.ks-btn.ks-next { background:var(--ks-b); color:#fff; }
.ks-btn.ks-next:hover { filter:brightness(1.08); }
.ks-btn.ks-gold { background:#f0a92b; border-color:#c8860f; color:#3a2a05; }
.ks-btn.ks-ghost { border-color:#cfd8e0; color:#4a5b68; }
.ks-btn.ks-small { padding:.45rem .8rem; font-size:.9rem; }
.ks-btn.ks-tick.is-on { background:#1f7a4a; border-color:#1f7a4a; color:#fff; }

/* ---- step 2: the lines ---- */
.ks-lines { list-style:none; padding:0; margin:0; display:grid; gap:.75rem; }
.ks-line { border:2px solid #dfe9f2; border-radius:18px; padding:.9rem 1rem; background:#fcfdff; }
.ks-line.is-said { border-color:#1f7a4a; background:#f2fbf5; }
.ks-line-text { margin:0 0 .7rem; font-size:clamp(1.15rem,2.8vw,1.5rem); line-height:1.5; color:var(--ks-ink); }
.ks-line-actions { display:flex; gap:.5rem; flex-wrap:wrap; }
.ks-slot { font:inherit; cursor:pointer; border:2px dashed var(--ks-b); background:#fff; color:var(--ks-b);
  border-radius:10px; padding:0 .45rem; min-width:3.5rem; }
.ks-slot.is-filled { border-style:solid; background:var(--ks-a); }

.ks-tray { margin-top:1rem; border:2px solid var(--ks-b); border-radius:18px; padding:.9rem; background:var(--ks-a); }
.ks-tray-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.6rem; }
.ks-tray-words { display:flex; flex-wrap:wrap; gap:.45rem; }
.ks-word { cursor:pointer; display:inline-flex; align-items:center; gap:.35rem; background:#fff; border:2px solid #dfe9f2;
  border-radius:12px; padding:.35rem .6rem; font-size:1rem; color:var(--ks-ink); }
.ks-word:hover, .ks-word:focus-visible { border-color:var(--ks-b); outline:none; }
.ks-word-pic svg, .ks-word-pic img { width:1.6rem; height:1.6rem; display:block; }
.ks-tray-own { margin-top:.8rem; }
.ks-tray-own label { display:block; font-size:.9rem; margin-bottom:.3rem; }
.ks-tray-own div { display:flex; gap:.5rem; flex-wrap:wrap; }
.ks-tray-own input { font:inherit; border:2px solid #dfe9f2; border-radius:12px; padding:.45rem .7rem; min-width:11rem; }

/* ---- step 3: the microphone ---- */
.ks-mic { display:flex; gap:1rem; align-items:flex-start; flex-wrap:wrap; }
.ks-mic-panel { flex:1 1 260px; }
.ks-mic-ring { --ks-level:.06; position:relative; flex:0 0 120px; height:120px; display:grid; place-items:center; }
.ks-mic-ring span { position:absolute; border-radius:50%; border:3px solid var(--ks-b); opacity:.35;
  width:calc(46px + var(--ks-level) * 70px); height:calc(46px + var(--ks-level) * 70px); }
.ks-mic-ring span:nth-child(2) { width:calc(62px + var(--ks-level) * 50px); height:calc(62px + var(--ks-level) * 50px); opacity:.22; }
.ks-mic-ring span:nth-child(3) { width:calc(80px + var(--ks-level) * 34px); height:calc(80px + var(--ks-level) * 34px); opacity:.12; }
.ks-outloud { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; background:var(--ks-a); border-radius:18px; padding:1rem; }
.ks-outloud-echo { flex:0 0 92px; }

/* ---- step 4: the check ---- */
.ks-checks { list-style:none; padding:0; margin:0 0 1rem; display:grid; gap:.55rem; }
.ks-check { width:100%; text-align:left; cursor:pointer; display:flex; align-items:center; gap:.7rem;
  background:#fff; border:2px solid #dfe9f2; border-radius:16px; padding:.7rem .9rem; font-size:1.05rem; color:var(--ks-ink); }
.ks-check-box { display:grid; place-items:center; width:1.85rem; height:1.85rem; border-radius:8px; border:2px solid #cfd8e0; color:transparent; flex:0 0 auto; }
.ks-check-box svg { width:1.1rem; height:1.1rem; }
.ks-check.is-on { border-color:#1f7a4a; background:#f2fbf5; }
.ks-check.is-on .ks-check-box { background:#1f7a4a; border-color:#1f7a4a; color:#fff; }
.ks-tally { display:flex; gap:.5rem; flex-wrap:wrap; }
.ks-tally span { display:inline-flex; align-items:center; gap:.35rem; background:#f4f7fa; border:2px solid #dfe9f2;
  border-radius:999px; padding:.35rem .8rem; font-size:.92rem; }
.ks-tally span.is-on { background:#f2fbf5; border-color:#1f7a4a; }
.ks-tally svg { width:1em; height:1em; }

/* ---- motion ---- */
.ks-echo { width:100%; height:auto; display:block; }
.ks-echo .ks-echo-head { transform-origin:60px 60px; animation:ks-nod 3.4s ease-in-out infinite; }
.ks-echo.is-listen .ks-echo-head { animation:ks-lean 2s ease-in-out infinite; }
.ks-echo.is-talk .ks-echo-beak { animation:ks-chat .55s ease-in-out infinite; transform-origin:60px 48px; }
.ks-echo.is-cheer .ks-echo-body { animation:ks-hop .8s ease-in-out infinite; }
.ks-echo .ks-echo-wing { transform-origin:34px 62px; }
.ks-echo.is-cheer .ks-echo-wing { animation:ks-flap .5s ease-in-out infinite; }
@keyframes ks-nod { 0%,100% { transform:rotate(0); } 50% { transform:rotate(-3deg); } }
@keyframes ks-lean { 0%,100% { transform:rotate(0); } 50% { transform:rotate(9deg); } }
@keyframes ks-chat { 0%,100% { transform:scaleY(1); } 50% { transform:scaleY(.55); } }
@keyframes ks-hop { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
@keyframes ks-flap { 0%,100% { transform:rotate(0); } 50% { transform:rotate(-22deg); } }

/* Motion is decoration. Stilling it must never remove a word: every state the
   animation shows is also written on the page. */
.ks-still .ks-echo * { animation:none !important; }
@media (prefers-reduced-motion: reduce) {
  .ks-echo * { animation:none !important; }
  .ks-stagecard { transition:none; }
}
@media (max-width: 640px) {
  .ks-stage-echo { display:none; }
  .ks-rung-label { font-size:.8rem; }
}
`;
