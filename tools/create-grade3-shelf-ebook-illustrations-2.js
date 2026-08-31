#!/usr/bin/env node

// Grade 3, books FIVE to SEVEN of Units 5, 6 and 7 — the shelf's growth from
// four books to seven. The first four books of each unit already retell all
// five of the unit's texts, so these nine are new KINDS of book, the way the
// Grade 1 expansion worked: a CONTINUATION of the unit's own story, a
// VOCABULARY-IN-ACTION story built on one of the unit's vocabulary groups, and
// a third original story on the unit's theme in a setting the other two do not
// use.
//
//   Unit 5  Stories on the Wall      continuation of "The Wall Behind the Garden"
//   Unit 5  A Garden by the Metre    vocabulary: measuring and comparing
//   Unit 5  The Bench in the Yard    original: working together, step by step
//   Unit 6  Now It Is My Turn        continuation of "The Girl Who Carried Kindness"
//   Unit 6  The Shiny Beetle         vocabulary: small creatures and where they are
//   Unit 6  Guess Who I Mean         original: describing people with adjectives
//   Unit 7  After the Trip           continuation of "From Coast to Forest"
//   Unit 7  The Beach Clean-Up       vocabulary: caring for our world
//   Unit 7  The Frozen Pond          original: weather and temperature, on the trail
//
// Only existing kit exports are used; anything new is a purely local inline
// prop below, and a local prop carries no data-tap — a tap value promises an
// audio clip that nobody has recorded.
//
// Usage: node tools/create-grade3-shelf-ebook-illustrations-2.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, acacia, tallGrass, bench, marketStall, confetti, dustPuffs, goat,
  wildBird, lake, bigLeaf, thoughtBubble, fence, seedRow, cloudPuff, puddle,
  litterBits, recycleBin, gardenPlant, plantStage, wateringCan, dugHole, flatStone,
  notepad, mapProp, rulerProp, metreStick, easel, bunting, openBook,
  sunsetScene, roomScene, roomBox, gardenScene, townScene,
  G2, G3, figure, heldBook, heldPaper,
  classroomScene, plainRoomScene, coastScene, forestScene, mountainScene,
  desk, shells, poster, gardenWall, thermometerProp, frostPatch, signPost,
} = require("./lib/ehel-ebook-kit-grade3.js");

const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const eveningRoom = () => `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
  <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>`;
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;

// ---------------------------------------------------------------- local props
//
// Everything below is drawn inline in this file only. No data-tap and no
// data-figure: these are scenery, not characters, and no clip exists for them.
// Animation classes sit on an inner <g> so they never share an element with a
// transform attribute.

// A shiny garden beetle, the hero of the Unit 6 vocabulary book.
function beetleProp(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="6" rx="34" ry="9" fill="${C.ink}" opacity="0.10"/>
    <ellipse cx="0" cy="-14" rx="30" ry="20" fill="${G3.tealDark}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M 0 -32 v 34" stroke="${C.ink}" stroke-width="2.6"/>
    <ellipse cx="-10" cy="-20" rx="9" ry="6" fill="#8fd0c8" opacity="0.8"/>
    <circle cx="30" cy="-14" r="11" fill="${G3.teal}" stroke="${C.ink}" stroke-width="3.2"/>
    <circle cx="34" cy="-17" r="2.6" fill="${C.ink}"/>
    <path d="M 36 -22 q 8 -8 6 -14 M 40 -18 q 10 -4 12 -10" stroke="${C.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M -18 0 l -8 8 M -4 2 l -4 10 M 10 2 l 2 10 M 22 0 l 8 8" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round"/>
  </g>`;
}

// A snail asleep under the big leaf.
function snailProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -34 0 q -6 -18 12 -22 q 30 -6 52 8 l 6 14 z" fill="#c9b083" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="-2" cy="-26" r="22" fill="#a8764f" stroke="${C.ink}" stroke-width="3.6"/>
    <path d="M -2 -26 m 14 0 a 14 14 0 1 1 -14 -14 a 8 8 0 1 1 8 8" fill="none" stroke="#7d5535" stroke-width="3.4"/>
    <path d="M -30 -18 q -4 -12 -1 -18 M -22 -20 q 0 -12 3 -17" stroke="${C.ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <circle cx="-31" cy="-38" r="2.6" fill="${C.ink}"/><circle cx="-19" cy="-39" r="2.6" fill="${C.ink}"/>
  </g>`;
}

// The small crab of the coast pages.
function crabProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="4" rx="32" ry="8" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="animation-duration:2.4s">
      <ellipse cx="0" cy="-14" rx="26" ry="17" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3.4"/>
      <path d="M -22 -2 l -8 8 M -10 0 l -4 9 M 10 0 l 4 9 M 22 -2 l 8 8" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
      <path d="M -24 -24 q -14 -10 -12 -22 q 10 2 14 10 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M 24 -24 q 14 -10 12 -22 q -10 2 -14 10 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="3"/>
      <circle cx="-8" cy="-30" r="4.5" fill="#fff" stroke="${C.ink}" stroke-width="2.4"/><circle cx="-8" cy="-30" r="1.8" fill="${C.ink}"/>
      <circle cx="8" cy="-30" r="4.5" fill="#fff" stroke="${C.ink}" stroke-width="2.4"/><circle cx="8" cy="-30" r="1.8" fill="${C.ink}"/>
    </g>
  </g>`;
}

// Dad's toolbox, for the bench repair.
function toolboxProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-64" y="-58" width="128" height="58" rx="8" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -24 -58 q 0 -26 24 -26 q 24 0 24 26" fill="none" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-64" y="-40" width="128" height="8" fill="#9c3f2e"/>
    <path d="M 40 -78 l 22 -20 m 0 0 l 8 8 l -10 10 z" stroke="#8f9aa8" stroke-width="7" fill="#8f9aa8" stroke-linecap="round"/>
  </g>`;
}

