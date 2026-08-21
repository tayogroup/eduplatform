#!/usr/bin/env node

// Generates the vector illustrations for the REST of the Grade 4 shelf — the
// four extra books on every unit, so each of the ten units carries five.
//
// Grade 4 already had one book per unit, and each of those was built on the
// unit's closing narrative: the post counter, the science tent, the farm trail,
// the library cart, the spiral cave, the parade, the play, the attic, the trip,
// the poem. Every unit's OTHER readings — the information texts, the poems, the
// interviews, the listening scripts — were left undrawn. Those are the forty
// books here, one per remaining reading:
//
//   Unit 1  Amal's Steady Day / May I Interview You? / The Writing Contest /
//           Two Languages at the Counter
//   Unit 2  Weather Around the World / The Foggy Morning / The Weather Report /
//           The Science Fair Poster
//   Unit 3  The Bitter Lunch / The Poster on the Wall / At the Clinic /
//           The Market Song
//   Unit 4  Maya the Young Reporter / The Town Meeting / The Circular Plan /
//           Sami's First Story
//   Unit 5  The Race at the Village Field / How Animals Move / The Lost Goat /
//           The Posters for Simba
//   Unit 6  The People of Our Town / Two Neighbours / Elena's Bridge /
//           The Caretaker's Keys
//   Unit 7  The Day Before the Test / Where My Family Comes From /
//           Getting Ready for the Play / The Cultural Fair
//   Unit 8  The Right Tool for the Job / A Look at the Stars /
//           The Careful Cook / The Helper Vehicles
//   Unit 9  A Trip to the Capital / Living Near the Equator / Making a Plan /
//           Directions at the Mall
//   Unit 10 Amal's English Voice / Four Parts and a Friday /
//           Planning the Exhibition / Exhibition Evening
//
// Four of the forty have no reading left to take (Units 1, 4, 5 and 6 carry four
// readings each, not five), so those four are the next scene of a reading that
// is already there: Omar's second language, Sami's promised story, the posters
// the children make for Simba, and the caretaker the parade story ends on. Every
// one is a thread the unit itself leaves hanging, not a new invention.
//
// Usage: node tools/create-grade4-shelf-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, sun, basicScene, acacia, tallGrass, bench, mango, marketStall,
  lampPost, cityBuildings, lake, river, wildBird, goat, hen, chick, dustPuffs, confetti,
  sunnyPatch, rainbow, cloudPuff, nightScene, fence, seedRow, haystack, barn, cookpot,
  raceBanner, playBall, thoughtBubble, fallenBranch, puddle,
  G2, roomScene, roomBox, sunsetScene, bookShelf, openBook, house, hut, flatBlock,
  libraryBuilding, shoppingCentre, townBus, crossing, mapProp, metreStick, notepad,
  bunting, easel, lookLine, motionArcs, helicopterProp, fireEngine, clinicFront, canyonScene,
  doctorKit, fruitBowl, waterBottle, gardenPlant, spiderWeb, trafficRow, tabletProp, ferryBoat,
  G3, heldBook, heldPaper, classroomScene, plainRoomScene, townScene, coastScene,
  forestScene, mountainScene, gardenWall, desk, globeProp, hospital, poster,
  postCounterScene, counter, letterProp, scienceTent, stormScene, farmField,
  libraryCart, caveScene, stageScene, telescope, atticScene, oldBoxes,
  capitalScene, signpost, museum, paradeBanner,
  figureShelf, dog, horse, snail, cat,
  bakeryFront, foodTray, broomProp, keyRing, corridorScene,
  foggyScene, snowyScene, hailFall, radioDesk, weatherChart,
  circularNews, chairRows, hallScene, bridgeSite, helmetProp,
  microwaveProp, toolRack, observatory, ringedPlanet, craterMoon, ambulance, starrySky, counterTop,
  lorry, factory, passengerTrain, stationScene, mallScene, liftProp, fountainProp,
  heldNewspaper, heldNotebook, heldKey,
} = require("./lib/ehel-ebook-kit-grade4-shelf.js");

const f = figureShelf;

// The same scene shorthands the first Grade 4 generator uses, so a page that
// appears in both shelves is the same place.
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const kitchenScene = () => roomScene({ wall: "#e6e0cc", floor: "#b9865e" });
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;
const fieldScene = () => `${basicScene()}${acacia(180, 640, 1.1)}${tallGrass(1480, 940, 1.2)}`;
const lakeScene = () => `${basicScene()}${lake(800, 700, 660, 96)}`;
const clinicScene = () => `${townScene()}${clinicFront(1240, 900, 0.86)}`;
const marketScene = () => `${townScene()}${marketStall(1220, 900, 0.9)}${marketStall(300, 900, 0.72)}`;

// ================================================================ Unit 1
// Daily Life & Communication

// Book 2 — Amal's Steady Day (from "My Daily Routine")
const steadyDayPages = [
  `${townScene()}${lampPost(240, 706, 0.9)}${cityBuildings(1300, 700, 0.7)}
   ${f("amal", { x: 620, y: 926, s: 1.55, holding: heldBook })}
   ${f("maya", { x: 860, y: 926, s: 1.5 })}`,

  `${homeScene()}${roomBox(1250, 640, 1.15, "bedroom")}
   ${f("amal", { x: 640, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${broomProp(1240, 950, 1.05)}
   ${f("amal", { x: 620, y: 950, s: 1.55, arms: "point" })}
   ${f("mum", { x: 900, y: 950, s: 1.5 })}`,

  `${kitchenScene()}${roomBox(1260, 640, 1.1, "kitchen")}${cookpot(420, 930, 1.25)}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}
   ${f("mum", { x: 940, y: 950, s: 1.5, arms: "point" })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldBook })}${bookShelf(300, 950, 0.8)}
   ${f("amal", { x: 700, y: 950, s: 1.6, holding: heldBook })}`,

  `${townScene()}${crossing(1180, 906, 0.9)}${lampPost(280, 706, 0.86)}
   ${f("amal", { x: 620, y: 926, s: 1.55, holding: heldBook })}
   ${f("maya", { x: 860, y: 926, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${bookShelf(1420, 950, 0.9)}
   ${f("yasmin", { x: 1080, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 760, y: 950, s: 1.55, holding: heldBook })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: openBook(0, 0, 0.45) })}
   ${f("amal", { x: 720, y: 950, s: 1.6, holding: heldBook })}`,

  `${yardScene()}${playBall(1180, 930, 1.2)}${bench(280, 940, 1.15)}
   ${f("amal", { x: 640, y: 926, s: 1.55, arms: "up" })}
   ${f("sami", { x: 880, y: 926, s: 1.5 })}
   ${f("theo", { x: 1060, y: 926, s: 1.5, arms: "up" })}`,

  `${homeScene()}${broomProp(300, 950, 0.95, { lean: 8 })}${desk(1220, 950, 1.1, { item: heldPaper })}${bookShelf(1500, 950, 0.72)}
   ${f("amal", { x: 740, y: 950, s: 1.6, holding: heldPaper })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "living")}${desk(360, 950, 1, { item: heldPaper })}
   ${f("amal", { x: 780, y: 950, s: 1.6, holding: heldPaper })}`,

  `${nightScene()}${house(1230, 940, 0.78, { lit: true })}${lampPost(320, 940, 0.95, { lit: true })}
   ${f("amal", { x: 760, y: 940, s: 1.55, mood: "happy" })}`,
];

// Book 3 — May I Interview You? (from "An Interview (script)")
const interviewPages = [
  `${postCounterScene()}${counter(900, 950, 1)}
   ${f("amal", { x: 480, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}`,

  `${marketScene()}
   ${f("amal", { x: 640, y: 926, s: 1.55, holding: heldNotebook })}
   ${f("omar", { x: 1080, y: 926, s: 1.45 })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 4 })}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "point" })}
   ${f("amal", { x: 460, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(900, 950, 1)}${letterProp(660, 690, 1.05)}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}
   ${f("amal", { x: 460, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(880, 950, 1)}${letterProp(640, 686, 1.1, { open: true })}
   ${f("omar", { x: 1200, y: 930, s: 1.5, arms: "point" })}
   ${f("salma", { x: 420, y: 950, s: 1.48 })}`,

  `${postCounterScene()}${counter(900, 950, 1, { parcels: 2 })}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}
   ${f("amal", { x: 470, y: 950, s: 1.55, holding: heldNotebook })}
   ${letterProp(700, 700, 1)}`,

  `${marketScene()}${bench(300, 940, 1.1)}
   ${f("omar", { x: 1120, y: 926, s: 1.45, arms: "point" })}
   ${f("karim", { x: 860, y: 926, s: 1.45 })}
   ${f("amal", { x: 560, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 5 })}${motionArcs(560, 690, 1.15)}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}
   ${f("amal", { x: 450, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(900, 950, 1)}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "point" })}
   ${f("theo", { x: 700, y: 950, s: 1.48 })}
   ${f("amal", { x: 440, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(880, 950, 1)}${letterProp(660, 692, 1.05, { open: true })}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "up" })}
   ${f("amal", { x: 460, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(900, 950, 1, { parcels: 3 })}
   ${f("amal", { x: 520, y: 950, s: 1.6, holding: heldNotebook, arms: "point" })}
   ${f("omar", { x: 1240, y: 930, s: 1.5 })}`,

  `${homeScene()}${desk(1250, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.8)}
   ${f("amal", { x: 720, y: 950, s: 1.6, holding: heldPaper })}`,
];

// Book 4 — The Writing Contest (from "Fair Effort, Daily Gains")
const contestPages = [
  `${plainRoomScene()}${bookShelf(1420, 950, 0.95)}${bookShelf(200, 950, 0.86)}${bunting(800, 170, 1.2, { span: 1180 })}${confetti(800, 520)}
   ${f("amal", { x: 700, y: 950, s: 1.6, holding: heldPaper })}
   ${f("yasmin", { x: 1030, y: 950, s: 1.5, arms: "up" })}`,

  `${classroomScene()}${poster(1240, 660, 1.15, { colour: G3.coral, lines: 4 })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 620, y: 950, s: 1.55 })}
   ${f("nora", { x: 400, y: 950, s: 1.5 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldBook })}
   ${f("amal", { x: 700, y: 950, s: 1.6, holding: heldBook, mood: "happy" })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${broomProp(320, 950, 0.9, { lean: 10 })}${bookShelf(1500, 950, 0.7)}${roomBox(620, 620, 0.82, "living")}
   ${f("amal", { x: 880, y: 950, s: 1.6, holding: heldPaper })}`,

  `${kitchenScene()}${roomBox(1270, 640, 1.05, "kitchen")}
   ${f("mum", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}`,

  `${marketScene()}${mango(420, 890, 1.35)}
   ${f("omar", { x: 1120, y: 926, s: 1.48, arms: "point" })}
   ${f("amal", { x: 620, y: 926, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(900, 950, 1, { parcels: 4 })}
   ${f("amal", { x: 490, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("omar", { x: 1220, y: 930, s: 1.5 })}`,

  `${homeScene()}${desk(1230, 950, 1.15, { item: heldPaper })}${bookShelf(280, 950, 0.82)}${poster(700, 560, 0.9, { colour: G3.gold, lines: 3 })}
   ${f("amal", { x: 800, y: 950, s: 1.62, holding: heldPaper })}`,

  `${homeScene()}${roomBox(1290, 640, 1.02, "living")}
   ${f("dad", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55, holding: heldPaper })}`,

  `${townScene()}${cityBuildings(1280, 700, 0.72)}${lampPost(260, 706, 0.9)}
   ${f("sami", { x: 880, y: 926, s: 1.5, arms: "up", mood: "surprised" })}
   ${f("yasmin", { x: 560, y: 926, s: 1.5, arms: "point" })}`,

  `${plainRoomScene()}${bookShelf(1420, 950, 0.92)}${bookShelf(220, 950, 0.86)}
   ${f("nora", { x: 640, y: 950, s: 1.5, mood: "sad", holding: heldPaper })}
   ${f("amal", { x: 900, y: 950, s: 1.55, holding: heldPaper })}
   ${f("yasmin", { x: 1150, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${confetti(800, 520)}${bunting(800, 160, 1.2, { span: 1180 })}
   ${f("yasmin", { x: 1080, y: 950, s: 1.5, arms: "up" })}
   ${f("amal", { x: 700, y: 950, s: 1.62, holding: heldBook, arms: "up" })}`,
];

// Book 5 — Two Languages at the Counter (Omar's second language, Unit 1)
const twoLanguagesPages = [
  `${postCounterScene()}${counter(880, 950, 1, { parcels: 4 })}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "point" })}
   ${f("theo", { x: 640, y: 950, s: 1.5 })}
   ${f("amal", { x: 400, y: 950, s: 1.52, holding: heldNotebook })}`,

  `${marketScene()}${lampPost(760, 706, 0.8)}
   ${f("omar", { x: 1140, y: 926, s: 1.48 })}
   ${f("salma", { x: 820, y: 926, s: 1.45 })}
   ${f("theo", { x: 560, y: 926, s: 1.48 })}`,

  `${postCounterScene()}${counter(900, 950, 1)}${letterProp(680, 700, 1.05)}
   ${f("theo", { x: 600, y: 950, s: 1.52, mood: "sad" })}
   ${f("omar", { x: 1230, y: 930, s: 1.5 })}`,

  `${postCounterScene()}${counter(880, 950, 1)}
   ${f("omar", { x: 1220, y: 930, s: 1.5, arms: "point" })}
   ${f("theo", { x: 600, y: 950, s: 1.52, mood: "surprised" })}`,

  `${postCounterScene()}${counter(900, 950, 1, { parcels: 2 })}${letterProp(660, 694, 1.1, { open: true })}
   ${f("theo", { x: 580, y: 950, s: 1.52 })}
   ${f("omar", { x: 1230, y: 930, s: 1.5 })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 5 })}
   ${f("theo", { x: 700, y: 950, s: 1.5 })}
   ${f("amal", { x: 420, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("omar", { x: 1230, y: 930, s: 1.48 })}`,

  `${marketScene()}${fruitBowl(760, 900, 1.1)}
   ${f("amal", { x: 600, y: 926, s: 1.55, holding: heldNotebook })}
   ${f("omar", { x: 1120, y: 926, s: 1.48, arms: "point" })}`,

  `${postCounterScene()}${counter(900, 950, 1)}
   ${f("omar", { x: 1230, y: 930, s: 1.5, arms: "point" })}
   ${f("amal", { x: 480, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${postCounterScene()}${counter(880, 950, 1, { parcels: 3 })}${thoughtBubble(560, 500, 1.05, letterProp(0, 0, 0.7))}
   ${f("omar", { x: 1230, y: 930, s: 1.5 })}
   ${f("amal", { x: 470, y: 950, s: 1.55 })}`,

  `${marketScene()}${marketStall(760, 900, 0.66)}
   ${f("salma", { x: 560, y: 926, s: 1.45 })}
   ${f("hana", { x: 900, y: 926, s: 1.45 })}
   ${f("omar", { x: 1180, y: 926, s: 1.48, arms: "up" })}`,

  `${postCounterScene()}${counter(900, 950, 1, { parcels: 2 })}${letterProp(1360, 700, 1.1, { open: true })}
   ${f("amal", { x: 560, y: 950, s: 1.6, holding: heldNotebook })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 780, y: 950, s: 1.6, holding: heldPaper })}`,
];

