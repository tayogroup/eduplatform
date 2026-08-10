#!/usr/bin/env node
// Turns the syllabus drafts in docs/ into a payload the Moodle CLI seeder can
// write straight into local_prequran_syllabus.
//
//   node tools/export-syllabus-drafts.js [--out <file>]
//
// Two things about the target shape drive every decision here.
//
// 1. The stored text is rendered with nl2br(s($text)) — escaped, with newlines
//    turned into <br>. Markdown does not survive that: `**bold**` renders as
//    literal asterisks and a table renders as a wall of pipes. So everything is
//    flattened to plain text, and anything that only works as markup (tables,
//    the appendix, the pre-submission checklist) is dropped rather than shipped
//    as noise.
//
// 2. The fields are length-capped in pqsyl_save: overview 8000, teacher_intro
//    4000, contact 1000, each policy 4000. Truncation there is silent, so this
//    reports anything close to a cap rather than letting the server trim it.
//
// A syllabus marked HELD is skipped. Seeding a draft for a course that has been
// withdrawn would put it in front of the very approver the hold exists to stop.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const outArg = process.argv.indexOf("--out");
const OUT = outArg >= 0 ? path.resolve(process.argv[outArg + 1]) : path.join(ROOT, "outputs", "syllabus-drafts.json");

// docs filename → Moodle course idnumber. The catalogue's subjectKey is the
// middle segment (ehel-<key>-g<NN>), so these must match generate-ehel-catalog.
const SUBJECT_KEY = {
  english: "eng",
  mathematics: "math",
  science: "sci",
  computing: "comp",
  "global-perspectives": "gp",
};

// Heading under "Course policies" → the policy_<key> field pqsyl_save expects.
// Keys come from pqsyl_policy_blocks(); a heading missing from here is reported
// rather than silently dropped, because a policy that vanishes is a policy the
// school never gets asked about.
const POLICY_BY_HEADING = {
  "Prerequisites": "prerequisites",
  "Materials and equipment": "materials",
  "Attendance": "attendance",
  "Homework": "homework",
  "Assessment and grading": "assessment",
  "Behaviour and participation": "behaviour",
  "Support and communication": "support",
};

const CAPS = { overview: 8000, teacher_intro: 4000, contact: 1000, policy: 4000 };

