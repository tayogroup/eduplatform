const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gradeDir = path.join(root, "src", "prototypes", "ehel-academy", "english", "grade-5");
const dataDir = path.join(gradeDir, "data");
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "course-manifest.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(dataDir, "master-dictionary.grade5.json"), "utf8"));
const finalAssessment = JSON.parse(fs.readFileSync(path.join(dataDir, "course-final-quiz.json"), "utf8"));
const source = JSON.parse(fs.readFileSync(path.join(root, "inputs", "ehel-grade5-source", "grade5-source-extracted.json"), "utf8"));
const uiSource = fs.readFileSync(path.join(gradeDir, "..", "shared", "course-ui.js"), "utf8");
const indexSource = fs.readFileSync(path.join(gradeDir, "index.html"), "utf8");
const ids = new Set(dictionary.entries.map((entry) => entry.dictionaryEntryId));
let vocabularyLinks = 0;
let readyDictionaryAudio = 0;
let pendingDictionaryAudio = 0;
let pendingLessonAudio = 0;

if (source.documentCount !== 36) throw new Error(`Expected 36 Grade 5 source documents; found ${source.documentCount}.`);
if (manifest.units.length !== 10 || manifest.units[0].number !== 1 || manifest.units[9].number !== 10) throw new Error("Grade 5 manifest must contain Units 1-9 and Unit 10 capstone.");
if (ids.size !== dictionary.entries.length || dictionary.entryCount !== dictionary.entries.length) throw new Error("Grade 5 dictionary IDs or count are invalid.");
if (/speechSynthesis|SpeechSynthesisUtterance/.test(uiSource)) throw new Error("Browser-generated voice remains in the Grade 5 UI.");
if (!indexSource.includes('data-grade="5"') || !indexSource.includes("../shared/grade-redirect.js")) throw new Error("Grade 5 shared UI redirect is missing.");

for (const summary of manifest.units) {
  const runtime = JSON.parse(fs.readFileSync(path.join(dataDir, "units", `unit-${summary.number}.json`), "utf8"));
  for (const [key, count] of Object.entries({ comprehension: 12, grammar: 6, speaking: 6, writing: 6, activities: 6, quizzes: 10, liveSessions: 6, selfAssessment: 6 })) {
    if (runtime[key]?.length !== count) throw new Error(`Unit ${summary.number} ${key}: expected ${count}, found ${runtime[key]?.length}.`);
  }
  const expectedReadingCount = summary.number === 10 ? 5 : null;
  if ((expectedReadingCount && runtime.readings.length !== expectedReadingCount) || (!expectedReadingCount && (runtime.readings.length < 4 || runtime.readings.length > 5)) || runtime.outcomes.length < 6) throw new Error(`Unit ${summary.number} reading or outcome coverage is incomplete.`);
  if (summary.number < 10 && (runtime.dictionaryLinks.length < 20 || runtime.dictionaryLinks.length > 40)) throw new Error(`Unit ${summary.number} vocabulary count is outside the Grade 5 profile.`);
  for (const link of runtime.dictionaryLinks) {
    if (!ids.has(link.dictionaryEntryId)) throw new Error(`Missing dictionary entry for ${link.vocabularyId}.`);
    if (link.practiceSentences.length !== 5 || link.sentenceAudio.length !== 5) throw new Error(`Vocabulary practice mismatch for ${link.vocabularyId}.`);
  }
  for (const quiz of runtime.quizzes) {
    const options = quiz.options.split(" | ");
    if (options.length !== 4 || new Set(options).size !== 4 || !options.includes(String(quiz.correctAnswer))) throw new Error(`Invalid quiz options for ${quiz.questionId}.`);
  }
  for (const item of [...runtime.readings, ...runtime.grammar, ...runtime.speaking]) {
    if (item.audio?.provider !== "ElevenLabs" || item.audio.voiceId !== "XfNU2rGpBa01ckF309OY") throw new Error(`Invalid lesson voice metadata in Unit ${summary.number}.`);
    if (!item.audio.available) pendingLessonAudio += 1;
  }
  const visual = path.resolve(gradeDir, runtime.visual.image);
  if (!fs.existsSync(visual) || fs.statSync(visual).size === 0) throw new Error(`Missing Unit ${summary.number} visual: ${visual}`);
  vocabularyLinks += runtime.dictionaryLinks.length;
}

for (const entry of dictionary.entries) {
  if (entry.audio.available === false) pendingDictionaryAudio += 1;
  else {
    const audio = path.resolve(gradeDir, entry.audio.normal);
    if (!fs.existsSync(audio) || fs.statSync(audio).size < 1000) throw new Error(`Missing reused dictionary audio for ${entry.displayWord}.`);
    readyDictionaryAudio += 1;
  }
}

if (finalAssessment.questionCount !== 30 || finalAssessment.questions.length !== 30 || finalAssessment.sections.length !== 3 || finalAssessment.passPercent !== 80) throw new Error("Grade 5 final quiz structure is invalid.");
for (const question of finalAssessment.questions) {
  const options = question.options.split(" | ");
  if (options.length !== 4 || new Set(options).size !== 4 || !options.includes(String(question.correctAnswer))) throw new Error(`Invalid final quiz options for ${question.questionId}.`);
  if (!question.sourceUnitNo || !question.sourceUnitId || !question.sourceUnitTitle || !question.curriculumArea || !question.reviewRoute) throw new Error(`Incomplete source mapping for ${question.questionId}.`);
  if (question.audio?.provider !== "ElevenLabs" || question.audio.voiceId !== "XfNU2rGpBa01ckF309OY") throw new Error(`Invalid final quiz voice metadata for ${question.questionId}.`);
}

const workbook = path.join(root, "outputs", "019f5d39-7fcd-7f23-a425-201fe8206eef", "Ehel-English-Content-Template-v1.2-Grade-5-All-Units-Reference.xlsx");
if (!fs.existsSync(workbook) || fs.statSync(workbook).size <= 10_000) throw new Error(`Missing or invalid Grade 5 workbook: ${workbook}`);

console.log(JSON.stringify({ status: "PASS", sourceDocuments: source.documentCount, units: manifest.units.length, dictionaryEntries: dictionary.entryCount, vocabularyLinks, readyDictionaryAudio, pendingDictionaryAudio, pendingLessonAudio, finalCourseQuiz: { questions: 30, sections: 3, passPercent: 80 }, workbook }, null, 2));