// The frozen pond: still water gone to ice, with the kit's frost stars on top.
function frozenPond(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="230" ry="52" fill="#cfe8f4" stroke="#8fb8cd" stroke-width="5"/>
    <ellipse cx="0" cy="-4" rx="190" ry="38" fill="#e4f3fa"/>
    <path d="M -120 -10 l 70 14 l 60 -18 M 30 6 l 60 -10" stroke="#a8cddd" stroke-width="3.4" fill="none"/>
  </g>`;
}

// A short trail of footprints in the sand.
function footprintTrail(x, y, s = 1) {
  const print = (px, py, r) => `<g transform="translate(${px} ${py}) rotate(${r})">
    <ellipse cx="0" cy="0" rx="13" ry="20" fill="#d3bd92"/><ellipse cx="0" cy="-26" rx="9" ry="7" fill="#d3bd92"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="0.9">
    ${print(-200, 20, -14)}${print(-130, -8, -10)}${print(-50, 14, -6)}${print(30, -12, -2)}${print(110, 8, 4)}${print(190, -14, 8)}
  </g>`;
}

// A question mark for the guessing game's thought bubbles.
const bigQuestion = `<text x="0" y="26" text-anchor="middle" font-family="Georgia, serif" font-size="86" fill="#4a5560">?</text>`;

// ================================================================ Unit 5, book 5
// Stories on the Wall — the next scene of "The Wall Behind the Garden": the
// reading wall is built, and now it gets its stories.

const wallStoriesPages = [
  // 1 cover: the finished wall wearing its first posters
  `${gardenScene()}${gardenWall(1060, 900, 1, { length: 620 })}${poster(950, 800, 0.55, { colour: G3.gold, lines: 3 })}${poster(1170, 800, 0.55, { colour: G3.sky, lines: 3 })}
   ${figure("amal", { x: 520, y: 900, s: 1.74, holding: heldPaper })}
   ${figure("leo", { x: 770, y: 900, s: 1.6 })}`,

  // 2 the new wall stood straight, strong but empty
  `${gardenScene()}${gardenWall(1080, 900, 1.05, { length: 640 })}
   ${figure("amal", { x: 540, y: 900, s: 1.7 })}
   ${figure("nora", { x: 780, y: 900, s: 1.56 })}`,

  // 3 "A reading wall needs stories," said Teacher Yasmin
  `${gardenScene()}${gardenWall(1100, 900, 1, { length: 580 })}
   ${figure("yasmin", { x: 540, y: 900, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 800, y: 900, s: 1.54 })}`,

  // 4 first, Amal pinned up her poem
  `${gardenScene()}${gardenWall(1090, 900, 1, { length: 600 })}${poster(1000, 800, 0.55, { colour: G3.gold, lines: 4 })}
   ${figure("amal", { x: 640, y: 900, s: 1.72, arms: "point" })}`,

  // 5 then Leo painted his blue waterfall beside it
  `${gardenScene()}${gardenWall(1090, 900, 1, { length: 600 })}${poster(990, 800, 0.55, { colour: G3.gold, lines: 4 })}${poster(1200, 800, 0.55, { colour: G3.sky, lines: 2 })}
   ${figure("leo", { x: 640, y: 900, s: 1.7, arms: "up" })}`,

  // 6 Nora copied out her best page in her neatest writing
  `${gardenScene()}${notepad(1180, 780, 1.25)}
   ${figure("nora", { x: 700, y: 900, s: 1.7, holding: heldPaper })}
   ${figure("amal", { x: 950, y: 900, s: 1.56 })}`,

  // 7 soon the wall was full of colour, middle to both sides
  `${gardenScene()}${gardenWall(1030, 900, 1.05, { length: 700 })}${poster(830, 800, 0.5, { colour: G3.coral, lines: 3 })}${poster(1020, 800, 0.5, { colour: G3.gold, lines: 3 })}${poster(1210, 800, 0.5, { colour: G3.sky, lines: 3 })}
   ${figure("amal", { x: 480, y: 900, s: 1.7, arms: "up" })}`,

  // 8 on Friday the whole class came outside to read the wall
  `${gardenScene()}${gardenWall(1130, 900, 1, { length: 540 })}${poster(1060, 800, 0.5, { colour: G3.gold, lines: 3 })}${poster(1240, 800, 0.5, { colour: G3.coral, lines: 3 })}
   ${figure("yasmin", { x: 380, y: 900, s: 1.6 })}
   ${figure("sami", { x: 610, y: 900, s: 1.56 })}
   ${figure("mina", { x: 800, y: 902, s: 1.2 })}`,

  // 9 even the goat came back — and ate nothing
  `${gardenScene()}${gardenWall(1130, 900, 1, { length: 540 })}${poster(1120, 800, 0.5, { colour: G3.gold, lines: 3 })}
   ${goat({ x: 880, y: 872, s: 0.62, flip: true })}
   ${figure("amal", { x: 560, y: 900, s: 1.7, mood: "surprised" })}`,

  // 10 "The wall protects our garden. And now it feeds us stories."
  `${gardenScene()}${gardenWall(1110, 900, 1, { length: 560 })}${poster(1030, 800, 0.5, { colour: G3.sky, lines: 3 })}${gardenPlant(420, 890, 1.15)}
   ${figure("amal", { x: 680, y: 900, s: 1.72, arms: "point" })}`,

  // 11 Grandma Hana stayed until sunset
  `${sunsetScene()}${gardenWall(1130, 900, 1, { length: 540 })}${poster(1060, 800, 0.5, { colour: G3.gold, lines: 4 })}
   ${figure("hana", { x: 640, y: 900, s: 1.66 })}
   ${figure("amal", { x: 890, y: 900, s: 1.54 })}`,

  // 12 flowers on one side, stories on the other
  `${gardenScene()}${gardenPlant(400, 890, 1.3)}${gardenWall(1130, 900, 1, { length: 540 })}${poster(1060, 800, 0.5, { colour: G3.coral, lines: 3 })}${poster(1240, 800, 0.5, { colour: G3.sky, lines: 3 })}
   ${figure("amal", { x: 640, y: 900, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 880, y: 900, s: 1.56, arms: "up" })}`,
];

// ================================================================ Unit 5, book 6
// A Garden by the Metre — the "measuring and comparing" words at work:
// metre, equal, deep, wide, simple, difficult, correct, middle, centre, copy, plan.

const metreGardenPages = [
  // 1 cover: Amal with the plan, Leo with the metre stick
  `${gardenScene()}${metreStick(1150, 890, 1.3)}
   ${figure("amal", { x: 620, y: 900, s: 1.74, holding: heldPaper })}
   ${figure("leo", { x: 890, y: 900, s: 1.6 })}`,

  // 2 "Our plan must be correct. So we will measure everything."
  `${gardenScene()}${notepad(1180, 780, 1.25)}
   ${figure("leo", { x: 640, y: 900, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 900, y: 900, s: 1.56 })}`,

  // 3 the garden was four metres wide; we measured twice
  `${gardenScene()}${metreStick(760, 890, 1.25)}${rulerProp(1150, 876, 1.2, { length: 300 })}
   ${figure("amal", { x: 460, y: 900, s: 1.66 })}
   ${figure("leo", { x: 1380, y: 900, s: 1.56 })}`,

  // 4 every seed row equal: one metre, then one metre again
  `${gardenScene()}${seedRow(1000, 906, 1.1, { sprouts: false })}${seedRow(1330, 906, 1.1, { sprouts: false })}${rulerProp(1160, 856, 1, { length: 240 })}
   ${figure("amal", { x: 600, y: 900, s: 1.7, arms: "point" })}`,

  // 5 the holes must not be too deep
  `${gardenScene()}${dugHole(1120, 900, 1.25)}${rulerProp(1120, 830, 0.9, { rotate: -90, length: 160 })}
   ${figure("leo", { x: 700, y: 900, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 940, y: 900, s: 1.56 })}`,

  // 6 Mina marks the centre with a flat stone
  `${gardenScene()}${flatStone(1000, 906, 1.3)}
   ${figure("mina", { x: 820, y: 902, s: 1.24, arms: "point" })}
   ${figure("amal", { x: 580, y: 900, s: 1.66 })}`,

  // 7 maize on one side, flowers on the other side
  `${gardenScene()}${seedRow(430, 906, 1.15)}${gardenPlant(1250, 890, 1.3)}
   ${figure("amal", { x: 800, y: 900, s: 1.7, arms: "up" })}`,

  // 8 the watering was simple: one full can for every row
  `${gardenScene()}${wateringCan(1130, 890, 1.35, { pouring: true })}${seedRow(1330, 906, 1.05)}
   ${figure("amal", { x: 720, y: 900, s: 1.68 })}`,

  // 9 Leo copied the plan onto paper and ticked each row
  `${gardenScene()}${notepad(1180, 780, 1.3)}${seedRow(430, 906, 1.05)}
   ${figure("leo", { x: 720, y: 900, s: 1.7, holding: heldPaper })}
   ${figure("amal", { x: 960, y: 900, s: 1.54, arms: "point" })}`,

  // 10 one row leaned to one side; measured again and fixed
  `${gardenScene()}${seedRow(1130, 906, 1.15, { sprouts: false })}${rulerProp(1130, 856, 1.05, { length: 260 })}
   ${figure("nora", { x: 640, y: 900, s: 1.62 })}
   ${figure("amal", { x: 880, y: 900, s: 1.58, arms: "point" })}`,

  // 11 Teacher Yasmin checks: "Correct. A garden by the metre."
  `${gardenScene()}${metreStick(1170, 890, 1.25)}${seedRow(420, 906, 1.05)}
   ${figure("yasmin", { x: 680, y: 900, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 940, y: 900, s: 1.54 })}`,

  // 12 the plants grow in equal rows; the plan worked
  `${gardenScene()}${plantStage(1050, 890, 1.5, "sprout")}${plantStage(1270, 890, 1.4, "sprout")}${fence(430, 890, 1.05, 3)}
   ${figure("amal", { x: 660, y: 900, s: 1.7, arms: "up" })}
   ${figure("leo", { x: 880, y: 900, s: 1.58, arms: "up" })}`,
];

// ================================================================ Unit 5, book 7
// The Bench in the Yard — an original story on the unit's own shape: plan first,
// then work together, step by step, and celebrate at the end.

const benchYardPages = [
  // 1 cover: Amal and Sami beside the old bench under the acacia
  `${yardScene()}${bench(1020, 930, 1.4)}
   ${figure("amal", { x: 520, y: 918, s: 1.74 })}
   ${figure("sami", { x: 770, y: 918, s: 1.6 })}`,

  // 2 the old bench wobbled; nobody sat on it any more
  `${yardScene()}${bench(1020, 930, 1.4)}${dustPuffs(1020, 900)}
   ${figure("amal", { x: 560, y: 918, s: 1.7, mood: "surprised" })}
   ${figure("sami", { x: 790, y: 918, s: 1.58 })}`,

  // 3 "Let us mend it. First, we need a plan."
  `${yardScene()}${bench(1060, 930, 1.35)}
   ${figure("sami", { x: 600, y: 918, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 840, y: 918, s: 1.6, holding: heldPaper })}`,

  // 4 Omar gave us a strong flat stone from behind his shop
  `${townScene()}${marketStall(1160, 890, 0.9)}${flatStone(860, 922, 1.25)}
   ${figure("omar", { x: 1020, y: 918, s: 1.58, arms: "point" })}
   ${figure("sami", { x: 620, y: 918, s: 1.62 })}`,

  // 5 then Dad brought his toolbox after work
  `${yardScene()}${bench(1080, 930, 1.35)}${toolboxProp(880, 926, 1.15)}
   ${figure("dad", { x: 620, y: 918, s: 1.68 })}
   ${figure("amal", { x: 400, y: 918, s: 1.54 })}`,

  // 6 Sami held the bench; Amal slid the stone under the short leg
  `${yardScene()}${bench(1040, 930, 1.35)}${flatStone(1120, 934, 0.95)}${dustPuffs(1000, 902)}
   ${figure("sami", { x: 780, y: 918, s: 1.62 })}
   ${figure("amal", { x: 540, y: 918, s: 1.66, arms: "point" })}`,

  // 7 after that, Dad tightened every screw, one by one
  `${yardScene()}${bench(1040, 930, 1.35)}${toolboxProp(1260, 928, 1.05)}
   ${figure("dad", { x: 760, y: 918, s: 1.68, arms: "point" })}`,

  // 8 then we washed it and let the sun dry it
  `${yardScene()}${bench(1040, 930, 1.35)}${wateringCan(820, 916, 1.2)}
   ${figure("amal", { x: 560, y: 918, s: 1.68 })}`,

  // 9 finally we tested it: Sami sat down first, very slowly
  `${yardScene()}${bench(1000, 930, 1.4)}
   ${figure("sami", { x: 760, y: 918, s: 1.64, mood: "surprised" })}
   ${figure("amal", { x: 500, y: 918, s: 1.6 })}`,

  // 10 it did not wobble, it did not creak, it just held
  `${yardScene()}${bench(1000, 930, 1.4)}
   ${figure("sami", { x: 720, y: 918, s: 1.66, arms: "up" })}
   ${figure("amal", { x: 480, y: 918, s: 1.62, arms: "up" })}`,

  // 11 now the little ones sit there every break time
  `${yardScene()}${bench(1030, 930, 1.4)}
   ${figure("mina", { x: 830, y: 920, s: 1.22 })}
   ${figure("theo", { x: 640, y: 918, s: 1.48 })}
   ${figure("amal", { x: 420, y: 918, s: 1.6 })}`,

  // 12 a yard with a good bench is a friendlier yard
  `${yardScene()}${bench(1030, 930, 1.4)}${confetti(760, 520)}
   ${figure("amal", { x: 500, y: 918, s: 1.68, arms: "up" })}
   ${figure("sami", { x: 730, y: 918, s: 1.6, arms: "up" })}
   ${figure("mina", { x: 880, y: 920, s: 1.22, arms: "up" })}`,
];

// ================================================================ Unit 6, book 5
// Now It Is My Turn — the next scene of "The Girl Who Carried Kindness": Amal,
// once the new girl, is the one who carries it to the next new pupil.

const myTurnPages = [
  // 1 cover: Amal welcoming Theo in the schoolyard
  `${yardScene()}
   ${figure("amal", { x: 660, y: 918, s: 1.76, arms: "up" })}
   ${figure("theo", { x: 960, y: 918, s: 1.56 })}`,

  // 2 last term I was the new girl, alone with my lunch
  `${yardScene()}${bench(1060, 930, 1.35)}
   ${figure("amal", { x: 760, y: 918, s: 1.68, mood: "sad" })}`,

  // 3 Nora carried kindness over to me
  `${yardScene()}
   ${figure("nora", { x: 640, y: 918, s: 1.62, arms: "up" })}
   ${figure("amal", { x: 900, y: 918, s: 1.62 })}`,

  // 4 this term a new boy joined: Theo
  `${classroomScene()}
   ${figure("yasmin", { x: 560, y: 950, s: 1.64, arms: "point" })}
   ${figure("theo", { x: 850, y: 950, s: 1.56 })}`,

  // 5 at break he stood in the corner, holding his bag
  `${yardScene()}
   ${figure("theo", { x: 460, y: 918, s: 1.62, mood: "sad" })}
   ${figure("sami", { x: 1080, y: 918, s: 1.5 })}
   ${figure("daniel", { x: 1280, y: 918, s: 1.48 })}`,

  // 6 I remembered how that feels, so I walked directly over
  `${yardScene()}
   ${figure("amal", { x: 620, y: 918, s: 1.68 })}
   ${figure("theo", { x: 940, y: 918, s: 1.6, mood: "sad" })}`,

  // 7 "I am Amal. Come and sit with us."
  `${yardScene()}${bench(1220, 930, 1.3)}
   ${figure("amal", { x: 620, y: 918, s: 1.7, arms: "point" })}
   ${figure("theo", { x: 900, y: 918, s: 1.6 })}`,

  // 8 Nora waved, Sami made a space
  `${yardScene()}${bench(1160, 930, 1.35)}
   ${figure("nora", { x: 480, y: 918, s: 1.56, arms: "up" })}
   ${figure("sami", { x: 700, y: 918, s: 1.54 })}
   ${figure("theo", { x: 920, y: 918, s: 1.58 })}`,

  // 9 by Friday Theo was probably the noisiest at our table
  `${classroomScene()}${desk(1180, 950, 1.3)}
   ${figure("theo", { x: 640, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 880, y: 950, s: 1.56 })}`,

  // 10 "You did what I did," said Nora quietly
  `${yardScene()}
   ${figure("nora", { x: 660, y: 918, s: 1.66 })}
   ${figure("amal", { x: 920, y: 918, s: 1.6 })}`,

  // 11 kindness is a thing you carry
  `${sunsetScene()}
   ${figure("amal", { x: 680, y: 900, s: 1.7 })}
   ${figure("nora", { x: 930, y: 900, s: 1.58 })}`,

  // 12 Theo waits by the gate for the next new pupil
  `${yardScene()}${signPost(1280, 906, 0.8, { label: "SCHOOL" })}${fence(400, 906, 1, 3)}
   ${figure("theo", { x: 720, y: 918, s: 1.66, arms: "up" })}`,
];

// ================================================================ Unit 6, book 6
// The Shiny Beetle — the "small creatures and where they are" words at work:
// north, east, west, follow, search, collect, gentle, careful, lake, hill,
// field, forest, shiny, lucky.

const beetlePages = [
  // 1 cover: Noah and Amal meeting the beetle in the garden
  `${gardenScene()}${beetleProp(980, 886, 1.7)}
   ${figure("noah", { x: 560, y: 900, s: 1.72 })}
   ${figure("amal", { x: 800, y: 900, s: 1.56 })}`,

  // 2 my cousin Noah knows where the small creatures live
  `${townScene()}${tallGrass(1180, 906, 1.4)}${tallGrass(1330, 912, 1.2)}
   ${figure("noah", { x: 640, y: 900, s: 1.7, arms: "point" })}
   ${figure("amal", { x: 880, y: 900, s: 1.54 })}`,

  // 3 "Walk gently. Noisy feet send them under cover."
  `${townScene()}${tallGrass(1100, 906, 1.4)}${tallGrass(1260, 912, 1.25)}${tallGrass(1400, 906, 1.1)}
   ${figure("noah", { x: 600, y: 900, s: 1.68, arms: "point" })}
   ${figure("mina", { x: 860, y: 902, s: 1.22 })}`,

  // 4 we searched the field first, in the warm grass
  `${townScene()}${tallGrass(1140, 906, 1.5)}${tallGrass(1320, 912, 1.3)}${tallGrass(460, 906, 1.2)}
   ${figure("amal", { x: 700, y: 900, s: 1.66 })}
   ${figure("noah", { x: 930, y: 900, s: 1.6 })}`,

  // 5 a shiny beetle marched past my shoe, heading north
  `${gardenScene()}${beetleProp(920, 892, 1.6)}
   ${figure("amal", { x: 680, y: 900, s: 1.7, mood: "surprised" })}`,

  // 6 we followed it past the fence and down the hill
  `${townScene()}${fence(1150, 890, 1.2, 4)}${beetleProp(950, 902, 1.3, { flip: true })}
   ${figure("noah", { x: 560, y: 900, s: 1.66 })}
   ${figure("amal", { x: 780, y: 900, s: 1.56 })}`,

  // 7 at the lake we counted the little water birds
  `${townScene()}${lake(1100, 900, 320, 62)}${wildBird(1220, 500, 1.05, true)}${wildBird(1000, 866, 0.7)}
   ${figure("amal", { x: 500, y: 900, s: 1.66, arms: "point" })}
   ${figure("mina", { x: 720, y: 902, s: 1.22 })}`,

  // 8 Mina lifted a big leaf and found a sleeping snail
  `${gardenScene()}${bigLeaf(1060, 890, 1.5)}${snailProp(1180, 890, 1.4)}
   ${figure("mina", { x: 840, y: 902, s: 1.26, arms: "point" })}
   ${figure("amal", { x: 580, y: 900, s: 1.62 })}`,

  // 9 "Do not collect them. Their home is here."
  `${gardenScene()}${snailProp(1120, 892, 1.3)}${beetleProp(1280, 890, 1.2)}
   ${figure("noah", { x: 640, y: 900, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 900, y: 902, s: 1.24 })}`,

  // 10 so we drew them in our notebooks instead
  `${gardenScene()}${notepad(1160, 780, 1.25)}
   ${figure("amal", { x: 660, y: 900, s: 1.68, holding: heldPaper })}
   ${figure("mina", { x: 900, y: 902, s: 1.24, holding: heldPaper })}`,

  // 11 the beetle turned east, into the forest shade
  `${forestScene()}${beetleProp(1050, 940, 1.35, { flip: true })}
   ${figure("noah", { x: 580, y: 950, s: 1.68 })}
   ${figure("amal", { x: 820, y: 950, s: 1.56, arms: "point" })}`,

  // 12 we walked home west, into the low sun, feeling lucky
  `${sunsetScene()}
   ${figure("noah", { x: 620, y: 900, s: 1.68 })}
   ${figure("amal", { x: 860, y: 900, s: 1.56 })}
   ${figure("mina", { x: 1060, y: 902, s: 1.22 })}`,
];

// ================================================================ Unit 6, book 7
// Guess Who I Mean — describing people with the unit's adjectives, as a family
// game at home: kind, calm, busy, honest, noisy, friendly, clever.

const guessWhoPages = [
  // 1 cover: the game beginning in the living room
  `${homeScene()}${roomBox(1290, 640, 1.05, "living")}
   ${figure("amal", { x: 540, y: 950, s: 1.68 })}
   ${figure("mum", { x: 800, y: 950, s: 1.6 })}
   ${figure("mina", { x: 1020, y: 952, s: 1.24 })}`,

  // 2 in the evenings my family plays a guessing game
  `${eveningRoom()}${roomBox(1270, 640, 1.05, "living")}
   ${figure("amal", { x: 560, y: 950, s: 1.64 })}
   ${figure("dad", { x: 800, y: 950, s: 1.6 })}
   ${figure("mina", { x: 1010, y: 952, s: 1.22 })}`,

  // 3 "I am thinking of somebody kind, calm and very patient"
  `${homeScene()}${thoughtBubble(1180, 400, 1.4, bigQuestion)}
   ${figure("amal", { x: 700, y: 950, s: 1.7, arms: "up" })}`,

  // 4 "Grandma Hana!" shouted Mina — but it was Mum
  `${homeScene()}${roomBox(1310, 640, 1, "living")}
   ${figure("hana", { x: 460, y: 950, s: 1.52 })}
   ${figure("mum", { x: 700, y: 950, s: 1.6 })}
   ${figure("mina", { x: 920, y: 952, s: 1.26, arms: "up" })}`,

  // 5 Mina's turn: somebody busy, always fixing things
  `${homeScene()}${thoughtBubble(1180, 400, 1.4, `<g transform="translate(0 30) scale(0.55)">${toolboxProp(0, 30, 1)}</g>`)}
   ${figure("mina", { x: 720, y: 952, s: 1.3, arms: "up" })}
   ${figure("amal", { x: 480, y: 950, s: 1.6 })}`,

  // 6 "That is Dad," I said, and Dad laughed in his chair
  `${homeScene()}${roomBox(1270, 640, 1.08, "living")}
   ${figure("dad", { x: 700, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 960, y: 950, s: 1.56, arms: "point" })}`,

  // 7 Dad chose somebody honest, who tells the truth politely
  `${homeScene()}${roomBox(1290, 640, 1.02, "dining")}
   ${figure("dad", { x: 620, y: 950, s: 1.66, arms: "point" })}
   ${figure("adam", { x: 880, y: 950, s: 1.44 })}`,

  // 8 we all pointed at Adam at exactly the same time
  `${homeScene()}
   ${figure("amal", { x: 460, y: 950, s: 1.58, arms: "point" })}
   ${figure("mina", { x: 660, y: 952, s: 1.24, arms: "point" })}
   ${figure("mum", { x: 1180, y: 950, s: 1.58, arms: "point", flip: true })}
   ${figure("adam", { x: 900, y: 950, s: 1.48 })}`,

  // 9 Grandma Hana picked somebody noisy, friendly and muddy
  `${homeScene()}${roomBox(1290, 640, 1.02, "kitchen")}
   ${figure("hana", { x: 620, y: 950, s: 1.64, arms: "point" })}
   ${figure("mina", { x: 900, y: 952, s: 1.26 })}`,

  // 10 it was Mina, and she took a bow
  `${homeScene()}${confetti(800, 520)}
   ${figure("mina", { x: 780, y: 952, s: 1.34, arms: "up" })}
   ${figure("amal", { x: 520, y: 950, s: 1.58 })}
   ${figure("adam", { x: 1030, y: 950, s: 1.44 })}`,

  // 11 Mum: "somebody clever, who describes people beautifully"
  `${eveningRoom()}${roomBox(1270, 640, 1.05, "living")}
   ${figure("mum", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.58 })}`,

  // 12 everybody looked at me — the loveliest game I know
  `${homeScene()}
   ${figure("mum", { x: 420, y: 950, s: 1.56 })}
   ${figure("dad", { x: 640, y: 950, s: 1.58 })}
   ${figure("amal", { x: 880, y: 950, s: 1.66, arms: "up" })}
   ${figure("mina", { x: 1090, y: 952, s: 1.24, arms: "up" })}`,
];

// ================================================================ Unit 7, book 5
// After the Trip — the next scene of "From Coast to Forest": back in the
// classroom, the class builds a nature table out of what the trip taught them.

const afterTripPages = [
  // 1 cover: the nature table with the shells on it
  `${classroomScene()}${desk(1160, 950, 1.34, { item: shells(0, -6, 0.32, { count: 6 }) })}${poster(360, 690, 0.9, { colour: G3.teal, lines: 3 })}
   ${figure("amal", { x: 620, y: 950, s: 1.74 })}
   ${figure("nora", { x: 870, y: 950, s: 1.58 })}`,

  // 2 the classroom smelled of sea and leaves
  `${classroomScene()}
   ${figure("amal", { x: 620, y: 950, s: 1.7 })}
   ${figure("leo", { x: 860, y: 950, s: 1.6 })}
   ${figure("nora", { x: 1090, y: 950, s: 1.56 })}`,

  // 3 "Let us build a nature table," said Teacher Yasmin
  `${classroomScene()}${desk(1180, 950, 1.32)}
   ${figure("yasmin", { x: 640, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.54 })}`,

  // 4 Amal laid out the shells; Nora added a smooth grey stone
  `${classroomScene()}${desk(1160, 950, 1.34, { item: shells(0, -6, 0.3, { count: 5 }) })}${flatStone(860, 952, 0.9)}
   ${figure("amal", { x: 600, y: 950, s: 1.68, arms: "point" })}
   ${figure("nora", { x: 840, y: 950, s: 1.56 })}`,

  // 5 Leo pinned up the map and marked the route
  `${plainRoomScene()}${mapProp(820, 420, 1.25)}
   ${figure("leo", { x: 520, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 1120, y: 950, s: 1.56 })}`,

  // 6 the poem went up in big letters above the table
  `${classroomScene()}${poster(1240, 690, 1.1, { colour: G3.teal, lines: 4 })}${desk(1180, 950, 1.28)}
   ${figure("amal", { x: 660, y: 950, s: 1.7, holding: heldPaper })}`,

  // 7 Sami drew the little crab from the beach
  `${classroomScene()}${easel(1180, 950, 1.3, { inner: crabProp(0, 40, 1) })}
   ${figure("sami", { x: 660, y: 950, s: 1.7, holding: heldPaper })}`,

  // 8 "What was the temperature in the forest?" "Twenty-two degrees!"
  `${classroomScene()}${thermometerProp(1240, 830, 1.3, { level: 0.45 })}
   ${figure("nora", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.58, arms: "up" })}`,

  // 9 the younger pupils came to see, two by two
  `${classroomScene()}${desk(1160, 950, 1.3, { item: shells(0, -6, 0.3, { count: 5 }) })}
   ${figure("amal", { x: 560, y: 950, s: 1.64, arms: "point" })}
   ${figure("mina", { x: 800, y: 952, s: 1.24 })}
   ${figure("theo", { x: 970, y: 950, s: 1.46 })}`,

  // 10 the trees looked tiny below us, like moss
  `${classroomScene()}${thoughtBubble(1180, 400, 1.5, `<path d="M -70 40 L -20 -30 L 30 40 Z M 6 40 L 48 -8 L 86 40 Z" fill="${G3.mountain}"/><path d="M -20 -30 l 14 20 q -14 8 -28 0 z" fill="${G3.snow}"/>`)}
   ${figure("amal", { x: 660, y: 950, s: 1.7, arms: "up" })}
   ${figure("mina", { x: 900, y: 952, s: 1.24 })}`,

  // 11 "Have you ever seen the sea?" "Not yet," said Mina
  `${classroomScene()}
   ${figure("amal", { x: 640, y: 950, s: 1.68, arms: "point" })}
   ${figure("mina", { x: 890, y: 952, s: 1.26 })}`,

  // 12 "Then one day we will show you," said Teacher Yasmin
  `${classroomScene()}${desk(1180, 950, 1.3, { item: shells(0, -6, 0.3, { count: 5 }) })}
   ${figure("yasmin", { x: 420, y: 950, s: 1.62 })}
   ${figure("amal", { x: 680, y: 950, s: 1.66, arms: "up" })}
   ${figure("mina", { x: 900, y: 952, s: 1.24, arms: "up" })}`,
];

// ================================================================ Unit 7, book 6
// The Beach Clean-Up — the "caring for our world" words at work: rubbish,
// metal, glass, plastic, safe, return, leave.

const cleanUpPages = [
  // 1 cover: the class arriving with the bins
  `${coastScene()}${recycleBin(1290, 920, 1.05, "tins")}${litterBits(1000, 930, 1.05)}
   ${figure("amal", { x: 560, y: 930, s: 1.74 })}
   ${figure("leo", { x: 800, y: 930, s: 1.6 })}`,

  // 2 on Saturday we returned to the beach with three big bins
  `${coastScene()}${recycleBin(1130, 920, 0.95, "tins")}${recycleBin(1280, 920, 0.95, "glass")}${recycleBin(1430, 920, 0.95, "paper")}
   ${figure("yasmin", { x: 560, y: 930, s: 1.66 })}
   ${figure("amal", { x: 810, y: 930, s: 1.56 })}`,

  // 3 the tide had left rubbish all along the sand
  `${coastScene()}${litterBits(1050, 930, 1.15)}${litterBits(1380, 940, 0.85)}
   ${figure("amal", { x: 560, y: 930, s: 1.7, mood: "surprised" })}
   ${figure("nora", { x: 800, y: 930, s: 1.56 })}`,

  // 4 "Sort as you go: metal, glass and plastic"
  `${coastScene()}${recycleBin(1160, 920, 0.95, "tins")}${recycleBin(1310, 920, 0.95, "glass")}
   ${figure("yasmin", { x: 620, y: 930, s: 1.66, arms: "point" })}
   ${figure("leo", { x: 880, y: 930, s: 1.56 })}`,

  // 5 Leo found a metal tin; into the first bin
  `${coastScene()}${recycleBin(1230, 920, 1, "tins")}${litterBits(920, 936, 0.9)}
   ${figure("leo", { x: 620, y: 930, s: 1.68, arms: "point" })}`,

  // 6 Nora carried a glass jar carefully with both hands
  `${coastScene()}${recycleBin(1250, 920, 1, "glass")}
   ${figure("nora", { x: 680, y: 930, s: 1.68 })}
   ${figure("amal", { x: 930, y: 930, s: 1.56 })}`,

  // 7 plastic bottle tops until my bag felt heavy
  `${coastScene()}${litterBits(1080, 934, 0.95)}${recycleBin(1360, 920, 0.95, "paper")}
   ${figure("amal", { x: 620, y: 930, s: 1.68, arms: "point" })}`,

  // 8 a small crab watched us from the wet stones
  `${coastScene()}${crabProp(1060, 926, 1.35)}${flatStone(1200, 934, 1.1)}${shells(760, 936, 0.8, { count: 5 })}
   ${figure("amal", { x: 500, y: 930, s: 1.66, arms: "point" })}
   ${figure("leo", { x: 740, y: 930, s: 1.56 })}`,

  // 9 from the rocks to the water and back again
  `${coastScene()}${flatStone(430, 934, 1.2)}${recycleBin(1330, 920, 0.95, "tins")}
   ${figure("nora", { x: 640, y: 930, s: 1.62 })}
   ${figure("amal", { x: 880, y: 930, s: 1.6 })}`,

  // 10 by noon the sand was clean and safe for small feet
  `${coastScene()}${shells(1100, 936, 0.95)}
   ${figure("amal", { x: 600, y: 930, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 850, y: 930, s: 1.58, arms: "up" })}`,

  // 11 "The sea gives us so much. Today we gave something back."
  `${coastScene()}${recycleBin(1300, 920, 0.95, "glass")}
   ${figure("yasmin", { x: 580, y: 930, s: 1.66 })}
   ${figure("amal", { x: 830, y: 930, s: 1.54 })}
   ${figure("leo", { x: 1040, y: 930, s: 1.52 })}`,

  // 12 we left only footprints, and the waves smoothed them away
  `${coastScene()}${footprintTrail(1000, 940, 1)}
   ${figure("amal", { x: 500, y: 930, s: 1.66, flip: true })}
   ${figure("nora", { x: 720, y: 930, s: 1.56, flip: true })}`,
];

// ================================================================ Unit 7, book 7
// The Frozen Pond — an original story on the unit's weather and temperature:
// a cold early walk with Dad, and water that froze in the night.

const frozenPondPages = [
  // 1 cover: Amal and Dad on the trail above the frozen pond
  `${mountainScene()}${frozenPond(1160, 940, 1.1)}
   ${figure("amal", { x: 540, y: 950, s: 1.74 })}
   ${figure("dad", { x: 790, y: 950, s: 1.62 })}`,

  // 2 one cold morning Dad woke me early: "Bring your jacket"
  `${eveningRoom()}${roomBox(1270, 640, 1.05, "bedroom")}
   ${figure("dad", { x: 620, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 880, y: 950, s: 1.54 })}`,

  // 3 we set off up the quiet mountain trail
  `${mountainScene()}
   ${figure("dad", { x: 640, y: 950, s: 1.66 })}
   ${figure("amal", { x: 890, y: 950, s: 1.56 })}`,

  // 4 the air grew cooler; my breath made little clouds
  `${mountainScene()}${cloudPuff(1150, 300, 1.25)}${cloudPuff(980, 620, 0.55)}
   ${figure("amal", { x: 700, y: 950, s: 1.68 })}
   ${figure("dad", { x: 950, y: 950, s: 1.6 })}`,

  // 5 "What is the temperature?" "Maybe two degrees," said Dad
  `${mountainScene()}${thermometerProp(1220, 880, 1.25, { level: 0.12 })}
   ${figure("dad", { x: 660, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 910, y: 950, s: 1.56 })}`,

  // 6 near the top, the little pond — frozen in the night
  `${mountainScene()}${frozenPond(1150, 930, 1.2)}
   ${figure("amal", { x: 520, y: 950, s: 1.7, mood: "surprised" })}
   ${figure("dad", { x: 760, y: 950, s: 1.6 })}`,

  // 7 a smooth, shining sheet of ice
  `${mountainScene()}${frozenPond(1080, 930, 1.35)}${frostPatch(420, 950, 0.9)}
   ${figure("amal", { x: 680, y: 950, s: 1.68, arms: "point" })}`,

  // 8 I knelt down and knocked on it gently — hard, like glass
  `${mountainScene()}${frozenPond(1050, 930, 1.3)}
   ${figure("amal", { x: 720, y: 950, s: 1.66, arms: "point" })}
   ${figure("dad", { x: 460, y: 950, s: 1.58 })}`,

  // 9 "Do not step on it. Thin ice cannot hold you."
  `${mountainScene()}${frozenPond(1200, 935, 1.15)}
   ${figure("dad", { x: 580, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 830, y: 950, s: 1.56 })}`,

  // 10 the sun climbed, and the frost began to shine
  `${mountainScene()}${frostPatch(1130, 946, 1.3)}${frostPatch(760, 952, 0.8)}
   ${figure("amal", { x: 500, y: 950, s: 1.68, arms: "up" })}
   ${figure("dad", { x: 740, y: 950, s: 1.58, arms: "up" })}`,

  // 11 on the way down, the ice had turned back to water
  `${mountainScene()}${puddle(1120, 940, 160, 30, 0)}
   ${figure("dad", { x: 620, y: 950, s: 1.64 })}
   ${figure("amal", { x: 870, y: 950, s: 1.56, arms: "point" })}`,

  // 12 the weather can change in one morning
  `${mountainScene()}${cloudPuff(1200, 260, 1.2)}
   ${figure("amal", { x: 660, y: 950, s: 1.72, arms: "up" })}
   ${figure("dad", { x: 920, y: 950, s: 1.6 })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "wallstories": { dir: "stories-on-the-wall", pages: wallStoriesPages },
  "metregarden": { dir: "a-garden-by-the-metre", pages: metreGardenPages },
  "benchyard": { dir: "the-bench-in-the-yard", pages: benchYardPages },
  "myturn": { dir: "now-it-is-my-turn", pages: myTurnPages },
  "beetle": { dir: "the-shiny-beetle", pages: beetlePages },
  "guesswho": { dir: "guess-who-i-mean", pages: guessWhoPages },
  "aftertrip": { dir: "after-the-trip", pages: afterTripPages },
  "cleanup": { dir: "the-beach-clean-up", pages: cleanUpPages },
  "frozenpond": { dir: "the-frozen-pond", pages: frozenPondPages },
};

writeBooks(books, process.argv[2]);
