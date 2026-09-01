#!/usr/bin/env node

// Generates the vector illustrations for Grade 2's FOURTH, FIFTH, SIXTH and
// SEVENTH books — forty books, four for each of units 1 to 10.
//
// Grade 2 shipped with three books per unit, all of them Zuri's. This brings the
// shelf to seven. As at Grade 1, the added books are not four more stories: each
// is a different KIND, and each comes from a text the unit already carries.
//
//   book 4  the unit's own STORY, retold          (its Story reading)
//   book 5  the unit's POEM, said out loud        (its poem)
//   book 6  the unit's LISTENING text             (its listening)
//   book 7  a look-and-name book of its WORDS     (its vocabularyGroups)
//
// **Book four needed no invention at all.** Every Grade 2 unit's Story stars
// AMAL — Amal's First Week, The Helpers of Warta Street, The Big Race, The Night
// Amal Counted the Stars, A Fair Way to Measure, Amal and the Little Garden
// Friends, Amal and the Little Tree, Helping Hands at Home, and the day she
// walked a lost stranger to the hospital. Ten finished, narrated, reviewed
// stories that not one of the thirty Zuri books tells. The shelf had a whole
// series sitting inside the course, unread.
//
// Book five is the unit's poem with the actions drawn. Book six puts the
// listening somewhere and carries it one step past where the recording stops —
// the Grade 3 rule, because a dialogue is two voices and no scenery. Book seven
// is the vocabulary revision, in the Zuri storyworld so the shelf still has its
// own lead.
//
// One face was missing from the whole chain and is added in the kit: LEILA, the
// firefighter of Unit 2, who has a name, a uniform and lines in two texts.
//
// ---------------------------------------------------------------- provenance
//
// **This file shipped its OUTPUT a day before it was tracked itself.** The forty
// books and their catalogue entries went in with `cd951619b` on 2026-08-31 and
// were deployed; this generator and `lib/ehel-ebook-kit-grade2-shelf.js` sat
// untracked in the shared checkout until `8d8ed060e` the next day, adopted by a
// different session on the owner's instruction. So for a day, forty live books
// had exactly one copy of the thing that draws them, on one disk.
//
// Nothing reported it, and the reason is worth keeping. The pages are GENERATED
// but they are also COMMITTED, so `git status` was clean about the books; the
// gates read the catalogue against the files on disk (check-english-ebooks.mjs),
// the rendered geometry (check-ebook-composition.mjs) and the derived topic
// index — none of them asks git anything. Three tools in this directory ask git
// anything at all: check-english-audio-staleness.py (has the text changed since
// the recording), check-english-content.mjs (which commit last touched English,
// for its report header) and upload-app-to-bunny.js. Not one asks whether a file
// is TRACKED.
//
// The shape generalises past this file: a generator is the one thing whose
// absence costs nothing until somebody needs to regenerate, because its output
// is what everyone looks at — and a committed, deployed output is the strongest
// possible evidence that the work is safe. Commit a generator in the same commit
// as the first output it writes; where that has not happened,
// `git ls-files --error-unmatch <tool>` answers in one line.
//
// Usage: node tools/create-grade2-shelf-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  writeBooks,
  // scenes
  basicScene, nightScene, townScene, streetScene, gardenScene, coastScene, sunsetScene,
  plainRoomScene, roomScene, classroomScene, villageScene, amalClassroom, homeWall, aquariumRoom,
  // people
  figureA, figureG2, babyIdris, person,
  // savanna cast (the Zuri books)
  zuri, kiki, giraffe, elephant, ostrich, monkey, zebra, donkey, hen, chick, goat, wildBird, lulu,
  acacia, tallGrass, lake, river, puddle, rainbow, confetti, dustPuffs, rain, bigFlower, bigLeaf,
  bench, schoolBell, chalkboard, baobabHome, nest, flatStone, marketStall, lampPost,
  cityBuildings, clockTower, mango,
  // school and home things
  schoolTable, schoolChair, abcChart, wallClock, pencilProp, crayonProp, colourBall, schoolFront,
  closedBook, openBook, childDrawing, bedProp, foodBowl, cupOfMilk, fruitProp, basketOf,
  calendarBoard, colourChart, bookShelf, tabletProp, easel, bunting, motionArcs, greetingCard,
  learningFolder, madeBook, folderProp, notepad, poster, globeProp,
  // town and jobs
  shopRow, townBus, fireEngine, ladder, fireKit, cleaningKit, crossing, clinicFront, hospital,
  libraryBuilding, shoppingCentre, ferrisWheel, undergroundTrain, ferryBoat, helicopterProp,
  mapProp, trafficRow, busStop, bicycleProp, carProp, trafficLights, doctorKit,
  // measuring, shapes, bugs, plants
  rulerProp, metreStick, shapeTile, patternStrip, balanceScale, tensLine, numberLadder,
  butterflyBug, beeBug, antBug, anthill, spiderWeb, spiderBug, wormBug, cricketBug, fallenLog,
  gardenPlant, seedProp, dugHole, plantStage, plantParts, wateringCan, litterBits, recycleBin, sapling,
  // homes and the aquarium
  house, flatBlock, hut, treeHouse, beehive, burrow, roomBox, worldHome,
  aquariumTank, octopus, penguin, seaTurtle, shark, castShadow, cloudPuff, sleepyZs,
  // the Grade 1 shelf additions
  rabbitProp, duckProp, frogProp, drumProp, planeProp, wordTile, songNotes, countRow, doorProp, crownProp,
  // the Grade 2 shelf additions
  hoopProp, flagProp, torchProp, earthBall, sundialProp, cricketJar,
  sofaProp, sinkProp, rugProp, broomProp, speechPair, comparePair,
  A1, G3,
} = require("./lib/ehel-ebook-kit-grade2-shelf.js");

const page = (...parts) => parts.join("");

const CLASS_FLOOR = 930;
const HOME_FLOOR = 940;
const OUT_FLOOR = 900;
const VILLAGE_FLOOR = 930;

// ================================================================ UNIT 1 — Welcome and Calendar

// ---------------------------------------------------------------- 1.4  Amal's First Week (the Story)

