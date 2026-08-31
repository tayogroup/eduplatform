#!/usr/bin/env node

// Generates the vector illustrations for Grade 1's SIXTH and SEVENTH books —
// ten books, two for each of units 1 to 5. (Units 6 to 10 are a separate run.)
//
// Grade 1 grew to five books per unit in 2026-08 (fable, the Amal day, the
// rhyme acted out, the shared-reading frame filled in, a second fable). The
// owner is growing every unit's shelf to seven, and the two added books do two
// jobs the shelf did not do yet:
//
//   book 6  a CONTINUATION — the next scene of the unit's own fable or of its
//           Amal-day story, same cast, same device
//   book 7  a VOCABULARY-IN-ACTION story — a real narrative (not a frame-fill)
//           that walks one of the unit's vocabulary groups through a setting
//           the unit's other books have not used
//
// Nothing here is invented where the unit says something. The continuations
// pick up exactly where the shipped books stop: Kiki's second day follows
// "Kiki Goes to School", "After Breakfast" follows "Breakfast at Grandma's
// House", Kiki learns to jump on the play day of "Kiki and the Big Game",
// the scarecrow of "Duku Makes a Scarecrow" loses his hat to the wind, and
// little Pip of "The Little Lost Chick" meets the duck at the pond. The cast
// is the shipped cast only — figureA's people and the kit's animals — and the
// three new props (a school bag, the scarecrow's straw hat off his head, the
// dressing-up box) are LOCAL consts with no data-tap, because a tap value
// promises a clip that nobody has paid for.
//
// Usage: node tools/create-grade1-seven-shelf-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  writeBooks,
  // scenes
  basicScene, townScene, gardenScene, plainRoomScene, villageScene,
  amalClassroom, homeWall,
  // savanna cast and scenery
  zebra, giraffe, elephant, ostrich, kiki, donkey, hen, goat, chick, wildBird,
  acacia, tallGrass, lake, bench, chalkboard, schoolBell, mango, bigFlower,
  barn, fence, haystack, seedRow, carrot, dustPuffs, confetti, rainbow, splashArcs,
  marketStall,
  // people and their things
  figureA, babyIdris,
  schoolTable, schoolChair, pencilProp, crayonProp, schoolFront,
  closedBook, bedProp, foodBowl, cupOfMilk, fruitProp, basketOf, grassMat,
  cow, eggProp, seedBowl, scarecrow, cookpot,
  villageWell,
  // the Grade 1 shelf additions
  lunchboxProp, doorProp, rabbitProp, duckProp, frogProp, puppyProp,
  crownProp, clownHatProp, capeProp, maskProp, paperChain, vegProp,
  rulerProp, motionArcs, songNotes,
  A1,
} = require("./lib/ehel-ebook-kit-grade1-shelf.js");

// A page is a scene plus the things standing in it, in back-to-front order.
const page = (...parts) => parts.join("");

// The ground line each scene puts under a standing figure — the same four
// constants the five-book generator names, because these books stand in the
// same rooms.
const CLASS_FLOOR = 930;
const HOME_FLOOR = 940;
const OUT_FLOOR = 900;
const VILLAGE_FLOOR = 930;

// The ink the whole chain draws its outlines with (A1.black is the kit's ink).
const INK = A1.black;

// ---------------------------------------------------------------- local props
//
// Three drawings no kit has, local on purpose: no data-tap (a tap promises a
// clip), no anim-* class anywhere near a transform attribute — each is a
// static group, so the trap cannot arise.

