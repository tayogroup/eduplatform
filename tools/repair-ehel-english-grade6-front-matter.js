#!/usr/bin/env node
// Grade 6 shipped unit FRONT MATTER under reading headings: "Welcome to Unit 6!
// … By the end of this unit you will be able to: … Start with the Vocabulary
// file …" was a narrated "reading" in Units 6, 8 and 9, and the second reading
// in Units 8 and 9 opened with navigation lines and a glossary before the real
// passage began. Comprehension questions then quizzed the child on "the
// introduction". (2026-08-17 review, systemic item 18.)
//
// What this does, per reading:
//   U8 read02, U9 read02  — strip the preamble; the passage and every question
//                            keep (paragraph numbers in the questions already
//                            count from the passage's first paragraph).
//   U6 read01             — keep its one real paragraph (Hargeisa) and give it a
//                            short passage around it; question 9 (which asked
//                            about the overview's grammar skills) re-aimed at
//                            the passage.
//   U8 read01, U9 read01  — replaced with a short passage built from the real
//                            content those intros carried (entertainment shapes
//                            how we see the world / art transforms communities);
//                            questions 1, 5, 9 re-aimed; the earlier answers stay
//                            true where the passage still supports them.
//   U4 read02 (SunJar)    — NOT touched; the gate's "children will be able to"
//                            hit there is story content, not front matter.
//
// All five readings are narrated, so their clips are stale after this and are
// listed at the end. Idempotent; fails loudly if a source text has moved.
//
// Usage: node tools/repair-ehel-english-grade6-front-matter.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}

let applied = 0, already = 0;
const failures = [], stale = [];
function unit(n) {
  const file = path.join(ENGLISH, "grade-6", "data", "units", `unit-${n}.json`);
  const raw = fs.readFileSync(file, "utf8");
  return { file, raw, doc: JSON.parse(raw), dirty: false };
}
function setReading(u, readingId, title, text) {
  const r = u.doc.readings.find((x) => x.readingId === readingId);
  if (!r) { failures.push(`${readingId} not found`); return; }
  if (r.title === title && r.passageScript === text) { already += 1; return; }
  r.title = title; r.passageScript = text; u.dirty = true; applied += 1;
  if ((r.audio || {}).available) stale.push(`grade-6 reading ${readingId}`);
  console.log(`✔ ${readingId}: ${title}`);
}
function setQuestion(u, questionId, q, a, e) {
  const c = u.doc.comprehension.find((x) => x.questionId === questionId);
  if (!c) { failures.push(`${questionId} not found`); return; }
  if (c.question === q && c.correctAnswer === a && c.explanation === e) { already += 1; return; }
  const oldAnswer = c.correctAnswer;
  c.question = q; c.correctAnswer = a; c.explanation = e; u.dirty = true; applied += 1;
  // The answer key repeats the answer; keep it in step.
  for (const k of u.doc.answerKey || []) {
    if (typeof k.answerOrGuidance === "string" && k.answerOrGuidance.includes(oldAnswer)) {
      k.answerOrGuidance = k.answerOrGuidance.split(oldAnswer).join(a);
    }
  }
  console.log(`✔ ${questionId}`);
}
function stripPreamble(u, readingId, marker) {
  const r = u.doc.readings.find((x) => x.readingId === readingId);
  if (!r) { failures.push(`${readingId} not found`); return; }
  const i = r.passageScript.indexOf(marker);
  if (i === 0) { already += 1; return; }
  if (i < 0) { failures.push(`${readingId}: marker "${marker.slice(0, 40)}" not found`); return; }
  r.passageScript = r.passageScript.slice(i); u.dirty = true; applied += 1;
  if ((r.audio || {}).available) stale.push(`grade-6 reading ${readingId}`);
  console.log(`✔ ${readingId}: preamble removed (${i} chars)`);
}
function save(u) { if (u.dirty && !DRY) fs.writeFileSync(u.file, serialise(u.doc, u.raw), "utf8"); }

