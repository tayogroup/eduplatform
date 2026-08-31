#!/usr/bin/env node
// Authors activities 7-12 for every Grade 1-4 English unit, taking the count
// from 6 to 12. Owner asked for it on 2026-08-31, Grades 1-4 only; Grades 5-8
// keep their six and are not touched.
//
// EVERY ITEM IS THE UNIT'S OWN MATERIAL. The words are that unit's taught
// vocabulary, the meanings are the `childMeaning` its dictionary already
// carries, the sentences are its own `practiceSentences`, the story questions
// name its own readings, and the pattern to use is its own grammar lesson's
// title. Nothing here invents subject matter: an activity that could have been
// written for any unit is filler, and a unit's own words are also the only
// content guaranteed to be at the right level and already reviewed.
//
// They are authored in the SHAPE THE SLIDE READS BEST — a lead-in line, then
// the items one per line, numbered — because `activitySteps` in
// shell/subjects/english.js splits exactly that into a tickable checklist, and
// `activityStepKeys` gives each step its own answer when `answerSummary`
// carries a matching numbered run. So four of the six new activities mark
// themselves per step, which the existing six mostly cannot.
//
// Two of the six deliberately carry NO numbered key: the story questions and
// the make/plan task are open, and a numbered run there would offer a child a
// single right answer to a question that has none.
//
// Idempotent: it REPLACES any existing 7-12 rather than appending, so a re-run
// after a template change does not leave a unit with eighteen activities.
//
//   node tools/author-english-extra-activities.mjs --dry     # report, write nothing
//   node tools/author-english-extra-activities.mjs           # write
//   node tools/author-english-extra-activities.mjs --grades 1 2
import fs from "node:fs";
import path from "node:path";

const STORY_GLOSSARY_GROUP = "Words from our stories";
const FIRST_NEW = 7;
const LAST_NEW = 12;

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const gradeArg = args.indexOf("--grades");
const GRADES = gradeArg >= 0
  ? args.slice(gradeArg + 1).filter((a) => /^[1-4]$/.test(a)).map(Number)
  : [1, 2, 3, 4];
// An unrecognised argument is refused rather than ignored: the default here
// rewrites 41 units, and a typo that silently falls back to that is the kind of
// mistake you only notice in the diff.
const known = new Set(["--dry", "--grades", "1", "2", "3", "4"]);
const bad = args.filter((a) => !known.has(a));
if (bad.length) { console.error(`✗ unrecognised argument(s): ${bad.join(", ")}`); process.exit(2); }
if (!GRADES.length) { console.error("✗ --grades needs at least one of 1 2 3 4"); process.exit(2); }

// ── the unit's own words ────────────────────────────────────────────────────
// displayWord is not on every link (some carry masterWord instead, and a few
// only the dictionary id), so the fallback chain is required rather than
// defensive — resolving to undefined would put "undefined" on a child's screen.
const wordOf = (link) => link.displayWord
  || link.masterWord
  || (link.dictionaryEntryId || "").replace(/^ehel-en-g\d+-/, "")
  || "";

function usableWords(unit) {
  const links = new Map((unit.dictionaryLinks || []).map((l) => [l.vocabularyId, l]));
  const taught = (unit.vocabularyGroups || []).filter((g) => g.title !== STORY_GLOSSARY_GROUP);
  const out = [];
  for (const group of taught) {
    for (const id of group.vocabularyIds || []) {
      const link = links.get(id);
      if (!link) continue;
      const word = wordOf(link).trim();
      if (!word || !link.childMeaning) continue;
      // The sentence has to actually contain the word, or blanking it produces
      // a gap-fill with no gap and an answer that appears nowhere.
      const candidates = [...(link.practiceSentences || []), link.exampleSentence].filter(Boolean);
      const holder = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const sentence = candidates.find((s) => holder.test(s));
      if (!sentence) continue;
      out.push({ word, meaning: link.childMeaning.trim(), sentence: sentence.trim(), group: group.title, holder });
    }
  }
  return out;
}

