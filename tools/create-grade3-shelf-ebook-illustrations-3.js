#!/usr/bin/env node

// Grade 3, books FIVE to SEVEN of Units 8, 9 and 10 — the shelf growing from
// four books to seven. Companion to create-grade3-ebook-illustrations-4.js,
// whose house pattern this follows exactly. The existing four books of each
// unit already retell the unit's five texts, so these nine are new KINDS of
// book, the way the Grade 1 expansion worked: a continuation of the unit's own
// story, a vocabulary-in-action story, and a third original story on the
// unit's theme in a setting the first two do not use.
//
//   Unit 8 "Numbers Big and Small"
//     5  Mina Counts the Shells      continuation of "The Mystery of the
//                                    Million Shells" — Amal teaches Mina
//     6  How Big Is Our House?       vocabulary: rooms and things at home
//     7  The Right Change            plus, minus, several, plenty — at the stall
//   Unit 9 "Thinking, Feelings, and Imagination"
//     5  The Day the Box Opened      continuation of "The Box of Ideas"
//     6  Somebody, Nobody, Everybody vocabulary: words for something unknown
//     7  The Calm Place              feelings on the shore, Nora and Amal
//   Unit 10 "The Year 3 Showcase"
//     5  After the Showcase          continuation — the evening after
//     6  The Thank-You Book          vocabulary: telling and talking
//     7  Wherever We Go              whenever, wherever, whoever — into summer
//
// Usage: node tools/create-grade3-shelf-ebook-illustrations-3.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, acacia, bench, marketStall, confetti, dustPuffs,
  wildBird, lampPost, playBall, mango, thoughtBubble, cloudPuff,
  seedRow, fence, flatStone, notepad, rulerProp, metreStick, balanceScale,
  bookShelf, openBook, calendarBoard, house, cookpot, sailboat,
  bunting, easel, waterBottle, fruitBowl, kite, plantStage, gardenPlant,
  roomScene, roomBox, gardenScene, streetScene, sunsetScene,
  G2, G3, figure, heldBook, heldPaper, heldShell, heldFolder, heldBasket,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  desk, shells, poster, gardenWall, boxOfIdeas, hourClock, numberLadder,
  folderProp, signPost, basketProp,
} = require("./lib/ehel-ebook-kit-grade3.js");

const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const eveningRoom = () => `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
  <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>`;
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;

// ---------------------------------------------------------------- local props
//
// Everything below is purely local inline SVG: no data-tap and no data-figure,
// because a tap value promises an audio clip and none of these have one.

// A small folded note with a few written lines — the anonymous kind notes.
const noteSlip = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y})">
  <g transform="rotate(${rot}) scale(${s})">
    <rect x="-36" y="-26" width="72" height="52" rx="4" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.2"/>
    <path d="M -24 -12 h 48 M -24 0 h 48 M -24 12 h 32" stroke="#9fb4c6" stroke-width="3.4"/>
  </g>
</g>`;

// A short row of coins on the stall counter.
const coinRow = (x, y, s = 1, { count = 4 } = {}) => `<g transform="translate(${x} ${y}) scale(${s})">
  ${Array.from({ length: count }, (unused, i) => {
    const cx = i * 48 - ((count - 1) * 24);
    return `<circle cx="${cx}" cy="0" r="20" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="${cx}" cy="0" r="12" fill="none" stroke="#c28e1c" stroke-width="2.8"/>`;
  }).join("")}
</g>`;

// Omar's wooden coin box, lid open.
const coinBox = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-64" y="-56" width="128" height="56" rx="6" fill="#a8763f" stroke="${C.ink}" stroke-width="4"/>
  <path d="M -64 -56 h 128 l -14 -30 h -100 z" fill="#8a6242" stroke="${C.ink}" stroke-width="3.6"/>
  <circle cx="-22" cy="-34" r="12" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3"/>
  <circle cx="8" cy="-30" r="12" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3"/>
  <circle cx="34" cy="-36" r="12" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3"/>
</g>`;

// A small bunch of bananas for Idris's coin.
const bananaBunch = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M -30 -18 q 4 30 34 32 q 26 0 34 -20 q -10 8 -30 8 q -28 0 -38 -20 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3.6"/>
  <path d="M -34 -34 q 2 26 26 34 q -22 0 -32 -14 q -6 -12 6 -20 z" fill="#e8c34a" stroke="${C.ink}" stroke-width="3.2"/>
  <rect x="-40" y="-42" width="10" height="12" rx="3" fill="#8a6242" stroke="${C.ink}" stroke-width="2.8"/>
</g>`;

// One square metre of sand, marked out with string and four corner stones.
const measuredSquare = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M -170 -60 L 170 -60 L 214 44 L -214 44 Z" fill="none" stroke="#8a6242" stroke-width="6" stroke-dasharray="26 16"/>
  ${flatStone(-186, -52, 0.55)}${flatStone(186, -52, 0.55)}${flatStone(-228, 54, 0.6)}${flatStone(228, 54, 0.6)}
</g>`;

// Pencil height marks on a door frame — the family measuring wall.
const heightMarks = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-14" y="-420" width="28" height="420" rx="6" fill="#b08758" stroke="${C.ink}" stroke-width="4"/>
  ${[-330, -262, -196].map((my, i) => `<path d="M -30 ${my} h 60" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <rect x="34" y="${my - 14}" width="52" height="28" rx="4" fill="${G3.cream}" stroke="${C.ink}" stroke-width="2.8"/>
    <path d="M 44 ${my} h 32" stroke="#9fb4c6" stroke-width="3.4"/>`).join("")}
