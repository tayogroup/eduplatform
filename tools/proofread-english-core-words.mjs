#!/usr/bin/env node
// Proofread BUILT Core-word content for the fault classes the authored-content
// gate cannot see. Every class here is one this grade actually produced.
//
//   node tools/proofread-english-core-words.mjs     (Grade 3; edit D for others)
//
// READ THE OUTPUT, DO NOT ACT ON THE COUNTS. Of 279 findings on Grade 3, three
// were real. `self-defining` (30) and `circular` (55) and `collocation` (177)
// are dominated by correct content: repeating the headword is house style at
// 20-63% across every other grade, "camera is a machine" is a taxonomy rather
// than a circle, and "grateful for" is the word's grammatical frame. The classes
// that were worth their noise are pronoun, duplicate, same-meaning, unresolved
// and same-opener.
import fs from "node:fs";

const D = "src/prototypes/ehel-academy/english/grade-3/data/";
const entries = JSON.parse(fs.readFileSync(D + "master-dictionary.grade3.json", "utf8")).entries;
const byId = new Map(entries.map((e) => [e.dictionaryEntryId, e]));

const units = [];
for (let u = 1; u <= 10; u++) {
  const d = JSON.parse(fs.readFileSync(D + `units/unit-${u}.json`, "utf8"));
  const core = (d.dictionaryLinks || []).filter((l) => !/stories/i.test(l.groupTitle || ""));
  units.push({ u, core });
}
const all = units.flatMap((x) => x.core.map((l) => ({ ...l, unit: x.u })));
const coreWords = new Set(all.map((l) => String(l.masterWord).toLowerCase()));

const out = [];
const add = (kind, unit, word, detail) => out.push({ kind, unit, word, detail });

// 1. A definition that leans on another Core word from the SAME unit. Four of
//    these shipped from higher grades (certainly->definitely, rare->especially,
//    investigate->examine, electric->electricity).
for (const { u, core } of units) {
  const inUnit = new Set(core.map((l) => String(l.masterWord).toLowerCase()));
  for (const l of core) {
    const self = String(l.masterWord).toLowerCase();
    const m = String(l.childMeaning || "").toLowerCase();
    for (const other of inUnit) {
      if (other === self || other.length < 5) continue;
      if (new RegExp(`\\b${other}\\b`).test(m)) add("circular", u, l.masterWord, `meaning uses "${other}", also taught in this unit`);
    }
  }
}

// 2. A set of five that teaches a COLLOCATION rather than the word: the same
//    two-word phrase around the headword in three or more sentences. This is
//    how `natural` (natural energy x3) and `single` (every single day) failed.
for (const l of all) {
  const w = String(l.masterWord).toLowerCase();
  const grams = new Map();
  for (const s of l.practiceSentences || []) {
    const t = s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
    const i = t.findIndex((x) => x === w || x.startsWith(w));
    if (i < 0) continue;
    for (const g of [t.slice(i, i + 2).join(" "), t.slice(Math.max(0, i - 1), i + 1).join(" ")]) {
      if (g.split(" ").length === 2) grams.set(g, (grams.get(g) || 0) + 1);
    }
  }
  for (const [g, n] of grams) if (n >= 3) add("collocation", l.unit, l.masterWord, `"${g}" in ${n} of 5 sentences`);
}

