// The one definition of what Ehel Intensive English narrates and what each clip
// is called.
//
// A clip is named cyrb53(button text), so these strings must match the
// voiceButton() calls in shell/subjects/intensive-english.js character for
// character. One character apart is a different filename: the app then asks for
// a file that was never written, silently falls back to the paid runtime
// endpoint, and the clip that was bought serves nobody.
//
// Every string below is annotated with the line it mirrors.

const fs = require("fs");
const path = require("path");
const { levelDir, levels: intensiveLevels } = require("./ehel-intensive-levels");

const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");
const { speakableFrames, speakableWords } = require("./ehel-tts");
const { speakablePhonics, phonicsWordCard } = require("./ehel-phonics-speech");

// `slideLabels` is the odd one and says so: the other six are per-unit text the
// SHELL speaks through voiceButton(), while slideLabels belongs to the
// standalone build and is read off its built pages (see appSlideTexts below).
// textsForUnit returns nothing for it, which is correct — there is no unit field
// to read — so anything walking units alone simply never sees it.
const CATEGORIES = ["lecture", "readings", "grammar", "words", "wordSentences", "speaking", "slideLabels", "sectionIntros"];

function textsForUnit(unit, category) {
  switch (category) {
    // line 140: voiceButton(script) where script is the unit lecture.
    case "lecture": {
      const script = (unit.visual || {}).lectureScript;
      return script ? [script] : [];
    }
    // line 294: voiceButton(reading.passageScript)
    //
    // `passageScriptSpeech` is the spoken form, and the same trade
    // speechSpelling makes for a dictionary word: it changes only what is SENT
    // to ElevenLabs, never what the learner reads. Level 1's readings include
    // real forms — a registration form, an appointment card — whose blanks are
    // the point on the page and unreadable aloud. Use it only where a blank
    // makes the text unspeakable, not to reword a passage.
    case "readings":
      return (unit.readings || []).map((r) => r.passageScript);
    // line 234: voiceButton(`${lesson.title}. ${lesson.explanation}`)
    // The title is spoken here even though the review stripped it from the
    // workbook's grammar rows — that row is a composite of explanation, rule,
    // worked example and tip which the app never plays as one clip, so it is
    // not the shape this button asks for. The app is the authority.
    case "grammar":
      return (unit.grammar || []).map((g) => `${g.title}. ${g.explanation}`);
    // line 348: voiceButton(task.instructionsAndModelLines)
    // Same spoken-form rule as readings above.
    case "speaking":
      return (unit.speaking || []).map((s) => s.instructionsAndModelLines);
    // line 179: voiceButton(item.displayWord)
    case "words":
      return (unit.dictionaryLinks || []).map((d) => d.displayWord);
    // line 189: voiceButton(sentences[activeSentence]), where sentences is the
    // practice list, or the example sentence when the practice list is empty.
    case "wordSentences":
      return (unit.dictionaryLinks || []).flatMap((d) =>
        (d.practiceSentences || []).length ? d.practiceSentences : [d.exampleSentence]);
    default:
      return [];
  }
}

// Every clip the course needs, de-duplicated by hash: the same text in two
// units is one file, bought once.
// The spoken form beside a displayed text, index-aligned with textsForUnit, or
// null where there is none. Only readings and speaking carry one.
//
// textsForUnit returns what the app DISPLAYS, because that is what it hashes
// to find a clip. It used to return the spoken form instead, wherever one was
// authored, and so named those clips after text the app never asks for: the
// three spoken-form clips in the earlier Level 1 were on disk under the spoken
// form's hash, and the app requested the displayed text's hash and fell back
// to the paid runtime voice, reading the blanks aloud (found 2026-09-11). Now
// the name comes from the display and only the recording comes from here.
function speechForUnit(unit, category) {
  switch (category) {
    case "readings":
      return (unit.readings || []).map((r) => r.passageScriptSpeech || null);
    case "speaking":
      return (unit.speaking || []).map((s) => s.instructionsAndModelLinesSpeech || null);
    default:
      return textsForUnit(unit, category).map(() => null);
  }
}

// The Phonics level's grapheme WORD CARDS (`s`, `ng`, `igh`), keyed by the
// displayed headword, with the spoken form each card is recorded as.
function phonicsCards(unit) {
  const cards = new Map();
  for (const d of unit.dictionaryLinks || []) {
    if (!/^letters?$/.test(d.partOfSpeech || "")) continue;
    const spoken = phonicsWordCard(d.displayWord, d.exampleSentence);
    if (spoken) cards.set(clean(d.displayWord), spoken);
  }
  return cards;
}