</g>`;

// The reading rug under the acacia tree.
const readingRug = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="0" rx="250" ry="52" fill="${G3.plum}" stroke="${C.ink}" stroke-width="4.5"/>
  <ellipse cx="0" cy="0" rx="190" ry="38" fill="none" stroke="${G3.cream}" stroke-width="5" opacity="0.7"/>
  <ellipse cx="0" cy="0" rx="120" ry="24" fill="none" stroke="${G3.gold}" stroke-width="5" opacity="0.7"/>
</g>`;

// ================================================================ Unit 8, book 5
// Mina Counts the Shells — after "The Mystery of the Million Shells"

const minaShellsPages = [
  // 1 cover: Amal and Mina on the shell-covered beach
  `${coastScene()}${shells(1100, 930, 1.3, { count: 14 })}
   ${figure("amal", { x: 640, y: 930, s: 1.72, holding: heldShell })}
   ${figure("mina", { x: 880, y: 932, s: 1.3, arms: "up" })}`,

  // 2 on Saturday I took my little sister Mina to the beach
  `${coastScene()}${sailboat(1280, 600, 1.05)}
   ${figure("amal", { x: 660, y: 930, s: 1.7, holding: heldBasket })}
   ${figure("mina", { x: 880, y: 932, s: 1.3 })}`,

  // 3 "There must be a million!"
  `${coastScene()}${shells(1060, 926, 1.45, { count: 16 })}
   ${figure("mina", { x: 640, y: 932, s: 1.34, arms: "up", mood: "surprised" })}
   ${figure("amal", { x: 870, y: 930, s: 1.66 })}`,

  // 4 "That is what I said. Then we measured, and I will show you how."
  `${coastScene()}${metreStick(1120, 926, 1.25)}${shells(430, 946, 0.95)}
   ${figure("amal", { x: 700, y: 930, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 930, y: 932, s: 1.3 })}`,

  // 5 we marked one square on the sand with string and four stones
  `${coastScene()}${measuredSquare(1080, 924, 1)}${shells(1080, 926, 0.8, { count: 7 })}
   ${figure("amal", { x: 620, y: 930, s: 1.68, arms: "point" })}
   ${figure("mina", { x: 840, y: 932, s: 1.28 })}`,

  // 6 Mina counted the shells inside it: fifty-two
  `${coastScene()}${measuredSquare(1080, 924, 1)}${shells(1080, 926, 0.85, { count: 9 })}
   ${figure("mina", { x: 820, y: 932, s: 1.32, arms: "point" })}
   ${figure("amal", { x: 560, y: 930, s: 1.66, holding: heldPaper })}`,

  // 7 "Now we measure the beach, walking and counting our steps."
  `${coastScene()}${dustPuffs(1040, 944)}
   ${figure("mina", { x: 880, y: 932, s: 1.32, flip: true })}
   ${figure("amal", { x: 620, y: 930, s: 1.68, arms: "point" })}`,

  // 8 Mina counted her steps all the way to the rocks
  `${coastScene()}${flatStone(1240, 928, 1.5)}${flatStone(1400, 934, 1.2)}${dustPuffs(1000, 946)}
   ${figure("mina", { x: 820, y: 932, s: 1.34, flip: true, arms: "up" })}`,

  // 9 we did the multiplication together on the sand
  `${coastScene()}${thoughtBubble(1150, 390, 1.5, `${shells(0, 12, 0.4, { count: 5 })}`)}
   ${figure("amal", { x: 640, y: 930, s: 1.68, holding: heldPaper })}
   ${figure("mina", { x: 870, y: 932, s: 1.3 })}`,

  // 10 "Thousands and thousands! But not quite a million."
  `${coastScene()}${wildBird(1240, 420, 1.1, true)}${shells(1100, 934, 1.1)}
   ${figure("mina", { x: 660, y: 932, s: 1.36, arms: "up" })}
   ${figure("amal", { x: 900, y: 930, s: 1.66 })}`,

  // 11 "You did not count every shell. You measured. That is faster."
  `${coastScene()}${metreStick(1140, 926, 1.25)}
   ${figure("amal", { x: 680, y: 930, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 920, y: 932, s: 1.32 })}`,

  // 12 Mina packed six shells in her basket. "These ones I counted."
  `${sunsetScene()}${shells(1120, 906, 1.05)}
   ${figure("mina", { x: 680, y: 902, s: 1.34, holding: heldShell })}
   ${figure("amal", { x: 920, y: 900, s: 1.68 })}`,
];

// ================================================================ Unit 8, book 6
// How Big Is Our House? — the rooms-and-things-at-home words, measured

