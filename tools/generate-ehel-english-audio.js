#!/usr/bin/env node
// Generates ElevenLabs narration for the unified English course and wires the
// audio hooks into the unit JSONs.
//
// Idempotent: existing mp3s (>1 KB) are reused, so runs are resumable and safe
// to re-run. Reports characters sent (ElevenLabs bills per character) so cost
// is visible.
//
// Usage:
//   node tools/generate-ehel-english-audio.js <category> [grade ...] [--dry] [--limit N] [--force]
//   [--sandbox <dir>] sends every write into <dir> instead of the repo, for
//   exercising the generator against a mock without touching a clip, a
//   descriptor or the narration index.
//   category = readings | grammar | speaking | vocabulary | dictionary | overview
//   overview = the unit overview page, ONE CLIP PER PANEL (intro, outcomes,
//   path) rather than one per page, so rewording an outcome re-buys the
//   outcomes clip alone. Also narrates the Prerequisite unit's overview from
//   placement-exam.json. Panels that are counts, compliance notes or
//   progress-dependent text carry no clip -- see renderOverview() in
//   shell/subjects/english.js, which is the definition of what is on screen.
//   vocabulary = one clip per dictionaryLinks practice sentence (add --meanings
//   to also narrate each childMeaning -- off by default, see below); rewrites each
//   sentenceAudio descriptor to the resolver-compatible media/audio/grade-N/
//   vocabulary/ path (the template's original ./unit-K/media/... paths matched
//   neither the disk layout nor resolveMediaUrl and never had files).
//   dictionary = one pronunciation clip per master-dictionary.gradeN.json entry
//   (the word alone), which is what the vocabulary page's Listen button plays.
//   Also rewrites each entry's audio.normal to the resolver-compatible
//   media/audio/grade-N/dictionary/ path; the authored ./media/dictionary/ and
//   ./vocabulary-audio/ paths resolved to nothing on disk.
//   glossary = two clips per sentence-glossary.json entry (the word, and its
//   definition) -- the words the click-popover on a vocabulary word's practice
//   sentence links to (linkGlossaryWords/showGlossaryPopover in english.js).
//   A mostly separate word list from master-dictionary: most entries have no
//   dictionaryEntryId to join against, so this narrates its own text rather
//   than reusing the dictionary clips.
//   e.g. node tools/generate-ehel-english-audio.js readings 1
//        node tools/generate-ehel-english-audio.js readings 1 2 3 --limit 5
//        node tools/generate-ehel-english-audio.js readings --dry   (estimate only)
//        node tools/generate-ehel-english-audio.js vocabulary 1 --only g1-u9-g1-5-library

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");

// One definition of how this project talks to ElevenLabs, shared with the other
// generators: the voice, the model, the request timeout, and which of the three
// kinds a failure is — fatal (the credential or the account, stop the run),
// permanent (this text, one attempt) or transient (retry). See
// tools/lib/ehel-tts.js.
//
// VOICE_ID and MODEL_ID come from there too. Unlike the other five generators,
// this one records them in the manifest it writes (`provider: "ElevenLabs",
// voiceId, model`), so the clip's own metadata names the voice that made it —
// which means the constant a run reads and the constant it writes down can
// never disagree.
const { tts, speakableFrames, speakableLetterRanges, FatalTtsError, PermanentTtsError, VOICE_ID, MODEL_ID, DELIVERIES } = require("./lib/ehel-tts");

// --- args ---
const args = process.argv.slice(2);
const category = args.find((a) => /^(readings|grammar-practice|grammar|speaking|vocabulary|dictionary|glossary|writing|activities|final-quiz|overview)$/.test(a)) || "readings";
// A bare 1-8 selects a grade — but only when it is not the VALUE of a flag.
// `--limit 5` used to add grade 5 to the run: the number is a positional match,
// so a run meant to cap itself at five clips quietly widened to a second grade
// and billed for it. Flag values are consumed here rather than filtered later,
// so a new flag with a numeric argument gets the same protection by listing it.
const FLAGS_WITH_VALUES = new Set(["--limit", "--only", "--emit-scripts", "--delivery"]);
// --delivery <name>: which DELIVERY of the approved voice to record with — one of
// the named presets in lib/ehel-tts.js (`standard`, the course default, or
// `lively`). Same voice, same script, read differently. An unknown name is
// refused rather than defaulted, because a typo here would bill a whole run in
// the wrong voice. Every descriptor this run writes records the name it used
// (see voiceMeta), so a clip's metadata says how it was read as well as by whom.
const deliveryArg = args.indexOf("--delivery");
const delivery = deliveryArg >= 0 ? args[deliveryArg + 1] : "standard";
if (!Object.prototype.hasOwnProperty.call(DELIVERIES, delivery)) {
  console.error(`Unknown --delivery "${delivery}". Known: ${Object.keys(DELIVERIES).join(", ")}`);
  process.exit(2);
}
// A preset names its voice as well as its settings (`alice` is a different
// speaker), so BOTH are read from it and the constant VOICE_ID is only the
// standard preset's voice from here on.
const { voiceId: DELIVERY_VOICE, settings: voiceSettings } = DELIVERIES[delivery];
// The provenance every descriptor carries. `delivery` is written only when it is
// not the default, so the thousands of existing descriptors and a standard run's
// output stay byte-identical — a diff on this field means the read changed. The
// voiceId is the preset's, so a clip recorded by another speaker says so.
function voiceMeta() {
  return {
    provider: "ElevenLabs", voiceId: DELIVERY_VOICE, model: MODEL_ID,
    ...(delivery !== "standard" ? { delivery } : {}),
  };
}
const grades = args
  .filter((a, i) => /^[1-8]$/.test(a) && !FLAGS_WITH_VALUES.has(args[i - 1]))
  .map(Number);
