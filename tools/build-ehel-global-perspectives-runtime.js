// Build the Ehel Academy Global Perspectives runtime packages from the
// extracted content model. Mirrors the Science and Computing builders.
//
// NEVER hand-edit src/prototypes/ehel-academy/global-perspectives/grade-*/data/
// — it is generated, and the next build overwrites it. Fix this builder instead.
//
// TWO PACK SHAPES, ONE RUNTIME
// ============================
//   Years 1-3  "guided"     Teacher & Parent Guide + Activity Sheet + Mini-Project
//   Years 4-8  "self-study" Lesson + Skills Toolkit + Activities & Discussion
//                           + Practice & Reflection
//
// The Years 4-8 books are already written to the learner and are carried across
// as written. The Years 1-3 guides are written to the grown-up ("Hello, and
// welcome to your child's very first project"), and this course is self-teaching
// — there is no adult on the other side of the screen — so their prose is run
// through the shared learner-voice converter and anything that survives as pure
// classroom management is dropped rather than shown. check-global-perspectives-
// content.mjs is the gate on that.
//
// WHAT MAKES THIS SUBJECT DIFFERENT
// =================================
// Global Perspectives teaches six transferable SKILLS (Research, Analysis,
// Evaluation, Reflection, Collaboration, Communication) rather than a body of
// knowledge, and each Years 4-8 unit is one skill end to end. That is why a
// unit's Cambridge objectives can be resolved from its title: unit "Research"
// at Stage 6 covers exactly the four Research sub-strands at Stage 6. The Year 7
// and Year 8 packs print that mapping themselves in a `Code | What Cambridge
// says` table, and the build PROVES its resolution against those tables rather
// than assuming it — see verifyObjectiveMapping.
//
// Usage:
//   node tools/build-ehel-global-perspectives-runtime.js            # every grade
//   node tools/build-ehel-global-perspectives-runtime.js 6 7        # only these

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MODEL_PATH = path.join(ROOT, "outputs", "global-perspectives-content", "global-perspectives-content-model.json");
const COURSE_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "global-perspectives");
const CURRICULUM_DIR = path.join(ROOT, "src", "curriculum");

const { createLearnerVoice } = require("./lib/ehel-learner-voice.js");

// Global Perspectives vocabulary. The learner researches, reflects and
// collaborates; they do not debug or run programs, so Computing's verbs would
// never fire here and these would never fire there.
const VOICE = createLearnerVoice({
  learnerVerbs: ["research", "researches", "reflect", "reflects", "collaborate", "collaborates",
    "investigate", "investigates", "interview", "interviews", "survey", "surveys",
    "compare", "compares", "decide", "decides", "notice", "notices", "wonder", "wonders",
    "share", "shares", "listen", "listens", "talk", "talks", "ask", "asks", "plan", "plans"],
  learnerPossessions: ["research", "questions?", "journals?", "posters?", "surveys?",
    "interviews?", "findings?", "reasons?", "opinions?", "views?", "challenges?",
    "predictions?", "conclusions?", "notes?", "families|family", "communit(?:y|ies)"],
  thirdPerson: {
    researches: "research", reflects: "reflect", collaborates: "collaborate",
    investigates: "investigate", interviews: "interview", surveys: "survey",
    compares: "compare", decides: "decide", notices: "notice", wonders: "wonder",
    shares: "share", listens: "listen", talks: "talk", asks: "ask", plans: "plan",
  },
});
const { tidy, capitalise, learnerVoice } = VOICE;
// The shared patterns are deliberately NOT used to judge learner-safety here —
// see GP_ADULT_ONLY below for why this subject needs its own.

