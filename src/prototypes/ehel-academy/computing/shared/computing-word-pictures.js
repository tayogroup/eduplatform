// A picture for each Computing vocabulary word.
//
// Modelled on shell/subjects/word-pictures.js, and deliberately NOT sharing its
// map. Computing redefines ordinary words: a mouse is a pointing device, a key
// is part of a keyboard or a cipher, a table is rows and columns, a cell is a
// box in a spreadsheet, a field is a column in a database, a block is something
// you drag in Scratch. Falling back to the English map would put an animal
// beside "mouse" and a caterpillar beside "bug" on a Stage 1 computing card,
// which is exactly the failure the English file was written to stop.
//
// Same rule as that file, applied to this subject: the picture must BE the word.
// Where no honest picture exists the word is simply absent and the card shows
// none. That covers most of this vocabulary, because most of it is abstract —
// algorithm, decomposition, iteration, computational thinking, condition,
// efficient, precise, sequence. A five-year-old reads the picture as part of the
// lesson, so a decorative stand-in teaches something false.
//
// Some words are left out on purpose even though an emoji exists:
//   bug, debug     🐛 is the etymology and every developer's icon, but a learner
//                  being told "a bug is a mistake in your program" would read the
//                  caterpillar as the lesson.
//   virus, malware 🦠 is the biological one. The same misreading, with worse
//                  consequences for a child forming their first idea of it.
//   hacker         no emoji says "person who breaks into systems" without either
//                  glamorising it or drawing a burglar.
//   sprite, table, cell, field, block — the everyday emoji means the everyday
//                  word, not the computing one.
export const COMPUTING_WORD_PICTURES = {
  // --- machines you can point at -------------------------------------------
  computer: "💻", "computing device": "💻", "digital device": "📱",
  "smart device": "📱", "connected device": "📱", "physical computing device": "🤖",
  "computer-controlled device": "🤖",
  // "standalone device" is defined by what it is NOT — a device off the network.
  // A laptop pictures a laptop, not the absence of a connection.
  laptop: "💻", desktop: "🖥️", tablet: "📱", smartphone: "📱",
  // "android" is Stage 1's "a robot that looks like a person", NOT the phone OS.
  android: "🤖",
  screen: "🖥️", monitor: "🖥️", keyboard: "⌨️", mouse: "🖱️",
  printer: "🖨️", "multifunction machine": "🖨️",
  robot: "🤖", drone: "🚁", "driverless vehicle": "🚗",
  "speaker or headphones": "🎧", speaker: "🔊", headphones: "🎧",
  led: "💡", "led display": "💡", wire: "🔌", wired: "🔌", ethernet: "🔌",
  "storage device": "💾", backup: "💾",

  // --- sensors: the thing each one measures --------------------------------
  // Only where the emoji IS what the sensor reads. A light sensor is not a
  // torch — it detects light rather than making it — so it has none.
  "temperature sensor": "🌡️", "distance sensor": "📏",

  // --- the network ---------------------------------------------------------
  internet: "🌐", "world wide web": "🌐", website: "🌐", browser: "🌐",
  hyperlink: "🔗", "wi-fi": "📶", wireless: "📶", "radio waves": "📶",
  message: "💬", communicate: "💬", email: "✉️",

  // --- keeping things private ----------------------------------------------
  key: "🔑", encrypt: "🔒", encryption: "🔒", encode: "🔒", cipher: "🔒",
  decrypt: "🔓", decode: "🔓", private: "🔒", "personal information": "🔒",

  // --- files ---------------------------------------------------------------
  file: "📄", "text file": "📄", text: "📄", document: "📄",
  // No picture for "page". Stage 2 defines it as "a scene in the story. A new
  // page is a new place" — a ScratchJr scene, not a sheet of paper. This is the
  // exact trap the header warns about, and it got in anyway.
  "image file": "🖼️", "audio file": "🎵", "video file": "🎬", animation: "🎬",
  music: "🎵", melody: "🎵", note: "🎵", beat: "🥁", volume: "🔊", audio: "🔊",

  // --- data you can see ----------------------------------------------------
  "bar chart": "📊", "bar graph": "📊", "column chart": "📊", "block graph": "📊",
  spreadsheet: "📊", database: "🗄️", "digital database": "🗄️",
  "physical database": "🗄️", search: "🔍", date: "📅",
  number: "🔢", count: "🔢", currency: "💰", question: "❓",

  // --- what a program does -------------------------------------------------
  "start program": "▶️", run: "▶️", pause: "⏸️", "stop program": "⏹️",
  reset: "🔄", loop: "🔁", repeat: "🔁", "repeat loop": "🔁", "forever loop": "🔁",
  "repeat block": "🔁", "forever block": "🔁", "repeat until loop": "🔁",
  "count-controlled loop": "🔁", edit: "✏️", scratch: "🐱",
  // No picture for "correct". Stage 3 teaches it as a VERB — "to fix a mistake",
  // debugging vocabulary — and a tick mark says "right answer", which is the
  // adjective. The part of speech is the whole lesson there.
  scratchjr: "🐱",
  // No picture for program / app. Stage 1 defines it as "a set of steps a
  // computer follows", and 📱 draws the device an app runs ON — a learner would
  // read it as "a program is a phone". The steps are the idea; nothing pictures
  // them. (Scratch keeps its cat: that cat IS the Scratch logo.)

  // --- moving something about ----------------------------------------------
  arrow: "➡️", "move forward": "⬆️", "step up": "⬆️", "step down": "⬇️",
  "step left": "⬅️", "step right": "➡️", "turn left": "⬅️", "turn right": "➡️",
  direction: "🧭", path: "🛣️", coordinates: "📍", distance: "📏",
  square: "🟦", shape: "🔷",

  // --- people who do this for a living -------------------------------------
  programmer: "🧑‍💻", "computer scientist": "🧑‍💻", "data scientist": "🧑‍💻",
  "data analyst": "🧑‍💻", "game developer": "🧑‍💻", "games developer": "🧑‍💻",
  "robotics engineer": "🧑‍🔧",
};

