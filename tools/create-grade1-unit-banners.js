#!/usr/bin/env node
// Renders a banner for each Grade 1 English unit from that unit's own picture
// book, to the PNG the course reads as `visual.image`.
//
// WHY. Every Grade 1 unit wore a GRADE 2 picture as its banner - the shared
// assets/unit-N-*.png files are Grade 2's unit pictures (Welcome and Calendar,
// Ready Steady Go, The Big Sky ...), and Grade 1 borrowed them, Units 3 and 6
// the same one and Units 7 and 9 the same one, with Unit 10 taking Grade 2's
// capstone picture. The Grade 1 validation named it (area 14); Grades 3 and 4
// were given their own banners on 2026-09-11 (create-grade{3,4}-unit-banners.js).
//
// Grade 1 needs no new composition: each unit already has its own Amal book,
// drawn for that unit (create-amal-ebook-illustrations.js, catalogued in
// shell/subjects/english.js with grades [1] and units [n]), and its cover page
// is the unit's picture. This renders that cover as a still - first animation
// frame, no taps - at the kit's 1600 x 1000 frame.
//
// Usage: node tools/create-grade1-unit-banners.js
// Output: src/prototypes/ehel-academy/english/assets/g1-unit-NN-<book>.png
const fs = require("fs");
const path = require("path");

const ENGLISH = path.join(__dirname, "..", "src", "prototypes", "ehel-academy", "english");
const OUT = path.join(ENGLISH, "assets");
const W = 1600, H = 1000;
// unit -> that unit's own book (ebookCatalog: grades [1], units [n])
const BOOKS = [
  "amals-first-day", "breakfast-at-grandmas-house", "amal-and-the-big-ball", "amal-makes-a-mat",
  "amal-and-the-little-hen", "amal-at-the-market", "amals-big-bus-ride", "the-well-in-the-village",
  "a-walk-around-town", "amals-english-year",
];

async function main() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const [i, book] of BOOKS.entries()) {
    const svg = path.join(ENGLISH, "ebooks", book, "page-01.svg");
    if (!fs.existsSync(svg)) throw new Error(`no cover for ${book}: ${svg}`);
    const markup = fs.readFileSync(svg, "utf8");
    // the kit's animations run from their first frame; pause them so the still is that frame
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:#fff}svg{display:block;width:${W}px;height:${H}px}*{animation-play-state:paused!important;animation-delay:0s!important}</style></head><body>${markup}</body></html>`);
    await page.waitForTimeout(120);
    const name = `g1-unit-${String(i + 1).padStart(2, "0")}-${book}.png`;
    await page.screenshot({ path: path.join(OUT, name), type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`  ${name}`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
