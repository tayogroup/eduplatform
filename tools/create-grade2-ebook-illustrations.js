#!/usr/bin/env node

// Generates the vector illustrations for the Grade 2 picture-book series —
// THREE books per unit, each leaning on a different part of the unit beside it
// (the lead book, then one drawn from another of its readings, then one drawn
// from a vocabulary group the first two leave alone):
//   Unit 1  Welcome and Calendar     Zuri's First Week / The Word Hunt / This Is My Partner
//   Unit 2  Good Neighbours and Jobs Who Helps Our Street? / The Day the Fire Bell Rang / Zuri Asks the Questions
//   Unit 3  Ready, Steady, Go!       Move Like Me / Sports Day at the Tree School / Miss Twiga Says
//   Unit 4  The Big Sky              Zuri and Her Shadow / What Is the Weather Today? / Where Does the Sun Go?
//   Unit 5  Let's Measure            How Tall? How Long? / The Shape Hunt / Ten, Twenty, One Hundred!
//   Unit 6  All About Bugs           The Six-Leg Club / Where Is the Cricket? / The Ants and the Big Crumb
//   Unit 7  The World Around Us      One Small Seed / The Stream Clean-Up / Thank You, Tree
//   Unit 8  Home, Sweet Home         Every Home Is Different / A Room for Everything / Far Away Homes
//   Unit 9  Let's Explore the City!  A Day in the Big City / Ten O'Clock at the Aquarium / Which Way to the Library?
//   Unit 10 Capstone                 Zuri's Book of the Year / Zuri Makes a Plan / The Day of the Showcase
//
// A second and third book must not simply retell the first. Each one is pinned
// to a reading or a vocabulary group the others do not use — otherwise three
// books per unit is one book told three times, and the shelf gets longer
// without teaching anything more.
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
  raceBanner, fence, bigLeaf, thoughtBubble, puddle, rain, rainbow, waterSpray,
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

// ================================================================ Book 1b
// The Word Hunt — Unit 1: Welcome and Calendar (the "Words Around Us" reading)

const wordHuntPages = [
  // 1 cover: every place a word can hide, all on one page
  `${schoolScene()}${chalkboard(1250, 850, 1)}
   ${colourChart(760, 372, 1.1)}
   ${tabletProp(1360, 780, 1)}
   ${openBook(1060, 878, 0.9)}
   ${zuri({ x: 560, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 830, y: 836, s: 1.05, arms: "up" })}`,

  // 2 Miss Twiga sets the hunt
  `${schoolScene()}${chalkboard(1250, 850, 1)}${bench(760, 940, 1.4)}
   ${giraffe({ x: 460, y: 620, s: 0.95, glasses: true, bend: true })}
   ${zuri({ x: 830, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1040, y: 836, s: 1.05, arms: "up" })}`,

  // 3 the first word is on the chalkboard
  `${basicScene()}${acacia(300, 620, 1.35)}
   ${chalkboard(1000, 800, 1.5)}
   ${zuri({ x: 470, y: 815, s: 1.25, pointing: true })}
   ${lookLine(560, 730, 880, 700)}`,

  // 4 the second word is on a book
  `${schoolScene()}${bench(1210, 930, 1.3)}
   ${openBook(880, 828, 1.5)}
   ${zuri({ x: 470, y: 808, s: 1.3, book: true })}
   ${lookLine(560, 740, 760, 764)}`,

  // 5 the third word is on the tablet
  `${schoolScene()}
   ${tabletProp(950, 760, 1.5)}
   ${zuri({ x: 470, y: 802, s: 1.35, pointing: true })}
   ${kiki({ x: 1330, y: 836, s: 1.05 })}`,

  // 6 the colour chart is full of words
  `${schoolScene()}
   ${colourChart(830, 372, 1.3)}
   ${zuri({ x: 560, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1120, y: 829, s: 1.1, pointing: true })}`,

  // 7 red, blue, green, yellow, pink
  `${schoolScene()}
   ${shapeTile(300, 520, 1, "circle", "#d94f43")}
   ${shapeTile(560, 520, 1, "circle", "#7fa8d9")}
   ${shapeTile(820, 520, 1, "circle", "#8ab17d")}
   ${shapeTile(1080, 520, 1, "circle", "#f4c95d")}
   ${shapeTile(1340, 520, 1, "circle", "#e78fb3")}
   ${zuri({ x: 700, y: 834, s: 1.1, book: true })}`,

  // 8 counting the words: one to twelve
  `${schoolScene()}
   ${bookShelf(900, 760, 1.2, { count: 12 })}
   ${zuri({ x: 400, y: 821, s: 1.2, pointing: true })}
   ${elephant({ x: 1380, y: 800, s: 0.56, trunkUp: true })}`,

  // 9 a word on the side of the bus
  `${streetScene()}${shopRow(400, 690, 0.72)}
   ${townBus(1020, 900, 0.9)}
   ${zuri({ x: 280, y: 827, s: 1.15, arms: "up" })}
   ${kiki({ x: 500, y: 843, s: 1, pointing: true })}`,

  // 10 a word on the market sign
  `${streetScene()}${shopRow(1200, 690, 0.8)}
   ${marketStall(760, 860, 0.95)}
   ${hen({ x: 750, y: 890, s: 0.52 })}
   ${zuri({ x: 300, y: 821, s: 1.2, book: true })}`,

  // 11 at the burrow that night, she writes them all down
  `${nightScene()}${burrow(1180, 880, 0.9)}
   ${openBook(950, 880, 0.95)}
   ${zuri({ x: 560, y: 808, s: 1.3, book: true })}`,

  // 12 twelve words found, and one more tomorrow
  `${schoolScene()}${sunnyPatch(830, 940)}
   ${openBook(1090, 852, 1)}
   ${zuri({ x: 700, y: 789, s: 1.45, book: true, arms: "up" })}
   ${kiki({ x: 950, y: 836, s: 1.05, arms: "up" })}`,
];

// ================================================================ Book 1c
// This Is My Partner — Unit 1: the "Meeting a Partner" listening

const myPartnerPages = [
  // 1 cover: two partners in front of the class calendar
  `${schoolScene()}${calendarBoard(1230, 700, 0.92)}${bench(760, 940, 1.3)}
   ${giraffe({ x: 360, y: 620, s: 0.9, glasses: true })}
   ${zuri({ x: 700, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 900, y: 829, s: 1.1, arms: "up" })}`,

  // 2 "Today you will introduce your partner"
  `${schoolScene()}${chalkboard(1260, 850, 1)}
   ${giraffe({ x: 470, y: 620, s: 0.98, glasses: true, bend: true })}
   ${zuri({ x: 830, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1040, y: 836, s: 1.05 })}`,

  // 3 "What is your name? How do you spell it?"
  `${schoolScene()}${bench(1260, 930, 1.2)}
   ${zuri({ x: 620, y: 802, s: 1.35, pointing: true })}
   ${kiki({ x: 920, y: 816, s: 1.2, arms: "up" })}
   ${lookLine(700, 760, 850, 764)}`,

  // 4 "What do you like?"  "I like mangoes."
  // The mango sits ON the ground: floated at head height it read as a balloon.
  `${schoolScene()}
   ${mango(1220, 900, 3.4)}
   ${zuri({ x: 620, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 900, y: 816, s: 1.2, arms: "up" })}`,

  // 5 now Kiki asks the questions
  `${schoolScene()}${openBook(1200, 878, 0.9)}
   ${kiki({ x: 620, y: 816, s: 1.2, pointing: true })}
   ${zuri({ x: 900, y: 808, s: 1.3, arms: "up" })}`,

  // 6 writing every answer down
  `${schoolScene()}${bench(830, 940, 1.6)}
   ${openBook(830, 838, 1.35)}
   ${zuri({ x: 470, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 1210, y: 836, s: 1.05 })}`,

  // 7 the days of the week, sung right through
  `${schoolScene()}${bunting(800, 200, 1.1, { span: 1000 })}
   ${calendarBoard(1180, 700, 1)}
   ${zuri({ x: 520, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 760, y: 829, s: 1.1, arms: "up" })}
   ${elephant({ x: 290, y: 810, s: 0.54, trunkUp: true })}`,

  // 8 the months, from January all the way to December
  `${schoolScene()}
   ${calendarBoard(800, 690, 1.35, { ring: 5 })}
   ${zuri({ x: 340, y: 821, s: 1.2, pointing: true })}
   ${kiki({ x: 1310, y: 836, s: 1.05 })}`,

  // 9 "This is Kiki. She is my partner."
  `${schoolScene()}${chalkboard(1310, 850, 0.9)}${bench(1080, 940, 1.2)}
   ${giraffe({ x: 1190, y: 620, s: 0.86, glasses: true })}
   ${zuri({ x: 560, y: 795, s: 1.4, arms: "up" })}
   ${kiki({ x: 800, y: 829, s: 1.1 })}`,

  // 10 "This is Zuri. She likes words."
  `${schoolScene()}${bench(1140, 940, 1.2)}
   ${kiki({ x: 620, y: 816, s: 1.2, arms: "up" })}
   ${zuri({ x: 880, y: 827, s: 1.15, book: true })}
   ${ostrich({ x: 1300, y: 786, s: 0.48 })}`,

  // 11 the whole class claps
  `${schoolScene()}${bunting(800, 190, 1.15, { span: 1100 })}${confetti(800, 560)}
   ${elephant({ x: 1300, y: 800, s: 0.6, trunkUp: true })}
   ${ostrich({ x: 240, y: 786, s: 0.5 })}
   ${zuri({ x: 700, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 950, y: 829, s: 1.1, arms: "up" })}`,

  // 12 first, second, third — everybody has a partner now
  `${schoolScene()}${sunnyPatch(800, 940)}
   ${giraffe({ x: 1380, y: 630, s: 0.82, glasses: true })}
   ${zuri({ x: 620, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 850, y: 829, s: 1.1, arms: "up" })}
   ${goat({ x: 290, y: 880, s: 0.5 })}
   ${hen({ x: 1140, y: 890, s: 0.5 })}`,
];

// ================================================================ Book 2b
// The Day the Fire Bell Rang — Unit 2: the firefighter equipment reading

