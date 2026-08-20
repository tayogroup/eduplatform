#!/usr/bin/env node

// Generates the vector illustrations for the Grade 2 picture-book series —
// one book per unit, the same shape Grade 1 uses:
//   1  Zuri's First Week            Unit 1  Welcome and Calendar
//   2  Who Helps Our Street?        Unit 2  Good Neighbours and Jobs
//   3  Move Like Me                 Unit 3  Ready, Steady, Go!
//   4  Zuri and Her Shadow          Unit 4  The Big Sky
//   5  How Tall? How Long?          Unit 5  Let's Measure
//   6  The Six-Leg Club             Unit 6  All About Bugs
//   7  One Small Seed               Unit 7  The World Around Us
//   8  Every Home Is Different      Unit 8  Home, Sweet Home
//   9  A Day in the Big City        Unit 9  Let's Explore the City!
//   10 Zuri's Book of the Year      Unit 10 Capstone
//
// Same storyworld as the Grade 1 books, a year on: Musa, Kiki, Duku, Lulu and
// Miss Twiga all return, and the new lead is Zuri the meerkat. The cast and
// scenery come from tools/lib/ehel-ebook-kit.js unchanged — Grade 2 additions
// live in tools/lib/ehel-ebook-kit-grade2.js, so nothing here can repaint a
// page a Grade 1 learner has already read.
//
// Usage: node tools/create-grade2-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks,
  giraffe, elephant, ostrich, monkey, kiki, donkey, hen, goat, chick, wildBird, lulu, zebra,
  sky, sun, hills, ground, tallGrass, acacia, nightScene, basicScene,
  chalkboard, bench, schoolBell, baobabHome, playBall, mango, marketStall, seedRow, nest,
  cityBuildings, lampPost, clockTower, lake, kite, dustPuffs, confetti, sunnyPatch, fish,
  G2, zuri,
  daylightScene, streetScene, gardenScene, roomScene, sunsetScene, aquariumRoom,
  calendarBoard, colourChart, bookShelf, openBook, tabletProp, greetingCard,
  shopRow, townBus, fireEngine, ladder, cleaningKit, fireKit, crossing, clinicFront, doctorKit, notepad,
  motionArcs, fruitBowl, waterBottle, sleepyZs,
  castShadow, cloudPuff, lowSun,
  rulerProp, metreStick, shapeTile, patternStrip, balanceScale, feather, tensLine,
  butterflyBug, beeBug, antBug, anthill, spiderWeb, spiderBug, wormBug, cricketBug, fallenLog, flatStone, gardenPlant,
  seedProp, dugHole, plantStage, plantParts, wateringCan, litterBits, recycleBin, sapling,
  house, flatBlock, hut, treeHouse, beehive, burrow, roomBox, worldHome,
  libraryBuilding, shoppingCentre, ferrisWheel, undergroundTrain, ferryBoat, helicopterProp, mapProp, trafficRow,
  aquariumTank, octopus, penguin, seaTurtle, shark,
  lookLine, bunting, easel,
} = require("./lib/ehel-ebook-kit-grade2.js");

// ---------------------------------------------------------------- local scenes

// The tree school Zuri and Kiki attend: the Grade 1 classroom, one year on.
const schoolScene = () => `${basicScene()}${acacia(1210, 600, 1.45)}${schoolBell(250, 850, 0.95)}`;

// The same school with the sun somewhere else — for the pages that are ABOUT
// where the sun is. basicScene() paints a sun of its own, so those pages used to
// draw a second one beside it and the Shadow book showed two suns in the sky.
const schoolNoonScene = (sunX, sunY) => `${daylightScene(sunX, sunY)}${acacia(1210, 600, 1.45)}${schoolBell(250, 850, 0.95)}`;

// A night wash laid OVER a daytime scene, so the town keeps its own shapes
// after dark instead of borrowing the savanna's night ground.
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

// A dim underground platform: tiled wall, no sky.
const platformScene = () => `<rect width="${W}" height="${H}" fill="#3c4657"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((r) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => `<rect x="${c * 160 + (r % 2 ? -80 : 0)}" y="${r * 80}" width="152" height="72" rx="6" fill="#4a5668" stroke="#38414f" stroke-width="4"/>`).join("")).join("")}
  <rect x="0" y="620" width="${W}" height="${H - 620}" fill="#6d6a63"/>
  <path d="M 0 620 h ${W}" stroke="#8f8a80" stroke-width="10"/>
  <path d="M 0 700 h ${W}" stroke="${G2.awningGold}" stroke-width="12" stroke-dasharray="46 34"/>`;

// ================================================================ Book 1
// Zuri's First Week — Unit 1: Welcome and Calendar