const gradeList = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];
const dry = args.includes("--dry");
// --emit-scripts <path>: write {clipId: script} for the selected category and
// grades, then stop. Sends nothing and costs nothing; it exists so an auditor
// can compare a recording against the text this file actually narrates rather
// than a second guess at how that text is composed.
const emitScriptsArg = args.indexOf("--emit-scripts");
const emitScripts = emitScriptsArg >= 0 ? args[emitScriptsArg + 1] : null;
const emitted = {};
const force = args.includes("--force") || args.includes("--only-file");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
// --only <substring>[,<substring>...]: narrate just the item ids containing one
// of these, for filling known gaps without walking (and billing for) the whole
// category. Accepts a comma-separated list so a scripted repair of many specific
// clips is one run instead of one run per clip.
const onlyArg = args.indexOf("--only");
const only = onlyArg >= 0 ? args[onlyArg + 1].split(",").map((s) => s.trim()).filter(Boolean) : null;
// --only-file <path>: the same targeting, read from the JSON the audit writes
// ({"3": ["u1-g1-1-family-sentence-1", …]}), keyed by grade. A repair list can
// run to a thousand ids; pasting that onto a command line risks the shell
// truncating it, which would regenerate SOME of the clips and look like success.
// Reading the file also means the audit and the repair cannot disagree about
// which clips were stale. Implies --force: the only reason to name specific
// clips is to redo them, and without it the generator would find each file
// already on disk and reuse it.
const onlyFileArg = args.indexOf("--only-file");
const onlyFile = onlyFileArg >= 0 ? JSON.parse(fs.readFileSync(args[onlyFileArg + 1], "utf8")) : null;
function targetsFor(grade) {
  if (only) return only;
  if (!onlyFile) return null;
  return Array.isArray(onlyFile) ? onlyFile : (onlyFile[String(grade)] || []);
}
// Vocabulary childMeaning clips are opt-in: the descriptors exist in the data but
// no player reads meaningAudio, so narrating them by default just bills for audio
// nothing can play (~50k characters a grade).
const meanings = args.includes("--meanings");

