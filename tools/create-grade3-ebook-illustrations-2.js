#!/usr/bin/env node

// Grade 3, the SECOND book of each unit.
//
// Each unit's shelf now holds four books instead of one. Book one (see
// create-grade3-ebook-illustrations.js) is built out of the unit's Story, the
// fifth and longest of its five texts. Books two, three and four take the other
// four — the Readings, the poem or song, and the two Listening texts — which
// nothing on the shelf had used, so 30 books came out of material the units
// already carry rather than out of thin air. Which text each one takes is
// listed per book, here and in -3.js and -4.js; it is not a rule that holds by
// slot, because a unit whose second Reading is a four-line song has its twelve
// pages somewhere else.
//
// So every book here is the unit's OWN text, told as twelve picture-book pages,
// and a learner should recognise it from the lesson they have just read:
//
//   1  Junior                     Unit 1  "Amal's Big Day" — the drama club
//   2  A Normal Day at School     Unit 2  "A Day at School" — Adam's day
//   3  Six O'Clock, Seven O'Clock Unit 3  "My Day, Hour by Hour" — Idris's day
//   4  The Bus to the County      Unit 4  "From Our Village to the County"
//   5  Helping Hands              Unit 5  "Helping Hands" — Nora and Omar
//   6  My Cousin Noah             Unit 6  "My Cousin Noah"
//   7  Today and Always           Unit 7  "Our Wonderful Nature"
//   8  Maths Before Dinner        Unit 8  "Maths Is Everywhere"
//   9  Rain Is a Kind of Weather  Unit 9  "Feelings Are Not Bad or Good"
//   10 The Green Folder           Unit 10 "Amal's Year of Words"
//
// The cast is the course's own, and it now includes the rest of the class:
// Sami is named 137 times across the Grade 3 readings, Leo 55, Maya 47, Theo 24
// and Daniel 23, and Unit 4 names the three adults the class actually meets —
// Nadia who drives the bus, Doctor Sarah at the hospital and Officer Rami at
// the court. They live in CAST in tools/lib/ehel-ebook-kit-grade3.js.
//
// Usage: node tools/create-grade3-ebook-illustrations-2.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, acacia, bench, marketStall, confetti, dustPuffs, goat, hen, chick,
  wildBird, lampPost, clockTower, schoolBell, playBall, mango, cookpot, fruitBowl,
  waterBottle, thoughtBubble, rain, rainbow, puddle, litterBits, recycleBin, gardenPlant,
  seedRow, fence, cleaningKit, doctorKit, notepad, mapProp, rulerProp, metreStick,
  balanceScale, tensLine, patternStrip, bookShelf, openBook, calendarBoard, tabletProp,
  house, libraryBuilding, townBus, crossing, cloudPuff, lowSun, kite, bunting, easel, lookLine,
  motionArcs, sunsetScene, nightScene, roomScene, roomBox, gardenScene, streetScene,
  G2, G3, figure, heldBook, heldPaper, heldFolder, heldBasket,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  desk, globeProp, shells, hospital, poster, monthWall,
  hourClock, microphone, stageCurtain, basketProp, courtHouse, collegeFront,
  thermometerProp, frostPatch, numberLadder, folderProp, catProp, photoFrame, signPost,
} = require("./lib/ehel-ebook-kit-grade3.js");

// ---------------------------------------------------------------- local scenes

// Amal's home: the sitting room the family eats in. Same call the first ten
// books use, so a house does not change colour between one book and the next.
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const eveningRoom = () => `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
  <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>`;
// The schoolyard, outside the classroom.
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
// The school hall with the drama club's stage in it.
const stageScene = () => `${plainRoomScene({ wall: "#e2d3b6" })}${stageCurtain(800, 130, 1.05, { span: 1320 })}`;

// ================================================================ Book 1
// Junior — Unit 1: the drama club, from "Amal's Big Day"

