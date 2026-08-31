#!/usr/bin/env node

// Generates the vector illustrations for the SIXTH and SEVENTH books on the
// Grade 4 shelves of Units 1 to 5 — the owner is growing every Grade 4 unit's
// shelf from five books to seven, and this file carries the first five units'
// pair. Modeled on tools/create-grade4-shelf-ebook-illustrations.js: the same
// kit, the same local scene shorthands, and the same writeBooks call.
//
// Each unit gets one CONTINUATION — the next scene of a story the shelf
// already tells — and one VOCABULARY-IN-ACTION story that works one of the
// unit's own vocabulary groups into a setting the unit's other books have not
// used:
//
//   Unit 1  The Letter That Came Back   (the next scene of The Post Counter)
//           The Day of Kind Words       (feelings words, on the school yard)
//   Unit 2  The Fair After the Storm    (the next scene of The Storm and the
//                                        Science Tent)
//           The Weather Book            (books-and-tools words, at Amal's desk)
//   Unit 3  The Meal We Made            (the next scene of From Farm to Plate)
//           Safely Across Town          (safety-and-confidence words, at the
//                                        town crossings with Officer Rami)
//   Unit 4  A Shelf for the Town        (the next scene of The Library That
//                                        Came by Cart)
//           Visitors' Day at School     (people-and-work words, a school
//                                        visitors' day)
//   Unit 5  Simba's New Home            (the next scene of The Posters for
//                                        Simba)
//           The Measuring Day           (measuring-and-comparing words, a
//                                        class measuring everything)
//
// Only existing cast names are drawn — nothing new joins CAST_SHELF — and the
// few new props are purely local inline SVG with no data-tap, because a tap
// value promises an audio clip nobody has paid for.
//
// Usage: node tools/create-grade4-shelf-ebook-illustrations-2.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, basicScene, acacia, tallGrass, bench, mango, marketStall,
  lampPost, cityBuildings, goat, dustPuffs, confetti, sunnyPatch, rainbow,
  cloudPuff, nightScene, fence, cookpot, playBall, puddle, feather,
  G2, roomScene, sunsetScene, bookShelf, openBook, house, hut, flatBlock,
  townBus, crossing, metreStick, rulerProp, balanceScale, waterBottle,
  fruitBowl, tabletProp, motionArcs, lookLine, clinicFront, doctorKit,
  G3, heldBook, heldPaper, heldBasket, classroomScene, plainRoomScene,
  townScene, desk, poster, bunting, easel, roomBox,
  postCounterScene, counter, letterProp, scienceTent, libraryCart,
  figureShelf, dog, cat, lorry, weatherChart,
  foodTray, chairRows, hallScene, helmetProp, toolRack, signpost,
  heldNewspaper, heldNotebook,
} = require("./lib/ehel-ebook-kit-grade4-shelf.js");

const f = figureShelf;

// The same scene shorthands the other Grade 4 generators use, so a page that
// appears in more than one shelf is the same place.
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const kitchenScene = () => roomScene({ wall: "#e6e0cc", floor: "#b9865e" });
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;
const fieldScene = () => `${basicScene()}${acacia(180, 640, 1.1)}${tallGrass(1480, 940, 1.2)}`;
const clinicScene = () => `${townScene()}${clinicFront(1240, 900, 0.86)}`;
const marketScene = () => `${townScene()}${marketStall(1220, 900, 0.9)}${marketStall(300, 900, 0.72)}`;

// ================================================================ Unit 1
// Daily Life & Communication

