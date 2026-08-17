#!/usr/bin/env node
// Collapses two punctuation seams that a template left in the English course
// data (2026-08-17 review: 30 + 72 + a handful more):
//
//   "Correct option: I can hop.. Only this one…"   →  "…hop. Only…"
//   "built on the pattern “I can ___.”. Model…"    →  "…___.” Model…"
//   "…the full sentence: 'My name is...'."         →  "…is...'"
//
// Both came from appending ". " to an option or pattern that already carried
// its own full stop (sometimes inside a closing quote). No current tool emits
// them, so the data is repaired in place. Rules, applied to EVERY string value
// in the grade data files except the generated games packs (rebuilt from the
// units by build-ehel-english-games.js afterwards):
//
//   1. ".." that is not part of "..." → "."      (an ellipsis is left alone)
//   2. a stop, then a closing quote, then a stray "." before a space or end
//      of string → drop the stray "."  (quotes only — see STOP_AFTER_QUOTE)
//
// Idempotent. Usage: node tools/repair-ehel-english-double-stops.js [--dry] [grade …]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const grades = argv.filter((a) => /^[1-8]$/.test(a)).map(Number);
const wanted = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];

const DOUBLE_STOP = /(?<![.])\.\.(?![.])/g;
// Quotes only, never brackets: "(table, chair, pencil…)." is a sentence whose
// stop legitimately follows the bracket. And the inner stop must be a real
// one, not the tail of an ellipsis: in "Use 'in theory..., but in reality...'."
// the quote is a fragment and the outer stop is the sentence's own.
const STOP_AFTER_QUOTE = /(?<![.])([.!?]["”’']+)\.(?=\s|$)/g;

// Only prose: a relative path ("../assets/x.png") or an id has no spaces and
// must not be touched — the dry run showed "../" collapsing to "./".
const PROSE = /\s/;
const PATHLIKE = /^(\.{1,2}\/|https?:\/\/|[\w-]+\/)/;

function repair(text) {
  if (!PROSE.test(text) || PATHLIKE.test(text)) return text;
  return text.replace(DOUBLE_STOP, ".").replace(STOP_AFTER_QUOTE, "$1");
}

function walk(node, onString) {
  if (Array.isArray(node)) return node.map((item) => walk(item, onString));
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) node[key] = walk(node[key], onString);
    return node;
  }
  return typeof node === "string" ? onString(node) : node;
}

function* dataFiles(grade) {
  const dataDir = path.join(ENGLISH, `grade-${grade}`, "data");
  if (!fs.existsSync(dataDir)) return;
  for (const name of fs.readdirSync(dataDir)) {
    const full = path.join(dataDir, name);
    if (name === "games") continue; // generated — rebuilt from the units
    if (fs.statSync(full).isDirectory()) {
      for (const inner of fs.readdirSync(full)) if (inner.endsWith(".json")) yield path.join(full, inner);
    } else if (name.endsWith(".json")) {
      yield full;
    }
  }
}


// Some unit files store non-ASCII as \uXXXX escapes (Python json.dumps
// default); JSON.stringify would emit the literal characters and turn a
// 12-line edit into a 100-line diff. Match whatever the file already does.
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) {
    text = text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}

let files = 0, strings = 0;
const samples = [];
for (const grade of wanted) {
  for (const file of dataFiles(grade)) {
    const raw = fs.readFileSync(file, "utf8");
    let doc;
    try { doc = JSON.parse(raw); } catch { continue; }
    let touched = 0;
    walk(doc, (s) => {
      const next = repair(s);
      if (next !== s) {
        touched += 1;
        if (samples.length < 12) samples.push(`${path.relative(ENGLISH, file)}: ${JSON.stringify(s.slice(0, 90))} -> ${JSON.stringify(next.slice(0, 90))}`);
      }
      return next;
    });
    if (!touched) continue;
    files += 1; strings += touched;
    if (!DRY) {
      fs.writeFileSync(file, serialise(doc, raw), "utf8");
    }
  }
}
console.log(samples.join("\n"));
console.log(JSON.stringify({ dry: DRY, filesChanged: files, stringsChanged: strings }));
