const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "src", "prototypes", "ehel-academy", "english");
const issues = [];

function add(type, grade, unit, game, round, detail) {
  issues.push({ type, grade, unit, game, round, detail });
}

for (let grade = 1; grade <= 8; grade += 1) {
  const gamesRoot = path.join(root, `grade-${grade}`, "data", "games");
  for (const filename of fs.readdirSync(gamesRoot).filter((name) => name.endsWith(".json"))) {
    const pack = JSON.parse(fs.readFileSync(path.join(gamesRoot, filename), "utf8"));
    for (const game of pack.games) {
      game.rounds.forEach((round, index) => {
        const roundNumber = index + 1;
        const values = [round.prompt, round.answer, round.target, ...(round.choices || [])].filter(Boolean);
        values.forEach((value) => {
          const text = String(value);
          if (text.includes("Review choice")) add("fallback-choice", grade, pack.unit, game.id, roundNumber, text);
          if (text.length > 170) add("long-text", grade, pack.unit, game.id, roundNumber, text.length);
        });
        if (round.choices && new Set(round.choices).size !== round.choices.length) {
          add("duplicate-choice", grade, pack.unit, game.id, roundNumber, round.choices);
        }
        if (game.type === "speaking" && /^(record|write|choose|work|practise|practice|ask your|take turns|use the|prepare|create|read the)/i.test(round.target || "")) {
          add("instruction-as-speaking-target", grade, pack.unit, game.id, roundNumber, round.target);
        }
      });
    }
  }
}

const byType = issues.reduce((counts, issue) => {
  counts[issue.type] = (counts[issue.type] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  status: issues.length ? "REVIEW" : "PASS",
  issueCount: issues.length,
  byType,
  examples: issues.slice(0, 40),
}, null, 2));

process.exitCode = issues.length ? 1 : 0;