// Book 6 — The Letter That Came Back (the next scene of The Post Counter)
const letterBackPages = [
  `${postCounterScene()}${counter(900, 950, 1)}${letterProp(660, 690, 1.2)}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}
   ${f("amal", { x: 470, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 3 })}${letterProp(650, 688, 1.25)}
   ${f("omar", { x: 1220, y: 930, s: 1.5, mood: "surprised" })}
   ${f("amal", { x: 470, y: 950, s: 1.55 })}`,

  `${postCounterScene()}${counter(900, 950, 1)}${letterProp(670, 692, 1.15)}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "point" })}
   ${f("amal", { x: 470, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${marketScene()}${lampPost(760, 706, 0.8)}
   ${f("amal", { x: 620, y: 926, s: 1.55, holding: heldNotebook, arms: "point" })}
   ${f("omar", { x: 1080, y: 926, s: 1.45 })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 2 })}${letterProp(650, 690, 1.2)}
   ${f("salma", { x: 440, y: 950, s: 1.48, arms: "point" })}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}`,

  `${townScene()}${lampPost(280, 706, 0.86)}${cityBuildings(1320, 700, 0.68)}
   ${f("omar", { x: 720, y: 926, s: 1.5 })}
   ${f("amal", { x: 960, y: 926, s: 1.52, holding: heldNotebook })}`,

  `${townScene()}${flatBlock(1240, 900, 0.66)}${flatBlock(240, 900, 0.6)}
   ${f("omar", { x: 660, y: 926, s: 1.5, arms: "point" })}
   ${f("amal", { x: 900, y: 926, s: 1.52 })}`,

  `${townScene()}${house(1240, 926, 0.82)}
   ${f("theo", { x: 900, y: 926, s: 1.5 })}
   ${f("omar", { x: 560, y: 926, s: 1.5 })}
   ${f("amal", { x: 340, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${townScene()}${house(1240, 926, 0.82)}${letterProp(820, 700, 1.3)}
   ${f("theo", { x: 940, y: 926, s: 1.52, arms: "up", mood: "surprised" })}
   ${f("omar", { x: 600, y: 926, s: 1.5 })}`,

  `${townScene()}${house(1240, 926, 0.84, { lit: true })}
   ${f("omar", { x: 620, y: 926, s: 1.5 })}
   ${f("amal", { x: 860, y: 926, s: 1.52, mood: "happy" })}`,

  `${townScene()}${house(1240, 926, 0.82, { lit: true })}
   ${f("theo", { x: 940, y: 926, s: 1.52, arms: "up" })}
   ${f("omar", { x: 620, y: 926, s: 1.5, mood: "happy" })}`,

  `${postCounterScene()}${counter(900, 950, 1, { parcels: 3 })}
   ${f("amal", { x: 500, y: 950, s: 1.58, holding: heldNotebook })}
   ${f("omar", { x: 1230, y: 930, s: 1.5 })}`,
];

// Book 7 — The Day of Kind Words (the Unit 1 feelings vocabulary, in action)
const kindWordsPages = [
  `${yardScene()}${playBall(1180, 930, 1.2)}${bench(280, 940, 1.1)}
   ${f("sami", { x: 700, y: 926, s: 1.55 })}
   ${f("adam", { x: 960, y: 926, s: 1.5 })}
   ${f("nora", { x: 480, y: 926, s: 1.5 })}`,

  `${yardScene()}${playBall(880, 930, 1.25)}
   ${f("sami", { x: 700, y: 926, s: 1.55, arms: "up", mood: "happy" })}
   ${f("adam", { x: 1080, y: 926, s: 1.5, mood: "sad" })}`,

  `${yardScene()}${playBall(760, 930, 1.2)}${bench(1360, 940, 1)}
   ${f("adam", { x: 1000, y: 926, s: 1.52, arms: "point" })}
   ${f("sami", { x: 620, y: 926, s: 1.55 })}`,

  `${yardScene()}${bench(1200, 940, 1.15)}
   ${f("adam", { x: 1000, y: 926, s: 1.52, mood: "sad" })}
   ${f("nora", { x: 560, y: 926, s: 1.5 })}`,

  `${yardScene()}${bench(1200, 940, 1.15)}
   ${f("nora", { x: 780, y: 926, s: 1.5, arms: "point", mood: "happy" })}
   ${f("adam", { x: 1020, y: 926, s: 1.52 })}`,

  `${yardScene()}${playBall(840, 930, 1.2)}${dustPuffs(700, 900)}
   ${f("sami", { x: 620, y: 926, s: 1.52, mood: "sad" })}
   ${f("theo", { x: 1040, y: 926, s: 1.5, arms: "point", mood: "surprised" })}
   ${f("leo", { x: 1240, y: 926, s: 1.48, mood: "sad" })}`,

  `${yardScene()}${playBall(1100, 930, 1.2)}
   ${f("amal", { x: 640, y: 926, s: 1.55, arms: "point" })}
   ${f("sami", { x: 900, y: 926, s: 1.52 })}`,

  `${yardScene()}${playBall(880, 936, 1.2)}${motionArcs(760, 880, 1.1)}
   ${f("sami", { x: 620, y: 926, s: 1.52, arms: "point" })}
   ${f("adam", { x: 1120, y: 926, s: 1.52, mood: "surprised" })}`,

  `${yardScene()}${playBall(880, 930, 1.2)}
   ${f("sami", { x: 660, y: 926, s: 1.52, arms: "up", mood: "happy" })}
   ${f("adam", { x: 1080, y: 926, s: 1.52, arms: "up", mood: "happy" })}`,

  `${yardScene()}${playBall(800, 930, 1.25)}${dustPuffs(960, 900)}
   ${f("amal", { x: 480, y: 926, s: 1.5, arms: "up" })}
   ${f("sami", { x: 700, y: 926, s: 1.5 })}
   ${f("adam", { x: 940, y: 926, s: 1.5, arms: "up" })}
   ${f("theo", { x: 1160, y: 926, s: 1.48 })}`,

  `${yardScene()}${bench(1240, 940, 1.1)}
   ${f("nora", { x: 640, y: 926, s: 1.5, arms: "point", mood: "happy" })}
   ${f("sami", { x: 900, y: 926, s: 1.52, mood: "happy" })}`,

  `${sunsetScene()}${lampPost(320, 930, 0.9, { lit: true })}${house(1240, 940, 0.78, { lit: true })}
   ${f("adam", { x: 760, y: 940, s: 1.55, mood: "happy" })}`,
];

