#!/usr/bin/env node
// Add master-dictionary entries for Core words that have none, for any grade.
//
// The word-alone clip a learner hears when tapping a vocabulary word comes from
// the `dictionary` category of generate-ehel-english-audio.js, which iterates
// master-dictionary.gradeN.json. A Core word missing from it has five sentence
// clips and no way to say ITSELF — and on a phonics or spelling card that is the
// clip that matters most. english.js draws the "Listen at 0.90x" control only
// where `master.audio.available` is true, so such a word shows no control at all.
//
// This supersedes add-grade1-master-entries.mjs, which did the same job for one
// grade. Two tools doing this would drift, and the drift would be invisible:
// each grade's dictionary would be built by different rules with nothing
// reporting the difference.
//
//   node tools/add-english-master-entries.mjs --grade 2           # report
//   node tools/add-english-master-entries.mjs --grade 2 --write   # apply
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
let GRADE = null, WRITE = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  if (argv[i] === "--write") { WRITE = true; continue; }
  console.error(`Unrecognised argument: ${argv[i]}`);
  console.error("Usage: add-english-master-entries.mjs --grade N [--write]");
  process.exit(2);
}
if (!Number.isInteger(GRADE) || GRADE < 1 || GRADE > 8) {
  console.error("--grade N is required (1-8)");
  process.exit(2);
}
const DATA = path.join(ROOT, `grade-${GRADE}`, "data");

// The parts of speech already in use, with the child-facing definitions the
// existing entries carry. Nothing new is invented here. Note `position` is a
// part of speech this course uses and a grammar book does not — it is what the
// existing entries give `under`, `on`, `up`, `down`, `here`, `there`, `near`.
const POS = {
  noun: "A naming word",
  verb: "Shows an action or a state.",
  adjective: "Describes a noun.",
  pronoun: "A small word that stands in for a naming word.",
  article: "A small word that goes before a naming word.",
  number: "Names a quantity or position in an order.",
  position: "Shows where one thing is compared with another.",
  preposition: "Shows where one thing is compared with another.",
  conjunction: "Joins two words, phrases or ideas together.",
  interjection: "A word that shows strong feeling, like surprise or joy.",
  adverb: "Describes how, when or where an action happens.",
  phrase: "A small group of words that works together.",
};

// Part of speech per grade. Closed-class words follow the precedent the grade's
// EXISTING entries already set rather than textbook grammar, so one file does
// not describe the same kind of word two ways.
const CLASS_BY_GRADE = {
  1: {
    article: "a an the",
    pronoun: "i you he she it we they me him us them who what which my your his her our their",
    adjective: "this that these those some all little big good bad happy sad hot cold fast slow clean dirty soft "
      + "hard loud quiet full empty wet dry kind funny beautiful small tall old young new long short thin thick "
      + "rich much quick tired excited worried calm angry afraid hungry thirsty grey black white red blue green "
      + "yellow orange pink purple brown fair",
    verb: "am is are was were be have has do does can will go come look see say said like want play make help "
      + "ask bring carry catch clap close count cut draw drink eat find give hear jump kick laugh "
      + "listen live open pick put read ride run sing sit sleep smile speak stand talk throw walk wash watch write "
      + "dig dip hop tell swim chat share smell taste touch ring should",
    position: "in above below behind beside between inside outside into out over up down near far",
    preposition: "at to from for of with",
    conjunction: "and but or because",
    adverb: "when where why how now today tomorrow first last before after very not",
    number: "zero one two three four five six seven eight nine ten",
    interjection: "hello goodbye sorry please welcome yes no",
    phrase: "thankyou",
  },
  // Grade 2 follows the supplied Core list's own ten categories, which already
  // sort the words by function — actions, describing words, people, objects —
  // and that is a better authority than anything derivable from the spelling.
  // Only the mixed categories (long vowels, function words, time/position,
  // feelings, story words) needed a per-word decision.
  2: {
    verb: "add agree arrive bake begin believe borrow break build buy call change choose climb collect compare "
      + "complete copy cover create cross decide describe discover drop explain finish follow happen hold imagine "
      + "improve include join know learn leave measure meet move notice order pack pass plan point practise pull "
      + "push remember return save search send solve study take teach think try understand visit wake wear win "
      + "work respect trust promise forgive invite protect retell predict discuss whisper recycle grow show use "
      + "sail wait stay need keep cook start turn burn hurt hope rhyme",
    adjective: "able alive alone amazing asleep awake brave broken busy careful clever cloudy correct dangerous "
      + "deep different difficult easy equal famous friendly gentle great healthy heavy helpful important "
      + "interesting lovely lucky noisy perfect poor pretty proud ready safe same shiny sick simple special "
      + "strange strong sweet warm weak wide wild wonderful wrong bored confused disappointed embarrassed glad "
      + "lonely nervous surprised thankful upset comfortable confident honest polite patient curious bright "
      + "high cool dark late",
    position: "across along among around behind below between through toward towards upon off middle centre "
      + "bottom front back side north south east west past",
    preposition: "about against during until",
    conjunction: "although because however therefore unless whether nor since",
    adverb: "also already almost apart always ever never often perhaps sometimes usually soon again next then "
      + "early yet once together",
    // Follows GRADE 2's own existing entries, which are the only real precedent
    // here: `every`, `many` and `little` are adjectives there, and `much` and
    // `either` are adverbs. Reading a finished card is what caught this — `per`
    // had been bucketed with the quantifiers and printed as "pronoun — a small
    // word that stands in for a naming word", which it plainly is not.
    adjective2: "both each every few fewer many more most other own",
    adverb2: "either neither only",
    pronoun: "whose",
    conjunction2: "as than if",
    preposition2: "per",
    number: "second",
    noun: "",
  },
};
const CLASS = CLASS_BY_GRADE[GRADE];
if (!CLASS) {
  console.error(`No part-of-speech table for grade ${GRADE}.`);
  console.error("Add one to CLASS_BY_GRADE — a wrong default would label every word a noun,");
  console.error("and the part of speech is printed on the learner's word card.");
  process.exit(2);
}
// A part of speech may be listed more than once in a grade's table (a trailing
// digit distinguishes the entries); the digit is not part of the name.
const posOf = new Map();
for (const [key, list] of Object.entries(CLASS)) {
  const pos = key.replace(/\d+$/, "");
  if (!POS[pos]) { console.error(`Unknown part of speech in the grade ${GRADE} table: ${key}`); process.exit(2); }
  for (const w of list.split(/\s+/).filter(Boolean)) if (!posOf.has(w)) posOf.set(w, pos);
}

