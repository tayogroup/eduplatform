#!/usr/bin/env node

// Writes the STORY.txt and ATTRIBUTION.txt that sit beside each original
// picture book, for the Grade 1 second book (the Amal series), the Grade 2
// (Zuri) shelf and the Grade 3-4 (Amal) shelves.
//
// The Grade 1 FIRST book per unit is the animal storyworld (Kiki, Duku, Lulu)
// and still carries hand-typed copies; those are the ones this file exists to
// stop anybody writing more of.
//
// They are GENERATED, not hand-written, because the shipped words live in the
// catalogue in shell/subjects/english.js and nowhere else. The Grade 1 folders
// carry hand-typed copies of the same lines, and a hand-typed copy of shipped
// text is a copy that goes stale the first time a sentence is corrected — the
// review workbook then shows the reviewer a story the app no longer tells.
//
// Only the per-book notes below (unit, themes, cameos, vocabulary) are authored
// here. The page lines and the attribution come from the catalogue.
//
// Usage: node tools/write-english-ebook-docs.mjs [--dry]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ebooksRoot = path.join(root, "src", "prototypes", "ehel-academy", "english", "ebooks");
const shellPath = path.join(root, "src", "prototypes", "ehel-academy", "shell", "subjects", "english.js");
const shellSource = fs.readFileSync(shellPath, "utf8");
const dryRun = process.argv.includes("--dry");

// Same bracket slice the ebook gate uses, comments and all.
function literalBetweenBrackets(source, declaration) {
  const start = source.indexOf(declaration);
  if (start < 0) throw new Error(`${declaration} not found`);
  const open = source.indexOf("[", start);
  let depth = 0;
  let inString = null;
  let inComment = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (inComment) {
      if (inComment === "line" && ch === "\n") inComment = null;
      else if (inComment === "block" && ch === "*" && source[i + 1] === "/") { inComment = null; i += 1; }
      continue;
    }
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") { inComment = "line"; i += 1; continue; }
    if (ch === "/" && source[i + 1] === "*") { inComment = "block"; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "[") depth += 1;
    if (ch === "]") { depth -= 1; if (depth === 0) return source.slice(open, i + 1); }
  }
  throw new Error(`${declaration} is not closed`);
}

const catalog = vm.runInNewContext(`(${literalBetweenBrackets(shellSource, "const ebookCatalog = [")})`);