const juniorPages = [
  // 1 cover: the club on the stage, Amal in the middle
  `${stageScene()}
   ${figure("adam", { x: 420, y: 950, s: 1.6 })}
   ${figure("nora", { x: 620, y: 950, s: 1.55 })}
   ${figure("amal", { x: 830, y: 950, s: 1.8, arms: "up" })}
   ${figure("leo", { x: 1040, y: 950, s: 1.5 })}
   ${figure("yasmin", { x: 1260, y: 950, s: 1.6 })}`,

  // 2 everybody calls me Junior, because I am the youngest
  `${classroomScene()}
   ${figure("leo", { x: 460, y: 950, s: 1.6 })}
   ${figure("daniel", { x: 660, y: 950, s: 1.6 })}
   ${figure("nora", { x: 870, y: 950, s: 1.55 })}
   ${figure("amal", { x: 1090, y: 950, s: 1.42 })}`,

  // 3 Adam joined first, and the seniors still say his name with respect
  `${classroomScene()}${desk(320, 950, 1.25)}
   ${figure("adam", { x: 820, y: 950, s: 1.7, holding: heldBook })}
   ${figure("theo", { x: 1060, y: 950, s: 1.6 })}
   ${figure("amal", { x: 1300, y: 950, s: 1.5 })}
   ${lookLine(1250, 800, 900, 790)}`,

  // 4 this term the play is about health and safety
  `${classroomScene()}${poster(1240, 690, 1.05, { colour: G3.teal, lines: 5 })}
   ${figure("yasmin", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.55, holding: heldPaper })}
   ${figure("nora", { x: 1090, y: 950, s: 1.52 })}`,

  // 5 Nora plays the senior student, and my duty is to teach her
  `${stageScene()}
   ${figure("nora", { x: 1000, y: 950, s: 1.62 })}
   ${figure("amal", { x: 680, y: 950, s: 1.7, arms: "point" })}`,

  // 6 a paper hat I made myself, and a yellow vest
  `${homeScene()}${roomBox(1250, 640, 1.1, "bedroom")}
   ${figure("mum", { x: 560, y: 950, s: 1.62 })}
   ${figure("amal", { x: 810, y: 950, s: 1.6, holding: heldPaper })}`,

  // 7 practising in front of Mina, who claps in the wrong places
  `${homeScene()}${roomBox(1270, 640, 1.15, "living")}
   ${figure("amal", { x: 560, y: 950, s: 1.62, arms: "point" })}
   ${figure("mina", { x: 830, y: 952, s: 1.24, arms: "up" })}
   ${figure("hana", { x: 1030, y: 950, s: 1.58 })}`,

  // 8 the morning of the play, and my hands will not keep still
  `${classroomScene()}${desk(1200, 950, 1.3)}
   ${figure("amal", { x: 620, y: 950, s: 1.68, mood: "surprised" })}`,

  // 9 Teacher Yasmin claps once, and the room goes quiet
  `${stageScene()}
   ${figure("yasmin", { x: 340, y: 950, s: 1.62, arms: "up" })}
   ${figure("amal", { x: 760, y: 950, s: 1.78 })}
   ${figure("nora", { x: 1010, y: 950, s: 1.55 })}
   ${figure("daniel", { x: 1230, y: 950, s: 1.5 })}`,

  // 10 sit down, eat nicely, speak softly - that is a public place
  `${stageScene()}
   ${figure("amal", { x: 640, y: 950, s: 1.8, arms: "point" })}
   ${figure("nora", { x: 980, y: 950, s: 1.6, mood: "surprised" })}`,

  // 11 afterwards a junior student drops her bag
  `${yardScene()}${bench(1300, 940, 1.35)}${openBook(760, 930, 0.7)}${notepad(880, 924, 0.8)}
   ${figure("amal", { x: 560, y: 900, s: 1.66, arms: "point" })}
   ${figure("mina", { x: 940, y: 902, s: 1.22, mood: "sad" })}`,

  // 12 Junior does not sound small to me any more
  `${sunsetScene()}${house(1290, 900, 0.78)}
   ${figure("amal", { x: 620, y: 900, s: 1.72, arms: "up" })}
   ${figure("nora", { x: 860, y: 900, s: 1.56 })}`,
];

// ================================================================ Book 2
// A Normal Day at School — Unit 2: "A Day at School", told by Adam

const normalDayPages = [
  // 1 cover: Adam at the school gate with his bag
  `${yardScene()}${schoolBell(1180, 640, 1.15)}
   ${figure("adam", { x: 640, y: 900, s: 1.78, holding: heldBook })}
   ${figure("idris", { x: 880, y: 900, s: 1.42 })}`,

  // 2 Mum packs the bag: books, pencils, an eraser
  `${homeScene()}${roomBox(1260, 640, 1.12, "bedroom")}
   ${figure("mum", { x: 540, y: 950, s: 1.64 })}
   ${figure("adam", { x: 800, y: 950, s: 1.6, holding: heldBook })}`,

  // 3 first, mathematics
  `${classroomScene({ boardText: "sums" })}
   ${figure("yasmin", { x: 760, y: 950, s: 1.66, arms: "point" })}
   ${figure("adam", { x: 1050, y: 950, s: 1.58 })}
   ${figure("daniel", { x: 1260, y: 950, s: 1.55 })}`,

  // 4 but grammar is my favourite subject
  `${classroomScene()}${poster(1250, 690, 1.05, { colour: G3.plum, lines: 4 })}
   ${figure("adam", { x: 620, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("nora", { x: 880, y: 950, s: 1.52 })}`,

  // 5 Teacher Yasmin explains slowly, so nobody feels lost
  `${classroomScene()}${desk(330, 950, 1.22)}
   ${figure("yasmin", { x: 1130, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 680, y: 950, s: 1.54 })}
   ${figure("theo", { x: 880, y: 950, s: 1.52 })}`,

  // 6 today she read us a story by a famous author
  `${classroomScene()}
   ${figure("yasmin", { x: 480, y: 950, s: 1.68, holding: heldBook })}
   ${figure("adam", { x: 820, y: 950, s: 1.56 })}
   ${figure("maya", { x: 1010, y: 950, s: 1.5 })}
   ${figure("nora", { x: 1200, y: 950, s: 1.5 })}`,

  // 7 at break I go to the library, because it is quiet
  `${libraryScene()}
   ${figure("adam", { x: 760, y: 950, s: 1.72, holding: heldBook })}`,

  // 8 I can choose any book I like
  `${libraryScene()}${desk(1030, 950, 1.3, { item: openBook(0, 0, 0.5) })}
   ${figure("adam", { x: 700, y: 950, s: 1.7, arms: "up" })}
   ${figure("maya", { x: 950, y: 950, s: 1.5, holding: heldBook })}`,

  // 9 our class talked about a contest next month
  `${classroomScene()}${calendarBoard(1240, 660, 1.05, { ring: 18 })}
   ${figure("yasmin", { x: 560, y: 950, s: 1.66, arms: "point" })}
   ${figure("adam", { x: 840, y: 950, s: 1.56 })}`,

  // 10 everyone began to prepare a topic with plenty of details
  `${classroomScene()}${desk(1220, 950, 1.3)}${notepad(500, 800, 1.1)}
   ${figure("adam", { x: 700, y: 950, s: 1.68, holding: heldPaper })}
   ${figure("theo", { x: 930, y: 950, s: 1.54 })}`,

  // 11 my parents remind me to study every night
  `${eveningRoom()}${roomBox(1270, 640, 1.08, "living")}
   ${figure("adam", { x: 560, y: 950, s: 1.66, holding: heldBook })}
   ${figure("mum", { x: 810, y: 950, s: 1.6 })}`,

  // 12 one day I want to graduate and be a teacher too
  `${classroomScene()}${poster(1260, 690, 1, { colour: G3.gold, lines: 4 })}
   ${figure("adam", { x: 620, y: 950, s: 1.76, arms: "up" })}
   ${figure("yasmin", { x: 900, y: 950, s: 1.62 })}`,
];

