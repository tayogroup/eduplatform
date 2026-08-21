// Grade 3 additions to the shared picture-book kit: the human cast.
//
// Grade 3 does NOT get a new animal. Its own course content already has a cast —
// Amal, her friend Nora, Teacher Yasmin and Omar the shopkeeper appear 604 times
// across the ten units, and Unit 7 is written as a trip "following Amal, Nora and
// Teacher Yasmin from the coast to the forest and up a mountain trail". A book
// shelf starring anybody else would contradict the lessons beside it.
//
// How they look is not invented here either. The course's own artwork decides it:
// english/assets/unit-8-home.png shows East African children with natural hair —
// afro puffs, buns — in bright everyday clothes and no headscarf, and
// english/assets/teacher-nuur.png shows the adult teacher in a hijab, cardigan
// and long skirt. The readings themselves describe almost nothing (only "Grandma
// Hana sat in the corner with her reading glasses"), so the pictures are the
// source of truth for everything else.
//
// Same additive rule as Grade 2: nothing in ehel-ebook-kit.js or
// ehel-ebook-kit-grade2.js is modified, so Grade 1 and Grade 2 art cannot move.
// Motion reuses the existing animation classes only — a new @keyframes in STYLE
// would rewrite every SVG of every book for a change nobody can see.
//
// Figures carry BOTH `data-figure` and `data-tap`. data-figure is the identity the
// composition lint measures; data-tap is the promise that a clip exists. They were
// separated while the human cast had no voice clips — measuring a character must
// not depend on whether anybody has paid for its audio — and rejoined on
// 2026-08-20 when the nine child/woman/man cues were recorded. Resolution is
// TAP_VOICE_GROUPS in english.js: several characters share one voice, moods intact.

const kit2 = require("./ehel-ebook-kit-grade2.js");

const { C, W, H, delayAt, face, mouth, sky, sun, hills, ground, acacia, tallGrass, G2 } = kit2;

// ---------------------------------------------------------------- palette

const G3 = {
  // Skin tones, taken from the course artwork rather than chosen freely.
  skinDeep: "#6b4526", skin: "#8a5a37", skinWarm: "#a3713f", skinLight: "#b98551",
  hair: "#241a14", hairSoft: "#33251b",
  // The course's clothing palette: bright, saturated, a lot of teal and coral.
  teal: "#2f8f86", tealDark: "#226b64", coral: "#e8705c", coralDark: "#c2543f",
  gold: "#f0b429", plum: "#8f6bb5", leafy: "#6f9a4a", sky: "#4f86c6", cream: "#f3ecdd",
  wall: "#e6d7bd", wallCool: "#dbe4ea",
  stone: "#b9b0a6", stoneDark: "#8f8a80",
  sea: "#3f8fae", seaLight: "#7fc2d6", sand: "#e8d5a8",
  forest: "#3f6b3a", forestDark: "#2c4d29", mountain: "#7d8ba0", mountainDark: "#5d6a7d", snow: "#f2f5f8",
};

// ---------------------------------------------------------------- the figure
//
// One parametric person, so the whole cast shares proportions and a change to
// the way a hand or a sandal is drawn reaches everybody. Feet sit on y; the
// figure is drawn upward from there. Local height is about 200 units for a
// child and 250 for an adult, so a page scale of ~1.3 puts a child at roughly
// the same height on the page as Kiki in the Grade 1 books.

function hairShape(style, colour) {
  const styles = {
    // Two afro puffs, the style the course art gives the girls.
    puffs: `<circle cx="-30" cy="-24" r="17" fill="${colour}"/><circle cx="30" cy="-24" r="17" fill="${colour}"/>
      <path d="M -30 -6 a 30 30 0 0 1 60 0 q -30 -16 -60 0 z" fill="${colour}"/>
      <path d="M -30 -4 a 31 31 0 0 1 60 0 l 0 -8 a 30 30 0 0 0 -60 0 z" fill="${colour}"/>`,
    // A high bun.
    bun: `<circle cx="0" cy="-38" r="16" fill="${colour}"/>
      <path d="M -30 -4 a 30 30 0 0 1 60 0 q -30 -18 -60 0 z" fill="${colour}"/>
      <path d="M -31 0 a 31 31 0 0 1 62 0 l 0 -10 a 31 31 0 0 0 -62 0 z" fill="${colour}"/>`,
    // Braided twists falling to the shoulders.
    braids: `<path d="M -31 0 a 31 31 0 0 1 62 0 l 0 -12 a 31 31 0 0 0 -62 0 z" fill="${colour}"/>
      <path d="M -30 -8 q -14 26 -10 54 l 16 2 q -6 -30 2 -52 z" fill="${colour}"/>
      <path d="M 30 -8 q 14 26 10 54 l -16 2 q 6 -30 -2 -52 z" fill="${colour}"/>
      ${[-34, -22, 22, 34].map((bx) => `<circle cx="${bx}" cy="${bx < 0 ? 46 : 46}" r="5" fill="${G3.gold}"/>`).join("")}`,
    // Short cropped hair, the boys and the men.
    crop: `<path d="M -30 -2 a 30 30 0 0 1 60 0 l 0 -10 a 30 30 0 0 0 -60 0 z" fill="${colour}"/>
      <path d="M -29 -8 a 29 29 0 0 1 58 0 q -29 -20 -58 0 z" fill="${colour}"/>`,
  };
  return styles[style] || styles.crop;
}

// A hijab: covers the hair and falls over the shoulders. Drawn as one piece
// behind the face so the face reads first, the way the course artwork does it.
function hijab(colour, shade) {
  // Narrow drape, ending at the upper chest. The first version fell to the waist
  // at nearly twice the head's width and read as a balloon with a face on it —
  // the reference art keeps the scarf close to the head and lets the cardigan
  // and top show underneath.
  return `<path d="M -38 48 q -14 -54 -6 -86 a 36 36 0 0 1 88 0 q 8 32 -6 86 q -38 12 -76 0 z" fill="${shade}"/>
    <path d="M -34 -4 a 34 34 0 0 1 68 0 q -4 -46 -34 -46 q -30 0 -34 46 z" fill="${colour}"/>
    <path d="M -36 26 q -8 -34 2 -56 q -12 30 -8 58 z" fill="${colour}" opacity="0.55"/>
    <path d="M -34 -4 a 34 34 0 0 1 68 0 l 0 9 q -34 -21 -68 0 z" fill="${colour}"/>`;
}

