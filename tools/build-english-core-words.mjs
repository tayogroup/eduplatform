#!/usr/bin/env node
// Grade 1 Core words — restructure the unit vocabulary.
//
// What this does, per unit:
//   1. every vocabulary group the unit teaches today becomes a GLOSSARY group
//      ("Words from our stories"), so those words stay available to look up
//      while reading but no longer gate the Vocabulary section;
//   2. the Core words for that unit (english/grade-1/data/core-words.json)
//      become the taught groups, in three strands — phonics, topic, sight.
//
// A Core word that is already taught at Grade 1 keeps its existing
// dictionaryLink untouched: its child meaning, its five practice sentences and
// every audio clip come across as they are. Owner's decision, 2026-08-27 —
// reuse rather than re-author, which is ~35% of the authoring saved.
//
// It REFUSES to write a unit where any Core word has no teaching content. A
// link with no childMeaning and no practiceSentences would render an empty word
// card and pass every existing structural check, so the refusal is the point:
// the missing content is the work, and this tool is what measures it.
//
//   node tools/build-english-core-words.mjs            # report only, writes nothing
//   node tools/build-english-core-words.mjs --write    # apply, if nothing is missing
//   node tools/build-english-core-words.mjs --write --allow-incomplete
//                                                     # apply, leaving gaps flagged
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english", "grade-1", "data");
const UNITS = path.join(ROOT, "units");
const WRITE = process.argv.includes("--write");
const ALLOW = process.argv.includes("--allow-incomplete");

for (const a of process.argv.slice(2)) {
  if (!["--write", "--allow-incomplete"].includes(a)) {
    console.error(`Unrecognised argument: ${a}`);
    console.error("Usage: build-english-core-words.mjs [--write] [--allow-incomplete]");
    process.exit(2);
  }
}

const core = JSON.parse(fs.readFileSync(path.join(ROOT, "core-words.json"), "utf8"));
const master = JSON.parse(fs.readFileSync(path.join(ROOT, "master-dictionary.grade1.json"), "utf8"));
const masterBy = new Map(master.entries.map((e) => [e.lemma.toLowerCase(), e]));

// Every link Grade 1 holds today, keyed by the word. Taught links carry the
// teaching content; glossary links are look-up entries and are not reusable as
// Core words without authoring, so they are recorded separately.
const taughtLink = new Map();
const unitDocs = [];
for (let n = 1; n <= 10; n++) {
  const file = path.join(UNITS, `unit-${n}.json`);
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  unitDocs.push({ n, file, doc });
  const glossaryIds = new Set(doc.vocabularyGroups.filter((g) => /stories/i.test(g.title)).map((g) => g.id));
  for (const link of doc.dictionaryLinks) {
    if (glossaryIds.has(link.groupId)) continue;
    const w = String(link.masterWord || "").toLowerCase();
    if (w && !taughtLink.has(w)) taughtLink.set(w, link);
  }
}

const authoredFile = path.join(ROOT, "core-words-authored.json");
const authored = fs.existsSync(authoredFile)
  ? JSON.parse(fs.readFileSync(authoredFile, "utf8")).words : {};

// The reviewed draft is the content of record. It resolves each word across the
// WHOLE course — a Grade 1 glossary link and a higher-grade link both count —
// where taughtLink below only holds Grade 1's taught links. Reading the draft is
// what keeps this tool's idea of "complete" identical to the draft's; deriving
// it again here produced 34 phantom gaps for words whose content sits in a
// glossary entry.
const draftFile = path.join(ROOT, "core-words-draft.json");
const draft = new Map();
if (fs.existsSync(draftFile)) {
  for (const u of JSON.parse(fs.readFileSync(draftFile, "utf8")).units)
    for (const w of u.words) draft.set(w.word, w);
}

