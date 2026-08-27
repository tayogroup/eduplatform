// The one definition of the tutoring topic index: which subjects carry one,
// what a "topic" is per subject, and how each grade's index is derived from
// that grade's unit JSONs. build-topic-index.mjs writes what this produces;
// check-topic-index.mjs re-derives it and fails on any difference — so the
// output must be a pure function of the content on disk (no timestamps, no
// machine paths), or the gate would flag every rebuild as drift.
//
// Why it exists: the tutoring add-on starts from a PROBLEM ("percentages
// homework"), not from a course position, and nothing in the app could answer
// "where does Ehel teach this?" — no topic list, no search, only unit titles
// behind a grade guess. Each grade's index lives beside its other content at
// <subject>/<stageDir>/data/topic-index.json, which the content uploader
// already walks, so deploying it is the ordinary content upload.
//
// Deliberately NOT indexed, and the gate asserts the absences:
// - Global Perspectives Stage 5 — withdrawn (WITHDRAWN_STAGES in
//   shell/subjects/global-perspectives.js, withdrawn-courses.json). A search
//   result pointing into a stage the app refuses to serve is a dead end.
// - English units below unit 1 — Grade 1 Unit 0 is withdrawn from learners
//   (shell/subjects/english.js defaultUnit = 1; the manifest still says 0 for
//   teacher preview, which is exactly why the manifest is not trusted here).
// - Assessment/quiz/answer-key content — the index routes a learner to
//   teaching, never to answers.

"use strict";

const fs = require("fs");
const path = require("path");
const { readEbookCatalog, ebooksFor } = require("./ehel-ebook-catalog.js");

const SCHEMA_VERSION = "Ehel Topic Index v1.0";

// Per-subject shape. `param` is the query parameter the app's URL takes
// (?stage= / ?grade= / ?level=), matching each shell module's config.param.
// `stages` is the learner-visible set — GP omits 5 (withdrawn), Intensive
// English has two CEFR levels.
const SUBJECTS = {
  mathematics: { param: "stage", stageWord: "Stage", stages: [1, 2, 3, 4, 5, 6, 7, 8], dir: (n) => `grade-${n}` },
  science: { param: "stage", stageWord: "Stage", stages: [1, 2, 3, 4, 5, 6, 7, 8], dir: (n) => `grade-${n}` },
  computing: { param: "stage", stageWord: "Stage", stages: [1, 2, 3, 4, 5, 6, 7, 8], dir: (n) => `grade-${n}` },
  "global-perspectives": { param: "stage", stageWord: "Stage", stages: [1, 2, 3, 4, 6, 7, 8], dir: (n) => `grade-${n}` },
  english: { param: "grade", stageWord: "Grade", stages: [1, 2, 3, 4, 5, 6, 7, 8], dir: (n) => `grade-${n}`, minUnit: 1 },
  "intensive-english": { param: "level", stageWord: "Level", stages: [1, 2], dir: (n) => `level-${n}` },
};

// Words that carry no topical signal. Small on purpose: an over-grown list
// starts eating subject vocabulary ("mean" is a maths word, not filler).
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "these", "those", "your", "you",
  "are", "was", "were", "will", "can", "could", "should", "would", "have", "has",
  "had", "not", "but", "all", "any", "one", "two", "how", "what", "when", "where",
  "which", "who", "why", "about", "into", "from", "they", "them", "their", "there",
  "then", "than", "its", "our", "out", "use", "using", "used", "make", "makes",
  "made", "learn", "learning", "unit", "lesson", "each", "more", "most", "some",
  "such", "like", "also", "own", "way", "ways", "well", "very", "does", "doing",
  "did", "being", "been", "over", "under", "between", "after", "before", "part",
]);

// Lowercase alphanumeric tokens, stopwords and short words dropped, order of
// first appearance kept (deterministic), deduplicated, capped.
function keywords(texts, cap) {
  const seen = new Set();
  const out = [];
  for (const text of texts) {
    if (!text) continue;
    for (const raw of String(text).toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 3 || STOPWORDS.has(raw) || seen.has(raw)) continue;
      seen.add(raw);
      out.push(raw);
      if (out.length >= cap) return out;
    }
  }
  return out;
}

