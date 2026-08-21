#!/usr/bin/env node

// Grade 3, the THIRD book of each unit. Companion to -2.js and -4.js; the
// header there explains how the four books of a unit divide its five texts
// between them. Each book below names the text it is built from:
//
//   1  The Interview            Unit 1  "Amal Talks About Her Family"
//   2  The Grammar Champions    Unit 2  "The Grammar Champions"
//   3  Twelve Months of Work    Unit 3  "The Twelve Months"
//   4  Places I Know            Unit 4  the poem "Places I Know"
//   5  First the Seeds          Unit 5  "Planning the Garden"
//   6  Two Roads                Unit 6  "Two Roads"
//   7  Nature Is Our Home       Unit 7  the poem "Nature Is Our Home"
//   8  The Measuring Challenge  Unit 8  "The Measuring Challenge"
//   9  What Sami Said           Unit 9  "What Sami Said"
//   10 The Last Friday          Unit 10 "The Year 3 Showcase: Project Brief"
//
// Two of them are POEMS, and a poem is not a plot: those books put one line of
// the unit's own poem on each of the first pages and then let Amal answer it
// with the places and the things she actually knows. The words on the page are
// the ones the learner has just read in the unit.
//
// Usage: node tools/create-grade3-ebook-illustrations-3.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, acacia, tallGrass, bench, marketStall, confetti, dustPuffs, goat, hen,
  wildBird, lulu, shapeTile, lampPost, clockTower, schoolBell, playBall, mango, fruitBowl, river, lake,
  waterBottle, thoughtBubble, rain, rainbow, puddle, litterBits, recycleBin, gardenPlant,
  seedRow, fence, sapling, plantStage, wateringCan, seedProp, dugHole, flatStone,
  notepad, mapProp, rulerProp, metreStick, balanceScale, tensLine, patternStrip,
  bookShelf, openBook, calendarBoard, house, hut, libraryBuilding, townBus, crossing,
  cloudPuff, lowSun, bunting, easel, lookLine, motionArcs, kite, sailboat, ferryBoat,
  sunsetScene, roomScene, roomBox, gardenScene, streetScene, daylightScene,
  G2, G3, figure, heldBook, heldPaper, heldShell, heldFolder, heldBasket,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  desk, globeProp, shells, hospital, poster, monthWall, gardenWall, boxOfIdeas,
  hourClock, microphone, stageCurtain, basketProp, courtHouse, collegeFront,
  thermometerProp, numberLadder, folderProp, lighthouse, photoFrame, signPost,
} = require("./lib/ehel-ebook-kit-grade3.js");

const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const eveningRoom = () => `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
  <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>`;
// The school library. Shelves on the floor AND up the wall on both sides: a
// library page drawn with one low bookcase is two thirds empty wall, and it
// reads as a corridor with some books in it rather than as a room full of them.
// The middle stays clear, so figures and a page's own prop still have somewhere
// to stand.
const libraryScene = () => `${plainRoomScene({ wall: "#e4dcc8" })}
  ${bookShelf(250, 300, 0.78, { count: 7 })}${bookShelf(1350, 300, 0.78, { count: 7 })}
  ${bookShelf(250, 600, 0.9, { count: 8 })}${bookShelf(1350, 600, 0.9, { count: 8 })}
  ${bookShelf(250, 940, 1.15, { count: 9 })}${bookShelf(1350, 940, 1.15, { count: 9 })}
  ${poster(800, 300, 0.72, { colour: G3.teal, lines: 3 })}`;
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;

// The two roads of Unit 6, drawn as one page-wide fork: the paved one smooth
// and pale, the older one bumpy and stony. Both end at the same market.
function twoRoads({ stones = true } = {}) {
  // The two roads have to LOOK different, because that is the whole book. The
  // first version drew both of them in two shades of the ground's own beige and
  // scattered a few pebbles on one: on the page they read as scuff marks, and
  // the smooth road was invisible. Now the paved one is grey with a painted
  // centre line and a kerb, and the old one is brown, narrower and lumpy.
  const stone = (sx, sy, sc) => `<ellipse cx="${sx}" cy="${sy}" rx="${18 * sc}" ry="${11 * sc}" fill="#9d9081" stroke="${C.ink}" stroke-width="3.2"/>`;
  return `<path d="M 1580 1000 q -600 -180 -1160 -134" stroke="#8f8b86" stroke-width="96" fill="none" stroke-linecap="round"/>
    <path d="M 1580 1000 q -600 -180 -1160 -134" stroke="#a8a49e" stroke-width="80" fill="none" stroke-linecap="round"/>
    <path d="M 1580 1000 q -600 -180 -1160 -134" stroke="#e8e4dc" stroke-width="6" stroke-dasharray="46 40" fill="none"/>
    <path d="M 1580 852 q -540 -54 -1120 -22" stroke="#a3805c" stroke-width="72" fill="none" stroke-linecap="round"/>
    <path d="M 1580 852 q -540 -54 -1120 -22" stroke="#b8946c" stroke-width="56" fill="none" stroke-linecap="round"/>
    ${stones ? [520, 700, 880, 1060, 1240, 1420].map((sx, i) => stone(sx, 848 - (i % 3) * 10, 0.9 + (i % 2) * 0.35)).join("") : ""}`;
}

