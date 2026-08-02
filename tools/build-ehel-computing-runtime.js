// Build Ehel Academy Computing runtime packages for every stage from the
// extracted computing content model. Mirrors the science builder, but the
// Computing packs come in two very different shapes and each needs its own
// reader:
//
//   Stages 1-4  "teacher-guide" — a Teacher & Parent Guide with five Sessions
//               (What to teach / How to explain it simply / Activity / What to
//               look for), an Activity Sheet of Tasks, and a Mini-Project.
//               The guide's prose addresses the adult, so the learner-facing
//               explainer is composed rather than copied (see learnerVoice).
//   Stages 5-7  "student" — a Lesson book of numbered subunits (1.1, 1.2 …),
//               an Activities & Projects book, a Practice & Quiz book with
//               Sections A-E plus answer keys, and a Reference booklet with a
//               keyword glossary, cheat-sheet, tool setup guides and a common
//               errors table. This prose is written to the learner and is
//               carried across in full.
//
// Usage: node tools/build-ehel-computing-runtime.js [grade ...]   (default: all)

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelPath = path.join(root, "outputs", "computing-content", "computing-content-model.json");
const compRoot = path.join(root, "src", "prototypes", "ehel-academy", "computing");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

const grades = process.argv.slice(2).length
  ? process.argv.slice(2).map(Number)
  : Object.keys(model.grades).map(Number).sort((a, b) => a - b);

// The source books mark callouts with a bracketed tag the typesetter turned
// into an icon ("[TIP] Teacher Tip", "[!] Remember", "[FREE] The software…").
// Those tags are layout instructions, not words for the learner.
const SOURCE_MARKER = /\[(?:TIP|FREE|AI|CT|!|\?|x|\*|>|Star|Note|Warning|Key|Safety|Fact|Look|Robot|Check|Info)\]\s*/gi;

