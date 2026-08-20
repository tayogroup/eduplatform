// The Amal series kit — Grade 1's SECOND book per unit.
//
// Every Grade 1 unit already carries one book from the animal storyworld (Kiki,
// Duku, Lulu). The second one is the unit's OWN reading: "Amal's First Day",
// "Breakfast at Grandma's House", "Amal and the Big Ball", and so on through
// "Amal's English Year". So the two books on a unit's shelf are a fable and the
// child's own day, and neither is a retread of the other.
//
// The cast is not invented. It is read off the Year 1 passages — Amal, her big
// brother Adam, her friend Samira, little Leo, baby Idris, her sister Hodan,
// Ayeeyo the grandmother, Grandpa, Omar the shopkeeper, Faduma the doctor — and
// it is the SAME parametric person() the Grade 3 and Grade 4 books draw, two
// years younger. Amal in this shelf and Amal in "The Spelling Contest" are one
// character, which is the point.
//
// Additive, as every kit here is: nothing in the four existing kits is touched,
// so no page a learner has already read can move.

const kit = require("./ehel-ebook-kit-grade4.js");

const { C, W, H, delayAt, G2, G3, person, CAST4 } = kit;

// The colours Grade 1 names, so a "red book" is the same red on every page.
const A1 = {
  red: "#d94f43", blue: "#4f86c6", green: "#6f9a4a", yellow: "#f0b429",
  orange: "#e08a3c", purple: "#8f6bb5", black: "#2b2b33", white: "#f6f0e8",
  pink: "#e78fb3", brown: "#8a6242",
  metal: G2.metal, metalDark: G2.metalDark, glass: G2.glass,
};

// ---------------------------------------------------------------- the cast
//
// Five names the shared cast did not have. Everyone else — Amal, Adam, Idris,
// Mum, Dad, Hana (who is Ayeeyo here), Yasmin the teacher, Omar — comes from
// CAST4 unchanged.
const CAST_AMAL = {
  ...CAST4,
  samira: { skin: G3.skinDeep, hair: G3.hair, style: "braids", top: G3.teal, bottom: G3.gold, legs: "skirt" },
  hodan: { skin: G3.skin, hair: G3.hair, style: "puffs", top: G3.coral, bottom: G3.plum, legs: "skirt" },
  leo: { skin: G3.skinWarm, hair: G3.hair, style: "crop", top: G3.gold, bottom: G3.teal, legs: "trousers" },
  faduma: { adult: true, skin: G3.skinDeep, style: "bun", top: G3.cream, bottom: "#8f98a4", legs: "long", coat: "#f2f4f6", scarf: { colour: "#6f8fa8", shade: "#516f88" } },
  // Distinct from Hana on purpose. The first version gave them the same grey
  // and cream and the same glasses, and on the Unit 2 cover they read as two
  // of the same person standing either side of the table.
  grandpa: { adult: true, skin: G3.skinWarm, hair: "#9a948a", style: "crop", top: "#8a9a5b", bottom: "#5f5a50", legs: "trousers" },
};

// figureA("amal", { x, y, s, mood, arms, holding }) — the preset with per-page
// overrides, exactly as figure()/figure4() work in the Grade 3 and 4 kits.
function figureA(who, options = {}) {
  const preset = CAST_AMAL[who];
  if (!preset) throw new Error(`Unknown Amal-series character "${who}". Known: ${Object.keys(CAST_AMAL).join(", ")}`);
  return person({ ...preset, ...options, name: who });
}