const blank = (item) => item.sentence.replace(item.holder, "______");
const sentenceCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const numbered = (lines) => lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
// A key run is read to the END of answerSummary for its last item, so any
// sentence AFTER the run is glued onto the final answer — "The answer: map.
// Each meaning belongs to one word from this unit…" appeared on a Grade 1
// slide. Every summary here therefore puts its note FIRST and ends with the
// run. The strict pattern still finds it: the run opens after a full stop.
const key = (values) => values.map((v, i) => `${i + 1}. ${v}`).join(" ");

// ── the six ─────────────────────────────────────────────────────────────────
// Each returns { title, activityType, instructionsAndItems, answerSummary } or
// null when the unit cannot support it, in which case the caller reports the
// gap rather than writing a half-built activity.
const VOICE = {
  1: { count: 4, meanings: "Read each meaning with your grown-up. Say the word, then write it.", gaps: "Say each sentence. Write the missing word." },
  2: { count: 4, meanings: "Read each meaning. Write the word it tells you about.", gaps: "Read each sentence. Write the missing word." },
  3: { count: 5, meanings: "Read each meaning and write the word it describes.", gaps: "Read each sentence and write the missing word." },
  4: { count: 5, meanings: "Read each meaning and write the word it describes.", gaps: "Read each sentence and write the missing word." },
};

// A meaning that contains its own word answers itself: "A flat mat you put on
// the floor" for `mat`, "A round juicy fruit with a thick orange skin" for
// `orange`. 2,235 of the 5,612 childMeanings across Grades 1-4 do this — 39%,
// so it is the common case rather than a stray. Those words are excluded here
// and stay available to every other activity, where the meaning is not shown.
const tellsAnswer = (item) => item.holder.test(item.meaning);

function actMeanings(unit, grade, words, used) {
  const voice = VOICE[grade];
  const clean = words.filter((w) => !tellsAnswer(w));
  const picked = clean.slice(0, voice.count);
  // Down to 4 in the thinnest unit (Grade 1 Unit 9), so take what is there
  // rather than refusing: three real items beat none.
  if (picked.length < 3) return null;
  picked.forEach((p) => used.add(p.word));
  return {
    title: "What does it mean?",
    activityType: grade <= 2 ? "Read and say" : "Word meanings",
    instructionsAndItems: `${voice.meanings}\n${numbered(picked.map((p) => sentenceCase(p.meaning)))}`,
    answerSummary: `Each meaning belongs to one word from this unit, and spelling counts less than choosing the right word. ${key(picked.map((p) => p.word))}`,
  };
}

function actGaps(unit, grade, words, used) {
  const voice = VOICE[grade];
  // Different words from the meanings activity, so one section does not ask for
  // the same answer twice.
  const picked = words.filter((w) => !used.has(w.word)).slice(0, voice.count);
  if (picked.length < 3) return null;
  picked.forEach((p) => used.add(p.word));
  // The word bank is not decoration, and "use each once" is what makes the note
  // below TRUE. Without them, 7 of the 184 gap-fills have more than one answer
  // that genuinely fits — "Adam is ______ today." takes happy, sad or nine;
  // "Can ______ answer this question?" takes anybody, somebody or everybody;
  // "We can finish the chart ______." takes later or earlier — and a child who
  // wrote the other right answer was shown a different one under "The answer:".
  // The first draft asserted "only one fits", which was simply false for those.
  //
  // Naming the set makes every item decidable by elimination and gives up
  // nothing a recall test was really buying, because the words are one tap away
  // in Vocabulary anyway. It is also the house form rather than a new idea: this
  // unit's own existing activities already do it ("Choose the best word: height,
  // weight, distance, pattern."). Alphabetical, so the order gives nothing away.
  const bank = picked.map((p) => p.word).sort((x, y) => x.localeCompare(y, "en"));
  return {
    title: "Finish the sentence",
    activityType: grade <= 2 ? "Write the word" : "Sentence practice",
    instructionsAndItems: `${voice.gaps} Choose from: ${bank.join(", ")}. Use each word once.\n${numbered(picked.map(blank))}`,
    // The last clause is the honest one and it is here because the word bank
    // does NOT fix everything. It resolved 5 of the 7 ambiguous items by
    // elimination; 2 survive it, and both are pairs that swap cleanly between
    // two frames — happy/sad across "Adam is ______ today." and "Why do you
    // look so ______?", later/earlier across "We can finish the chart ______."
    // and "The bus came ______ than usual today." Nothing detectable
    // distinguishes those; it needs meaning, not structure. So rather than
    // claim a uniqueness that is false twice in 184, the notes say these are
    // the intended answers rather than the only possible ones, which is true
    // everywhere and is what the adult marking it needs to know.
    answerSummary: `Each word is used once, so if one sentence is hard, do the others first and see what is left. These are the intended answers, not the only ones that could work — if a child's word also makes sense in the sentence, it is not wrong. ${key(picked.map((p) => p.word))}`,
  };
}

