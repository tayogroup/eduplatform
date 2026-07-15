const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gradeDir = path.join(root, "src", "prototypes", "ehel-academy", "english", "grade-1");
const dataDir = path.join(gradeDir, "data");
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "course-manifest.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(dataDir, "master-dictionary.grade1.json"), "utf8"));
const finalAssessment = JSON.parse(fs.readFileSync(path.join(dataDir, "course-final-quiz.json"), "utf8"));
const uiSource = fs.readFileSync(path.join(gradeDir, "..", "shared", "course-ui.js"), "utf8");
const indexSource = fs.readFileSync(path.join(gradeDir, "index.html"), "utf8");
const masterIds = new Set(dictionary.entries.map((entry) => entry.dictionaryEntryId));
let vocabularyLinks = 0;
let readyDictionaryAudio = 0;
let pendingDictionaryAudio = 0;
let pendingLessonAudio = 0;

if (manifest.units.length !== 11) throw new Error(`Expected Pre-Unit 0, Units 1-9 and Unit 10 capstone; found ${manifest.units.length} modules.`);
if (manifest.units[0].number !== 0 || manifest.units[10].number !== 10) throw new Error("Grade 1 module order is invalid.");
if (masterIds.size !== dictionary.entries.length || dictionary.entryCount !== dictionary.entries.length) throw new Error("Grade 1 dictionary IDs or entry count are invalid.");
if (/speechSynthesis|SpeechSynthesisUtterance/.test(uiSource)) throw new Error("Browser-generated publishing voice remains in the Grade 1 UI.");
if (!uiSource.includes("master-dictionary.grade${gradeNumber}.json") || !indexSource.includes('data-grade="1"') || !indexSource.includes("../shared/grade-redirect.js")) throw new Error("Grade 1 is not connected to the shared English UI.");

for (const module of manifest.units) {
  const runtime = JSON.parse(fs.readFileSync(path.join(dataDir, "units", `unit-${module.number}.json`), "utf8"));
  const expectedLive = module.number === 0 ? 30 : 6;
  for (const [key, count] of Object.entries({ grammar: 6, speaking: 6, writing: 6, activities: 6, quizzes: 10, liveSessions: expectedLive })) {
    if (runtime[key]?.length !== count) throw new Error(`Module ${module.number} ${key}: expected ${count}, found ${runtime[key]?.length}.`);
  }
  if (runtime.comprehension.length !== 12) throw new Error(`Module ${module.number} must have 12 comprehension prompts.`);
  for (const link of runtime.dictionaryLinks) {
    if (!masterIds.has(link.dictionaryEntryId)) throw new Error(`Missing Grade 1 dictionary entry for ${link.vocabularyId}.`);
    if (link.practiceSentences.length !== 5 || link.sentenceAudio.length !== 5) throw new Error(`Vocabulary practice mismatch for ${link.vocabularyId}.`);
  }
  for (const question of runtime.quizzes) {
    const options = question.options.split(" | ");
    if (options.length !== 4 || !options.includes(String(question.correctAnswer))) throw new Error(`Invalid quiz options in ${question.questionId}.`);
  }
  for (const item of [...runtime.readings, ...runtime.grammar, ...runtime.speaking]) {
    if (item.audio?.provider !== "ElevenLabs" || item.audio.voiceId !== "XfNU2rGpBa01ckF309OY") throw new Error(`Invalid lesson voice metadata for ${item.readingId || item.grammarId || item.speakingId}.`);
    if (!item.audio.available) pendingLessonAudio += 1;
  }
  const visual = path.resolve(gradeDir, runtime.visual.image);
  if (!fs.existsSync(visual) || fs.statSync(visual).size === 0) throw new Error(`Missing Module ${module.number} visual: ${visual}`);
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

if (finalAssessment.questionCount !== 30 || finalAssessment.questions.length !== 30 || finalAssessment.sections.length !== 3) throw new Error("Grade 1 final course quiz structure is invalid.");
if (finalAssessment.passPercent !== 80 || finalAssessment.totalMarks !== 30) throw new Error("Grade 1 final quiz scoring rules are invalid.");
for (const question of finalAssessment.questions) {
  const options = question.options.split(" | ");
  if (options.length !== 4 || !options.includes(String(question.correctAnswer))) throw new Error(`Invalid final quiz options for ${question.questionId}.`);
  if (question.audio?.provider !== "ElevenLabs" || question.audio.voiceId !== "XfNU2rGpBa01ckF309OY") throw new Error(`Invalid final quiz voice metadata for ${question.questionId}.`);
}

const workbook = path.join(root, "outputs", "019f5d39-7fcd-7f23-a425-201fe8206eef", "Ehel-English-Content-Template-v1.1-Grade-1-All-Units-Reference.xlsx");
if (!fs.existsSync(workbook)) throw new Error(`Missing released workbook: ${workbook}`);
if (fs.statSync(workbook).size <= 10_000) throw new Error(`Released workbook is unexpectedly small: ${workbook}`);
console.log(JSON.stringify({ status: "PASS", modules: manifest.units.length, dictionaryEntries: dictionary.entryCount, vocabularyLinks, readyDictionaryAudio, pendingDictionaryAudio, pendingLessonAudio, finalCourseQuiz: { questions: 30, sections: 3, passPercent: 80 }, workbook }, null, 2));
