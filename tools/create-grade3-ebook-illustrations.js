#!/usr/bin/env node

// Generates the vector illustrations for the Grade 3 picture-book series —
// one book per unit, the same shape Grades 1 and 2 use:
//   1  The Family Who Helps              Unit 1  All About Me and My Family
//   2  The Spelling Contest              Unit 2  School and Learning
//   3  The Calendar on the Wall          Unit 3  Time and Daily Life
//   4  The Places That Help Us           Unit 4  Places and Community
//   5  The Wall Behind the Garden        Unit 5  Actions and Activities
//   6  The Girl Who Carried Kindness     Unit 6  Describing People and Things
//   7  From Coast to Forest              Unit 7  Nature and the Environment
//   8  The Mystery of the Million Shells Unit 8  Numbers, Shapes, Measurement
//   9  The Box of Ideas                  Unit 9  Thinking, Feelings, Imagination
//   10 Nine Doors                        Unit 10 Capstone
//
// The cast is the COURSE'S OWN — Amal, Nora, Teacher Yasmin, Omar and Amal's
// family — not a new invention, because those characters already run through all
// ten units of the Grade 3 readings. Several books also borrow their unit's own
// story device on purpose: the spelling contest, the calendar on the wall, the
// wall behind the garden, the two roads to school, the coast-forest-mountain
// trip, the million shells, the Box of Ideas, the Showcase. A learner should
// recognise the book from the lesson.
//
// SCALE PASS APPLIED (figures x1.25 after the first render read small).
// Usage: node tools/create-grade3-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, basicScene, sky, sun, hills, ground, acacia, tallGrass, nightScene,
  bench, mango, marketStall, seedRow, wildBird, chick, hen, goat, lulu,
  dustPuffs, confetti, sunnyPatch, lampPost, cityBuildings, kite,
  G2, roomScene, roomBox, streetScene, gardenScene, sunsetScene, daylightScene,
  bookShelf, openBook, calendarBoard, greetingCard, tabletProp, house, hut, flatBlock,
  libraryBuilding, shoppingCentre, townBus, crossing, clinicFront, mapProp, notepad,
  rulerProp, metreStick, shapeTile, tensLine, balanceScale, plantStage, wateringCan,
  litterBits, recycleBin, sapling, gardenPlant, butterflyBug, beeBug, cloudPuff, lowSun,
  bunting, easel, lookLine, motionArcs, seaTurtle, ferryBoat,
  G3, figure, heldBook, heldPaper, heldShell,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  gardenWall, boxOfIdeas, desk, globeProp, shells, hospital, monthWall, poster,
} = require("./lib/ehel-ebook-kit-grade3.js");

// ---------------------------------------------------------------- local scenes

// Amal's home: the sitting room the family eats in.
const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });

// The schoolyard, outside the classroom.
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;