// ================================================================ Book 3
// Six O'Clock, Seven O'Clock — Unit 3: "My Day, Hour by Hour", told by Idris

const hourByHourPages = [
  // 1 cover: Idris and the clock
  `${homeScene()}${roomBox(1250, 640, 1.14, "bedroom")}${hourClock(400, 340, 1.9, { hour: 6 })}
   ${figure("idris", { x: 800, y: 950, s: 1.78, arms: "up" })}`,

  // 2 at six o'clock I wake up
  `${homeScene()}${roomBox(1230, 640, 1.16, "bedroom")}${hourClock(420, 300, 1.55, { hour: 6 })}
   ${figure("idris", { x: 640, y: 950, s: 1.62 })}`,

  // 3 I wash my face and make my bed before the house is awake
  `${homeScene()}${roomBox(400, 640, 1.14, "bathroom")}${cleaningKit(1280, 946, 1.1)}
   ${figure("idris", { x: 880, y: 950, s: 1.64 })}`,

  // 4 at seven we eat breakfast together
  `${homeScene()}${roomBox(1250, 640, 1.1, "dining")}${hourClock(330, 300, 1.5, { hour: 7 })}
   ${figure("mum", { x: 560, y: 950, s: 1.6 })}
   ${figure("idris", { x: 790, y: 950, s: 1.5 })}
   ${figure("mina", { x: 960, y: 952, s: 1.2 })}`,

  // 5 at eight I walk to school with Sami
  `${townScene()}${clockTower(1330, 700, 1.15)}
   ${figure("idris", { x: 560, y: 900, s: 1.66 })}
   ${figure("sami", { x: 790, y: 900, s: 1.6 })}`,

  // 6 we study for many hours: reading, writing, drawing maps
  `${classroomScene()}${mapProp(1250, 700, 1.15)}
   ${figure("yasmin", { x: 420, y: 950, s: 1.62, arms: "point" })}
   ${figure("idris", { x: 760, y: 950, s: 1.5, holding: heldPaper })}
   ${figure("sami", { x: 960, y: 950, s: 1.52 })}`,

  // 7 at one o'clock we eat lunch under the big tree
  `${yardScene()}${bench(560, 940, 1.35)}${fruitBowl(1180, 930, 1.15)}
   ${figure("idris", { x: 860, y: 900, s: 1.6 })}
   ${figure("sami", { x: 1060, y: 900, s: 1.58 })}`,

  // 8 at four I go home and help: sweeping, and carrying water
  `${townScene()}${house(1290, 900, 0.8)}${waterBottle(1030, 924, 1.3)}${dustPuffs(700, 930)}
   ${figure("idris", { x: 620, y: 900, s: 1.66 })}`,

  // 9 in the evening I read by the lamp, and the house is quiet
  `${eveningRoom()}${openBook(1230, 856, 1.1)}
   ${figure("idris", { x: 700, y: 950, s: 1.68, holding: heldBook })}`,

  // 10 some days are different: extra homework, or football
  `${yardScene()}${playBall(1180, 936, 1.25)}${motionArcs(1010, 860, 1.1)}
   ${figure("idris", { x: 640, y: 900, s: 1.66, arms: "up" })}
   ${figure("theo", { x: 880, y: 900, s: 1.56 })}`,

  // 11 Grandma Hana says a day fits, if you put it in order
  `${homeScene()}${hourClock(1240, 330, 1.6, { hour: 4 })}
   ${figure("hana", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("idris", { x: 900, y: 950, s: 1.56 })}`,

  // 12 tomorrow it begins again at six
  `${homeScene()}${roomBox(1240, 640, 1.14, "bedroom")}${hourClock(420, 310, 1.55, { hour: 6 })}
   ${figure("idris", { x: 700, y: 950, s: 1.62 })}`,
];

// ================================================================ Book 4
// The Bus to the County — Unit 4: "From Our Village to the County"