// check:english cross-checks the manifest's vocabularyCount against the number
// of dictionaryLinks in each unit. The restructure changes that count, so the
// manifest is maintained here rather than left to drift and fail the gate.
const manifestFile = path.join(ROOT, "course-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const manifestUnits = new Map(manifest.units.map((u) => [u.number, u]));

const complete = (link) => Boolean(link && link.childMeaning && (link.practiceSentences || []).length >= 5);

// Audio is keyed to the exact text it speaks. If any practice sentence or the
// child meaning has changed, the existing clips say the old words and cannot be
// carried over — they are cleared and flagged rather than left silently wrong.
function sentencesChanged(existing, written) {
  if (!existing) return true;
  if (existing.childMeaning !== written.childMeaning) return true;
  const before = existing.practiceSentences || [];
  const after = written.practiceSentences || [];
  return before.length !== after.length || before.some((s, i) => s !== after[i]);
}

let reused = 0, authoredCount = 0, audioKept = 0, audioCleared = 0;
const missing = [];
const plan = [];

for (const cu of core.units) {
  const { doc, file, n } = unitDocs[cu.unitNo - 1];
  const groups = [];
  const links = [];

  for (const g of cu.groups) {
    groups.push({ id: g.id, number: groups.length + 1, title: g.title, strand: g.strand });
    g.words.forEach((w, i) => {
      const existing = taughtLink.get(w);
      const d = draft.get(w);
      // Authored first; otherwise whatever the reviewed draft resolved, which
      // may have come from a glossary link or another grade.
      const written = authored[w]
        ?? (d && d.childMeaning && (d.practiceSentences || []).length >= 5
          ? { childMeaning: d.childMeaning, practiceSentences: d.practiceSentences, acceptedFrom: d.meaningSource }
          : undefined);
      if (written && written.childMeaning && (written.practiceSentences || []).length >= 5) {
        authoredCount += 1;
        links.push({
          ...(existing ?? {}),
          vocabularyId: existing?.vocabularyId ?? `g1-u${cu.unitNo}-core-${w.replace(/[^a-z]/g, "")}`,
          unitId: doc.unit.unitId,
          dictionaryEntryId: existing?.dictionaryEntryId ?? masterBy.get(w)?.dictionaryEntryId ?? null,
          masterWord: w,
          displayWord: written.displayWord ?? existing?.displayWord ?? w,
          childMeaning: written.childMeaning,
          exampleSentence: written.exampleSentence ?? written.practiceSentences[0],
          practiceSentences: written.practiceSentences,
          spellingPractice: written.spellingPractice ?? existing?.spellingPractice ?? null,
          sentenceStarter: written.sentenceStarter ?? existing?.sentenceStarter ?? null,
          aiTutorPrompt: written.aiTutorPrompt ?? existing?.aiTutorPrompt ?? null,
          groupId: g.id, groupTitle: g.title, sequence: i + 1,
          origin: "Ehel Grade 1 Core words",
          reviewStatus: written.acceptedFrom ? "Reviewed - accepted from existing content" : "Authored for Grade 1 Core words",
          // The audio on a reused link belongs to its OLD sentences. Where the
          // text changed, the clips no longer match and must be re-rendered.
          ...(sentencesChanged(existing, written)
            ? (audioCleared += 1, { sentenceAudio: [], meaningAudio: null, audioStatus: "Needs regeneration" })
            : (audioKept += 1, {})),
        });
      } else if (complete(existing)) {
        reused += 1;
        links.push({ ...existing, groupId: g.id, groupTitle: g.title, sequence: i + 1 });
      } else {
        missing.push({ unit: cu.unitNo, word: w, hasMasterEntry: masterBy.has(w), hadPartialLink: Boolean(existing) });
        links.push({
          vocabularyId: `g1-u${cu.unitNo}-core-${w.replace(/[^a-z]/g, "")}`,
          unitId: doc.unit.unitId,
          dictionaryEntryId: masterBy.get(w)?.dictionaryEntryId ?? null,
          groupId: g.id, groupTitle: g.title, sequence: i + 1,
          masterWord: w,
          childMeaning: null, exampleSentence: null, practiceSentences: [],
          spellingPractice: null, sentenceStarter: null, aiTutorPrompt: null,
          origin: "Ehel Grade 1 Core words", reviewStatus: "Needs authoring",
        });
      }
    });
  }

  // Everything the unit taught BEFORE this restructure joins the story glossary.
  //
  // Core groups are excluded, and that exclusion is what makes the tool safe to
  // run twice. Without it a second run treats its own output as the old taught
  // vocabulary and displaces it into the glossary again — unit 8 went from
  // 39 core + 55 glossary to 39 core + 94 glossary, with the Core words
  // duplicated on both sides and nothing reporting it.
  const coreIds = new Set(cu.groups.map((g) => g.id));
  const oldTaught = doc.vocabularyGroups.filter(
    (g) => !/stories/i.test(g.title) && !coreIds.has(g.id));
  const glossary = doc.vocabularyGroups.find((g) => /stories/i.test(g.title));
  const oldIds = new Set(oldTaught.map((g) => g.id));
  const displaced = doc.dictionaryLinks.filter((l) => oldIds.has(l.groupId));
  // A rerun must not carry its own core links into the glossary either: they are
  // rebuilt from core-words.json above, so drop anything already in a core group.
  const keptGlossary = doc.dictionaryLinks.filter(
    (l) => !oldIds.has(l.groupId) && !coreIds.has(l.groupId));

  const glossaryId = glossary?.id ?? `g1-u${cu.unitNo}-glossary`;
  const glossaryTitle = glossary?.title ?? "Words from our stories";
  groups.push({ id: glossaryId, number: groups.length + 1, title: glossaryTitle, strand: "glossary" });

  plan.push({
    n, file, groups,
    links: [...links, ...keptGlossary.map((l) => ({ ...l, groupId: glossaryId, groupTitle: glossaryTitle })),
      ...displaced.map((l) => ({ ...l, groupId: glossaryId, groupTitle: glossaryTitle }))],
    coreCount: cu.coreWordCount, displaced: displaced.length, glossaryTotal: keptGlossary.length + displaced.length,
  });
}

console.log("Grade 1 Core words — restructure plan\n");
console.log("unit  core  reused  to author  glossary after");
for (const p of plan) {
  const need = missing.filter((m) => m.unit === p.n).length;
  console.log(
    String(p.n).padStart(4) + String(p.coreCount).padStart(6) + String(p.coreCount - need).padStart(8) +
    String(need).padStart(11) + String(p.glossaryTotal).padStart(16));
}
console.log("\nCore words total:", core.wordCount);
console.log("  links reused whole (meaning + 5 sentences + audio):", reused);
console.log("  links using authored / reviewed content:", authoredCount);
console.log("  words needing authoring:", missing.length);
console.log("    of those, the word's own clip already exists:", missing.filter((m) => m.hasMasterEntry).length);
console.log("    needing a master-dictionary entry too:", missing.filter((m) => !m.hasMasterEntry).length);
console.log("  practice sentences to write:", missing.length * 5);
console.log("");
console.log("  audio carried over unchanged (text identical):", audioKept, "words");
console.log("  audio cleared, needs regeneration (text changed):", audioCleared, "words");
console.log("  clips to generate: about", audioCleared * 6, "(meaning + 5 sentences each)");

if (!WRITE) {
  console.log("\nReport only — nothing written. Re-run with --write to apply.");
  process.exit(0);
}
if (missing.length && !ALLOW) {
  console.error(`\nRefusing to write: ${missing.length} Core words have no teaching content.`);
  console.error("A link with no meaning and no practice sentences renders an empty word card and");
  console.error("passes every structural check. Author the content first, or pass --allow-incomplete");
  console.error("to apply the structure with those words flagged reviewStatus: \"Needs authoring\".");
  process.exit(1);
}
for (const p of plan) {
  const doc = unitDocs[p.n - 1].doc;
  doc.vocabularyGroups = p.groups;
  doc.dictionaryLinks = p.links;
  // The units are stored with a 2-space indent. Writing 1 reformats every line
  // of a 340 KB file and buries the actual change: the first attempt produced
  // 91,044 insertions against 72,651 deletions for a vocabulary swap.
  fs.writeFileSync(p.file, JSON.stringify(doc, null, 2) + "\n");
  manifestUnits.get(p.n).vocabularyCount = p.links.length;
  console.log(`  wrote unit-${p.n}.json — ${p.coreCount} core, ${p.glossaryTotal} glossary`);
}
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
console.log(`  updated course-manifest.json vocabularyCount for ${plan.length} units`);
console.log("\nDone. Run: npm run check:english");
