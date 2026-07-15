#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const courseRoot = path.join(root, 'src', 'prototypes', 'ehel-academy', 'mathematics');
const manifestPath = path.join(courseRoot, 'grade-2', 'data', 'course-manifest.json');
const unitPath = path.join(courseRoot, 'grade-2', 'data', 'units', 'unit-1.json');
const runtimePath = path.join(courseRoot, 'shared', 'course-ui.js');

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

check(fs.existsSync(path.join(courseRoot, 'index.html')), 'Mathematics course index is missing.');
check(fs.existsSync(path.join(courseRoot, 'shared', 'course-ui.js')), 'Mathematics course runtime is missing.');
check(fs.existsSync(path.join(courseRoot, 'shared', 'course-ui.css')), 'Mathematics course stylesheet is missing.');
check(fs.existsSync(manifestPath), 'Grade 2 manifest is missing.');
check(fs.existsSync(unitPath), 'Grade 2 Unit 1 runtime data is missing.');

if (!failures.length) {
  const manifest = readJson(manifestPath);
  const unit = readJson(unitPath);
  check(manifest.subject === 'Mathematics', 'Manifest subject must be Mathematics.');
  check(manifest.units.length === 15, 'Manifest must represent all 15 Grade 2 workbook units.');
  check(manifest.units[0].implementationStatus === 'Reference implementation', 'Unit 1 must be identified as the reference implementation.');
  check(manifest.units.slice(1).every((item) => item.implementationStatus === 'Workbook ready' && !item.data), 'Units 2–15 must remain workbook-only and must not expose runtime data paths.');
  check(/review required/i.test(manifest.packageReviewStatus), 'Manifest must expose the curriculum review gate.');
  check(unit.unit.unitId === 'math-g02-u01', 'Unit runtime ID is incorrect.');
  check(/review required/i.test(unit.unit.reviewStatus), 'Unit must not claim curriculum approval.');
  check(unit.media.lectureStatus === 'Video pending' && unit.media.lectureVideo === null, 'Missing lecture media must remain explicitly pending.');
  check(unit.provenance.sourceDocuments.length === 4, 'Unit provenance must name all four source documents.');
  check(unit.provenance.sourceBlockCount === 355, 'Unit provenance must retain the 355 imported source-block count.');
  check(unit.outcomes.length === 8, 'Unit 1 must expose eight source outcomes.');
  check(unit.concepts.length === 6, 'Unit 1 must expose six structured concepts.');
  check(unit.workedExamples.length === 8, 'Unit 1 must expose eight worked examples.');
  check(unit.practice.length === 12, 'Unit 1 must expose twelve practice items.');
  check(unit.activities.length === 6, 'Unit 1 must expose six activities.');
  check(unit.assessment.questions.length === 10, 'Unit 1 checkpoint must contain ten items.');
  check(unit.assessment.questions.every((item) => item.options.includes(item.answer)), 'Every checkpoint answer must be present in its options.');
  check(new Set(unit.practice.map((item) => item.id)).size === unit.practice.length, 'Practice IDs must be unique.');
  check(new Set(unit.assessment.questions.map((item) => item.id)).size === unit.assessment.questions.length, 'Checkpoint IDs must be unique.');
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const requiredSteps = ['Unit Overview', 'Teacher Lesson', 'AI Math Tutor', 'Math Words & Symbols', 'Explore the Concept', 'Visual Models', 'Learn the Method', 'Worked Examples', 'Guided Practice', 'Practice & Games', 'Math Fluency', 'Solve Real Problems', 'Explain Your Thinking', 'Unit Challenge', 'Live Math Class', 'My Math Progress', 'Teacher Resources'];
  let previousIndex = -1;
  requiredSteps.forEach((step) => {
    const index = runtime.indexOf(`\"${step}\"`);
    check(index > previousIndex, `Sidebar step is missing or out of order: ${step}.`);
    previousIndex = index;
  });
}

if (failures.length) {
  console.error(`Grade 2 Mathematics reference validation failed (${failures.length}):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Grade 2 Mathematics reference validation passed.');
console.log('15 manifest units; Unit 1 active; 17 ordered learning steps; 8 outcomes; 6 concepts; 8 worked examples; 12 practices; 6 activities; 10 challenge items.');
