#!/usr/bin/env node
// English Core words — restructure the unit vocabulary for one grade.
//
// What this does, per unit:
//   1. every vocabulary group the unit teaches today becomes a GLOSSARY group
//      ("Words from our stories"), so those words stay available to look up
//      while reading but no longer gate the Vocabulary section;
//   2. the Core words for that unit (english/grade-N/data/core-words.json)
//      become the taught groups, in that grade's strands.
//
// A Core word already taught at this grade keeps its existing dictionaryLink
// untouched: its child meaning, its five practice sentences and every audio
// clip come across as they are. Owner's decision, 2026-08-27 — reuse rather
// than re-author, which is ~35% of the authoring saved.
//
// It REFUSES to write a unit where any Core word has no teaching content. A
// link with no childMeaning and no practiceSentences would render an empty word
// card and pass every existing structural check, so the refusal is the point:
// the missing content is the work, and this tool is what measures it.
//
//   node tools/build-english-core-words.mjs --grade 2            # report, writes nothing
//   node tools/build-english-core-words.mjs --grade 2 --write    # apply, if nothing is missing
//   node tools/build-english-core-words.mjs --grade 2 --write --allow-incomplete
//                                                               # apply, leaving gaps flagged
//
// GRADE-PARAMETERISED rather than cloned, for the same reason the draft tool is:
// two copies would drift, and each grade's units would then be restructured by
// subtly different rules with nothing reporting the difference.
import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");
const ALLOW = process.argv.includes("--allow-incomplete");
let GRADE = 1;

const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  if (["--write", "--allow-incomplete"].includes(argv[i])) continue;
  console.error(`Unrecognised argument: ${argv[i]}`);
  console.error("Usage: build-english-core-words.mjs [--grade N] [--write] [--allow-incomplete]");
  process.exit(2);
}
if (!Number.isInteger(GRADE) || GRADE < 1 || GRADE > 8) {
  console.error(`--grade must be 1-8, got: ${GRADE}`);
  process.exit(2);
}

const ROOT = path.join("src", "prototypes", "ehel-academy", "english", `grade-${GRADE}`, "data");
const UNITS = path.join(ROOT, "units");
// The id prefix every generated vocabularyId and fallback group id carries.
// It MUST track the grade: left at "g1-" a Grade 2 build mints Grade 1 ids, and
// vocabularyId is the key progress is stored against, so a learner's completed
// words would collide across grades.
const IDP = `g${GRADE}`;

const core = JSON.parse(fs.readFileSync(path.join(ROOT, "core-words.json"), "utf8"));

// A Core group whose TITLE reads as the glossary is refused outright. The strand
// test below makes the tool robust either way, but a title like "Words: stories
// and talking together" is still ambiguous to every other reader of this data —
// including the check that counts taught vocabulary — so it is a naming mistake
// worth stopping at the source rather than tolerating.
const collide = core.units.flatMap((u) => u.groups.filter((g) => /stories/i.test(g.title))
  .map((g) => `unit ${u.unitNo}: ${g.id} — "${g.title}"`));
if (collide.length) {
  console.error("Refusing to run: a Core group is titled as though it were the story glossary.");
  for (const c of collide) console.error(`  ${c}`);
  console.error('Rename it so the title does not contain "stories".');
  process.exit(2);
}

const master = JSON.parse(fs.readFileSync(path.join(ROOT, `master-dictionary.grade${GRADE}.json`), "utf8"));
// Keyed lower-case, so it must be READ lower-case too. It was not, and Grade 3
// is the first grade with a capitalised headword: Africa, Asia and Europe went
// in as `Africa` and came back undefined from a map holding `africa`, so their
// three links kept `dictionaryEntryId: null` after the entries existed. The app
// joins on that id alone, so those three word cards would have thrown on
// `item.master.partOfSpeech` — the same crash the null ids cause, surviving the
// fix for them. `masterFor` is the only way in.
const masterBy = new Map(master.entries.map((e) => [e.lemma.toLowerCase(), e]));
const masterFor = (w) => masterBy.get(String(w).toLowerCase());

