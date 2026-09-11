#!/usr/bin/env node
// Draws a banner for each Grade 3 English unit from the picture-book kit, and
// renders it to the PNG the course reads as `visual.image`.
//
// WHY. Every Grade 3 unit carried another grade's illustration as its banner -
// Units 2 and 3 both wore Grade 1's "Welcome and Calendar", Unit 10 wore Grade
// 2's capstone, and the rest borrowed Grade 1 unit pictures - the same finding
// Grade 4 had, closed the same way on the same day
// (tools/create-grade4-unit-banners.js). The Grade 3 picture books were built
// on each unit's own story device (create-grade3-ebook-illustrations.js), so
// every scene and person a banner needs already exists in
// tools/lib/ehel-ebook-kit-grade3.js, drawn as the readings describe them.
// Nothing here is a new drawing; it is one composition per unit out of parts
// the shelf already shows a learner.
//
// The banner is a still, not a page: no tap targets, no narration, and the
// kit's animation stylesheet is rendered at its first frame. 1600 x 1000, the
// kit's own frame.
//
// Usage: node tools/create-grade3-unit-banners.js [--svg-only]
// Output: src/prototypes/ehel-academy/english/assets/g3-unit-NN-<slug>.png
//         (and the .svg beside it, so the composition can be re-read)
const fs = require("fs");
const path = require("path");
const K = require("./lib/ehel-ebook-kit-grade3.js");
const {
  W, H, svgDocument, G3, figure, heldBook, heldPaper, heldShell, acacia, bench, bunting, easel,
  roomScene, roomBox, gardenScene, classroomScene, townScene, coastScene,
  gardenWall, boxOfIdeas, desk, shells, hospital, monthWall, poster, hourClock, courtHouse,
  bookShelf, rulerProp, photoFrame, folderProp, wateringCan, sapling,
} = K;

const OUT = path.join(__dirname, "..", "src", "prototypes", "ehel-academy", "english", "assets");
const f = figure;
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });

const BANNERS = [
  // Unit 1: Amal's big, warm family at home
  ["family", `${homeScene()}${roomBox(1320, 640, 1.05, "dining")}${photoFrame(420, 360, 1.1)}
    ${f("hana", { x: 230, y: 950, s: 1.5, holding: heldBook })}
    ${f("dad", { x: 450, y: 950, s: 1.5 })}
    ${f("mum", { x: 640, y: 950, s: 1.5 })}
    ${f("adam", { x: 820, y: 950, s: 1.45 })}
    ${f("amal", { x: 990, y: 950, s: 1.5, arms: "up" })}
    ${f("idris", { x: 1130, y: 950, s: 1.35 })}
    ${f("mina", { x: 1250, y: 952, s: 1.175 })}`],
  // Unit 2: the Grammar Champions in the classroom
  ["school", `${classroomScene({ boardText: "lines" })}${bookShelf(1330, 900, 1.1)}${desk(300, 950, 1.25)}
    ${f("yasmin", { x: 1130, y: 950, s: 1.575, arms: "point" })}
    ${f("amal", { x: 500, y: 950, s: 1.6, holding: heldBook })}
    ${f("daniel", { x: 690, y: 950, s: 1.55, holding: heldPaper })}
    ${f("nora", { x: 880, y: 950, s: 1.55, arms: "up" })}`],
  // Unit 3: the calendar on the wall, and the hours of the day
  ["time", `${classroomScene()}${monthWall(880, 380, 0.78, { columns: 4, highlight: 5 })}${hourClock(400, 115, 0.72, { hour: 8 })}
    ${f("amal", { x: 380, y: 950, s: 1.625, arms: "point" })}
    ${f("sami", { x: 1030, y: 950, s: 1.55 })}
    ${f("nora", { x: 1260, y: 950, s: 1.55, holding: heldPaper })}`],
  // Unit 4: the county centre - the hospital and the court
  ["community", `${townScene()}${hospital(360, 800, 0.62)}${courtHouse(1250, 800, 0.62)}
    ${f("sarah", { x: 620, y: 930, s: 1.55 })}
    ${f("amal", { x: 820, y: 940, s: 1.55, arms: "point" })}
    ${f("sami", { x: 990, y: 940, s: 1.5 })}
    ${f("yasmin", { x: 1440, y: 940, s: 1.5 })}`],
  // Unit 5: building the reading wall behind the garden
  ["actions", `${gardenScene()}${gardenWall(1000, 880, 0.9, { length: 560 })}${wateringCan(300, 920, 1)}
    ${f("yasmin", { x: 400, y: 910, s: 1.575, arms: "point" })}
    ${f("amal", { x: 690, y: 910, s: 1.6, arms: "up" })}
    ${f("leo", { x: 1370, y: 910, s: 1.55, holding: heldPaper })}`],
  // Unit 6: the girl who carried kindness, in the playground
  ["describing", `${townScene()}${acacia(1330, 640, 1.3)}${bench(230, 860, 1.1)}
    ${f("amal", { x: 470, y: 930, s: 1.575 })}
    ${f("nora", { x: 760, y: 930, s: 1.6, arms: "up" })}
    ${f("daniel", { x: 990, y: 930, s: 1.55 })}
    ${f("sami", { x: 1180, y: 930, s: 1.5 })}`],
  // Unit 7: the nature trip at the coast
  ["nature", `${coastScene()}${shells(1250, 930, 0.9, { count: 6 })}
    ${f("yasmin", { x: 360, y: 930, s: 1.6, arms: "point" })}
    ${f("leo", { x: 600, y: 930, s: 1.55 })}
    ${f("amal", { x: 820, y: 930, s: 1.625, arms: "up" })}
    ${f("nora", { x: 1020, y: 930, s: 1.575, holding: heldShell })}`],
  // Unit 8: measuring the shells in Class 3B
  ["measurement", `${classroomScene()}${desk(820, 950, 1.35)}${shells(820, 830, 0.7, { count: 7 })}${rulerProp(1240, 780, 1, { rotate: -8, length: 260 })}
    ${f("amal", { x: 500, y: 950, s: 1.6, holding: heldShell })}
    ${f("sami", { x: 1120, y: 950, s: 1.55, arms: "point" })}
    ${f("yasmin", { x: 1380, y: 950, s: 1.55 })}`],
  // Unit 9: the Box of Ideas
  ["ideas", `${classroomScene()}${boxOfIdeas(820, 900, 1.05)}
    ${f("sami", { x: 520, y: 950, s: 1.55, holding: heldPaper })}
    ${f("amal", { x: 1100, y: 950, s: 1.6, arms: "up" })}
    ${f("yasmin", { x: 1330, y: 950, s: 1.575 })}`],
  // Unit 10: the Year 3 showcase
  ["capstone", `${classroomScene()}${bunting(800, 150, 1.2, { span: 1180 })}
    ${easel(1290, 950, 1.2, { inner: poster(0, 0, 0.5, { colour: G3.teal }) })}
    ${folderProp(420, 880, 1.1)}
    ${f("amal", { x: 620, y: 950, s: 1.7, holding: heldPaper })}
    ${f("hana", { x: 850, y: 950, s: 1.5 })}
    ${f("yasmin", { x: 1080, y: 950, s: 1.55, arms: "point" })}`],
];

async function main() {
  const svgOnly = process.argv.includes("--svg-only");
  fs.mkdirSync(OUT, { recursive: true });
  const files = [];
  BANNERS.forEach(([slug, body], i) => {
    const name = `g3-unit-${String(i + 1).padStart(2, "0")}-${slug}`;
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
