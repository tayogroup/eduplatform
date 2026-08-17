#!/usr/bin/env node
// Names the four Grade 6 units' placeholder reading titles ("Life in the
// Wild: source text 1") from what the passages actually contain, and repoints
// the cloze quizzes that quote the old titles. Also fixes three Unit 6 cloze
// lines that quoted an earlier draft of the reading ("Dr Sami … he", "Adam")
// where the shipped text has Doctor Sarah / she / Tariq.
//
// The titles are drawn on the reading page, in every cloze quiz stem, and are
// spoken by the lecture ("The reading sequence includes X and Y") — the
// lecture generator now refuses to render a unit while a placeholder remains,
// which is what this clears. Titles are not narrated on their own.
//
// Idempotent. Usage: node tools/repair-ehel-english-grade6-reading-titles.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

const TITLES = {
  3: ["East Africa's Web of Life", "Who Eats Whom: Food Chains of the Savannah"],
  6: ["The People Who Keep a Community Running", "Four Professions, One Town"],
  8: ["Introducing Entertainment and Media", "Screens, Stories, and the Art of Telling Tales"],
  9: ["Introducing Amazing Arts", "The Mural Makers of Mogadishu"],
};
const UNIT6_CLOZE = [
  ["Dr Sami always says", "Doctor Sarah always says"],
  ["Now he treats patients, reads test results, and gives careful _____ reports to his team.", "Now she treats patients, reads test results, and gives careful _____ reports to her team."],
  ["Now he treats patients, reads test results, and gives careful observation reports to his team.", "Now she treats patients, reads test results, and gives careful observation reports to her team."],
  ["Adam also writes", "Tariq also writes"],
];

function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}

let changed = 0;
const failures = [];
for (const [unitNo, titles] of Object.entries(TITLES)) {
  const file = path.join(ENGLISH, "grade-6", "data", "units", `unit-${unitNo}.json`);
  const raw = fs.readFileSync(file, "utf8");
  const unit = JSON.parse(raw);
  const oldTitles = [0, 1].map((i) => unit.readings[i].title);
  let n = 0;
  oldTitles.forEach((old, i) => {
    if (!/source text \d$/.test(old)) { if (unit.readings[i].title !== titles[i]) failures.push(`unit-${unitNo} readings[${i}] is "${old}", not a placeholder`); return; }
    unit.readings[i].title = titles[i]; n += 1;
    const walk = (o) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === "object") for (const k of Object.keys(o)) {
        if (typeof o[k] === "string" && o[k].includes(old)) { o[k] = o[k].split(old).join(titles[i]); n += 1; }
        else walk(o[k]);
      }
    };
    walk(unit);
  });
  if (unitNo === "6") {
    for (const q of unit.quizzes) for (const key of ["question", "explanation"]) {
      for (const [from, to] of UNIT6_CLOZE) if (String(q[key]).includes(from)) { q[key] = q[key].split(from).join(to); n += 1; }
    }
  }
  const left = JSON.stringify(unit).match(/source text \d/g);
  if (left) failures.push(`unit-${unitNo} still contains ${left.length} "source text" reference(s)`);
  if (n) { changed += n; console.log(`unit-${unitNo}: ${n} field(s) updated`); if (!DRY) fs.writeFileSync(file, serialise(unit, raw), "utf8"); }
}
console.log(JSON.stringify({ dry: DRY, fieldsChanged: changed, failures: failures.length }));
for (const f of failures) console.error("✘ " + f);
if (failures.length) process.exit(1);
