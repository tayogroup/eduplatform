// An interactive WebGL explainer for each Computing vocabulary word.
//
// Modelled on computing-word-pictures.js, which gives a word card a picture
// only where an emoji can honestly BE the word — and found that most of this
// vocabulary is abstract and has no honest picture. An animated scene reaches
// the words a still picture cannot: nothing pictures "debug", but a model that
// runs a program into its wrong step, swaps the step and runs again IS
// debugging. Same for repeat, backup, predict, wireless, tally. The scene
// shows the behaviour the word names, which in computing is almost always the
// meaning.
//
// This also recovers words the picture map deliberately excluded. "bug" has no
// emoji because 🐛 would teach a five-year-old that a bug is a caterpillar —
// but a robot visibly following one wrong step teaches exactly what it is.
// Likewise "malware": 🦠 is the biological virus, while a red program copying
// itself until the device's real work stops is the honest mechanism.
//
// Each entry names a scene in computing-webgl.js and carries its own caption:
// scenes are shared between words that name the same behaviour (algorithm,
// instruction, order and program all show a sequence running), and the caption
// is what ties the shared scene to THIS word. tools/check-computing-webgl-scenes.mjs
// holds the two files together — every scene named here must render geometry —
// and checks that every Grade 2 vocabulary word resolves to an entry.
//
// The card shows ONE word at a time, so this is one live WebGL context per
// page. Do not render these into the deck half: its slides are all in the DOM
// at once, and a 15-word unit would be 15 contexts against a browser cap of
// about sixteen — the same arithmetic that keeps deck diagrams flat.