const firstWeekPages = [
  // 1 cover: the whole class under the school acacia, calendar on its easel
  `${schoolScene()}${chalkboard(1180, 840, 1)}
   ${calendarBoard(360, 690, 0.92, { ring: 12 })}
   ${giraffe({ x: 760, y: 620, s: 0.92, glasses: true })}
   ${elephant({ x: 1450, y: 780, s: 0.58 })}
   ${ostrich({ x: 1010, y: 750, s: 0.52 })}
   ${kiki({ x: 900, y: 830, s: 1.05, arms: "up" })}
   ${zuri({ x: 620, y: 821, s: 1.2, book: true })}`,

  // 2 "My name is Zuri" — spelling it out to the class
  `${schoolScene()}${bench(1220, 900, 1.2)}
   ${giraffe({ x: 1120, y: 620, s: 0.88, glasses: true, bend: true })}
   ${kiki({ x: 1330, y: 840, s: 0.95 })}
   ${zuri({ x: 520, y: 808, s: 1.3, arms: "up" })}
   ${openBook(880, 878, 0.85)}`,

  // 3 Miss Twiga makes them partners
  `${schoolScene()}${chalkboard(1300, 850, 0.9)}
   ${giraffe({ x: 430, y: 620, s: 1, glasses: true, bend: true })}
   ${zuri({ x: 830, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1030, y: 836, s: 1.05, arms: "up" })}`,

  // 4 the big class calendar
  `${schoolScene()}
   ${calendarBoard(800, 700, 1.35, { ring: 12 })}
   ${zuri({ x: 350, y: 827, s: 1.15, pointing: true })}
   ${kiki({ x: 1290, y: 836, s: 1.05, arms: "up" })}`,

  // 5 writing the first day and the second day
  `${schoolScene()}
   ${calendarBoard(1080, 700, 1.15, { ring: 1 })}
   ${zuri({ x: 430, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 680, y: 836, s: 1.05, arms: "up" })}
   ${lookLine(520, 700, 900, 640)}`,

  // 6 the colour chart
  `${schoolScene()}
   ${colourChart(800, 372, 1.25)}
   ${zuri({ x: 560, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 1040, y: 836, s: 1.05, pointing: true })}`,

  // 7 counting the books on the shelf
  `${schoolScene()}
   ${bookShelf(880, 760, 1.15, { count: 12 })}
   ${zuri({ x: 400, y: 821, s: 1.2, pointing: true })}
   ${elephant({ x: 1350, y: 800, s: 0.6, trunkUp: true })}`,

  // 8 "What do you like, Zuri?"  "I like words."
  `${schoolScene()}${bench(1160, 910, 1.3)}
   ${giraffe({ x: 1180, y: 620, s: 0.9, glasses: true, bend: true })}
   ${zuri({ x: 520, y: 808, s: 1.3, book: true, arms: "up" })}
   ${openBook(1160, 852, 0.8)}`,

  // 9 English words all around her — chart, book and tablet
  `${schoolScene()}${chalkboard(390, 820, 1.15)}
   ${tabletProp(1180, 780, 1.25)}
   ${openBook(800, 868, 1)}
   ${zuri({ x: 620, y: 828, s: 1.15, pointing: true })}
   ${lookLine(700, 720, 430, 750)}${lookLine(880, 730, 1140, 770)}`,

  // 10 Kiki spots her birthday on the twelfth
  `${schoolScene()}
   ${calendarBoard(900, 690, 1.2, { ring: 12 })}
   ${kiki({ x: 400, y: 816, s: 1.2, arms: "up" })}
   ${zuri({ x: 620, y: 834, s: 1.1, pointing: true })}
   ${lookLine(470, 700, 800, 660)}`,

  // 11 the class makes a birthday card
  `${schoolScene()}${bench(880, 930, 1.5)}
   ${greetingCard(880, 812, 1.35)}
   ${zuri({ x: 560, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1120, y: 836, s: 1.05, arms: "up" })}
   ${elephant({ x: 1400, y: 800, s: 0.56 })}
   ${ostrich({ x: 250, y: 790, s: 0.5 })}`,

  // 12 goodbye until next week — two friends now
  `${schoolScene()}${acacia(300, 640, 0.95)}
   ${kiki({ x: 1060, y: 829, s: 1.1, arms: "up" })}
   ${zuri({ x: 660, y: 815, s: 1.25, arms: "up", book: true })}
   ${motionArcs(1180, 762, 1)}${sunnyPatch(820, 940)}`,
];

// ================================================================ Book 2
// Who Helps Our Street? — Unit 2: Good Neighbours and Jobs

const helpsOurStreetPages = [
  // 1 cover: the whole street, everybody at work
  `${streetScene()}${shopRow(880, 700, 0.95)}
   ${lampPost(310, 700, 0.85)}
   ${townBus(1240, 880, 0.62)}
   ${crossing(520, 800, 0.8, { sign: true })}
   ${zuri({ x: 560, y: 815, s: 1.25, book: true })}
   ${monkey({ x: 200, y: 860, s: 0.66 })}`,

  // 2 Zuri watches the neighbours go to work
  `${streetScene()}${shopRow(1060, 700, 0.9)}
   ${lampPost(690, 700, 0.9)}
   ${burrow(240, 832, 0.8)}
   ${zuri({ x: 300, y: 815, s: 1.25, book: true })}
   ${goat({ x: 880, y: 880, s: 0.5 })}
   ${hen({ x: 1080, y: 890, s: 0.5 })}`,

  // 3 the bus driver
  `${streetScene()}${shopRow(360, 690, 0.72)}
   ${townBus(1000, 900, 0.92)}
   ${goat({ x: 470, y: 862, s: 0.62 })}
   ${zuri({ x: 250, y: 827, s: 1.15, arms: "up" })}`,

  // 4 the window cleaner up his ladder
  `${streetScene()}${shopRow(900, 700, 1)}
   ${ladder(700, 890, 0.95, { lean: -12 })}
   ${monkey({ x: 648, y: 690, s: 0.62, arms: "up" })}
   ${cleaningKit(400, 900, 1.1)}
   ${zuri({ x: 250, y: 834, s: 1.1, pointing: true })}`,

  // 5 the police officer at the crossing
  `${streetScene()}${shopRow(1180, 690, 0.72)}
   ${crossing(660, 830, 1.05, { sign: true })}
   ${ostrich({ x: 1090, y: 789, s: 0.72 })}
   ${zuri({ x: 470, y: 827, s: 1.15, book: true })}
   ${kiki({ x: 300, y: 843, s: 1 })}`,

  // 6 the fire engine races past
  `${streetScene()}${shopRow(1220, 690, 0.68)}
   ${fireEngine(700, 890, 1.02)}
   ${dustPuffs(330, 920)}${motionArcs(400, 830, 1.4)}
   ${zuri({ x: 190, y: 840, s: 1.05, mood: "surprised", arms: "up" })}`,

  // 7 rescuing the kite from the tree
  `${streetScene()}${acacia(1050, 640, 1.35)}
   ${kite(1090, 470, 0.95, { stuck: true })}
   ${ladder(940, 880, 1.02, { lean: 10 })}
   ${elephant({ x: 620, y: 845, s: 0.66, trunkUp: true })}
   ${zuri({ x: 330, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 180, y: 843, s: 1, arms: "up" })}`,

  // 8 the doctor and the nurse at the clinic
  `${streetScene()}${clinicFront(1090, 720, 0.86)}
   ${doctorKit(560, 900, 1.05)}
   ${giraffe({ x: 780, y: 700, s: 0.82, glasses: true, bend: true })}
   ${hen({ x: 400, y: 890, s: 0.52 })}
   ${zuri({ x: 220, y: 827, s: 1.15, arms: "up" })}`,

  // 9 Miss Twiga is teaching what a neighbour is
  `${schoolScene()}${chalkboard(1210, 850, 1)}${bench(760, 930, 1.4)}
   ${giraffe({ x: 480, y: 620, s: 0.95, glasses: true })}
   ${zuri({ x: 790, y: 827, s: 1.15, book: true })}
   ${kiki({ x: 990, y: 843, s: 1 })}`,

  // 10 the farmer growing and the shopkeeper counting
  `${basicScene()}${seedRow(340, 900, 0.9)}
   ${marketStall(1180, 860, 0.86)}
   ${donkey({ x: 400, y: 760, s: 0.72 })}
   ${hen({ x: 1170, y: 890, s: 0.56 })}
   ${zuri({ x: 780, y: 840, s: 1.05, book: true })}`,

  // 11 the reporter writes it all down
  `${streetScene()}${shopRow(1150, 690, 0.78)}
   ${notepad(700, 830, 1.3)}
   ${monkey({ x: 480, y: 858, s: 0.78 })}
   ${zuri({ x: 240, y: 827, s: 1.15, book: true })}`,

  // 12 that night, Zuri draws every helper
  `${streetScene({ lit: true })}${nightStars()}
   ${burrow(300, 872, 0.8)}
   ${nightWash()}
   ${shopRow(1080, 700, 0.86, { lit: true })}
   ${lampPost(700, 700, 0.95, { lit: true })}
   ${openBook(430, 880, 0.9)}
   ${zuri({ x: 300, y: 821, s: 1.2, book: true })}`,
];