const bigHousePages = [
  // 1 cover: Amal and Mina in front of the house
  `${townScene()}${house(1180, 900, 0.95)}${fence(420, 906, 1.1)}
   ${figure("amal", { x: 680, y: 918, s: 1.72, holding: heldPaper })}
   ${figure("mina", { x: 900, y: 920, s: 1.32, arms: "up" })}`,

  // 2 "How big is our house?" asked Mina. "Let us measure it and see."
  `${homeScene()}${roomBox(1260, 640, 1.1, "living")}
   ${figure("mina", { x: 640, y: 952, s: 1.34, arms: "up" })}
   ${figure("amal", { x: 880, y: 950, s: 1.68 })}`,

  // 3 from the gate to the door: twenty steps
  `${townScene()}${house(1200, 900, 0.9)}${fence(430, 906, 1.1)}${dustPuffs(760, 936)}
   ${figure("mina", { x: 640, y: 920, s: 1.34, flip: true })}
   ${figure("amal", { x: 900, y: 918, s: 1.66, arms: "point" })}`,

  // 4 the garden wall: six metres, Mina holding one end of the string
  `${gardenScene()}${gardenWall(1100, 890, 0.9, { length: 500 })}${metreStick(760, 896, 1.2)}
   ${figure("amal", { x: 480, y: 900, s: 1.66, arms: "point" })}
   ${figure("mina", { x: 660, y: 902, s: 1.3 })}`,

  // 5 the big room, wall to wall: four metres
  `${homeScene()}${metreStick(1120, 946, 1.3)}
   ${figure("amal", { x: 660, y: 950, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 900, y: 952, s: 1.32 })}`,

  // 6 the bottle was taller than the bowl on the table
  `${homeScene()}${desk(1150, 950, 1.32, { item: `${waterBottle(-52, 0, 0.85)}${fruitBowl(48, 4, 0.7)}` })}
   ${figure("mina", { x: 700, y: 952, s: 1.34, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.64 })}`,

  // 7 we weighed the basket on the scales, mangoes and all
  `${homeScene()}${balanceScale(1150, 946, 1.2)}${figure("mina", { x: 700, y: 952, s: 1.32, arms: "point" })}
   ${figure("amal", { x: 460, y: 950, s: 1.64, holding: heldBasket })}`,

  // 8 Mina measured me against the door frame and made a mark
  `${plainRoomScene()}${heightMarks(1150, 950, 1)}
   ${figure("amal", { x: 1000, y: 950, s: 1.68 })}
   ${figure("mina", { x: 760, y: 952, s: 1.34, arms: "point" })}`,

  // 9 then I measured Mina: two centimetres taller since her birthday
  `${plainRoomScene()}${heightMarks(1150, 950, 1)}${rulerProp(420, 946, 1.2)}
   ${figure("mina", { x: 1000, y: 952, s: 1.36, arms: "up" })}
   ${figure("amal", { x: 760, y: 950, s: 1.66, arms: "point" })}`,

  // 10 Mum baked bread while we worked, and the house smelled warm
  `${homeScene()}${cookpot(1180, 946, 1.25)}
   ${figure("mum", { x: 940, y: 950, s: 1.62 })}
   ${figure("mina", { x: 660, y: 952, s: 1.32, arms: "up" })}`,

  // 11 we packed our numbers into the notebook, room by room
  `${homeScene()}${desk(1150, 950, 1.3, { item: notepad(0, 0, 0.55) })}
   ${figure("amal", { x: 680, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("mina", { x: 900, y: 952, s: 1.3 })}`,

  // 12 "Now we know how big our house is." "Big enough," said Mum.
  `${sunsetScene()}${house(1220, 900, 0.9)}
   ${figure("mum", { x: 620, y: 900, s: 1.62 })}
   ${figure("amal", { x: 840, y: 900, s: 1.64 })}
   ${figure("mina", { x: 1030, y: 902, s: 1.32, arms: "up" })}`,
];

// ================================================================ Unit 8, book 7
// The Right Change — plus and minus at Omar's stall

