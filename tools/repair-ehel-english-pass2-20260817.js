#!/usr/bin/env node
// Second-pass repairs (2026-08-17, later): what sixteen full re-reads found after
// the first pass, minus what the UK-vocabulary and field-name tools already
// took. Every edit is explicit; the two rule-based blocks (evidence locators,
// Grade 6 grammar cleanup) print what they change. Idempotent; loud on a moved
// source. Narrated fields are flagged so the audio staleness checker can list them.
//
// Usage: node tools/repair-ehel-english-pass2-20260817.js [--dry]

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

const files = new Map();
function load(rel) {
  if (!files.has(rel)) { const raw = fs.readFileSync(path.join(ENGLISH, rel), "utf8"); files.set(rel, { raw, doc: JSON.parse(raw), dirty: false }); }
  return files.get(rel);
}
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
let applied = 0, already = 0; const failures = [];
function edit(label, rel, obj, key, from, to) {
  const value = String(obj[key] ?? "");
  if (value.includes(to) && !value.includes(from)) { already += 1; return; }
  if (!value.includes(from)) { failures.push(`${label}: "${from.slice(0, 60)}" not found in ${rel} ${key}`); return; }
  obj[key] = value.split(from).join(to); load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`);
}
function set(label, rel, obj, key, to) { if (obj[key] === to) { already += 1; return; } obj[key] = to; load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`); }
const unit = (g, u) => `grade-${g}/data/units/unit-${u}.json`;
const cq = (g, u, i) => load(unit(g, u)).doc.comprehension[i];