const slug = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const masterFile = path.join(DATA, `master-dictionary.grade${GRADE}.json`);
const master = JSON.parse(fs.readFileSync(masterFile, "utf8"));
const have = new Set(master.entries.map((e) => e.lemma.toLowerCase()));

// The Core words, read from the units as built — the taught groups are the ones
// carrying a strand that is not "glossary".
const core = new Map();
for (let u = 1; u <= 10; u++) {
  const f = path.join(DATA, "units", `unit-${u}.json`);
  if (!fs.existsSync(f)) continue;
  const doc = JSON.parse(fs.readFileSync(f, "utf8"));
  const coreIds = new Set(doc.vocabularyGroups.filter((g) => g.strand && g.strand !== "glossary").map((g) => g.id));
  for (const l of doc.dictionaryLinks) {
    if (!coreIds.has(l.groupId)) continue;
    if (!core.has(l.masterWord)) core.set(l.masterWord, l);
  }
}

const missing = [...core.keys()].filter((w) => !have.has(w));
const unclassified = missing.filter((w) => !posOf.has(w));
const tally = {};
for (const w of missing) { const p = posOf.get(w) ?? "noun (fall-through)"; tally[p] = (tally[p] ?? 0) + 1; }

console.log(`Grade ${GRADE}: core words ${core.size} | already in the master dictionary ${core.size - missing.length}`);
console.log(`entries to add: ${missing.length}`);
console.log("  by part of speech:", JSON.stringify(tally));
if (unclassified.length) {
  console.log(`\n  ${unclassified.length} word(s) fall through to noun — read these before writing:`);
  console.log("   ", unclassified.join(" "));
}
if (!WRITE) { console.log("\nReport only — nothing written. Re-run with --write to apply."); process.exit(0); }

for (const w of missing) {
  const link = core.get(w);
  const pos = posOf.get(w) ?? "noun";
  const id = slug(w);
  const src = `./media/audio/grade-${GRADE}/dictionary/${id}.mp3`;
  master.entries.push({
    dictionaryEntryId: `ehel-en-g${GRADE}-${id}`,
    lemma: w,
    displayWord: link.displayWord && link.displayWord !== w ? link.displayWord : w,
    language: "en-GB",
    partOfSpeech: pos,
    partOfSpeechDefinition: POS[pos],
    gradeLevels: [`Grade ${GRADE}`],
    audio: {
      provider: "ElevenLabs",
      voiceId: "XfNU2rGpBa01ckF309OY",
      model: "eleven_multilingual_v2",
      normal: src, slow: src,
      slowPlaybackRate: 0.76,
      cueStart: 0, cueEnd: null,
      available: false,
      status: `Needs generating - added with the Grade ${GRADE} Core words`,
    },
  });
}
master.entries.sort((a, b) => a.lemma.localeCompare(b.lemma));
master.entryCount = master.entries.length;
fs.writeFileSync(masterFile, JSON.stringify(master, null, 2) + "\n");
console.log(`\nWrote master-dictionary.grade${GRADE}.json — ${master.entryCount} entries.`);