const rightChangePages = [
  // 1 cover: Sami behind the stall with Omar
  `${townScene()}${marketStall(1140, 890, 0.94)}${signPost(400, 900, 0.8, { label: "MARKET", colour: G3.plum })}
   ${figure("omar", { x: 1000, y: 918, s: 1.56 })}
   ${figure("sami", { x: 700, y: 918, s: 1.68, arms: "up" })}`,

  // 2 "Sami, will you help me at the stall today?" asked Omar
  `${townScene()}${marketStall(1180, 890, 0.86)}
   ${figure("omar", { x: 1010, y: 918, s: 1.58, arms: "point" })}
   ${figure("sami", { x: 720, y: 918, s: 1.66 })}`,

  // 3 "Watch the prices. Adding and taking away, all morning long."
  `${townScene()}${marketStall(1120, 890, 0.94)}${basketProp(820, 916, 1.05)}
   ${figure("omar", { x: 1000, y: 918, s: 1.56, arms: "point" })}
   ${figure("sami", { x: 640, y: 918, s: 1.66, holding: heldPaper })}`,

  // 4 Grandma Hana bought three mangoes: plus, plus, plus
  `${townScene()}${marketStall(1180, 890, 0.86)}${mango(880, 660, 1.1)}
   ${figure("hana", { x: 640, y: 918, s: 1.58 })}
   ${figure("sami", { x: 900, y: 918, s: 1.64, holding: heldPaper })}`,

  // 5 she paid with a big coin, and I counted her change back: minus
  `${townScene()}${marketStall(1200, 890, 0.82)}${coinRow(880, 830, 1)}
   ${figure("hana", { x: 620, y: 918, s: 1.58 })}
   ${figure("sami", { x: 940, y: 918, s: 1.64, arms: "point" })}`,

  // 6 several people came at once, with baskets, bottles and bags
  `${townScene()}${marketStall(1140, 890, 0.9)}${basketProp(420, 916, 1.1)}
   ${figure("mum", { x: 580, y: 918, s: 1.58 })}
   ${figure("theo", { x: 780, y: 918, s: 1.52 })}
   ${figure("daniel", { x: 950, y: 918, s: 1.52 })}`,

  // 7 "Various things, one total," said Omar. "Add them item by item."
  `${townScene()}${marketStall(1180, 890, 0.86)}${coinRow(880, 830, 0.9, { count: 5 })}
   ${figure("omar", { x: 1020, y: 918, s: 1.58, arms: "point" })}
   ${figure("sami", { x: 720, y: 918, s: 1.66, holding: heldPaper })}`,

  // 8 Idris had one small coin. "Is it enough for a mango?" It was not.
  `${townScene()}${marketStall(1180, 890, 0.86)}${coinRow(880, 830, 0.8, { count: 1 })}
   ${figure("idris", { x: 660, y: 918, s: 1.34, mood: "sad" })}
   ${figure("sami", { x: 920, y: 918, s: 1.64 })}`,

  // 9 "It is plenty for two bananas," said Omar
  `${townScene()}${marketStall(1160, 890, 0.88)}${bananaBunch(860, 826, 1)}
   ${figure("omar", { x: 1010, y: 918, s: 1.58, arms: "point" })}
   ${figure("idris", { x: 680, y: 918, s: 1.36, arms: "up" })}`,

  // 10 at midday we counted the coin box together
  `${townScene()}${hourClock(400, 330, 1.3, { hour: 12 })}${coinBox(880, 828, 1)}${marketStall(1200, 890, 0.82)}
   ${figure("omar", { x: 1040, y: 918, s: 1.56 })}
   ${figure("sami", { x: 700, y: 918, s: 1.64, arms: "point" })}`,

  // 11 despite the busy morning, the total was exactly right
  `${townScene()}${marketStall(1180, 890, 0.86)}${confetti(820, 560)}
   ${figure("sami", { x: 700, y: 918, s: 1.68, arms: "up" })}
   ${figure("omar", { x: 980, y: 918, s: 1.56, arms: "up" })}`,

  // 12 "Plus and minus are little words, but they carry the whole market."
  `${sunsetScene()}${marketStall(1240, 890, 0.82)}
   ${figure("omar", { x: 960, y: 900, s: 1.58 })}
   ${figure("sami", { x: 700, y: 900, s: 1.66 })}`,
];

// ================================================================ Unit 9, book 5
// The Day the Box Opened — after "The Box of Ideas"

const boxOpenedPages = [
  // 1 cover: the Box of Ideas, lid open, in front of the class
  `${classroomScene()}${boxOfIdeas(1180, 946, 1.4, { open: true })}
   ${figure("yasmin", { x: 640, y: 950, s: 1.66 })}
   ${figure("amal", { x: 900, y: 950, s: 1.58, arms: "up" })}`,

  // 2 the box sat on the desk all term, filling up slowly
  `${classroomScene()}${desk(1150, 950, 1.3, { item: boxOfIdeas(0, 0, 0.5, { open: false }) })}
   ${figure("amal", { x: 680, y: 950, s: 1.68 })}
   ${figure("nora", { x: 900, y: 950, s: 1.56 })}`,

  // 3 on the last morning, Teacher Yasmin lifted the lid
  `${classroomScene()}${boxOfIdeas(1180, 946, 1.35, { open: true })}
   ${figure("yasmin", { x: 900, y: 950, s: 1.66, arms: "up" })}
   ${figure("sami", { x: 620, y: 950, s: 1.58 })}`,

  // 4 she read the ideas out one by one, in her gentle voice
  `${classroomScene()}${boxOfIdeas(1220, 946, 1.2, { open: true })}
   ${figure("yasmin", { x: 940, y: 950, s: 1.66, holding: heldPaper })}
   ${figure("nora", { x: 520, y: 950, s: 1.54 })}
   ${figure("sami", { x: 700, y: 950, s: 1.56 })}`,

  // 5 Sami's flying idea made everybody look towards the sea
  `${classroomScene()}${thoughtBubble(1180, 400, 1.5, `${sailboat(0, 26, 0.4)}`)}
   ${figure("sami", { x: 660, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 920, y: 950, s: 1.58 })}`,

  // 6 Nora's dream came out too: a library with no walls at all
  `${classroomScene()}${bookShelf(1250, 940, 1.05, { count: 8 })}
   ${figure("nora", { x: 700, y: 950, s: 1.68, holding: heldBook })}
   ${figure("yasmin", { x: 960, y: 950, s: 1.6 })}`,

  // 7 "Could we build it? Not with bricks. With a rug and a shelf, under the tree."
  `${yardScene()}
   ${figure("leo", { x: 680, y: 900, s: 1.7, arms: "up" })}
   ${figure("amal", { x: 940, y: 900, s: 1.62 })}`,

  // 8 so we carried books into the playground
  `${yardScene()}${bookShelf(1150, 900, 0.9, { count: 6 })}${bench(420, 930, 1.2)}
   ${figure("sami", { x: 680, y: 900, s: 1.64, holding: heldBook })}
   ${figure("nora", { x: 900, y: 900, s: 1.58, holding: heldBook })}`,

  // 9 we read under the tree until the bell went
  `${yardScene()}${readingRug(880, 936, 1)}
   ${figure("amal", { x: 720, y: 928, s: 1.6, holding: heldBook })}
   ${figure("mina", { x: 940, y: 930, s: 1.28, holding: heldBook })}
   ${figure("leo", { x: 520, y: 928, s: 1.56, holding: heldBook })}`,

  // 10 Amal put the empty box back on the desk. "It is not empty."
  `${classroomScene()}${desk(1150, 950, 1.3, { item: boxOfIdeas(0, 0, 0.5, { open: false }) })}
   ${figure("amal", { x: 700, y: 950, s: 1.66 })}
   ${figure("yasmin", { x: 940, y: 950, s: 1.62, arms: "point" })}`,

  // 11 "It is waiting for next year's ideas."
  `${classroomScene()}${boxOfIdeas(1200, 946, 1.3, { open: false })}
   ${figure("yasmin", { x: 920, y: 950, s: 1.66, arms: "point" })}
   ${figure("nora", { x: 640, y: 950, s: 1.56 })}`,

  // 12 an idea in a box is a seed; an idea out loud is a garden
  `${gardenScene()}${boxOfIdeas(1200, 890, 1.2, { open: true })}${gardenPlant(420, 890, 1.15)}
   ${figure("amal", { x: 700, y: 900, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 940, y: 900, s: 1.58, arms: "up" })}`,
];

