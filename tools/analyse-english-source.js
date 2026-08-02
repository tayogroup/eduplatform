#!/usr/bin/env node
// Summarise every Grade 1-8 English unit into one analysis file, so a course
// built by compressing them is planned from what the material actually teaches
// rather than from unit titles alone.
//
//   node tools/analyse-english-source.js
//
// Output: inputs/ehel-english-intensive-source/grade-1-8-analysis.json
//         plus a readable digest on stdout.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const OUT_DIR = path.join(ROOT, "inputs", "ehel-english-intensive-source");
const OUT = path.join(OUT_DIR, "grade-1-8-analysis.json");

const grades = [];
let totalUnits = 0;
let totalWords = 0;

for (let grade = 1; grade <= 8; grade += 1) {
  const dataDir = path.join(ENGLISH, `grade-${grade}`, "data");
  const manifestPath = path.join(dataDir, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const units = manifest.units.map((entry) => {
    const unitPath = path.join(dataDir, "units", `unit-${entry.number}.json`);
    if (!fs.existsSync(unitPath)) return { number: entry.number, title: entry.title, missing: true };
    const unit = JSON.parse(fs.readFileSync(unitPath, "utf8"));
    totalUnits += 1;
    totalWords += unit.dictionaryLinks?.length || 0;
    return {
      number: entry.number,
      unitId: unit.unit.unitId,
      title: unit.unit.unitTitle,
      termId: unit.term?.id || entry.termId || "",
      overview: unit.unit.unitOverview,
      wordCount: unit.dictionaryLinks?.length || 0,
      // The vocabulary GROUPS are the topic spine — a compressed unit has to
      // decide which of these survive as their own group and which merge.
      vocabularyGroups: (unit.vocabularyGroups || []).map((group) => ({
        title: group.title,
        size: group.vocabularyIds?.length || 0,
      })),
      // The grammar titles are the real progression. Two units that teach the
      // same pattern are the first candidates to merge.
      grammar: (unit.grammar || []).map((lesson) => lesson.title),
      grammarConcepts: (unit.grammar || []).map((lesson) => lesson.conceptId),
      outcomes: (unit.outcomes || []).map((outcome) => outcome.learningOutcome),
      cambridgeObjectives: [...new Set((unit.outcomes || []).flatMap((outcome) => outcome.cambridgeObjectives || []))],
      readings: (unit.readings || []).map((reading) => ({ title: reading.title, type: reading.type, words: String(reading.passageScript || "").trim().split(/\s+/).filter(Boolean).length })),
      counts: {
        readings: unit.readings?.length || 0,
        comprehension: unit.comprehension?.length || 0,
        grammar: unit.grammar?.length || 0,
        speaking: unit.speaking?.length || 0,
        writing: unit.writing?.length || 0,
        activities: unit.activities?.length || 0,
        quizzes: unit.quizzes?.length || 0,
        liveSessions: unit.liveSessions?.length || 0,
      },
    };
  });

  grades.push({
    grade,
    cambridge: units.find((unit) => !unit.missing)?.cambridgeObjectives?.length
      ? (grade <= 6 ? "Cambridge Primary English 0058" : "Cambridge Lower Secondary English 0861")
      : "",
    unitCount: units.length,
    wordCount: units.reduce((sum, unit) => sum + (unit.wordCount || 0), 0),
    units,
  });
}

// --- where the same pattern is taught more than once -------------------------
// This is the evidence for compression: a concept that appears in six grades is
// spiral repetition a child needs and an adult does not.
const grammarIndex = new Map();
for (const grade of grades) {
  for (const unit of grade.units) {
    for (const title of unit.grammar || []) {
      // Normalise: strip the "Unit N" style qualifiers and lowercase.
      const key = title.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
      if (!grammarIndex.has(key)) grammarIndex.set(key, []);
      grammarIndex.get(key).push({ grade: grade.grade, unit: unit.number, title });
    }
  }
}
const repeatedGrammar = [...grammarIndex.entries()]
  .filter(([, uses]) => new Set(uses.map((use) => use.grade)).size > 1)
  .map(([key, uses]) => ({ pattern: key, gradesTaught: [...new Set(uses.map((use) => use.grade))], uses }))
  .sort((a, b) => b.gradesTaught.length - a.gradesTaught.length);

const analysis = {
  schemaVersion: "Ehel English Grade 1-8 Source Analysis v1.0",
  generatedAt: new Date().toISOString().slice(0, 10),
  purpose: "Input to the two-level intensive English course for Somali-speaking adults.",
  totals: { grades: grades.length, units: totalUnits, vocabularyItems: totalWords },
  repeatedGrammar,
  grades,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(analysis, null, 1), "utf8");

console.log(`grades=${grades.length} units=${totalUnits} vocabulary=${totalWords}`);
for (const grade of grades) {
  const grammarCount = grade.units.reduce((sum, unit) => sum + (unit.grammar?.length || 0), 0);
  console.log(`  Grade ${grade.grade}: ${grade.unitCount} units, ${grade.wordCount} words, ${grammarCount} grammar lessons`);
}
console.log(`\npatterns taught in more than one grade: ${repeatedGrammar.length}`);
repeatedGrammar.slice(0, 12).forEach((item) => console.log(`  ${item.gradesTaught.length} grades  ${item.pattern.slice(0, 60)}  (${item.gradesTaught.join(", ")})`));
console.log(`\nwritten ${path.relative(ROOT, OUT)}`);
