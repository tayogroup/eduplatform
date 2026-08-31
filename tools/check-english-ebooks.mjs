#!/usr/bin/env node

// Gate on the English picture-book shelf: the catalogue in
// shell/subjects/english.js against the files actually on disk.
//
// Nothing read this before. `validate-ehel-shared-english-ui.js` checks four of
// the twenty-three books, by name, and only their .webp pages — and it reads
// english/shared/course-ui.js, which has been a one-line loader since the shell
// module became the copy that ships, so it cannot see the catalogue at all any
// more. Everything below is what that leaves uncovered.
//
// What it catches, each of which ships as a broken page rather than an error:
//
//  - A page whose image file is missing: the reader draws a broken <img> and
//    the shelf thumbnail (pages[0].image) is blank.
//  - A stale page-NN.svg left behind when a story got shorter. The book still
//    reads correctly — the file is simply never requested again, and nothing
//    else in the repo would ever mention it.
//  - A `sound` cue naming a file that does not exist. playStorySound() takes
//    the raw key and does NOT go through TAP_SOUND_ALIASES, unlike a tap, so a
//    cue that would work as a data-tap value can still be silent as a page
//    sound. That asymmetry is exactly the kind of thing a reader never reports.
//  - A data-tap inside an illustration that resolves to no clip — including the
//    mood form, where data-tap="zuri" data-mood="sad" asks for zuri-sad.mp3.
//  - A book folder on disk that no catalogue entry claims.
//
// Usage: node tools/check-english-ebooks.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const englishRoot = path.join(root, "src", "prototypes", "ehel-academy", "english");
const ebooksRoot = path.join(englishRoot, "ebooks");
const shellSource = fs.readFileSync(path.join(root, "src", "prototypes", "ehel-academy", "shell", "subjects", "english.js"), "utf8");

const problems = [];
const fail = (message) => problems.push(message);

// ---------------------------------------------------------------- read the catalogue
// The array is pure data literals, so it is safe to slice it out and evaluate
// it. Parsing it with a regex instead would mean re-implementing string
// escaping — and every page's text is full of quotes.

// The extractor lives in tools/lib/ehel-ebook-catalog.js so the topic index can
// read the same catalogue the same way. Two source-slicing copies is the drift
// this file's own comments warn about, and the second one is always the copy
// that stops matching english.js.
const { readEbookCatalog, ebooksFor, literalBetweenBrackets } = createRequire(import.meta.url)("./lib/ehel-ebook-catalog.js");
const ebookCatalog = readEbookCatalog(path.join(root, "src", "prototypes", "ehel-academy"));

// The alias table and the mood set decide what a data-tap can resolve to, so
// they are read out of the same file rather than restated here — a restated
// copy is a copy that drifts.
const aliasSource = shellSource.match(/const TAP_SOUND_ALIASES = (\{[^}]*\})/);
const moodTypeSource = shellSource.match(/const TAP_SOUND_MOOD_TYPES = new Set\((\[[^\]]*\])\)/);
const voiceGroupSource = shellSource.match(/const TAP_VOICE_GROUPS = (\{[^}]*\})/);
if (!aliasSource || !moodTypeSource || !voiceGroupSource) fail("Could not read TAP_SOUND_ALIASES / TAP_SOUND_MOOD_TYPES / TAP_VOICE_GROUPS out of english.js.");
const aliases = aliasSource ? vm.runInNewContext(`(${aliasSource[1]})`) : {};
const moodTypes = new Set(moodTypeSource ? vm.runInNewContext(moodTypeSource[1]) : []);
// The third resolution path: several human characters share one voice, and the
// mood still selects the clip. Read from english.js rather than restated here —
// a second copy of the mapping is a copy free to drift from the one that ships.
const voiceGroups = voiceGroupSource ? vm.runInNewContext(`(${voiceGroupSource[1]})`) : {};
const MOODS = ["happy", "sad", "surprised"];

// ---------------------------------------------------------------- superseded pages
//
// Musa's Muddy Stripes shipped first as twelve painted .webp pages and was then
// redrawn as the animated .svg pages the catalogue uses today. The .webp copies
// were never deleted, and they are NOT free to delete: the (unwired, but still
// present) tools/validate-ehel-shared-english-ui.js asserts that this book has
// twelve .webp pages of at least 15 KB each. So they are recorded here rather
// than reported as rot, and the exemption is per-file, not per-book — a
// thirteenth stray page in this folder still fails.
//
// The list may only shrink. An entry that stops firing fails below, so the
// exemption cannot outlive the files it was written for.
const SUPERSEDED_PAGES = Object.fromEntries(
  Array.from({ length: 12 }, (unused, index) => [`musas-muddy-stripes/page-${String(index + 1).padStart(2, "0")}.webp`,
    "superseded by the animated .svg redraw; kept because validate-ehel-shared-english-ui.js still requires it"]),
);
const supersededSeen = new Set();
const isKnownSuperseded = (bookId, name) => Boolean(SUPERSEDED_PAGES[`${bookId}/${name}`]);

