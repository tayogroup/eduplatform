#!/usr/bin/env node
// English Core words — assemble a review draft from content that already exists.
//
// For each Core word this finds the best source available and fills
// in what it can, so a reviewer reads a mostly-complete draft rather than a
// blank form. It NEVER invents a child meaning: a word with no meaning anywhere
// comes back with `childMeaning: null` and a status saying so. Fabricated
// teaching content that reads plausibly is worse than an obvious gap.
//
// Statuses, in the order the tool prefers them:
//   reused  a complete link at THIS grade — meaning, five sentences, audio already paid for
//   topup   a meaning at this grade, but fewer than five sentences; the rest mined
//   adapt   complete one grade above, so close enough to use as written
//   repitch complete only well above this grade — pitched above this reader, needs rewording
//   mined   no meaning anywhere, but this grade's readings supply the sentences
//   author  nothing to build on
//
// Mined sentences come from this grade's reading passages, preferring the word's
// own unit so a child meets it in text they have read. For very high-frequency
// words the mined set is marked `weak`: "the" appears in 153 sentences and none
// of them is ABOUT "the", so those need a human choice rather than the top five.
//
//   node tools/draft-english-core-words.mjs --grade 2           # writes the draft + a summary
//   node tools/draft-english-core-words.mjs --grade 2 --unit 1  # one unit only
//
// GRADE-PARAMETERISED rather than cloned per grade. Two copies of this would
// drift, and the drift would be invisible: each grade's draft would still look
// complete while being assembled by different rules.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english");

const argv = process.argv.slice(2);
let onlyUnit = null;
let GRADE = 1;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--unit") { onlyUnit = Number(argv[++i]); continue; }
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  console.error(`Unrecognised argument: ${argv[i]}`);
  console.error("Usage: draft-english-core-words.mjs [--grade N] [--unit N]");
  process.exit(2);
}
if (!Number.isInteger(GRADE) || GRADE < 1 || GRADE > 8) {
  console.error(`--grade must be 1-8, got: ${GRADE}`);
  process.exit(2);
}

const GRADE_DIR = path.join(ROOT, `grade-${GRADE}`, "data");
const OUT = path.join(GRADE_DIR, "core-words-draft.json");
const G1 = GRADE_DIR;
// A meaning written for an older reader is not usable. One grade up is close
// enough to adapt; anything beyond that is carried for reference and marked for
// re-pitching, never presented as ready.
const MEANING_CEILING = GRADE + 1;

const core = JSON.parse(fs.readFileSync(path.join(G1, "core-words.json"), "utf8"));
// Hand-written content for words the course could not supply, or supplied at the
// wrong reading level. Layered LAST so it always wins: a reviewer's sentence beats
// a mined one, and a re-pitched meaning beats the Grade 7 original it replaces.
const authoredFile = path.join(G1, "core-words-authored.json");
const authored = fs.existsSync(authoredFile)
  ? JSON.parse(fs.readFileSync(authoredFile, "utf8")).words : {};
const master = new Map(
  JSON.parse(fs.readFileSync(path.join(GRADE_DIR, `master-dictionary.grade${GRADE}.json`), "utf8"))
    .entries.map((e) => [e.lemma.toLowerCase(), e]));

// ---- every link in the course, best-first per word ---------------------------
const links = new Map();
for (let g = 1; g <= 8; g++) {
  for (let u = 0; u <= 10; u++) {
    const f = path.join(ROOT, `grade-${g}`, "data", "units", `unit-${u}.json`);
    if (!fs.existsSync(f)) continue;
    for (const l of JSON.parse(fs.readFileSync(f, "utf8")).dictionaryLinks) {
      const w = String(l.masterWord || "").toLowerCase();
      if (!w) continue;
      const n = (l.practiceSentences || []).length;
      // This grade wins outright; below it beats above it, because a definition
      // written for a younger reader is safe here and one written for an older
      // reader is the failure this tool exists to catch. (At Grade 1 there is no
      // grade below, so this term is inert and the behaviour is unchanged.)
      const level = g === GRADE ? 1000 : g < GRADE ? 500 : 0;
      const score = level + (l.childMeaning ? 100 : 0) + n * 10;
      const prev = links.get(w);
      if (!prev || score > prev.score) links.set(w, { score, grade: g, unit: u, link: l });
    }
  }
}

// ---- sentences this grade's readings can lend --------------------------------
const byUnit = new Map();
for (let u = 1; u <= 10; u++) {
  const d = JSON.parse(fs.readFileSync(path.join(G1, "units", `unit-${u}.json`), "utf8"));
  const out = [];
  for (const r of d.readings) {
    String(r.passageScript || "")
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .split(/(?<=[.!?])\s+/)
      .forEach((s) => {
        const t = tidyCandidate(s.replace(/\s+/g, " "));
        if (t.length > 8 && t.length < 90) out.push(t);
      });
  }
  byUnit.set(u, out);
}
const allSentences = [...byUnit.entries()].flatMap(([u, ss]) => ss.map((s) => ({ u, s })));

const boundary = String.raw`\b`;

