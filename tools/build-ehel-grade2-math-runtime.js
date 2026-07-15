const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelPath = path.join(root, "outputs", "019f6433-3b5b-7513-8de4-dfd68b782812", "math-content-model.json");
const unitDir = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "grade-2", "data", "units");
const manifestPath = path.join(root, "src", "prototypes", "ehel-academy", "mathematics", "grade-2", "data", "course-manifest.json");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
const source = model.stages?.["2"] || model.grades["2"];

const tidy = (value = "") => String(value).replace(/�/g, "–").replace(/\s+/g, " ").trim();
const slug = (value = "") => tidy(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sentence = (value = "", max = 250) => {
  const text = tidy(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
};

function docFor(unit, type) {
  return source.documents.find((doc) => doc.unit === unit && doc.document_type === type);
}

function blocksForSection(doc, section) {
  return doc.blocks.filter((block) => block.section === section && block.content_kind !== "Heading");
}

function objectiveList(lesson) {
  const texts = lesson.blocks.map((block) => tidy(block.text));
  const start = texts.findIndex((text) => /^By the end of this unit/i.test(text));
  const end = texts.findIndex((text, index) => index > start && /^Key Mathematical Terms/i.test(text));
  return texts.slice(start + 1, end > start ? end : start + 12)
    .filter((text) => text.length > 20 && !/^By the end/i.test(text))
    .slice(0, 10);
}

function conceptList(lesson, rules) {
  const starts = lesson.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => /^Concept\s+\d+\s*:/i.test(tidy(block.text)));
  const concepts = starts.map(({ block, index }, position) => {
    const end = starts[position + 1]?.index ?? lesson.blocks.findIndex((item, itemIndex) => itemIndex > index && /^Guided Practice/i.test(tidy(item.text)));
    const body = lesson.blocks.slice(index + 1, end > index ? end : index + 9)
      .map((item) => tidy(item.text))
      .filter((text) => text.length > 35 && !/Ask Your AI Tutor|Remember/i.test(text));
    const title = tidy(block.text).replace(/^Concept\s+\d+\s*:\s*/i, "");
    return {
      id: `concept-${position + 1}-${slug(title)}`,
      title,
      explanation: sentence(body.slice(0, 2).join(" "), 520),
      example: sentence(body[2] || body[0] || rules[position % Math.max(1, rules.length)]?.text || title, 220),
    };
  });
  while (concepts.length < 6 && rules.length) {
    const rule = rules[concepts.length % rules.length];
    concepts.push({ id: `concept-rule-${concepts.length + 1}`, title: rule.title, explanation: rule.text, example: rule.text });
  }
  return concepts.slice(0, 6);
}

function referenceData(reference) {
  const rules = blocksForSection(reference, "Key Rules").map((block, index) => {
    const text = tidy(block.text).replace(/^⭐\s*/, "");
    const match = text.match(/^(.{3,55}?Rule)\s+/i);
    return { title: match ? match[1] : `Key rule ${index + 1}`, text: match ? text.slice(match[0].length) : text };
  }).filter((item) => item.text.length > 15);

  const vocabulary = blocksForSection(reference, "Vocabulary Glossary").map((block) => tidy(block.text));
  const vocabularyStart = Math.max(vocabulary.findIndex((text) => /^Meaning$/i.test(text)) + 1, 2);
  const terms = [];
  for (let index = vocabularyStart; index + 1 < vocabulary.length; index += 2) {
    if (vocabulary[index].length < 80 && vocabulary[index + 1].length < 220) terms.push([vocabulary[index], vocabulary[index + 1]]);
  }

  const mistakesRaw = blocksForSection(reference, "Common Mistakes Table").map((block) => tidy(block.text));
  const firstMistake = Math.max(mistakesRaw.findIndex((text) => /^Correct approach$/i.test(text)) + 1, 3);
  const commonMistakes = [];
  for (let index = firstMistake; index + 2 < mistakesRaw.length; index += 3) commonMistakes.push([mistakesRaw[index], mistakesRaw[index + 2]]);
  return { rules: rules.slice(0, 6), terms: terms.slice(0, 12), commonMistakes: commonMistakes.slice(0, 6) };
}

function methodList(reference, examples) {
  const blocks = blocksForSection(reference, "Step-by-Step Methods");
  const methods = [];
  let current = null;
  for (const block of blocks) {
    const text = tidy(block.text);
    if (block.content_kind === "List item" && current) current.steps.push(text);
    else if (text.length > 4) {
      if (current?.steps.length) methods.push(current);
      current = { id: `method-${methods.length + 1}`, outcomeId: `lo${String(methods.length + 1).padStart(2, "0")}`, difficulty: "Core", title: text, example: examples[methods.length]?.prompt || text, steps: [] };
    }
  }
  if (current?.steps.length) methods.push(current);
  while (methods.length < 6 && examples.length) {
    const example = examples[methods.length % examples.length];
    methods.push({ id: `method-${methods.length + 1}`, outcomeId: example.outcomeId, difficulty: methods.length < 3 ? "Core" : "Challenge", title: example.title, example: example.prompt, steps: tidy(example.solution).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4) });
  }
  for (const method of methods) while (method.steps.length < 3) method.steps.push(`Check the ${method.title.toLowerCase()} result carefully.`);
  return methods.slice(0, 6);
}

