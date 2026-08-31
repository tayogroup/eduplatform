#!/usr/bin/env node

// Generates the vector illustrations for the SIXTH and SEVENTH books of Grade
// 4's Units 6-10 — the owner is growing every Grade 4 shelf from five books to
// seven, and this file carries this lane's ten:
//
//   Unit 6  The Day the Bridge Opened   (the next scene of Elena's Bridge)
//           The Exact Word              (vocabulary: describing and comparing)
//   Unit 7  The Second Show             (the next scene of The Day of the Play)
//           The Thank-You Surprise      (vocabulary: the -sion words)
//   Unit 8  The Letter from Long Ago    (the next scene of The Attic Clue)
//           The Invention Table         (vocabulary: -tion and -al words)
//   Unit 9  The Train Home              (the next scene of A Trip to the Capital)
//           The Souvenir That Disappeared (vocabulary: the prefixes, thinking it through)
//   Unit 10 The Tenth Room              (after the Exhibition — the capstone's coda)
//           Amal the Author             (vocabulary: telling and talking)
//
// Modeled exactly on create-grade4-shelf-ebook-illustrations.js: the same
// require, the same scene shorthands, pages arrays of SVG template strings, a
// books map and one writeBooks call. Every character is an existing cast
// member; every NEW prop is a purely local inline const carrying no data-tap
// (a tap value promises an audio clip nobody has paid for).
//
// Usage: node tools/create-grade4-shelf-ebook-illustrations-3.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, basicScene, acacia, tallGrass, bench, mango, marketStall,
  lampPost, cityBuildings, lake, river, wildBird, goat, hen, dustPuffs, confetti,
  sunnyPatch, nightScene, fence, cookpot, thoughtBubble, nest, schoolBell,
  G2, roomScene, roomBox, sunsetScene, bookShelf, openBook, house, hut,
  libraryBuilding, crossing, mapProp, bunting, easel, lookLine, motionArcs,
  clinicFront, doctorKit,
  G3, heldBook, heldPaper, classroomScene, plainRoomScene, townScene,
  desk, poster,
  postCounterScene, counter, letterProp, telescope, atticScene, oldBoxes, farmField,
  capitalScene, signpost, museum, paradeBanner,
  figureShelf, cat,
  bakeryFront, keyRing, corridorScene,
  chairRows, hallScene, bridgeSite, helmetProp,
  toolRack, ringedPlanet, craterMoon, starrySky, counterTop,
  lorry, factory, passengerTrain, stationScene, stageScene, libraryCart,
  heldNewspaper, heldNotebook, heldKey,
} = require("./lib/ehel-ebook-kit-grade4-shelf.js");

const f = figureShelf;

// The same scene shorthands the earlier Grade 4 generators use, so a place that
// appears on two shelves is the same place.
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const kitchenScene = () => roomScene({ wall: "#e6e0cc", floor: "#b9865e" });
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;
const fieldScene = () => `${basicScene()}${acacia(180, 640, 1.1)}${tallGrass(1480, 940, 1.2)}`;
const lakeScene = () => `${basicScene()}${lake(800, 700, 660, 96)}`;
const clinicScene = () => `${townScene()}${clinicFront(1240, 900, 0.86)}`;
const marketScene = () => `${townScene()}${marketStall(1220, 900, 0.9)}${marketStall(300, 900, 0.72)}`;
const bakeryScene = () => `${townScene()}${bakeryFront(1180, 900, 0.86)}${lampPost(300, 706, 0.86)}`;
const riverBridge = (opts) => `${basicScene()}${river(760, 830, 1.8)}${bridgeSite(800, 750, 0.84, opts)}`;

// ---------------------------------------------------------------- local props
//
// Inline consts only — nothing here joins the kit, nothing carries a data-tap.

// Two posts and a ribbon across the way, for the bridge opening.
function ribbonGate(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-210" y="-190" width="14" height="190" rx="6" fill="#8a6242" stroke="${C.ink}" stroke-width="4"/>
    <rect x="196" y="-190" width="14" height="190" rx="6" fill="#8a6242" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -200 -150 q 200 30 400 0" fill="none" stroke="${G3.coral}" stroke-width="14" stroke-linecap="round"/>
    <path d="M 0 -136 l -22 34 l 18 -6 l 10 30 l 8 -32 l 18 8 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="3"/>
  </g>`;
}

// A two-tier thank-you cake on a plate.
function cakeProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="96" ry="16" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.6"/>
    <rect x="-72" y="-58" width="144" height="56" rx="9" fill="#c98f6a" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -72 -58 q 18 16 36 0 q 18 16 36 0 q 18 16 36 0 q 18 16 36 0 v 10 h -144 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="-46" y="-104" width="92" height="46" rx="8" fill="#e8705c" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -46 -104 q 12 12 23 0 q 12 12 23 0 q 12 12 23 0 q 12 12 23 0 v 8 h -92 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="2.8"/>
    <path d="M 0 -104 v -24" stroke="${G3.gold}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="0" cy="-134" r="8" fill="${G3.gold}" stroke="${C.ink}" stroke-width="2.6"/>
  </g>`;
}

