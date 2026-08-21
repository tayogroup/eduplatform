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
  const drawnBy = DRAWN_BY[book.grades[0]] || ["the shared series kit in tools/lib/ehel-ebook-kit.js."];

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