function clipsForUnit(unit, categories = CATEGORIES) {
  const out = [];
  // The Phonics level (-1) is the one place a lowercase letter is voiced as its
  // SOUND and never its name: `c.` would otherwise be recorded as "see" in
  // the level whose first rule is not to say it. lib/ehel-phonics-speech.js
  // holds the measured spellings; everywhere else, text passes through as-is.
  const phonics = ((unit || {}).unit || {}).levelId === "lph";
  for (const category of categories) {
    const speech = speechForUnit(unit, category);
    // A single grapheme's card is under the floor, so it would fall through to
    // the LIVE voice — which says the letter name, on the one card whose job
    // is the sound. The app looks for a recorded clip whatever the length
    // (course-app.js :: defaultStaticVoiceUrl), so these are recorded.
    const cards = phonics && category === "words" ? phonicsCards(unit) : null;
    for (const [index, raw] of textsForUnit(unit, category).entries()) {
      const text = clean(raw);
      const card = cards ? cards.get(text) : undefined;
      // `source` is what is recorded: the spoken form where one is authored,
      // otherwise the displayed text itself.
      const source = card || (speech[index] ? clean(speech[index]) : text);
      // Below the floor the request is not worth making; the UI speaks these
      // through the runtime voice instead.
      if (!text || (text.length < MIN_CHARS && !card)) continue;
      // The clip is looked up by cyrb53 of the DISPLAYED text (staticVoiceKey
      // in shell/course-app.js knows nothing of this transform), so `hash`
      // stays on `text`, unchanged. `spoken` is what actually goes to
      // ElevenLabs: speakableFrames() (lib/ehel-tts.js) reads a slash the way
      // a teacher would ("sit / seat" -> "sit, seat"; two full sentences
      // joined by "/" -> two sentences) rather than saying "/" aloud or
      // running the words together. Added 2026-09-03 for the 21 clips across
      // both levels — almost entirely "speaking" drills pairing full
      // sentences or minimal pairs with "/" — that carried a literal slash
      // into the recording with no transform at all.
      // Units 15-20 teach SPELLINGS of sounds already known, so a grapheme in a
      // sentence there is said by its letters; 1-14 teach the sounds themselves.
      const base = phonics && !card
        ? speakablePhonics(source, { spelling: Number(unit.unit.unitNo) >= 15 }) : source;
      out.push({ category, text, source, spoken: speakableWords(speakableFrames(base)), hash: cyrb53(text) });
    }
  }
  return out;
}

// The STANDALONE lesson build speaks its slide labels, and it does so on a
// different path from everything above: deck.js has `if (speak)
// say(slides[cur].dataset.say)`, which is the voice engine directly rather than
// playClip(). It is narration all the same — on a real launch say() resolves to
// quiz_tts.php, which proxies ElevenLabs, so a label with no clip is a paid call
// every time a learner hears it.
//
// These are read from the BUILT PAGES, not re-derived from the unit JSON. The
// labels are decided by build-lessons.py's steps_for(), and a second
// implementation of that here is precisely the divergence that put an
// ungenerated example sentence at the front of every word card until
// 2026-09-17 — two definitions of one list, agreeing by coincidence until they
// did not. The pages are the artifact; their data-say attributes are what is
// actually spoken.
const ATTR_ENTITIES = { "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const unescapeAttr = (s) => String(s).replace(/&(?:quot|#39|apos|lt|gt|amp);/g, (m) => ATTR_ENTITIES[m]);

// Each label, with the unit of the first page that carries it (pages walked in
// sorted order, so the choice is stable; the hub is unit 0). The unit matters
// only to the Phonics level, whose units 15-20 say a grapheme by its letters.
function appSlideEntries(courseRoot, level) {
  const dir = path.join(courseRoot, `${levelDir(level, courseRoot)}-app`);
  const out = new Map();
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const unitNo = Number((file.match(/^unit-(\d+)-/) || [])[1]) || 0;
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    for (const m of html.matchAll(/data-say="([^"]*)"/g)) {
      // intensive.js is inlined verbatim into every page, so its own source
      // line `data-say="' + esc(text) + '"` matches this regex. It is markup
      // being written at run time, not markup.
      if (m[1].includes("' + esc(")) continue;
      const text = clean(unescapeAttr(m[1]));
      if (text.length >= MIN_CHARS && !out.has(text)) out.set(text, unitNo);
    }
  }
  return out;
}