// ================================================================ Book 3
// Move Like Me — Unit 3: Ready, Steady, Go!

const moveLikeMePages = [
  // 1 cover: Move Day under the bunting
  `${schoolScene()}${bunting(800, 200, 1.2, { span: 1100 })}
   ${giraffe({ x: 1290, y: 620, s: 0.86, glasses: true })}
   ${elephant({ x: 1080, y: 800, s: 0.6, trunkUp: true })}
   ${ostrich({ x: 300, y: 780, s: 0.58, pose: "run" })}
   ${kiki({ x: 900, y: 830, s: 1.05, arms: "up" })}
   ${zuri({ x: 620, y: 802, s: 1.35, arms: "up" })}
   ${motionArcs(430, 720, 1.2)}${motionArcs(1010, 720, 1.2, { flip: true })}`,

  // 2 "Stand up, everybody!"
  `${schoolScene()}${bench(1240, 930, 1.2)}
   ${giraffe({ x: 430, y: 620, s: 0.95, glasses: true })}
   ${zuri({ x: 830, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 1030, y: 836, s: 1.05, arms: "up" })}
   ${elephant({ x: 1300, y: 810, s: 0.56 })}`,

  // 3 head, arm, hand, finger
  `${schoolScene()}
   ${giraffe({ x: 1240, y: 620, s: 0.88, glasses: true, bend: true })}
   ${zuri({ x: 640, y: 783, s: 1.5, pointing: true })}
   ${kiki({ x: 990, y: 836, s: 1.05, pointing: true })}
   ${lookLine(700, 640, 640, 560)}`,

  // 4 everybody waves
  `${schoolScene()}
   ${elephant({ x: 1170, y: 800, s: 0.72, trunkUp: true })}
   ${kiki({ x: 950, y: 836, s: 1.05, arms: "up" })}
   ${zuri({ x: 560, y: 808, s: 1.3, arms: "up" })}
   ${motionArcs(400, 700, 1.3)}${motionArcs(1040, 700, 1.1, { flip: true })}`,

  // 5 hopping, and Kiki hops the highest
  `${schoolScene()}
   ${kiki({ x: 900, y: 690, s: 1.15, arms: "up" })}
   ${dustPuffs(900, 900)}
   ${zuri({ x: 560, y: 821, s: 1.2, arms: "up" })}
   ${ostrich({ x: 1290, y: 790, s: 0.6, pose: "run" })}
   ${motionArcs(760, 640, 1.4)}`,

  // 6 jump, clap and turn around
  `${schoolScene()}${bunting(800, 190, 1, { span: 900 })}
   ${zuri({ x: 470, y: 800, s: 1.25, arms: "up" })}
   ${kiki({ x: 800, y: 810, s: 1.1, arms: "up" })}
   ${elephant({ x: 1160, y: 810, s: 0.62, trunkUp: true })}
   ${dustPuffs(470, 900)}${dustPuffs(820, 910)}
   ${motionArcs(320, 690, 1.2)}${motionArcs(1000, 690, 1.2, { flip: true })}`,

  // 7 wiggle, nod, flap and reach
  `${schoolScene()}
   ${ostrich({ x: 1130, y: 780, s: 0.75, fanning: true })}
   ${wildBird(560, 380, 1.1, true)}${wildBird(880, 300, 0.9, true)}
   ${zuri({ x: 620, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 330, y: 836, s: 1.05, arms: "up" })}`,

  // 8 Musa runs three times round the field
  `${basicScene()}${acacia(1400, 620, 1)}${tallGrass(180, 930, 1.3)}
   ${zebra({ x: 800, y: 700, s: 1.05, pose: "run" })}
   ${dustPuffs(520, 890)}${motionArcs(430, 730, 1.5)}
   ${zuri({ x: 250, y: 840, s: 1.05, arms: "up" })}`,

  // 9 fruit and cool water
  `${schoolScene()}${bench(820, 930, 1.6)}
   ${fruitBowl(560, 800, 1.2)}
   ${waterBottle(1010, 810, 1.15)}
   ${zuri({ x: 350, y: 821, s: 1.2 })}
   ${kiki({ x: 1230, y: 836, s: 1.05, arms: "up" })}`,

  // 10 exercise every day gives you energy
  `${schoolScene()}${chalkboard(1220, 850, 1.05)}${sunnyPatch(700, 930)}
   ${giraffe({ x: 430, y: 620, s: 0.95, glasses: true })}
   ${zuri({ x: 800, y: 815, s: 1.25, arms: "up" })}
   ${motionArcs(650, 700, 1.1)}`,

  // 11 and sleep well at night
  `${sunsetScene()}${acacia(1330, 640, 1.05)}${bench(560, 930, 1.3)}
   ${kiki({ x: 560, y: 816, s: 1.2 })}
   ${sleepyZs(660, 700, 1.4)}
   ${zuri({ x: 900, y: 827, s: 1.15 })}`,

  // 12 home, tired and happy
  `${nightScene()}${burrow(1120, 880, 0.86)}
   ${zuri({ x: 620, y: 808, s: 1.3 })}
   ${sleepyZs(730, 690, 1.5)}`,
];

// ================================================================ Book 4
// Zuri and Her Shadow — Unit 4: The Big Sky

