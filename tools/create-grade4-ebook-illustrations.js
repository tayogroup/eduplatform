#!/usr/bin/env node

// Generates the vector illustrations for the Grade 4 picture-book series —
// one book per unit, the same shape Grades 1 to 3 use:
//   1  The Post Counter                Unit 1  Daily Life & Communication
//   2  The Storm and the Science Tent  Unit 2  Nature & Weather
//   3  From Farm to Plate              Unit 3  Food and Health
//   4  The Library That Came by Cart   Unit 4  Community and Communication
//   5  The Spiral Cave                 Unit 5  Action and Movement
//   6  The Community Parade            Unit 6  People in Society
//   7  The Day of the Play             Unit 7  Emotions, Behaviour, Identity
//   8  The Attic Clue                  Unit 8  Tools, Machines, Everyday Items
//   9  The Day We Got Lost             Unit 9  Places, People, and Plans
//   10 Nine Rooms                      Unit 10 Capstone
//
// Same cast as Grade 3, a year older — Amal, Nora, Teacher Yasmin, Omar, Sami,
// Noah and the family all continue through the Grade 4 readings — plus MAYA, the
// young reporter Unit 4 introduces. Every book is built on its unit's own story
// device: the post counter, the science fair storm, the farm-to-plate trail, the
// travelling library cart, the spiral cave, the community parade, the school
// play, the attic, the trip to the capital, and the Year 4 Exhibition.
//
// Usage: node tools/create-grade4-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, sky, sun, hills, ground, acacia, tallGrass, basicScene,
  bench, mango, marketStall, seedRow, wildBird, goat, hen, dustPuffs, confetti, sunnyPatch,
  cloudPuff, lampPost, cityBuildings, litterBits, gardenPlant, plantStage, wateringCan,
  G2, roomScene, roomBox, sunsetScene, bookShelf, openBook, house, hut, flatBlock,
  libraryBuilding, shoppingCentre, townBus, crossing, mapProp, rulerProp, metreStick,
  bunting, easel, lookLine, motionArcs, undergroundTrain, ferryBoat, helicopterProp,
  G3, heldBook, heldPaper, heldShell, classroomScene, plainRoomScene, townScene,
  coastScene, forestScene, mountainScene, gardenWall, boxOfIdeas, desk, globeProp,
  shells, hospital, monthWall, poster,
  figure4, postCounterScene, counter, letterProp, scienceTent, stormScene, farmField,
  libraryCart, caveScene, stageScene, telescope, atticScene, oldBoxes,
  capitalScene, signpost, museum, paradeBanner,
} = require("./lib/ehel-ebook-kit-grade4.js");

const f = figure4;
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;
const fieldScene = () => `${basicScene()}${acacia(180, 640, 1.1)}${tallGrass(1480, 940, 1.2)}`;

// ================================================================ Book 1
// The Post Counter — Unit 1: Daily Life & Communication

const postPages = [
  `${postCounterScene()}${counter(880, 950, 1)}
   ${f("omar", { x: 1180, y: 930, s: 1.5, arms: "point" })}
   ${f("amal", { x: 430, y: 950, s: 1.5, holding: heldPaper })}`,

  `${postCounterScene()}${counter(900, 950, 1)}
   ${f("omar", { x: 1200, y: 930, s: 1.55 })}
   ${letterProp(700, 700, 1.1)}`,

  `${postCounterScene()}${counter(860, 950, 1)}
   ${f("omar", { x: 1180, y: 930, s: 1.5 })}
   ${f("salma", { x: 400, y: 950, s: 1.5 })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 4 })}
   ${f("omar", { x: 1200, y: 930, s: 1.5, arms: "point" })}
   ${letterProp(560, 690, 1.2, { open: true })}`,

  `${townScene()}${marketStall(1200, 900, 0.86)}${lampPost(240, 706, 0.86)}
   ${f("omar", { x: 1180, y: 926, s: 1.45 })}
   ${f("amal", { x: 560, y: 926, s: 1.5, holding: heldPaper })}
   ${f("maya", { x: 760, y: 926, s: 1.5 })}`,

  `${postCounterScene()}${counter(900, 950, 1)}
   ${f("amal", { x: 520, y: 950, s: 1.55, holding: heldPaper })}
   ${f("omar", { x: 1200, y: 930, s: 1.5, arms: "point" })}`,

  `${homeScene()}${roomBox(1250, 640, 1.15, "kitchen")}
   ${f("amal", { x: 520, y: 950, s: 1.55 })}
   ${f("mum", { x: 790, y: 950, s: 1.55 })}`,

  `${yardScene()}${bench(1200, 940, 1.4)}
   ${f("amal", { x: 560, y: 926, s: 1.55, holding: heldBook })}
   ${f("nora", { x: 790, y: 926, s: 1.5 })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 5 })}
   ${f("omar", { x: 1200, y: 930, s: 1.5 })}
   ${motionArcs(560, 700, 1.2)}`,

  `${classroomScene()}
   ${f("yasmin", { x: 1100, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 640, y: 950, s: 1.5, holding: heldPaper })}
   ${f("maya", { x: 400, y: 950, s: 1.5 })}`,

  `${postCounterScene()}${counter(880, 950, 1)}
   ${f("omar", { x: 1200, y: 930, s: 1.5, arms: "up" })}
   ${f("amal", { x: 480, y: 950, s: 1.55, arms: "up" })}
   ${letterProp(700, 690, 1.1, { open: true })}`,

  `${sunsetScene()}${house(1200, 930, 0.72)}${lampPost(300, 930, 0.9, { lit: true })}
   ${f("amal", { x: 660, y: 940, s: 1.55, holding: heldPaper })}`,
];