// ================================================================ Unit 2
// Nature & Weather

// Book 2 — Weather Around the World (from the Unit 2 information text)
const weatherWorldPages = [
  `${lakeScene()}${globeProp(1240, 930, 1.4)}${cloudPuff(420, 230, 1.4, { grey: true })}
   ${f("amal", { x: 640, y: 926, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 890, y: 926, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${globeProp(1300, 950, 1.25)}
   ${f("amal", { x: 700, y: 950, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 940, y: 950, s: 1.5 })}`,

  `${foggyScene()}
   ${f("amal", { x: 700, y: 930, s: 1.5 })}
   ${f("nora", { x: 940, y: 930, s: 1.45 })}`,

  `${canyonScene()}
   ${f("amal", { x: 700, y: 930, s: 1.5, arms: "point" })}`,

  `${coastScene()}${wildBird(1240, 260, 1.2, true)}${wildBird(1360, 320, 0.95, true)}
   ${f("nora", { x: 760, y: 930, s: 1.5 })}
   ${f("amal", { x: 520, y: 930, s: 1.55, arms: "point" })}`,

  `${snowyScene()}
   ${f("amal", { x: 700, y: 930, s: 1.5, arms: "up" })}
   ${f("nora", { x: 950, y: 930, s: 1.45 })}`,

  `${coastScene()}${cloudPuff(400, 220, 1.5, { grey: true })}${cloudPuff(1180, 190, 1.3, { grey: true })}
   ${f("amal", { x: 700, y: 930, s: 1.55 })}`,

  `${basicScene(true)}${farmField(900, 900, 0.86)}${seedRow(340, 930, 1.1)}
   ${f("amal", { x: 640, y: 926, s: 1.5, arms: "point" })}`,

  `${stormScene({ lightning: false })}
   ${f("amal", { x: 620, y: 950, s: 1.5, mood: "surprised" })}
   ${f("nora", { x: 900, y: 950, s: 1.45 })}`,

  `${stormScene({ lightning: false })}${hailFall({ stones: 40 })}
   ${f("amal", { x: 700, y: 950, s: 1.5, mood: "surprised" })}`,

  `${stormScene()}${dustPuffs(1200, 880)}
   ${f("nora", { x: 560, y: 950, s: 1.5, mood: "surprised", arms: "point" })}`,

  `${lakeScene()}${rainbow(820, 640)}${weatherChart(1260, 640, 0.86)}
   ${f("amal", { x: 620, y: 926, s: 1.55, arms: "up" })}
   ${f("nora", { x: 860, y: 926, s: 1.5, arms: "up" })}`,
];

// Book 3 — The Foggy Morning (from the Unit 2 poem)
const foggyMorningPages = [
  `${foggyScene()}
   ${f("amal", { x: 680, y: 930, s: 1.55 })}
   ${f("dad", { x: 930, y: 930, s: 1.5 })}`,

  `${homeScene()}${roomBox(1260, 640, 1.1, "bedroom")}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}`,

  `${foggyScene()}
   ${f("amal", { x: 720, y: 930, s: 1.55, mood: "surprised" })}`,

  `${foggyScene()}
   ${f("dad", { x: 960, y: 930, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 930, s: 1.52 })}`,

  `${foggyScene()}${tallGrass(1320, 940, 1.15)}${tallGrass(240, 950, 1)}
   ${f("amal", { x: 660, y: 930, s: 1.52 })}
   ${f("dad", { x: 900, y: 930, s: 1.48 })}`,

  `${foggyScene()}${wildBird(1180, 240, 1.1, true)}
   ${f("amal", { x: 700, y: 930, s: 1.52, arms: "point" })}
   ${lookLine(760, 760, 1140, 280)}`,

  `${foggyScene()}${fence(1180, 930, 1.1, 3)}
   ${f("amal", { x: 620, y: 930, s: 1.52 })}
   ${f("dad", { x: 860, y: 930, s: 1.48 })}`,

  `${foggyScene()}${acacia(1220, 880, 1.5)}
   ${f("amal", { x: 640, y: 930, s: 1.52, arms: "up" })}
   ${f("dad", { x: 880, y: 930, s: 1.48 })}`,

  `${foggyScene()}
   ${f("amal", { x: 640, y: 930, s: 1.52, arms: "point" })}
   ${f("dad", { x: 900, y: 930, s: 1.48, arms: "point" })}`,

  `${basicScene()}${hut(1240, 900, 0.8)}${tallGrass(280, 940, 1.1)}${sunnyPatch(820, 780)}
   ${f("amal", { x: 660, y: 926, s: 1.55, arms: "up" })}
   ${f("dad", { x: 920, y: 926, s: 1.48 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldPaper })}
   ${f("yasmin", { x: 1030, y: 950, s: 1.5 })}`,

  `${foggyScene()}${poster(1240, 620, 1.15, { colour: G3.sky, lines: 4 })}
   ${f("amal", { x: 660, y: 930, s: 1.55, holding: heldPaper })}`,
];

