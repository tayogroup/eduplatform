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

function topicsEnglish(unit) {
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
  return out;
}

function extractTopics(subject, unit) {
  if (subject === "global-perspectives") return topicsGlobalPerspectives(unit);
  if (subject === "english" || subject === "intensive-english") return topicsEnglish(unit);
  return topicsFamilyA(unit, subject);
}

function outcomeTexts(unit) {
  return (unit.outcomes || []).map((o) => (typeof o === "string" ? o : o?.text || o?.learningOutcome || "")).filter(Boolean);
}

// --- index assembly ----------------------------------------------------------

function buildGradeIndex(ehelRoot, subject, stage) {
  const cfg = SUBJECTS[subject];
  const dataDir = path.join(ehelRoot, subject, cfg.dir(stage), "data");
  const manifestPath = path.join(dataDir, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
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
      topics: extractTopics(subject, unit).filter((t) => t.label && t.keywords.length),
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