function answerGuidance(practice, sectionNumber) {
  const block = practice.blocks.find((item) => item.content_kind === "Answer guidance" && new RegExp(`^Section ${sectionNumber}:`, "i").test(tidy(item.text)));
  if (!block) return [];
  return tidy(block.text).replace(new RegExp(`^Section ${sectionNumber}:\\s*`, "i"), "").split(/\s+\d+\)\s*/).filter(Boolean);
}

function practiceData(practice) {
  const sectionNames = ["Section 1: Warm-Up", "Section 2: Core Practice", "Section 3: Challenge", "Section 4: Extension – Mixed Review (Word Problems)"];
  const levels = ["Warm-up", "Core", "Challenge", "Extension"];
  const items = [];
  sectionNames.forEach((section, sectionIndex) => {
    const tasks = blocksForSection(practice, section).map((block) => tidy(block.text)).filter((text) => text.length > 8);
    const answers = answerGuidance(practice, sectionIndex + 1);
    tasks.forEach((prompt, index) => items.push({
      id: `p${String(items.length + 1).padStart(2, "0")}`,
      level: levels[sectionIndex],
      prompt,
      answer: sentence(answers[index] || `Use the ${section.toLowerCase()} guidance and explain each step.`, 300),
      hint: sectionIndex < 2 ? "Represent the information, name the rule, then solve one step at a time." : "Identify the key mathematical idea before calculating or explaining.",
    }));
  });
  return items;
}

function workedExampleData(lesson, practiceItems) {
  const headings = lesson.blocks.filter((block) => /^Worked Example\s+\d+/i.test(tidy(block.text)));
  const examples = headings.map((heading, index) => {
    const body = blocksForSection(lesson, heading.section).map((block) => tidy(block.text)).filter((text) => text.length > 4);
    const title = tidy(heading.text).replace(/^Worked Example\s+\d+\s*:\s*/i, "");
    return {
      id: `we${String(index + 1).padStart(2, "0")}`,
      outcomeId: `lo${String(index % 8 + 1).padStart(2, "0")}`,
      difficulty: index < 4 ? "Basic" : index < 8 ? "Intermediate" : "Challenge",
      title,
      prompt: sentence(body[0] || title, 260),
      solution: sentence(body.slice(1).join(" ") || body[0] || title, 520),
    };
  });
  while (examples.length < 12 && practiceItems.length) {
    const item = practiceItems[examples.length % practiceItems.length];
    examples.push({ id: `we${String(examples.length + 1).padStart(2, "0")}`, outcomeId: `lo${String(examples.length % 8 + 1).padStart(2, "0")}`, difficulty: examples.length < 4 ? "Basic" : examples.length < 8 ? "Intermediate" : "Challenge", title: `Guided example ${examples.length + 1}`, prompt: item.prompt, solution: item.answer });
  }
  return examples.slice(0, 12).map((item, index) => ({ ...item, difficulty: index < 4 ? "Basic" : index < 8 ? "Intermediate" : "Challenge" }));
}