const topic = (section, label, texts) => ({ section, label: String(label || "").trim(), keywords: keywords(texts, 20) });
const clip = (text, n = 400) => String(text || "").slice(0, n);

// --- per-subject topic extraction -------------------------------------------
// Section ids MUST be routes the subject's shell actually renders (the
// renderers map in shell/subjects/<subject>.js) — a topic pointing at a route
// nothing draws is the portal-allowlist bug over again: not a 404, a silent
// landing on the wrong page.

function topicsFamilyA(unit, subject) {
  const out = [];
  for (const c of unit.concepts || []) out.push(topic("lesson", c.title, [c.title, clip(c.explanation), c.example]));
  for (const m of unit.methods || []) out.push(topic("method", m.title, [m.title, clip(m.example)]));
  for (const w of unit.workedExamples || []) out.push(topic("examples", w.title, [w.title, clip(w.prompt)]));
  for (const e of unit.explorations || []) out.push(topic("explore", e.title, [e.title]));
  if (subject === "computing") for (const c of unit.codeExamples || []) out.push(topic("code", c.title, [c.title, clip(c.intro)]));
  const terms = (unit.reference?.terms || []).map((t) => (Array.isArray(t) ? t[0] : t?.term)).filter(Boolean);
  if (terms.length) out.push({ section: "words", label: `${unit.subject} words`, keywords: keywords(terms, 40) });
  return out;
}

function topicsGlobalPerspectives(unit) {
  const out = [];
  for (const e of unit.explainers || []) { if (!e.isFrontMatter) out.push(topic("lesson", e.title, [e.title, clip(e.body)])); }
  for (const b of unit.bigIdeas || []) out.push(topic("bigideas", b.title, [b.title]));
  for (const m of unit.models || []) out.push(topic("models", m.title, [m.title]));
  for (const t of unit.toolkit || []) out.push(topic("toolkit", t.title, [t.title, clip(t.intro)]));
  const terms = (unit.reference?.vocabulary || []).map((v) => v.term).filter(Boolean);
  if (terms.length) out.push({ section: "words", label: "Skill words", keywords: keywords(terms, 40) });
  return out;
}