// Per-stage senses, on the model of STAGE_WORD_PICTURES in
// science/shared/science-word-pictures.js. An empty string means "this stage
// teaches a sense the shared picture is wrong for", so the card shows none.
//
// Both entries here are ambiguous WITHIN one stage, taught by two different
// units, so no stage entry can be right for both and the stage shows nothing:
//
//   key        Stage 3 "Be a Data Expert" means a chart LEGEND — "it tells you
//              what each picture or colour means". Stage 3 "Sending Secret
//              Messages" means the cipher key. A padlock key is wrong for the
//              first; Stage 5 confirms the reading by defining "legend" as "a
//              key on a chart". Stage 4's cipher key keeps it.
//   bar chart  Stage 3 "Be a Data Expert" teaches it AGAINST "column chart" in
//              the same list — "bars lying down (across)" versus "columns
//              standing up". The emoji draws vertical bars, so it is right for
//              the column chart and wrong for the bar chart, and putting it on
//              both teaches that the distinction the unit is making does not
//              exist. Stage 5's generic bar chart keeps it.
export const STAGE_WORD_PICTURES = {
  3: { key: "", "bar chart": "" },
};

// A term is looked up on its own, then with the asides this vocabulary carries
// stripped. The source packs write several entries as a word plus an
// explanation — "program (app)", "screen (a screen for a computer is called a
// monitor)", "wi-fi (little curved lines, like a fan)" — and a few as a pair,
// "marker down / up", "test / testing". Both forms are tried before giving up,
// and giving up means no picture rather than a guess.
export function computingWordPicture(term, stage) {
  const clean = String(term || "").toLowerCase().trim();
  if (!clean) return "";
  const perStage = STAGE_WORD_PICTURES[stage];
  if (perStage && Object.prototype.hasOwnProperty.call(perStage, clean)) return perStage[clean];
  const candidates = [clean];
  const withoutAside = clean.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  if (withoutAside) candidates.push(withoutAside);
  // A term written as a pair — "turn left / right", "marker down / up" — names
  // two things at once, and no single picture is honest about both: an ⬅️ beside
  // "turn left / right" teaches that it only goes left. Pairs get none.
  if (/\s\/\s/.test(withoutAside)) return "";
  // Plural to singular, for the entries a unit writes as "instructions" or
  // "coordinates" where the map holds the singular (and vice versa).
  for (const base of [...candidates]) {
    if (base.endsWith("s")) candidates.push(base.slice(0, -1));
    else candidates.push(`${base}s`);
  }
  for (const candidate of candidates) {
    if (perStage && Object.prototype.hasOwnProperty.call(perStage, candidate)) return perStage[candidate];
    const hit = COMPUTING_WORD_PICTURES[candidate];
    if (hit) return hit;
  }
  return "";
}