const amalsFirstWeek = [
  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }), bunting(420, 96, 0.82),
    figureG2("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 760, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("leo", { x: 1000, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(townScene(), schoolFront(1120, 760, 0.95),
    figureG2("amal", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "surprised" }),
    figureG2("mum", { x: 700, y: OUT_FLOOR, s: 1.58 })),

  page(townScene(), schoolFront(1180, 760, 0.9),
    figureG2("yasmin", { x: 820, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 500, y: OUT_FLOOR, s: 1.44 })),

  page(amalClassroom(),
    figureG2("amal", { x: 760, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("yasmin", { x: 1120, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),

  page(plainRoomScene(), colourChart(1120, 420, 1.6), calendarBoard(1120, 420, 1.5, { ring: 1 }),
    figureG2("amal", { x: 420, y: CLASS_FLOOR, s: 1.46, mood: "surprised", arms: "point" })),

  page(amalClassroom(),
    figureG2("leo", { x: 900, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }), songNotes(760, 250, 0.85),
    figureG2("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 920, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    childDrawing(1220, 790, 0.85),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("leo", { x: 880, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), colourChart(1120, 420, 1.6),
    schoolTable(1180, CLASS_FLOOR, 1.35, { item: closedBook(0, -46, 0.42, { colour: A1.red }) }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(amalClassroom(), doorProp(1220, CLASS_FLOOR, 0.85),
    figureG2("nora", { x: 980, y: CLASS_FLOOR, s: 1.42, mood: "sad" }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.48, mood: "surprised" })),

  page(amalClassroom(),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureG2("nora", { x: 980, y: CLASS_FLOOR, s: 1.42, mood: "happy" }),
    figureG2("yasmin", { x: 1300, y: CLASS_FLOOR, s: 1.58, mood: "happy" })),

  page(homeWall(), confetti(860, 300, 0.9),
    figureG2("amal", { x: 720, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("mum", { x: 1010, y: HOME_FLOOR, s: 1.56, mood: "happy" })),
];

// ---------------------------------------------------------------- 1.5  When I Open Up a Book (the poem)

const whenIOpenUpABook = [
  page(plainRoomScene(), bookShelf(1240, 380, 1.9), bunting(420, 96, 0.82),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.58, mood: "happy" }),
    openBook(940, 800, 1.5)),

  page(plainRoomScene(), bookShelf(1200, 380, 2),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.58, mood: "happy" })),

  page(plainRoomScene(),
    openBook(1080, 760, 2), songNotes(1420, 320, 0.9),
    figureG2("amal", { x: 460, y: CLASS_FLOOR, s: 1.55, mood: "surprised" })),

  page(plainRoomScene(), openBook(1060, 750, 2.1),
    figureG2("amal", { x: 440, y: CLASS_FLOOR, s: 1.52, mood: "surprised", arms: "point" })),

  page(basicScene(), acacia(1300, 620, 1.1), dustPuffs(900, 900), motionArcs(560, 640, 0.9),
    zebra({ x: 820, y: 690, s: 1.05, pose: "run" }),
    colourBall(400, 870, 0.62, A1.red)),

  page(basicScene(), acacia(280, 630, 1.05),
    monkey({ x: 780, y: 760, s: 1.05, arms: "up" }),
    monkey({ x: 1080, y: 770, s: 0.9 }),
    kiki({ x: 1320, y: 810, s: 0.95, arms: "up" })),

  page(streetScene(), undergroundTrain(940, 800, 1.1),
    figureG2("amal", { x: 380, y: OUT_FLOOR, s: 1.46, mood: "surprised", arms: "point" })),

  page(plainRoomScene(),
    schoolTable(1160, CLASS_FLOOR, 1.4, { item: crownProp(0, -70, 0.7) }),
    figureG2("amal", { x: 500, y: CLASS_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("leo", { x: 760, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), bookShelf(1260, 380, 1.8), openBook(860, 800, 1.5),
    figureG2("amal", { x: 420, y: CLASS_FLOOR, s: 1.55, mood: "happy" })),

  page(plainRoomScene(), openBook(1120, 760, 1.7), songNotes(480, 300, 0.9),
    figureG2("nora", { x: 460, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("amal", { x: 720, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), bookShelf(1240, 380, 1.85),
    figureG2("amal", { x: 480, y: CLASS_FLOOR, s: 1.55, mood: "happy", arms: "point" }),
    figureG2("leo", { x: 760, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), bookShelf(1260, 380, 1.8), confetti(820, 320, 0.95),
    openBook(920, 800, 1.5),
    figureG2("amal", { x: 440, y: CLASS_FLOOR, s: 1.56, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 1.6  Seven Days Make One Week (the listening)

const sevenDaysMakeOneWeek = [
  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }), songNotes(760, 250, 0.9), bunting(420, 96, 0.82),
    figureG2("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 720, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }),
    figureG2("yasmin", { x: 620, y: CLASS_FLOOR, s: 1.6, arms: "point" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }), songNotes(560, 260, 0.8),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 860, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 2 }),
    figureG2("nora", { x: 640, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 880, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 3 }),
    figureG2("leo", { x: 640, y: CLASS_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("sami", { x: 880, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 4 }), songNotes(520, 250, 0.85),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 5 }),
    figureG2("theo", { x: 660, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 900, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 6 }),
    figureG2("amal", { x: 660, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("maya", { x: 900, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 7 }), songNotes(540, 260, 0.8),
    figureG2("amal", { x: 720, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 7 }),
    figureG2("yasmin", { x: 560, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("amal", { x: 860, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(plainRoomScene(), countRow(880, 400, 1.05, { from: 1, count: 4 }),
    figureG2("amal", { x: 400, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }), confetti(820, 310, 1), songNotes(500, 250, 0.9), bunting(420, 96, 0.82),
    figureG2("yasmin", { x: 380, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 930, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 1.7  The First, the Second, the Third (the words)

const theFirstTheSecondTheThird = [
  page(basicScene(), acacia(1240, 610, 1.25), calendarBoard(880, 900, 1.15, { ring: 1 }),
    zuri({ x: 560, y: 826, s: 1.2, arms: "up" }),
    kiki({ x: 1360, y: 830, s: 0.95 })),

  page(basicScene(), acacia(300, 630, 1.05), calendarBoard(1060, 900, 1.15, { ring: 1 }),
    zuri({ x: 620, y: 826, s: 1.2 })),

  page(basicScene(), acacia(1320, 620, 1.05), calendarBoard(1000, 900, 1.15, { ring: 2 }),
    zuri({ x: 560, y: 826, s: 1.2 })),

  page(basicScene(), acacia(280, 630, 1.05), calendarBoard(1040, 900, 1.15, { ring: 3 }),
    zuri({ x: 600, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(1300, 620, 1.1), calendarBoard(1000, 900, 1.15, { ring: 7 }),
    zuri({ x: 560, y: 826, s: 1.2 }),
    kiki({ x: 1420, y: 832, s: 0.9 })),

  page(basicScene(), acacia(300, 640, 1), countRow(1020, 830, 0.92, { from: 1, count: 4 }),
    zuri({ x: 480, y: 826, s: 1.15, arms: "up" })),

  page(basicScene(), acacia(1340, 620, 1), countRow(940, 830, 0.92, { from: 5, count: 4 }),
    zuri({ x: 440, y: 826, s: 1.15 })),

  page(basicScene(), acacia(280, 630, 1.05), countRow(1000, 830, 0.92, { from: 9, count: 4 }),
    zuri({ x: 480, y: 826, s: 1.15, arms: "up" })),

  page(basicScene(), acacia(1300, 620, 1.05), calendarBoard(1020, 900, 1.15, { ring: 12 }),
    zuri({ x: 560, y: 826, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(300, 630, 1.05), calendarBoard(1040, 900, 1.15, { ring: 20 }),
    zuri({ x: 600, y: 826, s: 1.2 }),
    greetingCard(1400, 830, 0.7)),

  page(basicScene(), acacia(1320, 620, 1.05), calendarBoard(1000, 900, 1.15, { ring: 30 }),
    zuri({ x: 560, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 330, 0.95), calendarBoard(940, 900, 1.15, { ring: 1 }),
    zuri({ x: 520, y: 826, s: 1.22, arms: "up" }),
    kiki({ x: 1340, y: 830, s: 0.95, arms: "up" })),
];

// ================================================================ UNIT 2 — Good Neighbours and Jobs

// ---------------------------------------------------------------- 2.4  The Helpers of Warta Street (the Story)

const theHelpersOfWartaStreet = [
  page(streetScene(), shopRow(1180, 700, 1), marketStall(760, 880, 0.9),
    figureG2("amal", { x: 400, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("karim", { x: 1420, y: OUT_FLOOR, s: 1.56 })),

  page(homeWall(),
    figureG2("amal", { x: 700, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureG2("mum", { x: 1000, y: HOME_FLOOR, s: 1.56 })),

  page(streetScene(), shopRow(1140, 700, 1), ladder(880, 880, 0.95),
    figureG2("karim", { x: 620, y: OUT_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    cleaningKit(420, 890, 1.1)),

  page(streetScene(), townBus(1060, 830, 1.05), busStop(360, 880, 0.9),
    figureG2("nadia", { x: 660, y: OUT_FLOOR, s: 1.56, mood: "happy", arms: "up" })),

  page(streetScene(), townBus(1080, 830, 1), easel(760, 890, 1.05, { inner: countRow(0, 40, 0.72, { from: 7, count: 4 }) }),
    figureG2("amal", { x: 400, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "point" })),

  page(streetScene({ rainy: true }), shopRow(1200, 700, 0.95), marketStall(820, 880, 0.85),
    `<g class="anim-float"><ellipse cx="880" cy="640" rx="150" ry="70" fill="#5f5f68" opacity="0.5"/><ellipse cx="980" cy="600" rx="110" ry="54" fill="#4a4a52" opacity="0.45"/></g>`,
    figureG2("karim", { x: 460, y: OUT_FLOOR, s: 1.56, mood: "surprised", arms: "up" })),

  page(streetScene({ rainy: true }), fireEngine(1080, 880, 1),
    figureG2("leila", { x: 620, y: OUT_FLOOR, s: 1.56, mood: "surprised" }),
    figureG2("amal", { x: 360, y: OUT_FLOOR, s: 1.44, mood: "surprised" })),

  page(streetScene({ rainy: true }), fireEngine(1160, 880, 0.9), fireKit(700, 830, 0.85),
    figureG2("leila", { x: 400, y: OUT_FLOOR, s: 1.56 })),

  page(streetScene(), fireEngine(1200, 880, 0.85),
    goat({ x: 800, y: 772, s: 0.85 }), goat({ x: 980, y: 780, s: 0.7, flip: true }),
    figureG2("leila", { x: 460, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(streetScene(), shopRow(1220, 700, 0.9), bicycleProp(880, 890, 0.7),
    figureG2("rami", { x: 620, y: OUT_FLOOR, s: 1.56, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 380, y: OUT_FLOOR, s: 1.44 })),

  page(streetScene(), shopRow(1180, 700, 0.95), marketStall(820, 880, 0.9),
    figureG2("omar", { x: 1420, y: OUT_FLOOR, s: 1.54, mood: "sad" }),
    figureG2("amal", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "sad" }),
    figureG2("mum", { x: 680, y: OUT_FLOOR, s: 1.56 })),

  page(streetScene(), shopRow(1240, 700, 0.9), marketStall(900, 880, 0.85), confetti(760, 300, 0.9),
    figureG2("omar", { x: 1160, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("amal", { x: 400, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("karim", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("nadia", { x: 840, y: OUT_FLOOR, s: 1.52, mood: "happy" })),
];

// ---------------------------------------------------------------- 2.5  My Neighbourhood (the poem)

const myNeighbourhood = [
  page(streetScene(), shopRow(1160, 700, 1), lampPost(420, 880, 1), bunting(820, 300, 0.85),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(streetScene(), shopRow(1200, 700, 0.95),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), shopRow(1240, 700, 0.9),
    figureG2("karim", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("omar", { x: 880, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(streetScene(), shopRow(300, 700, 0.8),
    figureG2("hana", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("grandpa", { x: 980, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(streetScene(), lampPost(1360, 880, 1),
    figureG2("mum", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("dad", { x: 900, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(streetScene(), shopRow(1220, 700, 0.9),
    figureG2("amal", { x: 560, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 780, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 990, y: OUT_FLOOR, s: 1.42, mood: "happy", arms: "up" })),

  page(streetScene(), busStop(1200, 880, 0.95), townBus(760, 832, 0.85),
    figureG2("nadia", { x: 420, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(streetScene(), clinicFront(1160, 720, 0.9),
    figureG2("sarah", { x: 700, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    doctorKit(420, 880, 0.9)),

  page(streetScene(), shopRow(1180, 700, 0.95), crossing(760, 880, 0.85, { sign: false }),
    figureG2("rami", { x: 420, y: OUT_FLOOR, s: 1.54, mood: "happy", arms: "up" })),

  page(streetScene(), shopRow(1240, 700, 0.9), lampPost(400, 880, 1),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("hana", { x: 960, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(streetScene(), shopRow(1160, 700, 1), marketStall(760, 880, 0.85),
    figureG2("amal", { x: 420, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(streetScene(), shopRow(1180, 700, 1), bunting(760, 300, 0.9), confetti(840, 330, 0.95),
    figureG2("amal", { x: 460, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("karim", { x: 680, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("nadia", { x: 900, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("omar", { x: 1120, y: OUT_FLOOR, s: 1.5, mood: "happy" })),
];

// ---------------------------------------------------------------- 2.6  Firefighter Leila Comes to Class (the listening)

const firefighterLeilaComesToClass = [
  page(amalClassroom(), bunting(420, 96, 0.82),
    figureG2("leila", { x: 1100, y: CLASS_FLOOR, s: 1.58, mood: "happy" }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("theo", { x: 840, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(),
    figureG2("yasmin", { x: 480, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 820, y: CLASS_FLOOR, s: 1.46, mood: "surprised" }),
    figureG2("nora", { x: 1060, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(), doorProp(1240, CLASS_FLOOR, 0.85),
    figureG2("leila", { x: 980, y: CLASS_FLOOR, s: 1.58, mood: "happy" }),
    figureG2("amal", { x: 600, y: CLASS_FLOOR, s: 1.46, mood: "surprised", arms: "up" })),

  page(amalClassroom(), speechPair(1180, 420, 0.72),
    figureG2("amal", { x: 640, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("leila", { x: 940, y: CLASS_FLOOR, s: 1.56 })),

  page(amalClassroom(), fireKit(1100, 850, 0.8),
    figureG2("leila", { x: 560, y: CLASS_FLOOR, s: 1.58, arms: "point" })),

  page(amalClassroom(), speechPair(500, 420, 0.68, { flip: true }),
    figureG2("theo", { x: 760, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("leila", { x: 1060, y: CLASS_FLOOR, s: 1.56 })),

  page(streetScene(), fireEngine(1060, 880, 1.05),
    figureG2("leila", { x: 480, y: OUT_FLOOR, s: 1.56, mood: "happy" })),

  page(amalClassroom(),
    figureG2("nora", { x: 660, y: CLASS_FLOOR, s: 1.44, mood: "surprised" }),
    figureG2("leila", { x: 1000, y: CLASS_FLOOR, s: 1.56 })),

  page(amalClassroom(), speechPair(1160, 420, 0.7),
    figureG2("leila", { x: 700, y: CLASS_FLOOR, s: 1.58, mood: "happy" })),

  page(amalClassroom(), fireKit(1120, 850, 0.75),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("leila", { x: 840, y: CLASS_FLOOR, s: 1.56, mood: "happy" })),

  page(amalClassroom(), notepad(1220, 810, 0.9),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("yasmin", { x: 900, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(880, 320, 1),
    figureG2("leila", { x: 1160, y: CLASS_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 600, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("theo", { x: 820, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 1000, y: CLASS_FLOOR, s: 1.42, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 2.7  Who Is Helping? (the words)

const whoIsHelping = [
  page(basicScene(), acacia(1260, 610, 1.2), marketStall(940, 880, 0.9),
    zuri({ x: 560, y: 826, s: 1.2, arms: "up" }),
    kiki({ x: 1400, y: 830, s: 0.9 })),

  page(basicScene(), acacia(300, 630, 1.05), chalkboard(1080, 830, 1.05),
    giraffe({ x: 1080, y: 620, s: 0.95, glasses: true }),
    zuri({ x: 520, y: 826, s: 1.2 })),

  page(basicScene(), acacia(1320, 620, 1), fireKit(1000, 850, 0.72),
    zuri({ x: 520, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(280, 640, 1), doctorKit(1060, 880, 1),
    zuri({ x: 560, y: 826, s: 1.2 })),

  page(basicScene(), acacia(1320, 620, 1), marketStall(1000, 880, 0.95),
    mango(880, 830, 1.1),
    zuri({ x: 500, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(300, 630, 1.05), seedProp(1080, 890, 1.1),
    donkey({ x: 1060, y: 700, s: 0.95 }),
    zuri({ x: 520, y: 826, s: 1.18 })),

  page(basicScene(), acacia(1300, 620, 1.05), townBus(980, 832, 0.85),
    zuri({ x: 480, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(280, 630, 1.05), cleaningKit(1060, 890, 1.15),
    zuri({ x: 560, y: 826, s: 1.2 })),

  page(basicScene(), acacia(1320, 620, 1), bicycleProp(1020, 890, 0.75),
    zuri({ x: 520, y: 826, s: 1.2 })),

  page(basicScene(), acacia(300, 640, 1), notepad(1080, 820, 1),
    zuri({ x: 560, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(1300, 620, 1.05), sapling(1020, 890, 1),
    wateringCan(760, 850, 0.9, { pouring: true }),
    zuri({ x: 460, y: 826, s: 1.18 })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 330, 0.95), marketStall(1020, 880, 0.85),
    zuri({ x: 520, y: 826, s: 1.22, arms: "up" }),
    kiki({ x: 1380, y: 830, s: 0.92, arms: "up" })),
];

// ================================================================ UNIT 3 — Ready, Steady, Go!

// ---------------------------------------------------------------- 3.4  The Big Race (the Story)

const theBigRace = [
  page(gardenScene(), bunting(820, 250, 0.95), dustPuffs(1100, 900),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("theo", { x: 900, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("nora", { x: 1140, y: OUT_FLOOR, s: 1.42, mood: "happy" })),

  page(gardenScene(), cupOfMilk(1240, 830, 0.5),
    figureG2("yasmin", { x: 620, y: OUT_FLOOR, s: 1.6, arms: "point" }),
    figureG2("amal", { x: 940, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), bunting(760, 250, 0.9),
    figureG2("theo", { x: 800, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 500, y: OUT_FLOOR, s: 1.44 }),
    figureG2("leo", { x: 1080, y: OUT_FLOOR, s: 1.42 })),

  page(gardenScene(),
    figureG2("nora", { x: 700, y: OUT_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("amal", { x: 960, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("sami", { x: 1200, y: OUT_FLOOR, s: 1.44 })),

  page(gardenScene(), motionArcs(1240, 700, 0.9), dustPuffs(900, 900),
    figureG2("yasmin", { x: 420, y: OUT_FLOOR, s: 1.6, arms: "up" }),
    figureG2("leo", { x: 780, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 1020, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), dustPuffs(760, 900), motionArcs(1180, 690, 0.85),
    figureG2("leo", { x: 900, y: OUT_FLOOR, s: 1.46, mood: "surprised" }),
    figureG2("amal", { x: 560, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), bunting(820, 250, 0.9), dustPuffs(1000, 900),
    figureG2("nora", { x: 520, y: OUT_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("sami", { x: 760, y: OUT_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("amal", { x: 1040, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), dustPuffs(1180, 900),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "sad" }),
    figureG2("theo", { x: 1120, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), dustPuffs(1080, 900), motionArcs(760, 700, 0.9),
    figureG2("theo", { x: 1060, y: OUT_FLOOR, s: 1.46, mood: "sad" }),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "surprised" })),

  page(gardenScene(), bunting(800, 250, 0.95), confetti(880, 320, 0.9),
    figureG2("amal", { x: 720, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 980, y: OUT_FLOOR, s: 1.42, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 1200, y: OUT_FLOOR, s: 1.42, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureG2("theo", { x: 1000, y: OUT_FLOOR, s: 1.46, mood: "sad" }),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.48, arms: "point" })),

  page(gardenScene(), bunting(820, 250, 0.95), confetti(860, 330, 1),
    figureG2("yasmin", { x: 400, y: OUT_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 740, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("theo", { x: 1000, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 1220, y: OUT_FLOOR, s: 1.42, mood: "happy" })),
];

// ---------------------------------------------------------------- 3.5  Reach for the Sky! (the poem)

const reachForTheSky = [
  page(gardenScene(), bunting(820, 250, 0.9), songNotes(1320, 300, 0.85),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 900, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 1120, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureG2("yasmin", { x: 560, y: OUT_FLOOR, s: 1.6, arms: "up" }),
    figureG2("amal", { x: 900, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 980, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(), songNotes(1300, 320, 0.8),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("amal", { x: 940, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("sami", { x: 990, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), motionArcs(1200, 700, 0.9),
    figureG2("theo", { x: 700, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("amal", { x: 980, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(),
    figureG2("amal", { x: 720, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureG2("nora", { x: 1000, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "point" })),

  page(gardenScene(), motionArcs(560, 700, 0.9, { flip: true }),
    figureG2("leo", { x: 800, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 1080, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(gardenScene(), dustPuffs(880, 900),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("sami", { x: 990, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 940, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 1180, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(), songNotes(520, 300, 0.85),
    figureG2("amal", { x: 760, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("yasmin", { x: 1080, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "up" })),

  page(gardenScene(), bunting(820, 250, 0.95), confetti(860, 330, 1), songNotes(1340, 300, 0.85),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 880, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 1100, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("theo", { x: 1300, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 3.6  Get Up and Move Day (the listening)

const getUpAndMoveDay = [
  page(gardenScene(), bunting(820, 250, 0.95), hoopProp(1120, 900, 0.9, { count: 2 }),
    figureG2("yasmin", { x: 420, y: OUT_FLOOR, s: 1.6, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 740, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(gardenScene(),
    figureG2("yasmin", { x: 620, y: OUT_FLOOR, s: 1.6, arms: "up" }),
    figureG2("sami", { x: 960, y: OUT_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("leo", { x: 1180, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), hoopProp(1080, 905, 1, { count: 3 }), motionArcs(660, 700, 0.9),
    figureG2("sami", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), hoopProp(1000, 905, 0.95, { count: 3 }), dustPuffs(720, 900),
    figureG2("leo", { x: 520, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), dustPuffs(1060, 900),
    figureG2("nora", { x: 780, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), flagProp(1120, 890, 0.95, { colour: A1.red }), flagProp(1320, 895, 0.85, { colour: A1.green }),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(gardenScene(), flagProp(1200, 890, 0.9, { colour: A1.blue }),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("idris", { x: 900, y: OUT_FLOOR, s: 1.3, mood: "happy", arms: "up" })),

  page(gardenScene(), drumProp(1140, 890, 0.7, { beating: true }), songNotes(1380, 320, 0.8),
    figureG2("theo", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("maya", { x: 880, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), drumProp(1160, 890, 0.66, { beating: true }),
    figureG2("theo", { x: 700, y: OUT_FLOOR, s: 1.48, mood: "surprised", arms: "up" }),
    figureG2("nora", { x: 960, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), hoopProp(1240, 905, 0.8, { count: 2 }), flagProp(400, 890, 0.8, { colour: A1.yellow }),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("sami", { x: 960, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(), cupOfMilk(1240, 830, 0.5),
    figureG2("yasmin", { x: 660, y: OUT_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 980, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(), bunting(820, 250, 0.95), confetti(880, 330, 1), songNotes(1340, 310, 0.85),
    figureG2("amal", { x: 600, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("sami", { x: 840, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 1060, y: OUT_FLOOR, s: 1.42, mood: "happy", arms: "up" }),
    figureG2("theo", { x: 1260, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 3.7  Head, Arm, Hand, Finger (the words)

const headArmHandFinger = [
  page(basicScene(), acacia(1260, 610, 1.2), bunting(820, 250, 0.85),
    zuri({ x: 600, y: 826, s: 1.22, arms: "up" }),
    kiki({ x: 1380, y: 830, s: 0.92, arms: "up" })),

  page(basicScene(), acacia(300, 630, 1.05),
    zuri({ x: 760, y: 826, s: 1.3, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1),
    zuri({ x: 700, y: 826, s: 1.3, arms: "up" }),
    kiki({ x: 1080, y: 830, s: 1, arms: "up" })),

  page(basicScene(), acacia(280, 640, 1),
    zuri({ x: 780, y: 826, s: 1.3 })),

  page(basicScene(), acacia(1320, 620, 1),
    zuri({ x: 700, y: 826, s: 1.28 }),
    kiki({ x: 1060, y: 830, s: 1 })),

  page(basicScene(), acacia(300, 630, 1.05), motionArcs(1180, 700, 0.9),
    zuri({ x: 760, y: 826, s: 1.3, arms: "up" })),

  page(basicScene(), acacia(1300, 620, 1.05), dustPuffs(900, 900),
    zuri({ x: 660, y: 826, s: 1.28, arms: "up" }),
    elephant({ x: 1080, y: 750, s: 0.7, trunkUp: true })),

  page(basicScene(), acacia(280, 630, 1.05), motionArcs(1160, 700, 0.85),
    zuri({ x: 720, y: 826, s: 1.28 })),

  page(basicScene(), acacia(1320, 620, 1),
    zuri({ x: 700, y: 826, s: 1.28, arms: "up" }),
    ostrich({ x: 1060, y: 730, s: 0.72 })),

  page(basicScene(), acacia(300, 640, 1),
    zuri({ x: 700, y: 826, s: 1.28 }),
    giraffe({ x: 1120, y: 625, s: 0.9, glasses: true })),

  page(basicScene(), acacia(1300, 620, 1.05), dustPuffs(820, 900),
    zuri({ x: 620, y: 826, s: 1.28, arms: "up" }),
    kiki({ x: 980, y: 830, s: 1, arms: "up" })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 330, 0.95), bunting(760, 250, 0.9),
    zuri({ x: 560, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 960, y: 830, s: 0.98, arms: "up" }),
    elephant({ x: 1420, y: 760, s: 0.62, trunkUp: true })),
];

// ================================================================ UNIT 4 — The Big Sky

// ---------------------------------------------------------------- 4.4  The Night Amal Counted the Stars (the Story)

const theNightAmalCountedTheStars = [
  page(nightScene(), acacia(1300, 640, 1.2),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("hana", { x: 900, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ treeX: 1320, treeScale: 1.25 }),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), castShadow(760, 930, { length: 320, dir: 1 }),
    goat({ x: 1180, y: 772, s: 0.85, flip: true }),
    figureG2("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.5, mood: "surprised", arms: "point" })),

  page(villageScene({ treeX: 1320, treeScale: 1.25 }), castShadow(700, 930, { length: 300, dir: 1 }),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureG2("adam", { x: 1000, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), castShadow(820, 930, { length: 90, dir: 1, opacity: 0.3 }),
    figureG2("amal", { x: 820, y: VILLAGE_FLOOR, s: 1.5, mood: "surprised" })),

  page(villageScene({ treeX: 1320, treeScale: 1.25 }), globeProp(1080, 800, 1.6),
    figureG2("adam", { x: 620, y: VILLAGE_FLOOR, s: 1.5, arms: "point" })),

  page(villageScene({ treeX: 280, treeScale: 1.3 }), cloudPuff(980, 300, 1.3), cloudPuff(1240, 380, 1),
    figureG2("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.5, mood: "surprised", arms: "up" })),

  page(sunsetScene(), acacia(1300, 640, 1.2),
    figureG2("hana", { x: 900, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.48, mood: "happy" })),

  page(nightScene(), acacia(280, 650, 1.15),
    figureG2("amal", { x: 780, y: VILLAGE_FLOOR, s: 1.5, mood: "surprised", arms: "up" }),
    figureG2("hana", { x: 1060, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(nightScene(), acacia(1320, 650, 1.1),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(nightScene(), acacia(300, 650, 1.15),
    figureG2("hana", { x: 1020, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.48, mood: "surprised" })),

  page(nightScene(), acacia(1300, 650, 1.15),
    figureG2("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("hana", { x: 940, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),
];

// ---------------------------------------------------------------- 4.5  My Shadow (the poem)

const myShadow = [
  page(villageScene({ treeX: 1300, treeScale: 1.25 }), castShadow(700, 930, { length: 300, dir: 1 }),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), castShadow(820, 930, { length: 280, dir: 1 }),
    figureG2("amal", { x: 820, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ treeX: 1320, treeScale: 1.2 }), castShadow(760, 930, { length: 340, dir: 1 }),
    figureG2("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.52, mood: "surprised", arms: "point" })),

  page(streetScene(), castShadow(740, 930, { length: 300, dir: 1 }),
    figureG2("amal", { x: 740, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), castShadow(700, 930, { length: 260, dir: 1 }), castShadow(1040, 930, { length: 250, dir: 1 }),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("nora", { x: 1040, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(villageScene({ treeX: 280, treeScale: 1.3 }), castShadow(800, 930, { length: 120, dir: 1, opacity: 0.3 }),
    figureG2("amal", { x: 800, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ treeX: 1320, treeScale: 1.25 }), castShadow(740, 930, { length: 100, dir: 1, opacity: 0.28 }),
    figureG2("amal", { x: 740, y: VILLAGE_FLOOR, s: 1.52, mood: "surprised" })),

  page(sunsetScene(), castShadow(680, 930, { length: 400, dir: 1 }), acacia(1320, 640, 1.15),
    figureG2("amal", { x: 680, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(sunsetScene(), castShadow(760, 930, { length: 420, dir: 1 }),
    figureG2("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(roomScene(), bedProp(1120, 900, 0.9),
    figureG2("amal", { x: 620, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(roomScene(), bedProp(1100, 900, 0.9), sleepyZs(1300, 700, 1),
    figureG2("amal", { x: 640, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(roomScene(), bedProp(1080, 900, 0.95), sleepyZs(1320, 680, 1.05), confetti(700, 320, 0.8)),
];

// ---------------------------------------------------------------- 4.6  Why We Have Day and Night (the listening)

const whyWeHaveDayAndNight = [
  page(sunsetScene(), acacia(1300, 640, 1.2),
    figureG2("amal", { x: 640, y: VILLAGE_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("adam", { x: 940, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(sunsetScene(), acacia(300, 640, 1.2),
    figureG2("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.48, mood: "surprised", arms: "point" }),
    figureG2("adam", { x: 1060, y: VILLAGE_FLOOR, s: 1.5 })),

  page(roomScene(),
    figureG2("adam", { x: 520, y: HOME_FLOOR, s: 1.5, arms: "point" }),
    torchProp(920, 780, 1.05),
    colourBall(1320, 830, 0.85, A1.orange)),

  page(plainRoomScene(), torchProp(1080, 660, 1.35),
    figureG2("adam", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), earthBall(1140, 620, 1.05, { markAt: "light" }),
    figureG2("adam", { x: 560, y: CLASS_FLOOR, s: 1.5, arms: "point" })),

  page(plainRoomScene({ wall: "#3a4657" }), torchProp(420, 620, 0.8, { beam: true }),
    earthBall(1080, 620, 1.05, { markAt: "light" })),

  page(plainRoomScene({ wall: "#3a4657" }), torchProp(420, 620, 0.8, { beam: true }),
    earthBall(1080, 620, 1.05, { markAt: "light" }),
    figureG2("amal", { x: 800, y: CLASS_FLOOR, s: 1.46, mood: "surprised", arms: "point" })),

  page(plainRoomScene({ wall: "#3a4657" }), torchProp(420, 620, 0.8, { beam: true }),
    earthBall(1080, 620, 1.05, { markAt: "dark" })),

  page(plainRoomScene({ wall: "#3a4657" }), torchProp(420, 620, 0.8, { beam: true }),
    earthBall(1080, 620, 1.05, { markAt: "dark" }),
    figureG2("amal", { x: 800, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(plainRoomScene(), earthBall(1120, 620, 1),
    figureG2("adam", { x: 520, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 800, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(nightScene(), acacia(1300, 650, 1.15),
    figureG2("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("adam", { x: 940, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), confetti(880, 320, 0.9),
    figureG2("amal", { x: 720, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("adam", { x: 1000, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),
];

// ---------------------------------------------------------------- 4.7  Sunny, Cloudy, Windy, Rainy (the words)

const sunnyCloudyWindyRainy = [
  page(basicScene(), acacia(1260, 610, 1.2), cloudPuff(880, 260, 1.1),
    zuri({ x: 560, y: 826, s: 1.22, arms: "up" }),
    kiki({ x: 1380, y: 830, s: 0.92 })),

  page(basicScene(), acacia(1320, 620, 1),
    zuri({ x: 700, y: 826, s: 1.24, arms: "up" })),

  page(basicScene(), acacia(300, 630, 1.05), cloudPuff(940, 280, 1.3), cloudPuff(1240, 350, 1),
    zuri({ x: 640, y: 826, s: 1.22 })),

  page(basicScene(), acacia(1320, 620, 1), cloudPuff(880, 280, 1.2, { grey: true }), tallGrass(1080, 930, 1.5),
    zuri({ x: 560, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(true), rain(), puddle(1020, 930, 240, 46), acacia(300, 640, 1),
    zuri({ x: 660, y: 826, s: 1.22 })),

  page(basicScene(), acacia(1320, 620, 1), tallGrass(1040, 930, 1.3),
    zuri({ x: 620, y: 826, s: 1.22 }),
    bigFlower(1280, 890, 0.9)),

  page(basicScene(), acacia(280, 630, 1.05),
    zuri({ x: 720, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 1100, y: 830, s: 1 })),

  page(basicScene(), acacia(1300, 620, 1.05), cloudPuff(900, 270, 1.2),
    zuri({ x: 600, y: 826, s: 1.22 })),

  page(basicScene(true), rain(), acacia(1320, 630, 1), puddle(700, 930, 260, 48),
    zuri({ x: 460, y: 826, s: 1.2, mood: "surprised" })),

  page(basicScene(), acacia(300, 640, 1), rainbow(1000, 560),
    zuri({ x: 680, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), cloudPuff(880, 280, 1.1),
    zuri({ x: 620, y: 826, s: 1.22 }),
    wildBird(1060, 480, 1.05, true)),

  page(basicScene(), acacia(1240, 610, 1.2), rainbow(880, 560), confetti(820, 330, 0.95),
    zuri({ x: 560, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 1360, y: 830, s: 0.94, arms: "up" })),
];

// ================================================================ UNIT 5 — Let's Measure

// ---------------------------------------------------------------- 5.4  A Fair Way to Measure (the Story)

const aFairWayToMeasure = [
  page(amalClassroom(), metreStick(1160, 850, 0.9),
    figureG2("yasmin", { x: 420, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 760, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("leo", { x: 1000, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(),
    figureG2("yasmin", { x: 620, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("nora", { x: 960, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("yasmin", { x: 1080, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),

  page(plainRoomScene(), countRow(1180, 420, 0.72, { from: 12, count: 3 }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(plainRoomScene(), countRow(1180, 420, 0.72, { from: 9, count: 3 }),
    figureG2("leo", { x: 560, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(),
    figureG2("amal", { x: 660, y: CLASS_FLOOR, s: 1.48, mood: "sad", arms: "point" }),
    figureG2("leo", { x: 960, y: CLASS_FLOOR, s: 1.46, mood: "sad", arms: "point" })),

  page(amalClassroom(),
    figureG2("nora", { x: 900, y: CLASS_FLOOR, s: 1.44, arms: "point" }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.48, mood: "surprised" }),
    figureG2("leo", { x: 1160, y: CLASS_FLOOR, s: 1.46, mood: "surprised" })),

  page(amalClassroom(), metreStick(1140, 850, 1),
    figureG2("yasmin", { x: 560, y: CLASS_FLOOR, s: 1.6, arms: "point" })),

  page(amalClassroom(), metreStick(1100, 855, 0.95), rulerProp(1420, 830, 0.7, { rotate: -8 }),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("leo", { x: 760, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(), balanceScale(1180, 840, 0.8, { tilt: -8 }),
    figureG2("sami", { x: 620, y: CLASS_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("maya", { x: 880, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(),
    figureG2("theo", { x: 1060, y: CLASS_FLOOR, s: 1.5, mood: "sad" }),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.46, arms: "point" })),

  page(amalClassroom(), confetti(880, 320, 0.95),
    figureG2("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 720, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 950, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 1160, y: CLASS_FLOOR, s: 1.42, mood: "happy" }),
    figureG2("theo", { x: 1360, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),
];

// ---------------------------------------------------------------- 5.5  One Hundred Little Fingers (the poem)

const oneHundredLittleFingers = [
  page(plainRoomScene(), tensLine(1120, 420, 1), songNotes(780, 250, 0.9), bunting(420, 96, 0.82),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(plainRoomScene(), countRow(1080, 420, 1.15, { from: 10, count: 3 }),
    figureG2("amal", { x: 480, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(plainRoomScene(), countRow(1080, 420, 1.15, { from: 40, count: 3 }),
    figureG2("leo", { x: 480, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(plainRoomScene(), countRow(1080, 420, 1.15, { from: 70, count: 3 }),
    figureG2("nora", { x: 480, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(plainRoomScene(), countRow(1060, 420, 1.3, { from: 100, count: 1 }), songNotes(1420, 300, 0.85),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 780, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(plainRoomScene(), tensLine(1120, 420, 1.05),
    figureG2("yasmin", { x: 560, y: CLASS_FLOOR, s: 1.6, arms: "point" })),

  page(plainRoomScene(), countRow(1080, 420, 1.05, { from: 10, count: 4 }),
    figureG2("amal", { x: 460, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(plainRoomScene(), countRow(1080, 420, 1.05, { from: 50, count: 4 }),
    figureG2("sami", { x: 460, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(plainRoomScene(), countRow(1120, 420, 1.15, { from: 90, count: 2 }), songNotes(560, 260, 0.85),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.5, mood: "surprised", arms: "up" })),

  page(plainRoomScene(), tensLine(1140, 420, 1),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 780, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(plainRoomScene(), countRow(1080, 420, 1.3, { from: 100, count: 1 }),
    figureG2("yasmin", { x: 520, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bunting(420, 96, 0.82), confetti(880, 320, 1), songNotes(1360, 300, 0.9),
    countRow(1120, 420, 1.1, { from: 100, count: 1 }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 800, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 5.6  How People Measured Long Ago (the listening)

const howPeopleMeasuredLongAgo = [
  page(plainRoomScene(), poster(1180, 400, 0.9, { lines: 4 }),
    figureG2("yasmin", { x: 560, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 860, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(),
    figureG2("yasmin", { x: 520, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("amal", { x: 840, y: CLASS_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("leo", { x: 1080, y: CLASS_FLOOR, s: 1.44, mood: "happy" })),

  page(amalClassroom(), rulerProp(1180, 830, 0.7, { rotate: -6 }),
    figureG2("yasmin", { x: 620, y: CLASS_FLOOR, s: 1.6, arms: "up" })),

  page(plainRoomScene(), wordTile(1120, 430, 0.95, { inner: rulerProp(0, 40, 0.42, { rotate: -8 }), tint: A1.orange }),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(plainRoomScene(), wordTile(1240, 430, 0.9, { inner: metreStick(0, 120, 0.62), tint: A1.green }),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 800, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(amalClassroom(),
    figureG2("amal", { x: 660, y: CLASS_FLOOR, s: 1.48, mood: "surprised", arms: "up" }),
    figureG2("yasmin", { x: 1000, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),

  page(plainRoomScene(), poster(1200, 400, 0.85, { lines: 3, colour: G3.teal }),
    figureG2("yasmin", { x: 600, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("leo", { x: 900, y: CLASS_FLOOR, s: 1.44, mood: "surprised" })),

  page(amalClassroom(), dustPuffs(1180, 900),
    figureG2("theo", { x: 900, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("amal", { x: 600, y: CLASS_FLOOR, s: 1.46, mood: "surprised" })),

  page(amalClassroom(), metreStick(1140, 850, 0.95),
    figureG2("yasmin", { x: 560, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("amal", { x: 880, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(amalClassroom(), rulerProp(1160, 830, 0.75, { rotate: 6 }), metreStick(1380, 855, 0.7),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("leo", { x: 820, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(plainRoomScene(), countRow(1140, 420, 1, { from: 98, count: 3 }),
    figureG2("amal", { x: 500, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(amalClassroom(), confetti(880, 320, 0.95), metreStick(1180, 855, 0.85),
    figureG2("yasmin", { x: 460, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 780, y: CLASS_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("leo", { x: 1000, y: CLASS_FLOOR, s: 1.46, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 5.7  Big and Small, Long and Short (the words)

const bigAndSmallLongAndShort = [
  page(basicScene(), acacia(1260, 610, 1.2),
    zuri({ x: 560, y: 826, s: 1.22, arms: "up" }),
    elephant({ x: 1080, y: 750, s: 0.95, trunkUp: true }),
    chick(1400, 890, 1)),

  page(basicScene(), acacia(300, 630, 1.05),
    elephant({ x: 1000, y: 750, s: 1, trunkUp: true }),
    zuri({ x: 620, y: 826, s: 1.2, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1),
    chick(1000, 858, 1.8),
    zuri({ x: 600, y: 826, s: 1.2, arms: "point" })),

  page(basicScene(), acacia(280, 640, 1),
    giraffe({ x: 1080, y: 625, s: 1 }),
    zuri({ x: 560, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1),
    zuri({ x: 700, y: 826, s: 1.24 }),
    kiki({ x: 1060, y: 830, s: 1 })),

  page(basicScene(), acacia(300, 630, 1.05), metreStick(1060, 890, 0.9),
    zuri({ x: 560, y: 826, s: 1.2, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), rulerProp(1040, 860, 0.8, { rotate: -6 }),
    zuri({ x: 560, y: 826, s: 1.2 })),

  page(basicScene(), acacia(280, 630, 1.05), balanceScale(1080, 850, 0.85, { tilt: -10 }),
    zuri({ x: 540, y: 826, s: 1.2, arms: "up" })),

  page(basicScene(), acacia(1300, 620, 1.05), flatStone(1020, 890, 1.5), bigLeaf(1240, 860, 0.9),
    zuri({ x: 560, y: 826, s: 1.2, arms: "point" })),

  page(basicScene(), acacia(300, 640, 1), river(1080, 720, 1.1),
    zuri({ x: 560, y: 826, s: 1.2 })),

  page(basicScene(), acacia(1320, 620, 1),
    giraffe({ x: 1020, y: 625, s: 0.95 }),
    zuri({ x: 560, y: 826, s: 1.2 }),
    chick(1340, 890, 1.1)),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 330, 0.95),
    zuri({ x: 520, y: 826, s: 1.24, arms: "up" }),
    elephant({ x: 980, y: 755, s: 0.85, trunkUp: true }),
    chick(1340, 890, 1.05)),
];

// ================================================================ UNIT 6 — All About Bugs

// ---------------------------------------------------------------- 6.4  Amal and the Little Garden Friends (the Story)

const amalAndTheLittleGardenFriends = [
  page(gardenScene(), butterflyBug(1080, 620, 1.2), bigFlower(1180, 880, 1.1),
    figureG2("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("adam", { x: 840, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), wildBird(1240, 500, 1.05, true), bigFlower(1080, 880, 1),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(gardenScene(), beeBug(1080, 640, 1.2),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "sad", arms: "up" })),

  page(gardenScene(), flatStone(1120, 890, 1.3),
    figureG2("adam", { x: 900, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(gardenScene(), butterflyBug(1120, 600, 1.5), bigFlower(1120, 880, 1.2),
    figureG2("amal", { x: 600, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("adam", { x: 860, y: OUT_FLOOR, s: 1.5, arms: "point" })),

  page(gardenScene(), beeBug(1100, 620, 1.4), bigFlower(1240, 880, 1),
    figureG2("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(gardenScene(), beeBug(1180, 580, 1.2),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("adam", { x: 980, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), anthill(1240, 890, 1.1),
    antBug(880, 900, 1.2), antBug(980, 905, 1.15), antBug(1080, 900, 1.2),
    figureG2("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(gardenScene(), anthill(1280, 890, 1),
    antBug(900, 900, 1.1), antBug(1000, 905, 1.05), antBug(1100, 900, 1.1),
    figureG2("adam", { x: 620, y: OUT_FLOOR, s: 1.5, arms: "point" }),
    figureG2("amal", { x: 360, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(), spiderWeb(1140, 560, 1.15), spiderBug(1140, 600, 1),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "surprised" }),
    figureG2("adam", { x: 880, y: OUT_FLOOR, s: 1.5, arms: "point" })),

  page(gardenScene(), wormBug(1080, 900, 1.3), bigLeaf(1280, 880, 0.9),
    figureG2("mina", { x: 900, y: OUT_FLOOR, s: 1.38, mood: "surprised" }),
    figureG2("amal", { x: 600, y: OUT_FLOOR, s: 1.5, arms: "up" })),

  page(homeWall(), confetti(880, 320, 0.9),
    figureG2("amal", { x: 700, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("mum", { x: 1000, y: HOME_FLOOR, s: 1.56, mood: "happy" })),
];

// ---------------------------------------------------------------- 6.5  There's a Bug on Me (the poem)

const theresABugOnMe = [
  page(gardenScene(), butterflyBug(1080, 620, 1.3), bigFlower(1200, 880, 1.05), songNotes(520, 300, 0.85),
    figureG2("amal", { x: 640, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(gardenScene(), countRow(1080, 420, 1, { from: 1, count: 3 }),
    figureG2("amal", { x: 480, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(gardenScene(), beeBug(1020, 620, 1.3),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.52, mood: "surprised", arms: "up" })),

  page(gardenScene(), butterflyBug(1000, 640, 1.2),
    figureG2("amal", { x: 680, y: OUT_FLOOR, s: 1.52, mood: "surprised" }),
    figureG2("nora", { x: 1000, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), bigFlower(1140, 880, 1.15), butterflyBug(1140, 620, 1.1),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(gardenScene(), anthill(1240, 890, 1), antBug(1020, 900, 1.15),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "surprised" })),

  page(gardenScene(), cricketBug(1100, 895, 1.3), tallGrass(1300, 920, 1.2),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "surprised" })),

  page(gardenScene(), spiderWeb(1180, 560, 1), spiderBug(1180, 600, 0.9),
    figureG2("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "surprised", arms: "up" })),

  page(gardenScene(), wormBug(1120, 900, 1.2),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(gardenScene(), beeBug(1180, 600, 1.1), butterflyBug(880, 630, 1.05),
    figureG2("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("nora", { x: 1300, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), songNotes(1320, 300, 0.85),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 980, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(), confetti(880, 320, 0.95), butterflyBug(1160, 620, 1.15), bigFlower(1260, 880, 1),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 900, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 6.6  Grandpa's Cricket (the listening)

const grandpasCricket = [
  page(gardenScene(), gardenPlant(1180, 890, 1.1), cricketJar(1400, 850, 0.55),
    figureG2("nora", { x: 620, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("grandpa", { x: 900, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), gardenPlant(1160, 890, 1.15), wateringCan(1360, 850, 0.85, { pouring: true }),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("grandpa", { x: 940, y: OUT_FLOOR, s: 1.54 })),

  page(gardenScene(),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "surprised", arms: "point" }),
    figureG2("grandpa", { x: 960, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), cricketBug(1160, 700, 1.5),
    figureG2("grandpa", { x: 780, y: OUT_FLOOR, s: 1.54, arms: "point" }),
    figureG2("nora", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "surprised" })),

  page(gardenScene(), bench(1200, 900, 1.2), cricketBug(1000, 700, 1.3),
    figureG2("grandpa", { x: 760, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("nora", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), speechPair(1200, 420, 0.7), cricketBug(980, 895, 1.2),
    figureG2("nora", { x: 620, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), cricketJar(1160, 880, 0.75),
    figureG2("grandpa", { x: 700, y: OUT_FLOOR, s: 1.54, arms: "point" })),

  page(gardenScene(), cricketJar(1160, 880, 0.78, { inner: fruitProp(0, 30, 0.22, "strawberry") }),
    figureG2("nora", { x: 700, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), cricketJar(1180, 880, 0.75),
    figureG2("grandpa", { x: 720, y: OUT_FLOOR, s: 1.54, mood: "happy", arms: "point" }),
    figureG2("nora", { x: 440, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), cricketJar(1200, 880, 0.72), bench(400, 900, 1.15),
    figureG2("nora", { x: 760, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), cricketBug(1120, 895, 1.35), tallGrass(1320, 920, 1.2),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("grandpa", { x: 940, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), confetti(880, 320, 0.9), cricketBug(1180, 895, 1.2),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("grandpa", { x: 940, y: OUT_FLOOR, s: 1.54, mood: "happy" })),
];

// ---------------------------------------------------------------- 6.7  Fly, Jump, Crawl, Spin (the words)

const flyJumpCrawlSpin = [
  page(basicScene(), acacia(1260, 610, 1.2), bigFlower(1060, 880, 1),
    zuri({ x: 560, y: 826, s: 1.22, arms: "up" }),
    butterflyBug(1000, 620, 1.2)),

  page(basicScene(), acacia(300, 630, 1.05), butterflyBug(1080, 620, 1.4), bigFlower(1240, 880, 1),
    zuri({ x: 600, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), beeBug(1040, 630, 1.35),
    zuri({ x: 580, y: 826, s: 1.22 })),

  page(basicScene(), acacia(280, 640, 1), cricketBug(1080, 895, 1.4), tallGrass(1300, 920, 1.2),
    zuri({ x: 600, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), antBug(980, 900, 1.3), antBug(1100, 905, 1.25), anthill(1320, 895, 1),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(300, 630, 1.05), spiderWeb(1140, 560, 1.1), spiderBug(1140, 600, 0.95),
    zuri({ x: 600, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), wormBug(1060, 900, 1.3),
    zuri({ x: 580, y: 826, s: 1.22 })),

  page(basicScene(), acacia(280, 630, 1.05), fallenLog(1140, 895, 1.05), antBug(940, 900, 1.15),
    zuri({ x: 580, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), beeBug(1000, 620, 1.2), bigFlower(1180, 880, 1.1),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(300, 640, 1), anthill(1200, 895, 1.15),
    antBug(880, 900, 1.2), antBug(980, 905, 1.15), antBug(1080, 900, 1.2),
    zuri({ x: 540, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), spiderWeb(1120, 560, 1.05), butterflyBug(880, 630, 1.1),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 330, 0.95),
    butterflyBug(1000, 620, 1.15), beeBug(1180, 640, 1.05), antBug(880, 900, 1.15),
    zuri({ x: 520, y: 826, s: 1.24, arms: "up" })),
];

// ================================================================ UNIT 7 — The World Around Us

// ---------------------------------------------------------------- 7.4  Amal and the Little Tree (the Story)

const amalAndTheLittleTree = [
  page(villageScene({ treeX: 1240, treeScale: 1.6 }), river(400, 720, 1),
    figureG2("amal", { x: 760, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("hana", { x: 1040, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ treeX: 1300, treeScale: 1.55 }), wildBird(1060, 480, 1.05, true),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), litterBits(1080, 900, 1.2),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.5, mood: "sad", arms: "point" }),
    figureG2("adam", { x: 980, y: VILLAGE_FLOOR, s: 1.5, mood: "sad" })),

  page(villageScene({ treeX: 1320, treeScale: 1.25 }), recycleBin(1120, 890, 0.95), litterBits(800, 905, 0.9),
    figureG2("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("nora", { x: 820, y: VILLAGE_FLOOR, s: 1.44, mood: "happy" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), recycleBin(1160, 890, 1),
    figureG2("nora", { x: 760, y: VILLAGE_FLOOR, s: 1.46, arms: "point" }),
    figureG2("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ dry: true, treeX: 1340, treeScale: 1.1 }), river(900, 760, 0.7),
    figureG2("amal", { x: 640, y: VILLAGE_FLOOR, s: 1.5, mood: "sad" }),
    figureG2("hana", { x: 940, y: VILLAGE_FLOOR, s: 1.52 })),

  page(villageScene({ dry: true, treeX: 300, treeScale: 1.15 }), seedProp(1180, 890, 1.2),
    figureG2("hana", { x: 900, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 1320, treeScale: 1.2 }), dugHole(1040, 900, 1.1), dugHole(1240, 905, 1),
    figureG2("amal", { x: 600, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("adam", { x: 860, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 300, treeScale: 1.25 }), dugHole(1100, 900, 1),
    figureG2("theo", { x: 880, y: VILLAGE_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 1320, treeScale: 1.2 }), plantStage(1080, 900, 1.3, "sprout"),
    wateringCan(820, 850, 0.9, { pouring: true }),
    figureG2("amal", { x: 520, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 280, treeScale: 1.3 }), sapling(1080, 895, 1.2), sapling(1300, 900, 1),
    bigFlower(880, 890, 0.95),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(nightScene(), acacia(1300, 650, 1.2), sapling(900, 900, 1.1), sapling(1080, 905, 0.95),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("hana", { x: 380, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),
];

// ---------------------------------------------------------------- 7.5  Painted Blue and Green (the poem)

const paintedBlueAndGreen = [
  page(villageScene({ treeX: 1280, treeScale: 1.45 }), cloudPuff(760, 260, 1.2), songNotes(420, 320, 0.85),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.3 }), cloudPuff(1000, 260, 1.3),
    figureG2("amal", { x: 740, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 1320, treeScale: 1.3 }), cloudPuff(880, 270, 1.15),
    figureG2("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(gardenScene(), gardenPlant(1140, 890, 1.15), bigFlower(1340, 890, 1),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(gardenScene(), gardenPlant(1080, 890, 1.2), gardenPlant(1300, 895, 1),
    figureG2("nora", { x: 660, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("amal", { x: 400, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(villageScene({ treeX: 1300, treeScale: 1.4 }), wildBird(1000, 470, 1.1, true), wildBird(820, 520, 0.95, true),
    figureG2("amal", { x: 600, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" })),

  page(villageScene({ treeX: 300, treeScale: 1.35 }), cloudPuff(1040, 280, 1.2),
    figureG2("amal", { x: 700, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("adam", { x: 980, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), sapling(1140, 895, 1.15), plantParts(1380, 830, 0.55),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(villageScene({ treeX: 1320, treeScale: 1.3 }), river(900, 730, 1.05),
    figureG2("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ treeX: 300, treeScale: 1.35 }), cloudPuff(1060, 270, 1.25), songNotes(760, 320, 0.8),
    figureG2("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 940, y: VILLAGE_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(gardenScene(), gardenPlant(1120, 890, 1.2), butterflyBug(940, 620, 1.1),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(villageScene({ treeX: 1280, treeScale: 1.45 }), rainbow(880, 560), confetti(820, 330, 0.95), songNotes(460, 310, 0.85),
    figureG2("amal", { x: 660, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 940, y: VILLAGE_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 7.6  A Family on Mother Earth Day (the listening)

const aFamilyOnMotherEarthDay = [
  page(gardenScene(), sapling(1140, 895, 1.1), recycleBin(1360, 890, 0.8),
    figureG2("sami", { x: 620, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("dad", { x: 900, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), bench(1180, 900, 1.2),
    figureG2("sami", { x: 800, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), dugHole(1080, 900, 1.1), sapling(1300, 895, 1),
    figureG2("dad", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("uncle", { x: 880, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), sapling(980, 895, 1.05), sapling(1140, 900, 0.95), sapling(1300, 895, 1),
    figureG2("uncle", { x: 620, y: OUT_FLOOR, s: 1.54, arms: "point" })),

  page(gardenScene(), wildBird(1180, 500, 1.1, true), wildBird(1360, 560, 0.95, true), notepad(880, 830, 0.85),
    figureG2("mum", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), notepad(1160, 830, 0.9),
    figureG2("mum", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("salma", { x: 880, y: OUT_FLOOR, s: 1.52, mood: "happy" })),

  page(streetScene(), litterBits(1080, 900, 1.2), recycleBin(1320, 885, 0.9),
    figureG2("adam", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("leo", { x: 880, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), recycleBin(1180, 885, 1),
    figureG2("adam", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(roomScene(), childDrawing(1200, 800, 0.9),
    figureG2("sami", { x: 620, y: HOME_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("hana", { x: 900, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(roomScene(), childDrawing(1180, 800, 0.85), bigFlower(1420, 900, 0.7),
    figureG2("sami", { x: 700, y: HOME_FLOOR, s: 1.46, mood: "happy", arms: "up" })),

  page(gardenScene(), sapling(1060, 895, 1.15), sapling(1240, 900, 1), sapling(1400, 895, 0.9),
    figureG2("sami", { x: 620, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("dad", { x: 880, y: OUT_FLOOR, s: 1.54, mood: "happy" })),

  page(gardenScene(), confetti(880, 320, 0.9), sapling(1140, 895, 1.1),
    figureG2("sami", { x: 560, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("mum", { x: 800, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("dad", { x: 1040, y: OUT_FLOOR, s: 1.54, mood: "happy" })),
];

// ---------------------------------------------------------------- 7.7  Roots, Stem, Leaves, Flower (the words)

const rootsStemLeavesFlower = [
  page(basicScene(), acacia(1260, 610, 1.2), plantParts(1000, 800, 0.72),
    zuri({ x: 520, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(300, 630, 1.05), plantParts(1080, 790, 0.85),
    zuri({ x: 560, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), plantStage(1060, 900, 1.4, "seed"),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(280, 640, 1), plantStage(1080, 900, 1.4, "sprout"),
    zuri({ x: 580, y: 826, s: 1.22 })),

  page(basicScene(), acacia(1320, 620, 1), gardenPlant(1080, 895, 1.2),
    zuri({ x: 560, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(300, 630, 1.05), bigFlower(1080, 885, 1.35),
    zuri({ x: 580, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), bigLeaf(1080, 860, 1.1), bigLeaf(1280, 880, 0.85),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(280, 630, 1.05), seedProp(1080, 890, 1.3),
    zuri({ x: 580, y: 826, s: 1.22 })),

  page(basicScene(), acacia(1320, 620, 1), wateringCan(1060, 850, 1, { pouring: true }), plantStage(1280, 900, 1.1, "sprout"),
    zuri({ x: 540, y: 826, s: 1.22 })),

  page(basicScene(), acacia(300, 640, 1), sapling(1080, 895, 1.25),
    zuri({ x: 560, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), gardenPlant(1000, 895, 1.15), butterflyBug(880, 630, 1.05),
    zuri({ x: 520, y: 826, s: 1.22 })),

  page(basicScene(), acacia(1240, 610, 1.2), confetti(820, 330, 0.95), gardenPlant(1000, 895, 1.1), bigFlower(1360, 890, 1),
    zuri({ x: 520, y: 826, s: 1.24, arms: "up" })),
];

// ================================================================ UNIT 8 — Home, Sweet Home

// ---------------------------------------------------------------- 8.4  Helping Hands at Home (the Story)

const helpingHandsAtHome = [
  page(roomScene(), sofaProp(1180, 890, 0.8), rugProp(760, 930, 0.85),
    figureG2("amal", { x: 520, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("idris", { x: 780, y: HOME_FLOOR, s: 1.3, mood: "happy" })),

  page(roomScene(), sofaProp(1200, 890, 0.75),
    figureG2("mum", { x: 700, y: HOME_FLOOR, s: 1.56, mood: "happy" }),
    figureG2("amal", { x: 420, y: HOME_FLOOR, s: 1.48, mood: "surprised" })),

  page(roomScene(), sofaProp(1180, 890, 0.78),
    figureG2("idris", { x: 800, y: HOME_FLOOR, s: 1.32, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 540, y: HOME_FLOOR, s: 1.48, mood: "happy" })),

  page(roomScene(), sofaProp(1160, 890, 0.8), rugProp(700, 930, 0.9),
    figureG2("amal", { x: 460, y: HOME_FLOOR, s: 1.48, mood: "sad", arms: "point" })),

  page(roomScene(), roomBox(1140, 800, 0.62, "bedroom"),
    figureG2("amal", { x: 520, y: HOME_FLOOR, s: 1.48, mood: "happy" })),

  page(roomScene(), bedProp(1140, 900, 0.9),
    figureG2("amal", { x: 560, y: HOME_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("idris", { x: 820, y: HOME_FLOOR, s: 1.3, mood: "happy" })),

  page(roomScene(), broomProp(1120, 920, 0.85), rugProp(760, 930, 0.85),
    figureG2("amal", { x: 560, y: HOME_FLOOR, s: 1.48, mood: "happy" })),

  page(roomScene(), roomBox(1140, 800, 0.62, "living"),
    figureG2("idris", { x: 560, y: HOME_FLOOR, s: 1.32, mood: "happy" })),

  page(roomScene(), sinkProp(1160, 880, 0.85, { running: true }),
    figureG2("amal", { x: 620, y: HOME_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("idris", { x: 880, y: HOME_FLOOR, s: 1.3, mood: "happy" })),

  page(roomScene(), roomBox(1140, 800, 0.62, "kitchen"),
    figureG2("mum", { x: 540, y: HOME_FLOOR, s: 1.56, mood: "happy" })),

  page(roomScene(), treeHouse(1220, 860, 0.75),
    figureG2("dad", { x: 620, y: HOME_FLOOR, s: 1.56, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 380, y: HOME_FLOOR, s: 1.46, mood: "surprised", arms: "up" })),

  page(roomScene(), confetti(880, 300, 0.9), sofaProp(1240, 890, 0.7), rugProp(700, 930, 0.85),
    figureG2("hana", { x: 1000, y: HOME_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("amal", { x: 480, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("idris", { x: 740, y: HOME_FLOOR, s: 1.3, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 8.5  A Nest Is a Home for a Bird (the poem)

const aNestIsAHomeForABird = [
  page(basicScene(), acacia(1220, 600, 1.4), nest(1200, 470, 1.5), songNotes(560, 300, 0.85),
    wildBird(1360, 500, 1.05),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1200, 600, 1.45), nest(1180, 470, 1.7),
    wildBird(1180, 430, 1.1),
    figureG2("amal", { x: 600, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(gardenScene(), beehive(1140, 830, 1), beeBug(880, 640, 1.2),
    figureG2("amal", { x: 600, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(gardenScene(), burrow(1140, 895, 1.1),
    rabbitProp(1140, 880, 0.9),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), house(1140, 890, 1.05),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1240, 605, 1.35), nest(1220, 475, 1.4),
    wildBird(1000, 500, 1.05, true),
    figureG2("amal", { x: 560, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), beehive(1180, 830, 1.05), beeBug(940, 630, 1.15), beeBug(1060, 660, 1),
    figureG2("nora", { x: 620, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), burrow(1180, 895, 1.05), rabbitProp(1180, 880, 0.85),
    figureG2("nora", { x: 640, y: OUT_FLOOR, s: 1.44, mood: "happy" }),
    figureG2("amal", { x: 380, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(streetScene(), house(1160, 890, 1), flatBlock(400, 700, 0.75),
    figureG2("amal", { x: 720, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), house(1180, 890, 1.05),
    figureG2("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("mum", { x: 900, y: OUT_FLOOR, s: 1.56, mood: "happy" })),

  page(basicScene(), acacia(1240, 605, 1.3), nest(1220, 475, 1.3), songNotes(600, 300, 0.85),
    wildBird(1000, 480, 1, true),
    figureG2("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(streetScene(), house(1180, 890, 1), confetti(820, 320, 0.95), songNotes(520, 300, 0.9),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 8.6  Theo's Tree House (the listening)

const theosTreeHouse = [
  page(gardenScene(), treeHouse(1140, 860, 1),
    figureG2("theo", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(gardenScene(), treeHouse(1180, 860, 0.95),
    figureG2("theo", { x: 660, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("dad", { x: 940, y: OUT_FLOOR, s: 1.56, mood: "happy" })),

  page(gardenScene(), ladder(1180, 895, 1),
    figureG2("dad", { x: 700, y: OUT_FLOOR, s: 1.56, mood: "happy", arms: "up" })),

  page(gardenScene(), treeHouse(1160, 860, 1),
    figureG2("dad", { x: 620, y: OUT_FLOOR, s: 1.56, arms: "point" }),
    figureG2("theo", { x: 380, y: OUT_FLOOR, s: 1.46, mood: "surprised" })),

  page(gardenScene(), treeHouse(1140, 860, 1.05), ladder(920, 895, 0.9),
    figureG2("theo", { x: 600, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" })),

  page(gardenScene(), ladder(1140, 895, 1.05), countRow(700, 400, 0.7, { from: 1, count: 4 }),
    figureG2("theo", { x: 420, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(), treeHouse(1180, 860, 0.95), bookShelf(700, 430, 0.8),
    figureG2("theo", { x: 480, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" })),

  page(gardenScene(), treeHouse(1160, 860, 1),
    figureG2("theo", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("sami", { x: 880, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(gardenScene(), treeHouse(1180, 860, 0.95),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("idris", { x: 880, y: OUT_FLOOR, s: 1.3, mood: "happy", arms: "up" })),

  page(gardenScene(), treeHouse(1140, 860, 1), ladder(900, 895, 0.85),
    figureG2("theo", { x: 600, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 360, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), treeHouse(1160, 860, 1), basketOf(760, 890, 0.55, { inner: fruitProp(0, 10, 0.3, "banana") }),
    figureG2("theo", { x: 520, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(), treeHouse(1140, 860, 1.05), confetti(820, 320, 0.9),
    figureG2("theo", { x: 560, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("sami", { x: 800, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 380, y: OUT_FLOOR, s: 1.46, mood: "happy" })),
];

// ---------------------------------------------------------------- 8.7  Bed, Table, Chair, Sofa (the words)

const bedTableChairSofa = [
  page(basicScene(), acacia(1260, 610, 1.2), sofaProp(1000, 890, 0.7), rugProp(620, 930, 0.7),
    zuri({ x: 520, y: 826, s: 1.22, arms: "up" })),

  page(plainRoomScene(), bedProp(1140, 900, 0.95),
    zuri({ x: 560, y: 826, s: 1.24, arms: "point" })),

  page(plainRoomScene(), schoolTable(1160, CLASS_FLOOR, 1.35),
    zuri({ x: 560, y: 826, s: 1.24 })),

  page(plainRoomScene(), schoolChair(1160, CLASS_FLOOR, 1.3),
    zuri({ x: 560, y: 826, s: 1.24, arms: "point" })),

  page(plainRoomScene(), sofaProp(1140, 900, 0.85),
    zuri({ x: 540, y: 826, s: 1.24 })),

  page(plainRoomScene(), sinkProp(1160, 890, 0.9),
    zuri({ x: 560, y: 826, s: 1.24, arms: "up" })),

  page(plainRoomScene(), rugProp(1120, 930, 1),
    zuri({ x: 540, y: 826, s: 1.24, arms: "point" })),

  page(plainRoomScene(), roomBox(1120, 800, 0.62, "bedroom"),
    zuri({ x: 480, y: 826, s: 1.2 })),

  page(plainRoomScene(), roomBox(1120, 800, 0.62, "kitchen"),
    zuri({ x: 480, y: 826, s: 1.2 })),

  page(plainRoomScene(), roomBox(1120, 800, 0.62, "bathroom"),
    zuri({ x: 480, y: 826, s: 1.2 })),

  page(plainRoomScene(), roomBox(1120, 800, 0.62, "living"),
    zuri({ x: 480, y: 826, s: 1.2, arms: "up" })),

  page(plainRoomScene(), confetti(880, 300, 0.9), sofaProp(1160, 900, 0.75), rugProp(760, 930, 0.75),
    zuri({ x: 500, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 900, y: 830, s: 0.95, arms: "up" })),
];

// ================================================================ UNIT 9 — Let's Explore the City!

// ---------------------------------------------------------------- 9.4  The Stranger with the Map (the Story)

const theStrangerWithTheMap = [
  page(streetScene(), cityBuildings(1120, 690, 0.95), trafficRow(760, 900, 0.8),
    figureG2("amal", { x: 400, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("adam", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), townBus(1080, 830, 1),
    figureG2("amal", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("adam", { x: 720, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), cityBuildings(1100, 680, 1), helicopterProp(700, 320, 0.85), trafficRow(880, 905, 0.85),
    figureG2("amal", { x: 400, y: OUT_FLOOR, s: 1.46, mood: "surprised", arms: "up" })),

  page(streetScene(), marketStall(1120, 880, 1.1), shopRow(340, 700, 0.7),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureG2("adam", { x: 860, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), shoppingCentre(1160, 700, 0.85), mapProp(760, 800, 0.9),
    figureG2("grandpa", { x: 620, y: OUT_FLOOR, s: 1.54, mood: "sad" }),
    figureG2("amal", { x: 360, y: OUT_FLOOR, s: 1.46, mood: "surprised" })),

  page(streetScene(), mapProp(1140, 800, 0.95),
    figureG2("grandpa", { x: 880, y: OUT_FLOOR, s: 1.54, mood: "sad" }),
    figureG2("adam", { x: 600, y: OUT_FLOOR, s: 1.5 }),
    figureG2("amal", { x: 360, y: OUT_FLOOR, s: 1.46 })),

  page(streetScene(), trafficLights(1180, 880, 0.85, { lit: "red" }),
    figureG2("adam", { x: 620, y: OUT_FLOOR, s: 1.5, arms: "point" }),
    figureG2("grandpa", { x: 900, y: OUT_FLOOR, s: 1.54 })),

  page(streetScene(), crossing(1080, 880, 1, { sign: false }), trafficLights(1400, 880, 0.75, { lit: "green" }),
    figureG2("amal", { x: 520, y: OUT_FLOOR, s: 1.46, mood: "happy" }),
    figureG2("grandpa", { x: 760, y: OUT_FLOOR, s: 1.54 }),
    figureG2("adam", { x: 300, y: OUT_FLOOR, s: 1.5 })),

  page(streetScene(), hospital(1160, 720, 0.8),
    figureG2("grandpa", { x: 760, y: OUT_FLOOR, s: 1.54, mood: "happy", arms: "up" }),
    figureG2("amal", { x: 480, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(streetScene(), libraryBuilding(1140, 720, 0.9),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("adam", { x: 880, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(coastScene(), ferryBoat(1080, 700, 1), ferrisWheel(360, 640, 0.8),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.48, mood: "surprised", arms: "up" }),
    figureG2("adam", { x: 940, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(), confetti(880, 300, 0.9),
    figureG2("amal", { x: 700, y: HOME_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureG2("mum", { x: 1000, y: HOME_FLOOR, s: 1.56, mood: "happy" })),
];

// ---------------------------------------------------------------- 9.5  At the Zebra Crossing (the poem)

const atTheZebraCrossing = [
  page(streetScene(), crossing(1080, 880, 1.05, { sign: false }), cityBuildings(1200, 690, 0.8), songNotes(520, 300, 0.85),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(streetScene(), crossing(1060, 880, 1.05, { sign: false }), trafficLights(1400, 880, 0.75, { lit: "red" }),
    figureG2("amal", { x: 600, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), cityBuildings(1080, 680, 1), shopRow(360, 700, 0.7),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), shopRow(1180, 700, 0.95), lampPost(420, 880, 1),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("karim", { x: 960, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureG2("nadia", { x: 1400, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(streetScene(), crossing(1060, 880, 1, { sign: false }),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(streetScene(), crossing(1040, 880, 1, { sign: false }), trafficLights(1380, 880, 0.75, { lit: "red" }),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "sad" })),

  page(streetScene(), crossing(1060, 880, 1, { sign: false }), trafficLights(1380, 880, 0.75, { lit: "green" }),
    figureG2("nora", { x: 880, y: OUT_FLOOR, s: 1.44, mood: "surprised", arms: "up" }),
    figureG2("amal", { x: 600, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(streetScene(), crossing(1000, 880, 1.05, { sign: false }), dustPuffs(700, 900),
    figureG2("amal", { x: 660, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 900, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(streetScene(), crossing(1020, 880, 1.05, { sign: false }), trafficRow(1360, 900, 0.7),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("nora", { x: 860, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), shopRow(1180, 700, 0.95), libraryBuilding(400, 720, 0.6),
    figureG2("amal", { x: 760, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(streetScene(), cityBuildings(1120, 690, 0.9), lampPost(400, 880, 1),
    figureG2("amal", { x: 700, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("nora", { x: 940, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), crossing(1040, 880, 1.05, { sign: false }), confetti(820, 320, 0.95), songNotes(500, 300, 0.9),
    figureG2("amal", { x: 620, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("nora", { x: 860, y: OUT_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 9.6  The City from the Sky (the listening)

const theCityFromTheSky = [
  page(streetScene(), helicopterProp(1060, 340, 1.05), cityBuildings(1200, 690, 0.75),
    figureG2("leo", { x: 560, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("dad", { x: 820, y: OUT_FLOOR, s: 1.56, mood: "happy" })),

  page(streetScene(), helicopterProp(1080, 400, 1.1),
    figureG2("dad", { x: 620, y: OUT_FLOOR, s: 1.56, arms: "point" }),
    figureG2("leo", { x: 380, y: OUT_FLOOR, s: 1.46, mood: "surprised" })),

  page(basicScene(), cityBuildings(820, 780, 0.55), helicopterProp(900, 300, 1.15),
    cloudPuff(400, 260, 1.1)),

  page(basicScene(), cityBuildings(880, 800, 0.5), trafficRow(880, 900, 0.55), helicopterProp(1000, 300, 1),
    cloudPuff(360, 280, 1)),

  page(basicScene(), libraryBuilding(880, 800, 0.6), shoppingCentre(1240, 790, 0.5), helicopterProp(560, 300, 0.95)),

  page(basicScene(), shoppingCentre(940, 790, 0.6), helicopterProp(500, 320, 0.9), cloudPuff(1280, 280, 1)),

  page(basicScene(), river(880, 740, 1.3), ferryBoat(1100, 820, 0.75), helicopterProp(520, 300, 0.9)),

  page(basicScene(), ferrisWheel(940, 760, 0.75), helicopterProp(480, 300, 0.9), cloudPuff(1300, 270, 1)),

  page(basicScene(), cityBuildings(900, 790, 0.55), ferrisWheel(1300, 770, 0.6), helicopterProp(520, 310, 0.9)),

  page(streetScene(), helicopterProp(1060, 380, 1.05),
    figureG2("leo", { x: 560, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("dad", { x: 820, y: OUT_FLOOR, s: 1.56, mood: "happy" })),

  page(streetScene(), cityBuildings(1160, 690, 0.85),
    figureG2("leo", { x: 620, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "point" }),
    figureG2("dad", { x: 880, y: OUT_FLOOR, s: 1.56, mood: "happy" })),

  page(streetScene(), helicopterProp(1080, 360, 1), confetti(760, 300, 0.9),
    figureG2("leo", { x: 560, y: OUT_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureG2("dad", { x: 820, y: OUT_FLOOR, s: 1.56, mood: "happy" })),
];

// ---------------------------------------------------------------- 9.7  Amazing, Huge and a Little Bit Scary (the words)

const amazingHugeAndALittleBitScary = [
  page(aquariumRoom(), aquariumTank(1060, 480, 0.95, { inner: `${seaTurtle(-120, 60, 0.55)}${octopus(140, 20, 0.5)}` }),
    zuri({ x: 480, y: 826, s: 1.22, arms: "up" })),

  page(aquariumRoom(), aquariumTank(1060, 480, 1, { inner: octopus(0, 20, 1.1) }),
    zuri({ x: 480, y: 826, s: 1.22, arms: "point" })),

  page(aquariumRoom(), aquariumTank(1060, 480, 1, { inner: penguin(0, 70, 1.25) }),
    zuri({ x: 480, y: 826, s: 1.22 })),

  page(aquariumRoom(), aquariumTank(1060, 480, 1, { inner: seaTurtle(0, 40, 1.15) }),
    zuri({ x: 480, y: 826, s: 1.22, arms: "up" })),

  page(aquariumRoom(), aquariumTank(1060, 480, 1, { inner: shark(0, 30, 1.15) }),
    zuri({ x: 480, y: 826, s: 1.22, mood: "surprised" })),

  page(aquariumRoom(), aquariumTank(1060, 480, 1, { inner: `${shark(-60, 20, 0.55)}${penguin(140, 90, 0.6)}` }),
    zuri({ x: 480, y: 826, s: 1.22, mood: "surprised" }),
    kiki({ x: 760, y: 830, s: 0.95 })),

  page(basicScene(), cityBuildings(1000, 700, 1),
    zuri({ x: 500, y: 826, s: 1.22, mood: "surprised", arms: "up" })),

  page(basicScene(), clockTower(1080, 900, 1.05),
    zuri({ x: 520, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), ferrisWheel(1080, 760, 0.85),
    zuri({ x: 500, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), libraryBuilding(1100, 720, 0.95),
    zuri({ x: 520, y: 826, s: 1.22 })),

  page(basicScene(), cityBuildings(1060, 700, 0.9), lampPost(420, 880, 1),
    zuri({ x: 700, y: 826, s: 1.22 }),
    kiki({ x: 1000, y: 830, s: 0.95 })),

  page(aquariumRoom(), aquariumTank(1060, 480, 0.95, { inner: `${seaTurtle(-120, 50, 0.5)}${shark(120, 20, 0.5)}${penguin(0, 100, 0.5)}` }),
    zuri({ x: 480, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 780, y: 830, s: 0.95, arms: "up" })),
];

// ================================================================ UNIT 10 — My English World (capstone)

// ---------------------------------------------------------------- 10.4  Amal's English World (the Story)

const amalsEnglishWorld = [
  page(amalClassroom(), bunting(420, 96, 0.82), learningFolder(1200, 850, 0.85),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), learningFolder(1140, 850, 1),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), greetingCard(1160, 820, 1.05),
    figureG2("amal", { x: 580, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), poster(1160, 420, 0.9, { lines: 4 }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), childDrawing(1180, 800, 0.9),
    figureG2("amal", { x: 580, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(amalClassroom(),
    figureG2("yasmin", { x: 480, y: CLASS_FLOOR, s: 1.6, mood: "happy", arms: "point" }),
    figureG2("amal", { x: 820, y: CLASS_FLOOR, s: 1.48, mood: "happy" }),
    figureG2("nora", { x: 1060, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(), schoolTable(1160, CLASS_FLOOR, 1.4, { item: `${openBook(-60, 0, 0.5)}${pencilProp(120, -40, 0.3, { colour: A1.blue })}` }),
    figureG2("amal", { x: 600, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), madeBook(1160, 790, 1, { title: "My English World" }),
    figureG2("amal", { x: 580, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), easel(1180, 780, 0.9, { inner: childDrawing(0, -30, 0.5) }),
    figureG2("amal", { x: 600, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82), easel(1220, 790, 0.85, { inner: childDrawing(0, -30, 0.45) }),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "surprised" }),
    figureG2("nora", { x: 960, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(880, 320, 0.95),
    figureG2("amal", { x: 660, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("hana", { x: 960, y: CLASS_FLOOR, s: 1.54, mood: "happy" }),
    figureG2("leo", { x: 1220, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),

  page(plainRoomScene(), learningFolder(1180, 855, 0.85),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),
];

// ---------------------------------------------------------------- 10.5  Ten Units, One Year (the review rhyme)

const tenUnitsOneYear = [
  page(amalClassroom(), bunting(420, 96, 0.82), songNotes(1300, 260, 0.9), learningFolder(1220, 855, 0.75),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(plainRoomScene(), bookShelf(340, 400, 1.15), calendarBoard(1120, 420, 1.5, { ring: 1 }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), fireKit(1080, 860, 1.15),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), hoopProp(1120, 910, 0.95, { count: 2 }), motionArcs(760, 700, 0.9), dustPuffs(1120, 905),
    figureG2("amal", { x: 520, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(plainRoomScene(), castShadow(1140, 930, { length: 260, dir: 1 }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy" }),
    figureG2("nora", { x: 1140, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(plainRoomScene(), tensLine(1120, 420, 1),
    figureG2("amal", { x: 500, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), wordTile(1120, 430, 0.9, { inner: butterflyBug(0, 0, 1.1), tint: A1.purple }),
    figureG2("amal", { x: 540, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), wordTile(1120, 430, 0.9, { inner: plantParts(0, 60, 0.42), tint: A1.green }),
    figureG2("amal", { x: 540, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), roomBox(1120, 800, 0.6, "living"),
    figureG2("amal", { x: 500, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(plainRoomScene(), wordTile(1120, 430, 0.9, { inner: libraryBuilding(0, 96, 0.42), tint: A1.blue }),
    figureG2("amal", { x: 540, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), madeBook(1160, 790, 0.95, { title: "My English World" }), songNotes(560, 300, 0.85),
    figureG2("amal", { x: 600, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(880, 320, 1), songNotes(1320, 270, 0.9),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("leo", { x: 1000, y: CLASS_FLOOR, s: 1.44, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 10.6  The Sentence I Fixed (the listening)

const theSentenceIFixed = [
  page(amalClassroom(), schoolTable(1160, CLASS_FLOOR, 1.4, { item: `${openBook(-60, 0, 0.5)}${pencilProp(120, -40, 0.32, { colour: A1.red })}` }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(amalClassroom(), learningFolder(1200, 855, 0.8),
    figureG2("amal", { x: 640, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), poster(1140, 420, 0.9, { lines: 3 }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "surprised" })),

  page(plainRoomScene(), poster(1200, 420, 0.9, { lines: 3 }), fireKit(680, 860, 1),
    figureG2("amal", { x: 400, y: CLASS_FLOOR, s: 1.48, mood: "surprised", arms: "point" })),

  page(amalClassroom(),
    figureG2("yasmin", { x: 560, y: CLASS_FLOOR, s: 1.6, arms: "point" }),
    figureG2("amal", { x: 880, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(amalClassroom(), schoolTable(1160, CLASS_FLOOR, 1.4, { item: pencilProp(0, -40, 0.36, { colour: A1.red }) }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(), poster(1140, 420, 0.9, { lines: 4, colour: G3.leafy }),
    figureG2("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(plainRoomScene(), castShadow(1180, 930, { length: 280, dir: 1 }), poster(760, 420, 0.7, { lines: 3 }),
    figureG2("amal", { x: 1180, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(amalClassroom(),
    figureG2("amal", { x: 660, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureG2("nora", { x: 960, y: CLASS_FLOOR, s: 1.42, mood: "happy" })),

  page(amalClassroom(), schoolTable(1160, CLASS_FLOOR, 1.4, { item: madeBook(0, -66, 0.34, { title: "My English World" }) }),
    figureG2("amal", { x: 620, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(amalClassroom(),
    figureG2("yasmin", { x: 500, y: CLASS_FLOOR, s: 1.6, mood: "happy" }),
    figureG2("amal", { x: 820, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(amalClassroom(), bunting(420, 96, 0.82), confetti(880, 320, 0.95),
    figureG2("amal", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureG2("yasmin", { x: 400, y: CLASS_FLOOR, s: 1.6, mood: "happy" })),
];

// ---------------------------------------------------------------- 10.7  Nine Words for Year Three (the words)

const nineWordsForYearThree = [
  page(basicScene(), acacia(1260, 610, 1.2), bunting(820, 250, 0.9), confetti(760, 330, 0.85),
    zuri({ x: 560, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 1360, y: 830, s: 0.94, arms: "up" })),

  page(basicScene(), acacia(300, 630, 1.05), calendarBoard(1080, 900, 1.15, { ring: 1 }),
    zuri({ x: 600, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), fireKit(1020, 860, 1.15),
    zuri({ x: 560, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(280, 640, 1), hoopProp(1120, 905, 0.95, { count: 2 }), motionArcs(880, 700, 0.9), dustPuffs(1120, 900),
    zuri({ x: 600, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), castShadow(620, 930, { length: 280, dir: 1 }),
    zuri({ x: 620, y: 826, s: 1.22 })),

  page(basicScene(), acacia(300, 630, 1.05), tensLine(1080, 840, 1),
    zuri({ x: 520, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), butterflyBug(1040, 620, 1.3), anthill(1280, 895, 0.95),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(280, 630, 1.05), gardenPlant(1080, 895, 1.15), sapling(1300, 900, 0.95),
    zuri({ x: 560, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1320, 620, 1), burrow(1080, 895, 1.1), nest(1320, 700, 1.2),
    zuri({ x: 560, y: 826, s: 1.22 })),

  page(basicScene(), acacia(300, 640, 1), libraryBuilding(1100, 720, 0.85),
    zuri({ x: 560, y: 826, s: 1.22, arms: "point" })),

  page(basicScene(), acacia(1320, 620, 1), madeBook(1080, 790, 0.85, { title: "My English World" }),
    zuri({ x: 540, y: 826, s: 1.22, arms: "up" })),

  page(basicScene(), acacia(1240, 610, 1.2), rainbow(880, 560), confetti(820, 330, 1), bunting(760, 250, 0.9),
    zuri({ x: 520, y: 826, s: 1.24, arms: "up" }),
    kiki({ x: 900, y: 830, s: 0.96, arms: "up" }),
    giraffe({ x: 1420, y: 625, s: 0.85, glasses: true })),
];

// ---------------------------------------------------------------- books

const books = {
  // Unit 1
  "amals-first-week": { dir: "amals-first-week", pages: amalsFirstWeek },
  "when-i-open-up-a-book": { dir: "when-i-open-up-a-book", pages: whenIOpenUpABook },
  "seven-days-make-one-week": { dir: "seven-days-make-one-week", pages: sevenDaysMakeOneWeek },
  "the-first-the-second-the-third": { dir: "the-first-the-second-the-third", pages: theFirstTheSecondTheThird },
  // Unit 2
  "the-helpers-of-warta-street": { dir: "the-helpers-of-warta-street", pages: theHelpersOfWartaStreet },
  "my-neighbourhood": { dir: "my-neighbourhood", pages: myNeighbourhood },
  "firefighter-leila-comes-to-class": { dir: "firefighter-leila-comes-to-class", pages: firefighterLeilaComesToClass },
  "who-is-helping": { dir: "who-is-helping", pages: whoIsHelping },
  // Unit 3
  "the-big-race": { dir: "the-big-race", pages: theBigRace },
  "reach-for-the-sky": { dir: "reach-for-the-sky", pages: reachForTheSky },
  "get-up-and-move-day": { dir: "get-up-and-move-day", pages: getUpAndMoveDay },
  "head-arm-hand-finger": { dir: "head-arm-hand-finger", pages: headArmHandFinger },
  // Unit 4
  "the-night-amal-counted-the-stars": { dir: "the-night-amal-counted-the-stars", pages: theNightAmalCountedTheStars },
  "my-shadow": { dir: "my-shadow", pages: myShadow },
  "why-we-have-day-and-night": { dir: "why-we-have-day-and-night", pages: whyWeHaveDayAndNight },
  "sunny-cloudy-windy-rainy": { dir: "sunny-cloudy-windy-rainy", pages: sunnyCloudyWindyRainy },
  // Unit 5
  "a-fair-way-to-measure": { dir: "a-fair-way-to-measure", pages: aFairWayToMeasure },
  "one-hundred-little-fingers": { dir: "one-hundred-little-fingers", pages: oneHundredLittleFingers },
  "how-people-measured-long-ago": { dir: "how-people-measured-long-ago", pages: howPeopleMeasuredLongAgo },
  "big-and-small-long-and-short": { dir: "big-and-small-long-and-short", pages: bigAndSmallLongAndShort },
  // Unit 6
  "amal-and-the-little-garden-friends": { dir: "amal-and-the-little-garden-friends", pages: amalAndTheLittleGardenFriends },
  "theres-a-bug-on-me": { dir: "theres-a-bug-on-me", pages: theresABugOnMe },
  "grandpas-cricket": { dir: "grandpas-cricket", pages: grandpasCricket },
  "fly-jump-crawl-spin": { dir: "fly-jump-crawl-spin", pages: flyJumpCrawlSpin },
  // Unit 7
  "amal-and-the-little-tree": { dir: "amal-and-the-little-tree", pages: amalAndTheLittleTree },
  "painted-blue-and-green": { dir: "painted-blue-and-green", pages: paintedBlueAndGreen },
  "a-family-on-mother-earth-day": { dir: "a-family-on-mother-earth-day", pages: aFamilyOnMotherEarthDay },
  "roots-stem-leaves-flower": { dir: "roots-stem-leaves-flower", pages: rootsStemLeavesFlower },
  // Unit 8
  "helping-hands-at-home": { dir: "helping-hands-at-home", pages: helpingHandsAtHome },
  "a-nest-is-a-home-for-a-bird": { dir: "a-nest-is-a-home-for-a-bird", pages: aNestIsAHomeForABird },
  "theos-tree-house": { dir: "theos-tree-house", pages: theosTreeHouse },
  "bed-table-chair-sofa": { dir: "bed-table-chair-sofa", pages: bedTableChairSofa },
  // Unit 9
  "the-stranger-with-the-map": { dir: "the-stranger-with-the-map", pages: theStrangerWithTheMap },
  "at-the-zebra-crossing": { dir: "at-the-zebra-crossing", pages: atTheZebraCrossing },
  "the-city-from-the-sky": { dir: "the-city-from-the-sky", pages: theCityFromTheSky },
  "amazing-huge-and-a-little-bit-scary": { dir: "amazing-huge-and-a-little-bit-scary", pages: amazingHugeAndALittleBitScary },
  // Unit 10
  "amals-english-world": { dir: "amals-english-world", pages: amalsEnglishWorld },
  "ten-units-one-year": { dir: "ten-units-one-year", pages: tenUnitsOneYear },
  "the-sentence-i-fixed": { dir: "the-sentence-i-fixed", pages: theSentenceIFixed },
  "nine-words-for-year-three": { dir: "nine-words-for-year-three", pages: nineWordsForYearThree },
};

writeBooks(books, process.argv[2]);
