const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gradeDir = path.join(root, "src", "prototypes", "ehel-academy", "english", "grade-2");
const dataDir = path.join(gradeDir, "data");
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "course-manifest.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(dataDir, "master-dictionary.grade2.json"), "utf8"));
const finalAssessment = JSON.parse(fs.readFileSync(path.join(dataDir, "course-final-quiz.json"), "utf8"));
const source = fs.readFileSync(path.join(gradeDir, "..", "shared", "course-ui.js"), "utf8");
const minimums = { grammar: 6, speaking: 6, writing: 6, activities: 6, quizzes: 10, liveSessions: 6 };
const masterIds = new Set(dictionary.entries.map((entry) => entry.dictionaryEntryId));
let pendingAudio = 0;
let readyAudio = 0;
let vocabularyLinks = 0;

if (manifest.units.length !== 10) throw new Error(`Expected 10 units including the capstone; found ${manifest.units.length}.`);
if (manifest.finalAssessment?.id !== finalAssessment.assessmentId) throw new Error("Final assessment manifest link is missing or invalid.");
if (finalAssessment.questionCount !== 30 || finalAssessment.questions.length !== 30) throw new Error("Expected 30 final course quiz questions.");
if (finalAssessment.totalMarks !== 30 || finalAssessment.passPercent !== 80) throw new Error("Final course quiz scoring rules are invalid.");
if (finalAssessment.sections.length !== 3 || finalAssessment.sections.some((section) => section.questionCount !== 10)) throw new Error("Final course quiz must contain three ten-question sections.");
if (new Set(finalAssessment.questions.map((question) => question.questionId)).size !== finalAssessment.questions.length) throw new Error("Duplicate final course quiz question IDs found.");
for (const question of finalAssessment.questions) {
  const options = question.options.split(" | ");
  if (options.length !== 4 || !options.includes(question.correctAnswer)) throw new Error(`Invalid options for ${question.questionId}.`);
  if (!manifest.units.some((unit) => unit.number === question.sourceUnitNo && unit.id === question.sourceUnitId)) throw new Error(`Invalid source Unit mapping for ${question.questionId}.`);
  if (!/^\?unit=\d+#/.test(question.reviewRoute)) throw new Error(`Invalid review route for ${question.questionId}.`);
  if (question.audio?.provider !== "ElevenLabs" || question.audio?.voiceId !== "XfNU2rGpBa01ckF309OY") throw new Error(`Invalid final quiz voice metadata for ${question.questionId}.`);
}
if (masterIds.size !== dictionary.entries.length) throw new Error("Duplicate master dictionary IDs found.");
if (/speechSynthesis|SpeechSynthesisUtterance/.test(source)) throw new Error("Browser-generated publishing voice remains in the shared UI.");

for (const unit of manifest.units) {
  const runtime = JSON.parse(fs.readFileSync(path.join(dataDir, "units", `unit-${unit.number}.json`), "utf8"));
  if (runtime.unit.unitNo !== unit.number) throw new Error(`Manifest mismatch for Unit ${unit.number}.`);
  for (const [key, count] of Object.entries(minimums)) {
    if (runtime[key]?.length !== count) throw new Error(`Unit ${unit.number} ${key}: expected ${count}, found ${runtime[key]?.length}.`);
  }
  for (const link of runtime.dictionaryLinks) {
    if (!masterIds.has(link.dictionaryEntryId)) throw new Error(`Missing master entry for ${link.vocabularyId}.`);
    if (link.sentenceAudio.length !== link.practiceSentences.length) throw new Error(`Sentence cue mismatch for ${link.vocabularyId}.`);
  }
  vocabularyLinks += runtime.dictionaryLinks.length;
  for (const item of [...runtime.readings, ...runtime.grammar, ...runtime.speaking]) {
    if (item.audio?.provider !== "ElevenLabs" || item.audio?.voiceId !== "XfNU2rGpBa01ckF309OY") throw new Error(`Invalid voice metadata for ${item.title}.`);
    if (item.audio.available) readyAudio += 1;
    else pendingAudio += 1;
  }
  for (const asset of [runtime.visual.image, runtime.visual.lectureVideo, runtime.visual.lecturePoster, runtime.visual.lectureCaptions].filter(Boolean)) {
    const absolute = path.resolve(gradeDir, asset);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).size === 0) throw new Error(`Missing Unit ${unit.number} visual or lecture asset: ${absolute}`);
  }
}

for (const entry of dictionary.entries) {
  if (!Number.isFinite(entry.audio.cueStart) || !Number.isFinite(entry.audio.cueEnd)) throw new Error(`Missing dictionary cue: ${entry.displayWord}`);
  const absolute = path.resolve(gradeDir, entry.audio.normal);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).size < 1000) throw new Error(`Missing dictionary audio: ${entry.displayWord}`);
}

for (const unitNo of [1, 2]) {
  const legacy = fs.readFileSync(path.join(gradeDir, `unit-${unitNo}`, "index.html"), "utf8");
  if (!legacy.includes(`?unit=${unitNo}`)) throw new Error(`Unit ${unitNo} compatibility route is missing.`);
}

const workbook = path.join(root, "outputs", "019f5d39-7fcd-7f23-a425-201fe8206eef", "Ehel-English-Content-Template-v1.1-Grade-2-All-Units-Reference.xlsx");
if (!fs.existsSync(workbook) || fs.statSync(workbook).size < 10000) throw new Error("All-unit v1.1 workbook is missing.");

console.log(JSON.stringify({
  status: "PASS",
  units: manifest.units.length,
  masterDictionaryEntries: dictionary.entryCount,
  vocabularyLinks,
  countsPerUnit: minimums,
  readyElevenLabsLessonClips: readyAudio,
  pendingElevenLabsLessonClips: pendingAudio,
  finalCourseQuiz: {
    questions: finalAssessment.questionCount,
    sections: finalAssessment.sections.length,
    totalMarks: finalAssessment.totalMarks,
    passPercent: finalAssessment.passPercent,
    pendingElevenLabsQuestionClips: finalAssessment.questions.filter((question) => !question.audio.available).length,
  },
  workbook,
}, null, 2));