const busPages = [
  // 1 cover: the school bus, and Nadia at the door
  `${townScene()}${townBus(1180, 906, 2.4)}
   ${figure("nadia", { x: 420, y: 900, s: 1.62, arms: "up" })}
   ${figure("amal", { x: 620, y: 900, s: 1.58 })}
   ${figure("sami", { x: 790, y: 900, s: 1.54 })}`,

  // 2 look out of the window - what can you see?
  `${streetScene()}${marketStall(1210, 880, 0.82)}${gardenPlant(430, 890, 1.05)}
   ${figure("yasmin", { x: 700, y: 890, s: 1.64, arms: "point" })}
   ${figure("nora", { x: 950, y: 890, s: 1.52 })}`,

  // 3 the first stop is the hospital
  `${townScene()}${hospital(1150, 850, 0.8)}
   ${figure("sarah", { x: 620, y: 918, s: 1.6 })}
   ${figure("amal", { x: 400, y: 918, s: 1.58, arms: "up" })}`,

  // 4 Doctor Sarah works here, and helps people who are sick
  `${plainRoomScene({ wall: "#e8eef2" })}${doctorKit(1250, 946, 1.25)}
   ${figure("sarah", { x: 620, y: 950, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.56 })}
   ${figure("nora", { x: 1080, y: 950, s: 1.5 })}`,

  // 5 exit quietly - people are resting
  `${plainRoomScene({ wall: "#e8eef2" })}${signPost(1300, 940, 0.86, { label: "EXIT", colour: G3.leafy })}
   ${figure("yasmin", { x: 560, y: 950, s: 1.62 })}
   ${figure("sami", { x: 830, y: 950, s: 1.5 })}
   ${figure("amal", { x: 1010, y: 950, s: 1.52 })}`,

  // 6 next the court, where problems are solved fairly
  `${townScene()}${courtHouse(1130, 890, 0.86)}
   ${figure("rami", { x: 460, y: 918, s: 1.62, arms: "point" })}
   ${figure("nora", { x: 690, y: 918, s: 1.54 })}`,

  // 7 sit quietly on the benches - that big chair is the judge's
  `${plainRoomScene({ wall: "#e6dfcd" })}${bench(1180, 946, 1.5)}${bench(340, 946, 1.4)}
   ${figure("rami", { x: 780, y: 950, s: 1.64 })}
   ${figure("amal", { x: 1000, y: 950, s: 1.5 })}`,

  // 8 then the market, where Omar calls out beside his baskets
  `${townScene()}${marketStall(1130, 890, 0.86)}${basketProp(880, 916, 1.05, { kind: "grain" })}
   ${figure("omar", { x: 1000, y: 918, s: 1.58, arms: "up" })}
   ${figure("amal", { x: 480, y: 918, s: 1.6, holding: heldBasket })}
   ${figure("sami", { x: 680, y: 918, s: 1.54 })}`,

  // 9 sweet mangoes, eaten by a small garden
  `${gardenScene()}${mango(1230, 700, 1.15)}${gardenPlant(400, 890, 1.1)}
   ${figure("amal", { x: 700, y: 900, s: 1.62 })}
   ${figure("nora", { x: 920, y: 900, s: 1.56 })}`,

  // 10 at the college gate, my brother Adam
  `${townScene()}${collegeFront(1120, 890, 0.84)}
   ${figure("adam", { x: 480, y: 918, s: 1.64, holding: heldBook })}
   ${figure("amal", { x: 700, y: 918, s: 1.56, arms: "up" })}`,

  // 11 the sign by the road: this is the border
  `${townScene()}${signPost(1180, 900, 1.05, { label: "BORDER" })}
   ${figure("yasmin", { x: 560, y: 900, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 830, y: 900, s: 1.56 })}`,

  // 12 back at school, writing it all down
  `${classroomScene()}${desk(1230, 950, 1.3)}${mapProp(360, 700, 1.05)}
   ${figure("amal", { x: 760, y: 950, s: 1.72, holding: heldPaper })}`,
];

// ================================================================ Book 5
// Helping Hands — Unit 5: "Helping Hands", told by Nora