// ================================================================ Book 1
// The Interview — Unit 1: "Amal Talks About Her Family"

const interviewPages = [
  // 1 cover: Amal at the microphone, Maya asking
  `${classroomScene()}${microphone(880, 950, 1.15)}${bunting(800, 150, 1.1, { span: 1100 })}
   ${figure("amal", { x: 700, y: 950, s: 1.78 })}
   ${figure("maya", { x: 1120, y: 950, s: 1.56, holding: heldPaper })}`,

  // 2 Teacher Yasmin sets up an interview corner: one chair, one microphone
  `${classroomScene()}${microphone(1120, 950, 1.1)}${bench(1330, 946, 1.25)}
   ${figure("yasmin", { x: 620, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 880, y: 950, s: 1.54 })}`,

  // 3 "Tell us about yourself" - and my mouth went dry
  `${classroomScene()}${microphone(920, 950, 1.15)}
   ${figure("amal", { x: 700, y: 950, s: 1.72, mood: "surprised" })}
   ${figure("maya", { x: 1150, y: 950, s: 1.52, arms: "point" })}`,

  // 4 I am a student at Ehel Academy - that was all I could say
  `${classroomScene()}${microphone(940, 950, 1.1)}${desk(320, 950, 1.24)}
   ${figure("amal", { x: 720, y: 950, s: 1.7 })}`,

  // 5 "Who do you live with at home?"
  `${classroomScene()}${microphone(1080, 950, 1.1)}
   ${figure("maya", { x: 1250, y: 950, s: 1.54, arms: "point" })}
   ${figure("amal", { x: 800, y: 950, s: 1.7 })}`,

  // 6 my parents, my two brothers, my sister and my grandmother
  `${homeScene()}${roomBox(1290, 640, 1.05, "living")}
   ${figure("hana", { x: 300, y: 950, s: 1.5 })}
   ${figure("dad", { x: 470, y: 950, s: 1.5 })}
   ${figure("mum", { x: 640, y: 950, s: 1.5 })}
   ${figure("adam", { x: 800, y: 950, s: 1.42 })}
   ${figure("idris", { x: 930, y: 950, s: 1.32 })}
   ${figure("mina", { x: 1040, y: 952, s: 1.16 })}`,

  // 7 our house is small, but it is always full of noise and laughter
  `${townScene()}${house(1180, 900, 0.9)}${gardenPlant(1440, 900, 0.95)}
   ${figure("amal", { x: 560, y: 900, s: 1.7, arms: "up" })}
   ${figure("mina", { x: 780, y: 902, s: 1.24, arms: "up" })}`,

  // 8 "Who are your role models?" - and I did not know what to answer
  `${classroomScene()}${microphone(900, 950, 1.15)}${thoughtBubble(1210, 400, 1.4, `${patternStrip(0, 10, 0.55, { cells: 3 })}`)}
   ${figure("amal", { x: 700, y: 950, s: 1.72, mood: "surprised" })}`,

  // 9 so I said what my mother actually does: she is patient with everybody
  `${homeScene()}${roomBox(1250, 640, 1.1, "kitchen")}
   ${figure("mum", { x: 620, y: 950, s: 1.64 })}
   ${figure("mina", { x: 880, y: 952, s: 1.24 })}`,

  // 10 and what my father does: he listens before he speaks
  `${homeScene()}${roomBox(1250, 640, 1.1, "dining")}
   ${figure("dad", { x: 620, y: 950, s: 1.64 })}
   ${figure("idris", { x: 880, y: 950, s: 1.4, arms: "point" })}`,

  // 11 "What is your duty at home?" - to honour them, and to be a good student
  `${classroomScene()}${microphone(1060, 950, 1.1)}${poster(1330, 690, 0.95, { colour: G3.teal, lines: 4 })}
   ${figure("amal", { x: 760, y: 950, s: 1.74 })}`,

  // 12 "Thank you for listening to my story."
  `${classroomScene()}${confetti(820, 540)}${microphone(1080, 950, 1.1)}
   ${figure("amal", { x: 720, y: 950, s: 1.76, arms: "up" })}
   ${figure("maya", { x: 1260, y: 950, s: 1.52, arms: "up" })}
   ${figure("yasmin", { x: 400, y: 950, s: 1.6 })}`,
];

// ================================================================ Book 2
// The Grammar Champions — Unit 2: the story of the same name

