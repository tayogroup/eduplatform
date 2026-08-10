// Acceptance gate for the Ehel Academy Global Perspectives runtime packages.
//
// This course is used without a teacher, so the checks below are the ones that
// decide whether a learner alone can actually follow a unit:
//   - explainers are complete (never clipped mid-sentence) and long enough to teach
//   - nothing in the learner's own sections is addressed to a supervising adult
//   - nothing asks for a classroom, a partner or a teacher with no solo path
//   - every practice question carries the answer that marks it
//   - a unit's Cambridge objectives really exist in that unit's stage
//   - no unit is a copy of another unit
//
// THE ONE DELIBERATE EXEMPTION
// ============================
// Stages 1-3 ship a Teacher & Parent Guide, and that guide is kept whole, in
// its own voice, under `grownUpGuide` — the five-to-eight model has an adult
// beside the learner by design. So adult-addressed prose is a FAILURE anywhere
// a learner reads, and expected inside `grownUpGuide`. The check that matters
// is that the two never mix: see LEARNER_FIELDS.
//
// Usage:
//   node tools/check-global-perspectives-content.mjs
// Exit 0 = pass, 1 = at least one failure.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "src", "prototypes", "ehel-academy", "global-perspectives");
const curriculumDir = path.join(here, "..", "src", "curriculum");

const MIN_OVERVIEW = 80;      // shorter than this says nothing about the unit
const MIN_EXPLAINER_BODY = 60; // a heading with a fragment under it teaches nothing
const MIN_TEACHING_CHARS = 1500; // a whole unit thinner than this cannot stand alone

// Prose addressed to whoever is sitting with the learner, not to the learner.
//
// "children" and "grown-up" are NOT on their own evidence of that here. Global
// Perspectives researches children's lives — "how the children at Ehel Academy
// travel to school" is the topic — and the Stage 1-3 model deliberately has a
// grown-up in the room, so "Tell your grown-up why" is an instruction to the
// learner. Matching the bare nouns reported dozens of correct sentences as
// defects. What is actually diagnostic is the learner appearing as somebody
// else's charge: "your child", "let the child draw", "help your child choose".
const ADULT_ADDRESSED = /\byour child\b|\bthe child (?:draws|writes|circles|points|taps|says|is|will|looks|gets|needs|can|has)\b|\blet (?:the|your) child\b|\bhelp your child\b|\bthe children (?:this age|are experts|will need)\b|\byou,? the grown-?up\b|\bfor the grown-?up\b|\ba grown-?up reads\b|\bthis guide is written for you\b|\bteacher (?:guide|tip|answer key)\b|\bprint one per child\b|\b(?:please\s+)?read (?:every|each) (?:part|line|step|instruction) aloud\b|\byou will not test\b|\bgive any marks\b|\bas you teach\b|\bat this age\b|\bwhat good looks like\b/i;
// Classroom staging a learner working at home cannot act on.
const CLASSROOM_ONLY = /\bon the board\b|\bthe big sheet\b|\bphotocopy\b|\bhand out\b|\bcircle time\b|\bgo round the (?:class|room)\b|\bpicture cards\b|\bon the carpet\b/i;
// Global Perspectives' own source books warn about this: the published subject
// says "talk to a partner" and "discuss as a class", and the Ehel model
// replaces that with the AI tutor. A leftover is a dead end for a solo learner.
const NEEDS_A_ROOM = /\btalk to (?:a|your) partner\b|\bdiscuss (?:as|with) (?:a|the) class\b|\bin (?:pairs|groups) now\b|\bturn to the person next to you\b|\bask the person beside you\b/i;
// …except where the book quotes the phrase in order to retire it: "In the old
// style of this subject, learners were told to 'talk to a partner'. In our
// model, your AI tutor is your partner and your class." That paragraph is the
// course explaining its own teaching model, and flagging it deleted the
// explanation from every unit that carries it.
const REFRAMES_PARTNER_WORK = /\bAI tutor\b|\bin the old style\b|\bwere told to\b|\binstead of\b|\brather than\b/i;
// A teacher-only instruction with no path forward for a learner working alone.
// The packs legitimately point at the twice-weekly live session ("bring it to
// your next teacher session"), which IS a solo-compatible path, so only the
// blocking forms fail.
const TEACHER_REQUIRED = /\bwait for your teacher\b|\byour teacher will tell you\b|\bask your teacher to mark\b|\bhand (?:it )?in to your teacher\b(?!.*\bor\b)/i;
// Conversion artefacts: the pronoun swap leaving prose that is not English.
const BROKEN_PRONOUNS = /\byou and you\b|\bother you\b|\bthe you\b|\byou's\b|\ba child to explain your\b/i;
const MOJIBAKE = /�|Ã[©¨¤¢°½¼ ]|â€[™œ“”]/;
const PLACEHOLDER = /\b(TBD|TODO|FIXME|Lorem ipsum)\b|\bplaceholder\b/i;
// Text that stops mid-thought. A learner with no teacher cannot recover from it.
//
// Two endings look truncated and are not, and both are common here:
//   - a colon introducing the bullets that follow ("…in simple steps:")
//   - an ellipsis used as a fill-in-the-blank ("I would like to try ...")
// Flagging either reported good writing as a defect, so truncation is judged on
// a clause that simply stops: a trailing lowercase word or a dangling
// conjunction, with no punctuation to close it.
const TRUNCATED = /[a-z,;]$|\b(?:and|or|but|the|a|an|of|to|with|for|is|are|because|which|that)$/i;
const FILL_IN_BLANK = /(?:\.\.\.|…|_+)\s*[.!?]?$/;