// ================================================================ Book 2
// The Storm and the Science Tent — Unit 2: Nature & Weather

const stormPages = [
  `${stormScene()}${scienceTent(860, 780, 0.86, { stormy: true })}
   ${f("amal", { x: 330, y: 950, s: 1.5, mood: "surprised" })}
   ${f("nora", { x: 1330, y: 950, s: 1.45 })}`,

  `${fieldScene()}${scienceTent(900, 760, 0.9)}${bunting(700, 190, 1.1, { span: 980 })}
   ${f("yasmin", { x: 400, y: 926, s: 1.5, arms: "point" })}
   ${f("amal", { x: 640, y: 926, s: 1.5, holding: heldPaper })}`,

  `${fieldScene()}${scienceTent(1080, 760, 0.72)}
   ${f("nora", { x: 560, y: 926, s: 1.55, holding: heldBook })}
   ${f("amal", { x: 790, y: 926, s: 1.5 })}
   ${globeProp(300, 930, 1.1)}`,

  `${fieldScene()}${cloudPuff(560, 250, 1.3)}${cloudPuff(1180, 210, 1.5)}
   ${f("amal", { x: 700, y: 926, s: 1.55, arms: "point" })}
   ${lookLine(800, 780, 1120, 330)}`,

  `${fieldScene()}${scienceTent(880, 770, 0.86)}
   ${f("yasmin", { x: 400, y: 926, s: 1.5 })}
   ${f("nora", { x: 1240, y: 926, s: 1.5, holding: heldPaper })}`,

  `${stormScene({ lightning: false })}${scienceTent(880, 790, 0.86, { stormy: true })}
   ${f("nora", { x: 400, y: 950, s: 1.5, mood: "surprised" })}
   ${f("amal", { x: 1280, y: 950, s: 1.5, mood: "surprised" })}`,

  `${stormScene()}${scienceTent(900, 790, 0.86, { stormy: true })}
   ${f("yasmin", { x: 380, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 1300, y: 950, s: 1.45 })}`,

  `${stormScene({ lightning: false })}${scienceTent(840, 790, 0.9, { stormy: true })}
   ${f("amal", { x: 400, y: 950, s: 1.5, arms: "up" })}
   ${f("nora", { x: 1320, y: 950, s: 1.5, arms: "up" })}
   ${motionArcs(560, 720, 1.3)}`,

  `${stormScene({ lightning: false })}
   ${f("yasmin", { x: 560, y: 950, s: 1.55 })}
   ${f("amal", { x: 830, y: 950, s: 1.5 })}
   ${f("nora", { x: 1040, y: 950, s: 1.45 })}`,

  `${fieldScene()}${cloudPuff(400, 230, 1.2, { grey: true })}${scienceTent(1060, 770, 0.78)}
   ${f("amal", { x: 560, y: 926, s: 1.55, holding: heldPaper })}`,

  `${fieldScene()}${scienceTent(880, 760, 0.9)}${sunnyPatch(820, 960)}
   ${f("nora", { x: 420, y: 926, s: 1.5, arms: "up" })}
   ${f("amal", { x: 1300, y: 926, s: 1.5, arms: "up" })}`,

  `${sunsetScene()}${scienceTent(1100, 900, 0.6)}
   ${f("amal", { x: 560, y: 940, s: 1.55, holding: heldBook })}
   ${f("nora", { x: 790, y: 940, s: 1.5 })}`,
];

// ================================================================ Book 3
// From Farm to Plate — Unit 3: Food and Health

