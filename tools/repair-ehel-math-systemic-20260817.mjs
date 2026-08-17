// The systemic half of the 2026-08-17 Mathematics proofreading pass.
//
// Sixteen readers read every learner-facing string in all eight stages
// (docs/math-content-review-2026-08-17.md). Most of what they found was not
// 1,522 separate mistakes but a dozen builder templates repeated across 133
// units, so those are repaired by rule here and the per-string corrections live
// in the sibling tool (repair-ehel-math-proofread-20260817.mjs).
//
// Every rule below is idempotent — running twice changes nothing the second
// time — and every one reports its own count, because a rule that silently
// matches nothing is how a class quietly stops being repaired.
//
// The matching builder fixes are in tools/build-ehel-math-runtime.js, so a
// rebuild does not reintroduce these. Note `build:math` needs --force and
// discards in-place repairs (see CLAUDE.md), so both halves matter.
//
//   node tools/repair-ehel-math-systemic-20260817.mjs [--write] [--only rule,rule]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const only = argv.includes("--only") ? new Set(argv[argv.indexOf("--only") + 1].split(",")) : null;
const enabled = (name) => !only || only.has(name);

const counts = {};
const samples = {};
const bump = (rule, before, after) => {
  counts[rule] = (counts[rule] || 0) + 1;
  if (!samples[rule]) samples[rule] = [];
  if (samples[rule].length < 3 && before !== undefined) samples[rule].push([before, after]);
};

// Fields no rule may touch: source provenance, and the guide written to the
// adult by design (Stage 1 only).
const SKIP_KEYS = new Set(["provenance", "grownUpGuide", "schemaVersion", "generatedAt", "cambridge", "media", "id", "outcomeId", "modelType", "questionId", "assessmentId", "sectionId", "unitId", "gradeId"]);

// ---------------------------------------------------------------- text rules
// Applied to every learner-facing string in every file.

// UK English. The course teaches "maths"; the vocabulary hint and every game
// clue built from it said "Math Words & Symbols" — 1,818 strings, and the clue
// is narrated, so this one is audible.
const SPELLING = [
  [/\bMath Words & Symbols\b/g, "Maths Words & Symbols"],
  [/\bmental math\b/g, "mental maths"],
  [/\bA math lesson\b/g, "A maths lesson"],
  [/\ba math lesson\b/g, "a maths lesson"],
  [/\banalog\b/g, "analogue"],
  [/\bAnalog\b/g, "Analogue"],
  [/\bcolored\b/g, "coloured"],
  [/\bColored\b/g, "Coloured"],
  [/\bcolor\b/g, "colour"],
  [/\bColor\b/g, "Colour"],
  [/\bOrganizing\b/g, "Organising"],
  [/\bneighbors\b/g, "neighbours"],
];

// The source packs mark emphasis with asterisks. Nothing renders them — the
// app escapes its text — so the learner reads a literal *word*.
const MARKDOWN = /\*([^*\n]{1,60}?)\*/g;

// A hyphen or an em dash standing where a minus sign belongs, between two
// numbers: "4 - 1 = 3" should read "4 − 1 = 3". The risk is a dash used as
// punctuation that merely happens to sit between two digits — "by 3/4 — 8 ×
// 3/4 should give back 6" is a parenthetical aside, not a subtraction, and an
// early version of this rule mangled it because the STRING contained a "×"
// elsewhere. So the test is local, not global: only convert when a "="
// follows within a short window with nothing but digits/operators/spaces in
// between — the shape of a continuing calculation, never a sentence.
const MINUS_DASH = /(\d)\s+[-—]\s+(\d)/g;
function looksArithmeticAfter(rest) {
  const window = rest.slice(0, 25);
  const eq = window.indexOf("=");
  if (eq < 0) return false;
  return !/[a-zA-Z]/.test(window.slice(0, eq));
}

function textRules(s, p) {
  let out = s;
  if (enabled("spelling")) for (const [re, to] of SPELLING) { const next = out.replace(re, to); if (next !== out) { bump("spelling", out, next); out = next; } }
  if (enabled("markdown") && MARKDOWN.test(out)) { const next = out.replace(MARKDOWN, "$1"); if (next !== out) { bump("markdown", out, next); out = next; } }
  if (enabled("minus")) {
    const next = out.replace(MINUS_DASH, (match, a, b, offset, whole) => looksArithmeticAfter(whole.slice(offset + match.length)) ? `${a} − ${b}` : match);
    if (next !== out) { bump("minus", out, next); out = next; }
  }
  return out;
}

