#!/usr/bin/env node
// Acceptance gate for a Cambridge curriculum framework JSON in src/curriculum/.
//
// The framework files are extracted from Cambridge's published PDFs, and until
// this existed NOTHING checked them: validate-unit.mjs checks units AGAINST the
// framework, so a corrupt framework makes every unit look aligned to garbage.
//
// The defect this is built around is real. 7/8/9SLr.02 are the last bullet of
// their stage, so with no following bullet to stop the parser they swallowed
// whatever came next — page furniture, the next stage's heading, and in Stage 9's
// case the entire glossary (3,088 characters). The original verification checked
// that every objective's text was PRESENT and terminated, which it was; the text
// was too LONG, not too short. So bounds are checked in both directions here, and
// the boilerplate list below is matched as a substring rather than inferring
// health from non-emptiness.
//
// FAIL = an objective defect that must be fixed before the file is trusted.
// note = needs a human eye (possible issue or unverifiable by machine).
//
// Usage:
//   node tools/validate-curriculum-framework.mjs                  # every framework file
//   node tools/validate-curriculum-framework.mjs <file> [...more]
//   node tools/validate-curriculum-framework.mjs --quiet          # only print FAILs
// Exit 0 = all pass; 1 = at least one FAIL; 2 = usage / read error.

import fs from "node:fs";
import path from "node:path";

const rawArgs = process.argv.slice(2);
const QUIET = rawArgs.includes("--quiet");
const args = rawArgs.filter((a) => !a.startsWith("--"));

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const CURRICULUM_DIR = path.join(ROOT, "src", "curriculum");

const files = args.length
  ? args
  : (fs.existsSync(CURRICULUM_DIR)
    ? fs.readdirSync(CURRICULUM_DIR).filter((f) => /^cambridge-(?:english|science)-\d+\.json$/.test(f)).sort().map((f) => path.join(CURRICULUM_DIR, f))
    : []);
if (!files.length) {
  console.error(`usage: node tools/validate-curriculum-framework.mjs [--quiet] [<framework.json> ...]\n(no framework files found in ${CURRICULUM_DIR})`);
  process.exit(2);
}

// ── shared patterns ──────────────────────────────────────────────────────────
// Objective code = <stage><subStrandCode>.<nn>. Both frameworks use this scheme.
// Objective code = <stage><subStrandCode><number>. The separator and the
// sub-strand alphabet differ per framework, so match all three published
// schemes rather than assuming the English one:
//   English  0058/0861          7Rv.01, 8SLm.02   (dotted, 2-digit)
//   Science  0893 lower sec.    7TWSm.01, 9ESs.03, 7SIC.01, 8Bs.02
//   Science  0846 primary       1Ep1, 3Cc2        (no dot, 1-2 digits)
const CODE_RE = /^([1-9])((?:SL|R|W|TWS|ES|SIC|[EBCP])[a-z]?)\.?(\d{1,2})$/;
// Page furniture that has been observed glued onto objective text, plus the
// headings that sit between sections in the source PDFs. Any of these inside an
// objective means the parser ran past the end of the bullet.
const BOILERPLATE = [
  /\bGlossary\b/i,
  /\bScheme of Work\b/i,
  /\bTeacher Guide\b/i,
  /\bCurriculum Framework\b/i,
  /\bTexts across\b/i,
  /sub-strand appears only/i,
  /\bStage \d\b/,
  /\bWord structure \(phonics\)\b/i,
  /\bLearning objectives\s*[–-]/i,
];
const MOJIBAKE = /�|Ã[©¨¤¢°½¼ ]|â€[™œ“”]|Â[ °]/;
const PLACEHOLDER = /\b(TBD|TODO|FIXME|Lorem ipsum|XXXX?)\b|\bplaceholder\b/i;
// Measured across both shipped frameworks: shortest real objective is 20 chars
// ("Read texts silently."), longest is 294. The FAIL band sits clear of both;
// the note band flags outliers worth an eye before they become the next 3,088.
const TEXT_MIN = 18, TEXT_MAX = 340, TEXT_LONG_NOTE = 250;

const isBlank = (s) => typeof s !== "string" || !s.trim();