const fireBellPages = [
  // 1 cover: the engine on Warta Street, kit laid out beside it
  `${streetScene()}${shopRow(1120, 700, 0.86)}
   ${fireEngine(720, 890, 1.05)}
   ${fireKit(340, 900, 1)}
   ${zuri({ x: 230, y: 815, s: 1.25, arms: "up" })}
   ${monkey({ x: 1430, y: 860, s: 0.62 })}`,

  // 2 the bell rings in the middle of the lesson
  `${basicScene()}${acacia(1230, 600, 1.45)}
   ${schoolBell(830, 890, 2.6)}
   ${zuri({ x: 470, y: 808, s: 1.3, mood: "surprised" })}
   ${kiki({ x: 1160, y: 829, s: 1.1, mood: "surprised", arms: "up" })}`,

  // 3 the fire engine comes down the street
  `${streetScene()}${shopRow(1240, 690, 0.66)}
   ${fireEngine(760, 890, 1.1)}
   ${dustPuffs(350, 920)}${motionArcs(420, 830, 1.4)}
   ${zuri({ x: 200, y: 827, s: 1.15, mood: "surprised", arms: "up" })}`,

  // 4 helmet, boots and gloves
  `${streetScene()}${shopRow(1250, 690, 0.68)}
   ${fireKit(830, 900, 1.9)}
   ${zuri({ x: 290, y: 815, s: 1.25, pointing: true })}
   ${lookLine(380, 760, 660, 806)}`,

  // 5 the ladder goes up the wall
  `${streetScene()}${shopRow(920, 700, 1.05)}
   ${ladder(790, 890, 1.1, { lean: -12 })}
   ${monkey({ x: 726, y: 654, s: 0.58, arms: "up" })}
   ${zuri({ x: 250, y: 827, s: 1.15, arms: "up" })}
   ${kiki({ x: 420, y: 843, s: 1, pointing: true })}`,

  // 6 the hose sends water right up to the roof
  `${streetScene()}${shopRow(1090, 700, 0.95)}
   ${fireEngine(390, 900, 0.86)}
   ${waterSpray(520, 830, 1030, 690)}
   ${zuri({ x: 230, y: 834, s: 1.1, mood: "surprised" })}`,

  // 7 the fire is out, and everybody is safe
  `${streetScene()}${shopRow(1080, 700, 0.95)}
   ${fireEngine(400, 900, 0.86)}
   ${hen({ x: 1330, y: 890, s: 0.52 })}
   ${goat({ x: 1140, y: 880, s: 0.5 })}
   ${zuri({ x: 700, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 900, y: 836, s: 1.05, arms: "up" })}`,

  // 8 the firefighter lets Zuri hold the helmet
  `${streetScene()}${shopRow(1230, 690, 0.7)}
   ${fireKit(1010, 900, 1.15)}
   ${monkey({ x: 810, y: 858, s: 0.76 })}
   ${zuri({ x: 430, y: 802, s: 1.35, arms: "up" })}`,

  // 9 Zuri writes down every piece of equipment
  `${streetScene()}${shopRow(1200, 690, 0.78)}
   ${notepad(790, 830, 1.2)}
   ${zuri({ x: 400, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 1350, y: 836, s: 1.05 })}`,

  // 10 back at school, what the equipment is for
  `${schoolScene()}${chalkboard(1250, 850, 1.05)}${bench(800, 940, 1.4)}
   ${giraffe({ x: 450, y: 620, s: 0.95, glasses: true, bend: true })}
   ${zuri({ x: 820, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1030, y: 836, s: 1.05 })}`,

  // 11 Zuri paints the fire engine for the wall
  `${schoolScene()}
   ${easel(1010, 900, 1.15, { inner: fireEngine(0, 26, 0.4) })}
   ${zuri({ x: 560, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 340, y: 836, s: 1.05, arms: "up" })}`,

  // 12 "When I am big, I will help too."
  `${sunsetScene()}${shopRow(1130, 700, 0.86, { lit: true })}
   ${lampPost(330, 900, 0.95, { lit: true })}
   ${zuri({ x: 700, y: 795, s: 1.4, arms: "up" })}
   ${kiki({ x: 950, y: 829, s: 1.1, arms: "up" })}`,
];

// ================================================================ Book 2c
// Zuri Asks the Questions — Unit 2: the interview listening, verb + ing

const askTheQuestionsPages = [
  // 1 cover: one small reporter, one notepad, one whole street
  `${streetScene()}${shopRow(1060, 700, 0.92)}
   ${notepad(790, 800, 1.4)}
   ${lampPost(330, 700, 0.85)}
   ${zuri({ x: 430, y: 808, s: 1.3, book: true })}
   ${monkey({ x: 1420, y: 860, s: 0.6 })}`,

  // 2 "A reporter asks questions and writes the answers down"
  `${schoolScene()}${chalkboard(1250, 850, 1)}
   ${giraffe({ x: 460, y: 620, s: 0.95, glasses: true, bend: true })}
   ${notepad(1010, 820, 1)}
   ${zuri({ x: 830, y: 821, s: 1.2, book: true })}`,

  // 3 the bus driver: "I am driving."
  `${streetScene()}${shopRow(330, 690, 0.7)}
   ${townBus(1020, 900, 0.9)}
   ${goat({ x: 660, y: 880, s: 0.54 })}
   ${notepad(560, 880, 0.9)}
   ${zuri({ x: 280, y: 821, s: 1.2, pointing: true })}`,

  // 4 the window cleaner: "I am cleaning."
  `${streetScene()}${shopRow(930, 700, 1)}
   ${ladder(780, 890, 0.95, { lean: -12 })}
   ${monkey({ x: 726, y: 690, s: 0.58, arms: "up" })}
   ${cleaningKit(430, 900, 1.05)}
   ${zuri({ x: 250, y: 827, s: 1.15, book: true })}`,

  // 5 the shopkeeper: "I am selling."
  `${streetScene()}${shopRow(1180, 690, 0.8)}
   ${marketStall(790, 860, 0.95)}
   ${hen({ x: 780, y: 890, s: 0.56 })}
   ${zuri({ x: 300, y: 821, s: 1.2, book: true })}`,

  // 6 the farmer: "I am growing."
  `${basicScene()}${seedRow(640, 900, 0.95)}${fence(1210, 880, 0.9, 3)}
   ${donkey({ x: 900, y: 760, s: 0.76 })}
   ${zuri({ x: 290, y: 827, s: 1.15, book: true })}`,

  // 7 the doctor: "I am helping."
  `${streetScene()}${clinicFront(1140, 720, 0.9)}
   ${doctorKit(620, 900, 1.05)}
   ${giraffe({ x: 840, y: 700, s: 0.8, glasses: true, bend: true })}
   ${zuri({ x: 250, y: 821, s: 1.2, book: true })}`,

  // 8 the teacher: "I am teaching."
  `${schoolScene()}${chalkboard(1230, 850, 1)}${bench(770, 930, 1.4)}
   ${giraffe({ x: 480, y: 620, s: 0.95, glasses: true })}
   ${kiki({ x: 1000, y: 843, s: 1 })}
   ${zuri({ x: 800, y: 827, s: 1.15, book: true })}`,

  // 9 the firefighter: "I am rescuing."
  `${streetScene()}${shopRow(1240, 690, 0.7)}
   ${fireEngine(790, 890, 0.95)}
   ${fireKit(380, 900, 0.9)}
   ${zuri({ x: 240, y: 821, s: 1.2, book: true })}`,

  // 10 reading the whole notepad back
  `${streetScene()}${shopRow(1180, 690, 0.78)}
   ${notepad(860, 800, 1.5)}
   ${zuri({ x: 400, y: 802, s: 1.35, pointing: true })}`,

  // 11 the report goes up on the class board
  `${basicScene()}${acacia(280, 620, 1.35)}
   ${chalkboard(1010, 800, 1.5)}
   ${zuri({ x: 470, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 1370, y: 836, s: 1.05, arms: "up" })}`,

  // 12 every job on Warta Street helps somebody
  `${streetScene()}${shopRow(1100, 700, 0.9)}${lampPost(700, 700, 0.9)}
   ${crossing(400, 810, 0.75, { sign: true })}
   ${zuri({ x: 860, y: 802, s: 1.35, arms: "up", book: true })}
   ${monkey({ x: 1420, y: 860, s: 0.58 })}
   ${goat({ x: 250, y: 880, s: 0.48 })}
   ${hen({ x: 1200, y: 890, s: 0.5 })}`,
];

// ================================================================ Book 3b
// Sports Day at the Tree School — Unit 3: Ready, Steady, Go!

const sportsDayPages = [
  // 1 cover: the banner, the runners and the whole school watching
  `${schoolScene()}${raceBanner(800, 570, 1.15)}${bunting(800, 190, 1.15, { span: 1100 })}
   ${zebra({ x: 1180, y: 720, s: 0.86, pose: "run" })}
   ${ostrich({ x: 300, y: 786, s: 0.54, pose: "run" })}
   ${zuri({ x: 620, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 860, y: 829, s: 1.1, arms: "up" })}`,

  // 2 "Ready... steady..."
  `${schoolScene()}${raceBanner(850, 570, 1)}
   ${giraffe({ x: 380, y: 620, s: 0.92, glasses: true })}
   ${zuri({ x: 700, y: 815, s: 1.25 })}
   ${kiki({ x: 900, y: 836, s: 1.05 })}
   ${ostrich({ x: 1180, y: 790, s: 0.5 })}`,

  // 3 "Go!" — Musa is away first
  `${basicScene()}${acacia(1400, 620, 1)}${tallGrass(180, 930, 1.3)}
   ${zebra({ x: 830, y: 700, s: 1.05, pose: "run" })}
   ${dustPuffs(540, 890)}${motionArcs(450, 730, 1.5)}
   ${zuri({ x: 240, y: 840, s: 1.05, arms: "up" })}`,

  // 4 the ostrich runs fastest of all
  `${basicScene()}${acacia(260, 640, 0.95)}${tallGrass(1420, 930, 1.2)}
   ${ostrich({ x: 900, y: 752, s: 0.92, pose: "run" })}
   ${dustPuffs(660, 930)}${motionArcs(560, 700, 1.4)}
   ${zuri({ x: 290, y: 834, s: 1.1, arms: "up" })}`,

  // 5 the hop race, and Zuri hops
  `${schoolScene()}
   ${zuri({ x: 700, y: 780, s: 1.35, arms: "up" })}
   ${dustPuffs(700, 930)}${motionArcs(540, 700, 1.3)}
   ${kiki({ x: 1120, y: 836, s: 1.05, arms: "up" })}`,

  // 6 Kiki jumps the highest
  `${schoolScene()}
   ${kiki({ x: 900, y: 680, s: 1.15, arms: "up" })}
   ${dustPuffs(900, 900)}
   ${zuri({ x: 560, y: 821, s: 1.2, arms: "up" })}
   ${motionArcs(760, 630, 1.4)}`,

  // 7 the elephant throws the ball a very long way
  `${schoolScene()}
   ${elephant({ x: 1120, y: 800, s: 0.76, trunkUp: true })}
   ${playBall(700, 400, 1.55)}
   ${zuri({ x: 400, y: 815, s: 1.25, arms: "up" })}
   ${motionArcs(560, 480, 1.1)}`,

  // 8 Zuri is last, and Zuri does not stop
  `${basicScene()}${acacia(1380, 630, 1)}${raceBanner(430, 570, 0.9)}
   ${zuri({ x: 860, y: 802, s: 1.35 })}
   ${dustPuffs(980, 930)}${motionArcs(1030, 720, 1.2, { flip: true })}`,

  // 9 cool water and fruit at the finish
  `${schoolScene()}${bench(830, 940, 1.6)}
   ${fruitBowl(560, 800, 1.15)}${waterBottle(1010, 810, 1.15)}
   ${zuri({ x: 340, y: 821, s: 1.2 })}
   ${kiki({ x: 1260, y: 836, s: 1.05, arms: "up" })}`,

  // 10 everybody claps for everybody
  `${schoolScene()}${bunting(800, 190, 1.15, { span: 1150 })}${confetti(800, 560)}
   ${giraffe({ x: 1350, y: 630, s: 0.85, glasses: true })}
   ${elephant({ x: 290, y: 810, s: 0.54, trunkUp: true })}
   ${zuri({ x: 700, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 950, y: 829, s: 1.1, arms: "up" })}`,

  // 11 a flag for every runner, not only the fast ones
  `${schoolScene()}
   ${easel(1060, 900, 1.05, { inner: shapeTile(0, 0, 0.44, "heart", "#e76f51") })}
   ${zuri({ x: 560, y: 795, s: 1.4, arms: "up" })}
   ${ostrich({ x: 250, y: 786, s: 0.48 })}`,

  // 12 "Move every day," said Miss Twiga
  `${sunsetScene()}${acacia(1400, 640, 1.05)}${bench(560, 930, 1.3)}
   ${giraffe({ x: 1100, y: 660, s: 0.86, glasses: true })}
   ${zuri({ x: 560, y: 815, s: 1.25 })}
   ${kiki({ x: 830, y: 836, s: 1.05, arms: "up" })}`,
];

