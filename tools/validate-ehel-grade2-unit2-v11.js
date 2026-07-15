const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const unitDir = path.join(root, "src", "prototypes", "ehel-academy", "english", "grade-2", "unit-2");
const course = JSON.parse(fs.readFileSync(path.join(unitDir, "data", "grade2-unit2.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(unitDir, "data", "master-dictionary.unit2.json"), "utf8"));
const source = fs.readFileSync(path.join(unitDir, "unit.js"), "utf8");
const requiredCounts = { grammar: 6, speaking: 6, writing: 6, activities: 6, quizzes: 10, liveSessions: 6 };
const voiceId = "XfNU2rGpBa01ckF309OY";

for (const [key, expected] of Object.entries(requiredCounts)) {
  if (course[key]?.length !== expected) throw new Error(`${key}: expected ${expected}, found ${course[key]?.length}`);
}

if (course.templateVersion !== "Ehel English Content Template v1.1") throw new Error("Runtime is not linked to Template v1.1.");
if (/speechSynthesis|SpeechSynthesisUtterance/.test(source)) throw new Error("Browser-generated voice remains in the Unit 2 runtime.");

const voiced = [...course.readings, ...course.grammar, ...course.speaking];
for (const item of voiced) {
  if (item.audio?.provider !== "ElevenLabs" || item.audio?.voiceId !== voiceId) throw new Error(`Invalid audio provider or voice: ${item.title}`);
  const audioPath = path.join(unitDir, item.audio.source.replace(/^\.\//, ""));
  if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size < 1000) throw new Error(`Missing audio file: ${audioPath}`);
}

for (const entry of dictionary.entries) {
  if (entry.audio?.provider !== "ElevenLabs" || entry.audio?.voiceId !== voiceId) throw new Error(`Invalid dictionary voice: ${entry.displayWord}`);
  if (!Number.isFinite(entry.audio.cueStart) || !Number.isFinite(entry.audio.cueEnd)) throw new Error(`Missing word cue: ${entry.displayWord}`);
}

for (const link of course.dictionaryLinks) {
  if (link.sentenceAudio.length !== link.practiceSentences.length) throw new Error(`Sentence audio mismatch: ${link.vocabularyId}`);
  if (link.sentenceAudio.some((audio) => audio.provider !== "ElevenLabs" || audio.voiceId !== voiceId)) throw new Error(`Invalid sentence voice: ${link.vocabularyId}`);
}

const answerIds = new Set(course.answerKey.map((answer) => answer.contentId));
const requiredAnswerIds = [
  ...course.grammar.filter((item) => /grammar0[3456]$/.test(item.grammarId)).map((item) => item.grammarId),
  ...course.speaking.slice(3).map((item) => item.speakingId),
  ...course.writing.slice(3).map((item) => item.writingId),
  ...course.activities.slice(4).map((item) => item.activityId),
  ...course.quizzes.slice(5).map((item) => item.questionId),
];
for (const id of requiredAnswerIds) {
  if (!answerIds.has(id)) throw new Error(`Missing v1.1 answer guidance: ${id}`);
}

const workbook = path.join(root, "outputs", "019f5d39-7fcd-7f23-a425-201fe8206eef", "Ehel-English-Content-Template-v1.1-Grade-2-Units-1-2-Reference.xlsx");
if (!fs.existsSync(workbook) || fs.statSync(workbook).size < 10000) throw new Error("Units 1-2 Template v1.1 workbook is missing.");

console.log(JSON.stringify({
  status: "PASS",
  templateVersion: course.templateVersion,
  counts: requiredCounts,
  elevenLabsClips: voiced.length,
  dictionaryEntries: dictionary.entryCount,
  sentenceClips: course.dictionaryLinks.reduce((total, link) => total + link.sentenceAudio.length, 0),
  answerKeyEntries: course.answerKey.length,
  voiceId,
}, null, 2));
