// Math visuals: topic-aware labelled SVG diagrams and interactive WebGL scenes
// for each unit. A classifier maps a unit's title/concepts to a math topic;
// each topic supplies diagram art and, where motion helps, a WebGL scene id
// (see math-webgl.js).

const esc = (value = "") => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TOPIC_RULES = [
  ["fractions", /fraction|decimal|percentage|percent|tenths|hundredths|ratio|proportion/i],
  ["time", /\btime\b|clock|hour|minute|calendar|o.clock|duration|telling the time/i],
  ["money", /money|coin|cash|price|change|currency|shilling|dollar|cost|budget/i],
  ["statistics", /statistic|data|chart|graph|pictogram|tally|table|probability|average|mean|median|mode|survey|frequenc/i],
  ["geometry", /geometr|shape|angle|symmetr|polygon|triangle|circle|square|quadrilat|3-?d|2-?d|solid|net\b|position|movement|turn|rotation|reflect|coordinate|transformation/i],
  ["measure", /measure|length|mass|weight|capacity|volume|area|perimeter|distance|metre|litre|gram|scale|temperature/i],
  ["algebra", /algebra|equation|expression|sequence|pattern|formula|variable|unknown|function|nth term|substitut/i],
  ["calculation", /calculat|add|subtract|multipl|divi|times table|arithmetic|sum|product|operation|column method|mental math/i],
  ["number", /number|place value|digit|counting|count|integer|negative|round|estimat|order|compar|odd|even|prime|factor|multiple|power|index|indices|square root/i],
];

export function unitTopic(unitTitle, concepts = []) {
  const title = String(unitTitle || "");
  for (const [topic, pattern] of TOPIC_RULES) if (pattern.test(title)) return topic;
  const conceptText = concepts.map((c) => `${c.title} ${c.explanation}`).join(" ");
  let best = "number", bestScore = 0;
  for (const [topic, pattern] of TOPIC_RULES) {
    const matches = (conceptText.match(new RegExp(pattern, "gi")) || []).length;
    if (matches > bestScore) { bestScore = matches; best = topic; }
  }
  return best;
}