// A baby. person() draws a standing child, and shrinking one gives a very short
// adult — which is exactly what the word "baby" is not. Idris is Unit 2's baby
// brother and gets his own drawing.
function babyIdris(x, y, s = 1, { blanket = A1.blue, mess = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="4" rx="70" ry="12" fill="${C.ink}" opacity="0.10"/>
    <g class="tap-target" data-figure="baby" data-tap="idris" data-mood="happy">
    <g class="anim-idle" style="${delayAt(x, y, 2)}">
    <path d="M -66 0 q -10 -74 66 -74 q 76 0 66 74 z" fill="${blanket}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -40 -34 q 40 -16 80 0" fill="none" stroke="${C.ink}" stroke-width="4" opacity="0.4"/>
    <circle cx="-48" cy="-48" r="14" fill="${G3.skin}" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="48" cy="-48" r="14" fill="${G3.skin}" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="0" cy="-104" r="46" fill="${G3.skin}" stroke="${C.ink}" stroke-width="6"/>
    <path d="M -34 -134 q 34 -22 68 0 q -10 -26 -34 -26 q -24 0 -34 26 z" fill="${G3.hair}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="-16" cy="-108" r="6" fill="${C.ink}"/>
    <circle cx="16" cy="-108" r="6" fill="${C.ink}"/>
    <path d="M -12 -88 q 12 12 24 0" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="-28" cy="-94" rx="7" ry="5" fill="${G3.coral}" opacity="0.35"/>
    <ellipse cx="28" cy="-94" rx="7" ry="5" fill="${G3.coral}" opacity="0.35"/>
    ${mess ? `<ellipse cx="0" cy="-84" rx="13" ry="9" fill="#f0e2c8" stroke="${C.ink}" stroke-width="3"/><circle cx="-14" cy="-72" r="5" fill="#f0e2c8" stroke="${C.ink}" stroke-width="2.6"/>` : ""}
    </g>
    </g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 1: school

// The classroom things Unit 1 names one by one. The Grade 3 kit's desk() is a
// writing desk with a closed front; "table" and "chair" are two separate words
// here, so each is its own object with its own legs.
function schoolTable(x, y, s = 1, { item = "" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-150" y="-120" width="300" height="26" rx="9" fill="#c9a06c" stroke="${C.ink}" stroke-width="6"/>
    ${[-128, 104].map((lx) => `<rect x="${lx}" y="-94" width="24" height="94" rx="7" fill="#a8845a" stroke="${C.ink}" stroke-width="5"/>`).join("")}
    ${[-96, 72].map((lx) => `<rect x="${lx}" y="-94" width="20" height="86" rx="7" fill="#8a6242" stroke="${C.ink}" stroke-width="5"/>`).join("")}
    <g transform="translate(0 -122)">${item}</g>
  </g>`;
}

function schoolChair(x, y, s = 1, { tint = A1.blue, flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <rect x="-88" y="-196" width="42" height="140" rx="14" fill="${tint}" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-96" y="-76" width="188" height="28" rx="10" fill="${tint}" stroke="${C.ink}" stroke-width="6"/>
    ${[-86, 66].map((lx) => `<rect x="${lx}" y="-52" width="24" height="54" rx="8" fill="#5f6b78" stroke="${C.ink}" stroke-width="5"/>`).join("")}
  </g>`;
}

// The alphabet chart on the wall. It shows LETTERS: the Unit 1 word is "abc
// chart", and a grid of colours would be a different page's picture.
function abcChart(x, y, s = 1) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-160" y="-190" width="320" height="380" rx="10" fill="#f6f0d8" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-160" y="-190" width="320" height="66" rx="10" fill="${A1.blue}"/>
    <text x="0" y="-140" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="40" font-weight="700" fill="#f6f0e8">A B C</text>
    ${letters.map((glyph, i) => {
      const cx = -124 + (i % 3) * 92;
      const cy = -92 + Math.floor(i / 3) * 96;
      return `<rect x="${cx}" y="${cy}" width="66" height="66" rx="10" fill="#ffffff" stroke="${C.ink}" stroke-width="4"/><text x="${cx + 33}" y="${cy + 50}" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="48" font-weight="700" fill="${C.rainbow[i % C.rainbow.length]}">${glyph}</text>`;
    }).join("")}
    <circle cx="0" cy="-206" r="12" fill="${A1.red}" stroke="${C.ink}" stroke-width="4"/>
  </g>`;
}

function wallClock(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="0" cy="0" r="118" fill="#f6f0e8" stroke="${C.ink}" stroke-width="8"/>
    <circle cx="0" cy="0" r="98" fill="#fdfbf6" stroke="${C.ink}" stroke-width="3"/>
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<path d="M 0 -92 v ${a % 90 === 0 ? -16 : -9}" stroke="${C.ink}" stroke-width="${a % 90 === 0 ? 7 : 4}" transform="rotate(${a})"/>`).join("")}
    <path d="M 0 0 v -62" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 0 0 l 46 22" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="10" fill="${C.ink}"/>
  </g>`;
}

function pencilProp(x, y, s = 1, { colour = A1.yellow } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-18)">
    <rect x="-26" y="-150" width="52" height="230" rx="6" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -26 -150 h 52 l 0 -22 h -52 z" fill="#e8b7c4" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-28" y="-134" width="56" height="16" fill="${A1.metal}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -26 80 L 0 138 L 26 80 z" fill="#e8c9a0" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -11 105 L 0 138 L 11 105 z" fill="${C.ink}"/>
  </g>`;
}

function crayonProp(x, y, s = 1, { colour = A1.green } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(12)">
    <rect x="-30" y="-120" width="60" height="200" rx="10" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -30 -120 L 0 -176 L 30 -120 z" fill="${colour}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="-33" y="-64" width="66" height="40" rx="4" fill="#f6f0d8" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -20 -52 h 40 M -20 -40 h 28" stroke="${C.ink}" stroke-width="3" opacity="0.4"/>
  </g>`;
}

// A ball in a named colour. The kit's playBall is the animal shelf's white and
// orange one and appears on shipped pages; Unit 3's ball is red and says so.
function colourBall(x, y, s = 1, colour = A1.red) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="tap-target" data-tap="ball"><g class="anim-idle" style="${delayAt(x, y, 1.8)}">
    <circle cx="0" cy="0" r="104" fill="${colour}" stroke="${C.ink}" stroke-width="7"/>
    <path d="M -104 0 q 104 -66 208 0 q -104 66 -208 0" fill="none" stroke="${C.ink}" stroke-width="6" opacity="0.5"/>
    <path d="M 0 -104 q 60 104 0 208" fill="none" stroke="${C.ink}" stroke-width="6" opacity="0.5"/>
    <path d="M -56 -60 q 22 -26 52 -32" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity="0.35"/>
  </g></g></g>`;
}

// The school from outside: Unit 1 arrives at it and Unit 9 walks past it. The
// kit already has a library, a clinic and a shop row, and using any of those
// would put the wrong word on the building.
function schoolFront(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -260 0 v -220 h 520 v 220 z" fill="#e8dcc8" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M -300 -220 h 600 l -60 -90 h -480 z" fill="#b5533f" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
    <rect x="-60" y="-140" width="120" height="140" rx="8" fill="#a5764f" stroke="${C.ink}" stroke-width="6"/>
    <path d="M 0 -140 v 140" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="-16" cy="-66" r="7" fill="${A1.metalDark}"/><circle cx="16" cy="-66" r="7" fill="${A1.metalDark}"/>
    ${[-186, 130].map((wx) => `<g transform="translate(${wx} -120)"><rect x="0" y="0" width="116" height="96" rx="7" fill="${A1.glass}" stroke="${C.ink}" stroke-width="6"/><path d="M 58 0 v 96 M 0 48 h 116" stroke="${C.ink}" stroke-width="5"/></g>`).join("")}
    <rect x="-150" y="-268" width="300" height="46" rx="10" fill="#f6f0d8" stroke="${C.ink}" stroke-width="6"/>
    <text x="0" y="-234" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="34" font-weight="700" fill="${A1.blue}">SCHOOL</text>
  </g>`;
}

// A book with its cover shut, in a named colour. Unit 1 says "A red book!", and
// the kit's openBook has a fixed cream cover.
function closedBook(x, y, s = 1, { colour = A1.red } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-96" y="-130" width="192" height="260" rx="9" fill="${colour}" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-78" y="-112" width="156" height="224" rx="5" fill="#fdfbf6" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -96 -130 h 26 v 260 h -26 z" fill="${colour}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -40 -50 h 100 M -40 -14 h 100 M -40 22 h 66" stroke="#9fb4c6" stroke-width="7" stroke-linecap="round"/>
  </g>`;
}