// ================================================================ Unit 9, book 6
// Somebody, Nobody, Everybody — the mystery of the kind notes

const somebodyPages = [
  // 1 cover: a folded note on Amal's desk
  `${classroomScene()}${desk(1150, 950, 1.3, { item: noteSlip(0, -6, 0.9, -6) })}
   ${figure("amal", { x: 700, y: 950, s: 1.72, mood: "surprised" })}
   ${figure("nora", { x: 930, y: 950, s: 1.56 })}`,

  // 2 on Monday there was something new on my desk: a small folded note
  `${classroomScene()}${desk(1150, 950, 1.32, { item: noteSlip(0, -6, 0.9, 5) })}
   ${figure("amal", { x: 700, y: 950, s: 1.7, mood: "surprised" })}`,

  // 3 "Your reading made me smile." Nobody had signed it.
  `${classroomScene()}${noteSlip(1200, 600, 1.6, -4)}
   ${figure("amal", { x: 680, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("nora", { x: 920, y: 950, s: 1.56 })}`,

  // 4 "Somebody left it," said Nora. "But who?"
  `${classroomScene()}
   ${figure("nora", { x: 680, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 940, y: 950, s: 1.64, mood: "surprised" })}`,

  // 5 on Tuesday Idris found one: "Your kite drawing is wonderful."
  `${classroomScene()}${thoughtBubble(1180, 400, 1.5, `${kite(0, 16, 0.45)}`)}
   ${figure("idris", { x: 680, y: 950, s: 1.42, arms: "up" })}
   ${figure("amal", { x: 940, y: 950, s: 1.62 })}`,

  // 6 by Thursday nearly everybody had found one, and nobody had seen anything
  `${classroomScene()}${desk(1130, 950, 1.2, { item: noteSlip(0, -6, 0.8, -8) })}${noteSlip(420, 600, 1.3, 6)}
   ${figure("maya", { x: 560, y: 950, s: 1.54, holding: heldPaper })}
   ${figure("daniel", { x: 760, y: 950, s: 1.54, holding: heldPaper })}`,

  // 7 we asked everybody. "Was it you?" "Not me." "Was it you?" "Not me."
  `${classroomScene()}
   ${figure("amal", { x: 520, y: 950, s: 1.62, arms: "point" })}
   ${figure("leo", { x: 760, y: 950, s: 1.54 })}
   ${figure("maya", { x: 960, y: 950, s: 1.54 })}
   ${figure("daniel", { x: 1160, y: 950, s: 1.54 })}`,

  // 8 "Anybody could have written them. The letters tell us nothing."
  `${classroomScene()}${notepad(1200, 790, 1.25)}
   ${figure("amal", { x: 680, y: 950, s: 1.68, arms: "point" })}
   ${figure("nora", { x: 920, y: 950, s: 1.56 })}`,

  // 9 then Maya noticed something: the notes came on days somebody arrived early
  `${classroomScene()}${thoughtBubble(1180, 400, 1.5, `${hourClock(0, 16, 0.55, { hour: 7 })}`)}
   ${figure("maya", { x: 680, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 940, y: 950, s: 1.6 })}`,

  // 10 on Friday we came early ourselves and waited quietly by the door
  `${plainRoomScene()}${hourClock(400, 330, 1.25, { hour: 7 })}
   ${figure("amal", { x: 680, y: 950, s: 1.64 })}
   ${figure("nora", { x: 880, y: 950, s: 1.56 })}
   ${figure("maya", { x: 1080, y: 950, s: 1.54 })}`,

  // 11 it was Theo, with one last note in his hand
  `${plainRoomScene()}${noteSlip(1060, 600, 1.4, 8)}
   ${figure("theo", { x: 820, y: 950, s: 1.66, holding: heldPaper, mood: "surprised" })}
   ${figure("amal", { x: 520, y: 950, s: 1.6 })}`,

  // 12 "It was nothing," said Theo. "It was something," said everybody at once.
  `${classroomScene()}${confetti(800, 540)}
   ${figure("theo", { x: 640, y: 950, s: 1.64 })}
   ${figure("amal", { x: 880, y: 950, s: 1.6, arms: "up" })}
   ${figure("nora", { x: 1100, y: 950, s: 1.56, arms: "up" })}`,
];

