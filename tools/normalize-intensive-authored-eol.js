#!/usr/bin/env node
// One-off repair: several proofreading edits to
// inputs/ehel-english-intensive-source/authored/*.json were saved with CRLF
// line endings instead of this repo's LF, which makes every line in the file
// show as changed in git even though only one field's value actually moved.
// Normalizes \r\n -> \n in place. Idempotent: a clean file is left untouched.
const fs = require("fs");
const path = require("path");

const DIR = path.resolve(__dirname, "..", "inputs", "ehel-english-intensive-source", "authored");

let touched = 0;
for (const file of fs.readdirSync(DIR)) {
  if (!file.endsWith(".json")) continue;
  const full = path.join(DIR, file);
  const buf = fs.readFileSync(full);
  const text = buf.toString("utf8");
  if (!text.includes("\r\n")) continue;
  fs.writeFileSync(full, text.replace(/\r\n/g, "\n"));
  touched += 1;
  console.log(`normalized: ${file}`);
}
console.log(`${touched} file(s) normalized.`);
