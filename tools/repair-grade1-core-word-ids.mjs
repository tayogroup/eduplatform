#!/usr/bin/env node
// Grade 1 English: give a Core word its own vocabularyId.
//
// The Core-words restructure reused a word's existing vocabularyId wherever it
// already had one. That looked like continuity and was a collision: the same
// word is often BOTH a Core word and a "Words from our stories" glossary entry,
// so two dictionaryLinks ended up sharing one id.
//
// generate-ehel-english-audio.js derives the clip filename from that id
// (`${vocabularyId}-sentence-${i+1}.mp3`), so two links with one id write one
// file from two different scripts. Whichever unit is processed last wins and
// the other card plays audio that contradicts the sentence printed on it.
//
// The tell is that a confirming re-run never settles. Each pass re-records the
// losing half and re-stales the winner, so the "text had changed since" count
// oscillates instead of reaching zero -- 234, then 254, then 127.
//
// THE CORE SIDE IS RENAMED, NOT THE GLOSSARY SIDE, and that direction matters.
// `progress.knownWords` stores vocabularyId, so a learner's Learned list is
// keyed on it. The glossary links kept the ORIGINAL ids, which learners may
// already have marked known; the Core words have never been deployed, so no
// learner holds one. Renaming the Core side is therefore free, and renaming the
// glossary side would silently unmark words people had earned.
//
// Clips are COPIED to the new id rather than re-bought where that is provably
// safe. The narration index records the fingerprint of the text each clip was
// made from, so a file whose fingerprint matches the Core link's own text IS
// the Core link's recording and can be copied straight across.
//
// Copied and not moved, because the old path still belongs to the glossary
// twin. Its index entry keeps the Core fingerprint, which is exactly what makes
// the generator do the right thing next: where the twin's wording differs it
// reads as stale and is re-recorded, and where the two are word-for-word
// identical it is reused for nothing. Moving would have stranded every twin,
// including the identical ones that needed no work at all.
//
// A fingerprint that matches neither (this file composes narration text
// slightly differently from the generator) falls through to regeneration too,
// so the failure mode is spending money, never shipping the wrong audio.
//
//   node tools/repair-grade1-core-word-ids.mjs           # report
//   node tools/repair-grade1-core-word-ids.mjs --write   # apply
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const E = path.join("src", "prototypes", "ehel-academy", "english");
const UNITS = path.join(E, "grade-1", "data", "units");
const INDEX = path.join(E, "media", "audio", ".narration-index.json");
const CLIPS = path.join(E, "media", "audio", "grade-1", "vocabulary");
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") { console.error(`Unrecognised argument: ${a}`); process.exit(2); }
}

const fp = (t) => crypto.createHash("sha1").update(String(t)).digest("hex").slice(0, 16);
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

const files = [];
for (let n = 0; n <= 10; n++) {
  const f = path.join(UNITS, `unit-${n}.json`);
  if (fs.existsSync(f)) files.push({ n, f, doc: JSON.parse(fs.readFileSync(f, "utf8")) });
}

// Every id in use, so a replacement can be checked for uniqueness against the
// whole grade rather than against the unit it happens to live in.
const used = new Map();
for (const u of files) for (const l of u.doc.dictionaryLinks || []) {
  used.set(l.vocabularyId, (used.get(l.vocabularyId) || 0) + 1);
}

const isCore = (l) => /-core-/.test(l.groupId || "");
const renames = [];
for (const u of files) for (const l of u.doc.dictionaryLinks || []) {
  if (used.get(l.vocabularyId) < 2 || !isCore(l)) continue;
  const stem = `g1-u${u.n}-core-${String(l.masterWord).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  let id = stem, k = 2;
  while (used.has(id)) id = `${stem}-${k++}`;
  used.set(id, 1);
  renames.push({ unit: u.n, link: l, from: l.vocabularyId, to: id });
}

const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
const key = (id, slot) => `media/audio/grade-1/vocabulary/${id}-${slot}.mp3`;
const moves = [];
let regen = 0;
for (const r of renames) {
  const slots = [];
  (r.link.practiceSentences || []).forEach((s, i) => slots.push([`sentence-${i + 1}`, norm(s)]));
  if (r.link.childMeaning) slots.push(["meaning", norm(r.link.childMeaning)]);
  for (const [slot, text] of slots) {
    const from = key(r.from, slot), to = key(r.to, slot);
    const onDisk = fs.existsSync(path.join(E, from));
    // Only a fingerprint match proves this file is THIS link's recording rather
    // than its twin's. Anything else regenerates.
    if (onDisk && index[from] && index[from] === fp(text)) moves.push({ from, to, slot, r });
    else regen += 1;
  }
}

console.log(`colliding ids on the Core side: ${renames.length}`);
console.log(`  clips that can be copied to the new id (fingerprint proves ownership): ${moves.length}`);
console.log(`  clips the generator must record: ${regen}`);
console.log("\nsample:");
for (const r of renames.slice(0, 6)) console.log(`  u${r.unit} ${r.link.masterWord.padEnd(10)} ${r.from}  ->  ${r.to}`);
if (!WRITE) { console.log("\nReport only — nothing written. Re-run with --write to apply."); process.exit(0); }

const moved = new Set(moves.map((m) => m.from + "|" + m.to));
// COPIED, not moved. The old path still belongs to the glossary twin, and its
// index entry still records the CORE text -- so where the twin's wording
// differs the generator sees a stale clip and re-records it, and where the two
// are word-for-word identical it correctly reuses the file and costs nothing.
// Moving would have stranded every twin, including the identical ones.
for (const m of moves) {
  fs.copyFileSync(path.join(E, m.from), path.join(E, m.to));
  index[m.to] = index[m.from];
}
for (const r of renames) {
  r.link.vocabularyId = r.to;
  // A descriptor that was not renamed still names the twin's file. Clearing it
  // is what makes the generator record this word rather than reuse the other's.
  (r.link.practiceSentences || []).forEach((s, i) => {
    const k = key(r.from, `sentence-${i + 1}`), k2 = key(r.to, `sentence-${i + 1}`);
    if (!Array.isArray(r.link.sentenceAudio)) r.link.sentenceAudio = [];
    if (moved.has(k + "|" + k2)) {
      const src = `./${k2}`;
      r.link.sentenceAudio[i] = { ...(r.link.sentenceAudio[i] || {}), source: src, normal: src, slow: src, available: true };
    } else r.link.sentenceAudio[i] = undefined;
  });
  r.link.sentenceAudio = (r.link.sentenceAudio || []).map((a) => a || { available: false });
  const mk = key(r.from, "meaning"), mk2 = key(r.to, "meaning");
  if (r.link.childMeaning) {
    if (moved.has(mk + "|" + mk2)) {
      const src = `./${mk2}`;
      r.link.meaningAudio = { ...(r.link.meaningAudio || {}), source: src, normal: src, slow: src, available: true };
    } else r.link.meaningAudio = null;
  }
}
for (const u of files) {
  const target = path.join(UNITS, `unit-${u.n}.json`);
  for (let a = 1; a <= 6; a++) {
    try { fs.writeFileSync(target, JSON.stringify(u.doc, null, 2) + "\n"); break; }
    // The preview servers hold these files open intermittently on Windows.
    catch (e) { if (a === 6) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 800 * a); }
  }
}
fs.writeFileSync(INDEX, JSON.stringify(index, null, 2) + "\n");
console.log(`\nrenamed ${renames.length} id(s); copied ${moves.length} clip(s); ${regen} left for the generator.`);