function activityData(activities) {
  const headings = activities.blocks.filter((block) => /^Activity\s+\d+:/i.test(tidy(block.text)));
  return headings.map((heading) => {
    const body = blocksForSection(activities, heading.section).map((block) => tidy(block.text)).filter((text) => text.length > 5 && !/Ask Your AI Tutor|Reflection/i.test(text));
    return { title: tidy(heading.text).replace(/^Activity\s+\d+:\s*/i, ""), materials: (body.shift() || "Paper, pencil and familiar household objects").replace(/^You need:\s*/i, ""), steps: body.slice(0, 5) };
  }).slice(0, 6);
}

function assessmentData(reference, unitNo) {
  const terms = reference.terms.length >= 4 ? reference.terms : [["Mathematics", "Using numbers, shapes, measures and patterns"], ["Model", "A way to show an idea"], ["Rule", "A mathematical relationship"], ["Check", "Confirm that an answer makes sense"]];
  const questions = [];
  for (let index = 0; index < 12; index += 1) {
    const entry = terms[index % terms.length];
    const reverse = index >= Math.min(terms.length, 6);
    const pool = terms.filter((item) => item !== entry).map((item) => reverse ? item[0] : item[1]);
    const answer = reverse ? entry[0] : entry[1];
    const distractors = [];
    for (let offset = 0; offset < pool.length && distractors.length < 3; offset += 1) {
      const candidate = pool[(index + offset) % pool.length];
      if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
    }
    const options = [answer, ...distractors];
    while (options.length < 4) options.push(`Not this ${reverse ? "term" : "meaning"}`);
    questions.push({ id: `q${String(index + 1).padStart(2, "0")}`, type: index < 4 ? "Concept" : index < 8 ? "Application" : "Reasoning", outcomeId: `lo${String(index % 8 + 1).padStart(2, "0")}`, difficulty: index < 4 ? "Basic" : index < 9 ? "Core" : "Challenge", question: reverse ? `Which term matches this meaning: ${entry[1]}?` : `What does “${entry[0]}” mean?`, options: [...new Set(options)].slice(0, 4), answer, hint: `Use the Unit ${unitNo} Math Words & Symbols reference.`, explanation: `${entry[0]} means ${entry[1]}.` });
  }
  return { passPercent: 80, questions };
}

function gameData(assessment, terms, unitNo) {
  const names = ["Quick Match", "Concept Quest", "Model Detective", "Rule Runner", "Vocabulary Vault", "Challenge Cards", "Think Fast", "Explain It", "Real-Life Round", "Spot the Error", "Mastery Mix", "Unit Champion"];
  return names.map((name, index) => ({
    id: `u${unitNo}-game-${index + 1}`,
    icon: ["?", "★", "◫", "→", "Σ", "◇", "⚡", "☁", "⌂", "!", "≡", "T"][index],
    skill: terms[index % Math.max(1, terms.length)]?.[0] || `Unit ${unitNo} skill`,
    title: `${name}: ${terms[index % Math.max(1, terms.length)]?.[0] || "Mathematics"}`,
    description: `Practise ${terms[index % Math.max(1, terms.length)]?.[0]?.toLowerCase() || "the unit ideas"} through four short challenges.`,
    type: "choice",
    rounds: Array.from({ length: 4 }, (_, round) => {
      const question = assessment.questions[(index + round * 3) % assessment.questions.length];
      return { prompt: question.question, choices: question.options, answer: question.answer, clue: question.hint, explanation: question.explanation };
    }),
  }));
}

