#!/usr/bin/env node
// Production acceptance gate for a course unit JSON.
//
// Runs every OBJECTIVE quality check distilled from the Grade 1 audits. A unit
// is production-ready only when this exits 0 (green) AND a human has eyeballed
// the quiz distractors (the one thing a machine can't fully judge). Pair it with
// docs/lesson-authoring-super-prompt.md — the model authors, this disposes.
//
// Usage:
//   node tools/validate-unit.mjs <unit.json> [...more units]
//   node tools/validate-unit.mjs "src/prototypes/ehel-academy/english/grade-1/data/units/*.json"
//
// Exit code 0 = all pass; 1 = at least one violation (listed).

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: node tools/validate-unit.mjs <unit.json> [...]");
  process.exit(2);
}

// Expand simple globs (…/*.json) since Windows shells don't.
const files = args.flatMap((a) => {
  if (a.includes("*")) {
    const dir = path.dirname(a);
    const rx = new RegExp("^" + path.basename(a).replace(/[.]/g, "\\.").replace(/\*/g, ".*") + "$");
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => rx.test(f)).map((f) => path.join(dir, f)) : [];
  }
  return [a];
});

// ── check helpers ──────────────────────────────────────────────────────────
const A_VOWEL = /\ba\s+(?:a|e|i|o|(?:u(?!ni|se|ni|ni))|hour|honest|honou?r)\w*/i; // sound-aware-ish
const A_VOWEL_LOOSE = /\ba\s+[aeiou]\w+/i;
const CONSONANT_SOUND_VOWEL = /\ba\s+(?:uni|use|useful|user|one|euro|ewe|unicorn|unit|uniform|university)\w*/i;
const BANNED_MEANING = /A naming word used when/i;
const BANNED_FRAMES = new Set(["This is a X.", "I can see a X.", "The X is here.", "I like the X.", "Can you point to the X?"]);
const GENERIC_COMP = [
  /^where does the story happen/i, /^what happens first/i, /^what happens at the end/i,
  /^how does the (main )?character feel/i, /^which language pattern/i, /^name one thing the learner/i,
];

function articleViolations(s) {
  // flag "a" + vowel-letter word, but exclude words that start with a consonant sound
  const hits = [];
  const re = /\ba\s+([a-z][a-z-]*)/gi;
  let m;
  while ((m = re.exec(s))) {
    const w = m[1].toLowerCase();
    if (!/^[aeiou]/.test(w)) continue;
    // consonant-sound exceptions: u as "you", one as "wun", euro/ewe
    if (/^(uni|use|user|useful|uniform|unit|unicorn|europe|euro|ewe|one|once|u\b)/.test(w)) continue;
    hits.push(m[0]);
  }
  return hits;
}

function* strings(obj, pathStr = "") {
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) yield* strings(obj[k], pathStr ? `${pathStr}.${k}` : k);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => strings(v, `${pathStr}[${i}]`));
  } else if (typeof obj === "string") {
    yield [pathStr, obj];
  }
}

