#!/usr/bin/env node

// Grade 3, books FIVE to SEVEN of Units 1 to 4.
//
// The owner is growing every Grade 3 shelf from four books to seven. The first
// four books of each unit (create-grade3-ebook-illustrations.js and -2/-3/-4.js)
// already retell all five of the unit's own texts, so these three are new KINDS
// of book, the way the Grade 1 expansion worked: a CONTINUATION of the unit's
// own story, a VOCABULARY-IN-ACTION story built on one of the unit's vocabulary
// groups, and a third original story on the unit's theme in a setting the other
// two do not use.
//
//   Unit 1  The Second Show         continuation — the drama club performs again
//   Unit 1  All by Myself           vocabulary — myself/yourself/himself/ourselves
//   Unit 1  The Thank-You Party     theme — invite, polite, thankful, neighbour
//   Unit 2  The Champions' Lesson   continuation — the champions teach the juniors
//   Unit 2  The Class News          vocabulary — notebook, camera, radio, email
//   Unit 2  Grandma Hana's Radio    theme — a story needs no screen at all
//   Unit 3  The First Day of Vacation continuation — after the calendar's last page
//   Unit 3  Up with the Sun         vocabulary — wake, exercise, climb, healthy, win
//   Unit 3  A Hundred Years         theme — decades and centuries in Grandma's box
//   Unit 4  The Map of Our County   continuation — the class draws the bus trip
//   Unit 4  The Storm and the Rainbow vocabulary — storm, thunder, lightning, rainbow
//   Unit 4  Beyond the Big Rock     theme — beneath, beyond, within, at the coast
//
// The cast is the course's own (CAST in tools/lib/ehel-ebook-kit-grade3.js) and
// nothing is added to any kit: every new prop is a purely LOCAL inline SVG const
// in this file, with no data-tap (a tap value promises an audio clip exists).
//
// Usage: node tools/create-grade3-shelf-ebook-illustrations.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, acacia, bench, marketStall, confetti, dustPuffs, goat, hen, chick,
  wildBird, lampPost, clockTower, schoolBell, playBall, mango, cookpot, fruitBowl,
  waterBottle, thoughtBubble, rain, rainbow, puddle, gardenPlant, bigFlower,
  seedRow, fence, cleaningKit, notepad, mapProp, sailboat, raceBanner,
  balanceScale, patternStrip, bookShelf, openBook, calendarBoard, tabletProp,
  house, townBus, cloudPuff, kite, bunting, easel, lookLine, flatStone,
  motionArcs, sunsetScene, roomScene, roomBox, gardenScene, streetScene, cityBuildings,
  G2, G3, figure, heldBook, heldPaper, heldShell, heldBasket,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  desk, globeProp, shells, hospital, poster, monthWall, gardenWall,
  hourClock, microphone, stageCurtain, basketProp, courtHouse, collegeFront,
  folderProp, photoFrame, signPost,
} = require("./lib/ehel-ebook-kit-grade3.js");

// ---------------------------------------------------------------- local scenes
//
// The same local scenes the earlier Grade 3 generators build, called the same
// way, so a room does not change colour between one book and the next.

const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const eveningRoom = () => `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
  <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>`;
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;
const stageScene = () => `${plainRoomScene({ wall: "#e2d3b6" })}${stageCurtain(800, 130, 1.05, { span: 1320 })}`;
const libraryScene = () => `${plainRoomScene({ wall: "#e4dcc8" })}
  ${bookShelf(250, 300, 0.78, { count: 7 })}${bookShelf(1350, 300, 0.78, { count: 7 })}
  ${bookShelf(250, 600, 0.9, { count: 8 })}${bookShelf(1350, 600, 0.9, { count: 8 })}
  ${bookShelf(250, 940, 1.15, { count: 9 })}${bookShelf(1350, 940, 1.15, { count: 9 })}
  ${poster(800, 300, 0.72, { colour: G3.teal, lines: 3 })}`;

// ---------------------------------------------------------------- local props
//
// Purely local inline SVG. None of these carries a data-tap or data-figure —
// they are furniture, not characters, and no audio clip exists for them.

