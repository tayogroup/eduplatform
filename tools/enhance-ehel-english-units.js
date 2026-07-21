// Post-processes the English unit JSONs in place (idempotent, deterministic):
//   1. Grades 3-8: replaces the last six "What does 'X' mean?" checkpoint
//      questions with cloze-in-context questions built from the unit's own
//      reading passages — the blanked word IS the answer, so questions are
//      correct by construction.
//   2. Backfills missing Bloom levels on outcomes, inferred from the verb.
//   3. Stamps the official Cambridge framework (Primary English 0058 /
//      Lower Secondary English 0861) on each unit.
// Usage: node tools/enhance-ehel-english-units.js [grade ...]

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const englishRoot = path.join(root, "src", "prototypes", "ehel-academy", "english");
const grades = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [1, 2, 3, 4, 5, 6, 7, 8];

// Seeded RNG (mulberry32) so rebuilds are stable.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedFrom = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function cambridgeFor(grade) {
  return grade <= 6
    ? { level: "Cambridge Primary English", code: "0058", stage: grade }
    : { level: "Cambridge Lower Secondary English", code: "0861", stage: grade };
}

function inferBloom(outcomeText) {
  const t = String(outcomeText).toLowerCase();
  if (/\b(evaluate|judge|justify|critique|assess|defend)\b/.test(t)) return "Evaluate";
  if (/\b(compare|analyse|analyze|create|design|plan|organise|organize|compose|invent|develop|persuade|argue)\b/.test(t) || /write (a|an|your own) (story|essay|report|article|poem|letter)/.test(t)) return "Analyse and create";
  if (/\b(use|apply|practise|practice|write|ask|answer|form|make|act|read|spell|speak|describe|retell|present|perform)\b/.test(t)) return "Apply";
  return "Remember and understand";
}

// Split a passage into clean sentences.
function sentencesOf(passage) {
  return String(passage)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 35 && s.length <= 180 && /^[A-Z"“]/.test(s));
}

function buildCloze(unit, rng) {
  // The unit's taught words, exactly as spelled, from the vocab questions.
  // Some units number the word inside the quotes ("1. benign") — strip that.
  const words = unit.quizzes
    .map((q) => (q.question.match(/^What does '([^']{2,40})' mean\?$/) || [])[1])
    .filter(Boolean)
    .map((w) => w.replace(/^\d+\.\s*/, "").trim())
    .filter((w) => !w.includes(" ") && w.length >= 3);
  if (words.length < 4) return [];
  const sentences = (unit.readings || []).flatMap((r) => sentencesOf(r.passageScript || "").map((s) => ({ s, title: r.title })));
  const cloze = [];
  const usedWords = new Set(), usedSentences = new Set();
  for (const word of words) {
    if (cloze.length >= 6) break;
    if (usedWords.has(word.toLowerCase())) continue;
    // Match the exact word or a simple inflection (plural/-ed/-ing), but
    // always blank the form that actually appears and use it as the answer.
    const base = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${base}(?:s|es|ed|ing)?\\b`, "i");
    const hit = sentences.find(({ s }) => re.test(s) && !usedSentences.has(s));
    if (!hit) continue;
    const match = hit.s.match(re)[0]; // preserve the casing used in the text
    const blanked = hit.s.replace(re, "_____");
    if ((blanked.match(/_____/g) || []).length !== 1) continue;
    // Distractors: three other unit words, matched loosely on capitalisation.
    const others = words.filter((w) => w.toLowerCase() !== word.toLowerCase());
    if (others.length < 3) continue;
    const distractors = [];
    let idx = Math.floor(rng() * others.length);
    while (distractors.length < 3 && distractors.length < others.length) {
      const cand = others[idx % others.length]; idx += 1;
      const cased = /^[A-Z]/.test(match) ? cand[0].toUpperCase() + cand.slice(1) : cand.toLowerCase();
      if (!distractors.includes(cased) && cased.toLowerCase() !== match.toLowerCase()) distractors.push(cased);
    }
    if (distractors.length < 3) continue;
    usedWords.add(word.toLowerCase()); usedSentences.add(hit.s);
    const options = [match, ...distractors];
    const rot = Math.floor(rng() * options.length);
    cloze.push({
      question: `Choose the missing word from '${hit.title}': ${blanked}`,
      options: options.slice(rot).concat(options.slice(0, rot)).join(" | "),
      correctAnswer: match,
      explanation: `The text says: ${hit.s}`,
    });
  }
  return cloze;
}

let unitsTouched = 0, clozeAdded = 0, bloomFixed = 0, dupFixed = 0;
for (const grade of grades) {
  const dir = path.join(englishRoot, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const filePath = path.join(dir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const rng = makeRng(seedFrom(unit.unit?.unitId || `${grade}-${file}`));

    // 3) Cambridge framework stamp.
    const cambridge = cambridgeFor(grade);
    unit.cambridge = cambridge;
    unit.curriculumFramework = `${cambridge.level} ${cambridge.code} — Stage ${grade}`;

    // 2) Bloom backfill.
    for (const outcome of unit.outcomes || []) {
      if (!outcome.bloomLevel || outcome.bloomLevel === "?") {
        outcome.bloomLevel = inferBloom(outcome.learningOutcome);
        bloomFixed += 1;
      }
    }

    // 1) Cloze checkpoint questions (grades 3-8 only; 1-2 already varied).
    if (grade >= 3 && Array.isArray(unit.quizzes) && unit.quizzes.length >= 10) {
      const alreadyDone = unit.quizzes.some((q) => q.questionType === "Cloze in context");
      const cloze = buildCloze(unit, rng);
      if (cloze.length && !alreadyDone) {
        // Replace the LAST N vocab questions, keeping ids and sequence.
        const replaceable = unit.quizzes
          .map((q, i) => ({ q, i }))
          .filter(({ q }) => /^What does '[^']+' mean\?$/.test(q.question))
          .slice(-cloze.length);
        replaceable.forEach(({ q }, k) => {
          const item = cloze[k];
          q.questionType = "Cloze in context";
          q.question = item.question;
          q.options = item.options;
          q.correctAnswer = item.correctAnswer;
          q.explanation = item.explanation;
          q.origin = "Generated from this unit's reading passages";
          q.reviewStatus = "Auto-generated v1.0";
          clozeAdded += 1;
        });
      }
    }

    // Repair any quiz whose options contain duplicates (two Grade 2 spelling
    // questions shipped with a doubled misspelling): vary the duplicate by
    // swapping its final two letters so every option is distinct.
    for (const q of unit.quizzes || []) {
      const opts = q.options.split(" | ");
      const seen = new Set();
      const fixed = opts.map((o) => {
        let v = o;
        // Drop the doubled final letter first ("sunrisee" → "sunrise" is
        // taken → "sunris"); guaranteed to terminate by shrinking.
        while (seen.has(v) && v.length > 2) v = v.slice(0, -1);
        while (seen.has(v)) v = `${v}x`;
        if (v !== o && v === q.correctAnswer) v = `${v.slice(0, -1)}`;
        seen.add(v);
        return v;
      });
      if (fixed.join(" | ") !== q.options) { q.options = fixed.join(" | "); dupFixed += 1; }
    }

    fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`);
    unitsTouched += 1;
  }
}
console.log(`Units updated: ${unitsTouched} | cloze questions written: ${clozeAdded} | bloom levels backfilled: ${bloomFixed} | duplicate options repaired: ${dupFixed}`);
