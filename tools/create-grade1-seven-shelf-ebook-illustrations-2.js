#!/usr/bin/env node

// Generates the vector illustrations for Grade 1's SIXTH and SEVENTH books,
// units 6 to 10 — ten books, two for each unit. (Units 1 to 5 have their own
// generator in a parallel lane.)
//
// Grade 1 shelves grew to five books per unit in 2026-08 (fable, the Amal day,
// the rhyme acted out, the shared-reading frame filled in, a second fable).
// The owner is growing each shelf to seven. The two added books each do a job
// the five existing kinds do not:
//
//   book 6  a CONTINUATION — the next scene of the unit's own fable or of its
//           Amal-day story, same cast, same device
//   book 7  a VOCABULARY-IN-ACTION story — a simple narrative that works one
//           of the unit's vocabulary groups into a story, in a setting the
//           unit's other books have not used
//
// Nothing here is invented where the unit says something. Every continuation
// picks up a page the shipped book ends on ("Then come and play," said Kiki;
// "You came to see me!" by the little blue boat; the rain filled the well; the
// library with Ayeeyo; Amal's made book), and every vocabulary story walks a
// group the unit teaches (body words, position words, weather words, helpers,
// feelings). The cast is the existing one only — no new characters, no new
// data-tap values, and the two local props (a toothbrush and a hairbrush for
// the Unit 6 body-words book) carry no tap attribute because a tap value
// promises a clip exists.
//
// Usage: node tools/create-grade1-seven-shelf-ebook-illustrations-2.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  W, writeBooks,
  // scenes
  basicScene, nightScene, streetScene, gardenScene, coastScene,
  plainRoomScene, villageScene, amalClassroom, homeWall,
  // savanna cast and scenery
  zebra, giraffe, elephant, ostrich, kiki, donkey, hen, goat, chick, wildBird, lulu,
  acacia, tallGrass, puddle, lake, sailboat, fish,
  bench, chalkboard, schoolBell, mango, bigFlower, nest,
  barn, fence, haystack, seedRow, carrot, dustPuffs, confetti, rain, rainbow, splashArcs, kite,
  marketStall, lampPost, flatStone,
  // people and their things
  figureA, babyIdris,
  schoolTable, schoolChair, pencilProp, colourBall,
  closedBook, openBook, childDrawing, bedProp, cupOfMilk, basketOf, fruitProp,
  bicycleProp, busStop, townBus, helicopterProp,
  villageWell, waterPot, learningFolder, madeBook,
  shopRow, libraryBuilding, hospital, house, bookShelf,
  seaTurtle, motionArcs, wateringCan, pictureCard, bunting, seedBowl,
  // the Grade 1 shelf additions
  drumProp, keyboardProp, violinProp, planeProp, songNotes,
  A1, C,
} = require("./lib/ehel-ebook-kit-grade1-shelf.js");

// A page is a scene plus the things standing in it, in back-to-front order.
const page = (...parts) => parts.join("");

// The ground line each scene puts under a standing figure — the same four the
// Grade 1 shelf generator names, because these books are set in the same rooms.
const CLASS_FLOOR = 930;
const HOME_FLOOR = 940;
const OUT_FLOOR = 900;
const VILLAGE_FLOOR = 930;

// ---------------------------------------------------------------- local props
//
// Unit 6's body-words book brushes teeth and hair, and the four-kit chain has
// nothing to brush with. Both are drawn here rather than added to a kit: they
// are this one book's furniture. No data-tap — a tap value promises a clip.

function toothbrushProp(x, y, s = 1, { colour = A1.blue } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-16)">
    <rect x="-22" y="-90" width="44" height="230" rx="20" fill="${colour}" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-26" y="-148" width="52" height="66" rx="12" fill="#fdfbf6" stroke="${C.ink}" stroke-width="5"/>
    ${[-16, -2, 12].map((bx) => `<path d="M ${bx} -142 v 54" stroke="#c9d3dc" stroke-width="6" stroke-linecap="round"/>`).join("")}
  </g>`;
}

function hairbrushProp(x, y, s = 1, { colour = A1.red } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(14)">
    <rect x="-18" y="-20" width="36" height="150" rx="16" fill="${colour}" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="0" cy="-72" rx="52" ry="62" fill="${colour}" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="-6" cy="-72" rx="34" ry="46" fill="#f0e2c8" stroke="${C.ink}" stroke-width="4"/>
    ${[[-18, -102], [2, -108], [-24, -76], [0, -80], [-18, -50], [4, -52], [-8, -30]].map(([bx, by]) => `<circle cx="${bx}" cy="${by}" r="4.5" fill="${C.ink}" opacity="0.7"/>`).join("")}
  </g>`;
}