// A child's own drawing, pinned or held. Unit 1 ends with Amal drawing a
// picture of her school, and a sheet of cut-out shapes is a different page.
function childDrawing(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-140" y="-110" width="280" height="220" rx="6" fill="#fdfbf6" stroke="${C.ink}" stroke-width="6"/>
    <path d="M -92 60 v -70 h 128 v 70 z" fill="#e8dcc8" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -108 -10 h 160 l -32 -40 h -96 z" fill="#b5533f" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="-24" y="18" width="30" height="42" rx="4" fill="#a5764f" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="96" cy="-66" r="22" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="5"/>
    ${[[-116, 40], [104, 40]].map(([fx, fy]) => `<g transform="translate(${fx} ${fy})"><circle cx="0" cy="-26" r="11" fill="${G3.skin}" stroke="${C.ink}" stroke-width="4"/><path d="M 0 -15 v 22 M -12 -4 h 24 M -8 22 l 8 -15 l 8 15" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/></g>`).join("")}
  </g>`;
}

// A low bed with a folded blanket, for the pages that start the morning.
function bedProp(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <rect x="-230" y="-70" width="460" height="56" rx="12" fill="#e8dcc8" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-230" y="-160" width="52" height="150" rx="12" fill="#a5764f" stroke="${C.ink}" stroke-width="6"/>
    <rect x="178" y="-120" width="52" height="110" rx="12" fill="#a5764f" stroke="${C.ink}" stroke-width="6"/>
    <path d="M -40 -70 h 270 v 34 q 0 22 -22 22 h -248 z" fill="${A1.blue}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -178 -80 h 130 q 14 0 14 14 t -14 14 h -130 q -14 0 -14 -14 t 14 -14 z" fill="#fdfbf6" stroke="${C.ink}" stroke-width="5"/>
    ${[-190, -60, 70, 190].map((lx) => `<rect x="${lx - 9}" y="-14" width="18" height="30" rx="6" fill="#8a6242" stroke="${C.ink}" stroke-width="5"/>`).join("")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 2: breakfast

function foodBowl(x, y, s = 1, { kind = "cereal" } = {}) {
  const fill = kind === "cereal" ? "#f0e2c8" : "#e8ddc6";
  const bits = kind === "cereal"
    ? [[-40, -18], [-8, -26], [26, -18], [-22, -6], [12, -8], [44, -4]].map(([bx, by]) => `<circle cx="${bx}" cy="${by}" r="13" fill="#d9a640" stroke="${C.ink}" stroke-width="3.4"/>`).join("")
    : "";
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -104 -30 h 208 q -14 96 -104 96 q -90 0 -104 -96 z" fill="${A1.blue}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-30" rx="104" ry="26" fill="${fill}" stroke="${C.ink}" stroke-width="5"/>
    ${bits}
  </g>`;
}

function cupOfMilk(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -60 -110 h 120 l -12 170 q -2 16 -20 16 h -56 q -18 0 -20 -16 z" fill="#fdfbf6" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-110" rx="60" ry="17" fill="#f2f6fa" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 58 -78 q 46 4 42 42 q -4 36 -48 30" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
  </g>`;
}

function fruitProp(x, y, s = 1, kind = "banana") {
  const shapes = {
    banana: `<path d="M -84 -30 q 30 96 130 74 q 22 -6 12 -26 q -74 8 -104 -60 z" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="5"/><path d="M -84 -30 l -14 -20 l 18 -4 z" fill="#7d6a44" stroke="${C.ink}" stroke-width="4"/>`,
    grapes: `${[[0, 0], [-38, 0], [38, 0], [-19, 36], [19, 36], [0, 72], [-19, -36], [19, -36]].map(([gx, gy]) => `<circle cx="${gx}" cy="${gy - 10}" r="26" fill="${A1.purple}" stroke="${C.ink}" stroke-width="4"/>`).join("")}<path d="M 0 -56 q 10 -30 34 -40" stroke="#5c7d43" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    strawberry: `<path d="M 0 78 q -70 -34 -70 -84 q 0 -40 70 -40 q 70 0 70 40 q 0 50 -70 84 z" fill="${A1.red}" stroke="${C.ink}" stroke-width="5"/>${[[-30, -20], [10, -34], [34, 0], [-8, 12], [-42, 14], [30, 34]].map(([sx, sy]) => `<ellipse cx="${sx}" cy="${sy}" rx="5" ry="8" fill="#f6f0d8"/>`).join("")}<path d="M -34 -46 q 34 -18 68 0 q -14 -30 -34 -30 q -20 0 -34 30 z" fill="#5c7d43" stroke="${C.ink}" stroke-width="4"/>`,
    tomato: `<circle cx="0" cy="10" r="70" fill="${A1.red}" stroke="${C.ink}" stroke-width="6"/><path d="M -28 -48 q 28 -14 56 0 q -12 -22 -28 -22 q -16 0 -28 22 z" fill="#5c7d43" stroke="${C.ink}" stroke-width="4"/>`,
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">${shapes[kind] || shapes.banana}</g>`;
}