const slug = (value = "") => tidy(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pad2 = (n) => String(n).padStart(2, "0");
const uniq = (list) => [...new Set(list)];

// ---------------------------------------------------------------------------
// Callout markers → runtime meaning
// ---------------------------------------------------------------------------
// The packs teach through emoji-led boxes and each marker has a fixed job. This
// is the whole mapping; a marker that is not here falls through to a plain note
// so a new box in a future pack is never silently dropped.
const CALLOUT_ROLE = {
  "🤖": "tutor",       // Ask Your AI Tutor — the course's stand-in discussion partner
  "💡": "bigIdea",     // one idea to hold on to
  "🔍": "model",       // a worked look at the skill, usually following one learner
  "🗣": "speak",       // say it out loud / bring it to someone
  "💬": "speak",
  "🤝": "teacher",     // in your next teacher session
  "👥": "teacher",     // with your team, in the teacher session
  "🪞": "reflect",
  "📝": "write",
  "📓": "write",
  "🎵": "chant",
  "🌍": "bigIdea",
  "🌱": "bigIdea",
  "♻": "bigIdea",
  "💧": "bigIdea",
  "🏠": "speak",
  "👪": "speak",
  "🧓": "speak",
  "💛": "bigIdea",
  "💚": "bigIdea",
  "📖": "model",
  "👋": "speak",
  "😀": "reflect",
  "⭐": "bigIdea",
  "☆": "bigIdea",
  "🖍": "write",
  "🏃": "speak",
  "👉": "speak",
};

// Sub-strand codes per strand, in the order Cambridge publishes them. Shared
// with the framework extractor by construction: both derive from the same
// published ordering, and verifyObjectiveMapping fails the build if they ever
// disagree with what a pack quotes.
const STRAND_SUB_STRANDS = {
  Research: ["Rq", "Ri", "Rc", "Rf"],
  Analysis: ["Ap", "Ad", "Ac", "As"],
  Evaluation: ["Es", "Ea"],
  Reflection: ["Fc", "Ft", "Fv", "Fl"],
  Collaboration: ["Cc", "Ct"],
  Communication: ["Mi", "Ml"],
};

// ---------------------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------------------
// Every document is a flat run of blocks under bold headings. A section is a
// heading plus everything up to the next heading.
function sections(doc) {
  const out = [];
  let current = null;
  for (const block of doc.blocks) {
    if (block.type === "heading") {
      if (current) out.push(current);
      current = { title: tidy(block.text), blocks: [] };
      continue;
    }
    if (!current) current = { title: "", blocks: [] };
    current.blocks.push(block);
  }
  if (current) out.push(current);
  return out;
}

const paragraphsOf = (blocks) => blocks.filter((b) => b.type === "paragraph").map((b) => tidy(b.text)).filter(Boolean);
const listsOf = (blocks) => blocks.filter((b) => b.type === "list");
const tablesOf = (blocks) => blocks.filter((b) => b.type === "table");
const calloutsOf = (blocks) => blocks.filter((b) => b.type === "callout");
const allListItems = (blocks) => listsOf(blocks).flatMap((b) => b.items.map(tidy)).filter(Boolean);

// The first two blocks of every document are its title lines; they are
// navigation furniture, not teaching, and would otherwise open every explainer.
function stripTitleLines(doc) {
  const copy = { ...doc, blocks: doc.blocks.slice() };
  let removed = 0;
  while (copy.blocks.length && removed < 2) {
    const first = copy.blocks[0];
    const text = tidy(first.text || "");
    if (first.type !== "heading" && first.type !== "paragraph") break;
    // Three title-line shapes ship. Year 3 Unit 5 alone drops the colon
    // ("Year 3 - Unit 5 Activity Sheet") and puts the subject first on the
    // second line ("Global Perspectives - Teacher & Parent Guide"), which the
    // colon-and-suffix rules both missed — so that unit opened on its own
    // filename.
    if (/^Year\s+\d+\s*[-–—]\s*Unit\s+\d+\b/.test(text)
      || /[-–—]\s*Global Perspectives\s*$/.test(text)
      || /^Global Perspectives\s*[-–—]/.test(text)) {
      copy.blocks.shift();
      removed += 1;
      continue;
    }
    break;
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------
// Self-study prose is already learner-facing and is carried across untouched;
// converting it would only degrade good writing. Guide prose is converted.
function speak(text, isGuide) {
  const value = tidy(text);
  if (!value) return "";
  if (!isGuide) return value;
  return learnerVoice(value, { guide: true });
}

// Global Perspectives needs its own definition of "addressed to an adult", not
// the shared one, and the difference matters in both directions.
//
// TOO BROAD, in the shared list: it rejects any sentence containing "grown-up",
// "teacher" or "children". In this subject those are ordinary learner
// vocabulary — "Tell your grown-up why" is an instruction TO the learner, the
// Stage 1-3 model has a grown-up beside them by design, and "how the children
// at Ehel Academy travel to school" is the topic being researched. Using the
// shared list stripped the teaching prose out of the Years 1-3 activity sheets
// and left 53-character explainers behind.
//
// TOO NARROW, in the shared list: it does not know this subject's own guide
// phrasing ("What good looks like at this age", "You will not test these
// skills or give any marks").
//
// So: the learner may be TOLD ABOUT an adult; the text may not be told TO one.
const GP_ADULT_ONLY = /\byour child\b|\bhelp your child\b|\bthe child (?:draws|writes|points|says|is|will|needs|can|has)\b|\blet (?:the|your) child\b|\ba note (?:for|to) the grown-?up\b|\bfor the grown-?up\b|\byou,? the grown-?up\b|\bthis guide is written\b|\bwhat good looks like\b|\bthe answer key is for you\b|\byou will not (?:test|mark)\b|\bgive any marks\b|\bas you teach\b|\bat this age\b|\bone per child\b|\bprint one\b|\bstay close by\b|\bchildren (?:this age|are experts)\b|\bplease read (?:every|each|it|this)\b/i;

// Staging a learner working at home cannot act on. Narrower than the shared
// CLASSROOM list, which includes "their own" and "the class" — both of which
// occur in perfectly good learner prose here.
const GP_NEEDS_A_ROOM = /\bon the board\b|\bthe big sheet\b|\bphotocopy\b|\bhand out\b|\bcircle time\b|\bon the carpet\b|\bgo round the (?:class|room)\b|\bpicture cards\b|\btalk to (?:a|your) partner\b|\bdiscuss (?:as|with) (?:a|the) class\b/i;

// The books explain, in so many words, that the AI tutor replaces the partner
// work the published subject assumes: "In the old style of this subject,
// learners were told to 'talk to a partner'. In our model, your AI tutor is
// your partner and your class." That sentence quotes the phrase in order to
// retire it, so matching on the quote alone deletes the explanation of the
// course's own teaching model.
const REFRAMES_PARTNER_WORK = /\bAI tutor\b|\bin the old style\b|\bwere told to\b|\binstead of\b|\brather than\b/i;

function learnerSafe(text) {
  const value = tidy(text);
  if (!value) return false;
  if (GP_ADULT_ONLY.test(value)) return false;
  if (GP_NEEDS_A_ROOM.test(value) && !REFRAMES_PARTNER_WORK.test(value)) return false;
  return true;
}

function convertLines(lines, isGuide) {
  return lines.map((line) => speak(line, isGuide)).filter((line) => line && learnerSafe(line));
}

// ---------------------------------------------------------------------------
// Callouts
// ---------------------------------------------------------------------------
function collectCallouts(doc, isGuide) {
  const collected = [];
  for (const block of doc.blocks) {
    if (block.type !== "callout") continue;
    const role = CALLOUT_ROLE[block.marker] || "note";
    const lines = convertLines(block.lines || [], isGuide);
    const title = speak(block.title, isGuide) || tidy(block.title);
    if (!title && !lines.length) continue;
    collected.push({ role, marker: block.marker, title, lines, source: doc.role });
  }
  return collected;
}

// ---------------------------------------------------------------------------
// Explainers — the self-teaching core
// ---------------------------------------------------------------------------
// A learner working alone reads these instead of hearing a teacher, so an
// explainer that stops mid-idea is worse than no explainer. Prose is never
// clipped: the whole section body is carried, paragraphs joined by a blank line
// so the runtime can render one <p> each.
const FRONT_MATTER = /^(hello|hello again|welcome|welcome back|how you will learn|how to use|a note for|about this (?:unit|project)|what comes next|contents)/i;

// The Years 1-3 Activity Sheets are written to the child but drop the
// occasional aside to whoever is sitting with them ("A note for the grown-up:
// read every part aloud"). That line belongs in the grown-up's section, not in
// the middle of the child's lesson.
const GROWN_UP_ASIDE = /^(?:a\s+)?note\s+(?:for|to)\s+the\s+grown-?up\b|^for\s+the\s+grown-?up\b/i;

function buildExplainers(lessonDoc, isGuide) {
  const out = [];
  const grownUpNotes = [];
  const lead = [];
  for (const section of sections(stripTitleLines(lessonDoc))) {
    const title = section.title;
    // The paragraphs before the first heading are the document's own welcome
    // ("Hello! My name is Sana… Let's talk and draw together!"). Skipping every
    // untitled section threw that away and opened the unit on activity 1.
    if (!title) {
      for (const paragraph of paragraphsOf(section.blocks)) {
        if (GROWN_UP_ASIDE.test(paragraph)) grownUpNotes.push(paragraph);
        else if (learnerSafe(paragraph)) lead.push(speak(paragraph, isGuide));
      }
      continue;
    }
    const raw = paragraphsOf(section.blocks);
    const asides = raw.filter((p) => GROWN_UP_ASIDE.test(p));
    grownUpNotes.push(...asides);
    const paragraphs = raw
      .filter((p) => !GROWN_UP_ASIDE.test(p))
      .map((p) => speak(p, isGuide))
      .filter((p) => p && learnerSafe(p));
    const bullets = allListItems(section.blocks).map((b) => speak(b, isGuide)).filter((b) => b && learnerSafe(b));
    // Much of the Years 1-3 teaching is IN the tables — the friendship-rules
    // grid, the near-or-far label sorter. Dropping them left sections that
    // looked like a bare heading with one line under it.
    const tables = tablesOf(section.blocks).map((t) => ({
      headers: t.rows[0].map(tidy),
      rows: t.rows.slice(1).map((r) => r.map(tidy)),
    }));
    const body = paragraphs.join("\n\n");
    // A section that survives with nothing but its heading was addressed to the
    // adult, not the learner. Dropping it is right; the checker counts how many
    // were dropped so a pack that converts badly is visible, not silent.
    if (!body && !bullets.length && !tables.length) continue;
    out.push({
      id: `explain-${out.length + 1}`,
      slug: slug(title).slice(0, 60),
      title,
      body,
      bullets,
      tables,
      isFrontMatter: FRONT_MATTER.test(title),
    });
  }
  return { explainers: out, grownUpNotes, lead: lead.filter(Boolean).join("\n\n") };
}

// ---------------------------------------------------------------------------
// The grown-up's guide (Years 1-3)
// ---------------------------------------------------------------------------
// The Teacher & Parent Guide is a letter to the adult from its first line to
// its last: "Hello, and welcome to your child's very first Global Perspectives
// project", "You will not test these skills or give any marks."
//
// Running it through the learner-voice converter was tried and produced broken
// prose — "you and you will explore", "hear other you talk about your families"
// — because the guide is not lesson text with an adult frame around it, the way
// the Computing Teacher Guides are. It is genuinely written FOR the adult.
//
// The Stage 1-3 model has a grown-up beside the learner by design, so this is
// kept whole, in its own voice, in its own clearly labelled section — and the
// learner's own teaching comes from the Activity Sheet, which is already
// written to the child. That is why isGuide is false everywhere below: nothing
// here is pretending to be learner content.
function buildGrownUpGuide(guideDoc, extraNotes = []) {
  if (!guideDoc) return null;
  const parts = [];
  for (const section of sections(stripTitleLines(guideDoc))) {
    const title = section.title;
    const paragraphs = paragraphsOf(section.blocks).map(tidy).filter(Boolean);
    const items = allListItems(section.blocks);
    const tables = tablesOf(section.blocks).map((t) => ({ headers: t.rows[0].map(tidy), rows: t.rows.slice(1).map((r) => r.map(tidy)) }));
    if (!title && !paragraphs.length) continue;
    if (!paragraphs.length && !items.length && !tables.length) continue;
    parts.push({
      id: `guide-${parts.length + 1}`,
      title: title || "Before you begin",
      body: paragraphs.join("\n\n"),
      items,
      tables,
    });
  }
  if (!parts.length && !extraNotes.length) return null;
  return {
    audience: "adult",
    label: "For the grown-up",
    intro: "This part is written for the parent or teacher sitting with the learner, and is kept in their own words.",
    notes: uniq(extraNotes.map(tidy)),
    sections: parts,
  };
}

// ---------------------------------------------------------------------------
// Skills Toolkit (Years 4-8 only)
// ---------------------------------------------------------------------------
const GOAL_HEADINGS = [
  [/^starting\b/i, "starting"],
  [/^developing\b/i, "developing"],
  [/^getting better\b/i, "gettingBetter"],
];

function buildToolkit(toolkitDoc, isGuide) {
  const goals = { starting: [], developing: [], gettingBetter: [] };
  const cards = [];
  const vocabulary = [];
  const mistakes = [];
  const checklists = [];

  if (!toolkitDoc) return { goals, cards, vocabulary, mistakes, checklists };

  for (const section of sections(stripTitleLines(toolkitDoc))) {
    const title = section.title;
    if (!title) continue;
    const items = allListItems(section.blocks).map((t) => speak(t, isGuide)).filter(Boolean);
    const paragraphs = paragraphsOf(section.blocks).map((p) => speak(p, isGuide)).filter(Boolean);
    const tables = tablesOf(section.blocks);

    const goalKey = GOAL_HEADINGS.find(([rx]) => rx.test(title))?.[1];
    if (goalKey) {
      goals[goalKey].push(...items);
      continue;
    }
    // The same section is headed "Glossary of research words" in some years and
    // "Word list" in others; matching only "Glossary" left Years 4 and 5 with
    // no vocabulary at all.
    if (/^(?:glossary\b|word list\b|words to know\b|key words\b)/i.test(title)) {
      for (const table of tables) {
        for (const row of table.rows.slice(1)) {
          if (row.length >= 2 && row[0] && row[1]) vocabulary.push({ term: tidy(row[0]), meaning: tidy(row[1]) });
        }
      }
      continue;
    }
    if (/\b(mistakes?|errors?|watch out)\b/i.test(title)) {
      mistakes.push(...items);
      continue;
    }
    if (/^checklist\b/i.test(title)) {
      checklists.push({ id: `check-${checklists.length + 1}`, title, intro: paragraphs.join(" "), items });
      continue;
    }
    cards.push({
      id: `tool-${cards.length + 1}`,
      title,
      intro: paragraphs.join("\n\n"),
      items,
      tables: tables.map((t) => ({ headers: t.rows[0].map(tidy), rows: t.rows.slice(1).map((r) => r.map(tidy)) })),
    });
  }
  return { goals, cards, vocabulary, mistakes, checklists };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------
const ACTIVITY_HEADING = /^(?:activity\s+\d+|task\s+\d+|step\s+\d+|\d+[.)])\s*[:.]?\s*/i;
const CHALLENGE_HEADING = /challenge/i;

function buildActivities(activitiesDoc, isGuide) {
  const activities = [];
  const challenge = { intro: "", topics: [], checkpoints: [] };
  if (!activitiesDoc) return { activities, challenge };

  for (const section of sections(stripTitleLines(activitiesDoc))) {
    const title = section.title;
    if (!title) continue;
    const paragraphs = paragraphsOf(section.blocks).map((p) => speak(p, isGuide)).filter((p) => p && learnerSafe(p));
    const steps = allListItems(section.blocks).map((t) => speak(t, isGuide)).filter((t) => t && learnerSafe(t));
    const tables = tablesOf(section.blocks).map((t) => ({ headers: t.rows[0].map(tidy), rows: t.rows.slice(1).map((r) => r.map(tidy)) }));
    const boxes = calloutsOf(section.blocks)
      .map((b) => ({ role: CALLOUT_ROLE[b.marker] || "note", title: speak(b.title, isGuide) || tidy(b.title), lines: convertLines(b.lines || [], isGuide) }))
      .filter((b) => b.title || b.lines.length);

    if (CHALLENGE_HEADING.test(title)) {
      if (!challenge.intro) challenge.intro = paragraphs.join("\n\n");
      if (/checkpoint/i.test(title)) challenge.checkpoints.push(...steps);
      else challenge.topics.push(...steps);
      continue;
    }
    if (!paragraphs.length && !steps.length && !tables.length) continue;
    activities.push({
      id: `act-${activities.length + 1}`,
      title: tidy(title.replace(ACTIVITY_HEADING, "")) || title,
      label: title,
      intro: paragraphs.join("\n\n"),
      steps,
      tables,
      boxes,
    });
  }
  return { activities, challenge };
}

// ---------------------------------------------------------------------------
// Practice, answer key and reflection
// ---------------------------------------------------------------------------
// The Practice & Reflection book asks its questions in "Part N" sections and
// then answers them in an "Answer key" whose sub-headings repeat the part
// numbers. The two halves are paired by part number, so a question always
// carries its own model answer — a learner with no teacher cannot be left
// holding a question nobody will mark.
const PART_HEADING = /^part\s+(\d+)\s*[:.]?\s*(.*)$/i;
const ANSWER_KEY_HEADING = /^answer\s*key\b/i;
const REFLECTION_PART = /reflection/i;
// "Step 1: Choose your meal" and "Step 1 - Choose" both ship. Year 1 Unit 2
// offers two alternative projects instead of one sequence ("Choice A: Plant a
// seed"), so those are steps too — otherwise that unit builds no project at all.
const STEP_HEADING = /^(?:step\s+(\d+)|choice\s+([A-Z]))\s*[:.–—-]?\s*(.*)$/i;
// "How did I do?" (Year 1, working alone) and "How did we do?" (Year 2+,
// working as a team) are the same section, and Year 3 Unit 2 prefixes it
// "Reflection:". Anchoring on one wording lost the look-back in all three.
const LOOKBACK_HEADING = /^(reflection\b|how did (?:we|i) do|what i learned|looking back|how do you feel|let'?s talk about it|say thank you|well done|thinking about)/i;

// Years 1-3 ship a Mini-Project & Reflection instead of a quiz: a run of "Step
// N" sections building one shared piece of work, then a look back. There are no
// questions and no answer key, so this returns a project rather than inventing
// practice items a five-year-old was never asked.
function buildProject(practiceDoc, isGuide) {
  const steps = [];
  const reflection = [];
  const selfAssessment = [];
  let intro = "";

  for (const section of sections(stripTitleLines(practiceDoc))) {
    const title = section.title;
    const paragraphs = paragraphsOf(section.blocks).map((p) => speak(p, isGuide)).filter((p) => p && learnerSafe(p));
    const items = allListItems(section.blocks).map((t) => speak(t, isGuide)).filter((t) => t && learnerSafe(t));
    const tables = tablesOf(section.blocks).map((t) => ({ headers: t.rows[0].map(tidy), rows: t.rows.slice(1).map((r) => r.map(tidy)) }));

    if (!title) {
      if (!intro) intro = paragraphs.join("\n\n");
      continue;
    }
    const stepMatch = STEP_HEADING.exec(title);
    if (stepMatch) {
      const [, stepNo, choice, rest] = stepMatch;
      steps.push({
        id: `step-${steps.length + 1}`,
        number: stepNo ? Number(stepNo) : steps.length + 1,
        choice: choice ? choice.toUpperCase() : null,
        title: tidy(rest) || title,
        intro: paragraphs.join("\n\n"),
        items,
        tables,
      });
      continue;
    }
    if (LOOKBACK_HEADING.test(title)) {
      // Most look-backs list their prompts; a few write them as prose ("Talk
      // about what went well"). Taking only list items left those units with
      // no reflection at all, which is the one section this age group's pack
      // most reliably carries.
      const prompts = items.length ? items : paragraphs.filter((p) => p.length > 20 && p.length < 220);
      for (const item of prompts) reflection.push({ id: `reflect-${reflection.length + 1}`, prompt: item, modelAnswer: "" });
      // "Think about it | 🙂 Yes! | 😐 Not yet" is the self-assessment grid.
      for (const table of tablesOf(section.blocks)) {
        if (!/think about it|did (?:we|i)/i.test(table.rows[0]?.[0] || "")) continue;
        for (const row of table.rows.slice(1)) {
          if (row[0]) selfAssessment.push({ id: `self-${selfAssessment.length + 1}`, statement: tidy(row[0]) });
        }
      }
      continue;
    }
    // The opening section names the project itself.
    if (!steps.length && !intro) intro = paragraphs.join("\n\n");
    if (steps.length) {
      steps.push({ id: `step-${steps.length + 1}`, number: steps.length + 1, title, intro: paragraphs.join("\n\n"), items, tables });
    }
  }
  return { steps, intro, reflection, selfAssessment };
}

function buildPractice(practiceDoc, isGuide) {
  const practice = [];
  const reflection = [];
  const selfAssessment = [];
  if (!practiceDoc) return { practice, reflection, selfAssessment };

  const all = sections(stripTitleLines(practiceDoc));
  const keyIndex = all.findIndex((s) => ANSWER_KEY_HEADING.test(s.title));
  const questionSections = keyIndex >= 0 ? all.slice(0, keyIndex) : all;
  const answerSections = keyIndex >= 0 ? all.slice(keyIndex + 1) : [];

  // Answers by part number. A part's answers are its own list items, plus any
  // that sit under a sub-heading before the next "Part n" heading.
  const answersByPart = new Map();
  let currentPart = null;
  for (const section of answerSections) {
    const match = PART_HEADING.exec(section.title);
    if (match) currentPart = Number(match[1]);
    if (currentPart == null) continue;
    const bucket = answersByPart.get(currentPart) || { items: [], notes: [] };
    bucket.items.push(...allListItems(section.blocks).map((t) => speak(t, isGuide)).filter(Boolean));
    bucket.notes.push(...paragraphsOf(section.blocks).map((p) => speak(p, isGuide)).filter(Boolean));
    answersByPart.set(currentPart, bucket);
  }

  for (const section of questionSections) {
    const match = PART_HEADING.exec(section.title);
    if (!match) continue;
    const partNo = Number(match[1]);
    const partTitle = tidy(match[2]) || `Part ${partNo}`;
    const intro = paragraphsOf(section.blocks).map((p) => speak(p, isGuide)).filter(Boolean).join(" ");
    const prompts = allListItems(section.blocks).map((t) => speak(t, isGuide)).filter(Boolean);
    const answers = answersByPart.get(partNo)?.items || [];
    const notes = answersByPart.get(partNo)?.notes || [];

    if (REFLECTION_PART.test(partTitle)) {
      prompts.forEach((prompt, index) => {
        reflection.push({ id: `reflect-${reflection.length + 1}`, part: partNo, prompt, modelAnswer: answers[index] || "" });
      });
      const bulletPrompts = section.blocks.filter((b) => b.type === "list").flatMap((b) => b.items);
      if (!prompts.length && bulletPrompts.length) {
        bulletPrompts.forEach((prompt) => reflection.push({ id: `reflect-${reflection.length + 1}`, part: partNo, prompt: tidy(prompt), modelAnswer: "" }));
      }
      continue;
    }

    // "How will I know if I reached my goals?" prints a self-assessment table.
    const goalTable = tablesOf(section.blocks).find((t) => /learning goal/i.test(t.rows[0]?.[0] || ""));
    if (goalTable) {
      for (const row of goalTable.rows.slice(1)) {
        if (row[0]) selfAssessment.push({ id: `self-${selfAssessment.length + 1}`, statement: tidy(row[0]) });
      }
      continue;
    }

    // A matching exercise is shaped differently from every other part: the
    // numbered list holds the terms, the bulleted list holds the lettered
    // meanings, and the whole answer key is one line — "1-B, 2-A, 3-E, 4-C".
    // Zipping answers to prompts by position, as every other part allows, left
    // 332 matching prompts with no answer at all.
    if (/\bmatch/i.test(partTitle)) {
      const terms = listsOf(section.blocks).filter((l) => l.listType === "numbered").flatMap((l) => l.items.map(tidy));
      const options = listsOf(section.blocks).filter((l) => l.listType === "bullet").flatMap((l) => l.items.map(tidy));
      const byLetter = new Map();
      for (const option of options) {
        const match = /^([A-Z])[.)]\s*(.+)$/.exec(option);
        if (match) byLetter.set(match[1].toUpperCase(), tidy(match[2]));
      }
      const pairs = new Map();
      for (const line of [...notes, ...answers]) {
        for (const [, number, letter] of line.matchAll(/(\d+)\s*[-–—]\s*([A-Za-z])\b/g)) {
          pairs.set(Number(number), letter.toUpperCase());
        }
      }
      terms.forEach((term, index) => {
        const letter = pairs.get(index + 1);
        const meaning = letter ? byLetter.get(letter) : "";
        practice.push({
          id: `p${pad2(practice.length + 1)}`,
          part: partNo,
          partTitle,
          kind: "match",
          intro: index === 0 ? intro : "",
          prompt: term,
          options: index === 0 ? options : undefined,
          answer: meaning ? `${letter} — ${meaning}` : "",
          note: index === 0 ? notes.join(" ") : "",
        });
      });
      continue;
    }

    prompts.forEach((prompt, index) => {
      // "Area to improve: ______. How I will improve: ______." is a target the
      // learner sets for themselves. There is no answer to hold against it, and
      // inventing one would be worse than leaving it open.
      const openEnded = /_{3,}/.test(prompt) && !answers[index];
      practice.push({
        id: `p${pad2(practice.length + 1)}`,
        part: partNo,
        partTitle,
        kind: openEnded ? "open" : "question",
        intro: index === 0 ? intro : "",
        prompt,
        answer: answers[index] || "",
        note: index === 0 ? notes.join(" ") : "",
      });
    });
  }
  return { practice, reflection, selfAssessment };
}

// ---------------------------------------------------------------------------
// Cambridge objectives
// ---------------------------------------------------------------------------
function loadFramework(code) {
  const file = path.join(CURRICULUM_DIR, `cambridge-global-perspectives-${code}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// ---------------------------------------------------------------------------
// Stage 1-3 objectives
// ---------------------------------------------------------------------------
// The Years 4-8 units are named for their skill, so their objectives follow
// from the title. The Years 1-3 units are named for a topic ("What can families
// teach us?") and carry no codes, which is why they shipped unmapped at first.
//
// But the packs are not silent: every Stage 1-3 Teacher & Parent Guide opens
// with a list of the skills that unit grows, and most name the Cambridge strand
// outright — "Finding out (research)", "Sorting and counting (analysis)",
// "Working together (collaboration)". That list is the evidence, and this maps
// it to sub-strands.
//
// Each match records the phrase that produced it on the objective, so a
// curriculum reviewer can check the claim against the source rather than take
// it on trust. Like the framework's own codes, this is an Ehel-assigned mapping
// and wants sign-off before it is treated as authoritative.
const GUIDED_SKILL_HEADING = /skill|grow|will learn|will build|will practise/i;

// Tested against the WHOLE bullet (phrase plus its explanation), because the
// explanation carries most of the signal: "Finding out - asking, looking,
// reading, and looking online" earns Information skills where a bare "Finding
// out" would not. Communication sits above Solving problems so that "Sharing
// kind ideas" reads as communicating rather than as proposing an action.
const GUIDED_SKILL_MAP = [
  [/talking and listening|listening and sharing|listening to others|speaking and listening|communication|showing and telling|sharing a clear message|sharing kind ideas/i,
    ["Mi", "Ml"], "tells others about the topic and listens to them"],
  // Presenting the finished piece is the Communicating information objective,
  // and several units only ever say it as a project step ("Show your model to
  // everyone", "Share what you found") rather than in the guide's summary.
  [/\bshow (?:it|your \w+) to everyone\b|\bshare what you found\b|\bshow and tell\b|\bpresent your\b|\btell others about\b/i,
    ["Mi"], "presents the finished work to other people"],
  // "Sharing and caring - taking turns, helping at home, and being kind" is
  // family kindness, not collaboration, and on its own it gave Year 1 Unit 1 a
  // Cooperation claim for a unit whose project is an individual poster. The
  // collaboration evidence now has to come from the task language below.
  [/\bcollaboration\b|working together as a team/i,
    ["Cc", "Ct"], "works with others towards a shared outcome"],
  [/thinking about our learning|reflection|reflecting|thinking back/i,
    ["Fv", "Fl"], "looks back at what was learned and what helped"],
  [/finding out|research|asking (?:good )?questions/i,
    ["Rq", "Rc"], "asks questions and gathers the answers"],
  [/\breading\b|\blooking online\b|\bbooks?\b|\bnewspapers?\b|\bsources?\b/i,
    ["Ri"], "finds information in sources provided"],
  [/\brecord\b|\bpictogram\b|\btally\b|\bchart\b|\btable\b/i,
    ["Rf"], "records what was found"],
  // Identifying perspectives is specifically about recognising that OTHER
  // PEOPLE know or believe different things. An earlier rule also fired on bare
  // "noticing" / "looking closely", which claimed it for any unit that asked a
  // child to observe something — "Comparing a need with a want" is not a
  // perspective, and five units claimed this objective on that basis.
  [/another person'?s side|\bempathy\b|imagining how others feel|different people|what others think/i,
    ["Ap"], "notices that other people see things differently"],
  [/\bcomparing\b|\bsorting\b|\bcounting\b|using numbers|reading a map|\banalysis\b|\binfographic\b/i,
    ["Ad"], "reads simple data and says what it shows"],
  // \bcauses?\b, not causes? — the unanchored form matched inside "because",
  // which gave "using the words 'I think ... because ...'" a Making connections
  // objective it has no claim to.
  [/understanding the (?:problem|issue)|caring about our world|\bcauses?\b|\bconsequences?\b/i,
    ["Ac"], "links what people do to what follows from it"],
  [/sharing an idea|one way we can|promise to try|\bsolution\b|course of action/i,
    ["As"], "suggests an action that would make a difference"],
  // \bfair\b covers "fair rules", "judging what is fair" and "being fair"
  // alike; the earlier list of set phrases missed Rule Makers, whose whole
  // second skill is deciding whether a rule is fair.
  [/saying what i think|\bopinion\b|giving reasons|choosing and saying why|\bfair\b|\bfairness\b/i,
    ["Ea"], "states an opinion and gives a reason for it"],
  // The four rules below read the unit's TASKS, not the guide's summary. The
  // guide says what the unit is for; the mini-project and the look-back grid
  // say what the learner actually does, and they routinely evidence objectives
  // the summary never mentions. Reading the summary alone left Personal
  // contribution and Teamwork unclaimed by all 13 units, while nine of them run
  // a team project and five ask outright what idea somebody else contributed.
  [/shared an idea|everyone in our team|i had a job|our team had a job|how i helped|how we helped/i,
    ["Fc"], "identifies the idea or action it contributed to a shared outcome"],
  // "someone else" alone matched "really listening to someone else", which is
  // listening, not identifying what they contributed. It needs the
  // contribution to be the thing named.
  // The objective is identifying what working together CONTRIBUTED, so a bare
  // "working together" is not enough — "Did you make your project with other
  // people?" asks whether, not how it helped, and gave A Fair Life! a Teamwork
  // claim for an individual letter.
  [/good idea (?:my friend|others)|good ideas others|someone else (?:contributed|had|shared|did)|helped each other|working together (?:improved|helped|made)|how (?:we|our team) helped/i,
    ["Ft"], "identifies what someone else contributed to the shared outcome"],
  [/which source|how can i find out|who will you ask|where can i look|choose (?:your |a )?sources?/i,
    ["Es"], "chooses a source and says why it suits the question"],
  [/look back|the best thing was|what did you enjoy|liked best|most proud|feel proud|i now know/i,
    ["Fv", "Fl"], "looks back at what was learned and what was enjoyed"],
  // \bour\b throughout: without it, "our poster" matched inside "y-our poster"
  // and "our team" inside "y-our team", which handed Cooperation and Teamwork
  // objectives to two units whose project is an individual piece of work. Same
  // class of bug as `causes?` matching inside "because".
  [/\bour team\b|\bteam jobs\b|\btook turns\b|\bshared the jobs\b|\bour (?:display|poster|leaflet|model|welcome|stall)\b/i,
    ["Cc", "Ct"], "works with a team towards one shared piece of work"],
];

/** The skill bullets a Stage 1-3 guide opens with, or [] if it prints none. */
function guidedSkillBullets(unit) {
  const guide = unit.documents.find((doc) => doc.voice === "adult");
  if (!guide) return [];
  const blocks = guide.blocks;
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type !== "heading" || !GUIDED_SKILL_HEADING.test(block.text)) continue;
    const list = blocks.slice(index + 1, index + 4).find((b) => b.type === "list");
    if (list) return list.items.map(tidy).filter(Boolean);
  }
  return [];
}

/** Everything a Stage 1-3 unit says about itself that can evidence an objective.
 *
 * The guide's skill list states the unit's purpose; the Activity Sheet headings
 * and the Mini-Project's steps and look-back grid state what the learner is
 * actually asked to do. Both are evidence, and the second is the more literal
 * of the two — "Which source helps us?" and "A good idea my friend had was ..."
 * are objectives in plain sight that no summary mentions.
 */
function guidedEvidence(unit) {
  const out = [];
  for (const bullet of guidedSkillBullets(unit)) out.push({ text: bullet, from: "the guide's own skill list" });
  for (const doc of unit.documents) {
    if (doc.voice === "adult") continue;
    // stripTitleLines first: every Mini-Project document is titled "… -
    // Mini-Project & Reflection", and that word alone was granting the
    // Reflection objectives. Year 1 Unit 4 claimed them on the strength of its
    // own filename, with "Year 1" recorded as the evidence.
    // Prose is only read inside the look-back section. Reading every Practice
    // paragraph pulled in the project's own instructions and produced three
    // false claims off single words: "draw it on your poster" became
    // Interpreting data, and "it feels fair" became Express an opinion about
    // another person's viewpoint. Headings and lists are specific enough to
    // read anywhere; free prose is not.
    let inLookBack = false;
    for (const block of stripTitleLines(doc).blocks) {
      if (block.type === "heading") {
        inLookBack = LOOKBACK_HEADING.test(tidy(block.text));
        out.push({ text: tidy(block.text), from: `the ${doc.role} headings` });
      } else if (block.type === "table") {
        for (const row of block.rows) if (row[0]) out.push({ text: tidy(row[0]), from: `the ${doc.role} look-back` });
      } else if (block.type === "paragraph" && doc.role === "Practice" && inLookBack) {
        out.push({ text: tidy(block.text), from: "the Mini-Project look-back" });
      } else if (block.type === "list" && doc.role === "Practice") {
        // The Mini-Project's look-back asks its questions as list items, not
        // headings — "What did you enjoy most about making your letter?" is the
        // Personal learning objective stated outright, and reading only the
        // headings missed it.
        for (const item of block.items) out.push({ text: tidy(item), from: "the Mini-Project look-back" });
      }
    }
  }
  return out.filter((item) => item.text);
}

function objectivesFromGuide(unit, stage, framework) {
  const evidence = guidedEvidence(unit);
  if (!evidence.length) return [];
  const stageObjectives = framework.objectivesByStage[String(stage)] || [];
  const byCode = new Map(stageObjectives.map((o) => [o.code, o]));
  const found = new Map(); // code → {objective, evidence[], from, why}
  for (const item of evidence) {
    for (const [pattern, subs, why] of GUIDED_SKILL_MAP) {
      if (!pattern.test(item.text)) continue;
      for (const sub of subs) {
        const objective = byCode.get(`${stage}${sub}.01`);
        if (!objective) continue;
        const entry = found.get(objective.code) || { objective, evidence: [], from: item.from, why };
        // Split on the dash only. Splitting on ". " as well was meant to trim a
        // guide bullet's explanation, but the Activity Sheet numbers its
        // headings — "6. Which source helps us?" was recorded as the evidence
        // "6", which is useless to the reviewer this field exists for.
        const phrase = tidy(item.text.split(/\s[-–—]\s/)[0]).slice(0, 70);
        if (!entry.evidence.includes(phrase)) entry.evidence.push(phrase);
        found.set(objective.code, entry);
      }
    }
  }
  const order = ["Rq", "Ri", "Rc", "Rf", "Ap", "Ad", "Ac", "As", "Es", "Ea", "Fc", "Ft", "Fv", "Fl", "Cc", "Ct", "Mi", "Ml"];
  return [...found.values()]
    .sort((a, b) => order.indexOf(a.objective.subStrandCode) - order.indexOf(b.objective.subStrandCode))
    .map(({ objective, evidence, from, why }) => ({
      code: objective.code,
      strand: objective.strand,
      subStrand: objective.subStrand,
      text: objective.text,
      learnerText: "",
      evidence: `${from}: "${evidence.slice(0, 3).join('"; "')}" — ${why}`,
    }));
}

function objectivesForUnit(unit, stage, framework) {
  const stageObjectives = framework.objectivesByStage[String(stage)] || [];
  const byCode = new Map(stageObjectives.map((o) => [o.code, o]));

  // Preferred: the codes the pack itself printed.
  if (unit.objectives?.length) {
    return unit.objectives
      .map((quoted) => {
        const objective = byCode.get(quoted.code);
        if (!objective) return null;
        return {
          code: objective.code,
          strand: objective.strand,
          subStrand: objective.subStrand,
          text: objective.text,
          learnerText: quoted.learnerText || "",
          evidence: "quoted by the source pack",
        };
      })
      .filter(Boolean);
  }

  // Otherwise: a Years 4-8 unit is one skill end to end, so it covers that
  // strand's sub-strands at its stage.
  const subs = STRAND_SUB_STRANDS[unit.skill];
  // A Years 1-3 topic unit is not named for a skill, so its objectives come
  // from the skills its own guide says it grows.
  if (!subs) return objectivesFromGuide(unit, stage, framework);
  return subs
    .map((sub) => byCode.get(`${stage}${sub}.01`))
    .filter(Boolean)
    .map((objective) => ({
      code: objective.code,
      strand: objective.strand,
      subStrand: objective.subStrand,
      text: objective.text,
      learnerText: "",
      evidence: "resolved from the unit's skill",
    }));
}

// The packs that DO print their Cambridge mapping are the proof that the
// skill→strand rule above is right. If a printed code ever disagrees with what
// the rule would have produced, the rule is wrong for that pack and the build
// must stop rather than ship a unit mapped to the wrong objectives.
function verifyObjectiveMapping(model) {
  const problems = [];
  for (const grade of model.grades) {
    for (const unit of grade.units) {
      if (!unit.objectives?.length || !unit.skill) continue;
      const expected = (STRAND_SUB_STRANDS[unit.skill] || []).map((sub) => `${grade.stage}${sub}.01`);
      const printed = unit.objectives.map((o) => o.code);
      const missing = expected.filter((c) => !printed.includes(c));
      const extra = printed.filter((c) => !expected.includes(c));
      if (missing.length || extra.length) {
        problems.push(
          `Year ${grade.year} Unit ${unit.unitNo} (${unit.skill}): pack prints ${printed.join(", ")}, `
          + `skill rule gives ${expected.join(", ")}`
        );
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------
// Global Perspectives asks open questions, not multiple choice — "In your own
// words, what does research mean?" has no options to tick. So the unit quiz is
// short-answer with the pack's own model answer attached, and only questions
// that HAVE a model answer are used: a self-teaching course must never ask
// something it cannot then mark.
function buildAssessment(practice, isGuide) {
  const questions = practice
    .filter((item) => item.answer && item.prompt.length > 12)
    .slice(0, 12)
    .map((item, index) => ({
      id: `q${pad2(index + 1)}`,
      prompt: item.prompt,
      modelAnswer: item.answer,
      responseMode: "text",
      part: item.part,
    }));
  const assessment = { passPercent: 80, responseMode: "text", questions };
  if (!questions.length && isGuide) {
    // Not a gap to be filled by invention: at Stages 1-3 the pack assesses
    // through the mini-project and the look-back grid, and there is no quiz to
    // import. Recorded so the checker can tell this apart from a build that
    // dropped the questions.
    assessment.note = "Stages 1-3 are assessed through the mini-project and the look-back grid; the source pack ships no quiz.";
    assessment.assessedBy = "project";
  }
  return assessment;
}

// ---------------------------------------------------------------------------
// Outcomes
// ---------------------------------------------------------------------------
function buildOutcomes(goals, objectives, explainers) {
  const fromGoals = [...goals.starting, ...goals.developing, ...goals.gettingBetter];
  if (fromGoals.length) {
    return fromGoals.slice(0, 18).map((text, index) => ({
      id: `lo${pad2(index + 1)}`,
      text: capitalise(text.replace(/^i (?:am|can)\s+/i, "")),
    }));
  }
  // Objectives are usable as outcomes ONLY where the pack printed a learner
  // wording for them ("Ask clear, focused questions that are worth
  // researching"). Cambridge's own text is curriculum prose written for adults
  // — "Begin to participate in simple investigations and ask basic questions to
  // find information and opinions" — and falling back to it put that in front
  // of a five-year-old as their goals and their self-assessment, once the
  // Stage 1-3 units gained objectives at all.
  const learnerFacing = objectives.filter((objective) => objective.learnerText);
  if (learnerFacing.length) {
    return learnerFacing.map((objective, index) => ({ id: `lo${pad2(index + 1)}`, text: objective.learnerText }));
  }
  return explainers.filter((e) => !e.isFrontMatter).slice(0, 8).map((e, index) => ({ id: `lo${pad2(index + 1)}`, text: e.title }));
}

// ---------------------------------------------------------------------------
// Build one unit
// ---------------------------------------------------------------------------
function buildUnit(unit, grade, framework) {
  const isGuide = unit.packShape === "guided";
  const byRole = (role) => unit.documents.find((d) => d.role === role);
  const lessonDoc = byRole("Lesson");
  const toolkitDoc = byRole("Toolkit");
  const activitiesDoc = byRole("Activities");
  const practiceDoc = byRole("Practice");

  // Which document teaches the learner depends on the pack shape:
  //   self-study  the Lesson book, learner-facing from the first line
  //   guided      the Activity Sheet ("Hello! My name is Sana…"), because the
  //               Lesson role there is the adult's guide — see buildGrownUpGuide
  const teachingDoc = isGuide ? activitiesDoc : lessonDoc;
  const built = teachingDoc ? buildExplainers(teachingDoc, false) : { explainers: [], grownUpNotes: [], lead: "" };
  const explainers = built.explainers;
  const grownUpGuide = isGuide ? buildGrownUpGuide(lessonDoc, built.grownUpNotes) : null;
  const toolkit = buildToolkit(toolkitDoc, isGuide);
  // A guided unit's Activity Sheet has already become its explainers; listing
  // it again as activities would show the learner the same pages twice.
  const { activities, challenge } = isGuide
    ? { activities: [], challenge: { intro: "", topics: [], checkpoints: [] } }
    : buildActivities(activitiesDoc, isGuide);
  // The two pack shapes assess differently: Years 4-8 through a Practice &
  // Reflection quiz with an answer key, Years 1-3 through a mini-project.
  // Voice is a property of the DOCUMENT, not of the pack. In a guided pack the
  // Activity Sheet and the Mini-Project are both written to the child and only
  // the Teacher & Parent Guide is written to the adult. Passing the unit-level
  // pack shape here ran the converter over prose that was already correct and
  // produced "show it to other you" out of "show it to other children".
  const practiceIsAdult = practiceDoc?.voice === "adult";
  const quiz = buildPractice(practiceDoc, practiceIsAdult);
  const project = isGuide && practiceDoc ? buildProject(practiceDoc, practiceIsAdult) : null;
  const practice = quiz.practice;
  const reflection = quiz.reflection.length ? quiz.reflection : (project?.reflection || []);
  const selfAssessment = quiz.selfAssessment.length ? quiz.selfAssessment : (project?.selfAssessment || []);

  // Callout boxes come only from the documents the learner reads. The Teacher &
  // Parent Guide has boxes of its own ("What good looks like at this age", "For
  // the grown-up"), and those are notes to the adult — collecting them put
  // "What good looks like at this age" on the learner's Big Ideas page in every
  // Stage 1-3 unit. They stay with the guide, under grownUpGuide.
  const learnerDocs = unit.documents.filter((doc) => doc.voice !== "adult");
  const callouts = learnerDocs
    .flatMap((doc) => collectCallouts(doc, false))
    // Anything still addressed to the adult is the guide's voice leaking
    // through a learner-facing document; it belongs to nobody on this page.
    .filter((box) => learnerSafe(box.title) && box.lines.every((line) => learnerSafe(line)));
  // Prefixed "box-" because the callout roles and the unit's other collections
  // share a namespace: `reflectionPrompts` and `reflection` both numbered
  // themselves "reflect-1", so two different items carried the same id. Nothing
  // in the runtime keyed off it, but the review workbook does — an ambiguous id
  // means a reviewer's edit can be attributed to the wrong item.
  const pick = (role) => callouts.filter((c) => c.role === role).map((c, index) => ({
    id: `box-${role}-${index + 1}`, title: c.title, lines: c.lines, source: c.source,
  }));

  const objectives = objectivesForUnit(unit, grade.stage, framework);
  const outcomes = buildOutcomes(toolkit.goals, objectives, explainers);

  // The unit overview is the first real teaching paragraph, not the welcome
  // furniture, so a learner opening the unit reads what it is about.
  // What the unit is about, in preference order:
  //   1. the teaching document's own welcome (the guided packs open with one);
  //   2. the Toolkit's "The Research skill, in plain words" card, which is the
  //      cleanest one-paragraph statement of the skill the unit teaches;
  //   3. the first teaching paragraph, so a unit never opens on a blank page.
  // Without (2), every self-study unit opened on its narrative hook ("Her name
  // is Yasmin…") rather than on what the unit is for.
  const plainWords = toolkit.cards.find((card) => /\bin plain words\b|^what (?:is|does|are)\b|^the .* skill\b/i.test(card.title));
  const overviewSource = explainers.find((e) => !e.isFrontMatter && e.body) || explainers.find((e) => e.body);
  // Year 3 Unit 5 prints its topic on the second title line without the
  // "- Global Perspectives" suffix, so it survives the title strip and would
  // open the overview by repeating the unit's own name back at the learner.
  const lead = built.lead
    .split("\n\n")
    .filter((paragraph) => tidy(paragraph).toLowerCase() !== tidy(unit.unitTitle).toLowerCase())
    .join("\n\n");
  const unitOverview = lead
    || (plainWords?.intro ? plainWords.intro.split("\n\n")[0] : "")
    || (overviewSource ? overviewSource.body.split("\n\n")[0] : "");

  const vocabulary = toolkit.vocabulary.length
    ? toolkit.vocabulary
    : []; // Years 1-3 packs carry no glossary; the checker reports the gap.

  return {
    schemaVersion: "Ehel Global Perspectives Runtime v1.0",
    generatedAt: new Date().toISOString(),
    stage: { id: `s${pad2(grade.stage)}`, label: `Stage ${grade.stage}` },
    subject: "Global Perspectives",
    unit: {
      unitId: `gp-g${pad2(grade.year)}-u${pad2(unit.unitNo)}`,
      unitNo: unit.unitNo,
      unitTitle: unit.unitTitle,
      skill: unit.skill || null,
      packShape: unit.packShape,
      unitOverview,
      learningPath: explainers.filter((e) => !e.isFrontMatter).map((e) => e.title).slice(0, 12),
      // A Stage 1-3 unit's objectives are INFERRED from the skills its guide
      // says it grows, not read off a code the pack prints. That is a weaker
      // claim than the Stages 4-8 mapping, which the packs' own tables prove,
      // so it says so rather than reading as equally settled.
      reviewStatus: !objectives.length
        ? "Imported - Cambridge objective mapping still to be assigned"
        : (unit.skill
          ? "Imported - curriculum review required"
          : "Imported - objectives inferred from the guide's skill list; curriculum sign-off required"),
    },
    cambridge: {
      level: grade.framework.level,
      code: grade.framework.code,
      stage: grade.stage,
      objectives,
    },
    provenance: {
      contentPackage: `Ehel-Academy-Global-Perspectives-Grade-${grade.year}-Content-Package`,
      framework: `${grade.framework.level} ${grade.framework.code} - Stage ${grade.stage}`,
      sourceArchive: grade.sourceArchive,
      sourceDocuments: unit.documents.map((d) => d.document),
      sourceBlockCount: unit.blockCount,
      packShape: unit.packShape,
      transformation: isGuide
        ? "Adult-led Teacher & Parent Guide rewritten into learner voice for self-teaching"
        : "Learner-facing student books carried across as written",
      reviewStatus: "Imported - curriculum review required",
    },
    outcomes,
    explainers,
    bigIdeas: pick("bigIdea"),
    models: pick("model"),
    tutorPrompts: pick("tutor"),
    speakingPrompts: pick("speak"),
    teacherSessions: pick("teacher"),
    reflectionPrompts: pick("reflect"),
    goals: toolkit.goals,
    toolkit: toolkit.cards,
    checklists: toolkit.checklists,
    challenge,
    activities,
    grownUpGuide,
    project: project && project.steps.length
      ? { title: "Mini-project", intro: project.intro, steps: project.steps }
      : null,
    practice,
    reflection,
    reference: {
      vocabulary,
      mistakes: toolkit.mistakes,
    },
    assessment: buildAssessment(practice, isGuide),
    selfAssessment: selfAssessment.length
      ? selfAssessment
      : outcomes.map((o, index) => ({ id: `self-${index + 1}`, statement: o.text })),
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

// ---------------------------------------------------------------------------
// Reviewed script overrides
// ---------------------------------------------------------------------------
// This directory is generated, so a reviewer's corrections cannot live in it —
// the next build would overwrite them. They live in data/script-review.json,
// written by apply-ehel-global-perspectives-script-review.py, and are laid over
// every rebuild here. Keys are JSON paths into the built unit
// ("explainers.4.body", "practice.11.answer"), so this needs no knowledge of
// the exporter's item-id scheme.
const REVIEW_PATH = path.join(COURSE_DIR, "data", "script-review.json");

function loadReview() {
  if (!fs.existsSync(REVIEW_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(REVIEW_PATH, "utf8")).overrides || {};
  } catch (error) {
    console.error(`error: ${REVIEW_PATH} is not readable JSON — ${error.message}`);
    process.exit(1);
  }
}

/** Set one dotted path on a built unit. Returns false if the path is not there. */
function setPath(target, dotted, value) {
  const parts = dotted.split(".");
  let node = target;
  for (const key of parts.slice(0, -1)) {
    if (node == null) return false;
    node = Array.isArray(node) ? node[Number(key)] : node[key];
  }
  const last = parts[parts.length - 1];
  if (node == null) return false;
  // A path that no longer resolves means the content moved under the review —
  // applying it blind would write a stray key nothing renders, so it is
  // refused and reported instead.
  if (Array.isArray(node)) {
    const index = Number(last);
    if (!Number.isInteger(index) || index >= node.length) return false;
    node[index] = value;
    return true;
  }
  if (!(last in node)) return false;
  node[last] = value;
  return true;
}

function applyReview(built, overrides, label, stale) {
  let applied = 0;
  for (const [dotted, value] of Object.entries(overrides || {})) {
    if (setPath(built, dotted, value)) applied += 1;
    else stale.push(`${label}: ${dotted}`);
  }
  return applied;
}

function gradeIndexHtml(year) {
  return `<!doctype html>
<html lang="en" data-stage="${year}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening Stage ${year} Global Perspectives</title></head>
<body><p>Opening the shared Global Perspectives course…</p><script type="module" src="../shared/grade-redirect.js"></script></body>
</html>
`;
}

function main() {
  const requested = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
  if (!fs.existsSync(MODEL_PATH)) {
    console.error(`error: no content model at ${MODEL_PATH}\n       run: npm run extract:global-perspectives-content`);
    process.exit(2);
  }
  const model = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));

  const mappingProblems = verifyObjectiveMapping(model);
  if (mappingProblems.length) {
    console.error("error: the unit-skill → Cambridge objective rule disagrees with a pack that prints its own mapping.");
    for (const problem of mappingProblems) console.error(`  ${problem}`);
    console.error("  Fix STRAND_SUB_STRANDS (or the framework extractor) before shipping these units.");
    process.exit(1);
  }

  const frameworks = new Map();
  const warnings = [];
  const staleOverrides = [];
  const review = loadReview();
  let unitsWritten = 0;
  let reviewApplied = 0;

  for (const grade of model.grades) {
    if (requested.length && !requested.includes(grade.year)) continue;
    const code = grade.framework.code;
    if (!frameworks.has(code)) frameworks.set(code, loadFramework(code));
    const framework = frameworks.get(code);

    const gradeDir = path.join(COURSE_DIR, `grade-${grade.year}`);
    const manifestUnits = [];

    for (const unit of grade.units) {
      const built = buildUnit(unit, grade, framework);
      // Reviewed corrections go on last, so they win over anything the builder
      // derived — that is the whole point of the review.
      reviewApplied += applyReview(
        built,
        (review[`grade-${grade.year}`] || {})[`unit-${unit.unitNo}`],
        `grade-${grade.year}/unit-${unit.unitNo}`,
        staleOverrides,
      );
      writeJson(path.join(gradeDir, "data", "units", `unit-${unit.unitNo}.json`), built);
      unitsWritten += 1;
      manifestUnits.push({
        number: unit.unitNo,
        id: built.unit.unitId,
        title: unit.unitTitle,
        skill: unit.skill || null,
        data: `./data/units/unit-${unit.unitNo}.json`,
        sourceDocumentCount: unit.documents.length,
        objectiveCount: built.cambridge.objectives.length,
        reviewStatus: built.unit.reviewStatus,
      });

      // A guided pack is not expected to carry a quiz or a glossary, so
      // warning about those every time would train the reader to ignore the
      // list. Only report what that shape SHOULD have carried and did not.
      const guided = built.unit.packShape === "guided";
      const thin = [];
      if (!built.explainers.length) thin.push("no explainers");
      if (!guided && !built.activities.length) thin.push("no activities");
      if (guided) {
        if (!built.grownUpGuide) thin.push("no grown-up guide");
        if (!built.project) thin.push("no mini-project");
        // A look-back is written either as prompts to answer or as a
        // tick-the-statement grid, and some units carry only the grid. Either
        // one gives the learner the reflection step, so the unit is only thin
        // when it has neither.
        if (!built.reflection.length && !built.selfAssessment.length) thin.push("no reflection");
      } else {
        if (!built.practice.length) thin.push("no practice");
        if (!built.assessment.questions.length) thin.push("no quiz questions");
        if (!built.reference.vocabulary.length) thin.push("no glossary");
        // Years 4 and 6 publish Starting/Developing/Getting better goals;
        // Years 5, 7 and 8 publish the Cambridge objectives instead. Both give
        // the learner something to aim at, so the check is on the outcomes the
        // unit ends up with, not on which of the two shapes produced them.
        if (!built.outcomes.length) thin.push("no learning outcomes");
      }
      if (thin.length) warnings.push(`Year ${grade.year} Unit ${unit.unitNo}: ${thin.join(", ")}`);
    }

    writeJson(path.join(gradeDir, "data", "course-manifest.json"), {
      schemaVersion: "Ehel Global Perspectives Course Manifest v1.0",
      stage: { id: `s${pad2(grade.stage)}`, label: `Stage ${grade.stage}` },
      subject: "Global Perspectives",
      defaultUnit: grade.units[0]?.unitNo ?? 1,
      sourcePackage: `Ehel-Academy-Global-Perspectives-Grade-${grade.year}-Content-Package`,
      sourceArchive: grade.sourceArchive,
      cambridgeFramework: `${grade.framework.level} ${grade.framework.code} - Stage ${grade.stage}`,
      packShape: grade.units[0]?.packShape || "self-study",
      packageReviewStatus: "Built from source packs - curriculum review pending",
      unitCount: manifestUnits.length,
      units: manifestUnits,
    });
    fs.writeFileSync(path.join(gradeDir, "index.html"), gradeIndexHtml(grade.year), "utf8");

    console.log(`grade ${grade.year}: ${manifestUnits.length} units, manifest, index written.`);
  }

  console.log(`\n${unitsWritten} unit file(s) written.`);
  if (Object.keys(review).length) {
    console.log(`Script review: ${reviewApplied} field(s) applied.`);
  }
  if (staleOverrides.length) {
    // A stale override is review that is no longer reaching the content — the
    // reviewer's correction is silently absent from what ships. Loud on
    // purpose.
    console.log(`\n${staleOverrides.length} override(s) no longer match the content and were NOT applied:`);
    for (const stale of staleOverrides.slice(0, 20)) console.log(`  ${stale}`);
    if (staleOverrides.length > 20) console.log(`  … and ${staleOverrides.length - 20} more`);
    console.log("  Re-export the workbook and re-apply the review.");
  }
  if (warnings.length) {
    console.log("\nThin sections (a pack that did not carry that part):");
    for (const warning of warnings) console.log(`  ${warning}`);
  } else {
    console.log("\nNo empty-section warnings.");
  }
}

main();
