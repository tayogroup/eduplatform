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
//   category = readings | grammar | speaking | vocabulary | dictionary
//   vocabulary = one clip per dictionaryLinks practice sentence (add --meanings
//   to also narrate each childMeaning -- off by default, see below); rewrites each
//   sentenceAudio descriptor to the resolver-compatible media/audio/grade-N/
//   vocabulary/ path (the template's original ./unit-K/media/... paths matched
//   neither the disk layout nor resolveMediaUrl and never had files).
//   dictionary = one pronunciation clip per master-dictionary.gradeN.json entry
//   (the word alone), which is what the vocabulary page's Listen button plays.
//   Also rewrites each entry's audio.normal to the resolver-compatible
//   media/audio/grade-N/dictionary/ path; the authored ./media/dictionary/ and
//   ../../vocabulary/audio/grade2-bundles/ paths resolved to nothing on disk.
//   e.g. node tools/generate-ehel-english-audio.js readings 1
//        node tools/generate-ehel-english-audio.js readings 1 2 3 --limit 5
//        node tools/generate-ehel-english-audio.js readings --dry   (estimate only)
//        node tools/generate-ehel-english-audio.js vocabulary 1 --only g1-u9-g1-5-library

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

// --- args ---
const args = process.argv.slice(2);
const category = args.find((a) => /^(readings|grammar|speaking|vocabulary|dictionary|writing|activities)$/.test(a)) || "readings";
const grades = args.filter((a) => /^[1-8]$/.test(a)).map(Number);
const gradeList = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];
const dry = args.includes("--dry");
const force = args.includes("--force");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
// --only <substring>[,<substring>...]: narrate just the item ids containing one
// of these, for filling known gaps without walking (and billing for) the whole
// category. Accepts a comma-separated list so a scripted repair of many specific
// clips is one run instead of one run per clip.
const onlyArg = args.indexOf("--only");
const only = onlyArg >= 0 ? args[onlyArg + 1].split(",").map((s) => s.trim()).filter(Boolean) : null;
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
function narration(value) {
  return String(value || "")
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
    .trim();
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
      text: narration(entry.displayWord),
      minChars: 1, // a single word is the whole point here
      source,
      output: path.join(ENGLISH, dir, `${id}.mp3`),
      done: prev.available === true && prev.normal === source,
      apply() {
        entry.audio = {
          provider: "ElevenLabs", voiceId: VOICE_ID, model: MODEL_ID,
          normal: source, slow: source,
          slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
          cueStart: 0, cueEnd: null,
          available: true, status: "Generated",
        };
      },
    };
  });
}

