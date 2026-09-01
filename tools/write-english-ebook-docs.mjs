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

// Which Grade 4 books the shelf generator draws, read out of that generator's
// own book map. Requiring the module is not an option — it writes 480 files on
// import — and restating the list here would be a second copy free to drift
// from the one that actually draws the pages.
const shelfSource = fs.readFileSync(path.join(root, "tools", "create-grade4-shelf-ebook-illustrations.js"), "utf8");
const shelfMap = shelfSource.slice(shelfSource.indexOf("const books = {"));
const shelfBookIds = [...shelfMap.matchAll(/dir: "([a-z0-9-]+)"/g)].map((match) => match[1]);
if (shelfBookIds.length !== 40) throw new Error(`Expected 40 Grade 4 shelf books, read ${shelfBookIds.length}.`);

// The same trick for Grade 1's books three to five. Grade 1 is now drawn by
// THREE generators — the animal fable from create-musa-ebook-illustrations.js,
// the Amal series from create-amal-ebook-illustrations.js, and these thirty
// from their own — so a single per-grade entry in DRAWN_BY below can no longer
// name the right tool for every Grade 1 book.
const grade1ShelfSource = fs.readFileSync(path.join(root, "tools", "create-grade1-shelf-ebook-illustrations.js"), "utf8");
const grade1ShelfMap = grade1ShelfSource.slice(grade1ShelfSource.indexOf("const books = {"));
const grade1ShelfBookIds = [...grade1ShelfMap.matchAll(/dir: "([a-z0-9-]+)"/g)].map((match) => match[1]);
if (grade1ShelfBookIds.length !== 30) throw new Error(`Expected 30 Grade 1 shelf books, read ${grade1ShelfBookIds.length}.`);

