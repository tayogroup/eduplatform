// Grade 2 Unit 1's game pack is the only hand-authored one, and the builder
// deliberately preserves it: `source` is not the generated marker, so
// build-ehel-english-games.js walks past it. That is right — its twelve games
// are bespoke (Calendar Race, Colour and Number Dash, Pronoun Power, Welcome
// Mission) and written to this unit's own story, and regenerating it would
// delete authored content to make a number match.
//
// But the number does have to match. Owner, 2026-09-01: six questions per game.
// Every other pack in Grades 1-4 was regenerated at six, and this is the FIRST
// unit a Grade 2 learner opens — so leaving it at three makes the one unit they
// meet first the odd one out. Hence this: three more rounds per game, authored
// in each game's own shape and voice, appended rather than regenerated.
//
// Every added round is grounded in the unit's OWN material — its dictionary
// links and their child meanings, its comprehension answers, its calendar and
// pronoun teaching. Nothing here asserts a story fact the unit does not state:
// the Reading Detective rounds quote answers straight out of
// data/units/unit-1.json's comprehension, because a comprehension game that
// invents evidence is worse than one with three rounds.
//
// Idempotent: it asserts the pack is the one it was written for, refuses to run
// twice (a game already at six is left alone), and reports what it changed.
//   node tools/extend-grade2-unit1-game-rounds.js          # report only
//   node tools/extend-grade2-unit1-game-rounds.js --write
const fs = require("fs");
const path = require("path");

const FILE = path.resolve(__dirname, "..", "src", "prototypes", "ehel-academy",
  "english", "grade-2", "data", "games", "unit-1.json");
const WRITE = process.argv.includes("--write");
const KNOWN = new Set(["--write"]);
// An unrecognised argument is refused rather than ignored: the default action
// here rewrites authored content, and a typo silently falling through to it is
// the shape this repo keeps paying for.
for (const arg of process.argv.slice(2)) {
  if (!KNOWN.has(arg)) { console.error(`unknown argument: ${arg}`); process.exit(2); }
}

// Three per game, in the same order the pack declares them.
const ADDITIONS = {
  "picture-match": [
    { prompt: "Which word means a group of seven days?", choices: ["week", "month", "year"], answer: "week", explanation: "A week is a group of seven days that follow one after another." },
    { prompt: "Which word means one of the twelve parts of a year?", choices: ["afternoon", "month", "week"], answer: "month", explanation: "A month is one of the twelve parts of a year." },
    { prompt: "Which word means the part of the day between midday and evening?", choices: ["moment", "weather", "afternoon"], answer: "afternoon", explanation: "The afternoon is the part of the day between midday and evening." },
  ],
  "spelling-builder": [
    { prompt: "Build the time word.", clue: "A group of seven days that follow one after another.", answer: "week" },
    { prompt: "Build the family word.", clue: "The sister of your mother or father.", answer: "aunt" },
    { prompt: "Build the outdoor word.", clue: "What it is like outside, such as sunny, rainy or windy.", answer: "weather" },
  ],
  "sentence-puzzle": [
    { prompt: "Say when your birthday is.", tokens: ["June.", "in", "is", "birthday", "My"], answer: "My birthday is in June." },
    { prompt: "Tell the class about Nora.", tokens: ["partner.", "new", "my", "is", "Nora"], answer: "Nora is my new partner." },
    { prompt: "Say what your class does each week.", tokens: ["week.", "every", "book", "a", "read", "We"], answer: "We read a book every week." },
  ],
  "grammar-sort": [
    { prompt: "Nora and Leo ___ in the same class.", choices: ["are", "is", "am"], answer: "are", explanation: "Use are when you are talking about more than one person." },
    { prompt: "This is my aunt. ___ visits us every month.", choices: ["He", "She", "It"], answer: "She", explanation: "Use she when talking about one girl or woman." },
    { prompt: "Amal ___ her book on the desk.", choices: ["put", "putting", "puts"], answer: "puts", explanation: "Use puts with he, she or one named person." },
  ],
  // Straight from the unit's comprehension answers. Nothing invented.
  "reading-detective": [
    { prompt: "How does Amal spell her name for Teacher Yasmin?", choices: ["A-M-A-L", "A-M-E-L", "A-M-A-R"], answer: "A-M-A-L", explanation: "Amal says the letters A-M-A-L." },
    { prompt: "Who is Maya's partner, and what does that partner like?", choices: ["Nora, and she likes trees.", "Leo, and he likes football.", "Teacher Yasmin, and she likes books."], answer: "Nora, and she likes trees.", explanation: "Maya's partner is Nora, and Nora likes trees." },
    { prompt: "Which day is the first day of the school week in this story?", choices: ["Monday", "Saturday", "Sunday"], answer: "Saturday", explanation: "The story says Saturday is the first day of the school week." },
  ],
  "speaking-challenge": [
    { prompt: "Say hello to your teacher.", target: "Good morning, Teacher Yasmin." },
    { prompt: "Introduce a friend to the class.", target: "This is my friend Nora." },
    { prompt: "Say two things you like.", target: "I like drawing and reading." },
  ],
  "calendar-race": [
    { prompt: "Put these end-of-week days in order.", tokens: ["Sunday", "Friday", "Saturday"], answer: "Friday Saturday Sunday" },
    { prompt: "Put these middle-year months in order.", tokens: ["June", "April", "May"], answer: "April May June" },
    { prompt: "Put these end-of-year months in order.", tokens: ["December", "October", "November"], answer: "October November December" },
  ],
  "colour-number-dash": [
    { prompt: "Which word names the colour of a ripe banana?", choices: ["yellow", "black", "white"], answer: "yellow", explanation: "A ripe banana is yellow." },
    // Kept inside the counting this unit teaches, which ends at twelve.
    { prompt: "Which number comes after nine?", choices: ["twelve", "eight", "ten"], answer: "ten", explanation: "The counting order goes nine, ten, eleven, twelve." },
    { prompt: "Which word names the colour of fresh milk?", choices: ["brown", "white", "green"], answer: "white", explanation: "Fresh milk is white." },
  ],
  "pronoun-power": [
    { prompt: "This is my desk. ___ is next to the window.", choices: ["She", "It", "He"], answer: "It", explanation: "Use it for a thing, not for a person." },
    { prompt: "These are my friends. ___ like football.", choices: ["They", "She", "He"], answer: "They", explanation: "Use they when you are talking about more than one person." },
    { prompt: "This is my father. ___ helps me read.", choices: ["It", "She", "He"], answer: "He", explanation: "Use he when talking about one boy or man." },
  ],
  "memory-pairs": [
    { prompt: "Match the time words.", pairs: [["week", "seven days one after another"], ["month", "one of the twelve parts of a year"], ["year", "twelve months, from January to December"]] },
    { prompt: "Match the room words.", pairs: [["window", "an opening that lets light in"], ["desk", "a table you sit at to read and write"], ["room", "a space inside a house"]] },
    { prompt: "Match the family words.", pairs: [["mother", "a woman who has a child"], ["father", "a man who has a child"], ["aunt", "the sister of your mother or father"]] },
  ],
  "question-quest": [
    { prompt: "Ask someone's age.", tokens: ["you?", "are", "old", "How"], answer: "How old are you?" },
    { prompt: "Ask about a birthday.", tokens: ["birthday?", "your", "is", "When"], answer: "When is your birthday?" },
    { prompt: "Ask about today.", tokens: ["today?", "it", "is", "day", "What"], answer: "What day is it today?" },
  ],
  "welcome-mission": [
    { prompt: "Your new partner cannot find a pencil. What should you say?", choices: ["You can use mine.", "Find your own.", "Stop talking."], answer: "You can use mine.", explanation: "Sharing a pencil helps a new partner feel welcome." },
    { prompt: "A friend says, 'My birthday is in May.' What is a kind reply?", choices: ["I do not care.", "Happy birthday for May!", "May is wrong."], answer: "Happy birthday for May!", explanation: "A warm reply keeps the conversation friendly." },
    { prompt: "It is the end of the school day. What do you say to your partner?", choices: ["Give me that.", "Nothing at all.", "Goodbye. See you tomorrow."], answer: "Goodbye. See you tomorrow.", explanation: "Goodbye is what we say when we leave." },
  ],
};

