// The one definition of what Global Perspectives narrates and what each clip is
// called.
//
// A clip is named cyrb53(button text), so every tool that touches narration has
// to agree on the exact string a Listen button speaks: the generator (what to
// buy), the uploader (where each file belongs in the per-grade deploy tree) and
// the pruner (what nothing can reach). Science shipped three copies of that
// definition once and they drifted, which filed real clips under _unmapped/ and
// served them to nobody. So there is one copy, here.
//
// Consumers: tools/generate-ehel-global-perspectives-audio.js,
// tools/upload-media-to-bunny.js, tools/prune-ehel-course-audio.mjs.
// Held to global-perspectives/shared/course-ui.js by
// tools/check-global-perspectives-audio-coverage.mjs.

const fs = require("fs");
const path = require("path");

// Naming scheme shared with every other subject.
const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");

const CATEGORIES = ["overview", "explainers", "boxes", "words"];

// The exact strings each Listen button narrates — must match course-ui.js
// character for character. A difference of one character means a different
// hash, so the app looks for a file that was never written and silently drops
// to the paid runtime endpoint: money spent on a clip nobody is served.
//
// Sections with no Listen button are absent on purpose: the toolkit cards, the
// activities, the practice items, the quiz and the grown-up's guide are read,
// not heard, and the AI tutor's text does not exist until a learner types.
function textsForUnit(unit, category) {
  switch (category) {
    // renderOverview: voiceButton(unit.unitOverview, "Listen to the overview")
    case "overview":
      return [(unit.unit || {}).unitOverview];

    // renderLesson: voiceButton(explainer.body, "Listen to this part"), and
    // only where there IS a body — an explainer carrying nothing but bullets
    // or a table renders no button, so buying a clip for it would be waste.
    case "explainers":
      return (unit.explainers || []).filter((e) => e.body).map((e) => e.body);

    // box(): voiceButton(lines.join(" ")) — every callout box the page renders,
    // across Big Ideas, Worked Examples, Ask Your AI Tutor, the teacher session
    // and the speaking prompts, plus the boxes nested inside an activity. All
    // six use the same helper, so all six hash the same way.
    //
    // The box's TITLE is not spoken: it sits on screen right above the button,
    // and the script review asked for the repeated heading to come out of the
    // narration. A box with no lines falls back to its title, because otherwise
    // it would have nothing to say.
    case "boxes": {
      const boxes = [
        ...(unit.bigIdeas || []),
        ...(unit.models || []),
        ...(unit.tutorPrompts || []),
        ...(unit.speakingPrompts || []),
        ...(unit.teacherSessions || []),
        ...(unit.reflectionPrompts || []),
        ...(unit.activities || []).flatMap((activity) => activity.boxes || []),
      ];
      return boxes.map((box) => ((box.lines || []).length ? box.lines.join(" ") : box.title));
    }

    // renderWords: voiceButton(word.meaning) — the term is the card's heading,
    // so the clip reads the meaning only.
    case "words":
      return (((unit.reference || {}).vocabulary) || []).map((word) => word.meaning);

    default:
      return [];
  }
}

/** Every clip one grade needs, as a Set of hashes. */
function hashesForGrade(courseRoot, grade, categories = CATEGORIES) {
  const keys = new Set();
  const add = (raw) => {
    const text = clean(raw);
    if (text.length >= MIN_CHARS) keys.add(cyrb53(text));
  };
  const unitDir = path.join(courseRoot, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(unitDir)) return keys;
  for (const file of fs.readdirSync(unitDir).filter((f) => f.endsWith(".json"))) {
    const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
    for (const category of categories) textsForUnit(unit, category).forEach(add);
  }
  return keys;
}

/** Which grades each hash belongs to. A text shared by two grades ships to both. */
function hashGradeMap(courseRoot, categories = CATEGORIES) {
  const map = new Map();
  for (const entry of fs.readdirSync(courseRoot)) {
    const match = entry.match(/^grade-(\d+)$/);
    if (!match) continue;
    const grade = Number(match[1]);
    for (const key of hashesForGrade(courseRoot, grade, categories)) {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(grade);
    }
  }
  return map;
}

module.exports = { cyrb53, clean, MIN_CHARS, CATEGORIES, textsForUnit, hashesForGrade, hashGradeMap };
