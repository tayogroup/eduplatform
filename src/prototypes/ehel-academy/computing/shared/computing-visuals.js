// Computing visuals: topic-aware labelled SVG diagrams and an interactive
// WebGL scene for each unit. A lightweight classifier maps a unit's
// title/concepts to one of a set of computing topics; each topic provides
// diagram art and, where the behaviour over time is the thing being taught, an
// interactive WebGL scene id (see computing-webgl.js).
//
// Computing leans on the interactive scenes harder than the other subjects do.
// A still picture of a loop is just a rectangle; what a learner needs to see is
// the token going round it again, the counter ticking up, the branch being
// taken. So most topics here lead with a scene and keep the SVG as the
// no-WebGL fallback.

const esc = (value = "") => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---- topic classification -------------------------------------------------
// Order matters: the first rule that matches the unit title wins, so the more
// specific topics are listed before the general ones.
const TOPIC_RULES = [
  ["programming", /program|algorithm|code|coding|scratch|python|micro:?bit|sequenc|selection|iteration|loop|variable|debug|block|sprite|robot|game develop|animat|problem solv|computational thinking|decompos|pattern recognition|flowchart|sub-?routine/i],
  ["data", /data|database|spreadsheet|pictogram|graph|chart|branching|sort|search|record|field|information|analys|collect|logging|model+ing|statistic/i],
  ["networks", /network|internet|connect|communicat|web|browser|email|packet|router|server|wi-?fi|share|sending|secret message|cipher|encrypt|code cracker/i],
  ["systems", /computer system|hardware|software|input|output|device|processor|memory|storage|control|sensor|robotics|machine|artificial intelligence|\bai\b|around us|everywhere/i],
  ["media", /media|paint|draw|art|artist|photo|image|picture|music|sound|audio|video|animation|story|storytell|design|publish|3-?d|vector|web ?page/i],
  ["safety", /safe|safety|privacy|private|password|responsib|kind|respect|wellbeing|digital citizen/i],
];

export function unitTopic(unitTitle, concepts = []) {
  const title = String(unitTitle || "");
  for (const [topic, pattern] of TOPIC_RULES) if (pattern.test(title)) return topic;
  // Otherwise score every topic by how often its rule matches the concept text.
  const conceptText = concepts.map((c) => `${c.title} ${c.explanation}`).join(" ");
  let best = "general";
  let bestScore = 0;
  for (const [topic, pattern] of TOPIC_RULES) {
    const matches = (conceptText.match(new RegExp(pattern, "gi")) || []).length;
    if (matches > bestScore) { bestScore = matches; best = topic; }
  }
  return best;
}