// Every field a LEARNER reads. grownUpGuide is deliberately absent — it is the
// adult's section and is checked separately, for the opposite property.
const LEARNER_FIELDS = [
  "unit.unitOverview", "outcomes", "explainers", "bigIdeas", "models",
  "tutorPrompts", "speakingPrompts", "teacherSessions", "reflectionPrompts",
  "goals", "toolkit", "checklists", "challenge", "activities", "project",
  "practice", "reflection", "reference", "assessment", "selfAssessment",
];

const failures = [];
const notes = [];
const fail = (label, message) => failures.push(`${label}: ${message}`);
const note = (message) => notes.push(message);

// Walk every string in a value, reporting a dotted path for each.
function walk(value, visit, where = "") {
  if (typeof value === "string") {
    if (value.trim()) visit(value, where);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, `${where}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) walk(child, visit, where ? `${where}.${key}` : key);
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (!fs.existsSync(root)) {
  console.error(`error: no Global Perspectives course at ${root}\n       run: npm run build:global-perspectives`);
  process.exit(1);
}

const frameworks = new Map();
function framework(code) {
  if (!frameworks.has(code)) {
    frameworks.set(code, readJson(path.join(curriculumDir, `cambridge-global-perspectives-${code}.json`)));
  }
  return frameworks.get(code);
}

const grades = fs.readdirSync(root)
  .filter((name) => /^grade-\d+$/.test(name))
  .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));

// ── skill coverage ──────────────────────────────────────────────────────────
// From Stage 4 this subject is one unit per transferable skill, so a self-study
// stage missing a skill is missing a sixth of the course. Nothing noticed that
// until now: Stage 5 has shipped Research and Analysis alone — two of six — and
// every check here passed green, because each unit it DOES have is fine. The
// hole is in what is absent, and absence is invisible to a per-unit check.
//
// A gap the source manifest documents is reported loudly and allowed, because
// no code change can close it and a permanently red build gets ignored or
// deleted. A gap nobody has written down fails, because that is a regression.
const ALL_SKILLS = ["Research", "Analysis", "Evaluation", "Reflection", "Collaboration", "Communication"];
const sourceManifestPath = path.join(here, "..", "inputs", "ehel-global-perspectives-source", "source-manifest.json");
const knownGaps = fs.existsSync(sourceManifestPath) ? (readJson(sourceManifestPath).knownGaps || {}) : {};
const skillsByGrade = new Map();   // "5" -> Set of skills present
const selfStudyGrades = new Set(); // grades whose units are self-study

let unitCount = 0;
let explainerCount = 0;
let questionCount = 0;
let teachingChars = 0;
const seenExplainers = new Map();       // "grade::body" -> "grade/unit — title"
const crossGrade = new Map();           // body -> first "grade/unit" that used it
const repeatedAcrossGrades = new Set(); // titles restated in a later grade

for (const gradeDir of grades) {
  const dataDir = path.join(root, gradeDir, "data");
  const manifestPath = path.join(dataDir, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    fail(gradeDir, "no course-manifest.json — the app cannot list this grade's units");
    continue;
  }
  const manifest = readJson(manifestPath);

  const unitFiles = fs.existsSync(path.join(dataDir, "units"))
    ? fs.readdirSync(path.join(dataDir, "units")).filter((f) => f.endsWith(".json")).sort()
    : [];
  if (!unitFiles.length) {
    fail(gradeDir, "no unit files");
    continue;
  }
  // The manifest is what the app reads to build its unit list; a unit file it
  // does not name is invisible, and a name with no file is a broken link.
  const named = new Set((manifest.units || []).map((u) => path.basename(u.data || "")));
  for (const file of unitFiles) {
    if (!named.has(file)) fail(`${gradeDir}/${file}`, "unit file is not listed in course-manifest.json");
  }
  for (const entry of manifest.units || []) {
    const target = path.join(dataDir, "units", path.basename(entry.data || ""));
    if (!fs.existsSync(target)) fail(`${gradeDir}`, `manifest points at a missing unit file: ${entry.data}`);
  }

  for (const file of unitFiles) {
    const unit = readJson(path.join(dataDir, "units", file));
    const label = `${gradeDir}/${file}`;
    unitCount += 1;
    const guided = unit.unit?.packShape === "guided";

    // Record which skill this unit teaches, for the coverage check after the
    // loop. Guided stages carry no skill label — that starts at Stage 4 — so
    // only self-study grades are held to the six.
    if (!guided) {
      const gradeKey = gradeDir.slice(6);
      selfStudyGrades.add(gradeKey);
      if (!skillsByGrade.has(gradeKey)) skillsByGrade.set(gradeKey, new Set());
      const skill = String(unit.unit?.skill || "").trim();
      if (skill) skillsByGrade.get(gradeKey).add(skill);
      else fail(label, "self-study unit has no skill label, so its stage's skill coverage cannot be checked");
    }

    // ── the unit says what it is about ──────────────────────────────────────
    const overview = String(unit.unit?.unitOverview || "");
    if (overview.trim().length < MIN_OVERVIEW) {
      fail(label, `unit overview is ${overview.trim().length} chars — too short to say what the unit is about`);
    }
    if (!unit.unit?.unitTitle) fail(label, "unit has no title");

    // ── explainers: the self-teaching core ──────────────────────────────────
    const explainers = unit.explainers || [];
    if (!explainers.length) fail(label, "no explainers — there is nothing for a learner to read");
    for (const explainer of explainers) {
      explainerCount += 1;
      const body = String(explainer.body || "");
      const bullets = explainer.bullets || [];
      if (!body && !bullets.length) {
        fail(label, `explainer "${explainer.title}" has neither prose nor bullets`);
        continue;
      }
      if (body && body.length < MIN_EXPLAINER_BODY && !bullets.length) {
        fail(label, `explainer "${explainer.title}" is ${body.length} chars with no bullets — too thin to teach`);
      }
      const lastParagraph = body.split("\n\n").pop()?.trim() || "";
      // A colon at the end is an introduction to whatever follows, so it only
      // dangles when nothing follows it.
      const introducesList = /:$/.test(lastParagraph) && bullets.length > 0;
      if (lastParagraph && !introducesList && !FILL_IN_BLANK.test(lastParagraph) && TRUNCATED.test(lastParagraph)) {
        fail(label, `explainer "${explainer.title}" stops mid-sentence: "…${lastParagraph.slice(-70)}"`);
      }
      // A body repeated inside one grade means one unit is teaching another
      // unit's lesson — the failure mode that hides behind a passing section
      // count. ACROSS grades the same text is expected and correct: Global
      // Perspectives spirals, so "How research feeds the other five skills"
      // is deliberately restated at Stage 6, 7 and 8. Failing on that reported
      // the curriculum design as a bug.
      if (body.length > 200) {
        const key = `${gradeDir}::${body}`;
        const previous = seenExplainers.get(key);
        if (previous) fail(label, `explainer "${explainer.title}" is identical to ${previous} in the same grade`);
        else seenExplainers.set(key, `${label} "${explainer.title}"`);
        const anyGrade = crossGrade.get(body);
        if (anyGrade && anyGrade.split("/")[0] !== gradeDir) {
          repeatedAcrossGrades.add(explainer.title);
        } else if (!anyGrade) {
          crossGrade.set(body, label);
        }
      }
      teachingChars += body.length + bullets.join(" ").length;
    }

    // ── every question can be marked ────────────────────────────────────────
    for (const item of unit.practice || []) {
      // An "open" item is a target the learner sets for themselves ("Area to
      // improve: ______"), which has no right answer by design. Everything else
      // must carry the answer that marks it.
      if (item.kind === "open") continue;
      if (!String(item.answer || "").trim()) {
        fail(label, `practice ${item.id} has no answer — a solo learner cannot mark it: "${String(item.prompt).slice(0, 70)}"`);
      }
    }
    for (const question of unit.assessment?.questions || []) {
      questionCount += 1;
      if (!String(question.modelAnswer || "").trim()) {
        fail(label, `quiz ${question.id} has no model answer`);
      }
    }
    // A unit with no quiz is only acceptable where the pack assesses another
    // way and the build said so; silence would let a dropped quiz through.
    if (!(unit.assessment?.questions || []).length && !unit.assessment?.assessedBy) {
      fail(label, "no quiz questions and no recorded alternative form of assessment");
    }

    // ── the shape each pack should have produced ────────────────────────────
    if (guided) {
      if (!unit.grownUpGuide) fail(label, "guided unit has no grown-up guide — the Stages 1-3 model needs it");
      if (!unit.project?.steps?.length) fail(label, "guided unit has no mini-project");
      if (!(unit.reflection || []).length && !(unit.selfAssessment || []).length) {
        fail(label, "guided unit has no reflection and no self-assessment");
      }
    } else {
      if (!(unit.activities || []).length) fail(label, "self-study unit has no activities");
      if (!(unit.practice || []).length) fail(label, "self-study unit has no practice");
      if (!(unit.reference?.vocabulary || []).length) fail(label, "self-study unit has no glossary");
      if (!(unit.outcomes || []).length) fail(label, "self-study unit states no learning outcomes");
      if (unit.grownUpGuide) fail(label, "self-study unit carries a grown-up guide — that belongs to the guided packs only");
    }

    // ── voice, in the learner's own sections only ───────────────────────────
    const learnerView = {};
    for (const field of LEARNER_FIELDS) {
      const value = field.startsWith("unit.") ? unit.unit?.[field.slice(5)] : unit[field];
      if (value !== undefined) learnerView[field] = value;
    }
    walk(learnerView, (text, where) => {
      if (ADULT_ADDRESSED.test(text)) fail(label, `${where} addresses a supervising adult: "${text.slice(0, 90)}"`);
      if (CLASSROOM_ONLY.test(text)) fail(label, `${where} needs classroom staging a solo learner cannot do: "${text.slice(0, 90)}"`);
      if (NEEDS_A_ROOM.test(text) && !REFRAMES_PARTNER_WORK.test(text)) {
        fail(label, `${where} asks for a partner or a class instead of the AI tutor: "${text.slice(0, 90)}"`);
      }
      if (TEACHER_REQUIRED.test(text)) fail(label, `${where} requires a teacher with no solo path: "${text.slice(0, 90)}"`);
      if (BROKEN_PRONOUNS.test(text)) fail(label, `${where} reads as a broken pronoun swap: "${text.slice(0, 90)}"`);
      if (MOJIBAKE.test(text)) fail(label, `${where} has broken encoding: "${text.slice(0, 90)}"`);
      if (PLACEHOLDER.test(text)) fail(label, `${where} still holds a placeholder: "${text.slice(0, 90)}"`);
    });

    // The grown-up guide is checked for the opposite property: it must BE the
    // adult's voice. One that reads as learner prose means the wrong document
    // was routed into it.
    if (unit.grownUpGuide) {
      if (unit.grownUpGuide.audience !== "adult") fail(label, "grownUpGuide does not declare an adult audience");
      const guideText = JSON.stringify(unit.grownUpGuide);
      if (!ADULT_ADDRESSED.test(guideText) && guideText.length > 400) {
        note(`${label}: grownUpGuide reads as learner prose — check the right document was routed into it`);
      }
    }

    // ── Cambridge objectives really exist in this stage ─────────────────────
    const stage = Number(unit.cambridge?.stage);
    const code = String(unit.cambridge?.code || "");
    const expected = stage <= 6 ? "0838" : "1129";
    if (code && code !== expected) {
      fail(label, `stage ${stage} declares framework ${code}, expected ${expected} (0838 Primary, 1129 Lower Secondary)`);
    }
    if (code === expected) {
      const stageObjectives = framework(code).objectivesByStage[String(stage)] || [];
      const valid = new Set(stageObjectives.map((o) => o.code));
      for (const objective of unit.cambridge?.objectives || []) {
        if (!valid.has(objective.code)) {
          fail(label, `claims objective ${objective.code}, which does not exist in stage ${stage} of ${code}`);
        } else {
          const real = stageObjectives.find((o) => o.code === objective.code);
          if (real && objective.text && real.text !== objective.text) {
            fail(label, `objective ${objective.code} text disagrees with the framework`);
          }
        }
      }
    }
    if (!(unit.cambridge?.objectives || []).length) {
      note(`${label}: no Cambridge objectives mapped yet (${unit.unit?.unitTitle})`);
    }
    // Cambridge writes its objectives for adults, so the overview shows a
    // learner paraphrase where one exists and falls back to the official text
    // where it does not. Years 5, 7 and 8 get theirs from the packs; Years 4
    // and 6 from data/objective-learner-text.json. A self-study unit missing
    // one means a nine-year-old reads curriculum prose, which is the gap that
    // file was written to close — so it fails rather than drifting back open.
    if (!guided) {
      const bare = (unit.cambridge?.objectives || []).filter((o) => !o.learnerText).map((o) => o.code);
      if (bare.length) {
        fail(label, `objective(s) with no learner wording — the overview would show Cambridge's `
          + `adult text: ${bare.join(", ")}`);
      }
    }

    // ── enough substance to stand alone ─────────────────────────────────────
    const unitChars = JSON.stringify(learnerView).length;
    if (unitChars < MIN_TEACHING_CHARS) {
      fail(label, `only ${unitChars} chars of learner-facing content — too thin to teach unaided`);
    }
  }
}