// ================================================================ Book 3c
// Miss Twiga Says — Unit 3: the command words

const twigaSaysPages = [
  // 1 cover: the class in a line, waiting for the next instruction
  `${schoolScene()}${chalkboard(1150, 850, 0.95)}
   ${giraffe({ x: 380, y: 620, s: 0.98, glasses: true })}
   ${zuri({ x: 760, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 990, y: 829, s: 1.1, arms: "up" })}
   ${elephant({ x: 1440, y: 810, s: 0.54, trunkUp: true })}`,

  // 2 "Stand up, everybody!"
  `${schoolScene()}${bench(1260, 940, 1.2)}
   ${giraffe({ x: 430, y: 620, s: 0.95, glasses: true })}
   ${zuri({ x: 830, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1040, y: 829, s: 1.1, arms: "up" })}`,

  // 3 "Touch your head."
  `${schoolScene()}
   ${giraffe({ x: 1260, y: 620, s: 0.88, glasses: true, bend: true })}
   ${zuri({ x: 640, y: 783, s: 1.5, arms: "up" })}
   ${kiki({ x: 970, y: 823, s: 1.15, arms: "up" })}`,

  // 4 "Clap your hands."
  `${schoolScene()}
   ${zuri({ x: 620, y: 795, s: 1.4, arms: "up" })}
   ${kiki({ x: 910, y: 816, s: 1.2, arms: "up" })}
   ${motionArcs(460, 700, 1.2)}${motionArcs(1070, 700, 1.2, { flip: true })}`,

  // 5 "Wiggle your fingers."
  `${schoolScene()}
   ${zuri({ x: 700, y: 789, s: 1.45, arms: "up" })}
   ${motionArcs(540, 690, 1.1)}${motionArcs(880, 690, 1.1, { flip: true })}
   ${elephant({ x: 1220, y: 800, s: 0.64, trunkUp: true })}`,

  // 6 "Nod your head."
  `${schoolScene()}${bench(1190, 940, 1.3)}
   ${giraffe({ x: 1120, y: 620, s: 0.9, glasses: true, bend: true })}
   ${zuri({ x: 560, y: 802, s: 1.35 })}
   ${kiki({ x: 810, y: 829, s: 1.1 })}`,

  // 7 "Turn around."
  `${schoolScene()}
   ${zuri({ x: 620, y: 802, s: 1.35, flip: true })}
   ${kiki({ x: 930, y: 829, s: 1.1, flip: true })}
   ${dustPuffs(620, 930)}${dustPuffs(930, 940)}`,

  // 8 "Reach for the sky!"
  `${schoolScene()}${sunnyPatch(760, 940)}
   ${zuri({ x: 700, y: 783, s: 1.5, arms: "up" })}
   ${kiki({ x: 1010, y: 816, s: 1.2, arms: "up" })}
   ${wildBird(430, 300, 1, true)}`,

  // 9 "Sit down!" — and Kiki is still standing
  `${schoolScene()}${bench(900, 940, 1.6)}
   ${giraffe({ x: 400, y: 620, s: 0.95, glasses: true, bend: true })}
   ${zuri({ x: 760, y: 827, s: 1.15 })}
   ${kiki({ x: 1080, y: 816, s: 1.2, arms: "up", mood: "surprised" })}`,

  // 10 now Zuri gives the instructions
  `${schoolScene()}${chalkboard(1310, 850, 0.9)}
   ${zuri({ x: 470, y: 789, s: 1.45, pointing: true })}
   ${kiki({ x: 830, y: 829, s: 1.1, arms: "up" })}
   ${elephant({ x: 1090, y: 810, s: 0.58, trunkUp: true })}
   ${ostrich({ x: 1510, y: 790, s: 0.48 })}`,

  // 11 everybody laughs, including Miss Twiga
  `${schoolScene()}${bunting(800, 190, 1.1, { span: 1050 })}
   ${giraffe({ x: 1350, y: 630, s: 0.85, glasses: true })}
   ${zuri({ x: 660, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 910, y: 829, s: 1.1, arms: "up" })}
   ${goat({ x: 300, y: 880, s: 0.48 })}`,

  // 12 say it, then do it
  `${schoolScene()}${sunnyPatch(830, 940)}
   ${openBook(1110, 852, 0.95)}
   ${zuri({ x: 700, y: 795, s: 1.4, book: true, arms: "up" })}
   ${kiki({ x: 950, y: 836, s: 1.05 })}`,
];

// ================================================================ Book 4b
// What Is the Weather Today? — Unit 4: the weather words

const weatherTodayPages = [
  // 1 cover: bright on one side of the sky, grey on the other
  `${sky()}${sun(320, 170)}${hills()}${ground()}
   ${cloudPuff(940, 220, 1.4, { grey: true })}${cloudPuff(1320, 290, 1.1, { grey: true })}
   ${acacia(1440, 640, 1.05)}
   ${zuri({ x: 640, y: 802, s: 1.35, book: true })}
   ${kiki({ x: 890, y: 829, s: 1.1, arms: "up" })}`,

  // 2 Monday was sunny
  `${daylightScene(800, 150)}${acacia(1350, 630, 1.05)}${sunnyPatch(760, 940)}
   ${zuri({ x: 700, y: 802, s: 1.35, arms: "up" })}`,

  // 3 Tuesday was cloudy
  `${sky()}${hills()}${ground()}
   ${cloudPuff(420, 230, 1.3, { grey: true })}${cloudPuff(900, 180, 1.55, { grey: true })}${cloudPuff(1330, 260, 1.15, { grey: true })}
   ${acacia(1420, 650, 1)}
   ${zuri({ x: 700, y: 808, s: 1.3 })}`,

  // 4 on Wednesday it rained all morning
  `${sky(true)}${hills()}${ground()}${rain()}
   ${acacia(1380, 650, 1.05)}
   ${zuri({ x: 660, y: 808, s: 1.3, mood: "surprised" })}
   ${kiki({ x: 940, y: 829, s: 1.1 })}`,

  // 5 and then there were puddles everywhere
  `${sky()}${sun(1370, 160)}${hills()}${ground()}
   ${puddle(900, 930, 220, 54, 0)}
   ${zuri({ x: 520, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 1270, y: 829, s: 1.1, arms: "up" })}`,

  // 6 Thursday was windy, and the kite went up
  `${basicScene()}${acacia(300, 640, 1.05)}${tallGrass(1440, 930, 1.25)}
   ${kite(1020, 340, 1.05)}
   ${zuri({ x: 620, y: 802, s: 1.35, arms: "up" })}`,

  // 7 Friday was hot, so they sat in the shade
  `${daylightScene(1310, 150)}${acacia(700, 610, 1.8)}
   ${waterBottle(1010, 830, 1.1)}
   ${zuri({ x: 700, y: 808, s: 1.3 })}
   ${sunnyPatch(1290, 940)}`,

  // 8 a rainbow after the rain
  `${sky()}${hills()}${ground()}
   ${rainbow(800, 600)}
   ${acacia(1420, 650, 1)}
   ${zuri({ x: 620, y: 795, s: 1.4, arms: "up" })}
   ${kiki({ x: 910, y: 829, s: 1.1, arms: "up" })}`,

  // 9 every day goes on the weather chart
  `${basicScene()}${acacia(300, 620, 1.35)}
   ${chalkboard(1010, 800, 1.5)}
   ${zuri({ x: 470, y: 815, s: 1.25, pointing: true })}
   ${kiki({ x: 1420, y: 836, s: 1.05 })}`,

  // 10 Miss Twiga names them all: sunny, cloudy, rainy, windy
  `${schoolScene()}${bench(780, 940, 1.4)}
   ${giraffe({ x: 450, y: 620, s: 0.95, glasses: true, bend: true })}
   ${cloudPuff(1120, 250, 1)}
   ${zuri({ x: 830, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1040, y: 836, s: 1.05 })}`,

  // 11 Saturday night was clear and cold
  `${nightScene()}${acacia(1350, 650, 1.05)}${burrow(300, 900, 0.8)}
   ${zuri({ x: 700, y: 795, s: 1.4, arms: "up" })}`,

  // 12 "And what will the weather be tomorrow?"
  `${sky()}${lowSun(300, 480)}${hills()}${ground()}
   ${cloudPuff(1120, 230, 1.1)}${cloudPuff(1440, 300, 0.85)}
   ${openBook(1010, 878, 0.95)}
   ${zuri({ x: 640, y: 802, s: 1.35, book: true })}`,
];

// ================================================================ Book 4c
// Where Does the Sun Go? — Unit 4: "Why We Have Day and Night"

