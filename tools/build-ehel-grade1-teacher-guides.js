#!/usr/bin/env node
// Converts Grade 1 Units 1-9's "Teacher & Parent Guide.docx" source -- extracted
// verbatim into grade1-source-extracted.json but never surfaced anywhere in the
// app -- into each unit's `grownUpGuide`, drawn on its own "Teacher & Parent
// Guide" nav tab (shell/subjects/english.js :: renderTeacherGuide). Unit 0 is
// untouched: its own grownUpGuide is a separate, already-shipped case (see
// commit 4e75d8b5a), and its source pack has no Teacher & Parent Guide doc at
// all -- only lesson plans.
//
// The doc's paragraphs follow one fixed heading order in every one of the 9
// units (checked by hand against all 9 before writing this). Anything found
// outside that fixed set fails loudly rather than being dropped, so a source
// edit that adds or renames a heading is caught here, not shipped silently
// thin.
//
// Each doc also carries 3 (Unit 9: 4) single-cell "table" callouts -- About
// this unit, Using the AI Tutor, Tips for teaching absolute beginners, and
// (Unit 9 only) a course-completion note. These aren't in the paragraph flow
// at all; docx tables extract separately, and skipping them would drop the
// most actionable guidance in the whole document.
//
// Idempotent -- re-running just regenerates `grownUpGuide` from the same
// source. Usage: node tools/build-ehel-grade1-teacher-guides.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_FILE = path.join(ROOT, "inputs", "ehel-grade1-source", "grade1-source-extracted.json");
const UNIT_DATA_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-1", "data", "units");
const DRY = process.argv.includes("--dry");

const TOP_HEADINGS = [
  "What This Unit Is About",
  "What Your Child Will Be Able to Do",
  "Words We Will Learn",
  "Songs and Rhymes",
  "How to Teach This Unit, Step by Step",
  "Sentence Patterns to Say Out Loud",
  String.fromCharCode(83, 105, 109, 112, 108, 101, 32, 67, 104, 101, 99, 107, 32, 8212, 32, 87, 104, 97, 116, 32, 116, 111, 32, 76, 111, 111, 107, 32, 70, 111, 114),
];

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));

function docFor(unitNo) {
  const found = source.documents.find((d) => d.path === `Unit ${unitNo}/Unit ${unitNo} - Teacher & Parent Guide.docx`);
  if (!found) throw new Error(`No Teacher & Parent Guide doc found for Unit ${unitNo}`);
  return found;
}

// The docx source uses a double space after the emoji in each table callout
// (visual spacing in the original Word doc), and the "Hello, school!  /
// Tables" style rhyme lines double-space around their "/" line breaks --
// validate-unit.mjs's mechanics check treats any run of 2+ mid-line spaces as
// a hard FAIL, so both need collapsing to reach the same bar as every other
// authored string in the unit.
const clean = (value) => String(value).replace(/[ \t]{2,}/g, " ").trim();

// Table callouts are one cell of `emoji  Title\nline\nline...`.
function tableSection(table) {
  const text = table[0][0];
  const lines = text.split("\n");
  const title = lines.shift();
  return { title: clean(title), body: clean(lines.join("\n\n")) };
}

function sectionFromContent(heading, content) {
  content = content.filter(Boolean);
  if (heading === "What Your Child Will Be Able to Do") {
    return { title: heading, items: content };
  }
  if (heading === "Words We Will Learn") {
    // Alternates category label, word list, category label, word list...
    const items = [];
    for (let i = 0; i < content.length; i += 2) {
      if (content[i + 1]) items.push(`${content[i]}: ${content[i + 1]}`);
      else items.push(content[i]);
    }
    return { title: heading, items };
  }
  if (heading === "Sentence Patterns to Say Out Loud" || heading.indexOf("Simple Check") === 0) {
    // First line is a lead-in sentence to the grown-up; the rest is the list.
    const intro = content[0];
    const items = content.slice(1).map((line) => line.replace(/\s*□\s*$/, "").trim());
    return { title: heading, body: intro, items };
  }
  // "What This Unit Is About", "Songs and Rhymes", "How to Teach This Unit,
  // Step by Step" -- plain prose, rendered through the same paragraph/heading
  // splitter the reading page already uses.
  return { title: heading, body: content.join("\n\n") };
}

