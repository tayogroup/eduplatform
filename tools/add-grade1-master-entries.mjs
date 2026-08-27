#!/usr/bin/env node
// Add master-dictionary entries for Grade 1 Core words that have none.
//
// The word-alone clip a learner hears when tapping a vocabulary word comes from
// the `dictionary` category of generate-ehel-english-audio.js, which iterates
// master-dictionary.grade1.json. 198 of the 398 Core words were never in it, so
// without this they would have five sentence clips and no way to say themselves
// — on a phonics card, the word-alone clip is the one that matters most.
//
// Part of speech is taken from the Core list's own categories rather than
// guessed per word: the supplied list already sorts words into pronouns, action
// words, describing words, numbers and so on, and that is a better authority
// than anything derivable from the spelling.
//
//   node tools/add-grade1-master-entries.mjs           # report
//   node tools/add-grade1-master-entries.mjs --write   # apply
import fs from "node:fs";
import path from "node:path";

const DATA = path.join("src", "prototypes", "ehel-academy", "english", "grade-1", "data");
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") {
    console.error(`Unrecognised argument: ${a}`);
    process.exit(2);
  }
}

// The parts of speech already in use, with the child-facing definitions the
// existing 573 entries carry. Nothing new is invented here.
const POS = {
  noun: "A naming word",
  verb: "Shows an action or a state.",
  adjective: "Describes a noun.",
  pronoun: "A small word that stands in for a naming word.",
  article: "A small word that goes before a naming word.",
  number: "Names a quantity or position in an order.",
  preposition: "Shows where one thing is compared with another.",
  conjunction: "Joins two words, phrases or ideas together.",
  interjection: "A word that shows strong feeling, like surprise or joy.",
  adverb: "Describes how, when or where an action happens.",
  position: "Shows where one thing is compared with another.",
  phrase: "A small group of words that works together.",
};

// Word -> part of speech, grouped the way the Core list groups them.
const CLASS = {
  // Closed-class words follow the precedent the existing 573 entries already
  // set, not textbook grammar, so one file does not describe the same kind of
  // word two ways. `my` is a pronoun there, so the other possessives are; the
  // quantifiers sit beside `every`, `many` and `much` as adjectives; and the
  // spatial words join `under`, `on`, `up`, `down`, `here`, `there` and `near`
  // under `position`, which the file uses for exactly those.
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
};
const posOf = new Map();
for (const [pos, list] of Object.entries(CLASS))
  for (const w of list.split(/\s+/).filter(Boolean)) if (!posOf.has(w)) posOf.set(w, pos);

const master = JSON.parse(fs.readFileSync(path.join(DATA, "master-dictionary.grade1.json"), "utf8"));
const have = new Set(master.entries.map((e) => e.lemma.toLowerCase()));

const core = new Map();
for (let u = 1; u <= 10; u++) {
  const doc = JSON.parse(fs.readFileSync(path.join(DATA, "units", `unit-${u}.json`), "utf8"));
  for (const l of doc.dictionaryLinks) {
    if (/stories/i.test(l.groupTitle || "")) continue;
    if (!core.has(l.masterWord)) core.set(l.masterWord, l);
  }
}

const missing = [...core.keys()].filter((w) => !have.has(w));
const unclassified = missing.filter((w) => !posOf.has(w));
const tally = {};
for (const w of missing) tally[posOf.get(w) ?? "UNCLASSIFIED"] = (tally[posOf.get(w) ?? "UNCLASSIFIED"] ?? 0) + 1;

console.log(`core words: ${core.size} | already in the master dictionary: ${core.size - missing.length}`);
console.log(`entries to add: ${missing.length}`);
console.log("  by part of speech:", JSON.stringify(tally));
if (unclassified.length) {
  console.log(`\n  ${unclassified.length} word(s) fall through to noun — check these:`);
  console.log("   ", unclassified.join(" "));
}
if (!WRITE) { console.log("\nReport only — nothing written. Re-run with --write to apply."); process.exit(0); }

for (const w of missing) {
  const link = core.get(w);
  const pos = posOf.get(w) ?? "noun";
  master.entries.push({
    dictionaryEntryId: `ehel-en-g1-${w.replace(/[^a-z]/g, "")}`,
    lemma: w,
    displayWord: link.displayWord && link.displayWord !== w ? link.displayWord : w,
    language: "en-GB",
    partOfSpeech: pos,
    partOfSpeechDefinition: POS[pos],
    gradeLevels: ["Grade 1"],
    audio: {
      provider: "ElevenLabs",
      voiceId: "XfNU2rGpBa01ckF309OY",
      model: "eleven_multilingual_v2",
      normal: `./media/audio/grade-1/dictionary/${w.replace(/[^a-z]/g, "")}.mp3`,
      slow: `./media/audio/grade-1/dictionary/${w.replace(/[^a-z]/g, "")}.mp3`,
      slowPlaybackRate: 0.76,
      cueStart: 0,
      cueEnd: null,
      available: false,
      status: "Needs generating - added with the Grade 1 Core words",
    },
  });
}
master.entries.sort((a, b) => a.lemma.localeCompare(b.lemma));
master.entryCount = master.entries.length;
fs.writeFileSync(path.join(DATA, "master-dictionary.grade1.json"), JSON.stringify(master, null, 2) + "\n");
console.log(`\nWrote master-dictionary.grade1.json — ${master.entryCount} entries.`);
