#!/usr/bin/env node
// Read what the Phonics level's narration will SAY, and fail on the shapes that
// mean it says the wrong thing. Free: nothing is sent anywhere.
//
//   node tools/audit-phonics-speech.js            # the findings, exit 1 if any
//   node tools/audit-phonics-speech.js --all      # every changed sentence too
//
// lib/ehel-phonics-speech.js respells a grapheme as its sound. What no rule can
// know is what the AUTHOR meant, and three shapes are how it goes wrong — each
// found on the level's own text:
//
//   COLLAPSE   two different spellings of one sound, on either side of "and",
//              "or" or "not". "How do you know a word takes ur, not ir?" becomes
//              "takes urr, not urr": a sentence about SPELLING, voiced as sounds.
//   CAPITAL    a capital letter standing alone. The convention is that a capital
//              is a letter NAME ("S. A. C. K." — four letters), and the module
//              leaves it alone. Unit 1 wrote "C. A. T. Three sounds." in capitals
//              meaning the three SOUNDS, so every one is listed for a decision.
//   SPELLING   a grapheme still voiced as a sound inside a sentence about letters
//              or spelling ("the letters", "is written", "Before e, i or y").
//
// A finding is fixed in the source text (capitals where names are meant) or by a
// PHRASES entry in the lib, never by weakening this check.

const fs = require("fs");
const path = require("path");
const narration = require("./lib/ehel-intensive-narration");
const { levelDir } = require("./lib/ehel-intensive-levels");
const { SOUND, PHRASES } = require("./lib/ehel-phonics-speech");

const COURSE = path.join(__dirname, "..", "src", "prototypes", "ehel-academy", "intensive-english");
const showAll = process.argv.includes("--all");
const dir = path.join(COURSE, levelDir(-1, COURSE), "data", "units");

const clips = [];
for (const file of fs.readdirSync(dir).filter((f) => /^unit-\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))) {
  const unit = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  for (const c of narration.clipsForUnit(unit)) clips.push({ ...c, unit: unit.unit.unitNo });
}
// The section intros and the standalone app's slide labels are spoken too.
for (const c of narration.sectionIntroClips(COURSE, -1)) clips.push({ ...c, unit: 0 });
for (const c of narration.appSlideClips(COURSE, -1)) clips.push({ ...c, unit: c.unit || 0 });
if (!clips.length) { console.error("no Phonics clips found — refusing to report a clean run"); process.exit(2); }

const sentences = (t) => String(t).split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