const shadowPages = [
  // 1 cover: early sun, one small meerkat, one very long shadow
  `${sky()}${lowSun(280, 470)}${hills()}${ground()}
   ${acacia(1350, 640, 1.15)}${cloudPuff(1030, 250, 0.9)}
   ${castShadow(900, 951, { length: 470, dir: 1, height: 54 })}
   ${zuri({ x: 900, y: 783, s: 1.5, book: true })}`,

  // 2 the sun comes up and something long appears
  `${sky()}${lowSun(240, 500)}${hills()}${ground()}
   ${tallGrass(1420, 930, 1.2)}
   ${castShadow(760, 953, { length: 520, dir: 1, height: 50 })}
   ${zuri({ x: 760, y: 802, s: 1.35, mood: "surprised" })}`,

  // 3 "Who are you?"
  `${sky()}${lowSun(300, 520)}${hills()}${ground()}
   ${castShadow(700, 952, { length: 460, dir: 1, height: 48 })}
   ${zuri({ x: 700, y: 795, s: 1.4, pointing: true })}
   ${lookLine(760, 800, 1090, 880)}`,

  // 4 the shadow copies everything she does
  `${sky()}${lowSun(260, 510)}${hills()}${ground()}
   ${tallGrass(1440, 950, 1.1)}
   ${castShadow(660, 926, { length: 520, dir: 1, height: 52 })}
   ${dustPuffs(660, 930)}
   ${zuri({ x: 660, y: 780, s: 1.3, arms: "up" })}
   ${motionArcs(500, 700, 1.2)}${motionArcs(830, 700, 1.2, { flip: true })}`,

  // 5 at midday the sun is high and the shadow is tiny
  `${daylightScene(800, 150)}${acacia(1330, 630, 1)}
   ${castShadow(760, 952, { length: 90, dir: 1, height: 34 })}
   ${zuri({ x: 760, y: 795, s: 1.4, mood: "surprised", pointing: true })}
   ${sunnyPatch(800, 940)}`,

  // 6 Miss Twiga explains light, blocking and shadow
  `${schoolNoonScene(1180, 160)}${chalkboard(1230, 850, 1.05)}
   ${giraffe({ x: 470, y: 620, s: 0.95, glasses: true, bend: true })}
   ${castShadow(860, 955, { length: 210, dir: -1, height: 40 })}
   ${zuri({ x: 860, y: 821, s: 1.2, book: true })}
   ${lookLine(1120, 260, 900, 660)}`,

  // 7 in the evening the shadow grows long again
  `${sky()}${lowSun(1360, 500)}${hills()}${ground()}
   ${house(320, 900, 0.72)}
   ${castShadow(980, 953, { length: 520, dir: -1, height: 52 })}
   ${zuri({ x: 980, y: 802, s: 1.35, arms: "up" })}`,

  // 8 sunset: the sky turns orange and pink
  `${sunsetScene()}${acacia(280, 650, 1.1)}
   ${castShadow(1000, 954, { length: 380, dir: -1, height: 44, opacity: 0.26 })}
   ${zuri({ x: 1000, y: 808, s: 1.3 })}
   ${wildBird(560, 330, 1, true)}${wildBird(760, 260, 0.85, true)}`,

  // 9 night, and the moon and the stars
  `${nightScene()}${acacia(1330, 650, 1.05)}
   ${zuri({ x: 700, y: 795, s: 1.4, arms: "up" })}
   ${lookLine(780, 700, 1250, 260)}`,

  // 10 Mama says the shadow is waiting for the light
  `${nightScene()}${burrow(1130, 880, 0.9)}
   ${zuri({ x: 980, y: 776, s: 1.55 })}
   ${zuri({ x: 720, y: 827, s: 1.15, book: true })}`,

  // 11 a grey, cloudy morning — no sun, no shadow
  `${sky(true)}${hills()}${ground()}
   ${cloudPuff(420, 230, 1.25, { grey: true })}${cloudPuff(900, 180, 1.5, { grey: true })}${cloudPuff(1330, 260, 1.1, { grey: true })}
   ${acacia(1360, 650, 1)}
   ${zuri({ x: 700, y: 802, s: 1.35, mood: "sad" })}`,

  // 12 the clouds move, and the shadow comes back
  `${sky()}${lowSun(330, 480)}${hills()}${ground()}
   ${cloudPuff(1120, 220, 1.1)}${cloudPuff(1420, 300, 0.85)}
   ${castShadow(780, 951, { length: 500, dir: 1, height: 52 })}
   ${zuri({ x: 780, y: 789, s: 1.45, arms: "up" })}
   ${sunnyPatch(700, 940)}`,
];

// ================================================================ Book 5
// How Tall? How Long? — Unit 5: Let's Measure