const helpingHandsPages = [
  // 1 cover: Nora and Omar with the basket between them
  `${townScene()}${marketStall(1240, 890, 0.78)}
   ${figure("nora", { x: 620, y: 918, s: 1.72, holding: heldBasket })}
   ${figure("omar", { x: 900, y: 918, s: 1.62 })}`,

  // 2 one afternoon I was walking home from school
  `${streetScene()}${lampPost(1290, 890, 1.15)}
   ${figure("nora", { x: 640, y: 890, s: 1.7, holding: heldBook })}`,

  // 3 Omar was outside his shop with a heavy basket
  `${townScene()}${marketStall(1300, 890, 0.9)}${basketProp(1020, 916, 1.25, { kind: "fruit" })}${acacia(330, 640, 1.15)}
   ${figure("omar", { x: 800, y: 918, s: 1.6, mood: "surprised" })}`,

  // 4 I stopped and watched him for a moment
  `${townScene()}${marketStall(1180, 890, 0.86)}${basketProp(960, 916, 1.05, { kind: "fruit" })}
   ${figure("omar", { x: 1060, y: 918, s: 1.56 })}
   ${figure("nora", { x: 520, y: 918, s: 1.66 })}
   ${lookLine(600, 800, 950, 830)}`,

  // 5 I remembered what Teacher Yasmin said about neighbours
  `${townScene()}${thoughtBubble(1090, 400, 1.6, `${figure("yasmin", { x: 0, y: 76, s: 0.5 })}`)}
   ${figure("nora", { x: 620, y: 918, s: 1.68 })}`,

  // 6 "Can I offer some help?" I asked
  `${townScene()}${marketStall(1200, 890, 0.82)}${basketProp(900, 916, 1.1, { kind: "fruit" })}
   ${figure("nora", { x: 620, y: 918, s: 1.68, arms: "point" })}
   ${figure("omar", { x: 1030, y: 918, s: 1.58 })}`,

  // 7 together we lifted it
  `${townScene()}${basketProp(820, 830, 1.15, { kind: "fruit" })}
   ${figure("nora", { x: 640, y: 918, s: 1.66, arms: "up" })}
   ${figure("omar", { x: 1000, y: 918, s: 1.6, arms: "up" })}`,

  // 8 small steps, so that nothing fell out
  `${streetScene()}${basketProp(840, 836, 1.1, { kind: "fruit" })}${dustPuffs(700, 900)}
   ${figure("nora", { x: 660, y: 890, s: 1.64, arms: "up" })}
   ${figure("omar", { x: 1020, y: 890, s: 1.58, arms: "up" })}`,

  // 9 at the door he set it down and wiped his forehead
  `${townScene()}${marketStall(1140, 890, 0.94)}${basketProp(860, 916, 1.1, { kind: "fruit" })}
   ${figure("omar", { x: 1020, y: 918, s: 1.6 })}
   ${figure("nora", { x: 620, y: 918, s: 1.62 })}`,

  // 10 "Thank you. You have a kind heart."
  `${townScene()}${marketStall(1220, 890, 0.8)}${confetti(900, 560)}
   ${figure("omar", { x: 960, y: 918, s: 1.62, arms: "up" })}
   ${figure("nora", { x: 640, y: 918, s: 1.66, arms: "up" })}`,

  // 11 the feeling stayed with me all the way home
  `${sunsetScene()}${house(1270, 900, 0.78)}
   ${figure("nora", { x: 700, y: 900, s: 1.72 })}`,

  // 12 now I look for small ways every day
  `${yardScene()}${bench(1260, 940, 1.35)}
   ${figure("nora", { x: 620, y: 900, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 880, y: 902, s: 1.24 })}
   ${figure("hana", { x: 1080, y: 900, s: 1.56 })}`,
];

// ================================================================ Book 6
// My Cousin Noah — Unit 6: "My Cousin Noah"

const noahPages = [
  // 1 cover: Amal and Noah
  `${gardenScene()}${gardenPlant(1240, 890, 1.15)}
   ${figure("noah", { x: 660, y: 900, s: 1.76 })}
   ${figure("amal", { x: 900, y: 900, s: 1.68, arms: "up" })}`,

  // 2 he does not live far, so I see him almost every weekend
  `${townScene()}${house(1210, 900, 0.82)}${house(380, 900, 0.66)}
   ${figure("noah", { x: 760, y: 900, s: 1.66 })}
   ${figure("amal", { x: 560, y: 900, s: 1.6, arms: "up" })}`,

  // 3 he is kind and honest, and never says one thing while thinking another
  `${yardScene()}${bench(1240, 940, 1.3)}
   ${figure("noah", { x: 700, y: 900, s: 1.7, arms: "point" })}
   ${figure("amal", { x: 940, y: 900, s: 1.58 })}`,

  // 4 he is always busy - helping his mother in the kitchen
  `${homeScene()}${roomBox(1240, 640, 1.14, "kitchen")}${cookpot(400, 940, 1.15)}
   ${figure("noah", { x: 720, y: 950, s: 1.68 })}`,

  // 5 shutting the neighbour's goats in before dark
  `${sunsetScene()}${fence(1180, 900, 1.15, 3)}
   ${goat({ x: 1010, y: 872, s: 0.58 })}
   ${figure("noah", { x: 620, y: 900, s: 1.68, arms: "point" })}`,

  // 6 and still he sits down and helps me with my spelling
  `${homeScene()}${desk(1220, 950, 1.28)}
   ${figure("noah", { x: 660, y: 950, s: 1.7, holding: heldBook })}
   ${figure("amal", { x: 900, y: 950, s: 1.58, holding: heldPaper })}`,

  // 7 when I am worried he stays calm, and the worry gets smaller
  `${gardenScene()}${thoughtBubble(1160, 400, 1.5, `${patternStrip(0, 10, 0.6, { cells: 3 })}`)}
   ${figure("amal", { x: 620, y: 900, s: 1.64, mood: "sad" })}
   ${figure("noah", { x: 860, y: 900, s: 1.68 })}`,

  // 8 he never shouts, not even when his sister spoils his things
  `${homeScene()}${roomBox(400, 640, 1.12, "living")}
   ${figure("noah", { x: 860, y: 950, s: 1.68 })}
   ${figure("mina", { x: 1090, y: 952, s: 1.24, mood: "surprised" })}`,

  // 9 at school he says hello to the pupils nobody knows yet
  `${yardScene()}${schoolBell(1220, 640, 1.05)}
   ${figure("noah", { x: 620, y: 900, s: 1.68, arms: "up" })}
   ${figure("theo", { x: 880, y: 900, s: 1.54 })}
   ${figure("maya", { x: 1060, y: 900, s: 1.5 })}`,

  // 10 he shares his lunch when somebody has forgotten theirs
  `${yardScene()}${bench(400, 940, 1.35)}${fruitBowl(1180, 930, 1.15)}
   ${figure("noah", { x: 760, y: 900, s: 1.66, arms: "point" })}
   ${figure("leo", { x: 990, y: 900, s: 1.54 })}`,

  // 11 our neighbours say he will grow up to be a teacher
  `${classroomScene()}${poster(1250, 690, 1, { colour: G3.leafy, lines: 4 })}
   ${figure("noah", { x: 640, y: 950, s: 1.72, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.56 })}`,

  // 12 so I started with one thing: I said hello to somebody new
  `${yardScene()}
   ${figure("amal", { x: 640, y: 900, s: 1.72, arms: "up" })}
   ${figure("maya", { x: 900, y: 900, s: 1.56 })}`,
];