// Capitals the author wrote that ARE letter names, each read and kept. A new
// capital anywhere else in the level is a finding until it is added here.
const DELIBERATE_CAPITALS = [
  /\bBook [AB]\b/,                 // the two workbooks' names
  /^[A-Z]\.(?: [A-Z]\.)+/,         // "S. A. C. K." / "M. A. N. E." — a word spelled out
  /^S and T\b/,                    // "Look at the start. S and T." — the two letters
  /^Y in my\b/,                    // Unit 16: the letter y, spelling the long i
];
// PHRASES that keep a collapse on purpose: a Book A title whose letters share a
// sound, where the shared sound is that unit's lesson (c/k, z/zz, ir/er).
const DELIBERATE_COLLAPSE = /\b(?:mmm, kuh, kuh|yuh, zz, zz, kwah|ar, or, urr, urr, ow, oy)\b/;
const spokenSounds = new Set(SOUND.values());
const findings = [];
const seen = new Set();
const note = (kind, c, detail) => {
  const key = `${kind}|${detail}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push({ kind, unit: c.unit, category: c.category, detail });
};

for (const c of clips) {
  const shown = sentences(c.source);
  const said = sentences(c.spoken);
  // COLLAPSE: X {and|or|not|,} X where both X are the same respelled sound but
  // the displayed sentence had two different spellings there.
  for (const s of said) {
    const m = s.match(/\b([A-Za-z]+)(?:,? (?:and|or|not|then)| ,|,) (?:not )?([A-Za-z]+)\b/g) || [];
    for (const pair of m) {
      const [x, y] = [pair.split(/\W+/)[0], pair.split(/\W+/).filter(Boolean).pop()];
      if (DELIBERATE_COLLAPSE.test(s)) continue;
      if (x.toLowerCase() === y.toLowerCase() && spokenSounds.has(x.toLowerCase().replace(/^a$/, "A"))) {
        const display = shown.find((d) => d.length && s.length && Math.abs(d.length - s.length) < 40) || "";
        note("COLLAPSE", c, `${s}   <=   ${display}`);
      }
    }
  }
  // CAPITAL: a lone capital the AUTHOR wrote, surviving into what is said. The
  // transform writes capitals on purpose (Book B's spellings, the long A), so
  // looking at the spoken side reported 255 intended names; the question was
  // only ever about the source — Unit 1 wrote "C. A. T." for three SOUNDS.
  // Each one below is a decision, taken and recorded in DELIBERATE_CAPITALS.
  // A word card's `source` is its generated spoken form ("A, as in wait."),
  // not text anybody wrote, so there is no author's capital to question.
  for (const s of c.category === "words" ? [] : shown) {
    // "A pin", "I am", and a title's article ("A Hot Day.") are words, not letters.
    if (!/(?:^|[\s(])(?!I\b)[A-Z](?=[.,;:!?)]|\s|$)/.test(s) || /^(?:A|I) [A-Za-z]/.test(s)) continue;
    if (DELIBERATE_CAPITALS.some((re) => re.test(s))) continue;
    // "S. A. C. K." splits into four one-letter sentences; each is part of the
    // spelled word, which DELIBERATE_CAPITALS already names.
    if (/^[A-Z]\.$/.test(s) && /(?:^|\s)(?:[A-Z]\. ){2,}[A-Z]\./.test(c.source)) continue;
    if (!said.some((t) => t === s)) continue;          // rewritten by a PHRASE: decided
    note("CAPITAL", c, s);
  }
  // SPELLING: a sentence about letters or spelling that still voices a grapheme
  // as a sound.
  // A sound is RIGHT after "say"/"says" ("the letters O R say urr") and "long"
  // ("its long A spelling"): that is the sound the sentence is naming.
  for (const s of said) {
    const rest = s.replace(/\b(?:[Ss]ays?|[Ll]ong) [A-Za-z]+/g, "");
    if (/\b(?:letters|spelling|spelled|spelt|written|write it|Before (?:eh|ih))\b/i.test(s)
        // `A` is both the long-a sound and the letter NAME the transform writes
        // when it spells ("A gap E and A Y"), so it cannot tell which it is here.
        && [...spokenSounds].some((v) => new RegExp(`\\b${v}\\b`).test(rest) && !/^(?:or|ear|air|ow|oy|ar|th|ee|A)$/.test(v))) {
      note("SPELLING", c, s);
    }
  }
}

// SHORT_I: the short i said anywhere but inside a blend. No spelling makes this
// voice say it alone — `ih`, `ih!`, `ɪ`, `ii` all came back "I" — and the
// recorded Unit 3 intro said "Eye and poo. New sounds. Eye. Pooh." for "i and p".
// Inside a blend it works ("puh, ih, nnn" -> "pu-i-n-n"), so a lone `ih` is one
// whose neighbours are not both sounds; each is voiced through a word instead
// ("the sound in pin") by a PHRASE in the lib.
const soundTokens = new Set([...SOUND.values(), "sss", "mmm", "nnn", "rrr", "shh"].map((s) => s.toLowerCase()));
for (const c of clips) {
  const toks = c.spoken.split(/[\s,.;:!?()]+/).filter(Boolean);
  toks.forEach((t, i) => {
    if (t.toLowerCase() !== "ih") return;
    const before = (toks[i - 1] || "").toLowerCase(), after = (toks[i + 1] || "").toLowerCase();
    if (soundTokens.has(before) && soundTokens.has(after)) return;
    note("SHORT_I", c, c.spoken.slice(Math.max(0, c.spoken.search(/\bih\b/) - 40), c.spoken.search(/\bih\b/) + 50));
  });
}

// STALE: a PHRASE whose source text no clip contains. It rewrites nothing, and
// the sentence it was written for — if the text was edited — now goes through
// the general rules unexamined.
for (const [from] of PHRASES) {
  if (!clips.some((c) => c.source.includes(from))) findings.push({ kind: "STALE", unit: 0, category: "PHRASES", detail: from });
}

const changed = clips.filter((c) => c.spoken !== c.source && c.category !== "words");
console.log(`Phonics narration: ${clips.length} clips, ${changed.length} whose spoken form differs from the page, ` +
            `${clips.filter((c) => c.category === "words").length} word cards`);
for (const kind of ["COLLAPSE", "CAPITAL", "SPELLING", "SHORT_I", "STALE"]) {
  const f = findings.filter((x) => x.kind === kind);
  console.log(`\n${kind}: ${f.length}`);
  for (const x of f) console.log(`  U${String(x.unit).padStart(2)} ${x.category.padEnd(13)} ${x.detail.slice(0, 150)}`);
}
if (showAll) {
  console.log("\nEVERY CHANGED SENTENCE (page  =>  voice)");
  const pairs = new Set();
  for (const c of changed) {
    const shown = sentences(c.source), said = sentences(c.spoken);
    if (shown.length !== said.length) { pairs.add(`U${c.unit} [${c.category}] ${c.source.slice(0, 90)}  =>  ${c.spoken.slice(0, 90)}`); continue; }
    shown.forEach((d, i) => { if (d !== said[i]) pairs.add(`${d}  =>  ${said[i]}`); });
  }
  for (const p of pairs) console.log("  " + p);
}
process.exitCode = findings.length ? 1 : 0;