// The teacher-voice → learner-voice converter lives in tools/lib because Global
// Perspectives Years 1-3 need exactly the same treatment as Computing Stages
// 1-4. Only the vocabulary is subject-specific, so it is passed in here; the
// grammar is shared. Widening these lists changes what this build produces, so
// they are the Computing words and nothing else.
const { createLearnerVoice } = require("./lib/ehel-learner-voice.js");
const VOICE = createLearnerVoice({
  sourceMarker: SOURCE_MARKER,
  learnerVerbs: ["tap", "taps", "drag", "drags", "code", "codes", "program", "programs",
    "debug", "debugs", "run", "runs", "click", "clicks", "press", "presses", "type", "types"],
  learnerPossessions: ["programs?", "code", "algorithms?", "scrapbooks?", "robots?"],
  thirdPerson: {
    taps: "tap", drags: "drag", codes: "code", programs: "program", debugs: "debug",
    runs: "run", clicks: "click", presses: "press", types: "type",
  },
});
const { tidy, capitalise, polish, splitSentences, extractQuotes, toSecondPerson, swapLearnerPronouns, learnerVoice } = VOICE;
const THIRD_PERSON = VOICE.thirdPerson;
const { DIRECTIVE_START, ADULT_SUBJECT, ADULT_ADDRESSED, CLASSROOM, DIRECTIVE_RESIDUE } = VOICE.patterns;
const slug = (value = "") => tidy(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sentence = (value = "", max = 250) => {
  const text = tidy(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
};

// Join source paragraphs into one field, keeping the paragraph breaks. Teaching
// prose is never clipped: an explainer that stops mid-sentence is worse than
// useless to a learner working without a teacher. Consumers split on the blank
// line to render one <p> per paragraph.
const paragraphs = (values = []) => values.map((value) => tidy(value)).filter(Boolean).join("\n\n");

// Deduplicate while preserving order — used everywhere a section can be fed
// from two sources (lesson + reference, tasks + activities) and would
// otherwise show the learner the same card twice.
const uniqueBy = (items, key) => {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = key(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
};

const EMPTY_DOC = { blocks: [], source_file: "(not provided)" };

// Reviewer corrections, keyed grade → unit file → category → item id → field.
// The reviewed scripts come back as a workbook, not as source-pack edits, so
// tools/apply-ehel-computing-script-review.py lands them here and the build
// lays them over the generated content. Without this pass every rebuild would
// quietly throw the review away.
const reviewPath = path.join(compRoot, "data", "script-review.json");
const scriptReview = fs.existsSync(reviewPath)
  ? (JSON.parse(fs.readFileSync(reviewPath, "utf8")).overrides || {})
  : {};
const reviewStats = { applied: 0, missed: [], rekeyed: [], stranded: [] };
const practiceStats = { unaligned: [] };

// Where each exported category's fields live inside a built unit. Returns the
// object a field should be written to, or null when the item has gone from the
// content (a source pack changed under a review) — reported, never guessed at.
function reviewTarget(unit, category, itemId) {
  const find = (list, id) => (list || []).find((entry) => entry.id === id) || null;
  const indexed = (list, prefix) => {
    const n = Number(String(itemId).slice(prefix.length));
    return Number.isFinite(n) ? (list || [])[n - 1] || null : null;
  };
  switch (category) {
    case "Unit Overview": return { unitOverview: unit.unit, learningPath: unit.unit, outcomes: unit };
    case "Tool Setup": return indexed(unit.toolkit, "tool-");
    case "Concept": return find(unit.concepts, itemId);
    case "Code Example": return find(unit.codeExamples, itemId);
    case "Exploration": return find(unit.explorations, itemId);
    case "Visual Model": return find(unit.visualModels, itemId);
    case "Method": return find(unit.methods, itemId);
    case "Worked Example": return find(unit.workedExamples, itemId);
    case "Practice": return find(unit.practice, itemId);
    case "Activity": return indexed(unit.activities, "activity-");
    case "Debugging": return indexed(unit.debugging, "bug-");
    case "Fluency": return find(unit.fluency, itemId);
    case "Real Problem": return find(unit.realProblems, itemId);
    case "Online Safety": return indexed(unit.esafety, "safety-");
    case "Reasoning Prompt": return find(unit.reasoningPrompts, itemId);
    case "AI Tutor Prompt": return unit.tutorPrompts ? { list: unit.tutorPrompts, prefix: "tutor-" } : null;
    case "Unit Project": return unit.project || null;
    case "Assessment Question": return find((unit.assessment || {}).questions, itemId);
    case "Game Round": {
      const match = String(itemId).match(/^(.*)-r(\d+)$/);
      if (!match) return null;
      const game = ((unit.games || {}).games || []).find((entry) => entry.id === match[1]);
      const round = game && (game.rounds || [])[Number(match[2]) - 1];
      return round ? { round, game } : null;
    }
    case "Reference": {
      const ref = unit.reference || {};
      if (itemId.startsWith("rule-")) return indexed(ref.rules, "rule-");
      if (itemId.startsWith("term-")) return indexed(ref.terms, "term-");
      if (itemId.startsWith("vocab-")) return indexed(ref.vocabulary, "vocab-");
      if (itemId.startsWith("mistake-")) return indexed(ref.commonMistakes, "mistake-");
      if (itemId.startsWith("connection-")) return indexed(ref.connections, "connection-");
      return null;
    }
    case "Self Assessment": return unit.selfAssessment ? { list: unit.selfAssessment, prefix: "can-" } : null;
    default: return null;
  }
}

function applyReviewFields(unit, category, itemId, fields, label) {
  const target = reviewTarget(unit, category, itemId);
  if (!target) { reviewStats.missed.push(`${label} ${category}/${itemId} (item not found)`); return; }
  // Review overrides are keyed by position (q01, q02, …), so a rebuild that
  // changes how many questions a unit parses slides every later override onto a
  // different question. On an MCQ that is silent and destructive: the old
  // question's option list lands on a question whose answer is not in it, and a
  // learner checking their work is marked wrong whatever they pick. Snapshot
  // the shape, and roll the whole item back if the answer stops being offered.
  const isMcq = Array.isArray(target.options) && typeof target.answer === "string";
  const before = isMcq ? { options: [...target.options], answer: target.answer } : null;
  const appliedBefore = reviewStats.applied;
  for (const [field, value] of Object.entries(fields)) {
    if (category === "Unit Overview") {
      target[field][field] = value;
    } else if (category === "Game Round") {
      if (field === "gameTitle") target.game.title = value;
      else if (field === "gameSkill") target.game.skill = value;
      else target.round[field] = value;
    } else if (category === "Self Assessment" || category === "AI Tutor Prompt") {
      // Both are plain string lists, so the slot is replaced, not a field on it.
      const n = Number(String(itemId).slice(target.prefix.length));
      if (!Number.isFinite(n) || target.list[n - 1] === undefined) {
        reviewStats.missed.push(`${label} ${category}/${itemId} (slot not found)`);
        continue;
      }
      target.list[n - 1] = value;
    } else if (category === "Reference" && itemId.startsWith("term-")) {
      target[field === "term" ? 0 : 1] = value;
    } else if (category === "Reference" && itemId.startsWith("mistake-")) {
      target[field === "mistake" ? 0 : 1] = value;
    } else {
      target[field] = value;
    }
    reviewStats.applied += 1;
  }
  if (isMcq && !target.options.includes(target.answer)) {
    target.options = before.options;
    target.answer = before.answer;
    reviewStats.applied = appliedBefore;
    reviewStats.missed.push(`${label} ${category}/${itemId} (override drifted onto another question — answer not among its options)`);
  }
}

// Which vocabulary word a generated quiz question is about, or "" if it is a
// real question parsed out of the pack rather than one of the two padding
// templates in assessmentData().
function paddingTerm(question) {
  const named = /^What does\s*[“"'](.+?)[”"'] mean in computing\?$/.exec(tidy(question.question || ""));
  if (named) return named[1].toLowerCase();
  if (/^Which computing word matches this meaning:/i.test(question.question || "")) {
    return String(question.answer || "").toLowerCase();
  }
  return "";
}

// Overrides are keyed by position (q01, q02, …), so any rebuild that changes
// how many real questions a unit parses slides every padding question — and
// with it every reviewed explanation — onto a different word. The reviewer's
// text says which word it is ("Server means a computer that…"), so it can be
// put back where it belongs instead of being applied to the wrong question or
// thrown away. Only an unambiguous match moves; anything else is left to the
// answer-invariant guard in applyReviewFields.
function rekeyPaddingOverrides(unit, byId) {
  const questions = (unit.assessment || {}).questions || [];
  const byTerm = new Map();
  for (const question of questions) {
    const term = paddingTerm(question);
    if (!term) continue;
    byTerm.set(term, byTerm.has(term) ? null : question.id); // null marks "ambiguous"
  }

  const moves = new Map();
  for (const [itemId, fields] of Object.entries(byId)) {
    const said = /^([A-Za-z][A-Za-z0-9 .'’-]{1,30}?) means /.exec(tidy(fields.explanation || ""));
    const target = said ? byTerm.get(said[1].toLowerCase()) : undefined;
    if (target && target !== itemId) moves.set(itemId, target);
  }
  // Two overrides naming the same word cannot both be right about which
  // question they belong to, so neither moves.
  const demand = new Map();
  for (const target of moves.values()) demand.set(target, (demand.get(target) || 0) + 1);
  for (const [itemId, target] of [...moves]) if (demand.get(target) > 1) moves.delete(itemId);

  const rekeyed = {};
  for (const [itemId, target] of moves) rekeyed[target] = byId[itemId];
  for (const [itemId, fields] of Object.entries(byId)) {
    // An override that moved vacates its slot; one whose slot was claimed by a
    // move is displaced, and its own move (if any) already placed it.
    if (moves.has(itemId) || rekeyed[itemId] !== undefined) continue;
    rekeyed[itemId] = fields;
  }
  reviewStats.rekeyed.push(...[...moves].map(([from, to]) => `${from}→${to}`));

  // What is left over names a word that has no question in this unit at all —
  // the reviewed row belongs to a question the rebuild no longer produces.
  // Applying it would define a word the learner was never asked about, and its
  // option list would be that vanished question's. Drop both fields and let the
  // builder's own explanation, which is derived from the question, stand.
  const kept = {};
  for (const [itemId, fields] of Object.entries(rekeyed)) {
    const said = /^([A-Za-z][A-Za-z0-9 .'’-]{1,30}?) means /.exec(tidy(fields.explanation || ""));
    const question = questions.find((entry) => entry.id === itemId);
    const about = question
      ? `${question.question} ${question.answer} ${(question.options || []).join(" ")}`.toLowerCase()
      : "";
    if (!said || !question || about.includes(said[1].toLowerCase())) {
      kept[itemId] = fields;
      continue;
    }
    const { explanation, options, ...rest } = fields;
    reviewStats.stranded.push(`${itemId} (“${said[1]}”)`);
    if (Object.keys(rest).length) kept[itemId] = rest;
  }
  return kept;
}

function applyScriptReview(unit, grade, unitNumber) {
  const items = ((scriptReview[`grade-${grade}`] || {})[`unit-${unitNumber}`]) || {};
  for (const [category, byId] of Object.entries(items)) {
    const slots = category === "Assessment Question" ? rekeyPaddingOverrides(unit, byId) : byId;
    for (const [itemId, fields] of Object.entries(slots)) {
      applyReviewFields(unit, category, itemId, fields, `grade ${grade} unit ${unitNumber}:`);
    }
  }
}

function applyCapstoneReview(capstone, grade) {
  const items = ((scriptReview[`grade-${grade}`] || {}).capstone || {}).Capstone || {};
  const project = capstone.project || {};
  for (const [itemId, fields] of Object.entries(items)) {
    let target = null;
    if (itemId === "capstone-overview") target = { overview: capstone, drivingQuestion: project, finalProduct: project };
    else if (itemId.startsWith("capstone-stage-")) target = (project.stages || [])[Number(itemId.slice(15)) - 1] || null;
    else if (itemId.startsWith("capstone-evidence-")) target = { list: project.evidenceChecklist, index: Number(itemId.slice(18)) - 1 };
    else if (itemId.startsWith("capstone-rubric-")) target = (project.rubric || [])[Number(itemId.slice(16)) - 1] || null;
    else target = ((capstone.quiz || {}).questions || []).find((q) => `capstone-${q.id}` === itemId) || null;

    if (!target || (target.list && target.list[target.index] === undefined)) {
      reviewStats.missed.push(`grade ${grade} capstone: ${itemId} (item not found)`);
      continue;
    }
    for (const [field, value] of Object.entries(fields)) {
      if (itemId === "capstone-overview") target[field][field] = value;
      else if (field === "evidence" && target.list) target.list[target.index] = value;
      else target[field] = value;
      reviewStats.applied += 1;
    }
  }
}

// "Activity Sheet Task 1 (put the anjero steps in order) and Task 2 (put the
// morning steps in order). Do the first card…" — the worksheet references point
// at a printed page the learner does not have, and only the instruction after
// them is actionable. Stripped wherever they appear, not just at the start: a
// leading-only strip left the second reference sitting in the middle.
function stripWorksheetRefs(value = "") {
  return tidy(String(value)
    .replace(/\b(?:Activity Sheet|Mini-?Project)\s*/gi, " ")
    .replace(/\b(?:Task|Part|Step)\s+[0-9A-E]+\s*\([^)]*\)/gi, " ")
    .replace(/\b(?:Task|Part|Step)\s+[0-9A-E]+\b/gi, " ")
    .replace(/\s+and\s+(?=[.,;:])/gi, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/^[\s.,;:]*(?:and\s+)?/i, ""));
}

// Used when a session's teaching prose is too short to spare a paragraph for
// the example. Question-shaped titles need a different sentence frame from
// noun-shaped ones, or the card reads "Find one real example of what is
// encryption, and why do we use it? around you".
function generatedExample(title) {
  const topic = tidy(title).replace(/\s*\((?:unplugged|on the computer|paper|hands-on)[^)]*\)\s*$/i, "");
  if (/\?$/.test(topic) || /^(what|why|how|when|which|who)\b/i.test(topic)) {
    return `Answer this in your own words, out loud or on paper: ${topic.replace(/\?$/, "")}? Then check your answer against the explanation above.`;
  }
  // A verb-led title is already an instruction ("Find the wrong step"), so
  // wrapping it produced "Find one real example of find the wrong step".
  if (/^(find|make|build|write|draw|debug|test|sort|plan|code|program|create|design|explain|choose|check|meet|use|add|move|open|run|show|be)\b/i.test(topic)) {
    return `Do it yourself: ${topic.charAt(0).toLowerCase()}${topic.slice(1)}. Work through it slowly, then check what you did against the explanation above.`;
  }
  return `Find one real example of ${topic.charAt(0).toLowerCase()}${topic.slice(1)} around you, or on a device you use. Say out loud what it is and why it fits.`;
}

// ---------------------------------------------------------------------------
// Teacher-voice → learner-voice
// ---------------------------------------------------------------------------
// Moved to tools/lib/ehel-learner-voice.js and bound to the Computing
// vocabulary at the top of this file, so Global Perspectives Years 1-3 can
// reuse the same conversion instead of holding a second copy that drifts.

// ---------------------------------------------------------------------------
// Code listings
// ---------------------------------------------------------------------------
// Scratch/MakeCode/Python listings arrive as runs of short paragraphs with no
// sentence punctuation ("set [Score v] to 0", "IF Temperature equal to very
// cold", "display.scroll(count)"). Rendering them as prose destroys the
// indentation the learner has to copy, so they are collected into their own
// section and shown in a code block.
const CODE_LINE = /^(?:set\b|change\b|say\b|ask\b|if\b|else\b|then\b|repeat\b|forever\b|when\b|wait\b|move\b|turn\b|go to\b|glide\b|broadcast\b|define\b|show\b|hide\b|stop\b|switch\b|play\b|add\b|delete\b|IF\b|THEN\b|ELSE\b|REPEAT\b|WHILE\b|INPUT\b|OUTPUT\b|PRINT\b|END\b|from\b|import\b|def\b|while\b|for\b|print\(|input\(|display\.|basic\.|input\.|music\.|led\.|pins\.|[A-Za-z_][A-Za-z0-9_]*\s*=\s*\S|[a-z_]+\([^)]*\)$)/;
const CODE_HINT = /[=<>()[\]{}]|->|::/;

function isCodeLine(text) {
  const value = tidy(text);
  if (!value || value.length > 90) return false;
  if (/[.!?]$/.test(value) && !/\)$/.test(value)) return false;
  if (value.split(/\s+/).length > 12) return false;
  return CODE_LINE.test(value) || (CODE_HINT.test(value) && value.split(/\s+/).length <= 8);
}

function codeRuns(doc, minimumLines = 2) {
  const runs = [];
  let current = null;
  doc.blocks.forEach((block, index) => {
    const text = tidy(block.text);
    if (block.block_type === "Table cell") { current = null; return; }
    if (isCodeLine(text)) {
      if (!current) {
        // The paragraph just above a listing is its caption in every book
        // ("Scratch: a basketball scoreboard using two variables"). A rule of
        // dashes or a bare comment line is a separator inside the listing, not
        // a caption, so it must not become the title.
        // A caption is a short label. The Stage 1-4 guides put a whole
        // paragraph of teacher prose above a listing ("Show this friendly cat
        // example on the board…"), and using that as the card heading put
        // classroom instructions on the learner's screen.
        const previous = tidy(doc.blocks[index - 1]?.text || "");
        const isCaption = previous
          && previous.length <= 90
          && !isCodeLine(previous)
          && !/^[-–—=*_\s]+$/.test(previous)
          && !/^-{2,}.*-{2,}$/.test(previous)
          && !/^(What to teach|How to explain|What to look for|Activity|Teacher Tip)/i.test(previous)
          && !DIRECTIVE_RESIDUE.test(previous)
          && !CLASSROOM.test(previous)
          && !ADULT_ADDRESSED.test(previous);
        current = { title: isCaption ? previous : "", section: block.section, lines: [] };
        runs.push(current);
      }
      current.lines.push(text);
    } else {
      current = null;
    }
  });
  return runs.filter((run) => run.lines.length >= minimumLines);
}

// ---------------------------------------------------------------------------
// Per-grade build
// ---------------------------------------------------------------------------
function buildGrade(grade) {
  const source = model.grades[String(grade)];
  if (!source) throw new Error(`Grade ${grade} missing from the computing content model.`);
  const stageId = `s${String(grade).padStart(2, "0")}`;
  const stageLabel = `Stage ${grade}`;
  const audience = source.metadata.audience;
  const contentPackage = `Ehel-Academy-Computing-Grade-${grade}-Content-Package`;
  // Official Cambridge frameworks for Computing: Primary Computing 0672 covers
  // Stages 1-6, Lower Secondary Computing 0868 covers Stages 7-9. The source
  // books name "Cambridge Primary Computing Stage N" as their own basis.
  const cambridge = grade <= 6
    ? { level: "Cambridge Primary Computing", code: "0672", stage: grade }
    : { level: "Cambridge Lower Secondary Computing", code: "0868", stage: grade };
  const cambridgeLabel = `${cambridge.level} ${cambridge.code} — Stage ${grade}`;
  const gradeDir = path.join(compRoot, `grade-${grade}`);
  const unitDir = path.join(gradeDir, "data", "units");

  const docFor = (unit, type) => source.documents.find((doc) => doc.unit === unit && doc.document_type === type) || EMPTY_DOC;
  const sectionBlocks = (doc, pattern) => doc.blocks.filter((block) => pattern.test(block.section) && block.content_kind !== "Heading");

  // Rows of a two- or three-column table under a matching heading.
  //
  // A heading can cover more than one table — the Stage 1-4 guides put a Key
  // Words table and a block-reference table under the same "Key Words"
  // heading. Keying rows on section+row number therefore made the second table
  // overwrite the first, and a unit's whole glossary silently disappeared. Row
  // numbers restart at 1 for each table, so a drop in the row number marks a
  // new table and starts a new key namespace.
  function tableRows(doc, pattern, { minCols = 2 } = {}) {
    const cells = doc.blocks
      .filter((block) => pattern.test(block.section) && block.block_type === "Table cell")
      .sort((a, b) => a.sequence - b.sequence);
    const byRow = new Map();
    let tableIndex = 0;
    let previousRow = 0;
    let previousSection = null;
    for (const cell of cells) {
      if (cell.section !== previousSection || cell.table_row < previousRow) tableIndex += 1;
      previousRow = cell.table_row;
      previousSection = cell.section;
      const key = `${tableIndex}::${cell.table_row}`;
      if (!byRow.has(key)) byRow.set(key, {});
      byRow.get(key)[cell.table_col] = tidy(cell.text);
    }
    const rows = [];
    for (const row of byRow.values()) {
      const values = [row[1], row[2], row[3]].filter(Boolean);
      if (values.length >= minCols) rows.push(values);
    }
    return rows;
  }

  const HEADER_ROW = /^(word|term|meaning|what it means|example|example sentence|what you see|the likely cause|how to fix it|symptom|cause|fix|mistake|misconception|the truth|why it is wrong|correct|kid-friendly meaning|its name|its job|this app|this computer|question|answer|explanation|q|a)$/i;
  const dropHeaderRows = (rows) => rows.filter((row) => !row.every((value) => HEADER_ROW.test(value)));

  // ---- shared readers ----------------------------------------------------
  function outcomeList(lesson) {
    let list = sectionBlocks(lesson, /learning objectives?|^objectives?$|what you will (?:be able to do|learn)|success criteria/i)
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 18
        && !/^(these come from|by the end|here is exactly|come back and tick|read them now|the unit's own|here is what|you will be able)/i.test(text)
        // Subunit headings inside the objectives list are signposts, not outcomes.
        && !/^(?:\d+\.\d+\s|(?:subunit|part|step|unit)\s+\d)/i.test(text))
      .filter((text) => !ADULT_ADDRESSED.test(text));
    list = list.map((text) => tidy(text.replace(/^[-••]\s*/, "")));
    if (!list.length) {
      list = lesson.blocks.map((block) => tidy(block.text))
        .filter((text) => /^(know|recognise|recognize|understand|explain|describe|identify|create|write|debug|use|design|plan|predict|sort|collect|store|compare|test|evaluate|program|code|name|list|say)\b/i.test(text)
          && text.length > 25 && text.length < 220 && !ADULT_ADDRESSED.test(text));
    }
    return uniqueBy(list, (text) => text.toLowerCase()).slice(0, 10);
  }

  // ---- Stage 1-4: sessions in the Teacher & Parent Guide -------------------
  const SESSION_HEAD = /^Session\s+(\d+)\s*[-–—:]\s*(.+)$/i;
  const LABEL = /^(What to teach|How to explain it simply|What to look for|Activity[^:]*|Teacher Tip|Home Connection)\s*:?\s*/i;

  function sessionConcepts(lesson) {
    const starts = lesson.blocks
      .map((block, index) => ({ block, index, match: SESSION_HEAD.exec(tidy(block.text)) }))
      .filter((entry) => entry.match);
    return starts.map((entry, position) => {
      const end = starts[position + 1]?.index ?? lesson.blocks.length;
      const body = lesson.blocks.slice(entry.index + 1, end).map((item) => tidy(item.text)).filter(Boolean);
      const labelled = (name) => body
        .filter((text) => new RegExp(`^${name}`, "i").test(text))
        .map((text) => tidy(text.replace(LABEL, "")))
        .filter(Boolean);
      const teach = labelled("What to teach");
      const explain = labelled("How to explain it simply");
      const activity = body.filter((text) => /^Activity\b/i.test(text)).map((text) => tidy(text.replace(LABEL, "")));
      const tip = body.filter((text) => /^Teacher Tip/i.test(text)).map((text) => tidy(text.replace(LABEL, "")));
      const look = labelled("What to look for");
      // "What to teach" is already declarative and safe to show a learner; the
      // rest is recovered through learnerVoice.
      const parts = [
        ...teach.map((text) => learnerVoice(text, { allowRewrite: false, guide: true }) || text),
        ...explain.map((text) => learnerVoice(text, { guide: true })),
      ].filter((text) => text && text.length > 25);
      // Teacher Tips are advice about running the session ("Expect to help
      // lots of little hands"), so they are kept out of the example entirely
      // and only join the explainer when they survive the residue filters.
      const tips = tip
        .map((text) => learnerVoice(text, { guide: true }))
        .filter((text) => text && text.length > 40
          && !DIRECTIVE_RESIDUE.test(text) && !CLASSROOM.test(text) && !ADULT_ADDRESSED.test(text));
      // Hold the closing paragraph of the teaching prose out as the worked
      // example, the way the science builder does. Most sessions yield only
      // two paragraphs (what to teach, how to explain it), and these guides put
      // the localised story at the end of the second one — so when there is no
      // spare paragraph, the closing sentences of the last one are used
      // instead. Falling straight through to the generated prompt left two
      // thirds of the cards with no real example in them.
      let explainerParts = parts;
      let example = "";
      if (parts.length > 2) {
        explainerParts = parts.slice(0, -1);
        example = parts[parts.length - 1];
      } else if (parts.length) {
        const sentences = splitSentences(parts[parts.length - 1]);
        if (sentences.length >= 4) {
          example = sentences.slice(-2).join(" ");
          explainerParts = [...parts.slice(0, -1), sentences.slice(0, -2).join(" ")];
        }
      }
      // A handful of sessions lose most of their prose to the adult-voice
      // filters and come out too thin to teach from. Rather than ship a stub,
      // fold in the session's own learner-facing extras — the activity and the
      // self-check — which say the same thing in a form the learner can act on.
      const explainer = paragraphs([...explainerParts, ...tips]);
      const activityText = activity
        .map((text) => learnerVoice(stripWorksheetRefs(text), { guide: true }))
        .filter((text) => text && text.length > 25 && !DIRECTIVE_RESIDUE.test(text) && !CLASSROOM.test(text))
        .join(" ");
      // Inside "What to look for" every third-person pronoun is the learner —
      // the adult is being asked to watch what "they" do — so the blanket swap
      // is safe here even though it is too blunt for prose generally.
      const checkText = look
        .map((text) => learnerVoice(text, { guide: true }))
        .map((text) => polish(text
          .replace(/\bthem\b/gi, "you")
          .replace(/\bthey\b/gi, "you")
          .replace(/\btheir\b/gi, "your")
          .replace(/\byou\s+([a-z]+)\b/gi, (whole, verb) => (THIRD_PERSON[verb.toLowerCase()] ? `you ${THIRD_PERSON[verb.toLowerCase()]}` : whole))))
        .filter((text) => text && !DIRECTIVE_RESIDUE.test(text) && !CLASSROOM.test(text))
        .join(" ");
      const toppedUp = explainer.length >= 240
        ? explainer
        : paragraphs([explainer, activityText && `Try it: ${activityText}`, checkText && `Check yourself: ${checkText}`].filter(Boolean));
      return {
        number: Number(entry.match[1]),
        title: capitalise(tidy(entry.match[2])),
        explanation: toppedUp,
        example,
        // "Activity Sheet Task 1 (circle the things that are computers)" points
        // at a printed page the learner does not have; the instruction that
        // follows it is the part they can act on.
        activity: activityText,
        // "What to look for" is written as an adult watching the child ("Do
        // they understand that a phone is a computer?"). The guide pronoun swap
        // turns it into a self-check the learner can use on their own.
        checkYourself: checkText,
      };
    }).filter((item) => item.title);
  }

  // Activity Sheet tasks: "Task 3 - What Do We Use Computers For?" followed by
  // an instruction, an optional matching table and a drawing frame.
  const TASK_HEAD = /^(?:Task|Part|Step)\s+([0-9A-E]+)\s*[-–—:]\s*(.+)$/i;
  const FRAME = /^\[\s*\]$|^\[_+\]$|^\[\s{2,}\]$|^\[\s*_*\s*\]$/;
  const isFrame = (text) => FRAME.test(text) || /^\[\s*\]?$/.test(text) || /^\[[\s_]*\]$/.test(text);

  function taskList(doc, isGuideAudience = false) {
    const starts = doc.blocks
      .map((block, index) => ({ block, index, match: TASK_HEAD.exec(tidy(block.text)) }))
      .filter((entry) => entry.match);
    return starts.map((entry, position) => {
      const end = starts[position + 1]?.index ?? doc.blocks.length;
      const slice = doc.blocks.slice(entry.index + 1, end);
      const steps = [];
      const pairs = [];
      const byRow = new Map();
      for (const item of slice) {
        const text = tidy(item.text);
        if (!text || isFrame(text)) continue;
        if (item.block_type === "Table cell") {
          const key = item.table_row;
          if (!byRow.has(key)) byRow.set(key, []);
          byRow.get(key).push(text);
          continue;
        }
        if (/^(Name:|Class:)/i.test(text)) continue;
        const learner = learnerVoice(text, { guide: isGuideAudience });
        if (learner && learner.length > 4) steps.push(learner);
      }
      for (const values of byRow.values()) if (values.length >= 2 && !values.every((v) => HEADER_ROW.test(v))) pairs.push(values);
      return { id: tidy(entry.match[1]), title: capitalise(tidy(entry.match[2])), steps, pairs };
    }).filter((task) => task.title && (task.steps.length || task.pairs.length));
  }

  // ---- Stage 5-7: numbered teaching sections in the Lesson book ------------
  // Six heading conventions appear across the six student books, and a unit
  // uses exactly one of them. Recognising only "1.1 Assigning Variables" left
  // nine of the fourteen units with no concepts at all, so every convention is
  // matched and the family with the most hits wins — that is the finest real
  // segmentation the author gave the unit.
  const CONCEPT_MARKERS = [
    { name: "decimal", re: /^(\d{1,2}\.\d{1,2})\s+(\S.{2,90})$/, key: (m) => m[1], title: (m) => m[2] },
    { name: "part", re: /^(?:Part|Subunit)\s+(\d{1,2}\.\d{1,2})\s*[-–—:]\s*(\S.{2,90})$/i, key: (m) => m[1], title: (m) => m[2] },
    { name: "concept", re: /^Concept\s+(\d{1,2})\s*[-–—:.]\s*(\S.{2,90})$/i, key: (m) => m[1], title: (m) => m[2] },
    { name: "bigidea", re: /^Big\s+Idea\s+(\d{1,2})\s*[-–—:.]\s*(\S.{2,90})$/i, key: (m) => m[1], title: (m) => m[2] },
    { name: "step", re: /^Step\s+(\d{1,2})\s*[-–—:.]\s*(\S.{2,90})$/i, key: (m) => m[1], title: (m) => m[2] },
    { name: "lesson", re: /^Lesson\s+(\d{1,2})\s*[-–—:.]\s*(\S.{2,90})$/i, key: (m) => m[1], title: (m) => m[2] },
    // A bare numbered heading ("7. Network overload"). Rejected when it reads
    // like a workbook instruction or a sentence, so practice items and
    // objectives never masquerade as concepts.
    {
      name: "numbered",
      re: /^(\d{1,2})[.)]\s+(\S.{5,79})$/,
      key: (m) => m[1],
      title: (m) => m[2],
      reject: (title) => /[.?!;,]$/.test(title)
        || /^(answer|example|step|remember|aim|method|materials|read |write |draw |name |list |explain |describe |identify |complete |circle |match |tick |fill |copy |look |choose |say |tell |click |open |type |go to|add |use |make |set |change |predict|which |what |why |how |is |are |true |false )/i.test(title),
    },
  ];
  // Headings that mark the end of a unit's teaching prose. Everything from here
  // belongs to another section of the runtime package, so a concept must not
  // absorb it.
  const LESSON_TAIL = /^(key terms?|keyword glossary|glossary|self[- ]assessment|i can\b|what can you do|check what you|what you have learned|summary\b|unit summary|end[- ]of[- ]unit|quiz\b|answer keys?|answers?\b|going further|what.?s next|next unit|preparing for|well done|congratulations|checklist|practice\b|section [a-e]\b|reference\b|how to use this|cheat[- ]sheet|setup guides?|common (?:errors?|mistakes|misconceptions)|remember! boxes|self[- ]study tips|suggested daily routine|a suggested daily routine|bringing it all together)/i;

  // Callout blocks the books use inside the teaching prose. They are lifted
  // into their own runtime sections rather than left to interrupt a concept.
  // Anchored so a callout marker is never confused with the section heading of
  // the same name: "Common Misconception - Wi-fi is the internet" is a callout,
  // "Common Misconceptions (age 6)" is the heading of a whole section and must
  // be left for the misconceptions reader.
  const CALLOUT_KINDS = [
    { key: "tutor", re: /^Ask Your AI Tutor\b/i },
    { key: "safety", re: /^Stay Safe!?(?:\s*[-–—:]|$)/i },
    { key: "misconception", re: /^Common Misconception(?:\s*[-–—:]|$)/i },
    { key: "thinking", re: /^Computational Thinking(?:\s*[-–—:]|$)/i },
    { key: "remember", re: /^Remember(?:\s*[-–—:!]|$)/i },
    { key: "warmup", re: /^Warm[- ]?Up(?:\s*[-–—:]|$)/i },
  ];
  const calloutKind = (text) => CALLOUT_KINDS.find((entry) => entry.re.test(tidy(text)))?.key || null;

  // Pull each callout run out of a document: the marker line plus the
  // paragraphs beneath it, up to the next marker or heading.
  function callouts(doc) {
    const found = { tutor: [], safety: [], misconception: [], thinking: [], remember: [], warmup: [] };
    doc.blocks.forEach((block, index) => {
      const kind = calloutKind(block.text);
      if (!kind) return;
      const heading = tidy(block.text).replace(/^(?:Ask Your AI Tutor|Stay Safe!?|Common Misconception|Computational Thinking|Remember|Warm[- ]?Up)\s*[-–—:]?\s*/i, "");
      const body = [];
      for (let cursor = index + 1; cursor < doc.blocks.length && body.length < 6; cursor += 1) {
        const text = tidy(doc.blocks[cursor].text);
        if (!text || calloutKind(text) || LESSON_TAIL.test(text)) break;
        if (doc.blocks[cursor].content_kind === "Heading") break;
        if (text.length < 12) break;
        body.push(text);
      }
      if (body.length) found[kind].push({ title: heading || null, body });
    });
    return found;
  }

  // A body of this many paragraphs is not one taught idea — the heading family
  // that matched was coarser than the book's real structure, and the concept
  // ran on into the sections below it.
  const MAX_CONCEPT_PARAGRAPHS = 24;

  // Split an over-long concept at the plain headings inside its own body, so a
  // 60-paragraph card becomes the several cards the book actually taught.
  function splitLongConcept(concept) {
    const parts = String(concept.explanation).split(/\n{2,}/);
    if (parts.length <= MAX_CONCEPT_PARAGRAPHS) return [concept];
    const looksLikeHeading = (text) => {
      const value = tidy(text);
      return value.length >= 8 && value.length <= 72
        && !/[.?!,;]$/.test(value)
        && /^[A-Z0-9]/.test(value)
        && value.split(/\s+/).length <= 10
        && !isCodeLine(value);
    };
    const groups = [];
    let current = { title: concept.title, body: [] };
    for (const part of parts) {
      if (looksLikeHeading(part) && current.body.length >= 3) {
        groups.push(current);
        current = { title: capitalise(tidy(part).replace(/\s*[-–—:]\s*[a-z].*$/, "")), body: [] };
      } else {
        current.body.push(part);
      }
    }
    groups.push(current);
    const usable = groups.filter((group) => group.body.join(" ").length > 220);
    if (usable.length < 2) return [concept];
    return usable.map((group) => {
      const hasSpare = group.body.length > 2;
      return {
        title: group.title,
        explanation: paragraphs(hasSpare ? group.body.slice(0, -1) : group.body),
        example: hasSpare ? tidy(group.body[group.body.length - 1]) : (group.body.length > 1 ? tidy(group.body[1]) : ""),
      };
    });
  }

  function markerConcepts(lesson) {
    let best = [];
    for (const marker of CONCEPT_MARKERS) {
      // The same numbers appear up to three times in these books: in the unit
      // overview list, again in the objectives list, and finally as the
      // teaching heading. Keep the last occurrence of each key — that is where
      // the teaching runs.
      const byKey = new Map();
      lesson.blocks.forEach((block, index) => {
        const match = marker.re.exec(tidy(block.text));
        if (!match) return;
        const title = tidy(marker.title(match)).replace(/\s*[-–—]\s*[a-z].*$/, "");
        if (!title || (marker.reject && marker.reject(title))) return;
        byKey.set(marker.key(match), { index, title });
      });
      const starts = [...byKey.values()].sort((a, b) => a.index - b.index);
      if (starts.length > best.length) best = starts;
    }
    if (best.length < 3) {
      // A few units number nothing and teach under plain title-case headings
      // ("Cells and cell references", "Primary keys: why every table needs
      // one"). Without this the whole unit produced no concepts at all.
      const plain = [];
      lesson.blocks.forEach((block, index) => {
        if (block.block_type !== "Paragraph") return;
        const text = tidy(block.text);
        if (text.length < 8 || text.length > 72) return;
        if (/[.?!,;]$/.test(text)) return;
        if (!/^[A-Z]/.test(text)) return;
        if (text.split(/\s+/).length > 10) return;
        if (calloutKind(text) || LESSON_TAIL.test(text)) return;
        if (/^(unit|year|ehel|scenario|warm[- ]?up|learning objectives|key terms|by the end|strand)/i.test(text)) return;
        if (isCodeLine(text)) return;
        // A heading is followed by prose, not by another heading.
        const next = tidy(lesson.blocks[index + 1]?.text || "");
        if (next.length < 60) return;
        plain.push({ index, title: text.replace(/\s*[-–—:]\s*[a-z].*$/, "") });
      });
      if (plain.length >= 3) best = plain;
    }
    if (best.length < 3) return [];
    const starts = best;

    return starts.map((entry, position) => {
      const end = starts[position + 1]?.index ?? lesson.blocks.length;
      const slice = lesson.blocks.slice(entry.index + 1, end);
      const tailAt = slice.findIndex((item) => LESSON_TAIL.test(tidy(item.text)));
      const kept = tailAt >= 0 ? slice.slice(0, tailAt) : slice;
      // Prose only: code listings are lifted into their own section, callouts
      // into theirs, and table cells are re-joined per row so a table reads as
      // one line rather than a column of orphaned fragments.
      const body = [];
      const rows = new Map();
      let skippingCallout = false;
      for (const item of kept) {
        const text = tidy(item.text);
        if (!text) continue;
        if (calloutKind(text)) { skippingCallout = true; continue; }
        if (item.block_type === "Table cell") {
          skippingCallout = false;
          const key = `${item.section}::${item.table_row}`;
          if (!rows.has(key)) rows.set(key, []);
          rows.get(key).push(text);
          continue;
        }
        if (isCodeLine(text)) { skippingCallout = false; continue; }
        if (skippingCallout) {
          // Callout bodies run until the next full paragraph of teaching prose.
          if (text.length < 200) continue;
          skippingCallout = false;
        }
        if (text.length > 30) body.push(text);
      }
      for (const values of rows.values()) {
        if (values.length >= 2 && !values.every((value) => HEADER_ROW.test(value))) body.push(`${values[0]} — ${values.slice(1).join(" · ")}`);
      }
      const hasSpare = body.length > 2;
      // With only one paragraph there is nothing to spare, and falling back to
      // body[0] made the example a verbatim copy of the explanation — the card
      // then shows the learner the same text twice under two headings.
      const example = hasSpare
        ? tidy(body[body.length - 1])
        : (body.length > 1 ? tidy(body[1]) : "");
      return {
        title: capitalise(entry.title),
        explanation: paragraphs(hasSpare ? body.slice(0, -1) : body),
        example,
      };
    }).filter((concept) => concept.explanation.length > 120)
      .flatMap((concept) => splitLongConcept(concept));
  }

  // Practice & Quiz: everything before the first answer key is a task,
  // everything after is a key. Sections A-E carry the difficulty ladder.
  function practiceFromSections(practiceDoc, unitWords = []) {
    const items = [];
    const mcqs = [];
    // A section heading marks itself as a key two ways: "Answer Key - Section
    // C", or the question heading with a parenthetical — "Section B - Short
    // Answer (model answers)". Both are sections in their own right, so without
    // this they are read as question runs of their own.
    const isKeyHeading = (name) => /answer\s*keys?\b/i.test(name || "") || /\(\s*(?:model\s+)?answers?\b/i.test(name || "");
    const sections = [...new Set(practiceDoc.blocks.map((block) => block.section))]
      .filter((name) => /^Section\s+[A-E]\b/i.test(name) && !isKeyHeading(name));
    const levelFor = { A: "Warm-up", B: "Core", C: "Core", D: "Challenge", E: "Extension" };
    // Naming this unit's own key words is what makes a hint usable. A single
    // generic sentence shared by every unit in the subject is decoration.
    const words = unitWords.filter(Boolean).slice(0, 3);
    const recallHint = words.length >= 2
      ? `Look back at what ${words.slice(0, 2).join(" and ")} mean in this unit, then answer in your own words.`
      : "Find the sentence in the lesson that explains this idea, then answer in your own words.";
    const applyHint = words.length >= 2
      ? `Work out which idea this is about — ${words.join(", ")} — then explain your reasoning step by step.`
      : "Decide which idea from this unit the task is about, then explain your reasoning step by step.";
    // Where the answer keys begin. Section names alone cannot tell a question
    // from its answer: one layout repeats the very same heading ("Section A —
    // Multiple Choice") over the key run, so the two are indistinguishable by
    // name and only their position separates them.
    // "Answer Key", "Answer Keys (with explanations)", "FULL ANSWER KEY" — the
    // marker is worded differently in every pack, and missing it means every
    // question in the unit falls back to "work through the task".
    const KEY_MARKER = /^(full\s+|complete\s+)?answer\s*keys?\b/i;
    const keyStart = practiceDoc.blocks.findIndex((block) =>
      KEY_MARKER.test(tidy(block.text)) || KEY_MARKER.test(block.section || ""));
    const beforeKeys = (block) => keyStart < 0 || practiceDoc.blocks.indexOf(block) < keyStart;
    const afterKeys = (block) => keyStart >= 0 && practiceDoc.blocks.indexOf(block) > keyStart;

    for (const name of sections) {
      const letter = name.match(/^Section\s+([A-E])/i)[1].toUpperCase();
      const namesThisSection = (heading) => new RegExp(`\\bSection\\s+${letter}\\b`, "i").test(heading || "");
      // When this section's key has a heading of its own, that heading is the
      // whole story and position must not be consulted. One layout interleaves
      // them — Section A, Answer Key - Section A, Section B, Answer Key -
      // Section B — so the first key sits above most of the questions. Read
      // positionally, everything from Section B down was treated as key text
      // and four sections of an eight-section booklet produced nothing at all.
      const namedKeys = practiceDoc.blocks.filter((block) =>
        block.content_kind !== "Heading" && namesThisSection(block.section) && isKeyHeading(block.section));
      const taskLines = practiceDoc.blocks
        .filter((block) => block.section === name && block.content_kind !== "Heading"
          && (namedKeys.length > 0 || beforeKeys(block)))
        .map((block) => tidy(block.text))
        // The line under a section heading is the rubric, not a question. Left
        // in, it becomes task 0 and every answer after it is off by one — the
        // TLD question answered with the padlock explanation.
        .filter((text) => text.length > 12 && !/^(choose|circle|tick|answer (?:each|in|the)|write (?:your|down|the letter)|read each|use (?:the|what)|for each|sort or match|copy each|some of these|these questions|this quiz)/i.test(text))
        // A heading for a later section, swept into this one by the extractor.
        // It is neither a question nor an answer, and it appears once in each
        // run, so leaving it in shifts one side against the other.
        .filter((text) => !/^Section\s+[A-F]\b/i.test(text));
      // "C1.", "C2." — the label the books put on both a question and its
      // answer. Where they are present they beat position outright, and they
      // also say where one question ends: a "predict the output" question is a
      // stem followed by its program, and every line of that program was being
      // read as a question of its own. Twenty-five items, none answerable.
      const LABEL = new RegExp(`^(?:${letter}\\s*)?(\\d{1,2})\\s*[.):]\\s*`, "i");
      const groupByLabel = (lines) => {
        if (!lines.some((line) => LABEL.test(line))) return lines;
        const out = [];
        for (const line of lines) {
          if (LABEL.test(line) || !out.length) out.push(line);
          else out[out.length - 1] += `\n${line}`;
        }
        return out;
      };
      const tasks = groupByLabel(taskLines);
      // The books head their answer keys two ways round — "Answer Key - Section
      // A (Multiple Choice)" and "Section A: Answer Key" — so match a heading
      // that names both, in either order. Matching only the first form left
      // every question in those units with the fallback "work through the task"
      // string instead of its answer, which is precisely what a learner with no
      // teacher cannot do without.
      // A named key wins outright. Position is the fallback for the one layout
      // that repeats the question heading verbatim over its key, where nothing
      // but the order distinguishes the two runs.
      const keySection = namedKeys.length
        ? namedKeys
        : practiceDoc.blocks.filter((block) => block.content_kind !== "Heading"
          && namesThisSection(block.section) && afterKeys(block));
      const keys = groupByLabel(keySection.map((block) => tidy(block.text))
        .filter((text) => text.length > 1 && !/^Section\s+[A-F]\b/i.test(text)));
      // Keys are labelled ("3." or "C3."), so match a task to its key by that
      // label rather than by index — a stray instruction line in either run
      // would otherwise shift every answer after it by one.
      const keyByNumber = new Map();
      for (const key of keys) {
        const match = LABEL.exec(key);
        if (match) keyByNumber.set(Number(match[1]), tidy(key.slice(match[0].length)));
      }
      // Unnumbered keys can only be read positionally, and position is only
      // trustworthy when the two runs are the same length. One stray line in
      // either run shifts every answer after it onto the wrong question, which
      // is worse for a learner checking their work than no answer at all.
      const aligned = keys.length === tasks.length;
      if (!aligned && !keyByNumber.size && keys.length) {
        practiceStats.unaligned.push(`g${grade}/unit-${practiceDoc.unit} ${name}: ${tasks.length} questions vs ${keys.length} key lines`);
      }
      tasks.forEach((prompt, index) => {
        const numbered = LABEL.exec(prompt);
        const number = numbered ? Number(numbered[1]) : index + 1;
        // tidy() collapses whitespace, which would fold a program back onto one
        // line, so a grouped prompt keeps its own line breaks.
        const stem = numbered ? prompt.slice(numbered[0].length).trim() : prompt;
        const answer = keyByNumber.get(number) || (aligned ? tidy(keys[index] || "") : "");
        if (!stem || stem.length < 12) return;
        items.push({
          id: `p${String(items.length + 1).padStart(2, "0")}`,
          level: levelFor[letter] || "Core",
          prompt: stem,
          answer: answer || "Work through the task, then check it against this unit's concept explanations and the Computing Words reference card.",
          hint: letter === "A" || letter === "B" ? recallHint : applyHint,
        });
        // Section A is multiple choice: "What is a variable? a) … b) … c) …"
        const optionStart = stem.search(/[\s:]\(?a\)\s/i);
        if (letter === "A" && optionStart > 5 && /\(?b\)\s/i.test(stem)) {
          const question = tidy(stem.slice(0, optionStart + 1));
          const options = stem.slice(optionStart + 1).split(/\s*\(?[a-d]\)\s+/i).map(tidy).filter(Boolean).slice(0, 4);
          const keyText = answer;
          const letterMatch = /^\(?([a-d])\)?\b/i.exec(keyText);
          let answerText = letterMatch ? options["abcd".indexOf(letterMatch[1].toLowerCase())] : "";
          if (!answerText) answerText = options.find((option) => option.length > 3 && keyText.toLowerCase().includes(option.slice(0, 24).toLowerCase())) || "";
          // The answer must be one of the options offered, or the question is
          // ungradeable and actively misleading — a learner checking their work
          // is told they are wrong whatever they pick. When a parse cannot
          // produce that, drop the question and let the vocabulary padding in
          // assessmentData supply a self-consistent one instead.
          if (options.length >= 3 && answerText && options.includes(answerText)) {
            mcqs.push({
              question,
              options,
              answer: answerText,
              explanation: sentence(keyText.replace(/^\(?[a-d]\)?\s*[-–—.:]?\s*/i, ""), 220) || `${answerText}.`,
            });
          }
        }
      });
    }
    return { items, mcqs };
  }

  // The Mini-Project's practice questions plus its Teacher Answer Key.
  //
  // Section attribution cannot be relied on here: several units head the run
  // with a bare "Practice", which reads as ordinary prose, so those questions
  // stayed filed under the preceding checklist and were lost. The run is
  // therefore located by scanning the document — from the "Practice" line to
  // the answer key — rather than by section name.
  // `unitWords` are this unit's own key words. A hint that names them is
  // something the learner can act on; the single sentence that was otherwise
  // shared by every Stage 1-4 unit told them nothing they did not know.
  function practiceFromMiniProject(practiceDoc, lesson, unitWords = []) {
    const items = [];
    const mcqs = [];
    const blocks = practiceDoc.blocks.map((block) => tidy(block.text));
    // "Practice", "Practice Questions", "Practice - Read the Graph".
    const startAt = blocks.findIndex((text) => /^practice\b/i.test(text) && text.length < 60);
    const keyAt = blocks.findIndex((text, index) => index > startAt && /^(teacher\s+)?answer\s+key/i.test(text));
    if (startAt < 0) return { items, mcqs };
    const end = keyAt > startAt ? keyAt : blocks.length;
    const taskRun = blocks.slice(startAt + 1, end);

    // The Years 1-4 answer keys are split across two books: the Mini-Project
    // carries a "Teacher Answer Key" for some units, and the Teacher Guide
    // carries "Answer Key - Mini-Project & Practice" for the rest. Reading only
    // one of them left whole units with placeholder answers, which is exactly
    // what a learner working alone cannot use.
    const guideKeyAt = lesson.blocks.findIndex((block) => /^answer key\s*[-–—]\s*mini[- ]project|^practice answers?\b/i.test(tidy(block.text)));
    const guideKeyRun = guideKeyAt >= 0
      ? lesson.blocks.slice(guideKeyAt + 1).map((block) => tidy(block.text))
      : [];
    const keyRun = [...(keyAt >= 0 ? blocks.slice(keyAt + 1) : []), ...guideKeyRun];

    // Keys read "Practice 3: hear a song = speaker; …" or "3. android."
    const keyByNumber = new Map();
    const keyOrdinal = [];
    for (const line of keyRun) {
      for (const chunk of line.split(/(?=\bPractice\s+\d{1,2}\s*[:.]|(?:^|\s)\d{1,2}\s*[.)]\s)/)) {
        const match = /^(?:Practice\s+)?(\d{1,2})\s*[.):]\s*(.+)$/.exec(tidy(chunk));
        if (!match) continue;
        if (!keyByNumber.has(Number(match[1]))) keyByNumber.set(Number(match[1]), tidy(match[2]));
        keyOrdinal.push(tidy(match[2]));
      }
    }

    // A third key shape: unnumbered prose, one line per question, after a
    // "Practice answers (…):" marker. Some of those lines echo the question
    // before answering it ("How many liked mango? 4."), which is the only
    // reliable way to bind them; the rest are answers alone and can only be
    // read positionally.
    const proseAt = keyRun.findIndex((line) => /^practice\b[^?]*:$/i.test(line));
    const proseRun = (proseAt >= 0 ? keyRun.slice(proseAt + 1) : [])
      .filter((line) => line.length > 8 && !/^(?:Practice\s+)?\d{1,2}\s*[.):]/.test(line));
    const STOPWORDS = new Set(["the", "a", "an", "of", "in", "is", "are", "to", "and", "did", "do", "does", "that", "this", "these", "your", "you", "it"]);
    const tokens = (text) => tidy(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    // A key line that restates its question splits into head (the restatement)
    // and tail (the answer) at the question mark or the first colon.
    const echoes = proseRun.map((line) => {
      const split = /\?/.test(line) ? line.indexOf("?") : line.indexOf(":");
      if (split <= 0 || split >= line.length - 2) return null;
      const head = tokens(line.slice(0, split));
      if (head.filter((word) => !STOPWORDS.has(word)).length < 2) return null;
      return { head, answer: tidy(line.slice(split + 1)).replace(/^=\s*/, ""), line };
    });
    const echoUsed = new Set();

    const words = unitWords.filter(Boolean).slice(0, 3);
    const miniHint = words.length >= 2
      ? `Look back at what ${words.slice(0, 2).join(" and ")} mean in this unit, then say your answer in a full sentence.`
      : "Find the part of the lesson that explains this idea, then say your answer in a full sentence.";
    // Sub-parts ("a) Which loop never stops?") and the code listing under a
    // stem that ends in a colon belong to the numbered question above them.
    // The key answers each numbered question once, covering all its parts, so
    // splitting them apart left three items sharing one answer and three with
    // none — and dropped the program a "predict the outcome" question is about.
    const merged = [];
    let openStem = false;
    for (const line of taskRun) {
      if (/^\d{1,2}\s*[.)]\s/.test(line)) {
        merged.push(line);
        openStem = /:$/.test(line);
        continue;
      }
      const subPart = /^\(?[a-h]\)\s/.test(line);
      if (merged.length && (subPart || openStem)) {
        merged[merged.length - 1] += ` ${line}`;
        openStem = openStem || subPart;
        continue;
      }
      merged.push(line);
    }

    let unnumbered = 0;
    merged.forEach((task, index) => {
      // Some units number their questions, others write them as plain
      // sentences ending in an "Answer: ______" rule. Handle both.
      // Three question shapes: numbered, a trailing "Answer: ______" rule, and
      // one that writes its blanks inline ("(a) Traveller ______ (b) People
      // ______"). Missing the third dropped a whole question, which then slid
      // every later answer in the key onto the wrong one.
      const match = /^(\d{1,2})\s*[.)]\s*(.+)$/.exec(task)
        || (/\bAnswer:\s*_+\s*$/.test(task) ? [null, String(++unnumbered), task.replace(/\s*Answer:\s*_+\s*$/, "")] : null)
        || (/_{4,}/.test(task) && /\?|\bwrite\b|\bname\b|\bgive\b/i.test(task) ? [null, String(++unnumbered), task] : null);
      if (!match) return;
      const number = Number(match[1]);
      let prompt = tidy(match[2]).replace(/\s*_{4,}.*$/, "").replace(/\s*Answer:\s*$/i, "");
      // The answer options sit on the line below the question ("tablet ball
      // washing machine spoon", "YES NO"), so a learner reading only the
      // question would have nothing to choose between. Pull that line in.
      const next = merged[index + 1] || "";
      const optionsLine = next && !/^\d{1,2}\s*[.)]/.test(next) && !/^_+$/.test(next) && next.length < 90 ? next : "";
      const isTrueFalse = /True\s*\/\s*False|^\s*YES\s+NO\s*$/i.test(`${prompt} ${optionsLine}`);
      const asksToChoose = /circle one|circle the|tick one|choose one/i.test(prompt);
      prompt = tidy(prompt.replace(/\s*(?:Circle|Tick|Choose)\s+one\.?$/i, ""));
      if (prompt.length < 8) return;
      const fullPrompt = optionsLine && asksToChoose ? `${prompt} (${optionsLine})` : prompt;
      // Every word of the key line's restatement has to appear in the question
      // for it to be that question's answer — a looser test binds "How many
      // liked apple?" to the mango question.
      const promptWords = new Set(tokens(fullPrompt));
      const echoIndex = echoes.findIndex((echo) => echo && echo.head.every((word) => promptWords.has(word)));
      if (echoIndex >= 0) echoUsed.add(echoIndex);
      const answer = keyByNumber.get(number)
        || (echoIndex >= 0 ? echoes[echoIndex].answer : "")
        || keyOrdinal[items.length]
        || "";
      items.push({
        id: `p${String(items.length + 1).padStart(2, "0")}`,
        level: items.length < 2 ? "Warm-up" : items.length < 5 ? "Core" : "Challenge",
        prompt: fullPrompt,
        answer,
        hint: miniHint,
      });
      if (!answer) return;
      if (isTrueFalse) {
        const yesNo = /^\s*YES\s+NO\s*$/i.test(optionsLine);
        const positive = /^(yes|true)\b/i.test(answer);
        mcqs.push({
          question: tidy(prompt.replace(/\s*True\s*\/\s*False\s*$/i, "")),
          options: yesNo ? ["YES", "NO"] : ["True", "False"],
          answer: yesNo ? (positive ? "YES" : "NO") : (positive ? "True" : "False"),
          explanation: answer,
        });
        return;
      }
      // A word-choice question: the options line holds two to four short
      // answers, and the key names one of them.
      if (!optionsLine || !asksToChoose) return;
      const options = optionsLine.split(/\s{2,}|\s*\/\s*|\s*,\s*/).map(tidy).filter((value) => value.length > 1);
      if (options.length < 2 || options.length > 4) return;
      const chosen = options.find((option) => new RegExp(`\\b${option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(answer));
      if (chosen) mcqs.push({ question: prompt, options, answer: chosen, explanation: answer });
    });

    // Answer-alone prose lines carry nothing that names their question, so the
    // only safe binding is position — and position is only trustworthy when
    // every line pairs with exactly one still-unanswered item. Anything else
    // would be a guess, and a wrong answer key is worse than none.
    const unanswered = items.filter((item) => !item.answer);
    const spare = proseRun.filter((_, index) => !echoUsed.has(index));
    if (unanswered.length && spare.length === unanswered.length) {
      unanswered.forEach((item, index) => { item.answer = spare[index]; });
    }
    for (const item of items) {
      if (!item.answer) item.answer = "Say your answer out loud in a full sentence, then check it against the concept explanations for this unit.";
    }
    return { items, mcqs };
  }

  // ---- shared assembly ---------------------------------------------------
  function assessmentData(mcqs, terms, unitNo, outcomes) {
    const questions = uniqueBy(mcqs, (mcq) => mcq.question.toLowerCase()).slice(0, 12).map((mcq, index) => ({
      id: `q${String(index + 1).padStart(2, "0")}`,
      type: index < 4 ? "Concept" : index < 8 ? "Application" : "Reasoning",
      outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`,
      difficulty: index < 4 ? "Basic" : index < 9 ? "Core" : "Challenge",
      question: mcq.question,
      options: [...new Set(mcq.options)].slice(0, 4),
      answer: mcq.answer,
      hint: `Use the Unit ${unitNo} Computing Words reference.`,
      explanation: mcq.explanation,
    }));
    const pool = terms.length >= 4 ? terms : [
      ["algorithm", "A precise list of steps that solves a problem"],
      ["program", "An algorithm written in a language a computer can run"],
      ["debug", "Find and fix the mistakes in a program"],
      ["input", "Data you give to a computer"],
      ["output", "What the computer gives back"],
    ];
    const seen = new Set(questions.map((question) => question.question));
    let cursor = questions.length;
    let attempts = 0;
    while (questions.length < 12 && attempts < 80) {
      attempts += 1;
      const entry = pool[cursor % pool.length];
      const reverse = cursor >= Math.min(pool.length, 6);
      const answer = reverse ? entry[0] : entry[1];
      const distractors = [];
      for (let offset = 1; offset < pool.length && distractors.length < 3; offset += 1) {
        const candidate = reverse ? pool[(cursor + offset) % pool.length][0] : pool[(cursor + offset) % pool.length][1];
        if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
      }
      const options = [answer, ...distractors];
      while (options.length < 4) options.push(reverse ? "None of these words" : "None of these meanings");
      const text = reverse ? `Which computing word matches this meaning: ${entry[1]}?` : `What does “${entry[0]}” mean in computing?`;
      cursor += 1;
      if (seen.has(text)) continue;
      seen.add(text);
      const index = questions.length;
      questions.push({
        id: `q${String(index + 1).padStart(2, "0")}`,
        type: index < 4 ? "Concept" : index < 8 ? "Application" : "Reasoning",
        outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`,
        difficulty: index < 4 ? "Basic" : index < 9 ? "Core" : "Challenge",
        question: text,
        options: [...new Set(options)].slice(0, 4),
        answer,
        hint: `Use the Unit ${unitNo} Computing Words reference.`,
        explanation: `${capitalise(entry[0])} means ${entry[1].charAt(0).toLowerCase()}${entry[1].slice(1)}.`,
      });
    }
    return { passPercent: 80, questions };
  }

  function gameData(assessment, terms, unitNo) {
    const names = ["Quick Match", "Concept Quest", "Debug Detective", "Algorithm Runner", "Vocabulary Vault", "Challenge Cards", "Think Fast", "Explain It", "Real-Life Round", "Spot the Bug", "Mastery Mix", "Unit Champion"];
    const icons = ["?", "★", "◫", "→", "Σ", "◇", "⚡", "☁", "⌂", "!", "≡", "T"];
    const skillFor = (index) => terms[index % Math.max(1, terms.length)]?.[0] || `Unit ${unitNo} skill`;
    return names.map((name, index) => ({
      id: `u${unitNo}-game-${index + 1}`,
      icon: icons[index],
      skill: skillFor(index),
      title: `${name}: ${skillFor(index)}`,
      description: `Practise ${String(skillFor(index)).toLowerCase()} through four short challenges.`,
      type: "choice",
      rounds: Array.from({ length: 4 }, (_, round) => {
        const question = assessment.questions[(index + round * 3) % assessment.questions.length];
        return { prompt: question.question, choices: question.options, answer: question.answer, clue: question.hint, explanation: question.explanation };
      }),
    }));
  }

  const unitCount = source.units.length;
  const perTerm = Math.ceil(unitCount / 3);
  const termOf = (position) => Math.min(3, Math.floor(position / perTerm) + 1);

  // Free tools named across the Computing books, with the setup a learner
  // working alone actually needs. Matched against the unit's own text so a
  // unit only advertises the tools it uses.
  const TOOLS = [
    { match: /scratchjr/i, name: "ScratchJr", url: "jrscratch.org (tablet app: ScratchJr)", steps: ["Open ScratchJr on a tablet.", "Tap the house, then tap the plus to start a new project.", "Drag the coloured picture blocks together to make your character move.", "Tap the green flag to run it."], note: "Made for ages 5-7. No reading needed and no account to create." },
    { match: /\bscratch\b|scratch\.mit\.edu/i, name: "Scratch", url: "scratch.mit.edu", steps: ["Go to scratch.mit.edu and click Create.", "Drag blocks from the palette on the left into the code area.", "Make variables in the orange Variables section.", "Click the green flag to run and the red circle to stop."], note: "Runs in a web browser. Free, with nothing to download." },
    { match: /micro:?bit|makecode/i, name: "micro:bit simulator", url: "makecode.microbit.org (blocks) or python.microbit.org (Python)", steps: ["Open makecode.microbit.org for blocks, or python.microbit.org for Python.", "Write your code in the editor.", "The simulator micro:bit on the left runs it straight away.", "Click the on-screen A and B buttons, and use the shake control, to test your inputs."], note: "You do not need to own a real micro:bit — the simulator does everything." },
    { match: /\bpython\b/i, name: "Python", url: "python.microbit.org or any Python editor", steps: ["Open the editor and start a new file.", "Type your program one line at a time.", "Run it and read any error message from the bottom up.", "Fix one error at a time, then run it again."], note: "Python is a text language: spelling and indentation both matter." },
    { match: /spreadsheet|google sheets|excel/i, name: "A free spreadsheet", url: "Google Sheets, or LibreOffice Calc", steps: ["Open a new blank spreadsheet.", "Put your field names in row 1, one per column.", "Type one record per row underneath.", "Use Insert → Chart to turn your data into a graph."], note: "Any free spreadsheet works — the ideas are the same in all of them." },
    { match: /\bdatabase\b/i, name: "A simple database", url: "A spreadsheet in database layout, or LibreOffice Base", steps: ["Give every field a clear name and one kind of data.", "Enter one record per row.", "Sort on a field to put records in order.", "Filter or search to find the records that match a condition."], note: "A spreadsheet laid out with fields and records works as a database for this unit." },
  ];

  function toolkitFor(text) {
    return TOOLS.filter((tool) => tool.match.test(text)).map(({ match, ...tool }) => tool);
  }

  const ESAFETY_RULES = [
    { match: /personal information|private|password|e-?safety|online safety|stranger|share online|keep safe online/i, title: "Keep personal information private", text: "Your full name, address, school, phone number, birthday and passwords are personal information. Never type them into a game, an app or a website, and never send them to someone you only know online." },
    { match: /internet|online|website|search|email|message|chat|social/i, title: "Check before you trust", text: "Anyone can put anything on the internet, so not everything you read is true. Check an important fact on a second, different website, and ask an adult you trust if you are not sure." },
    { match: /internet|online|website|search|email|message|chat|social|game|upload|share/i, title: "Tell someone if something worries you", text: "If anything online upsets you, or someone asks you for personal information or to keep a secret, stop, leave the page and tell an adult you trust straight away. It is never your fault." },
    { match: /copy|image|picture|photo|music|download|creator|own(?:er)?ship/i, title: "Respect other people's work", text: "Pictures, music and writing belong to whoever made them. Use work that is free to use, and say where you got it. Your own work belongs to you — put your name on it." },
  ];

  function esafetyFor(text) {
    return uniqueBy(ESAFETY_RULES.filter((rule) => rule.match.test(text)), (rule) => rule.title)
      .map(({ match, ...rule }) => rule);
  }

  // ---- one unit ----------------------------------------------------------
  function buildUnit(unitMeta, position) {
    const unitNo = unitMeta.unit;
    const term = termOf(position);
    const lesson = docFor(unitNo, "Lesson");
    const activitiesDoc = docFor(unitNo, "Activities");
    const practiceDoc = docFor(unitNo, "Practice");
    const referenceDoc = docFor(unitNo, "Reference");
    const title = unitMeta.title;
    const isGuide = audience === "teacher-guide";
    const allText = [lesson, activitiesDoc, practiceDoc, referenceDoc]
      .flatMap((doc) => doc.blocks.map((block) => block.text)).join(" ");

    const outcomes = outcomeList(lesson);

    // ---- concepts --------------------------------------------------------
    const lessonCallouts = callouts(lesson);
    const referenceCallouts = callouts(referenceDoc);

    let concepts;
    if (isGuide) {
      concepts = sessionConcepts(lesson).map((session, index) => ({
        id: `concept-${index + 1}-${slug(session.title) || index + 1}`,
        title: session.title,
        explanation: session.explanation,
        // Never fall back to the title: a card that shows its own heading back
        // as the worked example teaches nothing.
        // No fallback to the session's Activity line: that line tells an
        // adult which worksheet to hand out, which is neither an example nor
        // something a learner sitting alone can act on.
        example: session.example || generatedExample(session.title),
        checkYourself: session.checkYourself || "",
      }));
    } else {
      concepts = markerConcepts(lesson).map((concept, index) => ({
        id: `concept-${index + 1}-${slug(concept.title) || index + 1}`,
        title: concept.title,
        explanation: concept.explanation,
        example: concept.example,
      }));
    }
    // Never ship a concept card that teaches nothing.
    const substantial = concepts.filter((concept) => concept.explanation.length >= 200);
    if (substantial.length >= 3) concepts = substantial;
    // Two concepts with the same title on one screen read as a duplicated
    // module; the cap is generous because the Stage 5-7 units genuinely run to
    // a dozen taught ideas and truncating them would lose real teaching.
    concepts = uniqueBy(concepts, (concept) => concept.title.toLowerCase())
      .slice(0, 14)
      .map((concept, index) => ({ ...concept, id: `concept-${index + 1}-${slug(concept.title) || index + 1}` }));

    // ---- reference -------------------------------------------------------
    let termRows = dropHeaderRows(tableRows(referenceDoc, /keyword glossary|glossary|key (?:words|terms)/i));
    if (!termRows.length) termRows = dropHeaderRows(tableRows(lesson, /key (?:words|terms)|glossary/i));
    // dropHeaderRows only removes a row when *every* cell is a header word, so
    // "Word | What it means (say this) | Example" survived and shipped as a
    // glossary entry whose term is literally "Word". The meaning column gives
    // it away: a real definition never describes the column.
    const COLUMN_LABEL = /^(word|term|keyword|command|output device|input device|block|name)$/i;
    const COLUMN_MEANING = /^(what it (means|does)|meaning|kid-?friendly meaning|child-?friendly meaning|what it means \(.*\)|its (name|job|meaning)|definition|description)$/i;
    const terms = uniqueBy(
      termRows
        .filter((row) => row[0] && row[1] && row[0].length <= 60 && row[1].length >= 8)
        .filter((row) => !(COLUMN_LABEL.test(tidy(row[0])) && COLUMN_MEANING.test(tidy(row[1]))))
        .map((row) => [tidy(row[0]), tidy(row[1]), tidy(row[2] || "")]),
      (row) => row[0].toLowerCase(),
    ).slice(0, 24);

    const vocabulary = terms.map(([term, meaning, example]) => ({
      term,
      meaning,
      example,
      letter: (term[0] || "?").toUpperCase(),
    }));

    let commonMistakes = lessonCallouts.misconception
      .map((callout) => [tidy(callout.title || callout.body[0]), tidy(callout.body.join(" "))])
      .filter(([wrong, right]) => wrong && right && wrong !== right);
    if (!commonMistakes.length) commonMistakes = dropHeaderRows(tableRows(lesson, /common misconceptions?/i)).map((row) => [row[0], row.slice(1).join(" ")]);
    if (!commonMistakes.length) {
      // The Stage 1-4 guides write this section as one run of prose in which
      // each misconception is quoted and the correction follows it: «"Only the
      // big machine on a desk is a computer." Phones and tablets are computers
      // too.» Splitting on the quotes recovers the pairs; treating the run as
      // one block produced a single card whose heading was a fragment of the
      // section title.
      const run = sectionBlocks(lesson, /common misconceptions?/i)
        .map((block) => tidy(block.text))
        .filter((text) => text.length > 20)
        .join(" ");
      const pairs = [...run.matchAll(/[“"]([^“”"]{8,160})[”"]\s*([^“"]{15,400}?)(?=\s*[“"]|$)/g)]
        .map((match) => [tidy(match[1]), tidy(match[2])])
        .filter(([wrong, right]) => wrong && right);
      if (pairs.length) commonMistakes = pairs;
      else {
        commonMistakes = sectionBlocks(lesson, /common misconceptions?/i)
          .map((block) => tidy(block.text))
          .filter((text) => text.length > 20)
          .map((text) => {
            const match = /^(.*?)(?:\s*[-–—:]\s*|\bActually\b|\bIn fact\b|\bThe truth\b)\s*(.+)$/i.exec(text);
            return match && match[1].length > 8 && match[2].length > 8 ? [tidy(match[1]), tidy(match[2])] : null;
          })
          .filter(Boolean);
      }
    }
    commonMistakes = commonMistakes
      .map(([wrong, right]) => [tidy(wrong), polish(learnerVoice(right, { guide: isGuide }) || right)])
      .filter(([wrong, right]) => wrong.length > 8 && right.length > 12);
    // The Stage 5-7 books do not carry a "Common Misconceptions" section: the
    // same material is their Common Errors table, which the debugging reader
    // below parses. Rather than leave the Quick Reference card empty, restate
    // those entries here — a symptom and what to do about it is exactly what a
    // "common mistake" card is for. Filled in after `debugging` is built.
    commonMistakes = uniqueBy(commonMistakes, (pair) => pair[0].toLowerCase()).slice(0, 6);

    // "Remember!" boxes are the unit's revision card in Stages 5-7. The books
    // put the box title on the marker line and the idea in the paragraph
    // beneath it, which the callout reader already pairs up.
    let rules = [...referenceCallouts.remember, ...lessonCallouts.remember]
      .map((callout) => ({
        title: tidy(callout.title || "Remember") || "Remember",
        text: tidy(callout.body.join(" ")),
      }))
      .filter((rule) => rule.text.length > 25);
    if (!rules.length) {
      rules = concepts.map((concept) => {
        const opening = String(concept.explanation).split("\n\n")[0];
        const first = (opening.match(/^.*?[.!?](?=\s|$)/) || [opening])[0];
        return { title: concept.title, text: tidy(first) };
      }).filter((rule) => rule.text.length > 20);
    }
    rules = uniqueBy(rules, (rule) => `${rule.title}|${rule.text}`.toLowerCase()).slice(0, 8);

    const reference = { rules, terms: terms.map(([term, meaning]) => [term, meaning]), vocabulary, commonMistakes, connections: [] };

    // ---- debugging -------------------------------------------------------
    const errorPattern = /common (?:errors?|mistakes|bugs)|debugging|what went wrong|how to (?:debug|fix)/i;
    let debugging = [
      ...dropHeaderRows(tableRows(referenceDoc, errorPattern, { minCols: 3 })),
      ...dropHeaderRows(tableRows(lesson, errorPattern, { minCols: 3 })),
    ]
      .filter((row) => row.length >= 3)
      .map((row) => ({ symptom: tidy(row[0]), cause: tidy(row[1]), fix: tidy(row[2]) }));
    if (!debugging.length) {
      // Several books write the same table as prose: a symptom line followed by
      // the cause and the fix in one paragraph.
      debugging = sectionBlocks(lesson, errorPattern)
        .map((block) => tidy(block.text))
        .filter((text) => text.length > 40)
        .map((text) => {
          const match = /^(.{10,90}?)\s*[-–—:]\s*(.+)$/.exec(text);
          if (!match) return null;
          const rest = match[2];
          // \b after the marker: without it "run it again — Fixed!" split
          // inside the word and the card's fix read "ed! Celebrate: …".
          const split = /^(.*?)(?:\s+(?:Fix|To fix (?:it|this)|Fix it by|The fix is)\b\s*[:—–-]?\s*)(.+)$/i.exec(rest);
          return {
            symptom: tidy(match[1]),
            cause: tidy(split ? split[1] : rest),
            fix: tidy(split ? split[2] : "Re-read the concept card for this idea, then change one thing at a time until the behaviour matches what you expected."),
          };
        })
        .filter(Boolean);
    }
    if (!debugging.length) {
      debugging = commonMistakes.map(([wrong, right]) => ({
        symptom: tidy(wrong),
        cause: "A common misunderstanding about this idea.",
        fix: tidy(right),
      }));
    }
    // Generic cards, used when a unit's source carries no usable error table.
    // Applied after the filters below as well: a unit whose every source card
    // turns out to be a section label filters down to nothing, and Debug It is
    // a section the app renders unconditionally.
    const GENERIC_DEBUGGING = [
      { symptom: "Your program runs but does the wrong thing.", cause: "The instructions are in the wrong order, or one is missing.", fix: "Read your steps out loud one at a time and act them out. The first step that does not match what you wanted is the bug." },
      { symptom: "Nothing happens when you run it.", cause: "There is no trigger, or the blocks are not joined together.", fix: "Check that your first block is a start block and that every block below it is snapped on." },
      { symptom: "It works once, then stops.", cause: "The instructions need to repeat.", fix: "Put the steps that should happen again inside a repeat or forever loop." },
    ];
    if (!debugging.length && concepts.length) debugging = GENERIC_DEBUGGING.map((item) => ({ ...item }));
    // Header rows survive dropHeaderRows when only some of their cells are
    // header words ("Error | What it means | How to fix it"), and they surface
    // as a card headed "Error" that describes nothing.
    // Column labels are header words in any order and may be slashed together
    // ("Error message / symptom"), so match on the words a row is made of
    // rather than the whole cell. A row whose symptom, cause and fix are all
    // header words is the table's heading, and it renders as a card titled
    // "Error message / symptom" that describes nothing.
    const HEADER_WORDS = /^(error|errors|message|symptom|problem|issue|bug|bugs|what|you|see|went|wrong|the|cause|reason|fix|it|how|to|likely|meaning|means|means?|solution|and|or)$/i;
    const isHeaderText = (value) => {
      const words = String(value || "").split(/[\s/|,–—-]+/).filter(Boolean);
      return words.length > 0 && words.length <= 5 && words.every((word) => HEADER_WORDS.test(word));
    };
    // A debug card has to describe a symptom the learner can recognise on
    // their own screen. The prose fallback sometimes lifts a run of teacher
    // narration instead ("Symptom: Tell the class", "Now teach the work"),
    // which is a lesson instruction, not a bug.
    // Whole units are structured as "What to teach / How to explain it simply
    // / Activity / What to look for", and the prose reader can take one of
    // those labels as the symptom — a card headed "What to teach" describes no
    // bug at all.
    const SECTION_LABEL = /^(what to teach|how to explain( it simply)?|what to look for|activity\b|teacher tip|home connection|lesson flow|session \d|materials needed|key words|learning objectives|assessment|practice\b|answer key|part [a-e]\b|task \d)/i;
    const isDebugProse = (item) => {
      const all = `${item.symptom} ${item.cause} ${item.fix}`;
      return ADULT_ADDRESSED.test(all) || CLASSROOM.test(all) || DIRECTIVE_RESIDUE.test(all)
        || SECTION_LABEL.test(item.symptom.trim())
        || /^(tell|show|ask|now teach|run it|guide|celebrate)\b/i.test(item.symptom.trim());
    };
    debugging = uniqueBy(debugging, (item) => item.symptom.toLowerCase())
      .filter((item) => item.symptom && !isHeaderText(item.symptom)
        && !(isHeaderText(item.cause) && isHeaderText(item.fix))
        && !isDebugProse(item))
      .slice(0, 8);
    if (!debugging.length) debugging = GENERIC_DEBUGGING.map((item) => ({ ...item }));
    if (!reference.commonMistakes.length) {
      reference.commonMistakes = debugging.slice(0, 6).map((bug) => [bug.symptom, `${bug.cause} ${bug.fix}`.trim()]);
    }

    // ---- code examples ---------------------------------------------------
    const languageOf = (text) => {
      if (/display\.|from microbit|import |def |print\(|input\(/i.test(text)) return "Python (micro:bit)";
      if (/basic\.|input\.on|led\.|music\./i.test(text)) return "MakeCode (micro:bit)";
      if (/^(IF|THEN|ELSE|REPEAT|WHILE|INPUT|OUTPUT|PRINT|END)\b/.test(text)) return "Pseudocode";
      return "Scratch blocks";
    };
    // Untitled listings fall back to their section name, and a section can
    // hold several of them — so the fallback is numbered within its section.
    // Without that, two cards on the same screen carry the identical heading
    // and read as a duplicated module.
    const sectionCounts = new Map();
    const codeExamples = uniqueBy(
      [...codeRuns(lesson), ...codeRuns(referenceDoc)].map((run, index) => {
        const body = run.lines.join("\n");
        const named = tidy(run.title);
        const section = tidy(run.section);
        const seen = (sectionCounts.get(section) || 0) + 1;
        if (!named) sectionCounts.set(section, seen);
        return {
          id: `code-${index + 1}`,
          title: named || `${section} — listing ${seen}`,
          language: languageOf(body),
          intro: named ? "" : `From ${section}.`,
          lines: run.lines,
          explanation: "Read it one line at a time and say out loud what each line does before you type it in.",
        };
      }),
      (item) => item.lines.join("|"),
    ).slice(0, 10).map((item, index) => ({ ...item, id: `code-${index + 1}` }));
    // Two listings can legitimately carry the same caption in the source (the
    // same block shown for two sprites). On screen that reads as the same card
    // twice, so the repeats are numbered.
    const titleSeen = new Map();
    for (const example of codeExamples) {
      const key = example.title.toLowerCase();
      const n = (titleSeen.get(key) || 0) + 1;
      titleSeen.set(key, n);
      if (n > 1) example.title = `${example.title} (${n})`;
    }

    // ---- practice --------------------------------------------------------
    const fromSections = practiceFromSections(practiceDoc, terms.map((row) => row[0]));
    const fromMini = isGuide
      ? practiceFromMiniProject(practiceDoc, lesson, terms.map((row) => row[0]))
      : { items: [], mcqs: [] };
    let practice = uniqueBy([...fromSections.items, ...fromMini.items], (item) => item.prompt.toLowerCase());
    let mcqs = [...fromSections.mcqs, ...fromMini.mcqs];

    // The end-of-unit quiz in Stages 5-7 is its own numbered list with a
    // matching key; it is the best assessment material in the pack.
    const quizTasks = practiceDoc.blocks
      .filter((block) => /end[- ]of[- ]unit quiz/i.test(block.section) && !/answer key/i.test(block.section) && block.content_kind !== "Heading")
      .map((block) => tidy(block.text));
    const quizKeys = practiceDoc.blocks
      .filter((block) => /answer key\s*[-–—]?\s*end[- ]of[- ]unit quiz/i.test(block.section) && block.content_kind !== "Heading")
      .map((block) => tidy(block.text));
    const quizKeyByNumber = new Map();
    for (const key of quizKeys) {
      const match = /^(\d{1,2})\s*[.):]\s*(.+)$/.exec(key);
      if (match) quizKeyByNumber.set(Number(match[1]), tidy(match[2]));
    }
    for (const task of quizTasks) {
      const match = /^(\d{1,2})\s*[.):]\s*(.+)$/.exec(task);
      if (!match) continue;
      const answer = quizKeyByNumber.get(Number(match[1]));
      if (!answer) continue;
      practice.push({
        id: `p${String(practice.length + 1).padStart(2, "0")}`,
        level: "Extension",
        prompt: tidy(match[2]),
        answer,
        hint: "This is an end-of-unit question: bring together more than one idea from the unit in your answer.",
      });
    }
    practice = uniqueBy(practice, (item) => item.prompt.toLowerCase())
      .map((item, index) => ({ ...item, id: `p${String(index + 1).padStart(2, "0")}` }));

    // ---- activities ------------------------------------------------------
    const tasks = taskList(activitiesDoc, isGuide);
    const projectParts = taskList(practiceDoc, isGuide);
    let activities = [...tasks, ...projectParts].map((task) => ({
      title: task.title,
      materials: isGuide
        ? "The printed activity page (or a sheet of paper), a pencil and colours"
        : "A computer or tablet with a web browser, plus paper and a pencil for planning",
      steps: [
        ...task.steps,
        ...task.pairs.map((pair) => `Match: ${pair[0]} → ${pair.slice(1).join(" / ")}`),
      ].filter(Boolean).slice(0, 6),
    })).filter((activity) => activity.steps.length);

    // Stages 5-7 name their activities under each subunit heading in the
    // Activities & Projects book rather than numbering them as Tasks.
    if (!isGuide) {
      const named = [];
      activitiesDoc.blocks.forEach((block, index) => {
        const text = tidy(block.text);
        if (block.content_kind === "Heading" || text.length > 70 || /[.?!]$/.test(text)) return;
        if (!/^[A-Z]/.test(text) || text.split(/\s+/).length > 9) return;
        const following = activitiesDoc.blocks.slice(index + 1, index + 9)
          .map((item) => tidy(item.text))
          .filter((value) => value.length > 15 && !isCodeLine(value));
        if (following.length >= 3) named.push({ title: capitalise(text), materials: "A computer or tablet with a web browser, plus paper and a pencil for planning", steps: following.slice(0, 6) });
      });
      activities = [...activities, ...named];
    }
    activities = uniqueBy(activities, (activity) => activity.title.toLowerCase()).slice(0, 8);

    // Every unit shows at least four things to do. Where the source has fewer,
    // build concept-grounded activities a learner can do alone.
    const doIdeas = [
      { verb: "Explain", tail: "Say it out loud as if you were teaching it, then write your explanation in two sentences." },
      { verb: "Spot", tail: "Find one real example of it around your home, at school or on a device you use." },
      { verb: "Build", tail: "Make a small version of it — on the computer if you have one, or on paper if you do not." },
      { verb: "Test", tail: "Try it, change one thing, run it again and write down what changed." },
    ];
    let ideaCursor = 0;
    while (activities.length < 4 && concepts.length) {
      const concept = concepts[activities.length % concepts.length];
      const idea = doIdeas[ideaCursor % doIdeas.length];
      ideaCursor += 1;
      activities.push({
        title: `${idea.verb}: ${concept.title}`,
        materials: isGuide ? "Paper, a pencil and anything around you that you can point at" : "Paper and a pencil, plus a computer or tablet if you have one",
        steps: [
          `Re-read the concept card for ${concept.title.toLowerCase()}.`,
          idea.tail,
          `Use these words in your answer: ${terms.slice(0, 3).map((row) => row[0]).join(", ") || "the key words from this unit"}.`,
          "Check your work against the concept explanation. If it does not match, find the sentence that shows why and try again.",
        ],
      });
    }

    // ---- project ---------------------------------------------------------
    const projectTitleBlock = [...practiceDoc.blocks, ...activitiesDoc.blocks]
      .map((block) => tidy(block.text))
      .find((text) => /^(End[- ]of[- ]Unit Project|Mini[- ]Project|My .+ (Scrapbook|Project))\b/i.test(text));
    const criteria = [...activitiesDoc.blocks, ...practiceDoc.blocks]
      .filter((block) => /success criteria|did i do it|checklist/i.test(block.section) && block.content_kind !== "Heading")
      .map((block) => tidy(block.text).replace(/^\[\s*\]\s*/, ""))
      .filter((text) => text.length > 10 && !ADULT_ADDRESSED.test(text));
    const projectSteps = [...activitiesDoc.blocks, ...practiceDoc.blocks]
      .filter((block) => /end[- ]of[- ]unit project|mini[- ]project/i.test(block.section) && block.content_kind !== "Heading")
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 20 && !isFrame(text) && !ADULT_ADDRESSED.test(text));
    const project = {
      title: tidy(projectTitleBlock || `Unit ${unitNo} Project: ${title}`).replace(/^End[- ]of[- ]Unit Project\s*[:–—-]\s*/i, "") || `Unit ${unitNo} Project`,
      brief: sentence(projectSteps[0] || `Bring together everything from ${title} into one finished piece of work you can show and explain.`, 420),
      // The brief is the opening paragraph, so it must not also appear as the
      // first step — the card would show the same paragraph twice, once under
      // "Your project" and again under "How to build it".
      steps: uniqueBy(projectSteps.slice(1, 9).map((text) => tidy(text)), (text) => text.toLowerCase()),
      successCriteria: uniqueBy(criteria, (text) => text.toLowerCase()).slice(0, 8),
    };
    if (project.steps.length < 3) {
      // One paragraph of brief is not something a learner can follow alone.
      // Keep whatever the source gave and add the build loop this subject
      // teaches in every unit, so the card always describes a way to finish.
      project.steps = uniqueBy([
        ...project.steps,
        `Plan first: write down what your ${title.toLowerCase()} project has to do before you build anything.`,
        "Build the smallest version that does one of those things, and run it.",
        "Add one feature at a time, testing after each one.",
        "When something breaks, change one thing, run it again, and note what fixed it.",
        "Check your work against every success criterion below before you call it finished.",
      ], (text) => text.toLowerCase());
    }
    if (!project.steps.length) {
      project.steps = [
        `Plan it first: write down what your ${title.toLowerCase()} project must do before you build anything.`,
        "Build the smallest working version, then test it.",
        "Fix one problem at a time and test again after each fix.",
        "Show it to someone (or record yourself) and explain the choices you made.",
      ];
    }
    if (!project.successCriteria.length) {
      project.successCriteria = concepts.slice(0, 5).map((concept) => `My project shows that I understand ${concept.title.toLowerCase()}.`);
    }

    // ---- overview --------------------------------------------------------
    // The overview is the first thing a learner reads, so it takes the unit's
    // whole introduction rather than its first surviving paragraph — several
    // units open with a sentence of framing and put the actual "here is what
    // this unit is about" in the paragraph after it.
    const overviewCandidates = sectionBlocks(lesson, /unit overview|about this unit|welcome to unit/i)
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 120
        && !/^(how (?:the|this)|this (?:teacher|guide|booklet)|the (?:activity sheet|mini-project)|keep this booklet)/i.test(text));
    // A paragraph that lost most of its sentences to the converter was a
    // briefing for the adult with one stray learner-safe line in it. Shipping
    // the survivor as a paragraph of the overview reads as a non-sequitur, so
    // it is dropped rather than patched.
    let overview = paragraphs(overviewCandidates
      .slice(0, 3)
      .map((text) => ({ source: text, converted: learnerVoice(text, { guide: isGuide }) }))
      .filter((entry) => entry.converted.length > 80 && entry.converted.length >= entry.source.length * 0.55)
      .map((entry) => entry.converted));
    // No fallback to the raw candidate: on the Stage 1-4 guides the raw text is
    // a briefing for the adult ("The children are about six years old… you read
    // every word aloud"), and shipping it puts teacher instructions on the
    // first screen the learner sees. A composed overview is worse prose but it
    // is addressed to the right person.
    if (!overview || overview.length < 140) {
      const conceptTitles = concepts.map((concept) => concept.title.toLowerCase());
      overview = `In this unit — ${title} — you will ${conceptTitles.length ? `work through ${conceptTitles.slice(0, -1).join(", ")}${conceptTitles.length > 1 ? " and " : ""}${conceptTitles[conceptTitles.length - 1]}` : "build your computing skills step by step"}. Everything you need is here: explainers to read, examples to copy, things to build, practice with answers, and a project at the end. Every tool used is free and runs in a web browser.`;
    }

    // ---- derived sections ------------------------------------------------
    const outcomeId = (index) => `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`;

    const methods = concepts.map((concept, index) => {
      const steps = (isGuide ? [] : String(concept.explanation).split("\n\n"))
        .filter((paragraph) => paragraph.length > 40)
        .slice(0, 4)
        .map((paragraph) => sentence(paragraph, 220));
      return {
        id: `method-${index + 1}`,
        outcomeId: outcomeId(index),
        difficulty: index < 3 ? "Core" : "Challenge",
        title: `How to work with ${concept.title.toLowerCase()}`,
        example: sentence(concept.example || String(concept.explanation).split("\n\n")[0], 260),
        steps: steps.length >= 3 ? steps : [
          `Read the concept card for ${concept.title.toLowerCase()} and say the main idea in your own words.`,
          "Look at the worked example and copy it exactly, one step at a time.",
          "Change one thing in your copy and predict what will happen before you run it.",
          "Run it. If your prediction was wrong, find the step where your idea and the computer's behaviour part company — that is what you have just learned.",
        ],
      };
    }).slice(0, 8);

    const workedExamples = [];
    for (const item of practice) {
      if (workedExamples.length >= 10) break;
      if (!item.answer || item.answer.length < 25) continue;
      if (/^(work through the task|say your answer)/i.test(item.answer)) continue;
      const index = workedExamples.length;
      // The card shows the title as a heading and the prompt underneath it, so
      // a title cut from the prompt makes the learner read the same sentence
      // twice. Name the example after the idea it exercises instead.
      const topic = concepts[index % Math.max(1, concepts.length)]?.title;
      workedExamples.push({
        id: `we${String(index + 1).padStart(2, "0")}`,
        outcomeId: outcomeId(index),
        difficulty: index < 3 ? "Basic" : index < 7 ? "Intermediate" : "Challenge",
        title: topic ? `Worked example ${index + 1}: ${topic}` : `Worked example ${index + 1}`,
        prompt: item.prompt,
        solution: item.answer,
      });
    }
    let conceptCursor = 0;
    while (workedExamples.length < 6 && conceptCursor < concepts.length) {
      const concept = concepts[conceptCursor];
      conceptCursor += 1;
      const index = workedExamples.length;
      workedExamples.push({
        id: `we${String(index + 1).padStart(2, "0")}`,
        outcomeId: outcomeId(index),
        difficulty: index < 3 ? "Basic" : "Intermediate",
        title: `Worked example ${index + 1}: ${concept.title}`,
        prompt: `Explain in your own words: ${concept.title.replace(/\?$/, "")}.`,
        solution: [concept.explanation, concept.example && concept.example !== concept.title ? `For example: ${concept.example}` : ""].filter(Boolean).join("\n\n"),
      });
    }

    // The three reveal fields on an exploration card must each say something
    // different, or the learner reads the same paragraph three times:
    //   context     — what this exploration is for
    //   answer      — what you should end up with
    //   explanation — the computing idea behind it
    const explorations = activities.slice(0, 6).map((activity, index) => {
      const concept = concepts[index % Math.max(1, concepts.length)];
      const opening = String(concept?.explanation || overview).split("\n\n")[0];
      return {
        id: `explore-${index + 1}`,
        outcomeId: outcomeId(index),
        difficulty: index < 3 ? "Discover" : "Explore",
        title: activity.title,
        // Saying "What you need: …" here repeated the same kit line on three
        // quarters of the cards in the whole subject. Say what this particular
        // activity is for instead; the kit is on the activity card already.
        context: `${activity.title}: work through the steps below and see what happens. This is ${concept?.title ? concept.title.toLowerCase() : title.toLowerCase()} in practice — you need ${activity.materials.charAt(0).toLowerCase()}${activity.materials.slice(1)}.`,
        prompt: activity.steps[0] || `Try ${activity.title.toLowerCase()} and record what happens.`,
        answer: activity.steps.slice(1).join(" ") || "Compare what you built with the worked example, and note any difference.",
        modelType: `model-${index + 1}`,
        hint: activity.steps[1] ? `Start here: ${sentence(activity.steps[1], 150)}` : "Do one step at a time, and check the result before you move on.",
        explanation: concept?.title ? `${concept.title}: ${sentence(opening, 300)}` : sentence(opening, 320),
      };
    });

    const visualModels = concepts.map((concept, index) => ({
      id: `model-${index + 1}`,
      outcomeId: outcomeId(index),
      title: concept.title,
      modelType: `concept-model-${index + 1}`,
      purpose: sentence(String(concept.explanation).split("\n\n")[0], 220),
      defaultNumber: null,
    }));

    const pool = practice.length ? practice : explorations.map((explore, index) => ({ id: `p${index}`, level: "Core", prompt: explore.prompt, answer: explore.answer, hint: explore.hint }));

    const contexts = ["Home", "School", "Market", "Community", "Travel", "Health"];
    const realProblems = pool.filter((item) => item.level === "Challenge" || item.level === "Extension").slice(0, 6)
      .map((item, index) => ({
        id: `rp${String(index + 1).padStart(2, "0")}`,
        outcomeId: outcomeId(index),
        difficulty: index < 3 ? "Core" : "Challenge",
        context: contexts[index % contexts.length],
        prompt: item.prompt,
        answer: item.answer,
        hint: item.hint,
        errorFeedback: `Check your reasoning against this: ${item.answer}`,
      }));
    while (realProblems.length < 4 && pool.length) {
      const item = pool[(realProblems.length + 3) % pool.length];
      const index = realProblems.length;
      realProblems.push({
        id: `rp${String(index + 1).padStart(2, "0")}`,
        outcomeId: outcomeId(index),
        difficulty: "Core",
        context: contexts[index % contexts.length],
        prompt: item.prompt,
        answer: item.answer,
        hint: item.hint,
        errorFeedback: `Check your reasoning against this: ${item.answer}`,
      });
    }

    const reasoningPrompts = pool.filter((item) => item.level === "Core").slice(0, 6).map((item, index) => ({
      id: `reason${String(index + 1).padStart(2, "0")}`,
      outcomeId: outcomeId(index),
      difficulty: index < 3 ? "Core" : "Challenge",
      responseMode: "text",
      prompt: item.prompt,
      keyIdeas: terms.slice(index, index + 3).map((row) => row[0]),
      modelAnswer: item.answer,
    }));
    while (reasoningPrompts.length < 4 && concepts.length) {
      const concept = concepts[reasoningPrompts.length % concepts.length];
      const index = reasoningPrompts.length;
      reasoningPrompts.push({
        id: `reason${String(index + 1).padStart(2, "0")}`,
        outcomeId: outcomeId(index),
        difficulty: "Core",
        responseMode: "text",
        prompt: `Explain the key idea in ${concept.title.toLowerCase()}, and give one example of your own.`,
        keyIdeas: terms.slice(0, 3).map((row) => row[0]),
        modelAnswer: concept.explanation,
      });
    }

    const assessment = assessmentData(mcqs, reference.terms, unitNo, outcomes);
    const finalOutcomes = outcomes.length ? outcomes : concepts.map((concept) => `Explain and use ${concept.title.toLowerCase()}.`);

    // These courses are self-paced with a 24/7 AI tutor, and the books write
    // the questions to ask it directly into the lesson ("Explain bandwidth to
    // me using an example from my daily life."). They are the single best
    // scaffold a learner alone at a screen has, so they get their own section
    // rather than being dropped with the rest of the callout.
    const tutorPrompts = uniqueBy(
      [...lessonCallouts.tutor, ...referenceCallouts.tutor]
        .flatMap((callout) => callout.body)
        .map((text) => tidy(text).replace(/^[-–—•]\s*/, "").replace(/^["“](.*)["”]$/, "$1"))
        .filter((text) => text.length > 15 && text.length < 240 && !/^(here are|try asking|ask your ai|use these|copy these)/i.test(text)),
      (text) => text.toLowerCase(),
    ).slice(0, 8);

    // Prefer the book's own safety notes; fall back to the standard rules only
    // for the topics this unit actually touches.
    const sourceSafety = uniqueBy(
      lessonCallouts.safety.map((callout) => ({
        title: tidy(callout.title || "Stay safe online"),
        text: tidy(callout.body.join(" ")),
      })).filter((item) => item.text.length > 40),
      (item) => item.title.toLowerCase(),
    );
    const esafety = (sourceSafety.length ? sourceSafety : esafetyFor(allText)).slice(0, 6);

    return {
      schemaVersion: "Ehel Computing Runtime v1.0",
      generatedAt: new Date().toISOString(),
      stage: { id: stageId, label: stageLabel },
      subject: "Computing",
      term: { id: `t0${term}`, label: `Term ${term}` },
      unit: {
        unitId: unitMeta.unit_id,
        unitNo,
        unitTitle: title,
        unitOverview: overview,
        learningPath: [
          "Preview the goals, key words and the tools you will use",
          "Read the concept explainers and study the code examples",
          "Follow the methods and worked examples",
          "Build the activities, debug your work and play the games",
          "Apply, explain and finish the Unit Project and Challenge",
        ],
        reviewStatus: "Curriculum review required",
      },
      cambridge,
      provenance: {
        contentPackage,
        framework: cambridgeLabel,
        sourceArchive: source.metadata.source_archive,
        sourceAudience: audience,
        sourceDocuments: [lesson, activitiesDoc, practiceDoc, referenceDoc].filter((doc) => doc !== EMPTY_DOC).map((doc) => doc.source_file),
        sourceBlockCount: unitMeta.source_block_count,
        transformation: isGuide
          ? `Structured from the ${cambridgeLabel} Teacher & Parent Guide, Activity Sheet and Mini-Project. Teacher-directed prose was rewritten into learner-facing explainers so the unit teaches with no adult present.`
          : `Structured from the ${cambridgeLabel} Lesson, Activities & Projects, Practice & Quiz and Reference booklets for screen presentation.`,
        reviewStatus: unitMeta.review_status,
      },
      media: { lectureStatus: "Video pending", lectureVideo: null, poster: null },
      outcomes: finalOutcomes,
      toolkit: toolkitFor(allText),
      tutorPrompts,
      concepts,
      codeExamples,
      explorations,
      visualModels,
      methods,
      workedExamples,
      practice: practice.slice(0, 16),
      activities,
      debugging,
      esafety,
      reference,
      fluency: pool.slice(0, 12).map((item, index) => ({
        id: `fl${String(index + 1).padStart(2, "0")}`,
        outcomeId: outcomeId(index),
        difficulty: index < 4 ? "Round 1" : index < 8 ? "Round 2" : "Round 3",
        prompt: item.prompt,
        answer: item.answer,
        hint: item.hint,
        errorFeedback: item.answer,
      })),
      realProblems,
      reasoningPrompts,
      project,
      assessment,
      games: { masteryScore: 3, games: gameData(assessment, reference.terms, unitNo) },
      selfAssessment: finalOutcomes.slice(0, 10).map((outcome) => `I can ${outcome.charAt(0).toLowerCase()}${outcome.slice(1)}`),
    };
  }

  fs.mkdirSync(unitDir, { recursive: true });
  const warnings = [];
  const builtUnits = [];
  source.units.forEach((unitMeta, position) => {
    const runtime = buildUnit(unitMeta, position);
    // Reviewer corrections go on last, over everything the builder derived.
    applyScriptReview(runtime, grade, unitMeta.unit);
    builtUnits.push(runtime);
    for (const key of ["outcomes", "concepts", "practice", "workedExamples", "activities", "methods", "debugging"]) {
      if (!runtime[key] || !runtime[key].length) warnings.push(`grade ${grade} unit ${unitMeta.unit}: empty ${key}`);
    }
    if (runtime.concepts.length < 3) warnings.push(`grade ${grade} unit ${unitMeta.unit}: only ${runtime.concepts.length} concepts`);
    fs.writeFileSync(path.join(unitDir, `unit-${unitMeta.unit}.json`), `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
  });

  // Sample each unit across the difficulty bands rather than taking the first
  // questions, so the stage capstone tests the reasoning the units spent most
  // of their pages teaching.
  const capstoneQuestions = builtUnits.flatMap((unit) => {
    const questions = unit.assessment.questions;
    const picked = [];
    for (const band of ["Basic", "Core", "Challenge"]) {
      const next = questions.find((question) => question.difficulty === band && !picked.includes(question));
      if (next) picked.push(next);
    }
    for (const question of questions) {
      if (picked.length >= 3) break;
      if (!picked.includes(question)) picked.push(question);
    }
    return picked.map((question, index) => ({
      ...question,
      id: `cap-u${String(unit.unit.unitNo).padStart(2, "0")}-q${index + 1}`,
      unitNo: unit.unit.unitNo,
      unitTitle: unit.unit.unitTitle,
    }));
  });

  const manifest = {
    schemaVersion: "Ehel Computing Course Manifest v1.0",
    stage: { id: stageId, label: stageLabel },
    subject: "Computing",
    defaultUnit: source.units[0]?.unit || 1,
    sourcePackage: contentPackage,
    cambridgeFramework: cambridgeLabel,
    sourceAudience: audience,
    packageReviewStatus: "Built v1.0 - self-teaching content pass complete; curriculum review pending",
    units: source.units.map((unit, position) => ({
      number: unit.unit,
      id: unit.unit_id,
      termId: `t0${termOf(position)}`,
      title: builtUnits[position].unit.unitTitle,
      data: `./data/units/unit-${unit.unit}.json`,
      sourceDocumentCount: unit.source_document_count,
      implementationStatus: "Complete runtime package",
      reviewStatus: unit.review_status,
    })),
    finalAssessment: {
      id: `comp-${stageId}-capstone-quiz-v1`,
      title: `${stageLabel} Computing Capstone Quiz`,
      data: "./data/grade-capstone.json",
      placement: `After the ${stageLabel} capstone project`,
      questionCount: capstoneQuestions.length,
      passPercent: 80,
      reviewStatus: "Built v1.0 - curriculum review pending",
    },
  };
  fs.writeFileSync(path.join(gradeDir, "data", "course-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const termUnits = (term) => manifest.units.filter((unit) => unit.termId === `t0${term}`).map((unit) => unit.number);
  const allUnitNumbers = manifest.units.map((unit) => unit.number);
  const orAll = (list) => (list.length ? list : allUnitNumbers);
  const gradeCapstone = {
    schemaVersion: "Ehel Computing Stage Capstone v1.0",
    stage: { id: stageId, label: stageLabel },
    title: `Build a ${stageLabel} Computing Showcase`,
    overview: `Bring together everything from ${stageLabel} Computing into one showcase: a working program, the data behind it, a clear explanation of how it runs, and the safety rules you followed while making it.`,
    project: {
      drivingQuestion: `How can I use the computing I learned in ${stageLabel} to build something that solves a real problem for someone in my community — and explain exactly how it works?`,
      finalProduct: "A working program or digital product, the plan and algorithm behind it, a test-and-debug log, a data display, and a spoken or written explanation of your design decisions.",
      stages: [
        { id: "plan", title: "1. Plan and decompose", units: orAll(termUnits(1)), prompt: `Choose a real problem. Using the ideas from Units ${orAll(termUnits(1)).join(", ")}, break it into smaller parts and write the algorithm before you write any code.`, evidence: "A decomposed problem and a written algorithm or flowchart" },
        { id: "build", title: "2. Build it", units: orAll(termUnits(2)), prompt: `Build your program or product using the tools from Units ${orAll(termUnits(2)).join(", ")}. Build the smallest working version first, then add one feature at a time.`, evidence: "A working program or digital product" },
        { id: "test", title: "3. Test, debug and improve", units: allUnitNumbers, prompt: "Test your work against your success criteria. Keep a log of every bug: what you saw, what caused it, and how you fixed it.", evidence: "A test-and-debug log with at least three entries" },
        { id: "share", title: "4. Share it safely", units: orAll(termUnits(3)), prompt: `Present your showcase. Explain three design decisions, show your data, and say which online-safety rules from Units ${orAll(termUnits(3)).join(", ")} you followed and why.`, evidence: "A spoken, written or recorded explanation covering design, data and safety" },
      ],
      evidenceChecklist: [
        "A decomposed problem with a written algorithm or flowchart",
        "A working program or digital product",
        "A test-and-debug log with at least three fixed bugs",
        "Data collected, organised and displayed",
        "Success criteria, each one ticked off with evidence",
        "An explanation of your design decisions and the safety rules you followed",
      ],
      rubric: [
        { criterion: "Computational thinking", secure: "The problem is decomposed, the algorithm is precise, and the pattern behind it is named." },
        { criterion: "Programming and debugging", secure: "The program runs, meets its criteria, and every bug found is logged with its cause and fix." },
        { criterion: "Data and information", secure: "Data is collected accurately, organised sensibly and displayed so it answers a question." },
        { criterion: "Safe and responsible use", secure: "Personal information is protected, sources are credited, and safety choices are explained." },
      ],
    },
    quiz: { passPercent: 80, questions: capstoneQuestions },
    reviewStatus: "Curriculum review required",
  };
  applyCapstoneReview(gradeCapstone, grade);
  fs.writeFileSync(path.join(gradeDir, "data", "grade-capstone.json"), `${JSON.stringify(gradeCapstone, null, 2)}\n`, "utf8");

  const indexHtml = `<!doctype html>
<html lang="en" data-stage="${grade}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening ${stageLabel} Computing</title></head>
<body><p>Opening the shared Computing course…</p><script type="module" src="../shared/grade-redirect.js"></script></body>
</html>
`;
  fs.writeFileSync(path.join(gradeDir, "index.html"), indexHtml, "utf8");

  console.log(`grade ${grade}: ${manifest.units.length} units, capstone, manifest, index written.`);
  return warnings;
}

const allWarnings = [];
for (const grade of grades) allWarnings.push(...buildGrade(grade));
if (allWarnings.length) {
  console.log(`\nWarnings (${allWarnings.length}):`);
  for (const warning of allWarnings) console.log(`  - ${warning}`);
} else {
  console.log("\nNo empty-section warnings.");
}
if (reviewStats.applied || reviewStats.missed.length) {
  console.log(`\nScript review: ${reviewStats.applied} field(s) applied.`);
}
if (practiceStats.unaligned.length) {
  console.log(`Practice sections whose key run does not line up with its questions (${practiceStats.unaligned.length}) — left unanswered rather than answered wrongly:`);
  for (const note of practiceStats.unaligned) console.log(`  - ${note}`);
}
if (reviewStats.rekeyed.length) {
  console.log(`Review entries re-keyed onto the word they name (${reviewStats.rekeyed.length}) — positional drift, corrected at build time.`);
}
if (reviewStats.stranded.length) {
  console.log(`Review explanations dropped as stranded (${reviewStats.stranded.length}) — they define a word no question in their unit asks about; the built explanation stands.`);
}
if (reviewStats.missed.length) {
  // A review entry with nowhere to land means the source pack moved under the
  // review. Silently dropping it would ship unreviewed prose while the workbook
  // records the row as corrected.
  console.log(`Review entries with no matching item (${reviewStats.missed.length}) — re-run tools/apply-ehel-computing-script-review.py:`);
  for (const miss of reviewStats.missed.slice(0, 20)) console.log(`  - ${miss}`);
  if (reviewStats.missed.length > 20) console.log(`  … and ${reviewStats.missed.length - 20} more`);
}