// ── placement exams must not route into a withdrawn stage ───────────────────
// A placement report's whole value is that it names the earlier unit to go and
// rebuild. Pointing that at a stage the app refuses to serve sends the learner
// who most needs help to a withdrawal notice, and nothing else would notice:
// the exam is hand-authored, the withdrawal lives in the app, and no check
// spanned the two. Stage 5's withdrawal left three sections across Stages 6, 7
// and 8 aimed at it.
const withdrawnFile = path.join(here, "..", "src", "prototypes", "ehel-academy", "withdrawn-courses.json");
const withdrawnStages = new Set();
if (fs.existsSync(withdrawnFile)) {
  const reg = readJson(withdrawnFile).withdrawn || {};
  for (const entry of Object.values(reg)) {
    if (String(entry.subject || "").toLowerCase().includes("global perspectives") && entry.stage) {
      withdrawnStages.add(Number(entry.stage));
    }
  }
}
const placementDir = path.join(root, "data", "placement");
if (withdrawnStages.size && fs.existsSync(placementDir)) {
  for (const file of fs.readdirSync(placementDir).filter((f) => f.endsWith(".json")).sort()) {
    const stageOfExam = Number((file.match(/grade-(\d+)/) || [])[1]);
    // The withdrawn stage's own exam is unreachable anyway — skip it.
    if (withdrawnStages.has(stageOfExam)) continue;
    const exam = readJson(path.join(placementDir, file));
    for (const section of exam.sections || []) {
      for (const item of section.remediation || []) {
        if (withdrawnStages.has(Number(item.grade))) {
          fail(`placement/${file}`, `section ${section.sectionId} sends a learner to Stage ${item.grade} Unit ${item.unit} `
            + `(${item.title}), but Stage ${item.grade} is withdrawn — the link lands on a withdrawal notice`);
        }
      }
    }
    const rec = exam.banding?.notReady?.recommendation;
    if (rec && withdrawnStages.has(Number(rec.grade))) {
      fail(`placement/${file}`, `the lowest band recommends "${rec.label}", which is withdrawn`);
    }
  }
}

