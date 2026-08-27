#!/usr/bin/env node

// Generates the vector illustrations for Grade 1's THIRD, FOURTH and FIFTH
// books — thirty books, three for each of units 1 to 10.
//
// Grade 1 shipped with two books per unit: the animal fable (Kiki, Duku, Lulu)
// from create-musa-ebook-illustrations.js, and the child's own day (the Amal
// series) from create-amal-ebook-illustrations.js. Grade 4 had already grown to
// five per unit; this brings Grade 1 to the same shelf.
//
// The three added books are not three more of the same thing. Each does a job
// the unit's own material already asks for, and the unit is where each one
// comes from:
//
//   book 3  the unit's RHYME or song, acted out          (reading 3)
//   book 4  the unit's SHARED-READING frame, filled in   (reading 2)
//   book 5  a second fable in the animal storyworld      (the unit's theme)
//
// So a unit shelf now reads as five different KINDS of book rather than five
// stories: a fable, the child's own day, a rhyme to say out loud, a look-and-
// point page of the unit's words, and one more fable. Book four is the one
// carrying the vocabulary revision — its pages are the unit's own sentence
// frames ("This is a ___. It is ___.") with the unit's own words in the gaps.
//
// Nothing here is invented where the unit says something. The cast is the
// Year 1 passages' own — Amal, Adam, Samira, Leo, Hodan, baby Idris, Ayeeyo,
// Grandpa, Miss Yasmin, Omar the shopkeeper, Faduma the doctor — and the animal
// books keep Musa, Kiki, Duku, Koko the hen, Miss Twiga and Lulu exactly as the
// first two books drew them. The rhymes are the ones printed in the units.
//
// Usage: node tools/create-grade1-shelf-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  W, writeBooks,
  // scenes
  basicScene, nightScene, townScene, streetScene, gardenScene, coastScene,
  plainRoomScene, roomScene, villageScene, amalClassroom, homeWall,
  // savanna cast and scenery
  zebra, giraffe, elephant, ostrich, monkey, kiki, donkey, hen, goat, chick, wildBird, lulu,
  acacia, tallGrass, puddle, fallenBranch, lake, sailboat, fish,
  bench, chalkboard, schoolBell, baobabHome, mango, bigFlower, bigLeaf, nest,
  barn, fence, haystack, seedRow, carrot, dustPuffs, confetti, rain, rainbow, splashArcs,
  cityBuildings, marketStall, lampPost, clockTower, flatStone, thoughtBubble,
  // people and their things
  figureA, babyIdris,
  schoolTable, schoolChair, abcChart, wallClock, pencilProp, crayonProp, colourBall, schoolFront,
  closedBook, openBook, childDrawing, bedProp, foodBowl, cupOfMilk, fruitProp, basketOf,
  grassMat, shapePicture, scissorsProp, cow, sheep, eggProp, tractorProp, seedBowl,
  spicePot, breadLoaf, sensePanel, pictureCard,
  bicycleProp, carProp, busStop, trafficLights, townBus, undergroundTrain, helicopterProp,
  villageWell, waterPot, dryGrass, learningFolder, madeBook,
  shopRow, libraryBuilding, hospital, crossing, litterBits, recycleBin, house,
  colourChart, rulerProp, shapeTile, seaTurtle, bunting, easel, motionArcs, wateringCan,
  // the Grade 1 shelf additions
  lunchboxProp, doorProp, rabbitProp, duckProp, frogProp, puppyProp,
  crownProp, clownHatProp, capeProp, maskProp, paperChain, vegProp,
  drumProp, keyboardProp, violinProp, planeProp, whaleProp, crocodileProp,
  countRow, wordTile, songNotes,
  A1,
} = require("./lib/ehel-ebook-kit-grade1-shelf.js");

// A page is a scene plus the things standing in it, in back-to-front order.
const page = (...parts) => parts.join("");

// The ground line each scene puts under a standing figure. Named once so a
// child and a table on the same page share a floor. Same four the Amal series
// uses — these books are set in the same rooms.
const CLASS_FLOOR = 930;
const HOME_FLOOR = 940;
const OUT_FLOOR = 900;
const VILLAGE_FLOOR = 930;

// ================================================================ UNIT 1
// Welcome to School — classroom objects, colours, people at school, action words

// ---------------------------------------------------------------- 1.3 Hello, School!