// ================================================================ Book 7
// Today and Always — Unit 7: "Our Wonderful Nature"

const todayAlwaysPages = [
  // 1 cover: Amal under a wide sky with the thermometer
  `${townScene()}${thermometerProp(1220, 900, 1.25, { level: 0.7 })}${cloudPuff(420, 240, 1.15)}
   ${figure("amal", { x: 720, y: 900, s: 1.8, arms: "up" })}`,

  // 2 weather is what today is doing
  `${streetScene({ rainy: true })}${rain()}${puddle(1180, 930, 150, 30, 0)}
   ${figure("amal", { x: 640, y: 890, s: 1.7, mood: "surprised" })}`,

  // 3 climate is what a place does for years and years
  `${townScene()}${acacia(1280, 640, 1.3)}${acacia(360, 660, 1.05)}
   ${figure("yasmin", { x: 760, y: 900, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 1010, y: 900, s: 1.54 })}`,

  // 4 sunshine warms the land, and the temperature climbs
  `${townScene()}${thermometerProp(1180, 900, 1.3, { level: 0.95 })}${seedRow(420, 906, 1.1)}
   ${figure("amal", { x: 760, y: 900, s: 1.68 })}`,

  // 5 on a cold night the water in a pond froze
  `${forestScene()}${frostPatch(1120, 906, 1.15)}
   ${figure("amal", { x: 620, y: 950, s: 1.68, mood: "surprised" })}
   ${figure("nora", { x: 860, y: 950, s: 1.56 })}`,

  // 6 in the forest the air smells of leaves and rain
  `${forestScene()}
   ${figure("amal", { x: 700, y: 950, s: 1.72 })}
   ${wildBird(1230, 500, 1.15, true)}`,

  // 7 on the beach the waves come in, and shells hide in the wet stones
  `${coastScene()}${shells(1150, 930, 1.15)}
   ${figure("amal", { x: 640, y: 930, s: 1.72, arms: "point" })}`,

  // 8 the mountain touches the clouds, and its path is steep and quiet
  `${mountainScene()}${cloudPuff(1160, 260, 1.25)}
   ${figure("amal", { x: 680, y: 950, s: 1.7 })}
   ${figure("nora", { x: 920, y: 950, s: 1.55 })}`,

  // 9 everything we touch is matter - even metal, even the air
  `${classroomScene()}${balanceScale(1200, 900, 1.15)}
   ${figure("yasmin", { x: 560, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 860, y: 950, s: 1.56 })}`,

  // 10 the wind and the sun give us energy
  `${townScene()}${motionArcs(1180, 700, 1.4)}${kite(430, 320, 1.15)}
   ${figure("amal", { x: 700, y: 900, s: 1.7, arms: "up" })}`,

  // 11 all of it is one planet, and it is our home
  `${classroomScene()}${globeProp(1210, 940, 1.5)}
   ${figure("amal", { x: 660, y: 950, s: 1.7, arms: "point" })}
   ${figure("nora", { x: 900, y: 950, s: 1.54 })}`,

  // 12 nature gives us a lot, and it needs our help back
  `${gardenScene()}${recycleBin(1230, 900, 1.15)}${litterBits(860, 918, 1.05)}
   ${figure("amal", { x: 620, y: 900, s: 1.7 })}
   ${figure("nora", { x: 860, y: 900, s: 1.56, arms: "point" })}`,
];

// ================================================================ Book 8
// Maths Before Dinner — Unit 8: "Maths Is Everywhere"