// A window set into a room's wall, showing whatever the weather is doing.
// `inner` is drawn behind the glazing bars, clipped by nothing — keep it inside
// the 300x260 pane.
function wallWindow(x, y, s = 1, { pane = "#27395c", inner = "" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-166" y="-146" width="332" height="292" rx="12" fill="#8a6242" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-150" y="-130" width="300" height="260" rx="8" fill="${pane}"/>
    ${inner}
    <path d="M 0 -130 v 260 M -150 0 h 300" stroke="#8a6242" stroke-width="10"/>
    <rect x="-150" y="-130" width="300" height="260" rx="8" fill="none" stroke="#8a6242" stroke-width="8"/>
  </g>`;
}
const rainPane = `${[-110, -60, -10, 40, 90].map((rx, i) => `<path d="M ${rx} -110 l -14 60 M ${rx + 22} -30 l -14 60" stroke="#9fc6e0" stroke-width="5" stroke-linecap="round" opacity="${0.7 - (i % 2) * 0.2}"/>`).join("")}`;
const boltPane = `<g class="anim-glow"><path d="M 10 -116 L 52 -40 L 26 -40 L 62 40 L 2 -18 L 30 -18 Z" fill="#ffe9a8" stroke="#f0b429" stroke-width="4"/></g>${rainPane}`;

// A television on a low stand. `on` fills the screen; the storm book only ever
// draws it dark, which is the point of the page it is on.
function tvProp(x, y, s = 1, { on = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -50 0 q 50 -12 100 0 z" fill="#6b5a44" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-14" y="-38" width="28" height="38" fill="#6b5a44" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-96" y="-158" width="192" height="122" rx="10" fill="#4a4038" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-82" y="-146" width="164" height="98" rx="6" fill="${on ? "#bfe0f4" : "#2b2724"}" stroke="${C.ink}" stroke-width="3.4"/>
    ${on ? `<circle cx="0" cy="-97" r="26" fill="${G3.gold}" opacity="0.8"/>` : `<ellipse cx="-40" cy="-120" rx="26" ry="12" fill="#3d3833"/>`}
  </g>`;
}

// Grandma Hana's small old radio: a rounded case, a woven speaker, one dial and
// a bent aerial. Drawn once here so it is the same radio on every page.
function radioProp(x, y, s = 1, { playing = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 62 -104 l 52 -66" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="114" cy="-170" r="7" fill="${G3.stone}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="-92" y="-104" width="184" height="104" rx="18" fill="#a8724f" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-76" y="-88" width="94" height="72" rx="10" fill="#e8d5a8" stroke="${C.ink}" stroke-width="3.6"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M ${-68 + i * 20} -84 v 64" stroke="#b08758" stroke-width="4"/>`).join("")}
    <circle cx="52" cy="-52" r="22" fill="${G3.gold}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M 52 -52 l 12 -12" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
    ${playing ? `<g class="anim-shimmer">
      <circle cx="-104" cy="-118" r="6" fill="${G3.teal}"/>
      <circle cx="-126" cy="-146" r="5" fill="${G3.coral}"/>
      <circle cx="-96" cy="-160" r="4" fill="${G3.gold}"/>
    </g>` : ""}
  </g>`;
}

// The cardboard television Leo builds for the class news: a carton with a hole
// cut for the screen and two drawn-on dials. Deliberately wobblier than tvProp.
function tvBoxProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -104 0 l 6 -150 h 196 l 6 150 z" fill="#c99a5c" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -98 -150 h 196 l 14 -20 h -170 z" fill="#b08147" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-76" y="-128" width="120" height="92" rx="8" fill="#4a3a2c" stroke="${C.ink}" stroke-width="4.5"/>
    <circle cx="72" cy="-100" r="12" fill="none" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="72" cy="-62" r="12" fill="none" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -60 -20 h 60" stroke="#8a6242" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

// Grandma Hana's old brown photo box, open, with grey photographs leaning out.
function photoBox(x, y, s = 1) {
  const photo = (px, rot) => `<g transform="translate(${px} -96) rotate(${rot})">
    <rect x="-30" y="-40" width="60" height="80" rx="3" fill="#dfe6ea" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-22" y="-32" width="44" height="48" fill="#9fb4c6"/>
    <path d="M -22 -6 l 14 -14 l 10 8 l 12 -12 l 8 8 v 16 h -44 z" fill="#7d8ba0"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${photo(-30, -10)}${photo(24, 8)}
    <path d="M -86 0 l 8 -96 h 156 l 8 96 z" fill="#8a6242" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -78 -96 h 156 l 8 -18 h -172 z" fill="#6b4a30" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -56 -48 h 112" stroke="#6b4a30" stroke-width="7"/>
  </g>`;
}

// A small marker flag on a stick, for the treasure-hunt boundary on the sand.
function coastFlag(x, y, s = 1, { colour = G3.coral } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 0 v -140" stroke="#8a6242" stroke-width="7" stroke-linecap="round"/>
    <g class="anim-canopy"><path d="M 0 -140 l 84 22 l -84 22 z" fill="${colour}" stroke="${C.ink}" stroke-width="4"/></g>
    <ellipse cx="0" cy="2" rx="20" ry="7" fill="${C.ink}" opacity="0.10"/>
  </g>`;
}

// The big rock the clues walk the class around: one boulder, sat in the sand.
function bigRock(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="4" rx="150" ry="20" fill="${C.ink}" opacity="0.10"/>
    <path d="M -140 0 q -12 -96 60 -128 q 84 -36 138 22 q 40 46 24 106 z" fill="${G3.stone}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -92 -34 q 34 -46 88 -52" stroke="#cfc8bd" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M -40 -8 q 40 -14 88 -6" stroke="${G3.stoneDark}" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>`;
}

// A camera in a character's hands, for Maya's class-news photographs.
const heldCamera = `<g transform="translate(0 8)"><rect x="-30" y="-20" width="60" height="40" rx="7" fill="#4a5560" stroke="${C.ink}" stroke-width="3.4"/><circle cx="0" cy="0" r="13" fill="#7d8ba0" stroke="${C.ink}" stroke-width="3"/><circle cx="0" cy="0" r="6" fill="#2b3541"/><rect x="14" y="-16" width="12" height="8" rx="2" fill="${G3.gold}"/></g>`;

// ================================================================ Unit 1, book 5
// The Second Show — the day after "Amal's Big Day": the club performs again

const secondShowPages = [
  // 1 cover: the club back on the stage, Amal in the middle
  `${stageScene()}
   ${figure("nora", { x: 540, y: 950, s: 1.55 })}
   ${figure("amal", { x: 790, y: 950, s: 1.8, arms: "up" })}
   ${figure("mina", { x: 1000, y: 952, s: 1.24, arms: "up" })}
   ${figure("yasmin", { x: 1230, y: 950, s: 1.6 })}`,

  // 2 the morning after the play, Teacher Yasmin has news
  `${classroomScene()}
   ${figure("yasmin", { x: 620, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.56, mood: "surprised" })}
   ${figure("nora", { x: 1120, y: 950, s: 1.52, mood: "surprised" })}`,

  // 3 the club gets ready for a second show on Friday
  `${stageScene()}
   ${figure("nora", { x: 520, y: 950, s: 1.55 })}
   ${figure("daniel", { x: 740, y: 950, s: 1.52 })}
   ${figure("amal", { x: 980, y: 950, s: 1.66, holding: heldPaper })}`,

  // 4 Nora practises her part - no teaching needed this time
  `${stageScene()}
   ${figure("nora", { x: 940, y: 950, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 620, y: 950, s: 1.6 })}`,

  // 5 Mina asks to be in the play; her job is to clap in the right places
  `${homeScene()}${roomBox(1270, 640, 1.12, "living")}
   ${figure("mina", { x: 640, y: 952, s: 1.26, arms: "up" })}
   ${figure("amal", { x: 880, y: 950, s: 1.62, arms: "point" })}`,

  // 6 pressing the vest, making a brand-new paper hat
  `${homeScene()}${roomBox(1250, 640, 1.1, "bedroom")}
   ${figure("mum", { x: 560, y: 950, s: 1.62 })}
   ${figure("amal", { x: 820, y: 950, s: 1.58, holding: heldPaper })}`,

  // 7 Friday: the hall is full, the family in the front row
  `${stageScene()}${bench(420, 946, 1.5)}
   ${figure("hana", { x: 620, y: 950, s: 1.56 })}
   ${figure("mum", { x: 840, y: 950, s: 1.58 })}
   ${figure("dad", { x: 1070, y: 950, s: 1.62 })}`,

  // 8 Amal's hands keep still this time
  `${stageScene()}
   ${figure("amal", { x: 800, y: 950, s: 1.8 })}`,

  // 9 Nora speaks slowly and clearly
  `${stageScene()}
   ${figure("nora", { x: 700, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 980, y: 950, s: 1.58 })}
   ${figure("daniel", { x: 1190, y: 950, s: 1.5 })}`,

  // 10 Mina claps in exactly the right place, and everybody claps with her
  `${stageScene()}${confetti(820, 480)}
   ${figure("mina", { x: 800, y: 952, s: 1.3, arms: "up" })}
   ${figure("amal", { x: 560, y: 950, s: 1.62, arms: "up" })}
   ${figure("nora", { x: 1050, y: 950, s: 1.56, arms: "up" })}`,

  // 11 Grandma Hana: a play is even better the second time
  `${eveningRoom()}
   ${figure("hana", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.58 })}`,

  // 12 Junior did the play twice, and it was not small either time
  `${sunsetScene()}${house(1280, 900, 0.78)}
   ${figure("amal", { x: 640, y: 900, s: 1.74, arms: "up" })}
   ${figure("nora", { x: 890, y: 900, s: 1.56 })}`,
];

// ================================================================ Unit 1, book 6
// All by Myself — myself, yourself, himself, herself, itself, ourselves

const byMyselfPages = [
  // 1 cover: Mina with her arms up, Amal beside her at home
  `${homeScene()}${roomBox(1260, 640, 1.12, "living")}
   ${figure("mina", { x: 700, y: 952, s: 1.34, arms: "up" })}
   ${figure("amal", { x: 950, y: 950, s: 1.7 })}`,

  // 2 "I can do it all by myself!" said Mina, at breakfast
  `${homeScene()}${roomBox(1250, 640, 1.1, "dining")}
   ${figure("mina", { x: 620, y: 952, s: 1.28, arms: "up" })}
   ${figure("mum", { x: 860, y: 950, s: 1.6 })}
   ${figure("amal", { x: 1080, y: 950, s: 1.52 })}`,

  // 3 she pours the milk herself - some of it goes in the cup
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}${waterBottle(920, 940, 1.2)}
   ${figure("mina", { x: 680, y: 952, s: 1.28, mood: "surprised" })}`,

  // 4 Idris makes his bed himself, every morning
  `${homeScene()}${roomBox(1240, 640, 1.16, "bedroom")}
   ${figure("idris", { x: 680, y: 950, s: 1.62, arms: "up" })}`,

  // 5 Adam cooked lunch himself on Saturday
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}${cookpot(420, 940, 1.15)}
   ${figure("adam", { x: 760, y: 950, s: 1.7 })}`,

  // 6 I tidy my room myself - nobody has to ask
  `${homeScene()}${roomBox(1250, 640, 1.12, "bedroom")}${cleaningKit(400, 946, 1.1)}
   ${figure("amal", { x: 760, y: 950, s: 1.68, arms: "up" })}`,

  // 7 "Can you carry the basket yourself?" It is heavy.
  `${homeScene()}${basketProp(1150, 946, 1.25, { kind: "fruit" })}
   ${figure("mum", { x: 560, y: 950, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 860, y: 950, s: 1.56 })}`,

  // 8 Idris helps, and we carry it ourselves, together
  `${streetScene()}${basketProp(830, 836, 1.1, { kind: "fruit" })}
   ${figure("amal", { x: 650, y: 890, s: 1.64, arms: "up" })}
   ${figure("idris", { x: 1010, y: 890, s: 1.56, arms: "up" })}`,

  // 9 even the hen finds its own breakfast, all by itself
  `${gardenScene()}${seedRow(1060, 906, 1.1)}
   ${hen({ x: 1180, y: 900, s: 0.6, flip: true })}
   ${figure("mina", { x: 640, y: 900, s: 1.3, arms: "point" })}
   ${figure("amal", { x: 880, y: 900, s: 1.62 })}`,

  // 10 "Watch me!" Mina puts every toy away herself
  `${homeScene()}${roomBox(1260, 640, 1.1, "living")}${playBall(430, 936, 1.15)}
   ${figure("mina", { x: 760, y: 952, s: 1.32, arms: "up" })}`,

  // 11 Dad smiles: "You did that yourselves. All of you."
  `${homeScene()}
   ${figure("dad", { x: 560, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 840, y: 950, s: 1.54 })}
   ${figure("idris", { x: 1040, y: 950, s: 1.46 })}
   ${figure("mina", { x: 1210, y: 952, s: 1.22, arms: "up" })}`,

  // 12 the best jobs we do ourselves, together
  `${sunsetScene()}${house(1280, 900, 0.78)}
   ${figure("amal", { x: 600, y: 900, s: 1.68, arms: "up" })}
   ${figure("idris", { x: 840, y: 900, s: 1.56, arms: "up" })}
   ${figure("mina", { x: 1040, y: 902, s: 1.26, arms: "up" })}`,
];

// ================================================================ Unit 1, book 7
// The Thank-You Party — invite, polite, thankful, neighbour, glad

const thankYouPages = [
  // 1 cover: the garden party under the bunting
  `${gardenScene()}${bunting(800, 150, 1.15, { span: 1160 })}
   ${figure("mum", { x: 560, y: 900, s: 1.6 })}
   ${figure("amal", { x: 810, y: 900, s: 1.74, arms: "up" })}
   ${figure("mina", { x: 1020, y: 902, s: 1.26, arms: "up" })}`,

  // 2 "Our neighbours help us all year. Let us thank them."
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}
   ${figure("mum", { x: 620, y: 950, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.56 })}
   ${figure("mina", { x: 1090, y: 952, s: 1.22 })}`,

  // 3 we decide to invite them to a party in the garden
  `${homeScene()}${roomBox(1260, 640, 1.1, "living")}
   ${figure("dad", { x: 580, y: 950, s: 1.66 })}
   ${figure("mum", { x: 830, y: 950, s: 1.6 })}
   ${figure("amal", { x: 1070, y: 950, s: 1.54, arms: "up" })}`,

  // 4 I write the invitations in my very best handwriting
  `${homeScene()}${desk(1200, 950, 1.28)}
   ${figure("amal", { x: 760, y: 950, s: 1.68, holding: heldPaper })}
   ${figure("mina", { x: 1010, y: 952, s: 1.22 })}`,

  // 5 Adam carries chairs, Idris sweeps, Mina picks flowers
  `${gardenScene()}${dustPuffs(1020, 900)}${bigFlower(1250, 890, 1.1)}
   ${figure("adam", { x: 560, y: 900, s: 1.62, holding: heldFolderChair() })}
   ${figure("idris", { x: 890, y: 900, s: 1.52 })}
   ${figure("mina", { x: 1150, y: 902, s: 1.26, arms: "point" })}`,

  // 6 Grandma Hana cooks, and the whole street can smell it
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}${cookpot(420, 940, 1.2)}
   ${figure("hana", { x: 760, y: 950, s: 1.66 })}`,

  // 7 at four o'clock the neighbours come, and Omar brings mangoes
  `${gardenScene()}${bunting(800, 150, 1.1, { span: 1100 })}${basketProp(1220, 916, 1.1, { kind: "fruit" })}
   ${figure("omar", { x: 1050, y: 900, s: 1.6 })}
   ${figure("mum", { x: 560, y: 900, s: 1.58 })}
   ${figure("amal", { x: 790, y: 900, s: 1.54, arms: "up" })}`,

  // 8 thank you for the party - thank you for being kind neighbours
  `${gardenScene()}${bunting(800, 150, 1.1, { span: 1100 })}
   ${figure("dad", { x: 580, y: 900, s: 1.66, arms: "up" })}
   ${figure("omar", { x: 860, y: 900, s: 1.58 })}
   ${figure("nadia", { x: 1110, y: 900, s: 1.56 })}`,

  // 9 we are polite: guests choose first
  `${gardenScene()}${fruitBowl(880, 926, 1.2)}
   ${figure("amal", { x: 620, y: 900, s: 1.62, arms: "point" })}
   ${figure("omar", { x: 1080, y: 900, s: 1.58 })}`,

  // 10 Mina uses her small voice, and everybody hears her anyway
  `${gardenScene()}${bunting(800, 150, 1.1, { span: 1100 })}
   ${figure("mina", { x: 800, y: 902, s: 1.3 })}
   ${figure("omar", { x: 1050, y: 900, s: 1.56 })}
   ${figure("mum", { x: 560, y: 900, s: 1.56 })}`,

  // 11 when the sun goes down, we wave goodbye at the gate
  `${sunsetScene()}${fence(1180, 900, 1.15, 3)}
   ${figure("amal", { x: 600, y: 900, s: 1.64, arms: "up" })}
   ${figure("mina", { x: 830, y: 902, s: 1.26, arms: "up" })}
   ${figure("mum", { x: 1030, y: 900, s: 1.58, arms: "up" })}`,

  // 12 glad and thankful - a promise to say thank you is easy to keep
  `${sunsetScene()}${house(1270, 900, 0.78)}
   ${figure("amal", { x: 700, y: 900, s: 1.78 })}`,
];