const championsPages = [
  // 1 cover: the three of them in front of the board
  `${classroomScene()}${bunting(800, 150, 1.15, { span: 1180 })}
   ${figure("daniel", { x: 620, y: 950, s: 1.62 })}
   ${figure("amal", { x: 840, y: 950, s: 1.76, arms: "up" })}
   ${figure("nora", { x: 1070, y: 950, s: 1.58 })}`,

  // 2 "Next Friday we will have a grammar contest"
  `${classroomScene()}${calendarBoard(1250, 660, 1.05, { ring: 12 })}
   ${figure("yasmin", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.54 })}`,

  // 3 our group was called The Grammar Champions
  `${classroomScene()}${poster(1260, 690, 1.05, { colour: G3.coral, lines: 3 })}
   ${figure("amal", { x: 600, y: 950, s: 1.66, arms: "up" })}
   ${figure("daniel", { x: 810, y: 950, s: 1.6, arms: "up" })}
   ${figure("nora", { x: 1010, y: 950, s: 1.56, arms: "up" })}`,

  // 4 we needed a topic: in, on, under
  `${classroomScene()}${desk(1200, 950, 1.32, { item: openBook(0, 0, 0.5) })}
   ${figure("amal", { x: 640, y: 950, s: 1.7, arms: "point" })}
   ${figure("daniel", { x: 880, y: 950, s: 1.56 })}`,

  // 5 "It is simple," said Daniel, "but important."
  `${classroomScene()}${shapeTileRow()}
   ${figure("daniel", { x: 700, y: 950, s: 1.68, arms: "point" })}
   ${figure("nora", { x: 950, y: 950, s: 1.56 })}`,

  // 6 we met in the library to study and to write the report
  `${libraryScene()}
   ${figure("amal", { x: 660, y: 950, s: 1.68, holding: heldBook })}
   ${figure("nora", { x: 900, y: 950, s: 1.56, holding: heldPaper })}`,

  // 7 Nora found an author who explains grammar with cartoons
  `${libraryScene()}${desk(1030, 950, 1.32, { item: openBook(0, 0, 0.52) })}
   ${figure("nora", { x: 760, y: 950, s: 1.7, arms: "up" })}`,

  // 8 Daniel brought a notebook full of details
  `${libraryScene()}${notepad(1010, 780, 1.3)}
   ${figure("daniel", { x: 660, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("amal", { x: 900, y: 950, s: 1.56 })}`,

  // 9 we practised, checked every word twice, and collected our supplies
  `${classroomScene()}${desk(340, 950, 1.24)}${notepad(1260, 800, 1.1)}
   ${figure("amal", { x: 700, y: 950, s: 1.66, holding: heldPaper })}
   ${figure("nora", { x: 900, y: 950, s: 1.56 })}
   ${figure("daniel", { x: 1090, y: 950, s: 1.56 })}`,

  // 10 on the day there were decorations and rows of chairs
  `${classroomScene()}${bunting(800, 140, 1.2, { span: 1260 })}${bench(1280, 946, 1.4)}${bench(330, 946, 1.3)}
   ${figure("yasmin", { x: 800, y: 950, s: 1.66 })}`,

  // 11 the pen is ON the desk; the bag is UNDER the table
  `${classroomScene()}${desk(1180, 950, 1.34, { item: openBook(0, 0, 0.5) })}
   ${figure("amal", { x: 620, y: 950, s: 1.72, arms: "point" })}
   ${figure("daniel", { x: 880, y: 950, s: 1.58, arms: "up" })}`,

  // 12 "The winners are - The Grammar Champions!"
  `${classroomScene()}${confetti(820, 520)}${bunting(800, 140, 1.2, { span: 1240 })}
   ${figure("yasmin", { x: 340, y: 950, s: 1.6, arms: "up" })}
   ${figure("amal", { x: 700, y: 950, s: 1.78, arms: "up" })}
   ${figure("nora", { x: 950, y: 950, s: 1.6, arms: "up" })}
   ${figure("daniel", { x: 1180, y: 950, s: 1.58, arms: "up" })}`,
];

// A row of three shape tiles, used as the "in, on, under" demonstration board.
function shapeTileRow() {
  return `${patternStrip(1220, 700, 1.15, { kinds: ["square", "circle"], cells: 3, blankLast: false })}`;
}

// ================================================================ Book 3
// Twelve Months of Work — Unit 3: "The Twelve Months"

const twelveMonthsPages = [
  // 1 cover: the twelve months on the wall
  `${classroomScene()}${monthWall(886, 380, 0.86, { columns: 4 })}
   ${figure("amal", { x: 380, y: 950, s: 1.74, arms: "up" })}`,

  // 2 a year has twelve months: the first is January, the last December
  `${classroomScene()}${monthWall(886, 380, 0.82, { columns: 4, highlight: 0 })}
   ${figure("yasmin", { x: 360, y: 950, s: 1.64, arms: "point" })}`,

  // 3 some months are hot and dry, and the fields turn golden
  `${townScene()}${tallGrass(1120, 906, 1.5)}${tallGrass(1300, 912, 1.3)}${tallGrass(1450, 906, 1.15)}${acacia(430, 640, 1.2)}
   ${figure("amal", { x: 680, y: 900, s: 1.68 })}`,

  // 4 some months are cool, and a jacket feels right in the morning
  `${townScene()}${cloudPuff(1180, 260, 1.3)}${cloudPuff(430, 300, 1.05)}
   ${figure("amal", { x: 700, y: 900, s: 1.68 })}
   ${figure("idris", { x: 930, y: 900, s: 1.42 })}`,

  // 5 some months bring rain that fills the rivers
  `${streetScene({ rainy: true })}${rain()}${puddle(1160, 936, 170, 34, 0)}
   ${figure("amal", { x: 660, y: 890, s: 1.68, arms: "up" })}`,

  // 6 our school year begins in January and ends in November
  `${classroomScene()}${monthWall(886, 380, 0.82, { columns: 4, highlight: 10 })}
   ${figure("nora", { x: 380, y: 950, s: 1.62 })}`,

  // 7 so the long holiday falls in December
  `${coastScene()}${shells(1180, 930, 1.05)}
   ${figure("amal", { x: 620, y: 930, s: 1.7, arms: "up" })}
   ${figure("mina", { x: 860, y: 932, s: 1.24, arms: "up" })}`,

  // 8 teachers plan by the months: a test, a trip, a sports day
  `${classroomScene()}${calendarBoard(1240, 660, 1.1, { ring: 9 })}
   ${figure("yasmin", { x: 620, y: 950, s: 1.66, arms: "point" })}
   ${figure("theo", { x: 900, y: 950, s: 1.54 })}`,

  // 9 families mark the calendar: birthdays, weddings, holidays
  `${homeScene()}${calendarBoard(1230, 660, 1.05, { ring: 20 })}
   ${figure("mum", { x: 600, y: 950, s: 1.62 })}
   ${figure("amal", { x: 860, y: 950, s: 1.56, arms: "point" })}`,

  // 10 farmers mark it more carefully: the day to plant, the day to pick
  `${gardenScene()}${seedRow(1160, 906, 1.2)}${wateringCan(430, 900, 1.15)}
   ${figure("dad", { x: 760, y: 900, s: 1.64, arms: "point" })}`,

  // 11 Grandma Hana remembers which month brought the biggest harvest
  `${eveningRoom()}${basketProp(1240, 946, 1.25, { kind: "grain" })}
   ${figure("hana", { x: 640, y: 950, s: 1.68 })}
   ${figure("amal", { x: 900, y: 950, s: 1.56 })}`,

  // 12 the months in order help me plan ahead, and remember back
  `${classroomScene()}${monthWall(886, 380, 0.86, { columns: 4, highlight: 5 })}
   ${figure("amal", { x: 380, y: 950, s: 1.72, holding: heldPaper })}`,
];