// ── the validator ────────────────────────────────────────────────────────────
function validate(file) {
  const fw = JSON.parse(fs.readFileSync(file, "utf8"));
  const fails = [], notes = [];
  const F = (cond, label, detail) => { if (!cond) fails.push(`${label}${detail ? " — " + detail : ""}`); };
  const N = (msg) => notes.push(msg);

  // ═══ 1. FILE-LEVEL METADATA ═══
  for (const k of ["framework", "curriculumCode", "published", "source", "strands", "subStrands", "counts", "objectivesByStage"]) {
    F(fw[k] !== undefined, "structure: missing top-level field", k);
  }
  for (const k of ["framework", "curriculumCode", "published", "source"]) {
    if (fw[k] !== undefined) F(!isBlank(String(fw[k])), "metadata: blank field", k);
  }
  // The unit validator resolves a framework by filename from the unit's declared
  // code, so a filename that disagrees with curriculumCode loads the wrong file.
  const fileCode = /cambridge-(?:english|science)-(\d+)\.json$/.exec(path.basename(file))?.[1];
  if (fileCode) F(String(fw.curriculumCode) === fileCode, "metadata: curriculumCode ≠ filename", `${fw.curriculumCode} vs ${fileCode}`);
  if (!isBlank(fw.source)) F(!PLACEHOLDER.test(fw.source), "metadata: source looks like a placeholder", fw.source);

  const strands = fw.strands || {};
  const subStrands = fw.subStrands || {};
  const byStage = fw.objectivesByStage || {};
  F(Object.keys(byStage).length > 0, "structure: objectivesByStage publishes no stages", "");

  // ═══ 2. PER-OBJECTIVE INTEGRITY ═══
  const all = Object.entries(byStage).flatMap(([s, objs]) => (Array.isArray(objs) ? objs : []).map((o) => [s, o]));
  for (const [stageKey, objs] of Object.entries(byStage)) {
    F(Array.isArray(objs), "structure: stage is not an array", `stage ${stageKey}`);
  }
  // A stage with no objectives means the extractor matched nothing — the most
  // likely failure mode when a source PDF or a parsing rule changes. Every
  // other check passes vacuously on an empty file, so this has to be its own
  // failure or a silently empty framework reads as a clean pass.
  const emptyStages = Object.entries(byStage)
    .filter(([, objs]) => !Array.isArray(objs) || objs.length === 0)
    .map(([stageKey]) => stageKey);
  F(emptyStages.length === 0, "structure: stage publishes no objectives — extraction produced nothing", emptyStages.join(", "));
  const seenCodes = new Map();
  const usedSubStrands = new Set();
  const badShape = [], stageMismatch = [], subMismatch = [], labelMismatch = [], strandMismatch = [], flagIssues = [];
  for (const [stageKey, o] of all) {
    const m = CODE_RE.exec(String(o.code || ""));
    if (!m) { badShape.push(String(o.code)); continue; }
    const [, codeStage, subCode] = m;
    // The code is the only field the units reference, so every other field on the
    // objective has to agree with it — a mismatch means a unit maps to a code whose
    // stage or strand metadata says something different from what the code says.
    if (codeStage !== stageKey || String(o.stage) !== codeStage) stageMismatch.push(`${o.code} (stage field ${o.stage}, under key ${stageKey})`);
    if (o.subStrandCode !== subCode) subMismatch.push(`${o.code} (subStrandCode ${o.subStrandCode})`);
    if (subStrands[subCode] !== undefined && o.subStrand !== subStrands[subCode]) labelMismatch.push(`${o.code} ("${o.subStrand}" vs "${subStrands[subCode]}")`);
    F(subStrands[subCode] !== undefined, "objective: sub-strand missing from the subStrands map", `${o.code} uses ${subCode}`);
    const strandKey = subCode.startsWith("SL") ? "SL" : subCode[0];
    if (strands[strandKey] !== undefined && o.strand !== strands[strandKey]) strandMismatch.push(`${o.code} ("${o.strand}" vs "${strands[strandKey]}")`);
    if (typeof o.recurring !== "boolean") flagIssues.push(`${o.code} (recurring is ${typeof o.recurring})`);
    usedSubStrands.add(subCode);
    seenCodes.set(o.code, (seenCodes.get(o.code) || 0) + 1);
  }
  const show = (a) => a.slice(0, 3).join(", ") + (a.length > 3 ? `, +${a.length - 3} more` : "");
  F(badShape.length === 0, "objective: malformed code", show(badShape));
  F(stageMismatch.length === 0, "objective: stage disagrees with its code", show(stageMismatch));
  F(subMismatch.length === 0, "objective: subStrandCode disagrees with its code", show(subMismatch));
  F(labelMismatch.length === 0, "objective: subStrand label disagrees with the subStrands map", show(labelMismatch));
  F(strandMismatch.length === 0, "objective: strand disagrees with the strands map", show(strandMismatch));
  F(flagIssues.length === 0, "objective: recurring flag is not boolean", show(flagIssues));
  const dupCodes = [...seenCodes].filter(([, n]) => n > 1).map(([c]) => c);
  F(dupCodes.length === 0, "objective: duplicate code", show(dupCodes));

  // ═══ 3. TEXT BOUNDS — BOTH DIRECTIONS ═══
  // The whole point of this section. Too short means a dropped bullet; too long
  // means the parser ate the next section. Checking only one end catches neither.
  // House style differs between the published frameworks. Cambridge Primary
  // Science 0846 prints its objectives as unpunctuated fragments, several of
  // them very short ("Make predictions"), where English 0058/0861 and Science
  // 0893 print full stopped sentences. A framework declares its own style via
  // `objectiveStyle` so the difference is recorded in the data rather than
  // hidden in an exception list here; absent the field, the strict rules apply.
  const style = fw.objectiveStyle || {};
  const requireTerminalPunctuation = style.terminalPunctuation !== false;
  const minTextChars = Number.isFinite(style.minTextChars) ? style.minTextChars : TEXT_MIN;

  const empty = [], tooShort = [], tooLong = [], unterminated = [], contaminated = [], mojibake = [], placeholder = [];
  for (const [, o] of all) {
    const t = String(o.text ?? "");
    if (isBlank(t)) { empty.push(o.code); continue; }
    if (t.length < minTextChars) tooShort.push(`${o.code} (${t.length} chars: "${t}")`);
    if (t.length > TEXT_MAX) tooLong.push(`${o.code} (${t.length} chars, starts "${t.slice(0, 60)}…")`);
    else if (t.length > TEXT_LONG_NOTE) N(`text note: ${o.code} is ${t.length} chars — long for an objective, worth an eye`);
    if (requireTerminalPunctuation && !/[.?!]$/.test(t.trim())) unterminated.push(`${o.code} (ends "…${t.trim().slice(-40)}")`);
    const hit = BOILERPLATE.find((rx) => rx.test(t));
    if (hit) contaminated.push(`${o.code} matches ${hit}`);
    if (MOJIBAKE.test(t)) mojibake.push(o.code);
    if (PLACEHOLDER.test(t)) placeholder.push(o.code);
  }
  F(empty.length === 0, "text: objective has no text", show(empty));
  F(tooShort.length === 0, `text: shorter than ${minTextChars} chars — likely a truncated bullet`, show(tooShort));
  F(tooLong.length === 0, `text: longer than ${TEXT_MAX} chars — likely swallowed the following section`, show(tooLong));
  F(unterminated.length === 0, "text: no terminal punctuation", show(unterminated));
  F(contaminated.length === 0, "text: contains page furniture from the source document", show(contaminated));
  F(mojibake.length === 0, "text: mojibake / broken encoding", show(mojibake));
  F(placeholder.length === 0, "text: placeholder marker", show(placeholder));

  // Identical text under two codes inside one stage is a parser artifact — a
  // bullet copied instead of advancing. Across stages it is normal: the recurring
  // objectives are worded identically by design.
  for (const [stageKey, objs] of Object.entries(byStage)) {
    const byText = new Map();
    for (const o of (Array.isArray(objs) ? objs : [])) {
      if (isBlank(o.text)) continue;
      byText.set(o.text, [...(byText.get(o.text) || []), o.code]);
    }
    const dups = [...byText.values()].filter((v) => v.length > 1).map((v) => v.join(" = "));
    F(dups.length === 0, `text: same wording under two codes in stage ${stageKey}`, show(dups));
  }

  // ═══ 4. NUMBERING CONTINUITY ═══
  // Every sub-strand runs .01, .02, .03 with no holes. A hole is the signature of
  // a bullet the parser dropped, which is invisible in every other check here.
  for (const [stageKey, objs] of Object.entries(byStage)) {
    const bySub = {};
    for (const o of (Array.isArray(objs) ? objs : [])) {
      const m = CODE_RE.exec(String(o.code || ""));
      if (m) (bySub[m[2]] ||= []).push(Number(m[3]));
    }
    const problems = [];
    for (const [sub, nums] of Object.entries(bySub)) {
      nums.sort((a, b) => a - b);
      if (nums[0] !== 1) problems.push(`${stageKey}${sub} starts at .${String(nums[0]).padStart(2, "0")}`);
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[i - 1] + 1) problems.push(`${stageKey}${sub} jumps .${String(nums[i - 1]).padStart(2, "0")} → .${String(nums[i]).padStart(2, "0")}`);
      }
    }
    F(problems.length === 0, `numbering: gap in stage ${stageKey}`, show(problems));
  }

  // ═══ 5. COUNTS RECONCILIATION ═══
  // counts is the file's own claim about itself, and it is what a reader trusts
  // instead of counting. If it drifts from the array lengths, one of them is wrong.
  const counts = fw.counts || {};
  const countKeys = new Set([...Object.keys(counts), ...Object.keys(byStage)]);
  for (const k of countKeys) {
    const actual = Array.isArray(byStage[k]) ? byStage[k].length : undefined;
    const claimed = counts[k];
    if (actual === undefined) F(false, "counts: stage counted but not published", `stage ${k}`);
    else if (claimed === undefined) F(false, "counts: stage published but not counted", `stage ${k} (${actual} objectives)`);
    else F(Number(claimed) === actual, "counts: claimed ≠ actual", `stage ${k}: counts says ${claimed}, array has ${actual}`);
  }

  // ═══ 6. SUB-STRAND MAP HYGIENE ═══
  // A sub-strand listed but never used advertises a mapping target that does not
  // exist — 0861 shipped with Primary-only "Rw" until it was removed.
  const unused = Object.keys(subStrands).filter((k) => !usedSubStrands.has(k));
  if (unused.length) N(`subStrands note: ${unused.length} listed but used by no objective (${unused.join(", ")}) — either the sub-strand is not part of this framework, or its objectives were dropped in extraction`);

  // ═══ 7. CROSS-STAGE SHAPE ═══
  // Adjacent stages of one framework carry nearly the same sub-strand structure;
  // a code present in one stage and missing from its neighbour is usually real
  // curriculum progression, but a whole sub-strand vanishing is usually not.
  const stageList = Object.keys(byStage).sort();
  for (let i = 1; i < stageList.length; i++) {
    const subsOf = (s) => new Set((byStage[s] || []).map((o) => CODE_RE.exec(String(o.code || ""))?.[2]).filter(Boolean));
    const [prev, cur] = [subsOf(stageList[i - 1]), subsOf(stageList[i])];
    const missing = [...prev].filter((s) => !cur.has(s));
    const added = [...cur].filter((s) => !prev.has(s));
    if (missing.length || added.length) {
      N(`structure note: stage ${stageList[i]} sub-strands differ from stage ${stageList[i - 1]}${missing.length ? ` — absent: ${missing.join(", ")}` : ""}${added.length ? ` — new: ${added.join(", ")}` : ""}`);
    }
  }

  const total = all.length;
  const recurring = all.filter(([, o]) => o.recurring).length;
  N(`summary: ${total} objectives across stage(s) ${Object.keys(byStage).join(", ")}; ${recurring} recurring; ${Object.keys(subStrands).length} sub-strands`);

  return { file, fails, notes: notes.filter(Boolean) };
}