// Adam carrying a folded chair to the garden: a local held prop, one page only.
function heldFolderChair() {
  return `<g transform="translate(0 8) rotate(-8)">
    <rect x="-26" y="-30" width="52" height="10" rx="4" fill="#8a6242" stroke="${C.ink}" stroke-width="3"/>
    <path d="M -20 -20 l -6 44 M 20 -20 l 6 44 M -14 -20 l 10 44 M 14 -20 l -10 44" stroke="#8a6242" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

// ================================================================ Unit 2, book 5
// The Champions' Lesson — the Grammar Champions teach the junior class

const championsLessonPages = [
  // 1 cover: the three champions with their poster
  `${classroomScene()}${poster(1240, 690, 1.05, { colour: G3.plum, lines: 3 })}
   ${figure("amal", { x: 560, y: 950, s: 1.7, arms: "up" })}
   ${figure("nora", { x: 800, y: 950, s: 1.58 })}
   ${figure("daniel", { x: 1010, y: 950, s: 1.56 })}`,

  // 2 after the contest, Teacher Yasmin has one more idea
  `${classroomScene()}
   ${figure("yasmin", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 940, y: 950, s: 1.54 })}
   ${figure("nora", { x: 1140, y: 950, s: 1.5 })}`,

  // 3 "Champions, will you teach the junior class?"
  `${classroomScene()}
   ${figure("yasmin", { x: 500, y: 950, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 800, y: 950, s: 1.54, mood: "surprised" })}
   ${figure("daniel", { x: 1000, y: 950, s: 1.52, mood: "surprised" })}
   ${figure("nora", { x: 1200, y: 950, s: 1.5, mood: "surprised" })}`,

  // 4 getting ready in the library; Daniel draws three big cartoons
  `${libraryScene()}${desk(1030, 950, 1.25)}
   ${figure("daniel", { x: 640, y: 950, s: 1.62, holding: heldPaper })}
   ${figure("nora", { x: 880, y: 950, s: 1.52 })}`,

  // 5 Nora writes IN, ON and UNDER at the top of a poster
  `${plainRoomScene()}${poster(1180, 690, 1.2, { colour: G3.teal, lines: 3 })}
   ${figure("nora", { x: 760, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 520, y: 950, s: 1.56 })}`,

  // 6 Amal practises speaking slowly and clearly
  `${classroomScene()}
   ${figure("amal", { x: 780, y: 950, s: 1.74, arms: "point" })}`,

  // 7 the junior class sits in rows and looks up at us
  `${classroomScene()}${desk(360, 950, 1.15)}${desk(620, 950, 1.15)}
   ${figure("mina", { x: 490, y: 952, s: 1.22 })}
   ${figure("amal", { x: 940, y: 950, s: 1.6 })}
   ${figure("nora", { x: 1140, y: 950, s: 1.54 })}
   ${figure("daniel", { x: 1330, y: 950, s: 1.52 })}`,

  // 8 "The book is ON the desk"
  `${classroomScene()}${desk(1150, 950, 1.3, { item: openBook(0, 0, 0.5) })}
   ${figure("amal", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("daniel", { x: 920, y: 950, s: 1.54 })}`,

  // 9 "Now the book is UNDER the desk!" - the little ones laugh
  `${classroomScene()}${desk(1150, 950, 1.3)}${openBook(1150, 944, 0.6)}
   ${figure("amal", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("mina", { x: 900, y: 952, s: 1.24, arms: "up" })}`,

  // 10 a small girl puts her pencil IN the cup, all by herself
  `${classroomScene()}${desk(1150, 950, 1.28)}${confetti(760, 520)}
   ${figure("mina", { x: 900, y: 952, s: 1.26, arms: "up" })}
   ${figure("nora", { x: 560, y: 950, s: 1.56, arms: "up" })}`,

  // 11 "Teaching is learning twice," says Teacher Yasmin from the door
  `${classroomScene()}
   ${figure("yasmin", { x: 1180, y: 950, s: 1.62, arms: "point" })}
   ${figure("amal", { x: 620, y: 950, s: 1.58 })}
   ${figure("daniel", { x: 860, y: 950, s: 1.52 })}`,

  // 12 the champions won something better than a prize
  `${classroomScene()}${poster(1240, 690, 1.05, { colour: G3.gold, lines: 3 })}
   ${figure("amal", { x: 580, y: 950, s: 1.68, arms: "up" })}
   ${figure("nora", { x: 830, y: 950, s: 1.56, arms: "up" })}
   ${figure("daniel", { x: 1050, y: 950, s: 1.54, arms: "up" })}`,
];

// ================================================================ Unit 2, book 6
// The Class News — notebook, camera, radio, television, internet, email

const classNewsPages = [
  // 1 cover: the newsroom - notebook, camera and the class
  `${classroomScene()}
   ${figure("amal", { x: 580, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("maya", { x: 850, y: 950, s: 1.56, holding: heldCamera })}
   ${figure("sami", { x: 1080, y: 950, s: 1.54 })}`,

  // 2 "This week, our class will make the news."
  `${classroomScene()}
   ${figure("yasmin", { x: 600, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.54 })}
   ${figure("sami", { x: 1100, y: 950, s: 1.52 })}`,

  // 3 Maya brings a camera - a photograph tells a story too
  `${classroomScene()}
   ${figure("maya", { x: 760, y: 950, s: 1.64, holding: heldCamera })}
   ${figure("amal", { x: 1020, y: 950, s: 1.54, mood: "surprised" })}`,

  // 4 Sami and Amal hunt for news with a notebook
  `${yardScene()}${schoolBell(1180, 640, 1.1)}
   ${figure("sami", { x: 640, y: 900, s: 1.6 })}
   ${figure("amal", { x: 880, y: 900, s: 1.62, holding: heldPaper })}`,

  // 5 news in the library: the new books, and a photograph of them
  `${libraryScene()}
   ${figure("maya", { x: 700, y: 950, s: 1.6, holding: heldCamera })}
   ${figure("amal", { x: 950, y: 950, s: 1.56, holding: heldPaper })}`,

  // 6 Daniel speaks like the man on the radio
  `${classroomScene()}${desk(1200, 950, 1.3, { item: radioProp(0, 6, 0.72) })}
   ${figure("daniel", { x: 700, y: 950, s: 1.68, arms: "up" })}`,

  // 7 Leo draws a big television out of a box
  `${classroomScene()}${tvBoxProp(1150, 940, 1.25)}
   ${figure("leo", { x: 700, y: 950, s: 1.66, arms: "point" })}`,

  // 8 we read our news through the box, one story at a time
  `${classroomScene()}${tvBoxProp(1120, 940, 1.25)}
   ${figure("amal", { x: 640, y: 950, s: 1.62, holding: heldPaper })}
   ${figure("nora", { x: 880, y: 950, s: 1.52 })}`,

  // 9 Teacher Yasmin helps send it all by email
  `${classroomScene()}${desk(1180, 950, 1.3, { item: tabletProp(0, 4, 0.6) })}
   ${figure("yasmin", { x: 620, y: 950, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.52 })}`,

  // 10 the internet can carry your words a long, long way
  `${classroomScene()}${globeProp(1210, 940, 1.45)}
   ${figure("yasmin", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("maya", { x: 920, y: 950, s: 1.52 })}`,

  // 11 two days later, an email comes back
  `${classroomScene()}${desk(1180, 950, 1.3, { item: tabletProp(0, 4, 0.6) })}
   ${figure("amal", { x: 660, y: 950, s: 1.62, arms: "up" })}
   ${figure("sami", { x: 900, y: 950, s: 1.54, arms: "up" })}`,

  // 12 now we make the news every Friday - bring your notebook
  `${classroomScene()}${poster(1240, 690, 1.05, { colour: G3.coral, lines: 4 })}
   ${figure("amal", { x: 600, y: 950, s: 1.68, holding: heldPaper })}
   ${figure("maya", { x: 860, y: 950, s: 1.56, holding: heldCamera })}
   ${figure("daniel", { x: 1080, y: 950, s: 1.52 })}`,
];

// ================================================================ Unit 2, book 7
// Grandma Hana's Radio — the night the lights went out

const radioPages = [
  // 1 cover: the family round the little radio in the evening
  `${eveningRoom()}${radioProp(1150, 940, 1.45, { playing: true })}
   ${figure("hana", { x: 560, y: 950, s: 1.64 })}
   ${figure("amal", { x: 810, y: 950, s: 1.56 })}
   ${figure("mina", { x: 990, y: 952, s: 1.24 })}`,

  // 2 the rain comes down and the lights go out
  `${eveningRoom()}${wallWindow(1240, 400, 1.1, { inner: rainPane })}
   ${figure("amal", { x: 640, y: 950, s: 1.64, mood: "surprised" })}
   ${figure("mina", { x: 880, y: 952, s: 1.24, mood: "sad" })}`,

  // 3 no television, no lamp for reading
  `${eveningRoom()}${tvProp(1180, 940, 1.3)}
   ${figure("mina", { x: 660, y: 952, s: 1.26, mood: "sad" })}
   ${figure("amal", { x: 890, y: 950, s: 1.58 })}`,

  // 4 Grandma Hana brings out a small old radio
  `${eveningRoom()}${radioProp(1150, 940, 1.35)}
   ${figure("hana", { x: 700, y: 950, s: 1.68, arms: "point" })}`,

  // 5 "This radio is older than your dad." She turns the little wheel.
  `${eveningRoom()}${radioProp(1120, 940, 1.35)}
   ${figure("hana", { x: 680, y: 950, s: 1.64, arms: "point" })}
   ${figure("idris", { x: 920, y: 950, s: 1.48 })}`,

  // 6 a voice tells a story about a clever fisherman
  `${eveningRoom()}${radioProp(430, 940, 1.25, { playing: true })}
   ${thoughtBubble(1130, 390, 1.5, sailboat(0, 70, 0.55))}
   ${figure("amal", { x: 750, y: 950, s: 1.6 })}`,

  // 7 sitting close together in the dark, listening to every word
  `${eveningRoom()}${radioProp(1180, 940, 1.3, { playing: true })}
   ${figure("hana", { x: 520, y: 950, s: 1.6 })}
   ${figure("amal", { x: 750, y: 950, s: 1.52 })}
   ${figure("idris", { x: 930, y: 950, s: 1.44 })}
   ${figure("mina", { x: 1070, y: 952, s: 1.2 })}`,

  // 8 "When I was young, the radio was our television."
  `${eveningRoom()}${radioProp(1150, 940, 1.3)}
   ${figure("hana", { x: 660, y: 950, s: 1.68, arms: "point" })}
   ${figure("mina", { x: 920, y: 952, s: 1.24, mood: "surprised" })}`,

  // 9 the story ends - so Grandma Hana tells the next one herself
  `${eveningRoom()}
   ${figure("hana", { x: 700, y: 950, s: 1.7, arms: "up" })}
   ${figure("amal", { x: 970, y: 950, s: 1.54 })}`,

  // 10 hers has a storm, a boat, and a very brave hen
  `${eveningRoom()}
   ${thoughtBubble(1100, 380, 1.6, `${sailboat(-40, 80, 0.5)}${hen({ x: 60, y: 80, s: 0.32 })}`)}
   ${figure("hana", { x: 560, y: 950, s: 1.62, arms: "point" })}
   ${figure("mina", { x: 800, y: 952, s: 1.24, arms: "up" })}`,

  // 11 the lights come back on - and nobody turns the television on
  `${homeScene()}${tvProp(1180, 940, 1.3)}${radioProp(420, 940, 1.15)}
   ${figure("hana", { x: 700, y: 950, s: 1.62 })}
   ${figure("amal", { x: 940, y: 950, s: 1.54 })}`,

  // 12 some stories need no screen - just a voice, and people listening
  `${homeScene()}
   ${figure("hana", { x: 620, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 890, y: 950, s: 1.54 })}
   ${figure("idris", { x: 1090, y: 950, s: 1.46 })}
   ${figure("mina", { x: 1250, y: 952, s: 1.2 })}`,
];

// ================================================================ Unit 3, book 5
// The First Day of Vacation — after the calendar's last page

const vacationPages = [
  // 1 cover: Amal reading in the garden, a hen for company
  `${gardenScene()}
   ${figure("amal", { x: 760, y: 900, s: 1.78, holding: heldBook })}
   ${hen({ x: 1120, y: 900, s: 0.58 })}`,

  // 2 the vacation begins: no school bell, no line at the gate
  `${townScene()}${house(1250, 900, 0.82)}
   ${figure("amal", { x: 680, y: 900, s: 1.72, arms: "up" })}`,

  // 3 but at six o'clock my eyes still open, right on time
  `${homeScene()}${roomBox(1240, 640, 1.16, "bedroom")}${hourClock(420, 300, 1.55, { hour: 6 })}
   ${figure("amal", { x: 700, y: 950, s: 1.62, mood: "surprised" })}`,

  // 4 "A routine is hard to switch off," laughs Mum
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}
   ${figure("mum", { x: 620, y: 950, s: 1.64, arms: "up" })}
   ${figure("amal", { x: 880, y: 950, s: 1.56 })}`,

  // 5 at seven, a slow breakfast - nobody has to hurry
  `${homeScene()}${roomBox(1250, 640, 1.1, "dining")}${fruitBowl(400, 940, 1.2)}${hourClock(1260, 300, 1.4, { hour: 7 })}
   ${figure("mum", { x: 580, y: 950, s: 1.6 })}
   ${figure("amal", { x: 810, y: 950, s: 1.52 })}
   ${figure("mina", { x: 980, y: 952, s: 1.2 })}`,

  // 6 at eight, the first of the saved-up books
  `${homeScene()}${bookShelf(1250, 600, 0.85)}
   ${figure("amal", { x: 720, y: 950, s: 1.68, holding: heldBook })}`,

  // 7 reading in the garden all morning, hens for company
  `${gardenScene()}${gardenPlant(420, 890, 1.05)}
   ${figure("amal", { x: 760, y: 900, s: 1.68, holding: heldBook })}
   ${hen({ x: 1130, y: 900, s: 0.56 })}
   ${chick(1250, 916, 0.5)}`,

  // 8 at one o'clock Sami comes round - lunch under the tree
  `${yardScene()}${bench(1200, 940, 1.3)}${fruitBowl(1010, 930, 1.1)}
   ${figure("amal", { x: 620, y: 900, s: 1.64 })}
   ${figure("sami", { x: 850, y: 900, s: 1.58 })}`,

  // 9 in the afternoon we draw a calendar of the vacation
  `${homeScene()}${desk(1200, 950, 1.28)}
   ${figure("amal", { x: 660, y: 950, s: 1.64, holding: heldPaper })}
   ${figure("sami", { x: 900, y: 950, s: 1.56 })}`,

  // 10 swimming on Monday, the market on Friday, books in between
  `${homeScene()}${calendarBoard(1230, 660, 1.1, { ring: 5 })}
   ${figure("amal", { x: 680, y: 950, s: 1.64, arms: "point" })}
   ${figure("sami", { x: 930, y: 950, s: 1.54 })}`,

  // 11 "Even a vacation fits better in order." Grandma Hana laughs.
  `${eveningRoom()}
   ${figure("hana", { x: 660, y: 950, s: 1.68, arms: "up" })}
   ${figure("amal", { x: 930, y: 950, s: 1.56 })}`,

  // 12 tomorrow I will wake at six - but I will not get up until seven
  `${homeScene()}${roomBox(1240, 640, 1.14, "bedroom")}${hourClock(420, 310, 1.5, { hour: 7 })}
   ${figure("amal", { x: 720, y: 950, s: 1.64, arms: "up" })}`,
];

// ================================================================ Unit 3, book 6
// Up with the Sun — wake, exercise, climb, healthy, win; told by Idris

const upWithSunPages = [
  // 1 cover: Idris in the morning town, ready to run
  `${townScene()}${motionArcs(1080, 860, 1.2)}
   ${figure("idris", { x: 760, y: 900, s: 1.78, arms: "up" })}`,

  // 2 the school games are coming, and I want to win the big race
  `${yardScene()}${raceBanner(760, 560, 1.1)}
   ${figure("idris", { x: 600, y: 900, s: 1.64 })}
   ${figure("theo", { x: 840, y: 900, s: 1.58 })}`,

  // 3 "A healthy body starts with sleep," says Dad
  `${eveningRoom()}${roomBox(1240, 640, 1.14, "bedroom")}
   ${figure("dad", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("idris", { x: 890, y: 950, s: 1.52 })}`,

  // 4 firstly, wake up with the sun, while the town is still asleep
  `${townScene()}${house(1260, 900, 0.8)}${wildBird(420, 480, 1.1, true)}
   ${figure("idris", { x: 720, y: 900, s: 1.68, arms: "up" })}`,

  // 5 secondly, stretch and exercise in the yard - ten jumps, ten hops
  `${yardScene()}${dustPuffs(900, 920)}
   ${figure("idris", { x: 740, y: 900, s: 1.7, arms: "up" })}`,

  // 6 then Theo and I run to the old tree and back
  `${townScene()}${acacia(1290, 620, 1.35)}${motionArcs(960, 860, 1.1)}${dustPuffs(620, 916)}
   ${figure("idris", { x: 560, y: 900, s: 1.64 })}
   ${figure("theo", { x: 800, y: 900, s: 1.58 })}`,

  // 7 we climb the low wall at the schoolyard, away from danger
  `${yardScene()}${gardenWall(1050, 940, 0.9, { length: 460 })}
   ${figure("idris", { x: 620, y: 900, s: 1.64, arms: "up" })}
   ${figure("theo", { x: 860, y: 900, s: 1.56 })}`,

  // 8 Mina exercises with me: three jumps, then a rest
  `${gardenScene()}${motionArcs(1000, 870, 0.9)}
   ${figure("mina", { x: 860, y: 902, s: 1.3, arms: "up" })}
   ${figure("idris", { x: 620, y: 900, s: 1.64, arms: "point" })}`,

  // 9 I drop my water bottle and it breaks - Mum finds me another
  `${streetScene()}${waterBottle(900, 924, 1.25)}
   ${figure("idris", { x: 640, y: 890, s: 1.62, mood: "sad" })}
   ${figure("mum", { x: 1080, y: 890, s: 1.58, arms: "point" })}`,

  // 10 sports day: wide awake, legs strong, not weak
  `${yardScene()}${raceBanner(760, 560, 1.15)}
   ${figure("idris", { x: 600, y: 900, s: 1.64 })}
   ${figure("theo", { x: 830, y: 900, s: 1.58 })}
   ${figure("daniel", { x: 1050, y: 900, s: 1.56 })}`,

  // 11 finally, the race! my fastest ever - second place
  `${yardScene()}${raceBanner(760, 560, 1.15)}${confetti(800, 400)}${motionArcs(560, 860, 1)}
   ${figure("theo", { x: 900, y: 900, s: 1.6, arms: "up" })}
   ${figure("idris", { x: 660, y: 900, s: 1.64, arms: "up" })}`,

  // 12 "Second is a win too, when last year you came fifth."
  `${sunsetScene()}
   ${figure("dad", { x: 640, y: 900, s: 1.7, arms: "point" })}
   ${figure("idris", { x: 920, y: 900, s: 1.56 })}`,
];

// ================================================================ Unit 3, book 7
// A Hundred Years — decades and centuries in Grandma Hana's photo box

const hundredYearsPages = [
  // 1 cover: Grandma Hana, the photo box and an old photograph of the town
  `${eveningRoom()}${photoFrame(1200, 700, 1.2, { inner: cityBuildings(0, 80, 0.3) })}
   ${figure("hana", { x: 580, y: 950, s: 1.66 })}
   ${figure("amal", { x: 840, y: 950, s: 1.56 })}
   ${figure("idris", { x: 1030, y: 950, s: 1.46 })}`,

  // 2 in the evening, Grandma Hana opens her old brown box
  `${eveningRoom()}${photoBox(1150, 940, 1.25)}
   ${figure("hana", { x: 700, y: 950, s: 1.68, arms: "point" })}`,

  // 3 inside are photographs from long ago, small and grey
  `${eveningRoom()}${photoBox(1120, 940, 1.2)}
   ${figure("amal", { x: 640, y: 950, s: 1.62, mood: "surprised" })}
   ${figure("hana", { x: 900, y: 950, s: 1.6 })}`,

  // 4 "This is my school. That was fifty years in the past."
  `${eveningRoom()}${photoFrame(1180, 700, 1.15, { inner: house(0, 80, 0.4) })}
   ${figure("hana", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("idris", { x: 910, y: 950, s: 1.48 })}`,

  // 5 "Half a century! Five whole decades!" I count on my fingers
  `${eveningRoom()}
   ${figure("amal", { x: 700, y: 950, s: 1.68, arms: "up" })}
   ${figure("hana", { x: 970, y: 950, s: 1.6 })}`,

  // 6 in the photograph, the town has no big road and no clock tower
  `${eveningRoom()}${photoFrame(1150, 690, 1.25, { inner: cityBuildings(0, 80, 0.32) })}
   ${figure("amal", { x: 660, y: 950, s: 1.64, arms: "point" })}`,

  // 7 "Was your school ancient?" Grandma laughs: "It was modern then!"
  `${eveningRoom()}
   ${figure("idris", { x: 660, y: 950, s: 1.56, mood: "surprised" })}
   ${figure("hana", { x: 930, y: 950, s: 1.66, arms: "up" })}`,

  // 8 one day, our photographs will look old too
  `${eveningRoom()}${photoBox(1150, 940, 1.2)}
   ${figure("amal", { x: 680, y: 950, s: 1.66, arms: "point" })}`,

  // 9 "What will the future bring? Flying buses?"
  `${eveningRoom()}${thoughtBubble(1120, 380, 1.5, `${townBus(0, 70, 0.5)}${cloudPuff(-100, 20, 0.4)}`)}
   ${figure("idris", { x: 640, y: 950, s: 1.56, arms: "up" })}
   ${figure("amal", { x: 880, y: 950, s: 1.56 })}`,

  // 10 "A century is a hundred years, and it goes by day by day."
  `${eveningRoom()}${hourClock(1230, 330, 1.5, { hour: 8 })}
   ${figure("hana", { x: 660, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 930, y: 950, s: 1.56 })}`,

  // 11 a new photograph, all of us together, for the family box
  `${homeScene()}
   ${figure("dad", { x: 460, y: 950, s: 1.64, holding: heldCamera })}
   ${figure("hana", { x: 760, y: 950, s: 1.58 })}
   ${figure("amal", { x: 990, y: 950, s: 1.5, arms: "up" })}
   ${figure("idris", { x: 1170, y: 950, s: 1.42, arms: "up" })}
   ${figure("mina", { x: 1310, y: 952, s: 1.18, arms: "up" })}`,

  // 12 somebody in the future will find it - look how young Grandma was!
  `${eveningRoom()}${photoFrame(1180, 700, 1.2, { inner: figure("hana", { x: 0, y: 96, s: 0.55 }) })}
   ${figure("amal", { x: 700, y: 950, s: 1.7, arms: "up" })}`,
];

// ================================================================ Unit 4, book 5
// The Map of Our County — the class draws the bus trip

const countyMapPages = [
  // 1 cover: the big map on the wall, the class in front of it
  `${plainRoomScene()}${mapProp(1150, 690, 1.35)}
   ${figure("yasmin", { x: 460, y: 950, s: 1.62 })}
   ${figure("amal", { x: 720, y: 950, s: 1.68, arms: "up" })}
   ${figure("nora", { x: 960, y: 950, s: 1.54 })}`,

  // 2 the day after the trip, Teacher Yasmin unrolls a big sheet of paper
  `${classroomScene()}${easel(1200, 940, 1.3)}
   ${figure("yasmin", { x: 680, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 960, y: 950, s: 1.54 })}`,

  // 3 "We saw our county from the bus. Now let us draw it."
  `${classroomScene()}${easel(1200, 940, 1.3)}
   ${figure("yasmin", { x: 560, y: 950, s: 1.64, arms: "point" })}
   ${figure("sami", { x: 850, y: 950, s: 1.54 })}
   ${figure("nora", { x: 1040, y: 950, s: 1.5 })}`,

  // 4 Sami draws the hospital, with Doctor Sarah at the door
  `${classroomScene()}${thoughtBubble(1150, 380, 1.5, hospital(0, 90, 0.26))}
   ${figure("sami", { x: 700, y: 950, s: 1.66, holding: heldPaper })}`,

  // 5 Nora draws the court, with its five white columns
  `${classroomScene()}${thoughtBubble(1150, 380, 1.45, courtHouse(0, 96, 0.26))}
   ${figure("nora", { x: 700, y: 950, s: 1.64, holding: heldPaper })}`,

  // 6 Amal draws the market, Omar, the baskets - and the mangoes very carefully
  `${classroomScene()}${thoughtBubble(1150, 380, 1.5, marketStall(0, 96, 0.42))}${desk(400, 950, 1.2, { item: mango(0, 4, 0.7) })}
   ${figure("amal", { x: 760, y: 950, s: 1.66, holding: heldPaper })}`,

  // 7 Adam's college goes next to the market, then the long road
  `${classroomScene()}${thoughtBubble(1150, 380, 1.45, collegeFront(0, 96, 0.24))}
   ${figure("amal", { x: 660, y: 950, s: 1.64, holding: heldPaper })}
   ${figure("nora", { x: 920, y: 950, s: 1.52 })}`,

  // 8 at the edge, Teacher Yasmin writes BORDER, where the sign stands
  `${classroomScene()}${thoughtBubble(1150, 380, 1.4, signPost(0, 130, 0.6, { label: "BORDER" }))}
   ${figure("yasmin", { x: 680, y: 950, s: 1.66, arms: "point" })}`,

  // 9 "Something is missing." Maya draws the school bus, with Nadia driving
  `${classroomScene()}${thoughtBubble(1150, 380, 1.45, townBus(0, 70, 0.5))}
   ${figure("maya", { x: 680, y: 950, s: 1.62, arms: "point" })}
   ${figure("amal", { x: 940, y: 950, s: 1.54, mood: "surprised" })}`,

  // 10 the map goes up on the wall
  `${plainRoomScene()}${mapProp(800, 690, 1.5)}
   ${figure("amal", { x: 420, y: 950, s: 1.62, arms: "up" })}
   ${figure("nora", { x: 1200, y: 950, s: 1.54, arms: "up" })}`,

  // 11 "Now we know our county by heart - and our address too."
  `${plainRoomScene()}${mapProp(1150, 690, 1.3)}
   ${figure("yasmin", { x: 560, y: 950, s: 1.66, arms: "point" })}
   ${figure("sami", { x: 840, y: 950, s: 1.52 })}
   ${figure("maya", { x: 1030, y: 950, s: 1.5 })}`,

  // 12 one day I will visit every place on that map - maybe beyond it
  `${classroomScene()}${globeProp(1220, 940, 1.4)}
   ${figure("amal", { x: 720, y: 950, s: 1.76, arms: "up" })}`,
];

// ================================================================ Unit 4, book 6
// The Storm and the Rainbow — storm, thunder, lightning, rainbow, warm, cloudy

const stormRainbowPages = [
  // 1 cover: the rainbow over the town after the storm
  `${townScene()}${rainbow(1080, 500)}
   ${figure("amal", { x: 620, y: 900, s: 1.74, arms: "up" })}
   ${figure("mina", { x: 860, y: 902, s: 1.28, arms: "up" })}`,

  // 2 a warm morning, but the sky grows cloudy and dark
  `${townScene({ lit: true })}${cloudPuff(420, 220, 1.3, { grey: true })}${cloudPuff(760, 170, 1.5, { grey: true })}${cloudPuff(1120, 240, 1.35, { grey: true })}
   ${figure("mum", { x: 640, y: 900, s: 1.62 })}
   ${figure("amal", { x: 880, y: 900, s: 1.56, mood: "surprised" })}`,

  // 3 "A storm is coming. Everybody inside."
  `${streetScene({ rainy: true })}${rain()}${house(1250, 890, 0.85)}
   ${figure("mum", { x: 640, y: 890, s: 1.62, arms: "point" })}
   ${figure("amal", { x: 880, y: 890, s: 1.54 })}
   ${figure("mina", { x: 1060, y: 892, s: 1.24 })}`,

  // 4 the thunder bangs like a giant drum - Mina holds my hand
  `${eveningRoom()}${wallWindow(1230, 380, 1.15, { inner: rainPane })}
   ${figure("amal", { x: 680, y: 950, s: 1.62 })}
   ${figure("mina", { x: 900, y: 952, s: 1.26, mood: "surprised" })}`,

  // 5 lightning lights the whole room white for a second
  `${eveningRoom()}${wallWindow(1230, 380, 1.15, { inner: boltPane })}
   <rect width="${W}" height="${H}" fill="#f7fbfe" opacity="0.22"/>
   ${figure("amal", { x: 680, y: 950, s: 1.62, mood: "surprised" })}
   ${figure("mina", { x: 900, y: 952, s: 1.26, mood: "surprised" })}`,

  // 6 "Thunder is only a sound. It cannot hurt you."
  `${eveningRoom()}
   ${figure("dad", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("mina", { x: 890, y: 952, s: 1.26 })}
   ${figure("amal", { x: 1070, y: 950, s: 1.54 })}`,

  // 7 watching from the window: the street turns into little rivers
  `${eveningRoom()}${wallWindow(1200, 380, 1.2, { inner: rainPane })}${lookLine(830, 780, 1130, 460)}
   ${figure("amal", { x: 700, y: 950, s: 1.62 })}
   ${figure("idris", { x: 930, y: 950, s: 1.5 })}`,

  // 8 Grandma Hana makes warm tea, and the storm slowly walks away
  `${homeScene()}${roomBox(1250, 640, 1.12, "kitchen")}${cookpot(420, 940, 1.15)}
   ${figure("hana", { x: 720, y: 950, s: 1.64 })}
   ${figure("mina", { x: 970, y: 952, s: 1.24 })}`,

  // 9 the sun comes out - and Mina shouts, "LOOK!"
  `${townScene()}
   ${figure("mina", { x: 760, y: 902, s: 1.32, arms: "point", mood: "surprised" })}
   ${figure("amal", { x: 540, y: 900, s: 1.62 })}`,

  // 10 a rainbow stands over the town, from the market to the school
  `${townScene()}${rainbow(1000, 480)}${marketStall(330, 890, 0.68)}${schoolBell(1350, 640, 0.95)}
   ${figure("amal", { x: 640, y: 900, s: 1.6 })}
   ${figure("mina", { x: 850, y: 902, s: 1.26, arms: "up" })}
   ${figure("mum", { x: 1050, y: 900, s: 1.56 })}`,

  // 11 counting its colours from the doorway, every single one
  `${townScene()}${rainbow(950, 500)}${house(1280, 900, 0.85)}
   ${figure("amal", { x: 640, y: 900, s: 1.62, arms: "point" })}
   ${figure("mina", { x: 860, y: 902, s: 1.26 })}
   ${figure("dad", { x: 1060, y: 900, s: 1.6 })}`,

  // 12 "Every season brings its own sky. This one brought us a rainbow."
  `${sunsetScene()}
   ${figure("hana", { x: 640, y: 900, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 900, y: 900, s: 1.56 })}
   ${figure("mina", { x: 1090, y: 902, s: 1.24 })}`,
];

// ================================================================ Unit 4, book 7
// Beyond the Big Rock — beneath, beyond, within, throughout, via, except

const bigRockPages = [
  // 1 cover: the treasure hunt at the coast, the big rock behind
  `${coastScene()}${bigRock(1200, 930, 1.15)}${shells(660, 945, 0.95)}
   ${figure("yasmin", { x: 460, y: 930, s: 1.6 })}
   ${figure("amal", { x: 720, y: 930, s: 1.7, arms: "up" })}
   ${figure("sami", { x: 950, y: 930, s: 1.54 })}`,

  // 2 on Saturday, Teacher Yasmin takes the class to the coast
  `${coastScene()}
   ${figure("yasmin", { x: 560, y: 930, s: 1.64, arms: "up" })}
   ${figure("amal", { x: 830, y: 930, s: 1.56 })}
   ${figure("nora", { x: 1030, y: 930, s: 1.5 })}
   ${figure("sami", { x: 1210, y: 930, s: 1.52 })}`,

  // 3 "Every clue hides near the big rock. Read them carefully."
  `${coastScene()}${bigRock(1180, 930, 1.2)}
   ${figure("yasmin", { x: 560, y: 930, s: 1.62, arms: "point" })}
   ${figure("amal", { x: 830, y: 930, s: 1.54 })}
   ${figure("nora", { x: 1010, y: 930, s: 1.5, holding: heldPaper })}`,

  // 4 the first clue: LOOK BENEATH THE FLAT STONE
  `${coastScene()}${flatStone(1060, 940, 1.5)}
   ${figure("amal", { x: 700, y: 930, s: 1.66, arms: "point" })}
   ${figure("sami", { x: 940, y: 930, s: 1.54 })}`,

  // 5 beneath the stone: a shell with a number two painted on it
  `${coastScene()}${flatStone(1120, 940, 1.4)}
   ${figure("amal", { x: 760, y: 930, s: 1.66, holding: heldShell })}
   ${figure("nora", { x: 1000, y: 930, s: 1.52, mood: "surprised" })}`,

  // 6 the second clue: WALK BEYOND THE BIG ROCK
  `${coastScene()}${bigRock(1130, 930, 1.3)}
   ${figure("sami", { x: 700, y: 930, s: 1.62, arms: "point" })}
   ${figure("amal", { x: 470, y: 930, s: 1.58, holding: heldPaper })}`,

  // 7 beyond the rock, shells throughout the sand
  `${coastScene()}${shells(1000, 940, 1.3, { count: 14 })}
   ${figure("amal", { x: 600, y: 930, s: 1.64, arms: "up" })}
   ${figure("nora", { x: 840, y: 930, s: 1.54, arms: "up" })}`,

  // 8 "Stay within the flags, and away from the waves."
  `${coastScene()}${coastFlag(480, 930, 1.1)}${coastFlag(1280, 930, 1.1, { colour: G3.gold })}
   ${figure("yasmin", { x: 700, y: 930, s: 1.62, arms: "up" })}
   ${figure("sami", { x: 950, y: 930, s: 1.52 })}`,

  // 9 everyone finds a clue except Sami - so Nora shares hers
  `${coastScene()}
   ${figure("sami", { x: 680, y: 930, s: 1.58, mood: "sad" })}
   ${figure("nora", { x: 930, y: 930, s: 1.56, holding: heldPaper })}`,

  // 10 the last clue leads back via the shore path, to the basket
  `${coastScene()}${basketProp(1250, 930, 1.2, { kind: "fruit" })}
   ${figure("yasmin", { x: 480, y: 930, s: 1.58 })}
   ${figure("amal", { x: 710, y: 930, s: 1.56 })}
   ${figure("nora", { x: 900, y: 930, s: 1.5 })}
   ${figure("sami", { x: 1070, y: 930, s: 1.52 })}`,

  // 11 within the basket: mangoes, and a small book for everyone
  `${coastScene()}${basketProp(1150, 930, 1.25, { kind: "fruit" })}
   ${figure("amal", { x: 640, y: 930, s: 1.62, holding: heldBook })}
   ${figure("sami", { x: 880, y: 930, s: 1.54, holding: heldBook })}`,

  // 12 the best treasure: words that tell you exactly where to look
  `${coastScene()}${bigRock(1230, 930, 1.1)}${shells(750, 948, 0.9)}
   ${figure("amal", { x: 560, y: 930, s: 1.74, arms: "up" })}
   ${figure("nora", { x: 830, y: 930, s: 1.54 })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "second-show": { dir: "the-second-show", pages: secondShowPages },
  "by-myself": { dir: "all-by-myself", pages: byMyselfPages },
  "thank-you": { dir: "the-thank-you-party", pages: thankYouPages },
  "champions-lesson": { dir: "the-champions-lesson", pages: championsLessonPages },
  "class-news": { dir: "the-class-news", pages: classNewsPages },
  "radio": { dir: "grandma-hanas-radio", pages: radioPages },
  "vacation": { dir: "the-first-day-of-vacation", pages: vacationPages },
  "up-sun": { dir: "up-with-the-sun", pages: upWithSunPages },
  "hundred-years": { dir: "a-hundred-years", pages: hundredYearsPages },
  "county-map": { dir: "the-map-of-our-county", pages: countyMapPages },
  "storm-rainbow": { dir: "the-storm-and-the-rainbow", pages: stormRainbowPages },
  "big-rock": { dir: "beyond-the-big-rock", pages: bigRockPages },
};

writeBooks(books, process.argv[2]);