// ================================================================ Book 4
// Places I Know — Unit 4: the poem of the same name

const placesPoemPages = [
  // 1 cover: the village, at the pace of the poem
  `${townScene()}${hut(1220, 900, 1.05)}${acacia(400, 640, 1.2)}
   ${goat({ x: 900, y: 872, s: 0.6 })}
   ${figure("amal", { x: 660, y: 900, s: 1.76 })}`,

  // 2 "In my village the days are slow"
  `${townScene()}${hut(1180, 900, 1.15)}${bench(430, 930, 1.3)}
   ${figure("amal", { x: 760, y: 900, s: 1.7 })}`,

  // 3 "Past the garden the goats all go"
  `${gardenScene()}${gardenPlant(1300, 890, 1.1)}${fence(430, 890, 1.05, 3)}
   ${goat({ x: 1020, y: 862, s: 0.62 })}
   ${goat({ x: 880, y: 872, s: 0.5, flip: true })}
   ${figure("amal", { x: 660, y: 900, s: 1.68, arms: "point" })}`,

  // 4 "The market is busy"
  `${townScene()}${marketStall(1140, 890, 0.94)}${basketProp(850, 916, 1.05, { kind: "fruit" })}
   ${figure("omar", { x: 1010, y: 918, s: 1.6, arms: "up" })}
   ${figure("amal", { x: 520, y: 918, s: 1.64, holding: heldBasket })}`,

  // 5 "the court is grand"
  `${townScene()}${courtHouse(1120, 890, 0.86)}
   ${figure("amal", { x: 520, y: 918, s: 1.68 })}
   ${figure("nora", { x: 730, y: 918, s: 1.56 })}`,

  // 6 "So many places across our land!"
  `${townScene()}${mapProp(1180, 700, 1.35)}
   ${figure("yasmin", { x: 620, y: 900, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 880, y: 900, s: 1.56 })}`,

  // 7 then in my own words: the hospital, where Doctor Sarah works
  `${townScene()}${hospital(1150, 850, 0.78)}
   ${figure("sarah", { x: 500, y: 918, s: 1.62 })}
   ${figure("amal", { x: 730, y: 918, s: 1.54 })}`,

  // 8 the college, where Adam will study
  `${townScene()}${collegeFront(1120, 890, 0.84)}
   ${figure("adam", { x: 520, y: 918, s: 1.64, holding: heldBook })}`,

  // 9 the officer at the crossing, who stops the road for us
  `${streetScene()}${crossing(1120, 890, 1.15)}
   ${figure("rami", { x: 700, y: 890, s: 1.64, arms: "point" })}
   ${figure("mina", { x: 920, y: 892, s: 1.24 })}`,

  // 10 the library, the quietest door in the whole county
  `${townScene()}${libraryBuilding(1150, 890, 1.15)}
   ${figure("amal", { x: 620, y: 918, s: 1.66, holding: heldBook })}`,

  // 11 and our address, which I learned by heart
  `${townScene()}${house(1200, 900, 0.92)}${signPost(420, 900, 0.86, { label: "VILLAGE" })}
   ${figure("amal", { x: 820, y: 900, s: 1.66, holding: heldPaper })}`,

  // 12 my own last line, written under the poem
  `${sunsetScene()}${hut(1240, 900, 1)}
   ${figure("amal", { x: 660, y: 900, s: 1.74, holding: heldPaper })}
   ${figure("nora", { x: 900, y: 900, s: 1.56 })}`,
];

// ================================================================ Book 5
// First the Seeds — Unit 5: "Planning the Garden"