const whereSunGoesPages = [
  // 1 cover: the very first light of the day
  `${sky()}${lowSun(300, 470)}${hills()}${ground()}
   ${acacia(1380, 640, 1.1)}${burrow(1090, 900, 0.8)}
   ${zuri({ x: 700, y: 789, s: 1.45, arms: "up" })}`,

  // 2 Zuri wakes when the light reaches the burrow
  `${sky()}${lowSun(260, 500)}${hills()}${ground()}
   ${burrow(920, 900, 1)}
   ${zuri({ x: 560, y: 802, s: 1.35 })}`,

  // 3 morning: the sun is low, and everything is long
  `${sky()}${lowSun(330, 470)}${hills()}${ground()}${tallGrass(1440, 940, 1.2)}
   ${castShadow(760, 953, { length: 470, dir: 1, height: 50 })}
   ${zuri({ x: 760, y: 802, s: 1.35, pointing: true })}`,

  // 4 midday: the sun is right at the top of the sky
  `${daylightScene(800, 140)}${acacia(1350, 630, 1)}
   ${castShadow(760, 952, { length: 90, dir: 1, height: 34 })}
   ${zuri({ x: 760, y: 795, s: 1.4, arms: "up" })}
   ${sunnyPatch(800, 940)}`,

  // 5 evening: low again, but on the other side
  `${sky()}${lowSun(1340, 490)}${hills()}${ground()}
   ${acacia(280, 650, 1.05)}
   ${castShadow(900, 953, { length: 480, dir: -1, height: 50 })}
   ${zuri({ x: 900, y: 802, s: 1.35 })}`,

  // 6 sunset, and the birds going home
  `${sunsetScene()}${acacia(300, 650, 1.1)}
   ${wildBird(600, 320, 1, true)}${wildBird(800, 250, 0.85, true)}
   ${zuri({ x: 1000, y: 808, s: 1.3 })}`,

  // 7 "Where does the sun go?"
  `${sunsetScene()}${bench(560, 930, 1.2)}
   ${giraffe({ x: 480, y: 660, s: 0.9, glasses: true, bend: true })}
   ${zuri({ x: 900, y: 802, s: 1.35, pointing: true })}`,

  // 8 the sun stays still; it is the Earth that turns
  `${schoolNoonScene(1320, 160)}${chalkboard(1270, 850, 0.95)}
   ${playBall(830, 540, 1.5)}
   ${giraffe({ x: 470, y: 620, s: 0.95, glasses: true, bend: true })}
   ${lookLine(1250, 260, 900, 500)}
   ${zuri({ x: 830, y: 827, s: 1.15, book: true })}`,

  // 9 night, and the moon takes the sun's place
  `${nightScene()}${acacia(1350, 650, 1.05)}
   ${zuri({ x: 700, y: 795, s: 1.4, arms: "up" })}
   ${lookLine(780, 700, 1250, 260)}`,

  // 10 and somewhere far away it is morning already
  `${nightScene()}${burrow(300, 900, 0.8)}
   ${thoughtBubble(1010, 380, 1, shapeTile(30, -10, 1.1, "circle", "#f4c95d"))}
   ${zuri({ x: 620, y: 802, s: 1.35 })}`,

  // 11 Zuri sleeps, and the Earth keeps turning
  `${nightScene()}${burrow(1140, 890, 0.9)}
   ${zuri({ x: 700, y: 802, s: 1.35 })}
   ${sleepyZs(820, 690, 1.4)}`,

  // 12 sunrise again — day, night, day, night
  `${sky()}${lowSun(330, 470)}${hills()}${ground()}${sunnyPatch(760, 940)}
   ${acacia(1400, 640, 1.05)}
   ${zuri({ x: 700, y: 789, s: 1.45, arms: "up" })}
   ${kiki({ x: 970, y: 829, s: 1.1, arms: "up" })}`,
];

// ================================================================ Book 5b
// The Shape Hunt — Unit 5: the shapes and patterns group

const shapeHuntPages = [
  // 1 cover: three shapes waiting to be found
  `${schoolScene()}${chalkboard(1310, 850, 0.9)}
   ${shapeTile(400, 440, 1.1, "circle", "#7fa8d9")}${shapeTile(700, 420, 1.1, "triangle", "#e76f51")}${shapeTile(1000, 440, 1.1, "square", "#8ab17d")}
   ${zuri({ x: 620, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 880, y: 829, s: 1.1, arms: "up" })}`,

  // 2 "Today we are hunting for shapes"
  `${schoolScene()}${bench(800, 940, 1.4)}
   ${giraffe({ x: 450, y: 620, s: 0.95, glasses: true, bend: true })}
   ${shapeTile(1180, 500, 1.2, "circle", "#7fa8d9")}
   ${zuri({ x: 830, y: 821, s: 1.2, book: true })}`,

  // 3 the sun is a circle
  `${daylightScene(1200, 200)}${acacia(300, 640, 1.1)}
   ${zuri({ x: 700, y: 795, s: 1.4, pointing: true })}
   ${lookLine(790, 700, 1130, 290)}`,

  // 4 the roof is a triangle and the window is a square
  `${basicScene()}${house(1040, 890, 1.05)}
   ${shapeTile(330, 430, 0.95, "triangle", "#e76f51")}${shapeTile(570, 440, 0.95, "square", "#7fa8d9")}
   ${zuri({ x: 440, y: 815, s: 1.25, pointing: true })}
   ${lookLine(530, 740, 950, 680)}`,

  // 5 the door is a rectangle
  `${basicScene()}${house(1040, 890, 1.05)}
   ${shapeTile(400, 450, 0.95, "rectangle", "#9d82c4")}
   ${zuri({ x: 430, y: 808, s: 1.3, pointing: true })}
   ${lookLine(520, 760, 1000, 830)}`,

  // 6 the wheels of the bus are circles
  `${streetScene()}${shopRow(340, 690, 0.7)}
   ${townBus(1030, 900, 0.9)}
   ${shapeTile(700, 470, 0.9, "circle", "#4a4a52")}
   ${zuri({ x: 280, y: 821, s: 1.2, pointing: true })}`,

  // 7 and there is a heart on Kiki's card
  `${schoolScene()}${bench(880, 940, 1.5)}
   ${greetingCard(880, 812, 1.35)}
   ${shapeTile(330, 470, 0.95, "heart", "#e76f51")}
   ${zuri({ x: 560, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1230, y: 836, s: 1.05 })}`,

  // 8 five shapes found, and all of them named
  `${schoolScene()}${sunnyPatch(800, 950)}
   ${shapeTile(330, 500, 1, "circle", "#7fa8d9")}${shapeTile(580, 500, 1, "square", "#8ab17d")}${shapeTile(830, 500, 1, "triangle", "#f4c95d")}${shapeTile(1090, 500, 1, "rectangle", "#9d82c4")}${shapeTile(1350, 500, 1, "heart", "#e76f51")}
   ${zuri({ x: 620, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 900, y: 836, s: 1.05, pointing: true })}`,

  // 9 shapes can make a pattern: circle, square, circle, square
  `${schoolScene()}
   ${patternStrip(830, 470, 1, { kinds: ["circle", "square"], cells: 5, blankLast: false })}
   ${zuri({ x: 470, y: 821, s: 1.2, pointing: true })}
   ${kiki({ x: 1260, y: 836, s: 1.05 })}`,

  // 10 so what comes next?
  `${schoolScene()}
   ${patternStrip(830, 470, 1, { kinds: ["circle", "square"], cells: 5 })}
   ${zuri({ x: 430, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1270, y: 829, s: 1.1, pointing: true })}`,

  // 11 Kiki makes a harder one
  `${schoolScene()}
   ${patternStrip(830, 470, 0.95, { kinds: ["triangle", "triangle", "heart"], cells: 6 })}
   ${kiki({ x: 400, y: 816, s: 1.2, pointing: true })}
   ${zuri({ x: 1270, y: 834, s: 1.1, book: true })}`,

  // 12 once you have seen them, you see them everywhere
  `${schoolScene()}${sunnyPatch(820, 940)}
   ${easel(1140, 900, 1.05, { inner: shapeTile(0, 0, 0.45, "triangle", "#f4c95d") })}
   ${shapeTile(360, 460, 0.85, "circle", "#7fa8d9")}
   ${zuri({ x: 660, y: 789, s: 1.45, book: true, arms: "up" })}`,
];

// ================================================================ Book 5c
// Ten, Twenty, One Hundred! — Unit 5: counting in tens and comparing words

const tensAndOppositesPages = [
  // 1 cover: the counting line, all the way to the red hundred
  `${schoolScene()}${chalkboard(1310, 850, 0.9)}
   ${tensLine(800, 430, 1.15)}
   ${zuri({ x: 620, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 880, y: 829, s: 1.1, arms: "up" })}`,

  // 2 counting one by one takes a very long time
  `${schoolScene()}
   ${bookShelf(940, 760, 1.2, { count: 12 })}
   ${zuri({ x: 430, y: 815, s: 1.25, pointing: true })}
   ${kiki({ x: 1340, y: 836, s: 1.05 })}`,

  // 3 ten, twenty, thirty
  `${schoolScene()}
   ${tensLine(800, 450, 1.15)}
   ${kiki({ x: 470, y: 816, s: 1.2, pointing: true })}
   ${zuri({ x: 1250, y: 834, s: 1.1, book: true })}`,

  // 4 forty, fifty, sixty
  `${schoolScene()}${bench(1260, 940, 1.2)}
   ${tensLine(800, 460, 1.1)}
   ${zuri({ x: 520, y: 821, s: 1.2, arms: "up" })}
   ${elephant({ x: 1100, y: 810, s: 0.54, trunkUp: true })}`,

  // 5 seventy, eighty, ninety
  `${schoolScene()}
   ${tensLine(800, 450, 1.15)}
   ${zuri({ x: 470, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1200, y: 829, s: 1.1, arms: "up" })}
   ${ostrich({ x: 250, y: 786, s: 0.46 })}`,

  // 6 one hundred!
  `${schoolScene()}${bunting(800, 190, 1.15, { span: 1100 })}${confetti(800, 560)}
   ${tensLine(800, 470, 1.2)}
   ${zuri({ x: 700, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 980, y: 829, s: 1.1, arms: "up" })}`,

  // 7 big and small
  `${schoolScene()}
   ${elephant({ x: 1080, y: 800, s: 0.88, trunkUp: true })}
   ${chick(560, 900, 0.7)}
   ${zuri({ x: 330, y: 821, s: 1.2, pointing: true })}`,

  // 8 tall and short
  `${schoolScene()}
   ${metreStick(970, 900, 1.2)}
   ${kiki({ x: 890, y: 816, s: 1.2 })}
   ${zuri({ x: 470, y: 821, s: 1.2, pointing: true })}
   ${giraffe({ x: 1350, y: 640, s: 0.85, glasses: true })}`,

  // 9 heavy and light
  `${schoolScene()}
   ${balanceScale(1070, 900, 1.05, { tilt: -9, left: mango(0, 0, 1.6), right: feather(0, -10, 0.9) })}
   ${zuri({ x: 700, y: 827, s: 1.15, pointing: true })}
   ${kiki({ x: 400, y: 836, s: 1.05 })}`,

  // 10 long and short
  `${schoolScene()}${bench(900, 940, 1.5)}
   ${rulerProp(900, 780, 1.15, { length: 380 })}
   ${rulerProp(900, 856, 0.9, { length: 150 })}
   ${zuri({ x: 440, y: 815, s: 1.25, pointing: true })}`,

  // 11 wide and narrow
  `${basicScene()}${acacia(240, 640, 0.95)}
   <path d="M 640 700 q 60 140 -180 300 L 660 1000 q 120 -170 220 -300 z" fill="${G2.road}" stroke="${G2.kerb}" stroke-width="8"/>
   ${metreStick(1160, 900, 1)}
   ${zuri({ x: 1190, y: 815, s: 1.25, pointing: true })}
   ${kiki({ x: 1420, y: 836, s: 1.05 })}`,

  // 12 a hundred steps all the way home
  `${sunsetScene()}${burrow(1200, 930, 0.8)}
   ${tensLine(700, 420, 0.95)}
   ${zuri({ x: 620, y: 802, s: 1.35, arms: "up" })}`,
];