// ================================================================ Unit 9, book 7
// The Calm Place — feelings, on the shore

const calmPlacePages = [
  // 1 cover: Nora and Amal on the quiet shore
  `${coastScene()}${shells(1120, 934, 0.95)}
   ${figure("nora", { x: 680, y: 930, s: 1.7 })}
   ${figure("amal", { x: 920, y: 930, s: 1.68 })}`,

  // 2 all week I worried about reading my idea out loud
  `${classroomScene()}${poster(1240, 690, 1, { colour: G3.sky, lines: 4 })}
   ${figure("amal", { x: 700, y: 950, s: 1.7, mood: "sad" })}`,

  // 3 Nora saw my face at the gate. "Come with me after school."
  `${townScene()}${signPost(1300, 900, 0.8, { label: "SCHOOL", colour: G3.teal })}
   ${figure("nora", { x: 680, y: 918, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 920, y: 918, s: 1.64, mood: "sad" })}`,

  // 4 we walked down to the shore, where the waves come and go
  `${coastScene()}
   ${figure("nora", { x: 700, y: 930, s: 1.66, flip: true })}
   ${figure("amal", { x: 930, y: 930, s: 1.64, flip: true })}`,

  // 5 "This is my calm place. I come here when my feelings feel too big."
  `${coastScene()}${shells(430, 948, 0.9)}
   ${figure("nora", { x: 700, y: 930, s: 1.7, arms: "point" })}
   ${figure("amal", { x: 940, y: 930, s: 1.64 })}`,

  // 6 we sat on the warm sand and watched the boats
  `${coastScene()}${sailboat(1200, 600, 1.15)}
   ${figure("nora", { x: 700, y: 930, s: 1.66 })}
   ${figure("amal", { x: 930, y: 930, s: 1.64 })}`,

  // 7 "Breathe in slowly, and out again, like a wave."
  `${coastScene()}${cloudPuff(1200, 240, 1.2)}
   ${figure("nora", { x: 680, y: 930, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 920, y: 930, s: 1.66, arms: "up" })}`,

  // 8 in and out. In and out. The knot got looser.
  `${coastScene()}${wildBird(1260, 400, 1.05, true)}
   ${figure("amal", { x: 800, y: 930, s: 1.7 })}`,

  // 9 "Feelings come and go like waves. Even the heavy ones go out again."
  `${coastScene()}${sailboat(1300, 590, 1)}
   ${figure("nora", { x: 700, y: 930, s: 1.7, arms: "point" })}
   ${figure("amal", { x: 940, y: 930, s: 1.64 })}`,

  // 10 I told her what I was scared of, and saying it made it smaller
  `${coastScene()}
   ${figure("amal", { x: 720, y: 930, s: 1.68 })}
   ${figure("nora", { x: 950, y: 930, s: 1.64 })}`,

  // 11 we found one smooth shell for my pocket, to hold when I worry
  `${coastScene()}${shells(1140, 932, 1.1)}
   ${figure("amal", { x: 700, y: 930, s: 1.7, holding: heldShell })}
   ${figure("nora", { x: 940, y: 930, s: 1.62, arms: "up" })}`,

  // 12 on the day I spoke, the shell was in my pocket, and my voice was calm
  `${classroomScene()}${boxOfIdeas(1220, 946, 1.2, { open: true })}
   ${figure("amal", { x: 760, y: 950, s: 1.72, holding: heldPaper })}
   ${figure("yasmin", { x: 1020, y: 950, s: 1.6 })}`,
];

// ================================================================ Unit 10, book 5
// After the Showcase — the evening after Showcase Day