const mathsBeforeDinnerPages = [
  // 1 cover: Amal at the table with the numbers of her day
  `${homeScene()}${numberLadder(1120, 640, 0.5, { lit: 4 })}
   ${figure("amal", { x: 620, y: 950, s: 1.8, holding: heldPaper })}`,

  // 2 first thing in the morning, I count the eggs
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}${basketProp(400, 946, 1.1, { kind: "empty" })}
   ${figure("amal", { x: 720, y: 950, s: 1.68 })}
   ${hen({ x: 470, y: 908, s: 0.52 })}`,

  // 3 then we walk to the market by the coast
  `${coastScene()}${marketStall(1180, 900, 0.86)}
   ${figure("mum", { x: 620, y: 930, s: 1.62 })}
   ${figure("amal", { x: 840, y: 930, s: 1.56, holding: heldBasket })}`,

  // 4 stalls piled high with mangoes, dates and bags of flour
  `${townScene()}${marketStall(1080, 890, 0.98)}${basketProp(760, 916, 1.15, { kind: "grain" })}${mango(400, 660, 1.1)}
   ${figure("omar", { x: 980, y: 918, s: 1.58, arms: "up" })}`,

  // 5 addition: I add up the prices, item by item
  `${townScene()}${notepad(1180, 800, 1.25)}${marketStall(400, 890, 0.72)}
   ${figure("amal", { x: 760, y: 918, s: 1.68, holding: heldPaper })}`,

  // 6 at home, a big bowl of dates, and four cousins
  `${homeScene()}${roomBox(1250, 640, 1.1, "dining")}${fruitBowl(400, 940, 1.25)}
   ${figure("noah", { x: 700, y: 950, s: 1.56 })}
   ${figure("idris", { x: 880, y: 950, s: 1.44 })}
   ${figure("mina", { x: 1030, y: 952, s: 1.22 })}`,

  // 7 division: everybody gets exactly the same
  `${homeScene()}${patternStrip(1160, 700, 1.15, { cells: 4, blankLast: false })}
   ${figure("amal", { x: 640, y: 950, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 900, y: 952, s: 1.24, arms: "up" })}`,

  // 8 I measure the size of the flour bag
  `${homeScene()}${rulerProp(1150, 866, 1.15, { length: 320 })}
   ${figure("amal", { x: 660, y: 950, s: 1.68, holding: heldPaper })}`,

  // 9 and I check its weight on the kitchen scales
  `${homeScene()}${balanceScale(1180, 900, 1.25, { tilt: 6 })}
   ${figure("amal", { x: 660, y: 950, s: 1.68 })}
   ${figure("mum", { x: 900, y: 950, s: 1.58 })}`,

  // 10 both numbers go in my notebook, next to the date
  `${homeScene()}${desk(1210, 950, 1.3)}${notepad(420, 800, 1.15)}
   ${figure("amal", { x: 780, y: 950, s: 1.7, holding: heldPaper })}`,

  // 11 walking my cousins home, I count my steps: that is distance
  `${sunsetScene()}${tensLine(1160, 880, 1.15)}
   ${figure("amal", { x: 620, y: 900, s: 1.66 })}
   ${figure("noah", { x: 850, y: 900, s: 1.56 })}`,

  // 12 addition, division and measuring - all before dinner
  `${homeScene()}${roomBox(1240, 640, 1.12, "dining")}${numberLadder(400, 600, 0.46, { lit: 6 })}
   ${figure("amal", { x: 760, y: 950, s: 1.74, arms: "up" })}`,
];

// ================================================================ Book 9
// Rain Is a Kind of Weather — Unit 9: "Feelings Are Not Bad or Good", told by Nora

const rainFeelingPages = [
  // 1 cover: Nora and her mother with the photographs
  `${eveningRoom()}${photoFrame(1200, 700, 1.15, { inner: catProp(0, 40, 1.1) })}
   ${figure("nora", { x: 640, y: 950, s: 1.74 })}
   ${figure("mum", { x: 900, y: 950, s: 1.6 })}`,

  // 2 every day I feel a lot of things
  `${classroomScene()}
   ${figure("nora", { x: 620, y: 950, s: 1.72 })}
   ${figure("maya", { x: 880, y: 950, s: 1.5 })}
   ${figure("leo", { x: 1070, y: 950, s: 1.52 })}`,

  // 3 sometimes joy, and sometimes sadness
  `${gardenScene()}${rainbow(1180, 520)}
   ${figure("nora", { x: 620, y: 900, s: 1.7, arms: "up" })}`,

  // 4 rain is a kind of weather; sadness is a kind of feeling
  `${streetScene({ rainy: true })}${rain()}${puddle(1140, 936, 160, 32, 0)}
   ${figure("nora", { x: 660, y: 890, s: 1.7, mood: "sad" })}`,

  // 5 one evening my cat did not come home
  `${eveningRoom()}${roomBox(1250, 640, 1.1, "living")}
   ${figure("nora", { x: 660, y: 950, s: 1.7, mood: "sad" })}`,

  // 6 I looked in the garden, and along the wall, and down the street
  `${streetScene({ lit: true })}${lampPost(1270, 890, 1.15)}${fence(400, 890, 1.05, 3)}
   ${figure("nora", { x: 760, y: 890, s: 1.68, arms: "point" })}`,

  // 7 for two days I said nothing about it
  `${classroomScene()}${desk(1200, 950, 1.28)}
   ${figure("nora", { x: 640, y: 950, s: 1.7, mood: "sad" })}`,

  // 8 then I told my mother
  `${homeScene()}${roomBox(1250, 640, 1.1, "living")}
   ${figure("nora", { x: 640, y: 950, s: 1.68, mood: "sad" })}
   ${figure("mum", { x: 900, y: 950, s: 1.62 })}`,

  // 9 she put down her book and listened, and did not hurry me
  `${homeScene()}${openBook(1220, 856, 1.05)}
   ${figure("mum", { x: 660, y: 950, s: 1.66 })}
   ${figure("nora", { x: 920, y: 950, s: 1.6 })}`,

  // 10 talking about sadness makes the heavy feeling lighter
  `${homeScene()}${thoughtBubble(1160, 400, 1.6, `${catProp(0, 34, 1.05, { curled: true })}`)}
   ${figure("nora", { x: 660, y: 950, s: 1.68 })}
   ${figure("mum", { x: 920, y: 950, s: 1.6, arms: "point" })}`,

  // 11 we looked at the old photographs, and I laughed at the leaves one
  `${eveningRoom()}${photoFrame(1180, 700, 1.2, { inner: catProp(0, 40, 1.1) })}
   ${figure("nora", { x: 660, y: 950, s: 1.68, arms: "up" })}
   ${figure("mum", { x: 920, y: 950, s: 1.6 })}`,

  // 12 both come and go, and neither one lasts for ever
  `${gardenScene()}${rainbow(1120, 480)}${catProp(1300, 900, 1.15)}
   ${figure("nora", { x: 660, y: 900, s: 1.74 })}`,
];

// ================================================================ Book 10
// The Green Folder — Unit 10: "Amal's Year of Words"

const greenFolderPages = [
  // 1 cover: Amal holding the folder
  `${classroomScene()}${bunting(800, 150, 1.15, { span: 1160 })}
   ${figure("amal", { x: 720, y: 950, s: 1.8, holding: heldFolder })}
   ${figure("nora", { x: 1000, y: 950, s: 1.56 })}`,

  // 2 the last Monday of Year 3: one folder on every desk
  `${classroomScene()}${desk(1180, 950, 1.3, { item: folderProp(0, 0, 0.6) })}${desk(320, 950, 1.24)}
   ${figure("yasmin", { x: 760, y: 950, s: 1.66, arms: "point" })}`,

  // 3 "inside this folder is your whole year"
  `${classroomScene()}${folderProp(1230, 906, 1.4)}
   ${figure("yasmin", { x: 620, y: 950, s: 1.66 })}
   ${figure("amal", { x: 900, y: 950, s: 1.58, holding: heldFolder })}`,

  // 4 the first page is my family tree
  `${classroomScene()}${poster(1230, 690, 1.05, { colour: G3.coral, lines: 5 })}
   ${figure("amal", { x: 620, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("mina", { x: 890, y: 952, s: 1.22 })}`,

  // 5 the calendar chart: January blue, February green, March grey
  `${classroomScene()}${monthWall(886, 380, 0.82, { columns: 4, highlight: 2 })}
   ${figure("amal", { x: 400, y: 950, s: 1.66, holding: heldPaper })}`,

  // 6 my report about the county hospital
  `${classroomScene()}${photoFrame(1240, 690, 1.15, { inner: hospital(0, 80, 0.3) })}${notepad(400, 800, 1.1)}
   ${figure("amal", { x: 760, y: 950, s: 1.68, holding: heldPaper })}`,

  // 7 the climate poster, with seven days of temperature on it
  `${classroomScene()}${thermometerProp(1240, 780, 1.15, { level: 0.6 })}${poster(360, 700, 1, { colour: G3.sky, lines: 5 })}
   ${figure("amal", { x: 800, y: 950, s: 1.68 })}`,

  // 8 the page of big numbers, all the way up to a million
  `${classroomScene()}${numberLadder(860, 610, 0.5, { lit: 6 })}
   ${figure("amal", { x: 380, y: 950, s: 1.66, arms: "up" })}`,

  // 9 Nora remembered how I spelled it wrongly first
  `${classroomScene()}${desk(1220, 950, 1.28)}
   ${figure("nora", { x: 900, y: 950, s: 1.58, arms: "point" })}
   ${figure("amal", { x: 640, y: 950, s: 1.66 })}`,

  // 10 the kindness jar page, and one honest sentence on it
  `${classroomScene()}${poster(1240, 690, 1.05, { colour: G3.gold, lines: 3 })}
   ${figure("amal", { x: 680, y: 950, s: 1.7, holding: heldPaper })}`,

  // 11 Grandma Hana on how far it is from January to now
  `${eveningRoom()}${folderProp(1240, 906, 1.15)}
   ${figure("hana", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.6 })}`,

  // 12 on the last sheet I wrote my goal for Grade 4
  `${classroomScene()}${openBook(1220, 856, 1.15)}
   ${figure("amal", { x: 700, y: 950, s: 1.76, holding: heldPaper })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "junior": { dir: "junior", pages: juniorPages },
  "normal-day": { dir: "a-normal-day-at-school", pages: normalDayPages },
  "hours": { dir: "six-oclock-seven-oclock", pages: hourByHourPages },
  "bus": { dir: "the-bus-to-the-county", pages: busPages },
  "helping": { dir: "helping-hands", pages: helpingHandsPages },
  "noah": { dir: "my-cousin-noah", pages: noahPages },
  "nature": { dir: "today-and-always", pages: todayAlwaysPages },
  "maths": { dir: "maths-before-dinner", pages: mathsBeforeDinnerPages },
  "feelings": { dir: "rain-is-a-kind-of-weather", pages: rainFeelingPages },
  "folder": { dir: "the-green-folder", pages: greenFolderPages },
};

writeBooks(books, process.argv[2]);