// A reading sentence is only a usable CANDIDATE if it stands alone. The splitter
// breaks on terminal punctuation, which fails inside quoted dialogue: the passage
//   "You are using all your senses." On the way home, Amal held her hand.
// came back as a single "sentence" 82 characters long, carrying the tail of the
// line before it. Anything with a terminal mark followed by more text is a split
// failure; anything over 55 characters is longer than the authored sets a
// five-year-old is meant to read (those average 32).
// The cap is per GRADE, because it means "longer than the sentences this grade
// already asks a child to read" — and that is not one number. Measured over each
// grade's own authored practice sentences:
//   grade 1  n=4772  mean 30  median 29  p90 36  p99 44  max 56
//   grade 2  n=4142  mean 42  median 42  p90 53  p99 63  max 83
//   grade 3  n=3748  mean 41  median 41  p90 52  p99 61  max 76
// so each entry is that grade's observed maximum, rounded down to a round number.
// Note grade 3 is not longer than grade 2 — the jump is between 1 and 2, and the
// curve is flat above that, which is why this is a measured table and not a
// formula in the grade number.
//
// It is a TABLE rather than a value derived at run time on purpose. Deriving it
// from the grade's own sentences works once and then drifts: the build replaces
// those very sentences with the Core word sets, so a second run would measure a
// different corpus and silently change which candidates are usable — the same
// self-referential trap the build tool hit by treating its own output as input.
const MAX_CANDIDATE_BY_GRADE = { 1: 55, 2: 80, 3: 75 };
const MAX_CANDIDATE = MAX_CANDIDATE_BY_GRADE[GRADE] ?? 80;
const SPLIT_FAILURE = /[.!?]["']?\s+\S/;
// Some passages use "/" to separate instruction steps ("… / Point to the
// ceiling."), so a split can begin with one. Trim leading punctuation rather
// than reject the line — the sentence after it is perfectly good.
// The pattern is inline rather than a const: this is called from the sentence
// loop above, and a const declared here is still in its temporal dead zone then.
function tidyCandidate(text) {
  return text.replace(/^[\s/\-–—•*]+/, "").trim();
}
function usableCandidate(text) {
  if (SPLIT_FAILURE.test(text)) return false;
  if (!/^["'“]?[A-Z]/.test(text)) return false; // must start a sentence
  // The passages carry worksheet lines as well as narrative. "A ___ works at
  // the ___." is a fill-in exercise, not an example sentence, and reads as
  // nonsense on a word card.
  if (/_{2,}/.test(text)) return false;
  // An odd number of quotation marks means the splitter cut inside dialogue:
  // «She heard a man calling, "Fresh fish!» loses its closing quote and its
  // second half.
  if (((text.match(/"/g) || []).length % 2) === 1) return false;
  // Speaker-prefixed lines come from the units' teaching scripts, not the story:
  // "Learner: This is my mum." is a stage direction with a sentence inside it.
  if (/^(Learner|Teacher|Adult|Child|Parent|Together)\s*:/i.test(text)) return false;
  // A mid-line slash marks a rhyme's line break — "She lays eggs / for
  // gentlemen." is two verse lines, not a sentence.
  if (/\s\/\s/.test(text)) return false;
  return text.length >= 12 && text.length <= MAX_CANDIDATE;
}

function mine(word, homeUnit) {
  const bare = word.replace(/[^a-z]/g, "");
  if (!bare) return { picked: [], total: 0 };
  const re = new RegExp(boundary + bare + boundary, "i");
  const hits = allSentences.filter((x) => re.test(x.s) && usableCandidate(x.s));
  // the word's own unit first, then the rest; shortest first inside each group
  const home = hits.filter((x) => x.u === homeUnit).map((x) => x.s).sort((a, b) => a.length - b.length);
  const away = hits.filter((x) => x.u !== homeUnit).map((x) => x.s).sort((a, b) => a.length - b.length);
  const picked = [...new Set([...home, ...away])].slice(0, 5);
  return { picked, total: hits.length };
}

// ---- assemble ----------------------------------------------------------------
const tally = { ready: 0, reused: 0, topup: 0, adapt: 0, repitch: 0, mined: 0, author: 0 };
let weakCount = 0, sentencesToWrite = 0, meaningsToWrite = 0, newClips = 0;
const draft = [];

for (const cu of core.units) {
  if (onlyUnit && cu.unitNo !== onlyUnit) continue;
  const words = [];
  for (const g of cu.groups) {
    for (const w of g.words) {
      const found = links.get(w);
      const link = found?.link;
      const has = (link?.practiceSentences || []).length;
      let meaning = link?.childMeaning ?? null;
      const fromG1 = found?.grade === GRADE;
      const { picked, total } = mine(w, cu.unitNo);
      const weak = total > 30;

      // A meaning written for an older reader is not usable here. Grade 7's "mat"
      // is "a flat piece of woven material placed on a floor" — true, and not
      // Grade 1 language. See MEANING_CEILING above.
      let meaningOk = Boolean(meaning) && found && found.grade <= MEANING_CEILING;
      let meaningFrom = null;
      const repitch = Boolean(meaning) && found && found.grade > MEANING_CEILING;
      let status, sentences, sentenceSource, minedAdded = 0;
      if (fromG1 && meaning && has >= 5) {
        status = "reused"; sentences = link.practiceSentences; sentenceSource = `grade ${GRADE} unit ${found.unit}`;
      } else if (fromG1 && meaning) {
        status = "topup";
        const added = picked.filter((s) => !link.practiceSentences.includes(s));
        sentences = [...link.practiceSentences, ...added].slice(0, 5);
        minedAdded = Math.max(0, sentences.length - link.practiceSentences.length);
        sentenceSource = minedAdded ? `grade ${GRADE} unit ${found.unit} + readings` : `grade ${GRADE} unit ${found.unit}`;
      } else if (meaning && has >= 5) {
        status = repitch ? "repitch" : "adapt"; sentences = link.practiceSentences; sentenceSource = `grade ${found.grade} unit ${found.unit}`;
      } else if (picked.length >= 5) {
        status = "mined"; sentences = picked; sentenceSource = `grade ${GRADE} readings`; minedAdded = picked.length;
      } else {
        status = "author"; sentences = picked; sentenceSource = picked.length ? `grade ${GRADE} readings (partial)` : null; minedAdded = picked.length;
      }

      // authored overrides
      const a = authored[w];
      if (a) {
        if (a.childMeaning) { meaning = a.childMeaning; meaningOk = true; meaningFrom = "authored"; }
        if (a.practiceSentences) { sentences = a.practiceSentences; sentenceSource = "authored"; minedAdded = 0; }
        else if (a.extraSentences) {
          sentences = [...sentences, ...a.extraSentences.filter((x) => !sentences.includes(x))].slice(0, 5);
          sentenceSource = (sentenceSource ? sentenceSource + " + " : "") + "authored";
        }
        if (meaning && sentences.length >= 5 && sentenceSource === "authored") status = "ready";
      }

      tally[status] += 1;
      if (weak && (status === "mined" || status === "author")) weakCount += 1;
      if (!meaning || (repitch && meaningFrom !== "authored")) meaningsToWrite += 1;
      sentencesToWrite += Math.max(0, 5 - sentences.length);
      if (status !== "reused") newClips += (master.has(w) ? 0 : 1) + (meaning ? 0 : 1) + Math.max(0, 5 - (status === "reused" ? 5 : 0));

      words.push({
        word: w, group: g.title, strand: g.strand, status,
        childMeaning: meaning,
        meaningSource: meaningFrom ?? (meaning ? `grade ${found.grade} unit ${found.unit}` : null),
        practiceSentences: sentences,
        sentenceSource, sentencesInReadings: total,
        weakExamples: weak && status !== "reused" ? true : undefined,
        hasWordClip: master.has(w),
        meaningPitch: meaning ? (meaningFrom === "authored" || meaningOk ? "ok" : `re-pitch for Grade ${GRADE}`) : null,
        sentencesNeedReview: minedAdded,
        needs: [meaning ? (repitch && meaningFrom !== "authored" ? "re-pitch meaning" : null) : "meaning",
          sentences.length < 5 ? `${5 - sentences.length} sentences` : null,
          minedAdded ? `review ${minedAdded} mined sentence(s)` : null].filter(Boolean),
      });
    }
  }
  draft.push({ unit: cu.unitNo, title: cu.unitTitle, wordCount: words.length, words });
}

fs.writeFileSync(OUT, JSON.stringify({ schemaVersion: "Ehel Core Words Draft v1.0", gradeId: `g${String(GRADE).padStart(2, "0")}`, units: draft }, null, 1) + "\n");

const total = Object.values(tally).reduce((a, b) => a + b, 0);
console.log(`Grade ${GRADE} Core words draft — ${total} words${onlyUnit ? ` (unit ${onlyUnit})` : ""}\n`);
console.log("  ready   authored and complete                      :", tally.ready);
console.log(`  reused  complete Grade ${GRADE} link, audio already made :`, tally.reused);
console.log("  topup   meaning kept, sentences completed         :", tally.topup);
console.log(`  adapt   complete at Grade ${MEANING_CEILING}, usable as written      :`, tally.adapt);
console.log("  repitch meaning exists but written for an older reader:", tally.repitch);
console.log("  mined   sentences from the readings, meaning needed:", tally.mined);
console.log("  author  nothing to build on                       :", tally.author);
console.log(`\n  meanings still to write   : ${meaningsToWrite}`);
console.log(`  sentences still to write  : ${sentencesToWrite}`);
const minedPending = draft.flatMap((u) => u.words).reduce((a, w) => a + (w.sentencesNeedReview || 0), 0);
console.log(`  mined sentences to review : ${minedPending}  (candidates, not finished content)`);
const doneWords = draft.flatMap((u) => u.words).filter((w) => w.needs.length === 0).length;
console.log(`
  words complete            : ${doneWords} of ${draft.flatMap((u) => u.words).length}`);
console.log(`  mined sets flagged weak   : ${weakCount}  (word too common for its own examples to teach it)`);
console.log(`\nwrote ${OUT}`);
console.log(`Review it, fill the nulls, then: node tools/build-english-core-words.mjs --grade ${GRADE} --write`);