// ================================================================ UNIT 6
// My Five Senses — the band plays on, and a body-words bedtime

// ---------------------------------------------------------------- 6.6 The Savanna Band
// Continues "Kiki Makes Music", which ends "Then come and play," said Kiki.

const theSavannaBand = [
  page(basicScene(), acacia(1220, 600, 1.35), songNotes(1000, 330, 0.95),
    drumProp(880, 890, 0.72),
    kiki({ x: 620, y: 800, s: 1.25, mood: "happy", arms: "up" }),
    elephant({ x: 1400, y: 760, s: 0.65, trunkUp: true }),
    ostrich({ x: 1100, y: 740, s: 0.6 })),

  page(basicScene(), acacia(1380, 620, 1), songNotes(1120, 320, 0.9),
    drumProp(600, 890, 0.62), violinProp(880, 810, 0.55), keyboardProp(1180, 850, 0.6),
    kiki({ x: 320, y: 805, s: 1.05, mood: "happy" })),

  page(basicScene(), acacia(280, 630, 1),
    drumProp(920, 890, 0.85, { beating: true }),
    kiki({ x: 640, y: 800, s: 1.25, mood: "happy" }),
    songNotes(1180, 300, 0.9)),

  page(basicScene(), acacia(1360, 620, 1),
    violinProp(1000, 800, 0.75),
    ostrich({ x: 1180, y: 730, s: 0.78 }),
    kiki({ x: 560, y: 800, s: 1.2, mood: "happy" })),

  page(basicScene(), acacia(240, 640, 1),
    keyboardProp(1310, 880, 0.78),
    giraffe({ x: 1020, y: 620, s: 0.95, glasses: true, bend: true }),
    kiki({ x: 560, y: 805, s: 1.15, mood: "happy" })),

  page(basicScene(), acacia(260, 630, 1), dustPuffs(1180, 900),
    zebra({ x: 1080, y: 690, s: 1.05, mood: "happy" }),
    kiki({ x: 520, y: 800, s: 1.15, mood: "happy", arms: "up" }),
    drumProp(760, 890, 0.6)),

  page(basicScene(), barn(1340, 715, 0.9),
    hen({ x: 1180, y: 835, s: 0.95, mood: "happy" }),
    chick(920, 890, 0.95), chick(1000, 900, 0.9), chick(1080, 890, 0.95),
    kiki({ x: 560, y: 800, s: 1.2, mood: "happy", arms: "up" })),

  page(basicScene(), acacia(1300, 610, 1.15), songNotes(420, 300, 1), songNotes(1120, 260, 0.95),
    drumProp(760, 890, 0.7, { beating: true }),
    kiki({ x: 520, y: 800, s: 1.2, mood: "happy" }),
    ostrich({ x: 1080, y: 730, s: 0.7 }),
    elephant({ x: 1450, y: 765, s: 0.6, trunkUp: true })),

  page(basicScene(), acacia(1340, 620, 1.05), songNotes(1120, 320, 0.6),
    drumProp(900, 890, 0.7),
    kiki({ x: 620, y: 800, s: 1.2, mood: "happy" }),
    elephant({ x: 1220, y: 755, s: 0.85 })),

  page(basicScene(), acacia(280, 630, 1.05), dustPuffs(1000, 900), songNotes(1240, 300, 0.85),
    elephant({ x: 900, y: 745, s: 1, trunkUp: true, mood: "happy", arms: "up" }),
    kiki({ x: 480, y: 805, s: 1.05 })),

  page(basicScene(), acacia(1120, 600, 1.45), nest(1120, 492, 1.5), songNotes(880, 300, 0.85),
    lulu({ x: 1290, y: 470, s: 1.5, mood: "happy" }),
    kiki({ x: 560, y: 805, s: 1.1, arms: "up" })),

  page(basicScene(), acacia(1240, 605, 1.25), songNotes(1020, 300, 1), confetti(800, 340, 1),
    drumProp(700, 890, 0.62, { beating: true }), violinProp(1400, 820, 0.5),
    kiki({ x: 460, y: 800, s: 1.2, mood: "happy", arms: "up" }),
    zebra({ x: 940, y: 692, s: 0.95, mood: "happy" }),
    elephant({ x: 1500, y: 770, s: 0.58, trunkUp: true })),
];