// ------------------------------------------------------------- shaped rules
// Rules that need to see the structure, not just a string.

// The glossary question template read `${term} means ${meaning}.`, and every
// meaning is a glossary cell that starts with a capital — so the learner read
// "Digit means A single symbol from 0 to 9." Lowercase the first letter, but
// only when the rest of the first word is lowercase: "Metres" may start a
// definition, "Roman numerals" and "I" may not be touched.
function lowerFirst(text) {
  // Lowercase a leading capitalised word, including a one-letter word like
  // "A solid shape…" — the earlier version required two more lowercase
  // letters in the same word, which let "A"/"An" through untouched. "I" is
  // the one word this must never touch.
  if (/^I\b/.test(text)) return text;
  if (!/^[A-Z](?:[a-z]|\s)/.test(text)) return text;
  return text[0].toLowerCase() + text.slice(1);
}
function fixMeansCapital(node) {
  if (!node || typeof node !== "object") return;
  const fix = (obj, key) => {
    const v = obj[key];
    if (typeof v !== "string") return;
    const m = v.match(/^(.+? means )([A-Z].*)$/s);
    if (!m) return;
    const next = m[1] + lowerFirst(m[2]);
    if (next !== v) { bump("means-capital", v, next); obj[key] = next; }
  };
  for (const q of node.assessment?.questions || []) fix(q, "explanation");
  for (const g of node.games?.games || []) for (const r of g.rounds || []) fix(r, "explanation");
}

// A worked example whose title could not be derived from its prompt was named
// "Practice 9" … "Practice 12". Derive one from the prompt with a wider net
// than the builder used: strip the multi-part tail, cut at a word boundary,
// and fall back to the unit's own topic rather than a bare ordinal.
function titleFromPrompt(prompt, unitTitle) {
  const raw = String(prompt || "").trim();
  // Strip the "a) … b) … c) …" tail of a multi-part question — it is the body,
  // not the title. What is left before it ("Solve", "Convert") is sometimes
  // too short to stand alone as a title on its own.
  const stripped = raw.replace(/\s*\(?[a-e]\)\s[\s\S]*$/i, "").replace(/\s*[:?.]+\s*$/, "").trim();
  if (stripped.length >= 8) {
    if (stripped.length <= 55) return stripped;
    const cut = stripped.slice(0, 55);
    const boundary = Math.max(cut.lastIndexOf(" "), 24);
    return `${cut.slice(0, boundary).replace(/[,;:.!?—–-]$/, "")}…`;
  }
  // The verb alone ("Solve", "Convert", "Find", "Divide") is too short to be
  // a title, and the multi-part tail it was stripped from IS the worked
  // example's own prompt — reusing it verbatim would make the title and the
  // prompt identical, which is worse than the "Practice N" it replaces (the
  // app's own content gate rejects a title that just repeats the prompt).
  if (/\(?[a-e]\)\s/i.test(raw)) return `${stripped || "Work out"}: several parts`;
  if (stripped.length >= 4) return `${stripped || "Practice"} this`;
  return `Practice with ${String(unitTitle || "this unit").toLowerCase()}`;
}
function fixPracticeTitles(unit) {
  for (const we of unit.workedExamples || []) {
    if (!/^Practice \d+$/.test(we.title || "")) continue;
    const next = titleFromPrompt(we.prompt, unit.unit?.unitTitle);
    if (next && next !== we.title) { bump("practice-title", we.title, next); we.title = next; }
  }
}