// ---------------------------------------------------------------- regressions of the first pass
{
  const u = load(unit(7, 8)).doc;
  for (const l of u.dictionaryLinks) {
    if (l.sentenceStarter === "I can exiled") set("G7 U8 starter exiled", unit(7, 8), l, "sentenceStarter", "The family was exiled");
    if (l.sentenceStarter === "I can exonerated") set("G7 U8 starter exonerated", unit(7, 8), l, "sentenceStarter", "He was exonerated");
  }
  const g9 = load(unit(7, 9)).doc;
  for (const g of g9.grammar) if (String(g.practice).includes("the the common-mistake note note")) edit("G7 U9 'the the … note note'", unit(7, 9), g, "practice", "the the common-mistake note note", "the common-mistake note");
  // Grade 1 final quiz explanations: "This is a ___. is a Making Things pattern" → readable
  const rel = "grade-1/data/course-final-quiz.json"; const q = load(rel).doc;
  for (const item of q.questions) {
    const m = /^Which sentence pattern comes from (.+)\?$/.exec(item.question);
    if (m) set(`G1 final quiz explanation ${item.questionId}`, rel, item, "explanation", `The pattern “${item.correctAnswer}” comes from ${m[1]}; the other three come from other units.`);
  }
  // Grade 7 Unit 2: the last -ly hyphens (outcomes, writing) after the rule was fixed
  const u2 = load(unit(7, 2)).doc;
  const walk = (o, where) => { if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${where}[${i}]`)); else if (o && typeof o === "object") for (const k of Object.keys(o)) { if (/Id$|^id$|Path$|^source$|^normal$|^slow$/.test(k)) continue; if (typeof o[k] === "string" && /brightly-coloured|freshly-made/.test(o[k])) { o[k] = o[k].replace(/brightly-coloured/g, "brightly coloured").replace(/freshly-made/g, "freshly made"); load(unit(7, 2)).dirty = true; applied += 1; console.log(`✔ G7 U2 -ly hyphen ${where}.${k}`); } else walk(o[k], `${where}.${k}`); } };
  walk(u2, "");
}
// ---------------------------------------------------------------- marking voice still on the child's page
{
  const M = [
    [2, 4, 4, "explanation", "One mark is for the jump and one for saying when it happens.", "A good answer gives the jump and says when it happens."],
    [2, 4, 7, "explanation", "The mark is for each half.", "A good answer gives both halves."],
    [2, 8, 4, "explanation", "Two of them are enough for the mark.", "Two of them are enough."],
    [2, 8, 11, "explanation", "The mark is for the reason, not for the choice.", "The reason matters more than the choice."],
    [2, 8, 18, "explanation", "The mark is earned when both jobs are real household jobs and each is written as a complete sentence.", "A good answer names two real household jobs, each in a complete sentence."],
    [2, 8, 19, "explanation", "The second mark is for a reason that links her gladness to the helping she did.", "A good answer also gives a reason that links her gladness to the helping she did."],
    [2, 9, 19, "explanation", "The mark is earned when you name a helpful action and keep a trusted adult involved.", "A good answer names a helpful action and keeps a trusted adult involved."],
    [2, 3, 8, "explanation", "a child who lists three of them has answered fully", "listing three of them answers fully"],
    [3, 2, 1, "explanation", "so any two of them earn the mark", "so any two of them are enough"],
    [3, 4, 5, "explanation", "so all three pairs are needed for the mark", "so give all three pairs"],
    [4, 8, 1, "explanation", "so a full mark needs building and lifting", "so give both building and lifting"],
    [4, 8, 2, "explanation", "so either pair of details earns the mark", "so either pair of details is enough"],
    [7, 5, 3, "explanation", "any three of them earn the mark", "any three of them are enough"],
    [7, 1, 4, "explanation", "The learner combines two details", "You combine two details"],
  ];
  for (const [g, u, i, key, from, to] of M) {
    const list = load(unit(g, u)).doc.comprehension;
    const c = list.find((x, idx) => idx === i && (String(x[key]).includes(from) || String(x[key]).includes(to))) || list.find((x) => String(x[key]).includes(from) || String(x[key]).includes(to));
    if (!c) { failures.push(`marking G${g}U${u} cq${i}: "${from.slice(0, 40)}" not found`); continue; }
    edit(`G${g} U${u} marking voice ${c.questionId.slice(-5)}`, unit(g, u), c, key, from, to);
  }
  for (const [u, from, to] of [[8, "credit the reasoning and the use of evidence.", "what matters is your reasoning and your use of evidence."], [8, "credit the link between the example and the technique.", "what matters is the link between the example and the technique."], [8, "credit reasoning about voice, accuracy and who controls the telling.", "what matters is your reasoning about voice, accuracy and who controls the telling."], [8, "credit the explanation of cause rather than the choice of story.", "what matters is your explanation of cause rather than the choice of story."]]) {
    for (const c of load(unit(6, u)).doc.comprehension) if (String(c.explanation).includes(from)) edit(`G6 U8 credit… ${c.questionId.slice(-5)}`, unit(6, u), c, "explanation", from, to);
  }
}
// ---------------------------------------------------------------- overviews and outcomes in the third person
{
  const O = [
    [3, 7, "Learners meet fifteen nature words, from climate and temperature to matter, energy and planet. They use the present perfect", "You will meet fifteen nature words, from climate and temperature to matter, energy and planet. You will use the present perfect"],
    [5, 2, "Learners study twenty-five words such as burrow, boycott, glare, cooperate and ownership, and they master indefinite pronouns, singular agreement and adverbial phrases. They separate fact from opinion, compare biography with autobiography, and write a friendly blog post of their own.", "You will study twenty-five words such as burrow, boycott, glare, cooperate and ownership, and you will master indefinite pronouns, singular agreement and adverbial phrases. You will separate fact from opinion, compare biography with autobiography, and write a friendly blog post of your own."],
    [5, 4, "Learners read an information text about the two forms", "You will read an information text about the two forms"],
    [5, 4, "Twenty-five describing words, from hasty and reluctant to justifiable and prosperous, are studied in four groups.", "You will study twenty-five describing words, from hasty and reluctant to justifiable and prosperous, in four groups."],
    [5, 4, "the unit closes with every learner writing an original legend.", "the unit closes with you writing an original legend of your own."],
    [5, 7, "Learners compare two first-person accounts of one market morning, then follow", "You will compare two first-person accounts of one market morning, then follow"],
    [5, 7, "Along the way they learn to separate facts from opinions", "Along the way you will learn to separate facts from opinions"],
    [5, 7, "The unit ends with each learner retelling a familiar story", "The unit ends with you retelling a familiar story"],
    [6, 2, "Learners study twenty-eight precise words such as ecosystem, transpiration, efficient, propaganda and restoration, and they master the First Conditional, including 'unless' and modal verbs. They separate fact from opinion, then write a biography, a sports commentary and persuasive pieces of their own.", "You will study twenty-eight precise words such as ecosystem, transpiration, efficient, propaganda and restoration, and you will master the First Conditional, including 'unless' and modal verbs. You will separate fact from opinion, then write a biography, a sports commentary and persuasive pieces of your own."],
  ];
  for (const [g, u, from, to] of O) edit(`G${g} U${u} overview second person`, unit(g, u), load(unit(g, u)).doc.unit, "unitOverview", from, to);
  const g1u2 = load(unit(1, 2)).doc;
  for (const o of g1u2.outcomes) if (o.learningOutcome.includes("Say what their family does together")) edit("G1 U2 outcome pronoun", unit(1, 2), o, "learningOutcome", "Say what their family does together", "Say what your family does together");
  for (const s of g1u2.selfAssessment || []) if (String(s.statement).includes("their family does together")) edit("G1 U2 self-assessment pronoun", unit(1, 2), s, "statement", "I can say what their family does together", "I can say what my family does together");
  const g1u7 = load(unit(1, 7)).doc;
  for (const o of g1u7.outcomes) if (o.learningOutcome.includes("Say how they get to school")) edit("G1 U7 outcome pronoun", unit(1, 7), o, "learningOutcome", "Say how they get to school", "Say how you get to school");
  for (const s of g1u7.selfAssessment || []) if (String(s.statement).includes("how they get to school")) edit("G1 U7 self-assessment pronoun", unit(1, 7), s, "statement", "I can say how they get to school", "I can say how I get to school");
}
// ---------------------------------------------------------------- Grade 6 U7 / U9 grammar: raw source page → the fields the card already has
{
  const HEAD = "What it means and why it matters\n";
  const CUT = /\n(Common mistakes|A common mistake|Memory tip|Practice \d|Mixed Practice)\n/;
  for (const u of [7, 9]) {
    const doc = load(unit(6, u)).doc;
    for (const g of doc.grammar) {
      let expl = String(g.explanation || ""), rule = String(g.ruleAndExamples || "");
      if (!expl.startsWith(HEAD)) continue;
      const body = expl.slice(HEAD.length).trim();
      let newRule = rule.startsWith(HEAD) ? rule.slice(HEAD.length) : rule;
      if (newRule.startsWith(body)) newRule = newRule.slice(body.length).replace(/^\s+/, "");
      const m = CUT.exec("\n" + newRule);
      if (m) newRule = newRule.slice(0, Math.max(0, m.index - 1)).trim();
      // headings read aloud: give them a colon
      newRule = newRule.replace(/^(How to form (?:it|and use it)|The four groups|When to use each group|The singular verb rule|Using they\/their\/them with indefinite pronouns|Indefinite pronouns with adjectives|Indefinite pronouns with else|Double negatives — a trap to avoid|The OSASCOMP order|Step-by-step guide|Examples|When to use the present perfect|Example paragraph)$/gm, "$1:");
      if (newRule.length < 40) { failures.push(`G6 U${u} ${g.grammarId}: rule would collapse to ${newRule.length} chars`); continue; }
      set(`G6 U${u} ${g.grammarId.slice(-9)} explanation without source heading`, unit(6, u), g, "explanation", body);
      set(`G6 U${u} ${g.grammarId.slice(-9)} rule without duplicated explanation/mistakes/practice`, unit(6, u), g, "ruleAndExamples", newRule);
    }
  }
}
// ---------------------------------------------------------------- 35 comprehension explanations that located evidence in the wrong sentence
{
  const L = [
    [2,1,1,"The final short sentence, “Words help us learn!”, gives the reason.","The text says “Words help us learn!”, which gives the reason."],
    [2,2,0,"Both jobs are in the second and third sentences of the text, one job in each sentence.","Both jobs are named in the text, one after the other."],
    [2,2,2,"The last sentence gives both reasons:","The text gives both reasons:"],
    [2,2,7,"Leila says this in her very first sentence.","Leila says this herself in the text."],
    [2,2,8,"Her second sentence names her workplace.","Leila names her workplace herself."],
    [2,2,11,"The last sentence holds both answers,","The text holds both answers,"],
    [2,3,3,"The very first sentence of the text lists all three activities together.","The text lists all three activities together."],
    [2,3,4,"The second sentence says that moving your body","The text says that moving your body"],
    [2,3,7,"The first sentence of the spoken text names the day.","The text names the day."],
    [2,3,9,"The last sentence of the text says that moving helps","The text says that moving helps"],
    [2,5,8,"and the last sentence lists them together.","and the text lists them together."],
    [2,6,0,"The second and third sentences of the text give both answers, one after the other.","The text gives both answers, one after the other."],
    [2,7,2,"The word because in the third sentence points straight to the reason.","The word because in the text points straight to the reason."],
    [2,7,4,"This question asks you to read the closing sentence and turn it into your own answer.","This question asks you to find what the text says and turn it into your own answer."],
    [2,7,5,"The second sentence names the job that green leaves do","The text names the job that green leaves do"],
    [2,7,9,"The second sentence of the family text names both the action and the helper.","The family text names both the action and the helper."],
    [2,7,11,"The last sentence of the text holds the family promise.","The text holds the family promise."],
    [2,8,4,"The second and third sentences give the meaning of the word flat right after they use it.","The text gives the meaning of the word flat right after it uses it."],
    [2,8,7,"Theo says it in his second sentence, naming both the builder and the place.","Theo says it himself, naming both the builder and the place."],
    [2,9,10,"and Leo's last line names the Ferris wheel in the park.","and Leo names the Ferris wheel in the park."],
    [3,1,0,"The second, third, fourth and fifth sentences list the whole household,","The text lists the whole household,"],
    [3,5,0,"The second sentence of the recount names Adam","The recount names Adam"],
    [3,5,3,"The final sentence gives the reason straight after the word because.","The text gives the reason straight after the word because."],
    [3,6,1,"The final sentence gives the reason, and the word because points straight to it.","The text gives the reason, and the word because points straight to it."],
    [3,6,6,"The first spoken line names Nora, and every later sentence keeps describing the same person.","The text names Nora, and every later sentence keeps describing the same person."],
    [3,7,0,"The second sentence of the text states that the sunshine warms the land.","The text states that the sunshine warms the land."],
    [3,8,0,"The second sentence names addition as the operation Amal uses for prices.","The text names addition as the operation Amal uses for prices."],
    [4,3,4,"Amal answers the first question by naming","Amal answers by naming"],
    [4,5,0,"The third sentence names the whistle as the starting sound,","The text names the whistle as the starting sound,"],
    [4,6,7,"Her second reply names the place with by and then the task,","One of her replies names the place with by and then the task,"],
    [4,6,8,"The rule and the advice sit in her last reply,","The rule and the advice sit in one of her replies,"],
    [4,7,0,"The first sentence names the spelling test and links it directly to the word nervous.","The text names the spelling test and links it directly to the word nervous."],
    [4,9,4,"The third sentence pairs the trains and ships","The text pairs the trains and ships"],
    [7,6,9,"Evaluation: the final paragraph gives Sana's definition of achievement,","Evaluation: the text gives Sana's definition of achievement,"],
  ];
  for (const [g, u, i, from, to] of L) edit(`G${g} U${u} cq[${i}] evidence locator`, unit(g, u), cq(g, u, i), "explanation", from, to);
}
// ---------------------------------------------------------------- clear-cut factual / rule slips
{
  const g3u9 = load(unit(3, 9)).doc;
  edit("G3 U9 not the last unit (overview)", unit(3, 9), g3u9.unit, "unitOverview", "This last unit of Year 3 explores", "This unit explores");
  if (String(g3u9.unit.learningPath).includes("celebrate the end of Year 3")) edit("G3 U9 not the last unit (path)", unit(3, 9), g3u9.unit, "learningPath", "celebrate the end of Year 3", "celebrate what you have learned");
  for (const s of g3u9.liveSessions || []) for (const k of ["agenda", "beforeSession", "afterSession"]) if (String(s[k]).includes("celebrating the end of Year 3")) edit("G3 U9 not the last unit (session)", unit(3, 9), s, k, "celebrating the end of Year 3", "celebrating the unit");
  edit("G7 U9 not the final unit", unit(7, 9), load(unit(7, 9)).doc.unit, "unitOverview", " — the final unit of Year 7!", "!");
  for (const r of load(unit(3, 7)).doc.readings) if (String(r.passageScript).includes("may have froze into")) edit("G3 U7 froze → frozen", unit(3, 7), r, "passageScript", "may have froze into", "may have frozen into");
  edit("G4 U2 rusting → rustling", unit(4, 2), load(unit(4, 2)).doc.grammar[2], "ruleAndExamples", "The leaves are rusting in the rain.", "The leaves are rustling in the rain.");
  const g4u1 = load(unit(4, 1)).doc.grammar[1];
  edit("G4 U1 grammar 2 item 4: daily after the verb", unit(4, 1), g4u1, "practice", "He eats breakfast every single day, so he ______ eats breakfast.", "He eats breakfast every single day, so he eats breakfast ______.");
  const g5u6 = load(unit(5, 6)).doc.grammar[5];
  edit("G5 U6 grammar 6 item: although = contrast", unit(5, 6), g5u6, "practice", "Although the book was exciting and I could not stop reading.", "Although the book was long and I could not stop reading.");
  edit("G5 U6 grammar 6 key: although = contrast", unit(5, 6), g5u6, "practice", "\"Although the book was exciting, I could not stop reading.\"", "\"Although the book was long, I could not stop reading.\"");
  const g5u8 = load(unit(5, 8)).doc.grammar[3];
  edit("G5 U8 grammar 4 key: no commas between cumulative adjectives", unit(5, 8), g5u8, "practice", "1. a small, fluffy, black cat 2. a beautiful, long, red dress 3. a fascinating, old, local museum 4. an ancient, round, grey stone.", "1. a small fluffy black cat 2. a beautiful long red dress 3. a fascinating old local museum 4. an ancient round grey stone.");
  edit("G7 U4 grammar 5: 'Certainly' is not a mistake", unit(7, 4), load(unit(7, 4)).doc.grammar[4], "commonMistake", "Mistake: \"Certainly, it was a terrible day.\" Fix: \"Unfortunately, it was a terrible day.\" — certainly signals confidence or agreement, not sadness.", "Mistake: \"Unfortunately, it was a wonderful day.\" Fix: \"Fortunately, it was a wonderful day.\" — unfortunately introduces bad news, not good.");
  const g8u10 = load(unit(8, 10)).doc;
  for (const r of g8u10.readings) {
    if (String(r.passageScript).includes("four steady questions")) edit("G8 U10 review text: five toolkit questions", unit(8, 10), r, "passageScript", "handed you four steady questions to slow that race: who wrote this, when was it written, what evidence supports it, and who benefits if I believe it?", "handed you five steady questions to slow that race: who wrote this, when was it written, what evidence supports it, is it plausible, and who benefits if I believe it?");
    if (String(r.passageScript).includes("the toolkit's four questions")) edit("G8 U10 review text: five (2)", unit(8, 10), r, "passageScript", "the toolkit's four questions", "the toolkit's five questions");
    if (String(r.passageScript).includes("the flyer's author had never been found")) edit("G8 U10 review text: Kian confessed", unit(8, 10), r, "passageScript", "Amal reported that the flyer's author had never been found.", "Amal reported that the flyer's author had come forward and confessed.");
  }
  for (const c of g8u10.comprehension) {
    if (String(c.correctAnswer).includes("To ask four questions first")) { edit("G8 U10 cq: five questions", unit(8, 10), c, "correctAnswer", "To ask four questions first: who wrote this, when was it written, what evidence supports it, and who benefits if I believe it.", "To ask five questions first: who wrote this, when was it written, what evidence supports it, is it plausible, and who benefits if I believe it."); edit("G8 U10 cq explanation: five", unit(8, 10), c, "explanation", "the four toolkit questions", "the five toolkit questions"); }
  }
  for (const w of g8u10.writing) if (String(w.modelText).includes("apply the same four questions")) edit("G8 U10 model: five questions", unit(8, 10), w, "modelText", "apply the same four questions", "apply the same five questions");
  for (const a of g8u10.activities) if (String(a.instructionsAndItems).includes("four questions")) edit("G8 U10 activity: five questions", unit(8, 10), a, "instructionsAndItems", "four questions", "five questions");
  for (const a of g8u10.answerKey) if (String(a.answerOrGuidance).includes("four questions")) edit("G8 U10 key: five questions", unit(8, 10), a, "answerOrGuidance", "four questions", "five questions");
  for (const r of load(unit(8, 5)).doc.readings) if (String(r.passageScript).includes("At home, their grandfather started walking with Tariq")) edit("G8 U5 grandfather", unit(8, 5), r, "passageScript", "At home, their grandfather started walking with Tariq", "At home, Tariq's grandfather started walking with him");
  const g8u1 = load(unit(8, 1)).doc;
  for (const g of g8u1.grammar) if (String(g.ruleAndExamples).includes("and long becomes longevity")) edit("G8 U1 longevity", unit(8, 1), g, "ruleAndExamples", "and long becomes longevity", "and longevity comes from the Latin for long life");
  for (const a of g8u1.activities) if (String(a.instructionsAndItems).includes("conscientious (adjective) — conscience (noun)")) edit("G8 U1 conscientiousness", unit(8, 1), a, "instructionsAndItems", "conscientious (adjective) — conscience (noun)", "conscientious (adjective) — conscientiousness (noun)");
  for (const r of load(unit(4, 3)).doc.readings) if (String(r.passageScript).includes("said Omar the baker")) edit("G4 U3 Omar is a stallholder", unit(4, 3), r, "passageScript", "said Omar the baker", "said Omar the stallholder");
  edit("G3 U2 grammar 4 mistake is a real mistake", unit(3, 2), load(unit(3, 2)).doc.grammar[3], "commonMistake", "Mistake: “This book is our grammar book.” The word from is missing.", "Mistake: “This idea is our grammar book.” The word from is missing.");
}

for (const [rel, f] of files) if (f.dirty && !DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw), "utf8");
console.log(JSON.stringify({ dry: DRY, applied, alreadyApplied: already, failures: failures.length }));
for (const f of failures) console.error("✘ " + f);
if (failures.length) process.exit(1);