const afterShowcasePages = [
  // 1 cover: the quiet garden, folder in hand
  `${sunsetScene()}${bunting(800, 200, 1.2, { span: 1240 })}
   ${figure("amal", { x: 680, y: 900, s: 1.74, holding: heldFolder })}
   ${figure("nora", { x: 920, y: 900, s: 1.58 })}`,

  // 2 the showcase was over, and the garden was quiet at last
  `${gardenScene()}${desk(1160, 900, 1.28)}${bunting(800, 200, 1.15, { span: 1200 })}
   ${figure("amal", { x: 700, y: 900, s: 1.68 })}`,

  // 3 we took the bunting down and folded it, corner to corner
  `${gardenScene()}${bunting(820, 280, 1.05, { span: 1000 })}
   ${figure("amal", { x: 700, y: 900, s: 1.66, arms: "up" })}
   ${figure("nora", { x: 950, y: 900, s: 1.58, arms: "up" })}`,

  // 4 we carried the chairs inside, counting as we went
  `${gardenScene()}${bench(1120, 900, 1.35)}${bench(1390, 906, 1.15)}
   ${figure("sami", { x: 680, y: 900, s: 1.64, arms: "up" })}
   ${figure("leo", { x: 900, y: 900, s: 1.58, arms: "up" })}`,

  // 5 Teacher Yasmin gave each of us our folder. "Take your year home."
  `${classroomScene()}${folderProp(1220, 880, 1.2)}
   ${figure("yasmin", { x: 680, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 940, y: 950, s: 1.58, holding: heldFolder })}`,

  // 6 at home, Grandma Hana read my booklet page by page
  `${homeScene()}${desk(1150, 950, 1.3, { item: openBook(0, 0, 0.5) })}
   ${figure("hana", { x: 700, y: 950, s: 1.62 })}
   ${figure("amal", { x: 930, y: 950, s: 1.6 })}`,

  // 7 Mina pointed at the million page. "One day I will count that far."
  `${homeScene()}${numberLadder(1120, 880, 0.34, { lit: 6 })}
   ${figure("mina", { x: 700, y: 952, s: 1.36, arms: "point" })}
   ${figure("amal", { x: 480, y: 950, s: 1.62 })}`,

  // 8 "You will. And I will show you where to start."
  `${homeScene()}${roomBox(1260, 640, 1.1, "living")}
   ${figure("amal", { x: 700, y: 950, s: 1.68, arms: "point" })}
   ${figure("mina", { x: 940, y: 952, s: 1.34, arms: "up" })}`,

  // 9 Dad hung my kindness page on the wall by the door
  `${plainRoomScene()}${poster(1160, 640, 1.05, { colour: G3.gold, lines: 3 })}
   ${figure("dad", { x: 880, y: 950, s: 1.64, arms: "up" })}
   ${figure("amal", { x: 600, y: 950, s: 1.6 })}`,

  // 10 Mum read my goal for Grade 4 out loud: a long chapter book, by myself
  `${homeScene()}${bookShelf(1250, 940, 1, { count: 7 })}
   ${figure("mum", { x: 680, y: 950, s: 1.64, holding: heldPaper })}
   ${figure("amal", { x: 920, y: 950, s: 1.6 })}
   ${figure("mina", { x: 1100, y: 952, s: 1.3 })}`,

  // 11 "Then you will need this," said Grandma Hana, and reached to the shelf
  `${homeScene()}${bookShelf(1250, 940, 1.05, { count: 8 })}
   ${figure("hana", { x: 960, y: 950, s: 1.62, arms: "point" })}
   ${figure("amal", { x: 680, y: 950, s: 1.64, holding: heldBook })}`,

  // 12 Year 3 is finished. The reading is not. I opened the first page.
  `${eveningRoom()}${bookShelf(1250, 940, 1, { count: 7 })}
   ${figure("amal", { x: 760, y: 950, s: 1.72, holding: heldBook })}`,
];

// ================================================================ Unit 10, book 6
// The Thank-You Book — a title, a beginning and an ending

const thankYouPages = [
  // 1 cover: the class around the book they are making
  `${classroomScene()}${desk(1150, 950, 1.3, { item: openBook(0, 0, 0.5) })}
   ${figure("nora", { x: 540, y: 950, s: 1.56 })}
   ${figure("amal", { x: 740, y: 950, s: 1.66 })}
   ${figure("leo", { x: 940, y: 950, s: 1.56 })}`,

  // 2 "Teacher Yasmin taught us all year. We should thank her."
  `${classroomScene()}
   ${figure("nora", { x: 680, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 940, y: 950, s: 1.62 })}`,

  // 3 "Let's make a book. A book needs a title, a beginning and an ending."
  `${classroomScene()}${notepad(1200, 790, 1.25)}
   ${figure("amal", { x: 680, y: 950, s: 1.7, arms: "point" })}
   ${figure("leo", { x: 940, y: 950, s: 1.56 })}`,

  // 4 Leo chose the title and wrote it in his best letters
  `${classroomScene()}${poster(1240, 690, 1, { colour: G3.teal, lines: 2 })}
   ${figure("leo", { x: 700, y: 950, s: 1.68, holding: heldPaper })}`,

  // 5 Sami wrote about the garden; Adam wrote a poem, four lines long
  `${classroomScene()}${plantStage(1250, 946, 1.3, "flower")}
   ${figure("sami", { x: 640, y: 950, s: 1.62, holding: heldPaper })}
   ${figure("adam", { x: 880, y: 950, s: 1.6, holding: heldPaper })}`,

  // 6 Maya drew the Box of Ideas on the biggest page
  `${classroomScene()}${easel(1200, 940, 1.2)}
   ${figure("maya", { x: 760, y: 950, s: 1.66, arms: "point" })}`,

  // 7 "Every tale needs a problem. Our problem was fitting it all in."
  `${classroomScene()}${desk(1150, 950, 1.28, { item: notepad(0, 0, 0.5) })}
   ${figure("leo", { x: 680, y: 950, s: 1.66, arms: "up" })}
   ${figure("daniel", { x: 920, y: 950, s: 1.54 })}`,

  // 8 we put the pages in order: a beginning, a middle and an ending
  `${classroomScene()}${desk(1050, 950, 1.2, { item: notepad(0, 0, 0.5) })}${desk(1350, 950, 1.2, { item: openBook(0, 0, 0.45) })}
   ${figure("amal", { x: 640, y: 950, s: 1.64, holding: heldPaper })}
   ${figure("nora", { x: 850, y: 950, s: 1.56, holding: heldPaper })}`,

  // 9 on the last page we wrote our message, every name underneath
  `${classroomScene()}${notepad(1200, 790, 1.3)}
   ${figure("amal", { x: 680, y: 950, s: 1.68, holding: heldPaper })}
   ${figure("maya", { x: 920, y: 950, s: 1.56 })}`,

  // 10 we left it on her desk and waited, quiet as mice
  `${classroomScene()}${desk(1150, 950, 1.3, { item: folderProp(0, 0, 0.55) })}
   ${figure("amal", { x: 560, y: 950, s: 1.6 })}
   ${figure("nora", { x: 750, y: 950, s: 1.54 })}
   ${figure("leo", { x: 940, y: 950, s: 1.54 })}`,

  // 11 she read it slowly. At the ending, she smiled her biggest smile.
  `${classroomScene()}${desk(1200, 950, 1.25)}
   ${figure("yasmin", { x: 880, y: 950, s: 1.68, holding: heldBook })}
   ${figure("amal", { x: 560, y: 950, s: 1.58 })}`,

  // 12 "You used your own words. That is the best thank-you there is."
  `${classroomScene()}${confetti(800, 540)}
   ${figure("yasmin", { x: 660, y: 950, s: 1.66, arms: "up" })}
   ${figure("amal", { x: 900, y: 950, s: 1.6, arms: "up" })}
   ${figure("nora", { x: 1100, y: 950, s: 1.56, arms: "up" })}`,
];