// A peaked cap, for the working adults who wear one — the bus driver and the
// road officer of the Unit 4 readings. Drawn over the hair rather than instead
// of it, so a character keeps their own head under it.
//
// It is an OPTION with a null default, not a new shape: every page written
// before it exists passes no `cap`, renders no cap, and its file does not move.
function capShape(colour, band) {
  // Sits ON the head, not over the eyes. The first version put the band at the
  // eye line and the peak across the face: the officer and the bus driver both
  // rendered with a yellow bar where their eyes are, which reads as a blindfold
  // rather than as a uniform cap.
  return `<path d="M -31 -20 a 31 34 0 0 1 62 0 z" fill="${colour}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -33 -21 h 66 v 11 h -66 z" fill="${band || colour}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M 5 -19 q 34 2 41 11 q -20 7 -43 2 z" fill="${band || colour}" stroke="${C.ink}" stroke-width="3"/>`;
}

function person({
  x, y, s = 1, flip = false, mood = "happy",
  skin = G3.skin, hair = G3.hair, style = "crop",
  top = G3.teal, bottom = G3.coral, legs = "trousers",
  scarf = null, glasses = false, adult = false, coat = null, apron = null, cap = null,
  arms = "down", holding = null, name = "",
} = {}) {
  const scale = s * (adult ? 1.26 : 1);
  const up = arms === "up";
  const point = arms === "point";
  const skinShade = skin === G3.skinDeep ? "#5a3820" : skin === G3.skinWarm ? "#8a5a37" : "#6f4629";

  // Shoes are drawn AFTER the legs (see the body below), so they read as feet
  // rather than as a shadow under a stump. Drawn before, the leg rect covered
  // all but ~6 units of the shoe, and whether that sliver was visible at all
  // came down to the trouser colour: Sami's #6b5a44 and Omar's #6b5a44 against
  // shoe #4a3a2c on an attic floor of #7d6a54 left three browns inside 40 points
  // of each other, and their legs ended in nothing. Wider than the 24-unit leg,
  // and outlined like every other part of the figure, so the foot reads on any
  // trouser colour and any floor.
  const shoe = (sx) => `<path d="M ${sx - 15} -4 q 0 -13 15 -13 q 15 0 15 13 q 0 7 -15 7 q -15 0 -15 -7 z" fill="#4a3a2c" stroke="${C.ink}" stroke-width="3"/>`;
  const leg = (lx) => (legs === "skirt"
    ? `<rect x="${lx - 9}" y="-56" width="18" height="52" rx="8" fill="${skin}"/>`
    : `<rect x="${lx - 12}" y="-62" width="24" height="58" rx="9" fill="${bottom}" stroke="${C.ink}" stroke-width="3.4"/>`);

  const arm = (ax, rot, len) => `<g transform="translate(${ax} -122) rotate(${rot})">
    <rect x="-9" y="0" width="18" height="${len}" rx="9" fill="${coat || top}" stroke="${C.ink}" stroke-width="3.4"/>
    <circle cx="0" cy="${len + 7}" r="10" fill="${skin}" stroke="${C.ink}" stroke-width="3"/>
  </g>`;

  const skirt = legs === "skirt"
    ? `<path d="M -50 -50 q 50 -18 100 0 l -18 -50 q -32 -10 -64 0 z" fill="${bottom}" stroke="${C.ink}" stroke-width="3.6"/>
       ${[-28, 0, 28].map((px) => `<circle cx="${px}" cy="-70" r="6" fill="${G3.cream}" opacity="0.8"/>`).join("")}`
    : "";
  const longSkirt = legs === "long"
    ? `<path d="M -38 -4 q 38 -14 76 0 l 12 -100 q -50 -16 -100 0 z" fill="${bottom}" stroke="${C.ink}" stroke-width="3.6"/>`
    : "";

  const head = `<g transform="translate(0 -156)">
    ${scarf ? hijab(scarf.colour, scarf.shade) : ""}
    <circle cx="0" cy="0" r="30" fill="${skin}" stroke="${C.ink}" stroke-width="3.6"/>
    ${scarf ? "" : hairShape(style, hair)}${cap ? capShape(cap.colour, cap.band) : ""}
    <path d="M -30 2 a 30 30 0 0 0 60 0" fill="none"/>
    <g transform="translate(-12 -2)">${face(mood, 0.78)}</g>
    <g transform="translate(12 -2)">${face(mood, 0.78)}</g>
    <path d="M -20 -12 q 8 -6 15 -2 M 20 -12 q -8 -6 -15 -2" stroke="${skinShade}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <g transform="translate(0 14)">${mouth(mood, 0.8)}</g>
    <ellipse cx="-22" cy="6" rx="5" ry="4" fill="${G3.coral}" opacity="0.30"/>
    <ellipse cx="22" cy="6" rx="5" ry="4" fill="${G3.coral}" opacity="0.30"/>
    ${glasses ? `<g fill="none" stroke="${C.ink}" stroke-width="3"><circle cx="-12" cy="-2" r="13"/><circle cx="12" cy="-2" r="13"/><path d="M -1 -2 h 2"/><path d="M -25 -4 l -8 -3 M 25 -4 l 8 -3"/></g>` : ""}
  </g>`;

  return `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">
    <ellipse cx="0" cy="2" rx="52" ry="12" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-figure="${name}" data-tap="${name}" data-mood="${mood}">
    <g class="anim-idle" style="${delayAt(x, y, 2.2)}">
    ${leg(-19)}${leg(19)}
    ${shoe(-19)}${shoe(19)}
    ${longSkirt}
    <path d="M -34 -60 q 34 -12 68 0 l -4 -74 q -30 -10 -60 0 z" fill="${top}" stroke="${C.ink}" stroke-width="3.6"/>
    ${skirt}
    ${coat ? `<path d="M -33 -60 l -5 -72 l 15 -2 l 6 72 z M 33 -60 l 5 -72 l -15 -2 l -6 72 z" fill="${coat}" stroke="${C.ink}" stroke-width="3"/>` : ""}
    ${apron ? `<path d="M -26 -58 q 26 -10 52 0 l -2 -56 q -24 -8 -48 0 z" fill="${apron}" stroke="${C.ink}" stroke-width="3.2"/><path d="M -20 -114 q 20 8 40 0" stroke="${C.ink}" stroke-width="3"/>` : ""}
    ${up ? `${arm(-32, 152, 54)}${arm(32, -152, 54)}` : point ? `${arm(-32, 16, 50)}${arm(32, -104, 54)}` : `${arm(-32, 14, 50)}${arm(32, -14, 50)}`}
    ${holding ? `<g transform="translate(0 -76)">${holding}</g>` : ""}
    ${head}
    </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- the cast
//
// One preset each, so a character cannot drift between pages: every page draws
// Amal from this definition rather than from remembered arguments.

const CAST = {
  amal: { skin: G3.skin, hair: G3.hair, style: "puffs", top: G3.gold, bottom: G3.teal, legs: "skirt" },
  nora: { skin: G3.skinDeep, hair: G3.hair, style: "braids", top: G3.plum, bottom: G3.coral, legs: "skirt" },
  mina: { skin: G3.skinWarm, hair: G3.hair, style: "puffs", top: G3.leafy, bottom: G3.gold, legs: "skirt" },
  adam: { skin: G3.skin, hair: G3.hair, style: "crop", top: G3.coral, bottom: G3.sky, legs: "trousers" },
  idris: { skin: G3.skinWarm, hair: G3.hair, style: "crop", top: G3.sky, bottom: G3.leafy, legs: "trousers" },
  noah: { skin: G3.skinDeep, hair: G3.hair, style: "crop", top: G3.leafy, bottom: G3.tealDark, legs: "trousers" },
  yasmin: { adult: true, skin: G3.skin, style: "bun", top: G3.cream, bottom: G3.teal, legs: "long", coat: G3.coral, scarf: { colour: G3.teal, shade: G3.tealDark } },
  mum: { adult: true, skin: G3.skin, style: "bun", top: G3.cream, bottom: G3.plum, legs: "long", scarf: { colour: G3.plum, shade: "#6f5292" } },
  dad: { adult: true, skin: G3.skinDeep, hair: G3.hair, style: "crop", top: G3.sky, bottom: "#3d4a5c", legs: "trousers" },
  hana: { adult: true, skin: G3.skinWarm, style: "bun", top: G3.cream, bottom: "#9a8f7a", legs: "long", scarf: { colour: "#c9bda8", shade: "#a89c86" }, glasses: true },
  omar: { adult: true, skin: G3.skin, hair: G3.hair, style: "crop", top: G3.gold, bottom: "#6b5a44", legs: "trousers", apron: "#8a9a5b" },
  // The rest of the class, and the three working adults of the Unit 4 trip.
  // Added for the second, third and fourth book of each unit: Sami is named 137
  // times across the Grade 3 readings and Leo 55, so a shelf without them would
  // be telling the unit's story with the wrong children in it.
  //
  // maya and sami are copied EXACTLY from CAST4 in ehel-ebook-kit-grade4.js,
  // which spreads this object and then redefines them. Same values means Grade
  // 4's pages cannot move — and the same child looks the same in both years,
  // which is the point of a preset. Change one, change both.
  maya: { skin: G3.skinWarm, hair: G3.hair, style: "bun", top: G3.cream, bottom: "#3d4a5c", legs: "trousers", coat: G3.coralDark },
  sami: { skin: G3.skinDeep, hair: G3.hair, style: "crop", top: "#4d9d94", bottom: "#6b5a44", legs: "trousers" },
  leo: { skin: G3.skinLight, hair: G3.hairSoft, style: "crop", top: G3.plum, bottom: "#4a5b6b", legs: "trousers" },
  daniel: { skin: G3.skinWarm, hair: G3.hair, style: "crop", top: G3.gold, bottom: G3.tealDark, legs: "trousers" },
  theo: { skin: G3.skin, hair: G3.hair, style: "crop", top: G3.leafy, bottom: "#5c4a3a", legs: "trousers" },
  // Nadia drives the school bus, Doctor Sarah meets the class at the hospital
  // and Officer Rami at the court — all three by name, in the Unit 4 story.
  nadia: { adult: true, skin: G3.skinWarm, style: "bun", top: "#4a5b6b", bottom: "#3d4a5c", legs: "trousers", cap: { colour: "#3d4a5c", band: "#2b3541" } },
  sarah: { adult: true, skin: G3.skinDeep, style: "bun", top: G3.teal, bottom: "#5f6b7a", legs: "long", coat: "#f2f5f8" },
  rami: { adult: true, skin: G3.skin, hair: G3.hair, style: "crop", top: "#4f86c6", bottom: "#3d4a5c", legs: "trousers", cap: { colour: "#3d4a5c" } },
};

// figure("amal", { x, y, s, mood, arms, ... }) — the preset, with per-page overrides.
function figure(who, options = {}) {
  const preset = CAST[who];
  if (!preset) throw new Error(`Unknown Grade 3 character "${who}". Known: ${Object.keys(CAST).join(", ")}`);
  return person({ ...preset, ...options, name: who });
}

// ---------------------------------------------------------------- things people hold

const heldBook = `<g transform="translate(0 6) rotate(-6)"><rect x="-30" y="-22" width="60" height="44" rx="4" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.4"/><path d="M 0 -22 v 44" stroke="#c9bda8" stroke-width="3"/><path d="M -22 -10 h 16 M -22 0 h 16 M 6 -10 h 16 M 6 0 h 16" stroke="#9fb4c6" stroke-width="2.6"/></g>`;
const heldPaper = `<g transform="translate(0 8) rotate(5)"><rect x="-24" y="-30" width="48" height="60" rx="3" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.2"/><path d="M -14 -16 h 28 M -14 -4 h 28 M -14 8 h 20" stroke="#9fb4c6" stroke-width="3"/></g>`;
const heldShell = `<g transform="translate(0 10)"><path d="M 0 14 q -22 -6 -22 -22 q 0 -14 22 -14 q 22 0 22 14 q 0 16 -22 22 z" fill="#f0d8c0" stroke="${C.ink}" stroke-width="3"/><path d="M 0 14 q -6 -22 -2 -36 M 0 14 q 6 -22 10 -34 M 0 14 q -14 -18 -16 -28" stroke="#d0a98c" stroke-width="2.6" fill="none"/></g>`;

// ---------------------------------------------------------------- Grade 3 scenes

// The classroom Amal and Nora sit in: a wall, a board, a window and a floor.
function classroomScene({ boardText = "lines" } = {}) {
  // The floor line sits high and the furniture is big, so the people in the room
  // read as being IN it. The first version put the floor at 740 with a small
  // board near the ceiling, and every classroom page was two thirds empty wall
  // above a row of small figures.
  const marks = boardText === "sums"
    ? `<path d="M -186 -34 h 74 M -150 -72 v 74 M -74 -34 h 74 M -24 -60 l 50 50 M 26 -60 l -50 50" stroke="${G3.cream}" stroke-width="9" stroke-linecap="round"/>`
    : `<path d="M -210 -56 h 310 M -210 -18 h 372 M -210 20 h 236" stroke="${G3.cream}" stroke-width="9" stroke-linecap="round" opacity="0.9"/>`;
  return `<rect width="${W}" height="${H}" fill="${G3.wall}"/>
    <rect x="0" y="0" width="${W}" height="20" fill="#d3c3a4"/>
    <rect x="0" y="660" width="${W}" height="${H - 660}" fill="#c9a06c"/>
    <rect x="0" y="642" width="${W}" height="30" fill="#a8845a"/>
    ${[0, 220, 440, 660, 880, 1100, 1320, 1540].map((fx) => `<path d="M ${fx} 672 L ${fx - 120} 1000" stroke="#b08758" stroke-width="5" opacity="0.5"/>`).join("")}
    <g transform="translate(400 380)"><rect x="-260" y="-160" width="520" height="320" rx="12" fill="#2f5248" stroke="#8a6242" stroke-width="17"/>${marks}</g>
    <g transform="translate(1290 350)">
      <rect x="-180" y="-150" width="360" height="300" rx="10" fill="${G2.glass}" stroke="#8a6242" stroke-width="15"/>
      <path d="M 0 -150 v 300 M -180 0 h 360" stroke="#8a6242" stroke-width="11"/>
      <ellipse cx="-86" cy="-76" rx="62" ry="30" fill="#f7fbfe" opacity="0.9"/>
      <ellipse cx="80" cy="74" rx="74" ry="36" fill="${C.acaciaLeaf}" opacity="0.55"/>
    </g>`;
}

// The same room with a clear wall: no board, no window. For pages whose whole
// point is something ON the wall — the nine doors of the capstone collided with
// the chalkboard and the window when they were drawn over the normal classroom.
function plainRoomScene({ wall = G3.wall } = {}) {
  return `<rect width="${W}" height="${H}" fill="${wall}"/>
    <rect x="0" y="0" width="${W}" height="20" fill="#d3c3a4"/>
    <rect x="0" y="660" width="${W}" height="${H - 660}" fill="#c9a06c"/>
    <rect x="0" y="642" width="${W}" height="30" fill="#a8845a"/>
    ${[0, 220, 440, 660, 880, 1100, 1320, 1540].map((fx) => `<path d="M ${fx} 672 L ${fx - 120} 1000" stroke="#b08758" stroke-width="5" opacity="0.5"/>`).join("")}`;
}

// A schoolyard / street in town: sky, low buildings, swept ground.
function townScene({ lit = false } = {}) {
  return `${sky()}${lit ? "" : sun(250, 160)}${hills()}
    <rect x="0" y="590" width="${W}" height="${H - 590}" fill="${C.grassFar}"/>
    <path d="M 0 706 q 400 -30 800 0 q 400 30 800 0 L 1600 1000 L 0 1000 Z" fill="#cfc3ab"/>
    <path d="M 0 706 q 400 -30 800 0 q 400 30 800 0" stroke="#e2d9c6" stroke-width="11" fill="none"/>`;
}

// The coast: sea to the horizon, a band of sand, and the shore line between.
function coastScene() {
  return `${sky()}${sun(1330, 150)}
    <rect x="0" y="470" width="${W}" height="220" fill="${G3.sea}"/>
    <path d="M 0 470 h ${W}" stroke="${G3.seaLight}" stroke-width="8"/>
    ${[520, 570, 620].map((wy, i) => `<path class="anim-flow" d="M 0 ${wy} h ${W}" stroke="${G3.seaLight}" stroke-width="${7 - i}" opacity="${0.6 - i * 0.12}" stroke-dasharray="${70 + i * 30} ${50 + i * 20}"/>`).join("")}
    <path d="M 0 690 q 400 -40 800 -8 q 400 32 800 -6 L 1600 1000 L 0 1000 Z" fill="${G3.sand}"/>
    <path d="M 0 690 q 400 -40 800 -8 q 400 32 800 -6" stroke="#f4e8cd" stroke-width="12" fill="none"/>`;
}

// The forest trail: layered trees and a soft leaf floor.
function forestScene() {
  const tree = (tx, ts, dark) => `<g transform="translate(${tx} 720) scale(${ts})">
    <path d="M -16 0 q -6 -120 4 -190" stroke="#6b4a30" stroke-width="30" fill="none" stroke-linecap="round"/>
    <g class="anim-canopy" style="${delayAt(tx, 700, 6)}">
      <ellipse cx="-40" cy="-220" rx="86" ry="70" fill="${dark ? G3.forestDark : G3.forest}"/>
      <ellipse cx="46" cy="-262" rx="96" ry="78" fill="${dark ? G3.forest : "#4e7f45"}"/>
      <ellipse cx="10" cy="-320" rx="70" ry="56" fill="${dark ? G3.forestDark : G3.forest}"/>
    </g>
  </g>`;
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0f4"/><stop offset="1" stop-color="#e6f2e2"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    ${tree(120, 1.05, true)}${tree(430, 0.86, false)}${tree(1180, 0.94, false)}${tree(1490, 1.1, true)}
    <rect x="0" y="700" width="${W}" height="${H - 700}" fill="#7a8f5c"/>
    <path d="M 0 780 q 400 -46 800 0 q 400 46 800 0 L 1600 1000 L 0 1000 Z" fill="#8fa06a"/>
    <path d="M 500 1000 q 120 -170 300 -230 q 180 -60 300 -70" stroke="#c9b98f" stroke-width="70" fill="none" stroke-linecap="round" opacity="0.85"/>`;
}

// The mountain trail: ridges stacked back to a snow cap.
function mountainScene() {
  return `${sky()}${sun(300, 150)}
    <path d="M 0 700 L 380 300 L 640 700 Z" fill="${G3.mountainDark}"/>
    <path d="M 380 300 L 452 410 q -72 40 -144 0 z" fill="${G3.snow}"/>
    <path d="M 420 700 L 900 210 L 1400 700 Z" fill="${G3.mountain}"/>
    <path d="M 900 210 L 996 356 q -96 50 -192 0 z" fill="${G3.snow}"/>
    <path d="M 1080 700 L 1420 360 L 1600 700 Z" fill="${G3.mountainDark}"/>
    <rect x="0" y="690" width="${W}" height="${H - 690}" fill="#9aa37f"/>
    <path d="M 0 790 q 400 -50 800 0 q 400 50 800 0 L 1600 1000 L 0 1000 Z" fill="#b0b78c"/>
    <path d="M 300 1000 q 200 -180 420 -240 q 220 -60 420 -30" stroke="#cfc3ab" stroke-width="62" fill="none" stroke-linecap="round" opacity="0.9"/>`;
}

// ---------------------------------------------------------------- Grade 3 props

// A low garden wall — the one behind the garden in Unit 5.
function gardenWall(x, y, s = 1, { length = 520 } = {}) {
  let bricks = "";
  for (let row = 0; row < 4; row += 1) {
    for (let bx = -length / 2; bx < length / 2; bx += 90) {
      const offset = row % 2 ? 45 : 0;
      bricks += `<rect x="${bx + offset}" y="${-40 - row * 38}" width="84" height="32" rx="4" fill="${row % 2 ? "#c98f6a" : "#bd8460"}" stroke="#9c6a4c" stroke-width="3"/>`;
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <clipPath id="wallclip${Math.round(x)}"><rect x="${-length / 2}" y="-196" width="${length}" height="196"/></clipPath>
    <rect x="${-length / 2}" y="-196" width="${length}" height="196" fill="#bd8460"/>
    <g clip-path="url(#wallclip${Math.round(x)})">${bricks}</g>
    <rect x="${-length / 2 - 12}" y="-212" width="${length + 24}" height="20" rx="6" fill="#a8724f" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="${-length / 2}" y="-196" width="${length}" height="196" fill="none" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// The Box of Ideas from Unit 9: a bright box with folded slips going in.
function boxOfIdeas(x, y, s = 1, { open = true } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -86 0 l 10 -104 h 152 l 10 104 z" fill="${G3.coral}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -76 -104 h 152 l 6 -18 h -164 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -60 -56 h 120" stroke="${G3.gold}" stroke-width="9"/>
    <path d="M -18 -70 h 36 v 28 h -36 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3.4"/>
    ${open ? `<path d="M -44 -126 h 88 v 10 h -88 z" fill="#4a3a2c"/>
      <g class="anim-drip" style="animation-delay:0.1s"><rect x="-22" y="-176" width="44" height="34" rx="3" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3" transform="rotate(-8 0 -160)"/></g>
      <g class="anim-drip" style="animation-delay:0.7s"><rect x="26" y="-206" width="40" height="30" rx="3" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3" transform="rotate(12 46 -190)"/></g>` : ""}
  </g>`;
}

// A school desk with a book on it.
function desk(x, y, s = 1, { item = "" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-118" y="-104" width="236" height="20" rx="7" fill="#c9a06c" stroke="${C.ink}" stroke-width="4.5"/>
    <rect x="-104" y="-84" width="208" height="52" rx="5" fill="#b08758" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-104" y="-32" width="18" height="32" fill="#a8845a" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="86" y="-32" width="18" height="32" fill="#a8845a" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -70 -58 h 140" stroke="#8a6242" stroke-width="4"/>
    <g transform="translate(0 -96)">${item}</g>
  </g>`;
}

// A globe on a stand, for the classroom and the nature unit.
function globeProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -34 0 q 34 -14 68 0 z" fill="#8a6242" stroke="${C.ink}" stroke-width="3.4"/>
    <rect x="-6" y="-40" width="12" height="42" fill="#8a6242"/>
    <circle cx="0" cy="-84" r="46" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -30 -108 q 22 12 46 -4 q 16 20 4 40 q -30 10 -50 -6 q -8 -18 0 -30 z" fill="${G3.leafy}"/>
    <path d="M 14 -60 q 16 -8 24 -22 q 4 18 -8 30 z" fill="${G3.leafy}"/>
    <ellipse cx="0" cy="-84" rx="46" ry="16" fill="none" stroke="#7fa8d9" stroke-width="2.6" opacity="0.8"/>
    <path d="M -50 -84 a 50 50 0 0 1 100 0" fill="none" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// A scatter of shells on the sand — Unit 8's million shells.
function shells(x, y, s = 1, { count = 9 } = {}) {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const sx = -220 + ((i * 71) % 460);
    const sy = ((i * 37) % 60) - 20;
    const sc = 0.6 + ((i % 3) * 0.2);
    out += `<g transform="translate(${sx} ${sy}) scale(${sc}) rotate(${(i * 47) % 60 - 30})">
      <path d="M 0 12 q -20 -6 -20 -20 q 0 -13 20 -13 q 20 0 20 13 q 0 14 -20 20 z" fill="${i % 2 ? "#f0d8c0" : "#e8c6a8"}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M 0 12 q -5 -20 -2 -32 M 0 12 q 5 -20 8 -30" stroke="#d0a98c" stroke-width="2.4" fill="none"/>
    </g>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${out}</g>`;
}

// A hospital front, for the community unit.
function hospital(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-210" y="-300" width="420" height="300" rx="8" fill="#eef2f5" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-230" y="-340" width="460" height="42" rx="8" fill="${G3.teal}" stroke="${C.ink}" stroke-width="4.5"/>
    <g transform="translate(0 -319)"><rect x="-13" y="-15" width="26" height="30" rx="4" fill="${G3.cream}"/><rect x="-24" y="-4" width="48" height="10" rx="4" fill="${G3.cream}"/></g>
    ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${-176 + c * 96}" y="${-266 + r * 78}" width="66" height="56" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`).join("")).join("")}
    <rect x="-60" y="-118" width="120" height="118" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 0 -118 v 118" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -84 -118 h 168 l -14 -26 h -140 z" fill="${G3.teal}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// A wall calendar showing a run of months — Unit 3's calendar on the wall.
// Twelve month cards on the classroom wall.
//
// `columns` exists because the six-across default is 700 units wide, and the
// classroom's free wall — between the blackboard's right edge at ~668 and the
// window's left at ~1102 — is 434. Every page that called this laid the cards
// straight across the blackboard's writing and into the window frame; seven
// pages shipped that way. Four across, three down is both a calendar's natural
// shape and narrow enough to fit the gap.
//
// The grid is centred on (x, y) for any column count. The old six-across form
// centred horizontally but not vertically (rows at -150 and -10, so the block
// sat 80 units high of its anchor), which is why the call sites all carried a
// y that looked low for where the cards landed.
function monthWall(x, y, s = 1, { highlight = 0, columns = 6 } = {}) {
  const rows = Math.ceil(12 / columns);
  let sheets = "";
  for (let i = 0; i < 12; i += 1) {
    const cx = -((columns - 1) * 120) / 2 + (i % columns) * 120;
    const cy = -((rows - 1) * 140) / 2 + Math.floor(i / columns) * 140;
    sheets += `<g transform="translate(${cx} ${cy})">
      <rect x="-50" y="-56" width="100" height="112" rx="6" fill="${i === highlight ? "#fbe3df" : G3.cream}" stroke="${C.ink}" stroke-width="3.4"/>
      <rect x="-50" y="-56" width="100" height="26" rx="6" fill="${C.rainbow[i % C.rainbow.length]}"/>
      ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${-38 + c * 22}" y="${-18 + r * 22}" width="14" height="14" rx="3" fill="#dfe6ea"/>`).join("")).join("")}
      ${i === highlight ? `<ellipse cx="0" cy="8" rx="42" ry="34" fill="none" stroke="${G3.coral}" stroke-width="5"/>` : ""}
    </g>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${sheets}</g>`;
}

// A hand-lettered poster/report on the wall, for showcase and report pages.
function poster(x, y, s = 1, { colour = G3.gold, lines = 4 } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-100" y="-130" width="200" height="260" rx="6" fill="${G3.cream}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-100" y="-130" width="200" height="46" rx="6" fill="${colour}"/>
    ${Array.from({ length: lines }, (unused, i) => `<path d="M -76 ${-46 + i * 34} h ${152 - (i % 2) * 40}" stroke="#9fb4c6" stroke-width="7" stroke-linecap="round"/>`).join("")}
    <circle cx="0" cy="-140" r="9" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3"/>
  </g>`;
}

// ------------------------------------------------- props for books 2, 3 and 4
//
// Everything below was added for the three extra books per unit. It is ADDITIVE
// only: no existing shape is touched, so the ten first books regenerate byte for
// byte. Motion reuses the animation classes already in STYLE — a new @keyframes
// would rewrite every SVG of every book on the shelf for a change nobody can
// see.

// A round wall clock reading a whole hour. Unit 3 is told in o'clocks — six,
// seven, eight, one, four — and a clock that cannot show one is no use there.
function hourClock(x, y, s = 1, { hour = 6 } = {}) {
  const angle = (hour % 12) * 30;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="0" cy="0" r="62" fill="${G3.cream}" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="0" cy="0" r="52" fill="none" stroke="#c9bda8" stroke-width="3"/>
    ${Array.from({ length: 12 }, (unused, i) => {
    const a = (i * 30 * Math.PI) / 180;
    return `<circle cx="${Math.round(Math.sin(a) * 44)}" cy="${Math.round(-Math.cos(a) * 44)}" r="${i % 3 ? 3 : 5}" fill="${C.ink}"/>`;
  }).join("")}
    <g transform="rotate(${angle})"><path d="M 0 6 v -34" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/></g>
    <path d="M 0 6 v -46" stroke="${G3.coral}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="7" fill="${C.ink}"/>
  </g>`;
}

// A microphone on a short stand — the class interview corner in Unit 1.
function microphone(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="46" ry="12" fill="#5f6b7a" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-7" y="-104" width="14" height="106" fill="#7d8ba0" stroke="${C.ink}" stroke-width="3.6"/>
    <g class="anim-idle" style="${delayAt(x, y, 3)}">
      <rect x="-24" y="-166" width="48" height="66" rx="24" fill="#4a5560" stroke="${C.ink}" stroke-width="4"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M -18 ${-152 + i * 14} h 36" stroke="#8f9aa8" stroke-width="3.4"/>`).join("")}
    </g>
  </g>`;
}

// A stage: two drawn-back curtains and a valance. The Unit 1 drama club rehearses
// under it, and the Unit 10 showcase presents under it.
function stageCurtain(x, y, s = 1, { span = 1000 } = {}) {
  const half = span / 2;
  const drape = (dx, dir) => `<g transform="translate(${dx} 0)">
    <path d="M 0 0 q ${dir * 34} 220 ${dir * 8} 520 l ${dir * -120} 0 q ${dir * -24} -300 ${dir * 4} -520 z" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2].map((i) => `<path d="M ${dir * (-20 - i * 30)} 20 q ${dir * -12} 250 ${dir * 2} 480" stroke="${G3.coral}" stroke-width="6" fill="none" opacity="0.7"/>`).join("")}
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="${-half}" y="-40" width="${span}" height="46" rx="10" fill="${G3.coralDark}" stroke="${C.ink}" stroke-width="5"/>
    ${Array.from({ length: Math.round(span / 70) }, (unused, i) => `<path d="M ${-half + 20 + i * 70} 6 q 18 34 36 0" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3.4"/>`).join("")}
    ${drape(-half + 40, -1)}${drape(half - 40, 1)}
  </g>`;
}

// A market basket. Unit 4 meets at the gate "with a basket for carrying the
// rice"; Unit 5 has Omar's basket that is heavier than he expected.
function basketProp(x, y, s = 1, { kind = "fruit" } = {}) {
  const fill = {
    fruit: `<circle cx="-26" cy="-64" r="20" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="8" cy="-70" r="22" fill="${G3.coral}" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="38" cy="-60" r="18" fill="${G3.leafy}" stroke="${C.ink}" stroke-width="3.4"/>`,
    // The heap has to clear the rim at -58, or a full basket renders as an empty
    // one: the first version rose 15 units above the rim and was invisible at
    // page scale.
    grain: `<path d="M -46 -54 q 46 -66 92 0 z" fill="#e0cfa4" stroke="${C.ink}" stroke-width="3.4"/>
      <path d="M -22 -74 h 10 M 2 -84 h 10 M 24 -72 h 10" stroke="#c2ab78" stroke-width="3.4"/>`,
    empty: "",
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${fill[kind] || ""}
    <path d="M -52 -58 h 104 l -12 58 h -80 z" fill="#c99a5c" stroke="${C.ink}" stroke-width="4.5"/>
    ${[0, 1, 2].map((i) => `<path d="M ${-46 + i * 32} -56 l -4 54" stroke="#a8763f" stroke-width="4"/>`).join("")}
    <path d="M -52 -58 h 104" stroke="#a8763f" stroke-width="7" stroke-linecap="round"/>
    <path d="M -40 -60 q 40 -52 80 0" fill="none" stroke="#a8763f" stroke-width="6"/>
  </g>`;
}