const farmPages = [
  `${basicScene()}${farmField(800, 900, 1)}${acacia(1420, 640, 1.05)}
   ${f("amal", { x: 430, y: 926, s: 1.5, holding: heldBook })}
   ${f("dad", { x: 700, y: 926, s: 1.5 })}`,

  `${basicScene()}${farmField(820, 910, 1.05)}
   ${f("dad", { x: 400, y: 926, s: 1.55, arms: "point" })}
   ${f("amal", { x: 660, y: 926, s: 1.5 })}`,

  `${basicScene()}${farmField(760, 900, 1)}${goat({ x: 1300, y: 880, s: 0.62 })}
   ${f("adam", { x: 480, y: 926, s: 1.5 })}
   ${f("idris", { x: 700, y: 926, s: 1.4 })}`,

  `${townScene()}${marketStall(1080, 900, 1)}${mango(980, 840, 1.2)}${mango(1040, 850, 1)}
   ${f("omar", { x: 1060, y: 926, s: 1.5, arms: "up" })}
   ${f("amal", { x: 480, y: 926, s: 1.5, holding: heldPaper })}`,

  `${townScene()}${marketStall(1200, 900, 0.86)}${hen({ x: 320, y: 900, s: 0.52 })}
   ${f("mum", { x: 620, y: 926, s: 1.55 })}
   ${f("amal", { x: 860, y: 926, s: 1.5, arms: "point" })}`,

  `${homeScene()}${roomBox(1250, 640, 1.2, "kitchen")}
   ${f("hana", { x: 520, y: 950, s: 1.55, glasses: true })}
   ${f("amal", { x: 790, y: 950, s: 1.5 })}`,

  `${homeScene()}${roomBox(400, 640, 1.2, "kitchen")}
   ${f("mum", { x: 880, y: 950, s: 1.55, arms: "point" })}
   ${f("mina", { x: 1140, y: 952, s: 1.2 })}`,

  `${townScene()}${hospital(1150, 830, 0.78)}
   ${f("amal", { x: 480, y: 926, s: 1.5, mood: "sad" })}
   ${f("mum", { x: 700, y: 926, s: 1.5 })}`,

  `${classroomScene()}${poster(1230, 700, 1.05, { colour: G3.leafy, lines: 5 })}
   ${f("yasmin", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 400, y: 950, s: 1.5, holding: heldPaper })}`,

  `${homeScene()}${roomBox(1240, 640, 1.2, "dining")}
   ${f("amal", { x: 480, y: 950, s: 1.5 })}
   ${f("noah", { x: 720, y: 950, s: 1.5 })}`,

  `${basicScene()}${farmField(820, 900, 1)}${plantStage(400, 906, 1.5, "flower")}
   ${f("amal", { x: 620, y: 926, s: 1.55, arms: "up" })}`,

  `${sunsetScene()}${house(1240, 930, 0.7)}
   ${f("amal", { x: 520, y: 940, s: 1.55 })}
   ${f("mum", { x: 740, y: 940, s: 1.5 })}
   ${f("mina", { x: 930, y: 942, s: 1.2 })}`,
];

// ================================================================ Book 4
// The Library That Came by Cart — Unit 4: Community and Communication

const cartPages = [
  `${townScene()}${libraryCart(1080, 926, 0.86)}
   ${f("maya", { x: 430, y: 926, s: 1.5, holding: heldPaper })}
   ${f("amal", { x: 660, y: 926, s: 1.5, arms: "up" })}`,

  `${townScene()}${house(300, 900, 0.6)}${libraryCart(1080, 926, 0.9)}
   ${f("amal", { x: 620, y: 926, s: 1.55, mood: "surprised" })}`,

  `${townScene()}${libraryCart(980, 926, 0.95)}
   ${f("yasmin", { x: 500, y: 926, s: 1.5, arms: "point" })}
   ${f("nora", { x: 1360, y: 926, s: 1.5, holding: heldBook })}`,

  `${townScene()}${libraryCart(1140, 926, 0.8)}${bookShelf(430, 860, 1.05, { count: 10 })}
   ${f("amal", { x: 760, y: 926, s: 1.55, holding: heldBook })}`,

  `${townScene()}${marketStall(1260, 900, 0.72)}
   ${f("maya", { x: 600, y: 926, s: 1.55, holding: heldPaper })}
   ${f("omar", { x: 900, y: 926, s: 1.5, arms: "point" })}`,

  `${classroomScene()}
   ${f("maya", { x: 640, y: 950, s: 1.55, holding: heldPaper })}
   ${f("amal", { x: 900, y: 950, s: 1.5 })}
   ${f("yasmin", { x: 1200, y: 950, s: 1.5 })}`,

  `${plainRoomScene({ wall: "#e2dcc9" })}${poster(1240, 700, 1.1, { colour: G3.teal, lines: 6 })}
   ${f("yasmin", { x: 460, y: 950, s: 1.55, arms: "point" })}
   ${f("maya", { x: 760, y: 950, s: 1.5, holding: heldPaper })}`,

  `${plainRoomScene({ wall: "#e2dcc9" })}
   ${f("omar", { x: 380, y: 950, s: 1.5 })}
   ${f("salma", { x: 600, y: 950, s: 1.5 })}
   ${f("dad", { x: 820, y: 950, s: 1.5 })}
   ${f("amal", { x: 1040, y: 950, s: 1.5, arms: "up" })}
   ${f("maya", { x: 1280, y: 950, s: 1.5, holding: heldPaper })}`,

  `${townScene()}${libraryCart(1120, 926, 0.86)}
   ${f("amal", { x: 520, y: 926, s: 1.55, arms: "point" })}
   ${f("mina", { x: 740, y: 928, s: 1.2 })}`,

  `${townScene()}${libraryBuilding(1080, 880, 0.86)}${bunting(700, 190, 1.1, { span: 900 })}
   ${f("maya", { x: 460, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 680, y: 926, s: 1.5, arms: "up" })}`,

  `${townScene()}${libraryBuilding(1120, 880, 0.9)}${libraryCart(400, 926, 0.66)}
   ${f("amal", { x: 700, y: 926, s: 1.55, holding: heldBook })}`,

  `${sunsetScene()}${libraryBuilding(1220, 930, 0.6)}
   ${f("maya", { x: 520, y: 940, s: 1.55, holding: heldPaper })}
   ${f("amal", { x: 760, y: 940, s: 1.5, arms: "up" })}`,
];