// A reference card's real heading was only recognised by the builder when it
// ended in the word "Rule", so every other card was titled "Key rule N" with
// its heading left glued to the front of the body text ("Our Coins and Notes
// 1 sh, 5 sh…"). A general-purpose regex split was tried and rejected: it
// truncates a heading right before a trailing number or a parenthetical
// ("Multiplying by 10 and" / "100 × 10: …", "The Order of" / "Operations
// (BODMAS) …") because both a heading word and the body's first token can be
// capitalised or numeric, and nothing short of reading the sentence tells
// them apart. There are only 58 of these in the whole course, so every one
// was read by hand instead (docs/math-content-review-2026-08-17.md) and the
// verified heading is looked up here — the body is never retyped, only
// sliced off after the heading, so a transcription slip cannot alter it.
const KEY_RULE_TITLES = [
  "Adding and Subtracting Tens", "Multiplication and Division are Opposites",
  "Units of Time Order", "Time Relationships",
  "Multiplying by 10 and 100", "Dividing by 10 and 100",
  "Comparing Angles", "Turns and Directions",
  "The Probability Scale", "What a Fraction Is",
  "Reading the Clock", "am and pm", "Time Facts",
  "Divisibility Rules", "Compass Directions", "Units of Time",
  "The Five Chance Words", "Angle Sum Rules", "What a Fraction Means",
  "The Four Types of Angle", "Turns and Degrees",
  "Multiply and Divide by 10, 100, 1000", "Types of Angles", "Turn Facts",
  "Angle Rules", "Symmetry Rules", "The Mode", "The Median", "The Mean",
  "The Range", "Fraction of an Amount", "Probability as a Fraction",
  "Vertically Opposite Angles", "Multiplying Fractions", "Dividing Fractions",
  "Multiplying Decimals", "Dividing Decimals", "The Order of Operations (BODMAS)",
  "Commutative Law", "Associative Law", "Distributive Law",
  "The Probability Formula", "Equivalent and Simplifying",
].sort((a, b) => b.length - a.length); // longest first, so a short title can't shadow a longer one that also matches

function fixKeyRules(unit) {
  for (const rule of unit.reference?.rules || []) {
    if (!/^Key rule \d+$/.test(rule.title || "")) continue;
    const text = String(rule.text || "");
    const title = KEY_RULE_TITLES.find((t) => text.startsWith(t) && text.length > t.length + 15);
    if (!title) continue; // includes the handful of orphaned table cells with no body to split — left for a follow-up, not guessed at
    // A per-string proofreading edit can have already inserted a period right
    // after the heading to make the run-on readable ("…100. × 10: …") without
    // knowing the heading itself was about to be lifted out. Once it is, that
    // punctuation is an orphaned leading "." on the body — strip it along
    // with the whitespace.
    const rest = text.slice(title.length).replace(/^[\s.:;,]+/, "").trim();
    bump("key-rule", `${rule.title} | ${text.slice(0, 60)}`, `${title} | ${rest.slice(0, 60)}`);
    rule.title = title;
    rule.text = rest;
  }
  // Three source table rows landed as three separate placeholder cards
  // (heading-only, coin values, note values) instead of one. Fold them back
  // into two real cards rather than splitting on a heuristic that has no
  // sentence to anchor to here.
  const rules = unit.reference?.rules;
  if (!rules) return;
  const i = rules.findIndex((r) => r.title === "Key rule 4" && r.text === "Our Coins and Notes");
  if (i >= 0 && rules[i + 1]?.text?.startsWith("1 sh") && rules[i + 2]?.text?.startsWith("50 sh")) {
    bump("key-rule-coins", "3 cards: heading only / coins / notes", "2 cards: Coins / Notes");
    rules[i] = { title: "Coins", text: `${rules[i + 1].text}.` };
    rules[i + 1] = { title: "Notes", text: `${rules[i + 2].text}.` };
    rules.splice(i + 2, 1);
  }
}

// "Solution: " survives at the head of an answer the app labels itself.
function fixSolutionPrefix(unit) {
  const strip = (obj, key) => {
    const v = obj?.[key];
    if (typeof v !== "string") return;
    const next = v.replace(/^\s*Solution:\s+/i, "");
    if (next !== v) { bump("solution-prefix", v, next); obj[key] = next; }
  };
  for (const rp of unit.realProblems || []) { strip(rp, "answer"); strip(rp, "errorFeedback"); }
  for (const r of unit.reference?.rules || []) strip(r, "text");
  for (const we of unit.workedExamples || []) strip(we, "solution");
}