const esc = (value = "") => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const COMPUTING_WORD_SCENES = {
  // --- steps a computer follows --------------------------------------------
  algorithm: { scene: "sequence", caption: "An algorithm is a set of steps in the right order. Watch the runner do each step, first to last." },
  instruction: { scene: "sequence", caption: "Each block is one instruction — one small thing to do. The runner does one at a time." },
  order: { scene: "sequence", caption: "The steps run in order, first to last. Change the order and you change what happens." },
  program: { scene: "sequence", caption: "A program is steps written for a computer. Watch it run them one at a time, top to bottom." },
  app: { scene: "sequence", caption: "An app is a program — a set of steps the computer follows. Watch the steps run in order." },
  run: { scene: "sequence", caption: "Run means go! Watch the program start at the first step and keep going to the end." },
  step: { scene: "sequence", caption: "A step is one thing the program does. Watch the runner take them one at a time." },
  "start program": { scene: "sequence", caption: "Start program begins the run: the very first step goes first." },
  "stop program": { scene: "sequence", caption: "Stop program ends the run. After it, no more steps happen." },
  page: { scene: "sequence", caption: "A story's pages come one after another, in order — the program moves from one page to the next." },
  repeat: { scene: "loop", caption: "Repeat means do it again. Watch the ball go round the same steps and the counter climb with each lap." },
  precise: { scene: "precise", caption: "Precise means exact. Both robots get the same steps — the precise one follows them exactly and reaches the goal." },
  predict: { scene: "predict", caption: "Predicting is saying what the program will do BEFORE you run it. The grey ghost is the guess; the runner shows the truth." },

  // --- blocks and the things they move -------------------------------------
  scratchjr: { scene: "blocks", caption: "In ScratchJr you snap blocks together to make a program. Run it and the character obeys." },
  block: { scene: "blocks", caption: "Each block is one instruction. Snap blocks together to build a program, then run it." },
  character: { scene: "blocks", caption: "The character does what your blocks tell it. Run the program and watch it move." },
  code: { scene: "blocks", caption: "Code is instructions written so a computer can follow them. Watch the blocks snap together and run." },
  "say block": { scene: "blocks", caption: "The Say block makes your character show a message when the program reaches it — watch for it at the end." },

  // --- when programs go wrong ----------------------------------------------
  bug: { scene: "bugdebug", caption: "A bug is a mistake in a program — one wrong step. Watch the runner follow it and come off the path." },
  debug: { scene: "bugdebug", caption: "Debugging is finding the wrong step and fixing it. Watch the bad step swap out, then the run works." },
  test: { scene: "bugdebug", caption: "Testing is running your program and watching carefully. That is how you find the step that is wrong." },

  // --- robots and moving about ---------------------------------------------
  robot: { scene: "robot", caption: "A robot is a machine that follows a program. Watch it do exactly the steps it was given." },
  "move forward": { scene: "robot", caption: "Move forward takes the robot one square at a time — exactly as many squares as you say." },
  "turn left / right": { scene: "robot", caption: "Turning changes which way the robot faces. Then moving forward goes the new way." },
  "turn left": { scene: "robot", caption: "Turn left changes which way the robot faces. Then moving forward goes the new way." },
  "turn right": { scene: "robot", caption: "Turn right changes which way the robot faces. Then moving forward goes the new way." },
  "step up": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  "step down": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  "step left": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  "step right": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  real: { scene: "realfictional", caption: "Real robots are machines doing jobs, like the arm moving its load. They only do what their program says." },
  fictional: { scene: "realfictional", caption: "Fictional robots live in stories. This one floats with nothing holding it up — real robots cannot do that." },

  // --- drawing with a marker ------------------------------------------------
  "marker down / up": { scene: "marker", caption: "Marker down draws as it moves; marker up lifts and moves without drawing. That is why the trail has a gap." },
  "marker down": { scene: "marker", caption: "Marker down means the pen touches the floor and draws a line as it moves." },
  "marker up": { scene: "marker", caption: "Marker up lifts the pen, so it moves without drawing — watch the gap it leaves." },
  path: { scene: "marker", caption: "The path is the line your moves make. Watch the trail appear behind the marker." },

  // --- data ------------------------------------------------------------------
  data: { scene: "grouping", caption: "Data is information you collect. Watch each piece being gathered into the group where it belongs." },
  group: { scene: "grouping", caption: "Grouping puts things that belong together into the same set. Watch each one fly to its group." },
  sort: { scene: "sort", caption: "Sorting puts things in order. Watch the bars compare and swap until they line up." },
  tally: { scene: "tally", caption: "A tally is one mark for each thing you count — and the fifth mark crosses the four, making a bundle of five." },
  pictogram: { scene: "pictogram", caption: "A pictogram shows counts with little pictures. A longer row means a bigger count." },
  "bar graph": { scene: "bargraph", caption: "A bar graph shows counts as bars. Watch each bar grow as more things are counted." },
  present: { scene: "bargraph", caption: "Presenting data means showing it so people can read it at a glance — like these growing bars." },
  "data scientist": { scene: "bargraph", caption: "A data scientist collects data and turns it into pictures like this, to find the story hiding in the numbers." },
  question: { scene: "questions", caption: "Some questions have one right answer. Others get a different answer from everybody — watch both kinds." },
  "statistical question": { scene: "questions", caption: "A statistical question gets many different answers — everybody answers differently, so you collect the answers as data." },
  "non-statistical question": { scene: "questions", caption: "A non-statistical question has just one right answer. One question, one answer — nothing to collect." },
  "numerical data": { scene: "datatypes", caption: "Numerical data is numbers — things you can count or measure, like the columns growing on the left." },
  "categorical data": { scene: "datatypes", caption: "Categorical data is named groups — like the coloured sets on the right. You sort things into them, not measure them." },
  form: { scene: "database", caption: "A form collects answers. Each filled-in form becomes one record — one row in the table." },
  store: { scene: "storage", caption: "Storing means keeping data safe so you can use it later. Watch the file go in and the light show it is kept." },
  backup: { scene: "storage", caption: "A backup is a second copy kept somewhere else. If the first copy is lost, the backup is still safe." },
  barcode: { scene: "barcode", caption: "A barcode's stripes hold a number. Watch the red scanner line sweep across and read it out." },

  // --- machines --------------------------------------------------------------
  computer: { scene: "general", caption: "Every computer does the same three things: takes something in, works on it, and puts something out." },
  input: { scene: "general", caption: "Input goes INTO the computer — watch the ball carry it in from the left." },
  output: { scene: "general", caption: "Output comes OUT of the computer when the work is done — watch it leave on the right." },
  "digital device": { scene: "devices", caption: "A digital device is a machine with a computer inside — a desktop, a laptop, a tablet, a phone." },
  device: { scene: "devices", caption: "A device is a machine you use to do a job — here are four with a computer inside." },
  portable: { scene: "devices", caption: "Portable means easy to pick up and carry. Watch the small devices move about while the desktop stays put." },
  hardware: { scene: "hardwaresoftware", caption: "Hardware is the parts you can touch — the box, the screen, the keyboard." },
  software: { scene: "hardwaresoftware", caption: "Software is the instructions flowing inside the hardware. You cannot touch it, but it makes everything work." },

  // --- the network -----------------------------------------------------------
  network: { scene: "network", caption: "A network is devices joined together so they can share. Watch the messages travel out and back." },
  connect: { scene: "network", caption: "Connecting joins a device to the others. Once joined, data can run along every link." },
  "smart device": { scene: "network", caption: "A smart device is connected to the network, so it can send and receive — watch the traffic." },
  internet: { scene: "network", caption: "The internet is millions of networks joined together, all passing messages like this." },
  share: { scene: "packets", caption: "Sharing sends a copy to someone else. Watch the pieces travel across and arrive at the other end." },
  message: { scene: "packets", caption: "A message travels in small pieces and is put back together where it arrives." },
  wired: { scene: "wiredwireless", caption: "A wired connection uses a cable. Watch the data pulse along the wire on the left." },
  wireless: { scene: "wiredwireless", caption: "A wireless connection uses invisible radio waves — no cable. Watch the data hop across the air on the right." },
  "wi-fi": { scene: "wiredwireless", caption: "Wi-Fi carries data through the air by radio — no cable. Watch it hop across on the right." },
  "standalone device": { scene: "online", caption: "A standalone device works on its own, with no link to the network — like this one while its link is gone." },
  "connected device": { scene: "online", caption: "A connected device has a link to the network. Watch the link form and the data start to flow." },
  available: { scene: "online", caption: "Available means the connection is there and working — data can flow along it." },
  "not available": { scene: "online", caption: "Not available means the link is broken. Nothing can flow until it comes back." },
  icon: { scene: "online", caption: "An icon is a little picture with a meaning. Watch the connection icon change as the link comes and goes." },
  // Unit 9 teaches the connection icons themselves as vocabulary, written out
  // as descriptions. They all mean "connected" or "not connected", which is
  // exactly what this scene alternates between.
  "a screen with a plug, or small arrows": { scene: "online", caption: "That icon means the device is connected — the link is there and data can flow." },
  "a crossed-out icon, or the words not connected": { scene: "online", caption: "That icon means the link is broken — watch the cross appear when the connection goes." },
  "a globe": { scene: "online", caption: "The globe icon means the internet — the whole world of networks your device can reach." },
  "a globe with a line through it": { scene: "online", caption: "A globe with a line through it means the internet cannot be reached — watch the link break." },
  "a message like you're offline": { scene: "online", caption: "Offline means no connection right now. Watch what changes when the link goes." },

  // --- keeping things private ------------------------------------------------
  "personal information": { scene: "encryption", caption: "Personal information belongs to you. Scrambling it keeps it private, so only the right person can read it." },
  private: { scene: "encryption", caption: "Private means only you, and people you choose, can read it. Scrambling the letters keeps it that way." },
  malware: { scene: "malware", caption: "Malware is a bad program that sneaks in and copies itself until the device's real work cannot get through." },
};