function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadDotEnv();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clean text for narration: strip emoji/boilerplate, collapse whitespace.
// speakableFrames() (lib/ehel-tts.js) is what turns "___" into a pause and a
// "/" into the words a teacher would say — it replaced speakableBlanks() here
// on 2026-09-03, so the word "blank" is no longer narrated anywhere in English.
function narration(value) {
  return speakableLetterRanges(speakableFrames(String(value || "")
    .replace(/🤖|💡|📚|✨|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    // Only a genuinely bracketed aside. The optional parens here used to make this
    // match bare instruction text too, and `[^)]*` then ran to the next ")" -- or
    // to the end of the script when there wasn't one. "Ask your AI tutor to
    // role-play as someone who…" is the task itself, not an aside, so whole
    // passages were being deleted before narration: one Grade 2 reading went from
    // 1729 characters to 15. Every occurrence in the data is bare, so this now
    // strips nothing until a real "(Ask your AI Tutor …)" aside appears.
    .replace(/\(\s*Ask your AI Tutor[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim()));
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Master-dictionary word pronunciations. One clip per entry, the word alone --
// the vocabulary page plays this for "Listen to <word>", separately from the
// practice-sentence clips the `vocabulary` category produces.
function dictionaryFile(grade) {
  return path.join(ENGLISH, `grade-${grade}`, "data", `master-dictionary.grade${grade}.json`);
}

function dictionaryItems(dictionary, grade) {
  const dir = `media/audio/grade-${grade}/dictionary`;
  return (dictionary.entries || []).map((entry) => {
    const id = slug(entry.lemma || entry.displayWord);
    const source = `./${dir}/${id}.mp3`;
    const prev = entry.audio || {};
    return {
      id, ref: entry, title: entry.displayWord,
      // `speechSpelling` is what to SAY when the spelling on screen is not what
      // the voice reads. "toe" comes back as "two" — a fresh render from the
      // correct text reproduces it exactly, so it is the voice, not a stale or
      // corrupted clip, and regenerating cannot help. A respelling that sounds
      // the same can. The learner still sees `displayWord`; only the text sent
      // to ElevenLabs changes, and the entry records why.
      //
      // Use it only where a render has been shown to be wrong. It is a way to
      // make the voice say the printed word, not a way to change the word.
      text: narration(entry.speechSpelling || entry.displayWord),
      minChars: 1, // a single word is the whole point here
      source,
      output: path.join(ENGLISH, dir, `${id}.mp3`),
      done: prev.available === true && prev.normal === source,
      apply() {
        entry.audio = {
          ...voiceMeta(),
          normal: source, slow: source,
          slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
          cueStart: 0, cueEnd: null,
          available: true, status: "Generated",
        };
      },
    };
  });
}

// The sentence-glossary word list the click-popover on a vocabulary word's
// practice sentence reads (linkGlossaryWords/showGlossaryPopover in
// english.js). Keyed by lowercase word string, not by dictionaryEntryId --
// most entries have no master-dictionary counterpart at all, so this narrates
// its own word and definition text rather than reusing dictionary clips.
function glossaryFile(grade) {
  return path.join(ENGLISH, `grade-${grade}`, "data", "sentence-glossary.json");
}

function glossaryItems(glossary, grade) {
  const dir = `media/audio/grade-${grade}/glossary`;
  const items = [];
  for (const [word, entry] of Object.entries(glossary.entries || {})) {
    if (!entry) continue;
    // A PLURAL possessive ends in a bare apostrophe, and slug() drops it: the
    // apostrophe is not [a-z0-9], so it collapses to "-" and the trailing "-" is
    // stripped. "birds'" and "birds" therefore both became birds.mp3, and the two
    // entries — which carry genuinely different definitions ("animals with
    // feathers…" against "belonging to more than one animal…") — overwrote each
    // other's clip on every run. Whichever was generated last won, so one of the
    // pair played the other's definition, and every run re-narrated both because
    // the fingerprint recorded for the name never matched whoever asked next.
    //
    // A SINGULAR possessive is unaffected and must stay unaffected: "boat's" has
    // an s after the apostrophe, so it slugs to boat-s and never collided. 436
    // keys carry a trailing apostrophe; only the 46 ending in a BARE one are
    // touched here, and the other 390 keep their filenames byte-for-byte.
    //
    // The suffix is applied to all 46, not to the 37 that collide TODAY. Nine of
    // them are unique only because their grade happens to have no plain entry
    // yet; keying the filename on what else is in the file would put those nine
    // back into collision the day somebody adds one, silently, with no gate able
    // to see it. A filename is a function of its key.
    //
    // "-possessive" is a slight misnomer and the name is kept only because the
    // files exist under it. What it actually selects for is "the key ends in a
    // bare apostrophe", and four of the 46 are not possessives at all — g7
    // "fashion'", "future'", "well'" and g5 "ku'" are ordinary words that abut a
    // CLOSING SINGLE QUOTE in a sentence.
    //
    // Those four are correct data and MUST NOT be "repaired" by stripping the
    // apostrophe. linkGlossaryWords tokenizes with /[A-Za-z']+/g (english.js), so
    // an apostrophe is part of a word token: in "the phrase 'fast fashion' carries",
    // what a learner can click IS `fashion'`, and the entry under that exact key is
    // what makes the popover fire. "The word 'ha-i-ku' has three syllables"
    // tokenizes to `'ha`, `i`, `ku'`, which is why a `ku'` entry exists and why its
    // definition reads "part of the word 'haiku'".
    //
    // Measured across all eight grades, not assumed: 46 of 46 bare-apostrophe keys
    // occur as a clickable token in their own grade's content — zero unreachable.
    // Stripping them would delete a working popover in every case, and would put
    // `fashion'` back into collision with the live `fashion` entry, which is the
    // defect this change exists to fix.
    //
    // Nor are the two `fashion` entries near-duplicates that could be merged. The
    // definitions differ where it counts, and only the FULL strings show it:
    //   fashion   (83)  "…popular styles of clothing, or the industry that designs
    //                    and sells them"
    //   fashion'  (119) "…popular styles of clothing, especially within the industry
    //                    that produces and sells them QUICKLY AND CHEAPLY"
    // The second is the fast-fashion sense the Grade 7 unit teaches. A 90-character
    // dump of that field cuts three words before the only phrase that distinguishes
    // them, and reads as "nearly the same" — which is how this comment first came to
    // claim they were.
    const id = slug(word) + (/['’]$/.test(String(word).trim()) ? "-possessive" : "");

    const wordSource = `./${dir}/${id}.mp3`;
    const prevWord = entry.wordAudio || {};
    items.push({
      id, ref: entry, title: word,
      // Same trade dictionaryItems() makes: `speechSpelling` changes only what
      // is SENT to ElevenLabs, never the word the popover displays. "toe" is
      // read back as "two" by this voice regardless of source data, so a
      // glossary "toe" needs the same escape hatch the master dictionary has.
      text: narration(entry.speechSpelling || word),
      minChars: 1, // a single word is the whole point here, same as dictionary
      source: wordSource,
      output: path.join(ENGLISH, dir, `${id}.mp3`),
      done: prevWord.available === true && prevWord.source === wordSource,
      apply() {
        entry.wordAudio = {
          source: wordSource, normal: wordSource, slow: wordSource,
          ...voiceMeta(),
          slowPlaybackRate: prevWord.slowPlaybackRate ?? 0.76,
          cueStart: 0, cueEnd: null,
          available: true, status: "Generated",
        };
      },
    });

    const defId = `${id}-meaning`;
    const defSource = `./${dir}/${defId}.mp3`;
    const prevDef = entry.definitionAudio || {};
    items.push({
      id: defId, ref: entry, title: word,
      text: narration(entry.definition),
      // The generic 8-char floor exists to skip near-empty placeholder text,
      // but a glossary definition can legitimately BE this short ("do not",
      // "starts.") -- a complete, narratable answer, not a fragment.
      minChars: 1,
      source: defSource,
      output: path.join(ENGLISH, dir, `${defId}.mp3`),
      done: prevDef.available === true && prevDef.source === defSource,
      apply() {
        entry.definitionAudio = {
          source: defSource, normal: defSource, slow: defSource,
          ...voiceMeta(),
          slowPlaybackRate: prevDef.slowPlaybackRate ?? 0.76,
          cueStart: 0, cueEnd: null,
          available: true, status: "Generated",
        };
      },
    });
  }
  return items;
}

// The course-level final quiz, whose questions live in their own file rather than in
// any unit -- so this needs its own loader and its own loop branch, the way
// dictionary does.
function quizFile(grade) {
  return path.join(ENGLISH, `grade-${grade}`, "data", "course-final-quiz.json");
}

function quizItems(quiz, grade) {
  // NOT the ./media/audio/unit-final/questions/ path the pending placeholders declared.
  // Nothing would ever have served that: resolveMediaUrl() in the app only rewrites
  // sources matching media/audio/grade-<n>/<cat>/ into the deployed media tree, and
  // upload-media-to-bunny.js only walks those same per-grade category folders. A clip
  // written to unit-final/questions/ therefore plays in local dev and 404s in
  // production, and never gets uploaded in the first place. Using the conventional
  // per-grade path makes the existing app, uploader and audio check all handle these
  // with no change to any of them. It also stops eight grades sharing one flat folder.
  const dir = `media/audio/grade-${grade}/quiz`;
  return (quiz.questions || []).map((question) => {
    const id = question.questionId;
    const source = `./${dir}/${id}.mp3`;
    const prev = question.audio || {};
    return {
      id, ref: question, title: `Q${question.sequence}`,
      // The question stem only, never the options. Reading the choices aloud would
      // hand over the answer on exactly the questions a read-aloud exists for: g1 q01
      // asks "Which is the uppercase partner for a?" over options "A | B | D | O", and
      // a voice reading those says the answer in the same breath as the question.
      text: narration(question.question),
      source,
      output: path.join(ENGLISH, dir, `${id}.mp3`),
      done: prev.available === true && prev.source === source,
      apply() {
        question.audio = {
          ...prev, source, normal: source, slow: source,
          ...voiceMeta(),
          slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
          available: true, status: "Generated",
        };
      },
    };
  });
}

// The unit overview page, panel by panel. Each entry is [key, text] where the
// key matches the data-overview-audio attribute renderOverview() emits, and the
// text is EXACTLY what that panel puts on screen -- the banner shows the first
// two sentences of unitOverview (the page header shows the same two), so that
// is what the clip says. A learner following the words must not hear a
// different sentence from the one they are reading.
//
// `learningOutcomeSpeech` is the one sanctioned exception, and the same trade
// `speechSpelling` makes for dictionary words: it changes only what is SENT to
// ElevenLabs, never what is displayed. Six Grade 1 outcomes are sentence frames
// — Say "My name is ___. I am ___ years old." — which are right on the page and
// unreadable aloud, because a voice given a run of underscores says nothing
// where the blank is, or invents something. That is how five Grade 1 clips came
// to say "my name is Taken Seat". The blank refusal below now catches those, so
// without a spoken form the panel simply has no Listen button at all; with one,
// the frame is voiced with an example and the learner still reads the frame.
// Use it only where a blank makes the text unspeakable — not to reword a script.
function overviewPanels(unit) {
  const shown = String((unit.unit || {}).unitOverview || "").split(". ").slice(0, 2).join(". ");
  return [
    ["intro", shown],
    ["outcomes", (unit.outcomes || []).map((o) => o.learningOutcomeSpeech || o.learningOutcome).filter(Boolean).join(" ")],
    ["path", String((unit.unit || {}).learningPath || "").split("\n").map((line) => line.trim()).filter(Boolean).join(" ")],
  ];
}

// The Prerequisite unit (unit -1) has no units/unit-*.json: its overview is
// rendered by renderPrereqOverview() from placement-exam.json. The third panel
// is worded in the page rather than in the data, so those three lines are
// repeated here -- renderPrereqOverview() remains the source of truth, and a
// reword there has to be mirrored here or the clip narrates the old wording.
const PLACEMENT_PATH_TEXT = "Ready: you move straight on to Unit 1. "
  + "Ready with review: you start Unit 1 and warm up with a few review lessons. "
  + "Build strong roots first: we suggest the best course to grow from — a grown-up or teacher can help you choose.";

function placementPanels(exam) {
  return [
    ["intro", String(exam.description || "")],
    ["sections", (exam.sections || []).map((s) => `${s.title}. ${s.description}`).join(" ")],
    ["path", PLACEMENT_PATH_TEXT],
  ];
}

// Shared descriptor builder for both overview holders: the unit JSON root and
// placement-exam.json carry the clips under the same `overviewAudio` key, which
// is what shell/subjects/english.js reads for either page.
function overviewItems(holder, panels, idPrefix, grade) {
  const dir = `media/audio/grade-${grade}/overview`;
  return panels.filter(([, text]) => narration(text)).map(([key, text]) => {
    // See the comment on the vocabulary branch below: a re-record under the
    // same filename keeps the old bytes at the edge for a year. audioRevision
    // works the same way here.
    const revision = holder.overviewAudio?.[key]?.audioRevision || "";
    const id = `${idPrefix}-overview-${key}${revision}`;
    const source = `./${dir}/${id}.mp3`;
    return {
      id, ref: holder, title: key,
      text: narration(text),
      source,
      output: path.join(ENGLISH, dir, `${id}.mp3`),
      done: holder.overviewAudio?.[key]?.available === true && holder.overviewAudio?.[key]?.source === source,
      apply() {
        const prev = holder.overviewAudio?.[key] || {};
        holder.overviewAudio = holder.overviewAudio || {};
        holder.overviewAudio[key] = {
          ...prev, source, normal: source, slow: source,
          ...voiceMeta(),
          slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
          available: true, status: "Generated",
          ...(prev.audioRevision ? { audioRevision: prev.audioRevision } : {}),
        };
      },
    };
  });
}

function placementFile(grade) {
  return path.join(ENGLISH, `grade-${grade}`, "data", "placement-exam.json");
}

// What to narrate for each category.
function itemsForUnit(unit, grade) {
  const gid = String(grade).padStart(2, "0");
  // grammar-practice clips sit in the existing grammar/ tree as {grammarId}-practice.mp3
  // rather than a directory of their own, so no new media category has to be wired
  // into upload-media-to-bunny.js or the CDN layout.
  const dir = `media/audio/grade-${grade}/${category === "grammar-practice" ? "grammar" : category}`;
  if (category === "overview") {
    return overviewItems(unit, overviewPanels(unit), (unit.unit || {}).unitId, grade);
  }
  if (category === "readings") {
    return (unit.readings || []).map((r) => ({
      id: r.readingId, ref: r, title: r.title,
      text: narration(r.passageScript),
      source: `./${dir}/${r.readingId}.mp3`,
      output: path.join(ENGLISH, dir, `${r.readingId}.mp3`),
    }));
  }
  if (category === "grammar") {
    // The title is already on screen above the Listen button, so narrating it
    // restated every card ("The letter A says /a/. Say the short sound /a/…").
    // The reviewed scripts drop that opening; the audio has to match them.
    return (unit.grammar || []).map((g) => ({
      id: g.grammarId, ref: g, title: g.title,
      text: narration(`${g.explanation} ${g.ruleAndExamples || ""}`),
      source: `./${dir}/${g.grammarId}.mp3`,
      output: path.join(ENGLISH, dir, `${g.grammarId}.mp3`),
    }));
  }
  if (category === "vocabulary") {
    const items = [];
    for (const entry of unit.dictionaryLinks || []) {
      const sentences = entry.practiceSentences || [];
      if (!Array.isArray(entry.sentenceAudio)) entry.sentenceAudio = [];
      sentences.forEach((sentence, i) => {
        // `audioRevision` renames the clip, and it is the only way to reach a
        // learner whose EDGE has the old one.
        //
        // Bunny serves media max-age=31536000 and caches by PATH — it ignores
        // query strings, which is why AUDIO_RELEASE can bust a browser and not
        // an edge node. So a clip re-recorded under the same filename keeps the
        // same cache entry, and a POP holding the old bytes serves them for a
        // year. That happened: a learner reported hearing "Ismael is my partner
        // for the reading game" for a sentence whose text had long since become
        // "Nora chose a partner for the counting game" — correct in the repo,
        // correct in storage, stale at their edge, and unpurgeable without an
        // account key this repo does not have.
        //
        // Setting `audioRevision: "b"` on the descriptor makes the filename
        // …-sentence-1b.mp3: a path no POP has ever cached, so every learner
        // gets the new recording immediately. It lives in the DATA rather than
        // in a rename on disk because this function derives the filename — a
        // hand-renamed file would be silently reverted the next time anyone
        // regenerated the grade, which is the sort of fix that looks done and
        // is not.
        //
        // Use it only when a clip is known stale at the edge. Every bump strands
        // the previous file as an orphan and costs a re-record.
        const revision = entry.sentenceAudio[i]?.audioRevision || "";
        const id = `${entry.vocabularyId}-sentence-${i + 1}${revision}`;
        const source = `./${dir}/${id}.mp3`;
        items.push({
          id, ref: entry, title: entry.vocabularyId,
          text: narration(sentence),
          source,
          output: path.join(ENGLISH, dir, `${id}.mp3`),
          done: entry.sentenceAudio[i]?.available === true && entry.sentenceAudio[i]?.source === source,
          apply() {
            const prev = entry.sentenceAudio[i] || {};
            entry.sentenceAudio[i] = {
              source, normal: source, slow: source,
              ...voiceMeta(),
              slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
              available: true, status: "Generated",
              // Carried forward, or the next run would derive the pre-rename
              // filename again and undo the thing this field exists to do.
              ...(prev.audioRevision ? { audioRevision: prev.audioRevision } : {}),
            };
          },
        });
      });
      // One clip narrating the word's definition (entry.childMeaning) -- distinct
      // from the practice-sentence clips above, which only ever model usage.
      if (meanings && entry.childMeaning) {
        // Same `audioRevision` rename as the sentences above, for the same
        // reason: a meaning re-recorded under its old filename reaches nobody
        // whose edge already holds it. It was missing here until the Grade 1
        // Core words were re-read in a new delivery (2026-09-02), the first
        // re-record of a meaning clip with its text unchanged.
        const prevMeaning = entry.meaningAudio || {};
        const id = `${entry.vocabularyId}-meaning${prevMeaning.audioRevision || ""}`;
        const source = `./${dir}/${id}.mp3`;
        items.push({
          id, ref: entry, title: entry.vocabularyId,
          text: narration(entry.childMeaning),
          source,
          output: path.join(ENGLISH, dir, `${id}.mp3`),
          done: prevMeaning.available === true && prevMeaning.source === source,
          apply() {
            entry.meaningAudio = {
              source, normal: source, slow: source,
              ...voiceMeta(),
              slowPlaybackRate: prevMeaning.slowPlaybackRate ?? 0.76,
              available: true, status: "Generated",
              ...(prevMeaning.audioRevision ? { audioRevision: prevMeaning.audioRevision } : {}),
            };
          },
        });
      }
    }
    return items;
  }
  // The practice task read aloud, from practiceAudio -- a second descriptor on the
  // grammar entry, whose `audio` already belongs to the explanation.
  if (category === "grammar-practice") {
    return (unit.grammar || []).filter((g) => g.practice).map((g) => {
      const revision = g.practiceAudio?.audioRevision || "";
      const id = `${g.grammarId}-practice${revision}`;
      const source = `./${dir}/${id}.mp3`;
      const prev = g.practiceAudio || {};
      return {
        id, ref: g, title: g.title,
        text: narration(g.practice),
        source,
        output: path.join(ENGLISH, dir, `${id}.mp3`),
        done: prev.available === true && prev.source === source,
        apply() {
          g.practiceAudio = {
            ...prev, source, normal: source, slow: source,
            ...voiceMeta(),
            slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
            available: true, status: "Generated",
            ...(prev.audioRevision ? { audioRevision: prev.audioRevision } : {}),
          };
        },
      };
    });
  }
  // The writing task and the activity instructions read aloud. Both keep the full
  // descriptor shape rather than the four-field one the generic path writes, so the
  // pending placeholders' slow/cue/status fields survive being filled in.
  if (category === "writing" || category === "activities") {
    const list = category === "writing" ? (unit.writing || []) : (unit.activities || []);
    const idKey = category === "writing" ? "writingId" : "activityId";
    const textKey = category === "writing" ? "promptAndInstructions" : "instructionsAndItems";
    return list.map((entry) => {
      const revision = entry.audio?.audioRevision || "";
      const id = `${entry[idKey]}${revision}`;
      const source = `./${dir}/${id}.mp3`;
      const prev = entry.audio || {};
      return {
        id, ref: entry, title: entry.title,
        text: narration(entry[textKey]),
        source,
        output: path.join(ENGLISH, dir, `${id}.mp3`),
        done: prev.available === true && prev.source === source,
        apply() {
          entry.audio = {
            ...prev, source, normal: source, slow: source,
            ...voiceMeta(),
            slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
            available: true, status: "Generated",
            ...(prev.audioRevision ? { audioRevision: prev.audioRevision } : {}),
          };
        },
      };
    });
  }
  // speaking
  return (unit.speaking || []).map((s) => ({
    id: s.speakingId, ref: s, title: s.title,
    text: narration(s.instructionsAndModelLines),
    source: `./${dir}/${s.speakingId}.mp3`,
    output: path.join(ENGLISH, dir, `${s.speakingId}.mp3`),
  }));
}

// The request timeout this file used to own is now in the shared helper, and it
// is there BECAUSE of what happened here: fetch has no default timeout, so a
// request that never answered never settled, the retry loop below never fired,
// and the process sat there indefinitely. Two runs stalled mid-clip for over 40
// minutes and looked identical to slow progress, because a hung request produces
// no output at all. English was the only generator that had learned this; the
// other five inherited it when tts() was collapsed into one definition.

// Every leaf this run changed, as [path, value] pairs, by comparing the copy we
// read against the copy we mutated. Anything the run did not touch is absent,
// so a concurrent edit elsewhere in the file survives the merge.
function changedLeaves(pristine, mutated, trail = [], out = []) {
  if (mutated === pristine) return out;
  const plain = (v) => v && typeof v === "object";
  if (!plain(pristine) || !plain(mutated) || Array.isArray(pristine) !== Array.isArray(mutated)) {
    if (JSON.stringify(pristine) !== JSON.stringify(mutated)) out.push([trail, mutated]);
    return out;
  }
  if (Array.isArray(mutated)) {
    // Treat a resized array as one leaf: index-wise merging would interleave badly.
    if (mutated.length !== pristine.length) {
      if (JSON.stringify(pristine) !== JSON.stringify(mutated)) out.push([trail, mutated]);
      return out;
    }
    mutated.forEach((v, i) => changedLeaves(pristine[i], v, [...trail, i], out));
    return out;
  }
  for (const k of Object.keys(mutated)) changedLeaves(pristine[k], mutated[k], [...trail, k], out);
  return out;
}

function setPath(target, trail, value) {
  let node = target;
  for (let i = 0; i < trail.length - 1; i += 1) {
    const key = trail[i];
    if (!node || typeof node !== "object") return false;
    if (node[key] === undefined || node[key] === null) node[key] = typeof trail[i + 1] === "number" ? [] : {};
    node = node[key];
  }
  if (!node || typeof node !== "object") return false;
  node[trail[trail.length - 1]] = value;
  return true;
}

// --- sandbox -----------------------------------------------------------------
// `--sandbox <dir>` sends every WRITE into <dir> and leaves every read where it
// was. The run then behaves exactly as it would for real — same items, same
// reuse and skip decisions, same retries — without touching a clip, a
// descriptor or the narration index.
//
// It exists because one behaviour could not be tested honestly without it: the
// flaky case, where a request fails twice and succeeds on the third attempt.
// Proving that needs a SUCCESS, and a success here writes an mp3, rewrites a
// unit descriptor and records a fingerprint. Against the real tree that is a
// test which damages the thing it is testing, so the path went unverified and
// was described as such rather than claimed.
//
// Paths are mapped by their position under the repo root, so the sandbox comes
// out as a mirror of the tree and it is obvious what a run would have written.
const sandboxArg = args.indexOf("--sandbox");
const SANDBOX = sandboxArg >= 0 && args[sandboxArg + 1] ? path.resolve(args[sandboxArg + 1]) : null;
function writePath(realPath) {
  if (!SANDBOX) return realPath;
  const relative = path.relative(ROOT, realPath);
  // A path outside the repo would escape the sandbox through "..", so it is
  // flattened into the sandbox rather than followed.
  const inside = relative.startsWith("..") ? path.basename(realPath) : relative;
  const mapped = path.join(SANDBOX, inside);
  fs.mkdirSync(path.dirname(mapped), { recursive: true });
  return mapped;
}

// Re-read the file and lay this run's changes over whatever is on disk now,
// instead of overwriting it with a snapshot taken before the narration started.
function writeMerged(filePath, pristine, mutated) {
  const changes = changedLeaves(pristine, mutated);
  if (!changes.length) return { written: false, changes: 0, rebased: false };
  const onDisk = fs.readFileSync(filePath, "utf8");
  const rebased = onDisk !== `${JSON.stringify(pristine, null, 2)}\n`;
  const target = JSON.parse(onDisk);
  let applied = 0;
  for (const [trail, value] of changes) if (setPath(target, trail, value)) applied += 1;
  fs.writeFileSync(writePath(filePath), `${JSON.stringify(target, null, 2)}\n`);
  return { written: true, changes: applied, rebased };
}

// --- what each clip was actually made from ------------------------------------
// English clips are named by id ({vocabularyId}-sentence-3.mp3), not by a hash
// of their text the way Science, Global Perspectives and Computing name theirs.
// That makes the name stable, and it makes text drift SILENT: edit a sentence
// and this generator finds the old file already on disk, reuses it, and leaves
// the descriptor saying available:true. An audit of Grade 1 found every sampled
// vocabulary clip speaking the pre-rewrite sentence — the page said "Sami has a
// red apple", the voice said "This is an apple".
//
// So the text each file was made from is recorded here. A clip whose text has
// moved since is re-narrated instead of reused; a clip with no record is reused
// and counted, because "we do not know" must not silently re-bill every clip in
// the course. tools/audit-ehel-english-sentence-audio.py is what establishes the
// truth for those, by listening to them.
const NARRATION_INDEX = path.join(ENGLISH, "media", "audio", ".narration-index.json");

function loadNarrationIndex() {
  try { return JSON.parse(fs.readFileSync(NARRATION_INDEX, "utf8")); }
  catch { return {}; }
}

// One file, and any English audio run rewrites it. Writing back the whole
// in-memory copy means a run that started an hour ago overwrites everything
// another session recorded in the meantime — the fingerprints survive, the
// other session's do not, and nothing reports the loss. So only the entries
// THIS run made are laid over whatever is on disk at the moment of writing,
// the same rebasing writeMerged() does for the unit descriptors.
//
// Written through a temp file and renamed, because a reader that opens this
// mid-write gets a truncated JSON and silently falls back to "no records at
// all" — which would make every clip in the course look unverified.
function saveNarrationIndex(mine) {
  if (!mine.size) return 0;
  const onDisk = loadNarrationIndex();
  for (const [key, fingerprint] of mine) onDisk[key] = fingerprint;
  // Read from the real index above, write to wherever writePath says: a
  // sandboxed run makes the same reuse decisions as a real one.
  const target = writePath(NARRATION_INDEX);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(onDisk, null, 2)}\n`);
  fs.renameSync(temp, target);
  return Object.keys(onDisk).length;
}

function textFingerprint(text) {
  return require("crypto").createHash("sha1").update(String(text)).digest("hex").slice(0, 16);
}

function indexKey(output) {
  return path.relative(ENGLISH, output).replace(/\\/g, "/");
}

async function main() {
  let charsSent = 0, generated = 0, reused = 0, skipped = 0, charsTotal = 0, count = 0;
  let restaled = 0, unverified = 0;
  const failures = [];
  const blanked = [];
  // Set by a FatalTtsError: the credential or the account, so every remaining
  // clip would fail the same way. Checked between items, so the run stops
  // instead of walking the rest of the queue to prove it — and stops with its
  // narration index and its edited descriptors written, not thrown away.
  let fatal = null;
  // The same stop for a failure the per-clip classification did not catch. A
  // 500 or a 422 storm is not fatal to any single clip, so without this the run
  // works through all 1,830 of them at three attempts each — measured at over
  // ten minutes before it was abandoned, with nothing generated and no way to
  // tell it from slow progress. It cannot fire on a run that is working: a
  // success resets the counter, and it also requires that nothing has been
  // generated at all.
  const GIVE_UP_AFTER = 5;
  let consecutiveFailures = 0;
  const narrationIndex = loadNarrationIndex();
  // What THIS run recorded, kept apart from the snapshot it read at startup.
  const myFingerprints = new Map();
  // Flushed periodically as well as at the end: a run of 1,830 clips that dies
  // on the last one used to lose every fingerprint it had earned, and those
  // clips then look unverified forever.
  const FLUSH_EVERY = 100;
  // filePath -> { pristine, mutated }. A run holds these for as long as it takes
  // to narrate a grade, so the file on disk can move underneath us; keeping the
  // as-read copy lets writeMerged() put back only what this run actually changed.
  const dirtyFiles = new Map();

  // Narrate one item; returns true when its descriptor needs writing back.
  async function processItem(item, grade) {
    // Once the credential is the problem, every remaining clip fails the same
    // way. Returning here rather than breaking out of four separate loops keeps
    // the run walking to its normal end, which is what writes the narration
    // index and the descriptors this run already earned.
    if (fatal) return false;
    const targets = targetsFor(grade);
    if (targets && !targets.some((needle) => String(item.id).includes(needle))) return false;
    if (!item.text || item.text.length < (item.minChars ?? 8)) { skipped += 1; return false; }
    // A fill-in-the-blank frame is not a script. Handed "This is a ___.",
    // ElevenLabs improvises: a Grade 1 reading came back saying "This is a
    // dirisan dog… I am making bomb bomb", and a Grade 1 pattern page came back
    // in invented syllables. 500 clips across the course were generated from
    // scripts like these, every one of them unusable and every one paid for.
    //
    // Refused rather than narrated, because at the time regenerating could not
    // fix it — the blank was in the source text, and these items needed a spoken
    // form of the frame written for the ear before they could carry a Listen
    // button at all.
    //
    // That spoken form arrived twelve days later and this check has been
    // UNREACHABLE ever since: narration() runs speakableFrames() (lib/ehel-tts.js;
    // speakableBlanks() until 2026-09-03), which rewrites _{2,} in the narrated
    // text alone — to a pause behind "Fill in the blank:" now, to the word
    // "blank" before — so by the time item.text reaches this line it carries no
    // blank to match. It stays as a backstop against that transform being
    // removed, not as live policy.
    //
    // The cost of nobody noticing: 297 descriptors sat at available:false with a
    // "needs a spoken form" status for thirteen days after the need had been met,
    // and a learner on a Grade 1 pattern slide saw "ElevenLabs audio pending"
    // and no button. Re-recorded 2026-08-31. If this line ever fires again, ask
    // whether speakableBlanks still runs upstream before writing anything off.
    // --emit-scripts: hand the audit tools the exact text this generator
    // composes, and send nothing. The alternative is for each auditor to rebuild
    // the script from the data, and this file composes some of them — overview
    // panels are the first two sentences of unitOverview, the joined outcomes,
    // the flattened learning path, and one panel whose wording lives only here.
    // A second copy of that would drift, which is how the grammar audit ended up
    // comparing against text no recording says.
    //
    // Emitted BEFORE the blank refusal below, deliberately. Refusing first hides
    // exactly the items worth looking at: five Grade 1 overview clips were
    // recorded from blank frames before that rule existed, and are still live and
    // still saying "my name is Taken Seat". Skipping them here would have left
    // the audit reporting 31 clips clean and never mentioning the other five.
    if (emitScripts) { emitted[item.id] = item.text; return false; }
    if (/_{2,}/.test(item.text)) { blanked.push(item.id); return false; }
    charsTotal += item.text.length;
    if (count >= limit) return false;

    const key = indexKey(item.output);
    const fingerprint = textFingerprint(item.text);
    const onFile = fs.existsSync(item.output) && fs.statSync(item.output).size > 1000;
    // A clip we have a record for, whose text has since changed, is not a clip:
    // it is a recording of a sentence that is no longer on the page.
    const stale = onFile && narrationIndex[key] && narrationIndex[key] !== fingerprint;
    if (stale) restaled += 1;
    const exists = onFile && !stale;
    if (dry) { count += 1; return false; }
    if (exists && !force) {
      reused += 1;
      // Counted only on the path that actually keeps the old file. Counting it
      // before the decision made a run that re-narrated all 1,830 clips still
      // report all 1,830 as unverified, which reads as "nothing was fixed".
      if (!narrationIndex[key]) unverified += 1;
      if (item.apply) {
        if (!item.done) { item.apply(); return true; }
      } else if (item.ref.audio?.source !== item.source || item.ref.audio?.available !== true) {
        // Repair on the source path, not just on a falsy `available`. A descriptor
        // can claim available:true while pointing at a filename that no longer
        // exists (the old date-stamped names), and keying off `available` alone
        // left those dangling: the clip was counted as "reused" because the file
        // was on disk, yet the descriptor still named the missing one.
        item.ref.audio = { source: item.source, provider: "ElevenLabs", voiceId: DELIVERY_VOICE, ...(delivery !== "standard" ? { delivery } : {}), available: true };
        return true;
      }
      return false;
    }
    // writePath makes its own directory, so the sandboxed run does not need
    // the real one to exist.
    const clipOutput = writePath(item.output);
    fs.mkdirSync(path.dirname(clipOutput), { recursive: true });
    let changed = false;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        process.stdout.write(`g${grade} ${category} ${item.id} (${item.text.length} chars)… `);
        const buf = await tts(item.text, { voiceId: DELIVERY_VOICE, voiceSettings });
        fs.writeFileSync(clipOutput, buf);
        charsSent += item.text.length; generated += 1; count += 1; ok = true;
        narrationIndex[key] = fingerprint;
        myFingerprints.set(key, fingerprint);
        if (myFingerprints.size % FLUSH_EVERY === 0) saveNarrationIndex(myFingerprints);
        if (item.apply) item.apply();
        else item.ref.audio = { source: item.source, provider: "ElevenLabs", voiceId: DELIVERY_VOICE, ...(delivery !== "standard" ? { delivery } : {}), available: true };
        changed = true;
        console.log(`ok ${(buf.length / 1024).toFixed(0)} KB`);
      } catch (e) {
        // A failure is not neutral: the OLD file stays on disk with no record of
        // what it says, so a later run reuses it and the clip is stale forever.
        // Collected here and printed as a ready-to-paste repair at the end.
        //
        // The three kinds the shared helper distinguishes. Retrying a stale key
        // or a rejected text only spends wall-clock proving the same answer, and
        // this run has 383 clips to walk before it would notice.
        if (e instanceof FatalTtsError) {
          console.log(`fatal`);
          fatal = e.message;
          failures.push(item.id);
          break;
        }
        if (e instanceof PermanentTtsError) {
          console.log(`skipped: ${e.message.slice(0, 100)}`);
          failures.push(item.id);
          break;
        }
        console.log(`retry ${attempt}: ${e.message.slice(0, 80)}`);
        if (attempt < 3) await sleep(1500 * attempt);
        if (attempt === 3) { console.log(`  FAILED ${item.id}`); failures.push(item.id); }
      }
    }
    if (ok) consecutiveFailures = 0;
    else if (!fatal) {
      consecutiveFailures += 1;
      if (consecutiveFailures >= GIVE_UP_AFTER && generated === 0) {
        fatal = `${GIVE_UP_AFTER} clips failed in a row and none has succeeded.`;
      }
    }
    await sleep(350); // gentle rate limit
    return changed;
  }

  for (const grade of gradeList) {
    if (category === "dictionary") {
      const filePath = dictionaryFile(grade);
      if (!fs.existsSync(filePath)) continue;
      const dictionaryText = fs.readFileSync(filePath, "utf8");
      const dictionary = JSON.parse(dictionaryText);
      let changed = false;
      for (const item of dictionaryItems(dictionary, grade)) {
        if (await processItem(item, grade)) changed = true;
      }
      if (changed) dirtyFiles.set(filePath, { pristine: JSON.parse(dictionaryText), mutated: dictionary });
      continue;
    }

    if (category === "glossary") {
      const filePath = glossaryFile(grade);
      if (!fs.existsSync(filePath)) continue;
      const glossaryText = fs.readFileSync(filePath, "utf8");
      const glossary = JSON.parse(glossaryText);
      let changed = false;
      for (const item of glossaryItems(glossary, grade)) {
        if (await processItem(item, grade)) changed = true;
      }
      if (changed) dirtyFiles.set(filePath, { pristine: JSON.parse(glossaryText), mutated: glossary });
      continue;
    }

    if (category === "final-quiz") {
      const filePath = quizFile(grade);
      if (!fs.existsSync(filePath)) continue;
      const quizText = fs.readFileSync(filePath, "utf8");
      const quiz = JSON.parse(quizText);
      let changed = false;
      for (const item of quizItems(quiz, grade)) {
        if (await processItem(item, grade)) changed = true;
      }
      if (changed) dirtyFiles.set(filePath, { pristine: JSON.parse(quizText), mutated: quiz });
      continue;
    }

    // The Prerequisite unit's overview lives outside units/, so it needs its own
    // read — but it is part of the same run rather than a category of its own:
    // "the overview page of every unit" includes unit -1.
    if (category === "overview") {
      const filePath = placementFile(grade);
      if (fs.existsSync(filePath)) {
        const examText = fs.readFileSync(filePath, "utf8");
        const exam = JSON.parse(examText);
        const idPrefix = exam.assessmentId || `eng-g${String(grade).padStart(2, "0")}-placement`;
        let changed = false;
        for (const item of overviewItems(exam, placementPanels(exam), idPrefix, grade)) {
          if (await processItem(item, grade)) changed = true;
        }
        if (changed) dirtyFiles.set(filePath, { pristine: JSON.parse(examText), mutated: exam });
      }
    }

    const unitsDir = path.join(ENGLISH, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((f) => f.endsWith(".json")).sort()) {
      const filePath = path.join(unitsDir, file);
      const unitText = fs.readFileSync(filePath, "utf8");
      const unit = JSON.parse(unitText);
      let changed = false;
      for (const item of itemsForUnit(unit, grade)) {
        if (await processItem(item, grade)) changed = true;
      }
      if (changed) dirtyFiles.set(filePath, { pristine: JSON.parse(unitText), mutated: unit });
    }
  }

  let rebasedFiles = 0;
  for (const [filePath, { pristine, mutated }] of dirtyFiles) {
    const { rebased, changes } = writeMerged(filePath, pristine, mutated);
    if (!rebased) continue;
    rebasedFiles += 1;
    console.log(`merged ${changes} descriptor change(s) into ${path.basename(filePath)} (changed on disk during this run)`);
  }

  if (emitScripts) {
    fs.writeFileSync(emitScripts, JSON.stringify(emitted, null, 1));
    console.log(`\nwrote ${Object.keys(emitted).length} script(s) to ${emitScripts} — nothing sent`);
    return;
  }

  let indexTotal = 0;
  if (!dry && generated) indexTotal = saveNarrationIndex(myFingerprints);

  console.log("\n──────── summary ────────");
  console.log(`category: ${category} | grades: ${gradeList.join(",")}${dry ? " (DRY RUN)" : ""}`);
  if (onlyFile) {
    const listed = gradeList.map((g) => `g${g}:${(targetsFor(g) || []).length}`).join(" ");
    console.log(`targeting the repair list in ${args[onlyFileArg + 1]} (${listed}) — --force implied`);
  }
  if (dry) {
    console.log(`items to narrate: ${count} | total characters: ${charsTotal.toLocaleString()}`);
    console.log(`(ElevenLabs bills per character; ~${charsTotal.toLocaleString()} credits for a full run)`);
  } else {
    console.log(`generated: ${generated} | reused: ${reused} | skipped(too short): ${skipped}`);
    console.log(`characters sent this run: ${charsSent.toLocaleString()}`);
    console.log(`data files updated: ${dirtyFiles.size}${rebasedFiles ? ` (${rebasedFiles} merged onto concurrent edits)` : ""}`);
  }
  if (fatal) {
    console.error(`\nSTOPPED: ${fatal}`);
    console.error("   The rest of the run was not attempted. Fix the cause and re-run — anything already written is reused, not paid for twice.");
    process.exitCode = 1;
  }
  if (failures.length) {
    console.log(`\nFAILED (still holding their previous audio): ${failures.length}`);
    console.log(`  node tools/generate-ehel-english-audio.js ${category} ${gradeList.join(" ")} --force --only ${failures.join(",")}`);
  }
  if (indexTotal) console.log(`narration index: ${myFingerprints.size} recorded this run, ${indexTotal} in the file`);
  if (restaled) console.log(`re-narrated because the text had changed since: ${restaled}`);
  if (blanked.length) {
    console.log(`\nREFUSED — the script is a fill-in-the-blank frame, not something that can be read aloud: ${blanked.length}`);
    console.log(`  ${blanked.slice(0, 6).join(", ")}${blanked.length > 6 ? " …" : ""}`);
    console.log("  These need a spoken form of the frame before they can carry a Listen button.");
  }
  if (unverified) {
    console.log(`clips with no record of what they were made from: ${unverified}`);
    console.log("  (reused this run — listen to them with tools/audit-ehel-english-sentence-audio.py)");
  }
}

// Only narrate when run as a CLI, so the merge helpers below can be required by
// tests/tools/generate-ehel-english-audio.merge.test.js without billing anyone.
if (require.main === module) main();

module.exports = { changedLeaves, setPath, writeMerged };
