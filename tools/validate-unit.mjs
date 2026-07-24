#!/usr/bin/env node
// Deep production acceptance gate for a course unit JSON (+ its games pack).
//
// Distilled from every defect class found across the Grade 1 audits, then made
// exhaustive: structural integrity, cross-references, per-item field checks and
// deep content checks for every section. A unit is production-ready only when
// this exits 0 AND a human has eyeballed the items flagged `note` (the handful
// of judgements a machine can't fully make).
//
// FAIL = an objective defect that must be fixed before shipping.
// note = needs a human eye (possible issue or unverifiable by machine).
//
// Usage:
//   node tools/validate-unit.mjs <unit.json> [...more]
//   node tools/validate-unit.mjs "src/prototypes/ehel-academy/english/grade-1/data/units/*.json"
//   node tools/validate-unit.mjs --quiet <unit.json>      # only print FAILs
// Exit 0 = all pass; 1 = at least one FAIL; 2 = usage / read error.

import fs from "node:fs";
import path from "node:path";

const rawArgs = process.argv.slice(2);
const QUIET = rawArgs.includes("--quiet");
// --strict-cambridge promotes "no objectives mapped" and "single-strand unit"
// from a note to a FAIL. Use it once outcomes carry cambridgeObjectives codes.
const STRICT = rawArgs.includes("--strict-cambridge");
const args = rawArgs.filter((a) => !a.startsWith("--"));
if (!args.length) {
  console.error("usage: node tools/validate-unit.mjs [--quiet] [--strict-cambridge] <unit.json> [...]");
  process.exit(2);
}
const files = args.flatMap((a) => {
  if (a.includes("*")) {
    const dir = path.dirname(a);
    const rx = new RegExp("^" + path.basename(a).replace(/[.]/g, "\\.").replace(/\*/g, ".*") + "$");
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => rx.test(f)).sort().map((f) => path.join(dir, f)) : [];
  }
  return [a];
});