// ---------------------------------------------------------------- 6.7 Clean from Head to Foot
// The unit's body words in a story: an evening of washing and brushing, in the
// one setting the unit's other books never use — home at bedtime.

const cleanFromHeadToFoot = [
  page(homeWall(), waterPot(1180, 890, 0.6),
    figureA("mum", { x: 620, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("amal", { x: 900, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(homeWall(), waterPot(1200, 890, 0.6),
    figureA("mum", { x: 640, y: HOME_FLOOR, s: 1.55, mood: "happy" }),
    figureA("amal", { x: 920, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(), waterPot(1120, 890, 0.65), splashArcs(1120, 880, "#5f92c6"),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(), waterPot(1160, 890, 0.6),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(homeWall(), toothbrushProp(1180, 840, 0.9), cupOfMilk(1360, 830, 0.42),
    figureA("amal", { x: 680, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(), hairbrushProp(1180, 830, 0.95),
    figureA("amal", { x: 680, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(), waterPot(1200, 890, 0.6),
    figureA("hodan", { x: 760, y: HOME_FLOOR, s: 1.42, mood: "happy" }),
    figureA("amal", { x: 1020, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(), splashArcs(1060, 890, "#5f92c6"),
    babyIdris(1060, HOME_FLOOR, 1.3),
    figureA("amal", { x: 640, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 760, y: HOME_FLOOR, s: 1.58, mood: "happy", arms: "up" }),
    figureA("mum", { x: 1060, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 660, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 940, y: HOME_FLOOR, s: 1.42, mood: "happy", arms: "up" })),

  page(homeWall({ night: true }), bedProp(1180, 900, 0.85),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("mum", { x: 360, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(homeWall({ night: true }), bedProp(1160, 900, 0.9),
    figureA("mum", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "happy" })),
];

// ================================================================ UNIT 7
// Let's Go! — the sea the bus ride ends at, and position words on the farm

// ---------------------------------------------------------------- 7.6 A Day by the Sea
// Continues "Amal's Big Bus Ride", which ends with Grandmother by the little
// blue boat at the sea.

const aDayByTheSea = [
  page(coastScene(), sailboat(1080, 700, 1.35),
    figureA("hana", { x: 520, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 780, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(coastScene(),
    figureA("hana", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 900, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(coastScene(), sailboat(1080, 700, 1.35),
    figureA("amal", { x: 520, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(coastScene(), sailboat(1120, 690, 1.25),
    figureA("hana", { x: 540, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("amal", { x: 800, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(coastScene(), fish(1060, 600, 1.4), splashArcs(1060, 660, "#5f92c6"),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "surprised", arms: "point" })),

  page(coastScene(), planeProp(1020, 300, 1),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("hana", { x: 820, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(coastScene(), planeProp(1120, 280, 0.85),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(coastScene(), helicopterProp(1060, 320, 1),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "surprised", arms: "up" }),
    figureA("hana", { x: 820, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(coastScene(), bicycleProp(1120, 890, 0.9), sailboat(500, 690, 0.95),
    figureA("adam", { x: 700, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "up" }),
    figureA("amal", { x: 420, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(coastScene(), sailboat(1140, 695, 1.1),
    figureA("hana", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 830, y: OUT_FLOOR, s: 1.48, mood: "happy" }),
    figureA("adam", { x: 1060, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(streetScene(), townBus(1080, 830, 1.05), busStop(340, 880, 0.9),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 860, y: OUT_FLOOR, s: 1.44, mood: "happy" })),

  page(homeWall(), confetti(880, 320, 0.9),
    figureA("amal", { x: 700, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("hana", { x: 1000, y: HOME_FLOOR, s: 1.52, mood: "happy" })),
];

// ---------------------------------------------------------------- 7.7 Duku Plays Hide-and-Seek
// The unit's position words (behind, under, inside, above, near, far) in a
// story, on the farm — the one setting Unit 7's other books never visit.

const dukuPlaysHideAndSeek = [
  page(basicScene(), barn(1240, 700, 1.1), fence(380, 880, 1, 3),
    donkey({ x: 700, y: 700, s: 1.1, mood: "happy" }),
    kiki({ x: 1080, y: 805, s: 1.05, arms: "up" }),
    chick(1240, 890, 0.95), chick(1330, 900, 0.9)),

  page(basicScene(), barn(1320, 710, 1), haystack(300, 890, 0.9),
    kiki({ x: 620, y: 800, s: 1.2, mood: "happy", arms: "up" }),
    donkey({ x: 1020, y: 700, s: 1, mood: "surprised" }),
    chick(1360, 895, 0.9)),

  page(basicScene(), barn(1330, 712, 0.95), fence(300, 880, 0.85, 3),
    donkey({ x: 760, y: 700, s: 1.15 })),

  page(basicScene(), barn(1340, 715, 0.9),
    chick(1130, 895, 0.9),
    haystack(1080, 890, 1),
    donkey({ x: 480, y: 705, s: 0.95 })),

  page(basicScene(), barn(1340, 715, 0.9), haystack(280, 890, 0.85),
    chick(1100, 902, 0.8),
    bench(1100, 900, 1.3),
    donkey({ x: 480, y: 705, s: 0.95 })),

  page(basicScene(), haystack(320, 890, 0.9),
    barn(1300, 710, 1),
    chick(1300, 890, 0.9),
    donkey({ x: 560, y: 705, s: 0.95 })),

  page(basicScene(), acacia(1120, 600, 1.45), fence(300, 880, 0.85, 3),
    kiki({ x: 1130, y: 460, s: 0.85, mood: "happy" }),
    donkey({ x: 480, y: 705, s: 0.95 })),

  page(basicScene(), acacia(1380, 620, 1), tallGrass(300, 920, 1.3), tallGrass(520, 900, 1.1),
    donkey({ x: 800, y: 700, s: 1.1, mood: "surprised" })),

  page(basicScene(), barn(1340, 715, 0.9),
    haystack(1080, 890, 1),
    chick(1180, 890, 0.95, "happy"),
    donkey({ x: 560, y: 700, s: 1.05, mood: "happy" })),

  page(basicScene(), barn(1300, 710, 1), bench(560, 900, 1.3),
    chick(560, 890, 0.9, "happy"), chick(1300, 890, 0.9, "happy"),
    donkey({ x: 880, y: 700, s: 1.05, mood: "happy" })),

  page(basicScene(), acacia(1120, 600, 1.45),
    kiki({ x: 1130, y: 460, s: 0.85, mood: "happy", arms: "up" }),
    donkey({ x: 560, y: 700, s: 1.1, mood: "surprised" })),

  page(basicScene(), barn(1300, 705, 1), confetti(820, 330, 1),
    donkey({ x: 700, y: 700, s: 1.15, mood: "happy" }),
    kiki({ x: 1080, y: 805, s: 1.05, mood: "happy", arms: "up" }),
    chick(1240, 890, 0.95), chick(1330, 900, 0.9), chick(1420, 890, 0.95)),
];

// ================================================================ UNIT 8
// Wonderful Water — the garden the rain makes possible, and the weather words

// ---------------------------------------------------------------- 8.6 After the Rain
// Continues "The Well in the Village", which ends with the rain filling the well.

const afterTheRain = [
  page(villageScene({ treeX: 1320, treeScale: 1.35 }), villageWell(1080, 800, 0.7),
    figureA("amal", { x: 500, y: VILLAGE_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 760, y: VILLAGE_FLOOR, s: 1.4, mood: "happy", arms: "up" })),

  page(villageScene({ sunny: false, treeX: 1320, treeScale: 1.35 }), rain(), villageWell(1080, 800, 0.7),
    puddle(560, 930, 240, 46),
    figureA("amal", { x: 720, y: VILLAGE_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(),
    figureA("amal", { x: 640, y: OUT_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("adam", { x: 900, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(gardenScene(), seedRow(1060, 910, 1, { sprouts: false }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(gardenScene(), seedRow(1060, 910, 1, { sprouts: false }), wateringCan(1280, 830, 0.9, { pouring: true }),
    figureA("adam", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), seedBowl(1160, 880, 0.75),
    figureA("hodan", { x: 700, y: OUT_FLOOR, s: 1.42, mood: "happy" }),
    figureA("amal", { x: 960, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), seedRow(1060, 910, 1, { sprouts: false }),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" })),

  page(gardenScene(), seedRow(1060, 910, 1.1, { sprouts: true }),
    figureA("amal", { x: 540, y: OUT_FLOOR, s: 1.52, mood: "surprised", arms: "point" })),

  page(gardenScene(), seedRow(1000, 910, 1.2, { sprouts: true }), tallGrass(1380, 910, 1),
    figureA("amal", { x: 480, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("adam", { x: 720, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), bigFlower(1050, 880, 1.35),
    figureA("amal", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("hodan", { x: 880, y: OUT_FLOOR, s: 1.4, mood: "happy" })),

  page(gardenScene(), carrot(1020, 880, 1.4), carrot(1150, 895, 1.2), carrot(1270, 885, 1.3),
    figureA("adam", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(villageScene({ treeX: 320, treeScale: 1.45 }), rainbow(900, 560), villageWell(1180, 810, 0.6),
    figureA("amal", { x: 620, y: VILLAGE_FLOOR, s: 1.55, mood: "happy", arms: "up" }),
    figureA("adam", { x: 880, y: VILLAGE_FLOOR, s: 1.46, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 1080, y: VILLAGE_FLOOR, s: 1.4, mood: "happy", arms: "up" })),
];

// ---------------------------------------------------------------- 8.7 Musa and the Weather
// The unit's weather words (sunny, cloudy, windy, rainy, hot) in a story on
// the open savanna — the one Unit 8 book with no water hole in it.

const musaAndTheWeather = [
  page(basicScene(), acacia(1240, 610, 1.3), kite(700, 320, 1),
    zebra({ x: 660, y: 690, s: 1.05, mood: "happy" })),

  page(basicScene(), acacia(280, 630, 1.05),
    zebra({ x: 900, y: 690, s: 1.1, mood: "happy" })),

  page(basicScene(), tallGrass(300, 920, 1.2),
    zebra({ x: 800, y: 690, s: 1.1, mood: "happy" })),

  page(basicScene(), acacia(1150, 600, 1.45),
    zebra({ x: 1120, y: 700, s: 1, mood: "happy" }),
    flatStone(430, 890, 1.1)),

  page(basicScene(true), tallGrass(1380, 910, 1.1),
    zebra({ x: 760, y: 690, s: 1.1, mood: "surprised" })),

  page(basicScene(true), tallGrass(300, 920, 1.3), dustPuffs(1000, 900), kite(1100, 300, 1),
    zebra({ x: 640, y: 690, s: 1.05, mood: "surprised" })),

  page(basicScene(true), kite(1000, 260, 1.15), dustPuffs(700, 900),
    zebra({ x: 560, y: 690, s: 1.05, mood: "happy" })),

  page(basicScene(true), rain(),
    zebra({ x: 800, y: 690, s: 1.1, mood: "surprised" })),

  page(basicScene(true), rain(), acacia(1150, 600, 1.45),
    zebra({ x: 1120, y: 700, s: 1, mood: "happy" })),

  page(basicScene(true), rain(), puddle(700, 930, 260, 48, 0), splashArcs(700, 920, "#5f92c6"),
    chick(620, 890, 0.95), chick(780, 895, 0.9),
    zebra({ x: 1140, y: 695, s: 1, mood: "happy" })),

  page(basicScene(), rainbow(860, 560), puddle(600, 930, 240, 44, 0),
    zebra({ x: 900, y: 690, s: 1.1, mood: "happy" })),

  page(basicScene(), acacia(1240, 610, 1.2), kite(680, 300, 1), confetti(900, 340, 1),
    zebra({ x: 800, y: 690, s: 1.1, mood: "happy" }),
    chick(1180, 890, 0.95)),
];

// ================================================================ UNIT 9
// City Places — the library the walk ends at, and the helpers as a story

// ---------------------------------------------------------------- 9.6 Amal at the Library
// Continues "A Walk Around Town", which ends at the quiet library with Ayeeyo.

const amalAtTheLibrary = [
  page(streetScene(), libraryBuilding(1120, 720, 0.85),
    figureA("hana", { x: 540, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 790, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" })),

  page(streetScene(), libraryBuilding(1120, 720, 0.85), shopRow(340, 700, 0.7),
    figureA("hana", { x: 620, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 860, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(plainRoomScene(), bookShelf(300, 420, 0.9),
    figureA("hana", { x: 700, y: CLASS_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 980, y: CLASS_FLOOR, s: 1.48, mood: "happy" })),

  page(plainRoomScene(), bookShelf(1180, 420, 1),
    figureA("amal", { x: 600, y: CLASS_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(plainRoomScene(), bookShelf(300, 420, 0.9),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: `${closedBook(-80, -46, 0.5, { colour: A1.red })}${closedBook(70, -36, 0.36, { colour: A1.green })}` }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "point" })),

  page(plainRoomScene(), bookShelf(300, 420, 0.9),
    closedBook(1180, 800, 0.7, { colour: A1.blue }),
    figureA("amal", { x: 700, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(plainRoomScene(), bookShelf(300, 420, 0.9),
    schoolTable(1120, CLASS_FLOOR, 1.4, { item: openBook(0, 0, 0.55) }), schoolChair(1440, CLASS_FLOOR, 1.2),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.5, mood: "happy" })),

  page(plainRoomScene(),
    pictureCard(1180, 440, 0.9, { inner: wildBird(0, 40, 0.55) }),
    figureA("amal", { x: 560, y: CLASS_FLOOR, s: 1.52, mood: "surprised", arms: "point" })),

  page(plainRoomScene(), bookShelf(1180, 420, 1),
    closedBook(880, 800, 0.55, { colour: A1.blue }),
    figureA("hana", { x: 560, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(plainRoomScene(), bookShelf(300, 420, 0.9),
    figureA("amal", { x: 700, y: CLASS_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("hana", { x: 1000, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(gardenScene(), bench(1260, 900, 1.3), lampPost(1460, 890, 0.95),
    figureA("hana", { x: 580, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 840, y: OUT_FLOOR, s: 1.48, mood: "happy" })),

  page(homeWall(),
    schoolTable(1140, HOME_FLOOR, 1.3, { item: openBook(0, 0, 0.5) }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hodan", { x: 820, y: HOME_FLOOR, s: 1.38, mood: "happy" })),
];

// ---------------------------------------------------------------- 9.7 The Kind Doctor
// The unit's helpers (doctor, friend) in a story: Leo falls in the park and
// Faduma the doctor makes it better.

const theKindDoctor = [
  page(gardenScene(), colourBall(1180, 870, 0.85, A1.red),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy", arms: "up" }),
    figureA("leo", { x: 840, y: OUT_FLOOR, s: 1.36, mood: "happy", arms: "up" })),

  page(gardenScene(), colourBall(1160, 870, 0.8, A1.red),
    figureA("amal", { x: 560, y: OUT_FLOOR, s: 1.5, mood: "happy" }),
    figureA("leo", { x: 840, y: OUT_FLOOR, s: 1.36, mood: "happy" })),

  page(gardenScene(), colourBall(1280, 880, 0.7, A1.red), motionArcs(1080, 640, 0.9), dustPuffs(900, 900),
    figureA("leo", { x: 720, y: OUT_FLOOR, s: 1.38, mood: "happy" })),

  page(gardenScene(), colourBall(1320, 890, 0.65, A1.red), dustPuffs(820, 900),
    figureA("leo", { x: 760, y: OUT_FLOOR, s: 1.36, mood: "sad" })),

  page(gardenScene(),
    figureA("leo", { x: 760, y: OUT_FLOOR, s: 1.36, mood: "sad" }),
    figureA("amal", { x: 1020, y: OUT_FLOOR, s: 1.5, mood: "surprised" })),

  page(gardenScene(),
    figureA("amal", { x: 700, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("leo", { x: 980, y: OUT_FLOOR, s: 1.36, mood: "sad" })),

  page(streetScene(), hospital(1180, 720, 0.72),
    figureA("amal", { x: 540, y: OUT_FLOOR, s: 1.48, mood: "happy", arms: "point" }),
    figureA("leo", { x: 780, y: OUT_FLOOR, s: 1.34, mood: "sad" })),

  page(streetScene(), hospital(1240, 720, 0.6),
    figureA("faduma", { x: 860, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("leo", { x: 580, y: OUT_FLOOR, s: 1.34, mood: "sad" })),

  page(plainRoomScene(),
    figureA("faduma", { x: 700, y: CLASS_FLOOR, s: 1.54, mood: "happy" }),
    figureA("leo", { x: 980, y: CLASS_FLOOR, s: 1.36, mood: "happy" }),
    figureA("amal", { x: 1220, y: CLASS_FLOOR, s: 1.46, mood: "happy" })),

  page(plainRoomScene(),
    figureA("leo", { x: 820, y: CLASS_FLOOR, s: 1.38, mood: "happy", arms: "up" }),
    figureA("faduma", { x: 1120, y: CLASS_FLOOR, s: 1.52, mood: "happy" })),

  page(streetScene(), hospital(1300, 720, 0.5),
    figureA("leo", { x: 640, y: OUT_FLOOR, s: 1.36, mood: "happy", arms: "up" }),
    figureA("faduma", { x: 920, y: OUT_FLOOR, s: 1.52, mood: "happy" }),
    figureA("amal", { x: 1160, y: OUT_FLOOR, s: 1.46, mood: "happy" })),

  page(gardenScene(), colourBall(1180, 870, 0.8, A1.red), confetti(860, 330, 0.95),
    figureA("amal", { x: 600, y: OUT_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("leo", { x: 880, y: OUT_FLOOR, s: 1.38, mood: "happy", arms: "up" })),
];

// ================================================================ UNIT 10
// My First English World — Amal's book goes home, and the feelings words

// ---------------------------------------------------------------- 10.6 Amal Reads Her Book
// Continues "Show Me Your Book" and "Amal's English Year": the made book comes
// home, and Amal reads it to Hodan and baby Idris.

const amalReadsHerBook = [
  page(homeWall(), madeBook(1240, 800, 0.7, { title: "My First English World" }),
    figureA("amal", { x: 720, y: HOME_FLOOR, s: 1.55, mood: "happy", arms: "up" })),

  page(homeWall(), madeBook(1240, 800, 0.7, { title: "My Book" }),
    figureA("amal", { x: 760, y: HOME_FLOOR, s: 1.55, mood: "happy" })),

  page(homeWall(),
    figureA("amal", { x: 520, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 800, y: HOME_FLOOR, s: 1.4, mood: "happy" }),
    babyIdris(1040, HOME_FLOOR, 1.2)),

  page(homeWall(), madeBook(1180, 790, 0.8, { title: "My Book" }),
    figureA("amal", { x: 640, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    figureA("hodan", { x: 900, y: HOME_FLOOR, s: 1.38, mood: "happy" })),

  page(homeWall(), pictureCard(1180, 440, 0.85, { inner: childDrawing(0, 20, 0.55) }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.5, mood: "happy", arms: "point" }),
    figureA("hodan", { x: 840, y: HOME_FLOOR, s: 1.38, mood: "happy" })),

  page(homeWall(), madeBook(1180, 780, 0.95, { title: "My Family" }),
    figureA("amal", { x: 600, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" })),

  page(homeWall(), pictureCard(1180, 440, 0.9, { inner: townBus(0, 40, 0.5) }),
    figureA("amal", { x: 560, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "point" }),
    babyIdris(860, HOME_FLOOR, 1.2)),

  page(homeWall(),
    babyIdris(880, HOME_FLOOR, 1.35),
    figureA("amal", { x: 500, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    figureA("hodan", { x: 900, y: HOME_FLOOR, s: 1.44, mood: "happy", arms: "up" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, mood: "happy" })),

  page(homeWall(),
    figureA("hana", { x: 1020, y: HOME_FLOOR, s: 1.56, mood: "happy" }),
    figureA("amal", { x: 680, y: HOME_FLOOR, s: 1.52, mood: "happy" })),

  page(homeWall(), madeBook(1260, 810, 0.6, { title: "My Book" }),
    figureA("amal", { x: 620, y: HOME_FLOOR, s: 1.5, mood: "happy" }),
    figureA("hodan", { x: 900, y: HOME_FLOOR, s: 1.4, mood: "happy" })),

  page(homeWall(), confetti(820, 300, 0.9),
    figureA("hana", { x: 360, y: HOME_FLOOR, s: 1.48, mood: "happy" }),
    figureA("amal", { x: 640, y: HOME_FLOOR, s: 1.52, mood: "happy", arms: "up" }),
    figureA("hodan", { x: 900, y: HOME_FLOOR, s: 1.4, mood: "happy", arms: "up" }),
    babyIdris(1140, HOME_FLOOR, 1.15)),
];

// ---------------------------------------------------------------- 10.7 The Little Chick's Big Day
// The unit's feelings words (excited, worried, afraid, calm, happy, tired) in
// a story: a chick's first walk to the big tree.

const theLittleChicksBigDay = [
  page(basicScene(), barn(1240, 700, 1.1), fence(380, 880, 1, 3),
    hen({ x: 640, y: 822, s: 1.15, mood: "happy" }),
    chick(900, 890, 1, "happy")),

  page(basicScene(), barn(1300, 710, 1), haystack(300, 890, 0.9),
    hen({ x: 620, y: 822, s: 1.15, mood: "happy" }),
    chick(880, 885, 1.1, "happy")),

  page(basicScene(), barn(1340, 715, 0.9), acacia(280, 630, 1),
    chick(880, 885, 1.1, "happy"),
    hen({ x: 1140, y: 835, s: 0.95, mood: "happy" })),

  page(basicScene(), barn(1320, 710, 0.95),
    hen({ x: 1040, y: 822, s: 1.15, mood: "happy" }),
    chick(720, 885, 1.1, "happy")),

  page(basicScene(), tallGrass(1000, 930, 1.5), tallGrass(1180, 900, 1.2), tallGrass(820, 910, 1.3),
    chick(640, 885, 1.1, "surprised")),

  page(basicScene(), tallGrass(400, 920, 1.2),
    lulu({ x: 1000, y: 380, s: 1.6, flying: true }),
    chick(700, 885, 1.1, "surprised")),

  page(basicScene(), tallGrass(360, 920, 1.1),
    lulu({ x: 1040, y: 500, s: 1.45, flying: true, mood: "happy" }),
    chick(720, 885, 1.1, "happy")),

  page(basicScene(), acacia(1400, 630, 1),
    lulu({ x: 1000, y: 520, s: 1.4, mood: "happy" }),
    chick(700, 885, 1.05, "happy")),

  page(basicScene(), acacia(1380, 620, 1.05), dustPuffs(900, 900),
    lulu({ x: 1020, y: 480, s: 1.45, flying: true, mood: "happy" }),
    chick(760, 885, 1.05, "happy")),

  page(basicScene(), acacia(1150, 600, 1.45),
    giraffe({ x: 420, y: 630, s: 0.92, glasses: true }),
    chick(880, 885, 1.1, "happy"),
    lulu({ x: 1320, y: 470, s: 1.4, mood: "happy" })),

  page(basicScene(), acacia(1150, 600, 1.45),
    giraffe({ x: 700, y: 620, s: 1, glasses: true, bend: true }),
    chick(1060, 885, 1.1, "happy")),

  page(nightScene(), barn(1300, 705, 1),
    hen({ x: 640, y: 822, s: 1.15, mood: "happy" }),
    chick(880, 890, 1, "happy")),
];

// ---------------------------------------------------------------- books

const books = {
  // Unit 6
  "the-savanna-band": { dir: "the-savanna-band", pages: theSavannaBand },
  "clean-from-head-to-foot": { dir: "clean-from-head-to-foot", pages: cleanFromHeadToFoot },
  // Unit 7
  "a-day-by-the-sea": { dir: "a-day-by-the-sea", pages: aDayByTheSea },
  "duku-plays-hide-and-seek": { dir: "duku-plays-hide-and-seek", pages: dukuPlaysHideAndSeek },
  // Unit 8
  "after-the-rain": { dir: "after-the-rain", pages: afterTheRain },
  "musa-and-the-weather": { dir: "musa-and-the-weather", pages: musaAndTheWeather },
  // Unit 9
  "amal-at-the-library": { dir: "amal-at-the-library", pages: amalAtTheLibrary },
  "the-kind-doctor": { dir: "the-kind-doctor", pages: theKindDoctor },
  // Unit 10
  "amal-reads-her-book": { dir: "amal-reads-her-book", pages: amalReadsHerBook },
  "the-little-chicks-big-day": { dir: "the-little-chicks-big-day", pages: theLittleChicksBigDay },
};

writeBooks(books, process.argv[2]);