// ================================================================ Unit 10, book 7
// Wherever We Go — the words come along into the summer

const whereverPages = [
  // 1 cover: Amal and Sami with their books, the town behind them
  `${townScene()}${house(1240, 900, 0.85)}
   ${figure("amal", { x: 680, y: 918, s: 1.72, holding: heldBook })}
   ${figure("sami", { x: 920, y: 918, s: 1.64, holding: heldBook })}`,

  // 2 on the last afternoon, Sami asked, "What will we do all summer?"
  `${classroomScene()}
   ${figure("sami", { x: 680, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 940, y: 950, s: 1.64 })}`,

  // 3 "Whatever we like," I said. "The words are coming with us."
  `${classroomScene()}${bookShelf(1250, 940, 1, { count: 7 })}
   ${figure("amal", { x: 700, y: 950, s: 1.7, arms: "point", holding: heldBook })}
   ${figure("sami", { x: 950, y: 950, s: 1.6 })}`,

  // 4 we can read at the market, on the signs above every stall
  `${townScene()}${marketStall(1140, 890, 0.9)}${signPost(400, 900, 0.82, { label: "MARKET", colour: G3.plum })}
   ${figure("sami", { x: 680, y: 918, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 900, y: 918, s: 1.62 })}`,

  // 5 we can read at the coast, where the boats have painted names
  `${coastScene()}${sailboat(1200, 600, 1.2)}
   ${figure("amal", { x: 680, y: 930, s: 1.66, arms: "point" })}
   ${figure("sami", { x: 920, y: 930, s: 1.6 })}`,

  // 6 we can count in the forest: trees, birds, steps along the trail
  `${forestScene()}${wildBird(1240, 460, 1.15, true)}
   ${figure("sami", { x: 700, y: 950, s: 1.66, arms: "up" })}
   ${figure("amal", { x: 940, y: 950, s: 1.62 })}`,

  // 7 we can tell tales on the mountain path, all the way up
  `${mountainScene()}
   ${figure("amal", { x: 700, y: 950, s: 1.66, arms: "up" })}
   ${figure("sami", { x: 940, y: 950, s: 1.6 })}`,

  // 8 "Wherever we go," said Sami, "there is something to read."
  `${yardScene()}${bench(1200, 940, 1.3)}
   ${figure("sami", { x: 680, y: 900, s: 1.66, holding: heldBook })}
   ${figure("amal", { x: 920, y: 900, s: 1.62 })}`,

  // 9 "And whenever we stop," I said, "there is something to tell."
  `${gardenScene()}${seedRow(1120, 906, 1.1)}
   ${figure("amal", { x: 700, y: 900, s: 1.68, arms: "point" })}
   ${figure("sami", { x: 940, y: 900, s: 1.6 })}`,

  // 10 we made a plan: one book each, every week, whatever the weather
  `${classroomScene()}${calendarBoard(1230, 660, 1.05, { ring: 30 })}
   ${figure("amal", { x: 660, y: 950, s: 1.66, holding: heldBook })}
   ${figure("sami", { x: 900, y: 950, s: 1.6, holding: heldBook })}`,

  // 11 at the gate we shook hands, like two authors
  `${townScene()}${fence(1240, 906, 1.15)}${house(420, 900, 0.8)}
   ${figure("amal", { x: 760, y: 918, s: 1.66, arms: "point" })}
   ${figure("sami", { x: 960, y: 918, s: 1.62, flip: true, arms: "point" })}`,

  // 12 whoever you are, wherever you go: take a book, and take a friend
  `${sunsetScene()}${wildBird(1240, 380, 1.05, true)}
   ${figure("amal", { x: 700, y: 900, s: 1.7, arms: "up" })}
   ${figure("sami", { x: 940, y: 900, s: 1.62, arms: "up" })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "minashells": { dir: "mina-counts-the-shells", pages: minaShellsPages },
  "bighouse": { dir: "how-big-is-our-house", pages: bigHousePages },
  "change": { dir: "the-right-change", pages: rightChangePages },
  "boxopen": { dir: "the-day-the-box-opened", pages: boxOpenedPages },
  "somebody": { dir: "somebody-nobody-everybody", pages: somebodyPages },
  "calm": { dir: "the-calm-place", pages: calmPlacePages },
  "aftershow": { dir: "after-the-showcase", pages: afterShowcasePages },
  "thankyou": { dir: "the-thank-you-book", pages: thankYouPages },
  "wherever": { dir: "wherever-we-go", pages: whereverPages },
};

writeBooks(books, process.argv[2]);