// ================================================================ Book 5
// The Spiral Cave — Unit 5: Action and Movement

const cavePages = [
  `${caveScene()}
   ${f("amal", { x: 620, y: 950, s: 1.5, mood: "surprised" })}
   ${f("nora", { x: 880, y: 950, s: 1.45 })}
   ${f("adam", { x: 1120, y: 950, s: 1.45 })}`,

  `${fieldScene()}${bunting(760, 190, 1.15, { span: 1050 })}${dustPuffs(600, 940)}
   ${f("amal", { x: 620, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 860, y: 926, s: 1.5, arms: "up" })}
   ${f("adam", { x: 1080, y: 926, s: 1.5 })}`,

  `${fieldScene()}${dustPuffs(500, 950)}${motionArcs(430, 800, 1.4)}
   ${f("nora", { x: 700, y: 926, s: 1.6, arms: "up" })}`,

  `${fieldScene()}${goat({ x: 1220, y: 872, s: 0.66 })}${tallGrass(340, 940, 1.3)}
   ${f("amal", { x: 700, y: 926, s: 1.5, arms: "point" })}
   ${f("idris", { x: 940, y: 926, s: 1.4, mood: "sad" })}`,

  `${fieldScene()}${goat({ x: 1100, y: 868, s: 0.7 })}${dustPuffs(760, 950)}
   ${f("adam", { x: 520, y: 926, s: 1.5 })}
   ${f("amal", { x: 760, y: 926, s: 1.5, arms: "up" })}
   ${motionArcs(400, 800, 1.3)}`,

  `${mountainScene()}
   ${f("amal", { x: 620, y: 950, s: 1.5, arms: "point" })}
   ${f("nora", { x: 860, y: 950, s: 1.45 })}
   ${lookLine(730, 800, 1180, 620)}`,

  `${caveScene()}
   ${f("amal", { x: 560, y: 950, s: 1.5, mood: "surprised" })}
   ${f("nora", { x: 800, y: 950, s: 1.45, mood: "surprised" })}`,

  `${caveScene()}
   ${f("adam", { x: 620, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 880, y: 950, s: 1.45 })}
   ${f("idris", { x: 1100, y: 950, s: 1.35 })}`,

  `${caveScene()}
   ${f("amal", { x: 700, y: 950, s: 1.55, arms: "up" })}
   ${f("nora", { x: 960, y: 950, s: 1.45 })}
   ${goat({ x: 1300, y: 886, s: 0.6 })}`,

  `${caveScene()}
   ${f("idris", { x: 620, y: 950, s: 1.4, arms: "up" })}
   ${f("amal", { x: 880, y: 950, s: 1.5 })}
   ${goat({ x: 1180, y: 882, s: 0.62 })}`,

  `${fieldScene()}${sunnyPatch(800, 960)}${goat({ x: 1220, y: 882, s: 0.62 })}
   ${f("amal", { x: 560, y: 926, s: 1.55, arms: "up" })}
   ${f("adam", { x: 800, y: 926, s: 1.5, arms: "up" })}
   ${f("idris", { x: 1000, y: 926, s: 1.4, arms: "up" })}`,

  `${sunsetScene()}${acacia(1300, 660, 1.15)}
   ${f("amal", { x: 600, y: 940, s: 1.55 })}
   ${f("nora", { x: 830, y: 940, s: 1.5 })}`,
];