const measurePages = [
  // 1 cover: rulers, shapes and two measurers
  `${schoolScene()}${chalkboard(1200, 850, 1)}
   ${rulerProp(760, 380, 1.1, { rotate: -8 })}
   ${shapeTile(360, 452, 1, "circle", "#7fa8d9")}${shapeTile(1150, 442, 0.9, "triangle", "#e76f51")}
   ${zuri({ x: 620, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 900, y: 829, s: 1.1, arms: "up" })}`,

  // 2 a ruler for every pupil
  `${schoolScene()}${bench(1140, 930, 1.4)}
   ${giraffe({ x: 430, y: 620, s: 0.95, glasses: true, bend: true })}
   ${rulerProp(880, 720, 0.95, { rotate: -14 })}
   ${zuri({ x: 800, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1080, y: 836, s: 1.05, arms: "up" })}`,

  // 3 measuring the book: twenty centimetres
  `${schoolScene()}
   ${openBook(880, 838, 1.35)}
   ${rulerProp(880, 742, 1)}
   ${zuri({ x: 380, y: 815, s: 1.25, pointing: true })}
   ${lookLine(460, 730, 720, 640)}`,

  // 4 measuring the bench: one metre
  `${schoolScene()}${bench(920, 900, 1.9)}
   ${rulerProp(920, 800, 1.15, { length: 340 })}
   ${kiki({ x: 380, y: 816, s: 1.2, pointing: true })}
   ${zuri({ x: 1330, y: 840, s: 1.05, book: true })}`,

  // 5 who is tall, who is small
  `${schoolScene()}
   ${metreStick(1000, 900, 1.15)}
   ${giraffe({ x: 700, y: 620, s: 1.05, glasses: true })}
   ${chick(1180, 890, 0.5)}
   ${zuri({ x: 350, y: 821, s: 1.2, book: true })}`,

  // 6 heavy and light on the pan balance
  `${schoolScene()}
   ${balanceScale(1080, 900, 1.05, { tilt: -9, left: mango(0, 0, 1.5), right: feather(0, -10, 0.9) })}
   ${elephant({ x: 470, y: 800, s: 0.66 })}
   ${zuri({ x: 760, y: 827, s: 1.15, pointing: true })}`,

  // 7 shapes hiding in a house
  `${basicScene()}${house(1080, 880, 0.95)}
   ${zuri({ x: 340, y: 815, s: 1.25, pointing: true })}
   ${lookLine(430, 760, 900, 620)}${lookLine(430, 780, 1080, 800)}
   ${shapeTile(320, 452, 0.72, "triangle", "#e76f51")}${shapeTile(560, 462, 0.72, "square", "#7fa8d9")}`,

  // 8 the five shapes, drawn out
  `${schoolScene()}
   ${shapeTile(300, 520, 1.05, "circle", "#7fa8d9")}
   ${shapeTile(560, 520, 1.05, "square", "#8ab17d")}
   ${shapeTile(820, 520, 1.05, "triangle", "#f4c95d")}
   ${shapeTile(1090, 520, 1.05, "rectangle", "#9d82c4")}
   ${shapeTile(1360, 520, 1.05, "heart", "#e76f51")}
   ${zuri({ x: 700, y: 834, s: 1.1, book: true })}`,

  // 9 what comes next in the pattern?
  `${schoolScene()}
   ${patternStrip(830, 460, 1, { kinds: ["circle", "square"], cells: 5 })}
   ${kiki({ x: 340, y: 816, s: 1.2, pointing: true })}
   ${zuri({ x: 1330, y: 834, s: 1.1, book: true })}`,

  // 10 counting in tens all the way to one hundred
  `${schoolScene()}
   ${tensLine(800, 450, 1.15)}
   ${zuri({ x: 470, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 1130, y: 836, s: 1.05, arms: "up" })}
   ${elephant({ x: 1400, y: 850, s: 0.5 })}`,

  // 11 the path is long and narrow, the field is short and wide
  `${basicScene()}${acacia(240, 640, 0.95)}${tallGrass(1400, 930, 1.2)}
   <path d="M 700 700 q 60 140 -180 300 L 700 1000 q 120 -170 220 -300 z" fill="${G2.road}" stroke="${G2.kerb}" stroke-width="8"/>
   ${zuri({ x: 1150, y: 821, s: 1.2, pointing: true })}`,

  // 12 measuring is everywhere, you just have to look
  `${schoolScene()}${sunnyPatch(800, 930)}
   ${rulerProp(1180, 752, 1, { rotate: 12 })}
   ${shapeTile(400, 470, 0.8, "heart", "#e76f51")}
   ${zuri({ x: 760, y: 789, s: 1.45, book: true, arms: "up" })}`,
];

// ================================================================ Book 6
// The Six-Leg Club — Unit 6: All About Bugs

const sixLegPages = [
  // 1 cover: the whole tiny world at once
  `${gardenScene()}${gardenPlant(1240, 880, 1.15)}${gardenPlant(280, 900, 0.95)}
   ${butterflyBug(560, 330, 1.15)}${beeBug(1010, 300, 1)}
   ${spiderWeb(1430, 612, 0.62)}
   ${antBug(430, 930, 0.9)}${antBug(560, 940, 0.9)}
   ${zuri({ x: 780, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 1010, y: 836, s: 1.05, pointing: true })}`,

  // 2 "Come and look!" — a tiny world in the garden
  `${gardenScene()}${gardenPlant(1150, 890, 1.3)}${gardenPlant(1400, 900, 1)}
   ${zuri({ x: 520, y: 795, s: 1.4, arms: "up" })}
   ${kiki({ x: 260, y: 829, s: 1.1 })}
   ${lookLine(620, 720, 1080, 720)}`,

  // 3 a butterfly on a leaf
  `${gardenScene()}${gardenPlant(900, 890, 1.5)}
   ${butterflyBug(890, 690, 1.9)}
   ${zuri({ x: 330, y: 815, s: 1.25, pointing: true })}`,

  // 4 six legs, three body parts, two antennae
  `${gardenScene()}${gardenPlant(1330, 890, 1)}
   ${butterflyBug(780, 560, 2.1)}
   ${lookLine(640, 560, 470, 700)}${lookLine(880, 560, 1060, 700)}
   ${kiki({ x: 400, y: 823, s: 1.15, pointing: true })}
   ${zuri({ x: 1130, y: 834, s: 1.1, book: true })}`,

  // 5 an ant crawls under the stone
  `${gardenScene()}${flatStone(700, 880, 1.35)}
   ${antBug(430, 930, 1.25)}${antBug(600, 945, 1.15)}${antBug(950, 935, 1.1, { flip: true })}
   ${zuri({ x: 1210, y: 815, s: 1.25, pointing: true })}`,

  // 6 a line of ants marching to the anthill
  `${gardenScene()}${anthill(1180, 900, 1.1)}
   ${antBug(300, 950, 1.05, { carrying: true })}${antBug(470, 945, 1.05, { carrying: true })}
   ${antBug(640, 950, 1.05, { carrying: true })}${antBug(810, 945, 1.05, { carrying: true })}
   ${zuri({ x: 420, y: 830, s: 1.05, book: true })}`,

  // 7 a bee above the flowers
  `${gardenScene()}${gardenPlant(560, 890, 1.3)}${gardenPlant(1010, 900, 1.15)}${gardenPlant(1330, 890, 1)}
   ${beeBug(790, 686, 1.6)}
   ${zuri({ x: 250, y: 821, s: 1.2, pointing: true })}`,

  // 8 a cricket chirping between the grass
  `${gardenScene()}${tallGrass(560, 950, 1.6)}${tallGrass(1010, 950, 1.6)}
   ${cricketBug(800, 800, 1.7)}
   ${zuri({ x: 280, y: 821, s: 1.2, book: true })}
   ${lookLine(370, 760, 720, 740)}`,

  // 9 a spider spinning a web in front of the gate
  `${gardenScene()}${gardenPlant(1330, 890, 1)}
   ${spiderWeb(880, 612, 1.1)}
   ${spiderBug(880, 612, 1.05)}
   ${zuri({ x: 330, y: 815, s: 1.25, mood: "surprised", pointing: true })}`,

  // 10 eight legs, so a spider is not an insect
  `${gardenScene()}
   ${spiderWeb(1120, 596, 0.92)}${spiderBug(1120, 596, 0.95)}
   ${giraffe({ x: 620, y: 660, s: 0.88, glasses: true, bend: true })}
   ${zuri({ x: 300, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 480, y: 836, s: 1.05, pointing: true })}`,

  // 11 under the wet log, a worm with no legs at all
  `${gardenScene()}${fallenLog(760, 830, 1.05)}
   ${wormBug(790, 940, 1.3)}
   ${zuri({ x: 280, y: 815, s: 1.25, mood: "surprised" })}
   ${kiki({ x: 1310, y: 836, s: 1.05, pointing: true })}`,

  // 12 Zuri writes them all into her book
  `${gardenScene()}${gardenPlant(1360, 890, 1)}
   ${openBook(950, 812, 1.5)}
   ${butterflyBug(470, 560, 0.9)}${beeBug(1270, 566, 0.85)}${cricketBug(1350, 806, 0.8)}
   ${antBug(620, 950, 0.9)}
   ${zuri({ x: 420, y: 802, s: 1.35, book: true, arms: "up" })}`,
];