// ================================================================ Book 6b
// Where Is the Cricket? — Unit 6: the position words

const whereIsTheCricketPages = [
  // 1 cover: an evening garden, and one small chirping singer
  `${gardenScene()}${gardenPlant(1260, 880, 1.15)}${gardenPlant(280, 900, 0.95)}
   ${cricketBug(1190, 800, 1.5)}
   ${zuri({ x: 620, y: 802, s: 1.35, book: true })}
   ${kiki({ x: 870, y: 829, s: 1.1, pointing: true })}`,

  // 2 a chirp in the garden — but where?
  `${gardenScene()}${gardenPlant(1170, 890, 1.3)}
   ${zuri({ x: 520, y: 795, s: 1.4, mood: "surprised" })}
   ${lookLine(620, 720, 1090, 760)}`,

  // 3 under the flat stone? no — that is an ant
  `${gardenScene()}${flatStone(920, 880, 1.35)}
   ${antBug(770, 940, 1.1)}
   ${zuri({ x: 430, y: 808, s: 1.3, pointing: true })}`,

  // 4 on the leaf? no — that is a butterfly
  `${gardenScene()}${gardenPlant(960, 890, 1.5)}
   ${butterflyBug(950, 690, 1.7)}
   ${zuri({ x: 400, y: 815, s: 1.25, pointing: true })}`,

  // 5 in the flower? no — that is a bee
  `${gardenScene()}${gardenPlant(620, 890, 1.3)}${gardenPlant(1040, 900, 1.15)}
   ${beeBug(830, 690, 1.5)}
   ${zuri({ x: 280, y: 821, s: 1.2, book: true })}`,

  // 6 between the tall grass? no — that is a worm
  `${gardenScene()}${tallGrass(620, 950, 1.6)}${tallGrass(1040, 950, 1.6)}
   ${wormBug(830, 950, 1.15)}
   ${zuri({ x: 300, y: 815, s: 1.25, pointing: true })}`,

  // 7 above, in the web? no — and that one has eight legs
  `${gardenScene()}
   ${spiderWeb(1120, 596, 1)}${spiderBug(1120, 596, 1)}
   ${zuri({ x: 460, y: 808, s: 1.3, mood: "surprised", pointing: true })}`,

  // 8 in front of the log there is nothing at all
  `${gardenScene()}${fallenLog(900, 830, 1.05)}
   ${zuri({ x: 380, y: 808, s: 1.3, mood: "sad" })}`,

  // 9 behind the log — there!
  `${gardenScene()}${fallenLog(880, 830, 1.05)}
   ${cricketBug(1100, 800, 1.4)}
   ${zuri({ x: 430, y: 795, s: 1.4, mood: "surprised", arms: "up" })}`,

  // 10 six legs, two long back ones for jumping
  `${gardenScene()}${gardenPlant(1320, 890, 1)}
   ${cricketBug(960, 790, 1.9)}
   ${zuri({ x: 470, y: 802, s: 1.35, book: true })}`,

  // 11 Zuri does not catch it. She sits still and listens.
  `${sunsetScene()}${gardenPlant(1300, 910, 1)}${gardenPlant(300, 920, 0.9)}
   ${cricketBug(1010, 830, 1.3)}
   ${zuri({ x: 560, y: 802, s: 1.35, book: true })}
   ${kiki({ x: 810, y: 829, s: 1.1 })}`,

  // 12 now, every evening, she knows exactly where to look
  `${nightScene()}${burrow(1180, 890, 0.85)}
   ${cricketBug(430, 930, 1)}
   ${zuri({ x: 700, y: 802, s: 1.35, arms: "up" })}`,
];

// ================================================================ Book 6c
// The Ants and the Big Crumb — Unit 6: what bugs DO

const antsAndTheCrumbPages = [
  // The ants are the SUBJECT here, not the garden's supporting cast, so they are
  // drawn at close-up scale. At The Six-Leg Club's 1.05-1.35 the whole book read
  // as a meerkat looking at specks.
  // 1 cover: the line of carriers, and the anthill they are heading for
  `${gardenScene()}${anthill(1300, 900, 1.4)}${gardenPlant(290, 900, 0.95)}
   ${antBug(520, 940, 1.6, { carrying: true })}${antBug(720, 948, 1.6, { carrying: true })}${antBug(920, 940, 1.6, { carrying: true })}
   ${zuri({ x: 700, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 960, y: 829, s: 1.1, pointing: true })}`,

  // 2 Zuri drops one crumb of her bread
  `${gardenScene()}${flatStone(1120, 880, 1.2)}
   ${shapeTile(900, 910, 0.85, "circle", "#c9a06c")}
   ${zuri({ x: 620, y: 795, s: 1.4, mood: "surprised" })}`,

  // 3 one ant finds it
  `${gardenScene()}
   ${shapeTile(1000, 906, 0.9, "circle", "#c9a06c")}
   ${antBug(760, 940, 1.9)}
   ${zuri({ x: 380, y: 808, s: 1.3, pointing: true })}`,

  // 4 one ant cannot move it
  `${gardenScene()}
   ${shapeTile(1020, 900, 0.95, "circle", "#c9a06c")}
   ${antBug(780, 942, 2)}
   ${motionArcs(600, 850, 1.1)}
   ${zuri({ x: 340, y: 815, s: 1.25 })}`,

  // 5 so the ant runs all the way back to the anthill
  `${gardenScene()}${anthill(1260, 900, 1.5)}
   ${antBug(720, 946, 1.8)}
   ${motionArcs(530, 880, 1)}
   ${zuri({ x: 330, y: 821, s: 1.2, book: true })}`,

  // 6 two ants. Still too heavy.
  `${gardenScene()}
   ${shapeTile(900, 900, 0.95, "circle", "#c9a06c")}
   ${antBug(700, 942, 1.8, { carrying: true })}${antBug(1110, 946, 1.8, { flip: true, carrying: true })}
   ${zuri({ x: 330, y: 815, s: 1.25 })}`,

  // 7 then ten ants come out together
  `${gardenScene()}${anthill(1340, 900, 1.4)}
   ${antBug(300, 950, 1.5)}${antBug(480, 942, 1.5)}${antBug(660, 950, 1.5)}${antBug(840, 942, 1.5)}${antBug(1020, 950, 1.5)}
   ${zuri({ x: 560, y: 808, s: 1.3, mood: "surprised" })}`,

  // 8 and up it goes
  `${gardenScene()}
   ${shapeTile(880, 852, 1.1, "circle", "#c9a06c")}
   ${antBug(700, 942, 1.8, { carrying: true })}${antBug(880, 946, 1.8, { carrying: true })}${antBug(1060, 942, 1.8, { carrying: true })}
   ${zuri({ x: 340, y: 802, s: 1.35, arms: "up" })}`,

  // 9 the line crawls across the flat stone
  `${gardenScene()}${flatStone(870, 880, 1.7)}
   ${antBug(640, 888, 1.5, { carrying: true })}${antBug(840, 882, 1.5, { carrying: true })}${antBug(1040, 888, 1.5, { carrying: true })}
   ${zuri({ x: 300, y: 815, s: 1.25, pointing: true })}`,

  // 10 over the log and under the big leaf
  `${gardenScene()}${fallenLog(920, 830, 1.15)}${gardenPlant(1340, 890, 1.05)}
   ${antBug(800, 810, 1.5, { carrying: true })}${antBug(1000, 806, 1.5, { carrying: true })}
   ${zuri({ x: 350, y: 815, s: 1.25 })}`,

  // 11 and in it goes, right into the anthill
  `${gardenScene()}${anthill(1010, 900, 1.8)}
   ${antBug(620, 948, 1.6, { carrying: true })}${antBug(800, 944, 1.6, { carrying: true })}
   ${zuri({ x: 320, y: 808, s: 1.3, arms: "up" })}`,

  // 12 "A little and a little," wrote Zuri, "makes a lot. Ask any ant."
  `${gardenScene()}${anthill(1330, 900, 1.3)}
   ${openBook(1030, 830, 1.3)}
   ${antBug(560, 948, 1.5)}${butterflyBug(420, 470, 1.05)}
   ${zuri({ x: 620, y: 795, s: 1.4, book: true, arms: "up" })}`,
];

// A shallow stream crossing the middle distance. The near bank is painted back
// IN FRONT of the water, because a character's standing point has to sit around
// y=800 to stay inside the frame — a stream drawn across the foreground would
// leave the whole cast paddling.
const streamScene = ({ evening = false } = {}) => `${sky()}${evening ? lowSun(300, 470) : sun(300, 160)}${hills()}
  <rect x="0" y="590" width="${W}" height="${H - 590}" fill="${C.grassFar}"/>
  <path d="M 0 606 q 400 -34 800 0 q 400 34 800 0 L 1600 776 q -400 34 -800 0 q -400 -34 -800 0 Z" fill="${C.water}"/>
  <path class="anim-flow" d="M 0 660 q 400 -32 800 0 q 400 32 800 0" stroke="${C.waterLight}" stroke-width="8" fill="none"/>
  <path class="anim-flow" style="animation-delay:0.4s" d="M 0 726 q 400 -32 800 0 q 400 32 800 0" stroke="${C.waterLight}" stroke-width="6" fill="none" opacity="0.7"/>
  <path d="M 0 776 q 400 34 800 0 q 400 -34 800 0 L 1600 1000 L 0 1000 Z" fill="${C.grassNear}"/>
  ${evening ? `<rect width="${W}" height="${H}" fill="#f4a259" opacity="0.22"/>` : ""}`;

// ================================================================ Book 7b
// The Stream Clean-Up — Unit 7: caring for the environment