// What to narrate for each category.
function itemsForUnit(unit, grade) {
  const gid = String(grade).padStart(2, "0");
  const dir = `media/audio/grade-${grade}/${category}`;
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
        const id = `${entry.vocabularyId}-sentence-${i + 1}`;
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
              provider: "ElevenLabs", voiceId: VOICE_ID, model: MODEL_ID,
              slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
              available: true, status: "Generated",
            };
          },
        });
      });
      // One clip narrating the word's definition (entry.childMeaning) -- distinct
      // from the practice-sentence clips above, which only ever model usage.
      if (meanings && entry.childMeaning) {
        const id = `${entry.vocabularyId}-meaning`;
        const source = `./${dir}/${id}.mp3`;
        const prevMeaning = entry.meaningAudio || {};
        items.push({
          id, ref: entry, title: entry.vocabularyId,
          text: narration(entry.childMeaning),
          source,
          output: path.join(ENGLISH, dir, `${id}.mp3`),
          done: prevMeaning.available === true && prevMeaning.source === source,
          apply() {
            entry.meaningAudio = {
              source, normal: source, slow: source,
              provider: "ElevenLabs", voiceId: VOICE_ID, model: MODEL_ID,
              slowPlaybackRate: prevMeaning.slowPlaybackRate ?? 0.76,
              available: true, status: "Generated",
            };
          },
        });
      }
    }
    return items;
  }
  // The writing task and the activity instructions read aloud. Both keep the full
  // descriptor shape rather than the four-field one the generic path writes, so the
  // pending placeholders' slow/cue/status fields survive being filled in.
  if (category === "writing" || category === "activities") {
    const list = category === "writing" ? (unit.writing || []) : (unit.activities || []);
    const idKey = category === "writing" ? "writingId" : "activityId";
    const textKey = category === "writing" ? "promptAndInstructions" : "instructionsAndItems";
    return list.map((entry) => {
      const id = entry[idKey];
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
            provider: "ElevenLabs", voiceId: VOICE_ID, model: MODEL_ID,
            slowPlaybackRate: prev.slowPlaybackRate ?? 0.76,
            available: true, status: "Generated",
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

// A request that never answers used to hang the whole run: fetch has no default
// timeout, so the promise never settled, the retry loop below never fired, and the
// process sat there indefinitely. Two runs stalled mid-clip for over 40 minutes and
// looked identical to slow progress, because a hung request produces no output at
// all. Abort instead, so it surfaces as a normal retryable failure.
const TTS_TIMEOUT_MS = 120000;

async function tts(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (check .env).");
  const r = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: { stability: 0.62, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true } }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  // The same signal also aborts the response stream, so a stalled download rejects
  // here rather than hanging — no separate guard needed.
  return Buffer.from(await r.arrayBuffer());
}

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
  fs.writeFileSync(filePath, `${JSON.stringify(target, null, 2)}\n`);
  return { written: true, changes: applied, rebased };
}

async function main() {
  let charsSent = 0, generated = 0, reused = 0, skipped = 0, charsTotal = 0, count = 0;
  // filePath -> { pristine, mutated }. A run holds these for as long as it takes
  // to narrate a grade, so the file on disk can move underneath us; keeping the
  // as-read copy lets writeMerged() put back only what this run actually changed.
  const dirtyFiles = new Map();

  // Narrate one item; returns true when its descriptor needs writing back.
  async function processItem(item, grade) {
    if (only && !only.some((needle) => String(item.id).includes(needle))) return false;
    if (!item.text || item.text.length < (item.minChars ?? 8)) { skipped += 1; return false; }
    charsTotal += item.text.length;
    if (count >= limit) return false;

    const exists = fs.existsSync(item.output) && fs.statSync(item.output).size > 1000;
    if (dry) { count += 1; return false; }
    if (exists && !force) {
      reused += 1;
      if (item.apply) {
        if (!item.done) { item.apply(); return true; }
      } else if (item.ref.audio?.source !== item.source || item.ref.audio?.available !== true) {
        // Repair on the source path, not just on a falsy `available`. A descriptor
        // can claim available:true while pointing at a filename that no longer
        // exists (the old date-stamped names), and keying off `available` alone
        // left those dangling: the clip was counted as "reused" because the file
        // was on disk, yet the descriptor still named the missing one.
        item.ref.audio = { source: item.source, provider: "ElevenLabs", voiceId: VOICE_ID, available: true };
        return true;
      }
      return false;
    }
    fs.mkdirSync(path.dirname(item.output), { recursive: true });
    let changed = false;
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        process.stdout.write(`g${grade} ${category} ${item.id} (${item.text.length} chars)… `);
        const buf = await tts(item.text);
        fs.writeFileSync(item.output, buf);
        charsSent += item.text.length; generated += 1; count += 1; ok = true;
        if (item.apply) item.apply();
        else item.ref.audio = { source: item.source, provider: "ElevenLabs", voiceId: VOICE_ID, available: true };
        changed = true;
        console.log(`ok ${(buf.length / 1024).toFixed(0)} KB`);
      } catch (e) {
        console.log(`retry ${attempt}: ${e.message.slice(0, 80)}`);
        await sleep(1500 * attempt);
        if (attempt === 3) { console.log(`  FAILED ${item.id}`); }
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

  console.log("\n──────── summary ────────");
  console.log(`category: ${category} | grades: ${gradeList.join(",")}${dry ? " (DRY RUN)" : ""}`);
  if (dry) {
    console.log(`items to narrate: ${count} | total characters: ${charsTotal.toLocaleString()}`);
    console.log(`(ElevenLabs bills per character; ~${charsTotal.toLocaleString()} credits for a full run)`);
  } else {
    console.log(`generated: ${generated} | reused: ${reused} | skipped(too short): ${skipped}`);
    console.log(`characters sent this run: ${charsSent.toLocaleString()}`);
    console.log(`data files updated: ${dirtyFiles.size}${rebasedFiles ? ` (${rebasedFiles} merged onto concurrent edits)` : ""}`);
  }
}

// Only narrate when run as a CLI, so the merge helpers below can be required by
// tests/tools/generate-ehel-english-audio.merge.test.js without billing anyone.
if (require.main === module) main();

module.exports = { changedLeaves, setPath, writeMerged };