function topicsEnglish(unit, ctx) {
  const out = [];
  for (const r of unit.readings || []) out.push(topic("reading", r.title, [r.title, r.genre, r.theme]));
  for (const g of unit.grammar || []) out.push(topic("grammar", g.title, [g.title, clip(g.explanation)]));
  for (const w of unit.writing || []) out.push(topic("writing", w.title, [w.title]));
  for (const s of unit.speaking || []) out.push(topic("speaking", s.title, [s.title]));
  // Vocabulary is searched by the words a group teaches, one topic per group —
  // a topic per word would put ~170 near-identical entries on every unit.
  const byGroup = new Map();
  for (const link of unit.dictionaryLinks || []) {
    if (!byGroup.has(link.groupId)) byGroup.set(link.groupId, []);
    byGroup.get(link.groupId).push(link.masterWord);
  }
  for (const g of unit.vocabularyGroups || []) {
    const words = (byGroup.get(g.id) || []).filter(Boolean);
    if (words.length) out.push({ section: "dictionary", label: g.title, keywords: keywords([g.title, ...words], 40) });
  }
  // Books. The picture-book shelf is the one section whose content is NOT in the
  // content tier: `ebookCatalog` is a const in shell/subjects/english.js. So
  // nothing derived topics from it and the tutoring picker, which offers Books,
  // answered "No Books lessons are indexed" for every grade — a live dead end
  // that looked like missing content rather than a missing derivation.
  //
  // Indexed here rather than by moving the catalogue into content: the story
  // TEXT would then exist twice, which is the defect write-english-ebook-docs.mjs
  // exists to prevent (the Grade 1 hand-typed STORY.txt copies went stale exactly
  // that way). A derived index is the same shape as everything else in this file.
  //
  // English only. Intensive English shares topicsEnglish and has no shelf, and
  // the shelf itself stops at Grade 4 by the owner's 2026-08-20 decision, so an
  // empty answer above Grade 4 is correct rather than a gap.
  for (const book of (ctx && ctx.ebooks) || []) {
    // The story's own words are what a learner would search for -- "the fawn who
    // could not stop crying" finds Smile Please! -- so the page text carries the
    // keywords, capped like every other multi-item topic here.
    const pageText = (book.pages || []).map((pg) => clip(pg && pg.text, 120));
    out.push({
      section: "ebooks",
      label: book.title,
      keywords: keywords([book.title, book.description, book.level, ...pageText], 40),
    });
  }
  // The four below were added when English's tutoring picker started offering
  // SECTIONS rather than unit themes (course-app.js :: TUTORING_ENGLISH_SECTIONS).
  // Picking one selects on `topic.section`, so a section with no topics is a
  // dead entry in that menu — these were four of them.
  //
  // Granularity is chosen per section by measuring how repetitive the labels
  // are, which is the same judgement the vocabulary grouping above records.
  // Measured across Grade 6's ten units: activity titles are 57 distinct out of
  // 60, so one topic each; comprehension carries 4 named groups per unit;
  // quizzes are one per unit; and game titles are **12 distinct out of 120** —
  // the same twelve games in every unit — so a topic per game would put twelve
  // near-identical chips on every result card. The pack gets ONE topic whose
  // keywords are the games it holds, exactly as a vocabulary group is one topic
  // keyworded by its words.
  const byComprehension = new Map();
  for (const c of unit.comprehension || []) {
    const group = String(c.section || "").trim();
    if (!group) continue; // a row with no group name would index as a blank label
    if (!byComprehension.has(group)) byComprehension.set(group, []);
    byComprehension.get(group).push(c.question);
  }
  for (const [group, questions] of byComprehension) {
    out.push({ section: "comprehension", label: group, keywords: keywords([group, ...questions.map((q) => clip(q, 120))], 30) });
  }
  for (const a of unit.activities || []) out.push(topic("activities", a.title, [a.title, a.activityType]));
  const byQuiz = new Map();
  for (const q of unit.quizzes || []) {
    const title = String(q.quizTitle || "").trim();
    if (!title) continue;
    if (!byQuiz.has(title)) byQuiz.set(title, []);
    byQuiz.get(title).push(q.question);
  }
  for (const [title, questions] of byQuiz) {
    out.push({ section: "quiz", label: title, keywords: keywords([title, ...questions.map((q) => clip(q, 120))], 30) });
  }
  // The Glossary is ONE topic for the whole grade, on its lowest-numbered unit,
  // and that shape is forced by what the page is. renderGlossary draws every
  // word in the grade in one flat alphabetical list out of `sentenceGlossary` —
  // the same content whichever unit the learner stands in, and with no groups to
  // mirror. A topic per unit would give ten identical cards per grade all
  // opening the same page; a topic per WORD would be thousands, the mistake the
  // vocabulary grouping above already refuses. One card per grade is what the
  // picker should give: this grade's glossary, and the ones either side.
  //
  // English only. Intensive English shares this function and its shell draws no
  // `glossary` section, so a topic there would sit behind a route that subject
  // does not have — which check-topic-index rejects, because it reads the valid
  // section ids out of each subject's own shell.
  //
  // The keywords describe the PAGE rather than sampling its words: forty of
  // several thousand would be an arbitrary alphabetical slice presented as if it
  // meant something, and the words are already reachable through `dictionary`.
  if (ctx && ctx.subject === "english" && ctx.firstUnitOfGrade && ctx.glossaryWords > 0) {
    out.push({
      section: "glossary",
      label: "Glossary — every word in this grade",
      // The page's own words, ALL of them, plus words for the page itself.
      //
      // These were nine generic terms, on the reasoning that forty of several
      // thousand would be an arbitrary alphabetical slice presented as if it
      // meant something. That objection is right about a SAMPLE and is what this
      // avoids by taking the whole list: nothing is chosen, so nothing is
      // arbitrary. Generic terms alone made the card unreachable by the only
      // search anyone runs against a glossary — a learner searched "milk", got
      // Vocabulary and Quiz cards from three other units, and no way to the
      // entry that defines it.
      //
      // It does not make the card match everything: it matches a word only if
      // THIS grade's glossary actually holds it, which is exactly the claim the
      // card makes. A grade whose glossary lacks the word contributes nothing.
      keywords: keywords([
        "glossary", "word", "words", "meaning", "meanings", "definition", "definitions", "spelling", "vocabulary",
        ...(ctx.glossaryWordList || []),
      ], Number.MAX_SAFE_INTEGER),
    });
  }
  // Games live in their own pack beside the unit, not inside it — the only
  // section here whose source is a second file, which is why extractTopics
  // takes a ctx at all.
  const pack = ctx && ctx.games;
  if (pack && (pack.games || []).length) {
    const titles = pack.games.map((g) => g.title).filter(Boolean);
    const skills = pack.games.map((g) => g.skill).filter(Boolean);
    out.push({ section: "games", label: pack.title || "Games", keywords: keywords([pack.title, ...titles, ...skills], 40) });
  }
  return out;
}