const streamCleanUpPages = [
  // 1 cover: the class, the bins and a stream that needs them
  `${streamScene()}${acacia(1420, 620, 1)}
   ${recycleBin(1200, 900, 0.95, "paper")}
   ${litterBits(960, 930, 1)}
   ${zuri({ x: 560, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 800, y: 829, s: 1.1 })}`,

  // 2 on Saturday the class walks down to the stream
  `${streamScene()}${acacia(270, 630, 1.1)}
   ${giraffe({ x: 1220, y: 700, s: 0.9, glasses: true })}
   ${zuri({ x: 620, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 860, y: 836, s: 1.05 })}
   ${elephant({ x: 400, y: 850, s: 0.48 })}`,

  // 3 the water is not clean any more
  `${streamScene()}
   ${litterBits(780, 800, 1.2)}${litterBits(1140, 940, 0.95)}
   ${zuri({ x: 430, y: 808, s: 1.3, mood: "sad" })}`,

  // 4 Zuri picks up a bottle
  `${streamScene()}
   ${waterBottle(1020, 900, 1.1)}
   ${zuri({ x: 660, y: 802, s: 1.35, pointing: true })}`,

  // 5 Kiki picks up the paper
  `${streamScene()}
   ${litterBits(1030, 930, 1.1)}
   ${kiki({ x: 720, y: 816, s: 1.2, arms: "up" })}
   ${zuri({ x: 430, y: 821, s: 1.2, book: true })}`,

  // 6 the elephant carries the big bag
  `${streamScene()}
   ${elephant({ x: 970, y: 800, s: 0.8, trunkUp: true })}
   ${litterBits(560, 940, 0.9)}
   ${zuri({ x: 330, y: 821, s: 1.2 })}`,

  // 7 paper, tins and glass, each into its own bin
  `${streamScene()}
   ${recycleBin(520, 900, 1.05, "paper")}${recycleBin(800, 900, 1.05, "tins")}${recycleBin(1080, 900, 1.05, "glass")}
   ${zuri({ x: 280, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1380, y: 836, s: 1.05 })}`,

  // 8 by the afternoon the water runs clear
  `${streamScene()}${acacia(1420, 620, 1)}${tallGrass(200, 930, 1.2)}
   ${fish(880, 700, 2.6)}
   ${zuri({ x: 620, y: 802, s: 1.35, arms: "up" })}`,

  // 9 and a bird comes back to drink
  `${streamScene()}${acacia(270, 630, 1.05)}
   ${wildBird(1010, 664, 1.1)}
   ${zuri({ x: 620, y: 808, s: 1.3, pointing: true })}
   ${kiki({ x: 870, y: 829, s: 1.1 })}`,

  // 10 "Who put it here?"  "Somebody."  "Who takes it away?"  "We do."
  `${streamScene()}
   ${giraffe({ x: 1100, y: 700, s: 0.92, glasses: true, bend: true })}
   ${zuri({ x: 560, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 790, y: 836, s: 1.05 })}`,

  // 11 the class paints a sign for the bank
  `${streamScene()}
   ${easel(1020, 900, 1.05, { inner: shapeTile(0, 0, 0.45, "heart", "#8ab17d") })}
   ${zuri({ x: 560, y: 808, s: 1.3, arms: "up" })}`,

  // 12 and next Saturday they will come again
  `${streamScene({ evening: true })}${acacia(1400, 620, 1.05)}
   ${recycleBin(300, 910, 0.9, "paper")}
   ${zuri({ x: 700, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 950, y: 829, s: 1.1, arms: "up" })}`,
];

// ================================================================ Book 7c
// Thank You, Tree — Unit 7: parts of a plant, and plants and clean air

const thankYouTreePages = [
  // 1 cover: the old acacia, and the two who sit under it
  `${basicScene()}${acacia(900, 600, 1.9)}${tallGrass(280, 940, 1.2)}
   ${wildBird(1180, 380, 1, true)}
   ${zuri({ x: 700, y: 795, s: 1.4, arms: "up" })}
   ${kiki({ x: 990, y: 829, s: 1.1 })}`,

  // 2 at midday the sun is very hot
  `${daylightScene(800, 140)}${acacia(1180, 620, 1.6)}${sunnyPatch(500, 940)}
   ${zuri({ x: 480, y: 802, s: 1.35 })}`,

  // 3 but under the tree it is cool
  `${daylightScene(300, 160)}${acacia(1000, 600, 1.9)}
   ${zuri({ x: 980, y: 802, s: 1.35 })}
   ${kiki({ x: 1230, y: 829, s: 1.1 })}`,

  // 4 the roots hold the soil, down where nobody sees them
  `${gardenScene()}
   ${plantParts(960, 640, 1)}
   ${zuri({ x: 400, y: 808, s: 1.3, pointing: true })}
   ${lookLine(490, 760, 840, 764)}`,

  // 5 the stem carries the water all the way up
  `${gardenScene()}
   ${plantParts(880, 640, 0.95)}
   ${wateringCan(1330, 800, 1)}
   ${zuri({ x: 380, y: 821, s: 1.2, book: true })}`,

  // 6 the leaves make the air clean
  `${basicScene()}${acacia(950, 600, 1.8)}
   ${bigLeaf(1290, 560, 1.2)}
   ${zuri({ x: 500, y: 808, s: 1.3, arms: "up" })}`,

  // 7 the flowers bring the bees
  `${gardenScene()}${gardenPlant(1020, 890, 1.4)}${gardenPlant(570, 900, 1.1)}
   ${beeBug(840, 680, 1.4)}${butterflyBug(1270, 430, 1)}
   ${zuri({ x: 300, y: 815, s: 1.25, pointing: true })}`,

  // 8 and the seeds make new trees
  `${gardenScene()}${sapling(1200, 894, 1.1)}
   ${seedProp(960, 890, 4)}
   ${zuri({ x: 620, y: 802, s: 1.35, book: true })}`,

  // 9 Zuri plants a young one beside the old one
  `${basicScene()}${acacia(1220, 620, 1.6)}${sapling(780, 924, 1.2)}
   ${zuri({ x: 470, y: 808, s: 1.3, arms: "up" })}
   ${kiki({ x: 280, y: 829, s: 1.1 })}`,

  // 10 and waters it every single day
  `${basicScene()}${acacia(1270, 620, 1.5)}${sapling(970, 924, 1.15)}
   ${wateringCan(780, 800, 1.1, { pouring: true })}
   ${zuri({ x: 540, y: 808, s: 1.3 })}`,

  // 11 the birds nest in the old acacia
  `${basicScene()}${acacia(1000, 620, 1.6)}
   ${nest(1010, 470, 1.3)}${wildBird(1050, 436, 0.9)}
   ${zuri({ x: 560, y: 815, s: 1.25, pointing: true })}`,

  // 12 "Thank you, tree," said Zuri
  `${sunsetScene()}${acacia(1000, 620, 1.8)}
   ${zuri({ x: 640, y: 795, s: 1.4, arms: "up", book: true })}
   ${kiki({ x: 890, y: 829, s: 1.1, arms: "up" })}`,
];

// ================================================================ Book 8b
// A Room for Everything — Unit 8: rooms in a home, and the things in them

const roomForEverythingPages = [
  // 1 cover: two rooms open like a doll's house
  `${roomScene()}
   ${roomBox(430, 640, 0.86, "kitchen")}
   ${roomBox(1160, 640, 0.86, "bedroom")}
   ${zuri({ x: 700, y: 827, s: 1.15, book: true })}
   ${kiki({ x: 900, y: 823, s: 1.15, arms: "up" })}`,

  // 2 "Come and see my home," said Kiki
  `${basicScene()}${treeHouse(1000, 940, 0.9)}
   ${kiki({ x: 500, y: 810, s: 1.25, arms: "up" })}
   ${zuri({ x: 280, y: 827, s: 1.15, book: true })}`,

  // 3 the kitchen: a sink, a cooker and a cupboard
  `${roomScene()}
   ${roomBox(700, 640, 1.35, "kitchen")}
   ${zuri({ x: 1290, y: 827, s: 1.15, pointing: true })}
   ${kiki({ x: 1470, y: 823, s: 1.15 })}`,

  // 4 the dining room: a table and four chairs
  `${roomScene({ wall: "#eee0c8" })}
   ${roomBox(950, 640, 1.35, "dining")}
   ${zuri({ x: 260, y: 827, s: 1.15, book: true })}
   ${kiki({ x: 440, y: 823, s: 1.15, arms: "up" })}`,

  // 5 the living room: a soft sofa and a warm rug
  `${roomScene()}
   ${roomBox(680, 620, 1.5, "living")}
   ${kiki({ x: 1250, y: 823, s: 1.15 })}
   ${zuri({ x: 1440, y: 827, s: 1.15, book: true })}`,

  // 6 the bedroom: a bed, a pillow and a window
  `${roomScene({ wall: "#e3e6dd" })}
   ${roomBox(1000, 640, 1.3, "bedroom")}
   ${zuri({ x: 300, y: 827, s: 1.15, arms: "up" })}
   ${kiki({ x: 520, y: 823, s: 1.15 })}`,

  // 7 and the bathroom, with a tap that drips
  `${roomScene({ wall: "#dfe9f2" })}
   ${roomBox(620, 630, 1.45, "bathroom")}
   ${zuri({ x: 1240, y: 827, s: 1.15, pointing: true })}`,

  // 8 "And where do you keep your books?"
  `${roomScene()}
   ${bookShelf(920, 700, 1.3, { count: 12 })}
   ${zuri({ x: 400, y: 821, s: 1.2, pointing: true })}
   ${kiki({ x: 1320, y: 823, s: 1.15, arms: "up" })}`,

  // 9 Zuri's burrow has one room for everything
  `${basicScene()}${burrow(950, 900, 1.15)}${tallGrass(290, 940, 1.3)}
   ${zuri({ x: 480, y: 795, s: 1.4, arms: "up" })}`,

  // 10 "Is one room enough?"  "It is enough for me."
  `${nightScene()}${burrow(1140, 890, 0.95)}
   ${kiki({ x: 620, y: 829, s: 1.1 })}
   ${zuri({ x: 850, y: 808, s: 1.3 })}`,

  // 11 so they draw both homes, side by side
  `${schoolScene()}
   ${easel(560, 900, 1.05, { inner: house(0, 40, 0.32) })}
   ${easel(1120, 900, 1.05, { inner: burrow(0, 34, 0.34) })}
   ${zuri({ x: 840, y: 840, s: 1.05, book: true })}`,

  // 12 every home has a place for everything it needs
  `${sunsetScene()}${treeHouse(1320, 940, 0.62)}${burrow(400, 950, 0.66)}
   ${zuri({ x: 700, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 940, y: 836, s: 1.05, arms: "up" })}`,
];

// ================================================================ Book 8c
// Far Away Homes — Unit 8: homes around the world