// ---------------------------------------------------------------------------
{ // Unit 6 — keep the Hargeisa paragraph, give it a passage.
  const u = unit(6);
  setReading(u, "eng-g06-t02-u06-read01", "The People Who Keep a Community Running", [
    "Every morning in the East African city of Hargeisa, hundreds of people set off to work. Some carry briefcases, some carry toolboxes, and some carry nothing but their knowledge and determination. Each person has a profession, a role that helps keep the community running smoothly. Understanding these roles can help you start thinking about your own future career.",
    "Look closely and you will see how the professions fit together. The physician who opens the clinic at seven o'clock depends on the pharmacist next door and on the driver who brings medicines from the port. The teacher who unlocks the classroom depends on the carpenter who repaired the desks and on the food vendor who sells breakfast at the gate. No profession stands alone; each one is a link in a chain that reaches across the whole town.",
    "Every profession asks for its own mixture of skills. Some, like a lawyer or a physician, need years of study and difficult examinations. Others, like a mechanic or a tailor, are learned with the hands, one repair or one seam at a time, often beside an older worker who passes on the craft. A radio commentator needs a clear voice and quick thinking; a shopkeeper needs patience and a head for figures. What all of them share is responsibility: people rely on them to do their work well and fairly.",
    "Choosing a career starts with noticing what you enjoy and what you are good at. Do you like solving problems, or explaining things, or making something with your hands? Do you prefer working alone or in a busy team? Your interests and strengths are clues, and the working people around you every morning are the best examples of where those clues can lead.",
  ].join("\n"));
  setQuestion(u, "eng-g06-t02-u06-cq001",
    "In which city does the passage say hundreds of people set off to work each morning?",
    "Hargeisa, an East African city, where hundreds of people set off to work each morning.",
    "The first paragraph states that every morning in the East African city of Hargeisa, hundreds of people set off to work.");
  setQuestion(u, "eng-g06-t02-u06-cq009",
    "The passage says that no profession stands alone and calls each one \"a link in a chain\". Explain what this means and give one example from the text of two professions that depend on each other.",
    "It means every job relies on other jobs to work properly; for example, the physician depends on the pharmacist and the driver who brings medicines, or the teacher depends on the carpenter and the food vendor.",
    "The second paragraph gives the chain image and two worked examples: the clinic depends on the pharmacy and the medicine driver, and the school depends on the carpenter and the food vendor.");
  save(u);
}
{ // Unit 8 — read01 becomes a passage; read02 loses its preamble.
  const u = unit(8);
  setReading(u, "eng-g06-t03-u08-read01", "Why Entertainment Matters", [
    "Entertainment is not only about relaxation. It shapes how we see the world. A good film, a powerful documentary, or even a well-made commercial can change how people think and feel. In many East African and Somali communities, storytelling has always been at the heart of culture, from poetry and oral history to modern cinema.",
    "Think about the different ways stories reach you in one week. A film at the cinema tells a story with actors, music and pictures. A television series tells one in short chapters, so that you come back for more. A documentary tells a true story about real people and places. A commercial tells the shortest story of all — a problem, a product, a smile — and it is designed to make you want something. Each form has its own rules, and each one is trying to make you feel something.",
    "The people who make these stories choose every detail. A director decides which character we care about and which moment we remember. An editor decides how fast the story moves. A composer decides whether we feel excited or nervous before anything has even happened on screen. When you notice these choices, you stop being only an audience and become a thoughtful viewer — someone who can enjoy a story and, at the same time, ask who made it and why.",
    "That is why learning about media belongs in an English course. Watching a film critically, describing what you saw, and explaining your opinion in a clear review are all ways of using language to think. And in a region with such a long tradition of storytelling, the thoughtful viewers of today are the storytellers of tomorrow.",
  ].join("\n"));
  setQuestion(u, "eng-g06-t03-u08-cq001",
    "What four ways of telling a story does the passage say might reach you in one week, and which of them is designed to make you want something?",
    "A film, a television series, a documentary and a commercial; the commercial is designed to make you want something.",
    "The second paragraph lists the four forms and says the commercial is the shortest story of all, designed to make you want something.");
  setQuestion(u, "eng-g06-t03-u08-cq005",
    "According to the passage, what turns a member of the audience into a \"thoughtful viewer\"?",
    "Noticing the choices the director, editor and composer have made — enjoying the story while asking who made it and why.",
    "The third paragraph says that when you notice these choices you stop being only an audience and become a thoughtful viewer who asks who made the story and why.");
  setQuestion(u, "eng-g06-t03-u08-cq009",
    "Why does the passage say entertainment is not only about relaxation?",
    "Because entertainment also shapes how people see the world and can change how they think and feel.",
    "The first paragraph explains that a film, documentary or commercial can change how people think and feel.");
  stripPreamble(u, "eng-g06-t03-u08-read02", "Long before anyone owned a television");
  save(u);
}
{ // Unit 9 — read01 becomes a passage; read02 loses its glossary and heading.
  const u = unit(9);
  setReading(u, "eng-g06-t03-u09-read01", "How Art Transforms a Community", [
    "Art, music and creative expression can transform communities and inspire change. To transform something is to change its form so completely that it becomes something new — and all over East Africa, young people are proving that a paintbrush, a drum or a packet of seeds can do exactly that.",
    "In one town, children turned broken objects into beautiful instruments: an old oil tin became a drum, a bicycle wheel became a rattle, and a length of pipe became a flute. In another, teenagers turned empty grey walls into colourful murals of hills, animals and planted trees. In a third, a whole village turned a dusty valley into a thriving green space by planting and watering, week after week, until the ground flourished.",
    "None of these projects began with money. They began with someone who noticed a problem and imagined something better, and with the willingness to keep going when the first attempt failed. Creativity, it turns out, is not only about talent. It is about looking at what everyone else has walked past and asking, \"What could this become?\"",
    "When a place changes, the people in it change too. A street with a mural feels safer and friendlier. A school with a band has children who arrive early to practise. A green valley gives a village shade, food and pride. That is what it means to say that art transforms communities: it does not only decorate them, it helps them grow.",
  ].join("\n"));
  setQuestion(u, "eng-g06-t03-u09-cq001",
    "According to the passage, what three kinds of change did young people make in the three places it describes?",
    "They turned broken objects into beautiful instruments, empty walls into colourful murals, and a dusty valley into a thriving green space.",
    "The second paragraph gives the three examples: instruments from broken objects, murals on empty walls, and a green space in a dusty valley.");
  setQuestion(u, "eng-g06-t03-u09-cq005",
    "The passage uses the word \"transform\". What does it mean, and why is it the right word for what art does to a place?",
    "To transform means to change something so completely that it becomes something new; it fits because the passage shows art changing walls, valleys and even people, not just decorating them.",
    "The first paragraph defines transform, and the last paragraph says art does not only decorate communities, it helps them grow.");
  setQuestion(u, "eng-g06-t03-u09-cq009",
    "The passage says art can \"transform communities and inspire change.\" Explain what this means and give one example the passage mentions.",
    "It means that creative work can improve places and encourage people to act, for example by turning empty walls into colourful murals or a dusty valley into a thriving green space.",
    "The passage links the idea of transformation to concrete examples such as the murals and the green valley, and says the people change with the place.");
  stripPreamble(u, "eng-g06-t03-u09-read02", "In many cities around the world, art has the power");
  save(u);
}

console.log(JSON.stringify({ dry: DRY, applied, alreadyApplied: already, failures: failures.length }));
if (stale.length) console.log("Narrated text changed — clips now stale:\n  " + [...new Set(stale)].join("\n  "));
for (const f of failures) console.error("✘ " + f);
if (failures.length) process.exit(1);