// Book 4 — The Weather Report (from the Unit 2 listening text)
const weatherReportPages = [
  `${plainRoomScene({ wall: "#dbe4ea" })}${radioDesk(880, 950, 1)}${weatherChart(1360, 560, 0.72)}
   ${f("amal", { x: 420, y: 950, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 640, y: 950, s: 1.5 })}`,

  `${lakeScene()}${hut(1240, 900, 0.72)}${lampPost(300, 706, 0.86)}
   ${f("yasmin", { x: 780, y: 926, s: 1.5, arms: "point" })}`,

  `${plainRoomScene({ wall: "#dbe4ea" })}${radioDesk(900, 950, 1)}
   ${f("yasmin", { x: 1300, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 430, y: 950, s: 1.55, holding: heldPaper })}
   ${f("leo", { x: 640, y: 950, s: 1.5 })}`,

  `${foggyScene()}${lampPost(1280, 900, 0.95)}
   ${f("salma", { x: 700, y: 930, s: 1.45 })}`,

  `${lakeScene()}${sunnyPatch(760, 700)}${wildBird(1300, 250, 1.1, true)}
   ${f("nora", { x: 640, y: 926, s: 1.5, arms: "up" })}`,

  `${coastScene()}${sailboatSafe()}
   ${f("amal", { x: 660, y: 930, s: 1.5 })}`,

  `${stormScene()}${house(1220, 930, 0.72)}
   ${f("mum", { x: 620, y: 950, s: 1.5, arms: "point" })}`,

  `${stormScene()}${acacia(1300, 900, 1.3)}
   ${f("amal", { x: 640, y: 950, s: 1.5, mood: "surprised" })}`,

  `${plainRoomScene({ wall: "#dbe4ea" })}${radioDesk(900, 950, 1)}
   ${f("amal", { x: 470, y: 950, s: 1.58, holding: heldPaper, arms: "point" })}`,

  `${basicScene()}${cloudPuff(520, 230, 1.2)}${sunnyPatch(1080, 700)}
   ${f("leo", { x: 700, y: 926, s: 1.5, arms: "up" })}`,

  `${fieldScene()}${farmField(1060, 900, 0.8)}${seedRow(360, 930, 1.05)}
   ${f("karim", { x: 700, y: 926, s: 1.45, arms: "up" })}`,

  `${homeScene()}${roomBox(1270, 640, 1.05, "bedroom")}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,
];

// Book 5 — The Science Fair Poster (from "Two Friends at the Science Fair")
const fairPosterPages = [
  `${fieldScene()}${scienceTent(1080, 770, 0.7)}${easel(700, 950, 1.3, { inner: poster(0, 0, 0.5, { colour: G3.teal }) })}
   ${f("amal", { x: 420, y: 926, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 1300, y: 926, s: 1.5 })}`,

  `${classroomScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.coral }) })}
   ${f("amal", { x: 640, y: 950, s: 1.55, holding: heldPaper })}
   ${f("nora", { x: 900, y: 950, s: 1.5 })}`,

  `${classroomScene()}${easel(1240, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.sky, lines: 5 }) })}
   ${f("amal", { x: 620, y: 950, s: 1.58, arms: "point" })}`,

  `${classroomScene()}${easel(1240, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.plum, lines: 5 }) })}
   ${f("nora", { x: 660, y: 950, s: 1.55, arms: "point" })}`,

  `${plainRoomScene()}${easel(1260, 950, 1.28, { inner: poster(0, 0, 0.5, { colour: "#b06a4a" }) })}
   ${f("amal", { x: 640, y: 950, s: 1.55, arms: "point" })}
   ${f("nora", { x: 900, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${weatherChart(1250, 620, 0.95)}
   ${f("nora", { x: 660, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 900, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${hailFall({ stones: 26 })}
   ${f("amal", { x: 660, y: 950, s: 1.55, mood: "surprised" })}
   ${f("nora", { x: 920, y: 950, s: 1.5, mood: "surprised" })}`,

  `${yardScene()}${gardenPlant(1200, 930, 1.2)}${gardenPlant(340, 940, 1)}
   ${f("nora", { x: 640, y: 926, s: 1.5, arms: "point" })}
   ${f("idris", { x: 880, y: 926, s: 1.4 })}`,

  `${plainRoomScene()}${easel(1240, 950, 1.28, { inner: poster(0, 0, 0.5, { colour: G3.gold }) })}
   ${f("amal", { x: 640, y: 950, s: 1.58, arms: "point" })}
   ${f("nora", { x: 900, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${desk(320, 950, 1, { item: heldPaper })}
   ${f("nora", { x: 700, y: 950, s: 1.55, holding: heldPaper })}
   ${f("amal", { x: 960, y: 950, s: 1.55 })}`,

  `${plainRoomScene()}
   ${f("amal", { x: 660, y: 950, s: 1.58, arms: "up" })}
   ${f("nora", { x: 940, y: 950, s: 1.55, arms: "up" })}`,

  `${fieldScene()}${scienceTent(1060, 770, 0.72)}${bunting(700, 190, 1.1, { span: 960 })}
   ${f("yasmin", { x: 1340, y: 926, s: 1.48 })}
   ${f("amal", { x: 560, y: 926, s: 1.55, arms: "point" })}
   ${f("nora", { x: 800, y: 926, s: 1.5 })}`,
];

// ================================================================ Unit 3
// Food and Health

// Book 2 — The Bitter Lunch (from the Unit 3 story)
const bitterLunchPages = [
  `${bakeryScene()}
   ${f("amal", { x: 560, y: 926, s: 1.55, mood: "sad" })}
   ${f("omar", { x: 1120, y: 926, s: 1.45, arms: "point" })}`,

  `${basicScene()}${river(300, 780, 1.4)}${farmField(1020, 900, 0.86)}
   ${f("amal", { x: 620, y: 926, s: 1.55 })}
   ${f("hana", { x: 900, y: 926, s: 1.45 })}`,

  `${fieldScene()}${barn(1240, 880, 0.9)}${goat({ x: 1000, y: 860, s: 0.72 })}${hen({ x: 380, y: 890, s: 0.66 })}
   ${f("amal", { x: 680, y: 926, s: 1.55 })}`,

  `${kitchenScene()}${cookpot(1240, 940, 1.35)}
   ${f("hana", { x: 940, y: 950, s: 1.48, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}`,

  `${classroomScene()}${poster(1250, 660, 1.1, { colour: G3.leafy, lines: 5 })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 640, y: 950, s: 1.55 })}`,

  `${bakeryScene()}
   ${f("amal", { x: 640, y: 926, s: 1.55, holding: heldPaper })}`,

  `${bakeryScene()}${foodTray(760, 900, 0.9, { bowls: 2 })}
   ${f("omar", { x: 1100, y: 926, s: 1.45, arms: "point" })}
   ${f("amal", { x: 560, y: 926, s: 1.55 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "dining")}${foodTray(400, 940, 0.8, { bowls: 2 })}
   ${f("noah", { x: 940, y: 950, s: 1.5, mood: "sad", arms: "point" })}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,

  `${homeScene()}${roomBox(1270, 640, 1.05, "bedroom")}
   ${f("amal", { x: 640, y: 950, s: 1.55, mood: "sad" })}
   ${f("noah", { x: 920, y: 950, s: 1.5, mood: "surprised" })}`,

  `${clinicScene()}${doctorKit(360, 930, 1.15)}
   ${f("sarah", { x: 1000, y: 926, s: 1.48, arms: "point" })}
   ${f("amal", { x: 680, y: 926, s: 1.55, mood: "sad" })}`,

  `${homeScene()}${desk(1250, 950, 1.1, { item: heldPaper })}${waterBottle(360, 930, 1.2)}
   ${f("amal", { x: 740, y: 950, s: 1.58, holding: heldPaper })}`,

  `${plainRoomScene()}${foodTray(1240, 950, 1.15, { bowls: 4 })}${bunting(760, 170, 1.1, { span: 980 })}
   ${f("amal", { x: 620, y: 950, s: 1.58, holding: heldPaper })}
   ${f("hana", { x: 900, y: 950, s: 1.48 })}`,
];

// Book 3 — The Poster on the Wall (from the Unit 3 persuasive text)
const wallPosterPages = [
  `${classroomScene()}${poster(1230, 640, 1.35, { colour: G3.leafy, lines: 6 })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 640, y: 950, s: 1.55, holding: heldBook })}`,

  `${classroomScene()}${poster(1240, 650, 1.25, { colour: G3.leafy, lines: 6 })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("nora", { x: 640, y: 950, s: 1.5 })}
   ${f("leo", { x: 420, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${foodTray(1220, 950, 1.2, { bowls: 4 })}
   ${f("amal", { x: 660, y: 950, s: 1.58, arms: "point" })}`,

  `${plainRoomScene()}${fruitBowl(1240, 950, 1.5)}${waterBottle(380, 940, 1.25)}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}`,

  `${kitchenScene()}${waterBottle(1240, 940, 1.5)}
   ${f("amal", { x: 680, y: 950, s: 1.58, arms: "up" })}`,

  `${homeScene()}${roomBox(1270, 640, 1.08, "dining")}${foodTray(420, 940, 0.86, { bowls: 3 })}
   ${f("hana", { x: 700, y: 950, s: 1.48 })}
   ${f("amal", { x: 940, y: 950, s: 1.55 })}`,

  `${marketScene()}${fruitBowl(760, 900, 1.15)}
   ${f("omar", { x: 1120, y: 926, s: 1.45, arms: "point" })}
   ${f("amal", { x: 580, y: 926, s: 1.55 })}`,

  `${bakeryScene()}
   ${f("amal", { x: 620, y: 926, s: 1.55, mood: "sad" })}`,

  `${classroomScene()}${poster(1240, 650, 1.3, { colour: G3.coral, lines: 5 })}
   ${f("yasmin", { x: 900, y: 950, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${poster(1250, 660, 1.2, { colour: G3.coral, lines: 5 })}
   ${f("amal", { x: 660, y: 950, s: 1.58 })}
   ${f("mina", { x: 900, y: 950, s: 1.45 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.6, holding: heldPaper })}`,

  `${marketScene()}${mango(420, 890, 1.35)}${fruitBowl(780, 900, 1.05)}
   ${f("amal", { x: 620, y: 926, s: 1.58, holding: heldPaper })}
   ${f("omar", { x: 1120, y: 926, s: 1.45, arms: "up" })}`,
];

// Book 4 — At the Clinic (from the Unit 3 dialogue)
const clinicPages = [
  `${clinicScene()}${doctorKit(380, 930, 1.2)}
   ${f("sarah", { x: 1020, y: 926, s: 1.48 })}
   ${f("amal", { x: 680, y: 926, s: 1.55, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${hospital(1300, 950, 0.62)}
   ${f("sarah", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 640, y: 950, s: 1.55, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${doctorKit(1300, 950, 1.3)}
   ${f("amal", { x: 680, y: 950, s: 1.58, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${doctorKit(1290, 950, 1.2)}
   ${f("sarah", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${thoughtBubble(1240, 520, 1.15, foodTray(0, 20, 0.5, { bowls: 2 }))}
   ${f("amal", { x: 680, y: 950, s: 1.58, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}
   ${f("sarah", { x: 980, y: 950, s: 1.5 })}
   ${f("amal", { x: 660, y: 950, s: 1.55, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${poster(1260, 640, 1.15, { colour: G3.teal, lines: 4 })}
   ${f("sarah", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 640, y: 950, s: 1.55 })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${waterBottle(1270, 950, 1.5)}
   ${f("sarah", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}${doctorKit(1280, 950, 1.2)}
   ${f("sarah", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}`,

  `${plainRoomScene({ wall: "#e6eef2" })}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}
   ${f("sarah", { x: 1000, y: 950, s: 1.5 })}`,

  `${marketScene()}${fruitBowl(780, 900, 1.1)}
   ${f("sarah", { x: 1100, y: 926, s: 1.45, arms: "point" })}
   ${f("amal", { x: 620, y: 926, s: 1.55 })}`,

  `${townScene()}${lampPost(1260, 706, 0.9)}${waterBottle(360, 930, 1.2)}
   ${f("amal", { x: 760, y: 926, s: 1.58 })}`,
];

// Book 5 — The Market Song (from the Unit 3 rhyme)
const marketSongPages = [
  `${marketScene()}${fruitBowl(780, 900, 1.15)}${mango(460, 890, 1.3)}
   ${f("amal", { x: 620, y: 926, s: 1.55, arms: "up" })}
   ${f("omar", { x: 1120, y: 926, s: 1.45 })}`,

  `${marketScene()}${marketStall(760, 900, 0.7)}
   ${f("hana", { x: 560, y: 926, s: 1.45 })}
   ${f("amal", { x: 900, y: 926, s: 1.55 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "kitchen")}
   ${f("hana", { x: 940, y: 950, s: 1.48, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}`,

  `${marketScene()}${foodTray(760, 900, 1, { bowls: 3 })}
   ${f("amal", { x: 560, y: 926, s: 1.55, arms: "up" })}
   ${f("omar", { x: 1120, y: 926, s: 1.45, arms: "up" })}`,

  `${marketScene()}${marketStall(780, 900, 0.72)}
   ${f("amal", { x: 600, y: 926, s: 1.58, arms: "point" })}`,

  `${marketScene()}${foodTray(740, 900, 0.9, { bowls: 2 })}
   ${f("omar", { x: 1100, y: 926, s: 1.48, arms: "point" })}
   ${f("amal", { x: 580, y: 926, s: 1.55 })}`,

  `${marketScene()}${fruitBowl(760, 900, 1.2)}
   ${f("amal", { x: 600, y: 926, s: 1.58 })}`,

  `${kitchenScene()}${waterBottle(1250, 940, 1.4)}${foodTray(400, 940, 0.86, { bowls: 3 })}
   ${f("amal", { x: 780, y: 950, s: 1.58 })}`,

  `${kitchenScene()}${roomBox(1270, 640, 1.05, "kitchen")}
   ${f("amal", { x: 680, y: 950, s: 1.58, arms: "point" })}`,

  `${kitchenScene()}${cookpot(1240, 940, 1.4)}
   ${f("hana", { x: 940, y: 950, s: 1.48, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "dining")}${foodTray(420, 940, 0.9, { bowls: 4 })}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}
   ${f("hana", { x: 960, y: 950, s: 1.48 })}`,

  `${homeScene()}${roomBox(1270, 640, 1.05, "bedroom")}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,
];

// ================================================================ Unit 4
// Community and Communication

// Book 2 — Maya the Young Reporter (from the Unit 4 information text)
const reporterPages = [
  `${classroomScene()}${poster(1250, 650, 1.2, { colour: G3.coralDark, lines: 6 })}${desk(360, 950, 1.05, { item: heldNewspaper })}
   ${f("maya", { x: 780, y: 950, s: 1.6, holding: heldNotebook })}`,

  `${classroomScene()}${globeProp(1320, 950, 1.2)}
   ${f("maya", { x: 720, y: 950, s: 1.6, holding: heldNotebook })}`,

  `${classroomScene()}${poster(1250, 650, 1.15, { colour: G3.sky, lines: 5 })}
   ${f("maya", { x: 700, y: 950, s: 1.58, holding: heldNewspaper })}
   ${f("yasmin", { x: 1010, y: 950, s: 1.5 })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldNotebook })}
   ${f("maya", { x: 720, y: 950, s: 1.6, holding: heldNotebook })}`,

  `${marketScene()}${lampPost(760, 706, 0.8)}
   ${f("maya", { x: 620, y: 926, s: 1.55, holding: heldNotebook })}
   ${f("omar", { x: 1120, y: 926, s: 1.45, arms: "point" })}`,

  `${townScene()}${shoppingCentre(1220, 900, 0.62)}${marketStall(320, 900, 0.7)}
   ${f("maya", { x: 700, y: 926, s: 1.55, holding: heldNotebook })}
   ${f("theo", { x: 920, y: 926, s: 1.48 })}`,

  `${classroomScene()}${desk(1310, 950, 1.05, { item: heldPaper })}
   ${f("yasmin", { x: 1010, y: 950, s: 1.5, arms: "point" })}
   ${f("maya", { x: 700, y: 950, s: 1.58, holding: heldNotebook })}`,

  `${classroomScene()}${poster(1250, 650, 1.15, { colour: G3.leafy, lines: 4 })}
   ${f("yasmin", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("maya", { x: 680, y: 950, s: 1.58 })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldPaper })}${bookShelf(220, 950, 0.78)}
   ${f("maya", { x: 760, y: 950, s: 1.6, holding: heldNotebook })}`,

  `${plainRoomScene()}${poster(1220, 640, 1.35, { colour: G3.cream, lines: 7 })}
   ${f("maya", { x: 700, y: 950, s: 1.6, holding: heldNewspaper, arms: "point" })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldNewspaper })}
   ${f("sami", { x: 980, y: 950, s: 1.52, arms: "up" })}
   ${f("maya", { x: 680, y: 950, s: 1.58, holding: heldNotebook })}`,

  `${classroomScene()}${poster(1250, 650, 1.2, { colour: G3.coralDark, lines: 6 })}
   ${f("sami", { x: 960, y: 950, s: 1.52, holding: heldNewspaper })}
   ${f("maya", { x: 660, y: 950, s: 1.58, arms: "up" })}`,
];

// Book 3 — The Town Meeting (from the Unit 4 listening text)
const townMeetingPages = [
  `${hallScene()}${chairRows(760, 950, 0.9, { rows: 2, seats: 5 })}
   ${f("mayor", { x: 1330, y: 950, s: 1.5, arms: "up" })}`,

  `${hallScene()}${chairRows(700, 950, 0.86, { rows: 3, seats: 5 })}
   ${f("mayor", { x: 1350, y: 950, s: 1.5, arms: "point" })}`,

  `${hallScene()}${poster(300, 620, 1.25, { colour: G3.teal, lines: 5 })}
   ${f("mayor", { x: 1180, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 780, y: 950, s: 1.5 })}`,

  `${hallScene()}${bookShelf(1300, 950, 1)}${bookShelf(1500, 950, 0.86)}
   ${f("librarian", { x: 800, y: 950, s: 1.5, holding: heldBook })}`,

  `${hallScene()}${clinicFront(1300, 950, 0.62)}${doctorKit(360, 950, 1.1)}
   ${f("sarah", { x: 800, y: 950, s: 1.5, arms: "point" })}`,

  `${hallScene()}${chairRows(820, 950, 1, { rows: 3, seats: 6 })}${bunting(800, 150, 1.2, { span: 1200 })}`,

  `${hallScene()}${chairRows(660, 950, 0.82, { rows: 2, seats: 4 })}
   ${f("mum", { x: 1160, y: 950, s: 1.48, arms: "up" })}
   ${f("mayor", { x: 1400, y: 950, s: 1.48 })}`,

  `${hallScene()}${chairRows(620, 950, 0.8, { rows: 2, seats: 4 })}
   ${f("mayor", { x: 1220, y: 950, s: 1.52, arms: "point" })}
   ${f("mina", { x: 980, y: 950, s: 1.42 })}`,

  `${hallScene()}${chairRows(780, 950, 0.94, { rows: 3, seats: 6 })}
   ${f("mayor", { x: 1420, y: 950, s: 1.5 })}`,

  `${hallScene()}${chairRows(640, 950, 0.82, { rows: 2, seats: 4 })}
   ${f("karim", { x: 1180, y: 950, s: 1.48, arms: "up" })}`,

  `${hallScene()}${chairRows(700, 950, 0.86, { rows: 2, seats: 5 })}
   ${f("mayor", { x: 1300, y: 950, s: 1.52, arms: "point" })}
   ${f("maya", { x: 1020, y: 950, s: 1.48, holding: heldNotebook })}`,

  `${hallScene()}${chairRows(820, 950, 1, { rows: 3, seats: 6 })}${confetti(800, 480)}
   ${f("mayor", { x: 1420, y: 950, s: 1.5, arms: "up" })}`,
];

// Book 4 — The Circular Plan (from the Unit 4 story)
const circularPlanPages = [
  `${townScene()}${circularNews(1140, 926, 0.86)}${lampPost(280, 706, 0.86)}
   ${f("amal", { x: 620, y: 926, s: 1.58, arms: "point" })}
   ${f("nora", { x: 850, y: 926, s: 1.5 })}`,

  `${classroomScene({ boardText: "lines" })}
   ${f("yasmin", { x: 1080, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 760, y: 950, s: 1.55 })}`,

  `${classroomScene()}${desk(1320, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.55, arms: "up" })}
   ${f("yasmin", { x: 1030, y: 950, s: 1.5 })}`,

  `${yardScene()}${bench(300, 940, 1.1)}
   ${f("leo", { x: 640, y: 926, s: 1.5, arms: "up" })}
   ${f("nora", { x: 880, y: 926, s: 1.5, arms: "point" })}
   ${f("amal", { x: 1100, y: 926, s: 1.52 })}`,

  `${yardScene()}${thoughtBubble(1200, 500, 1.2, circularNewsIcon())}
   ${f("amal", { x: 640, y: 926, s: 1.55, arms: "point" })}
   ${f("leo", { x: 900, y: 926, s: 1.5 })}`,

  `${plainRoomScene()}${bookShelf(1420, 950, 1)}${bookShelf(220, 950, 0.9)}${libraryCart(1120, 950, 0.6)}
   ${f("amal", { x: 700, y: 950, s: 1.55, holding: heldPaper })}`,

  `${plainRoomScene()}${bookShelf(1440, 950, 0.94)}
   ${f("librarian", { x: 1100, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 740, y: 950, s: 1.55 })}`,

  `${townScene()}${fence(1200, 926, 1.1, 3)}${lampPost(300, 706, 0.86)}
   ${f("amal", { x: 720, y: 926, s: 1.58 })}`,

  `${townScene()}${circularNews(1160, 926, 0.7)}${desk(360, 926, 1, { item: heldPaper })}
   ${f("amal", { x: 640, y: 926, s: 1.55, arms: "point" })}
   ${f("leo", { x: 860, y: 926, s: 1.5, holding: heldPaper })}
   ${f("nora", { x: 1420, y: 926, s: 1.5 })}`,

  `${townScene()}${circularNews(1180, 926, 0.68)}
   ${f("yasmin", { x: 700, y: 926, s: 1.5, arms: "point" })}
   ${f("amal", { x: 420, y: 926, s: 1.52, holding: heldPaper })}`,

  `${townScene()}${circularNews(1080, 926, 0.9)}${lampPost(260, 706, 0.86)}
   ${f("amal", { x: 560, y: 926, s: 1.58, arms: "point" })}
   ${f("mum", { x: 760, y: 926, s: 1.48 })}`,

  `${townScene()}${circularNews(1120, 926, 0.86)}${confetti(700, 520)}
   ${f("nora", { x: 560, y: 926, s: 1.52 })}
   ${f("amal", { x: 780, y: 926, s: 1.56, arms: "up" })}`,
];

// Book 5 — Sami's First Story (Sami's promised story, Unit 4)
const samiStoryPages = [
  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldNewspaper })}
   ${f("sami", { x: 700, y: 950, s: 1.58, holding: heldNotebook })}
   ${f("maya", { x: 990, y: 950, s: 1.5, holding: heldNewspaper })}`,

  `${classroomScene()}${poster(1250, 650, 1.15, { colour: G3.sky, lines: 5 })}
   ${f("sami", { x: 720, y: 950, s: 1.58 })}`,

  `${classroomScene()}${desk(1310, 950, 1.05, { item: heldNotebook })}
   ${f("maya", { x: 980, y: 950, s: 1.5, holding: heldNotebook })}
   ${f("sami", { x: 700, y: 950, s: 1.55, mood: "sad" })}`,

  `${marketScene()}
   ${f("sami", { x: 640, y: 926, s: 1.55, mood: "sad" })}
   ${f("maya", { x: 880, y: 926, s: 1.5 })}`,

  `${classroomScene()}${bookShelf(230, 950, 0.8)}
   ${f("maya", { x: 980, y: 950, s: 1.52, arms: "point", holding: heldNotebook })}
   ${f("sami", { x: 700, y: 950, s: 1.55 })}`,

  `${marketScene()}${marketStall(760, 900, 0.68)}
   ${f("sami", { x: 560, y: 926, s: 1.55, holding: heldNotebook, arms: "point" })}
   ${f("maya", { x: 920, y: 926, s: 1.5 })}`,

  `${marketScene()}
   ${f("karim", { x: 1100, y: 926, s: 1.46, arms: "point" })}
   ${f("sami", { x: 700, y: 926, s: 1.55, holding: heldNotebook })}`,

  `${townScene()}${bench(1200, 926, 1.25)}${lampPost(300, 706, 0.86)}
   ${f("maya", { x: 860, y: 926, s: 1.5, arms: "point" })}
   ${f("sami", { x: 620, y: 926, s: 1.55, holding: heldNotebook })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("sami", { x: 780, y: 950, s: 1.6, holding: heldPaper })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}
   ${f("sami", { x: 780, y: 950, s: 1.6, holding: heldPaper, mood: "surprised" })}`,

  `${classroomScene()}${poster(1250, 650, 1.2, { colour: G3.gold, lines: 6 })}
   ${f("yasmin", { x: 990, y: 950, s: 1.5, arms: "point" })}
   ${f("sami", { x: 690, y: 950, s: 1.58, holding: heldNewspaper })}`,

  `${plainRoomScene()}${poster(1200, 630, 1.3, { colour: G3.cream, lines: 7 })}
   ${f("sami", { x: 620, y: 950, s: 1.58, arms: "up" })}
   ${f("maya", { x: 880, y: 950, s: 1.52, holding: heldNewspaper })}`,
];

// ================================================================ Unit 5
// Action and Movement

// Book 2 — The Race at the Village Field (from the Unit 5 recount)
const racePages = [
  `${fieldScene()}${raceBanner(800, 400, 1.15)}${fence(1420, 926, 1, 2)}
   ${f("amal", { x: 700, y: 926, s: 1.58, arms: "up" })}
   ${horse(1320, 890, 0.86, { flip: true, gallop: true })}`,

  `${fieldScene()}${raceBanner(820, 400, 1.2)}${bench(280, 940, 1.05)}
   ${f("amal", { x: 660, y: 926, s: 1.55 })}
   ${f("nora", { x: 900, y: 926, s: 1.5 })}
   ${f("sami", { x: 1120, y: 926, s: 1.5 })}`,

  `${fieldScene()}${bench(1280, 940, 1.2)}
   ${f("amal", { x: 620, y: 926, s: 1.58, mood: "surprised" })}
   ${f("mum", { x: 1000, y: 926, s: 1.46 })}
   ${f("idris", { x: 1180, y: 926, s: 1.38 })}`,

  `${fieldScene()}${dustPuffs(500, 900)}${tallGrass(300, 950, 1.2)}${fence(1300, 926, 1, 2)}
   ${f("amal", { x: 700, y: 926, s: 1.6 })}
   ${f("nora", { x: 960, y: 926, s: 1.5 })}
   ${f("leo", { x: 1160, y: 926, s: 1.5 })}`,

  `${fieldScene()}${raceBanner(760, 400, 1.1)}${dustPuffs(1100, 900)}
   ${f("yasmin", { x: 1240, y: 926, s: 1.48, arms: "up" })}
   ${f("amal", { x: 640, y: 926, s: 1.56 })}
   ${f("nora", { x: 880, y: 926, s: 1.5 })}`,

  `${fieldScene()}${motionArcs(420, 800, 1.4)}${dustPuffs(560, 900)}${tallGrass(280, 950, 1.15)}${raceBanner(1300, 420, 0.8)}
   ${f("amal", { x: 760, y: 926, s: 1.58 })}
   ${f("nora", { x: 1040, y: 926, s: 1.46 })}`,

  `${fieldScene()}${motionArcs(440, 780, 1.5)}${dustPuffs(620, 900)}${dustPuffs(480, 910)}${raceBanner(1180, 400, 1)}${tallGrass(300, 950, 1.1)}
   ${f("amal", { x: 800, y: 926, s: 1.62 })}`,

  `${fieldScene()}${motionArcs(1180, 700, 1.3, { flip: true })}${dustPuffs(540, 900)}${bench(320, 940, 1)}${tallGrass(1360, 950, 1.15)}
   ${f("amal", { x: 740, y: 926, s: 1.6, mood: "surprised" })}`,

  `${fieldScene()}${fence(1180, 926, 1.25, 3)}
   ${horse(1200, 856, 1, { gallop: true })}
   ${f("amal", { x: 520, y: 926, s: 1.58 })}`,

  `${fieldScene()}${dustPuffs(520, 900)}${tallGrass(1360, 950, 1.15)}${fence(1180, 926, 1, 2)}${raceBanner(760, 400, 1.05)}
   ${f("amal", { x: 720, y: 926, s: 1.6 })}`,

  `${fieldScene()}${raceBanner(780, 400, 1.2)}${confetti(760, 560)}
   ${f("amal", { x: 660, y: 926, s: 1.6, arms: "up" })}
   ${f("idris", { x: 1060, y: 926, s: 1.4, arms: "up" })}`,

  `${fieldScene()}${bench(1300, 940, 1.15)}
   ${f("yasmin", { x: 960, y: 926, s: 1.48, arms: "point" })}
   ${f("amal", { x: 660, y: 926, s: 1.58 })}`,
];

// Book 3 — How Animals Move (from the Unit 5 information text)
const animalMovePages = [
  `${fieldScene()}${fence(300, 926, 1, 2)}
   ${horse(1180, 866, 0.9, { gallop: true })}
   ${snail(560, 930, 1.15)}
   ${f("amal", { x: 800, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${fieldScene()}${tallGrass(300, 940, 1.15)}
   ${f("amal", { x: 700, y: 926, s: 1.55, holding: heldNotebook })}
   ${f("nora", { x: 960, y: 926, s: 1.5 })}`,

  `${fieldScene()}${fence(280, 926, 1.05, 3)}${dustPuffs(760, 900)}${tallGrass(560, 950, 1.15)}
   ${horse(1060, 866, 1.1, { gallop: true })}`,

  `${basicScene()}${tallGrass(240, 950, 1.2)}${motionArcs(420, 740, 1.4)}${acacia(1440, 900, 1.1)}${dustPuffs(700, 910)}
   ${horse(1040, 866, 1.15, { gallop: true })}`,

  `${forestScene()}${fallenBranch(1240, 940, 1.2)}
   ${snail(760, 900, 2.1)}`,

  `${yardScene()}${fence(1080, 926, 1.3, 3)}
   ${cat(760, 900, 1.5, { squeezing: true })}`,

  `${basicScene()}${acacia(1260, 900, 1.5)}
   ${wildBird(520, 300, 1.3, true)}${wildBird(700, 240, 1.15, true)}${wildBird(880, 320, 1.25, true)}
   ${f("nora", { x: 700, y: 926, s: 1.5, arms: "point" })}`,

  `${basicScene()}${acacia(300, 900, 1.3)}
   ${wildBird(1080, 300, 1.5, false)}
   ${lookLine(1060, 330, 700, 250)}
   ${wildBird(660, 250, 1.1, true)}`,

  `${basicScene()}${tallGrass(1400, 940, 1.15)}
   ${[0, 1, 2, 3, 4].map((i) => wildBird(360 + i * 210, 240 + (i % 3) * 90, 1.15, true)).join("")}`,

  `${basicScene()}${lake(620, 800, 380, 74)}${acacia(1340, 890, 1.25)}${tallGrass(220, 950, 1.1)}
   ${goat({ x: 540, y: 862, s: 0.7 })}
   ${f("amal", { x: 1000, y: 926, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldNotebook })}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldNotebook })}
   ${f("nora", { x: 990, y: 950, s: 1.5 })}`,

  `${fieldScene()}${fence(1360, 926, 1, 2)}
   ${horse(1180, 866, 0.82, { gallop: true })}
   ${snail(420, 930, 1.1)}
   ${cat(920, 926, 1.1)}
   ${f("amal", { x: 660, y: 926, s: 1.52, arms: "up" })}`,
];

// Book 4 — The Lost Goat (from the Unit 5 listening script)
const lostGoatPages = [
  `${marketScene()}
   ${f("adam", { x: 660, y: 926, s: 1.56, mood: "surprised", arms: "point" })}
   ${goat({ x: 1120, y: 856, s: 0.66 })}`,

  `${marketScene()}${fence(320, 926, 0.9, 2)}
   ${f("adam", { x: 700, y: 926, s: 1.56 })}
   ${goat({ x: 1040, y: 856, s: 0.72 })}`,

  `${marketScene()}
   ${f("adam", { x: 760, y: 926, s: 1.56, mood: "surprised" })}`,

  `${marketScene()}${lampPost(780, 706, 0.8)}
   ${f("adam", { x: 640, y: 926, s: 1.56, arms: "point", mood: "surprised" })}
   ${lookLine(700, 760, 1180, 830)}`,

  `${townScene()}${shoppingCentre(1200, 900, 0.6)}${lampPost(300, 706, 0.86)}
   ${f("adam", { x: 720, y: 926, s: 1.56, mood: "sad" })}`,

  `${townScene()}${bakeryFront(1200, 900, 0.72)}${marketStall(320, 900, 0.66)}
   ${f("adam", { x: 700, y: 926, s: 1.56, arms: "point" })}`,

  `${townScene()}${flatBlock(1240, 900, 0.66)}${flatBlock(240, 900, 0.6)}
   ${f("adam", { x: 760, y: 926, s: 1.56, mood: "sad" })}`,

  `${townScene()}${bakeryFront(1220, 900, 0.68)}
   ${f("adam", { x: 640, y: 926, s: 1.56 })}`,

  `${townScene()}${bakeryFront(1240, 900, 0.66)}${thoughtBubble(700, 500, 1.1, goatIcon())}
   ${f("adam", { x: 780, y: 926, s: 1.56, mood: "surprised" })}`,

  `${townScene()}${marketStall(1200, 900, 0.72)}${haystack(340, 926, 0.86)}
   ${goat({ x: 900, y: 820, s: 0.86 })}
   ${f("adam", { x: 560, y: 926, s: 1.56 })}`,

  `${townScene()}${marketStall(1240, 900, 0.7)}
   ${f("adam", { x: 700, y: 926, s: 1.58, arms: "up" })}
   ${goat({ x: 1020, y: 830, s: 0.78 })}`,

  `${sunsetScene()}${hut(1240, 930, 0.78)}${lampPost(320, 930, 0.9, { lit: true })}
   ${f("adam", { x: 720, y: 940, s: 1.56 })}
   ${goat({ x: 980, y: 850, s: 0.72 })}`,
];

// Book 5 — The Posters for Simba (the poster plan the Unit 5 story sets up)
const simbaPostersPages = [
  `${townScene()}${poster(1200, 640, 1.2, { colour: G3.gold, lines: 4 })}${lampPost(280, 706, 0.86)}
   ${f("amal", { x: 620, y: 926, s: 1.56, holding: heldPaper })}
   ${f("nora", { x: 860, y: 926, s: 1.5 })}
   ${dog(1400, 926, 1.15)}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}${waterBottle(360, 950, 1.3)}
   ${f("talia", { x: 1040, y: 950, s: 1.48, arms: "point" })}
   ${dog(720, 950, 1.35, { thin: true, sitting: true })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}${desk(1320, 950, 1.05, { item: heldPaper })}
   ${f("nora", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("amal", { x: 950, y: 950, s: 1.55, holding: heldPaper })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}
   ${f("leo", { x: 1020, y: 950, s: 1.52, arms: "point" })}
   ${dog(680, 950, 1.4, { sitting: true })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldPaper })}
   ${f("amal", { x: 720, y: 950, s: 1.58, holding: heldPaper })}`,

  `${classroomScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.gold }) })}
   ${f("leo", { x: 700, y: 950, s: 1.55, arms: "point" })}`,

  `${classroomScene()}${desk(1310, 950, 1.05, { item: heldPaper })}
   ${f("nora", { x: 700, y: 950, s: 1.55, holding: heldPaper })}
   ${f("amal", { x: 960, y: 950, s: 1.55, arms: "point" })}`,

  `${marketScene()}${poster(1140, 640, 1.05, { colour: G3.gold, lines: 4 })}
   ${f("amal", { x: 620, y: 926, s: 1.55, holding: heldPaper })}
   ${f("omar", { x: 900, y: 926, s: 1.45 })}`,

  `${townScene()}${poster(1200, 640, 1.1, { colour: G3.gold, lines: 4 })}${lampPost(300, 706, 0.86)}
   ${f("leo", { x: 700, y: 926, s: 1.5, mood: "sad" })}
   ${f("nora", { x: 920, y: 926, s: 1.5, mood: "sad" })}`,

  `${plainRoomScene({ wall: "#e6e0cc" })}
   ${f("talia", { x: 1020, y: 950, s: 1.48, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}
   ${dog(1340, 950, 1.25)}`,

  `${yardScene()}${playBall(1240, 930, 1.1)}
   ${dog(1020, 926, 1.45)}
   ${f("amal", { x: 660, y: 926, s: 1.56, arms: "up" })}`,

  `${classroomScene()}${easel(1260, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.gold }) })}
   ${f("amal", { x: 660, y: 950, s: 1.56 })}
   ${f("nora", { x: 900, y: 950, s: 1.52 })}
   ${f("leo", { x: 420, y: 950, s: 1.5 })}`,
];

// ================================================================ Unit 6
// People in Society

// Book 2 — The People of Our Town (from the Unit 6 information text)
const townPeoplePages = [
  `${townScene()}${cityBuildings(1300, 700, 0.72)}${lampPost(260, 706, 0.9)}
   ${f("caretaker", { x: 520, y: 926, s: 1.46 })}
   ${f("karim", { x: 780, y: 926, s: 1.46 })}
   ${f("elena", { x: 1040, y: 926, s: 1.46, holding: heldPaper })}`,

  `${townScene()}${cityBuildings(1280, 700, 0.68)}${crossing(360, 906, 0.8)}
   ${f("amal", { x: 760, y: 926, s: 1.55, arms: "point" })}`,

  `${corridorScene()}${broomProp(1180, 950, 1.05)}
   ${f("caretaker", { x: 760, y: 950, s: 1.5 })}`,

  `${marketScene()}${fruitBowl(780, 900, 1.15)}
   ${f("omar", { x: 1100, y: 926, s: 1.48, arms: "point" })}`,

  `${marketScene()}${marketStall(760, 900, 0.7)}${toolRack(400, 926, 0.86)}
   ${f("karim", { x: 1060, y: 926, s: 1.48 })}`,

  `${basicScene()}${river(700, 820, 1.7)}${bridgeSite(820, 760, 0.72)}
   ${f("elena", { x: 480, y: 926, s: 1.48, holding: heldPaper })}
   ${helmetProp(1300, 926, 1.1)}`,

  `${basicScene()}${river(700, 830, 1.7)}${bridgeSite(860, 760, 0.66)}
   ${f("labourer", { x: 520, y: 926, s: 1.48 })}
   ${f("elena", { x: 1120, y: 926, s: 1.46, arms: "point" })}`,

  `${hallScene()}${desk(1260, 950, 1.15, { item: heldPaper })}
   ${f("governor", { x: 760, y: 950, s: 1.5, holding: heldPaper })}`,

  `${hallScene()}${chairRows(1200, 950, 0.72, { rows: 2, seats: 3 })}
   ${f("lawyer", { x: 620, y: 950, s: 1.5, arms: "point" })}
   ${f("mum", { x: 880, y: 950, s: 1.46 })}`,

  `${hallScene()}${desk(1280, 950, 1.05, { item: heldPaper })}
   ${f("lawyer", { x: 660, y: 950, s: 1.5, holding: heldPaper })}
   ${f("mina", { x: 920, y: 950, s: 1.4 })}`,

  `${townScene()}${cityBuildings(1300, 700, 0.7)}${lampPost(280, 706, 0.9)}
   ${f("amal", { x: 740, y: 926, s: 1.55 })}`,

  `${sunsetScene()}${cityBuildings(1280, 700, 0.66, { lit: true })}${lampPost(300, 930, 0.95, { lit: true })}
   ${f("caretaker", { x: 560, y: 940, s: 1.46 })}
   ${f("karim", { x: 800, y: 940, s: 1.46 })}
   ${f("elena", { x: 1040, y: 940, s: 1.46 })}`,
];

// Book 3 — Two Neighbours (from the Unit 6 information text)
const twoNeighboursPages = [
  `${townScene()}${house(1180, 926, 0.76)}${house(420, 926, 0.7, { wall: "#e8dcc2" })}
   ${f("theo", { x: 700, y: 926, s: 1.52 })}
   ${f("omar", { x: 940, y: 926, s: 1.46 })}`,

  `${townScene()}${house(1200, 926, 0.72)}${lampPost(300, 706, 0.86)}
   ${f("theo", { x: 720, y: 926, s: 1.52, mood: "sad" })}`,

  `${sunsetScene()}${signpost(1240, 930, 0.72, { arms: 3 })}
   ${f("theo", { x: 620, y: 940, s: 1.5, mood: "sad" })}
   ${f("mum", { x: 860, y: 940, s: 1.46 })}`,

  `${townScene()}${house(1180, 926, 0.78)}${gardenPlant(760, 930, 1.25)}${gardenPlant(900, 936, 1.05)}
   ${f("theo", { x: 500, y: 926, s: 1.52 })}`,

  `${townScene()}${gardenPlant(1120, 930, 1.3)}${gardenPlant(1280, 936, 1.1)}${house(400, 926, 0.66)}
   ${f("theo", { x: 780, y: 926, s: 1.52, arms: "point" })}`,

  `${townScene()}${house(1200, 926, 0.74)}${marketStall(340, 900, 0.66)}
   ${f("omar", { x: 780, y: 926, s: 1.48 })}`,

  `${marketScene()}${fruitBowl(780, 900, 1.1)}
   ${f("omar", { x: 1100, y: 926, s: 1.48, arms: "point" })}`,

  `${townScene()}${house(1220, 926, 0.72)}${house(380, 926, 0.66)}
   ${f("omar", { x: 780, y: 926, s: 1.48 })}
   ${f("mina", { x: 1020, y: 926, s: 1.4 })}`,

  `${marketScene()}${mango(760, 890, 1.35)}${fruitBowl(560, 900, 1)}
   ${f("omar", { x: 1120, y: 926, s: 1.48 })}`,

  `${marketScene()}${fruitBowl(760, 900, 1.15)}
   ${f("omar", { x: 1080, y: 926, s: 1.46, arms: "point" })}
   ${f("idris", { x: 640, y: 926, s: 1.4 })}
   ${f("mina", { x: 440, y: 926, s: 1.4 })}`,

  `${townScene()}${house(1200, 926, 0.74)}${house(400, 926, 0.68)}
   ${f("mum", { x: 940, y: 926, s: 1.46, arms: "point" })}
   ${f("theo", { x: 700, y: 926, s: 1.5 })}`,

  `${yardScene()}${playBall(1200, 930, 1.15)}
   ${f("theo", { x: 660, y: 926, s: 1.52, arms: "up" })}
   ${f("sami", { x: 900, y: 926, s: 1.5, arms: "up" })}`,
];

// Book 4 — Elena's Bridge (from the Unit 6 interview)
const elenaBridgePages = [
  `${basicScene()}${river(760, 830, 1.8)}${bridgeSite(820, 760, 0.78)}
   ${f("elena", { x: 460, y: 926, s: 1.5, holding: heldPaper })}
   ${f("nora", { x: 1240, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${basicScene()}${river(760, 840, 1.7)}${bridgeSite(860, 770, 0.66)}
   ${f("nora", { x: 620, y: 926, s: 1.52, holding: heldNotebook })}
   ${f("elena", { x: 1140, y: 926, s: 1.48, arms: "up" })}`,

  `${basicScene()}${river(740, 840, 1.7)}${bridgeSite(840, 770, 0.66)}${helmetProp(360, 926, 1.15)}
   ${f("elena", { x: 1120, y: 926, s: 1.48, arms: "point" })}
   ${f("nora", { x: 700, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${basicScene()}${river(760, 830, 1.8)}${bridgeSite(800, 750, 0.84)}
   ${f("elena", { x: 1200, y: 926, s: 1.48, arms: "point" })}`,

  `${basicScene()}${river(760, 840, 1.7)}${bridgeSite(860, 770, 0.66)}${cloudPuff(400, 220, 1.3)}
   ${f("nora", { x: 640, y: 926, s: 1.5, holding: heldNotebook })}
   ${f("elena", { x: 1160, y: 926, s: 1.48 })}`,

  `${basicScene()}${river(700, 840, 1.6)}${bridgeSite(880, 770, 0.6)}${desk(340, 926, 1.05, { item: heldPaper })}
   ${f("elena", { x: 660, y: 926, s: 1.5, holding: heldPaper })}`,

  `${basicScene()}${river(760, 840, 1.7)}${bridgeSite(860, 770, 0.64)}${helmetProp(1400, 926, 1.25)}
   ${f("elena", { x: 700, y: 926, s: 1.5 })}`,

  `${basicScene()}${river(760, 830, 1.8)}${bridgeSite(820, 755, 0.8)}
   ${f("elena", { x: 480, y: 926, s: 1.48, arms: "point" })}
   ${f("labourer", { x: 1240, y: 926, s: 1.46 })}`,

  `${basicScene()}${river(740, 840, 1.7)}${bridgeSite(840, 770, 0.66)}
   ${f("elena", { x: 1140, y: 926, s: 1.48, arms: "point" })}
   ${f("nora", { x: 680, y: 926, s: 1.5, holding: heldNotebook })}`,

  `${basicScene()}${river(760, 840, 1.7)}${bridgeSite(860, 770, 0.64)}
   ${f("nora", { x: 700, y: 926, s: 1.52, arms: "up" })}`,

  `${basicScene()}${river(760, 840, 1.7)}${bridgeSite(840, 770, 0.68)}
   ${f("elena", { x: 1120, y: 926, s: 1.48, arms: "up" })}
   ${f("nora", { x: 660, y: 926, s: 1.5 })}`,

  `${basicScene()}${river(760, 840, 1.8)}${bridgeSite(800, 750, 0.86, { done: true })}${bunting(760, 200, 1.2, { span: 1080 })}
   ${f("nora", { x: 520, y: 926, s: 1.5, arms: "up" })}
   ${f("elena", { x: 1180, y: 926, s: 1.48, arms: "up" })}`,
];

// Book 5 — The Caretaker's Keys (the line the Unit 6 story ends on)
const caretakerPages = [
  `${corridorScene()}${broomProp(1200, 950, 1.05)}${keyRing(340, 700, 1.2)}
   ${f("caretaker", { x: 740, y: 950, s: 1.5 })}`,

  `${corridorScene()}
   ${f("caretaker", { x: 760, y: 950, s: 1.5 })}`,

  `${corridorScene()}${keyRing(1240, 660, 1.5)}
   ${f("caretaker", { x: 700, y: 950, s: 1.5, holding: heldKey })}`,

  `${townScene()}${fence(1180, 926, 1.2, 3)}${lampPost(300, 706, 0.9)}
   ${f("caretaker", { x: 720, y: 926, s: 1.48, holding: heldKey })}`,

  `${corridorScene()}${broomProp(1180, 950, 1.1)}
   ${f("caretaker", { x: 700, y: 950, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${broomProp(1420, 950, 1)}${desk(300, 950, 1, { item: heldPaper })}
   ${f("caretaker", { x: 800, y: 950, s: 1.5 })}`,

  `${corridorScene()}
   ${f("caretaker", { x: 1180, y: 950, s: 1.46 })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}
   ${f("nora", { x: 880, y: 950, s: 1.5 })}`,

  `${townScene()}${paradeBanner(1180, 900, 0.68)}${bunting(700, 180, 1.05, { span: 900 })}
   ${f("amal", { x: 620, y: 926, s: 1.56, holding: heldPaper })}
   ${f("caretaker", { x: 880, y: 926, s: 1.46 })}`,

  `${townScene()}${lampPost(1280, 706, 0.9)}
   ${f("amal", { x: 660, y: 926, s: 1.56, arms: "up" })}
   ${f("caretaker", { x: 940, y: 926, s: 1.48 })}`,

  `${corridorScene()}${broomProp(1160, 950, 1.1)}
   ${f("caretaker", { x: 860, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 560, y: 950, s: 1.55 })}`,

  `${corridorScene()}
   ${f("amal", { x: 700, y: 950, s: 1.56 })}
   ${f("caretaker", { x: 980, y: 950, s: 1.48 })}`,

  `${homeScene()}${desk(1240, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 780, y: 950, s: 1.6, holding: heldPaper })}`,
];

// ================================================================ Unit 7
// Emotions, Behaviour, and Identity

// Book 2 — The Day Before the Test (from the Unit 7 realistic fiction)
const beforeTestPages = [
  `${kitchenScene()}${desk(1260, 950, 1.1, { item: heldPaper })}${roomBox(620, 620, 0.8, "kitchen")}
   ${f("amal", { x: 880, y: 950, s: 1.58, mood: "sad", holding: heldPaper })}
   ${f("adam", { x: 1120, y: 950, s: 1.52 })}`,

  `${kitchenScene()}${desk(1280, 950, 1.1, { item: heldPaper })}
   ${f("amal", { x: 720, y: 950, s: 1.6, mood: "sad", holding: heldPaper })}`,

  `${kitchenScene()}${thoughtBubble(1180, 520, 1.2, heldPaper)}
   ${f("amal", { x: 700, y: 950, s: 1.6, mood: "sad" })}`,

  `${kitchenScene()}${thoughtBubble(1200, 500, 1.3, questionMarks())}
   ${f("amal", { x: 700, y: 950, s: 1.6, mood: "surprised" })}`,

  `${kitchenScene()}${roomBox(1280, 640, 1.02, "kitchen")}
   ${f("adam", { x: 1000, y: 950, s: 1.52, mood: "surprised" })}
   ${f("amal", { x: 700, y: 950, s: 1.58, mood: "sad" })}`,

  `${kitchenScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("adam", { x: 980, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.58, mood: "sad" })}`,

  `${kitchenScene()}
   ${f("adam", { x: 960, y: 950, s: 1.52 })}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}`,

  `${kitchenScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.58, mood: "surprised" })}
   ${f("adam", { x: 960, y: 950, s: 1.52 })}`,

  `${kitchenScene()}${roomBox(1290, 640, 1, "living")}
   ${f("adam", { x: 960, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "living")}${waterBottle(360, 950, 1.2)}
   ${f("mum", { x: 980, y: 950, s: 1.5 })}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}`,

  `${kitchenScene()}${desk(1290, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 760, y: 950, s: 1.6, holding: heldPaper })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.6, arms: "up" })}
   ${f("yasmin", { x: 1020, y: 950, s: 1.5 })}`,
];

// Book 3 — Where My Family Comes From (from Nora's Unit 7 recount)
const familyOriginPages = [
  `${homeScene()}${roomBox(1260, 640, 1.1, "living")}${foodTray(400, 950, 0.86, { bowls: 3 })}
   ${f("nora", { x: 760, y: 950, s: 1.58 })}
   ${f("hana", { x: 1010, y: 950, s: 1.48 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "bedroom")}
   ${f("nora", { x: 720, y: 950, s: 1.6, arms: "up" })}`,

  `${basicScene()}${river(760, 800, 1.8)}${hut(1240, 900, 0.72)}${hut(320, 900, 0.62)}
   ${f("nora", { x: 780, y: 926, s: 1.55 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldBook })}
   ${f("nora", { x: 700, y: 950, s: 1.58, holding: heldBook })}
   ${f("yasmin", { x: 1010, y: 950, s: 1.5 })}`,

  `${homeScene()}${roomBox(1270, 640, 1.08, "living")}
   ${f("hana", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("nora", { x: 700, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${cookpot(1250, 940, 1.35)}${foodTray(400, 950, 0.9, { bowls: 3 })}
   ${f("hana", { x: 980, y: 950, s: 1.5 })}
   ${f("nora", { x: 720, y: 950, s: 1.55 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "dining")}${foodTray(420, 950, 0.9, { bowls: 4 })}
   ${f("hana", { x: 1000, y: 950, s: 1.5, arms: "up" })}
   ${f("nora", { x: 740, y: 950, s: 1.55 })}`,

  `${homeScene()}${roomBox(1280, 640, 1.02, "dining")}
   ${f("hana", { x: 1020, y: 950, s: 1.5, arms: "point" })}
   ${f("theo", { x: 780, y: 950, s: 1.5 })}
   ${f("nora", { x: 540, y: 950, s: 1.55 })}`,

  `${yardScene()}${bench(1240, 940, 1.2)}
   ${f("maya", { x: 560, y: 926, s: 1.5 })}
   ${f("sami", { x: 780, y: 926, s: 1.5 })}
   ${f("theo", { x: 1000, y: 926, s: 1.5 })}
   ${f("nora", { x: 340, y: 926, s: 1.52 })}`,

  `${yardScene()}${mango(1240, 890, 1.4)}${gardenPlant(340, 936, 1.1)}
   ${f("maya", { x: 660, y: 926, s: 1.5, arms: "point" })}
   ${f("sami", { x: 900, y: 926, s: 1.5 })}`,

  `${plainRoomScene()}${foodTray(1220, 950, 1.25, { bowls: 4 })}${foodTray(380, 950, 1, { bowls: 3 })}
   ${f("nora", { x: 700, y: 950, s: 1.55 })}
   ${f("maya", { x: 940, y: 950, s: 1.5 })}`,

  `${plainRoomScene()}${bunting(800, 160, 1.2, { span: 1180 })}${foodTray(1250, 950, 1.1, { bowls: 3 })}
   ${f("nora", { x: 640, y: 950, s: 1.58, arms: "up" })}
   ${f("maya", { x: 900, y: 950, s: 1.5 })}
   ${f("theo", { x: 400, y: 950, s: 1.5 })}`,
];

// Book 4 — Getting Ready for the Play (from the Unit 7 spoken talk)
const readyForPlayPages = [
  `${classroomScene()}${easel(1260, 950, 1.2, { inner: poster(0, 0, 0.5, { colour: G3.plum }) })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.55 })}
   ${f("sami", { x: 400, y: 950, s: 1.5 })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5, arms: "up" })}
   ${f("nora", { x: 700, y: 950, s: 1.5 })}
   ${f("leo", { x: 460, y: 950, s: 1.5 })}`,

  `${stageScene({ open: false })}
   ${f("yasmin", { x: 800, y: 960, s: 1.5, arms: "point" })}`,

  `${classroomScene()}${poster(1250, 650, 1.15, { colour: G3.gold, lines: 4 })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 680, y: 950, s: 1.55 })}`,

  `${stageScene()}
   ${f("amal", { x: 660, y: 960, s: 1.55 })}
   ${f("nora", { x: 900, y: 960, s: 1.5 })}
   ${f("sami", { x: 1120, y: 960, s: 1.5 })}`,

  `${plainRoomScene({ wall: "#e2d6e6" })}${bunting(800, 170, 1.15, { span: 1100 })}${easel(1300, 950, 1.1, { inner: poster(0, 0, 0.44, { colour: G3.coral }) })}
   ${f("yasmin", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("sami", { x: 700, y: 950, s: 1.5 })}
   ${f("mina", { x: 460, y: 950, s: 1.42 })}`,

  `${plainRoomScene({ wall: "#e2d6e6" })}${easel(1280, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.teal }) })}
   ${f("nora", { x: 700, y: 950, s: 1.52 })}
   ${f("mina", { x: 940, y: 950, s: 1.42 })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("leo", { x: 700, y: 950, s: 1.5 })}`,

  `${stageScene()}
   ${f("amal", { x: 780, y: 960, s: 1.55, arms: "up" })}`,

  `${classroomScene()}
   ${f("sami", { x: 700, y: 950, s: 1.52, mood: "surprised", arms: "up" })}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5 })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5, arms: "point" })}
   ${f("sami", { x: 720, y: 950, s: 1.52 })}
   ${f("amal", { x: 480, y: 950, s: 1.55 })}`,

  `${stageScene()}${confetti(800, 500)}
   ${f("yasmin", { x: 400, y: 960, s: 1.5, arms: "up" })}
   ${f("amal", { x: 700, y: 960, s: 1.55, arms: "up" })}
   ${f("sami", { x: 940, y: 960, s: 1.5, arms: "up" })}
   ${f("nora", { x: 1180, y: 960, s: 1.5, arms: "up" })}`,
];

// Book 5 — The Cultural Fair (from "A Chat About Feelings" and the fair itself)
const culturalFairPages = [
  `${plainRoomScene()}${bunting(800, 160, 1.25, { span: 1250 })}${foodTray(1220, 950, 1.2, { bowls: 4 })}${foodTray(380, 950, 1.05, { bowls: 3 })}
   ${f("nora", { x: 700, y: 950, s: 1.56 })}
   ${f("maya", { x: 950, y: 950, s: 1.5 })}`,

  `${yardScene()}${bench(1240, 940, 1.2)}
   ${f("maya", { x: 660, y: 926, s: 1.52, arms: "point" })}
   ${f("nora", { x: 900, y: 926, s: 1.52 })}`,

  `${yardScene()}${bench(1260, 940, 1.15)}${mango(340, 890, 1.3)}
   ${f("nora", { x: 680, y: 926, s: 1.52 })}
   ${f("maya", { x: 920, y: 926, s: 1.5, arms: "up" })}`,

  `${yardScene()}${thoughtBubble(1200, 500, 1.2, foodTray(0, 20, 0.42, { bowls: 3 }))}
   ${f("nora", { x: 700, y: 926, s: 1.54 })}`,

  `${plainRoomScene()}${foodTray(1220, 950, 1.3, { bowls: 3 })}
   ${f("maya", { x: 720, y: 950, s: 1.54, arms: "point" })}`,

  `${plainRoomScene()}${foodTray(1230, 950, 1.15, { bowls: 4 })}
   ${f("maya", { x: 700, y: 950, s: 1.52 })}
   ${f("idris", { x: 950, y: 950, s: 1.4, mood: "sad" })}`,

  `${plainRoomScene()}${foodTray(1240, 950, 1.2, { bowls: 3 })}${bunting(760, 170, 1.1, { span: 1000 })}
   ${f("maya", { x: 700, y: 950, s: 1.52, mood: "sad" })}`,

  `${plainRoomScene()}${foodTray(1240, 950, 1.15, { bowls: 4 })}
   ${f("maya", { x: 660, y: 950, s: 1.52 })}
   ${f("salma", { x: 940, y: 950, s: 1.46 })}
   ${f("theo", { x: 400, y: 950, s: 1.5 })}`,

  `${yardScene()}${bench(1240, 940, 1.2)}
   ${f("maya", { x: 660, y: 926, s: 1.52, arms: "up" })}
   ${f("nora", { x: 900, y: 926, s: 1.52 })}`,

  `${plainRoomScene()}${bunting(800, 160, 1.25, { span: 1250 })}${foodTray(1220, 950, 1.2, { bowls: 4 })}${foodTray(360, 950, 1, { bowls: 3 })}
   ${f("nora", { x: 720, y: 950, s: 1.56, arms: "up" })}
   ${f("mina", { x: 960, y: 950, s: 1.42 })}`,

  `${plainRoomScene()}${foodTray(1240, 950, 1.2, { bowls: 3 })}
   ${f("maya", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("nora", { x: 700, y: 950, s: 1.54, holding: heldNotebook })}`,

  `${plainRoomScene()}${bunting(800, 160, 1.2, { span: 1200 })}${desk(1280, 950, 1.05, { item: heldNotebook })}
   ${f("nora", { x: 720, y: 950, s: 1.58, holding: heldNotebook })}`,
];

// ================================================================ Unit 8
// Tools, Machines, and Everyday Items

// Book 2 — The Right Tool for the Job (from the Unit 8 information text)
const rightToolPages = [
  `${plainRoomScene({ wall: "#e0d8c6" })}${poster(1300, 620, 1.15, { colour: G3.gold, lines: 4 })}${toolRack(1060, 950, 1.15)}
   ${f("amal", { x: 560, y: 950, s: 1.58, holding: heldPaper })}`,

  `${plainRoomScene({ wall: "#e0d8c6" })}${poster(1320, 620, 1.05, { colour: G3.teal, lines: 4 })}${toolRack(1100, 950, 1.05)}${desk(340, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}`,

  `${classroomScene()}${toolRack(1300, 950, 0.86)}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldPaper, arms: "point" })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldPaper })}
   ${f("amal", { x: 720, y: 950, s: 1.6, holding: heldPaper })}`,

  `${kitchenScene()}${counterTop(1240, 950, 1)}${microwaveProp(1240, 774, 1)}${roomBox(560, 620, 0.78, "kitchen")}
   ${f("mum", { x: 940, y: 950, s: 1.5, arms: "point" })}`,

  `${kitchenScene()}${counterTop(1240, 950, 1)}${microwaveProp(1240, 774, 1, { lit: true })}${cookpot(400, 940, 1.2)}
   ${f("mum", { x: 900, y: 950, s: 1.5 })}`,

  `${homeScene()}${roomBox(600, 630, 0.8, "living")}${toolRack(1180, 950, 1)}
   ${f("dad", { x: 700, y: 950, s: 1.52 })}`,

  `${plainRoomScene({ wall: "#e0d8c6" })}${poster(1330, 620, 1, { colour: G3.plum, lines: 3 })}${toolRack(1120, 950, 1.1)}${desk(360, 950, 1, { item: heldPaper })}
   ${f("amal", { x: 720, y: 950, s: 1.58 })}`,

  `${basicScene()}${factory(1120, 900, 0.78)}${lorry(460, 926, 0.72)}`,

  `${fieldScene()}${farmField(1040, 900, 0.82)}${toolRack(400, 926, 0.9)}
   ${f("labourer", { x: 700, y: 926, s: 1.46 })}
   ${f("karim", { x: 940, y: 926, s: 1.46 })}`,

  `${plainRoomScene({ wall: "#e0d8c6" })}${bookShelf(240, 950, 0.8)}${toolRack(1160, 950, 1.05)}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldPaper })}
   ${f("leo", { x: 940, y: 950, s: 1.52 })}`,

  `${plainRoomScene({ wall: "#e0d8c6" })}${poster(1330, 620, 1.1, { colour: G3.coral, lines: 4 })}${toolRack(1100, 950, 1.15)}${helmetProp(360, 950, 1.2)}
   ${f("amal", { x: 700, y: 950, s: 1.58, arms: "up" })}`,
];

// Book 3 — A Look at the Stars (from the Unit 8 information text)
const starsPages = [
  `${starrySky()}${telescope(1160, 940, 1.05)}${craterMoon(340, 240, 0.86)}
   ${f("amal", { x: 700, y: 940, s: 1.55, arms: "point" })}`,

  `${nightScene()}
   ${f("amal", { x: 700, y: 940, s: 1.55, arms: "up" })}
   ${f("noah", { x: 950, y: 940, s: 1.5 })}`,

  `${starrySky()}${craterMoon(1200, 260, 0.62)}
   ${f("amal", { x: 700, y: 940, s: 1.55, arms: "point" })}
   ${lookLine(740, 720, 1160, 300)}`,

  `${starrySky()}${telescope(1140, 940, 1.1)}
   ${f("noah", { x: 700, y: 940, s: 1.52 })}`,

  `${starrySky()}${telescope(1120, 940, 1.15)}${craterMoon(360, 250, 0.7)}
   ${f("amal", { x: 700, y: 940, s: 1.55 })}`,

  `${starrySky()}${craterMoon(820, 380, 1.5)}`,

  `${starrySky()}${ringedPlanet(880, 400, 1.15)}`,

  `${starrySky()}${telescope(1180, 940, 0.9)}${oldBoxes(380, 940, 0.72)}
   ${f("amal", { x: 780, y: 940, s: 1.55 })}`,

  `${starrySky()}${observatory(1120, 900, 1.15)}
   ${f("amal", { x: 520, y: 940, s: 1.52, arms: "point" })}`,

  `${starrySky()}${telescope(1140, 940, 1.05)}${ringedPlanet(400, 280, 0.6)}
   ${f("noah", { x: 760, y: 940, s: 1.52 })}`,

  `${starrySky()}${telescope(1160, 940, 1)}${craterMoon(380, 240, 0.66)}${ringedPlanet(760, 240, 0.5)}
   ${f("amal", { x: 620, y: 940, s: 1.55 })}`,

  `${starrySky()}${observatory(1200, 900, 0.95)}${telescope(420, 940, 0.9)}
   ${f("amal", { x: 700, y: 940, s: 1.55, arms: "up" })}
   ${f("noah", { x: 940, y: 940, s: 1.5, arms: "up" })}`,
];

// Book 4 — The Careful Cook (from the Unit 8 microwave safety talk)
const carefulCookPages = [
  `${kitchenScene()}${counterTop(1220, 950, 1)}${microwaveProp(1220, 774, 1, { lit: true })}${roomBox(520, 620, 0.76, "kitchen")}
   ${f("leo", { x: 900, y: 950, s: 1.55 })}
   ${f("mum", { x: 1400, y: 950, s: 1.48 })}`,

  `${kitchenScene()}${roomBox(520, 620, 0.76, "kitchen")}${counterTop(1220, 950, 1)}${microwaveProp(1220, 774, 1)}
   ${f("mum", { x: 900, y: 950, s: 1.5, arms: "point" })}
   ${f("leo", { x: 640, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${counterTop(1230, 950, 1)}${microwaveProp(1230, 774, 1, { open: true })}${foodTray(420, 950, 0.86, { bowls: 2 })}
   ${f("leo", { x: 760, y: 950, s: 1.55, arms: "point" })}`,

  `${kitchenScene()}${poster(560, 600, 1, { colour: G3.teal, lines: 4 })}${counterTop(1230, 950, 1)}${microwaveProp(1230, 774, 1, { open: true })}
   ${f("leo", { x: 780, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${counterTop(1230, 950, 1)}${microwaveProp(1230, 774, 1, { open: true })}${toolRack(420, 950, 0.8)}
   ${f("mum", { x: 860, y: 950, s: 1.5, arms: "point" })}`,

  `${kitchenScene()}${counterTop(1220, 950, 1)}${microwaveProp(1220, 774, 1)}${cookpot(400, 940, 1.15)}
   ${f("leo", { x: 820, y: 950, s: 1.55, arms: "point" })}`,

  `${kitchenScene()}${roomBox(520, 620, 0.74, "kitchen")}${counterTop(1220, 950, 1)}${microwaveProp(1220, 774, 1, { lit: true })}
   ${f("leo", { x: 820, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${counterTop(1230, 950, 1)}${microwaveProp(1230, 774, 1, { lit: true })}${toolRack(400, 950, 0.86)}
   ${f("leo", { x: 800, y: 950, s: 1.55, arms: "point" })}`,

  `${kitchenScene()}${poster(540, 600, 0.95, { colour: G3.coral, lines: 3 })}${counterTop(1230, 950, 1)}${microwaveProp(1230, 774, 1, { open: true, lit: true })}
   ${f("leo", { x: 800, y: 950, s: 1.55, mood: "surprised" })}`,

  `${kitchenScene()}${counterTop(1230, 950, 1)}${microwaveProp(1230, 774, 1, { open: true })}
   ${f("mum", { x: 880, y: 950, s: 1.5, arms: "point" })}
   ${f("leo", { x: 620, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${roomBox(560, 620, 0.74, "kitchen")}${foodTray(1220, 950, 1.2, { bowls: 2 })}${toolRack(400, 950, 0.8)}
   ${f("leo", { x: 780, y: 950, s: 1.55 })}`,

  `${kitchenScene()}${roomBox(540, 620, 0.78, "dining")}${foodTray(1230, 950, 1.25, { bowls: 3 })}
   ${f("leo", { x: 760, y: 950, s: 1.58, arms: "up" })}`,
];

// Book 5 — The Helper Vehicles (from the Unit 8 song)
const helperVehiclesPages = [
  `${townScene()}${helicopterProp(1180, 300, 0.86)}${ambulance(760, 926, 0.62)}${lampPost(260, 706, 0.9)}`,

  `${basicScene()}${helicopterProp(880, 320, 1.05)}${acacia(240, 900, 1.2)}
   ${f("amal", { x: 700, y: 926, s: 1.5, arms: "point" })}`,

  `${basicScene()}${helicopterProp(980, 340, 0.9)}${hut(300, 900, 0.66)}
   ${f("sarah", { x: 720, y: 926, s: 1.46, holding: heldPaper })}`,

  `${townScene()}${ambulance(880, 926, 0.78)}${cityBuildings(1400, 700, 0.6)}`,

  `${townScene()}${ambulance(900, 926, 0.72)}${crossing(320, 906, 0.8)}
   ${f("amal", { x: 520, y: 926, s: 1.52 })}
   ${f("leo", { x: 320, y: 926, s: 1.5 })}`,

  `${townScene()}${ambulance(940, 926, 0.8)}${doctorKit(340, 926, 1.15)}
   ${f("sarah", { x: 600, y: 926, s: 1.46 })}`,

  `${townScene()}${fireEngine(900, 926, 0.72)}${lampPost(280, 706, 0.88)}`,

  `${townScene()}${fireEngine(560, 926, 0.6)}${ambulance(1180, 926, 0.6)}${helicopterProp(760, 260, 0.7)}`,

  `${townScene()}${ambulance(1100, 926, 0.66)}${fireEngine(360, 926, 0.56)}
   ${f("caretaker", { x: 740, y: 926, s: 1.46 })}`,

  `${townScene()}${ambulance(1080, 926, 0.66)}${fence(300, 926, 1, 2)}
   ${f("amal", { x: 620, y: 926, s: 1.55 })}`,

  `${townScene()}${ambulance(1160, 926, 0.6)}${crossing(340, 906, 0.78)}
   ${f("leo", { x: 700, y: 926, s: 1.52, arms: "point" })}
   ${f("amal", { x: 480, y: 926, s: 1.55 })}`,

  `${townScene()}${helicopterProp(1160, 280, 0.8)}${ambulance(500, 926, 0.6)}${fireEngine(1080, 926, 0.5)}
   ${f("amal", { x: 800, y: 926, s: 1.55, arms: "up" })}`,
];

// ================================================================ Unit 9
// Places, People, and Plans

// Book 2 — A Trip to the Capital (from the Unit 9 recount)
const capitalTripPages = [
  `${stationScene()}${passengerTrain(1580, 672, 1.02)}
   ${f("amal", { x: 520, y: 950, s: 1.55, holding: heldPaper })}
   ${f("mum", { x: 760, y: 950, s: 1.48 })}`,

  `${homeScene()}${roomBox(1270, 640, 1.05, "bedroom")}
   ${f("amal", { x: 700, y: 950, s: 1.58, arms: "up" })}`,

  `${stationScene()}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}
   ${f("mum", { x: 950, y: 950, s: 1.48 })}
   ${f("idris", { x: 1160, y: 950, s: 1.38 })}`,

  `${stationScene()}${marketStall(1300, 950, 0.72)}
   ${f("amal", { x: 620, y: 950, s: 1.55, arms: "point" })}
   ${f("salma", { x: 900, y: 950, s: 1.46 })}`,

  `${stationScene()}${passengerTrain(1580, 672, 1.06)}
   ${f("amal", { x: 460, y: 950, s: 1.55 })}
   ${f("idris", { x: 660, y: 950, s: 1.38 })}`,

  `${basicScene()}${passengerTrain(1500, 900, 0.94)}${farmField(400, 880, 0.66)}${cityBuildings(880, 700, 0.5)}`,

  `${capitalScene()}${museum(1180, 900, 0.66)}${signpost(360, 900, 0.68)}
   ${f("amal", { x: 720, y: 920, s: 1.55, arms: "point" })}`,

  `${plainRoomScene({ wall: "#e6dfd0" })}${mapProp(1240, 640, 1.3)}${oldBoxes(360, 950, 0.7)}
   ${f("uncle", { x: 980, y: 950, s: 1.48, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}`,

  `${capitalScene()}${shoppingCentre(1200, 900, 0.6)}${liftProp(380, 900, 0.62)}
   ${f("amal", { x: 760, y: 920, s: 1.55, arms: "up" })}`,

  `${capitalScene()}${trafficRow(800, 880, 0.9)}
   ${f("amal", { x: 500, y: 920, s: 1.52 })}
   ${f("mum", { x: 700, y: 920, s: 1.46 })}`,

  `${capitalScene()}${foodTray(1180, 920, 1.2, { bowls: 3 })}${marketStall(340, 900, 0.66)}
   ${f("amal", { x: 700, y: 920, s: 1.55 })}
   ${f("idris", { x: 900, y: 920, s: 1.38 })}`,

  `${sunsetScene()}${passengerTrain(1540, 930, 0.86)}${lampPost(320, 940, 0.9, { lit: true })}
   ${f("amal", { x: 700, y: 940, s: 1.55 })}`,
];

// Book 3 — Living Near the Equator (from the Unit 9 information text)
const equatorPages = [
  `${basicScene()}${globeProp(1240, 926, 1.5)}${acacia(240, 880, 1.3)}
   ${f("amal", { x: 720, y: 926, s: 1.55, arms: "point" })}`,

  `${classroomScene()}${globeProp(1300, 950, 1.35)}
   ${f("yasmin", { x: 980, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.55 })}`,

  `${basicScene()}${sun(1330, 150)}${tallGrass(300, 940, 1.15)}${waterBottle(1180, 926, 1.3)}
   ${f("amal", { x: 700, y: 926, s: 1.55 })}`,

  `${fieldScene()}${farmField(1020, 900, 0.86)}${seedRow(360, 930, 1.05)}
   ${f("labourer", { x: 680, y: 926, s: 1.46 })}`,

  `${townScene()}${crossing(1180, 906, 0.86)}${lampPost(300, 706, 0.88)}
   ${f("amal", { x: 620, y: 926, s: 1.52 })}
   ${f("idris", { x: 840, y: 926, s: 1.38 })}`,

  `${townScene()}${cityBuildings(1260, 700, 0.72)}${trafficRow(700, 900, 0.86)}
   ${f("labourer", { x: 420, y: 926, s: 1.46 })}`,

  `${fieldScene()}${barn(1220, 880, 0.86)}${goat({ x: 980, y: 820, s: 0.66 })}${hen({ x: 400, y: 890, s: 0.6 })}
   ${f("hana", { x: 700, y: 926, s: 1.46 })}`,

  `${coastScene()}${ferryBoat(1200, 640, 1)}${passengerTrain(700, 900, 0.74)}`,

  `${basicScene()}${factory(1080, 900, 0.8)}${lorry(460, 926, 0.74)}`,

  `${townScene()}${lorry(1100, 926, 0.82)}${marketStall(340, 900, 0.72)}
   ${f("omar", { x: 660, y: 926, s: 1.46 })}`,

  `${townScene()}${shoppingCentre(1200, 900, 0.62)}${museum(360, 900, 0.5)}
   ${f("nora", { x: 720, y: 926, s: 1.5 })}
   ${f("leo", { x: 920, y: 926, s: 1.5 })}`,

  `${sunsetScene()}${farmField(1080, 900, 0.72)}${acacia(300, 880, 1.25)}
   ${f("amal", { x: 700, y: 940, s: 1.55, arms: "up" })}`,
];

// Book 4 — Making a Plan (from the Unit 9 listening script)
const makingPlanPages = [
  `${classroomScene()}${mapProp(1250, 650, 1.3)}${desk(340, 950, 1, { item: heldNotebook })}
   ${f("nora", { x: 700, y: 950, s: 1.55, holding: heldNotebook })}
   ${f("leo", { x: 960, y: 950, s: 1.52 })}`,

  `${yardScene()}${bench(1240, 940, 1.2)}
   ${f("nora", { x: 660, y: 926, s: 1.55, arms: "point" })}
   ${f("leo", { x: 900, y: 926, s: 1.52 })}`,

  `${yardScene()}${bench(1260, 940, 1.15)}
   ${f("leo", { x: 700, y: 926, s: 1.55, arms: "up" })}`,

  `${classroomScene()}${mapProp(1250, 650, 1.2)}
   ${f("leo", { x: 700, y: 950, s: 1.55, arms: "point" })}
   ${f("nora", { x: 960, y: 950, s: 1.52 })}`,

  `${classroomScene()}${desk(1300, 950, 1.05, { item: heldNotebook })}
   ${f("nora", { x: 720, y: 950, s: 1.55, holding: heldNotebook })}`,

  `${classroomScene()}${thoughtBubble(1220, 520, 1.2, foodTray(0, 20, 0.4, { bowls: 2 }))}
   ${f("leo", { x: 700, y: 950, s: 1.55 })}`,

  `${townScene()}${townBus(1140, 926, 0.66)}${passengerTrain(560, 900, 0.62)}
   ${f("nora", { x: 760, y: 926, s: 1.52, arms: "point" })}`,

  `${stationScene()}${passengerTrain(1580, 672, 1)}
   ${f("leo", { x: 620, y: 950, s: 1.55, arms: "point" })}
   ${f("nora", { x: 860, y: 950, s: 1.52 })}`,

  `${stationScene()}
   ${f("nora", { x: 700, y: 950, s: 1.55 })}
   ${f("leo", { x: 940, y: 950, s: 1.52, arms: "up" })}`,

  `${classroomScene()}${mapProp(1240, 650, 1.35)}
   ${f("leo", { x: 700, y: 950, s: 1.55, arms: "point" })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldNotebook })}
   ${f("nora", { x: 720, y: 950, s: 1.56, holding: heldNotebook })}`,

  `${yardScene()}${bench(1240, 940, 1.2)}${confetti(760, 540)}
   ${f("leo", { x: 660, y: 926, s: 1.55, arms: "up" })}
   ${f("nora", { x: 900, y: 926, s: 1.52, arms: "up" })}`,
];

// Book 5 — Directions at the Mall (from the Unit 9 listening script)
const mallDirectionsPages = [
  `${mallScene()}${liftProp(1180, 940, 0.86)}${fountainProp(420, 950, 0.86)}
   ${f("amal", { x: 780, y: 940, s: 1.55, holding: heldPaper })}
   ${f("noah", { x: 1000, y: 940, s: 1.5 })}`,

  `${mallScene()}${fountainProp(1200, 950, 1)}
   ${f("amal", { x: 700, y: 940, s: 1.55 })}
   ${f("noah", { x: 940, y: 940, s: 1.5 })}`,

  `${mallScene()}${liftProp(1200, 940, 0.94, { floor: 2 })}
   ${f("amal", { x: 720, y: 940, s: 1.55, arms: "point" })}`,

  `${mallScene()}${fountainProp(1180, 950, 1.05)}
   ${f("noah", { x: 700, y: 940, s: 1.52, arms: "point" })}`,

  `${mallScene()}${liftProp(1180, 940, 0.94, { open: true, floor: 2 })}
   ${f("amal", { x: 740, y: 940, s: 1.55 })}
   ${f("noah", { x: 960, y: 940, s: 1.5 })}`,

  `${mallScene()}${tabletProp(1220, 940, 1.3)}
   ${f("noah", { x: 700, y: 940, s: 1.52, arms: "point" })}`,

  `${mallScene()}${bookShelf(1220, 940, 1.05)}${bookShelf(1440, 940, 0.9)}
   ${f("amal", { x: 720, y: 940, s: 1.55, arms: "up" })}`,

  `${mallScene()}${foodTray(1200, 940, 1.2, { bowls: 3 })}
   ${f("noah", { x: 720, y: 940, s: 1.52 })}
   ${f("amal", { x: 960, y: 940, s: 1.55 })}`,

  `${mallScene()}${liftProp(1220, 940, 0.86, { floor: 1 })}${playBall(420, 940, 1.15)}
   ${f("mina", { x: 760, y: 940, s: 1.4, arms: "up" })}`,

  `${mallScene()}${fountainProp(1180, 950, 1)}
   ${f("amal", { x: 700, y: 940, s: 1.55 })}
   ${f("noah", { x: 940, y: 940, s: 1.5, mood: "surprised" })}`,

  `${mallScene()}${liftProp(1240, 940, 0.8)}
   ${f("caretaker", { x: 980, y: 940, s: 1.46, arms: "point" })}
   ${f("amal", { x: 700, y: 940, s: 1.55 })}`,

  `${mallScene()}${fountainProp(1160, 950, 0.94)}${bookShelf(400, 940, 0.86)}
   ${f("amal", { x: 720, y: 940, s: 1.55, holding: heldBook })}
   ${f("noah", { x: 960, y: 940, s: 1.5, holding: heldBook })}`,
];

// ================================================================ Unit 10
// My English Voice (capstone)

// Book 2 — Amal's English Voice (from the Unit 10 story)
const englishVoicePages = [
  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldPaper })}
   ${f("amal", { x: 700, y: 950, s: 1.6, holding: heldPaper })}
   ${f("yasmin", { x: 1020, y: 950, s: 1.5 })}`,

  `${classroomScene()}${desk(1310, 950, 1.05, { item: heldPaper })}${desk(300, 950, 1, { item: heldPaper })}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.56 })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5, arms: "point" })}
   ${f("nora", { x: 700, y: 950, s: 1.52 })}
   ${f("amal", { x: 460, y: 950, s: 1.56, holding: heldPaper })}`,

  `${plainRoomScene()}${letterProp(1240, 620, 1.5, { open: true })}${desk(360, 950, 1, { item: heldPaper })}
   ${f("amal", { x: 780, y: 950, s: 1.58, holding: heldPaper })}`,

  `${plainRoomScene()}${easel(1240, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.sky, lines: 5 }) })}
   ${f("amal", { x: 700, y: 950, s: 1.58 })}`,

  `${plainRoomScene()}${poster(1240, 640, 1.25, { colour: G3.leafy, lines: 6 })}
   ${f("nora", { x: 960, y: 950, s: 1.52, arms: "up" })}
   ${f("amal", { x: 700, y: 950, s: 1.56, holding: heldPaper })}`,

  `${plainRoomScene()}${mapProp(1250, 640, 1.25)}${paradeBanner(360, 950, 0.5)}
   ${f("amal", { x: 780, y: 950, s: 1.58, holding: heldPaper })}`,

  `${plainRoomScene()}${telescope(1240, 950, 0.86)}${oldBoxes(380, 950, 0.66)}
   ${f("amal", { x: 780, y: 950, s: 1.58, holding: heldPaper })}`,

  `${homeScene()}${desk(1250, 950, 1.1, { item: heldPaper })}
   ${f("adam", { x: 980, y: 950, s: 1.52, arms: "point" })}
   ${f("amal", { x: 700, y: 950, s: 1.58, mood: "sad", holding: heldPaper })}`,

  `${homeScene()}${desk(1250, 950, 1.1, { item: heldPaper })}${bookShelf(300, 950, 0.78)}
   ${f("amal", { x: 780, y: 950, s: 1.6, holding: heldPaper })}`,

  `${homeScene()}${roomBox(1280, 640, 1.05, "dining")}${foodTray(400, 950, 0.86, { bowls: 3 })}
   ${f("amal", { x: 700, y: 950, s: 1.58, holding: heldPaper })}
   ${f("hana", { x: 960, y: 950, s: 1.48 })}
   ${f("idris", { x: 1160, y: 950, s: 1.38 })}`,

  `${plainRoomScene()}${bunting(800, 160, 1.25, { span: 1250 })}${easel(1240, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.gold, lines: 5 }) })}
   ${f("amal", { x: 700, y: 950, s: 1.62, holding: heldPaper })}`,
];

// Book 3 — Four Parts and a Friday (from the Unit 10 project brief)
const projectBriefPages = [
  `${classroomScene({ boardText: "lines" })}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.teal, lines: 5 }) })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.56 })}`,

  `${classroomScene()}
   ${f("yasmin", { x: 1000, y: 950, s: 1.5, arms: "point" })}
   ${f("maya", { x: 700, y: 950, s: 1.52 })}
   ${f("sami", { x: 460, y: 950, s: 1.52 })}`,

  `${plainRoomScene()}${desk(1240, 950, 1.15, { item: heldPaper })}${desk(400, 950, 1.05, { item: heldPaper })}
   ${f("amal", { x: 800, y: 950, s: 1.58, holding: heldPaper })}`,

  `${plainRoomScene()}${poster(1240, 640, 1.3, { colour: G3.plum, lines: 6 })}
   ${f("nora", { x: 720, y: 950, s: 1.55, holding: heldPaper })}`,

  `${plainRoomScene()}${easel(1220, 950, 1.35, { inner: poster(0, 0, 0.54, { colour: G3.coral, lines: 6 }) })}
   ${f("leo", { x: 700, y: 950, s: 1.55, arms: "point" })}`,

  `${plainRoomScene()}${easel(1240, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.sky, lines: 5 }) })}${desk(380, 950, 1, { item: heldPaper })}
   ${f("maya", { x: 760, y: 950, s: 1.55, holding: heldPaper })}`,

  `${plainRoomScene()}${chairRows(1200, 950, 0.66, { rows: 2, seats: 3 })}
   ${f("sami", { x: 660, y: 950, s: 1.55, arms: "up" })}`,

  `${plainRoomScene()}${chairRows(1220, 950, 0.7, { rows: 2, seats: 3 })}
   ${f("amal", { x: 680, y: 950, s: 1.56, arms: "point" })}`,

  `${classroomScene()}${desk(1300, 950, 1.1, { item: heldPaper })}
   ${f("nora", { x: 700, y: 950, s: 1.55, holding: heldPaper })}
   ${f("yasmin", { x: 1010, y: 950, s: 1.5 })}`,

  `${classroomScene()}${poster(1250, 650, 1.2, { colour: G3.gold, lines: 6 })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5, arms: "point" })}
   ${f("leo", { x: 700, y: 950, s: 1.52 })}`,

  `${hallScene()}${chairRows(820, 950, 1, { rows: 3, seats: 6 })}${bunting(800, 150, 1.2, { span: 1200 })}`,

  `${classroomScene()}${easel(1250, 950, 1.3, { inner: poster(0, 0, 0.52, { colour: G3.cream, lines: 6 }) })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 660, y: 950, s: 1.56, holding: heldPaper })}`,
];

// Book 4 — Planning the Exhibition (from the Unit 10 dialogue)
const planningPages = [
  `${hallScene()}${metreStick(1180, 700, 1.1)}${chairRows(420, 950, 0.68, { rows: 2, seats: 3 })}
   ${f("yasmin", { x: 900, y: 950, s: 1.5, arms: "point" })}
   ${f("leo", { x: 660, y: 950, s: 1.52 })}`,

  `${hallScene()}${chairRows(1180, 950, 0.72, { rows: 2, seats: 3 })}
   ${f("yasmin", { x: 700, y: 950, s: 1.5, arms: "up" })}`,

  `${hallScene()}${easel(1240, 950, 1.2, { inner: poster(0, 0, 0.48, { colour: G3.teal }) })}
   ${f("nora", { x: 700, y: 950, s: 1.52, arms: "point" })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5 })}`,

  `${hallScene()}${easel(1180, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.coral }) })}${easel(1420, 950, 1.05, { inner: poster(0, 0, 0.42, { colour: G3.plum }) })}
   ${f("yasmin", { x: 700, y: 950, s: 1.5, arms: "point" })}`,

  `${hallScene()}${metreStick(1200, 700, 1.25)}
   ${f("leo", { x: 700, y: 950, s: 1.55, arms: "up" })}`,

  `${hallScene()}${easel(1160, 950, 1.1, { inner: poster(0, 0, 0.44, { colour: G3.gold }) })}${easel(1400, 950, 1.02, { inner: poster(0, 0, 0.4, { colour: G3.sky }) })}
   ${f("maya", { x: 700, y: 950, s: 1.52, arms: "point" })}
   ${f("nora", { x: 940, y: 950, s: 1.52 })}`,

  `${hallScene()}${easel(1240, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.leafy }) })}
   ${f("sami", { x: 660, y: 950, s: 1.52, arms: "point" })}
   ${f("elena", { x: 940, y: 950, s: 1.48 })}`,

  `${hallScene()}${easel(1180, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.teal }) })}${helmetProp(400, 950, 1.15)}
   ${f("elena", { x: 780, y: 950, s: 1.5, arms: "point" })}`,

  `${hallScene()}${letterProp(1240, 700, 1.5)}${chairRows(400, 950, 0.62, { rows: 2, seats: 3 })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5, arms: "point" })}
   ${f("maya", { x: 700, y: 950, s: 1.52, holding: heldPaper })}`,

  `${hallScene()}${chairRows(1200, 950, 0.7, { rows: 2, seats: 3 })}
   ${f("leo", { x: 700, y: 950, s: 1.52, mood: "sad" })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5 })}`,

  `${hallScene()}${desk(1260, 950, 1.1, { item: heldPaper })}
   ${f("yasmin", { x: 940, y: 950, s: 1.5 })}
   ${f("nora", { x: 700, y: 950, s: 1.52 })}`,

  `${hallScene()}${broomProp(1220, 950, 1.05)}${chairRows(420, 950, 0.62, { rows: 2, seats: 3 })}
   ${f("caretaker", { x: 980, y: 950, s: 1.48 })}
   ${f("maya", { x: 720, y: 950, s: 1.52, arms: "up" })}`,
];

// Book 5 — Exhibition Evening (from the Unit 10 dialogue)
const exhibitionEveningPages = [
  `${hallScene()}${bunting(800, 150, 1.25, { span: 1280 })}${chairRows(500, 950, 0.72, { rows: 2, seats: 3 })}${easel(1300, 950, 1.2, { inner: poster(0, 0, 0.48, { colour: G3.gold }) })}
   ${f("amal", { x: 980, y: 950, s: 1.58, holding: heldPaper })}`,

  `${hallScene()}${bunting(800, 150, 1.2, { span: 1200 })}${chairRows(760, 950, 0.9, { rows: 3, seats: 5 })}
   ${f("yasmin", { x: 1420, y: 950, s: 1.5, arms: "up" })}`,

  `${hallScene()}${easel(1240, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.teal }) })}${easel(1460, 950, 1.05, { inner: poster(0, 0, 0.42, { colour: G3.coral }) })}
   ${f("adam", { x: 700, y: 950, s: 1.52, arms: "up" })}
   ${f("yasmin", { x: 960, y: 950, s: 1.5 })}`,

  `${hallScene()}${chairRows(680, 950, 0.82, { rows: 2, seats: 4 })}
   ${f("yasmin", { x: 1220, y: 950, s: 1.5, arms: "point" })}
   ${f("amal", { x: 1440, y: 950, s: 1.54, holding: heldPaper })}`,

  `${hallScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.gold, lines: 5 }) })}${chairRows(420, 950, 0.66, { rows: 2, seats: 3 })}
   ${f("amal", { x: 900, y: 950, s: 1.58, arms: "point" })}`,

  `${hallScene()}${easel(1280, 950, 1.2, { inner: poster(0, 0, 0.48, { colour: G3.gold }) })}
   ${f("hana", { x: 620, y: 950, s: 1.48, arms: "up" })}
   ${f("amal", { x: 940, y: 950, s: 1.56, holding: heldPaper })}`,

  `${hallScene()}${easel(1280, 950, 1.2, { inner: poster(0, 0, 0.48, { colour: G3.sky }) })}
   ${f("sarah", { x: 620, y: 950, s: 1.48, arms: "up" })}
   ${f("amal", { x: 940, y: 950, s: 1.56 })}`,

  `${hallScene()}${easel(1300, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.leafy }) })}${letterProp(400, 700, 1.4)}
   ${f("omar", { x: 660, y: 950, s: 1.48, arms: "up" })}
   ${f("amal", { x: 960, y: 950, s: 1.56 })}`,

  `${hallScene()}${easel(1300, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.teal }) })}${helmetProp(400, 950, 1.1)}
   ${f("elena", { x: 660, y: 950, s: 1.48, arms: "up" })}
   ${f("amal", { x: 960, y: 950, s: 1.56 })}`,

  `${hallScene()}${easel(1300, 950, 1.15, { inner: poster(0, 0, 0.46, { colour: G3.plum }) })}
   ${f("idris", { x: 660, y: 950, s: 1.4, arms: "up" })}
   ${f("amal", { x: 940, y: 950, s: 1.56 })}`,

  `${hallScene()}${chairRows(760, 950, 0.9, { rows: 3, seats: 5 })}${confetti(800, 470)}
   ${f("amal", { x: 1360, y: 950, s: 1.58, arms: "up" })}`,

  `${hallScene()}${easel(1260, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.sky, lines: 5 }) })}${chairRows(420, 950, 0.66, { rows: 2, seats: 3 })}
   ${f("nora", { x: 920, y: 950, s: 1.56, holding: heldPaper })}
   ${f("yasmin", { x: 1500, y: 950, s: 1.48 })}`,
];

// Three question marks in a thought bubble: the anxious page of Unit 7, where
// what Amal is thinking is not a thing but a worry.
function questionMarks() {
  return `<g transform="translate(0 30)">
    ${[-70, 0, 70].map((qx, i) => `<text x="${qx}" y="${i === 1 ? -14 : 0}" text-anchor="middle" font-family="Georgia, serif" font-size="${74 - Math.abs(i - 1) * 12}" fill="${G3.coralDark}">?</text>`).join("")}
  </g>`;
}

// A small circle of coloured wedges, for a thought bubble: the plan Amal has in
// her head before the class builds it.
function circularNewsIcon() {
  return `<g transform="scale(0.16) translate(0 390)">${circularNews(0, 0, 1)}</g>`;
}

// A goat's head, for the thought bubble on the page where Adam hears her.
function goatIcon() {
  return `<g transform="translate(0 26) scale(0.5)">${goat({ x: 0, y: 0, s: 0.34 })}</g>`;
}

// A market bakery: the shop front, the street, and a lamp.
function bakeryScene() {
  return `${townScene()}${bakeryFront(1180, 900, 0.86)}${lampPost(300, 706, 0.86)}`;
}

// A sailing boat on the coast scene's water, drawn small on the horizon.
function sailboatSafe() {
  return `<g transform="translate(1240 600) scale(0.8)">
    <path d="M -70 0 q 70 30 140 0 l -14 26 q -56 18 -112 0 z" fill="#b06a4a" stroke="${C.ink}" stroke-width="4"/>
    <path d="M 0 -2 v -120" stroke="${C.ink}" stroke-width="6"/>
    <path d="M 6 -116 q 60 56 44 106 l -44 0 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// ---------------------------------------------------------------- write files