const farAwayHomesPages = [
  // 1 cover: four homes from four faraway places
  `${basicScene()}
   ${worldHome(280, 900, 0.7, "adobe")}${worldHome(680, 900, 0.7, "stilt")}${worldHome(1060, 900, 0.7, "cave")}${worldHome(1430, 900, 0.6, "skyscraper")}
   ${zuri({ x: 870, y: 847, s: 1, book: true })}`,

  // 2 Miss Twiga brings a big book of homes
  `${schoolScene()}${bench(800, 940, 1.4)}
   ${giraffe({ x: 450, y: 620, s: 0.95, glasses: true, bend: true })}
   ${openBook(890, 838, 1.35)}
   ${zuri({ x: 700, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1140, y: 836, s: 1.05, arms: "up" })}`,

  // 3 an adobe house, where it is hot and dry
  `${basicScene()}${worldHome(970, 890, 1.35, "adobe")}${tallGrass(280, 940, 1.2)}
   ${zuri({ x: 430, y: 808, s: 1.3, pointing: true })}`,

  // 4 a stilt house, where the water rises
  `${basicScene()}${worldHome(970, 890, 1.25, "stilt")}
   ${zuri({ x: 400, y: 808, s: 1.3, mood: "surprised" })}`,

  // 5 a cave house, cut into the cool rock
  `${basicScene()}${worldHome(970, 890, 1.25, "cave")}
   ${zuri({ x: 400, y: 815, s: 1.25, book: true })}`,

  // 6 a skyscraper, with more windows than she could count
  `${sky()}${sun(280, 170)}${hills()}${ground()}
   ${worldHome(970, 900, 1.35, "skyscraper")}
   ${zuri({ x: 450, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 250, y: 829, s: 1.1, pointing: true })}`,

  // 7 a nest of twigs, high in the acacia
  `${basicScene()}${acacia(1000, 620, 1.6)}
   ${nest(1010, 470, 1.4)}${wildBird(1050, 434, 0.95)}
   ${zuri({ x: 560, y: 815, s: 1.25, pointing: true })}`,

  // 8 a hive of wax, humming all day
  `${basicScene()}${acacia(1060, 620, 1.6)}
   ${beehive(1260, 470, 1.1)}${beeBug(700, 620, 0.95)}
   ${zuri({ x: 500, y: 815, s: 1.25, book: true })}`,

  // 9 and a burrow, under the ground, where the sand is cool
  `${basicScene()}${burrow(970, 900, 1.2)}${tallGrass(300, 940, 1.25)}
   ${zuri({ x: 520, y: 795, s: 1.4, arms: "up" })}`,

  // 10 different walls, different roofs, different doors
  `${basicScene()}
   ${house(300, 900, 0.62)}${flatBlock(700, 900, 0.5)}${hut(1080, 900, 0.62)}${treeHouse(1430, 940, 0.6)}
   ${zuri({ x: 870, y: 847, s: 1, book: true })}`,

  // 11 but the same thing inside every single one
  `${roomScene()}
   ${roomBox(780, 640, 1.3, "living")}
   ${zuri({ x: 290, y: 827, s: 1.15, arms: "up" })}
   ${kiki({ x: 1340, y: 823, s: 1.15, arms: "up" })}`,

  // 12 Zuri draws every one of them into her book
  `${sunsetScene()}
   ${worldHome(300, 940, 0.55, "adobe")}${worldHome(620, 940, 0.55, "stilt")}${worldHome(940, 940, 0.55, "cave")}${worldHome(1320, 940, 0.48, "skyscraper")}
   ${zuri({ x: 800, y: 847, s: 1, book: true, arms: "up" })}`,
];

// ================================================================ Book 9b
// Ten O'Clock at the Aquarium — Unit 9: the aquarium schedule and adjectives

const aquariumSchedulePages = [
  // 1 cover: the big tank, and two very small visitors
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: octopus(-180, -230, 1.1) + penguin(180, -250, 0.9) + fish(300, -140, 1.3) + fish(-320, -120, 1.1) })}
   ${zuri({ x: 340, y: 827, s: 1.15, arms: "up" })}
   ${kiki({ x: 1250, y: 843, s: 1, arms: "up" })}`,

  // 2 the schedule on the wall says what happens when
  `${aquariumRoom()}
   ${aquariumTank(1240, 640, 0.6, { inner: fish(-200, -160, 1.3) + fish(120, -250, 1.1) })}
   ${notepad(640, 780, 1.6)}
   ${zuri({ x: 380, y: 821, s: 1.2, pointing: true })}
   ${kiki({ x: 190, y: 843, s: 1 })}`,

  // 3 ten o'clock: the octopus, and eight clever arms
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: octopus(40, -220, 1.35) + fish(-280, -150, 1.5) })}
   ${zuri({ x: 340, y: 827, s: 1.15, arms: "up" })}`,

  // 4 eleven o'clock: the penguins, and they are fast
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: penguin(-220, -240, 1.05) + penguin(60, -260, 1, { flip: true, diving: true }) + fish(320, -160, 1.1) })}
   ${zuri({ x: 340, y: 834, s: 1.1, pointing: true })}
   ${kiki({ x: 1260, y: 843, s: 1, arms: "up" })}`,

  // 5 twelve o'clock: the turtle is fed, and the turtle is slow
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: seaTurtle(60, -200, 1.2) + fish(-300, -260, 1) })}
   ${zuri({ x: 340, y: 827, s: 1.15, book: true })}`,

  // 6 one o'clock: the shark, and the shark is huge
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: shark(-20, -220, 1.1) + fish(320, -330, 0.9) })}
   ${kiki({ x: 400, y: 829, s: 1.1, mood: "surprised" })}
   ${zuri({ x: 1240, y: 834, s: 1.1, mood: "surprised" })}`,

  // 7 Kiki is frightened, so Zuri stands beside her
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: shark(140, -250, 0.95) })}
   ${kiki({ x: 620, y: 829, s: 1.1, mood: "sad" })}
   ${zuri({ x: 850, y: 827, s: 1.15 })}`,

  // 8 two o'clock: a hundred small fish, all turning at once
  `${aquariumRoom()}
   ${aquariumTank(800, 660, 1.08, { inner: [[-300, -300], [-180, -240], [-60, -300], [60, -250], [180, -310], [300, -250], [-240, -160], [-60, -150], [120, -160], [280, -140]].map(([fx, fy]) => fish(fx, fy, 1)).join("") })}
   ${zuri({ x: 340, y: 827, s: 1.15, arms: "up" })}`,

  // 9 three o'clock: the talk, and one rule about the sea
  `${aquariumRoom()}
   ${giraffe({ x: 1120, y: 780, s: 0.8, glasses: true, bend: true })}
   ${zuri({ x: 500, y: 827, s: 1.15, book: true })}
   ${kiki({ x: 720, y: 843, s: 1 })}`,

  // 10 Zuri copies the whole schedule into her book
  `${aquariumRoom()}
   ${aquariumTank(1240, 640, 0.6, { inner: seaTurtle(0, -180, 1) })}
   ${notepad(700, 790, 1.4)}
   ${openBook(400, 880, 1)}
   ${zuri({ x: 400, y: 815, s: 1.25, book: true })}`,

  // 11 and then out into the loud, bright city again
  `${streetScene()}${cityBuildings(1030, 690, 0.8)}
   ${townBus(430, 900, 0.62)}
   ${zuri({ x: 800, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 1020, y: 836, s: 1.05 })}`,

  // 12 "Amazing," said Zuri
  `${sunsetScene()}${cityBuildings(560, 720, 0.86)}
   ${ferrisWheel(1200, 480, 0.78, { lit: true })}
   ${zuri({ x: 620, y: 802, s: 1.35, book: true, arms: "up" })}
   ${kiki({ x: 890, y: 829, s: 1.1, arms: "up" })}`,
];

// ================================================================ Book 9c
// Which Way to the Library? — Unit 9: places in the city, and directions

const whichWayLibraryPages = [
  // 1 cover: one map, one street, one very big city
  `${streetScene()}${cityBuildings(1170, 690, 0.7)}
   ${mapProp(850, 800, 1.3)}
   ${crossing(320, 810, 0.7, { sign: true })}
   ${zuri({ x: 560, y: 808, s: 1.3, pointing: true })}
   ${kiki({ x: 1350, y: 836, s: 1.05 })}`,

  // 2 the class has to find the library before lunch
  `${streetScene()}${cityBuildings(1200, 690, 0.62)}
   ${giraffe({ x: 380, y: 690, s: 0.9, glasses: true, bend: true })}
   ${zuri({ x: 900, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1110, y: 836, s: 1.05 })}`,

  // 3 Miss Twiga gives Zuri the map
  `${streetScene()}${shopRow(1230, 690, 0.72)}
   ${mapProp(920, 806, 1.25)}
   ${giraffe({ x: 400, y: 690, s: 0.88, glasses: true, bend: true })}
   ${zuri({ x: 700, y: 815, s: 1.25, pointing: true })}`,

  // 4 "Straight ahead," said the map
  `${streetScene()}${cityBuildings(920, 690, 0.85)}
   ${trafficRow(1280, 800, 0.6)}
   ${zuri({ x: 500, y: 808, s: 1.3, pointing: true })}
   ${kiki({ x: 290, y: 829, s: 1.1 })}`,

  // 5 past the market, where everybody was calling
  `${streetScene()}${shopRow(1200, 690, 0.78)}
   ${marketStall(800, 860, 0.95)}
   ${hen({ x: 790, y: 890, s: 0.54 })}
   ${zuri({ x: 300, y: 821, s: 1.2, book: true })}`,

  // 6 turn left at the shopping centre
  `${streetScene()}${shoppingCentre(1100, 780, 0.8)}
   ${zuri({ x: 470, y: 808, s: 1.3, pointing: true })}
   ${kiki({ x: 710, y: 829, s: 1.1 })}`,

  // 7 stop, look, listen — then cross
  `${streetScene()}${cityBuildings(1230, 690, 0.6)}
   ${crossing(720, 820, 1.05, { sign: true })}
   ${trafficRow(1330, 776, 0.5)}
   ${zuri({ x: 400, y: 821, s: 1.2, arms: "up" })}
   ${kiki({ x: 240, y: 836, s: 1.05 })}`,

  // 8 past the clock tower, at exactly half past eleven
  `${streetScene()}${clockTower(1070, 700, 1.1)}
   ${zuri({ x: 500, y: 815, s: 1.25, pointing: true })}
   ${kiki({ x: 290, y: 836, s: 1.05 })}`,

  // 9 "Are we lost?" said Kiki
  `${streetScene()}${cityBuildings(1170, 690, 0.66)}
   ${mapProp(1010, 800, 1.1)}
   ${kiki({ x: 620, y: 829, s: 1.1, mood: "sad" })}
   ${zuri({ x: 400, y: 815, s: 1.25, book: true })}`,

  // 10 the map said right, so right they went
  `${streetScene()}${cityBuildings(300, 690, 0.6)}
   ${mapProp(860, 800, 1.25)}
   ${zuri({ x: 560, y: 808, s: 1.3, pointing: true })}
   ${kiki({ x: 1220, y: 829, s: 1.1, arms: "up" })}`,

  // 11 and there it was
  `${streetScene()}${libraryBuilding(990, 780, 0.95)}
   ${zuri({ x: 340, y: 802, s: 1.35, arms: "up" })}
   ${kiki({ x: 570, y: 829, s: 1.1, arms: "up" })}`,

  // 12 inside: quiet, cool, and full of words
  `${roomScene({ wall: "#e8e0cf" })}
   ${bookShelf(920, 700, 1.4, { count: 12 })}
   ${openBook(700, 878, 1)}
   ${zuri({ x: 400, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 1350, y: 823, s: 1.15 })}`,
];

// ================================================================ Book 10b
// Zuri Makes a Plan — Unit 10: the "My English World" project brief