// Game descriptions were built as "Practise ${term.toLowerCase()} through four
// short challenges", which both reads as "Practise integer…" (a template verb
// paired with a noun it doesn't take) and, separately, wrecked any term that
// depends on its capitals: "GCF" became "gcf", "Venn diagram" became "venn
// diagram", "3D shape" became "3d shape". `game.skill` carries the same term
// WITHOUT that lower-casing (it is built from the glossary, not the
// description string), so use it as the source of truth for both the wording
// and the case.
function fixGameDescriptions(unit) {
  for (const game of unit.games?.games || []) {
    if (!/^Practise .+ through four short challenges\.$/.test(String(game.description || ""))) continue;
    const term = game.skill || String(game.description).match(/^Practise (.+) through/)[1];
    const next = `Four short challenges on ${term}.`;
    if (next === game.description) continue;
    bump("game-description", game.description, next);
    game.description = next;
  }
}

// `selfAssessment` is the learner's "I can…" checklist and was built by
// prefixing each outcome. Two things went wrong: where the outcome list itself
// began with the unit's introduction paragraphs, those became "I can this unit
// is designed for self-paced learning…"; and an outcome written in the second
// person kept it ("I can check your answers").
//
// Rebuild from the cleaned outcomes, which is what the field is: outcome N in
// the first person. Not narrated, so nothing is re-cut for this.
function toFirstPerson(outcome) {
  let s = String(outcome).trim().replace(/\s*[.]?\s*$/, ".");
  s = s[0].toLowerCase() + s.slice(1);
  s = s.replace(/\byourself\b/g, "myself")
    .replace(/\byours\b/g, "mine")
    .replace(/\byour\b/g, "my")
    .replace(/\bYour\b/g, "My");
  // "you" is the OBJECT only after a preposition or a ditransitive verb
  // ("help you calculate", "around you", "tells you") — convert those first.
  // Every other "you" in this corpus is the subject of its own clause
  // ("the rule you used", "before you calculate", "when you know"), which
  // needs "I", not "me". An earlier version defaulted every bare "you" to
  // "me" and produced "the sorting rule me used" and "before me calculate" —
  // checked against every "you" that survives outcome-filtering across all
  // 133 units before settling on this split.
  s = s.replace(/\b(around|help|helps|tell|tells|show|shows|give|gives|remind|reminds|for|beside|between|near|like|at|by|with)\s+you\b/g, (m, w) => `${w} me`)
    .replace(/\byou were\b/g, "I was")
    .replace(/\byou are\b/g, "I am")
    .replace(/\byou have\b/g, "I have")
    .replace(/\byou\b/g, "I");
  return `I can ${s}`;
}
// An outcome is a thing the learner can do. The unit's introduction, and the
// source's materials list, are neither — and both were imported into the array.
const NOT_AN_OUTCOME = [
  /^Required Materials\b/i,
  /^(This unit is (designed|built|written) for|Why do(es)? |Why are |As you work|Remember that mathematics|Welcome to|Keep a pencil)/i,
  /^(A|An|Some|Several|Paper|Safety|Small|Two|Three|Four) [^.]*\b(objects?|scissors|pencils?|crayons?|blocks?|cubes?|caps?|beans?|stones?|buttons?|beads?|shapes?|clock|ruler|counters?|paper|toys?|cards?|dice|die|jar|bottle|string|tape)\b[^.]*\.$/i,
];
function isOutcome(text) {
  const s = String(text).trim();
  if (s.length < 12) return false;
  return !NOT_AN_OUTCOME.some((re) => re.test(s));
}
// Nothing is deleted. The intro paragraphs are real learner text in the wrong
// field, and the materials list is what a Stage 1 grown-up needs before
// starting, so both move to `unitOverview` — which the app renders as
// paragraphs and, unlike every other subject, Mathematics does not narrate.
// Only the source's bare "Required Materials (…)" heading is dropped, because
// the sentence that replaces it says the same thing in the learner's language.
function fixOutcomesAndSelfAssessment(unit) {
  const before = unit.outcomes || [];
  const kept = before.filter(isOutcome);
  if (enabled("outcomes") && kept.length && kept.length !== before.length) {
    const moved = before.filter((o) => !isOutcome(o));
    const prose = moved.filter((o) => !/^Required Materials\b/i.test(o));
    const materialsHeading = moved.some((o) => /^Required Materials\b/i.test(o));
    const overview = String(unit.unit?.unitOverview || "");
    const additions = [];
    for (const p of prose) {
      const isMaterial = /^(A|An|Some|Several|Paper|Safety|Small|Two|Three|Four)\b/.test(p) && materialsHeading;
      additions.push(isMaterial ? `What you will need: ${p[0].toLowerCase()}${p.slice(1)}` : p);
    }
    // Merge consecutive "What you will need" lines into one sentence.
    const merged = [];
    for (const a of additions) {
      const prev = merged[merged.length - 1];
      if (prev && prev.startsWith("What you will need:") && a.startsWith("What you will need:")) merged[merged.length - 1] = `${prev.replace(/\.$/, "")} ${a.slice("What you will need: ".length)}`;
      else merged.push(a);
    }
    const toAdd = merged.filter((a) => !overview.includes(a.slice(0, 50)));
    if (toAdd.length && unit.unit) unit.unit.unitOverview = [overview.trim(), ...toAdd].join("\n\n");
    bump("outcomes", `${before.length} entries: ${moved.map((o) => o.slice(0, 40)).join(" / ")}`, `${kept.length} entries; ${toAdd.length} paragraph(s) moved to the overview`);
    unit.outcomes = kept;
  }
  if (!enabled("self-assessment")) return;
  const want = (unit.outcomes || []).slice(0, (unit.selfAssessment || []).length || 8).map(toFirstPerson);
  const cur = unit.selfAssessment || [];
  if (!want.length) return;
  const changed = want.length !== cur.length || want.some((w, i) => w !== cur[i]);
  if (!changed) return;
  bump("self-assessment", cur.filter((c, i) => c !== want[i])[0] || `${cur.length} entries`, want.filter((w, i) => w !== cur[i])[0] || `${want.length} entries`);
  unit.selfAssessment = want;
}