// A shallow basket of something, for the breakfast table and the market stall.
function basketOf(x, y, s = 1, { inner = "", tint = "#c9a06c" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g transform="translate(0 -74)">${inner}</g>
    <path d="M -120 -40 h 240 l -22 116 q -2 16 -22 16 h -152 q -20 0 -22 -16 z" fill="${tint}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-40" rx="120" ry="24" fill="#e0b478" stroke="${C.ink}" stroke-width="5"/>
    ${[-70, -20, 30, 80].map((wx) => `<path d="M ${wx} -30 l -8 96" stroke="#a8845a" stroke-width="6" opacity="0.6"/>`).join("")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 4: making

// The grass mat Ayeeyo weaves, in the two states the story turns on: bumpy and
// full of holes, then flat and neat. Drawing only the finished one would lose
// the whole point of the page.
function grassMat(x, y, s = 1, { neat = true, laid = false } = {}) {
  const warp = neat
    ? [-120, -72, -24, 24, 72, 120].map((wx) => `<path d="M ${wx} -78 v 156" stroke="#c9a34e" stroke-width="17" stroke-linecap="round"/>`).join("")
    : [-118, -68, -26, 30, 76, 124].map((wx, i) => `<path d="M ${wx} ${-78 + (i % 2) * 14} v ${132 + (i % 3) * 16}" stroke="#c9a34e" stroke-width="${13 + (i % 3) * 4}" stroke-linecap="round"/>`).join("");
  const weft = neat
    ? [-52, -6, 40].map((wy) => `<path d="M -140 ${wy} h 280" stroke="#a5764f" stroke-width="17" stroke-linecap="round"/>`).join("")
    : [-56, 4, 46].map((wy, i) => `<path d="M ${-134 + i * 14} ${wy} h ${230 - i * 26}" stroke="#a5764f" stroke-width="${12 + (i % 2) * 5}" stroke-linecap="round"/>`).join("");
  // `laid` squashes the mat into the ground plane. Without it every mat on the
  // page hung in the air at chest height, which is not where a mat is.
  return `<g transform="translate(${x} ${y}) scale(${s}) ${laid ? "scale(1 0.42)" : ""}">
    <path d="M -150 -90 h 300 v 180 h -300 z" fill="${neat ? "#e0bd7e" : "#d8b478"}" stroke="${C.ink}" stroke-width="6" opacity="${neat ? 1 : 0.9}"/>
    ${warp}${weft}
    <path d="M -150 -90 h 300 v 180 h -300 z" fill="none" stroke="${C.ink}" stroke-width="6"/>
  </g>`;
}

// A sheet of paper with cut-out shapes on it — Adam's picture in Unit 4.
function shapePicture(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-130" y="-170" width="260" height="340" rx="8" fill="#fdfbf6" stroke="${C.ink}" stroke-width="6"/>
    <circle cx="-52" cy="-92" r="46" fill="${A1.red}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="14" y="-134" width="86" height="86" rx="6" fill="${A1.blue}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -50 60 L 6 -8 L 62 60 z" fill="${A1.green}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="-98" y="84" width="196" height="56" rx="6" fill="${A1.yellow}" stroke="${C.ink}" stroke-width="5"/>
  </g>`;
}

function scissorsProp(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -20 30 l -70 -140" stroke="${A1.metal}" stroke-width="20" stroke-linecap="round"/>
    <path d="M 20 30 l 70 -140" stroke="${A1.metal}" stroke-width="20" stroke-linecap="round"/>
    <circle cx="0" cy="34" r="12" fill="${A1.metalDark}" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="-46" cy="96" r="40" fill="none" stroke="${A1.red}" stroke-width="18"/>
    <circle cx="46" cy="96" r="40" fill="none" stroke="${A1.red}" stroke-width="18"/>
  </g>`;
}

// ---------------------------------------------------------------- Unit 5: the farm

// No data-tap: a tap value promises a clip exists, and there is no cow.mp3 on
// the shelf. It gets one in the same change that pays for the recording, not
// before — the same rule the human figures follow.
function cow(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="26" rx="130" ry="16" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="${delayAt(x, y, 2.3)}">
    ${[-84, -40, 44, 88].map((lx) => `<rect x="${lx - 15}" y="-30" width="30" height="60" rx="10" fill="#f2ece4" stroke="${C.ink}" stroke-width="5"/><rect x="${lx - 16}" y="14" width="32" height="16" rx="5" fill="${C.ink}"/>`).join("")}
    <ellipse cx="-6" cy="-74" rx="132" ry="72" fill="#f6f0e8" stroke="${C.ink}" stroke-width="6"/>
    ${[[-56, -66, 30, 22], [10, -30, 22, 16], [-14, -104, 20, 14]].map(([sx, sy, rx, ry]) => `<ellipse cx="${sx}" cy="${sy}" rx="${rx}" ry="${ry}" fill="#3a3038"/>`).join("")}
    <path d="M -132 -96 q -34 22 -24 66 q 16 6 26 -16" fill="none" stroke="#3a3038" stroke-width="9" stroke-linecap="round"/>
    <circle cx="98" cy="-118" r="58" fill="#f6f0e8" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="112" cy="-92" rx="40" ry="30" fill="#e8b7c4" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="98" cy="-88" r="6" fill="${C.ink}"/><circle cx="128" cy="-88" r="6" fill="${C.ink}"/>
    <circle cx="82" cy="-136" r="7" fill="${C.ink}"/><circle cx="118" cy="-138" r="7" fill="${C.ink}"/>
    <path d="M 52 -150 q -22 -18 -6 -34 q 20 -8 26 22 z" fill="#e8ddc6" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 144 -152 q 22 -18 6 -34 q -20 -8 -26 22 z" fill="#e8ddc6" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    </g>
  </g>`;
}

function sheep(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="20" rx="98" ry="13" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="${delayAt(x, y, 2)}">
    ${[-56, -22, 26, 58].map((lx) => `<rect x="${lx - 11}" y="-24" width="22" height="44" rx="8" fill="#3a3038" stroke="${C.ink}" stroke-width="4"/>`).join("")}
    ${[[-72, -60, 34], [-34, -84, 40], [8, -90, 40], [50, -76, 36], [76, -48, 30], [-70, -22, 30], [-24, -18, 34], [24, -20, 34], [62, -18, 28]].map(([wx, wy, wr]) => `<circle cx="${wx}" cy="${wy}" r="${wr}" fill="#f6f0e8" stroke="${C.ink}" stroke-width="5"/>`).join("")}
    ${[[-72, -60, 34], [-34, -84, 40], [8, -90, 40], [50, -76, 36], [76, -48, 30]].map(([wx, wy, wr]) => `<circle cx="${wx}" cy="${wy}" r="${wr - 5}" fill="#f6f0e8"/>`).join("")}
    <circle cx="96" cy="-86" r="38" fill="#3a3038" stroke="${C.ink}" stroke-width="5"/>
    <ellipse cx="66" cy="-92" rx="20" ry="13" fill="#3a3038" stroke="${C.ink}" stroke-width="4" transform="rotate(-18 66 -92)"/>
    <ellipse cx="126" cy="-92" rx="20" ry="13" fill="#3a3038" stroke="${C.ink}" stroke-width="4" transform="rotate(18 126 -92)"/>
    <circle cx="86" cy="-92" r="5.5" fill="#f6f0e8"/><circle cx="108" cy="-92" r="5.5" fill="#f6f0e8"/>
    </g>
  </g>`;
}

function eggProp(x, y, s = 1, { count = 1, nestTint = "#c9a06c" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -110 6 q 110 34 220 0 q -14 44 -110 44 q -96 0 -110 -44 z" fill="${nestTint}" stroke="${C.ink}" stroke-width="6"/>
    ${Array.from({ length: count }, (unused, i) => `<ellipse cx="${(i - (count - 1) / 2) * 62}" cy="${-2 - (i % 2) * 10}" rx="34" ry="42" fill="#f6f0e2" stroke="${C.ink}" stroke-width="5"/>`).join("")}
  </g>`;
}

function tractorProp(x, y, s = 1, { flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="34" rx="180" ry="16" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="animation-duration:3s">
    <path d="M -150 0 v -70 h 96 l 18 -66 h 76 v 66 h 40 v 70 z" fill="${A1.green}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="-46" y="-128" width="72" height="58" rx="6" fill="${A1.glass}" stroke="${C.ink}" stroke-width="5"/>
    <rect x="-78" y="-186" width="22" height="118" rx="8" fill="#4a4a52" stroke="${C.ink}" stroke-width="5"/>
    <circle cx="-96" cy="6" r="52" fill="#3b3630" stroke="${C.ink}" stroke-width="6"/><circle cx="-96" cy="6" r="20" fill="${A1.metal}"/>
    <circle cx="96" cy="-6" r="82" fill="#3b3630" stroke="${C.ink}" stroke-width="6"/><circle cx="96" cy="-6" r="32" fill="${A1.metal}"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M 96 -6 l 0 -74" stroke="${A1.metalDark}" stroke-width="9" transform="rotate(${a} 96 -6)"/>`).join("")}
    </g>
  </g>`;
}

function seedBowl(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -74 -20 h 148 q -10 68 -74 68 q -64 0 -74 -68 z" fill="#b08758" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-20" rx="74" ry="18" fill="#e0bd5e" stroke="${C.ink}" stroke-width="5"/>
    ${[[-34, -24], [-8, -30], [20, -22], [42, -28], [4, -16]].map(([sx, sy]) => `<ellipse cx="${sx}" cy="${sy}" rx="8" ry="6" fill="#c9a34e"/>`).join("")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 6: the market

function spicePot(x, y, s = 1, { tint = "#c96a2e" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -78 -10 h 156 l -14 84 q -2 14 -20 14 h -88 q -18 0 -20 -14 z" fill="#9a8f80" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-10" rx="78" ry="20" fill="${tint}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M 0 -34 q -22 -6 -30 -30" fill="none" stroke="#d8c0a0" stroke-width="7" stroke-linecap="round" opacity="0.7"/>
    <g class="anim-float" style="${delayAt(x, y, 3.6)}"><path d="M -18 -56 q -14 -30 4 -50 M 22 -60 q 14 -30 -4 -50" fill="none" stroke="#d8cbb4" stroke-width="7" stroke-linecap="round" opacity="0.65"/></g>
  </g>`;
}

function clothBolt(x, y, s = 1, { tint = A1.purple } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -120 60 q 40 -40 120 -18 q 80 22 120 -22 l 0 44 q -40 44 -120 22 q -80 -22 -120 18 z" fill="${tint}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -120 20 q 40 -40 120 -18 q 80 22 120 -22 l 0 40 q -40 44 -120 22 q -80 -22 -120 18 z" fill="${tint}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round" opacity="0.85"/>
    <path d="M -120 -20 q 40 -40 120 -18 q 80 22 120 -22 l 0 40 q -40 44 -120 22 q -80 -22 -120 18 z" fill="${tint}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  </g>`;
}

function breadLoaf(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -110 40 q -12 -78 44 -92 q 66 -16 132 4 q 52 16 40 88 q -108 26 -216 0 z" fill="#d8a765" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -66 -44 q 18 30 12 74 M -12 -52 q 18 32 12 82 M 42 -46 q 18 30 12 76" fill="none" stroke="#b8853f" stroke-width="6" stroke-linecap="round"/>
    <g class="anim-float" style="${delayAt(x, y, 3.2)}"><path d="M -30 -104 q -12 -26 6 -44 M 34 -108 q 12 -26 -6 -44" fill="none" stroke="#d8cbb4" stroke-width="7" stroke-linecap="round" opacity="0.6"/></g>
  </g>`;
}

// One sense, drawn big enough to name on its own.
function senseIcon(x, y, s = 1, kind = "eye") {
  const shapes = {
    eye: `<path d="M -140 0 q 140 -104 280 0 q -140 104 -280 0 z" fill="#f6f0e8" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><circle cx="0" cy="0" r="52" fill="${A1.blue}" stroke="${C.ink}" stroke-width="6"/><circle cx="0" cy="0" r="22" fill="${C.ink}"/><circle cx="-16" cy="-16" r="9" fill="#f6f0e8"/>`,
    ear: `<path d="M 40 -120 q -110 -22 -122 74 q -8 92 26 138 q 26 34 54 6 q 20 -22 -6 -44 q -24 -20 -6 -44 q 20 -26 54 -20 q 54 10 60 -42 q 6 -54 -60 -68 z" fill="${G3.skin}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><path d="M 20 -62 q 40 6 34 42 q -6 30 -46 26" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`,
    nose: `<path d="M -12 -140 q -20 84 -70 130 q -20 20 4 34 q 22 12 30 -6 q 26 26 68 6 q 42 20 68 -6 q 8 18 30 6 q 24 -14 4 -34 q -50 -46 -70 -130 z" fill="${G3.skin}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><ellipse cx="-42" cy="26" rx="16" ry="11" fill="${C.ink}"/><ellipse cx="42" cy="26" rx="16" ry="11" fill="${C.ink}"/>`,
    tongue: `<path d="M -150 -60 q 150 -78 300 0 q -22 128 -150 128 q -128 0 -150 -128 z" fill="#c2565c" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><path d="M -120 -54 q 120 -52 240 0 q -120 26 -240 0 z" fill="#f6f0e8" stroke="${C.ink}" stroke-width="5"/><path d="M -66 -14 q 66 -22 132 0 q -6 96 -66 96 q -60 0 -66 -96 z" fill="#e08a9a" stroke="${C.ink}" stroke-width="6"/><path d="M 0 -6 v 74" stroke="${C.ink}" stroke-width="5" opacity="0.4"/>`,
    hand: `<path d="M -96 130 q -22 -84 -6 -138 q 12 -40 34 -14 l 10 26 v -134 q 0 -26 22 -26 q 22 0 22 26 v 110 v -134 q 0 -26 22 -26 q 22 0 22 26 v 134 v -110 q 0 -26 22 -26 q 22 0 22 26 v 110 v -70 q 0 -24 20 -24 q 20 0 20 24 v 130 q 0 96 -60 116 z" fill="${G3.skin}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`,
  };
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="anim-idle" style="${delayAt(x, y, 2.8)}">${shapes[kind] || shapes.eye}</g></g>`;
}

// A plain card to hold anything the page is showing rather than placing in the
// world. Without it, the recap pages hung a bus and a water pot in mid-air.
function pictureCard(x, y, s = 1, { inner = "", tint = "#f6f0d8" } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-150" y="-150" width="300" height="300" rx="26" fill="${tint}" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-128" y="-128" width="256" height="256" rx="16" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.28"/>
    ${inner}
  </g>`;
}

// A sense on a card. senseIcon() on its own is a giant eye or ear floating in
// the sky, which reads as an object in the world rather than as a label for
// what Amal is doing. The card is what makes it a badge.
function sensePanel(x, y, s = 1, kind = "eye") {
  const inner = { eye: 0.62, ear: 0.6, nose: 0.6, tongue: 0.52, hand: 0.56 }[kind] || 0.6;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-150" y="-150" width="300" height="300" rx="26" fill="#f6f0d8" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-128" y="-128" width="256" height="256" rx="16" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.28"/>
    <g transform="translate(0 ${kind === "hand" ? -14 : 0})">${senseIcon(0, 0, inner, kind)}</g>
  </g>`;
}

// ---------------------------------------------------------------- Unit 7: getting there

function bicycleProp(x, y, s = 1, { colour = A1.green, flip = false } = {}) {
  const wheel = (wx) => `<circle cx="${wx}" cy="0" r="72" fill="none" stroke="${C.ink}" stroke-width="10"/><circle cx="${wx}" cy="0" r="16" fill="${A1.metal}" stroke="${C.ink}" stroke-width="5"/>${[0, 45, 90, 135].map((a) => `<path d="M ${wx - 66} 0 h 132" stroke="${A1.metalDark}" stroke-width="4" transform="rotate(${a} ${wx} 0)"/>`).join("")}`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="86" rx="140" ry="12" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="${delayAt(x, y, 2.4)}">
    ${wheel(-104)}${wheel(104)}
    <path d="M -104 0 L -10 0 L 40 -84 L 104 0 M -10 0 L 30 -84 L 96 -84 M 40 -84 L 104 0" fill="none" stroke="${colour}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M 96 -84 q 26 -8 34 6" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
    <path d="M 8 -92 h 52 q 10 0 10 10 q -34 6 -62 0 z" fill="#3a3038" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="-10" cy="0" r="20" fill="none" stroke="${C.ink}" stroke-width="7"/>
    </g>
  </g>`;
}

function carProp(x, y, s = 1, { colour = A1.red, flip = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="24" rx="164" ry="14" fill="${C.ink}" opacity="0.10"/>
    <g class="anim-idle" style="${delayAt(x, y, 3.2)}">
    <path d="M -156 0 v -46 q 0 -18 20 -22 l 40 -8 l 44 -46 q 10 -10 26 -10 h 66 q 18 0 24 12 l 24 44 l 26 8 q 16 4 16 22 v 46 z" fill="${colour}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -66 -78 l 34 -36 q 6 -6 16 -6 h 22 v 42 z" fill="${A1.glass}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 22 -120 h 40 q 12 0 16 8 l 18 34 h -74 z" fill="${A1.glass}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="-92" cy="4" r="42" fill="#3b3630" stroke="${C.ink}" stroke-width="6"/><circle cx="-92" cy="4" r="17" fill="${A1.metal}"/>
    <circle cx="90" cy="4" r="42" fill="#3b3630" stroke="${C.ink}" stroke-width="6"/><circle cx="90" cy="4" r="17" fill="${A1.metal}"/>
    <path d="M -156 -40 h 26 q 8 0 8 9 t -8 9 h -26 z" fill="#f6e2a0" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
    </g>
  </g>`;
}

function busStop(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-11" y="-240" width="22" height="240" rx="8" fill="${A1.metal}" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-96" y="-330" width="192" height="96" rx="12" fill="${A1.blue}" stroke="${C.ink}" stroke-width="7"/>
    <path d="M -60 -300 h 120 q 10 0 10 10 v 24 q 0 10 -10 10 h -120 q -10 0 -10 -10 v -24 q 0 -10 10 -10 z" fill="#f6f0e8"/>
    <rect x="-48" y="-292" width="96" height="20" rx="4" fill="${A1.blue}"/>
    <circle cx="-34" cy="-256" r="9" fill="#3b3630"/><circle cx="34" cy="-256" r="9" fill="#3b3630"/>
  </g>`;
}

// Traffic lights. The kit's trafficRow is a row of CARS, and Unit 9's whole
// first page turns on "red means stop, green means go" — three little cars
// beside that sentence teaches the wrong object.
function trafficLights(x, y, s = 1, { lit = "red" } = {}) {
  const lamp = (cy, colour, on) => `<circle cx="0" cy="${cy}" r="30" fill="${on ? colour : "#4a4a52"}" stroke="${C.ink}" stroke-width="5"/>${on ? `<circle cx="0" cy="${cy}" r="44" fill="${colour}" opacity="0.22"/>` : ""}`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-14" y="-150" width="28" height="150" rx="10" fill="${A1.metal}" stroke="${C.ink}" stroke-width="6"/>
    <rect x="-58" y="-360" width="116" height="222" rx="18" fill="#3a3a42" stroke="${C.ink}" stroke-width="7"/>
    ${lamp(-306, A1.red, lit === "red")}
    ${lamp(-248, A1.yellow, lit === "yellow")}
    ${lamp(-190, A1.green, lit === "green")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 8: water

function villageWell(x, y, s = 1, { potDown = false } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -110 20 h 220 v 100 q 0 16 -20 16 h -180 q -20 0 -20 -16 z" fill="#9c8f80" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    ${[0, 1, 2].map((r) => (r % 2 ? [-78, -24, 30] : [-104, -50, 4, 58]).map((bx) => `<rect x="${bx}" y="${28 + r * 34}" width="48" height="28" rx="6" fill="#b0a495" stroke="${C.ink}" stroke-width="4"/>`).join("")).join("")}
    <ellipse cx="0" cy="20" rx="110" ry="26" fill="#3f6ea6" stroke="${C.ink}" stroke-width="6"/>
    <ellipse cx="0" cy="20" rx="82" ry="16" fill="#5f92c6"/>
    ${[-92, 92].map((px) => `<rect x="${px - 10}" y="-160" width="20" height="184" fill="#8a6242" stroke="${C.ink}" stroke-width="6"/>`).join("")}
    <path d="M -140 -160 h 280 l -34 -60 h -212 z" fill="#a5764f" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M -70 -150 h 140" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 0 -146 v ${potDown ? 150 : 52}" stroke="${C.ink}" stroke-width="5"/>
    ${potDown ? "" : `<path d="M -34 -94 h 68 v 44 q 0 12 -14 12 h -40 q -14 0 -14 -12 z" fill="#8a6242" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`}
  </g>`;
}

function waterPot(x, y, s = 1, { full = true } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -78 -78 q 78 -26 156 0 q 18 66 -14 108 q -30 38 -64 38 q -34 0 -64 -38 q -32 -42 -14 -108 z" fill="#b5714a" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-78" rx="78" ry="22" fill="${full ? "#5f92c6" : "#8a5236"}" stroke="${C.ink}" stroke-width="5"/>
    <path d="M -68 -30 q 68 22 136 0" fill="none" stroke="#8a5236" stroke-width="6" opacity="0.6"/>
  </g>`;
}

function dryGrass(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${[-160, -80, 0, 80, 160].map((gx, i) => `<path d="M ${gx} 0 q ${i % 2 ? 14 : -14} -34 ${i % 2 ? 26 : -26} -52 M ${gx} 0 q ${i % 2 ? -10 : 10} -32 ${i % 2 ? -20 : 20} -46" fill="none" stroke="#b8955a" stroke-width="7" stroke-linecap="round"/>`).join("")}
  </g>`;
}

// ---------------------------------------------------------------- Unit 10: the year

// The learning folder Amal opens on the last week of Grade 1, and the book she
// makes out of it.
function learningFolder(x, y, s = 1, { open = true } = {}) {
  const sheets = open
    ? [[-70, -22, A1.yellow], [-12, -34, A1.blue], [46, -26, A1.red], [96, -12, A1.green]]
      .map(([sx, sy, tint]) => `<g transform="translate(${sx} ${sy}) rotate(${sx / 12})"><rect x="-46" y="-62" width="92" height="124" rx="6" fill="#fdfbf6" stroke="${C.ink}" stroke-width="5"/><rect x="-30" y="-44" width="60" height="34" rx="4" fill="${tint}"/><path d="M -30 10 h 60 M -30 28 h 44" stroke="#9fb4c6" stroke-width="5"/></g>`).join("")
    : "";
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -160 90 h 320 v -160 q 0 -14 -16 -14 h -288 q -16 0 -16 14 z" fill="#c96a4e" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    ${sheets}
    <path d="M -160 90 h 320 q 14 0 14 -70 q 0 -18 -16 -18 h -316 q -16 0 -16 18 q 0 70 14 70 z" fill="#e0805f" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="-40" y="26" width="80" height="22" rx="8" fill="#b0563c" stroke="${C.ink}" stroke-width="5"/>
  </g>`;
}

function madeBook(x, y, s = 1, { title = "My Book" } = {}) {
  // The title is wrapped rather than shrunk to fit. "My First English World" is
  // four words on a 220-wide cover, and the single-line version ran off both
  // edges of the book and onto the wall behind it.
  const words = title.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > 11 && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  const top = -70 - (lines.length - 1) * 16;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-110" y="-150" width="220" height="300" rx="10" fill="${A1.blue}" stroke="${C.ink}" stroke-width="7"/>
    <rect x="-92" y="-132" width="184" height="264" rx="6" fill="#fdfbf6" stroke="${C.ink}" stroke-width="4"/>
    ${lines.map((text, i) => `<text x="0" y="${top + i * 32}" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="26" font-weight="700" fill="${A1.blue}">${text}</text>`).join("")}
    <circle cx="-34" cy="52" r="26" fill="${A1.red}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="6" y="26" width="52" height="52" rx="5" fill="${A1.green}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M -50 122 h 100" stroke="#9fb4c6" stroke-width="6" stroke-linecap="round"/>
    <path d="M -50 100 h 74" stroke="#9fb4c6" stroke-width="6" stroke-linecap="round"/>
  </g>`;
}

// ---------------------------------------------------------------- shared scenes

// The village under the big tree: Unit 4's setting, and Unit 8's.
// The village. `treeX` moves the big tree, because Unit 4 is set UNDER it —
// with the tree parked at the left edge, the two people weaving beneath it were
// standing in open sun in the middle of the page.
function villageScene({ dry = false, treeX = 240, treeScale = 1.5, sunny = true } = {}) {
  // `sunny: false` is not decoration. The storm pages and the night page laid a
  // grey wash over this scene and left the sun burning through it — the same
  // defect as the two suns on the Grade 2 shadow book.
  return `${kit.sky()}${sunny ? kit.sun(1330, 150) : ""}${kit.hills()}${kit.ground()}
    ${dry ? `<rect x="0" y="620" width="${W}" height="${H - 620}" fill="#a8925e" opacity="0.42"/>` : ""}
    ${kit.acacia(treeX, 640, treeScale)}`;
}

// The classroom, with the alphabet chart and the clock Unit 1 names hung on it.
// Both go in the gap BETWEEN the board and the window — the first version put
// the chart on top of the window and the clock under the bunting.
function amalClassroom() {
  return `${kit.classroomScene()}${abcChart(880, 280, 0.62)}${wallClock(1060, 520, 0.6)}`;
}

// Grandma's house: the kit's plain room, with a window and a shelf on the wall.
// Twelve pages of bare plaster read as an unfinished drawing rather than a room.
function homeWall({ night = false } = {}) {
  return `${kit.roomScene()}
    <g transform="translate(1310 300)">
      <rect x="-150" y="-130" width="300" height="260" rx="10" fill="${night ? "#33436b" : G2.glass}" stroke="#8a6242" stroke-width="14"/>
      <path d="M 0 -130 v 260 M -150 0 h 300" stroke="#8a6242" stroke-width="10"/>
      ${night ? `<circle cx="-70" cy="-64" r="26" fill="#f6f0d8" opacity="0.9"/>` : `<ellipse cx="-70" cy="-64" rx="52" ry="26" fill="#f7fbfe" opacity="0.9"/><ellipse cx="66" cy="62" rx="62" ry="30" fill="${C.acaciaLeaf}" opacity="0.55"/>`}
    </g>
    ${kit.bookShelf(300, 420, 0.9)}`;
}

module.exports = {
  ...kit,
  A1, CAST_AMAL, figureA, babyIdris,
  schoolTable, schoolChair, abcChart, wallClock, pencilProp, crayonProp, colourBall, schoolFront,
  foodBowl, cupOfMilk, fruitProp, basketOf,
  grassMat, shapePicture, scissorsProp, closedBook, childDrawing, bedProp,
  cow, sheep, eggProp, tractorProp, seedBowl,
  spicePot, clothBolt, breadLoaf, senseIcon, sensePanel, pictureCard,
  bicycleProp, carProp, busStop, trafficLights,
  villageWell, waterPot, dryGrass,
  learningFolder, madeBook,
  villageScene, amalClassroom, homeWall,
};