// Nine numbered doors in a row — the capstone's own image for the nine units.
const DOOR_COLOURS = ["#e8705c", "#2f8f86", "#f0b429", "#8f6bb5", "#6f9a4a"];
function nineDoors(x, y, s = 1) {
  const door = (i) => {
    const dx = -600 + (i % 5) * 300;
    const dy = i < 5 ? -110 : 130;
    return `<g transform="translate(${dx} ${dy})">
      <rect x="-70" y="-104" width="140" height="208" rx="9" fill="${DOOR_COLOURS[i % DOOR_COLOURS.length]}" stroke="${C.ink}" stroke-width="5.5"/>
      <rect x="-52" y="-84" width="104" height="80" rx="6" fill="${G3.cream}" opacity="0.55"/>
      <circle cx="46" cy="14" r="9" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3"/>
      <text x="0" y="72" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="${G3.cream}">${i + 1}</text>
    </g>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(door).join("")}</g>`;
}

// ================================================================ Book 1
// The Family Who Helps — Unit 1: All About Me and My Family

const familyPages = [
  // 1 cover: the whole family at home
  `${homeScene()}${roomBox(1290, 640, 1.101, "dining")}
   ${figure("hana", { x: 250, y: 950, s: 1.5 })}
   ${figure("dad", { x: 470, y: 950, s: 1.5 })}
   ${figure("mum", { x: 660, y: 950, s: 1.5 })}
   ${figure("adam", { x: 840, y: 950, s: 1.45 })}
   ${figure("amal", { x: 1000, y: 950, s: 1.5, arms: "up" })}
   ${figure("idris", { x: 1140, y: 950, s: 1.35 })}
   ${figure("mina", { x: 1260, y: 952, s: 1.175 })}`,

  // 2 Amal introduces herself and the house
  `${townScene()}${house(1120, 900, 0.86)}${gardenPlant(1420, 900, 0.9)}
   ${figure("amal", { x: 470, y: 900, s: 1.875, arms: "up" })}`,

  // 3 the three of them: Adam, Idris, Mina
  `${homeScene()}
   ${figure("adam", { x: 470, y: 950, s: 1.6 })}
   ${figure("idris", { x: 760, y: 950, s: 1.4 })}
   ${figure("mina", { x: 1010, y: 952, s: 1.2 })}
   ${figure("amal", { x: 1290, y: 950, s: 1.575, arms: "point" })}`,

  // 4 Grandma Hana's stories at night
  `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
   <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>
   ${figure("hana", { x: 520, y: 950, s: 1.7, holding: heldBook })}
   ${figure("mina", { x: 830, y: 952, s: 1.225 })}
   ${figure("idris", { x: 990, y: 950, s: 1.375 })}
   ${figure("amal", { x: 1180, y: 950, s: 1.55 })}`,

  // 5 dinner together, one good thing each
  `${homeScene()}${roomBox(400, 640, 1.28, "dining")}
   ${figure("dad", { x: 900, y: 950, s: 1.575, arms: "point" })}
   ${figure("amal", { x: 1120, y: 950, s: 1.525, arms: "up" })}
   ${figure("mum", { x: 1330, y: 950, s: 1.55 })}`,

  // 6 duties: a tidy room, and Adam helping Idris read
  `${homeScene({})}${roomBox(400, 640, 1.254, "bedroom")}
   ${figure("amal", { x: 760, y: 950, s: 1.55 })}
   ${figure("adam", { x: 1080, y: 950, s: 1.55, holding: heldBook })}
   ${figure("idris", { x: 1290, y: 950, s: 1.375 })}`,

  // 7 even Mina has a job
  `${homeScene()}${roomBox(1240, 640, 1.203, "living")}
   ${figure("mum", { x: 470, y: 950, s: 1.575, arms: "point" })}
   ${figure("mina", { x: 760, y: 952, s: 1.275, arms: "up" })}`,

  // 8 respect at school: listening
  `${classroomScene()}${desk(400, 950, 1.3)}
   ${figure("yasmin", { x: 1130, y: 950, s: 1.55, arms: "point" })}
   ${figure("amal", { x: 640, y: 950, s: 1.525 })}
   ${figure("nora", { x: 830, y: 950, s: 1.5 })}`,

  // 9 public and private
  `${yardScene()}${house(300, 900, 0.62)}
   ${figure("amal", { x: 780, y: 900, s: 1.625 })}
   ${figure("nora", { x: 980, y: 900, s: 1.575 })}
   ${lookLine(400, 800, 700, 780)}`,

  // 10 walking the junior students to their classrooms
  `${yardScene()}${bench(1240, 940, 1.4)}
   ${figure("amal", { x: 520, y: 900, s: 1.625, arms: "point" })}
   ${figure("mina", { x: 720, y: 902, s: 1.2 })}
   ${figure("nora", { x: 900, y: 900, s: 1.575 })}`,

  // 11 Teacher Yasmin on what good listening means
  `${classroomScene()}
   ${figure("yasmin", { x: 480, y: 950, s: 1.625, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.55, holding: heldPaper })}
   ${figure("nora", { x: 1110, y: 950, s: 1.5 })}`,

  // 12 a big warm family
  `${sunsetScene()}${house(1180, 930, 0.78)}
   ${figure("amal", { x: 420, y: 930, s: 1.675, arms: "up" })}
   ${figure("mina", { x: 620, y: 932, s: 1.225 })}
   ${figure("mum", { x: 800, y: 930, s: 1.55 })}`,
];

// ================================================================ Book 2
// The Spelling Contest — Unit 2: School and Learning

const contestPages = [
  // 1 cover: the class, the board, the word list
  `${classroomScene({ boardText: "lines" })}${desk(340, 950, 1.3)}
   ${bunting(800, 150, 1.1, { span: 1000 })}
   ${figure("yasmin", { x: 1180, y: 950, s: 1.575, arms: "point" })}
   ${figure("amal", { x: 640, y: 950, s: 1.625, holding: heldPaper })}
   ${figure("nora", { x: 860, y: 950, s: 1.575, arms: "up" })}`,

  // 2 the practice list on Monday
  `${classroomScene()}
   ${figure("yasmin", { x: 470, y: 950, s: 1.625, holding: heldPaper })}
   ${figure("amal", { x: 880, y: 950, s: 1.55, arms: "up" })}
   ${figure("nora", { x: 1090, y: 950, s: 1.525 })}`,

  // 3 thirty words, some not easy at all
  `${classroomScene()}${poster(1230, 700, 1, { colour: G3.plum, lines: 6 })}
   ${figure("amal", { x: 560, y: 950, s: 1.75, mood: "surprised" })}
   ${lookLine(660, 800, 1120, 720)}`,

  // 4 Nora studies at the library, Amal at home
  `${townScene()}${libraryBuilding(1160, 880, 0.86)}
   ${figure("nora", { x: 700, y: 900, s: 1.625, holding: heldBook })}
   ${figure("amal", { x: 380, y: 900, s: 1.625, holding: heldBook })}`,

  // 5 Idris lends his eraser
  `${classroomScene()}${desk(1180, 950, 1.3, { item: heldPaper })}
   ${figure("amal", { x: 560, y: 950, s: 1.6, mood: "sad" })}
   ${figure("idris", { x: 810, y: 950, s: 1.4, arms: "point" })}`,

  // 6 the short report, read to the class
  `${classroomScene()}${desk(340, 950, 0.95)}
   ${figure("amal", { x: 780, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("yasmin", { x: 1230, y: 950, s: 1.55 })}
   ${figure("nora", { x: 1030, y: 950, s: 1.5 })}`,

  // 7 a rule, and its exceptions
  `${classroomScene({ boardText: "lines" })}
   ${figure("yasmin", { x: 900, y: 950, s: 1.65, arms: "point" })}
   ${figure("amal", { x: 560, y: 950, s: 1.525, holding: heldPaper })}
   ${lookLine(700, 800, 430, 500)}`,

  // 8 three words wrong, and wanting to give up
  `${classroomScene()}${desk(1160, 950, 1.3)}
   ${figure("amal", { x: 640, y: 950, s: 1.775, mood: "sad" })}`,

  // 9 Grandma Hana's advice
  `${homeScene()}
   ${figure("hana", { x: 560, y: 950, s: 1.675, glasses: true, arms: "point" })}
   ${figure("amal", { x: 950, y: 950, s: 1.6, mood: "sad" })}
   ${bookShelf(1300, 800, 1, { count: 9 })}`,

  // 10 five words each evening
  `${homeScene()}${roomBox(1250, 640, 1.152, "bedroom")}
   ${figure("amal", { x: 620, y: 950, s: 1.7, holding: heldBook })}
   ${figure("adam", { x: 890, y: 950, s: 1.55 })}`,

  // 11 contest day, eyes closed, spelling it slowly
  `${classroomScene()}${bunting(800, 150, 1.15, { span: 1100 })}
   ${figure("amal", { x: 720, y: 950, s: 1.825 })}
   ${figure("yasmin", { x: 1200, y: 950, s: 1.55, holding: heldPaper })}
   ${figure("nora", { x: 360, y: 950, s: 1.5, arms: "up" })}`,

  // 12 not first, but every word known
  `${classroomScene()}${confetti(800, 560)}
   ${figure("yasmin", { x: 1130, y: 950, s: 1.6, arms: "point" })}
   ${figure("amal", { x: 700, y: 950, s: 1.75, arms: "up" })}
   ${figure("nora", { x: 420, y: 950, s: 1.55, arms: "up" })}`,
];

// ================================================================ Book 3
// The Calendar on the Wall — Unit 3: Time and Daily Life

const calendarPages = [
  // 1 cover: the class calendar, all twelve months
  `${classroomScene()}
   ${monthWall(886, 380, 0.86, { columns: 4, highlight: 0 })}
   ${figure("amal", { x: 380, y: 950, s: 1.625, holding: heldPaper })}
   ${figure("nora", { x: 1240, y: 950, s: 1.575, arms: "up" })}`,

  // 2 twelve months, January to December
  `${classroomScene()}
   ${monthWall(886, 380, 0.86, { columns: 4 })}
   ${figure("yasmin", { x: 1300, y: 950, s: 1.6, arms: "point" })}`,

  // 3 January, February, March
  `${classroomScene()}${desk(1180, 950, 1.3, { item: heldPaper })}
   ${monthWall(886, 380, 0.86, { columns: 4, highlight: 1 })}
   ${figure("amal", { x: 620, y: 950, s: 1.7, holding: heldPaper })}`,

  // 4 April, May, June — rain on one, sunshine on another
  `${classroomScene()}
   ${monthWall(886, 380, 0.86, { columns: 4, highlight: 4 })}
   ${figure("nora", { x: 1180, y: 950, s: 1.7, arms: "point" })}`,

  // 5 July, August, September — Idris draws a kite on every page
  `${classroomScene()}
   ${monthWall(886, 380, 0.86, { columns: 4, highlight: 7 })}
   ${kite(1300, 300, 0.66)}
   ${figure("idris", { x: 520, y: 950, s: 1.5, holding: heldPaper })}`,

  // 6 October, November, December — Mina colours the last one purple
  `${classroomScene()}
   ${monthWall(886, 380, 0.86, { columns: 4, highlight: 11 })}
   ${figure("mina", { x: 520, y: 952, s: 1.3, arms: "up" })}
   ${figure("amal", { x: 1240, y: 950, s: 1.55 })}`,

  // 7 twelve months, twenty-four hours
  `${classroomScene()}${globeProp(1290, 950, 1.15)}
   ${figure("yasmin", { x: 700, y: 950, s: 1.675, arms: "point" })}`,

  // 8 the daily routine: six, seven, eight
  `${homeScene()}${roomBox(1250, 640, 1.178, "kitchen")}
   ${figure("amal", { x: 520, y: 950, s: 1.7 })}
   ${figure("mum", { x: 800, y: 950, s: 1.55 })}`,

  // 9 yesterday's homework, today's helping
  `${homeScene()}${desk(1160, 950, 1.3, { item: heldBook })}
   ${figure("amal", { x: 560, y: 950, s: 1.625, holding: heldBook })}
   ${figure("mina", { x: 820, y: 952, s: 1.25 })}`,

  // 10 tomorrow the vacation begins
  `${yardScene()}${bookShelf(1220, 880, 1.05, { count: 10 })}
   ${figure("amal", { x: 560, y: 900, s: 1.75, arms: "up" })}`,

  // 11 a century is a hundred years, and it still goes by
  `${homeScene()}
   ${figure("hana", { x: 600, y: 950, s: 1.7, glasses: true })}
   ${figure("amal", { x: 950, y: 950, s: 1.575 })}
   ${figure("idris", { x: 1200, y: 950, s: 1.375 })}`,

  // 12 the poem on the last page
  `${classroomScene()}${sunnyPatch(800, 980)}
   ${poster(1180, 690, 1.05, { colour: G3.gold, lines: 4 })}
   ${figure("amal", { x: 620, y: 950, s: 1.775, holding: heldPaper })}
   ${lookLine(730, 800, 1080, 720)}`,
];

// ================================================================ Book 4
// The Places That Help Us — Unit 4: Places and Community

const placesPages = [
  // 1 cover: the town and its buildings
  `${townScene()}${hospital(1180, 780, 0.7)}${libraryBuilding(430, 800, 0.66)}
   ${figure("amal", { x: 760, y: 920, s: 1.625, holding: heldBook })}
   ${figure("nora", { x: 940, y: 920, s: 1.575, arms: "up" })}`,

  // 2 a community is people helping one another
  `${townScene()}${house(300, 900, 0.6)}${flatBlock(1420, 900, 0.5)}${crossing(820, 850, 0.86)}
   ${figure("yasmin", { x: 640, y: 900, s: 1.625, arms: "point" })}
   ${figure("amal", { x: 1020, y: 900, s: 1.55 })}`,

  // 3 the hospital
  `${townScene()}${hospital(1050, 830, 0.86)}
   ${figure("mum", { x: 420, y: 900, s: 1.625 })}
   ${figure("amal", { x: 620, y: 900, s: 1.55 })}`,

  // 4 Omar at the market
  `${townScene()}${marketStall(1080, 880, 1)}
   ${mango(980, 830, 1.2)}${mango(1040, 840, 1)}
   ${figure("omar", { x: 1060, y: 918, s: 1.625, arms: "up" })}
   ${figure("amal", { x: 480, y: 918, s: 1.6, holding: heldPaper })}`,

  // 5 the officer at the corner
  `${townScene()}${crossing(900, 850, 1.05)}${townBus(1320, 910, 0.56)}
   ${figure("dad", { x: 1080, y: 918, s: 1.625, arms: "point" })}
   ${figure("amal", { x: 520, y: 918, s: 1.55 })}
   ${figure("mina", { x: 690, y: 920, s: 1.225 })}`,

  // 6 the sailor at the coast
  `${coastScene()}${ferryBoat(1160, 640, 0.6)}
   ${figure("dad", { x: 700, y: 930, s: 1.625, holding: heldShell })}
   ${figure("amal", { x: 430, y: 930, s: 1.575, arms: "up" })}`,

  // 7 the college and the court
  `${townScene()}${shoppingCentre(1180, 830, 0.62)}${libraryBuilding(480, 850, 0.6)}
   ${figure("adam", { x: 830, y: 918, s: 1.625, holding: heldBook })}`,

  // 8 the quietest door in the county
  `${townScene()}${libraryBuilding(1030, 830, 0.94)}
   ${figure("amal", { x: 460, y: 918, s: 1.7, holding: heldBook })}`,

  // 9 the map: village, county, border
  `${classroomScene()}${mapProp(1140, 700, 1.35)}
   ${figure("yasmin", { x: 620, y: 950, s: 1.65, arms: "point" })}
   ${lookLine(730, 790, 1010, 740)}`,

  // 10 learning your address by heart
  `${classroomScene()}${desk(1180, 950, 1.3, { item: heldPaper })}
   ${figure("amal", { x: 560, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("nora", { x: 810, y: 950, s: 1.575 })}`,

  // 11 the exit signs
  `${townScene()}${hospital(1150, 830, 0.72)}
   <g transform="translate(700 700)"><rect x="-70" y="-34" width="140" height="68" rx="8" fill="${G3.leafy}" stroke="${C.ink}" stroke-width="4.5"/><path d="M -34 0 h 50 M 4 -18 l 22 18 l -22 18" stroke="${G3.cream}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
   ${figure("amal", { x: 460, y: 918, s: 1.625, arms: "point" })}`,

  // 12 every place has its job, and so does everybody in it
  `${sunsetScene()}${hospital(1300, 930, 0.5)}${libraryBuilding(200, 940, 0.46)}${marketStall(760, 930, 0.6)}
   ${figure("amal", { x: 560, y: 940, s: 1.675, arms: "up" })}
   ${figure("nora", { x: 980, y: 940, s: 1.575, arms: "up" })}`,
];

// ================================================================ Book 5
// The Wall Behind the Garden — Unit 5: Actions and Activities

const wallPages = [
  // 1 cover: the family, the fallen wall, the garden to be
  `${gardenScene()}${gardenWall(1080, 880, 0.86, { length: 520 })}
   ${figure("dad", { x: 380, y: 900, s: 1.6 })}
   ${figure("amal", { x: 580, y: 900, s: 1.625, arms: "up" })}
   ${figure("adam", { x: 760, y: 900, s: 1.55 })}
   ${figure("idris", { x: 910, y: 900, s: 1.375 })}`,

  // 2 a busy Saturday, before the sun gets too hot
  `${gardenScene()}${house(1240, 880, 0.72)}
   ${figure("mum", { x: 560, y: 900, s: 1.65, arms: "point" })}
   ${figure("amal", { x: 850, y: 900, s: 1.575 })}
   ${figure("adam", { x: 1030, y: 900, s: 1.525 })}`,

  // 3 sweeping the path, picking up the leaves
  `${gardenScene()}${litterBits(1160, 940, 0.9)}
   ${figure("dad", { x: 620, y: 900, s: 1.625 })}
   ${figure("amal", { x: 880, y: 900, s: 1.575, arms: "point" })}`,

  // 4 discussing the garden: maize, and flowers
  `${gardenScene()}${gardenPlant(1330, 900, 1)}${seedRow(1080, 930, 0.8)}
   ${figure("adam", { x: 480, y: 900, s: 1.6, arms: "point" })}
   ${figure("mina", { x: 680, y: 902, s: 1.25, arms: "up" })}
   ${figure("amal", { x: 860, y: 900, s: 1.575 })}`,

  // 5 the old wall had fallen down
  `${gardenScene()}
   <g transform="translate(980 900)">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${-220 + i * 68}" y="${-26 - (i % 3) * 14}" width="62" height="26" rx="4" fill="${i % 2 ? "#c98f6a" : "#bd8460"}" stroke="#9c6a4c" stroke-width="3" transform="rotate(${(i * 37) % 24 - 12} ${-190 + i * 68} -12)"/>`).join("")}</g>
   ${figure("amal", { x: 460, y: 900, s: 1.675, mood: "surprised" })}`,

  // 6 building it again, stone by stone
  `${gardenScene()}${gardenWall(1060, 900, 0.9, { length: 420 })}
   ${figure("idris", { x: 380, y: 900, s: 1.4 })}
   ${figure("adam", { x: 560, y: 900, s: 1.575, arms: "up" })}
   ${figure("amal", { x: 740, y: 900, s: 1.6, arms: "point" })}`,

  // 7 Nora helps, Omar offers water, Hana remembers
  `${gardenScene()}${gardenWall(1220, 900, 0.8, { length: 380 })}
   ${figure("hana", { x: 330, y: 900, s: 1.625, glasses: true, arms: "point" })}
   ${figure("nora", { x: 620, y: 900, s: 1.575 })}
   ${figure("omar", { x: 850, y: 900, s: 1.6 })}`,

  // 8 removing the broken stones; hot, and aching arms
  `${gardenScene()}${sunnyPatch(800, 960)}
   ${figure("amal", { x: 640, y: 900, s: 1.75, mood: "sad" })}
   ${figure("idris", { x: 900, y: 900, s: 1.375, mood: "sad" })}
   ${dustPuffs(1120, 930)}`,

  // 9 a wall protects a garden, a garden feeds a family
  `${gardenScene()}${gardenWall(1140, 900, 0.86, { length: 440 })}
   ${figure("dad", { x: 520, y: 900, s: 1.675, arms: "point" })}
   ${figure("amal", { x: 780, y: 900, s: 1.575 })}`,

  // 10 completed, standing straight
  `${gardenScene()}${gardenWall(900, 900, 1.05, { length: 620 })}
   ${figure("amal", { x: 330, y: 900, s: 1.65, arms: "up" })}
   ${figure("adam", { x: 1400, y: 900, s: 1.55, arms: "up" })}`,

  // 11 planting: maize one side, flowers the other
  `${gardenScene()}${gardenWall(1180, 880, 0.78, { length: 400 })}
   ${seedRow(560, 930, 1)}${gardenPlant(900, 900, 1.05)}${plantStage(1010, 906, 1.2, "sprout")}
   ${figure("amal", { x: 330, y: 900, s: 1.6 })}
   ${figure("mina", { x: 720, y: 902, s: 1.25 })}`,

  // 12 sweet tea, and it happened because they did it together
  `${sunsetScene()}${gardenWall(1180, 930, 0.72, { length: 380 })}
   ${figure("dad", { x: 380, y: 940, s: 1.6 })}
   ${figure("mum", { x: 570, y: 940, s: 1.575 })}
   ${figure("amal", { x: 760, y: 940, s: 1.625, arms: "up" })}
   ${figure("adam", { x: 930, y: 940, s: 1.525 })}`,
];

// ================================================================ Book 6
// The Girl Who Carried Kindness — Unit 6: Describing People and Things

const kindnessPages = [
  // 1 cover: two roads, and two friends
  `${townScene()}${acacia(1290, 640, 1.25)}
   <path d="M 240 1000 q 120 -180 300 -230" stroke="#cfc3ab" stroke-width="70" fill="none" stroke-linecap="round"/>
   <path d="M 1180 1000 q -60 -220 -320 -270" stroke="#cfc3ab" stroke-width="58" fill="none" stroke-linecap="round"/>
   ${figure("amal", { x: 470, y: 930, s: 1.625, holding: heldBook })}
   ${figure("nora", { x: 900, y: 930, s: 1.6, arms: "up" })}`,

  // 2 cousin Noah, kind and honest
  `${homeScene()}${roomBox(1250, 640, 1.152, "living")}
   ${figure("noah", { x: 520, y: 950, s: 1.625 })}
   ${figure("amal", { x: 790, y: 950, s: 1.575, arms: "point" })}`,

  // 3 Nora, friendly and calm
  `${yardScene()}${bench(1200, 940, 1.4)}
   ${figure("nora", { x: 640, y: 900, s: 1.75 })}
   ${figure("amal", { x: 900, y: 900, s: 1.575 })}`,

  // 4 two roads: one short and rough, one long and smooth
  `${townScene()}${acacia(230, 650, 1.05)}
   <path d="M 420 1000 q 40 -220 180 -300" stroke="#c0b298" stroke-width="62" fill="none" stroke-linecap="round"/>
   <path d="M 1240 1000 q -100 -240 -400 -300" stroke="#d8cdb6" stroke-width="70" fill="none" stroke-linecap="round"/>
   ${figure("amal", { x: 780, y: 918, s: 1.625, mood: "surprised" })}`,

  // 5 Amal takes the short one; Nora takes the long one
  `${townScene()}
   <path d="M 340 1000 q 60 -200 200 -280" stroke="#c0b298" stroke-width="60" fill="none" stroke-linecap="round"/>
   <path d="M 1300 1000 q -120 -230 -420 -280" stroke="#d8cdb6" stroke-width="68" fill="none" stroke-linecap="round"/>
   ${figure("amal", { x: 430, y: 918, s: 1.6 })}
   ${figure("nora", { x: 1140, y: 918, s: 1.575 })}
   ${motionArcs(300, 800, 1.1)}`,

  // 6 the reason: a junior student walks that way
  `${townScene()}${house(1300, 900, 0.56)}
   ${figure("nora", { x: 700, y: 918, s: 1.625 })}
   ${figure("mina", { x: 880, y: 920, s: 1.25 })}
   ${figure("amal", { x: 400, y: 918, s: 1.55, mood: "surprised" })}`,

  // 7 "she is small, and the road is busy"
  `${townScene()}${townBus(1300, 918, 0.56)}${crossing(1000, 860, 0.8, { sign: false })}
   ${figure("amal", { x: 470, y: 918, s: 1.6, arms: "point" })}
   ${figure("nora", { x: 700, y: 918, s: 1.6 })}`,

  // 8 clever is not the same as kind
  `${classroomScene()}${desk(1180, 950, 1.3)}
   ${figure("amal", { x: 640, y: 950, s: 1.8 })}`,

  // 9 careless again, late again — but the long road
  `${townScene()}
   <path d="M 1240 1000 q -120 -230 -420 -280" stroke="#d8cdb6" stroke-width="68" fill="none" stroke-linecap="round"/>
   ${figure("amal", { x: 620, y: 918, s: 1.675, arms: "up" })}
   ${dustPuffs(430, 940)}${motionArcs(470, 810, 1.2)}`,

  // 10 all three of them, and not late at all
  `${townScene()}${house(240, 900, 0.54)}
   <path d="M 1300 1000 q -140 -240 -460 -290" stroke="#d8cdb6" stroke-width="70" fill="none" stroke-linecap="round"/>
   ${figure("nora", { x: 680, y: 918, s: 1.575 })}
   ${figure("mina", { x: 850, y: 920, s: 1.25 })}
   ${figure("amal", { x: 1020, y: 918, s: 1.6, arms: "up" })}`,

  // 11 under the tall tree, nothing needing to be said
  `${yardScene()}${acacia(900, 600, 1.6)}${bench(880, 950, 1.6)}
   ${figure("nora", { x: 720, y: 918, s: 1.575 })}
   ${figure("amal", { x: 1010, y: 918, s: 1.6 })}`,

  // 12 kindness is a thing you carry
  `${sunsetScene()}${acacia(1310, 660, 1.15)}
   ${figure("amal", { x: 600, y: 940, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 830, y: 940, s: 1.625, arms: "up" })}`,
];

// ================================================================ Book 7
// From Coast to Forest — Unit 7: Nature and the Environment

const naturePages = [
  // 1 cover: the whole trip in one view
  `${coastScene()}${shells(1180, 900, 1)}
   ${figure("yasmin", { x: 470, y: 930, s: 1.6, arms: "point" })}
   ${figure("amal", { x: 730, y: 930, s: 1.625, arms: "up" })}
   ${figure("nora", { x: 920, y: 930, s: 1.575, holding: heldShell })}`,

  // 2 the plan: start at the coast, finish on the mountain
  `${classroomScene()}${globeProp(1250, 950, 1.2)}${mapProp(430, 700, 1.1)}
   ${figure("yasmin", { x: 800, y: 950, s: 1.675, arms: "point" })}`,

  // 3 packing water and hats
  `${yardScene()}${bench(1180, 940, 1.4)}
   ${figure("amal", { x: 520, y: 900, s: 1.65, holding: heldPaper })}
   ${figure("nora", { x: 760, y: 900, s: 1.6 })}
   ${cloudPuff(1150, 250, 1.1)}`,

  // 4 the sunshine, the sand, and the sea going out and back
  `${coastScene()}${shells(560, 930, 0.9, { count: 7 })}
   ${figure("amal", { x: 1010, y: 930, s: 1.7, arms: "up" })}`,

  // 5 Nora tastes the sea, once and only once
  `${coastScene()}
   ${figure("nora", { x: 780, y: 930, s: 1.775, mood: "surprised" })}
   ${figure("amal", { x: 1080, y: 930, s: 1.575 })}`,

  // 6 metal bottle tops, carried away in a bag
  `${coastScene()}${litterBits(1140, 940, 0.86)}${shells(430, 940, 0.7, { count: 5 })}
   ${figure("amal", { x: 780, y: 930, s: 1.65, arms: "point" })}
   ${figure("nora", { x: 1000, y: 930, s: 1.575 })}`,

  // 7 into the forest, where the temperature drops
  `${forestScene()}
   ${figure("yasmin", { x: 560, y: 940, s: 1.625 })}
   ${figure("amal", { x: 800, y: 940, s: 1.625, arms: "up" })}
   ${figure("nora", { x: 990, y: 940, s: 1.575 })}`,

  // 8 everything here is matter, and everything uses energy
  `${forestScene()}
   ${figure("yasmin", { x: 1030, y: 940, s: 1.675, arms: "point" })}
   ${figure("amal", { x: 620, y: 940, s: 1.575, holding: heldPaper })}
   ${butterflyBug(420, 500, 1.1)}`,

  // 9 a beetle with a leaf, a bird they could not find
  `${forestScene()}${beeBug(1160, 520, 1.2)}${wildBird(430, 420, 1.1, true)}
   ${figure("nora", { x: 780, y: 940, s: 1.65, arms: "point" })}
   ${lookLine(880, 800, 1120, 580)}`,

  // 10 the trail goes up
  `${mountainScene()}
   ${figure("yasmin", { x: 620, y: 950, s: 1.55 })}
   ${figure("amal", { x: 830, y: 950, s: 1.575 })}
   ${figure("nora", { x: 1010, y: 950, s: 1.525 })}
   ${motionArcs(470, 850, 1.1)}`,

  // 11 near the top, water almost frozen, the coast in view
  `${mountainScene()}${cloudPuff(1240, 240, 1.15)}
   ${figure("amal", { x: 700, y: 950, s: 1.75, mood: "surprised", arms: "up" })}`,

  // 12 one planet: coast, forest and mountain in one morning
  `${mountainScene()}${sunnyPatch(800, 990)}
   ${figure("yasmin", { x: 1020, y: 950, s: 1.625, arms: "point" })}
   ${figure("amal", { x: 620, y: 950, s: 1.625, arms: "up" })}
   ${figure("nora", { x: 400, y: 950, s: 1.575, arms: "up" })}`,
];

// ================================================================ Book 8
// The Mystery of the Million Shells — Unit 8: Numbers, Shapes, Measurement

const millionPages = [
  // 1 cover: the beach, the question, the shells
  `${coastScene()}${shells(980, 910, 1.15)}${shells(420, 940, 0.9, { count: 6 })}
   ${figure("yasmin", { x: 640, y: 930, s: 1.6, arms: "point" })}
   ${figure("amal", { x: 1180, y: 930, s: 1.625, holding: heldShell })}`,

  // 2 "How many shells are on our beach?"
  `${coastScene()}${shells(1150, 930, 1)}
   ${figure("yasmin", { x: 620, y: 930, s: 1.7, arms: "point" })}`,

  // 3 a hundred, a thousand, a million
  `${coastScene()}
   ${figure("idris", { x: 430, y: 930, s: 1.425, arms: "up" })}
   ${figure("nora", { x: 720, y: 930, s: 1.6, arms: "up" })}
   ${figure("amal", { x: 1010, y: 930, s: 1.625, arms: "up" })}`,

  // 4 "Now prove it."
  `${coastScene()}${shells(1120, 940, 0.9)}
   ${figure("yasmin", { x: 700, y: 930, s: 1.75 })}
   ${figure("amal", { x: 1000, y: 930, s: 1.55, mood: "surprised" })}`,

  // 5 measuring one square metre
  `${coastScene()}${metreStick(1060, 940, 1)}${rulerProp(760, 880, 1, { rotate: -6 })}
   ${figure("amal", { x: 470, y: 930, s: 1.625, arms: "point" })}
   ${figure("nora", { x: 1290, y: 930, s: 1.55 })}`,

  // 6 sixty-four in one square metre
  `${coastScene()}${shells(880, 900, 1.25)}
   <rect x="700" y="820" width="360" height="150" rx="8" fill="none" stroke="${G3.coral}" stroke-width="7" stroke-dasharray="20 14"/>
   ${figure("amal", { x: 420, y: 930, s: 1.625, holding: heldPaper })}`,

  // 7 two hundred metres long, thirty wide
  `${coastScene()}${metreStick(430, 940, 0.9)}
   ${rulerProp(1000, 800, 1.2, { length: 400 })}
   ${figure("nora", { x: 760, y: 930, s: 1.625, arms: "point" })}`,

  // 8 multiplication is faster than counting
  `${classroomScene({ boardText: "sums" })}
   ${figure("yasmin", { x: 1080, y: 950, s: 1.65, arms: "point" })}
   ${figure("amal", { x: 780, y: 950, s: 1.55, holding: heldPaper })}`,

  // 9 Adam checks the addition twice
  `${classroomScene({ boardText: "sums" })}${desk(1190, 950, 1.3, { item: heldPaper })}
   ${figure("adam", { x: 700, y: 950, s: 1.675, holding: heldPaper })}
   ${figure("amal", { x: 950, y: 950, s: 1.55 })}`,

  // 10 not a million — but closer to a million than to a hundred
  `${classroomScene({ boardText: "sums" })}${tensLine(800, 400, 1.05)}
   ${figure("amal", { x: 640, y: 950, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 1080, y: 950, s: 1.55 })}`,

  // 11 "You measured. That is what maths is for."
  `${coastScene()}${shells(1180, 930, 1)}
   ${figure("yasmin", { x: 640, y: 930, s: 1.7, arms: "point" })}
   ${figure("amal", { x: 950, y: 930, s: 1.575 })}`,

  // 12 seeing the size of the whole beach
  `${coastScene()}${shells(1080, 950, 1.1)}${shells(380, 930, 0.8, { count: 6 })}
   ${figure("amal", { x: 740, y: 930, s: 1.8 })}`,
];

// ================================================================ Book 9
// The Box of Ideas — Unit 9: Thinking, Feelings and Imagination

const ideasPages = [
  // 1 cover: the box, and a quiet class
  `${classroomScene()}${desk(360, 950, 1.3)}
   ${boxOfIdeas(1130, 900, 1)}
   ${figure("yasmin", { x: 900, y: 950, s: 1.6, arms: "point" })}
   ${figure("amal", { x: 620, y: 950, s: 1.625, holding: heldPaper })}`,

  // 2 the bright box comes into class
  `${classroomScene()}
   ${boxOfIdeas(1050, 900, 1.15)}
   ${figure("yasmin", { x: 620, y: 950, s: 1.7 })}`,

  // 3 a dream, a memory, or a hope
  `${classroomScene()}${boxOfIdeas(1180, 900, 0.95)}
   ${figure("yasmin", { x: 830, y: 950, s: 1.625, arms: "point" })}
   ${figure("nora", { x: 520, y: 950, s: 1.55 })}
   ${figure("amal", { x: 340, y: 950, s: 1.575 })}`,

  // 4 the room goes quiet
  `${classroomScene()}${desk(430, 950, 1.3)}${desk(1160, 950, 1.3)}
   ${figure("amal", { x: 660, y: 950, s: 1.625, mood: "surprised" })}
   ${figure("nora", { x: 880, y: 950, s: 1.575 })}`,

  // 5 Nora's dream: a library with no walls
  `${classroomScene()}${bookShelf(1200, 800, 1.1, { count: 11 })}
   ${figure("nora", { x: 620, y: 950, s: 1.75, holding: heldPaper })}`,

  // 6 Idris's memory: rain on hot ground
  `${classroomScene()}
   ${figure("idris", { x: 700, y: 950, s: 1.55, holding: heldPaper })}
   ${poster(1200, 700, 1, { colour: G3.sky, lines: 3 })}`,

  // 7 three ideas, none of them sincere enough
  `${classroomScene()}${desk(1160, 950, 1.3, { item: heldPaper })}
   ${figure("amal", { x: 660, y: 950, s: 1.8, mood: "sad" })}`,

  // 8 Sami's one line, and the room stays still
  `${classroomScene()}${boxOfIdeas(1250, 900, 0.86)}
   ${figure("noah", { x: 660, y: 950, s: 1.6, holding: heldPaper, mood: "sad" })}
   ${figure("amal", { x: 920, y: 950, s: 1.55, mood: "sad" })}`,

  // 9 feelings are not good or bad
  `${classroomScene()}
   ${figure("yasmin", { x: 780, y: 950, s: 1.725, arms: "point" })}
   ${figure("amal", { x: 1120, y: 950, s: 1.55 })}
   ${figure("nora", { x: 430, y: 950, s: 1.525 })}`,

  // 10 writing what she actually felt
  `${classroomScene()}${desk(1140, 950, 1.3, { item: heldPaper })}
   ${figure("amal", { x: 640, y: 950, s: 1.775, holding: heldPaper })}`,

  // 11 reading them aloud, and nobody laughing
  `${classroomScene()}${boxOfIdeas(1300, 900, 0.8)}
   ${figure("amal", { x: 620, y: 950, s: 1.65, holding: heldPaper })}
   ${figure("nora", { x: 850, y: 950, s: 1.55 })}
   ${figure("idris", { x: 1040, y: 950, s: 1.375 })}
   ${figure("yasmin", { x: 340, y: 950, s: 1.525 })}`,

  // 12 an idea is small until you say it
  `${classroomScene()}${sunnyPatch(800, 980)}
   ${boxOfIdeas(1120, 900, 1.05)}
   ${figure("amal", { x: 640, y: 950, s: 1.75, arms: "up" })}`,
];

// ================================================================ Book 10
// Nine Doors — Unit 10 capstone

const nineDoorsPages = [
  // 1 cover: the showcase
  `${classroomScene()}${bunting(800, 150, 1.2, { span: 1180 })}
   ${easel(1250, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.teal }) })}
   ${easel(300, 950, 1.25, { inner: poster(0, 0, 0.5, { colour: G3.coral }) })}
   ${figure("amal", { x: 700, y: 950, s: 1.725, holding: heldPaper })}
   ${figure("nora", { x: 930, y: 950, s: 1.6, arms: "up" })}`,

  // 2 the project brief
  `${classroomScene()}${poster(1220, 700, 1.05, { colour: G3.plum, lines: 5 })}
   ${figure("yasmin", { x: 700, y: 950, s: 1.7, arms: "point" })}
   ${figure("amal", { x: 400, y: 950, s: 1.525, holding: heldPaper })}`,

  // 3 nine units, nine doors
  `${plainRoomScene()}
   ${nineDoors(800, 400, 0.86)}
   ${figure("yasmin", { x: 1400, y: 950, s: 1.55, arms: "point" })}`,

  // 4 door one: family and duty
  `${homeScene()}${roomBox(1230, 640, 1.152, "dining")}
   ${figure("amal", { x: 560, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("mina", { x: 830, y: 952, s: 1.25 })}`,

  // 5 door two: the spelling contest
  `${classroomScene()}${poster(1200, 700, 1, { colour: G3.gold, lines: 5 })}
   ${figure("amal", { x: 660, y: 950, s: 1.7, holding: heldBook })}`,

  // 6 door three: twelve months, and a poem
  `${classroomScene()}${monthWall(886, 380, 0.86, { columns: 4 })}
   ${figure("amal", { x: 400, y: 950, s: 1.675, holding: heldPaper })}`,

  // 7 door four: the market, the hospital, the coast
  `${townScene()}${hospital(1240, 830, 0.6)}${marketStall(700, 890, 0.72)}
   ${figure("omar", { x: 690, y: 918, s: 1.5 })}
   ${figure("amal", { x: 350, y: 918, s: 1.625, holding: heldPaper })}`,

  // 8 door five: the wall, and the garden it keeps
  `${gardenScene()}${gardenWall(1060, 890, 0.86, { length: 480 })}${gardenPlant(620, 900, 1.05)}
   ${figure("amal", { x: 380, y: 900, s: 1.675, arms: "up" })}`,

  // 9 door six: the long road, and Nora on it
  `${townScene()}
   <path d="M 1280 1000 q -130 -235 -440 -285" stroke="#d8cdb6" stroke-width="70" fill="none" stroke-linecap="round"/>
   ${figure("nora", { x: 830, y: 918, s: 1.6 })}
   ${figure("amal", { x: 500, y: 918, s: 1.625 })}`,

  // 10 door seven: coast, forest, mountain
  `${mountainScene()}
   ${figure("amal", { x: 700, y: 950, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 950, y: 950, s: 1.575 })}`,

  // 11 door eight: a beach measured, not counted
  `${coastScene()}${shells(1080, 930, 1.05)}${metreStick(430, 940, 0.9)}
   ${figure("amal", { x: 740, y: 930, s: 1.7, holding: heldShell })}`,

  // 12 door nine: Showcase Day, and a voice that did not shake
  `${classroomScene()}${bunting(800, 150, 1.2, { span: 1200 })}${confetti(800, 540)}
   ${boxOfIdeas(1350, 950, 1.05)}
   ${figure("yasmin", { x: 260, y: 950, s: 1.55, arms: "up" })}
   ${figure("nora", { x: 1020, y: 950, s: 1.575, arms: "up" })}
   ${figure("amal", { x: 720, y: 950, s: 1.825, holding: heldPaper })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "family": { dir: "the-family-who-helps", pages: familyPages },
  "contest": { dir: "the-spelling-contest", pages: contestPages },
  "calendar": { dir: "the-calendar-on-the-wall", pages: calendarPages },
  "places": { dir: "the-places-that-help-us", pages: placesPages },
  "wall": { dir: "the-wall-behind-the-garden", pages: wallPages },
  "kindness": { dir: "the-girl-who-carried-kindness", pages: kindnessPages },
  "nature": { dir: "from-coast-to-forest", pages: naturePages },
  "million": { dir: "the-mystery-of-the-million-shells", pages: millionPages },
  "ideas": { dir: "the-box-of-ideas", pages: ideasPages },
  "nine-doors": { dir: "nine-doors", pages: nineDoorsPages },
};

writeBooks(books, process.argv[2]);