// Markdown → plain text for an escaped, nl2br'd field.
function flatten(md) {
  const out = [];
  for (let line of md.split("\n")) {
    // Unwrap the blockquote FIRST. The mark-division tables in the Grade 7 and
    // 8 syllabuses sit inside one, so testing for a table before stripping "> "
    // lets every row through and ships a wall of pipes into a field that
    // renders them literally.
    line = line.replace(/^>\s?/, "");                  // blockquote marker
    if (/^\s*\|/.test(line)) continue;                 // table row
    if (/^\s*[-:|\s]+$/.test(line) && line.includes("|")) continue; // table rule
    if (/^\s*---\s*$/.test(line)) continue;            // horizontal rule
    line = line.replace(/^#{1,6}\s+/, "");             // stray heading
    line = line.replace(/^\s*[-*]\s+/, "• ");          // bullet
    line = line.replace(/^\s*(\d+)\.\s+/, "$1. ");     // ordered item
    out.push(line.trimEnd());
  }
  // Inline markup is stripped from the JOINED text, not line by line: emphasis
  // routinely wraps across a line break in these documents ("**61 debugging\n
  // notes**"), and a per-line pass leaves both halves of the marker behind.
  return out.join("\n")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")     // link → its text
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")        // bold, possibly wrapped
    .replace(/(^|[\s(])\*([^*\n][\s\S]*?)\*/g, "$1$2") // italic, likewise
    .replace(/`([^`]+)`/g, "$1")                 // code span
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Everything between one heading and the next of the same or higher level.
// The search for the next heading starts AFTER the matched heading line — start
// it a character in and the same heading matches itself immediately, which
// returns a one-character body and looks exactly like a document with no
// content in it.
function section(md, heading, level) {
  const hashes = "#".repeat(level);
  const re = new RegExp(`^${hashes} ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
  const found = re.exec(md);
  if (!found) return null;
  const rest = md.slice(found.index + found[0].length);
  const next = new RegExp(`^#{1,${level}} `, "m").exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

const files = fs.readdirSync(DOCS)
  .filter((f) => /^ehel-.*-syllabus\.md$/.test(f))
  .sort();

const entries = [];
const skipped = [];
const warnings = [];

for (const file of files) {
  const md = fs.readFileSync(path.join(DOCS, file), "utf8");

  // ehel-<subject>-(grade|stage)-<n>-syllabus.md
  const m = file.match(/^ehel-(.+)-(?:grade|stage)-(\d+)-syllabus\.md$/);
  if (!m) { skipped.push(`${file}: filename does not carry a subject and number`); continue; }
  const [, subjectDir, num] = m;
  const key = SUBJECT_KEY[subjectDir];
  if (!key) { skipped.push(`${file}: no catalogue subjectKey for "${subjectDir}"`); continue; }

  if (/^#.*\(HELD\)/m.test(md) || /^## HELD/m.test(md)) {
    skipped.push(`${file}: marked HELD — not seeded`);
    continue;
  }

  const idnumber = `ehel-${key}-g${String(num).padStart(2, "0")}`;
  const overview = section(md, "Overview", 2);
  const teacherIntro = section(md, "Teacher introduction", 2);
  const contact = section(md, "Contact", 2);
  const policiesBody = section(md, "Course policies", 2);

  if (!overview) { skipped.push(`${file}: no "## Overview" section`); continue; }

  const policies = {};
  if (policiesBody) {
    for (const [heading, field] of Object.entries(POLICY_BY_HEADING)) {
      const body = section(policiesBody, heading, 3);
      if (body) policies[field] = flatten(body);
      else warnings.push(`${file}: no "### ${heading}" — policy_${field} will be empty`);
    }
  } else {
    warnings.push(`${file}: no "## Course policies" section — every policy will be empty`);
  }

  const record = {
    idnumber,
    source: `docs/${file}`,
    overview: flatten(overview),
    teacher_intro: teacherIntro ? flatten(teacherIntro) : "",
    contact: contact ? flatten(contact) : "",
    policies,
  };

  // Report anything the server would silently trim.
  const check = (label, text, cap) => {
    if (text.length > cap) warnings.push(`${file}: ${label} is ${text.length} chars, over the ${cap} cap — it WILL be truncated`);
    else if (text.length > cap * 0.9) warnings.push(`${file}: ${label} is ${text.length} chars, within 10% of the ${cap} cap`);
  };
  check("overview", record.overview, CAPS.overview);
  check("teacher_intro", record.teacher_intro, CAPS.teacher_intro);
  check("contact", record.contact, CAPS.contact);
  for (const [field, text] of Object.entries(policies)) check(`policy_${field}`, text, CAPS.policy);

  entries.push(record);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  note: "Draft syllabus narratives for local_prequran/cli/seed_syllabus_drafts.php. Plain text, not markdown: the field is rendered with nl2br(s($text)).",
  generatedFrom: "docs/ehel-*-syllabus.md",
  count: entries.length,
  entries,
}, null, 2) + "\n");

console.log(`syllabus drafts: ${entries.length} course(s) → ${path.relative(ROOT, OUT)}`);
for (const e of entries) {
  const filled = Object.values(e.policies).filter(Boolean).length;
  console.log(`  ${e.idnumber.padEnd(16)} overview ${String(e.overview.length).padStart(5)} · policies ${filled}/7`);
}
if (skipped.length) {
  console.log(`\nskipped (${skipped.length}):`);
  for (const s of skipped) console.log(`   ${s}`);
}
if (warnings.length) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`   ${w}`);
}