const books = {
  // Unit 1
  "steady-day": { dir: "amals-steady-day", pages: steadyDayPages },
  "interview": { dir: "may-i-interview-you", pages: interviewPages },
  "contest": { dir: "the-writing-contest", pages: contestPages },
  "two-languages": { dir: "two-languages-at-the-counter", pages: twoLanguagesPages },
  // Unit 2
  "weather-world": { dir: "weather-around-the-world", pages: weatherWorldPages },
  "foggy": { dir: "the-foggy-morning", pages: foggyMorningPages },
  "weather-report": { dir: "the-weather-report", pages: weatherReportPages },
  "fair-poster": { dir: "the-science-fair-poster", pages: fairPosterPages },
  // Unit 3
  "bitter-lunch": { dir: "the-bitter-lunch", pages: bitterLunchPages },
  "wall-poster": { dir: "the-poster-on-the-wall", pages: wallPosterPages },
  "clinic": { dir: "at-the-clinic", pages: clinicPages },
  "market-song": { dir: "the-market-song", pages: marketSongPages },
  // Unit 4
  "reporter": { dir: "maya-the-young-reporter", pages: reporterPages },
  "town-meeting": { dir: "the-town-meeting", pages: townMeetingPages },
  "circular-plan": { dir: "the-circular-plan", pages: circularPlanPages },
  "sami-story": { dir: "samis-first-story", pages: samiStoryPages },
  // Unit 5
  "race": { dir: "the-race-at-the-village-field", pages: racePages },
  "animal-move": { dir: "how-animals-move", pages: animalMovePages },
  "lost-goat": { dir: "the-lost-goat", pages: lostGoatPages },
  "simba-posters": { dir: "the-posters-for-simba", pages: simbaPostersPages },
  // Unit 6
  "town-people": { dir: "the-people-of-our-town", pages: townPeoplePages },
  "two-neighbours": { dir: "two-neighbours", pages: twoNeighboursPages },
  "elena-bridge": { dir: "elenas-bridge", pages: elenaBridgePages },
  "caretaker": { dir: "the-caretakers-keys", pages: caretakerPages },
  // Unit 7
  "before-test": { dir: "the-day-before-the-test", pages: beforeTestPages },
  "family-origin": { dir: "where-my-family-comes-from", pages: familyOriginPages },
  "ready-for-play": { dir: "getting-ready-for-the-play", pages: readyForPlayPages },
  "cultural-fair": { dir: "the-cultural-fair", pages: culturalFairPages },
  // Unit 8
  "right-tool": { dir: "the-right-tool-for-the-job", pages: rightToolPages },
  "stars": { dir: "a-look-at-the-stars", pages: starsPages },
  "careful-cook": { dir: "the-careful-cook", pages: carefulCookPages },
  "helper-vehicles": { dir: "the-helper-vehicles", pages: helperVehiclesPages },
  // Unit 9
  "capital-trip": { dir: "a-trip-to-the-capital", pages: capitalTripPages },
  "equator": { dir: "living-near-the-equator", pages: equatorPages },
  "making-plan": { dir: "making-a-plan", pages: makingPlanPages },
  "mall-directions": { dir: "directions-at-the-mall", pages: mallDirectionsPages },
  // Unit 10
  "english-voice": { dir: "amals-english-voice", pages: englishVoicePages },
  "project-brief": { dir: "four-parts-and-a-friday", pages: projectBriefPages },
  "planning": { dir: "planning-the-exhibition", pages: planningPages },
  "exhibition-evening": { dir: "exhibition-evening", pages: exhibitionEveningPages },
};

writeBooks(books, process.argv[2]);