// ================================================================ Unit 2
// Weather & the Sky

// Book 6 — The Fair After the Storm (the next scene of The Storm and the
// Science Tent)
const fairAfterStormPages = [
  `${fieldScene()}${scienceTent(1080, 770, 0.7)}${rainbow(700, 620)}${puddle(500, 930, 200, 48, 0)}
   ${f("amal", { x: 680, y: 926, s: 1.55 })}
   ${f("nora", { x: 900, y: 926, s: 1.5 })}`,

  `${fieldScene()}${scienceTent(1080, 770, 0.7)}${puddle(560, 930, 220, 54, 0)}${puddle(260, 950, 150, 36, 0)}
   ${f("amal", { x: 780, y: 926, s: 1.55, mood: "sad" })}
   ${f("yasmin", { x: 1040, y: 926, s: 1.48 })}`,

  `${fieldScene()}${scienceTent(1080, 770, 0.7)}${puddle(400, 940, 180, 44, 0)}
   ${f("yasmin", { x: 960, y: 926, s: 1.48, arms: "up" })}
   ${f("amal", { x: 620, y: 926, s: 1.55 })}
   ${f("nora", { x: 780, y: 926, s: 1.5 })}`,

  `${fieldScene()}${scienceTent(1120, 770, 0.66)}${easel(340, 950, 1.2, { inner: poster(0, 0, 0.48, { colour: G3.teal }) })}
   ${f("amal", { x: 700, y: 926, s: 1.55, arms: "up" })}
   ${f("nora", { x: 920, y: 926, s: 1.5, holding: heldPaper })}`,

  `${fieldScene()}${scienceTent(1080, 770, 0.7)}${dustPuffs(700, 900)}
   ${f("sami", { x: 640, y: 926, s: 1.52, arms: "up" })}
   ${f("adam", { x: 880, y: 926, s: 1.52, arms: "point" })}`,

  `${sunsetScene()}${scienceTent(1080, 790, 0.68)}
   ${f("yasmin", { x: 640, y: 940, s: 1.48 })}
   ${f("amal", { x: 880, y: 940, s: 1.52 })}`,

  `${fieldScene()}${sunnyPatch(820, 780)}${cloudPuff(420, 230, 1.1)}
   ${f("amal", { x: 720, y: 926, s: 1.58, arms: "up", mood: "happy" })}`,

  `${fieldScene()}${scienceTent(1120, 770, 0.68)}${bunting(700, 190, 1.1, { span: 960 })}${easel(360, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.gold }) })}
   ${f("nora", { x: 660, y: 926, s: 1.52, arms: "point" })}
   ${f("omar", { x: 940, y: 926, s: 1.45 })}
   ${f("salma", { x: 1160, y: 926, s: 1.42 })}`,

  `${fieldScene()}${waterBottle(1060, 930, 1.35)}${bunting(700, 190, 1.05, { span: 900 })}
   ${f("amal", { x: 700, y: 926, s: 1.58, arms: "point" })}
   ${f("yasmin", { x: 420, y: 926, s: 1.46 })}`,

  `${fieldScene()}${scienceTent(1120, 770, 0.66)}${rainbow(680, 600)}
   ${f("amal", { x: 560, y: 926, s: 1.52, arms: "up" })}
   ${f("nora", { x: 780, y: 926, s: 1.5, arms: "up" })}
   ${f("sami", { x: 1000, y: 926, s: 1.48, arms: "up" })}`,

  `${fieldScene()}${scienceTent(1100, 770, 0.68)}${confetti(700, 540)}
   ${f("yasmin", { x: 900, y: 926, s: 1.5, arms: "up", mood: "happy" })}
   ${f("amal", { x: 620, y: 926, s: 1.55 })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.8)}
   ${f("amal", { x: 740, y: 950, s: 1.6, holding: heldPaper })}`,
];