// ---- diagram library ------------------------------------------------------
// Art is drawn on a 380x180 viewBox and uses the computing visual stylesheet
// classes. `scene` names an interactive model in computing-webgl.js.
const DIAGRAMS = {
  programming: [
    { caption: "A program runs its instructions in order, one at a time, from the top down. Drag the model to explore.", labels: ["instruction", "in order", "one at a time"], scene: "sequence",
      art: `${[0,1,2,3,4].map((i)=>`<rect x="${24+i*70}" y="66" width="56" height="46" rx="6" class="cmp-fill-navy"/><text x="${52+i*70}" y="94" class="cmp-tiny light">${i+1}</text>${i<4?`<path d="M${84+i*70} 89h${70-58}m-8-6l8 6-8 6" class="cmp-arrow"/>`:""}`).join("")}<text x="190" y="150" class="cmp-label">the steps run in order</text>` },
    { caption: "A loop repeats the same instructions again and again, so you write them once. Drag the model to watch the counter climb.", labels: ["repeat", "the block", "count"], scene: "loop",
      art: `<rect x="120" y="52" width="140" height="76" rx="10" class="cmp-panel"/><text x="190" y="96" class="cmp-mid">repeat 4</text><path d="M120 90H70a12 12 0 0 1-12-12V64a12 12 0 0 1 12-12h50" class="cmp-arrow"/><path d="M260 90h50a12 12 0 0 0 12-12V64" class="cmp-wire"/><text x="190" y="150" class="cmp-label">write it once, run it four times</text>` },
    { caption: "Selection makes the program choose: if the condition is true it takes one path, if false the other. Drag to explore.", labels: ["condition", "IF true", "ELSE false"], scene: "selection",
      art: `<path d="M190 30l44 34-44 34-44-34z" class="cmp-fill-gold"/><text x="190" y="70" class="cmp-tiny">IF</text><path d="M146 64H70v46" class="cmp-arrow"/><path d="M234 64h76v46" class="cmp-arrow"/><rect x="34" y="110" width="72" height="38" rx="6" class="cmp-fill-teal"/><text x="70" y="134" class="cmp-tiny light">THEN</text><rect x="274" y="110" width="72" height="38" rx="6" class="cmp-fill-gray"/><text x="310" y="134" class="cmp-tiny">ELSE</text>` },
    { caption: "A variable is a named box that holds one value at a time. Assign a new value and the old one is gone. Drag to explore.", labels: ["name", "value", "one at a time"], scene: "variable",
      art: `<rect x="120" y="56" width="140" height="70" rx="8" class="cmp-panel"/><text x="190" y="46" class="cmp-label">Score</text><text x="190" y="100" class="cmp-mid">10</text><path d="M40 90h70m-10-7l10 7-10 7" class="cmp-arrow"/><text x="60" y="74" class="cmp-tiny">new value in</text><path d="M270 90h70m-10-7l10 7-10 7" class="cmp-arrow alt"/><text x="316" y="74" class="cmp-tiny">old value out</text>` },
    { caption: "A robot follows your algorithm exactly — one wrong step and it goes the wrong way. Drag to follow its path.", labels: ["forward", "turn", "repeat"], scene: "robot" },
    { caption: "Decomposition: break one big problem into small parts you can solve one at a time. Drag to explore.", labels: ["whole problem", "parts", "solve each"], scene: "abstraction",
      art: `<rect x="150" y="24" width="80" height="46" rx="8" class="cmp-fill-navy"/><text x="190" y="52" class="cmp-tiny light">problem</text>${[0,1,2,3].map((i)=>`<rect x="${28+i*90}" y="112" width="66" height="40" rx="6" class="${["cmp-fill-gold","cmp-fill-teal","cmp-fill-orange","cmp-fill-blue"][i]}"/><path d="M190 72L${61+i*90} 108" class="cmp-wire"/>`).join("")}<text x="190" y="172" class="cmp-label">four smaller parts</text>` },
  ],
  data: [
    { caption: "Computers store everything as binary — just ones and zeros. Watch the bits count up and the place values light.", labels: ["bit", "0 or 1", "place value"], scene: "binary",
      art: `${[1,0,1,1,0,0,1,0].map((b,i)=>`<rect x="${18+i*45}" y="62" width="34" height="34" rx="4" class="${b?"cmp-fill-gold":"cmp-fill-navy"}"/><text x="${35+i*45}" y="85" class="cmp-tiny ${b?"":"light"}">${b}</text><text x="${35+i*45}" y="118" class="cmp-tiny">${2**(7-i)}</text>`).join("")}<text x="190" y="150" class="cmp-label">each place is worth twice the one on its right</text>` },
    { caption: "A database holds records in rows and fields in columns. A query lights up only the records that match. Drag to explore.", labels: ["field", "record", "query"], scene: "database",
      art: `<rect x="30" y="40" width="320" height="26" class="cmp-fill-navy"/>${["Name","Age","Town"].map((t,i)=>`<text x="${88+i*106}" y="58" class="cmp-tiny light">${t}</text>`).join("")}${[0,1,2].map((r)=>`<rect x="30" y="${70+r*30}" width="320" height="26" class="${r===1?"cmp-fill-gold":"cmp-panel"}"/>`).join("")}<text x="190" y="172" class="cmp-label">one row = one record</text>` },
    { caption: "A sorting algorithm puts data in order by comparing and swapping. Drag the model to watch it work.", labels: ["compare", "swap", "in order"], scene: "sort",
      art: `${[4,1,6,3,5,2].map((v,i)=>`<rect x="${34+i*58}" y="${138-v*17}" width="38" height="${v*17}" rx="3" class="cmp-fill-teal"/>`).join("")}<path d="M30 142h330" class="cmp-ground"/><text x="190" y="168" class="cmp-label">unsorted</text>` },
    { caption: "Binary search halves the list at every step, so it finds an item far faster than checking one by one. Drag to explore.", labels: ["middle", "too high", "too low"], scene: "search",
      art: `${[...Array(12)].map((_,i)=>`<rect x="${20+i*29}" y="70" width="22" height="40" rx="3" class="${i===5?"cmp-fill-gold":i<3||i>8?"cmp-fill-gray":"cmp-fill-teal"}"/>`).join("")}<path d="M165 128v-14m-6 6l6-6 6 6" class="cmp-arrow"/><text x="190" y="156" class="cmp-label">check the middle, throw away half</text>` },
    { caption: "A spreadsheet formula recalculates the moment the numbers change. Drag to watch the total follow.", labels: ["cell", "formula", "total"], scene: "spreadsheet",
      art: `${[0,1,2,3].map((i)=>`<rect x="${30+i*70}" y="${118-(i+2)*18}" width="50" height="${(i+2)*18}" class="cmp-fill-teal"/>`).join("")}<rect x="310" y="34" width="50" height="84" class="cmp-fill-gold"/><text x="335" y="152" class="cmp-tiny">SUM</text><path d="M30 120h330" class="cmp-ground"/>` },
    { caption: "A pictogram or bar chart turns counted data into a picture you can read at a glance.", labels: ["category", "count", "compare"],
      art: `${["mango","banana","apple"].map((t,i)=>`${[...Array([4,2,3][i])].map((_,j)=>`<circle cx="${118+j*34}" cy="${52+i*40}" r="13" class="${["cmp-fill-gold","cmp-fill-teal","cmp-fill-orange"][i]}"/>`).join("")}<text x="70" y="${57+i*40}" class="cmp-tiny">${t}</text>`).join("")}<path d="M104 26v122" class="cmp-ground"/>` },
  ],
  networks: [
    { caption: "A network joins devices so they can share. Watch the traffic run out to each device and back.", labels: ["switch", "device", "traffic"], scene: "network",
      art: `<rect x="150" y="72" width="80" height="34" rx="6" class="cmp-fill-navy"/><text x="190" y="94" class="cmp-tiny light">switch</text>${[0,1,2,3].map((i)=>{const a=i/4*Math.PI*2+.4;const x=190+Math.cos(a)*120;const y=89+Math.sin(a)*60;return `<path d="M190 89L${x.toFixed(0)} ${y.toFixed(0)}" class="cmp-wire"/><rect x="${(x-22).toFixed(0)}" y="${(y-15).toFixed(0)}" width="44" height="30" rx="4" class="cmp-fill-teal"/>`;}).join("")}` },
    { caption: "A file is split into packets that travel separately and are put back in order at the other end. Drag to explore.", labels: ["file", "packets", "reassembled"], scene: "packets",
      art: `<rect x="16" y="62" width="46" height="56" rx="5" class="cmp-fill-navy"/><rect x="318" y="62" width="46" height="56" rx="5" class="cmp-fill-navy"/>${[0,1,2,3].map((i)=>`<rect x="${86+i*58}" y="${74+(i%3-1)*22}" width="34" height="26" rx="4" class="${["cmp-fill-gold","cmp-fill-teal","cmp-fill-orange","cmp-fill-blue"][i]}"/>`).join("")}<text x="190" y="158" class="cmp-label">same file, different routes</text>` },
    { caption: "Your browser asks a server for a page; the server sends it back. That request and response is the whole web. Drag to explore.", labels: ["request →", "server", "← response"], scene: "clientserver",
      art: `<rect x="24" y="62" width="76" height="50" rx="5" class="cmp-fill-teal"/><text x="62" y="132" class="cmp-tiny">browser</text>${[0,1,2].map((i)=>`<rect x="284" y="${44+i*30}" width="64" height="24" rx="3" class="cmp-fill-navy"/>`).join("")}<text x="316" y="150" class="cmp-tiny">server</text><path d="M108 76h168m-10-6l10 6-10 6" class="cmp-arrow"/><text x="190" y="66" class="cmp-tiny">request</text><path d="M276 102H108m10 6l-10-6 10-6" class="cmp-arrow alt"/><text x="190" y="124" class="cmp-tiny">response</text>` },
    { caption: "Encryption scrambles a message so only someone with the key can read it. Drag to watch the letters shift.", labels: ["plaintext", "key", "ciphertext"], scene: "encryption",
      art: `${"HELLO".split("").map((c,i)=>`<rect x="${40+i*32}" y="34" width="26" height="28" rx="3" class="cmp-fill-teal"/><text x="${53+i*32}" y="54" class="cmp-tiny light">${c}</text>`).join("")}${"KHOOR".split("").map((c,i)=>`<rect x="${196+i*32}" y="112" width="26" height="28" rx="3" class="cmp-fill-gold"/><text x="${209+i*32}" y="132" class="cmp-tiny">${c}</text>`).join("")}<path d="M110 70l110 36m-4-12l4 12-12 2" class="cmp-arrow"/><text x="176" y="98" class="cmp-tiny">shift 3</text>` },
  ],
  systems: [
    { caption: "Every computer works the same way: input, then processing, then output. Drag to follow the data through.", labels: ["input", "process", "output"], scene: "general",
      art: `${[["input",56,"cmp-fill-teal"],["process",166,"cmp-fill-gold"],["output",276,"cmp-fill-orange"]].map(([t,x,cls])=>`<rect x="${x-44}" y="62" width="88" height="52" rx="8" class="${cls}"/><text x="${x}" y="94" class="cmp-tiny">${t}</text>`).join("")}<path d="M104 88h18m-8-6l8 6-8 6" class="cmp-arrow"/><path d="M214 88h18m-8-6l8 6-8 6" class="cmp-arrow"/>` },
    { caption: "Computers come in many shapes and sizes — a desktop, a laptop, a tablet, a phone. They are all computers.", labels: ["desktop", "laptop", "tablet", "smartphone"],
      art: `<rect x="20" y="46" width="70" height="50" rx="4" class="cmp-fill-navy"/><rect x="42" y="96" width="26" height="14" class="cmp-fill-gray"/><text x="55" y="132" class="cmp-tiny">desktop</text><path d="M112 96l14-46h56l14 46z" class="cmp-fill-teal"/><rect x="106" y="96" width="92" height="8" rx="3" class="cmp-fill-gray"/><text x="152" y="132" class="cmp-tiny">laptop</text><rect x="220" y="46" width="56" height="72" rx="6" class="cmp-fill-gold"/><text x="248" y="140" class="cmp-tiny">tablet</text><rect x="308" y="52" width="34" height="62" rx="6" class="cmp-fill-orange"/><text x="325" y="136" class="cmp-tiny">phone</text>` },
    { caption: "A micro:bit has 25 LEDs you can switch on one at a time to make patterns. Drag to watch a light sequence run.", labels: ["LED", "row", "sequence"], scene: "ledmatrix",
      art: `<rect x="130" y="30" width="120" height="120" rx="10" class="cmp-fill-green"/>${[...Array(25)].map((_,i)=>{const x=146+(i%5)*22,y=46+Math.floor(i/5)*22;const on=(i%5)===Math.floor(i/5);return `<circle cx="${x}" cy="${y}" r="7" class="${on?"cmp-fill-red":"cmp-fill-navy"}"/>`;}).join("")}` },
    { caption: "A sensor turns something in the real world — light, heat, movement — into data the computer can use.", labels: ["real world", "sensor", "data"],
      art: `<circle cx="58" cy="88" r="26" class="cmp-fill-gold"/><text x="58" y="136" class="cmp-tiny">heat</text><path d="M92 88h56m-10-6l10 6-10 6" class="cmp-arrow"/><rect x="152" y="62" width="76" height="52" rx="6" class="cmp-fill-teal"/><text x="190" y="94" class="cmp-tiny light">sensor</text><path d="M234 88h56m-10-6l10 6-10 6" class="cmp-arrow"/><rect x="296" y="66" width="60" height="44" rx="4" class="cmp-fill-navy"/><text x="326" y="94" class="cmp-tiny light">27°C</text>` },
  ],
  media: [
    { caption: "A digital picture is a grid of tiny squares called pixels, each one a number. Drag to watch the image build.", labels: ["pixel", "grid", "image"], scene: "pixels",
      art: `${[...Array(64)].map((_,i)=>{const x=i%8,y=Math.floor(i/8);const dx=x-3.5,dy=y-3.5;const on=Math.sqrt(dx*dx+dy*dy)<3.1;return `<rect x="${112+x*20}" y="${20+y*20}" width="18" height="18" class="${on?"cmp-fill-blue":"cmp-fill-gray"}"/>`;}).join("")}` },
    { caption: "Animation shows a row of pictures quickly, one after another, so the eye sees movement.", labels: ["frame 1", "frame 2", "frame 3", "movement"],
      art: `${[0,1,2,3].map((i)=>`<rect x="${18+i*92}" y="46" width="76" height="60" rx="5" class="cmp-panel"/><circle cx="${56+i*92}" cy="${88-i*12}" r="12" class="cmp-fill-gold"/>`).join("")}<text x="190" y="140" class="cmp-label">each frame moves a little more</text>` },
    { caption: "Sound is recorded as a wave: louder means taller, higher means closer together.", labels: ["quiet", "loud", "wave"],
      art: `<path d="M20 88h340" class="cmp-ground"/>${[...Array(28)].map((_,i)=>{const h=Math.abs(Math.sin(i*.6))*(12+i*1.6);return `<rect x="${24+i*12}" y="${88-h}" width="7" height="${h*2}" rx="2" class="cmp-fill-teal"/>`;}).join("")}` },
    { caption: "Vector drawings are made of shapes you can move and resize without ever going blurry.", labels: ["shape", "handle", "resize"],
      art: `<rect x="120" y="46" width="140" height="86" rx="8" class="cmp-fill-teal"/>${[[120,46],[260,46],[120,132],[260,132]].map(([x,y])=>`<rect x="${x-6}" y="${y-6}" width="12" height="12" class="cmp-fill-gold"/>`).join("")}<text x="190" y="164" class="cmp-label">drag a handle to resize</text>` },
  ],
  safety: [
    { caption: "Keep personal information private. It belongs to you, and nobody online needs it.", labels: ["name", "address", "password", "keep private"],
      art: `<rect x="140" y="70" width="100" height="72" rx="8" class="cmp-fill-gold"/><path d="M162 70V52a28 28 0 0 1 56 0v18" class="cmp-wire thick"/><circle cx="190" cy="102" r="10" class="cmp-fill-navy"/><rect x="185" y="106" width="10" height="20" rx="4" class="cmp-fill-navy"/><text x="190" y="168" class="cmp-label">locked = private</text>` },
    { caption: "If something online worries you, stop, leave the page, and tell an adult you trust.", labels: ["stop", "leave", "tell someone"],
      art: `${[["stop",62,"cmp-fill-red"],["leave",190,"cmp-fill-gold"],["tell",318,"cmp-fill-teal"]].map(([t,x,cls])=>`<circle cx="${x}" cy="80" r="30" class="${cls}"/><text x="${x}" y="136" class="cmp-tiny">${t}</text>`).join("")}<path d="M98 80h56m-10-6l10 6-10 6" class="cmp-arrow"/><path d="M226 80h56m-10-6l10 6-10 6" class="cmp-arrow"/>` },
  ],
  general: [
    { caption: "Computing is a loop: plan the steps, build it, test it, fix what is broken, and improve. Drag to explore.", labels: ["plan", "build", "test", "fix"], scene: "general",
      art: `${[["plan",70],["build",160],["test",250],["fix",340]].map(([t,x],i)=>`<circle cx="${x}" cy="80" r="24" class="${["cmp-fill-blue","cmp-fill-teal","cmp-fill-gold","cmp-fill-orange"][i]}"/><text x="${x}" y="84" class="cmp-tiny">${i+1}</text><text x="${x}" y="130" class="cmp-label">${t}</text>${i<3?`<path d="M${x+26} 80h${63-26}m-10-6l10 6-10 6" class="cmp-arrow"/>`:""}`).join("")}` },
  ],
};