// ------------------------------------------------------------------ driver
let filesChanged = 0;
const files = [];
for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const data = path.join(mathRoot, gradeDir, "data");
  for (const f of ["course-manifest.json", "grade-capstone.json", "placement-exam.json"]) if (fs.existsSync(path.join(data, f))) files.push(path.join(data, f));
  for (const f of fs.readdirSync(path.join(data, "units")).sort()) files.push(path.join(data, "units", f));
}

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const json = JSON.parse(raw);
  const isUnit = /units[\\/]/.test(file);
  if (isUnit) {
    if (enabled("means-capital")) fixMeansCapital(json);
    if (enabled("practice-title")) fixPracticeTitles(json);
    if (enabled("key-rule")) fixKeyRules(json);
    if (enabled("solution-prefix")) fixSolutionPrefix(json);
    if (enabled("game-description")) fixGameDescriptions(json);
    fixOutcomesAndSelfAssessment(json);
  }
  // Text rules run last so they also clean anything the shaped rules moved.
  const visit = (node, p) => {
    if (Array.isArray(node)) node.forEach((v, i) => { if (typeof v === "string") { const n = textRules(v, p); if (n !== v) node[i] = n; } else visit(v, `${p}[${i}]`); });
    else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) {
      if (SKIP_KEYS.has(k)) continue;
      if (typeof v === "string") { const n = textRules(v, `${p}.${k}`); if (n !== v) node[k] = n; } else visit(v, p ? `${p}.${k}` : k);
    }
  };
  visit(json, "");
  const next = JSON.stringify(json, null, 2).split("\n").join(eol) + eol;
  if (next !== raw) {
    filesChanged += 1;
    if (write) fs.writeFileSync(file, next, "utf8");
  }
}

console.log(`${write ? "APPLIED" : "DRY RUN"} — ${filesChanged} file(s) changed\n`);
for (const [rule, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${rule}`);
  for (const [b, a] of samples[rule] || []) {
    const at = [...String(b)].findIndex((c, i) => c !== String(a)[i]);
    console.log(`           -  …${String(b).slice(Math.max(0, at - 40), at + 55)}…`);
    console.log(`           +  …${String(a).slice(Math.max(0, at - 40), at + 55)}…`);
  }
}
if (!write) console.log("\nRe-run with --write to apply.");
