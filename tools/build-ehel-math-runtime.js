// Build Ehel Academy Mathematics runtime packages for every stage from the
// extracted content model. Generalized from build-ehel-grade2-math-runtime.js;
// grade 2 remains the untouched reference implementation.
// Usage: node tools/build-ehel-math-runtime.js [grade ...]   (default: 1 3 4 5 6 7 8)

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelPath = path.join(root, "outputs", "019f6433-3b5b-7513-8de4-dfd68b782812", "math-content-model.json");
const mathRoot = path.join(root, "src", "prototypes", "ehel-academy", "mathematics");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

const grades = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [1, 3, 4, 5, 6, 7, 8];

const tidy = (value = "") => String(value).replace(/�/g, "–").replace(/\s+/g, " ").trim();
const slug = (value = "") => tidy(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sentence = (value = "", max = 250) => {
  const text = tidy(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
};

const EMPTY_DOC = { blocks: [], source_file: "(not provided)" };

function buildGrade(grade) {
  const source = model.grades[String(grade)];
  if (!source) throw new Error(`Grade ${grade} missing from the content model.`);
  const stageId = `s${String(grade).padStart(2, "0")}`;
  const stageLabel = `Stage ${grade}`;
  const contentPackage = `Ehel-Academy-Mathematics-Grade-${grade}-Content-Package.xlsx`;
  const gradeDir = path.join(mathRoot, `grade-${grade}`);
  const unitDir = path.join(gradeDir, "data", "units");

  const docFor = (unit, type) => source.documents.find((doc) => doc.unit === unit && doc.document_type === type) || EMPTY_DOC;
  const blocksForSection = (doc, section) => doc.blocks.filter((block) => block.section === section && block.content_kind !== "Heading");

  function objectiveList(lesson) {
    const texts = lesson.blocks.map((block) => tidy(block.text));
    const start = texts.findIndex((text) => /^By the end of this unit/i.test(text));
    const end = texts.findIndex((text, index) => index > start && /^Key Mathematical Terms/i.test(text));
    const list = texts.slice(start + 1, end > start ? end : start + 12)
      .filter((text) => text.length > 20 && !/^By the end/i.test(text))
      .slice(0, 10);
    if (list.length) return list;
    return texts
      .filter((text) => /^(count|read|write|use|solve|compare|order|measure|identify|describe|recognise|recognize|estimate|add|subtract|multiply|divide|tell|draw|explain)\b/i.test(text) && text.length > 20)
      .slice(0, 8);
  }

  function conceptList(lesson, rules, unitTitle) {
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
    if (!concepts.length) {
      const paragraphs = lesson.blocks.map((b) => tidy(b.text)).filter((text) => text.length > 80).slice(0, 6);
      paragraphs.forEach((text, index) => concepts.push({
        id: `concept-${index + 1}-${slug(unitTitle)}-${index + 1}`,
        title: sentence(text, 60),
        explanation: sentence(text, 520),
        example: sentence(paragraphs[(index + 1) % paragraphs.length] || text, 220),
      }));
    }
    return concepts.slice(0, 6);
  }

  function referenceData(reference, lesson) {
    let rules = blocksForSection(reference, "Key Rules").map((block, index) => {
      const text = tidy(block.text).replace(/^⭐\s*/, "");
      const match = text.match(/^(.{3,55}?Rule)\s+/i);
      return { title: match ? match[1] : `Key rule ${index + 1}`, text: match ? text.slice(match[0].length) : text };
    }).filter((item) => item.text.length > 15);

    const vocabulary = blocksForSection(reference, "Vocabulary Glossary").map((block) => tidy(block.text));
    const vocabularyStart = Math.max(vocabulary.findIndex((text) => /^Meaning$/i.test(text)) + 1, 2);
    let terms = [];
    for (let index = vocabularyStart; index + 1 < vocabulary.length; index += 2) {
      if (vocabulary[index].length < 80 && vocabulary[index + 1].length < 220) terms.push([vocabulary[index], vocabulary[index + 1]]);
    }

    const mistakesRaw = blocksForSection(reference, "Common Mistakes Table").map((block) => tidy(block.text));
    const firstMistake = Math.max(mistakesRaw.findIndex((text) => /^Correct approach$/i.test(text)) + 1, 3);
    const commonMistakes = [];
    for (let index = firstMistake; index + 2 < mistakesRaw.length; index += 3) commonMistakes.push([mistakesRaw[index], mistakesRaw[index + 2]]);

    // Grade packages without a Reference document fall back to the lesson's
    // vocabulary table (e.g. "Key Vocabulary to Model": Word | Meaning | Example).
    if (!terms.length) {
      const vocabCells = lesson.blocks.filter((block) =>
        /key vocabulary|key mathematical terms/i.test(block.section)
        && block.block_type === "Table cell" && block.table_row > 1);
      const byRow = new Map();
      for (const cell of vocabCells) {
        if (!byRow.has(cell.table_row)) byRow.set(cell.table_row, {});
        byRow.get(cell.table_row)[cell.table_col] = tidy(cell.text);
      }
      for (const row of byRow.values()) {
        if (row[1] && row[2] && row[1].length < 80 && row[2].length < 220 && terms.length < 12) terms.push([row[1], row[2]]);
      }
    }
    if (!rules.length) {
      rules = lesson.blocks.map((block) => tidy(block.text))
        .filter((text) => /^remember\b|rule\b/i.test(text) && text.length > 25)
        .slice(0, 6)
        .map((text, index) => ({ title: `Key idea ${index + 1}`, text: text.replace(/^Remember[:!]?\s*/i, "") }));
    }
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
    const levels = ["Warm-up", "Core", "Challenge", "Extension"];
    const sections = [...new Set(practice.blocks.map((block) => block.section))]
      .filter((section) => /^Section\s+\d+/i.test(section));
    const items = [];
    sections.slice(0, 4).forEach((section, sectionIndex) => {
      const tasks = blocksForSection(practice, section)
        .filter((block) => block.content_kind !== "Answer guidance")
        .map((block) => tidy(block.text)).filter((text) => text.length > 8);
      const answers = answerGuidance(practice, sectionIndex + 1);
      tasks.forEach((prompt, index) => items.push({
        id: `p${String(items.length + 1).padStart(2, "0")}`,
        level: levels[sectionIndex] || "Core",
        prompt,
        answer: sentence(answers[index] || `Use the ${section.toLowerCase()} guidance and explain each step.`, 300),
        hint: sectionIndex < 2 ? "Represent the information, name the rule, then solve one step at a time." : "Identify the key mathematical idea before calculating or explaining.",
      }));
    });
    if (!items.length) {
      practice.blocks.filter((block) => block.content_kind === "Task").slice(0, 12).forEach((block, index) => items.push({
        id: `p${String(index + 1).padStart(2, "0")}`,
        level: levels[Math.floor(index / 3) % 4],
        prompt: tidy(block.text),
        answer: "Work through the task and explain each step to your teacher or tutor.",
        hint: "Represent the information, name the rule, then solve one step at a time.",
      }));
    }
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
      examples.push({ id: `we${String(examples.length + 1).padStart(2, "0")}`, outcomeId: `lo${String(examples.length % 8 + 1).padStart(2, "0")}`, difficulty: "Basic", title: `Guided example ${examples.length + 1}`, prompt: item.prompt, solution: item.answer });
    }
    return examples.slice(0, 12).map((item, index) => ({ ...item, difficulty: index < 4 ? "Basic" : index < 8 ? "Intermediate" : "Challenge" }));
  }

  function activityData(activities) {
    const headings = activities.blocks.filter((block) => /^Activity\s+\d+:/i.test(tidy(block.text)));
    const list = headings.map((heading) => {
      const body = blocksForSection(activities, heading.section).map((block) => tidy(block.text)).filter((text) => text.length > 5 && !/Ask Your AI Tutor|Reflection/i.test(text));
      return { title: tidy(heading.text).replace(/^Activity\s+\d+:\s*/i, ""), materials: (body.shift() || "Paper, pencil and familiar household objects").replace(/^You need:\s*/i, ""), steps: body.slice(0, 5) };
    }).slice(0, 6);
    if (!list.length) list.push({ title: "Practise together", materials: "Paper, pencil and familiar household objects", steps: ["Choose one idea from this unit.", "Build or draw a model of it.", "Explain your model to a family member.", "Write one question of your own and solve it."] });
    return list;
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
    const reference = referenceData(referenceDoc, lesson);
    const practice = practiceData(practiceDoc);
    const workedExamples = workedExampleData(lesson, practice);
    const concepts = conceptList(lesson, reference.rules, unitMeta.title);
    const outcomes = objectiveList(lesson);
    const methods = methodList(referenceDoc, workedExamples);
    const assessment = assessmentData(reference, unitNo);
    const overview = lesson.blocks.map((block) => tidy(block.text)).find((text, index) => index > 2 && text.length > 180 && !/self-paced/i.test(text)) || `Explore ${unitMeta.title} through concepts, models, methods and real-life practice.`;
    const explorations = practice.slice(0, 6).map((item, index) => ({ id: `explore-${index + 1}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Discover" : "Explore", title: concepts[index % Math.max(1, concepts.length)]?.title || `Unit investigation ${index + 1}`, context: sentence(concepts[index % Math.max(1, concepts.length)]?.explanation || overview, 260), prompt: item.prompt, answer: item.answer, modelType: `model-${index + 1}`, hint: item.hint, explanation: item.answer }));
    const visualModels = concepts.map((concept, index) => ({ id: `model-${index + 1}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, title: concept.title, modelType: `concept-model-${index + 1}`, purpose: sentence(concept.explanation, 220), defaultNumber: null }));
    const realProblems = practice.filter((item) => item.level === "Extension").slice(0, 6).map((item, index) => ({ id: `rp${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", context: ["Home", "Market", "Travel", "School", "Community", "Design"][index], prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer }));
    while (realProblems.length < 6 && practice.length) {
      const item = practice[(realProblems.length + 6) % practice.length];
      realProblems.push({ id: `rp${String(realProblems.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", context: "Daily life", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer });
    }
    const reasoningPrompts = practice.filter((item) => item.level === "Challenge").slice(0, 6).map((item, index) => ({ id: `reason${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", responseMode: "text", prompt: item.prompt, keyIdeas: reference.terms.slice(index, index + 3).map((term) => term[0]), modelAnswer: item.answer }));
    while (reasoningPrompts.length < 6 && concepts.length) {
      const concept = concepts[reasoningPrompts.length % concepts.length];
      reasoningPrompts.push({ id: `reason${String(reasoningPrompts.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", responseMode: "text", prompt: `Explain the key idea in ${concept.title}.`, keyIdeas: reference.terms.slice(0, 3).map((term) => term[0]), modelAnswer: concept.explanation });
    }
    return {
      schemaVersion: "Ehel Mathematics Runtime v1.1",
      generatedAt: new Date().toISOString(),
      stage: { id: stageId, label: stageLabel }, subject: "Mathematics",
      term: { id: `t0${unitMeta.term}`, label: `Term ${unitMeta.term}` },
      unit: { unitId: unitMeta.unit_id, unitNo, unitTitle: unitMeta.title, unitOverview: sentence(overview, 760), learningPath: ["Preview the goals and core ideas", "Explore concepts and visual models", "Learn methods and study worked examples", "Complete guided practice, activities and games", "Apply, explain and complete the Unit Challenge"], reviewStatus: "Curriculum review required" },
      provenance: { contentPackage, sourceArchive: source.metadata.source_archive, sourceDocuments: [lesson, activitiesDoc, practiceDoc, referenceDoc].filter((doc) => doc !== EMPTY_DOC).map((doc) => doc.source_file), sourceBlockCount: unitMeta.source_block_count, transformation: `Structured directly from the standardized Cambridge ${stageLabel} workbook source rows for screen presentation.`, reviewStatus: unitMeta.review_status },
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
  const warnings = [];
  for (const unitMeta of source.units) {
    const runtime = buildUnit(unitMeta);
    for (const key of ["outcomes", "concepts", "practice", "workedExamples"]) {
      if (!runtime[key] || !runtime[key].length) warnings.push(`grade ${grade} unit ${unitMeta.unit}: empty ${key}`);
    }
    fs.writeFileSync(path.join(unitDir, `unit-${unitMeta.unit}.json`), `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
  }

  const manifest = {
    schemaVersion: "Ehel Mathematics Course Manifest v1.0",
    stage: { id: stageId, label: stageLabel },
    subject: "Mathematics",
    defaultUnit: 1,
    sourcePackage: contentPackage,
    packageReviewStatus: "Imported - curriculum review required",
    units: source.units.map((unit) => ({
      number: unit.unit,
      id: unit.unit_id,
      termId: `t0${unit.term}`,
      title: unit.title,
      data: `./data/units/unit-${unit.unit}.json`,
      sourceDocumentCount: unit.source_document_count,
      implementationStatus: "Complete runtime package",
      reviewStatus: unit.review_status,
    })),
  };
  fs.writeFileSync(path.join(gradeDir, "data", "course-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const allUnits = manifest.units.map((unit) => JSON.parse(fs.readFileSync(path.join(unitDir, `unit-${unit.number}.json`), "utf8")));
  const capstoneQuestions = allUnits.flatMap((unit) => unit.assessment.questions.slice(0, 2).map((question, index) => ({
    ...question,
    id: `cap-u${String(unit.unit.unitNo).padStart(2, "0")}-q${index + 1}`,
    unitNo: unit.unit.unitNo,
    unitTitle: unit.unit.unitTitle,
  })));
  const termUnits = (term) => manifest.units.filter((unit) => unit.termId === `t0${term}`).map((unit) => unit.number);
  const allUnitNumbers = manifest.units.map((unit) => unit.number);
  const gradeCapstone = {
    schemaVersion: "Ehel Mathematics Stage Capstone v1.0",
    stage: { id: stageId, label: stageLabel },
    title: `Plan a ${stageLabel} Mathematics Exhibition`,
    overview: `Bring together everything from ${stageLabel} Mathematics to design a mathematics exhibition that teaches visitors the most important ideas from this stage.`,
    project: {
      drivingQuestion: `How can we use the mathematics from ${stageLabel} to plan a clear, accurate and welcoming exhibition for our school or community?`,
      finalProduct: "Create an exhibition plan with labelled displays, a schedule, a budget, a visitor survey with a data display, and a short explanation of your mathematical decisions.",
      stages: [
        { id: "foundations", title: "1. Term 1 foundations display", units: termUnits(1), prompt: `Choose the two most important ideas from Term 1 (Units ${termUnits(1).join(", ")}). Build a display that teaches each idea with a model, an example and a check question.`, evidence: "Two labelled displays with models, examples and check questions" },
        { id: "applications", title: "2. Term 2 applications corner", units: termUnits(2), prompt: `Design an activity corner where visitors use Term 2 skills (Units ${termUnits(2).join(", ")}) to solve one real problem, showing every step of the method.`, evidence: "A worked real problem with each method step shown" },
        { id: "connections", title: "3. Term 3 connections wall", units: termUnits(3), prompt: `Create a connections wall that links Term 3 ideas (Units ${termUnits(3).join(", ")}) to earlier units, with at least three labelled connections.`, evidence: "A connections wall with three labelled links between units" },
        { id: "present", title: "4. Present and explain", units: allUnitNumbers, prompt: "Present your exhibition plan. Explain at least three mathematical choices, check that your answers are sensible and identify one improvement you would make.", evidence: "Spoken, written or recorded mathematical explanation" },
      ],
      evidenceChecklist: ["Two foundation displays with models", "A worked real problem with method steps", "A connections wall with three links", "A schedule and budget for the exhibition", "A survey with organised data display", "A mathematical explanation and reflection"],
      rubric: [
        { criterion: "Mathematical accuracy", secure: "Calculations, measures, shapes, data and models are accurate and checked." },
        { criterion: "Connected understanding", secure: `The plan connects ideas from several ${stageLabel} units for a clear purpose.` },
        { criterion: "Models and representations", secure: "Labels, diagrams, tables or charts make the mathematics visible." },
        { criterion: "Reasoning and communication", secure: "Decisions are explained using appropriate mathematical words and evidence." },
      ],
    },
    quiz: { passPercent: 80, questions: capstoneQuestions },
    reviewStatus: "Curriculum review required",
  };
  fs.writeFileSync(path.join(gradeDir, "data", "grade-capstone.json"), `${JSON.stringify(gradeCapstone, null, 2)}\n`, "utf8");

  const indexHtml = `<!doctype html>
<html lang="en" data-stage="${grade}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening ${stageLabel} Mathematics</title></head>
<body><p>Opening the shared Mathematics course…</p><script type="module" src="../shared/grade-redirect.js"></script></body>
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