function extractTopics(subject, unit, ctx) {
  if (subject === "global-perspectives") return topicsGlobalPerspectives(unit);
  if (subject === "english" || subject === "intensive-english") return topicsEnglish(unit, ctx);
  return topicsFamilyA(unit, subject);
}

function outcomeTexts(unit) {
  return (unit.outcomes || []).map((o) => (typeof o === "string" ? o : o?.text || o?.learningOutcome || "")).filter(Boolean);
}

// --- index assembly ----------------------------------------------------------

// A unit's game pack, or null. Absent for most subjects and for some English
// units, and absence is normal rather than an error — the section simply
// contributes no topic.
// A grade's sentence glossary, or null. Read once per GRADE rather than per
// unit, which is the whole reason its topic is shaped the way it is below.
function readGlossary(dataDir) {
  const file = path.join(dataDir, "sentence-glossary.json");
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function readGamesPack(dataDir, unitNumber) {
  const file = path.join(dataDir, "games", `unit-${unitNumber}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function buildGradeIndex(ehelRoot, subject, stage) {
  const cfg = SUBJECTS[subject];
  const dataDir = path.join(ehelRoot, subject, cfg.dir(stage), "data");
  const manifestPath = path.join(dataDir, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const glossary = readGlossary(dataDir);
  const glossaryEntries = Object.entries((glossary && glossary.entries) || {})
    .filter(([, entry]) => entry && entry.definition);
  const glossaryWords = glossaryEntries.length;
  const glossaryWordList = glossaryEntries.map(([word]) => word);
  const units = [];
  for (const entry of [...manifest.units].sort((a, b) => a.number - b.number)) {
    if (cfg.minUnit != null && Number(entry.number) < cfg.minUnit) continue;
    const unitPath = path.join(dataDir, "units", `unit-${entry.number}.json`);
    if (!fs.existsSync(unitPath)) continue;
    const unit = JSON.parse(fs.readFileSync(unitPath, "utf8"));
    const meta = unit.unit || {};
    const title = meta.unitTitle || meta.title || entry.title;
    units.push({
      unit: Number(entry.number),
      title,
      keywords: keywords([title, ...outcomeTexts(unit)], 40),
      topics: extractTopics(subject, unit, {
        subject,
        games: readGamesPack(dataDir, entry.number),
        ebooks: subject === "english" ? ebooksFor(readEbookCatalog(ehelRoot), stage, entry.number) : [],
        // Counted, not passed whole: the topic needs to know the glossary is
        // non-empty, not to carry several thousand entries into every unit.
        glossaryWords: glossaryWords,
        glossaryWordList,
        // The glossary topic hangs off the grade's FIRST indexed unit. `units`
        // is empty only before the first is pushed, so this is true exactly once
        // per grade without a separate pass to find the lowest number.
        firstUnitOfGrade: units.length === 0,
      }).filter((t) => t.label && t.keywords.length),
    });
  }
  if (!units.length) return null;
  return {
    schemaVersion: SCHEMA_VERSION,
    subject,
    param: cfg.param,
    stageWord: cfg.stageWord,
    stage,
    stageLabel: `${cfg.stageWord} ${stage}`,
    units,
  };
}

// Serialised form — one stable shape so build and check compare bytes.
const serialise = (index) => JSON.stringify(index, null, 1) + "\n";

const indexPath = (ehelRoot, subject, stage) => path.join(ehelRoot, subject, SUBJECTS[subject].dir(stage), "data", "topic-index.json");

module.exports = { SCHEMA_VERSION, SUBJECTS, buildGradeIndex, serialise, indexPath, keywords };
