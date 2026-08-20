#!/usr/bin/env node

// Writes the STORY.txt and ATTRIBUTION.txt that sit beside each original
// picture book, for the Grade 2 (Zuri) shelf.
//
// They are GENERATED, not hand-written, because the shipped words live in the
// catalogue in shell/subjects/english.js and nowhere else. The Grade 1 folders
// carry hand-typed copies of the same lines, and a hand-typed copy of shipped
// text is a copy that goes stale the first time a sentence is corrected — the
// review workbook then shows the reviewer a story the app no longer tells.
//
// Only the per-book notes below (unit, themes, cameos, vocabulary) are authored
// here. The page lines and the attribution come from the catalogue.
//
// Usage: node tools/write-english-ebook-docs.mjs [--dry]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ebooksRoot = path.join(root, "src", "prototypes", "ehel-academy", "english", "ebooks");
const shellPath = path.join(root, "src", "prototypes", "ehel-academy", "shell", "subjects", "english.js");
const shellSource = fs.readFileSync(shellPath, "utf8");
const dryRun = process.argv.includes("--dry");

// Same bracket slice the ebook gate uses, comments and all.
function literalBetweenBrackets(source, declaration) {
  const start = source.indexOf(declaration);
  if (start < 0) throw new Error(`${declaration} not found`);
  const open = source.indexOf("[", start);
  let depth = 0;
  let inString = null;
  let inComment = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (inComment) {
      if (inComment === "line" && ch === "\n") inComment = null;
      else if (inComment === "block" && ch === "*" && source[i + 1] === "/") { inComment = null; i += 1; }
      continue;
    }
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") { inComment = "line"; i += 1; continue; }
    if (ch === "/" && source[i + 1] === "*") { inComment = "block"; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "[") depth += 1;
    if (ch === "]") { depth -= 1; if (depth === 0) return source.slice(open, i + 1); }
  }
  throw new Error(`${declaration} is not closed`);
}

const catalog = vm.runInNewContext(`(${literalBetweenBrackets(shellSource, "const ebookCatalog = [")})`);

// The only authored content in this file: what each book is FOR. The unit
// vocabulary lines are the words the story deliberately reuses, taken from that
// unit's vocabularyGroups — a reviewer reads this to check the story is doing
// its revision job, so it must name the unit's own words, not a summary.
const NOTES = {
  "zuris-first-week": {
    book: 1, term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, spell, hello, goodbye, partner, friend, like, calendar, day, week, month, date, birthday, book, tablet, chart, word, the colours, one to twelve, first, second, twelfth",
    themes: "starting somewhere new, making the first friend of the year",
    cameos: "Miss Twiga, Kiki, the little elephant and the ostrich from the Grade 1 books.",
  },
  "who-helps-our-street": {
    book: 2, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, bus driver, window cleaner, police officer, firefighter, helmet, boots, gloves, doctor, nurse, teacher, farmer, shopkeeper, reporter, helping, teaching, rescuing, growing, driving",
    themes: "a neighbourhood is the people in it; wanting to help in your turn",
    cameos: "Duku the donkey as the farmer, Koko the hen as the shopkeeper, Miss Twiga teaching.",
  },
  "move-like-me": {
    book: 3, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, touch, turn, stand, reach, flap, exercise, healthy, strong, water, sleep, energy",
    themes: "moving every day, eating well, sleeping well",
    cameos: "Musa the zebra running the field; the little elephant and the ostrich join in.",
  },
  "zuri-and-her-shadow": {
    book: 4, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, long, short, high, low, bright, dark, grey, cloudy, sunny",
    themes: "noticing something ordinary and asking why; a whole day and night",
    cameos: "Miss Twiga explains the light; Zuri's mama at the burrow.",
  },
  "how-tall-how-long": {
    book: 5, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "measure, ruler, centimetre, metre, length, height, weight, size, circle, square, triangle, rectangle, heart, pattern, big, small, tall, short, heavy, light, wide, narrow, ten to one hundred",
    themes: "measuring turns 'bigger' into a number you can say",
    cameos: "Miss Twiga is the tall one; the chick from The Little Lost Chick is the small one.",
  },
  "the-six-leg-club": {
    book: 6, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "looking closely; a rule that decides what counts as an insect",
    cameos: "Kiki names the rule; Miss Twiga rules the spider out of the club.",
  },
  "one-small-seed": {
    book: 7, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, thankful, important",
    themes: "patience; looking after a place you share",
    cameos: "Miss Twiga hands out the seeds; Zuri's mama explains the roots.",
  },
  "every-home-is-different": {
    book: 8, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, flat, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "difference without ranking; belonging",
    cameos: "Kiki's tree house in the baobab, Musa on the open savanna.",
  },
  "a-day-in-the-big-city": {
    book: 9, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, market, shopping centre, underground, ferry, Ferris wheel, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "a big place is findable if you can read the map",
    cameos: "Lulu the swallow over the water, closing the journey she began in Grade 1.",
  },
  "zuris-book-of-the-year": {
    book: 10, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one page for each of Units 1-9: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "gathering a year up; looking forward to the next one",
    cameos: "the whole cast — Musa, Kiki, Duku, Lulu, Miss Twiga, the elephant and the ostrich.",
  },
};

let written = 0;
for (const book of catalog) {
  const notes = NOTES[book.id];
  if (!notes) continue;
  const bookDir = path.join(ebooksRoot, book.id);
  if (!fs.existsSync(bookDir)) throw new Error(`${book.id}: no illustration folder. Run create-grade2-ebook-illustrations.js first.`);

  const story = [
    book.title.toUpperCase(),
    `Grade 2 - ${book.level}`,
    `Zuri series, book ${notes.book} (${notes.term}, ${notes.unit})`,
    "",
    ...book.pages.map((page, index) => `${index + 1}. ${page.text}`),
    "",
    `Unit vocabulary reinforced: ${notes.vocabulary}.`,
    `Themes: ${notes.themes}`,
    `Cameos: ${notes.cameos}`,
    "",
    "GENERATED by tools/write-english-ebook-docs.mjs from the ebookCatalog entry",
    "in shell/subjects/english.js. Edit the catalogue, then re-run - never this file.",
    "",
  ].join("\n");

  const attribution = [
    `${book.attribution}`,
    "",
    `Story: ${book.author}`,
    `Illustrations: ${book.illustrator} - original animated vector pages from`,
    "the shared series kit in tools/lib/ehel-ebook-kit.js and",
    "tools/lib/ehel-ebook-kit-grade2.js, composed by",
    "tools/create-grade2-ebook-illustrations.js.",
    "",
    "GENERATED by tools/write-english-ebook-docs.mjs.",
    "",
  ].join("\n");

  for (const [name, contents] of [["STORY.txt", story], ["ATTRIBUTION.txt", attribution]]) {
    const file = path.join(bookDir, name);
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (current === contents) continue;
    if (dryRun) { console.log(`would write ${path.relative(root, file)}`); continue; }
    fs.writeFileSync(file, contents, "utf8");
    written += 1;
  }
}

console.log(dryRun ? "dry run complete" : `Wrote ${written} companion file${written === 1 ? "" : "s"}.`);