// ── skill coverage, after every unit has been read ──────────────────────────
const coverageLines = [];
for (const gradeKey of [...selfStudyGrades].sort((a, b) => Number(a) - Number(b))) {
  const present = skillsByGrade.get(gradeKey) || new Set();
  const missing = ALL_SKILLS.filter((skill) => !present.has(skill));
  if (!missing.length) continue;

  const gap = knownGaps[gradeKey];
  const documented = gap ? (gap.missingSkills || []) : [];
  const undocumented = missing.filter((skill) => !documented.includes(skill));

  if (undocumented.length) {
    fail(`grade-${gradeKey}`, `teaches ${present.size} of ${ALL_SKILLS.length} skills — missing ${undocumented.join(", ")}`
      + `, which no known gap in inputs/ehel-global-perspectives-source/source-manifest.json accounts for`);
  }
  const allowed = missing.filter((skill) => documented.includes(skill));
  if (allowed.length) {
    const held = String(gap.status || "").toUpperCase() === "HELD";
    coverageLines.push(`grade-${gradeKey} teaches ${present.size} of ${ALL_SKILLS.length} skills. `
      + `${held ? `HELD since ${gap.heldOn || "?"} — not for publication. ` : ""}`
      + `Missing (known gap): ${allowed.join(", ")}. ${held ? gap.heldReason || "" : gap.closes || ""}`);
  }
}

