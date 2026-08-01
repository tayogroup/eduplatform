// Replace the last Year 1 Mathematics concepts that could not be repaired
// mechanically, in place.
//
// Five concepts survived every automated pass still written about the learner
// rather than to them ("Show a small handful of stones… Praise sensible
// guesses", "Children often muddle them, so use them out loud"), and each also
// carried its explanation duplicated into its own `example` field. Their source
// is a parent guide with no learner-facing wording to recover, so they are
// written out here — following the same unit outcomes, the same maths and the
// same local examples as the guide.
//
//   node tools/author-ehel-math-grade1-concepts.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const unitsDir = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics", "grade-1", "data", "units");
const write = process.argv.includes("--write");

// unit number -> concept title -> { explanation, example }
const AUTHORED = {
  1: {
    "Estimating Then Counting": {
      explanation: "An estimate is a good guess about how many, made before you count. Good mathematicians estimate all the time, because a guess tells you roughly what answer to expect.\n\nHere is how to practise. Look at a small handful of stones for just a moment, then look away. Say about how many you think there were — 'about five', 'about ten'. Now count them one at a time, touching each stone, and see how close your guess was.\n\nA sensible guess is what matters, not a lucky one. If you guessed six and counted seven, that is an excellent estimate. Guessing first also makes your counting mean more, because you find out whether the number behaved the way you expected.",
      example: "Look at a small pile of dates for two seconds, then cover them. Say 'about five' or 'about ten'. Now uncover them and count one at a time to see how close you were.",
    },
  },
  5: {
    "Investigate: Is the +1 Rule Always True?": {
      explanation: "Sumi says that when you add 1 more, you always make the next counting number. Is Sumi correct?\n\nThis is a question you can test for yourself, and testing it is what mathematicians do. Put out 3 counters and add 1 more. Count them: 4. And 4 is the next counting number after 3. Now try again with 6: add 1 more and you get 7, the next counting number after 6. Try it with 9, and with 2.\n\nEvery time, adding 1 more lands you on the very next number. So Sumi is correct. Finding out that a rule works every single time — not just once — is a powerful thing in maths, because then you can trust it and use it to work faster.",
      example: "Put out 6 counters and add 1 more. Count again: 7. Now try 9 and 1 more: 10. Each time you land on the next counting number, so Sumi's rule holds.",
    },
  },
  7: {
    "What This Unit Is About: Sorting and Comparing": {
      explanation: "This unit is your first taste of statistics — the maths of organising information so you can understand it.\n\nAt this age that means three friendly ideas. The first is sorting: putting objects that are alike into the same group, which we call a set. You choose a rule for your sorting, such as colour or shape, and the rule decides which set each object belongs to.\n\nThe second idea is comparing your sets. Once things are sorted you can count each set and say which has more and which has fewer.\n\nThe third idea is the sorting circle, called a Venn diagram. Things that follow the rule go inside the circle, and things that do not go outside it. With two circles, anything that belongs to both sets sits in the middle where the circles overlap.",
      example: "Sort a pile of buttons into red buttons and buttons that are not red. Count each set. Say which set has more and which has fewer.",
    },
  },
  9: {
    "Estimating Then Counting": {
      explanation: "An estimate is a sensible guess about how many, made before you count. Now that you can count all the way to 20, your estimates can get better too.\n\nLook at a handful of stones or a plate of dates for just a moment, then look away. Ask yourself a helpful question: is it more than ten? Is it fewer than twenty? Then say your guess out loud — 'about fifteen'.\n\nNow count them one at a time to check. A close guess is a good guess, even when it is not exactly right. Estimating first is useful because it warns you when a count has gone wrong: if you guessed about fifteen and counted forty, you know to go back and count again more carefully.",
      example: "Look at a plate of dates for two seconds. Ask yourself: more than ten, or fewer? Say 'about twelve', then count them one by one to check.",
    },
  },
  15: {
    "Yesterday, Today and Tomorrow": {
      explanation: "These three words are how you talk about time moving from one day to the next.\n\nToday is the day you are in right now. Yesterday is the day that has already gone — it finished when you went to sleep. Tomorrow is the day still to come, the one that begins when you wake up again.\n\nThese words are easy to muddle at first, so the best way to learn them is to use them out loud, many times a day, about real things that happen to you. Say what you did yesterday, what you are doing today, and what you will do tomorrow.\n\nNotice that the words move along with you. The day you called tomorrow becomes today when you wake up, and then becomes yesterday the day after that.",
      example: "Say this out loud, filling in your own days: 'Today is Tuesday. Yesterday was Monday. Tomorrow will be Wednesday.' Then say one thing you did yesterday and one thing you will do tomorrow.",
    },
  },
};

const applied = [];
const missing = [];
let filesChanged = 0;

for (const [unitNo, byTitle] of Object.entries(AUTHORED)) {
  const filePath = path.join(unitsDir, `unit-${unitNo}.json`);
  if (!fs.existsSync(filePath)) { missing.push(`unit-${unitNo}.json not found`); continue; }
  const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = 0;
  for (const [title, content] of Object.entries(byTitle)) {
    const concept = (unit.concepts || []).find((c) => c.title === title);
    if (!concept) { missing.push(`unit-${unitNo}.json: no concept titled "${title}"`); continue; }
    applied.push(`unit-${unitNo}.json "${title}": ${String(concept.explanation).length} -> ${content.explanation.length} chars`);
    concept.explanation = content.explanation;
    concept.example = content.example;
    changed += 1;
  }
  if (changed) {
    filesChanged += 1;
    if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  }
}

console.log(`${write ? "AUTHORED" : "DRY RUN"} — ${applied.length} concept(s) across ${filesChanged} file(s)`);
for (const line of applied) console.log(`   ${line}`);
if (missing.length) {
  console.log("\nnot applied:");
  for (const line of missing) console.log(`   ${line}`);
}
if (!write) console.log("\nRe-run with --write to apply.");
