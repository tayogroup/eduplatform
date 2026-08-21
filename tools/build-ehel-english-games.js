const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const englishRoot = path.join(root, "src", "prototypes", "ehel-academy", "english");

function clean(value, limit = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit);
  return `${clipped.slice(0, clipped.lastIndexOf(" "))}...`;
}

// "an adjective", "an adverb", "an expression" — the 2026-08-17 review found
// "is used as a adjective" in 40 of the 81 game files.
function article(word) {
  return /^[aeiou]/i.test(String(word || "").trim()) ? "an" : "a";
}

// A choice the learner must pick has to be complete: an answer clipped to
// "…put them in the toy..." cannot be recognised as correct. Reading Detective
// therefore only admits comprehension items whose answer fits whole; the
// generator used to clip 167 of them across 28 units. 180 characters admits
// every unit's minimum of three (measured 2026-08-17); anything longer is left
// out rather than cut.
const READING_CHOICE_MAX = 180;
function fitsWhole(value, limit) {
  return String(value || "").replace(/\s+/g, " ").trim().length <= limit;
}

function sample(items, count, offset = 0) {
  if (!items.length) return [];
  const output = [];
  for (let index = 0; index < count; index += 1) {
    output.push(items[(offset + Math.floor(index * items.length / count)) % items.length]);
  }
  return output;
}