// The only authored content in this file: what each book is FOR. The unit
// vocabulary lines are the words the story deliberately reuses, taken from that
// unit's vocabularyGroups — a reviewer reads this to check the story is doing
// its revision job, so it must name the unit's own words, not a summary.
const NOTES = {
  "zuris-first-week": {
    series: "Zuri", book: 1, term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, spell, hello, goodbye, partner, friend, like, calendar, day, week, month, date, birthday, book, tablet, chart, word, the colours, one to twelve, first, second, twelfth",
    themes: "starting somewhere new, making the first friend of the year",
    cameos: "Miss Twiga, Kiki, the little elephant and the ostrich from the Grade 1 books.",
  },
  "who-helps-our-street": {
    series: "Zuri", book: 2, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, bus driver, window cleaner, police officer, firefighter, helmet, boots, gloves, doctor, nurse, teacher, farmer, shopkeeper, reporter, helping, teaching, rescuing, growing, driving",
    themes: "a neighbourhood is the people in it; wanting to help in your turn",
    cameos: "Duku the donkey as the farmer, Koko the hen as the shopkeeper, Miss Twiga teaching.",
  },
  "move-like-me": {
    series: "Zuri", book: 3, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, touch, turn, stand, reach, flap, exercise, healthy, strong, water, sleep, energy",
    themes: "moving every day, eating well, sleeping well",
    cameos: "Musa the zebra running the field; the little elephant and the ostrich join in.",
  },
  "zuri-and-her-shadow": {
    series: "Zuri", book: 4, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, long, short, high, low, bright, dark, grey, cloudy, sunny",
    themes: "noticing something ordinary and asking why; a whole day and night",
    cameos: "Miss Twiga explains the light; Zuri's mama at the burrow.",
  },
  "how-tall-how-long": {
    series: "Zuri", book: 5, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "measure, ruler, centimetre, metre, length, height, weight, size, circle, square, triangle, rectangle, heart, pattern, big, small, tall, short, heavy, light, wide, narrow, ten to one hundred",
    themes: "measuring turns 'bigger' into a number you can say",
    cameos: "Miss Twiga is the tall one; the chick from The Little Lost Chick is the small one.",
  },
  "the-six-leg-club": {
    series: "Zuri", book: 6, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "looking closely; a rule that decides what counts as an insect",
    cameos: "Kiki names the rule; Miss Twiga rules the spider out of the club.",
  },
  "one-small-seed": {
    series: "Zuri", book: 7, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, thankful, important",
    themes: "patience; looking after a place you share",
    cameos: "Miss Twiga hands out the seeds; Zuri's mama explains the roots.",
  },
  "every-home-is-different": {
    series: "Zuri", book: 8, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, flat, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "difference without ranking; belonging",
    cameos: "Kiki's tree house in the baobab, Musa on the open savanna.",
  },
  "a-day-in-the-big-city": {
    series: "Zuri", book: 9, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, market, shopping centre, underground, ferry, Ferris wheel, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "a big place is findable if you can read the map",
    cameos: "Lulu the swallow over the water, closing the journey she began in Grade 1.",
  },
  "zuris-book-of-the-year": {
    series: "Zuri", book: 10, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one page for each of Units 1-9: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "gathering a year up; looking forward to the next one",
    cameos: "the whole cast — Musa, Kiki, Duku, Lulu, Miss Twiga, the elephant and the ostrich.",
  },
  // ---- Grade 3: the Amal series. The cast is the course's own, so these notes
  // name the unit reading each book leans on, not just the theme.
  "the-family-who-helps": {
    series: "Amal", book: 1, term: "Term 1", unit: "Unit 1: All About Me and My Family",
    vocabulary: "family, parent, friend, student, junior, senior, behave, behaviour, respect, honour, duty, health, safety, private, public",
    themes: "a household where everybody is needed; respect as small daily acts",
    cameos: "Adam, Idris, Mina and Grandma Hana from the Unit 1 readings; Teacher Yasmin and Nora at school.",
  },
  "the-spelling-contest": {
    series: "Amal", book: 2, term: "Term 1", unit: "Unit 2: School and Learning",
    vocabulary: "teacher, author, library, graduate, mathematics, grammar, lesson, education, study, prepare, contest, report, topic, details, supply, eraser",
    themes: "effort beats talent; losing well",
    cameos: "Grandma Hana gives the advice; Idris lends the eraser. Amal does NOT win — the ending is deliberate.",
  },
  "the-calendar-on-the-wall": {
    series: "Amal", book: 3, term: "Term 1", unit: "Unit 3: Time and Daily Life",
    vocabulary: "January to December, calendar, hour, century, vacation, future, soon, sooner",
    themes: "a year is a thing you can hold; using the hours you have",
    cameos: "the poem on the last page is the one Amal writes in the Unit 3 reading.",
  },
  "the-places-that-help-us": {
    series: "Amal", book: 4, term: "Term 2", unit: "Unit 4: Places and Community",
    vocabulary: "doctor, officer, sailor, hospital, court, college, market, garden, exit, village, county, border, address",
    themes: "a community is the jobs its places do",
    cameos: "Omar the shopkeeper, calling out beside his baskets, exactly as in the Unit 4 reading.",
  },
  "the-wall-behind-the-garden": {
    series: "Amal", book: 5, term: "Term 2", unit: "Unit 5: Actions and Activities",
    vocabulary: "discuss, listen, offer, build, complete, remove, develop, protect, travel, escape, search, celebrate, happen",
    themes: "work shared out; a result you can point at",
    cameos: "the wall behind the garden is the Unit 5 reading's own; Nora, Omar and Grandma Hana all help.",
  },
  "the-girl-who-carried-kindness": {
    series: "Amal", book: 6, term: "Term 2", unit: "Unit 6: Describing People and Things",
    vocabulary: "kind, friendly, honest, kindness, care, busy, calm, able, careless, popular, rough, tough, similar, alive, favourite, extra",
    themes: "kindness as a choice you make again each morning, not a character trait",
    cameos: "cousin Noah and the two roads to school, both from the Unit 6 readings.",
  },
  "from-coast-to-forest": {
    series: "Amal", book: 7, term: "Term 3", unit: "Unit 7: Nature and the Environment",
    vocabulary: "climate, weather, temperature, sunshine, froze, mountain, forest, beach, coast, nature, explore, energy, matter, metal, planet",
    themes: "one planet seen three ways in a morning",
    cameos: "the trip is the Unit 7 reading's own — Amal, Nora and Teacher Yasmin, coast to forest to mountain.",
  },
  "the-mystery-of-the-million-shells": {
    series: "Amal", book: 8, term: "Term 3", unit: "Unit 8: Numbers, Shapes, and Measurement",
    vocabulary: "number, million, fact, pattern, straight, addition, subtraction, multiplication, division, measure, size, metre, height, weight, distance",
    themes: "measuring instead of counting; the size of a big number",
    cameos: "the million shells are the Unit 8 reading's own. The answer is 384,000 — deliberately not a million.",
  },
  "the-box-of-ideas": {
    series: "Amal", book: 9, term: "Term 3", unit: "Unit 9: Thinking, Feelings, and Imagination",
    vocabulary: "idea, imagine, reason, purpose, choice, sense, sadness, experience, sincere, thoughtful, hopeless, enjoyable, allow, suggest, enjoy, believe",
    themes: "naming a feeling makes it lighter; sadness as information",
    cameos: "the Box of Ideas and Sami's one line are both from the Unit 9 readings.",
  },
  "nine-doors": {
    series: "Amal", book: 10, term: "Term 3", unit: "Unit 10: My Year of Words (capstone)",
    vocabulary: "one door for each of Units 1-9: family, library, January, sailor, build, kindness, temperature, million, idea",
    themes: "gathering a year up and saying it out loud",
    cameos: "the Year 3 Showcase, from the Unit 10 readings; the whole cast returns.",
  },
  // ---- Grade 4: the same cast a year on, plus Maya the young reporter.
  "the-post-counter": {
    series: "Amal", book: 1, term: "Term 1", unit: "Unit 1: Daily Life & Communication",
    vocabulary: "mail, language, citizen, agree, continue, gain, effort, master, maintain, daily, usual, fair, necessary, peace, really, clearly",
    themes: "unglamorous daily effort; fairness as first come, first served",
    cameos: "Omar's post counter and Grandmother Salma are both from the Unit 1 readings; Maya lends the questions.",
  },
  "the-storm-and-the-science-tent": {
    series: "Amal", book: 2, term: "Term 1", unit: "Unit 2: Nature & Weather",
    vocabulary: "storm, hail, hurricane, tornado, foggy, snowy, breath, moisture, surface, temperature, solar, roam",
    themes: "preparation is not luck; a demonstration the weather gave for free",
    cameos: "the science fair and the storm are the Unit 2 readings' own.",
  },
  "from-farm-to-plate": {
    series: "Amal", book: 3, term: "Term 1", unit: "Unit 3: Food and Health",
    vocabulary: "sandwich, lamb, rice, spice, bakery, fresh, chewy, gather, brain, stomach, cattle, labour, famine, debt",
    themes: "seeing the whole trail behind a meal; who has plenty and who does not",
    cameos: "Omar at the market, Grandma Hana's kitchen, the clinic — all from the Unit 3 readings.",
  },
  "the-library-that-came-by-cart": {
    series: "Amal", book: 4, term: "Term 2", unit: "Unit 4: Community and Communication",
    vocabulary: "service, deliver, information, thought, discover, knowledge, challenge, priority, quality, judge, location, population",
    themes: "a library is a service, not a building; sharing what you find out",
    cameos: "the travelling library, Maya the young reporter and the town meeting are all Unit 4's own.",
  },
  "the-spiral-cave": {
    series: "Amal", book: 5, term: "Term 2", unit: "Unit 5: Action and Movement",
    vocabulary: "gallop, accelerate, proceed, spiral, rate, peek, gaze, signal, squeeze, pressure, rescue, defend, prevent, admit",
    themes: "stopping when you are winning; what you actually remember afterwards",
    cameos: "the village race, the lost goat and the spiral cave are the Unit 5 readings' own.",
  },
  "the-community-parade": {
    series: "Amal", book: 6, term: "Term 2", unit: "Unit 6: People in Society",
    vocabulary: "janitor, carpenter, labourer, engineer, merchant, governor, lawyer, artist, photographer, messenger, hero, refugee, immigrant, tenant",
    themes: "a town is the people who keep it working; a page of names",
    cameos: "the parade and the refugee and immigrant neighbours are both from the Unit 6 readings.",
  },
  "the-day-of-the-play": {
    series: "Amal", book: 7, term: "Term 3", unit: "Unit 7: Emotions, Behaviour, and Identity",
    vocabulary: "nervous, anxious, terrified, doubtful, curious, proud, gentle, polite, generous, selfish, serious, shy",
    themes: "brave is doing it WHILE you are frightened, not instead of",
    cameos: "the school play is the Unit 7 readings' own; Sami is their character too.",
  },
  "the-attic-clue": {
    series: "Amal", book: 8, term: "Term 3", unit: "Unit 8: Tools, Machines, and Everyday Items",
    vocabulary: "equipment, folder, briefcase, stapler, hardware, machinery, resources, curtain, attic, telescope, crew",
    themes: "an object that turns out to be a person, kept",
    cameos: "the attic and the telescope are from the Unit 8 readings; Grandma Hana's reading glasses from Grade 3.",
  },
  "the-day-we-got-lost": {
    series: "Amal", book: 9, term: "Term 3", unit: "Unit 9: Places, People, and Plans",
    vocabulary: "tourism, airport, station, railroad, capital, nation, museum, mall, restaurant, entrance, hallway, elevator, arrive, horizon",
    themes: "going the way the map says rather than the way you feel like going",
    cameos: "the trip to the capital is the Unit 9 readings' own.",
  },
  "nine-rooms": {
    series: "Amal", book: 10, term: "Term 3", unit: "Unit 10: My English Voice (capstone)",
    vocabulary: "one room for each of Units 1-9: mail, moisture, rice, service, spiral, carpenter, terrified, equipment, station",
    themes: "walking somebody else through a year you have had",
    cameos: "the Year 4 Exhibition and the poem \"Nine Rooms\" are both from the Unit 10 readings.",
  },

  "amals-first-day": {
    series: "Amal (Grade 1)", book: 1, term: "Term 1", unit: "Unit 1: Welcome to School",
    vocabulary: "table, chair, whiteboard, abc chart, clock, book, pencil, ruler, crayon, lunchbox, red, blue, green, yellow, teacher, friend, boy, girl, read, write, draw, sing, listen, point",
    themes: "a first day somewhere new; saying your own name out loud",
    cameos: "Adam, Samira and the teacher are the Unit 1 reading's own characters; Amal returns here every unit and again in the Grade 3 and Grade 4 books.",
  },
  "breakfast-at-grandmas-house": {
    series: "Amal (Grade 1)", book: 2, term: "Term 1", unit: "Unit 2: Family Time",
    vocabulary: "mother, mum, father, dad, sister, brother, grandma, grandpa, family, baby, grown-ups, children, cereal, milk, fruit, mango, banana, grapes, strawberries, one to ten, help, eat, talk, laugh, lay the table",
    themes: "a big family around one table; helping without being asked",
    cameos: "baby Idris, Ayeeyo and Grandpa come from the Unit 2 reading; Idris grows into the Grade 3 cast.",
  },
  "amal-and-the-big-ball": {
    series: "Amal (Grade 1)", book: 3, term: "Term 1", unit: "Unit 3: Fun and Games",
    vocabulary: "bounce, roll, throw, catch, run, jump, shake, share, take turns, big, red, ball, tree, branch, up, down",
    themes: "letting the smallest player join; the game is better shared",
    cameos: "Samira and little Leo are named in the Unit 3 reading; Adam is the same big brother as in Units 4, 5 and 9.",
  },
  "amal-makes-a-mat": {
    series: "Amal (Grade 1)", book: 4, term: "Term 2", unit: "Unit 4: Making Things",
    vocabulary: "make, weave, cut, draw, try, circle, square, triangle, rectangle, red, blue, green, yellow, grass, mat, paper, crayons, neat, bumpy",
    themes: "the first try is allowed to be bad; patience is how good things get made",
    cameos: "Ayeeyo the grandmother and little Hodan are both from the Unit 4 reading.",
  },
  "amal-and-the-little-hen": {
    series: "Amal (Grade 1)", book: 5, term: "Term 2", unit: "Unit 5: On the Farm",
    vocabulary: "cow, hen, chick, sheep, goat, moo, baa, cluck, farm, barn, field, seed, egg, tractor, feeding, planting, growing, milk, bread",
    themes: "kindness to animals comes back to you; everything on a farm grows",
    cameos: "Ayeeyo keeps the farm in the Unit 5 reading; Adam drives the tractor there too.",
  },
  "amal-at-the-market": {
    series: "Amal (Grade 1)", book: 6, term: "Term 2", unit: "Unit 6: My Five Senses",
    vocabulary: "see, hear, smell, taste, touch, eyes, ears, nose, tongue, hands, soft, hard, loud, sweet, cold, juicy, big, bigger",
    themes: "one busy place, met five different ways; being thankful for the senses",
    cameos: "Omar the shopkeeper is named in the Unit 6 reading and returns in Unit 9 and in the Grade 3 books.",
  },
  "amals-big-bus-ride": {
    series: "Amal (Grade 1)", book: 7, term: "Term 3", unit: "Unit 7: Let's Go!",
    vocabulary: "walk, bus, car, bicycle, boat, wheels, seat, drive, ride, float, road, town, sea, fast, slow, sit down",
    themes: "a journey told by what goes past the window",
    cameos: "Adam on his bicycle and Samira on her way to school both wave from the Unit 7 reading.",
  },
  "the-well-in-the-village": {
    series: "Amal (Grade 1)", book: 8, term: "Term 3", unit: "Unit 8: Wonderful Water",
    vocabulary: "water, well, rain, drop, pot, wet, dry, clean, drink, wash, cook, grow, share, river, cloud, grey",
    themes: "sharing a scarce thing; the relief when the rain finally comes",
    cameos: "Adam carries the pot and little Hodan drinks the first cup, both from the Unit 8 reading.",
  },
  "a-walk-around-town": {
    series: "Amal (Grade 1)", book: 9, term: "Term 3", unit: "Unit 9: City Places",
    vocabulary: "school, market, hospital, library, park, road, shop, bin, teacher, doctor, shopkeeper, neighbour, red, green, stop, go, clean, busy, quiet, polite",
    themes: "a town is the people who help in it; everyone keeps it clean",
    cameos: "Omar the shopkeeper, Faduma the doctor and Leo are all named in the Unit 9 reading; Ayeeyo is waiting in the library.",
  },
  "amals-english-year": {
    series: "Amal (Grade 1)", book: 10, term: "Term 3", unit: "Unit 10: My First English World",
    vocabulary: "a review of the year: letters, family, colours, shapes, numbers, farm animals, the five senses, vehicles, water and town places",
    themes: "looking back at a whole year of work; being proud of it out loud",
    cameos: "every earlier book in the series is in the folder Amal opens - the alphabet from Unit 1, the farm from Unit 5, the senses from Unit 6, the bus from Unit 7.",
  },
};