// Every link this grade holds today, keyed by the word. Taught links carry the
// teaching content; glossary links are look-up entries and are not reusable as
// Core words without authoring, so they are recorded separately.
// Which group is the story glossary.
//
// Originally this was a title test alone, `/stories/i`, and that is a property
// of the WORDING rather than of the group — so a Core group could satisfy it.
// Grade 2 unit 10 teaches story vocabulary and its topic group was titled
// "Words: stories and talking together": on a re-run the tool read its own
// output, took that Core group for the glossary, and moved 31 taught words out
// of the taught set. Grade 1 has no such title, which is exactly why the tool
// looked idempotent for a whole grade.
//
// A group this tool has written carries `strand`, so prefer that and keep the
// title test only for units it has never touched.
function glossaryGroupsOf(groups) {
  const byStrand = groups.filter((g) => g.strand === "glossary");
  return byStrand.length ? byStrand : groups.filter((g) => /stories/i.test(g.title));
}

// The one title english.js recognises (STORY_GLOSSARY_GROUP). It completes
// Vocabulary on every group whose title is not this string, so a glossary under
// any other name matches nothing, taughtGroups() comes back the full length, and
// taughtWords() falls through to gating on the whole unit — and Vocabulary sits
// in front of Reading in SECTION_CHAIN, so the glossary becomes a prerequisite
// for the story it glosses.
//
// glossaryGroupsOf above is deliberately BROADER than that, which is what lets
// this tool find a differently-named glossary. The merged group it writes must
// still come out under the name the runtime knows. It did not: the title came
// from `glossary?.title`, the FIRST match, and Grade 1 Unit 3 had two glossary
// groups — "Animals in our stories" ahead of "Words from our stories". It
// shipped with a 103-word gate where the other nine units have 39.
const STORY_GLOSSARY_GROUP = "Words from our stories";