const firstSeedsPages = [
  // 1 cover: Amal and Leo with the plan, in the empty garden
  `${gardenScene()}${dugHole(1200, 900, 1.15)}${wateringCan(430, 900, 1.15)}
   ${figure("amal", { x: 700, y: 900, s: 1.74, holding: heldPaper })}
   ${figure("leo", { x: 950, y: 900, s: 1.6 })}`,

  // 2 "Let's make a plan. What should we do first?"
  `${gardenScene()}${notepad(1200, 780, 1.25)}
   ${figure("amal", { x: 660, y: 900, s: 1.7, arms: "point" })}
   ${figure("leo", { x: 920, y: 900, s: 1.6 })}`,

  // 3 "First, we search for good seeds."
  `${townScene()}${marketStall(1150, 890, 0.9)}${seedProp(880, 918, 1.3)}
   ${figure("omar", { x: 1010, y: 918, s: 1.58 })}
   ${figure("leo", { x: 620, y: 918, s: 1.62, arms: "point" })}`,

  // 4 strong seeds, that will grow into healthy plants
  `${gardenScene()}${seedProp(1150, 890, 1.5)}${seedRow(430, 906, 1.05, { sprouts: false })}
   ${figure("amal", { x: 780, y: 900, s: 1.7 })}`,

  // 5 "Then we build a small fence, to protect the young leaves."
  `${gardenScene()}${fence(1120, 890, 1.3, 4)}${flatStone(430, 906, 1.15)}
   ${figure("leo", { x: 700, y: 900, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 920, y: 900, s: 1.58 })}`,

  // 6 a goat came to test it on the very first evening
  `${sunsetScene()}${fence(1120, 900, 1.25, 4)}
   ${goat({ x: 900, y: 866, s: 0.62 })}
   ${figure("amal", { x: 620, y: 900, s: 1.68, mood: "surprised" })}`,

  // 7 "After that, we water the garden every day."
  `${gardenScene()}${wateringCan(1120, 890, 1.4, { pouring: true })}${seedRow(430, 906, 1.1)}
   ${figure("amal", { x: 800, y: 900, s: 1.68 })}`,

  // 8 some mornings I did not want to. I went anyway.
  `${gardenScene()}${wateringCan(1180, 890, 1.2)}
   ${figure("amal", { x: 700, y: 900, s: 1.7, mood: "sad" })}`,

  // 9 two weeks, and nothing. The plan did not say hurry.
  `${gardenScene()}${seedRow(1120, 906, 1.2, { sprouts: false })}
   ${figure("leo", { x: 640, y: 900, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 890, y: 900, s: 1.6, mood: "sad" })}`,

  // 10 then one green leaf, and then four
  `${gardenScene()}${plantStage(1080, 890, 1.5, "sprout")}${plantStage(1280, 890, 1.3, "sprout")}
   ${figure("amal", { x: 700, y: 900, s: 1.7, arms: "up" })}`,

  // 11 "Finally, we celebrate when the first flower grows."
  `${gardenScene()}${gardenPlant(1140, 890, 1.5)}${confetti(820, 540)}
   ${figure("amal", { x: 640, y: 900, s: 1.72, arms: "up" })}
   ${figure("leo", { x: 900, y: 900, s: 1.6, arms: "up" })}`,

  // 12 first the seeds, then the fence, then the water, and then this
  `${gardenScene()}${gardenPlant(1240, 890, 1.25)}${fence(430, 890, 1.1, 3)}
   ${figure("amal", { x: 660, y: 900, s: 1.66, arms: "up" })}
   ${figure("nora", { x: 880, y: 900, s: 1.54 })}
   ${figure("yasmin", { x: 1080, y: 900, s: 1.58 })}`,
];

// ================================================================ Book 6
// Two Roads — Unit 6: "Two Roads"

