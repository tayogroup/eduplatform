#!/usr/bin/env node

// Generates the vector illustrations for the Amal series — Grade 1's SECOND
// book per unit, one for each of units 1 to 10:
//
//   1  Amal's First Day             Unit 1  Welcome to School
//   2  Breakfast at Grandma's House Unit 2  Family Time
//   3  Amal and the Big Ball        Unit 3  Fun and Games
//   4  Amal Makes a Mat             Unit 4  Making Things
//   5  Amal and the Little Hen      Unit 5  On the Farm
//   6  Amal at the Market           Unit 6  My Five Senses
//   7  Amal's Big Bus Ride          Unit 7  Let's Go!
//   8  The Well in the Village      Unit 8  Wonderful Water
//   9  A Walk Around Town           Unit 9  City Places
//   10 Amal's English Year          Unit 10 My First English World
//
// Each one is the unit's OWN story, from the unit's own Reading section, told
// as twelve picture-book pages. Every unit already carries a book from the
// animal storyworld (Kiki, Duku, Lulu), so the shelf now holds a fable and the
// child's own day rather than two of the same thing.
//
// The cast comes from the Year 1 passages and is drawn with the same person()
// the Grade 3 and Grade 4 books use — see tools/lib/ehel-ebook-kit-amal.js.
//
// Usage: node tools/create-amal-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  W, H, writeBooks,
  basicScene, roomScene, townScene, streetScene, coastScene, gardenScene,
  classroomScene, plainRoomScene, sky, sun, hills, ground, tallGrass, acacia,
  bigFlower, barn, fence, haystack, seedRow, hen, chick, goat, mango, marketStall,
  schoolBell, bench, lake, sailboat, rain, puddle, rainbow, confetti, dustPuffs,
  bunting, motionArcs, thoughtBubble, openBook, heldBook, heldPaper,
  bookShelf, shopRow, libraryBuilding, trafficRow, crossing, recycleBin, litterBits,
  lampPost, townBus, flatStone, plantStage, hospital, poster, globeProp, cloudPuff,
  A1, figureA, babyIdris, homeWall, closedBook, childDrawing, bedProp, house,
  schoolTable, schoolChair, abcChart, wallClock, pencilProp, crayonProp, colourBall, schoolFront,
  foodBowl, cupOfMilk, fruitProp, basketOf,
  grassMat, shapePicture, scissorsProp,
  cow, sheep, eggProp, tractorProp, seedBowl,
  spicePot, clothBolt, breadLoaf, senseIcon, sensePanel, pictureCard,
  bicycleProp, carProp, busStop, trafficLights,
  villageWell, waterPot, dryGrass,
  learningFolder, madeBook,
  villageScene, amalClassroom,
} = require("./lib/ehel-ebook-kit-amal.js");

// A page is a scene plus the things standing in it, in back-to-front order.
const page = (...parts) => parts.join("");

// The ground line each scene puts under a standing figure. Named once so a
// child and a table on the same page share a floor.
const CLASS_FLOOR = 930;
const HOME_FLOOR = 940;
const OUT_FLOOR = 900;
const VILLAGE_FLOOR = 930;

// A night wash laid over a daytime scene, so the village keeps its own shapes
// after dark. Taken from the Grade 2 generator, which had the same need.
const nightWash = () => `<rect width="${W}" height="${H}" fill="#27395c" opacity="0.46"/>`;
const nightStars = () => {
  let stars = "";
  for (let i = 0; i < 14; i += 1) {
    const sx = (i * 211 + 90) % W;
    const sy = 40 + ((i * 137) % 380);
    stars += `<circle class="anim-glow" style="animation-delay:${((i % 5) / 2).toFixed(1)}s" cx="${sx}" cy="${sy}" r="${3 + (i % 3)}" fill="#f6f0d8" opacity="0.9"/>`;
  }
  return stars;
};

// ---------------------------------------------------------------- 1. Amal's First Day