const DIAGRAMS = {
  number: [
    { caption: "A number line helps you count, compare and place numbers in order. Drag to explore.", labels: ["0", "5", "10", "count on →"], scene: "numberline" },
    { caption: "Place value: each digit is worth its place — hundreds, tens and ones. Drag to explore.", labels: ["hundreds", "tens", "ones"], scene: "placevalue" },
    { caption: "The value of a digit depends on its place. In 372 the 3 means 300, the 7 means 70, the 2 means 2.", labels: ["3 = 300", "7 = 70", "2 = 2"],
      art: `<rect x="60" y="50" width="80" height="80" rx="6" class="m-fill-blue"/><text x="100" y="102" class="m-big">3</text><text x="100" y="150" class="m-tiny">300</text><rect x="150" y="50" width="80" height="80" rx="6" class="m-fill-green"/><text x="190" y="102" class="m-big">7</text><text x="190" y="150" class="m-tiny">70</text><rect x="240" y="50" width="80" height="80" rx="6" class="m-fill-orange"/><text x="280" y="102" class="m-big">2</text><text x="280" y="150" class="m-tiny">2</text><text x="30" y="102" class="m-tiny">372</text>` },
    { caption: "Compare numbers using less than (<), greater than (>) or equal to (=).", labels: ["<", ">", "="],
      art: `<text x="90" y="95" class="m-huge">48</text><text x="190" y="98" class="m-sym">&lt;</text><text x="290" y="95" class="m-huge">63</text><text x="190" y="140" class="m-tiny">48 is less than 63</text>` },
  ],
  calculation: [
    { caption: "Multiplication is repeated addition — an array shows rows × columns. Drag to explore.", labels: ["rows", "columns", "3 × 4 = 12"], scene: "array" },
    { caption: "Number bonds show pairs of numbers that make a total.", labels: ["part", "part", "whole"],
      art: `<circle cx="200" cy="50" r="28" class="m-fill-blue"/><text x="200" y="58" class="m-mid">10</text><circle cx="130" cy="130" r="26" class="m-fill-green"/><text x="130" y="138" class="m-mid">6</text><circle cx="270" cy="130" r="26" class="m-fill-orange"/><text x="270" y="138" class="m-mid">4</text><path d="M182 70l-38 38M218 70l38 38" class="m-line"/><text x="200" y="170" class="m-tiny">6 + 4 = 10</text>` },
    { caption: "The column method lines up ones, tens and hundreds to add or subtract.", labels: ["carry", "ones", "tens"],
      art: `<text x="240" y="60" class="m-num">3 4 6</text><text x="230" y="95" class="m-num">+ 2 7</text><line x1="150" y1="110" x2="300" y2="110" class="m-line"/><text x="240" y="145" class="m-num">3 7 3</text><text x="200" y="35" class="m-tiny">1</text>` },
    { caption: "Division shares a total into equal groups.", labels: ["12 ÷ 3 = 4", "equal groups"],
      art: `${[0,1,2].map((g)=>`<rect x="${70+g*100}" y="60" width="80" height="70" rx="8" class="m-outline"/>${[0,1,2,3].map((d)=>`<circle cx="${88+g*100+(d%2)*24}" cy="${80+Math.floor(d/2)*30}" r="8" class="m-fill-teal"/>`).join("")}`).join("")}<text x="200" y="160" class="m-tiny">12 shared into 3 groups = 4 each</text>` },
  ],
  fractions: [
    { caption: "A fraction bar splits a whole into equal parts; the shaded parts are the fraction. Drag to explore.", labels: ["numerator", "denominator", "shaded = fraction"], scene: "fraction" },
    { caption: "One half, one quarter and three quarters shown as parts of a whole.", labels: ["½", "¼", "¾"],
      art: `<circle cx="90" cy="90" r="40" class="m-outline"/><path d="M90 90V50a40 40 0 0 1 0 80z" class="m-fill-teal"/><text x="90" y="155" class="m-tiny">½</text><circle cx="200" cy="90" r="40" class="m-outline"/><path d="M200 90V50a40 40 0 0 1 40 40z" class="m-fill-blue"/><text x="200" y="155" class="m-tiny">¼</text><circle cx="310" cy="90" r="40" class="m-outline"/><path d="M310 90V50a40 40 0 1 1 -40 40z" class="m-fill-orange"/><text x="310" y="155" class="m-tiny">¾</text>` },
    { caption: "A fraction wall shows how halves, thirds and quarters compare.", labels: ["1 whole", "halves", "quarters"],
      art: `<rect x="40" y="45" width="300" height="22" class="m-fill-gray"/><text x="190" y="61" class="m-tiny light">1</text><rect x="40" y="72" width="148" height="22" class="m-fill-teal"/><rect x="192" y="72" width="148" height="22" class="m-fill-teal"/><rect x="40" y="99" width="71" height="22" class="m-fill-blue"/><rect x="115" y="99" width="71" height="22" class="m-fill-blue"/><rect x="192" y="99" width="71" height="22" class="m-fill-blue"/><rect x="267" y="99" width="71" height="22" class="m-fill-blue"/><text x="20" y="88" class="m-tiny">½</text><text x="20" y="115" class="m-tiny">¼</text>` },
  ],
  geometry: [
    { caption: "Compare 3D solids — sphere, cube, cylinder and cone. Drag to turn them.", labels: ["sphere", "cube", "cylinder", "cone"], scene: "solids" },
    { caption: "2D shapes are named by their number of straight sides.", labels: ["triangle · 3", "square · 4", "pentagon · 5", "hexagon · 6"],
      art: `<path d="M60 120L90 55l30 65z" class="m-flat"/><text x="90" y="150" class="m-tiny">3</text><rect x="150" y="58" width="60" height="60" class="m-flat"/><text x="180" y="150" class="m-tiny">4</text><path d="M270 52l32 24-12 40h-40l-12-40z" class="m-flat"/><text x="282" y="150" class="m-tiny">5</text><path d="M330 60h30l15 28-15 28h-30l-15-28z" class="m-flat"/><text x="345" y="150" class="m-tiny">6</text>` },
    { caption: "An angle is the amount of turn between two lines; a right angle is a quarter turn.", labels: ["right angle · 90°", "acute", "obtuse"],
      art: `<path d="M70 130V60M70 130h70" class="m-line"/><rect x="70" y="112" width="18" height="18" class="m-right"/><text x="105" y="152" class="m-tiny">90°</text><path d="M200 130l60-40M200 130h60" class="m-line"/><path d="M245 130a45 45 0 0 0 8-25" class="m-arc"/><text x="240" y="152" class="m-tiny">acute</text><path d="M320 130l-40-50M320 130h55" class="m-line"/><text x="330" y="152" class="m-tiny">obtuse</text>` },
    { caption: "A line of symmetry divides a shape into two matching mirror halves.", labels: ["line of symmetry", "matching halves"],
      art: `<path d="M120 50c-40 0-40 80 0 80 20 0 30-20 60-20s20 20 0 40" class="m-flat"/><path d="M120 30v130" class="m-symm"/><rect x="230" y="55" width="90" height="70" class="m-flat"/><path d="M275 45v90M215 90h120" class="m-symm"/><text x="120" y="175" class="m-tiny">1 fold</text><text x="275" y="175" class="m-tiny">2 folds</text>` },
    { caption: "Coordinates locate a point using across (x) then up (y). Drag to explore.", labels: ["x across", "y up", "(x, y)"], scene: "coordinates" },
  ],
  measure: [
    { caption: "A ruler measures length in centimetres and millimetres.", labels: ["cm", "mm", "length"],
      art: `<rect x="40" y="70" width="320" height="40" rx="4" class="m-fill-gold"/>${Array.from({length:17},(_,i)=>`<line x1="${52+i*18}" y1="70" x2="${52+i*18}" y2="${i%2?85:95}" class="m-tick"/>`).join("")}<path d="M52 120h180m0 0l-8-5m8 5l-8 5" class="m-line"/><text x="140" y="140" class="m-tiny">length = 10 cm</text>` },
    { caption: "Area is the space inside a shape, counted in squares; perimeter is the distance around it.", labels: ["area = squares", "perimeter = edge"],
      art: `${Array.from({length:12},(_,i)=>`<rect x="${120+(i%4)*40}" y="${55+Math.floor(i/4)*40}" width="40" height="40" class="m-grid"/>`).join("")}<rect x="120" y="55" width="160" height="120" class="m-outline thick"/><text x="200" y="120" class="m-mid dark">12</text><text x="200" y="195" class="m-tiny">area = 12 squares</text>` },
    { caption: "A scale measures mass; the pointer shows how heavy something is.", labels: ["grams", "kilograms", "mass"],
      art: `<path d="M120 130a80 80 0 0 1 160 0z" class="m-flat"/>${[-1,-.5,0,.5,1].map((t)=>`<line x1="${200+Math.sin(t*1.2)*70}" y1="${130-Math.cos(t*1.2)*70}" x2="${200+Math.sin(t*1.2)*60}" y2="${130-Math.cos(t*1.2)*60}" class="m-tick"/>`).join("")}<path d="M200 130l-30-55" class="m-needle"/><circle cx="200" cy="130" r="6" class="m-fill-red"/><text x="200" y="160" class="m-tiny">mass in grams</text>` },
  ],
  time: [
    { caption: "A clock face shows the time — the short hand gives hours, the long hand minutes. Drag to explore.", labels: ["hour hand", "minute hand", "o'clock"], scene: "clock" },
    { caption: "Read o'clock, half past, quarter past and quarter to on an analogue clock.", labels: ["o'clock", "half past", "quarter past"],
      art: `${[90,200,310].map((cx,i)=>`<circle cx="${cx}" cy="85" r="38" class="m-outline"/><circle cx="${cx}" cy="85" r="3" class="m-fill-navy"/><line x1="${cx}" y1="85" x2="${cx}" y2="55" class="m-hand"/><line x1="${cx}" y1="85" x2="${[cx,cx-26,cx+26][i]}" y2="${[55,85,85][i]}" class="m-hand short"/>`).join("")}<text x="90" y="150" class="m-tiny">3 o'clock</text><text x="200" y="150" class="m-tiny">half past</text><text x="310" y="150" class="m-tiny">quarter past</text>` },
  ],
  money: [
    { caption: "Coins have different values; we combine them to make an amount.", labels: ["coins", "add the values", "total"],
      art: `${[["1",90],["2",170],["5",250],["10",330]].map(([v,x])=>`<circle cx="${x}" cy="85" r="30" class="m-coin"/><text x="${x}" y="93" class="m-mid dark">${v}</text>`).join("")}<text x="210" y="150" class="m-tiny">1 + 2 + 5 + 10 = 18</text>` },
    { caption: "Work out change by counting up from the price to the amount paid.", labels: ["price", "paid", "change"],
      art: `<rect x="60" y="55" width="90" height="55" rx="6" class="m-fill-green"/><text x="105" y="90" class="m-mid light">7</text><text x="105" y="130" class="m-tiny">price</text><text x="185" y="90" class="m-sym">→</text><rect x="230" y="55" width="90" height="55" rx="6" class="m-fill-blue"/><text x="275" y="90" class="m-mid light">10</text><text x="275" y="130" class="m-tiny">paid</text><text x="190" y="170" class="m-tiny">change = 10 − 7 = 3</text>` },
  ],
  statistics: [
    { caption: "A bar chart compares amounts — taller bars mean bigger numbers. Drag to explore.", labels: ["tallest = most", "shortest = least"], scene: "barchart" },
    { caption: "A pictogram uses a picture to stand for a number of things.", labels: ["each ● = 2", "count the pictures"],
      art: `${["A","B","C"].map((row,r)=>`<text x="40" y="${75+r*40}" class="m-tiny">${row}</text>${Array.from({length:[4,2,3][r]},(_,i)=>`<circle cx="${80+i*35}" cy="${70+r*40}" r="12" class="m-fill-teal"/>`).join("")}`).join("")}<text x="200" y="175" class="m-tiny">each ● stands for 2</text>` },
    { caption: "A tally chart records counts in groups of five.", labels: ["|||| = 5", "count in fives"],
      art: `<text x="60" y="80" class="m-tally">|||| |||| ||</text><text x="60" y="120" class="m-tiny">= 12</text>` },
    { caption: "A Venn diagram sorts things by whether they fit one rule, both, or neither.", labels: ["rule A", "both", "rule B"],
      art: `<circle cx="150" cy="90" r="55" class="m-venn"/><circle cx="240" cy="90" r="55" class="m-venn"/><text x="120" y="95" class="m-tiny">A</text><text x="270" y="95" class="m-tiny">B</text><text x="195" y="95" class="m-tiny">both</text>` },
  ],
  algebra: [
    { caption: "An equation balances — both sides are equal. Keep it balanced to solve. Drag to explore.", labels: ["left = right", "keep balanced"], scene: "balance" },
    { caption: "A sequence follows a rule; find the pattern to continue it.", labels: ["+3 each time", "term-to-term rule"],
      art: `${[2,5,8,11].map((n,i)=>`<circle cx="${70+i*80}" cy="85" r="26" class="m-fill-blue"/><text x="${70+i*80}" y="93" class="m-mid light">${n}</text>${i<3?`<text x="${110+i*80}" y="92" class="m-sym small">+3</text>`:""}`).join("")}<text x="200" y="150" class="m-tiny">rule: add 3</text>` },
    { caption: "A straight-line graph shows how one amount changes with another.", labels: ["x axis", "y axis", "the line"],
      art: `<line x1="60" y1="150" x2="60" y2="40" class="m-line"/><line x1="60" y1="150" x2="340" y2="150" class="m-line"/><path d="M60 150L320 55" class="m-graphline"/>${[0,1,2,3].map((i)=>`<circle cx="${90+i*70}" cy="${132-i*24}" r="5" class="m-fill-orange"/>`).join("")}<text x="200" y="180" class="m-tiny">x</text><text x="35" y="95" class="m-tiny">y</text>` },
  ],
};