// And again for Grade 2's books four to seven. Grade 2 is now drawn by two
// generators as well — the Zuri books from create-grade2-ebook-illustrations.js,
// and these forty from their own.
const grade2ShelfSource = fs.readFileSync(path.join(root, "tools", "create-grade2-shelf-ebook-illustrations.js"), "utf8");
const grade2ShelfMap = grade2ShelfSource.slice(grade2ShelfSource.indexOf("const books = {"));
const grade2ShelfBookIds = [...grade2ShelfMap.matchAll(/dir: "([a-z0-9-]+)"/g)].map((match) => match[1]);
if (grade2ShelfBookIds.length !== 40) throw new Error(`Expected 40 Grade 2 shelf books, read ${grade2ShelfBookIds.length}.`);

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
  "the-word-hunt": {
    series: "Zuri", book: "1b", term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "book, tablet, chart, picture, word, red, blue, green, yellow, pink, one to twelve, spell",
    themes: "English is not only in the lesson; noticing is a skill you can practise",
    cameos: "Miss Twiga sets the hunt; Kiki finds the last two; the shopkeeper hen at her stall.",
  },
  "this-is-my-partner": {
    series: "Zuri", book: "1c", term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, spell, partner, friend, like, likes, hello, goodbye, the days of the week, the months of the year, first, second, third",
    themes: "listening well enough to speak for somebody else",
    cameos: "Miss Twiga sets the task; the little elephant, the ostrich, a goat and a hen make up the class.",
  },
  "who-helps-our-street": {
    series: "Zuri", book: 2, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, bus driver, window cleaner, police officer, firefighter, helmet, boots, gloves, doctor, nurse, teacher, farmer, shopkeeper, reporter, helping, teaching, rescuing, growing, driving",
    themes: "a neighbourhood is the people in it; wanting to help in your turn",
    cameos: "Duku the donkey as the farmer, Koko the hen as the shopkeeper, Miss Twiga teaching.",
  },
  "the-day-the-fire-bell-rang": {
    series: "Zuri", book: "2b", term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "firefighter, helmet, boots, gloves, ladder, hose, equipment, rescuing, heavy, safe",
    themes: "equipment is not a costume; wanting the job in your turn",
    cameos: "the window cleaner monkey up the ladder; the shopkeeper hen; Miss Twiga's follow-up lesson.",
  },
  "zuri-asks-the-questions": {
    series: "Zuri", book: "2c", term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "reporter, interview, question, answer, driving, cleaning, selling, growing, helping, teaching, rescuing",
    themes: "a question is a tool; a job is what somebody is doing right now",
    cameos: "every helper from Who Helps Our Street? answers in their own words - Duku the donkey farming, Koko the hen selling.",
  },
  "move-like-me": {
    series: "Zuri", book: 3, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, touch, turn, stand, reach, flap, exercise, healthy, strong, water, sleep, energy",
    themes: "moving every day, eating well, sleeping well",
    cameos: "Musa the zebra running the field; the little elephant and the ostrich join in.",
  },
  "sports-day-at-the-tree-school": {
    series: "Zuri", book: "3b", term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "run, hop, jump, throw, clap, water, fruit, energy, healthy, strong, fast, last",
    themes: "finishing is the achievement; fast is a separate thing from strong",
    cameos: "Musa the zebra and the ostrich race; the little elephant throws; Miss Twiga starts and closes the day. Zuri comes LAST - the ending is deliberate.",
  },
  "miss-twiga-says": {
    series: "Zuri", book: "3c", term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "stand, sit, touch, clap, wiggle, nod, turn, reach, head, hands, fingers",
    themes: "an instruction is heard, then done; giving one is harder than following one",
    cameos: "Miss Twiga leads and then hands the front of the class to Zuri; Kiki is the one still reaching.",
  },
  "zuri-and-her-shadow": {
    series: "Zuri", book: 4, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, long, short, high, low, bright, dark, grey, cloudy, sunny",
    themes: "noticing something ordinary and asking why; a whole day and night",
    cameos: "Miss Twiga explains the light; Zuri's mama at the burrow.",
  },
  "what-is-the-weather-today": {
    series: "Zuri", book: "4b", term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "weather, sunny, cloudy, rainy, windy, hot, cold, cloud, rain, rainbow, star, chart",
    themes: "weather changes and that is normal; a chart turns a week into something you can read",
    cameos: "Miss Twiga names the words; Kiki asks the last question.",
  },
  "where-does-the-sun-go": {
    series: "Zuri", book: "4c", term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "sunrise, morning, midday, evening, sunset, night, moon, star, shadow, long, short, high, low, turn",
    themes: "the answer is not where the sun goes but what WE do; day and night as one motion",
    cameos: "Miss Twiga's ball-as-the-Earth explanation is the Unit 4 listening's own.",
  },
  "how-tall-how-long": {
    series: "Zuri", book: 5, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "measure, ruler, centimetre, metre, length, height, weight, size, circle, square, triangle, rectangle, heart, pattern, big, small, tall, short, heavy, light, wide, narrow, ten to one hundred",
    themes: "measuring turns 'bigger' into a number you can say",
    cameos: "Miss Twiga is the tall one; the chick from The Little Lost Chick is the small one.",
  },
  "the-shape-hunt": {
    series: "Zuri", book: "5b", term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "circle, square, triangle, rectangle, heart, shape, pattern, next, roof, window, door, wheel",
    themes: "a shape is a way of looking, not a thing on a worksheet",
    cameos: "Miss Twiga starts the hunt; Kiki sets the harder pattern and gets the rectangle wrong on purpose.",
  },
  "ten-twenty-one-hundred": {
    series: "Zuri", book: "5c", term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "ten to one hundred, count, big, small, tall, short, heavy, light, long, wide, narrow, metre",
    themes: "counting in tens is a shortcut you can prove; opposites come in pairs",
    cameos: "the little elephant and the chick are the big and the small; Miss Twiga is the tall one, as she is in How Tall? How Long?",
  },
  "the-six-leg-club": {
    series: "Zuri", book: 6, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "looking closely; a rule that decides what counts as an insect",
    cameos: "Kiki names the rule; Miss Twiga rules the spider out of the club.",
  },
  "where-is-the-cricket": {
    series: "Zuri", book: "6b", term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "on, under, in, between, above, in front of, behind, cricket, ant, butterfly, bee, worm, spider, chirp, listen",
    themes: "a search is a list of places; watching beats catching",
    cameos: "the whole Six-Leg Club cast returns as wrong answers, one per position word. Kiki is there but Zuri finds it alone.",
  },
  "the-ants-and-the-big-crumb": {
    series: "Zuri", book: "6c", term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "crawl, carry, push, lift, collect, ant, anthill, crumb, heavy, together, over, under, into",
    themes: "one is not enough and ten is; going for help is not giving up",
    cameos: "the anthill and the marching line are the Six-Leg Club's own; the crumb is Zuri's breakfast.",
  },
  "one-small-seed": {
    series: "Zuri", book: 7, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, thankful, important",
    themes: "patience; looking after a place you share",
    cameos: "Miss Twiga hands out the seeds; Zuri's mama explains the roots.",
  },
  "the-stream-clean-up": {
    series: "Zuri", book: "7b", term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "litter, picking up, recycling, paper, tins, glass, clean, water, bank, thankful, important",
    themes: "somebody made the mess and we can still be the ones who clear it",
    cameos: "Miss Twiga asks the two questions; the little elephant carries what nobody else can.",
  },
  "thank-you-tree": {
    series: "Zuri", book: "7c", term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "roots, stem, leaves, flower, seeds, tree, air, water, soil, shade, planting, watering, thankful",
    themes: "an ordinary tree doing five jobs at once; noticing what is already working",
    cameos: "the acacia is the tree school's own; the nest and the bees return from Every Home Is Different.",
  },
  "every-home-is-different": {
    series: "Zuri", book: 8, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, flat, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "difference without ranking; belonging",
    cameos: "Kiki's tree house in the baobab, Musa on the open savanna.",
  },
  "a-room-for-everything": {
    series: "Zuri", book: "8b", term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "kitchen, dining room, living room, bedroom, bathroom, bed, table, chair, sofa, sink, rug, window, shelf",
    themes: "five rooms and one room are both enough; comparing without ranking",
    cameos: "Kiki's tree house in the baobab and Zuri's burrow, both from Every Home Is Different.",
  },
  "far-away-homes": {
    series: "Zuri", book: "8c", term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "adobe house, stilt house, cave house, skyscraper, nest, hive, burrow, hut, flat, walls, roof, door",
    themes: "a home is shaped by the place it stands in; the same welcome inside every one",
    cameos: "Miss Twiga's big book of homes; the nest, the hive and the burrow return from Every Home Is Different.",
  },
  "a-day-in-the-big-city": {
    series: "Zuri", book: 9, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, market, shopping centre, underground, ferry, Ferris wheel, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "a big place is findable if you can read the map",
    cameos: "Lulu the swallow over the water, closing the journey she began in Grade 1.",
  },
  "ten-oclock-at-the-aquarium": {
    series: "Zuri", book: "9b", term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "aquarium, schedule, o'clock, octopus, penguin, turtle, shark, fish, clever, fast, slow, huge, scary, beautiful",
    themes: "a timetable is a promise you can read; standing next to a frightened friend",
    cameos: "the aquarium is the Unit 9 reading's own. Kiki is the one who is frightened - and it is not treated as funny.",
  },
  "which-way-to-the-library": {
    series: "Zuri", book: "9c", term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "map, directions, straight ahead, left, right, cross, library, market, shopping centre, clock tower, traffic",
    themes: "trusting the map over the feeling; a big place is findable",
    cameos: "the zebra crossing is the Unit 9 poem's own; the library closes the journey A Day in the Big City started.",
  },
  "zuris-book-of-the-year": {
    series: "Zuri", book: 10, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one page for each of Units 1-9: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "gathering a year up; looking forward to the next one",
    cameos: "the whole cast — Musa, Kiki, Duku, Lulu, Miss Twiga, the elephant and the ostrich.",
  },
  "zuri-makes-a-plan": {
    series: "Zuri", book: "10b", term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "plan, choose, collect, draw, write, check, page, step, first, next, last, mistake",
    themes: "the plan is the work; checking somebody else's page is easier than checking your own",
    cameos: "the project brief is the Unit 10 reading's own; Kiki is the second pair of eyes.",
  },
  "the-day-of-the-showcase": {
    series: "Zuri", book: "10c", term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "showcase, present, page, easel, family, clap, card, name, spell, goodbye, hello",
    themes: "doing it while your hands shake; a year said out loud to somebody else",
    cameos: "Showcase Day is the Unit 10 listening's own; Musa, Duku, Lulu, Miss Twiga and Zuri's mama all come.",
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
  // ---- Grade 3, books 2, 3 and 4 of each unit. The `book` field names the slot
  // and the source text, because the four books of a unit are not a series in
  // reading order — a reviewer needs to know which of the unit's five texts each
  // one retells before they can judge whether it does its revision job.
  "junior": {
    series: "Amal", book: "2 of 4, from the story \"Amal's Big Day\"", term: "Term 1", unit: "Unit 1: All About Me and My Family",
    vocabulary: "junior, senior, student, behave, behaviour, respect, honour, duty, health, safety, public, private",
    themes: "being the youngest; a nickname that changes meaning because you did something",
    cameos: "the drama club and the health-and-safety play are the Unit 1 story's own; Adam joined the club first, as the reading says.",
  },
  "the-interview": {
    series: "Amal", book: "3 of 4, from the listening text \"Amal Talks About Her Family\"", term: "Term 1", unit: "Unit 1: All About Me and My Family",
    vocabulary: "family, parent, student, role model, respect, honour, duty",
    themes: "a question you cannot answer in the abstract; answering it by describing what people actually do",
    cameos: "Maya asks the questions; the answers are Amal's own from the Unit 1 interview.",
  },
  "minas-two-voices": {
    series: "Amal", book: "4 of 4, from the listening text \"Public and Private\"", term: "Term 1", unit: "Unit 1: All About Me and My Family",
    vocabulary: "public, private, behave, behaviour, safety, calm, respect",
    themes: "the rule is about the people around you, not about volume",
    cameos: "Mina's promise to remember at the market tomorrow is the last line of the Unit 1 listening text. This book is that tomorrow.",
  },
  "a-normal-day-at-school": {
    series: "Amal", book: "2 of 4, from the reading \"A Day at School\"", term: "Term 1", unit: "Unit 2: School and Learning",
    vocabulary: "teacher, author, library, graduate, mathematics, grammar, lesson, education, study, prepare, topic, details, eraser",
    themes: "an ordinary day is the thing that adds up; wanting the teacher's job",
    cameos: "told by Adam, whose reading it is; Maya, Daniel, Theo and Nora are his classmates in it.",
  },
  "the-grammar-champions": {
    series: "Amal", book: "3 of 4, from the story of the same name", term: "Term 1", unit: "Unit 2: School and Learning",
    vocabulary: "contest, report, topic, details, supply, prepare, study, grammar, author, library, graduate",
    themes: "a group that wins because its lesson was clear, not because it was clever",
    cameos: "Daniel and Nora are the group; this is the contest Amal WINS, which is why book two of the shelf gives her one she does not.",
  },
  "the-quietest-room": {
    series: "Amal", book: "4 of 4, from the listening dialogue \"In the Classroom\"", term: "Term 1", unit: "Unit 2: School and Learning",
    vocabulary: "author, library, topic, details, report, eraser, prepare, study, lesson",
    themes: "a topic is not found on a shelf; it is the thing you already thought and had not said",
    cameos: "Maya's clever camel and Daniel's scientist are both books from the Unit 2 dialogue.",
  },
  "six-oclock-seven-oclock": {
    series: "Amal", book: "2 of 4, from the reading \"My Day, Hour by Hour\"", term: "Term 1", unit: "Unit 3: Time and Daily Life",
    vocabulary: "hour, o'clock, calendar, soon, sooner, future",
    themes: "a day has room in it if the things go in order",
    cameos: "told by Idris, whose reading it is; Sami walks to school with him, exactly as the text says.",
  },
  "twelve-months-of-work": {
    series: "Amal", book: "3 of 4, from the reading \"The Twelve Months\"", term: "Term 1", unit: "Unit 3: Time and Daily Life",
    vocabulary: "January to December, calendar, hour, century, vacation, future",
    themes: "the same twelve months, doing different work for a school, a family and a farm",
    cameos: "the school year running January to November, with the long holiday in December, is the Unit 3 reading's own.",
  },
  "samis-calendar": {
    series: "Amal", book: "4 of 4, from the listening text \"Making a Calendar\"", term: "Term 1", unit: "Unit 3: Time and Daily Life",
    vocabulary: "January to December, calendar, future, soon, sooner",
    themes: "two calendars with the same twelve months and completely different years in them",
    cameos: "Amal's June football, August house and October mangoes are the three she describes in the Unit 3 text.",
  },
  "the-bus-to-the-county": {
    series: "Amal", book: "2 of 4, from the story \"From Our Village to the County\"", term: "Term 2", unit: "Unit 4: Places and Community",
    vocabulary: "doctor, officer, sailor, hospital, court, college, market, garden, exit, village, county, border, address",
    themes: "the county is the village, only bigger; every place doing one job",
    cameos: "Nadia the driver, Doctor Sarah and Officer Rami are all named in the Unit 4 story; Adam meets the class at the college gate there too.",
  },
  "places-i-know": {
    series: "Amal", book: "3 of 4, from the poem \"Places I Know\"", term: "Term 2", unit: "Unit 4: Places and Community",
    vocabulary: "village, market, court, garden, hospital, college, library, officer, doctor, address, county",
    themes: "a poem naming the place you actually live; then your own verse under it",
    cameos: "pages 2 to 6 are the unit's poem itself, one line to a page; the rest is Amal's own list.",
  },
  "friday-at-the-market": {
    series: "Amal", book: "4 of 4, from the listening text \"At the Market\"", term: "Term 2", unit: "Unit 4: Places and Community",
    vocabulary: "market, garden, exit, village, county, address, doctor, officer",
    themes: "a crowd is only a crowd if you have no plan",
    cameos: "the eight o'clock meeting at the gate and the basket for the rice are the last lines of the Unit 4 dialogue.",
  },
  "helping-hands": {
    series: "Amal", book: "2 of 4, from the reading of the same name", term: "Term 2", unit: "Unit 5: Actions and Activities",
    vocabulary: "offer, listen, discuss, complete, celebrate, happen, protect",
    themes: "one small offer of help, and the feeling that stays with you afterwards",
    cameos: "Nora and Omar's heavy basket is the Unit 5 reading, told from Nora's side.",
  },
  "first-the-seeds": {
    series: "Amal", book: "3 of 4, from the listening plan \"Planning the Garden\"", term: "Term 2", unit: "Unit 5: Actions and Activities",
    vocabulary: "search, build, protect, develop, complete, celebrate, discuss, offer",
    themes: "a plan you can say in order is a plan you can finish; waiting is one of the steps",
    cameos: "Leo's four steps - seeds, fence, water, celebration - are the Unit 5 spoken plan, in its own order.",
  },
  "the-night-the-wall-shook": {
    series: "Amal", book: "4 of 4, from the listening recount \"What Happened?\"", term: "Term 2", unit: "Unit 5: Actions and Activities",
    vocabulary: "happen, complete, build, protect, remove, discuss, offer, listen",
    themes: "finishing the part nobody sees; the repair is the story, not the rescue",
    cameos: "Sami and Leo holding the frame, and the support they did not complete, are both from the Unit 5 recount.",
  },
  "my-cousin-noah": {
    series: "Amal", book: "2 of 4, from the reading of the same name", term: "Term 2", unit: "Unit 6: Describing People and Things",
    vocabulary: "kind, friendly, honest, kindness, care, busy, calm, able, popular",
    themes: "admiring somebody, and then doing one small thing about it",
    cameos: "Noah is Amal's cousin in the Unit 6 reading; every quality here is one the text gives him.",
  },
  "two-roads": {
    series: "Amal", book: "3 of 4, from the reading of the same name", term: "Term 2", unit: "Unit 6: Describing People and Things",
    vocabulary: "rough, tough, smooth, similar, favourite, extra, careless, able",
    themes: "comparing two things properly instead of ranking them",
    cameos: "the paved road, the stony one, the father's tough boots and the sister's scooter are all the Unit 6 reading's own.",
  },
  "who-is-kinder": {
    series: "Amal", book: "4 of 4, from the listening comparison of the same name", term: "Term 2", unit: "Unit 6: Describing People and Things",
    vocabulary: "kind, kinder, friendly, friendlier, honest, kindness, care, popular, tough",
    themes: "a comparison that cannot be won, and does not need to be",
    cameos: "Sami and Leo's argument about their brothers is the Unit 6 dialogue; Noah stands in as the brother on the page.",
  },
  "today-and-always": {
    series: "Amal", book: "2 of 4, from the reading \"Our Wonderful Nature\"", term: "Term 3", unit: "Unit 7: Nature and the Environment",
    vocabulary: "climate, weather, temperature, sunshine, froze, mountain, forest, beach, coast, nature, explore, energy, matter, metal, planet",
    themes: "the difference between what today is doing and what a place always does",
    cameos: "the frozen pond, the metal, the energy and the one planet are all the Unit 7 reading's own examples.",
  },
  "nature-is-our-home": {
    series: "Amal", book: "3 of 4, from the poem of the same name", term: "Term 3", unit: "Unit 7: Nature and the Environment",
    vocabulary: "nature, water, trees, air, sun, sea, mountain, coast, forest, explore",
    themes: "a four-line poem given a page each; sharing something means leaving it for whoever comes next",
    cameos: "pages 2 to 8 are the unit's poem itself; \"take only pictures, leave only footprints\" is Teacher Yasmin's line from Unit 7.",
  },
  "have-you-ever": {
    series: "Amal", book: "4 of 4, from the listening dialogue \"Have You Ever...?\"", term: "Term 3", unit: "Unit 7: Nature and the Environment",
    vocabulary: "explore, forest, mountain, beach, coast, nature, sunshine, weather; and the present perfect the unit teaches",
    themes: "\"not yet\" is a different word from \"never\"",
    cameos: "every exchange is from the Unit 7 dialogue - Leo's forest, Nora's mountain trail and rock pools, Amal's pictures.",
  },
  "maths-before-dinner": {
    series: "Amal", book: "2 of 4, from the reading \"Maths Is Everywhere\"", term: "Term 3", unit: "Unit 8: Numbers, Shapes, and Measurement",
    vocabulary: "number, fact, addition, division, measure, size, weight, distance, pattern",
    themes: "using maths all day without opening a maths book",
    cameos: "the eggs, the market prices, the dates split between four cousins and the counted steps home are the Unit 8 reading's own.",
  },
  "the-measuring-challenge": {
    series: "Amal", book: "3 of 4, from the listening instructions of the same name", term: "Term 3", unit: "Unit 8: Numbers, Shapes, and Measurement",
    vocabulary: "measure, size, height, weight, distance, straight, metre, number, fact",
    themes: "three jobs, three tools; a fact is a fact, heavy or light",
    cameos: "the desk, the door-to-window distance and the school bag are the three tasks of the Unit 8 instructions, in that order.",
  },
  "ten-to-a-million": {
    series: "Amal", book: "4 of 4, from the listening text \"Numbers Big and Small\"", term: "Term 3", unit: "Unit 8: Numbers, Shapes, and Measurement",
    vocabulary: "number, million, fact, pattern, multiplication, measure",
    themes: "climbing place value one step at a time until a million is a picture, not a word",
    cameos: "the ladder from ten to a million, and the thousand shells on the beach, are both from the Unit 8 counting text.",
  },
  "rain-is-a-kind-of-weather": {
    series: "Amal", book: "2 of 4, from the reading \"Feelings Are Not Bad or Good\"", term: "Term 3", unit: "Unit 9: Thinking, Feelings, and Imagination",
    vocabulary: "sadness, hopeless, sincere, thoughtful, experience, enjoyable, believe, allow",
    themes: "sadness as weather rather than as a fault; saying it out loud makes it lighter",
    cameos: "Nora's lost cat and her mother putting down her book to listen are the Unit 9 reading's own.",
  },
  "what-sami-said": {
    series: "Amal", book: "3 of 4, from the listening dialogue of the same name", term: "Term 3", unit: "Unit 9: Thinking, Feelings, and Imagination",
    vocabulary: "imagine, idea, reason, purpose, choice, sincere, thoughtful, suggest, believe",
    themes: "an idea grows because somebody listened to it properly",
    cameos: "Sami's flight to the lighthouse, and Amal's suggestion that he draw it, are both from the Unit 9 dialogue.",
  },
  "everyone-gets-a-turn": {
    series: "Amal", book: "4 of 4, from the listening dialogue \"A Group Discussion\"", term: "Term 3", unit: "Unit 9: Thinking, Feelings, and Imagination",
    vocabulary: "suggest, allow, idea, reason, choice, enjoy, believe, thoughtful",
    themes: "allowing everybody a turn is what makes the plan good, not only what makes it fair",
    cameos: "Leo's tomatoes, Maya's flowers and Adam's mint are the three suggestions of the Unit 9 discussion, with their reasons.",
  },
  "the-green-folder": {
    series: "Amal", book: "2 of 4, from the story \"Amal's Year of Words\"", term: "Term 3", unit: "Unit 10: My Year of Words (capstone)",
    vocabulary: "one page per unit: family, calendar, hospital, climate, temperature, million, kindness",
    themes: "seeing a year from the outside, in one folder",
    cameos: "the family tree, the calendar chart, the hospital report, the climate poster, the million page and the kindness jar are the six pages Unit 10 names.",
  },
  "the-last-friday": {
    series: "Amal", book: "3 of 4, from the instructions \"The Year 3 Showcase: Project Brief\"", term: "Term 3", unit: "Unit 10: My Year of Words (capstone)",
    vocabulary: "author, report, details, topic, present, reflect, goal",
    themes: "four parts, done in order; reading aloud to find your own mistakes",
    cameos: "the four parts, the word Author under your name, and the two-minute talk are the brief's own instructions.",
  },
  "showcase-day": {
    series: "Amal", book: "4 of 4, from the listening dialogues \"Planning the Showcase\" and \"Showcase Day\"", term: "Term 3", unit: "Unit 10: My Year of Words (capstone)",
    vocabulary: "measure, metre, centimetre, build, offer, discuss, listen, temperature",
    themes: "the questions turn out to be the best part of presenting",
    cameos: "Maya's two metres forty, the twenty-eight chairs, the folder stand and the questions from Grandma Hana and Doctor Sarah are all from the Unit 10 dialogues.",
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
  // ---- Grade 4, books two to five of every unit. Each is built on one of the
  // unit's remaining readings, so the numbering below is "n of 5 for Unit N"
  // rather than a position in one long series.
  "amals-steady-day": {
    series: "Amal (Grade 4)", book: 2, term: "Term 1", unit: "Unit 1: Daily Life & Communication",
    vocabulary: "daily, usual, effort, balance, speed, maintain, continue, gain, fair, really, clearly",
    themes: "an ordinary day done properly; time used well rather than time filled",
    cameos: "Maya walks to school with her and Theo is at break, both from the Unit 1 readings.",
  },
  "may-i-interview-you": {
    series: "Amal (Grade 4)", book: 3, term: "Term 1", unit: "Unit 1: Daily Life & Communication",
    vocabulary: "mail, language, citizen, agree, continue, master, necessary, peace, speed, fair",
    themes: "asking one question and then stopping to listen",
    cameos: "the whole book is the Unit 1 playscript; Grandmother Salma and Karim appear where the script puts them.",
  },
  "the-writing-contest": {
    series: "Amal (Grade 4)", book: 4, term: "Term 1", unit: "Unit 1: Daily Life & Communication",
    vocabulary: "effort, gain, master, balance, cancel, continue, purpose, fair, clearly, daily",
    themes: "fitting one more thing into a full week; a prize that is a tool, not a trophy",
    cameos: "Nora forgets two lines and Sami announces the cancellation, both from the Unit 1 story.",
  },
  "two-languages-at-the-counter": {
    series: "Amal (Grade 4)", book: 5, term: "Term 1", unit: "Unit 1: Daily Life & Communication",
    vocabulary: "language, master, necessary, citizen, effort, daily, continue, leave, clearly",
    themes: "learning something hard so that somebody else does not have to struggle",
    cameos: "Theo is the customer; Omar's second language is his own answer in the Unit 1 interview.",
  },
  "weather-around-the-world": {
    series: "Amal (Grade 4)", book: 2, term: "Term 1", unit: "Unit 2: Nature & Weather",
    vocabulary: "foggy, snowy, moisture, canyon, meadow, bay, storm, hail, hurricane, tornado, surface, roam",
    themes: "the same sky doing eight different things; watching it and learning",
    cameos: "Amal and Nora build the display the Unit 2 story is about.",
  },
  "the-foggy-morning": {
    series: "Amal (Grade 4)", book: 3, term: "Term 1", unit: "Unit 2: Nature & Weather",
    vocabulary: "foggy, moisture, meadow, surface, breath, calm",
    themes: "fog hides a thing, it does not take it away; noticing turned into a poem",
    cameos: "the four lines on the last page are the Unit 2 poem, word for word.",
  },
  "the-weather-report": {
    series: "Amal (Grade 4)", book: 4, term: "Term 1", unit: "Unit 2: Nature & Weather",
    vocabulary: "foggy, storm, hail, moisture, surface, canyon, meadow, bay, calm",
    themes: "a forecast is advice, and advice is only useful if you act on it",
    cameos: "the broadcast is the Unit 2 listening text; Amal holds the script.",
  },
  "the-science-fair-poster": {
    series: "Amal (Grade 4)", book: 5, term: "Term 1", unit: "Unit 2: Nature & Weather",
    vocabulary: "tornado, hurricane, volcano, canyon, moisture, bay, meadow, hail, roam",
    themes: "practising until you can explain it instead of read it",
    cameos: "the dialogue is the Unit 2 listening text \"Two Friends at the Science Fair\"; Idris collects the hail.",
  },
  "the-bitter-lunch": {
    series: "Amal (Grade 4)", book: 2, term: "Term 1", unit: "Unit 3: Food and Health",
    vocabulary: "sandwich, lamb, rice, spice, bakery, fresh, chewy, cattle, labour, stomach, chemicals, gather",
    themes: "the warning you were given and ignored; writing the mistake down afterwards",
    cameos: "Omar warns her, Noah smells it first and Doctor Sarah names it — all from the Unit 3 story.",
  },
  "the-poster-on-the-wall": {
    series: "Amal (Grade 4)", book: 3, term: "Term 1", unit: "Unit 3: Food and Health",
    vocabulary: "fresh, rice, lamb, bakery, gather, brain, stomach, pesticide, comma",
    themes: "advice you can follow the same afternoon",
    cameos: "the eight lines are the Unit 3 poster, including Teacher Yasmin's line in red pen.",
  },
  "at-the-clinic": {
    series: "Amal (Grade 4)", book: 4, term: "Term 1", unit: "Unit 3: Food and Health",
    vocabulary: "stomach, fresh, chewy, spice, chemicals, gather, deadly",
    themes: "telling a doctor the honest version",
    cameos: "the whole book is the Unit 3 dialogue with Doctor Sarah.",
  },
  "the-market-song": {
    series: "Amal (Grade 4)", book: 5, term: "Term 1", unit: "Unit 3: Food and Health",
    vocabulary: "rice, lamb, fresh, gather, bakery, pesticide, comma, labour",
    themes: "a rhyme that turns out to be a rule you can shop by",
    cameos: "the two rhyming lines are the Unit 3 rhyme; Grandma Hana sets the one instruction.",
  },
  "maya-the-young-reporter": {
    series: "Amal (Grade 4)", book: 2, term: "Term 2", unit: "Unit 4: Community and Communication",
    vocabulary: "information, discover, knowledge, challenge, quality, judge, population, erase, tease, scientist",
    themes: "teasing stops when somebody actually reads the work",
    cameos: "Sami's change of mind is the Unit 4 reading's own ending.",
  },
  "the-town-meeting": {
    series: "Amal (Grade 4)", book: 3, term: "Term 2", unit: "Unit 4: Community and Communication",
    vocabulary: "service, information, priority, population, deliver, location, communication",
    themes: "a public building that belongs to everybody, with no list at the door",
    cameos: "the mayor's answers are the Unit 4 listening text; the librarian and Doctor Sarah staff the new rooms.",
  },
  "the-circular-plan": {
    series: "Amal (Grade 4)", book: 4, term: "Term 2", unit: "Unit 4: Community and Communication",
    vocabulary: "circular, plain, service, location, quantity, quality, priority, information, fiction, erase",
    themes: "a small thing in the right place beats a big thing nobody stops at",
    cameos: "Leo, Nora and the librarian are all from the Unit 4 story.",
  },
  "samis-first-story": {
    series: "Amal (Grade 4)", book: 5, term: "Term 2", unit: "Unit 4: Community and Communication",
    vocabulary: "information, quality, discover, challenge, erase, tease, population",
    themes: "a fact is where a story begins; keeping a promise you made as a joke",
    cameos: "Karim the carpenter answers the question; the promise itself is Sami's last line in the Unit 4 reading.",
  },
  "the-race-at-the-village-field": {
    series: "Amal (Grade 4)", book: 2, term: "Term 2", unit: "Unit 5: Action and Movement",
    vocabulary: "gallop, accelerate, rate, pressure, proceed, excite, signal",
    themes: "pacing yourself; not looking back",
    cameos: "the horse beside the fence is the Unit 5 recount's own; Idris waves the homemade flag.",
  },
  "how-animals-move": {
    series: "Amal (Grade 4)", book: 3, term: "Term 2", unit: "Unit 5: Action and Movement",
    vocabulary: "gallop, spiral, squeeze, signal, prevent, suffer, proceed, describe",
    themes: "every movement has a purpose; four animals, four reasons",
    cameos: "horse, snail, cat and flock are exactly the four the Unit 5 information text names.",
  },
  "the-lost-goat": {
    series: "Amal (Grade 4)", book: 4, term: "Term 2", unit: "Unit 5: Action and Movement",
    vocabulary: "gaze, peek, proceed, rescue, defend, pressure, check",
    themes: "searching properly instead of searching fast",
    cameos: "Adam and the goat are the Unit 5 listening script's own.",
  },
  "the-posters-for-simba": {
    series: "Amal (Grade 4)", book: 5, term: "Term 2", unit: "Unit 5: Action and Movement",
    vocabulary: "describe, rescue, defend, check, admit, suffer, signal",
    themes: "doing the honest thing even when you hope it fails; a home that was already given",
    cameos: "Talia, Simba and the poster plan all come from the Unit 5 story \"The Spiral Cave\".",
  },
  "the-people-of-our-town": {
    series: "Amal (Grade 4)", book: 2, term: "Term 2", unit: "Unit 6: People in Society",
    vocabulary: "caretaker, carpenter, merchant, labourer, engineer, governor, lawyer, article, personal",
    themes: "a town is the jobs its people do, from first light to the streetlamps",
    cameos: "the caretaker, Omar, Karim, Elena and the governor are all named in the Unit 6 reading. The governor is a woman there and is drawn as one.",
  },
  "two-neighbours": {
    series: "Amal (Grade 4)", book: 3, term: "Term 2", unit: "Unit 6: People in Society",
    vocabulary: "refugee, immigrant, tenant, neighbour, merchant, personal, hero",
    themes: "one family ran from danger, one walked towards a dream; both are welcome",
    cameos: "Theo, his mother and Omar are the Unit 6 reading's own; the tomato garden is hers too.",
  },
  "elenas-bridge": {
    series: "Amal (Grade 4)", book: 4, term: "Term 2", unit: "Unit 6: People in Society",
    vocabulary: "engineer, labourer, carpenter, article, hero, personal",
    themes: "planning carefully and checking twice; six months is not a long time for a bridge",
    cameos: "the interview is the Unit 6 listening text; the last page keeps the seat Elena asks Nora to save.",
  },
  "the-caretakers-keys": {
    series: "Amal (Grade 4)", book: 5, term: "Term 2", unit: "Unit 6: People in Society",
    vocabulary: "caretaker, hero, respect, article, personal",
    themes: "noticing the work that is only visible when it stops",
    cameos: "the eleven years and the closing line about brooms are both from the Unit 6 readings.",
  },
  "the-day-before-the-test": {
    series: "Amal (Grade 4)", book: 2, term: "Term 3", unit: "Unit 7: Emotions, Behaviour, and Identity",
    vocabulary: "nervous, anxious, doubtful, gentle, polite, proud, calm",
    themes: "a worry you can be polite to and then put to bed",
    cameos: "Adam's advice and Mum's line about the worry are both from the Unit 7 reading.",
  },
  "where-my-family-comes-from": {
    series: "Amal (Grade 4)", book: 3, term: "Term 3", unit: "Unit 7: Emotions, Behaviour, and Identity",
    vocabulary: "proud, generous, polite, curious, ethnic, gentle",
    themes: "difference without ranking; a guest is a gift",
    cameos: "this is Nora's own Unit 7 recount, told by her; Maya and Sami are her classmates in it.",
  },
  "getting-ready-for-the-play": {
    series: "Amal (Grade 4)", book: 4, term: "Term 3", unit: "Unit 7: Emotions, Behaviour, and Identity",
    vocabulary: "nervous, gentle, polite, selfish, proud, shy, serious",
    themes: "three things to remember, and permission to make a small mistake",
    cameos: "Sami's question about forgetting his lines is his own, from the Unit 7 talk.",
  },
  "the-cultural-fair": {
    series: "Amal (Grade 4)", book: 5, term: "Term 3", unit: "Unit 7: Emotions, Behaviour, and Identity",
    vocabulary: "curious, proud, nervous, shy, polite, generous, ethnic",
    themes: "curiosity as a way of being brave in a room full of strangers",
    cameos: "the conversation is the Unit 7 dialogue \"A Chat About Feelings\"; the fair is the one they are discussing.",
  },
  "the-right-tool-for-the-job": {
    series: "Amal (Grade 4)", book: 2, term: "Term 3", unit: "Unit 8: Tools, Machines, and Everyday Items",
    vocabulary: "stapler, folder, briefcase, shield, microwave, hardware, machinery, resources, crew, equipment",
    themes: "the right tool used the right way; small jobs and huge ones share one rule",
    cameos: "every tool named here is named in the Unit 8 information text.",
  },
  "a-look-at-the-stars": {
    series: "Amal (Grade 4)", book: 3, term: "Term 3", unit: "Unit 8: Tools, Machines, and Everyday Items",
    vocabulary: "telescope, equipment, plastic, machinery, resources",
    themes: "a machine that changes nothing up there and everything down here",
    cameos: "Noah shares the telescope. The night sky here is drawn WITHOUT the kit's own moon, so the moon on the page is the one the telescope is pointed at.",
  },
  "the-careful-cook": {
    series: "Amal (Grade 4)", book: 4, term: "Term 3", unit: "Unit 8: Tools, Machines, and Everyday Items",
    vocabulary: "microwave, utensil, plastic, ingredient, equipment, crew",
    themes: "ten steps in order, and an adult in the room for all of them",
    cameos: "the safety talk is the Unit 8 listening text; Leo cooks the cocoa there too.",
  },
  "the-helper-vehicles": {
    series: "Amal (Grade 4)", book: 5, term: "Term 3", unit: "Unit 8: Tools, Machines, and Everyday Items",
    vocabulary: "helicopter, ambulance, equipment, machinery, crew, shield",
    themes: "the machines are the easy part; the people who keep them ready are the point",
    cameos: "the four sung lines are the Unit 8 song; Doctor Sarah rides with the helicopter.",
  },
  "a-trip-to-the-capital": {
    series: "Amal (Grade 4)", book: 2, term: "Term 3", unit: "Unit 9: Places, People, and Plans",
    vocabulary: "station, railway, capital, museum, tourism, entrance, lift, horizon, restaurant, arrive",
    themes: "a day that is too big to hold, and a little brother asleep before the end of it",
    cameos: "the trip is the Unit 9 recount's own, down to the vendor selling bread on the platform.",
  },
  "living-near-the-equator": {
    series: "Amal (Grade 4)", book: 3, term: "Term 3", unit: "Unit 9: Places, People, and Plans",
    vocabulary: "equator, horizon, nation, factories, neighbourhood, railway, mall, museum",
    themes: "long warm days, and a working country inside them",
    cameos: "the crops, the railway, the ships and the lorries are all in the Unit 9 information text.",
  },
  "making-a-plan": {
    series: "Amal (Grade 4)", book: 4, term: "Term 3", unit: "Unit 9: Places, People, and Plans",
    vocabulary: "museum, restaurant, station, neighbourhood, horizon, arrive, event",
    themes: "deciding the order before you go, and who brings what",
    cameos: "the whole book is the Unit 9 listening script; Nora's notebook and Leo's map are theirs in it.",
  },
  "directions-at-the-mall": {
    series: "Amal (Grade 4)", book: 5, term: "Term 3", unit: "Unit 9: Places, People, and Plans",
    vocabulary: "mall, lift, corridor, entrance, restaurant, customer, arrive",
    themes: "following directions one step at a time in a place you do not know",
    cameos: "the announcement is the Unit 9 listening script; Amal and Noah are the pair who got lost in Mombasa.",
  },
  "amals-english-voice": {
    series: "Amal (Grade 4)", book: 2, term: "Term 3", unit: "Unit 10: My English Voice (capstone)",
    vocabulary: "one page for each unit she keeps: mail, moisture, rice, spiral, engineer, equipment",
    themes: "choosing six pages out of a year; keeping the dull one because of one good sentence",
    cameos: "the folder, the attic list and Grandma Hana's line are all from the Unit 10 story.",
  },
  "four-parts-and-a-friday": {
    series: "Amal (Grade 4)", book: 3, term: "Term 3", unit: "Unit 10: My English Voice (capstone)",
    vocabulary: "the brief's own words: pages, board, paragraph, label, talk, reflection, draft",
    themes: "a big task read as four small ones with dates on them",
    cameos: "every deadline and mark on these pages is the Unit 10 project brief's own.",
  },
  "planning-the-exhibition": {
    series: "Amal (Grade 4)", book: 4, term: "Term 3", unit: "Unit 10: My English Voice (capstone)",
    vocabulary: "engineer, carpenter, deliver, mail, nervous, metre, centimetre",
    themes: "measuring the wall before arguing about the boards",
    cameos: "Elena's tent-frame answer and the caretaker's early key are both in the Unit 10 dialogue.",
  },
  "exhibition-evening": {
    series: "Amal (Grade 4)", book: 5, term: "Term 3", unit: "Unit 10: My English Voice (capstone)",
    vocabulary: "equipment, nervous, proud, breath, information, service",
    themes: "answering questions about your own work in front of the people in it",
    cameos: "Grandma Hana, Doctor Sarah, Omar, Elena and Idris each ask the question they ask in the Unit 10 dialogue.",
  },
  // ---------------------------------------------------------------- Grade 1, books three to five
  // Thirty books, three per unit, drawn by create-grade1-shelf-ebook-illustrations.js.
  // "Rhyme" is the unit's own reading 3, "Look and say" fills in its reading 2,
  // and "Fable" is a second story in the animal storyworld.
  "hello-school": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 1", unit: "Unit 1: Welcome to School",
    vocabulary: "table, chair, book, crayon, rules, school, hello, teacher, friend, sing, point, listen",
    themes: "one poem said together every morning; saying it louder each time",
    cameos: "the poem is the Unit 1 rhyme; Miss Yasmin, Adam, Samira and Leo are the class from Amal's First Day.",
  },
  "find-something-green": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 1", unit: "Unit 1: Welcome to School",
    vocabulary: "red, blue, green, yellow, orange, purple, black, white, brown, book, pencil, crayon, lunchbox, ruler, clock, whiteboard, table, chair",
    themes: "ten colours found on ten real things in the room",
    cameos: "the treasure hunt is the one Miss Yasmin runs in the Unit 1 reading; the lunchbox is Unit 1's tenth classroom word and gets its first drawing here.",
  },
  "the-lost-blue-crayon": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 1", unit: "Unit 1: Welcome to School",
    vocabulary: "crayon, red, yellow, grey, brown, blue, nine, ten, look, found, friend, thank you",
    themes: "four friends looking in four places; the thing is where nobody thought to look",
    cameos: "Kiki, Miss Twiga, the little elephant, the ostrich and Musa, all from Kiki Goes to School.",
  },
  "some-families-are-big": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 1", unit: "Unit 2: Family Time",
    vocabulary: "family, big, small, mother, mum, father, dad, brother, sister, grandma, grandpa, baby, one to ten",
    themes: "big or small is the wrong question; counting the people you have",
    cameos: "the poem is the Unit 2 Families rhyme and the counting comes from the Ten in the Bed song beside it.",
  },
  "who-is-in-my-family": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 1", unit: "Unit 2: Family Time",
    vocabulary: "mother, mum, father, dad, brother, sister, baby, grandma, grandpa, family, pancakes, milk, fruit, help, lay the table, one to seven",
    themes: "naming every person at your own table",
    cameos: "Adam, Hodan, baby Idris, Ayeeyo and Grandpa are the family of Breakfast at Grandma's House.",
  },
  "ten-little-eggs": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 1", unit: "Unit 2: Family Time",
    vocabulary: "one to ten, egg, chick, hen, nest, family, wait, barn",
    themes: "counting down while you wait, and one that takes longer than the rest",
    cameos: "Koko the hen and her chicks from The Little Lost Chick; Duku and the goat come to look.",
  },
  "wind-the-bobbin-up": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 2", unit: "Unit 3: Fun and Games",
    vocabulary: "pull, clap, point, wind up, hands, knees, ceiling, floor, window, door, one two three",
    themes: "learning words with your whole body",
    cameos: "the song is the Unit 3 action song, action for action; the class is Amal's.",
  },
  "touch-your-toes": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 2", unit: "Unit 3: Fun and Games",
    vocabulary: "bounce, roll, throw, catch, clap, shake, jump, head, ear, nose, shoulder, arm, hand, finger, leg, foot, toes",
    themes: "can-you as a question you answer by doing it",
    cameos: "the red ball is the one from Amal and the Big Ball; Adam, Samira and Leo play too.",
  },
  "where-is-the-ball": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 2", unit: "Unit 3: Fun and Games",
    vocabulary: "on, under, next to, in, left, right, ball, bounce, roll, throw, catch, rabbit, duck, frog",
    themes: "a search that teaches where rather than what",
    cameos: "Kiki, the little elephant, the goat and the chick; the rabbit, duck and frog are Unit 3's own story animals, drawn for the first time here.",
  },
  "party-time-look-at-me": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 2", unit: "Unit 4: Making Things",
    vocabulary: "clown, king, princess, superhero, frown, crown, cape, mask, cut, make, paint, wear, silver, gold",
    themes: "dressing up as somebody, and the poem getting sillier every time",
    cameos: "the poem is the Unit 4 Party Time rhyme, down to the clown's funny frown and the king's silver ring.",
  },
  "shapes-i-can-cut": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 2", unit: "Unit 4: Making Things",
    vocabulary: "square, circle, triangle, rectangle, red, blue, green, yellow, orange, cut, make, paint, wear, weave, hat",
    themes: "four shapes that turn into something you can put on your head",
    cameos: "Ayeeyo's mat is the one she weaves in Amal Makes a Mat; Adam's painted shirt is his own accident.",
  },
  "higgledy-piggledy-my-black-hen": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 2", unit: "Unit 4: Making Things",
    vocabulary: "hen, egg, nine, ten, sometimes, count, flap, laughed",
    themes: "a question with two right answers, which is the joke the rhyme is making",
    cameos: "Koko, Duku and the goat; the rhyme is the Unit 4 short-e rhyme printed beside the Party Time poem.",
  },
  "hello-to-the-farm": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 2", unit: "Unit 5: On the Farm",
    vocabulary: "farmer, tractor, cow, stall, field, chick, barn, seed, egg, wheat",
    themes: "greeting a place one thing at a time",
    cameos: "the poem is the Unit 5 Farm Poem; Grandpa's farm is the one from Amal and the Little Hen.",
  },
  "who-says-moo": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 2", unit: "Unit 5: On the Farm",
    vocabulary: "cow, hen, chick, duck, sheep, moo, cluck, peep, quack, baa, tractor, feeding, planting, driving, seed, carrot, tomatoes, onions, potatoes, beans",
    themes: "every animal has its own sound and its own word",
    cameos: "Grandpa drives the tractor; the onions, potatoes and beans are Unit 5's own vegetables and are drawn for the first time here.",
  },
  "duku-plants-a-row": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 2", unit: "Unit 5: On the Farm",
    vocabulary: "seed, field, planting, growing, rain, sun, wait, carrot, tomato, beans, first, then",
    themes: "the part of growing food that is only waiting",
    cameos: "Duku from Duku Makes a Scarecrow, with Koko and the goat; the row he digs is the one the scarecrow guards.",
  },
  "two-little-eyes": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 3", unit: "Unit 6: My Five Senses",
    vocabulary: "see, hear, smell, taste, touch, eyes, ears, nose, mouth, sweet, soft",
    themes: "a poem that names four senses, and the child who finds the fifth",
    cameos: "the poem and the question at the end of it are both the Unit 6 reading's own; Ayeeyo asks it.",
  },
  "which-sense-do-i-use": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 3", unit: "Unit 6: My Five Senses",
    vocabulary: "see, hear, smell, taste, touch, eyes, ears, nose, tongue, hands, bright, loud, quiet, sweet, soft, hard, cold, sweeter, colder",
    themes: "one sense per thing, then two things compared",
    cameos: "the spice pots are Omar's market stall from Amal at the Market; the drum and violin come from the Unit 6 Music Man song.",
  },
  "kiki-makes-music": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 3", unit: "Unit 6: My Five Senses",
    vocabulary: "loud, quiet, louder, quieter, sweet, hear, ears, drum, violin, piano",
    themes: "loud is not the same as good; playing so somebody else can still hear",
    cameos: "Kiki, the little elephant, the ostrich, Miss Twiga and Musa; the three instruments are the ones the Unit 6 Music Man song names.",
  },
  "the-wheels-on-the-bus": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 3", unit: "Unit 7: Let's Go!",
    vocabulary: "bus, wheels, wipers, bell, seat, sit down, buckle up, ride, town, swish, ding, round and round",
    themes: "a song with an action for every verse, and a polite request at the end of it",
    cameos: "both the song and the Bus Driver rhyme are the Unit 7 reading's own; Omar drives.",
  },
  "how-do-you-go": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 3", unit: "Unit 7: Let's Go!",
    vocabulary: "walk, bus, car, bicycle, boat, train, plane, helicopter, wheels, seat, sails, wings, drive, ride, fly, float, big, little, fast, slow",
    themes: "eight ways to travel, then which of them is fast and which is slow",
    cameos: "the aeroplane is Unit 7's eighth travel word and is drawn for the first time here.",
  },
  "lulu-and-the-slow-boat": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 3", unit: "Unit 7: Let's Go!",
    vocabulary: "fast, slow, fly, float, boat, wind, stop, go, travel, together",
    themes: "fast that has to stop against slow that does not",
    cameos: "Lulu from Lulu Says Let's Go, and Kiki in the boat from Lulu and the Wonderful Water.",
  },
  "rain-on-the-green-grass": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 3", unit: "Unit 8: Wonderful Water",
    vocabulary: "rain, grass, tree, houses, drip, drop, wet, stream, rowing, rainbow",
    themes: "two water songs for one wet afternoon",
    cameos: "both the Rainy Day poem and the rowing song are the Unit 8 reading's own; Hodan sings the second one.",
  },
  "what-is-water-for": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 3", unit: "Unit 8: Wonderful Water",
    vocabulary: "water, drink, wash, cook, grow plants, rain, river, well, wet, dry, clean, float, sink, rainy, sunny, fish, frog, turtle, whale, crocodile, waste",
    themes: "what water is for, where it is, and who lives in it",
    cameos: "the well is the one from The Well in the Village; the whale and the crocodile are Unit 8's own water animals and are drawn for the first time here.",
  },
  "not-one-drop-wasted": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 3", unit: "Unit 8: Wonderful Water",
    vocabulary: "water, well, low, empty, waste, wasted, drip, drop, carried, thirsty, rain, puddle",
    themes: "a shortage everybody solves at once, in small ways",
    cameos: "Musa, Duku, Koko, Kiki and the goat; the well is The Well in the Village's.",
  },
  "red-means-stop": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 3", unit: "Unit 9: City Places",
    vocabulary: "red, green, yellow, stop, go, wait, traffic lights, statue, march, crossing, town, market, school",
    themes: "a rhyme you can walk to the shop on",
    cameos: "both the traffic-lights rhyme and the I Live in a Town song are the Unit 9 reading's own.",
  },
  "who-works-here": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 3", unit: "Unit 9: City Places",
    vocabulary: "shop, hospital, school, library, market, park, bus stop, road, teacher, doctor, shopkeeper, neighbour, near, far, next to, busy, quiet, clean, please, thank you, litter",
    themes: "every place in the town has somebody in it",
    cameos: "Omar, Doctor Faduma and Miss Yasmin are the Year 1 course's own helpers; the walk is the one from A Walk Around Town.",
  },
  "the-busy-road-and-the-quiet-park": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 3", unit: "Unit 9: City Places",
    vocabulary: "busy, quiet, big, small, clean, dirty, road, shop, library, park, stop, go, litter",
    themes: "a city has a quiet part in it if you know where to walk",
    cameos: "Lulu and Kiki from Lulu in the City, on the same streets.",
  },
  "my-year-of-words": {
    series: "Grade 1 shelf - Rhyme", book: 3, term: "Term 3", unit: "Unit 10: My First English World (capstone)",
    vocabulary: "three words from each unit of the year: table, chair, book; mother, father, family; bounce, roll, throw; square, circle, triangle; cow, hen, chick; see, hear, smell; walk, bus, car; water, rain, drop; shop, market, school",
    themes: "a whole year said out loud in twelve pages",
    cameos: "every picture is one the learner has already met in an earlier book of this grade.",
  },
  "show-me-your-book": {
    series: "Grade 1 shelf - Look and say", book: 4, term: "Term 3", unit: "Unit 10: My First English World (capstone)",
    vocabulary: "choose, favourite, folder, book, page, label, sentence, practise, minute, mirror, goal, remember, proud",
    themes: "four steps to a finished thing, and answering questions about it",
    cameos: "the steps are the Unit 10 project brief's own and the last two pages are its celebration dialogue, word for word in Amal's voice.",
  },
  "see-you-next-year-friends": {
    series: "Grade 1 shelf - Fable", book: 5, term: "Term 3", unit: "Unit 10: My First English World (capstone)",
    vocabulary: "hello, goodbye, water, fast, friend, year, ball, egg, chick, carrot, bell",
    themes: "everybody brings one thing and says one word",
    cameos: "Musa, Kiki, Duku, Koko, Miss Twiga, the little elephant, the goat, the ostrich and Lulu - the whole Grade 1 animal cast in one book.",
  },
  // ------------------------------------------------ Grade 2, books four to seven
  // Forty books, four per unit, drawn by create-grade2-shelf-ebook-illustrations.js.
  "amals-first-week": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, partner, spell, friend, hello, goodbye, calendar, day, week, month, date, birthday, book, tablet, chart, word, the colours, one to twelve, first to thirtieth",
    themes: "Amal starts a new school, learns the days of the week, and on Thursday does for Nora what Leo did for her",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "when-i-open-up-a-book": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, partner, spell, friend, hello, goodbye, calendar, day, week, month, date, birthday, book, tablet, chart, word, the colours, one to twelve, first to thirtieth",
    themes: "Every page whispers Look! Look! Look! - and out come sports and monkeys, trains and kings",
    cameos: "Built on the unit's own poem.",
  },
  "seven-days-make-one-week": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, partner, spell, friend, hello, goodbye, calendar, day, week, month, date, birthday, book, tablet, chart, word, the colours, one to twelve, first to thirtieth",
    themes: "The class sings the days of the week, one child and one day at a time, all the way to seven",
    cameos: "Built on the unit's own listening text.",
  },
  "the-first-the-second-the-third": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 1", unit: "Unit 1: Welcome and Calendar",
    vocabulary: "name, partner, spell, friend, hello, goodbye, calendar, day, week, month, date, birthday, book, tablet, chart, word, the colours, one to twelve, first to thirtieth",
    themes: "Zuri learns the words that go on a calendar - not one, two, three, but first, second, third",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "the-helpers-of-warta-street": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, window cleaner, police officer, reporter, bus driver, firefighter, helmet, boots, gloves, mask, uniform, doctor, nurse, teacher, farmer, shopkeeper, helping, teaching, rescuing, growing, driving",
    themes: "A window cleaner, a bus driver, two firefighters and a police officer - and the one job Amal thinks is the kindest",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "my-neighbourhood": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, window cleaner, police officer, reporter, bus driver, firefighter, helmet, boots, gloves, mask, uniform, doctor, nurse, teacher, farmer, shopkeeper, helping, teaching, rescuing, growing, driving",
    themes: "Come and meet the people in my neighbourhood - the grandmas and grandpas, the mums and dads, and the children too",
    cameos: "Built on the unit's own poem.",
  },
  "firefighter-leila-comes-to-class": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, window cleaner, police officer, reporter, bus driver, firefighter, helmet, boots, gloves, mask, uniform, doctor, nurse, teacher, farmer, shopkeeper, helping, teaching, rescuing, growing, driving",
    themes: "One visitor, one uniform and a class full of questions - including the one nobody expected her to answer honestly",
    cameos: "Built on the unit's own listening text.",
  },
  "who-is-helping": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 1", unit: "Unit 2: Good Neighbours and Jobs",
    vocabulary: "neighbour, window cleaner, police officer, reporter, bus driver, firefighter, helmet, boots, gloves, mask, uniform, doctor, nurse, teacher, farmer, shopkeeper, helping, teaching, rescuing, growing, driving",
    themes: "Zuri walks round the whole savanna asking one question, and every answer is somebody doing their job",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "the-big-race": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, exercise, healthy, strong, water, sleep, energy, touch, turn, stand, reach, flap",
    themes: "Amal wins the relay, and then walks back down the field to the boy who lost it",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "reach-for-the-sky": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, exercise, healthy, strong, water, sleep, energy, touch, turn, stand, reach, flap",
    themes: "Nine actions, one poem, and a whole class doing every single one of them",
    cameos: "Built on the unit's own poem.",
  },
  "get-up-and-move-day": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, exercise, healthy, strong, water, sleep, energy, touch, turn, stand, reach, flap",
    themes: "One morning a year, the whole school stops its lessons and goes outside to move",
    cameos: "Built on the unit's own listening text.",
  },
  "head-arm-hand-finger": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 1", unit: "Unit 3: Ready, Steady, Go!",
    vocabulary: "head, arm, hand, finger, tummy, toe, wave, hop, jump, clap, wiggle, nod, exercise, healthy, strong, water, sleep, energy, touch, turn, stand, reach, flap",
    themes: "Zuri names every part of herself she can point at, and then makes each one move",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "the-night-amal-counted-the-stars": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, source, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, earth, long, short, high, low, bright, dark, sunny, cloudy, windy, rainy, dry",
    themes: "A shadow that is long, then short, then gone - and a sky with more stars in it than anyone can count",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "my-shadow": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, source, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, earth, long, short, high, low, bright, dark, sunny, cloudy, windy, rainy, dry",
    themes: "A little shadow that goes in and out with me - and jumps into bed before I do",
    cameos: "Built on the unit's own poem.",
  },
  "why-we-have-day-and-night": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, source, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, earth, long, short, high, low, bright, dark, sunny, cloudy, windy, rainy, dry",
    themes: "A torch, an orange ball and one small mark - and the answer to where the sun goes at night",
    cameos: "Built on the unit's own listening text.",
  },
  "sunny-cloudy-windy-rainy": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 2", unit: "Unit 4: The Big Sky",
    vocabulary: "shadow, light, sun, source, block, sky, morning, midday, evening, sunrise, sunset, moon, star, cloud, day, night, earth, long, short, high, low, bright, dark, sunny, cloudy, windy, rainy, dry",
    themes: "Zuri keeps a weather chart for one week, and no two days are the same",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "a-fair-way-to-measure": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "ten to one hundred, circle, square, triangle, rectangle, heart, pattern, measure, ruler, centimetre, metre, length, height, weight, size, big, small, long, short, tall, heavy, light, wide, narrow",
    themes: "Amal says fourteen feet and Leo says eleven, and Nora works out why they are both right",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "one-hundred-little-fingers": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "ten to one hundred, circle, square, triangle, rectangle, heart, pattern, measure, ruler, centimetre, metre, length, height, weight, size, big, small, long, short, tall, heavy, light, wide, narrow",
    themes: "Count in tens all the way to a hundred, and hold every single finger in the air",
    cameos: "Built on the unit's own poem.",
  },
  "how-people-measured-long-ago": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "ten to one hundred, circle, square, triangle, rectangle, heart, pattern, measure, ruler, centimetre, metre, length, height, weight, size, big, small, long, short, tall, heavy, light, wide, narrow",
    themes: "Before rulers, people measured with fingers, hands, arms and footsteps - and nobody's answer ever matched",
    cameos: "Built on the unit's own listening text.",
  },
  "big-and-small-long-and-short": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 2", unit: "Unit 5: Let's Measure",
    vocabulary: "ten to one hundred, circle, square, triangle, rectangle, heart, pattern, measure, ruler, centimetre, metre, length, height, weight, size, big, small, long, short, tall, heavy, light, wide, narrow",
    themes: "Zuri finds the biggest thing and the smallest thing on the savanna, and every pair in between",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "amal-and-the-little-garden-friends": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "Amal is afraid of bugs, until Adam sits very still beside her and shows her what they are actually doing",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "theres-a-bug-on-me": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "One, two, three - there's a bug on me. Where did it go? Nobody knows",
    cameos: "Built on the unit's own poem.",
  },
  "grandpas-cricket": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "Nora wants to keep the cricket, and Grandpa says yes - if she learns how to look after it properly",
    cameos: "Built on the unit's own listening text.",
  },
  "fly-jump-crawl-spin": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 2", unit: "Unit 6: All About Bugs",
    vocabulary: "butterfly, cricket, ant, bee, spider, worm, insect, legs, wings, antennae, anthill, web, on, under, in, between, above, in front of, fly, jump, crawl, spin, chirp, collect",
    themes: "Every little creature in the garden moves its own way, and Zuri names all of them",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "amal-and-the-little-tree": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, happy, thankful, appreciate, important",
    themes: "The river is almost dry and the bank is brown, so Amal plants a handful of seeds and waits",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "painted-blue-and-green": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, happy, thankful, appreciate, important",
    themes: "The sky is painted blue and the Earth is painted green, with a lot of fresh air in between",
    cameos: "Built on the unit's own poem.",
  },
  "a-family-on-mother-earth-day": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, happy, thankful, appreciate, important",
    themes: "One family, one day, and six different jobs - and Sami on the porch, watching all of them",
    cameos: "Built on the unit's own listening text.",
  },
  "roots-stem-leaves-flower": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 3", unit: "Unit 7: The World Around Us",
    vocabulary: "planting, watering, picking up, litter, recycling, roots, stem, leaves, flower, seeds, tree, air, water, soil, earth, glad, happy, thankful, appreciate, important",
    themes: "Zuri follows one seed all the way up, and learns the name of every part on the way",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "helping-hands-at-home": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, apartment, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "Grandma is coming tomorrow, and the house is not ready - so Amal and Idris make it ready",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "a-nest-is-a-home-for-a-bird": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, apartment, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "A nest, a hive, a hole and a house - four homes, and every one of them is exactly right for somebody",
    cameos: "Built on the unit's own poem.",
  },
  "theos-tree-house": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, apartment, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "A floor, four walls, a little door and a green roof - and ten steps to climb before you get there",
    cameos: "Built on the unit's own listening text.",
  },
  "bed-table-chair-sofa": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 3", unit: "Unit 8: Home, Sweet Home",
    vocabulary: "house, apartment, hut, tree house, nest, hive, hole, bedroom, kitchen, bathroom, living room, dining room, bed, table, chair, sofa, sink, rug, window, adobe house, stilt house, cave house, skyscraper",
    themes: "Zuri goes through a whole house naming everything in it, one room at a time",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "the-stranger-with-the-map": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, shopping centre, underground, ferry, Ferris wheel, market, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "On Amal's first big day in the city, an old man with a map turns it this way and that",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "at-the-zebra-crossing": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, shopping centre, underground, ferry, Ferris wheel, market, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "Look around at city places, look around at city faces - and mind your laces",
    cameos: "Built on the unit's own poem.",
  },
  "the-city-from-the-sky": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, shopping centre, underground, ferry, Ferris wheel, market, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "Leo rides in a helicopter above his own city, and everything he knows looks like a toy",
    cameos: "Built on the unit's own listening text.",
  },
  "amazing-huge-and-a-little-bit-scary": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 3", unit: "Unit 9: Let's Explore the City!",
    vocabulary: "library, shopping centre, underground, ferry, Ferris wheel, market, traffic, helicopter, bus, map, directions, straight ahead, aquarium, octopus, penguin, turtle, shark, amazing, beautiful, clever, dangerous, huge, scary",
    themes: "Zuri goes to the aquarium and to the city, and finds a describing word for every single thing",
    cameos: "Built on the unit's own vocabularyGroups.",
  },
  "amals-english-world": {
    series: "Grade 2 shelf - Story", book: 4, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one word from each of the nine review groups: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "Six pages out of a whole year of work, one sentence corrected, and a table of her own on showcase day",
    cameos: "Built on the unit's own Story reading, which no Zuri book tells.",
  },
  "ten-units-one-year": {
    series: "Grade 2 shelf - Poem", book: 5, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one word from each of the nine review groups: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "Amal walks back through every unit of Year 2 and says out loud what each one taught her",
    cameos: "Built on the unit's own poem.",
  },
  "the-sentence-i-fixed": {
    series: "Grade 2 shelf - Listening", book: 6, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one word from each of the nine review groups: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "Amal reads her old work again and finds one small word in the wrong shape - and mends it",
    cameos: "Built on the unit's own listening text.",
  },
  "nine-words-for-year-three": {
    series: "Grade 2 shelf - Words", book: 7, term: "Term 3", unit: "Unit 10: My English World (capstone)",
    vocabulary: "one word from each of the nine review groups: name, neighbour, head, shadow, ten, butterfly, planting, house, library",
    themes: "Zuri picks one word from every unit of the year and puts them in her pocket for next time",
    cameos: "Built on the unit's own vocabularyGroups.",
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

  // Which kit and which generator actually drew this book. It used to name the
  // Grade 2 pair for every book on the shelf, which was true of Zuri's ten and
  // of nothing else: the Grade 3 and Grade 4 pages come from their own kits and
  // their own generators, and an attribution that names the wrong tool sends
  // the next person to a file that cannot produce the picture in front of them.
  // A grade with no entry here keeps the shared-kit wording, which is the most
  // that can be said without guessing.
  const DRAWN_BY = {
    1: ["the shared series kit in tools/lib/ehel-ebook-kit.js and the Amal-series",
      "cast in tools/lib/ehel-ebook-kit-amal.js, composed by",
      "tools/create-amal-ebook-illustrations.js."],
    2: ["the shared series kit in tools/lib/ehel-ebook-kit.js and",
      "tools/lib/ehel-ebook-kit-grade2.js, composed by",
      "tools/create-grade2-ebook-illustrations.js."],
    3: ["the shared series kit in tools/lib/ehel-ebook-kit.js and the Grade 3",
      "cast in tools/lib/ehel-ebook-kit-grade3.js, composed by",
      "tools/create-grade3-ebook-illustrations.js and its -2, -3 and -4",
      "companions."],
    4: ["the shared series kit in tools/lib/ehel-ebook-kit.js and the Grade 4",
      "additions in tools/lib/ehel-ebook-kit-grade4.js, composed by",
      "tools/create-grade4-ebook-illustrations.js."],
  };
  // Grade 4 is drawn by two generators, not one: the first book on each unit
  // came from create-grade4-ebook-illustrations.js, and books two to five from
  // create-grade4-shelf-ebook-illustrations.js with its own additive kit. The
  // set below is which books belong to the second one, and it is read off that
  // generator's own book map so it cannot drift from it.
  const GRADE4_SHELF = new Set(shelfBookIds);
  const GRADE1_SHELF = new Set(grade1ShelfBookIds);
  const GRADE2_SHELF = new Set(grade2ShelfBookIds);
  const drawnBy = GRADE4_SHELF.has(book.id)
    ? ["the shared series kit in tools/lib/ehel-ebook-kit.js and the Grade 4",
      "shelf additions in tools/lib/ehel-ebook-kit-grade4-shelf.js, composed by",
      "tools/create-grade4-shelf-ebook-illustrations.js."]
    : GRADE2_SHELF.has(book.id)
      ? ["the shared series kit in tools/lib/ehel-ebook-kit.js, the Zuri additions",
        "in tools/lib/ehel-ebook-kit-grade2.js, the Amal-series cast in",
        "tools/lib/ehel-ebook-kit-amal.js and the Grade 2 shelf additions in",
        "tools/lib/ehel-ebook-kit-grade2-shelf.js, composed by",
        "tools/create-grade2-shelf-ebook-illustrations.js."]
    : GRADE1_SHELF.has(book.id)
      ? ["the shared series kit in tools/lib/ehel-ebook-kit.js, the Amal-series",
        "cast in tools/lib/ehel-ebook-kit-amal.js and the Grade 1 shelf additions",
        "in tools/lib/ehel-ebook-kit-grade1-shelf.js, composed by",
        "tools/create-grade1-shelf-ebook-illustrations.js."]
      : DRAWN_BY[book.grades[0]] || ["the shared series kit in tools/lib/ehel-ebook-kit.js."];

  const attribution = [
    `${book.attribution}`,
    "",
    `Story: ${book.author}`,
    `Illustrations: ${book.illustrator} - original animated vector pages from`,
    ...drawnBy,
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