function validate(file) {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const fails = [];
  const warn = [];
  const add = (cond, label, detail) => cond ? null : fails.push(`${label}${detail ? " — " + detail : ""}`);

  // A. grammar / mechanics across vocabulary + grammar text
  const artHits = [];
  for (const e of d.dictionaryLinks || []) {
    for (const s of [e.exampleSentence, ...(e.practiceSentences || [])]) {
      articleViolations(s || "").forEach((h) => artHits.push(`${e.vocabularyId}: "${s}"`));
    }
  }
  for (const g of d.grammar || []) {
    for (const f of ["ruleAndExamples", "explanation", "commonMistake", "memoryTip", "practice"]) {
      articleViolations(g[f] || "").forEach((h) => artHits.push(`${g.grammarId}.${f}: ${h}`));
    }
  }
  add(artHits.length === 0, "article a/an", `${artHits.length} "a"+vowel hits` + (artHits[0] ? ` e.g. ${artHits[0]}` : ""));

  // mechanics: capitalisation + terminal punctuation of vocabulary sentences
  let noEnd = 0, noCap = 0, dbl = 0;
  for (const e of d.dictionaryLinks || []) {
    for (const s of [e.exampleSentence, ...(e.practiceSentences || [])]) {
      if (!s) continue;
      if (!/[.!?"]$/.test(s.trim())) noEnd++;
      if (/^[a-z]/.test(s.trim())) noCap++;
    }
  }
  for (const [, s] of strings(d)) if (/[^\n] {2,}[^\n]/.test(s)) dbl++;
  add(noEnd === 0, "sentence end-punctuation", `${noEnd} missing`);
  add(noCap === 0, "sentence capitalisation", `${noCap} lowercase starts`);
  add(dbl === 0, "double spaces", `${dbl} occurrences`);

  // B. vocabulary distinctness
  const meanings = (d.dictionaryLinks || []).map((e) => e.childMeaning || "");
  const templated = meanings.filter((m) => BANNED_MEANING.test(m)).length;
  const distinct = new Set(meanings).size;
  add(templated === 0, "templated childMeaning", `${templated} generic strings`);
  add(distinct >= Math.floor(meanings.length * 0.95) || meanings.length === 0, "childMeaning distinctness",
    `${distinct}/${meanings.length} distinct`);
  let frameSets = 0;
  for (const e of d.dictionaryLinks || []) {
    const w = e.masterWord || "";
    if (!w) continue;
    const norm = new Set((e.practiceSentences || []).map((s) => s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "X")));
    if (norm.size === BANNED_FRAMES.size && [...norm].every((x) => BANNED_FRAMES.has(x))) frameSets++;
  }
  add(frameSets === 0, "banned practice-frame sets", `${frameSets} entries`);

  // C. quiz validity
  const quizzes = d.quizzes || [];
  let ansMissing = 0, badOpts = 0;
  const pos = {};
  const stems = new Set();
  for (const q of quizzes) {
    const opts = String(q.options || "").split("|").map((o) => o.trim());
    const ans = String(q.correctAnswer || "").trim();
    if (opts.length !== 4 || new Set(opts).size !== 4 || opts.some((o) => !o)) badOpts++;
    else if (!opts.includes(ans)) ansMissing++;
    else pos[opts.indexOf(ans) + 1] = (pos[opts.indexOf(ans) + 1] || 0) + 1;
    stems.add(q.question);
  }
  add(badOpts === 0, "quiz options (4 unique)", `${badOpts} malformed`);
  add(ansMissing === 0, "quiz answer in options", `${ansMissing} missing`);
  add(stems.size === quizzes.length, "quiz stems distinct", `${stems.size}/${quizzes.length}`);
  const total = Object.values(pos).reduce((a, b) => a + b, 0);
  const maxPos = Math.max(0, ...Object.values(pos));
  add(total === 0 || maxPos <= Math.ceil(total * 0.4), "quiz answer-position spread",
    `positions ${JSON.stringify(pos)} (max ${maxPos}/${total}, cap ${Math.ceil(total * 0.4)})`);

  // D. comprehension
  const comp = (d.comprehension || []).map((c) => c.question || "");
  add(new Set(comp).size === comp.length, "comprehension distinct", `${new Set(comp).size}/${comp.length}`);
  const generic = comp.filter((q) => GENERIC_COMP.some((rx) => rx.test(q))).length;
  add(generic === 0, "comprehension not generic", `${generic} passage-agnostic`);

  // E. anti-templating for tasks + assignments
  for (const [sec, field] of [["speaking", "instructionsAndModelLines"], ["writing", "promptAndInstructions"],
    ["activities", "instructionsAndItems"], ["assignments", "instructions"]]) {
    const vals = (d[sec] || []).map((x) => x[field] || "");
    if (vals.length > 1) add(new Set(vals).size === vals.length, `${sec} distinct`, `${new Set(vals).size}/${vals.length}`);
  }
  const fillerTitles = (d.grammar || []).filter((g) => /^Language pattern \d+$/.test(g.title || "")).length;
  add(fillerTitles === 0, "grammar titles specific", `${fillerTitles} "Language pattern N"`);

  // F. answer key — real content ids, no repeated filler
  const ak = d.answerKey || [];
  const akFiller = ak.filter((a) => /^Accept an accurate detail/i.test(a.answerOrGuidance || "")).length;
  add(akFiller <= 1, "answer-key not filler", `${akFiller} generic "accept an accurate detail" entries`);

  // G. companion games pack (games/unit-N.json) — same rigour + sync with dictionary
  const gamesPath = path.join(path.dirname(file), "..", "games", path.basename(file));
  if (fs.existsSync(gamesPath)) {
    let gp;
    try { gp = JSON.parse(fs.readFileSync(gamesPath, "utf8")); } catch (e) { fails.push(`games pack parse error: ${e.message}`); gp = null; }
    if (gp) {
      const meaningSet = new Set((d.dictionaryLinks || []).map((e) => (e.childMeaning || "").trim()));
      let gBadAns = 0, gTemplated = 0, gStaleMeaning = 0, gDupRounds = 0, gRounds = 0;
      for (const game of gp.games || []) {
        // For choice/pairs games the prompt IS the question, so it must be distinct.
        // For spelling/sentence/sequence games the prompt is a generic instruction
        // ("Build the word…") and legitimately repeats — there, the ANSWER must differ.
        const questionLike = game.type === "choice" || game.type === "pairs";
        const seen = new Set();
        for (const r of game.rounds || []) {
          gRounds++;
          const key = questionLike ? (r.prompt || "") : JSON.stringify(r.answer ?? r.solution ?? r.sequence ?? r.pairs ?? r.prompt);
          if (seen.has(key)) gDupRounds++; else seen.add(key);
          if (Array.isArray(r.choices) && r.answer !== undefined) {
            if (!r.choices.includes(r.answer) || new Set(r.choices).size !== r.choices.length) gBadAns++;
          }
          const blob = `${r.prompt || ""} ${r.explanation || ""}`;
          if (BANNED_MEANING.test(blob)) gTemplated++;
          // a "Which word means: <meaning>" round must quote a real current dictionary meaning
          const mm = /means:\s*(.+?)(?:"|$)/i.exec(r.prompt || "");
          if (mm && meaningSet.size) {
            const quoted = mm[1].trim().replace(/["""]/g, "");
            if (![...meaningSet].some((m) => m && (quoted.includes(m) || m.includes(quoted)))) gStaleMeaning++;
          }
        }
      }
      add(gTemplated === 0, "games: no templated meanings", `${gTemplated} rounds quote the banned generic meaning`);
      add(gStaleMeaning === 0, "games: meanings in sync with dictionary", `${gStaleMeaning} rounds quote a meaning not in the unit dictionary`);
      add(gBadAns === 0, "games: choice rounds valid", `${gBadAns} rounds with answer∉choices or dup choices`);
      add(gDupRounds === 0, "games: rounds distinct", `${gDupRounds} duplicate prompts`);
    }
  }

  // reviewer reminder (not a failure): the ones a machine can't fully judge
  for (const q of quizzes) {
    if (/which (word|one) (belongs to|names?|is)/i.test(q.question || "")) {
      warn.push(`manual-review quiz distractors: "${q.question}" — confirm the 3 wrong options are a different category`);
      break;
    }
  }

  return { file, fails, warn };
}

let anyFail = false;
for (const f of files) {
  let r;
  try { r = validate(f); } catch (e) { console.log(`\n✗ ${f}\n   PARSE ERROR: ${e.message}`); anyFail = true; continue; }
  const tag = r.fails.length ? "✗" : "✓";
  console.log(`\n${tag} ${path.basename(f)}${r.fails.length ? "" : "  — all objective checks pass"}`);
  for (const x of r.fails) console.log(`   FAIL  ${x}`);
  for (const w of r.warn) console.log(`   note  ${w}`);
  if (r.fails.length) anyFail = true;
}
console.log("");
process.exit(anyFail ? 1 : 0);