const twoRoadsPages = [
  // 1 cover: the fork, and Amal choosing
  `${townScene()}${twoRoads()}${acacia(320, 620, 1.15)}
   ${figure("amal", { x: 700, y: 918, s: 1.78 })}`,

  // 2 there are two roads near my home, and both go to the market
  `${townScene()}${twoRoads()}${marketStall(1420, 880, 0.62)}
   ${figure("amal", { x: 620, y: 918, s: 1.7, arms: "point" })}`,

  // 3 the first is smooth. It was paved a few years ago.
  `${streetScene()}
   ${figure("amal", { x: 700, y: 890, s: 1.72 })}`,

  // 4 cyclists use it every morning, because the wheels never bump
  `${streetScene()}${motionArcs(1180, 830, 1.3)}${lampPost(1400, 890, 1.1)}
   ${figure("theo", { x: 760, y: 890, s: 1.64 })}
   ${figure("leo", { x: 980, y: 890, s: 1.6 })}`,

  // 5 the second road is much older, and it is rough
  `${townScene()}${twoRoads()}
   ${figure("amal", { x: 660, y: 918, s: 1.7, mood: "surprised" })}`,

  // 6 some stones are as big as a fist, and puddles collect between them
  `${townScene()}${twoRoads()}${puddle(1180, 930, 120, 26, 1)}${flatStone(500, 918, 1.2)}
   ${figure("amal", { x: 780, y: 918, s: 1.66 })}`,

  // 7 my father takes the rough road, because it is shorter
  `${townScene()}${twoRoads()}${basketProp(1180, 916, 1, { kind: "grain" })}
   ${figure("dad", { x: 720, y: 918, s: 1.7 })}`,

  // 8 "My boots are tough," he says, and he laughs at the wet stones
  `${townScene()}${twoRoads()}${puddle(1220, 934, 130, 28, 1)}
   ${figure("dad", { x: 700, y: 918, s: 1.7, arms: "up" })}
   ${figure("amal", { x: 960, y: 918, s: 1.54 })}`,

  // 9 my little sister prefers the smooth road, for her scooter
  `${streetScene()}${motionArcs(1120, 850, 1.15)}
   ${figure("mina", { x: 780, y: 890, s: 1.28, arms: "up" })}
   ${figure("amal", { x: 560, y: 890, s: 1.62 })}`,

  // 10 I explore both: one on quiet mornings, one for an adventure
  `${townScene()}${twoRoads()}${acacia(1420, 640, 1.15)}
   ${figure("amal", { x: 640, y: 918, s: 1.72, arms: "up" })}`,

  // 11 they are not similar at all, and I like that
  `${townScene()}${twoRoads()}${signPost(1300, 906, 0.78, { label: "MARKET", colour: G3.plum })}
   ${figure("amal", { x: 660, y: 918, s: 1.68 })}
   ${figure("noah", { x: 900, y: 918, s: 1.6 })}`,

  // 12 whichever road I choose, I remember what my father told me
  `${sunsetScene()}${marketStall(1240, 890, 0.86)}
   ${figure("dad", { x: 640, y: 900, s: 1.68 })}
   ${figure("amal", { x: 900, y: 900, s: 1.6 })}`,
];

// ================================================================ Book 7
// Nature Is Our Home — Unit 7: the poem of the same name

const naturePoemPages = [
  // 1 cover: the three places of the poem in one look
  `${mountainScene()}
   ${figure("amal", { x: 660, y: 950, s: 1.76, arms: "up" })}
   ${figure("nora", { x: 920, y: 950, s: 1.58 })}`,

  // 2 "Nature is our home"
  `${forestScene()}
   ${figure("amal", { x: 700, y: 950, s: 1.74 })}`,

  // 3 "It gives us water"
  `${forestScene()}${river(1100, 900, 1.3)}
   ${figure("amal", { x: 620, y: 950, s: 1.68, arms: "point" })}`,

  // 4 "trees"
  `${forestScene()}${wildBird(1240, 460, 1.15, true)}
   ${figure("nora", { x: 720, y: 950, s: 1.7, arms: "up" })}`,

  // 5 "and air"
  `${townScene()}${kite(1180, 320, 1.25)}${motionArcs(1000, 700, 1.2)}
   ${figure("amal", { x: 660, y: 900, s: 1.72, arms: "up" })}`,

  // 6 "The sun,"
  `${coastScene()}${shells(1140, 934, 1.05)}
   ${figure("amal", { x: 660, y: 930, s: 1.72 })}`,

  // 7 "the sea,"
  `${coastScene()}${sailboat(1240, 620, 1.2)}${shells(1080, 934, 1)}
   ${figure("nora", { x: 640, y: 930, s: 1.7, arms: "point" })}`,

  // 8 "the mountain tall -"
  `${mountainScene()}${cloudPuff(1180, 250, 1.3)}
   ${figure("amal", { x: 680, y: 950, s: 1.7 })}
   ${figure("nora", { x: 920, y: 950, s: 1.56 })}`,

  // 9 "Let's take care,"
  `${coastScene()}${litterBits(1080, 930, 1.15)}${recycleBin(1360, 920, 1.1)}
   ${figure("amal", { x: 620, y: 930, s: 1.7 })}
   ${figure("leo", { x: 860, y: 930, s: 1.58 })}`,

  // 10 "and share it all."
  `${gardenScene()}${sapling(1140, 890, 1.35)}${wateringCan(430, 890, 1.15)}
   ${figure("amal", { x: 720, y: 900, s: 1.7 })}
   ${figure("nora", { x: 950, y: 900, s: 1.56 })}`,

  // 11 take only pictures, leave only footprints
  `${forestScene()}${photoFrame(1200, 700, 1.05, { inner: acacia(0, 60, 0.42) })}
   ${figure("yasmin", { x: 660, y: 950, s: 1.66, arms: "point" })}`,

  // 12 we said the poem out loud on the beach, and the sea did not mind
  `${coastScene()}${ferryBoat(1300, 600, 1.05)}
   ${figure("amal", { x: 640, y: 930, s: 1.74, holding: heldPaper })}
   ${figure("nora", { x: 900, y: 930, s: 1.58, arms: "up" })}`,
];

// ================================================================ Book 8
// The Measuring Challenge — Unit 8: "The Measuring Challenge"