const helloSchool = [
  page(amalClassroom(), bunting(420, 96, 0.82), songNotes(1300, 240, 0.9),
    figureA("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1010, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1250, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    schoolTable(400, CLASS_FLOOR, 1.2, { item: openBook(0, 0, 0.55) }),
    figureA("yasmin", { x: 760, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 1080, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureA("leo", { x: 1300, y: CLASS_FLOOR, s: 1.3, mood: "happy" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 480, y: CLASS_FLOOR, s: 1.62, arms: "point" }),
    figureA("amal", { x: 900, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureA("samira", { x: 1140, y: CLASS_FLOOR, s: 1.44 })),

  page(townScene(), schoolFront(1100, 760, 0.95), schoolBell(400, 860, 0.9),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 840, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    schoolTable(950, CLASS_FLOOR, 1.3), schoolChair(1300, CLASS_FLOOR, 1.25),
    figureA("amal", { x: 480, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 900, y: CLASS_FLOOR, s: 1.62, arms: "point" }),
    figureA("adam", { x: 1240, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(),
    schoolTable(1080, CLASS_FLOOR, 1.4, { item: `${openBook(-70, 0, 0.55)}${crayonProp(80, -22, 0.34)}` }),
    figureA("samira", { x: 620, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(amalClassroom(), bunting(420, 96, 0.82), songNotes(1330, 250, 0.85),
    figureA("amal", { x: 660, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 900, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1120, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1320, y: CLASS_FLOOR, s: 1.3, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    figureA("adam", { x: 760, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("amal", { x: 1060, y: CLASS_FLOOR, s: 1.48, mood: "surprised" })),

  page(amalClassroom(), songNotes(420, 260, 1), songNotes(1280, 220, 0.8),
    figureA("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 780, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1010, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1230, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    figureA("leo", { x: 820, y: CLASS_FLOOR, s: 1.34, mood: "happy", arms: "up" }),
    figureA("amal", { x: 1090, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureA("adam", { x: 1310, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(880, 320, 1.1),
    figureA("yasmin", { x: 380, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureA("amal", { x: 720, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 960, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1180, y: CLASS_FLOOR, s: 1.45, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1380, y: CLASS_FLOOR, s: 1.3, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 1.4 Find Something Green

const findSomethingGreen = [
  page(plainRoomScene(), colourChart(940, 330, 1.9),
    schoolTable(1300, CLASS_FLOOR, 1.3, { item: closedBook(0, -46, 0.44, { colour: A1.red }) }),
    figureA("amal", { x: 520, y: CLASS_FLOOR, s: 1.58, mood: "happy", arms: "point" }),
    colourBall(830, 880, 0.6, A1.orange)),

  page(amalClassroom(),
    figureA("yasmin", { x: 520, y: CLASS_FLOOR, s: 1.62, arms: "point" }),
    figureA("amal", { x: 900, y: CLASS_FLOOR, s: 1.48, mood: "surprised" }),
    figureA("adam", { x: 1140, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: closedBook(0, -46, 0.5, { colour: A1.red }) }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: pencilProp(0, -40, 0.4, { colour: A1.blue }) }),
    figureA("adam", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: crayonProp(0, -30, 0.44, { colour: A1.green }) }),
    figureA("samira", { x: 560, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    lunchboxProp(1180, 880, 0.9, { colour: A1.yellow, open: true }),
    figureA("leo", { x: 620, y: CLASS_FLOOR, s: 1.34, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    colourBall(1160, 870, 0.8, A1.orange),
    figureA("amal", { x: 580, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1140, CLASS_FLOOR, 1.4, { item: rulerProp(0, -30, 0.6, { rotate: -8 }) }),
    figureA("adam", { x: 580, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    figureA("samira", { x: 620, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureA("amal", { x: 900, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(amalClassroom(),
    figureA("leo", { x: 900, y: CLASS_FLOOR, s: 1.34, mood: "happy", arms: "point" }),
    figureA("yasmin", { x: 1240, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),

  page(amalClassroom(),
    schoolTable(1140, CLASS_FLOOR, 1.4), schoolChair(1440, CLASS_FLOOR, 1.25),
    figureA("amal", { x: 620, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), colourChart(1000, 340, 1.7), confetti(500, 300, 0.9),
    figureA("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 1.5 The Lost Blue Crayon

const theLostBlueCrayon = [
  page(basicScene(), acacia(1180, 600, 1.35), chalkboard(1160, 840, 0.95), schoolBell(360, 850, 0.95),
    giraffe({ x: 640, y: 630, s: 0.9, glasses: true }),
    elephant({ x: 1440, y: 760, s: 0.6 }),
    ostrich({ x: 900, y: 740, s: 0.55 }),
    kiki({ x: 470, y: 800, s: 1.25, arms: "up" })),

  page(basicScene(), acacia(1360, 620, 1.05), chalkboard(1300, 840, 0.9), bench(700, 900, 1.2),
    kiki({ x: 500, y: 800, s: 1.2, mood: "happy" }),
    crayonProp(880, 850, 0.6, { colour: A1.red }), crayonProp(1030, 860, 0.6, { colour: A1.green }),
    crayonProp(1180, 850, 0.6, { colour: A1.yellow })),

  page(basicScene(), acacia(240, 630, 1), bench(1180, 900, 1.2),
    kiki({ x: 700, y: 800, s: 1.25, mood: "sad" })),

  page(basicScene(), acacia(1400, 630, 1),
    giraffe({ x: 900, y: 620, s: 1.02, glasses: true, bend: true }),
    kiki({ x: 460, y: 800, s: 1.2, mood: "sad" })),

  page(basicScene(), acacia(1380, 640, 1), bench(560, 900, 1.3),
    elephant({ x: 900, y: 750, s: 0.85, trunkUp: true, mood: "surprised" }),
    bigFlower(430, 880, 1.1),
    kiki({ x: 1220, y: 810, s: 1.05 })),

  page(basicScene(), chalkboard(420, 800, 1.25),
    ostrich({ x: 900, y: 730, s: 0.72, mood: "surprised" }),
    seedBowl(1200, 880, 0.7),
    kiki({ x: 1400, y: 810, s: 1 })),

  page(basicScene(), acacia(1240, 620, 1.25),
    zebra({ x: 780, y: 690, s: 1.08, mood: "surprised" }),
    flatStone(430, 890, 1.2),
    kiki({ x: 1380, y: 815, s: 0.95 })),

  page(basicScene(), acacia(250, 640, 1), bench(1150, 900, 1.2),
    mango(760, 850, 1.2), mango(820, 870, 0.95),
    kiki({ x: 560, y: 800, s: 1.25, mood: "surprised" })),

  page(basicScene(), acacia(1400, 630, 0.95), bench(1120, 900, 1.2),
    bigFlower(420, 890, 0.95), flatStone(620, 900, 1), mango(760, 880, 0.95),
    kiki({ x: 980, y: 800, s: 1.2, mood: "sad" })),

  page(basicScene(), acacia(1150, 600, 1.4),
    elephant({ x: 760, y: 750, s: 0.9, trunkUp: true, mood: "surprised", arms: "up" }),
    kiki({ x: 420, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(900, 590, 1.5), nest(880, 486, 2.1),
    crayonProp(880, 476, 0.38, { colour: A1.blue }),
    wildBird(1180, 470, 1.15, true),
    kiki({ x: 480, y: 800, s: 1.2, mood: "happy", arms: "up" }),
    elephant({ x: 1300, y: 770, s: 0.7, trunkUp: true })),

  page(basicScene(), acacia(1300, 620, 1.1), chalkboard(1260, 850, 0.85), confetti(760, 340, 1),
    giraffe({ x: 380, y: 630, s: 0.92, glasses: true }),
    kiki({ x: 800, y: 800, s: 1.25, mood: "happy", arms: "up" }),
    ostrich({ x: 1060, y: 740, s: 0.6 }),
    elephant({ x: 1480, y: 780, s: 0.6, trunkUp: true })),
];

// ================================================================ UNIT 2
// Family Time — family members, breakfast, numbers to ten, family actions

// ---------------------------------------------------------------- 2.3 Some Families Are Big

const someFamiliesAreBig = [
  page(homeWall(),
    figureA("hana", { x: 320, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("grandpa", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("mum", { x: 800, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 1020, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    figureA("adam", { x: 1220, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    babyIdris(1420, HOME_FLOOR, 1.15)),

  page(homeWall(),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("hodan", { x: 980, y: HOME_FLOOR, s: 1.38, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 400, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("mum", { x: 660, y: HOME_FLOOR, s: 1.52 }),
    figureA("dad", { x: 900, y: HOME_FLOOR, s: 1.52 }),
    figureA("adam", { x: 1120, y: HOME_FLOOR, s: 1.4 }),
    figureA("hodan", { x: 1300, y: HOME_FLOOR, s: 1.36 }),
    figureA("hana", { x: 1480, y: HOME_FLOOR, s: 1.46 })),

  page(homeWall(),
    figureA("amal", { x: 720, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("mum", { x: 1010, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("mum", { x: 900, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    babyIdris(1160, HOME_FLOOR, 1.2)),

  page(plainRoomScene(), countRow(950, 430, 1.3, { from: 1, count: 3 }),
    figureA("amal", { x: 460, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), countRow(950, 430, 1.3, { from: 4, count: 3 }),
    figureA("amal", { x: 420, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), countRow(950, 430, 1.15, { from: 7, count: 4 }),
    figureA("hana", { x: 380, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureA("grandpa", { x: 1420, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 720, y: HOME_FLOOR, s: 1.5, arms: "point" }),
    figureA("mum", { x: 1040, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(),
    figureA("mum", { x: 660, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("amal", { x: 960, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(), songNotes(1180, 260, 0.85),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 800, y: HOME_FLOOR, s: 1.42, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 1010, y: HOME_FLOOR, s: 1.38, mood: "happy", arms: "up" })),

  page(homeWall(), confetti(820, 300, 0.9),
    figureA("hana", { x: 360, y: HOME_FLOOR, s: 1.48, mood: "happy" }),
    figureA("mum", { x: 600, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 840, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1060, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    figureA("dad", { x: 1280, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    babyIdris(1470, HOME_FLOOR, 1.12)),
];

// ---------------------------------------------------------------- 2.4 Who Is in My Family?

const whoIsInMyFamily = [
  page(homeWall(),
    figureA("amal", { x: 480, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("mum", { x: 760, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("dad", { x: 1000, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("hana", { x: 1240, y: HOME_FLOOR, s: 1.46, mood: "happy" }),
    babyIdris(1450, HOME_FLOOR, 1.12)),

  page(homeWall(),
    figureA("mum", { x: 1000, y: HOME_FLOOR, s: 1.62, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, arms: "point" })),

  page(homeWall(),
    figureA("dad", { x: 1000, y: HOME_FLOOR, s: 1.62, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, arms: "point" })),

  page(homeWall(),
    figureA("adam", { x: 1000, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, arms: "point" })),

  page(homeWall(),
    figureA("hodan", { x: 1000, y: HOME_FLOOR, s: 1.44, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, arms: "point" })),

  page(homeWall(), bedProp(1180, 900, 0.85),
    babyIdris(880, HOME_FLOOR, 1.35),
    figureA("amal", { x: 500, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(),
    figureA("hana", { x: 1000, y: HOME_FLOOR, s: 1.56, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, arms: "point" })),

  page(homeWall(),
    figureA("grandpa", { x: 1000, y: HOME_FLOOR, s: 1.56, mood: "happy" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, arms: "point" })),

  page(homeWall(),
    foodBowl(560, 760, 0.62), cupOfMilk(760, 790, 0.5),
    figureA("mum", { x: 1020, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("amal", { x: 1280, y: HOME_FLOOR, s: 1.46, mood: "happy" })),

  page(homeWall(),
    basketOf(500, 830, 0.6, { inner: fruitProp(0, 0, 0.42, "banana") }),
    foodBowl(880, 800, 0.6), cupOfMilk(1120, 820, 0.48),
    figureA("amal", { x: 1360, y: HOME_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(homeWall(),
    foodBowl(1080, 800, 0.58), cupOfMilk(1290, 820, 0.46),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("hodan", { x: 880, y: HOME_FLOOR, s: 1.38, mood: "happy" })),

  page(homeWall(), countRow(1180, 560, 0.9, { from: 4, count: 4 }),
    figureA("amal", { x: 400, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 640, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    figureA("hodan", { x: 850, y: HOME_FLOOR, s: 1.38, mood: "happy" })),
];

// ---------------------------------------------------------------- 2.5 Ten Little Eggs

const tenLittleEggs = [
  page(basicScene(), barn(1220, 700, 1.1), fence(400, 880, 1, 3),
    eggProp(820, 880, 0.8, { count: 4 }),
    hen({ x: 620, y: 822, s: 1.15 }),
    chick(980, 890, 1), chick(1060, 900, 0.95)),

  page(basicScene(), barn(1280, 710, 1.05), haystack(320, 880, 1),
    eggProp(900, 870, 0.95, { count: 5 }),
    hen({ x: 620, y: 814, s: 1.2 })),

  page(basicScene(), barn(1300, 710, 1),
    eggProp(920, 870, 0.9, { count: 4 }),
    hen({ x: 620, y: 822, s: 1.15, mood: "surprised" }),
    chick(1200, 890, 1.05)),

  page(basicScene(), barn(1320, 715, 1), haystack(300, 890, 0.9),
    eggProp(900, 870, 0.85, { count: 4 }),
    hen({ x: 600, y: 829, s: 1.1 }),
    chick(1180, 890, 1), chick(1270, 900, 0.95)),

  page(basicScene(), barn(1330, 715, 0.95), fence(280, 880, 0.9, 3),
    eggProp(880, 875, 0.8, { count: 3 }),
    hen({ x: 580, y: 835, s: 1.05 }),
    chick(1120, 890, 1), chick(1200, 900, 0.95), chick(1280, 890, 1), chick(1360, 900, 0.9)),

  page(basicScene(), barn(1340, 715, 0.9),
    donkey({ x: 620, y: 700, s: 1.05, mood: "surprised" }),
    hen({ x: 1050, y: 835, s: 0.95 }),
    chick(1200, 890, 1), chick(1280, 900, 0.95), chick(1360, 890, 1)),

  page(basicScene(), barn(1340, 715, 0.9), haystack(280, 890, 0.85),
    eggProp(860, 880, 0.7, { count: 2 }),
    hen({ x: 560, y: 835, s: 1 }),
    chick(1060, 890, 0.95), chick(1140, 900, 0.9), chick(1220, 890, 0.95),
    chick(1300, 900, 0.9), chick(1380, 890, 0.95), chick(1460, 900, 0.85)),

  page(basicScene(), barn(1340, 715, 0.9),
    eggProp(880, 880, 0.6, { count: 1 }),
    hen({ x: 580, y: 835, s: 1 }),
    chick(1080, 890, 0.95), chick(1160, 900, 0.9), chick(1240, 890, 0.95),
    chick(1320, 900, 0.9), chick(1400, 890, 0.95)),

  page(basicScene(), barn(1300, 715, 0.95), haystack(1500, 890, 0.85),
    eggProp(880, 875, 0.75, { count: 1 }),
    hen({ x: 560, y: 822, s: 1.15, mood: "sad" })),

  page(basicScene(), barn(1330, 715, 0.9),
    eggProp(820, 875, 0.7, { count: 1 }),
    donkey({ x: 400, y: 705, s: 0.95 }),
    goat({ x: 1150, y: 770, s: 0.85, flip: true }),
    hen({ x: 640, y: 835, s: 0.95, mood: "sad" }),
    chick(1330, 895, 0.85), chick(1420, 900, 0.8)),

  page(basicScene(), barn(1320, 710, 0.95), confetti(820, 330, 1),
    hen({ x: 560, y: 822, s: 1.15, mood: "happy" }),
    chick(820, 880, 1), chick(900, 895, 0.95), chick(980, 880, 1),
    chick(1060, 895, 0.95), chick(1140, 880, 1), chick(1220, 895, 0.9)),

  page(basicScene(), barn(1280, 705, 1), fence(360, 880, 0.95, 3), rainbow(820, 560),
    hen({ x: 640, y: 814, s: 1.2, mood: "happy" }),
    chick(900, 880, 1), chick(980, 895, 0.95), chick(1060, 880, 1),
    chick(1140, 895, 0.95), chick(1220, 880, 1)),
];

// ================================================================ UNIT 3
// Fun and Games — action words, body parts, positions, the story animals

// ---------------------------------------------------------------- 3.3 Wind the Bobbin Up

const windTheBobbinUp = [
  page(amalClassroom(), bunting(420, 96, 0.82), songNotes(1310, 250, 0.9),
    figureA("yasmin", { x: 420, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 780, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1020, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1240, y: CLASS_FLOOR, s: 1.32, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 480, y: CLASS_FLOOR, s: 1.6, arms: "up" }),
    figureA("amal", { x: 840, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 1080, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureA("samira", { x: 1300, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(), motionArcs(1120, 620, 1),
    figureA("amal", { x: 700, y: CLASS_FLOOR, s: 1.54, mood: "happy" }),
    figureA("samira", { x: 1060, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(), motionArcs(560, 620, 1, { flip: true }),
    figureA("adam", { x: 860, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "down" }),
    figureA("amal", { x: 1140, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(amalClassroom(), songNotes(1300, 280, 0.8),
    figureA("amal", { x: 720, y: CLASS_FLOOR, s: 1.52, mood: "happy" }),
    figureA("leo", { x: 1000, y: CLASS_FLOOR, s: 1.34, mood: "happy" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 500, y: CLASS_FLOOR, s: 1.6, arms: "up" }),
    figureA("amal", { x: 880, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1140, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("samira", { x: 1080, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    figureA("adam", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("leo", { x: 1000, y: CLASS_FLOOR, s: 1.34, mood: "happy", arms: "point" })),

  page(amalClassroom(), doorProp(1150, CLASS_FLOOR, 0.85),
    figureA("amal", { x: 520, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" }),
    figureA("adam", { x: 800, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(amalClassroom(), songNotes(400, 270, 0.85),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureA("samira", { x: 1020, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureA("leo", { x: 1240, y: CLASS_FLOOR, s: 1.32, mood: "happy" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 460, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 820, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 1080, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(900, 320, 1), songNotes(1340, 240, 0.85),
    figureA("leo", { x: 520, y: CLASS_FLOOR, s: 1.36, mood: "happy", arms: "up" }),
    figureA("amal", { x: 800, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1050, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1270, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 3.4 Touch Your Toes

const touchYourToes = [
  page(gardenScene(), colourBall(1180, 870, 0.85, A1.red), motionArcs(940, 640, 1),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.58, mood: "happy", arms: "up" })),

  page(gardenScene(), colourBall(1120, 860, 0.8, A1.red), motionArcs(900, 630, 0.9),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.55, mood: "happy" })),

  page(gardenScene(), colourBall(1180, 890, 0.75, A1.red),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.55, mood: "happy" }),
    figureA("adam", { x: 880, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(), colourBall(980, 700, 0.7, A1.red), motionArcs(760, 620, 0.9),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1220, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1020, y: OUT_FLOOR, s: 1.38, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureA("amal", { x: 680, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "point" }),
    figureA("adam", { x: 1000, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(gardenScene(),
    figureA("samira", { x: 660, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "point" }),
    figureA("amal", { x: 980, y: OUT_FLOOR, s: 1.58, mood: "happy", arms: "point" })),

  page(gardenScene(),
    figureA("amal", { x: 720, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1060, y: OUT_FLOOR, s: 1.38, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureA("adam", { x: 660, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("amal", { x: 980, y: OUT_FLOOR, s: 1.58, mood: "happy", arms: "point" })),

  page(gardenScene(), motionArcs(1300, 700, 0.9),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.6, mood: "surprised", arms: "point" }),
    figureA("samira", { x: 1040, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(gardenScene(), dustPuffs(820, 900), motionArcs(1180, 620, 0.9),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("adam", { x: 940, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1200, y: OUT_FLOOR, s: 1.38, mood: "happy", arms: "up" })),

  page(gardenScene(), confetti(880, 340, 1), colourBall(1360, 880, 0.7, A1.red),
    figureA("amal", { x: 760, y: OUT_FLOOR, s: 1.62, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1080, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 3.5 Where Is the Ball?

const whereIsTheBall = [
  page(basicScene(), acacia(1240, 610, 1.3), bench(430, 900, 1.1),
    colourBall(830, 860, 0.85, A1.red),
    kiki({ x: 620, y: 800, s: 1.22, mood: "happy", arms: "up" }),
    goat({ x: 1120, y: 770, s: 0.85, flip: true }),
    duckProp(1420, 900, 0.85, { flip: true })),

  page(basicScene(), acacia(1360, 620, 1.05), tallGrass(300, 920, 1.3),
    kiki({ x: 780, y: 800, s: 1.25, mood: "sad" })),

  page(basicScene(), acacia(280, 630, 1), bench(1080, 900, 1.3),
    wildBird(1080, 810, 1.15),
    kiki({ x: 600, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(1120, 600, 1.45),
    rabbitProp(1130, 895, 0.95),
    kiki({ x: 520, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), lake(1150, 860, 340, 70),
    duckProp(1130, 830, 1),
    kiki({ x: 520, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), tallGrass(1180, 930, 1.5), tallGrass(1340, 900, 1.2),
    frogProp(1120, 900, 1),
    kiki({ x: 560, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(240, 640, 1),
    elephant({ x: 980, y: 750, s: 0.95, trunkUp: true, mood: "sad" }),
    kiki({ x: 500, y: 805, s: 1.1 })),

  page(basicScene(), acacia(1420, 630, 1),
    goat({ x: 880, y: 770, s: 1, mood: "sad" }),
    kiki({ x: 480, y: 805, s: 1.1 })),

  page(basicScene(), acacia(1300, 620, 1.1), tallGrass(280, 920, 1.2),
    chick(880, 871, 1.7, "surprised"),
    kiki({ x: 520, y: 800, s: 1.15, mood: "surprised" })),

  page(basicScene(), acacia(260, 630, 1.05),
    colourBall(980, 880, 0.8, A1.red),
    chick(980, 800, 1.5, "happy"),
    kiki({ x: 620, y: 800, s: 1.2, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1340, 620, 1.05), dustPuffs(900, 900),
    colourBall(1020, 880, 0.75, A1.red),
    chick(1020, 805, 1.3, "happy"),
    kiki({ x: 560, y: 800, s: 1.2, mood: "happy" }),
    goat({ x: 1300, y: 775, s: 0.8, flip: true, mood: "happy" })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 340, 1), motionArcs(1080, 660, 0.9),
    colourBall(900, 700, 0.7, A1.red),
    kiki({ x: 520, y: 800, s: 1.22, mood: "happy", arms: "up" }),
    elephant({ x: 1380, y: 760, s: 0.7, trunkUp: true }),
    rabbitProp(760, 900, 0.8), duckProp(1120, 900, 0.75, { flip: true })),
];

// ================================================================ UNIT 4
// Making Things — shapes, colours, clothes and costumes, making words

// ---------------------------------------------------------------- 4.3 Party Time, Look at Me

const partyTimeLookAtMe = [
  page(amalClassroom(), bunting(420, 96, 0.82), paperChain(1200, 150, 0.8),
    crownProp(1330, 800, 0.85),
    figureA("amal", { x: 620, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("adam", { x: 900, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureA("samira", { x: 1120, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82),
    schoolTable(1180, CLASS_FLOOR, 1.45, { item: `${crownProp(-90, -60, 0.42)}${maskProp(90, -50, 0.42)}` }),
    figureA("yasmin", { x: 520, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 840, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(amalClassroom(), paperChain(1200, 150, 0.8),
    figureA("amal", { x: 780, y: CLASS_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1120, y: CLASS_FLOOR, s: 1.36, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    clownHatProp(1240, 800, 0.9, { colour: A1.purple }),
    figureA("adam", { x: 700, y: CLASS_FLOOR, s: 1.52, mood: "sad", arms: "point" }),
    figureA("amal", { x: 980, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(amalClassroom(),
    crownProp(1240, 790, 0.95, { colour: "#c9c3b4" }),
    figureA("samira", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("adam", { x: 990, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(),
    schoolTable(1160, CLASS_FLOOR, 1.45, { item: `${crownProp(0, -66, 0.5)}${scissorsProp(150, -40, 0.3)}` }),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(amalClassroom(),
    capeProp(1220, 720, 0.95, { colour: A1.red }),
    figureA("leo", { x: 700, y: CLASS_FLOOR, s: 1.4, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    maskProp(1200, 720, 1.05, { colour: A1.green }),
    figureA("hodan", { x: 700, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(), paperChain(1200, 150, 0.9),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 820, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1060, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(amalClassroom(), bunting(420, 96, 0.82),
    crownProp(1260, 800, 0.8),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    clownHatProp(1180, 810, 0.7), crownProp(1400, 810, 0.6, { colour: "#c9c3b4" }),
    figureA("adam", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("amal", { x: 900, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82), paperChain(1200, 150, 0.8), confetti(880, 330, 1.05),
    figureA("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 740, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 980, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1200, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1400, y: CLASS_FLOOR, s: 1.34, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 4.4 Shapes I Can Cut

const shapesICanCut = [
  page(amalClassroom(),
    easel(1230, 780, 0.9, { inner: shapePicture(0, -40, 0.5) }),
    figureA("amal", { x: 620, y: CLASS_FLOOR, s: 1.56, mood: "happy", arms: "point" })),

  page(plainRoomScene(), wordTile(1100, 440, 0.9, { inner: shapeTile(0, 0, 1.5, "square", A1.red), tint: A1.red }),
    figureA("amal", { x: 520, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), wordTile(1100, 440, 0.9, { inner: shapeTile(0, 0, 1.5, "circle", A1.blue), tint: A1.blue }),
    figureA("amal", { x: 520, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), wordTile(1100, 440, 0.9, { inner: shapeTile(0, 0, 1.5, "triangle", A1.green), tint: A1.green }),
    figureA("adam", { x: 520, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), wordTile(1100, 440, 0.9, { inner: shapeTile(0, 0, 1.5, "rectangle", A1.yellow), tint: A1.yellow }),
    figureA("samira", { x: 520, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1120, CLASS_FLOOR, 1.45, { item: scissorsProp(0, -80, 0.62) }),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(amalClassroom(),
    schoolTable(1140, CLASS_FLOOR, 1.45, { item: shapePicture(0, -96, 0.55) }),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(),
    wordTile(760, 440, 0.7, { inner: shapeTile(0, 0, 1.2, "circle", A1.blue), tint: A1.blue }),
    wordTile(1060, 440, 0.7, { inner: shapeTile(0, 0, 1.2, "circle", A1.blue), tint: A1.blue }),
    wordTile(1360, 440, 0.7, { inner: shapeTile(0, 0, 1.2, "triangle", A1.green), tint: A1.green }),
    figureA("amal", { x: 400, y: CLASS_FLOOR, s: 1.52, mood: "surprised", arms: "point" })),

  page(amalClassroom(),
    clownHatProp(1220, 810, 0.85, { colour: A1.orange }),
    figureA("leo", { x: 700, y: CLASS_FLOOR, s: 1.4, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.6 }),
    grassMat(1120, 880, 0.85, { neat: true, laid: true }),
    figureA("hana", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 980, y: VILLAGE_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(),
    childDrawing(1220, 780, 0.9),
    figureA("adam", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "surprised" }),
    figureA("amal", { x: 990, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(villageScene({ treeX: 1350, treeScale: 1.5 }), confetti(760, 330, 0.95),
    grassMat(1080, 880, 0.8, { neat: true, laid: true }),
    figureA("hana", { x: 520, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 800, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 4.5 Higgledy Piggledy, My Black Hen

const higgledyPiggledy = [
  page(basicScene(), barn(1240, 700, 1.1), fence(380, 880, 1, 3),
    eggProp(880, 880, 0.85, { count: 3 }),
    hen({ x: 640, y: 814, s: 1.2 }),
    donkey({ x: 1180, y: 700, s: 0.95 })),

  page(basicScene(), barn(1320, 710, 1), haystack(300, 890, 0.9),
    donkey({ x: 760, y: 700, s: 1.15, mood: "happy" }),
    hen({ x: 1180, y: 835, s: 0.95 })),

  page(basicScene(), barn(1300, 710, 1),
    hen({ x: 820, y: 792, s: 1.35 }),
    donkey({ x: 380, y: 705, s: 0.9 })),

  page(basicScene(), barn(1280, 705, 1.05), fence(340, 880, 0.9, 3),
    eggProp(900, 875, 0.95, { count: 4 }),
    hen({ x: 620, y: 829, s: 1.1 })),

  page(basicScene(), barn(1320, 710, 1), haystack(280, 890, 0.85),
    eggProp(880, 875, 0.85, { count: 5 }),
    hen({ x: 600, y: 832, s: 1.05 }),
    goat({ x: 1160, y: 772, s: 0.8, flip: true, mood: "surprised" })),

  page(basicScene(), barn(1340, 712, 0.95),
    eggProp(920, 878, 0.8, { count: 4 }),
    donkey({ x: 560, y: 700, s: 1.05, mood: "surprised" }),
    hen({ x: 1180, y: 838, s: 0.9 })),

  page(basicScene(), barn(1330, 712, 0.95), fence(300, 880, 0.85, 3),
    eggProp(900, 875, 0.9, { count: 5 }),
    goat({ x: 620, y: 770, s: 1, mood: "surprised" }),
    hen({ x: 1200, y: 838, s: 0.9 })),

  page(basicScene(), barn(1310, 710, 1), haystack(1500, 890, 0.8),
    eggProp(860, 878, 0.85, { count: 4 }),
    hen({ x: 580, y: 829, s: 1.1 }),
    donkey({ x: 1160, y: 702, s: 0.95 })),

  page(basicScene(), barn(1330, 712, 0.95),
    goat({ x: 900, y: 770, s: 1.05, mood: "surprised" }),
    hen({ x: 520, y: 832, s: 1.05 }),
    donkey({ x: 1300, y: 705, s: 0.85 })),

  page(basicScene(), barn(1300, 710, 1), fence(320, 880, 0.9, 3),
    eggProp(1120, 878, 0.75, { count: 5 }),
    hen({ x: 700, y: 807, s: 1.25, mood: "happy" })),

  page(basicScene(), acacia(1400, 630, 1), haystack(340, 890, 0.9),
    donkey({ x: 820, y: 700, s: 1.2, mood: "happy" }),
    hen({ x: 1200, y: 838, s: 0.9, mood: "happy" })),

  page(basicScene(), barn(1260, 705, 1.05), confetti(820, 330, 1),
    donkey({ x: 560, y: 700, s: 1.05, mood: "happy" }),
    hen({ x: 950, y: 829, s: 1.1, mood: "happy" }),
    goat({ x: 1420, y: 772, s: 0.85, flip: true, mood: "happy" }),
    chick(1120, 890, 0.9), chick(1200, 900, 0.85)),
];

// ================================================================ UNIT 5
// On the Farm — farm animals, animal sounds, farm places, activities, vegetables

// ---------------------------------------------------------------- 5.3 Hello to the Farm

const helloToTheFarm = [
  page(basicScene(), barn(1250, 700, 1.15), fence(360, 880, 1, 3), songNotes(1000, 330, 0.9),
    cow(940, 880, 0.62),
    figureA("amal", { x: 600, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    hen({ x: 1180, y: 838, s: 0.75 })),

  page(basicScene(), barn(1300, 705, 1.05), haystack(300, 890, 0.95),
    figureA("grandpa", { x: 720, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 1000, y: VILLAGE_FLOOR, s: 1.42, mood: "happy" })),

  page(basicScene(), barn(1320, 710, 1),
    figureA("grandpa", { x: 820, y: VILLAGE_FLOOR, s: 1.56, mood: "happy", arms: "up" }),
    figureA("amal", { x: 1120, y: VILLAGE_FLOOR, s: 1.42, mood: "happy", arms: "point" })),

  page(basicScene(), barn(340, 700, 1),
    tractorProp(1080, 890, 0.85),
    figureA("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(basicScene(), barn(1240, 700, 1.15), fence(400, 880, 0.95, 3),
    cow(880, 880, 0.7), cow(1180, 895, 0.55, { flip: true }),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "up" })),

  page(basicScene(), seedRow(880, 890, 1.2), fence(300, 870, 0.85, 3),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("grandpa", { x: 1240, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(basicScene(), barn(1300, 705, 1),
    hen({ x: 640, y: 832, s: 1.05 }),
    chick(880, 890, 1), chick(960, 900, 0.95), chick(1040, 890, 1),
    figureA("amal", { x: 420, y: VILLAGE_FLOOR, s: 1.42, mood: "happy", arms: "up" })),

  page(basicScene(), barn(1280, 700, 1.1), songNotes(1060, 320, 0.95), confetti(820, 340, 0.9),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("grandpa", { x: 900, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(basicScene(), barn(1300, 705, 1), seedRow(560, 895, 0.9),
    figureA("grandpa", { x: 820, y: VILLAGE_FLOOR, s: 1.52, arms: "point" }),
    figureA("amal", { x: 1120, y: VILLAGE_FLOOR, s: 1.42, mood: "happy" })),

  page(basicScene(), barn(1260, 700, 1.1), seedRow(760, 900, 1),
    eggProp(1080, 890, 0.6, { count: 2 }),
    figureA("amal", { x: 480, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(basicScene(), haystack(1200, 880, 1.15), fence(320, 870, 0.9, 3),
    figureA("grandpa", { x: 700, y: VILLAGE_FLOOR, s: 1.52, arms: "up" }),
    figureA("amal", { x: 980, y: VILLAGE_FLOOR, s: 1.44, mood: "surprised" })),

  page(basicScene(), barn(1240, 700, 1.15), songNotes(1060, 300, 1), confetti(800, 330, 1),
    cow(980, 885, 0.6),
    hen({ x: 1240, y: 840, s: 0.72 }),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("grandpa", { x: 800, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),
];

// ---------------------------------------------------------------- 5.4 Who Says Moo?

const whoSaysMoo = [
  page(basicScene(), barn(1280, 700, 1.1), fence(380, 880, 1, 3),
    cow(900, 880, 0.68),
    hen({ x: 1160, y: 838, s: 0.75 }),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1320, 710, 1),
    cow(880, 878, 0.85),
    figureA("amal", { x: 460, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1330, 712, 0.95), haystack(300, 890, 0.85),
    hen({ x: 900, y: 800, s: 1.3 }),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1330, 712, 0.95),
    chick(880, 878, 1.6, "happy"), chick(1030, 895, 1.3), chick(1160, 880, 1.2),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), lake(1120, 880, 320, 66), barn(1400, 715, 0.85),
    duckProp(1060, 850, 1.15),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1340, 712, 0.9), fence(300, 875, 0.85, 3),
    sheep(940, 880, 0.9),
    figureA("amal", { x: 540, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), barn(340, 700, 1),
    tractorProp(1060, 890, 0.9), dustPuffs(820, 900),
    figureA("grandpa", { x: 720, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(basicScene(), barn(1300, 705, 1), seedBowl(1080, 890, 0.62),
    hen({ x: 880, y: 836, s: 0.9 }),
    chick(1180, 895, 0.9), chick(1260, 900, 0.85),
    figureA("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.48, mood: "happy" })),

  page(basicScene(), seedRow(1020, 895, 1.1), barn(300, 700, 0.9),
    seedBowl(880, 890, 0.66),
    figureA("grandpa", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(basicScene(), seedRow(700, 900, 1), fence(300, 870, 0.85, 3),
    carrot(1080, 880, 1.5), carrot(1200, 895, 1.3),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1320, 710, 0.95),
    basketOf(940, 890, 0.72, { inner: `${vegProp(-70, 10, 0.42, "onion")}${vegProp(70, 14, 0.42, "potato")}` }),
    fruitProp(1180, 870, 0.5, "tomato"),
    vegProp(1320, 880, 0.5, "beans"),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.45, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1260, 700, 1.1), confetti(820, 330, 0.95),
    cow(940, 882, 0.6),
    hen({ x: 1200, y: 840, s: 0.72 }),
    sheep(1420, 890, 0.6),
    figureA("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 5.5 Duku Plants a Row

const dukuPlantsARow = [
  page(basicScene(), barn(1260, 700, 1.1), fence(360, 880, 1, 3),
    seedBowl(900, 890, 0.75),
    donkey({ x: 620, y: 700, s: 1.15 }),
    hen({ x: 1180, y: 838, s: 0.85 })),

  page(basicScene(), barn(1320, 710, 1), haystack(300, 890, 0.9),
    seedBowl(1080, 890, 0.85),
    donkey({ x: 700, y: 700, s: 1.2 })),

  page(basicScene(), seedRow(1020, 900, 1.2), fence(300, 870, 0.85, 3),
    donkey({ x: 620, y: 700, s: 1.15 }),
    dustPuffs(880, 900)),

  page(basicScene(), seedRow(1000, 898, 1.15),
    seedBowl(700, 892, 0.6),
    donkey({ x: 480, y: 702, s: 1.05 })),

  page(basicScene(), seedRow(1060, 900, 1.1), barn(320, 700, 0.9),
    donkey({ x: 660, y: 700, s: 1.05 }),
    hen({ x: 1300, y: 840, s: 0.95, mood: "surprised" })),

  page(basicScene(), seedRow(1040, 900, 1.1), acacia(280, 630, 1),
    donkey({ x: 680, y: 700, s: 1.1 }),
    hen({ x: 1340, y: 840, s: 0.9 })),

  page(basicScene(true), rain(), seedRow(1000, 900, 1.15), puddle(560, 900, 210, 44),
    donkey({ x: 720, y: 700, s: 1.05 })),

  page(basicScene(), seedRow(1000, 900, 1.15), dryGrass(400, 890, 0.9),
    donkey({ x: 700, y: 700, s: 1.05 })),

  page(basicScene(), seedRow(1000, 898, 1.2),
    donkey({ x: 620, y: 700, s: 1.15, mood: "surprised" }),
    hen({ x: 1340, y: 840, s: 0.9, mood: "surprised" })),

  page(basicScene(), seedRow(1020, 898, 1.15),
    goat({ x: 1280, y: 772, s: 0.9, flip: true, mood: "sad" }),
    donkey({ x: 600, y: 700, s: 1.1, mood: "surprised" })),

  page(basicScene(), seedRow(1000, 900, 1.2),
    carrot(760, 880, 1.5), carrot(880, 890, 1.35),
    fruitProp(1200, 862, 0.5, "tomato"), vegProp(1360, 878, 0.52, "beans"),
    donkey({ x: 480, y: 702, s: 1.05, mood: "happy" })),

  page(basicScene(), rainbow(820, 560), seedRow(1020, 900, 1.15), confetti(760, 340, 0.9),
    basketOf(1300, 890, 0.6, { inner: `${carrot(-50, 20, 0.7)}${vegProp(60, 20, 0.34, "onion")}` }),
    donkey({ x: 560, y: 700, s: 1.15, mood: "happy" }),
    hen({ x: 900, y: 838, s: 0.9, mood: "happy" })),
];

// ================================================================ UNIT 6
// My Five Senses — the senses, body parts, describing words, comparing words

// ---------------------------------------------------------------- 6.3 Two Little Eyes

const twoLittleEyes = [
  page(homeWall(), sensePanel(980, 330, 0.56, "eye"),
    figureA("hana", { x: 480, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 800, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(homeWall(),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("hana", { x: 1020, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(plainRoomScene(), sensePanel(1160, 420, 0.72, "eye"),
    figureA("amal", { x: 540, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), sensePanel(1160, 420, 0.72, "ear"),
    figureA("amal", { x: 540, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), sensePanel(1160, 420, 0.72, "nose"),
    breadLoaf(600, 800, 0.42),
    figureA("amal", { x: 400, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(plainRoomScene(), sensePanel(1160, 420, 0.72, "tongue"),
    fruitProp(620, 790, 0.44, "banana"),
    figureA("amal", { x: 400, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(homeWall(),
    figureA("hana", { x: 1020, y: HOME_FLOOR, s: 1.56, arms: "point" }),
    figureA("amal", { x: 660, y: HOME_FLOOR, s: 1.5, mood: "surprised" })),

  page(homeWall(), sensePanel(980, 340, 0.5, "hand"),
    figureA("amal", { x: 720, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(homeWall(),
    figureA("hana", { x: 700, y: HOME_FLOOR, s: 1.56, mood: "happy" }),
    figureA("amal", { x: 1010, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(),
    `${[["eye", 500], ["ear", 760], ["nose", 1020], ["tongue", 1280]].map((entry) => sensePanel(entry[1], 400, 0.5, entry[0])).join("")}`,
    sensePanel(1490, 400, 0.5, "hand"),
    figureA("amal", { x: 260, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("hana", { x: 1000, y: HOME_FLOOR, s: 1.56, mood: "happy" })),

  page(homeWall(), confetti(880, 320, 0.9), sensePanel(700, 330, 0.46, "hand"),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("hana", { x: 1010, y: HOME_FLOOR, s: 1.52, mood: "happy" })),
];

// ---------------------------------------------------------------- 6.4 Which Sense Do I Use?

const whichSenseDoIUse = [
  page(plainRoomScene(),
    sensePanel(760, 400, 0.46, "eye"), sensePanel(1000, 400, 0.46, "ear"),
    sensePanel(1240, 400, 0.46, "nose"), sensePanel(1470, 400, 0.46, "tongue"),
    figureA("amal", { x: 400, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(gardenScene(), sensePanel(1300, 360, 0.5, "eye"),
    bigFlower(1000, 880, 1.35),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), sensePanel(1340, 380, 0.48, "ear"),
    drumProp(1020, 880, 0.72, { beating: true }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(), sensePanel(980, 330, 0.46, "nose"),
    breadLoaf(980, 820, 0.6),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(), sensePanel(980, 330, 0.46, "tongue"),
    fruitProp(1000, 800, 0.6, "banana"),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(gardenScene(), sensePanel(1330, 360, 0.46, "hand"),
    flatStone(1000, 890, 1.4),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(),
    wordTile(880, 440, 0.72, { inner: grassMat(0, 0, 0.55), tint: A1.orange }),
    wordTile(1300, 440, 0.72, { inner: flatStone(0, 40, 0.9), tint: A1.blue }),
    figureA("amal", { x: 460, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(),
    drumProp(880, 880, 0.66, { beating: true }),
    violinProp(1280, 800, 0.62),
    figureA("amal", { x: 460, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    fruitProp(880, 800, 0.55, "banana"), breadLoaf(1200, 830, 0.5),
    figureA("amal", { x: 520, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(homeWall(),
    cupOfMilk(1220, 820, 0.5),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.52, mood: "happy" }),
    figureA("hodan", { x: 900, y: HOME_FLOOR, s: 1.38, mood: "happy" })),

  page(basicScene(), marketStall(1080, 880, 1.2),
    spicePot(720, 860, 0.72), spicePot(880, 872, 0.62, { tint: "#8a9a4a" }),
    figureA("amal", { x: 460, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(plainRoomScene(), confetti(880, 330, 0.9),
    sensePanel(1120, 400, 0.44, "eye"), sensePanel(1330, 400, 0.44, "hand"),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.58, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 6.5 Kiki Makes Music

const kikiMakesMusic = [
  page(basicScene(), acacia(1220, 600, 1.35), songNotes(1000, 330, 0.95),
    drumProp(880, 890, 0.72),
    kiki({ x: 620, y: 800, s: 1.25, mood: "happy", arms: "up" }),
    elephant({ x: 1400, y: 760, s: 0.65, trunkUp: true })),

  page(basicScene(), acacia(1300, 610, 1.3),
    drumProp(980, 890, 0.8),
    kiki({ x: 640, y: 800, s: 1.25, mood: "surprised" })),

  page(basicScene(), acacia(280, 630, 1),
    drumProp(920, 890, 0.85, { beating: true }),
    kiki({ x: 640, y: 800, s: 1.25, mood: "happy" }),
    ostrich({ x: 1360, y: 730, s: 0.7, mood: "surprised" })),

  page(basicScene(), acacia(1380, 620, 1.05),
    drumProp(760, 890, 0.75, { beating: true }),
    elephant({ x: 1120, y: 750, s: 0.95, mood: "sad" }),
    kiki({ x: 460, y: 805, s: 1.15 })),

  page(basicScene(), acacia(1340, 620, 1.05),
    drumProp(900, 890, 0.7),
    kiki({ x: 620, y: 800, s: 1.2, mood: "happy" }),
    elephant({ x: 1220, y: 755, s: 0.85 })),

  page(basicScene(), acacia(260, 630, 1.05),
    wildBird(1240, 480, 1.1, true), wildBird(1380, 540, 0.95, true),
    elephant({ x: 900, y: 750, s: 0.95, mood: "happy" }),
    kiki({ x: 560, y: 805, s: 1.1 })),

  page(basicScene(), acacia(1360, 620, 1),
    violinProp(1000, 800, 0.75),
    ostrich({ x: 1180, y: 730, s: 0.78 }),
    kiki({ x: 560, y: 800, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(240, 640, 1),
    keyboardProp(1310, 880, 0.78),
    giraffe({ x: 1020, y: 620, s: 0.95, glasses: true, bend: true }),
    kiki({ x: 560, y: 805, s: 1.15, mood: "surprised" })),

  page(basicScene(), acacia(1380, 620, 1), songNotes(1120, 320, 0.9),
    drumProp(600, 890, 0.62), violinProp(880, 810, 0.55), keyboardProp(1180, 850, 0.6),
    kiki({ x: 320, y: 805, s: 1.05, mood: "happy" })),

  page(basicScene(), acacia(1300, 610, 1.15), songNotes(420, 300, 0.9), songNotes(1120, 260, 0.75),
    drumProp(760, 890, 0.66, { beating: true }),
    kiki({ x: 520, y: 800, s: 1.2, mood: "happy" }),
    ostrich({ x: 1080, y: 730, s: 0.7 }),
    elephant({ x: 1450, y: 765, s: 0.6, trunkUp: true })),

  page(basicScene(), acacia(260, 630, 1), dustPuffs(1180, 900),
    zebra({ x: 1080, y: 690, s: 1.05, pose: "run", mood: "surprised" }),
    kiki({ x: 520, y: 800, s: 1.15, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1240, 605, 1.25), songNotes(1020, 300, 1), confetti(800, 340, 1),
    drumProp(700, 890, 0.62, { beating: true }), violinProp(1400, 820, 0.5),
    kiki({ x: 460, y: 800, s: 1.2, mood: "happy", arms: "up" }),
    zebra({ x: 940, y: 692, s: 0.95, mood: "happy" }),
    elephant({ x: 1500, y: 770, s: 0.58, trunkUp: true })),
];

// ================================================================ UNIT 7
// Let's Go! — ways to travel, vehicle parts, how things move, directions

// ---------------------------------------------------------------- 7.3 The Wheels on the Bus

const theWheelsOnTheBus = [
  page(streetScene(), townBus(1060, 830, 1.05), songNotes(560, 300, 0.95), busStop(300, 880, 0.85),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 830, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(streetScene(), townBus(1120, 830, 1), busStop(320, 880, 0.9),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 860, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), townBus(980, 830, 1.1), motionArcs(1420, 830, 1),
    figureA("amal", { x: 460, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), townBus(1020, 830, 1.05), motionArcs(1460, 830, 0.9), songNotes(520, 320, 0.85),
    figureA("adam", { x: 460, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(streetScene(), townBus(900, 828, 1.15), motionArcs(1400, 830, 1), songNotes(340, 300, 0.9)),

  page(streetScene({ rainy: true }), rain(), townBus(940, 830, 1.1), puddle(400, 930, 220, 42)),

  page(streetScene(), townBus(940, 830, 1.1), songNotes(1400, 300, 0.9),
    figureA("amal", { x: 400, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(streetScene(), townBus(1080, 830, 1.05), busStop(340, 880, 0.9),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), townBus(1120, 832, 1),
    figureA("omar", { x: 640, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureA("amal", { x: 400, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(roomScene({ wall: "#cfd8de", floor: "#8f8f96" }),
    // Two bus windows and a grab rail, drawn here rather than added to a kit: they are
    // this one page's furniture and nothing else on the shelf is inside a vehicle.
    `<g>${[320, 900].map((wx) => `<rect x="${wx}" y="180" width="380" height="300" rx="34" fill="#bfe0f4" stroke="#2b2b33" stroke-width="10"/><path d="M ${wx + 190} 180 v 300" stroke="#2b2b33" stroke-width="8"/>`).join("")}
      <rect x="120" y="560" width="1360" height="14" rx="7" fill="#8f8f96" stroke="#2b2b33" stroke-width="6"/></g>`,
    schoolChair(1180, HOME_FLOOR, 1.25),
    schoolChair(1440, HOME_FLOOR, 1.25, { tint: A1.green }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 830, y: HOME_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), townBus(880, 828, 1.15), shopRow(1400, 700, 0.8),
    figureA("amal", { x: 380, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(streetScene(), townBus(1000, 828, 1.1), songNotes(560, 300, 1), confetti(820, 320, 0.9),
    figureA("amal", { x: 420, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 640, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 7.4 How Do You Go?

const howDoYouGo = [
  page(streetScene(), townBus(1180, 830, 0.95), bicycleProp(760, 890, 0.7),
    figureA("amal", { x: 420, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(streetScene(), townBus(1120, 830, 1), busStop(360, 880, 0.9),
    figureA("amal", { x: 660, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), bicycleProp(1120, 890, 0.95),
    figureA("adam", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(streetScene(), carProp(1120, 880, 0.9),
    figureA("samira", { x: 600, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(streetScene(), crossing(1180, 880, 0.9, { sign: false }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("leo", { x: 800, y: OUT_FLOOR, s: 1.34, mood: "happy" })),

  page(coastScene(), sailboat(1080, 700, 1.35),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), undergroundTrain(1000, 800, 1.05),
    figureA("amal", { x: 400, y: OUT_FLOOR, s: 1.48, mood: "surprised", arms: "point" })),

  page(streetScene(), planeProp(1020, 330, 1.05),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "surprised", arms: "up" }),
    figureA("adam", { x: 760, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(streetScene(), helicopterProp(1060, 340, 1),
    figureA("leo", { x: 560, y: OUT_FLOOR, s: 1.36, mood: "surprised", arms: "up" })),

  page(streetScene(), townBus(1140, 830, 1.05), bicycleProp(560, 895, 0.55),
    figureA("amal", { x: 340, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(coastScene(), planeProp(1120, 300, 0.85), sailboat(700, 700, 1.05),
    figureA("amal", { x: 380, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(streetScene(), townBus(1180, 830, 0.95), confetti(760, 320, 0.9),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("adam", { x: 720, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 7.5 Lulu and the Slow Boat

const luluAndTheSlowBoat = [
  page(basicScene(), lake(1020, 860, 480, 108), acacia(280, 630, 1.05),
    sailboat(1060, 840, 1.25),
    lulu({ x: 700, y: 380, s: 1.7, flying: true }),
    kiki({ x: 480, y: 805, s: 1.1 })),

  page(basicScene(), acacia(1360, 620, 1.05), tallGrass(320, 920, 1.2),
    lulu({ x: 820, y: 360, s: 1.85, flying: true })),

  page(basicScene(), lake(1020, 862, 460, 104),
    kiki({ x: 560, y: 805, s: 1.15 }),
    sailboat(1060, 842, 1.25),
    lulu({ x: 700, y: 430, s: 1.55, flying: true })),

  page(basicScene(), lake(1040, 862, 440, 100),
    kiki({ x: 600, y: 805, s: 1.15, arms: "up" }),
    sailboat(1080, 842, 1.2),
    lulu({ x: 760, y: 450, s: 1.55, flying: true })),

  page(basicScene(), lake(1060, 864, 420, 96),
    kiki({ x: 620, y: 805, s: 1.1 }),
    sailboat(1090, 844, 1.15),
    lulu({ x: 820, y: 380, s: 1.7, flying: true, mood: "happy" })),

  page(basicScene(), acacia(400, 620, 1.25), acacia(1240, 640, 1),
    lulu({ x: 840, y: 300, s: 1.9, flying: true })),

  page(basicScene(), acacia(1320, 640, 0.95), tallGrass(300, 930, 1.4), tallGrass(520, 900, 1.1),
    lulu({ x: 820, y: 480, s: 1.6, flying: true, mood: "sad" })),

  page(basicScene(), lake(820, 862, 600, 124),
    sailboat(860, 842, 1.35)),

  page(basicScene(), lake(620, 868, 380, 88), acacia(1300, 630, 1.05), sailboat(640, 850, 1.05),
    kiki({ x: 1080, y: 800, s: 1.05, arms: "up" }),
    lulu({ x: 1340, y: 470, s: 1.5, flying: true, mood: "surprised" })),

  page(basicScene(), acacia(300, 630, 1.05), lake(1180, 880, 320, 66),
    kiki({ x: 780, y: 800, s: 1.15 }),
    lulu({ x: 1080, y: 500, s: 1.5 })),

  page(basicScene(), acacia(1280, 620, 1.15), bench(760, 900, 1.25),
    kiki({ x: 620, y: 800, s: 1.2, mood: "happy" }),
    lulu({ x: 1020, y: 520, s: 1.45 })),

  page(nightScene(), lake(1080, 880, 400, 88), acacia(300, 640, 1.1), nest(360, 500, 1.4),
    sailboat(1100, 858, 1.1),
    lulu({ x: 250, y: 470, s: 1.3 }),
    kiki({ x: 700, y: 805, s: 1.1, mood: "happy" })),
];

// ================================================================ UNIT 8
// Wonderful Water — water words, where water is, how we use it, weather, animals

// ---------------------------------------------------------------- 8.3 Rain on the Green Grass

const rainOnTheGreenGrass = [
  page(villageScene({ sunny: false, treeX: 1320, treeScale: 1.4 }), rain(),
    puddle(560, 930, 240, 46),
    waterPot(1120, 880, 0.6),
    figureA("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(villageScene({ sunny: false, treeX: 300, treeScale: 1.5 }), rain(),
    figureA("amal", { x: 780, y: VILLAGE_FLOOR, s: 1.55, mood: "happy" }),
    figureA("hodan", { x: 1060, y: VILLAGE_FLOOR, s: 1.4, mood: "happy" })),

  page(villageScene({ sunny: false, treeX: 1340, treeScale: 1.3 }), rain(),
    figureA("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(villageScene({ sunny: false, treeX: 900, treeScale: 1.7 }), rain(),
    figureA("amal", { x: 400, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(villageScene({ sunny: false, treeX: 260, treeScale: 1.3 }), rain(),
    house(1180, VILLAGE_FLOOR, 0.9),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("hodan", { x: 880, y: VILLAGE_FLOOR, s: 1.4, mood: "happy" })),

  page(homeWall({ night: false }),
    figureA("amal", { x: 780, y: HOME_FLOOR, s: 1.58, mood: "happy", arms: "up" })),

  page(villageScene({ sunny: false, treeX: 1300, treeScale: 1.35 }), rain(),
    house(420, VILLAGE_FLOOR, 1),
    figureA("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ sunny: false, treeX: 300, treeScale: 1.4 }), rain(),
    waterPot(1060, 880, 0.85),
    figureA("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(homeWall(), songNotes(700, 280, 0.9),
    figureA("hodan", { x: 1000, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(), motionArcs(620, 700, 0.9), motionArcs(1120, 700, 0.9, { flip: true }),
    figureA("amal", { x: 760, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hodan", { x: 1010, y: HOME_FLOOR, s: 1.42, mood: "happy" })),

  page(homeWall(), songNotes(520, 280, 0.85), songNotes(880, 320, 0.8),
    figureA("amal", { x: 740, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 1020, y: HOME_FLOOR, s: 1.42, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 320, treeScale: 1.45 }), rainbow(900, 560),
    puddle(1120, 930, 260, 48),
    figureA("amal", { x: 720, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 1000, y: VILLAGE_FLOOR, s: 1.4, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 8.4 What Is Water For?

const whatIsWaterFor = [
  page(villageScene({ treeX: 1320, treeScale: 1.35 }), villageWell(1080, 800, 0.7),
    waterPot(760, 890, 0.55),
    figureA("amal", { x: 480, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(homeWall(), cupOfMilk(1180, 820, 0.6),
    figureA("amal", { x: 660, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(), waterPot(1180, 890, 0.6),
    figureA("amal", { x: 660, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(homeWall(), foodBowl(1140, 800, 0.62),
    figureA("hana", { x: 660, y: HOME_FLOOR, s: 1.56, mood: "happy" })),

  page(gardenScene(), wateringCan(1120, 830, 0.9, { pouring: true }),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(streetScene({ rainy: true }), rain(), puddle(1080, 930, 280, 50),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), dryGrass(1180, 880, 0.9),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(basicScene(), lake(900, 860, 560, 120),
    bigLeaf(760, 830, 0.9), flatStone(1120, 880, 1.1),
    figureA("amal", { x: 400, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(basicScene(), lake(920, 862, 540, 118),
    fish(820, 880, 1.2), fish(1020, 890, 1),
    frogProp(1240, 880, 0.95),
    figureA("amal", { x: 400, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(basicScene(), lake(880, 862, 600, 124),
    seaTurtle(560, 880, 0.8),
    whaleProp(1080, 838, 0.95)),

  page(basicScene(), lake(1040, 866, 420, 92), tallGrass(300, 930, 1.3), tallGrass(1480, 900, 1.1),
    crocodileProp(1040, 848, 0.72),
    figureA("amal", { x: 420, y: VILLAGE_FLOOR, s: 1.46, mood: "surprised", arms: "point" })),

  page(villageScene({ treeX: 1340, treeScale: 1.35 }), villageWell(1080, 810, 0.65), confetti(760, 330, 0.9),
    waterPot(800, 890, 0.55),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 8.5 Not One Drop Wasted

const notOneDropWasted = [
  page(villageScene({ dry: true, treeX: 1300, treeScale: 1.3, sunny: true }), villageWell(1000, 800, 0.75),
    dryGrass(420, 900, 1),
    zebra({ x: 660, y: 690, s: 1.05 }),
    hen({ x: 1320, y: 840, s: 0.85 })),

  page(villageScene({ dry: true, treeX: 320, treeScale: 1.3 }), villageWell(1060, 800, 0.8),
    dryGrass(700, 900, 1.05),
    donkey({ x: 640, y: 700, s: 1.05, mood: "sad" })),

  page(villageScene({ dry: true, treeX: 1340, treeScale: 1.2 }), dryGrass(500, 900, 1.1), dryGrass(900, 920, 0.9),
    donkey({ x: 760, y: 700, s: 1.15, mood: "sad" })),

  page(villageScene({ dry: true, treeX: 300, treeScale: 1.25 }), villageWell(1120, 800, 0.7),
    waterPot(860, 890, 0.6),
    splashArcs(860, 880, "#5f92c6"),
    zebra({ x: 620, y: 690, s: 1.05, mood: "surprised" })),

  page(villageScene({ dry: true, treeX: 1320, treeScale: 1.25 }), villageWell(1080, 800, 0.7),
    hen({ x: 720, y: 822, s: 1.15, mood: "sad" }),
    zebra({ x: 420, y: 690, s: 1, mood: "sad" })),

  page(villageScene({ dry: true, treeX: 1340, treeScale: 1.2 }), dryGrass(1140, 900, 1),
    waterPot(1000, 890, 0.6),
    zebra({ x: 660, y: 690, s: 1.1 })),

  page(basicScene(), lake(1000, 880, 380, 80), dryGrass(300, 900, 0.9), dryGrass(1500, 920, 0.8),
    goat({ x: 1000, y: 800, s: 1 })),

  page(villageScene({ dry: true, treeX: 1300, treeScale: 1.25 }), baobabHome(1040, 900, 0.85),
    `<g class="anim-drip" style="animation-delay:0.2s"><circle cx="960" cy="700" r="9" fill="#5f92c6"/></g>
     <g class="anim-drip" style="animation-delay:0.7s"><circle cx="1000" cy="710" r="8" fill="#5f92c6"/></g>`,
    kiki({ x: 700, y: 800, s: 1.2 })),

  page(villageScene({ dry: true, treeX: 320, treeScale: 1.25 }),
    kiki({ x: 620, y: 800, s: 1.15 }),
    chick(950, 890, 1.05), chick(1040, 900, 1), chick(1130, 890, 1.05)),

  page(villageScene({ dry: true, treeX: 1320, treeScale: 1.25 }), villageWell(1060, 805, 0.7),
    dryGrass(420, 900, 0.9),
    donkey({ x: 640, y: 700, s: 1 }),
    hen({ x: 1360, y: 840, s: 0.8 }),
    kiki({ x: 300, y: 805, s: 0.95 })),

  page(basicScene(true), rain(), villageWell(1080, 800, 0.7), puddle(560, 930, 260, 48),
    zebra({ x: 700, y: 690, s: 1.1, mood: "happy" }),
    donkey({ x: 340, y: 705, s: 0.9, mood: "happy" })),

  page(basicScene(), rainbow(860, 560), villageWell(1120, 800, 0.7), puddle(660, 930, 300, 54),
    splashArcs(660, 920),
    zebra({ x: 620, y: 690, s: 1.12, mood: "happy" }),
    kiki({ x: 340, y: 805, s: 1, arms: "up" }),
    hen({ x: 1400, y: 840, s: 0.8, mood: "happy" })),
];

// ================================================================ UNIT 9
// City Places — places in a town, people who help us, position words, traffic lights

// ---------------------------------------------------------------- 9.3 Red Means Stop

const redMeansStop = [
  page(streetScene(), shopRow(1200, 700, 0.9), trafficLights(880, 880, 0.85, { lit: "red" }),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 700, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), shopRow(1240, 700, 0.85),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 860, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), trafficLights(1080, 880, 1, { lit: "red" }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "surprised" })),

  page(streetScene(), trafficLights(1080, 880, 1, { lit: "green" }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(streetScene(), trafficLights(1080, 880, 1, { lit: "yellow" }),
    figureA("adam", { x: 560, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(streetScene(), trafficLights(1120, 880, 0.95, { lit: "yellow" }), crossing(620, 880, 0.8, { sign: false }),
    figureA("amal", { x: 400, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(streetScene(), trafficLights(1120, 880, 0.95, { lit: "red" }),
    figureA("adam", { x: 560, y: OUT_FLOOR, s: 1.48, mood: "surprised" }),
    figureA("amal", { x: 800, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), trafficLights(1140, 880, 0.95, { lit: "green" }), dustPuffs(760, 900),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("adam", { x: 780, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(streetScene(), crossing(900, 880, 1.05, { sign: false }), trafficLights(1340, 880, 0.8, { lit: "green" }),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 740, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(streetScene(), shopRow(1180, 700, 0.95), songNotes(560, 300, 0.9),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(streetScene(), marketStall(1120, 880, 1.1), shopRow(340, 700, 0.7),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureA("adam", { x: 860, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "point" })),

  page(streetScene(), shopRow(1200, 700, 0.9), confetti(800, 320, 0.95), songNotes(520, 290, 0.85),
    figureA("amal", { x: 600, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("adam", { x: 840, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 9.4 Who Works Here?

const whoWorksHere = [
  page(streetScene(), shopRow(1180, 700, 0.95), libraryBuilding(400, 720, 0.55),
    figureA("amal", { x: 780, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(streetScene(), shopRow(1180, 700, 1),
    figureA("omar", { x: 900, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureA("amal", { x: 600, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(streetScene(), hospital(1180, 720, 0.72),
    figureA("faduma", { x: 820, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("amal", { x: 540, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(townScene(), schoolFront(1180, 760, 0.9),
    figureA("yasmin", { x: 820, y: OUT_FLOOR, s: 1.56, mood: "happy" }),
    figureA("amal", { x: 540, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(streetScene(), libraryBuilding(1120, 720, 0.85),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), marketStall(1100, 880, 1.2),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureA("adam", { x: 790, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), bench(1260, 900, 1.3), lampPost(1460, 890, 0.95),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("leo", { x: 860, y: OUT_FLOOR, s: 1.34, mood: "happy" })),

  page(streetScene(), shopRow(1220, 700, 0.9), busStop(760, 880, 0.95),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(streetScene(), hospital(1300, 720, 0.5), schoolFront(600, 760, 0.62),
    figureA("amal", { x: 900, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), marketStall(1120, 880, 1.15),
    mango(880, 830, 1.2),
    figureA("omar", { x: 1360, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 600, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(streetScene(), recycleBin(1180, 880, 0.9), litterBits(760, 900, 1),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), shopRow(1200, 700, 0.9), confetti(820, 320, 0.9), recycleBin(1420, 885, 0.7),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 9.5 The Busy Road and the Quiet Park

const theBusyRoadAndTheQuietPark = [
  page(basicScene(), cityBuildings(820, 700, 1), lampPost(1360, 880, 1),
    lulu({ x: 500, y: 380, s: 1.75, flying: true }),
    kiki({ x: 1060, y: 810, s: 1.05 })),

  page(basicScene(), cityBuildings(1020, 680, 0.95), clockTower(340, 900, 0.85),
    lulu({ x: 700, y: 400, s: 1.7, flying: true, mood: "happy" })),

  page(basicScene(), cityBuildings(760, 660, 1.1),
    `<path d="M 0 900 q 400 -30 800 0 q 400 30 800 0 L 1600 1000 L 0 1000 Z" fill="#b9b0a6" stroke="#a39a8f" stroke-width="5"/>`,
    carProp(900, 940, 0.62), carProp(1300, 950, 0.52, { colour: A1.blue, flip: true }),
    lulu({ x: 400, y: 420, s: 1.6, flying: true, mood: "surprised" })),

  page(basicScene(), cityBuildings(1080, 680, 0.95), lampPost(300, 880, 1),
    lulu({ x: 780, y: 440, s: 1.6, flying: true, mood: "sad" }),
    kiki({ x: 520, y: 810, s: 1.1, mood: "sad" })),

  page(basicScene(), cityBuildings(1160, 680, 0.85), trafficLights(760, 880, 0.85, { lit: "red" }),
    kiki({ x: 460, y: 810, s: 1.1 }),
    lulu({ x: 1060, y: 480, s: 1.4, flying: true })),

  page(basicScene(), cityBuildings(1180, 680, 0.85), trafficLights(760, 880, 0.85, { lit: "green" }),
    crossing(1120, 900, 0.85, { sign: false }),
    kiki({ x: 460, y: 810, s: 1.1, arms: "up" }),
    lulu({ x: 1040, y: 470, s: 1.4, flying: true, mood: "happy" })),

  page(basicScene(), shopRow(560, 700, 0.9), libraryBuilding(1180, 700, 0.9),
    lulu({ x: 860, y: 420, s: 1.55, flying: true })),

  page(basicScene(), acacia(520, 620, 1.25), acacia(1160, 640, 1.05), lampPost(840, 880, 1),
    bench(1360, 900, 1.15),
    kiki({ x: 660, y: 810, s: 1.1, mood: "happy" }),
    lulu({ x: 980, y: 470, s: 1.45, flying: true, mood: "happy" })),

  page(basicScene(), acacia(1180, 620, 1.2), nest(1200, 508, 1.5), bench(500, 900, 1.2),
    wildBird(1330, 520, 1.05),
    lulu({ x: 780, y: 500, s: 1.4, mood: "happy" })),

  page(basicScene(), acacia(400, 630, 1.15), lampPost(1300, 880, 0.95), bench(900, 900, 1.25),
    kiki({ x: 700, y: 810, s: 1.15, mood: "happy" }),
    lulu({ x: 1120, y: 500, s: 1.4 })),

  page(basicScene(), acacia(1240, 630, 1.1), recycleBin(1440, 890, 0.8), litterBits(760, 900, 0.9),
    kiki({ x: 620, y: 810, s: 1.15 }),
    lulu({ x: 1000, y: 490, s: 1.4 })),

  page(basicScene(), acacia(1200, 620, 1.2), lampPost(400, 880, 1), bench(760, 900, 1.25),
    confetti(880, 340, 0.85),
    kiki({ x: 620, y: 810, s: 1.15, mood: "happy", arms: "up" }),
    lulu({ x: 1020, y: 470, s: 1.5, flying: true, mood: "happy" })),
];

// ================================================================ UNIT 10
// My First English World — the capstone: review, the book, the celebration

// ---------------------------------------------------------------- 10.3 My Year of Words

const myYearOfWords = [
  page(amalClassroom(), bunting(420, 96, 0.82),
    learningFolder(1220, 850, 0.85),
    figureA("amal", { x: 700, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 480, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 840, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 1090, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(plainRoomScene(), abcChart(1140, 420, 1.1),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: openBook(0, 0, 0.55) }), schoolChair(1450, CLASS_FLOOR, 1.2),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(plainRoomScene(),
    pictureCard(1180, 430, 0.85, { inner: childDrawing(0, 20, 0.5) }),
    figureA("mum", { x: 380, y: CLASS_FLOOR, s: 1.56 }),
    figureA("amal", { x: 680, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    babyIdris(940, CLASS_FLOOR, 1.15)),

  page(plainRoomScene(),
    colourBall(1300, 870, 0.62, A1.red), pictureCard(980, 440, 0.8, { inner: shapePicture(0, 0, 0.6) }),
    figureA("amal", { x: 480, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(plainRoomScene(),
    wordTile(880, 440, 0.66, { inner: shapeTile(0, 0, 1.1, "square", A1.red), tint: A1.red }),
    wordTile(1160, 440, 0.66, { inner: shapeTile(0, 0, 1.1, "circle", A1.blue), tint: A1.blue }),
    wordTile(1440, 440, 0.66, { inner: shapeTile(0, 0, 1.1, "triangle", A1.green), tint: A1.green }),
    figureA("amal", { x: 460, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(basicScene(), barn(1260, 700, 1.05),
    cow(920, 885, 0.6), hen({ x: 1140, y: 840, s: 0.7 }), chick(1320, 895, 0.9),
    figureA("amal", { x: 540, y: VILLAGE_FLOOR, s: 1.48, mood: "happy" })),

  page(plainRoomScene(),
    sensePanel(880, 420, 0.5, "eye"), sensePanel(1140, 420, 0.5, "ear"), sensePanel(1400, 420, 0.5, "nose"),
    figureA("amal", { x: 460, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(),
    pictureCard(880, 440, 0.8, { inner: townBus(0, 40, 0.46) }),
    pictureCard(1180, 440, 0.8, { inner: bicycleProp(0, 30, 0.4) }),
    pictureCard(1470, 440, 0.8, { inner: carProp(0, 20, 0.4) }),
    figureA("amal", { x: 440, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(),
    pictureCard(820, 440, 0.78, { inner: waterPot(0, 60, 0.56) }),
    pictureCard(1120, 440, 0.78, { inner: libraryBuilding(0, 96, 0.44) }),
    pictureCard(1420, 440, 0.78, { inner: shopRow(0, 60, 0.36) }),
    figureA("amal", { x: 420, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(880, 320, 1),
    learningFolder(1300, 855, 0.7),
    figureA("amal", { x: 720, y: CLASS_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("yasmin", { x: 420, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),
];

// ---------------------------------------------------------------- 10.4 Show Me Your Book

const showMeYourBook = [
  page(amalClassroom(), bunting(420, 96, 0.82),
    madeBook(1240, 810, 0.85, { title: "My First English World" }),
    figureA("amal", { x: 700, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(), learningFolder(1140, 850, 1),
    figureA("amal", { x: 580, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" })),

  page(plainRoomScene(), easel(1200, 780, 0.9, { inner: childDrawing(0, -30, 0.55) }),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(plainRoomScene(), pictureCard(1180, 440, 0.9, { inner: childDrawing(0, 20, 0.55) }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.52, mood: "happy" }),
    figureA("mum", { x: 300, y: CLASS_FLOOR, s: 1.54 })),

  page(plainRoomScene(), pictureCard(1180, 440, 0.9, { inner: townBus(0, 40, 0.5) }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(amalClassroom(),
    schoolTable(1140, CLASS_FLOOR, 1.45, { item: `${madeBook(0, -66, 0.36, { title: "My Book" })}${pencilProp(150, -40, 0.3, { colour: A1.blue })}` }),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(),
    madeBook(1180, 780, 0.95, { title: "My Family" }),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(homeWall(),
    madeBook(1240, 800, 0.7, { title: "My Book" }),
    figureA("amal", { x: 780, y: HOME_FLOOR, s: 1.56, mood: "happy", arms: "up" })),

  page(homeWall(),
    figureA("hana", { x: 1020, y: HOME_FLOOR, s: 1.56, mood: "happy" }),
    figureA("amal", { x: 680, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(amalClassroom(),
    figureA("yasmin", { x: 460, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureA("amal", { x: 820, y: CLASS_FLOOR, s: 1.52, mood: "happy" }),
    madeBook(1240, 815, 0.62, { title: "My Book" })),

  page(amalClassroom(),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.56, mood: "happy", arms: "up" }),
    figureA("yasmin", { x: 420, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    madeBook(1260, 815, 0.6, { title: "My Family" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(900, 320, 1.05),
    figureA("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureA("amal", { x: 760, y: CLASS_FLOOR, s: 1.56, mood: "happy", arms: "up" }),
    figureA("adam", { x: 1020, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("samira", { x: 1240, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureA("leo", { x: 1430, y: CLASS_FLOOR, s: 1.32, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 10.5 See You Next Year, Friends

const seeYouNextYearFriends = [
  page(basicScene(), acacia(1200, 600, 1.4), bunting(760, 240, 0.9), confetti(820, 340, 1),
    zebra({ x: 660, y: 690, s: 1.05, mood: "happy" }),
    kiki({ x: 1020, y: 805, s: 1.05, arms: "up" }),
    giraffe({ x: 300, y: 630, s: 0.85, glasses: true }),
    elephant({ x: 1420, y: 765, s: 0.62, trunkUp: true })),

  page(basicScene(), acacia(1340, 620, 1.1), bunting(700, 250, 0.85), tallGrass(300, 920, 1.2),
    kiki({ x: 800, y: 800, s: 1.2, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(280, 630, 1.05), bunting(1000, 250, 0.8),
    colourBall(1180, 880, 0.8, A1.red),
    zebra({ x: 760, y: 690, s: 1.15, mood: "happy" })),

  page(basicScene(), barn(1300, 705, 1), bunting(600, 250, 0.8),
    eggProp(1000, 880, 0.75, { count: 4 }),
    hen({ x: 700, y: 822, s: 1.15, mood: "happy" }),
    chick(1220, 890, 0.95), chick(1300, 900, 0.9), chick(1380, 890, 0.95)),

  page(basicScene(), acacia(1360, 620, 1.05), bunting(680, 250, 0.85),
    carrot(1060, 880, 1.4), carrot(1180, 895, 1.2),
    donkey({ x: 700, y: 700, s: 1.15, mood: "happy" })),

  page(basicScene(), acacia(1240, 610, 1.2), schoolBell(1000, 880, 1.55), bunting(560, 250, 0.8),
    giraffe({ x: 620, y: 625, s: 1, glasses: true })),

  page(basicScene(), acacia(280, 630, 1.05), bunting(1020, 250, 0.85),
    kiki({ x: 780, y: 800, s: 1.28, mood: "happy", arms: "up" }),
    goat({ x: 1300, y: 772, s: 0.85, flip: true })),

  page(basicScene(), acacia(1340, 620, 1.05), bunting(660, 250, 0.85),
    elephant({ x: 900, y: 745, s: 1, trunkUp: true, mood: "happy", arms: "up" }),
    kiki({ x: 480, y: 805, s: 1.05 })),

  page(basicScene(), acacia(260, 640, 1), bunting(980, 250, 0.8),
    waterPot(1300, 890, 0.55),
    goat({ x: 880, y: 770, s: 1.05, mood: "happy" })),

  page(basicScene(), acacia(1380, 620, 1), bunting(620, 250, 0.85), dustPuffs(1000, 900),
    ostrich({ x: 900, y: 720, s: 0.85, pose: "run", mood: "happy" }),
    kiki({ x: 500, y: 805, s: 1.05 })),

  page(basicScene(), acacia(1120, 600, 1.45), nest(1120, 492, 1.5), bunting(500, 250, 0.8),
    lulu({ x: 1290, y: 470, s: 1.5, mood: "happy" }),
    kiki({ x: 560, y: 805, s: 1.1, arms: "up" })),

  page(basicScene(), acacia(1220, 600, 1.3), bunting(720, 240, 0.95), confetti(840, 330, 1.1),
    rainbow(820, 540),
    zebra({ x: 620, y: 690, s: 1.05, mood: "happy" }),
    kiki({ x: 960, y: 805, s: 1.05, mood: "happy", arms: "up" }),
    giraffe({ x: 300, y: 630, s: 0.85, glasses: true }),
    elephant({ x: 1440, y: 768, s: 0.6, trunkUp: true }),
    hen({ x: 1220, y: 842, s: 0.72, mood: "happy" })),
];

// ---------------------------------------------------------------- books

const books = {
  // Unit 1
  "hello-school": { dir: "hello-school", pages: helloSchool },
  "find-something-green": { dir: "find-something-green", pages: findSomethingGreen },
  "the-lost-blue-crayon": { dir: "the-lost-blue-crayon", pages: theLostBlueCrayon },
  // Unit 2
  "some-families-are-big": { dir: "some-families-are-big", pages: someFamiliesAreBig },
  "who-is-in-my-family": { dir: "who-is-in-my-family", pages: whoIsInMyFamily },
  "ten-little-eggs": { dir: "ten-little-eggs", pages: tenLittleEggs },
  // Unit 3
  "wind-the-bobbin-up": { dir: "wind-the-bobbin-up", pages: windTheBobbinUp },
  "touch-your-toes": { dir: "touch-your-toes", pages: touchYourToes },
  "where-is-the-ball": { dir: "where-is-the-ball", pages: whereIsTheBall },
  // Unit 4
  "party-time-look-at-me": { dir: "party-time-look-at-me", pages: partyTimeLookAtMe },
  "shapes-i-can-cut": { dir: "shapes-i-can-cut", pages: shapesICanCut },
  "higgledy-piggledy-my-black-hen": { dir: "higgledy-piggledy-my-black-hen", pages: higgledyPiggledy },
  // Unit 5
  "hello-to-the-farm": { dir: "hello-to-the-farm", pages: helloToTheFarm },
  "who-says-moo": { dir: "who-says-moo", pages: whoSaysMoo },
  "duku-plants-a-row": { dir: "duku-plants-a-row", pages: dukuPlantsARow },
  // Unit 6
  "two-little-eyes": { dir: "two-little-eyes", pages: twoLittleEyes },
  "which-sense-do-i-use": { dir: "which-sense-do-i-use", pages: whichSenseDoIUse },
  "kiki-makes-music": { dir: "kiki-makes-music", pages: kikiMakesMusic },
  // Unit 7
  "the-wheels-on-the-bus": { dir: "the-wheels-on-the-bus", pages: theWheelsOnTheBus },
  "how-do-you-go": { dir: "how-do-you-go", pages: howDoYouGo },
  "lulu-and-the-slow-boat": { dir: "lulu-and-the-slow-boat", pages: luluAndTheSlowBoat },
  // Unit 8
  "rain-on-the-green-grass": { dir: "rain-on-the-green-grass", pages: rainOnTheGreenGrass },
  "what-is-water-for": { dir: "what-is-water-for", pages: whatIsWaterFor },
  "not-one-drop-wasted": { dir: "not-one-drop-wasted", pages: notOneDropWasted },
  // Unit 9
  "red-means-stop": { dir: "red-means-stop", pages: redMeansStop },
  "who-works-here": { dir: "who-works-here", pages: whoWorksHere },
  "the-busy-road-and-the-quiet-park": { dir: "the-busy-road-and-the-quiet-park", pages: theBusyRoadAndTheQuietPark },
  // Unit 10
  "my-year-of-words": { dir: "my-year-of-words", pages: myYearOfWords },
  "show-me-your-book": { dir: "show-me-your-book", pages: showMeYourBook },
  "see-you-next-year-friends": { dir: "see-you-next-year-friends", pages: seeYouNextYearFriends },
};

writeBooks(books, process.argv[2]);
