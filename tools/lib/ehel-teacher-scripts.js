// The one definition of which Grade/Stage 1 activities get a stored
// "Teach me the activity" script — shared by the generator
// (generate-ehel-teacher-scripts.mjs), the narrator
// (generate-ehel-teacher-audio.js) and the check (check-ehel-teacher-scripts.mjs),
// so "what should exist" cannot drift between the tool that makes it and the
// tool that proves it.
//
// Per subject: the nav's own section ids and labels (shell/subjects/*.js)
// minus reference/adult/stage-level pages — Unit Study Plan, Teacher & Parent
// Guide / For the Grown-Up, Progress, Capstone, Placement. Per-unit
// availability follows each subject's own rule: English's Games only where a
// game pack exists and the final course quiz on Unit 10; Global Perspectives'
// data predicates. English Unit 0 is withdrawn and gets nothing.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

// Must match TEACH_ME_MESSAGE in shell/wehel.js — the live path for Grades 2+
// answers the same ask a stored script answered (the contract gate holds it).
const TEACH_ME_MESSAGE = "Be my teacher for this activity: explain what it is and why we are doing it, tell me what you expect from me, then take me through it step by step — one step at a time.";

const SUBJECTS = {
  english: {
    label: "English",
    skipUnits: [0],
    sections: (unit, unitNo, ctx) => [
      ["overview", "Overview"], ["lecture", "Video lesson"], ["dictionary", "Vocabulary"], ["reading", "Reading & story"],
      ["comprehension", "Comprehension"], ["grammar", "Grammar"], ["speaking", "Speaking"], ["writing", "Writing"],
      ["activities", "Activities"], ...(ctx.hasGamePack(unitNo) ? [["games", "Games"]] : []), ["quiz", "Quiz"], ["ebooks", "Books"],
      ...(unitNo === 10 ? [["final-quiz", "Final course quiz"]] : []),
    ],
  },
  science: {
    label: "Science",
    sections: () => [
      ["overview", "Unit Overview"], ["lesson", "The Lesson"], ["words", "Science Words"], ["explore", "Explore the Concept"],
      ["visuals", "Visual Models"], ["method", "Learn the Method"], ["examples", "Worked Examples"], ["guided", "Guided Practice"],
      ["reference", "Quick Reference"], ["activities", "Experiments"], ["games", "Games"], ["fluency", "Science Fluency"],
      ["problems", "Solve Real Problems"], ["explain", "Explain Your Thinking"],
    ],
  },
  mathematics: {
    label: "Mathematics",
    sections: () => [
      ["overview", "Unit Overview"], ["lesson", "The Lesson"], ["words", "Math Words & Symbols"], ["explore", "Explore the Concept"],
      ["visuals", "Visual Models"], ["method", "Learn the Method"], ["examples", "Worked Examples"], ["guided", "Guided Practice"],
      ["activities", "Activities"], ["games", "Games"], ["fluency", "Math Fluency"], ["problems", "Solve Real Problems"],
      ["explain", "Explain Your Thinking"], ["challenge", "Unit Challenge"],
    ],
  },
  computing: {
    label: "Computing",
    sections: () => [
      ["overview", "Unit Overview"], ["tools", "Tools & Setup"], ["lesson", "The Lesson"], ["words", "Computing Words"],
      ["explore", "Explore the Concept"], ["visuals", "Visual Models"], ["code", "Code Examples"], ["method", "Learn the Method"],
      ["examples", "Worked Examples"], ["guided", "Guided Practice"], ["reference", "Quick Reference"], ["activities", "Build It"],
      ["debug", "Debug It"], ["games", "Games"], ["fluency", "Computing Fluency"], ["problems", "Solve Real Problems"],
      ["safety", "Stay Safe Online"], ["explain", "Explain Your Thinking"], ["project", "Unit Project"], ["challenge", "Unit Challenge"],
    ],
  },
  "global-perspectives": {
    label: "Global Perspectives",
    // Data-driven, mirroring SECTIONS in shell/subjects/global-perspectives.js.
    sections: (c) => [
      ["overview", "Unit Overview", true],
      ["lesson", "The Lesson", c.explainers?.length], ["bigideas", "Big Ideas", c.bigIdeas?.length],
      ["models", "Worked Examples", c.models?.length], ["goals", "My Learning Goals", c.outcomes?.length],
      ["toolkit", "Skills Toolkit", c.toolkit?.length || c.checklists?.length], ["words", "Skill Words", c.reference?.vocabulary?.length],
      ["challenge", "My Challenge", c.challenge?.intro || c.challenge?.topics?.length], ["activities", "Activities", c.activities?.length],
      ["project", "Mini-Project", c.project?.steps?.length], ["practice", "Practice", c.practice?.length],
      ["quiz", "Unit Quiz", c.assessment?.questions?.length], ["reflect", "Reflection", c.reflection?.length || c.selfAssessment?.length],
      ["teacher", "Teacher Session", c.teacherSessions?.length || c.speakingPrompts?.length],
    ].filter(([, , has]) => Boolean(has)).map(([id, label]) => [id, label]),
  },
};