// ================================================================ Book 7
// One Small Seed — Unit 7: The World Around Us

const oneSmallSeedPages = [
  // 1 cover: one seed, one flower, one small gardener
  `${gardenScene()}${sapling(1330, 894, 1)}
   ${plantStage(980, 900, 1.5, "flower")}
   ${wateringCan(420, 880, 0.86)}
   ${seedProp(880, 898, 2.6)}
   ${zuri({ x: 700, y: 795, s: 1.4, arms: "up" })}
   ${butterflyBug(1130, 400, 0.9)}`,

  // 2 Miss Twiga gives every pupil one small seed
  `${gardenScene()}
   ${giraffe({ x: 500, y: 660, s: 0.95, glasses: true, bend: true })}
   ${seedProp(800, 828, 2.4)}
   ${zuri({ x: 950, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1180, y: 836, s: 1.05, arms: "up" })}`,

  // 3 digging a little hole in the dark soil
  `${gardenScene()}${dugHole(880, 890, 1.15)}
   ${zuri({ x: 540, y: 795, s: 1.4, pointing: true })}
   ${lookLine(630, 760, 830, 830)}`,

  // 4 the seed goes in, and the watering begins
  `${gardenScene()}${dugHole(1000, 890, 1)}
   ${wateringCan(680, 780, 1.05, { pouring: true })}
   ${zuri({ x: 470, y: 802, s: 1.35 })}`,

  // 5 day after day, nothing — roots grow first, out of sight
  `${gardenScene()}
   ${zuri({ x: 800, y: 802, s: 1.35, mood: "sad" })}
   ${zuri({ x: 1080, y: 776, s: 1.55 })}
   <path d="M 470 900 q -14 46 -48 74 M 470 900 q -4 60 -2 92 M 470 900 q 18 48 56 68" stroke="#c9a06c" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.85"/>
   ${seedProp(470, 895, 1.5)}`,

  // 6 a green stem, and two little leaves
  `${gardenScene()}
   ${plantStage(830, 900, 2, "sprout")}
   ${zuri({ x: 470, y: 802, s: 1.35, mood: "surprised", arms: "up" })}
   ${sunnyPatch(830, 930)}`,

  // 7 picking up the litter around the garden
  `${gardenScene()}${litterBits(950, 930, 1.05)}
   ${zuri({ x: 540, y: 808, s: 1.3, pointing: true })}
   ${kiki({ x: 1290, y: 829, s: 1.1 })}`,

  // 8 sorting it into the recycling bins
  `${gardenScene()}
   ${recycleBin(560, 900, 1.05, "paper")}${recycleBin(830, 900, 1.05, "tins")}${recycleBin(1100, 900, 1.05, "glass")}
   ${zuri({ x: 290, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1360, y: 836, s: 1.05 })}`,

  // 9 trees clean our air, so the class plants one
  `${gardenScene()}${sapling(1010, 894, 1.2)}
   ${giraffe({ x: 450, y: 660, s: 0.92, glasses: true })}
   ${zuri({ x: 740, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1300, y: 836, s: 1.05, arms: "up" })}`,

  // 10 water, soil and time
  `${gardenScene()}${sapling(1180, 894, 1.1)}
   ${wateringCan(760, 790, 1.1, { pouring: true })}
   ${zuri({ x: 530, y: 808, s: 1.3 })}`,

  // 11 at last, a flower — and new seeds inside it
  `${gardenScene()}
   ${plantStage(880, 890, 2.4, "flower")}
   ${butterflyBug(1210, 420, 1.1)}${beeBug(560, 360, 0.9)}
   ${zuri({ x: 430, y: 795, s: 1.4, arms: "up" })}`,

  // 12 thankful for the earth: roots, stem, leaves, flower, seeds
  `${gardenScene()}
   ${plantParts(980, 640, 0.95)}
   ${zuri({ x: 390, y: 802, s: 1.35, book: true })}
   ${lookLine(480, 760, 830, 700)}`,
];

// ================================================================ Book 8
// Every Home Is Different — Unit 8: Home, Sweet Home