// The county court of Unit 4: white, columned, and a sign that names it.
function courtHouse(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-200" y="-250" width="400" height="250" rx="6" fill="#f2f0e8" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${-166 + i * 78}" y="-232" width="42" height="232" rx="6" fill="${G3.cream}" stroke="${C.ink}" stroke-width="4"/>`).join("")}
    <path d="M -228 -250 h 456 l -228 -132 z" fill="#e4e0d2" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-120" y="-320" width="240" height="40" rx="8" fill="${G3.plum}" stroke="${C.ink}" stroke-width="4"/>
    <text x="0" y="-291" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="${G3.cream}">COURT</text>
    <g transform="translate(0 -196)">
      <path d="M 0 -30 v 60 M -54 -22 h 108" stroke="#8a6242" stroke-width="6" stroke-linecap="round"/>
      <path d="M -54 -22 l -18 34 h 36 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M 54 -22 l -18 34 h 36 z" fill="${G3.gold}" stroke="${C.ink}" stroke-width="3"/>
    </g>
  </g>`;
}

// The college of Unit 4, where Adam studies health and safety: a long block with
// a gate and a name board.
function collegeFront(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-230" y="-230" width="460" height="230" rx="8" fill="#dfd3bb" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-244" y="-268" width="488" height="42" rx="8" fill="${G3.tealDark}" stroke="${C.ink}" stroke-width="4.5"/>
    <text x="0" y="-238" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${G3.cream}">COLLEGE</text>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${-196 + i * 82}" y="-190" width="56" height="70" rx="5" fill="${G2.glass}" stroke="${C.ink}" stroke-width="3.6"/>`).join("")}
    <rect x="-58" y="-104" width="116" height="104" rx="6" fill="#8a6242" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M 0 -104 v 104" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="-16" cy="-50" r="6" fill="${G3.gold}"/><circle cx="16" cy="-50" r="6" fill="${G3.gold}"/>
  </g>`;
}

// A thermometer, for the Unit 7 temperature readings and the Unit 10 chart.
function thermometerProp(x, y, s = 1, { level = 0.6 } = {}) {
  const height = 150 * Math.min(1, Math.max(0.05, level));
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-15" y="-190" width="30" height="166" rx="15" fill="${G3.cream}" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="0" cy="-16" r="26" fill="${G3.coral}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="-7" y="${-24 - height}" width="14" height="${height + 10}" rx="7" fill="${G3.coral}"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M 15 ${-58 - i * 30} h 18" stroke="${C.ink}" stroke-width="3.4"/>`).join("")}
  </g>`;
}

// Frost on the ground: the white patch that surprises the class in the forest,
// where "water here froze one very cold night".
function frostPatch(x, y, s = 1) {
  const star = (sx, sy, sc) => `<g transform="translate(${sx} ${sy}) scale(${sc})">
    <path d="M 0 -18 v 36 M -16 -9 l 32 18 M -16 9 l 32 -18" stroke="#7fb0c8" stroke-width="5" stroke-linecap="round"/>
  </g>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="150" ry="34" fill="#e8f4fb" stroke="#8fb8cd" stroke-width="4.5"/>
    <g class="anim-shimmer">${star(-84, -6, 0.9)}${star(-6, 6, 1.1)}${star(76, -4, 0.85)}</g>
  </g>`;
}

// The place-value ladder of Unit 8: ten, a hundred, a thousand, and on up to a
// million. `lit` is how many steps have been climbed so far.
const LADDER_STEPS = ["10", "100", "1,000", "10,000", "100,000", "1,000,000"];
function numberLadder(x, y, s = 1, { lit = 6 } = {}) {
  // Drawn as a staircase standing on its own ground line. Six labelled cards
  // floating in a diagonal read as confetti; a step needs a riser under it and
  // something to stand on, or the page has no idea where the numbers are.
  const steps = LADDER_STEPS.map((label, i) => {
    const on = i < lit;
    return `<g transform="translate(${-330 + i * 132} ${-i * 74})">
      <rect x="-64" y="-58" width="128" height="58" rx="8" fill="${on ? C.rainbow[i % C.rainbow.length] : "#d8d2c4"}" stroke="${C.ink}" stroke-width="4.5"/>
      <rect x="-64" y="0" width="128" height="${8 + i * 74}" fill="${on ? "#e8dcc2" : "#ded8ca"}" stroke="${C.ink}" stroke-width="4"/>
      <text x="0" y="-18" text-anchor="middle" font-family="Georgia, serif" font-size="${label.length > 6 ? 26 : 32}" fill="${C.ink}">${label}</text>
    </g>`;
  }).join("");
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${steps}
    <path d="M -400 8 h 800" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

// The big green folder every desk gets in the last week of Year 3.
function folderProp(x, y, s = 1, { colour = G3.leafy } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-70" y="-96" width="140" height="96" rx="8" fill="${colour}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -70 -96 h 62 l 14 -18 h 64 v 18" fill="${colour}" stroke="${C.ink}" stroke-width="4.5"/>
    <rect x="-46" y="-74" width="92" height="60" rx="4" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3.4"/>
    <path d="M -30 -56 h 60 M -30 -42 h 60 M -30 -28 h 38" stroke="#9fb4c6" stroke-width="4"/>
  </g>`;
}
const heldFolder = `<g transform="translate(0 8) rotate(-4)"><rect x="-32" y="-24" width="64" height="48" rx="5" fill="${G3.leafy}" stroke="${C.ink}" stroke-width="3.4"/><rect x="-20" y="-14" width="40" height="28" rx="3" fill="${G3.cream}" stroke="${C.ink}" stroke-width="3"/></g>`;
const heldBasket = `<g transform="translate(0 16) scale(0.62)">${basketProp(0, 0, 1, { kind: "fruit" })}</g>`;