function actSort(unit, grade, words) {
  const groups = [...new Set(words.map((w) => w.group))];
  if (grade === 1 || groups.length < 2) {
    // Grade 1 teaches a single group (Core words in all ten units), so there is
    // nothing to sort INTO — it needs a different task, not a thinner one.
    //
    // The first draft asked for each word's first letter, and reading the
    // output killed it: the words are printed right there, so the answer is
    // the first character of the thing the child is looking at. A task whose
    // answer can be copied off the page is not practice, and it was going into
    // all ten Grade 1 units. ABC order uses the same printed words and cannot
    // be copied — it needs the alphabet, which Grade 1 is learning anyway
    // (outcome lo05 is the alphabet song).
    const picked = words.slice(0, 6);
    if (picked.length < 3) return null;
    const ordered = [...picked].map((p) => p.word).sort((x, y) => x.localeCompare(y, "en"));
    return {
      title: "Put the words in ABC order",
      activityType: "Alphabet order",
      instructionsAndItems: `Say the alphabet to help you. Write these words again, in ABC order, starting with the one that comes first.\n${numbered(picked.map((p) => p.word))}`,
      // Deliberately no numbered run: the answer is one ORDER, not an answer
      // per line, and numbering it would mark a correct child wrong.
      answerSummary: `In ABC order the words go: ${ordered.join(", ")}. If two words start with the same letter, look at the second letter.`,
    };
  }
  // The two BIGGEST groups, not the first two. Several units carry a group with
  // a single word in it — Grade 3 Unit 4 has two of them — and taking groups in
  // order handed the sort a pile of one, which is not a sort. Ties break on the
  // unit's own order so a re-run picks the same pair.
  const bySize = groups
    .map((title) => ({ title, n: words.filter((w) => w.group === title).length }))
    .sort((x, y) => y.n - x.n || groups.indexOf(x.title) - groups.indexOf(y.title));
  const a = bySize[0]?.title;
  const b = bySize[1]?.title;
  if (!a || !b) return null;
  const fromA = words.filter((w) => w.group === a).slice(0, 3);
  const fromB = words.filter((w) => w.group === b).slice(0, 3);
  if (fromA.length < 2 || fromB.length < 2) return null;
  // Interleaved so the two groups are not already sorted on the page.
  const mixed = [];
  for (let i = 0; i < Math.max(fromA.length, fromB.length); i += 1) {
    if (fromA[i]) mixed.push(fromA[i]);
    if (fromB[i]) mixed.push(fromB[i]);
  }
  return {
    title: "Sort the words",
    activityType: "Sort and group",
    instructionsAndItems: `These words come from two word lists in this unit: “${a}” and “${b}”. Write the right list name next to each word.\n${numbered(mixed.map((m) => m.word))}`,
    answerSummary: `Both lists are in the Vocabulary section of this unit if you want to check. ${key(mixed.map((m) => m.group))}`,
  };
}