export function computingDiagram(topic, index, { interactive = true } = {}) {
  const set = DIAGRAMS[topic] || DIAGRAMS.general;
  const diagram = set[index % set.length];
  if (diagram.scene && interactive) {
    const sceneId = `${topic}-${index}`;
    return `<figure class="computing-visual" data-computing-figure="${sceneId}">
      <div class="geometry-stage"><canvas class="computing-webgl" data-computing-scene="${diagram.scene}" role="img" aria-label="Interactive model. ${esc(diagram.caption)}"></canvas><p class="geometry-fallback" hidden>This device cannot display the interactive model. Use the labels and caption below.</p></div>
      <div class="geometry-labels" aria-hidden="true">${diagram.labels.map((label) => `<span>${esc(label)}</span>`).join("")}</div>
      <div class="geometry-controls"><button type="button" data-geometry-toggle>Pause animation</button><button type="button" data-geometry-reset>Reset view</button><span>Drag the model to turn it</span></div>
      <figcaption><strong>Interactive example:</strong> ${esc(diagram.caption)}</figcaption>
    </figure>`;
  }
  return `<figure class="computing-visual"><svg viewBox="0 0 380 180" class="cmp-diagram" aria-hidden="true" focusable="false">${diagram.art || DIAGRAMS.general[0].art}</svg>
    ${diagram.labels ? `<div class="geometry-labels" aria-hidden="true">${diagram.labels.map((label) => `<span>${esc(label)}</span>`).join("")}</div>` : ""}
    <figcaption><strong>Visual example:</strong> ${esc(diagram.caption)}</figcaption></figure>`;
}

export function hasInteractiveScene(topic, index) {
  const set = DIAGRAMS[topic] || DIAGRAMS.general;
  return Boolean(set[index % set.length].scene);
}