// Nora's cat, from Unit 9 — the one that goes missing, and the one in the old
// photographs her mother looks at with her.
function catProp(x, y, s = 1, { flip = false, curled = false } = {}) {
  const body = curled
    ? `<ellipse cx="0" cy="-22" rx="46" ry="30" fill="#9a7f5f" stroke="${C.ink}" stroke-width="4"/>
       <path d="M 40 -30 q 26 6 18 24 q -12 8 -20 -6" fill="#9a7f5f" stroke="${C.ink}" stroke-width="3.6"/>`
    : `<path d="M -40 0 v -34 q 0 -22 40 -22 q 40 0 40 22 v 34 z" fill="#9a7f5f" stroke="${C.ink}" stroke-width="4"/>
       <path d="M 38 -46 q 34 -14 24 -46 q -16 -6 -20 18" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    ${body}
    <g transform="translate(-16 ${curled ? -40 : -66})">
      <circle cx="0" cy="0" r="24" fill="#a98d69" stroke="${C.ink}" stroke-width="4"/>
      <path d="M -20 -14 l -6 -22 l 22 10 z M 20 -14 l 6 -22 l -22 10 z" fill="#a98d69" stroke="${C.ink}" stroke-width="3.4"/>
      <circle cx="-9" cy="-2" r="4" fill="${C.ink}"/><circle cx="9" cy="-2" r="4" fill="${C.ink}"/>
      <path d="M 0 6 l -6 6 h 12 z" fill="${G3.coral}"/>
      <path d="M -30 8 h 16 M -30 16 h 16 M 30 8 h -16 M 30 16 h -16" stroke="${C.ink}" stroke-width="2.6"/>
    </g>
  </g>`;
}

