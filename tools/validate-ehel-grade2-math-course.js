const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "grade-2", "data");
const runtimePath = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "shared", "course-ui.js");
const stylePath = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "shared", "course-ui.css");
const geometryWebGLPath = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "shared", "geometry-webgl.js");
const sharedStylePath = path.join(root, "src", "prototypes", "ehel-academy", "english", "shared", "course-ui.css");
const sharedShellPath = path.join(root, "src", "prototypes", "ehel-academy", "shared", "course-shell.js");
const indexPath = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "index.html");
const manifest = JSON.parse(fs.readFileSync(path.join(dataRoot, "course-manifest.json"), "utf8"));
const runtime = fs.readFileSync(runtimePath, "utf8");
const styles = fs.readFileSync(stylePath, "utf8");
const geometryWebGL = fs.readFileSync(geometryWebGLPath, "utf8");
const sharedStyles = fs.readFileSync(sharedStylePath, "utf8");
const sharedShell = fs.readFileSync(sharedShellPath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");
const errors = [];

if (manifest.units.length !== 15) errors.push(`Expected 15 units; found ${manifest.units.length}.`);
if (!runtime.includes("unit-${unitNumber}.json")) errors.push("Runtime does not load the selected unit dynamically.");
if (runtime.includes("Only the Grade 2 Unit 1")) errors.push("Legacy Unit 1 lock remains in the runtime.");
if (!runtime.includes("activeGamePack()")) errors.push("Runtime does not select unit-specific games.");
if (!runtime.includes("renderGradeCapstone") || !runtime.includes("renderCapstoneQuiz")) errors.push("Runtime does not expose both stage capstone sections.");
if (!runtime.includes('params.get("stage")') || !runtime.includes("Stage 2") || !index.includes('id="stage-select"')) errors.push("Mathematics learner UI does not use Cambridge Stage terminology.");
if (!runtime.includes("collectPageNarration") || !runtime.includes("/api/elevenlabs-tts")) errors.push("Runtime does not provide complete-page ElevenLabs narration.");
if (!runtime.includes('<break time="0.65s" />') || !runtime.includes("split(/\\n+/)")) errors.push("Complete-page narration does not preserve line pauses.");
if (!runtime.includes("paceNumberSequences") || !runtime.includes('<break time="0.40s" />')) errors.push("Mathematics narration does not pace sequential numbers.");
if (!runtime.includes("containsNumberSequence") || !runtime.includes("isCounting ? 0.78 : 0.90") || !runtime.includes('purpose: "ehel_math"')) errors.push("Mathematics narration does not isolate counting at the slower fixed cadence.");
if (!runtime.includes("geometryConceptVisual") || !runtime.includes("initGeometryWebGL") || !runtime.includes('course.unit.unitNo === 2') || !runtime.includes('course.unit.unitNo === 11') || !runtime.includes('course.unit.unitNo === 15') || !styles.includes(".geometry-webgl") || !geometryWebGL.includes('getContext("webgl"') || !geometryWebGL.includes("requestAnimationFrame")) errors.push("Geometry concept cards do not provide interactive WebGL examples for all three geometry units.");
if (runtime.includes("speechSynthesis") || runtime.includes("SpeechSynthesisUtterance")) errors.push("Browser speech synthesis remains in the Mathematics runtime.");
if (!runtime.includes("../../shared/course-shell.js") || !sharedShell.includes('class="button secondary page-voice"') || !sharedShell.includes("sectionNavigation")) errors.push("Mathematics does not use the shared English course shell.");
if (!sharedStyles.includes("font-size: 13px; line-height: 1.25;") || !index.includes('class="teacher-switch"')) errors.push("Mathematics sidebar does not match the shared UI structure and typography.");

const capstonePath = path.join(dataRoot, "grade-capstone.json");
if (!fs.existsSync(capstonePath)) {
  errors.push("Stage 2 capstone package is missing.");
} else {
  const capstone = JSON.parse(fs.readFileSync(capstonePath, "utf8"));
  if (capstone.stage?.label !== "Stage 2") errors.push("Capstone package does not identify Cambridge Stage 2.");
  if (capstone.project?.stages?.length !== 6) errors.push("Stage Capstone must contain six project stages.");
  if (capstone.project?.evidenceChecklist?.length < 7) errors.push("Stage Capstone must contain at least seven evidence checks.");
  if (capstone.project?.rubric?.length !== 4) errors.push("Stage Capstone must contain four rubric criteria.");
  if (capstone.quiz?.questions?.length !== 30) errors.push("Capstone Quiz must contain 30 questions.");
  const representedUnits = new Set(capstone.quiz?.questions?.map((question) => question.unitNo));
  if (representedUnits.size !== 15) errors.push("Capstone Quiz must represent all 15 units.");
  for (const question of capstone.quiz?.questions || []) {
    if (question.options?.length !== 4 || !question.options.includes(question.answer)) errors.push(`Capstone question ${question.id} has invalid options.`);
  }
}

for (let unitNo = 1; unitNo <= 15; unitNo += 1) {
  const unitPath = path.join(dataRoot, "units", `unit-${unitNo}.json`);
  if (!fs.existsSync(unitPath)) { errors.push(`Unit ${unitNo} package is missing.`); continue; }
  const unit = JSON.parse(fs.readFileSync(unitPath, "utf8"));
  const minimums = { outcomes: 6, concepts: 6, explorations: 6, visualModels: 6, methods: 6, workedExamples: 12, practice: 12, activities: 6, fluency: 12, realProblems: 6, reasoningPrompts: 6, selfAssessment: 6 };
  if (unit.stage?.label !== "Stage 2") errors.push(`Unit ${unitNo} does not identify Cambridge Stage 2.`);
  if (unit.unit.unitNo !== unitNo) errors.push(`Unit ${unitNo} reports unitNo ${unit.unit.unitNo}.`);
  for (const [field, minimum] of Object.entries(minimums)) {
    if (!Array.isArray(unit[field]) || unit[field].length < minimum) errors.push(`Unit ${unitNo} ${field} must contain at least ${minimum} items.`);
  }
  if (unit.assessment?.questions?.length !== 12) errors.push(`Unit ${unitNo} must contain 12 assessment questions.`);
  for (const question of unit.assessment?.questions || []) {
    if (question.options.length !== 4) errors.push(`Unit ${unitNo} ${question.id} must contain four options.`);
    if (!question.options.includes(question.answer)) errors.push(`Unit ${unitNo} ${question.id} answer is absent from its options.`);
  }
  const games = unit.games?.games || (unitNo === 1 ? Array.from({ length: 12 }) : []);
  if (games.length !== 12) errors.push(`Unit ${unitNo} must expose 12 games.`);
  for (const game of unit.games?.games || []) {
    if (game.rounds.length !== 4) errors.push(`Unit ${unitNo} game ${game.id} must contain four rounds.`);
    for (const round of game.rounds) {
      if (!round.choices?.includes(round.answer)) errors.push(`Unit ${unitNo} game ${game.id} has a round whose answer is absent from its choices.`);
    }
  }
  if (unit.provenance?.sourceDocuments?.length !== 4) errors.push(`Unit ${unitNo} must cite four source documents.`);
}

if (errors.length) {
  console.error(`Stage 2 Mathematics course validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Stage 2 Mathematics course validation passed: 15 units, 180 games, 180 unit assessment questions, a six-part Stage Capstone, and a 30-question Capstone Quiz.");