const amalsFirstDay = [
  page(amalClassroom(), bunting(420, 96, 0.82),
    schoolTable(380, CLASS_FLOOR, 1.2, { item: openBook(0, 0, 0.55) }),
    figureA("yasmin", { x: 700, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 1010, y: CLASS_FLOOR, s: 1.45, mood: "happy" }),
    figureA("adam", { x: 1230, y: CLASS_FLOOR, s: 1.42, mood: "happy" }),
    figureA("samira", { x: 1430, y: CLASS_FLOOR, s: 1.42 })),

  page(townScene(), schoolFront(1080, 760, 0.95),
    figureA("amal", { x: 430, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("mum", { x: 640, y: OUT_FLOOR, s: 1.7 })),

  page(townScene(), schoolFront(1140, 760, 0.95),
    figureA("yasmin", { x: 780, y: OUT_FLOOR, s: 1.7, mood: "happy", arms: "point" }),
    figureA("amal", { x: 420, y: OUT_FLOOR, s: 1.5 })),

  page(amalClassroom(),
    figureA("amal", { x: 780, y: CLASS_FLOOR, s: 1.85, mood: "happy" }),
    figureA("yasmin", { x: 1200, y: CLASS_FLOOR, s: 1.65, mood: "happy" })),

  page(amalClassroom(),
    schoolTable(430, CLASS_FLOOR, 1.35), schoolChair(760, CLASS_FLOOR, 1.3),
    schoolTable(1400, CLASS_FLOOR, 1.35),
    figureA("amal", { x: 1080, y: CLASS_FLOOR, s: 1.5, mood: "surprised", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: `${openBook(-60, 0, 0.55)}${crayonProp(80, -20, 0.34)}` }),
    figureA("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, arms: "up" })),

  page(amalClassroom(),
    schoolTable(1080, CLASS_FLOOR, 1.5, { item: `${closedBook(-70, -46, 0.42)}${pencilProp(80, -40, 0.34, { colour: A1.blue })}` }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "surprised", arms: "point" })),

  page(amalClassroom(),
    figureA("adam", { x: 700, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" }),
    figureA("amal", { x: 1030, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 380, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureA("amal", { x: 860, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1090, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1320, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    schoolTable(1180, CLASS_FLOOR, 1.45, { item: crayonProp(0, -44, 0.42, { colour: A1.green }) }),
    figureA("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureA("amal", { x: 800, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1080, CLASS_FLOOR, 1.5, { item: childDrawing(0, -60, 0.5) }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(townScene(), schoolFront(1300, 780, 0.7),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("mum", { x: 880, y: OUT_FLOOR, s: 1.7, mood: "happy" })),
];

// ---------------------------------------------------------------- 2. Breakfast at Grandma's House

const breakfastAtGrandmas = [
  page(homeWall(), bunting(800, 140, 1.1),
    schoolTable(820, HOME_FLOOR, 1.55, { item: `${basketOf(0, 0, 0.34, { inner: fruitProp(0, 0, 0.9, "banana") })}` }),
    figureA("hana", { x: 380, y: HOME_FLOOR, s: 1.7, mood: "happy" }),
    figureA("grandpa", { x: 1180, y: HOME_FLOOR, s: 1.7, mood: "happy" }),
    figureA("amal", { x: 1420, y: HOME_FLOOR, s: 1.45, mood: "happy" })),

  page(homeWall(), bedProp(1080, HOME_FLOOR, 0.95),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.7, mood: "surprised", arms: "up" })),

  page(homeWall(),
    figureA("mum", { x: 420, y: HOME_FLOOR, s: 1.7 }),
    figureA("dad", { x: 660, y: HOME_FLOOR, s: 1.72 }),
    figureA("amal", { x: 940, y: HOME_FLOOR, s: 1.45, mood: "happy" }),
    babyIdris(1220, HOME_FLOOR, 1.35)),

  page(townScene(), house(1260, 780, 1.05),
    figureA("mum", { x: 620, y: OUT_FLOOR, s: 1.7 }),
    figureA("amal", { x: 850, y: OUT_FLOOR, s: 1.45, mood: "happy" })),

  page(homeWall(),
    figureA("hana", { x: 640, y: HOME_FLOOR, s: 1.85, mood: "happy", arms: "up" }),
    figureA("amal", { x: 1000, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    schoolTable(1120, HOME_FLOOR, 1.5, { item: foodBowl(0, -10, 0.4) }),
    figureA("grandpa", { x: 620, y: HOME_FLOOR, s: 1.8, mood: "happy", arms: "point" })),

  page(homeWall(),
    schoolTable(820, HOME_FLOOR, 1.8, { item: `${mango(-150, -14, 0.9)}${fruitProp(-50, -18, 0.36, "banana")}${fruitProp(46, -30, 0.34, "grapes")}${fruitProp(140, -24, 0.32, "strawberry")}` }),
    figureA("amal", { x: 300, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hana", { x: 1360, y: HOME_FLOOR, s: 1.7 })),

  page(homeWall(),
    schoolTable(1160, HOME_FLOOR, 1.5, { item: fruitProp(0, -54, 0.7, "grapes") }),
    figureA("grandpa", { x: 460, y: HOME_FLOOR, s: 1.75, arms: "point" }),
    figureA("amal", { x: 800, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(homeWall(),
    schoolTable(1060, HOME_FLOOR, 1.6, { item: `${foodBowl(-110, -6, 0.3)}${foodBowl(-38, -6, 0.3)}${foodBowl(34, -6, 0.3)}${foodBowl(106, -6, 0.3)}` }),
    figureA("amal", { x: 520, y: HOME_FLOOR, s: 1.55, holding: foodBowl(0, 6, 0.2) })),

  page(homeWall(),
    schoolTable(700, HOME_FLOOR, 1.5, { item: `${foodBowl(-70, -6, 0.32)}${cupOfMilk(70, -20, 0.3)}` }),
    figureA("hana", { x: 320, y: HOME_FLOOR, s: 1.7 }),
    babyIdris(1120, HOME_FLOOR, 1.5, { mess: true }),
    figureA("amal", { x: 1380, y: HOME_FLOOR, s: 1.48, mood: "happy" })),

  page(homeWall(), confetti(800, 300, 1),
    figureA("dad", { x: 380, y: HOME_FLOOR, s: 1.7, mood: "happy" }),
    figureA("mum", { x: 600, y: HOME_FLOOR, s: 1.68, mood: "happy" }),
    babyIdris(830, HOME_FLOOR, 1.35, { mess: true }),
    figureA("amal", { x: 1080, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("hana", { x: 1300, y: HOME_FLOOR, s: 1.68, mood: "happy" }),
    figureA("grandpa", { x: 1500, y: HOME_FLOOR, s: 1.68, mood: "happy" })),

  page(homeWall(),
    schoolTable(1180, HOME_FLOOR, 1.5),
    figureA("hana", { x: 380, y: HOME_FLOOR, s: 1.68 }),
    figureA("mum", { x: 600, y: HOME_FLOOR, s: 1.66 }),
    figureA("amal", { x: 880, y: HOME_FLOOR, s: 1.48, holding: foodBowl(0, 6, 0.2) })),
];

// ---------------------------------------------------------------- 3. Amal and the Big Ball

const amalAndTheBigBall = [
  page(townScene(), acacia(1320, 620, 1.5), bunting(800, 130, 1.05),
    colourBall(900, 800, 0.8, A1.red),
    figureA("amal", { x: 500, y: OUT_FLOOR, s: 1.55, mood: "happy" }),
    figureA("samira", { x: 720, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("leo", { x: 1120, y: OUT_FLOOR, s: 1.3, mood: "happy" })),

  page(townScene(), acacia(1330, 630, 1.45),
    colourBall(1000, 800, 0.85, A1.red),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "up" })),

  page(townScene(), acacia(1340, 640, 1.35),
    `<g fill="none" stroke="${A1.black}" stroke-width="7" stroke-linecap="round" opacity="0.4" stroke-dasharray="14 16"><path d="M 760 800 q 90 -150 180 0"/><path d="M 940 800 q 90 -120 180 0"/></g>`,
    colourBall(1180, 780, 0.7, A1.red),
    figureA("amal", { x: 500, y: OUT_FLOOR, s: 1.6, mood: "happy" })),

  page(townScene(), acacia(1350, 640, 1.3),
    colourBall(880, 780, 0.7, A1.red),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.58, arms: "point" }),
    figureA("samira", { x: 1130, y: OUT_FLOOR, s: 1.55, mood: "happy" })),

  page(townScene(), acacia(1360, 650, 1.25), motionArcs(880, 660, 1.5),
    colourBall(1010, 640, 0.6, A1.red),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.58, arms: "up" }),
    figureA("samira", { x: 1240, y: OUT_FLOOR, s: 1.55, arms: "up" })),

  page(townScene(), acacia(1350, 640, 1.3),
    colourBall(700, 800, 0.7, A1.red),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.58 }),
    figureA("samira", { x: 940, y: OUT_FLOOR, s: 1.55 }),
    figureA("leo", { x: 1180, y: OUT_FLOOR, s: 1.3, mood: "sad" })),

  page(townScene(), acacia(1350, 640, 1.3),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureA("samira", { x: 880, y: OUT_FLOOR, s: 1.55, mood: "happy" }),
    figureA("leo", { x: 1120, y: OUT_FLOOR, s: 1.32, mood: "happy", arms: "up" })),

  page(townScene(), acacia(1360, 650, 1.25), dustPuffs(880, 880, 1.1),
    colourBall(1000, 830, 0.62, A1.red),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.58, arms: "point" }),
    figureA("leo", { x: 1200, y: OUT_FLOOR, s: 1.32, mood: "happy" })),

  page(townScene(), acacia(1180, 620, 1.7),
    colourBall(1170, 430, 0.6, A1.red),
    `<g fill="none" stroke="${A1.black}" stroke-width="7" stroke-linecap="round" opacity="0.4" stroke-dasharray="14 16"><path d="M 700 800 q 260 -420 450 -350"/></g>`,
    figureA("leo", { x: 620, y: OUT_FLOOR, s: 1.32, mood: "surprised", arms: "up" }),
    figureA("amal", { x: 400, y: OUT_FLOOR, s: 1.55, mood: "surprised" })),

  page(townScene(), acacia(1180, 620, 1.7),
    colourBall(1170, 430, 0.6, A1.red),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.55, arms: "up" }),
    figureA("samira", { x: 700, y: OUT_FLOOR, s: 1.52, arms: "up" }),
    figureA("leo", { x: 900, y: OUT_FLOOR, s: 1.3, arms: "up" })),

  page(townScene(), acacia(1180, 620, 1.7),
    colourBall(1020, 700, 0.62, A1.red),
    figureA("adam", { x: 1220, y: OUT_FLOOR, s: 1.68, arms: "up" }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("leo", { x: 800, y: OUT_FLOOR, s: 1.3, mood: "happy" })),

  page(townScene(), acacia(1330, 630, 1.45), confetti(800, 320, 1),
    colourBall(880, 800, 0.72, A1.red),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1080, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1280, y: OUT_FLOOR, s: 1.3, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 4. Amal Makes a Mat

const amalMakesAMat = [
  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1150, 890, 1.15, { neat: true, laid: true }),
    figureA("hana", { x: 620, y: VILLAGE_FLOOR, s: 1.75, mood: "happy" }),
    figureA("amal", { x: 880, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hodan", { x: 1320, y: VILLAGE_FLOOR, s: 1.3, mood: "happy" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1180, 890, 1.25, { neat: true, laid: true }),
    figureA("hana", { x: 700, y: VILLAGE_FLOOR, s: 1.8 })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1240, 890, 1.1, { neat: true, laid: true }),
    figureA("hana", { x: 900, y: VILLAGE_FLOOR, s: 1.75 }),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1140, 890, 1.15, { neat: false, laid: true }),
    figureA("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.55 })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1100, 880, 1.35, { neat: false, laid: true }),
    figureA("amal", { x: 480, y: VILLAGE_FLOOR, s: 1.55, mood: "sad" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    figureA("adam", { x: 1060, y: VILLAGE_FLOOR, s: 1.68, holding: heldPaper }),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.55, mood: "sad" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    shapePicture(1080, 700, 1),
    figureA("adam", { x: 660, y: VILLAGE_FLOOR, s: 1.68, arms: "point" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    shapePicture(1040, 690, 1.05),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.55, mood: "surprised", arms: "point" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    figureA("adam", { x: 1000, y: VILLAGE_FLOOR, s: 1.68, mood: "happy" }),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.55 }),
    scissorsProp(1360, 840, 0.9)),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1160, 890, 1.15, { neat: false, laid: true }),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.55 })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }),
    grassMat(1180, 852, 0.86, { neat: true }),
    figureA("amal", { x: 460, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("hana", { x: 700, y: VILLAGE_FLOOR, s: 1.75, mood: "happy" })),

  page(villageScene({ treeX: 820, treeScale: 1.7 }), confetti(820, 300, 1),
    grassMat(1180, 890, 1.05, { neat: true, laid: true }),
    figureA("hana", { x: 420, y: VILLAGE_FLOOR, s: 1.72, mood: "happy" }),
    figureA("amal", { x: 680, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hodan", { x: 880, y: VILLAGE_FLOOR, s: 1.3, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1360, y: VILLAGE_FLOOR, s: 1.66, mood: "happy" })),
];

// ---------------------------------------------------------------- 5. Amal and the Little Hen

const farmScene = () => `${basicScene()}${barn(1300, 700, 1.15)}${fence(220, 830, 1)}`;

const amalAndTheLittleHen = [
  page(farmScene(),
    cow(760, 880, 0.82), hen({ x: 1020, y: 890, s: 0.62 }), chick(1140, 900, 0.6),
    figureA("hana", { x: 420, y: VILLAGE_FLOOR, s: 1.72, mood: "happy" }),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.48, mood: "happy" })),

  page(basicScene(), barn(1280, 700, 1.2),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.55, mood: "happy" }),
    figureA("hana", { x: 820, y: VILLAGE_FLOOR, s: 1.75, arms: "point" })),

  page(farmScene(), cow(1080, 880, 0.95),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(farmScene(), sheep(880, 890, 1), goat({ x: 1220, y: 880, s: 0.6 }),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(farmScene(), seedBowl(1180, 780, 0.8),
    figureA("hana", { x: 860, y: VILLAGE_FLOOR, s: 1.75, arms: "point" }),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.52, holding: seedBowl(0, 8, 0.22) })),

  page(basicScene(), barn(1120, 690, 1.35), haystack(400, 880, 1),
    hen({ x: 920, y: 890, s: 0.68, mood: "sad" }),
    figureA("amal", { x: 600, y: VILLAGE_FLOOR, s: 1.52, mood: "sad" })),

  page(basicScene(), barn(1120, 690, 1.35),
    hen({ x: 940, y: 890, s: 0.7 }), chick(1090, 900, 0.55),
    figureA("amal", { x: 600, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(basicScene(), barn(1200, 690, 1.25), haystack(980, 880, 1.15),
    eggProp(980, 860, 0.62, { count: 1 }),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.55, mood: "surprised", arms: "up" })),

  page(farmScene(), eggProp(1100, 770, 0.5, { count: 1 }),
    figureA("hana", { x: 860, y: VILLAGE_FLOOR, s: 1.75, mood: "happy" }),
    figureA("amal", { x: 580, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", holding: eggProp(0, 6, 0.16, { count: 1 }) })),

  page(basicScene(), seedRow(1000, 880, 1.2), plantStage(1300, 860, 0.9),
    figureA("hana", { x: 780, y: VILLAGE_FLOOR, s: 1.72 }),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.52 })),

  page(basicScene(), dustPuffs(880, 890, 1),
    figureA("adam", { x: 1112, y: 802, s: 1.05, mood: "happy", arms: "up" }),
    tractorProp(1140, 880, 0.82),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(homeWall({ night: true }), nightWash(), nightStars(),
    schoolTable(1020, HOME_FLOOR, 1.5, { item: `${breadLoaf(-70, -20, 0.34)}${cupOfMilk(80, -16, 0.3)}` }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hana", { x: 1380, y: HOME_FLOOR, s: 1.7, mood: "happy" })),
];

// ---------------------------------------------------------------- 6. Amal at the Market

const marketScene = () => `${townScene()}${marketStall(1280, 800, 1.15)}${shopRow(300, 700, 0.9)}`;

const amalAtTheMarket = [
  page(marketScene(), bunting(760, 130, 1.05),
    basketOf(940, 880, 0.7, { inner: fruitProp(0, 0, 0.9, "tomato") }),
    figureA("hana", { x: 560, y: OUT_FLOOR, s: 1.72, mood: "happy" }),
    figureA("amal", { x: 780, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(marketScene(),
    figureA("hana", { x: 900, y: OUT_FLOOR, s: 1.78, arms: "point" }),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(marketScene(),
    basketOf(560, 880, 0.8, { inner: fruitProp(0, 0, 1, "tomato") }),
    basketOf(880, 880, 0.8, { inner: fruitProp(0, 0, 1, "banana") }),
    basketOf(1200, 880, 0.8, { inner: mango(0, 10, 1.1) }),
    sensePanel(240, 300, 0.82, "eye")),

  page(marketScene(), sensePanel(250, 300, 0.8, "ear"),
    goat({ x: 1010, y: 880, s: 0.58 }),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(marketScene(), sensePanel(250, 300, 0.8, "nose"),
    breadLoaf(1020, 850, 0.9),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(marketScene(), sensePanel(250, 300, 0.8, "nose"),
    bigFlower(700, 870, 1.3), spicePot(980, 860, 1), spicePot(1180, 870, 0.9, { tint: "#8f9a3c" }),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(marketScene(),
    basketOf(940, 880, 0.7, { inner: mango(0, 6, 1.2) }),
    figureA("omar", { x: 1120, y: OUT_FLOOR, s: 1.72, mood: "happy", arms: "point" }),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(marketScene(), sensePanel(1290, 300, 0.8, "tongue"),
    figureA("omar", { x: 1120, y: OUT_FLOOR, s: 1.7, mood: "happy" }),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.6, mood: "happy", holding: mango(0, 4, 0.3) })),

  page(marketScene(), sensePanel(250, 300, 0.8, "hand"),
    clothBolt(1020, 800, 0.9),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(marketScene(), sensePanel(250, 300, 0.8, "hand"),
    flatStone(980, 880, 1.6),
    figureA("amal", { x: 680, y: OUT_FLOOR, s: 1.5 })),

  page(marketScene(),
    basketOf(920, 880, 0.66, { inner: fruitProp(0, 0, 0.8, "tomato") }),
    basketOf(1120, 870, 0.95, { inner: mango(0, 6, 1.3) }),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "surprised", arms: "point" })),

  page(townScene(),
    figureA("hana", { x: 1000, y: OUT_FLOOR, s: 1.78, mood: "happy" }),
    figureA("amal", { x: 740, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    `<g>${[["eye", 420], ["ear", 660], ["nose", 900], ["tongue", 1140], ["hand", 1380]].map((entry) => sensePanel(entry[1], 250, 0.44, entry[0])).join("")}</g>`),
];

// ---------------------------------------------------------------- 7. Amal's Big Bus Ride

const amalsBigBusRide = [
  page(streetScene(), townBus(1020, 800, 1.1),
    figureA("amal", { x: 460, y: 880, s: 1.5, mood: "happy", arms: "up" }),
    figureA("mum", { x: 660, y: 880, s: 1.7 })),

  page(roomScene(),
    figureA("amal", { x: 660, y: HOME_FLOOR, s: 1.55, arms: "up" }),
    figureA("mum", { x: 1000, y: HOME_FLOOR, s: 1.72, arms: "point" })),

  page(streetScene(), marketStall(1180, 780, 1.1),
    figureA("mum", { x: 620, y: 880, s: 1.7 }),
    figureA("amal", { x: 840, y: 880, s: 1.48, mood: "happy" })),

  page(streetScene(), busStop(1120, 880, 0.95),
    figureA("mum", { x: 620, y: 880, s: 1.7 }),
    figureA("amal", { x: 840, y: 880, s: 1.48 })),

  page(streetScene(), busStop(320, 880, 0.85), townBus(1020, 800, 1.25),
    figureA("amal", { x: 560, y: 880, s: 1.5, mood: "surprised", arms: "up" })),

  page(streetScene(), townBus(1060, 800, 1.3),
    figureA("mum", { x: 520, y: 880, s: 1.7, arms: "point" }),
    figureA("amal", { x: 740, y: 880, s: 1.48, mood: "happy" })),

  page(streetScene(), townBus(880, 800, 1.4), motionArcs(300, 780, 1.4)),

  page(streetScene(), townBus(1240, 800, 1.05),
    bicycleProp(660, 830, 0.95),
    figureA("adam", { x: 660, y: 800, s: 1.35, mood: "happy", arms: "up" })),

  page(streetScene(), carProp(560, 860, 1), motionArcs(300, 800, 1.2),
    townBus(1240, 800, 1)),

  page(streetScene(), schoolFront(1220, 700, 0.7), townBus(320, 810, 0.85),
    figureA("samira", { x: 820, y: 880, s: 1.45, mood: "happy", arms: "up" })),

  page(streetScene(), shopRow(360, 700, 0.9), libraryBuilding(1180, 720, 0.85),
    townBus(760, 810, 0.9)),

  page(coastScene(), sailboat(1200, 700, 1.15),
    figureA("hana", { x: 900, y: OUT_FLOOR, s: 1.76, mood: "happy", arms: "up" }),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("mum", { x: 420, y: OUT_FLOOR, s: 1.7, mood: "happy" })),
];

// ---------------------------------------------------------------- 8. The Well in the Village

const theWellInTheVillage = [
  page(villageScene(), villageWell(980, 800, 0.95),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 1340, y: VILLAGE_FLOOR, s: 1.68 })),

  page(villageScene(), villageWell(1140, 800, 0.85),
    figureA("adam", { x: 760, y: VILLAGE_FLOOR, s: 1.68 }),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.5, holding: waterPot(0, 6, 0.2, { full: false }) })),

  page(villageScene(), villageWell(1080, 800, 0.9),
    waterPot(700, 900, 0.7, { full: false }),
    figureA("adam", { x: 480, y: VILLAGE_FLOOR, s: 1.68, arms: "point" })),

  page(villageScene(), villageWell(1060, 800, 0.95, { potDown: true }),
    waterPot(1060, 786, 0.5),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 780, y: VILLAGE_FLOOR, s: 1.68, arms: "up" })),

  page(homeWall(),
    schoolTable(1080, HOME_FLOOR, 1.5, { item: foodBowl(0, -10, 0.42, { kind: "soup" }) }),
    figureA("mum", { x: 620, y: HOME_FLOOR, s: 1.74, mood: "happy" })),

  page(homeWall(),
    waterPot(1140, 880, 0.75),
    figureA("amal", { x: 640, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(),
    figureA("hodan", { x: 900, y: HOME_FLOOR, s: 1.42, mood: "happy", holding: cupOfMilk(0, 4, 0.24) }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ dry: true }), dryGrass(560, 900, 1.25), dryGrass(1120, 910, 1.35),
    figureA("amal", { x: 840, y: VILLAGE_FLOOR, s: 1.52, mood: "sad" })),

  page(villageScene({ dry: true }), villageWell(1080, 810, 0.9), dryGrass(500, 910, 1.2),
    figureA("adam", { x: 700, y: VILLAGE_FLOOR, s: 1.68, mood: "sad" }),
    figureA("amal", { x: 460, y: VILLAGE_FLOOR, s: 1.5, mood: "sad" })),

  page(villageScene({ dry: true, sunny: false }),
    `<rect width="${W}" height="${H}" fill="#6f7a8c" opacity="0.34"/>`,
    cloudPuff(600, 250, 1.5), cloudPuff(1080, 210, 1.7), rain(800, 400, 1.2),
    figureA("amal", { x: 800, y: VILLAGE_FLOOR, s: 1.55, mood: "surprised", arms: "up" })),

  page(villageScene({ sunny: false }),
    `<rect width="${W}" height="${H}" fill="#6f7a8c" opacity="0.22"/>`,
    cloudPuff(600, 230, 1.4), rain(820, 400, 1.3), puddle(1180, 920, 1.3), puddle(420, 930, 1.1),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 860, y: VILLAGE_FLOOR, s: 1.35, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1080, y: VILLAGE_FLOOR, s: 1.68, mood: "happy", arms: "up" })),

  page(villageScene({ sunny: false }), nightWash(), nightStars(),
    villageWell(1000, 810, 0.95),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),
];

// ---------------------------------------------------------------- 9. A Walk Around Town

const aWalkAroundTown = [
  page(townScene(), shopRow(300, 700, 0.85), libraryBuilding(1300, 720, 0.8), lampPost(900, 780, 0.9),
    figureA("mum", { x: 640, y: OUT_FLOOR, s: 1.72 }),
    figureA("amal", { x: 860, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(streetScene(), trafficLights(1180, 880, 1.05, { lit: "red" }), crossing(760, 880, 0.9),
    figureA("mum", { x: 520, y: 880, s: 1.7 }),
    figureA("amal", { x: 320, y: 880, s: 1.48 })),

  page(streetScene(), trafficLights(1180, 880, 1.05, { lit: "green" }), crossing(760, 880, 0.9),
    figureA("mum", { x: 560, y: 880, s: 1.7, arms: "point" }),
    figureA("amal", { x: 800, y: 880, s: 1.48, mood: "happy", arms: "up" })),

  page(townScene(), schoolFront(1120, 760, 0.9),
    figureA("adam", { x: 1120, y: OUT_FLOOR, s: 1.66, mood: "happy", arms: "up" }),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("mum", { x: 300, y: OUT_FLOOR, s: 1.7 })),

  page(townScene(), marketStall(1140, 800, 1.2), basketOf(760, 880, 0.72, { inner: mango(0, 6, 1) }),
    figureA("amal", { x: 460, y: OUT_FLOOR, s: 1.5, mood: "surprised" }),
    figureA("mum", { x: 260, y: OUT_FLOOR, s: 1.7 })),

  page(townScene(), marketStall(1300, 800, 1.15),
    basketOf(1020, 880, 0.7, { inner: mango(0, 6, 1.2) }),
    figureA("omar", { x: 1160, y: OUT_FLOOR, s: 1.72, mood: "happy", arms: "point" }),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(townScene(), marketStall(1320, 800, 1.1),
    figureA("omar", { x: 1080, y: OUT_FLOOR, s: 1.72, mood: "happy" }),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy", holding: mango(0, 4, 0.28) })),

  page(townScene(), hospital(1220, 720, 0.95),
    figureA("faduma", { x: 940, y: OUT_FLOOR, s: 1.72, mood: "happy" }),
    figureA("mum", { x: 500, y: OUT_FLOOR, s: 1.7, arms: "point" }),
    figureA("amal", { x: 720, y: OUT_FLOOR, s: 1.48 })),

  page(townScene(), acacia(1340, 640, 1.35), tallGrass(220, 880, 1.2), bench(1140, 870, 1.25), litterBits(880, 890, 1.1),
    figureA("leo", { x: 900, y: OUT_FLOOR, s: 1.32, mood: "sad" }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, arms: "point" })),

  page(townScene(), acacia(1340, 640, 1.35), tallGrass(220, 880, 1.2), bench(1180, 870, 1.25), recycleBin(1000, 880, 0.95),
    figureA("leo", { x: 800, y: OUT_FLOOR, s: 1.32, mood: "happy" }),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(townScene(), libraryBuilding(1140, 720, 0.95),
    figureA("hana", { x: 1000, y: OUT_FLOOR, s: 1.74, mood: "happy", arms: "up" }),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("mum", { x: 460, y: OUT_FLOOR, s: 1.7 })),

  page(townScene(), shopRow(280, 700, 0.8), libraryBuilding(1340, 730, 0.75), lampPost(880, 790, 0.85),
    figureA("mum", { x: 620, y: OUT_FLOOR, s: 1.72, mood: "happy" }),
    figureA("amal", { x: 880, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 10. Amal's English Year

const amalsEnglishYear = [
  page(amalClassroom(), bunting(420, 96, 0.82),
    figureA("amal", { x: 800, y: CLASS_FLOOR, s: 1.65, mood: "happy" }),
    madeBook(1220, 810, 0.85, { title: "My First English World" })),

  page(amalClassroom(),
    schoolTable(1120, CLASS_FLOOR, 1.4),
    figureA("yasmin", { x: 460, y: CLASS_FLOOR, s: 1.62, mood: "happy" }),
    figureA("amal", { x: 800, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(),
    learningFolder(1080, 850, 1),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.58, mood: "happy", arms: "point" })),

  page(plainRoomScene(), abcChart(1120, 420, 1.1),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(),
    pictureCard(1120, 450, 0.95, { inner: shapePicture(0, 0, 0.72) }),
    figureA("mum", { x: 300, y: CLASS_FLOOR, s: 1.66 }),
    figureA("amal", { x: 620, y: CLASS_FLOOR, s: 1.52, mood: "happy" }),
    babyIdris(880, CLASS_FLOOR, 1.25)),

  page(plainRoomScene(),
    colourBall(1300, 860, 0.62, A1.red),
    pictureCard(940, 450, 0.9, { inner: shapePicture(0, 0, 0.68) }),
    figureA("amal", { x: 460, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(basicScene(), barn(1240, 700, 1.1),
    cow(940, 890, 0.72), hen({ x: 1150, y: 890, s: 0.6 }),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(),
    `<g>${[["eye", 660], ["ear", 940], ["nose", 1220], ["tongue", 1480]].map((entry) => sensePanel(entry[1], 420, 0.62, entry[0])).join("")}</g>`,
    figureA("amal", { x: 340, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(),
    pictureCard(760, 450, 0.86, { inner: townBus(0, 40, 0.5) }),
    pictureCard(1090, 450, 0.86, { inner: waterPot(0, 60, 0.62) }),
    pictureCard(1420, 450, 0.86, { inner: libraryBuilding(0, 96, 0.46) }),
    figureA("amal", { x: 380, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(),
    schoolTable(1080, CLASS_FLOOR, 1.5, { item: madeBook(0, -60, 0.4, { title: "My First English World" }) }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82),
    figureA("amal", { x: 520, y: CLASS_FLOOR, s: 1.58, mood: "happy", holding: madeBook(0, 0, 0.16, { title: "My Book" }) }),
    figureA("adam", { x: 980, y: CLASS_FLOOR, s: 1.45 }),
    figureA("samira", { x: 1180, y: CLASS_FLOOR, s: 1.45 }),
    figureA("leo", { x: 1360, y: CLASS_FLOOR, s: 1.28 })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(860, 320, 1.1),
    figureA("yasmin", { x: 380, y: CLASS_FLOOR, s: 1.62, mood: "happy" }),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1030, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1230, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1420, y: CLASS_FLOOR, s: 1.28, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- books

const books = {
  "amals-first-day": { dir: "amals-first-day", pages: amalsFirstDay },
  "breakfast-at-grandmas-house": { dir: "breakfast-at-grandmas-house", pages: breakfastAtGrandmas },
  "amal-and-the-big-ball": { dir: "amal-and-the-big-ball", pages: amalAndTheBigBall },
  "amal-makes-a-mat": { dir: "amal-makes-a-mat", pages: amalMakesAMat },
  "amal-and-the-little-hen": { dir: "amal-and-the-little-hen", pages: amalAndTheLittleHen },
  "amal-at-the-market": { dir: "amal-at-the-market", pages: amalAtTheMarket },
  "amals-big-bus-ride": { dir: "amals-big-bus-ride", pages: amalsBigBusRide },
  "the-well-in-the-village": { dir: "the-well-in-the-village", pages: theWellInTheVillage },
  "a-walk-around-town": { dir: "a-walk-around-town", pages: aWalkAroundTown },
  "amals-english-year": { dir: "amals-english-year", pages: amalsEnglishYear },
};

writeBooks(books, process.argv[2]);