function actStory(unit, grade) {
  const readings = (unit.readings || []).filter((r) => r.title);
  if (!readings.length) return null;
  const main = readings.find((r) => /story/i.test(r.type || "")) || readings[0];
  const title = main.title.replace(/^A Poem:\s*/i, "").replace(/^[“"']|[”"']$/g, "");
  const questions = grade <= 2
    ? ["Who is in it?", "Where does it happen?", "What is your favourite part?", "Tell someone one thing that happens in it."]
    : ["Who are the people in it, and what is each one like?", "Where and when does it happen?", "What is the most important thing that happens?", "What would you change if you were writing it, and why?"];
  return {
    title: `Think about “${title}”`,
    activityType: grade <= 2 ? "Talk about the text" : "Reading response",
    // No numbered key: these have no single right answer, and offering one
    // would tell a child their own reading was wrong.
    instructionsAndItems: `Read “${title}” again, or listen to it. Then answer these questions in your own words.\n${numbered(questions)}`,
    answerSummary: `Answers come from the text and will differ between children. Look for answers that point at something really in “${title}” rather than a guess, and accept spoken answers at this stage.`,
  };
}

function actMake(unit, grade) {
  const topic = unit.unit?.unitTitle || "this unit";
  if (grade <= 2) {
    return {
      title: "Make it and show it",
      activityType: "Make and share",
      instructionsAndItems: `Make a small poster about “${topic}”. Use the drawing space on this slide, or paper if you have some.\nDraw one picture that shows what this unit is about.\nWrite two words from this unit on your poster.\nShow it to someone and say one sentence about it.`,
      answerSummary: `There is no single right poster. Success is one clear picture, two words from this unit spelled close enough to read, and one spoken sentence about it.`,
    };
  }
  return {
    title: "Plan it and write it",
    activityType: "Plan and write",
    instructionsAndItems: `Write a short piece of your own about “${topic}”. Plan it first, then write it.\nWrite down three ideas you want to include.\nPut your three ideas in the order you will write them.\nWrite your piece using at least four words from this unit.\nRead it back and fix anything that does not sound right.`,
    answerSummary: `There is no single right piece. Success is a plan that is actually followed, at least four words from this unit used correctly, and evidence the child re-read and changed something.`,
  };
}

function actRoundUp(unit, grade, words) {
  const picked = words.slice(0, 3);
  if (picked.length < 3) return null;
  const lesson = (unit.grammar || [])[0];
  if (!lesson?.title) return null;
  // The PATTERN, not the lesson's name. `title` is a heading — "Name a thing in
  // your classroom" — and asking a child to "write a sentence using the pattern
  // 'Name a thing in your classroom'" names no pattern at all. `ruleAndExamples`
  // holds the actual frame ("This is a / an ___."), so use its first line and
  // fall back to the title only where there is none.
  const frame = (lesson.ruleAndExamples || "").split("\n").map((l) => l.trim()).find(Boolean) || lesson.title;
  // Grade 1 is on cat/bat/hat here. Three written sentences is a Grade 3 task;
  // at Grade 1 the sentence is SAID and the word is written.
  const items = grade === 1
    ? [
      `Say a sentence out loud with the word “${picked[0].word}” in it.`,
      `Say a sentence out loud with the word “${picked[1].word}” in it.`,
      `Say one sentence that uses this pattern: ${frame}`,
      `Write the word “${picked[2].word}” from memory, then check it.`,
    ]
    : [
      `Write one sentence using the word “${picked[0].word}”.`,
      `Write one sentence using the word “${picked[1].word}”.`,
      `Write one sentence that uses this pattern: ${frame}`,
      grade === 2
        ? `Say the word “${picked[2].word}” out loud, then write it from memory.`
        : `Write the word “${picked[2].word}” from memory, then check your spelling in the Vocabulary section.`,
    ];
  return {
    title: "Round-up",
    activityType: grade <= 2 ? "Show what you know" : "Unit round-up",
    instructionsAndItems: `This one brings the unit together. Do each part.\n${numbered(items)}`,
    answerSummary: `Answers will differ between children. Check that each word is used with the right meaning, that item 3 really follows the pattern from “${lesson.title}”, and that the word in item 4 is spelled correctly.`,
  };
}

const BUILDERS = [actMeanings, actGaps, actSort, actStory, actMake, actRoundUp];

// ── writing them in ─────────────────────────────────────────────────────────
function buildFor(unit, grade) {
  const words = usableWords(unit);
  // Shared across the six so no two of them ask for the same answer. Passed
  // rather than global: two units built in one run must not see each other.
  const used = new Set();
  const built = [];
  const gaps = [];
  for (const builder of BUILDERS) {
    const made = builder(unit, grade, words, used);
    if (made) built.push(made); else gaps.push(builder.name);
  }
  return { built, gaps, wordCount: words.length };
}

let unitsTouched = 0;
let written = 0;
const problems = [];

for (const grade of GRADES) {
  const dir = `src/prototypes/ehel-academy/english/grade-${grade}/data/units`;
  const files = fs.readdirSync(dir).filter((n) => /^unit-\d+\.json$/.test(n));
  for (const file of files.sort()) {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const unit = JSON.parse(raw);
    const unitId = unit.unit?.unitId;
    if (!unitId) { problems.push(`${full}: no unit.unitId`); continue; }

    const { built, gaps, wordCount } = buildFor(unit, grade);
    if (gaps.length) problems.push(`${full}: could not build ${gaps.join(", ")} (${wordCount} usable words)`);
    if (built.length !== LAST_NEW - FIRST_NEW + 1) {
      problems.push(`${full}: built ${built.length} of ${LAST_NEW - FIRST_NEW + 1} — refusing to write a partial set`);
      continue;
    }

    const original = unit.activities || [];
    const kept = original.filter((a) => (a.sequence || 0) < FIRST_NEW);
    if (kept.length !== 6) problems.push(`${full}: ${kept.length} original activities, expected 6`);
    const outcomes = (unit.outcomes || []).map((o) => o.outcomeId).filter(Boolean);
    if (!outcomes.length) { problems.push(`${full}: no outcomes to attribute activities to`); continue; }

    const added = built.map((spec, index) => {
      const sequence = FIRST_NEW + index;
      const nn = String(sequence).padStart(2, "0");
      return {
        activityId: `${unitId}-act${nn}`,
        unitId,
        sequence,
        title: spec.title,
        activityType: spec.activityType,
        instructionsAndItems: spec.instructionsAndItems,
        answerSummary: spec.answerSummary,
        // Spread across the unit's real outcomes rather than all pinned to the
        // first, so the extra practice is attributed where it is actually done.
        outcomeId: outcomes[index % outcomes.length],
        deliveryMode: kept[0]?.deliveryMode || "Online or workbook",
        origin: "Ehel activity expansion 2026-08-31 (composed from this unit's own vocabulary, readings and grammar)",
        reviewStatus: "Needs curriculum reviewer sign-off (authored 2026-08-31, not yet reviewed)",
        sourceFile: `src/prototypes/ehel-academy/english/grade-${grade}/data/units/${file}`,
        // Silent by decision (owner, 2026-08-31): narration is a paid
        // ElevenLabs run and paying for wording no reviewer has seen means
        // paying twice, because an edit re-bills the clip. available:false
        // draws no Listen button and is what the content gate allows.
        audio: { available: false, status: "Pending narration — awaiting curriculum review" },
      };
    });

    unit.activities = [...kept, ...added];
    unitsTouched += 1;
    written += added.length;
    if (DRY) continue;
    // Match the file's own formatting: two-space JSON with a trailing newline,
    // and \u escaping left off so the curly quotes stay readable in the diff.
    const nl = raw.includes("\r\n") ? "\r\n" : "\n";
    const out = JSON.stringify(unit, null, 2).replace(/\n/g, nl) + nl;
    fs.writeFileSync(full, out, "utf8");
  }
}

console.log(`${DRY ? "would write" : "wrote"} ${written} activities across ${unitsTouched} unit(s), grades ${GRADES.join(", ")}`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 20)) console.error(`    ${p}`);
  process.exitCode = 1;
} else {
  console.log("every unit got a full set of six, each built from its own material");
}