function buildUnit(unitMeta) {
  const unitNo = unitMeta.unit;
  const lesson = docFor(unitNo, "Lesson");
  const practiceDoc = docFor(unitNo, "Practice");
  const activitiesDoc = docFor(unitNo, "Activities");
  const referenceDoc = docFor(unitNo, "Reference");
  const reference = referenceData(referenceDoc);
  const practice = practiceData(practiceDoc);
  const workedExamples = workedExampleData(lesson, practice);
  const concepts = conceptList(lesson, reference.rules);
  const outcomes = objectiveList(lesson);
  const methods = methodList(referenceDoc, workedExamples);
  const assessment = assessmentData(reference, unitNo);
  const overview = lesson.blocks.map((block) => tidy(block.text)).find((text, index) => index > 2 && text.length > 180 && !/self-paced/i.test(text)) || `Explore ${unitMeta.title} through concepts, models, methods and real-life practice.`;
  const explorations = practice.slice(0, 6).map((item, index) => ({ id: `explore-${index + 1}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Discover" : "Explore", title: concepts[index % concepts.length]?.title || `Unit investigation ${index + 1}`, context: sentence(concepts[index % concepts.length]?.explanation || overview, 260), prompt: item.prompt, answer: item.answer, modelType: `model-${index + 1}`, hint: item.hint, explanation: item.answer }));
  const visualModels = concepts.map((concept, index) => ({ id: `model-${index + 1}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, title: concept.title, modelType: `concept-model-${index + 1}`, purpose: sentence(concept.explanation, 220), defaultNumber: null }));
  const realProblems = practice.filter((item) => item.level === "Extension").slice(0, 6).map((item, index) => ({ id: `rp${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", context: ["Home", "Market", "Travel", "School", "Community", "Design"][index], prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer }));
  while (realProblems.length < 6) {
    const item = practice[(realProblems.length + 6) % practice.length];
    realProblems.push({ id: `rp${String(realProblems.length + 1).padStart(2, "0")}`, outcomeId: `lo01`, difficulty: "Core", context: "Daily life", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer });
  }
  const reasoningPrompts = practice.filter((item) => item.level === "Challenge").slice(0, 6).map((item, index) => ({ id: `reason${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", responseMode: "text", prompt: item.prompt, keyIdeas: reference.terms.slice(index, index + 3).map((term) => term[0]), modelAnswer: item.answer }));
  while (reasoningPrompts.length < 6) {
    const concept = concepts[reasoningPrompts.length % concepts.length];
    reasoningPrompts.push({ id: `reason${String(reasoningPrompts.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", responseMode: "text", prompt: `Explain the key idea in ${concept.title}.`, keyIdeas: reference.terms.slice(0, 3).map((term) => term[0]), modelAnswer: concept.explanation });
  }
  return {
    schemaVersion: "Ehel Mathematics Runtime v1.1",
    generatedAt: new Date().toISOString(),
    stage: { id: "s02", label: "Stage 2" }, subject: "Mathematics",
    term: { id: `t0${unitMeta.term}`, label: `Term ${unitMeta.term}` },
    unit: { unitId: unitMeta.unit_id, unitNo, unitTitle: unitMeta.title, unitOverview: sentence(overview, 760), learningPath: ["Preview the goals and core ideas", "Explore concepts and visual models", "Learn methods and study worked examples", "Complete guided practice, activities and games", "Apply, explain and complete the Unit Challenge"], reviewStatus: "Curriculum review required" },
    provenance: { contentPackage: "Ehel-Academy-Mathematics-Stage-2-Content-Package.xlsx", sourceArchive: source.metadata.source_archive, sourceDocuments: [lesson, activitiesDoc, practiceDoc, referenceDoc].map((doc) => doc.source_file), sourceBlockCount: unitMeta.source_block_count, transformation: "Structured directly from the standardized Cambridge Stage 2 workbook source rows for screen presentation.", reviewStatus: unitMeta.review_status },
    media: { lectureStatus: "Video pending", lectureVideo: null, poster: null },
    outcomes, concepts, explorations, visualModels, methods, workedExamples,
    practice: practice.slice(0, 12), activities: activityData(activitiesDoc), reference,
    fluency: practice.slice(0, 12).map((item, index) => ({ id: `fl${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 4 ? "Round 1" : index < 8 ? "Round 2" : "Round 3", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer })),
    realProblems, reasoningPrompts, assessment,
    games: { masteryScore: 3, games: gameData(assessment, reference.terms, unitNo) },
    selfAssessment: outcomes.slice(0, 8).map((outcome) => `I can ${outcome.charAt(0).toLowerCase()}${outcome.slice(1)}`),
  };
}

fs.mkdirSync(unitDir, { recursive: true });
for (const unitMeta of source.units.filter((unit) => unit.unit >= 2)) {
  const runtime = buildUnit(unitMeta);
  fs.writeFileSync(path.join(unitDir, `unit-${unitMeta.unit}.json`), `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.units = manifest.units.map((unit) => ({
  ...unit,
  data: `./data/units/unit-${unit.number}.json`,
  implementationStatus: unit.number === 1 ? "Reference implementation" : "Complete runtime package",
}));
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const allUnits = manifest.units.map((unit) => JSON.parse(fs.readFileSync(path.join(unitDir, `unit-${unit.number}.json`), "utf8")));
const capstoneQuestions = allUnits.flatMap((unit) => unit.assessment.questions.slice(0, 2).map((question, index) => ({
  ...question,
  id: `cap-u${String(unit.unit.unitNo).padStart(2, "0")}-q${index + 1}`,
  unitNo: unit.unit.unitNo,
  unitTitle: unit.unit.unitTitle,
})));
const gradeCapstone = {
  schemaVersion: "Ehel Mathematics Stage Capstone v1.0",
  stage: { id: "s02", label: "Stage 2" },
  title: "Plan a Stage 2 Mathematics Fair",
  overview: "Use number, geometry, measure, money, time, statistics, pattern, probability, symmetry and position to design a welcoming mathematics fair for your school or community.",
  project: {
    drivingQuestion: "How can we use mathematics to plan a fun, fair and well-organized Stage 2 Mathematics Fair?",
    finalProduct: "Create a labelled fair plan with a floor map, schedule, budget, visitor survey, data display and a short explanation of your mathematical decisions.",
    stages: [
      { id: "plan", title: "1. Number and pattern plan", units: [1, 5, 8, 10, 14], prompt: "Choose a number of visitors up to 100. Show the number in at least two ways, organise visitors into groups and create a repeating pattern for tickets or decorations.", evidence: "Visitor number model, grouping calculation and repeating pattern" },
      { id: "space", title: "2. Shape and space design", units: [2, 3, 11, 13, 15], prompt: "Draw a floor map using 2D shapes, measured lengths, symmetry, turns and position words. Label how visitors move safely between activities.", evidence: "Measured floor map with shapes, symmetry and directions" },
      { id: "schedule", title: "3. Time schedule", units: [7, 12], prompt: "Create a timetable with opening time, activity times and closing time. Include clocks and explain how long at least two activities last.", evidence: "Fair timetable with clock faces and durations" },
      { id: "budget", title: "4. Money plan", units: [6, 10], prompt: "Choose prices for three fair items. Show different coin combinations, calculate a total and work out one amount of change.", evidence: "Price list, coin models, total and change calculation" },
      { id: "data", title: "5. Survey and data display", units: [4, 9, 14], prompt: "Ask which activity visitors would prefer. Record sample results in a tally or table, display them in a chart and describe what is most, least, likely or unlikely.", evidence: "Survey question, organised data, chart and conclusion" },
      { id: "present", title: "6. Present and explain", units: [1, 2, 4, 6, 7, 14, 15], prompt: "Present your fair plan. Explain at least three mathematical choices, check that your answers are sensible and identify one improvement you would make.", evidence: "Spoken, written or recorded mathematical explanation" },
    ],
    evidenceChecklist: ["Number and grouping model", "Pattern or probability example", "Measured shape-and-position map", "Time schedule", "Money budget", "Survey and data display", "Mathematical explanation and reflection"],
    rubric: [
      { criterion: "Mathematical accuracy", secure: "Calculations, measures, shapes, clocks, money and data are accurate and checked." },
      { criterion: "Connected understanding", secure: "The plan connects ideas from several Stage 2 units for a clear purpose." },
      { criterion: "Models and representations", secure: "Labels, diagrams, clocks, coins, tables or charts make the mathematics visible." },
      { criterion: "Reasoning and communication", secure: "Decisions are explained using appropriate mathematical words and evidence." },
    ],
  },
  quiz: { passPercent: 80, questions: capstoneQuestions },
  reviewStatus: "Curriculum review required",
};
fs.writeFileSync(path.join(path.dirname(unitDir), "grade-capstone.json"), `${JSON.stringify(gradeCapstone, null, 2)}\n`, "utf8");
console.log(`Generated ${source.units.length - 1} Stage 2 Mathematics runtime packages and the Stage 2 capstone.`);