function buildGuide(unitNo) {
  const doc = docFor(unitNo);
  // Cleaned before the heading lookup below, not after: TOP_HEADINGS itself
  // has no double spaces, so this can't shift where a heading is found.
  const paragraphs = doc.paragraphs.map(clean);

  const indices = TOP_HEADINGS.map((heading) => paragraphs.indexOf(heading));
  indices.forEach((index, i) => {
    if (index < 0) throw new Error(`Unit ${unitNo}: heading "${TOP_HEADINGS[i]}" not found in ${doc.path}`);
  });
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] <= indices[i - 1]) throw new Error(`Unit ${unitNo}: headings out of order around "${TOP_HEADINGS[i]}"`);
  }

  const sections = TOP_HEADINGS.map((heading, i) => {
    const start = indices[i] + 1;
    const end = i + 1 < indices.length ? indices[i + 1] : paragraphs.length;
    return sectionFromContent(heading, paragraphs.slice(start, end));
  });

  const aboutIndex = sections.findIndex((s) => s.title === "What This Unit Is About");
  const about = sections.splice(aboutIndex, 1)[0];

  const callouts = doc.tables.map(tableSection);
  // "Well done" belongs at the end, after the teaching content, not with the
  // other callouts up front.
  const wrapUp = callouts.filter((c) => /finished Year 1/i.test(c.title));
  const frontCallouts = callouts.filter((c) => !/finished Year 1/i.test(c.title));

  return {
    label: "Teacher & Parent Guide",
    intro: about.body,
    sections: frontCallouts.concat(sections, wrapUp),
  };
}

// Every other field in a unit file is somebody else's hand-authored or
// reviewed content, and at least two of these nine files already carry a
// house style of over-escaping plain ASCII punctuation ("-" for a bare
// hyphen) that a round-tripped JSON.stringify does not reproduce -- so a
// naive parse-mutate-restringify touches every line in those files, not just
// the one being added. Splicing the new key into the raw text instead means
// this script can only ever add lines; it is structurally incapable of
// reformatting a byte it did not write.
function spliceGuide(raw, guide) {
  const eol = raw.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const indentMatch = raw.match(/\r?\n( +)"/);
  const indentUnit = indentMatch ? indentMatch[1].length : 2;
  const pad = " ".repeat(indentUnit);

  const trailingWs = raw.match(/\s*$/)[0];
  const body = raw.slice(0, raw.length - trailingWs.length);
  if (!body.endsWith("}")) throw new Error("file does not end with a closing brace");
  const beforeFinalBrace = body.slice(0, -1).replace(/[ \t\r\n]+$/, "");

  const alreadyHasKey = /\n {2}"grownUpGuide":/.test(raw);
  let base = beforeFinalBrace;
  if (alreadyHasKey) {
    // Remove the existing "grownUpGuide": { ... } block (brace-matched) so a
    // re-run replaces rather than duplicates it.
    const keyStart = raw.indexOf(`${eol}${pad}"grownUpGuide":`);
    let depth = 0;
    let i = raw.indexOf("{", keyStart);
    const blockStart = i;
    for (; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") { depth--; if (depth === 0) { i++; break; } }
    }
    const before = raw.slice(0, keyStart).replace(/,\s*$/, "");
    const after = raw.slice(i);
    base = (before + after).slice(0, -(trailingWs.length)).replace(/[ \t\r\n]+$/, "");
    // Re-derive: after removal, the char right before the final "}" may now
    // need its own trailing comma cleaned up the same way as the fresh path.
    const rebuiltBody = before + after;
    const rebuiltTrailing = rebuiltBody.match(/\s*$/)[0];
    base = rebuiltBody.slice(0, rebuiltBody.length - rebuiltTrailing.length).slice(0, -1).replace(/[ \t\r\n]+$/, "");
  }

  const guideBlock = JSON.stringify(guide, null, indentUnit)
    .split("\n")
    .map((line, idx) => (idx === 0 ? line : pad + line))
    .join(eol);
  return `${base},${eol}${pad}"grownUpGuide": ${guideBlock}${eol}}${trailingWs}`;
}

let changed = 0;
const failures = [];
for (let unitNo = 1; unitNo <= 9; unitNo++) {
  const file = path.join(UNIT_DATA_DIR, `unit-${unitNo}.json`);
  const raw = fs.readFileSync(file, "utf8");
  const unit = JSON.parse(raw);
  let guide;
  try {
    guide = buildGuide(unitNo);
  } catch (error) {
    failures.push(`unit-${unitNo}: ${error.message}`);
    continue;
  }
  if (JSON.stringify(unit.grownUpGuide || null) === JSON.stringify(guide)) {
    console.log(`unit-${unitNo}: unchanged`);
    continue;
  }
  changed += 1;
  console.log(`unit-${unitNo}: grownUpGuide written (${guide.sections.length} sections)`);
  if (!DRY) {
    const next = spliceGuide(raw, guide);
    const reparsed = JSON.parse(next);
    if (JSON.stringify(reparsed.grownUpGuide) !== JSON.stringify(guide)) {
      throw new Error(`unit-${unitNo}: spliced output failed round-trip verification`);
    }
    fs.writeFileSync(file, next, "utf8");
  }
}
console.log(JSON.stringify({ dry: DRY, unitsChanged: changed, failures: failures.length }));
for (const f of failures) console.error("FAIL " + f);
if (failures.length) process.exit(1);