const TARGET_ROUNDS = 6;
const TARGET_MASTERY = 4;

const pack = JSON.parse(fs.readFileSync(FILE, "utf8"));
if (pack.grade !== 2 || pack.unit !== 1) {
  console.error(`refusing: ${FILE} is grade ${pack.grade} unit ${pack.unit}, not grade 2 unit 1`);
  process.exit(2);
}
const ids = pack.games.map((game) => game.id);
const missing = Object.keys(ADDITIONS).filter((id) => !ids.includes(id));
const unhandled = ids.filter((id) => !ADDITIONS[id]);
if (missing.length || unhandled.length) {
  // The rounds below are written FOR these twelve games. If the pack's games
  // have changed, appending by id would put a pronoun round in whatever game
  // now holds that id.
  console.error(`refusing: pack games no longer match. missing=${missing.join(",") || "none"} unhandled=${unhandled.join(",") || "none"}`);
  process.exit(2);
}

const changes = [];
for (const game of pack.games) {
  if (game.rounds.length >= TARGET_ROUNDS) { changes.push(`${game.id}: already ${game.rounds.length} rounds, left alone`); continue; }
  if (game.rounds.length !== 3) { console.error(`refusing: ${game.id} has ${game.rounds.length} rounds, expected 3`); process.exit(2); }
  const added = ADDITIONS[game.id];
  // A prompt that already exists would give the learner the same round twice.
  const existing = new Set(game.rounds.map((round) => round.prompt));
  const clash = added.filter((round) => existing.has(round.prompt));
  if (clash.length) { console.error(`refusing: ${game.id} would repeat prompt(s): ${clash.map((r) => r.prompt).join(" | ")}`); process.exit(2); }
  game.rounds.push(...added);
  changes.push(`${game.id}: 3 -> ${game.rounds.length} rounds`);
}
if (pack.masteryScore !== TARGET_MASTERY) {
  changes.push(`masteryScore: ${pack.masteryScore} -> ${TARGET_MASTERY}`);
  pack.masteryScore = TARGET_MASTERY;
}

console.log(changes.join("\n"));
if (!WRITE) { console.log("\n(report only — pass --write to apply)"); process.exit(0); }
fs.writeFileSync(FILE, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
console.log(`\nwritten: ${FILE}`);