// ── run ──────────────────────────────────────────────────────────────────────
let anyFail = false;
const summary = [];
for (const f of files) {
  let r;
  try { r = validate(f); } catch (e) { console.log(`\n✗ ${path.basename(f)}\n   PARSE/READ ERROR: ${e.message}`); anyFail = true; summary.push([path.basename(f), "ERROR"]); continue; }
  const ok = r.fails.length === 0;
  if (!ok) anyFail = true;
  summary.push([path.basename(f), ok ? `pass${r.notes.length ? ` (${r.notes.length} note${r.notes.length > 1 ? "s" : ""})` : ""}` : `${r.fails.length} FAIL`]);
  if (QUIET && ok) continue;
  console.log(`\n${ok ? "✓" : "✗"} ${path.basename(f)}${ok ? "  — all framework checks pass" : ""}`);
  for (const x of r.fails) console.log(`   FAIL  ${x}`);
  if (!QUIET) for (const n of r.notes) console.log(`   note  ${n}`);
}
if (files.length > 1) {
  console.log("\n── summary ──");
  for (const [f, s] of summary) console.log(`   ${s.includes("FAIL") || s === "ERROR" ? "✗" : "✓"} ${f.padEnd(32)} ${s}`);
}
console.log("");
process.exit(anyFail ? 1 : 0);