function appSlideTexts(courseRoot, level) {
  return new Set(appSlideEntries(courseRoot, level).keys());
}

// Shaped like clipsForUnit's output so the generator can treat them alike.
// The Phonics level's labels carry the units' own notation ("s - a - t", "ai,
// ay or a_e"), so they take the same spoken form as the units do — the deck
// would otherwise read them out by letter NAME.
function appSlideClips(courseRoot, level) {
  const phonics = Number(level) === -1;
  return [...appSlideEntries(courseRoot, level)].map(([text, unit]) => ({
    category: "slideLabels",
    text,
    source: text,
    spoken: speakableWords(speakableFrames(phonics ? speakablePhonics(text, { spelling: unit >= 15 }) : text)),
    hash: cyrb53(text),
    unit,
  }));
}

// The SHELL course's thirteen section intros — `${title}. ${description}` for
// each — read from shell/subjects/intensive-english-sections.js, which is also
// what intensive-english.js renders. One definition, two consumers: the page
// shows the string and this buys the clip, and neither retypes the other.
//
// That module is an ES module and this file is CommonJS, so it is evaluated
// through a node subprocess rather than required. It is the pattern
// intensive-english/lesson-kit/build-lessons.py already uses for
// word-pictures.js, and it works for the same reason: the module has no imports
// and touches no DOM, so node can evaluate it as-is. One spawn per level, and
// the alternative — retyping thirteen headers here — is the exact defect this
// whole arrangement exists to prevent.
const SECTIONS_MODULE = path.join(__dirname, "..", "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "intensive-english-sections.js");

function sectionIntroTexts(contexts) {
  if (!fs.existsSync(SECTIONS_MODULE) || !contexts.length) return [];
  const url = "file:///" + SECTIONS_MODULE.replace(/\\/g, "/");
  // Written to a .mjs file rather than passed with --input-type=module: that
  // flag makes node warn about reparsing on every call, onto stderr, which
  // buries the caller's own output.
  const tmp = path.join(__dirname, `_sections.${process.pid}.tmp.mjs`);
  const script = `import('${url}').then((m) => {`
    + `const out = ${JSON.stringify(contexts)}.map((c) => m.introTextsForUnit(c));`
    + `process.stdout.write(JSON.stringify(out));`
    + `});`;
  try {
    fs.writeFileSync(tmp, script, "utf8");
    // stderr is dropped, exactly as build-lessons.py drops it for the same
    // module: intensive-english-sections.js is a .js file with `export` in a
    // package that declares no "type", so node prints a
    // MODULE_TYPELESS_PACKAGE_JSON warning on EVERY spawn. Left alone it lands
    // in the middle of a generator's cost table or a pruner's delete list. A
    // non-zero exit still throws, so a real failure is not being swallowed —
    // only the notice about how node parsed a file it parsed correctly.
    const raw = require("child_process").execFileSync(process.execPath, [tmp], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(raw);
  } catch (exc) {
    throw new Error(`could not evaluate intensive-english-sections.js (${exc.message})`);
  } finally {
    try { fs.unlinkSync(tmp); } catch (e) { /* the run already succeeded or failed on its own terms */ }
  }
}

// One context per unit, in the shape the shared module names. The counts are
// DERIVED from the unit rather than listed, because a unit that gains an
// activity must change its clip — a frozen list is how the word cards came to
// ask for audio nobody had bought.
function sectionIntroClips(courseRoot, level) {
  const levelRoot = path.join(courseRoot, levelDir(level, courseRoot));
  const unitDir = path.join(levelRoot, "data", "units");
  if (!fs.existsSync(unitDir)) return [];
  const manifestPath = path.join(levelRoot, "data", "course-manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  const levelRow = (manifest.levels || []).find((row) => Number(row.number) === Number(level)) || {};
  const dictFile = fs.readdirSync(path.join(levelRoot, "data"))
    .find((f) => /^master-dictionary\./.test(f));
  // `entryCount` is the field the app itself reads (`dictionary.entryCount`),
  // so take that rather than counting `entries` — the two agree today and the
  // app's choice is the one that must be mirrored if they ever stop.
  const entryCount = dictFile
    ? JSON.parse(fs.readFileSync(path.join(levelRoot, "data", dictFile), "utf8")).entryCount || 0
    : 0;

  const contexts = [];
  for (const file of fs.readdirSync(unitDir).sort()) {
    if (!/^unit-\d+\.json$/.test(file)) continue;
    const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
    contexts.push({
      levelLabel: levelRow.label || "",
      levelEntryCount: entryCount,
      unitNo: unit.unit.unitNo,
      unitTitle: unit.unit.unitTitle,
      unitOverview: unit.unit.unitOverview,
      wordCount: (unit.dictionaryLinks || []).length,
      activityCount: (unit.activities || []).length,
      quizCount: (unit.quizzes || []).length,
    });
  }

  const out = new Map();
  // Index-aligned with `contexts` (sectionIntroTexts maps them in order), so the
  // Phonics level can say its unit titles as SOUNDS: these intros open on the
  // unit's title and overview ("ng nk th sh ch. New sounds: ng, nk, ..."), and
  // without the transform the voice spelled them out by letter NAME, one line
  // above "Say the sound, not the letter name."
  const phonics = Number(level) === -1;
  for (const [index, texts] of sectionIntroTexts(contexts).entries()) {
    const spelling = Number(contexts[index].unitNo) >= 15;
    for (const raw of texts) {
      const text = clean(raw);
      if (text.length < MIN_CHARS || out.has(cyrb53(text))) continue;
      const base = phonics ? speakablePhonics(text, { spelling }) : text;
      out.set(cyrb53(text), {
        category: "sectionIntros",
        text,
        source: text,
        spoken: speakableWords(speakableFrames(base)),
        hash: cyrb53(text),
      });
    }
  }
  return [...out.values()];
}

// Every hash one level needs. The uploader fans the flat local cache out into
// the per-stage deploy tree with this, so a text shared by two levels is
// uploaded under both.
function hashesForLevel(courseRoot, level, categories = CATEGORIES) {
  const unitDir = path.join(courseRoot, levelDir(level, courseRoot), "data", "units");
  const out = new Set();
  if (!fs.existsSync(unitDir)) return out;
  // Wehel's stock phrases are spoken on every level's tutor panel, so every
  // level claims them (tools/lib/ehel-wehel-phrases.js is the definition).
  for (const raw of require("./ehel-wehel-phrases").phrasesForSubject("intensive-english")) {
    const text = clean(raw);
    if (text.length >= MIN_CHARS) out.add(cyrb53(text));
  }
  for (const file of fs.readdirSync(unitDir)) {
    if (!/^unit-\d+\.json$/.test(file)) continue;
    const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
    for (const clip of clipsForUnit(unit, categories)) out.add(clip.hash);
  }
  // The standalone build's slide labels, which live on its pages rather than in
  // any unit. This is what makes them uploadable and — just as importantly —
  // what stops the CDN pruner calling them unreachable and deleting them.
  if (categories.includes("slideLabels")) {
    for (const clip of appSlideClips(courseRoot, level)) out.add(clip.hash);
  }
  // The SHELL course's section intros, which live in the UI module rather than
  // in any unit. Same reason as slideLabels above: this is what makes them
  // upload, and what stops the CDN pruner calling them unreachable and deleting
  // clips that were just bought.
  if (categories.includes("sectionIntros")) {
    for (const clip of sectionIntroClips(courseRoot, level)) out.add(clip.hash);
  }
  return out;
}

// hash -> the levels that claim it. Named for the shape the uploader expects
// from every subject; this course's stages are CEFR levels, not school grades,
// but they occupy the same gNN slot in the deploy path.
function hashGradeMap(courseRoot, categories = CATEGORIES) {
  const map = new Map();
  // Discovered through the shared module, not by a regex on the folder
  // name. `/^level-(\d+)$/` was right for four years and stopped being right
  // when the Phonics level arrived as `level-phonics`: it matched one folder
  // fewer, so every clip Phonics claims would have been missing from this
  // map and missing from the upload, with no error anywhere.
  for (const { number: level } of intensiveLevels(courseRoot)) {
    for (const key of hashesForLevel(courseRoot, level, categories)) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(level);
    }
  }
  return map;
}

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, textsForUnit, speechForUnit, clipsForUnit, appSlideTexts, appSlideClips, sectionIntroClips, hashesForLevel, hashGradeMap };