// ================================================================ Book 6
// The Community Parade — Unit 6: People in Society

const paradePages = [
  `${townScene()}${bunting(800, 170, 1.25, { span: 1250 })}${paradeBanner(1220, 900, 0.8)}
   ${f("amal", { x: 430, y: 926, s: 1.5, arms: "up" })}
   ${f("maya", { x: 650, y: 926, s: 1.5, holding: heldPaper })}
   ${f("omar", { x: 880, y: 926, s: 1.5 })}`,

  `${townScene()}${house(280, 900, 0.58)}${flatBlock(1400, 900, 0.5)}
   ${f("yasmin", { x: 640, y: 926, s: 1.55, arms: "point" })}
   ${f("amal", { x: 920, y: 926, s: 1.5 })}`,

  `${townScene()}${marketStall(1240, 900, 0.76)}
   ${f("omar", { x: 1220, y: 926, s: 1.5 })}
   ${f("dad", { x: 620, y: 926, s: 1.5 })}
   ${f("amal", { x: 400, y: 926, s: 1.5, holding: heldPaper })}`,

  `${townScene()}${hospital(1200, 830, 0.68)}
   ${f("mum", { x: 560, y: 926, s: 1.55 })}
   ${f("salma", { x: 800, y: 926, s: 1.5 })}`,

  `${plainRoomScene({ wall: "#dfe4e8" })}${poster(1250, 700, 1.05, { colour: G3.sky, lines: 5 })}
   ${f("maya", { x: 520, y: 950, s: 1.55, holding: heldPaper })}
   ${f("noah", { x: 800, y: 950, s: 1.5 })}`,

  `${townScene()}${house(1220, 900, 0.62)}
   ${f("noah", { x: 520, y: 926, s: 1.5 })}
   ${f("sami", { x: 760, y: 926, s: 1.5 })}
   ${f("amal", { x: 990, y: 926, s: 1.5, arms: "point" })}`,

  `${townScene()}${libraryBuilding(1160, 880, 0.7)}
   ${f("maya", { x: 560, y: 926, s: 1.55, holding: heldPaper })}
   ${f("yasmin", { x: 820, y: 926, s: 1.5 })}`,

  `${yardScene()}${paradeBanner(900, 900, 0.9)}${bunting(700, 180, 1.1, { span: 900 })}
   ${f("amal", { x: 400, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 1320, y: 926, s: 1.5, arms: "up" })}`,

  `${townScene()}${bunting(800, 170, 1.2, { span: 1150 })}${paradeBanner(560, 900, 0.8)}
   ${f("sami", { x: 1000, y: 926, s: 1.5, arms: "up" })}
   ${f("noah", { x: 1220, y: 926, s: 1.5, arms: "up" })}`,

  `${townScene()}${confetti(800, 560)}${bunting(800, 170, 1.25, { span: 1250 })}
   ${f("omar", { x: 380, y: 926, s: 1.5 })}
   ${f("salma", { x: 600, y: 926, s: 1.5 })}
   ${f("maya", { x: 830, y: 926, s: 1.5, holding: heldPaper })}
   ${f("amal", { x: 1060, y: 926, s: 1.5, arms: "up" })}
   ${f("mina", { x: 1280, y: 928, s: 1.2 })}`,

  `${townScene()}${paradeBanner(1180, 900, 0.86, { colour: G3.coral })}
   ${f("maya", { x: 520, y: 926, s: 1.55, holding: heldPaper })}
   ${f("amal", { x: 780, y: 926, s: 1.5 })}`,

  `${sunsetScene()}${house(1240, 930, 0.66)}${bunting(700, 180, 1.05, { span: 850 })}
   ${f("amal", { x: 520, y: 940, s: 1.55, arms: "up" })}
   ${f("maya", { x: 760, y: 940, s: 1.5, arms: "up" })}`,
];

// ================================================================ Book 7
// The Day of the Play — Unit 7: Emotions, Behaviour, and Identity