// Book 7 — The Weather Book (the Unit 2 books-and-tools vocabulary, in action)
const weatherBookPages = [
  `${homeScene()}${desk(1240, 950, 1.1, { item: openBook(0, 0, 0.45) })}${bookShelf(300, 950, 0.8)}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldBook })}
   ${f("nora", { x: 960, y: 950, s: 1.52 })}`,

  `${homeScene()}${bookShelf(1420, 950, 0.9)}${bookShelf(240, 950, 0.8)}
   ${f("nora", { x: 700, y: 950, s: 1.55, arms: "up", mood: "happy" })}
   ${f("amal", { x: 960, y: 950, s: 1.55 })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}
   ${f("amal", { x: 720, y: 950, s: 1.58, holding: heldPaper })}
   ${f("nora", { x: 980, y: 950, s: 1.52, arms: "point" })}`,

  `${homeScene()}${weatherChartWall()}${desk(1250, 950, 1.05, { item: openBook(0, 0, 0.42) })}
   ${f("amal", { x: 700, y: 950, s: 1.55, holding: heldBook })}
   ${f("nora", { x: 950, y: 950, s: 1.5, arms: "point" })}`,

  `${homeScene()}${tabletProp(1220, 940, 1.3)}${bookShelf(280, 950, 0.8)}
   ${f("nora", { x: 760, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 1000, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}
   ${f("amal", { x: 720, y: 950, s: 1.58, holding: heldPaper, mood: "sad" })}
   ${f("nora", { x: 980, y: 950, s: 1.52, arms: "point", mood: "happy" })}`,

  `${townScene()}${cloudPuff(520, 230, 1.2)}${cloudPuff(1080, 190, 1)}${lampPost(280, 706, 0.86)}
   ${f("amal", { x: 680, y: 926, s: 1.55, arms: "point", holding: heldNotebook })}
   ${f("nora", { x: 920, y: 926, s: 1.5, arms: "up" })}`,

  `${townScene()}${cloudPuff(700, 200, 1.3)}${puddle(1100, 930, 200, 48, 0)}
   ${f("nora", { x: 640, y: 926, s: 1.52, holding: heldNotebook })}
   ${f("amal", { x: 880, y: 926, s: 1.52, arms: "point" })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "living")}${desk(360, 950, 1, { item: openBook(0, 0, 0.42) })}
   ${f("mum", { x: 980, y: 950, s: 1.5, holding: heldBook })}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,

  `${classroomScene()}${bookShelf(1420, 950, 0.9)}
   ${f("yasmin", { x: 1040, y: 950, s: 1.5, holding: heldBook })}
   ${f("amal", { x: 560, y: 950, s: 1.52 })}
   ${f("nora", { x: 760, y: 950, s: 1.5 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldBook })}
   ${f("sami", { x: 680, y: 950, s: 1.52, arms: "point" })}
   ${f("theo", { x: 900, y: 950, s: 1.5 })}
   ${f("nora", { x: 1120, y: 950, s: 1.52, holding: heldBook })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${weatherChartWall(620)}
   ${f("nora", { x: 850, y: 950, s: 1.58, holding: heldPaper, mood: "happy" })}`,
];

// The weather chart hung on the wall of Amal's room — the shelf kit's chart at
// picture-frame height, wrapped so both pages hang it in the same place.
function weatherChartWall(x = 560) {
  return weatherChart(x, 560, 0.8);
}

// ================================================================ Unit 3
// Food & Staying Well

// Book 6 — The Meal We Made (the next scene of From Farm to Plate)
const mealWeMadePages = [
  `${kitchenScene()}${cookpot(1240, 940, 1.35)}${foodTray(400, 940, 0.86, { bowls: 3 })}
   ${f("mum", { x: 700, y: 950, s: 1.5 })}
   ${f("amal", { x: 950, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${fruitBowl(1240, 940, 1.3)}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldBasket })}
   ${f("mina", { x: 960, y: 950, s: 1.3, mood: "happy" })}`,

  `${kitchenScene()}${roomBox(1260, 640, 1.1, "kitchen")}${cookpot(420, 930, 1.25)}
   ${f("mum", { x: 940, y: 950, s: 1.5, arms: "up" })}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${fruitBowl(400, 940, 1.25)}${waterBottle(1250, 940, 1.35)}
   ${f("hana", { x: 900, y: 950, s: 1.46, arms: "point" })}
   ${f("amal", { x: 640, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${cookpot(1240, 940, 1.3)}
   ${f("amal", { x: 680, y: 950, s: 1.55, arms: "point" })}
   ${f("mina", { x: 940, y: 950, s: 1.3 })}`,

  `${kitchenScene()}${cookpot(1240, 940, 1.4)}
   ${f("dad", { x: 900, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 620, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${cookpot(1240, 940, 1.35)}${foodTray(400, 940, 0.8, { bowls: 2 })}
   ${f("mum", { x: 680, y: 950, s: 1.5, mood: "happy" })}
   ${f("hana", { x: 940, y: 950, s: 1.46, mood: "happy" })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "dining")}${foodTray(420, 950, 0.9, { bowls: 4 })}
   ${f("mum", { x: 660, y: 950, s: 1.48 })}
   ${f("dad", { x: 880, y: 950, s: 1.5 })}
   ${f("mina", { x: 1080, y: 950, s: 1.28 })}`,

  `${homeScene()}${foodTray(1230, 950, 1.15, { bowls: 4 })}
   ${f("amal", { x: 700, y: 950, s: 1.58, arms: "point" })}
   ${f("dad", { x: 960, y: 950, s: 1.5 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.02, "dining")}${foodTray(400, 950, 0.86, { bowls: 3 })}
   ${f("hana", { x: 620, y: 950, s: 1.44, mood: "happy" })}
   ${f("mum", { x: 840, y: 950, s: 1.46, mood: "happy" })}
   ${f("amal", { x: 1060, y: 950, s: 1.5, mood: "happy" })}`,

  `${homeScene()}${foodTray(1230, 950, 1.1, { bowls: 3 })}
   ${f("mina", { x: 700, y: 950, s: 1.32, arms: "up", mood: "happy" })}
   ${f("mum", { x: 940, y: 950, s: 1.5, arms: "point" })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 740, y: 950, s: 1.6, holding: heldPaper })}`,
];

// Book 7 — Safely Across Town (the Unit 3 safety-and-confidence vocabulary)
const safelyAcrossPages = [
  `${townScene()}${crossing(1180, 906, 0.9)}${lampPost(280, 706, 0.86)}
   ${f("rami", { x: 960, y: 926, s: 1.5 })}
   ${f("nora", { x: 620, y: 926, s: 1.52, holding: heldPaper })}`,

  `${townScene()}${lampPost(300, 706, 0.86)}${cityBuildings(1300, 700, 0.7)}
   ${f("nora", { x: 760, y: 926, s: 1.55, holding: heldPaper, mood: "sad" })}`,

  `${townScene()}${signpost(1220, 926, 1)}
   ${f("nora", { x: 720, y: 926, s: 1.55, mood: "sad" })}`,

  `${townScene()}${crossing(1180, 906, 0.9)}
   ${f("rami", { x: 900, y: 926, s: 1.5, arms: "point" })}
   ${f("nora", { x: 600, y: 926, s: 1.52, holding: heldPaper })}`,

  `${townScene()}${crossing(1180, 906, 0.9)}${lookLine(760, 740, 1200, 830)}
   ${f("rami", { x: 1000, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 660, y: 926, s: 1.52 })}`,

  `${townScene()}${crossing(760, 906, 0.95)}${lampPost(1320, 706, 0.86)}
   ${f("nora", { x: 700, y: 926, s: 1.55, holding: heldPaper })}
   ${f("rami", { x: 340, y: 926, s: 1.46 })}`,

  `${townScene()}${townBus(1140, 926, 0.66)}${lampPost(300, 706, 0.86)}
   ${f("nora", { x: 640, y: 926, s: 1.55 })}`,

  `${townScene()}${lorry(1100, 926, 0.8)}
   ${f("nora", { x: 460, y: 926, s: 1.55, mood: "surprised" })}`,

  `${townScene()}${crossing(1180, 906, 0.9)}${sunnyPatch(600, 760)}
   ${f("nora", { x: 700, y: 926, s: 1.58, arms: "up", mood: "happy" })}`,

  `${clinicScene()}
   ${f("sarah", { x: 940, y: 926, s: 1.48, arms: "point" })}
   ${f("nora", { x: 620, y: 926, s: 1.52, holding: heldPaper, mood: "happy" })}`,

  `${townScene()}${cityBuildings(1300, 700, 0.68)}${lampPost(300, 706, 0.86)}
   ${f("nora", { x: 760, y: 926, s: 1.58, mood: "happy" })}`,

  `${townScene()}${crossing(1180, 906, 0.9)}
   ${f("rami", { x: 1000, y: 926, s: 1.5, arms: "up", mood: "happy" })}
   ${f("nora", { x: 640, y: 926, s: 1.55, arms: "up", mood: "happy" })}`,
];

// ================================================================ Unit 4
// Community & the News

// Book 6 — A Shelf for the Town (the next scene of The Library That Came by
// Cart and The Town Meeting)
const townShelfPages = [
  `${hallScene()}${bookShelf(1380, 950, 1)}${libraryCart(1080, 950, 0.6)}
   ${f("mayor", { x: 620, y: 950, s: 1.5 })}
   ${f("maya", { x: 380, y: 950, s: 1.52, holding: heldNewspaper })}`,

  `${townScene()}${poster(1200, 640, 1.15, { colour: G3.gold, lines: 4 })}${lampPost(280, 706, 0.86)}
   ${f("maya", { x: 640, y: 926, s: 1.52, holding: heldNewspaper })}
   ${f("amal", { x: 880, y: 926, s: 1.52 })}`,

  `${hallScene()}${chairRows(700, 950, 0.85, { rows: 2, seats: 4 })}
   ${f("mayor", { x: 1240, y: 950, s: 1.52, arms: "up" })}`,

  `${hallScene()}${chairRows(560, 950, 0.78, { rows: 2, seats: 3 })}
   ${f("omar", { x: 1020, y: 950, s: 1.46, arms: "up" })}
   ${f("yasmin", { x: 1240, y: 950, s: 1.46, arms: "up" })}
   ${f("amal", { x: 1440, y: 950, s: 1.5, arms: "up" })}`,

  `${hallScene()}${bookShelf(1380, 950, 0.95)}
   ${f("omar", { x: 660, y: 950, s: 1.48, holding: heldBook })}
   ${f("yasmin", { x: 940, y: 950, s: 1.48, holding: heldBook })}`,

  `${hallScene()}${bookShelf(1380, 950, 1)}${bookShelf(1120, 950, 0.85)}
   ${f("librarian", { x: 700, y: 950, s: 1.48, arms: "point", mood: "happy" })}
   ${f("maya", { x: 420, y: 950, s: 1.5, holding: heldNotebook })}`,

  `${hallScene()}${bookShelf(1380, 950, 1)}${toolRack(360, 950, 1)}
   ${f("karim", { x: 900, y: 950, s: 1.5, arms: "point" })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}
   ${f("maya", { x: 740, y: 950, s: 1.58, holding: heldNotebook })}`,

  `${hallScene()}${bunting(800, 150, 1.25, { span: 1280 })}${chairRows(560, 950, 0.8, { rows: 2, seats: 4 })}${bookShelf(1380, 950, 1)}
   ${f("mayor", { x: 1120, y: 950, s: 1.5, arms: "up" })}
   ${f("salma", { x: 320, y: 950, s: 1.42 })}`,

  `${hallScene()}${bookShelf(1380, 950, 0.95)}
   ${f("amal", { x: 780, y: 950, s: 1.55, holding: heldBook, arms: "point" })}
   ${f("mina", { x: 1020, y: 950, s: 1.28, mood: "happy" })}
   ${f("noah", { x: 1160, y: 950, s: 1.32, mood: "happy" })}`,

  `${townScene()}${libraryCart(1100, 926, 0.75)}${lampPost(300, 706, 0.86)}
   ${f("librarian", { x: 760, y: 926, s: 1.46 })}
   ${f("maya", { x: 520, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${hallScene()}${bookShelf(1380, 950, 1)}${confetti(760, 500)}
   ${f("maya", { x: 700, y: 950, s: 1.56, holding: heldNewspaper, arms: "point" })}
   ${f("amal", { x: 960, y: 950, s: 1.52, mood: "happy" })}`,
];

// Book 7 — Visitors' Day at School (the Unit 4 people-and-work vocabulary)
const visitorsDayPages = [
  `${classroomScene()}${bunting(800, 170, 1.15, { span: 1100 })}${helmetProp(1300, 950, 1.1)}
   ${f("yasmin", { x: 640, y: 950, s: 1.5 })}
   ${f("elena", { x: 960, y: 950, s: 1.48 })}`,

  `${classroomScene()}${poster(1240, 660, 1.15, { colour: G3.teal, lines: 4 })}
   ${f("yasmin", { x: 900, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 600, y: 950, s: 1.52 })}`,

  `${plainRoomScene()}${chairRows(700, 950, 0.85, { rows: 2, seats: 4 })}
   ${f("yasmin", { x: 1240, y: 950, s: 1.5, arms: "point" })}
   ${f("sami", { x: 1440, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${helmetProp(400, 950, 1.15)}${chairRows(1150, 950, 0.7, { rows: 2, seats: 3 })}
   ${f("elena", { x: 700, y: 950, s: 1.5, arms: "up" })}
   ${f("amal", { x: 950, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${doctorKit(380, 950, 1.15)}${chairRows(1150, 950, 0.7, { rows: 2, seats: 3 })}
   ${f("sarah", { x: 700, y: 950, s: 1.5, arms: "point" })}
   ${f("nora", { x: 950, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${chairRows(1150, 950, 0.7, { rows: 2, seats: 3 })}
   ${f("rami", { x: 700, y: 950, s: 1.5, arms: "up" })}
   ${f("sami", { x: 980, y: 950, s: 1.5, mood: "surprised" })}`,

  `${plainRoomScene()}${toolRack(380, 950, 1.1)}${chairRows(1150, 950, 0.7, { rows: 2, seats: 3 })}
   ${f("karim", { x: 700, y: 950, s: 1.5, arms: "point" })}
   ${f("theo", { x: 960, y: 950, s: 1.48 })}`,

  `${plainRoomScene()}${chairRows(560, 950, 0.75, { rows: 2, seats: 3 })}
   ${f("mayor", { x: 1120, y: 950, s: 1.52 })}
   ${f("amal", { x: 860, y: 950, s: 1.5, mood: "surprised" })}
   ${f("sami", { x: 1340, y: 950, s: 1.48, mood: "surprised" })}`,

  `${plainRoomScene()}${chairRows(620, 950, 0.8, { rows: 2, seats: 4 })}
   ${f("mayor", { x: 1180, y: 950, s: 1.52, arms: "up" })}`,

  `${plainRoomScene()}${chairRows(400, 950, 0.66, { rows: 2, seats: 2 })}
   ${f("sami", { x: 700, y: 950, s: 1.52, arms: "up" })}
   ${f("elena", { x: 1000, y: 950, s: 1.48, mood: "happy" })}
   ${f("sarah", { x: 1240, y: 950, s: 1.48, mood: "happy" })}`,

  `${classroomScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.coral }) })}
   ${f("amal", { x: 760, y: 950, s: 1.58, arms: "point", holding: heldPaper })}`,

  `${classroomScene()}${bunting(800, 170, 1.15, { span: 1100 })}
   ${f("yasmin", { x: 1100, y: 950, s: 1.5, arms: "up" })}
   ${f("amal", { x: 560, y: 950, s: 1.52, arms: "up" })}
   ${f("nora", { x: 760, y: 950, s: 1.5, arms: "up" })}
   ${f("sami", { x: 940, y: 950, s: 1.5, arms: "up" })}`,
];

// ================================================================ Unit 5
// Action & Movement

// Book 6 — Simba's New Home (the next scene of The Posters for Simba)
const simbaHomePages = [
  `${fieldScene()}${fence(1360, 926, 1, 2)}
   ${dog(1020, 926, 1.45)}
   ${f("talia", { x: 640, y: 926, s: 1.48 })}
   ${f("amal", { x: 420, y: 926, s: 1.5 })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}${waterBottle(360, 950, 1.3)}
   ${f("talia", { x: 1040, y: 950, s: 1.48 })}
   ${dog(700, 950, 1.35, { thin: true, sitting: true })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}
   ${f("talia", { x: 1000, y: 950, s: 1.48, arms: "point" })}
   ${dog(660, 950, 1.35, { thin: true, sitting: true })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}${foodTray(380, 950, 0.8, { bowls: 1 })}
   ${f("talia", { x: 1020, y: 950, s: 1.48, mood: "happy" })}
   ${dog(680, 950, 1.4, { sitting: true })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}
   ${f("amal", { x: 420, y: 950, s: 1.5 })}
   ${f("nora", { x: 640, y: 950, s: 1.48 })}
   ${f("leo", { x: 860, y: 950, s: 1.48 })}
   ${dog(1180, 950, 1.4, { sitting: true })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}
   ${f("talia", { x: 1000, y: 950, s: 1.48, arms: "point" })}
   ${f("amal", { x: 680, y: 950, s: 1.52 })}
   ${dog(400, 950, 1.3, { sitting: true })}`,

  `${fieldScene()}${dustPuffs(880, 900)}${motionArcs(820, 840, 1.2)}
   ${dog(1040, 926, 1.4)}
   ${f("amal", { x: 560, y: 926, s: 1.52, arms: "up", mood: "happy" })}`,

  `${fieldScene()}${fence(1200, 926, 1.2, 3)}${dustPuffs(700, 900)}
   ${f("adam", { x: 560, y: 926, s: 1.55 })}
   ${dog(920, 926, 1.4)}`,

  `${fieldScene()}${playBall(880, 936, 1.2)}${motionArcs(760, 870, 1.1)}
   ${f("leo", { x: 560, y: 926, s: 1.5, arms: "point" })}
   ${dog(1080, 926, 1.4)}`,

  `${fieldScene()}${sunnyPatch(900, 780)}
   ${dog(900, 926, 1.55)}
   ${f("nora", { x: 520, y: 926, s: 1.5, mood: "happy" })}`,

  `${fieldScene()}${fence(1360, 926, 1, 2)}
   ${f("talia", { x: 620, y: 926, s: 1.48, arms: "point" })}
   ${f("amal", { x: 380, y: 926, s: 1.5 })}
   ${dog(940, 926, 1.45)}`,

  `${sunsetScene()}${hut(1240, 930, 0.78)}
   ${dog(960, 940, 1.4, { sitting: true })}
   ${f("talia", { x: 680, y: 940, s: 1.48, mood: "happy" })}`,
];

// Book 7 — The Measuring Day (the Unit 5 measuring-and-comparing vocabulary)
const measuringDayPages = [
  `${classroomScene()}${metreStick(1160, 950, 1.15)}${balanceScale(360, 950, 1, { tilt: -9, left: mango(0, 0, 1.4), right: feather(0, -10, 0.85) })}
   ${f("yasmin", { x: 700, y: 950, s: 1.5 })}
   ${f("amal", { x: 950, y: 950, s: 1.52 })}`,

  `${classroomScene()}${metreStick(1180, 950, 1.15)}${rulerProp(360, 930, 1.05, { rotate: -8 })}
   ${f("yasmin", { x: 800, y: 950, s: 1.52, arms: "up" })}`,

  `${classroomScene()}${metreStick(1080, 950, 1.25)}
   ${f("amal", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("nora", { x: 920, y: 950, s: 1.5, mood: "surprised" })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}${rulerProp(880, 742, 1)}
   ${f("nora", { x: 620, y: 950, s: 1.52, arms: "point" })}
   ${f("leo", { x: 1080, y: 950, s: 1.5 })}`,

  `${classroomScene()}${balanceScale(1080, 950, 1.05, { tilt: -9, left: mango(0, 0, 1.5), right: feather(0, -10, 0.9) })}
   ${f("amal", { x: 620, y: 950, s: 1.52 })}
   ${f("leo", { x: 840, y: 950, s: 1.5, mood: "surprised" })}`,

  `${classroomScene()}${balanceScale(1120, 950, 1, { left: mango(0, 0, 1.3), right: mango(0, 0, 1.3) })}
   ${f("yasmin", { x: 780, y: 950, s: 1.5, arms: "point" })}
   ${f("sami", { x: 500, y: 950, s: 1.5, mood: "surprised" })}`,

  `${classroomScene()}${waterBottle(1080, 940, 1.35)}
   ${f("nora", { x: 700, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 940, y: 950, s: 1.52 })}`,

  `${yardScene()}${dustPuffs(760, 900)}${bench(280, 940, 1.05)}
   ${f("adam", { x: 640, y: 926, s: 1.55 })}
   ${f("amal", { x: 900, y: 926, s: 1.52 })}
   ${f("nora", { x: 1120, y: 926, s: 1.5, mood: "happy" })}`,

  `${classroomScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.sky, lines: 5 }) })}
   ${f("nora", { x: 760, y: 950, s: 1.55, arms: "point" })}`,

  `${classroomScene()}${metreStick(1060, 950, 1.2)}
   ${f("adam", { x: 700, y: 950, s: 1.55 })}
   ${f("leo", { x: 880, y: 950, s: 1.52 })}
   ${f("yasmin", { x: 420, y: 950, s: 1.48, arms: "point" })}`,

  `${classroomScene()}${bunting(800, 170, 1.1, { span: 1050 })}
   ${f("yasmin", { x: 1080, y: 950, s: 1.5, arms: "up" })}
   ${f("amal", { x: 600, y: 950, s: 1.52, arms: "up" })}
   ${f("nora", { x: 800, y: 950, s: 1.5, arms: "up" })}`,

  `${homeScene()}${rulerProp(1240, 930, 1.1, { rotate: -10 })}${desk(360, 950, 1, { item: heldPaper })}
   ${f("amal", { x: 760, y: 950, s: 1.58, arms: "point" })}
   ${cat(1100, 950, 1.2)}`,
];

// ---------------------------------------------------------------- write files

const books = {
  // Unit 1
  "letter-back": { dir: "the-letter-that-came-back", pages: letterBackPages },
  "kind-words": { dir: "the-day-of-kind-words", pages: kindWordsPages },
  // Unit 2
  "fair-after-storm": { dir: "the-fair-after-the-storm", pages: fairAfterStormPages },
  "weather-book": { dir: "the-weather-book", pages: weatherBookPages },
  // Unit 3
  "meal-we-made": { dir: "the-meal-we-made", pages: mealWeMadePages },
  "safely-across": { dir: "safely-across-town", pages: safelyAcrossPages },
  // Unit 4
  "town-shelf": { dir: "a-shelf-for-the-town", pages: townShelfPages },
  "visitors-day": { dir: "visitors-day-at-school", pages: visitorsDayPages },
  // Unit 5
  "simba-home": { dir: "simbas-new-home", pages: simbaHomePages },
  "measuring-day": { dir: "the-measuring-day", pages: measuringDayPages },
};

writeBooks(books, process.argv[2]);