const zuriMakesAPlanPages = [
  // 1 cover: a plan on the board and a page not yet drawn
  `${schoolScene()}${chalkboard(1300, 850, 0.9)}
   ${easel(1010, 900, 1.05, { inner: notepad(0, 24, 0.5) })}
   ${zuri({ x: 620, y: 802, s: 1.35, book: true })}
   ${kiki({ x: 860, y: 829, s: 1.1, arms: "up" })}`,

  // 2 Miss Twiga reads the brief out loud
  `${schoolScene()}${bench(800, 940, 1.4)}
   ${giraffe({ x: 450, y: 620, s: 0.95, glasses: true, bend: true })}
   ${openBook(900, 838, 1.3)}
   ${zuri({ x: 700, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1160, y: 836, s: 1.05 })}`,

  // 3 step one: choose
  `${schoolScene()}
   ${thoughtBubble(1010, 400, 1.05, shapeTile(30, -10, 0.9, "heart", "#e76f51"))}
   ${zuri({ x: 560, y: 802, s: 1.35 })}`,

  // 4 step two: plan — nine pages, one for every unit
  `${basicScene()}${acacia(300, 620, 1.35)}
   ${chalkboard(1010, 800, 1.5)}
   ${zuri({ x: 470, y: 815, s: 1.25, pointing: true })}
   ${kiki({ x: 1440, y: 836, s: 1.05 })}`,

  // 5 step three: collect what she already has
  `${schoolScene()}${bench(890, 940, 1.5)}
   ${openBook(890, 838, 1.35)}
   ${bookShelf(1340, 760, 0.9, { count: 9 })}
   ${zuri({ x: 470, y: 815, s: 1.25, book: true })}`,

  // 6 step four: draw
  `${schoolScene()}
   ${easel(1010, 900, 1.15, { inner: butterflyBug(0, 0, 0.7) })}
   ${zuri({ x: 560, y: 802, s: 1.35, arms: "up" })}`,

  // 7 step five: write
  `${schoolScene()}${bench(910, 940, 1.6)}
   ${openBook(910, 838, 1.4)}
   ${zuri({ x: 500, y: 808, s: 1.3, book: true })}
   ${kiki({ x: 1320, y: 836, s: 1.05 })}`,

  // 8 step six: check every single word
  `${schoolScene()}
   ${notepad(1020, 800, 1.4)}
   ${zuri({ x: 560, y: 808, s: 1.3, pointing: true })}`,

  // 9 Kiki checks Zuri's page, and Zuri checks Kiki's
  `${schoolScene()}${bench(840, 940, 1.6)}
   ${openBook(620, 852, 0.95)}${openBook(1060, 852, 0.95)}
   ${zuri({ x: 470, y: 815, s: 1.25, book: true })}
   ${kiki({ x: 1230, y: 816, s: 1.2, pointing: true })}`,

  // 10 one mistake found, and mended
  `${basicScene()}${acacia(280, 620, 1.35)}
   ${chalkboard(1020, 800, 1.45)}
   ${zuri({ x: 470, y: 808, s: 1.3, mood: "surprised", pointing: true })}
   ${kiki({ x: 1440, y: 836, s: 1.05 })}`,

  // 11 the plan on the wall, with every step ticked
  `${schoolScene()}
   ${easel(560, 900, 1.05, { inner: notepad(0, 24, 0.5) })}
   ${easel(1130, 900, 1.05, { inner: shapeTile(0, 0, 0.42, "heart", "#8ab17d") })}
   ${zuri({ x: 850, y: 815, s: 1.25, arms: "up" })}`,

  // 12 "Now it is ready"
  `${sunsetScene()}${acacia(1400, 640, 1.05)}${bench(560, 930, 1.3)}
   ${openBook(1020, 852, 1)}
   ${zuri({ x: 700, y: 795, s: 1.4, book: true, arms: "up" })}
   ${kiki({ x: 960, y: 829, s: 1.1, arms: "up" })}`,
];

// ================================================================ Book 10c
// The Day of the Showcase — Unit 10: Showcase Day

const showcaseDayPages = [
  // 1 cover: the whole exhibition, and the pupil who made a page of it
  `${schoolScene()}${bunting(800, 190, 1.2, { span: 1200 })}
   ${easel(330, 900, 0.86, { inner: butterflyBug(0, 0, 0.72) })}
   ${easel(1240, 900, 0.86, { inner: shapeTile(0, 0, 0.5, "heart", "#e76f51") })}
   ${giraffe({ x: 1420, y: 630, s: 0.82, glasses: true })}
   ${zuri({ x: 700, y: 789, s: 1.45, book: true, arms: "up" })}
   ${kiki({ x: 950, y: 829, s: 1.1, arms: "up" })}`,

  // 2 the families arrive at the tree school
  `${schoolScene()}${bunting(800, 200, 1.1, { span: 1050 })}
   ${zebra({ x: 1170, y: 730, s: 0.78 })}
   ${donkey({ x: 300, y: 800, s: 0.58 })}
   ${zuri({ x: 700, y: 815, s: 1.25, arms: "up" })}
   ${kiki({ x: 930, y: 836, s: 1.05, arms: "up" })}`,

  // 3 Zuri stands beside her own easel
  `${schoolScene()}
   ${easel(1010, 900, 1.2, { inner: greetingCard(0, -6, 0.8) })}
   ${zuri({ x: 500, y: 795, s: 1.4, pointing: true })}`,

  // 4 page one: her name, and how to spell it
  `${schoolScene()}
   ${easel(1010, 900, 1.15, { inner: openBook(0, 20, 0.55) })}
   ${zuri({ x: 500, y: 789, s: 1.45, arms: "up" })}`,

  // 5 page two: the neighbours who help
  `${schoolScene()}
   ${easel(1010, 900, 1.15, { inner: townBus(0, 24, 0.24) })}
   ${fireKit(420, 906, 0.6)}
   ${zuri({ x: 640, y: 815, s: 1.25, book: true })}`,

  // 6 page four: the sun, and her own long shadow
  `${schoolNoonScene(1310, 160)}
   ${easel(1050, 900, 1.15, { inner: shapeTile(0, 0, 0.42, "circle", "#f4c95d") })}
   ${castShadow(560, 953, { length: 320, dir: -1, height: 44 })}
   ${zuri({ x: 560, y: 802, s: 1.35, pointing: true })}`,

  // 7 page six: the six-leg club
  `${schoolScene()}
   ${easel(1050, 920, 0.86, { inner: butterflyBug(0, 0, 0.68) })}
   ${butterflyBug(560, 380, 1.2)}${cricketBug(1350, 890, 0.85)}
   ${zuri({ x: 500, y: 808, s: 1.3, book: true })}`,

  // 8 then it is Kiki's turn
  `${schoolScene()}
   ${easel(1010, 900, 1.15, { inner: shapeTile(0, 0, 0.45, "square", "#8ab17d") })}
   ${kiki({ x: 520, y: 810, s: 1.25, arms: "up" })}
   ${zuri({ x: 290, y: 827, s: 1.15, book: true })}`,

  // 9 Musa, Duku and Lulu come to look
  `${schoolScene()}${bunting(800, 200, 1.1, { span: 1000 })}
   ${zebra({ x: 1150, y: 730, s: 0.8 })}
   ${donkey({ x: 290, y: 810, s: 0.54 })}
   ${lulu({ x: 760, y: 330, s: 0.7, flying: true })}
   ${zuri({ x: 640, y: 815, s: 1.25, arms: "up" })}`,

  // 10 and Zuri's mama claps loudest of all
  `${schoolScene()}${confetti(800, 560)}
   ${zuri({ x: 980, y: 756, s: 1.85, arms: "up" })}
   ${zuri({ x: 660, y: 815, s: 1.25, arms: "up" })}`,

  // 11 a card for every pupil in the class
  `${schoolScene()}${bench(840, 940, 1.5)}
   ${greetingCard(840, 812, 1.3)}
   ${giraffe({ x: 400, y: 620, s: 0.95, glasses: true, bend: true })}
   ${zuri({ x: 620, y: 821, s: 1.2, book: true })}
   ${kiki({ x: 1200, y: 836, s: 1.05, arms: "up" })}`,

  // 12 "And next year, Year 3," said Zuri
  `${sunsetScene()}${bunting(800, 190, 1.2, { span: 1200 })}${confetti(800, 600)}
   ${acacia(1420, 640, 1.05)}
   ${zuri({ x: 700, y: 795, s: 1.4, book: true, arms: "up" })}
   ${kiki({ x: 960, y: 829, s: 1.1, arms: "up" })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "first-week": { dir: "zuris-first-week", pages: firstWeekPages },
  "word-hunt": { dir: "the-word-hunt", pages: wordHuntPages },
  "my-partner": { dir: "this-is-my-partner", pages: myPartnerPages },
  "our-street": { dir: "who-helps-our-street", pages: helpsOurStreetPages },
  "fire-bell": { dir: "the-day-the-fire-bell-rang", pages: fireBellPages },
  "ask-questions": { dir: "zuri-asks-the-questions", pages: askTheQuestionsPages },
  "move-like-me": { dir: "move-like-me", pages: moveLikeMePages },
  "sports-day": { dir: "sports-day-at-the-tree-school", pages: sportsDayPages },
  "twiga-says": { dir: "miss-twiga-says", pages: twigaSaysPages },
  "her-shadow": { dir: "zuri-and-her-shadow", pages: shadowPages },
  "weather-today": { dir: "what-is-the-weather-today", pages: weatherTodayPages },
  "where-sun-goes": { dir: "where-does-the-sun-go", pages: whereSunGoesPages },
  "how-tall": { dir: "how-tall-how-long", pages: measurePages },
  "shape-hunt": { dir: "the-shape-hunt", pages: shapeHuntPages },
  "tens-opposites": { dir: "ten-twenty-one-hundred", pages: tensAndOppositesPages },
  "six-leg-club": { dir: "the-six-leg-club", pages: sixLegPages },
  "where-cricket": { dir: "where-is-the-cricket", pages: whereIsTheCricketPages },
  "ants-crumb": { dir: "the-ants-and-the-big-crumb", pages: antsAndTheCrumbPages },
  "one-seed": { dir: "one-small-seed", pages: oneSmallSeedPages },
  "stream-clean-up": { dir: "the-stream-clean-up", pages: streamCleanUpPages },
  "thank-you-tree": { dir: "thank-you-tree", pages: thankYouTreePages },
  "every-home": { dir: "every-home-is-different", pages: everyHomePages },
  "room-for-everything": { dir: "a-room-for-everything", pages: roomForEverythingPages },
  "far-away-homes": { dir: "far-away-homes", pages: farAwayHomesPages },
  "big-city": { dir: "a-day-in-the-big-city", pages: bigCityPages },
  "aquarium-schedule": { dir: "ten-oclock-at-the-aquarium", pages: aquariumSchedulePages },
  "which-way-library": { dir: "which-way-to-the-library", pages: whichWayLibraryPages },
  "book-of-the-year": { dir: "zuris-book-of-the-year", pages: bookOfTheYearPages },
  "makes-a-plan": { dir: "zuri-makes-a-plan", pages: zuriMakesAPlanPages },
  "showcase-day": { dir: "the-day-of-the-showcase", pages: showcaseDayPages },
};

writeBooks(books, process.argv[2]);