const everyHomePages = [
  // 1 cover: five different homes on one page
  `${basicScene()}${acacia(1150, 640, 1.5)}${treeHouse(1430, 900, 0.6)}
   ${house(820, 900, 0.62)}${burrow(330, 920, 0.72)}
   ${nest(1078, 484, 1)}${beehive(1262, 470, 0.7)}
   ${zuri({ x: 400, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 640, y: 836, s: 1.05, arms: "up" })}`,

  // 2 Zuri's burrow: small, warm and safe
  `${basicScene()}${burrow(880, 900, 1.15)}${tallGrass(280, 940, 1.3)}
   ${zuri({ x: 470, y: 795, s: 1.4, arms: "up" })}`,

  // 3 Kiki's tree house, up in the big baobab
  `${basicScene()}${treeHouse(950, 940, 0.9)}
   ${kiki({ x: 480, y: 810, s: 1.25, arms: "up" })}
   ${zuri({ x: 280, y: 827, s: 1.15, book: true })}`,

  // 4 Musa has no house at all — the savanna is his home
  `${basicScene()}${acacia(1330, 630, 1.15)}${acacia(280, 650, 0.9)}${tallGrass(660, 940, 1.4)}
   ${zebra({ x: 900, y: 740, s: 1.05 })}
   ${zuri({ x: 300, y: 840, s: 1.05, book: true })}`,

  // 5 a nest of twigs, and a hive full of honey
  `${basicScene()}${acacia(1080, 620, 1.6)}
   ${nest(1090, 470, 1.4)}${wildBird(1130, 434, 0.95)}
   ${beehive(1290, 452, 1)}${beeBug(660, 620, 0.85)}
   ${zuri({ x: 780, y: 821, s: 1.2, pointing: true })}`,

  // 6 inside, there is a room for everything
  `${roomScene()}
   ${roomBox(470, 620, 0.86, "kitchen")}
   ${roomBox(1160, 620, 0.86, "living")}
   ${kiki({ x: 830, y: 823, s: 1.15, arms: "up" })}
   ${zuri({ x: 1010, y: 827, s: 1.15, book: true })}`,

  // 7 the kitchen and the dining room
  `${roomScene()}
   ${roomBox(430, 640, 0.95, "kitchen")}
   ${roomBox(1180, 640, 0.95, "dining")}
   ${zuri({ x: 800, y: 827, s: 1.15, pointing: true })}`,

  // 8 the living room: a soft sofa and a warm rug
  `${roomScene({ wall: "#eee0c8" })}
   ${roomBox(760, 620, 1.35, "living")}
   ${kiki({ x: 300, y: 823, s: 1.15 })}
   ${zuri({ x: 1330, y: 827, s: 1.15, book: true })}`,

  // 9 the bedroom and the bathroom
  `${roomScene({ wall: "#e3e6dd" })}
   ${roomBox(430, 640, 0.95, "bedroom")}
   ${roomBox(1180, 640, 0.95, "bathroom")}
   ${zuri({ x: 800, y: 827, s: 1.15, arms: "up" })}`,

  // 10 the jobs we do at home
  `${roomScene()}
   ${roomBox(1140, 630, 1, "dining")}
   ${roomBox(400, 630, 1, "bedroom")}
   ${kiki({ x: 620, y: 823, s: 1.15, arms: "up" })}
   ${zuri({ x: 880, y: 821, s: 1.2, arms: "up" })}`,

  // 11 homes from far away
  `${basicScene()}
   ${worldHome(280, 900, 0.72, "adobe")}
   ${worldHome(680, 900, 0.72, "stilt")}
   ${worldHome(1060, 900, 0.72, "cave")}
   ${worldHome(1420, 900, 0.72, "skyscraper")}
   ${zuri({ x: 830, y: 847, s: 1, book: true })}`,

  // 12 every home is different, and every home is somewhere you belong
  `${sunsetScene()}${treeHouse(1310, 940, 0.6)}${house(870, 930, 0.58)}${hut(560, 930, 0.56)}${burrow(230, 950, 0.62)}
   ${zuri({ x: 700, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 930, y: 836, s: 1.05, arms: "up" })}`,
];

// ================================================================ Book 9
// A Day in the Big City — Unit 9: Let's Explore the City!

