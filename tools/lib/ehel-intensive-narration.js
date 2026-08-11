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
      return (unit.readings || []).map((r) => r.passageScriptSpeech || r.passageScript);
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
      return (unit.speaking || []).map((s) => s.instructionsAndModelLinesSpeech || s.instructionsAndModelLines);
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
function clipsForUnit(unit, categories = CATEGORIES) {
  const out = [];
  for (const category of categories) {
    for (const raw of textsForUnit(unit, category)) {
      const text = clean(raw);
      // Below the floor the request is not worth making; the UI speaks these
      // through the runtime voice instead.
      if (!text || text.length < MIN_CHARS) continue;
      out.push({ category, text, hash: cyrb53(text) });
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

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, textsForUnit, clipsForUnit, hashesForLevel, hashGradeMap };
