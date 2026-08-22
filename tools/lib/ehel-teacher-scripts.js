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

module.exports = { SUBJECTS, TEACH_ME_MESSAGE, dataDirFor, scriptsFileFor, audioDirFor, expectedScripts, speakable, scriptHash };