export function mathDiagram(topic, index, { interactive = true } = {}) {
  const set = DIAGRAMS[topic] || DIAGRAMS.number;
  const diagram = set[index % set.length];
  if (diagram.scene && interactive) {
    const sceneId = diagram.scene;
    return `<figure class="math-visual" data-math-figure="${topic}-${index}">
      <div class="geometry-stage"><canvas class="math-webgl" data-math-scene="${sceneId}" role="img" aria-label="Interactive model. ${esc(diagram.caption)}"></canvas><p class="geometry-fallback" hidden>This device cannot display the interactive model. Use the labels and caption below.</p></div>
      <div class="geometry-labels" aria-hidden="true">${diagram.labels.map((label) => `<span>${esc(label)}</span>`).join("")}</div>
      <div class="geometry-controls"><button type="button" data-geometry-toggle>Pause animation</button><button type="button" data-geometry-reset>Reset view</button><span>Drag the model to turn it</span></div>
      <figcaption><strong>Interactive example:</strong> ${esc(diagram.caption)}</figcaption>
    </figure>`;
  }
  return `<figure class="math-visual"><svg viewBox="0 0 400 190" class="m-diagram" aria-hidden="true" focusable="false">${diagram.art || DIAGRAMS.number[2].art}</svg>
    ${diagram.labels ? `<div class="geometry-labels" aria-hidden="true">${diagram.labels.map((label) => `<span>${esc(label)}</span>`).join("")}</div>` : ""}
    <figcaption><strong>Visual example:</strong> ${esc(diagram.caption)}</figcaption></figure>`;
}