// The same cake hidden under a cloth, for the pages before the surprise.
function coveredTray(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="100" ry="16" fill="#d3c3a4" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -92 -6 q -8 -120 92 -128 q 100 8 92 128 z" fill="${G3.teal}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -60 -40 q 60 -22 120 0 M -74 -14 q 74 -26 148 0" stroke="${G3.tealDark}" stroke-width="4" fill="none" opacity="0.7"/>
  </g>`;
}

// A comet: a bright head with a long tail, for Grandma Hana's father's letter.
function cometStreak(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="anim-glow">
      <path d="M 0 0 L 320 -140 L 300 -96 L 12 24 z" fill="#f6e9a8" opacity="0.55"/>
      <circle cx="0" cy="10" r="26" fill="#fff6cf" stroke="#f0d488" stroke-width="5"/>
    </g>
  </g>`;
}

// A wooden rack of letter slots — Amal's invention for Omar's post counter.
function letterRack(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-120" y="-150" width="240" height="150" rx="8" fill="#c9a06c" stroke="${C.ink}" stroke-width="4.4"/>
    ${[0, 1].map((r) => [0, 1, 2].map((c) => `<rect x="${-100 + c * 72}" y="${-130 + r * 66}" width="56" height="52" rx="4" fill="#a8845a" stroke="${C.ink}" stroke-width="3"/>`).join("")).join("")}
    <rect x="-92" y="-124" width="40" height="30" rx="3" fill="${G3.cream}" stroke="${C.ink}" stroke-width="2.6"/>
    <rect x="52" y="-58" width="40" height="30" rx="3" fill="${G3.cream}" stroke="${C.ink}" stroke-width="2.6"/>
  </g>`;
}

// A little rain roof on two posts, over the hens — Idris's invention.
function henShelter(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-108" y="-160" width="12" height="160" rx="5" fill="#8a6242" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="96" y="-160" width="12" height="160" rx="5" fill="#8a6242" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -140 -150 L 0 -216 L 140 -150 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="4.4" stroke-linejoin="round"/>
  </g>`;
}

// A leaning ladder, for the caretaker and the nest.
function ladderProp(x, y, s = 1, { lean = -14 } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${lean})">
    <rect x="-46" y="-380" width="12" height="380" rx="5" fill="#a8845a" stroke="${C.ink}" stroke-width="3.6"/>
    <rect x="34" y="-380" width="12" height="380" rx="5" fill="#a8845a" stroke="${C.ink}" stroke-width="3.6"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="-40" y="${-340 + i * 60}" width="80" height="10" rx="4" fill="#c9a06c" stroke="${C.ink}" stroke-width="2.8"/>`).join("")}
  </g>`;
}