// What the voice reads, and therefore what is hashed into the clip's name:
// emoji and markdown symbols stripped, whitespace collapsed — the same
// normalisation the panel applies before speaking (speakableText in
// shell/wehel.js). Generator, narrator and check all hash THIS, so a stored
// hash is the clip the app asks for, with no rewriting between tools.
const { cyrb53, clean } = require("./ehel-narration-hash");
const speakable = (text) => clean(String(text || "")
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/gu, " ")
  .replace(/[*_`#]+/g, " "));
const scriptHash = (text) => cyrb53(speakable(text));

// ACTIVITY OUTLINES — what a page actually asks the learner to do, in order,
// written from the page's own controls (shell/subjects/*.js), so the stored
// teacher walkthrough names the buttons that are really there and covers
// every activity: listening, reading, saying, spelling, writing, marking done.
// Owner decision 2026-08-20: "Teach me the activity" must be COMPLETE — not a
// framing plus step 1 — starting with Grade 1 Unit 1 Vocabulary as the model.
// A section with an outline gets the full walkthrough in ONE message; a
// section without one keeps the shorter opening until its outline is written.
// `{count}` is replaced with the number of items on the page when known.
const ACTIVITY_OUTLINES = {
  english: {
    dictionary: {
      items: (unit) => (unit.dictionaryLinks || []).length,
      itemNoun: "words",
      activities: [
        "The word list is on the left: press a word to open its card. You will work through every one of the {count} words, one at a time.",
        "Hear it and Again: press Hear it to listen to the word, say it out loud yourself, then press Again and say it once more — out loud, not in your head.",
        "Meaning: read the meaning on the card, press its speaker to hear it read, then say in your own words what the word means.",
        "In a sentence: read each practice sentence, press Hear sentence to listen to it, and use the arrows to go through every sentence; read one of them out loud yourself.",
        "Spelling: look at the letters shown on the card, say them one by one, and say the whole word again.",
        "Write your own sentence: type a sentence with the word in the box (the grey words give you a start), press Check sentence, read what the checker says and fix anything it points out.",
        "I know this word: when you can say it, know its meaning and have written a sentence, press I know this word — it gets a LEARNED tag in the list.",
        "Next word: press the next word in the list and do the same steps. The page is finished when every word has a LEARNED tag.",
      ],
    },
  },
};

// The chip message for one activity. A section with an outline asks for the
// complete walkthrough in one message — this is the written guide for the
// whole page, not a live turn — naming every activity in order, with what to
// press, how to do it well and what is expected, then how the learner knows
// the page is finished. Without an outline it is TEACH_ME_MESSAGE alone.
function teachMessageFor(subject, sectionId, label, unit) {
  const outline = ACTIVITY_OUTLINES[subject]?.[sectionId];
  if (!outline) return TEACH_ME_MESSAGE;
  const count = typeof outline.items === "function" ? outline.items(unit) : 0;
  const lines = outline.activities.map((line, index) => `${index + 1}. ${line.replace(/\{count\}/g, String(count || "the"))}`);
  return `${TEACH_ME_MESSAGE}\n\nThis is the written guide for the WHOLE "${label}" page, so unlike a live turn, give ALL the steps in this one message — numbered, one short paragraph each, in plain text with a line break between steps. The activities on this page, in order, are:\n${lines.join("\n")}\nCover every one of them: for each, say exactly what to press or do (use the button names as written), how to do it well, and what you expect from me. Then say how I will know the page is finished. Keep every sentence short and in words a Grade 1 child understands, and speak as my teacher, warmly.`;
}

const dataDirFor = (subject) => path.join(EHEL, subject, "grade-1", "data");
const scriptsFileFor = (subject) => path.join(dataDirFor(subject), "teacher-scripts.json");
const audioDirFor = (subject) => path.join(dataDirFor(subject), "teacher-audio");

// Every (unit, section) that should carry a script for one subject:
// [{ unitNo, unitTitle, sectionId, label, unit }]. Reads the manifest and units.
function expectedScripts(subject) {
  const def = SUBJECTS[subject];
  if (!def) throw new Error(`Unknown subject ${subject}`);
  const dataDir = dataDirFor(subject);
  const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "course-manifest.json"), "utf8"));
  const ctx = { hasGamePack: (n) => fs.existsSync(path.join(dataDir, "games", `unit-${n}.json`)) };
  const out = [];
  for (const entry of manifest.units) {
    const unitNo = Number(entry.number);
    if ((def.skipUnits || []).includes(unitNo)) continue;
    const unitFile = path.join(dataDir, "units", `unit-${unitNo}.json`);
    if (!fs.existsSync(unitFile)) continue;
    const unit = JSON.parse(fs.readFileSync(unitFile, "utf8"));
    for (const [sectionId, label] of def.sections(unit, unitNo, ctx)) {
      out.push({ unitNo, unitTitle: entry.title, sectionId, label, unit });
    }
  }
  return { manifest, expected: out };
}

module.exports = { SUBJECTS, TEACH_ME_MESSAGE, ACTIVITY_OUTLINES, teachMessageFor, dataDirFor, scriptsFileFor, audioDirFor, expectedScripts, speakable, scriptHash };