const measuringPages = [
  // 1 cover: Teacher Yasmin and the metre stick
  `${classroomScene()}${metreStick(1180, 946, 1.35)}
   ${figure("yasmin", { x: 660, y: 950, s: 1.72, arms: "up" })}
   ${figure("sami", { x: 950, y: 950, s: 1.56 })}`,

  // 2 "Three things to measure before break time."
  `${classroomScene({ boardText: "sums" })}
   ${figure("yasmin", { x: 780, y: 950, s: 1.68, arms: "point" })}
   ${figure("nora", { x: 1060, y: 950, s: 1.54 })}`,

  // 3 "Only three?" said Sami. "That sounds easy."
  `${classroomScene()}${desk(1200, 950, 1.3)}
   ${figure("sami", { x: 700, y: 950, s: 1.7, arms: "up" })}`,

  // 4 first: the height of your desk, in centimetres
  `${classroomScene()}${desk(1160, 950, 1.34)}${rulerProp(880, 866, 1.15, { rotate: -90, length: 260 })}
   ${figure("sami", { x: 640, y: 950, s: 1.66 })}`,

  // 5 Nora knelt down with her ruler
  `${classroomScene()}${desk(1180, 950, 1.3)}${rulerProp(400, 866, 1.2, { length: 300 })}
   ${figure("nora", { x: 760, y: 950, s: 1.68 })}`,

  // 6 next: the distance from the door to the window
  `${classroomScene()}${metreStick(400, 946, 1.3)}
   ${figure("yasmin", { x: 700, y: 950, s: 1.66, arms: "point" })}
   ${figure("sami", { x: 960, y: 950, s: 1.56 })}`,

  // 7 walk in a straight line, and count your steps
  `${classroomScene()}${tensLine(880, 880, 1.15)}
   ${figure("sami", { x: 500, y: 950, s: 1.66 })}`,

  // 8 "That is a long way," said Sami, looking across the room
  `${classroomScene()}${lookLine(680, 800, 1240, 780)}
   ${figure("sami", { x: 560, y: 950, s: 1.7, mood: "surprised" })}`,

  // 9 third: the weight of your school bag, on the scales
  `${classroomScene()}${balanceScale(1310, 900, 1.3, { tilt: -7 })}
   ${figure("nora", { x: 620, y: 950, s: 1.66 })}
   ${figure("sami", { x: 860, y: 950, s: 1.56 })}`,

  // 10 "Write the exact number anyway. A fact is a fact."
  `${classroomScene()}${notepad(1200, 790, 1.3)}
   ${figure("yasmin", { x: 660, y: 950, s: 1.68, arms: "point" })}
   ${figure("nora", { x: 920, y: 950, s: 1.56, holding: heldPaper })}`,

  // 11 each number next to its unit, in your own book
  `${classroomScene()}${desk(1180, 950, 1.32, { item: notepad(0, 0, 0.55) })}${rulerProp(380, 866, 1.05, { length: 240 })}
   ${figure("sami", { x: 740, y: 950, s: 1.68, holding: heldPaper })}`,

  // 12 three numbers, three tools, and the bell had not gone yet
  `${classroomScene()}${metreStick(1300, 946, 1.2)}${balanceScale(330, 900, 1.05)}
   ${figure("sami", { x: 700, y: 950, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 950, y: 950, s: 1.58, arms: "up" })}`,
];

// ================================================================ Book 9
// What Sami Said — Unit 9: "What Sami Said"

const samiSaidPages = [
  // 1 cover: Sami on the shore, looking out at the lighthouse
  `${coastScene()}${lighthouse(1260, 700, 1.05)}
   ${figure("sami", { x: 660, y: 930, s: 1.76, arms: "up" })}`,

  // 2 "Sometimes I imagine that I can fly over the sea," said Sami
  `${coastScene()}${lulu({ x: 1200, y: 420, s: 1.3, flying: true })}
   ${figure("sami", { x: 700, y: 930, s: 1.72, arms: "up" })}`,

  // 3 "past the boats and the seagulls, all the way to the lighthouse"
  `${coastScene()}${lighthouse(1300, 700, 1.15)}${sailboat(950, 600, 1.05)}
   ${figure("sami", { x: 560, y: 930, s: 1.7, arms: "point" })}`,

  // 4 he smiled, and his eyes seemed far away
  `${coastScene()}${thoughtBubble(1150, 400, 1.6, `${lighthouse(0, 90, 0.4)}`)}
   ${figure("sami", { x: 660, y: 930, s: 1.72 })}`,

  // 5 walking home, I told my mother all about it
  `${sunsetScene()}${house(1280, 900, 0.8)}
   ${figure("amal", { x: 640, y: 900, s: 1.68 })}
   ${figure("mum", { x: 890, y: 900, s: 1.62 })}`,

  // 6 "He said it made him feel free, as if nothing could worry him."
  `${homeScene()}${roomBox(1260, 640, 1.08, "living")}
   ${figure("amal", { x: 620, y: 950, s: 1.66, arms: "up" })}
   ${figure("mum", { x: 880, y: 950, s: 1.62 })}`,

  // 7 my mother listened carefully. "Did he say why he chose flying?"
  `${homeScene()}
   ${figure("mum", { x: 660, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 940, y: 950, s: 1.6 })}`,

  // 8 "He said flying feels like a kind of freedom."
  `${homeScene()}${thoughtBubble(1200, 400, 1.5, `${lulu({ x: 0, y: 40, s: 1, flying: true })}`)}
   ${figure("amal", { x: 700, y: 950, s: 1.68 })}`,

  // 9 "It sounds sincere and thoughtful. You listened well."
  `${eveningRoom()}${roomBox(1250, 640, 1.06, "living")}
   ${figure("mum", { x: 620, y: 950, s: 1.66 })}
   ${figure("amal", { x: 880, y: 950, s: 1.6 })}`,

  // 10 "I suggest we ask him to draw it," I said
  `${classroomScene()}${easel(1200, 950, 1.3, { inner: poster(0, 0, 0.42, { colour: G3.sky }) })}
   ${figure("amal", { x: 660, y: 950, s: 1.68, arms: "point" })}`,

  // 11 so Sami drew the lighthouse, and the boats, and the birds
  `${classroomScene()}${easel(1180, 950, 1.32, { inner: lighthouse(0, 60, 0.3) })}
   ${figure("sami", { x: 660, y: 950, s: 1.7, holding: heldPaper })}`,

  // 12 his idea went into the box, and now it belongs to all of us
  `${classroomScene()}${boxOfIdeas(1220, 950, 1.1)}
   ${figure("yasmin", { x: 420, y: 950, s: 1.62 })}
   ${figure("sami", { x: 720, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 950, y: 950, s: 1.56, arms: "up" })}`,
];