const bigCityPages = [
  // 1 cover: the skyline, the wheel and the class
  `${sky()}${sun(280, 170)}${hills()}
   ${cityBuildings(760, 700, 0.95)}
   <rect x="0" y="700" width="${W}" height="${H - 700}" fill="${G2.road}"/>
   <path d="M 0 848 h ${W}" stroke="${G2.roadDark}" stroke-width="7" stroke-dasharray="58 44" opacity="0.7"/>
   ${ferrisWheel(1330, 420, 0.52)}
   ${townBus(430, 900, 0.62)}
   ${zuri({ x: 830, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 1030, y: 836, s: 1.05, arms: "up" })}`,

  // 2 the bus into the city, and traffic all around
  `${sky()}${sun(300, 160)}${hills()}
   ${cityBuildings(1010, 690, 0.72)}
   <rect x="0" y="700" width="${W}" height="${H - 700}" fill="${G2.road}"/>
   ${trafficRow(1180, 800, 0.62)}
   ${townBus(560, 900, 0.92)}
   ${zuri({ x: 180, y: 840, s: 1.05, arms: "up" })}`,

  // 3 a helicopter above the rooftops
  `${sky()}${sun(260, 160)}${hills()}
   ${cityBuildings(880, 700, 0.9)}
   <rect x="0" y="700" width="${W}" height="${H - 700}" fill="${G2.road}"/>
   ${helicopterProp(1130, 250, 1.05)}
   ${zuri({ x: 470, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 680, y: 829, s: 1.1, pointing: true })}`,

  // 4 reading the map: straight ahead
  `${streetScene()}${cityBuildings(1180, 690, 0.62)}
   ${mapProp(830, 806, 1.2)}
   ${giraffe({ x: 380, y: 690, s: 0.9, glasses: true, bend: true })}
   ${zuri({ x: 1060, y: 821, s: 1.2, pointing: true })}
   ${kiki({ x: 1250, y: 836, s: 1.05 })}`,

  // 5 the library: so many books, and so quiet
  `${streetScene()}${libraryBuilding(950, 780, 0.92)}
   ${zuri({ x: 340, y: 808, s: 1.3, book: true, arms: "up" })}
   ${kiki({ x: 540, y: 829, s: 1.1 })}`,

  // 6 the market, then the shopping centre
  `${streetScene()}${shoppingCentre(1150, 780, 0.72)}
   ${marketStall(430, 840, 0.86)}
   ${hen({ x: 420, y: 880, s: 0.5 })}
   ${zuri({ x: 760, y: 821, s: 1.2, pointing: true })}`,

  // 7 the underground: fast, dark and a little bit scary
  `${platformScene()}
   ${undergroundTrain(900, 700, 0.86)}
   ${zuri({ x: 300, y: 700, s: 1.25, mood: "surprised" })}
   ${kiki({ x: 490, y: 706, s: 1.05, mood: "surprised" })}`,

  // 8 the ferry across the water
  `${sky()}${sun(300, 160)}${hills()}
   ${cityBuildings(1130, 640, 0.62)}
   <rect x="0" y="640" width="${W}" height="${H - 640}" fill="${C.water}"/>
   <path class="anim-flow" d="M 0 780 h ${W} M 0 880 h ${W}" stroke="${C.waterLight}" stroke-width="8"/>
   ${ferryBoat(700, 840, 0.92)}
   ${lulu({ x: 340, y: 330, s: 0.8, flying: true })}`,

  // 9 at the aquarium, an octopus waves eight clever arms
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: octopus(60, -212, 1.3) + fish(-260, -140, 1.6) + fish(-160, -60, 1.2) })}
   ${zuri({ x: 340, y: 827, s: 1.15, arms: "up" })}`,

  // 10 a penguin dives, and a turtle sails slowly by
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: penguin(-230, -250, 1.05, { diving: true }) + seaTurtle(140, -180, 1.05) + fish(320, -300, 1.1) })}
   ${zuri({ x: 340, y: 834, s: 1.1, pointing: true })}
   ${kiki({ x: 1250, y: 843, s: 1, arms: "up" })}`,

  // 11 behind thick glass, a shark — huge, and dangerous
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: shark(-20, -220, 1.05) + fish(300, -330, 0.9) })}
   ${kiki({ x: 400, y: 829, s: 1.1, mood: "surprised" })}
   ${zuri({ x: 1220, y: 834, s: 1.1, mood: "surprised" })}`,

  // 12 up and up on the Ferris wheel as the city lights come on
  `${sunsetScene()}
   ${cityBuildings(560, 720, 0.86)}
   ${ferrisWheel(1160, 480, 0.78, { lit: true })}
   ${lampPost(300, 900, 0.95, { lit: true })}
   ${zuri({ x: 470, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 680, y: 836, s: 1.05, arms: "up" })}`,
];

// ================================================================ Book 10
// Zuri's Book of the Year — Unit 10 capstone

const bookOfTheYearPages = [
  // 1 cover: the exhibition, with one page on every easel
  `${schoolScene()}${bunting(800, 190, 1.2, { span: 1180 })}
   ${easel(1180, 900, 0.86, { inner: shapeTile(0, 0, 0.5, "heart", "#e76f51") })}
   ${easel(330, 900, 0.86, { inner: butterflyBug(0, 0, 0.72) })}
   ${zuri({ x: 760, y: 789, s: 1.45, book: true, arms: "up" })}
   ${kiki({ x: 970, y: 836, s: 1.05, arms: "up" })}`,

  // 2 "Make a book about your year"
  `${schoolScene()}${chalkboard(1230, 850, 1.05)}${bench(800, 940, 1.5)}
   ${giraffe({ x: 430, y: 620, s: 0.95, glasses: true, bend: true })}
   ${openBook(870, 780, 1.15)}
   ${zuri({ x: 700, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1050, y: 836, s: 1.05 })}`,

  // 3 page one: her name, spelled out
  `${schoolScene()}
   ${easel(950, 900, 1.15, { inner: greetingCard(0, -10, 0.86) })}
   ${zuri({ x: 430, y: 802, s: 1.35, arms: "up" })}`,

  // 4 page two: the neighbours who help
  `${schoolScene()}
   ${easel(950, 900, 1.15, { inner: townBus(0, 20, 0.24) })}
   ${notepad(1330, 862, 0.86)}${fireKit(470, 906, 0.6)}
   ${zuri({ x: 470, y: 815, s: 1.25, book: true })}`,

  // 5 page three: a head, two arms, two hands, ten fingers
  `${schoolScene()}
   ${easel(1060, 900, 1.1, { inner: zuri({ x: 0, y: 40, s: 0.4, arms: "up" }) })}
   ${zuri({ x: 560, y: 783, s: 1.5, arms: "up", pointing: false })}
   ${motionArcs(400, 730, 1.1)}`,

  // 6 page four: the sun, the light and her own long shadow
  `${schoolNoonScene(1290, 160)}
   ${easel(1060, 900, 1.1, { inner: shapeTile(0, 0, 0.42, "circle", "#f4c95d") })}
   ${castShadow(560, 953, { length: 320, dir: -1, height: 44 })}
   ${zuri({ x: 560, y: 802, s: 1.35, pointing: true })}`,

  // 7 page five: counting in tens to one hundred
  `${schoolScene()}
   ${tensLine(830, 430, 1.05)}
   ${easel(1290, 920, 0.86, { inner: shapeTile(0, 0, 0.42, "square", "#8ab17d") })}
   ${zuri({ x: 500, y: 808, s: 1.3, arms: "up" })}`,

  // 8 page six: a butterfly, a cricket and a busy little ant
  `${schoolScene()}
   ${butterflyBug(620, 380, 1.3)}${cricketBug(1080, 470, 1.15)}${antBug(830, 930, 1.15, { carrying: true })}
   ${easel(1330, 920, 0.82, { inner: butterflyBug(0, 0, 0.66) })}
   ${zuri({ x: 380, y: 808, s: 1.3, book: true })}`,

  // 9 page seven: planting, watering and picking up litter
  `${schoolScene()}
   ${plantStage(1010, 906, 1.5, "flower")}${wateringCan(760, 872, 0.9)}${recycleBin(1330, 912, 0.86, "paper")}
   ${zuri({ x: 420, y: 808, s: 1.3, arms: "up" })}`,

  // 10 page eight: a house, a flat and a hut
  `${schoolScene()}
   ${house(430, 900, 0.5)}${flatBlock(830, 900, 0.46)}${hut(1230, 900, 0.5)}
   ${zuri({ x: 830, y: 853, s: 0.95, book: true })}`,

  // 11 page nine: the library, the shopping centre and the underground
  `${schoolScene()}
   ${libraryBuilding(400, 880, 0.52)}${shoppingCentre(880, 880, 0.46)}
   ${undergroundTrain(1290, 860, 0.4)}
   ${zuri({ x: 830, y: 853, s: 0.95, arms: "up" })}`,

  // 12 the last page: all her friends, and Year 3 ahead
  `${schoolScene()}${bunting(800, 190, 1.2, { span: 1200 })}${confetti(800, 560)}
   ${giraffe({ x: 1420, y: 630, s: 0.82, glasses: true })}
   ${zebra({ x: 250, y: 740, s: 0.66 })}
   ${donkey({ x: 1180, y: 856, s: 0.48 })}
   ${elephant({ x: 500, y: 862, s: 0.46, trunkUp: true })}
   ${ostrich({ x: 1010, y: 786, s: 0.46 })}
   ${lulu({ x: 700, y: 330, s: 0.7, flying: true })}
   ${kiki({ x: 900, y: 836, s: 1.05, arms: "up" })}
   ${zuri({ x: 730, y: 789, s: 1.45, arms: "up", book: true })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "first-week": { dir: "zuris-first-week", pages: firstWeekPages },
  "our-street": { dir: "who-helps-our-street", pages: helpsOurStreetPages },
  "move-like-me": { dir: "move-like-me", pages: moveLikeMePages },
  "her-shadow": { dir: "zuri-and-her-shadow", pages: shadowPages },
  "how-tall": { dir: "how-tall-how-long", pages: measurePages },
  "six-leg-club": { dir: "the-six-leg-club", pages: sixLegPages },
  "one-seed": { dir: "one-small-seed", pages: oneSmallSeedPages },
  "every-home": { dir: "every-home-is-different", pages: everyHomePages },
  "big-city": { dir: "a-day-in-the-big-city", pages: bigCityPages },
  "book-of-the-year": { dir: "zuris-book-of-the-year", pages: bookOfTheYearPages },
};

writeBooks(books, process.argv[2]);
