#!/usr/bin/env node
// Draws a banner for each Grade 4 English unit from the picture-book kit, and
// renders it to the PNG the course reads as `visual.image`.
//
// WHY. Every Grade 4 unit carried a Grade 1 or Grade 2 illustration as its
// banner (Unit 1 wore "Welcome and Calendar", Units 4 and 9 shared the city,
// Units 3 and 5 shared "Ready, Steady, Go!") - the same finding the Grade 1
// validation recorded under area 14, wider here. The Grade 4 picture books
// were built on each unit's own story device (create-grade4-ebook-
// illustrations.js), so the scenes a banner needs already exist in
// tools/lib/ehel-ebook-kit-grade4*.js, drawn with the cast the readings name.
// Nothing here is a new drawing; it is one composition per unit out of parts
// the shelf already shows a learner.
//
// The banner is a still, not a page: no tap targets, no narration, and the
// kit's animation stylesheet is rendered at its first frame. 1600 x 1000, the
// kit's own frame, which the lecture renderer covers and the shell's
// .unit-banner scales.
//
// Usage: node tools/create-grade4-unit-banners.js [--svg-only]
// Output: src/prototypes/ehel-academy/english/assets/g4-unit-NN-<slug>.png
//         (and the .svg beside it, so the composition can be re-read)
const fs = require("fs");
const path = require("path");
const K = require("./lib/ehel-ebook-kit-grade4-shelf.js");
const {
  W, H, svgDocument, figure4, figureShelf, dog,
  basicScene, townScene, sunsetScene, classroomScene, hallScene, stationScene, mallScene,
  postCounterScene, counter, letterProp, scienceTent, stormScene, hailFall, farmField, bakeryFront, foodTray,
  libraryCart, circularNews, caveScene, stageScene, chairRows, telescope, atticScene, oldBoxes, toolRack,
  passengerTrain, signpost, paradeBanner, poster, easel, acacia, tallGrass, bunting, lampPost, marketStall,
  heldPaper, heldBook, heldFolder, heldNewspaper, heldBasket,
} = K;

const OUT = path.join(__dirname, "..", "src", "prototypes", "ehel-academy", "english", "assets");
const f = figure4, s = figureShelf;

const BANNERS = [
  ["daily-life", `${postCounterScene()}${counter(880, 950, 1, { parcels: 4 })}
    ${letterProp(700, 690, 1.15, { open: true })}
    ${f("omar", { x: 1200, y: 930, s: 1.5, arms: "point" })}
    ${f("amal", { x: 430, y: 950, s: 1.5, holding: heldPaper })}`],
  ["nature-weather", `${stormScene()}${scienceTent(860, 780, 0.86, { stormy: true })}
    ${f("amal", { x: 330, y: 950, s: 1.5, mood: "surprised" })}
    ${f("nora", { x: 1330, y: 950, s: 1.45 })}
    ${hailFall({ stones: 36 })}`],
  ["food-health", `${basicScene()}${farmField(360, 900, 1, { rows: 5 })}${bakeryFront(1260, 930, 0.9)}
    ${foodTray(1000, 948, 0.9, { bowls: 3 })}
    ${f("hana", { x: 700, y: 950, s: 1.5, holding: heldBasket })}
    ${f("amal", { x: 460, y: 950, s: 1.5 })}`],
  ["community", `${townScene()}${libraryCart(1150, 930, 1)}
    ${circularNews(680, 590, 0.85)}
    ${s("librarian", { x: 1360, y: 930, s: 1.5, arms: "point" })}
    ${f("maya", { x: 560, y: 930, s: 1.5, holding: heldNewspaper })}
    ${f("amal", { x: 790, y: 930, s: 1.5, holding: heldBook })}`],
  ["action-movement", `${caveScene()}
    ${f("amal", { x: 520, y: 950, s: 1.5, arms: "point" })}
    ${f("leo", { x: 800, y: 950, s: 1.5 })}
    ${f("nora", { x: 1050, y: 950, s: 1.45 })}
    ${dog(1320, 960, 1.15, { thin: true, sitting: true })}`],
  ["people-society", `${townScene()}${bunting(800, 200, 1.1, { span: 1400 })}${marketStall(1380, 900, 0.8)}
    ${s("karim", { x: 400, y: 930, s: 1.5 })}
    ${s("caretaker", { x: 680, y: 930, s: 1.5 })}
    ${f("omar", { x: 960, y: 930, s: 1.5 })}
    ${f("amal", { x: 1220, y: 930, s: 1.5, holding: heldPaper, arms: "up" })}`],
  ["emotions-identity", `${stageScene({ open: true })}
    ${f("yasmin", { x: 300, y: 930, s: 1.4 })}
    ${f("amal", { x: 720, y: 900, s: 1.5, arms: "up" })}
    ${f("sami", { x: 1040, y: 900, s: 1.5, mood: "surprised" })}`],
  ["tools-machines", `${atticScene()}${oldBoxes(1280, 900, 1)}${telescope(380, 820, 1)}
    ${f("amal", { x: 720, y: 950, s: 1.5, holding: heldFolder })}
    ${f("leo", { x: 1020, y: 950, s: 1.5, arms: "point" })}`],
  ["places-plans", `${stationScene()}${passengerTrain(1120, 730, 0.85)}
    ${s("uncle", { x: 920, y: 930, s: 1.5 })}
    ${f("amal", { x: 420, y: 950, s: 1.5 })}
    ${f("noah", { x: 660, y: 950, s: 1.5, arms: "point" })}`],
  ["capstone", `${hallScene()}${chairRows(1340, 950, 0.7, { rows: 2, seats: 5 })}${poster(300, 520, 1)}${bunting(800, 180, 1.1, { span: 1100 })}
    ${f("amal", { x: 640, y: 950, s: 1.5, holding: heldFolder })}
    ${f("yasmin", { x: 940, y: 930, s: 1.45, arms: "point" })}`],
];

async function main() {
  const svgOnly = process.argv.includes("--svg-only");
  fs.mkdirSync(OUT, { recursive: true });
  const files = [];
  BANNERS.forEach(([slug, body], i) => {
    const name = `g4-unit-${String(i + 1).padStart(2, "0")}-${slug}`;
    const svg = path.join(OUT, `${name}.svg`);
    fs.writeFileSync(svg, svgDocument(body));
    files.push([name, svg]);
  });
  if (svgOnly) { console.log(`wrote ${files.length} svg`); return; }
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const [name, svg] of files) {
    const markup = fs.readFileSync(svg, "utf8");
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:#fff}svg{display:block;width:${W}px;height:${H}px}</style></head><body>${markup}</body></html>`);
    await page.waitForTimeout(120);
    const png = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: png, type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`  ${name}.png  ${fs.statSync(png).size} bytes`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