let written = 0;
for (const book of catalog) {
  const notes = NOTES[book.id];
  if (!notes) continue;
  const bookDir = path.join(ebooksRoot, book.id);
  if (!fs.existsSync(bookDir)) throw new Error(`${book.id}: no illustration folder. Run create-grade2-ebook-illustrations.js first.`);

  const story = [
    book.title.toUpperCase(),
    `Grade ${book.grades.join(" and ")} - ${book.level}`,
    `${notes.series} series, book ${notes.book} (${notes.term}, ${notes.unit})`,
    "",
    ...book.pages.map((page, index) => `${index + 1}. ${page.text}`),
    "",
    `Unit vocabulary reinforced: ${notes.vocabulary}.`,
    `Themes: ${notes.themes}`,
    `Cameos: ${notes.cameos}`,
    "",
    "GENERATED by tools/write-english-ebook-docs.mjs from the ebookCatalog entry",
    "in shell/subjects/english.js. Edit the catalogue, then re-run - never this file.",
    "",
  ].join("\n");

  const attribution = [
    `${book.attribution}`,
    "",
    `Story: ${book.author}`,
    `Illustrations: ${book.illustrator} - original animated vector pages from`,
    "the shared series kit in tools/lib/ehel-ebook-kit.js and",
    "tools/lib/ehel-ebook-kit-grade2.js, composed by",
    "tools/create-grade2-ebook-illustrations.js.",
    "",
    "GENERATED by tools/write-english-ebook-docs.mjs.",
    "",
  ].join("\n");

  for (const [name, contents] of [["STORY.txt", story], ["ATTRIBUTION.txt", attribution]]) {
    const file = path.join(bookDir, name);
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (current === contents) continue;
    if (dryRun) { console.log(`would write ${path.relative(root, file)}`); continue; }
    fs.writeFileSync(file, contents, "utf8");
    written += 1;
  }
}

console.log(dryRun ? "dry run complete" : `Wrote ${written} companion file${written === 1 ? "" : "s"}.`);