const gradeList = grades.map((g) => g.slice(6)).join(", ");
console.log(
  `global perspectives content: ${unitCount} units across grades ${gradeList}, `
  + `${explainerCount} explainers, ${questionCount} quiz questions, `
  + `${teachingChars.toLocaleString()} chars of teaching text`
);

if (repeatedAcrossGrades.size) {
  note(`${repeatedAcrossGrades.size} explainer(s) are restated word for word in a later grade `
    + `(${[...repeatedAcrossGrades].slice(0, 3).join("; ")}${repeatedAcrossGrades.size > 3 ? "; …" : ""}) `
    + "— expected for a spiral curriculum, worth an eye if a stage should have deepened the wording");
}

// Printed above the notes and in its own block: an incomplete stage is not a
// wording nit, and it should be the first thing read after the summary line.
if (coverageLines.length) {
  console.log("\nIncomplete stages (known gaps — content missing, not a code fault):");
  for (const line of coverageLines) console.log(`   GAP   ${line}`);
}

if (notes.length) {
  console.log("\nNotes (need a human eye, not a build failure):");
  for (const message of notes) console.log(`   note  ${message}`);
}

if (failures.length) {
  console.log(`\n✗ ${failures.length} global perspectives content failure(s):`);
  for (const message of failures) console.log(`   FAIL  ${message}`);
  process.exit(1);
}
console.log("\n✓ all global perspectives content checks pass");