const playPages = [
  `${stageScene()}${bunting(800, 170, 1.15, { span: 1100 })}
   ${f("sami", { x: 640, y: 960, s: 1.55, arms: "up" })}
   ${f("amal", { x: 900, y: 960, s: 1.5 })}`,

  `${classroomScene()}${poster(1250, 700, 1, { colour: G3.plum, lines: 4 })}
   ${f("yasmin", { x: 660, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 380, y: 950, s: 1.5, holding: heldPaper })}`,

  `${classroomScene()}${desk(1180, 950, 1.3)}
   ${f("sami", { x: 640, y: 950, s: 1.55, mood: "sad" })}`,

  `${classroomScene()}
   ${f("amal", { x: 600, y: 950, s: 1.5, holding: heldPaper })}
   ${f("nora", { x: 840, y: 950, s: 1.5, arms: "up" })}
   ${f("sami", { x: 1080, y: 950, s: 1.5, mood: "sad" })}`,

  `${yardScene()}${bench(1160, 940, 1.4)}
   ${f("amal", { x: 620, y: 926, s: 1.55 })}
   ${f("sami", { x: 860, y: 926, s: 1.5, mood: "sad" })}`,

  `${yardScene()}${acacia(1000, 600, 1.55)}${bench(980, 950, 1.6)}
   ${f("sami", { x: 800, y: 926, s: 1.5 })}
   ${f("amal", { x: 1080, y: 926, s: 1.5, arms: "point" })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("sami", { x: 1020, y: 950, s: 1.5 })}
   ${f("amal", { x: 400, y: 950, s: 1.5 })}`,

  `${stageScene({ open: false })}
   ${f("amal", { x: 620, y: 960, s: 1.5, mood: "surprised" })}
   ${f("nora", { x: 880, y: 960, s: 1.45 })}
   ${f("sami", { x: 1120, y: 960, s: 1.5, mood: "surprised" })}`,

  `${stageScene()}
   ${f("sami", { x: 760, y: 960, s: 1.7 })}`,

  `${stageScene()}
   ${f("sami", { x: 620, y: 960, s: 1.6, arms: "up" })}
   ${f("amal", { x: 900, y: 960, s: 1.5, arms: "up" })}
   ${f("nora", { x: 1140, y: 960, s: 1.45, arms: "up" })}`,

  `${stageScene()}${confetti(800, 560)}
   ${f("yasmin", { x: 400, y: 960, s: 1.5, arms: "up" })}
   ${f("sami", { x: 760, y: 960, s: 1.6, arms: "up" })}
   ${f("amal", { x: 1040, y: 960, s: 1.5, arms: "up" })}`,

  `${sunsetScene()}${acacia(1280, 660, 1.15)}
   ${f("sami", { x: 620, y: 940, s: 1.55 })}
   ${f("amal", { x: 860, y: 940, s: 1.5 })}`,
];

// ================================================================ Book 8
// The Attic Clue — Unit 8: Tools, Machines, and Everyday Items