// The lighthouse Sami flies to in his Box of Ideas paper.
function lighthouse(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -54 0 l 14 -210 h 80 l 14 210 z" fill="${G3.cream}" stroke="${C.ink}" stroke-width="5"/>
    ${[0, 1, 2].map((i) => `<path d="M ${-48 + i * 3} ${-40 - i * 62} h ${96 - i * 6}" stroke="${G3.coral}" stroke-width="22"/>`).join("")}
    <rect x="-40" y="-262" width="80" height="54" rx="6" fill="${G2.glass}" stroke="${C.ink}" stroke-width="4.5"/>
    <path d="M -50 -262 h 100 l -10 -22 h -80 z" fill="${G3.tealDark}" stroke="${C.ink}" stroke-width="4"/>
    <g class="anim-glow"><path d="M 40 -236 l 150 -46 l 0 92 z" fill="${G3.gold}" opacity="0.55"/></g>
    <ellipse cx="0" cy="0" rx="72" ry="14" fill="${G3.stone}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

// A framed photograph, for the pages that look back at something.
function photoFrame(x, y, s = 1, { inner = "", colour = "#8a6242" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-84" y="-104" width="168" height="164" rx="8" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-66" y="-86" width="132" height="112" rx="4" fill="#dfeef7" stroke="${C.ink}" stroke-width="3.6"/>
    <g transform="translate(0 -20) scale(0.52)">${inner}</g>
    <path d="M -30 44 h 60" stroke="${colour}" stroke-width="6"/>
  </g>`;
}

// A roadside sign on a post: the county border of Unit 4, the market gate, the
// school gate. The label is short by design — a picture book is not a notice.
function signPost(x, y, s = 1, { label = "", colour = G3.teal } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-8" y="-160" width="16" height="160" fill="#8a6242" stroke="${C.ink}" stroke-width="3.6"/>
    <rect x="-110" y="-238" width="220" height="80" rx="8" fill="${colour}" stroke="${C.ink}" stroke-width="4.5"/>
    <text x="0" y="-186" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="${G3.cream}">${label}</text>
  </g>`;
}

module.exports = {
  ...kit2,
  G3, person, figure, CAST, hairShape, hijab, capShape,
  heldBook, heldPaper, heldShell, heldFolder, heldBasket,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  gardenWall, boxOfIdeas, desk, globeProp, shells, hospital, monthWall, poster,
  hourClock, microphone, stageCurtain, basketProp, courtHouse, collegeFront,
  thermometerProp, frostPatch, numberLadder, folderProp, catProp, lighthouse,
  photoFrame, signPost,
};