function rotate(items, amount) {
  const shift = amount % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

function choices(correct, distractors, roundIndex, fallbackPool = []) {
  const unique = [correct, ...distractors, ...fallbackPool]
    .filter((item, index, list) => item && list.indexOf(item) === index)
    .slice(0, 3);
  return rotate(unique, roundIndex % unique.length);
}

function quizRound(question) {
  const options = String(question.options || "").split(" | ").map((item) => clean(item, 150)).filter(Boolean);
  return {
    // Cloze stems quote a story line and can run past 180 characters; a prompt
    // clipped before its blank cannot be answered, so allow the whole question.
    prompt: clean(question.question, 400),
    choices: options,
    answer: clean(question.correctAnswer, 150),
    explanation: clean(question.explanation || `The correct answer is ${question.correctAnswer}.`, 220),
  };
}

function quizRounds(unit, start) {
  return Array.from({ length: 3 }, (_, index) => quizRound(unit.quizzes[(start + index) % unit.quizzes.length]));
}

function sentenceCandidates(unit, vocabulary) {
  // Upper-grade units carry longer sentences, so a hard 11-word cap starves the
  // word-order game and forces the padding path. Widen the window and fall back
  // to the first practice sentence when the example sentence is too long.
  const pool = [
    ...vocabulary.map((item) => item.link.exampleSentence),
    ...vocabulary.map((item) => (item.link.practiceSentences || [])[0]),
    ...unit.quizzes.map((item) => item.explanation),
  ];
  const candidates = pool.map((item) => clean(item, 150)).filter((item) => {
    const words = item.split(/\s+/);
    return words.length >= 3 && words.length <= 14 && /[.!?]$/.test(item);
  });
  const unique = [...new Set(candidates)];
  // Distinct padding so the sequence game never gets duplicate rounds — one line
  // per unused vocabulary word, then an indexed generic as a last resort.
  const words = vocabulary.map((item) => item.entry.displayWord);
  let w = 0, n = 1;
  while (unique.length < 6) {
    const next = w < words.length
      ? `The word ${words[w++]} is on our Unit ${unit.unit.unitNo} list.`
      : `Review sentence ${n++} for ${clean(unit.unit.unitTitle, 50)}.`;
    if (!unique.includes(next)) unique.push(next);
  }
  return unique;
}

function sentenceRound(sentence, prompt) {
  const answer = clean(sentence, 150);
  const tokens = answer.split(/\s+/);
  return { prompt, tokens: [...tokens].reverse(), answer };
}

function speakingTarget(task, fallback) {
  const source = clean(task.instructionsAndModelLines, 260).replace(/[“”]/g, "\"");
  // A quoted model line is the target ("Say: \"My name is Amal.\"").
  const quoted = [...source.matchAll(/["“]([^"”\n]{4,150})["”]/g)]
    .map((match) => clean(match[1], 145))
    .find((candidate) => candidate.split(/\s+/).length >= 4 && /[.!?]$/.test(candidate));
  if (quoted) return quoted;
  // No quote: fall back to the first WHOLE sentence of the instruction. The
  // leading verb used to be stripped here too, which turned "Say the /a/ sound
  // five times." into "the /a/ sound five times." and "Ask and answer about…"
  // into "and answer about…" — a target that starts lowercase with no verb.
  const firstSentence = source.match(/^(.{4,145}?[.!?])(?:\s|$)/);
  // A target the learner must SAY has to be a whole sentence: if the first
  // sentence does not fit in 145 characters, use the fallback rather than a
  // fragment ending "…" (the second pass found "…three comparatives and one...").
  const candidate = firstSentence ? clean(firstSentence[1], 145) : "";
  if (!candidate || /^(choose|create|discuss|find|in small|if you|look|plan|prepare|read|record|retell|select|take|use|work|write)/i.test(candidate)) {
    return clean(fallback, 145);
  }
  return candidate;
}

function buildPack(grade, unit, dictionary) {
  const entries = new Map(dictionary.entries.map((entry) => [entry.dictionaryEntryId, entry]));
  const vocabulary = unit.dictionaryLinks.map((link) => ({ link, entry: entries.get(link.dictionaryEntryId) })).filter((item) => item.entry);
  const selected = sample(vocabulary, 12);
  const shortWords = vocabulary.filter((item) => /^[A-Za-z]{3,11}$/.test(item.entry.displayWord));
  const spellingWords = sample(shortWords.length >= 3 ? shortWords : vocabulary, 3, 1);
  const sentences = sentenceCandidates(unit, vocabulary);
  const sentenceSet = sample(sentences, 6);
  const parts = ["Noun", "Verb", "Adjective", "Adverb", "Expression"];
  const comprehension = unit.comprehension.filter((item) => (
    item.question
    && item.question.length <= 165
    && /\?\s*$/.test(item.question)
    && item.correctAnswer
    && !/answers will vary|depends on|accept an answer/i.test(item.correctAnswer)
    && fitsWhole(item.correctAnswer, READING_CHOICE_MAX)
  ));
  // Distractors drawn from the same pool must be whole for the same reason —
  // and a fragment beside a complete answer also gives the answer away.
  const answerPool = [
    ...comprehension.map((item) => clean(item.correctAnswer, READING_CHOICE_MAX)),
    ...unit.quizzes.map((item) => item.correctAnswer).filter((text) => fitsWhole(text, READING_CHOICE_MAX)).map((text) => clean(text, READING_CHOICE_MAX)),
    ...vocabulary.map((item) => item.link.childMeaning || item.entry.canonicalMeaning).filter((text) => fitsWhole(text, READING_CHOICE_MAX)).map((text) => clean(text, READING_CHOICE_MAX)),
  ];
  const readingRounds = comprehension.length >= 3
    ? sample(comprehension, 3).map((item, index) => {
      const distractors = sample(comprehension.filter((other) => other.questionId !== item.questionId), 2, index + 1).map((other) => clean(other.correctAnswer, READING_CHOICE_MAX));
      const answer = clean(item.correctAnswer, READING_CHOICE_MAX);
      // The comprehension item's own explanation is now written to the learner
      // (second pass, 2026-08-17); use it, and fall back to quoting the answer.
      const explanation = fitsWhole(item.explanation, 240) && !/^(The learner|Award|Accept)/.test(String(item.explanation)) ? clean(item.explanation, 240) : `The text says: ${answer}`;
      return { prompt: clean(item.question, 400), choices: choices(answer, distractors, index, answerPool), answer, explanation };
    })
    : quizRounds(unit, 2);
  const pairsVocabulary = sample(vocabulary, 9, 2);

  return {
    schemaVersion: "Ehel English Games v1.0",
    grade,
    unit: unit.unit.unitNo,
    unitId: unit.unit.unitId,
    title: `${unit.unit.unitTitle} Game Zone`,
    source: "Generated from approved unit runtime and linked master dictionary",
    masteryScore: 2,
    games: [
      {
        id: "meaning-match", type: "choice", icon: "images", title: "Meaning Match", skill: "Vocabulary",
        description: "Match each unit word to its approved child-friendly meaning.",
        rounds: sample(selected, 3).map((item, index) => ({
          prompt: `Which word means: ${clean(item.link.childMeaning || item.entry.canonicalMeaning, 120)}`,
          choices: choices(item.entry.displayWord, selected.filter((other) => other !== item).map((other) => other.entry.displayWord), index),
          answer: item.entry.displayWord,
          explanation: `${item.entry.displayWord}: ${clean(item.link.childMeaning || item.entry.canonicalMeaning, 150)}`,
        })),
      },
      {
        id: "spelling-builder", type: "spelling", icon: "blocks", title: "Spelling Builder", skill: "Spelling",
        description: "Choose letter tiles to build important unit words.",
        rounds: spellingWords.map((item) => ({ prompt: "Build the word that matches the clue.", clue: clean(item.link.childMeaning || item.entry.canonicalMeaning, 130), answer: item.entry.displayWord.toLowerCase().replace(/[^a-z]/g, "") })),
      },
      {
        id: "sentence-puzzle", type: "sentence", icon: "puzzle", title: "Sentence Puzzle", skill: "Sentence building",
        description: "Put unit words into the correct sentence order.",
        rounds: sentenceSet.slice(0, 3).map((sentence) => sentenceRound(sentence, "Build the complete model sentence.")),
      },
      {
        id: "language-choice", type: "choice", icon: "list-filter", title: "Language Choice", skill: "Grammar and usage",
        description: "Choose the form that makes the unit language accurate.", rounds: quizRounds(unit, 6),
      },
      {
        id: "reading-detective", type: "choice", icon: "scan-search", title: "Reading Detective", skill: "Comprehension",
        description: "Use unit evidence to solve each reading clue.", rounds: readingRounds,
      },
      {
        id: "speaking-quest", type: "speaking", icon: "mic-2", title: "Speaking Quest", skill: "Pronunciation",
        description: "Listen, record, review and submit useful unit language.",
        rounds: sample(unit.speaking, 3).map((task, index) => ({ prompt: clean(task.title, 120), target: speakingTarget(task, sentenceSet[index]) })),
      },
      {
        id: "word-order-race", type: "sequence", icon: "calendar-days", title: "Word Order Race", skill: "Fluency and order",
        description: "Arrange unit language in a clear, accurate order.",
        rounds: sentenceSet.slice(3, 6).map((sentence) => sentenceRound(sentence, "Put this unit sentence in order.")),
      },
      {
        id: "definition-dash", type: "choice", icon: "palette", title: "Definition Dash", skill: "Meaning in context",
        description: "Choose the approved meaning before moving to the next clue.",
        rounds: sample(selected, 3, 5).map((item, index) => {
          const answer = clean(item.link.childMeaning || item.entry.canonicalMeaning, 130);
          return {
            prompt: `What does '${item.entry.displayWord}' mean in this unit?`,
            choices: choices(answer, selected.filter((other) => other !== item).map((other) => clean(other.link.childMeaning || other.entry.canonicalMeaning, 130)), index, answerPool),
            answer,
            explanation: `${item.entry.displayWord}: ${answer}`,
          };
        }),
      },
      {
        id: "word-type-power", type: "choice", icon: "users-round", title: "Word Type Power", skill: "Parts of speech",
        description: "Identify how each vocabulary word works in English.",
        rounds: sample(selected, 3, 7).map((item, index) => {
          const answer = item.entry.partOfSpeech.charAt(0).toUpperCase() + item.entry.partOfSpeech.slice(1);
          return { prompt: `What type of word is '${item.entry.displayWord}'?`, choices: choices(answer, parts, index), answer, explanation: `${item.entry.displayWord.charAt(0).toUpperCase()}${item.entry.displayWord.slice(1)} is used as ${article(item.entry.partOfSpeech)} ${item.entry.partOfSpeech} in this dictionary sense.` };
        }),
      },
      {
        id: "memory-pairs", type: "pairs", icon: "copy-check", title: "Memory Pairs", skill: "Vocabulary recall",
        description: "Reveal tiles and connect each word with its meaning.",
        rounds: [0, 1, 2].map((round) => ({ prompt: `Match vocabulary set ${round + 1}.`, pairs: pairsVocabulary.slice(round * 3, round * 3 + 3).map((item) => [item.entry.displayWord, clean(item.link.childMeaning || item.entry.canonicalMeaning, 200)]) })),
      },
      {
        id: "question-quest", type: "choice", icon: "circle-help", title: "Question Quest", skill: "Question answering",
        description: "Read each unit question carefully and choose the best answer.", rounds: quizRounds(unit, 3),
      },
      {
        id: "unit-mission", type: "choice", icon: "hand-heart", title: "Unit Mission", skill: "Mixed review",
        description: "Finish with a mixed challenge across the whole unit.", rounds: quizRounds(unit, 0),
      },
    ],
  };
}

// Optional grade filter so a single grade can be regenerated after a content
// fix without churning the rest: node tools/build-ehel-english-games.js 1 2
const onlyGrades = process.argv.slice(2).map(Number).filter((n) => n >= 1 && n <= 8);

let created = 0;
let preserved = 0;
let skipped = 0;
for (let grade = 1; grade <= 8; grade += 1) {
  if (onlyGrades.length && !onlyGrades.includes(grade)) { skipped += 1; continue; }
  const gradeRoot = path.join(englishRoot, `grade-${grade}`);
  const dataRoot = path.join(gradeRoot, "data");
  const manifest = JSON.parse(fs.readFileSync(path.join(dataRoot, "course-manifest.json"), "utf8"));
  const dictionary = JSON.parse(fs.readFileSync(path.join(dataRoot, `master-dictionary.grade${grade}.json`), "utf8"));
  const gamesRoot = path.join(dataRoot, "games");
  fs.mkdirSync(gamesRoot, { recursive: true });
  for (const summary of manifest.units) {
    const output = path.join(gamesRoot, `unit-${summary.number}.json`);
    if (fs.existsSync(output)) {
      const existing = JSON.parse(fs.readFileSync(output, "utf8"));
      if (existing.source !== "Generated from approved unit runtime and linked master dictionary") {
        preserved += 1;
        continue;
      }
    }
    const unit = JSON.parse(fs.readFileSync(path.join(dataRoot, "units", `unit-${summary.number}.json`), "utf8"));
    fs.writeFileSync(output, `${JSON.stringify(buildPack(grade, unit, dictionary), null, 2)}\n`, "utf8");
    created += 1;
  }
}

console.log(JSON.stringify({
  status: "PASS",
  grades: onlyGrades.length ? onlyGrades : "all",
  created, preserved, gradesSkipped: skipped, total: created + preserved,
}, null, 2));