// ================================================================ Book 10
// The Last Friday — Unit 10: "The Year 3 Showcase: Project Brief"

const lastFridayPages = [
  // 1 cover: Amal holding the brief
  `${classroomScene()}${poster(1230, 690, 1.1, { colour: G3.plum, lines: 5 })}
   ${figure("amal", { x: 700, y: 950, s: 1.78, holding: heldPaper })}`,

  // 2 the showcase has four parts, and you do them in order
  `${classroomScene()}${patternStrip(1180, 700, 1.2, { kinds: ["square"], cells: 4, blankLast: false })}
   ${figure("yasmin", { x: 640, y: 950, s: 1.68, arms: "point" })}`,

  // 3 part one: choose six pages, from at least four different units
  `${classroomScene()}${folderProp(1220, 906, 1.3)}
   ${figure("amal", { x: 680, y: 950, s: 1.7, holding: heldFolder })}`,

  // 4 look for reading, writing, speaking and new words
  `${classroomScene()}${desk(1180, 950, 1.32, { item: openBook(0, 0, 0.5) })}${notepad(360, 800, 1.05)}
   ${figure("amal", { x: 760, y: 950, s: 1.68 })}
   ${figure("nora", { x: 990, y: 950, s: 1.54 })}`,

  // 5 part two: build your booklet, two paragraphs on every page
  `${classroomScene()}${openBook(1200, 856, 1.3)}
   ${figure("amal", { x: 700, y: 950, s: 1.7, holding: heldPaper })}`,

  // 6 one picture and one clear label on each page
  `${classroomScene()}${easel(1200, 950, 1.3, { inner: poster(0, 0, 0.42, { colour: G3.gold }) })}
   ${figure("nora", { x: 680, y: 950, s: 1.68, arms: "point" })}`,

  // 7 your name, your class, and the word Author underneath
  `${classroomScene()}${poster(1220, 690, 1.15, { colour: G3.coral, lines: 3 })}
   ${figure("amal", { x: 680, y: 950, s: 1.72, holding: heldPaper })}`,

  // 8 part three: present. Two minutes beside your table.
  `${classroomScene()}${bunting(800, 150, 1.15, { span: 1140 })}${desk(1200, 950, 1.3)}
   ${figure("amal", { x: 680, y: 950, s: 1.74, arms: "up" })}`,

  // 9 point at your pictures, and answer two questions
  `${classroomScene()}${easel(1220, 950, 1.28, { inner: poster(0, 0, 0.4, { colour: G3.teal }) })}
   ${figure("amal", { x: 640, y: 950, s: 1.7, arms: "point" })}
   ${figure("theo", { x: 900, y: 950, s: 1.54 })}`,

  // 10 part four: reflect. Four honest sentences, and one goal.
  `${classroomScene()}${notepad(1200, 790, 1.35)}
   ${figure("amal", { x: 700, y: 950, s: 1.7, holding: heldPaper })}`,

  // 11 read every page aloud: your ears find the missing full stops
  `${eveningRoom()}${openBook(1230, 856, 1.15)}
   ${figure("amal", { x: 700, y: 950, s: 1.7, arms: "up" })}`,

  // 12 one kind idea and one careful question, and then hand it in
  `${classroomScene()}${folderProp(1250, 906, 1.15)}
   ${figure("nora", { x: 620, y: 950, s: 1.6, holding: heldFolder })}
   ${figure("amal", { x: 860, y: 950, s: 1.68 })}
   ${figure("yasmin", { x: 1090, y: 950, s: 1.6 })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "interview": { dir: "the-interview", pages: interviewPages },
  "champions": { dir: "the-grammar-champions", pages: championsPages },
  "months": { dir: "twelve-months-of-work", pages: twelveMonthsPages },
  "places": { dir: "places-i-know", pages: placesPoemPages },
  "seeds": { dir: "first-the-seeds", pages: firstSeedsPages },
  "roads": { dir: "two-roads", pages: twoRoadsPages },
  "poem": { dir: "nature-is-our-home", pages: naturePoemPages },
  "measuring": { dir: "the-measuring-challenge", pages: measuringPages },
  "sami": { dir: "what-sami-said", pages: samiSaidPages },
  "friday": { dir: "the-last-friday", pages: lastFridayPages },
};

writeBooks(books, process.argv[2]);