// 3. Every sentence opening with the same word — teaches the position, not the
//    meaning. `later` failed this way and no gate saw it.
for (const l of all) {
  const firsts = (l.practiceSentences || []).map((s) => s.replace(/^["'“]/, "").split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ""));
  const counts = {};
  for (const f of firsts) counts[f] = (counts[f] || 0) + 1;
  for (const [f, n] of Object.entries(counts)) if (n >= 4) add("same-opener", l.unit, l.masterWord, `${n} of 5 sentences begin "${f}"`);
}

// 4. Part of speech disagreeing with how the meaning is written. An entry that
//    says noun above a meaning starting "To ..." is one of them contradicting
//    the other on the card the child reads.
for (const l of all) {
  const e = byId.get(l.dictionaryEntryId);
  if (!e) { add("unresolved", l.unit, l.masterWord, "link resolves to no dictionary entry"); continue; }
  const m = String(l.childMeaning || "").trim();
  if (/^To\s/.test(m) && e.partOfSpeech !== "verb") add("pos-vs-meaning", l.unit, l.masterWord, `${e.partOfSpeech}, but the meaning starts "To ..."`);
  if (/^(A|An|The)\s/.test(m) && !["noun", "article"].includes(e.partOfSpeech)) add("pos-vs-meaning", l.unit, l.masterWord, `${e.partOfSpeech}, but the meaning starts "${m.split(/\s/)[0]} ..."`);
}

// 5. A meaning that defines the word with itself.
for (const l of all) {
  const w = String(l.masterWord).toLowerCase();
  const m = String(l.childMeaning || "").toLowerCase();
  const stem = w.length > 4 ? w.slice(0, -2) : w;
  if (new RegExp(`\\b${stem}`).test(m)) add("self-defining", l.unit, l.masterWord, l.childMeaning);
}

// 6. Pronoun agreement for the named cast. Sami and Leo are boys in this
//    grade's content; Amal, Nora and Mina are girls. Two reused sentences said
//    "Sami ... her".
const GENDER = { sami: "m", leo: "m", daniel: "m", theo: "m", omar: "m", adam: "m", grandpa: "m",
                 amal: "f", nora: "f", mina: "f", hana: "f", maya: "f", yasmin: "f", grandma: "f" };
for (const l of all) {
  for (const s of l.practiceSentences || []) {
    for (const [name, g] of Object.entries(GENDER)) {
      const re = new RegExp(`\\b${name[0].toUpperCase()}${name.slice(1)}\\b`);
      if (!re.test(s)) continue;
      const wrong = g === "m" ? /\b(her|hers|she)\b/i : /\b(his|him|he)\b/i;
      // only when that name is the ONLY person in the sentence
      const others = Object.keys(GENDER).filter((n) => n !== name)
        .some((n) => new RegExp(`\\b${n[0].toUpperCase()}${n.slice(1)}\\b`).test(s));
      if (!others && wrong.test(s)) add("pronoun", l.unit, l.masterWord, `${name} is ${g === "m" ? "male" : "female"}: ${s}`);
    }
  }
}

// 7. The same sentence used for two different words.
const seen = new Map();
for (const l of all) for (const s of l.practiceSentences || []) {
  const prev = seen.get(s);
  if (prev && prev !== l.masterWord) add("duplicate", l.unit, l.masterWord, `same sentence as "${prev}": ${s}`);
  seen.set(s, l.masterWord);
}

// 8. Two Core words in the same unit sharing a meaning, which makes the pair
//    indistinguishable on the cards.
for (const { u, core } of units) {
  const byMeaning = new Map();
  for (const l of core) {
    const k = String(l.childMeaning || "").toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (!k) continue;
    if (byMeaning.has(k)) add("same-meaning", u, l.masterWord, `identical meaning to "${byMeaning.get(k)}"`);
    byMeaning.set(k, l.masterWord);
  }
}

console.log(`Grade 3 built content — ${all.length} Core words across ${units.length} units\n`);
const kinds = {};
for (const r of out) (kinds[r.kind] ??= []).push(r);
const ORDER = ["unresolved", "pronoun", "duplicate", "same-meaning", "self-defining", "pos-vs-meaning", "circular", "collocation", "same-opener"];
for (const k of ORDER) {
  const rows = kinds[k] || [];
  console.log(`${k.padEnd(16)} ${String(rows.length).padStart(3)}`);
  for (const r of rows.slice(0, 12)) console.log(`     u${String(r.unit).padEnd(3)} ${r.word.padEnd(14)} ${r.detail}`);
  if (rows.length > 12) console.log(`     … ${rows.length - 12} more`);
}
console.log(`\ntotal findings: ${out.length}`);