// Same lookup ladder as computingWordPicture: the exact term, then the term
// with its bracketed asides stripped — "group (category)", "Move forward
// (number)", "Wi-Fi (little curved lines, like a fan)" — then a
// singular/plural nudge. Unlike the picture map, a pair like "turn left /
// right" is NOT rejected: no single picture is honest about both directions,
// but an animation shows each in turn, so pairs simply have their own keys.
export function computingWordScene(term) {
  const clean = String(term || "").toLowerCase().replace(/’/g, "'").trim();
  if (!clean) return null;
  const candidates = [clean];
  const withoutAside = clean.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  if (withoutAside) candidates.push(withoutAside);
  for (const base of [...candidates]) {
    if (base.endsWith("s")) candidates.push(base.slice(0, -1));
    else candidates.push(`${base}s`);
  }
  for (const candidate of candidates) {
    const hit = COMPUTING_WORD_SCENES[candidate];
    if (hit) return hit;
  }
  return null;
}

// The word card's figure, on the exact shape computingDiagram() renders so
// initComputingWebGL() finds everything it binds: the [data-computing-figure]
// root, the toggle and reset buttons, and the no-WebGL fallback.
export function computingWordExplainer(term) {
  const entry = computingWordScene(term);
  if (!entry) return "";
  return `<figure class="computing-visual" data-computing-figure="word">
      <div class="geometry-stage"><canvas class="computing-webgl" data-computing-scene="${entry.scene}" role="img" aria-label="Interactive model. ${esc(entry.caption)}"></canvas><p class="geometry-fallback" hidden>This device cannot display the interactive model. Use the meaning and example instead.</p></div>
      <div class="geometry-controls"><button type="button" data-geometry-toggle>Pause animation</button><button type="button" data-geometry-reset>Reset view</button><span>Drag the model to turn it</span></div>
      <figcaption><span class="field-label">See it move:</span> ${esc(entry.caption)}</figcaption>
    </figure>`;
}
