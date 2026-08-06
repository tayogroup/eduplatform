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
  laptop: "💻", desktop: "🖥️", tablet: "📱", smartphone: "📱", android: "📱",
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
  file: "📄", "text file": "📄", text: "📄", page: "📄", document: "📄",
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
  "count-controlled loop": "🔁", edit: "✏️", correct: "✅", scratch: "🐱",
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

// A term is looked up on its own, then with the asides this vocabulary carries
// stripped. The source packs write several entries as a word plus an
// explanation — "program (app)", "screen (a screen for a computer is called a
// monitor)", "wi-fi (little curved lines, like a fan)" — and a few as a pair,
// "marker down / up", "test / testing". Both forms are tried before giving up,
// and giving up means no picture rather than a guess.
export function computingWordPicture(term) {
  const clean = String(term || "").toLowerCase().trim();
  if (!clean) return "";
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
    const hit = COMPUTING_WORD_PICTURES[candidate];
    if (hit) return hit;
  }
  return "";
}