// A single loose feather on the window sill.
function featherProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(24)">
    <path d="M 0 0 q -34 -60 -6 -120 q 40 52 14 118 z" fill="#9fb4c6" stroke="${C.ink}" stroke-width="3"/>
    <path d="M 2 -4 q -8 -56 -4 -110" stroke="${C.ink}" stroke-width="2.6" fill="none"/>
  </g>`;
}

// ================================================================ Unit 6

// Book 6 — The Day the Bridge Opened (the next scene of Elena's Bridge)
const bridgeOpenedPages = [
  `${riverBridge({ done: true })}${bunting(760, 200, 1.2, { span: 1080 })}
   ${f("elena", { x: 420, y: 926, s: 1.5 })}
   ${f("amal", { x: 640, y: 926, s: 1.55 })}
   ${f("mayor", { x: 1180, y: 926, s: 1.5 })}`,

  `${basicScene()}${river(760, 840, 1.7)}${bridgeSite(860, 770, 0.66)}${helmetProp(380, 926, 1.15)}
   ${f("elena", { x: 560, y: 926, s: 1.5, arms: "point" })}
   ${f("labourer", { x: 1100, y: 926, s: 1.48 })}`,

  `${riverBridge({ done: true })}
   ${f("elena", { x: 560, y: 926, s: 1.52, arms: "up" })}
   ${f("karim", { x: 1160, y: 926, s: 1.48 })}`,

  `${riverBridge({ done: true })}${ribbonGate(500, 926, 1)}
   ${f("mayor", { x: 760, y: 926, s: 1.5 })}
   ${f("omar", { x: 1140, y: 926, s: 1.45 })}
   ${f("nora", { x: 1320, y: 926, s: 1.45 })}`,

  `${riverBridge({ done: true })}
   ${f("elena", { x: 640, y: 926, s: 1.55, arms: "point" })}
   ${f("amal", { x: 1060, y: 926, s: 1.5 })}
   ${f("nora", { x: 1260, y: 926, s: 1.45 })}`,

  `${riverBridge({ done: true })}${ribbonGate(430, 926, 0.95)}
   ${f("amal", { x: 700, y: 926, s: 1.55, arms: "up", mood: "happy" })}
   ${f("nora", { x: 920, y: 926, s: 1.5, arms: "up" })}
   ${f("mayor", { x: 1280, y: 926, s: 1.45 })}`,

  `${riverBridge({ done: true })}${paradeBanner(420, 926, 0.9, { colour: G3.gold })}
   ${f("omar", { x: 760, y: 926, s: 1.48, arms: "up" })}
   ${f("sami", { x: 990, y: 926, s: 1.45, arms: "up" })}`,

  `${riverBridge({ done: true })}${keyRing(1010, 800, 0.85)}
   ${f("karim", { x: 560, y: 926, s: 1.48 })}
   ${f("caretaker", { x: 1120, y: 926, s: 1.48, arms: "up" })}`,

  `${riverBridge({ done: true })}
   ${f("hana", { x: 800, y: 926, s: 1.5 })}
   ${f("amal", { x: 480, y: 926, s: 1.5 })}`,

  `${riverBridge({ done: true })}
   ${f("hana", { x: 720, y: 926, s: 1.52, arms: "point" })}
   ${f("amal", { x: 980, y: 926, s: 1.5, mood: "surprised" })}`,

  `${sunsetScene()}${river(700, 850, 1.5)}${bridgeSite(840, 780, 0.62, { done: true })}${lampPost(320, 940, 0.95, { lit: true })}
   ${f("elena", { x: 620, y: 940, s: 1.48 })}
   ${f("amal", { x: 860, y: 940, s: 1.5 })}`,

  `${riverBridge({ done: true })}${confetti(800, 480)}
   ${f("theo", { x: 420, y: 926, s: 1.45, arms: "up" })}
   ${f("noah", { x: 640, y: 926, s: 1.45, arms: "up" })}
   ${f("salma", { x: 1120, y: 926, s: 1.45 })}
   ${f("amal", { x: 1330, y: 926, s: 1.5, arms: "up" })}`,
];

// Book 7 — The Exact Word (vocabulary in action: describing and comparing)
const exactWordPages = [
  `${townScene()}${lampPost(280, 706, 0.9)}${cityBuildings(1300, 700, 0.7)}
   ${f("maya", { x: 660, y: 926, s: 1.55, holding: heldNotebook })}
   ${f("amal", { x: 900, y: 926, s: 1.5 })}`,

  `${classroomScene()}${poster(1250, 650, 1.15, { colour: G3.teal, lines: 4 })}
   ${f("maya", { x: 700, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5 })}`,

  `${townScene()}${lampPost(1280, 706, 0.9)}
   ${f("maya", { x: 640, y: 926, s: 1.55, holding: heldNotebook, mood: "sad" })}
   ${f("amal", { x: 880, y: 926, s: 1.5, arms: "point" })}`,

  `${marketScene()}${mango(700, 890, 1.2)}
   ${f("omar", { x: 1120, y: 926, s: 1.45 })}
   ${f("salma", { x: 900, y: 926, s: 1.42 })}
   ${f("maya", { x: 480, y: 926, s: 1.52, holding: heldNotebook })}
   ${f("amal", { x: 680, y: 926, s: 1.5 })}`,

  `${lakeScene()}${sunnyPatch(780, 700)}${wildBird(1280, 260, 1.1, true)}
   ${f("amal", { x: 620, y: 926, s: 1.52 })}
   ${f("maya", { x: 860, y: 926, s: 1.52, holding: heldNotebook })}`,

  `${basicScene()}${acacia(1100, 640, 1.6)}${tallGrass(280, 940, 1.1)}
   ${f("amal", { x: 560, y: 926, s: 1.52, arms: "point" })}
   ${f("maya", { x: 800, y: 926, s: 1.5, mood: "surprised", holding: heldNotebook })}`,

  `${marketScene()}${mango(760, 890, 1.35)}
   ${f("omar", { x: 1120, y: 926, s: 1.48, arms: "point" })}
   ${f("amal", { x: 620, y: 926, s: 1.52 })}`,

  `${bakeryScene()}
   ${f("sami", { x: 640, y: 926, s: 1.48, mood: "happy" })}
   ${f("maya", { x: 880, y: 926, s: 1.52, holding: heldNotebook })}`,

  `${clinicScene()}${doctorKit(380, 926, 1.05)}
   ${f("sarah", { x: 1020, y: 926, s: 1.48, arms: "point" })}
   ${f("maya", { x: 640, y: 926, s: 1.52, holding: heldNotebook })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("maya", { x: 700, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("nora", { x: 960, y: 950, s: 1.5 })}
   ${f("amal", { x: 460, y: 950, s: 1.52 })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5, arms: "up" })}
   ${f("maya", { x: 700, y: 950, s: 1.55, holding: heldNotebook, mood: "happy" })}`,

  `${plainRoomScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.gold, lines: 5 }) })}
   ${f("maya", { x: 700, y: 950, s: 1.55, arms: "up" })}
   ${f("amal", { x: 950, y: 950, s: 1.52, arms: "up" })}`,
];

// ================================================================ Unit 7

// Book 6 — The Second Show (the next scene of The Day of the Play)
const secondShowPages = [
  `${stageScene()}${bunting(800, 240, 1.1, { span: 1000 })}
   ${f("sami", { x: 720, y: 960, s: 1.52 })}
   ${f("amal", { x: 960, y: 960, s: 1.55 })}`,

  `${classroomScene()}
   ${f("sami", { x: 720, y: 950, s: 1.52, mood: "happy" })}
   ${f("amal", { x: 980, y: 950, s: 1.55 })}`,

  `${classroomScene()}${poster(1250, 650, 1.1, { colour: G3.plum, lines: 3 })}
   ${f("yasmin", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("sami", { x: 700, y: 950, s: 1.52, mood: "surprised" })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("sami", { x: 760, y: 950, s: 1.52, mood: "sad" })}`,

  `${yardScene()}
   ${f("amal", { x: 640, y: 926, s: 1.55, arms: "point" })}
   ${f("sami", { x: 900, y: 926, s: 1.5 })}`,

  `${yardScene()}${bench(300, 940, 1.1)}
   ${f("sami", { x: 700, y: 926, s: 1.52, arms: "up" })}
   ${f("amal", { x: 960, y: 926, s: 1.5 })}`,

  `${stageScene()}${chairRows(700, 950, 0.8, { rows: 2, seats: 4 })}
   ${f("mina", { x: 1220, y: 960, s: 1.35, mood: "happy" })}
   ${f("adam", { x: 1400, y: 960, s: 1.35, arms: "up" })}`,

  `${stageScene()}
   ${f("sami", { x: 800, y: 960, s: 1.55 })}`,

  `${stageScene()}
   ${f("sami", { x: 680, y: 960, s: 1.52, arms: "up" })}
   ${f("nora", { x: 920, y: 960, s: 1.5, mood: "surprised" })}
   ${f("mina", { x: 1220, y: 960, s: 1.35, mood: "surprised" })}`,

  `${stageScene()}${confetti(800, 500)}
   ${f("sami", { x: 700, y: 960, s: 1.52, arms: "up" })}
   ${f("amal", { x: 940, y: 960, s: 1.55, arms: "up" })}
   ${f("adam", { x: 1200, y: 960, s: 1.35, arms: "up" })}`,

  `${stageScene()}
   ${f("sami", { x: 740, y: 960, s: 1.55, mood: "happy" })}
   ${f("amal", { x: 1000, y: 960, s: 1.52 })}`,

  `${classroomScene()}${poster(1250, 650, 1.2, { colour: G3.coral, lines: 3 })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "up" })}
   ${f("sami", { x: 660, y: 950, s: 1.52, mood: "happy" })}`,
];

// Book 7 — The Thank-You Surprise (vocabulary in action: the -sion words)
const thankYouPages = [
  `${kitchenScene()}${counterTop(1220, 950, 1)}${cakeProp(1220, 776, 0.9)}
   ${f("amal", { x: 560, y: 950, s: 1.55 })}
   ${f("nora", { x: 800, y: 950, s: 1.5 })}
   ${f("mum", { x: 1020, y: 950, s: 1.48 })}`,

  `${classroomScene()}
   ${f("amal", { x: 620, y: 950, s: 1.55, arms: "point" })}
   ${f("nora", { x: 880, y: 950, s: 1.5 })}
   ${f("sami", { x: 1100, y: 950, s: 1.48 })}`,

  `${yardScene()}${bench(300, 940, 1.1)}
   ${f("amal", { x: 560, y: 926, s: 1.52, arms: "point" })}
   ${f("nora", { x: 780, y: 926, s: 1.5 })}
   ${f("sami", { x: 980, y: 926, s: 1.48, arms: "point" })}
   ${f("leo", { x: 1180, y: 926, s: 1.48 })}`,

  `${classroomScene()}
   ${f("amal", { x: 500, y: 950, s: 1.52, arms: "point" })}
   ${f("nora", { x: 700, y: 950, s: 1.48 })}
   ${f("sami", { x: 1060, y: 950, s: 1.48, arms: "point" })}
   ${f("leo", { x: 1260, y: 950, s: 1.48 })}`,

  `${classroomScene()}
   ${f("nora", { x: 800, y: 950, s: 1.55, arms: "up", mood: "happy" })}
   ${f("amal", { x: 540, y: 950, s: 1.5, mood: "happy" })}
   ${f("sami", { x: 1060, y: 950, s: 1.48, mood: "happy" })}`,

  `${kitchenScene()}${cookpot(400, 930, 1.2)}${roomBox(1270, 640, 1.05, "kitchen")}
   ${f("mum", { x: 640, y: 950, s: 1.48, arms: "point" })}
   ${f("hana", { x: 880, y: 950, s: 1.45 })}
   ${f("amal", { x: 1100, y: 950, s: 1.52 })}`,

  `${kitchenScene()}${counterTop(1220, 950, 1)}${cakeProp(1220, 776, 0.8)}
   ${f("nora", { x: 620, y: 950, s: 1.5, mood: "surprised" })}
   ${f("amal", { x: 880, y: 950, s: 1.52, holding: heldPaper })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: letterProp(0, -10, 0.8, { open: true }) })}${bookShelf(300, 950, 0.78)}
   ${f("nora", { x: 720, y: 950, s: 1.52, holding: heldPaper })}
   ${f("amal", { x: 960, y: 950, s: 1.52 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05)}${coveredTray(1300, 846, 0.9)}
   ${f("amal", { x: 640, y: 950, s: 1.52 })}
   ${f("nora", { x: 880, y: 950, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${desk(1300, 950, 1.05)}${cakeProp(1300, 846, 0.8)}
   ${f("yasmin", { x: 1020, y: 950, s: 1.5, mood: "surprised" })}
   ${f("amal", { x: 560, y: 950, s: 1.5 })}
   ${f("nora", { x: 780, y: 950, s: 1.48 })}`,

  `${classroomScene()}${confetti(800, 480)}
   ${f("yasmin", { x: 900, y: 950, s: 1.52, arms: "up", mood: "happy" })}
   ${f("amal", { x: 620, y: 950, s: 1.52, arms: "up" })}
   ${f("sami", { x: 1160, y: 950, s: 1.48, arms: "up" })}`,

  `${classroomScene()}${bunting(800, 170, 1.15, { span: 1100 })}${desk(1300, 950, 1.05)}${cakeProp(1300, 846, 0.8)}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5 })}
   ${f("amal", { x: 540, y: 950, s: 1.52, mood: "happy" })}
   ${f("nora", { x: 760, y: 950, s: 1.5, mood: "happy" })}`,
];

// ================================================================ Unit 8

// Book 6 — The Letter from Long Ago (the next scene of The Attic Clue)
const letterLongAgoPages = [
  `${atticScene()}${oldBoxes(400, 950, 0.95)}${telescope(1140, 940, 1.05)}
   ${f("hana", { x: 700, y: 950, s: 1.5 })}
   ${f("amal", { x: 940, y: 950, s: 1.52 })}
   ${f("idris", { x: 520, y: 950, s: 1.42 })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: letterProp(0, -10, 0.85, { open: true }) })}${roomBox(400, 640, 1.1, "living")}
   ${f("amal", { x: 700, y: 950, s: 1.52 })}
   ${f("dad", { x: 940, y: 950, s: 1.48 })}`,

  `${homeScene()}${bookShelf(300, 950, 0.8)}
   ${f("hana", { x: 800, y: 950, s: 1.52, holding: heldPaper })}
   ${f("amal", { x: 1060, y: 950, s: 1.5, mood: "surprised" })}`,

  `${starrySky()}${telescope(1120, 940, 1.1)}${tallGrass(300, 950, 1.1)}`,

  `${starrySky()}${cometStreak(420, 300, 1.1)}${telescope(1160, 940, 1)}`,

  `${atticScene()}${oldBoxes(1180, 950, 0.9)}
   ${f("hana", { x: 660, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 920, y: 950, s: 1.52, holding: heldPaper })}`,

  `${atticScene()}${telescope(1080, 940, 1.15)}
   ${f("idris", { x: 640, y: 950, s: 1.42, arms: "up" })}
   ${f("amal", { x: 860, y: 950, s: 1.5 })}`,

  `${starrySky()}${telescope(1140, 940, 1.05)}
   ${f("amal", { x: 560, y: 940, s: 1.5 })}
   ${f("idris", { x: 780, y: 940, s: 1.42 })}
   ${f("hana", { x: 340, y: 940, s: 1.45 })}`,

  `${starrySky()}${telescope(1120, 940, 1.1)}${craterMoon(380, 250, 0.8)}
   ${f("amal", { x: 700, y: 940, s: 1.52, arms: "point" })}`,

  `${starrySky()}${telescope(1140, 940, 1.05)}${ringedPlanet(400, 280, 0.66)}
   ${f("idris", { x: 740, y: 940, s: 1.42, mood: "surprised" })}`,

  `${starrySky()}${telescope(1120, 940, 1.1)}${craterMoon(360, 240, 0.6)}
   ${f("hana", { x: 780, y: 940, s: 1.5 })}
   ${f("amal", { x: 520, y: 940, s: 1.48 })}`,

  `${atticScene()}${oldBoxes(1180, 950, 0.95)}${letterProp(940, 856, 1)}${letterProp(1060, 852, 0.9, { open: true })}
   ${f("amal", { x: 620, y: 950, s: 1.55, mood: "happy" })}
   ${f("idris", { x: 400, y: 950, s: 1.42, mood: "happy" })}`,
];

// Book 7 — The Invention Table (vocabulary in action: -tion and -al words)
const inventionTablePages = [
  `${hallScene()}${toolRack(1200, 950, 1.05)}${desk(400, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}
   ${f("idris", { x: 940, y: 950, s: 1.42 })}`,

  `${classroomScene()}${poster(1250, 650, 1.15, { colour: G3.sky, lines: 4 })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.52 })}
   ${f("nora", { x: 440, y: 950, s: 1.48 })}`,

  `${homeScene()}${roomBox(1270, 640, 1.05, "kitchen")}${thoughtBubble(500, 480, 1, letterProp(0, 0, 0.6))}
   ${f("amal", { x: 760, y: 950, s: 1.55 })}`,

  `${fieldScene()}${henShelter(1080, 926, 1)}${hen({ x: 1080, y: 930, s: 0.45 })}${hen({ x: 1200, y: 934, s: 0.4, flip: true })}
   ${f("idris", { x: 640, y: 926, s: 1.45, arms: "up", mood: "happy" })}`,

  `${plainRoomScene()}${bookShelf(1300, 950, 0.95)}${bookShelf(1500, 950, 0.8)}
   ${f("nora", { x: 720, y: 950, s: 1.52, holding: heldBook })}`,

  `${yardScene()}${libraryCart(1120, 926, 0.9)}${schoolBell(380, 926, 1)}
   ${f("sami", { x: 700, y: 926, s: 1.5, arms: "point" })}`,

  `${postCounterScene()}${counter(900, 950, 1)}${letterRack(700, 742, 0.85)}
   ${f("amal", { x: 400, y: 950, s: 1.52, arms: "point" })}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}${desk(360, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.52, holding: heldPaper })}
   ${f("idris", { x: 960, y: 950, s: 1.42, holding: heldPaper })}`,

  `${hallScene()}${toolRack(1200, 950, 1.05)}${easel(360, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.teal }) })}
   ${f("amal", { x: 640, y: 950, s: 1.5 })}
   ${f("nora", { x: 850, y: 950, s: 1.48 })}
   ${f("theo", { x: 1030, y: 950, s: 1.45, mood: "surprised" })}`,

  `${hallScene()}${desk(1200, 950, 1.05)}${letterRack(1200, 846, 0.8)}
   ${f("omar", { x: 900, y: 950, s: 1.5, arms: "up", mood: "happy" })}
   ${f("amal", { x: 620, y: 950, s: 1.52, mood: "happy" })}`,

  `${hallScene()}${chairRows(660, 950, 0.82, { rows: 2, seats: 4 })}
   ${f("yasmin", { x: 1200, y: 950, s: 1.5, arms: "point" })}
   ${f("idris", { x: 1420, y: 950, s: 1.42, mood: "surprised" })}`,

  `${hallScene()}${confetti(800, 470)}${henShelter(400, 926, 0.8)}${hen({ x: 400, y: 930, s: 0.4 })}
   ${f("idris", { x: 760, y: 950, s: 1.45, arms: "up", mood: "happy" })}
   ${f("amal", { x: 1000, y: 950, s: 1.52, arms: "up" })}
   ${f("yasmin", { x: 1240, y: 950, s: 1.48 })}`,
];

// ================================================================ Unit 9

// Book 6 — The Train Home (the next scene of A Trip to the Capital)
const trainHomePages = [
  `${stationScene()}${passengerTrain(1580, 672, 1.02)}
   ${f("yasmin", { x: 400, y: 950, s: 1.5 })}
   ${f("amal", { x: 660, y: 950, s: 1.52 })}
   ${f("nora", { x: 880, y: 950, s: 1.48 })}`,

  `${stationScene()}
   ${f("amal", { x: 620, y: 950, s: 1.52, mood: "happy" })}
   ${f("nora", { x: 840, y: 950, s: 1.48 })}
   ${f("leo", { x: 1060, y: 950, s: 1.48 })}`,

  `${stationScene()}${passengerTrain(1580, 672, 1.02)}
   ${f("yasmin", { x: 460, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 720, y: 950, s: 1.48 })}
   ${f("nora", { x: 900, y: 950, s: 1.46 })}
   ${f("leo", { x: 1080, y: 950, s: 1.46 })}`,

  `${capitalScene()}${passengerTrain(1220, 880, 0.78)}
   ${f("amal", { x: 420, y: 926, s: 1.5, arms: "point" })}`,

  `${basicScene()}${factory(380, 700, 0.85)}${lorry(1180, 926, 0.9)}${cityBuildings(820, 700, 0.5)}`,

  `${basicScene()}${farmField(420, 880, 0.7)}${river(1050, 830, 1.3)}${fence(1420, 930, 1, 2)}`,

  `${sunsetScene()}${passengerTrain(1540, 930, 0.86)}
   ${f("amal", { x: 560, y: 940, s: 1.5 })}`,

  `${basicScene()}${fence(1120, 930, 1.1, 3)}${goat({ x: 980, y: 880, s: 0.55 })}${passengerTrain(420, 900, 0.6)}
   ${f("amal", { x: 680, y: 926, s: 1.5, arms: "point", mood: "surprised" })}`,

  `${sunsetScene()}${passengerTrain(1500, 930, 0.9)}${lampPost(300, 940, 0.9, { lit: true })}`,

  `${nightScene()}${passengerTrain(1460, 930, 0.82)}${lampPost(340, 940, 0.95, { lit: true })}${house(700, 940, 0.6, { lit: true })}`,

  `${nightScene()}${lampPost(1200, 940, 0.95, { lit: true })}
   ${f("mum", { x: 900, y: 940, s: 1.48, arms: "up" })}
   ${f("dad", { x: 1100, y: 940, s: 1.48, arms: "up" })}
   ${f("amal", { x: 560, y: 940, s: 1.52, arms: "up", mood: "happy" })}`,

  `${townScene({ lit: true })}${lampPost(280, 706, 0.9, { lit: true })}
   ${f("amal", { x: 700, y: 926, s: 1.55, mood: "happy" })}
   ${f("mum", { x: 940, y: 926, s: 1.48 })}
   ${f("dad", { x: 1140, y: 926, s: 1.48 })}`,
];

// Book 7 — The Souvenir That Disappeared (vocabulary in action: the prefixes,
// and the thinking-it-through words)
const souvenirPages = [
  `${classroomScene()}${desk(1300, 950, 1.05)}
   ${f("nora", { x: 700, y: 950, s: 1.52, mood: "sad" })}
   ${f("amal", { x: 960, y: 950, s: 1.52 })}`,

  `${classroomScene()}
   ${f("nora", { x: 760, y: 950, s: 1.55, holding: heldKey, mood: "happy" })}
   ${f("amal", { x: 1020, y: 950, s: 1.5 })}
   ${f("sami", { x: 500, y: 950, s: 1.48 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05)}
   ${f("nora", { x: 1020, y: 950, s: 1.52, mood: "surprised", arms: "point" })}
   ${f("amal", { x: 720, y: 950, s: 1.5 })}`,

  `${classroomScene()}
   ${f("amal", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("nora", { x: 960, y: 950, s: 1.5, mood: "sad" })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("nora", { x: 960, y: 950, s: 1.5, arms: "point" })}`,

  `${plainRoomScene()}${oldBoxes(1200, 950, 0.85)}
   ${f("caretaker", { x: 900, y: 950, s: 1.5 })}
   ${f("amal", { x: 620, y: 950, s: 1.52, mood: "sad" })}`,

  `${classroomScene()}${wildBird(1280, 300, 1.1, true)}${lookLine(900, 700, 1240, 340)}
   ${f("sami", { x: 800, y: 950, s: 1.52, arms: "point" })}
   ${f("nora", { x: 540, y: 950, s: 1.48 })}`,

  `${classroomScene()}${desk(1240, 950, 1.05)}${featherProp(1240, 842, 1.2)}
   ${f("amal", { x: 800, y: 950, s: 1.52, mood: "surprised", arms: "point" })}
   ${f("nora", { x: 1040, y: 950, s: 1.5, mood: "surprised" })}`,

  `${basicScene()}${acacia(1100, 640, 1.5)}${nest(1050, 470, 1)}${wildBird(1170, 380, 1, true)}
   ${f("amal", { x: 560, y: 926, s: 1.5, arms: "point" })}
   ${f("nora", { x: 780, y: 926, s: 1.48 })}
   ${f("sami", { x: 340, y: 926, s: 1.46 })}`,

  `${basicScene()}${acacia(1100, 640, 1.5)}${nest(1050, 470, 1)}${ladderProp(960, 940, 1)}
   ${f("caretaker", { x: 700, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 460, y: 926, s: 1.48, mood: "happy" })}`,

  `${basicScene()}${acacia(1100, 640, 1.5)}${wildBird(1240, 300, 1, true)}
   ${f("caretaker", { x: 640, y: 926, s: 1.5, arms: "point" })}
   ${f("nora", { x: 900, y: 926, s: 1.5, holding: heldKey, mood: "happy" })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("nora", { x: 760, y: 950, s: 1.55, holding: heldPaper, mood: "happy" })}`,
];

// ================================================================ Unit 10

// Book 6 — The Tenth Room (after the Exhibition: the capstone's coda)
const tenthRoomPages = [
  `${hallScene()}${easel(1280, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.teal }) })}${bunting(800, 150, 1.2, { span: 1200 })}
   ${f("amal", { x: 640, y: 950, s: 1.55 })}
   ${f("yasmin", { x: 900, y: 950, s: 1.5 })}
   ${f("maya", { x: 420, y: 950, s: 1.5 })}`,

  `${hallScene()}${chairRows(800, 950, 0.9, { rows: 3, seats: 5 })}
   ${f("amal", { x: 1320, y: 950, s: 1.52 })}
   ${f("maya", { x: 1500, y: 950, s: 1.45 })}`,

  `${hallScene()}${easel(1280, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.gold }) })}
   ${f("amal", { x: 700, y: 950, s: 1.52, holding: heldPaper })}
   ${f("nora", { x: 960, y: 950, s: 1.5, holding: heldPaper })}`,

  `${hallScene()}
   ${f("maya", { x: 720, y: 950, s: 1.52, holding: heldNotebook, mood: "sad" })}
   ${f("amal", { x: 980, y: 950, s: 1.52 })}`,

  `${hallScene()}
   ${f("yasmin", { x: 800, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 540, y: 950, s: 1.5, mood: "surprised" })}
   ${f("maya", { x: 1080, y: 950, s: 1.48, mood: "surprised" })}`,

  `${townScene()}${lampPost(280, 706, 0.9)}
   ${f("yasmin", { x: 560, y: 926, s: 1.5, arms: "point" })}
   ${f("amal", { x: 820, y: 926, s: 1.52 })}
   ${f("maya", { x: 1040, y: 926, s: 1.48 })}
   ${f("nora", { x: 1240, y: 926, s: 1.48 })}`,

  `${townScene()}${cityBuildings(1300, 700, 0.72)}
   ${f("yasmin", { x: 760, y: 926, s: 1.52, arms: "up" })}
   ${f("amal", { x: 500, y: 926, s: 1.5 })}
   ${f("nora", { x: 1020, y: 926, s: 1.48 })}`,

  `${postCounterScene()}${counter(900, 950, 1)}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "up", mood: "happy" })}
   ${f("amal", { x: 480, y: 950, s: 1.52 })}
   ${f("maya", { x: 700, y: 950, s: 1.48 })}`,

  `${marketScene()}${poster(700, 620, 0.95, { colour: G3.leafy, lines: 3 })}
   ${f("amal", { x: 500, y: 926, s: 1.52, arms: "point" })}
   ${f("nora", { x: 940, y: 926, s: 1.48, arms: "point" })}`,

  `${townScene()}${lampPost(1300, 706, 0.9)}
   ${f("yasmin", { x: 900, y: 926, s: 1.52 })}
   ${f("amal", { x: 620, y: 926, s: 1.52, mood: "happy" })}
   ${f("maya", { x: 1140, y: 926, s: 1.48, mood: "happy" })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: openBook(0, -14, 0.5) })}${bookShelf(300, 950, 0.8)}
   ${f("amal", { x: 760, y: 950, s: 1.58, holding: heldNotebook })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldNotebook })}${roomBox(400, 640, 1.05, "living")}
   ${f("amal", { x: 780, y: 950, s: 1.6, arms: "up", mood: "happy" })}`,
];

// Book 7 — Amal the Author (vocabulary in action: telling and talking)
const amalAuthorPages = [
  `${plainRoomScene()}${bookShelf(1320, 950, 0.95)}${bookShelf(1520, 950, 0.8)}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldBook })}
   ${f("mina", { x: 980, y: 950, s: 1.32 })}
   ${f("adam", { x: 1140, y: 950, s: 1.32 })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 760, y: 950, s: 1.58, holding: heldPaper })}`,

  `${townScene()}${lampPost(280, 706, 0.9)}
   ${f("maya", { x: 640, y: 926, s: 1.52, holding: heldNotebook, arms: "point" })}
   ${f("amal", { x: 900, y: 926, s: 1.52 })}`,

  `${homeScene()}${cat(1120, 950, 1.4)}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 700, y: 950, s: 1.55, arms: "point", mood: "happy" })}`,

  `${marketScene()}${cat(760, 930, 1.3)}${dustPuffs(1050, 880)}
   ${f("amal", { x: 480, y: 926, s: 1.52, holding: heldNotebook })}`,

  `${marketScene()}${dustPuffs(760, 860)}${letterProp(880, 520, 0.9)}${cat(500, 930, 1.25)}
   ${f("omar", { x: 1120, y: 926, s: 1.48, mood: "surprised", arms: "up" })}`,

  `${plainRoomScene()}${bookShelf(1320, 950, 0.95)}
   ${f("amal", { x: 640, y: 950, s: 1.55, holding: heldBook })}
   ${f("mina", { x: 920, y: 950, s: 1.32 })}
   ${f("adam", { x: 1080, y: 950, s: 1.32 })}
   ${f("idris", { x: 1240, y: 950, s: 1.36 })}`,

  `${plainRoomScene()}${bookShelf(1320, 950, 0.95)}
   ${f("mina", { x: 800, y: 950, s: 1.32, arms: "up", mood: "surprised" })}
   ${f("adam", { x: 960, y: 950, s: 1.32, arms: "up", mood: "happy" })}
   ${f("amal", { x: 560, y: 950, s: 1.55, holding: heldBook })}`,

  `${marketScene()}${cat(880, 930, 1.35, { flip: true })}${letterProp(1020, 700, 0.85)}${motionArcs(760, 880, 1)}`,

  `${marketScene()}${cat(760, 930, 1.3)}
   ${f("omar", { x: 1120, y: 926, s: 1.48, mood: "happy" })}
   ${f("salma", { x: 500, y: 926, s: 1.44, mood: "happy" })}
   ${f("amal", { x: 300, y: 926, s: 1.48, holding: heldBook })}`,

  `${townScene()}${libraryBuilding(1200, 900, 0.72)}
   ${f("amal", { x: 560, y: 926, s: 1.55, holding: heldBook })}
   ${f("mina", { x: 820, y: 926, s: 1.32 })}
   ${f("adam", { x: 970, y: 926, s: 1.32, arms: "up" })}`,

  `${plainRoomScene()}${desk(1260, 950, 1.1, { item: openBook(0, -14, 0.5) })}${confetti(800, 480)}
   ${f("amal", { x: 740, y: 950, s: 1.6, arms: "up", mood: "happy" })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  // Unit 6
  "bridge-opened": { dir: "the-day-the-bridge-opened", pages: bridgeOpenedPages },
  "exact-word": { dir: "the-exact-word", pages: exactWordPages },
  // Unit 7
  // "samis-second-show", not "the-second-show": Grade 3 Unit 1's continuation
  // book took that id the same day (the two were authored in parallel lanes and
  // collided on the folder), and the Grade 4 story is Sami's anyway.
  "second-show": { dir: "samis-second-show", pages: secondShowPages },
  "thank-you-surprise": { dir: "the-thank-you-surprise", pages: thankYouPages },
  // Unit 8
  "letter-long-ago": { dir: "the-letter-from-long-ago", pages: letterLongAgoPages },
  "invention-table": { dir: "the-invention-table", pages: inventionTablePages },
  // Unit 9
  "train-home": { dir: "the-train-home", pages: trainHomePages },
  "souvenir": { dir: "the-souvenir-that-disappeared", pages: souvenirPages },
  // Unit 10
  "tenth-room": { dir: "the-tenth-room", pages: tenthRoomPages },
  "amal-author": { dir: "amal-the-author", pages: amalAuthorPages },
};

writeBooks(books, process.argv[2]);