const soundsRoot = path.join(ebooksRoot, "tap-sounds");
const clips = new Set(fs.readdirSync(soundsRoot).filter((name) => name.endsWith(".mp3")).map((name) => name.replace(/\.mp3$/, "")));

// ---------------------------------------------------------------- per book

const claimedDirs = new Set(["tap-sounds"]);
const seenIds = new Set();
let pagesChecked = 0;
let tapTargetsChecked = 0;

for (const book of ebookCatalog) {
  const where = `${book.id}`;
  if (seenIds.has(book.id)) fail(`${where}: duplicate catalogue id.`);
  seenIds.add(book.id);
  claimedDirs.add(book.id);

  for (const field of ["title", "level", "description", "author", "illustrator", "attribution"]) {
    if (!book[field]) fail(`${where}: missing ${field}.`);
  }
  if (!Array.isArray(book.grades) || !book.grades.length) fail(`${where}: no grades.`);
  if (book.units && !book.units.length) fail(`${where}: units is present but empty, so the book is unreachable.`);
  if (!Array.isArray(book.pages) || book.pages.length < 8) fail(`${where}: a book needs at least 8 pages.`);

  const bookDir = path.join(ebooksRoot, book.id);
  if (!fs.existsSync(bookDir)) {
    fail(`${where}: no ebooks/${book.id}/ directory.`);
    continue;
  }

  book.pages.forEach((page, index) => {
    const at = `${where} page ${index + 1}`;
    if (!page.text) fail(`${at}: no text, so there is nothing to narrate or read along.`);
    if (!page.alt) fail(`${at}: no alt text.`);
    const file = path.join(bookDir, page.image);
    if (!fs.existsSync(file)) {
      fail(`${at}: illustration ${page.image} is missing.`);
      return;
    }
    // A .webp under 15 KB is a failed export; an .svg under 800 bytes is an
    // empty frame. Both render as "nothing happened" rather than as an error.
    const minimum = /\.svg$/i.test(page.image) ? 800 : 15_000;
    const size = fs.statSync(file).size;
    if (size < minimum) fail(`${at}: ${page.image} is only ${size} bytes.`);
    if (page.sound && !clips.has(page.sound)) {
      fail(`${at}: sound cue "${page.sound}" has no clip. playStorySound() uses the raw key — aliases do not apply here.`);
    }
    pagesChecked += 1;
  });

  // Files on disk the story no longer reaches.
  const expected = new Set(book.pages.map((page) => page.image));
  for (const name of fs.readdirSync(bookDir)) {
    if (!/^page-\d+\.(svg|webp|png|jpe?g)$/i.test(name)) continue;
    if (expected.has(name)) continue;
    if (isKnownSuperseded(book.id, name)) { supersededSeen.add(`${book.id}/${name}`); continue; }
    fail(`${where}: ${name} is on disk but no page in the catalogue uses it.`);
  }

  // Tap targets inside the illustrations.
  for (const page of book.pages) {
    if (!/\.svg$/i.test(page.image)) continue;
    const file = path.join(bookDir, page.image);
    if (!fs.existsSync(file)) continue;
    const markup = fs.readFileSync(file, "utf8");
    const taps = new Set([...markup.matchAll(/data-tap="([^"]+)"/g)].map((match) => match[1]));
    for (const tap of taps) {
      tapTargetsChecked += 1;
      const wanted = voiceGroups[tap]
        ? MOODS.map((mood) => `${voiceGroups[tap]}-${mood}`)
        : moodTypes.has(tap)
          ? MOODS.map((mood) => `${tap}-${mood}`)
          : [aliases[tap] || tap];
      const missing = wanted.filter((name) => !clips.has(name));
      if (missing.length) fail(`${where} ${page.image}: data-tap="${tap}" wants ${missing.join(", ")}.mp3, which does not exist.`);
    }
  }
}

// ---------------------------------------------------------------- orphan folders

for (const name of fs.readdirSync(ebooksRoot)) {
  if (!fs.statSync(path.join(ebooksRoot, name)).isDirectory()) continue;
  if (!claimedDirs.has(name)) fail(`ebooks/${name}/ is on disk but no catalogue entry claims it.`);
}

// A recorded exemption that no longer fires is a stale exemption. Fail, so the
// list is deleted deliberately rather than quietly kept forever.
for (const key of Object.keys(SUPERSEDED_PAGES)) {
  if (!supersededSeen.has(key)) fail(`SUPERSEDED_PAGES lists ${key}, but it is not on disk any more. Delete the entry.`);
}

// ---------------------------------------------------------------- book comprehension
//
// The `book-comprehension` section (Grades 1-4) points INTO the catalogue — a
// book id and 1-based page numbers per question — and a broken pointer ships
// as a blank answer card rather than an error, which is exactly the failure
// shape the rest of this gate exists for. The literal is sliced out of
// english.js the same way the catalogue is; an unreadable literal is exit 1,
// never a skip, because a gate that cannot read its target and passes is
// green about nothing.
let questionsChecked = 0;
let setsChecked = 0;
try {
  const sets = vm.runInNewContext(`(${literalBetweenBrackets(shellSource, "const BOOK_COMPREHENSION_SETS = [", "shell/subjects/english.js")})`);
  const setKeys = new Set();
  for (const set of sets) {
    const key = `g${set.grade}-u${set.unit}`;
    if (setKeys.has(key)) fail(`book-comprehension ${key}: duplicate set.`);
    setKeys.add(key);
    setsChecked += 1;
    const shelf = ebooksFor(ebookCatalog, set.grade, set.unit);
    const byId = new Map(shelf.map((book) => [book.id, book]));
    const kinds = { choice: 0, picture: 0, order: 0 };
    const used = new Set();
    const checkRef = (where, id, page) => {
      const book = byId.get(id);
      if (!book) { fail(`book-comprehension ${key} ${where}: "${id}" is not on this unit's shelf.`); return; }
      used.add(id);
      if (!(Number.isInteger(page) && page >= 2 && page <= book.pages.length)) fail(`book-comprehension ${key} ${where}: page ${page} does not exist in ${id} (2..${book.pages.length} — 1 is the cover).`);
    };
    (set.questions || []).forEach((question, index) => {
      const where = `q${index + 1}`;
      questionsChecked += 1;
      if (!question.q) fail(`book-comprehension ${key} ${where}: no question text.`);
      kinds[question.kind] = (kinds[question.kind] || 0) + 1;
      if (question.kind === "choice") {
        checkRef(where, question.book, question.page);
        if (!Array.isArray(question.options) || question.options.length !== 3 || new Set(question.options).size !== 3) fail(`book-comprehension ${key} ${where}: choice needs 3 unique options.`);
        if (!(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < (question.options || []).length)) fail(`book-comprehension ${key} ${where}: answer index does not resolve.`);
      } else if (question.kind === "picture") {
        (question.pick || []).forEach((item, j) => checkRef(`${where}.pick${j + 1}`, item.book, item.page));
        if (!Array.isArray(question.pick) || question.pick.length !== 3) fail(`book-comprehension ${key} ${where}: picture needs 3 picks.`);
        if (!(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < (question.pick || []).length)) fail(`book-comprehension ${key} ${where}: answer index does not resolve.`);
      } else if (question.kind === "order") {
        (question.order || []).forEach((page) => checkRef(where, question.book, page));
        if (!Array.isArray(question.order) || question.order.length !== 3) fail(`book-comprehension ${key} ${where}: order needs 3 pages.`);
        for (let k = 1; k < (question.order || []).length; k += 1) {
          if (!(question.order[k] > question.order[k - 1])) fail(`book-comprehension ${key} ${where}: order must be strictly ascending — the data states story order, the renderer does the shuffling.`);
        }
      } else fail(`book-comprehension ${key} ${where}: unknown kind "${question.kind}".`);
    });
    if ((set.questions || []).length && (kinds.choice !== 3 || kinds.picture !== 2 || kinds.order !== 1)) fail(`book-comprehension ${key}: kind mix choice ${kinds.choice}/picture ${kinds.picture}/order ${kinds.order}, expected 3/2/1.`);
    if (used.size && used.size < 3) fail(`book-comprehension ${key}: only ${used.size} distinct book(s) used — the set is about the shelf, not one book.`);
  }
  // The floor: every Grade 1-4 unit 1-10 carries a set (40 — unit 0 is
  // withdrawn and deliberately has none). A parser that matches nothing, or a
  // grade dropped whole, lands here rather than passing on vacuous truth.
  for (let grade = 1; grade <= 4; grade += 1) {
    for (let unit = 1; unit <= 10; unit += 1) {
      if (!setKeys.has(`g${grade}-u${unit}`)) fail(`book-comprehension: no question set for g${grade}-u${unit} — the section would silently vanish from that unit's nav and chain.`);
    }
  }
} catch (error) {
  fail(`book-comprehension: could not read BOOK_COMPREHENSION_SETS out of english.js (${error.message}).`);
}

// ---------------------------------------------------------------- report

const byGrade = {};
for (const book of ebookCatalog) for (const grade of book.grades) (byGrade[grade] ||= []).push(book.id);

if (problems.length) {
  console.error(`English eBook shelf: ${problems.length} problem${problems.length === 1 ? "" : "s"}.\n`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  books: ebookCatalog.length,
  pages: pagesChecked,
  tapTargets: tapTargetsChecked,
  comprehensionSets: setsChecked,
  comprehensionQuestions: questionsChecked,
  clips: clips.size,
  byGrade: Object.fromEntries(Object.entries(byGrade).map(([grade, ids]) => [`grade${grade}`, ids.length])),
}, null, 2));
