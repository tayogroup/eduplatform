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

const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");
const { speakableFrames, speakableWords } = require("./ehel-tts");

const CATEGORIES = ["lecture", "readings", "grammar", "words", "wordSentences", "speaking"];

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

function clipsForUnit(unit, categories = CATEGORIES) {
  const out = [];
  for (const category of categories) {
    const speech = speechForUnit(unit, category);
    for (const [index, raw] of textsForUnit(unit, category).entries()) {
      const text = clean(raw);
      // `source` is what is recorded: the spoken form where one is authored,
      // otherwise the displayed text itself.
      const source = speech[index] ? clean(speech[index]) : text;
      // Below the floor the request is not worth making; the UI speaks these
      // through the runtime voice instead.
      if (!text || text.length < MIN_CHARS) continue;
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
      out.push({ category, text, source, spoken: speakableWords(speakableFrames(source)), hash: cyrb53(text) });
    }
  }
  return out;
}

// Every hash one level needs. The uploader fans the flat local cache out into
// the per-stage deploy tree with this, so a text shared by two levels is
// uploaded under both.
function hashesForLevel(courseRoot, level, categories = CATEGORIES) {
  const unitDir = path.join(courseRoot, `level-${level}`, "data", "units");
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
  return out;
}

// hash -> the levels that claim it. Named for the shape the uploader expects
// from every subject; this course's stages are CEFR levels, not school grades,
// but they occupy the same gNN slot in the deploy path.
function hashGradeMap(courseRoot, categories = CATEGORIES) {
  const map = new Map();
  for (const entry of fs.readdirSync(courseRoot)) {
    const match = entry.match(/^level-(\d+)$/);
    if (!match) continue;
    const level = Number(match[1]);
    for (const key of hashesForLevel(courseRoot, level, categories)) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(level);
    }
  }
  return map;
}

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, textsForUnit, speechForUnit, clipsForUnit, hashesForLevel, hashGradeMap };