// ── shared patterns ──────────────────────────────────────────────────────────
const BANNED_MEANING = /A naming word used when/i;
const BANNED_FRAMES = new Set(["This is a X.", "I can see a X.", "The X is here.", "I like the X.", "Can you point to the X?"]);
const GENERIC_COMP = [
  /^where does the story happen/i, /^what happens first/i, /^what happens at the end/i,
  /^how does the (main )?character feel\??$/i, /^which language pattern/i, /^name one thing the learner/i,
  /^what happens in the (story|text)\??$/i,
];
const PLACEHOLDER = /\b(TBD|TODO|FIXME|Lorem ipsum|XXXX?)\b|(?:^|\s)---(?:\s|$)|\bplaceholder\b/i;
const MOJIBAKE = /�|Ã[©¨¤¢°½¼ ]|â€[™œ“”]|Â[ °]/;
// a/an: "a" immediately before a vowel-SOUND word (allow genuine consonant-sound vowels)
// Words spelled with a leading vowel but pronounced with a consonant sound —
// "a unicorn / a European / a one-off" are correct, not errors.
const CONSONANT_SOUND = /^(uni|use|user|useful|usual|uniform|unit|unicorn|europ|euro|ewe|one|once|u)$/;
// An article introduces a noun phrase, so it is NEVER followed by a function
// word. When it appears to be, we're looking at a word LIST ("cards for I, see,
// a and can") or phoneme notation ("/a/ as in apple"), not a grammar error.
const NEVER_AFTER_ARTICLE = new Set([
  "and", "or", "but", "if", "as", "is", "am", "are", "was", "were", "be", "been",
  "of", "to", "in", "on", "at", "by", "for", "from", "with", "into", "onto",
  "the", "a", "an", "it", "its", "i", "he", "she", "they", "we", "you", "us",
  "our", "his", "her", "their", "your", "my", "me", "him", "them", "that",
  "this", "these", "those", "who", "which", "when", "where", "why", "how",
  "also", "again", "away", "up", "out", "off", "over", "under", "after", "each",
]);
// Tokenised so we never mistake a letter-label ("Version A or") or a vowel that
// merely sits inside a word ("du'a of") for the indefinite article. The article
// is a STANDALONE "a" (lowercase anywhere; capital only at a sentence start),
// immediately before a vowel-sound word.
function articleHits(s) {
  const out = [];
  const toks = String(s).split(/\s+/);
  for (let i = 0; i < toks.length - 1; i++) {
    // The article is a CLEAN standalone token. Reject "/a/" (phoneme notation)
    // and "a," (a letter in an enumeration like "a, e, i, o, u") — an article is
    // never slash-wrapped nor comma-terminated. Only quotes/brackets may wrap it.
    if (!/^["'“‘(\[]*[aA][)\]"'”’]*$/.test(toks[i])) continue;
    const art = toks[i].replace(/[^A-Za-z]/g, "");                  // now safely just "a"/"A"
    if (art !== "a" && art !== "A") continue;                       // internal-apostrophe words (du'a) never equal "a"
    if (art === "A" && !(i === 0 || /[.!?:;"”’)]$/.test(toks[i - 1] || ""))) continue; // capital A = article only at sentence start
    const w = toks[i + 1].replace(/[^A-Za-z'’-]/g, "").toLowerCase();
    if (!/^[aeiou]/.test(w)) continue;
    const head = w.replace(/[^a-z].*/, "");
    if (CONSONANT_SOUND.test(head) || /^(uni|use|usu|one|onc|euro|ewe)/.test(w)) continue;
    if (NEVER_AFTER_ARTICLE.has(head)) continue;   // word list / notation, not an article
    out.push(`${art} ${w}`);
  }
  return out;
}
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
const norm = (s) => String(s || "").trim();
const isBlank = (s) => typeof s !== "string" || !s.trim();
function containsWord(sentence, word) {
  if (!word) return true;
  const t = String(sentence).toLowerCase();
  const w = String(word).toLowerCase();
  if (t.includes(w)) return true;                          // whole word / phrase
  const bare = w.replace(/[^a-z]/g, "");
  if (bare.length >= 4) {                                   // allow inflection
    const stem = bare.slice(0, Math.max(4, bare.length - 2));
    return t.replace(/[^a-z]+/g, " ").split(" ").some((tok) => tok.startsWith(stem));
  }
  return new RegExp(`\\b${bare}\\b`).test(t.replace(/[^a-z]+/g, " "));
}
function* allStrings(obj, p = "") {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) yield* allStrings(obj[i], `${p}[${i}]`);
  } else if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) yield* allStrings(obj[k], p ? `${p}.${k}` : k);
  } else if (typeof obj === "string") {
    yield [p, obj];
  }
}
const dupList = (arr) => { const seen = new Set(), d = new Set(); for (const x of arr) { if (seen.has(x)) d.add(x); else seen.add(x); } return [...d]; };
// The headword: masterWord when present (Grade 1), else the vocabularyId slug
// tail (Grades 3–8 omit masterWord). Multi-word slugs use "-" so keep the tail.
function wordOf(e) {
  if (e.masterWord) return e.masterWord;
  const m = /-([a-z][a-z-]*?)$/i.exec(e.vocabularyId || "");
  return m ? m[1].replace(/-/g, " ") : "";
}

// ── the validator ────────────────────────────────────────────────────────────
function validate(file) {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const fails = [], notes = [];
  const F = (cond, label, detail) => { if (!cond) fails.push(`${label}${detail ? " — " + detail : ""}`); };
  const N = (msg) => notes.push(msg);
  const unitId = d.unit?.unitId;
  const get = (s) => Array.isArray(d[s]) ? d[s] : [];

  // ═══ 0. STRUCTURAL INTEGRITY ═══
  for (const s of ["unit", "dictionaryLinks", "readings", "comprehension", "grammar", "speaking", "writing", "activities", "quizzes", "outcomes"]) {
    F(d[s] !== undefined, "structure: missing section", s);
  }
  // id uniqueness per section
  const idKey = { dictionaryLinks: "vocabularyId", comprehension: "questionId", grammar: "grammarId", speaking: "speakingId", writing: "writingId", activities: "activityId", quizzes: "questionId", liveSessions: "liveSessionId", outcomes: "outcomeId", selfAssessment: "selfAssessmentId", rubrics: "criterionId", readings: "readingId", assignments: "assignmentId", answerKey: "answerId" };
  for (const [s, k] of Object.entries(idKey)) {
    const ids = get(s).map((x) => x[k]).filter(Boolean);
    const dups = dupList(ids);
    F(dups.length === 0, `structure: duplicate ${k}`, dups.slice(0, 3).join(", "));
    F(ids.length === get(s).length, `structure: missing ${k}`, `${ids.length}/${get(s).length} have an id`);
  }
  // unitId consistency
  if (unitId) {
    let mismatch = 0;
    for (const s of Object.keys(idKey)) for (const it of get(s)) if (it.unitId && it.unitId !== unitId) mismatch++;
    F(mismatch === 0, "structure: unitId mismatch", `${mismatch} items disagree with ${unitId}`);
  }
  // cross-references resolve
  const outIds = new Set(get("outcomes").map((o) => o.outcomeId));
  const readIds = new Set(get("readings").map((r) => r.readingId));
  const rubricIds = new Set(get("rubrics").map((r) => r.rubricId));
  const contentIds = new Set();
  for (const [s, k] of [["comprehension", "questionId"], ["quizzes", "questionId"], ["grammar", "grammarId"], ["writing", "writingId"], ["speaking", "speakingId"], ["activities", "activityId"], ["readings", "readingId"]]) get(s).forEach((it) => contentIds.add(it[k]));
  const orphanRead = get("comprehension").filter((c) => c.readingId && !readIds.has(c.readingId));
  F(orphanRead.length === 0, "xref: comprehension.readingId", `${orphanRead.length} point to a missing reading`);
  const orphanSelfOut = get("selfAssessment").filter((s) => s.outcomeId && !outIds.has(s.outcomeId));
  F(orphanSelfOut.length === 0, "xref: selfAssessment.outcomeId", `${orphanSelfOut.length} point to a missing outcome`);
  const orphanAk = get("answerKey").filter((a) => a.contentId && !contentIds.has(a.contentId));
  F(orphanAk.length === 0, "xref: answerKey.contentId", `${orphanAk.length} point to no content item`);
  const orphanRubric = get("writing").filter((w) => w.rubricId && rubricIds.size && !rubricIds.has(w.rubricId));
  if (orphanRubric.length) N(`xref note: ${orphanRubric.length} writing.rubricId don't resolve to a rubric`);
  // outcomeId soft-resolve (optional field on many items)
  let outMiss = 0;
  for (const s of ["comprehension", "quizzes", "grammar", "speaking", "writing", "activities"]) for (const it of get(s)) if (it.outcomeId && !outIds.has(it.outcomeId)) outMiss++;
  if (outMiss) N(`xref note: ${outMiss} items have an outcomeId that doesn't resolve to an outcome`);

  // ═══ 1. TEXT MECHANICS (global) ═══
  let moji = 0, placeholders = 0, tabs = 0, nbsp = 0, trailing = 0;
  const artFail = [], artNote = [];
  // Learner content: a/an is NEVER intentionally wrong here → hard FAIL.
  const ART_FAIL = /(childMeaning|exampleSentence|practiceSentences|passageScript|instructionsAndModelLines|promptAndInstructions|instructionsAndItems|\.question|correctAnswer|\.options|sentenceStarter|\.prompt|modelText)/;
  // Grammar teaching / meta text may deliberately QUOTE a wrong "a apple" to
  // correct it (commonMistake/explanation), and prose fields are freeform → NOTE.
  const ART_NOTE = /(commonMistake|explanation|memoryTip|ruleAndExamples|\.note|aiTutorPrompt|agenda|learningOutcome|overview|learningPath)/;
  for (const [pth, s] of allStrings(d)) {
    if (MOJIBAKE.test(s)) { moji++; if (moji <= 3) N(`mojibake at ${pth}: "${s.slice(0, 40)}"`); }
    if (PLACEHOLDER.test(s)) placeholders++;
    if (/\t/.test(s)) tabs++;
    if (/ /.test(s)) nbsp++;
    if (/^\s|\s$/.test(s) && s.trim()) trailing++;
    const hits = articleHits(s);
    if (hits.length) {
      if (ART_FAIL.test(pth)) hits.forEach((h) => artFail.push(`${pth}: ${h}`));
      else if (ART_NOTE.test(pth)) hits.forEach((h) => artNote.push(`${pth}: ${h}`));
      else hits.forEach((h) => artFail.push(`${pth}: ${h}`)); // unknown field: fail-safe to FAIL
    }
  }
  F(moji === 0, "mechanics: encoding corruption", `${moji} strings with mojibake/replacement chars`);
  F(placeholders === 0, "mechanics: placeholder text", `${placeholders} strings`);
  F(artFail.length === 0, "mechanics: a/an before vowel sound", `${artFail.length} hits e.g. ${artFail[0] || ""}`);
  if (artNote.length) N(`a/an note: ${artNote.length} hit(s) in teaching/meta fields — confirm each is a deliberately-quoted wrong example, not a real error (e.g. ${artNote[0]})`);
  if (tabs) N(`mechanics note: ${tabs} strings contain a tab character`);
  if (nbsp) N(`mechanics note: ${nbsp} strings contain a non-breaking space`);
  if (trailing) N(`mechanics note: ${trailing} strings have leading/trailing whitespace`);
  // double spaces (mid-line, not indentation)
  let dbl = 0; for (const [, s] of allStrings(d)) if (/\S {2,}\S/.test(s)) dbl++;
  F(dbl === 0, "mechanics: double spaces", `${dbl} strings`);

  // ═══ 2. VOCABULARY (deep) ═══
  const dl = get("dictionaryLinks");
  const meanings = dl.map((e) => norm(e.childMeaning));
  F(meanings.filter((m) => BANNED_MEANING.test(m)).length === 0, "vocab: templated childMeaning", `${meanings.filter((m) => BANNED_MEANING.test(m)).length}`);
  F(new Set(meanings).size >= Math.floor(meanings.length * 0.95) || !meanings.length, "vocab: childMeaning distinctness", `${new Set(meanings).size}/${meanings.length} distinct`);
  let badCount = 0, wordMissing = 0, dupPractice = 0, exDup = 0, meaningLen = 0, spellMismatch = 0, audioLen = 0, sentMech = 0;
  for (const e of dl) {
    const w = wordOf(e);
    const ps = e.practiceSentences || [];
    if (ps.length !== 5) badCount++;
    if (new Set(ps).size !== ps.length) dupPractice++;
    if (ps.includes(e.exampleSentence)) exDup++;
    const missing = ps.filter((s) => !containsWord(s, w)).length + (containsWord(e.exampleSentence, w) ? 0 : 1);
    if (missing > 1) wordMissing++;
    const mw = words(e.childMeaning).length;
    if (e.childMeaning && (mw < 5 || mw > 22)) meaningLen++;
    // every discrete vocab sentence: capital start + terminal punctuation
    for (const s of [e.exampleSentence, ...ps]) { if (!s) continue; const t = s.trim(); if (/^[a-z]/.test(t) || !/[.!?"]$/.test(t)) sentMech++; }
    // spellingPractice should spell the word
    const sp = /:\s*(.+)$/.exec(e.spellingPractice || "");
    if (sp && w) { const letters = sp[1].replace(/[^a-z]/gi, "").toLowerCase(); const bare = w.replace(/[^a-z]/gi, "").toLowerCase(); if (letters && bare && letters !== bare) spellMismatch++; }
    // sentenceAudio length should track practiceSentences
    if (Array.isArray(e.sentenceAudio) && e.sentenceAudio.length && e.sentenceAudio.length !== ps.length) audioLen++;
  }
  F(badCount === 0, "vocab: practiceSentences count", `${badCount} entries not exactly 5`);
  F(wordMissing === 0, "vocab: word present in its sentences", `${wordMissing} entries miss the word in >1 sentence`);
  F(dupPractice === 0, "vocab: duplicate practice sentences", `${dupPractice} entries`);
  F(sentMech === 0, "vocab: sentence capitalisation/end-punctuation", `${sentMech} sentences`);
  if (exDup) N(`vocab note: ${exDup} entries reuse the exampleSentence as practice sentence 1 (redundant — the child sees it twice)`);
  let frameSets = 0;
  for (const e of dl) { const w = wordOf(e); if (!w) continue; const set = new Set((e.practiceSentences || []).map((s) => s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "X"))); if (set.size === BANNED_FRAMES.size && [...set].every((x) => BANNED_FRAMES.has(x))) frameSets++; }
  F(frameSets === 0, "vocab: banned practice-frame sets", `${frameSets} entries`);
  if (meaningLen) N(`vocab note: ${meaningLen} childMeanings outside 5–22 words`);
  if (spellMismatch) N(`vocab note: ${spellMismatch} spellingPractice strings don't spell the headword`);
  if (audioLen) N(`vocab note: ${audioLen} entries where sentenceAudio length ≠ practiceSentences length (audio out of sync)`);
  // vocabularyGroups ↔ dictionaryLinks integrity
  const vg = get("vocabularyGroups");
  if (vg.length) {
    const grouped = vg.flatMap((g) => g.vocabularyIds || []);
    const dlIds = new Set(dl.map((e) => e.vocabularyId));
    const groupedSet = new Set(grouped);
    F(dupList(grouped).length === 0, "vocab: word in >1 group", dupList(grouped).slice(0, 3).join(", "));
    F(grouped.every((id) => dlIds.has(id)), "vocab: group lists a missing word", grouped.filter((id) => !dlIds.has(id)).slice(0, 3).join(", "));
    const ungrouped = [...dlIds].filter((id) => !groupedSet.has(id));
    F(ungrouped.length === 0, "vocab: word in no group", ungrouped.slice(0, 3).join(", "));
  }
  // aiTutorPrompt distinctness
  const tutor = dl.map((e) => norm(e.aiTutorPrompt)).filter(Boolean);
  if (tutor.length) F(new Set(tutor).size >= Math.floor(tutor.length * 0.9), "vocab: aiTutorPrompt distinctness", `${new Set(tutor).size}/${tutor.length} distinct`);

  // ═══ 3. GRAMMAR (deep) ═══
  const gr = get("grammar");
  for (const f of ["ruleAndExamples", "explanation", "commonMistake", "memoryTip", "practice", "title"]) {
    const blank = gr.filter((g) => isBlank(g[f])).length;
    F(blank === 0, `grammar: blank ${f}`, `${blank} items`);
  }
  F(gr.filter((g) => /^Language pattern \d+$/.test(g.title || "")).length === 0, "grammar: filler titles", "");
  for (const f of ["title", "explanation", "commonMistake", "memoryTip"]) {
    const vals = gr.map((g) => norm(g[f])).filter(Boolean);
    if (vals.length > 2) F(new Set(vals).size === vals.length, `grammar: duplicate ${f}`, `${new Set(vals).size}/${vals.length} distinct`);
  }
  // a/an frame: a learner-fill frame ending "a ___" must present "a / an"
  const badFrames = gr.filter((g) => /\ba ___(?!\s*\/)/.test(g.ruleAndExamples || "") && !/a \/ an/.test(g.ruleAndExamples || ""));
  F(badFrames.length === 0, "grammar: 'a ___' frame without a/an", badFrames.map((g) => g.grammarId).slice(0, 3).join(", "));

  // ═══ 4. READINGS (deep) ═══
  const rd = get("readings");
  for (const r of rd) {
    if (isBlank(r.passageScript)) F(false, "reading: blank passage", r.readingId);
    else if (r.passageScript.length < 60) N(`reading note: ${r.readingId} passage very short (${r.passageScript.length} chars)`);
    if (/(Teacher Lesson Plan|Weekly Objectives|^Pre-Unit \d)/m.test(r.passageScript || "") && !/phonics/i.test(r.type || "")) N(`reading note: ${r.readingId} passage may contain a leaked teacher-guide header`);
    if (/[“”].*".*"|".*".*[“”]/.test((r.passageScript || "").replace(/\n/g, " "))) N(`reading note: ${r.readingId} mixes straight and typographic quotes`);
  }
  F(new Set(rd.map((r) => r.title)).size === rd.length || rd.length < 2, "reading: duplicate titles", "");

  // ═══ 5. COMPREHENSION (deep) ═══
  const comp = get("comprehension");
  F(new Set(comp.map((c) => c.question)).size === comp.length, "comprehension: duplicate questions", `${new Set(comp.map((c) => c.question)).size}/${comp.length}`);
  F(comp.filter((c) => GENERIC_COMP.some((rx) => rx.test((c.question || "").trim()))).length === 0, "comprehension: generic questions", "");
  for (const f of ["question", "correctAnswer", "explanation"]) F(comp.filter((c) => isBlank(c[f])).length === 0, `comprehension: blank ${f}`, `${comp.filter((c) => isBlank(c[f])).length}`);
  F(comp.filter((c) => c.marks !== undefined && !(Number(c.marks) >= 0)).length === 0, "comprehension: non-numeric marks", "");

  // ═══ 6. QUIZ (deep) ═══
  const qz = get("quizzes");
  let badOpts = 0, ansMiss = 0, optQ = 0, blankExp = 0; const pos = {};
  for (const q of qz) {
    const opts = String(q.options || "").split("|").map((o) => o.trim());
    const ans = norm(q.correctAnswer);
    if (opts.length !== 4 || new Set(opts).size !== 4 || opts.some((o) => !o)) badOpts++;
    else if (!opts.includes(ans)) ansMiss++;
    else pos[opts.indexOf(ans) + 1] = (pos[opts.indexOf(ans) + 1] || 0) + 1;
    if (opts.includes(norm(q.question))) optQ++;
    if (isBlank(q.explanation)) blankExp++;
  }
  F(badOpts === 0, "quiz: options not 4-unique-nonempty", `${badOpts}`);
  F(ansMiss === 0, "quiz: answer not among options", `${ansMiss}`);
  F(optQ === 0, "quiz: an option equals the question", `${optQ}`);
  F(blankExp === 0, "quiz: blank explanation", `${blankExp}`);
  F(new Set(qz.map((q) => q.question)).size === qz.length, "quiz: duplicate stems", `${new Set(qz.map((q) => q.question)).size}/${qz.length}`);
  const totPos = Object.values(pos).reduce((a, b) => a + b, 0), maxPos = Math.max(0, ...Object.values(pos));
  F(totPos === 0 || maxPos <= Math.ceil(totPos * 0.4), "quiz: answer-position skew", `positions ${JSON.stringify(pos)} (max ${maxPos}/${totPos}, cap ${Math.ceil(totPos * 0.4)})`);
  // longest-option-is-answer tell
  let longestAns = 0;
  for (const q of qz) { const opts = String(q.options || "").split("|").map((o) => o.trim()); const ans = norm(q.correctAnswer); if (opts.length === 4 && ans && opts.every((o) => o.length <= ans.length) && new Set(opts.map((o) => o.length)).size > 1) longestAns++; }
  if (longestAns > Math.ceil(qz.length * 0.5) && qz.length) N(`quiz note: correct answer is the longest option in ${longestAns}/${qz.length} items (a test-taking tell)`);
  const catQ = qz.filter((q) => /which (word|one) (belongs to|names?|is a|is the)/i.test(q.question || ""));
  if (catQ.length) N(`manual-review: ${catQ.length} category quiz(zes) e.g. "${catQ[0].question}" — confirm the 3 wrong options are a DIFFERENT category`);

  // ═══ 7. TASKS: speaking / writing / activities (deep) ═══
  for (const [sec, field] of [["speaking", "instructionsAndModelLines"], ["writing", "promptAndInstructions"], ["activities", "instructionsAndItems"]]) {
    const items = get(sec);
    const vals = items.map((x) => norm(x[field]));
    if (vals.length > 1) F(new Set(vals).size === vals.length, `${sec}: duplicate instructions`, `${new Set(vals).size}/${vals.length}`);
    F(items.filter((x) => isBlank(x[field])).length === 0, `${sec}: blank instruction`, "");
    const tooShort = vals.filter((v) => v && words(v).length < 4).length;
    if (tooShort) N(`${sec} note: ${tooShort} instructions under 4 words`);
    const titles = items.map((x) => norm(x.title)).filter(Boolean);
    if (titles.length > 1 && new Set(titles).size < titles.length) N(`${sec} note: duplicate titles (${new Set(titles).size}/${titles.length})`);
  }

  // ═══ 8. LIVE SESSIONS (deep) ═══
  const ls = get("liveSessions");
  for (const f of ["title", "agenda"]) F(ls.filter((s) => isBlank(typeof s[f] === "string" ? s[f] : JSON.stringify(s[f]))).length === 0, `liveSessions: blank ${f}`, "");
  if (ls.length > 1) N(new Set(ls.map((s) => norm(s.title))).size === ls.length ? "" : `liveSessions note: duplicate session titles`);

  // ═══ 9. OUTCOMES / SELF-ASSESSMENT / RUBRICS (deep) ═══
  const oc = get("outcomes");
  F(new Set(oc.map((o) => norm(o.learningOutcome))).size === oc.length || oc.length < 2, "outcomes: duplicate learningOutcome", "");
  F(oc.filter((o) => isBlank(o.learningOutcome) || isBlank(o.evidenceOfLearning)).length === 0, "outcomes: blank outcome/evidence", "");
  if (oc.some((o) => o && typeof o === "object" && "bloomLevel" in o)) F(oc.filter((o) => isBlank(o.bloomLevel)).length === 0, "outcomes: blank bloomLevel", "");
  const sa = get("selfAssessment");
  F(new Set(sa.map((s) => norm(s.statement))).size === sa.length || sa.length < 2, "selfAssessment: duplicate statements", "");
  const notIcan = sa.filter((s) => s.statement && !/^I (can|know|am)/i.test(s.statement.trim())).length;
  if (notIcan) N(`selfAssessment note: ${notIcan} statements not in the child's "I can…" voice`);
  const rb = get("rubrics");
  for (const f of ["level1", "level2", "level3", "level4", "criterion"]) F(rb.filter((r) => isBlank(r[f])).length === 0, `rubrics: blank ${f}`, `${rb.filter((r) => isBlank(r[f])).length}`);
  F(rb.filter((r) => r.maximumMarks !== undefined && !(Number(r.maximumMarks) > 0)).length === 0, "rubrics: bad maximumMarks", "");
  for (const t of new Set(rb.map((r) => r.target))) { const crit = rb.filter((r) => r.target === t).map((r) => norm(r.criterion)); if (crit.length > 1 && new Set(crit).size < crit.length) F(false, `rubrics: duplicate criterion for ${t}`, ""); }

  // ═══ 10. ANSWER KEY (deep) ═══
  const ak = get("answerKey");
  const akFiller = ak.filter((a) => /^Accept an accurate detail/i.test(a.answerOrGuidance || "")).length;
  F(akFiller <= 1, "answerKey: repeated filler guidance", `${akFiller} "accept an accurate detail" entries`);
  F(ak.filter((a) => isBlank(a.answerOrGuidance)).length === 0, "answerKey: blank guidance", "");

  // ═══ 11. TEACHER NOTES ═══
  const tn = get("teacherNotes");
  if (tn.length) { const hasSafety = tn.some((n) => /adult|caregiver|supervis|present|not.*(alone|leave)/i.test(n.note || "")); if (!hasSafety) N("teacherNotes note: no device-safety / adult-present note found"); }

  // ═══ 12. CAMBRIDGE CURRICULUM ALIGNMENT (stage / strand / objective codes) ═══
  // Objective code = <stage><reportingCode>.<nn>, e.g. 1Rw.01 (Cambridge Primary
  // English 0058). Validates that the unit's declared stage matches its grade,
  // that every objective it claims is REAL and belongs to THAT stage, and reports
  // strand coverage. Frameworks not shipped as JSON (e.g. 0861 Lower Secondary)
  // are skipped with a note rather than guessed at.
  const camb = d.cambridge || {};
  const gradeNum = Number(String(d.unit?.gradeId || "").replace(/\D/g, "")) || null;
  F(!isBlank(camb.level) && !isBlank(String(camb.code ?? "")), "cambridge: missing level/code", "");
  if (camb.stage !== undefined) {
    F(Number(camb.stage) > 0, "cambridge: invalid stage", String(camb.stage));
    if (gradeNum) F(Number(camb.stage) === gradeNum, "cambridge: stage ≠ grade", `stage ${camb.stage} vs grade ${gradeNum}`);
  } else F(false, "cambridge: missing stage", "");
  if (d.curriculumFramework && camb.stage !== undefined && !String(d.curriculumFramework).includes(String(camb.stage)))
    N(`cambridge note: curriculumFramework "${d.curriculumFramework}" doesn't mention stage ${camb.stage}`);

  // collect every objective code the unit claims, wherever it is declared
  const CODE_RE = /^([1-9])(R[wvgsia]|W[wvgscpa]|SL[msgpr])\.(\d{2})$/;
  const claimed = [];
  for (const [pth, s] of allStrings(d)) {
    if (/cambridgeObjectives?|objectiveCodes?|learningObjectiveCodes?/i.test(pth) && CODE_RE.test(s.trim())) claimed.push([pth, s.trim()]);
  }
  const fwPath = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "src", "curriculum", `cambridge-english-${camb.code}.json`);
  let fw = null;
  if (fs.existsSync(fwPath)) { try { fw = JSON.parse(fs.readFileSync(fwPath, "utf8")); } catch { /* ignore */ } }

  if (!fw) {
    N(`cambridge note: no framework file for code ${camb.code} (expected src/curriculum/cambridge-english-${camb.code}.json) — objective validation skipped`);
    if (claimed.length) N(`cambridge note: ${claimed.length} objective code(s) claimed but not verifiable without the framework`);
  } else {
    const stageKey = String(camb.stage);
    const stageObjs = fw.objectivesByStage?.[stageKey] || [];
    const validCodes = new Set(stageObjs.map((o) => o.code));
    const allCodes = new Set(Object.values(fw.objectivesByStage || {}).flat().map((o) => o.code));
    const unknown = claimed.filter(([, c]) => !allCodes.has(c));
    const wrongStage = claimed.filter(([, c]) => allCodes.has(c) && !validCodes.has(c));
    F(unknown.length === 0, "cambridge: unknown objective code", unknown.slice(0, 3).map(([p, c]) => `${c} @ ${p}`).join(", "));
    F(wrongStage.length === 0, "cambridge: objective from the wrong stage", wrongStage.slice(0, 3).map(([p, c]) => `${c} (unit is stage ${stageKey}) @ ${p}`).join(", "));
    const uniq = [...new Set(claimed.map(([, c]) => c))].filter((c) => validCodes.has(c));
    if (!claimed.length) {
      N(`cambridge: unit declares Stage ${stageKey} but maps 0 learning objectives — alignment is unevidenced (${stageObjs.length} objectives available for this stage). Add cambridgeObjectives:["${stageObjs[0]?.code || "1Rw.01"}", …] to each outcome.`);
      if (STRICT) F(false, "cambridge (strict): no objectives mapped", `0 of ${stageObjs.length} stage-${stageKey} objectives referenced`);
    } else {
      const byStrand = {};
      for (const c of uniq) { const o = stageObjs.find((x) => x.code === c); if (o) byStrand[o.strand] = (byStrand[o.strand] || 0) + 1; }
      const strands = Object.keys(byStrand);
      N(`cambridge: ${uniq.length} objective(s) mapped — strands ${JSON.stringify(byStrand)}`);
      if (strands.length < 2) {
        N(`cambridge note: only ${strands.length} strand covered; Cambridge advises planning across more than one strand`);
        if (STRICT) F(false, "cambridge (strict): single-strand unit", strands.join(", "));
      }
    }
  }

  // ═══ 13. GAMES PACK (companion file, deep) ═══
  const gamesPath = path.join(path.dirname(file), "..", "games", path.basename(file));
  if (fs.existsSync(gamesPath)) {
    let gp; try { gp = JSON.parse(fs.readFileSync(gamesPath, "utf8")); } catch (e) { fails.push(`games: parse error — ${e.message}`); gp = null; }
    if (gp) {
      if (gp.unitId && unitId) F(gp.unitId === unitId, "games: unitId mismatch", `${gp.unitId} ≠ ${unitId}`);
      const meaningSet = new Set(dl.map((e) => norm(e.childMeaning)));
      const unitWords = new Set(dl.map((e) => wordOf(e).toLowerCase()).filter(Boolean));
      const gameIds = (gp.games || []).map((g) => g.id);
      F(dupList(gameIds).length === 0, "games: duplicate game ids", dupList(gameIds).join(", "));
      let gBadAns = 0, gTemplated = 0, gStale = 0, gDup = 0, gEmpty = 0, gBlankExp = 0, gBadField = 0, gSpellStale = 0, gRounds = 0;
      for (const game of gp.games || []) {
        if (["id", "type", "title", "skill"].some((k) => isBlank(game[k]))) gBadField++;
        const rounds = game.rounds || [];
        if (!rounds.length) gEmpty++;
        const questionLike = game.type === "choice" || game.type === "pairs";
        const seen = new Set();
        for (const r of rounds) {
          gRounds++;
          const key = questionLike ? norm(r.prompt) : JSON.stringify(r.answer ?? r.solution ?? r.sequence ?? r.pairs ?? r.tokens ?? r.prompt);
          if (seen.has(key)) gDup++; else seen.add(key);
          if (Array.isArray(r.choices) && r.answer !== undefined) {
            if (!r.choices.includes(r.answer) || new Set(r.choices).size !== r.choices.length || r.choices.some((c) => isBlank(String(c)))) gBadAns++;
            if (game.type === "choice" && isBlank(r.explanation)) gBlankExp++;
          }
          if (BANNED_MEANING.test(`${r.prompt || ""} ${r.explanation || ""}`)) gTemplated++;
          const mm = /means:\s*(.+?)(?:["”]|$)/i.exec(r.prompt || "");
          if (mm && meaningSet.size) { const q = mm[1].trim().replace(/["“”]/g, ""); if (![...meaningSet].some((m) => m && (q.includes(m) || m.includes(q)))) gStale++; }
          if (game.type === "spelling" && r.answer && unitWords.size && !unitWords.has(String(r.answer).toLowerCase())) gSpellStale++;
        }
      }
      F(gBadField === 0, "games: game missing id/type/title/skill", `${gBadField}`);
      F(gEmpty === 0, "games: game with no rounds", `${gEmpty}`);
      F(gTemplated === 0, "games: templated meanings", `${gTemplated} rounds quote the banned generic meaning`);
      F(gStale === 0, "games: meaning out of sync with dictionary", `${gStale} rounds`);
      F(gBadAns === 0, "games: choice round invalid", `${gBadAns} (answer∉choices / dup / blank)`);
      F(gDup === 0, "games: duplicate rounds", `${gDup}`);
      F(gBlankExp === 0, "games: choice round blank explanation", `${gBlankExp}`);
      if (gSpellStale) N(`games note: ${gSpellStale} spelling targets are not this unit's words`);
    }
  } else {
    N("games note: no companion games/unit-N.json found");
  }

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
  console.log(`\n${ok ? "✓" : "✗"} ${path.basename(f)}${ok ? "  — all objective checks pass" : ""}`);
  for (const x of r.fails) console.log(`   FAIL  ${x}`);
  if (!QUIET) for (const n of r.notes) console.log(`   note  ${n}`);
}
if (files.length > 1) {
  console.log("\n── summary ──");
  for (const [f, s] of summary) console.log(`   ${s.includes("FAIL") || s === "ERROR" ? "✗" : "✓"} ${f.padEnd(16)} ${s}`);
}
console.log("");
process.exit(anyFail ? 1 : 0);