const taughtLink = new Map();
const unitDocs = [];
for (let n = 1; n <= 10; n++) {
  const file = path.join(UNITS, `unit-${n}.json`);
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  unitDocs.push({ n, file, doc });
  const glossaryIds = new Set(glossaryGroupsOf(doc.vocabularyGroups).map((g) => g.id));
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
// WHOLE course — this grade's glossary links and other grades' links both
// count — where taughtLink below only holds this grade's taught links. Reading the draft is
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

// Every vocabularyId a Core card will claim, across the WHOLE grade, computed
// before any unit is built. It has to be grade-wide rather than per-unit:
// `taughtLink` resolves a word to the first taught link anywhere in the grade,
// so a Core word in unit 2 can take over a link that lives in unit 1, and it is
// unit 1's build that would otherwise displace that link into its glossary
// still carrying the id.
const claimedIds = new Set();
for (const cu of core.units)
  for (const g of cu.groups)
    for (const w of g.words) {
      const id = taughtLink.get(w)?.vocabularyId;
      if (id) claimedIds.add(id);
    }

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
      // Authored content is layered over the draft FIELD BY FIELD, not swapped
      // in wholesale. The draft tool has always merged this way, and `??` here
      // did not: an authored entry carrying only a re-pitched childMeaning
      // replaced the draft entry outright, taking its five sentences with it, so
      // the word arrived with a meaning and nothing to read. Nine Grade 2 words
      // were reported as "needing authoring" while the draft called all 400
      // complete — two tools reading one file by different rules, which is the
      // divergence this file exists to avoid.
      const fromDraft = d
        ? { childMeaning: d.childMeaning, practiceSentences: d.practiceSentences || [], acceptedFrom: d.meaningSource }
        : undefined;
      const a = authored[w];
      const written = a || fromDraft
        ? {
          ...(fromDraft ?? {}),
          ...(a ?? {}),
          childMeaning: a?.childMeaning ?? fromDraft?.childMeaning,
          practiceSentences: a?.practiceSentences ?? fromDraft?.practiceSentences ?? [],
        }
        : undefined;
      if (written && written.childMeaning && (written.practiceSentences || []).length >= 5) {
        authoredCount += 1;
        links.push({
          ...(existing ?? {}),
          vocabularyId: existing?.vocabularyId ?? `${IDP}-u${cu.unitNo}-core-${w.replace(/[^a-z]/g, "")}`,
          unitId: doc.unit.unitId,
          dictionaryEntryId: existing?.dictionaryEntryId ?? masterFor(w)?.dictionaryEntryId ?? null,
          masterWord: w,
          displayWord: written.displayWord ?? existing?.displayWord ?? w,
          childMeaning: written.childMeaning,
          exampleSentence: written.exampleSentence ?? written.practiceSentences[0],
          practiceSentences: written.practiceSentences,
          spellingPractice: written.spellingPractice ?? existing?.spellingPractice ?? null,
          sentenceStarter: written.sentenceStarter ?? existing?.sentenceStarter ?? null,
          aiTutorPrompt: written.aiTutorPrompt ?? existing?.aiTutorPrompt ?? null,
          groupId: g.id, groupTitle: g.title, sequence: i + 1,
          origin: `Ehel Grade ${GRADE} Core words`,
          reviewStatus: written.acceptedFrom ? "Reviewed - accepted from existing content" : `Authored for Grade ${GRADE} Core words`,
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
        missing.push({ unit: cu.unitNo, word: w, hasMasterEntry: Boolean(masterFor(w)), hadPartialLink: Boolean(existing) });
        links.push({
          vocabularyId: `${IDP}-u${cu.unitNo}-core-${w.replace(/[^a-z]/g, "")}`,
          unitId: doc.unit.unitId,
          dictionaryEntryId: masterFor(w)?.dictionaryEntryId ?? null,
          groupId: g.id, groupTitle: g.title, sequence: i + 1,
          masterWord: w,
          childMeaning: null, exampleSentence: null, practiceSentences: [],
          spellingPractice: null, sentenceStarter: null, aiTutorPrompt: null,
          origin: `Ehel Grade ${GRADE} Core words`, reviewStatus: "Needs authoring",
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
  const glossaryIds2 = new Set(glossaryGroupsOf(doc.vocabularyGroups).map((g) => g.id));
  const oldTaught = doc.vocabularyGroups.filter(
    (g) => !glossaryIds2.has(g.id) && !coreIds.has(g.id));
  const glossary = doc.vocabularyGroups.find((g) => glossaryIds2.has(g.id));
  const oldIds = new Set(oldTaught.map((g) => g.id));
  // A Core word that was ALREADY taught keeps its old link's vocabularyId, so
  // that id now belongs to the Core card. The same old link is also sitting in a
  // group being displaced into the glossary — and displacing it puts the id in
  // the unit TWICE. vocabularyId is the key progress is stored against
  // (`progress.knownWords`), so a duplicate means marking one word learned marks
  // the other, and the section can complete without the child having seen it.
  //
  // Grade 1 never showed this: almost none of its Core words had been taught
  // before, so no id was ever taken over. Grade 2 reuses 42 links and produced
  // 26 duplicates inside single units. Drop any glossary-bound link whose id a
  // Core card has claimed — the word is taught now, so it does not also need a
  // look-up entry. `claimedIds` is computed grade-wide above.
  const displaced = doc.dictionaryLinks.filter(
    (l) => oldIds.has(l.groupId) && !claimedIds.has(l.vocabularyId));
  // A rerun must not carry its own core links into the glossary either: they are
  // rebuilt from core-words.json above, so drop anything already in a core group.
  const keptGlossary = doc.dictionaryLinks.filter(
    (l) => !oldIds.has(l.groupId) && !coreIds.has(l.groupId) && !claimedIds.has(l.vocabularyId));

  const glossaryId = glossary?.id ?? `${IDP}-u${cu.unitNo}-glossary`;
  // Not `glossary?.title` — see STORY_GLOSSARY_GROUP above. Carrying the found
  // group's own title forward is what shipped Unit 3's glossary under a name the
  // runtime cannot recognise, and every gate in the repo passed it.
  const glossaryTitle = STORY_GLOSSARY_GROUP;
  groups.push({ id: glossaryId, number: groups.length + 1, title: glossaryTitle, strand: "glossary" });

  const unitLinks = [
    ...links,
    ...keptGlossary.map((l) => ({ ...l, groupId: glossaryId, groupTitle: glossaryTitle })),
    ...displaced.map((l) => ({ ...l, groupId: glossaryId, groupTitle: glossaryTitle })),
  ];
  // Every reader that asks how big a group is asks `group.vocabularyIds` —
  // check-english-content.mjs's three vocabulary rules, and the unit Study Plan's
  // newWordCount / storyWordCount in english.js. This tool stopped emitting the
  // field, so at Grades 1-2 all of them measured zero and passed having measured
  // nothing: the structural "glossary under another name" detector, written for
  // exactly the title defect above, compared 0 against 0 while that defect was
  // live. Derived in link order, which is how the other grades' builders write it.
  const withIds = groups.map((g) => ({
    id: g.id, number: g.number, title: g.title,
    vocabularyIds: unitLinks.filter((l) => l.groupId === g.id).map((l) => l.vocabularyId),
    strand: g.strand,
  }));
  plan.push({
    n, file, groups: withIds, links: unitLinks,
    coreCount: cu.coreWordCount, displaced: displaced.length, glossaryTotal: keptGlossary.length + displaced.length,
  });
}

console.log(`Grade ${GRADE} Core words — restructure plan\n`);
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