// Amal's school bag. Kiki's red bag lives inside the Musa drawings and is not
// a prop; Unit 1's own vocabulary says "bag", so book seven needs one it can
// pack.
function schoolBag(x, y, s = 1, { colour = A1.red, open = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -86 -120 q 0 -44 86 -44 q 86 0 86 44" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M -100 -110 h 200 q 16 0 16 16 v 100 q 0 16 -16 16 h -200 q -16 0 -16 -16 v -100 q 0 -16 16 -16 z" fill="${colour}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    ${open
      ? `<path d="M -100 -110 h 200" stroke="${INK}" stroke-width="5" opacity="0.5"/>`
      : `<path d="M -100 -110 h 200 q 16 0 16 16 v 26 h -232 v -26 q 0 -16 16 -16 z" fill="${colour}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`}
    <rect x="-26" y="-84" width="52" height="34" rx="8" fill="#f6f0e8" stroke="${INK}" stroke-width="5"/>
    <circle cx="0" cy="-67" r="8" fill="${A1.yellow}" stroke="${INK}" stroke-width="4"/>
  </g>`;
}

// The scarecrow's straw hat, off his head — the same brown as scarecrow()
// draws it, standing alone so the wind can take it.
function strawHat(x, y, s = 1, { rotate = 0 } = {}) {
  return `<g transform="translate(${x} ${y})"><g transform="rotate(${rotate}) scale(${s})">
    <ellipse cx="0" cy="10" rx="64" ry="16" fill="#a3542f" stroke="${INK}" stroke-width="5"/>
    <path d="M -36 6 q 0 -44 36 -44 q 36 0 36 44 z" fill="#a3542f" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -36 -6 h 72" stroke="#7d3f22" stroke-width="6"/>
  </g></g>`;
}

// The dressing-up box at Ayeeyo's house — a plain wooden chest with the lid
// thrown back, drawn at its standing point like every other floor prop.
function toyBox(x, y, s = 1, { open = true } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${open ? `<path d="M -104 -96 l 14 -60 h 180 l 14 60 z" fill="#8a6242" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -90 -126 h 180" stroke="${INK}" stroke-width="4" opacity="0.4"/>` : ""}
    <path d="M -104 -96 h 208 q 14 0 14 14 v 68 q 0 14 -14 14 h -208 q -14 0 -14 -14 v -68 q 0 -14 14 -14 z" fill="#a5764f" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -104 -64 h 222 M -104 -32 h 222" stroke="${INK}" stroke-width="4" opacity="0.35"/>
    <rect x="-18" y="-84" width="36" height="24" rx="6" fill="${A1.metal}" stroke="${INK}" stroke-width="4"/>
  </g>`;
}

// ================================================================ UNIT 1
// Welcome to School — the continuation of Kiki Goes to School, and the
// classroom objects packed one by one into a school bag at home.

// ---------------------------------------------------------------- 1.6 Kiki's Second Day of School

const kikisSecondDayOfSchool = [
  page(basicScene(), acacia(1180, 600, 1.35), chalkboard(1160, 840, 0.95), schoolBell(360, 850, 0.95),
    giraffe({ x: 640, y: 630, s: 0.9, glasses: true }),
    kiki({ x: 470, y: 800, s: 1.25, arms: "up", mood: "happy" }),
    goat({ x: 900, y: 772, s: 0.85 }),
    elephant({ x: 1440, y: 765, s: 0.6 })),

  page(basicScene(), acacia(1340, 620, 1.1), tallGrass(300, 920, 1.2),
    kiki({ x: 780, y: 800, s: 1.25, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(280, 630, 1),
    zebra({ x: 900, y: 690, s: 1.1, mood: "happy" }),
    kiki({ x: 500, y: 800, s: 1.2, mood: "happy" })),

  page(basicScene(), acacia(1240, 610, 1.25), chalkboard(1220, 845, 0.9), schoolBell(380, 855, 0.9),
    goat({ x: 880, y: 772, s: 0.9, mood: "surprised" }),
    kiki({ x: 540, y: 800, s: 1.2, mood: "happy" })),

  page(basicScene(), acacia(1380, 620, 1),
    goat({ x: 880, y: 770, s: 1, mood: "sad" }),
    giraffe({ x: 340, y: 630, s: 0.88, glasses: true }),
    kiki({ x: 1240, y: 810, s: 1.05 })),

  page(basicScene(), acacia(260, 640, 1),
    kiki({ x: 700, y: 800, s: 1.25, mood: "happy", arms: "up" }),
    goat({ x: 1060, y: 772, s: 0.9 })),

  page(basicScene(), acacia(1400, 630, 1), bench(880, 900, 1.3),
    kiki({ x: 620, y: 800, s: 1.2, mood: "happy" }),
    goat({ x: 1160, y: 772, s: 0.9, flip: true, mood: "happy" })),

  page(basicScene(), acacia(1240, 610, 1.2), songNotes(1000, 320, 0.95),
    giraffe({ x: 480, y: 628, s: 0.95, glasses: true }),
    kiki({ x: 860, y: 800, s: 1.15, mood: "happy", arms: "up" }),
    goat({ x: 1160, y: 772, s: 0.85, mood: "happy" }),
    elephant({ x: 1440, y: 768, s: 0.6 })),

  page(basicScene(), chalkboard(420, 800, 1.25),
    kiki({ x: 800, y: 800, s: 1.2, mood: "happy", arms: "up" }),
    goat({ x: 1120, y: 772, s: 0.9, mood: "happy" }),
    elephant({ x: 1400, y: 765, s: 0.65, trunkUp: true })),

  page(basicScene(), acacia(280, 630, 1.05),
    mango(880, 850, 1.3), mango(950, 870, 1.1),
    kiki({ x: 580, y: 800, s: 1.2, mood: "happy" }),
    goat({ x: 1180, y: 772, s: 0.9, flip: true, mood: "happy" }),
    ostrich({ x: 1420, y: 735, s: 0.6 })),

  page(basicScene(), acacia(1360, 620, 1.05), schoolBell(1000, 880, 1.5),
    kiki({ x: 560, y: 800, s: 1.2, mood: "happy", arms: "up" }),
    goat({ x: 1220, y: 772, s: 0.85, mood: "happy" })),

  page(basicScene(), acacia(1200, 600, 1.4), confetti(820, 340, 1),
    giraffe({ x: 320, y: 630, s: 0.85, glasses: true }),
    kiki({ x: 700, y: 800, s: 1.25, mood: "happy", arms: "up" }),
    goat({ x: 1010, y: 772, s: 0.9, mood: "happy" }),
    elephant({ x: 1300, y: 765, s: 0.62, trunkUp: true }),
    ostrich({ x: 1480, y: 738, s: 0.55 })),
];

// ---------------------------------------------------------------- 1.7 Amal Packs Her Bag

const amalPacksHerBag = [
  page(homeWall(), bedProp(1220, 900, 0.9),
    schoolBag(880, HOME_FLOOR, 0.9, { open: true }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(homeWall(), bedProp(1180, 900, 0.95),
    figureA("mum", { x: 520, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("amal", { x: 840, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(homeWall(),
    schoolBag(1100, HOME_FLOOR, 1, { open: true }),
    figureA("amal", { x: 600, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(homeWall(),
    schoolTable(1180, HOME_FLOOR, 1.3, { item: closedBook(0, -46, 0.5, { colour: A1.blue }) }),
    schoolBag(760, HOME_FLOOR, 0.85, { open: true }),
    figureA("amal", { x: 440, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(),
    schoolTable(1180, HOME_FLOOR, 1.3, { item: pencilProp(0, -40, 0.4, { colour: A1.yellow }) }),
    schoolBag(760, HOME_FLOOR, 0.85, { open: true }),
    figureA("amal", { x: 440, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(),
    schoolTable(1180, HOME_FLOOR, 1.3, { item: crayonProp(0, -30, 0.44, { colour: A1.green }) }),
    schoolBag(760, HOME_FLOOR, 0.85, { open: true }),
    figureA("amal", { x: 440, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(),
    lunchboxProp(1160, 880, 0.9, { colour: A1.yellow }),
    schoolBag(760, HOME_FLOOR, 0.85, { open: true }),
    figureA("amal", { x: 440, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(),
    schoolBag(1080, HOME_FLOOR, 0.9, { open: true }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.52, mood: "surprised" })),

  page(homeWall(), bedProp(1140, 900, 1),
    rulerProp(1130, 960, 0.55, { rotate: -6 }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(homeWall(),
    schoolBag(1080, HOME_FLOOR, 1),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("mum", { x: 340, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(townScene(), schoolFront(1140, 760, 0.9),
    figureA("mum", { x: 520, y: OUT_FLOOR, s: 1.55, mood: "happy" }),
    figureA("amal", { x: 780, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(townScene(), schoolFront(1100, 760, 0.95), schoolBell(400, 860, 0.9), confetti(760, 320, 0.9),
    figureA("amal", { x: 660, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" })),
];

// ================================================================ UNIT 2
// Family Time — after the breakfast at Grandma's, and the fruit that breakfast
// came from, bought at Omar's market stall.

// ---------------------------------------------------------------- 2.6 After Breakfast

const afterBreakfast = [
  page(homeWall(),
    foodBowl(680, 780, 0.55), cupOfMilk(860, 800, 0.46),
    figureA("hana", { x: 380, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("grandpa", { x: 1060, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 1310, y: HOME_FLOOR, s: 1.44, mood: "happy" })),

  page(homeWall(),
    foodBowl(880, 790, 0.6), foodBowl(1080, 810, 0.55), cupOfMilk(1270, 820, 0.46),
    figureA("hana", { x: 480, y: HOME_FLOOR, s: 1.54, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 680, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("hana", { x: 1000, y: HOME_FLOOR, s: 1.54, mood: "happy" })),

  page(homeWall(),
    foodBowl(1080, 800, 0.58), foodBowl(1280, 820, 0.52),
    figureA("amal", { x: 640, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    cupOfMilk(1120, 810, 0.5), cupOfMilk(1280, 825, 0.46),
    figureA("adam", { x: 660, y: HOME_FLOOR, s: 1.44, mood: "happy" }),
    figureA("hana", { x: 380, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(homeWall(),
    grassMat(1060, 900, 0.85, { neat: true, laid: true }),
    babyIdris(1060, 920, 1.2),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    figureA("grandpa", { x: 900, y: HOME_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.46, mood: "happy" }),
    figureA("adam", { x: 1220, y: HOME_FLOOR, s: 1.42, mood: "happy" })),

  page(homeWall(),
    figureA("grandpa", { x: 480, y: HOME_FLOOR, s: 1.54, mood: "happy" }),
    figureA("amal", { x: 780, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1020, y: HOME_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureA("hana", { x: 1280, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    foodBowl(760, 800, 0.5), foodBowl(920, 810, 0.5), foodBowl(1080, 800, 0.5),
    foodBowl(1240, 815, 0.5), foodBowl(1400, 805, 0.5),
    figureA("amal", { x: 480, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(),
    figureA("amal", { x: 720, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hana", { x: 1000, y: HOME_FLOOR, s: 1.54, mood: "happy" })),

  page(homeWall(),
    figureA("hana", { x: 500, y: HOME_FLOOR, s: 1.54, mood: "happy", arms: "up" }),
    figureA("amal", { x: 820, y: HOME_FLOOR, s: 1.46, mood: "happy" }),
    figureA("adam", { x: 1050, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    babyIdris(1300, HOME_FLOOR, 1.12)),

  page(villageScene({ treeX: 1340, treeScale: 1.4 }), confetti(760, 320, 0.9),
    figureA("mum", { x: 420, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("dad", { x: 660, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 900, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1130, y: VILLAGE_FLOOR, s: 1.42, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 2.7 Fruit for Breakfast

const fruitForBreakfast = [
  page(basicScene(), marketStall(1080, 880, 1.2),
    fruitProp(1000, 800, 0.4, "banana"), mango(1180, 800, 1.2),
    figureA("omar", { x: 1320, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("mum", { x: 420, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 680, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(basicScene(), marketStall(1120, 880, 1.15), acacia(260, 630, 1),
    figureA("mum", { x: 540, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 800, y: VILLAGE_FLOOR, s: 1.45, mood: "happy" })),

  page(basicScene(), marketStall(1100, 880, 1.2),
    figureA("omar", { x: 1340, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(basicScene(), marketStall(1100, 880, 1.2),
    figureA("omar", { x: 1340, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("mum", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("amal", { x: 820, y: VILLAGE_FLOOR, s: 1.44, mood: "happy" })),

  page(basicScene(), marketStall(1140, 880, 1.1),
    mango(880, 840, 1.7),
    figureA("amal", { x: 540, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), marketStall(1140, 880, 1.1),
    fruitProp(840, 850, 0.5, "banana"), fruitProp(1010, 860, 0.46, "banana"),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), marketStall(1140, 880, 1.1),
    fruitProp(920, 830, 0.55, "grapes"),
    figureA("amal", { x: 540, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), marketStall(1140, 880, 1.1),
    fruitProp(820, 850, 0.34, "strawberry"), fruitProp(930, 862, 0.32, "strawberry"),
    fruitProp(1030, 850, 0.34, "strawberry"), fruitProp(1130, 862, 0.32, "strawberry"),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), marketStall(1240, 880, 1),
    basketOf(880, 890, 0.72, { inner: `${fruitProp(-60, -6, 0.28, "banana")}${fruitProp(60, -4, 0.3, "strawberry")}` }),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), marketStall(1100, 880, 1.2),
    figureA("omar", { x: 1340, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("mum", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 820, y: VILLAGE_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.5 }),
    basketOf(1100, 890, 0.66, { inner: fruitProp(0, -4, 0.3, "banana") }),
    figureA("mum", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 820, y: VILLAGE_FLOOR, s: 1.45, mood: "happy" })),

  page(homeWall(), confetti(860, 310, 0.9),
    foodBowl(1120, 800, 0.55), fruitProp(1300, 810, 0.4, "banana"),
    figureA("hana", { x: 360, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("adam", { x: 860, y: HOME_FLOOR, s: 1.42, mood: "happy" })),
];

// ================================================================ UNIT 3
// Fun and Games — Kiki learns to jump on the play day, and the puppy of the
// unit's animal words hides on, in, under and behind things.

// ---------------------------------------------------------------- 3.6 Kiki Learns to Jump

const kikiLearnsToJump = [
  page(basicScene(), acacia(1240, 610, 1.3), motionArcs(1040, 660, 0.9),
    frogProp(1180, 900, 1),
    rabbitProp(360, 895, 0.9),
    kiki({ x: 700, y: 800, s: 1.25, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1360, 620, 1.05), chalkboard(1320, 845, 0.85),
    kiki({ x: 560, y: 800, s: 1.2, mood: "happy" }),
    ostrich({ x: 940, y: 730, s: 0.72 }),
    elephant({ x: 1200, y: 768, s: 0.62 })),

  page(basicScene(), acacia(280, 630, 1), motionArcs(1180, 700, 0.9),
    frogProp(1120, 900, 1),
    kiki({ x: 620, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(1400, 630, 1), dustPuffs(1000, 900),
    rabbitProp(1130, 895, 0.95),
    kiki({ x: 560, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(1340, 620, 1.05),
    kiki({ x: 780, y: 800, s: 1.25, mood: "happy", arms: "up" }),
    frogProp(1160, 900, 0.95)),

  page(basicScene(), acacia(260, 640, 1), tallGrass(1120, 930, 1.5), dustPuffs(900, 900),
    kiki({ x: 880, y: 810, s: 1.15, mood: "sad" }),
    frogProp(1280, 900, 0.9)),

  page(basicScene(), acacia(1380, 620, 1),
    frogProp(940, 900, 1),
    kiki({ x: 560, y: 800, s: 1.2, mood: "happy" })),

  page(basicScene(), acacia(280, 630, 1.05),
    frogProp(1000, 900, 0.95), rabbitProp(1220, 895, 0.85),
    kiki({ x: 600, y: 800, s: 1.2, mood: "happy" })),

  page(basicScene(), acacia(1300, 620, 1.1), motionArcs(940, 620, 1), dustPuffs(760, 900),
    kiki({ x: 760, y: 700, s: 1.2, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 340, 1),
    kiki({ x: 620, y: 800, s: 1.22, mood: "happy", arms: "up" }),
    frogProp(940, 900, 0.95), rabbitProp(1120, 895, 0.85),
    ostrich({ x: 1340, y: 735, s: 0.6 }),
    elephant({ x: 1500, y: 770, s: 0.58 })),

  page(basicScene(), acacia(280, 630, 1), motionArcs(1060, 660, 0.9), dustPuffs(880, 900),
    zebra({ x: 900, y: 690, s: 1.08, mood: "happy" }),
    kiki({ x: 520, y: 800, s: 1.2, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1220, 600, 1.3), confetti(840, 330, 1.1), rainbow(820, 540),
    kiki({ x: 640, y: 800, s: 1.22, mood: "happy", arms: "up" }),
    zebra({ x: 980, y: 690, s: 1, mood: "happy" }),
    frogProp(1300, 900, 0.9), rabbitProp(420, 895, 0.85)),
];

// ---------------------------------------------------------------- 3.7 The Puppy Hides

const thePuppyHides = [
  page(gardenScene(),
    puppyProp(1120, 895, 1),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("adam", { x: 840, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(),
    puppyProp(1060, 895, 1.05),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(gardenScene(),
    figureA("amal", { x: 660, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("adam", { x: 960, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    puppyProp(1280, 895, 0.95)),

  page(gardenScene(), dustPuffs(1000, 900), motionArcs(1200, 700, 0.9),
    puppyProp(1360, 895, 0.95, { flip: true }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "surprised" }),
    figureA("adam", { x: 820, y: OUT_FLOOR, s: 1.46, mood: "surprised" })),

  page(homeWall(), bedProp(1140, 900, 1),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(homeWall(),
    basketOf(1100, 890, 0.9),
    figureA("adam", { x: 560, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(homeWall(),
    grassMat(1100, 900, 0.9, { neat: true, laid: true }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(homeWall(), doorProp(1150, HOME_FLOOR, 0.85),
    figureA("adam", { x: 560, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(homeWall(),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.52, mood: "surprised" }),
    figureA("adam", { x: 980, y: HOME_FLOOR, s: 1.46, mood: "surprised" })),

  page(basicScene(), acacia(1120, 600, 1.45),
    puppyProp(1130, 895, 1),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("adam", { x: 780, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "point" })),

  page(basicScene(), acacia(1400, 630, 1),
    puppyProp(1000, 895, 1.05),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 820, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(basicScene(), acacia(260, 630, 1.05), confetti(880, 330, 1), motionArcs(1160, 700, 0.9),
    puppyProp(1080, 895, 1.05),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 820, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),
];

// ================================================================ UNIT 4
// Making Things — the scarecrow the unit made loses his hat, and the
// dressing-up box at Ayeeyo's plays out the costume words.

// ---------------------------------------------------------------- 4.6 A Hat for the Scarecrow

const aHatForTheScarecrow = [
  page(basicScene(), barn(1300, 705, 1), scarecrow(1050, 840, 1), seedRow(560, 895, 0.9),
    donkey({ x: 480, y: 702, s: 1.05 }),
    hen({ x: 800, y: 838, s: 0.85 })),

  page(basicScene(), scarecrow(800, 840, 1.15), seedRow(1200, 905, 1),
    wildBird(1360, 480, 1, true),
    hen({ x: 420, y: 838, s: 0.85 })),

  page(basicScene(), scarecrow(800, 845, 1.1), motionArcs(1100, 620, 1), tallGrass(300, 920, 1.3),
    donkey({ x: 1240, y: 702, s: 0.95, mood: "surprised" })),

  page(basicScene(), scarecrow(700, 850, 1.05, { hat: false }),
    strawHat(1080, 420, 1.1, { rotate: -24 }), motionArcs(1220, 500, 0.9),
    donkey({ x: 1200, y: 705, s: 0.9, mood: "surprised" })),

  page(basicScene(), scarecrow(1100, 845, 1, { hat: false }),
    donkey({ x: 560, y: 700, s: 1.15, mood: "surprised" }),
    hen({ x: 900, y: 838, s: 0.85, mood: "surprised" })),

  page(basicScene(), acacia(1400, 630, 1), dustPuffs(880, 900),
    strawHat(1180, 620, 1, { rotate: 16 }),
    donkey({ x: 660, y: 700, s: 1.15, mood: "surprised" })),

  page(basicScene(), tallGrass(1120, 930, 1.5), tallGrass(1300, 900, 1.2),
    goat({ x: 880, y: 770, s: 1, mood: "sad" }),
    donkey({ x: 420, y: 705, s: 0.95 })),

  page(basicScene(), fence(1100, 880, 0.95, 3),
    strawHat(1000, 940, 1.05, { rotate: 8 }),
    hen({ x: 700, y: 822, s: 1.15, mood: "happy" }),
    donkey({ x: 380, y: 705, s: 0.9 })),

  page(basicScene(), barn(1320, 710, 1), seedRow(1060, 905, 0.9),
    strawHat(880, 935, 1),
    donkey({ x: 560, y: 700, s: 1.1, mood: "happy" }),
    hen({ x: 900, y: 838, s: 0.85, mood: "happy" }),
    goat({ x: 1180, y: 772, s: 0.85, flip: true, mood: "happy" })),

  page(basicScene(), scarecrow(900, 840, 1.15), seedRow(400, 900, 0.85),
    donkey({ x: 1280, y: 702, s: 1, mood: "happy" }),
    hen({ x: 560, y: 838, s: 0.85, mood: "happy" })),

  page(basicScene(), scarecrow(900, 840, 1.15), confetti(880, 330, 1),
    donkey({ x: 480, y: 702, s: 1.05, mood: "happy" }),
    hen({ x: 1220, y: 838, s: 0.85, mood: "happy" }),
    goat({ x: 1400, y: 772, s: 0.8, flip: true, mood: "happy" })),

  page(basicScene(), scarecrow(1050, 840, 1), seedRow(560, 895, 0.95), rainbow(820, 560),
    wildBird(1380, 460, 0.95, true),
    donkey({ x: 460, y: 702, s: 1.05, mood: "happy" }),
    hen({ x: 780, y: 838, s: 0.85, mood: "happy" })),
];

// ---------------------------------------------------------------- 4.7 The Dressing-Up Box

const theDressingUpBox = [
  page(homeWall(), paperChain(1200, 150, 0.8),
    toyBox(1120, 900, 1, { open: true }), crownProp(1120, 830, 0.6),
    figureA("amal", { x: 500, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 780, y: HOME_FLOOR, s: 1.46, mood: "happy" })),

  page(homeWall(),
    toyBox(1100, 900, 1.05, { open: false }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "surprised", arms: "point" }),
    figureA("hana", { x: 320, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    toyBox(1080, 900, 1.05, { open: true }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "surprised" }),
    figureA("adam", { x: 820, y: HOME_FLOOR, s: 1.46, mood: "surprised" })),

  page(homeWall(),
    crownProp(1140, 800, 0.95),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(homeWall(),
    clownHatProp(1140, 810, 0.9, { colour: A1.purple }),
    figureA("adam", { x: 620, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(homeWall(),
    capeProp(1140, 720, 0.95, { colour: A1.red }),
    figureA("hodan", { x: 620, y: HOME_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(homeWall(),
    maskProp(1140, 720, 1.05, { colour: A1.green }),
    figureA("adam", { x: 560, y: HOME_FLOOR, s: 1.46, mood: "surprised" }),
    figureA("hodan", { x: 820, y: HOME_FLOOR, s: 1.4, mood: "surprised" })),

  page(homeWall(),
    maskProp(1180, 730, 0.9, { colour: A1.green }),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 980, y: HOME_FLOOR, s: 1.46, mood: "happy" })),

  page(homeWall(), paperChain(1200, 150, 0.85),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 820, y: HOME_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 1060, y: HOME_FLOOR, s: 1.4, mood: "happy", arms: "up" })),

  page(homeWall(),
    figureA("hana", { x: 1020, y: HOME_FLOOR, s: 1.54, mood: "happy", arms: "up" }),
    figureA("amal", { x: 640, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    babyIdris(1080, HOME_FLOOR, 1.3),
    figureA("adam", { x: 620, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 860, y: HOME_FLOOR, s: 1.4, mood: "happy" })),

  page(homeWall(), paperChain(1200, 150, 0.8), confetti(860, 310, 0.95),
    figureA("hana", { x: 340, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 880, y: HOME_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 1120, y: HOME_FLOOR, s: 1.4, mood: "happy", arms: "up" }),
    babyIdris(1350, HOME_FLOOR, 1.1)),
];

// ================================================================ UNIT 5
// On the Farm — little Pip meets the duck at the pond, and the unit's
// vegetables go from the garden into Ayeeyo's soup pot.

// ---------------------------------------------------------------- 5.6 The Chick and the Duck

const theChickAndTheDuck = [
  page(basicScene(), barn(1300, 705, 1), lake(1000, 880, 320, 66),
    duckProp(940, 850, 1.1),
    hen({ x: 480, y: 822, s: 1.15 }),
    chick(700, 890, 1.05)),

  page(basicScene(), barn(1280, 700, 1.1), fence(360, 880, 1, 3),
    hen({ x: 640, y: 814, s: 1.2 }),
    chick(880, 890, 1.05)),

  page(basicScene(), lake(1120, 880, 320, 66), barn(1420, 715, 0.85),
    duckProp(1060, 850, 1.15),
    chick(760, 885, 1.1, "surprised")),

  page(basicScene(), lake(1100, 880, 340, 70),
    duckProp(1080, 845, 1.1),
    splashArcs(920, 850, "#9ec4d8"),
    chick(700, 885, 1.1, "surprised")),

  page(basicScene(), lake(1100, 880, 340, 70), tallGrass(300, 920, 1.3),
    duckProp(1040, 850, 1.15),
    chick(720, 885, 1.1)),

  page(basicScene(), lake(1140, 880, 320, 66),
    duckProp(1080, 850, 1.1),
    chick(780, 880, 1.2, "surprised")),

  page(basicScene(), lake(1160, 880, 300, 62), motionArcs(660, 700, 0.8),
    duckProp(1100, 850, 1.05),
    chick(620, 880, 1.15, "happy"),
    dustPuffs(500, 900)),

  page(basicScene(), lake(1100, 880, 340, 70), dustPuffs(560, 900),
    duckProp(1180, 848, 1.05),
    splashArcs(1000, 852, "#9ec4d8"),
    chick(640, 885, 1.1, "happy")),

  page(basicScene(), lake(1140, 880, 320, 66), acacia(280, 630, 1),
    duckProp(1080, 850, 1.1),
    chick(760, 885, 1.1, "happy"),
    bigFlower(480, 890, 1)),

  page(basicScene(), barn(1360, 712, 0.9),
    hen({ x: 560, y: 822, s: 1.15, mood: "happy" }),
    chick(880, 885, 1.1, "happy"),
    duckProp(1160, 895, 0.85)),

  page(basicScene(), lake(1200, 890, 280, 56),
    duckProp(1160, 860, 1),
    chick(820, 885, 1.15, "happy"),
    hen({ x: 480, y: 829, s: 1.1, mood: "happy" })),

  page(basicScene(), barn(1300, 705, 1), confetti(820, 330, 0.95),
    hen({ x: 620, y: 814, s: 1.2, mood: "happy" }),
    chick(900, 885, 1.15, "happy"),
    chick(1060, 895, 0.95), chick(1140, 900, 0.9)),
];

// ---------------------------------------------------------------- 5.7 Vegetables for the Pot

const vegetablesForThePot = [
  page(villageScene({ treeX: 300, treeScale: 1.5 }), cookpot(1120, 880, 1.6),
    basketOf(880, 895, 0.66, { inner: `${carrot(-50, 16, 0.8)}${vegProp(60, 16, 0.36, "onion")}` }),
    figureA("hana", { x: 420, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 680, y: VILLAGE_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 1340, treeScale: 1.4 }),
    figureA("hana", { x: 620, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 900, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(basicScene(), seedRow(1000, 898, 1.15), fence(300, 870, 0.85, 3),
    figureA("hana", { x: 560, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 820, y: VILLAGE_FLOOR, s: 1.44, mood: "happy" })),

  page(basicScene(), seedRow(700, 900, 1),
    carrot(1080, 880, 1.5), carrot(1200, 895, 1.3),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), seedRow(1180, 905, 0.9),
    vegProp(760, 890, 0.55, "potato"), vegProp(920, 900, 0.5, "potato"), vegProp(1060, 890, 0.52, "potato"),
    figureA("hana", { x: 460, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(basicScene(), seedRow(400, 900, 0.85), fence(1320, 875, 0.85, 2),
    vegProp(1020, 885, 0.6, "onion"),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(basicScene(), seedRow(1150, 905, 0.9),
    vegProp(880, 885, 0.62, "beans"),
    figureA("hana", { x: 400, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.44, mood: "happy", arms: "point" })),

  page(basicScene(), fence(300, 870, 0.85, 3),
    basketOf(1060, 890, 0.75, { inner: `${vegProp(-70, 10, 0.4, "onion")}${carrot(50, 20, 0.8)}` }),
    fruitProp(820, 862, 0.5, "tomato"),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(villageScene({ treeX: 1320, treeScale: 1.35 }), villageWell(1080, 800, 0.7),
    splashArcs(880, 870, "#9ec4d8"),
    figureA("hana", { x: 420, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 680, y: VILLAGE_FLOOR, s: 1.44, mood: "happy" })),

  page(villageScene({ treeX: 300, treeScale: 1.5 }), cookpot(1080, 880, 1.7),
    figureA("hana", { x: 480, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 1340, treeScale: 1.4 }), cookpot(1040, 880, 1.6),
    figureA("amal", { x: 640, y: VILLAGE_FLOOR, s: 1.48, mood: "happy" })),

  page(homeWall(), confetti(860, 310, 0.9),
    foodBowl(1060, 800, 0.55), foodBowl(1240, 815, 0.5),
    figureA("mum", { x: 340, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("hana", { x: 580, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 840, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1080, y: HOME_FLOOR, s: 1.42, mood: "happy" })),
];

// ---------------------------------------------------------------- books

const books = {
  // Unit 1
  "kikis-second-day-of-school": { dir: "kikis-second-day-of-school", pages: kikisSecondDayOfSchool },
  "amal-packs-her-bag": { dir: "amal-packs-her-bag", pages: amalPacksHerBag },
  // Unit 2
  "after-breakfast-at-grandmas": { dir: "after-breakfast-at-grandmas", pages: afterBreakfast },
  "fruit-for-breakfast": { dir: "fruit-for-breakfast", pages: fruitForBreakfast },
  // Unit 3
  "kiki-learns-to-jump": { dir: "kiki-learns-to-jump", pages: kikiLearnsToJump },
  "the-puppy-hides": { dir: "the-puppy-hides", pages: thePuppyHides },
  // Unit 4
  "a-hat-for-the-scarecrow": { dir: "a-hat-for-the-scarecrow", pages: aHatForTheScarecrow },
  "the-dressing-up-box": { dir: "the-dressing-up-box", pages: theDressingUpBox },
  // Unit 5
  "the-chick-and-the-duck": { dir: "the-chick-and-the-duck", pages: theChickAndTheDuck },
  "vegetables-for-the-pot": { dir: "vegetables-for-the-pot", pages: vegetablesForThePot },
};

writeBooks(books, process.argv[2]);