const atticPages = [
  `${atticScene()}${oldBoxes(400, 950, 1)}${telescope(1120, 940, 1)}
   ${f("amal", { x: 780, y: 950, s: 1.5, arms: "up" })}
   ${f("idris", { x: 1360, y: 950, s: 1.4 })}`,

  `${homeScene()}${roomBox(1250, 640, 1.15, "living")}
   ${f("dad", { x: 520, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 800, y: 950, s: 1.5 })}`,

  `${atticScene()}${oldBoxes(1180, 950, 0.9)}
   ${f("amal", { x: 560, y: 950, s: 1.55, mood: "surprised" })}
   ${f("idris", { x: 820, y: 950, s: 1.4 })}`,

  `${atticScene()}${oldBoxes(420, 950, 1.05)}
   ${f("amal", { x: 860, y: 950, s: 1.55, holding: heldPaper })}`,

  `${atticScene()}${oldBoxes(360, 950, 0.9)}${telescope(1160, 940, 1.05)}
   ${f("idris", { x: 760, y: 950, s: 1.45, arms: "point" })}
   ${f("amal", { x: 1000, y: 950, s: 1.5, mood: "surprised" })}`,

  `${atticScene()}${telescope(1080, 940, 1.15)}
   ${f("amal", { x: 620, y: 950, s: 1.55, arms: "point" })}`,

  `${homeScene()}${roomBox(400, 640, 1.15, "living")}
   ${f("hana", { x: 900, y: 950, s: 1.55, glasses: true, arms: "point" })}
   ${f("amal", { x: 1180, y: 950, s: 1.5, holding: heldPaper })}`,

  `${classroomScene()}${globeProp(1280, 950, 1.2)}
   ${f("yasmin", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 400, y: 950, s: 1.5, holding: heldBook })}`,

  `${atticScene()}${telescope(1000, 940, 1.2)}
   ${f("amal", { x: 560, y: 950, s: 1.55 })}
   ${f("sami", { x: 1340, y: 950, s: 1.45 })}`,

  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151d33"/><stop offset="1" stop-color="#33456b"/></linearGradient></defs>
   <rect width="${W}" height="${H}" fill="url(#sky)"/>
   ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((i) => `<circle class="anim-glow" style="animation-delay:${((i % 5) / 2).toFixed(1)}s" cx="${(i * 181 + 70) % W}" cy="${40 + ((i * 127) % 460)}" r="${3 + (i % 3)}" fill="#f6f0d8" opacity="0.9"/>`).join("")}
   <path d="M 0 700 q 400 -40 800 0 q 400 40 800 0 L 1600 1000 L 0 1000 Z" fill="#2b3a4a"/>
   ${telescope(1080, 930, 1.15)}
   ${f("amal", { x: 620, y: 940, s: 1.55, arms: "up" })}
   ${f("idris", { x: 400, y: 940, s: 1.4 })}`,

  `${atticScene()}${oldBoxes(1200, 950, 0.9)}${telescope(400, 940, 0.9)}
   ${f("amal", { x: 800, y: 950, s: 1.55, holding: heldPaper })}`,

  `${sunsetScene()}${house(1240, 930, 0.7)}
   ${f("amal", { x: 560, y: 940, s: 1.55, holding: heldPaper })}
   ${f("idris", { x: 800, y: 940, s: 1.4 })}
   ${f("hana", { x: 1000, y: 940, s: 1.5, glasses: true })}`,
];

// ================================================================ Book 9
// The Day We Got Lost — Unit 9: Places, People, and Plans

const lostPages = [
  `${capitalScene()}${signpost(1300, 900, 0.86)}
   ${f("amal", { x: 480, y: 920, s: 1.5, holding: heldPaper })}
   ${f("nora", { x: 700, y: 920, s: 1.5 })}
   ${f("yasmin", { x: 940, y: 920, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${mapProp(1180, 700, 1.3)}
   ${f("yasmin", { x: 640, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 380, y: 950, s: 1.5, holding: heldPaper })}`,

  `${townScene()}${undergroundTrain(900, 780, 0.7)}
   ${f("amal", { x: 420, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 640, y: 926, s: 1.5 })}`,

  `${capitalScene()}
   ${f("amal", { x: 620, y: 920, s: 1.55, mood: "surprised", arms: "up" })}
   ${f("nora", { x: 880, y: 920, s: 1.5 })}`,

  `${capitalScene()}${museum(1200, 900, 0.72)}
   ${f("yasmin", { x: 520, y: 920, s: 1.55, arms: "point" })}
   ${f("amal", { x: 800, y: 920, s: 1.5, holding: heldBook })}`,

  `${capitalScene()}${shoppingCentre(1180, 860, 0.66)}${signpost(400, 900, 0.8)}
   ${f("nora", { x: 760, y: 920, s: 1.55, arms: "point" })}`,

  `${capitalScene()}${signpost(1080, 900, 0.9, { arms: 4 })}
   ${f("amal", { x: 560, y: 920, s: 1.55, mood: "surprised" })}
   ${f("nora", { x: 800, y: 920, s: 1.5, mood: "sad" })}`,

  `${capitalScene()}
   ${f("amal", { x: 620, y: 920, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 880, y: 920, s: 1.5 })}
   ${lookLine(720, 800, 1080, 700)}`,

  `${capitalScene()}${museum(400, 900, 0.6)}${signpost(1240, 900, 0.86)}
   ${f("amal", { x: 800, y: 920, s: 1.55, arms: "point" })}
   ${f("nora", { x: 1030, y: 920, s: 1.5 })}`,

  `${capitalScene()}${museum(1160, 900, 0.78)}
   ${f("yasmin", { x: 520, y: 920, s: 1.55, arms: "up" })}
   ${f("amal", { x: 780, y: 920, s: 1.5, arms: "up" })}
   ${f("nora", { x: 990, y: 920, s: 1.5, arms: "up" })}`,

  `${coastScene()}${ferryBoat(1180, 640, 0.6)}${shells(500, 940, 0.8, { count: 6 })}
   ${f("amal", { x: 800, y: 930, s: 1.55, holding: heldShell })}`,

  `${sunsetScene()}${cityBuildings(1180, 900, 0.6)}
   ${f("amal", { x: 520, y: 940, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 760, y: 940, s: 1.5 })}
   ${f("yasmin", { x: 980, y: 940, s: 1.5 })}`,
];

// Nine numbered rooms — the capstone poem's own image, and the Grade 4 twin of
// Grade 3's nine doors. Drawn as cutaway rooms rather than doors so the two
// capstones do not read as the same picture.
const ROOM_COLOURS = ["#e8705c", "#2f8f86", "#f0b429", "#8f6bb5", "#6f9a4a"];
function nineRooms(x, y, s = 1) {
  const room = (i) => {
    const rx = -600 + (i % 5) * 300;
    const ry = i < 5 ? -110 : 130;
    return `<g transform="translate(${rx} ${ry})">
      <rect x="-116" y="-92" width="232" height="184" rx="10" fill="${G3.cream}" stroke="${C.ink}" stroke-width="6"/>
      <rect x="-116" y="-92" width="232" height="46" rx="10" fill="${ROOM_COLOURS[i % ROOM_COLOURS.length]}"/>
      <rect x="-116" y="52" width="232" height="40" fill="#c9a06c"/>
      <rect x="-84" y="-24" width="64" height="60" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.4"/>
      <rect x="20" y="-6" width="70" height="42" rx="5" fill="${ROOM_COLOURS[(i + 2) % ROOM_COLOURS.length]}" stroke="${C.ink}" stroke-width="3.4"/>
      <text x="0" y="-58" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${G3.cream}">${i + 1}</text>
    </g>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(room).join("")}</g>`;
}

// ================================================================ Book 10
// Nine Rooms — Unit 10 capstone

const nineRoomsPages = [
  `${plainRoomScene()}${bunting(800, 160, 1.25, { span: 1250 })}
   ${easel(1250, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.teal }) })}
   ${easel(300, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.coral }) })}
   ${f("amal", { x: 700, y: 950, s: 1.55, holding: heldPaper })}
   ${f("maya", { x: 930, y: 950, s: 1.5, arms: "up" })}`,

  `${classroomScene()}${poster(1240, 700, 1.1, { colour: G3.plum, lines: 5 })}
   ${f("yasmin", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 400, y: 950, s: 1.5, holding: heldPaper })}`,

  `${plainRoomScene()}
   ${nineRooms(800, 400, 0.86)}
   ${f("yasmin", { x: 1400, y: 950, s: 1.5, arms: "point" })}`,

  `${postCounterScene()}${counter(1080, 950, 0.86)}
   ${f("amal", { x: 480, y: 950, s: 1.55, holding: heldPaper })}
   ${f("omar", { x: 1300, y: 930, s: 1.45 })}`,

  `${fieldScene()}${scienceTent(1120, 770, 0.66)}
   ${f("amal", { x: 620, y: 926, s: 1.55, holding: heldPaper })}`,

  `${basicScene()}${farmField(1000, 900, 0.86)}${mango(420, 880, 1.4)}
   ${f("amal", { x: 600, y: 926, s: 1.55, holding: heldPaper })}`,

  `${townScene()}${libraryCart(1160, 926, 0.7)}
   ${f("maya", { x: 500, y: 926, s: 1.5, holding: heldPaper })}
   ${f("amal", { x: 760, y: 926, s: 1.55 })}`,

  `${townScene()}${paradeBanner(1180, 900, 0.72)}${bunting(700, 180, 1.05, { span: 880 })}
   ${f("amal", { x: 560, y: 926, s: 1.55, arms: "up" })}`,

  `${stageScene()}
   ${f("sami", { x: 640, y: 960, s: 1.55, arms: "up" })}
   ${f("amal", { x: 940, y: 960, s: 1.5, holding: heldPaper })}`,

  `${atticScene()}${telescope(1120, 940, 0.95)}${oldBoxes(400, 950, 0.8)}
   ${f("amal", { x: 780, y: 950, s: 1.55, holding: heldPaper })}`,

  `${capitalScene()}${museum(1200, 900, 0.62)}${signpost(400, 900, 0.72)}
   ${f("amal", { x: 800, y: 920, s: 1.55, holding: heldPaper })}`,

  `${plainRoomScene()}${bunting(800, 160, 1.25, { span: 1280 })}${confetti(800, 540)}
   ${f("yasmin", { x: 280, y: 950, s: 1.5, arms: "up" })}
   ${f("maya", { x: 1050, y: 950, s: 1.5, arms: "up" })}
   ${f("nora", { x: 1300, y: 950, s: 1.5, arms: "up" })}
   ${f("amal", { x: 700, y: 950, s: 1.65, holding: heldPaper })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "post": { dir: "the-post-counter", pages: postPages },
  "storm": { dir: "the-storm-and-the-science-tent", pages: stormPages },
  "farm": { dir: "from-farm-to-plate", pages: farmPages },
  "cart": { dir: "the-library-that-came-by-cart", pages: cartPages },
  "cave": { dir: "the-spiral-cave", pages: cavePages },
  "parade": { dir: "the-community-parade", pages: paradePages },
  "play": { dir: "the-day-of-the-play", pages: playPages },
  "attic": { dir: "the-attic-clue", pages: atticPages },
  "lost": { dir: "the-day-we-got-lost", pages: lostPages },
  "nine-rooms": { dir: "nine-rooms", pages: nineRoomsPages },
};

writeBooks(books, process.argv[2]);
